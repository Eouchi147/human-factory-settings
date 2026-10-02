/* How the body moves: the controls a person can turn, their real limits, and how one movement spreads over the
   joints that share it. Pure maths (three's Quaternion only), so the same model can drive the site and the films.

   Every limit comes from a published measurement (research/joint-motion.md in the project; row ids in brackets, e.g.
   [SP22]). Where a source gives only a total, or a share has to be split, the comment says so ("our arithmetic").
   Where no source gives a number, the joint does not move that way (it is never guessed).

   Axes, in the body's own frame at rest (standing, anatomical position): x toward the body's left, y up, z forward.
   A bone's rotation is relative to its parent, about axes fixed in the parent. */
import * as THREE from "three";

const DEG = Math.PI / 180;
export type Side = "R" | "L";
export type Pose = Record<string, number>; // control id -> degrees (or millimetres for the jaw)

export type Control = {
  id: string;
  region: string; // panel it belongs to
  label: string; // what it does, in plain words
  neg: string; // the label at the low end
  pos: string; // the label at the high end
  min: number;
  max: number;
  /** where the play button swings between (a typical healthy adult), when it differs from the limits */
  play?: [number, number];
  unit?: "deg" | "mm";
  side?: Side;
  note?: string; // shown in the advanced panel
  src: string; // research rows
};

const sides: Side[] = ["R", "L"];
const sideName = (s: Side) => (s === "R" ? "Right" : "Left");

// ------------------------------------------------------------------ the spine, level by level
// Each level: [joint id, flexion, extension, side bend each side, rotation each side]; joint "X" turns the vertebra X
// on the one below (the head turns on the atlas).
type Level = { j: string; flex: number; ext: number; lb: number; ar: number };
// upper neck: occiput-C1 and C1-C2 [SP1, SP2 in vitro for bending; SP6 in vivo for rotation]
const UPPER: Level[] = [
  { j: "head", flex: 3.5, ext: 21.0, lb: 5.5, ar: 1.7 },
  { j: "C1", flex: 11.5, ext: 10.9, lb: 6.7, ar: 36.2 },
];
// lower neck, C2-C3 to C7-T1. Flexion and extension: each level's total arc [SP11, in vivo], split half and half as the
// neck's own totals are (45 and 45 [SP29]) (our arithmetic). Rotation [SP12, in vivo]. Side bend [SP13, in vivo] for
// C3-C4 to C6-C7; no level value was verified for C2-C3 and C7-T1, so they do not side-bend. C7-T1 has no verified
// flexion value, so it does not flex.
const LOWER: Level[] = [
  { j: "C2", flex: 3.05, ext: 3.05, lb: 0, ar: 2.2 },
  { j: "C3", flex: 3.7, ext: 3.7, lb: 6.4, ar: 4.5 },
  { j: "C4", flex: 4.65, ext: 4.65, lb: 5.2, ar: 4.6 },
  { j: "C5", flex: 4.85, ext: 4.85, lb: 6.1, ar: 4.0 },
  { j: "C6", flex: 4.45, ext: 4.45, lb: 6.1, ar: 1.6 },
  { j: "C7", flex: 0, ext: 0, lb: 0, ar: 1.5 },
];
// subaxial coupling during head rotation [SP12]: side bend toward the turn, and a little extension or flexion (degrees at
// full rotation, per level)
const LOWER_AR_LB = [3.6, 5.4, 5.0, 5.3, 4.9, 1.2];
const LOWER_AR_FE = [-1.4, -2.3, -1.5, 0.9, 2.4, 3.0]; // + flexion, - extension
// thoracic, T1-T2 to T12-L1. Rotation [SP19, in vivo]; T12-L1 from the lumbar study [SP25]. Flexion/extension and side
// bend have no living per-level values; the isolated segments' passive range [SP20, in vitro, totals of both directions]
// is halved for each direction (our arithmetic), and the panel says these are passive, isolated-segment limits.
const TH_FE = [13.8, 8.2, 6.9, 7.4, 7.6, 7.6, 5.6, 7.4, 7.0, 6.8, 6.8, 0];
const TH_LB = [11.8, 10.2, 10.8, 10.4, 11.0, 11.2, 7.4, 8.6, 8.8, 8.6, 8.0, 0];
const TH_AR = [1.2, 1.6, 1.4, 1.8, 1.9, 2.3, 2.5, 2.7, 2.6, 2.6, 1.3, 1.3];
const THOR: Level[] = TH_AR.map((ar, k) => ({ j: `T${k + 1}`, flex: TH_FE[k] / 2, ext: TH_FE[k] / 2, lb: TH_LB[k] / 2, ar }));
// lumbar, L1-L2 to L5-S1: flexion/extension arcs 14, 14, 14, 18, 14 [SP22], split by the living lumbar spine's own
// ratio of flexion to extension, 73 to 29 [SP32] (our arithmetic); side bend 10, 10, 10, 6, 3 total [SP22], halved for
// each side [SP22: no right/left difference]; rotation each side [SP25]
const LFE = [14, 14, 14, 18, 14], LLB = [10, 10, 10, 6, 3], LAR = [1.6, 1.5, 2.0, 2.1, 1.7];
const FSHARE = 73 / (73 + 29);
const LUMB: Level[] = LFE.map((fe, k) => ({ j: `L${k + 1}`, flex: fe * FSHARE, ext: fe * (1 - FSHARE), lb: LLB[k] / 2, ar: LAR[k] }));
// coupling during trunk rotation [SP43]: lumbar levels side-bend (+ toward the turn, - away) and flex
const LUMB_AR_LB = [-2.0, -3.6, -3.8, -1.9, 0.8], LUMB_AR_FL = [1.0, 1.5, 1.5, 1.2, 2.5];
const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
const tot = (L: Level[], k: keyof Omit<Level, "j">) => sum(L.map((l) => l[k]));

