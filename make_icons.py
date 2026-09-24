from PIL import Image
import os

SRC = "logo ular tangga.png"
OUT_DIR = "assets"
os.makedirs(OUT_DIR, exist_ok=True)

img = Image.open(SRC).convert("RGBA")
w, h = img.size
print(f"source {w}x{h}")

# center square crop (logo emblem roughly centered)
side = min(w, h)
left = (w - side) // 2
top = (h - side) // 2
sq = img.crop((left, top, left + side, top + side))

def save(im, name, size=None, fmt=None):
    out = im.copy()
    if size:
        out = out.resize(size, Image.Resampling.LANCZOS)
    path = os.path.join(OUT_DIR, name)
    if fmt == "ICO":
        # ICO wants list of sizes
        out.save(path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    else:
        out.save(path, format="PNG", optimize=True)
    kb = os.path.getsize(path) / 1024
    print(f"  {name}: {out.size[0]}x{out.size[1]} {kb:.1f} KB")

# favicon PNGs
save(sq, "favicon-16x16.png", (16, 16))
save(sq, "favicon-32x32.png", (32, 32))
save(sq, "favicon-48x48.png", (48, 48))

# multi-size ICO (contains 16+32+48)
ico_path = os.path.join(OUT_DIR, "favicon.ico")
sq.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
print(f"  favicon.ico: {os.path.getsize(ico_path)/1024:.1f} KB")

# apple-touch-icon
save(sq, "apple-touch-icon.png", (180, 180))

# PWA / app icons
save(sq, "icon-192.png", (192, 192))
save(sq, "icon-512.png", (512, 512))

# square logo (app / share)
save(sq, "logo.png")

# landscape logo for og / header (original, compressed)
land = img.copy()
land.thumbnail((512, 512), Image.Resampling.LANCZOS)
save(land, "logo-512.png")

print("done ->", OUT_DIR)
for n in sorted(os.listdir(OUT_DIR)):
    p = os.path.join(OUT_DIR, n)
    print(f"  {n}\t{os.path.getsize(p)}")
