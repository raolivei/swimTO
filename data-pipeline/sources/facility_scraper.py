"""Scraper for facility web pages."""
import re
import hashlib
from datetime import datetime, timedelta, time as time_type, date as date_type
from typing import List, Dict, Optional, Tuple
from bs4 import BeautifulSoup
import requests
from loguru import logger


class FacilityScraper:
    """Scrapes facility pages for swim schedules."""
    
    def __init__(self, base_url: str = "https://www.toronto.ca"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (compatible; SwimTO/1.0; +https://github.com/raolivei/swimTO)"
        })
    
    def scrape_facility_page(self, url: str) -> Optional[Dict]:
        """Scrape a single facility page."""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract facility info
            facility_data = {
                "url": url,
                "name": self._extract_name(soup),
                "address": self._extract_address(soup),
                "phone": self._extract_phone(soup),
                "sessions": self._extract_sessions(soup)
            }
            
            return facility_data
        except Exception as e:
            logger.error(f"Error scraping facility page '{url}': {e}")
            return None
    
    def _extract_name(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract facility name."""
        # Try h1 first
        h1 = soup.find('h1')
        if h1:
            return h1.get_text(strip=True)
        
        # Try title
        title = soup.find('title')
        if title:
            text = title.get_text(strip=True)
            # Remove " - City of Toronto" suffix
            return re.sub(r'\s*-\s*City of Toronto.*$', '', text)
        
        return None
    
    def _extract_address(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract facility address."""
        # Look for address patterns
        address_patterns = [
            r'\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd))',
        ]
        
        text = soup.get_text()
        for pattern in address_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0)
        
        return None
    
    def _extract_phone(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract phone number."""
        phone_pattern = r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        text = soup.get_text()
        match = re.search(phone_pattern, text)
        return match.group(0) if match else None
    
    def _extract_sessions(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract swim sessions from page."""
        sessions = []
        
        # Look for weekly schedule tables
        tables = soup.find_all('table')
        for table in tables:
            # Check if this is a schedule table
            if self._is_schedule_table(table):
                sessions.extend(self._parse_schedule_table(table))
        
        # Look for "For the week of..." patterns
        week_headers = soup.find_all(text=re.compile(r'For the week of', re.IGNORECASE))
        for header in week_headers:
            parent = header.parent
            if parent:
                sessions.extend(self._parse_week_section(parent))
        
        return sessions
    
    def _is_schedule_table(self, table) -> bool:
        """Check if table contains schedule data."""
        text = table.get_text().lower()
        keywords = ['swim', 'lane', 'time', 'monday', 'tuesday', 'wednesday']
        return sum(1 for kw in keywords if kw in text) >= 3
    
    def _parse_schedule_table(self, table) -> List[Dict]:
        """Parse a schedule table."""
        sessions = []
        rows = table.find_all('tr')
        
        for row in rows[1:]:  # Skip header
            cells = row.find_all(['td', 'th'])
            if len(cells) >= 3:
                session = self._parse_row_cells(cells)
                if session:
                    sessions.append(session)
        
        return sessions
    
    def _parse_row_cells(self, cells) -> Optional[Dict]:
        """Parse table row cells into session."""
        try:
            # Try to extract day, time, and type
            day_text = cells[0].get_text(strip=True)
            time_text = cells[1].get_text(strip=True)
            type_text = cells[2].get_text(strip=True) if len(cells) > 2 else ""
            
            # Parse time range
            time_match = re.search(r'(\d{1,2}):(\d{2})\s*(am|pm)?\s*-\s*(\d{1,2}):(\d{2})\s*(am|pm)?', 
                                 time_text, re.IGNORECASE)
            if time_match:
                return {
                    "day": day_text,
                    "time_text": time_text,
                    "swim_type": self._normalize_swim_type(type_text),
                    "raw": {
                        "day": day_text,
                        "time": time_text,
                        "type": type_text
                    }
                }
        except Exception as e:
            logger.debug(f"Error parsing row: {e}")
        
        return None
    
    def _parse_week_section(self, element) -> List[Dict]:
        """Parse a 'For the week of...' section."""
        # This would require more sophisticated parsing
        # For now, return empty
        return []
    
    def _normalize_swim_type(self, text: str) -> str:
        """Normalize swim type."""
        text_lower = text.lower()
        
        if 'lane' in text_lower:
            return "LANE_SWIM"
        elif 'recreation' in text_lower or 'family' in text_lower:
            return "RECREATIONAL"
        elif 'adult' in text_lower:
            return "ADULT_SWIM"
        elif 'senior' in text_lower:
            return "SENIOR_SWIM"
        else:
            return "OTHER"
    
    @staticmethod
    def parse_time_text(time_text: str) -> Optional[Tuple[time_type, time_type]]:
        """
        Parse time range text like '7:00 am - 8:30 am' into start and end time objects.
        
        Returns:
            Tuple of (start_time, end_time) or None if parsing fails
        """
        try:
            # Pattern for time ranges like "7:00 am - 8:30 am" or "7:00 - 8:30 am"
            pattern = r'(\d{1,2}):(\d{2})\s*(am|pm)?\s*-\s*(\d{1,2}):(\d{2})\s*(am|pm)?'
            match = re.search(pattern, time_text.lower())
            
            if not match:
                return None
            
            start_hour = int(match.group(1))
            start_min = int(match.group(2))
            start_period = match.group(3) or match.group(6)  # If first time has no am/pm, use second
            
            end_hour = int(match.group(4))
            end_min = int(match.group(5))
            end_period = match.group(6) or match.group(3)  # If second time has no am/pm, use first
            
            # Convert to 24-hour format
            if start_period and 'pm' in start_period and start_hour != 12:
                start_hour += 12
            elif start_period and 'am' in start_period and start_hour == 12:
                start_hour = 0
                
            if end_period and 'pm' in end_period and end_hour != 12:
                end_hour += 12
            elif end_period and 'am' in end_period and end_hour == 12:
                end_hour = 0
            
            start_time = time_type(start_hour, start_min)
            end_time = time_type(end_hour, end_min)
            
            return start_time, end_time
        except Exception as e:
            logger.debug(f"Error parsing time text '{time_text}': {e}")
            return None
    
    @staticmethod
    def day_name_to_dates(day_name: str, weeks_ahead: int = 4) -> List[date_type]:
        """
        Convert a day name (e.g., 'Monday') to a list of upcoming dates.
        
        Args:
            day_name: Name of the day (Monday, Tuesday, etc.)
            weeks_ahead: How many weeks ahead to generate dates for
            
        Returns:
            List of date objects for that day of the week
        """
        day_mapping = {
            'monday': 0, 'mon': 0,
            'tuesday': 1, 'tue': 1, 'tues': 1,
            'wednesday': 2, 'wed': 2,
            'thursday': 3, 'thu': 3, 'thur': 3, 'thurs': 3,
            'friday': 4, 'fri': 4,
            'saturday': 5, 'sat': 5,
            'sunday': 6, 'sun': 6
        }
        
        day_name_lower = day_name.lower().strip()
        target_weekday = day_mapping.get(day_name_lower)
        
        if target_weekday is None:
            logger.warning(f"Unknown day name: {day_name}")
            return []
        
        dates = []
        today = date_type.today()
        current_weekday = today.weekday()
        
        # Calculate days until the target weekday
        days_ahead = (target_weekday - current_weekday) % 7
        if days_ahead == 0:
            # If today is the target day, include it
            days_ahead = 0
        
        # Generate dates for the next N weeks
        for week in range(weeks_ahead):
            target_date = today + timedelta(days=days_ahead + (week * 7))
            dates.append(target_date)
        
        return dates
    
    @staticmethod
    def generate_session_hash(facility_id: str, date: str, start_time: str, swim_type: str) -> str:
        """Generate unique hash for session deduplication."""
        content = f"{facility_id}:{date}:{start_time}:{swim_type}"
        return hashlib.sha256(content.encode()).hexdigest()

