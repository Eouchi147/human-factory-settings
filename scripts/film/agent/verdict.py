"""verdict.py MODE FILM DIR [--t1 SECONDS]: reads the logs a check or a render left in DIR and writes DIR/verdict.txt.
MODE is check (the picture's checks, before rendering) or render (the finished film).
The first line of verdict.txt is PASS or FAIL; each line after it is one gate: ok or FAIL, and why.
A missing log is a FAIL (a check that did not run did not pass). Exit 0 on PASS, 1 on FAIL."""
import sys, os, re, glob, json, subprocess

MODE, FILM, D = sys.argv[1], sys.argv[2], sys.argv[3]
T1 = float(sys.argv[sys.argv.index('--t1') + 1]) if '--t1' in sys.argv else None
lines = []
def gate(name, ok, why=''): lines.append(f"{'ok  ' if ok else 'FAIL'} {name}{': ' + why if why else ''}")
def read(pat):
    fs = sorted(glob.glob(os.path.join(D, pat)))
    return [(os.path.basename(f), open(f, errors='replace').read()) for f in fs]
def last_int(txt, rx):
    m = re.findall(rx, txt); return int(m[-1]) if m else None

def zero_gate(name, pat, rx, what):
    logs = read(pat)
    if not logs: gate(name, False, 'no log (the check did not run)'); return
    for fn, txt in logs:
        n = last_int(txt, rx)
        if n is None: gate(f'{name} [{fn}]', False, 'no result line (it crashed or timed out): ' + txt.strip()[-200:].replace('\n', ' | '))
        else: gate(f'{name} [{fn}]', n == 0, f'{n} {what}')

zero_gate('collisions (audit_film)', 'qa_audit*.log', r'problems: (\d+)', 'problems')
zero_gate('pops (jump_check)', 'qa_jump*.log', r'pops: (\d+)', 'pops')
zero_gate('printed words in the bottom fifth or button column (tags_check)', 'qa_tags*.log', r': (\d+) stretches', 'stretches')
zero_gate('bones behind the captions (caps_clear)', 'qa_clear*.log', r'bones behind the words: (\d+) stretches', 'stretches')
zero_gate('captions fit their lines (check_caps)', 'qa_caps*.log', r'problems: (\d+)', 'problems')

if MODE == 'check':
    pg = read('qa_pgerr*.log')
    if not pg: gate('page errors (pgerr)', False, 'no log')
    else:
        txt = pg[0][1]; bad = [l for l in txt.splitlines() if l.startswith(('PAGEERR', 'EXC', 'error '))]
        ok = 'ready' in txt and 'INIT' in txt and not bad
        gate('page errors (pgerr)', ok, 'none' if ok else ('; '.join(bad[:3]) or 'the film did not load'))
    gate('contact sheet', os.path.exists(os.path.join(D, 'sheet.png')), 'sheet.png' if os.path.exists(os.path.join(D, 'sheet.png')) else 'missing')

if MODE == 'render':
    st = read('status.txt'); s = st[0][1] if st else ''
    gate('run status', s.startswith('success'), s.strip() or 'no status.txt')
    mi = read('missing.log'); m = mi[0][1] if mi else ''
    k = last_int(m, r'missing (\d+)')
    gate('every frame rendered', k == 0, m.splitlines()[0] if m else 'no missing.log')
    so = read('sound.log'); gate('sound', bool(so) and so[0][1].startswith('ok'), so[0][1].strip()[:200] if so else 'no sound.log')
    cuts = [f for f in glob.glob(os.path.join(D, '*.mp4'))]
    gate('two cuts handed back', len(cuts) >= 2, ', '.join(os.path.basename(c) for c in cuts) or 'none')
    for c in cuts:
        try: dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', c], capture_output=True, text=True).stdout.strip())
        except Exception: dur = None
        if T1 is None or dur is None: gate(f'length [{os.path.basename(c)}]', dur is not None and dur > 30, f'{dur} s')
        else: gate(f'length [{os.path.basename(c)}]', abs(dur - T1) < 1.0, f'{dur:.2f} s for {T1} s')
    gate('contact sheet', os.path.exists(os.path.join(D, 'sheet.png')), 'sheet.png' if os.path.exists(os.path.join(D, 'sheet.png')) else 'missing')

ok = all(l.startswith('ok') for l in lines)
open(os.path.join(D, 'verdict.txt'), 'w').write(('PASS' if ok else 'FAIL') + f' {MODE} {FILM}\n' + '\n'.join(lines) + '\n')
print(open(os.path.join(D, 'verdict.txt')).read())
sys.exit(0 if ok else 1)
