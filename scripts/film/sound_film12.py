"""Film 12 "Cold remedies" (new direction, 7 Oct 2026): score and sound design, timed to films/film12.js.
Coins piling up beside a pyramid of vitamin C; a sneeze and its spray; a sticky note slapped on the forehead and peeled
off; the plinth rising; two weeks of days lit one by one, the better ones brighter; tissues dropping into two jars at the
same rate; a fizzy tablet in a glass; an orange dropped on the table, rolling into the pyramid, the tubes clattering off it
onto the floor; a balance taking a mug, a lemon slice and a honey dipper until it is level; steam; a rubber stamp; a
slump, short breaths, a chest that hurts; a thermometer rising twice; the plinth back up, the dial, the logo. Every time
comes from the timing table the picture exports (timing12.json, window.HFS_W.timing).
Usage: python3 sound_film12.py <voice guide wav> <voice report json> <out dir>"""
import sys, json, os
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=80.87, logo=78.35, every=0.35, cold=5.16, wrong=7.30, lets=8.27, your=10.28, most=13.34, daily=17.45, and3=22.5, so=26.93,
         heres=30.55, hot=32.3, about=34.64, but=36.39, never=36.71, and5=39.75, retire=40.19, theres=42.38, scalds=46.27, see=49.88,
         worse=51.31, high=54.53, over=56.19, cough2=57.49, cold3=59.5, go=61.86, very=62.92, weak=65.66, iff=70.05, get=73.57,
         final=76.09, settings=77.67)
HERE = os.path.dirname(os.path.abspath(__file__))
TM = json.load(open(os.path.join(HERE, 'timing12.json')))
m = Mix(T['end'], seed=20261012)
rng = np.random.default_rng(1212)
def s5(a, b, x):
    u = np.clip((np.asarray(x, dtype=float) - a) / (b - a), 0, 1); return u * u * u * (u * (u * 6 - 15) + 10)
m.room(0.005)

def lift(t0, t1, up=True, g=0.012, pan=0.0):                     # something rising out of (or sinking into) the floor or the plinth
    tl = m.t(t0, t1 + 0.05); nn = len(tl); u = np.clip((tl - t0) / (t1 - t0), 0, 1)
    f = 52 + 22 * (u if up else 1 - u)
    hum = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + np.sin(2 * np.pi * np.cumsum(2 * f) / SR) * 0.25
    m.add('X', (hum + lp(m.noise(nn), 170) * 0.9) * np.sin(np.pi * u) ** 0.7 * g, t0, pan)
    if up: m.thud(t1, 72, 0.02, pan, 0.08)
def one(at, sig, gain, pan=0.0): m.add('X', sig * gain, at, pan)
def plop(f0=900, f1=300, d=0.05):                                  # a drop into water
    k = int(0.3 * SR); x = np.arange(k) / SR
    return np.sin(2 * np.pi * np.cumsum(f0 * np.exp(-x / 0.03) + f1) / SR) * env(k, 0.001, d)
def creak(t0, dur, g, pan):                                        # the balance's pivot as the beam swings
    tl = m.t(t0, t0 + dur); u = np.clip((tl - t0) / dur, 0, 1)
    s = bp(m.noise(len(tl)), 1100, 3200) * (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(30 + 20 * u) / SR)) * np.exp(-u * 3)
    m.add('X', s * g, t0, pan)

# ---------------------------------------------------------------- a small fortune: coins dropping onto three stacks
for i, at in enumerate(TM['coins']):
    k = i // 3
    m.clink(at, 0.026 + 0.012 * rng.random(), 0.12, f=2500 + 900 * rng.random() + 40 * k)
    m.tick(at + 0.004, 0.01, 0.12, hi=3800, lo=1500)
    m.clink(at + 0.045 + 0.02 * rng.random(), 0.007, 0.12, f=3400 + 600 * rng.random())   # a little ring as it settles

# ---------------------------------------------------------------- the whip up to the face; the sneeze: a breath drawn in, the burst, the spray
m.whoosh(3.25, 1.0, 250, 1800, 0.018, -0.1)
A0, A1 = TM['ah']; SN = TM['sneeze']
ta = m.t(A0, A1 + 0.05); u = np.clip((ta - A0) / (A1 - A0), 0, 1)
m.add('X', bp(m.noise(len(ta)), 500, 2600) * u ** 1.6 * 0.022, A0, 0.0)
m.tone_line(A0 + 0.1, A1 + 0.06, 67, 0.006, 0.0, glide=lambda t: 5 * ss(A0, A1, t))
k = int(0.5 * SR); x = np.arange(k) / SR
one(SN - 0.01, bp(m.noise(k), 900, 7500) * env(k, 0.002, 0.07) + lp(m.noise(k), 420) * env(k, 0.001, 0.05) * 0.8, 0.09, -0.05)
m.thud(SN, 92, 0.03, 0.0, 0.08)
m.rain(SN + 0.03, SN + 0.55, 46, 0.006, pitch=(92, 106), seed=12)

