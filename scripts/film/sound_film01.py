"""Film 1 "Why am I always tired?" (new direction): score and sound design, timed to films/film01.js (the clock racing to
midnight and the blue arc of six hours, the swipes of the feed, the jaw creaking open in a yawn, the phone dropped on the
face: a bonk; the glass skull and the grains pouring in all day, the robot vacuum's jingle and whir, the alarm that cuts the
night short and the vacuum's sad beeps; the warning light's dings, the tape ripped and slapped on, the dings muffled under
it; the cup's evening on a racing clock; the buzz like a phone on vibrate; the sun up and down, the lamp's click, the
screen; the split-flap board, cell by cell, the alarm again; the settings; he sits up; the clock becomes the logo).
Usage: python3 sound_film01.py <voice guide wav> <voice report json> <out dir>"""
import sys, math
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=79.2, logo=76.75, six=1.08, drink=1.65, coffee=1.94, after=2.26, dinner=2.59, scroll=3.05, midnight=4.56, always=6.76, tired=7.62,
         lets=8.66, fix=9.18, all=10.52, chemical=11.41, sleepy=13.50, cleaning=14.99, crew=15.59, cut=17.45, yesterdays=19.05,
         coffee2=22.46, tape=26.08, over=26.53, drink2=28.72, six2=29.50, half=30.99, eleven=32.59, maybe=33.64, caffeinated=36.47,
         your=38.11, sun=39.88, lamp=41.78, screen=42.46, daytime=45.94, late=48.49, alarm=49.70, sadly=50.05, on=51.33,
         so2=52.77, bed2=55.33, coffee3=56.87, lights=58.61, if1=60.52, final=74.48, factory=75.69, settings=76.06)
H = 3600
m = Mix(T['end'], seed=20261020)
rng = np.random.default_rng(101)
def s5(a, b, x):
    u = min(1.0, max(0.0, (x - a) / (b - a))); return u * u * u * (u * (u * 6 - 15) + 10)
def sm(a, b, x): return float(ss(a, b, x))

# ---------------------------------------------------------------- the film's clock (the same keys, eased the same way)
CK = [(-5, 23 * H + 45 * 60), (T['scroll'], 23 * H + 53 * 60), (T['midnight'], 24 * H), (10.2, 24 * H + 12 * 60),
      (10.65, 31 * H), (13.7, 46 * H + 30 * 60), (14.45, 49 * H), (T['cut'], 55 * H), (22.2, 55 * H + 25 * 60),
      (22.6, 56 * H), (28.3, 58 * H), (28.68, 66 * H), (T['eleven'], 71 * H), (37.6, 73 * H + 20 * 60),
      (38.4, 84 * H), (40.1, 84 * H + 30 * 60), (41.6, 93 * H + 30 * 60), (43.2, 95 * H), (49.3, 97 * H), (T['alarm'], 103 * H)]
def clock(t):
    if t <= CK[0][0]: return CK[0][1]
    for (a, va), (b, vb) in zip(CK, CK[1:]):
        if t < b: return va + (vb - va) * s5(a, b, t)
    return CK[-1][1]
def ticks(a, b, gain, cap=24.0, pan=0.25):   # a tick each time the minute hand passes a mark (no faster than the cap)
    x, last, prev = a, -9.0, math.floor(clock(a) / 60)
    while x < b:
        mn = math.floor(clock(x) / 60)
        if mn != prev and x - last >= 1 / cap:
            m.tick(x, gain * rng.uniform(0.75, 1.0), pan, hi=2100, lo=760); last = x
        prev = mn; x += 0.001
ticks(0.0, 3.2, 0.05, pan=0.3)            # the opening: the clock beside the bed
ticks(3.2, 4.6, 0.04, pan=0.15)           # racing to midnight
m.bell(T['midnight'] + 0.01, 84, 0.016, 0.15, 0.5, buf='X')
ticks(4.6, 9.0, 0.012, pan=0.3)           # late, quiet
ticks(10.2, 14.5, 0.022, pan=0.2)         # a whole day goes by
ticks(14.5, 17.4, 0.008, pan=0.2)         # the night (under the vacuum)
ticks(28.25, 32.7, 0.04, pan=0.35)        # the cup's evening: ten in the morning to eleven at night
ticks(37.55, 38.45, 0.02, pan=0.3)        # night to noon
ticks(49.25, 49.75, 0.03, pan=0.3)        # the night skipped
# the blue arc: six hours of sleep
m.shimmer(T['six'] - 0.13, (84, 91, 96), 0.012, 0.3, 0.5, 1.6)
# ---------------------------------------------------------------- the feed: six swipes; the jaw: a creaky yawn and a clack
for f in [3.2, 3.75, 4.3, 4.85, 5.5, 6.1]:
    m.swish(f, 0.3, 0.012, -0.1, f=2600); m.tick(f + 0.3, 0.006, -0.1, hi=3600, lo=1800)
