import pymupdf
import sys

sys.stdout.reconfigure(encoding='utf-8')
fpath = sys.argv[1] if len(sys.argv) > 1 else 'modul/IPA 44-48.pdf'
doc = pymupdf.open(fpath)
for pno in range(len(doc)):
    page = doc[pno]
    print(f"\n=== Page {pno+1} ===")
    items = []
    seen = []
    for img in page.get_images():
        xref = img[0]
        bimg = doc.extract_image(xref)
        if bimg['width'] == 559 and bimg['height'] == 447:
            continue
        for r in page.get_image_rects(xref):
            if pno == 0 and r.y1 <= 170:
                continue
            if r.y1 <= 125 and bimg['width'] > 500:
                continue
            box = (round(r.x0, 1), round(r.y0, 1), round(r.x1, 1), round(r.y1, 1))
            if any(abs(b[0]-box[0])<2 and abs(b[1]-box[1])<2 and abs(b[2]-box[2])<2 and abs(b[3]-box[3])<2 for b in seen):
                continue
            seen.append(box)
            items.append(('IMG', r.y0, r.y1, f"IMG size={bimg['width']}x{bimg['height']}"))
            
    for b in page.get_text('blocks'):
        txt = b[4].strip()
        if not txt:
            continue
        if any(k in txt for k in ['MATERI UJIAN SNPDB', 'MATA UJI', 'Version 1.0', 'Pengawas Ruang', 'UIN Sunan Ampel', 'DOKUMEN RAHASIA', 'CBT Master Panel', 'NASKAH SOAL TRYOUT']):
            continue
        first_line = txt.split('\n')[0][:60]
        items.append(('TXT', b[1], b[3], first_line))
        
    items.sort(key=lambda x: x[1])
    for it in items:
        print(f"  y0={it[1]:<6.1f} y1={it[2]:<6.1f} | {it[0]} | {it[3]}")
