import pymupdf
import glob

with open("scripts/audit_all_image_rects.txt", "w", encoding="utf-8") as out:
    for f in sorted(glob.glob('modul/*.pdf')):
        doc = pymupdf.open(f)
        out.write(f"\n{'='*60}\n=== {f} ({len(doc)} pages) ===\n{'='*60}\n")
        for pno in range(len(doc)):
            page = doc[pno]
            imgs = page.get_images()
            for img in imgs:
                xref = img[0]
                bimg = doc.extract_image(xref)
                if bimg['width'] == 559 and bimg['height'] == 447: continue
                rects = page.get_image_rects(xref)
                # ignore header logo on page 1
                if pno == 0 and rects and all(r.y1 <= 170 for r in rects):
                    continue
                out.write(f"Page {pno+1}: xref={xref}, size={bimg['width']}x{bimg['height']}, {len(rects)} locations:\n")
                for r in rects:
                    out.write(f"   rect: [y0={r.y0:.1f}, y1={r.y1:.1f}, x0={r.x0:.1f}, x1={r.x1:.1f}]\n")

print("Done! Check scripts/audit_all_image_rects.txt")
