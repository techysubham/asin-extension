"""
Simple script to create placeholder PNG icons for the Chrome extension.
This creates basic colored squares with "AF" text as placeholders.

Requirements: Pillow (pip install Pillow)
Usage: python generate_icons.py
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
    
    def create_icon(size, output_path):
        """Create a simple icon with the specified size."""
        # Create image with orange background (Amazon color)
        img = Image.new('RGB', (size, size), color='#FF9900')
        draw = ImageDraw.Draw(img)
        
        # Try to use a nice font, fall back to default if not available
        try:
            # Adjust font size based on icon size
            font_size = int(size * 0.5)
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.load_default()
        
        # Draw "AF" text (ASIN Filter)
        text = "AF"
        
        # Get text bounding box to center it
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        position = ((size - text_width) // 2, (size - text_height) // 2 - bbox[1])
        
        # Draw text in white
        draw.text(position, text, fill='white', font=font)
        
        # Save the image
        img.save(output_path, 'PNG')
        print(f"Created: {output_path}")
    
    # Get the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(script_dir, 'icons')
    
    # Create icons directory if it doesn't exist
    os.makedirs(icons_dir, exist_ok=True)
    
    # Generate icons in different sizes
    sizes = {
        'icon16.png': 16,
        'icon48.png': 48,
        'icon128.png': 128
    }
    
    for filename, size in sizes.items():
        output_path = os.path.join(icons_dir, filename)
        create_icon(size, output_path)
    
    print("\n✅ All icons created successfully!")
    print("Icons location:", icons_dir)

except ImportError:
    print("❌ Pillow library not found!")
    print("\nTo install Pillow, run:")
    print("  pip install Pillow")
    print("\nOr create icons manually:")
    print("1. Open icons/icon.svg in an image editor")
    print("2. Export as PNG at sizes: 16x16, 48x48, 128x128")
    print("3. Save as icon16.png, icon48.png, icon128.png in the icons/ folder")
except Exception as e:
    print(f"❌ Error creating icons: {e}")
    print("\nYou can create icons manually:")
    print("1. Open icons/icon.svg in an image editor")
    print("2. Export as PNG at sizes: 16x16, 48x48, 128x128")
    print("3. Save as icon16.png, icon48.png, icon128.png in the icons/ folder")
