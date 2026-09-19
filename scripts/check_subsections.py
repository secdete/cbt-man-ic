import pymupdf, re

doc = pymupdf.open('modul/TA MAN-IC Paket 1 11-43.pdf')
sections = []
for pno in range(len(doc)):
    text = doc[pno].get_text()
    for line in text.split('\n'):
        line = line.strip()
        if any(w in line.upper() for w in ['MATEMATIKA', 'FISIKA', 'BIOLOGI', 'KIMIA', 'BAHASA', 'BAGIAN', 'SUBTES', 'SAINS']):
            if len(line) < 50:
                sections.append((pno+1, line))

print("Sections in TA MAN-IC Paket 1 11-43.pdf:")
for s in sections[:20]:
    print(f"  P{s[0]}: {s[1]}")

