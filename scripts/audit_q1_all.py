import json
import glob

with open("scripts/q1_audit_output.txt", "w", encoding="utf-8") as out:
    out.write("=== CHECKING QUESTION 1 ACROSS ALL 16 EXAMS ===\n")
    for f in sorted(glob.glob('scripts/extracted_exams/*.json')):
        with open(f, encoding='utf-8') as jf:
            d = json.load(jf)
        token = d['config']['token']
        title = d['config']['title']
        q1 = d['questions'][0]
        imgs = [l for l in q1['questionText'].split('\n') if '![' in l]
        first_text = [l for l in q1['questionText'].split('\n') if not l.startswith('![') and l.strip()][:2]
        out.write(f"\n[{token:<18}] {title}\n")
        out.write(f"  Q1 Stimulus: {imgs}\n")
        out.write(f"  Q1 Text: {' '.join(first_text)[:100]}\n")
        out.write(f"  Q1 Opt A: {q1['optionA'][:60]}\n")

print("Audit written to scripts/q1_audit_output.txt")

