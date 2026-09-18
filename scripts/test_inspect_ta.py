import pymupdf

doc = pymupdf.open('modul/TA MAN-IC Paket 1 11-43.pdf')
page = doc[0]
print('Images on page 1:')
for img in page.get_images():
    xref = img[0]
    base_img = doc.extract_image(xref)
    rects = page.get_image_rects(xref)
    print(f"  xref={xref} w={base_img['width']} h={base_img['height']} rect={rects[0] if rects else None}")

print('\nDrawings on page 1:', len(page.get_drawings()))
for d in page.get_drawings()[:10]:
    print('  drawing:', d['rect'])
