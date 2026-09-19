import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def check_q(exam_slug, qnum):
    fname = f"scripts/extracted_exams/{exam_slug}.json"
    with open(fname, 'r', encoding='utf-8') as fp:
        d = json.load(fp)
    for q in d['questions']:
        if q['questionNumber'] == qnum:
            print(f"\n{'='*50}\n[{exam_slug}] Q{qnum}")
            print("Question Text:\n", q['questionText'])
            print("Options:")
            for opt in ['A', 'B', 'C', 'D', 'E']:
                if q.get(f'option{opt}'):
                    print(f"  ({opt}) {q[f'option{opt}']}")

targets = [
    ('snpdb_2021_ipa', 19),
    ('snpdb_2021_ipa', 27),
    ('snpdb_2021_ipa', 32),
    ('snpdb_2021_ips', 25),
    ('snpdb_2021_ips', 28),
    ('snpdb_2022_ipa', 16),
    ('snpdb_2022_ipa', 17),
    ('snpdb_2022_ipa', 36),
    ('snpdb_2022_ipa', 37),
    ('snpdb_2022_ips', 34),
    ('snpdb_2022_ips', 48),
    ('snpdb_2022_keislaman', 23),
    ('ta_man_ic_paket_1', 14),
    ('ta_man_pk_paket_1', 14),
]

for slug, qnum in targets:
    check_q(slug, qnum)

