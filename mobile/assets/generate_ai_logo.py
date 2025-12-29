#!/usr/bin/env python3
"""
Generate AI microphone logo with black and yellow color scheme
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_ai_microphone_logo(size=512):
    """Create a 3D-style AI microphone logo"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background - black
    draw.rectangle([0, 0, size, size], fill=(0, 0, 0, 255))
    
    center_x = size // 2
    center_y = size // 2
    
    # Microphone body (vertical capsule shape)
    mic_width = size // 3
    mic_height = size // 2
    mic_x = center_x - mic_width // 2
    mic_y = center_y - mic_height // 2
    
    # Draw microphone body (black with slight gradient effect)
    body_coords = [
        (mic_x + mic_width // 4, mic_y),
        (mic_x + 3 * mic_width // 4, mic_y),
        (mic_x + 3 * mic_width // 4, mic_y + mic_height),
        (mic_x + mic_width // 4, mic_y + mic_height),
    ]
    draw.ellipse([mic_x, mic_y, mic_x + mic_width, mic_y + mic_height // 4], fill=(30, 30, 30, 255))
    draw.rectangle([mic_x, mic_y + mic_height // 8, mic_x + mic_width, mic_y + 7 * mic_height // 8], fill=(20, 20, 20, 255))
    draw.ellipse([mic_x, mic_y + 3 * mic_height // 4, mic_x + mic_width, mic_y + mic_height], fill=(30, 30, 30, 255))
    
    # AI square on microphone (bright yellow)
    ai_size = mic_width // 2
    ai_x = center_x - ai_size // 2
    ai_y = center_y - ai_size // 2
    draw.rectangle([ai_x, ai_y, ai_x + ai_size, ai_y + ai_size], fill=(255, 235, 0, 255))
    
    # Draw "AI" text (black, bold)
    font_size = max(ai_size // 2, 20)  # Ensure minimum font size
    try:
        # Try to use a bold font
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial Bold.ttf", font_size)
        except:
            try:
                font = ImageFont.load_default()
            except:
                font = None
    
    text = "AI"
    if font:
        try:
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
        except:
            # Fallback if textbbox fails
            text_width = font_size * len(text)
            text_height = font_size
    else:
        text_width = font_size * len(text)
        text_height = font_size
    
    text_x = center_x - text_width // 2
    text_y = center_y - text_height // 2
    if font:
        draw.text((text_x, text_y), text, fill=(0, 0, 0, 255), font=font)
    else:
        # Draw text manually if font loading fails
        draw.text((text_x, text_y), text, fill=(0, 0, 0, 255))
    
    # Sound waves on left side (yellow bars)
    bar_width = size // 20
    bar_spacing = size // 30
    left_x = mic_x - bar_width - bar_spacing
    
    # Left bars: medium, tall, medium
    bar_heights = [mic_height // 3, mic_height // 2, mic_height // 3]
    for i, height in enumerate(bar_heights):
        bar_y = center_y - height // 2
        draw.rectangle([left_x - i * (bar_width + bar_spacing), bar_y, 
                        left_x - i * (bar_width + bar_spacing) + bar_width, bar_y + height], 
                       fill=(255, 235, 0, 255))
    
    # Sound waves on right side (yellow bars)
    right_x = mic_x + mic_width + bar_spacing
    for i, height in enumerate(bar_heights):
        bar_y = center_y - height // 2
        draw.rectangle([right_x + i * (bar_width + bar_spacing), bar_y, 
                       right_x + i * (bar_width + bar_spacing) + bar_width, bar_y + height], 
                      fill=(255, 235, 0, 255))
    
    # Microphone stand (yellow curved arm and base)
    stand_y = mic_y + mic_height
    stand_height = size // 4
    base_radius = size // 6
    
    # Curved arm
    arm_points = [
        (center_x, stand_y),
        (center_x - size // 8, stand_y + stand_height // 2),
        (center_x, stand_y + stand_height),
    ]
    draw.ellipse([center_x - size // 12, stand_y, center_x + size // 12, stand_y + stand_height], 
                 fill=(255, 235, 0, 255))
    
    # Base
    base_y = stand_y + stand_height
    draw.ellipse([center_x - base_radius, base_y, center_x + base_radius, base_y + base_radius // 2], 
                 fill=(255, 235, 0, 255))
    
    return img

if __name__ == '__main__':
    # Generate icon.png (512x512 for app icon)
    icon = create_ai_microphone_logo(512)
    icon_path = os.path.join(os.path.dirname(__file__), 'icon.png')
    icon.save(icon_path, 'PNG')
    print(f'✅ Created {icon_path}')
    
    # Generate favicon.png (64x64 for web)
    favicon = create_ai_microphone_logo(64)
    favicon_path = os.path.join(os.path.dirname(__file__), 'favicon.png')
    favicon.save(favicon_path, 'PNG')
    print(f'✅ Created {favicon_path}')
    
    # Generate adaptive-icon.png (1024x1024 for Android)
    adaptive = create_ai_microphone_logo(1024)
    adaptive_path = os.path.join(os.path.dirname(__file__), 'adaptive-icon.png')
    adaptive.save(adaptive_path, 'PNG')
    print(f'✅ Created {adaptive_path}')
    
    print('\n🎨 AI Microphone logo generated successfully!')

