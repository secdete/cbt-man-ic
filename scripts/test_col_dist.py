import pymupdf, glob, os

for p in sorted(glob.glob('modul/*.pdf')):
    doc = pymupdf.open(p)
    page = doc[0]
    w = page.rect.width
    blocks = page.get_text('blocks')
    left_cnt = sum(1 for b in blocks if b[0] < w * 0.45 and b[4].strip())
    right_cnt = sum(1 for b in blocks if b[0] > w * 0.45 and b[4].strip())
    print(f"{os.path.basename(p):<35} w={w:.1f} | left_blocks={left_cnt} | right_blocks={right_cnt}")

