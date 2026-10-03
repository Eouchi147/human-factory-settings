"""Film 10 "Does foam rolling work?": score and sound design, timed to films/film10.js (the same rolling, plates, swing,
peel and sand). Usage: python3 sound_film10.py <voice guide wav> <voice report json> <out dir>"""
import sys
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=72.7, foam=0.35, lie=1.89, tube=2.89, wince=2.94, breaking=4.29, fascia=5.49, fascia2=7.13, real=8.14,
         collagen=8.99, wrapped=9.66, muscle=10.84, squash=12.79, thick=13.33, percent=14.69, one=15.12, model=15.82,
         about=17.37, kilos=19.78, lying=21.01, roller=22.08, close=22.90, so=24.27, rolling2=25.30, before=26.40,
         about2=27.79, four=28.15, more=28.97, no=31.28, stretching=32.23, trial=34.27, gone=35.86, minutes=37.21,
         after=38.57, exercise2=39.37, eases=40.09, little=41.38, likely=42.47, nerves=44.32, turn=45.02, pain=45.61,
         while_=47.01, the=47.93, release=48.25, mostly=49.09, name=49.79, flushing=50.99, inlab=53.31, slowed=56.43,
         clearing=57.15, use=58.47, warmup=59.73, kit=61.01, musclepain=62.33, rest=64.42, see=65.29, doctor=66.01,
         back=68.54, settings=69.70, logo=70.40)
m = Mix(T['end'], seed=20261010)
rng = np.random.default_rng(1010)
def s5(a, b, x):
    u = np.clip((np.asarray(x, dtype=float) - a) / (b - a), 0, 1); return u * u * u * (u * (u * 6 - 15) + 10)

# ---------------------------------------------------------------- the same rolling as the picture (films/film10.js rollU)
ROLLS = [(0.45, 23.75, 0.07), (38.75, 47.45, 0.06), (50.2, 61.95, 0.065)]
dt = 0.005; ts = np.arange(0, T['end'] + 2, dt)
rate = np.where((ts > 58.2) & (ts < 62), 0.62, 0.42); phase = np.concatenate([[0], np.cumsum(rate[:-1] * dt)])
ph0 = np.interp(0.45, ts, phase)
amp = np.zeros_like(ts)
for t0, t1, A in ROLLS: amp = np.maximum(amp, A * ss(t0, t0 + 0.7, ts) * (1 - ss(t1 - 0.7, t1, ts)))
U = amp * np.sin(2 * np.pi * (phase - ph0)); V = np.gradient(U, dt)       # body travel (m) and speed (m/s)
RR = 0.075
# foam on a rubber mat: a soft brush of air and rubber, with the nubs passing (their rate follows the roller's speed)
tt = m.t(0, T['end']); n = len(tt)
vr = np.abs(np.interp(tt, ts, V)) / 2                                          # the roller moves half as fast
nubs = 0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(vr / (2 * np.pi * RR) * 64) / SR)  # 64 nubs round the roller
lvl = np.clip(vr / 0.07, 0, 1.4) ** 0.9
brush = bp(m.noise(n), 180, 1400) * (0.55 + 0.45 * nubs) * lvl
near = 0.7 + 0.6 * (1 - ss(2.2, 3.6, tt)) * 1.0
m.add('X', brush * 0.022 * near * (1 - ss(T['back'], T['logo'], tt)), 0, -0.1)
# the body's weight on the turn of each stroke: a soft creak of foam
turns = ts[1:-1][(np.sign(V[1:-1]) != np.sign(V[:-2])) & (amp[1:-1] > 0.02)]
for tk in turns: m.thud(float(tk) + 0.02, 70, 0.012, -0.1, 0.06)

