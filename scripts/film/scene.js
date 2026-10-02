// Human Factory Settings: the anatomy renderer (v2).
// Real geometry: BodyParts3D 4.0, (c) The Database Center for Life Science, CC BY 4.0.
// Adult male reference anatomy in metres, Y up, prepared by Sam's human-atlas project.
// Every frame is a pure function of time t: stills, 60 fps film frames (seeked), and the site.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

const H = (window.HFS = { ready: false, meshes: [], byName: new Map(), groups: new Map(), log: [], THREE });

// ------------------------------------------------------------------ tissue palette
export const TISSUE = {
  bone:      { color: 0xe4d9c2, roughness: 0.58, clearcoat: 0.18, clearcoatRoughness: 0.5, sheen: 0.25, sheenColor: 0xfff4e0 },
  tooth:     { color: 0xf2ede2, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 },
  cartilage: { color: 0xcfd6cf, roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3, sheen: 0.3, sheenColor: 0xeaf4ff },
  muscle:    { color: 0x9c3b34, roughness: 0.48, sheen: 0.7, sheenColor: 0xff9f8f, sheenRoughness: 0.45, clearcoat: 0.25 },
  heart:     { color: 0x97302b, roughness: 0.34, clearcoat: 0.55, clearcoatRoughness: 0.22, sheen: 0.5, sheenColor: 0xff8a7a },
  valve:     { color: 0xe9d6c6, roughness: 0.4, clearcoat: 0.4 },
  artery:    { color: 0xc92f28, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.18 },
  vein:      { color: 0x35489a, roughness: 0.32, clearcoat: 0.55, clearcoatRoughness: 0.2 },
  nerve:     { color: 0xe8bd48, roughness: 0.4, clearcoat: 0.35, clearcoatRoughness: 0.3 },
  brain:     { color: 0xdfb7ad, roughness: 0.52, sheen: 0.8, sheenColor: 0xffd9d0, sheenRoughness: 0.55, clearcoat: 0.2 },
  deepbrain: { color: 0xc98f86, roughness: 0.5, sheen: 0.6, sheenColor: 0xffc9bd },
  white:     { color: 0xece2d6, roughness: 0.6, sheen: 0.4, sheenColor: 0xffffff },
  airway:    { color: 0xe6bfb3, roughness: 0.42, clearcoat: 0.35, sheen: 0.4, sheenColor: 0xffe2d9 },
  gut:       { color: 0xd4906f, roughness: 0.4, clearcoat: 0.45, clearcoatRoughness: 0.22, sheen: 0.5, sheenColor: 0xffc9b1 },
  colon:     { color: 0xc98a6c, roughness: 0.42, clearcoat: 0.4, sheen: 0.4, sheenColor: 0xffc2aa },
  stomach:   { color: 0xd39283, roughness: 0.42, clearcoat: 0.45, sheen: 0.5, sheenColor: 0xffc8b8 },
  liver:     { color: 0x7b2a22, roughness: 0.36, clearcoat: 0.42, clearcoatRoughness: 0.26, sheen: 0.35, sheenColor: 0xff9a80 },
  pancreas:  { color: 0xe0b684, roughness: 0.55, sheen: 0.4, sheenColor: 0xfff0d0 },
  gall:      { color: 0x55773f, roughness: 0.28, clearcoat: 0.7 },
  duct:      { color: 0x6c8c4f, roughness: 0.35, clearcoat: 0.5 },
  kidney:    { color: 0x8a352c, roughness: 0.34, clearcoat: 0.55 },
  bladder:   { color: 0xd9bb98, roughness: 0.45, clearcoat: 0.35 },
  gland:     { color: 0xd49a44, roughness: 0.45, clearcoat: 0.3 },
  spleen:    { color: 0x672838, roughness: 0.36, clearcoat: 0.5 },
  thymus:    { color: 0xdeb59b, roughness: 0.55 },
  eye:       { color: 0xf1eee8, roughness: 0.18, clearcoat: 0.9, clearcoatRoughness: 0.06 },
  iris:      { color: 0x4a6f86, roughness: 0.3, clearcoat: 0.6 },
  diaphragm: { color: 0xa0453c, roughness: 0.46, sheen: 0.6, sheenColor: 0xff9f8f, clearcoat: 0.25, transparent: true, opacity: 0.8 },
};

