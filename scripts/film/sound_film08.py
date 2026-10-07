"""Film 8 "How can I fall asleep faster?" (new direction, 6 Oct 2026): score and sound design, timed to films/film08.js.
The bell's dings, the bell going into the table and the timer coming up, every minute the needle passes, the headphones,
the march and the foot that keeps time, getting up, the lamp, the book, the phone turning over, the yawn, the clock running
backwards, the bath, the diary filling and emptying, the logo: from the timing table the picture exports (timing08.json,
window.HFS_W.timing).
Usage: python3 sound_film08.py <voice guide wav> <voice report json> <out dir>"""
import sys, json, os
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=73.6, logo=71.08, you=0.35, ceiling=2.88, ordering=3.56, orders=7.10, lets=8.18, fix=8.70, body=10.48, ten=15.22,
         and2=17.55, trying=18.86, hard=19.27, marching=22.45, t34=26.85, t22=30.15, so=31.65, minutes3=33.62, get=33.84,
         dim=35.76, no=36.82, sleepy=39.57, it=40.88, backwards=41.64, treatment=42.86, insomnia=46.19, warm=48.25, one=49.25,
         studies=53.93, over=56.50, thirty=56.72, nights=59.06, months=60.76, see=61.19, dont=64.24, final=68.82, settings=70.40)
HERE = os.path.dirname(os.path.abspath(__file__))
TM = json.load(open(os.path.join(HERE, 'timing08.json')))
m = Mix(T['end'], seed=20261008)
rng = np.random.default_rng(88)
def s5(a, b, x):
    u = float(np.clip((x - a) / (b - a), 0, 1)); return u * u * u * (u * (u * 6 - 15) + 10)
def lerp(a, b, k): return a + (b - a) * k

# ---------------------------------------------------------------- the bedside clock (as the picture keeps it): a tick every second; a whirr when it spins
H = 3600.0
BK = TM['backwards']
CK = [(-5, 23 * H), (0.35, 23 * H), (2.95, 24 * H), (BK[0], 24 * H + (BK[0] - 2.95)), (BK[1], 21 * H + 30 * 60), (T['end'], 21 * H + 30 * 60 + (T['end'] - BK[1]))]
def clock_at(t):
    if t <= CK[0][0]: return CK[0][1]
    for (a, va), (b, vb) in zip(CK, CK[1:]):
        if t < b: return lerp(va, vb, s5(a, b, t))
    return CK[-1][1]
dt = 1 / 400; ts = np.arange(0, T['logo'], dt); cs = np.array([clock_at(x) for x in ts]); rate = np.gradient(cs, dt)
near = lambda x: 0.45 + 0.55 * float(ss(41.2, 41.7, x) * (1 - ss(42.7, 43.4, x)) + ss(48.3, 48.8, x) * (1 - ss(50.6, 51.4, x)))   # louder while we look at it
for i in range(1, len(ts)):
    if abs(rate[i]) < 3 and np.floor(cs[i]) != np.floor(cs[i - 1]): m.tock(ts[i], 0.014 * near(ts[i]), 0.3, f=1450)
spin = np.abs(rate) > 30
for i in range(1, len(ts)):   # spinning: the hands' gear train, a fine ratchet whose rate follows the speed
    if spin[i] and np.floor(cs[i] / 240) != np.floor(cs[i - 1] / 240): m.tick(ts[i], 0.010, 0.3, hi=4200, lo=2100)
m.whoosh(0.4, 2.4, 300, 1600, 0.012, 0.25)                                         # an hour goes by
m.whoosh(BK[0] - 0.05, BK[1] - BK[0] + 0.3, 2600, 300, 0.024, 0.2, up=False)       # backwards
n = int((BK[1] - BK[0]) * SR); x = np.arange(n) / SR                                # and a tape spooling back under it
rew = np.sin(2 * np.pi * np.cumsum(900 - 650 * x / x[-1]) / SR) * np.sin(np.pi * x / x[-1]) ** 2
m.add('X', bp(rew + 0.3 * m.noise(n), 400, 3000) * 0.006, BK[0], 0.2)

# ---------------------------------------------------------------- the timer: a fine detent at every minute the needle passes
def needle(t0, t1, v0, v1, pan=0.25, g=0.02):
    xs = np.linspace(t0, t1, 600); vs = np.array([v0 + (v1 - v0) * s5(t0, t1, x) for x in xs])
    for k in range(int(np.floor(min(v0, v1))) + 1, int(np.floor(max(v0, v1))) + 1):
        hit = np.argmax(vs >= k) if v1 > v0 else np.argmax(vs <= k)
        m.tick(xs[hit], g * (1.3 if k % 5 == 0 else 1.0), pan, hi=3300, lo=1500)
