import glob
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

for f in sorted(glob.glob('scripts/extracted_exams/*.json')):
    with open(f, 'r', encoding='utf-8') as fp:
        data = json.load(fp)
    slug = data.get('config', {}).get('slug', f)
    questions = data.get('questions', [])
    for q in questions:
        qnum = q.get('questionNumber')
        stem = q.get('questionText', '')
        options = [q.get(f'option{x}', '') for x in ['A', 'B', 'C', 'D', 'E']]
        
        # Check fraction slash
        if '\u2044' in stem:
            print(f"[{slug}] Q{qnum} HAS FRACTION SLASH: {repr(stem[:100])}")
        
        # Check pattern like '1 5' on its own line or in stem
        for line in stem.split('\n'):
            line_str = line.strip()
            if re.match(r'^\d+\s+\d+$', line_str):
                print(f"[{slug}] Q{qnum} ISOLATED NUM LINE: {repr(line_str)}")
                print(f"   Full stem snippet:\n{stem[:200]}")
            if re.search(r'=\s*[\/⁄]', line_str):
                print(f"[{slug}] Q{qnum} EQUALS SLASH: {repr(line_str)}")
                
        for opt in options:
            if not opt:
                continue
            if '\u2044' in opt:
                print(f"[{slug}] Q{qnum} OPT HAS FRACTION SLASH: {repr(opt)}")
            if re.match(r'^\d+\s+\d+$', opt.strip()):
                print(f"[{slug}] Q{qnum} OPT ISOLATED NUM: {repr(opt)}")

