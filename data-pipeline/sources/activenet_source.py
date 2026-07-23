"""
ActiveNet REST API client — base class for Peel/York region municipalities.

ActiveNet (Active Network / Global Payments) is used by Mississauga and
Richmond Hill for recreation program registration. Canadian sites live at:
  https://anc.ca.apm.activecommunities.com/{site}/rest/

Key endpoints:
  GET  /rest/activities/list   — search activities/programs
  GET  /rest/facilities/list   — list recreation facilities

Subclasses must set SITE_NAME (URL slug) and CITY_SLUG (facility_id prefix).
"""
import hashlib
import re
from abc import abstractmethod
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


class ActiveNetSource(BaseSwimSource):
    """Base class for municipalities served by the ActiveNet platform."""

    # Subclasses must define these
    city: str = ""
    region: str = ""
    SITE_NAME: str = ""
    CITY_SLUG: str = ""

    _ACTIVENET_BASE = "https://anc.ca.apm.activecommunities.com/{site}/rest"

    SWIM_KEYWORDS = [
        "lane swim", "lap swim", "length swim",
        "public swim", "leisure swim", "family swim",
        "adult swim", "senior swim",
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
        "ADULT_SWIM": [r"adult\s+swim", r"adult\s+only"],
        "SENIOR_SWIM": [r"senior\s+swim", r"senior\s+only", r"50\+\s*swim"],
    }

    def __init__(self, timeout: int = 30) -> None:
        self.timeout = timeout
        self._http = requests.Session()
        self._http.headers.update({
            "Accept": "application/json",
            "User-Agent": "swimTO-data-pipeline/1.0 (+https://github.com/raolivei/swimTO)",
        })
        self._base_url = self._ACTIVENET_BASE.format(site=self.SITE_NAME)
        # Lazy cache — populated on first _get_activities() call
        self._activities_cache: Optional[list[dict]] = None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _is_swim_activity(self, name: str, category: str = "") -> bool:
        combined = f"{name} {category}".lower()
        return any(kw in combined for kw in self.SWIM_KEYWORDS)

    def _classify_swim_type(self, name: str) -> str:
        name_lower = name.lower()
        for swim_type, patterns in self.SWIM_TYPE_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, name_lower):
                    return swim_type
        return "OTHER"

    def _facility_id(self, local_id) -> str:
        return f"{self.CITY_SLUG}-{local_id}"

    def _local_id_from(self, facility_id: str) -> Optional[int]:
        prefix = f"{self.CITY_SLUG}-"
        if not facility_id.startswith(prefix):
            return None
        try:
            return int(facility_id[len(prefix):])
        except ValueError:
            return None

    @staticmethod
    def _hash(facility_id: str, session_date: date, start_time: time, swim_type: str) -> str:
        content = f"{facility_id}:{session_date}:{start_time}:{swim_type}"
        return hashlib.sha256(content.encode()).hexdigest()

    @staticmethod
    def _parse_date(val: Optional[str]) -> Optional[date]:
        if not val:
            return None
        for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"):
            try:
                return datetime.strptime(val.strip(), fmt).date()
            except (ValueError, TypeError):
                pass
        return None

    @staticmethod
    def _parse_time(val: Optional[str]) -> Optional[time]:
        if not val:
            return None
        val = val.strip()
        for fmt in ("%H:%M:%S", "%H:%M", "%I:%M %p", "%I:%M:%S %p"):
            try:
                return datetime.strptime(val, fmt).time()
            except (ValueError, TypeError):
                pass
        return None

    # ------------------------------------------------------------------
    # ActiveNet API calls
    # ------------------------------------------------------------------

    def _fetch_activities_page(
        self,
        skip: int = 0,
        max_results: int = 100,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> dict:
        params: dict = {
            "activity_keyword": "swim",
            "skip_count": skip,
            "max_result_count": max_results,
        }
        if date_from:
            params["date_from"] = date_from
        if date_to:
            params["date_to"] = date_to

        resp = self._http.get(
            f"{self._base_url}/activities/list",
            params=params,
            timeout=self.timeout,
        )
        resp.raise_for_status()
        return resp.json()

    def _fetch_all_activities(self, weeks: int = 8) -> list[dict]:
        """Paginate through all swim activities for the next `weeks` weeks."""
        today = date.today()
        date_from = today.strftime("%Y-%m-%d")
        date_to = (today + timedelta(weeks=weeks)).strftime("%Y-%m-%d")

        results: list[dict] = []
        skip = 0
        page_size = 100

        while True:
            try:
                page = self._fetch_activities_page(
                    skip=skip,
                    max_results=page_size,
                    date_from=date_from,
                    date_to=date_to,
                )
            except requests.RequestException as exc:
                logger.error(f"[{self.city}] ActiveNet API error (skip={skip}): {exc}")
                break

            batch = page.get("data", {}).get("activity", [])
            if not batch:
                break

            swim_batch = [
                a for a in batch
                if self._is_swim_activity(
                    a.get("activity_name", ""),
                    a.get("activity_category_name", ""),
                )
            ]
            results.extend(swim_batch)
            logger.debug(
                f"[{self.city}] Page skip={skip}: "
                f"{len(swim_batch)}/{len(batch)} swim activities"
            )

            total = page.get("data", {}).get("total_count", 0)
            skip += page_size
            if skip >= total:
                break

        logger.info(f"[{self.city}] Total swim activities fetched: {len(results)}")
        return results

    def _get_activities(self, weeks: int = 8) -> list[dict]:
        """Return cached activity list, fetching once per instance lifetime."""
        if self._activities_cache is None:
            self._activities_cache = self._fetch_all_activities(weeks=weeks)
        return self._activities_cache

    # ------------------------------------------------------------------
    # BaseSwimSource implementation
    # ------------------------------------------------------------------

    def fetch_facilities(self) -> list[FacilityData]:
        """Derive the facility list from the activities feed (no separate endpoint)."""
        logger.info(f"[{self.city}] Fetching facilities via ActiveNet")
        activities = self._get_activities()

        seen: dict = {}
        for act in activities:
            fid = act.get("facility_id") or act.get("location_id")
            if not fid or fid in seen:
                continue
            seen[fid] = FacilityData(
                facility_id=self._facility_id(fid),
                name=act.get("facility_name") or f"{self.city} Facility {fid}",
                city=self.city,
                address=(
                    act.get("location_address")
                    or act.get("facility_address")
                    or act.get("address")
                ),
                postal_code=act.get("postal_code"),
                district=act.get("community_name") or act.get("district"),
                latitude=act.get("latitude") or act.get("lat"),
                longitude=act.get("longitude") or act.get("lng"),
                has_indoor=True,
                has_outdoor=False,
                is_free_entry=False,
                website=(
                    f"https://anc.ca.apm.activecommunities.com/"
                    f"{self.SITE_NAME}/activity/detail/{act.get('activity_id', '')}"
                ),
                source=f"{self.CITY_SLUG}_activenet",
                raw=act,
            )

        facilities = list(seen.values())
        logger.info(f"[{self.city}] Found {len(facilities)} swim facilities")
        return facilities

    def fetch_sessions(self, facility_id: str, weeks: int = 8) -> list[SessionData]:
        """Return upcoming sessions for a single facility."""
        local_id = self._local_id_from(facility_id)
        if local_id is None:
            logger.warning(f"[{self.city}] Cannot parse local_id from '{facility_id}'")
            return []

        activities = self._get_activities(weeks=weeks)
        facility_acts = [
            a for a in activities
            if (a.get("facility_id") or a.get("location_id")) == local_id
        ]

        sessions: list[SessionData] = []
        for act in facility_acts:
            swim_type = self._classify_swim_type(act.get("activity_name", ""))
            for meeting in act.get("meeting_dates", []):
                session_date = self._parse_date(
                    meeting.get("date") or meeting.get("meeting_date")
                )
                start = self._parse_time(
                    meeting.get("begin_time") or meeting.get("start_time")
                )
                end = self._parse_time(meeting.get("end_time"))

                if not (session_date and start and end):
                    continue

                sessions.append(SessionData(
                    facility_id=facility_id,
                    swim_type=swim_type,
                    date=session_date,
                    start_time=start,
                    end_time=end,
                    notes=act.get("activity_name"),
                    source=f"{self.CITY_SLUG}_activenet",
                ))

        return sessions
