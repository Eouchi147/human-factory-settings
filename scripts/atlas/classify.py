"""Sort every BodyParts3D mesh into one of nine body systems and a legend part.

Returns a list of assignments per mesh: (system, cluster, material, tone).
  system   : skeleton | muscles | nervous | cardio | breathing | digestion | urinary | endocrine | immune
  cluster  : the legend part it belongs to (what gets a number and a name on screen)
  material : how its surface looks (bone, cart, muscle, organ, vessel, brain)
  tone     : a colour key inside the cluster (most pieces just use the cluster colour)
Left out on purpose: skin and hair, reproductive organs, the urethra, membranes (mesentery,
tentorium), and bits too small to see.
"""
import re

LR = re.compile(r"(?i)\b(left|right)\b ?")


def base(name: str) -> str:
    return LR.sub("", name).strip().lower()


def side(name: str) -> int:
    n = name.lower()
    if n.startswith("left") or " of left " in n:
        return 1
    if n.startswith("right") or " of right " in n:
        return -1
    return 0


def has(n, *words):
    return any(w in n for w in words)


# ------------------------------------------------------------------ skeleton
CARPALS = ("scaphoid", "lunate", "triquetral", "pisiform", "trapezium", "trapezoid", "capitate", "hamate")
TARSALS = ("talus", "calcaneus", "navicular", "cuboid", "cuneiform bone", "sesamoid bone of")
SKULL = ("frontal bone", "parietal bone", "temporal bone", "occipital bone", "sphenoid bone", "ethmoid", "vomer",
         "lacrimal bone", "nasal bone", "maxilla", "palatine bone", "zygomatic bone", "mandible", "hyoid bone")
LARYNX_CART = ("cricoid cartilage", "thyroid cartilage", "arytenoid cartilage", "corniculate cartilage", "cuneiform cartilage")
NOSE = ("major alar cartilage", "lateral nasal cartilage", "septal nasal cartilage", "inferior nasal concha")


def skeleton(n, sysname, group):
    if group == "teeth" or "tooth" in n or "incisor" in n or "canine" in n or "molar" in n:
        return ("skeleton", "skull", "bone", "tooth")
    if has(n, *SKULL):
        return ("skeleton", "skull", "bone", "bone")
    if has(n, "vertebra", "atlas", "axis") and "disk" not in n:
        return ("skeleton", "spine", "bone", "bone")
    if "intervertebral disk" in n:
        return ("skeleton", "spine", "cart", "disc")
    if "sacrum" in n or "coccyx" in n or "hip bone" in n:
        return ("skeleton", "pelvis", "bone", "bone")
    if re.search(r"\brib\b", n) or "sternum" in n or "manubrium" in n or "xiphoid" in n:
        return ("skeleton", "ribcage", "bone", "bone")
    if "costal cartilage" in n:
        return ("skeleton", "ribcage", "cart", "cart")
    if "clavicle" in n or "scapula" in n:
        return ("skeleton", "shoulders", "bone", "bone")
    if has(n, "humerus", "radius", "ulna", "metacarpal", "finger", "thumb") or has(n, *CARPALS):
        return ("skeleton", "arms", "bone", "bone")
    if has(n, "femur", "patella", "tibia", "fibula", "metatarsal", "toe") or has(n, *TARSALS):
        return ("skeleton", "legs", "bone", "bone")
    return None


