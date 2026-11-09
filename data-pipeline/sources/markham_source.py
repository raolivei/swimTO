"""Markham's official swimming and aquafit calendars."""
from .perfectmind_source import PerfectMindSource


class MarkhamSource(PerfectMindSource):
    city = "Markham"
    region = "York"
    BASE_URL = "https://cityofmarkham.perfectmind.com"
    WIDGET_ID = "6825ea71-e5b7-4c2a-948f-9195507ad90a"
    CALENDAR_ID = "39bd5c76-e07f-43f3-af24-c6969091dbb4"
    EXTRA_CALENDARS = ("d4d891dd-9e45-474b-97c4-e43c8f8fe3b8",)
