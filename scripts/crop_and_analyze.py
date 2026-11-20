import sys
import json
import numpy as np
from PIL import Image, ImageDraw

def srgb_to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

def rel_lum(r, g, b):
    # r, g, b in [0, 1]
    return 0.2126 * srgb_to_linear(r) + 0.7152 * srgb_to_linear(g) + 0.0722 * srgb_to_linear(b)

def get_contrast(lum1, lum2):
    lighter = max(lum1, lum2)
    darker = min(lum1, lum2)
    return (lighter + 0.05) / (darker + 0.05)

def main():
    if len(sys.argv) < 6:
        print(json.dumps({"error": "Usage: python crop_and_analyze.py <viewport_img> <x> <y> <w> <h> [text_lum] [out_crop_path] [out_annotated_path]"}))
        return

    viewport_img_path = sys.argv[1]
    x = int(float(sys.argv[2]))
    y = int(float(sys.argv[3]))
    w = int(float(sys.argv[4]))
    h = int(float(sys.argv[5]))
    text_lum = float(sys.argv[6]) if len(sys.argv) > 6 else 0.0949
    out_crop_path = sys.argv[7] if len(sys.argv) > 7 else None
    out_annotated_path = sys.argv[8] if len(sys.argv) > 8 else None

    img = Image.open(viewport_img_path).convert('RGB')
    
    # 1. Crop exact subtext region
    # Bounding box: (x, y, x + w, y + h)
    crop = img.crop((x, y, x + w, y + h))
    if out_crop_path:
        crop.save(out_crop_path)

    # 2. If annotated path requested, draw red rectangle with label on full viewport
    if out_annotated_path:
        annotated = img.copy()
        draw = ImageDraw.Draw(annotated)
        # Red rectangle 3px thick
        for offset in range(3):
            draw.rectangle([x - 3 - offset, y - 3 - offset, x + w + 3 + offset, y + h + 3 + offset], outline=(239, 68, 68))
        # Red badge banner above box
        draw.rectangle([x - 3, y - 24, x + 210, y - 3], fill=(239, 68, 68))
        draw.text((x + 4, y - 20), "SAMPLED SUBTEXT REGION", fill=(255, 255, 255))
        # Crop to hero card area (e.g. width=1440, height=750 around the hero)
        hero_crop = annotated.crop((40, max(0, y - 220), 1480, min(img.height, y + 480)))
        hero_crop.save(out_annotated_path)

    # 3. Analyze pixels in crop
    arr = np.array(crop, dtype=np.float32) / 255.0
    lin = srgb_to_linear(arr)
    lum = 0.2126 * lin[:,:,0] + 0.7152 * lin[:,:,1] + 0.0722 * lin[:,:,2]

    max_idx = np.unravel_index(np.argmax(lum), lum.shape)
    min_idx = np.unravel_index(np.argmin(lum), lum.shape)

    peak_lum = float(np.max(lum))
    lowest_lum = float(np.min(lum))
    mean_lum = float(np.mean(lum))

    peak_p = crop.getpixel((int(max_idx[1]), int(max_idx[0])))
    lowest_p = crop.getpixel((int(min_idx[1]), int(min_idx[0])))

    contrast_at_peak = get_contrast(peak_lum, text_lum)
    contrast_at_mean = get_contrast(mean_lum, text_lum)

    result = {
        "x": x,
        "y": y,
        "w": w,
        "h": h,
        "cropSize": list(crop.size),
        "peakLum": round(peak_lum, 4),
        "lowestLum": round(lowest_lum, 4),
        "meanLum": round(mean_lum, 4),
        "peakRgb": list(peak_p),
        "lowestRgb": list(lowest_p),
        "contrastAtPeak": round(contrast_at_peak, 2),
        "contrastAtMean": round(contrast_at_mean, 2),
    }

    print(json.dumps(result))

if __name__ == '__main__':
    main()
