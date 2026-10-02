"""Film 2 "How do I fix my posture?": score and sound design, timed to films/film02.js T.
Usage: python3 sound_film02.py <voice guide wav> <voice report json> <out dir>"""
import sys
import numpy as np
from sfx import Mix, SR, note, ss

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=69.6, q0=0.35, q1=2.51, one=4.97, line=7.56, model=10.0, still=12.6, rev=16.53, cut=19.34, two=23.1, curve=25.76, less=29.6,
         three=31.04, sixty=33.65, comp=35.6, people=37.47, flat=42.4, move=45.07, hour=47.42, train=49.74, trials=52.24, back=53.95,
         red=57.48, bladder=61.15, help=63.44, final=65.62, logo=67.55)
m = Mix(T['end'], seed=20261002)

# ---------------------------------------------------------------- the score
# the question, low and open; the textbook line, cold and still; the reviews build; the cut leaves a hole;
# built to move warms into F; text neck goes heavy and cold; the data is light; the hours and the training are bright;
# the red flags drop to a low drone with a heartbeat; the end opens into the series' F major chord
m.pad([38, 50, 57, 62], 0.0, 4.9, 0.8, 900)
m.pad([38, 53, 57, 60, 64], 4.9, 16.4, 0.85, 1100)
m.pad([34, 50, 53, 58, 62], 16.4, T['cut'] + 0.05, 0.9, 1500, rel=0.25)
m.pad([38, 50, 53, 57], T['cut'] + 0.9, 23.0, 0.6, 800)
m.pad([41, 53, 57, 60, 65], 23.0, 30.9, 0.95, 1700)
m.pad([34, 50, 53, 57, 62], 30.9, 37.3, 0.85, 1000)
m.pad([41, 53, 60, 64], 37.3, 44.9, 0.8, 1500)
m.pad([36, 52, 55, 60, 64], 44.9, 49.6, 0.9, 2000)
m.pad([41, 53, 57, 60, 64, 69], 49.6, 57.3, 1.0, 2300)
m.drone(57.2, 65.4, 26, 0.09, 380)
m.pad([38, 50, 53], 57.4, 65.2, 0.5, 600)
m.pad([41, 53, 60, 64, 67, 69], 65.4, T['end'], 1.05, 2600, rel=0.2)

# the reviews: a page lands every 56 ms, the line of them rises, and stops dead at "no proof"
m.tone_line(T['rev'] + 0.1, T['cut'] + 0.02, 62, 0.05, 0.1, glide=lambda t: 12 * ss(T['rev'] + 0.1, T['cut'], t))
for i in range(41): m.tick(T['rev'] + 0.2 + i * 0.056, 0.035 + 0.02 * (i / 40), (i % 7 - 3) / 6, hi=2600, lo=900)
m.rustle(T['rev'] + 0.1, T['cut'], 0.018)
# the cut: the thread lets go, the bob lands on its point, tips over, and the thread settles round it
m.snip(T['cut'] - 0.01, 0.14, -0.2)
tf = (2 * 0.118 / 9.8) ** 0.5
m.clink(T['cut'] + tf, 0.24, -0.15)
m.clink(T['cut'] + tf + 0.3, 0.13, -0.2, f=2350)
m.clink(T['cut'] + tf + 0.39, 0.05, -0.2, f=2350)
m.rustle(T['cut'] + 0.25, T['cut'] + 1.6, 0.03, -0.2)

# built to move: a pulse comes in, and the spine's turns are heard as air
m.pulse(T['two'] + 0.3, T['three'] - 0.4, 84, [53, 60, 65, 60, 57, 60, 64, 60], 0.045, 1500, lvl=lambda t: float(ss(T['two'], T['two'] + 1.5, t)))
for k in range(3): m.swish(T['two'] + 0.95 + k * 2.51, 0.9, 0.04, (-1) ** k * 0.3)
m.bell(T['curve'] + 0.05, 74, 0.035, -0.4, 1.2)                      # the ghost spine
m.tone_line(T['less'], T['less'] + 1.4, 62, 0.03, -0.4, glide=lambda t: -2 * ss(T['less'], T['less'] + 1.2, t))

# text neck: the screen lights, sixty pounds lands, then it is only a model
m.shimmer(T['three'] + 0.35, gain=0.035)
m.thud(T['sixty'], 46, 0.34, 0.0, 0.3)
m.scan(T['comp'] - 0.05, 1.1, 0.045)

# 732 people: they arrive as points of sound; the line through them is one flat tone
m.rain(T['people'], T['people'] + 2.9, 260, 0.03)
m.tone_line(T['flat'] - 0.05, T['flat'] + 1.6, 69, 0.045, 0.0)

# every hour: a tock, a new position
hour = (T['train'] - 0.6 - T['move']) / 8
for k in range(8):
    m.tock(T['move'] + k * hour + 0.02, 0.2 - 0.008 * k, (k % 2 - 0.5) * 0.4)
    m.swish(T['move'] + k * hour + 0.02, 0.32, 0.035, (k % 2 - 0.5) * 0.6, f=1800)
m.bell(T['hour'] + 0.02, 76, 0.03, 0.2, 0.8)

# the training: a stronger pulse; each pull opens like a breath, and the head settles back
m.pulse(T['train'] + 0.2, T['red'] - 0.5, 96, [53, 57, 60, 65, 64, 60, 57, 60], 0.05, 2000, lvl=lambda t: float(ss(T['train'], T['train'] + 1.0, t)))
for k in range(3):
    at = T['train'] + 1.0 + k * 1.95
    m.whoosh(at, 0.85, 250, 1400, 0.05, 0.0)
    m.pluck(at + 0.75, [69, 72, 76][k], 0.04, (k - 1) * 0.3)
m.bell(T['back'] + 0.6, 81, 0.03, 0.1, 1.0)

# red flags: cold and low, a slow heartbeat; the nerves light downwards; the bladder; then a firm, plain bell
for k in range(7): m.heartbeat(T['red'] + 0.2 + k * 1.15, 0.2, 0.0)
m.tone_line(T['red'] + 0.5, T['red'] + 3.2, 86, 0.02, 0.2, glide=lambda t: -14 * ss(T['red'] + 0.5, T['red'] + 3.0, t))
m.bell(T['bladder'] + 0.05, 50, 0.07, 0.0, 0.9, buf='X')
m.bell(T['help'] + 0.02, 57, 0.06, 0.0, 1.1)

# the end: the camera rises over the floor clock, the hand lands on twelve, the series chord
m.whoosh(64.9, 2.9, 180, 2400, 0.07, 0.0)
m.logo_end(T['logo'] - 0.12, T['logo'])
m.room()
m.finish(REPORT, VOICE, OUT, 'film02')
