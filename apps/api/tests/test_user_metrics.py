"""Tests for user signup metric helpers."""

from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from app.user_metrics import toronto_day_start, toronto_week_start

TORONTO = ZoneInfo("America/Toronto")


def test_toronto_week_start_is_monday_midnight():
    # Wednesday 2026-06-18 15:00 Toronto
    when = datetime(2026, 6, 18, 15, 0, tzinfo=TORONTO)
    start = toronto_week_start(when)
    # Monday 2026-06-16 04:00 UTC (EDT = UTC-4)
    assert start == datetime(2026, 6, 16, 4, 0)


def test_toronto_day_start_is_local_midnight():
    when = datetime(2026, 6, 18, 15, 0, tzinfo=TORONTO)
    start = toronto_day_start(when)
    assert start == datetime(2026, 6, 18, 4, 0)
