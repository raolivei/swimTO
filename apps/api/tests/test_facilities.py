"""Test facility endpoints."""


def test_get_facilities(client, sample_facility):
    """Test getting all facilities."""
    response = client.get("/facilities/")
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
    response = client.get("/facilities/?district=Test")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert all("Test" in f.get("district", "") for f in data)

