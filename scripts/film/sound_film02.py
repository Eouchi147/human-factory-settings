"""Film 2 "How do I fix my posture?" (new direction): score and sound design, timed to films/film02.js (Mum's cross-stitch and a
music box; the skeleton snaps up like a soldier: a snare, a bugle and a spring; "she was guessing": a slide whistle down; the
spine lights up and runs through its positions, one xylophone note each; it freezes and turns to stone: the music stops dead,
stone grinds; it cracks out and melts back. The case file: a walking bass and brushes, the rubber stamp lifted, carried and
slammed twice, a sting for NO EVIDENCE and a happy chord for ALIBI CONFIRMED. Two lower-back curves: two tones that beat, then
glide into one. The neck: the protractor's ratchet, step by step; the NECK PAIN gauge: a deadpan wah-wah. The warnings, plain.
The plan: the phone set down, chin tucks, shoulder squeezes, the chair rolls back, the wall clock races an hour, footsteps,
the chair takes the weight back; the hoop becomes the logo).
Usage: python3 sound_film02.py <voice guide wav> <voice report json> <out dir>"""
import sys, math
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=68.4, logo=65.9, your=0.35, mum=0.79, up=1.69, straight=1.91, with_=2.79, respect=3.69, guessing=4.42,
         your2=5.64, spine=6.08, move=6.99, bend=7.27, change=7.92, position=8.32, all=9.01, not_=9.59, freeze=10.18, perfect=11.07, pose=11.82,
         and1=13.1, evidence=14.24, so=16.49, slouch2=17.49, alibi=18.35, people=19.76, dont=21.03, different=21.88, curve=23.01,
         and2=24.37, looking=24.81, phone=25.65, because=28.32, measured=29.75, angle=32.22, didnt=32.63, neckpain=33.73,
         if1=35.1, everyone=54.77, strengthen=55.31, upper=56.33, getup=57.1, once=57.89, hour=58.56, keep=59.13, because2=59.86,
         final=63.64, factory=64.85, settings=65.22)
H = 3600
m = Mix(T['end'], seed=20261022)
rng = np.random.default_rng(202)
def s5(a, b, x):
    u = min(1.0, max(0.0, (x - a) / (b - a))); return u * u * u * (u * (u * 6 - 15) + 10)
def sm(a, b, x): return float(ss(a, b, x))
def pulse_(t, a, b, r=0.3): return sm(a, a + r, t) * (1 - sm(b - r, b, t))

# ---------------------------------------------------------------- instruments and effects made here
def musicbox(at, nn, gain=0.02, pan=0.0):   # a comb tine: bright, short, a little metallic
    n = int(1.6 * SR); x = np.arange(n) / SR; f = note(nn)
    s = (np.sin(2 * np.pi * f * x) + 0.45 * np.sin(2 * np.pi * f * 3.01 * x) * np.exp(-x / 0.08) + 0.2 * np.sin(2 * np.pi * f * 5.2 * x) * np.exp(-x / 0.03)) * env(n, 0.001, 0.5)
    m.add('M', s * gain, at, pan)
def snare(at, gain=0.05, pan=0.0, tight=1.0):
    n = int(0.4 * SR); x = np.arange(n) / SR
    head = np.sin(2 * np.pi * np.cumsum(190 * (1 + 0.4 * np.exp(-x / 0.01))) / SR) * env(n, 0.0005, 0.05 * tight)
    wires = bp(m.noise(n), 1800, 9000) * env(n, 0.0005, 0.11 * tight)
    m.add('X', (head * 0.6 + wires) * gain, at, pan)
def brass(at, nn, dur, gain=0.03, pan=0.0, mute=False):   # a small horn: saw-like partials, the filter opens on the attack
    n = int((dur + 0.15) * SR); x = np.arange(n) / SR; f = note(nn) * (1 + 0.004 * np.sin(2 * np.pi * 5.5 * x) * np.clip(x / 0.2, 0, 1))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = sum(np.sin(k * ph) / k for k in range(1, 12))
    lo_, hi_, dk = (500, 900, 0.05) if mute else (900, 2600, 0.08)
    out = np.zeros(n); blk = 480
    for i in range(0, n, blk):   # a low-pass that closes after the attack, block by block
        fc = lo_ + hi_ * math.exp(-(i / SR) / dk); seg = lp(s[max(0, i - 2400):i + blk], fc); out[i:i + blk] = seg[-len(out[i:i + blk]):]
    e = np.minimum(1, x / 0.02) * (1 - ss(dur - 0.06, dur + 0.1, x))
    m.add('M', out * e * gain, at, pan)
