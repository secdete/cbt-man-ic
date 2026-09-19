import json
import glob

with open("scripts/q3_audit_output.txt", "w", encoding="utf-8") as out:
    out.write("=== CHECKING QUESTION 3 ACROSS ALL 16 EXAMS ===\n")
    for f in sorted(glob.glob('scripts/extracted_exams/*.json')):
        with open(f, encoding='utf-8') as jf:
            d = json.load(jf)
        token = d['config']['token']
        title = d['config']['title']
        q3 = d['questions'][2] if len(d['questions']) >= 3 else None
        if not q3: continue
        imgs = [l for l in q3['questionText'].split('\n') if '![' in l]
        first_text = [l for l in q3['questionText'].split('\n') if not l.startswith('![') and l.strip()][:2]
        out.write(f"\n[{token:<18}] {title}\n")
        out.write(f"  Q3 Stimulus: {imgs}\n")
        out.write(f"  Q3 Text: {' '.join(first_text)[:100]}\n")
        out.write(f"  Q3 Opt A: {q3['optionA'][:60]}\n")

print("Audit written to scripts/q3_audit_output.txt")