# ---------------------------------------------------------------- what went wrong: a sticky note slapped on; let's sort it out: peeled off, fluttering away
NT = TM['slap']
m.swish(NT - 0.17, 0.18, 0.016, 0.0, 2400)
k = int(0.3 * SR); x = np.arange(k) / SR
one(NT, bp(m.noise(k), 700, 6500) * env(k, 0.0005, 0.022) + np.sin(2 * np.pi * 165 * x) * env(k, 0.001, 0.045) * 0.7, 0.07, 0.0)
one(NT + 0.05, bp(m.noise(int(0.09 * SR)), 2500, 8000) * env(int(0.09 * SR), 0.002, 0.03), 0.01, 0.0)
m.pluck(NT + 0.32, 62, 0.012, 0.0, 0.5); m.pluck(NT + 0.52, 61, 0.01, 0.0, 0.6)       # a puzzled two notes
NO = TM['peel']
for j in range(18): m.tick(NO + j * 0.006 + rng.uniform(0, 0.004), 0.004 * rng.uniform(0.5, 1.0), 0.0, hi=rng.uniform(3000, 6200), lo=1500)
m.swish(NO + 0.06, 0.8, 0.011, 0.0, 1700); m.rustle(NO + 0.25, NO + 1.05, 0.005, 0.0)

# ---------------------------------------------------------------- the plinth rises; the body that beats a cold; the days
lift(*TM['rise'], g=0.012, pan=0.0)
m.whoosh(9.45, 1.2, 220, 1500, 0.016, 0.1)
m.whoosh(12.25, 1.3, 220, 1500, 0.016, 0.2)
for j, at in enumerate(TM['ill']): m.tick(at, 0.007, 0.2, hi=880 + 20 * j, lo=420)            # each day of the cold, muted
for j, at in enumerate(TM['better']): m.pluck(at, (64, 66, 67, 69, 71, 72, 74, 76)[j], 0.012, 0.2, 0.4)   # day 7 to 14: better
m.shimmer(TM['better'][-1] + 0.12, (84, 88, 91), 0.006, 0.2, 0.5, 1.4)

# ---------------------------------------------------------------- the days go down, the jars come up; tissues, the same rate in both jars
m.whoosh(16.7, 0.95, 260, 1200, 0.012, 0.2)
lift(*TM['calDown'], up=False, g=0.007, pan=0.2); lift(*TM['jarsUp'], g=0.008, pan=0.2)
for i, at in enumerate(TM['drops']):
    pan = -0.25 if i % 2 == 0 else 0.25                                                      # VITAMIN C on the left, PLACEBO on the right
    m.swish(at - 0.22, 0.24, 0.006, pan, 1800)
    k = int(0.25 * SR); one(at, bp(m.noise(k), 300, 2500) * env(k, 0.003, 0.03) + lp(m.noise(k), 200) * env(k, 0.002, 0.05) * 0.5, 0.032, pan)
    m.rustle(at + 0.02, at + 0.3, 0.004, pan)
# the tablet: a plop, then the fizz
TB = TM['tab']; F0, F1 = TM['fizz']
m.swish(TB - 0.26, 0.26, 0.006, 0.0, 2200)
one(TB, plop(), 0.04, 0.0)
tf = m.t(F0, F1 + 0.3); nf = len(tf); fe = ss(F0, F0 + 0.3, tf) * (1 - ss(F1 - 1.2, F1 + 0.3, tf))
cr = np.zeros(nf); idx = rng.integers(0, nf, 1600); cr[idx] = rng.uniform(-1, 1, 1600)
one(F0, hp(m.noise(nf), 4200) * fe * 0.006 + bp(cr, 3000, 12000) * fe * 0.5, 1.0, 0.0)

