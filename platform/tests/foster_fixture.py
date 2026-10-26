"""Synthetic fixture shared by browser and PostgreSQL verification only."""

import base64
from io import BytesIO
import asm3.animal
import asm3.configuration
import asm3.diary
import asm3.i18n
import asm3.media
import asm3.movement
import asm3.person
import asm3.users
import asm3.utils
from PIL import Image
from shelter import foster


def create(dbo, password):
    def post(values):
        return asm3.utils.PostedData(values, "en_GB")

    people, users, animals, movements = [], [], [], []
    for index in range(2):
        person = asm3.person.insert_person_from_form(
            dbo,
            post({"forenames": "Synthetic", "surname": f"Portal household {index}"}),
            "synthetic-admin",
            geocode=False,
        )
        dbo.update(
            "owner", person, {"IsFosterer": 1, "IDCheck": 1, "FosterCapacity": 2}
        )
        people.append(person)
        rid = asm3.configuration.cint(dbo, foster.ROLE_KEY)
        uid = asm3.users.insert_user_from_form(
            dbo,
            "synthetic-admin",
            post(
                {
                    "username": f"synthetic-portal-{index}",
                    "password": password,
                    "realname": "Synthetic foster carer",
                    "person": str(person),
                    "roles": str(rid),
                }
            ),
        )
        dbo.update(
            "users",
            uid,
            {"OTPSecret": "JBSWY3DPEHPK3PXP", "EnableTOTP": 0 if index == 0 else 1},
        )
        users.append(uid)
        aid, _ = asm3.animal.insert_animal_from_form(
            dbo,
            post(
                {
                    "animalname": f"Synthetic portal resident {index}",
                    "animaltype": "1",
                    "species": "1",
                    "entryreason": "1",
                    "estimatedage": "2",
                    "dateofbirth": "01/01/2022",
                    "datebroughtin": "01/01/2025",
                    "breed1": "1",
                    "breed2": "1",
                    "basecolour": "1",
                }
            ),
            "synthetic-admin",
        )
        dbo.update(
            "animal",
            aid,
            {
                "IsNotAvailableForAdoption": 1,
                "AnimalComments": "PRIVATE PORTAL TEST HISTORY",
            },
        )
        image = BytesIO()
        Image.new("RGB", (150, 150), "#aab99e").save(image, "JPEG")
        mid = asm3.media.attach_file_from_form(
            dbo,
            "synthetic-admin",
            0,
            aid,
            1,
            post(
                {
                    "filename": "synthetic.jpg",
                    "filetype": "image/jpeg",
                    "filedata": "data:image/jpeg;base64,"
                    + base64.b64encode(image.getvalue()).decode(),
                }
            ),
        )
        dbo.update("media", mid, {"WebsitePhoto": 1, "ExcludeFromPublish": 1})
        movement = asm3.movement.insert_foster_from_form(
            dbo,
            "synthetic-admin",
            post(
                {
                    "animal": str(aid),
                    "person": str(person),
                    "fosterdate": asm3.i18n.python2display("en_GB", dbo.today()),
                }
            ),
        )
        animals.append(aid)
        movements.append(movement)
    task = asm3.diary.insert_diary_from_form(
        dbo,
        "synthetic-admin",
        asm3.diary.ANIMAL,
        animals[0],
        post(
            {
                "diarydate": asm3.i18n.python2display("en_GB", dbo.today()),
                "diaryfor": "synthetic-portal-0",
                "subject": "Synthetic comfort check",
                "note": "Record the agreed comfort check, then share an observation. Synthetic instruction only.",
                "comments": "PRIVATE STAFF DIARY COMMENT",
            }
        ),
    )
    hidden_task = asm3.diary.insert_diary_from_form(
        dbo,
        "synthetic-admin",
        asm3.diary.ANIMAL,
        animals[0],
        post(
            {
                "diarydate": asm3.i18n.python2display("en_GB", dbo.today()),
                "diaryfor": "care-admin",
                "subject": "PRIVATE STAFF TASK",
                "note": "Must not be exposed to carers",
            }
        ),
    )
    return {
        "animals": animals,
        "people": people,
        "users": users,
        "movements": movements,
        "task": task,
        "hidden_task": hidden_task,
    }