# ------------------------------------------------------------------ muscles
MUSCLE_CLUSTERS = [
    ("chest", ("pectoralis major", "pectoralis minor")),
    ("shoulders", ("deltoid",)),
    ("biceps", ("biceps brachii",)),
    ("triceps", ("triceps brachii",)),
    ("forearms", ("brachioradialis", "flexor carpi", "extensor carpi", "palmaris longus", "pronator teres", "flexor digitorum superficialis",
                  "flexor digitorum profundus", "extensor digitorum", "flexor pollicis longus", "abductor pollicis longus", "extensor pollicis",
                  "extensor indicis", "extensor digiti minimi", "supinator", "pronator quadratus", "anconeus")),
    ("upperback", ("trapezius",)),
    ("sides", ("external oblique", "serratus anterior")),
    ("glutes", ("gluteus maximus", "gluteus medius")),
    ("quads", ("rectus femoris", "vastus lateralis", "vastus medialis", "vastus intermedius")),
    ("hamstrings", ("biceps femoris", "semitendinosus", "semimembranosus")),
    ("calves", ("gastrocnemius", "soleus")),
    ("shins", ("tibialis anterior",)),
    ("neck", ("sternocleidomastoid",)),
]
LARYNX_MUSCLES = ("cricothyroid", "arytenoid", "thyro-arytenoid", "vocalis", "crico-arytenoid", "aryepiglotticus")
THROAT = ("pharyngeal constrictor", "palatopharyngeus", "salpingopharyngeus", "stylopharyngeus", "uvular muscle", "levator veli palatini", "tensor veli palatini")
SKIP_MUSCLES = ("superficial perineal", "external anal sphincter", "papillary muscle")
MISFILED_MUSCLES = ("fibularis", "tibialis", "levator scapulae", "subscapularis", "iliotibial tract", "tensor fasciae latae")


def muscle(n):
    if has(n, *SKIP_MUSCLES):
        return None
    for c, keys in MUSCLE_CLUSTERS:
        if has(n, *keys):
            return ("muscles", c, "muscle", "muscle")
    if "iliotibial tract" in n:
        return ("muscles", "other", "muscle", "tendon")
    return ("muscles", "other", "muscle", "muscle")


# ------------------------------------------------------------------ brain and nerves
FRONTAL = ("superior frontal gyrus", "middle frontal gyrus", "inferior frontal gyrus", "precentral gyrus", "orbital gyrus")
PARIETAL = ("postcentral gyrus", "superior parietal lobule", "supramarginal gyrus", "angular gyrus")
TEMPORAL = ("superior temporal gyrus", "middle temporal gyrus", "inferior temporal gyrus", "fusiform gyrus")
BRAINSTEM = ("midbrain", "pons", "medulla oblongata", "colliculus", "interpeduncular fossa")
DEEP = ("thalamus", "caudate nucleus", "putamen", "globus pallidus", "hypothalamus", "hippocampus", "amygdala", "fornix", "corpus callosum",
        "cingulate gyrus", "insula", "parahippocampal gyrus", "stria medullaris", "stria terminalis", "internal capsule", "geniculate body",
        "habenula", "mammillary body", "septum of telencephalon", "lamina terminalis", "tuber cinereum", "commissure")
VENTRICLES = ("lateral ventricle", "third ventricle", "fourth ventricle", "interventricular foramen", "cerebral aqueduct")
EYE = ("cornea", "lens", "iris", "sclera", "choroid", "vitreous body", "optic part of retina", "corona ciliaris", "anterior chamber of", "suspensory ligament of")
OPTIC = ("optic nerve", "optic chiasm", "optic tract")
FACE_NERVES = ("ophthalmic nerve", "frontal nerve", "supra-orbital nerve", "supratrochlear nerve", "lacrimal nerve", "nasociliary nerve", "ethmoidal nerve",
               "infratrochlear nerve", "ciliary nerve", "ciliary ganglion", "oculomotor nerve", "trochlear nerve")


def nervous(n):
    if "choroid plexus" in n or "tentorium" in n:
        return None
    if has(n, *VENTRICLES):
        return ("nervous", "ventricles", "organ", "csf")
    if "white matter" in n:
        return ("nervous", "white", "brain", "white")
    if "occipital lobe" in n:
        return ("nervous", "occipital", "brain", "cortex")
    if has(n, *FRONTAL):
        return ("nervous", "frontal", "brain", "cortex")
    if has(n, *PARIETAL):
        return ("nervous", "parietal", "brain", "cortex")
    if has(n, *TEMPORAL):
        return ("nervous", "temporal", "brain", "cortex")
    if "cerebellum" in n:
        return ("nervous", "cerebellum", "brain", "cortex")
    if has(n, *BRAINSTEM) or "peduncle of midbrain" in n:
        return ("nervous", "brainstem", "brain", "deep")
    if has(n, *DEEP):
        return ("nervous", "deep", "brain", "deep")
    if "central canal of spinal cord" in n:
        return None  # only its top 4 cm are in the data: too little to show as the spinal cord
    if has(n, *OPTIC):
        return ("nervous", "eyes", "vessel", "nerve")
    if has(n, *FACE_NERVES):
        return ("nervous", "facenerves", "vessel", "nerve")
    if has(n, *EYE) and "lacrimal" not in n:
        tone = "lens" if ("lens" in n or "cornea" in n or "vitreous" in n or "anterior chamber" in n) else ("iris" if "iris" in n else "eye")
        return ("nervous", "eyes", "organ", tone)
    return None


