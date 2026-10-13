"""Film 11 "Does foam rolling work?" (new direction, 7 Oct 2026): score and sound design, timed to films/film11.js.
The roller on the mat (foam, nubs, the body's weight at each turn); a wince; the sticky note slapped on the thigh and later
peeled off; the fascia's sleeves and the lines that run through the body; the tower's base rising, forty-six 20 kg plates
and one of 5 kg landing, the tower sinking away; the leg's swing, its range, 4% more, thirty minutes ticking by; a sore
throb and nerve pulses turned down; the leg used, day after day; the toy dog rolling in, a dumbbell dropped, a week ticked
off; a brisk warm-up; the red repair kit rising and opening; the end cap and the logo. Every time comes from the timing
table the picture exports (timing11.json, window.HFS_W.timing).
Usage: python3 sound_film11.py <voice guide wav> <voice report json> <out dir>"""
import sys, json, os
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=80.9, logo=78.38, wince=1.69, breaking=3.97, fascia3=8.88, collagen=11.62, but=16.53, model=20.59, lying=25.55, close=27.19,
         so2=30.39, more=35.68, stretching=37.88, after=44.45, turn=49.63, your2=52.99, walking=62.38, use=66.03, see=72.69, final=76.12, settings=77.7)
HERE = os.path.dirname(os.path.abspath(__file__))
TM = json.load(open(os.path.join(HERE, 'timing11.json')))
m = Mix(T['end'], seed=20261011)
rng = np.random.default_rng(1111)
def s5(a, b, x):
    u = np.clip((np.asarray(x, dtype=float) - a) / (b - a), 0, 1); return u * u * u * (u * (u * 6 - 15) + 10)
m.room(0.005)

# ---------------------------------------------------------------- the same rolling as the picture (rollU)
r0, r1, rT0, rT1 = TM['rate']
dt = 0.005; ts = np.arange(0, T['end'] + 2, dt)
rate = np.where((ts > rT0) & (ts < rT1), r1, r0); phase = np.concatenate([[0], np.cumsum(rate[:-1] * dt)])
ph0 = np.interp(0.45, ts, phase)
amp = np.zeros_like(ts)
for t0, t1, A in TM['rolls']: amp = np.maximum(amp, A * ss(t0, t0 + 0.7, ts) * (1 - ss(t1 - 0.7, t1, ts)))
U = amp * np.sin(2 * np.pi * (phase - ph0)); V = np.gradient(U, dt)
RR = 0.075
tt = m.t(0, T['end']); n = len(tt)
vr = np.abs(np.interp(tt, ts, V)) / 2
nubs = 0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(vr / (2 * np.pi * RR) * 64) / SR)
lvl = np.clip(vr / 0.07, 0, 1.4) ** 0.9
brush = bp(m.noise(n), 180, 1400) * (0.55 + 0.45 * nubs) * lvl
m.add('X', brush * 0.02 * (1 - ss(T['final'], T['logo'], tt)), 0, -0.1)
turns = ts[1:-1][(np.sign(V[1:-1]) != np.sign(V[:-2])) & (amp[1:-1] > 0.02)]
for tk in turns: m.thud(float(tk) + 0.02, 70, 0.011, -0.1, 0.06)

# ---------------------------------------------------------------- a wince: the hand goes over the eyes
m.swish(T['wince'] - 0.12, 0.45, 0.022, 0.25, 1600)
m.tone_line(T['wince'] - 0.05, T['wince'] + 0.9, 84, gain=0.006, pan=0.1, glide=lambda t: -2 * ss(T['wince'], T['wince'] + 0.8, t))

