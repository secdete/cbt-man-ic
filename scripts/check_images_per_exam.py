import pymupdf
import glob
import re

with open("scripts/images_per_exam.txt", "w", encoding="utf-8") as out:
    for f in sorted(glob.glob('modul/*.pdf')):
        doc = pymupdf.open(f)
        out.write(f"\n=========================================\n=== {f} ({len(doc)} pages) ===\n")
        for pno in range(len(doc)):
            page = doc[pno]
            imgs = page.get_images()
            valid_imgs = []
            for img in imgs:
                xref = img[0]
                bimg = doc.extract_image(xref)
                if bimg['width'] == 559 and bimg['height'] == 447:
                    continue
                rects = page.get_image_rects(xref)
                r = rects[0] if rects else None
                # ignore header logos
                if pno == 0 and r and r.y1 <= 170:
                    continue
                valid_imgs.append((xref, bimg['width'], bimg['height'], r))
                
            if valid_imgs:
                out.write(f"\n  Page {pno+1}: {len(valid_imgs)} images\n")
                for x, w, h, r in valid_imgs:
                    out.write(f"    Image xref={x}, size={w}x{h}, rect={r}\n")
                
                # Get questions on this page
                blocks = page.get_text("blocks")
                out.write("    Questions on this page:\n")
                for b in blocks:
                    txt = b[4].strip().replace('\n', ' ')[:120]
                    # check if starts with number like "1." or "2)"
                    m = re.match(r'^\s*(\d+)[\.\)]\s*(.*)', txt)
                    if m:
                        out.write(f"      Q#{m.group(1)} at y0={b[1]:.1f}, y1={b[3]:.1f}, x0={b[0]:.1f}: {m.group(2)[:80]}\n")
                    elif any(w in txt.lower() for w in ['gambar', 'perhatikan', 'tabel', 'grafik', 'berdasarkan']):
                        out.write(f"      Text at y0={b[1]:.1f}: {txt[:80]}\n")

print("Wrote to scripts/images_per_exam.txt")

