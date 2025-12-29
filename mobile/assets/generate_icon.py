#!/usr/bin/env python3
"""
Generate a creative app icon for VoiceCompanion
Based on app features: Voice-to-Art, Image-to-Voice, Real-Time Guidance, 
Voice Guided Shopping, and Language Learning
"""

from PIL import Image, ImageDraw, ImageFont
import math
import os

def generate_app_icon(size=1024):
    """Generate a creative app icon representing VoiceCompanion's features"""
    
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Color scheme - modern gradient purple/blue (app brand colors)
    primary_color = (102, 126, 234)  # #667eea
    secondary_color = (118, 75, 162)  # #764ba2
    accent_color = (255, 255, 255)  # White
    accent_yellow = (255, 193, 7)  # For art/creativity
    accent_cyan = (0, 188, 212)  # For image/vision
    
    # Draw rounded square background with gradient
    corner_radius = size * 0.18
    padding = size * 0.08
    
    # Create gradient background (diagonal gradient)
    for y in range(size):
        for x in range(size):
            # Diagonal gradient
            ratio = (x + y) / (size * 2)
            r = int(primary_color[0] * (1 - ratio) + secondary_color[0] * ratio)
            g = int(primary_color[1] * (1 - ratio) + secondary_color[1] * ratio)
            b = int(primary_color[2] * (1 - ratio) + secondary_color[2] * ratio)
            img.putpixel((x, y), (r, g, b, 255))
    
    # Draw rounded rectangle overlay for depth
    overlay = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    
    # Main rounded rectangle with subtle inner glow
    rect_size = size - padding * 2
    rect_x = padding
    rect_y = padding
    
    # Draw subtle inner border
    overlay_draw.rounded_rectangle(
        [(rect_x, rect_y), (rect_x + rect_size, rect_y + rect_size)],
        radius=int(corner_radius),
        fill=(255, 255, 255, 15),
        outline=(255, 255, 255, 40),
        width=int(size * 0.01)
    )
    
    # Composite overlay
    img = Image.alpha_composite(img, overlay)
    
    center_x = size / 2
    center_y = size / 2
    
    # === MAIN ELEMENTS ===
    
    # 1. Microphone (Voice Input/Output) - Center top
    mic_size = size * 0.15
    mic_x = center_x
    mic_y = center_y - size * 0.15
    
    # Microphone body (rounded rectangle)
    mic_body_width = mic_size * 0.4
    mic_body_height = mic_size * 0.6
    mic_body_y = mic_y - mic_body_height / 2
    
    draw.rounded_rectangle(
        [
            mic_x - mic_body_width / 2,
            mic_body_y,
            mic_x + mic_body_width / 2,
            mic_body_y + mic_body_height
        ],
        radius=int(mic_body_width * 0.2),
        fill=accent_color
    )
    
    # Microphone stand/base
    stand_width = mic_body_width * 0.6
    stand_height = mic_size * 0.2
    draw.rectangle(
        [
            mic_x - stand_width / 2,
            mic_body_y + mic_body_height,
            mic_x + stand_width / 2,
            mic_body_y + mic_body_height + stand_height
        ],
        fill=accent_color
    )
    
    # Microphone grille lines
    for i in range(3):
        line_y = mic_body_y + mic_body_height * 0.2 + i * (mic_body_height * 0.3)
        draw.line(
            [
                (mic_x - mic_body_width * 0.35, line_y),
                (mic_x + mic_body_width * 0.35, line_y)
            ],
            fill=(102, 126, 234, 200),
            width=int(size * 0.008)
        )
    
    # 2. Sound Waves (Voice Output) - Around microphone
    wave_radius_start = mic_size * 0.6
    wave_count = 3
    for i in range(wave_count):
        wave_radius = wave_radius_start + i * (size * 0.08)
        wave_alpha = 180 - i * 40
        
        # Draw partial arcs around microphone
        for angle in range(-60, 240, 10):
            rad = math.radians(angle)
            x = mic_x + wave_radius * math.cos(rad)
            y = mic_y + wave_radius * 0.6 * math.sin(rad)
            if angle % 20 == 0:
                draw.ellipse(
                    [(x - size * 0.01, y - size * 0.01), (x + size * 0.01, y + size * 0.01)],
                    fill=(255, 255, 255, wave_alpha)
                )
    
    # 3. Eye/Accessibility Symbol (Visual Assistance) - Left side
    eye_size = size * 0.2
    eye_x = center_x - size * 0.25
    eye_y = center_y + size * 0.1
    
    # Eye shape (ellipse)
    eye_width = eye_size * 0.8
    eye_height = eye_size * 0.5
    draw.ellipse(
        [
            eye_x - eye_width / 2,
            eye_y - eye_height / 2,
            eye_x + eye_width / 2,
            eye_y + eye_height / 2
        ],
        outline=accent_color,
        width=int(size * 0.015),
        fill=(255, 255, 255, 30)
    )
    
    # Pupil
    pupil_radius = eye_size * 0.15
    draw.ellipse(
        [
            eye_x - pupil_radius,
            eye_y - pupil_radius,
            eye_x + pupil_radius,
            eye_y + pupil_radius
        ],
        fill=accent_color
    )
    
    # Highlight on pupil
    highlight_radius = pupil_radius * 0.4
    draw.ellipse(
        [
            eye_x - highlight_radius * 0.5,
            eye_y - highlight_radius * 0.8,
            eye_x + highlight_radius * 0.5,
            eye_y - highlight_radius * 0.3
        ],
        fill=(255, 255, 255, 200)
    )
    
    # 4. Art Palette (Voice to Art) - Right side
    palette_size = size * 0.18
    palette_x = center_x + size * 0.25
    palette_y = center_y + size * 0.1
    
    # Palette shape (rounded rectangle with thumb hole)
    palette_width = palette_size * 0.7
    palette_height = palette_size * 0.5
    
    # Main palette body
    draw.rounded_rectangle(
        [
            palette_x - palette_width / 2,
            palette_y - palette_height / 2,
            palette_x + palette_width / 2,
            palette_y + palette_height / 2
        ],
        radius=int(palette_width * 0.1),
        fill=accent_yellow,
        outline=accent_color,
        width=int(size * 0.01)
    )
    
    # Thumb hole (circle cutout)
    hole_radius = palette_size * 0.12
    draw.ellipse(
        [
            palette_x - palette_width * 0.3 - hole_radius,
            palette_y - hole_radius,
            palette_x - palette_width * 0.3 + hole_radius,
            palette_y + hole_radius
        ],
        fill=(102, 126, 234, 255)  # Match background
    )
    
    # Paint dabs on palette
    paint_colors = [
        (255, 87, 34),  # Orange
        (76, 175, 80),   # Green
        (33, 150, 243),  # Blue
    ]
    for i, color in enumerate(paint_colors):
        paint_x = palette_x + palette_width * 0.15 + i * (palette_width * 0.15)
        paint_y = palette_y - palette_height * 0.15
        paint_radius = palette_size * 0.08
        draw.ellipse(
            [
                paint_x - paint_radius,
                paint_y - paint_radius,
                paint_x + paint_radius,
                paint_y + paint_radius
            ],
            fill=color
        )
    
    # 5. Camera/Image Icon (Image to Voice) - Bottom center
    camera_size = size * 0.12
    camera_x = center_x
    camera_y = center_y + size * 0.3
    
    # Camera body
    camera_width = camera_size * 0.7
    camera_height = camera_size * 0.5
    draw.rounded_rectangle(
        [
            camera_x - camera_width / 2,
            camera_y - camera_height / 2,
            camera_x + camera_width / 2,
            camera_y + camera_height / 2
        ],
        radius=int(camera_width * 0.1),
        fill=accent_cyan,
        outline=accent_color,
        width=int(size * 0.008)
    )
    
    # Camera lens
    lens_radius = camera_size * 0.2
    draw.ellipse(
        [
            camera_x - lens_radius,
            camera_y - lens_radius,
            camera_x + lens_radius,
            camera_y + lens_radius
        ],
        fill=accent_color,
        outline=(0, 0, 0, 100),
        width=int(size * 0.005)
    )
    
    # Lens center
    draw.ellipse(
        [
            camera_x - lens_radius * 0.5,
            camera_y - lens_radius * 0.5,
            camera_x + lens_radius * 0.5,
            camera_y + lens_radius * 0.5
        ],
        fill=(0, 0, 0, 150)
    )
    
    # 6. Connection Lines (AI/Intelligence) - Subtle connecting elements
    connection_alpha = 60
    line_width = int(size * 0.004)
    
    # Connect microphone to eye
    draw.line(
        [(mic_x - mic_size * 0.2, mic_y + mic_size * 0.3), (eye_x + eye_size * 0.2, eye_y - eye_size * 0.2)],
        fill=(255, 255, 255, connection_alpha),
        width=line_width
    )
    
    # Connect microphone to palette
    draw.line(
        [(mic_x + mic_size * 0.2, mic_y + mic_size * 0.3), (palette_x - palette_size * 0.2, palette_y - palette_size * 0.2)],
        fill=(255, 255, 255, connection_alpha),
        width=line_width
    )
    
    # Connect eye to camera
    draw.line(
        [(eye_x + eye_size * 0.3, eye_y + eye_size * 0.2), (camera_x - camera_size * 0.3, camera_y - camera_size * 0.2)],
        fill=(255, 255, 255, connection_alpha),
        width=line_width
    )
    
    # Add subtle glow effect around main elements
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    
    # Glow around microphone
    for i in range(2):
        glow_radius = mic_size * 0.7 + i * size * 0.02
        glow_alpha = 30 - i * 10
        for angle in range(0, 360, 15):
            rad = math.radians(angle)
            x = mic_x + glow_radius * math.cos(rad)
            y = mic_y + glow_radius * 0.6 * math.sin(rad)
            glow_draw.ellipse(
                [(x - size * 0.015, y - size * 0.015), (x + size * 0.015, y + size * 0.015)],
                fill=(255, 255, 255, glow_alpha)
            )
    
    img = Image.alpha_composite(img, glow)
    
    return img

