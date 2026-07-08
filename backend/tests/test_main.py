import pytest

from main import check_secret_key_safety


def test_secret_key_check_passes_in_development_with_default_key():
    check_secret_key_safety("development", "dev-secret-change-me")  # must not raise


def test_secret_key_check_passes_in_production_with_real_key():
    check_secret_key_safety("production", "a-real-randomly-generated-secret")  # must not raise


def test_secret_key_check_fails_in_production_with_default_key():
    with pytest.raises(RuntimeError):
        check_secret_key_safety("production", "dev-secret-change-me")


def test_cors_allows_configured_production_origin(client):
    r = client.get("/api/v1/hornets/stats", headers={"Origin": "https://hivepulse.multihead.de"})
    assert r.headers.get("access-control-allow-origin") == "https://hivepulse.multihead.de"


def test_cors_allows_vercel_preview_origin(client):
    r = client.get(
        "/api/v1/hornets/stats",
        headers={"Origin": "https://hivepulse-staging-git-some-branch.vercel.app"},
    )
    assert r.headers.get("access-control-allow-origin") == "https://hivepulse-staging-git-some-branch.vercel.app"


def test_cors_rejects_arbitrary_origin(client):
    r = client.get("/api/v1/hornets/stats", headers={"Origin": "https://evil.example.com"})
    assert "access-control-allow-origin" not in r.headers