# ---------------------------------------------------------------- the fascia: the band; the note slapped on; the sleeves; the lines through the body
m.shimmer(T['breaking'] - 0.1, (79, 86, 91), 0.011, 0.2, 0.8, 2.4)
NT = TM['note']
m.swish(NT - 0.17, 0.18, 0.016, 0.15, 2400)
k = int(0.3 * SR); x = np.arange(k) / SR
slap = bp(m.noise(k), 700, 6500) * env(k, 0.0005, 0.022) + np.sin(2 * np.pi * 165 * x) * env(k, 0.001, 0.045) * 0.7
m.add('X', slap * 0.07, NT, 0.15)
m.add('X', bp(m.noise(int(0.09 * SR)), 2500, 8000) * env(int(0.09 * SR), 0.002, 0.03) * 0.01, NT + 0.05, 0.15)
m.pluck(NT + 0.35, 60, 0.012, 0.0, 0.5); m.pluck(NT + 0.55, 58, 0.01, 0.0, 0.6)   # a deadpan "ahem"
m.whoosh(T['fascia3'] - 0.3, 1.2, 200, 1400, 0.014, 0.0)
for j in range(7): m.pluck(T['collagen'] + j * 0.16 + rng.uniform(0, 0.04), int(rng.integers(72, 84)), 0.008, rng.uniform(-0.4, 0.4), 0.18, bright=4200)
L0, L1 = TM['lines']
m.tone_line(L0, L1 + 0.6, 72, 0.007, 0.0, glide=lambda t: 7 * s5(L0, L1, t)); m.shimmer(L1 - 0.2, (84, 91, 96), 0.008, 0.1, 0.6, 1.6)

# ---------------------------------------------------------------- 925 kg: the base rises, forty-six 20 kg plates and one of 5 kg land; later it all sinks away
def lift(t0, t1, up=True, g=0.012, pan=-0.35):
    tl = m.t(t0, t1 + 0.05); nn = len(tl); u = np.clip((tl - t0) / (t1 - t0), 0, 1)
    f = 52 + 22 * (u if up else 1 - u)
    hum = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + np.sin(2 * np.pi * np.cumsum(2 * f) / SR) * 0.25
    m.add('X', (hum + lp(m.noise(nn), 170) * 0.9) * np.sin(np.pi * u) ** 0.7 * g, t0, pan)
    if up: m.thud(t1, 72, 0.02, pan, 0.08)
lift(15.9, 16.9)
m.scan(T['model'] - 0.1, 0.9, 0.011, -0.3)
for i, tl in enumerate(TM['plates']):
    kk = i / 45
    m.thud(tl, 62 - 14 * kk, 0.045 + 0.03 * kk, -0.35, 0.16 + 0.1 * kk)
    m.clink(tl + 0.003, 0.014 + 0.01 * rng.random(), -0.35, f=1100 + 500 * rng.random())
m.thud(TM['five'], 90, 0.04, -0.3, 0.12); m.clink(TM['five'] + 0.005, 0.028, -0.3, f=2300)
m.drone(21.5, 26.2, 31, 0.03, 300)
m.tone_line(T['lying'], T['close'] + 0.7, 67, gain=0.008, pan=0.2, glide=lambda t: -5 * ss(T['lying'], T['close'] + 0.4, t))
lift(30.0, 31.5, up=False, g=0.016)
# the note lets go and flutters off
NO = TM['noteOff']
for j in range(18): m.tick(NO + j * 0.006 + rng.uniform(0, 0.004), 0.004 * rng.uniform(0.5, 1.0), 0.15, hi=rng.uniform(3000, 6200), lo=1500)
m.swish(NO + 0.06, 0.8, 0.011, 0.15, 1700); m.rustle(NO + 0.25, NO + 1.05, 0.005, 0.15)

