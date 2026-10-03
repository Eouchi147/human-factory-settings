"""Film 8 "How can I fall asleep faster?": score and sound design, timed to films/film08.js.
Usage: python3 sound_film08.py <voice guide wav> <voice report json> <out dir>"""
import sys
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=81.3, q0=0.35, fall=0.98, heres=2.16, measured=3.30, normal=4.50, ten=5.74, twenty=6.26, minutes=6.67, out=7.53,
         minute=8.75, short=9.47, sleep=10.02, not_=10.64, talent=11.32, inStudies=12.65, caffeine=13.63, added=14.09, nine=14.90,
         falling=15.95, cut=17.52, fortyfive=18.25, sleep2=19.91, regular=21.88, cup=22.30, review=22.77, cutoff=23.79, almost=24.44,
         nineh=25.13, before=25.96, bed=26.50, nhs=27.69, six=28.81, warm=30.26, bath=30.65, shower=31.06, oneTwo=31.30, two=32.10,
         before2=32.70, bed2=33.42, gets=33.78, sooner=34.84, trying=36.17, backfires=37.17, head=38.30, busy=38.74, students=39.59,
         told=40.43, fast=41.52, marches=42.46, playing=43.18, reported=43.69, t34=44.44, ones=45.94, didnt=46.64, try_=47.03, t22=47.48,
         notAsleep=49.33, after=50.32, twenty2=50.65, getUp=51.85, up=52.42, quiet=53.22, away=53.64, screens=54.36, goBack=55.02,
         sleepy=56.19, part=58.01, cbt=58.58, insomnia=59.39, firstline=60.46, across=62.44, trials=63.62, people=63.92, withIns=64.38,
         fell=65.49, nineteen=66.73, faster=67.96, over=69.36, thirty=70.04, three=70.67, nights=70.95, week=71.49, months=72.50,
         may=73.95, insomnia2=74.37, see=74.99, doctor=75.81, final=77.17, settings=78.33, logo=79.0)
m = Mix(T['end'], seed=20261008)
rng = np.random.default_rng(88)
def s5(a, b, x):
    u = float(np.clip((x - a) / (b - a), 0, 1)); return u * u * u * (u * (u * 6 - 15) + 10)
def lerp(a, b, k): return a + (b - a) * k

# ---------------------------------------------------------------- the bedside clock (as the picture keeps it): a tick every second, a whirr when it spins
H = 3600.0
def clock_at(t):
    night = 23 * H + 38 * 60 + t
    rew, fw1 = s5(T['regular'] - 0.3, T['cutoff'] + 0.5, t), s5(T['nhs'] - 0.1, T['six'] + 0.2, t)
    fw2, fw3 = s5(T['warm'] - 0.9, T['warm'] + 0.4, t), s5(T['bed2'] + 0.3, T['gets'] + 0.9, t)
    c1, c2, c3 = 14 * H + 12 * 60 + (t - T['cutoff'] - 0.5), 17 * H + (t - T['six'] - 0.2), 21 * H + 30 * 60 + (t - T['warm'] - 0.4)
    s = lerp(night, c1, rew); s = lerp(s, c2, fw1); s = lerp(s, c3, fw2); return lerp(s, night, fw3)
dt = 1 / 400; ts = np.arange(0, T['logo'], dt); cs = np.array([clock_at(x) for x in ts]); rate = np.gradient(cs, dt)
near = lambda x: 0.6 + 0.4 * float(ss(21.0, 21.8, x) * (1 - ss(32.6, 33.6, x)))   # louder while we look at the clock
for i in range(1, len(ts)):
    if abs(rate[i]) < 3 and np.floor(cs[i]) != np.floor(cs[i - 1]): m.tock(ts[i], 0.016 * near(ts[i]), 0.35, f=1450)
spin = np.abs(rate) > 30
for i in range(1, len(ts)):   # spinning: the hands' gear train, a fine ratchet whose rate follows the speed
    if spin[i] and np.floor(cs[i] / 600) != np.floor(cs[i - 1] / 600): m.tick(ts[i], 0.012, 0.3, hi=4200, lo=2100)
for a, b in [(T['regular'] - 0.3, T['cutoff'] + 0.5), (T['nhs'] - 0.1, T['six'] + 0.2), (T['warm'] - 0.9, T['warm'] + 0.4), (T['bed2'] + 0.3, T['gets'] + 0.9)]:
    m.whoosh(a + 0.1, b - a, 300, 2400, 0.02, 0.25, up=(b - a) > 2.5 or a > 27)

