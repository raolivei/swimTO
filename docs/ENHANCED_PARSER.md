# Enhanced Data Parser Documentation

## Overview

The Enhanced Data Parser (`enhanced_parser.py`) is an advanced extension of the Toronto Open Data parser that provides sophisticated data manipulation, analysis, and validation capabilities for swimming pool schedules.

## Features

### 🎯 Core Capabilities

1. **Multi-Format Data Parsing**
   - CSV parsing (via requests + csv module)
   - XLSX parsing (via pandas + openpyxl)
   - JSON data handling
   - Automatic format detection

2. **Advanced Classification**
   - Confidence-based swim activity detection
   - Multi-pattern swim type classification
   - Tag extraction (adults_only, family_friendly, etc.)
   - Age group detection

3. **Schedule Analysis**
   - Coverage analysis by day and time
   - Peak time identification
   - Gap detection in schedule coverage
   - Low coverage warnings

4. **Conflict Detection & Resolution**
   - Automatic overlap detection
   - Priority-based conflict resolution
   - Schedule optimization
   - Duration-aware scheduling

5. **Smart Facility Matching**
   - Multi-criteria matching (name, address, postal code)
   - Confidence scoring (0-1 scale)
   - Fuzzy matching with Jaccard similarity
   - Configurable match thresholds

6. **Data Quality Validation**
   - Required field validation
   - Time range validation
   - Date validity checking
   - Comprehensive quality scoring
   - Actionable recommendations

7. **Performance Optimization**
   - Caching mechanisms
   - Batch processing
   - Efficient data structures
   - Progress tracking

## Installation

### Dependencies

Add to `requirements.txt`:
```text
pandas==2.1.3
openpyxl==3.1.2
```

Install:
```bash
pip install -r requirements.txt
```

## Usage

### Basic Usage

```python
from sources.enhanced_parser import EnhancedDataParser

# Initialize parser
parser = EnhancedDataParser()

# Fetch and parse data
data = parser.fetch_all_formats()

# Filter to swim programs with advanced classification
swim_programs = parser.filter_swim_programs_advanced(data['drop_in'])

# Analyze a single program
classification = parser.classify_swim_activity_advanced(
    "Adult Lane Swim",
    "Recreation"
)
print(f"Type: {classification['swim_type']}")
print(f"Confidence: {classification['confidence']:.2%}")
print(f"Tags: {classification['tags']}")
```

### Complete Pipeline

```python
from sources.enhanced_parser import EnhancedDataParser
from app.database import SessionLocal
from app.models import Facility

# Get existing facilities from database
db = SessionLocal()
facilities = db.query(Facility).all()

# Initialize parser
parser = EnhancedDataParser()

# Run complete pipeline
result = parser.parse_all_to_sessions(
    existing_facilities=facilities,
    weeks_ahead=4,
    optimize=True
)

# Access results
sessions = result['sessions']
stats = result['stats']
quality_report = result['quality_report']
schedule_analysis = result['schedule_analysis']

# Export report
parser.export_report(result, "output/report.json")
```

### Schedule Analysis

```python
# Analyze schedule coverage
analysis = parser.analyze_schedule_coverage(sessions)

print(f"Total sessions: {analysis['total_sessions']}")
print(f"Facilities: {analysis['facilities_count']}")
print(f"Date range: {analysis['date_range']}")

# Check peak times
for hour, count in analysis['peak_times']:
    print(f"{hour}:00 - {count} sessions")

# Identify gaps
for gap in analysis['gaps']:
    print(f"Gap: {gap['description']}")
```

### Conflict Detection

```python
# Detect conflicts
conflicts = parser.detect_schedule_conflicts(sessions)

for conflict in conflicts:
    print(f"Conflict at {conflict['facility']} on {conflict['date']}")
    print(f"  {conflict['session1']['name']} vs {conflict['session2']['name']}")
    print(f"  Overlap: {conflict['overlap_duration']}")

# Or optimize automatically
optimized_sessions = parser.optimize_schedule(sessions)
```

### Facility Matching

