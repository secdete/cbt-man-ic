import pymupdf, re, os, json

def clean_text(t):
    return re.sub(r'\s+', ' ', t).strip()

def process_pdf(pdf_path, slug, is_two_col=False):
    doc = pymupdf.open(pdf_path)
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
            # Ignore header logos at the very top of first page (y1 < 170 and width < 400 or logo)
            if pno == 0 and r.y1 <= 170:
                continue
            if bimg['width'] < 60 or bimg['height'] < 40:
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
            if any(k in txt for k in ['MATERI UJIAN SNPDB', 'MATA UJI', 'Version 1.0', 'Pengawas Ruang', 'UIN Sunan Ampel', 'DOKUMEN RAHASIA', 'CBT Master Panel']):
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
            # Split by middle x
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
    
    # regex for question start
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
                
                # Check if this block contains question start
                lines = txt.split('\n')
                first_line = lines[0].strip()
                m_q = q_start_regex.match(first_line)
                
                # Also check if line 0 is intro like "Soal nomor 1-2 berdasarkan..."
                is_intro = bool(re.match(r'^(?:Soal|Berdasarkan|Perhatikan|Bacalah|Teks|Informasi)\b', first_line, re.I)) and not m_q
                
                if m_q and int(m_q.group(1)) <= 120:
                    q_num = int(m_q.group(1))
                    q_stem = m_q.group(2).strip()
                    if len(lines) > 1:
                        q_stem += "\n" + "\n".join(lines[1:])
                        
                    # Save previous question
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
                elif is_intro:
                    if curr_q and curr_q['options']:
                        # Old question is complete, this intro belongs to next question
                        buffer.append(txt)
                    elif curr_q:
                        curr_q['text_parts'].append(txt)
                    else:
                        buffer.append(txt)
                else:
                    # Check for options
                    opt_found = False
                    opt_matches = list(re.finditer(r'(?:^|\n)\s*\(?([A-E])\)[\.\s]+([^\n]+(?:\n(?!\(?[A-E]\)[\.\s])(?!\d+[\.\)])[^\n]+)*)', txt))
                    if opt_matches and curr_q:
                        opt_found = True
                        for om in opt_matches:
                            curr_q['options'][om.group(1).upper()] = clean_text(om.group(2))
                    
                    if not opt_found:
                        if curr_q and not curr_q['options']:
                            curr_q['text_parts'].append(txt)
                        else:
                            buffer.append(txt)
                            
    if curr_q:
        questions.append(curr_q)
        
    return questions

# Test on 3 diverse files
q_arab = process_pdf('modul/Bahasa Arab 2-4.pdf', 'bahasa_arab')
q_ipa = process_pdf('modul/IPA 44-48.pdf', 'ipa')
q_analitik = process_pdf('modul/Kemampuan Analitik 266-271.pdf', 'analitik', is_two_col=True)

print(f"Bahasa Arab: {len(q_arab)} questions")
print(f"IPA: {len(q_ipa)} questions")
print(f"Kemampuan Analitik: {len(q_analitik)} questions")
for q in q_analitik[:3]:
    print(f"  Q{q['number']}: {q['options']}")