def boing(at, gain=0.03, pan=0.0, f0=210, dur=0.55):   # a cartoon spring: the pitch wobbles and settles
    n = int(dur * SR); x = np.arange(n) / SR
    f = f0 * (1 + 0.35 * np.exp(-x / 0.12) * np.sin(2 * np.pi * 17 * x))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    m.add('X', s * env(n, 0.002, 0.16) * gain, at, pan)
def slide(at, n0, n1, dur, gain=0.03, pan=0.0):   # a slide whistle: a breathy pure tone gliding
    n = int(dur * SR); x = np.arange(n) / SR; u = np.clip(x / dur, 0, 1)
    f = note(n0) * (note(n1) / note(n0)) ** (u ** 0.8) * (1 + 0.006 * np.sin(2 * np.pi * 6 * x))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.08 * bp(m.noise(n), 900, 5000)
    m.add('X', s * np.minimum(1, x / 0.03) * (1 - ss(dur - 0.12, dur, x)) * gain, at, pan)
def creak(at, dur, gain, f0=1000, r0=30, r1=60, pan=0.0):   # stick-slip: a hinge, a backrest, a neck
    n = int(dur * SR); x = np.arange(n) / SR; rate = r0 + (r1 - r0) * x / dur + 6 * np.sin(2 * np.pi * 2.5 * x)
    ph = np.cumsum(rate) / SR; imp = np.zeros(n); k = np.nonzero(np.diff(np.floor(ph)) > 0)[0]
    imp[k] = rng.uniform(0.5, 1.0, len(k))
    s = bp(imp, f0 * 0.7, f0 * 1.4) + 0.5 * bp(imp, f0 * 2.1, f0 * 2.7) + 0.3 * lp(imp, f0 * 0.5)
    m.add('X', s * np.sin(np.pi * np.clip(x / dur, 0, 1)) ** 0.6 * gain, at, pan)
def grind(a, b, gain=0.03, pan=0.0):   # stone: a dry crunch, low and grainy
    t = m.t(a, b); n = len(t); g = np.zeros(n); k = rng.integers(0, n, int((b - a) * 900)); g[k] = rng.uniform(0.2, 1.0, len(k))
    s = bp(g, 300, 2400) * 0.8 + lp(m.noise(n), 260) * 0.5
    m.add('X', s * np.sin(np.pi * np.clip((t - a) / (b - a), 0, 1)) ** 0.7 * gain, a, pan)
def crackle(a, b, count, gain=0.02, pan=0.0):   # stone cracking off in flakes
    for i in range(count):
        at = a + (b - a) * rng.random() ** 0.7; n = int(0.03 * SR)
        s = bp(m.noise(n), rng.uniform(900, 2500), rng.uniform(4000, 8000)) * env(n, 0.0003, rng.uniform(0.002, 0.008))
        m.add('X', s * gain * rng.uniform(0.4, 1.0), at, pan + rng.uniform(-0.3, 0.3))
def stamp_slam(at, gain=0.2, pan=0.0):   # a rubber stamp on a folder on a desk: a thump, a slap of paper, a wooden knock
    n = int(0.7 * SR); x = np.arange(n) / SR
    thump = np.sin(2 * np.pi * np.cumsum(70 * (1 + 0.8 * np.exp(-x / 0.02))) / SR) * env(n, 0.001, 0.12)
    slap = bp(m.noise(n), 700, 6000) * env(n, 0.0004, 0.02)
    knock = np.sin(2 * np.pi * 420 * x) * env(n, 0.0005, 0.04) * 0.5 + np.sin(2 * np.pi * 980 * x) * env(n, 0.0004, 0.015) * 0.3
    m.add('X', (thump + slap * 0.7 + knock) * gain, at, pan)
