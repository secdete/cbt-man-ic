import pymupdf
import sys

sys.stdout.reconfigure(encoding='utf-8')

def inspect_page(pdf_path, pno):
    doc = pymupdf.open(pdf_path)
    p = doc[pno]
    d = p.get_text('dict')
    print(f"\n{'='*60}\n{pdf_path} Page {pno+1}")
    for b in d['blocks']:
        if 'lines' in b:
            for l in b['lines']:
                line_str = ''.join([s['text'] for s in l['spans']])
                bbox_str = [round(x, 1) for x in l['bbox']]
                print(f"Line {bbox_str}: {repr(line_str)}")
                for s in l['spans']:
                    s_bbox = [round(x, 1) for x in s['bbox']]
                    print(f"   span {s_bbox} (sz={s['size']:.1f}, font={s['font']}): {repr(s['text'])}")

inspect_page('modul/Tes Akademik Ipa 182-210.pdf', 1)
inspect_page('modul/Tes Akademik Ipa 182-210.pdf', 2)
inspect_page('modul/Tes Akademik Ipa 182-210.pdf', 3)
inspect_page('modul/Tes Akademik Ipa 182-210.pdf', 4)
