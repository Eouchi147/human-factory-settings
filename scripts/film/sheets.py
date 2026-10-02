"""Recording sheets in the narrator's voice: one table per film (line, how to read it), the guide length from the voice reports.
Writes rec_f1.md, rec_f2to6.md and rec_f7to12.md (markdown for the Direction doc tabs)."""
import json, os, datetime
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
7: [("**Mewing.** ‖ Press your whole tongue **flat** against the roof of your mouth, ‖ and wait for a **sharper jaw.**", "Deadpan: read the promise like an instruction manual."),
    ("It started as one **orthodontist's theory.** ‖ The internet **removed the orthodontist.**", "Flat on the second sentence."),
    ("Proof it reshapes a **face?** ‖ Britain's orthodontists found **no independent studies.**", ""),
    ("America's orthodontists **agree**, ‖ and warn that long-term pressure can **loosen teeth** ‖ and **shift your bite.**", ""),
    ("A normal mouth at rest: ‖ lips **closed**, ‖ breathing through your **nose**, ‖ tongue tip resting behind your **top or bottom** front teeth.", "Slow, like a checklist."),
    ("And your teeth **slightly apart.** ‖ Mewing tells you to **close them.**", "Dry on the last three words."),
    ("Mouth and throat exercises do have a **real use.** ‖ In small trials, ‖ a set programme of them ‖ cut sleep apnoea events in **adults.**", "Apnoea: ap-NEE-a."),
    ("Holding **one tongue position** ‖ is **not** that programme.", "Dry."),
    ("Children who always breathe through their mouth ‖ do tend to have **longer faces.** ‖ A link, ‖ **not proof.**", ""),
    ("If your child snores with **pauses** or **gasps**, ‖ or often breathes through the **mouth**, ‖ see a **doctor.** ‖ Big **tonsils** or **adenoids** are a common cause.", "Plain and warm. No humour here."),
    ("Back to **factory settings.**", "Flat.")],
8: [("Can't fall **asleep?** ‖ Here's what's been **measured.**", "Dry."),
    ("Normal is about **ten to twenty minutes.** ‖ Out within a **minute** can mean you're **short on sleep.** ‖ Not a **talent.**", "Flat on the last three words."),
    ("In studies, ‖ caffeine added about **nine minutes** to falling asleep, ‖ and cut about **forty-five minutes** of sleep.", ""),
    ("For a regular cup, ‖ one review put the cut-off at almost **nine hours** before bed. ‖ The NHS says **six.**", "A beat before the last sentence."),
    ("A warm **bath** or **shower**, ‖ one to two hours before bed, ‖ gets you there **sooner.**", ""),
    ("Trying **hard** backfires ‖ when your head is **busy.** ‖ Students told to fall asleep **fast**, ‖ with **marches** playing, ‖ reported **thirty-four** minutes. ‖ The ones who didn't try: ‖ **twenty-two.**", "Deadpan. A beat before \"twenty-two\"."),
    ("Not asleep after **twenty minutes?** ‖ Get **up.** ‖ Do something **quiet**, ‖ away from **screens.** ‖ Go back when you're **sleepy.**", "Calm, like instructions."),
    ("It's part of **CBT** for insomnia, ‖ the **first-line** treatment. ‖ Across **twenty** trials, ‖ people with insomnia fell asleep about **nineteen minutes** faster.", "CBT: say the three letters."),
    ("Over **thirty minutes**, ‖ **three** nights a week, ‖ for **three months?** ‖ That may be **insomnia.** ‖ See a **doctor.**", "Plain. No humour."),
    ("Back to **factory settings.**", "Flat.")],
9: [("Breathe **in**, ‖ and your heart speeds up a **little.** ‖ Breathe **out**, ‖ and it **slows.**", "Slow. Let the listener feel it."),
    ("You already **sigh** every few minutes without noticing: ‖ a **second breath** on top of the first, ‖ to reopen tiny **air sacs** that fold shut.", ""),
    ("In a **Stanford** trial, ‖ a **hundred and eight** people, ‖ mostly students, ‖ were given **five minutes** a day of breathing or meditation, ‖ for a **month.**", ""),
    ("Sighing **on purpose**, ‖ **two** breaths in, ‖ **one long** breath out, ‖ lifted good mood **more** than meditation did.", "Slow on the instruction."),
    ("Feeling anxious dropped **just as much** with meditation. ‖ And the trial had no **do-nothing** group.", "Dry on the last words."),
    ("Across **twelve** trials, ‖ breathing exercises cut stress by a **small to medium** amount. ‖ **Useful.** ‖ Not **magic.**", ""),
    ("Longer **out-breaths?** ‖ In a **twelve-week** trial, ‖ they were **not clearly better** than equal breaths.", ""),
    ("Skip **hard, fast** breathing drills. ‖ They drop your **carbon dioxide** ‖ and can make you **dizzy.** ‖ **Never** do them in or near **water.**", "Plain on the last sentence."),
    ("Struggling to **cope** with stress, ‖ or nothing you try is **helping?** ‖ See a **doctor.**", "Plain and warm."),
    ("Back to **factory settings.**", "Flat.")],
