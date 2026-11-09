"""
ActiveNet REST API client — base class for Peel/York region municipalities.

ActiveNet (Active Network / Global Payments) is used by Mississauga and
Richmond Hill for recreation program registration. Canadian sites live at:
  https://anc.ca.apm.activecommunities.com/{site}/rest/

Key findings from live API inspection (2026-07-24):
  - Endpoint is POST-only; GET returns empty body
  - No server-side keyword filtering — must filter client-side
  - Pagination: page_number (1-based), 20 items/page (max enforced server-side)
  - Sessions are recurring ranges: date_range_start/end + days_of_week + time_range
  - Facility identified by location.label (name), not a numeric ID
  - Mississauga slug: "activemississauga" (not "mississauga")
  - Richmond Hill slug: "richmondhill"
"""
import hashlib
import re
from datetime import date, datetime, time, timedelta
from typing import Optional

import requests

try:
    from loguru import logger
except ImportError:
    import logging
    logger = logging.getLogger(__name__)
    logger.success = logger.info  # type: ignore[attr-defined]

from sources.base_source import BaseSwimSource, FacilityData, SessionData


_DAY_MAP = {
    "mon": 0, "tue": 1, "wed": 2, "thu": 3,
    "fri": 4, "sat": 5, "sun": 6,
}


