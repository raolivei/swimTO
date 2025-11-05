"""Toronto Open Data API client."""
import requests
from typing import List, Dict, Optional
from loguru import logger


class OpenDataClient:
    """Client for Toronto Open Data Portal."""
    
    def __init__(self, base_url: str = "https://ckan0.cf.opendata.inter.prod-toronto.ca"):
        self.base_url = base_url
        self.session = requests.Session()
        
    def search_datasets(self, query: str) -> List[Dict]:
        """Search for datasets by query."""
        try:
            url = f"{self.base_url}/api/3/action/package_search"
            params = {"q": query, "rows": 50}
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            if data.get("success"):
                return data.get("result", {}).get("results", [])
            return []
        except Exception as e:
            logger.error(f"Error searching datasets for '{query}': {e}")
            return []
    
    def get_dataset(self, dataset_id: str) -> Optional[Dict]:
        """Get dataset metadata by ID."""
        try:
            url = f"{self.base_url}/api/3/action/package_show"
            params = {"id": dataset_id}
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            if data.get("success"):
                return data.get("result")
            return None
        except Exception as e:
            logger.error(f"Error fetching dataset '{dataset_id}': {e}")
            return None
    
    def download_resource(self, resource_url: str) -> Optional[bytes]:
        """Download a resource file."""
        try:
            response = self.session.get(resource_url, timeout=60)
            response.raise_for_status()
            return response.content
        except Exception as e:
            logger.error(f"Error downloading resource '{resource_url}': {e}")
            return None
    
    def find_pool_datasets(self) -> List[Dict]:
        """Find all pool-related datasets."""
        queries = ["pool", "swim", "recreation", "aquatic", "drop-in"]
        all_datasets = []
        seen_ids = set()
        
        for query in queries:
            datasets = self.search_datasets(query)
            for dataset in datasets:
                dataset_id = dataset.get("id")
                if dataset_id and dataset_id not in seen_ids:
                    seen_ids.add(dataset_id)
                    all_datasets.append(dataset)
        
        logger.info(f"Found {len(all_datasets)} unique pool-related datasets")
        return all_datasets

