#!/usr/bin/env python3
"""hfs.py: the film pipeline's commands, for any agent (or person) with git. Heavy work runs on GitHub's machines.
Run from anywhere inside the repo, on the working branch, with your changes COMMITTED (branches are built from HEAD).

  hfs.py voice NN              AI voice guide + word times + recording script for film NN  -> check-out/filmNN-voice
  hfs.py check NN              every quality check on film NN's picture + contact sheet     -> check-out/filmNN
  hfs.py render NN [--batch K] render film NN on a free render/batch-K branch               -> render-out/filmNN
  hfs.py status                what each batch is rendering, and which results are back
  hfs.py fetch voice|check|render NN   download a result into out/<branch>/, print its verdict (render: rebuilds the master)
  hfs.py deliver NN --to DIR   copy film NN's cuts (and voice files, if fetched) into Sam's folders under DIR; PASS only

Never pushes main (main redeploys the site). Never force-pushes. Results take about 10 min (voice), 30 to 60 min (check)
and 60 to 100 min (render)."""
import sys, os, re, json, glob, subprocess, tempfile, shutil, time

ROOT = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip() or sys.exit('run inside the repo')
AG = os.path.join(ROOT, 'scripts/film/agent')
def git(*a, env=None, check=True, inp=None):
    r = subprocess.run(['git', '-C', ROOT, *a], capture_output=True, text=True, env=env, input=inp)
    if check and r.returncode: sys.exit(f'git {" ".join(a)} failed:\n{r.stderr.strip()}')
    return r.stdout.strip()
def remote_heads(pat):
    out = git('ls-remote', 'origin', pat); return {l.split('\t')[1].replace('refs/heads/', ''): l.split('\t')[0] for l in out.splitlines() if l}
def fetch(branch, depth=1):
    git('fetch', '-q', f'--depth={depth}', 'origin', f'+refs/heads/{branch}:refs/remotes/origin/{branch}')
    return f'origin/{branch}'

def film_info(nn):
    n = int(nn); sc = glob.glob(os.path.join(ROOT, f'content/films/{n:02d}-*.json'))
    if not sc: sys.exit(f'no script content/films/{n:02d}-*.json')
    S = json.load(open(sc[0])); slug = S['slug']; film = f'film{n:02d}'; t1 = 0.0
    for f in (f'scripts/film/films/{film}.src.js', f'scripts/film/films/{film}.js'):
        p = os.path.join(ROOT, f)
        if os.path.exists(p):
            m = re.search(r'const T = \{\s*end:\s*([\d.]+)', open(p).read())
            if m: t1 = float(m.group(1)); break
    return dict(n=n, nn=f'{n:02d}', film=film, slug=slug, guide=f'{n:02d}-{slug}', script=os.path.relpath(sc[0], ROOT), t1=t1)

def must_be_clean():
    d = git('status', '--porcelain', '--untracked-files=no', '--', 'scripts', 'content')
    if d: sys.exit('commit your changes first (the branch is built from HEAD):\n' + d)
    if git('rev-parse', '--abbrev-ref', 'HEAD') == 'main': sys.exit('you are on main: work on the working branch, never main')

def latest_kit():
    heads = remote_heads('refs/heads/render/batch-*')
    if not heads: sys.exit('no render/batch-* branch to take the models and voices from')
    best = None
    for b in heads:
        r = fetch(b); t = int(git('log', '-1', '--format=%ct', r))
        if best is None or t > best[0]: best = (t, r)
    return best[1], heads

