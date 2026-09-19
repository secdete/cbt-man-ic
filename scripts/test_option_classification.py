import pymupdf
import re

def test_option_classification(fpath):
    doc = pymupdf.open(fpath)
    print(f"\n=== Testing {fpath} ===")
    for pno in range(len(doc)):
        page = doc[pno]
        imgs = page.get_images()
        for img in imgs:
            xref = img[0]
            bimg = doc.extract_image(xref)
            if bimg['width'] == 559 and bimg['height'] == 447: continue
            r = page.get_image_rects(xref)[0]
            # check if option image
            is_opt = (r.x0 <= 65 and bimg['width'] <= 350 and bimg['height'] <= 110)
            if is_opt:
                # print
                pass
            elif bimg['width'] > 100 and bimg['height'] > 40:
                print(f"  Page {pno+1}: STIMULUS xref={xref} {bimg['width']}x{bimg['height']} at y0={r.y0:.1f}, y1={r.y1:.1f}, x0={r.x0:.1f}")

test_option_classification('modul/TA MAN-IC Paket 1 11-43.pdf')
test_option_classification('modul/TA MAN-PK Paket 1 68-97.pdf')

