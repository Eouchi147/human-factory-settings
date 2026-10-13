"""script_rtf.py SCRIPT.json OUTDIR: Sam's recording script for one film, as "Film NN, <question>.rtf" (opens in TextEdit).
Every line of the script, numbered, with how to record it: each line twice, three seconds of silence after each take."""
import json, sys, os, re

S = json.load(open(sys.argv[1])); OUT = sys.argv[2]; os.makedirs(OUT, exist_ok=True)
def esc(t):   # RTF: escape the specials and write anything beyond ASCII as \uN?
    t = t.replace('\\', '\\\\').replace('{', '\\{').replace('}', '\\}')
    return ''.join(c if ord(c) < 128 else f'\\u{ord(c) if ord(c) < 32768 else ord(c) - 65536}?' for c in t)
q = S['question']; n = S['n']
body = [r'{\rtf1\ansi\deff0{\fonttbl{\f0 Helvetica;}}\f0\fs28',
        r'{\b\fs40 ' + esc(f'Film {n:02d}: {q}') + r'}\par\par',
        esc(f"Posts {S.get('posts', '')}. Read each line twice, in your own voice: savage, direct, funny. ") +
        esc('Leave three seconds of silence after each take. One audio file for the whole film, into folder 3 Your recordings.') + r'\par\par']
for i, L in enumerate(S['lines'], 1):
    body.append(r'{\b ' + esc(f'Line {i}') + r'}\par ' + esc(' '.join(L['say'])) + r'\par\par')
body.append('}')
name = re.sub(r'[\\/:*?"<>|]', '', f'Film {n:02d}, {q}').rstrip('?. ') + '.rtf'
open(os.path.join(OUT, name), 'w').write('\n'.join(body)); print(os.path.join(OUT, name))
