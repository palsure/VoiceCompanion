#!/usr/bin/env python3
"""
Generate circular microphone logo with gradient background
White microphone outline on magenta-purple-blue gradient
"""
from PIL import Image, ImageDraw
import os

def create_microphone_logo(size=512):
    """Create a circular microphone logo with gradient background"""
    # Create image with black background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)
    
    center_x = size // 2
    center_y = size // 2
    radius = size // 2 - 10  # Leave some padding
    
    # Create gradient circle background
    # Magenta (top) -> Purple (middle) -> Cyan/Blue (bottom)
    for y in range(size):
        # Calculate gradient color based on y position
        if y < size // 3:
            # Top third: Magenta to Purple
            ratio = y / (size // 3)
            r = int(255 * (1 - ratio * 0.3))
            g = int(0 * (1 - ratio * 0.5))
            b = int(255 * (1 - ratio * 0.2))
        elif y < 2 * size // 3:
            # Middle third: Purple
            ratio = (y - size // 3) / (size // 3)
            r = int(128 + (64 - 128) * ratio)
            g = int(0 + (0) * ratio)
            b = int(128 + (255 - 128) * ratio)
        else:
            # Bottom third: Purple to Cyan
            ratio = (y - 2 * size // 3) / (size // 3)
            r = int(64 * (1 - ratio))
            g = int(0 + (255) * ratio)
            b = int(255)
        
        # Draw horizontal line within circle
        for x in range(size):
            dist_from_center = ((x - center_x) ** 2 + (y - center_y) ** 2) ** 0.5
            if dist_from_center <= radius:
                img.putpixel((x, y), (r, g, b, 255))
    
    # Draw white microphone outline
    white = (255, 255, 255, 255)
    
    # Microphone dimensions
    mic_width = size // 3
    mic_height = size // 2.5
    mic_x = center_x - mic_width // 2
    mic_y = center_y - mic_height // 2
    
    # Microphone head/grille (rounded rectangle with dots)
    grille_width = mic_width
    grille_height = mic_height // 2
    grille_x = mic_x
    grille_y = mic_y
    
    # Draw grille outline
    draw.rounded_rectangle(
        [grille_x, grille_y, grille_x + grille_width, grille_y + grille_height],
        radius=grille_width // 8,
        outline=white,
        width=max(3, size // 100)
    )
    
    # Draw dots inside grille (perforations)
    dot_size = max(2, size // 80)
    dot_spacing = grille_width // 6
    num_dots_x = 5
    num_dots_y = 5
    
    for i in range(num_dots_x):
        for j in range(num_dots_y):
            dot_x = grille_x + dot_spacing + i * dot_spacing
            dot_y = grille_y + dot_spacing + j * (grille_height // (num_dots_y + 1))
            # Only draw dots that are inside the rounded rectangle
            if (grille_x + grille_width // 8 < dot_x < grille_x + grille_width - grille_width // 8 and
                grille_y + grille_height // 8 < dot_y < grille_y + grille_height - grille_height // 8):
                draw.ellipse(
                    [dot_x - dot_size, dot_y - dot_size, dot_x + dot_size, dot_y + dot_size],
                    fill=white
                )
    
    # U-shaped mount/body
    mount_width = grille_width // 1.5
    mount_height = grille_height // 2
    mount_x = center_x - mount_width // 2
    mount_y = grille_y + grille_height
    
    # Draw U-shape
    line_width = max(3, size // 100)
    # Left vertical
    draw.line([mount_x, mount_y, mount_x, mount_y + mount_height], fill=white, width=line_width)
    # Bottom curve
    draw.arc([mount_x, mount_y + mount_height - mount_width // 2, 
              mount_x + mount_width, mount_y + mount_height + mount_width // 2],
             180, 0, fill=white, width=line_width)
    # Right vertical
    draw.line([mount_x + mount_width, mount_y, mount_x + mount_width, mount_y + mount_height], 
              fill=white, width=line_width)
    
    # Stand (vertical line)
    stand_y = mount_y + mount_height
    stand_height = size // 6
    draw.line([center_x, stand_y, center_x, stand_y + stand_height], fill=white, width=line_width)
    
    # Base (horizontal oval)
    base_width = size // 4
    base_height = size // 20
    base_x = center_x - base_width // 2
    base_y = stand_y + stand_height
    draw.ellipse([base_x, base_y, base_x + base_width, base_y + base_height], 
                 outline=white, width=line_width)
    
    # Sound waves on left side (3 vertical lines: short, medium, short)
    wave_x_start = grille_x - size // 8
    wave_spacing = size // 25
    wave_width = max(2, size // 150)
    wave_heights = [grille_height // 3, grille_height // 1.5, grille_height // 3]
    
    for i, height in enumerate(wave_heights):
        wave_x = wave_x_start - i * (wave_spacing + wave_width)
        wave_y = center_y - height // 2
        draw.rectangle([wave_x, wave_y, wave_x + wave_width, wave_y + height], fill=white)
    
    # Sound waves on right side (mirror of left)
    wave_x_start_right = grille_x + grille_width + size // 8
    for i, height in enumerate(wave_heights):
        wave_x = wave_x_start_right + i * (wave_spacing + wave_width)
        wave_y = center_y - height // 2
        draw.rectangle([wave_x, wave_y, wave_x + wave_width, wave_y + height], fill=white)
    
    return img

if __name__ == '__main__':
    # Generate icon.png (512x512 for app icon)
    icon = create_microphone_logo(512)
    icon_path = os.path.join(os.path.dirname(__file__), 'icon.png')
    icon.save(icon_path, 'PNG')
    print(f'✅ Created {icon_path}')
    
    # Generate favicon.png (64x64 for web)
    favicon = create_microphone_logo(64)
    favicon_path = os.path.join(os.path.dirname(__file__), 'favicon.png')
    favicon.save(favicon_path, 'PNG')
    print(f'✅ Created {favicon_path}')
    
    # Generate adaptive-icon.png (1024x1024 for Android)
    adaptive = create_microphone_logo(1024)
    adaptive_path = os.path.join(os.path.dirname(__file__), 'adaptive-icon.png')
    adaptive.save(adaptive_path, 'PNG')
    print(f'✅ Created {adaptive_path}')
    
    # Generate splash.png (1024x1024)
    splash = create_microphone_logo(1024)
    splash_path = os.path.join(os.path.dirname(__file__), 'splash.png')
    splash.save(splash_path, 'PNG')
    print(f'✅ Created {splash_path}')
    
    print('\n🎨 Microphone logo with gradient background generated successfully!')

