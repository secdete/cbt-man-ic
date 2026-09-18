import pymupdf, re, sys, os

def inspect_questions(pdf_path, max_pages=30):
    log = []
    log.append(f"\n================ INSPECTING: {pdf_path} ================")
    doc = pymupdf.open(pdf_path)
    total_q = 0
    all_q_numbers = []
    for pno in range(len(doc)):
        page = doc[pno]
        text = page.get_text()
        q_matches = re.findall(r'(?:^|\n)\s*(\d+)\.\s*([^\n]+)', text)
        page_q_nums = [m[0] for m in q_matches]
        if page_q_nums:
            total_q += len(page_q_nums)
            all_q_numbers.extend(page_q_nums)
            log.append(f"Page {pno+1}: Q {page_q_nums}")
        
        # Check images
        imgs = page.get_images()
        real_imgs = []
        for img in imgs:
            xref = img[0]
            bimg = doc.extract_image(xref)
            if bimg['width'] > 150 and bimg['height'] > 80:
                rects = page.get_image_rects(xref)
                r = rects[0] if rects else None
                if not (bimg['width'] == 559 and bimg['height'] == 447) and not (r and r.y1 < 170 and bimg['width'] < 400):
                    real_imgs.append((xref, f"{bimg['width']}x{bimg['height']}", f"y={round(r.y0,1)}-{round(r.y1,1)}" if r else "no-rect"))
        if real_imgs:
            log.append(f"   Images on P{pno+1}: {real_imgs}")
    log.append(f"TOTAL QUESTIONS DETECTED: {len(all_q_numbers)} (distinct: {len(set(all_q_numbers))})")
    return "\n".join(log)

pdf_list = [
    'modul/Bahasa Arab 2-4.pdf',
    'modul/Bahasa Indonesia 5-6.pdf',
    'modul/Bahasa Inggris 7-10.pdf',
    'modul/IPA 44-48.pdf',
    'modul/IPS 49-53.pdf',
    'modul/Keislaman 54-61.pdf',
    'modul/Matematika 62-67.pdf',
    'modul/TA MAN-IC Paket 1 11-43.pdf',
    'modul/TA MAN-PK Paket 1 68-97.pdf',
    'modul/Tes Akademik Ipa 98-126.pdf',
    'modul/Tes Akademik Ips 127-156.pdf',
    'modul/Tes Keislaman 157-181.pdf',
    'modul/Tes Akademik Ipa 182-210.pdf',
    'modul/Tes Akademik Ips 211-240.pdf',
    'modul/Tes Keislaman 241-265.pdf',
    'modul/Kemampuan Analitik 266-271.pdf'
]

full_log = []
for p in pdf_list:
    full_log.append(inspect_questions(p))

with open('scripts/multi_inspection_log.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(full_log))

print("Done writing scripts/multi_inspection_log.txt")
