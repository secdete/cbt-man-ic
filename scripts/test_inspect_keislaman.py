import pymupdf

doc = pymupdf.open('modul/Keislaman 54-61.pdf')
for pno in range(len(doc)):
    page = doc[pno]
    blocks = page.get_text('blocks')
    # Filter out header/footer
    print(f"\n--- PAGE {pno+1} ---")
    # sort blocks by y0
    sorted_blocks = sorted(blocks, key=lambda b: (round(b[1] // 20), b[0]))
    for b in sorted_blocks:
        txt = b[4].strip().replace('\n', ' ')
        if txt and not ('SNPDB' in txt or 'Pengawas Ruang' in txt or 'MATA UJI' in txt or 'Version' in txt):
            print(f"y={round(b[1],1)}: {txt[:100]}")
    imgs = page.get_images()
    for img in imgs:
        xref = img[0]
        base_img = doc.extract_image(xref)
        rects = page.get_image_rects(xref)
        if base_img['width'] > 150 and base_img['height'] > 100: # filter out small logos
            print(f"  [IMG] xref={xref} w={base_img['width']} h={base_img['height']} rect={rects[0] if rects else None}")

