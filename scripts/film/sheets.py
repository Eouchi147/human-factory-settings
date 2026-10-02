"""Recording sheets in the narrator's voice: one table per film (line, how to read it), the guide length from the voice reports.
Writes rec_f1.md and rec_f2to6.md (markdown for the Direction doc tabs)."""
import json, os
V = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'voice/guides')
REPO = '/home/claude/human-factory-settings/content/films'
S = {
1: [("Always **tired?** ‖ Before you blame **life**, ‖ check the **three things** you control.", "A real question, then flat."),
    ("One: **short sleep.** ‖ All day, a chemical called **adenosine** builds up in your brain ‖ and makes you **sleepy.**", "Adenosine: a-DEN-o-seen."),
    ("Sleep **clears** it. ‖ Cut sleep **short**, ‖ and you start the day with **yesterday's leftovers.**", "Dry on \"leftovers\"."),
    ("Two: **late coffee.** ‖ Coffee doesn't **clear** that chemical. ‖ It **hides** it, ‖ and then it **eats into** your sleep.", ""),
    ("A coffee at **six p.m.?** ‖ About **half** of it is still in you at **eleven.** ‖ You're not a **light sleeper.** ‖ You're **caffeinated.**", "Deadpan. A full stop before the last two words."),
    ("Three: **late light.** ‖ Bright light at night, ‖ even **room light**, ‖ tells your body clock it's still **day**,", "Keep going into the next line."),
    ("so your sleep signal comes **later.** ‖ Your alarm **doesn't.**", "Flat."),
    ("For a **seven a.m.** alarm: ‖ in bed by **eleven**, ‖ last coffee by **two**, ‖ lights low from **eight.**", "One beat between each setting."),
    ("Still tired after **all that?** ‖ See a **doctor.** ‖ Low **iron** or your **thyroid** can cause it, ‖ and coffee fixes **neither.**", "Warm, then dry on the last words."),
    ("Back to **factory settings.**", "Flat. Almost a shrug.")],
2: [("Trying to fix your **posture?** ‖ You may be fixing the **wrong thing.**", "A real question, then flat."),
    ("One: there's **no perfect posture.** ‖ The textbook straight line comes from a **nineteenth-century** model ‖ of a body standing **still** ‖ without using its **muscles.** ‖ That describes **nobody alive.**", "Slow on the long sentence. Flat on the last one."),
    ("**Forty-one** reviews of the evidence ‖ found **no proof** that posture causes back pain. ‖ **Forty-one.**", "Let \"no proof\" land. Say the number again, quieter."),
    ("Two: your spine is **built to move.** ‖ People with back pain don't have a **different curve.** ‖ They **move less.**", "Three short beats."),
    ("Three: **text neck.** ‖ The famous **sixty pounds** on your neck ‖ came from a **computer model**, ‖ not from **measuring people.**", ""),
    ("When scientists **did** measure people, ‖ more than **seven hundred** of them, ‖ neck angle **didn't predict** neck pain.", "Stress \"did\"."),
    ("So **change position** often. ‖ Get up **once an hour.** ‖ The best posture is the **next one.**", "Light."),
    ("And **train** your neck and upper back. ‖ In trials, exercise moved the head **back** ‖ and **eased** neck pain.", ""),
    ("Back pain with **numbness** or **weakness** in both legs, ‖ or changes in your **bladder?** ‖ That's **not posture.** ‖ Get help **right away.**", "Serious and steady. No humour in the voice here."),
    ("Back to **factory settings.**", "Flat.")],
3: [("**Ten thousand** steps a day. ‖ Who **decided** that?", "A dry question."),
    ("Probably a **Japanese company**, ‖ in **nineteen sixty-five.** ‖ It sold a pedometer whose name meant **ten-thousand-steps meter.** ‖ The scientist who traced it called the name ‖ a **marketing tool.**", "Flat on \"marketing tool\"."),
    ("So scientists **measured.** ‖ **Fifty-seven** studies, ‖ with steps counted by **devices**, ‖ not by **memory.**", ""),
    ("Compared with **two thousand** steps a day, ‖ **seven thousand** went with a **forty-seven percent** lower risk of dying early.", "Don't rush the numbers."),
    ("Dementia, ‖ **thirty-eight** percent lower. ‖ Depression symptoms, ‖ **twenty-two.** ‖ Falls, ‖ **twenty-eight.**", "A beat after each number."),
    ("Above seven thousand, ‖ the extra benefit was **small** for most outcomes.", ""),
    ("In a study of **older women**, ‖ the benefit leveled off around **seven and a half thousand.** ‖ Ten thousand was never the **science.** ‖ It was the **slogan.**", "Flat."),
    ("These studies show a **link**, ‖ not **proof.** ‖ Sick people walk **less**, too.", "Plain and honest."),
    ("So aim for about **seven thousand** a day. ‖ Far below that? ‖ Add **a thousand** at a time.", ""),
    ("Back to **factory settings.**", "Flat.")],
4: [("Doing **crunches** to lose **belly fat?** ‖ You'll get **strong abs.** ‖ Under the **same fat.**", "Deadpan."),
    ("A muscle **doesn't burn** the fat sitting on top of it.", ""),
    ("In a **six-week** trial, ‖ ab exercises alone **didn't shrink** the waist ‖ or the belly fat.", ""),
    ("Across **thirteen** studies ‖ and more than **eleven hundred** people, ‖ training one body part **didn't shrink** the fat in that spot.", "Don't rush the numbers."),
    ("In another, ‖ people trained only **one arm** for twelve weeks. ‖ On the scans, ‖ **no difference** between the two arms. ‖ Spot reduction is a **myth** ‖ with **excellent marketing.**", "Dry."),
    ("What **does** work? ‖ **Strength training.** ‖ In **fifty-eight** studies, it cut body fat, ‖ including the **deep fat** around your organs.", ""),
    ("And to lose fat **anywhere**, ‖ eat and drink a **little less** than you use. ‖ Your body burns its **stored fat.** ‖ It picks **where.** ‖ You **don't.**", "Flat on the last two."),
    ("So lift **twice** a week. ‖ Move at least **a hundred and fifty** minutes a week. ‖ And eat **a little less.**", "One beat between each setting."),
    ("Back to **factory settings.**", "Flat.")],
5: [("How much **protein** do you need? ‖ Less than the **supplement aisle** hopes.", "Dry."),
    ("Europe's food safety experts set it at about **point eight grams** ‖ for every **kilo** you weigh, ‖ each day.", ""),
    ("For someone who weighs **seventy kilos**, ‖ that's about **fifty-eight grams.**", ""),
    ("The new **American** guidelines go higher: ‖ **one point two** to **one point six.**", ""),
    ("If you lift weights, ‖ extra protein **does** help. ‖ **A little.** ‖ In **forty-nine** trials, ‖ it added about **three hundred grams** of lean mass. ‖ Not quite the body on the **label.**", "Flat on the last one."),
    ("And above about **one point six** grams per kilo, ‖ the gains **stopped.**", ""),
    ("**Spread it** over your meals: ‖ **twenty-five to thirty** grams each.", ""),
    ("So: at least **point eight** a day. ‖ Training? ‖ Up to **one point six.** ‖ Past that, you're buying more **protein**, ‖ not more **muscle.**", ""),
    ("**Kidney disease?** ‖ Ask your **doctor** or **dietitian.** ‖ Not a video. ‖ Including **this one.**", "Warm first, dry last."),
    ("Back to **factory settings.**", "Flat.")],
6: [("**Barefoot shoes:** ‖ shoes designed to feel like **no shoes.** ‖ Do they **work?**", "Dry."),
    ("Each foot has **twenty-six bones** ‖ and **three arches.** ‖ Small muscles **inside** the foot help hold them up.", ""),
    ("Like any muscle, ‖ they get **stronger** when they **work.**", ""),
    ("In one trial, ‖ **eight weeks** of walking in flat, flexible shoes ‖ made foot muscles **forty-one percent** stronger.", "Don't rush the numbers."),
    ("Foot **exercises** did even more: ‖ **fifty-eight percent.** ‖ No new shoes **required.**", "Flat on the last one."),
    ("In another, ‖ runners given eight weeks of **foot training** ‖ got **fewer** running injuries over the next year.", ""),
    ("But don't switch **overnight.** ‖ When runners moved to toe shoes over **ten weeks**, ‖ **ten of nineteen** showed bone stress on MRI. ‖ Ten weeks. ‖ Still **too fast.**", "MRI: em-ar-eye."),
    ("The trial that worked built up **slowly:** ‖ **two and a half thousand** steps a day, ‖ then **five thousand**, ‖ then **seven.**", "One beat between each step."),
    ("Feet **painful, stiff, weak or numb?** ‖ See a **doctor**, ‖ not a **shoe shop.**", "Warm, then dry."),
    ("Back to **factory settings.**", "Flat.")],
}
NAMES = {1: '01-tired', 2: '02-posture', 3: '03-steps', 4: '04-belly-fat', 5: '05-protein', 6: '06-barefoot'}
HOW = ("Read each line twice, with about three seconds of silence after each take. Calm and close, like talking to one friend "
       "across a table. Say the fact straight, then the dry line flatter than the fact: don't smile into it, let it land in the pause. "
       "Warning lines stay plain. Bold words carry the weight; a ‖ is a short pause. If a line trips you, just say it again.")
