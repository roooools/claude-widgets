// Offline renderer for serum-drop.html (headless Chromium, software GL).
//   still: node render.cjs out.png  WxH  spp  time[,time...]
//   film : node render.cjs out.mp4  WxH  spp  [fps=30] [firstFrame lastFrame]
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path');

(async () => {
  const [out, size = '1280x720', spp = '8', a3, a4, a5] = process.argv.slice(2);
  const [W, H] = size.split('x').map(Number);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exit(1); });
  await page.goto('file://' + path.join(__dirname, 'serum-drop.html') + `?render=${size}`);
  const shot = (t, type) => page.evaluate(([t, n, type]) => renderAt(t, n, 0.035, 1 / 60, type), [t, +spp, type])
    .then(u => Buffer.from(u.split(',')[1], 'base64'));

  if (/\.(png|jpg)$/.test(out)) {
    const type = out.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
    for (const t of (a3 || '2.35').split(',')) {
      const t0 = Date.now(), buf = await shot(+t, type);
      const f = a3 && a3.includes(',') ? out.replace(/(\.\w+)$/, `-${t}$1`) : out;
      fs.writeFileSync(f, buf); console.log(f, ((Date.now() - t0) / 1000).toFixed(1) + 's');
    }
  } else {
    const fps = +(a3 || 30), first = +(a4 || 0), last = +(a5 || 5 * fps - 1);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-movflags', '+faststart', out],
      { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = first; i <= last; i++) {
      ff.stdin.write(await shot(i / fps, 'image/png'));
      if (i % 10 === 0) console.log('frame', i);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await browser.close();
})();
