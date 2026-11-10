"""What time it is, answered in one place.

Every `DateTime` column in this database holds a **naive UTC** timestamp — `created_at`,
`decided_at`, `expires_at`, all of them. That is the convention the clients decode with
(`BackendDateDecoding.swift` on iPhone, the same shape on Android and the web), and it is not
going to change.

`date.today()` and `datetime.now()` do not answer in that convention. They answer in the
**server's local timezone**, which is an accident of where the process happens to run. Mixing the
two is how #443 happened:

    today = date.today()                                        # server-local
    basis = last_on or (hive.created_at.date() if ... else today)  # naive UTC
    due_on = basis + timedelta(days=interval)

Between midnight local and midnight UTC the two disagree by a day, so the reminder for a hive
that was never inspected came out a day early or a day late — and the one job of that figure is
to tell a beekeeper *when*. It never showed up in CI because GitHub's runners run in UTC, where
`date.today()` happens to be right. It only appears on a machine that is not, which is every
developer in Europe after midnight, and any production host whose timezone somebody sets.

So: nothing in `app/` asks the operating system what day it is. It asks here, and gets UTC.

**UTC is not the beekeeper's day either**, and this module does not pretend otherwise. At 23:30 in
Berlin it is already tomorrow for the beekeeper and still today in UTC. The server cannot know —
it has no timezone for the account. The clients do know, so they send the day they mean
(`done_on`, `moved_on`, an inspection's `date`), and the schema validation allows one day into the
future precisely so a client ahead of UTC is never rejected. The values here are the fallback for
a caller that sends nothing, and the basis for comparing against what is stored.
"""
from __future__ import annotations

from datetime import date, datetime, timezone

__all__ = ["now_utc", "today_utc"]


def now_utc() -> datetime:
    """The current UTC time, naive — the exact shape the `DateTime` columns hold.

    Naive on purpose. SQLAlchemy would happily store an aware datetime, and then every comparison
    against the rows already in the table would raise `TypeError: can't compare offset-naive and
    offset-aware datetimes` — in production, on the rows that are already there.

    This also replaces `datetime.utcnow()`, which Python 3.12 deprecates and a later version will
    remove.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


def today_utc() -> date:
    """Today's date in UTC — the day the stored timestamps are counted in."""
    return now_utc().date()
