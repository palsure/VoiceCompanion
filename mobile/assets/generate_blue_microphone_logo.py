#!/usr/bin/env python3
"""
Generate blue gradient circle logo with white microphone and sound waves
Blue gradient: sky blue (top-left) to royal blue (bottom-right)
White background with sound waves emanating from circle
"""
from PIL import Image, ImageDraw
import os
import math

def create_blue_microphone_logo(size=512):
    """Create a blue gradient circle logo with white microphone and sound waves"""
    # Create image with white background
    img = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    center_x = size // 2
    center_y = size // 2
    radius = size // 5  # Even smaller circle radius to show more waves
    
    # Create blue gradient circle
    # Sky blue (top-left) to royal blue (bottom-right)
    sky_blue = (135, 206, 250)  # Light sky blue
    royal_blue = (65, 105, 225)  # Royal blue
    
    for y in range(size):
        for x in range(size):
            # Calculate distance from center
            dist_from_center = ((x - center_x) ** 2 + (y - center_y) ** 2) ** 0.5
            
            if dist_from_center <= radius:
                # Calculate gradient based on position
                # Top-left is lighter (sky blue), bottom-right is darker (royal blue)
                # Use angle and distance to create diagonal gradient
                angle = math.atan2(y - center_y, x - center_x)
                # Normalize angle to 0-1 range for gradient
                # Top-left quadrant should be lighter
                gradient_factor = (math.cos(angle - math.pi / 4) + 1) / 2
                
                # Interpolate between sky blue and royal blue
                r = int(sky_blue[0] + (royal_blue[0] - sky_blue[0]) * gradient_factor)
                g = int(sky_blue[1] + (royal_blue[1] - sky_blue[1]) * gradient_factor)
                b = int(sky_blue[2] + (royal_blue[2] - sky_blue[2]) * gradient_factor)
                
                # Add subtle highlight on top-left edge
                if dist_from_center > radius * 0.85:
                    # Near the edge, add highlight
                    highlight_factor = (dist_from_center - radius * 0.85) / (radius * 0.15)
                    if angle > -math.pi / 2 and angle < 0:  # Top-left quadrant
                        r = min(255, int(r + 30 * highlight_factor))
                        g = min(255, int(g + 30 * highlight_factor))
                        b = min(255, int(b + 30 * highlight_factor))
                
                img.putpixel((x, y), (r, g, b, 255))
    
    # Draw white microphone outline inside circle
    white = (255, 255, 255, 255)
    line_width = max(4, size // 80)
    
    # Microphone dimensions (centered in circle)
    mic_width = radius // 1.2
    mic_height = radius // 1.5
    mic_x = center_x - mic_width // 2
    mic_y = center_y - mic_height // 2
    
    # Microphone top (rounded capsule shape)
    capsule_height = mic_height // 2
    capsule_y = mic_y
    
    # Draw rounded rectangle for microphone top
    draw.rounded_rectangle(
        [mic_x, capsule_y, mic_x + mic_width, capsule_y + capsule_height],
        radius=capsule_height // 2,
        outline=white,
        width=line_width
    )
    
    # Microphone neck (curved, connecting top to base)
    neck_width = mic_width // 2
    neck_x = center_x - neck_width // 2
    neck_y = capsule_y + capsule_height
    
    # Draw curved neck (U-shape)
    neck_height = mic_height // 4
    # Left side
    draw.line([neck_x, neck_y, neck_x, neck_y + neck_height], fill=white, width=line_width)
    # Bottom curve
    draw.arc([neck_x, neck_y + neck_height - neck_width // 2,
              neck_x + neck_width, neck_y + neck_height + neck_width // 2],
             180, 0, fill=white, width=line_width)
    # Right side
    draw.line([neck_x + neck_width, neck_y, neck_x + neck_width, neck_y + neck_height],
              fill=white, width=line_width)
    
    # Microphone base (horizontal line/stand)
    base_y = neck_y + neck_height
    base_width = mic_width // 1.5
    base_x = center_x - base_width // 2
    draw.line([base_x, base_y, base_x + base_width, base_y], fill=white, width=line_width)
    
    # Draw sound waves (concentric curved lines) on left side
    wave_color = royal_blue  # Vibrant blue for sound waves
    num_waves = 8  # Increased to 8 waves for more visibility
    wave_spacing = radius // 2.5  # Tighter spacing to fit more waves
    wave_start_x = center_x - radius
    
    for i in range(num_waves):
        wave_radius = radius + (i + 1) * wave_spacing
        wave_center_x = center_x
        wave_center_y = center_y
        
        # Draw arc (semicircle on left side)
        # Left side: from 90 degrees (top) to 270 degrees (bottom)
        start_angle = 90
        end_angle = 270
        
        # Calculate arc bounding box - extend further to show more waves
        arc_x1 = max(0, wave_center_x - wave_radius)
        arc_y1 = wave_center_y - wave_radius
        arc_x2 = wave_center_x
        arc_y2 = wave_center_y + wave_radius
        
        # Line width decreases as waves extend outward, but keep minimum visible
        wave_line_width = max(2, int(line_width * (1 - i * 0.12)))
        
        draw.arc([arc_x1, arc_y1, arc_x2, arc_y2], start_angle, end_angle,
                 fill=wave_color, width=wave_line_width)
    
    # Draw sound waves on right side (mirror)
    for i in range(num_waves):
        wave_radius = radius + (i + 1) * wave_spacing
        wave_center_x = center_x
        wave_center_y = center_y
        
        # Right side: from 270 degrees (bottom) to 90 degrees (top)
        start_angle = 270
        end_angle = 90
        
        # Calculate arc bounding box - extend further to show more waves
        arc_x1 = wave_center_x
        arc_y1 = wave_center_y - wave_radius
        arc_x2 = min(size, wave_center_x + wave_radius)
        arc_y2 = wave_center_y + wave_radius
        
        # Line width decreases as waves extend outward, but keep minimum visible
        wave_line_width = max(2, int(line_width * (1 - i * 0.12)))
        
        draw.arc([arc_x1, arc_y1, arc_x2, arc_y2], start_angle, end_angle,
                 fill=wave_color, width=wave_line_width)
    
    return img

if __name__ == '__main__':
    # Generate icon.png (512x512 for app icon)
    icon = create_blue_microphone_logo(512)
    icon_path = os.path.join(os.path.dirname(__file__), 'icon.png')
    icon.save(icon_path, 'PNG')
    print(f'✅ Created {icon_path}')
    
    # Generate favicon.png (64x64 for web)
    favicon = create_blue_microphone_logo(64)
    favicon_path = os.path.join(os.path.dirname(__file__), 'favicon.png')
    favicon.save(favicon_path, 'PNG')
    print(f'✅ Created {favicon_path}')
    
    # Generate adaptive-icon.png (1024x1024 for Android)
    adaptive = create_blue_microphone_logo(1024)
    adaptive_path = os.path.join(os.path.dirname(__file__), 'adaptive-icon.png')
    adaptive.save(adaptive_path, 'PNG')
    print(f'✅ Created {adaptive_path}')
    
    # Generate splash.png (1024x1024)
    splash = create_blue_microphone_logo(1024)
    splash_path = os.path.join(os.path.dirname(__file__), 'splash.png')
    splash.save(splash_path, 'PNG')
    print(f'✅ Created {splash_path}')
    
    print('\n🎨 Blue gradient microphone logo with sound waves generated successfully!')

