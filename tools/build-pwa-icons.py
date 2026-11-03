#!/usr/bin/env python3
"""Repair existing PWA icon dimensions without changing the portal artwork.

Requires: python -m pip install Pillow
Run from any working directory: python tools/build-pwa-icons.py
The source is the existing 384px logo. It is resampled at 192px and 512px.
After generation, commit the TWO output PNG files to GitHub.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "images" / "icon-512.png"


def main():
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Missing original portal icon: {SOURCE}")

    with Image.open(SOURCE) as original:
        image = original.convert("RGBA")
        for size in (192, 512):
            output = ROOT / f"icon-{size}.png"
            image.resize(
                (size, size), Image.Resampling.LANCZOS
            ).save(output, format="PNG", optimize=True)

            with Image.open(output) as validated:
                if validated.size != (size, size):
                    raise ValueError(f"Output has incorrect dimensions: {output}")
            print(f"Created {output.relative_to(ROOT)}: {size}x{size}")


if __name__ == "__main__":
    main()
