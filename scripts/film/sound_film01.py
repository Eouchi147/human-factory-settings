"""Film 1 "Always tired?": original score and sound design, synthesised here (no samples, no library).
Timed to the film's own timeline (film1.js T) and ducked under the voice lines of the guide.
Writes: film1_fx.wav (music and effects, for Sam's own voice) and film1_guide_mix.wav (with the AI voice guide).
Usage: python3 sound_film1.py <voice guide wav> <voice report json> <out dir>"""
import json, sys, os
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile
import soundfile as sf

VOICE = sys.argv[1]; REPORT = sys.argv[2]; OUT = sys.argv[3]
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from retime import timemap, inverse
RT = json.load(open(sys.argv[4]))['anchors'] if len(sys.argv) > 4 else None
NT = inverse(timemap(RT)) if RT else (lambda x: x)   # the film's own time to the new voice's time
SR = 48000; DUR = NT(63.0); N = int(DUR * SR)
rng = np.random.default_rng(20261001)
tt = np.arange(N) / SR
T = dict(alarm=0.6, ring1=2.1, portal0=4.5, portal1=6.05, fill0=6.1, fill1=11.5, night=12.35, woke=15.05,
         drop0=15.9, dropFall=17.3, splash=18.42, hide0=20.2, hide1=23.6, steam0=23.85, six=26.35, eleven=30.95,
         lamp=33.45, phone=35.05, shift0=40.45, shift1=42.45, dialsUp=44.35, dial1=47.5, dial2=49.5, dial3=51.28,
         lampOff=52.0, dawn0=52.35, seven=54.45, final=59.35, click=60.5, logo=61.15)
T = {k: NT(v) for k, v in T.items()}

M = [np.zeros(N), np.zeros(N)]   # music
X = [np.zeros(N), np.zeros(N)]   # effects

def add(buf, sig, start, pan=0.0, gain=1.0):
    i = int(round(start * SR))
    if i >= N: return
    if i < 0: sig = sig[-i:]; i = 0
    n = min(len(sig), N - i)
    lg = gain * np.cos((pan + 1) * np.pi / 4); rg = gain * np.sin((pan + 1) * np.pi / 4)
    buf[0][i:i + n] += sig[:n] * lg; buf[1][i:i + n] += sig[:n] * rg
