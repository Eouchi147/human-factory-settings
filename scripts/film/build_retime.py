"""Build the time map that re-times a finished film to a new voice guide.
Each anchor ties one moment of the film's own timeline (its T) to a word: in the old voice and in the new one,
at the same offset from that word. Writes retime/filmNN.json: {"anchors": [[tNew, tOld], ...], "T": {key: tNew}, "end": tNew}.
Usage: python3 build_retime.py 1|2"""
import json, os, sys
from retime import anchors, timemap, inverse
HERE = os.path.dirname(os.path.abspath(__file__)); V = os.path.join(HERE, '../voice')
n = int(sys.argv[1])

def words_from_report(path):
    rep = json.load(open(path)); out = []
    for r in rep: out.append([[w for w in s[3]] for s in r['sents']])
    return out   # [line][sentence][(t, word)]
def W(words, line, sent, word):
    """time of a word: line and sentence are 1-based; word is an index, or a text the word starts with"""
    s = words[line - 1][sent - 1]
    if isinstance(word, int): return s[word][0]
    for t, w in s:
        if w.lower().strip('.,?:;!').startswith(word.lower()): return t
    raise KeyError((line, sent, word))

if n == 2:
    T_old = dict(end=69.6, q0=0.35, q1=2.51, one=4.97, line=7.56, model=10.0, still=12.6, rev=16.53, cut=19.34, two=23.1, curve=25.76, less=29.6,
                 three=31.04, sixty=33.65, comp=35.6, people=37.47, flat=42.4, move=45.07, hour=47.42, train=49.74, trials=52.24, back=53.95,
                 red=57.48, bladder=61.15, help=63.44, final=65.62, logo=67.55)
    old = words_from_report(os.path.join(V, 'guides_v1/02-posture-report.json'))
    new = words_from_report(os.path.join(V, 'guides/02-posture-report.json'))
    # key: (old word, new word) as (line, sentence, word)
    ref = dict(q0=((1, 1, 0), (1, 1, 0)), q1=((1, 2, 0), (1, 2, 0)), one=((2, 1, 0), (2, 1, 0)), line=((2, 2, 0), (2, 2, 0)),
               model=((2, 2, 'nineteenth'), (2, 2, 'nineteenth')), still=((2, 2, 'standing'), (2, 2, 'standing')),
               rev=((3, 1, 0), (3, 1, 0)), cut=((3, 1, 'proof'), (3, 1, 'proof')), two=((4, 1, 0), (4, 1, 0)), curve=((4, 2, 0), (4, 2, 0)),
               less=((4, 3, 'move'), (4, 3, 'move')), three=((5, 1, 0), (5, 1, 0)), sixty=((5, 2, 'sixty'), (5, 2, 'sixty')),
               comp=((5, 2, 'computer'), (5, 2, 'computer')), people=((6, 1, 0), (6, 1, 0)), flat=((6, 1, "didn't"), (6, 1, "didn't")),
               move=((7, 1, 0), (7, 1, 0)), hour=((7, 2, 0), (7, 2, 0)), train=((8, 1, 0), (8, 1, 0)), trials=((8, 2, 0), (8, 2, 0)),
               back=((8, 2, 'moved'), (8, 2, 'moved')), red=((9, 1, 0), (9, 1, 0)), bladder=((9, 1, 'changes'), (9, 1, 'changes')),
               help=((9, 2, 0), (9, 3, 0)), final=((10, 1, 0), (10, 1, 0)), logo=((10, 1, 0), (10, 1, 0)), end=((10, 1, 0), (10, 1, 0)))
    T_new = {k: round(W(new, *ref[k][1]) + (T_old[k] - W(old, *ref[k][0])), 3) for k in ref}
    # keep the line's fall at real speed: one more pair just after it lands
    extra = [(T_new['cut'] + 1.6, T_old['cut'] + 1.6)]
    soft = ['hour']   # the hours run evenly from "So change position" to the training: no anchor in the middle
