// Test navigateur de l'appli (Playwright) : node tests/appli.e2e.js
// Couvre le questionnaire de départ (ouverture, reprise), les 5 onglets, leurs pages de détail,
// les saisies, le bouton « + », la persistance, le thème sombre et l'affichage à 320 px.
const { chromium } = require('playwright');
const path = require('path'), http = require('http'), fs = require('fs');
const demo = require('./demo-data.js')();
// Servi en http://localhost : avec file://, Chromium perd parfois le stockage local entre deux rechargements
const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(fs.readFileSync(path.resolve(__dirname, '../index.html'))); });
let URL;
const Y = new Date().getFullYear(), M = new Date().getMonth();

let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) pass++; else fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${info != null ? '  ' + info : ''}`); };

async function newPage(b, state, w) {
  const p = await b.newPage({ viewport: { width: w || 390, height: 844 } });
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  if (state) await p.addInitScript(s => { if (!localStorage.getItem('pf.v1')) localStorage.setItem('pf.v1', s); }, JSON.stringify(state));
  await p.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  return p;
}
const go = async (p, r) => { await p.goto(URL + r); await p.waitForTimeout(350); };
const clearModal = p => p.evaluate(() => { document.getElementById('modal-root').innerHTML = ''; });
const num = s => +String(s).replace(/[^\d,-]/g, '').replace(',', '.');

(async () => {
  await new Promise(r => srv.listen(0, r)); URL = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch();
  try {
    /* ---------- 1. Nouvel utilisateur : questionnaire ---------- */
    const p1 = await newPage(b, null);
    await go(p1, '#/'); await p1.waitForTimeout(600);
    ok('questionnaire : s’ouvre seul', !!(await p1.$('#wz-root')));
    ok('questionnaire : premier écran', (await p1.textContent('#wz-h')).includes('Tout commence petit'));
    const t0 = await p1.textContent('#wz-h');
    await p1.click('.wz-cta'); await p1.waitForTimeout(300);
    ok('questionnaire : Continuer avance', (await p1.textContent('#wz-h')) !== t0);
    await p1.click('.wz-later'); await p1.waitForTimeout(300);
    ok('questionnaire : Plus tard ferme', !(await p1.$('#wz-root')));
    ok('accueil : carte Reprendre', (await p1.textContent('#app')).includes('Reprendre là où vous en étiez'));
    await p1.reload(); await p1.waitForTimeout(500);
    ok('reprise après rechargement', (await p1.textContent('#app')).includes('Reprendre là où vous en étiez'));
    ok('questionnaire : pas d’erreur JS', !p1.errs.length, p1.errs.join(' | '));
    await p1.close();

    /* ---------- 1 bis. Questionnaire complet, écran par écran ---------- */
    const pw = await newPage(b, null);
    await go(pw, '#/'); await pw.waitForTimeout(600);
    const steps = [];
    for (let i = 0; i < 90 && await pw.$('#wz-root'); i++) {
      const at = await pw.evaluate(() => S.wz.at); steps.push(at);
      if (at === 'p-pick' && !(await pw.evaluate(() => S.envs.length))) { await pw.getByText('Livret A', { exact: false }).first().click(); await pw.waitForTimeout(200); }
      const amt = await pw.$('#wz-root input[inputmode=decimal]');
      if (amt && !(await amt.inputValue())) { await amt.fill(at === 'c-rev' ? '3000' : '5000'); await pw.waitForTimeout(100); }
      const cta = await pw.$('#wz-root .wz-cta:not([disabled])'), skip = await pw.$('#wz-root .wz-skip');
      if (cta) await cta.click(); else if (skip) await skip.click(); else break;
      await pw.waitForTimeout(250);
    }
    ok('questionnaire complet : va jusqu’au bout', steps.includes('end') && !(await pw.$('#wz-root')), `${steps.length} écrans`);
    ok('questionnaire complet : 4 étapes traversées', ['p-pick', 'c-rev', 'g-goals', 's-plan'].every(x => steps.includes(x)));
    const fin = await pw.evaluate(() => ({ done: S.wz.done, net: keyFigures().net, rev: getBudget().rev }));
    ok('questionnaire complet : réponses enregistrées', fin.done && fin.net === 5000 && fin.rev === 3000, JSON.stringify(fin));
    ok('questionnaire complet : arrivée sur l’Accueil', (await pw.textContent('#app')).includes('Votre boule de neige'));
    ok('questionnaire complet : pas d’erreur JS', !pw.errs.length, pw.errs.join(' | '));
    await pw.close();

    /* ---------- 2. Utilisateur existant : tous les écrans ---------- */
    const p = await newPage(b, demo, 320);
    const routes = ['#/', '#/b', '#/a', '#/a/t', '#/e/av1', '#/e/la1', '#/e/im1', '#/l/av1/l2', '#/l/av1/l7', '#/l/im1/l5', '#/k/c1', '#/k/im1/l5',
      '#/n', '#/n/c/housing', '#/g', '#/g/g1', '#/g/g2', '#/s', `#/s/${Y + 1}`, `#/s/m/${Y}/${M}`];
    for (const r of routes) {
      await go(p, r);
      const txt = await p.textContent('#app'), wdt = await p.evaluate(() => document.documentElement.scrollWidth);
      ok(`écran ${r}`, txt.length > 50 && !txt.includes('Erreur d’affichage') && wdt <= 320, wdt > 320 ? `déborde : ${wdt}px` : null);
    }
    ok('utilisateur existant : pas de questionnaire', !(await p.$('#wz-root')));
    await go(p, '#/a/d'); ok('ancienne route « Tout le détail » → Mon argent', (await p.textContent('#app')).includes('Qu’est-ce que j’ai'));
    await go(p, '#/k/inconnu'); await p.waitForTimeout(200); ok('crédit inconnu → Mon argent', p.url().endsWith('#/a'));

    /* ---------- 3. Accueil ---------- */
    await go(p, '#/');
    ok('accueil : opérations en retard sur une ligne', (await p.textContent('#app')).includes('opérations des mois passés'));
    ok('accueil : pas d’alerte si tout va bien', !(await p.textContent('#app')).includes('À regarder'));
    await p.evaluate(() => { S.envs.push({ id: 'x1', type: 'pea', name: 'PEA vide', lines: [] }); save(); render(); });
    ok('accueil : alerte pour un compte incomplet', (await p.textContent('#app')).includes('À regarder'));
    await p.evaluate(() => { S.envs = S.envs.filter(e => e.id !== 'x1'); save(); });

    /* ---------- 4. Mon argent ---------- */
    await go(p, '#/a');
    const K = await p.evaluate(() => { const k = keyFigures(); return { a: k.a.v, d: k.debt, t: k.sm.t, net: k.net }; });
    ok('mon argent : net = biens − crédits − impôts', Math.abs(K.a - K.d - K.t - K.net) < 1);
    ok('mon argent : 2 crédits listés', (await p.locator('.n-row', { hasText: '/ mois' }).count()) === 2);
    await p.locator('.n-row', { hasText: 'Crédit auto' }).click(); await p.waitForTimeout(200);
    ok('mon argent : crédit → sa page', p.url().endsWith('#/k/c1'));
    ok('crédit : coût total affiché', (await p.textContent('#app')).includes('Au total, vous rembourserez'));

    /* ---------- 5. Mes coûts ---------- */
    await go(p, '#/n/c/housing');
    const inp = p.locator('input.n-amt').first();
    await inp.fill('1000'); await inp.press('Tab'); await p.waitForTimeout(150);
    ok('budget : montant modifié', num(await p.textContent('.n-big')) === 1130);
    await inp.fill('12abc'); await inp.press('Tab'); await p.waitForTimeout(150);
    ok('budget : « 12abc » refusé', (await inp.inputValue()) === '1000');
    await go(p, '#/n');
    ok('épargne possible recalculée (3600 − 1130 − 720 − 25 − 150)', num(await p.textContent('.n-big')) === 1575);
    await p.getByText('Taxe foncière').click(); await p.waitForTimeout(150);
    await p.fill('#modal-root input[inputmode=decimal]', '1200'); await p.getByText('Enregistrer').click(); await p.waitForTimeout(150);
    ok('grosse dépense modifiée', await p.evaluate(() => S.bud.annualBills.find(x => x.name === 'Taxe foncière').amt === 1200));

    /* ---------- 6. Mes projets ---------- */
    await go(p, '#/g/g2');
    const eff = await p.evaluate(() => { const g = gl().find(x => x.id === 'g2'); return goalEffort(g, goalCalc('net')[g.id]); });
    ok('projet : effort = (reste − programmé) / mois', Math.abs(eff.effort - Math.max(0, eff.rest - eff.planned) / Math.max(1, eff.n)) < 0.01);
    await p.getByText('Supprimer ce projet').click(); await p.waitForTimeout(150); await p.locator('#modal-root .btn-danger').click(); await p.waitForTimeout(250);
    ok('projet supprimé', p.url().endsWith('#/g') && await p.evaluate(() => S.goals.length === 1));

    /* ---------- 7. Mon plan ---------- */
    await go(p, '#/s');
    const at0 = await p.evaluate(() => S.wz.at);
    await p.getByText('Mettre de côté', { exact: true }).click(); await p.waitForTimeout(350);
    ok('plan : mise de côté avec les écrans du questionnaire', (await p.textContent('#wz-h')).includes('Mettre de côté'));
    await p.fill('#wz-root input', '80'); await p.getByText('Programmer', { exact: true }).click(); await p.waitForTimeout(350);
    ok('plan : retour à Mon plan après ajout', !(await p.$('#wz-root')) && p.url().endsWith('#/s'));
    ok('plan : mise de côté ajoutée', await p.evaluate(() => getStrategy(nowYear()).p.some(x => x.amt === 80)));
    ok('plan : étape du questionnaire inchangée', await p.evaluate(a => S.wz.at === a, at0));
    const liv0 = await p.evaluate(() => agg(S.envs.find(e => e.id === 'la1').lines).v);
    const nLate = await p.evaluate(() => pendProv(nowYear()).filter(x => x.m < nowMonth() && x.p.name === 'Vacances').length);
    if (nLate > 1) {
      await p.getByText('Tous faits').click(); await p.waitForTimeout(250);
      ok('plan : « Tous faits » ajoute l’argent au livret', await p.evaluate(() => agg(S.envs.find(e => e.id === 'la1').lines).v) - liv0 === 150 * nLate);
    }
    await go(p, `#/s/m/${Y}/${M}`);
    await p.locator('.n-row', { hasText: 'Vacances' }).getByText('Pas fait').click(); await p.waitForTimeout(200);
    ok('plan : « Pas fait » non compté comme épargné', await p.evaluate(m => !(getStrategy(nowYear()).pd[m] || []).includes('p1'), M));
    await go(p, '#/s');
    await p.locator('.n-row', { hasText: 'Amundi' }).getByText('Arrêter').click(); await p.waitForTimeout(150); await p.locator('#modal-root .btn-danger').click(); await p.waitForTimeout(250);
    ok('plan : « Arrêter » retire les achats non faits', await p.evaluate(() => getStrategy(nowYear()).b.filter(b => !b.done).length === 0));

    /* ---------- 8. Page d'une ligne ---------- */
    await go(p, '#/l/av1/l7');
    const q = p.locator('.form-grid input').first();
    await q.fill('12abc'); await p.getByText('Enregistrer', { exact: true }).click(); await p.waitForTimeout(150);
    ok('ligne : saisie invalide refusée', (await p.textContent('.wz-err')).length > 0 && await p.evaluate(() => S.envs[0].lines.find(l => l.id === 'l7').qty === 40));
    await q.fill('45'); await p.getByText('Enregistrer', { exact: true }).click(); await p.waitForTimeout(200);
    ok('ligne : parts modifiées', await p.evaluate(() => S.envs[0].lines.find(l => l.id === 'l7').qty === 45));
    await p.getByText('Ajouter un dividende reçu').click(); await p.waitForTimeout(150);
    await p.fill('#modal-root input[inputmode=decimal]', '12,40'); await p.locator('#modal-root .btn-primary').click(); await p.waitForTimeout(200);
    ok('ligne : dividende ajouté', await p.evaluate(() => S.envs[0].lines.find(l => l.id === 'l7').divs.some(d => d.amt === 12.4)));

    /* ---------- 9. Bouton « + » ---------- */
    for (const t of ['Un compte', 'Une ligne dans un compte', 'Un crédit', 'Une grosse dépense de l’année', 'Un projet', 'Un achat chaque mois', 'Une mise de côté chaque mois']) {
      await go(p, '#/'); await clearModal(p);
      await p.click('.top-plus'); await p.waitForTimeout(150);
      await p.locator('.n-add', { hasText: t }).first().click(); await p.waitForTimeout(300);
      const opened = (await p.locator('#modal-root .modal-overlay').count()) > 0 || !!(await p.$('#wz-root, #af-root'));
      ok(`bouton + : ${t}`, opened);
      await p.evaluate(() => { if (WZ_OPEN) closeWizard(); if (document.getElementById('af-root')) closeAssetFlow(); document.getElementById('modal-root').innerHTML = ''; });
    }

    /* ---------- 10. Persistance, thème, réglages ---------- */
    await p.reload(); await p.waitForTimeout(400);
    const per = await p.evaluate(() => { const l = S.envs[0].lines.find(l => l.id === 'l7'); return { qty: l && l.qty, bill: S.bud.annualBills.find(x => x.name === 'Taxe foncière').amt }; });
    ok('données conservées après rechargement', per.qty === 45 && per.bill === 1200, JSON.stringify(per));
    await clearModal(p);
    await p.click('button[title="Sauvegarde & Réglages"]'); await p.waitForTimeout(200);
    ok('réglages : plus de conseil du jour ni de médailles', !(await p.textContent('#modal-root')).includes('Conseil du jour'));
    await p.getByText('Sombre', { exact: true }).click(); await p.waitForTimeout(150);
    ok('thème sombre', await p.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark' || S.theme === 'dark'));

    ok('aucune erreur JS', !p.errs.length, p.errs.join(' | '));
  } catch (e) { fail++; console.log('CRASH', e.message); }
  await b.close(); srv.close();
  console.log(`\n${fail} FAIL / ${pass + fail} : ${pass}/${pass + fail}`);
  process.exit(fail ? 1 : 0);
})();
