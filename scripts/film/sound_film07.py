"""Film 7 "Does mewing work?": score and sound design, timed to films/film07.js.
Usage: python3 sound_film07.py <voice guide wav> <voice report json> <out dir>"""
import sys
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=81.4, q0=0.35, press=1.59, tongue=2.58, flat=2.88, roof=3.64, mouth=4.34, wait=5.30, sharper=6.07, jaw=6.59,
         started=8.21, theory=10.16, internet=11.45, removed=12.17, orthodontist=12.79, proof=14.48, reshapes=15.26, face=15.94,
         britain=16.66, found=18.26, no=18.56, studies=19.32, america=20.92, agree=22.70, warn=23.54, pressure=24.93, loosen=25.76,
         teeth=26.14, shift=26.98, bite=27.42, normal=28.61, rest=29.90, lips=30.19, closed=30.99, breathing=31.56, nose=32.74,
         tip=33.36, behind=34.27, top=35.36, bottom=36.17, teeth2=37.19, and_=38.48, slightly=39.51, apart=39.80, mewing2=40.76,
         close=42.09, them=42.36, mouth3=43.42, exercises=44.60, real=46.15, small=48.32, set=49.16, programme=49.27, cut=50.67,
         apnoea=51.21, adults=52.31, holding=53.80, position=55.00, not_=55.78, programme2=56.17, children=57.96, breathe=59.39,
         longer=61.70, faces=62.29, link=63.59, proof2=64.63, child=66.52, snores=66.94, pauses=67.41, gasps=68.35, often=69.13,
         mouth5=70.68, see=71.17, doctor=71.74, big=72.94, tonsils=73.52, adenoids=74.42, cause=75.65, final=77.28, settings=78.44,
         logo=79.14)
m = Mix(T['end'], seed=20261007)
rng = np.random.default_rng(77)
def s5(a, b, x):
    u = float(np.clip((x - a) / (b - a), 0, 1)); return u * u * u * (u * (u * 6 - 15) + 10)

def breath(t0, t1, period, kind='nose', gain=0.012, pan=0.0, stops=()):
    """Breathing as filtered noise: in (shorter) and out (longer); nose is narrow and hissy, mouth is wide and low.
    stops: [(a, b)] stretches where the airway is shut (silence), each ending in a gasp."""
    tt = m.t(t0, t1); n = len(tt); ph = ((tt - t0) % period) / period
    shape = np.where(ph < 0.42, np.sin(np.pi * np.clip(ph / 0.42, 0, 1)) ** 1.4, 0.75 * np.sin(np.pi * np.clip((ph - 0.42) / 0.58, 0, 1)) ** 1.6)
    lo, hi = (1400, 6000) if kind == 'nose' else (260, 2400)
    s = bp(m.noise(n), lo, hi) * shape * ss(t0, t0 + 0.6, tt) * (1 - ss(t1 - 0.8, t1, tt))
    for a, b in stops: s *= 1 - ss(a - 0.08, a + 0.06, tt) * (1 - ss(b - 0.05, b + 0.05, tt))
    m.add('X', s * gain, t0, pan)
    for a, b in stops:   # the gasp that ends a pause
        k = int(0.32 * SR); x = np.arange(k) / SR
        m.add('X', bp(m.noise(k), 500, 3500) * env(k, 0.01, 0.12) * gain * 2.4, b, pan)

# ---------------------------------------------------------------- the opening: a quiet room; round the face to the cut
tt = m.t(0, 8); room = lp(m.noise(len(tt)), 300) * 0.004 * ss(0, 1, tt) * (1 - ss(7, 8, tt)); m.add('X', room, 0, 0.0)
m.whoosh(1.5, 2.6, 300, 2200, 0.035, -0.3)                            # round the face
m.shimmer(3.7, notes=(76, 83, 88), gain=0.01, pan=0.2, decay=0.5, dur=1.2)
m.thud(3.62, 90, 0.05, 0.1, 0.12); m.swish(3.0, 0.7, 0.012, 0.1, 500)   # the tongue meets the roof of the mouth
for k in range(4): m.tock(T['wait'] + 0.15 + k * 0.55, 0.05 * (0.85 ** k), 0.0, f=330)   # wait
m.scan(T['sharper'] - 0.1, 1.0, 0.012, 0.2)                           # the dashed jaw draws itself

