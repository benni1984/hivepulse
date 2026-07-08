def test_create_batch(auth_client):
    r = auth_client.post("/api/v1/qr-batches", json={"count": 5})
    assert r.status_code == 201
    data = r.json()
    assert data["count"] == 5
    assert len(data["tokens"]) == 5
    for t in data["tokens"]:
        assert t["linked_hive_id"] is None


def test_create_batch_count_limits(auth_client):
    r = auth_client.post("/api/v1/qr-batches", json={"count": 0})
    assert r.status_code == 422

    r = auth_client.post("/api/v1/qr-batches", json={"count": 101})
    assert r.status_code == 422


def test_list_batches(auth_client):
    auth_client.post("/api/v1/qr-batches", json={"count": 3})
    auth_client.post("/api/v1/qr-batches", json={"count": 2})
    r = auth_client.get("/api/v1/qr-batches")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


def test_get_batch(auth_client):
    created = auth_client.post("/api/v1/qr-batches", json={"count": 4}).json()
    r = auth_client.get(f"/api/v1/qr-batches/{created['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == created["id"]
    assert len(r.json()["tokens"]) == 4


def test_get_batch_not_found(auth_client):
    r = auth_client.get("/api/v1/qr-batches/does-not-exist")
    assert r.status_code == 404


def test_batch_linked_count(auth_client):
    apiary = auth_client.post("/api/v1/apiaries", json={"name": "G"}).json()
    batch = auth_client.post("/api/v1/qr-batches", json={"count": 3}).json()
    token = batch["tokens"][0]["token"]
    auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": token, "apiary_id": apiary["id"], "name": "H1", "hive_type": "langstroth"
    })
    r = auth_client.get("/api/v1/qr-batches")
    assert r.json()["items"][0]["linked_count"] == 1


def test_batch_pdf_download(auth_client):
    batch = auth_client.post("/api/v1/qr-batches", json={"count": 2}).json()
    r = auth_client.get(f"/api/v1/qr-batches/{batch['id']}/pdf")
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"


def test_batch_isolation_between_users(client):
    # Two separate users should not see each other's batches
    client.post("/api/v1/auth/register", json={"email": "u1@x.com", "password": "pw1pw1pw", "name": "U1", "locale": "en"})
    r1 = client.post("/api/v1/auth/login", json={"email": "u1@x.com", "password": "pw1pw1pw"})
    h1 = {"Authorization": f"Bearer {r1.json()['access_token']}"}

    client.post("/api/v1/auth/register", json={"email": "u2@x.com", "password": "pw2pw2pw", "name": "U2", "locale": "en"})
    r2 = client.post("/api/v1/auth/login", json={"email": "u2@x.com", "password": "pw2pw2pw"})
    h2 = {"Authorization": f"Bearer {r2.json()['access_token']}"}

    client.post("/api/v1/qr-batches", json={"count": 1}, headers=h1)
    r = client.get("/api/v1/qr-batches", headers=h2)
    assert r.json()["total"] == 0


def test_batch_detail_and_pdf_isolated_across_users(auth_client, auth_client2):
    batch_id = auth_client.post("/api/v1/qr-batches", json={"count": 1}).json()["id"]

    assert auth_client2.get(f"/api/v1/qr-batches/{batch_id}").status_code == 404
    assert auth_client2.get(f"/api/v1/qr-batches/{batch_id}/pdf").status_code == 404
