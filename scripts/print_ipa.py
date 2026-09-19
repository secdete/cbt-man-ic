import json

for slug in ['ipa', 'keislaman', 'matematika', 'ta_man_ic_paket_1']:
    with open(f'scripts/extracted_exams/{slug}.json', encoding='utf-8') as f:
        d = json.load(f)
    print(f"=== {slug} ===")
    for q in d['questions'][:6]:
        imgs = [l for l in q['questionText'].split('\n') if '![' in l]
        print(f"  Q#{q['questionNumber']}: {imgs}")

