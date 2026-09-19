import os
import glob
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
files = sorted(glob.glob("scripts/extracted_exams/*.json"))

with open("scripts/audit_detail.txt", "w", encoding="utf-8") as out:
    for fpath in files:
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)
        slug = data['config']['slug']
        title = data['config']['title']
        questions = data['questions']
        
        out.write(f"==================================================\n")
        out.write(f"=== {title} ({slug}) - {len(questions)} Qs ===\n")
        
        for q in questions:
            num = q['questionNumber']
            text = q['questionText']
            imgs = re.findall(r'!\[.*?\]\((.*?)\)', text)
            opt_imgs = []
            for k in ['optionA', 'optionB', 'optionC', 'optionD', 'optionE']:
                v = q.get(k)
                if v and '![' in v:
                    opt_imgs.append(k)
                    
            lines = [l.strip() for l in text.split('\n') if l.strip() and not l.startswith('![')]
            first_txt = lines[0][:80] if lines else "NO_TEXT"
            
            img_desc = f"{len(imgs)} stim img(s)" if imgs else "NO stim"
            if opt_imgs:
                img_desc += f", opt imgs in {opt_imgs}"
            out.write(f"  Q{num:<2} (p{q['page']}): [{img_desc:<22}] -> {first_txt}\n")

print("Audit finished, check scripts/audit_detail.txt")