```python
# Match with confidence scoring
result = parser.match_facility_with_score(
    location_name="High Park Pool",
    location_data={'PostalCode': 'M6R 2Z6'},
    existing_facilities=facilities,
    threshold=0.6
)

if result:
    facility_id, confidence = result
    print(f"Matched facility {facility_id} with {confidence:.2%} confidence")
```

### Data Quality Validation

```python
# Validate single session
is_valid, issues = parser.validate_session_data(session)

if not is_valid:
    for issue in issues:
        print(f"Issue: {issue}")

# Generate quality report
report = parser.generate_quality_report(sessions)

print(f"Quality Score: {report['quality_score']:.2%}")
print(f"Valid: {report['valid_sessions']}")
print(f"Invalid: {report['invalid_sessions']}")

for recommendation in report['recommendations']:
    print(f"💡 {recommendation}")
```

## Advanced Features

### Classification Confidence

The parser assigns confidence scores (0-1) to swim activity classifications:

- **1.0**: Exact keyword match (e.g., "Lane Swim")
- **0.7-0.9**: Strong pattern match
- **0.5-0.7**: Moderate match with inference
- **0.5**: Default fallback (LANE_SWIM)

### Facility Matching Algorithm

Multi-criteria scoring:
1. **Name Match** (50% weight)
   - Jaccard similarity on words
   - Substring matching
2. **Address Match** (15% weight)
   - Partial address matching
3. **Postal Code** (40% weight)
   - Exact match (very strong signal)

Default threshold: 0.6 (60% confidence)

### Schedule Optimization

Conflict resolution priorities:
1. **Swim Type Priority**
   - LANE_SWIM > other types
2. **Duration Priority**
   - Longer sessions preferred
3. **Temporal Priority**
   - Earlier sessions kept in ties

## Testing

Run the comprehensive test suite:

```bash
cd data-pipeline
python jobs/test_enhanced_parser.py
```

Tests cover:
- Basic classification
- Schedule analysis
- Conflict detection
- Facility matching
- Data validation
- Full pipeline with real data

## Output Format

### Session Dictionary

```python
{
    'facility_id': 'FAC001',          # Matched facility ID
    'facility_name': 'High Park Pool',
    'location_id': '123',              # Source location ID
    'course_name': 'Adult Lane Swim',
    'course_id': 'COURSE-456',
    'swim_type': 'LANE_SWIM',
    'date': date(2025, 11, 10),
    'start_time': time(6, 0),
    'end_time': time(7, 30),
    'notes': 'Age: 18+; Category: Recreation',
    'source': 'toronto_open_data',
    'source_url': '...',
    'match_confidence': 0.95,          # Facility match confidence
    'raw_program': {...}               # Original program data
}
```

### Statistics Report

```python
{
    'total_programs': 150,
    'swim_programs': 87,
    'sessions_generated': 2340,
    'facilities_matched': 80,
    'facilities_unmatched': 7,
    'parsing_errors': 3,
    'data_quality_issues': [...]
}
```

### Quality Report

```python
{
    'total_sessions': 2340,
    'valid_sessions': 2290,
    'invalid_sessions': 50,
    'quality_score': 0.979,
    'issues_by_type': {
        'missing_data': 10,
        'time_validation': 5,
        'date_validation': 35
    },
    'recommendations': [
        'Data quality is below 90%. Review parsing logic.',
        ...
    ]
}
```

### Schedule Analysis

```python
{
    'total_sessions': 2340,
    'facilities_count': 15,
    'date_range': (date(2025, 11, 5), date(2025, 12, 3)),
    'coverage_by_day': {
        0: 350,  # Monday
        1: 340,  # Tuesday
        ...
    },
    'coverage_by_hour': {
        6: 45,   # 6 AM
        7: 60,
        ...
    },
    'peak_times': [
        (18, 120),  # 6 PM - 120 sessions
        (12, 95),   # 12 PM - 95 sessions
        ...
    ],
    'gaps': [
        {
            'type': 'time_gap',
            'hour': 22,
            'description': 'No sessions at 22:00'
        },
        ...
    ]
}
```

## Integration Examples

### Daily Refresh Job

