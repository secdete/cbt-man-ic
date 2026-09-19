import pymupdf
import glob
import os

with open("scripts/debug_images_output.txt", "w", encoding="utf-8") as out:
    for f in sorted(glob.glob('modul/*.pdf')):
        doc = pymupdf.open(f)
        out.write(f"\n=========================================\n=== {f} ({len(doc)} pages) ===\n")
        for pno in range(len(doc)):
            page = doc[pno]
            imgs = page.get_images()
            text_blocks = page.get_text("blocks")
            valid_imgs = []
            for img in imgs:
                xref = img[0]
                bimg = doc.extract_image(xref)
                if bimg['width'] == 559 and bimg['height'] == 447:
                    continue
                rects = page.get_image_rects(xref)
                r = rects[0] if rects else None
                valid_imgs.append((xref, bimg['width'], bimg['height'], r))
                
            if valid_imgs:
                out.write(f"\n  --- Page {pno+1} ({len(valid_imgs)} images) ---\n")
                for x, w, h, r in valid_imgs:
                    out.write(f"    Image xref={x}, size={w}x{h}, rect={r}\n")
                out.write("    Text blocks on this page:\n")
                for b in text_blocks:
                    txt = b[4].strip().replace('\n', ' ')[:100]
                    if txt and not any(k in txt for k in ['SNPDB', 'MATA UJI', 'DOKUMEN RAHASIA', 'Halaman']):
                        out.write(f"      y0={b[1]:.1f}, y1={b[3]:.1f}, x0={b[0]:.1f}: {txt}\n")
print("Done writing to scripts/debug_images_output.txt")

