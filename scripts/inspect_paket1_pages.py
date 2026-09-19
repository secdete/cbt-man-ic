import pymupdf

doc = pymupdf.open('modul/TA MAN-IC Paket 1 11-43.pdf')
for pno in [28, 29, 30, 31, 32]:
    page = doc[pno]
    print(f"\n=== Page {pno+1} ===")
    for b in page.get_text('blocks'):
        txt = b[4].strip().replace('\n', ' ')[:80]
        if txt:
            print(f"  TEXT: y0={b[1]:.1f}, y1={b[3]:.1f}: {txt}")
    for img in page.get_images():
        xref = img[0]
        bimg = doc.extract_image(xref)
        if bimg['width'] == 559 and bimg['height'] == 447: continue
        r = page.get_image_rects(xref)[0]
        print(f"  IMAGE: xref={xref} {bimg['width']}x{bimg['height']} at y0={r.y0:.1f}, y1={r.y1:.1f}, x0={r.x0:.1f}")

