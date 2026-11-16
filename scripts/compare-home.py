import os
from PIL import Image, ImageOps, ImageChops

def compare_images(ref_path, shot_path, diff_out_path, side_by_side_path):
    ref = Image.open(ref_path).convert('RGB')
    shot = Image.open(shot_path).convert('RGB')
    
    # Resize shot to match ref dimensions for diffing
    shot_resized = shot.resize(ref.size, Image.Resampling.LANCZOS)
    
    # Calculate difference
    diff = ImageChops.difference(ref, shot_resized)
    diff.save(diff_out_path)
    
    # Create side-by-side image
    w, h = ref.size
    combined = Image.new('RGB', (w * 2 + 20, h), (255, 255, 255))
    combined.paste(ref, (0, 0))
    combined.paste(shot_resized, (w + 20, 0))
    combined.save(side_by_side_path)
    
    print(f"Generated side-by-side: {side_by_side_path}")
    print(f"Generated diff: {diff_out_path}")

if __name__ == '__main__':
    ref = 'design/reference-home.png'
    shot = '.screenshots/home-round1-light-1024.png'
    compare_images(ref, shot, '.screenshots/diff-round1.png', '.screenshots/side-by-side-round1.png')
