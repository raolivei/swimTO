"""Regression tests for the GTA multi-city pipeline foundation."""

import sys
from pathlib import Path
from types import SimpleNamespace


PIPELINE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PIPELINE_ROOT))

from config import CITY_SOURCES  # noqa: E402
from models import Facility  # noqa: E402
from sources.base_source import FacilityData  # noqa: E402
from sources.toronto_pools_data import TorontoCuratedSource  # noqa: E402
from jobs import daily_refresh  # noqa: E402


def test_facility_data_keeps_legacy_indoor_flag() -> None:
    facility = FacilityData(
        facility_id="toronto-example",
        name="Example Pool",
        city="Toronto",
        has_indoor=False,
        has_outdoor=True,
    )

    assert facility.is_indoor is False
    assert facility.has_outdoor is True


def test_pipeline_facility_model_has_indexed_city_column() -> None:
    city_column = Facility.__table__.columns["city"]

    assert city_column.default.arg == "Toronto"
    assert city_column.nullable is False
    assert city_column.index is True


def test_curated_toronto_source_normalizes_facilities() -> None:
    source = TorontoCuratedSource()
    facilities = source.fetch_facilities()

    assert facilities
    assert {facility.city for facility in facilities} == {"Toronto"}
    assert source.provides_sessions is False


def test_only_verified_city_sources_are_enabled() -> None:
    assert set(CITY_SOURCES) == {"Toronto", "Mississauga", "Brampton", "Vaughan", "Richmond Hill", "Markham"}


def test_facility_only_source_does_not_touch_sessions(monkeypatch) -> None:
    facility_data = FacilityData(
        facility_id="toronto-example",
        name="Example Pool",
        city="Toronto",
    )

    class FacilityOnlySource:
        city = "Toronto"
        provides_sessions = False

        def fetch_facilities(self):
            return [facility_data]

    existing = SimpleNamespace(city="Toronto")

    class FacilityQuery:
        def filter_by(self, **_kwargs):
            return self

        def first(self):
            return existing

        def filter(self, *_args):
            raise AssertionError("facility-only source attempted a session refresh")

    class FakeSession:
        def query(self, model):
            if model is not Facility:
                raise AssertionError("facility-only source queried sessions")
            return FacilityQuery()

        def commit(self):
            return None

        def rollback(self):
            raise AssertionError("refresh unexpectedly rolled back")

    monkeypatch.setattr(daily_refresh, "CITY_SOURCES", {"Toronto": ["fake_source"]})
    monkeypatch.setattr(
        daily_refresh.importlib,
        "import_module",
        lambda _name: SimpleNamespace(__name__=FacilityOnlySource.__module__, FacilityOnlySource=FacilityOnlySource),
    )

    daily_refresh.refresh_city_data(FakeSession())

    assert existing.city == "Toronto"

