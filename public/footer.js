/*! Minor Works shared footer · v1.7.0
 *  One script, one manifest, every property.
 *  Usage:  <script src="https://minorworks.co/footer.js" data-site="dappled" defer></script>
 *  Docs:   see INSTALL.md
 */
(function () {
  'use strict';

  var VERSION = '1.7.0';
  if (window.__mwFooter) return;

  /* ---------- script context & options ---------- */
  var script = document.currentScript;
  if (!script) {
    var all = document.getElementsByTagName('script');
    for (var i = all.length - 1; i >= 0; i--) {
      if (/footer(\.min)?\.js/.test(all[i].src)) { script = all[i]; break; }
    }
  }
  var ds = (script && script.dataset) || {};
  var scriptBase = 'https://minorworks.co/';
  try { if (script && script.src) scriptBase = new URL('./', script.src).href; } catch (e) {}

  var MANIFEST_URL = ds.manifest || scriptBase + 'manifest.json';
  var CACHE_KEY = 'mw:footer:manifest:v1';
  var FRESH_MS = 10 * 60 * 1000;
  function parseHide(v) { return (v || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean); }
  var hide = parseHide(ds.hide);
  function hidden(name) { return hide.indexOf(name) >= 0; }

  var FALLBACK = {
    studio: {
      name: 'Minor Works Studio',
      short: 'Minor Works',
      tagline: 'Small games and quiet tools.',
      location: 'Boston',
      url: 'https://minorworks.co',
      contact: 'hello@minorworks.co'
    },
    footerLinks: [{ label: 'All projects', url: 'https://minorworks.co' }],
    sites: []
  };

  var M = FALLBACK;        // current manifest
  var current = null;      // current site record
  var host = null;         // mount element
  var root = null;         // shadow root
  var viewSent = false;
  var observer = null;

  /* ---------- small utils ---------- */
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        var v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'text') el.textContent = v;
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    (kids || []).forEach(function (c) {
      if (c == null) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }

  function safeUrl(u) {
    if (!u || typeof u !== 'string') return null;
    return /^(https?:|mailto:)/i.test(u) ? u : null;
  }

  function hostOf(u) {
    try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  }

  var HUES = [12, 38, 95, 160, 195, 225, 265, 330];

  function resolveUrl(u) {
    try { return new URL(u, new URL(MANIFEST_URL, location.href)).href; } catch (e) { return null; }
  }

  function monogram(s) {
    return h('div', {
      class: 'ic mono', 'aria-hidden': 'true',
      style: '--h:' + HUES[hash(String(s.id)) % HUES.length]
    }, [(s.name || s.id || '?').charAt(0).toUpperCase()]);
  }

  function iconEl(s, compact) {
    var mode = ds.icons || 'auto';
    if (mode === 'none' || compact) return null;
    var src = mode === 'monogram' || !s.icon ? null : safeUrl(resolveUrl(s.icon));
    if (!src) return mode === 'monogram' ? monogram(s) : null;
    var img = h('img', { class: 'ic', src: src, alt: '', width: '44', height: '44', loading: 'lazy', decoding: 'async' });
    img.addEventListener('error', function () { if (img.parentNode) img.parentNode.removeChild(img); });
    return img;
  }

  function titleEl(s) {
    var name = String(s.name || s.id || '');
    if ((ds.icons || 'auto') !== 'auto' || !name) return h('strong', { text: name });
    var first = name.charAt(0);
    return h('strong', null, [
      h('span', { class: 'lt', style: '--h:' + HUES[hash(String(s.id)) % HUES.length] }, [first]),
      name.slice(1)
    ]);
  }

  function today() { return new Date().toISOString().slice(0, 10); }

  function hash(str) {
    var x = 2166136261;
    for (var i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); }
    return x >>> 0;
  }

  function rng(seed) {
    var a = seed;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function managedHosts() {
    var set = {};
    var s = (M.studio && M.studio.url) || '';
    if (s) set[hostOf(s)] = 1;
    (M.sites || []).forEach(function (x) { if (x.url) set[hostOf(x.url)] = 1; });
    return set;
  }

  function addParams(href, params) {
    try {
      var u = new URL(href, location.href);
      Object.keys(params).forEach(function (k) {
        if (params[k] && !u.searchParams.has(k)) u.searchParams.set(k, params[k]);
      });
      return u.toString();
    } catch (e) { return href; }
  }

  function withUtm(href, medium, content) {
    var hosts = managedHosts();
    if (!hosts[hostOf(href)]) return href;
    var params = {
      utm_source: current.id,
      utm_medium: medium,
      utm_campaign: 'crosspromo',
      utm_content: content
    };
    // Cross-site links carry the anonymous ID so a hop between sites stays one visitor.
    if (hostOf(href) !== hostOf(location.href) && !optedOut() && M.analytics && M.analytics.posthog) params.mwid = anonId();
    return addParams(href, params);
  }

  function buildId() {
    if (ds.build) return ds.build;
    var m = document.querySelector('meta[name="build"]');
    if (m && m.content) return m.content;
    if (window.__BUILD__) return String(window.__BUILD__);
    return document.documentElement.getAttribute('data-build') || '';
  }

  /* ---------- privacy & analytics ---------- */
  // Visitors in the EU and UK are asked first. Everyone else is counted unless they opt out.
  // The region is a guess from the browser time zone; it errs on the side of asking.
  var CONSENT_KEY = 'mw:consent';
  function needsConsent() {
    try {
      var tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '');
      return /^Europe\//.test(tz) || /^Atlantic\/(Azores|Madeira|Canary|Reykjavik|Faroe)$/.test(tz) || tz === 'Africa/Ceuta';
    } catch (e) { return false; }
  }
  function consentState() {
    try { var v = localStorage.getItem(CONSENT_KEY); return v === 'granted' || v === 'denied' ? v : null; } catch (e) { return null; }
  }
  function optedOut_signals() {
    try {
      if (navigator.globalPrivacyControl === true) return true;
      if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return true;
      if (localStorage.getItem('mw-optout') === '1') return true;
    } catch (e) {}
    return false;
  }
  function optedOut() {
    try {
      if (navigator.globalPrivacyControl === true) return true;
      if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return true;
      if (localStorage.getItem('mw-optout') === '1') return true;
    } catch (e) {}
    var c = consentState();
    if (c === 'denied') return true;
    if (needsConsent() && c !== 'granted') return true;
    return false;
  }

  function ensureGa4() {
    var id = ds.ga === 'load' && M.analytics && M.analytics.ga4;
    if (!id || optedOut()) return;
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
    }
    // already configured on this page (by the site or an earlier render): nothing to add
    var dl = window.dataLayer;
    for (var i = 0; i < dl.length; i++) {
      if (dl[i] && dl[i][0] === 'config' && dl[i][1] === id) return;
    }
    // add the Minor Works property alongside whatever the page already reports to
    window.gtag('config', id);
    if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
      document.head.appendChild(s);
    }
  }

  // Random anonymous ID kept in local storage (no name, no email, no cookie).
  // The same key is read by the games so a visitor is one person across Minor Works.
  function anonId() {
    try {
      var v = localStorage.getItem('mw:aid');
      if (v) return v;
      var a = new Uint8Array(12), out = '';
      (window.crypto || window.msCrypto).getRandomValues(a);
      for (var i = 0; i < a.length; i++) out += (a[i] % 36).toString(36);
      v = 'mw_' + out;
      localStorage.setItem('mw:aid', v);
      return v;
    } catch (e) { return ''; }
  }

  // Events go to the shared Minor Works PostHog project over its plain HTTP API.
  // The project discards IP addresses. Nothing is sent when optedOut() is true.
  function phSend(event, props) {
    var cfg = M.analytics && M.analytics.posthog;
    if (!cfg || !cfg.key || optedOut() || typeof fetch !== 'function') return;
    // Preview deploys and local dev builds are not real visitors.
    if (/(^|\.)(vercel\.app|netlify\.app|localhost)$|^127\.|^0\.0\.0\.0$/.test(location.hostname) && ds.previews !== 'on') return;
    var id = anonId();
    if (!id) return;
    var body = {
      api_key: cfg.key,
      event: event,
      distinct_id: id,
      properties: props || {},
      timestamp: new Date().toISOString()
    };
    try {
      fetch((cfg.host || 'https://us.i.posthog.com').replace(/\/$/, '') + '/e/', {
        method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body), keepalive: true, credentials: 'omit'
      }).catch(function () {});
    } catch (e) {}
  }

  function phProps(extra) {
    var p = {
      $lib: 'mw-footer',
      $lib_version: VERSION,
      $current_url: location.href.split('#')[0],
      $host: location.hostname,
      $pathname: location.pathname,
      $referrer: document.referrer || '$direct',
      $referring_domain: refHost() || '$direct',
      $device_type: deviceClass(),
      site: current ? current.id : (ds.site || ''),
      footer_version: VERSION
    };
    var vs = psid();
    if (vs) p.$session_id = vs.id;
    try {
      var q = new URLSearchParams(location.search);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (n) {
        var v = q.get(n);
        if (v) p[n] = v.slice(0, 60);
      });
    } catch (e) {}
    if (extra) for (var k in extra) p[k] = extra[k];
    return p;
  }

  // Visit ID: UUID-shaped, kept in session storage for this tab (no cookie), renewed after 30 quiet minutes.
  function psid() {
    try {
      var k = 'mw:ps', now = Date.now(), v = JSON.parse(sessionStorage.getItem(k) || 'null');
      if (!v || !v.id || now - v.t > 1800000) {
        var a = new Uint8Array(16), h = '';
        (window.crypto || window.msCrypto).getRandomValues(a);
        a[6] = (a[6] & 15) | 64; a[8] = (a[8] & 63) | 128;
        for (var i = 0; i < 16; i++) h += (a[i] + 256).toString(16).slice(1);
        v = { id: h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20), t: now, n: 0 };
      }
      v.t = now;
      sessionStorage.setItem(k, JSON.stringify(v));
      return v;
    } catch (e) { return null; }
  }

  // One count per page load, so sites with no analytics of their own still show up.
  var pageSent = false;
  function sendPageview() {
    if (pageSent || optedOut() || ds.pageview === 'off') return;
    if (!(M.analytics && M.analytics.posthog && M.analytics.posthog.key)) return; // manifest not loaded yet: try again on next render
    pageSent = true;
    var vs = psid(), extra = {};
    if (vs) {
      vs.n = (vs.n || 0) + 1;
      try { sessionStorage.setItem('mw:ps', JSON.stringify(vs)); } catch (e) {}
      extra.entry = vs.n === 1;
      extra.session_page_number = vs.n;
    }
    phSend('mw_pageview', phProps(extra));
    startEngagement();
    // Arrived from another Minor Works site: link the two anonymous IDs so a journey reads as one person.
    try {
      var q = new URLSearchParams(location.search), from = q.get('mwid');
      if (from && /^mw_[a-z0-9]{8,32}$/.test(from)) {
        var mine = anonId();
        if (mine && from !== mine) phSend('$create_alias', { distinct_id: mine, alias: from, site: current.id });
        q.delete('mwid');
        var qs = q.toString();
        history.replaceState(history.state, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
      }
    } catch (e) {}
  }

  /* ---------- engagement: active time, scroll depth, outbound clicks ---------- */
  var eng = { on: false, ms: 0, sent: 0, scroll: 0, marks: {}, last: Date.now() };
  function startEngagement() {
    if (eng.on || ds.pageview === 'off') return;
    eng.on = true;
    var bump = function () { eng.last = Date.now(); };
    ['scroll', 'mousemove', 'keydown', 'touchstart', 'click'].forEach(function (n) {
      window.addEventListener(n, bump, { passive: true, capture: true });
    });
    // Active time: counted only while the tab is visible and the person did something in the last 30 seconds.
    setInterval(function () {
      if (document.visibilityState === 'visible' && Date.now() - eng.last < 30000) eng.ms += 5000;
    }, 5000);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushEngaged(); });
    window.addEventListener('pagehide', flushEngaged);
    window.addEventListener('scroll', onScrollDepth, { passive: true });
    document.addEventListener('click', onOutbound, true);
    onScrollDepth();
  }
  function flushEngaged() {
    var secs = Math.floor((eng.ms - eng.sent) / 1000);
    if (secs < 1) return;
    eng.sent += secs * 1000;
    phSend('mw_engaged', phProps({ engaged_seconds: Math.min(secs, 1800), max_scroll: eng.scroll }));
  }
  function onScrollDepth() {
    var de = document.documentElement, vh = window.innerHeight || de.clientHeight || 0;
    var h = Math.max(de.scrollHeight || 0, document.body ? document.body.scrollHeight : 0);
    if (!vh || h <= vh + 20) return; // the page fits on screen: no scrolling to measure
    var pct = Math.min(100, Math.round(((window.pageYOffset || de.scrollTop || 0) + vh) / h * 100));
    if (pct > eng.scroll) eng.scroll = pct;
    [25, 50, 75, 100].forEach(function (m) {
      if (pct >= (m === 100 ? 98 : m) && !eng.marks[m]) { eng.marks[m] = 1; phSend('mw_scroll', phProps({ depth: m })); }
    });
  }
  function onOutbound(e) {
    try {
      var path = e.composedPath ? e.composedPath() : [];
      if (host && path.indexOf(host) > -1) return; // footer clicks are tracked as footer_click
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var u = new URL(a.href, location.href);
      if (!/^https?:$/.test(u.protocol) || u.hostname === location.hostname) return;
      var h = hostOf(u.href);
      phSend('mw_outbound', phProps({ outbound_host: h, outbound_url: u.origin + u.pathname, to_minorworks: !!managedHosts()[h] }));
    } catch (x) {}
  }

  function track(name, props) {
    if (optedOut()) return;
    props = props || {};
    props.site = current.id;
    props.footer_version = VERSION;
    phSend(name, phProps(props));
    try { window.dispatchEvent(new CustomEvent('mwfooter:event', { detail: { name: name, props: props } })); } catch (e) {}
    try { if (typeof window.gtag === 'function') window.gtag('event', name, props); } catch (e) {}
    try { if (typeof window.plausible === 'function') window.plausible(name, { props: props }); } catch (e) {}
    try { if (typeof window.fathom === 'object' && window.fathom.trackEvent) window.fathom.trackEvent(name); } catch (e) {}
    beacon(name, props);
  }

  function sid() {
    try {
      var k = 'mw:sid', v = sessionStorage.getItem(k);
      if (!v) {
        v = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 8);
        sessionStorage.setItem(k, v);
      }
      return v;
    } catch (e) { return ''; }
  }

  function deviceClass() {
    var w = window.innerWidth || 0;
    return w < 600 ? 'phone' : w < 1024 ? 'tablet' : 'desktop';
  }

  function refHost() {
    try { return document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch (e) { return ''; }
  }

  // Two modes. "json" (recommended): POST to an ingest endpoint you control (e.g. a Supabase edge function).
  // "supabase": direct REST insert, which needs an insert policy on the table.
  function beacon(name, props) {
    var cfg = M.analytics && M.analytics.events;
    if (!cfg || !cfg.url || typeof fetch !== 'function') return;
    var p = {};
    for (var k in props) if (k !== 'site') p[k] = props[k];
    var headers = { 'Content-Type': 'application/json' };
    var url = cfg.url;
    var row;
    if (cfg.mode === 'supabase') {
      url = cfg.url.replace(/\/$/, '') + '/rest/v1/' + (cfg.table || 'events');
      headers.apikey = cfg.key;
      headers.Authorization = 'Bearer ' + cfg.key;
      headers.Prefer = 'return=minimal';
      row = { site: current.id, event: name, path: location.pathname, ref_host: refHost() || null, session: sid() || null, device: deviceClass(), props: p };
    } else {
      row = { site: current.id, event: name, path: location.pathname, ref: refHost(), sid: sid(), device: deviceClass(), props: p };
    }
    try {
      fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(row), keepalive: true }).catch(function () {});
    } catch (e) {}
  }

  /* ---------- site resolution & cross-link selection ---------- */
  function findCurrent(sites) {
    var id = ds.site;
    var hn = location.hostname.replace(/^www\./, '');
    var match = sites.filter(function (s) { return s.id === id; })[0] ||
      sites.filter(function (s) { return hostOf(s.url) === hn; })[0];
    if (match) return match;
    return {
      id: id || hn,
      name: document.title,
      tags: (ds.tags || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean)
    };
  }

  function pickRelated(sites, cur, n) {
    var rand = ds.rotate === 'off' ? function () { return 0; } : rng(hash(today() + ':' + cur.id));
    var tags = cur.tags || [];
    var excl = cur.exclude || [];
    var grp = cur.group || '';
    var pool = sites.filter(function (s) {
      if (s.id === cur.id || s.live === false || s.promote === false || !s.url || excl.indexOf(s.id) >= 0) return false;
      /* a group's hub page is linked from the group heading on its members, not as a card */
      if (grp && s.hub && s.group === grp) return false;
      /* the hub itself shows what lies outside its own group */
      if (grp && cur.hub && s.group === grp) return false;
      return true;
    });
    var out = [];
    var inGroup = function (s) { return !!grp && s.group === grp; };
    /* leave at least one slot for a site outside the group so the footer still points outward */
    var groupCap = n >= 3 ? n - 1 : n;
    var groupCount = 0;
    var add = function (s) {
      if (!s || out.indexOf(s) >= 0 || out.length >= n) return;
      if (inGroup(s)) { if (groupCount >= groupCap) return; groupCount++; }
      out.push(s);
    };
    (cur.pin || []).forEach(function (id) {
      add(pool.filter(function (x) { return x.id === id; })[0]);
    });
    pool.filter(function (s) { return out.indexOf(s) < 0; })
      .map(function (s) {
        var overlap = (s.tags || []).filter(function (t) { return tags.indexOf(t) >= 0; }).length;
        return { s: s, score: overlap * 3 + (inGroup(s) ? 8 : 0) + (s.weight || 0) + rand() * 2 };
      })
      .sort(function (a, b) { return b.score - a.score; })
      .forEach(function (x) { add(x.s); });
    return out.slice(0, n);
  }

  /* ---------- styles ---------- */
  var CSS = [
    ':host{display:block;container:mwf/inline-size}',
    '.mw{--bg:var(--mw-bg,#faf9f6);--fg:var(--mw-fg,#1d1d1b);--muted:var(--mw-muted,#6b6a63);--line:var(--mw-line,rgba(0,0,0,.12));--card:var(--mw-card,#fff);',
    'background:var(--bg);color:var(--fg);font:14px/1.5 var(--mw-font,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);',
    'border-top:1px solid var(--line);padding:32px 20px calc(24px + env(safe-area-inset-bottom,0px));-webkit-text-size-adjust:100%;box-sizing:border-box}',
    '.mw *{box-sizing:border-box}',
    '.mw.flush{background:transparent;padding-left:0;padding-right:0}',
    '@media(prefers-color-scheme:dark){.mw[data-theme=auto]{--bg:var(--mw-bg,#161614);--fg:var(--mw-fg,#ecebe6);--muted:var(--mw-muted,#9a998f);--line:var(--mw-line,rgba(255,255,255,.14));--card:var(--mw-card,rgba(255,255,255,.05))}}',
    '.mw[data-theme=dark]{--bg:var(--mw-bg,#161614);--fg:var(--mw-fg,#ecebe6);--muted:var(--mw-muted,#9a998f);--line:var(--mw-line,rgba(255,255,255,.14));--card:var(--mw-card,rgba(255,255,255,.05))}',
    '.mw[data-theme=inherit]{--bg:transparent;--fg:currentColor;--muted:color-mix(in srgb,currentColor 62%,transparent);--line:color-mix(in srgb,currentColor 18%,transparent);--card:color-mix(in srgb,currentColor 5%,transparent);color:inherit}',
    '.in{max-width:var(--mw-max,1100px);margin:0 auto;display:grid;gap:24px}',
    '.top{display:grid;gap:24px;grid-template-columns:1fr}',
    '@container mwf (min-width:760px){.top{grid-template-columns:minmax(200px,1fr) 2.6fr}}',
    '@supports not (container-type:inline-size){@media(min-width:760px){.top{grid-template-columns:minmax(200px,1fr) 2.6fr}}}',
    '.brand b{font-size:15px;letter-spacing:.01em}',
    '.brand p{margin:6px 0 0;color:var(--muted);max-width:30ch}',
    '.more h2{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:0 0 10px;font-weight:600}',
    '.more h2 a{color:var(--fg);text-decoration:underline;text-underline-offset:3px}',
    '.moregroup{display:grid;gap:20px}',
    '.cards{display:grid;gap:14px;grid-template-columns:repeat(var(--c,3),minmax(0,1fr));margin:0;padding:0;list-style:none}',
    '@container mwf (max-width:1000px){.cards{grid-template-columns:repeat(var(--c2,2),minmax(0,1fr))}}',
    '@supports not (container-type:inline-size){@media(max-width:1000px){.cards{grid-template-columns:repeat(var(--c2,2),minmax(0,1fr))}}}',
    '@container mwf (max-width:520px){.cards{grid-template-columns:1fr}}',
    '@supports not (container-type:inline-size){@media(max-width:520px){.cards{grid-template-columns:1fr}}}',
    '.card{display:flex}',
    '.card a{display:flex;gap:14px;align-items:flex-start;flex:1;min-height:44px;padding:16px 18px;background:var(--card);border:1px solid var(--line);border-radius:12px;text-decoration:none;transition:border-color .15s}',
    '.card a:hover{border-color:var(--fg)}',
    '.card strong{display:block;font-weight:600;font-size:15px;line-height:1.3}',
    '.lt{font-weight:inherit;color:inherit}',
    '.card .bl{display:block;color:var(--muted);font-size:13px;line-height:1.4;margin-top:4px}',
    '.tx{min-width:0}',
    '.ic{flex:none;width:44px;height:44px;border-radius:10px;object-fit:cover;outline:1px solid rgba(0,0,0,.08);outline-offset:-1px}',
    '.mono{display:flex;align-items:center;justify-content:center;font-weight:700;font-size:19px;background:hsl(var(--h) 35% 86%);color:hsl(var(--h) 45% 26%)}',
    '@media(prefers-color-scheme:dark){.mw[data-theme=auto] .mono{background:hsl(var(--h) 22% 24%);color:hsl(var(--h) 50% 82%)}}',
    '.mw[data-theme=dark] .mono{background:hsl(var(--h) 22% 24%);color:hsl(var(--h) 50% 82%)}',
    '.mw[data-theme=inherit] .mono{background:color-mix(in srgb,currentColor 10%,transparent);color:inherit}',
    'a{color:inherit;text-decoration-color:var(--line);text-underline-offset:3px}',
    'a:hover{text-decoration-color:currentColor}',
    'a:focus-visible,button:focus-visible{outline:2px solid var(--fg);outline-offset:2px;border-radius:4px}',
    '.bar{display:flex;flex-wrap:wrap;gap:8px 24px;align-items:center;justify-content:space-between;border-top:1px solid var(--line);padding-top:14px;color:var(--muted);font-size:13px}',
    '.links{display:flex;flex-wrap:wrap;gap:0 18px;margin:0;padding:0;list-style:none}',
    '.links a,.links button{display:inline-block;padding:8px 0;color:var(--fg)}',
    'button{font:inherit;background:none;border:0;cursor:pointer;text-decoration:underline;text-decoration-color:var(--line);text-underline-offset:3px}',
    'button:hover{text-decoration-color:currentColor}',
    '.meta{display:flex;flex-wrap:wrap;gap:4px 12px}',
    '.mw.compact{padding-top:20px}',
    '.compact .cards{grid-template-columns:repeat(auto-fit,minmax(120px,1fr))}',
    '.compact .bl{display:none}',
    '.compact .card a{min-height:0;padding:9px 12px}',
    '.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    '.cb{position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483000;max-width:560px;margin:0 auto;padding:16px 18px;border-radius:12px;border:1px solid rgba(0,0,0,.14);background:#fff;color:#1d1d1b;box-shadow:0 8px 30px rgba(0,0,0,.18);font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;box-sizing:border-box}',
    '@media(prefers-color-scheme:dark){.cb{background:#1f1f1d;color:#ecebe6;border-color:rgba(255,255,255,.18)}}',
    '.cb p{margin:0 0 12px}',
    '.cb strong{font-weight:600}',
    '.cb a{color:inherit}',
    '.cb .row{display:flex;flex-wrap:wrap;gap:10px}',
    '.cb button{flex:1 1 120px;min-height:44px;padding:10px 16px;border-radius:10px;border:1px solid currentColor;background:transparent;color:inherit;font:inherit;font-weight:600;text-decoration:none;cursor:pointer}',
    '.cb button:hover{background:rgba(127,127,127,.14)}',
    '@media print{:host{display:none}}'
  ].join('');

  /* ---------- consent banner ---------- */
  function privacyUrl() { return (M.legal && safeUrl(M.legal.privacy)) ? M.legal.privacy : 'https://minorworks.co/privacy'; }

  function closeBanner() {
    var b = root && root.querySelector('.cb');
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  function showBanner() {
    if (!root || root.querySelector('.cb')) return;
    var box = h('div', { class: 'cb', role: 'dialog', 'aria-label': 'Privacy choices' }, [
      h('p', null, [
        h('strong', { text: 'Counting visits. ' }),
        'Minor Works counts visits to see what people enjoy. If you accept we store a random ID in your browser so we can recognize you across our sites. We discard your IP address and never use any of this for ads or sell it. ',
        h('a', { href: privacyUrl(), target: '_blank', rel: 'noopener', text: 'Privacy' })
      ]),
      h('div', { class: 'row' }, [
        h('button', { type: 'button', 'data-consent': 'granted', text: 'Accept' }),
        h('button', { type: 'button', 'data-consent': 'denied', text: 'No thanks' })
      ])
    ]);
    root.appendChild(box);
  }

  function setConsent(v) {
    try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {}
    if (v === 'denied') {
      // forget the anonymous ID and any GA identifiers we control
      try { localStorage.removeItem('mw:aid'); } catch (e) {}
      try { window['ga-disable-' + (M.analytics && M.analytics.ga4)] = true; } catch (e) {}
    } else {
      try { window['ga-disable-' + (M.analytics && M.analytics.ga4)] = false; } catch (e) {}
    }
    closeBanner();
    try { window.dispatchEvent(new CustomEvent('mwfooter:consent', { detail: { granted: v === 'granted' } })); } catch (e) {}
    if (v === 'granted') {
      render();       // rebuild links so they carry the anonymous ID
      sendPageview();
      viewSent = false;
      observeView();
    }
  }

  /* ---------- render ---------- */
  function link(label, href, kind, target, extra) {
    var a = h('a', { href: href, 'data-k': kind, 'data-t': target || '' }, [label]);
    if (extra) for (var k in extra) a.setAttribute(k, extra[k]);
    if (/^https?:/i.test(href) && hostOf(href) !== location.hostname.replace(/^www\./, '') && !managedHosts()[hostOf(href)]) {
      a.setAttribute('rel', 'noopener');
    }
    return a;
  }

  function render() {
    var studio = M.studio || FALLBACK.studio;
    current = findCurrent(M.sites || []);
    var count = parseInt(ds.count || (M.footer && M.footer.count) || 4, 10);
    var related = hidden('related') ? [] : pickRelated(M.sites || [], current, count);
    var theme = ds.theme || 'auto';
    var compact = ds.compact !== undefined && ds.compact !== 'false';

    var flush = ds.flush !== undefined && ds.flush !== 'false';
    var wrap = h('div', { class: 'mw' + (compact ? ' compact' : '') + (flush ? ' flush' : ''), 'data-theme': theme });
    var inner = h('div', { class: 'in' });
    var top = h('div', { class: 'top' });

    if (!hidden('brand')) {
      var brand = h('div', { class: 'brand' }, [
        h('b', { text: studio.name }),
        studio.tagline ? h('p', { text: studio.tagline }) : null
      ]);
      top.appendChild(brand);
    }

    if (related.length) {
      var groups = M.groups || {};
      var grpInfo = current.group && groups[current.group];
      var members = []; // one flat list: group names no longer split the cards into sections
      var others = related.filter(function (s) { return members.indexOf(s) < 0; });
      var cardList = function (list) {
        var n = list.length;
        var ul = h('ul', { class: 'cards', style: '--c:' + (n <= 3 ? n : (n === 4 ? 2 : 3)) + ';--c2:' + Math.min(n, 2) });
        list.forEach(function (s) {
          var a = h('a', { href: withUtm(s.url, 'footer', s.id), 'data-k': 'crosslink', 'data-t': s.id }, [
            iconEl(s, compact),
            h('div', { class: 'tx' }, [
              titleEl(s),
              s.blurb ? h('span', { class: 'bl', text: s.blurb }) : null
            ])
          ]);
          ul.appendChild(h('li', { class: 'card' }, [a]));
        });
        return ul;
      };
      var moreWrap = h('div', { class: 'moregroup' });
      if (members.length) {
        var gTitle = grpInfo.name || current.group;
        var gHead = h('h2', null, [
          'More from ',
          safeUrl(grpInfo.url)
            ? h('a', { href: withUtm(grpInfo.url, 'footer', current.group), 'data-k': 'crosslink', 'data-t': current.group, text: gTitle })
            : gTitle
        ]);
        moreWrap.appendChild(h('nav', { class: 'more', 'aria-label': 'More from ' + gTitle }, [gHead, cardList(members)]));
      }
      if (others.length) {
        var oTitle = (members.length ? 'And more from ' : 'More from ') + (studio.short || studio.name);
        moreWrap.appendChild(h('nav', { class: 'more', 'aria-label': oTitle }, [h('h2', { text: oTitle }), cardList(others)]));
      }
      top.appendChild(moreWrap);
    }
    if (top.childNodes.length) inner.appendChild(top);

    /* link bar */
    var items = [];
    if (!hidden('contact') && studio.contact) {
      items.push(link('Contact', 'mailto:' + studio.contact, 'contact'));
    }
    if (!hidden('feedback') && ds.feedback === 'on' && studio.contact) {
      var b = buildId();
      var body = '\n\n---\nPage: ' + location.href + (b ? '\nBuild: ' + b : '') + '\nBrowser: ' + navigator.userAgent;
      var subject = 'Feedback: ' + (current.name || current.id);
      items.push(link('Send feedback', 'mailto:' + studio.contact + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body), 'feedback'));
    }
    if (!hidden('newsletter') && M.newsletter && safeUrl(M.newsletter.url)) {
      items.push(link(M.newsletter.label || 'Follow along', withUtm(M.newsletter.url, 'footer', 'newsletter'), 'newsletter'));
    }
    if (!hidden('share')) {
      items.push(h('button', { type: 'button', 'data-share': '1' }, ['Share this page']));
    }
    if (!hidden('legal') && M.legal) {
      if (safeUrl(M.legal.privacy)) items.push(link('Privacy', M.legal.privacy, 'legal', 'privacy'));
      if (safeUrl(M.legal.terms)) items.push(link('Terms', M.legal.terms, 'legal', 'terms'));
    }
    if (!hidden('choices') && M.analytics && (M.analytics.posthog || M.analytics.ga4)) {
      items.push(h('button', { type: 'button', 'data-choices': '1' }, ['Privacy choices']));
    }
    (M.footerLinks || []).forEach(function (l) {
      if (l && l.label && safeUrl(l.url)) items.push(link(l.label, withUtm(l.url, 'footer', 'studio'), 'studio', l.label));
    });

    var bar = h('div', { class: 'bar' });
    if (items.length) {
      bar.appendChild(h('ul', { class: 'links' }, items.map(function (x) { return h('li', null, [x]); })));
    }
    var meta = h('div', { class: 'meta' }, [
      h('span', { text: '\u00A9 ' + new Date().getFullYear() + ' ' + studio.name + (studio.location ? ' \u00B7 ' + studio.location : '') })
    ]);
    var bid = buildId();
    if (bid) meta.appendChild(h('span', { text: 'build ' + bid, title: 'Footer v' + VERSION }));
    bar.appendChild(meta);
    bar.appendChild(h('span', { class: 'sr', 'aria-live': 'polite', 'data-status': '1' }));
    inner.appendChild(bar);
    wrap.appendChild(inner);

    while (root.firstChild) root.removeChild(root.firstChild);
    root.appendChild(h('style', { text: CSS }));
    root.appendChild(wrap);
    root.__related = related.map(function (s) { return s.id; });

    host.setAttribute('data-mw-footer', VERSION);
    if (needsConsent() && consentState() === null && !optedOut_signals()) showBanner();
    ensureGa4();
    sendPageview();
    observeView();
  }

  /* ---------- interactions ---------- */
  function shareUrl() {
    var c = document.querySelector('link[rel="canonical"]');
    var base = (c && c.href) || location.href.split('#')[0];
    return addParams(base, { utm_source: current.id, utm_medium: 'share' });
  }

  function say(msg) {
    var s = root.querySelector('[data-status]');
    if (!s) return;
    s.textContent = msg;
    setTimeout(function () { s.textContent = ''; }, 2500);
  }

  function onShare(btn) {
    var url = shareUrl();
    var data = { title: document.title, url: url };
    if (navigator.share) {
      navigator.share(data).then(function () { track('footer_share', { method: 'native' }); }).catch(function () {});
      return;
    }
    var done = function () {
      var old = btn.textContent;
      btn.textContent = 'Link copied';
      say('Link copied');
      track('footer_share', { method: 'copy' });
      setTimeout(function () { btn.textContent = old; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(function () { window.prompt('Copy this link', url); });
    } else {
      window.prompt('Copy this link', url);
    }
  }

  function bind() {
    root.addEventListener('click', function (e) {
      var t = e.target;
      var btn = t.closest && t.closest('button[data-share]');
      if (btn) { onShare(btn); return; }
      var cb = t.closest && t.closest('button[data-consent]');
      if (cb) { setConsent(cb.getAttribute('data-consent')); return; }
      var ch = t.closest && t.closest('button[data-choices]');
      if (ch) { showBanner(); return; }
      var a = t.closest && t.closest('a[data-k]');
      if (a) track('footer_click', { kind: a.getAttribute('data-k'), target: a.getAttribute('data-t'), href: a.getAttribute('href').split('?')[0] });
    });
  }

  function observeView() {
    if (viewSent || !(M.analytics && M.analytics.view !== false)) return;
    var fire = function () {
      if (viewSent) return;
      viewSent = true;
      var vp = { shown: (root.__related || []).join(',') };
      try {
        var q = new URLSearchParams(location.search), med = q.get('utm_medium');
        if ((med === 'footer' || med === 'share') && q.get('utm_source')) {
          vp.arrived_via = med;
          vp.arrived_from = q.get('utm_source').slice(0, 30);
        }
      } catch (e) {}
      track('footer_view', vp);
    };
    if (!('IntersectionObserver' in window)) { fire(); return; }
    if (observer) observer.disconnect();
    observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (en) { return en.isIntersecting; })) { fire(); observer.disconnect(); }
    }, { threshold: 0.25 });
    observer.observe(host);
  }

  /* ---------- manifest loading (stale-while-revalidate) ---------- */
  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) { return null; }
  }
  function writeCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), url: MANIFEST_URL, data: data })); } catch (e) {}
  }

  function fetchManifest() {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 3500) : null;
    return fetch(MANIFEST_URL, { credentials: 'omit', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('manifest ' + r.status); return r.json(); })
      .then(function (d) { if (timer) clearTimeout(timer); return d; });
  }

  function load() {
    var cached = readCache();
    if (cached && cached.url !== MANIFEST_URL) cached = null;
    if (cached && cached.data) { M = cached.data; render(); }
    var fresh = cached && Date.now() - cached.t < FRESH_MS;
    if (fresh) return;
    if (typeof fetch !== 'function') { if (!cached) render(); return; }
    fetchManifest().then(function (data) {
      if (!data || typeof data !== 'object' || !data.studio) throw new Error('bad manifest');
      var changed = !cached || JSON.stringify(cached.data) !== JSON.stringify(data);
      writeCache(data);
      if (changed) { M = data; render(); }
    }).catch(function () {
      if (!cached) { M = FALLBACK; render(); }
    });
  }

  /* ---------- mount ---------- */
  function mount() {
    host = document.getElementById('mw-footer');
    if (!host) { host = document.createElement('div'); host.id = 'mw-footer'; document.body.appendChild(host); }
    root = host.attachShadow ? (host.shadowRoot || host.attachShadow({ mode: 'open' })) : null;
    if (!root) return;
    bind();
    function setHide(v) {
      var next = parseHide(v);
      if (next.join(',') === hide.join(',')) return;
      hide = next;
      if (M) render();
    }
    window.__mwFooter = { version: VERSION, setHide: setHide, refresh: function () { try { localStorage.removeItem(CACHE_KEY); } catch (e) {} load(); } };
    // single-page sites can also just change the script tag's data-hide attribute
    try {
      if (script && window.MutationObserver) {
        new MutationObserver(function () { setHide(script.getAttribute('data-hide')); })
          .observe(script, { attributes: true, attributeFilter: ['data-hide'] });
      }
    } catch (e) {}
    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
