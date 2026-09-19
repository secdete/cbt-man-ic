import pymupdf
import glob
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

for fpath in sorted(glob.glob("modul/*.pdf")):
    doc = pymupdf.open(fpath)
    found_in_pdf = []
    for pno in range(len(doc)):
        p = doc[pno]
        txt = p.get_text('text')
        
        # Check for fraction slash \u2044
        has_slash = '\u2044' in txt
        
        # Check for isolated small numbers like "1 5", "1 2", "3 4", etc. in blocks
        blocks = p.get_text('blocks')
        for b in blocks:
            b_txt = b[4].strip()
            # If block is just numbers with spaces like "1 5" or "1\n5" or "2 3" or similar fraction artifacts
            if re.match(r'^\d+\s+\d+$', b_txt) or re.match(r'^\d+\n\d+$', b_txt):
                found_in_pdf.append((pno + 1, 'ISOLATED_NUM', b_txt, b[0], b[1], b[2], b[3]))
            elif '\u2044' in b_txt:
                found_in_pdf.append((pno + 1, 'FRACTION_SLASH', b_txt[:60].replace('\n', ' '), b[0], b[1], b[2], b[3]))
            elif re.search(r'=\s*[\/⁄]\s*[A-Z]', b_txt):
                found_in_pdf.append((pno + 1, 'EMPTY_SLASH', b_txt[:60].replace('\n', ' '), b[0], b[1], b[2], b[3]))
                
    if found_in_pdf:
        print(f"\n{'='*50}\n=== {fpath} ({len(found_in_pdf)} occurrences) ===")
        for item in found_in_pdf:
            print(f"  P{item[0]}: [{item[1]}] (x0={item[3]:.1f}, y0={item[4]:.1f}): {repr(item[2])}")

