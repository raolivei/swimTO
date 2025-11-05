# Enhanced Parser Branch

**Branch:** `feature/enhanced-data-parser`  
**Created:** November 5, 2025  
**Status:** Development

## Overview

This branch introduces an advanced data parser that extends the Toronto Open Data integration with sophisticated data manipulation, analysis, and validation capabilities.

## What's New

### 🎯 Enhanced Parser (`enhanced_parser.py`)

A comprehensive evolution of the basic parser with:

1. **Multi-Format Data Parsing**
   - CSV parsing via CKAN API
   - XLSX/Excel parsing with pandas + openpyxl
   - Automatic format detection and handling

2. **Advanced Classification System**
   - Confidence-based swim activity detection (0-1 scale)
   - Multi-pattern swim type classification
   - Automatic tag extraction (adults_only, family_friendly, deep_water, etc.)
   - Age group detection (youth, adult, senior, family)

3. **Schedule Intelligence**
   - Coverage analysis by day and hour
   - Peak time identification
   - Gap detection in schedule coverage
   - Low coverage warnings by day

4. **Conflict Detection & Resolution**
   - Automatic overlap detection at same facility
   - Priority-based conflict resolution (LANE_SWIM preferred)
   - Duration-aware scheduling
   - Schedule optimization

5. **Smart Facility Matching**
   - Multi-criteria matching algorithm
   - Confidence scoring (name, address, postal code)
   - Fuzzy matching with Jaccard similarity
   - Configurable match thresholds

6. **Data Quality Validation**
   - Required field validation
   - Time range validation
   - Date validity checking
   - Comprehensive quality scoring
   - Actionable recommendations

7. **Performance & Reporting**
   - Efficient caching mechanisms
   - Batch processing
   - Statistics tracking
   - JSON report export

## New Files

```
data-pipeline/
├── sources/
│   └── enhanced_parser.py          # Main enhanced parser class
├── jobs/
│   ├── test_enhanced_parser.py      # Comprehensive test suite
│   └── daily_refresh_enhanced.py    # Enhanced daily refresh job
└── requirements.txt                 # Updated with pandas, openpyxl

docs/
└── ENHANCED_PARSER.md               # Complete documentation
```

## Dependencies Added

```
pandas==2.1.3       # DataFrame operations and data analysis
openpyxl==3.1.2     # Excel file parsing
```

## Quick Start

### 1. Install Dependencies

```bash
cd data-pipeline
pip install -r requirements.txt
```

### 2. Run Tests

```bash
python jobs/test_enhanced_parser.py
```

This runs 6 comprehensive tests:
- Basic functionality and classification
- Schedule coverage analysis
- Conflict detection and resolution
- Facility matching with scoring
- Data quality validation
- Full pipeline with real Toronto Open Data

### 3. Run Enhanced Refresh (Dry Run)

```bash
python jobs/daily_refresh_enhanced.py --dry-run --weeks 2
```

### 4. Production Refresh

```bash
python jobs/daily_refresh_enhanced.py --weeks 4
```

## Usage Examples

### Basic Classification

```python
from sources.enhanced_parser import EnhancedDataParser

parser = EnhancedDataParser()

# Classify with confidence
result = parser.classify_swim_activity_advanced(
    "Adult Lane Swim",
    "Recreation"
)

print(f"Type: {result['swim_type']}")           # LANE_SWIM
print(f"Confidence: {result['confidence']}")    # 0.95
print(f"Tags: {result['tags']}")                # ['adults_only']
print(f"Age Group: {result['age_group']}")      # 'adult'
```

### Complete Pipeline

```python
from app.database import SessionLocal
from app.models import Facility

db = SessionLocal()
facilities = db.query(Facility).all()

parser = EnhancedDataParser()

result = parser.parse_all_to_sessions(
    existing_facilities=facilities,
    weeks_ahead=4,
    optimize=True
)

# Access results
sessions = result['sessions']                    # Parsed sessions
stats = result['stats']                         # Parsing statistics
quality = result['quality_report']              # Quality metrics
analysis = result['schedule_analysis']          # Coverage analysis

# Export report
parser.export_report(result, "output/report.json")
```

### Facility Matching

```python
# Match with confidence scoring
match = parser.match_facility_with_score(
    location_name="High Park Pool",
    location_data={'PostalCode': 'M6R 2Z6'},
    existing_facilities=facilities,
    threshold=0.6
)

if match:
    facility_id, confidence = match
    print(f"Matched: {facility_id} ({confidence:.2%} confidence)")
```

## Key Features Explained

### Classification Confidence

- **1.0**: Exact keyword match
- **0.7-0.9**: Strong pattern match  
- **0.5-0.7**: Moderate match with inference
- **0.5**: Default fallback (LANE_SWIM)

### Facility Matching Algorithm

Multi-criteria scoring (0-1 scale):
- **Name Match** (50% weight): Jaccard similarity + substring
- **Address Match** (15% weight): Partial address matching
- **Postal Code** (40% weight): Exact match (very strong)

