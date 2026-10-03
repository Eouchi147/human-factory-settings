"""Film 9 "The breath that calms you down": score and sound design, timed to films/film09.js (the same breath and heart).
Usage: python3 sound_film09.py <voice guide wav> <voice report json> <out dir>"""
import sys
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=79.0, q0=0.35, in_=1.10, heart=1.62, out=3.41, slows=4.62, already=6.38, sigh=6.85, second=10.11, top=10.90,
         reopen=12.37, tiny=12.91, sacs=13.60, fold=14.29, shut=14.90, stanford=16.61, hundred=17.58, people=18.41, five=20.88,
         month=25.42, sighing=26.53, two=27.85, one=28.73, lifted=30.18, good=30.74, more=31.18, did=33.20, anxious=35.39,
         dropped=35.80, much=36.77, trial=39.51, no=39.88, nothing=40.17, group=40.69, across=42.08, twelve=42.90, trials=43.20,
         cut=45.20, small=46.40, medium=47.01, useful=48.68, magic=49.80, longer=51.08, twelveweek=53.71, equal=56.29,
         skip=58.29, fast=59.22, drop=61.61, dizzy=64.40, never=65.03, water=67.00, struggling=68.31, see=72.84, doctor=73.56,
         final=74.88, settings=76.04, logo=76.74)
m = Mix(T['end'], seed=20261009)
rng = np.random.default_rng(99)
def s5(a, b, x):
    u = float(np.clip((x - a) / (b - a), 0, 1)); return u * u * u * (u * (u * 6 - 15) + 10)
def s5v(a, b, x):
    u = np.clip((x - a) / (b - a), 0, 1); return u * u * u * (u * (u * 6 - 15) + 10)

# ---------------------------------------------------------------- the same breath as the picture (films/film09.js breathAt)
segs = []
def add(t0, a, b, k=1.0, hold=0.0): segs.append(dict(t0=t0, a=a, b=b, k=k, hold=hold))
add(0.55, 2.2, 0, 1.0, 0.55); add(3.3, 0, 2.4, 1.0)
s_ = 6.0
while s_ < 9.3: add(s_, 1.7, 2.6, 0.65); s_ += 4.6
segs.append(dict(sigh=True, t0=9.55, a1=0.9, a2=0.75, b=3.2))
s_ = 14.6
while s_ < 26.6: add(s_, 1.8, 2.8, 0.6); s_ += 4.8
for st in (27.7, 32.1): segs.append(dict(sigh=True, t0=st, a1=0.65, a2=0.55, b=3.0))
s_ = 36.4
while s_ < 50.6: add(s_, 1.8, 2.8, 0.6); s_ += 4.8
add(51.0, 1.6, 3.2, 0.7); add(55.9, 1.8, 1.8, 0.7)
s_ = 59.0
while s_ < 64.9: add(s_, 0.42, 0.46, 1.0); s_ += 0.92
s_ = 65.6
while s_ < 81: add(s_, 1.9, 2.9, 0.6); s_ += 4.9
def breath_at(t):
    v = 0.0
    for g in segs:
        if t < g['t0']: continue
        u = t - g['t0']
        if g.get('sigh'):
            i1 = s5(0, g['a1'], u) * 0.72; i2 = s5(g['a1'] + 0.08, g['a1'] + 0.08 + g['a2'], u) * 0.28
            o = 1 - s5(g['a1'] + g['a2'] + 0.15, g['a1'] + g['a2'] + 0.15 + g['b'], u)
            if u < g['a1'] + g['a2'] + 0.15 + g['b']: v = (i1 + i2) * o * 1.15
        else:
            a, b, k, hold = g['a'], g['b'], g['k'], g['hold']
            up = s5(0, a, u) if a > 0 else 1; dn = 1 - s5(a + hold, a + hold + b, u) if b > 0 else 1
            if b == 0: v = k * up
            elif a == 0:
                if u < b: v = k * (1 - s5(0, b, u))
            elif u < a + hold + b: v = k * up * dn
    return v
dt = 0.002; ts = np.arange(0, T['end'] + 1, dt); B = np.array([breath_at(x) for x in ts]); dB = np.gradient(B, dt)
beats = []; ph = 0.0
for i, t in enumerate(ts):
    drill = float(ss(58.8, 59.6, t) * (1 - ss(64.6, 66.0, t)))
    hr = 64 + 9 * np.tanh(dB[i] * 1.4) + 14 * drill; ph += hr / 60 * dt
    if ph >= 1: ph -= 1; beats.append(t)

# ---------------------------------------------------------------- the breath: air in (higher, brighter), air out (lower, longer)
tt = m.t(0, T['end']); rate = np.interp(tt, ts, dB); n = len(tt)
inh = np.clip(rate, 0, None); exh = np.clip(-rate, 0, None)
level = lambda r: np.clip(r / 1.2, 0, 1.6) ** 0.8
air_in = bp(m.noise(n), 900, 5200) * level(inh); air_out = bp(m.noise(n), 300, 2600) * level(exh)
near = 0.55 + 0.45 * (ss(-1, 0, tt) * (1 - ss(11.6, 12.4, tt)) + ss(26.8, 27.6, tt) * (1 - ss(30.5, 31.5, tt)) + ss(58.4, 59.0, tt) * (1 - ss(67.0, 68.0, tt)))
m.add('X', (air_in * 0.010 + air_out * 0.008) * near * (1 - ss(T['final'], T['logo'], tt)), 0, 0.0)

