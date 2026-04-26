def test_create_user_field_definition(auth_client):
    r = auth_client.post("/api/v1/field-definitions", json={
        "target": "inspection",
        "name": "Nectar Source",
        "type": "text",
        "options": [],
        "required": False,
        "sort_order": 0
    })
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Nectar Source"
    assert data["scope"] == "user"
    assert data["apiary_id"] is None


def test_list_user_field_definitions(auth_client):
    auth_client.post("/api/v1/field-definitions", json={
        "target": "inspection", "name": "Field A", "type": "number",
        "options": [], "required": False, "sort_order": 0
    })
    auth_client.post("/api/v1/field-definitions", json={
        "target": "hive", "name": "Field B", "type": "boolean",
        "options": [], "required": True, "sort_order": 1
    })
    r = auth_client.get("/api/v1/field-definitions")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_delete_user_field_definition(auth_client):
    r = auth_client.post("/api/v1/field-definitions", json={
        "target": "inspection", "name": "Temp", "type": "text",
        "options": [], "required": False, "sort_order": 0
    })
    fid = r.json()["id"]
    r2 = auth_client.delete(f"/api/v1/field-definitions/{fid}")
    assert r2.status_code == 204
    r3 = auth_client.get("/api/v1/field-definitions")
    assert len(r3.json()) == 0


def test_create_apiary_field_definition(auth_client):
    apiary = auth_client.post("/api/v1/apiaries", json={"name": "North Field"}).json()
    r = auth_client.post(f"/api/v1/apiaries/{apiary['id']}/field-definitions", json={
        "target": "hive",
        "name": "Plot Number",
        "type": "number",
        "options": [],
        "required": False,
        "sort_order": 0
    })
    assert r.status_code == 201
    data = r.json()
    assert data["scope"] == "apiary"
    assert data["apiary_id"] == apiary["id"]


def test_list_apiary_field_definitions(auth_client):
    apiary = auth_client.post("/api/v1/apiaries", json={"name": "A"}).json()
    auth_client.post(f"/api/v1/apiaries/{apiary['id']}/field-definitions", json={
        "target": "inspection", "name": "Temp", "type": "number",
        "options": [], "required": False, "sort_order": 0
    })
    r = auth_client.get(f"/api/v1/apiaries/{apiary['id']}/field-definitions")
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_select_type_with_options(auth_client):
    r = auth_client.post("/api/v1/field-definitions", json={
        "target": "inspection",
        "name": "Condition",
        "type": "select",
        "options": ["good", "fair", "poor"],
        "required": True,
        "sort_order": 0
    })
    assert r.status_code == 201
    assert r.json()["options"] == ["good", "fair", "poor"]


def test_field_definitions_isolated_between_users(client):
    client.post("/api/v1/auth/register", json={"email": "u1@x.com", "password": "pw1pw1pw", "name": "U1", "locale": "en"})
    h1 = {"Authorization": f"Bearer {client.post('/api/v1/auth/login', json={'email': 'u1@x.com', 'password': 'pw1pw1pw'}).json()['access_token']}"}

    client.post("/api/v1/auth/register", json={"email": "u2@x.com", "password": "pw2pw2pw", "name": "U2", "locale": "en"})
    h2 = {"Authorization": f"Bearer {client.post('/api/v1/auth/login', json={'email': 'u2@x.com', 'password': 'pw2pw2pw'}).json()['access_token']}"}

    client.post("/api/v1/field-definitions", json={
        "target": "inspection", "name": "Secret", "type": "text",
        "options": [], "required": False, "sort_order": 0
    }, headers=h1)
    r = client.get("/api/v1/field-definitions", headers=h2)
    assert len(r.json()) == 0
