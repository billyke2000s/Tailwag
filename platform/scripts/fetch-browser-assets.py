#!/usr/bin/env python3
"""Fetch reviewed browser assets with hashes and preserve corresponding source."""

import base64, hashlib, io, json, pathlib, shutil, subprocess, tarfile, urllib.request, zipfile

root = pathlib.Path(__file__).resolve().parents[1]
lock = json.loads((root / "browser-assets.json").read_text())
cache = root / "vendor/browser-downloads"
cache.mkdir(parents=True, exist_ok=True)
static = root / "vendor/asm/src/static/lib/tailwag-supported"
static.mkdir(parents=True, exist_ok=True)
inventory = json.loads((root / "browser-dependencies/package.json").read_text())[
    "dependencies"
]
for asset in lock["assets"]:
    if inventory.get(asset["name"]) != asset["version"]:
        raise RuntimeError("Advisory inventory and asset pin differ")
    archive = cache / (asset["name"] + "-" + asset["version"] + ".archive")
    if not archive.exists():
        with urllib.request.urlopen(asset["url"], timeout=90) as response:
            data = response.read(64 * 1024 * 1024 + 1)
        if len(data) > 64 * 1024 * 1024:
            raise RuntimeError("Asset exceeds download bound")
        archive.write_bytes(data)
    data = archive.read_bytes()
    actual = "sha512-" + base64.b64encode(hashlib.sha512(data).digest()).decode()
    if actual != asset["integrity"]:
        raise RuntimeError("Browser asset integrity mismatch: " + asset["name"])
    target = static / asset["name"]
    if target.exists():
        shutil.rmtree(target)
    target.mkdir()

    def write(name, content):
        if not name.startswith(asset["prefix"]):
            raise RuntimeError("Unexpected archive root")
        relative = pathlib.PurePosixPath(name[len(asset["prefix"]) :])
        if relative.is_absolute() or ".." in relative.parts:
            raise RuntimeError("Unsafe archive path")
        path = target.joinpath(*relative.parts)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)

    if asset["format"] == "tar":
        with tarfile.open(fileobj=io.BytesIO(data)) as archive_data:
            if sum(m.size for m in archive_data.getmembers()) > 512 * 1024 * 1024:
                raise RuntimeError("Expanded asset exceeds bound")
            for member in archive_data.getmembers():
                if member.isfile():
                    write(member.name, archive_data.extractfile(member).read())
                elif not member.isdir():
                    raise RuntimeError("Links and special files are not permitted")
    else:
        with zipfile.ZipFile(io.BytesIO(data)) as archive_data:
            if sum(m.file_size for m in archive_data.infolist()) > 512 * 1024 * 1024:
                raise RuntimeError("Expanded asset exceeds bound")
            for member in archive_data.infolist():
                if not member.is_dir():
                    write(member.filename, archive_data.read(member))
    if "source" in asset:
        source = root / "vendor/browser-source" / asset["name"]
        source.parent.mkdir(parents=True, exist_ok=True)
        if not source.exists():
            subprocess.run(
                ["git", "init", str(source)], check=True, stdout=subprocess.DEVNULL
            )
            subprocess.run(
                [
                    "git",
                    "-C",
                    str(source),
                    "remote",
                    "add",
                    "origin",
                    asset["source"]["repository"],
                ],
                check=True,
            )
            subprocess.run(
                [
                    "git",
                    "-C",
                    str(source),
                    "fetch",
                    "--depth",
                    "1",
                    "origin",
                    asset["source"]["commit"],
                ],
                check=True,
            )
            subprocess.run(
                [
                    "git",
                    "-C",
                    str(source),
                    "checkout",
                    "--detach",
                    asset["source"]["commit"],
                ],
                check=True,
            )
        if (
            subprocess.check_output(
                ["git", "-C", str(source), "rev-parse", "HEAD"], text=True
            ).strip()
            != asset["source"]["commit"]
        ):
            raise RuntimeError("Browser source revision mismatch")
print("Pinned browser assets and corresponding source verified")