def creak(at, dur, gain, f0=1000, r0=30, r1=60, pan=0.0):   # stick-slip: a hinge, a jaw, a bed frame
    n = int(dur * SR); x = np.arange(n) / SR; rate = r0 + (r1 - r0) * x / dur + 6 * np.sin(2 * np.pi * 2.5 * x)
    ph = np.cumsum(rate) / SR; imp = np.zeros(n); k = np.nonzero(np.diff(np.floor(ph)) > 0)[0]
    imp[k] = rng.uniform(0.5, 1.0, len(k))
    s = bp(imp, f0 * 0.7, f0 * 1.4) + 0.5 * bp(imp, f0 * 2.1, f0 * 2.7) + 0.3 * lp(imp, f0 * 0.5)
    m.add('X', s * np.sin(np.pi * np.clip(x / dur, 0, 1)) ** 0.6 * gain, at, pan)
creak(T['always'] - 0.35, 0.5, 0.05, 1150, 22, 60, -0.05)      # open
creak(T['lets'] - 0.62, 0.38, 0.035, 1300, 60, 26, -0.05)     # and shut
m.tock(T['lets'] - 0.21, 0.035, -0.05, f=1250)                 # the teeth meet
# ---------------------------------------------------------------- the drop: the phone falls on the face (bonk), slides off onto the mattress
DROP0, HIT = T['lets'] - 0.35, T['fix'] - 0.02
m.swish(DROP0 + 0.35, HIT - DROP0 - 0.35, 0.02, 0.0, f=1600)
def bonk(at, gain):   # a phone on a skull: a glassy click and a hollow knock
    n = int(0.5 * SR); x = np.arange(n) / SR
    knock = sum(np.sin(2 * np.pi * f * x) * np.exp(-x / d) * w for f, d, w in [(310, 0.07, 1.0), (520, 0.045, 0.55), (870, 0.025, 0.35), (1430, 0.012, 0.25)])
    click = bp(m.noise(n), 2500, 9000) * env(n, 0.0003, 0.004) * 0.7 + np.sin(2 * np.pi * 3900 * x) * env(n, 0.0002, 0.006) * 0.3
    m.add('X', (knock * np.minimum(1, x / 0.0008) + click) * gain, at, 0.0)
