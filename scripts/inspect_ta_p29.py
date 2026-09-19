import pymupdf

doc = pymupdf.open('modul/TA MAN-IC Paket 1 11-43.pdf')
for pno in [28, 29, 30]: # 0-indexed: pages 29, 30, 31
    page = doc[pno]
    print(f"\n================ PAGE {pno+1} ================")
    print("Blocks:")
    for b in page.get_text('blocks'):
        print(f"  ({b[0]:.0f},{b[1]:.0f}): {repr(b[4].strip())}")
    print("Images:")
    for img in page.get_images():
        xref = img[0]
        bimg = doc.extract_image(xref)
        rects = page.get_image_rects(xref)
        print(f"  xref={xref} {bimg['width']}x{bimg['height']} rect={rects[0] if rects else None}")

