"""Richmond Hill's published seasonal timetable, including scheduled closures."""
import re
from datetime import datetime, date, time, timedelta

import requests
from bs4 import BeautifulSoup

from .base_source import BaseSwimSource, FacilityData, SessionData
from .municipal_common import local_today, slug, swim_type

# Addresses and coordinates from each official municipal facility page's map
# link, not estimated city centroids. Timetables are fetched on every run.
POOLS = {
    'Bayview Hill Pool': ('Bayview-Hill-Community-Centre', '114 Spadina Road, L4B 2Y9', 43.8695825, -79.4019133),
    'Centennial Pool': ('Centennial-Pool', '161 Newkirk Road, L4C 3G6', 43.8830002, -79.4291761),
    'Elgin West Pool': ('Elgin-West-Community-Centre-and-Pool', '11099 Bathurst Street, L4C 0N2', 43.8929631, -79.4682812),
    'Oak Ridges Pool': ('Oak-Ridges-Community-Centre', '12895 Bayview Avenue, L4E 3G2', 43.9466, -79.4284803),
    'Richvale Pool': ('Richvale-Community-Centre-and-Pool', '160 Avenue Road, L4C 5L8', 43.853484, -79.44599),
    'The Wave Pool': ('The-Wave-Pool', '5 Hopkins Street, L4C 0C1', 43.8685446, -79.439952),
}
MONTHS = '|'.join(datetime(2000, month, 1).strftime('%B') for month in range(1, 13))
INTERVAL = re.compile(r'(\d{1,2}(?::\d{2})?)\s*(a\.m\.|p\.m\.)?\s*[-–]\s*'
                      r'(\d{1,2}(?::\d{2})?)\s*(a\.m\.|p\.m\.)', re.I)
CLOSURE = re.compile(rf'({MONTHS})\s+(\d{{1,2}})(?:\s*[-–]\s*({MONTHS})\s+(\d{{1,2}}))?\s*\(([^)]+)\)')


def parse_intervals(text):
    result = []
    for match in INTERVAL.finditer(text):
        first, period, last, end_period = match.groups()
        def clock(value, suffix):
            return datetime.strptime(value + ' ' + suffix.replace('.', '').upper(),
                                     '%I:%M %p' if ':' in value else '%I %p').time()
        start, end = clock(first, period or end_period), clock(last, end_period)
        if end <= start:
            raise ValueError(f'Invalid Richmond Hill time interval: {match[0]}')
        result.append((start, end))
    if text.strip().strip('*') and not result:
        raise ValueError(f'Unrecognized Richmond Hill timetable cell: {text}')
    return result


class RichmondHillSource(BaseSwimSource):
    city = 'Richmond Hill'
    region = 'York'
    URL = 'https://www.richmondhill.ca/en/things-to-do/Swimming.aspx'

    def __init__(self):
        self._tables = None

    def _load(self):
        if self._tables is not None:
            return
        response = requests.get(self.URL, timeout=30)
        response.raise_for_status()
        self.parse_page(response.text)

    def parse_page(self, html):
        soup = BeautifulSoup(html, 'html.parser')
        validity = re.search(r'Fall Drop-In Swim Schedule:\s*valid\s*until\s*'
                             r'([A-Za-z]+\s+\d{1,2},\s+\d{4})', soup.get_text(' ', strip=True))
        if not validity:
            raise ValueError('Richmond Hill timetable season could not be verified')
        self.valid_until = datetime.strptime(validity[1], '%B %d, %Y').date()
        self.valid_from = date(self.valid_until.year - (self.valid_until.month < 9), 9, 1)
        if not self.valid_from <= local_today() <= self.valid_until:
            raise ValueError('Richmond Hill published timetable is outside its validity period')
        self._tables = {}
        for table in soup.select('table.datatable'):
            if 'Sunday' not in table.select_one('tr').get_text():
                continue
            label = table.find_previous('td', attrs={'data-name': 'accParent'}).get_text(' ', strip=True)
            if label not in POOLS:
                raise ValueError(f'Unknown Richmond Hill pool: {label}')
            rows = []
            for row in table.select('tr')[1:]:
                cells = row.find_all(['td', 'th'], recursive=False)
                if len(cells) != 8:
                    raise ValueError('Richmond Hill timetable weekday columns changed')
                name = cells[0].get_text(' ', strip=True)
                kind = swim_type(name)
                if kind is None:
                    raise ValueError(f'Unknown Richmond Hill swim type: {name}')
                rows.append((name, kind, [parse_intervals(c.get_text(' ', strip=True)) for c in cells[1:]]))
            closure_text = table.parent.get_text(' ', strip=True).split('Closures:', 1)
            if len(closure_text) != 2:
                raise ValueError('Richmond Hill closures missing')
            closures = []
            def day(month, number):
                month_number = datetime.strptime(month, '%B').month
                year = self.valid_from.year if month_number >= 9 else self.valid_until.year
                return date(year, month_number, int(number))
            for match in CLOSURE.finditer(closure_text[1]):
                month, number, end_month, end_number, reason = match.groups()
                first = day(month, number)
                last = day(end_month, end_number) if end_month else first
                closures.append((first, last, time(16) if 'after 4 p.m.' in reason else time(0)))
            if not closures:
                raise ValueError('Richmond Hill closures could not be parsed')
            self._tables[label] = rows, closures, closure_text[1]
        if set(self._tables) != set(POOLS):
            raise ValueError('Richmond Hill timetable is missing pools')

    def fetch_facilities(self):
        self._load()
        return [FacilityData(
            facility_id='richmond-hill-' + slug(name), name=name, city=self.city,
            address=address + ', Richmond Hill, ON', latitude=lat, longitude=lon,
            website=f'https://www.richmondhill.ca/en/things-to-do/{page}.aspx',
            source='richmond_hill_schedule') for name, (page, address, lat, lon) in POOLS.items()]

    def fetch_sessions(self, facility_id, weeks=4):
        self._load()
        name = next((name for name in self._tables if 'richmond-hill-' + slug(name) == facility_id), None)
        if name is None:
            return []
        rows, closures, closure_notes = self._tables[name]
        today = local_today()
        end = min(today + timedelta(weeks=weeks), self.valid_until)
        result = []
        for offset in range((end - today).days + 1):
            day = today + timedelta(days=offset)
            column = (day.weekday() + 1) % 7
            for label, kind, intervals in rows:
                for start, finish in intervals[column]:
                    if any(first <= day <= last and finish > cutoff for first, last, cutoff in closures):
                        continue
                    result.append(SessionData(
                        facility_id=facility_id, swim_type=kind, date=day,
                        start_time=start, end_time=finish, source='richmond_hill_schedule',
                        notes=label + ' | Published closures: ' + closure_notes,
                        age_min=10 if kind == 'LANE_SWIM' else None))
        return result