def bass(at, nn, gain=0.06, dur=0.5, pan=-0.1):   # a plucked upright bass
    n = int((dur + 0.3) * SR); x = np.arange(n) / SR; f = note(nn)
    s = (np.sin(2 * np.pi * f * x) + 0.5 * np.sin(2 * np.pi * 2 * f * x) * np.exp(-x / 0.12) + 0.25 * np.sin(2 * np.pi * 3 * f * x) * np.exp(-x / 0.06))
    s = s * env(n, 0.006, dur * 0.7) + bp(m.noise(n), 200, 1200) * env(n, 0.001, 0.01) * 0.5
    m.add('M', lp(s, 1400) * gain, at, pan)
def brush(at, dur=0.22, gain=0.012, pan=0.2):   # brushes on a snare: a soft sweep
    n = int(dur * SR); x = np.arange(n) / SR
    m.add('M', bp(m.noise(n), 2500, 9000) * np.sin(np.pi * np.clip(x / dur, 0, 1)) ** 1.5 * gain, at, pan)
def vibes(at, notes, gain=0.02, pan=0.0, decay=1.2):   # a vibraphone chord with its tremolo
    n = int((decay * 3) * SR); x = np.arange(n) / SR; out = np.zeros(n)
    for nn in notes:
        f = note(nn); out += (np.sin(2 * np.pi * f * x) + 0.2 * np.sin(2 * np.pi * 4 * f * x) * np.exp(-x / 0.1))
    out *= env(n, 0.002, decay) * (1 + 0.25 * np.sin(2 * np.pi * 5.5 * x)) / len(notes)
    m.add('M', out * gain, at, pan)
def ratchet(a, b, count, gain=0.02, pan=0.0):   # the protractor arm clicking from mark to mark
    for i in range(count):
        m.tick(a + (b - a) * (i / max(1, count - 1)) ** 0.8, gain * rng.uniform(0.8, 1.0), pan, hi=2600, lo=900)
def wahwah(at, gain=0.03, pan=0.0):   # a muted horn, two notes down: the myth fails
    brass(at, 52, 0.28, gain, pan, mute=True); brass(at + 0.32, 51, 0.6, gain, pan, mute=True)
def step(at, gain=0.03, pan=0.0):   # a bony foot on a wooden floor
    n = int(0.25 * SR); x = np.arange(n) / SR
    s = np.sin(2 * np.pi * 95 * x) * env(n, 0.002, 0.05) + bp(m.noise(n), 900, 4000) * env(n, 0.0005, 0.012) * 0.6 + np.sin(2 * np.pi * 1300 * x) * env(n, 0.0003, 0.006) * 0.25
    m.add('X', s * gain, at, pan)
def roll(a, b, gain=0.02, pan=0.0):   # chair casters on a wooden floor
    t = m.t(a, b); n = len(t); e = np.sin(np.pi * np.clip((t - a) / (b - a), 0, 1))
    r = lp(m.noise(n), 220) * 1.2 + bp(m.noise(n), 600, 2400) * (0.4 + 0.6 * (np.sin(2 * np.pi * 23 * t) > 0.6))
    m.add('X', r * e * gain, a, pan)
def hiss(a, dur, gain=0.02, pan=0.0):   # the chair's gas lift
    n = int(dur * SR); x = np.arange(n) / SR
    m.add('X', bp(m.noise(n), 2500, 9000) * np.minimum(1, x / 0.02) * np.exp(-x / (dur * 0.5)) * gain, a, pan)
def clack(at, gain=0.04, pan=0.0):   # a phone laid on a desk
    n = int(0.3 * SR); x = np.arange(n) / SR
    s = bp(m.noise(n), 1500, 8000) * env(n, 0.0003, 0.006) + np.sin(2 * np.pi * 780 * x) * env(n, 0.0005, 0.02) * 0.5 + np.sin(2 * np.pi * 210 * x) * env(n, 0.001, 0.05) * 0.4
    m.add('X', s * gain, at, pan)

# ---------------------------------------------------------------- the hoop: Mum's music box (cut dead by the snap)
SNAP = T['up'] - 0.12
for k, (dt, nn) in enumerate([(0.0, 84), (0.32, 88), (0.64, 91), (0.96, 89), (1.26, 88)]):
    if dt + 0.05 < SNAP: musicbox(dt + 0.05, nn, 0.022 - 0.002 * k, 0.1)
