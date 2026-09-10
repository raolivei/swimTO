"""Tests for admin user endpoints."""

import os
from datetime import datetime, timedelta, timezone

import pytest

from app.models import User

ADMIN_HEADERS = {"Authorization": "Bearer test-token"}


@pytest.fixture(autouse=True)
def admin_token_env(monkeypatch):
    monkeypatch.setenv("ADMIN_TOKEN", "test-token")


def _add_user(db, email: str, days_ago: int = 0) -> User:
    created = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days_ago)
    user = User(
        email=email,
        name="Test User",
        google_id=f"google-{email}",
        created_at=created,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_admin_users_requires_token(client):
    response = client.get("/admin/users")
    assert response.status_code == 401


def test_admin_users_rejects_bad_token(client):
    response = client.get(
        "/admin/users",
        headers={"Authorization": "Bearer wrong"},
    )
    assert response.status_code == 403


def test_admin_users_lists_registered_users(client, db):
    _add_user(db, "alpha@example.com", days_ago=10)
    _add_user(db, "beta@example.com", days_ago=1)

    response = client.get("/admin/users", headers=ADMIN_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    emails = {u["email"] for u in data["users"]}
    assert emails == {"alpha@example.com", "beta@example.com"}


def test_admin_user_stats(client, db):
    _add_user(db, "old@example.com", days_ago=30)
    _add_user(db, "recent@example.com", days_ago=0)

    response = client.get("/admin/users/stats", headers=ADMIN_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["total_users"] == 2
    assert data["signups_today"] >= 1
    assert "signups_this_week" in data
    assert "week_start_utc" in data
