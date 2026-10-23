"""Dated placement checks over canonical native records; no duplicate ledger."""

import asm3.animal
import asm3.utils


def overlaps(start, end, other_start, other_end):
    # Native occupancy treats the return date as the end of the stay. A return
    # and a new movement may therefore share a date. Same-day history uses no
    # overnight capacity; intraday accommodation remains a separate launch gate.
    if end is not None and end <= start:
        return False
    if other_end is not None and other_end <= other_start:
        return False
    return (end is None or other_start < end) and (
        other_end is None or start < other_end
    )


def check_placement(dbo, post):
    kind = post.integer("type")
    if kind <= 0:
        return
    start = post.date("movementdate")
    end = post.date("returndate")
    if (post["movementdate"] and start is None) or (post["returndate"] and end is None):
        raise asm3.utils.ASMValidationError("Enter valid movement and return dates")
    start = start or dbo.today()  # Match the native general movement form default.
    if end is not None and end < start:
        raise asm3.utils.ASMValidationError("Return date cannot precede the movement")
    movement_id = post.integer("movementid")
    existing = dbo.query(
        "SELECT MovementDate, ReturnDate FROM adoption WHERE AnimalID = ? "
        "AND MovementType > 0 AND MovementDate IS NOT NULL AND ID <> ?",
        [post.integer("animal"), movement_id],
    )
    if any(overlaps(start, end, row.MOVEMENTDATE, row.RETURNDATE) for row in existing):
        raise asm3.utils.ASMValidationError(
            "Placement dates overlap an existing movement; record the actual return explicitly"
        )
    if kind not in (1, 2):
        return
    animal = asm3.animal.get_animal(dbo, post.integer("animal"))
    if not animal:
        raise asm3.utils.ASMValidationError("An animal record is required")
    # A closed historical record must not be evaluated as today's availability.
    # The native validator still checks intake/death dates for that history.
    ongoing = end is None or end > dbo.today()
    if ongoing and animal.get("DECEASEDDATE"):
        raise asm3.utils.ASMValidationError("A living animal record is required")
    if ongoing and kind == 1 and any(
        asm3.utils.cint(animal.get(key))
        for key in ("ISNOTAVAILABLEFORADOPTION", "ISHOLD", "ISQUARANTINE", "HASPERMANENTFOSTER")
    ):
        raise asm3.utils.ASMValidationError("This animal is not cleared for adoption")
    person = dbo.first_row(dbo.query(
        "SELECT ID, IDCheck, FosterCapacity, IsFosterer FROM owner WHERE ID = ?",
        [post.integer("person")],
    ))
    if not person or not person.IDCHECK:
        raise asm3.utils.ASMValidationError(
            "A recorded household assessment is required before placement"
        )
    if kind != 2:
        return
    capacity = asm3.utils.cint(person.FOSTERCAPACITY)
    if not person.ISFOSTERER or capacity <= 0:
        raise asm3.utils.ASMValidationError("Approved foster capacity is unavailable")
    stays = dbo.query(
        "SELECT MovementDate, ReturnDate FROM adoption WHERE OwnerID = ? "
        "AND MovementType = 2 AND MovementDate IS NOT NULL AND ID <> ?",
        [person.ID, movement_id],
    )
    # Count simultaneous occupancy, rather than counting every stay that touches
    # a longer proposed interval. This includes future-dated returns/bookings.
    changes = {}
    for row in stays:
        if not overlaps(start, end, row.MOVEMENTDATE, row.RETURNDATE):
            continue
        entry = max(start, row.MOVEMENTDATE)
        changes[entry] = changes.get(entry, 0) + 1
        if row.RETURNDATE is not None and (end is None or row.RETURNDATE < end):
            changes[row.RETURNDATE] = changes.get(row.RETURNDATE, 0) - 1
    count = 1
    for date in sorted(changes):
        count += changes[date]
        if count > capacity:
            raise asm3.utils.ASMValidationError("Approved foster capacity is unavailable for these dates")
