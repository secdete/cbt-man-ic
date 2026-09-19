import pymupdf
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open('modul/Tes Akademik Ipa 182-210.pdf')
for pno in range(1, 6): # pages 2 to 6 (0-indexed 1 to 5)
    print(f"\n{'='*50}\n=== PAGE {pno+1} ===")
    blocks = doc[pno].get_text('blocks')
    for b in blocks:
        text = b[4].strip()
        print(f"  [x0={b[0]:.1f}, y0={b[1]:.1f}, x1={b[2]:.1f}, y1={b[3]:.1f}]:\n    {repr(text)}")

