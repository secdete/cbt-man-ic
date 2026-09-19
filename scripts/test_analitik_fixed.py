import pymupdf, re, json

doc = pymupdf.open('modul/Kemampuan Analitik 266-271.pdf')
items = []
for pno in range(len(doc)):
    page = doc[pno]
    mid = page.rect.width / 2
    blocks = page.get_text('blocks')
    col1 = [b for b in blocks if b[0] < mid and b[4].strip() and not 'DOKUMEN RAHASIA' in b[4] and not 'NASKAH SOAL' in b[4] and not 'MATA UJI' in b[4]]
    col2 = [b for b in blocks if b[0] >= mid and b[4].strip() and not 'DOKUMEN RAHASIA' in b[4] and not 'NASKAH SOAL' in b[4] and not 'MATA UJI' in b[4]]
    col1.sort(key=lambda x: x[1])
    col2.sort(key=lambda x: x[1])
    for b in col1 + col2:
        items.append({'pno': pno + 1, 'text': b[4].strip()})

# Split blocks that have question embedded inside like "A. ... 15. Jika..."
expanded_items = []
for it in items:
    txt = it['text']
    # Check if there is a question inside, e.g. "\n15. " or "  15. "
    parts = re.split(r'(?:^|\n|\s{2,})(\d+[\.\)]\s+)', txt)
    if len(parts) > 2:
        # parts: [before, num1, text1, num2, text2, ...]
        if parts[0].strip():
            expanded_items.append({'pno': it['pno'], 'text': parts[0].strip()})
        i = 1
        while i < len(parts):
            expanded_items.append({'pno': it['pno'], 'text': parts[i] + parts[i+1].strip()})
            i += 2
    else:
        expanded_items.append(it)

questions = []
curr_q = None
expected_num = 1
passages = []

for it in expanded_items:
    txt = it['text']
    lines = txt.split('\n')
    first_line = lines[0].strip()
    
    # Ignore "Soal nomor X-Y..." as question start
    if re.match(r'^Soal\s+(?:nomor|no)\s+\d+\s*-\s*\d+', first_line, re.I):
        passages.append(txt)
        continue
        
    m = re.match(r'^(\d+)[\.\)]\s*(.*)', first_line, re.DOTALL)
    if m and int(m.group(1)) == expected_num:
        if curr_q:
            questions.append(curr_q)
        q_stem = m.group(2).strip()
        if len(lines) > 1:
            q_stem += "\n" + "\n".join(lines[1:])
            
        full_text = []
        if passages:
            full_text.extend(passages)
            passages = []
        if q_stem:
            full_text.append(q_stem)
            
        curr_q = {
            'number': expected_num,
            'page': it['pno'],
            'text_parts': full_text,
            'options': {}
        }
        expected_num += 1
    elif curr_q:
        # Check for options A-E
        tokens = re.split(r'(?:^|\s+|\n)(?:([A-E])\.)\s+', txt)
        if len(tokens) > 1 and any(tokens[1::2]):
            i = 1
            while i < len(tokens):
                k = tokens[i]
                val = tokens[i+1] if i+1 < len(tokens) else ""
                if k and k.upper() in ['A', 'B', 'C', 'D', 'E']:
                    curr_q['options'][k.upper()] = re.sub(r'\s+', ' ', val).strip()
                i += 2
        elif not curr_q['options']:
            curr_q['text_parts'].append(txt)
        else:
            passages.append(txt)

if curr_q:
    questions.append(curr_q)

print(f"Total Kemampuan Analitik parsed: {len(questions)}")
for q in questions:
    has_opts = len(q['options']) > 0
    print(f"Q{q['number']} (opts={len(q['options'])}): {' '.join(q['text_parts'])[:60]} | {list(q['options'].keys())}")