bonk(HIT, 0.16); bonk(HIT + math.pi / 22, 0.035); bonk(HIT + 2 * math.pi / 22, 0.012)
m.swish(T['all'] - 0.05, 0.9, 0.012, 0.15, f=900)              # it slides off
m.thud(T['all'] + 0.82, 80, 0.035, 0.2, 0.06); m.rustle(T['all'] + 0.7, T['all'] + 1.2, 0.012, 0.2)
# ---------------------------------------------------------------- the glass skull; a day's grains pour in
m.shimmer(T['all'] - 0.3, (79, 86, 91), 0.016, 0.0, 0.7, 2.2)
m.rain(T['all'] + 0.1, T['sleepy'] + 0.2, 240, 0.010, (86, 102), seed=11)
m.shimmer(T['chemical'] + 0.02, (74, 81, 86), 0.008, -0.1, 0.9, 2.4)
# ---------------------------------------------------------------- the cleaning crew: a robot vacuum pops on, whirs, sucks up grains; the alarm; it gives up
VS = T['cleaning']; STOP = T['cut'] + 0.15
n = int(0.12 * SR); xx = np.arange(n) / SR
m.add('X', np.sin(2 * np.pi * np.cumsum(500 * (1 + 1.2 * xx / 0.12)) / SR) * env(n, 0.002, 0.03) * 0.03, VS, 0.1)   # the pop
for k, nn in enumerate([79, 84, 88]): m.beep(VS + 0.12 + 0.09 * k, note(nn), 0.07, 0.016, 0.1)
t = m.t(VS, STOP + 0.7); on = ss(VS + 0.1, VS + 0.35, t) * (1 - ss(STOP - 0.02, STOP + 0.6, t)); pitch = 1 - 0.5 * ss(STOP - 0.02, STOP + 0.55, t)
ph = 2 * np.pi * np.cumsum(150 * pitch) / SR
whir = (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sign(np.sin(3 * ph)) * 0.3) * 0.5 + bp(m.noise(len(t)), 700, 3200) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t))
m.add('X', hp(whir, 90) * on * 0.016, VS, 0.1)
m.rain(VS + 0.4, STOP - 0.05, 140, 0.005, (72, 86), seed=12)    # grains sucked up
def alarm(a, b, gain, pan=0.3):   # a twin-bell clock: a hammer between two bells, 17 strokes a second
    tt = m.t(a, b); x = tt - a; out = np.zeros(len(tt)); rate = 17.0
    for bell_f, off in [(1880, 0.0), (2260, 0.5 / rate)]:
        u = ((x - off) * rate) % 1.0; strike = np.exp(-u / rate / 0.018) * (x >= off)
        tone = sum(np.sin(2 * np.pi * bell_f * r * x + rng.uniform(0, 6)) * w for r, w in [(1, 1.0), (2.76, 0.45), (5.4, 0.2)])
        out += tone * (0.35 + 0.65 * strike)
    out += bp(m.noise(len(tt)), 3000, 9000) * np.exp(-((x * rate) % 1.0) / 0.12) * 0.25
    e = ss(a, a + 0.04, tt) * (1 - ss(b - 0.25, b, tt))
    m.add('X', out * e * gain, a, pan)
alarm(T['cut'] - 0.05, T['cut'] + 1.3, 0.016)
for k, (nn, d) in enumerate([(72, 0.13), (68, 0.13), (63, 0.34)]): m.beep(STOP + 0.18 + 0.19 * k, note(nn), d, 0.015, 0.1)   # sad beeps
# ---------------------------------------------------------------- the warning light: a ding each blink; the tape: a rip, a slap; then the dings, muffled
def ding(at, gain, muffled=False):
    n = int(1.0 * SR); x = np.arange(n) / SR; f = note(84)
    s = (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * f * 2.0 * x) * np.exp(-x / 0.15) + 0.15 * np.sin(2 * np.pi * f * 3.0 * x) * np.exp(-x / 0.08)) * env(n, 0.003, 0.32)
    if muffled: s = lp(s, 520) * 1.6
    m.add('X', s * gain, at, 0.0)
for k in range(22, 30):
    at = 2 * math.pi * k / 6.5
    if 22.0 < at < 28.3: ding(at + 0.01, 0.012 if at < T['over'] - 0.1 else 0.009, muffled=at > T['over'])
n = int(0.42 * SR); x = np.arange(n) / SR; imp = np.zeros(n); pos = np.cumsum(rng.exponential(0.0022, 400)); pos = (pos[pos < 0.4] * SR).astype(int)
imp[pos] = rng.uniform(0.3, 1.0, len(pos)); rip = bp(imp, 1200, 7500) * np.clip(x / 0.25, 0.2, 1) * (x < 0.4)
m.add('X', rip * 0.09, T['tape'] - 0.05, 0.1)
n = int(0.3 * SR); x = np.arange(n) / SR
m.add('X', (lp(m.noise(n), 2800) * env(n, 0.0004, 0.018) + np.sin(2 * np.pi * 150 * x) * env(n, 0.001, 0.04) * 0.6) * 0.07, T['over'], 0.0)
# ---------------------------------------------------------------- the cup: six in the evening to eleven at night; it only drains to half
m.tone_line(T['six2'] - 0.1, T['eleven'] + 0.3, 76, 0.01, 0.35, glide=lambda tt: -5 * np.clip((tt - (T['six2'] - 0.1)) / (T['eleven'] + 0.2 - T['six2']), 0, 1))
m.pluck(T['half'] + 0.02, 71, 0.03, 0.35, 0.5); m.bell(T['eleven'] + 0.02, 83, 0.012, 0.35, 0.5, buf='X')
# ---------------------------------------------------------------- caffeinated: he buzzes like a phone on vibrate
for a, b in [(T['caffeinated'] - 0.1, T['caffeinated'] + 0.45), (T['caffeinated'] + 0.7, T['caffeinated'] + 1.15)]:
    tt = m.t(a - 0.01, b + 0.02); e = ss(a, a + 0.05, tt) * (1 - ss(b - 0.05, b, tt))
    mot = np.sin(2 * np.pi * 168 * tt) + 0.45 * np.sign(np.sin(2 * np.pi * 168 * tt)) * 0.5 + 0.3 * np.sin(2 * np.pi * 336 * tt)
    rat = bp(m.noise(len(tt)), 400, 2600) * (np.sin(2 * np.pi * 60 * tt) > 0.3)
    m.add('X', hp(lp(mot * 0.8 + rat * 0.6, 2400), 110) * e * 0.05, a - 0.01, -0.1)