def build_and_push(branch, I, mode):
    """the branch = HEAD's tree + the render kit (models and voices from the newest batch, scripts from agent/kit) + a queue"""
    kit, _ = latest_kit()
    env = {**os.environ, 'GIT_INDEX_FILE': tempfile.mktemp(prefix='hfs-idx-')}
    git('read-tree', 'HEAD', env=env)
    for sub in ('models', 'voice'): git('read-tree', f'--prefix=render/{sub}/', f'{kit}:render/{sub}', env=env)
    def add(path, src=None, data=None, mode_='100644'):
        if data is not None: sha = git('hash-object', '-w', '--stdin', inp=data)
        else: sha = git('hash-object', '-w', src)
        git('update-index', '--add', '--cacheinfo', f'{mode_},{sha},{path}', env=env)
    add('render/setup.sh', os.path.join(AG, 'kit/setup.sh'), mode_='100755')
    add('render/hand_back.sh', os.path.join(AG, 'kit/hand_back.sh'), mode_='100755')
    add('.github/workflows/render.yml', os.path.join(AG, 'workflows/render.yml'))
    add('.github/workflows/check.yml', os.path.join(AG, 'workflows/check.yml'))
    add('vercel.json', data='{"ignoreCommand": "exit 0"}\n')
    vdir = os.path.join(ROOT, 'scripts/film/voice')
    for ext in ('voice-guide.wav', 'report.json'):
        p = os.path.join(vdir, f"{I['guide']}-{ext}")
        if os.path.exists(p): add(f"render/voice/{I['guide']}-{ext}", p)
        elif mode == 'render': sys.exit(f'missing {os.path.relpath(p, ROOT)}: run hfs.py voice {I["nn"]} and commit its files first')
    q = {'parts': 10, 'mode': mode, 'films': [{'film': I['film'], 'n': I['n'], 'nn': I['nn'], 't1': I['t1'], 'guide': I['guide'], 'script': I['script']}]}
    add('render/queue.json', data=json.dumps(q) + '\n')
    tree = git('write-tree', env=env); os.remove(env['GIT_INDEX_FILE'])
    parents = ['-p', 'HEAD']
    if branch in remote_heads(f'refs/heads/{branch}'): parents = ['-p', fetch(branch)] + parents
    msg = f"{mode} {I['film']} from {git('rev-parse', '--short', 'HEAD')}"
    c = git('commit-tree', tree, *parents, '-m', msg)
    if os.environ.get('HFS_DRY'): print(f'dry run: would push {c} to {branch}'); return c
    git('push', 'origin', f'{c}:refs/heads/{branch}')
    print(f'pushed {branch} ({c[:7]}): {msg}')

def batch_state():
    """each batch: its film, and whether that film's result came back after the batch was pushed (then it is free)"""
    heads = remote_heads('refs/heads/render/batch-*'); outs = remote_heads('refs/heads/render-out/*'); st = {}
    for b in sorted(heads):
        r = fetch(b); bt = int(git('log', '-1', '--format=%ct', r))
        try: film = json.loads(git('show', f'{r}:render/queue.json'))['films'][0]['film']
        except Exception: film = '?'
        o = f'render-out/{film}'; back = False; verdict = ''
        if o in outs:
            ro = fetch(o); back = int(git('log', '-1', '--format=%ct', ro)) > bt
            verdict = git('show', f'{ro}:verdict.txt', check=False).split('\n')[0] if back else ''
        st[b] = dict(film=film, pushed=time.strftime('%d %b %H:%M', time.localtime(bt)), back=back, verdict=verdict)
    return st

def cmd_status():
    for b, s in batch_state().items():
        print(f"{b:16s} {s['film']:8s} pushed {s['pushed']}  " + (f"back: {s['verdict'] or 'no verdict (old run)'}" if s['back'] else 'rendering (or never came back)'))
    for pre in ('check-out/',):
        for b, sha in sorted(remote_heads(f'refs/heads/{pre}*').items()):
            r = fetch(b); print(f"{b:24s} {git('show', f'{r}:verdict.txt', check=False).splitlines()[0] if git('show', f'{r}:verdict.txt', check=False) else '(no verdict)'}  ({git('log', '-1', '--format=%cd', '--date=format:%d %b %H:%M', r)})")