# ---------------------------------------------------------------- the placard: select, delete, a hashtag, a ping
m.whoosh(7.7, 1.2, 1800, 400, 0.025, 0.2, up=False)
m.tick(T['removed'] - 0.05, 0.05, 0.25, hi=4200, lo=1800)              # the byline selected
for k in range(3): m.tick(T['removed'] + 0.45 + k * 0.09, 0.045, 0.25, hi=3600, lo=1400)   # delete
m.thud(T['orthodontist'] + 0.3, 140, 0.03, 0.25, 0.05)                 # the hashtag lands
m.bell(T['orthodontist'] + 0.55, 88, 0.02, 0.3, 0.4, buf='X'); m.bell(T['orthodontist'] + 0.68, 93, 0.018, 0.3, 0.5, buf='X')   # and gets a ping
m.whoosh(14.35, 1.25, 400, 1600, 0.025, -0.1)
m.pluck(T['no'] + 0.1, 57, 0.03, 0.1, 0.9)                             # no independent studies: zero

# ---------------------------------------------------------------- long-term pressure: the tongue pushes; the teeth loosen; the bite shifts
for k in range(6): m.thud(T['pressure'] - 0.2 + k * 0.5, 70, 0.03, 0.0, 0.12)
for k in range(26):
    at = T['loosen'] + k * 0.055 + rng.uniform(0, 0.02); m.tick(at, 0.012 * rng.uniform(0.6, 1), 0.15, hi=rng.uniform(3800, 5200), lo=2200)   # enamel chatter
m.tick(T['shift'] + 0.25, 0.07, 0.1, hi=3000, lo=900); m.tock(T['shift'] + 0.27, 0.04, 0.1, f=420)   # the bite slips

# ---------------------------------------------------------------- the mouth at rest: three dials rise; lips; nose; the tongue tip
for i, pan in enumerate((-0.3, 0.0, 0.3)):
    t0 = T['normal'] - 0.2 + i * 0.15; m.whoosh(t0 - 0.05, 0.85, 200, 1300, 0.022, pan); m.thud(t0 + 0.8, 105, 0.03, pan, 0.08)
def detents(t0, t1, v0, v1, pan, n=20):
    ts = np.linspace(t0, t1, 400); vs = np.array([v0 + (v1 - v0) * s5(t0, t1, x) for x in ts])
    for k in range(1, n + 1):
        thr = k / n
        if v1 > v0 and v0 < thr <= v1 + 1e-9: m.tick(ts[int(np.argmax(vs >= thr - 1e-9))], 0.04, pan, hi=3000, lo=1300)
        if v1 < v0 and v1 <= thr < v0: m.tick(ts[int(np.argmax(vs <= thr + 1e-9))], 0.035, pan, hi=3000, lo=1300)
n = int(0.05 * SR); m.add('X', bp(m.noise(n), 600, 2600) * env(n, 0.002, 0.012) * 0.03, T['closed'] - 0.05, 0.0)   # lips meet
detents(T['closed'] - 0.3, T['closed'] + 0.3, 0, 1, -0.3); m.tick(T['closed'] + 0.3, 0.06, -0.3, hi=2200, lo=900)
detents(T['nose'] - 0.3, T['nose'] + 0.3, 0, 1, 0.0); m.tick(T['nose'] + 0.3, 0.06, 0.0, hi=2200, lo=900)
breath(T['breathing'] - 0.2, T['mouth3'] + 0.2, 3.4, 'nose', 0.009, 0.0)
for at in (T['top'], T['bottom'] + 0.25):   # the tip touches behind the front teeth
    m.tick(at, 0.03, 0.1, hi=2600, lo=700); m.shimmer(at, notes=(88, 95), gain=0.008, pan=0.1, decay=0.3, dur=0.8)
# teeth slightly apart; the third dial; mewing pushes it to SHUT, it springs back
detents(T['apart'] + 0.3, T['apart'] + 0.9, 0, 1, 0.3); m.tick(T['apart'] + 0.9, 0.06, 0.3, hi=2200, lo=900)
m.tick(T['close'] - 0.02, 0.09, 0.0, hi=3600, lo=1200); m.tock(T['close'], 0.05, 0.0, f=520)   # teeth clack shut
detents(T['close'] - 0.14, T['close'] + 0.04, 1, 0.12, 0.3)
m.thud(T['them'] + 0.62, 160, 0.035, 0.3, 0.06); m.clink(T['them'] + 0.64, 0.02, 0.3, 2300)   # and springs back

