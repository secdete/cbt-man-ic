import pymupdf, re

doc = pymupdf.open('modul/Tes Akademik Ipa 182-210.pdf')
all_blocks = []
for pno in range(len(doc)):
    page = doc[pno]
    blocks = page.get_text('blocks')
    page_b = []
    for b in blocks:
        t = b[4].strip()
        if not t or any(h in t for h in ['SNPDB', 'Tes Akademik', 'CBT Master', 'Version', 'Pengawas']):
            continue
        page_b.append({'pno': pno + 1, 'y0': b[1], 'text': t})
    page_b.sort(key=lambda x: x['y0'])
    all_blocks.extend(page_b)

questions = []
curr_q = None
expected_num = 1

# Standalone question number regex: e.g. "1." or "2." or "3."
q_num_regex = re.compile(r'^(\d+)[\.\)]\s*$')

for b in all_blocks:
    txt = b['text']
    
    # Check standalone number
    m_num = q_num_regex.match(txt)
    # Or start of question with number
    m_start = re.match(r'^(\d+)[\.\)]\s+([A-Z\u0600-\u06FF].*)', txt, re.DOTALL)
    
    is_new_q = False
    q_num = None
    q_stem = ""
    
    if m_num and int(m_num.group(1)) == expected_num:
        is_new_q = True
        q_num = expected_num
    elif m_start and int(m_start.group(1)) == expected_num:
        # Check that it's not a numbered list inside current question (e.g. if current question has no options yet and list items like 1, 2, 3 appear)
        is_new_q = True
        q_num = expected_num
        q_stem = m_start.group(2).strip()
        
    if is_new_q:
        if curr_q:
            questions.append(curr_q)
        curr_q = {
            'number': q_num,
            'page': b['pno'],
            'text_parts': [q_stem] if q_stem else [],
            'options': {}
        }
        expected_num += 1
    elif curr_q:
        # Check for options
        # Options in SNPDB are (A), (B), (C), (D) or (A) ... (B) ...
        opt_matches = list(re.finditer(r'(?:^|\n)\s*\(?([A-E])\)[\.\s]+([^\n]+(?:\n(?!\(?[A-E]\)[\.\s])(?!\d+[\.\)])[^\n]+)*)', txt))
        if opt_matches:
            for om in opt_matches:
                curr_q['options'][om.group(1).upper()] = re.sub(r'\s+', ' ', om.group(2)).strip()
        else:
            curr_q['text_parts'].append(txt)

if curr_q:
    questions.append(curr_q)

print(f"Total parsed: {len(questions)}")
print(f"Expected num reached: {expected_num - 1}")
dummies = [q for q in questions if len(q['options']) == 0]
print(f"Questions missing options: {len(dummies)}")
for q in questions[:5]:
    print(f"Q{q['number']} (P{q['page']}, opts={len(q['options'])}): {' '.join(q['text_parts'])[:60]} | {q['options']}")

