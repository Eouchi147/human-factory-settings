"""Human Factory Settings: the shared sound kit. Every film's score and effects are synthesised here (no samples, no library),
timed to the film's own timeline, ducked under the voice, and written as two stems:
  <name>_fx.wav         music and effects only (for Sam's own voice)
  <name>_guide_mix.wav  the same with the AI voice guide on top
A film's sound script makes a Mix, places cues, then calls finish()."""
import json, os
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, resample_poly
from scipy.io import wavfile
import soundfile as sf

SR = 48000
def note(n): return 440.0 * 2 ** ((n - 69) / 12)   # MIDI number to Hz
def ss(a, b, x): u = np.clip((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u)
def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1.0, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, min(hi, SR / 2 - 100)], btype="band", fs=SR, output="sos"), x)
def lp(x, f, order=2): return sosfilt(butter(order, min(f, SR / 2 - 100), btype="low", fs=SR, output="sos"), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)

class Mix:
    def __init__(self, dur, seed=1):
        self.dur = dur; self.N = int(dur * SR); self.rng = np.random.default_rng(seed)
        self.M = [np.zeros(self.N), np.zeros(self.N)]   # music
        self.X = [np.zeros(self.N), np.zeros(self.N)]   # effects
    def t(self, a, b): i0, i1 = int(a * SR), int(b * SR); return np.arange(i1 - i0) / SR + a
    def add(self, buf, sig, start, pan=0.0, gain=1.0):
        buf = self.M if buf == 'M' else self.X if buf == 'X' else buf
        i = int(round(start * SR))
        if i >= self.N: return
        if i < 0: sig = sig[-i:]; i = 0
        n = min(len(sig), self.N - i)
        lg = gain * np.cos((pan + 1) * np.pi / 4); rg = gain * np.sin((pan + 1) * np.pi / 4)
        buf[0][i:i + n] += sig[:n] * lg; buf[1][i:i + n] += sig[:n] * rg
    def noise(self, n): return self.rng.normal(0, 1, n)

    # ---------------------------------------------------------------- music
    def pad(self, notes, t0, t1, gain=1.0, bright=1400, att=1.2, rel=1.6):
        a, b = max(0, t0 - att), min(self.dur, t1 + rel); t = self.t(a, b); out = np.zeros(len(t))
        for nn in notes:
            f = note(nn)
            for k, amp in [(1, 1.0), (2, 0.32), (3, 0.14), (4, 0.06), (5, 0.03)]:
                for dt in (-0.0028, 0.0, 0.0031):
                    out += amp * np.sin(2 * np.pi * f * k * (1 + dt) * t + self.rng.uniform(0, 6.28)) / 3
        out = lp(out / len(notes), bright)
        e = ss(a, t0 + 0.2, t) * (1 - ss(t1 - 0.2, b, t))
        out *= e * (0.85 + 0.15 * np.sin(2 * np.pi * t / 6.1 + self.rng.uniform(0, 6)))
        self.add('M', out * gain, a, self.rng.uniform(-0.15, 0.15))
    def pluck(self, at, nn, gain=0.05, pan=0.0, decay=0.45, bright=3200):
        n = int((decay * 4 + 0.05) * SR); x = np.arange(n) / SR; f = note(nn)
        s = (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * 2 * f * x) * np.exp(-x / (decay * 0.4)) + 0.1 * np.sin(2 * np.pi * 3 * f * x) * np.exp(-x / (decay * 0.25)))
        self.add('M', lp(s * env(n, 0.004, decay), bright) * gain, at, pan)
    def bell(self, at, nn, gain=0.06, pan=0.0, decay=1.0, buf='M'):
        n = int((decay * 3 + 0.2) * SR); x = np.arange(n) / SR; f = note(nn)
        s = (np.sin(2 * np.pi * f * x) + 0.25 * np.sin(2 * np.pi * f * 2.0 * x) * np.exp(-x / 0.3) + 0.12 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x / 0.2)) * env(n, 0.004, decay)
        self.add(buf, s * gain, at, pan)
    def pulse(self, t0, t1, bpm, seq, gain=0.06, bright=1600, lvl=None, pan=0.25, decay=0.09):
        step = 60 / bpm / 2; k = 0; t = t0
        while t < t1:
            g = gain * (lvl(t) if lvl else 1.0); n = int(0.25 * SR); x = np.arange(n) / SR
            blip = np.sin(2 * np.pi * note(seq[k % len(seq)]) * x) * env(n, 0.004, decay)
            self.add('M', lp(blip, bright) * g, t, pan if k % 2 else -pan); t += step; k += 1
    def tone_line(self, t0, t1, nn, gain=0.05, pan=0.0, glide=None):
        t = self.t(t0, t1); f = note(nn) * (2 ** (glide(t) / 12) if glide else 1) * (1 + 0.003 * np.sin(2 * np.pi * 5.2 * t))
        ph = 2 * np.pi * np.cumsum(np.broadcast_to(f, t.shape)) / SR
        s = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
        self.add('M', lp(s, 2400) * ss(t0, t0 + 0.25, t) * (1 - ss(t1 - 0.4, t1, t)) * gain, t0, pan)

    # ---------------------------------------------------------------- effects
    def tick(self, at, gain=0.16, pan=0.2, hi=1850, lo=620):
        n = int(0.05 * SR); x = np.arange(n) / SR
        c = bp(self.noise(n), 2400, 7000) * env(n, 0.0005, 0.004)
        body = np.sin(2 * np.pi * hi * x) * env(n, 0.0003, 0.006) * 0.5 + np.sin(2 * np.pi * lo * x) * env(n, 0.0003, 0.01) * 0.3
        self.add('X', (c + body) * gain, at, pan)
    def tock(self, at, gain=0.2, pan=0.0, f=520):   # a wooden clock tock
        n = int(0.18 * SR); x = np.arange(n) / SR
        s = bp(self.noise(n), 900, 4200) * env(n, 0.0006, 0.007) + np.sin(2 * np.pi * f * x) * env(n, 0.0008, 0.035) * 0.8 + np.sin(2 * np.pi * f * 2.3 * x) * env(n, 0.0005, 0.012) * 0.3
        self.add('X', s * gain, at, pan)
    def beep(self, at, f=2093.0, d=0.07, g=0.11, pan=0.15):
        n = int(d * SR); x = np.arange(n) / SR
        s = np.sign(np.sin(2 * np.pi * f * x)) * 0.35 + np.sin(2 * np.pi * f * x)
        self.add('X', lp(s, 5200) * np.minimum(1, x / 0.004) * np.minimum(1, (d - x) / 0.01) * g, at, pan)
    def whoosh(self, at, dur=0.8, lo=300, hi=3000, gain=0.08, pan=0.0, up=True):
        n = int(dur * SR); x = np.arange(n) / SR; wn = self.noise(n + 4800); out = np.zeros(n); blk = 1200
        for i in range(0, n, blk):
            u = i / n; f = lo * (hi / lo) ** (u if up else 1 - u)
            seg = bp(wn[i:i + blk + 4800], f * 0.6, f * 1.8)[-blk:]; out[i:i + blk] = seg[:len(out[i:i + blk])]
        self.add('X', out * np.sin(np.pi * np.clip(x / dur, 0, 1)) ** 2 * gain, at, pan)
    def swish(self, at, dur=0.5, gain=0.05, pan=0.0, f=1400):   # a soft movement through air
        n = int(dur * SR); x = np.arange(n) / SR
        self.add('X', bp(self.noise(n), f * 0.5, f * 2.2) * np.sin(np.pi * np.clip(x / dur, 0, 1)) ** 3 * gain, at, pan)
    def thud(self, at, f=55, gain=0.3, pan=0.0, decay=0.25):   # a deep, heavy landing
        n = int((decay * 4) * SR); x = np.arange(n) / SR
        s = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.6 * np.exp(-x / 0.03))) / SR) * env(n, 0.002, decay) + lp(self.noise(n), 300) * env(n, 0.001, 0.04) * 0.6
        self.add('X', s * gain, at, pan)
    def clink(self, at, gain=0.2, pan=0.0, f=2950):   # small metal on wood
        n = int(0.6 * SR); x = np.arange(n) / SR
        s = sum(np.sin(2 * np.pi * f * r * x + self.rng.uniform(0, 6)) * np.exp(-x / d) * w for r, d, w in [(1, 0.09, 1), (1.47, 0.06, 0.6), (2.31, 0.035, 0.4), (3.12, 0.02, 0.3)])
        s = s * np.minimum(1, x / 0.0005) + bp(self.noise(n), 2000, 9000) * env(n, 0.0003, 0.004) * 0.8 + np.sin(2 * np.pi * 160 * x) * env(n, 0.001, 0.02) * 0.4
        self.add('X', s * gain, at, pan)
    def snip(self, at, gain=0.12, pan=0.0):   # a thread let go
        n = int(0.08 * SR); x = np.arange(n) / SR
        self.add('X', hp(self.noise(n), 3500) * env(n, 0.0004, 0.006) * gain + np.sin(2 * np.pi * 3200 * x) * env(n, 0.0002, 0.003) * gain * 0.5, at, pan)
    def rustle(self, t0, t1, gain=0.03, pan=0.0):   # paper, or thread settling
        t = self.t(t0, t1); n = len(t)
        s = bp(self.noise(n), 1500, 7000) * (0.4 + 0.6 * np.abs(lp(self.noise(n), 18) * 6).clip(0, 1)) * np.sin(np.pi * np.clip((t - t0) / (t1 - t0), 0, 1)) ** 2
        self.add('X', s * gain, t0, pan)
    def shimmer(self, at, notes=(88, 95, 100), gain=0.03, pan=-0.3, decay=0.45, dur=1.8):   # cold glass light (a phone screen)
        n = int(dur * SR); x = np.arange(n) / SR
        g = sum(np.sin(2 * np.pi * note(nn) * x + self.rng.uniform(0, 6)) * w for nn, w in zip(notes, (1, 0.6, 0.3))) * env(n, 0.02, decay)
        self.add('X', g * gain, at, pan)
    def scan(self, at, dur=1.2, gain=0.05, pan=0.0):   # a digital sweep (a computer model)
        n = int(dur * SR); x = np.arange(n) / SR
        f = 400 + 3600 * (x / dur) ** 1.5; sq = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (np.sin(2 * np.pi * 31 * x) > 0)
        self.add('X', lp(sq, 4000) * np.sin(np.pi * np.clip(x / dur, 0, 1)) ** 2 * gain, at, pan)
    def rain(self, t0, t1, count, gain=0.05, pitch=(84, 100), seed=7):   # many small points arriving
        r = np.random.default_rng(seed)
        for i in range(count):
            at = t0 + (t1 - t0) * (r.random() ** 0.8); n = int(0.06 * SR); x = np.arange(n) / SR; f = note(r.uniform(*pitch))
            self.add('X', np.sin(2 * np.pi * f * x) * env(n, 0.001, 0.012) * gain * r.uniform(0.4, 1), at, r.uniform(-0.6, 0.6))
    def heartbeat(self, at, gain=0.25, pan=0.0):
        for dt, g in [(0, 1.0), (0.28, 0.7)]:
            n = int(0.3 * SR); x = np.arange(n) / SR
            self.add('X', np.sin(2 * np.pi * np.cumsum(48 * (1 + 0.5 * np.exp(-x / 0.02))) / SR) * env(n, 0.004, 0.07) * gain * g, at + dt, pan)
    def drone(self, t0, t1, nn, gain=0.05, bright=500):   # low, cold, steady
        t = self.t(t0, t1); f = note(nn)
        s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.003 * t + 1) + 0.3 * np.sin(2 * np.pi * 2 * f * t)
        self.add('M', lp(s + lp(self.noise(len(t)), 200) * 0.3, bright) * ss(t0, t0 + 1.0, t) * (1 - ss(t1 - 1.0, t1, t)) * gain, t0, 0.0)

    # ---------------------------------------------------------------- the brand: every film ends the same way
    def logo_end(self, click, logo, swing=True):
        if swing:
            n = int(0.9 * SR); x = np.arange(n) / SR
            self.add('X', bp(self.noise(n), 400, 2400) * np.sin(np.pi * np.clip(x / 0.55, 0, 1)) ** 2 * 0.05, click - 0.55, 0)
        n = int(0.6 * SR); x = np.arange(n) / SR
        land = bp(self.noise(n), 600, 8000) * env(n, 0.0004, 0.008) + np.sin(2 * np.pi * 98 * x) * env(n, 0.002, 0.16) * 0.9
        self.add('X', land * 0.3, click, 0)
        for nn, g in [(65, 0.08), (69, 0.06), (72, 0.05), (77, 0.045), (79, 0.03)]:
            n = int(2.4 * SR); x = np.arange(n) / SR
            b_ = (np.sin(2 * np.pi * note(nn) * x) + 0.3 * np.sin(2 * np.pi * note(nn) * 2.76 * x) * np.exp(-x / 0.35)) * env(n, 0.003, 0.95)
            self.add('M', b_ * g, logo - 0.05, self.rng.uniform(-0.3, 0.3))
    def room(self, gain=0.006):
        r = lp(hp(self.noise(self.N), 60), 900) * gain; self.X[0] += r; self.X[1] += r * 0.9

    # ---------------------------------------------------------------- the voice: duck the music under every line, write both stems
    def finish(self, report, voice, out, name, duck_db=6.0):
        rep = json.load(open(report)); N = self.N
        duck = np.zeros(N)
        for r in rep: duck[max(0, int((r["start"] - 0.12) * SR)):int((r["end"] + 0.25) * SR)] = 1
        k = int(0.25 * SR); win = np.hanning(2 * k); win /= win.sum(); duck = np.convolve(duck, win, mode="same")
        mg = 1 - (1 - 10 ** (-duck_db / 20)) * duck
        for c in range(2): self.M[c] *= mg
        n_ir = int(1.8 * SR); ti = np.arange(n_ir) / SR
        irs = [lp(self.noise(n_ir) * np.exp(-ti / 0.45), 5200) for _ in range(2)]; irs = [ir / np.sqrt((ir ** 2).sum()) for ir in irs]
        stem = [self.M[c] + self.X[c] for c in range(2)]
        stem = [stem[c] + 0.2 * fftconvolve(stem[c], irs[c])[:N] for c in range(2)]
        stem = np.stack(stem, axis=1); stem = np.tanh(stem * 1.2) / np.tanh(1.2); stem *= 0.5 / np.max(np.abs(stem))
        os.makedirs(out, exist_ok=True)
        wavfile.write(os.path.join(out, f"{name}_fx.wav"), SR, stem.astype(np.float32))
        v, vsr = sf.read(voice)
        if v.ndim > 1: v = v.mean(1)
        if vsr != SR: v = resample_poly(v, SR, vsr)
        v = np.pad(v, (0, max(0, N - len(v))))[:N]; v = v / (np.max(np.abs(v)) + 1e-9) * 0.9
        mix = stem * 0.55 + np.stack([v, v], axis=1); mix *= 0.95 / np.max(np.abs(mix))
        wavfile.write(os.path.join(out, f"{name}_guide_mix.wav"), SR, mix.astype(np.float32))
        print("ok", name, stem.shape, round(float(np.sqrt((stem ** 2).mean())), 4), round(float(np.sqrt((mix ** 2).mean())), 4))
