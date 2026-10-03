"""Film 15 "Dopamine detox": score and sound design, timed to films/film15.js (the neon, the gauges, the experiment, the
phone box, the TV). Usage: python3 sound_film15.py <voice guide wav> <voice report json> <out dir>"""
import sys
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=79.7, detox=0.35, ban=2.39, fun=3.31, reset=3.80, pleasure=4.82, few=6.80, causes=10.31, drives=12.59, wanting=13.23,
         liking=13.94, parkinsons=16.10, lose=17.08, dopamine3=18.31, sweetness=19.95, pleasant=21.26, animal=23.47, surprise=26.13,
         switch=27.90, predicts=29.83, dayOff=32.23, harvard=34.14, no=35.40, creator=37.25, name=41.22, catchy=42.13,
         behaviour=43.79, phone=45.62, harder=46.89, notBad=48.61, notNew=49.91, trial=52.69, hour=56.29, family=58.66, tv=60.31,
         alone=60.84, wellbeing=62.21, little=63.64, t22=66.71, less=67.89, dont=69.30, method=72.90, back=75.55, factory=76.41,
         settings=76.71, logo=77.4)
EXP = dict(d1=26.1, lamp2=28.05, d2=29.55)
m = Mix(T['end'], seed=20261015)
rng = np.random.default_rng(1515)
def s5(a, b, x):
    u = np.clip((np.asarray(x, dtype=float) - a) / (b - a), 0, 1); return u * u * u * (u * (u * 6 - 15) + 10)
def jhash(n):   # the kit's hash, so the sound follows the same flicker and the same spikes as the picture
    s = np.sin(np.asarray(n, dtype=float) * 127.1 + 311.7) * 43758.5453; return s - np.floor(s)
def pulse(t, a, b, r=0.35): return ss(a, a + r, t) * (1 - ss(b - r, b, t))
end_dark = lambda t: ss(T['factory'] - 0.5, T['logo'] - 0.3, t)

# ---------------------------------------------------------------- the neon: a mains buzz under the whole film, louder when the camera is at the sign
tt = m.t(0, T['logo']); n = len(tt)
near = 0.55 + 0.45 * pulse(tt, 36.4, 43.6, 1.2) * (1 + 0.6 * ss(38, 42.9, tt)) + 0.2 * (1 - ss(5.0, 6.6, tt))
hum = sum(a * np.sin(2 * np.pi * f * tt + ph) for f, a, ph in [(120, 1.0, 0.3), (240, 0.55, 1.1), (360, 0.25, 2.0), (480, 0.16, 0.4), (600, 0.08, 2.6)])
fizz = bp(m.noise(n), 3000, 9000) * (0.5 + 0.5 * np.sin(2 * np.pi * 120 * tt)) ** 4
flick = jhash(np.floor(tt * 9)) > 0.93          # the sign dips 8% in the picture on these ninths of a second
neon = (lp(hum, 900) * 0.0042 + fizz * 0.0016) * near * (1 - 0.35 * flick) * (1 - end_dark(tt))
m.add('X', neon, 0, -0.05)
for k in np.nonzero(jhash(np.arange(0, int(T['logo'] * 9))) > 0.93)[0]:   # a dry crackle as it dips
    at = k / 9 + 0.004
    g = 0.006 * (0.55 + 0.45 * float(pulse(at, 36.4, 43.6, 1.2))) * (1 - float(end_dark(at)))
    nn = int(0.03 * SR); m.add('X', bp(m.noise(nn), 1800, 7000) * env(nn, 0.0005, 0.006) * g, at, rng.uniform(-0.2, 0.2))