class ActiveNetSource(BaseSwimSource):
    """Base class for municipalities served by the ActiveNet platform.

    Subclasses must set: city, region, SITE_NAME, CITY_SLUG.
    """

    city: str = ""
    region: str = ""
    SITE_NAME: str = ""   # URL slug, e.g. "activemississauga"
    CITY_SLUG: str = ""   # facility_id prefix, e.g. "mississauga"

    _ACTIVENET_BASE = "https://anc.ca.apm.activecommunities.com/{site}/rest"

    SWIM_KEYWORDS = [
        "lane swim", "lap swim", "length swim",
        "public swim", "leisure swim", "family swim",
        "adult leisure", "adult swim", "senior swim",
        "aqua fit", "aquafit", "aquatic fitness",
        "water fitness", "swim fitness",
        "recreational swim", "open swim",
    ]

    SWIM_TYPE_PATTERNS = {
        "LANE_SWIM": [
            r"lane\s+swim", r"lap\s+swim", r"length\s+swim", r"swim\s+fitness",
        ],
        "AQUATIC_FITNESS": [
            r"aqua\s*fit", r"aquatic\s+fitness", r"water\s+fitness",
        ],
        "RECREATIONAL": [
            r"public\s+swim", r"leisure\s+swim", r"family\s+swim",
            r"recreational\s+swim", r"open\s+swim",
        ],
        "ADULT_SWIM": [r"adult\s+swim", r"adult\s+leisure", r"adult\s+only"],
        "SENIOR_SWIM": [r"senior\s+swim", r"senior\s+only", r"50\+\s*swim"],
    }

    def __init__(self, timeout: int = 30) -> None:
        self.timeout = timeout
        self._http = requests.Session()
        self._http.headers.update({
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "swimTO-data-pipeline/1.0 (+https://github.com/raolivei/swimTO)",
        })
        self._base_url = self._ACTIVENET_BASE.format(site=self.SITE_NAME)
        self._activities_cache: Optional[list[dict]] = None
        # Populated by fetch_facilities(); used to reverse-map id → location name
        self._facility_id_to_name: dict[str, str] = {}

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _slugify(name: str) -> str:
        slug = name.lower().strip()
        slug = re.sub(r"[^a-z0-9\s-]", "", slug)
        slug = re.sub(r"\s+", "-", slug)
        return slug.strip("-")

    def _facility_id(self, location_name: str) -> str:
        return f"{self.CITY_SLUG}-{self._slugify(location_name)}"

    def _is_swim_activity(self, name: str) -> bool:
        name_lower = name.lower()
        return any(kw in name_lower for kw in self.SWIM_KEYWORDS)

    def _classify_swim_type(self, name: str) -> str:
        name_lower = name.lower()
        for swim_type, patterns in self.SWIM_TYPE_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, name_lower):
                    return swim_type
        return "OTHER"

    @staticmethod
    def _parse_date(val: Optional[str]) -> Optional[date]:
        if not val:
            return None
        for fmt in ("%Y-%m-%d", "%m/%d/%Y"):
            try:
                return datetime.strptime(val.strip(), fmt).date()
            except (ValueError, TypeError):
                pass
        return None

    @staticmethod
    def _parse_time(val: Optional[str]) -> Optional[time]:
        """Parse '6:00 PM', 'Noon', 'Midnight', '14:30'."""
        if not val:
            return None
        val = val.strip()
        low = val.lower()
        if low == "noon":
            return time(12, 0)
        if low == "midnight":
            return time(0, 0)
        for fmt in ("%I:%M %p", "%I %p", "%H:%M"):
            try:
                return datetime.strptime(val, fmt).time()
            except (ValueError, TypeError):
                pass
        return None

    @staticmethod
    def _parse_time_range(time_range: str) -> tuple[Optional[time], Optional[time]]:
        """Parse '9:00 PM - 10:00 PM' → (time(21,0), time(22,0))."""
        if not time_range:
            return None, None
        parts = time_range.split(" - ", 1)
        if len(parts) != 2:
            return None, None
        start = ActiveNetSource._parse_time(parts[0].strip())
        end = ActiveNetSource._parse_time(parts[1].strip())
        return start, end

    @staticmethod
    def _parse_days_of_week(days_str: str) -> set[int]:
        """Parse 'Mon,Fri' or 'Sun,Sat' → {0, 4} or {6, 5}."""
        result: set[int] = set()
        for part in days_str.split(","):
            key = part.strip().lower()[:3]
            if key in _DAY_MAP:
                result.add(_DAY_MAP[key])
        return result

    # ------------------------------------------------------------------
    # ActiveNet API calls
    # ------------------------------------------------------------------

    def _fetch_page(self, page_number: int) -> dict:
        payload = {"page_number": page_number}
        resp = self._http.post(
            f"{self._base_url}/activities/list",
            json=payload,
            timeout=self.timeout,
        )
        resp.raise_for_status()
        return resp.json()

    def _fetch_all_activities(self) -> list[dict]:
        """Paginate through all pages, filtering swim activities client-side."""
        swim_results: list[dict] = []
        page = 1
        total_pages: Optional[int] = None

        while True:
            try:
                data = self._fetch_page(page)
            except requests.RequestException as exc:
                logger.error(f"[{self.city}] API error at page={page}: {exc}")
                break

            page_info = data.get("headers", {}).get("page_info", {})
            if total_pages is None:
                total_pages = page_info.get("total_page", 1)
                total_rec = page_info.get("total_records", 0)
                logger.info(
                    f"[{self.city}] {total_rec} total activities "
                    f"across {total_pages} pages"
                )

            items = data.get("body", {}).get("activity_items", [])
            if not items:
                break

            swim_batch = [it for it in items if self._is_swim_activity(it.get("name", ""))]
            swim_results.extend(swim_batch)

            if page >= total_pages:
                break
            page += 1

        logger.info(f"[{self.city}] {len(swim_results)} swim activities found")
        return swim_results

    def _get_activities(self) -> list[dict]:
        if self._activities_cache is None:
            self._activities_cache = self._fetch_all_activities()
        return self._activities_cache

    # ------------------------------------------------------------------
    # BaseSwimSource implementation
    # ------------------------------------------------------------------

    def fetch_facilities(self) -> list[FacilityData]:
        logger.info(f"[{self.city}] Deriving facilities from ActiveNet activity feed")
        activities = self._get_activities()

        seen: dict[str, FacilityData] = {}
        self._facility_id_to_name = {}

        for act in activities:
            loc_name = (act.get("location") or {}).get("label", "").strip()
            if not loc_name or loc_name in seen:
                continue
            fid = self._facility_id(loc_name)
            seen[loc_name] = FacilityData(
                facility_id=fid,
                name=loc_name,
                city=self.city,
                has_indoor=True,
                has_outdoor=False,
                is_free_entry=False,
                source=f"{self.CITY_SLUG}_activenet",
            )
            self._facility_id_to_name[fid] = loc_name

        facilities = list(seen.values())
        logger.info(f"[{self.city}] Found {len(facilities)} swim facilities")
        return facilities

    def fetch_sessions(self, facility_id: str, weeks: int = 8) -> list[SessionData]:
        # Ensure facility map is populated
        if not self._facility_id_to_name:
            self.fetch_facilities()

        loc_name = self._facility_id_to_name.get(facility_id)
        if not loc_name:
            logger.warning(f"[{self.city}] No location name for '{facility_id}'")
            return []

        activities = self._get_activities()
        facility_acts = [
            a for a in activities
            if (a.get("location") or {}).get("label", "").strip() == loc_name
        ]

        sessions: list[SessionData] = []
        today = date.today()
        cutoff = today + timedelta(weeks=weeks)

        for act in facility_acts:
            swim_type = self._classify_swim_type(act.get("name", ""))
            start_date = self._parse_date(act.get("date_range_start"))
            end_raw = act.get("date_range_end", "")
            end_date = self._parse_date(end_raw) if end_raw else start_date

            if not (start_date and end_date):
                continue

            start_time, end_time = self._parse_time_range(act.get("time_range", ""))
            if not (start_time and end_time):
                continue

            days = self._parse_days_of_week(act.get("days_of_week", ""))
            if not days:
                # Single-occurrence event — use start_date's weekday
                days = {start_date.weekday()}

            # Expand recurring schedule into individual session dates
            current = max(start_date, today)
            while current <= min(end_date, cutoff):
                if current.weekday() in days:
                    sessions.append(SessionData(
                        facility_id=facility_id,
                        swim_type=swim_type,
                        date=current,
                        start_time=start_time,
                        end_time=end_time,
                        notes=act.get("name"),
                        source=f"{self.CITY_SLUG}_activenet",
                    ))
                current += timedelta(days=1)

        return sessions
