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
        "use_standalone_num": False,
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
        "use_standalone_num": False,
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
        "use_standalone_num": False,
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
        "use_standalone_num": False,
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
        "use_standalone_num": False,
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
        "use_standalone_num": False,
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
        "use_standalone_num": False,
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
        "use_standalone_num": False,
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
        "use_standalone_num": False,
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
        "use_standalone_num": False,
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
        "use_standalone_num": True,
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
        "use_standalone_num": True,
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
        "use_standalone_num": True,
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
        "use_standalone_num": True,
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
        "use_standalone_num": True,
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
        "use_standalone_num": True,
        "expected_total": 70
    },
]

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

def is_header_or_watermark(slug, pno, bimg, r):
    w, h = bimg['width'], bimg['height']
    if w == 559 and h == 447:
        return True
    if pno == 0 and r.y1 <= 170:
        return True
    if slug == 'kemampuan_analitik':
        return True
    if r.y1 <= 125 and w > 500 and h < 250:
        return True
    return False

def parse_exam_master(cfg):
    fpath = cfg["file"]
    slug = cfg["slug"]
    token = cfg["token"]
    is_two_col = cfg["is_two_col"]
    use_standalone = cfg["use_standalone_num"]
    expected_total = cfg["expected_total"]
    
    if not os.path.exists(fpath):
        print(f"File not found: {fpath}")
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

    # 2. Extract text blocks per page
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
            
    # For Kemampuan Analitik, split embedded question numbers
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

    # 7. Inject External Reading Passages for Indo & Ingg
    if token == 'IC-INDO':
        for q in questions:
            num = q['number']
            if num in INDO_PASSAGES:
                q['text_parts'].insert(0, INDO_PASSAGES[num])
    elif token == 'IC-INGG':
        for q in questions:
            num = q['number']
            if num in INGG_PASSAGES:
                q['text_parts'].insert(0, INGG_PASSAGES[num])

    # 8. Final clean up & export
    final_questions = []
    for q in questions:
        q_text = "\n\n".join([clean_spacing(t) if not t.startswith('![') else t for t in q['text_parts'] if t.strip()])
        opts = q['options']
        
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
    img_cnt = sum(1 for q in final_questions if '![' in q['questionText'] or '![' in (q['optionA'] or ''))
    print(f"[{token:<18}] {len(final_questions):<3} Q (Exp {expected_total}) | Dummies: {dummy_cnt:<2} | Imgs: {img_cnt:<2} | {cfg['title']}")
    return result

if __name__ == '__main__':
    print("Building full extracted dataset with unified stream alignment...\n")
    for c in CONFIGS:
        parse_exam_master(c)
    print("\nDataset extraction finished!")