m.room(0.005)
needle(*TM['run1'], 0, 15)
m.bell(TM['band'] + 0.05, 79, 0.012, 0.25, 1.0, buf='X')                          # the band, 10 to 20
needle(25.2, 25.8, 15, 0, g=0.012)
needle(*TM['run34'], 0, 34); m.pluck(T['t34'] + 0.3, 64, 0.02, 0.25, 0.6)
m.pluck(T['t22'] + 0.1, 60, 0.018, 0.25, 0.6)                                     # the ghost needle stops at 22
needle(31.45, 31.95, 34, 0, g=0.012); needle(*TM['run20'], 0, 20)
needle(34.0, 34.3, 20, 0, g=0.01)
needle(*TM['run38'], 0, 38, g=0.018)
needle(*TM['setRun'], 38, 15, g=0.018)

# ---------------------------------------------------------------- the bell: up off the bed, four dings, back; the bell goes into the table, the timer comes up
def ding(at, gain=1.0, pan=0.3):
    n = int(2.2 * SR); x = np.arange(n) / SR; f0 = 2350.0 * (1 + rng.uniform(-0.004, 0.004))
    s = np.zeros(n)
    for r, a, d in [(1.0, 1.0, 1.5), (2.76, 0.45, 0.8), (5.40, 0.22, 0.45), (8.93, 0.10, 0.25)]:
        s += a * np.sin(2 * np.pi * f0 * r * x + rng.uniform(0, 6.28)) * np.exp(-x / d)
    s *= np.minimum(1, x * 3000) * (1 + 0.04 * np.sin(2 * np.pi * 5.5 * x))                       # a slight beat, as a struck dome has
    m.add('X', s * 0.03 * gain, at, pan)
    m.tick(at - 0.004, 0.035 * gain, pan, hi=2600, lo=700)                                         # the palm on the plunger
m.swish(TM['lift'] + 0.05, 0.5, 0.03, 0.2, 900)
for i, d in enumerate(TM['dings']): ding(d, [1.0, 0.95, 1.05, 0.9][i])
m.swish(TM['back'] + 0.05, 0.7, 0.025, 0.15, 800); m.rustle(TM['back'] + 0.4, TM['back'] + 1.0, 0.012, 0.0)
m.whoosh(TM['bellSink'] - 0.05, 0.6, 900, 200, 0.012, 0.3, up=False); m.thud(TM['bellSink'] + 0.48, 70, 0.04, 0.3, 0.08)
m.whoosh(TM['dialRise'] - 0.05, 0.6, 200, 900, 0.012, 0.3); m.clink(TM['dialRise'] + 0.52, 0.016, 0.3, 2200)

# ---------------------------------------------------------------- a busy head: sparks, thicker while trying hard
spk = rng.uniform(17.7, 30.8, 300)
for a in np.sort(spk):
    dens = 0.35 + 0.65 * float(ss(T['trying'] - 0.3, T['hard'] + 0.3, a) * (1 - ss(21.2, 22.4, a))) + 0.3 * float(ss(22.4, 23.0, a))
    if rng.random() < min(1, dens): m.tick(float(a), 0.006 * rng.uniform(0.5, 1.0), rng.uniform(-0.3, 0.3), hi=rng.uniform(5200, 7600), lo=3000)

# ---------------------------------------------------------------- the headphones, and a march (original), tinny, from the tape; the foot keeps time
P0, P1 = TM['phonesOn'], TM['phonesOff']
m.whoosh(P0 - 0.1, 0.65, 300, 1200, 0.012, 0.0); m.thud(P0 + 0.55, 160, 0.03, 0.0, 0.06); m.rustle(P0 + 0.3, P0 + 0.8, 0.008, 0.0)
M0, M1, BEAT = TM['march']
m.tick(M0 - 0.25, 0.045, 0.3, hi=1600, lo=500); m.tock(M0 - 0.18, 0.028, 0.3, f=300)                 # play
dur = M1 - M0 + 0.2; tt = m.t(M0, M0 + dur); N = len(tt); rate = np.ones(N)
stop = (tt > M1 - 0.45); rate[stop] = np.maximum(0.25, 1 - (tt[stop] - (M1 - 0.45)) / 0.55)          # the tape slows as they come off
pos = np.cumsum(rate) / SR
march = np.zeros(N)
A = [72, 69, 65, 69, 72, None, 77, None, 76, 74, 72, 70, 69, None, 72, None]
B = [74, 72, 70, 69, 67, None, 72, None, 74, 76, 77, 74, 72, None, 69, None]
C = [70, 72, 74, 70, 69, None, 65, None, 67, 69, 70, 67, 65, None, None, None]
MEL = A + B + A + C + A
def voice(start, length, nn, w, kind):
    on = (pos >= start) & (pos < start + length); ph = 2 * np.pi * note(nn) * (pos - start)
    tone = np.sign(np.sin(ph)) * 0.5 + np.sin(ph) if kind == 'brass' else np.sin(ph) + 0.4 * np.sin(2 * ph)
    e = np.exp(-np.maximum(0, pos - start) / (0.25 if kind == 'brass' else 0.12)) * np.minimum(1, (pos - start) * 120)
    return tone * e * on * w
