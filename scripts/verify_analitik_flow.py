import pymupdf, re

doc = pymupdf.open('modul/Kemampuan Analitik 266-271.pdf')
items = []
for pno in range(len(doc)):
    page = doc[pno]
    mid = page.rect.width / 2
    blocks = page.get_text('blocks')
    col1 = [b for b in blocks if b[0] < mid and b[4].strip() and not 'DOKUMEN RAHASIA' in b[4]]
    col2 = [b for b in blocks if b[0] >= mid and b[4].strip() and not 'DOKUMEN RAHASIA' in b[4]]
    col1.sort(key=lambda x: x[1])
    col2.sort(key=lambda x: x[1])
    items.extend(col1 + col2)

# Check question numbers found in this stream
q_nums = []
for b in items:
    txt = b[4].strip()
    m = re.match(r'^(\d+)[\.\)]\s*', txt)
    if m:
        q_nums.append(int(m.group(1)))

print("Sequential Q numbers found in column stream:")
print(q_nums)