// ------------------------------------------------------------------ the controls
export const CONTROLS: Control[] = [
  { id: "neckU.fe", region: "Upper neck", label: "Nod", neg: "Back", pos: "Forward", min: -tot(UPPER, "ext"), max: tot(UPPER, "flex"), src: "SP1, SP2", note: "The skull rocks on the atlas mostly backward; the atlas on the axis both ways." },
  { id: "neckU.lb", region: "Upper neck", label: "Tilt", neg: "Left", pos: "Right", min: -tot(UPPER, "lb"), max: tot(UPPER, "lb"), src: "SP1, SP2, SP7", note: "As the head tilts, the atlas turns the other way on the axis." },
  { id: "neckU.ar", region: "Upper neck", label: "Turn", neg: "Left", pos: "Right", min: -tot(UPPER, "ar"), max: tot(UPPER, "ar"), src: "SP6, SP33", note: "The atlas turning on the axis does about half of all head turning; both joints tilt the other way and lean back a little as it turns." },
  { id: "neckL.fe", region: "Lower neck", label: "Bend", neg: "Back", pos: "Forward", min: -tot(LOWER, "ext"), max: tot(LOWER, "flex"), src: "SP11, SP29" },
  { id: "neckL.lb", region: "Lower neck", label: "Side bend", neg: "Left", pos: "Right", min: -tot(LOWER, "lb"), max: tot(LOWER, "lb"), src: "SP13, SP36", note: "Each level also turns toward the bend, about half as much." },
  { id: "neckL.ar", region: "Lower neck", label: "Turn", neg: "Left", pos: "Right", min: -tot(LOWER, "ar"), max: tot(LOWER, "ar"), src: "SP12, SP35", note: "Each level also bends toward the turn." },
  { id: "thor.fe", region: "Thoracic spine", label: "Bend", neg: "Back", pos: "Forward", min: -tot(THOR, "ext"), max: tot(THOR, "flex"), src: "SP20", note: "Passive range of the isolated segments (laboratory); in a living back the ribs keep it smaller." },
  { id: "thor.lb", region: "Thoracic spine", label: "Side bend", neg: "Left", pos: "Right", min: -tot(THOR, "lb"), max: tot(THOR, "lb"), src: "SP20", note: "Passive range of the isolated segments (laboratory)." },
  { id: "thor.ar", region: "Thoracic spine", label: "Turn", neg: "Left", pos: "Right", min: -tot(THOR, "ar"), max: tot(THOR, "ar"), src: "SP19, SP25", note: "The middle of the thoracic spine turns most." },
  { id: "lumb.fe", region: "Lower back", label: "Bend", neg: "Back", pos: "Forward", min: -tot(LUMB, "ext"), max: tot(LUMB, "flex"), src: "SP22, SP32", note: "L4-L5 moves most." },
  { id: "lumb.lb", region: "Lower back", label: "Side bend", neg: "Left", pos: "Right", min: -tot(LUMB, "lb"), max: tot(LUMB, "lb"), src: "SP22", note: "The lowest levels bend least." },
  { id: "lumb.ar", region: "Lower back", label: "Turn", neg: "Left", pos: "Right", min: -tot(LUMB, "ar"), max: tot(LUMB, "ar"), src: "SP25, SP43", note: "Only about 2 degrees per level; as it turns, the upper levels bend away and every level flexes a little." },
  { id: "jaw.open", region: "Jaw", label: "Open", neg: "Closed", pos: "Open", min: 0, max: 50, play: [0, 45], unit: "mm", src: "JW1, JW2", note: "Measured as the gap between the front teeth." },
];
for (const s of sides) {
  const N = sideName(s);
  CONTROLS.push(
    { id: `sh${s}.fe`, side: s, region: `${N} shoulder`, label: "Raise forward", neg: "Back", pos: "Up", min: -60, max: 180, play: [-45, 170], src: "SH1, SH2, SH3", note: "Past about 30 degrees the shoulder blade turns upward too: about 2 to 1 overall [SH7, SH10, SH11]." },
    { id: `sh${s}.ab`, side: s, region: `${N} shoulder`, label: "Raise to the side", neg: "In", pos: "Out", min: -40, max: 180, play: [0, 170], src: "SH2, SH3", note: "Across the front 40 degrees is not an AAOS value [SH3]." },
    { id: `sh${s}.ar`, side: s, region: `${N} shoulder`, label: "Turn the arm", neg: "In", pos: "Out", min: -70, max: 90, src: "SH2" },
    { id: `el${s}.fe`, side: s, region: `${N} elbow and forearm`, label: "Bend the elbow", neg: "Straight", pos: "Bent", min: -1, max: 150, play: [0, 145], src: "EL1, EL2, EL3" },
    { id: `fa${s}.pr`, side: s, region: `${N} elbow and forearm`, label: "Turn the palm", neg: "Down", pos: "Up", min: -77, max: 85, play: [-75, 85], src: "FA1, FA2", note: "0 is thumb up. The radius rolls around the ulna." },
    { id: `wr${s}.fe`, side: s, region: `${N} wrist`, label: "Bend the wrist", neg: "Back", pos: "Forward", min: -70, max: 80, play: [-66, 74], src: "WR1, WR2" },
    { id: `wr${s}.dv`, side: s, region: `${N} wrist`, label: "Tilt the hand", neg: "Thumb side", pos: "Little finger side", min: -19, max: 28, src: "WR2" },
    { id: `hp${s}.fe`, side: s, region: `${N} hip`, label: "Lift the thigh", neg: "Back", pos: "Forward", min: -26, max: 141, play: [-17, 130], src: "HP1, HP2, HP3", note: "With the knee bent." },
    { id: `hp${s}.ab`, side: s, region: `${N} hip`, label: "Leg out", neg: "In", pos: "Out", min: -31, max: 48, play: [-29, 40], src: "HP3, HP5" },
    { id: `hp${s}.ar`, side: s, region: `${N} hip`, label: "Turn the leg", neg: "In", pos: "Out", min: -38, max: 48, play: [-38, 41], src: "HP3, HP5" },
    { id: `kn${s}.fe`, side: s, region: `${N} knee`, label: "Bend the knee", neg: "Straight", pos: "Bent", min: -2, max: 144, play: [0, 138], src: "KN1, KN2, KN3", note: "Straightening, the shin turns outward about 11 degrees in the last 40 (the screw-home) [KN8]; the kneecap turns about 0.6 times as much as the knee [KN10]." },
    { id: `kn${s}.ar`, side: s, region: `${N} knee`, label: "Turn the shin", neg: "In", pos: "Out", min: -13, max: 27, src: "KN5", note: "Only with the knee bent: none when straight, all of it at 90 degrees." },
    { id: `an${s}.fe`, side: s, region: `${N} ankle`, label: "Point the foot", neg: "Up", pos: "Down", min: -20, max: 62, play: [-13, 55], src: "AN1, AN2, AN4", note: "About an axis through the tips of the two ankle bones." },
    { id: `an${s}.iv`, side: s, region: `${N} ankle`, label: "Roll the foot", neg: "Out", pos: "In", min: -18, max: 32, src: "ST1, ST3" },
    { id: `to${s}.fe`, side: s, region: `${N} ankle`, label: "Bend the toes", neg: "Up", pos: "Down", min: -70, max: 45, src: "MT1", note: "The big toe's joint at the ball of the foot; the other toes move with it here." },
  );
}
export const CONTROL = new Map(CONTROLS.map((c) => [c.id, c]));
export const REGIONS = [...new Set(CONTROLS.map((c) => c.region))];
export const neutral = (): Pose => Object.fromEntries(CONTROLS.map((c) => [c.id, c.id.startsWith("fa") ? 85 : 0]));

