"""Encode captured gameplay frames. Optional dev dependency: Pillow."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
frames = [Image.open(p).convert("RGB").resize((640, 360), Image.Resampling.NEAREST)
          for p in sorted((root / ".artifacts" / "frames").glob("*.png"))]
if not frames:
    raise SystemExit("Run node scripts/capture.mjs first")
frames[0].save(root / "docs" / "gameplay.gif", save_all=True, append_images=frames[1:],
               duration=100, loop=0, optimize=True)
print(f"Created docs/gameplay.gif: {len(frames)} frames at 10 FPS")
