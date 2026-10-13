// mac_render.js: a film's frames, rendered in Electron (Chromium) in the Linux workspace on Sam's Mac, exactly as
// film_render.py renders them with Playwright: the same page, the same sub-frame motion blur, the same JPEG screenshots.
// electron <flags> mac_render.js -- OUTDIR --film film05 --t1 73.7 [--w 1080 --h 1920 --fps 24 --t0 0 --blur --shadow 2048
//   --start 0 --step 1 --end 0 --port 8771]; existing frames are skipped (resumable)
const { app, BrowserWindow } = require('electron');
const fs = require('fs'), path = require('path'), http = require('http');
const HERE = __dirname;
const argv = process.argv.slice(process.argv.indexOf('--') + 1);
const A = { out: argv[0], film: '', w: 1080, h: 1920, fps: 24, t0: 0, t1: 0, blur: false, guide: false, shadow: 2048, start: 0, step: 1, end: 0, port: 8771 };
for (let i = 1; i < argv.length; i++) { const k = argv[i].replace(/^--/, ''); if (k === 'blur' || k === 'guide') A[k] = true; else { const v = argv[++i]; A[k] = isNaN(+v) ? v : +v; } }
for (const [k, v] of [['use-gl', 'angle'], ['use-angle', 'swiftshader'], ['enable-unsafe-swiftshader'], ['ignore-gpu-blocklist'], ['disable-lcd-text']]) app.commandLine.appendSwitch(k, v);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.bin': 'application/octet-stream', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg', '.wasm': 'application/wasm' };
const log = (...m) => console.log(new Date().toISOString().slice(11, 19), ...m);
app.whenReady().then(async () => {
  fs.mkdirSync(A.out, { recursive: true });
  const srv = http.createServer((q, r) => {
    const p = path.join(HERE, decodeURIComponent(q.url.split('?')[0]));
    if (!p.startsWith(HERE)) { r.writeHead(403); r.end(); return; }
    fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); });
  }).listen(A.port, '127.0.0.1');
  const win = new BrowserWindow({ width: A.w, height: A.h, useContentSize: true, show: true, frame: false, webPreferences: { backgroundThrottling: false } });
  const wc = win.webContents, errs = [];
  wc.on('console-message', (e) => { const lv = e.level ?? e.params?.level; if (lv === 'error' || lv === 3 || lv === 'warning' || lv === 2) errs.push(String(e.message ?? '').slice(0, 300)); });
  wc.on('render-process-gone', (e, d) => { log('RENDERER GONE', JSON.stringify(d)); app.exit(3); });
  const js = (s) => wc.executeJavaScript(s);
  await win.loadURL(`http://127.0.0.1:${A.port}/film.html?f=${A.film}`);
  for (let k = 0; !(await js('!!(window.HFS && window.HFS.filmReady)')); k++) { if (k > 1800) { log('film never loaded', errs.slice(0, 5)); app.exit(2); } await new Promise((r) => setTimeout(r, 100)); }
  let t = Date.now();
  const info = await js(`window.HFS.film.init(${JSON.stringify({ width: A.w, height: A.h, guide: A.guide, shadow: A.shadow })})`);
  await js('document.fonts.ready.then(() => 1)');
  log('init', ((Date.now() - t) / 1000).toFixed(1), 's', JSON.stringify(info).slice(0, 300), errs.slice(0, 4));
  const FAST = (info && info.fast) || [];
  const subs = (tt) => { for (const [a, b, n] of FAST) if (a <= tt && tt <= b) return n; return 1; };
  const dbg = wc.debugger; dbg.attach('1.3');
  const n = Math.round((A.t1 - A.t0) * A.fps), end = A.end || n;
  let done = 0; const t00 = Date.now();
  for (let i = A.start; i < end; i += A.step) {
    const tt = A.t0 + i / A.fps, name = path.join(A.out, `f${String(i).padStart(5, '0')}.jpg`);
    if (fs.existsSync(name)) continue;
    t = Date.now();
    const s = A.blur ? subs(tt) : 1;
    await js(`window.HFS.film.render(${tt}, { sub: ${s}, fps: ${A.fps} })`);
    const shot = await dbg.sendCommand('Page.captureScreenshot', { format: 'jpeg', quality: 93 });
    fs.writeFileSync(name + '.part', Buffer.from(shot.data, 'base64')); fs.renameSync(name + '.part', name);
    done++;
    if (done % 10 === 1) log(`${i} t=${tt.toFixed(2)} sub=${s} ${((Date.now() - t) / 1000).toFixed(2)}s avg ${((Date.now() - t00) / 1000 / done).toFixed(2)}s`, errs.length ? errs.slice(-2) : '');
  }
  log('done', done, 'frames');
  srv.close(); app.quit();
});
