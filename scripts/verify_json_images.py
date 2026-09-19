import json
import glob

def check_exam(slug):
    with open(f'scripts/extracted_exams/{slug}.json', encoding='utf-8') as f:
        d = json.load(f)
    print(f"\n=== {slug} ({len(d['questions'])} questions) ===")
    for q in d['questions']:
        imgs = [l for l in q['questionText'].split('\n') if '![' in l]
        opt_imgs = [v for v in q.values() if isinstance(v, str) and '![' in v and v != q['questionText']]
        last_line = [l for l in q['questionText'].split('\n') if not l.startswith('![') and l.strip()]
        last_txt = last_line[-1][:50] if last_line else ""
        if imgs or opt_imgs:
            print(f"  Q#{q['questionNumber']}: Stimulus={imgs} | OptImgs={len(opt_imgs)} | Text={last_txt}")
        else:
            print(f"  Q#{q['questionNumber']}: (No Image) | Text={last_txt}")

if __name__ == '__main__':
    check_exam('ipa')
    check_exam('keislaman')
    check_exam('matematika')
    check_exam('ta_man_ic_paket_1')
    check_exam('kemampuan_analitik')

