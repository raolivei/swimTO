"""City filters isolate results while the default remains a unified view."""
from datetime import date, time, timedelta

import pytest

from app.models import Facility, Session


@pytest.fixture
def six_cities(db):
    for city, facility_id in (("Toronto", "toronto-example"), ("Mississauga", "mississauga-example"),
                              ("Brampton", "brampton-example"), ("Vaughan", "vaughan-example"),
                              ("Richmond Hill", "richmond-hill-example"), ("Markham", "markham-example")):
        db.add(Facility(facility_id=facility_id, name=f"{city} Example Pool", city=city))
        db.flush()
        db.add(Session(facility_id=facility_id, swim_type="LANE_SWIM", date=date.today() + timedelta(days=1),
                       start_time=time(18), end_time=time(19), hash=facility_id))
    db.commit()


@pytest.mark.parametrize("endpoint", ["/facilities", "/schedule"])
def test_default_includes_all_six_cities(client, six_cities, endpoint):
    response = client.get(endpoint)
    assert response.status_code == 200
    assert {row["facility_id"] for row in response.json()} == {
        "toronto-example", "mississauga-example", "brampton-example", "vaughan-example",
        "richmond-hill-example", "markham-example"}


@pytest.mark.parametrize("endpoint", ["/facilities", "/schedule"])
def test_city_filter_is_case_insensitive(client, six_cities, endpoint):
    response = client.get(endpoint, params={"city": "mississauga"})
    assert response.status_code == 200
    assert [row["facility_id"] for row in response.json()] == ["mississauga-example"]


@pytest.mark.parametrize("endpoint", ["/facilities", "/schedule"])
def test_unknown_city_returns_empty_result(client, six_cities, endpoint):
    response = client.get(endpoint, params={"city": "Unknown City"})
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.parametrize('city,facility_id', [('Vaughan', 'vaughan-example'), ('Richmond Hill', 'richmond-hill-example')])
@pytest.mark.parametrize('endpoint', ['/facilities', '/schedule'])
def test_york_city_filter(client, six_cities, city, facility_id, endpoint):
    response = client.get(endpoint, params={'city': city})
    assert response.status_code == 200
    assert [row['facility_id'] for row in response.json()] == [facility_id]


def test_pagination_preserves_all_cities_with_tied_start_times(client, six_cities):
    pages = [client.get('/schedule', params={'limit': 2, 'offset': offset}).json() for offset in (0, 2, 4)]
    assert len({row['id'] for page in pages for row in page}) == 6
