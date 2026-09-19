import pymupdf
import glob
import os

configs = [
    ("modul/Bahasa Arab 2-4.pdf", "bahasa_arab"),
    ("modul/Bahasa Indonesia 5-6.pdf", "bahasa_indonesia"),
    ("modul/Bahasa Inggris 7-10.pdf", "bahasa_inggris"),
    ("modul/IPA 44-48.pdf", "ipa"),
    ("modul/IPS 49-53.pdf", "ips"),
    ("modul/Keislaman 54-61.pdf", "keislaman"),
    ("modul/Matematika 62-67.pdf", "matematika"),
    ("modul/Kemampuan Analitik 266-271.pdf", "kemampuan_analitik"),
    ("modul/TA MAN-IC Paket 1 11-43.pdf", "ta_man_ic_paket_1"),
    ("modul/TA MAN-PK Paket 1 68-97.pdf", "ta_man_pk_paket_1"),
    ("modul/Tes Akademik Ipa 98-126.pdf", "snpdb_2021_ipa"),
    ("modul/Tes Akademik Ips 127-156.pdf", "snpdb_2021_ips"),
    ("modul/Tes Keislaman 157-181.pdf", "snpdb_2021_keislaman"),
    ("modul/Tes Akademik Ipa 182-210.pdf", "snpdb_2022_ipa"),
    ("modul/Tes Akademik Ips 211-240.pdf", "snpdb_2022_ips"),
    ("modul/Tes Keislaman 241-265.pdf", "snpdb_2022_keislaman"),
]

with open("scripts/visual_instances_result.txt", "w", encoding="utf-8") as out:
    for fpath, slug in configs:
        doc = pymupdf.open(fpath)
        total_imgs = 0
        out.write(f"\n{'='*50}\n=== {slug} ({len(doc)} pages) ===\n")
        for pno in range(len(doc)):
            page = doc[pno]
            seen_boxes = []
            for img in page.get_images():
                xref = img[0]
                bimg = doc.extract_image(xref)
                w, h = bimg['width'], bimg['height']
                if w == 559 and h == 447:
                    continue
                for r in page.get_image_rects(xref):
                    # header/watermark filter
                    if pno == 0 and r.y1 <= 170:
                        continue
                    if slug == 'kemampuan_analitik':
                        continue
                    if r.y1 <= 125 and w > 500 and h < 250:
                        continue
                    if w < 30 or h < 20:
                        continue
                    box = (round(r.x0, 1), round(r.y0, 1), round(r.x1, 1), round(r.y1, 1))
                    if any(abs(b[0]-box[0])<2 and abs(b[1]-box[1])<2 and abs(b[2]-box[2])<2 and abs(b[3]-box[3])<2 for b in seen_boxes):
                        continue
                    seen_boxes.append(box)
                    total_imgs += 1
                    out.write(f"  P{pno+1}: box=[y0={r.y0:.1f}, y1={r.y1:.1f}, x0={r.x0:.1f}, x1={r.x1:.1f}] size={w}x{h}\n")
        out.write(f"Total visual images in {slug}: {total_imgs}\n")

print("Done! Check scripts/visual_instances_result.txt")
