"""Shared adapter for verified swimming-only PerfectMind calendars."""
from datetime import datetime, timedelta

from .base_source import BaseSwimSource, FacilityData, SessionData
from .municipal_common import COORDINATES, local_today, slug, swim_type
from .perfectmind_client import PerfectMindClient


class PerfectMindSource(BaseSwimSource):
    EXTRA_CALENDARS = ()

    def __init__(self):
        self.clients = [PerfectMindClient(self.BASE_URL, self.WIDGET_ID, calendar)
                        for calendar in (self.CALENDAR_ID, *self.EXTRA_CALENDARS)]
        self._records = None
        self._end = None

    def _load(self, weeks=8):
        end = local_today() + timedelta(weeks=weeks)
        if self._records is None or end > self._end:
            self._records = [(client, record) for client in self.clients
                             for record in client.get_classes(local_today(), end)]
            self._end = end
        return self._records

    def _facility_id(self, record):
        return f'{slug(self.city)}-{slug(record["Location"])}'

    def fetch_facilities(self):
        facilities = {}
        for client, record in self._load():
            if not swim_type(record['EventName']):
                continue
            address = record.get('Address') or {}
            facility_id = self._facility_id(record)
            coordinates = COORDINATES.get(facility_id, {})
            facilities[facility_id] = FacilityData(
                facility_id=facility_id, name=record['Location'], city=self.city,
                address=', '.join(str(address.get(k) or '').strip()
                                  for k in ('Street', 'City', 'PostalCode')
                                  if str(address.get(k) or '').strip()),
                postal_code=(address.get('PostalCode') or '').strip() or None,
                latitude=address.get('Latitude') or coordinates.get('latitude'),
                longitude=address.get('Longitude') or coordinates.get('longitude'),
                website=f'{self.BASE_URL}/Clients/BookMe4?widgetId={self.WIDGET_ID}',
                source=f'{slug(self.city)}_perfectmind')
        return list(facilities.values())

    def fetch_sessions(self, facility_id, weeks=4):
        result = {}
        start, end = local_today(), local_today() + timedelta(weeks=weeks)
        for client, record in self._load(weeks):
            kind = swim_type(record['EventName'])
            if not kind or self._facility_id(record) != facility_id:
                continue
            day = datetime.strptime(record['OccurrenceDate'], '%Y%m%d').date()
            if not start <= day <= end:
                continue
            begins = datetime.strptime(record['FormattedStartTime'], '%I:%M %p').time()
            finishes = datetime.strptime(record['FormattedEndTime'], '%I:%M %p').time()
            if finishes <= begins:
                raise ValueError(f'Invalid municipal swim interval: {record["EventId"]}')
            session = SessionData(
                facility_id=facility_id, swim_type=kind, date=day,
                start_time=begins, end_time=finishes,
                age_min=record.get('MinAge'), age_max=record.get('MaxAge'),
                notes=' | '.join(filter(None, [record['EventName'], record.get('Details'),
                                              record.get('DisplayableRestrictionsForCourses')])),
                source=f'{slug(self.city)}_perfectmind')
            result[(day, begins, finishes, kind)] = session
        return list(result.values())