10: [("**Foam rolling.** ‖ Lie on a **tube**, ‖ **wince**, ‖ and believe you're breaking up your **fascia.**", "Deadpan. Fascia: FASH-ee-a."),
    ("Fascia is **real:** ‖ tough **collagen** wrapped around **every muscle.**", ""),
    ("To squash the thick kind by just **one percent**, ‖ one model says you'd need about **nine hundred and twenty-five kilos.** ‖ Lying on a roller doesn't **come close.**", "Flat on the last sentence."),
    ("So what does rolling **do?** ‖ Before exercise, ‖ about **four percent** more flexibility.", ""),
    ("No better than **stretching.** ‖ And in one trial, ‖ the extra range was **gone** within **thirty minutes.**", ""),
    ("After exercise, ‖ it eases soreness **a little.**", ""),
    ("One likely reason: ‖ your **nerves** turn down **pain** and **tension** for a while. ‖ The release is mostly **in the name.**", "Dry on the last sentence."),
    ("Flushing out **lactic acid?** ‖ In one lab test, ‖ sports massage actually **slowed** its clearing.", ""),
    ("Use it as a **warm-up**, ‖ not a **repair kit.**", ""),
    ("Muscle pain that won't settle with **rest?** ‖ See a **doctor**, ‖ not a **foam roller.**", "Plain, then dry on the last three words."),
    ("Back to **factory settings.**", "Flat.")],
11: [("**Creatine.** ‖ Not a **steroid.** ‖ Your body makes about a **gram** of it a day.", "Creatine: KREE-a-teen."),
    ("About **ninety-five percent** sits in your **muscles**, ‖ where it refuels **short, hard** efforts.", ""),
    ("Supplements top up that store ‖ by **twenty to forty percent.**", ""),
    ("In trials, ‖ lifting while taking it ‖ added a little over **a kilo** more lean mass ‖ than lifting **alone.**", ""),
    ("Take it **without** exercising: ‖ **zero point zero three** kilos. ‖ It doesn't do the **workout** for you.", "Deadpan."),
    ("In the first weeks, ‖ the scale can go up **one to two kilos.** ‖ Mostly **water.**", ""),
    ("For memory, ‖ a **small** gain in trials. ‖ **No proof** it prevents or treats dementia.", ""),
    ("The hair loss scare is **one study** ‖ of **twenty rugby players** ‖ that never **measured hair.** ‖ A **twelve-week** trial that **did** ‖ found **no difference.**", "Stress \"did\"."),
    ("**Gummies?** ‖ In two lab tests, ‖ close to **half** the brands ‖ had almost **no creatine** in them.", "Dry."),
    ("It can raise **creatinine** on blood tests, ‖ so tell your **doctor** you take it. ‖ **Kidney** problems, ‖ **diabetes** ‖ or high blood **pressure?** ‖ Ask your doctor **first.**", "Creatinine: kree-AT-i-neen. Plain."),
    ("Back to **factory settings.**", "Flat.")],
12: [("People now **tape their mouths shut** at night. ‖ On **purpose.**", "Deadpan."),
    ("In three yearly **US** polls, ‖ **five to twelve percent** of adults ‖ said they'd **tried it.**", "US: say the two letters."),
    ("The **promise:** ‖ better sleep, ‖ less snoring, ‖ even a **sharper jaw.**", ""),
    ("A twenty twenty-five review found **ten** studies, ‖ **two hundred and thirteen** people in total.", ""),
    ("**Two** showed the main sleep apnoea score **improving.** ‖ Both in **mild** cases. ‖ **Neither** had a comparison group.", ""),
    ("The authors' verdict: ‖ the data **don't support it** as a treatment.", ""),
    ("Your **nose** is the better airway in sleep. ‖ But people breathe through the mouth **for a reason**, ‖ often a **blocked nose.**", ""),
    ("Tape your mouth over a **blocked nose**, ‖ and you've shut your **only other way** to breathe.", "Plain. No humour."),
    ("**Jawline?** ‖ **No** scientific evidence.", "Dry."),
    ("Snoring with **pauses**, ‖ **gasping** in your sleep, ‖ **tired** all day, ‖ or a nose that's often **blocked?** ‖ **Don't tape.** ‖ See a **doctor.**", "Plain. No humour."),
    ("Back to **factory settings.**", "Flat.")],
}
NAMES = {1: '01-tired', 2: '02-posture', 3: '03-steps', 4: '04-belly-fat', 5: '05-protein', 6: '06-barefoot',
         7: '07-mewing', 8: '08-fall-asleep', 9: '09-breath', 10: '10-foam-rolling', 11: '11-creatine', 12: '12-mouth-taping'}
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
if all(os.path.exists(f'{V}/{NAMES[n]}-report.json') for n in range(7, 13)):
    parts = [f"# Recording: films 7 to 12\n\nBatch 2, written 2 Oct. Record by 30 October. About 45 minutes for all six, in one sitting if you can.\n\n"
             f"## Three steps\n\n1. **Once, before you start.** In the RØDE Central app, check on-board recording is still **Manual** (32-bit float).\n"
             f"2. **Record.** Small soft room, transmitter a hand's width below your chin. One file per film: press record, say the film's number (\"Film seven\"), read its lines, then stop.\n"
             f"3. **Send.** Put the files in the **HFS voice** folder on Google Drive, or attach them here. I pick the best takes and fit each film to your timing.\n\n{HOW}\n"]
    for n in range(7, 13):
        spec, dur, t = table(n); d = datetime.date.fromisoformat(spec['posts'])
        parts.append(f"\n## Film {n}: {spec['question']}\n\nPosts {d.strftime('%A')} {d.day} {d.strftime('%B')}. Guide: {dur} s.\n\n{t}")
    open('rec_f7to12.md', 'w').write(''.join(parts))
    print('batch 2 sheet ok', sum(len(p) for p in parts))
