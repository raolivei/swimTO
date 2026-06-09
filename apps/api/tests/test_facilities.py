"""Test facility endpoints."""


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

