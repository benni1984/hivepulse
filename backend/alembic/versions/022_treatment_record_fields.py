"""The three things a treatment record asks for that a plan did not.

`planned_treatments` was built to answer "what still has to happen". A record of veterinary
medicines asks a different question -- "what did happen, to how many animals, how much of it" --
and three columns were missing for it (#477).

* **amount** -- the quantity given. Free text, not a number with a unit: a dose is written the way
  a product is applied ("2 x 15 ml per colony", "60 g", "one strip per 5 frames"), and forcing that
  into a number would either lose the meaning or be filled in wrongly.
* **withdrawal_days** -- how long before the honey may be taken. Null where a product has none.
* **hive_count_treated** -- how many colonies the treatment covered, **frozen when it is marked
  done**. This is the one that is not a convenience. A document assembled later would count the
  colonies that exist *then*: somebody who treats ten in August and gives three away in October
  would get a record claiming they treated seven. That is a false statement in a document an
  authority may ask to see, and no amount of care elsewhere would catch it.

All three are nullable, on purpose. Treatments recorded before this exist and keep existing; the
record prints a blank where one is missing and says how many entries are incomplete. A document
that shows its gaps tells a beekeeper what to go and fill in. One that refuses to print tells them
nothing.

Revision ID: 022
Revises: 021
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "022"
down_revision: Union[str, None] = "021"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("planned_treatments", sa.Column("amount", sa.String(length=100), nullable=True))
    op.add_column("planned_treatments", sa.Column("withdrawal_days", sa.Integer(), nullable=True))
    op.add_column("planned_treatments",
                  sa.Column("hive_count_treated", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("planned_treatments", "hive_count_treated")
    op.drop_column("planned_treatments", "withdrawal_days")
    op.drop_column("planned_treatments", "amount")
