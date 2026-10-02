/* Where every limit in joints.ts comes from: the rows of research/joint-motion.md (project docs), checked on the pages
   linked here. Generated from that file; do not edit by hand. */
export const SOURCES: Record<string, { what: string; study: string; url: string; status: string }> = {
 "BM1": {
  "what": "Body segment masses and centres of mass (the easy moves keep the body's weight over its feet with these)",
  "study": "Dumas, Chèze and Verriest 2007, J Biomech 40:543-553, male values, as tabulated in Kinetics Toolkit",
  "url": "https://github.com/felixchenier/kineticstoolkit/blob/0.8.0/data/anthropometrics_dumas_2007.csv",
  "status": "SECONDARY"
 },
 "SP1": {
  "what": "Occiput-C1: Flexion; extension; LB each side; AR each side",
  "study": "Panjabi et al",
  "url": "https://api.openalex.org/works/doi:10.1097/00007632-198807000-00003",
  "status": "VERIFIED\\*"
 },
 "SP2": {
  "what": "C1-C2: Flexion; extension; LB each side; AR each side",
  "study": "Same study as SP1",
  "url": "https://api.openalex.org/works/doi:10.1097/00007632-198807000-00003",
  "status": "VERIFIED\\*"
 },
 "SP3": {
  "what": "Occiput-C1 and C1-C2: F/E, LB, AR",
  "study": "Dickman and Lekovic, textbook chapter \"Biomechanical Considerations for Stabilization of the Craniovertebral Junction\"; no citation attached",
  "url": "https://2021meeting.cns.org/Assets/6128213f-24d5-4e87-b306-3d895d823be7/636988026370200000/chapter-25-52-pdf",
  "status": "SECONDARY"
 },
 "SP4": {
  "what": "Occiput-C1: F/E (nodding); side bending; rotation",
  "study": "WikiMSK page, no reference given for these values",
  "url": "https://wikimsk.org/wiki/Atlanto-axial_Joint",
  "status": "SECONDARY"
 },
 "SP5": {
  "what": "C1-C2: AR; F/E; lateral flexion",
  "study": "WikiMSK page; only the AR value carries a citation",
  "url": "https://wikimsk.org/wiki/Atlanto-axial_Joint",
  "status": "SECONDARY"
 },
 "SP6": {
  "what": "Occiput-C1 and C1-C2, during maximum head rotation: AR each side, with coupled motions",
  "study": "Ishii et al",
  "url": "https://www.orthobullets.com/evidence/15087810",
  "status": "VERIFIED\\*"
 },
 "SP7": {
  "what": "Occiput-C1 and C1-C2, during head lateral bending: Coupled AR",
  "study": "Ishii et al",
  "url": "https://api.openalex.org/works/doi:10.1097/01.brs.0000195173.47334.1f",
  "status": "VERIFIED\\*"
 },
 "SP8": {
  "what": "Occiput-C2 complex: Flexion; extension; LB right, left; AR right, left",
  "study": "Lorente et al",
  "url": "https://papiro.unizar.es/ojs/index.php/jji3a/es/article/download/4877/3999/15893",
  "status": "VERIFIED"
 },
 "SP9": {
  "what": "C1-C2: Coupling",
  "study": "Cattrysse et al., ISB 2005 conference abstract",
  "url": "https://media.isbweb.org/images/conf/2005/abstracts/0193.pdf",
  "status": "VERIFIED"
 },
 "SP10": {
  "what": "Occipito-atlanto-axial complex: AR and coupling",
  "study": "Michigan State University CME page, no references",
  "url": "https://hal.bim.msu.edu/CMEonLine/New_Cervical/Biomechanics/Upper/Rotation/start.html",
  "status": "SECONDARY"
 },
 "SP11": {
  "what": "C2-C3 to C6-C7: F/E total arc per level",
  "study": "Kobayakawa et al",
  "url": "https://www.med.nagoya-u.ac.jp/medlib/nagoya_j_med_sci/804/14_Kobayakawa.pdf",
  "status": "VERIFIED"
 },
 "SP12": {
  "what": "C2-C3 to C7-T1: AR at maximum head rotation (69.5), with coupled motions",
  "study": "Ishii et al",
  "url": "https://sogacot.org/articulos/cinematica-de-la-columna-cervical-subaxial-en-rotacion-ingles/",
  "status": "VERIFIED\\*"
 },
 "SP13": {
  "what": "C3-C4 to C6-C7: AR each side; LB each side (seated, active)",
  "study": "Ahmadi et al",
  "url": "https://chiro.org/radiology/ABSTRACTS/In_Vivo_Three-dimensional.shtml",
  "status": "VERIFIED\\*"
 },
 "SP14": {
  "what": "Each cervical level: LB each side",
  "study": "Ishii et al",
  "url": "https://api.openalex.org/works/doi:10.1097/01.brs.0000195173.47334.1f",
  "status": "VERIFIED\\*"
 },
 "SP15": {
  "what": "Each level, occiput to T1: AR each side",
  "study": "Zhao et al",
  "url": "https://scholar.xjtu.edu.cn/zh/publications/three-dimensional-analysis-of-cervical-spine-segmental-motion-in-/",
  "status": "VERIFIED\\*"
 },
 "SP16": {
  "what": "C0-C1 to C6-C7: F/E; LB; AR (direction convention not stated on the page)",
  "study": "Column labelled \"Panjabi\" in a 2024 J Orthop Surg Res finite element validation table (\"Validation of the intact cervical model\"), reference",
  "url": "https://josr-online.biomedcentral.com/articles/10.1186/s13018-024-04567-5/tables/2",
  "status": "SECONDARY"
 },
 "SP17": {
  "what": "C0-C7: F/E and AR, largest levels",
  "study": "Panjabi et al",
  "url": "https://api.openalex.org/works/doi:10.1097/00007632-200112150-00012",
  "status": "VERIFIED\\*"
 },
 "SP18": {
  "what": "Whole cervical spine: Totals and shares",
  "study": "Farber et al",
  "url": "https://scholar.barrowneuro.org/neurosurgery/2186/",
  "status": "VERIFIED\\*"
 },
 "SP19": {
  "what": "T1-T2 to T12-L1: AR each side, maximum trunk rotation",
  "study": "Fujimori et al",
  "url": "https://api.openalex.org/works/doi:10.1097/BRS.0b013e318267254b",
  "status": "VERIFIED\\*"
 },
 "SP20": {
  "what": "T1-T2 to T11-T12: F/E; LB; AR, each as total of both directions",
  "study": "Wilke et al",
  "url": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0177823",
  "status": "VERIFIED"
 },
 "SP21": {
  "what": "Thoracic: F/E trend in White and Panjabi",
  "study": "As stated in the discussion of Wilke et al",
  "url": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0177823",
  "status": "SECONDARY"
 },
 "SP22": {
  "what": "L1/2 to L5/S1: Total voluntary movement: F/E; LB; AR (mean, range)",
  "study": "Pearcy 1985, Acta Orthop Scand Suppl, Table 5 \"Total voluntary movements at each intervertebral level\"",
  "url": "https://actaorthop.org/actao/article/download/23296/27226/71829",
  "status": "VERIFIED"
 },
 "SP23": {
  "what": "Each lumbar level: F/E total",
  "study": "Pearcy, Portek and Shepherd 1984, Spine",
  "url": "https://api.openalex.org/works/doi:10.1097/00007632-198404000-00013",
  "status": "VERIFIED\\*"
 },
 "SP24": {
  "what": "Each lumbar level: AR; LB",
  "study": "Pearcy and Tibrewal 1984, Spine",
  "url": "https://api.openalex.org/works/doi:10.1097/00007632-198409000-00008",
  "status": "VERIFIED\\*"
 },
 "SP25": {
  "what": "T12/L1 to L5/S1: AR each side at maximum trunk rotation (56.1)",
  "study": "Fujii et al., ISB 2005 conference abstract",
  "url": "https://media.isbweb.org/images/conf/2005/abstracts/0012.pdf",
  "status": "VERIFIED"
 },
 "SP26": {
  "what": "L1-S1: AR; LB; translation",
  "study": "Ochia et al",
  "url": "https://api.openalex.org/works/doi:10.1097/01.brs.0000231435.55842.9e",
  "status": "VERIFIED\\*"
 },
 "SP27": {
  "what": "L2-3 to L5-S1: Maximum intervertebral rotation during guided flexion and return",
  "study": "Breen et al",
  "url": "https://www.frontiersin.org/journals/bioengineering-and-biotechnology/articles/10.3389/fbioe.2021.745837/full",
  "status": "VERIFIED"
 },
 "SP28": {
  "what": "L1-L2 to L5-S1: LB, women and men",
  "study": "Cook et al",
  "url": "https://fmu.repo.nii.ac.jp/record/2002089/files/FksmJMedSci_70_p25.pdf",
  "status": "SECONDARY"
 },
 "SP29": {
  "what": "Cervical (neck): Flexion; extension; rotation; lateral flexion",
  "study": "\"Normal ROM values according to AAOS\", supplementary file of a 2020 PRS Global Open article (Hendriks et al., names read from the file URL)",
  "url": "https://cdn-links.lww.com/permalink/prsgo/b/prsgo_8_6_2020_04_17_hendriks_gox-d-20-00155r2_sdc1.pdf",
  "status": "SECONDARY"
 },
 "SP30": {
  "what": "Head on trunk: Rotation to one side",
  "study": "Ishii et al",
  "url": "https://sogacot.org/articulos/cinematica-de-la-columna-cervical-subaxial-en-rotacion-ingles/",
  "status": "VERIFIED\\*"
 },
 "SP31": {
  "what": "Thoracic (T1 relative to L1): AR each side",
  "study": "Fujimori et al",
  "url": "https://api.openalex.org/works/doi:10.1097/BRS.0b013e318267254b",
  "status": "VERIFIED\\*"
 },
 "SP32": {
  "what": "Lumbar: Flexion; extension; lateral flexion each side; AR each side",
  "study": "Troke et al",
  "url": "https://research.brighton.ac.uk/en/publications/a-normative-database-of-lumbar-spine-ranges-of-motion/",
  "status": "VERIFIED\\*"
 },
 "SP33": {
  "what": "Upper cervical (Oc-C1, C1-C2): AR",
  "study": "In vivo (see SP6)",
  "url": "https://www.orthobullets.com/evidence/15087810",
  "status": "VERIFIED\\*"
 },
 "SP34": {
  "what": "Upper cervical: LB",
  "study": "In vivo (see SP7)",
  "url": "https://api.openalex.org/works/doi:10.1097/01.brs.0000195173.47334.1f",
  "status": "VERIFIED\\*"
 },
 "SP35": {
  "what": "Subaxial cervical (C2-C3 to C7-T1): AR",
  "study": "In vivo (see SP12, SP15)",
  "url": "https://sogacot.org/articulos/cinematica-de-la-columna-cervical-subaxial-en-rotacion-ingles/",
  "status": "VERIFIED\\*"
 },
 "SP36": {
  "what": "Subaxial cervical: LB",
  "study": "In vivo (SP13, SP14)",
  "url": "https://chiro.org/radiology/ABSTRACTS/In_Vivo_Three-dimensional.shtml",
  "status": "VERIFIED\\*"
 },
 "SP37": {
  "what": "Subaxial cervical: AR; LB",
  "study": "Educational site summarising coupling reviews",
  "url": "https://anatomystandard.com/biomechanics/spine/coupled-motions.html",
  "status": "SECONDARY"
 },
 "SP38": {
  "what": "Subaxial cervical: LB",
  "study": "WikiMSK, no reference given",
  "url": "https://wikimsk.org/wiki/Coupled_Movements_of_the_Spine",
  "status": "SECONDARY"
 },
 "SP39": {
  "what": "Thoracic: AR",
  "study": "In vivo, Fujimori et al",
  "url": "https://api.openalex.org/works/doi:10.1097/BRS.0b013e318267254b",
  "status": "VERIFIED\\*"
 },
 "SP40": {
  "what": "Thoracic: LB",
  "study": "Sizer, Brismee and Cook 2007, J Manipulative Physiol Ther, systematic review",
  "url": "https://instituteofmotion.com/wp-content/uploads/2019/03/Coupling_Behavior_of_the_Thoracic_Spine.pdf",
  "status": "VERIFIED (conclusion); SECONDARY (Willems figures)"
 },
 "SP41": {
  "what": "Cervical and thoracic, in vitro: LB; AR; F/E",
  "study": "Liebsch and Wilke 2025, Front Bioeng Biotechnol, meta-analysis of 20 in vitro studies; abstract gives no lumbar result and no numeric cut-of",
  "url": "https://public-pages-files-2025.frontiersin.org/journals/bioengineering-and-biotechnology/articles/10.3389/fbioe.2025.1686524/text",
  "status": "VERIFIED\\*"
 },
 "SP42": {
  "what": "Lumbar: AR",
  "study": "In vivo, Pearcy and Tibrewal 1984; Pearcy 1985",
  "url": "https://api.openalex.org/works/doi:10.1097/00007632-198409000-00008",
  "status": "VERIFIED\\* / VERIFIED"
 },
 "SP43": {
  "what": "Lumbar: AR (maximum trunk rotation)",
  "study": "In vivo, 10 healthy volunteers (Fujii et al., ISB 2005)",
  "url": "https://media.isbweb.org/images/conf/2005/abstracts/0012.pdf",
  "status": "VERIFIED"
 },
 "SP44": {
  "what": "Lumbar: AR",
  "study": "Educational site",
  "url": "https://anatomystandard.com/biomechanics/spine/coupled-motions.html",
  "status": "SECONDARY"
 },
 "SH1": {
  "what": "Shoulder: Flexion (passive, supine)",
  "study": "CDC Normal Joint ROM Study (Soucie et al.), mean (95% CI)",
  "url": "https://archive.cdc.gov/www_cdc_gov/ncbddd/jointrom/index.html",
  "status": "VERIFIED"
 },
 "SH2": {
  "what": "Shoulder (joint not named on the table page; the article's Table 1 is a shoulder and posture examination): Flexion; exte",
  "study": "Comparison table, Sports Med Arthrosc Rehabil Ther Technol 2012; 4:32 (article title not read)",
  "url": "https://bmcsportsscimedrehabil.biomedcentral.com/articles/10.1186/1758-2555-4-32/tables/2",
  "status": "SECONDARY"
 },
 "SH3": {
  "what": "Shoulder: Flexion; extension; abduction; adduction",
  "study": "\"Normal ROM values according to AAOS\" (see SP29)",
  "url": "https://cdn-links.lww.com/permalink/prsgo/b/prsgo_8_6_2020_04_17_hendriks_gox-d-20-00155r2_sdc1.pdf",
  "status": "SECONDARY"
 },
 "SH4": {
  "what": "Shoulder: Active flexion; active abduction; external rotation with the arm at the side (right side)",
  "study": "Gill et al",
  "url": "https://digital.library.adelaide.edu.au/dspace/bitstream/2440/129458/2/hdl_129458.pdf",
  "status": "VERIFIED"
 },
 "SH5": {
  "what": "Shoulder: Passive external and internal rotation by arm position",
  "study": "McCully et al",
  "url": "https://pages.uoregon.edu/biomech/obl/articles/2005_mccully_jses.pdf",
  "status": "VERIFIED"
 },
 "SH6": {
  "what": "Glenohumeral share: Flexion; abduction; scapula; total elevation",
  "study": "Physiopedia, Scapulohumeral Rhythm page",
  "url": "https://www.physio-pedia.com/Scapulohumeral_Rhythm",
  "status": "SECONDARY"
 },
 "SH7": {
  "what": "Inman, Saunders and Abbott 1944: Arm elevation",
  "study": "As quoted by Scibek and Carcia 2012 and by Physiopedia",
  "url": "https://www.wjgnet.com/2218-5836/full/v3/i6/87.htm",
  "status": "SECONDARY"
 },
 "SH8": {
  "what": "Freedman and Munro 1966, J Bone Joint Surg: Abduction in the scapular plane",
  "study": "61 men, radiographs in 5 arm positions",
  "url": "https://api.openalex.org/works/doi:10.2106/00004623-196648080-00004",
  "status": "VERIFIED\\*"
 },
 "SH9": {
  "what": "Poppen and Walker 1976, J Bone Joint Surg: Abduction",
  "study": "12 normal subjects and 15 patients, radiographs",
  "url": "https://api.openalex.org/works/doi:10.2106/00004623-197658020-00006",
  "status": "VERIFIED\\*"
 },
 "SH10": {
  "what": "McClure et al. 2001, J Shoulder Elbow Surg: Active scapular plane elevation",
  "study": "8 healthy volunteers (5 M, 3 F, mean 32.6 y), bone pins in the scapular spine, 3D tracking (modern 3D study)",
  "url": "https://pages.uoregon.edu/biomech/obl/articles/2001_mcclure_jses2001.pdf",
  "status": "VERIFIED"
 },
 "SH11": {
  "what": "Scibek and Carcia 2012, World J Orthop: Active scapular plane elevation, 0 to 120",
  "study": "13 healthy college-aged people (8 M, 5 F, 21.46 ± 1.13 y), modified digital inclinometer, static positions",
  "url": "https://www.wjgnet.com/2218-5836/full/v3/i6/87.htm",
  "status": "VERIFIED"
 },
 "SH12": {
  "what": "Adults vs children: Scapular plane",
  "study": "Physiopedia (\"another study\"); the page attaches its reference to Inman, so the original study was not identified",
  "url": "https://www.physio-pedia.com/Scapulohumeral_Rhythm",
  "status": "SECONDARY"
 },
 "SH13": {
  "what": "Clavicle (sternoclavicular): Retraction",
  "study": "McClure et al",
  "url": "https://pages.uoregon.edu/biomech/obl/articles/2001_mcclure_jses2001.pdf",
  "status": "VERIFIED"
 },
 "SH14": {
  "what": "Clavicle: Elevation",
  "study": "Inman 1944 as cited by McClure et al",
  "url": "https://pages.uoregon.edu/biomech/obl/articles/2001_mcclure_jses2001.pdf",
  "status": "SECONDARY"
 },
 "SH15": {
  "what": "Sternoclavicular, acromioclavicular, glenohumeral: Pattern and main amounts",
  "study": "Ludewig et al",
  "url": "https://www.healthpartners.com/knowledgeexchange/display/document-rn19148",
  "status": "VERIFIED\\*"
 },
 "SH16": {
  "what": "Clavicle: Retraction; elevation; posterior rotation, by measuring method",
  "study": "Tang and Shih 2023, systematic review (World Physiotherapy congress abstract)",
  "url": "https://world.physio/congress-proceeding/measurement-clavicle-kinematics-systematic-review",
  "status": "VERIFIED"
 },
 "SH17": {
  "what": "Acromioclavicular: Scapula relative to clavicle during abduction",
  "study": "Sahara 2008, Osaka University thesis abstract",
  "url": "https://ir.library.osaka-u.ac.jp/repo/ouka/all/49041/22323_Abstract.pdf",
  "status": "VERIFIED"
 },
 "EL1": {
  "what": "Elbow: Flexion (passive)",
  "study": "CDC Normal Joint ROM Study, mean (95% CI)",
  "url": "https://archive.cdc.gov/www_cdc_gov/ncbddd/jointrom/index.html",
  "status": "VERIFIED"
 },
 "EL2": {
  "what": "Elbow: Extension, including hyperextension (positive = past straight; see note)",
  "study": "CDC Normal Joint ROM Study",
  "url": "https://archive.cdc.gov/www_cdc_gov/ncbddd/jointrom/index.html",
  "status": "VERIFIED"
 },
 "EL3": {
  "what": "Elbow: Flexion; extension",
  "study": "\"Normal ROM values according to AAOS\" (see SP29)",
  "url": "https://cdn-links.lww.com/permalink/prsgo/b/prsgo_8_6_2020_04_17_hendriks_gox-d-20-00155r2_sdc1.pdf",
  "status": "SECONDARY"
 },
 "FA1": {
  "what": "Forearm: Pronation (passive, sitting)",
  "study": "CDC Normal Joint ROM Study",
  "url": "https://archive.cdc.gov/www_cdc_gov/ncbddd/jointrom/index.html",
  "status": "VERIFIED"
 },
 "FA2": {
  "what": "Forearm: Supination (passive, sitting)",
  "study": "CDC Normal Joint ROM Study",
  "url": "https://archive.cdc.gov/www_cdc_gov/ncbddd/jointrom/index.html",
  "status": "VERIFIED"
 },
 "WR1": {
  "what": "Wrist: Flexion; extension",
  "study": "\"Normal ROM values according to AAOS\" (see SP29)",
  "url": "https://cdn-links.lww.com/permalink/prsgo/b/prsgo_8_6_2020_04_17_hendriks_gox-d-20-00155r2_sdc1.pdf",
  "status": "SECONDARY"
 },
 "WR2": {
  "what": "Wrist: Active flexion; extension; ulnar deviation; radial deviation",
  "study": "Chung, Park and Chi 1986, J Korean Orthop Assoc",
  "url": "https://synapse.koreamed.org/articles/1122791",
  "status": "VERIFIED"
 },
 "WR3": {
  "what": "Wrist: Coupling of F/E with radial-ulnar deviation",
  "study": "Li et al",
  "url": "https://experts.arizona.edu/en/publications/coupling-between-wrist-flexion-extension-and-radial-ulnar-deviati/",
  "status": "VERIFIED\\*"
 },
 "WR4": {
  "what": "Wrist: Functional range for daily tasks",
  "study": "Ryu et al",
  "url": "https://mayoclinic.elsevierpure.com/en/publications/functional-ranges-of-motion-of-the-wrist-joint/",
  "status": "VERIFIED\\*"
 },
 "HP1": {
  "what": "Hip: Flexion (passive, supine; knee position not stated on the data page)",
  "study": "CDC Normal Joint ROM Study",
  "url": "https://archive.cdc.gov/www_cdc_gov/ncbddd/jointrom/index.html",
  "status": "VERIFIED"
 },
 "HP2": {
  "what": "Hip: Extension (passive, side lying)",
  "study": "CDC Normal Joint ROM Study",
  "url": "https://archive.cdc.gov/www_cdc_gov/ncbddd/jointrom/index.html",
  "status": "VERIFIED"
 },
 "HP3": {
  "what": "Hip: Flexion; extension; abduction; adduction; internal rotation; external rotation (passive), mean (2 SD)",
  "study": "Svenningsen et al",
  "url": "https://actaorthop.org/actao/article/download/22566/26493/71068",
  "status": "VERIFIED"
 },
 "HP4": {
  "what": "Hip: Flexion; extension (passive), mean (SD), right and left",
  "study": "Roaas and Andersson 1982, Acta Orthop Scand",
  "url": "https://actaorthop.org/actao/article/download/28654/33535/82106",
  "status": "VERIFIED"
 },
 "HP5": {
  "what": "Hip: Flexion; extension; abduction; adduction; internal rotation; external rotation",
  "study": "AAOS 1965 \"Joint motion: method of measuring and recording\", as listed in the comparison column of Roaas and Andersson 1982",
  "url": "https://actaorthop.org/actao/article/download/28654/33535/82106",
  "status": "SECONDARY"
 },
 "HP6": {
  "what": "Hip: Flexion; extension; abduction; adduction",
  "study": "\"Normal ROM values according to AAOS\" (see SP29)",
  "url": "https://cdn-links.lww.com/permalink/prsgo/b/prsgo_8_6_2020_04_17_hendriks_gox-d-20-00155r2_sdc1.pdf",
  "status": "SECONDARY"
 },
 "HP7": {
  "what": "Hip and knee: Population norms vs textbooks",
  "study": "Roach and Miles 1991, Phys Ther",
  "url": "https://api.openalex.org/works/doi:10.1093/ptj/71.9.656",
  "status": "VERIFIED\\*"
 },
 "KN1": {
  "what": "Knee: Flexion (passive, supine)",
  "study": "CDC Normal Joint ROM Study",
  "url": "https://archive.cdc.gov/www_cdc_gov/ncbddd/jointrom/index.html",
  "status": "VERIFIED"
 },
 "KN2": {
  "what": "Knee: Extension, including hyperextension (positive = past straight, same caveat as EL2)",
  "study": "CDC Normal Joint ROM Study",
  "url": "https://archive.cdc.gov/www_cdc_gov/ncbddd/jointrom/index.html",
  "status": "VERIFIED"
 },
 "KN3": {
  "what": "Knee: Flexion (passive)",
  "study": "Roaas and Andersson 1982, healthy men aged 30 to 40 (90 subjects, 180 knees)",
  "url": "https://actaorthop.org/actao/article/download/28654/33535/82106",
  "status": "VERIFIED"
 },
 "KN4": {
  "what": "Knee: Flexion; extension",
  "study": "See SP29 and HP5",
  "url": "https://cdn-links.lww.com/permalink/prsgo/b/prsgo_8_6_2020_04_17_hendriks_gox-d-20-00155r2_sdc1.pdf",
  "status": "SECONDARY"
 },
 "KN5": {
  "what": "Knee (tibia on femur): Active axial rotation, knee bent",
  "study": "Mossberg and Smith 1983, J Orthop Sports Phys Ther",
  "url": "https://researchexperts.utmb.edu/en/publications/axial-rotation-of-the-knee-in-women/",
  "status": "VERIFIED\\*"
 },
 "KN6": {
  "what": "Knee: Screw-home during walking",
  "study": "Kim et al",
  "url": "https://synapse.koreamed.org/articles/1050328",
  "status": "VERIFIED"
 },
 "KN7": {
  "what": "Knee: Classic screw-home",
  "study": "Goodfellow and O'Connor 1978, as cited in the introduction of Kim et al",
  "url": "https://synapse.koreamed.org/articles/1050328",
  "status": "SECONDARY"
 },
 "KN8": {
  "what": "Knee: Tibial rotation coupled to flexion and extension between 0 and 40",
  "study": "Chen et al",
  "url": "https://link.springer.com/content/pdf/10.1186/s13018-014-0065-8.pdf",
  "status": "VERIFIED (cited studies SECONDARY)"
 },
 "KN9": {
  "what": "Patella on femur, weight-bearing, in vivo: Shift, tilt, rotation through full flexion",
  "study": "8 subjects, MRI plus dual orthogonal fluoroscopy",
  "url": "https://orthobullets.com/evidence/18327809",
  "status": "VERIFIED\\*"
 },
 "KN10": {
  "what": "Patella, in vitro, standing to sitting (0 to 90): Flexion, rotation, translation",
  "study": "Jenny et al",
  "url": "https://em-consulte.com/article/142056/resume/etude-de-la-cinematique-active-continue-de-l-artic",
  "status": "VERIFIED\\*"
 },
 "AN1": {
  "what": "Ankle: Dorsiflexion (passive, sitting)",
  "study": "CDC Normal Joint ROM Study",
  "url": "https://archive.cdc.gov/www_cdc_gov/ncbddd/jointrom/index.html",
  "status": "VERIFIED"
 },
 "AN2": {
  "what": "Ankle: Plantarflexion (passive, sitting)",
  "study": "CDC Normal Joint ROM Study",
  "url": "https://archive.cdc.gov/www_cdc_gov/ncbddd/jointrom/index.html",
  "status": "VERIFIED"
 },
 "AN3": {
  "what": "Ankle: Dorsiflexion; plantarflexion (passive)",
  "study": "Roaas and Andersson 1982, healthy men aged 30 to 40 (96 subjects, 192 ankles), supine with the knee in about 45 of flexion",
  "url": "https://actaorthop.org/actao/article/download/28654/33535/82106",
  "status": "VERIFIED"
 },
 "AN4": {
  "what": "Ankle: Plantarflexion; dorsiflexion",
  "study": "See SP29 and HP5",
  "url": "https://cdn-links.lww.com/permalink/prsgo/b/prsgo_8_6_2020_04_17_hendriks_gox-d-20-00155r2_sdc1.pdf",
  "status": "SECONDARY"
 },
 "ST1": {
  "what": "Subtalar: Inversion; eversion",
  "study": "Milgrom et al",
  "url": "https://cris.bgu.ac.il/en/publications/the-normal-range-of-subtalar-inversion-and-eversion-in-young-male/",
  "status": "VERIFIED\\*"
 },
 "ST2": {
  "what": "Subtalar (calcaneus on talus): Extreme eversion to extreme inversion",
  "study": "Beimers et al",
  "url": "https://research.utwente.nl/en/publications/in-vivo-range-of-motion-of-the-subtalar-joint-using-computed-tomo/",
  "status": "VERIFIED\\*"
 },
 "ST3": {
  "what": "Foot (inversion, eversion): Inversion; eversion",
  "study": "AAOS 1965 as listed by Roaas and Andersson 1982",
  "url": "https://actaorthop.org/actao/article/download/28654/33535/82106",
  "status": "SECONDARY"
 },
 "MT1": {
  "what": "First metatarsophalangeal (toe MTP): Extension; flexion",
  "study": "\"Normal ROM values according to AAOS\" (see SP29)",
  "url": "https://cdn-links.lww.com/permalink/prsgo/b/prsgo_8_6_2020_04_17_hendriks_gox-d-20-00155r2_sdc1.pdf",
  "status": "SECONDARY"
 },
 "MT2": {
  "what": "First MTP: Dorsiflexion (extension), healthy controls",
  "study": "Sanchez-Gomez et al",
  "url": "https://dehesa.unex.es/bitstream/10662/14746/1/1071100719901116.pdf",
  "status": "VERIFIED"
 },
 "MT3": {
  "what": "First MTP: Dorsiflexion",
  "study": "Quoted by Sanchez-Gomez et al",
  "url": "https://dehesa.unex.es/bitstream/10662/14746/1/1071100719901116.pdf",
  "status": "SECONDARY"
 },
 "MT4": {
  "what": "First MTP: Extension needed for walking",
  "study": "Hopson, McPoil and Cornwall 1995, J Am Podiatr Med Assoc",
  "url": "https://experts.nau.edu/en/publications/motion-of-the-first-metatarsophalangeal-joint-reliability-and-val/",
  "status": "VERIFIED\\*"
 },
 "JW1": {
  "what": "Jaw: Maximum mouth opening",
  "study": "Zawawi et al",
  "url": "https://cda-adc.ca/jcda/vol-69/issue-11/737.pdf",
  "status": "VERIFIED"
 },
 "JW2": {
  "what": "Jaw: Maximum mouth opening",
  "study": "Gallagher et al",
  "url": "https://api.openalex.org/works/doi:10.1046/j.0305-182X.2003.01209.x",
  "status": "VERIFIED\\*"
 },
 "JW3": {
  "what": "Jaw: Maximum mouth opening; lateral excursion",
  "study": "Abushouk et al",
  "url": "https://mail.opendentistryjournal.com/VOLUME/19/ELOCATOR/e18742106392815/ABSTRACT/",
  "status": "VERIFIED"
 }
};
