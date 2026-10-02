"""Film 3 "Ten thousand steps a day. Who decided that?": score and sound design, timed to films/film03.js.
The footsteps and the pedometer's clicks come from the same walk the picture uses (same speeds, same stride).
Usage: python3 sound_film03.py <voice guide wav> <voice report json> <out dir>"""
import sys
import numpy as np
from sfx import Mix, SR, note, ss, env, bp, lp

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=77.3, q0=0.35, day=1.91, who=2.48, co=4.85, y1965=7.22, sold=9.36, name=11.51, meter=12.86, sci=14.15, mkt=16.79,
         meas=18.58, s57=20.62, devices=23.74, comp=26.6, two=27.56, seven=28.83, p47=30.88, dying=33.63, dem=35.66, dep=38.57,
         falls=41.28, above=43.38, small=46.48, women=49.04, k75=53.21, slogan1=55.39, slogan2=58.13, link=60.23, sick=63.06,
         aim=65.7, far=68.71, add=70.43, final=72.99, logo=74.9)
m = Mix(T['end'], seed=20261003)

# ---------------------------------------------------------------- the walk, exactly as the picture walks it
STRIDE = 7.9 / 7; S_STOP1 = 0.25 * STRIDE
W1 = dict(t0=0.0, t1=19.0, d=13.9, ramp=1.4); W2 = dict(t0=25.9, t1=34.6, d=7 * STRIDE, ramp=0.7)
def walk1(t):
    v = W1['d'] / (W1['t1'] - W1['t0'] - W1['ramp'] / 2)
    if t < W1['t1'] - W1['ramp']: return v * (t - W1['t0'])
    r = max(0.0, W1['t1'] - t); return W1['d'] - v * r * r / (2 * W1['ramp'])
def ease(t, w):
    T_ = w['t1'] - w['t0']; v = w['d'] / (T_ - w['ramp']); u = min(max(t - w['t0'], 0), T_)
    if u < w['ramp']: return v * u * u / (2 * w['ramp'])
    if u > T_ - w['ramp']: r = T_ - u; return w['d'] - v * r * r / (2 * w['ramp'])
    return v * (u - w['ramp'] / 2)
def s_at(t): return S_STOP1 - W1['d'] + walk1(t) if t < W2['t0'] else S_STOP1 + ease(t, W2)
ts = np.arange(0, T['end'], 1 / 1000); ss_ = np.array([s_at(t) for t in ts])
# heel strikes: the right heel at s = k * STRIDE, the left at (k + 0.5) * STRIDE (each landing while the walk is moving)
steps = []
for i in range(1, len(ts)):
    a, b = ss_[i - 1] / (STRIDE / 2), ss_[i] / (STRIDE / 2)
    if b > a and np.floor(b) > np.floor(a): steps.append(ts[i])
# the settle steps when a walk stops (the trailing foot comes down beside the other), and the first step when it starts
settles = [W1['t1'] - 0.05, W2['t1'] - 0.05]
def footstep(at, gain=0.12, pan=0.0, heavy=0.0):
    n = int(0.35 * SR); x = np.arange(n) / SR
    tap = bp(m.noise(n), 900, 5200) * env(n, 0.0008, 0.012) * 0.7 + np.sin(2 * np.pi * (95 + 40 * heavy) * x) * env(n, 0.002, 0.05)
    scrape = bp(m.noise(n), 2500, 8000) * env(n, 0.02, 0.05) * 0.15
    m.add('X', (tap + scrape) * gain, at, pan)
for k, at in enumerate(steps):
    uphill = 1.0 if W2['t0'] < at < W2['t1'] else 0.0
    footstep(at, (0.07 if at < 14 else 0.11) * (1 + 0.25 * uphill), 0.12 if k % 2 else -0.12, uphill)
for at in settles: footstep(at, 0.08, 0.0)
# the pedometer: a small mechanical click as each step lands on the counter (close up at the start, it is loud in the frame)
for at in steps:
    if at < 15.5: m.tick(at + 0.02, 0.05 if at > 13 else 0.08, -0.05, hi=3200, lo=1400)
# ten thousand: a bright little ding, like the gadget is proud of itself
m.bell(T['day'] + 0.02, 88, 0.05, 0.0, 0.5, buf='X'); m.bell(T['day'] + 0.12, 93, 0.035, 0.0, 0.45, buf='X')