Default threshold: **0.6** (60% confidence)

### Conflict Resolution

When overlapping sessions detected:
1. **Priority 1**: LANE_SWIM > other types
2. **Priority 2**: Longer duration preferred
3. **Priority 3**: Earlier time kept in ties

## Output Format

### Session Dictionary
```python
{
    'facility_id': 'FAC001',
    'facility_name': 'High Park Pool',
    'course_name': 'Adult Lane Swim',
    'swim_type': 'LANE_SWIM',
    'date': date(2025, 11, 10),
    'start_time': time(6, 0),
    'end_time': time(7, 30),
    'match_confidence': 0.95,
    # ... more fields
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
    'parsing_errors': 3
}
```

### Quality Report
```python
{
    'total_sessions': 2340,
    'valid_sessions': 2290,
    'quality_score': 0.979,  # 97.9% quality
    'issues_by_type': {...},
    'recommendations': [...]
}
```

## Testing

The test suite (`test_enhanced_parser.py`) includes:

1. **Basic Functionality**
   - Classification accuracy
   - Confidence scoring
   - Tag extraction

2. **Schedule Analysis**
   - Coverage by day/hour
   - Peak time detection
   - Gap identification

3. **Conflict Detection**
   - Overlap detection
   - Resolution strategies
   - Optimization

4. **Facility Matching**
   - Exact matching
   - Fuzzy matching
   - Confidence scoring

5. **Data Validation**
   - Field validation
   - Time/date checking
   - Quality reporting

6. **Full Pipeline**
   - Real data fetching
   - End-to-end processing
   - Report generation

## Performance

Typical performance with Toronto Open Data:
- **Fetch data**: 5-10s
- **Filter & classify**: 2-3s
- **Parse to sessions (4 weeks)**: 10-15s
- **Facility matching**: 5-8s
- **Total**: ~30-40s

## Integration

### Replace Existing Daily Refresh

To use the enhanced parser in production:

1. Test thoroughly:
   ```bash
   python jobs/daily_refresh_enhanced.py --dry-run
   ```

2. Compare with existing refresh:
   ```bash
   # Old
   python jobs/daily_refresh.py
   
   # New
   python jobs/daily_refresh_enhanced.py
   ```

3. Update cron job or k8s cronjob to use new script

### API Integration

Add analysis endpoint:
```python
@router.get("/admin/schedule-analysis")
async def schedule_analysis():
    parser = EnhancedDataParser()
    # ... fetch current schedules ...
    return parser.analyze_schedule_coverage(sessions)
```

## Benefits Over Basic Parser

| Feature | Basic Parser | Enhanced Parser |
|---------|-------------|----------------|
| Classification | Simple keyword | Confidence-based |
| Facility Matching | Basic fuzzy | Multi-criteria scoring |
| Data Validation | None | Comprehensive |
| Conflict Detection | None | Automatic |
| Schedule Analysis | None | Full analytics |
| Reporting | Minimal | Detailed JSON |
| Performance | Good | Optimized with caching |
| Error Handling | Basic | Robust with tracking |

## Future Enhancements

Potential additions:
- [ ] Machine learning for facility matching
- [ ] Historical trend analysis
- [ ] Predictive scheduling
- [ ] Multi-city support
- [ ] Real-time updates via websockets
- [ ] Automated anomaly detection
- [ ] Schedule recommendation engine
- [ ] User preference learning

## Documentation

See `docs/ENHANCED_PARSER.md` for:
- Complete API reference
- Usage examples
- Integration patterns
- Troubleshooting guide
- Performance optimization tips

## Development Notes

### Code Quality
- ✅ No linting errors
- ✅ Type hints throughout
- ✅ Comprehensive docstrings
- ✅ Error handling
- ✅ Logging with loguru

### Testing
- ✅ 6 comprehensive test cases
- ✅ Mock data for unit tests
- ✅ Real data integration test
- ✅ Performance benchmarking

### Dependencies
- Pandas: Industry-standard data analysis
- OpenPyXL: Pure Python XLSX parsing
- Loguru: Enhanced logging

## Migration Path

To migrate from basic to enhanced parser:

1. **Phase 1**: Install new dependencies
2. **Phase 2**: Run parallel for comparison
3. **Phase 3**: Validate quality metrics
4. **Phase 4**: Switch production to enhanced
5. **Phase 5**: Monitor and optimize

## Questions & Support

For questions about this branch:
1. Read `docs/ENHANCED_PARSER.md`
2. Run `test_enhanced_parser.py` to see examples
3. Check logs for detailed error messages
4. Review exported JSON reports

## Contributing

When extending:
- Add tests to `test_enhanced_parser.py`
- Update `docs/ENHANCED_PARSER.md`
- Maintain backward compatibility
- Follow existing code style
- Add type hints and docstrings

## License

Part of SwimTO project - Private repository for commercial use.

---

**Ready to merge?** Run full test suite and compare results with production data before merging to main.