# ---------------------------------------------------------------- the gauges: a small servo whirr as the needles move, a tick as they settle
def needle(a, b, up=True, gain=0.006, pan=-0.35):
    tt = m.t(a - 0.05, b + 0.1); u = np.clip((tt - a) / (b - a), 0, 1); sp = np.sin(np.pi * u) ** 1.5
    f = (900 + 500 * (u if up else 1 - u)); ph = 2 * np.pi * np.cumsum(f) / SR
    w = (np.sin(ph) * 0.6 + 0.4 * bp(m.noise(len(tt)), 1200, 4200)) * sp
    m.add('X', w * gain, a - 0.05, pan); m.tick(b + 0.02, gain * 1.6, pan, hi=3800, lo=1900)
needle(12.39, 13.63, True, 0.007)               # wanting up (and dopamine with it); liking stays
needle(15.5, 16.1, False, 0.005)                # back
needle(16.98, 18.71, False, 0.007)              # Parkinson's: dopamine falls; liking stays put
needle(62.81, 64.04, True, 0.004)               # well-being: up, a little
needle(66.51, 68.19, False, 0.006)              # app use: down 22%

# ---------------------------------------------------------------- the experiment: amplifier hiss; a click per spike, as lab monitors play them; drops; the lamp
tt = m.t(23.6, 31.0); m.add('X', bp(m.noise(len(tt)), 600, 7000) * 0.0014 * pulse(tt, 23.6, 31.0, 0.6), 23.6, 0.35)
def spike(at, g):
    nn = int(0.004 * SR); x = np.arange(nn) / SR
    s = np.sin(2 * np.pi * 1700 * x) * np.exp(-x / 0.0009) - 0.5 * np.sin(2 * np.pi * 900 * x) * np.exp(-x / 0.0016)
    m.add('X', s * g, at, 0.35)
rows = [dict(t0=EXP['d1'] - 2.0, burst=EXP['d1'], ri=0), dict(t0=EXP['lamp2'] - 0.6, burst=EXP['lamp2'], ri=1)]
for R in rows:
    for k in range(400):
        st = R['t0'] + (k / 400) * 3.0
        base = jhash(k * 7.1 + R['ri'] * 13) < 0.05
        burst = R['burst'] + 0.04 < st < R['burst'] + 0.24 and jhash(k * 3.3 + R['ri']) < 0.55
        if base or burst: spike(st, 0.03 if burst else 0.018)
def drop(at, g=0.03):
    nn = int(0.09 * SR); x = np.arange(nn) / SR; f = 700 + 1500 * (1 - np.exp(-x / 0.012))
    m.add('X', np.sin(2 * np.pi * np.cumsum(f) / SR) * env(nn, 0.001, 0.018) * g, at, 0.3)
    m.add('X', bp(m.noise(int(0.02 * SR)), 2000, 8000) * env(int(0.02 * SR), 0.0005, 0.004) * g * 0.4, at, 0.3)
drop(EXP['d1']); drop(EXP['d2'])
m.tick(EXP['lamp2'] - 0.03, 0.02, 0.3, hi=2600, lo=1100)                      # the lamp: relay on
tt = m.t(EXP['lamp2'], EXP['lamp2'] + 0.9); m.add('X', lp(np.sin(2 * np.pi * 120 * tt) + 0.4 * np.sin(2 * np.pi * 240 * tt), 600) * pulse(tt, EXP['lamp2'], EXP['lamp2'] + 0.9, 0.05) * 0.004, EXP['lamp2'], 0.3)
m.tick(EXP['lamp2'] + 0.9, 0.012, 0.3, hi=2400, lo=1000)                      # and off

# ---------------------------------------------------------------- the phone box: the lid swings shut on its hinge
tt = m.t(45.42, 47.05); u = (tt - 45.42) / 1.63
m.add('X', bp(m.noise(len(tt)), 900, 3200) * (0.5 + 0.5 * np.sin(2 * np.pi * 31 * tt)) * np.sin(np.pi * u) ** 2 * 0.004, 45.42, -0.1)
m.thud(47.07, 140, 0.03, -0.1, 0.05); m.tick(47.075, 0.02, -0.1, hi=2200, lo=700); m.clink(47.11, 0.006, -0.1, f=3300)

