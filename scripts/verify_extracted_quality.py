import glob, json, os

json_files = sorted(glob.glob('scripts/extracted_exams/*.json'))

print(f"{'Exam Token':<18} | {'Total Q':<8} | {'Dummy Opts':<11} | {'With Images':<11}")
print("-" * 55)

for jf in json_files:
    with open(jf, 'r', encoding='utf-8') as f:
        data = json.load(f)
    token = data['config']['token']
    questions = data['questions']
    
    dummy_count = 0
    img_count = 0
    for q in questions:
        # Check if options are dummy
        if q['optionA'] == 'Pilihan A' and q['optionB'] == 'Pilihan B':
            dummy_count += 1
        if '![' in q['questionText']:
            img_count += 1
            
    print(f"{token:<18} | {len(questions):<8} | {dummy_count:<11} | {img_count:<11}")

