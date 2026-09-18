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
        "expected_total": 15
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
        "expected_total": 10
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
        "expected_total": 15
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
        "expected_total": 13
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
        "expected_total": 13
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
        "expected_total": 22
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
        "expected_total": 15
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
        "expected_total": 20
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
        "expected_total": 80
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
        "expected_total": 70
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
        "expected_total": 75
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
        "expected_total": 75
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
        "expected_total": 70
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
        "expected_total": 75
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
        "expected_total": 75
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
        "expected_total": 70
    },
]

# External reading wacana to inject for Bahasa Indonesia & Inggris
INDO_PASSAGES = {
    1: 'Perhatikan kalimat berikut:\n"Pemerintah terus berupaya agar limbah organik dapat dikonversi menjadi sumber energi terbarukan yang bermanfaat bagi masyarakat."',
    2: 'Perhatikan kalimat berikut:\n"Pendidikan karakter sangat penting ditanamkan sejak dini [...] membentuk generasi yang cerdas, berakhlak mulia, [...] memiliki empati terhadap sesama."',
    3: '[BACAAN UNTUK SOAL NO. 3 - 5]\nPerkembangan Transaksi Keuangan Digital di Indonesia:\n(1) Penggunaan internet dan telepon seluler pintar di era modern saat ini semakin mempermudah akses masyarakat terhadap berbagai kebutuhan harian, termasuk transaksi perbankan dan keuangan. (2) Sebagian besar masyarakat di wilayah perkotaan maupun pedesaan kini telah beralih menggunakan pembayaran non-tunai melalui Quick Response Code (QRIS) dan dompet digital. (3) Bank Indonesia selaku bank sentral terus memperkuat dan memperketat regulasi standar pembayaran guna menjamin keamanan transaksi digital dari ancaman siber. (4) Namun, anak-anak usia dini sebaiknya tidak dibiarkan bermain gawai tanpa pengawasan orang tua. (5) Kehadiran uang elektronik pada akhirnya telah menjadi bagian tak terpisahkan dari denyut nadi perekonomian masyarakat modern.',
    4: '[BACAAN UNTUK SOAL NO. 3 - 5]\nPerkembangan Transaksi Keuangan Digital di Indonesia:\n(1) Penggunaan internet dan telepon seluler pintar di era modern saat ini semakin mempermudah akses masyarakat terhadap berbagai kebutuhan harian, termasuk transaksi perbankan dan keuangan. (2) Sebagian besar masyarakat di wilayah perkotaan maupun pedesaan kini telah beralih menggunakan pembayaran non-tunai melalui Quick Response Code (QRIS) dan dompet digital. (3) Bank Indonesia selaku bank sentral terus memperkuat dan memperketat regulasi standar pembayaran guna menjamin keamanan transaksi digital dari ancaman siber. (4) Namun, anak-anak usia dini sebaiknya tidak dibiarkan bermain gawai tanpa pengawasan orang tua. (5) Kehadiran uang elektronik pada akhirnya telah menjadi bagian tak terpisahkan dari denyut nadi perekonomian masyarakat modern.',
    5: '[BACAAN UNTUK SOAL NO. 3 - 5]\nPerkembangan Transaksi Keuangan Digital di Indonesia:\n(1) Penggunaan internet dan telepon seluler pintar di era modern saat ini semakin mempermudah akses masyarakat terhadap berbagai kebutuhan harian, termasuk transaksi perbankan dan keuangan. (2) Sebagian besar masyarakat di wilayah perkotaan maupun pedesaan kini telah beralih menggunakan pembayaran non-tunai melalui Quick Response Code (QRIS) dan dompet digital. (3) Bank Indonesia selaku bank sentral terus memperkuat dan memperketat regulasi standar pembayaran guna menjamin keamanan transaksi digital dari ancaman siber. (4) Namun, anak-anak usia dini sebaiknya tidak dibiarkan bermain gawai tanpa pengawasan orang tua. (5) Kehadiran uang elektronik pada akhirnya telah menjadi bagian tak terpisahkan dari denyut nadi perekonomian masyarakat modern.',
    6: '[BACAAN UNTUK SOAL NO. 6 - 8]\nPotensi dan Keunggulan Energi Geotermal (Panas Bumi):\nEnergi panas bumi (geotermal) merupakan salah satu sumber energi terbarukan yang sangat melimpah di Indonesia karena posisi geografisnya yang dilalui jalur cincin api pasifik (ring of fire). Pemanfaatan energi geotermal memiliki keunggulan signifikan dibandingkan bahan bakar fosil. Energi ini ramah lingkungan karena proses pembangkitannya tidak menghasilkan emisi karbon yang merusak lapisan ozon. Selain itu, pasokan energi panas bumi bersifat konstan sepanjang musim dan tidak bergantung pada cuaca layaknya tenaga angin atau surya. [...bagian rumpang...] Pemerintah bersama BUMN terus mendorong program Gerakan Energi Bersih dan Indonesia Menabung guna mempercepat transisi energi hijau nasional.',
    7: '[BACAAN UNTUK SOAL NO. 6 - 8]\nPotensi dan Keunggulan Energi Geotermal (Panas Bumi):\nEnergi panas bumi (geotermal) merupakan salah satu sumber energi terbarukan yang sangat melimpah di Indonesia karena posisi geografisnya yang dilalui jalur cincin api pasifik (ring of fire). Pemanfaatan energi geotermal memiliki keunggulan signifikan dibandingkan bahan bakar fosil. Energi ini ramah lingkungan karena proses pembangkitannya tidak menghasilkan emisi karbon yang merusak lapisan ozon. Selain itu, pasokan energi panas bumi bersifat konstan sepanjang musim dan tidak bergantung pada cuaca layaknya tenaga angin atau surya. [...bagian rumpang...] Pemerintah bersama BUMN terus mendorong program Gerakan Energi Bersih dan Indonesia Menabung guna mempercepat transisi energi hijau nasional.',
    8: '[BACAAN UNTUK SOAL NO. 6 - 8]\nPotensi dan Keunggulan Energi Geotermal (Panas Bumi):\nEnergi panas bumi (geotermal) merupakan salah satu sumber energi terbarukan yang sangat melimpah di Indonesia karena posisi geografisnya yang dilalui jalur cincin api pasifik (ring of fire). Pemanfaatan energi geotermal memiliki keunggulan signifikan dibandingkan bahan bakar fosil. Energi ini ramah lingkungan karena proses pembangkitannya tidak menghasilkan emisi karbon yang merusak lapisan ozon. Selain itu, pasokan energi panas bumi bersifat konstan sepanjang musim dan tidak bergantung pada cuaca layaknya tenaga angin atau surya. [...bagian rumpang...] Pemerintah bersama BUMN terus mendorong program Gerakan Energi Bersih dan Indonesia Menabung guna mempercepat transisi energi hijau nasional.',
    9: '[BACAAN UNTUK SOAL NO. 9 - 10]\nKutipan Cerpen "Pulang Menjenguk Ayah":\nDengan malas kuhubungi biro travel langganan Yu Ning. Entah mengapa aku tidak merasa kecewa saat operator memberitahukan bahwa tiket untuk jadwal petang ini telah habis terjual. Tiba-tiba di sudut hatiku yang paling dalam menyelinap rasa bersalah yang teramat perih. Aku dan Yu Ning selama ini terlalu sibuk mengejar karier dan kehidupan masing-masing di kota besar, hingga selalu lupa bahwa di kampung halaman ada seorang ayah tua yang terus menunggu kepulangan kami dengan penuh kerinduan. Aku tahu hidup terus berjalan dan setiap anak pasti mencari sarangnya yang baru, tetapi melupakan baktiku kepada ayah adalah kekeliruan yang tak termaafkan.',
    10: '[BACAAN UNTUK SOAL NO. 9 - 10]\nKutipan Cerpen "Pulang Menjenguk Ayah":\nDengan malas kuhubungi biro travel langganan Yu Ning. Entah mengapa aku tidak merasa kecewa saat operator memberitahukan bahwa tiket untuk jadwal petang ini telah habis terjual. Tiba-tiba di sudut hatiku yang paling dalam menyelinap rasa bersalah yang teramat perih. Aku dan Yu Ning selama ini terlalu sibuk mengejar karier dan kehidupan masing-masing di kota besar, hingga selalu lupa bahwa di kampung halaman ada seorang ayah tua yang terus menunggu kepulangan kami dengan penuh kerinduan. Aku tahu hidup terus berjalan dan setiap anak pasti mencari sarangnya yang baru, tetapi melupakan baktiku kepada ayah adalah kekeliruan yang tak termaafkan.'
}

