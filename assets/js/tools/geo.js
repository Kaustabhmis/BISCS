/*
 * BISCS Tools — GEO (Generative Engine Optimization) and AEO (Answer Engine
 * Optimization) tools:
 *   llms-txt-generator, ai-crawler-checker, geo-content-analyzer,
 *   aeo-answer-optimizer, faq-schema-generator, question-generator,
 *   readability-checker, entity-schema-builder, hreflang-generator.
 *
 * Everything runs in the browser on text the user types or pastes. No other
 * website is fetched and no third-party API is called. Pasted HTML is parsed
 * with DOMParser (an inert document): its scripts never run and it is never
 * inserted into the live page.
 */
(function () {
  'use strict';
  var BT = window.BT;
  var esc = BT.esc;

  // Keep a local copy of each implementation so a tool can still start if
  // core booted before this deferred script ran (same pattern as seo.js).
  var LOCAL = {};
  function impl(id, fn) { LOCAL[id] = fn; BT.impl(id, fn); }

  // =================================================================== styles
  var CSS = [
    '.geo-h{font-size:1.05rem;margin:0}',
    '.geo-sec{font-size:.76rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);margin:14px 0 10px}',
    '.geo-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}',
    '.geo-toolbar .spacer{flex:1}',
    '.geo-inl{display:inline-flex;align-items:center;gap:8px;font-size:.88rem;font-weight:600;color:var(--text-2)}',
    '.geo-inl select,.geo-inl input{width:auto;min-height:34px;padding:5px 10px}',
    '.geo-out{min-height:320px;font-size:.82rem;line-height:1.55;white-space:pre;overflow-wrap:normal;overflow-x:auto}',
    '.geo-out.wrap{white-space:pre-wrap;overflow-wrap:anywhere}',
    '.geo-msgs{display:flex;flex-direction:column;gap:8px;margin-top:12px}',
    '.geo-msgs:empty{display:none}',
    '.geo-count{font-size:.78rem;color:var(--text-3);font-variant-numeric:tabular-nums;display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap}',
    '.geo-lrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:space-between}',
    '.geo-lrow>label{font-size:.85rem;font-weight:600;color:var(--text-2)}',
    '.geo-ib{width:34px;height:34px;padding:0;flex:none}',
    '.geo-up{transform:rotate(180deg)}',
    '.geo-rows{display:flex;flex-direction:column;gap:12px;margin-bottom:12px}',
    '.geo-rowc{border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;background:var(--surface-2);min-width:0}',
    '.geo-rowc .field{margin-bottom:10px}',
    '.geo-rowh{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;font-size:.8rem;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.04em}',
    '.geo-acts{display:flex;gap:4px;align-items:center}',
    '.geo-link{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr) auto;gap:8px;align-items:end;padding:10px;border:1px dashed var(--border-strong);border-radius:var(--radius-sm);background:var(--surface);margin-bottom:10px}',
    '.geo-link .field{margin:0}',
    '.geo-link .geo-full{grid-column:1/-1}',
    '.geo-link .geo-acts{padding-bottom:4px}',
    '@media (max-width:640px){.geo-link{grid-template-columns:minmax(0,1fr)}.geo-link .geo-acts{justify-content:flex-end;order:9}}',
    '.geo-imp{margin-top:12px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);padding:10px 14px}',
    '.geo-imp>summary{cursor:pointer;font-weight:650;display:flex;align-items:center;gap:8px;list-style:none}',
    '.geo-imp>summary::-webkit-details-marker{display:none}',
    '.geo-imp>summary::after{content:"";margin-left:auto;width:8px;height:8px;border-right:2px solid var(--text-3);border-bottom:2px solid var(--text-3);transform:rotate(45deg);transition:transform .15s}',
    '.geo-imp[open]>summary::after{transform:rotate(-135deg)}',
    '.geo-imp[open]>summary{margin-bottom:12px}',
    '@media (min-width:900px){.geo-sticky{position:sticky;top:80px}}',
    /* score ring */
    '.geo-score{display:flex;align-items:center;gap:20px;flex-wrap:wrap}',
    '.geo-ring{--p:0;--c:var(--ok);width:128px;height:128px;border-radius:50%;flex:none;display:grid;place-items:center;background:conic-gradient(var(--c) calc(var(--p)*1%),var(--surface-2) 0);box-shadow:inset 0 0 0 1px var(--border)}',
    '.geo-ring>div{width:102px;height:102px;border-radius:50%;background:var(--surface);display:grid;place-items:center;text-align:center;line-height:1.1;box-shadow:0 4px 14px -6px rgba(0,0,0,.25)}',
    '.geo-ring b{font-size:2.1rem;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.03em}',
    '.geo-ring small{display:block;font-size:.72rem;color:var(--text-3);font-weight:600}',
    /* check list */
    '.geo-clist{display:flex;flex-direction:column;gap:8px}',
    '.geo-ci{border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;background:var(--surface)}',
    '.geo-ci .hd{display:flex;align-items:flex-start;gap:10px}',
    '.geo-ci .hd .badge{flex:none;min-width:50px;justify-content:center;margin-top:1px}',
    '.geo-ci .nm{font-weight:650;font-size:.93rem;display:flex;flex-wrap:wrap;gap:4px 8px;align-items:baseline}',
    '.geo-ci .wt{font-size:.75rem;color:var(--text-3);font-weight:600}',
    '.geo-ci .dt{color:var(--text-2);font-size:.86rem;margin-top:2px;overflow-wrap:anywhere}',
    '.geo-ci .tip{color:var(--text-3);font-size:.84rem;margin-top:4px}',
    '.geo-ci.fail{border-left:4px solid var(--danger)}.geo-ci.warn{border-left:4px solid var(--warn)}.geo-ci.pass{border-left:4px solid var(--ok)}.geo-ci.info{border-left:4px solid var(--brand)}',
    /* highlighted text */
    '.geo-hl{line-height:1.85;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px 16px;max-height:560px;overflow:auto;overflow-wrap:anywhere;font-size:.95rem}',
    '.geo-hl p{margin:0 0 .8em}.geo-hl p:last-child{margin:0}',
    '.geo-hl mark{background:none;color:inherit;padding:1px 0;border-radius:3px}',
    '.geo-hl .s-long{background:rgba(245,158,11,.2)}',
    '.geo-hl .s-vlong{background:rgba(239,68,68,.2)}',
    '.geo-hl .w-pass{box-shadow:inset 0 -2px 0 #3b82f6;background:rgba(59,130,246,.16)}',
    '.geo-hl .w-adv{box-shadow:inset 0 -2px 0 #a855f7}',
    '.geo-hl .w-cx{box-shadow:inset 0 -2px 0 #14b8a6}',
    '.geo-hl.no-long .s-long,.geo-hl.no-long .s-vlong{background:none}',
    '.geo-hl.no-pass .w-pass,.geo-hl.no-adv .w-adv,.geo-hl.no-cx .w-cx{box-shadow:none;background:none}',
    '.geo-hl .g-def{background:rgba(16,185,129,.22);box-shadow:inset 0 -2px 0 var(--ok)}',
    '.geo-hl .g-num{background:rgba(99,102,241,.2);font-weight:650}',
    '.geo-hl .g-ent{box-shadow:inset 0 -2px 0 #f59e0b}',
    '.geo-hl .g-cut{display:inline-block;font-size:.7rem;font-weight:700;color:var(--danger);border:1px solid var(--danger);border-radius:99px;padding:0 6px;margin:0 4px;line-height:1.5;vertical-align:1px}',
    '.geo-leg{display:flex;flex-wrap:wrap;gap:8px 16px;margin:0 0 10px;font-size:.85rem}',
    '.geo-leg i{display:inline-block;width:14px;height:10px;border-radius:3px;margin-right:2px;vertical-align:-1px}',
    /* badges for bot purposes */
    '.geo-p{display:inline-flex;align-items:center;padding:2px 9px;border-radius:999px;font-size:.72rem;font-weight:700;white-space:nowrap}',
    '.geo-p.training{background:var(--danger-soft);color:var(--danger)}',
    '.geo-p.search{background:var(--brand-soft);color:var(--brand)}',
    '.geo-p.user{background:var(--warn-soft);color:var(--warn)}',
    '.geo-p.engine{background:var(--ok-soft);color:var(--ok)}',
    '.geo-p.control{background:var(--surface-2);color:var(--text-2);border:1px solid var(--border)}',
    '.geo-wrapc{white-space:normal!important;min-width:180px;overflow-wrap:anywhere}',
    '.geo-mono{font-family:var(--mono);font-size:.82rem}',
    '.geo-st{display:inline-flex;align-items:center;gap:5px;font-weight:700}',
    '.geo-st.ok{color:var(--ok)}.geo-st.no{color:var(--danger)}',
    '.geo-bots{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(min(100%,250px),1fr))}',
    '.geo-bot{display:flex;align-items:center;gap:8px;justify-content:space-between;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface)}',
    '.geo-bot label{font-weight:600;font-size:.88rem;min-width:0;overflow-wrap:anywhere}',
    '.geo-bot select{width:auto;min-height:32px;padding:3px 8px;font-size:.85rem}',
    '.geo-dl{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));margin:0}',
    '.geo-dl>div{border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;background:var(--surface)}',
    '.geo-dl dt{font-weight:700;display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
    '.geo-dl dd{margin:4px 0 0;color:var(--text-2);font-size:.86rem}',
    /* question generator */
    '.geo-qgrid{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr))}',
    '.geo-qg{border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);padding:14px;min-width:0}',
    '.geo-qg h3{font-size:.95rem;display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 10px}',
    '.geo-qi{display:flex;align-items:flex-start;gap:8px;padding:6px 4px;border-top:1px solid var(--border)}',
    '.geo-qi:first-of-type{border-top:0}',
    '.geo-qi .tx{flex:1;min-width:0;font-size:.9rem;overflow-wrap:anywhere}',
    '.geo-qi .tx b{color:var(--brand);font-weight:650}',
    '.geo-qi .fit{flex:none;font-size:.68rem;font-weight:700;padding:1px 7px;border-radius:99px;background:var(--surface-2);color:var(--text-3);border:1px solid var(--border);margin-top:2px}',
    '.geo-star{flex:none;width:30px;height:30px;border-radius:8px;border:1px solid transparent;background:none;color:var(--text-3);display:grid;place-items:center;cursor:pointer;margin-top:-4px}',
    '.geo-star:hover{border-color:var(--border);color:var(--text)}',
    '.geo-star[aria-pressed="true"]{color:#f59e0b}',
    '.geo-star[aria-pressed="true"] svg{fill:#f59e0b}',
    /* readability */
    '.geo-big{display:flex;gap:18px;align-items:center;flex-wrap:wrap}',
    '.geo-scale{position:relative;height:12px;border-radius:99px;background:linear-gradient(90deg,#ef4444,#f59e0b 35%,#eab308 50%,#22c55e 70%,#10b981);margin:26px 0 6px}',
    '.geo-scale i{position:absolute;top:-6px;width:4px;height:24px;border-radius:3px;background:var(--text);box-shadow:0 0 0 2px var(--surface);transform:translateX(-2px);transition:left .25s}',
    '.geo-scale-l{display:flex;justify-content:space-between;font-size:.72rem;color:var(--text-3)}',
    '.geo-grades{display:grid;gap:8px}',
    '.geo-gr{display:grid;grid-template-columns:minmax(0,140px) minmax(0,1fr) 52px;gap:10px;align-items:center;font-size:.86rem}',
    '.geo-gr .bar{height:9px;border-radius:99px;background:var(--surface-2);border:1px solid var(--border);overflow:hidden}',
    '.geo-gr .bar span{display:block;height:100%;background:linear-gradient(90deg,var(--brand),var(--brand-2));border-radius:99px}',
    '.geo-gr b{text-align:right;font-variant-numeric:tabular-nums}',
    /* faq preview */
    '.geo-faqpv details{border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 16px;background:var(--surface);margin-bottom:8px}',
    '.geo-faqpv summary{cursor:pointer;font-weight:650}',
    '.geo-faqpv details>div{margin-top:10px;color:var(--text-2)}',
    '.geo-faqpv details>div p{margin:0 0 .6em}',
    '.geo-faqpv h2{font-size:1.15rem}',
    /* snippet preview */
    '.geo-snip{border:1px solid var(--border);border-radius:var(--radius);padding:16px 18px;background:var(--surface);box-shadow:var(--shadow-sm)}',
    '.geo-snip .q{font-size:.78rem;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;display:flex;gap:6px;align-items:center}',
    '.geo-snip p{margin:0 0 8px}.geo-snip ol,.geo-snip ul{margin:0;padding-left:22px}',
    '.geo-snip table{border-collapse:collapse;font-size:.88rem;width:100%}.geo-snip td,.geo-snip th{border:1px solid var(--border);padding:6px 8px;text-align:left}',
    '.geo-voice{background:linear-gradient(135deg,var(--brand-soft),var(--surface));border:1px solid var(--border);border-radius:var(--radius);padding:16px}',
    '.geo-voice blockquote{margin:8px 0;padding:10px 14px;border-left:4px solid var(--brand);background:var(--surface);border-radius:0 var(--radius-sm) var(--radius-sm) 0;font-size:1rem}',
    /* checklist */
    '.geo-eeat{display:flex;flex-direction:column;gap:6px}',
    '.geo-eeat label{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);cursor:pointer}',
    '.geo-eeat label.done{background:var(--ok-soft)}',
    '.geo-eeat input{margin-top:3px;flex:none}',
    '.geo-eeat b{display:block;font-size:.9rem}',
    '.geo-eeat span span{display:block;font-size:.83rem;color:var(--text-3);margin-top:1px}',
    '.geo-prog{height:10px;border-radius:99px;background:var(--surface-2);border:1px solid var(--border);overflow:hidden;margin:4px 0 12px}',
    '.geo-prog>span{display:block;height:100%;background:linear-gradient(90deg,var(--ok),var(--brand));transition:width .25s}',
    '.geo-fieldrow{display:grid;grid-template-columns:minmax(0,150px) minmax(0,1fr);gap:8px;align-items:center;margin-bottom:8px}',
    '.geo-fieldrow label{font-size:.85rem;font-weight:600;color:var(--text-2)}',
    '.geo-fieldrow .bad{border-color:var(--danger)}',
    '@media (max-width:520px){.geo-fieldrow{grid-template-columns:minmax(0,1fr);gap:4px}}',
    /* hreflang rows */
    '.geo-hr{display:grid;grid-template-columns:minmax(0,130px) minmax(0,1fr) auto;gap:8px;align-items:start;margin-bottom:8px}',
    '.geo-hr .field{margin:0}',
    '.geo-hr .err{font-size:.78rem;color:var(--danger);font-weight:600;margin-top:3px;display:block}',
    '.geo-hr .okc{font-size:.78rem;color:var(--ok);font-weight:600;margin-top:3px;display:block}',
    '.geo-pick{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:8px;align-items:end}',
    '.geo-pick .field{margin:0}',
    '@media (max-width:560px){.geo-pick{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.geo-pick .btn{grid-column:1/-1}}',
    '.geo-chips{display:flex;flex-wrap:wrap;gap:6px}',
    '.geo-chips .btn{height:30px;padding:0 10px;font-size:.8rem}',
    '.geo-tag{font-family:var(--mono);font-size:.78rem;background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:1px 6px}'
  ].join('\n');

  function css() {
    if (document.getElementById('geo-css')) return;
    var s = document.createElement('style');
    s.id = 'geo-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ============================================================ UI helpers
  function btn(attrs, icon, label, cls) {
    return '<button type="button" class="btn btn-sm ' + (cls || '') + '" ' + attrs + '>' +
      (icon ? BT.icon(icon) : '') + '<span>' + label + '</span></button>';
  }
  function ibtn(attrs, icon, label, iconCls) {
    return '<button type="button" class="btn btn-sm btn-ghost geo-ib" ' + attrs + ' aria-label="' + esc(label) + '" title="' + esc(label) + '">' + BT.icon(icon, iconCls) + '</button>';
  }
  function upbtn(attrs, label) { return ibtn(attrs, 'chevron-down', label, 'geo-up'); }
  function chk(id, label, on) {
    return '<label class="check"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '> ' + label + '</label>';
  }
  function seg(id, items, active, label) {
    return '<div class="seg" role="group" aria-label="' + esc(label) + '" id="' + id + '">' + items.map(function (it) {
      var on = it[0] === active;
      return '<button type="button" data-v="' + esc(it[0]) + '" class="' + (on ? 'active' : '') + '" aria-pressed="' + on + '">' + esc(it[1]) + '</button>';
    }).join('') + '</div>';
  }
  function setSeg(el, v) {
    BT.$$('button[data-v]', el).forEach(function (x) {
      var on = x.getAttribute('data-v') === v;
      x.classList.toggle('active', on);
      x.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function wireSeg(el, cb) {
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-v]');
      if (!b) return;
      setSeg(el, b.getAttribute('data-v'));
      cb(b.getAttribute('data-v'));
    });
  }
  function notice(kind, msg) {
    return '<div class="notice ' + kind + '">' + BT.icon(kind === 'ok' ? 'check' : 'info') + '<span>' + msg + '</span></div>';
  }
  function msgsHTML(list) { return list.map(function (m) { return notice(m[0], m[1]); }).join(''); }
  /** Delegate clicks on [data-a] elements to handlers. */
  function onClickA(root, map) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (b && root.contains(b) && map[b.getAttribute('data-a')]) map[b.getAttribute('data-a')](b, e);
    });
  }
  function field(id, label, input, hint, counter) {
    return '<div class="field">' +
      (counter ? '<div class="geo-lrow"><label for="' + id + '">' + label + '</label><span class="geo-count" id="' + id + '-c" aria-live="polite"></span></div>'
        : '<label for="' + id + '">' + label + '</label>') +
      input + (hint ? '<span class="hint">' + hint + '</span>' : '') + '</div>';
  }
  function inp(id, type, ph, v, extra) {
    return '<input type="' + (type || 'text') + '" id="' + id + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') +
      (v != null && v !== '' ? ' value="' + esc(v) + '"' : '') + (extra || '') + '>';
  }
  function ta(id, ph, rows, cls, extra) {
    return '<textarea id="' + id + '" rows="' + (rows || 4) + '"' + (cls ? ' class="' + cls + '"' : '') + (ph ? ' placeholder="' + esc(ph) + '"' : '') + (extra || '') + '></textarea>';
  }
  function sel(id, opts, v, extra) {
    return '<select id="' + id + '"' + (extra || '') + '>' + opts.map(function (o) {
      var ov = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o;
      return '<option value="' + esc(ov) + '"' + (String(ov) === String(v) ? ' selected' : '') + '>' + esc(l) + '</option>';
    }).join('') + '</select>';
  }
  function val(root, id) { var el = BT.$('#' + id, root); return el ? (el.type === 'checkbox' ? el.checked : el.value.trim()) : ''; }
  function plural(n, w, ws) { return BT.fmtNum(n, 0) + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function lsGet(key, def) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; }
  }
  function lsSet(key, v) {
    try { if (v == null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(v)); return true; } catch (e) { return false; }
  }
  function lines(s) { return String(s || '').split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function listOf(s) { return String(s || '').split(/[\n,;]+/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function oneLine(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  /** Parse an absolute http(s) URL or return null. */
  function httpUrl(s) {
    try {
      var u = new URL(String(s).trim());
      return /^https?:$/.test(u.protocol) && u.hostname && (/\./.test(u.hostname) || u.hostname === 'localhost') ? u : null;
    } catch (e) { return null; }
  }
  function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s); }
  /** JSON-LD script; "<" is escaped so the data can never close the script tag. */
  function jsonLd(obj) {
    return '<script type="application/ld+json">\n' + JSON.stringify(obj, null, 2).replace(/</g, '\\u003c') + '\n</script>';
  }
  function xmlEsc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]; });
  }
  function reEsc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function ucFirst(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function scoreColor(p) { return p >= 75 ? 'var(--ok)' : p >= 50 ? 'var(--warn)' : 'var(--danger)'; }
  function ringHTML(score, label) {
    return '<div class="geo-ring" style="--p:' + score + ';--c:' + scoreColor(score) + '" role="img" aria-label="' + esc(label) + ' ' + score + ' out of 100"><div><span><b>' + score + '</b><small>/ 100</small></span></div></div>';
  }
  var ST_LABEL = { pass: 'Pass', warn: 'Warn', fail: 'Fail', info: 'Info' };
  var ST_BADGE = { pass: 'ok', warn: 'warn', fail: 'danger', info: '' };
  function checkHTML(c, showWeight) {
    return '<div class="geo-ci ' + c.status + '"><div class="hd"><span class="badge ' + ST_BADGE[c.status] + '">' + ST_LABEL[c.status] + '</span><div style="min-width:0;flex:1">' +
      '<div class="nm">' + esc(c.name) + (showWeight && c.weight ? '<span class="wt">weight ' + c.weight + '</span>' : '') + '</div>' +
      '<div class="dt">' + c.detail + '</div>' + (c.tip && c.status !== 'pass' ? '<div class="tip">' + BT.icon('sparkles') + ' ' + c.tip + '</div>' : '') +
      '</div></div></div>';
  }
  function wireCopyDl(root, getText, filename, mime) {
    return {
      copy: function () { var t = getText(); if (!t.trim()) { BT.toast('Nothing to copy yet', 'error'); return; } BT.copy(t); },
      dl: function () { var t = getText(); if (!t.trim()) { BT.toast('Nothing to download yet', 'error'); return; } BT.download(t, typeof filename === 'function' ? filename() : filename, mime || 'text/plain'); }
    };
  }

  // ======================================================== text analysis
  var ABBR_END = /(?:\b(?:mr|mrs|ms|dr|prof|sr|jr|st|vs|etc|inc|ltd|co|no|nos|rs|approx|dept|est|fig|govt|pvt|e\.g|i\.e|u\.s|u\.k|a\.m|p\.m|viz|al|ca|cf|ft|sq|max|min|ph\.d)\.|\b[A-Z]\.)$/i;

  /** Split a line into sentences, keeping the original text (with trailing spaces). */
  function splitSentences(line) {
    var parts = String(line).match(/[^.!?…]+(?:[.!?…]+["'”’)\]]*)?\s*|[.!?…]+["'”’)\]]*\s*/g) || [];
    var out = [], buf = '';
    parts.forEach(function (p, i) {
      buf += p;
      var last = i === parts.length - 1;
      // "3.5", "example.com" (no space after the dot) and "e.g. " never end a sentence.
      if (!last && (!/\s$/.test(p) || ABBR_END.test(buf.trim()))) return;
      if (buf.trim()) out.push(buf);
      buf = '';
    });
    if (buf.trim()) out.push(buf);
    return out;
  }
  var WORD_RE = /[A-Za-z0-9À-ɏ]+(?:['’][A-Za-z]+)*(?:-[A-Za-z0-9À-ɏ]+)*/g;
  function wordsOf(s) { return String(s).match(WORD_RE) || []; }

  var SYL_EXC = { the: 1, every: 3, area: 3, idea: 3, real: 1, being: 2, business: 3, people: 2, india: 3, indian: 3, create: 2, created: 3, science: 2, quiet: 2, poem: 2, lion: 2, period: 3, video: 3, radio: 3, piano: 3, ion: 2, reuse: 2, toward: 2, towards: 2, everyone: 3, everything: 4, somewhere: 2, someone: 2, sometimes: 2, something: 2, maybe: 2, eye: 1, eyes: 1, fire: 1, hour: 1, hours: 1, our: 1, are: 1, were: 1, where: 1, there: 1, here: 1, more: 1, before: 2, simile: 3, recipe: 3, apostrophe: 4, coyote: 3, cafe: 2, naive: 2, doing: 2, going: 2, seeing: 2, saying: 2, playing: 2, staying: 2, gst: 3, seo: 3, faq: 3, pdf: 3, ai: 2, ok: 2, a: 1, i: 1 };
  /** English syllable estimate (heuristic, typically within one syllable). */
  function syllables(word) {
    var w = String(word).toLowerCase().replace(/[’']/g, '').replace(/[^a-z]/g, '');
    if (!w) return /\d/.test(word) ? Math.max(1, Math.min(4, String(word).replace(/\D/g, '').length)) : 0;
    if (SYL_EXC[w]) return SYL_EXC[w];
    if (w.length <= 3) return 1;
    if (/[^aeiouy]ed$/.test(w) && !/[td]ed$/.test(w)) w = w.slice(0, -2);
    else if (/[^laeiouy]es$/.test(w) && !/(?:[sxz]|ch|sh|[cg])es$/.test(w)) w = w.slice(0, -2);
    else if (/[^laeiouy]e$/.test(w)) w = w.slice(0, -1);
    w = w.replace(/^y/, '');
    var n = (w.match(/[aeiouy]+/g) || []).length;
    // Vowel pairs that are usually two syllables: "cre-ate", "ri-ot", "flu-id".
    n += (w.match(/(?:ia(?!n$)|io(?!n|u)|iu|ua(?!r|g)|uo|eo(?!u)|ea(?=t(?:e|ion))|ie(?=r$|st$|t)|uity|riet)/g) || []).length;
    if (/[^aeiouy]le$/.test(String(word).toLowerCase()) && n === 0) n = 1;
    return Math.max(1, n);
  }
  function hyphSyl(w) { return String(w).split('-').reduce(function (a, p) { return a + (p ? syllables(p) : 0); }, 0) || 1; }

  /**
   * Full readability statistics for a block of text.
   * Paragraph = non-empty line. Sentence = punctuation-delimited unit within a line.
   */
  function analyse(text) {
    var paras = String(text || '').split(/\r?\n/).map(function (l) { return l.replace(/\s+$/, ''); }).filter(function (l) { return l.trim(); });
    var R = { paragraphs: [], sentences: 0, words: 0, syllables: 0, letters: 0, complex: 0, poly: 0, chars: 0, longWords: 0, sentList: [], wordList: [] };
    paras.forEach(function (p) {
      var ps = { text: p, sents: [], words: 0 };
      splitSentences(p).forEach(function (s) {
        var ws = wordsOf(s);
        var info = { text: s, words: ws.length };
        ps.sents.push(info);
        if (!ws.length) return;
        R.sentences++;
        R.sentList.push(info);
        ws.forEach(function (w, i) {
          var sy = hyphSyl(w);
          var letters = w.replace(/[^A-Za-z0-9À-ɏ]/g, '').length;
          R.words++; R.syllables += sy; R.letters += letters; R.chars += letters;
          if (sy >= 3) {
            R.poly++;
            var proper = i > 0 && /^[A-Z]/.test(w);
            var stem = w.replace(/(?:es|ed|ing)$/i, '');
            if (!proper && w.indexOf('-') < 0 && hyphSyl(stem) >= 3) R.complex++;
          }
          if (sy >= 4) R.longWords++;
          R.wordList.push(w);
        });
        ps.words += ws.length;
      });
      R.paragraphs.push(ps);
    });
    var W = R.words, S = Math.max(1, R.sentences);
    if (W) {
      var wps = W / S, spw = R.syllables / W;
      R.wps = wps; R.spw = spw;
      R.fre = 206.835 - 1.015 * wps - 84.6 * spw;
      R.fk = 0.39 * wps + 11.8 * spw - 15.59;
      R.fog = 0.4 * (wps + 100 * R.complex / W);
      R.smog = 1.043 * Math.sqrt(R.poly * (30 / S)) + 3.1291;
      R.cli = 0.0588 * (R.letters / W * 100) - 0.296 * (S / W * 100) - 15.8;
      R.ari = 4.71 * (R.chars / W) + 0.5 * wps - 21.43;
      R.grade = (R.fk + R.fog + R.smog + R.cli + R.ari) / 5;
    }
    return R;
  }
  function freLabel(f) {
    if (f >= 90) return ['Very easy', '5th grade (about age 11)'];
    if (f >= 80) return ['Easy', '6th grade'];
    if (f >= 70) return ['Fairly easy', '7th grade'];
    if (f >= 60) return ['Plain English', '8th–9th grade (age 13–15)'];
    if (f >= 50) return ['Fairly difficult', '10th–12th grade'];
    if (f >= 30) return ['Difficult', 'College level'];
    return ['Very difficult', 'University graduate'];
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function r1(n) { return isFinite(n) ? Math.round(n * 10) / 10 : 0; }

  var IRREG = 'arisen awoken borne born beaten begun bent bound bitten blown broken brought built burnt bought caught chosen cut dealt done drawn driven eaten fallen fed felt fought found fled flown forbidden forgotten forgiven frozen given ground grown hung heard hidden hit held hurt kept known laid led left lent lit lost made meant met paid put quit read ridden rung risen said seen sought sold sent set shaken shed shot shown shut sung sunk slain slid spoken spent spun split spread stolen stuck stung struck sworn swept swung taken taught torn told thought thrown understood upset worn woven won withdrawn written';
  var PASSIVE_RE = new RegExp('\\b(?:am|is|are|was|were|be|been|being|is not|are not|was not|were not|isn[\'’]t|aren[\'’]t|wasn[\'’]t|weren[\'’]t)\\s+(?:(?:not|never|also|often|always|usually|already|then|being|generally|commonly|widely)\\s+)?(?:[a-z]+ly\\s+)?(?:[a-z]{2,}ed|' + IRREG.split(' ').join('|') + ')\\b', 'gi');
  var NOT_PART = { speed: 1, indeed: 1, succeed: 1, proceed: 1, exceed: 1, breed: 1, bleed: 1, greed: 1, hundred: 1, sacred: 1, naked: 1, wicked: 1, kindred: 1, embed: 1, need: 1, feed: 1, seed: 1, shed: 1, bed: 1, red: 1, wed: 1, weed: 1, deed: 1, heed: 1, reed: 1 };
  var ADV_RE = /\b[A-Za-z]{2,}ly\b/g;
  var NOT_ADV = { only: 1, early: 1, daily: 1, weekly: 1, monthly: 1, yearly: 1, quarterly: 1, hourly: 1, family: 1, apply: 1, reply: 1, supply: 1, rely: 1, ally: 1, italy: 1, july: 1, fly: 1, holy: 1, ugly: 1, belly: 1, jelly: 1, rally: 1, bully: 1, lily: 1, silly: 1, friendly: 1, lovely: 1, lonely: 1, costly: 1, likely: 1, unlikely: 1, elderly: 1, orderly: 1, timely: 1, curly: 1, oily: 1, hilly: 1, chilly: 1, assembly: 1, anomaly: 1, butterfly: 1, comply: 1, imply: 1, multiply: 1, deadly: 1, lively: 1, homely: 1, emily: 1, firefly: 1, monopoly: 1, ply: 1, sly: 1, wily: 1, burly: 1, surly: 1, gully: 1, tally: 1, dolly: 1, folly: 1, jolly: 1, molly: 1, holly: 1, scholarly: 1 };
  function passiveMatches(s) {
    var out = [], m;
    PASSIVE_RE.lastIndex = 0;
    while ((m = PASSIVE_RE.exec(s))) {
      var last = m[0].split(/\s+/).pop().toLowerCase();
      if (NOT_PART[last]) continue;
      out.push([m.index, m.index + m[0].length]);
    }
    return out;
  }
  function adverbMatches(s) {
    var out = [], m;
    ADV_RE.lastIndex = 0;
    while ((m = ADV_RE.exec(s))) if (!NOT_ADV[m[0].toLowerCase()]) out.push([m.index, m.index + m[0].length]);
    return out;
  }
  function complexMatches(s) {
    var out = [], m, re = new RegExp(WORD_RE.source, 'g'), first = true;
    while ((m = re.exec(s))) {
      var w = m[0];
      if (hyphSyl(w) >= 3 && w.indexOf('-') < 0 && !(!first && /^[A-Z]/.test(w)) && hyphSyl(w.replace(/(?:es|ed|ing)$/i, '')) >= 3) out.push([m.index, m.index + w.length]);
      first = false;
    }
    return out;
  }
  /** Wrap non-overlapping ranges [[a,b,cls]] of s in <mark class>, escaping everything. */
  function markRanges(s, ranges) {
    ranges = ranges.slice().sort(function (x, y) { return x[0] - y[0] || (y[1] - y[0]) - (x[1] - x[0]); });
    var out = '', pos = 0;
    ranges.forEach(function (r) {
      if (r[0] < pos) return;
      out += esc(s.slice(pos, r[0])) + '<mark class="' + r[2] + '">' + esc(s.slice(r[0], r[1])) + '</mark>';
      pos = r[1];
    });
    return out + esc(s.slice(pos));
  }
  function tagged(list, cls) { return list.map(function (r) { return [r[0], r[1], cls]; }); }

  /** Visible text of an HTML string (inert DOMParser document), with block breaks. */
  function htmlDoc(html) { return new DOMParser().parseFromString(String(html), 'text/html'); }
  var BLOCKS = 'p,div,li,h1,h2,h3,h4,h5,h6,tr,section,article,blockquote,pre,dt,dd,figcaption,header,footer,main,aside,table,ul,ol,details,summary,caption';
  function blockText(el) {
    BT.$$('br', el).forEach(function (b) { b.replaceWith('\n'); });
    BT.$$(BLOCKS, el).forEach(function (b) { b.prepend('\n'); b.append('\n'); });
    BT.$$('td,th', el).forEach(function (c) { c.append(' | '); });
    return String(el.textContent || '').split('\n').map(function (l) { return l.replace(/[ \t ]+/g, ' ').replace(/\s*\|\s*$/, '').trim(); }).filter(Boolean).join('\n');
  }
  function looksHtml(s) { return /<\/?(?:p|h[1-6]|div|ul|ol|li|table|article|section|br|a|span|strong|em|main|body|html|blockquote)\b[^>]*>/i.test(s); }

  var STOP = ' a an the and or but if of to in on at for by with from as is are was were be been being am do does did done can could should would will shall may might must i me my we our you your he she it its they them their this that these those there here what which who whom whose when where why how not no yes so than then too very just also about into over under up down out off again more most some any each few such own same other only both all nor get got gets getting have has had having make makes made ';
  function isStop(w) { return STOP.indexOf(' ' + w.toLowerCase() + ' ') > -1; }
  function stem(w) { return String(w).toLowerCase().replace(/(?:ies)$/, 'y').replace(/(?:ing|ed|es|s)$/, ''); }
  function keyTerms(q) {
    var seen = {};
    return wordsOf(q).filter(function (w) {
      var k = stem(w);
      if (w.length < 3 && !/^[A-Z0-9]{2}$/.test(w)) return false;
      if (isStop(w) || seen[k]) return false;
      seen[k] = 1;
      return true;
    });
  }
  function termPresence(terms, text) {
    var st = {};
    wordsOf(text).forEach(function (w) { st[stem(w)] = 1; });
    var hit = terms.filter(function (t) { return st[stem(t)]; });
    return { hit: hit, miss: terms.filter(function (t) { return !st[stem(t)]; }) };
  }

  // ====================================================== llms-txt-generator
  var ACRO = { seo: 'SEO', gst: 'GST', pdf: 'PDF', faq: 'FAQ', faqs: 'FAQs', ai: 'AI', api: 'API', emi: 'EMI', tds: 'TDS', hsn: 'HSN', sip: 'SIP', ppf: 'PPF', fd: 'FD', rd: 'RD', hra: 'HRA', jpg: 'JPG', png: 'PNG', csv: 'CSV', json: 'JSON', html: 'HTML', css: 'CSS', url: 'URL', utm: 'UTM', qr: 'QR', bmi: 'BMI', cagr: 'CAGR', pan: 'PAN', ifsc: 'IFSC', gstin: 'GSTIN', llms: 'LLMs', uuid: 'UUID', jwt: 'JWT', ui: 'UI', ux: 'UX', it: 'IT', b2b: 'B2B', us: 'US', uk: 'UK' };
  var SMALL = { and: 1, or: 1, of: 1, the: 1, in: 1, for: 1, to: 1, a: 1, an: 1, on: 1, at: 1, by: 1, with: 1, vs: 1 };
  function titleCase(s) {
    return String(s).split(/\s+/).filter(Boolean).map(function (w, i) {
      var lw = w.toLowerCase();
      if (ACRO[lw]) return ACRO[lw];
      if (i > 0 && SMALL[lw]) return lw;
      return lw.charAt(0).toUpperCase() + lw.slice(1);
    }).join(' ');
  }
  /** "https://x.com/tools/gst-calculator/" -> "GST Calculator" */
  function slugTitle(u) {
    var url = httpUrl(u);
    if (!url) return '';
    var segs = url.pathname.split('/').filter(Boolean);
    if (!segs.length) return 'Home';
    var s = segs[segs.length - 1];
    try { s = decodeURIComponent(s); } catch (e) { /* keep raw */ }
    s = s.replace(/\.(?:html?|php|aspx?|jsp|cfm)$/i, '');
    if (/^(?:index|default)$/i.test(s)) {
      if (segs.length < 2) return 'Home';
      s = segs[segs.length - 2];
    }
    return titleCase(s.replace(/[-_+.]+/g, ' ').trim()) || 'Page';
  }
  function decodeXml(s) {
    return String(s).replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);/gi, function (m, e) {
      var map = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
      if (map[e.toLowerCase()]) return map[e.toLowerCase()];
      return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    });
  }
  /** URLs from pasted sitemap XML (<loc>) or any text. Never fetches anything. */
  function extractUrls(txt) {
    var urls = [], m;
    if (/<loc\b/i.test(txt)) {
      var re = /<loc\b[^>]*>\s*(?:<!\[CDATA\[)?\s*([\s\S]*?)\s*(?:\]\]>)?\s*<\/loc>/gi;
      while ((m = re.exec(txt))) urls.push(decodeXml(m[1]));
    } else {
      urls = (txt.match(/https?:\/\/[^\s<>"'`]+/gi) || []).map(function (u) { return u.replace(/[),.;:!?\]]+$/, ''); });
    }
    var seen = {};
    return urls.filter(function (u) {
      if (!httpUrl(u) || seen[u]) return false;
      seen[u] = 1;
      return true;
    });
  }
  function mdLinkText(s) { return oneLine(s).replace(/([\[\]])/g, '\\$1'); }
  function mdUrl(u) { return String(u).trim().replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29'); }

  /** Validate an llms.txt document; returns [[kind, html]]. */
  function validateLlms(txt, full) {
    var out = [], L = txt.split('\n');
    var h1 = L.filter(function (l) { return /^#\s/.test(l); });
    var firstLine = L.filter(function (l) { return l.trim(); })[0] || '';
    if (h1.length !== 1) out.push(['error', 'The file must have exactly <strong>one H1</strong> (a line starting with <code># </code>). Found ' + h1.length + '. Check that your details text does not start a line with “# ”.']);
    else if (!/^#\s/.test(firstLine)) out.push(['error', 'The H1 site name must be the first line of the file.']);
    if (!L.some(function (l) { return /^>\s?\S/.test(l); })) out.push(['warn', 'Add a <strong>summary</strong>. The proposal expects a <code>&gt;</code> blockquote with a short description right after the H1.']);
    var links = [], seen = {}, dups = [];
    L.forEach(function (l, i) {
      var m = l.match(/^- \[((?:\\.|[^\]])*)\]\(([^)]*)\)(?::\s*(.*))?$/);
      var src = full && l.match(/^URL:\s*(.*)$/);
      var u = m ? m[2] : src ? src[1].trim() : null;
      if (u == null) return;
      links.push(u);
      if (!u) out.push(['error', 'Line ' + (i + 1) + ': a link has no URL.']);
      else if (!httpUrl(u)) out.push(['error', 'Line ' + (i + 1) + ': <code>' + esc(u) + '</code> is not an absolute URL. Use the full address, e.g. https://www.example.com/page/']);
      else if (/^http:/i.test(u)) out.push(['warn', 'Line ' + (i + 1) + ': use https:// if your site supports it.']);
      if (m && !m[1].trim()) out.push(['error', 'Line ' + (i + 1) + ': a link has no title.']);
      if (u && seen[u]) dups.push(u);
      seen[u] = 1;
    });
    if (dups.length) out.push(['warn', 'Duplicate URLs: ' + dups.slice(0, 5).map(function (d) { return '<code>' + esc(d) + '</code>'; }).join(', ') + (dups.length > 5 ? '…' : '')]);
    var h2 = L.filter(function (l) { return /^##\s/.test(l); });
    if (!h2.length) out.push(['warn', 'Add at least one <code>## Section</code> with links to your most useful pages.']);
    var optIdx = h2.map(function (l) { return l.replace(/^##\s+/, '').trim().toLowerCase(); }).indexOf('optional');
    if (optIdx > -1 && optIdx !== h2.length - 1) out.push(['warn', 'Put the <strong>## Optional</strong> section last: tools may skip it when they need a shorter context.']);
    if (!links.length && h2.length) out.push(['warn', 'Your sections have no links yet.']);
    if (txt.length > 200000 && !full) out.push(['warn', 'This llms.txt is very long. Keep llms.txt concise and put full text in llms-full.txt.']);
    if (!out.some(function (m) { return m[0] === 'error'; })) out.unshift(['ok', 'Structure looks valid: one H1, ' + (h2.length ? plural(h2.length, 'section') : 'no sections') + ', ' + plural(links.length, 'link') + (links.length ? ', all absolute' : '') + '.']);
    return out;
  }

  impl('llms-txt-generator', function (root) {
    css();
    var KEY = 'geo-llms-v1';
    function newLink(t, u, d) { return { title: t || '', url: u || '', desc: d || '', body: '' }; }
    function blank() { return { name: '', summary: '', details: '', mode: 'llms', sections: [{ title: 'Docs', links: [newLink()] }, { title: 'Optional', links: [] }] }; }
    var S = lsGet(KEY, null);
    if (!S || !Array.isArray(S.sections)) S = blank();

    root.innerHTML = '<div class="split">' +
      '<div style="min-width:0">' +
      '<div class="card"><div class="card-title"><h2 class="geo-h">Site details</h2><div class="btn-group">' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div></div>' +
      field('ll-name', 'Site or project name', inp('ll-name', 'text', 'e.g. BISCS India'), 'Becomes the single <code>#</code> H1 line.') +
      field('ll-sum', 'One-paragraph summary', ta('ll-sum', 'What the site is, who it is for and what makes it useful, in one to three sentences.', 3, '', ' style="min-height:84px"'), 'Becomes the <code>&gt;</code> blockquote that AI tools read first.', true) +
      field('ll-det', 'Details (optional)', ta('ll-det', '- Key facts, terminology or rules an assistant should know\n- How the sections below are organised', 4, '', ' style="min-height:96px"'), 'Free text or bullet points. Do not use # or ## headings here.') +
      '</div>' +
      '<div class="card"><div class="card-title"><h2 class="geo-h">Sections &amp; links</h2>' + btn('data-a="addsec"', 'plus', 'Add section') + '</div>' +
      '<div id="ll-secs" class="geo-rows"></div>' +
      '<details class="geo-imp"><summary>' + BT.icon('link') + ' Import links from URLs or sitemap XML</summary>' +
      field('ll-imp', 'Paste URLs (one per line) or the contents of your sitemap.xml', ta('ll-imp', 'https://www.example.com/services/\nhttps://www.example.com/about/\n\nor paste <urlset>…<loc>…</loc>…</urlset>', 5, 'mono'), 'Parsed in your browser. Titles are made from the URL slug; edit them afterwards.') +
      '<div class="row cols-2">' + field('ll-imp-to', 'Add links to', '<select id="ll-imp-to"></select>') +
      '<div class="field" style="justify-content:flex-end">' + chk('ll-imp-grp', 'Group by first folder (/blog/, /tools/…)', false) + '</div></div>' +
      btn('data-a="import"', 'download', 'Import links', 'btn-primary') + '<span id="ll-imp-msg" class="muted small" style="margin-left:10px" aria-live="polite"></span>' +
      '</details>' +
      '</div>' +
      '</div>' +
      '<div style="min-width:0"><div class="card geo-sticky"><div class="card-title"><h2 class="geo-h" id="ll-out-h">llms.txt</h2>' +
      seg('ll-mode', [['llms', 'llms.txt'], ['full', 'llms-full.txt']], S.mode, 'File to generate') + '</div>' +
      '<div class="geo-toolbar">' + btn('data-a="copy"', 'copy', 'Copy', 'btn-primary') + btn('data-a="dl"', 'download', 'Download') + '<span class="spacer"></span><span class="geo-count" id="ll-stat"></span></div>' +
      '<label for="ll-out" class="sr-only">Generated file</label><textarea id="ll-out" class="mono geo-out wrap" readonly spellcheck="false"></textarea>' +
      '<div id="ll-msgs" class="geo-msgs" aria-live="polite"></div>' +
      '<div class="notice" style="margin-top:12px">' + BT.icon('info') + '<span><strong>Where to put it:</strong> upload the file to your site root so it opens at <code>https://yourdomain/llms.txt</code> (and <code>/llms-full.txt</code>), served as plain text. ' +
      '<strong>Be realistic:</strong> llms.txt is an emerging, voluntary proposal (llmstxt.org). Some AI tools and agents read it, but major search and AI providers have not committed to using it, and it is not a ranking factor or a guarantee of being cited. Treat it as a low-cost, helpful map of your best content.</span></div>' +
      '</div></div></div>';

    var secsBox = BT.$('#ll-secs', root), out = BT.$('#ll-out', root);
    ['name', 'summary', 'details'].forEach(function (k) { BT.$('#ll-' + { name: 'name', summary: 'sum', details: 'det' }[k], root).value = S[k] || ''; });

    function linkRow(si, li, l) {
      var id = 'll-' + si + '-' + li, n = S.sections[si].links.length;
      var d = ' data-s="' + si + '" data-l="' + li + '"';
      return '<div class="geo-link">' +
        '<div class="field"><label for="' + id + 't">Link title</label><input type="text" id="' + id + 't"' + d + ' data-k="title" value="' + esc(l.title) + '" placeholder="' + esc(slugTitle(l.url) || 'Page title') + '"></div>' +
        '<div class="field"><label for="' + id + 'u">URL</label><input type="url" id="' + id + 'u"' + d + ' data-k="url" value="' + esc(l.url) + '" placeholder="https://www.example.com/page/"></div>' +
        '<div class="geo-acts">' + upbtn('data-a="lup"' + d + (li === 0 ? ' disabled' : ''), 'Move link ' + (li + 1) + ' up') +
        ibtn('data-a="ldown"' + d + (li === n - 1 ? ' disabled' : ''), 'chevron-down', 'Move link ' + (li + 1) + ' down') +
        ibtn('data-a="ldel"' + d, 'trash-2', 'Remove link ' + (li + 1)) + '</div>' +
        '<div class="field geo-full"><label for="' + id + 'd">Short description (optional)</label><input type="text" id="' + id + 'd"' + d + ' data-k="desc" value="' + esc(l.desc) + '" placeholder="What an assistant will find on this page"></div>' +
        (S.mode === 'full' ? '<div class="field geo-full"><label for="' + id + 'b">Page content for llms-full.txt</label><textarea id="' + id + 'b"' + d + ' data-k="body" rows="3" style="min-height:80px" placeholder="Paste the page text or a detailed summary (Markdown is fine).">' + esc(l.body || '') + '</textarea></div>' : '') +
        '</div>';
    }
    function renderSecs() {
      var n = S.sections.length;
      secsBox.innerHTML = n ? S.sections.map(function (s, si) {
        var opt = s.title.trim().toLowerCase() === 'optional';
        return '<div class="geo-rowc"><div class="geo-rowh"><span>Section ' + (si + 1) + (opt ? ' · optional links' : '') + '</span><span class="geo-acts">' +
          upbtn('data-a="sup" data-s="' + si + '"' + (si === 0 ? ' disabled' : ''), 'Move section ' + (si + 1) + ' up') +
          ibtn('data-a="sdown" data-s="' + si + '"' + (si === n - 1 ? ' disabled' : ''), 'chevron-down', 'Move section ' + (si + 1) + ' down') +
          ibtn('data-a="sdel" data-s="' + si + '"', 'trash-2', 'Remove section ' + (si + 1)) + '</span></div>' +
          field('ll-st' + si, 'Section heading (## …)', '<input type="text" id="ll-st' + si + '" data-s="' + si + '" data-k="stitle" value="' + esc(s.title) + '" placeholder="e.g. Services, Docs, Guides, Optional">',
            opt ? 'Links under “Optional” are secondary and can be skipped when an AI needs a shorter context.' : '') +
          s.links.map(function (l, li) { return linkRow(si, li, l); }).join('') +
          btn('data-a="addlink" data-s="' + si + '"', 'plus', 'Add link', 'btn-ghost') + '</div>';
      }).join('') : '<p class="muted small" style="margin:0">No sections. Add one to list your key pages.</p>';
      var tgt = BT.$('#ll-imp-to', root), cur = tgt.value;
      tgt.innerHTML = S.sections.map(function (s, i) { return '<option value="' + i + '">' + esc(s.title || 'Section ' + (i + 1)) + '</option>'; }).join('') + '<option value="new">New section “Pages”</option>';
      if (cur && BT.$('option[value="' + cur + '"]', tgt)) tgt.value = cur;
      update();
    }

    function build() {
      var full = S.mode === 'full', L = [];
      L.push('# ' + (oneLine(S.name) || 'Your site name'), '');
      if (oneLine(S.summary)) L.push('> ' + oneLine(S.summary), '');
      if (S.details.trim()) L.push(S.details.trim(), '');
      S.sections.forEach(function (s) {
        var links = s.links.filter(function (l) { return l.url.trim() || l.title.trim(); });
        if (!s.title.trim() && !links.length) return;
        L.push('## ' + (oneLine(s.title) || 'Section'), '');
        links.forEach(function (l) {
          var title = oneLine(l.title) || slugTitle(l.url) || 'Untitled';
          if (full) {
            L.push('### ' + title, 'URL: ' + mdUrl(l.url), '');
            if (oneLine(l.desc)) L.push(oneLine(l.desc), '');
            L.push((l.body || '').trim() || '[Paste the full text or a detailed summary of this page here.]', '');
          } else {
            L.push('- [' + mdLinkText(title) + '](' + mdUrl(l.url) + ')' + (oneLine(l.desc) ? ': ' + oneLine(l.desc) : ''));
          }
        });
        if (!full) L.push('');
      });
      return L.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
    }
    var save = BT.debounce(function () { lsSet(KEY, S); }, 400);
    function update() {
      var txt = build();
      out.value = txt;
      BT.$('#ll-out-h', root).textContent = S.mode === 'full' ? 'llms-full.txt' : 'llms.txt';
      BT.$('#ll-stat', root).textContent = plural(txt.split('\n').length, 'line') + ' · ' + BT.fmtBytes(new Blob([txt]).size);
      var sum = oneLine(S.summary), c = BT.$('#ll-sum-c', root);
      c.innerHTML = sum ? sum.length + ' chars' + (sum.length > 400 ? ' <span class="badge warn">Long, keep it to a short paragraph</span>' : sum.length < 50 ? ' <span class="badge warn">A little short</span>' : ' <span class="badge ok">Good</span>') : '';
      var msgs = validateLlms(txt, S.mode === 'full');
      if (!oneLine(S.name)) msgs.unshift(['error', 'Enter your site or project name for the H1.']);
      if (/^#{1,6}\s/m.test(S.details)) msgs.push(['warn', 'Your details contain Markdown headings. A <code>#</code> line adds a second H1 and <code>##</code> starts a new section.']);
      if (S.mode === 'full') msgs.push(['', '<strong>llms-full.txt</strong> is a companion file containing the full text of your key pages in one Markdown document, so an assistant can read everything without following links. Fill in “Page content” under each link.']);
      BT.$('#ll-msgs', root).innerHTML = msgsHTML(msgs);
      save();
    }

    root.addEventListener('input', function (e) {
      var t = e.target;
      if (t.id === 'll-name') S.name = t.value;
      else if (t.id === 'll-sum') S.summary = t.value;
      else if (t.id === 'll-det') S.details = t.value;
      else if (t.hasAttribute('data-s') && t.getAttribute('data-k')) {
        var s = S.sections[+t.getAttribute('data-s')], k = t.getAttribute('data-k');
        if (!s) return;
        if (k === 'stitle') s.title = t.value;
        else s.links[+t.getAttribute('data-l')][k] = t.value;
        if (k === 'url') {
          var ti = BT.$('#ll-' + t.getAttribute('data-s') + '-' + t.getAttribute('data-l') + 't', root);
          if (ti) ti.placeholder = slugTitle(t.value) || 'Page title';
        }
      } else return;
      update();
    });
    wireSeg(BT.$('#ll-mode', root), function (v) { S.mode = v; renderSecs(); });
    function move(arr, i, d) { var j = i + d; if (j < 0 || j >= arr.length) return; var x = arr[i]; arr[i] = arr[j]; arr[j] = x; }
    function sIdx(b) { return +b.getAttribute('data-s'); }
    function lIdx(b) { return +b.getAttribute('data-l'); }
    function focusSel(sel) { var el = BT.$(sel, root); if (el) el.focus(); }
    onClickA(root, Object.assign({
      addsec: function () { S.sections.push({ title: '', links: [newLink()] }); renderSecs(); focusSel('#ll-st' + (S.sections.length - 1)); },
      sdel: function (b) {
        var s = S.sections[sIdx(b)];
        if (s.links.some(function (l) { return l.url || l.title; }) && !window.confirm('Remove this section and its ' + plural(s.links.length, 'link') + '?')) return;
        S.sections.splice(sIdx(b), 1); renderSecs();
      },
      sup: function (b) { move(S.sections, sIdx(b), -1); renderSecs(); },
      sdown: function (b) { move(S.sections, sIdx(b), 1); renderSecs(); },
      addlink: function (b) { var s = S.sections[sIdx(b)]; s.links.push(newLink()); renderSecs(); focusSel('#ll-' + sIdx(b) + '-' + (s.links.length - 1) + 't'); },
      ldel: function (b) { S.sections[sIdx(b)].links.splice(lIdx(b), 1); renderSecs(); },
      lup: function (b) { move(S.sections[sIdx(b)].links, lIdx(b), -1); renderSecs(); },
      ldown: function (b) { move(S.sections[sIdx(b)].links, lIdx(b), 1); renderSecs(); },
      import: function () {
        var urls = extractUrls(BT.$('#ll-imp', root).value), msg = BT.$('#ll-imp-msg', root);
        if (!urls.length) { msg.textContent = 'No absolute http(s) URLs found.'; return; }
        var existing = {};
        S.sections.forEach(function (s) { s.links.forEach(function (l) { if (l.url) existing[l.url.trim()] = 1; }); });
        var fresh = urls.filter(function (u) { return !existing[u]; });
        var capped = fresh.length > 500;
        fresh = fresh.slice(0, 500);
        var to = BT.$('#ll-imp-to', root).value;
        function target(title) {
          for (var i = 0; i < S.sections.length; i++) if (S.sections[i].title.trim().toLowerCase() === title.toLowerCase()) return S.sections[i];
          var s = { title: title, links: [] };
          var opt = S.sections.findIndex(function (x) { return x.title.trim().toLowerCase() === 'optional'; });
          if (opt > -1) S.sections.splice(opt, 0, s); else S.sections.push(s);
          return s;
        }
        fresh.forEach(function (u) {
          var sec;
          if (BT.$('#ll-imp-grp', root).checked) {
            var seg0 = httpUrl(u).pathname.split('/').filter(Boolean);
            sec = target(seg0.length > 1 ? titleCase(decodeURIComponent(seg0[0]).replace(/[-_]+/g, ' ')) : 'Pages');
          } else sec = to === 'new' ? target('Pages') : S.sections[+to];
          sec.links = sec.links.filter(function (l) { return l.url.trim() || l.title.trim(); });
          sec.links.push(newLink(slugTitle(u), u, ''));
        });
        renderSecs();
        msg.textContent = 'Imported ' + plural(fresh.length, 'link') + (urls.length - fresh.length > 0 && !capped ? ' (' + (urls.length - fresh.length) + ' already listed)' : '') + (capped ? ' (first 500 only; llms.txt should list your key pages, not every URL)' : '') + '.';
        BT.toast('Imported ' + plural(fresh.length, 'link'));
      },
      sample: function () {
        var B = 'https://www.biscsindia.com/';
        S = {
          name: 'BISCS India', mode: S.mode,
          summary: 'BISCS India is a technology company based in Kolkata, India. Its BISCS Tools website offers free, browser-based tools for PDFs, GST and income-tax calculations, images, text, SEO and developers; files are processed on the user’s device and never uploaded.',
          details: '- All tools are free, need no sign-up and work on mobile phones.\n- Calculators follow Indian rules and formats (INR, lakh/crore, GST slabs, new and old tax regimes).\n- Contact: info@biscsindia.com',
          sections: [
            { title: 'Tools', links: [
              newLink('PDF Editor', B + 'tools/pdf-editor/', 'Edit, annotate and sign PDF files in the browser'),
              newLink('GST Calculator', B + 'tools/gst-calculator/', 'Add or remove GST and see the CGST, SGST and IGST split'),
              newLink('Income Tax Calculator', B + 'tools/income-tax-calculator/', 'Compare the old and new tax regimes for India'),
              newLink('EMI Calculator', B + 'tools/emi-calculator/', 'Loan EMI, total interest and amortisation schedule')] },
            { title: 'Company', links: [
              newLink('About BISCS India', B + 'about/', 'Who we are and how the tools protect privacy'),
              newLink('Contact', B + 'contact/', 'Email and office address in Kolkata')] },
            { title: 'Optional', links: [
              newLink('Privacy Policy', B + 'privacy/', ''),
              newLink('Terms of Use', B + 'terms/', '')] }
          ]
        };
        BT.$('#ll-name', root).value = S.name; BT.$('#ll-sum', root).value = S.summary; BT.$('#ll-det', root).value = S.details;
        renderSecs();
      },
      clear: function () {
        if (!window.confirm('Clear the whole llms.txt draft?')) return;
        var m = S.mode; S = blank(); S.mode = m;
        BT.$('#ll-name', root).value = ''; BT.$('#ll-sum', root).value = ''; BT.$('#ll-det', root).value = '';
        renderSecs();
      }
    }, wireCopyDl(root, function () { return out.value; }, function () { return S.mode === 'full' ? 'llms-full.txt' : 'llms.txt'; }, 'text/plain;charset=utf-8')));
    renderSecs();
  });

  // ====================================================== ai-crawler-checker
  // [token, operator, purpose, description]
  var AI_BOT_LIST = [
    ['GPTBot', 'OpenAI', 'training', 'OpenAI’s crawler for content that may be used to train its generative AI models. Blocking it is OpenAI’s documented way to opt out of training; it does not remove you from ChatGPT search.'],
    ['OAI-SearchBot', 'OpenAI', 'search', 'Finds and indexes pages so they can appear (and be linked) in ChatGPT’s search answers. OpenAI says it is not used for model training.'],
    ['ChatGPT-User', 'OpenAI', 'user', 'Visits a page when a ChatGPT user or a custom GPT asks it to. These requests are user-initiated, and OpenAI notes robots.txt may not apply to them the same way as to automatic crawlers.'],
    ['ClaudeBot', 'Anthropic', 'training', 'Anthropic’s crawler for public web content that may be used to train and improve Claude models.'],
    ['Claude-User', 'Anthropic', 'user', 'Fetches a page when a Claude user asks a question that needs it. User-initiated, not bulk crawling.'],
    ['Claude-SearchBot', 'Anthropic', 'search', 'Crawls to improve the quality and relevance of search results used in Claude’s answers.'],
    ['anthropic-ai', 'Anthropic', 'training', 'An older Anthropic token still found in many block lists. Anthropic’s current documentation lists ClaudeBot, Claude-User and Claude-SearchBot, so rely on those.'],
    ['PerplexityBot', 'Perplexity', 'search', 'Indexes sites so they can be surfaced and cited in Perplexity’s answers. Perplexity says it is not used to train foundation models.'],
    ['Perplexity-User', 'Perplexity', 'user', 'Fetches pages in real time when a Perplexity user asks a question. Perplexity states these user-requested fetches generally do not follow robots.txt.'],
    ['Google-Extended', 'Google', 'control', 'Not a separate crawler: a control token read by Google’s crawlers. It decides whether content Google crawls may be used for Gemini model training and grounding. It does not affect Google Search ranking or inclusion, including AI Overviews.'],
    ['Googlebot', 'Google', 'engine', 'Google Search’s main crawler. Google’s AI Overviews and AI Mode are part of Search and use Googlebot’s index, so blocking it removes you from Google Search entirely.'],
    ['Bingbot', 'Microsoft', 'engine', 'Bing Search crawler. Bing’s index also powers Microsoft Copilot answers and is used by several other search and AI services.'],
    ['Applebot', 'Apple', 'engine', 'Powers search features in Siri, Spotlight and Safari suggestions.'],
    ['Applebot-Extended', 'Apple', 'control', 'A control token, not a crawler: it lets you opt out of content crawled by Applebot being used to train Apple’s generative AI models. It does not remove you from Siri or Spotlight.'],
    ['CCBot', 'Common Crawl', 'training', 'Builds Common Crawl’s free, open web archive, which is widely used by researchers and AI companies as training data.'],
    ['Bytespider', 'ByteDance', 'training', 'ByteDance (TikTok’s parent) crawler, reported to collect data for its AI models. Some site owners report that it does not always respect robots.txt, so consider server-level blocking too.'],
    ['Meta-ExternalAgent', 'Meta', 'training', 'Meta’s crawler for use cases such as training AI models or improving products by indexing content directly.'],
    ['Amazonbot', 'Amazon', 'search', 'Used to improve Amazon products and services, for example answers in Alexa. Amazon says the data may also be used to train its AI models.'],
    ['DuckAssistBot', 'DuckDuckGo', 'search', 'Fetches pages in real time to write DuckAssist AI answers with sources. DuckDuckGo says the data is not used to train AI models.'],
    ['cohere-ai', 'Cohere', 'training', 'A token associated with Cohere, the enterprise AI company. Its crawling is not well documented; many sites list it in AI-training block lists as a precaution.'],
    ['YouBot', 'You.com', 'search', 'Crawler for You.com’s AI search and assistant answers.']
  ];
  var PURPOSE = { training: 'AI training', search: 'AI search / answers', user: 'User-initiated fetch', engine: 'Search engine', control: 'Control token' };

  /** Parse robots.txt into groups (RFC 9309). */
  function parseRobots(txt) {
    var groups = [], cur = null, lastUA = false, warnings = [], sitemaps = [];
    String(txt || '').split(/\r\n|\r|\n/).forEach(function (raw, i) {
      var ln = i + 1, line = raw.replace(/#.*$/, '').trim();
      if (!line) return;
      var m = line.match(/^([A-Za-z][A-Za-z_-]*)\s*:\s*(.*)$/);
      if (!m) { warnings.push(['warn', 'Line ' + ln + ': not a valid “field: value” line, ignored: <code>' + esc(line.slice(0, 80)) + '</code>']); return; }
      var key = m[1].toLowerCase(), v = m[2].trim();
      if (key === 'user-agent') {
        if (!cur || !lastUA) { cur = { uas: [], rules: [], line: ln }; groups.push(cur); }
        cur.uas.push({ name: v, token: v.split('/')[0].trim().toLowerCase(), line: ln });
        lastUA = true;
      } else if (key === 'allow' || key === 'disallow') {
        lastUA = false;
        if (!cur) { warnings.push(['warn', 'Line ' + ln + ': <code>' + esc(m[1]) + '</code> appears before any User-agent line, so crawlers ignore it.']); return; }
        cur.rules.push({ type: key, path: v, line: ln });
      } else if (key === 'sitemap') {
        sitemaps.push(v);
      } else if (key === 'crawl-delay') {
        lastUA = false;
        if (cur) cur.delay = v;
      } else if (/^(?:useragent|user_agent|user agent|dissallow|disalow|dis-allow)$/.test(key)) {
        warnings.push(['error', 'Line ' + ln + ': <code>' + esc(m[1]) + '</code> looks like a typo. Use <code>User-agent</code>, <code>Allow</code> or <code>Disallow</code>.']);
      } else if (key !== 'host' && key !== 'clean-param' && key !== 'noindex' && key !== 'content-signal') {
        warnings.push(['', 'Line ' + ln + ': <code>' + esc(m[1]) + '</code> is not a standard robots.txt rule and most crawlers ignore it.']);
      } else if (key === 'noindex') {
        warnings.push(['warn', 'Line ' + ln + ': <code>Noindex</code> in robots.txt is not supported by Google (since 2019). Use a noindex meta tag instead.']);
      }
    });
    groups.forEach(function (g) {
      if (!g.rules.length && g.uas.length) g.empty = true;
    });
    return { groups: groups, warnings: warnings, sitemaps: sitemaps };
  }
  function normPath(p) {
    p = String(p || '');
    p = p.replace(/[^\x21-\x7e]+/g, function (s) { try { return encodeURIComponent(s); } catch (e) { return s; } });
    return p.replace(/%([0-9a-f]{2})/gi, function (m, h) {
      var c = String.fromCharCode(parseInt(h, 16));
      return /[A-Za-z0-9\-._~]/.test(c) ? c : '%' + h.toUpperCase();
    });
  }
  var patCache = {};
  function patRe(p) {
    if (patCache[p]) return patCache[p];
    var anchored = /\$$/.test(p), body = anchored ? p.slice(0, -1) : p;
    return (patCache[p] = new RegExp('^' + body.split('*').map(reEsc).join('.*') + (anchored ? '$' : '')));
  }
  /** Is `path` allowed for user-agent `token`? Longest match wins; Allow wins ties. */
  function robotsDecide(parsed, token, path) {
    token = String(token).toLowerCase();
    path = normPath(path);
    var matched = parsed.groups.filter(function (g) { return g.uas.some(function (u) { return u.token === token; }); });
    var via = 'specific';
    if (!matched.length) { matched = parsed.groups.filter(function (g) { return g.uas.some(function (u) { return u.token === '*'; }); }); via = 'star'; }
    if (!matched.length) return { allowed: true, via: 'none', groups: [], rule: null };
    var best = null;
    matched.forEach(function (g) {
      g.rules.forEach(function (r) {
        var p = normPath(r.path);
        if (!p || !patRe(p).test(path)) return;
        if (!best || p.length > best.len || (p.length === best.len && r.type === 'allow' && best.r.type === 'disallow')) best = { r: r, len: p.length };
      });
    });
    if (path === '/robots.txt') return { allowed: true, via: via, groups: matched, rule: null, robots: true };
    return { allowed: !best || best.r.type === 'allow', via: via, groups: matched, rule: best && best.r };
  }
  function pathOf(input) {
    var s = String(input || '').trim() || '/';
    var u = httpUrl(s);
    if (u) return u.pathname + u.search;
    return s.charAt(0) === '/' || s.charAt(0) === '*' ? s : '/' + s;
  }

  impl('ai-crawler-checker', function (root) {
    css();
    var choice = {};
    root.innerHTML = '<div class="card"><div class="geo-toolbar"><label for="ac-in" class="geo-inl" style="margin-right:auto">robots.txt content</label>' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      ta('ac-in', 'Paste your robots.txt here. Open https://yourdomain/robots.txt in your browser, select all and copy.', 10, 'mono', ' spellcheck="false" style="min-height:200px"') +
      '<div class="row cols-2" style="margin-top:14px">' +
      field('ac-path', 'Path or URL to test', inp('ac-path', 'text', '/', '/'), 'For example <code>/blog/my-post/</code> or a full URL.') +
      field('ac-custom', 'Also test another user-agent (optional)', inp('ac-custom', 'text', 'e.g. Diffbot')) + '</div>' +
      '<p class="muted small" style="margin:0">Parsed in your browser using the robots.txt standard (RFC 9309): user-agent matching is case-insensitive, the most specific (longest) matching rule wins, <code>Allow</code> wins a tie, and <code>*</code> / <code>$</code> wildcards are supported. Nothing is fetched.</p></div>' +
      '<div id="ac-res"></div>' +
      '<div class="card"><div class="card-title"><h2 class="geo-h">Generate AI bot rules</h2><div class="btn-group">' +
      btn('data-a="preset" data-p="train"', 'shield-check', 'Block training, allow search') + btn('data-a="preset" data-p="all"', 'shield', 'Block all AI') +
      btn('data-a="preset" data-p="allow"', 'check', 'Allow all AI') + btn('data-a="preset" data-p="none"', 'rotate-ccw', 'Reset', 'btn-ghost') + '</div></div>' +
      '<p class="muted small" style="margin-top:0">Choose a rule for each bot. Bots set to “No rule” keep following your <code>User-agent: *</code> group.</p>' +
      '<div class="geo-bots" id="ac-bots">' + AI_BOT_LIST.map(function (b, i) {
        return '<div class="geo-bot"><label for="ac-b' + i + '">' + esc(b[0]) + ' <span class="muted small">' + esc(b[1]) + '</span></label>' +
          sel('ac-b' + i, [['', 'No rule'], ['allow', 'Allow'], ['block', 'Block']], '', ' data-bot="' + esc(b[0]) + '"') + '</div>';
      }).join('') + '</div>' +
      '<div class="row cols-2" style="margin-top:14px">' + field('ac-gpath', 'Block path', inp('ac-gpath', 'text', '/', '/'), 'Use <code>/</code> for the whole site, or e.g. <code>/premium/</code>.') +
      '<div class="field" style="justify-content:flex-end">' + chk('ac-copy', 'Copy my <code>User-agent: *</code> Disallow rules into “Allow” groups', true) + '</div></div>' +
      '<div class="geo-toolbar">' + btn('data-a="gcopy"', 'copy', 'Copy rules', 'btn-primary') + btn('data-a="gapply"', 'arrow-right', 'Add to robots.txt above &amp; re-test') + '</div>' +
      '<label for="ac-gout" class="sr-only">Generated robots.txt rules</label><textarea id="ac-gout" class="mono geo-out" style="min-height:180px" readonly spellcheck="false"></textarea>' +
      '<div id="ac-gmsg" class="geo-msgs" aria-live="polite"></div></div>' +
      '<div class="card"><h2 class="geo-h" style="margin-bottom:12px">What each bot does</h2><dl class="geo-dl">' + AI_BOT_LIST.map(function (b) {
        return '<div><dt>' + esc(b[0]) + ' <span class="geo-p ' + b[2] + '">' + PURPOSE[b[2]] + '</span></dt><dd><strong>' + esc(b[1]) + '.</strong> ' + esc(b[3]) + '</dd></div>';
      }).join('') + '</dl><p class="muted small" style="margin:12px 0 0">Descriptions summarise each operator’s public documentation at the time of writing and may change. robots.txt is voluntary: reputable crawlers follow it, but it is not access control. To enforce a block, use your server or CDN firewall.</p></div>';

    var input = BT.$('#ac-in', root), res = BT.$('#ac-res', root), gout = BT.$('#ac-gout', root);
    var parsed = parseRobots('');

    function run() {
      parsed = parseRobots(input.value);
      var path = pathOf(val(root, 'ac-path'));
      var bots = AI_BOT_LIST.slice();
      var custom = val(root, 'ac-custom').split('/')[0].trim();
      if (custom) bots.push([custom, 'Custom', '', 'Your custom user-agent token.']);
      if (!input.value.trim()) {
        res.innerHTML = '<div class="card"><div class="notice">' + BT.icon('info') + '<span>No robots.txt pasted: with no file (or an empty one), every crawler is allowed everywhere. Paste your file above or try the sample.</span></div></div>';
        gen();
        return;
      }
      var rows = bots.map(function (b) { var d = robotsDecide(parsed, b[0], path); d.bot = b; return d; });
      var blocked = rows.filter(function (r) { return !r.allowed; });
      var trainBlocked = rows.filter(function (r) { return r.bot[2] === 'training' && !r.allowed; }).length;
      var trainTotal = rows.filter(function (r) { return r.bot[2] === 'training'; }).length;
      var searchAllowed = rows.filter(function (r) { return (r.bot[2] === 'search' || r.bot[2] === 'engine') && r.allowed; }).length;
      var searchTotal = rows.filter(function (r) { return r.bot[2] === 'search' || r.bot[2] === 'engine'; }).length;
      function why(r) {
        var g = r.via === 'specific' ? 'Own group' : r.via === 'star' ? 'Falls back to <code>*</code> group' : 'No group applies';
        var lineNos = r.groups.map(function (x) { return x.line; });
        if (r.groups.length) g += ' (line ' + lineNos.join(', ') + ')';
        var rule = r.robots ? '/robots.txt is always allowed' : r.rule ? '<span class="geo-mono">' + (r.rule.type === 'allow' ? 'Allow' : 'Disallow') + ': ' + esc(r.rule.path) + '</span> <span class="muted">· line ' + r.rule.line + '</span>' : '<span class="muted">No matching rule → allowed by default</span>';
        return g + '<br>' + rule;
      }
      var gwarn = [];
      if (rows.some(function (r) { return r.bot[0] === 'Googlebot' && !r.allowed; })) gwarn.push(['error', '<strong>Googlebot is blocked</strong> for this path. That removes it from Google Search, including AI Overviews. To opt out of Gemini training only, block <code>Google-Extended</code> instead.']);
      if (rows.some(function (r) { return r.bot[0] === 'Bingbot' && !r.allowed; })) gwarn.push(['warn', 'Bingbot is blocked: this also limits visibility in Bing, Copilot and services that use Bing’s index.']);
      parsed.groups.forEach(function (g) { if (g.empty) gwarn.push(['', 'The group starting on line ' + g.line + ' (' + g.uas.map(function (u) { return '<code>' + esc(u.name) + '</code>'; }).join(', ') + ') has no Allow/Disallow rules, so those bots are allowed everywhere.']); });
      res.innerHTML = '<div class="card"><div class="card-title"><h2 class="geo-h">Results for <span class="geo-tag">' + esc(path) + '</span></h2><span class="muted small">' + plural(parsed.groups.length, 'group') + ' parsed</span></div>' +
        '<div class="stats" style="margin-bottom:14px">' +
        '<div class="stat"><div class="label">Blocked bots</div><div class="value">' + blocked.length + ' / ' + rows.length + '</div></div>' +
        '<div class="stat"><div class="label">Training bots blocked</div><div class="value">' + trainBlocked + ' / ' + trainTotal + '</div></div>' +
        '<div class="stat"><div class="label">Search &amp; answer bots allowed</div><div class="value">' + searchAllowed + ' / ' + searchTotal + '</div></div></div>' +
        '<div id="ac-gw" class="geo-msgs" style="margin:0 0 12px">' + msgsHTML(gwarn.concat(parsed.warnings)) + '</div>' +
        '<div class="table-wrap"><table class="table"><thead><tr><th scope="col">Bot</th><th scope="col">Used for</th><th scope="col">Result</th><th scope="col">Why</th></tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><td><strong>' + esc(r.bot[0]) + '</strong><br><span class="muted small">' + esc(r.bot[1]) + '</span></td>' +
            '<td>' + (r.bot[2] ? '<span class="geo-p ' + r.bot[2] + '">' + PURPOSE[r.bot[2]] + '</span>' : '<span class="muted">—</span>') + '</td>' +
            '<td>' + (r.allowed ? '<span class="geo-st ok">' + BT.icon('check') + 'Allowed</span>' : '<span class="geo-st no">' + BT.icon('x') + 'Blocked</span>') + '</td>' +
            '<td class="geo-wrapc small">' + why(r) + '</td></tr>';
        }).join('') + '</tbody></table></div></div>';
      gen();
    }

    function starDisallows() {
      var out = [];
      parsed.groups.forEach(function (g) {
        if (!g.uas.some(function (u) { return u.token === '*'; })) return;
        g.rules.forEach(function (r) { if (r.type === 'disallow' && r.path && r.path !== '/') out.push('Disallow: ' + r.path); });
      });
      return out.filter(function (x, i, a) { return a.indexOf(x) === i; });
    }
    function gen() {
      var blockL = [], allowL = [], msgs = [];
      AI_BOT_LIST.forEach(function (b) { if (choice[b[0]] === 'block') blockL.push(b[0]); else if (choice[b[0]] === 'allow') allowL.push(b[0]); });
      var gp = val(root, 'ac-gpath') || '/';
      if (gp.charAt(0) !== '/' && gp.charAt(0) !== '*') gp = '/' + gp;
      var L = [];
      if (blockL.length) {
        L.push('# Block these AI bots' + (gp === '/' ? '' : ' from ' + gp));
        blockL.forEach(function (b) { L.push('User-agent: ' + b); });
        L.push('Disallow: ' + gp, '');
      }
      if (allowL.length) {
        L.push('# Allow these AI search / answer bots');
        allowL.forEach(function (b) { L.push('User-agent: ' + b); });
        L.push('Allow: /');
        if (val(root, 'ac-copy')) starDisallows().forEach(function (d) { L.push(d); });
        L.push('');
      }
      gout.value = L.join('\n');
      if (!blockL.length && !allowL.length) msgs.push(['', 'Pick Allow or Block for some bots, or use a preset above.']);
      if (allowL.length || blockL.length) msgs.push(['', 'A bot that has its own group ignores your <code>User-agent: *</code> group completely, so repeat any important Disallow lines (admin, cart, search pages) in its group.']);
      if (blockL.indexOf('Googlebot') > -1) msgs.push(['error', 'You are blocking Googlebot: your site would disappear from Google Search.']);
      var existing = {};
      parsed.groups.forEach(function (g) { g.uas.forEach(function (u) { existing[u.token] = g.line; }); });
      var clash = blockL.concat(allowL).filter(function (b) { return existing[b.toLowerCase()]; });
      if (clash.length) msgs.push(['warn', 'Your robots.txt already has groups for ' + clash.map(function (c) { return '<code>' + esc(c) + '</code>'; }).join(', ') + '. Crawlers combine duplicate groups, so remove the old ones to avoid conflicting rules.']);
      BT.$('#ac-gmsg', root).innerHTML = msgsHTML(msgs);
    }
    function setChoices(fn) {
      AI_BOT_LIST.forEach(function (b, i) { var v = fn(b); choice[b[0]] = v; BT.$('#ac-b' + i, root).value = v; });
      gen();
    }

    var deb = BT.debounce(run, 200);
    input.addEventListener('input', deb);
    BT.$('#ac-path', root).addEventListener('input', deb);
    BT.$('#ac-custom', root).addEventListener('input', deb);
    BT.$('#ac-gpath', root).addEventListener('input', gen);
    BT.$('#ac-copy', root).addEventListener('change', gen);
    BT.$('#ac-bots', root).addEventListener('change', function (e) { var b = e.target.getAttribute('data-bot'); if (b) { choice[b] = e.target.value; gen(); } });
    onClickA(root, {
      sample: function () {
        input.value = '# Example robots.txt\nUser-agent: *\nDisallow: /admin/\nDisallow: /search\nAllow: /admin/help/\nDisallow: /*.pdf$\n\n# AI training crawlers\nUser-agent: GPTBot\nUser-agent: CCBot\nUser-agent: Google-Extended\nDisallow: /\n\nUser-agent: PerplexityBot\nAllow: /\nDisallow: /drafts/\n\nSitemap: https://www.example.com/sitemap.xml\n';
        run();
      },
      clear: function () { input.value = ''; run(); input.focus(); },
      preset: function (b) {
        var p = b.getAttribute('data-p');
        setChoices(function (bot) {
          if (p === 'none') return '';
          if (p === 'allow') return bot[2] === 'engine' ? '' : 'allow';
          if (p === 'all') return bot[2] === 'engine' ? '' : 'block';
          return bot[2] === 'training' || bot[2] === 'control' ? 'block' : bot[2] === 'engine' ? '' : 'allow';
        });
      },
      gcopy: function () { if (!gout.value.trim()) { BT.toast('Choose some rules first', 'error'); return; } BT.copy(gout.value, 'Rules copied'); },
      gapply: function () {
        if (!gout.value.trim()) { BT.toast('Choose some rules first', 'error'); return; }
        input.value = input.value.replace(/\s*$/, '') + (input.value.trim() ? '\n\n' : '') + gout.value;
        run();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        BT.toast('Rules added and re-tested');
      }
    });
    run();
  });

  // ==================================================== geo-content-analyzer
  var STAT_RE = /(?:[₹$€£]\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:lakh|crore|million|billion|cr|bn|k)\b)?|\b(?:rs\.?|inr|usd)\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:lakh|crore|million|billion)\b)?|\b\d[\d,]*(?:\.\d+)?\s?(?:%|percent\b|per cent\b|(?:lakhs?|crores?|million|billion|thousand|km|kg|mg|ml|cm|mm|hours?|hrs?|minutes?|mins?|seconds?|days?|weeks?|months?|years?|times|users|people|customers|clients|students|companies|businesses|websites|pages|visitors|gb|mb|tb|kwh|mw|rupees|sq\.? ?ft|acres?|x)\b))/gi;
  var CITE_RE = /\baccording to\b|\bsources?:|\bcited\b|\bstud(?:y|ies)\b|\bsurvey(?:ed)?\b|\breport(?:ed)? by\b|\bresearch (?:by|from|shows?)\b|\bpublished (?:by|in)\b|\bdata from\b|\bas per\b|\bfound that\b|\bstatistics from\b|\bstates that\b|\bguidelines?\b/gi;
  var QUOTE_RE = /[“"]([^”"\n]{20,400})[”"]/g;
  var DEF_RE = /^\s*(?:[^\s.!?]+\s+){0,10}?(?:is|are|was|refers to|means|stands for|is defined as|describes|is called|is known as)\s+\S/i;
  var Q_HEAD = /\?\s*$|^(?:what|why|how|when|where|who|which|can|is|are|does|do|should|will)\b/i;
  var BYLINE_RE = /\b(?:written|reviewed|edited|fact[- ]checked|authored|updated|verified)\s+by\b|(?:^|\n)\s*by\s+(?:dr\.?\s+|ca\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z.]+){0,3}|\bauthor\s*:/i;
  var CRED_RE = /\b(?:CA|CS|CFA|CPA|MBBS|MD|PhD|Ph\.D|Dr\.|MBA|LLB|B\.Tech|M\.Tech|certified|chartered|licensed|registered|years? of experience|years? experience|founder|specialist|expert in|professor|consultant)\b/;

  function geoExtract(raw) {
    var r = { isHtml: looksHtml(raw), headings: [], lists: 0, tables: 0, links: 0, ext: 0, quotesEl: 0, text: '', faqSchema: false, metaAuthor: '', time: '' };
    if (r.isHtml) {
      var d = htmlDoc(raw);
      BT.$$('script[type="application/ld+json"]', d).forEach(function (s) {
        var t = s.textContent || '';
        if (/"FAQPage"/.test(t)) r.faqSchema = true;
        if (/"author"/.test(t)) r.schemaAuthor = true;
        var m = t.match(/"date(?:Modified|Published)"\s*:\s*"([^"]+)"/);
        if (m && !r.time) r.time = m[1];
      });
      var ma = d.querySelector('meta[name="author"]');
      r.metaAuthor = ma ? ma.getAttribute('content') || '' : '';
      var mt = d.querySelector('meta[property="article:modified_time"],meta[property="article:published_time"],time[datetime]');
      if (mt && !r.time) r.time = mt.getAttribute('content') || mt.getAttribute('datetime') || '';
      BT.$$('script,style,noscript,template,svg,iframe,nav,aside,form', d).forEach(function (e) { e.remove(); });
      var main = d.querySelector('article') || d.querySelector('main') || d.body;
      BT.$$('footer', main).forEach(function (e) { e.remove(); });
      r.headings = BT.$$('h1,h2,h3,h4,h5,h6', main).map(function (h) { return { level: +h.tagName[1], text: oneLine(h.textContent) }; }).filter(function (h) { return h.text; });
      r.lists = BT.$$('ul,ol,dl', main).filter(function (l) { return BT.$$('li,dt', l).length >= 2; }).length;
      r.tables = BT.$$('table', main).filter(function (t) { return BT.$$('tr', t).length >= 2; }).length;
      var as = BT.$$('a[href]', main);
      r.links = as.length;
      r.ext = as.filter(function (a) { return /^https?:\/\//i.test(a.getAttribute('href')); }).length;
      r.quotesEl = BT.$$('blockquote,q', main).length;
      r.relAuthor = !!main.querySelector('[rel~="author"],[itemprop="author"],.author,.byline');
      r.bodyParas = BT.$$('p', main).map(function (p) { return oneLine(p.textContent); }).filter(function (t) { return wordsOf(t).length >= 3; });
      r.text = blockText(main);
    } else {
      var md = String(raw);
      var L = md.split(/\r?\n/), paras = [], listLines = 0, tableLines = 0;
      L.forEach(function (l, i) {
        var t = l.trim();
        if (!t) return;
        var hm = t.match(/^(#{1,6})\s+(.*)$/);
        var next = (L[i + 1] || '').trim(), prevBlank = i === 0 || !(L[i - 1] || '').trim();
        if (hm) { r.headings.push({ level: hm[1].length, text: hm[2].replace(/[*_`]/g, '') }); return; }
        if (/^\s*(?:[-*•▪◦]|\d+[.)])\s+/.test(l)) { listLines++; return; }
        if ((t.match(/\|/g) || []).length >= 2) { tableLines++; return; }
        var wc = wordsOf(t).length;
        if (wc <= 14 && !/[.!:;,]$/.test(t) && next && (prevBlank || i === 0 || /\?$/.test(t))) { r.headings.push({ level: i === 0 ? 1 : 2, text: t, guessed: true }); return; }
        paras.push(t.replace(/[*_`]/g, ''));
      });
      r.lists = listLines >= 3 ? Math.max(1, Math.round(listLines / 4)) : 0;
      r.listLines = listLines;
      r.tables = tableLines >= 2 ? 1 : 0;
      var urls = md.match(/https?:\/\/[^\s)>\]]+/g) || [];
      r.links = r.ext = urls.length;
      r.bodyParas = paras;
      r.text = md.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`#>]/g, '');
    }
    return r;
  }

  function geoAnalyze(raw, topic) {
    var x = geoExtract(raw), A = analyse(x.text), checks = [];
    var paras = x.bodyParas && x.bodyParas.length ? x.bodyParas : A.paragraphs.map(function (p) { return p.text; });
    var allText = x.text, W = A.words;
    function add(id, name, weight, status, detail, tip) { checks.push({ id: id, name: name, weight: weight, status: status, detail: detail, tip: tip }); }
    var topicL = String(topic || '').trim().toLowerCase();

    // 1. Direct answer near the top
    var introWords = 0, intro = [], defSent = null, firstPara = paras[0] || '';
    for (var pi = 0; pi < paras.length && introWords < 80; pi++) {
      splitSentences(paras[pi]).forEach(function (s) {
        if (introWords >= 80) return;
        intro.push(s);
        introWords += wordsOf(s).length;
      });
    }
    intro.some(function (s) {
      if (DEF_RE.test(s) && wordsOf(s).length >= 5) { defSent = s.trim(); return true; }
      return false;
    });
    var defHasTopic = defSent && topicL && defSent.toLowerCase().indexOf(topicL) > -1;
    add('direct', 'Direct answer or summary in the first 80 words', 12,
      defSent ? (topicL && !defHasTopic ? 'warn' : 'pass') : intro.length ? 'fail' : 'fail',
      defSent ? 'Found a definition-style sentence: “' + esc(defSent.slice(0, 220)) + '”' + (topicL && !defHasTopic ? ' — but it does not name your topic “' + esc(topic) + '”.' : '')
        : 'No “X is …” style sentence near the top. AI answer engines tend to lift a crisp, self-contained answer from the opening lines.',
      'Open with one or two sentences that answer the main question directly, naming the subject: “' + esc(topic || 'Your topic') + ' is … that …”. Put background after it.');

    // 2. Question headings
    var qh = x.headings.filter(function (h) { return h.level > 1 && Q_HEAD.test(h.text); });
    var subs = x.headings.filter(function (h) { return h.level > 1; });
    add('qhead', 'Question-style subheadings', 8,
      qh.length >= 2 ? 'pass' : qh.length === 1 || subs.length >= 2 ? 'warn' : 'fail',
      subs.length ? plural(subs.length, 'subheading') + ', ' + qh.length + ' phrased as questions' + (qh.length ? ': ' + qh.slice(0, 3).map(function (h) { return '“' + esc(h.text) + '”'; }).join(', ') : '.') : 'No subheadings found' + (x.isHtml ? ' (h2–h6).' : '. In plain text, use Markdown “## ” headings or short lines on their own.'),
      'Phrase some H2/H3s the way people ask (“How much does … cost?”, “What is the difference between … ?”) and answer each one in the first sentence below it.');

    // 3. Lists / tables
    var struct = x.lists + x.tables;
    add('struct', 'Lists or tables', 8,
      (x.tables >= 1 && x.lists >= 1) || x.lists >= 2 ? 'pass' : struct >= 1 ? 'warn' : 'fail',
      x.isHtml ? plural(x.lists, 'list') + ' and ' + plural(x.tables, 'table') + ' found.' : (x.listLines || 0) + ' list-style lines' + (x.tables ? ' and a table' : '') + ' found.',
      'Use numbered steps, bullet lists and a comparison table where they fit. Structured blocks are easy for AI systems to extract and quote.');

    // 4. Statistics
    var stats = (allText.match(STAT_RE) || []).map(function (s) { return s.trim(); });
    add('stats', 'Statistics and specific numbers', 9,
      stats.length >= 3 ? 'pass' : stats.length ? 'warn' : 'fail',
      stats.length ? plural(stats.length, 'figure') + ' with units: ' + stats.slice(0, 6).map(function (s) { return '<span class="geo-tag">' + esc(s) + '</span>'; }).join(' ') : 'No figures with units (%, ₹, years, km…) found.',
      'Add concrete, sourced numbers (prices in ₹, percentages, time frames, counts). The GEO study by Aggarwal et al. (2024) found that adding statistics was one of the most effective ways to increase visibility in AI answers.');

    // 5. Citations
    var cites = (allText.match(CITE_RE) || []).length + x.ext;
    add('cite', 'Sources and citations', 10,
      cites >= 3 ? 'pass' : cites ? 'warn' : 'fail',
      plural((allText.match(CITE_RE) || []).length, 'attribution phrase') + ' (“according to”, “study”, “source:”…) and ' + plural(x.ext, 'external link') + '.',
      'Cite authoritative sources by name and link to them (government sites, research, official documentation). Citing sources was another of the strongest methods in published GEO research.');

    // 6. Quotes
    var quotes = (allText.match(QUOTE_RE) || []).length + x.quotesEl;
    add('quote', 'Quotations from experts or sources', 5,
      quotes ? 'pass' : 'warn',
      quotes ? plural(quotes, 'quotation') + ' found.' : 'No quotations found.',
      'Where it is genuine, add a short quote from a named expert, customer or official source, with attribution.');

    // 7. Entity clarity
    var ents = {}, entCount = 0;
    A.sentList.forEach(function (s) {
      wordsOf(s.text).forEach(function (w, i) {
        if (i === 0) return;
        if (/^[A-Z][a-z]+/.test(w) || /^[A-Z]{2,6}s?$/.test(w)) { if (!isStop(w) && w !== 'I') { ents[w] = (ents[w] || 0) + 1; entCount++; } }
      });
    });
    var entList = Object.keys(ents).sort(function (a, b) { return ents[b] - ents[a]; });
    var entDensity = W ? entCount / W * 100 : 0;
    var topicTop = !topicL || wordsOf(intro.join(' ')).join(' ').toLowerCase().indexOf(topicL) > -1 || intro.join(' ').toLowerCase().indexOf(topicL) > -1;
    var topicHead = !topicL || x.headings.some(function (h) { return h.text.toLowerCase().indexOf(topicL) > -1; });
    add('entity', 'Clear entities (names, brands, places)', 6,
      entDensity >= 1.5 && topicTop && topicHead ? 'pass' : entDensity >= 0.5 && topicTop ? 'warn' : 'fail',
      plural(entList.length, 'distinct named entity', 'distinct named entities') + ' (' + r1(entDensity) + ' per 100 words)' + (entList.length ? ': ' + entList.slice(0, 8).map(esc).join(', ') : '') + '.' +
        (topicL ? (topicTop ? '' : ' Your topic is not named in the opening.') + (topicHead ? '' : ' Your topic is not in any heading.') : ''),
      'Name things explicitly instead of “it” or “this tool”: the product, company, people, places and standards involved. Clear entities help AI systems connect your page to the right topic.');

    // 8. Freshness
    var years = (allText.match(/\b(?:19[5-9]\d|20\d\d)\b/g) || []).map(Number).filter(function (y) { return y <= new Date().getFullYear() + 1; });
    if (x.time && /^\d{4}/.test(x.time)) years.push(+x.time.slice(0, 4));
    var maxY = years.length ? Math.max.apply(null, years) : 0, curY = new Date().getFullYear();
    var updated = /\b(?:updated|last reviewed|last modified|as of)\b/i.test(allText) || !!x.time;
    add('fresh', 'Freshness (dates and years)', 5,
      maxY >= curY - 1 ? 'pass' : maxY ? 'warn' : 'fail',
      maxY ? 'Most recent year mentioned: <strong>' + maxY + '</strong>' + (updated ? '; an update/publish date is present.' : '.') : 'No year or date found.',
      'Show a visible “Last updated” date and refresh figures, prices and rules regularly. Answer engines prefer current information for time-sensitive topics.');

    // 9. Paragraph length
    var pw = paras.map(function (p) { return wordsOf(p).length; }).filter(function (n) { return n; });
    var avgP = pw.length ? pw.reduce(function (a, b) { return a + b; }, 0) / pw.length : 0, maxP = pw.length ? Math.max.apply(null, pw) : 0;
    add('paras', 'Short, scannable paragraphs', 6,
      !pw.length ? 'fail' : avgP <= 70 && maxP <= 120 ? 'pass' : avgP <= 100 ? 'warn' : 'fail',
      pw.length ? plural(pw.length, 'paragraph') + ', average ' + Math.round(avgP) + ' words, longest ' + maxP + ' words.' : 'No paragraphs found.',
      'Keep paragraphs to 2–4 sentences (about 40–70 words) with one idea each, so each can stand alone as a quotable answer.');

    // 10. Sentence length
    var longS = A.sentList.filter(function (s) { return s.words > 30; }).length;
    add('sent', 'Sentence length', 6,
      !A.sentences ? 'fail' : A.wps <= 20 ? 'pass' : A.wps <= 25 ? 'warn' : 'fail',
      A.sentences ? 'Average ' + r1(A.wps) + ' words per sentence; ' + plural(longS, 'sentence') + ' over 30 words.' : 'No sentences found.',
      'Aim for an average of 15–20 words. Split long sentences at “and”, “which” or “because”.');

    // 11. Readability
    var fre = A.words ? clamp(A.fre, 0, 100) : 0;
    add('read', 'Readability (Flesch Reading Ease)', 6,
      fre >= 60 ? 'pass' : fre >= 45 ? 'warn' : 'fail',
      'Score <strong>' + Math.round(fre) + '</strong> (' + freLabel(fre)[0] + '). 60+ is plain English for most readers.',
      'Use shorter words and sentences. Replace jargon with everyday terms or define it the first time.');

    // 12. Word count
    add('words', 'Depth (word count)', 6,
      W >= 600 ? 'pass' : W >= 300 ? 'warn' : 'fail',
      BT.fmtNum(W, 0) + ' words.',
      'Cover the topic fully: definition, how it works, steps, costs, examples, pros and cons, FAQs. Around 800–2,000 words suits most guides; short answer pages can be shorter if they are complete.');

    // 13. FAQ section
    var qLines = (allText.match(/(?:^|\n)\s*(?:Q[:.]|Question:)/g) || []).length;
    var faq = x.faqSchema || x.headings.some(function (h) { return /faq|frequently asked|common questions|questions and answers|people also ask/i.test(h.text); }) || qh.length >= 3 || qLines >= 2;
    add('faq', 'FAQ section', 5, faq ? 'pass' : 'warn',
      faq ? 'An FAQ section or several question-and-answer pairs were found' + (x.faqSchema ? ' (with FAQPage schema).' : '.') : 'No FAQ section found.',
      'Add 4–8 real questions your customers ask, each with a direct 40–60 word answer. Use the FAQ Schema Generator to add matching markup.');

    // 14. Author / expertise
    var byline = BYLINE_RE.test(raw) || !!x.metaAuthor || !!x.relAuthor || !!x.schemaAuthor;
    var cred = CRED_RE.test(allText) || /\breviewed by\b/i.test(allText);
    add('author', 'Author and expertise signals', 6,
      byline && cred ? 'pass' : byline || cred ? 'warn' : 'fail',
      (byline ? 'Author byline found' + (x.metaAuthor ? ' (' + esc(x.metaAuthor) + ')' : '') + '. ' : 'No author byline found. ') + (cred ? 'Credentials or review signals found.' : 'No credentials or “reviewed by” signals found.'),
      'Show who wrote it and why they are qualified (role, credentials, years of experience), link to an author page, and add “Reviewed by” for finance, health or legal topics.');

    // 15. Jargon density
    var acr = {}, unexpl = [];
    (allText.match(/\b[A-Z]{2,6}s?\b/g) || []).forEach(function (a) { acr[a.replace(/s$/, '')] = 1; });
    Object.keys(acr).forEach(function (a) {
      var defined = new RegExp('\\(\\s*' + a + 's?\\s*\\)|' + a + 's?\\s*\\((?:[A-Za-z][^)]{3,})\\)').test(allText);
      if (!defined && ['I', 'OK', 'AM', 'PM', 'USA', 'UK', 'US', 'FAQ', 'FAQS', 'TV', 'ID'].indexOf(a) < 0) unexpl.push(a);
    });
    var longW = A.wordList.filter(function (w) { return hyphSyl(w) >= 4 && !/^[A-Z]/.test(w); });
    var jr = W ? (longW.length + unexpl.length) / W * 100 : 0;
    var topJ = {};
    longW.forEach(function (w) { topJ[w.toLowerCase()] = (topJ[w.toLowerCase()] || 0) + 1; });
    add('jargon', 'Jargon density', 4,
      jr <= 4 ? 'pass' : jr <= 7 ? 'warn' : 'fail',
      r1(jr) + '% long words or unexplained acronyms.' + (unexpl.length ? ' Acronyms never spelled out: ' + unexpl.slice(0, 8).map(function (a) { return '<span class="geo-tag">' + esc(a) + '</span>'; }).join(' ') + '.' : '') +
        (Object.keys(topJ).length ? ' Frequent long words: ' + Object.keys(topJ).sort(function (a, b) { return topJ[b] - topJ[a]; }).slice(0, 6).map(esc).join(', ') + '.' : ''),
      'Spell out acronyms on first use, e.g. “Goods and Services Tax (GST)”, and swap long words for short ones where meaning allows.');

    var tw = 0, got = 0;
    checks.forEach(function (c) { tw += c.weight; got += c.weight * (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0); });
    return { checks: checks, score: W ? Math.round(got / tw * 100) : 0, A: A, x: x, firstPara: firstPara, defSent: defSent, ents: ents, stats: stats };
  }

  /** First paragraph with the definition, numbers and entities highlighted. */
  function geoIntroHTML(r) {
    var p = r.firstPara;
    if (!p) return '<p class="muted">No paragraph found.</p>';
    var ranges = [], m, re;
    if (r.defSent) { var di = p.indexOf(r.defSent); if (di > -1) ranges.push([di, di + r.defSent.length, 'g-def']); }
    re = new RegExp(STAT_RE.source, 'gi');
    var inner = [];
    while ((m = re.exec(p))) inner.push([m.index, m.index + m[0].length, 'g-num']);
    re = new RegExp(WORD_RE.source, 'g');
    var firstW = true, prevEnd = 0, count = 0, cut = -1;
    while ((m = re.exec(p))) {
      var start = firstW || /[.!?]/.test(p.slice(prevEnd, m.index));
      firstW = false;
      count++;
      if (count === 80) cut = m.index + m[0].length;
      if (!start && r.ents[m[0]]) inner.push([m.index, m.index + m[0].length, 'g-ent']);
      prevEnd = m.index + m[0].length;
    }
    // Inline marks render inside the definition span by splitting it into pieces.
    function render(a, b) {
      var seg = inner.filter(function (x) { return x[0] >= a && x[1] <= b; }).map(function (x) { return [x[0] - a, x[1] - a, x[2]]; });
      return markRanges(p.slice(a, b), seg);
    }
    var html, def = ranges[0];
    function piece(a, b) {
      if (cut > a && cut < b) return render(a, cut) + '<span class="g-cut" title="80-word mark">80 words</span>' + render(cut, b);
      return render(a, b);
    }
    if (def) html = piece(0, def[0]) + '<mark class="g-def">' + piece(def[0], def[1]) + '</mark>' + piece(def[1], p.length);
    else html = piece(0, p.length);
    return '<p>' + html + '</p>';
  }

  impl('geo-content-analyzer', function (root) {
    css();
    var last = null, filter = 'all';
    root.innerHTML = '<div class="card"><div class="geo-toolbar"><label for="ga-in" class="geo-inl" style="margin-right:auto">Article text or HTML</label>' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      ta('ga-in', 'Paste your article as plain text, Markdown or HTML. HTML tags are stripped and lists, tables, links and headings are detected.', 10, '', ' spellcheck="false" style="min-height:220px"') +
      '<div class="row cols-2" style="margin-top:14px">' + field('ga-topic', 'Main topic or keyword (optional)', inp('ga-topic', 'text', 'e.g. GST registration'), 'Used to check that the opening and headings name your subject.') +
      '<div class="field" style="justify-content:flex-end"><span class="geo-count" id="ga-mode"></span></div></div>' +
      '<div class="notice" style="margin-top:4px">' + BT.icon('info') + '<span>This score is a <strong>transparent heuristic</strong> built from published Generative Engine Optimization research (for example Aggarwal et al., “GEO: Generative Engine Optimization”, 2024) and well-established content good practice. It cannot predict or guarantee citations in ChatGPT, Gemini, Perplexity or Google AI Overviews. Use it as a checklist, not a ranking promise.</span></div></div>' +
      '<div id="ga-res"></div>';
    var input = BT.$('#ga-in', root), res = BT.$('#ga-res', root);

    function run() {
      var raw = input.value;
      BT.$('#ga-mode', root).textContent = raw.trim() ? (looksHtml(raw) ? 'Detected: HTML' : 'Detected: plain text / Markdown') : '';
      if (!raw.trim()) { last = null; res.innerHTML = '<div class="card"><p class="muted" style="margin:0">Paste an article above to see its GEO score.</p></div>'; return; }
      last = geoAnalyze(raw, val(root, 'ga-topic'));
      render();
    }
    function render() {
      var r = last, cnt = { pass: 0, warn: 0, fail: 0 };
      r.checks.forEach(function (c) { cnt[c.status]++; });
      var verdict = r.score >= 75 ? 'Well structured for AI answers' : r.score >= 50 ? 'Good base, some gaps to close' : 'Needs work to be quotable';
      var order = { fail: 0, warn: 1, pass: 2 };
      var list = r.checks.slice().sort(function (a, b) { return order[a.status] - order[b.status] || b.weight - a.weight; })
        .filter(function (c) { return filter === 'all' || c.status !== 'pass'; });
      var top = r.checks.filter(function (c) { return c.status !== 'pass'; }).sort(function (a, b) { return (b.weight * (b.status === 'fail' ? 1 : 0.5)) - (a.weight * (a.status === 'fail' ? 1 : 0.5)); }).slice(0, 3);
      res.innerHTML = '<div class="card"><div class="geo-score">' + ringHTML(r.score, 'GEO score') +
        '<div style="flex:1;min-width:220px"><h2 class="geo-h" style="font-size:1.25rem">' + esc(verdict) + '</h2>' +
        '<p class="muted" style="margin:6px 0 10px">Weighted score from ' + r.checks.length + ' checks. Pass = full weight, warn = half.</p>' +
        '<div class="btn-group"><span class="badge danger">' + cnt.fail + ' failed</span><span class="badge warn">' + cnt.warn + ' warnings</span><span class="badge ok">' + cnt.pass + ' passed</span></div></div></div>' +
        '<div class="stats" style="margin-top:16px">' + [['Words', BT.fmtNum(r.A.words, 0)], ['Sentences', BT.fmtNum(r.A.sentences, 0)], ['Headings', r.x.headings.length], ['Flesch', r.A.words ? Math.round(clamp(r.A.fre, 0, 100)) : '—'], ['Figures', r.stats.length]].map(function (s) {
          return '<div class="stat"><div class="label">' + s[0] + '</div><div class="value">' + s[1] + '</div></div>';
        }).join('') + '</div>' +
        (top.length ? '<div class="geo-sec">Top fixes</div><ol style="margin:0;padding-left:20px;color:var(--text-2)">' + top.map(function (c) { return '<li style="margin-bottom:6px"><strong>' + esc(c.name) + ':</strong> ' + c.tip + '</li>'; }).join('') + '</ol>' : '') +
        '</div>' +
        '<div class="card"><div class="card-title"><h2 class="geo-h">Opening paragraph</h2><span class="muted small">What answer engines read first</span></div>' +
        '<div class="geo-leg"><span><i style="background:rgba(16,185,129,.35)"></i> Direct answer / definition</span><span><i style="background:rgba(99,102,241,.35)"></i> Figures</span><span><i style="background:#f59e0b;height:3px"></i> Named entities</span></div>' +
        '<div class="geo-hl">' + geoIntroHTML(r) + '</div></div>' +
        '<div class="card"><div class="card-title"><h2 class="geo-h">Checks</h2>' + seg('ga-filter', [['all', 'All'], ['issues', 'Issues only']], filter, 'Filter checks') + '</div>' +
        '<div class="geo-clist">' + (list.length ? list.map(function (c) { return checkHTML(c, true); }).join('') : '<p class="muted" style="margin:0">No issues found.</p>') + '</div></div>';
      wireSeg(BT.$('#ga-filter', res), function (v) { filter = v; render(); });
    }
    var deb = BT.debounce(run, 300);
    input.addEventListener('input', deb);
    BT.$('#ga-topic', root).addEventListener('input', deb);
    onClickA(root, {
      sample: function () {
        input.value = '# What is GST registration?\n\nGST registration is the process by which a business in India gets a 15-digit GSTIN from the GST portal so it can collect Goods and Services Tax (GST) and claim input tax credit. Most suppliers of goods must register once annual turnover crosses ₹40 lakh (₹20 lakh for services), according to the Central Board of Indirect Taxes and Customs (CBIC).\n\nBy Priya Sen, CA · Reviewed by Arjun Das, Chartered Accountant with 12 years of experience · Last updated March 2026\n\n## Who needs to register for GST?\n\nYou must register if any of these apply:\n- Your turnover is above the threshold for your state\n- You sell goods to another state (inter-state supply)\n- You sell through an e-commerce marketplace such as Amazon or Flipkart\n\n## How long does GST registration take?\n\nThe GST portal usually approves an application within 7 working days if documents are in order. A 2024 survey by the Ministry of Finance found that 85% of applications were approved without a site visit.\n\n## Documents required\n\n| Document | Who needs it |\n|---|---|\n| PAN card | All applicants |\n| Address proof | All applicants |\n\n“Registering early helps small businesses win larger clients who need GST invoices,” says Arjun Das.\n\n## Frequently asked questions\n\n### Is GST registration free?\n\nYes. There is no government fee to register on the GST portal.';
        BT.$('#ga-topic', root).value = 'GST registration';
        run();
      },
      clear: function () { input.value = ''; run(); input.focus(); }
    });
    run();
  });

  // ==================================================== aeo-answer-optimizer
  var FLUFF = [
    [/^\s*(?:great|good|excellent|interesting) question\b/i, '“Great question”'],
    [/\bin this (?:article|post|blog|guide)\b/i, '“In this article”'],
    [/\bas we all know\b/i, '“As we all know”'],
    [/\bit is (?:important|worth) (?:to note|noting|mentioning)\b/i, '“It is important to note”'],
    [/\blet[’']?s (?:dive|take a look|explore|get started)\b/i, '“Let’s dive in”'],
    [/\bin today[’']?s (?:world|fast-paced|digital)\b/i, '“In today’s world”'],
    [/\bhave you ever wondered\b/i, '“Have you ever wondered”'],
    [/^\s*(?:well|so|basically|honestly|actually),/i, 'a filler opener (“Well,” “So,” “Basically,”)'],
    [/\bwhen it comes to\b/i, '“When it comes to”'],
    [/\bthere are (?:many|several|a lot of|various) (?:things|factors|ways|reasons)\b/i, '“There are many factors”'],
    [/\bin conclusion\b/i, '“In conclusion”'],
    [/\bfirst of all\b/i, '“First of all”'],
    [/\bwithout further ado\b/i, '“Without further ado”'],
    [/\bneedless to say\b/i, '“Needless to say”']
  ];
  var QTYPES = {
    paragraph: ['Definition / explanation', 'A 40–60 word paragraph that starts by naming the subject: “X is …”.'],
    steps: ['How-to / steps', 'One intro sentence, then a numbered list of 3–8 steps, each starting with a verb.'],
    list: ['List / best options', 'One intro sentence, then a bulleted list of 3–8 items with a short reason each.'],
    table: ['Comparison', 'A one-sentence verdict, then a small table or list comparing the options on the same points.'],
    yesno: ['Yes / no', 'Start with “Yes” or “No”, then one or two sentences explaining when or why.'],
    number: ['Cost / number', 'Lead with the figure or range (with units and the date), then what affects it.']
  };
  function detectQType(q) {
    var s = String(q || '').trim().toLowerCase();
    if (!s) return 'paragraph';
    if (/\b(?:vs\.?|versus|compare|comparison|difference between|better than|which is better)\b/.test(s)) return 'table';
    if (/\b(?:how much|how many|cost|costs|price|prices|fee|fees|charges|salary|rate of|how long|how old|how far|percentage)\b/.test(s)) return 'number';
    if (/^(?:how (?:to|do|does|can|should|did)\b|steps|ways to\b)/.test(s) && !/^how (?:does|do) .* work/.test(s)) return 'steps';
    if (/\b(?:best|top \d*|examples of|types of|kinds of|list of|benefits of|advantages|disadvantages|tips|ideas|ways)\b/.test(s)) return 'list';
    if (/^(?:is|are|can|does|do|should|will|was|were|has|have|could|would|did|am)\b/.test(s)) return 'yesno';
    return 'paragraph';
  }
  /** The subject phrase of a question, for the suggested opening. */
  function questionSubject(q) {
    var s = oneLine(q).replace(/\?+$/, '');
    var m;
    if ((m = s.match(/^(?:what|who)\s+(?:is|are|was|were)\s+(?:an?\s+|the\s+)?(.+)$/i))) return { subj: m[1], verb: /^(?:what|who)\s+are/i.test(s) ? 'are' : 'is' };
    if ((m = s.match(/^what\s+does\s+(.+?)\s+mean$/i))) return { subj: m[1], verb: 'means' };
    if ((m = s.match(/^how\s+(?:do|does|can)\s+(?:i|you|we)\s+(.+)$/i)) || (m = s.match(/^how\s+to\s+(.+)$/i))) return { subj: m[1], verb: 'to' };
    if ((m = s.match(/^how\s+much\s+(?:does|do|is|are)\s+(?:an?\s+|the\s+)?(.+?)(?:\s+cost)?$/i))) return { subj: m[1], verb: 'costs' };
    if ((m = s.match(/^(?:is|are|can|does|do|should)\s+(.+)$/i))) return { subj: m[1], verb: 'yesno' };
    if ((m = s.match(/^why\s+(?:is|are|do|does|should)\s+(.+)$/i))) return { subj: m[1], verb: 'why' };
    return { subj: s.replace(/^(?:what|which|who|where|when|why|how)\s+(?:is|are|the|a|an)?\s*/i, ''), verb: 'is' };
  }
  function openingTemplate(q, type) {
    var sj = questionSubject(q), S0 = ucFirst(sj.subj);
    if (!sj.subj) return '';
    if (sj.verb === 'to') return 'To ' + sj.subj + ', [do the first key thing], then [second], and [third].';
    if (sj.verb === 'costs' || type === 'number') return S0 + ' costs about ₹[amount] to ₹[amount] (as of ' + new Date().getFullYear() + '), depending on [main factor].';
    if (sj.verb === 'yesno' || type === 'yesno') return 'Yes, ' + sj.subj + ' [short reason]. [When it is not the case.]';
    if (sj.verb === 'means') return '“' + S0 + '” means [plain-English meaning], used when [context].';
    if (sj.verb === 'why') return S0 + ' because [main reason]. [Supporting fact or figure.]';
    if (type === 'list' || type === 'table') return 'The [best/main] ' + sj.subj + ' are [A], [B] and [C], depending on [criterion].';
    return S0 + ' ' + sj.verb + ' [category, e.g. “a tax”, “a tool”] that [what it does / key differentiator].';
  }
  /** Inline Markdown (bold, italic, links) to safe HTML. */
  function inlineMd(s) {
    var h = esc(s);
    h = h.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|\/)[^\s)]+)\)/g, function (m, t, u) { return '<a href="' + u + '">' + t + '</a>'; });
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>').replace(/(^|\W)_([^_\s][^_]*?)_(?=\W|$)/g, '$1<em>$2</em>');
    return h;
  }
  function stripTags(h) { return String(h).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'); }
  var LIST_LINE = /^\s*(?:[-*•▪]|\d+[.)])\s+/;

  impl('aeo-answer-optimizer', function (root) {
    css();
    var schemaMode = 'auto', outMode = 'html';
    root.innerHTML = '<div class="split">' +
      '<div class="card" style="min-width:0"><div class="card-title"><h2 class="geo-h">Question &amp; answer</h2><div class="btn-group">' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div></div>' +
      field('ao-q', 'Target question', inp('ao-q', 'text', 'e.g. How do I register for GST online?'), 'Phrase it the way people ask it in search or voice.') +
      '<div class="field"><div class="geo-lrow"><label for="ao-a">Your answer</label><span class="geo-count" id="ao-a-c" aria-live="polite"></span></div>' +
      ta('ao-a', 'Write the answer you want quoted. For steps or lists, put each item on its own line starting with “1.” or “-”.', 8, '', ' style="min-height:190px"') +
      '<span class="hint">Supports **bold**, *italic* and [links](https://…).</span></div>' +
      field('ao-type', 'Answer format', sel('ao-type', [['auto', 'Auto-detect from the question'], ['paragraph', 'Paragraph (definition / explanation)'], ['steps', 'Numbered steps'], ['list', 'Bulleted list'], ['table', 'Comparison table'], ['yesno', 'Yes / no'], ['number', 'Cost / number']], 'auto')) +
      '<div id="ao-type-note"></div></div>' +
      '<div style="min-width:0"><div class="card"><div class="geo-score" id="ao-score"></div><div class="geo-clist" id="ao-checks" style="margin-top:14px"></div></div></div></div>' +
      '<div class="split" style="margin-top:20px">' +
      '<div class="card" style="min-width:0"><div class="card-title"><h2 class="geo-h">Optimized structure</h2></div><div id="ao-struct"></div>' +
      '<div class="geo-sec">Snippet preview</div><div class="geo-snip" id="ao-prev"></div></div>' +
      '<div class="card" style="min-width:0"><div class="card-title"><h2 class="geo-h">Code</h2>' + seg('ao-out', [['html', 'HTML'], ['schema', 'JSON-LD'], ['both', 'Both']], outMode, 'Output') + '</div>' +
      '<div class="geo-toolbar"><span class="geo-inl">Schema ' + seg('ao-schema', [['auto', 'Auto'], ['faq', 'FAQPage'], ['howto', 'HowTo']], schemaMode, 'Schema type') + '</span><span class="spacer"></span>' +
      btn('data-a="copy"', 'copy', 'Copy', 'btn-primary') + btn('data-a="dl"', 'download', 'Download') + '</div>' +
      '<label for="ao-code" class="sr-only">Generated code</label><textarea id="ao-code" class="mono geo-out" readonly spellcheck="false" style="min-height:260px"></textarea>' +
      '<div class="notice warn" style="margin-top:12px">' + BT.icon('info') + '<span>Since 2023 Google shows FAQ rich results only for well-known government and health sites, and has retired HowTo rich results. The markup is still valid schema.org and helps search engines and AI systems understand the question-and-answer structure, but do not expect special search features from it.</span></div></div></div>' +
      '<div class="card" style="margin-top:20px"><div class="geo-voice"><div class="card-title"><h2 class="geo-h">' + BT.icon('mic') + ' Voice search answer</h2><span id="ao-say"></span></div><div id="ao-voice"></div>' +
      '<ul style="margin:10px 0 0;padding-left:20px;color:var(--text-2);font-size:.9rem">' +
      '<li>Voice assistants read one short answer aloud. A widely cited 2017 study found the average voice result was about <strong>29 words</strong>; treat that as a rule of thumb, not a hard limit.</li>' +
      '<li>Use conversational, complete-sentence questions as headings (“How do I…”, “What is the best…near me”) and answer at a reading level most people follow easily.</li>' +
      '<li>For local questions, keep your name, address, phone and opening hours consistent on your site and Google Business Profile.</li></ul></div></div>';

    var qIn = BT.$('#ao-q', root), aIn = BT.$('#ao-a', root), code = BT.$('#ao-code', root), cur = null;

    function parse() {
      var q = oneLine(qIn.value), raw = aIn.value.replace(/\r/g, '');
      var ls = raw.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      var items = [], paras = [];
      ls.forEach(function (l) { if (LIST_LINE.test(l)) items.push(l.replace(LIST_LINE, '')); else paras.push(l); });
      var sel0 = BT.$('#ao-type', root).value, type = sel0 === 'auto' ? detectQType(q) : sel0;
      return { q: q, raw: raw, items: items, paras: paras, type: type, auto: sel0 === 'auto' };
    }
    function answerHTML(p, forSchema) {
      var h = p.paras.map(function (x) { return '<p>' + inlineMd(x) + '</p>'; });
      if (p.items.length) {
        if (p.type === 'table' && !forSchema && p.items.every(function (i) { return /[:–—]|\s-\s/.test(i); })) {
          h.push('<table>\n  <thead><tr><th>Option</th><th>Details</th></tr></thead>\n  <tbody>\n' + p.items.map(function (i) {
            var m = i.match(/^(.*?)\s*(?::|–|—|\s-\s)\s*(.*)$/);
            return '    <tr><td>' + inlineMd(m[1]) + '</td><td>' + inlineMd(m[2]) + '</td></tr>';
          }).join('\n') + '\n  </tbody>\n</table>');
        } else {
          var tag = p.type === 'steps' || /^\s*\d/.test(p.raw.split('\n').filter(function (l) { return LIST_LINE.test(l); })[0] || '') ? 'ol' : 'ul';
          h.push('<' + tag + '>\n' + p.items.map(function (i) { return '  <li>' + inlineMd(i) + '</li>'; }).join('\n') + '\n</' + tag + '>');
        }
      }
      return h.join('\n');
    }
    function run() {
      var p = cur = parse(), checks = [];
      var allTxt = p.paras.concat(p.items).join('\n'), A = analyse(allTxt);
      var intro = p.paras[0] || p.items[0] || '', introSents = splitSentences(intro), first = (introSents[0] || '').trim();
      var introWords = wordsOf(intro).length, totalWords = A.words;
      var terms = keyTerms(p.q.replace(/\b(?:best|top|cost|price)\b/gi, ''));
      BT.$('#ao-a-c', root).innerHTML = totalWords ? plural(totalWords, 'word') + (p.items.length ? ' · ' + plural(p.items.length, 'list item') : '') : '';
      BT.$('#ao-type-note', root).innerHTML = notice('', '<strong>' + (p.auto ? 'Detected: ' : 'Format: ') + QTYPES[p.type][0] + '.</strong> ' + QTYPES[p.type][1]);
      if (!p.q || !totalWords) {
        BT.$('#ao-score', root).innerHTML = '<p class="muted" style="margin:0">Enter a question and your answer to see how answer-ready it is.</p>';
        BT.$('#ao-checks', root).innerHTML = '';
      }
      // Direct start
      var fp = termPresence(terms, first);
      if (p.type === 'yesno') {
        var yn = /^(?:yes|no)\b/i.test(first);
        checks.push({ name: 'Starts with a direct yes or no', status: yn ? 'pass' : 'fail', detail: yn ? 'The answer opens with “' + esc(first.split(/[\s,]/)[0]) + '”.' : 'The first word is not “Yes” or “No”.', tip: 'Begin with “Yes,” or “No,” and then give the condition or reason in the same sentence.' });
      } else if (p.type === 'number') {
        var hasNum = /\d/.test(first);
        checks.push({ name: 'Leads with the figure', status: hasNum ? 'pass' : 'fail', detail: hasNum ? 'The first sentence contains a number.' : 'No number in the first sentence.', tip: 'Give the figure or range first (with ₹, %, days…) and when it applies, then explain what changes it.' });
      }
      var startRatio = terms.length ? fp.hit.length / terms.length : 1;
      checks.push({ name: 'First sentence restates the subject', status: !first ? 'fail' : startRatio >= 0.5 ? 'pass' : fp.hit.length ? 'warn' : 'fail',
        detail: first ? 'Uses ' + fp.hit.length + ' of ' + terms.length + ' key terms from the question' + (fp.miss.length ? ' (missing: ' + fp.miss.map(esc).join(', ') + ')' : '') + '.' : 'No answer yet.',
        tip: 'Name the subject in the opening sentence so it makes sense when quoted on its own. Try: <em>' + esc(openingTemplate(p.q, p.type)) + '</em>' });
      if (/^(?:it|this|that|they|these|those)\b/i.test(first)) checks.push({ name: 'Avoid opening with a pronoun', status: 'warn', detail: 'The answer starts with “' + esc(first.split(/\s/)[0]) + '”, which does not make sense out of context.', tip: 'Replace the pronoun with the actual subject from the question.' });
      // Fluff
      var fl = FLUFF.filter(function (f) { return f[0].test(allTxt); });
      checks.push({ name: 'No fluff or filler', status: fl.length ? (fl.some(function (f) { return f[0].test(first); }) ? 'fail' : 'warn') : 'pass',
        detail: fl.length ? 'Found ' + fl.map(function (f) { return f[1]; }).join(', ') + '.' : 'No filler phrases found.', tip: 'Cut warm-up phrases. Answer engines skip answers that take a sentence to get going.' });
      // Length
      if (p.type === 'steps' || p.type === 'list' || p.type === 'table') {
        var n = p.items.length;
        checks.push({ name: 'List length (3–8 items)', status: n >= 3 && n <= 8 ? 'pass' : n >= 2 && n <= 10 ? 'warn' : 'fail',
          detail: n ? plural(n, 'item') + ' found.' : 'No list items found. Put each item on its own line starting with “1.” or “-”.',
          tip: n > 8 ? 'Trim to the 8 most important items; snippets usually show about 8 lines and then “More items”.' : 'Use 3–8 short items so the full list fits in a featured snippet.' });
        var longItems = p.items.filter(function (i) { return wordsOf(i).length > 25; }).length;
        if (n) checks.push({ name: 'Short list items', status: longItems ? 'warn' : 'pass', detail: longItems ? plural(longItems, 'item') + ' over 25 words.' : 'All items are 25 words or fewer.', tip: 'Keep each item to one line; move detail into the text below the list.' });
        if (p.type === 'steps' && n) {
          var nonVerb = p.items.filter(function (i) { return /^(?:the|a|an|this|it|you|your|there)\b/i.test(i); }).length;
          checks.push({ name: 'Steps start with an action', status: nonVerb ? 'warn' : 'pass', detail: nonVerb ? plural(nonVerb, 'step') + ' start with “the”, “you” or similar.' : 'Every step starts with an action word.', tip: 'Start each step with a verb: “Open…”, “Enter…”, “Upload…”.' });
        }
        checks.push({ name: 'Intro sentence before the list', status: p.paras.length ? 'pass' : 'warn', detail: p.paras.length ? 'Intro: “' + esc(p.paras[0].slice(0, 120)) + '”' : 'The answer is only a list.', tip: 'Add one sentence above the list that answers the question in summary.' });
      } else {
        var lo = p.type === 'yesno' || p.type === 'number' ? 25 : 40, hi = 60;
        checks.push({ name: 'Snippet length (' + lo + '–' + hi + ' words)', status: introWords >= lo && introWords <= hi ? 'pass' : introWords >= lo - 15 && introWords <= hi + 20 ? 'warn' : 'fail',
          detail: 'Your first paragraph has <strong>' + introWords + '</strong> words.', tip: introWords > hi ? 'Shorten the first paragraph; move extra detail into a second paragraph.' : 'Expand the first paragraph with the key qualifier, figure or example.' });
      }
      // Reading grade
      var g = A.words ? A.fk : 0;
      checks.push({ name: 'Reading grade', status: g <= 9 ? 'pass' : g <= 12 ? 'warn' : 'fail', detail: 'Flesch-Kincaid grade <strong>' + r1(Math.max(0, g)) + '</strong>, Flesch reading ease ' + Math.round(clamp(A.fre || 0, 0, 100)) + '.', tip: 'Aim for grade 8–9: shorter sentences and everyday words.' });
      // Key terms overall
      var tp = termPresence(terms, allTxt);
      checks.push({ name: 'Uses the question’s key terms', status: !terms.length ? 'pass' : tp.hit.length / terms.length >= 0.8 ? 'pass' : tp.hit.length / terms.length >= 0.5 ? 'warn' : 'fail',
        detail: terms.length ? 'Key terms: ' + terms.map(function (t) { return tp.miss.indexOf(t) > -1 ? '<s>' + esc(t) + '</s>' : '<strong>' + esc(t) + '</strong>'; }).join(', ') + '.' : 'No key terms detected in the question.',
        tip: 'Use the same words the question uses (and natural variations) so the match is obvious.' });

      if (p.q && totalWords) {
        var pts = 0;
        checks.forEach(function (c) { pts += c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0; });
        var sc = Math.round(pts / checks.length * 100);
        BT.$('#ao-score', root).innerHTML = ringHTML(sc, 'Answer score') + '<div style="flex:1;min-width:180px"><h2 class="geo-h" style="font-size:1.2rem">' + (sc >= 75 ? 'Answer-ready' : sc >= 50 ? 'Close, a few fixes' : 'Needs restructuring') + '</h2><p class="muted" style="margin:6px 0 0">' + QTYPES[p.type][0] + ' answer · ' + plural(checks.length, 'check') + '</p></div>';
        BT.$('#ao-checks', root).innerHTML = checks.map(function (c) { return checkHTML(c); }).join('');
      }

      // Structure suggestions
      var tips = ['<li><strong>Heading:</strong> use the question itself as an H2: “' + esc(p.q ? ucFirst(p.q.replace(/\?*$/, '?')) : 'Your question?') + '”.</li>',
        '<li><strong>Opening:</strong> <em>' + esc(openingTemplate(p.q || 'What is X', p.type) || '—') + '</em></li>',
        '<li><strong>Format:</strong> ' + QTYPES[p.type][1] + '</li>',
        '<li><strong>Then:</strong> add supporting detail, an example and a source below the snippet-sized answer.</li>'];
      BT.$('#ao-struct', root).innerHTML = '<ul style="margin:0;padding-left:20px;color:var(--text-2)">' + tips.join('') + '</ul>';
      BT.$('#ao-prev', root).innerHTML = p.q || totalWords ? '<div class="q">' + BT.icon('search') + ' ' + esc(p.q || 'Your question') + '</div>' + (answerHTML(p) || '<p class="muted">Your answer appears here.</p>') : '<p class="muted" style="margin:0">Your formatted answer appears here.</p>';

      // Code
      var html = p.q || totalWords ? '<section class="answer">\n  <h2>' + esc(ucFirst(p.q || 'Your question?')) + '</h2>\n' + answerHTML(p).split('\n').map(function (l) { return '  ' + l; }).join('\n') + '\n</section>' : '';
      var useHowTo = schemaMode === 'howto' || (schemaMode === 'auto' && p.type === 'steps' && p.items.length >= 2);
      var obj;
      if (useHowTo) {
        obj = { '@context': 'https://schema.org', '@type': 'HowTo', name: ucFirst(p.q.replace(/\?+$/, '')) };
        if (p.paras.length) obj.description = stripTags(inlineMd(p.paras.join(' ')));
        obj.step = (p.items.length ? p.items : p.paras.slice(1)).map(function (s, i) {
          var t = stripTags(inlineMd(s));
          return { '@type': 'HowToStep', position: i + 1, name: t.split(/[.:]/)[0].slice(0, 80), text: t };
        });
      } else {
        obj = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: ucFirst(p.q), acceptedAnswer: { '@type': 'Answer', text: answerHTML(p, true).replace(/\n\s*/g, '') } }] };
      }
      var schema = p.q && totalWords ? jsonLd(obj) : '';
      code.value = outMode === 'html' ? html : outMode === 'schema' ? schema : (html && schema ? html + '\n\n' + schema : html || schema);

      // Voice
      var sents = splitSentences(p.paras.concat(p.items.map(function (i, k) { return (k === 0 && p.items.length > 1 ? 'First, ' : '') + i.replace(/([^.!?])$/, '$1.'); })).join(' ')), spoken = [], sw = 0;
      sents.some(function (s) { var n = wordsOf(s).length; if (sw && sw + n > 40) return true; spoken.push(s.trim()); sw += n; return sw >= 20; });
      var sp = stripTags(inlineMd(spoken.join(' ')));
      BT.$('#ao-voice', root).innerHTML = sp ? '<blockquote>' + esc(sp) + '</blockquote><p class="small muted" style="margin:0">' + plural(sw, 'word') + ' · about ' + Math.max(1, Math.round(sw / 150 * 60)) + ' seconds spoken · ' +
        (sw <= 35 ? '<span class="badge ok">Good length for voice</span>' : '<span class="badge warn">Long for a spoken answer</span>') + '</p>' : '<p class="muted" style="margin:0">Your spoken answer (the first sentence or two) appears here.</p>';
      BT.$('#ao-say', root).innerHTML = sp && window.speechSynthesis ? btn('data-a="say"', 'volume-2', 'Listen') : '';
      BT.$('#ao-say', root).setAttribute('data-text', sp);
    }
    var deb = BT.debounce(run, 200);
    qIn.addEventListener('input', deb);
    aIn.addEventListener('input', deb);
    BT.$('#ao-type', root).addEventListener('change', run);
    wireSeg(BT.$('#ao-schema', root), function (v) { schemaMode = v; run(); });
    wireSeg(BT.$('#ao-out', root), function (v) { outMode = v; run(); });
    onClickA(root, Object.assign({
      sample: function () {
        qIn.value = 'How do I register for GST online?';
        aIn.value = 'To register for GST online, apply on the official GST portal with your PAN, mobile number and email, then upload your documents and verify with an OTP. Approval usually takes about 7 working days.\n1. Go to the GST portal and choose Register Now.\n2. Enter your PAN, state, email and mobile number.\n3. Verify the OTPs and note your Temporary Reference Number.\n4. Fill in business, promoter and bank details.\n5. Upload documents and submit with EVC or a digital signature.';
        BT.$('#ao-type', root).value = 'auto';
        run();
      },
      clear: function () { qIn.value = ''; aIn.value = ''; run(); qIn.focus(); },
      say: function () {
        var t = BT.$('#ao-say', root).getAttribute('data-text');
        if (!t || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(t);
        u.lang = 'en-IN';
        window.speechSynthesis.speak(u);
      }
    }, wireCopyDl(root, function () { return code.value; }, function () { return outMode === 'schema' ? 'answer-schema.html' : 'answer.html'; }, 'text/html')));
    run();
  });

  // ==================================================== faq-schema-generator
  /** Block Markdown (paragraphs, - lists, 1. lists, line breaks) to safe HTML. */
  function mdToHtml(s) {
    return String(s || '').trim().split(/\n\s*\n/).map(function (b) {
      var ls = b.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      if (!ls.length) return '';
      if (ls.every(function (l) { return /^[-*•]\s+/.test(l); })) return '<ul>' + ls.map(function (l) { return '<li>' + inlineMd(l.replace(/^[-*•]\s+/, '')) + '</li>'; }).join('') + '</ul>';
      if (ls.every(function (l) { return /^\d+[.)]\s+/.test(l); })) return '<ol>' + ls.map(function (l) { return '<li>' + inlineMd(l.replace(/^\d+[.)]\s+/, '')) + '</li>'; }).join('') + '</ol>';
      return '<p>' + ls.map(inlineMd).join('<br>') + '</p>';
    }).filter(Boolean).join('');
  }
  /** Import "Q: … A: …" or question-line / answer-paragraph text. */
  function parseFaqText(txt) {
    var L = String(txt || '').replace(/\r/g, '').split('\n'), out = [], cur = null, mode = null;
    var hasQA = /^\s*(?:Q\d*[:.)]|Question\s*\d*:)/im.test(txt);
    function push() { if (cur && (cur.q.trim() || cur.a.trim())) out.push({ q: oneLine(cur.q), a: cur.a.trim() }); cur = null; }
    L.forEach(function (l) {
      var t = l.trim();
      var qm = t.match(/^(?:Q\d*[:.)]|Question\s*\d*:)\s*(.*)$/i), am = t.match(/^(?:A\d*[:.)]|Ans(?:wer)?\s*\d*:)\s*(.*)$/i);
      if (hasQA) {
        if (qm) { push(); cur = { q: qm[1], a: '' }; mode = 'q'; return; }
        if (am && cur) { cur.a = am[1]; mode = 'a'; return; }
        if (!cur) return;
        if (mode === 'q' && t) cur.q += ' ' + t;
        else if (mode === 'a') cur.a += '\n' + l;
      } else {
        var isQ = /\?\s*$/.test(t) && t.length <= 200 && !LIST_LINE.test(t);
        if (isQ) { push(); cur = { q: t.replace(/^(?:#+|\d+[.)])\s*/, ''), a: '' }; return; }
        if (!cur) return;
        cur.a += '\n' + l;
      }
    });
    push();
    return out.map(function (x) { return { q: x.q, a: x.a.replace(/\n{3,}/g, '\n\n').trim() }; });
  }

  impl('faq-schema-generator', function (root) {
    css();
    var KEY = 'geo-faq-v1';
    var S = lsGet(KEY, null);
    if (!S || !Array.isArray(S.items)) S = { title: 'Frequently asked questions', items: [{ q: '', a: '' }, { q: '', a: '' }] };
    var outMode = 'html';
    root.innerHTML = '<div class="split">' +
      '<div style="min-width:0"><div class="card"><div class="card-title"><h2 class="geo-h">Questions &amp; answers</h2><div class="btn-group">' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div></div>' +
      field('fq-title', 'Section heading', inp('fq-title', 'text', 'Frequently asked questions', S.title)) +
      '<div id="fq-rows" class="geo-rows"></div>' + btn('data-a="add"', 'plus', 'Add question') +
      '<p class="muted small" style="margin:10px 0 0">Answers support **bold**, *italic*, [links](https://…), “- ” bullet lists and blank lines between paragraphs.</p>' +
      '<details class="geo-imp"><summary>' + BT.icon('list-checks') + ' Bulk import from text</summary>' +
      field('fq-imp', 'Paste Q&amp;A text', ta('fq-imp', 'Q: Do you offer refunds?\nA: Yes, within 30 days of purchase.\n\nor\n\nDo you deliver in Kolkata?\nYes. We deliver across Kolkata within 2 days.', 6, 'mono'), 'Formats: “Q: … A: …” pairs, or a question line ending in “?” followed by its answer.') +
      '<div class="btn-group">' + btn('data-a="imp" data-m="append"', 'plus', 'Append', 'btn-primary') + btn('data-a="imp" data-m="replace"', 'replace', 'Replace all') + '</div>' +
      '</details></div></div>' +
      '<div style="min-width:0"><div class="card geo-sticky"><div class="card-title"><h2 class="geo-h">Output</h2>' + seg('fq-mode', [['html', 'HTML'], ['schema', 'JSON-LD'], ['both', 'Combined'], ['preview', 'Preview']], outMode, 'Output') + '</div>' +
      '<div class="geo-toolbar">' + chk('fq-open', 'First answer open', false) + '<span class="spacer"></span>' + btn('data-a="copy"', 'copy', 'Copy', 'btn-primary') + btn('data-a="dl"', 'download', 'Download') + '</div>' +
      '<label for="fq-out" class="sr-only">Generated code</label><textarea id="fq-out" class="mono geo-out" readonly spellcheck="false"></textarea>' +
      '<div id="fq-pv" class="geo-faqpv hidden" aria-live="polite"></div>' +
      '<div id="fq-msgs" class="geo-msgs" aria-live="polite"></div>' +
      '<p class="muted small" style="margin:12px 0 0">Place the HTML where visitors can read it and the JSON-LD anywhere on the same page. Schema must match the visible questions and answers. Google currently shows FAQ rich results only for well-known government and health websites, but the markup still describes your content clearly to search engines and AI systems.</p>' +
      '</div></div></div>';
    var rows = BT.$('#fq-rows', root), out = BT.$('#fq-out', root), pv = BT.$('#fq-pv', root);

    function renderRows() {
      var n = S.items.length;
      rows.innerHTML = n ? S.items.map(function (it, i) {
        return '<div class="geo-rowc"><div class="geo-rowh"><span>Question ' + (i + 1) + '</span><span class="geo-acts">' +
          upbtn('data-a="up" data-i="' + i + '"' + (i === 0 ? ' disabled' : ''), 'Move question ' + (i + 1) + ' up') +
          ibtn('data-a="down" data-i="' + i + '"' + (i === n - 1 ? ' disabled' : ''), 'chevron-down', 'Move question ' + (i + 1) + ' down') +
          ibtn('data-a="del" data-i="' + i + '"', 'trash-2', 'Remove question ' + (i + 1)) + '</span></div>' +
          '<div class="field"><label for="fq-q' + i + '">Question</label><input type="text" id="fq-q' + i + '" data-i="' + i + '" data-k="q" value="' + esc(it.q) + '" placeholder="e.g. How long does delivery take?"></div>' +
          '<div class="field" style="margin:0"><div class="geo-lrow"><label for="fq-a' + i + '">Answer</label><span class="geo-count" id="fq-c' + i + '"></span></div><textarea id="fq-a' + i + '" data-i="' + i + '" data-k="a" rows="3" style="min-height:84px" placeholder="A direct, complete answer. 40–80 words is a good target.">' + esc(it.a) + '</textarea></div></div>';
      }).join('') : '<p class="muted small" style="margin:0">No questions yet.</p>';
      update();
    }
    function valid() { return S.items.filter(function (it) { return it.q.trim() && it.a.trim(); }); }
    function buildHtml() {
      var items = valid();
      if (!items.length) return '';
      var open = val(root, 'fq-open');
      return '<section class="faq" aria-labelledby="faq-heading">\n  <h2 id="faq-heading">' + esc(oneLine(S.title) || 'Frequently asked questions') + '</h2>\n' + items.map(function (it, i) {
        return '  <details' + (open && i === 0 ? ' open' : '') + '>\n    <summary>' + esc(oneLine(it.q)) + '</summary>\n    <div>' + mdToHtml(it.a) + '</div>\n  </details>';
      }).join('\n') + '\n</section>';
    }
    function buildSchema() {
      var items = valid();
      if (!items.length) return '';
      return jsonLd({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(function (it) {
        return { '@type': 'Question', name: oneLine(it.q), acceptedAnswer: { '@type': 'Answer', text: mdToHtml(it.a) } };
      }) });
    }
    var save = BT.debounce(function () { lsSet(KEY, S); }, 400);
    function update() {
      var h = buildHtml(), j = buildSchema();
      out.value = outMode === 'html' ? h : outMode === 'schema' ? j : h && j ? h + '\n\n' + j : '';
      out.classList.toggle('hidden', outMode === 'preview');
      pv.classList.toggle('hidden', outMode !== 'preview');
      if (outMode === 'preview') pv.innerHTML = h || '<p class="muted">Add a question and an answer to see the preview.</p>';
      var msgs = [], seen = {};
      S.items.forEach(function (it, i) {
        var n = i + 1, q = oneLine(it.q), aw = wordsOf(stripTags(mdToHtml(it.a))).length;
        var c = BT.$('#fq-c' + i, root);
        if (c) c.innerHTML = aw ? aw + ' words' + (aw > 300 ? ' <span class="badge danger">Very long</span>' : aw > 150 ? ' <span class="badge warn">Long</span>' : '') : '';
        if (!q && !it.a.trim()) return;
        if (!q) msgs.push(['error', 'Question ' + n + ' is empty.']);
        if (!it.a.trim()) msgs.push(['error', 'Question ' + n + ' has no answer. It is left out of the output.']);
        var k = q.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
        if (q && seen[k]) msgs.push(['warn', 'Question ' + n + ' duplicates question ' + seen[k] + '. Each question should appear only once on the page.']);
        else if (q) seen[k] = n;
        if (q && !/\?$/.test(q)) msgs.push(['', 'Question ' + n + ' does not end with “?”. Write it as a real question.']);
        if (aw > 300) msgs.push(['warn', 'Answer ' + n + ' is ' + aw + ' words. Keep FAQ answers concise (under about 300 words) and link to a full guide for more.']);
        if (/\[[^\]]+\]\((?!https?:\/\/|mailto:|\/)/.test(it.a)) msgs.push(['warn', 'Answer ' + n + ' has a link that is not https://, mailto: or a /path, so it is shown as text.']);
      });
      var nv = valid().length;
      if (nv && !msgs.some(function (m) { return m[0] === 'error'; })) msgs.unshift(['ok', plural(nv, 'question') + ' ready. JSON-LD and HTML match.']);
      if (nv === 1) msgs.push(['', 'An FAQ section usually has at least 2–3 questions.']);
      BT.$('#fq-msgs', root).innerHTML = msgsHTML(msgs);
      save();
    }
    rows.addEventListener('input', function (e) {
      var t = e.target, i = t.getAttribute('data-i'), k = t.getAttribute('data-k');
      if (i == null || !k) return;
      S.items[+i][k] = t.value;
      update();
    });
    BT.$('#fq-title', root).addEventListener('input', function (e) { S.title = e.target.value; update(); });
    BT.$('#fq-open', root).addEventListener('change', update);
    wireSeg(BT.$('#fq-mode', root), function (v) { outMode = v; update(); });
    function mv(i, d) { var j = i + d; if (j < 0 || j >= S.items.length) return; var x = S.items[i]; S.items[i] = S.items[j]; S.items[j] = x; renderRows(); }
    onClickA(root, Object.assign({
      add: function () { S.items.push({ q: '', a: '' }); renderRows(); BT.$('#fq-q' + (S.items.length - 1), root).focus(); },
      del: function (b) { S.items.splice(+b.getAttribute('data-i'), 1); renderRows(); },
      up: function (b) { mv(+b.getAttribute('data-i'), -1); },
      down: function (b) { mv(+b.getAttribute('data-i'), 1); },
      imp: function (b) {
        var got = parseFaqText(BT.$('#fq-imp', root).value);
        if (!got.length) { BT.toast('No questions found. Use “Q: … A: …” or end questions with “?”', 'error'); return; }
        if (b.getAttribute('data-m') === 'replace') S.items = got;
        else S.items = S.items.filter(function (it) { return it.q.trim() || it.a.trim(); }).concat(got);
        renderRows();
        BT.toast('Imported ' + plural(got.length, 'question'));
      },
      sample: function () {
        S.title = 'Frequently asked questions';
        BT.$('#fq-title', root).value = S.title;
        S.items = [
          { q: 'Are BISCS Tools free to use?', a: 'Yes. Every tool is **free**, with no sign-up and no watermark on your files.' },
          { q: 'Are my files uploaded to a server?', a: 'No. Files are processed inside your browser, on your own device, so they never leave your computer or phone.\n\nRead our [privacy policy](https://www.biscsindia.com/privacy/) for details.' },
          { q: 'Which GST rates does the GST calculator support?', a: 'It supports the main GST slabs:\n- 5%\n- 18%\n- 40% (special rate)\n\nYou can also enter a custom rate.' },
          { q: 'Where is BISCS India based?', a: 'BISCS India is based in Kolkata, West Bengal, and serves clients across India.' }
        ];
        renderRows();
      },
      clear: function () { if (!window.confirm('Remove all questions?')) return; S.items = [{ q: '', a: '' }]; renderRows(); }
    }, wireCopyDl(root, function () { return outMode === 'preview' ? buildHtml() : out.value; }, function () { return 'faq.html'; }, 'text/html')));
    renderRows();
  });

  // ====================================================== question-generator
  // Each group: [label, intent, templates]. Template: [text, fit] where fit is
  // 'faq' (short factual answer) or 'article' (needs a full page). {k} keyword,
  // {loc} location, {aud} audience: templates with an unset slot are skipped.
  var QGROUPS = [
    ['What', 'Informational', [['What is {k}?', 'faq'], ['What is {k} used for?', 'faq'], ['What are the benefits of {k}?', 'article'], ['What are the different types of {k}?', 'article'], ['What does {k} include?', 'faq'], ['What should I know before choosing {k}?', 'article'], ['What is {k} in {loc}?', 'faq'], ['What is the future of {k}?', 'article']]],
    ['Why', 'Informational', [['Why is {k} important?', 'faq'], ['Why do businesses need {k}?', 'article'], ['Why is {k} important for {aud}?', 'faq'], ['Why does {k} fail?', 'article'], ['Why choose {k} over alternatives?', 'article']]],
    ['How', 'Informational', [['How does {k} work?', 'article'], ['How to get started with {k}?', 'article'], ['How to choose the right {k}?', 'article'], ['How to use {k} effectively?', 'article'], ['How can {aud} benefit from {k}?', 'article'], ['How to measure the results of {k}?', 'article'], ['How is {k} done in {loc}?', 'article']]],
    ['Can / Is / Does', 'Informational', [['Is {k} worth it?', 'faq'], ['Is {k} safe?', 'faq'], ['Is {k} suitable for {aud}?', 'faq'], ['Is {k} legal in {loc}?', 'faq'], ['Can I do {k} myself?', 'faq'], ['Can {k} be done online?', 'faq'], ['Does {k} really work?', 'faq'], ['Do I need {k}?', 'faq']]],
    ['Which / Best', 'Commercial', [['Which {k} is best?', 'article'], ['What is the best {k} for {aud}?', 'article'], ['Best {k} in {loc}', 'article'], ['Which {k} is right for me?', 'article'], ['Top {k} options compared', 'article']]],
    ['Comparisons (vs)', 'Commercial', [['{k} vs alternatives: which is better?', 'article'], ['{k} vs doing it yourself', 'article'], ['Pros and cons of {k}', 'article'], ['What are the alternatives to {k}?', 'article'], ['Free vs paid {k}: what is the difference?', 'article']]],
    ['Cost & price', 'Commercial', [['How much does {k} cost?', 'faq'], ['How much does {k} cost in {loc}?', 'faq'], ['Is {k} expensive?', 'faq'], ['What affects the price of {k}?', 'article'], ['Is there an affordable {k} for {aud}?', 'faq'], ['How to save money on {k}?', 'article']]],
    ['Near me & local', 'Local', [['{k} near me', 'faq'], ['Where can I find {k} near me?', 'faq'], ['{k} in {loc}', 'article'], ['Who offers {k} in {loc}?', 'faq'], ['How to find a reliable {k} provider in {loc}?', 'article']]],
    ['For beginners', 'Informational', [['{k} for beginners', 'article'], ['{k} basics explained', 'article'], ['How to learn {k} as a beginner?', 'article'], ['What is the easiest way to start with {k}?', 'faq'], ['{k} guide for {aud}', 'article']]],
    ['Without', 'Informational', [['Can I do {k} without experience?', 'faq'], ['How to do {k} without spending money?', 'article'], ['Is {k} possible without a professional?', 'faq'], ['{k} without technical knowledge', 'article']]],
    ['Free & online', 'Transactional', [['Free {k}', 'faq'], ['Is there a free {k}?', 'faq'], ['{k} online', 'faq'], ['Best free {k} tools', 'article'], ['Can I get {k} online in {loc}?', 'faq']]],
    ['Mistakes', 'Informational', [['Common {k} mistakes to avoid', 'article'], ['What are the biggest mistakes in {k}?', 'article'], ['What should you not do in {k}?', 'faq'], ['{k} mistakes {aud} make', 'article']]],
    ['Examples', 'Informational', [['{k} examples', 'article'], ['What is an example of {k}?', 'faq'], ['Real-life examples of {k}', 'article'], ['{k} examples for {aud}', 'article'], ['{k} case studies from {loc}', 'article']]],
    ['Steps & process', 'Informational', [['{k} step by step', 'article'], ['What are the steps involved in {k}?', 'article'], ['{k} checklist', 'article'], ['What documents are needed for {k}?', 'faq'], ['What is the process for {k} in {loc}?', 'article']]],
    ['Time', 'Informational', [['How long does {k} take?', 'faq'], ['When is the best time for {k}?', 'faq'], ['How often should you do {k}?', 'faq'], ['How long before {k} shows results?', 'faq']]],
    ['Prepositions', 'Mixed', [['{k} for small businesses', 'article'], ['{k} for {aud}', 'article'], ['{k} for students', 'article'], ['{k} with examples', 'article'], ['{k} with free tools', 'article'], ['{k} without experience', 'article'], ['{k} near {loc}', 'faq'], ['{k} vs alternatives', 'article'], ['How to switch to {k}', 'article']]]
  ];
  function genQuestions(k, loc, aud) {
    var out = [], seen = {};
    k = oneLine(k); loc = oneLine(loc); aud = oneLine(aud);
    if (!k) return out;
    QGROUPS.forEach(function (g) {
      g[2].forEach(function (t) {
        if ((/\{loc\}/.test(t[0]) && !loc) || (/\{aud\}/.test(t[0]) && !aud)) return;
        var s = t[0].replace(/\{k\}/g, k).replace(/\{loc\}/g, loc).replace(/\{aud\}/g, aud);
        s = ucFirst(s.replace(/\s+/g, ' ').trim());
        var key = s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
        if (seen[key]) return;
        seen[key] = 1;
        out.push({ text: s, group: g[0], intent: /near|in \{loc\}|\{loc\}/.test(t[0]) && loc ? 'Local' : g[1], fit: t[1], key: key });
      });
    });
    return out;
  }

  impl('question-generator', function (root) {
    css();
    var QS = [], starred = lsGet('geo-q-stars', {}) || {}, fitF = 'all';
    root.innerHTML = '<div class="card"><div class="row cols-3">' +
      field('qg-k', 'Seed keyword', inp('qg-k', 'text', 'e.g. GST registration'), 'A topic, product or service.') +
      field('qg-loc', 'Location (optional)', inp('qg-loc', 'text', 'e.g. India or Kolkata', '', ' list="qg-locs"') + '<datalist id="qg-locs">' + ['India', 'Kolkata', 'West Bengal', 'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'].map(function (c) { return '<option value="' + c + '">'; }).join('') + '</datalist>') +
      field('qg-aud', 'Audience (optional)', inp('qg-aud', 'text', 'e.g. small businesses', '', ' list="qg-auds"') + '<datalist id="qg-auds">' + ['small businesses', 'startups', 'students', 'freelancers', 'beginners', 'homeowners', 'parents', 'doctors', 'shop owners', 'exporters'].map(function (c) { return '<option value="' + c + '">'; }).join('') + '</datalist>') +
      '</div><div class="notice">' + BT.icon('info') + '<span><strong>Idea generation only.</strong> Questions are built offline from curated templates, so there is no search volume or ranking data. Check demand in Google Search Console, the “People also ask” box, or a keyword tool before writing.</span></div></div>' +
      '<div class="card"><div class="geo-toolbar"><span class="geo-count" id="qg-count" aria-live="polite"></span><span class="spacer"></span>' +
      seg('qg-fit', [['all', 'All'], ['faq', 'FAQ'], ['article', 'Article'], ['star', '★ Starred']], fitF, 'Filter questions') + '</div>' +
      '<div class="geo-toolbar"><label class="sr-only" for="qg-filter">Filter questions</label><input type="search" id="qg-filter" placeholder="Filter questions…" style="max-width:260px;min-height:36px;padding:6px 10px">' + '<span class="spacer"></span>' +
      btn('data-a="copy"', 'copy', 'Copy') + btn('data-a="txt"', 'download', 'TXT') + btn('data-a="csv"', 'sheet', 'CSV', 'btn-primary') + '</div>' +
      '<p class="muted small" style="margin:0 0 12px">Star the questions you want to use; exports include starred questions only when you have starred some. <strong>FAQ</strong> = a short, direct answer works (FAQ section or snippet). <strong>Article</strong> = needs its own page or a full section.</p>' +
      '<div id="qg-res"></div></div>';
    var res = BT.$('#qg-res', root);
    function key() { return val(root, 'qg-k').toLowerCase(); }
    function visible() {
      var f = val(root, 'qg-filter').toLowerCase();
      return QS.filter(function (q) {
        if (fitF === 'star') { if (!starred[q.key]) return false; } else if (fitF !== 'all' && q.fit !== fitF) return false;
        return !f || q.text.toLowerCase().indexOf(f) > -1;
      });
    }
    function hl(t) {
      var k = val(root, 'qg-k');
      if (!k) return esc(t);
      var i = t.toLowerCase().indexOf(k.toLowerCase());
      return i < 0 ? esc(t) : esc(t.slice(0, i)) + '<b>' + esc(t.slice(i, i + k.length)) + '</b>' + esc(t.slice(i + k.length));
    }
    function run() {
      QS = genQuestions(val(root, 'qg-k'), val(root, 'qg-loc'), val(root, 'qg-aud'));
      render();
    }
    function render() {
      var list = visible(), nStar = QS.filter(function (q) { return starred[q.key]; }).length;
      BT.$('#qg-count', root).innerHTML = QS.length ? '<strong>' + list.length + '</strong> of ' + plural(QS.length, 'idea') + ' · ' + nStar + ' starred' : '';
      if (!key()) { res.innerHTML = '<p class="muted" style="margin:0">Type a seed keyword to generate question ideas.</p>'; return; }
      if (!list.length) { res.innerHTML = '<p class="muted" style="margin:0">No questions match this filter.</p>'; return; }
      var groups = {}, order = [];
      list.forEach(function (q) { if (!groups[q.group]) { groups[q.group] = []; order.push(q.group); } groups[q.group].push(q); });
      res.innerHTML = '<div class="geo-qgrid">' + order.map(function (g) {
        return '<section class="geo-qg"><h3>' + esc(g) + ' <span class="badge">' + esc(groups[g][0].intent) + '</span></h3>' + groups[g].map(function (q) {
          var on = !!starred[q.key];
          return '<div class="geo-qi"><button type="button" class="geo-star" data-a="star" data-k="' + esc(q.key) + '" aria-pressed="' + on + '" aria-label="Star: ' + esc(q.text) + '">' + BT.icon('star') + '</button>' +
            '<span class="tx">' + hl(q.text) + '</span><span class="fit">' + (q.fit === 'faq' ? 'FAQ' : 'Article') + '</span></div>';
        }).join('') + '</section>';
      }).join('') + '</div>';
    }
    function exportList() {
      var anyStar = QS.some(function (q) { return starred[q.key]; });
      return anyStar ? QS.filter(function (q) { return starred[q.key]; }) : visible();
    }
    function csvCell(s) { s = String(s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
    var deb = BT.debounce(run, 150);
    ['qg-k', 'qg-loc', 'qg-aud'].forEach(function (id) { BT.$('#' + id, root).addEventListener('input', deb); });
    BT.$('#qg-filter', root).addEventListener('input', BT.debounce(render, 100));
    wireSeg(BT.$('#qg-fit', root), function (v) { fitF = v; render(); });
    onClickA(root, {
      star: function (b) {
        var k = b.getAttribute('data-k');
        if (starred[k]) delete starred[k]; else starred[k] = 1;
        lsSet('geo-q-stars', starred);
        b.setAttribute('aria-pressed', starred[k] ? 'true' : 'false');
        if (fitF === 'star') render(); else BT.$('#qg-count', root).innerHTML = '<strong>' + visible().length + '</strong> of ' + plural(QS.length, 'idea') + ' · ' + Object.keys(starred).filter(function (x) { return QS.some(function (q) { return q.key === x; }); }).length + ' starred';
      },
      copy: function () { var l = exportList(); if (!l.length) { BT.toast('No questions to copy', 'error'); return; } BT.copy(l.map(function (q) { return q.text; }).join('\n'), 'Copied ' + plural(l.length, 'question')); },
      txt: function () { var l = exportList(); if (!l.length) { BT.toast('No questions to export', 'error'); return; } BT.download(l.map(function (q) { return q.text; }).join('\n') + '\n', 'questions.txt', 'text/plain;charset=utf-8'); },
      csv: function () {
        var l = exportList();
        if (!l.length) { BT.toast('No questions to export', 'error'); return; }
        var rows = [['Question', 'Group', 'Intent', 'Best as', 'Starred']].concat(l.map(function (q) { return [q.text, q.group, q.intent, q.fit === 'faq' ? 'FAQ answer' : 'Full article', starred[q.key] ? 'yes' : '']; }));
        BT.download('﻿' + rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n') + '\r\n', 'questions.csv', 'text/csv;charset=utf-8');
      }
    });
    run();
  });

  /*__PART_E__*/
})();
