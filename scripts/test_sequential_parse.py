import pymupdf, re, json, os

def test_sequential(pdf_path, is_two_col=False):
    doc = pymupdf.open(pdf_path)
    # Collect all text blocks with coordinates
    all_items = []
    for pno in range(len(doc)):
        page = doc[pno]
        w = page.rect.width
        blocks = page.get_text('blocks')
        
        page_items = []
        for b in blocks:
            txt = b[4].strip()
            if not txt:
                continue
            if any(k in txt for k in ['MATERI UJIAN SNPDB', 'MATA UJI', 'Version 1.0', 'Pengawas Ruang', 'UIN Sunan Ampel', 'DOKUMEN RAHASIA', 'CBT Master Panel']):
                continue
            page_items.append({
                'pno': pno + 1,
                'x0': b[0],
                'y0': b[1],
                'text': txt
            })
            
        if is_two_col:
            mid = w / 2
            col1 = [it for it in page_items if it['x0'] < mid]
            col2 = [it for it in page_items if it['x0'] >= mid]
            col1.sort(key=lambda it: it['y0'])
            col2.sort(key=lambda it: it['y0'])
            all_items.extend(col1 + col2)
        else:
            page_items.sort(key=lambda it: it['y0'])
            all_items.extend(page_items)
            
    # Now parse strictly sequential question numbers: 1, 2, 3, 4, ...
    questions = []
    expected_num = 1
    curr_q = None
    
    q_start_regex = re.compile(r'^(?:Soal\s+nomor\s+)?(\d+)[\.\)]\s*(.*)', re.DOTALL)
    
    for it in all_items:
        txt = it['text']
        first_line = txt.split('\n')[0].strip()
        m = q_start_regex.match(first_line)
        
        # Check if line starts with the EXACT expected question number!
        if m and int(m.group(1)) == expected_num:
            if curr_q:
                questions.append(curr_q)
            curr_q = {
                'number': expected_num,
                'page': it['pno'],
                'text_parts': [txt],
                'options': {}
            }
            expected_num += 1
        elif curr_q:
            # Check for options
            tokens = re.split(r'(?:^|\s+|\n)(?:\(([A-E])\)|([A-E])\.)\s+', txt)
            if len(tokens) > 1:
                i = 1
                while i < len(tokens):
                    k = tokens[i] or tokens[i+1]
                    val = tokens[i+2] if i+2 < len(tokens) else ""
                    if k and k.upper() in ['A', 'B', 'C', 'D', 'E']:
                        curr_q['options'][k.upper()] = re.sub(r'\s+', ' ', val).strip()
                    i += 3
            else:
                curr_q['text_parts'].append(txt)
                
    if curr_q:
        questions.append(curr_q)
        
    return questions

test_files = [
    ('modul/Bahasa Arab 2-4.pdf', False),
    ('modul/TA MAN-IC Paket 1 11-43.pdf', False),
    ('modul/TA MAN-PK Paket 1 68-97.pdf', False),
    ('modul/Tes Keislaman 157-181.pdf', False),
    ('modul/Tes Akademik Ipa 98-126.pdf', False),
    ('modul/Kemampuan Analitik 266-271.pdf', True)
]

for f, two_col in test_files:
    qs = test_sequential(f, two_col)
    missing_opts = sum(1 for q in qs if len(q['options']) == 0)
    print(f"{os.path.basename(f):<35} | Total Q: {len(qs):<3} | Missing Opts: {missing_opts}")
