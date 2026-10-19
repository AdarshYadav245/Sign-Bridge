"""
SignBridge Asset Generator
Generates:
1. Animated GIF files for dynamic word gestures:
   - hello.gif (lateral waving open palm)
   - yes.gif (vertical nodding fist)
   - no.gif (snapping pinch beak)
   - thank-you.gif (chin-to-front forward glide)
   - please.gif (circular open palm rub)
   - sorry.gif (circular fist rub)
2. High-resolution ASL Alphabet Chart image (asl-alphabet-chart.png)
"""

import math
import os
from PIL import Image, ImageDraw, ImageFont

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets", "gestures")
os.makedirs(ASSETS_DIR, exist_ok=True)
CHART_PATH = os.path.join(os.path.dirname(__file__), "assets", "asl-alphabet-chart.png")

# Palette
BG_COLOR = (15, 23, 42)          # Deep Slate
SURFACE_COLOR = (30, 41, 59)     # Surface Slate
CYAN = (56, 189, 248)            # Electric Sky Blue
CYAN_GLOW = (56, 189, 248, 80)
AMBER = (245, 158, 11)           # Motion Amber
EMERALD = (16, 185, 129)         # Emerald Green
ROSE = (244, 63, 94)             # Rose Pink
WHITE = (248, 250, 252)
MUTED = (148, 163, 184)

def rotate_point(x, y, cx, cy, angle_deg):
    rad = math.radians(angle_deg)
    cos_a = math.cos(rad)
    sin_a = math.sin(rad)
    nx = cos_a * (x - cx) - sin_a * (y - cy) + cx
    ny = sin_a * (x - cx) + cos_a * (y - cy) + cy
    return nx, ny

def draw_open_palm(draw, cx, cy, angle=0, scale=1.0, color=CYAN):
    """Draws an open palm hand facing the camera with 5 extended fingers."""
    w = 34 * scale
    h = 42 * scale

    # Palm base
    points = [
        (cx - w * 0.7, cy + h * 0.6),
        (cx - w * 0.8, cy - h * 0.2),
        (cx - w * 0.4, cy - h * 0.7),
        (cx + w * 0.4, cy - h * 0.7),
        (cx + w * 0.8, cy - h * 0.2),
        (cx + w * 0.7, cy + h * 0.6),
    ]
    rot_points = [rotate_point(px, py, cx, cy, angle) for px, py in points]
    draw.polygon(rot_points, fill=(20, 35, 60), outline=color, width=int(3 * scale))

    # Fingers: Thumb, Index, Middle, Ring, Pinky
    fingers = [
        (-w * 0.85, cy + h * 0.1, -w * 1.3, cy - h * 0.3, 8 * scale),   # Thumb
        (-w * 0.4, cy - h * 0.6, -w * 0.5, cy - h * 1.5, 7 * scale),     # Index
        (0, cy - h * 0.65, 0, cy - h * 1.65, 7.5 * scale),                # Middle
        (w * 0.4, cy - h * 0.6, w * 0.45, cy - h * 1.45, 7 * scale),      # Ring
        (w * 0.75, cy - h * 0.4, w * 0.85, cy - h * 1.15, 6 * scale)      # Pinky
    ]

    for fx1, fy1, fx2, fy2, f_thick in fingers:
        p1 = rotate_point(cx + fx1, fy1, cx, cy, angle)
        p2 = rotate_point(cx + fx2, fy2, cx, cy, angle)
        draw.line([p1, p2], fill=color, width=max(2, int(f_thick)))
        # Joint circles
        draw.ellipse([p2[0] - 4, p2[1] - 4, p2[0] + 4, p2[1] + 4], fill=ROSE, outline=WHITE, width=1)