# ---------------------------------------------------------------- the score
m.pulse(0.2, 18.4, 81, [50, 57, 62, 57], 0.035, 1200, lvl=lambda t: float(ss(0.2, 2.0, t)) * (1 - 0.5 * float(ss(14, 18.4, t))))   # the walk, as a pulse
m.pad([38, 50, 57, 62], 0.0, 4.7, 0.6, 900)
m.pad([38, 53, 57, 60, 64], 4.7, 14.1, 0.75, 1200)
m.pad([34, 50, 53, 58], 14.1, 18.6, 0.75, 900)
m.pad([41, 53, 57, 60], 18.6, 26.4, 0.8, 1300)
m.pad([41, 53, 57, 60, 65], 26.4, 34.8, 0.9, 1700)          # the climb
m.pulse(26.2, 34.8, 96, [53, 57, 60, 65, 64, 60, 57, 60], 0.045, 1700, lvl=lambda t: float(ss(26.2, 28, t)) * (0.6 + 0.4 * float(ss(26.2, 34.6, t))))
m.pad([41, 53, 60, 64, 69], 34.8, 43.2, 0.95, 2200)          # the top: open
m.pad([41, 53, 60, 64], 43.2, 55.2, 0.8, 1500)               # the plateau: nothing moves
m.pad([38, 50, 53, 57], 55.2, 60.2, 0.7, 900)
m.pad([38, 50, 57], 60.2, 65.6, 0.55, 800)                   # a link, not proof: thin
m.pad([41, 53, 57, 60, 64], 65.6, 72.9, 0.9, 2000)
m.pad([41, 53, 60, 64, 67, 69], 72.9, T['end'], 1.05, 2600, rel=0.2)

# 57 studies: points of light arrive, then gather into one line
m.rain(T['s57'] - 0.2, T['s57'] + 1.6, 57, 0.04, pitch=(86, 98), seed=57)
m.tone_line(T['s57'] + 1.0, T['s57'] + 4.2, 62, 0.04, 0.0, glide=lambda t: 7 * ss(T['s57'] + 1.0, T['s57'] + 4.0, t))
# the readouts: the brain, the mood, the hips
m.bell(T['dem'] + 0.05, 76, 0.04, -0.2, 1.1); m.bell(T['dep'] + 0.05, 79, 0.035, 0.2, 1.1); m.bell(T['falls'] + 0.05, 72, 0.04, 0.0, 1.1)
m.tock(T['k75'] + 0.05, 0.08, -0.2, f=700)                   # the 7,500 marker
# the slogan: a neon sign buzzes on, flickers, and clunks off
t0, t1 = T['slogan1'] - 0.5, T['slogan2'] + 1.7
tt = m.t(t0, t1); hum = (np.sin(2 * np.pi * 120 * tt) + 0.5 * np.sin(2 * np.pi * 240 * tt) + 0.25 * np.sign(np.sin(2 * np.pi * 120 * tt))) * ss(t0, t0 + 0.15, tt) * (1 - ss(t1 - 0.5, t1, tt))
flick = np.where((tt < t0 + 0.6) & (np.sin(tt * 190) > 0.3), 0.2, 1.0)
m.add('X', lp(hum * flick, 1800) * 0.025, t0, 0.3)
for k in range(5): m.snip(t0 + 0.03 + k * 0.11, 0.05, 0.3)
m.thud(t1 - 0.45, 120, 0.06, 0.3, 0.05)
for k in range(3): m.snip(T['slogan2'] + 0.43 + k * 0.1, 0.035, 0.35)   # the sign's own ® ticks on last
# the settings: 7,000 in orange, then the stairs, one thousand at a time
m.bell(T['aim'] + 1.35, 81, 0.045, 0.0, 1.0)
for i, nn in enumerate([69, 72, 74, 76, 79]): m.pluck(T['add'] + i * 0.28 + 0.02, nn, 0.045, -0.3 + 0.15 * i, 0.5)
# the end: down the hill into the pedometer, the needle swings to twelve, the series chord
m.whoosh(T['final'] - 0.1, T['logo'] - T['final'], 220, 2600, 0.06, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
m.room()
m.finish(REPORT, VOICE, OUT, 'film03')
print('steps', len(steps), [round(x, 2) for x in steps[:6]], '...', [round(x, 2) for x in steps[-4:]])
