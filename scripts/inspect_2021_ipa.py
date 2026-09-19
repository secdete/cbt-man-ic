import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/extracted_exams/snpdb_2021_ipa.json', 'r', encoding='utf-8') as fp:
    d = json.load(fp)

for q in d['questions']:
    if q['questionNumber'] in [19, 27, 32]:
        print(f"\n=== Q{q['questionNumber']} ===")
        print(q['questionText'])
        print("Options:")
        for o in 'ABCDE':
            if q.get(f'option{o}'):
                print(f"  ({o}) {q[f'option{o}']}")

