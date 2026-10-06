"""Film 3 "Do you really need 10,000 steps?" (new direction): score and sound design, timed to films/film03.js.
The walk is an oom-pah march played by his own feet: a tuba note on every heel strike (from the same walk the picture uses),
a chord between steps. The pedometer clicks on each step (loud in its close-ups) and dings at 10,000. On "slogan" the card
spins and a cash register rings. The contraption drops with a slide whistle and clatters on the floor. Points of light
arrive and settle into a line; the hill rises. Climbing, the tuba climbs with the hill: big steps up at first, then the
same note over and over (the flat). Brain and hips glow (two warm bells). The pedometer is unclipped and drops (a click,
a clink, a bounce). "A link, not proof": the line tears into dashes. The plan: 7,000 rings in orange, the stairs light
up one note at a time; a paper bag, a run up the stairs, a phone ring; the couch pops up and sighs. The dial is the logo.
Usage: python3 sound_film03.py <voice guide wav> <voice report json> <out dir>"""
import sys, math
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=70.0, logo=67.52, day=2.52, slogan=16.93, need=20.61, people=23.38, seven=24.56, half=27.22, two=30.85,
         they=32.41, dementia=34.07, falls=34.99, above=35.77, small=38.66, walkmore=40.6, owe=42.62, anything=43.63,
         link=46.55, proof=47.01, so=51.61, aim=52.15, seven3=52.83, add=56.18, walk3=58.73, shop=59.54, stairs=60.17,
         phone=61.37, foot=62.27, your3=63.07, couch=63.51, survive=64.0, final=65.26, settings=66.84)
H0 = 19.3
m = Mix(T['end'], seed=20261020)
rng = np.random.default_rng(303)
def sm(a, b, x): return float(ss(a, b, x))

# ---------------------------------------------------------------- the walk, exactly as the picture walks it (films/film03.js)
STRIDE = 7.9 / 7; S_STOP1 = 0.25 * STRIDE
W1 = dict(t0=0.0, t1=17.9, d=13.2, ramp=1.4); W2 = dict(t0=23.0, t1=31.3, d=7 * STRIDE, ramp=0.7)
def walk1(t):
    v = W1['d'] / (W1['t1'] - W1['t0'] - W1['ramp'] / 2)
    if t < W1['t1'] - W1['ramp']: return v * (t - W1['t0'])
    r = max(0.0, W1['t1'] - t); return W1['d'] - v * r * r / (2 * W1['ramp'])
def ease(t, w):
    TT = w['t1'] - w['t0']; v = w['d'] / (TT - w['ramp']); u = min(max(t - w['t0'], 0), TT)
    if u < w['ramp']: return v * u * u / (2 * w['ramp'])
    if u > TT - w['ramp']: r = TT - u; return w['d'] - v * r * r / (2 * w['ramp'])
    return v * (u - w['ramp'] / 2)
def s_at(t): return S_STOP1 - W1['d'] + walk1(t) if t < W2['t0'] else S_STOP1 + ease(t, W2)
ts = np.arange(0, T['end'], 1 / 1000); sv = np.array([s_at(t) for t in ts])
steps = [ts[i] for i in range(1, len(ts)) if sv[i] > sv[i - 1] and math.floor(sv[i] / (STRIDE / 2)) > math.floor(sv[i - 1] / (STRIDE / 2))]
steps1 = [x for x in steps if x < W2['t0']]; steps2 = [x for x in steps if x >= W2['t0']]
settle1, settle2 = W1['t1'] - 0.05, W2['t1'] - 0.05
# the hill under each climbing step (the same curve as the picture), for the tuba's pitch
PER, H, KC = 1.5, 1.1, 0.45; NORM = 1 - math.exp(-5 * KC)
def hill(z):
    if z <= -0.25: return 0.0
    x = max(0.0, z / PER); y = H * (1 - math.exp(-KC * x)) / NORM; u = min(max((z + 0.25) / 0.7, 0), 1)
    return y * u * u * (3 - 2 * u)
Z0 = -0.45 - 0.27   # the pelvis rides at z = Z0 + s; the leading heel lands about 0.28 ahead of it

