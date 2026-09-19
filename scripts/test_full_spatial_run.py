import os
import re
import json
import pymupdf
from test_extractor_base import CONFIGS, is_header_or_watermark, clean_spacing

def test_parse_exam(cfg):
    fpath = cfg["file"]
    slug = cfg["slug"]
    token = cfg["token"]
    is_two_col = cfg["is_two_col"]
    use_standalone = cfg["use_standalone_num"]
    expected_total = cfg["expected_total"]
    
    if not os.path.exists(fpath):
        return None
        
    doc = pymupdf.open(fpath)
    
    # 1. Extract valid images per page with discrete bounding box instances
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
                
                pages_images[pno].append({
                    'xref': xref,
                    'r_idx': r_idx,
                    'rect': r,
                    'src': f"/soal-images/{slug}/{slug}_p{pno+1}_x{xref}_r{r_idx}_{w}x{h}.{bimg['ext']}",
                    'w': w,
                    'h': h,
                    'y0': r.y0,
                    'y1': r.y1,
                    'x0': r.x0,
                    'x1': r.x1,
                    'is_option': False
                })
        pages_images[pno].sort(key=lambda im: im['y0'])
        
    # 2. Text stream
    stream_items = []
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
                'pno': pno + 1,
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
            stream_items.extend(col1 + col2)
        else:
            page_items.sort(key=lambda it: it['y0'])
            stream_items.extend(page_items)
            
    if is_two_col:
        expanded = []
        for it in stream_items:
            txt = it['text']
            parts = re.split(r'(?:^|\n|\s{2,})(\d+[\.\)]\s+)', txt)
            if len(parts) > 2:
                if parts[0].strip():
                    expanded.append({'pno': it['pno'], 'x0': it['x0'], 'y0': it['y0'], 'y1': it['y1'], 'text': parts[0].strip()})
                i = 1
                while i < len(parts):
                    expanded.append({'pno': it['pno'], 'x0': it['x0'], 'y0': it['y0'], 'y1': it['y1'], 'text': parts[i] + parts[i+1].strip()})
                    i += 2
            else:
                expanded.append(it)
        stream_items = expanded

    def extract_opts(txt, p_imgs, block_y0):
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

    # 3. Parse questions
    questions = []
    curr_q = None
    expected_num = 1
    buffer_passages = []
    buffer_passages_y0 = None
    
    for item in stream_items:
        txt = item['text']
        pno = item['pno']
        lines = txt.split('\n')
        first_line = lines[0].strip()
        
        if re.match(r'^Soal\s+(?:nomor|no)\s+\d+\s*-\s*\d+', first_line, re.I):
            buffer_passages.append(txt)
            if buffer_passages_y0 is None:
                buffer_passages_y0 = item['y0']
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
                curr_q['y1_end'] = item['y0']
                questions.append(curr_q)
                
            q_num = expected_num
            expected_num += 1
            
            full_text_parts = []
            if buffer_passages:
                full_text_parts.extend(buffer_passages)
                buffer_passages = []
            if q_stem:
                full_text_parts.append(q_stem)
                
            start_y = buffer_passages_y0 if buffer_passages_y0 is not None else item['y0']
            buffer_passages_y0 = None
            
            curr_q = {
                'number': q_num,
                'page': pno,
                'text_parts': full_text_parts,
                'options': {},
                'y0': start_y,
                'y1_end': item['y1'],
                'pno_idx': pno - 1,
                'x0': item['x0']
            }
        else:
            p_idx = pno - 1
            p_imgs = pages_images.get(p_idx, [])
            opts = extract_opts(txt, p_imgs, item['y0'])
            
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
                    if buffer_passages_y0 is None:
                        buffer_passages_y0 = item['y0']
                elif curr_q:
                    curr_q['text_parts'].append(txt)
                    curr_q['y1_end'] = max(curr_q['y1_end'], item['y1'])
                    
    if curr_q:
        questions.append(curr_q)
        
    # Check visual options fallback for any questions whose options are diagrams
    for q in questions:
        if not q['options'].get('A'):
            p_idx = q['pno_idx']
            p_imgs = pages_images.get(p_idx, [])
            opt_cands = [im for im in p_imgs if im['y0'] >= q['y0'] and im['w'] < 300 and im['h'] < 150]
            if len(opt_cands) >= 4:
                opt_cands_sorted = sorted(opt_cands, key=lambda im: im['y0'])[:4]
                q['options']['A'] = f"![Pilihan A]({opt_cands_sorted[0]['src']})"
                q['options']['B'] = f"![Pilihan B]({opt_cands_sorted[1]['src']})"
                q['options']['C'] = f"![Pilihan C]({opt_cands_sorted[2]['src']})"
                q['options']['D'] = f"![Pilihan D]({opt_cands_sorted[3]['src']})"
                for im in opt_cands_sorted:
                    im['is_option'] = True

    # 4. Strict Spatial Assignment of Stimulus Images
    # Map questions by page
    page_to_qs = {}
    for q in questions:
        page_to_qs.setdefault(q['pno_idx'], []).append(q)
        
    for p_idx, p_imgs in pages_images.items():
        stim_imgs = [im for im in p_imgs if not im['is_option'] and (im['w'] >= 60 or im['h'] >= 40)]
        if not stim_imgs:
            continue
            
        qs_on_page = page_to_qs.get(p_idx, [])
        qs_on_page_sorted = sorted(qs_on_page, key=lambda q: q['y0'])
        
        for im in stim_imgs:
            target_q = None
            if not qs_on_page_sorted:
                # No question starts on this page, might belong to next page's first question
                cand = [q for q in questions if q['pno_idx'] == p_idx + 1]
                if cand:
                    target_q = cand[0]
            else:
                # If image is above first question on the page
                if im['y1'] <= qs_on_page_sorted[0]['y0'] + 30:
                    target_q = qs_on_page_sorted[0]
                else:
                    for i in range(len(qs_on_page_sorted)):
                        q_cur = qs_on_page_sorted[i]
                        q_next = qs_on_page_sorted[i+1] if i + 1 < len(qs_on_page_sorted) else None
                        
                        if q_next is None:
                            # Image is after the start of last question on page
                            if im['y0'] > q_cur['y1_end'] + 15:
                                # Sits at bottom of page after question ends -> belongs to next question!
                                cand = [q for q in questions if q['number'] == q_cur['number'] + 1]
                                target_q = cand[0] if cand else q_cur
                            else:
                                target_q = q_cur
                            break
                        else:
                            if im['y0'] < q_next['y0']:
                                # Image sits between q_cur and q_next
                                # If image is within 30px of q_next or after q_cur's options:
                                if im['y1'] >= q_next['y0'] - 20:
                                    target_q = q_next
                                elif im['y0'] >= q_cur['y1_end'] - 20:
                                    target_q = q_next
                                else:
                                    target_q = q_cur
                                break
                                
            if target_q:
                # Check for range match in target_q
                rng_m = None
                for t in target_q['text_parts']:
                    m_rng = re.search(r'Soal\s+(?:nomor|no)\s+(\d+)\s*-\s*(\d+)', t, re.I)
                    if m_rng:
                        rng_m = (int(m_rng.group(1)), int(m_rng.group(2)))
                        break
                if rng_m:
                    s_rng, e_rng = rng_m
                    for q_cand in questions:
                        if s_rng <= q_cand['number'] <= e_rng:
                            if not any(im['src'] in t for t in q_cand['text_parts']):
                                q_cand['text_parts'].insert(0, f"![Ilustrasi]({im['src']})")
                else:
                    if not any(im['src'] in t for t in target_q['text_parts']):
                        target_q['text_parts'].insert(0, f"![Ilustrasi]({im['src']})")

    # Print summary
    q_with_imgs = [q for q in questions if any('![' in t for t in q['text_parts'])]
    print(f"[{token:<16}] Total Q: {len(questions):<3} | Qs with Stimulus: {len(q_with_imgs):<2} | Exp: {expected_total}")
    return questions

if __name__ == '__main__':
    for c in CONFIGS:
        test_parse_exam(c)
