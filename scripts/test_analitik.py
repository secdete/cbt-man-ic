import pymupdf, json

doc = pymupdf.open('modul/Kemampuan Analitik 266-271.pdf')
print("Kemampuan Analitik Pages:", len(doc))

for pno in range(len(doc)):
    page = doc[pno]
    mid_x = page.rect.width / 2
    blocks = page.get_text('blocks')
    
    col1 = []
    col2 = []
    for b in blocks:
        txt = b[4].strip()
        if not txt or 'DOKUMEN RAHASIA' in txt or 'NASKAH SOAL' in txt or 'MATA UJI' in txt:
            continue
        if b[0] < mid_x:
            col1.append(b)
        else:
            col2.append(b)
            
    # sort by y
    col1_sorted = sorted(col1, key=lambda x: x[1])
    col2_sorted = sorted(col2, key=lambda x: x[1])
    
    print(f"\n--- Page {pno+1} ---")
    print(f"Col 1 (left) blocks: {len(col1_sorted)}")
    for b in col1_sorted[:3]:
        print(f"  [y={round(b[1])}]: {b[4].strip()[:50]}")
    print(f"Col 2 (right) blocks: {len(col2_sorted)}")
    for b in col2_sorted[:3]:
        print(f"  [y={round(b[1])}]: {b[4].strip()[:50]}")