m.pad([48, 60, 64, 67], 0.0, SNAP, 0.32, 1400, att=0.3, rel=0.05)
m.whoosh(0.65, 0.9, 250, 1600, 0.012, 0.1)                                        # the camera pulls back from the wall
# ---------------------------------------------------------------- "sit up straight": the soldier (a snare, a bugle, a spring, a creak)
snare(SNAP + 0.02, 0.07, 0.0); snare(SNAP + 0.1, 0.035, 0.05, 0.6)
brass(SNAP + 0.02, 67, 0.11, 0.022, 0.0); brass(SNAP + 0.15, 72, 0.5, 0.026, 0.0); brass(SNAP + 0.15, 76, 0.5, 0.016, 0.1)
boing(SNAP + 0.16, 0.022, 0.05, 230, 0.6)
creak(SNAP + 0.0, 0.18, 0.02, 900, 60, 90, 0.1)
for k, at in enumerate(np.arange(2.15, 4.3, 0.25)):                               # a stiff little march under "with all due respect"
    snare(at, 0.012 if k % 2 == 0 else 0.007, 0.15, 0.5)
# ---------------------------------------------------------------- "she was guessing": melts back down
MELT = T['guessing'] - 0.05
slide(MELT, 84, 64, 0.8, 0.03, 0.0); creak(MELT + 0.15, 0.5, 0.016, 650, 40, 18, 0.15)
# ---------------------------------------------------------------- the spine lights up; the run of positions, one note each
m.shimmer(T['spine'] - 0.2, (79, 86, 91), 0.016, -0.1, 0.8, 2.2)
POS = [(T['move'] - 0.15, 72), (T['bend'] - 0.1, 74), (T['change'] - 0.1, 76), (T['position'] + 0.1, 79), (T['all'] - 0.05, 81), (T['not_'] - 0.05, 84)]
for k, (at, nn) in enumerate(POS):
    m.pluck(at + 0.03, nn, 0.05, -0.25 + 0.1 * k, 0.35, 5200); m.swish(at - 0.02, 0.3, 0.012, 0.0, f=1800)
    creak(at + 0.02, 0.12, 0.012, 1300 if k % 2 else 900, 70, 90, 0.15)
m.pulse(6.0, T['freeze'] - 0.15, 132, [65, 69, 72, 69], 0.006, 1700, lvl=lambda x: sm(6.0, 6.5, x))
m.pad([41, 53, 57, 60], 5.6, T['freeze'] - 0.12, 0.4, 1300, rel=0.05)
# ---------------------------------------------------------------- "freeze": snaps upright, the music stops dead, stone
FRZ = T['freeze'] - 0.12
snare(FRZ + 0.02, 0.05, 0.0); m.swish(FRZ - 0.05, 0.2, 0.02, 0.0, f=2400)
grind(T['freeze'] + 0.04, T['freeze'] + 0.55, 0.05, 0.0); m.thud(T['freeze'] + 0.42, 48, 0.09, 0.0, 0.3)
m.drone(T['freeze'] + 0.3, T['and1'] - 0.3, 33, 0.03, 300)
m.clink(T['pose'] + 0.25, 0.012, 0.3, f=3600)                                     # a pebble drops off
UN = T['and1'] - 0.42
crackle(UN, UN + 0.35, 70, 0.03, 0.0); grind(UN, UN + 0.3, 0.025, 0.0)
slide(T['and1'] - 0.28, 76, 58, 0.75, 0.024, 0.0); creak(T['and1'] - 0.1, 0.45, 0.014, 600, 40, 16, 0.15)
# ---------------------------------------------------------------- the case file: a walking bass, brushes; the stamp
m.whoosh(12.4, 1.0, 260, 2000, 0.014, -0.1)                                        # over the shoulder, down to the desk
m.rustle(13.3, 13.9, 0.012, 0.0)
BPM = 104; beat = 60 / BPM; walk = [38, 41, 45, 48, 50, 48, 45, 44, 43, 46, 50, 53, 50, 48, 45, 41, 38, 41, 45, 47, 48, 50, 52, 53]
k, at = 0, 13.05
while at < 19.6:
    lv = sm(13.05, 13.4, at) * (1 - sm(19.2, 19.6, at))
    bass(at, walk[k % len(walk)], 0.07 * lv, 0.5)
    if k % 2: brush(at + beat * 0.5, 0.2, 0.01 * lv, 0.25)
    k += 1; at += beat
