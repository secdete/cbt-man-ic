import json

def inspect_missing_opts(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"\n================ {data['config']['token']} Missing Options ================")
    count = 0
    for q in data['questions']:
        if q['optionA'] == 'Pilihan A':
            count += 1
            print(f"Q{q['questionNumber']} (P{q['page']}): {repr(q['questionText'][:70])}")
            if count >= 8:
                print("... and more")
                break

inspect_missing_opts('scripts/extracted_exams/ta_man_ic_paket_1.json')
inspect_missing_opts('scripts/extracted_exams/snpdb_2021_ipa.json')
inspect_missing_opts('scripts/extracted_exams/snpdb_2021_keislaman.json')