# ---------------------------------------------------------------- the timer: a fine detent at every minute the needle passes
def needle(t0, t1, v0, v1, pan=0.2, g=0.022):
    xs = np.linspace(t0, t1, 600); vs = np.array([v0 + (v1 - v0) * s5(t0, t1, x) for x in xs])
    for k in range(int(min(v0, v1)) + 1, int(max(v0, v1)) + 1):
        hit = np.argmax(vs >= k) if v1 > v0 else np.argmax(vs <= k)
        m.tick(xs[hit], g * (1.3 if k % 5 == 0 else 1.0), pan, hi=3300, lo=1500)
m.room(0.005)
m.bell(T['heres'] + 0.1, 84, 0.016, 0.2, 0.8, buf='X')                     # the timer lights
needle(T['ten'] - 0.3, T['minutes'] + 0.4, 0, 15)
needle(T['out'] - 0.3, T['minute'] + 0.2, 15, 0.7)
needle(T['caffeine'] - 0.2, T['added'] + 0.6, 0.7, 15); needle(T['nine'] - 0.1, T['falling'] + 0.3, 15, 24, g=0.026)
needle(T['regular'] - 0.6, T['cup'], 24, 0); needle(T['gets'] - 0.2, T['sooner'] + 0.3, 0, 13, g=0.012)
needle(T['reported'] - 0.1, T['t34'] + 0.5, 13, 34); m.pluck(T['t34'] + 0.3, 64, 0.022, 0.2, 0.6)
m.pluck(T['t22'] + 0.1, 60, 0.02, 0.2, 0.6)
needle(T['notAsleep'] - 0.6, T['notAsleep'], 34, 0, g=0.014); needle(T['notAsleep'] + 0.1, T['twenty2'] + 0.1, 0, 20)
needle(T['withIns'] - 0.2, T['fell'] + 0.2, 20, 45, g=0.018); needle(T['nineteen'] - 0.2, T['faster'] + 0.2, 45, 26, g=0.026)
needle(T['thirty'] - 0.3, T['three'], 26, 38); needle(T['final'], T['final'] + 0.9, 38, 15, g=0.018)

# ---------------------------------------------------------------- the opening: a phone lights up; asleep within a minute, the arm drops
n = int(0.5 * SR); x = np.arange(n) / SR
buzz = np.sin(2 * np.pi * 155 * x) * (np.sin(2 * np.pi * 9 * x) > -0.2) * env(n, 0.01, 0.2)
m.add('X', lp(buzz, 900) * 0.03, 0.56, 0.3); m.add('X', lp(buzz, 900) * 0.022, 0.98, 0.3)
m.shimmer(0.6, notes=(88, 95), gain=0.008, pan=0.3, decay=0.6, dur=1.6)
m.whoosh(0.3, 2.2, 200, 1400, 0.03, 0.15)                                 # down from above the bed
m.whoosh(7.25, 1.3, 1800, 400, 0.02, 0.0, up=False)
fl = T['minute'] + 0.15
m.swish(fl, 0.42, 0.04, 0.35, 900); m.thud(fl + 0.38, 75, 0.05, 0.35, 0.09); m.tick(fl + 0.42, 0.03, 0.4, hi=1900, lo=600)   # the arm over the edge
m.rustle(12.1, 13.3, 0.008, 0.3)                                            # and back

# ---------------------------------------------------------------- coffee: nine minutes more; forty-five minutes of the night gone
m.clink(T['caffeine'] - 0.1, 0.03, 0.35, 2600)
m.tone_line(T['fortyfive'] - 0.2, T['sleep2'] + 0.6, 69, gain=0.012, pan=0.2, glide=lambda t: -3 * ss(T['fortyfive'], T['sleep2'] + 0.3, t))

# ---------------------------------------------------------------- afternoon: birds would be a lie; the room only warms (a brighter chord)
m.shimmer(T['cutoff'] + 0.4, notes=(84, 91, 96), gain=0.01, pan=0.2, decay=0.8, dur=2.0)
m.pluck(T['six'] + 0.2, 67, 0.02, 0.2, 0.6)

