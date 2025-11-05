#!/usr/bin/env python3
"""
Enhanced daily refresh job using the new parser.

Features:
- Advanced data parsing and validation
- Conflict detection and resolution
- Quality metrics and reporting
- Smart facility matching
- Comprehensive logging
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from sources.enhanced_parser import EnhancedDataParser
from models import Facility, Schedule

# Configure logger
log_file = Path(__file__).parent.parent / "logs" / f"enhanced_refresh_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.log"
log_file.parent.mkdir(exist_ok=True)
logger.add(log_file, rotation="10 MB", retention="30 days")


def get_database_url() -> str:
    """Get database URL from environment."""
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "swimto")
    db_user = os.getenv("DB_USER", "swimto")
    db_pass = os.getenv("DB_PASS", "swimto")
    
    return f"postgresql+psycopg://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"


def refresh_schedules_enhanced(weeks_ahead: int = 4, dry_run: bool = False):
    """
    Refresh pool schedules using enhanced parser.
    
    Args:
        weeks_ahead: Number of weeks to generate schedules for
        dry_run: If True, don't write to database (testing mode)
    """
    logger.info("=" * 70)
    logger.info("🏊 SwimTO Enhanced Daily Refresh")
    logger.info("=" * 70)
    logger.info(f"Started at: {datetime.now()}")
    logger.info(f"Weeks ahead: {weeks_ahead}")
    logger.info(f"Dry run: {dry_run}")
    logger.info("")
    
    # Initialize database
    try:
        database_url = get_database_url()
        engine = create_engine(database_url)
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()
        
        logger.success("✅ Database connection established")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return 1
    
    try:
        # Fetch existing facilities
        logger.info("📋 Fetching existing facilities...")
        facilities = db.query(Facility).all()
        logger.info(f"Found {len(facilities)} facilities in database")
        
        if not facilities:
            logger.warning("⚠️  No facilities found! Run seed_facilities.py first")
            return 1
        
        # Initialize enhanced parser
        logger.info("\n🚀 Initializing enhanced parser...")
        parser = EnhancedDataParser(timeout=120)
        
        # Run complete parsing pipeline
        logger.info("📡 Fetching and parsing Toronto Open Data...")
        result = parser.parse_all_to_sessions(
            existing_facilities=facilities,
            weeks_ahead=weeks_ahead,
            optimize=True  # Auto-resolve conflicts
        )
        
        # Log parsing statistics
        logger.info("\n" + "=" * 70)
        logger.info("📊 PARSING STATISTICS")
        logger.info("=" * 70)
        
        stats = result['stats']
        logger.info(f"Total Programs: {stats['total_programs']}")
        logger.info(f"Swim Programs: {stats['swim_programs']} ({stats['swim_programs']/stats['total_programs']*100:.1f}%)")
        logger.info(f"Sessions Generated: {stats['sessions_generated']}")
        logger.info(f"Facilities Matched: {stats['facilities_matched']}")
        logger.info(f"Facilities Unmatched: {stats['facilities_unmatched']}")
        logger.info(f"Parsing Errors: {stats['parsing_errors']}")
        
        # Log quality report
        logger.info("\n" + "=" * 70)
        logger.info("✅ DATA QUALITY REPORT")
        logger.info("=" * 70)
        
        quality = result['quality_report']
        logger.info(f"Total Sessions: {quality.get('total_sessions', 0)}")
        logger.info(f"Valid Sessions: {quality.get('valid_sessions', 0)}")
        logger.info(f"Invalid Sessions: {quality.get('invalid_sessions', 0)}")
        logger.info(f"Quality Score: {quality.get('quality_score', 0):.2%}")
        
        if quality.get('issues_by_type'):
            logger.info("\nIssues by Type:")
            for issue_type, count in quality['issues_by_type'].items():
                logger.warning(f"  ⚠️  {issue_type}: {count}")
        
        if quality.get('recommendations'):
            logger.info("\n💡 Recommendations:")
            for rec in quality['recommendations']:
                logger.info(f"  - {rec}")
        
        # Log schedule analysis
        logger.info("\n" + "=" * 70)
        logger.info("📅 SCHEDULE ANALYSIS")
        logger.info("=" * 70)
        
        analysis = result['schedule_analysis']
        if analysis:
            logger.info(f"Total Sessions: {analysis.get('total_sessions', 0)}")
            logger.info(f"Facilities with Sessions: {analysis.get('facilities_count', 0)}")
            
            if analysis.get('date_range'):
                start, end = analysis['date_range']
                logger.info(f"Date Range: {start} to {end} ({(end - start).days} days)")
            
            if analysis.get('coverage_by_day'):
                logger.info("\nCoverage by Day:")
                day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                for day, count in sorted(analysis['coverage_by_day'].items()):
                    logger.info(f"  {day_names[day]}: {count} sessions")
            
            if analysis.get('peak_times'):
                logger.info("\nPeak Times (Top 5):")
                for hour, count in analysis['peak_times'][:5]:
                    logger.info(f"  {hour:02d}:00 - {count} sessions")
            
            if analysis.get('gaps'):
                gap_count = len(analysis['gaps'])
                if gap_count > 0:
                    logger.warning(f"\n⚠️  Found {gap_count} coverage gaps")
                    for gap in analysis['gaps'][:5]:  # Show first 5
                        logger.warning(f"  - {gap['description']}")
                    if gap_count > 5:
                        logger.warning(f"  ... and {gap_count - 5} more")
        
        # Filter sessions with matched facilities
        matched_sessions = [s for s in result['sessions'] if s.get('facility_id')]
        unmatched_count = len(result['sessions']) - len(matched_sessions)
        
        logger.info(f"\n📍 Facility Matching:")
        logger.info(f"  Matched: {len(matched_sessions)}")
        logger.info(f"  Unmatched: {unmatched_count}")
        
        if unmatched_count > 0:
            logger.warning(f"  ⚠️  {unmatched_count} sessions from unmatched facilities will be skipped")
        
        # Database operations
        if not dry_run:
            logger.info("\n" + "=" * 70)
            logger.info("💾 DATABASE UPDATE")
            logger.info("=" * 70)
            
            # Clear existing schedules
            logger.info("Clearing existing schedules...")
            deleted_count = db.query(Schedule).delete()
            logger.info(f"Deleted {deleted_count} old schedule entries")
            
            # Insert new schedules
            logger.info(f"Inserting {len(matched_sessions)} new schedule entries...")
            
            insert_count = 0
            error_count = 0
            
            for session in matched_sessions:
                try:
                    schedule = Schedule(
                        facility_id=session['facility_id'],
                        swim_type=session['swim_type'],
                        date=session['date'],
                        start_time=session['start_time'],
                        end_time=session['end_time'],
                        notes=session['notes'],
                        source='toronto_open_data',
                        source_url=session.get('source_url'),
                        data_hash=session.get('data_hash')
                    )
                    db.add(schedule)
                    insert_count += 1
                    
                    # Commit in batches for better performance
                    if insert_count % 100 == 0:
                        db.commit()
                        logger.info(f"  Committed {insert_count} schedules...")
                        
                except Exception as e:
                    logger.error(f"Error inserting schedule: {e}")
                    error_count += 1
            
            # Final commit
            db.commit()
            logger.success(f"✅ Successfully inserted {insert_count} schedules")
            
            if error_count > 0:
                logger.warning(f"⚠️  {error_count} errors during insertion")
        else:
            logger.info("\n🔍 DRY RUN MODE - No database changes made")
        
        # Export detailed report
        logger.info("\n" + "=" * 70)
        logger.info("📄 EXPORTING REPORT")
        logger.info("=" * 70)
        
        report_path = parser.export_report(result)
        logger.info(f"Detailed report saved to: {report_path}")
        
        # Summary
        logger.info("\n" + "=" * 70)
        logger.info("🎉 REFRESH COMPLETED")
        logger.info("=" * 70)
        logger.info(f"Completed at: {datetime.now()}")
        logger.info(f"Status: {'SUCCESS' if stats['parsing_errors'] == 0 else 'COMPLETED WITH ERRORS'}")
        logger.info(f"Sessions in database: {len(matched_sessions) if not dry_run else 'N/A (dry run)'}")
        logger.info(f"Quality score: {quality.get('quality_score', 0):.2%}")
        logger.info("=" * 70 + "\n")
        
        return 0
        
    except KeyboardInterrupt:
        logger.warning("\n⚠️  Refresh interrupted by user")
        db.rollback()
        return 130
        
    except Exception as e:
        logger.error(f"\n❌ Refresh failed with error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        db.rollback()
        return 1
        
    finally:
        db.close()
        logger.info("Database connection closed")


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Enhanced daily refresh for SwimTO schedules"
    )
    parser.add_argument(
        '--weeks',
        type=int,
        default=4,
        help='Number of weeks to generate schedules for (default: 4)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Run without writing to database (testing mode)'
    )
    
    args = parser.parse_args()
    
    exit_code = refresh_schedules_enhanced(
        weeks_ahead=args.weeks,
        dry_run=args.dry_run
    )
    
    sys.exit(exit_code)


if __name__ == "__main__":
    main()

