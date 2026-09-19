import pymupdf, re

doc = pymupdf.open('modul/Kemampuan Analitik 266-271.pdf')
print("Inspecting Kemampuan Analitik question matches:")
for pno in range(len(doc)):
    page = doc[pno]
    text = page.get_text()
    matches = re.findall(r'(?:^|\n)\s*(\d+)[\.\)]\s*([^\n]+)', text)
    print(f"Page {pno+1}: {[m[0] for m in matches]}")