# ---------------------------------------------------------------- before exercise: the swing, its range, 4% more, the same as stretching, gone in 30 minutes
U0, U1 = TM['legUp']; m.swish(U0, U1 - U0 + 0.3, 0.028, 0.3, 900)
m.pluck(TM['range'][1] - 0.4, 69, 0.016, 0.3, 0.5)
M0, M1 = TM['more']; m.pluck(M1 - 0.4, 76, 0.016, 0.35, 0.4); m.pluck(M1 - 0.24, 81, 0.012, 0.35, 0.35)
m.tick(T['stretching'] - 0.05, 0.018, 0.35, hi=2600, lo=900)
B0, B1 = TM['back']
for j in range(30):
    at = B0 + (B1 - B0 - 0.3) * (j / 29) ** 0.85; m.tick(at, 0.011 + 0.006 * (j % 5 == 0), 0.3, hi=3100, lo=1300)
m.tone_line(B0, B1, 71, gain=0.007, pan=0.35, glide=lambda t: -3 * ss(B0, B1 - 0.3, t))
D0, D1 = TM['legDown']; m.swish(D0, D1 - D0, 0.024, 0.3, 800); m.thud(D1 - 0.05, 85, 0.02, 0.3, 0.06)

# ---------------------------------------------------------------- after exercise: a sore throb, a little less; nerve pulses, turned down
SO0, SO1 = TM['sore']; N0, N1 = TM['nerve']; DN0, DN1 = TM['down']
tt2 = m.t(SO0 - 0.2, N1 + 0.3); throb = 0.5 + 0.5 * np.sin(2 * np.pi * 1.3 * tt2) ** 8
e2 = ss(SO0, SO1, tt2) * (1 - 0.2 * s5(45.76, 47.3, tt2)) * (1 - 0.45 * s5(DN0, DN1, tt2)) * (1 - ss(52.0, 52.7, tt2))
m.add('X', lp(np.sin(2 * np.pi * 62 * tt2) + 0.5 * np.sin(2 * np.pi * 124 * tt2), 380) * throb * e2 * 0.028, SO0 - 0.2, -0.05)
tp = 0.0; pulses = []
for t_ in np.arange(N0, N1, 0.01):
    sp = 0.75 - 0.45 * float(s5(DN0, DN1, t_)); tp += sp * 0.01 * 4
    if tp >= 1: tp -= 1; pulses.append(t_)
for at in pulses:
    g = 0.011 * (1 - 0.6 * float(s5(DN0, DN1, at))) * float(ss(N0, N0 + 0.5, at)) * (1 - float(ss(N1 - 0.6, N1, at)))
    m.beep(at, 2600 + 400 * rng.random(), 0.03, g, 0.15)
m.tick(T['turn'] + 0.05, 0.026, 0.0, hi=1500, lo=500); m.tick(T['turn'] + 0.18, 0.022, 0.0, hi=1400, lo=480)

# ---------------------------------------------------------------- using it: three swings of the leg; new collagen, day after day
SW0, SW1, SW2, SW3 = TM['swings']
for j in range(3): m.swish(SW1 + j * 1.2 + 0.1, 0.5, 0.016, 0.3, 1000); m.swish(SW1 + j * 1.2 + 0.7, 0.45, 0.012, 0.3, 800)
for j, d in enumerate(TM['days']): m.pluck(d, (72, 76, 79)[j], 0.014, 0.2, 0.6); m.shimmer(d + 0.02, (84 + 2 * j, 91 + 2 * j), 0.004, 0.2, 0.4, 0.9)

