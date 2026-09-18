import pymupdf, glob, os, re

pdf_files = sorted(glob.glob('modul/*.pdf'))

print(f"{'Filename':<35} | {'Pages':<5} | {'Images':<6}")
print("-" * 52)
for p in pdf_files:
    fname = os.path.basename(p)
    doc = pymupdf.open(p)
    img_cnt = sum(len(page.get_images()) for page in doc)
    print(f"{fname:<35} | {len(doc):<5} | {img_cnt:<6}")
