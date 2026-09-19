import pymupdf, os

doc = pymupdf.open('modul/TA MAN-IC Paket 1 11-43.pdf')
page = doc[29] # page 30
slug = "ta_man_ic_paket_1"
img_dir = f"public/soal-images/{slug}"
os.makedirs(img_dir, exist_ok=True)

# Find all images on this page
page_images = []
for img in page.get_images():
    xref = img[0]
    bimg = doc.extract_image(xref)
    rects = page.get_image_rects(xref)
    if rects and not (bimg['width'] == 559 and bimg['height'] == 447):
        r = rects[0]
        fname = f"{slug}_p30_x{xref}_{bimg['width']}x{bimg['height']}.{bimg['ext']}"
        with open(os.path.join(img_dir, fname), 'wb') as f:
            f.write(bimg['image'])
        page_images.append({
            'xref': xref,
            'rect': r,
            'src': f"/soal-images/{slug}/{fname}",
            'w': bimg['width'],
            'h': bimg['height']
        })

print(f"Extracted {len(page_images)} images on Page 30")

# Find blocks
for b in page.get_text('blocks'):
    txt = b[4].strip()
    if txt in ['(A)', '(B)', '(C)', '(D)']:
        opt_key = txt[1]
        y_center = (b[1] + b[3]) / 2
        # Find matching image whose y range covers y_center or is close
        matched_img = None
        for im in page_images:
            if abs(im['rect'].y0 - b[1]) < 25 and im['rect'].x0 > b[0]:
                matched_img = im
                break
        if matched_img:
            print(f"Option {opt_key} at y={b[1]:.1f} -> Matched Image: {matched_img['src']} ({matched_img['w']}x{matched_img['h']})")
        else:
            print(f"Option {opt_key} at y={b[1]:.1f} -> NO IMAGE MATCHED")

