import json
import glob
import re

files = sorted(glob.glob("scripts/extracted_exams/*.json"))

print("=== CHECKING POTENTIAL MISALIGNMENTS ===")
for fpath in files:
    with open(fpath, "r", encoding="utf-8") as f:
        data = json.load(f)
    slug = data['config']['slug']
    title = data['config']['title']
    questions = data['questions']
    
    issues = []
    for i, q in enumerate(questions):
        num = q['questionNumber']
        text = q['questionText']
        has_img = '![' in text
        has_opt_img = any('![' in (q.get(k) or '') for k in ['optionA', 'optionB', 'optionC', 'optionD', 'optionE'])
        
        # Check if text mentions visual stimulus
        # e.g., "pada gambar", "pada grafik", "pada tabel", "pada diagram", "infografis", "komik", "perhatikan gambar", "perhatikan tabel"
        m_vis = re.search(r'\b(gambar|grafik|tabel|infografis|komik|diagram|peta|denah|bagan|kurva|skema)\b', text, re.I)
        
        # Exclude false positives like "membaca teks", "bacaan di atas"
        if m_vis and not has_img and not has_opt_img:
            # Check if next question has image
            nxt_img = (i + 1 < len(questions)) and ('![' in questions[i+1]['questionText'])
            issues.append((num, q['page'], m_vis.group(1), text[:80].replace('\n', ' '), nxt_img))
            
    if issues:
        print(f"\n{title} ({slug}) - {len(issues)} potential issues:")
        for num, pg, kw, snippet, nxt_img in issues:
            flag = " [NEXT Q HAS IMG!]" if nxt_img else ""
            print(f"  Q{num:<2} (p{pg}) mentions '{kw}' but NO image!{flag} -> {snippet}")
    else:
        print(f"OK: {slug} (0 issues)")

