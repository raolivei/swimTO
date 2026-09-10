"""Richmond Hill swim data source via ActiveNet (York Region)."""
from sources.activenet_source import ActiveNetSource


class RichmondHillActiveNet(ActiveNetSource):
    """Richmond Hill recreation programs — ActiveNet portal.

    ActiveNet site: https://anc.ca.apm.activecommunities.com/richmondhill
    """

    city = "Richmond Hill"
    region = "York"
    SITE_NAME = "richmondhill"
    CITY_SLUG = "richmond-hill"
