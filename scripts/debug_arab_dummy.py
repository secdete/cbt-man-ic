import json

with open('scripts/extracted_exams/bahasa_arab.json', 'r', encoding='utf-8') as f:
    arab = json.load(f)

print("=== IC-ARAB DUMMY OPTIONS ===")
for q in arab['questions']:
    if q['optionA'] == 'Pilihan A':
        print(f"Q{q['questionNumber']} (P{q['page']}): {q['questionText'][:100]}")