# ---------------------------------------------------------------- the boring stuff: the toy dog rolls in, a dumbbell drops, a week is ticked off
DG0, DG1 = TM['dog']; tw = m.t(DG0, DG1 + 0.1); sp = np.sin(np.pi * np.clip((tw - DG0) / (DG1 - DG0), 0, 1))
m.add('X', lp(m.noise(len(tw)), 260) * sp * 3 * 0.009, DG0, 0.3)
rot = np.cumsum(sp) / SR * 9.0; idx = np.nonzero(np.diff(np.floor(rot)))[0]
for i in idx[::2]: m.tick(DG0 + i / SR, 0.012 * float(sp[i]), 0.3, hi=2200, lo=900)
for j in range(10): m.tick(DG1 + 0.15 + j * 0.11, 0.004, 0.3, hi=3600, lo=2000)          # the spring tail wags
DB0, DB1 = TM['db']; m.swish(DB0, DB1 - DB0, 0.012, 0.15, 1400); m.thud(DB1, 80, 0.045, 0.15, 0.12); m.clink(DB1 + 0.01, 0.02, 0.15, 1500)
CA0, CA1 = TM['cal']; m.pluck(CA0 + 0.15, 79, 0.012, 0.0, 0.3)
for j, at in enumerate(TM['ticks']):                                                      # a pen ticks each day
    kk = int(0.07 * SR); m.add('X', bp(m.noise(kk), 2500, 7000) * env(kk, 0.002, 0.02) * 0.012, at, 0.0); m.pluck(at + 0.01, 84 + (j % 3), 0.005, 0.0, 0.15)
lift(*TM['objOut'], up=False, g=0.008, pan=0.2)

# ---------------------------------------------------------------- the repair kit: up out of the floor; its lid opens on the answer
BU0, BU1 = TM['boxUp']; lift(BU0, BU1, g=0.012, pan=0.3); m.clink(BU1 + 0.02, 0.016, 0.3, 1300)
LD0, LD1 = TM['lid']
tl = m.t(LD0, LD1 + 0.1); u = np.clip((tl - LD0) / (LD1 - LD0), 0, 1)
creak = bp(m.noise(len(tl)), 900, 2600) * (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(38 + 25 * u) / SR)) * np.sin(np.pi * u) ** 0.6
m.add('X', creak * 0.01, LD0, 0.3)
m.clink(LD1, 0.02, 0.3, 900); m.tock(LD1 + 0.03, 0.012, 0.3, f=520)
m.shimmer(LD1 + 0.15, (88, 91, 96), 0.006, 0.3, 0.5, 1.2)
lift(*TM['boxOut'], up=False, g=0.009, pan=0.3)

# ---------------------------------------------------------------- the end: the cap, the logo
m.whoosh(T['final'] - 0.5, 0.9, 200, 1300, 0.018, 0.1)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])

# ---------------------------------------------------------------- the score
m.pad([45, 57, 60, 64], 0.0, 8.6, 0.5, 1000)                         # rolling; the note
m.pad([43, 55, 59, 62, 66], 8.6, 16.3, 0.5, 1200)                    # fascia is real; the whole body
m.pad([40, 52, 55, 59], 16.3, 30.3, 0.5, 900)                        # 925 kg
m.pulse(21.6, 25.2, 92, [52, 55, 59, 55], 0.011, 1100, lvl=lambda t: float(ss(21.6, 22.2, t)) * (1 - float(ss(24.6, 25.2, t))))
m.pad([45, 57, 60, 64, 67], 30.3, 44.2, 0.5, 1200)                   # the swing; 4%; the same; gone
m.pad([41, 53, 57, 60], 44.2, 52.8, 0.5, 1000)                       # sore; nerves
m.pad([43, 55, 59, 62, 67], 52.8, 65.8, 0.5, 1300)                   # using it; the boring stuff
m.pulse(61.9, 65.4, 104, [69, 72, 76, 72], 0.008, 1500, lvl=lambda t: float(ss(61.9, 62.4, t)) * (1 - float(ss(64.9, 65.4, t))))
m.pad([45, 57, 61, 64], 65.8, 70.4, 0.5, 1300)                       # a warm-up
m.pulse(66.0, 70.3, 112, [69, 73, 76, 73], 0.008, 1600, lvl=lambda t: float(ss(66.0, 66.5, t)) * (1 - float(ss(69.8, 70.3, t))))
m.pad([38, 50, 57, 62], 70.4, 76.0, 0.5, 900)                        # see a doctor
m.pad([45, 57, 64, 69, 72, 76], 76.0, T['end'], 1.0, 2400, rel=0.2)
m.finish(REPORT, VOICE, OUT, 'film11')