# ---------------------------------------------------------------- the sun up and down; the lamp's click; the screen lights up
m.whoosh(37.6, 0.9, 300, 3200, 0.018, 0.25); m.shimmer(38.2, (81, 88, 93), 0.012, 0.3, 0.9, 2.2)
m.whoosh(40.1, 1.5, 2600, 260, 0.014, 0.25, up=False)
n = int(0.08 * SR); x = np.arange(n) / SR
for at, g in [(T['lamp'] - 0.15, 0.06), (T['alarm'] + 0.05, 0.03)]:   # the lamp: on, and off at the alarm
    m.add('X', (bp(m.noise(n), 1500, 7000) * env(n, 0.0003, 0.004) + np.sin(2 * np.pi * 1700 * x) * env(n, 0.0003, 0.008) * 0.5) * g, at, 0.35)
m.shimmer(T['screen'] - 0.1, (88, 95, 100), 0.016, -0.1, 0.45, 1.8)
# ---------------------------------------------------------------- the split-flap board, cell by cell (the same rows and timing as the film)
COLS, VAL0 = 22, 14
ROWS = [[(0, '', 'w'), (43.4, '       TONIGHT', 'm'), (52.77, '   FOR A 07:00 ALARM', 'm')],
        [(0, '', 'w'), (43.7, 'BODY CLOCK       NIGHT', 'w'), (45.94 - 0.05, 'BODY CLOCK         DAY', 'w'), (55.33 - 0.05, 'IN BED BY        23:00', 'o')],
        [(0, '', 'w'), (43.8, 'SLEEP HORMONE      DUE', 'w'), (48.49 - 0.05, 'SLEEP HORMONE  DELAYED', 'a'), (56.87 - 0.05, 'LAST COFFEE      14:00', 'o')],
        [(0, '', 'w'), (43.9, 'ALARM            07:00', 'w'), (51.33 - 0.1, 'ALARM          ON TIME', 'w'), (58.61 - 0.05, 'LIGHTS LOW       20:00', 'o')]]
def flap(at, gain, pan):
    n = int(0.04 * SR); x = np.arange(n) / SR
    s = bp(m.noise(n), 1800, 7000) * env(n, 0.0002, 0.0025) + np.sin(2 * np.pi * rng.uniform(900, 1300) * x) * env(n, 0.0003, 0.005) * 0.4
    m.add('X', s * gain, at, pan)
for r, row in enumerate(ROWS):
    for i in range(1, len(row)):
        (tc, a, ca), (_, b, cb) = row[i], row[i - 1]
        a, b = a.ljust(COLS)[:COLS], b.ljust(COLS)[:COLS]
        for j in range(COLS):
            col = lambda c: c if (r == 0 or j >= VAL0) else 'w'
            if a[j] == b[j] and col(ca) == col(cb): continue
            t0 = tc + 0.03 * j + 0.012 * r
            for k in range(3): flap(t0 + 0.14 * (k + 1) + rng.uniform(-0.004, 0.004), 0.007 * rng.uniform(0.6, 1.0), -0.35 + 0.7 * j / (COLS - 1))
