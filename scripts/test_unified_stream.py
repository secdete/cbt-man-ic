import os
import re
import json
import pymupdf
from test_extractor_base import CONFIGS, is_header_or_watermark, clean_spacing

def parse_with_unified_stream(cfg):
    fpath = cfg["file"]
    slug = cfg["slug"]
    token = cfg["token"]
    is_two_col = cfg["is_two_col"]
    use_standalone = cfg["use_standalone_num"]
    expected_total = cfg["expected_total"]
    
    if not os.path.exists(fpath):
        return None
        
    doc = pymupdf.open(fpath)
    img_dir = f"public/soal-images/{slug}"
    os.makedirs(img_dir, exist_ok=True)
    
    # 1. Collect all distinct visual image instances per page
    pages_images = {}
    for pno in range(len(doc)):
        page = doc[pno]
        pages_images[pno] = []
        seen_boxes = []
        for img in page.get_images():
            xref = img[0]
            bimg = doc.extract_image(xref)
            w, h = bimg['width'], bimg['height']
            if w == 559 and h == 447:
                continue
            rects = page.get_image_rects(xref)
            for r_idx, r in enumerate(rects):
                if is_header_or_watermark(slug, pno, bimg, r):
                    continue
                if w < 30 or h < 20:
                    continue
                box = (round(r.x0, 1), round(r.y0, 1), round(r.x1, 1), round(r.y1, 1))
                if any(abs(b[0]-box[0])<2 and abs(b[1]-box[1])<2 and abs(b[2]-box[2])<2 and abs(b[3]-box[3])<2 for b in seen_boxes):
                    continue
                seen_boxes.append(box)
                
                fname = f"{slug}_p{pno+1}_x{xref}_r{r_idx}_{w}x{h}.{bimg['ext']}"
                fpath_img = os.path.join(img_dir, fname)
                if not os.path.exists(fpath_img):
                    with open(fpath_img, 'wb') as f:
                        f.write(bimg['image'])
                        
                pages_images[pno].append({
                    'type': 'IMG',
                    'pno': pno + 1,
                    'pno_idx': pno,
                    'xref': xref,
                    'r_idx': r_idx,
                    'rect': r,
                    'src': f"/soal-images/{slug}/{fname}",
                    'w': w,
                    'h': h,
                    'y0': r.y0,
                    'y1': r.y1,
                    'x0': r.x0,
                    'x1': r.x1,
                    'is_option': False
                })
        pages_images[pno].sort(key=lambda im: im['y0'])

    # 2. Extract text blocks
    text_stream = []
    for pno in range(len(doc)):
        page = doc[pno]
        w = page.rect.width
        blocks = page.get_text('blocks')
        page_items = []
        for b in blocks:
            txt = b[4].strip()
            if not txt:
                continue
            if any(k in txt for k in [
                'MATERI UJIAN SNPDB', 'MATA UJI', 'Version 1.0', 'Pengawas Ruang',
                'UIN Sunan Ampel', 'DOKUMEN RAHASIA', 'CBT Master Panel', 'NASKAH SOAL TRYOUT'
            ]):
                continue
            page_items.append({
                'type': 'TXT',
                'pno': pno + 1,
                'pno_idx': pno,
                'x0': b[0],
                'y0': b[1],
                'x1': b[2],
                'y1': b[3],
                'text': txt
            })
            
        if is_two_col:
            mid = w / 2
            col1 = [it for it in page_items if it['x0'] < mid]
            col2 = [it for it in page_items if it['x0'] >= mid]
            col1.sort(key=lambda it: it['y0'])
            col2.sort(key=lambda it: it['y0'])
            text_stream.extend(col1 + col2)
        else:
            page_items.sort(key=lambda it: it['y0'])
            text_stream.extend(page_items)
            
    if is_two_col:
        expanded = []
        for it in text_stream:
            txt = it['text']
            parts = re.split(r'(?:^|\n|\s{2,})(\d+[\.\)]\s+)', txt)
            if len(parts) > 2:
                if parts[0].strip():
                    expanded.append({'type': 'TXT', 'pno': it['pno'], 'pno_idx': it['pno_idx'], 'x0': it['x0'], 'y0': it['y0'], 'y1': it['y1'], 'text': parts[0].strip()})
                i = 1
                while i < len(parts):
                    expanded.append({'type': 'TXT', 'pno': it['pno'], 'pno_idx': it['pno_idx'], 'x0': it['x0'], 'y0': it['y0'], 'y1': it['y1'], 'text': parts[i] + parts[i+1].strip()})
                    i += 2
            else:
                expanded.append(it)
        text_stream = expanded

    def extract_opts_smart(txt, p_imgs, block_y0):
        opts = {}
        pattern = re.compile(r'(?:^|\n|\s+)(?:\(([A-E])\)|([A-E])\.)[\.\s\u064B-\u065F\u0670]*([^\n]+(?:\n(?!(?:\(([A-E])\)|([A-E])\.)[\.\s\u064B-\u065F\u0670]*)(?!\d+[\.\)])[^\n]+)*)?')
        matches = list(pattern.finditer(txt))
        if matches:
            for m in matches:
                k = m.group(1) or m.group(2)
                if k and k.upper() in ['A', 'B', 'C', 'D', 'E']:
                    val = m.group(3) if m.group(3) else ""
                    opts[k.upper()] = clean_spacing(val)
                    
        for k, v in list(opts.items()):
            if not v or len(v) == 0:
                for im in p_imgs:
                    if abs(im['y0'] - block_y0) < 40 and im['x0'] > 25:
                        opts[k] = f"![Pilihan {k}]({im['src']})"
                        im['is_option'] = True
                        break
        return opts

    # 3. Identify visual option images in text stream
    for item in text_stream:
        p_imgs = pages_images.get(item['pno_idx'], [])
        extract_opts_smart(item['text'], p_imgs, item['y0'])

    # 4. Build Unified Chronological Stream per page
    unified_stream = []
    if is_two_col:
        unified_stream = text_stream
    else:
        for pno in range(len(doc)):
            combined = [it for it in text_stream if it['pno_idx'] == pno]
            for im in pages_images.get(pno, []):
                if not im['is_option']:
                    combined.append(im)
            combined.sort(key=lambda it: it['y0'])
            unified_stream.extend(combined)

    # 5. Question Parsing
    questions = []
    curr_q = None
    expected_num = 1
    pending_stimulus = []
    buffer_passages = []
    
    for item in unified_stream:
        if item['type'] == 'IMG':
            img_tag = f"![Ilustrasi]({item['src']})"
            if curr_q and not curr_q['options']:
                if img_tag not in curr_q['text_parts']:
                    curr_q['text_parts'].append(img_tag)
            else:
                if img_tag not in pending_stimulus:
                    pending_stimulus.append(img_tag)
            continue
            
        txt = item['text']
        pno = item['pno']
        p_idx = item['pno_idx']
        lines = txt.split('\n')
        first_line = lines[0].strip()
        
        if re.match(r'^Soal\s+(?:nomor|no)\s+\d+\s*-\s*\d+', first_line, re.I):
            buffer_passages.append(txt)
            continue
            
        is_new_q = False
        q_stem = ""
        
        if use_standalone:
            cleaned_standalone = re.sub(r'[\u200e\u200f\u200b\xa0\ufeff\u064B-\u065F\u0670]', '', txt).strip()
            m_num = re.match(r'^(\d+)[\.\)]\s*$', cleaned_standalone)
            if m_num and int(m_num.group(1)) == expected_num:
                is_new_q = True
        else:
            m = re.match(r'^(\d+)[\.\)]\s*(.*)', first_line, re.DOTALL)
            if m and int(m.group(1)) == expected_num:
                is_new_q = True
                q_stem = m.group(2).strip()
                if len(lines) > 1:
                    q_stem += "\n" + "\n".join(lines[1:])
                    
        if is_new_q:
            if curr_q:
                questions.append(curr_q)
                
            q_num = expected_num
            expected_num += 1
            
            full_text_parts = []
            if buffer_passages:
                full_text_parts.extend(buffer_passages)
                buffer_passages = []
            if pending_stimulus:
                full_text_parts.extend(pending_stimulus)
                pending_stimulus = []
            if q_stem:
                full_text_parts.append(q_stem)
                
            curr_q = {
                'number': q_num,
                'page': pno,
                'pno_idx': p_idx,
                'text_parts': full_text_parts,
                'options': {},
                'y0': item['y0'],
                'y1_end': item['y1'],
            }
        else:
            p_imgs = pages_images.get(p_idx, [])
            opts = extract_opts_smart(txt, p_imgs, item['y0'])
            if opts and curr_q:
                for k, v in opts.items():
                    if v:
                        curr_q['options'][k] = v
                curr_q['y1_end'] = max(curr_q['y1_end'], item['y1'])
            elif curr_q and not curr_q['options']:
                curr_q['text_parts'].append(txt)
                curr_q['y1_end'] = max(curr_q['y1_end'], item['y1'])
            else:
                is_intro = bool(re.match(r'^(?:Soal|Berdasarkan|Perhatikan|Bacalah|Teks|Informasi|Untuk\s+soal)\b', first_line, re.I))
                if is_intro or not curr_q:
                    buffer_passages.append(txt)
                elif curr_q:
                    curr_q['text_parts'].append(txt)
                    curr_q['y1_end'] = max(curr_q['y1_end'], item['y1'])

    if curr_q:
        questions.append(curr_q)

    # 6. Check Range Matches (e.g. Soal nomor 3 - 5)
    for q in questions:
        for t in q['text_parts']:
            m_rng = re.search(r'Soal\s+(?:nomor|no)\s+(\d+)\s*-\s*(\d+)', t, re.I)
            if m_rng:
                s_rng, e_rng = int(m_rng.group(1)), int(m_rng.group(2))
                stim_imgs_in_q = [line for line in q['text_parts'] if line.startswith('![Ilustrasi]')]
                for q_target in questions:
                    if s_rng <= q_target['number'] <= e_rng and q_target['number'] != q['number']:
                        for img_tag in stim_imgs_in_q:
                            if img_tag not in q_target['text_parts']:
                                q_target['text_parts'].insert(0, img_tag)

    q_with_imgs = [q for q in questions if any('![' in t for t in q['text_parts'])]
    dummy_cnt = sum(1 for q in questions if not q['options'].get('A'))
    print(f"[{token:<16}] Total Q: {len(questions):<3} | Qs with Stimulus: {len(q_with_imgs):<2} | Dummies: {dummy_cnt:<2} | Exp: {expected_total}")
    return questions

if __name__ == '__main__':
    for c in CONFIGS:
        parse_with_unified_stream(c)
