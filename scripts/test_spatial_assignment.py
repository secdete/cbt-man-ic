import pymupdf
import re
import os
import json
from build_full_extracted_dataset import CONFIGS, INDO_PASSAGES, INGG_PASSAGES

def is_header_or_watermark(slug, pno, bimg, r):
    w, h = bimg['width'], bimg['height']
    # Watermark
    if w == 559 and h == 447:
        return True
    # First page header logos
    if pno == 0 and r.y1 <= 170:
        return True
    # Kemampuan Analitik: all images are letterhead/logos
    if slug == 'kemampuan_analitik':
        return True
    # General letterhead across pages (PT Indo Prestasi Utama, etc.)
    if r.y1 <= 125 and w > 500 and h < 250:
        return True
    return False

def clean_spacing(s):
    if not s: return ""
    return re.sub(r'\s+', ' ', s).strip()

def test_spatial_assignment():
    with open("scripts/spatial_verification_log.txt", "w", encoding="utf-8") as log:
        for cfg in CONFIGS:
            slug = cfg['slug']
            fpath = cfg['file']
            token = cfg['token']
            is_two_col = cfg['is_two_col']
            use_standalone = cfg['use_standalone_num']
            
            doc = pymupdf.open(fpath)
            log.write(f"\n=======================================================\n")
            log.write(f"=== [{token}] {cfg['title']} ===\n")
            log.write(f"=======================================================\n")
            
            # 1. Pre-extract images per page
            pages_images = {}
            for pno in range(len(doc)):
                page = doc[pno]
                pages_images[pno] = []
                for img in page.get_images():
                    xref = img[0]
                    bimg = doc.extract_image(xref)
                    rects = page.get_image_rects(xref)
                    if not rects: continue
                    r = rects[0]
                    if is_header_or_watermark(slug, pno, bimg, r):
                        continue
                    fname = f"{slug}_p{pno+1}_x{xref}_{bimg['width']}x{bimg['height']}.{bimg['ext']}"
                    pages_images[pno].append({
                        'xref': xref,
                        'rect': r,
                        'src': f"/soal-images/{slug}/{fname}",
                        'w': bimg['width'],
                        'h': bimg['height'],
                        'y0': r.y0,
                        'y1': r.y1,
                        'x0': r.x0,
                        'x1': r.x1
                    })
                    
            # 2. Extract text blocks per page
            for pno in range(len(doc)):
                page = doc[pno]
                blocks = page.get_text("blocks")
                # find question markers on this page
                q_markers = []
                intro_markers = []
                for b in blocks:
                    txt = b[4].strip()
                    if not txt: continue
                    if any(k in txt for k in ['SNPDB', 'MATA UJI', 'DOKUMEN RAHASIA', 'Halaman']): continue
                    lines = txt.split('\n')
                    first = lines[0].strip()
                    # Check question
                    m = re.match(r'^(\d+)[\.\)]\s*(.*)', first)
                    if m:
                        q_num = int(m.group(1))
                        q_markers.append({
                            'num': q_num,
                            'y0': b[1],
                            'y1': b[3],
                            'x0': b[0],
                            'text': m.group(2)[:60]
                        })
                    elif re.match(r'^(?:Soal\s+(?:nomor|no)\s+\d+|Perhatikan|Berdasarkan|Informasi|Bacalah)', first, re.I):
                        intro_markers.append({
                            'y0': b[1],
                            'y1': b[3],
                            'x0': b[0],
                            'text': first[:60]
                        })
                        
                q_markers.sort(key=lambda x: x['y0'])
                p_imgs = pages_images.get(pno, [])
                
                if p_imgs:
                    log.write(f"\nPage {pno+1}: {len(p_imgs)} images, {len(q_markers)} questions\n")
                    for q in q_markers:
                        log.write(f"  Q#{q['num']} at y0={q['y0']:.1f}, text: {q['text']}\n")
                    for im in p_imgs:
                        log.write(f"  Image xref={im['xref']} ({im['w']}x{im['h']}) at y0={im['y0']:.1f}, y1={im['y1']:.1f}\n")

if __name__ == '__main__':
    test_spatial_assignment()
    print("Done! Check scripts/spatial_verification_log.txt")

