import fitz # PyMuPDF
import os

pdf_path = os.path.join("modul", "Keislaman 54-61.pdf")
doc = fitz.open(pdf_path)

print(f"Total halaman di {pdf_path}: {len(doc)}")

for page_idx in range(len(doc)):
    page = doc[page_idx]
    image_list = page.get_images(full=True)
    text = page.get_text()
    first_line = text.split("\n")[0] if text else "KOSONG"
    print(f"Halaman {page_idx + 1}: {len(image_list)} gambar | {len(text)} karakter teks | Awalan: {first_line[:50]}")

    for img_idx, img in enumerate(image_list):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        print(f"   -> Gambar {img_idx + 1}: {base_image['width']}x{base_image['height']} ({image_ext}) - {len(image_bytes)} bytes")