# ---------------------------------------------------------------- a wince: the hand goes to the head, a click of bone
m.swish(T['wince'] - 0.12, 0.45, 0.025, 0.25, 1600)
m.clink(T['wince'] + 0.2, 0.012, 0.25, f=1900)
m.tone_line(T['wince'] - 0.05, T['wince'] + 0.9, 84, gain=0.006, pan=0.1, glide=lambda t: -2 * ss(T['wince'], T['wince'] + 0.8, t))
# ---------------------------------------------------------------- the fascia: a band, then a sleeve round every muscle
m.shimmer(T['breaking'] - 0.1, (79, 86, 91), 0.012, 0.2, 0.8, 2.4)
m.whoosh(T['fascia2'] - 0.3, 1.2, 200, 1400, 0.016, 0.0)
for k in range(7): m.pluck(T['collagen'] + k * 0.16 + rng.uniform(0, 0.04), int(rng.integers(72, 84)), 0.008, rng.uniform(-0.4, 0.4), 0.18, bright=4200)

# ---------------------------------------------------------------- 925 kg: forty-six 20 kg plates, then 5 kg, onto the sample
m.whoosh(T['squash'] - 0.7, 1.0, 250, 1200, 0.02, -0.3)
m.scan(T['model'] - 0.1, 0.9, 0.012, -0.3)                                      # one model (a calculation)
land = [15.55 + 4.0 * (i / 45) ** 0.92 for i in range(46)]
for i, tl in enumerate(land):
    k = i / 45
    m.thud(tl, 62 - 14 * k, 0.05 + 0.03 * k, -0.35, 0.16 + 0.1 * k)          # iron on iron, deeper as the stack grows
    m.clink(tl + 0.003, 0.016 + 0.01 * rng.random(), -0.35, f=1100 + 500 * rng.random())
m.thud(19.83, 90, 0.04, -0.3, 0.12); m.clink(19.835, 0.03, -0.3, f=2300)       # the 5 kg plate
m.drone(15.5, 21.4, 31, 0.03, 300)                                             # the weight of it
m.tone_line(T['lying'], T['close'] + 0.7, 67, gain=0.008, pan=0.2, glide=lambda t: -5 * ss(T['lying'], T['close'] + 0.4, t))

# ---------------------------------------------------------------- before exercise: the swing, its range, 4% more, gone in 30 minutes
m.swish(24.25, 1.3, 0.03, 0.3, 900); m.whoosh(25.2, 1.2, 300, 1600, 0.018, 0.3)
m.pluck(26.45, 69, 0.016, 0.3, 0.5)                                            # the range lights up
m.pluck(28.2, 76, 0.016, 0.35, 0.4); m.pluck(28.36, 81, 0.012, 0.35, 0.35)       # +4%
m.tick(T['stretching'] - 0.05, 0.02, 0.35, hi=2600, lo=900)                     # the dashed line: the same
for k in range(30):                                                             # thirty minutes go by
    at = 34.3 + 3.2 * (k / 29) ** 0.85; m.tick(at, 0.012 + 0.006 * (k % 5 == 0), 0.3, hi=3100, lo=1300)
m.tone_line(34.3, 37.8, 71, gain=0.007, pan=0.35, glide=lambda t: -3 * ss(34.3, 37.5, t))
m.swish(37.6, 1.0, 0.025, 0.3, 800); m.thud(38.5, 85, 0.02, 0.3, 0.06)          # the leg back down, the foot on the mat

# ---------------------------------------------------------------- after exercise: sore (a low throb), a little less; nerves turn down
tt2 = m.t(38.6, 47.8); throb = 0.5 + 0.5 * np.sin(2 * np.pi * 1.3 * tt2) ** 8
e2 = ss(38.8, 39.8, tt2) * (1 - 0.2 * s5(40.1, 41.7, tt2)) * (1 - 0.45 * s5(45.0, 45.8, tt2)) * (1 - ss(47.0, 47.6, tt2))
m.add('X', lp(np.sin(2 * np.pi * 62 * tt2) + 0.5 * np.sin(2 * np.pi * 124 * tt2), 380) * throb * e2 * 0.03, 38.6, -0.05)
tp = 0.0; pulses = []
for t_ in np.arange(42.2, 48.0, 0.01):                                          # signal pulses, the same speed as the picture's
    sp = 0.75 - 0.45 * float(s5(44.97, 45.76, t_)); tp += sp * 0.01 * 4
    if tp >= 1: tp -= 1; pulses.append(t_)