# ---------------------------------------------------------------- the heart: soft, under everything; the recorder's stylus jumps with it
for b in beats:
    if b > T['logo'] - 0.4: break
    g = 0.05 * (1.4 if (b < 6 or 58.8 < b < 66) else 1.0)
    m.heartbeat(b, g, 0.0)
    m.tick(b + 0.005, 0.006, 0.35, hi=5200, lo=2600)
tt2 = m.t(0, T['logo']); hum = lp(np.sin(2 * np.pi * 50 * tt2) + 0.4 * np.sin(2 * np.pi * 100 * tt2), 400) * 0.0016
m.add('X', hum * ss(0, 1, tt2) * (1 - ss(T['logo'] - 1, T['logo'], tt2)), 0, 0.35)                                 # the recorder's motor

# ---------------------------------------------------------------- the air sacs open (soft pops), two fold again
for k in range(9): m.pluck(T['reopen'] - 0.1 + k * 0.11 + rng.uniform(0, 0.05), int(rng.integers(79, 91)), 0.012, -0.35, 0.12, bright=5000)
m.tone_line(T['fold'] - 0.2, T['shut'] + 0.6, 76, gain=0.008, pan=-0.35, glide=lambda t: -4 * ss(T['fold'], T['shut'] + 0.4, t))

# ---------------------------------------------------------------- the trial: 108 people arrive; five minutes; a month
m.whoosh(T['stanford'] - 0.5, 1.1, 300, 1600, 0.02, 0.0)
m.rain(T['hundred'] - 0.3, T['hundred'] + 1.6, 108, 0.012, (82, 98), seed=9)
for k in range(5): m.tock(T['five'] + 0.1 + k * 0.12, 0.02, 0.2, f=900)
m.rustle(T['month'] - 0.2, T['month'] + 0.5, 0.01, 0.2)
# good mood: the sighing column rises higher than meditation's; anxiety: both fall the same
m.tone_line(T['lifted'], T['more'] + 0.6, 69, gain=0.012, pan=-0.2, glide=lambda t: 5 * ss(T['lifted'], T['more'], t))
m.tone_line(T['lifted'] + 0.05, T['more'] + 0.6, 69, gain=0.009, pan=0.2, glide=lambda t: 2.5 * ss(T['lifted'], T['more'], t))
for pan in (-0.2, 0.2): m.tone_line(T['dropped'], T['much'] + 0.6, 72, gain=0.009, pan=pan, glide=lambda t: -4 * ss(T['dropped'], T['much'] + 0.3, t))
# the do-nothing group: nobody there (the placard comes up, then the room is quiet)
m.thud(T['no'] - 0.25, 140, 0.02, 0.2, 0.05)
# twelve trials drop into the gauge; small to medium
for k in range(12): m.tick(T['trials'] + 0.6 + k * 0.06 + 0.35, 0.02, 0.0, hi=3000, lo=1300)
m.tone_line(T['cut'] - 0.1, T['medium'] + 0.6, 64, gain=0.01, pan=0.0, glide=lambda t: 3 * ss(T['cut'], T['medium'], t))
m.pluck(T['magic'] + 0.4, 60, 0.018, 0.0, 0.5)
# longer out-breaths, on paper: the stylus
m.rustle(T['longer'], T['equal'] + 1.0, 0.004, 0.35)
# the drill: dizzy (a slow detuned wobble), then calm
tt3 = m.t(T['drop'] - 0.2, T['never'] + 0.6); wob = np.sin(2 * np.pi * note(52) * tt3) * np.sin(2 * np.pi * note(52) * 1.012 * tt3 + 0.4)
m.add('M', lp(wob, 600) * 0.03 * ss(tt3[0], tt3[0] + 1.2, tt3) * (1 - ss(tt3[-1] - 0.8, tt3[-1], tt3)), tt3[0], 0.0)

# ---------------------------------------------------------------- the score: pads that swell a little with each breath in
m.pad([41, 53, 57, 60], 0.0, 15.6, 0.5, 1000)                       # breathe; a sigh; air sacs
m.pad([43, 55, 58, 62], 15.6, 26.4, 0.5, 1100)                      # the trial
m.pad([41, 53, 57, 60, 64], 26.4, 41.8, 0.55, 1300)                 # sighing on purpose; mood; anxiety; nobody
m.pad([38, 50, 53, 57], 41.8, 58.0, 0.5, 1000)                      # small to medium; longer out-breaths
m.pad([36, 48, 51, 55], 58.0, 67.8, 0.5, 800)                       # the drill
m.pad([38, 50, 57, 62], 67.8, 74.8, 0.5, 900)                       # see a doctor
m.pad([41, 53, 60, 65, 69, 72], 74.8, T['end'], 1.0, 2400, rel=0.2)
m.pulse(16.6, 26.0, 84, [65, 69, 72, 69], 0.012, 1300, lvl=lambda t: float(ss(16.6, 17.4, t)) * (1 - float(ss(25.2, 26.0, t))))
# the end: the dial rises, turns to 15, the logo
m.whoosh(T['final'] - 0.7, 0.9, 200, 1300, 0.02, 0.3); m.thud(T['final'] + 0.25, 110, 0.03, 0.3, 0.07)
for k in range(1, 16):
    m.tick(T['final'] + (T['settings'] - T['final']) * s5(0, 1, k / 15) * 0.98, 0.02, 0.3, hi=3300, lo=1500)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
m.room(0.005)
m.finish(REPORT, VOICE, OUT, 'film09')