alarm(T['alarm'] - 0.05, T['alarm'] + 1.4, 0.016, 0.35)
# the plan: each setting clicks into place
for at, nn in [(T['bed2'], 72), (T['coffee3'], 76), (T['lights'], 79)]: m.pluck(at + 0.02, nn, 0.045, 0.0, 0.6, 3600); m.bell(at + 0.02, nn + 12, 0.012, 0.0, 0.5)
# ---------------------------------------------------------------- morning: he sits up on the edge of the bed
G0 = T['if1'] - 0.1
m.rustle(G0, G0 + 1.5, 0.03, 0.2); creak(G0 + 0.4, 0.6, 0.02, 420, 16, 30, 0.2)
for k, at in enumerate([G0 + 1.28, G0 + 1.36]): m.tock(at, 0.03, 0.15 + 0.1 * k, f=300)
# ---------------------------------------------------------------- the camera's moves; the logo
for a, b, g, pan in [(2.7, 3.9, 0.014, 0.2), (9.9, 11.7, 0.016, 0.0), (21.6, 23.1, 0.012, 0.0), (28.0, 29.3, 0.014, 0.3), (33.1, 34.4, 0.012, 0.2),
                     (43.0, 44.5, 0.014, 0.3), (59.9, 61.6, 0.016, 0.2), (73.8, 75.6, 0.014, 0.25)]:
    m.whoosh(a + 0.05, b - a, 250, 1800, g, pan)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
# ---------------------------------------------------------------- the score
m.pad([38, 50, 57, 64], 0.0, HIT, 0.5, 1000, rel=0.08)                 # late night, the scroll; cut dead by the bonk
for at, nn in [(T['six'], 69), (T['after'], 72), (T['midnight'], 76)]: m.pluck(at + 0.02, nn, 0.03, 0.2, 0.5)
m.pluck(T['tired'] + 0.05, 57, 0.035, 0.0, 0.9, 1800)
m.pad([41, 53, 60, 64], T['all'], VS, 0.5, 1150, att=0.5)              # all day: the chemical
m.pad([43, 55, 59, 62], VS, T['cut'] - 0.05, 0.5, 1300, rel=0.08)      # the cleaning crew; the alarm cuts it
m.pulse(VS + 0.3, T['cut'] - 0.05, 120, [72, 76, 79, 76], 0.006, 1500, lvl=lambda x: sm(VS + 0.3, VS + 0.8, x) * (1 - sm(T['cut'] - 0.2, T['cut'] - 0.05, x)))
m.pad([38, 50, 53, 57], 18.6, 22.2, 0.45, 950, att=0.8)                # yesterday's mess
m.pad([43, 55, 58, 62], 22.2, 28.4, 0.45, 1100)                       # the light, the tape
m.pulse(22.6, 28.2, 96, [67, 70, 74, 70], 0.004, 1300, lvl=lambda x: sm(22.6, 23.4, x) * (1 - sm(27.5, 28.2, x)))
m.pad([45, 57, 60, 64], 28.4, 33.6, 0.48, 1150)                       # the cup's evening
m.pad([38, 50, 53, 57], 33.6, T['caffeinated'] - 0.15, 0.45, 1000, rel=0.1)   # a light sleeper? cut for the buzz
m.pad([43, 55, 59, 62, 67], 37.8, 41.4, 0.55, 1700, att=0.6)          # the sun
m.pad([40, 52, 55, 59], 41.4, 43.6, 0.45, 1000)                       # night, a lamp, a screen
m.pad([41, 53, 57, 60], 43.6, T['alarm'] - 0.05, 0.48, 1100, rel=0.1)  # the board: the body clock, the hormone
m.pulse(44.4, T['alarm'] - 0.1, 100, [65, 69, 72, 69], 0.005, 1300, lvl=lambda x: sm(44.4, 45.2, x) * (1 - sm(49.3, 49.6, x)))
m.pad([38, 50, 53, 57], T['alarm'] + 0.2, 52.6, 0.42, 950, att=0.4)     # the alarm, sadly
m.pad([41, 53, 60, 65], 52.6, 60.3, 0.5, 1400)                        # the plan
m.pulse(53.0, 60.0, 108, [65, 69, 72, 77], 0.005, 1400, lvl=lambda x: sm(53.0, 53.8, x) * (1 - sm(59.4, 60.0, x)))
m.pad([41, 53, 57, 60], 60.3, 74.2, 0.36, 900)                        # the warning, plain
m.pad([41, 53, 60, 65, 69, 72], 74.2, T['end'], 1.0, 2400, rel=0.2)
m.room(0.005)
m.finish(REPORT, VOICE, OUT, 'film01')
