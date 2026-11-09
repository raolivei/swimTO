"""Protect existing Toronto identities and metadata during multi-source refresh."""
from dataclasses import replace
from datetime import date, time
from unittest.mock import Mock
from types import SimpleNamespace

import pytest
from sqlalchemy import JSON, Integer, MetaData, create_engine
from sqlalchemy.orm import Session as DatabaseSession

from models import Facility, Session
from jobs import daily_refresh
from sources.base_source import FacilityData, SessionData
from sources.facility_store import upsert_facility
from sources.toronto_drop_in_api import TorontoDropInAPI, TorontoDropInSource
from sources.toronto_parks_json_api import TorontoParksJSONAPI, TorontoParksJSONSource
from sources.toronto_pools_data import TorontoCuratedSource


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    # Same tables and constraints, with SQLite-compatible storage types.
    metadata = MetaData()
    facilities = Facility.__table__.to_metadata(metadata)
    facilities.c.raw.type = JSON()
    sessions = Session.__table__.to_metadata(metadata)
    sessions.c.id.type = Integer()
    metadata.create_all(engine)
    with DatabaseSession(engine) as session:
        yield session
    engine.dispose()


def test_partial_metadata_preserves_coordinates_and_location_id(db):
    original = FacilityData("example", "Example Pool", "Toronto", latitude=43.6,
                            longitude=-79.4, address="123 Example St", toronto_location_id=123)
    upsert_facility(db, original)
    db.commit()
    updated = upsert_facility(db, replace(original, latitude=None, longitude=None,
                                          address="", toronto_location_id=None))
    db.commit()
    assert (updated.latitude, updated.longitude, updated.address, updated.toronto_location_id) == (
        43.6, -79.4, "123 Example St", 123,
    )


def test_duplicate_facility_id_in_another_city_is_rejected(db):
    upsert_facility(db, FacilityData("example", "Example Pool", "Toronto"))
    db.commit()
    with pytest.raises(ValueError, match="collision"):
        upsert_facility(db, FacilityData("example", "Another Pool", "Mississauga"))


def test_open_data_matches_location_ids_to_existing_slugs_and_fetches_once(monkeypatch):
    source = TorontoDropInSource()
    pool = TorontoCuratedSource().fetch_facilities()[0]
    program = {"Location ID": "123", "Location Name": pool.name, "Course Title": "Lane Swim"}
    fetch = Mock(side_effect=lambda url: [program] if url == source.DROP_IN_PROGRAMS_URL else [
        {"Location ID": "123", "Location Name": pool.name},
    ])
    monkeypatch.setattr(source, "fetch_csv_data", fetch)
    monkeypatch.setattr(source, "parse_schedule_to_sessions", lambda *_args, **_kwargs: [
        {"swim_type": "LANE_SWIM", "date": date(2026, 10, 29),
         "start_time": time(18), "end_time": time(19)},
    ])
    facilities = source.fetch_facilities()
    assert [facility.facility_id for facility in facilities] == [pool.facility_id]
    assert facilities[0].latitude == pool.latitude
    assert source.fetch_sessions(pool.facility_id)[0].facility_id == pool.facility_id
    source.fetch_sessions(pool.facility_id)
    assert fetch.call_count == 2
    assert source.FACILITIES_URL not in [call.args[0] for call in fetch.call_args_list]


def test_json_source_preserves_curated_metadata_and_legacy_client_names():
    source = TorontoParksJSONSource()
    curated = {pool.facility_id: pool for pool in TorontoCuratedSource().fetch_facilities()}
    facilities = source.fetch_facilities()
    assert facilities
    for pool in facilities:
        original = curated[pool.facility_id]
        assert (pool.latitude, pool.longitude, pool.has_indoor, pool.has_outdoor, pool.is_free_entry) == (
            original.latitude, original.longitude, original.has_indoor, original.has_outdoor,
            original.is_free_entry,
        )
        assert pool.toronto_location_id == source._location_ids[pool.facility_id]
    assert TorontoDropInAPI is TorontoDropInSource
    assert TorontoParksJSONAPI is TorontoParksJSONSource


def test_open_data_does_not_assign_schedules_using_a_shared_first_word(monkeypatch):
    source = TorontoDropInSource()
    monkeypatch.setattr(source, "fetch_locations", lambda: {
        "999999": {"Location Name": "North Totally Different Pool"},
    })
    monkeypatch.setattr(source, "fetch_drop_in_programs", lambda: [
        {"Location ID": "999999", "Course Title": "Lane Swim"},
    ])
    assert source.fetch_facilities() == []