NB = int(np.ceil((M1 - M0) / BEAT)) + 1
for i, nn in enumerate(MEL[:NB * 2]):
    if nn: march += voice(i * BEAT / 2, BEAT / 2 * 0.9, nn, 0.5, 'brass')
for b in range(NB):
    march += voice(b * BEAT, BEAT * 0.45, [41, 48][b % 2], 0.8, 'bass')
    for nn in (57, 60, 65): march += voice(b * BEAT + BEAT / 2, BEAT * 0.2, nn, 0.18, 'stab')
    sn = (pos >= b * BEAT + BEAT / 2) & (pos < b * BEAT + BEAT / 2 + 0.08)
    march += bp(m.noise(N), 1800, 6000) * sn * np.exp(-np.maximum(0, pos - (b * BEAT + BEAT / 2)) / 0.03) * 0.6
near_head = 0.75 + 0.25 * ss(22.6, 23.2, tt) * (1 - ss(23.8, 24.3, tt))
march = bp(march, 650, 3600) * 0.02 * near_head * ss(M0, M0 + 0.15, tt) * (1 - ss(M1 - 0.05, M1 + 0.15, tt))
m.add('X', march, M0, -0.1); m.add('X', bp(m.noise(N), 3000, 9000) * 0.0014 * (tt < M1), M0, -0.1)   # tape hiss
for b in range(NB - 1):   # each tap: the heel on the sheet
    at = M0 + b * BEAT + 0.09
    if at < M1 - 0.3: m.add('X', bp(m.noise(int(0.12 * SR)), 900, 5200) * env(int(0.12 * SR), 0.006, 0.04) * 0.008, at, -0.3)
m.thud(P1 + 0.35, 150, 0.02, 0.0, 0.05); m.whoosh(P1, 0.6, 1200, 300, 0.01, 0.0, up=False)             # headphones off

# ---------------------------------------------------------------- twenty minutes awake: up; the lamp; a book; the phone turns over; a yawn; back to bed
def creak(at, dur, gain=0.02, pan=0.0, f0=48):
    n = int(dur * SR); x = np.arange(n) / SR; f = f0 * (1 + 0.25 * np.sin(2 * np.pi * 1.3 * x) + 0.08 * m.rng.standard_normal(n).cumsum() / np.sqrt(n))
    imp = (np.diff(np.floor(np.cumsum(f) / SR), prepend=0) > 0).astype(float)
    s = bp(imp + 0.02 * m.noise(n), 500, 2200) * np.sin(np.pi * np.clip(x / dur, 0, 1)) ** 1.5
    m.add('X', s * gain, at, pan)
G0 = TM['getUp']
creak(G0 + 0.1, 0.9, 0.05, 0.1); m.rustle(G0, G0 + 1.2, 0.02, 0.0); m.thud(G0 + 1.05, 90, 0.03, 0.1, 0.07); m.thud(G0 + 1.12, 85, 0.025, 0.2, 0.07)
m.whoosh(TM['dialDown'], 0.45, 700, 200, 0.008, 0.35, up=False)                                       # the timer goes in
m.whoosh(TM['bookUp'], 0.5, 200, 800, 0.008, 0.35); m.thud(TM['bookUp'] + 0.48, 120, 0.012, 0.35, 0.04)   # the book comes up
m.rustle(TM['bookOpen'], TM['bookOpen'] + 0.6, 0.012, 0.3)                                            # it opens
m.tick(TM['lamp'] - 0.02, 0.055, 0.4, hi=2400, lo=800); m.thud(TM['lamp'], 220, 0.01, 0.4, 0.03)       # the lamp, dim
tt = m.t(TM['lamp'], 40.1); m.add('X', (np.sin(2 * np.pi * 120 * tt) * 0.5 + np.sin(2 * np.pi * 240 * tt) * 0.2) * 0.0015 * ss(tt[0], tt[0] + 0.3, tt) * (1 - ss(39.85, 40.1, tt)), tt[0], 0.4)
m.rustle(TM['page'], TM['page'] + 0.5, 0.012, 0.3); m.swish(TM['page'] + 0.1, 0.4, 0.008, 0.3, 2600)   # a page
m.swish(TM['flip'] + 0.05, 0.4, 0.015, 0.45, 1800); m.tock(TM['flip'] + 0.48, 0.035, 0.45, f=900)      # the phone turns itself face down
m.add('X', bp(m.noise(int(0.08 * SR)), 300, 2400) * env(int(0.08 * SR), 0.002, 0.03) * 0.03, TM['bookShut'] + 0.48, 0.3)   # the book shut
m.whoosh(TM['bookDown'], 0.45, 700, 200, 0.008, 0.35, up=False)
creak(TM['yawn'] + 0.1, 0.8, 0.022, 0.0, f0=32)                                                       # a yawn (the jaw's hinge)
m.tick(40.05, 0.045, 0.4, hi=2400, lo=800)                                                            # the lamp off
creak(TM['lieDown'] + 0.3, 1.1, 0.045, 0.0); m.rustle(TM['lieDown'] + 0.2, TM['lieDown'] + 1.5, 0.02, 0.0)

