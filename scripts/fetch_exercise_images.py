"""Bundle the exercise reference images into the Android app."""
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "app/src/main/assets"
MANIFEST = json.loads(Path(__file__).with_name("exercise-images.json").read_text())


def download(item):
    url, relative_path = item
    target = ASSETS / "images" / relative_path
    target.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["curl", "--fail", "--silent", "--show-error", "--location",
         "--retry", "3", "--max-time", "40", "--user-agent",
         "MeuTreinoFullBody2/1.1 (https://github.com/jayhrlvnae-png/MeuTreinoFullBody2)",
         "--output", str(target), url],
        check=True,
    )
    data = target.read_bytes()
    expected = {".jpg": b"\xff\xd8\xff", ".gif": b"GIF8", ".svg": b"<svg"}
    if expected[target.suffix] not in data[:8192]:
        raise ValueError(f"Invalid image: {relative_path}")


if __name__ == "__main__":
    with ThreadPoolExecutor(max_workers=6) as executor:
        list(executor.map(download, MANIFEST["files"]))
    names = json.dumps(MANIFEST["exercises"], ensure_ascii=False, indent=2)
    (ASSETS / "exercise-images.js").write_text(f"const exerciseImages = {names};\n")