# ---------------------------------------------------------------- a warm bath or shower: water, then steam
tt = m.t(T['warm'] - 0.2, T['bed2'] + 0.6)
water = bp(m.noise(len(tt)), 1200, 7000) * (0.7 + 0.3 * lp(np.abs(m.noise(len(tt))), 30) * 3).clip(0, 1.4)
m.add('X', water * 0.006 * ss(tt[0], tt[0] + 0.8, tt) * (1 - ss(tt[-1] - 1.0, tt[-1], tt)), tt[0], -0.2)
tt = m.t(T['bed2'], T['sooner'] + 1.3)
m.add('X', hp(m.noise(len(tt)), 5000) * 0.003 * ss(tt[0], tt[0] + 0.8, tt) * (1 - ss(tt[-1] - 0.8, tt[-1], tt)), tt[0], 0.0)

# ---------------------------------------------------------------- a busy head: sparks; the headphones; a march (original), tinny, from the tape
spk = rng.uniform(T['backfires'], T['notAsleep'] - 0.6, 260)
for a in np.sort(spk):
    dens = 0.4 + 0.6 * float(ss(T['fast'] - 0.4, T['marches'], a) * (1 - ss(T['didnt'] - 0.2, T['t22'], a)))
    if rng.random() < dens: m.tick(float(a), 0.006 * rng.uniform(0.5, 1.0), rng.uniform(-0.3, 0.3), hi=rng.uniform(5200, 7600), lo=3000)
m.thud(T['students'] + 0.42, 160, 0.03, 0.0, 0.06); m.rustle(T['students'], T['students'] + 0.6, 0.008, 0.0)   # headphones on
m.tick(42.25, 0.05, 0.3, hi=1600, lo=500); m.tock(42.32, 0.03, 0.3, f=300)                                      # play
M0, M1, BEAT = 42.55, 48.3, 0.5
dur = M1 - M0 + 0.2; tt = m.t(M0, M0 + dur); N = len(tt); rate = np.ones(N)
stop = (tt > M1 - 0.45); rate[stop] = np.maximum(0.25, 1 - (tt[stop] - (M1 - 0.45)) / 0.55)           # the tape stops when they come off
pos = np.cumsum(rate) / SR                                                                              # tape time
march = np.zeros(N)
MEL = [72, 69, 65, 69, 72, None, 77, None, 76, 74, 72, 70, 69, None, 72, None, 74, 72, 70, 69, 67, None, 72, None]
def voice(start, length, nn, w, kind):
    on = (pos >= start) & (pos < start + length); ph = 2 * np.pi * note(nn) * (pos - start)
    tone = np.sign(np.sin(ph)) * 0.5 + np.sin(ph) if kind == 'brass' else np.sin(ph) + 0.4 * np.sin(2 * ph)
    e = np.exp(-np.maximum(0, pos - start) / (0.25 if kind == 'brass' else 0.12)) * np.minimum(1, (pos - start) * 120)
    return tone * e * on * w
for i, nn in enumerate(MEL):
    if nn: march += voice(i * BEAT / 2, BEAT / 2 * 0.9, nn, 0.5, 'brass')
for b in range(12):
    march += voice(b * BEAT, BEAT * 0.45, [41, 48][b % 2], 0.8, 'bass')
    for nn in (57, 60, 65): march += voice(b * BEAT + BEAT / 2, BEAT * 0.2, nn, 0.18, 'stab')
    sn = (pos >= b * BEAT + BEAT / 2) & (pos < b * BEAT + BEAT / 2 + 0.08)
    march += bp(m.noise(N), 1800, 6000) * sn * np.exp(-np.maximum(0, pos - (b * BEAT + BEAT / 2)) / 0.03) * 0.6
march = bp(march, 650, 3600) * 0.02 * ss(M0, M0 + 0.15, tt) * (1 - ss(M1 - 0.05, M1 + 0.15, tt))
m.add('X', march, M0, -0.15); m.add('X', bp(m.noise(N), 3000, 9000) * 0.0016 * (tt < M1), M0, -0.15)   # tape hiss
for b in range(11):   # the foot keeps time: the sheet whispers on each tap
    m.add('X', bp(m.noise(int(0.12 * SR)), 1500, 6000) * env(int(0.12 * SR), 0.01, 0.04) * 0.006, M0 + b * BEAT + 0.05, -0.35)
m.thud(M1 + 0.3, 150, 0.02, 0.0, 0.05)                                                                    # headphones off

# ---------------------------------------------------------------- twenty minutes awake: up; the lamp; a book; the phone face down; a yawn; back to bed
def creak(at, dur, gain=0.02, pan=0.0, f0=48):
    n = int(dur * SR); x = np.arange(n) / SR; f = f0 * (1 + 0.25 * np.sin(2 * np.pi * 1.3 * x) + 0.08 * m.rng.standard_normal(n).cumsum() / np.sqrt(n))
    imp = (np.diff(np.floor(np.cumsum(f) / SR), prepend=0) > 0).astype(float)
    s = bp(imp + 0.02 * m.noise(n), 500, 2200) * np.sin(np.pi * np.clip(x / dur, 0, 1)) ** 1.5
    m.add('X', s * gain, at, pan)
