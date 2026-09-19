import sys
sys.stdout.reconfigure(encoding='utf-8')
from test_unified_stream import parse_with_unified_stream, CONFIGS

for slug in ['ta_man_ic_paket_1', 'ta_man_pk_paket_1']:
    cfg = [c for c in CONFIGS if c['slug'] == slug][0]
    qs = parse_with_unified_stream(cfg)
    for q in qs:
        if not q['options'].get('A'):
            num = q['number']
            pg = q['page']
            print(f"\n=== {slug} Q{num} (Page {pg}) ===")
            print("Text parts:", q['text_parts'])
            print("Options:", q['options'])
