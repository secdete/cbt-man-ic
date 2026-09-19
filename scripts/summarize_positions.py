import glob

with open("scripts/audit_spatial_output.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

current_exam = ""
current_page = ""
for line in lines:
    if line.startswith("=== "):
        current_exam = line.strip()
        print("\n" + "="*50)
        print(current_exam)
    elif line.startswith("--- Page"):
        current_page = line.strip()
    elif "IMAGE:" in line or "TEXT:" in line and any(f"Q#{i} " in line or f"{i}. " in line for i in range(1, 100)):
        if "TEXT:" in line:
            # only print if contains question number
            import re
            m = re.search(r'(?:Q#|y0=\S+\s+\|\s+)(\d+)[\.\)]\s*(.*)', line)
            if m:
                print(f"  [{current_page}] {line.strip()[:110]}")
        else:
            print(f"  [{current_page}] {line.strip()[:110]}")