# ---------------------------------------------------------------- instruments and effects made here
def tuba(at, nn, dur=0.3, gain=0.05, pan=-0.08):   # a round, slightly buzzy low brass note with a small scoop up into pitch
    n = int((dur + 0.25) * SR); x = np.arange(n) / SR; f = note(nn) * (1 - 0.035 * np.exp(-x / 0.035))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = sum(np.sin(k * ph) / k ** 1.3 for k in range(1, 9))
    e = np.minimum(1, x / 0.018) * (1 - ss(dur - 0.05, dur + 0.18, x)) * (0.75 + 0.25 * np.exp(-x / 0.08))
    m.add('M', lp(s * e, 650 + 300 * (nn > 45)) * gain, at, pan)
def pah(at, notes, gain=0.016, pan=0.12):   # the off-beat chord: short, bright, plucked
    for k, nn in enumerate(notes): m.pluck(at + 0.004 * k, nn, gain, pan, 0.11, 3400)
def footstep(at, gain=0.05, pan=0.0, heavy=0.0):   # a bony foot on a hard floor
    n = int(0.3 * SR); x = np.arange(n) / SR
    tap = bp(m.noise(n), 900, 5200) * env(n, 0.0008, 0.012) * 0.7 + np.sin(2 * np.pi * (95 + 40 * heavy) * x) * env(n, 0.002, 0.05)
    m.add('X', (tap + bp(m.noise(n), 2500, 8000) * env(n, 0.02, 0.05) * 0.15) * gain, at, pan)
def register(at, gain=0.05, pan=0.15):   # a cash register: a key clunk, a drawer, and the bell
    n = int(0.25 * SR); x = np.arange(n) / SR
    m.add('X', (bp(m.noise(n), 600, 3000) * env(n, 0.001, 0.02) + np.sin(2 * np.pi * 180 * x) * env(n, 0.002, 0.04) * 0.6) * gain, at, pan)
    t0 = at + 0.08; d = 0.32; n = int(d * SR); x = np.arange(n) / SR
    roll = bp(m.noise(n), 300, 1800) * (0.5 + 0.5 * (np.sin(2 * np.pi * 38 * x) > 0)) * np.sin(np.pi * np.clip(x / d, 0, 1)) ** 0.5
    m.add('X', roll * gain * 0.5, t0, pan)
    m.thud(t0 + d - 0.02, 140, gain * 0.9, pan, 0.06)
    for nn, g in [(96, 1.0), (100, 0.7), (103, 0.5)]: m.bell(at + 0.12, nn, gain * 0.55 * g, pan, 0.6, buf='X')
def slide(at, n0, n1, dur, gain=0.03, pan=0.0):   # a slide whistle: a breathy pure tone gliding
    n = int(dur * SR); x = np.arange(n) / SR; u = np.clip(x / dur, 0, 1)
    f = note(n0) * (note(n1) / note(n0)) ** (u ** 0.8) * (1 + 0.006 * np.sin(2 * np.pi * 6 * x))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.08 * bp(m.noise(n), 900, 5000)
    m.add('X', s * np.minimum(1, x / 0.03) * (1 - ss(dur - 0.08, dur, x)) * gain, at, pan)
def clatter(at, gain=0.06, pan=-0.1):   # a wooden rod, a headband and a card hitting the floor
    m.tock(at, gain * 1.2, pan, f=520); m.tock(at + 0.07, gain * 0.7, pan - 0.05, f=690)
    n = int(0.12 * SR); m.add('X', bp(m.noise(n), 1200, 7000) * env(n, 0.0005, 0.015) * gain * 0.8, at + 0.03, pan + 0.1)   # the card slaps
    m.thud(at, 90, gain * 0.5, pan, 0.08); m.tock(at + 0.22, gain * 0.35, pan, f=600)                                           # and settles
def tink(at, gain, pan, nn):   # a point of light settling into place
    n = int(0.12 * SR); x = np.arange(n) / SR
    m.add('X', np.sin(2 * np.pi * note(nn) * x) * env(n, 0.0008, 0.03) * gain, at, pan)
def zip_(at, dur, count, gain=0.015, pan=-0.1):   # a line tearing into dashes: quick little ticks
    for i in range(count): m.tick(at + dur * i / count, gain * rng.uniform(0.7, 1.0), pan, hi=4200, lo=1500)
def rustle(at, dur, gain=0.02, pan=0.2): m.rustle(at, at + dur, gain, pan)
def ring(at, gain=0.012, pan=0.25):   # a phone: two short trills
    for k in range(2):
        n = int(0.32 * SR); x = np.arange(n) / SR; f = np.where(np.sin(2 * np.pi * 18 * x) > 0, 1320.0, 1660.0)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, x / 0.01) * (1 - ss(0.28, 0.32, x))
        m.add('X', lp(s, 4000) * gain, at + k * 0.38, pan)
