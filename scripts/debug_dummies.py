import json

def debug_exam(json_file, exam_name):
    lines = [f"=== {exam_name} DUMMY OPTIONS ==="]
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for q in data['questions']:
        if q['optionA'] == 'Pilihan A':
            lines.append(f"Q{q['questionNumber']} (P{q['page']}): {repr(q['questionText'][:80])}")
    return "\n".join(lines)

out = []
out.append(debug_exam('scripts/extracted_exams/bahasa_arab.json', 'IC-ARAB'))
out.append(debug_exam('scripts/extracted_exams/ips.json', 'IC-IPS'))
out.append(debug_exam('scripts/extracted_exams/kemampuan_analitik.json', 'IC-ANALITIK'))
out.append(debug_exam('scripts/extracted_exams/ta_man_ic_paket_1.json', 'IC-PAKET1'))

with open('scripts/debug_dummies.txt', 'w', encoding='utf-8') as f:
    f.write("\n\n".join(out))

print("Wrote debug_dummies.txt")
