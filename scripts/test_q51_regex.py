import re

q51_text = """(A)ُال َّن َّجا
(B)ُِّي الـ ُم ُر ْو
ُش ْر ِط
(C)ُال َّط ِب ْي
(D)ُالـ ُم َع ِّل"""

pattern = re.compile(r'(?:^|\n|\s+)(?:\(([A-E])\)|([A-E])\.)[\.\s\u064B-\u065F\u0670]*([^\n]+(?:\n(?!(?:\(([A-E])\)|([A-E])\.)[\.\s\u064B-\u065F\u0670]*)(?!\d+[\.\)])[^\n]+)*)')
matches = list(pattern.finditer(q51_text))
print("Matched count:", len(matches))
for m in matches:
    k = m.group(1) or m.group(2)
    print(f"Key: {k}, Val length: {len(m.group(3))}")

