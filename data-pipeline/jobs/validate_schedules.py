#!/usr/bin/env python3
"""
Validation script to compare app schedules against live sources.

This script spot-checks 2-3 representative facilities to ensure
the data pipeline is working correctly and schedules match live sources.
"""
import sys
from pathlib import Path
from datetime import datetime, date, timedelta
from typing import Dict, List, Set, Tuple

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import settings
from models import Base, Facility, Session
from sources.toronto_drop_in_api import TorontoDropInAPI
from sources.toronto_parks_json_api import TorontoParksJSONAPI
from sources.curated_json_facilities import get_json_api_facilities


# Test facilities - mix of different data sources
TEST_FACILITIES = {
    "regent-park-aquatic-centre": {
        "name": "Regent Park Aquatic Centre",
        "source": "toronto_open_data",
        "priority": "LANE_SWIM"
    },
    "norseman-community-school-and-pool": {
        "name": "Norseman Community School and Pool",
        "source": "toronto_parks_json_api",
        "priority": "LANE_SWIM"
    }
}


class ScheduleValidator:
    """Validates app schedules against live sources."""
    
    def __init__(self, db_session):
        self.db_session = db_session
        self.toronto_api = TorontoDropInAPI()
        self.json_api = TorontoParksJSONAPI()
        self.json_facilities = get_json_api_facilities()
        
        # Fetch Toronto API data once
        logger.info("Fetching Toronto Open Data API programs...")
        self.programs = self.toronto_api.fetch_drop_in_programs()
        self.locations = self.toronto_api.fetch_locations()
        self.swim_programs = self.toronto_api.filter_swim_activities(self.programs)
        
    def validate_all(self) -> bool:
        """
        Validate all test facilities.
        
        Returns:
            True if all validations pass, False otherwise
        """
        logger.info("=" * 60)
        logger.info("Starting schedule validation")
        logger.info("=" * 60)
        
        all_passed = True
        results = []
        
        for facility_id, config in TEST_FACILITIES.items():
            logger.info(f"\nValidating: {config['name']}")
            logger.info("-" * 60)
            
            passed, stats = self.validate_facility(facility_id, config)
            results.append((config['name'], passed, stats))
            
            if not passed:
                all_passed = False
        
        # Print summary
        logger.info("\n" + "=" * 60)
        logger.info("VALIDATION SUMMARY")
        logger.info("=" * 60)
        
        for name, passed, stats in results:
            status = "✓ PASS" if passed else "✗ FAIL"
            logger.info(f"{status} | {name}")
            logger.info(f"       Matched: {stats['matched']}, Missing: {stats['missing']}, Extra: {stats['extra']}")
        
        logger.info("=" * 60)
        
        if all_passed:
            logger.success("✓ All validations passed!")
            return True
        else:
            logger.error("✗ Some validations failed")
            return False
    
    def validate_facility(self, facility_id: str, config: Dict) -> Tuple[bool, Dict]:
        """
        Validate a single facility.
        
        Returns:
            (passed, stats) where stats contains matched/missing/extra counts
        """
        source = config['source']
        priority_type = config.get('priority', 'LANE_SWIM')
        
        # Fetch live schedule
        live_sessions = self.fetch_live_schedule(facility_id, source)
        
        if not live_sessions:
            logger.warning("No live sessions found - cannot validate")
            return False, {"matched": 0, "missing": 0, "extra": 0}
        
        # Filter for priority swim type
        live_sessions = [s for s in live_sessions if s['swim_type'] == priority_type]
        
        logger.info(f"Found {len(live_sessions)} live {priority_type} sessions")
        
        # Fetch database schedule (next 7 days only)
        db_sessions = self.fetch_db_schedule(facility_id, days_ahead=7)
        db_sessions = [s for s in db_sessions if s['swim_type'] == priority_type]
        
        logger.info(f"Found {len(db_sessions)} database {priority_type} sessions")
        
        # Compare schedules
        matched, missing, extra = self.compare_schedules(live_sessions, db_sessions)
        
        stats = {
            "matched": len(matched),
            "missing": len(missing),
            "extra": len(extra)
        }
        
        # Report results
        if missing:
            logger.warning(f"Missing {len(missing)} sessions from database:")
            for session in missing[:5]:  # Show first 5
                logger.warning(f"  - {session['date']} {session['start_time']}-{session['end_time']} {session['swim_type']}")
            if len(missing) > 5:
                logger.warning(f"  ... and {len(missing) - 5} more")
        
        if extra:
            logger.warning(f"Found {len(extra)} extra sessions in database:")
            for session in extra[:5]:  # Show first 5
                logger.warning(f"  + {session['date']} {session['start_time']}-{session['end_time']} {session['swim_type']}")
            if len(extra) > 5:
                logger.warning(f"  ... and {len(extra) - 5} more")
        
        if not missing and not extra:
            logger.success(f"✓ All {len(matched)} sessions matched!")
        
        # Consider it a pass if we have most sessions correct (90%+ match rate)
        total = len(live_sessions)
        match_rate = len(matched) / total if total > 0 else 0
        passed = match_rate >= 0.9 and len(missing) <= 2
        
        return passed, stats
    
    def fetch_live_schedule(self, facility_id: str, source: str) -> List[Dict]:
        """Fetch live schedule from source."""
        if source == "toronto_open_data":
            return self._fetch_from_open_data(facility_id)
        elif source == "toronto_parks_json_api":
            return self._fetch_from_json_api(facility_id)
        else:
            logger.error(f"Unknown source: {source}")
            return []
    
    def _fetch_from_open_data(self, facility_id: str) -> List[Dict]:
        """Fetch schedule from Toronto Open Data API."""
        sessions = []
        
        # Get facility from DB to match by name
        facility = self.db_session.query(Facility).filter_by(facility_id=facility_id).first()
        if not facility:
            logger.error(f"Facility not found in database: {facility_id}")
            return []
        
        # Find matching programs
        for program in self.swim_programs:
            location_id = self.toronto_api.get_field(program, 'Location ID', 'LocationID', 'Location_ID')
            location = self.locations.get(location_id)
            
            # Parse sessions
            program_sessions = self.toronto_api.parse_schedule_to_sessions(
                program,
                location,
                weeks_ahead=1  # Only next week for validation
            )
            
            if not program_sessions:
                continue
            
            # Check if this matches our facility
            facility_name = program_sessions[0]['facility_name']
            matched_id = self.toronto_api.match_facility(
                facility_name,
                location_id,
                location,
                [facility]
            )
            
            if matched_id == facility_id:
                sessions.extend(program_sessions)
        
        return sessions
    
    def _fetch_from_json_api(self, facility_id: str) -> List[Dict]:
        """Fetch schedule from Toronto Parks JSON API."""
        facility_info = self.json_facilities.get(facility_id)
        if not facility_info:
            logger.error(f"Facility not configured for JSON API: {facility_id}")
            return []
        
        location_id = facility_info['location_id']
        
        try:
            sessions = self.json_api.fetch_facility_schedule(location_id, weeks_ahead=1)
            return sessions
        except Exception as e:
            logger.error(f"Error fetching from JSON API: {e}")
            return []
    
    def fetch_db_schedule(self, facility_id: str, days_ahead: int = 7) -> List[Dict]:
        """Fetch schedule from database."""
        today = date.today()
        end_date = today + timedelta(days=days_ahead)
        
        sessions = self.db_session.query(Session).filter(
            Session.facility_id == facility_id,
            Session.date >= today,
            Session.date <= end_date
        ).all()
        
        return [
            {
                "facility_id": s.facility_id,
                "swim_type": s.swim_type,
                "date": str(s.date),
                "start_time": str(s.start_time),
                "end_time": str(s.end_time),
            }
            for s in sessions
        ]
    
    def compare_schedules(self, live_sessions: List[Dict], db_sessions: List[Dict]) -> Tuple[Set, List, List]:
        """
        Compare live and database schedules.
        
        Returns:
            (matched_keys, missing_sessions, extra_sessions)
        """
        # Create session keys for comparison
        def make_key(session):
            return (
                session['date'],
                session['start_time'],
                session['swim_type']
            )
        
        live_keys = {make_key(s): s for s in live_sessions}
        db_keys = {make_key(s): s for s in db_sessions}
        
        matched = live_keys.keys() & db_keys.keys()
        missing_keys = live_keys.keys() - db_keys.keys()
        extra_keys = db_keys.keys() - live_keys.keys()
        
        missing = [live_keys[k] for k in missing_keys]
        extra = [db_keys[k] for k in extra_keys]
        
        return matched, missing, extra


def setup_logging():
    """Configure logging."""
    logger.remove()
    logger.add(
        sys.stderr,
        level="INFO",
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>"
    )


def setup_database():
    """Set up database connection."""
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()


def main():
    """Main entry point."""
    setup_logging()
    
    db_session = setup_database()
    
    try:
        validator = ScheduleValidator(db_session)
        success = validator.validate_all()
        
        sys.exit(0 if success else 1)
        
    except Exception as e:
        logger.exception(f"Error during validation: {e}")
        sys.exit(1)
    finally:
        db_session.close()


if __name__ == "__main__":
    main()
