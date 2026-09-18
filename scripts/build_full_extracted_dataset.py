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
    # Watermark background
    if w == 559 and h == 447:
        return True
    # First page header logos (UIN Sunan Ampel, Kemenag, Cakrawala)
    if pno == 0 and r.y1 <= 170:
        return True
    # Kemampuan Analitik: strictly pure text, all images are header letterheads or logos
    if slug == 'kemampuan_analitik':
        return True
    # General page header letterhead across exams (e.g. PT Indo Prestasi Utama banner)
    if r.y1 <= 125 and w > 500 and h < 250:
        return True
    return False

def extract_options_smart(text, page_images, block_y0):
    options = {}
    pattern = re.compile(r'(?:^|\n|\s+)(?:\(([A-E])\)|([A-E])\.)[\.\s\u064B-\u065F\u0670]*([^\n]+(?:\n(?!(?:\(([A-E])\)|([A-E])\.)[\.\s\u064B-\u065F\u0670]*)(?!\d+[\.\)])[^\n]+)*)?')
    matches = list(pattern.finditer(text))
    if matches:
        for m in matches:
            k = m.group(1) or m.group(2)
            if k and k.upper() in ['A', 'B', 'C', 'D', 'E']:
                val = m.group(3) if m.group(3) else ""
                options[k.upper()] = clean_spacing(val)
                
    # If option text is empty, check for an image directly aligned with this option
    for k, v in list(options.items()):
        if not v or len(v) == 0:
            for im in page_images:
                if abs(im['y0'] - block_y0) < 35 and im['x0'] > 25:
                    options[k] = f"![Pilihan {k}]({im['src']})"
                    im['is_option'] = True
                    break
    return options

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
    
    # 1. Extract valid images per page with deduplication
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
            if is_header_or_watermark(slug, pno, bimg, r):
                continue
            if bimg['width'] < 30 or bimg['height'] < 20:
                continue
                
            # Deduplicate duplicate image xrefs on same page
            is_dup = False
            for existing in pages_images[pno]:
                if abs(existing['w'] - bimg['width']) < 2 and abs(existing['h'] - bimg['height']) < 2 and abs(existing['y0'] - r.y0) < 5:
                    is_dup = True
                    break
            if is_dup:
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
                'h': bimg['height'],
                'y0': r.y0,
                'y1': r.y1,
                'x0': r.x0,
                'x1': r.x1,
                'is_option': False
            })
            
    # 2. Process text blocks per page
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
            
    # For Kemampuan Analitik, split blocks containing embedded question numbers
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

    # 3. Sequential question parsing
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
        
        # Check passage intro
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
            page_imgs = pages_images.get(p_idx, [])
            opts = extract_options_smart(txt, page_imgs, item['y0'])
            
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
        
    # 4. Filter out any option images across all pages
    for p_idx, page_imgs in pages_images.items():
        for im in page_imgs:
            for q in questions:
                if any(im['src'] in opt_val for opt_val in q['options'].values()):
                    im['is_option'] = True
                    break

    # 5. Associate Stimulus Images to Questions with Strict Spatial Intervals
    page_to_questions = {}
    for q in questions:
        p = q['pno_idx']
        page_to_questions.setdefault(p, []).append(q)
        
    for p_idx, q_list in page_to_questions.items():
        page_imgs = pages_images.get(p_idx, [])
        content_imgs = [im for im in page_imgs if not im['is_option'] and im['w'] > 60 and im['h'] > 30]
        if not content_imgs:
            continue
            
        q_list_sorted = sorted(q_list, key=lambda q: q['y0'])
        
        for im in content_imgs:
            im_y0 = im['y0']
            im_y1 = im['y1']
            
            # Rule 1: Above first question on the page
            if im_y1 <= q_list_sorted[0]['y0'] + 30:
                target_q = q_list_sorted[0]
            else:
                target_q = None
                for i in range(len(q_list_sorted)):
                    q_cur = q_list_sorted[i]
                    q_next = q_list_sorted[i+1] if i + 1 < len(q_list_sorted) else None
                    
                    if q_next is None:
                        # After last question start
                        if im_y0 > q_cur['y1_end'] + 20:
                            next_num = q_cur['number'] + 1
                            cand = [q for q in questions if q['number'] == next_num]
                            target_q = cand[0] if cand else q_cur
                        else:
                            target_q = q_cur
                        break
                    else:
                        if im_y0 < q_next['y0']:
                            # Image sits between q_cur and q_next.
                            # If it ends right before or at q_next, it's the stimulus for q_next!
                            if im_y1 >= q_next['y0'] - 15:
                                target_q = q_next
                            elif im_y0 >= q_cur['y1_end'] - 20:
                                target_q = q_next
                            else:
                                target_q = q_cur
                            break
                            
            if target_q:
                # Check for passage range "Soal nomor X - Y"
                range_match = None
                for t in target_q['text_parts']:
                    m_rng = re.search(r'Soal\s+(?:nomor|no)\s+(\d+)\s*-\s*(\d+)', t, re.I)
                    if m_rng:
                        range_match = (int(m_rng.group(1)), int(m_rng.group(2)))
                        break
                        
                if range_match:
                    start_rng, end_rng = range_match
                    for q_cand in q_list_sorted:
                        if start_rng <= q_cand['number'] <= end_rng:
                            if not any(im['src'] in t for t in q_cand['text_parts']):
                                q_cand['text_parts'].insert(0, f"![Ilustrasi]({im['src']})")
                else:
                    if not any(im['src'] in t for t in target_q['text_parts']):
                        target_q['text_parts'].insert(0, f"![Ilustrasi]({im['src']})")

    # 6. Inject External Reading Wacana for Indo & Ingg
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
                
    # 7. Final cleanup & fallback options check
    final_questions = []
    for q in questions:
        q_text = "\n\n".join([clean_spacing(t) if not t.startswith('![') else t for t in q['text_parts'] if t.strip()])
        opts = q['options']
        
        # If options are still empty for visual questions (e.g. geometric diagrams)
        if not opts.get('A'):
            p_idx = q['pno_idx']
            page_imgs = pages_images.get(p_idx, [])
            opt_cand = [im for im in page_imgs if im['is_option']]
            if len(opt_cand) >= 4:
                opts['A'] = f"![Pilihan A]({opt_cand[0]['src']})"
                opts['B'] = f"![Pilihan B]({opt_cand[1]['src']})"
                opts['C'] = f"![Pilihan C]({opt_cand[2]['src']})"
                opts['D'] = f"![Pilihan D]({opt_cand[3]['src']})"
                
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
    print("Building full extracted dataset with rigorous spatial image alignment...\n")
    for c in CONFIGS:
        parse_exam_master(c)
    print("\nDataset extraction finished!")