# ---------------------------------------------------------------- the orange: dropped on the table, a hop, a roll; the pyramid scattered, the tubes on the floor
m.whoosh(26.4, 1.0, 240, 1600, 0.016, 0.2)
OL = TM['orangeLand']; R0, R1 = TM['orangeRoll']; ST = TM['strike']
m.swish(OL - 0.3, 0.3, 0.008, 0.1, 1200)
m.thud(OL, 118, 0.035, 0.1, 0.06); m.tock(OL + 0.004, 0.012, 0.1, f=380); m.thud(OL + 0.17, 130, 0.01, 0.1, 0.04)
tr = m.t(R0, ST + 1.2); one(R0, lp(m.noise(len(tr)), 240) * ss(R0, R0 + 0.08, tr) * (1 - ss(ST + 0.3, ST + 1.2, tr)) * (1 - 0.6 * ss(ST, ST + 0.05, tr)), 0.022, 0.15)
for t0 in TM['tubeTable']: m.tock(t0 + 0.004, 0.018 + 0.01 * rng.random(), 0.3, f=700 + 320 * rng.random())          # plastic on plastic
for at in TM['tubeLand']: m.tock(at, 0.013 + 0.012 * rng.random(), 0.45, f=560 + 420 * rng.random()); m.tick(at + 0.003, 0.006, 0.45, hi=2600, lo=900)
for at in TM['tubeLand'][::2]:                                                                # the tablets rattling inside
    for j in range(4): m.tick(at + 0.02 + j * 0.018 + rng.uniform(0, 0.01), 0.003, 0.45, hi=4200, lo=2000)
m.pluck(ST + 0.05, 72, 0.012, 0.3, 0.25); m.pluck(ST + 0.2, 79, 0.011, 0.3, 0.32)

# ---------------------------------------------------------------- past the skeleton to the balance: a mug, a lemon slice, a honey dipper; the beam swings, then level
m.whoosh(29.85, 2.3, 200, 1400, 0.018, -0.1)
MG, LM, DP = TM['mug'], TM['lemon'], TM['dip']
m.swish(MG - 0.29, 0.29, 0.008, -0.3, 1100); m.clink(MG, 0.028, -0.3, f=1900); m.thud(MG, 140, 0.025, -0.3, 0.05); creak(MG + 0.02, 1.0, 0.006, -0.3)
k = int(0.25 * SR); x = np.arange(k) / SR
splash = hp(m.noise(k), 2000) * env(k, 0.001, 0.03) + np.sin(2 * np.pi * np.cumsum(1300 * np.exp(-x / 0.02) + 500) / SR) * env(k, 0.001, 0.04) * 0.6
m.swish(LM - 0.25, 0.25, 0.006, -0.3, 1600); one(LM, splash, 0.02, -0.3); creak(LM + 0.02, 0.8, 0.004, -0.3)
m.swish(DP - 0.25, 0.25, 0.006, -0.3, 1400); m.tock(DP, 0.016, -0.3, f=900); one(DP + 0.01, splash, 0.012, -0.3); creak(DP + 0.02, 1.2, 0.005, -0.3)
L0, L1 = TM['level']; m.pluck(L1 - 0.32, 69, 0.012, -0.25, 0.5); m.pluck(L1 - 0.16, 69, 0.01, 0.25, 0.5)   # level: the same note on both sides
tm_ = m.t(MG, 39.0); one(MG, hp(m.noise(len(tm_)), 3000) * ss(MG, MG + 1.0, tm_) * (1 - ss(38.4, 39.0, tm_)), 0.0022, -0.3)
m.tone_line(T['never'] + 0.1, T['never'] + 2.2, 62, 0.005, -0.1)                              # never honey under one: a low, steady note

# ---------------------------------------------------------------- the bowl under a towel: up out of the plinth, steaming; the stamp comes down: RETIRED
m.whoosh(38.95, 1.0, 240, 1500, 0.016, 0.1)
lift(*TM['bowlUp'], g=0.01, pan=0.0)
S0, S1 = TM['steamBowl']; ts_ = m.t(S0, S1)
one(S0, hp(m.noise(len(ts_)), 2500) * ss(S0, S0 + 1, ts_) * (1 - ss(S1 - 0.8, S1, ts_)) * (1 + 0.9 * ss(T['scalds'] - 0.3, T['scalds'] + 0.4, ts_) * (1 - ss(48.2, 48.9, ts_))), 0.0028, 0.0)
SD, SH = TM['stampDown'], TM['stamp']; U0, U1 = TM['stampUp']
m.whoosh(SD - 0.1, SH - SD + 0.12, 300, 1600, 0.02, 0.0, up=False)
m.thud(SH, 74, 0.07, 0.0, 0.14); k = int(0.3 * SR); one(SH, bp(m.noise(k), 300, 3000) * env(k, 0.001, 0.02), 0.05, 0.0)
m.swish(U0, U1 - U0, 0.012, 0.0, 1100)
m.tone_line(SH + 0.06, SH + 0.95, 55, 0.008, 0.0, glide=lambda t: -3 * ss(SH, SH + 0.8, t))
m.tick(T['theres'] + 0.2, 0.007, -0.3, hi=2400, lo=1000); m.tick(45.45, 0.007, -0.3, hi=2400, lo=1000)                 # the tags

