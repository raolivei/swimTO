"""Maps CITY_SOURCES source IDs to BaseSwimSource classes.

Add an entry here whenever a new city source is implemented.
Toronto sources are excluded — they run via legacy hardcoded paths in daily_refresh.py.
"""
from sources.mississauga_activenet import MississaugaActiveNet
from sources.richmond_hill_activenet import RichmondHillActiveNet

SOURCE_REGISTRY: dict[str, type] = {
    "mississauga_activenet": MississaugaActiveNet,
    "richmond_hill_activenet": RichmondHillActiveNet,
}
