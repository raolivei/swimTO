"""Strict normalization shared by municipal calendar adapters."""
import re
import json
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo


COORDINATES = json.loads(Path(__file__).with_name('municipal_coordinates.json').read_text())


def local_today():
    return datetime.now(ZoneInfo('America/Toronto')).date()


def slug(value):
    return re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')


def swim_type(name):
    name = name.casefold()
    if any(word in name for word in ('lane', 'length', 'lap swim')):
        return 'LANE_SWIM'
    if any(word in name for word in ('aquafit', 'aqua ', 'aquatic strength', 'water exercise',
                                     'aquatic fitness', 'water strength', 'water running', 'h2o')):
        return 'AQUATIC_FITNESS'
    if 'adult' in name and 'swim' in name:
        return 'ADULT_SWIM'
    if 'senior' in name and 'swim' in name:
        return 'SENIOR_SWIM'
    if any(word in name for word in ('swim', 'parent & tot', 'parent and tot', 'fun n fit', 'pool leisure')):
        return 'RECREATIONAL'
    return None
