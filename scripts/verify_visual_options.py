import json

def check_paket(slug):
    with open(f'scripts/extracted_exams/{slug}.json', encoding='utf-8') as f:
        d = json.load(f)
    print(f"=== {slug} Questions 70-80 ===")
    for q in d['questions']:
        if q['questionNumber'] >= 70:
            imgs = [l for l in q['questionText'].split('\n') if '![' in l]
            opt_a = q['optionA'][:35]
            print(f"  Q#{q['questionNumber']}: Stimulus={imgs} | OptA={opt_a}")

check_paket('ta_man_ic_paket_1')
check_paket('ta_man_pk_paket_1')