# ------------------------------------------------------------------ heart and blood vessels
AORTA = ("ascending aorta", "arch of aorta", "thoracic aorta", "abdominal aorta", "aortic arch", "descending aorta")
VENA_CAVA = ("superior vena cava", "inferior vena cava")
CORONARY = ("coronary artery", "anterior interventricular", "circumflex branch", "posterior interventricular", "coronary sinus", "great cardiac vein",
            "middle cardiac vein", "small cardiac vein", "cardiac vein")


def cardio(n, sysname):
    if "cavity of" in n:
        return None
    if n == "wall of atrium":
        return ("cardio", "atria", "organ", "heart")
    if "wall of ventricle" in n:
        return ("cardio", "ventricles", "organ", "heart")
    if "papillary muscle" in n:
        return ("cardio", "ventricles", "organ", "papillary")
    if has(n, "valve", "leaflet of", "cusp of"):
        return ("cardio", "valves", "organ", "valve")
    if sysname == "arterial":
        if has(n, *CORONARY):
            return ("cardio", "coronary", "vessel", "artery")
        if has(n, *AORTA) or n == "aorta":
            return ("cardio", "aorta", "vessel", "artery")
        return ("cardio", "arteries", "vessel", "artery")
    if sysname == "venous":
        if "hepatovenous segment" in n:
            return None
        if has(n, *CORONARY):
            return ("cardio", "coronary", "vessel", "vein")
        if has(n, *VENA_CAVA):
            return ("cardio", "venacava", "vessel", "vein")
        return ("cardio", "veins", "vessel", "vein")
    return None


# ------------------------------------------------------------------ breathing
def breathing(n, sysname, full=""):
    if has(n, *NOSE):
        return ("breathing", "nose", "cart" if "cartilage" in n else "organ", "cart" if "cartilage" in n else "mucosa")
    if has(n, *THROAT):
        return ("breathing", "throat", "organ", "throat")
    if has(n, *LARYNX_CART) or "epiglottis" in n or has(n, *LARYNX_MUSCLES) or has(n, "vocal ligament", "conus elasticus"):
        cart = has(n, *LARYNX_CART) or "epiglottis" in n
        return ("breathing", "voicebox", "cart" if cart else "organ", "cart" if cart else "throat")
    if n == "trachea":
        return ("breathing", "windpipe", "organ", "airway")
    if "bronch" in n:
        f = full.lower()
        left = "left" in f or "lingular" in f
        # segmental trees with no side in their name (lateral and medial segmental) are the right lung's middle lobe
        return ("breathing", "leftlung" if left else "rightlung", "organ", "airway")
    if n == "diaphragm":
        return ("breathing", "diaphragm", "muscle", "diaphragm")
    return None


