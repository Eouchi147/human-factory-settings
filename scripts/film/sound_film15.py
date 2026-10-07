"""Film 15 "Why do I get hangry?" (new direction, 7 Oct 2026): score and sound design, timed to films/film15.js.
Angry typing and a jaw that snaps; steam hissing from the temples; the clock swept round to three and striking it; a paper
cup lifted away and a sandwich landing; a hunger gauge pushed to empty and on into ANGRY, its needle buzzing; a study filled
in day by day, a scatter of points, a line drawn, a stamp; a computer crash; a slider dragged to harsh, a gentle prompt,
back to fair; three meal times marked on the clock; a snack dropped on the desk; a dialog, a click on Hungry, the insult
deleted and an apology typed; the logo. Every time comes from the timing table the picture exports (timing15.json,
window.HFS_W.timing). Usage: python3 sound_film15.py <voice guide wav> <voice report json> <out dir>"""
import sys, json, os
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=80.59, logo=78.07, you=0.35, snap=0.8, idiot=2.88, three=4.12, coffee=6.83, lets=7.7, fed=8.58, push=11.99, far=12.83,
         hunger2=13.42, anger=14.89, hangry=27.63, real=28.16, computer=31.9, harsher=34.35, feelings=37.58, regular=40.54, snack=42.28,
         ask=46.16, hungry=49.0, final=75.8, factory=77.01, settings=77.38)
HERE = os.path.dirname(os.path.abspath(__file__))
TM = json.load(open(os.path.join(HERE, 'timing15.json')))
m = Mix(T['end'], seed=20261015)
rng = np.random.default_rng(1515)
def s5(a, b, x):
    u = np.clip((np.asarray(x, dtype=float) - a) / (b - a), 0, 1); return u * u * u * (u * (u * 6 - 15) + 10)
def pulse(t, a, b, r=0.35): return ss(a, a + r, t) * (1 - ss(b - r, b, t))
m.room(0.005)
def one(at, sig, gain, pan=0.0): m.add('X', sig * gain, at, pan)
def key(at, g, pan=0.15, hard=1.0):                                  # a key: the plastic click and the thump of it bottoming out
    k = int(0.09 * SR); x = np.arange(k) / SR; f = 2600 + 900 * rng.random()
    s = bp(m.noise(k), f, f + 3500) * env(k, 0.0003, 0.004) + np.sin(2 * np.pi * (240 + 60 * rng.random()) * x) * env(k, 0.0006, 0.012) * 0.7 * hard
    one(at, s, g, pan)
def hiss(t0, t1, g, pan, whistle=0.0):                               # steam: a kettle's hiss, with a thin whistle in it
    tl = m.t(t0, t1); n = len(tl); a = pulse(tl, t0, t1, 0.25)
    s = hp(bp(m.noise(n), 2500, 11000), 1800) * (0.75 + 0.25 * np.sin(2 * np.pi * 7.3 * tl))
    if whistle: s = s + whistle * np.sin(2 * np.pi * (2150 + 60 * np.sin(2 * np.pi * 0.9 * tl)) * tl)
    m.add('X', s * a * g, t0, pan)
def whirr(t0, t1, g, pan=0.0):                                       # a winder's whirr (the clock's hands swept round)
    tr = m.t(t0, t1); one(t0, bp(m.noise(len(tr)), 1800, 5000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 38 * (tr - tr[0])))) * np.sin(np.pi * np.clip((tr - tr[0]) / (t1 - t0), 0, 1)), g, pan)
def soft(at, g, pan, lo=150, dur=0.3):                               # something soft set down: bread, an apple
    k = int(dur * SR); x = np.arange(k) / SR
    one(at, lp(m.noise(k), 700) * env(k, 0.002, 0.035) + np.sin(2 * np.pi * lo * x) * env(k, 0.002, 0.05) * 0.6, g, pan)

# ---------------------------------------------------------------- the angry email: hard typing; the jaw snaps; steam from the temples
for i, at in enumerate(TM['keys']): key(at - 0.012, 0.045 * (0.85 + 0.3 * rng.random()), 0.1 + 0.1 * np.sin(i), hard=1.3)
m.tock(TM['snap'] + 0.03, 0.03, 0.25, f=380); m.clink(TM['snap'] + 0.035, 0.01, 0.25, f=1900)            # bone on bone: the jaw shuts
hiss(TM['steam'][0], TM['steam'][1], 0.006, 0.3, whistle=0.25)
m.pulse(0.3, 3.2, 112, [57, 57, 60, 57], 0.007, 1500, lvl=lambda t: float(ss(0.3, 0.8, t)) * (1 - float(ss(2.9, 3.2, t))))

