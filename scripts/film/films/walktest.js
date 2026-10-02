// a test bench for the rig: the skeleton walks along +z, the camera tracks it from the right side
import { THREE, V3, spot, loadAnatomy, makeFilm } from '../kit.js';
import { buildRig, skeletonKind, walkAt, walkApply } from '../rig.js';
const W = {}, V = 0.9;
async function build(S, cfg) {
  S.fog.near = 3; S.fog.far = 12;
  const meshes = await loadAnatomy(skeletonKind());
  W.rig = buildRig(meshes); S.scene.add(W.rig.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; }
  W.key = spot(S.scene, { color: 0xffe9d2, pos: new THREE.Vector3(-2, 4, 2), target: new THREE.Vector3(0, 0.9, 1), angle: 0.7, penumbra: 0.8, shadow: true });
  W.key.intensity = 6;
  W.fill = spot(S.scene, { color: 0xc8d6ff, pos: new THREE.Vector3(2, 2, -2), target: new THREE.Vector3(0, 1, 1), angle: 0.8, penumbra: 1 }); W.fill.intensity = 2;
  const L = W.rig.legs.Right;
  return { H: L.H.toArray(), K: L.K.toArray(), A: L.A.toArray(), heel: L.heel.toArray(), ball: L.ball.toArray(), L1: L.L1, L2: L.L2, P0: W.rig.P0.toArray() };
}
function update(S, t) {
  const w = walkAt(W.rig, V * t, { stride: 1.1 });
  const r = walkApply(W.rig, w); W.reach = r;
  W.key.target.position.set(0, 0.9, V * t); W.key.position.set(-2, 4, V * t + 1.5);
}
function pose(S, t) { const z = V * t; return { p: V3(-3.2, 1.0, z + 0.1), l: V3(0, 0.85, z + 0.1), fov: 34 }; }
makeFilm({ T: { end: 10 }, caps: [], subs: [], build, update, pose, stage: { bg: 0x101114, reflSize: 30, env: 0.3 } });
