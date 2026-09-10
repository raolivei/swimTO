"""Abstract base class for city-specific swim data sources."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date, time
from typing import Optional


@dataclass
class FacilityData:
    """Normalized facility record produced by any city source."""
    facility_id: str          # slug, globally unique: "{city_slug}-{local_id}"
    name: str
    city: str                 # "Toronto", "Mississauga", etc.
    address: Optional[str] = None
    postal_code: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    has_indoor: bool = True
    has_outdoor: bool = False
    is_free_entry: bool = False
    phone: Optional[str] = None
    website: Optional[str] = None
    source: Optional[str] = None
    # Toronto-specific; None for all other cities
    toronto_location_id: Optional[int] = None
    raw: Optional[dict] = field(default=None, repr=False)


@dataclass
class SessionData:
    """Normalized session record produced by any city source."""
    facility_id: str
    swim_type: str            # matches SwimType enum: LANE_SWIM, LEISURE_SWIM, etc.
    date: date
    start_time: time
    end_time: time
    notes: Optional[str] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    source: Optional[str] = None


class BaseSwimSource(ABC):
    """Interface every city-specific swim data source must implement.

    City sources are registered in ``data-pipeline/config.py`` under
    ``CITY_SOURCES`` and iterated by the pipeline jobs (seed_facilities,
    daily_refresh).

    Facility IDs must be globally unique across cities. Use the convention
    ``{city_slug}-{local_id}`` where ``city_slug`` is the lower-kebab-case
    city name (e.g. ``mississauga``, ``richmond-hill``).
    """

    #: Human-readable city name matching the ``city`` column value.
    city: str

    #: Region for grouping (e.g. "Peel", "York", "Toronto").
    region: str

    @abstractmethod
    def fetch_facilities(self) -> list[FacilityData]:
        """Return all swim facilities for this city.

        Called by ``seed_facilities.py`` and the first run of
        ``daily_refresh.py``. Should not fetch schedule data.
        """

    @abstractmethod
    def fetch_sessions(self, facility_id: str, weeks: int = 4) -> list[SessionData]:
        """Return upcoming drop-in sessions for a single facility.

        ``weeks`` controls how far ahead to look (default 4, matching
        Toronto's ``INGEST_WINDOW_DAYS=56``).
        """