# ---------------------------------------------------------------- getting worse: the plinth sinks, the body slumps; short breaths; a chest that hurts
m.whoosh(49.0, 1.1, 220, 1300, 0.014, 0.0)
lift(*TM['sink'], up=False, g=0.012, pan=0.0)
SL0, SL1 = TM['slump']; m.tone_line(SL0, SL1 + 0.6, 57, 0.008, 0.0, glide=lambda t: -4 * ss(SL0, SL1, t))
B0, B1 = TM['sob']
for kk in range(int(B0 / 1.05), int(B1 / 1.05) + 2):                                          # in step with the shoulders: in as they rise, out as they fall
    t_in = 1.05 * (kk - 0.25)
    if B0 + 0.15 < t_in < B1 - 0.4:
        g = float(ss(B0, B0 + 0.4, t_in) * (1 - ss(B1 - 0.6, B1, t_in)))
        m.swish(t_in, 0.5, 0.007 * g, 0.0, 950); m.swish(t_in + 0.52, 0.5, 0.005 * g, 0.0, 700)
C0, C1 = TM['chest']
for kk in range(80):
    at = (np.pi / 2 + 2 * np.pi * kk) / 7.5 - 0.06                                             # the glow's own beat
    if C0 < at < C1 - 0.2: m.heartbeat(at, 0.05, 0.0)

# ---------------------------------------------------------------- the thermometer: up to high; the tags; very high
m.whoosh(53.7, 1.25, 230, 1400, 0.014, 0.2)
H0, H1 = TM['thermoUp']; m.tone_line(H0, H1 + 0.5, 64, 0.009, 0.2, glide=lambda t: 7 * s5(H0, H1, t))
for at in (T['over'] + 0.1, T['cough2'] + 0.45, T['cold3'] + 0.35): m.tick(at, 0.008, 0.3, hi=2400, lo=1000)
V0, V1 = TM['thermoUp2']; m.tone_line(V0, V1 + 0.6, 71, 0.01, 0.2, glide=lambda t: 5 * s5(V0, V1, t)); m.shimmer(V1, (83, 88, 95), 0.005, 0.2, 0.5, 1.2)
m.whoosh(63.7, 1.7, 200, 1100, 0.012, 0.0, up=False); m.whoosh(68.0, 2.6, 200, 1200, 0.01, 0.0)

# ---------------------------------------------------------------- the end: sitting up; the plinth back up; the dial; the needle through the days; 7 to 14; the logo
SU0, SU1 = TM['sitUp']; m.swish(SU0, SU1 - SU0, 0.008, 0.0, 700)
m.whoosh(75.2, 1.3, 220, 1400, 0.014, 0.0)
lift(*TM['rise2'], g=0.012, pan=0.0)
m.clink(TM['dialUp'] + 0.5, 0.014, 0.0, f=1500)
N0, N1 = TM['needle']; tg = np.linspace(N0, N1, 4000); vv = 14 * s5(N0, N1, tg)
for j in range(1, 15): at = float(np.interp(j, vv, tg)); m.tick(at, 0.009 if j % 7 else 0.014, 0.0, hi=2600, lo=1100)
m.shimmer(TM['arc'] - 0.15, (79, 84, 88), 0.008, 0.0, 0.6, 1.6)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])

# ---------------------------------------------------------------- the score
m.pad([45, 57, 60, 64], 0.0, 9.6, 0.5, 1000)                         # a small fortune; a sneeze; what went wrong
m.pad([41, 53, 57, 60, 64], 9.6, 17.2, 0.5, 1300)                    # a body built for this; better in 1 to 2 weeks
m.pad([43, 55, 59, 62], 17.2, 26.7, 0.5, 1000)                       # the trials: the same both sides
m.pulse(18.7, 21.9, 96, [55, 59, 55, 59], 0.009, 1200, lvl=lambda t: float(ss(18.7, 19.2, t)) * (1 - float(ss(21.4, 21.9, t))))
m.pad([45, 57, 60, 64, 67], 26.7, 30.4, 0.5, 1300)                   # eat the orange
m.pulse(27.4, 29.8, 116, [69, 72, 76, 72], 0.008, 1600, lvl=lambda t: float(ss(27.4, 27.9, t)) * (1 - float(ss(29.3, 29.8, t))))
m.pad([48, 55, 60, 64], 30.4, 39.6, 0.5, 1300)                       # what holds up
m.pad([40, 52, 55, 59], 39.6, 49.6, 0.5, 900)                        # retire the bowl
m.pad([38, 50, 57, 62], 49.6, 61.6, 0.5, 900)                        # see a doctor
m.pad([41, 53, 57, 60], 61.6, 70.0, 0.5, 900)                        # go sooner
m.pad([43, 55, 59, 62], 70.0, 76.0, 0.5, 900)                        # emergency help
m.pad([45, 57, 64, 69, 72, 76], 76.0, T['end'], 1.0, 2400, rel=0.2)
m.finish(REPORT, VOICE, OUT, 'film12')
