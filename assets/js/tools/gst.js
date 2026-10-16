/*
 * BISCS Tools — GST & tax utilities (India).
 * GSTIN validator, PAN / IFSC / MICR checker, HSN & SAC code finder and
 * GST due date calendar with .ics export.
 *
 * Everything runs locally with built-in data. No network requests.
 */
(function () {
  'use strict';
  var BT = window.BT;
  var $ = BT.$, $$ = BT.$$, esc = BT.esc;

  // ================================================================== styles
  var CSS = [
    '.gst-wrap{display:flex;flex-direction:column;gap:16px;min-width:0}',
    '.gst-wrap>.card+.card{margin-top:0}',
    '.gst-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px}',
    '.gst-bar .seg{max-width:100%}',
    '.gst-big{font-family:var(--mono)!important;font-size:1.12rem!important;letter-spacing:.08em;text-transform:uppercase;min-height:52px!important}',
    '.gst-big::placeholder{letter-spacing:.04em;text-transform:none;opacity:.6}',
    '.gst-inline{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
    '.gst-inline>input{flex:1 1 220px;min-width:0}',
    '.gst-hero{position:relative;overflow:hidden;border-radius:var(--radius);padding:20px 22px;color:#fff;',
    'background:radial-gradient(420px 220px at 100% 0%,rgba(255,255,255,.2),transparent 60%),linear-gradient(135deg,var(--brand),var(--brand-2));box-shadow:0 18px 40px -24px var(--brand)}',
    '.gst-hero.ok{background:radial-gradient(420px 220px at 100% 0%,rgba(255,255,255,.2),transparent 60%),linear-gradient(135deg,#047857,#0f766e 55%,#0e7490);box-shadow:0 18px 40px -24px #047857}',
    '.gst-hero.bad{background:radial-gradient(420px 220px at 100% 0%,rgba(255,255,255,.18),transparent 60%),linear-gradient(135deg,#b91c1c,#be185d);box-shadow:0 18px 40px -24px #b91c1c}',
    '.gst-hero .gst-h-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-weight:700;font-size:.82rem;letter-spacing:.06em;text-transform:uppercase;opacity:.95}',
    '.gst-hero .gst-h-top .icon{width:20px;height:20px}',
    '.gst-hero .gst-h-msg{font-size:clamp(1.15rem,3vw,1.45rem);font-weight:800;letter-spacing:-.01em;margin:8px 0 14px;line-height:1.25}',
    '.gst-hero .gst-h-sub{font-size:.9rem;opacity:.92;margin-top:12px}',
    '.gst-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.28);padding:3px 10px;border-radius:999px;font-size:.74rem;font-weight:750;letter-spacing:.05em}',
    '.gst-code{display:flex;flex-wrap:wrap;gap:8px}',
    '.gst-cseg{display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0}',
    '.gst-cseg b{font-family:var(--mono);font-size:1.18rem;font-weight:700;padding:7px 10px;border-radius:10px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.22);letter-spacing:.08em;line-height:1.1;word-break:break-all}',
    '.gst-cseg.x b{background:rgba(0,0,0,.22);border-color:rgba(255,255,255,.55);box-shadow:inset 0 0 0 1px rgba(255,255,255,.4)}',
    '.gst-cseg span{font-size:.66rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;opacity:.85}',
    '.gst-kv{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}',
    '.gst-kv .stat .value{font-size:1.02rem}',
    '.gst-kv .stat .sub{font-size:.8rem;color:var(--text-3);margin-top:2px}',
    '.gst-checks{list-style:none;margin:0;padding:0;display:grid;gap:2px}',
    '.gst-checks li{display:flex;gap:10px;align-items:flex-start;padding:8px 4px;border-bottom:1px dashed var(--border);font-size:.9rem}',
    '.gst-checks li:last-child{border-bottom:0}',
    '.gst-checks .gst-ci{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;margin-top:1px}',
    '.gst-checks .gst-ci .icon{width:13px;height:13px}',
    '.gst-checks li.p .gst-ci{background:var(--ok-soft);color:var(--ok)}',
    '.gst-checks li.f .gst-ci{background:var(--danger-soft);color:var(--danger)}',
    '.gst-checks li.n .gst-ci{background:var(--surface-2);color:var(--text-3)}',
    '.gst-checks b{font-weight:650;color:var(--text)}',
    '.gst-checks .d{color:var(--text-2)}',
    '.gst-mono{font-family:var(--mono);letter-spacing:.03em}',
    '.gst-note{font-size:.82rem;color:var(--text-3);margin:10px 0 0}',
    '.gst-note a,.gst-link{word-break:break-all}',
    '.gst-stats{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(120px,1fr))}',
    '.gst-stats .stat .value{font-size:1.35rem}',
    '.gst-stats .stat.ok .value{color:var(--ok)}.gst-stats .stat.bad .value{color:var(--danger)}.gst-stats .stat.warn .value{color:var(--warn)}',
    '.gst-tw{max-height:520px;overflow:auto}',
    '.gst-tw .table td.wrap{white-space:normal;min-width:220px}',
    '.gst-tw .table tr.bad td:first-child{box-shadow:inset 3px 0 0 var(--danger)}',
    '.gst-tw .table tr.ok td:first-child{box-shadow:inset 3px 0 0 var(--ok)}',
    '.gst-ta{font-family:var(--mono);font-size:.88rem;letter-spacing:.03em;min-height:190px!important}',
    '.gst-tabs{display:flex;gap:4px;border-bottom:1px solid var(--border);margin-bottom:16px;overflow-x:auto}',
    '.gst-tabs button{font:inherit;font-weight:650;font-size:.92rem;display:inline-flex;align-items:center;gap:8px;border:0;background:none;color:var(--text-3);padding:10px 14px;border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer;white-space:nowrap}',
    '.gst-tabs button[aria-selected=true]{color:var(--brand);border-bottom-color:var(--brand)}',
    '.gst-tabs button:focus-visible{outline:none;box-shadow:var(--ring);border-radius:8px 8px 0 0}',
    '.gst-banks{display:grid;gap:6px;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));max-height:340px;overflow:auto;padding:2px}',
    '.gst-banks div{display:flex;gap:10px;align-items:center;padding:7px 10px;border:1px solid var(--border);border-radius:9px;background:var(--surface-2);font-size:.85rem;min-width:0}',
    '.gst-banks div b{font-family:var(--mono);font-size:.82rem;color:var(--brand);flex:none}',
    '.gst-banks div span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    // HSN finder
    '.gst-hsn{display:grid;gap:16px;grid-template-columns:1fr}',
    '@media(min-width:960px){.gst-hsn{grid-template-columns:300px minmax(0,1fr)}}',
    '.gst-hsn>*{min-width:0}',
    '.gst-hsn>.gst-hsn-tree{order:2}@media(min-width:960px){.gst-hsn>.gst-hsn-tree{order:0}}',
    '.gst-search{position:relative}',
    '.gst-search .icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-3);pointer-events:none}',
    '.gst-search input{padding-left:42px!important;min-height:50px!important;font-size:1rem!important}',
    '.gst-res{display:flex;flex-direction:column;gap:8px}',
    '.gst-item{display:flex;gap:14px;align-items:flex-start;padding:12px 14px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);transition:border-color .15s,box-shadow .15s}',
    '.gst-item:hover{border-color:var(--border-strong);box-shadow:var(--shadow-sm)}',
    '.gst-item .gst-cc{flex:none;min-width:78px;text-align:center;font-family:var(--mono);font-weight:750;font-size:1rem;letter-spacing:.04em;padding:6px 8px;border-radius:9px;background:var(--brand-soft);color:var(--brand)}',
    '.gst-item.svc .gst-cc{background:var(--ok-soft);color:var(--ok)}',
    '.gst-item.chap .gst-cc{background:var(--warn-soft);color:var(--warn)}',
    '.gst-item .gst-body{flex:1;min-width:0}',
    '.gst-item .gst-desc{font-weight:600;color:var(--text);line-height:1.4}',
    '.gst-item .gst-path{font-size:.8rem;color:var(--text-3);margin-top:3px}',
    '.gst-item .btn{flex:none}',
    '.gst-item mark{background:color-mix(in srgb,var(--warn) 22%,transparent);color:inherit;border-radius:3px;padding:0 1px}',
    '.gst-tree{max-height:640px;overflow:auto;display:flex;flex-direction:column;gap:4px}',
    '.gst-tree details{border-radius:9px}',
    '.gst-tree summary{cursor:pointer;list-style:none;display:flex;gap:8px;align-items:flex-start;padding:7px 8px;border-radius:9px;font-size:.86rem;font-weight:650;color:var(--text)}',
    '.gst-tree summary::-webkit-details-marker{display:none}',
    '.gst-tree summary:hover{background:var(--surface-2)}',
    '.gst-tree summary .icon{flex:none;margin-top:2px;transition:transform .15s;color:var(--text-3)}',
    '.gst-tree details[open]>summary .icon{transform:rotate(90deg)}',
    '.gst-tree summary em{font-style:normal;color:var(--brand);font-family:var(--mono);flex:none;min-width:34px}',
    '.gst-tree .gst-chs{display:flex;flex-direction:column;padding:0 0 6px 18px}',
    '.gst-tree .gst-chs button{font:inherit;text-align:left;border:0;background:none;color:var(--text-2);font-size:.84rem;padding:5px 8px;border-radius:8px;cursor:pointer;display:flex;gap:8px}',
    '.gst-tree .gst-chs button:hover,.gst-tree .gst-chs button[aria-current=true]{background:var(--brand-soft);color:var(--brand)}',
    '.gst-tree .gst-chs button b{font-family:var(--mono);flex:none}',
    '.gst-tree .gst-chs button.res{font-style:italic}',
    // Calendar
    '.gst-next{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px}',
    '.gst-next .gst-nd{font-size:clamp(1.6rem,4vw,2.2rem);font-weight:800;letter-spacing:-.03em;line-height:1.1}',
    '.gst-month{margin-top:4px}',
    '.gst-month+.gst-month{margin-top:18px}',
    '.gst-month h4{display:flex;align-items:center;gap:10px;margin:0 0 8px;font-size:.8rem;font-weight:750;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3)}',
    '.gst-month h4::after{content:"";flex:1;height:1px;background:var(--border)}',
    '.gst-month.now h4{color:var(--brand)}',
    '.gst-evs{display:flex;flex-direction:column;gap:8px}',
    '.gst-ev{display:grid;grid-template-columns:54px minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface)}',
    '.gst-ev .gst-dt{text-align:center;border-radius:10px;background:var(--surface-2);border:1px solid var(--border);padding:5px 0;line-height:1.05}',
    '.gst-ev .gst-dt b{display:block;font-size:1.25rem;font-weight:800;font-variant-numeric:tabular-nums}',
    '.gst-ev .gst-dt span{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3)}',
    '.gst-ev .gst-f{font-weight:750;display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.gst-ev .gst-f i{width:9px;height:9px;border-radius:3px;display:inline-block;flex:none}',
    '.gst-ev .gst-p{font-size:.84rem;color:var(--text-2);margin-top:1px}',
    '.gst-ev.past{opacity:1;filter:saturate(.4)}',
    '.gst-ev.past .gst-dt{background:var(--danger-soft);border-color:transparent}',
    '.gst-ev.soon{border-color:color-mix(in srgb,var(--warn) 55%,var(--border));box-shadow:0 0 0 3px color-mix(in srgb,var(--warn) 14%,transparent)}',
    '.gst-ev.soon .gst-dt{background:var(--warn-soft);border-color:transparent}',
    '.gst-ev.up .gst-dt{background:var(--brand-soft);border-color:transparent;color:var(--brand)}',
    '.gst-ev.today{border-color:var(--warn);box-shadow:0 0 0 3px color-mix(in srgb,var(--warn) 25%,transparent)}',
    '@media(max-width:520px){.gst-ev{grid-template-columns:48px minmax(0,1fr)}.gst-ev .badge{grid-column:2;justify-self:start}.gst-item{flex-wrap:wrap}.gst-item .gst-body{flex-basis:calc(100% - 100px)}}',
    '.gst-legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:.8rem;color:var(--text-3);margin-top:10px}',
    '.gst-legend span{display:inline-flex;align-items:center;gap:6px}',
    '.gst-legend i{width:10px;height:10px;border-radius:3px;display:inline-block}',
    '.gst-opts{display:grid;gap:10px;margin:4px 0 14px}',
    '.gst-opts .check{align-items:flex-start;line-height:1.35}',
    '.gst-opts .check input{margin-top:1px;flex:none}',
    '#tool-root .card-title{flex-wrap:wrap}'
  ].join('\n');
  function injectStyle() {
    if (document.getElementById('gst-style')) return;
    var s = document.createElement('style');
    s.id = 'gst-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ================================================================= helpers
  function seg(id, opts, active, label) {
    return '<div class="seg" id="' + id + '" role="group" aria-label="' + esc(label || '') + '">' + opts.map(function (o) {
      var on = String(o[0]) === String(active);
      return '<button type="button" data-v="' + esc(o[0]) + '" class="' + (on ? 'active' : '') + '" aria-pressed="' + on + '">' + o[1] + '</button>';
    }).join('') + '</div>';
  }
  function segVal(root, id) { var b = $('#' + id + ' button.active', root); return b ? b.getAttribute('data-v') : null; }
  /** Wire every .seg inside root: toggles the active button and calls cb(segId, value). */
  function wireSegs(root, cb) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('.seg button');
      if (!b || !root.contains(b)) return;
      var s = b.parentNode;
      $$('button', s).forEach(function (x) {
        x.classList.toggle('active', x === b);
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      cb(s.id, b.getAttribute('data-v'));
    });
  }
  function notice(kind, html, icon) {
    return '<div class="notice ' + (kind || '') + '">' + BT.icon(icon || 'info') + '<div>' + html + '</div></div>';
  }
  function badge(kind, text) { return '<span class="badge ' + (kind || '') + '">' + text + '</span>'; }
  function card(title, inner, extra, attrs) {
    return '<div class="card"' + (attrs || '') + '>' + (title ? '<div class="card-title"><h3>' + title + '</h3>' + (extra || '') + '</div>' : '') + inner + '</div>';
  }
  function ext(url, label) {
    return '<a class="gst-link" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(label || url) + '</a>';
  }
  function csvCell(v) {
    v = String(v == null ? '' : v);
    if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; // guard against spreadsheet formula injection
    return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function toCsv(rows) { return '\ufeff' + rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n') + '\r\n'; }
  /** Split text into trimmed non-empty lines (one value per line, commas/semicolons/tabs also split). */
  function splitLines(text) {
    return String(text || '').split(/[\r\n,;\t]+/).map(function (s) { return s.trim(); }).filter(Boolean);
  }
  var MAX_BULK = 5000;

  // ============================================================ state codes
  var STATES = [
    ['01', 'Jammu and Kashmir'], ['02', 'Himachal Pradesh'], ['03', 'Punjab'], ['04', 'Chandigarh'], ['05', 'Uttarakhand'], ['06', 'Haryana'],
    ['07', 'Delhi'], ['08', 'Rajasthan'], ['09', 'Uttar Pradesh'], ['10', 'Bihar'], ['11', 'Sikkim'], ['12', 'Arunachal Pradesh'],
    ['13', 'Nagaland'], ['14', 'Manipur'], ['15', 'Mizoram'], ['16', 'Tripura'], ['17', 'Meghalaya'], ['18', 'Assam'], ['19', 'West Bengal'],
    ['20', 'Jharkhand'], ['21', 'Odisha'], ['22', 'Chhattisgarh'], ['23', 'Madhya Pradesh'], ['24', 'Gujarat'],
    ['25', 'Daman and Diu (pre-2020 code)'],
    ['26', 'Dadra and Nagar Haveli and Daman and Diu'], ['27', 'Maharashtra'], ['28', 'Andhra Pradesh (old code, before bifurcation)'],
    ['29', 'Karnataka'], ['30', 'Goa'], ['31', 'Lakshadweep'],
    ['32', 'Kerala'], ['33', 'Tamil Nadu'], ['34', 'Puducherry'], ['35', 'Andaman and Nicobar Islands'], ['36', 'Telangana'],
    ['37', 'Andhra Pradesh'], ['38', 'Ladakh'], ['97', 'Other Territory'], ['99', 'Centre Jurisdiction']
  ];
  var STATE_MAP = {};
  STATES.forEach(function (s) { STATE_MAP[s[0]] = s[1]; });

  // ======================================================== PAN holder types
  var HOLDER = {
    P: 'Individual (person)', C: 'Company', H: 'Hindu Undivided Family (HUF)', F: 'Firm / LLP',
    A: 'Association of Persons (AOP)', T: 'Trust', B: 'Body of Individuals (BOI)', L: 'Local authority',
    J: 'Artificial juridical person', G: 'Government'
  };
  var PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

  // ================================================== GSTIN check character
  var GST_CH = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  /** Official mod-36 check character for the first 14 characters of a GSTIN. */
  function gstinCheck(g14) {
    var sum = 0;
    for (var i = 0; i < 14; i++) {
      var p = GST_CH.indexOf(g14[i]) * (i % 2 ? 2 : 1);
      sum += Math.floor(p / 36) + p % 36;
    }
    return GST_CH[(36 - sum % 36) % 36];
  }
  function entityNo(c) {
    if (/[1-9]/.test(c)) return Number(c);
    var i = GST_CH.indexOf(c);
    return i >= 10 ? i : null;
  }
  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  /** Full structural analysis of a GSTIN string. */
  function analyseGstin(raw) {
    var g = String(raw == null ? '' : raw).toUpperCase().replace(/[\s.\-\/]/g, '');
    var r = { raw: raw, g: g, checks: [], ok: false, reason: '' };
    function add(name, pass, detail) {
      r.checks.push({ name: name, pass: pass, detail: detail });
      if (pass === false && !r.reason) r.reason = detail;
    }
    if (!g) { r.reason = 'Empty value'; return r; }
    var alnum = /^[0-9A-Z]+$/.test(g);
    add('Length', g.length === 15, g.length === 15 ? 'Exactly 15 characters.' : 'Has ' + g.length + ' character' + (g.length === 1 ? '' : 's') + '; a GSTIN has exactly 15.');
    add('Characters', alnum, alnum ? 'Only letters A–Z and digits 0–9.' : 'Contains characters other than A–Z and 0–9.');

    var sc = g.slice(0, 2);
    r.stateCode = sc;
    r.state = STATE_MAP[sc] || '';
    if (!/^\d{2}$/.test(sc)) add('State code', false, 'First two characters "' + sc + '" must be digits (state code 01–38, 97 or 99).');
    else add('State code', !!r.state, r.state ? sc + ' = ' + r.state + '.' : 'State code ' + sc + ' is not a valid GST state/UT code (01–38, 97 or 99).');

    var pan = g.slice(2, 12);
    r.pan = pan;
    var panOk = PAN_RE.test(pan);
    add('PAN (characters 3–12)', panOk, panOk ? pan + ' matches the PAN pattern AAAAA9999A.' :
      (pan.length < 10 ? 'Too short to contain a 10-character PAN.' : '"' + pan + '" does not match the PAN pattern (5 letters, 4 digits, 1 letter).'));
    if (panOk) {
      r.holder = HOLDER[pan[3]] || '';
      add('PAN holder type (4th PAN character)', !!r.holder, r.holder ? '"' + pan[3] + '" = ' + r.holder + '.' : '"' + pan[3] + '" is not a recognised PAN holder type (P, C, H, F, A, T, B, L, J or G).');
    } else {
      r.checks.push({ name: 'PAN holder type (4th PAN character)', pass: null, detail: 'Not checked because the PAN part is invalid.' });
    }

    var en = g.charAt(12);
    r.entity = en;
    var enOk = /^[1-9A-Z]$/.test(en);
    r.entityNo = enOk ? entityNo(en) : null;
    add('Entity number (13th character)', enOk, enOk ? '"' + en + '" = ' + ordinal(r.entityNo) + ' registration under this PAN in the state.' :
      (en ? '"' + en + '" is not allowed; it must be 1–9 or A–Z (0 is never used).' : 'Missing.'));

    var z = g.charAt(13);
    add('14th character', z === 'Z', z === 'Z' ? '"Z" (default for regular registrations).' : (z ? '"' + z + '" found; this character is "Z" by default.' : 'Missing.'));

    var head = g.slice(0, 14);
    if (/^[0-9A-Z]{14}$/.test(head)) {
      r.expected = gstinCheck(head);
      r.given = g.charAt(14);
      if (!r.given) add('Check character (15th)', false, 'Missing; it should be "' + r.expected + '".');
      else add('Check character (15th)', r.expected === r.given,
        r.expected === r.given ? '"' + r.given + '" matches the mod-36 checksum.' : 'Checksum mismatch: expected "' + r.expected + '" but found "' + r.given + '". There is probably a typo.');
    } else {
      r.checks.push({ name: 'Check character (15th)', pass: null, detail: 'Cannot be computed until the first 14 characters are valid letters/digits.' });
    }
    r.ok = r.checks.every(function (c) { return c.pass !== false; }) && r.checks.some(function (c) { return c.name.indexOf('Check character') === 0 && c.pass === true; });
    if (r.ok) r.reason = 'Format and checksum are valid.';
    return r;
  }

  function withCheck(g14) { return g14 + gstinCheck(g14); }

  function checksList(checks) {
    return '<ul class="gst-checks">' + checks.map(function (c) {
      var k = c.pass === true ? 'p' : c.pass === false ? 'f' : 'n';
      return '<li class="' + k + '"><span class="gst-ci">' + BT.icon(k === 'p' ? 'check' : k === 'f' ? 'x' : 'minus') + '</span><span><b>' + esc(c.name) + '</b> <span class="d">· ' + esc(c.detail) + '</span></span></li>';
    }).join('') + '</ul>';
  }

  function portalNote() {
    return notice('', '<b>Format and checksum check only.</b> A GSTIN can be correctly formed and still be cancelled, suspended or never issued. ' +
      'To confirm the registration status and legal name, use the official GST portal search: ' + ext('https://services.gst.gov.in/services/searchtp') +
      '. This tool does not contact the GST portal or any other server.', 'shield-check');
  }

  // ======================================================= GSTIN VALIDATOR
  BT.impl('gstin-validator', function (root) {
    injectStyle();
    var EX = withCheck('27AAPFU0939F1Z');
    root.innerHTML = '<div class="gst-wrap">' +
      '<div class="gst-bar">' + seg('gv-mode', [['single', BT.icon('badge-check') + ' Single GSTIN'], ['bulk', BT.icon('list-checks') + ' Bulk check']], 'single', 'Mode') +
      '<span class="muted small">Runs entirely in your browser</span></div>' +
      '<div id="gv-single">' +
        card('Enter a GSTIN',
          '<div class="field"><label for="gv-in">GSTIN (15 characters)</label>' +
          '<div class="gst-inline"><input type="text" id="gv-in" class="gst-big" maxlength="24" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. ' + EX + '" aria-describedby="gv-hint">' +
          '<button type="button" class="btn" id="gv-ex">' + BT.icon('sparkles') + ' Example</button></div>' +
          '<div class="hint" id="gv-hint">Spaces and hyphens are ignored. Lower case is converted to upper case.</div></div>') +
        '<div id="gv-out" aria-live="polite" class="gst-wrap" style="margin-top:16px"></div>' +
      '</div>' +
      '<div id="gv-bulk" class="hidden">' +
        card('Paste GSTINs', '<div class="field"><label for="gv-ta">One GSTIN per line (up to ' + BT.fmtNum(MAX_BULK) + ')</label>' +
          '<textarea id="gv-ta" class="gst-ta" spellcheck="false" autocapitalize="characters" placeholder="27AAPFU0939F1ZV&#10;19AAACB1234C1ZC&#10;..."></textarea>' +
          '<div class="hint">Commas, semicolons and tabs also separate values, so you can paste a spreadsheet column or a CSV line.</div></div>' +
          '<div class="btn-group"><button type="button" class="btn" id="gv-sample">' + BT.icon('sparkles') + ' Load sample</button>' +
          '<button type="button" class="btn btn-ghost" id="gv-clear">' + BT.icon('trash-2') + ' Clear</button></div>') +
        '<div id="gv-bout" class="gst-wrap" style="margin-top:16px" aria-live="polite"></div>' +
      '</div>' +
      portalNote() +
    '</div>';

    var inp = $('#gv-in', root), out = $('#gv-out', root);
    var ta = $('#gv-ta', root), bout = $('#gv-bout', root);
    var lastBulk = [], filter = 'all';

    function renderSingle() {
      var v = inp.value;
      if (!v.trim()) {
        out.innerHTML = '<div class="gst-hero"><div class="gst-h-top">' + BT.icon('badge-check') + ' GSTIN check</div>' +
          '<div class="gst-h-msg">Type or paste a GSTIN to see its state, PAN and checksum.</div>' +
          '<div class="gst-code">' + codeSegs('', null) + '</div></div>';
        return;
      }
      var r = analyseGstin(v);
      var stateTxt = r.state || '—';
      out.innerHTML =
        '<div class="gst-hero ' + (r.ok ? 'ok' : 'bad') + '" data-valid="' + (r.ok ? '1' : '0') + '">' +
          '<div class="gst-h-top">' + BT.icon(r.ok ? 'badge-check' : 'x') + '<span class="gst-pill" id="gv-verdict">' + (r.ok ? 'VALID FORMAT' : 'INVALID') + '</span></div>' +
          '<div class="gst-h-msg" id="gv-reason">' + esc(r.ok ? 'This GSTIN is correctly formed and its check character matches.' : r.reason) + '</div>' +
          '<div class="gst-code">' + codeSegs(r.g, r) + '</div>' +
        '</div>' +
        card('Breakdown',
          '<div class="gst-kv">' +
            kv('State / UT', esc(stateTxt), r.stateCode ? 'Code ' + esc(r.stateCode) : '') +
            kv('PAN', '<span class="gst-mono">' + esc(r.pan || '—') + '</span>', PAN_RE.test(r.pan || '') ? badge('ok', 'Pattern OK') : badge('danger', 'Invalid')) +
            kv('PAN holder type', esc(r.holder || '—'), r.pan && r.pan.length >= 4 ? '4th PAN character: <b class="gst-mono">' + esc(r.pan[3]) + '</b>' : '') +
            kv('Entity number', r.entityNo ? esc(ordinal(r.entityNo)) + ' registration' : '—', r.entity ? '13th character: <b class="gst-mono">' + esc(r.entity) + '</b>' : '') +
            kv('14th character', '<span class="gst-mono">' + esc(r.g.charAt(13) || '—') + '</span>', 'Default is Z') +
            kv('Check character', r.expected ? 'Expected <b class="gst-mono" id="gv-exp">' + esc(r.expected) + '</b> · given <b class="gst-mono">' + esc(r.given || '—') + '</b>' : '—',
              r.expected ? (r.expected === r.given ? badge('ok', 'Match') : badge('danger', 'Mismatch')) : '') +
          '</div>') +
        card('All checks', checksList(r.checks), r.ok ? badge('ok', BT.icon('check') + ' Passed') : badge('danger', BT.icon('x') + ' Failed'));
    }
    function kv(label, value, sub) {
      return '<div class="stat"><div class="label">' + label + '</div><div class="value">' + value + '</div>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>';
    }
    function codeSegs(g, r) {
      var parts = [[0, 2, 'State'], [2, 12, 'PAN'], [12, 13, 'Entity'], [13, 14, 'Default'], [14, 15, 'Check']];
      var bad = {};
      if (r) r.checks.forEach(function (c) {
        if (c.pass !== false) return;
        if (/^State/.test(c.name)) bad[0] = 1;
        else if (/^PAN/.test(c.name)) bad[2] = 1;
        else if (/^Entity/.test(c.name)) bad[12] = 1;
        else if (/^14th/.test(c.name)) bad[13] = 1;
        else if (/^Check/.test(c.name)) bad[14] = 1;
      });
      var html = parts.map(function (p) {
        var s = g.slice(p[0], p[1]);
        var ph = '';
        for (var i = p[0]; i < p[1]; i++) ph += '•';
        return '<div class="gst-cseg' + (bad[p[0]] ? ' x' : '') + '"><b>' + esc(s || ph) + '</b><span>' + p[2] + '</span></div>';
      }).join('');
      if (g.length > 15) html += '<div class="gst-cseg x"><b>' + esc(g.slice(15)) + '</b><span>Extra</span></div>';
      return html;
    }

    function renderBulk() {
      var vals = splitLines(ta.value);
      var over = vals.length > MAX_BULK;
      if (over) vals = vals.slice(0, MAX_BULK);
      if (!vals.length) {
        lastBulk = [];
        bout.innerHTML = notice('', 'Paste GSTINs above, one per line. Results appear instantly.');
        return;
      }
      var seen = {};
      lastBulk = vals.map(function (v, i) {
        var r = analyseGstin(v);
        r.n = i + 1;
        r.dup = !!seen[r.g];
        seen[r.g] = (seen[r.g] || 0) + 1;
        return r;
      });
      var nOk = lastBulk.filter(function (r) { return r.ok; }).length;
      var nDup = lastBulk.filter(function (r) { return r.dup; }).length;
      var rows = lastBulk.filter(function (r) { return filter === 'all' || (filter === 'valid' ? r.ok : !r.ok); });
      var LIMIT = 1000;
      bout.innerHTML =
        (over ? notice('warn', 'Only the first ' + BT.fmtNum(MAX_BULK) + ' values are checked.') : '') +
        '<div class="gst-stats">' +
          '<div class="stat"><div class="label">Checked</div><div class="value" id="gv-n">' + BT.fmtNum(lastBulk.length) + '</div></div>' +
          '<div class="stat ok"><div class="label">Valid</div><div class="value" id="gv-nok">' + BT.fmtNum(nOk) + '</div></div>' +
          '<div class="stat bad"><div class="label">Invalid</div><div class="value" id="gv-nbad">' + BT.fmtNum(lastBulk.length - nOk) + '</div></div>' +
          '<div class="stat warn"><div class="label">Duplicates</div><div class="value">' + BT.fmtNum(nDup) + '</div></div>' +
        '</div>' +
        card('Results', '<div class="toolbar">' + seg('gv-filter', [['all', 'All'], ['valid', 'Valid'], ['invalid', 'Invalid']], filter, 'Filter results') +
            '<span class="spacer"></span><button type="button" class="btn btn-primary btn-sm" id="gv-csv">' + BT.icon('download') + ' Export CSV</button></div>' +
          '<div class="table-wrap gst-tw"><table class="table" id="gv-table"><thead><tr><th scope="col">#</th><th scope="col">GSTIN</th><th scope="col">Status</th><th scope="col">State</th><th scope="col">PAN</th><th scope="col">Holder type</th><th scope="col">Reason</th></tr></thead><tbody>' +
          rows.slice(0, LIMIT).map(function (r) {
            return '<tr class="' + (r.ok ? 'ok' : 'bad') + '"><td>' + r.n + '</td><td class="gst-mono">' + esc(r.g) + '</td><td>' +
              (r.ok ? badge('ok', 'Valid') : badge('danger', 'Invalid')) + (r.dup ? ' ' + badge('warn', 'Duplicate') : '') + '</td><td>' +
              esc(r.state || '—') + '</td><td class="gst-mono">' + esc(PAN_RE.test(r.pan || '') ? r.pan : '—') + '</td><td>' + esc(r.holder || '—') + '</td><td class="wrap">' + esc(r.reason) + '</td></tr>';
          }).join('') +
          (rows.length ? '' : '<tr><td colspan="7" class="muted">No rows match this filter.</td></tr>') +
          '</tbody></table></div>' +
          (rows.length > LIMIT ? '<p class="gst-note">Showing the first ' + BT.fmtNum(LIMIT) + ' of ' + BT.fmtNum(rows.length) + ' rows. The CSV export includes all rows.</p>' : ''));
    }

    function exportCsv() {
      if (!lastBulk.length) return;
      var rows = [['#', 'Input', 'GSTIN', 'Status', 'State code', 'State', 'PAN', 'PAN holder type', 'Entity number', 'Expected check', 'Given check', 'Duplicate', 'Reason']];
      lastBulk.forEach(function (r) {
        rows.push([r.n, r.raw, r.g, r.ok ? 'Valid' : 'Invalid', r.stateCode || '', r.state || '', PAN_RE.test(r.pan || '') ? r.pan : '', r.holder || '',
          r.entityNo || '', r.expected || '', r.given || '', r.dup ? 'Yes' : '', r.reason]);
      });
      BT.download(toCsv(rows), 'gstin-validation.csv', 'text/csv;charset=utf-8');
      BT.toast('CSV downloaded');
    }

    wireSegs(root, function (id, v) {
      if (id === 'gv-mode') {
        $('#gv-single', root).classList.toggle('hidden', v !== 'single');
        $('#gv-bulk', root).classList.toggle('hidden', v !== 'bulk');
        if (v === 'bulk') renderBulk();
      } else if (id === 'gv-filter') { filter = v; renderBulk(); }
    });
    inp.addEventListener('input', renderSingle);
    $('#gv-ex', root).addEventListener('click', function () { inp.value = EX; renderSingle(); inp.focus(); });
    ta.addEventListener('input', BT.debounce(renderBulk, 120));
    $('#gv-sample', root).addEventListener('click', function () {
      ta.value = [EX, withCheck('19AAACB1234C1Z'), withCheck('07AABCU9603R1Z'), withCheck('29AAGCB7383J1Z'), '27AAPFU0939F1ZX', '24AAFFP5678K0Z1', '40ABCDE1234F1Z5', withCheck('33AAACH2702H1Z'), EX].join('\n');
      renderBulk();
    });
    $('#gv-clear', root).addEventListener('click', function () { ta.value = ''; renderBulk(); ta.focus(); });
    root.addEventListener('click', function (e) { if (e.target.closest('#gv-csv')) exportCsv(); });
    renderSingle();
  });

  // ========================================================== BANKS (IFSC)
  // First four letters of IFSC → bank. Merged banks keep their historic codes.
  var BANKS = {
    SBIN: 'State Bank of India', HDFC: 'HDFC Bank', ICIC: 'ICICI Bank', UTIB: 'Axis Bank', PUNB: 'Punjab National Bank',
    BARB: 'Bank of Baroda', CNRB: 'Canara Bank', UBIN: 'Union Bank of India', BKID: 'Bank of India', IOBA: 'Indian Overseas Bank',
    IDIB: 'Indian Bank', MAHB: 'Bank of Maharashtra', CBIN: 'Central Bank of India', UCBA: 'UCO Bank', PSIB: 'Punjab & Sind Bank',
    IBKL: 'IDBI Bank', KKBK: 'Kotak Mahindra Bank', YESB: 'Yes Bank', INDB: 'IndusInd Bank', IDFB: 'IDFC FIRST Bank',
    FDRL: 'Federal Bank', KARB: 'Karnataka Bank', KVBL: 'Karur Vysya Bank', SIBL: 'South Indian Bank', CSBK: 'CSB Bank',
    DLXB: 'Dhanlaxmi Bank', TMBL: 'Tamilnad Mercantile Bank', CIUB: 'City Union Bank', JAKA: 'Jammu & Kashmir Bank',
    RATN: 'RBL Bank', DCBL: 'DCB Bank', BDBL: 'Bandhan Bank', NTBL: 'Nainital Bank',
    AUBL: 'AU Small Finance Bank', ESFB: 'Equitas Small Finance Bank', UJVN: 'Ujjivan Small Finance Bank', SURY: 'Suryoday Small Finance Bank',
    JSFB: 'Jana Small Finance Bank', UTKS: 'Utkarsh Small Finance Bank', ESMF: 'ESAF Small Finance Bank', FSFB: 'Fincare Small Finance Bank (merged into AU SFB)',
    PYTM: 'Paytm Payments Bank', AIRP: 'Airtel Payments Bank', IPOS: 'India Post Payments Bank', FINO: 'Fino Payments Bank',
    NSPB: 'NSDL Payments Bank', JIOP: 'Jio Payments Bank',
    HSBC: 'HSBC', SCBL: 'Standard Chartered Bank', CITI: 'Citibank', DBSS: 'DBS Bank India', DEUT: 'Deutsche Bank',
    BOFA: 'Bank of America', BNPA: 'BNP Paribas', BARC: 'Barclays Bank',
    NKGS: 'NKGSB Co-operative Bank', SVCB: 'SVC Co-operative Bank', COSB: 'Cosmos Co-operative Bank', SRCB: 'Saraswat Co-operative Bank',
    ABHY: 'Abhyudaya Co-operative Bank', KCCB: 'Kalupur Commercial Co-operative Bank', TJSB: 'TJSB Sahakari Bank',
    DNSB: 'Dombivli Nagari Sahakari Bank', JSBP: 'Janata Sahakari Bank, Pune', MSNU: 'Mehsana Urban Co-operative Bank',
    PMCB: 'Punjab & Maharashtra Co-operative Bank (now Unity SFB)', TNSC: 'Tamil Nadu State Apex Co-operative Bank',
    RBIS: 'Reserve Bank of India',
    ORBC: 'Oriental Bank of Commerce (merged into PNB)', UTBI: 'United Bank of India (merged into PNB)',
    SYNB: 'Syndicate Bank (merged into Canara Bank)', CORP: 'Corporation Bank (merged into Union Bank)',
    ANDB: 'Andhra Bank (merged into Union Bank)', ALLA: 'Allahabad Bank (merged into Indian Bank)',
    VIJB: 'Vijaya Bank (merged into Bank of Baroda)', BKDN: 'Dena Bank (merged into Bank of Baroda)',
    LAVB: 'Lakshmi Vilas Bank (merged into DBS Bank India)',
    SBBJ: 'State Bank of Bikaner & Jaipur (merged into SBI)', SBHY: 'State Bank of Hyderabad (merged into SBI)',
    SBMY: 'State Bank of Mysore (merged into SBI)', STBP: 'State Bank of Patiala (merged into SBI)', SBTR: 'State Bank of Travancore (merged into SBI)'
  };
  var MICR_CITY = {
    '110': 'New Delhi', '400': 'Mumbai', '700': 'Kolkata', '600': 'Chennai', '560': 'Bengaluru', '500': 'Hyderabad',
    '411': 'Pune', '380': 'Ahmedabad', '302': 'Jaipur', '226': 'Lucknow', '800': 'Patna', '160': 'Chandigarh'
  };

  function analysePan(raw) {
    var p = String(raw == null ? '' : raw).toUpperCase().replace(/\s+/g, '');
    var r = { raw: raw, p: p, ok: false, reason: '', checks: [] };
    function add(n, pass, d) { r.checks.push({ name: n, pass: pass, detail: d }); if (pass === false && !r.reason) r.reason = d; }
    if (!p) { r.reason = 'Empty value'; return r; }
    add('Length', p.length === 10, p.length === 10 ? 'Exactly 10 characters.' : 'Has ' + p.length + ' characters; a PAN has exactly 10.');
    add('Characters 1–5', /^[A-Z]{5}$/.test(p.slice(0, 5)), /^[A-Z]{5}$/.test(p.slice(0, 5)) ? 'Five letters.' : 'The first five characters must be letters.');
    add('Characters 6–9', /^[0-9]{4}$/.test(p.slice(5, 9)), /^[0-9]{4}$/.test(p.slice(5, 9)) ? 'Four digits (sequence number).' : 'Characters 6–9 must be digits.');
    add('Character 10', /^[A-Z]$/.test(p.charAt(9)), /^[A-Z]$/.test(p.charAt(9)) ? 'A letter (check character).' : 'The last character must be a letter.');
    var t = p.charAt(3);
    r.holder = /^[A-Z]$/.test(t) ? (HOLDER[t] || '') : '';
    if (/^[A-Z]$/.test(t)) add('Holder type (4th character)', !!r.holder, r.holder ? '"' + t + '" = ' + r.holder + '.' : '"' + t + '" is not a recognised holder type (P, C, H, F, A, T, B, L, J or G).');
    else r.checks.push({ name: 'Holder type (4th character)', pass: null, detail: 'Not a letter.' });
    r.fifth = /^[A-Z]$/.test(p.charAt(4)) ? p.charAt(4) : '';
    r.ok = PAN_RE.test(p) && !!r.holder;
    if (r.ok) r.reason = 'Valid PAN format.';
    return r;
  }
  function fifthNote(r) {
    if (!r.fifth) return '';
    return t5(r.p.charAt(3)) + ' "' + r.fifth + '"';
    function t5(t) { return t === 'P' ? 'First letter of the holder\u2019s surname (last name):' : 'First letter of the entity\u2019s name:'; }
  }
  function analyseIfsc(raw) {
    var c = String(raw == null ? '' : raw).toUpperCase().replace(/\s+/g, '');
    var r = { raw: raw, c: c, ok: false, reason: '', checks: [] };
    function add(n, pass, d) { r.checks.push({ name: n, pass: pass, detail: d }); if (pass === false && !r.reason) r.reason = d; }
    if (!c) { r.reason = 'Empty'; return r; }
    add('Length', c.length === 11, c.length === 11 ? 'Exactly 11 characters.' : 'Has ' + c.length + ' characters; an IFSC has exactly 11.');
    var b = c.slice(0, 4);
    add('Bank code (1–4)', /^[A-Z]{4}$/.test(b), /^[A-Z]{4}$/.test(b) ? '"' + b + '" — four letters.' : 'The first four characters must be letters.');
    add('5th character', c.charAt(4) === '0', c.charAt(4) === '0' ? 'Zero, reserved for future use.' : (c.charAt(4) ? '"' + c.charAt(4) + '" found; the 5th character is always the digit 0.' : 'Missing.'));
    var br = c.slice(5, 11);
    add('Branch code (6–11)', /^[A-Z0-9]{6}$/.test(br) && c.length === 11, /^[A-Z0-9]{6}$/.test(br) ? '"' + br + '" — six letters/digits.' : 'The last six characters must be letters or digits.');
    r.ok = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(c);
    r.bankCode = b;
    r.bank = BANKS[b] || '';
    r.branch = br;
    if (r.ok) r.reason = 'Valid IFSC format.';
    return r;
  }

  // ======================================================== PAN / IFSC TOOL
  BT.impl('pan-ifsc-validator', function (root) {
    injectStyle();
    var bankList = Object.keys(BANKS).sort().map(function (k) { return [k, BANKS[k]]; });
    root.innerHTML = '<div class="gst-wrap">' +
      '<div class="card"><div class="gst-tabs" role="tablist" aria-label="Checker">' +
        tab('pan', 'id-card', 'PAN', true) + tab('ifsc', 'landmark', 'IFSC', false) + tab('micr', 'hash', 'MICR', false) +
      '</div>' +
      // ---------- PAN
      '<div id="pi-panel-pan" role="tabpanel" aria-labelledby="pi-tab-pan">' +
        '<div class="gst-bar" style="margin-bottom:14px">' + seg('pi-pmode', [['single', 'Single'], ['bulk', 'Bulk']], 'single', 'PAN mode') + '<span class="muted small">Format AAAAA9999A</span></div>' +
        '<div id="pi-pan-single"><div class="field"><label for="pi-pan">PAN</label><input type="text" id="pi-pan" class="gst-big" maxlength="14" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. ABCPK1234F"></div>' +
          '<div id="pi-pan-out" aria-live="polite" class="gst-wrap"></div></div>' +
        '<div id="pi-pan-bulk" class="hidden"><div class="field"><label for="pi-pan-ta">One PAN per line (up to ' + BT.fmtNum(MAX_BULK) + ')</label>' +
          '<textarea id="pi-pan-ta" class="gst-ta" spellcheck="false" autocapitalize="characters" placeholder="ABCPK1234F&#10;AAACB1234C"></textarea></div>' +
          '<div id="pi-pan-bout" aria-live="polite" class="gst-wrap"></div></div>' +
        '<p class="gst-note">The 10th character is a check letter, but the Income Tax Department does not publish its algorithm, so it cannot be verified offline. Verify a PAN on the official e-filing portal (incometax.gov.in) if you need certainty.</p>' +
      '</div>' +
      // ---------- IFSC
      '<div id="pi-panel-ifsc" role="tabpanel" aria-labelledby="pi-tab-ifsc" class="hidden">' +
        '<div class="field"><label for="pi-ifsc">IFSC code</label><input type="text" id="pi-ifsc" class="gst-big" maxlength="15" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. SBIN0001234"></div>' +
        '<div id="pi-ifsc-out" aria-live="polite" class="gst-wrap"></div>' +
        '<p class="gst-note">IFSC = 4-letter bank code + "0" + 6-character branch code. Branch name and address lookup is not available offline. ' +
        'Use the RBI\u2019s published IFSC list (rbi.org.in → Payment Systems → IFSC/MICR codes) or your bank\u2019s website to confirm the branch.</p>' +
      '</div>' +
      // ---------- MICR
      '<div id="pi-panel-micr" role="tabpanel" aria-labelledby="pi-tab-micr" class="hidden">' +
        '<div class="field"><label for="pi-micr">MICR code (9 digits)</label><input type="text" id="pi-micr" class="gst-big" inputmode="numeric" maxlength="14" autocomplete="off" spellcheck="false" placeholder="e.g. 400002005"></div>' +
        '<div id="pi-micr-out" aria-live="polite" class="gst-wrap"></div>' +
        '<p class="gst-note">MICR codes are printed at the bottom of cheques: 3-digit city code (usually matching the first three PIN code digits), 3-digit bank code and 3-digit branch code.</p>' +
      '</div></div>' +
      card('Banks recognised offline', '<div class="field"><label for="pi-bsearch" class="sr-only">Filter banks</label><input type="search" id="pi-bsearch" placeholder="Filter by bank name or code"></div><div class="gst-banks" id="pi-banks" tabindex="0" role="region" aria-label="Recognised banks"></div>',
        '<span class="badge">' + bankList.length + ' bank codes</span>') +
    '</div>';

    function tab(id, ic, label, on) {
      return '<button type="button" role="tab" id="pi-tab-' + id + '" data-tab="' + id + '" aria-controls="pi-panel-' + id + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '">' + BT.icon(ic) + label + '</button>';
    }
    var tabs = $$('[role=tab]', root);
    function select(id) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-tab') === id;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        $('#pi-panel-' + t.getAttribute('data-tab'), root).classList.toggle('hidden', !on);
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t.getAttribute('data-tab')); });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        select(n.getAttribute('data-tab')); n.focus(); e.preventDefault();
      });
    });

    function hero(ok, label, msg, codeHtml) {
      return '<div class="gst-hero ' + (ok ? 'ok' : 'bad') + '" data-valid="' + (ok ? '1' : '0') + '"><div class="gst-h-top">' + BT.icon(ok ? 'badge-check' : 'x') +
        '<span class="gst-pill">' + label + '</span></div><div class="gst-h-msg">' + msg + '</div>' + (codeHtml ? '<div class="gst-code">' + codeHtml + '</div>' : '') + '</div>';
    }
    function blank(label, msg) {
      return '<div class="gst-hero"><div class="gst-h-top">' + BT.icon('info') + ' ' + label + '</div><div class="gst-h-msg">' + msg + '</div></div>';
    }
    function cs(s, label, bad) { return '<div class="gst-cseg' + (bad ? ' x' : '') + '"><b>' + esc(s || '—') + '</b><span>' + label + '</span></div>'; }
    function kv(label, value, sub) {
      return '<div class="stat"><div class="label">' + label + '</div><div class="value">' + value + '</div>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>';
    }

    // ---- PAN single
    var panIn = $('#pi-pan', root), panOut = $('#pi-pan-out', root);
    function renderPan() {
      if (!panIn.value.trim()) { panOut.innerHTML = blank('PAN check', 'Enter a PAN to see the holder type and format checks.'); return; }
      var r = analysePan(panIn.value);
      panOut.innerHTML = hero(r.ok, r.ok ? 'VALID FORMAT' : 'INVALID', esc(r.ok ? 'PAN of ' + (/^[AEIOU]/.test(r.holder) ? 'an ' : 'a ') + r.holder.replace(/ \(.*\)$/, '') : r.reason),
          cs(r.p.slice(0, 3), 'Series') + cs(r.p.charAt(3), 'Holder type', !r.holder) + cs(r.p.charAt(4), 'Name initial') + cs(r.p.slice(5, 9), 'Number') + cs(r.p.charAt(9), 'Check')) +
        '<div class="gst-kv">' +
          kv('Holder type', '<span id="pi-holder">' + esc(r.holder || '—') + '</span>', '4th character: <b class="gst-mono">' + esc(r.p.charAt(3) || '—') + '</b>') +
          kv('5th character', '<span class="gst-mono">' + esc(r.fifth || '—') + '</span>', esc(fifthNote(r) ? (r.p.charAt(3) === 'P' ? 'First letter of the surname' : 'First letter of the name') : '')) +
          kv('Sequence', '<span class="gst-mono">' + esc(/^\d{4}$/.test(r.p.slice(5, 9)) ? r.p.slice(5, 9) : '—') + '</span>', 'Characters 6–9') +
        '</div>' + card('Checks', checksList(r.checks));
    }
    panIn.addEventListener('input', renderPan);
    renderPan();

    // ---- PAN bulk
    var pta = $('#pi-pan-ta', root), pbout = $('#pi-pan-bout', root), lastPan = [];
    function renderPanBulk() {
      var vals = splitLines(pta.value), over = vals.length > MAX_BULK;
      if (over) vals = vals.slice(0, MAX_BULK);
      if (!vals.length) { lastPan = []; pbout.innerHTML = notice('', 'Paste PANs above, one per line.'); return; }
      lastPan = vals.map(function (v, i) { var r = analysePan(v); r.n = i + 1; return r; });
      var nOk = lastPan.filter(function (r) { return r.ok; }).length;
      pbout.innerHTML = (over ? notice('warn', 'Only the first ' + BT.fmtNum(MAX_BULK) + ' values are checked.') : '') +
        '<div class="gst-stats"><div class="stat"><div class="label">Checked</div><div class="value">' + BT.fmtNum(lastPan.length) + '</div></div>' +
        '<div class="stat ok"><div class="label">Valid</div><div class="value">' + BT.fmtNum(nOk) + '</div></div>' +
        '<div class="stat bad"><div class="label">Invalid</div><div class="value">' + BT.fmtNum(lastPan.length - nOk) + '</div></div></div>' +
        '<div class="toolbar" style="margin:0"><span class="spacer"></span><button type="button" class="btn btn-primary btn-sm" id="pi-pan-csv">' + BT.icon('download') + ' Export CSV</button></div>' +
        '<div class="table-wrap gst-tw"><table class="table" id="pi-pan-table"><thead><tr><th scope="col">#</th><th scope="col">PAN</th><th scope="col">Status</th><th scope="col">Holder type</th><th scope="col">Reason</th></tr></thead><tbody>' +
        lastPan.slice(0, 1000).map(function (r) {
          return '<tr class="' + (r.ok ? 'ok' : 'bad') + '"><td>' + r.n + '</td><td class="gst-mono">' + esc(r.p) + '</td><td>' + (r.ok ? badge('ok', 'Valid') : badge('danger', 'Invalid')) +
            '</td><td>' + esc(r.holder || '—') + '</td><td class="wrap">' + esc(r.reason) + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
        (lastPan.length > 1000 ? '<p class="gst-note">Showing the first 1,000 rows. The CSV export includes all rows.</p>' : '');
    }
    pta.addEventListener('input', BT.debounce(renderPanBulk, 120));
    root.addEventListener('click', function (e) {
      if (!e.target.closest('#pi-pan-csv') || !lastPan.length) return;
      var rows = [['#', 'Input', 'PAN', 'Status', 'Holder type', '5th character', 'Reason']];
      lastPan.forEach(function (r) { rows.push([r.n, r.raw, r.p, r.ok ? 'Valid' : 'Invalid', r.holder || '', r.fifth || '', r.reason]); });
      BT.download(toCsv(rows), 'pan-validation.csv', 'text/csv;charset=utf-8');
      BT.toast('CSV downloaded');
    });
    wireSegs(root, function (id, v) {
      if (id !== 'pi-pmode') return;
      $('#pi-pan-single', root).classList.toggle('hidden', v !== 'single');
      $('#pi-pan-bulk', root).classList.toggle('hidden', v !== 'bulk');
      if (v === 'bulk') renderPanBulk();
    });

    // ---- IFSC
    var ifIn = $('#pi-ifsc', root), ifOut = $('#pi-ifsc-out', root);
    function renderIfsc() {
      if (!ifIn.value.trim()) { ifOut.innerHTML = blank('IFSC check', 'Enter an 11-character IFSC to identify the bank.'); return; }
      var r = analyseIfsc(ifIn.value);
      var msg = r.ok ? (r.bank ? esc(r.bank) : 'Valid format · bank code ' + esc(r.bankCode) + ' is not in the offline list') : esc(r.reason);
      ifOut.innerHTML = hero(r.ok, r.ok ? 'VALID FORMAT' : 'INVALID', '<span id="pi-bank">' + msg + '</span>',
          cs(r.c.slice(0, 4), 'Bank') + cs(r.c.charAt(4), 'Reserved', r.c.charAt(4) !== '0') + cs(r.c.slice(5, 11), 'Branch code') + (r.c.length > 11 ? cs(r.c.slice(11), 'Extra', true) : '')) +
        '<div class="gst-kv">' +
          kv('Bank', esc(r.bank || (r.ok ? 'Not in offline list' : '—')), 'Code <b class="gst-mono">' + esc(r.bankCode || '—') + '</b>') +
          kv('Branch code', '<span class="gst-mono">' + esc(r.branch || '—') + '</span>', 'Last 6 characters, unique within the bank') +
          kv('Branch / address', 'Not available offline', 'Check the RBI IFSC list') +
        '</div>' + card('Checks', checksList(r.checks));
    }
    ifIn.addEventListener('input', renderIfsc);
    renderIfsc();

    // ---- MICR
    var mIn = $('#pi-micr', root), mOut = $('#pi-micr-out', root);
    function renderMicr() {
      var v = mIn.value.replace(/\s+/g, '');
      if (!v) { mOut.innerHTML = blank('MICR check', 'Enter the 9-digit MICR code printed on a cheque.'); return; }
      var ok = /^\d{9}$/.test(v);
      var reason = ok ? 'Valid MICR format' : (/\D/.test(v) ? 'A MICR code contains digits only.' : 'Has ' + v.length + ' digits; a MICR code has exactly 9.');
      var city = MICR_CITY[v.slice(0, 3)];
      mOut.innerHTML = hero(ok, ok ? 'VALID FORMAT' : 'INVALID', esc(reason), cs(v.slice(0, 3), 'City') + cs(v.slice(3, 6), 'Bank') + cs(v.slice(6, 9), 'Branch') + (v.length > 9 ? cs(v.slice(9), 'Extra', true) : '')) +
        '<div class="gst-kv">' +
          kv('City code', '<span class="gst-mono">' + esc(v.slice(0, 3) || '—') + '</span>', city ? 'Typically ' + esc(city) : 'Usually the first 3 digits of the city PIN code') +
          kv('Bank code', '<span class="gst-mono">' + esc(v.slice(3, 6) || '—') + '</span>', 'Identifies the bank') +
          kv('Branch code', '<span class="gst-mono">' + esc(v.slice(6, 9) || '—') + '</span>', 'Identifies the branch') +
        '</div>';
    }
    mIn.addEventListener('input', renderMicr);
    renderMicr();

    // ---- bank directory
    var bs = $('#pi-bsearch', root), bl = $('#pi-banks', root);
    function renderBanks() {
      var q = bs.value.toLowerCase().trim();
      var rows = bankList.filter(function (b) { return !q || b[0].toLowerCase().indexOf(q) >= 0 || b[1].toLowerCase().indexOf(q) >= 0; });
      bl.innerHTML = rows.length ? rows.map(function (b) { return '<div title="' + esc(b[1]) + '"><b>' + b[0] + '</b><span>' + esc(b[1]) + '</span></div>'; }).join('') : '<p class="muted small">No bank matches that filter.</p>';
    }
    bs.addEventListener('input', renderBanks);
    renderBanks();
  });

  // ============================================================ HSN DATA
  var SECTIONS = [
    ['I', 'Live animals; animal products', 1, 5],
    ['II', 'Vegetable products', 6, 14],
    ['III', 'Animal, vegetable or microbial fats and oils and their cleavage products; prepared edible fats; animal or vegetable waxes', 15, 15],
    ['IV', 'Prepared foodstuffs; beverages, spirits and vinegar; tobacco and manufactured tobacco substitutes; nicotine products', 16, 24],
    ['V', 'Mineral products', 25, 27],
    ['VI', 'Products of the chemical or allied industries', 28, 38],
    ['VII', 'Plastics and articles thereof; rubber and articles thereof', 39, 40],
    ['VIII', 'Raw hides and skins, leather, furskins and articles thereof; saddlery and harness; travel goods, handbags and similar containers; articles of animal gut', 41, 43],
    ['IX', 'Wood and articles of wood; wood charcoal; cork and articles of cork; manufactures of straw, esparto or other plaiting materials; basketware and wickerwork', 44, 46],
    ['X', 'Pulp of wood or of other fibrous cellulosic material; recovered (waste and scrap) paper or paperboard; paper and paperboard and articles thereof', 47, 49],
    ['XI', 'Textiles and textile articles', 50, 63],
    ['XII', 'Footwear, headgear, umbrellas, sun umbrellas, walking-sticks, seat-sticks, whips, riding-crops and parts thereof; prepared feathers and articles made therewith; artificial flowers; articles of human hair', 64, 67],
    ['XIII', 'Articles of stone, plaster, cement, asbestos, mica or similar materials; ceramic products; glass and glassware', 68, 70],
    ['XIV', 'Natural or cultured pearls, precious or semi-precious stones, precious metals, metals clad with precious metal, and articles thereof; imitation jewellery; coin', 71, 71],
    ['XV', 'Base metals and articles of base metal', 72, 83],
    ['XVI', 'Machinery and mechanical appliances; electrical equipment; parts thereof; sound recorders and reproducers, television image and sound recorders and reproducers, and parts and accessories of such articles', 84, 85],
    ['XVII', 'Vehicles, aircraft, vessels and associated transport equipment', 86, 89],
    ['XVIII', 'Optical, photographic, cinematographic, measuring, checking, precision, medical or surgical instruments and apparatus; clocks and watches; musical instruments; parts and accessories thereof', 90, 92],
    ['XIX', 'Arms and ammunition; parts and accessories thereof', 93, 93],
    ['XX', 'Miscellaneous manufactured articles', 94, 96],
    ['XXI', 'Works of art, collectors\u2019 pieces and antiques', 97, 97]
  ];
  var CHAPTERS = {
    '01': 'Live animals', '02': 'Meat and edible meat offal',
    '03': 'Fish and crustaceans, molluscs and other aquatic invertebrates',
    '04': 'Dairy produce; birds\u2019 eggs; natural honey; edible products of animal origin, not elsewhere specified or included',
    '05': 'Products of animal origin, not elsewhere specified or included',
    '06': 'Live trees and other plants; bulbs, roots and the like; cut flowers and ornamental foliage',
    '07': 'Edible vegetables and certain roots and tubers', '08': 'Edible fruit and nuts; peel of citrus fruit or melons',
    '09': 'Coffee, tea, mat\u00e9 and spices', '10': 'Cereals',
    '11': 'Products of the milling industry; malt; starches; inulin; wheat gluten',
    '12': 'Oil seeds and oleaginous fruits; miscellaneous grains, seeds and fruit; industrial or medicinal plants; straw and fodder',
    '13': 'Lac; gums, resins and other vegetable saps and extracts',
    '14': 'Vegetable plaiting materials; vegetable products not elsewhere specified or included',
    '15': 'Animal, vegetable or microbial fats and oils and their cleavage products; prepared edible fats; animal or vegetable waxes',
    '16': 'Preparations of meat, of fish, of crustaceans, molluscs or other aquatic invertebrates, or of insects',
    '17': 'Sugars and sugar confectionery', '18': 'Cocoa and cocoa preparations',
    '19': 'Preparations of cereals, flour, starch or milk; pastrycooks\u2019 products',
    '20': 'Preparations of vegetables, fruit, nuts or other parts of plants', '21': 'Miscellaneous edible preparations',
    '22': 'Beverages, spirits and vinegar', '23': 'Residues and waste from the food industries; prepared animal fodder',
    '24': 'Tobacco and manufactured tobacco substitutes; products, whether or not containing nicotine, intended for inhalation without combustion; other nicotine containing products intended for the intake of nicotine into the human body',
    '25': 'Salt; sulphur; earths and stone; plastering materials, lime and cement', '26': 'Ores, slag and ash',
    '27': 'Mineral fuels, mineral oils and products of their distillation; bituminous substances; mineral waxes',
    '28': 'Inorganic chemicals; organic or inorganic compounds of precious metals, of rare-earth metals, of radioactive elements or of isotopes',
    '29': 'Organic chemicals', '30': 'Pharmaceutical products', '31': 'Fertilisers',
    '32': 'Tanning or dyeing extracts; tannins and their derivatives; dyes, pigments and other colouring matter; paints and varnishes; putty and other mastics; inks',
    '33': 'Essential oils and resinoids; perfumery, cosmetic or toilet preparations',
    '34': 'Soap, organic surface-active agents, washing preparations, lubricating preparations, artificial waxes, prepared waxes, polishing or scouring preparations, candles and similar articles, modelling pastes, \u201cdental waxes\u201d and dental preparations with a basis of plaster',
    '35': 'Albuminoidal substances; modified starches; glues; enzymes',
    '36': 'Explosives; pyrotechnic products; matches; pyrophoric alloys; certain combustible preparations',
    '37': 'Photographic or cinematographic goods', '38': 'Miscellaneous chemical products',
    '39': 'Plastics and articles thereof', '40': 'Rubber and articles thereof',
    '41': 'Raw hides and skins (other than furskins) and leather',
    '42': 'Articles of leather; saddlery and harness; travel goods, handbags and similar containers; articles of animal gut (other than silk-worm gut)',
    '43': 'Furskins and artificial fur; manufactures thereof', '44': 'Wood and articles of wood; wood charcoal',
    '45': 'Cork and articles of cork', '46': 'Manufactures of straw, of esparto or of other plaiting materials; basketware and wickerwork',
    '47': 'Pulp of wood or of other fibrous cellulosic material; recovered (waste and scrap) paper or paperboard',
    '48': 'Paper and paperboard; articles of paper pulp, of paper or of paperboard',
    '49': 'Printed books, newspapers, pictures and other products of the printing industry; manuscripts, typescripts and plans',
    '50': 'Silk', '51': 'Wool, fine or coarse animal hair; horsehair yarn and woven fabric', '52': 'Cotton',
    '53': 'Other vegetable textile fibres; paper yarn and woven fabrics of paper yarn',
    '54': 'Man-made filaments; strip and the like of man-made textile materials', '55': 'Man-made staple fibres',
    '56': 'Wadding, felt and nonwovens; special yarns; twine, cordage, ropes and cables and articles thereof',
    '57': 'Carpets and other textile floor coverings',
    '58': 'Special woven fabrics; tufted textile fabrics; lace; tapestries; trimmings; embroidery',
    '59': 'Impregnated, coated, covered or laminated textile fabrics; textile articles of a kind suitable for industrial use',
    '60': 'Knitted or crocheted fabrics', '61': 'Articles of apparel and clothing accessories, knitted or crocheted',
    '62': 'Articles of apparel and clothing accessories, not knitted or crocheted',
    '63': 'Other made up textile articles; sets; worn clothing and worn textile articles; rags',
    '64': 'Footwear, gaiters and the like; parts of such articles', '65': 'Headgear and parts thereof',
    '66': 'Umbrellas, sun umbrellas, walking-sticks, seat-sticks, whips, riding-crops and parts thereof',
    '67': 'Prepared feathers and down and articles made of feathers or of down; artificial flowers; articles of human hair',
    '68': 'Articles of stone, plaster, cement, asbestos, mica or similar materials', '69': 'Ceramic products', '70': 'Glass and glassware',
    '71': 'Natural or cultured pearls, precious or semi-precious stones, precious metals, metals clad with precious metal, and articles thereof; imitation jewellery; coin',
    '72': 'Iron and steel', '73': 'Articles of iron or steel', '74': 'Copper and articles thereof', '75': 'Nickel and articles thereof',
    '76': 'Aluminium and articles thereof', '77': '(Reserved for possible future use in the Harmonized System)',
    '78': 'Lead and articles thereof', '79': 'Zinc and articles thereof', '80': 'Tin and articles thereof',
    '81': 'Other base metals; cermets; articles thereof',
    '82': 'Tools, implements, cutlery, spoons and forks, of base metal; parts thereof of base metal',
    '83': 'Miscellaneous articles of base metal',
    '84': 'Nuclear reactors, boilers, machinery and mechanical appliances; parts thereof',
    '85': 'Electrical machinery and equipment and parts thereof; sound recorders and reproducers, television image and sound recorders and reproducers, and parts and accessories of such articles',
    '86': 'Railway or tramway locomotives, rolling-stock and parts thereof; railway or tramway track fixtures and fittings and parts thereof; mechanical (including electro-mechanical) traffic signalling equipment of all kinds',
    '87': 'Vehicles other than railway or tramway rolling-stock, and parts and accessories thereof',
    '88': 'Aircraft, spacecraft, and parts thereof', '89': 'Ships, boats and floating structures',
    '90': 'Optical, photographic, cinematographic, measuring, checking, precision, medical or surgical instruments and apparatus; parts and accessories thereof',
    '91': 'Clocks and watches and parts thereof', '92': 'Musical instruments; parts and accessories of such articles',
    '93': 'Arms and ammunition; parts and accessories thereof',
    '94': 'Furniture; bedding, mattresses, mattress supports, cushions and similar stuffed furnishings; luminaires and lighting fittings, not elsewhere specified or included; illuminated signs, illuminated name-plates and the like; prefabricated buildings',
    '95': 'Toys, games and sports requisites; parts and accessories thereof', '96': 'Miscellaneous manufactured articles',
    '97': 'Works of art, collectors\u2019 pieces and antiques'
  };

  // 4-digit headings: "code|description|search keywords (incl. common Hindi words)"
  var HEADINGS = [
    "0101|Live horses, asses, mules and hinnies|ghoda donkey", "0102|Live bovine animals|cattle cow buffalo bhains gaay", "0103|Live swine|pig",
    "0104|Live sheep and goats|bakri bhed", "0105|Live poultry (fowls, ducks, geese, turkeys, guinea fowls)|chicken murgi hen", "0106|Other live animals|pets",
    "0201|Meat of bovine animals, fresh or chilled|beef", "0202|Meat of bovine animals, frozen|beef", "0203|Meat of swine, fresh, chilled or frozen|pork",
    "0204|Meat of sheep or goats, fresh, chilled or frozen|mutton lamb gosht", "0207|Meat and edible offal of poultry, fresh, chilled or frozen|chicken meat",
    "0301|Live fish|aquarium", "0302|Fish, fresh or chilled (excluding fillets)|machli", "0303|Fish, frozen (excluding fillets)|machli",
    "0304|Fish fillets and other fish meat, fresh, chilled or frozen|", "0305|Fish, dried, salted, in brine or smoked|dry fish",
    "0306|Crustaceans (shrimps, prawns, lobsters, crabs)|jhinga", "0307|Molluscs (oysters, mussels, squid, octopus)|",
    "0401|Milk and cream, not concentrated nor containing added sugar or other sweetening matter|doodh dairy fresh milk",
    "0402|Milk and cream, concentrated or containing added sugar (milk powder, condensed milk)|doodh powder",
    "0403|Yogurt, buttermilk, curdled milk and cream, kephir and other fermented milk|curd dahi lassi chhaach",
    "0404|Whey; products consisting of natural milk constituents|", "0405|Butter and other fats and oils derived from milk; dairy spreads|ghee makhan",
    "0406|Cheese and curd|paneer chhena", "0407|Birds\u2019 eggs, in shell, fresh, preserved or cooked|anda egg", "0408|Birds\u2019 eggs, not in shell; egg yolks|egg powder",
    "0409|Natural honey|shahad", "0410|Insects and other edible products of animal origin, not elsewhere specified|",
    "0504|Guts, bladders and stomachs of animals (other than fish)|casings", "0511|Animal products not elsewhere specified; dead animals unfit for human consumption|semen",
    "0601|Bulbs, tubers, tuberous roots, corms, crowns and rhizomes|", "0602|Other live plants (including their roots), cuttings and slips; mushroom spawn|nursery saplings paudha",
    "0603|Cut flowers and flower buds for bouquets or ornamental purposes|phool flowers", "0604|Foliage, branches and other parts of plants, grasses, mosses and lichens|",
    "0701|Potatoes, fresh or chilled|aloo", "0702|Tomatoes, fresh or chilled|tamatar", "0703|Onions, shallots, garlic, leeks|pyaz lahsun",
    "0704|Cabbages, cauliflowers, kohlrabi, kale and similar edible brassicas|gobi", "0705|Lettuce and chicory|", "0706|Carrots, turnips, beetroot, radishes and similar roots|gajar mooli",
    "0707|Cucumbers and gherkins|kheera", "0708|Leguminous vegetables (peas, beans), shelled or unshelled|matar", "0709|Other vegetables, fresh or chilled|sabzi okra brinjal",
    "0710|Vegetables, frozen|frozen peas", "0712|Dried vegetables|", "0713|Dried leguminous vegetables, shelled (pulses)|dal lentils chana moong toor masoor rajma",
    "0714|Manioc (cassava), arrowroot, sweet potatoes and similar roots|shakarkandi tapioca",
    "0801|Coconuts, Brazil nuts and cashew nuts|nariyal kaju cashew", "0802|Other nuts (almonds, walnuts, pistachios, hazelnuts)|badam akhrot pista dry fruits",
    "0803|Bananas, including plantains|kela", "0804|Dates, figs, pineapples, avocados, guavas, mangoes and mangosteens|aam khajoor amrood mango",
    "0805|Citrus fruit (oranges, mandarins, lemons, limes, grapefruit)|santra nimbu", "0806|Grapes, fresh or dried (raisins)|angoor kishmish",
    "0807|Melons (including watermelons) and papaws (papayas)|tarbooz papita", "0808|Apples, pears and quinces|seb apple",
    "0809|Apricots, cherries, peaches, plums and sloes|", "0810|Other fruit, fresh (strawberries, pomegranates, litchis and others)|anar litchi",
    "0813|Fruit, dried (other than heading 0801 to 0806); mixtures of nuts or dried fruits|dry fruits",
    "0901|Coffee; coffee husks and skins; coffee substitutes|", "0902|Tea, whether or not flavoured|chai patti",
    "0904|Pepper; dried or crushed fruits of capsicum or pimenta (chillies)|kali mirch lal mirch chilli", "0905|Vanilla|", "0906|Cinnamon and cinnamon-tree flowers|dalchini",
    "0907|Cloves|laung", "0908|Nutmeg, mace and cardamoms|elaichi jaiphal", "0909|Seeds of anise, coriander, cumin, caraway, fennel and juniper|jeera dhania saunf",
    "0910|Ginger, saffron, turmeric, thyme, bay leaves, curry and other spices|adrak haldi kesar masala",
    "1001|Wheat and meslin|gehun", "1002|Rye|", "1003|Barley|jau", "1005|Maize (corn)|makka bhutta", "1006|Rice|chawal paddy basmati",
    "1007|Grain sorghum|jowar", "1008|Buckwheat, millet and canary seeds; other cereals|bajra ragi millets quinoa",
    "1101|Wheat or meslin flour|atta maida", "1102|Cereal flours other than of wheat or meslin|", "1103|Cereal groats, meal and pellets|sooji rava semolina dalia",
    "1104|Cereal grains otherwise worked (hulled, rolled, flaked, pearled)|poha oats", "1105|Flour, meal, powder, flakes of potatoes|",
    "1106|Flour, meal and powder of dried leguminous vegetables|besan", "1107|Malt|", "1108|Starches; inulin|starch",
    "1201|Soya beans|soybean", "1202|Ground-nuts (peanuts), not roasted or cooked|moongphali", "1205|Rape or colza seeds|",
    "1206|Sunflower seeds|", "1207|Other oil seeds and oleaginous fruits (sesame, mustard, cotton seeds and others)|til sarson", "1209|Seeds, fruit and spores, of a kind used for sowing|beej",
    "1211|Plants and parts of plants used in perfumery, pharmacy or for insecticidal purposes|herbs ayurvedic", "1212|Locust beans, seaweeds, sugar beet and sugar cane|ganna",
    "1214|Swedes, mangolds, hay, lucerne (alfalfa), clover and similar forage products|fodder chara",
    "1301|Lac; natural gums, resins, gum-resins and oleoresins|", "1302|Vegetable saps and extracts; pectic substances; agar-agar|",
    "1401|Vegetable materials used primarily for plaiting (bamboos, rattans, reeds)|bamboo", "1404|Vegetable products not elsewhere specified|",
    "1507|Soya-bean oil and its fractions|soybean oil tel", "1508|Ground-nut oil and its fractions|groundnut oil", "1509|Olive oil and its fractions|",
    "1511|Palm oil and its fractions|", "1512|Sunflower-seed, safflower or cotton-seed oil|", "1513|Coconut (copra), palm kernel or babassu oil|nariyal tel",
    "1514|Rape, colza or mustard oil|sarson tel", "1515|Other fixed vegetable or microbial fats and oils (linseed, maize, castor, sesame)|til oil",
    "1516|Animal, vegetable or microbial fats and oils, hydrogenated or inter-esterified|vanaspati dalda", "1517|Margarine; edible mixtures or preparations of fats or oils|",
    "1601|Sausages and similar products of meat|", "1602|Other prepared or preserved meat, meat offal or blood|", "1604|Prepared or preserved fish; caviar|canned tuna",
    "1605|Crustaceans, molluscs and other aquatic invertebrates, prepared or preserved|",
    "1701|Cane or beet sugar and chemically pure sucrose, in solid form|chini cheeni shakkar", "1702|Other sugars (lactose, maltose, glucose, fructose); artificial honey; caramel|",
    "1703|Molasses|", "1704|Sugar confectionery (including white chocolate), not containing cocoa|toffee candy chewing gum mithai",
    "1801|Cocoa beans|", "1803|Cocoa paste|", "1804|Cocoa butter, fat and oil|", "1805|Cocoa powder, not containing added sugar|", "1806|Chocolate and other food preparations containing cocoa|",
    "1901|Malt extract; food preparations of flour, meal, starch or milk (including infant food)|", "1902|Pasta (spaghetti, macaroni, noodles); couscous|noodles",
    "1904|Prepared foods obtained by swelling or roasting cereals (corn flakes, puffed rice)|cornflakes muesli murmura", "1905|Bread, pastry, cakes, biscuits and other bakers\u2019 wares|bakery rusk pizza",
    "2001|Vegetables, fruit and nuts prepared or preserved by vinegar or acetic acid|pickle achar", "2002|Tomatoes prepared or preserved otherwise than by vinegar|tomato puree",
    "2004|Other vegetables prepared or preserved, frozen (e.g. French fries)|", "2005|Other vegetables prepared or preserved, not frozen|",
    "2006|Vegetables, fruit, nuts and fruit-peel preserved by sugar|murabba", "2007|Jams, fruit jellies, marmalades, fruit or nut puree and pastes|jam",
    "2008|Fruit, nuts and other edible parts of plants, otherwise prepared or preserved|roasted nuts", "2009|Fruit and vegetable juices, unfermented, without added spirit|juice ras",
    "2101|Extracts, essences and concentrates of coffee, tea or mat\u00e9 (instant coffee)|", "2102|Yeasts; prepared baking powders|", "2103|Sauces; mixed condiments and seasonings; mustard flour|ketchup",
    "2104|Soups and broths and preparations therefor|", "2105|Ice cream and other edible ice|kulfi", "2106|Food preparations not elsewhere specified|namkeen bhujia supplements",
    "2201|Waters, including natural or artificial mineral waters, not sweetened or flavoured; ice and snow|packaged drinking water pani bisleri", "2202|Waters with added sugar or flavour, and other non-alcoholic beverages|soft drinks cold drink soda",
    "2203|Beer made from malt|", "2204|Wine of fresh grapes|", "2207|Undenatured ethyl alcohol of 80% or higher; denatured ethyl alcohol|ethanol",
    "2208|Undenatured ethyl alcohol under 80%; spirits, liqueurs and other spirituous beverages|whisky rum vodka liquor", "2209|Vinegar and substitutes for vinegar|sirka",
    "2301|Flours, meals and pellets of meat, offal or fish, unfit for human consumption|", "2304|Oil-cake and other solid residues from soya-bean oil extraction|soymeal",
    "2306|Oil-cake and other solid residues from other vegetable fats or oils|khali", "2309|Preparations of a kind used in animal feeding|cattle feed pet food",
    "2401|Unmanufactured tobacco; tobacco refuse|", "2402|Cigars, cheroots, cigarillos and cigarettes|", "2403|Other manufactured tobacco and substitutes (smoking, chewing tobacco)|",
    "2404|Products containing tobacco or nicotine intended for inhalation without combustion|",
    "2501|Salt (including table salt and denatured salt)|namak", "2505|Natural sands of all kinds|ret sand", "2515|Marble, travertine and other calcareous stone|",
    "2516|Granite, porphyry, basalt, sandstone and other monumental or building stone|", "2517|Pebbles, gravel, broken or crushed stone|", "2520|Gypsum; anhydrite; plasters|",
    "2522|Quicklime, slaked lime and hydraulic lime|choona", "2523|Portland cement, aluminous cement, slag cement and similar hydraulic cements|cement",
    "2601|Iron ores and concentrates|", "2603|Copper ores and concentrates|", "2606|Aluminium ores and concentrates|bauxite",
    "2701|Coal; briquettes and similar solid fuels manufactured from coal|koyla", "2704|Coke and semi-coke of coal, lignite or peat|",
    "2709|Petroleum oils and oils obtained from bituminous minerals, crude|crude oil", "2710|Petroleum oils, other than crude (petrol, diesel, kerosene, lubricating oil)|petrol diesel",
    "2711|Petroleum gases and other gaseous hydrocarbons (LPG, natural gas)|lpg cng gas cylinder", "2713|Petroleum coke, petroleum bitumen and other residues|",
    "2715|Bituminous mixtures based on natural asphalt or bitumen|", "2716|Electrical energy|bijli electricity",
    "2801|Fluorine, chlorine, bromine and iodine|", "2804|Hydrogen, rare gases and other non-metals (oxygen, nitrogen)|", "2807|Sulphuric acid; oleum|",
    "2808|Nitric acid; sulphonitric acids|", "2809|Diphosphorus pentaoxide; phosphoric acid|", "2814|Ammonia, anhydrous or in aqueous solution|",
    "2815|Sodium hydroxide (caustic soda); potassium hydroxide|", "2836|Carbonates; peroxocarbonates (soda ash, sodium bicarbonate)|baking soda", "2847|Hydrogen peroxide|",
    "2901|Acyclic hydrocarbons|", "2902|Cyclic hydrocarbons|benzene", "2905|Acyclic alcohols and their derivatives|methanol", "2915|Saturated acyclic monocarboxylic acids (e.g. acetic acid)|",
    "2933|Heterocyclic compounds with nitrogen hetero-atom(s) only|", "2936|Provitamins and vitamins|", "2941|Antibiotics|",
    "3001|Glands and other organs for organo-therapeutic uses|", "3002|Human and animal blood; antisera, vaccines, toxins and cultures|vaccine",
    "3003|Medicaments not put up in measured doses or packings for retail sale|", "3004|Medicaments put up in measured doses or for retail sale|medicine dawai tablets capsules drugs",
    "3005|Wadding, gauze, bandages and similar articles impregnated or coated with pharmaceutical substances|band aid", "3006|Pharmaceutical goods (sterile sutures, first-aid boxes, and others)|",
    "3101|Animal or vegetable fertilisers|organic manure khad", "3102|Mineral or chemical fertilisers, nitrogenous|urea", "3103|Mineral or chemical fertilisers, phosphatic|",
    "3104|Mineral or chemical fertilisers, potassic|", "3105|Fertilisers containing two or three of nitrogen, phosphorus and potassium|dap npk",
    "3204|Synthetic organic colouring matter|dyes", "3206|Other colouring matter; pigments|", "3208|Paints and varnishes based on synthetic polymers, in a non-aqueous medium|enamel",
    "3209|Paints and varnishes based on synthetic polymers, in an aqueous medium|emulsion paint", "3210|Other paints and varnishes|", "3214|Glaziers\u2019 putty, grafting putty, resin cements and other mastics|wall putty",
    "3215|Printing ink, writing or drawing ink and other inks|",
    "3301|Essential oils; resinoids|", "3302|Mixtures of odoriferous substances|fragrance", "3303|Perfumes and toilet waters|perfume attar",
    "3304|Beauty or make-up preparations and skin-care preparations (incl. sunscreen); manicure preparations|cosmetics cream lipstick", "3305|Preparations for use on the hair|shampoo hair oil",
    "3306|Preparations for oral or dental hygiene|toothpaste", "3307|Shaving preparations, deodorants, bath preparations, room deodorisers|agarbatti deo",
    "3401|Soap; organic surface-active products in bars or cakes|sabun", "3402|Organic surface-active agents; washing and cleaning preparations|detergent surf",
    "3403|Lubricating preparations|grease", "3405|Polishes and creams for footwear, furniture, floors, metal|shoe polish", "3406|Candles, tapers and the like|mombatti",
    "3501|Casein, caseinates and casein glues|", "3505|Dextrins and other modified starches|", "3506|Prepared glues and other prepared adhesives|fevicol",
    "3507|Enzymes; prepared enzymes|", "3604|Fireworks, signalling flares and other pyrotechnic articles|patakhe crackers", "3605|Matches|machis",
    "3701|Photographic plates and film in the flat, sensitised, unexposed|", "3702|Photographic film in rolls, sensitised, unexposed|", "3707|Chemical preparations for photographic uses|",
    "3808|Insecticides, rodenticides, fungicides, herbicides, disinfectants|pesticide sanitiser", "3809|Finishing agents, dye carriers used in textile, paper and leather industries|",
    "3811|Anti-knock preparations, oxidation inhibitors and other additives for mineral oils|", "3814|Organic composite solvents and thinners|thinner",
    "3815|Reaction initiators, reaction accelerators and catalytic preparations|", "3822|Diagnostic or laboratory reagents|test kits", "3824|Prepared binders for foundry; chemical products not elsewhere specified|",
    "3826|Biodiesel and mixtures thereof|",
    "3901|Polymers of ethylene, in primary forms|polyethylene ldpe hdpe", "3902|Polymers of propylene, in primary forms|polypropylene", "3903|Polymers of styrene, in primary forms|",
    "3904|Polymers of vinyl chloride, in primary forms|pvc resin", "3907|Polyacetals, polyethers, epoxide resins, polycarbonates, polyesters (PET), in primary forms|",
    "3917|Tubes, pipes and hoses and fittings therefor, of plastics|pvc pipe", "3918|Floor coverings of plastics|", "3919|Self-adhesive plates, sheets, film, foil, tape of plastics|cello tape",
    "3920|Other plates, sheets, film, foil and strip of plastics, non-cellular|", "3921|Other plates, sheets, film, foil and strip of plastics|",
    "3922|Baths, shower-baths, sinks, wash-basins, lavatory seats and covers of plastics|", "3923|Articles for the conveyance or packing of goods, of plastics (bottles, boxes, bags)|plastic bottle carry bag",
    "3924|Tableware, kitchenware, other household articles and toilet articles, of plastics|bucket mug", "3925|Builders\u2019 ware of plastics (tanks, doors, windows)|water tank",
    "3926|Other articles of plastics|",
    "4001|Natural rubber, balata, gutta-percha, guayule, chicle|", "4002|Synthetic rubber|", "4011|New pneumatic tyres, of rubber|tyre tire",
    "4012|Retreaded or used pneumatic tyres of rubber|", "4013|Inner tubes, of rubber|", "4015|Articles of apparel and clothing accessories (including gloves), of vulcanised rubber|gloves",
    "4016|Other articles of vulcanised rubber other than hard rubber|",
    "4101|Raw hides and skins of bovine or equine animals|", "4104|Tanned or crust hides and skins of bovine or equine animals|", "4107|Leather further prepared after tanning, of bovine or equine animals|",
    "4201|Saddlery and harness for any animal|", "4202|Trunks, suitcases, handbags, wallets, school bags, briefcases and similar containers|bag purse luggage",
    "4203|Articles of apparel and clothing accessories, of leather (belts, gloves)|belt",
    "4302|Tanned or dressed furskins|", "4303|Articles of apparel, clothing accessories and other articles of furskin|",
    "4401|Fuel wood; wood in chips or particles; sawdust|lakdi firewood", "4403|Wood in the rough|logs timber", "4407|Wood sawn or chipped lengthwise|timber",
    "4410|Particle board, oriented strand board (OSB) and similar board of wood|", "4411|Fibreboard of wood or other ligneous materials|mdf",
    "4412|Plywood, veneered panels and similar laminated wood|ply", "4418|Builders\u2019 joinery and carpentry of wood (doors, windows, flooring)|",
    "4419|Tableware and kitchenware, of wood|", "4420|Wood marquetry; caskets and cases; statuettes and other ornaments of wood|", "4421|Other articles of wood|",
    "4501|Natural cork, raw or simply prepared|", "4503|Articles of natural cork|", "4601|Plaits and similar products of plaiting materials; mats|chatai", "4602|Basketwork, wickerwork and other articles of plaiting materials|baskets",
    "4701|Mechanical wood pulp|", "4703|Chemical wood pulp, soda or sulphate|", "4707|Recovered (waste and scrap) paper or paperboard|raddi",
    "4801|Newsprint, in rolls or sheets|", "4802|Uncoated paper and paperboard for writing, printing (incl. copier paper)|a4 paper", "4803|Toilet or facial tissue stock, towel or napkin stock|",
    "4804|Uncoated kraft paper and paperboard|", "4810|Paper and paperboard coated with kaolin or other inorganic substances|", "4811|Paper, paperboard and cellulose wadding, coated, impregnated or covered|",
    "4817|Envelopes, letter cards, plain postcards and correspondence cards|lifafa", "4818|Toilet paper, tissues, towels, napkins, tablecloths of paper|tissue paper",
    "4819|Cartons, boxes, cases, bags and other packing containers, of paper or paperboard|corrugated box carton", "4820|Registers, account books, notebooks, diaries, letter pads|copy notebook",
    "4821|Paper or paperboard labels of all kinds|", "4823|Other paper, paperboard and cellulose wadding cut to size or shape; other articles|paper plates cups",
    "4901|Printed books, brochures, leaflets and similar printed matter|kitab", "4902|Newspapers, journals and periodicals|akhbar", "4903|Children\u2019s picture, drawing or colouring books|",
    "4905|Maps and hydrographic or similar charts, globes, printed|", "4907|Unused postage and revenue stamps; stamp-impressed paper; banknotes; cheque forms|",
    "4908|Transfers (decalcomanias)|", "4909|Printed or illustrated postcards; printed greeting cards|", "4910|Calendars of any kind, printed|", "4911|Other printed matter, including printed pictures and photographs|posters",
    "5001|Silk-worm cocoons suitable for reeling|", "5002|Raw silk (not thrown)|resham", "5004|Silk yarn (other than yarn spun from silk waste), not for retail sale|", "5007|Woven fabrics of silk or of silk waste|",
    "5101|Wool, not carded or combed|", "5106|Yarn of carded wool, not for retail sale|", "5111|Woven fabrics of carded wool or carded fine animal hair|", "5112|Woven fabrics of combed wool or combed fine animal hair|",
    "5201|Cotton, not carded or combed|kapas raw cotton", "5205|Cotton yarn (other than sewing thread), 85% or more cotton, not for retail sale|", "5208|Woven fabrics of cotton, 85% or more cotton, weighing not more than 200 g/m\u00b2|kapda",
    "5209|Woven fabrics of cotton, 85% or more cotton, weighing more than 200 g/m\u00b2|denim", "5212|Other woven fabrics of cotton|",
    "5303|Jute and other textile bast fibres, raw or processed but not spun|", "5307|Yarn of jute or of other textile bast fibres|", "5310|Woven fabrics of jute or of other textile bast fibres|hessian",
    "5402|Synthetic filament yarn (other than sewing thread), not for retail sale|polyester yarn", "5407|Woven fabrics of synthetic filament yarn|",
    "5503|Synthetic staple fibres, not carded or combed|", "5509|Yarn of synthetic staple fibres, not for retail sale|", "5513|Woven fabrics of synthetic staple fibres, mixed with cotton|",
    "5601|Wadding of textile materials and articles thereof; textile flock and dust|", "5602|Felt|", "5603|Nonwovens|non woven",
    "5607|Twine, cordage, ropes and cables|rassi", "5608|Knotted netting of twine, cordage or rope; made up fishing nets|",
    "5701|Carpets and other textile floor coverings, knotted|", "5702|Carpets and other textile floor coverings, woven (including durries)|dhurrie", "5703|Carpets and other textile floor coverings, tufted|", "5705|Other carpets and textile floor coverings|",
    "5801|Woven pile fabrics and chenille fabrics|velvet", "5804|Tulles and other net fabrics; lace|", "5806|Narrow woven fabrics|", "5807|Labels, badges and similar articles of textile materials|",
    "5810|Embroidery in the piece, in strips or in motifs|", "5903|Textile fabrics impregnated, coated, covered or laminated with plastics|", "5911|Textile products and articles for technical uses|",
    "6001|Pile fabrics, knitted or crocheted|", "6006|Other knitted or crocheted fabrics|",
    "6101|Men\u2019s or boys\u2019 overcoats, anoraks, wind-jackets and similar articles, knitted or crocheted|", "6103|Men\u2019s or boys\u2019 suits, jackets, trousers and shorts, knitted or crocheted|",
    "6104|Women\u2019s or girls\u2019 suits, dresses, skirts, trousers and shorts, knitted or crocheted|leggings", "6105|Men\u2019s or boys\u2019 shirts, knitted or crocheted|polo",
    "6106|Women\u2019s or girls\u2019 blouses, shirts and shirt-blouses, knitted or crocheted|", "6107|Men\u2019s or boys\u2019 underpants, briefs, nightshirts, pyjamas, bathrobes, knitted or crocheted|innerwear",
    "6108|Women\u2019s or girls\u2019 slips, petticoats, panties, nightdresses, pyjamas, knitted or crocheted|", "6109|T-shirts, singlets and other vests, knitted or crocheted|tshirt tee t shirt banian baniyan",
    "6110|Jerseys, pullovers, cardigans, sweatshirts and similar articles, knitted or crocheted|sweater hoodie", "6111|Babies\u2019 garments and clothing accessories, knitted or crocheted|",
    "6112|Track suits, ski suits and swimwear, knitted or crocheted|", "6115|Pantyhose, tights, stockings, socks and other hosiery, knitted or crocheted|mojey",
    "6116|Gloves, mittens and mitts, knitted or crocheted|", "6117|Other made up clothing accessories, knitted or crocheted|",
    "6201|Men\u2019s or boys\u2019 overcoats, anoraks, wind-cheaters and similar articles (not knitted)|jacket", "6202|Women\u2019s or girls\u2019 overcoats, anoraks, wind-cheaters and similar articles (not knitted)|",
    "6203|Men\u2019s or boys\u2019 suits, ensembles, jackets, blazers, trousers and shorts (not knitted)|jeans pant", "6204|Women\u2019s or girls\u2019 suits, dresses, skirts, trousers and shorts (not knitted)|kurti salwar",
    "6205|Men\u2019s or boys\u2019 shirts (not knitted)|kurta", "6206|Women\u2019s or girls\u2019 blouses, shirts and shirt-blouses (not knitted)|", "6207|Men\u2019s or boys\u2019 singlets, underpants, nightshirts, pyjamas (not knitted)|",
    "6208|Women\u2019s or girls\u2019 singlets, slips, petticoats, nightdresses, pyjamas (not knitted)|", "6209|Babies\u2019 garments and clothing accessories (not knitted)|", "6211|Track suits, ski suits, swimwear and other garments (not knitted)|",
    "6212|Brassieres, girdles, corsets, braces and similar articles|", "6213|Handkerchiefs|rumal", "6214|Shawls, scarves, mufflers, mantillas, veils and the like|dupatta stole",
    "6215|Ties, bow ties and cravats|", "6217|Other made up clothing accessories (not knitted)|",
    "6301|Blankets and travelling rugs|kambal", "6302|Bed linen, table linen, toilet linen and kitchen linen|bedsheet towel chadar", "6303|Curtains, interior blinds; curtain or bed valances|parda",
    "6304|Other furnishing articles (bedspreads, cushion covers)|", "6305|Sacks and bags, of a kind used for the packing of goods|bori gunny", "6306|Tarpaulins, awnings, sunblinds, tents and sails|tirpal",
    "6307|Other made up textile articles, including dress patterns and face masks|mask", "6309|Worn clothing and other worn articles|", "6310|Used or new rags, scrap twine, cordage and rope|",
    "6401|Waterproof footwear with outer soles and uppers of rubber or plastics|gumboots", "6402|Other footwear with outer soles and uppers of rubber or plastics|chappal slippers sandals",
    "6403|Footwear with uppers of leather|shoes joota", "6404|Footwear with uppers of textile materials|sports shoes sneakers", "6405|Other footwear|", "6406|Parts of footwear; removable insoles; gaiters|",
    "6501|Hat-forms, hat bodies and hoods of felt|", "6504|Hats and other headgear, plaited or made by assembling strips|", "6505|Hats and other headgear, knitted or made up from textile materials|cap topi",
    "6506|Other headgear (including safety headgear)|helmet", "6601|Umbrellas and sun umbrellas|chhata", "6602|Walking-sticks, seat-sticks, whips, riding-crops|",
    "6702|Artificial flowers, foliage and fruit|", "6704|Wigs, false beards, eyebrows and eyelashes, of human hair or textile materials|",
    "6801|Setts, curbstones and flagstones, of natural stone|", "6802|Worked monumental or building stone and articles thereof (granite, marble slabs)|kota stone", "6804|Millstones, grindstones, grinding wheels|",
    "6805|Natural or artificial abrasive powder or grain on a base (sandpaper)|", "6806|Slag wool, rock wool and similar mineral wools|", "6807|Articles of asphalt or of similar material|",
    "6809|Articles of plaster or of compositions based on plaster (gypsum board)|", "6810|Articles of cement, of concrete or of artificial stone (blocks, tiles, pipes)|paver blocks",
    "6811|Articles of asbestos-cement, of cellulose fibre-cement or the like|", "6901|Bricks, blocks, tiles of siliceous fossil meals|", "6904|Ceramic building bricks, flooring blocks|eent bricks",
    "6905|Roofing tiles, chimney-pots and other ceramic constructional goods|", "6907|Ceramic flags and paving, hearth or wall tiles|vitrified tiles floor tiles",
    "6910|Ceramic sinks, wash basins, baths, water closet pans and similar sanitary fixtures|sanitaryware toilet", "6911|Tableware, kitchenware, household and toilet articles, of porcelain or china|crockery",
    "6912|Ceramic tableware, kitchenware, household and toilet articles, other than porcelain|", "6913|Statuettes and other ornamental ceramic articles|",
    "7003|Cast glass and rolled glass, in sheets or profiles|", "7005|Float glass and surface ground or polished glass, in sheets|", "7007|Safety glass (toughened or laminated glass)|",
    "7009|Glass mirrors, including rear-view mirrors|sheesha", "7010|Carboys, bottles, flasks, jars, pots of glass for packing|glass bottle",
    "7013|Glassware for table, kitchen, toilet, office, indoor decoration|", "7018|Glass beads, imitation pearls and imitation precious stones|", "7019|Glass fibres and articles thereof|fibreglass",
    "7101|Pearls, natural or cultured|moti", "7102|Diamonds, whether or not worked, not mounted or set|heera", "7103|Precious stones (other than diamonds) and semi-precious stones|gems",
    "7106|Silver, unwrought or in semi-manufactured forms, or in powder form|chandi", "7108|Gold, unwrought or in semi-manufactured forms, or in powder form|sona bullion", "7110|Platinum, unwrought or in semi-manufactured forms|",
    "7113|Articles of jewellery and parts thereof, of precious metal|gold jewellery gehne", "7114|Articles of goldsmiths\u2019 or silversmiths\u2019 wares|", "7117|Imitation jewellery|artificial jewellery", "7118|Coin|",
    "7201|Pig iron and spiegeleisen in pigs, blocks or other primary forms|", "7204|Ferrous waste and scrap; remelting scrap ingots of iron or steel|loha scrap",
    "7206|Iron and non-alloy steel in ingots or other primary forms|", "7207|Semi-finished products of iron or non-alloy steel (billets)|",
    "7208|Flat-rolled products of iron or non-alloy steel, 600 mm or more wide, hot-rolled|hr coil", "7209|Flat-rolled products of iron or non-alloy steel, 600 mm or more wide, cold-rolled|cr coil",
    "7210|Flat-rolled products of iron or non-alloy steel, 600 mm or more wide, clad, plated or coated|galvanised sheet", "7213|Bars and rods, hot-rolled, in irregularly wound coils, of iron or non-alloy steel|wire rod",
    "7214|Other bars and rods of iron or non-alloy steel, forged, hot-rolled, hot-drawn or hot-extruded|tmt bars saria rebar", "7216|Angles, shapes and sections of iron or non-alloy steel|",
    "7217|Wire of iron or non-alloy steel|", "7219|Flat-rolled products of stainless steel, 600 mm or more wide|", "7222|Other bars and rods of stainless steel; angles, shapes and sections|",
    "7304|Tubes, pipes and hollow profiles, seamless, of iron or steel|", "7306|Other tubes, pipes and hollow profiles of iron or steel|gi pipe",
    "7308|Structures and parts of structures of iron or steel (bridges, towers, doors, windows, scaffolding)|fabrication", "7309|Reservoirs, tanks, vats of iron or steel, capacity over 300 litres|",
    "7310|Tanks, casks, drums, cans, boxes of iron or steel, capacity 300 litres or less|", "7311|Containers for compressed or liquefied gas, of iron or steel|gas cylinder",
    "7317|Nails, tacks, drawing pins, staples of iron or steel|keel", "7318|Screws, bolts, nuts, washers, rivets of iron or steel|fasteners",
    "7320|Springs and leaves for springs, of iron or steel|", "7321|Stoves, ranges, cookers, barbecues and similar non-electric domestic appliances, of iron or steel|gas stove chulha",
    "7323|Table, kitchen or other household articles of iron or steel; steel wool|steel utensils bartan", "7324|Sanitary ware and parts thereof, of iron or steel|kitchen sink", "7326|Other articles of iron or steel|",
    "7403|Refined copper and copper alloys, unwrought|tamba", "7404|Copper waste and scrap|", "7407|Copper bars, rods and profiles|", "7408|Copper wire|", "7411|Copper tubes and pipes|",
    "7418|Table, kitchen or other household articles of copper|", "7502|Unwrought nickel|",
    "7601|Unwrought aluminium|", "7602|Aluminium waste and scrap|", "7604|Aluminium bars, rods and profiles|aluminium sections", "7606|Aluminium plates, sheets and strip, thickness over 0.2 mm|",
    "7607|Aluminium foil, thickness not exceeding 0.2 mm|", "7610|Aluminium structures and parts of structures (doors, windows)|", "7615|Table, kitchen or other household articles of aluminium|",
    "7616|Other articles of aluminium|", "7801|Unwrought lead|", "7901|Unwrought zinc|", "8001|Unwrought tin|", "8101|Tungsten (wolfram) and articles thereof|", "8108|Titanium and articles thereof|",
    "8201|Hand tools: spades, shovels, picks, hoes, forks, rakes, axes|", "8202|Hand saws; blades for saws of all kinds|", "8203|Files, rasps, pliers, pincers, tweezers, metal cutting shears|",
    "8204|Hand-operated spanners and wrenches; interchangeable spanner sockets|", "8205|Hand tools not elsewhere specified (hammers, screwdrivers); vices, clamps|",
    "8207|Interchangeable tools for hand tools or machine-tools (drill bits, dies, taps)|", "8211|Knives with cutting blades, serrated or not|chaku",
    "8212|Razors and razor blades|", "8213|Scissors, tailors\u2019 shears and similar shears|kainchi", "8214|Other articles of cutlery (nail clippers, kitchen choppers)|", "8215|Spoons, forks, ladles, skimmers, cake-servers and similar kitchen or tableware|chammach",
    "8301|Padlocks and locks, of base metal; clasps; keys|tala", "8302|Base metal mountings, fittings (hinges, castors, handles)|hardware", "8305|Fittings for loose-leaf binders, paper clips, staples|",
    "8306|Bells, gongs, statuettes and other ornaments of base metal; photograph frames|", "8308|Clasps, buckles, hooks, eyes, eyelets of base metal|", "8309|Stoppers, caps and lids (including crown corks) of base metal|",
    "8311|Wire, rods, tubes, plates, electrodes of base metal for soldering, brazing or welding|welding rod",
    "8401|Nuclear reactors; fuel elements; machinery for isotopic separation|", "8402|Steam or other vapour generating boilers|boiler", "8403|Central heating boilers|",
    "8407|Spark-ignition reciprocating or rotary internal combustion piston engines|petrol engine", "8408|Compression-ignition internal combustion piston engines (diesel engines)|diesel engine",
    "8409|Parts suitable for use solely or principally with engines of heading 8407 or 8408|engine parts", "8411|Turbo-jets, turbo-propellers and other gas turbines|",
    "8413|Pumps for liquids; liquid elevators|water pump motor pump", "8414|Air or vacuum pumps, air or gas compressors and fans; ventilating or recycling hoods|fan pankha compressor chimney",
    "8415|Air conditioning machines|ac air conditioner", "8418|Refrigerators, freezers and other refrigerating or freezing equipment; heat pumps|fridge refrigerator",
    "8419|Machinery and plant for heating, cooling, drying; non-electric water heaters (incl. solar water heaters)|", "8421|Centrifuges; filtering or purifying machinery for liquids or gases|water purifier ro filter",
    "8422|Dish washing machines; machinery for cleaning, filling, sealing, packing|packing machine", "8423|Weighing machinery (excluding balances of sensitivity of 5 cg or better)|weighing scale kanta",
    "8424|Mechanical appliances for projecting, dispersing or spraying liquids; fire extinguishers|sprayer", "8425|Pulley tackle and hoists; winches; jacks|",
    "8426|Ships\u2019 derricks; cranes; mobile lifting frames|crane", "8427|Fork-lift trucks; other works trucks fitted with lifting equipment|forklift",
    "8428|Other lifting, handling, loading or unloading machinery (lifts, escalators, conveyors)|elevator lift", "8429|Self-propelled bulldozers, graders, scrapers, excavators, loaders, road rollers|jcb",
    "8430|Other moving, grading, levelling, excavating, boring machinery|", "8432|Agricultural, horticultural or forestry machinery for soil preparation or cultivation|",
    "8433|Harvesting or threshing machinery; grass or hay mowers|harvester thresher", "8436|Other agricultural, horticultural, forestry, poultry-keeping machinery|",
    "8437|Machines for cleaning, sorting or grading seed, grain; machinery for the milling industry|flour mill chakki", "8438|Machinery for the industrial preparation or manufacture of food or drink|",
    "8443|Printing machinery; printers, copying machines and facsimile machines|printer photocopier", "8445|Machines for preparing textile fibres; spinning machines|",
    "8446|Weaving machines (looms)|", "8450|Household or laundry-type washing machines|washing machine", "8451|Machinery for washing, cleaning, drying, ironing textiles (dry-cleaning)|",
    "8452|Sewing machines|silai machine", "8456|Machine-tools working by laser, light, ultrasonic, electro-discharge or similar processes|laser cutting", "8457|Machining centres, unit construction machines for working metal|cnc",
    "8458|Lathes (including turning centres) for removing metal|lathe", "8459|Machine-tools for drilling, boring, milling, threading or tapping metal|",
    "8460|Machine-tools for deburring, sharpening, grinding, honing, lapping or polishing metal|", "8462|Machine-tools for forging, bending, folding, punching, shearing metal (presses)|power press",
    "8467|Tools for working in the hand, pneumatic, hydraulic or with self-contained motor|drill machine power tools", "8468|Machinery and apparatus for soldering, brazing or welding (gas-operated)|",
    "8470|Calculating machines and pocket-size data recording machines; cash registers|calculator", "8471|Automatic data processing machines (computers, laptops, desktops) and units thereof|computer laptop pc desktop server",
    "8472|Other office machines (ATMs, shredders, stapling machines)|", "8473|Parts and accessories of computers and other office machines (headings 8470 to 8472)|computer parts",
    "8474|Machinery for sorting, screening, crushing, grinding, mixing earth, stone, ores (concrete mixers)|", "8477|Machinery for working rubber or plastics (injection moulding)|",
    "8479|Machines and mechanical appliances having individual functions, not elsewhere specified|", "8480|Moulding boxes; moulds for metal, glass, rubber or plastics|", "8481|Taps, cocks, valves and similar appliances|tap valve",
    "8482|Ball or roller bearings|bearing", "8483|Transmission shafts, cranks, bearing housings, gears, gearboxes, flywheels, pulleys, clutches|", "8484|Gaskets and similar joints of metal sheeting|",
    "8485|Machines for additive manufacturing (3D printers)|3d printer", "8486|Machines and apparatus for the manufacture of semiconductors, integrated circuits and flat panel displays|", "8487|Machinery parts, not elsewhere specified|",
    "8501|Electric motors and generators (excluding generating sets)|motor", "8502|Electric generating sets and rotary converters|dg set genset generator", "8503|Parts for electric motors and generators|",
    "8504|Electrical transformers, static converters (inverters, UPS, chargers) and inductors|inverter ups charger adapter", "8505|Electromagnets; permanent magnets|magnet",
    "8506|Primary cells and primary batteries|battery cell", "8507|Electric accumulators (lead-acid, lithium-ion batteries)|battery", "8508|Vacuum cleaners|",
    "8509|Electro-mechanical domestic appliances with self-contained electric motor (mixer grinders, juicers)|mixer", "8510|Shavers, hair clippers and hair-removing appliances, with electric motor|trimmer",
    "8511|Electrical ignition or starting equipment for internal combustion engines (spark plugs)|", "8512|Electrical lighting or signalling equipment, windscreen wipers for cycles or motor vehicles|horn headlight",
    "8513|Portable electric lamps with own source of energy (torches)|torch", "8514|Industrial or laboratory electric furnaces and ovens|", "8515|Electric soldering, brazing and welding machines|welding machine",
    "8516|Electric water heaters, immersion heaters, hair dryers, electric irons, microwave ovens, cookers, toasters|geyser iron press microwave induction",
    "8517|Telephone sets, including smartphones; other apparatus for transmission or reception of voice, images or data (routers, modems)|mobile phone smartphone router",
    "8518|Microphones, loudspeakers, headphones and earphones, audio-frequency amplifiers|speaker earphones headphones mic", "8519|Sound recording or sound reproducing apparatus|",
    "8521|Video recording or reproducing apparatus|", "8523|Discs, tapes, solid-state non-volatile storage devices (USB drives, memory cards), smart cards|pendrive",
    "8524|Flat panel display modules|", "8525|Transmission apparatus for radio or television; television cameras, digital cameras, video camera recorders|cctv camera",
    "8526|Radar apparatus, radio navigational aid apparatus and radio remote control apparatus|gps", "8527|Reception apparatus for radio-broadcasting|radio",
    "8528|Monitors and projectors; reception apparatus for television|tv television led tv", "8529|Parts for apparatus of headings 8524 to 8528|", "8531|Electric sound or visual signalling apparatus (bells, sirens, burglar or fire alarms)|",
    "8532|Electrical capacitors, fixed, variable or adjustable|", "8533|Electrical resistors (including rheostats and potentiometers)|", "8534|Printed circuits|pcb",
    "8535|Electrical apparatus for switching or protecting circuits, for a voltage exceeding 1,000 volts|", "8536|Electrical apparatus for switching or protecting circuits, not exceeding 1,000 volts (switches, fuses, plugs, sockets)|mcb switch socket",
    "8537|Boards, panels, consoles, cabinets for electric control or distribution|control panel", "8538|Parts for apparatus of headings 8535, 8536 or 8537|",
    "8539|Electric filament or discharge lamps; LED lamps|bulb tube light", "8541|Semiconductor devices; light-emitting diodes (LED); photovoltaic cells and modules|solar panel",
    "8542|Electronic integrated circuits|chips ic", "8543|Electrical machines and apparatus having individual functions, not elsewhere specified|",
    "8544|Insulated wire, cable and other insulated electric conductors; optical fibre cables|wire cable", "8545|Carbon electrodes, carbon brushes, lamp carbons|",
    "8546|Electrical insulators of any material|", "8548|Electrical parts of machinery or apparatus, not elsewhere specified|", "8549|Electrical and electronic waste and scrap|e-waste",
    "8601|Rail locomotives powered from an external source of electricity or by electric accumulators|", "8603|Self-propelled railway or tramway coaches, vans and trucks|",
    "8605|Railway or tramway passenger coaches, not self-propelled|", "8606|Railway or tramway goods vans and wagons, not self-propelled|", "8607|Parts of railway or tramway locomotives or rolling-stock|",
    "8608|Railway or tramway track fixtures and fittings; mechanical signalling equipment|",
    "8701|Tractors (other than tractors of heading 8709)|tractor", "8702|Motor vehicles for the transport of ten or more persons, including the driver|bus",
    "8703|Motor cars and other motor vehicles principally designed for the transport of persons|car suv gaadi", "8704|Motor vehicles for the transport of goods|truck lorry tempo",
    "8705|Special purpose motor vehicles (crane lorries, fire fighting vehicles, mobile workshops)|", "8706|Chassis fitted with engines, for motor vehicles|", "8707|Bodies (including cabs), for motor vehicles|",
    "8708|Parts and accessories of motor vehicles|auto parts spare parts", "8709|Works trucks, self-propelled, not fitted with lifting equipment|", "8710|Tanks and other armoured fighting vehicles|",
    "8711|Motorcycles (including mopeds) and cycles fitted with an auxiliary motor|bike scooter two wheeler", "8712|Bicycles and other cycles, not motorised|cycle",
    "8713|Carriages for disabled persons (wheelchairs)|wheelchair", "8714|Parts and accessories of motorcycles, bicycles and carriages for disabled persons|", "8715|Baby carriages (prams) and parts thereof|pram",
    "8716|Trailers and semi-trailers; other vehicles, not mechanically propelled|trolley", "8801|Balloons and dirigibles; gliders, hang gliders and other non-powered aircraft|",
    "8802|Other aircraft (helicopters, aeroplanes); spacecraft and suborbital and spacecraft launch vehicles|aeroplane", "8806|Unmanned aircraft|drone", "8807|Parts of goods of heading 8801, 8802 or 8806|",
    "8901|Cruise ships, excursion boats, ferry-boats, cargo ships, barges|ship", "8903|Yachts and other vessels for pleasure or sports; rowing boats and canoes|boat",
    "8905|Light-vessels, fire-floats, dredgers, floating cranes; floating docks|", "8907|Other floating structures (rafts, tanks, buoys)|", "8908|Vessels and other floating structures for breaking up|",
    "9001|Optical fibres; contact lenses; spectacle lenses|lens", "9002|Lenses, prisms, mirrors and other optical elements, mounted|", "9003|Frames and mountings for spectacles, goggles|chashma frame",
    "9004|Spectacles, goggles and the like (corrective, protective)|sunglasses", "9005|Binoculars, monoculars, other optical telescopes|", "9006|Photographic cameras; photographic flashlight apparatus|",
    "9011|Compound optical microscopes|", "9013|Liquid crystal devices; lasers; other optical appliances|", "9015|Surveying, hydrographic, meteorological instruments|",
    "9016|Balances of a sensitivity of 5 cg or better|", "9017|Drawing, marking-out or mathematical calculating instruments; measuring tapes, rulers|scale",
    "9018|Instruments and appliances used in medical, surgical, dental or veterinary sciences|syringe surgical", "9019|Mechano-therapy and massage apparatus; oxygen therapy, respiration apparatus|",
    "9020|Other breathing appliances and gas masks|", "9021|Orthopaedic appliances; artificial parts of the body; hearing aids; pacemakers|", "9022|Apparatus based on X-rays or other ionising radiations|x-ray",
    "9025|Hydrometers, thermometers, pyrometers, barometers, hygrometers|thermometer", "9026|Instruments for measuring or checking the flow, level, pressure of liquids or gases|",
    "9027|Instruments and apparatus for physical or chemical analysis|", "9028|Gas, liquid or electricity supply or production meters|electricity meter water meter",
    "9029|Revolution counters, production counters, taximeters, speedometers|", "9030|Oscilloscopes, spectrum analysers, multimeters and instruments for measuring electrical quantities|",
    "9031|Measuring or checking instruments, appliances and machines not elsewhere specified|", "9032|Automatic regulating or controlling instruments and apparatus (thermostats)|", "9033|Parts and accessories for machines of Chapter 90, not elsewhere specified|",
    "9101|Wrist-watches, pocket-watches with case of precious metal|", "9102|Wrist-watches, pocket-watches and other watches (other than 9101)|ghadi watch", "9103|Clocks with watch movements|",
    "9105|Other clocks (wall clocks, alarm clocks)|", "9113|Watch straps, watch bands and watch bracelets|",
    "9201|Pianos|", "9202|Other string musical instruments (guitars, violins, sitars)|guitar", "9205|Wind musical instruments|flute bansuri", "9206|Percussion musical instruments (drums, tabla, xylophones)|tabla dhol",
    "9207|Musical instruments whose sound is produced or amplified electrically (keyboards)|", "9209|Parts and accessories of musical instruments|",
    "9301|Military weapons (other than revolvers, pistols)|", "9302|Revolvers and pistols|", "9303|Other firearms and similar devices|", "9304|Other arms (spring, air or gas guns and pistols)|",
    "9305|Parts and accessories of articles of headings 9301 to 9304|", "9306|Bombs, grenades, torpedoes, cartridges and other ammunition|", "9307|Swords, cutlasses, bayonets, lances|",
    "9401|Seats (chairs, sofas, car seats) and parts thereof|kursi chair sofa", "9402|Medical, surgical, dental or veterinary furniture; barbers\u2019 chairs|hospital bed",
    "9403|Other furniture and parts thereof (tables, beds, wardrobes, office furniture)|furniture table almirah", "9404|Mattress supports; mattresses, quilts, pillows, cushions, sleeping bags|gadda takiya razai",
    "9405|Luminaires and lighting fittings (lamps, chandeliers, LED lights); illuminated signs|light fitting", "9406|Prefabricated buildings|porta cabin",
    "9503|Tricycles, scooters, dolls, toys, puzzles and scale models|khilona toys", "9504|Video game consoles, playing cards, table games, billiards, carrom|", "9505|Festive, carnival or other entertainment articles|diwali decoration",
    "9506|Articles and equipment for gymnastics, athletics, other sports or outdoor games (cricket bats, balls)|cricket bat gym", "9507|Fishing rods, fish-hooks and other line fishing tackle|",
    "9508|Amusement park rides, water park amusements, fairground amusements; travelling circuses and theatres|",
    "9601|Worked ivory, bone, tortoise-shell, horn, coral, mother-of-pearl and articles thereof|", "9602|Worked vegetable or mineral carving material and articles thereof|",
    "9603|Brooms, brushes (including toothbrushes, paint brushes), mops|jhadu broom", "9605|Travel sets for personal toilet, sewing or shoe or clothes cleaning|", "9606|Buttons, press-fasteners, snap-fasteners|button",
    "9607|Slide fasteners (zips) and parts thereof|zip chain", "9608|Ball point pens; felt tipped pens and markers; fountain pens; propelling pencils|pen", "9609|Pencils, crayons, pencil leads, pastels, drawing charcoals, chalks|pencil",
    "9610|Slates and boards, with writing or drawing surfaces (whiteboards, blackboards)|", "9611|Date, sealing or numbering stamps; hand-operated printing sets|rubber stamp",
    "9612|Typewriter or similar ribbons; ink-pads|", "9613|Cigarette lighters and other lighters|", "9614|Smoking pipes and cigar or cigarette holders|", "9615|Combs, hair-slides, hairpins, curling pins|kanghi",
    "9616|Scent sprays and similar toilet sprays; powder-puffs|", "9617|Vacuum flasks and other vacuum vessels|thermos flask", "9618|Tailors\u2019 dummies and other mannequins|",
    "9619|Sanitary towels (pads) and tampons, napkins and napkin liners for babies (diapers) and similar articles|sanitary pads diaper", "9620|Monopods, bipods, tripods and similar articles|tripod",
    "9701|Paintings, drawings and pastels executed entirely by hand; collages, mosaics|art painting", "9702|Original engravings, prints and lithographs|", "9703|Original sculptures and statuary, in any material|murti",
    "9704|Postage or revenue stamps, first-day covers, used or unused (not current)|", "9705|Collections and collectors\u2019 pieces of archaeological, historical, numismatic interest|", "9706|Antiques of an age exceeding one hundred years|"
  ];

  // SAC (Services Accounting Codes, Chapter 99 of India\u2019s GST scheme)
  var SAC = [
    "9954|Construction services|building contractor", "995411|Construction services of single dwelling or multi-dwelling or multi-storied residential buildings|flats house",
    "995412|Construction services of other residential buildings (old age homes, hostels and the like)|", "995413|Construction services of industrial buildings (factories, plants)|",
    "995414|Construction services of commercial buildings (offices, exhibition and marriage halls, malls)|", "995415|Construction services of other non-residential buildings (schools, hospitals)|",
    "995419|Repair, alteration, addition, replacement, renovation, maintenance or remodelling of buildings|renovation", "995421|General construction services of highways, streets, roads, railways, airfield runways, bridges and tunnels|road",
    "995461|Electrical installation services (electrical wiring and fitting)|electrician wiring", "995462|Water plumbing and drain laying services|plumber",
    "995463|Heating, ventilation and air conditioning equipment installation services|hvac", "995471|Glazing services|", "995472|Plastering services|", "995473|Painting services|painter",
    "995474|Floor and wall tiling services|", "995476|Joinery and carpentry services|carpenter", "995477|Fencing and railing services|",
    "9961|Services in wholesale trade|commission agent", "9962|Services in retail trade|", "9963|Accommodation, food and beverage services|",
    "996311|Room or unit accommodation services provided by hotels, inns, guest houses, clubs and the like|hotel stay lodging",
    "996331|Services provided by restaurants, cafes and similar eating facilities, including takeaway and door delivery of food|restaurant food delivery",
    "996332|Food and beverage services provided by hotels, inns, guest houses, clubs (room service, takeaway, delivery)|", "996333|Services provided in canteens and similar establishments|canteen",
    "996334|Catering services in exhibition halls, events, marriage halls and other outdoor or indoor functions|caterer",
    "9964|Passenger transport services|cab taxi bus", "9965|Goods transport services|gta logistics", "996511|Road transport services of goods (by trucks, trailers and other vehicles)|transporter gta",
    "9966|Rental services of transport vehicles with operators|", "996601|Rental services of road vehicles (buses, coaches, cars, trucks) with operator|car rental",
    "9967|Supporting services in transport|", "996713|Clearing and forwarding services|c&f", "996729|Other storage and warehousing services|warehouse godown",
    "9968|Postal and courier services|", "996812|Courier services|", "9969|Electricity, gas, water and other distribution services|",
    "9971|Financial and related services|banking insurance", "9972|Real estate services|", "997211|Rental or leasing services involving own or leased residential property|house rent",
    "997212|Rental or leasing services involving own or leased non-residential property|shop rent office rent commercial rent", "997221|Property management services on a fee/commission basis or contract basis|",
    "9973|Leasing or rental services with or without operator|", "997331|Licensing services for the right to use computer software and databases|software licence saas",
    "9981|Research and development services|", "9982|Legal and accounting services|", "998211|Legal advisory and representation services concerning criminal law|lawyer advocate",
    "998212|Legal advisory and representation services concerning other fields of law|lawyer advocate", "998213|Legal documentation and certification services concerning patents, copyrights and other intellectual property rights|trademark",
    "998214|Legal documentation and certification services concerning other documents|", "998215|Arbitration and conciliation services|", "998216|Other legal services not elsewhere classified|",
    "998221|Financial auditing services|ca audit", "998222|Accounting and bookkeeping services|accountant", "998223|Payroll services|", "998231|Corporate tax consulting and preparation services|",
    "998232|Individual tax preparation and planning services|itr filing", "998241|Insolvency and receivership services|",
    "9983|Other professional, technical and business services|", "998311|Management consulting and management services (financial, strategic, human resources, marketing, operations, supply chain)|consultant",
    "998312|Business consulting services including public relations services|pr", "998313|Information technology (IT) consulting and support services|it support",
    "998314|Information technology (IT) design and development services|software development website app", "998315|Hosting and information technology (IT) infrastructure provisioning services|web hosting cloud",
    "998316|IT infrastructure and network management services|", "998319|Other information technology services not elsewhere classified|", "998321|Architectural advisory services|architect",
    "998331|Engineering advisory services|", "998361|Advertising services|ad agency", "998365|Sale of Internet advertising space|digital ads", "998371|Market research services|",
    "998391|Specialty design services (interior, fashion, industrial and other design)|interior designer graphic design", "998395|Translation and interpretation services|translator",
    "998399|Other professional, technical and business services not elsewhere classified|",
    "9984|Telecommunications, broadcasting and information supply services|", "998413|Mobile telecommunications services|mobile recharge", "998422|Internet access services in wired and wireless mode|broadband",
    "9985|Support services|", "998512|Permanent placement services, other than executive search|recruitment", "998513|Contract staffing services|manpower",
    "998525|Guard services|security guard", "998531|Disinfecting and exterminating services|pest control", "998533|General cleaning services|housekeeping",
    "998551|Reservation services for transportation|ticket booking", "998552|Reservation services for accommodation, cruises and package tours|", "998554|Tour operator services|travel agent",
    "998593|Telephone-based support services (call centres)|bpo", "998596|Events, exhibitions, conventions and trade shows organisation and assistance services|event management",
    "9986|Support services to agriculture, hunting, forestry, fishing, mining and utilities|", "9987|Maintenance, repair and installation (except construction) services|",
    "998713|Maintenance and repair services of computers and peripheral equipment|laptop repair", "998714|Maintenance and repair services of transport machinery and equipment|vehicle service garage",
    "998715|Maintenance and repair services of electrical household appliances|", "998717|Maintenance and repair services of elevators and escalators|amc lift",
    "998718|Maintenance and repair services of commercial and industrial machinery|",
    "9988|Manufacturing services on physical inputs (goods) owned by others (job work)|job work", "9989|Other manufacturing services; publishing, printing and reproduction services; materials recovery services|",
    "9991|Public administration and other services provided to the community as a whole; compulsory social security services|", "9992|Education services|school coaching",
    "999293|Commercial training and coaching services|coaching classes tuition", "9993|Human health and social care services|hospital doctor", "9994|Sewage and waste collection, treatment and disposal and other environmental protection services|",
    "9995|Services of membership organisations|", "9996|Recreational, cultural and sporting services|", "9997|Other services|", "999712|Dry-cleaning services|laundry",
    "999721|Hairdressing and barbers\u2019 services|salon", "999722|Cosmetic treatment, manicuring and pedicuring services|beauty parlour spa", "999723|Physical well-being services including health clubs and fitness centres|gym",
    "9998|Domestic services|", "9999|Services provided by extraterritorial organisations and bodies|"
  ];

  var HSN_IDX = null;
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[\u2019']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function sectionOf(ch) {
    var n = Number(ch);
    for (var i = 0; i < SECTIONS.length; i++) if (n >= SECTIONS[i][2] && n <= SECTIONS[i][3]) return SECTIONS[i];
    return null;
  }
  function buildIndex() {
    if (HSN_IDX) return HSN_IDX;
    var items = [];
    function mk(type, code, desc, kw, ch) {
      var it = { type: type, code: code, desc: desc, kw: kw || '', ch: ch };
      it.nd = norm(desc); it.nk = norm(kw); it.nc = type === 'chapter' ? '' : norm(CHAPTERS[ch] || '');
      it.flat = (it.nd + ' ' + it.nk).replace(/ /g, '');
      it.words = (it.nd + ' ' + it.nk).split(' ').filter(function (w, i, a) { return w.length > 2 && a.indexOf(w) === i; });
      items.push(it);
      return it;
    }
    Object.keys(CHAPTERS).forEach(function (ch) { mk('chapter', ch, CHAPTERS[ch], ch === '77' ? 'reserved' : '', ch); });
    HEADINGS.forEach(function (l) { var p = l.split('|'); mk('hsn', p[0], p[1], p[2], p[0].slice(0, 2)); });
    SAC.forEach(function (l) { var p = l.split('|'); mk('sac', p[0], p[1], p[2], '99'); });
    HSN_IDX = items;
    return items;
  }
  function lev1(a, b, max) {
    // bounded Levenshtein distance (returns max+1 when exceeded)
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i]; var best = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < best) best = cur[j];
      }
      if (best > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }
  function wordHit(text, tok) {
    if (!text) return 0;
    var i = (' ' + text).indexOf(' ' + tok);
    if (i >= 0) return 2;            // word starts with token
    return text.indexOf(tok) >= 0 ? 1 : 0;
  }
  /** Score-ranked search. kind: all | hsn | sac */
  function searchHsn(q, kind) {
    var items = buildIndex();
    var raw = String(q || '').trim();
    var digits = raw.replace(/[\s.]/g, '');
    var out = [];
    if (/^\d{1,8}$/.test(digits)) {
      items.forEach(function (it) {
        if (kind !== 'all' && it.type !== 'chapter' && it.type !== kind) return;
        if (kind === 'sac' && it.type === 'chapter') return;
        if (kind === 'hsn' && it.type === 'sac') return;
        var s = 0;
        if (it.code === digits) s = 1000;
        else if (it.code.indexOf(digits) === 0) s = 600 - it.code.length;
        else if (digits.indexOf(it.code) === 0 && digits.length > it.code.length) s = 400 + it.code.length; // longer code typed: show parent
        if (s) out.push({ it: it, s: s });
      });
    } else {
      var nq = norm(raw);
      if (!nq) return [];
      var flatQ = nq.replace(/ /g, '');
      var toks = nq.split(' ').filter(function (t) { return t.length > 1; });
      items.forEach(function (it) {
        if (kind === 'hsn' && it.type === 'sac') return;
        if (kind === 'sac' && it.type !== 'sac') return;
        var s = 0, all = true;
        if (flatQ.length >= 3 && it.flat.indexOf(flatQ) >= 0) s += 40;
        toks.forEach(function (t) {
          var h = wordHit(it.nd, t), k = wordHit(it.nk, t);
          var c = wordHit(it.nc, t);
          var ts = h ? (h === 2 ? 12 : 6) : k ? (k === 2 ? 10 : 5) : c ? 2 : 0;
          if (!ts && t.length >= 4) {
            var max = t.length >= 7 ? 2 : 1;
            for (var i = 0; i < it.words.length; i++) {
              var w = it.words[i];
              if (lev1(t, w.slice(0, Math.max(t.length, Math.min(w.length, t.length + 1))), max) <= max) { ts = 3; break; }
            }
          }
          if (!ts) all = false;
          s += ts;
        });
        if (!toks.length && !s) all = false;
        if ((all && s > 0) || s >= 40) {
          if (it.type === 'chapter') s -= 1;
          out.push({ it: it, s: s });
        }
      });
    }
    out.sort(function (a, b) { return b.s - a.s || (a.it.type === 'chapter') - (b.it.type === 'chapter') || a.it.code.length - b.it.code.length || (a.it.code < b.it.code ? -1 : 1); });
    return out.map(function (o) { return o.it; });
  }

  // ======================================================= HSN CODE FINDER
  BT.impl('hsn-code-finder', function (root) {
    injectStyle();
    buildIndex();
    var nH = HEADINGS.length, nS = SAC.length;
    root.innerHTML = '<div class="gst-wrap">' +
      notice('warn', '<b>GST rates are not shown.</b> Rates were rationalised with effect from 22 September 2025 and continue to be revised. ' +
        'Verify the current rate for any code on the official CBIC GST rate finder: ' + ext('https://cbic-gst.gov.in/gst-goods-services-rates.html') + '.', 'info') +
      '<div class="gst-hsn">' +
        '<div class="gst-hsn-tree">' + card('Browse the HS tree',
          '<p class="muted small" style="margin-top:-6px">21 sections · 97 chapters · services (SAC)</p><div class="gst-tree" id="hs-tree"></div>') + '</div>' +
        '<div class="gst-wrap">' +
          '<div class="card">' +
            '<div class="gst-search">' + BT.icon('search') + '<label for="hs-q" class="sr-only">Search HSN or SAC by code or keyword</label>' +
            '<input type="search" id="hs-q" autocomplete="off" spellcheck="false" placeholder="Search by product, service or code — e.g. computer, t-shirt, 8517, legal"></div>' +
            '<div class="gst-bar" style="margin-top:12px">' + seg('hs-kind', [['all', 'All'], ['hsn', 'Goods (HSN)'], ['sac', 'Services (SAC)']], 'all', 'Code type') +
            '<span class="muted small" id="hs-count"></span></div>' +
          '</div>' +
          '<div id="hs-res" class="gst-res" aria-live="polite"></div>' +
          card('Which code length do I need?',
            '<ul class="small" style="margin:0;padding-left:18px;color:var(--text-2)">' +
            '<li><b>Aggregate turnover above ₹5 crore</b> in the previous year: 6-digit HSN/SAC on all tax invoices.</li>' +
            '<li><b>Turnover up to ₹5 crore:</b> 4-digit HSN/SAC on B2B tax invoices (optional on B2C invoices).</li>' +
            '<li>Exporters and importers usually quote the full 8-digit ITC-HS code.</li></ul>' +
            '<p class="gst-note">General guidance only. This finder lists HS chapters, ' + nH + ' common 4-digit headings and ' + nS + ' SAC groups/codes; take the 6- or 8-digit sub-heading from the Customs Tariff / CBIC rate schedule.</p>') +
        '</div>' +
      '</div></div>';

    var q = $('#hs-q', root), res = $('#hs-res', root), cnt = $('#hs-count', root), tree = $('#hs-tree', root);
    var kind = 'all', chapterView = null;

    // tree
    tree.innerHTML = SECTIONS.map(function (s) {
      var chs = [];
      for (var c = s[2]; c <= s[3]; c++) chs.push((c < 10 ? '0' : '') + c);
      return '<details><summary>' + BT.icon('chevron-right') + '<em>' + s[0] + '</em><span>' + esc(s[1]) + '</span></summary><div class="gst-chs">' +
        chs.map(function (c) {
          return '<button type="button" data-ch="' + c + '"' + (c === '77' ? ' class="res"' : '') + '><b>' + c + '</b><span>' + esc(CHAPTERS[c]) + '</span></button>';
        }).join('') + '</div></details>';
    }).join('') +
      '<details><summary>' + BT.icon('chevron-right') + '<em>SAC</em><span>Services (Chapter 99 — Services Accounting Codes)</span></summary><div class="gst-chs">' +
      '<button type="button" data-ch="99"><b>99</b><span>All service groups and common SAC codes</span></button></div></details>';

    function hl(text, toks) {
      var h = esc(text);
      toks.forEach(function (t) {
        if (t.length < 2) return;
        h = h.replace(new RegExp('(^|[^a-z0-9&;])(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '$1<mark>$2</mark>');
      });
      return h;
    }
    function itemHtml(it, toks) {
      var cls = it.type === 'sac' ? ' svc' : it.type === 'chapter' ? ' chap' : '';
      var path;
      if (it.type === 'chapter') { var s = sectionOf(it.code); path = 'Chapter · Section ' + (s ? s[0] : ''); }
      else if (it.type === 'sac') path = 'SAC · ' + (it.code.length === 4 ? 'Service group' : 'Service code under ' + it.code.slice(0, 4));
      else path = 'HSN heading · Chapter ' + it.ch + ' — ' + esc(CHAPTERS[it.ch]);
      return '<div class="gst-item' + cls + '" data-code="' + it.code + '"><span class="gst-cc">' + it.code + '</span><div class="gst-body"><div class="gst-desc">' + hl(it.desc, toks) + '</div>' +
        '<div class="gst-path">' + path + '</div></div>' +
        (it.code === '77' ? '' : '<button type="button" class="btn btn-sm btn-ghost" data-copy="' + it.code + '" aria-label="Copy code ' + it.code + '">' + BT.icon('copy') + '<span class="sr-only">Copy</span></button>') + '</div>';
    }
    function render() {
      var v = q.value.trim();
      var items, toks = norm(v).split(' ').filter(Boolean), title = '';
      $$('button[data-ch]', tree).forEach(function (b) { b.setAttribute('aria-current', String(!v && b.getAttribute('data-ch') === chapterView)); });
      if (v) {
        items = searchHsn(v, kind);
      } else if (chapterView) {
        var idx = buildIndex();
        items = idx.filter(function (it) {
          if (chapterView === '99') return it.type === 'sac';
          return it.ch === chapterView && (it.type === 'hsn' || it.type === 'chapter');
        });
        title = chapterView === '99' ? 'Services (SAC)' : 'Chapter ' + chapterView;
      } else {
        var pop = ['0401', '1006', '3004', '6109', '8471', '8517', '8703', '9403', '998314', '997212', '996511', '998313'];
        items = pop.map(function (c) { return buildIndex().filter(function (it) { return it.code === c && it.type !== 'chapter'; })[0]; }).filter(Boolean);
        title = 'Popular codes';
      }
      var LIMIT = 80;
      cnt.textContent = v ? items.length + ' result' + (items.length === 1 ? '' : 's') : title;
      if (!items.length) {
        res.innerHTML = '<div class="empty-state">' + BT.icon('text-search') + '<p style="margin:8px 0 0">No match for “' + esc(v) + '”. Try a simpler word (e.g. “shirt”, “pump”, “rent”) or browse the chapters.</p></div>';
        return;
      }
      res.innerHTML = (title && !v ? '<h3 style="margin:0">' + esc(title) + (chapterView && chapterView !== '99' ? ' <span class="muted small" style="font-weight:500">· ' + esc(CHAPTERS[chapterView]) + '</span>' : '') + '</h3>' : '') +
        items.slice(0, LIMIT).map(function (it) { return itemHtml(it, v ? toks : []); }).join('') +
        (items.length > LIMIT ? '<p class="gst-note">Showing the top ' + LIMIT + ' of ' + items.length + ' matches. Refine your search for more specific results.</p>' : '') +
        (chapterView && !v && chapterView !== '99' && items.length <= 1 ? '<p class="gst-note">' + (chapterView === '77' ? 'Chapter 77 is reserved for possible future use in the Harmonized System.' : 'No common headings are listed offline for this chapter; refer to the Customs Tariff for its headings.') + '</p>' : '');
    }
    q.addEventListener('input', BT.debounce(render, 80));
    wireSegs(root, function (id, v) { if (id === 'hs-kind') { kind = v; render(); } });
    root.addEventListener('click', function (e) {
      var c = e.target.closest('[data-copy]');
      if (c) { BT.copy(c.getAttribute('data-copy'), 'Copied ' + c.getAttribute('data-copy')); return; }
      var b = e.target.closest('button[data-ch]');
      if (b) { chapterView = b.getAttribute('data-ch'); q.value = ''; render(); if (window.innerWidth < 960) res.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
    render();
  });

  // ======================================================= GST DUE DATES
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // QRMP GSTR-3B: 22nd for these states/UTs (Category I), 24th for all others.
  var CAT1 = ['22', '23', '24', '25', '26', '27', '29', '30', '31', '32', '33', '34', '35', '36', '37'];
  var FORM_COLOR = {
    'GSTR-1': '#4f46e5', 'IFF': '#7c3aed', 'GSTR-3B': '#0891b2', 'PMT-06': '#0d9488', 'CMP-08': '#059669', 'GSTR-4': '#16a34a',
    'GSTR-9': '#db2777', 'GSTR-9C': '#be185d', 'GSTR-7': '#d97706', 'GSTR-8': '#ea580c', 'ITC-04': '#64748b'
  };
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fmtD(d) { return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); }
  function fyLabel(y) { return y + '-' + String(y + 1).slice(2); }

  /** Build the list of due dates for a financial year starting April of `y`. */
  function buildEvents(o) {
    var y = o.fy, ev = [];
    function add(date, form, period, desc) { ev.push({ date: date, form: form, period: period, desc: desc }); }
    function mlabel(m) { var d = new Date(y, 3 + m, 1); return MONTH[d.getMonth()] + ' ' + d.getFullYear(); }
    function qlabel(q) {
      var a = new Date(y, 3 + q * 3, 1), b = new Date(y, 5 + q * 3, 1);
      return MON[a.getMonth()] + '–' + MON[b.getMonth()] + ' ' + b.getFullYear() + ' (Q' + (q + 1) + ')';
    }
    var fyl = 'FY ' + fyLabel(y);
    if (o.type === 'monthly') {
      for (var m = 0; m < 12; m++) {
        add(new Date(y, 4 + m, 11), 'GSTR-1', mlabel(m), 'Statement of outward supplies for ' + mlabel(m) + '.');
        add(new Date(y, 4 + m, 20), 'GSTR-3B', mlabel(m), 'Summary return and tax payment for ' + mlabel(m) + '.');
      }
    } else if (o.type === 'qrmp') {
      var day3b = CAT1.indexOf(o.state) >= 0 ? 22 : 24;
      for (var q = 0; q < 4; q++) {
        for (var k = 0; k < 2; k++) {
          var mm = q * 3 + k;
          if (o.iff) add(new Date(y, 4 + mm, 13), 'IFF', mlabel(mm), 'Invoice Furnishing Facility (optional) for B2B invoices of ' + mlabel(mm) + '.');
          add(new Date(y, 4 + mm, 25), 'PMT-06', mlabel(mm), 'Monthly tax deposit for ' + mlabel(mm) + ' under QRMP (fixed-sum or self-assessment method).');
        }
        add(new Date(y, 6 + q * 3, 13), 'GSTR-1', qlabel(q), 'Quarterly statement of outward supplies for ' + qlabel(q) + '.');
        add(new Date(y, 6 + q * 3, day3b), 'GSTR-3B', qlabel(q), 'Quarterly summary return for ' + qlabel(q) + ' (' + (day3b === 22 ? '22nd: Category I state/UT' : '24th: Category II state/UT') + ').');
      }
    } else {
      for (var c = 0; c < 4; c++) add(new Date(y, 6 + c * 3, 18), 'CMP-08', qlabel(c), 'Composition tax payment statement for ' + qlabel(c) + '.');
      add(new Date(y + 1, 3, 30), 'GSTR-4', fyl, 'Annual return for composition taxpayers for ' + fyl + '.');
    }
    if (o.annual && o.type !== 'composition') {
      add(new Date(y + 1, 11, 31), 'GSTR-9', fyl, 'Annual return for ' + fyl + ' (optional where aggregate turnover is up to ₹2 crore).');
      add(new Date(y + 1, 11, 31), 'GSTR-9C', fyl, 'Self-certified reconciliation statement for ' + fyl + ' (where aggregate turnover exceeds ₹5 crore).');
    }
    for (var t = 0; t < 12; t++) {
      if (o.tds) add(new Date(y, 4 + t, 10), 'GSTR-7', mlabel(t), 'TDS return by GST tax deductors for ' + mlabel(t) + '.');
      if (o.tcs) add(new Date(y, 4 + t, 10), 'GSTR-8', mlabel(t), 'TCS statement by e-commerce operators for ' + mlabel(t) + '.');
    }
    if (o.itc04 === 'half') {
      add(new Date(y, 9, 25), 'ITC-04', 'Apr–Sep ' + y, 'Job-work goods statement for April–September ' + y + ' (turnover above ₹5 crore: half-yearly).');
      add(new Date(y + 1, 3, 25), 'ITC-04', 'Oct ' + y + '–Mar ' + (y + 1), 'Job-work goods statement for October ' + y + '–March ' + (y + 1) + '.');
    } else if (o.itc04 === 'annual') {
      add(new Date(y + 1, 3, 25), 'ITC-04', fyl, 'Annual job-work goods statement for ' + fyl + ' (turnover up to ₹5 crore).');
    }
    var order = ['GSTR-7', 'GSTR-8', 'GSTR-1', 'IFF', 'CMP-08', 'GSTR-3B', 'PMT-06', 'ITC-04', 'GSTR-4', 'GSTR-9', 'GSTR-9C'];
    ev.sort(function (a, b) { return a.date - b.date || order.indexOf(a.form) - order.indexOf(b.form); });
    return ev;
  }

  // ------------------------------------------------------------- iCalendar
  function icsEsc(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function u8len(cp) { return cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4; }
  /** Fold a content line at 75 octets (RFC 5545 §3.1), never splitting a UTF-8 sequence. */
  function fold(line) {
    var out = [], cur = '', n = 0;
    Array.from(line).forEach(function (ch) {
      var b = u8len(ch.codePointAt(0));
      if (n + b > 75) { out.push(cur); cur = ' '; n = 1; }
      cur += ch; n += b;
    });
    out.push(cur);
    return out.join('\r\n');
  }
  function buildIcs(events, o) {
    var now = new Date();
    var stamp = now.getUTCFullYear() + pad(now.getUTCMonth() + 1) + pad(now.getUTCDate()) + 'T' + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + pad(now.getUTCSeconds()) + 'Z';
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BISCS Tools//GST Due Date Calendar//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'X-WR-CALNAME:' + icsEsc('GST due dates FY ' + fyLabel(o.fy)), 'X-WR-TIMEZONE:Asia/Kolkata'];
    events.forEach(function (e, i) {
      var end = new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate() + 1);
      var summ = e.form + ' due – ' + e.period;
      L.push('BEGIN:VEVENT',
        'UID:gst-' + fyLabel(o.fy) + '-' + o.type + '-' + e.form.replace(/[^A-Za-z0-9]/g, '').toLowerCase() + '-' + ymd(e.date) + '-' + i + '@tools.biscs.in',
        'DTSTAMP:' + stamp,
        'DTSTART;VALUE=DATE:' + ymd(e.date),
        'DTEND;VALUE=DATE:' + ymd(end),
        'SUMMARY:' + icsEsc(summ),
        'DESCRIPTION:' + icsEsc(e.desc + ' Standard due date under GST rules; the government often extends deadlines, so always confirm on the GST portal (gst.gov.in).'),
        'CATEGORIES:GST',
        'TRANSP:TRANSPARENT');
      if (o.alarm) L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(summ + ' in 2 days'), 'TRIGGER:-P2D', 'END:VALARM');
      L.push('END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.map(fold).join('\r\n') + '\r\n';
  }

  BT.impl('gst-due-date-calendar', function (root) {
    injectStyle();
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var curFy = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
    var fys = [];
    for (var y = 2021; y <= curFy + 1; y++) fys.push(y);
    var stateOpts = STATES.filter(function (s) { return ['25', '28', '97', '99'].indexOf(s[0]) < 0; });
    root.innerHTML = '<div class="gst-wrap">' +
      notice('warn', '<b>Standard due dates only.</b> These dates follow the regular GST rules. The government frequently extends deadlines by notification — always confirm on the GST portal (' +
        ext('https://www.gst.gov.in/', 'gst.gov.in') + ') before filing. Dates falling on a Sunday or public holiday are not shifted here; any relief is notified separately.', 'calendar-clock') +
      '<div class="split wide-left" style="align-items:start">' +
        '<div class="gst-wrap">' +
          card('Your filing profile',
            '<div class="row cols-2"><div class="field"><label for="dd-fy">Financial year</label><select id="dd-fy">' +
              fys.map(function (y) { return '<option value="' + y + '"' + (y === curFy ? ' selected' : '') + '>FY ' + fyLabel(y) + (y === curFy ? ' (current)' : '') + '</option>'; }).join('') +
            '</select></div>' +
            '<div class="field" id="dd-state-f"><label for="dd-state">State / UT of registration</label><select id="dd-state">' +
              stateOpts.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === '27' ? ' selected' : '') + '>' + esc(s[1]) + '</option>'; }).join('') +
            '</select><div class="hint" id="dd-cat"></div></div></div>' +
            '<div class="field"><span class="label" id="dd-type-l">Filing type</span>' +
              seg('dd-type', [['monthly', 'Monthly'], ['qrmp', 'QRMP (quarterly)'], ['composition', 'Composition']], 'monthly', 'Filing type') + '</div>' +
            '<div class="gst-opts">' +
              '<label class="check" id="dd-iff-l"><input type="checkbox" id="dd-iff" checked> <span>Show IFF dates (optional B2B invoice upload, months 1–2 of each quarter)</span></label>' +
              '<label class="check" id="dd-annual-l"><input type="checkbox" id="dd-annual" checked> <span>Annual return GSTR-9 / reconciliation GSTR-9C</span></label>' +
              '<label class="check"><input type="checkbox" id="dd-tds"> <span>I deduct GST TDS (GSTR-7)</span></label>' +
              '<label class="check"><input type="checkbox" id="dd-tcs"> <span>I am an e-commerce operator collecting TCS (GSTR-8)</span></label>' +
            '</div>' +
            '<div class="field"><label for="dd-itc">Job work (ITC-04)</label><select id="dd-itc">' +
              '<option value="">Not applicable</option><option value="annual">Turnover up to ₹5 crore — annual (25 April)</option><option value="half">Turnover above ₹5 crore — half-yearly (25 Oct / 25 Apr)</option>' +
            '</select></div>' +
            '<label class="check"><input type="checkbox" id="dd-hide"> <span>Hide dates that have already passed</span></label>') +
          card('Add to your calendar',
            '<p class="small muted" style="margin-top:-6px">Download an .ics file for Google Calendar, Outlook or Apple Calendar. Each due date becomes an all-day event.</p>' +
            '<label class="check" style="margin-bottom:14px"><input type="checkbox" id="dd-alarm" checked> <span>Add a reminder 2 days before each due date</span></label>' +
            '<div class="btn-group"><button type="button" class="btn btn-primary" id="dd-ics">' + BT.icon('calendar-plus') + ' Download .ics</button>' +
            '<button type="button" class="btn" id="dd-copy">' + BT.icon('copy') + ' Copy list</button></div>') +
        '</div>' +
        '<div class="gst-wrap" id="dd-side"></div>' +
      '</div>' +
      card('Month-by-month timeline', '<div id="dd-tl"></div><div class="gst-legend" id="dd-legend"></div>', '<span class="badge" id="dd-n"></span>') +
    '</div>';

    var lastEvents = [], lastOpts = null;
    function opts() {
      return {
        fy: Number($('#dd-fy', root).value), type: segVal(root, 'dd-type'), state: $('#dd-state', root).value,
        iff: $('#dd-iff', root).checked, annual: $('#dd-annual', root).checked, tds: $('#dd-tds', root).checked, tcs: $('#dd-tcs', root).checked,
        itc04: $('#dd-itc', root).value, alarm: $('#dd-alarm', root).checked, hide: $('#dd-hide', root).checked
      };
    }
    function days(d) { return Math.round((d - today) / 864e5); }
    function status(d) {
      var n = days(d);
      if (n < 0) return { cls: 'past', b: badge('danger', 'Passed'), t: 'Date passed — if not filed, the return is overdue and late fee/interest may apply' };
      if (n === 0) return { cls: 'today soon', b: badge('warn', 'Due today'), t: 'Due today' };
      if (n <= 7) return { cls: 'soon', b: badge('warn', 'In ' + n + ' day' + (n === 1 ? '' : 's')), t: 'Due in ' + n + ' days' };
      if (n <= 30) return { cls: 'up', b: badge('', 'In ' + n + ' days'), t: 'Upcoming' };
      return { cls: '', b: '<span class="badge" style="background:var(--surface-2);color:var(--text-3)">Scheduled</span>', t: 'Scheduled' };
    }
    function render() {
      var o = opts();
      var q = o.type === 'qrmp';
      $('#dd-state-f', root).classList.toggle('hidden', !q);
      $('#dd-iff-l', root).classList.toggle('hidden', !q);
      $('#dd-annual-l', root).classList.toggle('hidden', o.type === 'composition');
      $('#dd-cat', root).textContent = CAT1.indexOf(o.state) >= 0 ? 'Category I — quarterly GSTR-3B due on the 22nd' : 'Category II — quarterly GSTR-3B due on the 24th';
      var ev = buildEvents(o);
      lastEvents = ev; lastOpts = o;
      var shown = o.hide ? ev.filter(function (e) { return days(e.date) >= 0; }) : ev;
      // side summary
      var next = ev.filter(function (e) { return days(e.date) >= 0; });
      var nPast = ev.length - next.length;
      var n30 = next.filter(function (e) { return days(e.date) <= 30; }).length;
      var nx = next[0];
      var sameDay = nx ? next.filter(function (e) { return +e.date === +nx.date; }) : [];
      $('#dd-side', root).innerHTML =
        '<div class="gst-hero"><div class="gst-h-top">' + BT.icon('clock') + ' Next due date · FY ' + fyLabel(o.fy) + '</div>' +
        (nx ? '<div class="gst-next" style="margin-top:8px"><div><div class="gst-nd" id="dd-next">' + fmtD(nx.date) + '</div>' +
          '<div class="gst-h-sub" style="margin-top:6px">' + sameDay.map(function (e) { return '<b>' + esc(e.form) + '</b> · ' + esc(e.period); }).join('<br>') + '</div></div>' +
          '<span class="gst-pill">' + (days(nx.date) === 0 ? 'TODAY' : 'IN ' + days(nx.date) + ' DAY' + (days(nx.date) === 1 ? '' : 'S')) + '</span></div>'
          : '<div class="gst-h-msg">All due dates in FY ' + fyLabel(o.fy) + ' have passed.</div>') + '</div>' +
        '<div class="gst-stats">' +
          '<div class="stat"><div class="label">Due dates</div><div class="value">' + ev.length + '</div></div>' +
          '<div class="stat warn"><div class="label">Next 30 days</div><div class="value">' + n30 + '</div></div>' +
          '<div class="stat bad"><div class="label">Passed</div><div class="value">' + nPast + '</div></div>' +
        '</div>' +
        card('Rules used', '<ul class="small" style="margin:0;padding-left:18px;color:var(--text-2);display:grid;gap:4px">' + rulesFor(o).map(function (r) { return '<li>' + r + '</li>'; }).join('') + '</ul>');
      // timeline
      $('#dd-n', root).textContent = shown.length + ' date' + (shown.length === 1 ? '' : 's');
      var html = '', curKey = '';
      var nowKey = today.getFullYear() * 12 + today.getMonth();
      shown.forEach(function (e) {
        var key = e.date.getFullYear() * 12 + e.date.getMonth();
        if (key !== curKey) {
          if (curKey !== '') html += '</div></div>';
          html += '<div class="gst-month' + (key === nowKey ? ' now' : '') + '"><h4>' + MONTH[e.date.getMonth()] + ' ' + e.date.getFullYear() + (key === nowKey ? ' · this month' : '') + '</h4><div class="gst-evs">';
          curKey = key;
        }
        var st = status(e.date);
        html += '<div class="gst-ev ' + st.cls + '" data-form="' + esc(e.form) + '" data-period="' + esc(e.period) + '" data-date="' + iso(e.date) + '" title="' + esc(st.t) + '">' +
          '<div class="gst-dt"><b>' + e.date.getDate() + '</b><span>' + WD[e.date.getDay()] + '</span></div>' +
          '<div style="min-width:0"><div class="gst-f"><i style="background:' + (FORM_COLOR[e.form] || 'var(--brand)') + '"></i>' + esc(e.form) + ' <span class="muted small" style="font-weight:500">· ' + esc(e.period) + '</span></div>' +
          '<div class="gst-p">' + esc(e.desc) + '</div></div>' + st.b + '</div>';
      });
      if (curKey !== '') html += '</div></div>';
      $('#dd-tl', root).innerHTML = html || '<div class="empty-state">No remaining due dates for this selection. Untick “Hide dates that have already passed” to see the full year.</div>';
      var forms = [];
      ev.forEach(function (e) { if (forms.indexOf(e.form) < 0) forms.push(e.form); });
      $('#dd-legend', root).innerHTML = forms.map(function (f) { return '<span><i style="background:' + FORM_COLOR[f] + '"></i>' + f + '</span>'; }).join('') +
        '<span><i style="background:var(--warn-soft);border:1px solid var(--warn)"></i>Due within 7 days</span><span><i style="background:var(--danger-soft)"></i>Passed</span>';
    }
    function rulesFor(o) {
      var r = [];
      if (o.type === 'monthly') r.push('GSTR-1: 11th of the following month', 'GSTR-3B: 20th of the following month');
      if (o.type === 'qrmp') {
        if (o.iff) r.push('IFF (optional): 13th of the next month, for months 1–2 of a quarter');
        r.push('PMT-06: 25th of the next month, for months 1–2 of a quarter', 'GSTR-1 (quarterly): 13th of the month after the quarter',
          'GSTR-3B (quarterly): 22nd for Category I states/UTs, 24th for others — your state: ' + (CAT1.indexOf(o.state) >= 0 ? '22nd' : '24th'));
      }
      if (o.type === 'composition') r.push('CMP-08: 18th of the month after each quarter', 'GSTR-4: 30 April after the financial year');
      if (o.annual && o.type !== 'composition') r.push('GSTR-9 / 9C: 31 December after the financial year');
      if (o.tds || o.tcs) r.push('GSTR-7 / GSTR-8: 10th of the following month');
      if (o.itc04) r.push(o.itc04 === 'half' ? 'ITC-04: 25 October and 25 April (half-yearly)' : 'ITC-04: 25 April (annual)');
      return r;
    }
    wireSegs(root, function (id) { if (id === 'dd-type') render(); });
    root.addEventListener('change', function (e) { if (e.target.matches('select, input[type=checkbox]')) render(); });
    $('#dd-ics', root).addEventListener('click', function () {
      var o = opts();
      var ev = o.hide ? lastEvents.filter(function (e) { return days(e.date) >= 0; }) : lastEvents;
      if (!ev.length) { BT.toast('No due dates to export', 'error'); return; }
      BT.download(buildIcs(ev, o), 'gst-due-dates-FY' + fyLabel(o.fy) + '-' + o.type + '.ics', 'text/calendar;charset=utf-8');
      BT.toast('Calendar file downloaded (' + ev.length + ' events)');
    });
    $('#dd-copy', root).addEventListener('click', function () {
      var o = lastOpts;
      var txt = 'GST due dates – FY ' + fyLabel(o.fy) + ' (' + (o.type === 'qrmp' ? 'QRMP' : o.type === 'composition' ? 'Composition' : 'Monthly') + ')\n' +
        lastEvents.map(function (e) { return fmtD(e.date) + '  ' + e.form + '  ' + e.period; }).join('\n') +
        '\n\nStandard due dates; confirm extensions on the GST portal.';
      BT.copy(txt, 'Due date list copied');
    });
    render();
  });

  // Exposed for tests and for other tools that may want the same logic.
  BT.gstUtil = { gstinCheck: gstinCheck, analyseGstin: analyseGstin, analysePan: analysePan, analyseIfsc: analyseIfsc, buildEvents: buildEvents, buildIcs: buildIcs, searchHsn: searchHsn };
})();
