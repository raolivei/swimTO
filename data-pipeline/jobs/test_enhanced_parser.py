#!/usr/bin/env python3
"""
Test and demonstration script for the Enhanced Data Parser.

Shows advanced features:
- Multi-format data parsing
- Advanced classification and filtering
- Schedule conflict detection
- Facility matching with confidence scores
- Data quality validation and reporting
- Schedule coverage analysis
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger
from sources.enhanced_parser import EnhancedDataParser
from datetime import date, time
import json


class MockFacility:
    """Mock facility for testing without database."""
    
    def __init__(self, facility_id: str, name: str, address: str = "", postal_code: str = ""):
        self.facility_id = facility_id
        self.name = name
        self.address = address
        self.postal_code = postal_code


def create_mock_facilities() -> list:
    """Create mock facilities for testing."""
    return [
        MockFacility("FAC001", "Alex Duff Memorial Pool", "953 Gerrard St E", "M4M 1Z4"),
        MockFacility("FAC002", "Antibes Community Centre", "2975 Finch Ave E", "M1W 2T4"),
        MockFacility("FAC003", "Chesswood Arena", "3880 Bathurst St", "M3H 3N1"),
        MockFacility("FAC004", "Etobicoke Olympium", "590 Rathburn Rd", "M9C 3T3"),
        MockFacility("FAC005", "George Bell Arena", "180 Baldwin St", "M5T 1L8"),
        MockFacility("FAC006", "Grandravine Community Recreation Centre", "23 Grandravine Dr", "M3N 1H5"),
        MockFacility("FAC007", "High Park Pool", "375 Colborne Lodge Dr", "M6R 2Z6"),
        MockFacility("FAC008", "Kipling Community Centre", "2 Rowntree Rd", "M9V 4X2"),
        MockFacility("FAC009", "Masaryk-Cowan Community Recreation Centre", "20 Rumsey Rd", "M6S 2X2"),
        MockFacility("FAC010", "Matty Eckler Recreation Centre", "953 Gerrard St E", "M4M 1Z4"),
        MockFacility("FAC011", "North Toronto Memorial Community Centre", "200 Eglinton Ave W", "M4R 1A7"),
        MockFacility("FAC012", "Scarborough Centennial Recreation Centre", "1967 Ellesmere Rd", "M1H 2V5"),
        MockFacility("FAC013", "Seton Pool", "1748 Danforth Ave", "M4C 1J1"),
        MockFacility("FAC014", "Wallace Emerson Community Centre", "1260 Dufferin St", "M6H 4C3"),
        MockFacility("FAC015", "York Recreation Centre", "22 Oakmount Rd", "M6P 2M8"),
    ]


def test_basic_functionality():
    """Test basic parser functionality."""
    logger.info("=" * 70)
    logger.info("TEST 1: Basic Functionality")
    logger.info("=" * 70)
    
    parser = EnhancedDataParser()
    
    # Test classification
    test_courses = [
        ("Lane Swim - Adults Only", "Recreation"),
        ("Aquafit for Seniors", "Fitness"),
        ("Family Leisure Swim", "Recreation"),
        ("Basketball Drop-in", "Sports"),
        ("Deep Water Aquafit", "Fitness"),
    ]
    
    logger.info("\n📊 Classification Results:")
    for course_name, category in test_courses:
        result = parser.classify_swim_activity_advanced(course_name, category)
        
        if result['is_swim']:
            logger.info(f"✅ {course_name}")
            logger.info(f"   Type: {result['swim_type']}, Confidence: {result['confidence']:.2f}")
            logger.info(f"   Tags: {', '.join(result['tags']) if result['tags'] else 'None'}")
            logger.info(f"   Age Group: {result['age_group'] or 'All ages'}")
        else:
            logger.info(f"❌ {course_name} - Not a swim activity")
        logger.info("")


def test_schedule_analysis():
    """Test schedule coverage analysis."""
    logger.info("=" * 70)
    logger.info("TEST 2: Schedule Coverage Analysis")
    logger.info("=" * 70)
    
    parser = EnhancedDataParser()
    
    # Create sample sessions
    sample_sessions = [
        {
            'facility_name': 'Pool A',
            'date': date(2025, 11, 10),  # Monday
            'start_time': time(6, 0),
            'end_time': time(7, 30),
            'swim_type': 'LANE_SWIM',
            'course_name': 'Early Lane Swim'
        },
        {
            'facility_name': 'Pool A',
            'date': date(2025, 11, 10),
            'start_time': time(12, 0),
            'end_time': time(13, 30),
            'swim_type': 'AQUAFIT',
            'course_name': 'Lunch Aquafit'
        },
        {
            'facility_name': 'Pool B',
            'date': date(2025, 11, 11),  # Tuesday
            'start_time': time(18, 0),
            'end_time': time(20, 0),
            'swim_type': 'LANE_SWIM',
            'course_name': 'Evening Lane Swim'
        },
    ]
    
    analysis = parser.analyze_schedule_coverage(sample_sessions)
    
    logger.info(f"\n📈 Coverage Analysis:")
    logger.info(f"Total Sessions: {analysis['total_sessions']}")
    logger.info(f"Facilities: {analysis['facilities_count']}")
    logger.info(f"Date Range: {analysis['date_range'][0]} to {analysis['date_range'][1]}")
    
    logger.info(f"\n📅 Coverage by Day:")
    day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    for day, count in sorted(analysis['coverage_by_day'].items()):
        logger.info(f"  {day_names[day]}: {count} sessions")
    
    logger.info(f"\n🕐 Peak Times:")
    for hour, count in analysis['peak_times']:
        logger.info(f"  {hour}:00 - {count} sessions")
    
    if analysis['gaps']:
        logger.info(f"\n⚠️  Coverage Gaps:")
        for gap in analysis['gaps'][:5]:  # Show first 5
            logger.info(f"  - {gap['description']}")


def test_conflict_detection():
    """Test schedule conflict detection."""
    logger.info("=" * 70)
    logger.info("TEST 3: Conflict Detection")
    logger.info("=" * 70)
    
    parser = EnhancedDataParser()
    
    # Create sessions with conflicts
    conflicting_sessions = [
        {
            'facility_name': 'Test Pool',
            'date': date(2025, 11, 10),
            'start_time': time(10, 0),
            'end_time': time(11, 30),
            'swim_type': 'LANE_SWIM',
            'course_name': 'Morning Lane Swim'
        },
        {
            'facility_name': 'Test Pool',
            'date': date(2025, 11, 10),
            'start_time': time(11, 0),  # Overlaps with above
            'end_time': time(12, 30),
            'swim_type': 'AQUAFIT',
            'course_name': 'Late Morning Aquafit'
        },
        {
            'facility_name': 'Test Pool',
            'date': date(2025, 11, 10),
            'start_time': time(14, 0),  # No conflict
            'end_time': time(15, 30),
            'swim_type': 'LANE_SWIM',
            'course_name': 'Afternoon Lane Swim'
        },
    ]
    
    conflicts = parser.detect_schedule_conflicts(conflicting_sessions)
    
    logger.info(f"\n⚠️  Found {len(conflicts)} conflicts:")
    for conflict in conflicts:
        logger.info(f"\nConflict at {conflict['facility']} on {conflict['date']}:")
        logger.info(f"  Session 1: {conflict['session1']['name']} ({conflict['session1']['time']})")
        logger.info(f"  Session 2: {conflict['session2']['name']} ({conflict['session2']['time']})")
        logger.info(f"  Overlap: {conflict['overlap_duration']}")
    
    # Test optimization
    logger.info(f"\n🔧 Testing Schedule Optimization:")
    optimized = parser.optimize_schedule(conflicting_sessions)
    logger.info(f"Original sessions: {len(conflicting_sessions)}")
    logger.info(f"After optimization: {len(optimized)}")
    logger.info(f"Conflicts resolved: {len(conflicting_sessions) - len(optimized)}")


def test_facility_matching():
    """Test facility matching with confidence scores."""
    logger.info("=" * 70)
    logger.info("TEST 4: Facility Matching")
    logger.info("=" * 70)
    
    parser = EnhancedDataParser()
    facilities = create_mock_facilities()
    
    # Test various matching scenarios
    test_cases = [
        {
            'name': 'High Park Pool',  # Exact match
            'data': {'Address': '375 Colborne Lodge Dr', 'PostalCode': 'M6R 2Z6'}
        },
        {
            'name': 'High Park Community Pool',  # Partial match
            'data': {'Address': '375 Colborne Lodge Dr'}
        },
        {
            'name': 'Scarborough Centennial Centre',  # Shortened name
            'data': {}
        },
        {
            'name': 'Unknown Pool Center',  # No match
            'data': {}
        },
        {
            'name': 'George Bell',  # First name only
            'data': {'PostalCode': 'M5T 1L8'}  # But postal code matches
        },
    ]
    
    logger.info("\n🎯 Matching Results:")
    for test in test_cases:
        result = parser.match_facility_with_score(
            test['name'],
            test['data'],
            facilities
        )
        
        if result:
            facility_id, confidence = result
            matched_facility = next(f for f in facilities if f.facility_id == facility_id)
            logger.info(f"\n✅ '{test['name']}'")
            logger.info(f"   → Matched: {matched_facility.name}")
            logger.info(f"   → Confidence: {confidence:.2%}")
        else:
            logger.info(f"\n❌ '{test['name']}'")
            logger.info(f"   → No match found")


def test_data_validation():
    """Test data quality validation."""
    logger.info("=" * 70)
    logger.info("TEST 5: Data Quality Validation")
    logger.info("=" * 70)
    
    parser = EnhancedDataParser()
    
    # Test various session data quality
    test_sessions = [
        {
            'name': 'Valid session',
            'data': {
                'facility_name': 'Test Pool',
                'date': date(2025, 11, 15),
                'start_time': time(10, 0),
                'end_time': time(11, 30),
                'swim_type': 'LANE_SWIM'
            }
        },
        {
            'name': 'Missing facility',
            'data': {
                'date': date(2025, 11, 15),
                'start_time': time(10, 0),
                'end_time': time(11, 30),
                'swim_type': 'LANE_SWIM'
            }
        },
        {
            'name': 'Invalid time range',
            'data': {
                'facility_name': 'Test Pool',
                'date': date(2025, 11, 15),
                'start_time': time(11, 30),
                'end_time': time(10, 0),  # End before start
                'swim_type': 'LANE_SWIM'
            }
        },
        {
            'name': 'Date in past',
            'data': {
                'facility_name': 'Test Pool',
                'date': date(2020, 1, 1),  # Old date
                'start_time': time(10, 0),
                'end_time': time(11, 30),
                'swim_type': 'LANE_SWIM'
            }
        },
    ]
    
    logger.info("\n🔍 Validation Results:")
    for test in test_sessions:
        is_valid, issues = parser.validate_session_data(test['data'])
        
        if is_valid:
            logger.info(f"\n✅ {test['name']}: VALID")
        else:
            logger.info(f"\n❌ {test['name']}: INVALID")
            for issue in issues:
                logger.info(f"   - {issue}")
    
    # Generate quality report
    logger.info("\n📊 Quality Report:")
    report = parser.generate_quality_report([test['data'] for test in test_sessions])
    
    logger.info(f"Total Sessions: {report['total_sessions']}")
    logger.info(f"Valid: {report['valid_sessions']}")
    logger.info(f"Invalid: {report['invalid_sessions']}")
    logger.info(f"Quality Score: {report['quality_score']:.2%}")
    
    if report['recommendations']:
        logger.info("\n💡 Recommendations:")
        for rec in report['recommendations']:
            logger.info(f"  - {rec}")


def test_full_pipeline():
    """Test the complete parsing pipeline with real data."""
    logger.info("=" * 70)
    logger.info("TEST 6: Full Pipeline (Real Data)")
    logger.info("=" * 70)
    
    parser = EnhancedDataParser()
    facilities = create_mock_facilities()
    
    try:
        logger.info("\n🚀 Running complete pipeline...")
        logger.info("This will fetch real data from Toronto Open Data Portal\n")
        
        result = parser.parse_all_to_sessions(
            existing_facilities=facilities,
            weeks_ahead=2,  # Limit to 2 weeks for testing
            optimize=True
        )
        
        logger.info("\n" + "=" * 70)
        logger.info("📊 PIPELINE RESULTS")
        logger.info("=" * 70)
        
        # Statistics
        stats = result['stats']
        logger.info(f"\n📈 Parsing Statistics:")
        logger.info(f"  Total Programs: {stats['total_programs']}")
        logger.info(f"  Swim Programs: {stats['swim_programs']}")
        logger.info(f"  Sessions Generated: {stats['sessions_generated']}")
        logger.info(f"  Facilities Matched: {stats['facilities_matched']}")
        logger.info(f"  Facilities Unmatched: {stats['facilities_unmatched']}")
        logger.info(f"  Parsing Errors: {stats['parsing_errors']}")
        
        # Quality Report
        quality = result['quality_report']
        logger.info(f"\n✅ Quality Report:")
        logger.info(f"  Valid Sessions: {quality.get('valid_sessions', 0)}")
        logger.info(f"  Invalid Sessions: {quality.get('invalid_sessions', 0)}")
        logger.info(f"  Quality Score: {quality.get('quality_score', 0):.2%}")
        
        if quality.get('issues_by_type'):
            logger.info(f"\n  Issues by Type:")
            for issue_type, count in quality['issues_by_type'].items():
                logger.info(f"    - {issue_type}: {count}")
        
        # Schedule Analysis
        analysis = result['schedule_analysis']
        if analysis:
            logger.info(f"\n📅 Schedule Analysis:")
            logger.info(f"  Total Sessions: {analysis.get('total_sessions', 0)}")
            logger.info(f"  Facilities: {analysis.get('facilities_count', 0)}")
            
            if analysis.get('date_range'):
                logger.info(f"  Date Range: {analysis['date_range'][0]} to {analysis['date_range'][1]}")
            
            if analysis.get('peak_times'):
                logger.info(f"\n  Top Peak Times:")
                for hour, count in analysis['peak_times'][:3]:
                    logger.info(f"    {hour}:00 - {count} sessions")
        
        # Sample sessions
        if result['sessions']:
            logger.info(f"\n📋 Sample Sessions (first 5):")
            for i, session in enumerate(result['sessions'][:5], 1):
                logger.info(f"\n  {i}. {session['course_name']}")
                logger.info(f"     Facility: {session['facility_name']}")
                logger.info(f"     Date: {session['date']}")
                logger.info(f"     Time: {session['start_time']} - {session['end_time']}")
                logger.info(f"     Type: {session['swim_type']}")
                if session.get('facility_id'):
                    logger.info(f"     Matched: ✅ ({session.get('match_confidence', 0):.2%} confidence)")
                else:
                    logger.info(f"     Matched: ❌")
        
        # Export report
        logger.info(f"\n💾 Exporting report...")
        report_path = parser.export_report(result)
        logger.info(f"Report saved to: {report_path}")
        
        logger.info("\n" + "=" * 70)
        logger.info("✅ Pipeline test completed successfully!")
        logger.info("=" * 70)
        
    except Exception as e:
        logger.error(f"Pipeline test failed: {e}")
        import traceback
        logger.error(traceback.format_exc())


def main():
    """Run all tests."""
    logger.info("\n" + "🏊" * 35)
    logger.info("Enhanced Data Parser - Test Suite")
    logger.info("🏊" * 35 + "\n")
    
    tests = [
        ("Basic Functionality", test_basic_functionality),
        ("Schedule Analysis", test_schedule_analysis),
        ("Conflict Detection", test_conflict_detection),
        ("Facility Matching", test_facility_matching),
        ("Data Validation", test_data_validation),
        ("Full Pipeline", test_full_pipeline),
    ]
    
    for i, (name, test_func) in enumerate(tests, 1):
        try:
            test_func()
            print()  # Add spacing
        except KeyboardInterrupt:
            logger.warning("\nTests interrupted by user")
            break
        except Exception as e:
            logger.error(f"Test '{name}' failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
    
    logger.info("\n" + "=" * 70)
    logger.info("🎉 All tests completed!")
    logger.info("=" * 70 + "\n")


if __name__ == "__main__":
    main()

