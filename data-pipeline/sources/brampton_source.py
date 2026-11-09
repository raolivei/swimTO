"""Brampton's official drop-in swimming calendar."""
from .perfectmind_source import PerfectMindSource


class BramptonSource(PerfectMindSource):
    city = "Brampton"
    region = "Peel"
    BASE_URL = "https://cityofbrampton.perfectmind.com"
    WIDGET_ID = "15f6af07-39c5-473e-b053-96653f77a406"
    CALENDAR_ID = "75f21720-2af5-4f4c-8d2b-27f5818a1ea6"