# ---------------------------------------------------------------- a warm bath or shower: water, then warmth rising off the bones
tt = m.t(T['warm'] - 0.1, 51.4)
water = bp(m.noise(len(tt)), 1200, 7000) * (0.7 + 0.3 * lp(np.abs(m.noise(len(tt))), 30) * 3).clip(0, 1.4)
m.add('X', water * 0.006 * ss(tt[0], tt[0] + 0.8, tt) * (1 - ss(tt[-1] - 1.0, tt[-1], tt)), tt[0], -0.2)
S0, S1 = TM['steam']; tt = m.t(S0, S1)
m.add('X', hp(m.noise(len(tt)), 5000) * 0.003 * ss(tt[0], tt[0] + 0.8, tt) * (1 - ss(tt[-1] - 0.8, tt[-1], tt)), tt[0], 0.0)

# ---------------------------------------------------------------- over thirty minutes, three nights a week, three months: the diary fills, week by week; then it empties
m.whoosh(TM['dialUp'] - 0.05, 0.6, 200, 900, 0.012, 0.3); m.clink(TM['dialUp'] + 0.52, 0.014, 0.3, 2200)
m.whoosh(TM['phoneDown'], 0.45, 700, 200, 0.008, 0.4, up=False)
m.whoosh(TM['diaryUp'] - 0.05, 0.55, 200, 1300, 0.014, 0.35); m.rustle(TM['diaryUp'] + 0.3, TM['diaryUp'] + 0.7, 0.01, 0.35)
F0, F1 = TM['fill']
for k in range(13): m.tick(F0 + (F1 - F0) * (k + 0.5) / 13, 0.018, 0.35, hi=2800, lo=1100)
R0, R1 = TM['rewind']
for k in range(11): m.tick(R1 - (R1 - R0) * (k + 0.5) / 11, 0.012, 0.35, hi=3600, lo=1600)
m.whoosh(R0, R1 - R0 + 0.2, 2200, 500, 0.012, 0.35, up=False)
m.whoosh(TM['diaryDown'], 0.5, 900, 200, 0.01, 0.35, up=False)

# ---------------------------------------------------------------- the score
m.pad([38, 50, 57, 62], 0.0, 8.0, 0.5, 850)                           # lying awake, ringing for sleep
m.pad([43, 55, 59, 62], 8.0, 17.4, 0.55, 1100)                         # on its own: 10 to 20 minutes
m.pad([38, 50, 53, 57], 17.4, 31.4, 0.5, 800)                          # a busy head (the march plays over it)
m.pad([41, 53, 57, 60], 31.4, 40.8, 0.5, 1000)                         # get up, read, back to bed
m.pad([43, 55, 58, 62, 67], 40.8, 47.6, 0.55, 1300)                    # backwards; the treatment
m.pad([41, 53, 57, 60, 64], 47.6, 55.2, 0.55, 1400)                    # warm water
m.pad([36, 48, 51, 55], 55.2, 68.6, 0.55, 800)                         # see a doctor
m.pulse(44.6, 47.4, 92, [65, 69, 72, 69, 77, 72, 69, 72], 0.014, 1400, lvl=lambda t: float(ss(44.6, 45.4, t)) * (1 - float(ss(46.8, 47.4, t))))
m.pad([41, 53, 60, 65, 69, 72], 68.6, T['end'], 1.0, 2400, rel=0.2)
m.whoosh(T['final'] - 0.1, T['logo'] - T['final'], 220, 2600, 0.05, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
m.finish(REPORT, VOICE, OUT, 'film08')
