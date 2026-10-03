"""Batch 2 scripts (films 7 to 12), written from the verified fact sheets. Every number is copied from an opened source. Run: python3 scripts_7to12.py (writes content/films/07..12 JSON and checks every source is used)."""
import json, os, re
OUT = '/home/claude/human-factory-settings/content/films'
F = {}

F[7] = dict(n=7, slug='mewing', question='Does mewing work?', area='posture-looks', page='/posture-looks/does-mewing-work', posts='2026-11-03',
lines=[
 dict(say=['Mewing.', 'Press your whole tongue flat against the roof of your mouth, and wait for a sharper jaw.'], src=['cleveland2025'], gap=0.8),
 dict(say=["It started as one orthodontist's theory.", 'The internet removed the orthodontist.'], src=['gdpuk2025']),
 dict(say=['Proof it reshapes a face?', "Britain's orthodontists found no independent studies."], src=['bos2024']),
 dict(say=["America's orthodontists agree, and warn that long-term pressure can loosen teeth and shift your bite."], src=['aao2024']),
 dict(say=['A normal mouth at rest: lips closed, breathing through your nose, tongue tip resting behind your top or bottom front teeth.'], src=['asha']),
 dict(say=['And your teeth slightly apart.', 'Mewing tells you to close them.'], src=['asha', 'nhstmd', 'cleveland2025']),
 dict(say=['Mouth and throat exercises do have a real use.', 'In small trials, a set programme of them cut sleep apnoea events in adults.'], src=['cochrane2020', 'saba2024']),
 dict(say=['Holding one tongue position is not that programme.'], src=['cochrane2020', 'cleveland2025']),
 dict(say=['Children who always breathe through their mouth do tend to have longer faces.', 'A link, not proof.'], src=['zheng2020', 'zhao2021']),
 dict(say=['If your child snores with pauses or gasps, or often breathes through the mouth, see a doctor.', 'Big tonsils or adenoids are a common cause.'], src=['nhskids', 'ccmouth'], gap=1.0),
 dict(say=['Back to factory settings.']),
],
sources={
 'cleveland2025': ['Cleveland Clinic, "What is mewing?", 28 Jan 2025 (Colleen Clayton, MD): the online instructions: "Place the tip of your tongue on the roof of your mouth, just behind your teeth... Close your lips and lightly close your teeth. Flatten your tongue against the roof of your mouth... Hold the position for 20 seconds"', 'https://health.clevelandclinic.org/what-is-mewing'],
 'gdpuk2025': ['GDPUK obituary of John Mew, 17 Aug 2025: orthotropics, his theory that most malocclusion is environmentally driven; "Simplified and popularised online, particularly by his son, Mike Mew, the concept of “mewing” reached a global lay audience, albeit often stripped of its clinical framework"', 'https://www.gdpuk.com/news/latest-news/5056-john-mew-1928-2025-orthodontist-and-controversial-figure-in-british-dentistry'],
 'bos2024': ['British Orthodontic Society, statement of 26 Jan 2024, on changing the shape of the face by holding the teeth and tongue: "There are no independent studies or scientific evidence to support this claim."', 'https://bos.org.uk/news/claims-about-orthodontics/'],
 'aao2024': ['American Association of Orthodontists, press release 22 Jan 2024: "There’s no scientific evidence to support its claims of reshaping the jawline"; "Chronic pressure from mewing can loosen teeth, misalign bite, and contribute to tooth wear and tear."', 'https://aaoinfo.org/wp-content/uploads/2025/01/Risks-of-Mewing.pdf'],
 'asha': ['ASHA Practice Portal, orofacial myofunctional disorders: "The typical oral resting posture consists of the lips closed; nasal breathing; the teeth slightly apart; and the tongue tip resting against the anterior hard palate, at the lower incisors, or overlying gingiva." Treated by trained speech-language pathologists in a team with dentists, orthodontists and ENT doctors', 'https://www.asha.org/practice-portal/clinical-topics/orofacial-myofunctional-disorders/'],
 'nhstmd': ['NHS, Temporomandibular disorder: "apart from when eating, your teeth should be apart"', 'https://www.nhs.uk/conditions/temporomandibular-disorder-tmd/'],
 'cochrane2020': ['Rueda JR et al. Myofunctional therapy (oropharyngeal exercises) for obstructive sleep apnoea. Cochrane Database Syst Rev 2020;CD013449.pub2: 9 RCTs, 347 participants; vs sham, AHI mean difference -13.20 events/h (95% CI -18.48 to -7.93; 2 studies, 82 participants; low-certainty evidence)', 'https://merit.url.edu/en/publications/myofunctional-therapy-oropharyngeal-exercises-for-obstructive-sle-8/'],
 'saba2024': ['Saba ES et al. Orofacial myofunctional therapy for obstructive sleep apnea: a systematic review and meta-analysis. Laryngoscope 2024;134(1):480-495: 7 RCTs, 310 patients; adults AHI MD -10.2 (95% CI -15.6 to -4.8); limited benefit in children due to poor compliance', 'https://researchdiscovery.drexel.edu/esploro/outputs/journalArticle/Orofacial-Myofunctional-Therapy-for-Obstructive-Sleep/991022202115404721'],
 'zheng2020': ['Zheng W et al. Facial morphological characteristics of mouth breathers vs nasal breathers: systematic review and meta-analysis. Exp Ther Med 2020;19:3738-3750: longer anterior face height in mouth-breathing children; cross-sectional studies only ("Long-term longitudinal studies are required")', 'https://spandidos-publications.com/10.3892/etm.2020.8611'],
 'zhao2021': ['Zhao Z et al. Effects of mouth breathing on facial skeletal development in children: systematic review and meta-analysis. BMC Oral Health 2021;21:108: 10 studies, 1,358 children; all retrospective', 'https://link.springer.com/article/10.1186/s12903-021-01458-7'],
 'nhskids': ['NHS Healthier Together, obstructive sleep apnoea in children: most common causes "Large tonsils at the back of the throat" and "Large adenoids at the back of the nose"; signs include "Breathing through the mouth"; "You should see your GP if you think your child might have OSA."', 'https://www.healthiertogether.nhs.uk/child-under-12-years/obstructive-sleep-apnoea-osa'],
 'ccmouth': ['Cleveland Clinic, Mouth breathing: "Children who mouth breathe may have swollen or infected adenoids or tonsils that block their airways."', 'https://my.clevelandclinic.org/health/diseases/22734-mouth-breathing'],
})