def test_open_data_adds_missing_pool_using_verified_municipal_metadata():
    source = TorontoDropInSource()
    source._locations = {'523': {'Location ID': '523', 'Location Name': 'Agincourt Community Recreation Centre',
                                 'Postal Code': 'M1S 2C6'}}
    source._programs = [{'Location ID': '523', 'Course Title': 'Lane Swim'}]
    source._amenities = [{'Location ID': '523', 'Facility Type (Display Name)': 'Indoor Pool'}]
    source._details = {'523': {'id': 523, 'title': 'Agincourt Community Recreation Centre',
                              'address': '31 Glen Watford Dr ', 'district': 'Scarborough',
                              'phone': '416-396-4037', 'lat': '43.7885003853', 'lng': '-79.2757520123'}}
    pool = source.fetch_facilities()[0]
    assert pool.facility_id == 'toronto-523'
    assert pool.toronto_location_id == 523 and pool.latitude == 43.7885003853
    assert pool.has_indoor and not pool.has_outdoor
    assert source._location_ids == {'toronto-523': {'523'}}
    assert pool.address == '31 Glen Watford Dr, Toronto, ON'
    # Renaming a facility never changes its new, official-ID-based public URL.
    source._details['523']['title'] = 'Renamed Community Pool'
    assert source.fetch_facilities()[0].facility_id == 'toronto-523'


def test_open_data_preserves_legacy_slug_when_official_name_has_changed():
    source = TorontoDropInSource()
    source._locations = {'294': {'Location ID': '294', 'Location Name': 'Wallace Emerson Community Recreation Centre'}}
    source._programs = [{'Location ID': '294', 'Course Title': 'Lane Swim'}]
    pool = source.fetch_facilities()[0]
    assert pool.facility_id == 'wallace-emerson-community-centre'
    assert pool.toronto_location_id == 294


def test_missing_toronto_pool_requires_pool_amenity_not_just_program_title():
    source = TorontoDropInSource()
    source._amenities = [{'Location ID': '999', 'Facility Type (Display Name)': 'Gymnasium'}]
    source.session = Mock()
    assert source._new_official_facility('999', {'Location ID': '999'}) is None
    source.session.get.assert_not_called()


def test_existing_toronto_pool_recovers_missing_coordinates_without_changing_id(monkeypatch):
    import sources.toronto_drop_in_api as module
    original = FacilityData('existing-pool', 'Existing Pool', 'Toronto', toronto_location_id=523)
    monkeypatch.setattr(module.TorontoCuratedSource, 'fetch_facilities', lambda self: [original])
    source = TorontoDropInSource()
    source._locations = {'523': {'Location ID': '523', 'Location Name': 'Existing Pool'}}
    source._programs = [{'Location ID': '523', 'Course Title': 'Lane Swim'}]
    source._amenities = [{'Location ID': '523', 'Facility Type (Display Name)': 'Indoor Pool'}]
    source._details = {'523': {'id': 523, 'title': 'Existing Pool', 'address': '31 Glen Watford Dr',
                              'lat': '43.7885003853', 'lng': '-79.2757520123'}}
    pool = source.fetch_facilities()[0]
    assert pool.facility_id == original.facility_id
    assert pool.latitude == 43.7885003853 and pool.longitude == -79.2757520123


def test_toronto_explicit_related_venue_preserves_existing_pool_identity():
    source = TorontoDropInSource()
    source._locations = {
        '542': {'Location ID': '542', 'Location Name': 'Leaside Gardens Indoor Pool'},
        '789': {'Location ID': '789', 'Parent Location ID': '542',
                'Location Name': 'Leaside Memorial Community Gardens and Arena'},
    }
    source._programs = [{'Location ID': '542', 'Course Title': 'Lane Swim'}]
    pool = source.fetch_facilities()[0]
    assert pool.facility_id == 'leaside-memorial-community-gardens'
    assert pool.toronto_location_id == 542


