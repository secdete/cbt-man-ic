import pymupdf

doc = pymupdf.open('modul/Keislaman 54-61.pdf')
page = doc[0]
print('Page 1 rect:', page.rect)
blocks = page.get_text('blocks')
print(f'Total blocks: {len(blocks)}')
for i, b in enumerate(blocks):
    txt = b[4].strip().replace('\n', ' ')
    print(f'Block {i} (bbox={round(b[0],1)}, {round(b[1],1)}, {round(b[2],1)}, {round(b[3],1)}): {txt[:80]}')

imgs = page.get_images()
print('Images on page 1:', len(imgs))
for img in imgs:
    xref = img[0]
    base_img = doc.extract_image(xref)
    print(f'  xref={xref}, ext={base_img["ext"]}, w={base_img["width"]}, h={base_img["height"]}')
    # Get image position on the page
    for img_rect in page.get_image_rects(xref):
        print(f'    rect on page: {img_rect}')

