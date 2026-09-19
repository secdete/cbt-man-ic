import pymupdf

doc = pymupdf.open('modul/Bahasa Indonesia 5-6.pdf')
for pno in range(len(doc)):
    page = doc[pno]
    print(f"\n--- Page {pno+1} images: {len(page.get_images())} ---")
    for img in page.get_images():
        xref = img[0]
        bimg = doc.extract_image(xref)
        rects = page.get_image_rects(xref)
        print(f"  xref={xref} {bimg['width']}x{bimg['height']} rect={rects[0] if rects else 'None'}")

