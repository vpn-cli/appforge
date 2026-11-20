import sys
from PIL import Image
import numpy as np

if len(sys.argv) < 3:
    print("Usage: python calc_pixel_diff.py <img1> <img2>")
    sys.exit(1)

p1 = sys.argv[1]
p2 = sys.argv[2]

im1 = Image.open(p1).convert("RGB")
im2 = Image.open(p2).convert("RGB")

arr1 = np.array(im1, dtype=np.float32)
arr2 = np.array(im2, dtype=np.float32)

abs_diff = np.abs(arr1 - arr2)
mean_diff_raw = np.mean(abs_diff)
mean_diff_pct = (mean_diff_raw / 255.0) * 100.0

# Also calculate max channel difference and percentage of pixels that changed
changed_pixels = np.sum(np.any(abs_diff > 1.0, axis=2))
total_pixels = arr1.shape[0] * arr1.shape[1]
changed_pct = (changed_pixels / total_pixels) * 100.0

print(f"{mean_diff_pct:.4f},{changed_pct:.2f},{mean_diff_raw:.2f}")
