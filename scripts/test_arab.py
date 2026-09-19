import pymupdf, json

doc = pymupdf.open('modul/Bahasa Arab 2-4.pdf')
pages_data = []

for pno, page in enumerate(doc):
    blocks = page.get_text('blocks')
    # Filter out header/footer
    filtered_blocks = []
    for b in sorted(blocks, key=lambda x: (round(x[1] // 15), x[0])):
        t = b[4].strip()
        if t and not ('MATERI UJIAN SNPDB' in t or 'MATA UJI' in t or 'Version 1.0' in t or 'Pengawas Ruang' in t):
            filtered_blocks.append({
                'bbox': [round(b[0], 1), round(b[1], 1), round(b[2], 1), round(b[3], 1)],
                'text': t
            })
    
    imgs = []
    for img in page.get_images():
        xref = img[0]
        bimg = doc.extract_image(xref)
        rects = page.get_image_rects(xref)
        if bimg['width'] > 100 and bimg['height'] > 60:
            if not (bimg['width'] == 559 and bimg['height'] == 447):
                imgs.append({
                    'xref': xref,
                    'w': bimg['width'],
                    'h': bimg['height'],
                    'rect': [round(rects[0].x0, 1), round(rects[0].y0, 1), round(rects[0].x1, 1), round(rects[0].y1, 1)] if rects else None
                })
    
    pages_data.append({
        'page': pno + 1,
        'blocks': filtered_blocks,
        'images': imgs
    })

with open('scripts/test_arab_dump.json', 'w', encoding='utf-8') as f:
    json.dump(pages_data, f, ensure_ascii=False, indent=2)

print("Dumped Bahasa Arab page data")

