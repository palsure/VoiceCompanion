#!/usr/bin/env python3
"""
Script to update app icons from a source image.
Usage: python update_icon.py <source_image_path>
"""

import sys
from PIL import Image
import os

def resize_image(input_path, output_path, size):
    """Resize image to specified size while maintaining aspect ratio."""
    try:
        img = Image.open(input_path)
        # Convert to RGBA if needed
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Resize with high-quality resampling
        img_resized = img.resize(size, Image.Resampling.LANCZOS)
        img_resized.save(output_path, 'PNG', optimize=True)
        print(f"✓ Created {output_path} ({size[0]}x{size[1]}px)")
        return True
    except Exception as e:
        print(f"✗ Error creating {output_path}: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python update_icon.py <source_image_path>")
        print("\nThis script will create:")
        print("  - icon.png (1024x1024px)")
        print("  - adaptive-icon.png (1024x1024px)")
        print("  - favicon.png (48x48px)")
        sys.exit(1)
    
    source_path = sys.argv[1]
    
    if not os.path.exists(source_path):
        print(f"Error: Source image not found: {source_path}")
        sys.exit(1)
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Create icons
    print(f"Processing {source_path}...")
    print()
    
    # Main icon (1024x1024)
    resize_image(source_path, os.path.join(script_dir, 'icon.png'), (1024, 1024))
    
    # Adaptive icon (1024x1024)
    resize_image(source_path, os.path.join(script_dir, 'adaptive-icon.png'), (1024, 1024))
    
    # Favicon (48x48)
    resize_image(source_path, os.path.join(script_dir, 'favicon.png'), (48, 48))
    
    print()
    print("✓ All icons created successfully!")
    print("\nNext steps:")
    print("1. Restart your Expo development server")
    print("2. Clear cache if needed: expo start -c")

if __name__ == '__main__':
    main()