def main():
    """Generate icons in all required sizes"""
    sizes = {
        'icon.png': 1024,
        'adaptive-icon.png': 1024,
        'favicon.png': 48,
    }
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("Generating VoiceCompanion app icons based on features...")
    print("Features represented:")
    print("  🎤 Microphone - Voice input/output")
    print("  👁️ Eye - Visual assistance & accessibility")
    print("  🎨 Palette - Voice to Art generation")
    print("  📸 Camera - Image to Voice description")
    print("  🔊 Sound waves - Voice output & guidance")
    print()
    
    for filename, size in sizes.items():
        print(f"Creating {filename} ({size}x{size}px)...")
        icon = generate_app_icon(size)
        filepath = os.path.join(script_dir, filename)
        icon.save(filepath, 'PNG', optimize=True)
        print(f"✓ Saved {filename}")
    
    print()
    print("✓ All icons generated successfully!")
    print("\nIcons created:")
    print("  - icon.png (1024x1024px) - Main app icon")
    print("  - adaptive-icon.png (1024x1024px) - Android adaptive icon")
    print("  - favicon.png (48x48px) - Web favicon")
    print("\nNext steps:")
    print("1. Restart your Expo development server")
    print("2. Clear cache if needed: expo start -c")
    print("3. For web app, copy icons to frontend/public/")

if __name__ == '__main__':
    main()
