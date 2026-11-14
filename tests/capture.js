// Capture d'écrans avec les données de démo : node tests/capture.js <dossier> [#/route ...]
const { chromium } = require('playwright'); const path = require('path');
const demo = require('./demo-data.js')();
(async () => {
  const out = process.argv[2] || '.', routes = process.argv.slice(3).length ? process.argv.slice(3) : ['#/'];
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(s => { if (!localStorage.getItem('pf.v1')) localStorage.setItem('pf.v1', s); }, JSON.stringify(demo));
  await p.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  for (const r of routes) {
    await p.goto('file://' + path.resolve(__dirname, '../index.html') + r); await p.addStyleTag({ content: '.bottom-nav{position:static!important}' }); await p.waitForTimeout(1500);
    const f = path.join(out, (r.replace(/[#\/]+/g, '_') || '_') + '.png');
    await p.screenshot({ path: f, fullPage: true }); console.log(f);
  }
  console.log(errs.length ? 'ERREURS JS: ' + errs.join(' | ') : 'aucune erreur JS');
  await b.close();
})();
