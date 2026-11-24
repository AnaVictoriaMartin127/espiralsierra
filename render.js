const { chromium } = require('playwright');
const fs = require('fs');
const [,, page_, outDir, DUR, SOUND = 'softbell', GAIN = '1.6'] = process.argv;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 600, height: 800 }, colorScheme: 'light' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(s => { window.__vt = 0; window.__log = []; window.__sound = s; }, SOUND);
  await p.goto('file://' + page_);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1500);
  const fonts = await p.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family));
  console.log('fonts', fonts);
  await p.evaluate(() => { document.getElementById('step').value = 180; const sel = document.getElementById('sound'); sel.value = window.__sound; sel.dispatchEvent(new Event('change')); window.__saw.setSize(1080, 1350); window.__saw.setRunning(true); });
  const FPS = 30, N = Math.round(DUR * FPS);
  for (let f = 0; f < N; f++) {
    const url = await p.evaluate(t => { window.__vt = t; window.__saw.tick(); window.__saw.render(); return document.getElementById('cv').toDataURL('image/png'); }, f / FPS);
    fs.writeFileSync(`${outDir}/f${String(f).padStart(5, '0')}.png`, Buffer.from(url.split(',')[1], 'base64'));
  }
  await p.evaluate(g => { window.__gain = g; }, +GAIN);
  const audio = await p.evaluate(async dur => {
    const sr = 48000, ac = new OfflineAudioContext(2, Math.ceil(sr * dur), sr);
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
    const master = ac.createGain(); master.gain.value = 0.6 * 0.6 * 0.5 * window.__gain; master.connect(comp).connect(ac.destination);
    for (const [hz, t] of window.__log) { if (t <= dur) window.__saw.voice(ac, master, window.__sound, hz, t); }
    const buf = await ac.startRendering();
    return { sr, n: window.__log.length, ch: [0, 1].map(c => Array.from(buf.getChannelData(c))) };
  }, +DUR);
  const L = audio.ch[0], R = audio.ch[1], n = L.length;
  const wav = Buffer.alloc(44 + n * 4);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + n * 4, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22); wav.writeUInt32LE(audio.sr, 24);
  wav.writeUInt32LE(audio.sr * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(n * 4, 40);
  const c16 = v => Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
  for (let i = 0; i < n; i++) { wav.writeInt16LE(c16(L[i]), 44 + i * 4); wav.writeInt16LE(c16(R[i]), 46 + i * 4); }
  fs.writeFileSync(`${outDir}/audio.wav`, wav);
  console.log('notes', audio.n, 'errors', JSON.stringify(errs));
  await b.close();
})();
