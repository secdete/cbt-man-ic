import os
import re
import json
import pymupdf

OUTPUT_DIR = "scripts/extracted_exams"
os.makedirs(OUTPUT_DIR, exist_ok=True)

CONFIGS = [
    {
        "file": "modul/Bahasa Arab 2-4.pdf",
        "slug": "bahasa_arab",
        "token": "IC-ARAB",
        "title": "Tryout SNPDB MAN IC: Bahasa Arab",
        "subject": "Bahasa Arab",
        "category": "SNPDB 2023",
        "duration": 45,
        "passing_score": 65,
        "is_two_col": False,
    },
    {
        "file": "modul/Bahasa Indonesia 5-6.pdf",
        "slug": "bahasa_indonesia",
        "token": "IC-INDO",
        "title": "Tryout SNPDB MAN IC: Bahasa Indonesia",
        "subject": "Bahasa Indonesia",
        "category": "SNPDB 2023",
        "duration": 45,
        "passing_score": 65,
        "is_two_col": False,
    },
    {
        "file": "modul/Bahasa Inggris 7-10.pdf",
        "slug": "bahasa_inggris",
        "token": "IC-INGG",
        "title": "Tryout SNPDB MAN IC: Bahasa Inggris",
        "subject": "Bahasa Inggris",
        "category": "SNPDB 2023",
        "duration": 45,
        "passing_score": 65,
        "is_two_col": False,
    },
    {
        "file": "modul/IPA 44-48.pdf",
        "slug": "ipa",
        "token": "IC-IPA",
        "title": "Tryout SNPDB MAN IC: IPA (Sains Terpadu)",
        "subject": "IPA (Sains Terpadu)",
        "category": "SNPDB 2023",
        "duration": 60,
        "passing_score": 70,
        "is_two_col": False,
    },
    {
        "file": "modul/IPS 49-53.pdf",
        "slug": "ips",
        "token": "IC-IPS",
        "title": "Tryout SNPDB MAN IC: IPS (Sosial Terpadu)",
        "subject": "IPS (Sosial Terpadu)",
        "category": "SNPDB 2023",
        "duration": 60,
        "passing_score": 70,
        "is_two_col": False,
    },
    {
        "file": "modul/Keislaman 54-61.pdf",
        "slug": "keislaman",
        "token": "IC-AGAMA",
        "title": "Tryout SNPDB MAN IC: Literasi Keagamaan Islam",
        "subject": "Keislaman",
        "category": "SNPDB 2023",
        "duration": 60,
        "passing_score": 70,
        "is_two_col": False,
    },
    {
        "file": "modul/Matematika 62-67.pdf",
        "slug": "matematika",
        "token": "IC-MTK",
        "title": "Tryout SNPDB MAN IC: Matematika",
        "subject": "Matematika",
        "category": "SNPDB 2023",
        "duration": 60,
        "passing_score": 70,
        "is_two_col": False,
    },
    {
        "file": "modul/Kemampuan Analitik 266-271.pdf",
        "slug": "kemampuan_analitik",
        "token": "IC-ANALITIK",
        "title": "Tryout SNPDB MAN IC: Kemampuan Analitik",
        "subject": "Kemampuan Analitik",
        "category": "Tryout Mandiri",
        "duration": 45,
        "passing_score": 70,
        "is_two_col": True,
    },
    {
        "file": "modul/TA MAN-IC Paket 1 11-43.pdf",
        "slug": "ta_man_ic_paket_1",
        "token": "IC-PAKET1",
        "title": "Simulasi Akbar SNPDB MAN-IC (Paket 1 Lengkap)",
        "subject": "Tes Akademik MAN-IC",
        "category": "SNPDB 2020",
        "duration": 120,
        "passing_score": 75,
        "is_two_col": False,
    },
    {
        "file": "modul/TA MAN-PK Paket 1 68-97.pdf",
        "slug": "ta_man_pk_paket_1",
        "token": "PK-PAKET1",
        "title": "Simulasi Akbar SNPDB MAN-PK (Paket 1 Lengkap)",
        "subject": "Tes Akademik MAN-PK",
        "category": "SNPDB 2020",
        "duration": 120,
        "passing_score": 75,
        "is_two_col": False,
    },
    {
        "file": "modul/Tes Akademik Ipa 98-126.pdf",
        "slug": "snpdb_2021_ipa",
        "token": "SNPDB-2021-IPA",
        "title": "SNPDB 2021: Tes Akademik IPA",
        "subject": "Tes Akademik IPA",
        "category": "SNPDB 2021",
        "duration": 120,
        "passing_score": 75,
        "is_two_col": False,
    },
    {
        "file": "modul/Tes Akademik Ips 127-156.pdf",
        "slug": "snpdb_2021_ips",
        "token": "SNPDB-2021-IPS",
        "title": "SNPDB 2021: Tes Akademik IPS",
        "subject": "Tes Akademik IPS",
        "category": "SNPDB 2021",
        "duration": 120,
        "passing_score": 75,
        "is_two_col": False,
    },
    {
        "file": "modul/Tes Keislaman 157-181.pdf",
        "slug": "snpdb_2021_keislaman",
        "token": "SNPDB-2021-AGAMA",
        "title": "SNPDB 2021: Tes Keislaman",
        "subject": "Tes Keislaman",
        "category": "SNPDB 2021",
        "duration": 90,
        "passing_score": 70,
        "is_two_col": False,
    },
    {
        "file": "modul/Tes Akademik Ipa 182-210.pdf",
        "slug": "snpdb_2022_ipa",
        "token": "SNPDB-2022-IPA",
        "title": "SNPDB 2022: Tes Akademik IPA",
        "subject": "Tes Akademik IPA",
        "category": "SNPDB 2022",
        "duration": 120,
        "passing_score": 75,
        "is_two_col": False,
    },
    {
        "file": "modul/Tes Akademik Ips 211-240.pdf",
        "slug": "snpdb_2022_ips",
        "token": "SNPDB-2022-IPS",
        "title": "SNPDB 2022: Tes Akademik IPS",
        "subject": "Tes Akademik IPS",
        "category": "SNPDB 2022",
        "duration": 120,
        "passing_score": 75,
        "is_two_col": False,
    },
    {
        "file": "modul/Tes Keislaman 241-265.pdf",
        "slug": "snpdb_2022_keislaman",
        "token": "SNPDB-2022-AGAMA",
        "title": "SNPDB 2022: Tes Keislaman",
        "subject": "Tes Keislaman",
        "category": "SNPDB 2022",
        "duration": 90,
        "passing_score": 70,
        "is_two_col": False,
    },
]