// ------------------------------------------------------------------ the rig the model brings (from rig.json)
export type RigJoint = { id: string; parent: string | null; pivot: [number, number, number] };
export type Rig = {
  joints: RigJoint[];
  landmarks: Record<string, [number, number, number]>;
  /** the shoulder blade's own axes: the normal to its body (forward) and the line across it (toward the body's left) */
  axes?: Record<string, [number, number, number]>;
  floor?: number;
  /** where the body's mass is: each segment's centre of mass at rest, the joint it rides and its share [BM1] */
  masses?: { seg: string; joint: string; pos: [number, number, number]; m: number }[];
};

const v3 = (a: [number, number, number]) => new THREE.Vector3(a[0], a[1], a[2]);
const _q = new THREE.Quaternion(), _a = new THREE.Quaternion(), _b = new THREE.Quaternion(), _c = new THREE.Quaternion();
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const ss = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/** One spine level: flexion about x, side bend about z, rotation about y (degrees; + flexion, + bend and turn to the
    right). Right side bend tips the top toward -x: about +z. Turning right brings the front toward -x: about -y. */
function levelQ(out: THREE.Quaternion, fe: number, lb: number, ar: number) {
  out.setFromAxisAngle(X, fe * DEG);
  out.multiply(_a.setFromAxisAngle(Z, lb * DEG));
  out.multiply(_b.setFromAxisAngle(Y, -ar * DEG));
  return out;
}
/** spread a regional angle over its levels in proportion to each level's own range in that direction */
const share = (v: number, L: Level[], pos: keyof Omit<Level, "j">, neg: keyof Omit<Level, "j">) => {
  const k = v >= 0 ? pos : neg, t = tot(L, k) || 1;
  return L.map((l) => (v * l[k]) / t);
};

// ------------------------------------------------------------------ what the solver needs from a rig, worked out once
type Prep = {
  ids: string[]; at: Map<string, number>; parent: number[]; piv: THREE.Vector3[]; off: THREE.Vector3[];
  wq: THREE.Quaternion[]; wp: THREE.Vector3[];
  mj: number[]; mp: THREE.Vector3[]; mm: number[]; M: number; com0: THREE.Vector3;
  ax: Record<string, THREE.Vector3>; P0: THREE.Vector3;
  /** each foot: where it stands (heel, the ball under the metatarsal heads), the elbow's bend at rest */
  heel: Record<Side, THREE.Vector3>; ball: Record<Side, THREE.Vector3>; toe2: Record<Side, THREE.Vector3>; elRest: Record<Side, number>;
};
const PREP = new WeakMap<Rig, Prep>();
const axisX = (v: THREE.Vector3) => (v.x < 0 ? v.negate() : v).normalize(); // every hinge axis points to the body's left
function prep(rig: Rig): Prep {
  let P = PREP.get(rig);
  if (P) return P;
  const ids = rig.joints.map((j) => j.id), at = new Map(ids.map((id, i) => [id, i]));
  const piv = rig.joints.map((j) => v3(j.pivot));
  const parent = rig.joints.map((j) => (j.parent ? at.get(j.parent)! : -1));
  const off = piv.map((p, i) => (parent[i] < 0 ? p.clone() : p.clone().sub(piv[parent[i]])));
  const L = (k: string) => v3(rig.landmarks[k]);
  const ax: Record<string, THREE.Vector3> = {};
  for (const s of sides) {
    ax[`el${s}`] = axisX(L(`latEpiH${s}`).sub(L(`medEpiH${s}`)));
    ax[`kn${s}`] = axisX(L(`latEpi${s}`).sub(L(`medEpi${s}`)));
    ax[`an${s}`] = axisX(L(`latMall${s}`).sub(L(`medMall${s}`)));
    ax[`to${s}`] = axisX(L(`mth1${s}`).sub(L(`mth5${s}`)));
    ax[`pr${s}`] = L(`ulnarHead${s}`).sub(piv[at.get(`rad${s}`)!]).normalize();
    // the shoulder blade: without measured axes, fall back to the body's own (frontal plane)
    ax[`scN${s}`] = rig.axes?.[`scapN${s}`] ? v3(rig.axes[`scapN${s}`]).normalize() : Z.clone();
    ax[`scZ${s}`] = rig.axes?.[`scapZ${s}`] ? v3(rig.axes[`scapZ${s}`]).normalize() : X.clone();
  }
  const heel = {} as Record<Side, THREE.Vector3>, ball = {} as Record<Side, THREE.Vector3>, toe2 = {} as Record<Side, THREE.Vector3>, elRest = {} as Record<Side, number>;
  for (const s of sides) {
    heel[s] = rig.landmarks[`heel${s}`] ? L(`heel${s}`) : piv[at.get(`foot${s}`)!].clone();
    ball[s] = rig.landmarks[`mth1${s}`] ? L(`mth1${s}`).add(L(`mth5${s}`)).multiplyScalar(0.5) : piv[at.get(`foot${s}`)!].clone();
    toe2[s] = rig.landmarks[`mth1${s}`] ? L(`mth1${s}`).lerp(L(`mth5${s}`), 0.25) : ball[s].clone(); // about the second toe's line
    // the model's elbows rest a little bent: measure it, so 0 on the control is a straight elbow
    const gh = piv[at.get(`hum${s}`)!], el = L(`latEpiH${s}`).add(L(`medEpiH${s}`)).multiplyScalar(0.5), wr = piv[at.get(`hand${s}`)!];
    const a = ax[`el${s}`], u = el.clone().sub(gh).projectOnPlane(a).normalize(), f = wr.clone().sub(el).projectOnPlane(a).normalize();
    elRest[s] = Math.atan2(u.clone().cross(f).dot(a), u.dot(f)) / DEG * -1;
  }
  const ms = rig.masses ?? [];
  const mj = ms.map((m) => at.get(m.joint) ?? 0), mp = ms.map((m) => v3(m.pos)), mm = ms.map((m) => m.m);
  const M = mm.reduce((s2, x) => s2 + x, 0) || 1;
  const com0 = mp.reduce((c, p, i) => c.addScaledVector(p, mm[i]), new THREE.Vector3()).divideScalar(M);
  P = { ids, at, parent, piv, off, wq: ids.map(() => new THREE.Quaternion()), wp: ids.map(() => new THREE.Vector3()), mj, mp, mm, M, com0, ax, P0: piv[0].clone(), heel, ball, toe2, elRest };
  PREP.set(rig, P);
  return P;
}
/** forward kinematics: every joint's rotation and position in the model's frame */
function fk(P: Prep, q: Map<string, THREE.Quaternion>, rootPos: THREE.Vector3) {
  for (let i = 0; i < P.ids.length; i++) {
    const l = q.get(P.ids[i])!, pi = P.parent[i];
    if (pi < 0) { P.wq[i].copy(l); P.wp[i].copy(rootPos); }
    else { P.wq[i].copy(P.wq[pi]).multiply(l); P.wp[i].copy(P.off[i]).applyQuaternion(P.wq[pi]).add(P.wp[pi]); }
  }
}
const _t = new THREE.Vector3();
function centreOfMass(P: Prep, out: THREE.Vector3) {
  out.set(0, 0, 0);
  for (let k = 0; k < P.mj.length; k++) {
    const j = P.mj[k];
    out.addScaledVector(_t.copy(P.mp[k]).sub(P.piv[j]).applyQuaternion(P.wq[j]).add(P.wp[j]), P.mm[k]);
  }
  return out.divideScalar(P.M);
}
/** where a point fixed to a joint (given at rest) is now */
const worldOf = (P: Prep, j: number, rest: THREE.Vector3, out: THREE.Vector3) => out.copy(rest).sub(P.piv[j]).applyQuaternion(P.wq[j]).add(P.wp[j]);