for at in pulses:
    g = 0.012 * (1 - 0.6 * float(s5(44.97, 45.76, at))) * float(ss(42.2, 42.7, at)) * (1 - float(ss(47.4, 48.0, at)))
    m.beep(at, 2600 + 400 * rng.random(), 0.03, g, 0.15)
m.tick(T['turn'] + 0.05, 0.03, 0.0, hi=1500, lo=500); m.tick(T['turn'] + 0.18, 0.025, 0.0, hi=1400, lo=480)   # a knob turned down

# ---------------------------------------------------------------- the release: the sticker peels, lets go, lands on the mat
tt3 = m.t(48.2, 49.3); k3 = (tt3 - 48.2) / 1.1
crackle = hp(m.noise(len(tt3)), 1800) * (np.abs(lp(m.noise(len(tt3)), 90) * 7).clip(0, 1) ** 2) * np.sin(np.pi * np.clip(k3 * 1.1, 0, 1)) ** 0.5
m.add('X', crackle * 0.05, 48.2, 0.25)
m.snip(49.3, 0.03, 0.25)
m.swish(49.35, 0.75, 0.015, 0.3, 2400); m.rustle(50.02, 50.3, 0.02, 0.3)

# ---------------------------------------------------------------- lactic acid: two hourglasses turn; the massage one drains slower
m.whoosh(T['flushing'] - 0.6, 0.9, 250, 1400, 0.018, 0.2)
m.swish(53.3, 0.55, 0.03, 0.0, 1200)
m.tock(53.82, 0.04, -0.15, f=420); m.tock(53.84, 0.035, 0.15, f=400)
for (t0, dur, pan, g) in [(53.86, 3.1, -0.25, 0.012), (53.86, 5.2, 0.25, 0.012)]:
    tt4 = m.t(t0, min(T['end'], t0 + dur)); n4 = len(tt4)
    hiss = bp(m.noise(n4), 3000, 9000) * (0.6 + 0.4 * np.abs(lp(m.noise(n4), 40) * 5).clip(0, 1)) * ss(t0, t0 + 0.2, tt4) * (1 - ss(t0 + dur - 0.35, t0 + dur, tt4))
    m.add('X', hiss * g * (1 - ss(57.6, 58.6, tt4)), t0, pan)

# ---------------------------------------------------------------- the end: the cap, the logo
m.whoosh(T['back'] - 0.5, 0.9, 200, 1300, 0.02, 0.1)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])

# ---------------------------------------------------------------- the score: pads by section, a pulse under the tower
m.pad([45, 57, 60, 64], 0.0, 12.2, 0.5, 1000)                        # rolling; the fascia
m.pad([40, 52, 55, 59], 12.2, 24.0, 0.5, 900)                        # 925 kg
m.pad([45, 57, 60, 64, 67], 24.0, 38.4, 0.5, 1200)                   # the swing; 4%; the same; gone
m.pad([41, 53, 57, 60], 38.4, 50.8, 0.5, 1000)                       # sore; nerves; the name
m.pad([43, 55, 59, 62], 50.8, 61.9, 0.5, 1000)                       # lactic acid; a warm-up
m.pad([38, 50, 57, 62], 61.9, 68.3, 0.5, 900)                        # see a doctor
m.pad([45, 57, 64, 69, 72, 76], 68.3, T['end'], 1.0, 2400, rel=0.2)
m.pulse(15.4, 21.0, 92, [52, 55, 59, 55], 0.012, 1100, lvl=lambda t: float(ss(15.4, 16.2, t)) * (1 - float(ss(20.2, 21.0, t))))
m.pulse(58.3, 61.8, 104, [69, 72, 76, 72], 0.01, 1500, lvl=lambda t: float(ss(58.3, 58.9, t)) * (1 - float(ss(61.2, 61.8, t))))
m.room(0.005)
m.finish(REPORT, VOICE, OUT, 'film10')
