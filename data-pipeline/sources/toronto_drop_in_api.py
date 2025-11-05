"""
Toronto Open Data Drop-in Programs API Parser.

Fetches and parses official drop-in program data from Toronto's Open Data Portal.
API updates daily at 8:00 AM with authoritative schedule information.
"""
import re
import csv
import hashlib
from datetime import datetime, date, time, timedelta
from typing import List, Dict, Optional, Tuple
from io import StringIO

import requests

# Make loguru optional for standalone testing
try:
    from loguru import logger
except ImportError:
    import logging
    logger = logging.getLogger(__name__)
    logging.basicConfig(level=logging.INFO)
    # Add success method for compatibility
    logger.success = logger.info


class TorontoDropInAPI:
    """Parser for Toronto's Drop-in Programs Open Data API."""
    
    # Official Toronto Open Data CKAN endpoints
    DROP_IN_PROGRAMS_URL = "https://ckan0.cf.opendata.inter.prod-toronto.ca/datastore/dump/c99ec04f-4540-482c-9ee4-efb38774eab4"
    LOCATIONS_URL = "https://ckan0.cf.opendata.inter.prod-toronto.ca/datastore/dump/f23ac1ad-6f46-4b59-811f-eb34be9b1f7a"
    FACILITIES_URL = "https://ckan0.cf.opendata.inter.prod-toronto.ca/datastore/dump/e16505dc-f106-4b58-a689-ed0a2b8b0b69"
    
    # Swim activity keywords to filter drop-in programs
    SWIM_KEYWORDS = [
        'lane swim', 'lane swimming', 'lap swim', 'lap swimming',
        'leisure swim', 'recreational swim', 'family swim',
        'adult swim', 'senior swim', 'aquafit', 'aqua fit',
        'water fit', 'aquacise', 'aqua aerobics',
        'public swim', 'open swim', 'drop-in swim'
    ]
    
    # Swim type classification patterns
    SWIM_TYPE_PATTERNS = {
        'LANE_SWIM': [
            r'lane\s+swim', r'lap\s+swim', r'length\s+swim',
            r'adult\s+lane', r'senior\s+lane'
        ],
        'AQUAFIT': [
            r'aqua\s*fit', r'water\s+fit', r'aqua\s*cise',
            r'aqua\s+aerobics', r'water\s+aerobics'
        ],
        'RECREATIONAL': [
            r'leisure\s+swim', r'recreational\s+swim',
            r'family\s+swim', r'public\s+swim', r'open\s+swim'
        ],
        'ADULT_SWIM': [
            r'adult\s+swim', r'adult\s+only'
        ],
        'SENIOR_SWIM': [
            r'senior\s+swim', r'seniors?\s+only', r'older\s+adult'
        ]
    }
    
    def __init__(self, timeout: int = 60):
        """Initialize the API client."""
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'SwimTO/2.0 (Toronto Pool Schedule Aggregator)'
        })
    
    @staticmethod
    def get_field(record: Dict, *field_names) -> str:
        """Get field value trying multiple possible field names."""
        for name in field_names:
            value = record.get(name)
            if value:
                return value
        return ""
    
    def fetch_csv_data(self, url: str) -> List[Dict]:
        """Fetch and parse CSV data from CKAN endpoint."""
        try:
            logger.info(f"Fetching data from {url}")
            # Try with SSL verification first, fall back if needed
            try:
                response = self.session.get(url, timeout=self.timeout, verify=True)
            except requests.exceptions.SSLError:
                logger.warning("SSL verification failed, retrying without verification")
                response = self.session.get(url, timeout=self.timeout, verify=False)
            response.raise_for_status()
            
            # Parse CSV
            csv_data = StringIO(response.text)
            reader = csv.DictReader(csv_data)
            data = list(reader)
            
            logger.success(f"Fetched {len(data)} records")
            return data
        except Exception as e:
            logger.error(f"Error fetching CSV data: {e}")
            return []
    
    def fetch_drop_in_programs(self) -> List[Dict]:
        """Fetch all drop-in programs."""
        return self.fetch_csv_data(self.DROP_IN_PROGRAMS_URL)
    
    def fetch_locations(self) -> Dict[str, Dict]:
        """Fetch locations and index by LocationID."""
        locations_list = self.fetch_csv_data(self.LOCATIONS_URL)
        
        # Index by LocationID for fast lookup
        # Try both field name formats
        locations_dict = {}
        for location in locations_list:
            location_id = location.get('LocationID') or location.get('Location ID') or location.get('_id')
            if location_id:
                locations_dict[location_id] = location
        
        logger.info(f"Indexed {len(locations_dict)} locations")
        return locations_dict
    
    def fetch_facilities(self) -> List[Dict]:
        """Fetch facilities data."""
        return self.fetch_csv_data(self.FACILITIES_URL)
    
    def is_swim_activity(self, course_name: str, category: str = "") -> bool:
        """Determine if a program is swim-related."""
        text = f"{course_name} {category}".lower()
        return any(keyword in text for keyword in self.SWIM_KEYWORDS)
    
    def classify_swim_type(self, course_name: str) -> str:
        """Classify the type of swim activity."""
        text = course_name.lower()
        
        for swim_type, patterns in self.SWIM_TYPE_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    return swim_type
        
        # Default to LANE_SWIM if unclear
        return 'LANE_SWIM'
    
    def filter_swim_activities(self, programs: List[Dict]) -> List[Dict]:
        """Filter programs to only swim-related activities."""
        swim_programs = []
        
        for program in programs:
            # Handle both field name formats
            course_name = self.get_field(program, 'Course Title', 'CourseName', 'Course_Title')
            category = self.get_field(program, 'Category')
            
            if self.is_swim_activity(course_name, category):
                swim_programs.append(program)
        
        logger.info(f"Filtered to {len(swim_programs)} swim programs from {len(programs)} total")
        return swim_programs
    
    def parse_days_of_week(self, schedule_text: str) -> List[int]:
        """
        Parse days of week from schedule text.
        Returns list of weekday integers (0=Monday, 6=Sunday).
        """
        if not schedule_text:
            return []
        
        day_mapping = {
            'monday': 0, 'mon': 0, 'mo': 0,
            'tuesday': 1, 'tue': 1, 'tu': 1,
            'wednesday': 2, 'wed': 2, 'we': 2,
            'thursday': 3, 'thu': 3, 'th': 3,
            'friday': 4, 'fri': 4, 'fr': 4,
            'saturday': 5, 'sat': 5, 'sa': 5,
            'sunday': 6, 'sun': 6, 'su': 6
        }
        
        text = schedule_text.lower()
        days = []
        
        for day_name, day_num in day_mapping.items():
            if day_name in text:
                if day_num not in days:
                    days.append(day_num)
        
        # Sort days
        days.sort()
        return days
    
    def parse_time_string(self, time_str: str) -> Optional[time]:
        """
        Parse time string to time object.
        Handles formats like: "10:00 AM", "10:00AM", "10:00", "22:00"
        """
        if not time_str:
            return None
        
        time_str = time_str.strip().upper()
        
        # Remove spaces between time and AM/PM
        time_str = re.sub(r'\s+(AM|PM)', r'\1', time_str)
        
        # Try different time formats
        formats = [
            '%I:%M%p',    # 10:00AM
            '%I:%M %p',   # 10:00 AM
            '%H:%M',      # 22:00
            '%I%p',       # 10AM
            '%I %p',      # 10 AM
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(time_str, fmt)
                return dt.time()
            except ValueError:
                continue
        
        logger.warning(f"Could not parse time string: {time_str}")
        return None
    
    def parse_time_range(self, schedule_text: str) -> List[Tuple[time, time]]:
        """
        Parse time ranges from schedule text.
        Returns list of (start_time, end_time) tuples.
        
        Examples:
        - "10:00 AM - 11:30 AM"
        - "Monday 6:00AM-7:30AM, Wednesday 6:00AM-7:30AM"
        - "Mon/Wed/Fri 12:00 PM - 1:00 PM"
        """
        if not schedule_text:
            return []
        
        # Pattern to match time ranges like "10:00 AM - 11:30 AM" or "10:00AM-11:30AM"
        time_range_pattern = r'(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[-–to]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)'
        
        time_ranges = []
        matches = re.finditer(time_range_pattern, schedule_text, re.IGNORECASE)
        
        for match in matches:
            start_str = match.group(1)
            end_str = match.group(2)
            
            # If end time doesn't have AM/PM, inherit from start time
            if not re.search(r'(AM|PM)', end_str, re.IGNORECASE):
                am_pm_match = re.search(r'(AM|PM)', start_str, re.IGNORECASE)
                if am_pm_match:
                    end_str += ' ' + am_pm_match.group(1)
            
            start_time = self.parse_time_string(start_str)
            end_time = self.parse_time_string(end_str)
            
            if start_time and end_time:
                # Validate time range
                if end_time > start_time:
                    time_ranges.append((start_time, end_time))
                else:
                    logger.warning(f"Invalid time range: {start_str} - {end_str}")
        
        return time_ranges
    
    def parse_date_range(self, start_date_str: str, end_date_str: str) -> Tuple[Optional[date], Optional[date]]:
        """Parse start and end dates from strings."""
        date_formats = ['%Y-%m-%d', '%m/%d/%Y', '%d-%m-%Y', '%Y/%m/%d']
        
        start_date = None
        end_date = None
        
        # Parse start date
        if start_date_str:
            for fmt in date_formats:
                try:
                    start_date = datetime.strptime(start_date_str.strip(), fmt).date()
                    break
                except ValueError:
                    continue
        
        # Parse end date
        if end_date_str:
            for fmt in date_formats:
                try:
                    end_date = datetime.strptime(end_date_str.strip(), fmt).date()
                    break
                except ValueError:
                    continue
        
        return start_date, end_date
    
    def generate_session_dates(
        self, 
        days_of_week: List[int],
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        weeks_ahead: int = 4
    ) -> List[date]:
        """
        Generate list of dates for sessions based on days of week and date range.
        
        Args:
            days_of_week: List of weekday integers (0=Monday, 6=Sunday)
            start_date: Program start date (defaults to today)
            end_date: Program end date (defaults to start + weeks_ahead)
            weeks_ahead: Number of weeks to generate if no end_date
        """
        if not days_of_week:
            return []
        
        today = date.today()
        
        # Default start date is today
        if not start_date or start_date < today:
            start_date = today
        
        # Default end date is weeks_ahead from start
        if not end_date:
            end_date = start_date + timedelta(weeks=weeks_ahead)
        
        # Generate dates
        session_dates = []
        current_date = start_date
        
        while current_date <= end_date:
            if current_date.weekday() in days_of_week:
                session_dates.append(current_date)
            current_date += timedelta(days=1)
        
        return session_dates
    
    def parse_schedule_to_sessions(
        self,
        program: Dict,
        location: Optional[Dict] = None,
        weeks_ahead: int = 4
    ) -> List[Dict]:
        """
        Parse a program into individual session dictionaries.
        
        Returns list of session data dictionaries with keys:
        - facility_name, course_name, swim_type, date, start_time, end_time, notes
        """
        sessions = []
        
        # Handle both field name formats
        course_name = self.get_field(program, 'Course Title', 'CourseName', 'Course_Title')
        swim_type = self.classify_swim_type(course_name)
        
        # Parse schedule information
        schedule_text = self.get_field(program, 'Schedule', 'Days', 'Day')
        days_of_week = self.parse_days_of_week(schedule_text)
        time_ranges = self.parse_time_range(schedule_text)
        
        if not days_of_week or not time_ranges:
            logger.debug(f"Could not parse schedule for: {course_name} - {schedule_text}")
            return []
        
        # Parse date range
        start_date_str = self.get_field(program, 'Start Date', 'StartDate', 'Date Range')
        end_date_str = self.get_field(program, 'End Date', 'EndDate')
        start_date, end_date = self.parse_date_range(start_date_str, end_date_str)
        
        # Generate session dates
        session_dates = self.generate_session_dates(
            days_of_week, start_date, end_date, weeks_ahead
        )
        
        # Get location/facility info
        location_id = self.get_field(program, 'Location ID', 'LocationID', 'Location_ID')
        facility_name = self.get_field(program, 'Location Name', 'LocationName', 'Location_Name')
        if location:
            facility_name = self.get_field(location, 'Location Name', 'LocationName', 'Location_Name') or facility_name
        
        # Build notes
        notes_parts = []
        age_min = self.get_field(program, 'Age Min', 'AgeMin', 'Age_Min')
        age_max = self.get_field(program, 'Age Max', 'AgeMax', 'Age_Max')
        if age_min or age_max:
            notes_parts.append(f"Age: {age_min}-{age_max}" if age_max else f"Age: {age_min}+")
        category = self.get_field(program, 'Category')
        if category:
            notes_parts.append(f"Category: {category}")
        notes = '; '.join(notes_parts) if notes_parts else None
        
        # Create session for each date and time slot
        for session_date in session_dates:
            for start_time, end_time in time_ranges:
                session_data = {
                    'facility_name': facility_name,
                    'location_id': location_id,
                    'course_name': course_name,
                    'course_id': self.get_field(program, 'Course_ID', 'CourseID', 'Course ID'),
                    'swim_type': swim_type,
                    'date': session_date,
                    'start_time': start_time,
                    'end_time': end_time,
                    'notes': notes,
                    'source': 'toronto_open_data',
                    'source_url': self.DROP_IN_PROGRAMS_URL,
                    'raw_program': program
                }
                sessions.append(session_data)
        
        return sessions
    
    def match_facility(
        self,
        location_name: str,
        location_id: str,
        location_data: Optional[Dict],
        existing_facilities: List
    ) -> Optional[str]:
        """
        Match a location from the API to an existing facility in our database.
        
        Returns facility_id if match found, None otherwise.
        """
        if not location_name:
            return None
        
        location_name_lower = location_name.lower().strip()
        
        # Try exact match first
        for facility in existing_facilities:
            if facility.name.lower().strip() == location_name_lower:
                return facility.facility_id
        
        # Try partial match (fuzzy)
        # Remove common suffixes/variations
        clean_name = location_name_lower
        clean_name = re.sub(r'\s+(community\s+)?centre?$', '', clean_name)
        clean_name = re.sub(r'\s+pool$', '', clean_name)
        clean_name = re.sub(r'\s+recreation$', '', clean_name)
        clean_name = clean_name.strip()
        
        for facility in existing_facilities:
            facility_name_lower = facility.name.lower()
            
            # Check if core names match
            if clean_name in facility_name_lower or facility_name_lower.split()[0] in clean_name:
                logger.debug(f"Fuzzy matched '{location_name}' to '{facility.name}'")
                return facility.facility_id
        
        # Check if we have address info for better matching
        if location_data:
            address = location_data.get('Address', '')
            postal_code = location_data.get('PostalCode', '')
            
            for facility in existing_facilities:
                if postal_code and facility.postal_code:
                    if postal_code.replace(' ', '').upper() == facility.postal_code.replace(' ', '').upper():
                        logger.debug(f"Matched by postal code: '{location_name}' to '{facility.name}'")
                        return facility.facility_id
        
        logger.warning(f"No facility match found for: {location_name} (ID: {location_id})")
        return None
    
    @staticmethod
    def generate_session_hash(facility_id: str, session_date: date, start_time: time, swim_type: str) -> str:
        """Generate unique hash for session deduplication."""
        content = f"{facility_id}:{session_date}:{start_time}:{swim_type}"
        return hashlib.sha256(content.encode()).hexdigest()