export type Solved = {
  q: Map<string, THREE.Quaternion>;
  /** the arm's elevation angle and the shoulder blade's turn, for display; the balance shifts */
  info: Record<string, number>;
  /** where the pelvis (the hip joints' midpoint) moves, metres */
  root: THREE.Vector3;
};

/** Turn a pose (the controls) into each joint's rotation relative to its parent.
    Pseudo-controls the easy moves use (not sliders): "pelvis.fe" tips the pelvis over the legs; "squat" (0 to 1);
    "bal" (0 to 1) keeps the body's centre of mass over the feet, the feet flat on the floor; "stR"/"stL" (0 to 1) how much
    each foot carries; "rise" (degrees) rises onto the balls of the feet (or, below 0, rocks back onto the heels);
    "armsWk" (0 to 1) holds the arms at a direction in the room rather than to the trunk, "armsW" (0 hanging, 90 level). */
export function solve(rig: Rig, pose: Pose, out?: Solved): Solved {
  const P = prep(rig);
  const q = out?.q ?? new Map<string, THREE.Quaternion>();
  const info: Record<string, number> = out?.info ?? {};
  const root = (out?.root ?? new THREE.Vector3()).set(0, 0, 0);
  const get = (id: string) => { let r = q.get(id); if (!r) { r = new THREE.Quaternion(); q.set(id, r); } return r.identity(); };
  for (const id of P.ids) get(id);
  const C = (id: string) => pose[id] ?? 0;
  const J = (id: string) => P.piv[P.at.get(id)!];
  // ---- the spine: each region's three movements spread over its levels, plus the measured coupling
  const regions: [string, Level[]][] = [["neckU", UPPER], ["neckL", LOWER], ["thor", THOR], ["lumb", LUMB]];
  for (const [r, L] of regions) {
    const fe = share(C(`${r}.fe`), L, "flex", "ext"), lb = share(C(`${r}.lb`), L, "lb", "lb"), ar = share(C(`${r}.ar`), L, "ar", "ar");
    const fAR = C(`${r}.ar`) / (tot(L, "ar") || 1), fLB = C(`${r}.lb`) / (tot(L, "lb") || 1);
    L.forEach((l, k) => {
      let f = fe[k], b = lb[k], a = ar[k];
      if (r === "neckU") {   // turning: both joints tilt away and lean back [SP6]; tilting: the atlas turns the other way [SP7]
        b += -fAR * (l.j === "head" ? 4.1 : 3.8);
        f += -Math.abs(fAR) * (l.j === "head" ? 13.3 : 6.9);
        if (l.j === "C1") a += -fLB * 17.1;
      } else if (r === "neckL") {   // turning: each level bends toward the turn [SP12]; bending: each level turns toward it, about half [SP13]
        b += fAR * LOWER_AR_LB[k];
        f += Math.abs(fAR) * LOWER_AR_FE[k];
        if (l.lb > 0) a += 0.5 * lb[k];
      } else if (r === "lumb") {   // turning: side bend away or toward, and flexion [SP43]
        b += fAR * LUMB_AR_LB[k];
        f += Math.abs(fAR) * LUMB_AR_FL[k];
      }
      levelQ(get(l.j), f, b, a);
    });
  }
  // ---- the squat, in the side view: the shin leans forward to the ankle's limit (20 [AN4]), the thigh comes level;
  // hips and knees follow from the leg's own lengths, so the feet stay where they are
  const sq = clamp(C("squat"), 0, 1);
  const lean = 20 * sq, thigh = 90 * sq;
  let tip = 25 * sq + C("pelvis.fe");
  const rootPos = P.P0.clone();
  if (sq > 0) {   // turn the leg's own rest segments (so a squat of 0 is exactly standing)
    const A = J("footR"), K = A.clone().add(J("tibR").clone().sub(A).applyAxisAngle(X, lean * DEG));
    const H = K.clone().add(J("femR").clone().sub(J("tibR")).applyAxisAngle(X, -thigh * DEG));
    rootPos.y += H.y - J("femR").y; rootPos.z += H.z - J("femR").z;
  }
  // ---- the jaw: the front teeth sit about 10 cm from the jaw joint, so an opening of d mm is about d / 100 radians
  get("jaw").setFromAxisAngle(X, (C("jaw.open") / 1000 / 0.1));
  // the root's turn, and the legs' frontal tilt for balance (kept apart, so the hips can be re-solved)
  const rootQ = new THREE.Quaternion().setFromAxisAngle(X, tip * DEG), tiltF = new THREE.Quaternion(), femBase: Record<Side, THREE.Quaternion> = { R: new THREE.Quaternion(), L: new THREE.Quaternion() };
  // a foot planted on the floor: a small turn of the whole leg in the room and a change of knee bend that put the
  // ankle back where it stands (the knee's axis is oblique, so a bend in the side view alone would slide the foot)
  const legC: Record<Side, THREE.Quaternion> = { R: new THREE.Quaternion(), L: new THREE.Quaternion() }, kneeD: Record<Side, number> = { R: 0, L: 0 };
  const setHips = () => {
    q.get("pelvis")!.copy(rootQ);
    for (const s of sides) {
      const m = s === "R" ? -1 : 1;
      // hip: flexion, then abduction, then rotation (as a joint coordinate system); the tip of the pelvis is taken back
      femBase[s].setFromAxisAngle(X, -(C(`hp${s}.fe`) + tip + thigh) * DEG).multiply(_a.setFromAxisAngle(Z, m * C(`hp${s}.ab`) * DEG)).multiply(_b.setFromAxisAngle(Y, m * C(`hp${s}.ar`) * DEG));
      // the balance's frontal tilt and the planted-foot turn are turns in the room: fem = root^-1 * turn * root * base
      q.get(`fem${s}`)!.copy(rootQ).invert().multiply(legC[s]).multiply(tiltF).multiply(rootQ).multiply(femBase[s]);
    }
  };
  // ---- the shoulder: the arm's direction from the controls; the shoulder blade and collarbone follow the rhythm
  const arms = (feOver?: Record<Side, number>, abOver?: Record<Side, number>) => {
    for (const s of sides) {
      const m = s === "R" ? -1 : 1;
      const fe = feOver?.[s] ?? C(`sh${s}.fe`), ab = abOver?.[s] ?? C(`sh${s}.ab`), ar = C(`sh${s}.ar`);
      const arm = new THREE.Quaternion().setFromAxisAngle(X, -fe * DEG).multiply(_a.setFromAxisAngle(Z, m * ab * DEG)).multiply(_b.setFromAxisAngle(Y, m * ar * DEG));
      const dir = new THREE.Vector3(0, -1, 0).applyQuaternion(arm), elev = Math.acos(clamp(-dir.y, -1, 1)) / DEG;
      // scapulohumeral rhythm [SH7, SH10, SH11]: the first 30 degrees almost all at the shoulder joint, then 1.5 to 1, so
      // at 180 the shoulder joint gives about 120 and the shoulder blade about 60 (our arithmetic, as in the research notes)
      const st = elev <= 30 ? 0 : (elev - 30) * 0.4;
      const tilt = (st / 60) * 30, extRot = (st / 60) * 24; // posterior tilt up to about 30, external rotation up to about 24 [SH10]
      // the collarbone rises (middle of 6.5 to 11 [SH16], mostly by 90 [SH14]) and swings back (middle of 15 to 20,
      // starting at about 25 to 50 of elevation and mostly late [SH13, SH16])
      const clavEl = 8.75 * ss(0, 90, elev), clavRet = 17.5 * ss(40, 170, elev);
      const clav = get(`clav${s}`);
      clav.setFromAxisAngle(Z, m * clavEl * DEG).multiply(_a.setFromAxisAngle(Y, m * clavRet * DEG));
      // the shoulder blade on the chest, about its own axes in the ISB order (turn about the vertical, upward rotation
      // about the normal to its body, tilt about the line across it), measured against the trunk [SH10]
      const scapT = _c.setFromAxisAngle(Y, m * extRot * DEG).multiply(_a.setFromAxisAngle(P.ax[`scN${s}`], m * st * DEG)).multiply(_b.setFromAxisAngle(P.ax[`scZ${s}`], -tilt * DEG));
      get(`scap${s}`).copy(clav).invert().multiply(scapT);
      // the arm bone takes what is left: its rotation in the shoulder blade's frame
      get(`hum${s}`).copy(scapT).invert().multiply(arm);
      info[`elev${s}`] = elev; info[`gh${s}`] = elev - st; info[`st${s}`] = st;
    }
  };
  arms();
  // ---- knee: flexion about the line through the femur's epicondyles; the screw-home; shin rotation once bent; the kneecap
  const setKnee = (s: Side, kf: number) => {
    const m = s === "R" ? -1 : 1;
    const screw = -11.5 * Math.min(1, Math.max(0, kf) / 40); // unlocking: inward turn of the shin over the first 40 of flexion [KN8]
    const shin = C(`kn${s}.ar`) * Math.min(1, Math.max(0, kf) / 90);
    get(`tib${s}`).setFromAxisAngle(P.ax[`kn${s}`], kf * DEG).multiply(_a.setFromAxisAngle(Y, m * (screw + shin) * DEG));
    get(`pat${s}`).setFromAxisAngle(P.ax[`kn${s}`], 0.6 * kf * DEG); // [KN10]
  };
  for (const s of sides) {
    const m = s === "R" ? -1 : 1;
    // ---- elbow, forearm, wrist: the elbow about the line through its two epicondyles (0 is straight); the radius about
    // the line from its head to the head of the ulna; the wrist at the capitate
    get(`ulna${s}`).setFromAxisAngle(P.ax[`el${s}`], -(C(`el${s}.fe`) - P.elRest[s]) * DEG);
    get(`rad${s}`).setFromAxisAngle(P.ax[`pr${s}`], -m * (C(`fa${s}.pr`) - 85) * DEG); // rest is the anatomical position, palm forward (85)
    get(`hand${s}`).setFromAxisAngle(X, -C(`wr${s}.fe`) * DEG).multiply(_a.setFromAxisAngle(Z, -m * C(`wr${s}.dv`) * DEG));
    setKnee(s, C(`kn${s}.fe`) + thigh + lean);
    // ---- ankle: about the line through the tips of the malleoli; rolling about the foot's long axis; the toes
    get(`foot${s}`).setFromAxisAngle(P.ax[`an${s}`], (C(`an${s}.fe`) - lean) * DEG).multiply(_a.setFromAxisAngle(Z, -m * C(`an${s}.iv`) * DEG));
    if (q.has(`toes${s}`)) get(`toes${s}`).setFromAxisAngle(P.ax[`to${s}`], C(`to${s}.fe`) * DEG);
  }
  setHips();

  // ---- the whole body: arms that hang (or hold level) in the room, and balance over the feet
  const armsWk = clamp(C("armsWk"), 0, 1), bal = clamp(C("bal"), 0, 1), rise = C("rise");
  const iT3 = P.at.get("T3")!, idx = (id: string) => P.at.get(id)!;
  const holdArms = () => {
    if (armsWk <= 0) return;
    fk(P, q, rootPos);
    const aw = C("armsW") * DEG, inv = P.wq[iT3].clone().invert();
    const d = new THREE.Vector3(0, -Math.cos(aw), Math.sin(aw)).applyQuaternion(inv);
    const fe = {} as Record<Side, number>, ab = {} as Record<Side, number>;
    for (const s of sides) {
      const m = s === "R" ? -1 : 1;
      // the arm never goes through the trunk: it comes in until it brushes the side of the chest (the model's arms rest a
      // few degrees out from it); past that it swings forward and hangs in front of the body instead
      let feW = Math.atan2(d.z, -d.y) / DEG, abW = Math.asin(clamp(m * d.x, -1, 1)) / DEG;
      const over = Math.max(0, -6 - abW);
      abW = Math.max(abW, -6 - 0.5 * over); feW += 0.9 * over;
      fe[s] = C(`sh${s}.fe`) + (feW - C(`sh${s}.fe`)) * armsWk;
      ab[s] = C(`sh${s}.ab`) + (abW - C(`sh${s}.ab`)) * armsWk;
    }
    arms(fe, ab);
  };
  holdArms();
  // a foot on the floor stays flat however much weight it carries; a lifted foot (thigh or knee raised) goes with its leg
  const onFloor = (s: Side) => 1 - ss(2, 12, Math.max(C(`hp${s}.fe`), C(`kn${s}.fe`)));
  const plant = () => {
    if (sq <= 0) return;
    for (let it = 0; it < 2; it++) for (const s of sides) {
      if (onFloor(s) <= 0) continue;
      fk(P, q, rootPos);
      const H = P.wp[idx(`fem${s}`)], T = P.piv[idx(`foot${s}`)], dT = T.distanceTo(H);
      // the knee bend that gives the hip-to-ankle distance (it grows as the knee straightens): bisection
      const base = C(`kn${s}.fe`) + thigh + lean;
      const kq = q.get(`tib${s}`)!, kOff = P.off[idx(`foot${s}`)], fOff = P.off[idx(`tib${s}`)];
      let lo = -base, hi = 150 - base;
      for (let b = 0; b < 22; b++) {
        const mid = (lo + hi) / 2;
        setKnee(s, base + mid);
        const dd = _t.copy(kOff).applyQuaternion(kq).add(fOff).length();
        if (dd > dT) lo = mid; else hi = mid;
      }
      kneeD[s] = (lo + hi) / 2; setKnee(s, base + kneeD[s]);
      fk(P, q, rootPos);
      const A = P.wp[idx(`foot${s}`)];
      const r = new THREE.Quaternion().setFromUnitVectors(A.clone().sub(H).normalize(), T.clone().sub(H).normalize());
      legC[s].premultiply(r); setHips();
      // and the knee goes the way the foot points: seen from above, over the line from the ankle through the second toe
      // (turning the leg about the hip-ankle line, which leaves the foot where it is)
      fk(P, q, rootPos);
      const u = T.clone().sub(H).normalize(), K0 = P.wp[idx(`tib${s}`)].clone().sub(H);
      const fh = P.toe2[s].clone().sub(T).setY(0).normalize();
      const g = (ph: number) => { const k = K0.clone().applyAxisAngle(u, ph).add(H).sub(T); return k.z * fh.x - k.x * fh.z; };
      if (K0.clone().projectOnPlane(u).length() > 0.02) {
        let a0 = -0.8, a1 = 0.8, g0 = g(a0);
        if (g0 * g(a1) < 0) {
          for (let b = 0; b < 24; b++) { const mid = (a0 + a1) / 2, gm = g(mid); if (gm * g0 > 0) { a0 = mid; g0 = gm; } else a1 = mid; }
          legC[s].premultiply(new THREE.Quaternion().setFromAxisAngle(u, (a0 + a1) / 2));
          setHips();
        }
      }
    }
  };
  plant();
  // rising onto the balls of the feet (or rocking onto the heels): the body lifts so that point stays on the floor
  const wR = clamp(pose.stR ?? 1, 0, 1), wL = clamp(pose.stL ?? 1, 0, 1), wS = wR + wL || 1;
  const w: Record<Side, number> = { R: wR / wS, L: wL / wS };
  const contact = (s: Side) => (rise > 0 ? P.ball[s] : rise < 0 ? P.heel[s] : P.piv[idx(`foot${s}`)]);
  // how each planted foot sits in the room: its own controls, as if the shin were upright, and the rise
  const footW = {} as Record<Side, THREE.Quaternion>;
  for (const s of sides) {
    const m = s === "R" ? -1 : 1;
    footW[s] = new THREE.Quaternion().setFromAxisAngle(X, rise * DEG).multiply(_a.setFromAxisAngle(P.ax[`an${s}`], C(`an${s}.fe`) * DEG)).multiply(_b.setFromAxisAngle(Z, -m * C(`an${s}.iv`) * DEG));
  }
  const setFeet = (lean: THREE.Quaternion | null) => {
    fk(P, q, rootPos);
    for (const s of sides) {
      const k = onFloor(s);
      if (k <= 0) continue;
      const want = lean ? lean.clone().multiply(footW[s]) : footW[s];
      q.get(`foot${s}`)!.slerp(P.wq[idx(`tib${s}`)].clone().invert().multiply(want), k);
    }
  };
  if (bal > 0 || rise !== 0) setFeet(null);
  if (rise !== 0) {
    fk(P, q, rootPos);
    const d = new THREE.Vector3();
    for (const s of sides) d.addScaledVector(contact(s).clone().sub(worldOf(P, idx(`foot${s}`), contact(s), _t)), w[s]);
    rootPos.add(d);
  }
  const sagQ = new THREE.Quaternion(); // the whole body's lean about the feet, for the feet on their balls
  if (bal > 0 && P.mj.length) {
    const c = new THREE.Vector3(), tgt = new THREE.Vector3(), piv = new THREE.Vector3(), e = new THREE.Vector3();
    // where the centre of mass must be: over the feet that carry the weight (front to back: as at rest, or over the balls
    // or the heels when standing on them)
    const fz = rise > 0 ? ss(0, 5, rise) : rise < 0 ? ss(0, 5, -rise) : 0;
    for (const s of sides) {
      const sx = (P.heel[s].x + P.ball[s].x) / 2;
      tgt.x += w[s] * sx;
      tgt.z += w[s] * (P.com0.z + (contact(s).z - P.com0.z) * fz);
      piv.addScaledVector(contact(s), w[s]);
    }
    tgt.x += P.com0.x - (P.heel.R.x + P.ball.R.x + P.heel.L.x + P.ball.L.x) / 4; // at rest, on both feet, nothing moves
    for (let it = 0; it < 4; it++) {
      // front to back: in a squat the trunk leans over the knees; otherwise the whole body leans about the ankles
      fk(P, q, rootPos); centreOfMass(P, c);
      if (sq > 0) {   // squatting, the trunk leans to do it (blending in over the first part of the squat)
        const t0 = tip, wq = ss(0, 0.15, sq);
        tip = t0 + 1; rootQ.setFromAxisAngle(X, tip * DEG).premultiply(sagQ); setHips(); holdArms(); fk(P, q, rootPos); centreOfMass(P, e);
        const slope = (e.z - c.z) || 1e-4;
        tip = clamp(t0 + ((tgt.z - c.z) / slope) * bal * wq, -10, 80);
        rootQ.setFromAxisAngle(X, tip * DEG).premultiply(sagQ); setHips(); plant(); holdArms();
        fk(P, q, rootPos); centreOfMass(P, c);
      }
      { // whatever is left, the whole body leans about the ankles (or the balls of the feet)
        const h = Math.max(0.3, c.y - piv.y), al = Math.asin(clamp(((tgt.z - c.z) / h) * bal, -0.4, 0.4));
        const r = new THREE.Quaternion().setFromAxisAngle(X, al);
        sagQ.premultiply(r); rootQ.premultiply(r);
        rootPos.sub(piv).applyQuaternion(r).add(piv);
        setHips(); plant(); holdArms();
      }
      // side to side: both legs lean like a parallelogram, so the pelvis slides over the foot that carries the weight
      fk(P, q, rootPos); centreOfMass(P, c);
      const hipH = Math.max(0.3, J("femR").y - piv.y), be = -Math.asin(clamp(((tgt.x - c.x) / hipH) * bal, -0.35, 0.35));
      const r = new THREE.Quaternion().setFromAxisAngle(Z, be);
      const dh = new THREE.Vector3();
      let kw = 0;
      for (const s of sides) {   // the pelvis follows the legs that stand on the floor
        const A = P.wp[idx(`foot${s}`)], H = P.wp[idx(`fem${s}`)], k = onFloor(s) + 1e-3;
        dh.addScaledVector(H.clone().sub(A).applyQuaternion(r).add(A).sub(H), k); kw += k;
      }
      tiltF.premultiply(r); rootPos.addScaledVector(dh, 1 / kw); setHips(); plant(); holdArms();
    }
    fk(P, q, rootPos); centreOfMass(P, c);
    info.comX = c.x; info.comZ = c.z;
  }
  // the feet keep their place on the floor: flat feet keep their turn in the room; on the balls of the feet the foot
  // leans with the body and the toes stay flat
  if (bal > 0 || rise !== 0) {
    setFeet(rise > 0 ? sagQ : null);
    if (rise > 0) {
      fk(P, q, rootPos);
      for (const s of sides) if (q.has(`toes${s}`)) q.get(`toes${s}`)!.slerp(P.wq[idx(`foot${s}`)].clone().invert(), ss(0, 5, rise) * onFloor(s));
    }
  }
  root.copy(rootPos).sub(P.P0);
  info.squat = sq; info.tip = tip;
  return { q, info, root };
}

