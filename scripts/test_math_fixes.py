import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

def clean_math_and_artifacts(slug, q):
    qnum = q['questionNumber']
    stem = q['questionText']
    opts = {k: q.get(f'option{k}', '') for k in ['A', 'B', 'C', 'D', 'E']}

    # 1. Common SNPDB 2022 Math (IPA, IPS, Keislaman)
    if slug in ['snpdb_2022_ipa', 'snpdb_2022_ips', 'snpdb_2022_keislaman']:
        if qnum == 3:
            # Degrees & cubic meters
            stem = re.sub(r'diputar\s+30\s+searah', 'diputar 30° searah', stem)
            stem = re.sub(r'0,005\s*m\s*/detik', '0,005 m³/detik', stem)
            stem = re.sub(r'diputar\s+180\s+searah', 'diputar 180° searah', stem)
            stem = re.sub(r'sebanyak\s*\.\.\.\s*m\s*\.', 'sebanyak ... m³.', stem)
            # Remove isolated '0 3'
            stem = re.sub(r'(?:^|\n)\s*0\s+3\s*(?:\n|$)', '\n', stem)
            
        elif qnum == 4:
            # Fraction 1/5
            stem = re.sub(r'AB\s*=\s*[\/⁄]?\s*AG', 'AB = 1/5 AG', stem)
            stem = re.sub(r'(?:^|\n)\s*1\s+5\s*(?:\n|$)', '\n', stem)
            
        elif qnum == 7:
            # Fraction 1/8
            stem = re.sub(r'Bu\s+Halimah\s+mendapatkan\s*[\/⁄]?\s*bagian', 'Bu Halimah mendapatkan 1/8 bagian', stem)
            stem = re.sub(r'(?:^|\n)\s*1\s+8\s*(?:\n|$)', '\n', stem)
            
        elif qnum == 8:
            # Square meters
            stem = re.sub(r'luas\s+15\.400\s*m\s+dan', 'luas 15.400 m² dan', stem)
            stem = re.sub(r'^\s*2\s*\n+', '', stem)
            