def bwomp(at, gain=0.05, pan=-0.2):   # a big soft thing popping up: a springy low note
    n = int(0.6 * SR); x = np.arange(n) / SR; f = 70 * (1 + 0.5 * np.exp(-x / 0.06) * np.cos(2 * np.pi * 9 * x))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.004, 0.18)
    m.add('X', s * gain, at, pan); m.swish(at - 0.05, 0.3, gain * 0.25, pan, f=900)
def sigh(at, gain=0.03, pan=-0.2):   # cushions breathing out: air, falling
    d = 0.75; n = int(d * SR); x = np.arange(n) / SR; out = np.zeros(n); wn = m.noise(n + 4800); blk = 1200
    for i in range(0, n, blk):
        u = i / n; f = 1500 * (300 / 1500) ** u
        seg = bp(wn[i:i + blk + 4800], f * 0.6, f * 1.6)[-blk:]; out[i:i + blk] = seg[:len(out[i:i + blk])]
    m.add('X', out * np.sin(np.pi * np.clip(x / d, 0, 1)) ** 0.8 * gain, at, pan)
    m.thud(at + 0.05, 60, gain * 0.6, pan, 0.12)

# ---------------------------------------------------------------- walk 1: an oom-pah march on his own feet
BARS = [   # (bass notes for the steps of a bar, off-beat chord) in F; four steps to a bar
    ([41, 48, 41, 48], [57, 60, 65]), ([41, 48, 41, 48], [57, 60, 65]), ([36, 43, 36, 43], [55, 58, 64]), ([41, 48, 41, 48], [57, 60, 65]),
    ([46, 41, 46, 41], [58, 62, 65]), ([41, 48, 41, 48], [57, 60, 65]), ([36, 43, 36, 43], [55, 58, 64]), ([43, 48, 43, 48], [55, 58, 64])]
