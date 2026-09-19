import glob
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

for f in sorted(glob.glob('scripts/extracted_exams/*.json')):
    with open(f, 'r', encoding='utf-8') as fp:
        data = json.load(fp)
    slug = data.get('config', {}).get('slug', f)
    for q in data.get('questions', []):
        qnum = q.get('questionNumber')
        text = q.get('questionText', '')
        # look for two small numbers separated by space e.g. '1 5', '1 8', '1 3', '2 5', etc.
        m = re.findall(r'(?<!\d)([0-9]\s+[0-9])(?!\d)', text)
        if m:
            print(f"[{slug}] Q{qnum}: found isolated pairs {m}")
            for line in text.split('\n'):
                if any(x in line for x in m):
                    print(f"   line: {repr(line)}")