def plain(md): return md.replace('**', '').replace(' ‖ ', ' ').replace('‖', '')
def table(n):
    spec = json.load(open(f'{REPO}/{NAMES[n]}.json')); rep = json.load(open(f'{V}/{NAMES[n]}-report.json'))
    assert len(S[n]) == len(spec['lines']) == len(rep), n
    for (md, _), L in zip(S[n], spec['lines']):
        a, b = plain(md).split(), ' '.join(L['say']).split()
        assert a == b, (n, plain(md), ' '.join(L['say']))
    dur = round(rep[-1]['end'] + 0.3)
    rows = '\n'.join(f'| {i + 1} | {md} | {how} |' for i, (md, how) in enumerate(S[n]))
    return spec, dur, f"| # | Line | How |\n| --- | --- | --- |\n{rows}\n"
spec, dur, t1 = table(1)
f1 = (f"# Film 1 recording sheet\n\nNew narrator voice, 2 Oct. This replaces the earlier sheet. About 10 minutes.\n\n"
      f"## Before you start\n\n1. In the RØDE Central app, set on-board recording to **Manual** (32-bit float, so nothing clips).\n"
      f"2. Small soft room (a closet full of clothes is perfect). Transmitter clipped a hand's width below your chin.\n"
      f"3. Listen to the AI voice guide once: it sets the pace. Then press record, say \"Film one\", read the lines below.\n"
      f"4. Put the file in a Google Drive folder called **HFS voice**, or attach it here. I pick the best takes and fit the film to your timing.\n\n"
      f"{HOW}\n\n## Film 1: {spec['question']}\n\nGuide: {dur} s.\n\n{t1}")
open('rec_f1.md', 'w').write(f1)
parts = [f"# Recording: films 2 to 6\n\nNew narrator voice, 2 Oct. This replaces the earlier sheet. About 40 minutes for all five, in one sitting if you can.\n\n"
         f"## Three steps\n\n1. **Once, before you start.** In the RØDE Central app, set on-board recording to **Manual** (32-bit float, so nothing clips).\n"
         f"2. **Record.** Small soft room, transmitter a hand's width below your chin. One file per film: press record, say the film's number (\"Film two\"), read its lines, then stop.\n"
         f"3. **Send.** Put the files in a Google Drive folder called **HFS voice**, or attach them here. I pick the best takes and fit each film to your timing.\n\n{HOW}\n"]
for n in range(2, 7):
    spec, dur, t = table(n); parts.append(f"\n## Film {n}: {spec['question']}\n\nGuide: {dur} s.\n\n{t}")
open('rec_f2to6.md', 'w').write(''.join(parts))
print('ok', len(f1), sum(len(p) for p in parts))
