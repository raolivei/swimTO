#!/bin/bash
#
# Reseed the database with fresh facility and schedule data
#

set -e

echo "=========================================="
echo "Reseeding Database"
echo "=========================================="
echo ""
echo "This will:"
echo "  1. Clear all existing facilities and sessions"
echo "  2. Seed 40+ Toronto pool facilities with coordinates"
echo "  3. Generate varied demo schedules for the next 4 weeks"
echo ""
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Run the reseed script in the API container
docker-compose exec api python /data-pipeline/jobs/reseed_all.py

echo ""
echo "=========================================="
echo "✓ Database reseeded successfully!"
echo "=========================================="
echo ""
echo "You can now:"
echo "  - View the map at http://localhost:5173/map"
echo "  - Browse schedules at http://localhost:5173/schedule"
echo ""