# ---------------------------------------------------------------- the TV: on for "and TV, alone"; a muffled murmur until it goes off
m.tick(T['tv'] - 0.1, 0.018, 0.0, hi=2400, lo=900); m.thud(T['tv'] - 0.08, 70, 0.02, 0.0, 0.12)
tt = m.t(T['tv'] + 0.05, 75.6); n = len(tt)
kn = np.arange(tt[0], tt[-1] + 0.3, 0.19); syl = lp(np.interp(tt, kn, rng.uniform(0, 1, len(kn)) ** 1.6), 14)          # syllables, no words
kp = np.arange(tt[0], tt[-1] + 2.0, 1.7); phr = lp(np.interp(tt, kp, (rng.uniform(0, 1, len(kp)) < 0.72).astype(float)), 2.0)   # phrases and pauses
talk = bp(m.noise(n), 280, 2400, 3) * syl * phr
bed = sum(np.sin(2 * np.pi * note(nn_) * tt + rng.uniform(0, 6)) for nn_ in (57, 64, 69)) / 3      # a faint score inside the TV
tv = lp(hp(talk * 0.8 + bed * 0.25, 300), 2600)
prox = 1.0 * (1 - ss(61.6, 62.6, tt)) + 0.35 * ss(61.6, 62.6, tt) * (1 - ss(68.6, 70.0, tt)) + 0.6 * ss(68.6, 70.0, tt)
m.add('M', tv * 0.012 * prox * ss(T['tv'] + 0.05, T['tv'] + 0.4, tt) * (1 - ss(74.8, 75.5, tt)), T['tv'] + 0.05, 0.05)
m.tick(74.85, 0.012, 0.05, hi=2200, lo=900)                                  # off

# ---------------------------------------------------------------- the camera's moves
for a, b, g, pan in [(5.6, 7.2, 0.014, -0.3), (22.0, 23.6, 0.016, 0.4), (30.8, 32.0, 0.016, -0.4), (35.9, 37.3, 0.014, 0.0),
                     (42.9, 44.4, 0.014, -0.1), (51.0, 52.6, 0.018, 0.0), (61.6, 62.8, 0.022, -0.35), (68.6, 70.0, 0.014, 0.2)]:
    m.whoosh(a + 0.05, b - a, 250, 1800, g, pan)
m.whoosh(74.85, 1.4, 220, 1500, 0.016, -0.2)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])

# ---------------------------------------------------------------- the score
m.pad([40, 52, 55, 59], 0.0, 6.6, 0.5, 950)                          # the room: the locked fun, the sign
m.pad([38, 50, 57, 60], 6.6, 22.4, 0.5, 1000)                        # wanting, not liking
m.pad([45, 57, 60, 64], 22.4, 31.2, 0.45, 1100)                      # the experiment
m.pad([41, 53, 57, 60], 31.2, 43.0, 0.5, 1000)                       # Harvard says no; the name was just catchy
m.pad([43, 55, 59, 62], 43.0, 51.6, 0.5, 1150)                       # behaviour therapy; not new
m.pad([40, 52, 55, 59, 64], 51.6, 61.6, 0.5, 1000)                   # an hour a day; and TV, alone
m.pad([45, 57, 60, 64], 61.6, 69.0, 0.5, 1200)                       # well-being; 22% less
m.pad([38, 50, 53, 57], 69.0, 75.4, 0.5, 850)                        # don't cut out people
m.pad([41, 53, 60, 65, 69, 72], 75.4, T['end'], 1.0, 2400, rel=0.2)
m.pulse(52.0, 57.6, 84, [64, 67, 71, 67], 0.007, 1200, lvl=lambda t: float(ss(52.0, 52.8, t)) * (1 - float(ss(56.8, 57.6, t))))
m.room(0.005)
m.finish(REPORT, VOICE, OUT, 'film15')
