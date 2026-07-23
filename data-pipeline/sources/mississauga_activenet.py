"""Mississauga swim data source via ActiveNet (Peel Region)."""
from sources.activenet_source import ActiveNetSource


class MississaugaActiveNet(ActiveNetSource):
    """Mississauga City recreation programs — ActiveNet portal.

    ActiveNet site: https://anc.ca.apm.activecommunities.com/mississauga
    """

    city = "Mississauga"
    region = "Peel"
    SITE_NAME = "mississauga"
    CITY_SLUG = "mississauga"
