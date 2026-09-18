import pymupdf, re, os, json

def parse_keislaman_test():
    doc = pymupdf.open('modul/Keislaman 54-61.pdf')
    os.makedirs('public/soal-images/keislaman', exist_ok=True)
    
    # Collect all items per page in geometric order
    page_items = []
    
    for pno in range(len(doc)):
        page = doc[pno]
        items = []
        
        # 1. Blocks
        for b in page.get_text('blocks'):
            txt = b[4].strip()
            if not txt:
                continue
            if any(h in txt for h in ['MATERI UJIAN SNPDB', 'MATA UJI', 'Version 1.0', 'Pengawas Ruang', 'UIN Sunan Ampel']):
                continue
            items.append({
                'type': 'text',
                'y0': b[1],
                'y1': b[3],
                'x0': b[0],
                'x1': b[2],
                'text': txt
            })
            
        # 2. Images
        for img in page.get_images():
            xref = img[0]
            bimg = doc.extract_image(xref)
            rects = page.get_image_rects(xref)
            if not rects:
                continue
            r = rects[0]
            # Ignore watermark and tiny logos
            if bimg['width'] == 559 and bimg['height'] == 447:
                continue
            if r.y1 < 170 and bimg['width'] < 400:
                continue
            if bimg['width'] < 100 or bimg['height'] < 60:
                continue
                
            # Save image
            img_filename = f"keislaman_p{pno+1}_x{xref}_{bimg['width']}x{bimg['height']}.{bimg['ext']}"
            img_path = os.path.join('public/soal-images/keislaman', img_filename)
            if not os.path.exists(img_path):
                with open(img_path, 'wb') as f:
                    f.write(bimg['image'])
                    
            items.append({
                'type': 'image',
                'y0': r.y0,
                'y1': r.y1,
                'x0': r.x0,
                'x1': r.x1,
                'src': f"/soal-images/keislaman/{img_filename}",
                'w': bimg['width'],
                'h': bimg['height']
            })
            
        # Sort items geometrically by y0
        items.sort(key=lambda it: it['y0'])
        page_items.append({
            'page': pno + 1,
            'items': items
        })
        
    return page_items

page_data = parse_keislaman_test()

# Now reconstruct questions from stream of items
questions = []
current_q = None
passage_buffer = []

for p in page_data:
    pno = p['page']
    for item in p['items']:
        if item['type'] == 'image':
            img_md = f"![Ilustrasi]({item['src']})"
            if current_q:
                # Add image to current question if it doesn't have options yet
                if not current_q['options']:
                    current_q['text_parts'].append(img_md)
                else:
                    passage_buffer.append(img_md)
            else:
                passage_buffer.append(img_md)
        else:
            text = item['text']
            # Check if this text starts a question, e.g. "1. Setelah mendapat...", "10. Perhatikan...", "22. Pasangkan..."
            q_match = re.match(r'^(\d+)\.\s*(.*)', text, re.DOTALL)
            if q_match:
                q_num = int(q_match.group(1))
                q_stem = q_match.group(2).strip()
                
                # If we had a current_q, save it
                if current_q:
                    questions.append(current_q)
                    
                full_text_parts = []
                if passage_buffer:
                    full_text_parts.extend(passage_buffer)
                    passage_buffer = []
                if q_stem:
                    full_text_parts.append(q_stem)
                    
                current_q = {
                    'num': q_num,
                    'text_parts': full_text_parts,
                    'options': {},
                    'page': pno
                }
            else:
                # Check for options like (A) ... (B) ... or A. ...
                # Or regular text continuation
                opt_matches = list(re.finditer(r'(?:^|\n)\s*\(?([A-E])\)[\.\s]+([^\n]+(?:\n(?!\(?[A-E]\)[\.\s])(?!\d+\.)[^\n]+)*)', text))
                if opt_matches and current_q:
                    for om in opt_matches:
                        opt_key = om.group(1).upper()
                        opt_val = om.group(2).strip().replace('\n', ' ')
                        current_q['options'][opt_key] = opt_val
                elif current_q and not current_q['options']:
                    current_q['text_parts'].append(text)
                else:
                    passage_buffer.append(text)

if current_q:
    questions.append(current_q)

print(f"Total parsed questions: {len(questions)}")
for q in questions:
    opts_str = " ".join([f"({k}) {v[:25]}..." for k, v in q['options'].items()])
    has_img = any('![' in t for t in q['text_parts'])
    print(f"Q{q['num']} (P{q['page']}, img={has_img}, opts={len(q['options'])}): {' '.join(q['text_parts'])[:70]} | {opts_str}")