INGG_PASSAGES = {
    1: '[READING PASSAGE FOR QUESTIONS NO. 1 - 3]\nEvaluating Digital Information in the Modern Age:\nIn today\'s interconnected world, discerning credible information from misinformation has become an indispensable life skill. Not every article published on social media or search engines can be trusted as factual. When conducting research or reading online news, critical thinkers must look for specific indicators of validity. A reliable source typically provides a verifiable author with relevant credentials, clearly lists the exact date of publication or latest update, cites empirical data or trusted references, and presents content with an objective tone rather than emotionally charged sensationalism.',
    2: '[READING PASSAGE FOR QUESTIONS NO. 1 - 3]\nEvaluating Digital Information in the Modern Age:\nIn today\'s interconnected world, discerning credible information from misinformation has become an indispensable life skill. Not every article published on social media or search engines can be trusted as factual. When conducting research or reading online news, critical thinkers must look for specific indicators of validity. A reliable source typically provides a verifiable author with relevant credentials, clearly lists the exact date of publication or latest update, cites empirical data or trusted references, and presents content with an objective tone rather than emotionally charged sensationalism.',
    3: '[READING PASSAGE FOR QUESTIONS NO. 1 - 3]\nEvaluating Digital Information in the Modern Age:\nIn today\'s interconnected world, discerning credible information from misinformation has become an indispensable life skill. Not every article published on social media or search engines can be trusted as factual. When conducting research or reading online news, critical thinkers must look for specific indicators of validity. A reliable source typically provides a verifiable author with relevant credentials, clearly lists the exact date of publication or latest update, cites empirical data or trusted references, and presents content with an objective tone rather than emotionally charged sensationalism.',
    4: '[READING PASSAGE FOR QUESTIONS NO. 4 - 6]\nLife in the Boarding School Dormitory:\nLiving in an Islamic boarding school (madrasah asrama) requires students to adhere to a structured daily routine. Every student is assigned a specific schedule for waking up before dawn, performing congregational prayers, memorizing verses of the holy Quran, and maintaining cleanliness in their shared rooms. Once in a while, some students bring homemade delicacies prepared by their families to share with their dorm mates, fostering a strong sense of brotherhood and empathy that lasts well beyond their academic years.'
}