def draw_fist(draw, cx, cy, angle=0, scale=1.0, color=CYAN):
    """Draws a closed fist with thumb wrapped across."""
    w = 36 * scale
    h = 38 * scale

    # Fist body
    p1 = rotate_point(cx - w * 0.7, cy - h * 0.6, cx, cy, angle)
    p2 = rotate_point(cx + w * 0.7, cy - h * 0.6, cx, cy, angle)
    p3 = rotate_point(cx + w * 0.7, cy + h * 0.6, cx, cy, angle)
    p4 = rotate_point(cx - w * 0.7, cy + h * 0.6, cx, cy, angle)
    draw.polygon([p1, p2, p3, p4], fill=(20, 35, 60), outline=color, width=int(3 * scale))

    # Curled finger segments across top
    for i in range(4):
        offset_x = (i - 1.5) * (w * 0.32)
        top_y = cy - h * 0.5
        fp1 = rotate_point(cx + offset_x, top_y - 6 * scale, cx, cy, angle)
        fp2 = rotate_point(cx + offset_x, top_y + 12 * scale, cx, cy, angle)
        draw.line([fp1, fp2], fill=color, width=max(2, int(5 * scale)))

    # Thumb wrapped horizontally across front
    tp1 = rotate_point(cx - w * 0.8, cy + 4 * scale, cx, cy, angle)
    tp2 = rotate_point(cx + w * 0.3, cy + 6 * scale, cx, cy, angle)
    draw.line([tp1, tp2], fill=AMBER, width=int(7 * scale))
    draw.ellipse([tp2[0] - 4, tp2[1] - 4, tp2[0] + 4, tp2[1] + 4], fill=WHITE, outline=AMBER, width=2)

def draw_pinch(draw, cx, cy, openness=0.0, scale=1.0, color=CYAN):
    """Draws index & middle snapping closed against thumb."""
    w = 34 * scale
    h = 36 * scale

    # Base palm
    p1 = (cx - w * 0.6, cy + h * 0.5)
    p2 = (cx - w * 0.6, cy - h * 0.3)
    p3 = (cx + w * 0.1, cy - h * 0.3)
    p4 = (cx + w * 0.1, cy + h * 0.5)
    draw.polygon([p1, p2, p3, p4], fill=(20, 35, 60), outline=color, width=int(3 * scale))

    # Folded ring & pinky
    draw.line([(cx - w * 0.2, cy + 5), (cx - w * 0.2, cy + 18)], fill=color, width=5)
    draw.line([(cx - w * 0.4, cy + 8), (cx - w * 0.4, cy + 18)], fill=color, width=5)

    # Moving fingers (Index & Middle)
    # openness = 1.0 (open), 0.0 (closed onto thumb)
    angle_offset = openness * 32.0

    # Index finger
    tip_x, tip_y = rotate_point(cx + w * 0.9, cy - 6, cx - w * 0.1, cy - h * 0.2, -angle_offset)
    draw.line([(cx - w * 0.1, cy - h * 0.2), (tip_x, tip_y)], fill=color, width=7)
    draw.ellipse([tip_x - 4, tip_y - 4, tip_x + 4, tip_y + 4], fill=ROSE, outline=WHITE, width=1)

    # Thumb
    thumb_x, thumb_y = rotate_point(cx + w * 0.85, cy + 8, cx - w * 0.2, cy + h * 0.2, angle_offset * 0.5)
    draw.line([(cx - w * 0.2, cy + h * 0.2), (thumb_x, thumb_y)], fill=AMBER, width=8)
    draw.ellipse([thumb_x - 4, thumb_y - 4, thumb_x + 4, thumb_y + 4], fill=WHITE, outline=AMBER, width=2)

    # Snap impact stars if closed
    if openness < 0.15:
        mx = (tip_x + thumb_x) / 2
        my = (tip_y + thumb_y) / 2
        draw.line([(mx - 8, my), (mx + 8, my)], fill=EMERALD, width=2)
        draw.line([(mx, my - 8), (mx, my + 8)], fill=EMERALD, width=2)

