"""
Subset the local display/body fonts to Latin and convert them to woff2.

Usage: python scripts/build-fonts.py <dir containing the .otf files>
Writes to public/fonts/.
"""
import os
import sys
from fontTools import subset

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "fonts")
UNICODES = (
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,"
    "U+2000-206F,U+2074,U+20AC,U+2122,U+2190-2199,U+2212,U+2215,U+FEFF,U+FFFD"
)
JOBS = {
    "Gambarino-Regular.otf": "Gambarino-Regular.woff2",
    "ppneuemontreal-book.otf": "NeueMontreal-Regular.woff2",
    "ppneuemontreal-medium.otf": "NeueMontreal-Medium.woff2",
}

os.makedirs(OUT, exist_ok=True)
for src, dst in JOBS.items():
    subset.main([
        os.path.join(SRC, src),
        f"--unicodes={UNICODES}",
        "--layout-features=kern,liga,calt,case,tnum,lnum,pnum",
        "--flavor=woff2",
        f"--output-file={os.path.join(OUT, dst)}",
    ])
    print(dst, os.path.getsize(os.path.join(OUT, dst)))
