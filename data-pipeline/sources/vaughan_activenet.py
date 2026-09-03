"""Vaughan swim data source via ActiveNet (York Region)."""
from sources.activenet_source import ActiveNetSource


class VaughanActiveNet(ActiveNetSource):
    """City of Vaughan recreation programs — ActiveNet portal.

    ActiveNet site: https://anc.ca.apm.activecommunities.com/vaughan
    """

    city = "Vaughan"
    region = "York"
    SITE_NAME = "vaughan"
    CITY_SLUG = "vaughan"
