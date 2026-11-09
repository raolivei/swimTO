"""Anonymous ActiveNet online-calendar REST client."""
import re

import requests


class ActiveNetClient:
    def __init__(self, base_url, calendar_id=1):
        self.base_url = base_url.rstrip('/')
        self.calendar_id = calendar_id
        self.session = requests.Session()
        self.session.headers['User-Agent'] = 'swimTO/1.0 (https://github.com/raolivei/swimTO)'
        self._ready = False

    def _request(self, path, body=None):
        if not self._ready:
            page = self.session.get(self.base_url + '/calendars', timeout=30)
            page.raise_for_status()
            token = re.search(r'__csrfToken\s*=\s*["\x27]([^"\x27]+)', page.text)
            if token is None:
                raise ValueError('Calendar did not provide its public CSRF token')
            self.session.headers.update({'X-CSRF-Token': token[1], 'Referer': page.url})
            self._ready = True
        url = self.base_url + '/rest/onlinecalendar/' + path
        response = (self.session.get(url, timeout=30) if body is None
                    else self.session.post(url, json=body, timeout=30))
        response.raise_for_status()
        payload = response.json()
        if payload['headers']['response_code'] != '0000':
            raise ValueError(payload['headers']['response_message'])
        return payload['body']

    def get_swim_events(self):
        filters = self._request('filters', {'calendar_id': self.calendar_id})
        categories = [c for c in filters['activity_category']
                      if 'swim' in c['name'].lower() or 'water exercise' in c['name'].lower()]
        if not categories:
            raise ValueError('No municipal swimming categories found')
        centers = sorted({center for c in categories for center in c['centerIds']})
        return self._request('multicenter/events', {
            'calendar_id': self.calendar_id, 'center_ids': centers, 'display_all': 0,
            'activity_category_ids': [c['id'] for c in categories],
        })['center_events']

    def get_center(self, center_id):
        return self._request(f'centerdetails/{center_id}')['center_detail']
