import pymupdf

doc = pymupdf.open('modul/IPA 44-48.pdf')
for pno in range(len(doc)):
    page = doc[pno]
    print(f"\n=== PAGE {pno+1} ===")
    for img in page.get_images():
        xref = img[0]
        bimg = doc.extract_image(xref)
        if bimg['width'] == 559 and bimg['height'] == 447: continue
        rects = page.get_image_rects(xref)
        print(f"xref={xref}, {bimg['width']}x{bimg['height']}, rects={rects}")
