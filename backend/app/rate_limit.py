from datetime import datetime, timedelta

from fastapi import HTTPException, Request, status
from sqlalchemy.orm import Session

from app.models import RateLimitHit

# Rows older than this are opportunistically purged on every call so the table
# doesn't grow unbounded — comfortably larger than any window used below.
_MAX_ROW_AGE = timedelta(hours=6)


def _client_ip(request: Request) -> str:
    """Best-effort real client IP behind Vercel's reverse proxy.

    Vercel forwards the original client IP as the first entry of
    X-Forwarded-For; request.client.host would otherwise be the proxy's IP.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce_rate_limit(
    db: Session,
    request: Request,
    bucket: str,
    limit: int,
    window_minutes: int,
) -> None:
    """Raise 429 if `bucket` has been hit >= `limit` times by this client
    within the last `window_minutes`. Otherwise records this hit.

    State lives in the database (not process memory) since the backend runs
    as stateless serverless functions.
    """
    now = datetime.utcnow()
    db.query(RateLimitHit).filter(RateLimitHit.created_at < now - _MAX_ROW_AGE).delete()

    key = f"{bucket}:{_client_ip(request)}"
    window_start = now - timedelta(minutes=window_minutes)
    count = (
        db.query(RateLimitHit)
        .filter(RateLimitHit.bucket_key == key, RateLimitHit.created_at >= window_start)
        .count()
    )
    if count >= limit:
        db.commit()  # persist the purge above even when rejecting
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "RATE_LIMITED", "message": "Too many requests. Please try again later."},
        )

    db.add(RateLimitHit(bucket_key=key, created_at=now))
    db.commit()
