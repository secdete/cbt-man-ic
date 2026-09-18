import pymupdf

def inspect_page_blocks(pdf_path, page_num):
    doc = pymupdf.open(pdf_path)
    page = doc[page_num - 1]
    print(f"\n=== {pdf_path} (Page {page_num}) ===")
    blocks = sorted(page.get_text('blocks'), key=lambda x: x[1])
    for b in blocks:
        t = b[4].strip().replace('\n', ' ')
        if t:
            print(f"  y={b[1]:.1f}: {repr(t[:80])}")
    print("  Images:")
    for img in page.get_images():
        xref = img[0]
        bimg = doc.extract_image(xref)
        rects = page.get_image_rects(xref)
        print(f"    xref={xref} {bimg['width']}x{bimg['height']} {rects[0] if rects else None}")

inspect_page_blocks('modul/Tes Akademik Ipa 98-126.pdf', 4) # Q6 is on page 4
inspect_page_blocks('modul/Tes Akademik Ipa 182-210.pdf', 1) # Q2,3 is on page 1-2
inspect_page_blocks('modul/Tes Akademik Ipa 182-210.pdf', 2)