m.pad([38, 50, 53, 57], 13.0, 19.6, 0.32, 900, att=0.6)
A1, A2 = T['evidence'] - 0.05, T['alibi'] + 0.05
for i, a in enumerate([A1, A2]):
    m.tock(a - 1.18, 0.03, -0.2, f=640)                                              # off the ink pad
    m.swish(a - 1.0, 0.6, 0.016, -0.15, f=1100)                                     # carried over
    m.swish(a - 0.13, 0.14, 0.03, 0.0, f=900)                                       # the wind-up, then
    stamp_slam(a, 0.22 if i == 0 else 0.25, 0.0)                                    # SLAM
    m.swish(a + 0.45, 0.6, 0.012, -0.15, f=1100); m.tock(a + 1.25, 0.025, -0.2, f=640)   # back on the pad
brass(A1 + 0.01, 50, 0.18, 0.02, 0.0); brass(A1 + 0.01, 53, 0.18, 0.014, 0.0)    # NO EVIDENCE: a low sting
brass(A1 + 0.22, 49, 0.55, 0.02, 0.0); brass(A1 + 0.22, 52, 0.55, 0.014, 0.0)
vibes(A2 + 0.02, [62, 66, 69, 73, 76], 0.05, 0.0, 1.4)                             # ALIBI CONFIRMED: a happy chord
m.bell(A2 + 0.25, 88, 0.012, 0.2, 0.8)
# ---------------------------------------------------------------- two lower-back curves: two tones that beat, then glide into one
m.whoosh(19.15, 1.0, 300, 1500, 0.012, 0.1)
m.tone_line(T['people'] - 0.05, T['looking'] - 0.1, 76, 0.012, -0.1)                 # white: no back pain
B0, B1 = T['different'] - 0.2, T['curve'] + 0.2
m.tone_line(T['dont'] - 0.15, T['looking'] - 0.1, 76, 0.012, 0.15, glide=lambda tt: 1.0 * (1 - np.clip((tt - B0) / (B1 - B0), 0, 1) ** 1.5))   # orange: a semitone off, sliding home
m.bell(T['curve'] + 0.2, 88, 0.014, 0.0, 0.9); m.shimmer(T['curve'] + 0.2, (88, 95, 100), 0.008, 0.0, 0.6, 1.8)
m.pad([43, 55, 59, 62], 19.7, 24.4, 0.34, 1100)
# ---------------------------------------------------------------- the neck: looking down, the protractor, the gauge
m.whoosh(23.95, 1.0, 280, 1600, 0.012, 0.1)
creak(T['looking'] - 0.05, 0.6, 0.012, 1500, 20, 45, -0.05)                           # the neck bends to the phone
for f in [25.9, 27.6, 29.4, 31.0]: m.swish(f, 0.3, 0.008, -0.1, f=2600); m.tick(f + 0.3, 0.004, -0.1, hi=3600, lo=1800)
m.scan(T['because'] - 0.3, 0.5, 0.012, 0.1)                                         # the protractor appears
for a in [T['because'], T['measured'], T['angle']]: ratchet(a + 0.02, a + 0.5, 4, 0.018, 0.1)
m.whoosh(31.75, 0.9, 260, 1300, 0.01, 0.0)
wahwah(T['didnt'] + 0.05, 0.03, -0.1)                                                # NECK PAIN: no change
m.pulse(24.6, T['if1'] - 0.3, 100, [67, 70, 74, 70], 0.004, 1300, lvl=lambda x: sm(24.6, 25.4, x) * (1 - sm(T['if1'] - 0.9, T['if1'] - 0.3, x)))
m.pad([40, 52, 55, 59], 24.4, T['if1'] - 0.2, 0.36, 1000)
# ---------------------------------------------------------------- the warnings: plain and steady
m.tick(T['if1'] - 0.1, 0.008, -0.1, hi=2400, lo=900)                                 # the phone's screen goes off
m.whoosh(34.5, 1.9, 240, 900, 0.008, 0.0)
m.pad([41, 53, 57, 60], 35.0, 41.5, 0.34, 900, att=1.0)
m.pad([38, 50, 55, 58], 41.5, 48.0, 0.32, 900)
m.pad([41, 53, 57, 62], 48.0, 54.2, 0.32, 950, rel=0.6)
# ---------------------------------------------------------------- the plan
TR = T['everyone'] + 0.28
m.swish(TR, 0.5, 0.014, -0.1, f=1300); clack(TR + 0.5, 0.05, -0.15); m.tick(TR + 0.65, 0.006, -0.15, hi=2400, lo=900)
for at in [T['strengthen'] + 0.17, T['strengthen'] + 0.62]: m.tock(at, 0.028, 0.0, f=760)                   # chin tucks
for at in [T['upper'] + 0.03, T['upper'] + 0.47]: creak(at, 0.16, 0.016, 700, 70, 40, 0.1); m.pluck(at + 0.05, 79, 0.03, 0.1, 0.25, 4000)   # squeezes
G = T['getup'] + 0.05
hiss(G + 0.1, 0.5, 0.012, 0.15); roll(G + 0.15, G + 1.1, 0.03, 0.2); creak(G, 0.4, 0.014, 500, 30, 18, 0.15)   # up: the chair rolls back
# the wall clock races an hour (10:58 to 11:58), one tick per minute it passes, no faster than 24 a second
CK = [(-5, 10 * H + 57 * 60), (T['once'] - 0.1, 10 * H + 58 * 60), (T['hour'] + 0.4, 11 * H + 58 * 60), (T['end'], 11 * H + 59 * 60)]
def clock(t):
    for (a, va), (b, vb) in zip(CK, CK[1:]):
        if t < b: return va + (vb - va) * s5(a, b, t)
    return CK[-1][1]
