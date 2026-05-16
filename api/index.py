import sys
import os
import json
import traceback

_startup_error: str | None = None

try:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))
    from main import app as _fastapi_app  # noqa: F401
    app = _fastapi_app
except Exception as _exc:
    _startup_error = traceback.format_exc()

    async def app(scope, receive, send):  # type: ignore[misc]
        if scope["type"] == "http":
            body = json.dumps({"startup_error": _startup_error}).encode()
            await send({
                "type": "http.response.start",
                "status": 200,
                "headers": [
                    [b"content-type", b"application/json"],
                    [b"access-control-allow-origin", b"*"],
                ],
            })
            await send({"type": "http.response.body", "body": body})
