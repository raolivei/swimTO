"""
Enhanced Toronto Open Data Parser with Advanced Features.

This module extends the basic parser with:
- XLSX/CSV parsing with pandas and openpyxl
- Advanced schedule aggregation and analysis
- Conflict detection and validation
- Smart facility recommendations
- Data quality metrics and reporting
- Performance optimization with caching
"""

import re
import hashlib
from datetime import datetime, date, time, timedelta
from typing import List, Dict, Optional, Tuple, Set
from collections import defaultdict
from io import BytesIO

import requests
import pandas as pd
from loguru import logger

from .toronto_drop_in_api import TorontoDropInAPI


class EnhancedDataParser(TorontoDropInAPI):
    """
    Enhanced parser with advanced data manipulation and analysis capabilities.
    
    Builds on TorontoDropInAPI with:
    - Multi-format data parsing (CSV, XLSX, JSON)
    - Schedule conflict detection and resolution
    - Smart facility matching with scoring
    - Data quality validation and reporting
    - Schedule optimization and recommendations
    - Performance metrics and caching
    """
    
    def __init__(self, timeout: int = 60):
        """Initialize enhanced parser."""
        super().__init__(timeout)
        
        # Analytics and caching
        self.parse_stats = {
            'total_programs': 0,
            'swim_programs': 0,
            'sessions_generated': 0,
            'facilities_matched': 0,
            'facilities_unmatched': 0,
            'parsing_errors': 0,
            'data_quality_issues': []
        }
        
        self._facility_cache = {}
        self._location_cache = {}
    
    # ================== Multi-Format Data Loading ==================
    
    def fetch_xlsx_data(self, url: str, sheet_name: str = 0) -> pd.DataFrame:
        """
        Fetch and parse XLSX data from URL.
        
        Args:
            url: URL to XLSX file
            sheet_name: Sheet name or index to parse
            
        Returns:
            DataFrame with parsed data
        """
        try:
            logger.info(f"Fetching XLSX from {url}")
            
            try:
                response = self.session.get(url, timeout=self.timeout, verify=True)
            except requests.exceptions.SSLError:
                logger.warning("SSL verification failed, retrying without verification")
                response = self.session.get(url, timeout=self.timeout, verify=False)
            
            response.raise_for_status()
            
            # Parse XLSX
            df = pd.read_excel(BytesIO(response.content), sheet_name=sheet_name, engine='openpyxl')
            
            logger.success(f"Loaded {len(df)} rows from XLSX")
            return df
            
        except Exception as e:
            logger.error(f"Error fetching XLSX: {e}")
            return pd.DataFrame()
    
    def fetch_all_formats(self) -> Dict[str, pd.DataFrame]:
        """
        Fetch data in all available formats and return as DataFrames.
        
        Returns:
            Dictionary with keys: 'drop_in', 'locations', 'facilities'
        """
        data = {}
        
        # Try CSV first (faster)
        logger.info("Fetching data from CKAN API...")
        
        # Drop-in programs
        drop_in = self.fetch_drop_in_programs()
        data['drop_in'] = pd.DataFrame(drop_in) if drop_in else pd.DataFrame()
        
        # Locations
        locations_dict = self.fetch_locations()
        data['locations'] = pd.DataFrame(list(locations_dict.values())) if locations_dict else pd.DataFrame()
        
        # Facilities
        facilities = self.fetch_facilities()
        data['facilities'] = pd.DataFrame(facilities) if facilities else pd.DataFrame()
        
        # Log summary
        for key, df in data.items():
            logger.info(f"Loaded {len(df)} {key} records")
        
        return data
    
    # ================== Advanced Filtering and Classification ==================
    
    def classify_swim_activity_advanced(self, course_name: str, category: str = "") -> Dict[str, any]:
        """
        Enhanced swim activity classification with confidence scoring.
        
        Returns:
            {
                'is_swim': bool,
                'swim_type': str,
                'confidence': float (0-1),
                'tags': List[str],
                'age_group': str (optional)
            }
        """
        text = f"{course_name} {category}".lower()
        
        # Check if swim activity
        is_swim = self.is_swim_activity(course_name, category)
        if not is_swim:
            return {
                'is_swim': False,
                'swim_type': None,
                'confidence': 0.0,
                'tags': [],
                'age_group': None
            }
        
        # Classify swim type with confidence
        swim_type = None
        confidence = 0.0
        
        for stype, patterns in self.SWIM_TYPE_PATTERNS.items():
            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    # Calculate confidence based on match quality
                    match_length = len(match.group(0))
                    text_length = len(course_name)
                    pattern_confidence = min(1.0, match_length / text_length * 2)
                    
                    if pattern_confidence > confidence:
                        swim_type = stype
                        confidence = pattern_confidence
        
        # Default to LANE_SWIM if no specific type found
        if not swim_type:
            swim_type = 'LANE_SWIM'
            confidence = 0.5
        
        # Extract tags
        tags = []
        if 'adult' in text:
            tags.append('adults_only')
        if 'senior' in text:
            tags.append('seniors')
        if 'family' in text:
            tags.append('family_friendly')
        if 'deep' in text:
            tags.append('deep_water')
        if 'shallow' in text:
            tags.append('shallow_water')
        
        # Detect age group
        age_group = None
        if re.search(r'\b(child|kid|youth)\b', text):
            age_group = 'youth'
        elif re.search(r'\b(adult|19\+|18\+)\b', text):
            age_group = 'adult'
        elif re.search(r'\b(senior|55\+|60\+|65\+)\b', text):
            age_group = 'senior'
        elif re.search(r'\bfamily\b', text):
            age_group = 'family'
        
        return {
            'is_swim': True,
            'swim_type': swim_type,
            'confidence': confidence,
            'tags': tags,
            'age_group': age_group
        }
    
    def filter_swim_programs_advanced(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Advanced filtering with classification metadata.
        
        Args:
            df: DataFrame with program data
            
        Returns:
            Filtered DataFrame with additional classification columns
        """
        if df.empty:
            return df
        
        # Get course name and category columns (handle different naming)
        course_col = None
        for col in ['Course Title', 'CourseName', 'Course_Title']:
            if col in df.columns:
                course_col = col
                break
        
        category_col = 'Category' if 'Category' in df.columns else None
        
        if not course_col:
            logger.error("Could not find course name column in DataFrame")
            return pd.DataFrame()
        
        # Apply classification
        classifications = []
        for _, row in df.iterrows():
            course_name = str(row.get(course_col, ''))
            category = str(row.get(category_col, '')) if category_col else ''
            
            classification = self.classify_swim_activity_advanced(course_name, category)
            classifications.append(classification)
        
        # Add classification columns
        class_df = pd.DataFrame(classifications)
        result_df = pd.concat([df, class_df], axis=1)
        
        # Filter to swim activities only
        swim_df = result_df[result_df['is_swim'] == True].copy()
        
        logger.info(f"Filtered to {len(swim_df)} swim programs from {len(df)} total")
        self.parse_stats['total_programs'] = len(df)
        self.parse_stats['swim_programs'] = len(swim_df)
        
        return swim_df
    
    # ================== Schedule Analysis and Conflict Detection ==================
    
    def analyze_schedule_coverage(self, sessions: List[Dict]) -> Dict[str, any]:
        """
        Analyze schedule coverage across time and facilities.
        
        Returns:
            {
                'total_sessions': int,
                'facilities_count': int,
                'date_range': (date, date),
                'coverage_by_day': Dict[int, int],  # weekday -> count
                'coverage_by_hour': Dict[int, int],  # hour -> count
                'peak_times': List[Tuple[int, int]],  # (hour, count)
                'gaps': List[Dict],  # identified gaps in coverage
            }
        """
        if not sessions:
            return {}
        
        # Aggregate data
        facilities = set()
        dates = []
        day_counts = defaultdict(int)
        hour_counts = defaultdict(int)
        
        for session in sessions:
            facilities.add(session['facility_name'])
            dates.append(session['date'])
            day_counts[session['date'].weekday()] += 1
            hour_counts[session['start_time'].hour] += 1
        
        # Calculate metrics
        dates.sort()
        peak_times = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Identify gaps (hours with no coverage)
        all_hours = set(range(6, 23))  # 6 AM to 10 PM
        covered_hours = set(hour_counts.keys())
        gap_hours = all_hours - covered_hours
        
        gaps = [
            {
                'type': 'time_gap',
                'hour': hour,
                'description': f"No sessions at {hour}:00"
            }
            for hour in sorted(gap_hours)
        ]
        
        # Identify days with low coverage
        avg_sessions_per_day = sum(day_counts.values()) / len(day_counts) if day_counts else 0
        for day, count in day_counts.items():
            if count < avg_sessions_per_day * 0.5:
                day_name = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day]
                gaps.append({
                    'type': 'low_coverage',
                    'day': day,
                    'count': count,
                    'description': f"Low coverage on {day_name} ({count} sessions vs {avg_sessions_per_day:.1f} avg)"
                })
        
        return {
            'total_sessions': len(sessions),
            'facilities_count': len(facilities),
            'date_range': (dates[0], dates[-1]),
            'coverage_by_day': dict(day_counts),
            'coverage_by_hour': dict(hour_counts),
            'peak_times': peak_times,
            'gaps': gaps,
        }
    
    def detect_schedule_conflicts(self, sessions: List[Dict]) -> List[Dict]:
        """
        Detect scheduling conflicts (overlapping sessions at same facility).
        
        Returns:
            List of conflict dictionaries with details
        """
        conflicts = []
        
        # Group sessions by facility and date
        by_facility_date = defaultdict(list)
        for session in sessions:
            key = (session['facility_name'], session['date'])
            by_facility_date[key].append(session)
        
        # Check each facility-date for overlaps
        for (facility, date), day_sessions in by_facility_date.items():
            # Sort by start time
            day_sessions.sort(key=lambda s: s['start_time'])
            
            # Check for overlaps
            for i in range(len(day_sessions) - 1):
                session1 = day_sessions[i]
                session2 = day_sessions[i + 1]
                
                # Check if session1 ends after session2 starts
                if session1['end_time'] > session2['start_time']:
                    conflicts.append({
                        'type': 'overlap',
                        'facility': facility,
                        'date': date,
                        'session1': {
                            'name': session1['course_name'],
                            'time': f"{session1['start_time']} - {session1['end_time']}"
                        },
                        'session2': {
                            'name': session2['course_name'],
                            'time': f"{session2['start_time']} - {session2['end_time']}"
                        },
                        'overlap_duration': str(session1['end_time'] - session2['start_time'])
                    })
        
        if conflicts:
            logger.warning(f"Detected {len(conflicts)} schedule conflicts")
            self.parse_stats['data_quality_issues'].append(
                f"{len(conflicts)} schedule conflicts detected"
            )
        
        return conflicts
    
    def optimize_schedule(self, sessions: List[Dict]) -> List[Dict]:
        """
        Optimize schedule by resolving conflicts and filling gaps.
        
        Returns:
            Optimized list of sessions with conflicts resolved
        """
        # Start with all sessions
        optimized = sessions.copy()
        
        # Detect conflicts
        conflicts = self.detect_schedule_conflicts(optimized)
        
        if not conflicts:
            return optimized
        
        # For each conflict, keep the longer session or the lane swim
        conflicts_resolved = 0
        for conflict in conflicts:
            # Find the actual session objects
            facility = conflict['facility']
            date = conflict['date']
            
            matching_sessions = [
                s for s in optimized 
                if s['facility_name'] == facility and s['date'] == date
            ]
            
            # Simple resolution: prefer LANE_SWIM, then longer duration
            for s in matching_sessions:
                duration = (datetime.combine(date, s['end_time']) - 
                           datetime.combine(date, s['start_time'])).seconds / 60
                s['_duration'] = duration
                s['_priority'] = 2 if s['swim_type'] == 'LANE_SWIM' else 1
            
            # Sort by priority and duration
            matching_sessions.sort(key=lambda s: (s['_priority'], s['_duration']), reverse=True)
            
            # Keep non-overlapping sessions
            kept = []
            for session in matching_sessions:
                # Check if this overlaps with any kept session
                overlaps = False
                for kept_session in kept:
                    if (session['start_time'] < kept_session['end_time'] and 
                        session['end_time'] > kept_session['start_time']):
                        overlaps = True
                        break
                
                if not overlaps:
                    kept.append(session)
                else:
                    optimized.remove(session)
                    conflicts_resolved += 1
        
        logger.info(f"Resolved {conflicts_resolved} conflicts in schedule optimization")
        return optimized
    
    # ================== Smart Facility Matching ==================
    
    def match_facility_with_score(
        self,
        location_name: str,
        location_data: Optional[Dict],
        existing_facilities: List,
        threshold: float = 0.6
    ) -> Optional[Tuple[str, float]]:
        """
        Advanced facility matching with confidence scoring.
        
        Args:
            location_name: Name of location to match
            location_data: Additional location data (address, postal code, etc.)
            existing_facilities: List of existing facility objects
            threshold: Minimum confidence score (0-1) for match
            
        Returns:
            (facility_id, confidence_score) or None
        """
        if not location_name:
            return None
        
        location_name_lower = location_name.lower().strip()
        best_match = None
        best_score = 0.0
        
        for facility in existing_facilities:
            score = 0.0
            facility_name_lower = facility.name.lower().strip()
            
            # Exact match = 1.0
            if facility_name_lower == location_name_lower:
                return (facility.facility_id, 1.0)
            
            # Calculate similarity score
            # 1. Name similarity (Jaccard similarity on words)
            loc_words = set(location_name_lower.split())
            fac_words = set(facility_name_lower.split())
            
            if loc_words and fac_words:
                intersection = loc_words & fac_words
                union = loc_words | fac_words
                jaccard = len(intersection) / len(union)
                score += jaccard * 0.5
            
            # 2. Substring match
            if location_name_lower in facility_name_lower or facility_name_lower in location_name_lower:
                score += 0.3
            
            # 3. Address matching (if available)
            if location_data and hasattr(facility, 'address'):
                loc_address = str(location_data.get('Address', '')).lower()
                fac_address = str(getattr(facility, 'address', '')).lower()
                
                if loc_address and fac_address:
                    if loc_address in fac_address or fac_address in loc_address:
                        score += 0.15
            
            # 4. Postal code exact match
            if location_data and hasattr(facility, 'postal_code'):
                loc_postal = str(location_data.get('PostalCode', '')).replace(' ', '').upper()
                fac_postal = str(getattr(facility, 'postal_code', '')).replace(' ', '').upper()
                
                if loc_postal and fac_postal and loc_postal == fac_postal:
                    score += 0.4
                    # Postal code match is very strong evidence
            
            # Track best match
            if score > best_score:
                best_score = score
                best_match = facility.facility_id
        
        # Return match if above threshold
        if best_score >= threshold:
            logger.debug(f"Matched '{location_name}' with score {best_score:.2f}")
            return (best_match, best_score)
        
        logger.warning(f"No confident match for '{location_name}' (best score: {best_score:.2f})")
        return None
    
    # ================== Data Quality Validation ==================
    
    def validate_session_data(self, session: Dict) -> Tuple[bool, List[str]]:
        """
        Validate a session data dictionary for quality issues.
        
        Returns:
            (is_valid, list_of_issues)
        """
        issues = []
        
        # Required fields
        required = ['facility_name', 'date', 'start_time', 'end_time', 'swim_type']
        for field in required:
            if not session.get(field):
                issues.append(f"Missing required field: {field}")
        
        # Validate time range
        if session.get('start_time') and session.get('end_time'):
            if session['end_time'] <= session['start_time']:
                issues.append(f"Invalid time range: {session['start_time']} - {session['end_time']}")
        
        # Validate date (not too far in past/future)
        if session.get('date'):
            today = date.today()
            days_diff = (session['date'] - today).days
            
            if days_diff < -30:
                issues.append(f"Date is in the past: {session['date']}")
            elif days_diff > 180:
                issues.append(f"Date is too far in future: {session['date']}")
        
        # Validate swim type
        valid_types = ['LANE_SWIM', 'AQUAFIT', 'RECREATIONAL', 'ADULT_SWIM', 'SENIOR_SWIM']
        if session.get('swim_type') and session['swim_type'] not in valid_types:
            issues.append(f"Invalid swim type: {session['swim_type']}")
        
        is_valid = len(issues) == 0
        
        if not is_valid:
            self.parse_stats['data_quality_issues'].extend(issues)
        
        return is_valid, issues
    
    def generate_quality_report(self, sessions: List[Dict]) -> Dict[str, any]:
        """
        Generate comprehensive data quality report.
        
        Returns:
            Report dictionary with quality metrics
        """
        report = {
            'total_sessions': len(sessions),
            'valid_sessions': 0,
            'invalid_sessions': 0,
            'issues_by_type': defaultdict(int),
            'quality_score': 0.0,
            'recommendations': []
        }
        
        # Validate all sessions
        for session in sessions:
            is_valid, issues = self.validate_session_data(session)
            
            if is_valid:
                report['valid_sessions'] += 1
            else:
                report['invalid_sessions'] += 1
                for issue in issues:
                    # Categorize issue
                    if 'Missing' in issue:
                        report['issues_by_type']['missing_data'] += 1
                    elif 'Invalid time' in issue:
                        report['issues_by_type']['time_validation'] += 1
                    elif 'Date' in issue:
                        report['issues_by_type']['date_validation'] += 1
                    else:
                        report['issues_by_type']['other'] += 1
        
        # Calculate quality score
        if sessions:
            report['quality_score'] = report['valid_sessions'] / len(sessions)
        
        # Generate recommendations
        if report['quality_score'] < 0.9:
            report['recommendations'].append("Data quality is below 90%. Review parsing logic.")
        
        if report['issues_by_type']['missing_data'] > len(sessions) * 0.1:
            report['recommendations'].append("High rate of missing data. Check source data completeness.")
        
        if report['issues_by_type']['time_validation'] > 0:
            report['recommendations'].append("Time validation errors detected. Review time parsing logic.")
        
        return dict(report)
    
    # ================== Enhanced Aggregation Pipeline ==================
    
    def parse_all_to_sessions(
        self,
        existing_facilities: List,
        weeks_ahead: int = 4,
        optimize: bool = True
    ) -> Dict[str, any]:
        """
        Complete pipeline: fetch, parse, validate, and optimize all sessions.
        
        Args:
            existing_facilities: List of existing facility objects from database
            weeks_ahead: Number of weeks to generate schedules for
            optimize: Whether to optimize schedule (resolve conflicts)
            
        Returns:
            {
                'sessions': List[Dict],  # Parsed and validated sessions
                'stats': Dict,  # Parsing statistics
                'quality_report': Dict,  # Data quality report
                'schedule_analysis': Dict,  # Schedule coverage analysis
                'conflicts': List[Dict]  # Detected conflicts (if not optimized)
            }
        """
        logger.info("Starting enhanced data parsing pipeline...")
        
        # Reset stats
        self.parse_stats = {
            'total_programs': 0,
            'swim_programs': 0,
            'sessions_generated': 0,
            'facilities_matched': 0,
            'facilities_unmatched': 0,
            'parsing_errors': 0,
            'data_quality_issues': []
        }
        
        # Fetch all data
        data = self.fetch_all_formats()
        
        # Filter to swim programs
        swim_programs_df = self.filter_swim_programs_advanced(data['drop_in'])
        
        if swim_programs_df.empty:
            logger.warning("No swim programs found")
            return {
                'sessions': [],
                'stats': self.parse_stats,
                'quality_report': {},
                'schedule_analysis': {},
                'conflicts': []
            }
        
        # Get locations lookup
        locations_dict = {}
        if not data['locations'].empty:
            for _, row in data['locations'].iterrows():
                loc_id = row.get('LocationID') or row.get('Location ID') or row.get('_id')
                if loc_id:
                    locations_dict[str(loc_id)] = row.to_dict()
        
        # Parse programs to sessions
        all_sessions = []
        for _, program in swim_programs_df.iterrows():
            try:
                program_dict = program.to_dict()
                
                # Get location data
                location_id = str(self.get_field(program_dict, 'Location ID', 'LocationID', 'Location_ID'))
                location_data = locations_dict.get(location_id)
                
                # Parse to sessions
                sessions = self.parse_schedule_to_sessions(
                    program_dict,
                    location_data,
                    weeks_ahead
                )
                
                # Match facility
                for session in sessions:
                    match_result = self.match_facility_with_score(
                        session['facility_name'],
                        location_data,
                        existing_facilities
                    )
                    
                    if match_result:
                        facility_id, confidence = match_result
                        session['facility_id'] = facility_id
                        session['match_confidence'] = confidence
                        self.parse_stats['facilities_matched'] += 1
                    else:
                        session['facility_id'] = None
                        session['match_confidence'] = 0.0
                        self.parse_stats['facilities_unmatched'] += 1
                
                all_sessions.extend(sessions)
                
            except Exception as e:
                logger.error(f"Error parsing program: {e}")
                self.parse_stats['parsing_errors'] += 1
        
        self.parse_stats['sessions_generated'] = len(all_sessions)
        logger.success(f"Generated {len(all_sessions)} sessions from {len(swim_programs_df)} programs")
        
        # Optimize schedule if requested
        conflicts = []
        if optimize:
            logger.info("Optimizing schedule...")
            all_sessions = self.optimize_schedule(all_sessions)
        else:
            conflicts = self.detect_schedule_conflicts(all_sessions)
        
        # Generate reports
        quality_report = self.generate_quality_report(all_sessions)
        schedule_analysis = self.analyze_schedule_coverage(all_sessions)
        
        return {
            'sessions': all_sessions,
            'stats': self.parse_stats,
            'quality_report': quality_report,
            'schedule_analysis': schedule_analysis,
            'conflicts': conflicts
        }
    
    def export_report(self, result: Dict, output_path: str = None) -> str:
        """
        Export parsing results and reports to JSON file.
        
        Args:
            result: Result dictionary from parse_all_to_sessions
            output_path: Optional output path (defaults to logs/)
            
        Returns:
            Path to exported file
        """
        import json
        from pathlib import Path
        
        if not output_path:
            output_path = f"logs/parse_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # Prepare data for serialization
        export_data = {
            'timestamp': datetime.now().isoformat(),
            'stats': result['stats'],
            'quality_report': result['quality_report'],
            'schedule_analysis': {
                **result['schedule_analysis'],
                'date_range': [
                    d.isoformat() for d in result['schedule_analysis'].get('date_range', [])
                ] if result['schedule_analysis'].get('date_range') else None
            },
            'conflicts': result['conflicts'],
            'session_count': len(result['sessions'])
        }
        
        # Write to file
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2, default=str)
        
        logger.success(f"Exported report to {output_path}")
        return output_path

