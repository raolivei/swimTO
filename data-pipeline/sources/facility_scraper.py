"""Scraper for facility web pages."""
import re
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Optional
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
    def generate_session_hash(facility_id: str, date: str, start_time: str, swim_type: str) -> str:
        """Generate unique hash for session deduplication."""
        content = f"{facility_id}:{date}:{start_time}:{swim_type}"
        return hashlib.sha256(content.encode()).hexdigest()

