"""
Generate MandiMitra Android launcher icons using Pillow.
Creates both regular and foreground (adaptive icon) PNGs at all required densities.
"""
from PIL import Image, ImageDraw, ImageFont
import os, math

ANDROID_RES = r"d:\mandimitra\web\android\app\src\main\res"

# Android mipmap sizes: (folder_suffix, icon_size, foreground_size)
# Adaptive icon foreground is 108dp — scaled to each density
DENSITIES = [
    ("mdpi",    48,  108),
    ("hdpi",    72,  162),
    ("xhdpi",   96,  216),
    ("xxhdpi",  144, 324),
    ("xxxhdpi", 192, 432),
]

def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(len(c1)))

def draw_mandimitra_icon(size, padding_frac=0.15):
    """Draw the MandiMitra icon: leaf + bar chart on emerald gradient background."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    pad = int(size * padding_frac)
    cx, cy = size // 2, size // 2
    
    # Background: rounded rectangle with emerald gradient (simulated)
    corner_r = int(size * 0.22)
    # Draw gradient background
    for y in range(size):
        t = y / size
        color = lerp_color((5, 150, 105), (16, 185, 129), t)  # emerald-600 to emerald-500
        draw.line([(0, y), (size, y)], fill=color)
    
    # Create rounded rect mask
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, size-1, size-1], radius=corner_r, fill=255)
    img.putalpha(mask)
    
    # Leaf shape
    leaf_top = pad + int(size * 0.05)
    leaf_bottom = size - pad - int(size * 0.02)
    leaf_width = int(size * 0.33)
    
    # Draw leaf body (white, slight transparency)
    leaf_points = []
    steps = 60
    for i in range(steps + 1):
        t = i / steps
        y = leaf_top + t * (leaf_bottom - leaf_top)
        # Width varies: narrow at top, wide in middle, narrow at bottom
        w = leaf_width * math.sin(t * math.pi) * (0.7 + 0.3 * math.sin(t * math.pi * 0.8))
        leaf_points.append((cx - w, y))
    for i in range(steps, -1, -1):
        t = i / steps
        y = leaf_top + t * (leaf_bottom - leaf_top)
        w = leaf_width * math.sin(t * math.pi) * (0.7 + 0.3 * math.sin(t * math.pi * 0.8))
        leaf_points.append((cx + w, y))
    
    draw.polygon(leaf_points, fill=(255, 255, 255, 240))
    
    # Central vein
    vein_top = leaf_top + int(size * 0.08)
    vein_bottom = leaf_bottom - int(size * 0.08)
    vein_w = max(1, int(size * 0.012))
    draw.line([(cx, vein_top), (cx, vein_bottom)], fill=(5, 150, 105, 140), width=vein_w)
    
    # Side veins
    vein_count = 3
    for i in range(vein_count):
        t = 0.25 + i * 0.2
        y = leaf_top + t * (leaf_bottom - leaf_top)
        w = leaf_width * math.sin(t * math.pi) * 0.65
        vw = max(1, int(size * 0.008))
        # Left vein
        draw.line([(cx, y), (cx - w, y - int(size * 0.03))], fill=(5, 150, 105, 100), width=vw)
        # Right vein
        draw.line([(cx, y), (cx + w, y - int(size * 0.03))], fill=(5, 150, 105, 100), width=vw)
    
    # Bar chart (bottom-right quadrant)
    bar_w = max(2, int(size * 0.04))
    bar_gap = max(1, int(size * 0.015))
    bar_heights = [0.08, 0.12, 0.17]
    bar_x_start = cx + int(size * 0.15)
    bar_bottom_y = cy + int(size * 0.28)
    
    for i, bh in enumerate(bar_heights):
        x = bar_x_start + i * (bar_w + bar_gap)
        h = int(size * bh)
        r = max(1, bar_w // 4)
        draw.rounded_rectangle(
            [x, bar_bottom_y - h, x + bar_w, bar_bottom_y],
            radius=r,
            fill=(245, 158, 11, 230)  # amber-500
        )
    
    return img


def draw_foreground(size):
    """Draw adaptive icon foreground (no background, just the icon content centered in 108dp equivalent)."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # The safe zone is the inner 66/108 = ~61% of the canvas
    # We draw our icon content in the center portion
    icon_size = int(size * 0.66)
    icon = draw_mandimitra_icon(icon_size, padding_frac=0.05)
    
    # Remove the rounded rect background — we only want the leaf + bars
    # For foreground, draw on transparent with just white leaf and amber bars
    fg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    fg_draw = ImageDraw.Draw(fg)
    
    cx, cy = size // 2, size // 2
    s = icon_size
    pad = int(s * 0.05)
    
    leaf_top = cy - s // 2 + pad + int(s * 0.05)
    leaf_bottom = cy + s // 2 - pad - int(s * 0.02)
    leaf_width = int(s * 0.33)
    
    # Leaf
    leaf_points = []
    steps = 60
    for i in range(steps + 1):
        t = i / steps
        y = leaf_top + t * (leaf_bottom - leaf_top)
        w = leaf_width * math.sin(t * math.pi) * (0.7 + 0.3 * math.sin(t * math.pi * 0.8))
        leaf_points.append((cx - w, y))
    for i in range(steps, -1, -1):
        t = i / steps
        y = leaf_top + t * (leaf_bottom - leaf_top)
        w = leaf_width * math.sin(t * math.pi) * (0.7 + 0.3 * math.sin(t * math.pi * 0.8))
        leaf_points.append((cx + w, y))
    
    fg_draw.polygon(leaf_points, fill=(255, 255, 255, 245))
    
    # Vein
    vein_top = leaf_top + int(s * 0.08)
    vein_bottom = leaf_bottom - int(s * 0.08)
    vein_w = max(1, int(s * 0.012))
    fg_draw.line([(cx, vein_top), (cx, vein_bottom)], fill=(5, 150, 105, 140), width=vein_w)
    
    # Side veins
    for i in range(3):
        t = 0.25 + i * 0.2
        y = leaf_top + t * (leaf_bottom - leaf_top)
        w = leaf_width * math.sin(t * math.pi) * 0.65
        vw = max(1, int(s * 0.008))
        fg_draw.line([(cx, y), (cx - w, y - int(s * 0.03))], fill=(5, 150, 105, 100), width=vw)
        fg_draw.line([(cx, y), (cx + w, y - int(s * 0.03))], fill=(5, 150, 105, 100), width=vw)
    
    # Bars
    bar_w = max(2, int(s * 0.04))
    bar_gap = max(1, int(s * 0.015))
    bar_heights = [0.08, 0.12, 0.17]
    bar_x_start = cx + int(s * 0.15)
    bar_bottom_y = cy + int(s * 0.28)
    
    for i, bh in enumerate(bar_heights):
        x = bar_x_start + i * (bar_w + bar_gap)
        h = int(s * bh)
        r = max(1, bar_w // 4)
        fg_draw.rounded_rectangle(
            [x, bar_bottom_y - h, x + bar_w, bar_bottom_y],
            radius=r,
            fill=(245, 158, 11, 230)
        )
    
    return fg


def main():
    for suffix, icon_sz, fg_sz in DENSITIES:
        folder = os.path.join(ANDROID_RES, f"mipmap-{suffix}")
        os.makedirs(folder, exist_ok=True)
        
        # Regular launcher icon (with background)
        icon = draw_mandimitra_icon(icon_sz, padding_frac=0.12)
        icon.save(os.path.join(folder, "ic_launcher.png"), "PNG")
        
        # Round launcher icon (circle masked)
        round_icon = draw_mandimitra_icon(icon_sz, padding_frac=0.12)
        circle_mask = Image.new("L", (icon_sz, icon_sz), 0)
        ImageDraw.Draw(circle_mask).ellipse([0, 0, icon_sz-1, icon_sz-1], fill=255)
        round_icon.putalpha(circle_mask)
        round_icon.save(os.path.join(folder, "ic_launcher_round.png"), "PNG")
        
        # Adaptive icon foreground
        fg = draw_foreground(fg_sz)
        fg.save(os.path.join(folder, "ic_launcher_foreground.png"), "PNG")
        
        print(f"  ✅ mipmap-{suffix}: icon={icon_sz}px, foreground={fg_sz}px")
    
    print("\nAll icons generated!")


if __name__ == "__main__":
    main()
