import pymupdf

def check_boxes(fpath):
    doc = pymupdf.open(fpath)
    total_boxes = 0
    for pno in range(len(doc)):
        page = doc[pno]
        drawings = page.get_drawings()
        # Find rectangles that are question boxes: width > 400 and height > 40 and height < 700
        boxes = []
        for d in drawings:
            r = d['rect']
            if r.width > 450 and 40 < r.height < 750 and r.y0 > 100:
                boxes.append(r)
        total_boxes += len(boxes)
    print(f"{fpath}: detected {total_boxes} question boxes across {len(doc)} pages")

check_boxes('modul/TA MAN-IC Paket 1 11-43.pdf')
check_boxes('modul/TA MAN-PK Paket 1 68-97.pdf')
check_boxes('modul/Tes Akademik Ipa 98-126.pdf')

