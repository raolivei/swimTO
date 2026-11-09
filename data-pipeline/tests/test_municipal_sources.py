"""Guard real municipal calendar shapes, date ranges, and seasonal closures."""
from datetime import date, time, timedelta
from unittest.mock import Mock

import pytest

from sources import perfectmind_source, richmond_hill_source
from sources.municipal_common import swim_type
from sources.perfectmind_client import PerfectMindClient
from sources.vaughan_source import VaughanSource
from sources.richmond_hill_source import RichmondHillSource, POOLS, parse_intervals
from sources.mississauga_source import MississaugaSource


@pytest.mark.parametrize('name,kind', [
    ('Length Swim - Ladies only', 'LANE_SWIM'), ('Lane and Leisure Swim', 'LANE_SWIM'),
    ('Aquafitness ', 'AQUATIC_FITNESS'), ('Fun N Fit', 'RECREATIONAL'),
    ('Parent & Tot', 'RECREATIONAL'), ('Learn to Skate', None),
    ('Adult Swim Drop-In (18+ Years)', 'ADULT_SWIM'),
    ('Drop In Water Running', 'AQUATIC_FITNESS'),
])
def test_municipal_activity_types(name, kind):
    assert swim_type(name) == kind


def test_perfectmind_uses_date_range_filter_and_progresses():
    client = PerfectMindClient('https://example.invalid', 'widget', 'calendar')
    client.session = Mock()
    client.session.get.return_value.text = '<form id="AjaxAntiForgeryForm"><input name="__RequestVerificationToken" value="public-token"></form>'
    client.session.post.side_effect = [Mock(json=lambda: {'classes': [{'OccurrenceDate': '20261029'}]}),
                                       Mock(json=lambda: {'classes': [{'OccurrenceDate': '20261030'}]})]
    result = client.get_classes(date(2026, 10, 29), date(2026, 10, 30))
    assert len(result) == 2
    assert [call.kwargs['data']['values[0][Value]'] for call in client.session.post.call_args_list] == [
        '2026-10-29T00:00:00.000Z', '2026-10-30T00:00:00.000Z']
    assert all(call.kwargs['data']['values[0][ValueKind]'] == 6 for call in client.session.post.call_args_list)


def test_perfectmind_rejects_ignored_date_filter():
    client = PerfectMindClient('https://example.invalid', 'widget', 'calendar')
    client.session = Mock()
    client.session.get.return_value.text = '<form id="AjaxAntiForgeryForm"><input name="__RequestVerificationToken" value="token"></form>'
    client.session.post.return_value.json.return_value = {'classes': [{'OccurrenceDate': '20261029'}]}
    with pytest.raises(ValueError, match='ignored'):
        client.get_classes(date(2026, 10, 30), date(2026, 11, 1))


def test_vaughan_public_record_produces_real_location_and_time(monkeypatch):
    today = date(2026, 10, 29)
    monkeypatch.setattr(perfectmind_source, 'local_today', lambda: today)
    source = VaughanSource()
    record = {'EventId': 'event', 'Location': 'Chancellor Community Centre',
              'EventName': 'Length Swim - Ladies only', 'OccurrenceDate': '20261029',
              'FormattedStartTime': '09:00 PM', 'FormattedEndTime': '10:00 PM',
              'MinAge': 7, 'MaxAge': None, 'Details': 'Female Only Length Swim',
              'Address': {'Street': '350 Ansley Grove Rd.', 'City': 'Woodbridge',
                          'PostalCode': 'L4L 5C9', 'Latitude': 43.796216, 'Longitude': -79.565127}}
    source._records = [(source.clients[0], record)]
    source._end = today + timedelta(weeks=8)
    pool = source.fetch_facilities()[0]
    assert pool.city == 'Vaughan' and pool.latitude == 43.796216
    session = source.fetch_sessions(pool.facility_id)[0]
    assert (session.date, session.start_time, session.end_time) == (today, time(21), time(22))
    assert session.age_min == 7 and 'Ladies only' in session.notes
    record['FormattedStartTime'] = 'invalid'
    with pytest.raises(ValueError):
        source.fetch_sessions(pool.facility_id)


def test_activenet_explicit_dates_do_not_create_recurrences():
    source = MississaugaSource()
    today = perfectmind_source.local_today()
    source._centers = [{'center_id': 290, 'events': [
        {'title': 'Lane Swim', 'start_time': f'{today} 06:30:00', 'end_time': f'{today} 08:00:00'},
    ]}]
    records = source.fetch_sessions('mississauga-burnhamthorpe-cmty-centre')
    assert len(records) == 1 and records[0].date == today


def test_mississauga_keeps_production_pool_ids_when_switching_feeds():
    assert MississaugaSource.facility_id(290) == 'mississauga-burnhamthorpe-cmty-centre'
    assert MississaugaSource.facility_id(252) == 'mississauga-huron-park-rec-centre'
    assert MississaugaSource.facility_id(261) == 'mississauga-261'


@pytest.mark.parametrize('text,expected', [
    ('7:15 - 8:15 a.m. 9 - 10 p.m.', [(time(7, 15), time(8, 15)), (time(21), time(22))]),
    ('10:45 a.m. - 1:15 p.m.', [(time(10, 45), time(13, 15))]),
    ('', []),
])
def test_richmond_hill_time_ranges(text, expected):
    assert parse_intervals(text) == expected


def test_richmond_hill_excludes_maintenance_and_evening_closures(monkeypatch):
    monkeypatch.setattr(richmond_hill_source, 'local_today', lambda: date(2026, 11, 22))
    html = '<h2>Fall Drop-In Swim Schedule: valid until January 3, 2027</h2>'
    for name in POOLS:
        html += ('<table><tr><td data-name="accParent">' + name + '</td></tr><tr><td>'
                 '<table class="datatable"><tr><td>Activity</td><td>Sunday</td></tr><tr><td>Lane Swim</td>'
                 + '<td>7 - 8 a.m.<br>9 - 10 p.m.</td>' * 7 + '</tr></table>'
                 'Closures: November 23 - December 20 (Closed for Pool Annual Maintenance), '
                 'December 24 (Christmas Eve - after 4 p.m.), January 1 (New Year)</td></tr></table>')
    source = RichmondHillSource()
    source.parse_page(html)
    sessions = source.fetch_sessions('richmond-hill-bayview-hill-pool', weeks=8)
    assert sessions
    assert not any(date(2026, 11, 23) <= s.date <= date(2026, 12, 20) for s in sessions)
    assert [s.start_time for s in sessions if s.date == date(2026, 12, 24)] == [time(7)]
    assert not any(s.date == date(2027, 1, 1) or s.date > date(2027, 1, 3) for s in sessions)


def test_city_jobs_select_concrete_adapter_not_imported_base():
    import importlib
    for module_name, expected in [('vaughan_source', 'VaughanSource'), ('markham_source', 'MarkhamSource'),
                                  ('brampton_source', 'BramptonSource')]:
        module = importlib.import_module('sources.' + module_name)
        classes = [value for value in vars(module).values() if isinstance(value, type)
                   and value.__name__.endswith('Source') and value.__module__ == module.__name__]
        assert [cls.__name__ for cls in classes] == [expected]