lvl1 = lambda t: sm(0.0, 1.2, t) * (1 - 0.35 * sm(5.4, 6.4, t) * (1 - sm(14.0, 15.0, t)))   # softer under the close-ups
for k, at in enumerate(steps1):
    if at > W1['t1'] - 0.3: break
    bass, chord = BARS[(k // 4) % len(BARS)]
    tuba(at + 0.01, bass[k % 4], 0.28, 0.055 * lvl1(at))
    if k + 1 < len(steps1): pah((at + steps1[k + 1]) / 2, chord, 0.014 * lvl1(at))
    footstep(at, 0.05 if not (5.6 < at < 14.4) else 0.065, 0.1 if k % 2 else -0.1)
footstep(settle1, 0.04, 0.0)
tuba(settle1 + 0.02, 48, 0.2, 0.04); tuba(settle1 + 0.3, 41, 0.5, 0.05)          # the march stops with him: dum, dum
# the pedometer clicks on every step while it rides his hip (close up it is loud), and dings at 10,000
for at in steps:
    if at > T['anything'] - 0.25: break
    near = 1.0 if 5.9 < at < 14.2 else 0.35
    m.tick(at + 0.02, 0.05 * near, -0.1, hi=3300, lo=1500)
m.bell(T['day'] + 0.02, 88, 0.035, -0.1, 0.5, buf='X'); m.bell(T['day'] + 0.12, 93, 0.025, -0.1, 0.45, buf='X')
m.whoosh(5.2, 1.4, 260, 1800, 0.012, -0.1); m.whoosh(13.6, 1.8, 260, 1800, 0.012, 0.1)   # down to the hip, back up to the card
m.pad([41, 53, 57, 60], 0.0, 17.9, 0.16, 900, att=0.8)
# "slogan": the card spins round, and a cash register rings
m.swish(T['slogan'] - 0.12, 0.45, 0.03, 0.15, f=2200)
register(T['slogan'] + 0.38, 0.06, 0.15)

# ---------------------------------------------------------------- he stops; the contraption drops; the hill gathers
m.pad([38, 50, 57, 62], 18.0, 23.0, 0.3, 1000)
TD = T['need'] - 0.05; TRc = T['need'] + 0.11; TF = math.sqrt(2 * (1.8539 - 0.011) / 9.8)   # it pops off the crown, then falls from there (film03 CAR)
m.snip(TD, 0.05, -0.1); slide(TD + 0.02, 86, 62, TRc - TD + TF - 0.02, 0.03, -0.1)
clatter(TRc + TF, 0.07, -0.1); m.tock(TRc + TF + 0.22, 0.02, -0.1, f=620)
rr = np.random.default_rng(57)
for i in range(57):   # 57 points of light: each appears, flies, and settles on the line (as the picture times them)
    k = i / 56; a0 = H0 - 0.3 + k * 0.8 + 0.1; land = H0 + 2.2 + k * 0.9 - 0.15
    n = int(0.05 * SR); x = np.arange(n) / SR; f = note(rr.uniform(86, 98))
    m.add('X', np.sin(2 * np.pi * f * x) * env(n, 0.001, 0.01) * 0.012 * rr.uniform(0.5, 1), a0, rr.uniform(-0.6, 0.6))
    tink(land, 0.008 * rr.uniform(0.6, 1), -0.3 + 0.6 * k, 84 + 12 * k)
m.tone_line(H0 + 1.2, H0 + 4.2, 60, 0.03, -0.1, glide=lambda t: 9 * (1 - np.exp(-3 * np.clip((t - H0 - 1.2) / 2.8, 0, 1))) / (1 - math.exp(-3)))
m.drone(H0 + 0.8, H0 + 4.6, 29, 0.05, 260)                                        # the hill rises
m.whoosh(21.5, 1.6, 240, 1400, 0.016, 0.0)                                         # out to his side

# ---------------------------------------------------------------- the climb: the tuba climbs with the hill, then the flat
SCALE = [0, 2, 4, 5, 7, 9, 11]
def deg(d): return 41 + 12 * (d // 7) + SCALE[d % 7]
lvl2 = lambda t: sm(W2['t0'], W2['t0'] + 0.6, t)
for k, at in enumerate(steps2):
    if at > W2['t1'] - 0.2: break
    zh = Z0 + s_at(at) + 0.28; d = int(round(9 * hill(zh) / H))
    tuba(at + 0.01, deg(d), 0.28, 0.055 * lvl2(at))
    if k + 1 < len(steps2): pah((at + steps2[k + 1]) / 2, [deg(d + 14), deg(d + 16), deg(d + 18)], 0.012 * lvl2(at))
    footstep(at, 0.055, 0.1 if k % 2 else -0.1, 0.6)
footstep(settle2, 0.045, 0.0)
tuba(settle2 + 0.02, deg(9), 0.25, 0.045); m.bell(settle2 + 0.05, 81, 0.02, 0.0, 1.0); m.bell(settle2 + 0.08, 84, 0.016, 0.1, 1.0)   # the top
m.pad([41, 53, 57, 60], 23.0, 31.4, 0.26, 1300)
m.pluck(T['seven'] + 0.05, 77, 0.02, 0.2, 0.4, 4000)                                # the 7,000 tag
m.pluck(T['half'] + 0.05, 81, 0.022, 0.25, 0.5, 4000); m.pluck(T['half'] + 0.12, 84, 0.016, 0.25, 0.5, 4000)   # "about half"

# ---------------------------------------------------------------- the top: brain, hips, the flat
m.pad([41, 53, 60, 64, 69], 31.4, 40.2, 0.34, 1900)
m.whoosh(32.6, 1.0, 260, 1600, 0.012, -0.1)
m.bell(T['dementia'] + 0.05, 76, 0.03, -0.15, 1.2); m.shimmer(T['dementia'] - 0.1, (76, 83, 88), 0.008, -0.15, 0.8, 2.0)
m.whoosh(34.45, 0.95, 260, 1400, 0.012, 0.1)
m.bell(T['falls'] + 0.05, 72, 0.03, 0.1, 1.2)
m.whoosh(35.5, 1.8, 240, 1300, 0.012, 0.0)
m.tone_line(36.4, 40.1, 69, 0.012, 0.15)                                            # past 7,000: one flat note
m.pluck(T['small'] + 0.05, 96, 0.012, 0.3, 0.2, 6000)                                # "small": a tiny one
m.whoosh(40.0, 1.0, 260, 1500, 0.012, -0.1); m.whoosh(41.0, 0.9, 260, 1500, 0.01, 0.1)

# ---------------------------------------------------------------- the pedometer: unclipped and dropped
m.pad([46, 53, 58, 62], 40.2, 45.4, 0.28, 1200)
TR = T['anything'] - 0.25; TP = math.sqrt(2 * (2.1082 - 1.1215) / 9.8)
m.tick(T['owe'] + 0.12, 0.02, -0.1, hi=2600, lo=900)                                 # fingers on the case
m.tick(TR - 0.03, 0.05, -0.1, hi=3600, lo=1200); m.tick(TR, 0.03, -0.1, hi=2200, lo=800)   # the clip lets go
m.swish(TR + 0.02, TP, 0.012, -0.1, f=1800)
m.clink(TR + TP, 0.06, -0.1, f=2950); m.clink(TR + TP + 0.22, 0.025, -0.1, f=3100)     # it lands, and bounces once
m.whoosh(43.4, 0.8, 240, 1400, 0.012, -0.1)
m.whoosh(45.2, 1.2, 260, 1500, 0.01, 0.1)

# ---------------------------------------------------------------- "a link, not proof"
m.pad([38, 50, 57], 45.4, 51.6, 0.24, 800)
zip_(T['link'] - 0.1, 0.5, 14, 0.016, -0.15)
m.drone(47.6, 51.4, 38, 0.02, 400)
m.whoosh(50.6, 1.8, 240, 1500, 0.014, 0.0)

# ---------------------------------------------------------------- the plan: 7,000 in orange, the stairs, a thousand at a time
m.pad([41, 53, 57, 60, 65], 51.6, 58.6, 0.34, 1900)
m.pulse(51.8, 58.4, 82, [65, 69, 72, 69], 0.005, 1500, lvl=lambda x: sm(51.8, 52.6, x) * (1 - sm(57.9, 58.4, x)))
m.bell(T['seven3'] + 0.02, 77, 0.035, 0.0, 1.4); m.shimmer(T['seven3'] + 0.02, (77, 84, 89), 0.008, 0.1, 0.9, 2.2)
for i, nn in enumerate([69, 72, 74, 77, 79]): m.pluck(T['add'] + i * 0.28 + 0.03, nn, 0.03, -0.3 + 0.15 * i, 0.45, 4200)
m.whoosh(57.9, 1.3, 260, 1700, 0.012, 0.1)

# ---------------------------------------------------------------- the shop, the stairs, the call
m.pad([46, 58, 62, 65], 58.6, 60.6, 0.3, 1600); m.pad([48, 55, 60, 64], 60.6, 63.1, 0.3, 1600)
rustle(T['shop'] - 0.38, 0.4, 0.016, 0.2); m.pluck(T['shop'] - 0.12, 84, 0.02, 0.2, 0.25, 5000)   # the bag pops into his hand
m.whoosh(59.65, 0.6, 300, 2600, 0.02, 0.1)                                           # out: the stairs
for i, nn in enumerate([65, 69, 72, 77, 81]): m.pluck(T['stairs'] - 0.05 + i * 0.07, nn, 0.03, -0.2 + 0.1 * i, 0.3, 5000)
m.whoosh(60.65, 0.7, 300, 2600, 0.018, -0.1, up=False)                              # back in
ring(T['phone'] - 0.62, 0.01, 0.25); m.tick(T['phone'] - 0.28, 0.02, 0.25, hi=2400, lo=900)   # it rings; he answers
m.whoosh(62.4, 1.0, 260, 1500, 0.012, -0.1)

# ---------------------------------------------------------------- the couch
m.tick(T['your3'] - 0.5, 0.02, -0.25, hi=1800, lo=600)                               # its lamp
bwomp(T['your3'] - 0.42, 0.05, -0.2)                                                 # it pops up
sigh(T['survive'] + 0.02, 0.035, -0.2)
m.pad([41, 53, 57, 62], 63.1, 65.3, 0.3, 1200)

# ---------------------------------------------------------------- the end: up to the dial; the needle swings to twelve; the logo
m.whoosh(64.6, 1.7, 220, 2600, 0.03, 0.0)
m.shimmer(T['final'] + 0.5, (74, 81, 86), 0.01, 0.0, 0.9, 2.4)
m.logo_end(T['logo'] - 0.15, T['logo'])
m.pad([41, 53, 60, 65, 69, 72], 65.2, T['end'], 1.0, 2400, rel=0.2)
m.room(0.005)
# the body of the film sits about 2.5 dB up against the ending, to match film 2's balance
tt = np.arange(m.N) / SR; g = 1.35 - 0.35 * ss(64.5, 66.0, tt)
for c in range(2): m.M[c] *= g; m.X[c] *= g
m.finish(REPORT, VOICE, OUT, 'film03')
print('steps', len(steps), len(steps1), len(steps2), [round(x, 2) for x in steps2[:4]], 'fall', round(TRc + TF, 2), 'drop', round(TR + TP, 2))
