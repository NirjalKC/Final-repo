from PIL import Image, ImageDraw, ImageFont
import random

def generate_captcha(text: str = None, width: int = 300, height: int = 100) -> Image:
    # Create base image
    image = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(image) 
    
    # Add background noise
    for _ in range(width * height // 20):  # density of noise 
        x = random.randint(0, width) 
        y = random.randint(0, height)
        # ....... randomly drawn
        draw.point((x, y), fill=(
            random.randint(150, 200),
            random.randint(150, 200),
            random.randint(150, 200)
        ))
    
    # Add 7 random lines
    for _ in range(7): 
        start_pos = (random.randint(0, width), random.randint(0, height))
        end_pos = (random.randint(0, width), random.randint(0, height))
        #lines drawn
        draw.line([start_pos, end_pos], fill=(
            random.randint(160, 200),
            random.randint(160, 200),
            random.randint(160, 200)
        ), width=2)
    
    # default font if custom ones not available
    font = ImageFont.load_default()
    
    # text into parts (number, operation, number)
    parts = text.split()
    
    # Calculate total width 
    total_width = 0
    spacing = 30  # Space between parts
    part_widths = []
    
    for part in parts:
        bbox = draw.textbbox((0, 0), part, font=font)
        width_part = bbox[2] - bbox[0]
        part_widths.append(width_part)
        total_width += width_part
    
    total_width += spacing * (len(parts) - 1)  # Add spacing between parts
    
    # Calculate starting x position to center everything
    start_x = random.randint(0, width - total_width)
    y = random.randint(0, height -10) 
    
    current_x = start_x
    
    # Draw each part
    for part in parts:
        draw.text(
            (current_x, y),
            part,
            font=font,
            fill=(0, 0, 0)  # Simple black color
        )
        # Move x position for next part
        current_x += draw.textbbox((0, 0), part, font=font)[2] + spacing
    
    return image