# ---------------------------------------------------------------- three in the afternoon: the hands swept round, the clock strikes three
m.whoosh(3.3, 0.9, 250, 1600, 0.014, -0.3)
whirr(TM['three'] - 0.55, TM['three'] + 0.08, 0.006, -0.3)
for j, at in enumerate((TM['three'] + 0.12, TM['three'] + 0.47, TM['three'] + 0.82)): m.bell(at, 64, 0.016, -0.3, 1.5, buf='X'); m.bell(at + 0.01, 76, 0.005, -0.3, 1.0, buf='X')
# lunch was a coffee: a little deflating figure; the cup lifted away, the sandwich landing
m.whoosh(5.45, 0.7, 260, 1500, 0.013, -0.4)
m.pluck(T['coffee'] + 0.35, 64, 0.011, -0.4, 0.35); m.pluck(T['coffee'] + 0.55, 61, 0.011, -0.4, 0.4); m.pluck(T['coffee'] + 0.78, 57, 0.012, -0.4, 0.7)
C0, C1 = TM['cup']; m.swish(C0, C1 - C0 + 0.1, 0.012, -0.4, 1600); m.whoosh(C0 + 0.1, C1 - C0, 400, 2600, 0.006, -0.4)
soft(TM['sandwich'], 0.04, -0.4, 140); soft(TM['sandwich'] + 0.09, 0.012, -0.4, 160)
m.shimmer(TM['sandwich'] + 0.06, (84, 88, 91), 0.006, -0.4, 0.5, 1.2)

# ---------------------------------------------------------------- the hunger gauge: pushed to empty, then on into ANGRY, buzzing; steam again
m.whoosh(9.3, 0.75, 250, 1500, 0.014, 0.1)
m.tone_line(T['push'] - 0.05, T['far'] + 0.4, 60, 0.004, 0.2, glide=lambda t: 7 * s5(T['push'] - 0.05, T['far'] + 0.4, t))   # the needle swings to EMPTY
A0, A1 = TM['gaugeAngry']; m.tone_line(A0, A1, 67, 0.005, 0.2, glide=lambda t: 6 * s5(A0, A1, t))                          # ... and on, into ANGRY
tb = m.t(T['anger'], 16.4); one(T['anger'], bp(m.noise(len(tb)), 300, 2400) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 37 * (tb - tb[0])))) * ss(T['anger'], T['anger'] + 0.2, tb) * (1 - ss(15.8, 16.4, tb)), 0.004, 0.2)   # the needle rattling at the stop
m.tock(T['anger'] + 0.03, 0.02, -0.1, f=360)                                                                                  # the jaw again, out of shot
hiss(TM['steam2'][0], TM['steam2'][1], 0.005, -0.1, whistle=0.3)

# ---------------------------------------------------------------- the study: three weeks of ratings filled in, the points, the line, the stamp
m.whoosh(15.75, 0.9, 240, 1500, 0.014, 0.3)
F0, F1 = TM['fill']
for d in range(21): m.tick(F0 + (F1 - F0) * (d + 1) / 21 - 0.02, 0.006, 0.25, hi=2600, lo=1300)
P0, P1 = TM['plot']; m.rain(P0, P1, 34, 0.004, pitch=(84, 100), seed=1515)
m.tone_line(P1 - 0.3, P1 + 1.4, 69, 0.005, 0.2, glide=lambda t: 7 * s5(P1 - 0.3, P1 + 1.4, t))                            # the line drawn up
R0 = TM['real']; m.thud(R0 + 0.55, 90, 0.02, 0.2, 0.08); m.clink(R0 + 0.56, 0.008, 0.2, f=1500)                              # the stamp: HANGRY: REAL

