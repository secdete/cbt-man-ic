import pymupdf, re, json

def test_ta_man_ic():
    doc = pymupdf.open('modul/TA MAN-IC Paket 1 11-43.pdf')
    all_blocks = []
    for pno in range(len(doc)):
        page = doc[pno]
        blocks = page.get_text('blocks')
        page_b = []
        for b in blocks:
            txt = b[4].strip()
            if not txt or any(h in txt for h in ['SNPDB', 'Mata Uji', 'CBT Master Panel', 'Version']):
                continue
            page_b.append({'pno': pno + 1, 'y0': b[1], 'text': txt})
        page_b.sort(key=lambda x: x['y0'])
        all_blocks.extend(page_b)
        
    expected_num = 1
    questions = []
    curr_q = None
    
    # Pattern to match options
    opt_pat = re.compile(r'(?:^|\n|\s+)(?:\(([A-E])\)|([A-E])\.)[\s\u064B-\u0652\u0670]*')
    
    for b in all_blocks:
        txt = b['text']
        lines = txt.split('\n')
        first_line = lines[0].strip()
        m = re.match(r'^(\d+)[\.\)]\s*(.*)', first_line, re.DOTALL)
        
        if m and int(m.group(1)) == expected_num:
            if curr_q:
                questions.append(curr_q)
            curr_q = {
                'number': expected_num,
                'page': b['pno'],
                'text_parts': [txt],
                'options': {}
            }
            expected_num += 1
        elif curr_q:
            # Check for options
            tokens = opt_pat.split(txt)
            if len(tokens) > 1 and any(tokens[1::3]):
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
        
    print(f"Total parsed: {len(questions)}")
    for q in questions:
        if q['number'] in [1, 2, 33, 73, 74]:
            print(f"\n--- Q{q['number']} (P{q['page']}) ---")
            print("Stem:", " ".join(q['text_parts'])[:120])
            print("Options:", q['options'])

test_ta_man_ic()

