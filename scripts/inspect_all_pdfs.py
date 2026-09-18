import pymupdf
import os
import glob

modul_dir = "modul"
pdf_files = sorted(glob.glob(os.path.join(modul_dir, "*.pdf")))

print(f"Ditemukan {len(pdf_files)} berkas PDF di folder modul/:")

for pdf_path in pdf_files:
    filename = os.path.basename(pdf_path)
    if "Modul MAN IC.pdf" in filename:
        continue # Lewati file master lama jika ada
    doc = pymupdf.open(pdf_path)
    total_imgs = 0
    large_imgs = 0
    for page in doc:
        for img in page.get_images(full=True):
            total_imgs += 1
            xref = img[0]
            base_img = doc.extract_image(xref)
            if base_img["width"] > 100 and base_img["height"] > 100:
                large_imgs += 1
    print(f"- {filename} ({len(doc)} hal): {large_imgs} gambar soal (dari {total_imgs} total elemen)")