@pytest.mark.parametrize('detail', [
    {'id': 999, 'lat': '43.7', 'lng': '-79.4'},
    {'id': 523, 'lat': '0', 'lng': '0'},
])
def test_missing_toronto_pool_rejects_wrong_identity_or_coordinates(detail):
    source = TorontoDropInSource()
    source._amenities = [{'Location ID': '523', 'Facility Type (Display Name)': 'Indoor Pool'}]
    source._details = {'523': detail}
    with pytest.raises(ValueError):
        source._new_official_facility('523', {'Location ID': '523'})


@pytest.mark.parametrize("invalid", [False, True])
def test_refresh_retains_existing_sessions_on_empty_or_invalid_response(db, monkeypatch, invalid):
    facility_data = FacilityData("example", "Example Pool", "Toronto")
    upsert_facility(db, facility_data)
    db.add(Session(facility_id="example", swim_type="LANE_SWIM", date=date(2026, 10, 29),
                   start_time=time(18), end_time=time(19), hash="existing"))
    db.commit()

    class TestSource:
        provides_sessions = True

        def fetch_facilities(self):
            return [facility_data]

        def fetch_sessions(self, _facility_id, weeks=4):
            if invalid:
                return [SessionData("wrong-pool", "LANE_SWIM", date(2026, 10, 29), time(19), time(18))]
            return []

    monkeypatch.setattr(daily_refresh, "CITY_SOURCES", {"Toronto": ["test_source"]})
    monkeypatch.setattr(daily_refresh.importlib, "import_module", lambda _name: SimpleNamespace(__name__=TestSource.__module__, TestSource=TestSource))
    if invalid:
        with pytest.raises(RuntimeError, match="test_source"):
            daily_refresh.refresh_city_data(db)
    else:
        daily_refresh.refresh_city_data(db)
    assert db.query(Session).one().hash == "existing"


def test_refresh_replaces_valid_schedule_and_deduplicates_records(db, monkeypatch):
    facility_data = FacilityData("example", "Example Pool", "Toronto")
    upsert_facility(db, facility_data)
    db.add(Session(facility_id="example", swim_type="LANE_SWIM", date=date(2026, 10, 29),
                   start_time=time(18), end_time=time(19), hash="old"))
    db.commit()

    class TestSource:
        provides_sessions = True

        def fetch_facilities(self):
            return [facility_data]

        def fetch_sessions(self, _facility_id, weeks=4):
            session = SessionData("example", "LANE_SWIM", date(2026, 10, 30), time(12), time(13))
            return [session, session]

    monkeypatch.setattr(daily_refresh, "CITY_SOURCES", {"Toronto": ["test_source"]})
    monkeypatch.setattr(daily_refresh.importlib, "import_module", lambda _name: SimpleNamespace(__name__=TestSource.__module__, TestSource=TestSource))
    daily_refresh.refresh_city_data(db)
    assert db.query(Session).count() == 1
    replacement = db.query(Session).one()
    assert (replacement.date, replacement.start_time, replacement.end_time) == (
        date(2026, 10, 30), time(12), time(13),
    )


def test_fallback_source_cannot_overwrite_verified_primary_schedule_or_pool_flags(db, monkeypatch):
    class PrimarySource:
        provides_sessions = True

        def fetch_facilities(self):
            return [FacilityData('example', 'Example Pool', 'Toronto', has_indoor=True, has_outdoor=True)]

        def fetch_sessions(self, facility_id, weeks=4):
            return [SessionData(facility_id, 'LANE_SWIM', date(2026, 11, 9), time(12), time(13))]

    class FallbackSource:
        provides_sessions = True

        def fetch_facilities(self):
            return [FacilityData('example', 'Example Pool', 'Toronto', has_indoor=False, has_outdoor=True)]

        def fetch_sessions(self, facility_id, weeks=4):
            raise AssertionError('Fallback must not overwrite successful primary source')

    modules = {
        'sources.primary': SimpleNamespace(__name__=PrimarySource.__module__, PrimarySource=PrimarySource),
        'sources.fallback': SimpleNamespace(__name__=FallbackSource.__module__, FallbackSource=FallbackSource),
    }
    monkeypatch.setattr(daily_refresh, 'CITY_SOURCES', {'Toronto': ['primary', 'fallback']})
    monkeypatch.setattr(daily_refresh.importlib, 'import_module', lambda name: modules[name])
    daily_refresh.refresh_city_data(db)
    assert db.query(Facility).one().has_indoor is True
    assert db.query(Session).one().start_time == time(12)
