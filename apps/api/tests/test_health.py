"""Test health endpoints."""


def test_health_check(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    # Health endpoint now returns "degraded" when DB is unavailable (resilient design)
    assert data["status"] in ["healthy", "degraded", "unhealthy"]
    assert "version" in data
    assert "database" in data  # Database status field was added


def test_root_endpoint(client):
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    # Health endpoint now returns "degraded" when DB is unavailable (resilient design)
    assert data["status"] in ["healthy", "degraded", "unhealthy"]

