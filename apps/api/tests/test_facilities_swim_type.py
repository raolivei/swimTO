"""Test facility swim_type filter."""

from datetime import date, time, timedelta

from app.models import Facility, Session


def test_filter_facilities_by_swim_type_recreational(client, sample_facility, db):
    """Recreational filter returns only facilities with recreational sessions."""
    today = date.today()
    sample_facility.has_outdoor = True
    db.add(sample_facility)

    outdoor = Facility(
        facility_id="OUT_REC",
        name="Outdoor Rec Pool",
        district="Test District",
        latitude=43.7,
        longitude=-79.4,
        is_indoor=False,
        has_indoor=False,
        has_outdoor=True,
        source="test",
    )
    db.add(outdoor)
    db.flush()

    db.add(
        Session(
            facility_id=sample_facility.facility_id,
            swim_type="LANE_SWIM",
            date=today,
            start_time=time(18, 0),
            end_time=time(19, 0),
            source="test",
            hash="lane-hash",
        )
    )
    db.add(
        Session(
            facility_id=outdoor.facility_id,
            swim_type="RECREATIONAL",
            date=today,
            start_time=time(14, 0),
            end_time=time(15, 0),
            source="test",
            hash="rec-hash",
        )
    )
    db.commit()

    response = client.get("/facilities?swim_type=RECREATIONAL&has_lane_swim=false")
    assert response.status_code == 200
    data = response.json()
    ids = {f["facility_id"] for f in data}
    assert "OUT_REC" in ids
    assert sample_facility.facility_id not in ids
    assert data[0]["next_session"]["swim_type"] == "RECREATIONAL"
