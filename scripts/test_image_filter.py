import pymupdf
import re
import os
import json

def is_header_or_watermark(slug, pno, bimg, r):
    w, h = bimg['width'], bimg['height']
    # Watermark
    if w == 559 and h == 447:
        return True
    # First page header logos
    if pno == 0 and r.y1 <= 170:
        return True
    # Kemampuan Analitik letterheads
    if slug == 'kemampuan_analitik':
        # All images in Kemampuan Analitik are letterhead or logos
        return True
    # Top letterhead in any exam (e.g. y1 < 120 and w > 600 and h < 250)
    if r.y1 <= 120 and w > 600 and h < 250:
        return True
    return False

def audit_matches():
    # Let's check how many images each exam has and where they map
    from build_full_extracted_dataset import CONFIGS
    for cfg in CONFIGS:
        slug = cfg['slug']
        fpath = cfg['file']
        doc = pymupdf.open(fpath)
        print(f"\n--- Checking {cfg['title']} ({fpath}) ---")
        for pno in range(len(doc)):
            page = doc[pno]
            imgs = page.get_images()
            valid_imgs = []
            for img in imgs:
                xref = img[0]
                bimg = doc.extract_image(xref)
                rects = page.get_image_rects(xref)
                if not rects: continue
                r = rects[0]
                if is_header_or_watermark(slug, pno, bimg, r):
                    continue
                valid_imgs.append((xref, bimg, r))
            if valid_imgs:
                print(f"  Page {pno+1}: {len(valid_imgs)} content images")
                for xref, bimg, r in valid_imgs:
                    print(f"    xref={xref}, size={bimg['width']}x{bimg['height']}, rect=[y0={r.y0:.1f}, y1={r.y1:.1f}, x0={r.x0:.1f}]")

if __name__ == '__main__':
    audit_matches()

