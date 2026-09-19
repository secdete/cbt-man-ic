import json
import sys
import pymupdf

sys.stdout.reconfigure(encoding='utf-8')

print("--- INSPECTING PDF modul/Bahasa Arab 2-4.pdf ---")
doc = pymupdf.open('modul/Bahasa Arab 2-4.pdf')
print("Total pages:", len(doc))
for pno, p in enumerate(doc):
    imgs = p.get_images()
    print(f"\nPage {pno+1} has {len(imgs)} images:")
    for img in imgs:
        xref = img[0]
        bimg = doc.extract_image(xref)
        rects = p.get_image_rects(xref)
        rects_fmt = [[round(coord, 1) for coord in r] for r in rects]
        print(f"  xref {xref}: {bimg['width']}x{bimg['height']}, ext={bimg['ext']}, rects={rects_fmt}")


print("\n\n--- INSPECTING JSON scripts/extracted_exams/bahasa_arab.json ---")
with open('scripts/extracted_exams/bahasa_arab.json', 'r', encoding='utf-8') as fp:
    d = json.load(fp)

print("\n--- ALL 15 QUESTIONS ---")
for q in d.get('questions', []):
    print(f"\n=== Q{q.get('questionNumber')} (P{q.get('page')}) ===")
    print("Text:", repr(q.get('questionText')))
    for opt in ['A', 'B', 'C', 'D', 'E']:
        if q.get(f'option{opt}'):
            print(f"  ({opt}) {repr(q.get(f'option{opt}'))}")


