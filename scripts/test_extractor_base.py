import os
import re
import json
import pymupdf

CONFIGS = [
    {
        "file": "modul/Bahasa Arab 2-4.pdf",
        "slug": "bahasa_arab",
        "token": "IC-ARAB",
        "title": "Tryout SNPDB MAN IC: Bahasa Arab",
        "subject": "Bahasa Arab",
        "category": "SNPDB 2023",
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
        "is_two_col": False,
        "use_standalone_num": True,
        "expected_total": 70
    },
]

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

def clean_spacing(s):
    if not s:
        return ""
    return re.sub(r'\s+', ' ', s).strip()
