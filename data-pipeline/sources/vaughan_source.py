"""Vaughan's official Swimming & Aquafitness calendar."""
from .perfectmind_source import PerfectMindSource


class VaughanSource(PerfectMindSource):
    city = "Vaughan"
    region = "York"
    BASE_URL = "https://vaughan.perfectmind.com"
    WIDGET_ID = "090e1ac2-67e2-443a-a3a9-bb1b38aa4cb8"
    CALENDAR_ID = "71fe848e-2dbd-4ec5-92fa-7f2d0ad09354"
