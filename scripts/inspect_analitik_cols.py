import pymupdf, re

doc = pymupdf.open('modul/Kemampuan Analitik 266-271.pdf')
for pno, page in enumerate(doc):
    print(f"\n================ PAGE {pno+1} ================")
    mid = page.rect.width / 2
    blocks = page.get_text('blocks')
    col1 = sorted([b for b in blocks if b[0] < mid and b[4].strip() and not 'DOKUMEN RAHASIA' in b[4]], key=lambda x: x[1])
    col2 = sorted([b for b in blocks if b[0] >= mid and b[4].strip() and not 'DOKUMEN RAHASIA' in b[4]], key=lambda x: x[1])
    
    print("--- LEFT COLUMN ---")
    for b in col1:
        print(f"  ({b[0]:.0f},{b[1]:.0f}): {b[4].strip().replace(chr(10), ' ')[:80]}")
    print("--- RIGHT COLUMN ---")
    for b in col2:
        print(f"  ({b[0]:.0f},{b[1]:.0f}): {b[4].strip().replace(chr(10), ' ')[:80]}")
