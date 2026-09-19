import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/extracted_exams/snpdb_2022_ipa.json', 'r', encoding='utf-8') as fp:
    d = json.load(fp)

for q in d['questions']:
    if q['questionNumber'] in [3, 4, 7, 8, 10, 12, 13]:
        print(f"\n{'='*50}\n=== Question {q['questionNumber']} ===")
        print(q['questionText'])
        print("\nOptions:")
        for opt in ['A', 'B', 'C', 'D', 'E']:
            if q.get(f'option{opt}'):
                print(f"  ({opt}) {q[f'option{opt}']}")

