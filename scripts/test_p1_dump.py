import pymupdf

def inspect_page(pdf_path, pno):
    doc = pymupdf.open(pdf_path)
    page = doc[pno-1]
    with open('scripts/p_dump.txt', 'w', encoding='utf-8') as f:
        f.write(f"=== {pdf_path} (Page {pno}) ===\n")
        blocks = sorted(page.get_text('blocks'), key=lambda x: x[1])
        for b in blocks:
            f.write(f"y={b[1]:.1f}: {repr(b[4].strip())}\n")

inspect_page('modul/Tes Akademik Ipa 182-210.pdf', 1)

