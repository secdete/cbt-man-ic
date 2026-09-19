import pymupdf
import glob
import re

with open("scripts/audit_spatial_output.txt", "w", encoding="utf-8") as out:
    for f in sorted(glob.glob('modul/*.pdf')):
        doc = pymupdf.open(f)
        has_img = False
        for pno in range(len(doc)):
            page = doc[pno]
            imgs = [img for img in page.get_images() if doc.extract_image(img[0])['width'] != 559]
            if imgs:
                has_img = True
                break
        if not has_img:
            continue
            
        out.write(f"\n=======================================================\n")
        out.write(f"=== {f} ===\n")
        out.write(f"=======================================================\n")
        for pno in range(len(doc)):
            page = doc[pno]
            valid_imgs = []
            for img in page.get_images():
                xref = img[0]
                bimg = doc.extract_image(xref)
                if bimg['width'] == 559 and bimg['height'] == 447:
                    continue
                rects = page.get_image_rects(xref)
                r = rects[0] if rects else None
                if pno == 0 and r and r.y1 <= 170:
                    continue
                valid_imgs.append({'xref': xref, 'w': bimg['width'], 'h': bimg['height'], 'r': r})
                
            if not valid_imgs:
                continue
                
            out.write(f"\n--- Page {pno+1} ({len(valid_imgs)} images) ---\n")
            for im in valid_imgs:
                r = im['r']
                out.write(f"  IMAGE: xref={im['xref']} ({im['w']}x{im['h']}) at y0={r.y0:.1f}, y1={r.y1:.1f}, x0={r.x0:.1f}, x1={r.x1:.1f}\n")
                
            blocks = page.get_text("blocks")
            for b in blocks:
                txt = b[4].strip().replace('\n', ' ')
                if not txt: continue
                if any(k in txt for k in ['SNPDB', 'MATA UJI', 'DOKUMEN RAHASIA', 'Halaman']): continue
                is_q = re.match(r'^\s*(\d+)[\.\)]', txt)
                is_opt = re.match(r'^\s*\(?[A-E]\)?[\.\s]', txt)
                is_intro = any(k in txt.lower() for k in ['bacaan', 'informasi', 'perhatikan', 'grafik', 'tabel', 'gambar', 'soal nomor', 'setelah mendapat'])
                if is_q or is_opt or is_intro:
                    out.write(f"  TEXT: y0={b[1]:.1f}, y1={b[3]:.1f}, x0={b[0]:.1f} | {txt[:90]}\n")

print("Audit written to scripts/audit_spatial_output.txt")

