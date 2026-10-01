import os
from PIL import Image, ImageDraw

ROOT_DIR = r"c:\Users\sidia\OneDrive\Documents\App\Atypik"
SRC_LOGO_PATH = os.path.join(ROOT_DIR, "assets", "logo-original.png")
RES_DIR = os.path.join(ROOT_DIR, "android", "app", "src", "main", "res")

def create_circular_mask(size):
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size[0], size[1]), fill=255)
    return mask

def create_rounded_mask(size, radius):
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return mask

def generate_assets():
    if not os.path.exists(SRC_LOGO_PATH):
        raise FileNotFoundError(f"Logo introuvable : {SRC_LOGO_PATH}")
    
    logo = Image.open(SRC_LOGO_PATH).convert("RGBA")
    print(f"Logo source charge : {SRC_LOGO_PATH} ({logo.size})")

    # 1. Generation des icones Android mipmap
    density_map = {
        "mipmap-mdpi": {"legacy": 48, "foreground": 108},
        "mipmap-hdpi": {"legacy": 72, "foreground": 162},
        "mipmap-xhdpi": {"legacy": 96, "foreground": 216},
        "mipmap-xxhdpi": {"legacy": 144, "foreground": 324},
        "mipmap-xxxhdpi": {"legacy": 192, "foreground": 432},
    }

    for folder, sizes in density_map.items():
        folder_path = os.path.join(RES_DIR, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        fg_size = sizes["foreground"]
        leg_size = sizes["legacy"]

        # --- A) Foreground Adaptatif (transparent + logo centre dans la safe zone 68%) ---
        fg_img = Image.new("RGBA", (fg_size, fg_size), (255, 255, 255, 0))
        fg_logo_size = int(fg_size * 0.68)
        resized_fg_logo = logo.resize((fg_logo_size, fg_logo_size), Image.Resampling.LANCZOS)
        offset_fg = ((fg_size - fg_logo_size) // 2, (fg_size - fg_logo_size) // 2)
        fg_img.paste(resized_fg_logo, offset_fg, resized_fg_logo)
        fg_img.save(os.path.join(folder_path, "ic_launcher_foreground.png"), "PNG")

        # --- B) Legacy Square/Squircle (ic_launcher.png) ---
        leg_img = Image.new("RGBA", (leg_size, leg_size), (255, 255, 255, 255))
        leg_logo_size = int(leg_size * 0.85)
        resized_leg_logo = logo.resize((leg_logo_size, leg_logo_size), Image.Resampling.LANCZOS)
        offset_leg = ((leg_size - leg_logo_size) // 2, (leg_size - leg_logo_size) // 2)
        leg_img.paste(resized_leg_logo, offset_leg, resized_leg_logo)
        
        # Arrondir legerement les angles pour les vieux Android
        round_mask = create_rounded_mask((leg_size, leg_size), radius=int(leg_size * 0.20))
        final_leg_img = Image.new("RGBA", (leg_size, leg_size), (0, 0, 0, 0))
        final_leg_img.paste(leg_img, (0, 0), round_mask)
        final_leg_img.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")

        # --- C) Legacy Round (ic_launcher_round.png) ---
        round_bg = Image.new("RGBA", (leg_size, leg_size), (255, 255, 255, 255))
        round_logo_size = int(leg_size * 0.80)
        resized_round_logo = logo.resize((round_logo_size, round_logo_size), Image.Resampling.LANCZOS)
        offset_round = ((leg_size - round_logo_size) // 2, (leg_size - round_logo_size) // 2)
        round_bg.paste(resized_round_logo, offset_round, resized_round_logo)
        
        circ_mask = create_circular_mask((leg_size, leg_size))
        final_round_img = Image.new("RGBA", (leg_size, leg_size), (0, 0, 0, 0))
        final_round_img.paste(round_bg, (0, 0), circ_mask)
        final_round_img.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")

        print(f"[OK] {folder} genere avec succes.")

    # 2. Icone haute definition 512x512 pour la Google Play Console
    playstore_icon = Image.new("RGBA", (512, 512), (255, 255, 255, 255))
    ps_logo_size = 430
    resized_ps_logo = logo.resize((ps_logo_size, ps_logo_size), Image.Resampling.LANCZOS)
    offset_ps = ((512 - ps_logo_size) // 2, (512 - ps_logo_size) // 2)
    playstore_icon.paste(resized_ps_logo, offset_ps, resized_ps_logo)
    
    ps_path_1 = os.path.join(ROOT_DIR, "assets", "playstore-icon-512.png")
    ps_path_2 = os.path.join(ROOT_DIR, "android", "playstore-icon-512.png")
    playstore_icon.save(ps_path_1, "PNG")
    playstore_icon.save(ps_path_2, "PNG")
    print(f"[OK] Icone Google Play Store 512x512 generee dans {ps_path_1}")

    # 3. Generation des Splash Screens (Portrait & Landscape)
    splash_specs = [
        # Folder, Width, Height, IsLandscape
        ("drawable", 1080, 1920, False),
        ("drawable-port-mdpi", 320, 480, False),
        ("drawable-port-hdpi", 480, 800, False),
        ("drawable-port-xhdpi", 720, 1280, False),
        ("drawable-port-xxhdpi", 960, 1600, False),
        ("drawable-port-xxxhdpi", 1280, 1920, False),
        ("drawable-land-mdpi", 480, 320, True),
        ("drawable-land-hdpi", 800, 480, True),
        ("drawable-land-xhdpi", 1280, 720, True),
        ("drawable-land-xxhdpi", 1600, 960, True),
        ("drawable-land-xxxhdpi", 1920, 1280, True),
    ]

    for folder, w, h, is_land in splash_specs:
        target_dir = os.path.join(RES_DIR, folder)
        os.makedirs(target_dir, exist_ok=True)
        
        splash_img = Image.new("RGBA", (w, h), (255, 255, 255, 255))
        
        if is_land:
            logo_target_size = int(min(w * 0.32, h * 0.55))
        else:
            logo_target_size = int(min(w * 0.60, h * 0.36))
            
        resized_splash_logo = logo.resize((logo_target_size, logo_target_size), Image.Resampling.LANCZOS)
        offset_splash = ((w - logo_target_size) // 2, (h - logo_target_size) // 2)
        splash_img.paste(resized_splash_logo, offset_splash, resized_splash_logo)
        
        target_file = os.path.join(target_dir, "splash.png")
        splash_img.save(target_file, "PNG")
        print(f"[OK] Splash screen {w}x{h} genere pour {folder}")

    # 4. Favicon pour le web
    favicon_32 = logo.resize((32, 32), Image.Resampling.LANCZOS)
    favicon_32.save(os.path.join(ROOT_DIR, "public", "favicon.ico"), format="ICO")
    favicon_192 = logo.resize((192, 192), Image.Resampling.LANCZOS)
    favicon_192.save(os.path.join(ROOT_DIR, "public", "logo-atypik.png"), "PNG")
    print("[OK] Favicon et logo public/ mis a jour.")

if __name__ == "__main__":
    generate_assets()
    print("\n TOUS LES ASSETS MOBILES ONT ETE GENERES AVEC SUCCES !")
