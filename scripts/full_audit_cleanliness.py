import glob
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

all_issues = []

for f in sorted(glob.glob('scripts/extracted_exams/*.json')):
    with open(f, 'r', encoding='utf-8') as fp:
        d = json.load(fp)
    slug = d.get('config', {}).get('slug', f)
    questions = d.get('questions', [])
    for q in questions:
        qnum = q['questionNumber']
        stem = q['questionText']
        opts = [q.get(f'option{x}', '') for x in 'ABCDE']
        
        # 1. Check for fraction slash
        if '\u2044' in stem:
            all_issues.append((slug, qnum, 'FRACTION_SLASH_IN_STEM', stem[:100]))
            
        for i, opt in enumerate(opts):
            if opt and '\u2044' in opt:
                all_issues.append((slug, qnum, f'FRACTION_SLASH_IN_OPT_{chr(65+i)}', opt))
                
        # 2. Check for lines that are just numbers (e.g. '1 5', '2', '0 3', '2 2', etc.)
        lines = [l.strip() for l in stem.split('\n') if l.strip()]
        for l in lines:
            if re.match(r'^\d+(\s+\d+)*$', l) and len(l) <= 15:
                # ignore if it's part of a numbered list like '1. Bla bla', but standalone numbers like '1 5', '2', '2 2'
                all_issues.append((slug, qnum, 'ISOLATED_LINE_IN_STEM', l))
                
        # 3. Check for pattern '= /' or '= ⁄'
        if re.search(r'=\s*[\/⁄]', stem):
            all_issues.append((slug, qnum, 'EMPTY_EQUALS_SLASH', re.findall(r'.{0,15}=\s*[\/⁄].{0,15}', stem)))
            
        # 4. Check for incomplete units like 'm /detik' or '15.400 m ' or '1 m beton'
        if re.search(r'0,005\s*m\s*/detik', stem) or re.search(r'15\.400\s*m\s+dan', stem) or re.search(r'1\s*m\s+beton', stem):
            all_issues.append((slug, qnum, 'MISSING_EXPONENT_IN_UNIT', 'm^2 or m^3 missing'))

print(f"Total issue occurrences found: {len(all_issues)}")
for iss in all_issues:
    print(f"[{iss[0]}] Q{iss[1]}: {iss[2]} -> {repr(iss[3])}")

