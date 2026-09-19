import pymupdf

files_to_check = [
    'modul/Matematika 62-67.pdf',
    'modul/Bahasa Indonesia 5-6.pdf',
    'modul/Kemampuan Analitik 266-271.pdf',
    'modul/TA MAN-IC Paket 1 11-43.pdf'
]

for fpath in files_to_check:
    print(f"\n==================== {fpath} ====================")
    doc = pymupdf.open(fpath)
    page = doc[0]
    print(f"Page 1 dimensions: {page.rect.width} x {page.rect.height}")
    blocks = page.get_text('blocks')
    for b in sorted(blocks, key=lambda x: (round(x[1] // 30), x[0]))[:15]:
        txt = b[4].strip().replace('\n', ' ')
        print(f"  bbox=({b[0]:.1f}, {b[1]:.1f}, {b[2]:.1f}, {b[3]:.1f}): {txt[:70]}")