# ---------------------------------------------------------------- the lab test: a crash; the slider to harsh; a gentle prompt; back to fair
X0 = TM['crash']
for j, (dt, f) in enumerate([(0.0, 330.0), (0.16, 247.0)]): m.beep(X0 + dt, f=f, d=0.16, g=0.01, pan=0.2)                  # the crash: a low two-tone error
tr = m.t(X0, X0 + 0.5); one(X0, bp(m.noise(len(tr)), 80, 900) * np.exp(-(tr - X0) * 6), 0.006, 0.2)
H = TM['harsh']; m.swish(H - 0.2, 0.55, 0.009, 0.3, 1900); m.pluck(H + 0.32, 58, 0.012, 0.3, 0.5); m.pluck(H + 0.34, 59, 0.01, 0.3, 0.5)   # harsh: a sour pair
m.bell(TM['feel'] + 0.05, 84, 0.008, 0.2, 0.9, buf='X'); m.bell(TM['feel'] + 0.2, 88, 0.007, 0.2, 1.1, buf='X')            # how are you feeling?
m.swish(TM['fair'], 0.8, 0.009, 0.2, 1500); m.pluck(TM['fair'] + 0.85, 67, 0.011, 0.2, 0.6)

# ---------------------------------------------------------------- meals at regular times; a real snack dropped on the desk
m.whoosh(38.6, 1.0, 240, 1500, 0.014, -0.3)
M0, M1 = TM['meals']
for j, nn in enumerate((72, 76, 79)): m.pluck(M0 + 0.15 + j * 0.25, nn, 0.011, -0.3, 0.6)
m.whoosh(41.25, 0.7, 260, 1500, 0.013, -0.2)
S0 = TM['snack'][0]; m.swish(S0 - 0.35, 0.35, 0.006, -0.3, 1500)
soft(S0, 0.045, -0.35, 120, 0.35)                                                                                            # the apple
for j, dt in enumerate((0.01, 0.05, 0.08, 0.12, 0.17)): m.clink(S0 + dt, 0.006 / (1 + 0.4 * j), -0.25, f=2400 + 300 * j)    # the almonds in their bowl
m.pluck(S0 + 0.45, 72, 0.01, -0.3, 0.5); m.pluck(S0 + 0.6, 76, 0.01, -0.3, 0.6)

# ---------------------------------------------------------------- before you send: angry, or just hungry? Hungry. Deleted. Sorry, back after lunch.
m.whoosh(43.4, 0.75, 250, 1500, 0.014, 0.2)
D = TM['dialog']; m.beep(D + 0.12, f=880.0, d=0.09, g=0.01, pan=0.1); m.beep(D + 0.24, f=1175.0, d=0.12, g=0.01, pan=0.1)
k = int(0.05 * SR); one(TM['pick'], bp(m.noise(k), 2000, 7000) * env(k, 0.0003, 0.004), 0.03, 0.1)                          # click: Hungry
Q0, Q1 = TM['del']
for i in range(17): key(Q0 + (Q1 - Q0) * (i + 0.5) / 17, 0.02, 0.1, hard=0.6)                                               # the insult held down, deleted
R0, R1 = TM['retype']
for i in range(24): key(R0 + (R1 - R0) * (i + 1) / 24 - 0.012, 0.016 * (0.85 + 0.3 * rng.random()), 0.1, hard=0.7)           # calmly typed

# ---------------------------------------------------------------- the warnings; the end
m.whoosh(52.9, 0.9, 240, 1500, 0.014, -0.2)
m.whoosh(74.9, 1.25, 220, 1400, 0.012, 0.0)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])

# ---------------------------------------------------------------- the score
m.pad([45, 52, 57, 60], 0.0, 3.4, 0.5, 1100)                         # the angry email
m.pad([48, 55, 60, 64], 3.4, 9.7, 0.5, 1400)                         # three o'clock; lunch was a coffee; fed
m.pad([43, 50, 55, 58], 9.7, 16.5, 0.5, 1000)                        # built for hunger; pushed too far
m.pad([45, 52, 57, 60, 64], 16.5, 29.1, 0.5, 1200)                   # the study; hangry is real
m.pad([41, 53, 57, 60], 29.1, 39.0, 0.5, 1000)                       # the lab test
m.pad([48, 55, 60, 64, 67], 39.0, 44.0, 0.5, 1500)                   # meals, a snack
m.pad([45, 57, 60, 64], 44.0, 53.6, 0.5, 1200)                       # angry, or just hungry?
m.pad([38, 50, 57, 62], 53.6, T['final'], 0.5, 900)                  # the warnings
m.pad([45, 57, 64, 69, 72, 76], T['final'], T['end'], 1.0, 2400, rel=0.2)
m.finish(REPORT, VOICE, OUT, 'film15')
