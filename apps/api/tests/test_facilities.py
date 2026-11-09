"""Test facility endpoints."""

from datetime import date, datetime, time
from zoneinfo import ZoneInfo

from app.models import Session
from app.routes import facilities


def test_get_facilities(client, sample_facility):
    """Test getting all facilities."""
    response = client.get("/facilities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["facility_id"] == sample_facility.facility_id


def test_get_facility_by_id(client, sample_facility):
    """Test getting facility by ID."""
    response = client.get(f"/facilities/{sample_facility.facility_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["facility_id"] == sample_facility.facility_id
    assert data["name"] == sample_facility.name


def test_get_nonexistent_facility(client):
    """Test getting non-existent facility."""
    response = client.get("/facilities/NONEXISTENT")
    assert response.status_code == 404


def test_filter_facilities_by_district(client, sample_facility):
    """Test filtering facilities by district."""
    response = client.get("/facilities?district=Test")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert all("Test" in f.get("district", "") for f in data)


def test_filter_facilities_by_pool_type_indoor(client, sample_facility, db):
    """Indoor filter returns facilities with has_indoor."""
    from app.models import Facility

    outdoor = Facility(
        facility_id="OUT001",
        name="Outdoor Test Pool",
        district="Test District",
        latitude=43.7,
        longitude=-79.4,
        is_indoor=False,
        has_indoor=False,
        has_outdoor=True,
        source="test",
    )
    db.add(outdoor)
    db.commit()

    response = client.get("/facilities?pool_type=indoor")
    assert response.status_code == 200
    ids = {f["facility_id"] for f in response.json()}
    assert sample_facility.facility_id in ids
    assert "OUT001" not in ids


def test_filter_facilities_by_pool_type_outdoor(client, sample_facility, db):
    """Outdoor filter returns facilities with has_outdoor."""
    from app.models import Facility

    outdoor = Facility(
        facility_id="OUT001",
        name="Outdoor Test Pool",
        district="Test District",
        latitude=43.7,
        longitude=-79.4,
        is_indoor=False,
        has_indoor=False,
        has_outdoor=True,
        source="test",
    )
    db.add(outdoor)
    db.commit()

    response = client.get("/facilities?pool_type=outdoor")
    assert response.status_code == 200
    ids = {f["facility_id"] for f in response.json()}
    assert "OUT001" in ids


def test_include_outdoor_deprecated_alias(client, sample_facility, db):
    """Deprecated include_outdoor=false maps to indoor filter."""
    from app.models import Facility

    outdoor = Facility(
        facility_id="OUT002",
        name="Outdoor Pool Two",
        district="Test District",
        latitude=43.71,
        longitude=-79.41,
        is_indoor=False,
        has_indoor=False,
        has_outdoor=True,
        source="test",
    )
    db.add(outdoor)
    db.commit()

    response = client.get("/facilities?include_outdoor=false")
    assert response.status_code == 200
    ids = {f["facility_id"] for f in response.json()}
    assert sample_facility.facility_id in ids
    assert "OUT002" not in ids


def test_next_session_keeps_current_swim_and_excludes_ended_swims(client, sample_facility, db, monkeypatch):
    monkeypatch.setattr(facilities, '_current_local_time', lambda: datetime(
        2026, 10, 30, 16, tzinfo=ZoneInfo('America/Toronto')))
    for index, (day, start, end) in enumerate([
        (date(2026, 10, 30), time(14), time(15)),
        (date(2026, 10, 30), time(15), time(16)),
        (date(2026, 10, 30), time(15, 30), time(16, 30)),
        (date(2026, 10, 30), time(17), time(18)),
        (date(2026, 10, 31), time(9), time(10)),
    ]):
        db.add(Session(facility_id=sample_facility.facility_id, swim_type='LANE_SWIM',
                       date=day, start_time=start, end_time=end, hash=f'next-{index}'))
    db.commit()
    response = client.get('/facilities', params={'swim_type': 'LANE_SWIM'})
    assert response.status_code == 200
    pool = response.json()[0]
    assert pool['next_session']['start_time'] == '15:30:00'
    assert pool['session_count'] == 3


def test_next_session_uses_toronto_date_not_server_date(client, sample_facility, db, monkeypatch):
    monkeypatch.setattr(facilities, '_current_local_time', lambda: datetime(
        2026, 10, 30, 21, tzinfo=ZoneInfo('America/Toronto')))
    db.add(Session(facility_id=sample_facility.facility_id, swim_type='LANE_SWIM',
                   date=date(2026, 10, 30), start_time=time(21, 30), end_time=time(22, 30), hash='evening'))
    db.commit()
    pool = client.get('/facilities', params={'swim_type': 'LANE_SWIM'}).json()[0]
    assert pool['next_session']['date'] == '2026-10-30'