def clean_math_and_artifacts(slug, q):
    qnum = q['questionNumber']
    stem = q['questionText']
    opts = {k: q.get(f'option{k}', '') for k in ['A', 'B', 'C', 'D', 'E']}

    # 1. Common SNPDB 2022 Math (IPA, IPS, Keislaman)
    if slug in ['snpdb_2022_ipa', 'snpdb_2022_ips', 'snpdb_2022_keislaman']:
        if qnum == 3:
            stem = re.sub(r'diputar\s+30\s+searah', 'diputar 30° searah', stem)
            stem = re.sub(r'0,005\s*m\s*/detik', '0,005 m³/detik', stem)
            stem = re.sub(r'diputar\s+180\s+searah', 'diputar 180° searah', stem)
            stem = re.sub(r'sebanyak\s*\.\.\.\s*m\s*\.', 'sebanyak ... m³.', stem)
            stem = re.sub(r'(?:^|\n)\s*0\s+3\s*(?:\n|$)', '\n', stem)
            
        elif qnum == 4:
            stem = re.sub(r'AB\s*=\s*[\/⁄]?\s*AG', 'AB = 1/5 AG', stem)
            stem = re.sub(r'(?:^|\n)\s*1\s+5\s*(?:\n|$)', '\n', stem)
            
        elif qnum == 7:
            stem = re.sub(r'Bu\s+Halimah\s+mendapatkan\s*[\/⁄]?\s*bagian', 'Bu Halimah mendapatkan 1/8 bagian', stem)
            stem = re.sub(r'(?:^|\n)\s*1\s+8\s*(?:\n|$)', '\n', stem)
            
        elif qnum == 8:
            stem = re.sub(r'luas\s+15\.400\s*m\s+dan', 'luas 15.400 m² dan', stem)
            stem = re.sub(r'^\s*2\s*\n+', '', stem)
            
        elif qnum == 10:
            stem = re.sub(r'membuat\s+1\s*m\s+beton', 'membuat 1 m³ beton', stem)
            stem = re.sub(r'adalah\s*\.\.\.\.\s*3?', 'adalah ....', stem)
            stem = re.sub(r'^\s*3\s*\n+', '', stem)
            stem = re.sub(r'\n+\s*3\s*$', '', stem)
            
        elif qnum == 12:
            stem = re.sub(r'Setelah\s+menempuh\s*[\/⁄]?\s*perjalanan', 'Setelah menempuh 1/3 perjalanan', stem)
            stem = re.sub(r'(?:^|\n)\s*1\s+3\s*(?:\n|$)', '\n', stem)
            
        elif qnum == 13:
            stem = 'Relasi berikut yang termasuk fungsi adalah ….'
            opts['A'] = 'f = {(x, y) | x² + y² = 49, -10 ≤ x ≤ 0, y ≥ 0}'
            opts['B'] = 'g = {(x, y) | y = x²⁰²², x, y > 0}'
            opts['C'] = 'h = {(x, y) | x = y², y > 0}'
            opts['D'] = 'k = {(x, y) | y = 2x + (x - 1)², x > 0, y > 0}'

    # 2. SNPDB 2021 IPA
    if slug == 'snpdb_2021_ipa':
        if qnum == 8:
            stem = re.sub(r'^\s*2\s*\n+', '', stem)
            stem = re.sub(r'0,998\s+kali', '0,998² kali', stem)
        elif qnum == 19:
            stem = re.sub(r'(?:^|\n)\s*2\s*(?:\n|$)', '\n', stem)
            opts['C'] = re.sub(r'gas\s+CO(?!\d)', 'gas CO₂', opts['C'])
        elif qnum == 27:
            stem = re.sub(r'5\s*m/s\s+ke', '5 m/s² ke', stem)
            stem = re.sub(r'konstan\s+2(?:\s*\n*\s*2)*\s*m/s\.', 'konstan 2 m/s.', stem)
            stem = re.sub(r'10\s*m/s\s*,', '10 m/s²,', stem)
            stem = re.sub(r'(?:^|\n)\s*2\s*(?:\n|$)', '\n', stem)
        elif qnum == 32:
            stem = re.sub(r'(?:^|\n)\s*2(?:\s+2)*\s*(?:\n|$)', '\n', stem)
            stem = re.sub(r'(?:^|\n)\s*2\s*(?:\n|$)', '\n', stem)
            opts['B'] = re.sub(r'gas\s+O\s+', 'gas O₂ ', opts['B'])
            opts['C'] = re.sub(r'gas\s+CO\s+dan\s+H\s+O\s+gas\s+O', 'gas CO₂ dan H₂O gas O₂', opts['C'])
            opts['D'] = re.sub(r'gas\s+CO$', 'gas CO₂', opts['D'])

    # 3. SNPDB 2022 IPA
    if slug == 'snpdb_2022_ipa':
        if qnum == 16:
            stem = re.sub(r'(?:^|\n)\s*2(?:\s+2)*\s*(?:\n|$)', '\n', stem)
            stem = re.sub(r'(?:^|\n)\s*2,\s*2\s*(?:\n|$)', '\n', stem)
            opts['A'] = re.sub(r'gas\s+CO\s+', 'gas CO₂ ', opts['A'])
            opts['B'] = re.sub(r'gas\s+O\s+', 'gas O₂ ', opts['B'])
            opts['C'] = re.sub(r'gas\s+CO\s+dan\s+H\s+O\s+gas\s+O', 'gas CO₂ dan H₂O gas O₂', opts['C'])
            opts['D'] = re.sub(r'gas\s+CO\s+cahaya\s+dan\s+H\s+O', 'gas CO₂, cahaya, dan H₂O', opts['D'])
        elif qnum == 27:
            stem = re.sub(r'24\s*m/s\s*\.', '24 m/s².', stem)
            stem = re.sub(r'(?:^|\n)\s*2\s*(?:\n|$)', '\n', stem)
        elif qnum == 28:
            stem = re.sub(r'5\s*m/s\s+dan', '5 m/s² dan', stem)
            stem = re.sub(r'(?:^|\n)\s*2\s*(?:\n|$)', '\n', stem)
        elif qnum == 36:
            stem = re.sub(r'\(CO\s*,\s*CH\s*,\s*NO\s*,\s*CFC,\s*SO\s*,', '(CO₂, CH₄, NOₓ, CFC, SOₓ,', stem)
            stem = re.sub(r'produksi\s+CO\s+sebagai', 'produksi CO₂ sebagai', stem)
            stem = re.sub(r'(?:^|\n)\s*2\s*4\s*x\s*x\s*(?:\n|$)', '\n', stem)
            stem = re.sub(r'(?:^|\n)\s*2\s*(?:\n|$)', '\n', stem)
        elif qnum == 37:
            stem = re.sub(r'\(CO\s*,\s*CH\s*,\s*NO\s*,\s*CFC,\s*SO\s*,', '(CO₂, CH₄, NOₓ, CFC, SOₓ,', stem)
            stem = re.sub(r'kadar\s+CO\s+di\s+atmosfer', 'kadar CO₂ di atmosfer', stem)
            stem = re.sub(r'(?:^|\n)\s*2\s*4\s*x\s*x\s*(?:\n|$)', '\n', stem)
            stem = re.sub(r'(?:^|\n)\s*2\s*(?:\n|$)', '\n', stem)
            for k in ['A', 'B', 'C', 'D']:
                opts[k] = re.sub(r'CO(?!\d)', 'CO₂', opts[k])

    # 4. IPA 2023 (ipa)
    if slug == 'ipa' and qnum == 7:
        stem = re.sub(r'3\s*m/s\s*,', '3 m/s²,', stem)
        stem = re.sub(r'(?:^|\n)\s*2\s*$', '', stem)

    # 5. Arithmetic progression in TA MAN IC & PK
    if slug in ['ta_man_ic_paket_1', 'ta_man_pk_paket_1'] and qnum == 14:
        stem = 'Diberikan barisan aritmatika naik x₁, x₂, ..., x₂₀₁₉. Median dari data baru 3x₁ - 2019, 3x₂ - 2019, ..., 3x₂₀₁₉ - 2019 adalah 2019. Nilai rata-rata dari x₁, x₂, ..., x₂₀₁₉ adalah ...'

    # 6. Table matching artifacts in IPS & Keislaman
    if (slug == 'snpdb_2021_ips' and qnum in [25, 28]) or \
       (slug == 'snpdb_2022_ips' and qnum == 48) or \
       (slug == 'snpdb_2022_keislaman' and qnum == 23):
        stem = re.sub(r'(?:^|\n)\s*1\s+1\s*(?:\n|$)', '\n', stem)
        stem = re.sub(r'(?:^|\n)\s*2\s+2\s*(?:\n|$)', '\n', stem)
        stem = re.sub(r'(?:^|\n)\s*3\s+3\s*(?:\n|$)', '\n', stem)

    # 7. General cleanup:
    stem = stem.replace('\u2044', '/')
    for k in opts:
        if opts[k]:
            opts[k] = opts[k].replace('\u2044', '/')

    # Remove any isolated artifact lines that are purely 1-2 digits or 1-2 letters
    cleaned_lines = []
    for l in stem.split('\n'):
        ls = l.strip()
        # If line is an isolated single digit like '2' or '3' or '0 3' or '2 2' or '2 2 2'
        if re.match(r'^\d+(\s+\d+)*$', ls) and len(ls) <= 6:
            continue
        cleaned_lines.append(l)
    stem = '\n'.join(cleaned_lines)

    # Normalize multiple newlines and ensure markdown image spacing
    stem = re.sub(r'\n{3,}', '\n\n', stem)
    stem = re.sub(r'(!\[.*?\]\(.*?\))(?!\n\n)', r'\1\n\n', stem)
    stem = re.sub(r'(?<!\n\n)(!\[.*?\]\(.*?\))', r'\n\n\1', stem)
    stem = re.sub(r'\n{3,}', '\n\n', stem).strip()

    q['questionText'] = stem
    for k in ['A', 'B', 'C', 'D', 'E']:
        if k in opts and opts[k]:
            q[f'option{k}'] = opts[k]
    return q

print("Testing full pass over all 16 JSONs...")
import glob
total_issues_after = 0
for f in sorted(glob.glob('scripts/extracted_exams/*.json')):
    with open(f, 'r', encoding='utf-8') as fp:
        d = json.load(fp)
    slug = d.get('config', {}).get('slug', f)
    for q in d['questions']:
        q_cl = clean_math_and_artifacts(slug, q)
        stem = q_cl['questionText']
        
        # Check fraction slash
        if '\u2044' in stem:
            total_issues_after += 1
            print(f"[{slug}] Q{q['questionNumber']}: still has fraction slash!")
        # Check isolated digit line
        for l in stem.split('\n'):
            ls = l.strip()
            if re.match(r'^\d+(\s+\d+)*$', ls) and len(ls) <= 6:
                total_issues_after += 1
                print(f"[{slug}] Q{q['questionNumber']}: isolated line {repr(ls)}")

print(f"Total issues remaining after cleaning: {total_issues_after}")