def clean_spacing(s):
    if not s:
        return ""
    return re.sub(r'\s+', ' ', s).strip()

def extract_options_smart(text, page_images, block_y0):
    """
    Extracts options A-E from text and matches option images if text is empty.
    """
    options = {}
    
    # Split text on options delimiter
    # Supports: (A), (B), A., B., and Arabic harakat attached directly
    pattern = re.compile(r'(?:^|\n|\s+)(?:\(([A-E])\)|([A-E])\.)[\s\u064B-\u0652\u0670]*')
    tokens = pattern.split(text)
    
    if len(tokens) > 1 and any(tokens[1::3]):
        i = 1
        while i < len(tokens):
            k = tokens[i] or tokens[i+1]
            val = tokens[i+2] if i+2 < len(tokens) else ""
            if k and k.upper() in ['A', 'B', 'C', 'D', 'E']:
                cleaned_val = clean_spacing(val)
                options[k.upper()] = cleaned_val
            i += 3
            
    # Check if options have image matches
    for k, v in list(options.items()):
        if not v or len(v) == 0:
            # Look for image aligned with this option
            for im in page_images:
                if abs(im['rect'].y0 - block_y0) < 35 and im['rect'].x0 > 25:
                    options[k] = f"![Pilihan {k}]({im['src']})"
                    break
                    
    return options

