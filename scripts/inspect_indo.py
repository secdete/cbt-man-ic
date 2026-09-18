import pymupdf

doc = pymupdf.open('modul/Bahasa Indonesia 5-6.pdf')
for pno in range(len(doc)):
    page = doc[pno]
    print(f"\n--- PAGE {pno+1} ---")
    blocks = sorted(page.get_text('blocks'), key=lambda x: x[1])
    for b in blocks:
        t = b[4].strip().replace('\n', ' ')
        if t and not ('MATERI UJIAN SNPDB' in t or 'MATA UJI' in t or 'Version 1.0' in t or 'Pengawas Ruang' in t):
            print(f"y={round(b[1])}: {t[:90]}")