G0, B0 = T['getUp'] - 0.15, T['sleepy'] + 0.25
creak(G0 + 0.1, 0.9, 0.05, 0.1); m.rustle(G0, G0 + 1.2, 0.02, 0.0); m.thud(G0 + 1.05, 90, 0.03, 0.1, 0.07); m.thud(G0 + 1.12, 85, 0.025, 0.2, 0.07)
m.tick(T['quiet'] - 0.55, 0.06, 0.4, hi=2400, lo=800); m.thud(T['quiet'] - 0.53, 220, 0.01, 0.4, 0.03)        # the lamp on
m.rustle(T['quiet'] - 0.2, T['quiet'] + 0.5, 0.012, 0.1); m.rustle(54.7, 55.0, 0.01, 0.1)                       # the book opens; a page
m.swish(T['away'] + 0.05, 0.4, 0.015, 0.4, 1800); m.tock(T['away'] + 0.48, 0.035, 0.4, f=900)                 # the phone turns itself face down
creak(T['goBack'] + 0.25, 0.7, 0.02, 0.0, f0=32)                                                               # a yawn (the jaw's hinge)
m.add('X', bp(m.noise(int(0.08 * SR)), 300, 2400) * env(int(0.08 * SR), 0.002, 0.03) * 0.03, T['goBack'] + 0.75, 0.1)   # the book shut
m.tick(T['sleepy'] + 0.6, 0.05, 0.4, hi=2400, lo=800)                                                          # the lamp off
creak(B0 + 0.3, 1.1, 0.045, 0.0); m.rustle(B0 + 0.2, B0 + 1.5, 0.02, 0.0)

# ---------------------------------------------------------------- CBT for insomnia: twenty trials; nineteen minutes faster
m.rain(T['trials'] - 0.4, T['trials'] + 0.5, 20, 0.014, (84, 96), seed=8)
m.tone_line(T['nineteen'] - 0.2, T['faster'] + 0.6, 72, gain=0.012, pan=0.2, glide=lambda t: -5 * ss(T['nineteen'] - 0.2, T['faster'] + 0.2, t))
# ---------------------------------------------------------------- over thirty minutes, three nights a week, three months: the diary fills, week by week
m.whoosh(T['nights'] - 0.45, 0.8, 200, 1300, 0.018, 0.3); m.thud(T['nights'] + 0.3, 120, 0.02, 0.3, 0.05)
for k in range(13): m.tick(T['nights'] + (T['months'] + 0.4 - T['nights']) * (k + 0.5) / 13, 0.018, 0.35, hi=2800, lo=1100)

# ---------------------------------------------------------------- the score
m.pad([38, 50, 57, 62], 0.0, 7.4, 0.55, 900)                          # night; the measure
m.pad([41, 53, 57, 60], 7.4, 12.6, 0.5, 900)                          # out within a minute
m.pad([43, 55, 58, 62], 12.6, 21.4, 0.55, 1000)                       # caffeine
m.pad([46, 58, 62, 65, 69], 21.4, 29.4, 0.6, 1700)                    # the afternoon
m.pad([41, 53, 57, 60, 64], 29.4, 36.0, 0.55, 1400)                   # warm water
m.pad([38, 50, 53, 57], 36.0, 49.2, 0.5, 800)                         # a busy head (the march plays over it)
m.pad([43, 55, 59, 62], 49.2, 57.6, 0.5, 1100)                        # get up, read, back to bed
m.pad([41, 53, 57, 60, 65], 57.6, 69.2, 0.6, 1500)                    # CBT
m.pulse(58.0, 68.4, 92, [65, 69, 72, 69, 77, 72, 69, 72], 0.016, 1400, lvl=lambda t: float(ss(58.0, 59.0, t)) * (1 - float(ss(67.6, 68.4, t))))
m.pad([36, 48, 51, 55], 69.2, 77.0, 0.55, 800)                        # see a doctor
m.pad([41, 53, 60, 65, 69, 72], 77.0, T['end'], 1.0, 2400, rel=0.2)
m.whoosh(T['final'] - 0.1, T['logo'] - T['final'], 220, 2600, 0.05, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
m.finish(REPORT, VOICE, OUT, 'film08')
