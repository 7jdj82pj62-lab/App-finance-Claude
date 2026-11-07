/**
 * Relais de cotations – version 3 (Google Apps Script) : ajoute la recherche par ISIN
 * Déploiement : Apps Script > Déployer > Nouveau déploiement > Application Web
 *   Exécuter en tant que : Moi / Qui a accès : Tout le monde
 */
const OPTS = { headers: { 'User-Agent': 'Mozilla/5.0' }, muteHttpExceptions: true };
const CACHE_SECONDS = 120;
const PREFERRED = ['PAR', 'AMS', 'GER', 'FRA', 'MIL', 'MCE', 'BRU', 'LIS', 'EBS', 'LSE', 'NMS', 'NYQ', 'NGM'];
const TYPES = { EQUITY: 'Action', ETF: 'ETF', CRYPTOCURRENCY: 'Crypto', MUTUALFUND: 'Fonds', INDEX: 'Indice' };

function doGet(e) {
  const p = e.parameter || {};
  let out;
  try {
    out = p.action === 'ping' ? { ok: true, version: VERSION }
      : p.action === 'isin' ? isin_(p.isin || '')
      : p.action === 'search' ? search_(p.q || '')
      : p.action === 'inflation' ? inflation_()
      : quotes_((p.symbols || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 40));
  } catch (err) {
    out = { error: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

const VERSION = 3;

// Vérifie un ISIN : 2 lettres, 9 caractères, 1 chiffre + clé de contrôle (Luhn)
function isinOk_(s) {
  if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(s)) return false;
  let digits = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    digits += c >= 65 ? String(c - 55) : s.charAt(i);
  }
  let sum = 0, dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

// Toutes les cotations d'un ISIN (place, devise, cours) pour choisir la bonne
function isin_(isin) {
  isin = String(isin || '').trim().toUpperCase();
  if (!isinOk_(isin)) return { error: 'ISIN invalide' };
  const cache = CacheService.getScriptCache();
  const key = 'i3:' + isin;
  const hit = cache.get(key);
  if (hit) return JSON.parse(hit);

  const found = (yahooSearch_(isin, 20).quotes || []).filter(x => x.symbol && TYPES[x.quoteType]);
  const seen = {};
  const syms = [];
  found.forEach(x => { if (!seen[x.symbol]) { seen[x.symbol] = x; syms.push(x.symbol); } });
  const top = syms.slice(0, 8);
  const reqs = top.map(s => Object.assign(
    { url: 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(s) + '?interval=1d&range=1d' },
    OPTS
  ));
  const list = [];
  UrlFetchApp.fetchAll(reqs).forEach((r, i) => {
    try {
      const m = JSON.parse(r.getContentText()).chart.result[0].meta;
      const x = seen[top[i]];
      const rk = PREFERRED.indexOf(x.exchange);
      list.push({
        symbol: top[i],
        name: m.shortName || m.longName || x.shortname || x.longname || top[i],
        exchange: m.fullExchangeName || x.exchDisp || m.exchangeName || '',
        currency: m.currency,
        price: m.regularMarketPrice,
        type: TYPES[x.quoteType],
        rank: rk >= 0 ? rk : 99
      });
    } catch (err) { }
  });
  list.sort((a, b) => a.rank - b.rank);
  const out = {
    isin: isin,
    listings: list.map(l => ({ symbol: l.symbol, name: l.name, exchange: l.exchange, currency: l.currency, price: l.price, type: l.type }))
  };
  if (list.length) cache.put(key, JSON.stringify(out), 21600);
  return out;
}

function yahooSearch_(q, count) {
  const tries = [
    'https://query2.finance.yahoo.com/v1/finance/search?quotesCount=' + count + '&newsCount=0&lang=fr-FR&region=FR&q=',
    'https://query2.finance.yahoo.com/v1/finance/search?quotesCount=' + count + '&newsCount=0&q=',
    'https://query1.finance.yahoo.com/v1/finance/search?quotesCount=' + count + '&newsCount=0&q='
  ];
  let last = 'aucune réponse';
  for (let i = 0; i < tries.length; i++) {
    const r = UrlFetchApp.fetch(tries[i] + encodeURIComponent(q), OPTS);
    if (r.getResponseCode() === 200) {
      try { return JSON.parse(r.getContentText()); } catch (err) { last = 'réponse illisible de Yahoo'; }
    } else {
      last = 'Yahoo a répondu ' + r.getResponseCode();
    }
  }
  throw new Error(last);
}

function rank_(j, ql) {
  return (j.quotes || [])
    .filter(x => x.symbol && TYPES[x.quoteType])
    .map((x, idx) => {
      const name = x.shortname || x.longname || x.symbol;
      let score = 0;
      if (name.toLowerCase().indexOf(ql) === 0 || x.symbol.toLowerCase() === ql) score -= 3;
      if (name.toLowerCase().indexOf(ql) >= 0) score -= 1;
      if (PREFERRED.indexOf(x.exchange) >= 0) score -= 2;
      if (x.quoteType === 'CRYPTOCURRENCY') score += x.symbol.slice(-4) === '-EUR' ? -2 : (x.symbol.slice(-4) === '-USD' ? -1 : 0);
      return { symbol: x.symbol, name: name, exchange: x.exchDisp || x.exchange || '', type: TYPES[x.quoteType], score: score, idx: idx };
    });
}

function search_(q) {
  q = q.trim();
  if (!q) return { results: [] };
  const cache = CacheService.getScriptCache();
  const key = 's2:' + q.toLowerCase().slice(0, 80);
  const hit = cache.get(key);
  if (hit) return JSON.parse(hit);

  const ql = q.toLowerCase();
  let list = rank_(yahooSearch_(q, 30), ql);
  if (list.length < 5) {
    try {
      const seen = {};
      list.forEach(x => { seen[x.symbol] = 1; });
      rank_(yahooSearch_(q + ' stock', 30), ql).forEach(x => {
        if (!seen[x.symbol]) { seen[x.symbol] = 1; list.push(x); }
      });
    } catch (err) { }
  }
  list = list.sort((a, b) => a.score - b.score || a.idx - b.idx).slice(0, 12)
    .map(r => ({ symbol: r.symbol, name: r.name, exchange: r.exchange, type: r.type }));

  const out = { results: list };
  if (list.length) cache.put(key, JSON.stringify(out), 21600);
  return out;
}

function inflation_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('infl');
  if (hit) return JSON.parse(hit);
  const url = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_manr?format=JSON&lang=FR&geo=FR&coicop=CP00&unit=RCH_A';
  const j = JSON.parse(UrlFetchApp.fetch(url, OPTS).getContentText());
  const idx = j.dimension.time.category.index;
  const vals = j.value;
  const pairs = Array.isArray(idx)
    ? idx.map((t, i) => [t, i])
    : Object.keys(idx).map(t => [t, idx[t]]);
  let best = null;
  pairs.forEach(([t, i]) => {
    const v = vals[i];
    if (v != null && (!best || t > best.period)) best = { period: t, rate: v };
  });
  if (!best) throw new Error('inflation indisponible');
  cache.put('infl', JSON.stringify(best), 21600);
  return best;
}

function quotes_(symbols) {
  const cache = CacheService.getScriptCache();
  const out = {};
  const todo = [];
  symbols.forEach(s => {
    const hit = cache.get('q:' + s);
    if (hit) out[s] = JSON.parse(hit); else todo.push(s);
  });
  const reqs = todo.map(s => Object.assign(
    { url: 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(s) + '?interval=1d&range=1d' },
    OPTS
  ));
  UrlFetchApp.fetchAll(reqs).forEach((r, i) => {
    const s = todo[i];
    try {
      const m = JSON.parse(r.getContentText()).chart.result[0].meta;
      const q = {
        price: m.regularMarketPrice,
        prev: m.chartPreviousClose,
        currency: m.currency,
        time: m.regularMarketTime,
        exchange: m.fullExchangeName || m.exchangeName || '',
        name: m.shortName || m.longName || s
      };
      out[s] = q;
      cache.put('q:' + s, JSON.stringify(q), CACHE_SECONDS);
    } catch (err) {
      out[s] = { error: 'indisponible' };
    }
  });
  return { quotes: out, fetchedAt: Date.now() };
}