x, last, prev = T['once'] - 0.12, -9.0, math.floor(clock(T['once'] - 0.12) / 60)
while x < T['hour'] + 0.45:
    mn = math.floor(clock(x) / 60)
    if mn != prev and x - last >= 1 / 24: m.tick(x, 0.03 * rng.uniform(0.75, 1.0), 0.35, hi=2100, lo=760); last = x
    prev = mn; x += 0.001
m.bell(T['hour'] + 0.42, 84, 0.022, 0.35, 0.9, buf='X')
F0 = T['hour'] + 0.05; f_m = 1.3
for k in range(1, 5):                                                                # footsteps: marching on the spot
    at = F0 + k / (2 * f_m)
    if at < T['because2'] - 0.05: step(at, 0.035 * pulse_(at, F0, T['because2'] - 0.05, 0.25) + 0.012, 0.0)
S0 = T['because2'] - 0.1                                                            # sitting back: the chair rolls in, takes the weight, reclines
roll(S0 + 0.2, S0 + 1.0, 0.025, 0.2); m.thud(S0 + 1.05, 70, 0.05, 0.1, 0.12); hiss(S0 + 1.05, 0.35, 0.01, 0.15)
creak(S0 + 1.0, 0.5, 0.016, 520, 18, 30, 0.15)
m.pulse(54.4, 59.75, 112, [65, 69, 72, 77], 0.005, 1500, lvl=lambda x: sm(54.4, 55.2, x) * (1 - sm(59.3, 59.75, x)))
m.pad([41, 53, 60, 65], 54.2, 59.9, 0.48, 1400)
m.pad([41, 53, 57, 64], 59.9, 63.7, 0.42, 1200)
for at, nn in [(T['because2'] + 0.05, 72), (61.9, 76), (62.4, 79)]: m.pluck(at, nn, 0.035, 0.0, 0.5, 3600)
# ---------------------------------------------------------------- the camera's moves; the hoop becomes the logo
for a, b, g, pan in [(4.95, 6.2, 0.012, 0.1), (56.95, 57.9, 0.016, 0.1), (59.75, 61.0, 0.014, 0.1), (62.45, 64.4, 0.014, 0.0)]:
    m.whoosh(a, b - a, 250, 1800, g, pan)
m.shimmer(T['final'] + 0.5, (74, 81, 86), 0.01, 0.0, 0.9, 2.4)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
m.pad([41, 53, 60, 65, 69, 72], 63.6, T['end'], 1.0, 2400, rel=0.2)
m.room(0.005)
m.finish(REPORT, VOICE, OUT, 'film02')
