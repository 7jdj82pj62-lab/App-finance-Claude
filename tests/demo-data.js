// Données de démonstration (sans cotations en direct) : node tests/capture.js les injecte dans localStorage.
module.exports = function demoState() {
  const now = new Date(), Y = now.getFullYear(), M = now.getMonth();
  const hist = [];
  for (let i = 365; i >= 1; i -= 7) {
    const d = new Date(now.getTime() - i * 864e5);
    hist.push({ d: d.toISOString().slice(0, 10), v: Math.round(150000 + (365 - i) * 38 + Math.sin(i / 20) * 1500) });
  }
  const groups = {
    daily: { name: 'Vie quotidienne', color: 'var(--c0)', items: [{ id: 'i1', name: 'Alimentation & Courses', amt: 450 }, { id: 'i2', name: 'Transports & Carburant', amt: 150 }, { id: 'i3', name: 'Loisirs & Sorties', amt: 120 }] },
    housing: { name: 'Logement', color: 'var(--c1)', items: [{ id: 'i4', name: 'Loyer ou Crédit immobilier', amt: 900 }, { id: 'i5', name: 'Électricité & Chauffage', amt: 90 }, { id: 'i6', name: 'Box Internet & Téléphonie', amt: 40 }] },
    subs: { name: 'Abonnements', color: 'var(--c2)', items: [{ id: 'i7', name: 'Streaming vidéo & musique', amt: 25 }] }
  };
  return {
    envs: [
      { id: 'av1', type: 'av', name: 'Assurance vie Linxea', avRate: 2.5, fee: 0.5, lines: [{ id: 'l1', name: 'Fonds euros', val: 42000, cst: 38000, divs: [] }, { id: 'l2', name: 'ETF Monde (UC)', val: 18500, cst: 14000, divs: [], fee: 0.3 }] },
      { id: 'la1', type: 'la', name: 'Livret A', lines: [{ id: 'l3', name: 'Solde', val: 12000, cst: 12000, divs: [] }] },
      { id: 'es1', type: 'es', name: 'PEE', plan: 'pee', fee: 0.8, lines: [{ id: 'l4', name: 'Fonds actions', val: 9500, cst: 7000, divs: [] }] },
      { id: 'im1', type: 'im', name: 'Appartement', tax: 0, lines: [{ id: 'l5', name: 'Appartement Lyon', val: 210000, cst: 190000, divs: [], loan: { amt: 160000, rate: 3.2, yrs: 20, start: (Y - 4) + '-03', ins: 30 } }] },
      { id: 'au1', type: 'au', name: 'Or', lines: [{ id: 'l6', name: 'Pièces d’or', val: 4200, cst: 3000, divs: [] }] }
    ],
    onbSeen: true, onbDone: true, wz: { v: 1, done: true, open: false },
    hist,
    bud: { rev: 3600, step: null, groups, annualBills: [{ id: 'b1', name: 'Taxe foncière', amt: 1100, dueMonth: 9 }, { id: 'b2', name: 'Assurance auto', amt: 600, dueMonth: 0 }], last: null, inv: null },
    st: { [Y]: { b: [{ id: 's1', m: M, sym: 'CW8.PA', name: 'Amundi MSCI World', env: 'av1', amt: 300, done: null, kind: 'ETF' }, { id: 's2', m: Math.max(0, M - 1), sym: 'CW8.PA', name: 'Amundi MSCI World', env: 'av1', amt: 300, done: { t: Date.now() - 20 * 864e5, e: 300 }, kind: 'ETF' }], p: [{ id: 'p1', name: 'Vacances', amt: 150, env: 'la1', f: 0 }], pd: {} } },
    goals: [{ id: 'g1', name: 'Voyage au Japon', type: 'travel', target: 6000, date: (Y + 2) + '-06', envs: ['la1'] }, { id: 'g2', name: 'Apport maison', type: 'home', target: 50000, date: (Y + 6) + '-01', envs: ['av1'] }],
    loans: [{ id: 'c1', kind: 'auto', name: 'Crédit auto', amt: 15000, rate: 4.9, yrs: 5, start: (Y - 1) + '-06', ins: 8, fees: 150 }],
    target: { Bourse: 30, 'Épargne': 30, Immobilier: 35, Autres: 5 },
    theme: 'light'
  };
};