def clean_spacing(s):
    if not s:
        return ""
    return re.sub(r'\s+', ' ', s).strip()

def extract_options_from_text(text):
    """
    Extracts options A-E from a block of text.
    Handles:
    (A) ... (B) ... (C) ... (D) ...
    A. ... B. ... C. ... D. ...
    (A) ... \n (B) ...
    """
    options = {}
    tokens = re.split(r'(?:^|\s+|\n)(?:\(([A-E])\)|([A-E])\.)\s+', text)
    if len(tokens) > 1:
        i = 1
        while i < len(tokens):
            k = tokens[i] or tokens[i+1]
            val = tokens[i+2] if i+2 < len(tokens) else ""
            if k and k.upper() in ['A', 'B', 'C', 'D', 'E']:
                options[k.upper()] = clean_spacing(val)
            i += 3
    return options

def parse_single_pdf(cfg):
    fpath = cfg["file"]
    slug = cfg["slug"]
    is_two_col = cfg["is_two_col"]
    
    if not os.path.exists(fpath):
        print(f"File not found: {fpath}")
        return None
        
    doc = pymupdf.open(fpath)
    img_dir = f"public/soal-images/{slug}"
    os.makedirs(img_dir, exist_ok=True)
    
    pages_items = []
    
    for pno in range(len(doc)):
        page = doc[pno]
        w, h = page.rect.width, page.rect.height
        
        # 1. Images
        images_on_page = []
        for img in page.get_images():
            xref = img[0]
            bimg = doc.extract_image(xref)
            rects = page.get_image_rects(xref)
            if not rects:
                continue
            r = rects[0]
            # Ignore background watermark (559x447)
            if bimg['width'] == 559 and bimg['height'] == 447:
                continue
            # Ignore header logos at the top of first page (y1 < 170 and width < 400)
            if pno == 0 and r.y1 <= 170:
                continue
            if bimg['width'] < 50 or bimg['height'] < 30:
                continue
                
            img_filename = f"{slug}_p{pno+1}_x{xref}_{bimg['width']}x{bimg['height']}.{bimg['ext']}"
            img_path = os.path.join(img_dir, img_filename)
            if not os.path.exists(img_path):
                with open(img_path, 'wb') as f:
                    f.write(bimg['image'])
                    
            images_on_page.append({
                'type': 'image',
                'x0': r.x0,
                'y0': r.y0,
                'x1': r.x1,
                'y1': r.y1,
                'src': f"/soal-images/{slug}/{img_filename}",
                'w': bimg['width'],
                'h': bimg['height']
            })
            
        # 2. Text blocks
        text_items = []
        for b in page.get_text('blocks'):
            txt = b[4].strip()
            if not txt:
                continue
            if any(k in txt for k in [
                'MATERI UJIAN SNPDB', 'MATA UJI', 'Version 1.0', 'Pengawas Ruang',
                'UIN Sunan Ampel', 'DOKUMEN RAHASIA', 'CBT Master Panel', 'NASKAH SOAL TRYOUT'
            ]):
                continue
            text_items.append({
                'type': 'text',
                'x0': b[0],
                'y0': b[1],
                'x1': b[2],
                'y1': b[3],
                'text': txt
            })
            
        all_items = images_on_page + text_items
        
        if is_two_col:
            mid = w / 2
            col1 = [it for it in all_items if it['x0'] < mid]
            col2 = [it for it in all_items if it['x0'] >= mid]
            col1.sort(key=lambda it: it['y0'])
            col2.sort(key=lambda it: it['y0'])
            ordered = col1 + col2
        else:
            all_items.sort(key=lambda it: it['y0'])
            ordered = all_items
            
        pages_items.append(ordered)
        
    # Reconstruct questions from stream
    questions = []
    curr_q = None
    buffer = []
    
    q_start_regex = re.compile(r'^(?:Soal\s+nomor\s+)?(\d+)[\.\)]\s*(.*)', re.DOTALL)
    
    for pno, items in enumerate(pages_items):
        for item in items:
            if item['type'] == 'image':
                img_md = f"![Ilustrasi]({item['src']})"
                if curr_q and not curr_q['options']:
                    curr_q['text_parts'].append(img_md)
                else:
                    buffer.append(img_md)
            else:
                txt = item['text']
                lines = txt.split('\n')
                first_line = lines[0].strip()
                m_q = q_start_regex.match(first_line)
                
                # Check for options first
                opts = extract_options_from_text(txt)
                
                is_intro = bool(re.match(r'^(?:Soal|Berdasarkan|Perhatikan|Bacalah|Teks|Informasi)\b', first_line, re.I)) and not m_q
                
                if m_q and int(m_q.group(1)) <= 120 and not opts:
                    q_num = int(m_q.group(1))
                    q_stem = m_q.group(2).strip()
                    if len(lines) > 1:
                        q_stem += "\n" + "\n".join(lines[1:])
                        
                    if curr_q:
                        questions.append(curr_q)
                        
                    text_parts = []
                    if buffer:
                        text_parts.extend(buffer)
                        buffer = []
                    if q_stem:
                        text_parts.append(q_stem)
                        
                    curr_q = {
                        'number': q_num,
                        'text_parts': text_parts,
                        'options': {},
                        'page': pno + 1
                    }
                elif m_q and opts:
                    # Question start and options combined in one block
                    q_num = int(m_q.group(1))
                    q_stem = m_q.group(2).strip()
                    # extract portion before options
                    pre_opts = re.split(r'(?:^|\s+|\n)(?:\([A-E]\)|[A-E]\.)\s+', txt)[0]
                    pre_opts_cleaned = re.sub(r'^\d+[\.\)]\s*', '', pre_opts).strip()
                    
                    if curr_q:
                        questions.append(curr_q)
                        
                    text_parts = []
                    if buffer:
                        text_parts.extend(buffer)
                        buffer = []
                    if pre_opts_cleaned:
                        text_parts.append(pre_opts_cleaned)
                    elif q_stem:
                        text_parts.append(q_stem)
                        
                    curr_q = {
                        'number': q_num,
                        'text_parts': text_parts,
                        'options': opts,
                        'page': pno + 1
                    }
                elif opts and curr_q:
                    for k, v in opts.items():
                        curr_q['options'][k] = v
                elif is_intro:
                    if curr_q and curr_q['options']:
                        buffer.append(txt)
                    elif curr_q:
                        curr_q['text_parts'].append(txt)
                    else:
                        buffer.append(txt)
                else:
                    if curr_q and not curr_q['options']:
                        curr_q['text_parts'].append(txt)
                    else:
                        buffer.append(txt)
                        
    if curr_q:
        questions.append(curr_q)
        
    # Post-process questions: ensure options A-D exist, clean text
    cleaned_questions = []
    seen_numbers = set()
    
    for q in questions:
        num = q['number']
        # If duplicated number, adjust
        if num in seen_numbers:
            num = max(seen_numbers) + 1
        seen_numbers.add(num)
        
        q_text = "\n\n".join([p.strip() for p in q['text_parts'] if p.strip()])
        opts = q['options']
        
        # Fallbacks if options are empty
        opt_a = opts.get('A', 'Pilihan A')
        opt_b = opts.get('B', 'Pilihan B')
        opt_c = opts.get('C', 'Pilihan C')
        opt_d = opts.get('D', 'Pilihan D')
        opt_e = opts.get('E', None)
        
        cleaned_questions.append({
            'questionNumber': num,
            'questionText': q_text,
            'optionA': opt_a,
            'optionB': opt_b,
            'optionC': opt_c,
            'optionD': opt_d,
            'optionE': opt_e,
            'correctAnswer': 'A', # Default fallback if key not given
            'subject': cfg['subject'],
            'points': 5 if 'Analitik' in cfg['subject'] or 'Akademik' in cfg['subject'] else 4,
            'page': q['page']
        })
        
    cleaned_questions.sort(key=lambda x: x['questionNumber'])
    
    # Re-index questionNumber consecutively 1..N
    for idx, q in enumerate(cleaned_questions):
        q['questionNumber'] = idx + 1
        
    result_data = {
        'config': cfg,
        'total_questions': len(cleaned_questions),
        'questions': cleaned_questions
    }
    
    out_json = os.path.join(OUTPUT_DIR, f"{slug}.json")
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(result_data, f, ensure_ascii=False, indent=2)
        
    print(f"[{cfg['token']}] {cfg['title']} -> {len(cleaned_questions)} questions saved to {out_json}")
    return result_data

if __name__ == '__main__':
    print("Starting extraction of all 16 PDFs...")
    summary = []
    for c in CONFIGS:
        res = parse_single_pdf(c)
        if res:
            summary.append({
                'token': c['token'],
                'title': c['title'],
                'questions': res['total_questions']
            })
            
    print("\n" + "=" * 60)
    print("EXTRACTION SUMMARY:")
    for s in summary:
        print(f"{s['token']:<18} | {s['questions']:<3} questions | {s['title']}")