def cmd_fetch(kind, nn):
    I = film_info(nn); br = {'voice': f"check-out/{I['film']}-voice", 'check': f"check-out/{I['film']}", 'render': f"render-out/{I['film']}"}[kind]
    if br not in remote_heads(f'refs/heads/{br}'): sys.exit(f'{br} is not back yet')
    r = fetch(br); d = os.path.join(ROOT, 'out', br.replace('/', '_')); shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    tar = subprocess.run(['git', '-C', ROOT, 'archive', r], capture_output=True).stdout
    subprocess.run(['tar', '-x', '-C', d], input=tar, check=True)
    for first in sorted(glob.glob(os.path.join(d, '*.part00'))):   # the master, rebuilt from its parts
        base = first[:-len('.part00')]
        with open(base, 'wb') as o:
            for p in sorted(glob.glob(base + '.part*')): o.write(open(p, 'rb').read()); os.remove(p)
    print(f"{br} -> {os.path.relpath(d, ROOT)}  (pushed {git('log', '-1', '--format=%cd', r)})")
    v = os.path.join(d, 'verdict.txt'); print(open(v).read() if os.path.exists(v) else 'no verdict.txt in this result')
    if os.path.exists(os.path.join(d, 'sheet.png')): print('LOOK AT THE CONTACT SHEET:', os.path.join(d, 'sheet.png'))
    for f in sorted(os.listdir(d)): print('  ', f)

def cmd_deliver(nn, to):
    I = film_info(nn); n = I['nn']; done = []
    R = os.path.join(ROOT, 'out', f"render-out_{I['film']}"); V = os.path.join(ROOT, 'out', f"check-out_{I['film']}-voice")
    if os.path.isdir(V):
        for f in glob.glob(os.path.join(V, '*.rtf')): shutil.copy2(f, os.path.join(to, '1 Scripts to record')); done.append(f)
        for f in glob.glob(os.path.join(V, '*.m4a')): shutil.copy2(f, os.path.join(to, '2 Voice guides (not for posting)')); done.append(f)
    if os.path.isdir(R):
        v = open(os.path.join(R, 'verdict.txt')).read() if os.path.exists(os.path.join(R, 'verdict.txt')) else ''
        if not v.startswith('PASS'): sys.exit(f"film {n}'s render is not PASS: not delivered\n{v}")
        for f in glob.glob(os.path.join(R, '*for your voice*.mp4')): shutil.copy2(f, os.path.join(to, '4 Films waiting for your voice')); done.append(f)
        for f in glob.glob(os.path.join(R, '*voice guide*.mp4')): shutil.copy2(f, os.path.join(to, '2 Voice guides (not for posting)')); done.append(f)
    if not done: sys.exit('nothing fetched to deliver: run hfs.py fetch voice|render NN first')
    for f in done: print('delivered', os.path.basename(f))

a = sys.argv[1:]
if not a: sys.exit(__doc__)
if a[0] in ('voice', 'check'):
    must_be_clean(); I = film_info(a[1])
    if a[0] == 'check' and not I['t1']: sys.exit(f"no 'const T = {{ end: ... }}' in scripts/film/films/{I['film']}.src.js: build the picture first")
    build_and_push(f"check/{I['film']}" + ('-voice' if a[0] == 'voice' else ''), I, a[0])
elif a[0] == 'render':
    must_be_clean(); I = film_info(a[1])
    if not I['t1']: sys.exit('no picture yet')
    if '--batch' in a: b = f"render/batch-{a[a.index('--batch') + 1]}"
    else:
        st = batch_state(); free = [k for k, s in st.items() if s['back']]
        if not free: sys.exit('every batch is still rendering:\n' + '\n'.join(f'{k}: {s["film"]}' for k, s in st.items()) + '\nwait, or pass --batch K to replace one')
        b = free[0]
    build_and_push(b, I, 'render')
elif a[0] == 'status': cmd_status()
elif a[0] == 'fetch': cmd_fetch(a[1], a[2])
elif a[0] == 'deliver': cmd_deliver(a[1], a[a.index('--to') + 1] if '--to' in a else sys.exit('--to DIR (the Human Factory Settings folder)'))
else: sys.exit(__doc__)
