import pymupdf
import json

doc = pymupdf.open('modul/IPA 44-48.pdf')
print(f"Total pages in IPA: {len(doc)}")

with open('scripts/extracted_exams/ipa.json', encoding='utf-8') as f:
    ipa_json = json.load(f)

for pno in range(len(doc)):
    page = doc[pno]
    print(f"\n{'='*30} PDF PAGE {pno+1} {'='*30}")
    print("--- RAW TEXT ---")
    print(page.get_text())
    print("--- IMAGES ---")
    for img in page.get_images():
        xref = img[0]
        bimg = doc.extract_image(xref)
        if bimg['width'] == 559: continue
        rects = page.get_image_rects(xref)
        print(f"Image xref={xref}, size={bimg['width']}x{bimg['height']}, rect={rects}")

print("\n" + "="*70)
print("--- CURRENT JSON QUESTIONS FOR IPA ---")
for q in ipa_json['questions']:
    print(f"\n[Q#{q['questionNumber']}]")
    print("Stem:")
    print(q['questionText'])
    print(f"A: {q['optionA']}")
    print(f"B: {q['optionB']}")
    print(f"C: {q['optionC']}")
    print(f"D: {q['optionD']}")
