"""Film 14 "Does intermittent fasting work?": score and sound design, timed to films/film14.js (the same clock, balance,
newspaper and stamps). Usage: python3 sound_film14.py <voice guide wav> <voice report json> <out dir>"""
import sys
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=76.7, fasting=0.35, trust=2.26, clock=3.19, trial=4.91, noon=7.29, eight=8.02, noCal=8.72, after=11.01, noMore=12.25,
         calories=15.64, year=18.58, limit=22.42, one=23.21, eight2=25.07, four=25.56, noSig=26.56, scare=29.54, t91=33.14,
         conf=38.6, notPeer=40.14, times=41.96, twoDays=43.09, link=45.11, across=47.32, t99=48.14, beat=50.93, against=52.96,
         tie=55.62, works=56.74, because=58.72, isOne=59.55, pregnant=60.8, diabetes=66.12, back=72.53, factory=73.39,
         settings=73.69, logo=74.4)
m = Mix(T['end'], seed=20261014)
rng = np.random.default_rng(1414)
def s5(a, b, x):
    u = np.clip((np.asarray(x, dtype=float) - a) / (b - a), 0, 1); return u * u * u * (u * (u * 6 - 15) + 10)

# ---------------------------------------------------------------- the clock: a tick a second while time runs; a ratchet while the hands fly
FF = [(T['eight'] - 0.3, T['noCal'] + 0.4), (T['one'] - 0.2, T['eight2']), (T['four'] - 0.2, T['noSig']), (T['works'] - 0.4, T['works'] + 0.6)]
near = lambda x: 0.45 + 0.55 * float(ss(-1, 0.5, x) * (1 - ss(5.8, 6.8, x)) + ss(56.4, 57.2, x) * (1 - ss(60.2, 61.2, x)) + ss(72.4, 73.2, x))
for k in range(0, int(T['logo'])):
    at = k + 0.42
    if any(a - 0.2 < at < b + 0.2 for a, b in FF): continue
    if at > T['back'] + 0.6: break
    m.tick(at, 0.008 * near(at) * (1.0 if k % 2 else 0.8), 0.05, hi=3600, lo=1700)
for a, b in FF:   # the hands fly: a fine ratchet, its rate following the sweep
    tt = m.t(a, b); n = len(tt); u = (tt - a) / (b - a); rate = 70 * np.sin(np.pi * np.clip(u, 0, 1)) ** 0.8 + 6
    clicks = (np.diff(np.floor(np.cumsum(rate) / SR), prepend=0) > 0).astype(float)
    m.add('X', bp(clicks + 0.02 * m.noise(n), 2500, 7000) * 0.05 * near(a), a, 0.05)
    m.whoosh(a, b - a, 600, 2400, 0.008, 0.05)
# the eating window lights round the rim: noon to eight; then eight to four
m.tone_line(T['noon'] - 0.1, T['eight'] + 0.5, 76, gain=0.007, pan=0.0, glide=lambda t: 3 * ss(T['noon'], T['eight'] + 0.3, t))
m.tone_line(T['eight2'] - 0.2, T['four'] + 0.5, 74, gain=0.006, pan=0.0, glide=lambda t: 3 * ss(T['eight2'], T['four'] + 0.3, t))

# ---------------------------------------------------------------- the balance: it settles level; the tokens change; fasting outweighs eating freely
def creak(at, dur, gain=0.006, pan=0.3):
    tt = m.t(at, at + dur); c = bp(m.noise(len(tt)), 900, 2600) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * tt)) * np.sin(np.pi * np.clip((tt - at) / dur, 0, 1)) ** 2
    m.add('X', c * gain, at, pan)
m.whoosh(10.4, 1.3, 250, 1600, 0.018, 0.3)
for at in (12.4, 20.9, 53.4): creak(at, 1.4)
for at in (18.0, 47.0, T['against'] - 0.2):
    m.tick(at, 0.016, 0.3, hi=2600, lo=900); m.clink(at + 0.03, 0.01, 0.3, f=2400)
m.thud(T['beat'] + 0.05, 95, 0.035, 0.25, 0.08); creak(T['beat'] - 0.1, 1.0, 0.009, 0.25)
m.thud(T['against'] + 0.3, 110, 0.02, 0.3, 0.06)                                       # back to level

# ---------------------------------------------------------------- the newspaper: paper; three stamps; a sticky note
m.whoosh(28.5, 1.4, 250, 1500, 0.016, -0.2)
tt = m.t(29.3, 30.5); m.add('X', bp(m.noise(len(tt)), 1200, 6000) * np.sin(np.pi * np.clip((tt - 29.3) / 1.2, 0, 1)) ** 2 * 0.01, 29.3, -0.15)
for at in (T['conf'] + 0.05, T['notPeer'] + 0.1, T['link'] + 0.1):
    m.thud(at, 120, 0.04, -0.15, 0.05); m.tick(at + 0.004, 0.016, -0.15, hi=1400, lo=450)
m.add('X', bp(m.noise(int(0.06 * SR)), 300, 2400) * env(int(0.06 * SR), 0.002, 0.03) * 0.02, T['times'] + 0.25, -0.25)   # the note pressed down

# ---------------------------------------------------------------- the punchline: ten past ten, as in a watch advert
m.shimmer(T['because'] + 0.2, (84, 91, 96), 0.006, 0.0, 0.7, 1.8)

# ---------------------------------------------------------------- the end: the plate, the logo
m.whoosh(72.3, 1.2, 200, 1300, 0.02, 0.0)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])

# ---------------------------------------------------------------- the score
m.pad([41, 53, 57, 60], 0.0, 11.0, 0.5, 1000)                        # the clock; noon to eight
m.pad([43, 55, 59, 62], 11.0, 29.4, 0.5, 1100)                       # the balance: level, level
m.pad([38, 50, 53, 57], 29.4, 47.2, 0.5, 900)                        # the scare, stamped
m.pad([45, 57, 60, 64], 47.2, 56.6, 0.5, 1300)                       # 99 trials
m.pad([43, 55, 59, 62, 67], 56.6, 60.6, 0.5, 1400)                   # because it is one
m.pad([38, 50, 53, 57], 60.6, 72.3, 0.5, 850)                        # the warnings
m.pad([41, 53, 60, 65, 69, 72], 72.3, T['end'], 1.0, 2400, rel=0.2)
m.pulse(47.4, 55.8, 90, [67, 71, 74, 71], 0.008, 1300, lvl=lambda t: float(ss(47.4, 48.2, t)) * (1 - float(ss(55.0, 55.8, t))))
m.room(0.005)
m.finish(REPORT, VOICE, OUT, 'film14')
