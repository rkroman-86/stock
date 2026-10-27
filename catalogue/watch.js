// Surveillance du catalogue : partagé entre la page et le service worker (importScripts).
// Pas de serveur : on compare le catalogue avec la dernière version vue sur CET appareil
// (« instantané » enregistré dans le Cache Storage, accessible aux deux).
'use strict';
const WATCH_CACHE = 'catalogue-state';
const STATE_URL = './__etat-catalogue.json';
const DEFAULT_PREFS = { on: false, newP: true, up: true, down: true };

async function getState() {
  try { const r = await (await caches.open(WATCH_CACHE)).match(STATE_URL); return r ? await r.json() : {}; } catch { return {}; }
}
async function setState(s) {
  try { await (await caches.open(WATCH_CACHE)).put(STATE_URL, new Response(JSON.stringify(s), { headers: { 'Content-Type': 'application/json' } })); } catch {}
}
const prefsOf = st => Object.assign({}, DEFAULT_PREFS, st.prefs || {});
const keyOf = p => p.id || p.code || p.name;
function snapOf(data) { const m = {}; for (const p of data.products || []) m[keyOf(p)] = +p.qty || 0; return m; }
function diffCat(prev, data) {
  const d = { newP: [], up: [], down: [] };
  for (const p of data.products || []) {
    const k = keyOf(p), q = +p.qty || 0;
    if (!(k in prev)) d.newP.push(p);
    else if (q > prev[k]) d.up.push(p);
    else if (q < prev[k]) d.down.push(p);
  }
  return d;
}
// Lecture du fichier public. Si www.googleapis.com ne répond pas (réseau, filtre DNS…), on essaie un 2e serveur Google.
const DRIVE_HOSTS = ['https://www.googleapis.com', 'https://content.googleapis.com'];
async function driveGet(f, k) {
  let err;
  for (const h of DRIVE_HOSTS) {
    try { return await fetch(`${h}/drive/v3/files/${f}?alt=media&key=${encodeURIComponent(k)}`, { cache: 'no-store', credentials: 'omit' }); }
    catch (e) { err = e; }
  }
  throw err;
}
// Diagnostic quand rien ne passe : serveur injoignable, ou réponse refusée par le navigateur (CORS) ?
async function driveDiag() {
  try { await fetch('https://www.googleapis.com/discovery/v1/apis?name=drive', { mode: 'no-cors', cache: 'no-store' }); return 'cors'; }
  catch { return 'net'; }
}
async function fetchCat(f, k) {
  const r = await driveGet(f, k);
  if (!r.ok) throw Object.assign(new Error('HTTP ' + r.status), { status: r.status });
  const j = await r.json();
  if (!j || !Array.isArray(j.products)) throw new Error('format');
  return j;
}

const NT = {
  fr: {
    q: n => { const v = +n || 0; return Number.isInteger(v) ? String(v) : String(v).replace('.', ','); },
    newT: n => n > 1 ? `${n} nouveaux produits` : 'Nouveau produit',
    upT: n => n > 1 ? `Réassort de ${n} produits` : 'Réassort',
    downT: n => n > 1 ? `Stock en baisse sur ${n} produits` : 'Stock en baisse',
    left: (p, q) => +p.qty > 0 ? `${p.name} (${q(p.qty)} dispo.)` : `${p.name} (rupture)`,
    more: n => `et ${n} autre${n > 1 ? 's' : ''}`
  },
  en: {
    q: n => String(+n || 0),
    newT: n => n > 1 ? `${n} new products` : 'New product',
    upT: n => n > 1 ? `${n} products restocked` : 'Restocked',
    downT: n => n > 1 ? `Stock down on ${n} products` : 'Stock down',
    left: (p, q) => +p.qty > 0 ? `${p.name} (${q(p.qty)} available)` : `${p.name} (out of stock)`,
    more: n => `and ${n} more`
  }
};
function notifList(d, data, prefs) {
  const t = NT[data.lang === 'en' ? 'en' : 'fr'], shop = data.shop ? data.shop + ' · ' : '';
  const body = list => { const s = list.slice(0, 3).map(p => t.left(p, t.q)); if (list.length > 3) s.push(t.more(list.length - 3)); return s.join('\n'); };
  const out = [];
  if (prefs.newP && d.newP.length) out.push({ tag: 'new', title: shop + t.newT(d.newP.length), body: body(d.newP) });
  if (prefs.up && d.up.length) out.push({ tag: 'up', title: shop + t.upT(d.up.length), body: body(d.up) });
  if (prefs.down && d.down.length) out.push({ tag: 'down', title: shop + t.downT(d.down.length), body: body(d.down) });
  return out;
}
// Compare avec l'instantané, met l'instantané à jour et, si demandé, affiche les notifications.
// Renvoie les différences (ou null la première fois : rien à comparer).
async function checkCatalog(reg, data, notify) {
  const st = await getState();
  if (!st.f || !st.k) return null;
  if (!data) data = await fetchCat(st.f, st.k);
  let d = null;
  if (st.snap && st.snapF === st.f) {
    d = diffCat(st.snap, data);
    const prefs = prefsOf(st);
    if (notify && reg && prefs.on && self.Notification && Notification.permission === 'granted') {
      for (const n of notifList(d, data, prefs))
        await reg.showNotification(n.title, { body: n.body, tag: 'catalogue-' + n.tag, renotify: true, icon: 'icon-192.png', data: { url: './' } });
    }
  }
  st.snap = snapOf(data); st.snapF = st.f; st.checkedAt = new Date().toISOString();
  await setState(st);
  return d;
}
