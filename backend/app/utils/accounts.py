"""Deleting an account without taking other people's work with it.

Before sharing, deleting an account deleted everything the account owned. Now an apiary can have
collaborators who have recorded inspections in it, so what was shared is handed over to them
instead. What was not shared goes, as before. See "When an owner deletes their account" in the
API contract.
"""
from __future__ import annotations

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models import Apiary, FieldDefinition, Hive, Inspection, QrBatch, QrToken, Share, User


def _first_accepted(db: Session, **target) -> list[Share]:
    return (
        db.query(Share)
        .filter_by(status="accepted", **target)
        .order_by(Share.accepted_at.asc(), Share.created_at.asc())
        .all()
    )


class _Heirs:
    """The QR codes of a hive have to follow it to its new owner, or deleting the old owner's
    batches would take the codes, and with them the hives, along."""

    def __init__(self, db: Session):
        self.db = db
        self._batches: dict[str, QrBatch] = {}

    def give_hive(self, hive: Hive, heir_id: str) -> None:
        hive.user_id = heir_id
        token = self.db.get(QrToken, hive.qr_token)
        if token is None:
            return
        batch = self._batches.get(heir_id)
        if batch is None:
            batch = QrBatch(user_id=heir_id, count=0)
            self.db.add(batch)
            self.db.flush()
            self._batches[heir_id] = batch
        token.user_id = heir_id
        token.batch_id = batch.id
        batch.count += 1


def hand_over_shared(db: Session, user: User) -> None:
    """Pass on whatever the user shared, and detach what they leave in other people's apiaries."""
    uid = user.id
    heirs = _Heirs(db)

    # An apiary shared as a whole goes to the collaborator who accepted first, with every hive
    # in it that the leaving user had made, and its own custom fields.
    for apiary in db.query(Apiary).filter(Apiary.user_id == uid).all():
        shares = _first_accepted(db, apiary_id=apiary.id)
        if not shares:
            continue
        heir = shares[0].grantee_user_id
        apiary.user_id = heir
        for hive in db.query(Hive).filter(Hive.apiary_id == apiary.id, Hive.user_id == uid).all():
            heirs.give_hive(hive, heir)
        for field in db.query(FieldDefinition).filter(
            FieldDefinition.apiary_id == apiary.id, FieldDefinition.user_id == uid
        ).all():
            field.user_id = heir
        db.delete(shares[0])  # the heir owns it now; no share to themselves
        for other in shares[1:]:
            other.owner_id = heir

    # A hive shared on its own goes to its collaborator, in a new apiary of theirs that carries
    # the old apiary's name, because a hive cannot exist without one.
    own_hive_ids = (
        db.query(Hive.id).filter(
            or_(Hive.user_id == uid, Hive.apiary_id.in_(db.query(Apiary.id).filter(Apiary.user_id == uid)))
        )
    )
    for hive in db.query(Hive).filter(Hive.id.in_(own_hive_ids)).all():
        shares = _first_accepted(db, hive_id=hive.id)
        if not shares:
            continue
        heir = shares[0].grantee_user_id
        landing = Apiary(user_id=heir, name=hive.apiary.name)
        db.add(landing)
        db.flush()
        hive.apiary_id = landing.id
        heirs.give_hive(hive, heir)
        db.delete(shares[0])
        for other in shares[1:]:
            other.owner_id = heir

    # Hives the user added to somebody else's apiary stay with that apiary's owner.
    for hive in db.query(Hive).filter(Hive.user_id == uid).all():
        if hive.apiary.user_id != uid:
            heirs.give_hive(hive, hive.apiary.user_id)

    # What the user recorded on other people's hives stays; only the name goes.
    db.query(Inspection).filter(Inspection.created_by_id == uid).update(
        {Inspection.created_by_id: None}, synchronize_session=False
    )
    db.flush()


def delete_account(db: Session, user: User) -> None:
    """Hand over what was shared, then delete the rest as before."""
    uid = user.id
    hand_over_shared(db, user)

    # Invitations the user sent or received and shares that were not handed over.
    db.query(Share).filter(or_(Share.owner_id == uid, Share.grantee_user_id == uid)).delete(
        synchronize_session=False
    )

    owned_apiaries = db.query(Apiary.id).filter(Apiary.user_id == uid)
    leaving_hives = db.query(Hive.id).filter(
        or_(Hive.user_id == uid, Hive.apiary_id.in_(owned_apiaries))
    )
    # Delete in FK order: inspections → hives → user (the cascade handles the rest).
    db.query(Inspection).filter(Inspection.hive_id.in_(leaving_hives)).delete(synchronize_session=False)
    db.query(Hive).filter(Hive.id.in_(leaving_hives)).delete(synchronize_session=False)
    # Whatever was moved to somebody else must not be deleted through the user's collections.
    db.flush()
    db.expire_all()
    db.delete(db.get(User, uid))
    db.commit()
