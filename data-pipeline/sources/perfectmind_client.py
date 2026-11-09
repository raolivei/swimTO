"""Read the anonymous endpoints used by municipal BookMe4 calendars."""
from datetime import date, datetime, timedelta

import requests
from bs4 import BeautifulSoup


class PerfectMindClient:
    def __init__(self, base_url: str, widget_id: str, calendar_id: str):
        self.base_url = base_url.rstrip('/')
        self.widget_id = widget_id
        self.calendar_id = calendar_id
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'swimTO/1.0 (https://github.com/raolivei/swimTO)'})

    @property
    def calendar_url(self):
        return (f'{self.base_url}/Clients/BookMe4BookingPages/Classes'
                f'?calendarId={self.calendar_id}&widgetId={self.widget_id}')

    def get_classes(self, start: date, end: date) -> list[dict]:
        page = self.session.get(self.calendar_url, timeout=30)
        page.raise_for_status()
        token = BeautifulSoup(page.text, 'html.parser').select_one(
            '#AjaxAntiForgeryForm input[name="__RequestVerificationToken"]')
        if token is None:
            raise ValueError('Calendar did not provide its public form token')
        self.session.headers.update({'X-Requested-With': 'XMLHttpRequest', 'Referer': self.calendar_url})
        records = []
        cursor = start
        while cursor <= end:
            response = self.session.post(
                f'{self.base_url}/Clients/BookMe4BookingPagesV2/ClassesV2',
                data={'calendarId': self.calendar_id, 'widgetId': self.widget_id,
                      'page': 0,
                      'values[0][Name]': 'Date Range',
                      'values[0][ValueKind]': 6,
                      'values[0][Value]': cursor.isoformat() + 'T00:00:00.000Z',
                      'values[0][Value2]': end.isoformat() + 'T00:00:00.000Z',
                      '__RequestVerificationToken': token['value']}, timeout=30)
            response.raise_for_status()
            batch = response.json()['classes']
            if not batch:
                break
            records.extend(item for item in batch
                           if start <= datetime.strptime(item['OccurrenceDate'], '%Y%m%d').date() <= end)
            # Responses group complete dates. Use actual occurrence dates,
            # never infer a weekly recurrence from the displayed description.
            last = max((datetime.strptime(x['OccurrenceDate'], '%Y%m%d').date()
                        for x in batch), default=cursor)
            if last < cursor:
                raise ValueError('Calendar ignored the requested date range')
            cursor = last + timedelta(days=1)
        return records