def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1.0, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, min(hi, SR / 2 - 100)], btype="band", fs=SR, output="sos"), x)
def lp(x, f, order=2): return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)
def ss(a, b, x): u = np.clip((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u)
def note(n): return 440.0 * 2 ** ((n - 69) / 12)   # MIDI number to Hz

# ---------------------------------------------------------------- the score: a slow pad that changes with the story
def pad(notes, t0, t1, gain=1.0, bright=1400, att=1.2, rel=1.6):
    a, b = max(0, t0 - att), min(DUR, t1 + rel)
    i0, i1 = int(a * SR), int(b * SR); t = np.arange(i1 - i0) / SR + a
    out = np.zeros(i1 - i0)
    for nn in notes:
        f = note(nn)
        for k, amp in [(1, 1.0), (2, 0.32), (3, 0.14), (4, 0.06), (5, 0.03)]:
            for dt in (-0.0028, 0.0, 0.0031):
                out += amp * np.sin(2 * np.pi * f * k * (1 + dt) * t + rng.uniform(0, 6.28)) / 3
    out = lp(out / len(notes), bright)
    e = ss(a, t0 + 0.2, t) * (1 - ss(t1 - 0.2, b, t))
    out *= e * (0.85 + 0.15 * np.sin(2 * np.pi * t / 6.1 + rng.uniform(0, 6)))
    add(M, out * gain, a, rng.uniform(-0.15, 0.15))
# D minor at dawn; the brain day in B-flat; night in G minor; the drop and the coffee in D minor;
# the line in F; late light in B-flat; the settings build C; the morning opens in F major; the end in F add 9
pad([38, 53, 57, 60, 64], NT(0.0), NT(4.6), 0.9, 1100)
pad([34, 53, 57, 62, 65], NT(4.6), NT(12.4), 1.0, 1500)
pad([31, 50, 53, 58, 57 + 12], NT(12.4), NT(17.2), 0.9, 900)
pad([38, 50, 53, 57], NT(17.2), NT(26.2), 0.8, 1000)
pad([41, 53, 57, 60, 67], NT(26.2), NT(33.4), 0.9, 1700)
pad([34, 50, 53, 57, 60], NT(33.4), NT(44.2), 0.95, 1300)
pad([36, 52, 55, 60], NT(44.2), NT(52.3), 0.9, 1600)
pad([41, 53, 57, 60, 64, 69], NT(52.3), NT(59.4), 1.05, 2400)
pad([41, 53, 60, 64, 67, 69], NT(59.4), NT(63.0), 1.1, 2600, rel=0.2)

# a pulse that rises with the adenosine (eighths at 84 a minute, brighter as the level rises)
step = 60 / 84 / 2
k = 0
t = T["fill0"]
while t < T["woke"]:
    lvl = float(ss(T["fill0"], T["fill1"], t)) * (1 - 0.7 * float(ss(T["night"], T["woke"], t)))
    n = int(0.25 * SR); x = np.arange(n) / SR
    f = note([46, 53, 58, 53][k % 4] + (12 if lvl > 0.6 and k % 8 == 7 else 0))
    blip = np.sin(2 * np.pi * f * x) * env(n, 0.004, 0.09) * (0.03 + 0.07 * lvl)
    add(M, lp(blip, 900 + 2600 * lvl), t, 0.25 if k % 2 else -0.25)
    t += step; k += 1

# the caffeine curve, heard: a soft tone that rises with the steam and falls as the caffeine halves
def curve_tone():
    a, b = T["steam0"], T["lamp"] + 0.6
    i0, i1 = int(a * SR), int(b * SR); t = np.arange(i1 - i0) / SR + a
    rise = ss(a, T["six"] + 0.6, t)
    h = np.clip((t - (T["six"] + 0.6)) / (T["eleven"] - (T["six"] + 0.6)) * 5, 0, None)
    y = np.where(t < T["six"] + 0.6, rise, 0.5 ** (h / 5))
    f = note(57) * 2 ** (y * 1.0) * (1 + 0.003 * np.sin(2 * np.pi * 5.2 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    e = ss(a, a + 0.8, t) * (1 - ss(T["lamp"] - 0.2, b, t))
    add(M, lp(s, 2200) * e * 0.06, a, 0.1)
curve_tone()

# ---------------------------------------------------------------- effects
def tick(at, gain=0.16, pan=0.2):
    n = int(0.05 * SR)
    c = bp(rng.normal(0, 1, n), 2400, 7000) * env(n, 0.0005, 0.004)
    body = np.sin(2 * np.pi * 1850 * np.arange(n) / SR) * env(n, 0.0003, 0.006) * 0.5 + np.sin(2 * np.pi * 620 * np.arange(n) / SR) * env(n, 0.0003, 0.01) * 0.3
    add(X, (c + body) * gain, at, pan)
# the second hand, whenever the clock is on screen (it ticks on each whole second of clock time)
for s in range(0, 9):
    if T["alarm"] + s < T["portal0"]: tick(T["alarm"] + s, 0.14)   # real seconds: the second hand keeps real time
for s in np.arange(NT(33.0), NT(44.0), 1.0): tick(s, 0.12, 0.3)
for s in np.arange(T["seven"] + 1.0, T["final"] + 1.0, 1.0): tick(s, 0.12, 0.1)
# the night passing: ticks speeding into a whir, then gone
t = T["dawn0"]; gap = 0.5
while t < T["seven"] - 0.1:
    tick(t, 0.06 + 0.05 * float(ss(T["dawn0"], T["seven"], t)), 0.2)
    gap = max(0.018, gap * 0.86); t += gap

# the alarm: soft, four quick beeps, twice, and a press
def beep(at, f=2093.0, d=0.07, g=0.11):
    n = int(d * SR); x = np.arange(n) / SR
    s = np.sign(np.sin(2 * np.pi * f * x)) * 0.35 + np.sin(2 * np.pi * f * x)
    add(X, lp(s, 5200) * np.minimum(1, x / 0.004) * np.minimum(1, (d - x) / 0.01) * g, at, 0.15)
for grp in range(4):
    for j in range(4): beep(T["alarm"] + grp * 0.8 + j * 0.11, g=0.11 - grp * 0.02)
# the morning alarm, gentler: three rising notes
for j, nn in enumerate([77, 81, 84]): beep(T["seven"] + j * 0.16, note(nn), 0.12, 0.06)

# through the clock face: air rushing in, a low bloom on the other side
n = int(2.2 * SR); x = np.arange(n) / SR
wn = rng.normal(0, 1, n); out = np.zeros(n)
for i in range(0, n, 2400):
    u = i / n; f = 300 * (12 ** u)
    seg = bp(wn[max(0, i - 600):i + 2400], f * 0.6, f * 1.8)
    out[i:i + 2400] = seg[-len(out[i:i + 2400]):]
add(X, out * np.sin(np.pi * np.clip(x / 2.2, 0, 1)) ** 2 * 0.12, T["portal0"] - 0.3, -0.1)
n = int(2.6 * SR); x = np.arange(n) / SR
bloom = (np.sin(2 * np.pi * (46 * x - 3 * x * x)) + 0.3 * np.sin(2 * np.pi * 92 * x)) * env(n, 0.03, 0.8)
add(X, bloom * 0.22, T["portal1"] - 0.25)

# waking, with sleep cut short: a small hard chirp that stops the clearing
for j in range(3): beep(T["woke"] + j * 0.09, 2637.0, 0.05, 0.07)

# the drop: tension while it gathers, a falling whistle, a plink and a soft splash
n = int((T["dropFall"] - T["drop0"]) * SR); x = np.arange(n) / SR
ten = np.sin(2 * np.pi * (1400 + 500 * x / x[-1]) * x) * (x / x[-1]) ** 2 * 0.02
add(X, ten, T["drop0"], 0)
n = int((T["splash"] - T["dropFall"]) * SR); x = np.arange(n) / SR
fall = np.sin(2 * np.pi * np.cumsum(1900 - 1100 * (x / x[-1]) ** 2) / SR) * ss(0, 0.2, x) * 0.025
add(X, fall, T["dropFall"], 0)
n = int(0.5 * SR); x = np.arange(n) / SR
plink = np.sin(2 * np.pi * np.cumsum(700 + 1500 * np.minimum(1, x / 0.03)) / SR) * env(n, 0.001, 0.07)
splash = bp(rng.normal(0, 1, n), 500, 6000) * env(n, 0.002, 0.05) * 0.5
thump = np.sin(2 * np.pi * 70 * x) * env(n, 0.002, 0.12)
add(X, plink * 0.2 + splash * 0.12 + thump * 0.25, T["splash"], 0)
# it hides it: a soft swallow
n = int(1.4 * SR); x = np.arange(n) / SR
add(X, lp(rng.normal(0, 1, n), 420) * np.sin(np.pi * x / 1.4) ** 2 * 0.07, NT(22.6), 0)

# the 11 p.m. dot: one clear ping
n = int(1.6 * SR); x = np.arange(n) / SR
add(X, (np.sin(2 * np.pi * note(81) * x) + 0.2 * np.sin(2 * np.pi * note(81) * 2.76 * x) * np.exp(-x / 0.2)) * env(n, 0.002, 0.5) * 0.06, T["eleven"], 0.2)

# the lamp switch: click, spring, a warm hum that stays while it's on
n = int(0.12 * SR); x = np.arange(n) / SR
clk = bp(rng.normal(0, 1, n), 1200, 9000) * env(n, 0.0004, 0.006) + np.sin(2 * np.pi * 380 * x) * env(n, 0.0005, 0.02) * 0.4
add(X, clk * 0.32, T["lamp"] - 0.012, 0.4); add(X, clk * 0.12, T["lamp"] + 0.05, 0.4)
a, b = T["lamp"], T["lampOff"] + 0.1
i0, i1 = int(a * SR), int(b * SR); x = np.arange(i1 - i0) / SR + a
hum = (np.sin(2 * np.pi * 120 * x) + 0.4 * np.sin(2 * np.pi * 240 * x)) * ss(a, a + 0.08, x) * (1 - ss(T["dial3"], T["dial3"] + 0.5, x) * 0.6) * (1 - ss(T["lampOff"], b, x))
add(X, hum * 0.008, a, 0.4)
# lights out: the same switch, off
add(X, clk * 0.26, T["lampOff"] - 0.012, 0.4); add(X, clk * 0.1, T["lampOff"] + 0.045, 0.4)
# the phone lights up: a cold glassy shimmer
n = int(1.8 * SR); x = np.arange(n) / SR
gl = sum(np.sin(2 * np.pi * note(nn) * x + rng.uniform(0, 6)) * w for nn, w in [(88, 1), (95, 0.6), (100, 0.3)]) * env(n, 0.02, 0.45)
add(X, gl * 0.03, T["phone"], -0.3)
# the sleep signal slides later: a slow downward bend
n = int(2.2 * SR); x = np.arange(n) / SR
f = note(76) * 2 ** (-0.5 * ss(0.2, 2.0, x))
add(X, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x / 2.2) ** 2 * 0.045, T["shift0"] - 0.1, 0)

# the settings: three dials slide up out of the table, then each clicks into place and adds a note
for i in range(3):
    n = int(1.1 * SR); x = np.arange(n) / SR
    rumble = lp(rng.normal(0, 1, n), 260) * np.sin(np.pi * x / 1.1) ** 2
    add(X, rumble * 0.07, T["dialsUp"] + 0.15 + i * 0.18, -0.2 + i * 0.2)
def detents(at, count, gain):
    for j in range(count):
        n = int(0.03 * SR); c = bp(rng.normal(0, 1, n), 3000, 9000) * env(n, 0.0003, 0.003)
        add(X, c * gain, at + j * 0.035, 0.1)
for i, (at, nn) in enumerate([(T["dial1"], 72), (T["dial2"], 76), (T["dial3"], 79)]):
    detents(at - 0.35, 9, 0.05)
    n = int(0.2 * SR); x = np.arange(n) / SR
    clunk = bp(rng.normal(0, 1, n), 800, 6000) * env(n, 0.0005, 0.01) + np.sin(2 * np.pi * 210 * x) * env(n, 0.001, 0.03) * 0.6
    add(X, clunk * 0.22, at + 0.05, 0.15)
    n = int(3.0 * SR); x = np.arange(n) / SR
    bell = (np.sin(2 * np.pi * note(nn) * x) + 0.25 * np.sin(2 * np.pi * note(nn) * 2.0 * x) * np.exp(-x / 0.3)) * env(n, 0.004, 1.1)
    add(M, bell * 0.07, at + 0.06, -0.3 + 0.3 * i)
# lights low: the hum drops (above); the room settles

# the night passes: a long swell, like time drawn in breath
n = int(2.4 * SR); x = np.arange(n) / SR
sw = hp(rng.normal(0, 1, n), 1800) * (x / 2.4) ** 2.2 * (1 - ss(2.1, 2.4, x))
add(X, sw * 0.06, T["dawn0"], 0)

# the end: every hand swings back to twelve and lands with a deep click, then the chord rings for the logo
n = int(0.9 * SR); x = np.arange(n) / SR
swing = bp(rng.normal(0, 1, n), 400, 2400) * np.sin(np.pi * np.clip(x / 0.55, 0, 1)) ** 2 * 0.05
add(X, swing, T["click"] - 0.55, 0)
n = int(0.6 * SR); x = np.arange(n) / SR
land = bp(rng.normal(0, 1, n), 600, 8000) * env(n, 0.0004, 0.008) + np.sin(2 * np.pi * 98 * x) * env(n, 0.002, 0.16) * 0.9
add(X, land * 0.3, T["click"], 0)
for nn, g in [(65, 0.08), (69, 0.06), (72, 0.05), (77, 0.045), (79, 0.03)]:
    n = int(2.4 * SR); x = np.arange(n) / SR
    b_ = (np.sin(2 * np.pi * note(nn) * x) + 0.3 * np.sin(2 * np.pi * note(nn) * 2.76 * x) * np.exp(-x / 0.35)) * env(n, 0.003, 0.95)
    add(M, b_ * g, T["logo"] - 0.05, rng.uniform(-0.3, 0.3))

# a quiet room under everything
room = lp(hp(rng.normal(0, 1, N), 60), 900) * 0.006
X[0] += room; X[1] += room * 0.9

# ---------------------------------------------------------------- the voice: duck the music under every line
rep = json.load(open(REPORT))
duck = np.zeros(N)
for r in rep:
    duck[int((r["start"] - 0.12) * SR):int((r["end"] + 0.25) * SR)] = 1
k = int(0.25 * SR); win = np.hanning(2 * k); win /= win.sum()
duck = np.convolve(duck, win, mode="same")
mg = 1 - 0.5 * duck   # about -6 dB under speech
for c in range(2): M[c] *= mg

# a small room on the music and effects
n_ir = int(1.8 * SR); ti = np.arange(n_ir) / SR
irs = [lp(rng.normal(0, 1, n_ir) * np.exp(-ti / 0.45), 5200) for _ in range(2)]
irs = [ir / np.sqrt((ir ** 2).sum()) for ir in irs]
stem = [M[c] + X[c] for c in range(2)]
stem = [stem[c] + 0.2 * fftconvolve(stem[c], irs[c])[:N] for c in range(2)]
stem = np.stack(stem, axis=1)
stem = np.tanh(stem * 1.2) / np.tanh(1.2)
stem *= 0.5 / np.max(np.abs(stem))
os.makedirs(OUT, exist_ok=True)
wavfile.write(os.path.join(OUT, "film01_fx.wav"), SR, stem.astype(np.float32))
v, vsr = sf.read(VOICE)
if v.ndim > 1: v = v.mean(1)
if vsr != SR:
    from scipy.signal import resample_poly
    v = resample_poly(v, SR, vsr)
v = np.pad(v, (0, max(0, N - len(v))))[:N]
v = v / (np.max(np.abs(v)) + 1e-9) * 0.9
mix = stem * 0.55 + np.stack([v, v], axis=1)
mix *= 0.95 / np.max(np.abs(mix))
wavfile.write(os.path.join(OUT, "film01_guide_mix.wav"), SR, mix.astype(np.float32))
print("ok", stem.shape, float(np.sqrt((stem ** 2).mean())), float(np.sqrt((mix ** 2).mean())))
