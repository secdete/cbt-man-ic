import sys
sys.stdout.reconfigure(encoding='utf-8')
from test_full_spatial_run import test_parse_exam, CONFIGS

ingg_cfg = [c for c in CONFIGS if c['slug'] == 'bahasa_inggris'][0]
qs = test_parse_exam(ingg_cfg)
for q in qs:
    imgs = [t for t in q['text_parts'] if '![' in t]
    last_text = q['text_parts'][-1][:60].replace('\n', ' ') if q['text_parts'] else ""
    print(f"Q{q['number']} (p{q['page']}): {len(imgs)} imgs | {imgs} | stem: {last_text}")
