#!/usr/bin/env python3
import os, sys, base64, io
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
if os.getenv("DEBUG") != "true" or os.getenv("DEMO_DATA") != "true":
    raise SystemExit("Synthetic fixtures require DEBUG=true DEMO_DATA=true")
from shelter.core import database
import asm3.animal, asm3.media, asm3.utils
from PIL import Image, ImageDraw

dbo = database()
if dbo.query_int("SELECT COUNT(*) FROM animal") > 0:
    raise SystemExit("Demo refused: animal records already exist")
for index, (name, species, colour, public) in enumerate(
    [
        ("Fern · DEMO", 1, "#a9b9a0", True),
        ("Miso · DEMO", 2, "#dac3a0", True),
        ("Hazel · DEMO", 1, "#b4a19b", False),
    ]
):
    data = {
        "animalname": name,
        "animaltype": "1",
        "species": str(species),
        "entryreason": "1",
        "estimatedage": "3",
        "breed1": "1" if species == 1 else "261",
        "breed2": "1" if species == 1 else "261",
        "basecolour": "1",
        "neutered": "on",
        "microchipped": "on",
        "microchipnumber": "00000000000000" + str(index),
        "datebroughtin": "01/10/2026",
    }
    aid, _ = asm3.animal.insert_animal_from_form(
        dbo, asm3.utils.PostedData(data, "en_GB"), "synthetic-demo"
    )
    image = Image.new("RGB", (600, 600), colour)
    draw = ImageDraw.Draw(image)
    draw.ellipse((140, 120, 460, 440), fill="#f0e6d1")
    draw.ellipse((220, 250, 245, 285), fill="#273d33")
    draw.ellipse((350, 250, 375, 285), fill="#273d33")
    draw.polygon([(280, 315), (320, 315), (300, 340)], fill="#594a3d")
    draw.text((35, 530), "SYNTHETIC DEMO - NOT A REAL ANIMAL", fill="#203c34")
    out = io.BytesIO()
    image.save(out, "JPEG")
    mid = asm3.media.attach_file_from_form(
        dbo,
        "synthetic-demo",
        0,
        aid,
        1,
        asm3.utils.PostedData(
            {
                "filename": "demo.jpg",
                "filetype": "image/jpeg",
                "filedata": "data:image/jpeg;base64,"
                + base64.b64encode(out.getvalue()).decode(),
            },
            "en_GB",
        ),
    )
    dbo.update(
        "media",
        mid,
        {
            "WebsitePhoto": 1,
            "ExcludeFromPublish": 0,
            "MediaNotes": "Synthetic demonstration resident. Not a real animal or adoption opportunity.",
        },
    )
    dbo.update(
        "animal",
        aid,
        {
            "Neutered": 1,
            "Identichipped": 1,
            "IsNotAvailableForAdoption": 0 if public else 1,
            "AnimalComments": "PRIVATE SYNTHETIC INTERNAL NOTE",
        },
    )
    asm3.animal.update_animal_status(dbo, aid)
print("Synthetic fixture records created; permanent resident remains private")
