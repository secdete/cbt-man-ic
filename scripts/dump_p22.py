import pymupdf

doc = pymupdf.open('modul/Tes Akademik Ipa 182-210.pdf')
page = doc[21] # page 22
with open('scripts/p22_dump.txt', 'w', encoding='utf-8') as f:
    for b in sorted(page.get_text('blocks'), key=lambda x: x[1]):
        f.write(f"y={b[1]:.1f}: {repr(b[4].strip())}\n")
