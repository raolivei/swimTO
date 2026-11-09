"""Parser for Toronto pools.xml file."""
from .base_source import BaseSwimSource, FacilityData, SessionData
from typing import List, Dict, Optional
from dataclasses import replace
from .toronto_pools_data import TorontoCuratedSource
import requests
from loguru import logger
import xml.etree.ElementTree as ET


class TorontoXMLSource(BaseSwimSource):
    """Source for facility metadata from pools.xml."""

    city = "Toronto"
    region = "Toronto"
    provides_sessions = False

    def __init__(self):
        self.parser = PoolsXMLParser()

    def fetch_facilities(self) -> List[FacilityData]:
        """Fetch and parse facilities from pools.xml."""
        raw_facilities = self.parser.fetch_and_parse()
        facilities = []
        by_name = {facility.name.casefold(): facility for facility in TorontoCuratedSource().fetch_facilities()}
        for f in raw_facilities:
            name = f.get('name', '')
            curated = by_name.get(name.casefold())
            if curated:
                # Keep stable public IDs and authoritative curated pool flags.
                updates = {key: f[key] for key in (
                    'address', 'postal_code', 'district', 'latitude', 'longitude', 'phone', 'website'
                ) if f.get(key) is not None and f.get(key) != ''}
                facilities.append(replace(curated, **updates, source='pools_xml'))
                continue
            if not name:
                continue
            is_indoor = f.get('is_indoor', True)
            facilities.append(FacilityData(
                facility_id=name.lower().replace(' ', '-').replace("'", '').replace('.', ''),
                name=f.get('name', ''),
                city=self.city,
                address=f.get('address'),
                postal_code=f.get('postal_code'),
                district=f.get('district'),
                latitude=f.get('latitude'),
                longitude=f.get('longitude'),
                is_indoor=is_indoor,
                has_indoor=is_indoor,
                has_outdoor=not is_indoor,
                phone=f.get('phone'),
                website=f.get('website'),
                source='pools_xml',
                raw=f
            ))
        return facilities

    def fetch_sessions(self, facility_id: str, weeks: int = 4) -> List[SessionData]:
        """XML source does not provide schedules."""
        return []

class PoolsXMLParser:
    """Parser for pools.xml facility metadata."""
    
    # Known pools.xml URL from Toronto Open Data
    DEFAULT_XML_URL = "https://www.toronto.ca/data/parks/prd/facilities/recreationcentres/index.xml"
    
    def __init__(self, xml_url: Optional[str] = None):
        self.xml_url = xml_url or self.DEFAULT_XML_URL
        
    def fetch_and_parse(self) -> List[Dict]:
        """Fetch and parse pools.xml."""
        try:
            logger.info(f"Fetching pools.xml from {self.xml_url}")
            response = requests.get(self.xml_url, timeout=30)
            response.raise_for_status()
            
            return self.parse_xml(response.content)
        except Exception as e:
            logger.error(f"Error fetching pools.xml: {e}")
            return []
    
    def parse_xml(self, xml_content: bytes) -> List[Dict]:
        """Parse XML content."""
        facilities = []
        
        try:
            root = ET.fromstring(xml_content)
            
            # Navigate the XML structure (adjust based on actual structure)
            for facility_elem in root.findall('.//facility'):
                facility = self._parse_facility_element(facility_elem)
                if facility:
                    facilities.append(facility)
            
            logger.info(f"Parsed {len(facilities)} facilities from XML")
        except Exception as e:
            logger.error(f"Error parsing XML: {e}")
        
        return facilities
    
    def _parse_facility_element(self, elem) -> Optional[Dict]:
        """Parse a single facility XML element."""
        try:
            return {
                "facility_id": self._get_text(elem, 'id'),
                "name": self._get_text(elem, 'name'),
                "address": self._get_text(elem, 'address'),
                "postal_code": self._get_text(elem, 'postalcode'),
                "district": self._get_text(elem, 'district'),
                "latitude": self._get_float(elem, 'latitude'),
                "longitude": self._get_float(elem, 'longitude'),
                "phone": self._get_text(elem, 'phone'),
                "website": self._get_text(elem, 'website'),
                "type": self._get_text(elem, 'type'),
                "is_indoor": self._parse_indoor(elem)
            }
        except Exception as e:
            logger.debug(f"Error parsing facility element: {e}")
            return None
    
    def _get_text(self, elem, tag: str, default: str = "") -> str:
        """Safely get text from XML element."""
        child = elem.find(tag)
        return child.text.strip() if child is not None and child.text else default
    
    def _get_float(self, elem, tag: str, default: float = None) -> Optional[float]:
        """Safely get float from XML element."""
        text = self._get_text(elem, tag)
        try:
            return float(text) if text else default
        except ValueError:
            return default
    
    def _parse_indoor(self, elem) -> bool:
        """Determine if facility is indoor."""
        type_text = self._get_text(elem, 'type', '').lower()
        name = self._get_text(elem, 'name', '').lower()
        
        # Assume indoor unless explicitly outdoor
        outdoor_keywords = ['outdoor', 'splash pad', 'wading']
        is_outdoor = any(kw in type_text or kw in name for kw in outdoor_keywords)
        
        return not is_outdoor

