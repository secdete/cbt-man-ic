import json

files = [
    'scripts/extracted_exams/snpdb_2021_ipa.json',
    'scripts/extracted_exams/snpdb_2021_ips.json',
    'scripts/extracted_exams/snpdb_2021_keislaman.json',
    'scripts/extracted_exams/snpdb_2022_ipa.json',
    'scripts/extracted_exams/snpdb_2022_ips.json',
    'scripts/extracted_exams/snpdb_2022_keislaman.json'
]

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        d = json.load(f)
    dummies = [q for q in d['questions'] if q['optionA'] == 'Pilihan A']
    print(f"\n{d['config']['token']} Dummies count: {len(dummies)}")
    for q in dummies:
        print(f"  Q{q['questionNumber']} (P{q['page']}): {repr(q['questionText'][:80])}")