```python
#!/usr/bin/env python3
"""Daily data refresh using enhanced parser."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sources.enhanced_parser import EnhancedDataParser
from app.database import SessionLocal
from app.models import Facility, Schedule
from loguru import logger

def refresh_schedules():
    db = SessionLocal()
    
    try:
        # Get existing facilities
        facilities = db.query(Facility).all()
        logger.info(f"Found {len(facilities)} existing facilities")
        
        # Parse data
        parser = EnhancedDataParser()
        result = parser.parse_all_to_sessions(
            existing_facilities=facilities,
            weeks_ahead=4,
            optimize=True
        )
        
        # Clear old schedules
        db.query(Schedule).delete()
        
        # Insert new schedules
        for session in result['sessions']:
            if session.get('facility_id'):  # Only matched facilities
                schedule = Schedule(
                    facility_id=session['facility_id'],
                    swim_type=session['swim_type'],
                    date=session['date'],
                    start_time=session['start_time'],
                    end_time=session['end_time'],
                    notes=session['notes'],
                    source='toronto_open_data'
                )
                db.add(schedule)
        
        db.commit()
        
        # Log results
        logger.success(f"Inserted {len(result['sessions'])} schedules")
        logger.info(f"Quality score: {result['quality_report']['quality_score']:.2%}")
        
        # Export report
        parser.export_report(result)
        
    except Exception as e:
        logger.error(f"Refresh failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    refresh_schedules()
```

### API Endpoint

```python
from fastapi import APIRouter, Depends
from sources.enhanced_parser import EnhancedDataParser

router = APIRouter()

@router.post("/admin/analyze-schedule")
async def analyze_schedule():
    """Analyze current schedule quality and coverage."""
    parser = EnhancedDataParser()
    
    # Get current schedules
    db = SessionLocal()
    schedules = db.query(Schedule).all()
    
    # Convert to session format
    sessions = [
        {
            'facility_name': s.facility.name,
            'date': s.date,
            'start_time': s.start_time,
            'end_time': s.end_time,
            'swim_type': s.swim_type,
            'course_name': s.notes or ''
        }
        for s in schedules
    ]
    
    # Analyze
    analysis = parser.analyze_schedule_coverage(sessions)
    quality = parser.generate_quality_report(sessions)
    conflicts = parser.detect_schedule_conflicts(sessions)
    
    return {
        'analysis': analysis,
        'quality': quality,
        'conflicts': conflicts
    }
```

## Performance Considerations

### Memory Usage

- DataFrames are memory-efficient for large datasets
- Use `weeks_ahead` parameter to limit session generation
- Clear caches periodically: `parser._facility_cache.clear()`

### Processing Time

Typical performance (Toronto Open Data):
- Fetch data: 5-10 seconds
- Filter and classify: 2-3 seconds
- Parse to sessions (4 weeks): 10-15 seconds
- Facility matching: 5-8 seconds
- **Total: ~30-40 seconds**

### Optimization Tips

1. **Reduce weeks_ahead** for faster testing
2. **Cache facilities** in parser instance for batch operations
3. **Use optimize=False** if conflicts aren't critical
4. **Filter programs early** before parsing to sessions

## Troubleshooting

### Common Issues

**Issue**: SSL verification errors
```python
# Parser automatically retries without verification
# Check logs for warnings
```

**Issue**: No facilities matched
```python
# Check facility names in database
# Lower match threshold
result = parser.match_facility_with_score(
    name, data, facilities,
    threshold=0.4  # Lower threshold
)
```

**Issue**: Many schedule conflicts
```python
# Use optimization
result = parser.parse_all_to_sessions(
    facilities,
    optimize=True  # Enable conflict resolution
)
```

**Issue**: Low quality scores
```python
# Generate detailed report
quality = parser.generate_quality_report(sessions)
for rec in quality['recommendations']:
    print(rec)
```

## Future Enhancements

- [ ] Machine learning for facility matching
- [ ] Historical trend analysis
- [ ] Predictive scheduling
- [ ] Multi-city support
- [ ] Real-time updates
- [ ] Automated anomaly detection
- [ ] Schedule recommendation engine

## Contributing

When extending the parser:

1. Add tests to `test_enhanced_parser.py`
2. Update this documentation
3. Maintain backward compatibility
4. Follow existing code style
5. Add type hints
6. Include docstrings

## License

Part of SwimTO project - See main LICENSE file.