elif n == 1:
    T_old = dict(end=63, alarm=0.6, portal0=4.5, portal1=6.05, fill0=6.1, fill1=11.5, night=12.35, woke=15.05, drop0=15.9, dropFall=17.3, splash=18.42,
                 hide0=20.2, hide1=23.6, steam0=23.85, six=26.35, eleven=30.95, lamp=33.45, phone=35.05, roomLight=36.5, body=37.7, shift0=40.45,
                 shift1=42.45, dialsUp=44.35, dial1=47.5, dial2=49.5, dial3=51.28, lampOff=52.0, dawn0=52.35, seven=54.45, doctor=54.62,
                 final=59.35, click=60.5, logo=61.15)
    ow = json.load(open(os.path.join(V, 'film1_old_words.json')))   # [line][(t, word)], the old guide said each line in one go
    rep_old = json.load(open(os.path.join(HERE, '../voice/film1/report-am_michael.json'))) if os.path.exists(os.path.join(HERE, '../voice/film1/report-am_michael.json')) else None
    def O(line, word):
        row = ow[line - 1]
        if isinstance(word, int): return row[word][0]
        if word == 'END': return rep_old[line - 1]['end']
        for t, w in row:
            if w.lower().strip('.,?:;!').startswith(word.lower()): return t
        raise KeyError((line, word))
    new = words_from_report(os.path.join(V, 'guides/01-tired-report.json'))
    newrep = json.load(open(os.path.join(V, 'guides/01-tired-report.json')))
    def N(line, sent, word):
        if word == 'END': return newrep[line - 1]['sents'][sent - 1][1]
        return W(new, line, sent, word)
    ref = dict(portal0=((2, 0), (2, 1, 0)), portal1=((2, 'All'), (2, 2, 0)), fill0=((2, 'All'), (2, 2, 0)), fill1=((2, 'END'), (2, 2, 'END')),
               night=((3, 0), (3, 1, 0)), woke=((3, 'Cut'), (3, 2, 0)), drop0=((3, 'and'), (3, 2, 'and')),
               dropFall=((4, 0), (4, 1, 0)), splash=((4, 0), (4, 1, 0)), hide0=((4, 'Coffee'), (4, 2, 0)), hide1=((4, 'It'), (4, 3, 0)),
               steam0=((4, 'cuts'), (4, 3, 'eats')), six=((5, 0), (5, 1, 0)), eleven=((5, '11'), (5, 2, 'eleven')),
               lamp=((6, 0), (6, 1, 0)), phone=((6, 'Bright'), (6, 2, 0)), roomLight=((6, 'room'), (6, 2, 'room')), body=((6, 'tells'), (6, 2, 'tells')),
               shift0=((7, 0), (7, 1, 0)), shift1=((7, 'END'), (7, 1, 'END')), dialsUp=((8, 0), (8, 1, 0)), dial1=((8, '11'), (8, 1, 'eleven')),
               dial2=((8, '2'), (8, 1, 'two')), dial3=((8, '8'), (8, 1, 'eight')), lampOff=((8, 'END'), (8, 1, 'END')),
               dawn0=((9, 0), (9, 1, 0)), seven=((9, 'See'), (9, 2, 0)), doctor=((9, 'See'), (9, 2, 0)),
               final=((10, 0), (10, 1, 0)), click=((10, 0), (10, 1, 0)), logo=((10, 0), (10, 1, 0)), end=((10, 0), (10, 1, 0)))
    T_new = {k: round(N(*ref[k][1]) + (T_old[k] - O(*ref[k][0])), 3) for k in ref}
    T_new['alarm'] = T_old['alarm']
    # the last dial, the lamp and the dawn sit in the pause after "eight": the new pause is shorter, so scale them into it
    o8, n8, o9, n9 = O(8, '8'), N(8, 1, 'eight'), O(9, 0), N(9, 1, 0)
    for k in ('dial3', 'lampOff'): T_new[k] = round(n8 + (T_old[k] - o8) * (n9 - n8) / (o9 - o8), 3)
    T_new['steam0'] = round(N(4, 3, 'eats') + 0.2, 3)   # the steam starts as coffee "eats into your sleep"
    extra = []; soft = ['hide1']
R = anchors({k: v for k, v in T_old.items() if k not in soft}, T_new, extra)
for k in soft: T_new[k] = round(inverse(timemap(R))(T_old[k]), 3)
os.makedirs(os.path.join(HERE, 'retime'), exist_ok=True)
json.dump({'anchors': R, 'T': T_new, 'end': T_new['end']}, open(os.path.join(HERE, f'retime/film{n:02d}.json'), 'w'), indent=0)
f = timemap(R)
print(f'film {n}: end {T_old["end"]} -> {T_new["end"]}')
for k in sorted(T_new, key=lambda k: T_new[k]): print(f'  {k:10s} {T_old[k]:7.2f} -> {T_new[k]:7.2f}')
sl = [(R[i + 1][1] - R[i][1]) / (R[i + 1][0] - R[i][0]) for i in range(len(R) - 1)]
print('  film speed between anchors (1 = as made):', ' '.join(f'{s:.2f}' for s in sl))