# ------------------------------------------------------------------ digestion
def digestion(n, sysname):
    if has(n, "mesentery", "mesocolon", "mesoappendix", "gingiva"):
        return None
    if n == "tongue":
        return ("digestion", "mouth", "organ", "tongue")
    if "sublingual gland" in n or "submandibular gland" in n:
        return ("digestion", "mouth", "organ", "gland")
    if n == "esophagus":
        return ("digestion", "esophagus", "organ", "esophagus")
    if n == "stomach":
        return ("digestion", "stomach", "organ", "stomach")
    if "hepatovenous segment" in n or n == "caudate lobe of liver":
        return ("digestion", "liver", "organ", "liver")
    if n == "gallbladder" or has(n, "biliary tree", "hepatic duct", "cystic duct", "duct of caudate lobe"):
        return ("digestion", "gallbladder", "vessel" if "gallbladder" not in n else "organ", "bile")
    if n in ("parenchyma of pancreas", "pancreatic duct"):
        return None
    if "pancrea" in n:
        return ("digestion", "pancreas", "organ" if "duct" not in n else "vessel", "pancreas" if "duct" not in n else "duct")
    if has(n, "duodenum", "jejunum", "ileum", "ileocecal"):
        return ("digestion", "smallgut", "organ", "smallgut")
    if has(n, "colon", "appendix", "rectum", "taenia"):
        return ("digestion", "largegut", "organ", "largegut")
    return None


def classify(p, old):
    """p: atlas part; old: (group, tissue) from the old part map or None. Returns a list of assignments."""
    name = p["name"]
    n = base(name)
    sysname = p["system"]
    group = old[0] if old else None
    out = []

    if sysname in ("integumentary", "reproductive"):
        return out
    if n in ("urethra",):
        return out

    if sysname == "skeletal":
        if has(n, *MISFILED_MUSCLES):
            r = muscle(n)
        elif has(n, *LARYNX_CART) or has(n, *NOSE):
            r = breathing(n, sysname)
        else:
            r = skeleton(n, sysname, group)
        if r:
            out.append(r)
        return out

    if sysname == "connective":
        if "calcaneal tendon" in n:
            out.append(("muscles", "calves", "muscle", "tendon"))
        elif "tensor fasciae latae" in n:
            out.append(("muscles", "other", "muscle", "muscle"))
        elif has(n, "vocal ligament", "conus elasticus"):
            out.append(("breathing", "voicebox", "organ", "throat"))
        return out

    if sysname == "muscular":
        if n == "diaphragm" or has(n, *LARYNX_MUSCLES):
            r = breathing(n, sysname)
        elif "papillary muscle" in n:
            r = ("cardio", "ventricles", "organ", "papillary")
        else:
            r = muscle(n)
        if r:
            out.append(r)
        return out

    if sysname == "respiratory":
        r = breathing(n, sysname, name)
        if r:
            out.append(r)
        return out

    if sysname in ("nervous", "sensory"):
        if sysname == "sensory" and not has(n, *EYE):
            return out
        r = nervous(n)
        if r:
            out.append(r)
            if "hypothalamus" in n:
                out.append(("endocrine", "hypothalamus", "brain", "gland"))
        return out

    if sysname == "cardiac":
        if has(n, *VENTRICLES):
            r = nervous(n)
        else:
            r = cardio(n, sysname)
        if r:
            out.append(r)
        return out

    if sysname in ("arterial", "venous"):
        if "hepatovenous segment" in n:
            out.append(("digestion", "liver", "organ", "liver"))
            return out
        r = cardio(n, sysname)
        if r:
            out.append(r)
        return out

    if sysname == "digestive":
        r = digestion(n, sysname)
        if r:
            out.append(r)
            if r[1] == "pancreas" and "duct" not in n:
                out.append(("endocrine", "pancreas", "organ", "pancreas"))
        return out

    if sysname == "urinary":
        if "kidney" in n:
            out.append(("urinary", "kidneys", "organ", "kidney"))
        elif "ureter" in n:
            out.append(("urinary", "ureters", "vessel", "ureter"))
        elif "bladder" in n:
            out.append(("urinary", "bladder", "organ", "bladder"))
        return out

    if sysname == "endocrine":
        if "pituitary" in n:
            out.append(("endocrine", "pituitary", "organ", "gland"))
        elif "pineal" in n:
            out.append(("endocrine", "pineal", "organ", "gland"))
        elif "adrenal" in n:
            out.append(("endocrine", "adrenals", "organ", "gland"))
        return out

    if sysname == "lymphatic":
        if "thymus" in n:
            out.append(("immune", "thymus", "organ", "thymus"))
        elif "spleen" in n:
            out.append(("immune", "spleen", "organ", "spleen"))
        return out

    return out