def parse_exam_master(cfg):
    fpath = cfg["file"]
    slug = cfg["slug"]
    token = cfg["token"]
    is_two_col = cfg["is_two_col"]
    expected_total = cfg["expected_total"]
    
    if not os.path.exists(fpath):
        print(f"File not found: {fpath}")
        return None
        
    doc = pymupdf.open(fpath)
    img_dir = f"public/soal-images/{slug}"
    os.makedirs(img_dir, exist_ok=True)
    
    # Pre-extract all valid images per page
    pages_images = {}
    for pno in range(len(doc)):
        page = doc[pno]
        pages_images[pno] = []
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
            if bimg['width'] < 30 or bimg['height'] < 20:
                continue
                
            fname = f"{slug}_p{pno+1}_x{xref}_{bimg['width']}x{bimg['height']}.{bimg['ext']}"
            fpath_img = os.path.join(img_dir, fname)
            if not os.path.exists(fpath_img):
                with open(fpath_img, 'wb') as f:
                    f.write(bimg['image'])
                    
            pages_images[pno].append({
                'xref': xref,
                'rect': r,
                'src': f"/soal-images/{slug}/{fname}",
                'w': bimg['width'],
                'h': bimg['height']
            })
            
    # Process text blocks per page
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
            
    # Sequential question parsing
    questions = []
    curr_q = None
    expected_num = 1
    buffer_passages = []
    
    q_start_regex = re.compile(r'^(?:Soal\s+nomor\s+)?(\d+)[\.\)]\s*(.*)', re.DOTALL)
    
    for item in stream_items:
        txt = item['text']
        pno = item['pno']
        lines = txt.split('\n')
        first_line = lines[0].strip()
        m = q_start_regex.match(first_line)
        
        # Check if this item is the NEXT sequential question
        if m and int(m.group(1)) == expected_num:
            if curr_q:
                questions.append(curr_q)
                
            q_num = expected_num
            expected_num += 1
            
            q_stem = m.group(2).strip()
            if len(lines) > 1:
                q_stem += "\n" + "\n".join(lines[1:])
                
            full_text_parts = []
            if buffer_passages:
                full_text_parts.extend(buffer_passages)
                buffer_passages = []
            if q_stem:
                full_text_parts.append(q_stem)
                
            curr_q = {
                'number': q_num,
                'page': pno,
                'text_parts': full_text_parts,
                'options': {},
                'y0': item['y0'],
                'pno_idx': pno - 1
            }
        else:
            # Check for options
            p_idx = pno - 1
            page_imgs = pages_images.get(p_idx, [])
            opts = extract_options_smart(txt, page_imgs, item['y0'])
            
            if opts and curr_q:
                for k, v in opts.items():
                    if v:
                        curr_q['options'][k] = v
            elif curr_q and not curr_q['options']:
                curr_q['text_parts'].append(txt)
            else:
                # Potential passage before next question
                is_intro = bool(re.match(r'^(?:Soal|Berdasarkan|Perhatikan|Bacalah|Teks|Informasi|Untuk\s+soal)\b', first_line, re.I))
                if is_intro or not curr_q:
                    buffer_passages.append(txt)
                elif curr_q:
                    # Additional explanation or stimulus
                    curr_q['text_parts'].append(txt)
                    
    if curr_q:
        questions.append(curr_q)
        
    # Associate Stimulus Images to Questions
    # For each question, check what images are in its page area
    for q in questions:
        p_idx = q['pno_idx']
        page_imgs = pages_images.get(p_idx, [])
        for im in page_imgs:
            # Check if this image was already used as an option
            im_used_as_opt = False
            for opt_val in q['options'].values():
                if im['src'] in opt_val:
                    im_used_as_opt = True
                    break
            if not im_used_as_opt:
                # Check if it's already in text_parts
                if not any(im['src'] in t for t in q['text_parts']):
                    # Check vertical proximity or if it's the main stimulus of the page
                    if im['w'] > 120 and im['h'] > 60:
                        # Add stimulus image to question stem
                        q['text_parts'].insert(0, f"![Ilustrasi]({im['src']})")
                        
    # Inject external reading wacana if applicable
    if token == 'IC-INDO':
        for q in questions:
            num = q['number']
            if num in INDO_PASSAGES:
                wacana = INDO_PASSAGES[num]
                # Prepend wacana
                q['text_parts'].insert(0, wacana)
    elif token == 'IC-INGG':
        for q in questions:
            num = q['number']
            if num in INGG_PASSAGES:
                wacana = INGG_PASSAGES[num]
                q['text_parts'].insert(0, wacana)
                
    # Final cleanup & fallback options check
    final_questions = []
    for q in questions:
        q_text = "\n\n".join([clean_spacing(t) if not t.startswith('![') else t for t in q['text_parts'] if t.strip()])
        opts = q['options']
        
        # Check if options are missing, match with any remaining images on the page
        if not opts.get('A'):
            p_idx = q['pno_idx']
            page_imgs = pages_images.get(p_idx, [])
            if len(page_imgs) >= 4:
                # Options are likely the 4 images
                opts['A'] = f"![Pilihan A]({page_imgs[0]['src']})"
                opts['B'] = f"![Pilihan B]({page_imgs[1]['src']})"
                opts['C'] = f"![Pilihan C]({page_imgs[2]['src']})"
                opts['D'] = f"![Pilihan D]({page_imgs[3]['src']})"
            else:
                opts['A'] = "Pilihan A"
                opts['B'] = "Pilihan B"
                opts['C'] = "Pilihan C"
                opts['D'] = "Pilihan D"
                
        opt_a = opts.get('A', 'Pilihan A')
        opt_b = opts.get('B', 'Pilihan B')
        opt_c = opts.get('C', 'Pilihan C')
        opt_d = opts.get('D', 'Pilihan D')
        opt_e = opts.get('E', None)
        
        final_questions.append({
            'questionNumber': q['number'],
            'questionText': q_text,
            'optionA': opt_a,
            'optionB': opt_b,
            'optionC': opt_c,
            'optionD': opt_d,
            'optionE': opt_e,
            'correctAnswer': 'A',
            'subject': cfg['subject'],
            'points': 5 if 'Analitik' in cfg['subject'] or 'Akademik' in cfg['subject'] else 4,
            'page': q['page']
        })
        
    result = {
        'config': cfg,
        'total_questions': len(final_questions),
        'questions': final_questions
    }
    
    out_file = os.path.join(OUTPUT_DIR, f"{slug}.json")
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
        
    dummy_cnt = sum(1 for q in final_questions if q['optionA'] == 'Pilihan A')
    img_cnt = sum(1 for q in final_questions if '![' in q['questionText'] or '![' in q['optionA'])
    print(f"[{token:<18}] {len(final_questions):<3} Q (Expected {expected_total}) | Dummies: {dummy_cnt:<2} | Imgs: {img_cnt:<2} | {cfg['title']}")
    return result

if __name__ == '__main__':
    print("Executing Master Extractor for all 16 Exams...\n")
    for c in CONFIGS:
        parse_exam_master(c)
    print("\nMaster Extraction Complete!")