// ------------------------------------------------------------------ easy mode: one-tap movements
/** view: where the camera goes for this move: turn (degrees, + toward the body's left side), tilt, the point it looks at
    (metres, model frame) and how far it stands */
/** w: how wide (metres) the subject is, so a narrow screen can step back far enough to show it whole */
export type View = { turn: number; tilt: number; at: [number, number, number]; dist: number; w?: number };
export type Move = { id: string; label: string; keys: { at: number; pose: Pose }[]; loop?: boolean; note?: string; view?: View };
const V = (turn: number, tilt: number, at: [number, number, number], dist: number, w = 0.9): View => ({ turn, tilt, at, dist, w });
export const HOME_VIEW = V(-20, 6, [0, 0.93, 0], 5.2, 0.9);
const P = (o: Pose) => o;
// every easy move stands on the floor: the body keeps its weight over the feet ("bal"), and relaxed arms hang ("armsWk")
const B = (o: Pose): Pose => ({ bal: 1, ...o });
const H = (o: Pose): Pose => ({ bal: 1, armsWk: 1, armsW: 0, ...o });
export const MOVES: Move[] = [
  { id: "nod", label: "Nod", view: V(-70, 4, [0, 1.47, 0.02], 1.55, 0.35), keys: [{ at: 0, pose: H({}) }, { at: 0.5, pose: H({ "neckU.fe": 12, "neckL.fe": 14 }) }, { at: 1.2, pose: H({ "neckU.fe": -22, "neckL.fe": -12 }) }, { at: 1.8, pose: H({}) }], loop: true },
  { id: "turn", label: "Look over the shoulder", view: V(-25, 22, [0, 1.5, 0], 1.45, 0.4), keys: [{ at: 0, pose: H({}) }, { at: 1, pose: H({ "neckU.ar": 34, "neckL.ar": 17 }) }, { at: 2.2, pose: H({ "neckU.ar": -34, "neckL.ar": -17 }) }, { at: 3.2, pose: H({}) }], loop: true },
  { id: "tilt", label: "Tilt the head", view: V(0, 6, [0, 1.47, 0], 1.5, 0.42), keys: [{ at: 0, pose: H({}) }, { at: 1, pose: H({ "neckU.lb": 10, "neckL.lb": 22 }) }, { at: 2.2, pose: H({ "neckU.lb": -10, "neckL.lb": -22 }) }, { at: 3.2, pose: H({}) }], loop: true },
  { id: "bend", label: "Bend forward", view: V(-85, 4, [0, 0.9, 0.05], 4.3, 1.25), keys: [{ at: 0, pose: H({}) }, { at: 1.6, pose: H({ "lumb.fe": 50, "thor.fe": 26, "neckL.fe": 14, "neckU.fe": 6, "pelvis.fe": 55 }) }, { at: 2.6, pose: H({ "lumb.fe": 50, "thor.fe": 26, "neckL.fe": 14, "neckU.fe": 6, "pelvis.fe": 55 }) }, { at: 4.2, pose: H({}) }], loop: true, note: "Most of a toe-touch is the hips: the pelvis tips over the legs while the back rounds, and the hips slide back to keep the weight over the feet." },
  { id: "arch", label: "Lean back", view: V(-85, 4, [0, 1.0, 0], 3.8, 0.8), keys: [{ at: 0, pose: H({}) }, { at: 1.4, pose: H({ "lumb.fe": -20, "thor.fe": -14, "neckL.fe": -14, "neckU.fe": -12, "pelvis.fe": -8 }) }, { at: 2.8, pose: H({}) }], loop: true, note: "The hips push forward as the back arches, so the body stays over the feet." },
  { id: "side", label: "Side bend", view: V(0, 4, [0, 1.0, 0], 4.0, 1.0), keys: [{ at: 0, pose: H({}) }, { at: 1.4, pose: H({ "lumb.lb": 13, "thor.lb": 30, "neckL.lb": 10 }) }, { at: 2.8, pose: H({}) }, { at: 4.2, pose: H({ "lumb.lb": -13, "thor.lb": -30, "neckL.lb": -10 }) }, { at: 5.6, pose: H({}) }], loop: true },
  { id: "twist", label: "Twist", view: V(-15, 38, [0, 1.15, 0], 3.4, 0.9), keys: [{ at: 0, pose: H({}) }, { at: 1.4, pose: H({ "lumb.ar": 8, "thor.ar": 22, "neckL.ar": 10, "neckU.ar": 18 }) }, { at: 2.8, pose: H({}) }, { at: 4.2, pose: H({ "lumb.ar": -8, "thor.ar": -22, "neckL.ar": -10, "neckU.ar": -18 }) }, { at: 5.6, pose: H({}) }], loop: true, note: "The lower back turns only about 2 degrees per level; the middle of the back does most of a twist." },
  { id: "reach", label: "Reach up", view: V(-160, 8, [0, 1.25, -0.02], 3.0, 0.8), keys: [{ at: 0, pose: B({}) }, { at: 1.8, pose: B({ "shR.fe": 170, "shL.fe": 170, "elR.fe": 5, "elL.fe": 5 }) }, { at: 3, pose: B({ "shR.fe": 170, "shL.fe": 170 }) }, { at: 4.6, pose: B({}) }], loop: true, note: "Watch the shoulder blades: past about 30 degrees they turn upward with the arm, and the collarbones lift and swing back." },
  { id: "wings", label: "Arms out to the side", view: V(-170, 8, [0, 1.3, -0.02], 3.0, 1.1), keys: [{ at: 0, pose: B({}) }, { at: 1.8, pose: B({ "shR.ab": 165, "shL.ab": 165, "shR.ar": 60, "shL.ar": 60 }) }, { at: 3, pose: B({ "shR.ab": 165, "shL.ab": 165, "shR.ar": 60, "shL.ar": 60 }) }, { at: 4.6, pose: B({}) }], loop: true, note: "To get the arm all the way up, the arm bone turns outward as it rises." },
  { id: "curl", label: "Bend the elbows", view: V(-60, 6, [0.14, 1.12, 0.05], 2.1, 0.6), keys: [{ at: 0, pose: B({}) }, { at: 1.2, pose: B({ "elR.fe": 140, "elL.fe": 140 }) }, { at: 2.4, pose: B({}) }], loop: true },
  { id: "palm", label: "Turn the palms", view: V(-25, 14, [0.12, 1.07, 0.12], 1.5, 0.5), keys: [{ at: 0, pose: B({ "elR.fe": 90, "elL.fe": 90, "faR.pr": 85, "faL.pr": 85 }) }, { at: 1.2, pose: B({ "elR.fe": 90, "elL.fe": 90, "faR.pr": -75, "faL.pr": -75 }) }, { at: 2.4, pose: B({ "elR.fe": 90, "elL.fe": 90, "faR.pr": 85, "faL.pr": 85 }) }], loop: true, note: "The radius rolls over the ulna; the ulna hardly moves." },
  { id: "knee", label: "Lift a knee", view: V(-60, 4, [0, 0.62, 0.1], 3.0, 0.8), keys: [{ at: 0, pose: H({}) }, { at: 0.7, pose: H({ stR: 0 }) }, { at: 1.8, pose: H({ stR: 0, "hpR.fe": 70, "knR.fe": 120 }) }, { at: 2.6, pose: H({ stR: 0, "hpR.fe": 70, "knR.fe": 120 }) }, { at: 3.7, pose: H({ stR: 0 }) }, { at: 4.4, pose: H({}) }], loop: true, note: "The weight goes onto the other foot first. As the knee straightens, the shin turns outward and locks (the screw-home); the kneecap glides in its groove." },
  { id: "squat", label: "Squat", view: V(-60, 6, [0, 0.7, 0.05], 3.6, 1.25), keys: [{ at: 0, pose: B({ armsWk: 1, armsW: 0 }) }, { at: 1.8, pose: B({ squat: 1, armsWk: 1, armsW: 90 }) }, { at: 2.6, pose: B({ squat: 1, armsWk: 1, armsW: 90 }) }, { at: 4.4, pose: B({ armsWk: 1, armsW: 0 }) }], loop: true, note: "To a level thigh, the shin leaning forward as far as the ankle allows (about 20 degrees); the trunk leans just enough to keep the weight over the feet." },
  { id: "rise", label: "Rise on the toes", view: V(-75, 6, [0, 0.42, 0.05], 2.9, 0.6), keys: [{ at: 0, pose: H({}) }, { at: 0.6, pose: H({ rise: 5 }) }, { at: 1.5, pose: H({ rise: 35 }) }, { at: 2.2, pose: H({ rise: 35 }) }, { at: 3.1, pose: H({ rise: 5 }) }, { at: 3.6, pose: H({}) }, { at: 4.3, pose: H({ rise: -12, "toR.fe": -20, "toL.fe": -20 }) }, { at: 5.1, pose: H({}) }], loop: true, note: "Up onto the balls of the feet: the toes bend back and stay on the floor. Then back onto the heels." },
  { id: "mouth", label: "Open the mouth", view: V(-35, 4, [0, 1.6, 0.05], 0.95, 0.24), keys: [{ at: 0, pose: H({}) }, { at: 1, pose: H({ "jaw.open": 45 }) }, { at: 2, pose: H({}) }], loop: true },
];

/** the pose a move reaches at time t (seconds into the move), eased between its keys */
export function moveAt(m: Move, t: number, out: Pose = {}): Pose {
  const K = m.keys, T = K[K.length - 1].at;
  let u = m.loop ? ((t % T) + T) % T : Math.min(T, t);
  let i = 0;
  while (i < K.length - 2 && K[i + 1].at <= u) i++;
  const a = K[i], b = K[i + 1], k = ss(a.at, b.at, u);
  for (const key of Object.keys(out)) delete out[key];
  const ids = new Set([...Object.keys(a.pose), ...Object.keys(b.pose)]);
  for (const id of ids) out[id] = (a.pose[id] ?? base(id)) * (1 - k) + (b.pose[id] ?? base(id)) * k;
  return out;
}
/** a control's resting value: the forearm rests palm forward (85); each foot carries its share of the weight */
export const restValue = (id: string) => (id.startsWith("fa") ? 85 : id === "stR" || id === "stL" ? 1 : 0);
const base = restValue;
