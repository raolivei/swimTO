"""
Parser for Toronto Parks JSON API for facility schedules.

This handles facilities that are NOT in the Toronto Open Data drop-in programs API.
These facilities have their schedules available at:
https://www.toronto.ca/data/parks/live/locations/{location_id}/swim/week{1-4}.json
"""
import requests
from typing import List, Dict, Optional, Tuple
from datetime import datetime, date, time, timedelta
from loguru import logger


class TorontoParksJSONAPI:
    """Parser for Toronto Parks JSON API schedules."""
    
    BASE_URL = "https://www.toronto.ca/data/parks/live/locations"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (compatible; SwimTO/2.0; +https://github.com/raolivei/swimTO)"
        })
    
    def fetch_facility_schedule(
        self,
        location_id: int,
        weeks_ahead: int = 4
    ) -> List[Dict]:
        """
        Fetch schedule for a facility from Toronto Parks JSON API.
        
        Args:
            location_id: The location ID from toronto.ca URLs
            weeks_ahead: Number of weeks to fetch (1-4)
            
        Returns:
            List of session dictionaries
        """
        sessions = []
        
        # Fetch info to get week metadata
        try:
            info = self._fetch_swim_info(location_id)
            if not info:
                logger.warning(f"No swim info found for location {location_id}")
                return []
            
            weeks = info.get('weeks', [])
            logger.info(f"Found {len(weeks)} weeks of schedule data for location {location_id}")
            
        except Exception as e:
            logger.error(f"Error fetching swim info for location {location_id}: {e}")
            return []
        
        # Fetch each week
        for week_num in range(1, min(weeks_ahead, len(weeks)) + 1):
            try:
                week_sessions = self._fetch_week_schedule(location_id, week_num, weeks)
                sessions.extend(week_sessions)
                logger.info(f"Fetched {len(week_sessions)} sessions for week {week_num}")
            except Exception as e:
                logger.error(f"Error fetching week {week_num} for location {location_id}: {e}")
                continue
        
        return sessions
    
    def _fetch_swim_info(self, location_id: int) -> Optional[Dict]:
        """Fetch swim info metadata."""
        url = f"{self.BASE_URL}/{location_id}/swim/info.json"
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            # Decode UTF-16 LE with BOM
            content = response.content
            if content.startswith(b'\xff\xfe'):
                text = content.decode('utf-16-le')
            else:
                text = content.decode('utf-8-sig')  # utf-8-sig strips BOM automatically
            
            # Strip any remaining BOM
            text = text.lstrip('\ufeff')
            
            import json
            return json.loads(text)
        except Exception as e:
            logger.error(f"Error fetching swim info from {url}: {e}")
            return None
    
    def _fetch_week_schedule(
        self,
        location_id: int,
        week_num: int,
        weeks_metadata: List[Dict]
    ) -> List[Dict]:
        """Fetch and parse a week's schedule."""
        url = f"{self.BASE_URL}/{location_id}/swim/week{week_num}.json"
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            # Decode UTF-16 LE with BOM
            content = response.content
            if content.startswith(b'\xff\xfe'):
                text = content.decode('utf-16-le')
            else:
                text = content.decode('utf-8-sig')  # utf-8-sig strips BOM automatically
            
            # Strip any remaining BOM
            text = text.lstrip('\ufeff')
            
            import json
            data = json.loads(text)
            
            # Get week start date from metadata
            week_metadata = weeks_metadata[week_num - 1] if week_num <= len(weeks_metadata) else None
            week_start_date = self._parse_week_date(week_metadata.get('title')) if week_metadata else None
            
            if not week_start_date:
                logger.warning(f"Could not determine week start date for week {week_num}")
                return []
            
            # Parse programs
            return self._parse_programs(data.get('programs', []), week_start_date)
            
        except Exception as e:
            logger.error(f"Error fetching week schedule from {url}: {e}")
            return []
    
    def _parse_week_date(self, date_str: str) -> Optional[date]:
        """Parse week start date from title like '2025-11-03'."""
        if not date_str:
            return None
        
        try:
            return datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            logger.warning(f"Could not parse week date: {date_str}")
            return None
    
    def _parse_programs(self, programs: List[Dict], week_start_date: date) -> List[Dict]:
        """Parse programs into session list."""
        sessions = []
        
        day_to_offset = {
            'monday': 0,
            'tuesday': 1,
            'wednesday': 2,
            'thursday': 3,
            'friday': 4,
            'saturday': 5,
            'sunday': 6
        }
        
        for program in programs:
            program_name = program.get('program', '')
            days = program.get('days', [])
            
            for day_data in days:
                # Get swim type info from this day section
                title = day_data.get('title', '')
                age_info = day_data.get('age', '')
                times = day_data.get('times', [])
                
                # Determine swim type
                swim_type = self._classify_swim_type(title, program_name)
                
                # Parse time slots
                for time_slot in times:
                    # Each time slot has its own day field!
                    time_day_name = time_slot.get('day', '').lower()
                    offset = day_to_offset.get(time_day_name)
                    
                    if offset is None:
                        continue
                    
                    session_date = week_start_date + timedelta(days=offset)
                    
                    # Parse time from title field (e.g., "07:15 AM - 08:10 AM")
                    time_title = time_slot.get('title', '')
                    start_time, end_time = self._parse_time_range(time_title)
                    
                    if not start_time or not end_time:
                        logger.debug(f"Could not parse time range: {time_title}")
                        continue
                    
                    # Build notes
                    notes_parts = []
                    if age_info:
                        notes_parts.append(age_info)
                    if program_name and program_name != title:
                        notes_parts.append(program_name)
                    
                    session = {
                        'date': session_date,
                        'start_time': start_time,
                        'end_time': end_time,
                        'swim_type': swim_type,
                        'notes': '; '.join(notes_parts) if notes_parts else None,
                        'program_name': title or program_name
                    }
                    
                    sessions.append(session)
        
        return sessions
    
    def _parse_time(self, time_str: str) -> Optional[time]:
        """
        Parse time string like '07:15 AM' or '13:30'.
        """
        if not time_str:
            return None
        
        time_str = time_str.strip().upper()
        
        # Try 12-hour format with AM/PM
        for fmt in ['%I:%M %p', '%I:%M%p']:
            try:
                dt = datetime.strptime(time_str, fmt)
                return dt.time()
            except ValueError:
                continue
        
        # Try 24-hour format
        try:
            dt = datetime.strptime(time_str, '%H:%M')
            return dt.time()
        except ValueError:
            pass
        
        logger.warning(f"Could not parse time: {time_str}")
        return None
    
    def _parse_time_range(self, time_range_str: str) -> Tuple[Optional[time], Optional[time]]:
        """
        Parse time range string like '07:15 AM - 08:10 AM' into start and end times.
        """
        if not time_range_str:
            return None, None
        
        # Split on dash
        parts = time_range_str.split('-')
        if len(parts) != 2:
            return None, None
        
        start_time = self._parse_time(parts[0].strip())
        end_time = self._parse_time(parts[1].strip())
        
        return start_time, end_time
    
    def _classify_swim_type(self, title: str, program_name: str) -> str:
        """Classify swim type from title and program name."""
        text = f"{title} {program_name}".lower()
        
        if 'lane' in text or 'length' in text:
            return 'LANE_SWIM'
        elif 'leisure' in text or 'family' in text or 'recreational' in text:
            return 'RECREATIONAL'
        elif 'adult' in text:
            return 'ADULT_SWIM'
        elif 'senior' in text:
            return 'SENIOR_SWIM'
        elif 'aquatic' in text or 'fitness' in text:
            return 'AQUATIC_FITNESS'
        else:
            return 'OTHER'