// group: which assembly act a part belongs to (see assembly.js)
function classify(p) {
  const n = p.name.toLowerCase();
  const has = (...k) => k.some((s) => n.includes(s));
  switch (p.system) {
    case 'skeletal': {
      if (has('fibularis', 'tibialis', 'subscapularis', 'levator scapulae', 'iliotibial', 'gingiva')) return null;
      if (has('tooth')) return { tissue: 'tooth', group: 'teeth' };
      if (has('arytenoid', 'corniculate', 'cuneiform cartilage', 'cricoid', 'thyroid cartilage', 'alar cartilage')) return { tissue: 'cartilage', group: 'skull' };
      if (has('costal cartilage')) return { tissue: 'cartilage', group: 'ribs' };
      if (has('intervertebral disk')) return { tissue: 'cartilage', group: 'spine' };
      if (has('vertebra', 'atlas', 'axis', 'sacrum')) return { tissue: 'bone', group: 'spine' };
      if (has(' rib', 'sternum', 'manubrium', 'xiphoid')) return { tissue: 'bone', group: 'ribs' };
      if (has('clavicle', 'scapula', 'humerus', 'radius', 'ulna', 'carp', 'lunate', 'scaphoid', 'triquetral', 'pisiform', 'trapezi', 'capitate', 'hamate', 'metacarpal', 'finger', 'thumb')) return { tissue: 'bone', group: 'arms' };
      if (has('femur', 'patella', 'tibia', 'fibula', 'talus', 'calcaneus', 'navicular', 'cuboid', 'cuneiform bone', 'metatarsal', 'toe', 'sesamoid', 'hip bone')) return { tissue: 'bone', group: 'legs' };
      return { tissue: 'bone', group: 'skull' }; // cranial and facial bones, mandible, hyoid
    }
    case 'cardiac':
      if (has('third ventricle', 'fourth ventricle', 'lateral ventricle', 'interventricular foramen')) return null;
      if (has('cavity')) return null;
      if (has('cusp', 'leaflet')) return { tissue: 'valve', group: 'heart' };
      return { tissue: 'heart', group: 'heart' };
    case 'muscular':
      if (n === 'diaphragm') return { tissue: 'diaphragm', group: 'diaphragm' };
      return null;
    case 'arterial': return { tissue: 'artery', group: 'arteries' };
    case 'venous':
      if (has('hepatovenous segment')) return { tissue: 'liver', group: 'liver' };
      return { tissue: 'vein', group: 'veins' };
    case 'nervous':
      if (has('gyrus', 'lobule', 'insula', 'orbital gyrus')) return { tissue: 'brain', group: 'brain' };
      if (has('cerebellum', 'pons', 'medulla', 'midbrain')) return { tissue: 'brain', group: 'brain' };
      if (has('thalam', 'caudate', 'putamen', 'pallidus', 'hippocamp', 'amygdala', 'hypothalamus', 'corpus callosum', 'fornix')) return { tissue: 'deepbrain', group: 'brain' };
      if (has('white matter')) return { tissue: 'white', group: 'brain' };
      if (has('tentorium')) return null;
      return { tissue: 'nerve', group: 'nerves' };
    case 'respiratory':
      if (has('pharyn', 'constrictor', 'palatopharyngeus', 'salpingopharyngeus', 'stylopharyngeus', 'nasal cartilage', 'nasal concha', 'epiglottis')) return null;
      return { tissue: 'airway', group: 'airways' };
    case 'digestive':
      if (has('mesentery', 'mesocolon', 'mesoappendix', 'tongue', 'sublingual', 'submandibular')) return null;
      if (has('stomach')) return { tissue: 'stomach', group: 'stomach' };
      if (has('caudate lobe of liver')) return { tissue: 'liver', group: 'liver' };
      if (has('biliary', 'hepatic duct', 'cystic duct', 'duct of caudate')) return { tissue: 'duct', group: 'liver' };
      if (has('gallbladder')) return { tissue: 'gall', group: 'liver' };
      if (has('pancrea')) return { tissue: 'pancreas', group: 'stomach' };
      if (has('esophagus')) return { tissue: 'stomach', group: 'stomach' };
      if (has('colon', 'rectum', 'taenia', 'appendix', 'ileocecal', 'cecum')) return { tissue: 'colon', group: 'gut' };
      if (has('duodenum', 'jejunum', 'ileum')) return { tissue: 'gut', group: 'gut' };
      return null;
    case 'urinary':
      if (has('urethra')) return null;
      return { tissue: has('kidney') ? 'kidney' : 'bladder', group: 'kidneys' };
    case 'endocrine': return { tissue: 'gland', group: has('adrenal') ? 'kidneys' : 'brain' };
    case 'lymphatic': return { tissue: has('spleen') ? 'spleen' : 'thymus', group: has('spleen') ? 'stomach' : 'thymus' };
    case 'sensory':
      if (has('lacrimal bone')) return { tissue: 'bone', group: 'skull' };
      if (has('iris')) return { tissue: 'iris', group: 'eyes' };
      if (has('sclera', 'cornea', 'lens', 'vitreous', 'choroid', 'retina', 'corona ciliaris', 'anterior chamber')) {
        if (has('choroid plexus')) return null;
        return { tissue: 'eye', group: 'eyes' };
      }
      return null;
    default: return null; // skin, hair, reproductive organs, fascia: never drawn on this site
  }
}

