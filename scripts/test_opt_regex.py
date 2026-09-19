import re

sample_texts = [
    "A. Hilman  B. Marni  C. Udin  D. Kaka  E. Ririn",
    "A. Oskar \nB. Rio \nC. Bahar \nD. Amar \nE. Yoga",
    "(A) Menanam ari-ari \n(B) Menanam ari-ari tumbuh \n(C) Bentuk penghargaan \n(D) Tradisi nenek moyang",
    "A. Sepatu milik Anjar lebih banyak dari sepatu milik Hendri \nB. Sepatu milik Hendri lebih banyak"
]

def extract_options(text):
    # Match A. or (A) or A)
    # Pattern: (?:\b|\n)(?:\(?([A-E])\)|([A-E])\.)\s+([^\n]+)
    options = {}
    
    # Check if format has A. ... B. ...
    # Split by option delimiter
    tokens = re.split(r'(?:^|\s+|\n)(?:\(([A-E])\)|([A-E])\.)\s+', text)
    # tokens will have [before, key1_paren, key1_dot, val1, key2_paren, key2_dot, val2, ...]
    if len(tokens) > 1:
        # tokens[0] is text before first option
        i = 1
        while i < len(tokens):
            k = tokens[i] or tokens[i+1]
            val = tokens[i+2] if i+2 < len(tokens) else ""
            if k and k.upper() in ['A', 'B', 'C', 'D', 'E']:
                options[k.upper()] = val.strip()
            i += 3
    return options

for st in sample_texts:
    opts = extract_options(st)
    print("Extracted from:", st[:30], "->", opts)

