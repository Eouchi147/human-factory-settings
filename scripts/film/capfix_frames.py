"""capfix_frames.py N FRAMEDIR idx,idx,...: move out the frames during the given captions (so a resumable render redraws them)"""
import re, sys, os, math, shutil
n, d, idx = int(sys.argv[1]), sys.argv[2], [int(x) for x in sys.argv[3].split(',')]
src = open(f'films/film{n:02d}.js').read()
caps = [(float(a), float(b)) for a, b in re.findall(r"\{ t0: ([\d.]+), t1: ([\d.]+),[^\n]*?html: '", src)]
bk = d + '_capsold'; os.makedirs(bk, exist_ok=True); moved = 0
for i in idx:
    t0, t1 = caps[i]
    for f in range(max(0, math.floor((t0 - 0.12) * 24)), math.ceil((t1 + 0.12) * 24) + 1):
        p = os.path.join(d, f'f{f:05d}.jpg')
        if os.path.exists(p): shutil.move(p, os.path.join(bk, f'f{f:05d}.jpg')); moved += 1
print(f'film {n}: moved {moved} frames from {d}')
