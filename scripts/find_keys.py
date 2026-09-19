import glob, os, pymupdf

pdf_files = sorted(glob.glob('modul/*.pdf'))
for p in pdf_files:
    doc = pymupdf.open(p)
    fname = os.path.basename(p)
    found_keys = []
    for i, page in enumerate(doc):
        text = page.get_text()
        for kw in ['KUNCI', 'Kunci', 'PEMBAHASAN', 'Pembahasan', 'Jawaban:']:
            if kw in text:
                found_keys.append((i+1, kw))
    print(f"{fname}: {len(doc)} pages. Key matches: {found_keys}")

