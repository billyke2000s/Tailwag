from asm3 import users as u

ROLES = {
    "Care team": [
        u.VIEW_ANIMAL,
        u.VIEW_TIMELINE,
        u.VIEW_MEDICAL,
        u.VIEW_VACCINATION,
        u.VIEW_DIET,
        u.VIEW_LOG,
        u.ADD_LOG,
        u.VIEW_DIARY,
        u.ADD_DIARY,
        u.EDIT_MY_DIARY_NOTES,
    ],
    "Veterinary team": [
        u.VIEW_ANIMAL,
        u.VIEW_TIMELINE,
        u.VIEW_MEDICAL,
        u.ADD_MEDICAL,
        u.CHANGE_MEDICAL,
        u.BULK_COMPLETE_MEDICAL,
        u.VIEW_VACCINATION,
        u.ADD_VACCINATION,
        u.CHANGE_VACCINATION,
        u.BULK_COMPLETE_VACCINATION,
        u.VIEW_TEST,
        u.ADD_TEST,
        u.CHANGE_TEST,
        u.VIEW_LOG,
        u.ADD_LOG,
        u.VIEW_DIARY,
        u.ADD_DIARY,
        u.EDIT_MY_DIARY_NOTES,
    ],
    "Placement team": [
        u.VIEW_ANIMAL,
        u.CHANGE_ANIMAL,
        u.VIEW_PERSON,
        u.ADD_PERSON,
        u.CHANGE_PERSON,
        u.VIEW_MOVEMENT,
        u.ADD_MOVEMENT,
        u.CHANGE_MOVEMENT,
        u.VIEW_INCOMING_FORMS,
        u.VIEW_ONLINE_FORMS,
        u.VIEW_DIARY,
        u.ADD_DIARY,
        u.EDIT_MY_DIARY_NOTES,
        u.VIEW_LOG,
        u.ADD_LOG,
        u.GENERATE_DOCUMENTS,
        u.VIEW_MEDIA,
        u.ADD_MEDIA,
    ],
    "Volunteer": [u.VIEW_ANIMAL, u.VIEW_DIARY, u.EDIT_MY_DIARY_NOTES],
    "Finance": [u.VIEW_DONATION, u.ADD_DONATION, u.VIEW_ACCOUNT, u.VIEW_REPORT],
}


def security_map(flags):
    return "".join(flag + " *" for flag in flags)


def restrict_default_reports(dbo):
    """Do not expose foster/medical reports to a generic finance/report role."""
    report_id = dbo.query_int(
        "SELECT ID FROM customreport WHERE Title = 'Active Fosters'"
    )
    placement_role = dbo.query_int(
        "SELECT ID FROM role WHERE RoleName = 'Placement team'"
    )
    if (
        report_id
        and placement_role
        and not dbo.query_int(
            "SELECT COUNT(*) FROM customreportrole WHERE ReportID = ?", [report_id]
        )
    ):
        dbo.insert(
            "customreportrole",
            {"ReportID": report_id, "RoleID": placement_role, "CanView": 1},
            generateID=False,
            setCreated=False,
        )