F[8] = dict(n=8, slug='fall-asleep', question='How can I fall asleep faster?', area='sleep-energy', page='/sleep-energy/how-to-fall-asleep-faster', posts='2026-11-05',
lines=[
 dict(say=["Can't fall asleep?", "Here's what's been measured."], gap=0.8),
 dict(say=['Normal is about ten to twenty minutes.', "Out within a minute can mean you're short on sleep. Not a talent."], src=['ccdrerup']),
 dict(say=['In studies, caffeine added about nine minutes to falling asleep, and cut about forty-five minutes of sleep.'], src=['gardiner2023']),
 dict(say=['For a regular cup, one review put the cut-off at almost nine hours before bed.', 'The NHS says six.'], src=['gardiner2023', 'nhsinsomnia']),
 dict(say=['A warm bath or shower, one to two hours before bed, gets you there sooner.'], src=['haghayegh2019']),
 dict(say=['Trying hard backfires when your head is busy.', "Students told to fall asleep fast, with marches playing, reported thirty-four minutes. The ones who didn't try: twenty-two."], src=['ansfield1996']),
 dict(say=['Not asleep after twenty minutes?', "Get up. Do something quiet, away from screens. Go back when you're sleepy."], src=['aasmhabits']),
 dict(say=["It's part of CBT for insomnia, the first-line treatment.", 'Across twenty trials, people with insomnia fell asleep about nineteen minutes faster.'], src=['trauer2015', 'aasm2021']),
 dict(say=['Over thirty minutes, three nights a week, for three months?', 'That may be insomnia. See a doctor.'], src=['aasminsomnia', 'nhsinsomnia'], gap=1.0),
 dict(say=['Back to factory settings.']),
],
sources={
 'ccdrerup': ['Cleveland Clinic newsroom, 22 Jun 2026, sleep psychologist Michelle Drerup, PsyD: "Generally, it should take someone about 10 to 20 minutes to fall asleep." "if you’re falling asleep within a minute, it may suggest sleep deprivation or an underlying sleep issue."', 'https://newsroom.clevelandclinic.org/2026/06/22/how-long-should-it-take-you-to-fall-asleep'],
 'gardiner2023': ['Gardiner C et al. The effect of caffeine on subsequent sleep: a systematic review and meta-analysis. Sleep Med Rev 2023;69:101764: 24 studies; sleep onset latency +9.1 min (95% CI 3.8 to 14.4); total sleep time -45.3 min (95% CI 29.0 to 61.5); "coffee (107 mg per 250 mL) should be consumed at least 8.8 h prior to bedtime"', 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:10.1016/j.smrv.2023.101764&format=json&resultType=core'],
 'haghayegh2019': ['Haghayegh S et al. Before-bedtime passive body heating by warm shower or bath to improve sleep: a systematic review and meta-analysis. Sleep Med Rev 2019;46:124-135: 17 studies; water at 40 to 42.5 °C, "scheduled 1-2 h before bedtime for little as 10 min", significantly shortened sleep onset latency', 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:10.1016/j.smrv.2019.04.008&format=json&resultType=core'],
 'ansfield1996': ['Ansfield ME, Wegner DM, Bowser R. Ironic effects of sleep urgency. Behav Res Ther 1996;34(7):523-531: normal sleepers under high mental load (John Philip Sousa marches) who tried to fall asleep quickly took 34.40 min vs 21.80 min for those not trying; under low load, trying worked (15.55 vs 29.28 min); self-reported latency', 'https://dtg.sites.fas.harvard.edu/DANWEGNER/pub/Ansfield,%20Wegner,%20&%20Bowser%201996.pdf'],
 'aasmhabits': ['American Academy of Sleep Medicine, Healthy Sleep Habits (Aug 2020): "If you don’t fall asleep after 20 minutes, get out of bed. Go do a quiet activity without a lot of light exposure. It is especially important to not get on electronics." "Don’t go to bed unless you are sleepy."', 'https://sleepeducation.org/healthy-sleep/healthy-sleep-habits/'],
 'trauer2015': ['Trauer JM et al. Cognitive behavioral therapy for chronic insomnia: a systematic review and meta-analysis. Ann Intern Med 2015;163(3):191-204: 20 studies, 1,162 participants with chronic insomnia; sleep onset latency improved by 19.03 min (95% CI 14.12 to 23.93)', 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:10.7326/M14-2841&format=json&resultType=core'],
 'aasm2021': ['Edinger JD et al. Behavioral and psychological treatments for chronic insomnia disorder in adults: an AASM clinical practice guideline. J Clin Sleep Med 2021;17(2):255-262: CBT-I recommended (STRONG); CBT-I includes "stimulus control instructions and sleep restriction therapy"; stimulus control includes "get out of bed when unable to sleep"', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7853203/'],
 'aasminsomnia': ['AASM Sleep Education, Insomnia: chronic insomnia "occurs at least three times per week and lasts for at least three months"; screening question "Does it take you more than 30 minutes to fall asleep..."', 'https://sleepeducation.org/sleep-disorders/insomnia/'],
 'nhsinsomnia': ['NHS, Insomnia (reviewed 19 Mar 2024): "See a GP if: changing your sleeping habits has not helped your insomnia; you’ve had trouble sleeping for months; your insomnia is affecting your daily life in a way that makes it hard for you to cope"', 'https://www.nhs.uk/conditions/insomnia/'],
})

F[9] = dict(n=9, slug='breath', question='The breath that calms you down', area='stress-mood', page='/stress-mood/breathing-to-calm-down', posts='2026-11-07',
lines=[
 dict(say=['Breathe in, and your heart speeds up a little.', 'Breathe out, and it slows.'], src=['lehrer2014', 'balban2023'], gap=0.8),
 dict(say=['You already sigh every few minutes without noticing:', 'a second breath on top of the first, to reopen tiny air sacs that fold shut.'], src=['li2016', 'severs2022', 'ucla2016']),
 dict(say=['In a Stanford trial, a hundred and eight people, mostly students, were given five minutes a day of breathing or meditation, for a month.'], src=['balban2023']),
 dict(say=['Sighing on purpose, two breaths in, one long breath out, lifted good mood more than meditation did.'], src=['balban2023']),
 dict(say=['Feeling anxious dropped just as much with meditation.', 'And the trial had no do-nothing group.'], src=['balban2023']),
 dict(say=['Across twelve trials, breathing exercises cut stress by a small to medium amount.', 'Useful. Not magic.'], src=['fincham2023']),
 dict(say=['Longer out-breaths?', 'In a twelve-week trial, they were not clearly better than equal breaths.'], src=['birdee2023']),
 dict(say=['Skip hard, fast breathing drills.', 'They drop your carbon dioxide and can make you dizzy. Never do them in or near water.'], src=['medlinehv', 'cdc2015']),
 dict(say=['Struggling to cope with stress, or nothing you try is helping?', 'See a doctor.'], src=['nhsstress'], gap=1.0),
 dict(say=['Back to factory settings.']),
],
screen=[
 dict(show='The end dial: at rest, 12 to 18 breaths a minute', src=['ccvitals']),
],
sources={
 'ccvitals': ['Cleveland Clinic, Vital signs: "The normal respiratory rate for an adult at rest is 12 to 18 breaths per minute."', 'https://my.clevelandclinic.org/health/articles/10881-vital-signs'],
 'lehrer2014': ['Lehrer PM, Gevirtz R. Heart rate variability biofeedback: how and why does it work? Front Psychol 2014;5:756: "RSA is the heart pattern that occurs when heart rate increases during inhalation and decreases during exhalation."', 'https://www.frontiersin.org/articles/10.3389/fpsyg.2014.00756/full'],
 'balban2023': ['Balban MY et al. Brief structured respiration practices enhance mood and reduce physiological arousal. Cell Rep Med 2023;4(1):100895: remote randomised trial, 108 participants (mostly Stanford undergraduates), 5 min a day for a month; cyclic sighing raised positive affect significantly more than mindfulness meditation; no differences in state anxiety or negative affect between groups; no non-practice control; "Inhales increase heart rate and exhales decrease heart rate via respiratory sinus arrhythmia"', 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC9873947/fullTextXML'],
 'li2016': ['Li P et al. The peptidergic control circuit for sighing. Nature 2016;530:293-297: "Sighs also occur spontaneously every few minutes to reinflate alveoli"', 'https://www.nature.com/articles/nature16964'],
 'severs2022': ['Severs LJ, Vlemincx E, Ramirez JM. The psychophysiology of the sigh: I. Biol Psychol 2022;170:108313: sighs "play a critical role in controlling lung compliance by preventing the collapse of alveoli"', 'https://research.vu.nl/en/publications/the-psychophysiology-of-the-sigh-i-the-sigh-from-the-physiologica/'],
 'ucla2016': ['UCLA Health news release, 8 Feb 2016, Jack Feldman: "It starts out as a normal breath, but before you exhale, you take a second breath on top of it." (press release)', 'https://www.uclahealth.org/news/release/ucla-and-stanford-researchers-pinpoint-origin-of-sighing-reflex-in-the-brain'],
 'fincham2023': ['Fincham GW et al. Effect of breathwork on stress and mental health: a meta-analysis of randomised-controlled trials. Sci Rep 2023;13:432: 12 RCTs, 785 adults; self-reported stress g = -0.35 (95% CI -0.55 to -0.14), "small-to-medium"; the authors warn against "a miscalibration between hype and evidence"', 'https://www.nature.com/articles/s41598-022-27247-y'],
 'birdee2023': ['Birdee G et al. Slow breathing for reducing stress: the effect of extending exhale. Complement Ther Med 2023;73:102937: randomised, 100 healthy adults, 12 weeks; "breath ratios do not have a significant differential effect on stress reduction among healthy adults"', 'https://qigonginstitute.org/abstract-print/18181'],
 'medlinehv': ['MedlinePlus, Hyperventilation: "Excessive breathing creates a low level of carbon dioxide in your blood. This causes many of the symptoms of hyperventilation", including "Feeling lightheaded, dizzy"', 'https://medlineplus.gov/ency/article/003071.htm'],
 'cdc2015': ['Boyd C et al. Fatal and nonfatal drowning outcomes related to dangerous underwater breath-holding behaviors, New York State, 1988-2011. MMWR 2015;64(19): hyperventilation or breath-holding before swimming can cause loss of consciousness underwater', 'https://www.cdc.gov/mmwr/preview/mmwrhtml/mm6419a3.htm'],
 'nhsstress': ['NHS, Stress (reviewed 6 Mar 2026): "See a GP if: you’re struggling to cope with stress; things you’re trying yourself are not helping"', 'https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/stress/'],
})

F[10] = dict(n=10, slug='foam-rolling', question='Does foam rolling work?', area='posture-looks', page='/posture-looks/what-is-fascia', posts='2026-11-10',
lines=[
 dict(say=['Foam rolling.', "Lie on a tube, wince, and believe you're breaking up your fascia."], gap=0.8),
 dict(say=['Fascia is real: tough collagen wrapped around every muscle.'], src=['frs', 'openstax']),
 dict(say=["To squash the thick kind by just one percent, one model says you'd need about nine hundred and twenty-five kilos.", "Lying on a roller doesn't come close."], src=['chaudhry2008']),
 dict(say=['So what does rolling do?', 'Before exercise, about four percent more flexibility.'], src=['wiewelhove2019']),
 dict(say=['No better than stretching.', 'And in one trial, the extra range was gone within thirty minutes.'], src=['wilke2020', 'nakamura2021']),
 dict(say=['After exercise, it eases soreness a little.'], src=['wiewelhove2019']),
 dict(say=['One likely reason: your nerves turn down pain and tension for a while.', 'The release is mostly in the name.'], src=['behm2019']),
 dict(say=['Flushing out lactic acid?', 'In one lab test, sports massage actually slowed its clearing.'], src=['wiltshire2010']),
 dict(say=['Use it as a warm-up, not a repair kit.'], src=['wiewelhove2019']),
 dict(say=["Muscle pain that won't settle with rest?", 'See a doctor, not a foam roller.'], src=['mayomps'], gap=1.0),
 dict(say=['Back to factory settings.']),
],
sources={
 'frs': ['Fascia Research Society, fascia nomenclature: "The fascial system consists of the three-dimensional continuum of soft, collagen containing, loose and dense fibrous connective tissues that permeate the body."', 'https://fasciaresearchsociety.org/science-research/fascia-nomenclature'],
 'openstax': ['OpenStax Anatomy and Physiology 2e, 10.2: "Each muscle is wrapped in a sheath of dense, irregular connective tissue called the epimysium"', 'https://openstax.org/books/anatomy-and-physiology-2e/pages/10-2-skeletal-muscle'],
 'chaudhry2008': ['Chaudhry H et al. Three-dimensional mathematical model for deformation of human fasciae in manual therapy. J Am Osteopath Assoc 2008;108(8):379-390: fascia lata "a predicted normal load of 9075 N (925 kg) and a tangential force of 4515 N (460 kg) are needed to produce even 1% compression and 1% shear" (a mathematical model)', 'https://www.degruyterbrill.com/document/doi/10.7556/jaoa.2008.108.8.379/html'],
 'wiewelhove2019': ['Wiewelhove T et al. A meta-analysis of the effects of foam rolling on performance and recovery. Front Physiol 2019;10:376: 21 studies; before exercise flexibility +4.0% (g = 0.34); after exercise muscle pain perception reduced +6.0% (g = 0.47); effects "rather minor and partly negligible"; supports "foam rolling as a warm-up activity rather than a recovery tool"', 'https://www.frontiersin.org/articles/10.3389/fphys.2019.00376/full'],
 'wilke2020': ['Wilke J et al. Acute effects of foam rolling on range of motion in healthy adults: a systematic review with multilevel meta-analysis. Sports Med 2020;50:387-402: 26 trials; vs stretching SMD -0.02 (CI -0.73 to 0.69), no difference', 'https://link.springer.com/article/10.1007/s40279-019-01205-7'],
 'nakamura2021': ['Nakamura M et al. J Sports Sci Med 2021;20:62-68: 45 participants; ankle range rose after 3 or 10 rounds of 30 s rolling and "returned to baseline value after 30 minutes"', 'https://jssm.org/jssm-20-62.xml-Fulltext'],
 'behm2019': ['Behm DG, Wilke J. Do self-myofascial release devices release myofascia? Rolling mechanisms: a narrative review. Sports Med 2019;49(8):1173-1181: "insufficient evidence to support that the primary mechanisms underlying rolling and other similar devices are the release of myofascial restrictions and thus the term ‘self-myofascial release’ devices is misleading"; proposed mechanisms include global pain modulation and reflex reductions in muscle tone; "Rolling mechanisms underlying their effect on pain suppression are not well elucidated."', 'https://www.bisp-surf.de/Record/PU202002000917'],
 'wiltshire2010': ['Wiltshire EV et al. Massage impairs postexercise muscle blood flow and "lactic acid" removal. Med Sci Sports Exerc 2010;42:1062-1071: 12 subjects, sports massage of the forearm after 2 min of strenuous handgrip exercise; "Massage impairs La(-) and H+ removal from muscle after strenuous exercise by mechanically impeding blood flow"', 'https://api.openalex.org/works/doi:10.1249/MSS.0b013e3181c9214f'],
 'mayomps': ['Mayo Clinic, Myofascial pain syndrome (5 Jan 2024): "if your muscle pain doesn’t go away with rest, massage and other self-care measures, make an appointment with your healthcare professional"', 'https://www.mayoclinic.org/diseases-conditions/myofascial-pain-syndrome/symptoms-causes/syc-20375444'],
})

F[11] = dict(n=11, slug='creatine', question='What does creatine do?', area='fitness-strength', page='/fitness-strength/what-does-creatine-do', posts='2026-11-12',
lines=[
 dict(say=['Creatine.', 'Not a steroid. Your body makes about a gram of it a day.'], src=['antonio2021', 'odsconsumer'], gap=0.6),
 dict(say=['About ninety-five percent sits in your muscles, where it refuels short, hard efforts.'], src=['issn2017', 'ioc2018']),
 dict(say=['Supplements top up that store by twenty to forty percent.'], src=['issn2017']),
 dict(say=['In trials, lifting while taking it added a little over a kilo more lean mass than lifting alone.'], src=['delpino2022', 'chilibeck2017']),
 dict(say=['Take it without exercising: zero point zero three kilos.', "It doesn't do the workout for you."], src=['delpino2022']),
 dict(say=['In the first weeks, the scale can go up one to two kilos. Mostly water.'], src=['ioc2018', 'odshp']),
 dict(say=['For memory, a small gain in trials.', 'No proof it prevents or treats dementia.'], src=['prokopidis2023', 'xu2024', 'smith2025']),
 dict(say=['The hair loss scare is one study of twenty rugby players that never measured hair.', 'A twelve-week trial that did found no difference.'], src=['vandermerwe2009', 'lak2025']),
 dict(say=['Gummies?', 'In two lab tests, close to half the brands had almost no creatine in them.'], src=['gummies2025', 'gummies2024']),
 dict(say=['It can raise creatinine on blood tests, so tell your doctor you take it.', 'Kidney problems, diabetes or high blood pressure? Ask your doctor first.'], src=['akf2026', 'royaldevon2025', 'antonio2021'], gap=1.0),
 dict(say=['Back to factory settings.']),
],
sources={
 'antonio2021': ['Antonio J et al. Common questions and misconceptions about creatine supplementation. J Int Soc Sports Nutr 2021;18:13: "because creatine has a completely different chemical structure, it is not an anabolic steroid"; in one review of studies, 12 showed no rise in serum creatinine, 8 a rise within the normal range, 2 a rise above normal limits', 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC7871530/fullTextXML'],
 'odsconsumer': ['NIH Office of Dietary Supplements, Dietary Supplements for Exercise and Athletic Performance (consumer): "Your body produces some creatine (about 1 gram a day)"; "In studies, people often took a loading dose of about 20 grams per day of creatine (in four equal portions) for 5 to 7 days and then 3 to 5 grams a day."', 'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-Consumer/'],
 'issn2017': ['Kreider RB et al. ISSN position stand: safety and efficacy of creatine supplementation. J Int Soc Sports Nutr 2017;14:18: skeletal muscle holds about 95%; supplementation increases "muscle creatine and PCr by 20-40%"; phosphocreatine "can be used as a buffer to resynthesize ATP"', 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC5469049/fullTextXML'],
 'ioc2018': ['Maughan RJ et al. IOC consensus statement: dietary supplements and the high-performance athlete. Br J Sports Med 2018;52:439-455: effects "most pronounced... during tasks <30 s"; "A potential 1-2 kg BM increase after creatine loading (primarily as a result of water retention)"', 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC5867441/fullTextXML'],
 'odshp': ['NIH ODS (health professional): typical protocol "a loading phase for 5-7 days... followed by a maintenance phase of 3-5 g/day"; creatine with strength training "can lead to a 1-2 kg increase in total body weight in a month"', 'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/'],
 'delpino2022': ['Delpino F et al. Influence of age, sex, and type of exercise on the efficacy of creatine supplementation on lean body mass. Nutrition 2022;103-104:111791: 35 studies, 1,192 participants; with resistance training MD 1.10 kg (95% CI 0.56 to 1.65); without exercise MD 0.03 kg (95% CI -0.65 to 0.70)', 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:10.1016/j.nut.2022.111791&format=json&resultType=core'],
 'chilibeck2017': ['Chilibeck PD et al. Effect of creatine supplementation during resistance training on lean tissue mass and muscular strength in older adults: a meta-analysis. Open Access J Sports Med 2017;8:213-226: 22 studies, 721 participants; lean tissue +1.37 kg (95% CI 0.97 to 1.76)', 'https://www.dovepress.com/effect-of-creatine-supplementation-during-resistance-training-on-lean--peer-reviewed-fulltext-article-OAJSM'],
 'prokopidis2023': ['Prokopidis K et al. Effects of creatine supplementation on memory in healthy individuals: systematic review and meta-analysis of RCTs. Nutr Rev 2023;81(4):416-427: memory SMD 0.29 (95% CI 0.04 to 0.53); "The findings presented here should be interpreted with caution."', 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC9999677/fullTextXML'],
 'xu2024': ['Xu C et al. The effects of creatine supplementation on cognitive function in adults. Front Nutr 2024;11:1424972: 16 RCTs, 492 participants; memory SMD 0.31 (95% CI 0.18 to 0.44), moderate certainty; no effect on overall cognitive function', 'https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2024.1424972/full'],
 'smith2025': ['Smith AN et al. Creatine monohydrate pilot in Alzheimer’s. Alzheimers Dement (N Y) 2025;11(2):e70101: "there is currently no clinical evidence demonstrating the effects of CrM in patients with AD"; single-arm pilot of 20 patients', 'https://api.crossref.org/works/10.1002/trc2.70101'],
 'vandermerwe2009': ['van der Merwe J et al. Three weeks of creatine monohydrate supplementation affects dihydrotestosterone to testosterone ratio in college-aged rugby players. Clin J Sport Med 2009;19(5):399-404: n = 20; DHT rose 56% after loading; hair was not measured', 'https://api.openalex.org/works/doi:10.1097/JSM.0b013e3181b8b52f'],
 'lak2025': ['Lak M et al. Does creatine cause hair loss? A 12-week randomized controlled trial. J Int Soc Sports Nutr 2025;22(Suppl 1):2495229: 5 g a day, 38 men analysed; "There were no significant differences in DHT levels, DHT-to-testosterone ratio, or hair growth parameters between the creatine and placebo groups."', 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12020143/fullTextXML'],
 'gummies2025': ['NutraIngredients, 8 Jul 2025: in tests at Eurofins commissioned by a fitness influencer, five of nine creatine gummy brands "contained less than 2% of the claimed amount of creatine" (not peer reviewed)', 'https://www.nutraingredients.com/Article/2025/07/08/are-creatine-gummies-a-viable-delivery-format/'],
 'gummies2024': ['SupplySide Supplement Journal, 4 Mar 2024: the manufacturer NOW tested 12 creatine gummy brands and found 5 failed their label claim, containing "little to no creatine content" (not peer reviewed)', 'https://supplysidesj.com/supplement-regulations/now-tests-creatine-gummies-finding-almost-half-to-be-severely-understrength-'],
 'akf2026': ['American Kidney Fund, 13 Aug 2026: creatine "can raise your serum creatinine levels"; "it’s important to inform your doctor prior to any routine blood work"; people with kidney conditions, high blood pressure, diabetes or heart disease "should talk to their doctors before taking any supplements"', 'https://www.kidneyfund.org/article/creatine-scoop-essential-cautions-kidney-community'],
 'royaldevon2025': ['Royal Devon University Healthcare NHS Foundation Trust, Protein advice for people with kidney disease (Oct 2025): "it’s not advisable to take creatine, as it can be hard on the kidneys"', 'https://www.royaldevon.nhs.uk/media/1ypo1pnl/protein-advice-for-people-with-kidney-disease-rd-25-787-001.pdf'],
})

F[12] = dict(n=12, slug='mouth-taping', question='Is mouth taping safe?', area='sleep-energy', page='/sleep-energy/is-mouth-taping-safe', posts='2026-11-14',
lines=[
 dict(say=['People now tape their mouths shut at night.', 'On purpose.'], src=['clevelandmt'], gap=0.8),
 dict(say=["In three yearly US polls, five to twelve percent of adults said they'd tried it."], src=['aasm2023', 'aasm2024', 'aasm2025']),
 dict(say=['The promise: better sleep, less snoring, even a sharper jaw.'], src=['rhee2025', 'sleepfoundation']),
 dict(say=['A twenty twenty-five review found ten studies, two hundred and thirteen people in total.'], src=['rhee2025']),
 dict(say=['Two showed the main sleep apnoea score improving.', 'Both in mild cases. Neither had a comparison group.'], src=['rhee2025', 'lee2022', 'huang2015']),
 dict(say=["The authors' verdict: the data don't support it as a treatment."], src=['rhee2025']),
 dict(say=['Your nose is the better airway in sleep.', 'But people breathe through the mouth for a reason, often a blocked nose.'], src=['fitzpatrick2003', 'rhee2025']),
 dict(say=["Tape your mouth over a blocked nose, and you've shut your only other way to breathe."], src=['rhee2025', 'rotenberg2025']),
 dict(say=['Jawline?', 'No scientific evidence.'], src=['sleepfoundation']),
 dict(say=["Snoring with pauses, gasping in your sleep, tired all day, or a nose that's often blocked?", "Don't tape. See a doctor."], src=['nhsosa', 'clevelandmt', 'sleepfoundation'], gap=1.0),
 dict(say=['Back to factory settings.']),
],
sources={
 'clevelandmt': ['Cleveland Clinic, Is mouth tape safe to use while sleeping? (25 Jul 2025, Brian Chen, MD): "Mouth taping is the act of taping your mouth shut... so you’re forced to breathe through your nose"; never use it with "Nasal obstruction", "Nasal congestion", "Chronic allergies", "Sinus infections", "Enlarged tonsils", "Deviated septum", "Heart issues"', 'https://health.clevelandclinic.org/mouth-taping'],
 'aasm2023': ['American Academy of Sleep Medicine, 25 Jul 2023: "More than one in 10 (12%) people have tried the dangerous ‘mouth taping’ trend"; online survey of 2,005 US adults, 24 to 29 March 2023', 'https://aasm.org/viral-tiktok-trends-are-not-the-answer-for-better-sleep/'],
 'rhee2025': ['Rhee J, Iansavitchene A, Mannala S, Graham ME, Rotenberg B. Breaking social media fads and uncovering the safety and efficacy of mouth taping. PLOS One 2025;20(5):e0323643: "10 met inclusion criteria with a total of 213 patients"; "Two studies showed statistically significant improvement in established markers of sleep apnea"; risks "including asphyxiation in the presence of nasal obstruction"; "The existing data does not support mouth taping or oral occlusion as a sound clinical intervention for the general population with sleep disordered breathing."', 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0323643'],
 'sleepfoundation': ['Sleep Foundation, Mouth taping for sleep (updated 23 Mar 2026): claims include to "define the jawline"; "There is no scientific evidence that mouth taping directly improves the jawline."; not for people with untreated sleep apnoea or nasal congestion', 'https://www.sleepfoundation.org/sleep-hygiene/mouth-taping-for-sleep'],
 'lee2022': ['Lee YC et al. The impact of mouth-taping in mouth-breathers with mild obstructive sleep apnea: a preliminary study. Healthcare (Basel) 2022;10(9):1755: 20 patients, retrospective, "without a control group"; median AHI 8.3 to 4.7 events/h', 'https://www.mdpi.com/2227-9032/10/9/1755'],
 'huang2015': ['Huang TW, Young TH. Novel porous oral patches for patients with mild obstructive sleep apnea and mouth breathing: a pilot study. Otolaryngol Head Neck Surg 2015;152(2):369-373: 30 patients, median AHI 12.0 to 7.8; single-centre case series without a control group (as described by Rhee 2025)', 'https://api.crossref.org/works/10.1177/0194599814559383'],
 'fitzpatrick2003': ['Fitzpatrick MF et al. Effect of nasal or oral breathing route on upper airway resistance during sleep. Eur Respir J 2003;22(5):827-832: 12 healthy adults; "Upper airway resistance during sleep and the propensity to obstructive sleep apnoea are significantly lower while breathing nasally rather than orally."', 'https://publications.ersnet.org/content/erj/22/5/827'],
 'rotenberg2025': ['The Canadian Press, 21 May 2025, senior author Brian Rotenberg: taping the mouth when the airway is already blocked behind it means "you’ve now blocked off basically half of your airway"', 'https://www.cp24.com/news/canada/2025/05/21/no-evidence-mouth-taping-is-effective-and-could-be-harmful-for-some-new-study-says'],
 'aasm2024': ['American Academy of Sleep Medicine, 2024 sleep prioritization survey (online, 2,006 US adults, May 2024): "Mouth taping 101 (5%)"', 'https://aasm.org/wp-content/uploads/2024/07/sleep-prioritization-survey-2024-social-media-trends.pdf'],
 'aasm2025': ['American Academy of Sleep Medicine, 2025 survey (online, 2,007 US adults, 5 to 13 June 2025): "Mouth taping (7%)"', 'https://aasm.org/scrolling-for-sleep-the-social-media-trends-impacting-americans-sleep-habits/'],
 'nhsosa': ['NHS, Sleep apnoea (reviewed 11 May 2026): "See a GP if: your breathing stops and starts while you sleep; you make gasping, snorting or choking noises while you sleep; you always feel very tired during the day"', 'https://www.nhs.uk/conditions/sleep-apnoea/'],
})

DASH = re.compile('[–—]')
for n, d in F.items():
    keys = set(d['sources'])
    for L in d['lines']:
        for s in L.get('src', []): assert s in keys, (n, s)
        for t in L['say']: assert not DASH.search(t), (n, t)
    for L in d.get('screen', []):
        for s in L['src']: assert s in keys, (n, s)
    for k, (c, u) in d['sources'].items(): assert not DASH.search(c), (n, k)
    used = {s for L in d['lines'] + d.get('screen', []) for s in L.get('src', [])}
    assert used == keys, (n, keys - used, used - keys)
    words = sum(len(' '.join(L['say']).split()) for L in d['lines'])
    path = f"{OUT}/{n:02d}-{d['slug']}.json"
    open(path, 'w').write(json.dumps(d, ensure_ascii=False, indent=1) + '\n')
    print(n, d['slug'], 'lines', len(d['lines']), 'words', words)
