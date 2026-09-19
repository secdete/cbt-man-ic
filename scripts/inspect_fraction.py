import pymupdf
import sys

sys.stdout.reconfigure(encoding='utf-8')
doc = pymupdf.open('modul/Tes Akademik Ipa 182-210.pdf')
p = doc[2] # Page 3

print("=== BLOCKS ===")
for b in p.get_text('blocks'):
    print(f"y0={b[1]:.1f}, y1={b[3]:.1f}, x0={b[0]:.1f} | {repr(b[4])}")

print("\n=== SPANS ===")
for b in p.get_text('words'):
    if 'AB' in b[4] or 'AG' in b[4] or 'Diketahui' in b[4] or b[4] in ['1', '5', '/', '⁄']:
        print(f"word: {repr(b[4])} at x0={b[0]:.1f}, y0={b[1]:.1f}, x1={b[2]:.1f}, y1={b[3]:.1f}")
