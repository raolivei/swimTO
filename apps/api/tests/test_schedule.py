"""Test schedule endpoints."""
from datetime import date


def test_get_schedule(client, sample_session):
    """Test getting schedule."""
    response = client.get("/schedule/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_schedule_with_filters(client, sample_session):
    """Test schedule with filters."""
    response = client.get("/schedule/?swim_type=LANE_SWIM")
    assert response.status_code == 200
    data = response.json()
    assert all(s["swim_type"] == "LANE_SWIM" for s in data)


def test_get_schedule_by_facility(client, sample_facility, sample_session):
    """Test schedule filtered by facility."""
    response = client.get(f"/schedule/?facility_id={sample_facility.facility_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert all(s["facility_id"] == sample_facility.facility_id for s in data)


def test_get_today_schedule(client):
    """Test today's schedule endpoint."""
    response = client.get("/schedule/today")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # All sessions should be for today
    today = date.today().isoformat()
    assert all(s["date"] == today for s in data) or len(data) == 0