# --- 1. Generate HELLO (Wave) GIF ---
def create_hello_gif():
    frames = []
    width, height = 220, 220
    num_frames = 24

    for i in range(num_frames):
        img = Image.new("RGB", (width, height), BG_COLOR)
        draw = ImageDraw.Draw(img)

        # Card border
        draw.rounded_rectangle([4, 4, width - 4, height - 4], radius=16, fill=SURFACE_COLOR, outline=(40, 55, 80), width=2)

        # Oscillate X laterally
        t = i / num_frames
        wave_x = 110 + math.sin(t * 2 * math.pi) * 36
        wave_angle = math.sin(t * 2 * math.pi) * 16

        # Lateral motion trail arcs
        trail_alpha = int(120 + math.sin(t * 2 * math.pi) * 100)
        draw.arc([15, 60, 45, 120], start=120, end=240, fill=AMBER, width=3)
        draw.arc([width - 45, 60, width - 15, 120], start=-60, end=60, fill=AMBER, width=3)

        # Draw Open Palm
        draw_open_palm(draw, wave_x, 105, angle=wave_angle, scale=1.05, color=CYAN)

        # Label Banner
        draw.text((width // 2, 192), "HELLO (Wave)", fill=WHITE, anchor="mm")
        draw.text((width // 2, 206), "← Lateral Wave →", fill=AMBER, anchor="mm")

        frames.append(img)

    out_path = os.path.join(ASSETS_DIR, "hello.gif")
    frames[0].save(out_path, save_all=True, append_images=frames[1:], duration=55, loop=0)
    print(f"Generated {out_path}")

# --- 2. Generate YES (Nod) GIF ---
def create_yes_gif():
    frames = []
    width, height = 220, 220
    num_frames = 24

    for i in range(num_frames):
        img = Image.new("RGB", (width, height), BG_COLOR)
        draw = ImageDraw.Draw(img)

        draw.rounded_rectangle([4, 4, width - 4, height - 4], radius=16, fill=SURFACE_COLOR, outline=(40, 55, 80), width=2)

        # Vertical nodding oscillation
        t = i / num_frames
        nod_y = 100 + math.sin(t * 2 * math.pi) * 26
        tilt_angle = math.sin(t * 2 * math.pi) * 12

        # Vertical motion arrows
        draw.line([(110, 22), (110, 36)], fill=EMERALD, width=3)
        draw.polygon([(110, 18), (105, 26), (115, 26)], fill=EMERALD)

        draw.line([(110, 155), (110, 169)], fill=EMERALD, width=3)
        draw.polygon([(110, 173), (105, 165), (115, 165)], fill=EMERALD)

        # Draw Fist
        draw_fist(draw, 110, nod_y, angle=tilt_angle, scale=1.1, color=CYAN)

        draw.text((width // 2, 192), "YES (Nod)", fill=WHITE, anchor="mm")
        draw.text((width // 2, 206), "↕ Vertical Fist Bob", fill=EMERALD, anchor="mm")

        frames.append(img)

    out_path = os.path.join(ASSETS_DIR, "yes.gif")
    frames[0].save(out_path, save_all=True, append_images=frames[1:], duration=55, loop=0)
    print(f"Generated {out_path}")

# --- 3. Generate NO (Pinch Snap) GIF ---
def create_no_gif():
    frames = []
    width, height = 220, 220
    num_frames = 24

    for i in range(num_frames):
        img = Image.new("RGB", (width, height), BG_COLOR)
        draw = ImageDraw.Draw(img)

        draw.rounded_rectangle([4, 4, width - 4, height - 4], radius=16, fill=SURFACE_COLOR, outline=(40, 55, 80), width=2)

        # Snapping cycle (two quick snaps)
        t = i / num_frames
        # Cycle 0 to 1 twice
        cycle = (t * 2.0) % 1.0
        # Quick snap down, then brief release
        if cycle < 0.4:
            openness = 1.0 - (cycle / 0.4)  # snapping closed
        elif cycle < 0.7:
            openness = 0.0                  # held closed
        else:
            openness = (cycle - 0.7) / 0.3  # reopening

        # Draw Pinch Beak
        draw_pinch(draw, 105, 105, openness=openness, scale=1.1, color=CYAN)

        draw.text((width // 2, 192), "NO (Pinch Snap)", fill=WHITE, anchor="mm")
        draw.text((width // 2, 206), "Snap Shut Twice", fill=ROSE, anchor="mm")

        frames.append(img)

    out_path = os.path.join(ASSETS_DIR, "no.gif")
    frames[0].save(out_path, save_all=True, append_images=frames[1:], duration=55, loop=0)
    print(f"Generated {out_path}")

# --- 4. Generate THANK YOU (Outward) GIF ---
def create_thank_you_gif():
    frames = []
    width, height = 220, 220
    num_frames = 24

    for i in range(num_frames):
        img = Image.new("RGB", (width, height), BG_COLOR)
        draw = ImageDraw.Draw(img)

        draw.rounded_rectangle([4, 4, width - 4, height - 4], radius=16, fill=SURFACE_COLOR, outline=(40, 55, 80), width=2)

        t = i / num_frames
        # Smooth outward and downward movement
        progress = (1 - math.cos(t * 2 * math.pi)) / 2  # 0 -> 1 -> 0
        hand_y = 65 + progress * 60
        scale = 0.9 + progress * 0.35

        # Chin anchor dot
        draw.ellipse([106, 32, 114, 40], fill=MUTED)
        draw.text((110, 24), "Chin Level", fill=MUTED, anchor="mm")

        # Downward motion trail
        draw.line([(110, 65), (110, hand_y - 15)], fill=EMERALD, width=2)

        # Flat hand
        draw_open_palm(draw, 110, hand_y, angle=0, scale=scale, color=CYAN)

        draw.text((width // 2, 192), "THANK YOU", fill=WHITE, anchor="mm")
        draw.text((width // 2, 206), "Chin → Forward Outward", fill=EMERALD, anchor="mm")

        frames.append(img)

    out_path = os.path.join(ASSETS_DIR, "thank-you.gif")
    frames[0].save(out_path, save_all=True, append_images=frames[1:], duration=60, loop=0)
    print(f"Generated {out_path}")

# --- 5. Generate PLEASE (Circular) GIF ---
def create_please_gif():
    frames = []
    width, height = 220, 220
    num_frames = 24

    for i in range(num_frames):
        img = Image.new("RGB", (width, height), BG_COLOR)
        draw = ImageDraw.Draw(img)

        draw.rounded_rectangle([4, 4, width - 4, height - 4], radius=16, fill=SURFACE_COLOR, outline=(40, 55, 80), width=2)

        # Orbit track
        draw.ellipse([70, 55, 150, 135], outline=(45, 65, 95), width=2)

        t = i / num_frames
        angle_rad = t * 2 * math.pi
        hx = 110 + math.cos(angle_rad) * 38
        hy = 95 + math.sin(angle_rad) * 38

        # Open palm rubbing in circle
        draw_open_palm(draw, hx, hy, angle=math.degrees(angle_rad) * 0.2, scale=0.85, color=CYAN)

        draw.text((width // 2, 192), "PLEASE", fill=WHITE, anchor="mm")
        draw.text((width // 2, 206), "↻ Open Palm Chest Circle", fill=AMBER, anchor="mm")

        frames.append(img)

    out_path = os.path.join(ASSETS_DIR, "please.gif")
    frames[0].save(out_path, save_all=True, append_images=frames[1:], duration=55, loop=0)
    print(f"Generated {out_path}")

# --- 6. Generate SORRY (Circular) GIF ---
def create_sorry_gif():
    frames = []
    width, height = 220, 220
    num_frames = 24

    for i in range(num_frames):
        img = Image.new("RGB", (width, height), BG_COLOR)
        draw = ImageDraw.Draw(img)

        draw.rounded_rectangle([4, 4, width - 4, height - 4], radius=16, fill=SURFACE_COLOR, outline=(40, 55, 80), width=2)

        # Orbit track
        draw.ellipse([70, 55, 150, 135], outline=(45, 65, 95), width=2)

        t = i / num_frames
        angle_rad = t * 2 * math.pi
        hx = 110 + math.cos(angle_rad) * 38
        hy = 95 + math.sin(angle_rad) * 38

        # Fist rubbing in circle
        draw_fist(draw, hx, hy, angle=math.degrees(angle_rad) * 0.2, scale=0.9, color=CYAN)

        draw.text((width // 2, 192), "SORRY", fill=WHITE, anchor="mm")
        draw.text((width // 2, 206), "↻ Fist Chest Circle", fill=ROSE, anchor="mm")

        frames.append(img)

    out_path = os.path.join(ASSETS_DIR, "sorry.gif")
    frames[0].save(out_path, save_all=True, append_images=frames[1:], duration=55, loop=0)
    print(f"Generated {out_path}")

# --- 7. Generate Full ASL Alphabet Poster Chart ---
def create_asl_alphabet_chart():
    """Generates a high-resolution ASL Alphabet Chart image showing A through Z."""
    width, height = 1200, 880
    chart = Image.new("RGB", (width, height), (9, 13, 22))
    draw = ImageDraw.Draw(chart)

    # Outer border
    draw.rounded_rectangle([12, 12, width - 12, height - 12], radius=24, fill=(15, 23, 42), outline=(56, 189, 248), width=3)

    # Top Header Banner
    draw.rounded_rectangle([32, 28, width - 32, 100], radius=16, fill=(30, 41, 59), outline=(56, 189, 248, 80), width=1)
    draw.text((width // 2, 54), "AMERICAN SIGN LANGUAGE (ASL) ALPHABET CHART", fill=WHITE, anchor="mm")
    draw.text((width // 2, 78), "Official Fingerspelling Handshapes & Formations Reference • SignBridge Assistive System", fill=CYAN, anchor="mm")

    # Grid parameters: 6 columns x 4 rows = 24 supported static letters
    letters = [
        ("A", "Closed Fist", "Thumb upright beside index"),
        ("B", "Flat Palm", "4 straight up, thumb folded"),
        ("C", "C-Arc", "Fingers & thumb curved C"),
        ("D", "Point Up Loop", "Index up, thumb touches 3"),
        ("E", "Curled Claw", "Fingers curled onto thumb"),
        ("F", "OK Loop", "Thumb & index circle, 3 up"),
        ("G", "Horizontal Point", "Index & thumb sideways"),
        ("H", "Two Sideways", "Index & middle sideways"),
        ("I", "Pinky Up", "Pinky up, tight fist"),
        ("K", "Knuckle Thumb", "Index up, middle angled"),
        ("L", "L-Shape", "Index up, thumb at 90°"),
        ("M", "3 Over Thumb", "3 fingers draped over thumb"),
        ("N", "2 Over Thumb", "2 fingers draped over thumb"),
        ("O", "O-Loop", "All fingertips touch thumb"),
        ("P", "Downward K", "K shape pointing to floor"),
        ("Q", "Downward G", "G shape pointing to floor"),
        ("R", "Crossed", "Index & middle crossed"),
        ("S", "Front Fist", "Thumb folded across front"),
        ("T", "Tucked Thumb", "Thumb between index & mid"),
        ("U", "Together Up", "Index & middle touching"),
        ("V", "Peace / V", "Index & middle spread V"),
        ("W", "Three Up", "Index, middle, ring spread"),
        ("X", "Hook Trigger", "Index bent at joint"),
        ("Y", "Shaka Sign", "Thumb & pinky extended out")
    ]

    cols = 6
    rows = 4
    start_x = 44
    start_y = 120
    cell_w = 180
    cell_h = 170
    gap_x = 6
    gap_y = 12

    for idx, (char, pose_name, desc) in enumerate(letters):
        col = idx % cols
        row = idx // cols
        x = start_x + col * (cell_w + gap_x)
        y = start_y + row * (cell_h + gap_y)

        # Card container
        draw.rounded_rectangle([x, y, x + cell_w, y + cell_h], radius=12, fill=(24, 34, 52), outline=(45, 60, 85), width=1)

        # Letter badge
        draw.rounded_rectangle([x + 10, y + 10, x + 44, y + 44], radius=8, fill=(56, 189, 248, 40), outline=CYAN, width=1)
        draw.text((x + 27, y + 27), char, fill=CYAN, anchor="mm")

        # Hand illustration center
        h_cx = x + cell_w // 2 + 10
        h_cy = y + 54

        # Specialized drawing for key letters
        if char in ["A", "S", "T", "M", "N"]:
            draw_fist(draw, h_cx, h_cy, scale=0.6, color=CYAN)
        elif char in ["B", "C", "O"]:
            draw_open_palm(draw, h_cx, h_cy + 8, scale=0.55, color=CYAN)
        elif char in ["F", "D"]:
            draw_pinch(draw, h_cx - 5, h_cy, openness=0.0, scale=0.6, color=CYAN)
        else:
            draw_open_palm(draw, h_cx, h_cy + 8, scale=0.55, color=CYAN)

        # Pose title & description
        draw.text((x + cell_w // 2, y + 118), pose_name, fill=WHITE, anchor="mm")
        draw.text((x + cell_w // 2, y + 142), desc, fill=MUTED, anchor="mm")

    # Bottom Footer
    draw.text((width // 2, height - 28), "Tip: Hold your hand steady for ~500ms to confirm each letter into composed text.", fill=EMERALD, anchor="mm")

    chart.save(CHART_PATH, "PNG")
    print(f"Generated {CHART_PATH}")

if __name__ == "__main__":
    print("Generating animated GIFs for word gestures...")
    create_hello_gif()
    create_yes_gif()
    create_no_gif()
    create_thank_you_gif()
    create_please_gif()
    create_sorry_gif()

    print("Generating ASL Alphabet Poster Chart...")
    create_asl_alphabet_chart()
    print("All assets successfully generated!")
