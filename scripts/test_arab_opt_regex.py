import re

sample_arab_options = "(A)ُِغ ْر َف ُة ال ُم َذا َك َر\n(B)ُِغ ْر َف ُة ال َّن ْو\n(C)ٌَس ِر ْي\n(D)ٌَسا َد\nوِ"

# Pattern allowing 0 or more whitespace or diacritics
pattern = re.compile(r'(?:^|\n|\s+)(?:\(([A-E])\)|([A-E])\.)[\s\u064B-\u0652\u0670]*')
tokens = pattern.split(sample_arab_options)
print("Tokens count:", len(tokens))
opts = {}
i = 1
while i < len(tokens):
    k = tokens[i] or tokens[i+1]
    val = tokens[i+2] if i+2 < len(tokens) else ""
    if k and k.upper() in ['A', 'B', 'C', 'D', 'E']:
        opts[k.upper()] = val.strip()
    i += 3

for k, v in opts.items():
    print(f"Option {k}: {repr(v)}")

