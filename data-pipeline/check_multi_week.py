#!/usr/bin/env python3
"""Check if facility pages show multiple weeks of schedules."""

import re
import sys
from bs4 import BeautifulSoup
import requests

def check_multi_week_schedule(url):
    """Check how many weeks of schedule a facility page shows."""
    try:
        print(f"Fetching: {url}")
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for "For the week of..." patterns
        week_headers = soup.find_all(text=re.compile(r'For the week of', re.IGNORECASE))
        
        print(f"\n✅ Found {len(week_headers)} 'For the week of...' sections")
        
        if week_headers:
            print("\nWeek headers found:")
            for i, header in enumerate(week_headers, 1):
                week_text = header.strip()
                print(f"  {i}. {week_text}")
                
                # Try to extract the date
                date_match = re.search(r'(\d{4})-(\d{2})-(\d{2})', week_text)
                if date_match:
                    print(f"     → Date: {date_match.group(0)}")
        else:
            print("\n❌ No 'For the week of...' headers found")
            print("\nSearching for any date patterns in the page...")
            
            # Look for any tables
            tables = soup.find_all('table')
            print(f"Found {len(tables)} tables on the page")
            
            if tables:
                print("\nFirst table headers:")
                first_table = tables[0]
                headers = first_table.find_all(['th', 'td'])[:10]
                for h in headers:
                    print(f"  - {h.get_text(strip=True)}")
        
        return len(week_headers)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 0

if __name__ == "__main__":
    # Trinity Community Recreation Centre
    trinity_url = "https://www.toronto.ca/data/parks/prd/facilities/complex/4/index.html"
    
    print("=" * 70)
    print("CHECKING TRINITY COMMUNITY RECREATION CENTRE")
    print("=" * 70)
    
    weeks_found = check_multi_week_schedule(trinity_url)
    
    print("\n" + "=" * 70)
    print("CONCLUSION:")
    print("=" * 70)
    
    if weeks_found == 0:
        print("⚠️  No weekly schedule sections found")
        print("   The page might use a different format")
    elif weeks_found == 1:
        print("⚠️  Only ONE week of schedule found")
        print("   → Need to implement weekly projection for future weeks")
        print("   → Or scraper needs to run weekly to populate next week")
    else:
        print(f"✅ Multiple weeks found ({weeks_found} weeks)")
        print("   → Current implementation will work for all weeks!")
    
    sys.exit(0)

