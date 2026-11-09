"""Mississauga's official swimming and water exercise calendar."""
from datetime import datetime, timedelta

from .activenet_client import ActiveNetClient
from .base_source import BaseSwimSource, FacilityData, SessionData
from .municipal_common import COORDINATES, local_today, swim_type


class MississaugaSource(BaseSwimSource):
    city = 'Mississauga'
    region = 'Peel'
    BASE_URL = 'https://anc.ca.apm.activecommunities.com/activemississauga'

    def __init__(self):
        self.client = ActiveNetClient(self.BASE_URL)
        self._centers = None

    def _load(self):
        if self._centers is None:
            self._centers = self.client.get_swim_events()
        return self._centers

    def fetch_facilities(self):
        result = []
        for center in self._load():
            if not center['events']:
                continue
            detail = self.client.get_center(center['center_id'])
            coordinates = COORDINATES.get(f'mississauga-{center["center_id"]}', {})
            result.append(FacilityData(
                facility_id=f'mississauga-{center["center_id"]}',
                name=center['center_name'], city=self.city,
                address=', '.join(filter(None, [detail['address1'], detail['city'], detail['zip_code']])),
                postal_code=detail['zip_code'], phone=detail.get('phone'),
                latitude=coordinates.get('latitude'), longitude=coordinates.get('longitude'),
                website=self.BASE_URL + '/calendars?defaultCalendarId=1', source='mississauga_activenet'))
        return result

    def fetch_sessions(self, facility_id, weeks=4):
        result = {}
        today = local_today()
        for center in self._load():
            if facility_id != f'mississauga-{center["center_id"]}':
                continue
            for event in center['events']:
                kind = swim_type(event['title'])
                if kind is None:
                    continue
                start = datetime.fromisoformat(event['start_time'])
                end = datetime.fromisoformat(event['end_time'])
                if not today <= start.date() <= today + timedelta(weeks=weeks):
                    continue
                if end <= start or end.date() != start.date():
                    raise ValueError('Invalid ActiveNet swim interval')
                result[(start, end, kind)] = SessionData(
                    facility_id=facility_id, swim_type=kind, date=start.date(),
                    start_time=start.time(), end_time=end.time(),
                    notes=event['title'] + ' | ' + event.get('description', ''),
                    source='mississauga_activenet')
        return list(result.values())