# ---------------------------------------------------------------- the throat, at night: breaths that stop (apnoea), then a programme
EV0, EV1 = [44.0, 45.15, 46.35, 47.4, 48.55], [51.2, 52.6]
breath(T['mouth3'], T['holding'] - 0.2, 1.15, 'mouth', 0.010, 0.0, stops=[(e - 0.1, e + 0.75) for e in EV0 + EV1])
m.drone(43.4, 53.4, 40, 0.02, 300)
for k in range(3): m.pluck(T['set'] - 0.2 + k * 0.62 + 0.05, [69, 72, 76][k], 0.03, 0.15, 0.5)   # one, two, three
m.shimmer(T['cut'] + 0.1, notes=(81, 88, 93), gain=0.012, pan=0.0, decay=0.6, dur=1.6)
m.tone_line(T['holding'] + 0.2, T['children'] - 0.4, 64, gain=0.012, pan=-0.1)   # one held position: a flat held note
m.tock(T['programme2'] + 0.5, 0.05, 0.0, f=280)

# ---------------------------------------------------------------- breathing through the mouth; a longer face, linked
breath(T['breathe'] - 0.3, T['proof2'] + 0.9, 2.6, 'mouth', 0.013, 0.0)
m.scan(T['longer'] - 0.3, 0.9, 0.012, -0.3); m.pluck(T['link'] + 0.1, 62, 0.025, -0.2, 0.8)

# ---------------------------------------------------------------- a child's airway: the tonsils and adenoids swell; snoring with pauses and gasps
m.whoosh(T['child'] - 0.3, 1.4, 120, 700, 0.03, 0.0)
tt = m.t(T['snores'] - 0.2, T['mouth5'] + 0.6); snore = lp(np.sign(np.sin(2 * np.pi * np.cumsum(38 + 6 * np.sin(2 * np.pi * 0.7 * tt)) / SR)) * bp(m.noise(len(tt)), 80, 900), 900)
ph = ((tt - tt[0]) % 1.6) / 1.6; shape = np.sin(np.pi * np.clip(ph / 0.55, 0, 1)) ** 1.5 * (ph < 0.55)
shape *= 1 - ss(T['pauses'] - 0.05, T['pauses'] + 0.1, tt) * (1 - ss(T['gasps'] - 0.15, T['gasps'], tt))   # a pause...
m.add('X', snore * shape * 0.016 * ss(tt[0], tt[0] + 0.4, tt) * (1 - ss(tt[-1] - 0.5, tt[-1], tt)), tt[0], 0.0)
k = int(0.35 * SR); m.add('X', bp(m.noise(k), 500, 3500) * env(k, 0.01, 0.14) * 0.035, T['gasps'], 0.0)   # ...and a gasp
m.drone(66.0, 76.6, 43, 0.018, 320)

# ---------------------------------------------------------------- the score
m.pad([38, 50, 57, 62], 0.0, 7.6, 0.6, 1000)                          # mewing
m.pad([41, 53, 57, 60], 7.6, 14.2, 0.6, 1100)                         # a theory; a hashtag
m.pad([43, 55, 58, 62], 14.2, 20.6, 0.65, 1000)                       # no studies
m.pad([38, 50, 53, 57], 20.6, 28.4, 0.65, 900)                        # loose teeth, a shifted bite
m.pad([41, 53, 57, 60, 65], 28.4, 43.2, 0.8, 1800)                    # the mouth at rest: the settings
m.pulse(29.6, 37.6, 96, [60, 65, 69, 65, 72, 69, 65, 69], 0.02, 1500, lvl=lambda t: float(ss(29.6, 30.4, t)) * (1 - float(ss(36.8, 37.6, t))))
m.pad([36, 48, 51, 55], 43.2, 53.6, 0.65, 800)                        # night: apnoea
m.pad([41, 53, 57, 60], 50.6, 53.6, 0.45, 1400)                       # the programme helps
m.pad([38, 50, 53, 57], 53.6, 57.8, 0.6, 900)                         # one held position
m.pad([43, 55, 58, 62], 57.8, 65.6, 0.65, 1000)                       # mouth breathing
m.pad([36, 48, 51, 55], 65.6, 77.0, 0.6, 800)                         # see a doctor
m.pad([41, 53, 60, 65, 69, 72], 77.0, T['end'], 1.0, 2400, rel=0.2)
detents(T['final'] + 0.2, T['logo'] - 0.3, 1.0, 0.5, 0.0)            # the middle dial turns back to twelve
m.whoosh(T['final'] - 0.1, T['logo'] - T['final'], 220, 2600, 0.05, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
m.room()
m.finish(REPORT, VOICE, OUT, 'film07')
