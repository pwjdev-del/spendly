#!/usr/bin/env python3
"""
Aggressive cleanup to remove ALL white/gray edge artifacts from logo.
This version removes any light/neutral pixels AND cleans up edge anti-aliasing.
"""

from PIL import Image, ImageFilter
import os

def clean_logo_edges(input_path, output_path):
    """Remove all traces of checkered pattern including edge artifacts."""
    img = Image.open(input_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    # First pass: Remove all neutral light pixels (the checkered pattern)
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Skip fully transparent pixels
            if a == 0:
                continue
                
            # Calculate how "neutral/gray" this pixel is
            avg = (r + g + b) / 3
            is_neutral = abs(r - avg) < 20 and abs(g - avg) < 20 and abs(b - avg) < 20
            
            # Remove any neutral pixels that are light (part of checkered pattern)
            # Lower threshold to catch more of the pattern
            if is_neutral and avg >= 160:
                pixels[x, y] = (0, 0, 0, 0)
            
            # Also remove semi-transparent light pixels (edge artifacts)
            elif is_neutral and avg >= 140 and a < 200:
                pixels[x, y] = (0, 0, 0, 0)
    
    # Second pass: Clean up any isolated edge pixels
    # Make pixels with too many transparent neighbors also transparent
    img_copy = img.copy()
    pixels_copy = img_copy.load()
    
    for y in range(1, height - 1):
        for x in range(1, width - 1):
            r, g, b, a = pixels[x, y]
            
            if a == 0:
                continue
            
            # Check if this pixel is mostly surrounded by transparent pixels
            # If so, it's likely an edge artifact
            transparent_neighbors = 0
            for dy in [-1, 0, 1]:
                for dx in [-1, 0, 1]:
                    if dx == 0 and dy == 0:
                        continue
                    nr, ng, nb, na = pixels[x + dx, y + dy]
                    if na < 50:
                        transparent_neighbors += 1
            
            # If 5+ neighbors are transparent and this pixel is light/neutral, remove it
            avg = (r + g + b) / 3
            is_neutral = abs(r - avg) < 25 and abs(g - avg) < 25 and abs(b - avg) < 25
            
            if transparent_neighbors >= 5 and is_neutral and avg >= 120:
                pixels_copy[x, y] = (0, 0, 0, 0)
    
    img_copy.save(output_path, "PNG")
    print(f"Cleaned: {output_path}")

# Process both logo files
base_dir = "/Users/kathanpatel/Library/CloudStorage/GoogleDrive-patelkathan134@gmail.com/My Drive/KHARCHO/public"

clean_logo_edges(
    os.path.join(base_dir, "logo-full.png"),
    os.path.join(base_dir, "logo-full-transparent.png")
)

clean_logo_edges(
    os.path.join(base_dir, "logo-icon.png"),
    os.path.join(base_dir, "logo-icon-transparent.png")
)

print("Done! Created clean logos without edge artifacts.")
