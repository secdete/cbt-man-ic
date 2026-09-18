import pymupdf
import os

output_dir = os.path.join("public", "soal-images", "keislaman")
os.makedirs(output_dir, exist_ok=True)

pdf_path = os.path.join("modul", "Keislaman 54-61.pdf")
doc = pymupdf.open(pdf_path)

extracted = []
for page_num in range(len(doc)):
    page = doc[page_num]
    images = page.get_images(full=True)
    for img_idx, img in enumerate(images):
        xref = img[0]
        base_img = doc.extract_image(xref)
        img_bytes = base_img["image"]
        img_ext = base_img["ext"]
        w = base_img["width"]
        h = base_img["height"]
        # Abaikan gambar watermark/logo kecil jika ada (misal < 50x50)
        if w > 80 and h > 80:
            filename = f"keislaman_p{page_num + 1}_img{img_idx + 1}_{w}x{h}.{img_ext}"
            filepath = os.path.join(output_dir, filename)
            with open(filepath, "wb") as f:
                f.write(img_bytes)
            extracted.append((filename, w, h, len(img_bytes)))

print(f"Berhasil mengekstrak {len(extracted)} gambar:")
for name, w, h, size in extracted:
    print(f"- {name} ({w}x{h}, {size} bytes)")