// ------------------------------------------------------------------ reveal shader (trees grow along real geometry)
function makeRevealable(mat, key) {
  const u = { uOrigin: { value: new THREE.Vector3() }, uReveal: { value: 10 }, uMode: { value: 1 }, uFront: { value: 0.035 },
              uGlow: { value: new THREE.Color(1, 0.8, 0.55) }, uPulseR: { value: -1 }, uPulseW: { value: 0.05 } };
  mat.userData.reveal = u;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRWorld;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvRWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRWorld;\nuniform vec3 uOrigin; uniform float uReveal; uniform float uMode; uniform float uFront; uniform vec3 uGlow; uniform float uPulseR; uniform float uPulseW;')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        float rd = distance(vRWorld, uOrigin);
        float edge = uMode > 0.0 ? (uReveal - rd) : (rd - uReveal);
        if (edge < 0.0) discard;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float fr = 1.0 - smoothstep(0.0, uFront, edge);
        totalEmissiveRadiance += uGlow * fr * 2.2;
        if (uPulseR > 0.0) { float pz = 1.0 - smoothstep(0.0, uPulseW, abs(rd - uPulseR)); totalEmissiveRadiance += uGlow * pz * 0.9; }`);
  };
  mat.customProgramCacheKey = () => 'reveal-' + key;
  return mat;
}

function material(key, opts = {}) {
  const t = TISSUE[key];
  const m = new THREE.MeshPhysicalMaterial({
    color: t.color, roughness: t.roughness, metalness: 0,
    clearcoat: t.clearcoat ?? 0, clearcoatRoughness: t.clearcoatRoughness ?? 0.3,
    sheen: t.sheen ?? 0, sheenColor: new THREE.Color(t.sheenColor ?? 0xffffff), sheenRoughness: t.sheenRoughness ?? 0.5,
    transparent: !!t.transparent, opacity: t.opacity ?? 1, envMapIntensity: 1.0,
    emissive: new THREE.Color(0xffe2c4), emissiveIntensity: 0,
  });
  if (opts.reveal) makeRevealable(m, key);
  return m;
}

// ------------------------------------------------------------------ loading
async function loadChunks(base, atlas, needed) {
  const bufs = new Map();
  await Promise.all([...needed].map(async (ci) => {
    const url = base + '/' + atlas.chunks[ci].url.split('/').pop();
    bufs.set(ci, await (await fetch(url)).arrayBuffer());
  }));
  return bufs;
}

function buildGeometry(buffer, p, center, sc = 1) {
  const src = new Float32Array(buffer, p.positions, p.vertexCount * 3);
  const pos = new Float32Array(src.length);
  for (let i = 0; i < src.length; i += 3) { pos[i] = (src[i] - center.x) * sc; pos[i + 1] = (src[i + 1] - center.y) * sc; pos[i + 2] = (src[i + 2] - center.z) * sc; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Int16Array(buffer, p.normals, p.vertexCount * 3), 3, true));
  g.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer, p.indices, p.indexCount), 1));
  g.computeBoundingSphere();
  return g;
}

const REVEAL_GROUPS = new Set(['arteries', 'veins', 'nerves', 'airways']);

export async function init(cfg) {
  const t0 = performance.now();
  const W = cfg.width, Hh = cfg.height;
  const SC = cfg.scale ?? 1.83 / 1.73; // BodyParts3D is 1.73 m; we show an adult 1.83 m tall
  H.scale = SC;
  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(cfg.pixelRatio ?? 1);
  renderer.setSize(W, Hh, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = cfg.exposure ?? 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  H.renderer = renderer;

  const scene = new THREE.Scene();
  H.scene = scene;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = cfg.envIntensity ?? 0.45;

  const key = new THREE.DirectionalLight(cfg.keyColor ?? 0xfff0dd, cfg.key ?? 2.6);
  key.position.set(-1.8, 3.0, 2.6); scene.add(key);
  const rim = new THREE.DirectionalLight(cfg.rimColor ?? 0xa9c8ff, cfg.rim ?? 3.2);
  rim.position.set(2.4, 2.2, -2.8); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(cfg.rim2Color ?? 0xffd2b0, cfg.rim2 ?? 1.4);
  rim2.position.set(-2.6, 1.2, -2.2); scene.add(rim2);
  const fill = new THREE.HemisphereLight(0xfff8f0, cfg.ground ?? 0x1a1714, cfg.fill ?? 0.5); scene.add(fill);
  H.lights = { key, rim, rim2, fill };

  const base = cfg.base ?? 'models';
  const atlas = await (await fetch(base + '/atlas.json')).json();
  H.atlas = atlas;
  const chosen = [];
  atlas.parts.forEach((p, i) => { const c = classify(p); if (c && (!cfg.groups || cfg.groups.includes(c.group))) chosen.push({ p, i, ...c }); });
  const bufs = await loadChunks(base, atlas, new Set(chosen.map((c) => c.p.chunk)));
  const root = new THREE.Group(); scene.add(root); H.root = root;
  const shared = new Map();
  for (const c of chosen) {
    const b = c.p.bounds;
    const center = new THREE.Vector3((b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2, (b[0][2] + b[1][2]) / 2);
    const g = buildGeometry(bufs.get(c.p.chunk), c.p, center, SC);
    center.multiplyScalar(SC);
    let m;
    if (REVEAL_GROUPS.has(c.group)) {
      const k = c.group + ':' + c.tissue;
      if (!shared.has(k)) shared.set(k, material(c.tissue, { reveal: true }));
      m = shared.get(k);
    } else {
      m = material(c.tissue); // own material per part: fades and arrival glints are per part
    }
    const mesh = new THREE.Mesh(g, m);
    mesh.position.copy(center);
    mesh.userData = { part: c.p, group: c.group, tissue: c.tissue, home: center.clone(), size: new THREE.Vector3(b[1][0] - b[0][0], b[1][1] - b[0][1], b[1][2] - b[0][2]).multiplyScalar(SC) };
    root.add(mesh); H.meshes.push(mesh);
    if (!H.groups.has(c.group)) H.groups.set(c.group, []);
    H.groups.get(c.group).push(mesh);
    H.byName.set(c.p.name + '#' + c.p.id, mesh);
  }
  H.revealMats = [...shared.entries()];
  if (cfg.ring !== false) {
    const ringGroup = new THREE.Group();
    const col = new THREE.Color(cfg.ringColor ?? 0xecEEF1);
    const circ = (r, seg = 256) => { const pts = []; for (let k = 0; k <= seg; k++) { const a = (k / seg) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); } return new THREE.BufferGeometry().setFromPoints(pts); };
    const lm = (o) => new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: o, depthWrite: false });
    ringGroup.add(new THREE.Line(circ(0.62), lm(0.35)));
    ringGroup.add(new THREE.Line(circ(0.66), lm(0.14)));
    const tk = []; for (let k = 0; k < 72; k++) { const a = (k / 72) * Math.PI * 2; const r1 = 0.62, r2 = k % 6 === 0 ? 0.6 : 0.612; tk.push(new THREE.Vector3(Math.cos(a) * r1, 0, Math.sin(a) * r1), new THREE.Vector3(Math.cos(a) * r2, 0, Math.sin(a) * r2)); }
    ringGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tk), lm(0.4)));
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.62, 128), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: cfg.discOpacity ?? 0.22, depthWrite: false }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = -0.001; ringGroup.add(disc);
    ringGroup.position.y = 0.0005;
    scene.add(ringGroup); H.ring = ringGroup;
  }

  const cam = new THREE.PerspectiveCamera(cfg.fov ?? 24, W / Hh, 0.01, 60);
  H.camera = cam;
  setCamera(cfg.camera ?? { pos: [1.3, 1.15, 4.8], target: [0, 0.9, 0] });

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(cfg.pixelRatio ?? 1);
  composer.setSize(W, Hh);
  composer.addPass(new RenderPass(scene, cam));
  if (cfg.ao) {
    const ao = new GTAOPass(scene, cam, W, Hh);
    ao.output = GTAOPass.OUTPUT.Default;
    ao.blendIntensity = cfg.aoIntensity ?? 1.0;
    ao.updateGtaoMaterial({ radius: cfg.aoRadius ?? 0.05, distanceExponent: 1.4, thickness: 1.2, scale: 1.1 });
    ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 5, rings: 2, samples: 12 });
    composer.addPass(ao);
  }
  if (cfg.bloom) composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, Hh), cfg.bloom, 0.5, 0.82));
  composer.addPass(new OutputPass());
  if (cfg.smaa) composer.addPass(new SMAAPass(W * (cfg.pixelRatio ?? 1), Hh * (cfg.pixelRatio ?? 1)));
  H.composer = composer;
  H.ready = true;
  const tris = chosen.reduce((a, c) => a + c.p.indexCount / 3, 0);
  H.log.push(`init ${chosen.length} meshes, ${tris} triangles, ${Math.round(performance.now() - t0)} ms`);
  return { meshes: chosen.length, triangles: tris, groups: Object.fromEntries([...H.groups].map(([k, v]) => [k, v.length])) };
}

export function setCamera(c) {
  const cam = H.camera;
  cam.position.set(...c.pos);
  if (c.fov) cam.fov = c.fov;
  cam.updateProjectionMatrix();
  cam.lookAt(new THREE.Vector3(...c.target));
  cam.updateMatrixWorld(true);
}

export function project(v) {
  const p = new THREE.Vector3(...v).project(H.camera);
  const W = H.renderer.domElement.clientWidth || H.renderer.domElement.width, Hh = H.renderer.domElement.clientHeight || H.renderer.domElement.height;
  return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * Hh, p.z];
}

export function render() {
  const t0 = performance.now();
  H.composer.render();
  return Math.round(performance.now() - t0);
}

H.init = init; H.setCamera = setCamera; H.render = render; H.project = project;
