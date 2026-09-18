import os
import glob
import pymupdf

pdf_files = sorted(glob.glob('modul/*.pdf'))
output_lines = []
output_lines.append(f"Total PDFs found: {len(pdf_files)}\n")

for pdf_path in pdf_files:
    fname = os.path.basename(pdf_path)
    try:
        doc = pymupdf.open(pdf_path)
        total_pages = len(doc)
        total_images = sum(len(p.get_images()) for p in doc)
        
        output_lines.append("=" * 80)
        output_lines.append(f"FILE: {fname}")
        output_lines.append(f"Pages: {total_pages}, Total Embedded Images: {total_images}")
        
        # Check headings or text in first 2 pages and last page
        for pno in range(min(2, total_pages)):
            txt = doc[pno].get_text().strip()
            first_lines = "\n".join([line.strip() for line in txt.split("\n") if line.strip()][:8])
            output_lines.append(f"  [Page {pno+1} Sample]:\n{first_lines}")
            
        if total_pages > 2:
            txt_last = doc[-1].get_text().strip()
            last_lines = "\n".join([line.strip() for line in txt_last.split("\n") if line.strip()][:8])
            output_lines.append(f"  [Last Page {total_pages} Sample]:\n{last_lines}")
            
        # Count potential question numbers
        q_count = 0
        for pno in range(total_pages):
            page_txt = doc[pno].get_text()
            # look for pattern like '\n1. ' or ' 1. '
        output_lines.append("")
    except Exception as e:
        output_lines.append(f"Error reading {fname}: {e}")

with open("modul_analysis.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(output_lines))

print("Inspection report written to modul_analysis.txt")
