"""Erzeugt die farbigen Varianten des Buch-Logos aus dem Original (site/assets/img/logo.png).

Die farbigen Flächen des Logos werden auf den Farbton der jeweiligen Fachfarbe gedreht; die
Helligkeitsabstufungen (Schattierung) bleiben erhalten, die weißen Seiten bleiben weiß.

Aufruf (benötigt Pillow):  python scripts/logo-varianten.py
Neue Fachfarbe: unten in FARBEN eintragen und das Skript erneut ausführen.
"""
import colorsys
from pathlib import Path

from PIL import Image

IMG = Path(__file__).resolve().parent.parent / "site" / "assets" / "img"

# Name -> Akzentfarbe (dieselben Werte wie --fach in schulbuch.css)
FARBEN = {
    "deutsch": "#4743c5",
    "informatik": "#0b6b72",
    "neutral": "#3d4a5c",
}

# Mittlere Helligkeit der farbigen Flächen im Original (gemessen)
L_ORIGINAL = 0.3


def hex_hls(farbe):
    r, g, b = (int(farbe[i:i + 2], 16) / 255 for i in (1, 3, 5))
    return colorsys.rgb_to_hls(r, g, b)


def faerben(bild, farbe):
    h_t, l_t, s_t = hex_hls(farbe)
    aus = bild.copy()
    px = aus.load()
    for y in range(aus.height):
        for x in range(aus.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            if s < 0.12 or l > 0.9:  # Weiß und Graustufen bleiben
                continue
            # Weich überblenden: je farbiger das Pixel, desto stärker der neue Farbton
            staerke = min(1.0, s / 0.4) * min(1.0, (0.95 - l) / 0.15)
            l_neu = min(0.95, l * l_t / L_ORIGINAL)
            s_neu = s_t * min(1.0, s / 0.5)
            nr, ng, nb = colorsys.hls_to_rgb(h_t, l_neu, s_neu)
            mix = lambda alt, neu: round((alt / 255 * (1 - staerke) + neu * staerke) * 255)
            px[x, y] = (mix(r, nr), mix(g, ng), mix(b, nb), a)
    return aus


def main():
    original = Image.open(IMG / "logo-original.png").convert("RGBA")
    for name, farbe in FARBEN.items():
        faerben(original, farbe).save(IMG / f"logo-{name}.png", optimize=True)
    neutral = Image.open(IMG / "logo-neutral.png")
    neutral.resize((32, 32), Image.LANCZOS).save(IMG / "favicon-32.png", optimize=True)
    neutral.resize((180, 180), Image.LANCZOS).save(IMG / "apple-touch-icon.png", optimize=True)
    print("Logos erzeugt:", ", ".join(f"logo-{n}.png" for n in FARBEN))


if __name__ == "__main__":
    main()
