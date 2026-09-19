import pymupdf
import glob
import re

for f in sorted(glob.glob("modul/*.pdf")):
    doc = pymupdf.open(f)
    print(f"\n{'='*60}\n=== {f} ===")
    for pno in range(len(doc)):
        page = doc[pno]
        blocks = page.get_text('blocks')
        imgs = []
        for img in page.get_images():
            xref = img[0]
            bimg = doc.extract_image(xref)
            if bimg['width'] == 559 and bimg['height'] == 447: continue
            for r in page.get_image_rects(xref):
                if pno == 0 and r.y1 <= 170: continue
                if r.y1 <= 125 and bimg['width'] > 500: continue
                imgs.append((r.y0, r.y1, xref, bimg['width'], bimg['height']))
        
        # Sort text blocks and images together
        combined = []
        for b in blocks:
            txt = b[4].strip()
            if not txt: continue
            if any(k in txt for k in ['MATERI UJIAN SNPDB', 'MATA UJI', 'Version 1.0', 'Pengawas Ruang', 'UIN Sunan Ampel', 'DOKUMEN RAHASIA', 'CBT Master Panel', 'NASKAH SOAL TRYOUT']): continue
            combined.append(('TXT', b[1], b[3], txt))
        for im in imgs:
            combined.append(('IMG', im[0], im[1], f"size={im[3]}x{im[4]}"))
            
        combined.sort(key=lambda x: x[1])
        
        # Check sequences where TXT is a question number, followed by IMG
        for i in range(len(combined) - 1):
            cur = combined[i]
            nxt = combined[i+1]
            if cur[0] == 'TXT' and nxt[0] == 'IMG':
                first_l = cur[3].split('\n')[0].strip()
                m = re.match(r'^(\d+)[\.\)]\s*(.*)', first_l)
                if m:
                    q_num = m.group(1)
                    rem_txt = m.group(2).strip()
                    print(f"Page {pno+1}: Q{q_num} (y={cur[1]:.1f}..{cur[2]:.1f}, rem='{rem_txt[:30]}') followed by IMG (y={nxt[1]:.1f}..{nxt[2]:.1f}, {nxt[3]})")

