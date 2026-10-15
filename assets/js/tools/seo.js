/*
 * BISCS Tools — SEO tools.
 * meta-tag-generator, serp-preview, social-share-preview, schema-markup-generator,
 * robots-txt-generator, sitemap-generator, keyword-density-checker, utm-builder,
 * on-page-seo-checker, backlink-outreach-helper.
 *
 * Everything runs in the browser on text the user pastes; no other website is
 * ever fetched. Pasted HTML is parsed with DOMParser (an inert document), so
 * its scripts never run and it is never inserted into the live page.
 */
(function () {
  'use strict';
  var BT = window.BT;
  var esc = BT.esc;

  // Keep a local copy of each implementation so a tool can still start if
  // core booted before this deferred script ran (same pattern as dev.js).
  var LOCAL = {};
  var coreImpl = BT.impl;
  BT.impl = function (id, fn) { LOCAL[id] = fn; return coreImpl.apply(this, arguments); };

  // =================================================================== shared
  var CSS = [
    '.seo-h{font-size:1.05rem;margin:0}',
    '.seo-lrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:space-between}',
    '.seo-lrow>label{font-size:.85rem;font-weight:600;color:var(--text-2)}',
    '.seo-count{font-size:.78rem;color:var(--text-3);font-variant-numeric:tabular-nums;display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap}',
    '.seo-meter{height:5px;border-radius:99px;background:var(--surface-2);border:1px solid var(--border);overflow:hidden;margin-top:2px}',
    '.seo-meter>span{display:block;height:100%;width:0;transition:width .15s}',
    '.seo-checks{display:flex;flex-wrap:wrap;gap:10px 18px;margin:4px 0 14px}',
    '.seo-out{min-height:340px;font-size:.82rem;line-height:1.55}',
    '.seo-msgs{display:flex;flex-direction:column;gap:8px;margin-top:12px}',
    '.seo-msgs:empty{display:none}',
    '.seo-sec{font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);margin:6px 0 10px}',
    '.seo-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}',
    '.seo-toolbar .spacer{flex:1}',
    '.seo-inl{display:inline-flex;align-items:center;gap:8px;font-size:.88rem;font-weight:600;color:var(--text-2)}',
    '.seo-inl select{width:auto;min-height:34px;padding:5px 10px}',
    '.seo-file{position:relative;overflow:hidden}',
    '.seo-file input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%}',
    '.seo-file:focus-within{box-shadow:var(--ring)}',
    '.seo-scroll{overflow-x:auto;max-width:100%;padding-bottom:4px}',
    /* Google result look-alike (own palette so it reads like Google in both themes) */
    '.seo-g{--g-bg:#fff;--g-title:#1a0dab;--g-text:#4d5156;--g-site:#202124;--g-url:#4d5156;--g-date:#70757a;--g-fav:#f1f3f4;--g-border:#dadce0;background:var(--g-bg);border:1px solid var(--border);border-radius:12px;padding:18px 20px;font-family:Arial,Helvetica,sans-serif;color:var(--g-text)}',
    ':root[data-theme="dark"] .seo-g{--g-bg:#202124;--g-title:#99c3ff;--g-text:#bdc1c6;--g-site:#dadce0;--g-url:#bdc1c6;--g-date:#9aa0a6;--g-fav:#303134;--g-border:#3c4043}',
    '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .seo-g{--g-bg:#202124;--g-title:#99c3ff;--g-text:#bdc1c6;--g-site:#dadce0;--g-url:#bdc1c6;--g-date:#9aa0a6;--g-fav:#303134;--g-border:#3c4043}}',
    '.seo-g .gd{width:600px}',
    '.seo-g.mob{width:360px;max-width:100%;border-radius:18px;padding:16px}',
    '.seo-g .gsite{display:flex;align-items:center;gap:12px;margin-bottom:6px;min-width:0}',
    '.seo-g .gfav{width:28px;height:28px;border-radius:50%;background:var(--g-fav);border:1px solid var(--g-border);display:grid;place-items:center;font-size:13px;font-weight:700;color:var(--g-site);flex:none;overflow:hidden}',
    '.seo-g .gfav img{width:18px;height:18px;object-fit:contain}',
    '.seo-g .gname{font-size:14px;color:var(--g-site);line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.seo-g .gurl{font-size:12px;color:var(--g-url);line-height:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.seo-g .gtitle{font-size:20px;line-height:26px;color:var(--g-title);margin:0 0 4px;font-weight:400;white-space:nowrap;overflow:hidden}',
    '.seo-g.mob .gtitle{font-size:18px;line-height:24px;white-space:normal}',
    '.seo-g .gdesc{font-size:14px;line-height:22px;color:var(--g-text);word-wrap:break-word}',
    '.seo-g .gdesc b{color:var(--g-site);font-weight:700}',
    '.seo-g .gdate{color:var(--g-date)}',
    '.seo-g .gempty{font-style:italic}',
    /* Social cards */
    '.seo-social{display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))}',
    '.seo-sc{min-width:0}',
    '.seo-sc .lbl{font-size:.8rem;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;display:flex;align-items:center;gap:6px}',
    '.seo-img{aspect-ratio:1.91/1;width:100%;background:#d9dde5 center/cover no-repeat;display:grid;place-items:center;color:#6b7280;overflow:hidden}',
    '.seo-img img{width:100%;height:100%;object-fit:cover;display:block}',
    '.seo-img .icon{width:34px;height:34px;opacity:.6}',
    '.seo-clamp1,.seo-clamp2,.seo-clamp3{display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}',
    '.seo-clamp1{-webkit-line-clamp:1}.seo-clamp2{-webkit-line-clamp:2}.seo-clamp3{-webkit-line-clamp:3}',
    '.seo-wa{background:#efeae2;border-radius:14px;padding:14px;font-family:Helvetica,Arial,sans-serif}',
    '.seo-wa .bub{background:#d9fdd3;border-radius:10px;padding:4px;max-width:330px;margin-left:auto;box-shadow:0 1px .5px rgba(0,0,0,.13)}',
    '.seo-wa .pv{background:#d1f4cc;border-radius:7px;overflow:hidden}',
    '.seo-wa .tx{padding:7px 9px;color:#111b21}',
    '.seo-wa .t{font-weight:600;font-size:14px;line-height:19px}',
    '.seo-wa .d{font-size:12.5px;color:#54656f;line-height:17px;margin-top:2px}',
    '.seo-wa .u{font-size:12px;color:#4a5e55;margin-top:3px}',
    '.seo-wa .lnk{font-size:14px;color:#01628d;padding:6px 6px 2px;word-break:break-all}',
    '.seo-wa .tm{font-size:11px;color:#4f5d65;text-align:right;padding:0 6px 2px}',
    '.seo-fb{background:#fff;border:1px solid #dadde1;border-radius:8px;overflow:hidden;font-family:Helvetica,Arial,sans-serif}',
    '.seo-fb .ft{background:#f0f2f5;padding:10px 12px;border-top:1px solid #dadde1}',
    '.seo-fb .u{font-size:12px;color:#65676b;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.seo-fb .t{font-size:16px;font-weight:600;color:#050505;line-height:20px;margin-top:3px}',
    '.seo-fb .d{font-size:14px;color:#65676b;line-height:20px;margin-top:2px}',
    '.seo-li{background:#fff;border:1px solid #e0dfdc;border-radius:8px;overflow:hidden;font-family:-apple-system,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif}',
    '.seo-li .ft{padding:10px 12px}',
    '.seo-li .t{font-size:14px;font-weight:600;color:rgba(0,0,0,.9);line-height:20px}',
    '.seo-li .u{font-size:12px;color:rgba(0,0,0,.6);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.seo-x{font-family:-apple-system,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif}',
    '.seo-x .card-x{position:relative;border:1px solid #cfd9de;border-radius:16px;overflow:hidden;background:#fff}',
    '.seo-x .ov{position:absolute;left:12px;bottom:12px;max-width:calc(100% - 24px);background:rgba(0,0,0,.77);color:#fff;font-size:13px;line-height:16px;padding:2px 6px;border-radius:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.seo-x .u{font-size:13px;color:var(--text-3);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.seo-x .sm{display:flex;align-items:stretch}',
    '.seo-x .sm .seo-img{aspect-ratio:1/1;width:130px;flex:none;border-right:1px solid #cfd9de}',
    '.seo-x .sm .tx{padding:10px 12px;min-width:0;font-size:15px;color:#0f1419;display:flex;flex-direction:column;justify-content:center;gap:2px}',
    '.seo-x .sm .tx .d{color:var(--text-3);font-size:14px}',
    /* Rows editor */
    '.seo-rows{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}',
    '.seo-rowc{border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;background:var(--surface-2);position:relative}',
    '.seo-rowc .field{margin-bottom:10px}.seo-rowc .field:last-child{margin-bottom:0}',
    '.seo-rowh{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;font-size:.82rem;font-weight:700;color:var(--text-3)}',
    '.seo-rule{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.9fr) minmax(0,1.4fr) auto;gap:8px;align-items:end;margin-bottom:8px}',
    '.seo-rule .field{margin:0}',
    '@media (max-width:640px){.seo-rule{grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;padding-bottom:12px;margin-bottom:12px;border-bottom:1px dashed var(--border-strong)}.seo-rule .r-path{grid-column:1/3;grid-row:2}.seo-rule .r-del{grid-row:1/3;grid-column:3;align-self:center}}',
    '.seo-icon-btn{width:36px;height:36px;padding:0}',
    /* Keyword density */
    '.seo-kd-bar{display:inline-block;height:8px;border-radius:99px;background:var(--brand);vertical-align:middle;min-width:2px}',
    '.seo-sort{background:none;border:0;font:inherit;color:inherit;text-transform:inherit;letter-spacing:inherit;cursor:pointer;padding:0;display:inline-flex;align-items:center;gap:4px}',
    '.seo-sort:focus-visible{box-shadow:var(--ring)}',
    '.seo-kw-cell{white-space:normal!important;word-break:break-word;min-width:120px}',
    /* UTM */
    '.seo-link{font-family:var(--mono);font-size:.88rem;word-break:break-all;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 14px;min-height:46px}',
    '.seo-link .q{color:var(--brand)}.seo-link .hh{color:var(--warn)}',
    '.seo-presets{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}',
    '.seo-hist{display:flex;flex-direction:column;gap:8px}',
    '.seo-hist-item{display:flex;gap:8px;align-items:center;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface)}',
    '.seo-hist-item .u{flex:1;min-width:0;font-family:var(--mono);font-size:.8rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.seo-qr{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-top:12px}',
    '.seo-qr .box{background:#fff;padding:10px;border-radius:12px;border:1px solid var(--border);width:180px;height:180px;display:grid;place-items:center}',
    '.seo-qr .box svg,.seo-qr .box img{width:160px;height:160px}',
    /* On-page checker */
    '.seo-score{display:flex;align-items:center;gap:20px;flex-wrap:wrap}',
    '.seo-ring{--p:0;--c:var(--ok);width:116px;height:116px;border-radius:50%;flex:none;display:grid;place-items:center;background:conic-gradient(var(--c) calc(var(--p)*1%),var(--surface-2) 0)}',
    '.seo-ring>div{width:92px;height:92px;border-radius:50%;background:var(--surface);display:grid;place-items:center;text-align:center;line-height:1.1}',
    '.seo-ring b{font-size:1.9rem;font-weight:800;font-variant-numeric:tabular-nums}',
    '.seo-ring small{display:block;font-size:.72rem;color:var(--text-3);font-weight:600}',
    '.seo-clist{display:flex;flex-direction:column;gap:8px}',
    '.seo-ci{border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;background:var(--surface)}',
    '.seo-ci .hd{display:flex;align-items:flex-start;gap:10px}',
    '.seo-ci .hd .badge{flex:none;min-width:48px;justify-content:center;margin-top:1px}',
    '.seo-ci .nm{font-weight:650;font-size:.93rem}',
    '.seo-ci .dt{color:var(--text-2);font-size:.86rem;margin-top:2px;word-break:break-word}',
    '.seo-ci ul{margin:8px 0 0;padding-left:20px;font-size:.84rem;color:var(--text-2);max-height:220px;overflow:auto;word-break:break-all}',
    '.seo-ci.fail{border-left:4px solid var(--danger)}.seo-ci.warn{border-left:4px solid var(--warn)}.seo-ci.pass{border-left:4px solid var(--ok)}.seo-ci.info{border-left:4px solid var(--brand)}',
    '.seo-tree{font-family:var(--mono);font-size:.82rem;line-height:1.7;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;max-height:360px;overflow:auto}',
    '.seo-tree div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.seo-tree .tg{display:inline-block;min-width:28px;font-weight:700;color:var(--brand)}',
    '.seo-tree .bad .tg{color:var(--danger)}',
    /* Backlink helper */
    '.seo-prog{height:12px;border-radius:99px;background:var(--surface-2);border:1px solid var(--border);overflow:hidden}',
    '.seo-prog>span{display:block;height:100%;background:linear-gradient(90deg,var(--ok),var(--brand));transition:width .25s}',
    '.seo-bl-group{margin-top:18px}',
    '.seo-bl-group h3{display:flex;align-items:center;gap:8px;justify-content:space-between;flex-wrap:wrap}',
    '.seo-bl-item{display:flex;gap:12px;align-items:flex-start;padding:12px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);margin-bottom:8px}',
    '.seo-bl-item.done{background:var(--ok-soft)}',
    '.seo-bl-item.done .nm{text-decoration:line-through;text-decoration-color:var(--text-3)}',
    '.seo-bl-item input{margin-top:3px;flex:none}',
    '.seo-bl-item .nm{font-weight:650}',
    '.seo-bl-item .why{font-size:.87rem;color:var(--text-2);margin-top:2px}',
    '.seo-bl-item .tip{font-size:.83rem;color:var(--text-3);margin-top:4px}',
    '.seo-tpl{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr))}',
    '.seo-tpl textarea{min-height:300px;font-size:.86rem}'
  ].join('\n');

  function css() {
    if (document.getElementById('seo-css')) return;
    var s = document.createElement('style');
    s.id = 'seo-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  function btn(attrs, icon, label, cls) {
    return '<button type="button" class="btn btn-sm ' + (cls || '') + '" ' + attrs + '>' +
      (icon ? BT.icon(icon) : '') + '<span>' + label + '</span></button>';
  }
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
  function segVal(el) { var b = BT.$('button.active', el); return b ? b.getAttribute('data-v') : null; }
  function notice(kind, msg) {
    return '<div class="notice ' + kind + '">' + BT.icon(kind === 'ok' ? 'check' : 'info') + '<span>' + msg + '</span></div>';
  }
  /** Delegate clicks on [data-a] elements to handlers. */
  function onClickA(root, map) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (b && root.contains(b) && map[b.getAttribute('data-a')]) map[b.getAttribute('data-a')](b, e);
    });
  }
  /** A labelled form field. `input` is the control's HTML. */
  function field(id, label, input, hint, counter) {
    return '<div class="field">' +
      (counter ? '<div class="seo-lrow"><label for="' + id + '">' + label + '</label><span class="seo-count" id="' + id + '-c" aria-live="polite"></span></div>'
        : '<label for="' + id + '">' + label + '</label>') +
      input + (hint ? '<span class="hint">' + hint + '</span>' : '') + '</div>';
  }
  function inp(id, type, ph, val, extra) {
    return '<input type="' + (type || 'text') + '" id="' + id + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') +
      (val != null && val !== '' ? ' value="' + esc(val) + '"' : '') + (extra || '') + '>';
  }
  function sel(id, opts, val) {
    return '<select id="' + id + '">' + opts.map(function (o) {
      var v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o;
      return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(l) + '</option>';
    }).join('') + '</select>';
  }
  function fileBtn(id, accept, label) {
    return '<span class="btn btn-sm btn-ghost seo-file">' + BT.icon('upload') + '<span>' + (label || 'Upload') + '</span>' +
      '<input type="file" id="' + id + '" accept="' + accept + '" aria-label="' + esc(label || 'Upload file') + '"></span>';
  }
  function val(root, id) { var el = BT.$('#' + id, root); return el ? (el.type === 'checkbox' ? el.checked : el.value.trim()) : ''; }
  function plural(n, w, ws) { return BT.fmtNum(n, 0) + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function lsGet(key, def) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; }
  }
  function lsSet(key, v) {
    try { if (v == null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(v)); return true; } catch (e) { return false; }
  }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  /** Parse an absolute http(s) URL or return null. */
  function httpUrl(s) {
    try {
      var u = new URL(String(s).trim());
      return /^https?:$/.test(u.protocol) && u.hostname ? u : null;
    } catch (e) { return null; }
  }
  function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s); }

  // ---------------------------------------------------- text width (canvas)
  var measureCtx;
  function textWidth(text, font) {
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
    measureCtx.font = font;
    return measureCtx.measureText(String(text)).width;
  }
  /**
   * Cut text so it fits maxPx in the given font, breaking at a word when
   * possible and appending an ellipsis (like Google does).
   */
  function fitWidth(text, maxPx, font, prefixPx) {
    text = String(text || '').replace(/\s+/g, ' ').trim();
    var budget = maxPx - (prefixPx || 0);
    if (textWidth(text, font) <= budget) return { text: text, cut: false };
    var ell = ' …', room = budget - textWidth(ell, font);
    var lo = 0, hi = text.length;
    while (lo < hi) {
      var mid = (lo + hi + 1) >> 1;
      if (textWidth(text.slice(0, mid), font) <= room) lo = mid; else hi = mid - 1;
    }
    var cut = text.slice(0, lo);
    var sp = cut.lastIndexOf(' ');
    if (sp > lo * 0.6) cut = cut.slice(0, sp);
    return { text: cut.replace(/[\s,;:\-–—|]+$/, '') + ' …', cut: true };
  }
  function meterHTML(frac, color) {
    return '<span style="width:' + Math.max(2, Math.min(100, frac * 100)).toFixed(1) + '%;background:' + color + '"></span>';
  }
  var COLORS = { ok: 'var(--ok)', warn: 'var(--warn)', danger: 'var(--danger)', muted: 'var(--border-strong)' };

  /** Status of a title length: {kind, msg}. */
  function titleStatus(t, px) {
    var n = [...t].length;
    if (!n) return { kind: 'muted', msg: 'Empty' };
    if (px > 600) return { kind: 'danger', msg: 'Too long, will be cut off' };
    if (px > 580) return { kind: 'warn', msg: 'At the limit' };
    if (n < 30) return { kind: 'warn', msg: 'Short' };
    if (n < 50) return { kind: 'ok', msg: 'Good (could be a little longer)' };
    return { kind: 'ok', msg: 'Ideal length' };
  }
  function descStatus(t, px) {
    var n = [...t].length;
    if (!n) return { kind: 'muted', msg: 'Empty' };
    if (n > 160 || px > 920) return { kind: 'warn', msg: 'Long, may be cut off' };
    if (n < 70) return { kind: 'warn', msg: 'Short' };
    if (n < 120) return { kind: 'ok', msg: 'Good (120–160 is ideal)' };
    return { kind: 'ok', msg: 'Ideal length' };
  }
  function counterHTML(n, px, st, maxChars) {
    var badge = st.kind === 'muted' ? '' : '<span class="badge ' + (st.kind === 'danger' ? 'danger' : st.kind) + '">' + esc(st.msg) + '</span>';
    return '<span>' + n + ' / ' + maxChars + ' chars · ~' + Math.round(px) + ' px</span>' + badge;
  }

  // ======================================================= meta-tag-generator
  var LANGS = [['en-IN', 'English (India) en-IN'], ['en', 'English en'], ['en-US', 'English (US) en-US'], ['en-GB', 'English (UK) en-GB'],
    ['hi-IN', 'Hindi hi-IN'], ['bn-IN', 'Bengali bn-IN'], ['ta-IN', 'Tamil ta-IN'], ['te-IN', 'Telugu te-IN'], ['mr-IN', 'Marathi mr-IN'],
    ['gu-IN', 'Gujarati gu-IN'], ['kn-IN', 'Kannada kn-IN'], ['ml-IN', 'Malayalam ml-IN'], ['pa-IN', 'Punjabi pa-IN'], ['or-IN', 'Odia or-IN'], ['ur-IN', 'Urdu ur-IN']];

  BT.impl('meta-tag-generator', function (root) {
    css();
    root.innerHTML = '<div class="split">' +
      '<div class="card"><div class="card-title"><h2 class="seo-h">Page details</h2><div class="btn-group">' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div></div>' +
      field('mt-title', 'Page title', inp('mt-title', 'text', 'e.g. Free Online Tools for Indian Businesses | BISCS'), null, true) +
      '<div class="seo-meter" id="mt-title-m" aria-hidden="true"></div>' +
      '<div style="height:12px"></div>' +
      field('mt-desc', 'Meta description', '<textarea id="mt-desc" rows="3" style="min-height:90px" placeholder="One or two sentences that sell the page in search results."></textarea>', null, true) +
      '<div class="seo-meter" id="mt-desc-m" aria-hidden="true"></div>' +
      '<div style="height:12px"></div>' +
      '<div class="row cols-2">' +
      field('mt-url', 'Canonical URL', inp('mt-url', 'url', 'https://www.example.com/page/')) +
      field('mt-site', 'Site name', inp('mt-site', 'text', 'BISCS India')) +
      field('mt-img', 'Share image URL', inp('mt-img', 'url', 'https://www.example.com/og-image.jpg'), '1200 × 630 px recommended') +
      field('mt-imgalt', 'Image alt text', inp('mt-imgalt', 'text', 'Describe the image')) +
      field('mt-tw', 'X (Twitter) handle', inp('mt-tw', 'text', '@yourbrand')) +
      field('mt-author', 'Author', inp('mt-author', 'text', 'Your name or company')) +
      field('mt-lang', 'Language', sel('mt-lang', LANGS, 'en-IN')) +
      field('mt-type', 'Page type (og:type)', sel('mt-type', [['website', 'Website / home page'], ['article', 'Article / blog post'], ['profile', 'Profile']], 'website')) +
      field('mt-card', 'X card type', sel('mt-card', [['summary_large_image', 'Large image'], ['summary', 'Small summary']], 'summary_large_image')) +
      '<div class="field"><label for="mt-theme">Theme colour</label><div style="display:flex;gap:8px;align-items:center">' +
      '<input type="color" id="mt-theme-p" value="#4f46e5" aria-label="Pick theme colour">' + inp('mt-theme', 'text', '#4f46e5', '') + '</div></div>' +
      '</div>' +
      '<div class="seo-sec">Robots &amp; technical</div>' +
      '<div class="seo-checks">' + chk('mt-index', 'Allow indexing (index)', true) + chk('mt-follow', 'Follow links (follow)', true) +
      chk('mt-maxim', 'max-image-preview:large', true) + chk('mt-charset', 'charset UTF-8', true) + chk('mt-vp', 'Mobile viewport', true) + '</div>' +
      '</div>' +
      '<div class="card"><div class="card-title"><h2 class="seo-h">Your &lt;head&gt; tags</h2><div class="btn-group">' +
      btn('data-a="copy"', 'copy', 'Copy', 'btn-primary') + btn('data-a="dl"', 'download', 'Download') + '</div></div>' +
      '<label for="mt-out" class="sr-only">Generated meta tags</label>' +
      '<textarea id="mt-out" class="mono seo-out" readonly spellcheck="false"></textarea>' +
      '<div id="mt-msgs" class="seo-msgs" aria-live="polite"></div>' +
      '<p class="muted small" style="margin:12px 0 0">Paste these inside the <code>&lt;head&gt;</code> of your page. Google does not use the <code>keywords</code> meta tag, so it is left out.</p>' +
      '</div></div>';

    var out = BT.$('#mt-out', root), msgs = BT.$('#mt-msgs', root);
    var picker = BT.$('#mt-theme-p', root), themeIn = BT.$('#mt-theme', root);
    picker.addEventListener('input', function () { themeIn.value = picker.value; });
    themeIn.addEventListener('input', function () { if (/^#[0-9a-f]{6}$/i.test(themeIn.value.trim())) picker.value = themeIn.value.trim(); });

    function update() {
      var v = function (id) { return val(root, id); };
      var title = v('mt-title').replace(/\s+/g, ' '), desc = v('mt-desc').replace(/\s+/g, ' ');
      var tpx = textWidth(title, '20px Arial'), dpx = textWidth(desc, '14px Arial');
      var ts = titleStatus(title, tpx), ds = descStatus(desc, dpx);
      BT.$('#mt-title-c', root).innerHTML = counterHTML([...title].length, tpx, ts, 60);
      BT.$('#mt-desc-c', root).innerHTML = counterHTML([...desc].length, dpx, ds, 160);
      BT.$('#mt-title-m', root).innerHTML = meterHTML(tpx / 600, COLORS[ts.kind]);
      BT.$('#mt-desc-m', root).innerHTML = meterHTML(dpx / 920, COLORS[ds.kind]);

      var url = v('mt-url'), site = v('mt-site'), img = v('mt-img'), imgAlt = v('mt-imgalt'), author = v('mt-author');
      var tw = v('mt-tw').replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//i, '').replace(/^@?/, '').replace(/[/?#].*$/, '');
      var lang = v('mt-lang'), type = v('mt-type'), card = v('mt-card'), theme = v('mt-theme');
      var L = [], warn = [];
      var m = function (attr, key, content) { if (content) L.push('<meta ' + attr + '="' + key + '" content="' + esc(content) + '">'); };

      L.push('<!-- Primary meta tags (set <html lang="' + esc(lang) + '"> on your page) -->');
      if (v('mt-charset')) L.push('<meta charset="utf-8">');
      if (v('mt-vp')) L.push('<meta name="viewport" content="width=device-width, initial-scale=1">');
      if (title) L.push('<title>' + esc(title) + '</title>');
      m('name', 'description', desc);
      var robots = [v('mt-index') ? 'index' : 'noindex', v('mt-follow') ? 'follow' : 'nofollow'];
      if (v('mt-maxim') && v('mt-index')) robots.push('max-image-preview:large');
      m('name', 'robots', robots.join(', '));
      if (url) L.push('<link rel="canonical" href="' + esc(url) + '">');
      m('name', 'author', author);
      if (theme) m('name', 'theme-color', theme);

      L.push('', '<!-- Open Graph (Facebook, WhatsApp, LinkedIn) -->');
      m('property', 'og:type', type);
      m('property', 'og:site_name', site);
      m('property', 'og:title', title);
      m('property', 'og:description', desc);
      m('property', 'og:url', url);
      m('property', 'og:image', img);
      if (img) m('property', 'og:image:alt', imgAlt);
      if (/-/.test(lang)) m('property', 'og:locale', lang.replace('-', '_'));

      L.push('', '<!-- X (Twitter) -->');
      m('name', 'twitter:card', card);
      if (tw) m('name', 'twitter:site', '@' + tw);
      m('name', 'twitter:title', title);
      m('name', 'twitter:description', desc);
      m('name', 'twitter:image', img);
      if (img) m('name', 'twitter:image:alt', imgAlt);

      out.value = (title || desc || url) ? L.join('\n') : '';

      if (!title) warn.push(['warn', 'Add a page title. It is the most important on-page SEO element.']);
      if (!desc) warn.push(['warn', 'Add a meta description. Google may show it as the snippet under your title.']);
      if (url && !httpUrl(url)) warn.push(['error', 'The canonical URL must be a full address starting with https://']);
      if (img && !httpUrl(img)) warn.push(['error', 'The share image must be a full URL (https://…). Relative paths do not work on social networks.']);
      if (img && !imgAlt) warn.push(['warn', 'Add image alt text for accessibility.']);
      if (!v('mt-index')) warn.push(['warn', '<strong>noindex</strong> is set: search engines will not show this page.']);
      if (theme && !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(theme)) warn.push(['warn', 'Theme colour should be a hex value like #4f46e5.']);
      if (v('mt-tw') && !/^[A-Za-z0-9_]{1,15}$/.test(tw)) warn.push(['warn', 'X handles have 1–15 letters, numbers or underscores.']);
      msgs.innerHTML = warn.map(function (w) { return notice(w[0], w[1]); }).join('');
    }

    BT.bindInputs(root, update);
    onClickA(root, {
      sample: function () {
        var S = { 'mt-title': 'Free Online PDF, Image & GST Tools | BISCS India', 'mt-desc': 'Merge PDFs, compress images and calculate GST or EMI with 100+ free tools that run in your browser. No sign-up, no uploads.',
          'mt-url': 'https://www.example.com/', 'mt-site': 'BISCS India', 'mt-img': 'https://www.example.com/assets/og-image.jpg', 'mt-imgalt': 'BISCS free online tools',
          'mt-tw': '@biscsindia', 'mt-author': 'BISCS India', 'mt-theme': '#4f46e5' };
        Object.keys(S).forEach(function (k) { BT.$('#' + k, root).value = S[k]; });
        picker.value = '#4f46e5';
        update();
      },
      clear: function () {
        BT.$$('input[type=text],input[type=url],textarea:not([readonly])', root).forEach(function (el) { el.value = ''; });
        update();
      },
      copy: function () { if (out.value) BT.copy(out.value, 'Meta tags copied'); else BT.toast('Fill in the form first', 'error'); },
      dl: function () { if (out.value) BT.download(out.value + '\n', 'meta-tags.html', 'text/html'); else BT.toast('Fill in the form first', 'error'); }
    });
  });

  // ============================================================ serp-preview
  var SERP = {
    desk: { tFont: '20px Arial', tPx: 600, dFont: '14px Arial', dPx: 920 },
    mob: { tFont: '18px Arial', tPx: 620, dFont: '14px Arial', dPx: 820 }
  };
  function fmtDate(iso) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return '';
    return d.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'][d.getMonth()] + ' ' + d.getFullYear();
  }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  /** Escape text and bold occurrences of the keyword (Google bolds matched words). */
  function boldKw(text, kw) {
    kw = String(kw || '').trim();
    if (!kw) return esc(text);
    var words = kw.split(/\s+/).filter(function (w) { return w.length > 1; }).map(escRe);
    if (!words.length) return esc(text);
    var re = new RegExp('(' + [escRe(kw)].concat(words).join('|') + ')', 'gi');
    return text.split(re).map(function (part, i) { return i % 2 ? '<b>' + esc(part) + '</b>' : esc(part); }).join('');
  }
  function crumbs(u, custom) {
    if (custom) return esc(u ? u.protocol + '//' + u.host : '') + ' › ' + custom.split(/\s*[›>\/]\s*/).filter(Boolean).map(esc).join(' › ');
    if (!u) return '';
    var parts = u.pathname.split('/').filter(Boolean).map(function (p) {
      try { p = decodeURIComponent(p); } catch (e) { /* keep raw */ }
      return p;
    });
    var s = esc(u.protocol + '//' + u.host);
    if (parts.length) s += ' › ' + parts.slice(0, 4).map(esc).join(' › ') + (parts.length > 4 ? ' › …' : '');
    return s;
  }

  BT.impl('serp-preview', function (root) {
    css();
    root.innerHTML = '<div class="card"><div class="card-title"><h2 class="seo-h">Your search result</h2><div class="btn-group">' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div></div>' +
      field('sp-title', 'Title', inp('sp-title', 'text', 'Page title as it appears in search'), null, true) +
      '<div class="seo-meter" id="sp-title-m" aria-hidden="true"></div><div style="height:12px"></div>' +
      field('sp-url', 'URL', inp('sp-url', 'url', 'https://www.example.com/blog/seo-tips/')) +
      field('sp-desc', 'Meta description', '<textarea id="sp-desc" rows="3" style="min-height:90px" placeholder="The description shown under the title"></textarea>', null, true) +
      '<div class="seo-meter" id="sp-desc-m" aria-hidden="true"></div><div style="height:12px"></div>' +
      '<div class="row cols-2">' +
      field('sp-kw', 'Focus keyword (bolded)', inp('sp-kw', 'text', 'e.g. seo tips')) +
      field('sp-site', 'Site name (optional)', inp('sp-site', 'text', 'Defaults to the domain')) +
      field('sp-crumb', 'Breadcrumb (optional)', inp('sp-crumb', 'text', 'e.g. Blog › SEO'), 'Leave empty to build it from the URL') +
      field('sp-date', 'Date (optional)', inp('sp-date', 'date', '')) +
      '</div><div id="sp-msgs" class="seo-msgs" aria-live="polite"></div></div>' +
      '<div class="card"><div class="card-title"><h2 class="seo-h">Desktop preview</h2><span class="muted small">≈600 px title · ≈920 px description</span></div>' +
      '<div class="seo-scroll"><div class="seo-g" id="sp-desk" style="width:max-content"></div></div></div>' +
      '<div class="card"><div class="card-title"><h2 class="seo-h">Mobile preview</h2><span class="muted small">Narrower screen, title can wrap to 2 lines</span></div>' +
      '<div class="seo-g mob" id="sp-mob"></div>' +
      '<p class="muted small" style="margin:12px 0 0">Pixel widths are estimates measured with Arial. Google can rewrite titles and descriptions, so treat this as a close guide rather than a guarantee.</p></div>';

    function render(box, cfg, d, mobile) {
      var dateStr = d.date ? fmtDate(d.date) + ' — ' : '';
      var t = fitWidth(d.title || 'Your page title appears here', cfg.tPx, cfg.tFont);
      var dPrefix = dateStr ? textWidth(dateStr, cfg.dFont) : 0;
      var ds = fitWidth(d.desc || 'Your meta description appears here. Write a clear summary that makes people want to click.', cfg.dPx, cfg.dFont, dPrefix);
      var host = d.u ? d.u.hostname.replace(/^www\./, '') : 'example.com';
      var name = d.site || host;
      box.innerHTML = '<div class="gd"' + (mobile ? ' style="width:auto"' : '') + '><div class="gsite"><span class="gfav" aria-hidden="true">' + esc((name[0] || '?').toUpperCase()) + '</span>' +
        '<div style="min-width:0"><div class="gname">' + esc(name) + '</div><div class="gurl">' + (crumbs(d.u, d.crumb) || 'https://example.com') + '</div></div></div>' +
        '<h3 class="gtitle' + (d.title ? '' : ' gempty') + '">' + esc(t.text) + '</h3>' +
        '<div class="gdesc' + (d.desc ? '' : ' gempty') + '">' + (dateStr ? '<span class="gdate">' + esc(dateStr) + '</span>' : '') + boldKw(ds.text, d.kw) + '</div></div>';
      return { t: t, d: ds };
    }

    function update() {
      var d = { title: val(root, 'sp-title').replace(/\s+/g, ' '), desc: val(root, 'sp-desc').replace(/\s+/g, ' '), url: val(root, 'sp-url'),
        kw: val(root, 'sp-kw'), site: val(root, 'sp-site'), crumb: val(root, 'sp-crumb'), date: val(root, 'sp-date') };
      d.u = httpUrl(d.url) || (d.url ? httpUrl('https://' + d.url) : null);
      var tpx = textWidth(d.title, '20px Arial'), dpx = textWidth(d.desc, '14px Arial');
      var ts = titleStatus(d.title, tpx), dst = descStatus(d.desc, dpx);
      BT.$('#sp-title-c', root).innerHTML = counterHTML([...d.title].length, tpx, ts, 60);
      BT.$('#sp-desc-c', root).innerHTML = counterHTML([...d.desc].length, dpx, dst, 160);
      BT.$('#sp-title-m', root).innerHTML = meterHTML(tpx / 600, COLORS[ts.kind]);
      BT.$('#sp-desc-m', root).innerHTML = meterHTML(dpx / 920, COLORS[dst.kind]);
      var rd = render(BT.$('#sp-desk', root), SERP.desk, d, false);
      var rm = render(BT.$('#sp-mob', root), SERP.mob, d, true);

      var w = [];
      if (d.title && rd.t.cut) w.push(['warn', 'The title is about ' + Math.round(tpx) + ' px wide and will be cut off on desktop (limit ≈600 px). Put the important words first.']);
      else if (d.title && rm.t.cut) w.push(['warn', 'The title fits on desktop but may be cut off on mobile.']);
      if (d.title && [...d.title].length < 30) w.push(['warn', 'The title is short. Titles of 50–60 characters usually use the space best.']);
      if (d.desc && rd.d.cut) w.push(['warn', 'The description will be truncated on desktop. Aim for 120–160 characters' + (d.date ? ' (the date shown before it uses part of the space).' : '.')]);
      else if (d.desc && rm.d.cut) w.push(['warn', 'The description may be truncated on mobile.']);
      if (d.desc && [...d.desc].length < 70) w.push(['warn', 'The description is short. Google may replace it with text from your page.']);
      if (d.url && !d.u) w.push(['error', 'That URL does not look valid.']);
      if (d.kw) {
        var k = d.kw.toLowerCase();
        if (d.title && d.title.toLowerCase().indexOf(k) < 0) w.push(['warn', 'The focus keyword is not in the title.']);
        if (d.desc && d.desc.toLowerCase().indexOf(k) < 0) w.push(['warn', 'The focus keyword is not in the description.']);
      }
      if (d.title && d.desc && !w.length) w.push(['ok', 'Looks good: the title and description fit on both desktop and mobile.']);
      BT.$('#sp-msgs', root).innerHTML = w.map(function (x) { return notice(x[0], x[1]); }).join('');
    }
    BT.bindInputs(root, update);
    onClickA(root, {
      sample: function () {
        BT.$('#sp-title', root).value = '10 Proven SEO Tips for Small Businesses in India (2026 Guide)';
        BT.$('#sp-url', root).value = 'https://www.example.com/blog/seo-tips-small-business/';
        BT.$('#sp-desc', root).value = 'Easy SEO tips that help small businesses in India rank higher on Google: local listings, fast pages and good content.';
        BT.$('#sp-kw', root).value = 'seo tips';
        BT.$('#sp-site', root).value = 'BISCS India';
        BT.$('#sp-date', root).value = today();
        update();
      },
      clear: function () { BT.$$('input,textarea', root).forEach(function (el) { el.value = ''; }); update(); }
    });
  });

  // ===================================================== social-share-preview
  function cutChars(s, n) {
    var a = [...String(s || '')];
    return a.length > n ? a.slice(0, n - 1).join('').replace(/\s+\S*$/, '') + '…' : a.join('');
  }
  BT.impl('social-share-preview', function (root) {
    css();
    var IMG = { src: '', w: 0, h: 0, local: false, err: false, url: '' };
    var drop = BT.dropzone({ accept: 'image/*', compact: true, title: 'Or upload an image to preview', hint: 'Stays on your device, only used for this preview', icon: 'image-plus', onFiles: function (f) { useFile(f[0]); } });

    root.innerHTML = '<div class="split wide-left">' +
      '<div class="card"><div class="card-title"><h2 class="seo-h">Link details</h2><div class="btn-group">' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div></div>' +
      field('ss-title', 'Title (og:title)', inp('ss-title', 'text', 'The headline people will see'), null, true) +
      field('ss-desc', 'Description (og:description)', '<textarea id="ss-desc" rows="3" style="min-height:84px" placeholder="One or two short sentences"></textarea>', null, true) +
      '<div class="row cols-2">' +
      field('ss-url', 'Page URL', inp('ss-url', 'url', 'https://www.example.com/page/')) +
      field('ss-site', 'Site name', inp('ss-site', 'text', 'Your brand')) +
      '</div>' +
      field('ss-img', 'Image URL (og:image)', inp('ss-img', 'url', 'https://www.example.com/og-image.jpg'), 'Recommended: 1200 × 630 px (1.91:1), JPG or PNG, under 5 MB (under 300 KB for WhatsApp).') +
      '<div id="ss-drop"></div><div id="ss-imginfo" class="seo-msgs" aria-live="polite"></div>' +
      '</div>' +
      '<div class="card"><div class="card-title"><h2 class="seo-h">Open Graph &amp; X tags</h2>' + btn('data-a="copy"', 'copy', 'Copy', 'btn-primary') + '</div>' +
      '<label for="ss-out" class="sr-only">Generated social tags</label><textarea id="ss-out" class="mono seo-out" readonly spellcheck="false" style="min-height:300px"></textarea>' +
      '<div id="ss-msgs" class="seo-msgs" aria-live="polite"></div></div>' +
      '</div>' +
      '<div class="card"><div class="card-title"><h2 class="seo-h">Previews</h2><span class="muted small">Approximate. Each app changes its design from time to time.</span></div>' +
      '<div class="seo-social" id="ss-prev"></div></div>';
    BT.$('#ss-drop', root).appendChild(drop);

    var imgIn = BT.$('#ss-img', root), loadTok = 0;
    function probe(src, local) {
      var tok = ++loadTok;
      IMG = { src: src, w: 0, h: 0, local: local, err: false, url: local ? IMG.url : src };
      if (!src) { update(); return; }
      var im = new Image();
      im.onload = function () { if (tok !== loadTok) return; IMG.w = im.naturalWidth; IMG.h = im.naturalHeight; update(); };
      im.onerror = function () { if (tok !== loadTok) return; IMG.err = true; update(); };
      im.src = src;
      update();
    }
    function useFile(f) {
      if (IMG.local && IMG.src) URL.revokeObjectURL(IMG.src);
      IMG.url = imgIn.value.trim();
      probe(URL.createObjectURL(f), true);
      IMG.name = f.name; IMG.size = f.size;
      update();
    }
    var onImgUrl = BT.debounce(function () {
      var u = imgIn.value.trim();
      if (IMG.local) { IMG.url = u; update(); return; }
      probe(httpUrl(u) ? u : '', false);
    }, 400);
    imgIn.addEventListener('input', onImgUrl);

    function imgBox(extra) {
      if (IMG.src && !IMG.err) return '<div class="seo-img"' + (extra || '') + '><img src="' + esc(IMG.src) + '" alt=""></div>';
      return '<div class="seo-img"' + (extra || '') + '>' + BT.icon('image') + '</div>';
    }

    function update() {
      var title = val(root, 'ss-title').replace(/\s+/g, ' '), desc = val(root, 'ss-desc').replace(/\s+/g, ' ');
      var url = val(root, 'ss-url'), site = val(root, 'ss-site'), imgUrl = val(root, 'ss-img');
      var u = httpUrl(url);
      var host = u ? u.hostname.replace(/^www\./, '') : 'example.com';
      var T = title || 'Your page title', D = desc || 'A short description of the page appears here.';
      BT.$('#ss-title-c', root).innerHTML = '<span>' + [...title].length + ' chars</span>' + ([...title].length > 70 ? '<span class="badge warn">May be cut off</span>' : '');
      BT.$('#ss-desc-c', root).innerHTML = '<span>' + [...desc].length + ' chars</span>' + ([...desc].length > 160 ? '<span class="badge warn">Long</span>' : '');

      var wa = '<div class="seo-sc"><div class="lbl">WhatsApp</div><div class="seo-wa"><div class="bub"><div class="pv">' + imgBox() +
        '<div class="tx"><div class="t seo-clamp2">' + esc(cutChars(T, 80)) + '</div><div class="d seo-clamp2">' + esc(cutChars(D, 120)) + '</div><div class="u">' + esc(host) + '</div></div></div>' +
        '<div class="lnk">' + esc(url || 'https://' + host + '/') + '</div><div class="tm">10:24 ✓✓</div></div></div></div>';
      var fb = '<div class="seo-sc"><div class="lbl">Facebook</div><div class="seo-fb">' + imgBox() +
        '<div class="ft"><div class="u">' + esc(host) + '</div><div class="t seo-clamp2">' + esc(cutChars(T, 88)) + '</div><div class="d seo-clamp1">' + esc(D) + '</div></div></div></div>';
      var li = '<div class="seo-sc"><div class="lbl">LinkedIn</div><div class="seo-li">' + imgBox() +
        '<div class="ft"><div class="t seo-clamp2">' + esc(cutChars(T, 100)) + '</div><div class="u">' + esc(host) + '</div></div></div></div>';
      var x = '<div class="seo-sc"><div class="lbl">X (summary_large_image)</div><div class="seo-x"><div class="card-x">' + imgBox() +
        '<div class="ov">' + esc(cutChars(T, 70)) + '</div></div><div class="u">From ' + esc(host) + '</div></div></div>';
      BT.$('#ss-prev', root).innerHTML = wa + fb + li + x;

      // Image checks
      var im = [];
      if (IMG.local) im.push(['', 'Previewing <strong>' + esc(IMG.name || 'your upload') + '</strong> locally. It is not uploaded anywhere: put it on your website and paste its full URL above so the tags point to it. ' +
        btn('data-a="unupload"', 'x', 'Remove upload', 'btn-ghost')]);
      if (IMG.err) im.push(['warn', 'The image could not be loaded for the preview. Check the URL is public and points straight to an image file.']);
      if (IMG.w && IMG.h) {
        var r = IMG.w / IMG.h, off = Math.abs(r - 1.91) / 1.91;
        var line = 'Image is <strong>' + IMG.w + ' × ' + IMG.h + ' px</strong> (ratio ' + r.toFixed(2) + ':1). ';
        if (IMG.w < 600 || IMG.h < 315) im.push(['error', line + 'This is too small for large link cards; most apps will show a small thumbnail instead. Use 1200 × 630 px.']);
        else if (IMG.w < 1200 || IMG.h < 630) im.push(['warn', line + 'Smaller than the recommended 1200 × 630 px, so it may look blurry on high-resolution screens.']);
        if (off > 0.05) im.push(['warn', line + 'The ratio is not 1.91:1, so the image will be cropped in the cards above. Keep important content in the centre.']);
        if (IMG.w >= 1200 && IMG.h >= 630 && off <= 0.05) im.push(['ok', line + 'Perfect size and ratio.']);
      }
      if (IMG.local && IMG.size > 300 * 1024) im.push(['warn', 'This file is ' + BT.fmtBytes(IMG.size) + '. WhatsApp often skips images over about 300 KB; compress it for reliable previews.']);
      BT.$('#ss-imginfo', root).innerHTML = im.map(function (w) { return notice(w[0], w[1]); }).join('');

      // Tags
      var ogImg = imgUrl || (IMG.local ? 'https://www.example.com/your-image.jpg' : '');
      var L = [], m = function (a, k, c) { if (c) L.push('<meta ' + a + '="' + k + '" content="' + esc(c) + '">'); };
      m('property', 'og:type', 'website');
      m('property', 'og:site_name', site);
      m('property', 'og:title', title);
      m('property', 'og:description', desc);
      m('property', 'og:url', url);
      m('property', 'og:image', ogImg);
      if (ogImg && IMG.w && IMG.h) { m('property', 'og:image:width', String(IMG.w)); m('property', 'og:image:height', String(IMG.h)); }
      m('name', 'twitter:card', 'summary_large_image');
      m('name', 'twitter:title', title);
      m('name', 'twitter:description', desc);
      m('name', 'twitter:image', ogImg);
      BT.$('#ss-out', root).value = (title || desc || url || ogImg) ? L.join('\n') : '';

      var w = [];
      if (!title) w.push(['warn', 'Add a title. Without og:title, apps fall back to your page &lt;title&gt;.']);
      if (!desc) w.push(['warn', 'Add a description.']);
      if (!imgUrl && !IMG.local) w.push(['warn', 'Add an image. Links with a large image get noticeably more clicks.']);
      if (imgUrl && !httpUrl(imgUrl)) w.push(['error', 'The image URL must be a full https:// address.']);
      if (url && !u) w.push(['error', 'The page URL must be a full https:// address.']);
      if (imgUrl && /^http:/i.test(imgUrl)) w.push(['warn', 'Use https:// for the image; some apps refuse insecure images.']);
      w.push(['', 'After publishing, refresh cached previews with the Facebook Sharing Debugger and LinkedIn Post Inspector.']);
      BT.$('#ss-msgs', root).innerHTML = w.map(function (x) { return notice(x[0], x[1]); }).join('');
    }

    BT.bindInputs(root, update);
    onClickA(root, {
      sample: function () {
        BT.$('#ss-title', root).value = '100+ Free Online Tools for Everyday Work';
        BT.$('#ss-desc', root).value = 'PDF, image, GST, EMI and text tools that run in your browser. Free, private, no sign-up.';
        BT.$('#ss-url', root).value = 'https://www.example.com/';
        BT.$('#ss-site', root).value = 'BISCS India';
        imgIn.value = new URL((BT.base || '') + 'assets/img/og.png', location.href).href;
        if (IMG.local && IMG.src) URL.revokeObjectURL(IMG.src);
        probe(imgIn.value, false);
      },
      clear: function () {
        BT.$$('input[type=text],input[type=url],textarea:not([readonly])', root).forEach(function (el) { el.value = ''; });
        if (IMG.local && IMG.src) URL.revokeObjectURL(IMG.src);
        probe('', false);
      },
      unupload: function () {
        if (IMG.src) URL.revokeObjectURL(IMG.src);
        probe(httpUrl(imgIn.value.trim()) ? imgIn.value.trim() : '', false);
      },
      copy: function () { var t = BT.$('#ss-out', root).value; if (t) BT.copy(t, 'Tags copied'); else BT.toast('Fill in the form first', 'error'); }
    });
  });

  // =================================================== schema-markup-generator
  var COUNTRY_HINT = 'Two-letter code, e.g. IN';
  var ADDR = [
    ['street', 'Street address', 'text', { ph: '12, Example Road, Ballygunge' }],
    ['locality', 'City', 'text', {}],
    ['region', 'State', 'text', {}],
    ['postal', 'PIN code', 'text', {}],
    ['country', 'Country', 'text', { hint: COUNTRY_HINT }]
  ];
  var TZ = ['tz', 'Time zone', 'select', { options: [['+05:30', 'India (IST, +05:30)'], ['Z', 'UTC'], ['+04:00', 'Gulf (+04:00)'], ['+01:00', 'UK summer (+01:00)'], ['-04:00', 'US Eastern summer (−04:00)']], def: '+05:30' }];
  var CURRENCY = ['currency', 'Currency', 'select', { options: [['INR', 'INR (₹)'], ['USD', 'USD ($)'], ['EUR', 'EUR (€)'], ['GBP', 'GBP (£)'], ['AED', 'AED']], def: 'INR' }];
  var AVAIL = ['availability', 'Availability', 'select', { options: [['InStock', 'In stock'], ['OutOfStock', 'Out of stock'], ['PreOrder', 'Pre-order'], ['BackOrder', 'Back order'], ['LimitedAvailability', 'Limited availability'], ['OnlineOnly', 'Online only'], ['SoldOut', 'Sold out']], def: 'InStock' }];

  var SCHEMA = {
    LocalBusiness: {
      label: 'Local Business',
      fields: [
        ['subtype', 'Business type', 'select', { options: ['LocalBusiness', 'ProfessionalService', 'Store', 'ElectronicsStore', 'ComputerStore', 'Restaurant', 'MedicalBusiness', 'FinancialService', 'LegalService', 'HomeAndConstructionBusiness', 'AutomotiveBusiness', 'TravelAgency', 'EducationalOrganization'], def: 'LocalBusiness' }],
        ['name', 'Business name', 'text', { req: 1, def: 'BISCS India' }],
        ['url', 'Website', 'url', { ph: 'https://www.example.com/' }],
        ['telephone', 'Phone', 'tel', { ph: '+91 98XXXXXXXX' }],
        ['email', 'Email', 'email', { def: 'info@biscsindia.com' }],
        ['image', 'Photo or logo URL', 'url', { ph: 'https://www.example.com/shop.jpg' }],
        ADDR[0], ['locality', 'City', 'text', { def: 'Kolkata', req: 1 }], ['region', 'State', 'text', { def: 'West Bengal' }],
        ['postal', 'PIN code', 'text', { def: '700026' }], ['country', 'Country', 'text', { def: 'IN', hint: COUNTRY_HINT }],
        ['lat', 'Latitude', 'text', { ph: '22.5170' }], ['lng', 'Longitude', 'text', { ph: '88.3639' }],
        ['priceRange', 'Price range', 'text', { ph: '₹₹' }],
        ['hours', 'Opening hours (one per line)', 'lines', { ph: 'Mo-Fr 10:00-19:00\nSa 10:00-14:00' }],
        ['sameAs', 'Social profiles (one URL per line)', 'lines', { ph: 'https://www.facebook.com/yourpage\nhttps://www.linkedin.com/company/yourcompany' }],
        ['description', 'Description', 'textarea', {}]
      ],
      build: function (v, w) {
        if (!v.street) w.push('Google requires a full address for local businesses: add the street address.');
        var o = { '@type': v.subtype, name: v.name, description: v.description, url: v.url, telephone: v.telephone, email: v.email, image: v.image, priceRange: v.priceRange,
          address: address(v), openingHours: lines(v.hours), sameAs: lines(v.sameAs) };
        geo(o, v, w);
        return o;
      }
    },
    Organization: {
      label: 'Organization',
      fields: [
        ['name', 'Organisation name', 'text', { req: 1, ph: 'BISCS India' }],
        ['url', 'Website', 'url', { req: 1, ph: 'https://www.example.com/' }],
        ['logo', 'Logo URL', 'url', { ph: 'https://www.example.com/logo.png', hint: 'At least 112 × 112 px' }],
        ['email', 'Email', 'email', {}], ['telephone', 'Phone', 'tel', { ph: '+91 …' }],
        ['foundingDate', 'Founded', 'date', {}],
        ADDR[0], ADDR[1], ADDR[2], ADDR[3], ADDR[4],
        ['sameAs', 'Social profiles (one URL per line)', 'lines', {}],
        ['description', 'Description', 'textarea', {}]
      ],
      build: function (v) {
        return { '@type': 'Organization', name: v.name, url: v.url, logo: v.logo, description: v.description, email: v.email, telephone: v.telephone,
          foundingDate: v.foundingDate, address: address(v), sameAs: lines(v.sameAs) };
      }
    },
    WebSite: {
      label: 'Website (with search)',
      fields: [
        ['name', 'Site name', 'text', { req: 1, ph: 'BISCS Tools' }],
        ['alternateName', 'Alternative name', 'text', { ph: 'BISCS' }],
        ['url', 'Home page URL', 'url', { req: 1, ph: 'https://www.example.com/' }],
        ['search', 'Site search URL template', 'url', { ph: 'https://www.example.com/search?q={search_term_string}', hint: 'Use {search_term_string} where the query goes. Leave empty if your site has no search.' }]
      ],
      build: function (v, w) {
        var o = { '@type': 'WebSite', name: v.name, alternateName: v.alternateName, url: v.url };
        if (v.search) {
          if (v.search.indexOf('{search_term_string}') < 0) w.push('The search URL template must contain {search_term_string}.');
          o.potentialAction = { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: v.search }, 'query-input': 'required name=search_term_string' };
        }
        return o;
      },
      note: 'WebSite markup helps Google show your site name. Google retired the sitelinks search box in late 2024, but the SearchAction is still valid schema.org.'
    },
    FAQPage: {
      label: 'FAQ page',
      fields: [],
      rows: { label: 'Question', fields: [['q', 'Question', 'text', { req: 1 }], ['a', 'Answer', 'textarea', { req: 1 }]],
        def: [{ q: 'Are the tools free to use?', a: 'Yes. All tools are free and run in your browser.' }, { q: 'Do you upload my files?', a: 'No. Files are processed on your device and never leave it.' }] },
      build: function (v, w, rows) {
        return { '@type': 'FAQPage', mainEntity: rows.filter(function (r) { return r.q || r.a; }).map(function (r) {
          return { '@type': 'Question', name: r.q, acceptedAnswer: { '@type': 'Answer', text: r.a } };
        }) };
      },
      note: 'The questions and answers must be visible on the page. Google now shows FAQ rich results mainly for well-known government and health sites, but the markup still helps other search engines and AI assistants understand the page.'
    },
    Product: {
      label: 'Product',
      fields: [
        ['name', 'Product name', 'text', { req: 1 }],
        ['image', 'Image URL', 'url', { req: 1 }],
        ['brand', 'Brand', 'text', {}], ['sku', 'SKU', 'text', {}],
        ['url', 'Product page URL', 'url', {}],
        ['price', 'Price', 'number', { ph: '1499' }], CURRENCY, AVAIL,
        ['condition', 'Condition', 'select', { options: [['NewCondition', 'New'], ['UsedCondition', 'Used'], ['RefurbishedCondition', 'Refurbished']], def: 'NewCondition' }],
        ['priceValidUntil', 'Price valid until', 'date', {}],
        ['ratingValue', 'Average rating (optional)', 'number', { ph: '4.5' }], ['reviewCount', 'Number of reviews', 'number', { ph: '28' }],
        ['description', 'Description', 'textarea', {}]
      ],
      build: function (v, w, rows, e) {
        var o = { '@type': 'Product', name: v.name, image: v.image, description: v.description, sku: v.sku, brand: v.brand ? { '@type': 'Brand', name: v.brand } : null };
        if (v.price) {
          if (!/^\d+(\.\d{1,2})?$/.test(v.price.replace(/,/g, ''))) e.push('Price must be a number like 1499 or 1499.00 (no currency symbol).');
          o.offers = { '@type': 'Offer', url: v.url, price: v.price.replace(/,/g, ''), priceCurrency: v.currency, availability: 'https://schema.org/' + v.availability,
            itemCondition: 'https://schema.org/' + v.condition, priceValidUntil: v.priceValidUntil };
        } else if (v.url) o.url = v.url;
        if (v.ratingValue || v.reviewCount) {
          var r = parseFloat(v.ratingValue), c = parseInt(v.reviewCount, 10);
          if (!(r >= 1 && r <= 5)) e.push('Rating must be between 1 and 5.');
          if (!(c >= 1)) e.push('Add the number of reviews (at least 1) together with the rating.');
          o.aggregateRating = { '@type': 'AggregateRating', ratingValue: v.ratingValue, reviewCount: v.reviewCount, bestRating: '5' };
          w.push('Only add ratings from real customers that are shown on the page. Made-up or self-written reviews break Google’s guidelines.');
        }
        if (!v.price && !v.ratingValue) w.push('Add a price (offer) or a rating, otherwise Google cannot show a product rich result.');
        return o;
      }
    },
    Article: {
      label: 'Article / Blog post',
      fields: [
        ['subtype', 'Article type', 'select', { options: ['BlogPosting', 'Article', 'NewsArticle'], def: 'BlogPosting' }],
        ['headline', 'Headline', 'text', { req: 1, hint: 'Keep it under 110 characters' }],
        ['url', 'Article URL', 'url', {}],
        ['image', 'Image URL', 'url', { hint: 'Recommended; at least 1200 px wide' }],
        ['datePublished', 'Published', 'datetime-local', { req: 1 }], ['dateModified', 'Last updated', 'datetime-local', {}], TZ,
        ['authorName', 'Author name', 'text', { req: 1 }],
        ['authorType', 'Author is a', 'select', { options: ['Person', 'Organization'], def: 'Person' }],
        ['authorUrl', 'Author profile URL', 'url', {}],
        ['publisher', 'Publisher name', 'text', {}], ['publisherLogo', 'Publisher logo URL', 'url', {}],
        ['description', 'Summary', 'textarea', {}]
      ],
      build: function (v, w) {
        if ([...v.headline].length > 110) w.push('The headline is longer than 110 characters.');
        if (!v.image) w.push('Add an image: articles with images are much more likely to get rich results.');
        return { '@type': v.subtype, headline: v.headline, description: v.description, image: v.image,
          mainEntityOfPage: v.url ? { '@type': 'WebPage', '@id': v.url } : null,
          datePublished: dt(v.datePublished, v.tz), dateModified: dt(v.dateModified, v.tz),
          author: v.authorName ? { '@type': v.authorType, name: v.authorName, url: v.authorUrl } : null,
          publisher: v.publisher ? { '@type': 'Organization', name: v.publisher, logo: v.publisherLogo ? { '@type': 'ImageObject', url: v.publisherLogo } : null } : null };
      }
    },
    BreadcrumbList: {
      label: 'Breadcrumbs',
      fields: [],
      rows: { label: 'Level', fields: [['name', 'Name', 'text', { req: 1 }], ['url', 'URL', 'url', { hint: 'Optional for the last (current) page' }]],
        def: [{ name: 'Home', url: 'https://www.example.com/' }, { name: 'SEO Tools', url: 'https://www.example.com/category/seo/' }, { name: 'Schema Markup Generator', url: '' }] },
      build: function (v, w, rows, e) {
        var list = rows.filter(function (r) { return r.name || r.url; });
        list.forEach(function (r, i) { if (!r.url && i < list.length - 1) e.push('Level ' + (i + 1) + ' needs a URL (only the last level may skip it).'); });
        if (list.length < 2) w.push('Breadcrumbs usually have at least two levels.');
        return { '@type': 'BreadcrumbList', itemListElement: list.map(function (r, i) { return { '@type': 'ListItem', position: i + 1, name: r.name, item: r.url }; }) };
      }
    },
    Event: {
      label: 'Event',
      fields: [
        ['name', 'Event name', 'text', { req: 1 }],
        ['startDate', 'Starts', 'datetime-local', { req: 1 }], ['endDate', 'Ends', 'datetime-local', {}], TZ,
        ['mode', 'Attendance', 'select', { options: [['Offline', 'In person'], ['Online', 'Online'], ['Mixed', 'Both']], def: 'Offline' }],
        ['status', 'Status', 'select', { options: [['EventScheduled', 'Scheduled'], ['EventPostponed', 'Postponed'], ['EventRescheduled', 'Rescheduled'], ['EventMovedOnline', 'Moved online'], ['EventCancelled', 'Cancelled']], def: 'EventScheduled' }],
        ['venue', 'Venue name', 'text', {}], ADDR[0], ['locality', 'City', 'text', {}], ADDR[2], ADDR[3], ['country', 'Country', 'text', { def: 'IN', hint: COUNTRY_HINT }],
        ['onlineUrl', 'Online event URL', 'url', {}],
        ['image', 'Image URL', 'url', {}],
        ['organizer', 'Organiser name', 'text', {}], ['organizerUrl', 'Organiser website', 'url', {}],
        ['price', 'Ticket price', 'number', { ph: '0 for free' }], CURRENCY, ['ticketUrl', 'Ticket URL', 'url', {}], AVAIL,
        ['description', 'Description', 'textarea', {}]
      ],
      build: function (v, w, rows, e) {
        var place = { '@type': 'Place', name: v.venue, address: address(v) }, virt = { '@type': 'VirtualLocation', url: v.onlineUrl };
        if (v.mode !== 'Online' && !v.venue && !v.locality) e.push('Add the venue name and city for an in-person event.');
        if (v.mode !== 'Offline' && !v.onlineUrl) e.push('Add the online event URL.');
        if (v.startDate && v.endDate && v.endDate < v.startDate) e.push('The end time is before the start time.');
        return { '@type': 'Event', name: v.name, description: v.description, image: v.image,
          startDate: dt(v.startDate, v.tz), endDate: dt(v.endDate, v.tz),
          eventAttendanceMode: 'https://schema.org/' + v.mode + 'EventAttendanceMode', eventStatus: 'https://schema.org/' + v.status,
          location: v.mode === 'Offline' ? place : v.mode === 'Online' ? virt : [place, virt],
          organizer: v.organizer ? { '@type': 'Organization', name: v.organizer, url: v.organizerUrl } : null,
          offers: (v.price || v.ticketUrl) ? { '@type': 'Offer', price: v.price, priceCurrency: v.price ? v.currency : null, url: v.ticketUrl, availability: 'https://schema.org/' + v.availability } : null };
      }
    },
    Person: {
      label: 'Person',
      fields: [
        ['name', 'Full name', 'text', { req: 1 }], ['jobTitle', 'Job title', 'text', {}],
        ['worksFor', 'Works for', 'text', {}], ['url', 'Website', 'url', {}],
        ['image', 'Photo URL', 'url', {}], ['email', 'Email', 'email', {}],
        ['sameAs', 'Profiles (one URL per line)', 'lines', { ph: 'https://www.linkedin.com/in/yourname' }],
        ['description', 'Short bio', 'textarea', {}]
      ],
      build: function (v) {
        return { '@type': 'Person', name: v.name, jobTitle: v.jobTitle, worksFor: v.worksFor ? { '@type': 'Organization', name: v.worksFor } : null,
          url: v.url, image: v.image, email: v.email, description: v.description, sameAs: lines(v.sameAs) };
      }
    },
    HowTo: {
      label: 'How-to',
      fields: [
        ['name', 'Title', 'text', { req: 1, ph: 'How to merge PDF files' }],
        ['totalTime', 'Total time (minutes)', 'number', { ph: '5' }],
        ['image', 'Image URL', 'url', {}],
        ['cost', 'Estimated cost', 'number', {}], CURRENCY,
        ['supply', 'Things needed (one per line)', 'lines', {}], ['tool', 'Tools (one per line)', 'lines', {}],
        ['description', 'Description', 'textarea', {}]
      ],
      rows: { label: 'Step', fields: [['name', 'Step title', 'text', {}], ['text', 'Instructions', 'textarea', { req: 1 }], ['image', 'Step image URL', 'url', {}]],
        def: [{ name: 'Open the tool', text: 'Open the Merge PDF tool in your browser.' }, { name: 'Add files', text: 'Drop your PDF files into the box and arrange them.' }, { name: 'Download', text: 'Click Merge and download the combined PDF.' }] },
      build: function (v, w, rows) {
        var mins = parseInt(v.totalTime, 10), dur = null;
        if (mins > 0) dur = 'PT' + (mins >= 60 ? Math.floor(mins / 60) + 'H' : '') + (mins % 60 ? (mins % 60) + 'M' : '');
        return { '@type': 'HowTo', name: v.name, description: v.description, image: v.image, totalTime: dur,
          estimatedCost: v.cost ? { '@type': 'MonetaryAmount', currency: v.currency, value: v.cost } : null,
          supply: lines(v.supply).map(function (s) { return { '@type': 'HowToSupply', name: s }; }),
          tool: lines(v.tool).map(function (s) { return { '@type': 'HowToTool', name: s }; }),
          step: rows.filter(function (r) { return r.name || r.text; }).map(function (r, i) { return { '@type': 'HowToStep', position: i + 1, name: r.name, text: r.text, image: r.image }; }) };
      },
      note: 'Google stopped showing HowTo rich results in 2023, but the markup is still valid and understood by other search engines and AI tools.'
    }
  };
  function lines(s) { return String(s || '').split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function address(v) {
    if (!(v.street || v.locality || v.region || v.postal)) return null;
    return { '@type': 'PostalAddress', streetAddress: v.street, addressLocality: v.locality, addressRegion: v.region, postalCode: v.postal, addressCountry: v.country };
  }
  function geo(o, v, w) {
    if (!v.lat && !v.lng) return;
    var la = parseFloat(v.lat), ln = parseFloat(v.lng);
    if (!(la >= -90 && la <= 90 && ln >= -180 && ln <= 180)) { w.push('Latitude and longitude must both be numbers (e.g. 22.5170, 88.3639).'); return; }
    o.geo = { '@type': 'GeoCoordinates', latitude: la, longitude: ln };
  }
  function dt(local, tz) { return local ? (local.length === 16 ? local + ':00' : local) + (tz || '') : null; }
  /** Remove empty strings, nulls, empty arrays and objects with only @type. */
  function clean(o) {
    if (Array.isArray(o)) { var a = o.map(clean).filter(function (x) { return x != null; }); return a.length ? a : null; }
    if (o && typeof o === 'object') {
      var r = {}, real = 0;
      Object.keys(o).forEach(function (k) { var c = clean(o[k]); if (c != null) { r[k] = c; if (k[0] !== '@') real++; } });
      return real ? r : null;
    }
    if (typeof o === 'string') { o = o.trim(); return o ? o : null; }
    return o == null ? null : o;
  }

  BT.impl('schema-markup-generator', function (root) {
    css();
    var types = Object.keys(SCHEMA);
    var state = {};
    types.forEach(function (t) {
      var d = SCHEMA[t], v = {};
      d.fields.forEach(function (f) { v[f[0]] = f[3].def != null ? f[3].def : (f[2] === 'select' ? (Array.isArray(f[3].options[0]) ? f[3].options[0][0] : f[3].options[0]) : ''); });
      state[t] = { v: v, rows: d.rows ? d.rows.def.map(function (r) { return Object.assign({}, r); }) : [] };
    });
    var cur = 'LocalBusiness';

    root.innerHTML = '<div class="split">' +
      '<div class="card"><div class="card-title"><h2 class="seo-h">Schema details</h2>' + btn('data-a="reset"', 'rotate-ccw', 'Reset', 'btn-ghost') + '</div>' +
      field('sc-type', 'Schema type', sel('sc-type', types.map(function (t) { return [t, SCHEMA[t].label]; }), cur)) +
      '<div id="sc-form"></div></div>' +
      '<div class="card"><div class="card-title"><h2 class="seo-h">JSON-LD</h2><div class="btn-group">' + btn('data-a="copy"', 'copy', 'Copy', 'btn-primary') +
      btn('data-a="copyjson"', 'braces', 'Copy JSON only') + btn('data-a="dl"', 'download', 'Download') + '</div></div>' +
      '<label for="sc-out" class="sr-only">Generated JSON-LD</label><textarea id="sc-out" class="mono seo-out" readonly spellcheck="false" style="min-height:420px"></textarea>' +
      '<div id="sc-msgs" class="seo-msgs" aria-live="polite"></div>' +
      notice('', 'Paste the script into your page’s HTML (head or body), then check it with <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer">Google’s Rich Results Test</a>. Only mark up content that visitors can actually see on the page.') +
      '</div></div>';

    var form = BT.$('#sc-form', root), out = BT.$('#sc-out', root), json = '';

    function control(id, f, value, dataAttrs) {
      var t = f[2], o = f[3] || {}, attrs = ' data-k="' + f[0] + '"' + (dataAttrs || '') + (o.req ? ' aria-required="true"' : '');
      if (t === 'select') {
        return '<select id="' + id + '"' + attrs + '>' + o.options.map(function (x) {
          var v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x;
          return '<option value="' + esc(v) + '"' + (v === value ? ' selected' : '') + '>' + esc(l) + '</option>';
        }).join('') + '</select>';
      }
      if (t === 'textarea' || t === 'lines') return '<textarea id="' + id + '"' + attrs + ' rows="3" style="min-height:' + (t === 'lines' ? 76 : 90) + 'px"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + '>' + esc(value) + '</textarea>';
      return '<input type="' + (t === 'number' ? 'text' : t) + '"' + (t === 'number' ? ' inputmode="decimal"' : '') + ' id="' + id + '"' + attrs + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + ' value="' + esc(value) + '">';
    }
    function labelOf(f) { return esc(f[1]) + (f[3] && f[3].req ? ' <span style="color:var(--danger)" aria-hidden="true">*</span>' : ''); }
    function renderForm() {
      var d = SCHEMA[cur], S = state[cur], h = '';
      if (d.fields.length) {
        h += '<div class="row cols-2">' + d.fields.map(function (f) {
          var wide = f[2] === 'textarea' || f[2] === 'lines';
          return '<div class="field"' + (wide ? ' style="grid-column:1/-1"' : '') + '><label for="sc-f-' + f[0] + '">' + labelOf(f) + '</label>' + control('sc-f-' + f[0], f, S.v[f[0]] || '') +
            (f[3] && f[3].hint ? '<span class="hint">' + esc(f[3].hint) + '</span>' : '') + '</div>';
        }).join('') + '</div>';
      }
      if (d.rows) {
        h += '<div class="seo-sec">' + esc(d.rows.label) + 's</div><div class="seo-rows">' + S.rows.map(function (r, i) {
          return '<div class="seo-rowc"><div class="seo-rowh"><span>' + esc(d.rows.label) + ' ' + (i + 1) + '</span><span class="btn-group">' +
            (i > 0 ? '<button type="button" class="btn btn-sm btn-ghost seo-icon-btn" data-a="up" data-i="' + i + '" aria-label="Move ' + esc(d.rows.label) + ' ' + (i + 1) + ' up">' + BT.icon('chevron-down', '') + '</button>' : '') +
            '<button type="button" class="btn btn-sm btn-ghost seo-icon-btn" data-a="del" data-i="' + i + '" aria-label="Remove ' + esc(d.rows.label) + ' ' + (i + 1) + '">' + BT.icon('trash-2') + '</button></span></div>' +
            d.rows.fields.map(function (f) {
              var id = 'sc-r' + i + '-' + f[0];
              return '<div class="field"><label for="' + id + '">' + labelOf(f) + '</label>' + control(id, f, r[f[0]] || '', ' data-row="' + i + '"') +
                (f[3] && f[3].hint ? '<span class="hint">' + esc(f[3].hint) + '</span>' : '') + '</div>';
            }).join('') + '</div>';
        }).join('') + '</div>' + btn('data-a="add"', 'plus', 'Add ' + d.rows.label.toLowerCase());
      }
      form.innerHTML = h;
      BT.$$('[data-a="up"] svg', form).forEach(function (s) { s.style.transform = 'rotate(180deg)'; });
      generate();
    }
    function generate() {
      var d = SCHEMA[cur], S = state[cur], errs = [], warns = [];
      var v = {};
      Object.keys(S.v).forEach(function (k) { v[k] = String(S.v[k] || '').trim(); });
      var rows = S.rows.map(function (r) { var o = {}; Object.keys(r).forEach(function (k) { o[k] = String(r[k] || '').trim(); }); return o; });
      d.fields.forEach(function (f) {
        var x = v[f[0]];
        if (f[3] && f[3].req && !x) errs.push('“' + f[1] + '” is required.');
        if (x && f[2] === 'url' && !httpUrl(x)) errs.push('“' + f[1] + '” must be a full URL starting with https://');
        if (x && f[2] === 'email' && !isEmail(x)) errs.push('“' + f[1] + '” is not a valid email address.');
        if (x && f[2] === 'lines' && /url|profile|social/i.test(f[1])) lines(x).forEach(function (l) { if (!httpUrl(l)) errs.push('“' + l + '” in “' + f[1] + '” is not a full URL.'); });
        if (x && f[2] === 'number' && isNaN(Number(x.replace(/,/g, '')))) errs.push('“' + f[1] + '” must be a number.');
      });
      if (d.rows) {
        var used = rows.filter(function (r) { return Object.keys(r).some(function (k) { return r[k]; }); });
        if (!used.length) errs.push('Add at least one ' + d.rows.label.toLowerCase() + '.');
        rows.forEach(function (r, i) {
          if (!Object.keys(r).some(function (k) { return r[k]; })) return;
          d.rows.fields.forEach(function (f) {
            if (f[3] && f[3].req && !r[f[0]]) errs.push(d.rows.label + ' ' + (i + 1) + ': “' + f[1] + '” is required.');
            if (r[f[0]] && f[2] === 'url' && !httpUrl(r[f[0]])) errs.push(d.rows.label + ' ' + (i + 1) + ': “' + f[1] + '” must be a full URL.');
          });
        });
      }
      var obj = d.build(v, warns, rows, errs);
      obj = Object.assign({ '@context': 'https://schema.org', '@type': obj['@type'] }, clean(obj) || {});
      json = JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');
      out.value = '<script type="application/ld+json">\n' + json + '\n</script>';
      var m = errs.map(function (x) { return notice('error', esc(x)); }).concat(warns.map(function (x) { return notice('warn', esc(x)); }));
      if (d.note) m.push(notice('', esc(d.note)));
      if (!errs.length) m.unshift(notice('ok', 'All required fields are filled in.'));
      BT.$('#sc-msgs', root).innerHTML = m.join('');
    }

    form.addEventListener('input', onEdit);
    form.addEventListener('change', onEdit);
    function onEdit(e) {
      var t = e.target, k = t.getAttribute && t.getAttribute('data-k');
      if (!k || !form.contains(t)) return;
      var ri = t.getAttribute('data-row');
      if (ri != null) { if (!state[cur].rows[+ri]) return; state[cur].rows[+ri][k] = t.value; } else state[cur].v[k] = t.value;
      generate();
    }
    BT.$('#sc-type', root).addEventListener('change', function (e) { cur = e.target.value; renderForm(); });
    onClickA(root, {
      add: function () { state[cur].rows.push({}); renderForm(); var f = BT.$$('.seo-rowc', form).pop(); if (f) BT.$('input,textarea', f).focus(); },
      del: function (b) { state[cur].rows.splice(+b.getAttribute('data-i'), 1); renderForm(); },
      up: function (b) { var i = +b.getAttribute('data-i'), r = state[cur].rows; var x = r[i]; r[i] = r[i - 1]; r[i - 1] = x; renderForm(); },
      reset: function () {
        var d = SCHEMA[cur], v = {};
        d.fields.forEach(function (f) { v[f[0]] = f[3].def != null ? f[3].def : (f[2] === 'select' ? (Array.isArray(f[3].options[0]) ? f[3].options[0][0] : f[3].options[0]) : ''); });
        state[cur] = { v: v, rows: d.rows ? d.rows.def.map(function (r) { return Object.assign({}, r); }) : [] };
        renderForm();
      },
      copy: function () { BT.copy(out.value, 'JSON-LD copied'); },
      copyjson: function () { BT.copy(json, 'JSON copied'); },
      dl: function () { BT.download(out.value + '\n', 'schema-' + cur.toLowerCase() + '.html', 'text/html'); }
    });
    renderForm();
  });

  // ===================================================== robots-txt-generator
  var AI_BOTS = ['GPTBot', 'ChatGPT-User', 'CCBot', 'Google-Extended', 'anthropic-ai', 'ClaudeBot', 'PerplexityBot', 'Bytespider', 'Applebot-Extended'];
  var UA_LIST = ['*', 'Googlebot', 'Googlebot-Image', 'Googlebot-News', 'Bingbot', 'DuckDuckBot', 'Slurp', 'YandexBot', 'Baiduspider', 'Applebot', 'facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'AhrefsBot', 'SemrushBot', 'MJ12bot'].concat(AI_BOTS);
  var ROBOT_PRESETS = {
    admin: { label: 'Block admin & login', rules: [['*', 'Disallow', '/admin/'], ['*', 'Disallow', '/wp-admin/'], ['*', 'Allow', '/wp-admin/admin-ajax.php'], ['*', 'Disallow', '/login/']] },
    search: { label: 'Block internal search', rules: [['*', 'Disallow', '/search'], ['*', 'Disallow', '/*?s='], ['*', 'Disallow', '/*?q=']] },
    shop: { label: 'Block cart & account', rules: [['*', 'Disallow', '/cart/'], ['*', 'Disallow', '/checkout/'], ['*', 'Disallow', '/my-account/']] },
    ai: { label: 'Block AI crawlers (optional)', rules: ['GPTBot', 'CCBot', 'Google-Extended', 'anthropic-ai', 'ClaudeBot', 'PerplexityBot'].map(function (b) { return [b, 'Disallow', '/']; }) }
  };

  BT.impl('robots-txt-generator', function (root) {
    css();
    var S = { mode: 'allow', rules: [] };
    root.innerHTML = '<div class="split">' +
      '<div class="card"><div class="card-title"><h2 class="seo-h">Rules</h2>' + btn('data-a="reset"', 'rotate-ccw', 'Reset', 'btn-ghost') + '</div>' +
      '<div class="field"><span class="label" id="rb-mode-l">Default for all crawlers</span>' + seg('rb-mode', [['allow', 'Allow all'], ['disallow', 'Disallow all']], 'allow', 'Default for all crawlers') + '</div>' +
      '<div class="seo-sec">Quick presets</div><div class="seo-presets">' + Object.keys(ROBOT_PRESETS).map(function (k) {
        return btn('data-a="preset" data-p="' + k + '"', k === 'ai' ? 'bot' : 'plus', esc(ROBOT_PRESETS[k].label));
      }).join('') + '</div>' +
      '<div class="seo-sec">Custom rules</div><div id="rb-rules"></div>' + btn('data-a="add"', 'plus', 'Add rule') +
      '<datalist id="seo-ua-list">' + UA_LIST.map(function (u) { return '<option value="' + esc(u) + '">'; }).join('') + '</datalist>' +
      '<div class="row cols-2" style="margin-top:16px">' +
      field('rb-delay', 'Crawl-delay (seconds, optional)', inp('rb-delay', 'text', 'e.g. 5', '', ' inputmode="numeric"'), 'Google ignores this. Bing and Yandex respect it.') +
      '</div>' +
      field('rb-sitemaps', 'Sitemap URL(s), one per line', '<textarea id="rb-sitemaps" rows="2" style="min-height:70px" placeholder="https://www.example.com/sitemap.xml"></textarea>') +
      '</div>' +
      '<div class="card"><div class="card-title"><h2 class="seo-h">robots.txt</h2><div class="btn-group">' + btn('data-a="copy"', 'copy', 'Copy', 'btn-primary') + btn('data-a="dl"', 'download', 'Download') + '</div></div>' +
      '<label for="rb-out" class="sr-only">robots.txt output</label><textarea id="rb-out" class="mono seo-out" readonly spellcheck="false"></textarea>' +
      '<div id="rb-msgs" class="seo-msgs" aria-live="polite"></div>' +
      '<p class="muted small" style="margin:12px 0 0">Upload the file to the root of your site so it is reachable at <code>https://yourdomain/robots.txt</code>. robots.txt controls crawling, not indexing: to keep a page out of Google use a <code>noindex</code> meta tag, and never rely on it to hide private content.</p>' +
      '</div></div>';
    var rulesBox = BT.$('#rb-rules', root), out = BT.$('#rb-out', root);

    function renderRules() {
      rulesBox.innerHTML = S.rules.length ? S.rules.map(function (r, i) {
        return '<div class="seo-rule">' +
          '<div class="field"><label for="rb-ua' + i + '">User-agent</label><input type="text" list="seo-ua-list" id="rb-ua' + i + '" data-i="' + i + '" data-k="ua" value="' + esc(r.ua) + '"></div>' +
          '<div class="field"><label for="rb-ty' + i + '">Rule</label><select id="rb-ty' + i + '" data-i="' + i + '" data-k="type"><option' + (r.type === 'Disallow' ? ' selected' : '') + '>Disallow</option><option' + (r.type === 'Allow' ? ' selected' : '') + '>Allow</option></select></div>' +
          '<div class="field r-path"><label for="rb-p' + i + '">Path</label><input type="text" id="rb-p' + i + '" data-i="' + i + '" data-k="path" placeholder="/private/" value="' + esc(r.path) + '"></div>' +
          '<button type="button" class="btn btn-sm btn-ghost seo-icon-btn r-del" data-a="del" data-i="' + i + '" aria-label="Remove rule ' + (i + 1) + '">' + BT.icon('trash-2') + '</button></div>';
      }).join('') : '<p class="muted small" style="margin:0 0 10px">No custom rules yet. Add one or use a preset.</p>';
      update();
    }
    function update() {
      var groups = [], byUa = {}, msgs = [];
      function g(ua) { var k = ua.toLowerCase(); if (!byUa[k]) { byUa[k] = { uas: [ua], lines: [] }; groups.push(byUa[k]); } return byUa[k]; }
      var star = g('*');
      if (S.mode === 'disallow') star.lines.push('Disallow: /');
      var seen = {};
      S.rules.forEach(function (r, i) {
        var ua = (r.ua || '').trim(), path = (r.path || '').trim();
        if (!ua) { msgs.push(['error', 'Rule ' + (i + 1) + ': enter a user-agent (use * for all crawlers).']); return; }
        if (/\s/.test(path)) msgs.push(['error', 'Rule ' + (i + 1) + ': paths cannot contain spaces. Encode them as %20.']);
        else if (path && !/^[\/*]/.test(path)) msgs.push(['warn', 'Rule ' + (i + 1) + ': paths should start with / (for example /' + esc(path) + ').']);
        if (!path && r.type === 'Allow') msgs.push(['warn', 'Rule ' + (i + 1) + ': an empty Allow rule does nothing.']);
        var line = r.type + ': ' + path, key = ua.toLowerCase() + '|' + line;
        if (seen[key]) return;
        seen[key] = 1;
        g(ua).lines.push(line.trim());
      });
      if (S.mode === 'allow' && !star.lines.length) star.lines.push('Disallow:');
      var delay = val(root, 'rb-delay');
      if (delay) {
        if (!/^\d+(\.\d+)?$/.test(delay)) msgs.push(['error', 'Crawl-delay must be a number of seconds.']);
        else { star.lines.push('Crawl-delay: ' + delay); msgs.push(['', 'Crawl-delay is ignored by Google; adjust Googlebot’s rate in Search Console only if it overloads your server.']); }
      }
      // Merge non-* groups that have identical rules into one group with several User-agent lines.
      var merged = [];
      groups.forEach(function (gr) {
        if (gr === star || !gr.lines.length) { if (gr === star) merged.push(gr); return; }
        var sig = gr.lines.join('\n'), same = null;
        merged.forEach(function (m) { if (m !== star && m.lines.join('\n') === sig) same = m; });
        if (same) same.uas.push(gr.uas[0]); else merged.push({ uas: gr.uas.slice(), lines: gr.lines.slice() });
      });
      var txt = ['# robots.txt'];
      merged.forEach(function (gr) {
        txt.push('');
        gr.uas.forEach(function (u) { txt.push('User-agent: ' + u); });
        gr.lines.forEach(function (l) { txt.push(l); });
      });
      var maps = lines(val(root, 'rb-sitemaps'));
      if (maps.length) txt.push('');
      maps.forEach(function (m) {
        if (!httpUrl(m)) msgs.push(['error', 'Sitemap “' + esc(m) + '” must be a full URL, e.g. https://www.example.com/sitemap.xml']);
        txt.push('Sitemap: ' + m);
      });
      out.value = txt.join('\n') + '\n';
      if (S.mode === 'disallow') msgs.unshift(['warn', '<strong>Disallow all</strong> blocks every crawler from your whole site. Use it only for staging or private sites.']);
      if (S.rules.some(function (r) { return /^(googlebot|\*)$/i.test((r.ua || '').trim()) && r.type === 'Disallow' && (r.path || '').trim() === '/'; }))
        msgs.unshift(['warn', 'A rule blocks Google from your entire site.']);
      if (S.rules.some(function (r) { return AI_BOTS.indexOf((r.ua || '').trim()) > -1; }))
        msgs.push(['', 'AI crawler rules are voluntary: well-behaved bots follow them. Blocking Google-Extended does not affect Google Search ranking.']);
      if (!maps.length) msgs.push(['', 'Tip: add your sitemap URL so search engines can find all your pages.']);
      BT.$('#rb-msgs', root).innerHTML = msgs.map(function (m) { return notice(m[0], m[1]); }).join('');
    }

    rulesBox.addEventListener('input', edit);
    rulesBox.addEventListener('change', edit);
    function edit(e) {
      var t = e.target, i = t.getAttribute('data-i'), k = t.getAttribute('data-k');
      if (i == null || !k) return;
      S.rules[+i][k] = t.value;
      update();
    }
    BT.$('#rb-delay', root).addEventListener('input', update);
    BT.$('#rb-sitemaps', root).addEventListener('input', update);
    wireSeg(BT.$('#rb-mode', root), function (v) { S.mode = v; update(); });
    onClickA(root, {
      add: function () { S.rules.push({ ua: '*', type: 'Disallow', path: '' }); renderRules(); var p = BT.$('#rb-p' + (S.rules.length - 1), root); if (p) p.focus(); },
      del: function (b) { S.rules.splice(+b.getAttribute('data-i'), 1); renderRules(); },
      preset: function (b) {
        var p = ROBOT_PRESETS[b.getAttribute('data-p')], added = 0;
        p.rules.forEach(function (r) {
          if (S.rules.some(function (x) { return x.ua === r[0] && x.type === r[1] && x.path === r[2]; })) return;
          S.rules.push({ ua: r[0], type: r[1], path: r[2] }); added++;
        });
        renderRules();
        BT.toast(added ? 'Added ' + plural(added, 'rule') : 'Those rules are already there');
      },
      reset: function () { S.rules = []; S.mode = 'allow'; setSeg(BT.$('#rb-mode', root), 'allow'); BT.$('#rb-delay', root).value = ''; BT.$('#rb-sitemaps', root).value = ''; renderRules(); },
      copy: function () { BT.copy(out.value, 'robots.txt copied'); },
      dl: function () { BT.download(out.value, 'robots.txt', 'text/plain'); }
    });
    renderRules();
  });

  // ======================================================== sitemap-generator
  function xmlEsc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]; });
  }
  var SM_MAX = 50000;

  BT.impl('sitemap-generator', function (root) {
    css();
    root.innerHTML = '<div class="split">' +
      '<div class="card"><div class="card-title"><h2 class="seo-h">Your URLs</h2><div class="btn-group">' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div></div>' +
      '<div class="field"><span class="label">Input type</span>' + seg('sm-mode', [['list', 'Full URLs'], ['base', 'Base URL + paths']], 'list', 'Input type') + '</div>' +
      '<div id="sm-base-f" class="hidden">' + field('sm-base', 'Base URL', inp('sm-base', 'url', 'https://www.example.com/')) + '</div>' +
      field('sm-in', '<span id="sm-in-l">URLs, one per line</span>', '<textarea id="sm-in" class="mono" style="min-height:220px" spellcheck="false" placeholder="https://www.example.com/\nhttps://www.example.com/about/\nhttps://www.example.com/contact/"></textarea>') +
      '<div class="row cols-3">' +
      field('sm-lastmod', 'Last modified', sel('sm-lastmod', [['none', 'Leave out'], ['today', 'Today'], ['custom', 'Pick a date']], 'today')) +
      field('sm-freq', 'Change frequency', sel('sm-freq', [['', 'Leave out'], 'always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'], '')) +
      field('sm-pri', 'Priority', sel('sm-pri', [['', 'Leave out'], '1.0', '0.9', '0.8', '0.7', '0.6', '0.5', '0.4', '0.3', '0.2', '0.1'], '')) +
      '</div>' +
      '<div id="sm-date-f" class="hidden">' + field('sm-date', 'Date', inp('sm-date', 'date', '', today())) + '</div>' +
      '<div class="seo-checks">' + chk('sm-samehost', 'Drop URLs from other domains', false) + chk('sm-sort', 'Sort URLs A–Z', false) + '</div>' +
      '</div>' +
      '<div class="card"><div class="card-title"><h2 class="seo-h">Sitemap</h2>' + seg('sm-fmt', [['xml', 'XML'], ['txt', 'Plain text']], 'xml', 'Output format') + '</div>' +
      '<div class="seo-toolbar">' + btn('data-a="copy"', 'copy', 'Copy', 'btn-primary') + btn('data-a="dl"', 'download', '<span id="sm-dl-l">Download sitemap.xml</span>') + '</div>' +
      '<div class="stats" id="sm-stats" style="margin-bottom:12px"></div>' +
      '<label for="sm-out" class="sr-only">Sitemap output</label><textarea id="sm-out" class="mono seo-out" readonly spellcheck="false"></textarea>' +
      '<div id="sm-msgs" class="seo-msgs" aria-live="polite"></div>' +
      notice('', 'Upload the file to your site root, add <code>Sitemap: https://yourdomain/sitemap.xml</code> to robots.txt, and submit it in Google Search Console under <strong>Sitemaps</strong>.') +
      '</div></div>';

    var input = BT.$('#sm-in', root), out = BT.$('#sm-out', root), modeEl = BT.$('#sm-mode', root), fmtEl = BT.$('#sm-fmt', root);
    var files = [];

    function build() {
      var mode = segVal(modeEl), fmt = segVal(fmtEl);
      BT.$('#sm-base-f', root).classList.toggle('hidden', mode !== 'base');
      BT.$('#sm-in-l', root).textContent = mode === 'base' ? 'Paths, one per line' : 'URLs, one per line';
      input.placeholder = mode === 'base' ? '/\n/about/\n/services/web-design/\n/contact/' : 'https://www.example.com/\nhttps://www.example.com/about/\nhttps://www.example.com/contact/';
      var lm = val(root, 'sm-lastmod');
      BT.$('#sm-date-f', root).classList.toggle('hidden', lm !== 'custom');
      BT.$('#sm-dl-l', root).textContent = 'Download ' + (fmt === 'xml' ? 'sitemap.xml' : 'sitemap.txt');

      var msgs = [], base = null;
      if (mode === 'base') {
        base = httpUrl(val(root, 'sm-base'));
        if (val(root, 'sm-base') && !base) msgs.push(['error', 'The base URL must start with https:// (for example https://www.example.com/).']);
      }
      var raw = input.value.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(function (l) { return l && l[0] !== '#'; });
      var urls = [], seen = {}, invalid = [], dupes = 0, other = [], hashes = 0, host = base ? base.host : null;
      raw.forEach(function (l) {
        var u = null;
        try { u = mode === 'base' ? (base ? new URL(l, base) : null) : new URL(l); } catch (e) { u = null; }
        if (!u || !/^https?:$/.test(u.protocol) || !u.hostname) { if (mode !== 'base' || base) invalid.push(l); return; }
        if (u.hash) { u.hash = ''; hashes++; }
        if (!host) host = u.host;
        if (u.host !== host) { other.push(u.href); if (val(root, 'sm-samehost')) return; }
        if (seen[u.href]) { dupes++; return; }
        seen[u.href] = 1;
        urls.push(u.href);
      });
      if (val(root, 'sm-sort')) urls.sort();
      var lastmod = lm === 'today' ? today() : lm === 'custom' ? val(root, 'sm-date') : '';
      var freq = val(root, 'sm-freq'), pri = val(root, 'sm-pri');

      files = [];
      var chunks = [];
      for (var i = 0; i < urls.length; i += SM_MAX) chunks.push(urls.slice(i, i + SM_MAX));
      chunks.forEach(function (list, ci) {
        var name = (chunks.length > 1 ? 'sitemap-' + (ci + 1) : 'sitemap') + '.' + fmt, body;
        if (fmt === 'txt') body = list.join('\n') + '\n';
        else {
          var parts = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
          list.forEach(function (u) {
            parts.push('  <url>', '    <loc>' + xmlEsc(u) + '</loc>');
            if (lastmod) parts.push('    <lastmod>' + lastmod + '</lastmod>');
            if (freq) parts.push('    <changefreq>' + freq + '</changefreq>');
            if (pri) parts.push('    <priority>' + pri + '</priority>');
            parts.push('  </url>');
          });
          parts.push('</urlset>');
          body = parts.join('\n') + '\n';
        }
        files.push({ name: name, data: body });
      });
      if (chunks.length > 1) {
        var origin = new URL(urls[0]).origin;
        var idx = ['<?xml version="1.0" encoding="UTF-8"?>', '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
        files.forEach(function (f) {
          idx.push('  <sitemap>', '    <loc>' + xmlEsc(origin + '/' + f.name) + '</loc>');
          if (lastmod) idx.push('    <lastmod>' + lastmod + '</lastmod>');
          idx.push('  </sitemap>');
        });
        idx.push('</sitemapindex>');
        files.unshift({ name: 'sitemap-index.xml', data: idx.join('\n') + '\n' });
        msgs.unshift(['', 'More than 50,000 URLs: split into ' + chunks.length + ' sitemap files plus <strong>sitemap-index.xml</strong>. Download gives you a ZIP; upload all files to ' + esc(origin) + '/ and submit the index file.']);
      }
      var shown = files.length ? files[0].data : '';
      out.value = shown.length > 1500000 ? shown.slice(0, 1500000) + '\n… (preview truncated, the download contains everything)' : shown;
      files.forEach(function (f) { if (new Blob([f.data]).size > 50 * 1024 * 1024) msgs.push(['warn', f.name + ' is larger than 50 MB uncompressed, the maximum allowed.']); });

      BT.$('#sm-stats', root).innerHTML = [['URLs', urls.length], ['Duplicates removed', dupes], ['Invalid', invalid.length], ['Other domains', other.length]].map(function (s) {
        return '<div class="stat"><div class="label">' + s[0] + '</div><div class="value">' + BT.fmtNum(s[1], 0) + '</div></div>';
      }).join('');
      if (mode === 'base' && !base && raw.length) msgs.push(['warn', 'Enter the base URL first.']);
      if (invalid.length) msgs.push(['error', plural(invalid.length, 'line') + ' could not be read as a URL and ' + (invalid.length === 1 ? 'was' : 'were') + ' skipped: ' +
        invalid.slice(0, 5).map(function (x) { return '<code>' + esc(x.slice(0, 80)) + '</code>'; }).join(', ') + (invalid.length > 5 ? ' …' : '')]);
      if (other.length) msgs.push(['warn', plural(other.length, 'URL') + ' ' + (other.length === 1 ? 'is' : 'are') + ' on a different domain than ' + esc(host) + '. A sitemap should only list URLs from its own site' +
        (val(root, 'sm-samehost') ? ' (they were dropped).' : '. Tick “Drop URLs from other domains” to remove them.')]);
      if (hashes) msgs.push(['', plural(hashes, '#fragment') + ' removed: search engines ignore the part after #.']);
      if (urls.length && /^http:/.test(urls[0])) msgs.push(['warn', 'Your URLs use http://. If your site supports HTTPS, list the https:// versions.']);
      if (freq || pri) msgs.push(['', 'Google ignores changefreq and priority; an accurate lastmod is what helps. They are harmless for other search engines.']);
      BT.$('#sm-msgs', root).innerHTML = msgs.map(function (m) { return notice(m[0], m[1]); }).join('');
    }

    var deb = BT.debounce(build, 250);
    input.addEventListener('input', function () { input.value.length > 200000 ? deb() : build(); });
    BT.$$('#sm-base,#sm-date', root).forEach(function (el) { el.addEventListener('input', build); });
    BT.$$('select,input[type=checkbox]', root).forEach(function (el) { el.addEventListener('change', build); });
    wireSeg(modeEl, build);
    wireSeg(fmtEl, build);
    onClickA(root, {
      sample: function () {
        if (segVal(modeEl) === 'base') {
          BT.$('#sm-base', root).value = 'https://www.example.com/';
          input.value = '/\n/about/\n/services/\n/services/web-design/\n/blog/seo-tips?ref=home&lang=en\n/contact/\n/about/';
        } else input.value = 'https://www.example.com/\nhttps://www.example.com/about/\nhttps://www.example.com/services/\nhttps://www.example.com/blog/seo-tips?ref=home&lang=en\nhttps://www.example.com/contact/#form\nhttps://www.example.com/about/\nhttps://other-site.com/page\nnot a url';
        build();
      },
      clear: function () { input.value = ''; build(); input.focus(); },
      copy: function () { if (files.length) BT.copy(files[0].data, 'Sitemap copied'); else BT.toast('Add some URLs first', 'error'); },
      dl: function (b) {
        if (!files.length) { BT.toast('Add some URLs first', 'error'); return; }
        if (files.length === 1) BT.download(files[0].data, files[0].name, segVal(fmtEl) === 'xml' ? 'application/xml' : 'text/plain');
        else BT.busy(b, function () { return BT.downloadZip(files, 'sitemaps.zip'); }, 'Zipping…');
      }
    });
    build();
  });

  // ================================================== keyword-density-checker
  var STOP_EN = ('a about above after again against all also am an and any are aren\'t as at be because been before being below between both but by can can\'t cannot could couldn\'t did didn\'t do does doesn\'t doing don\'t down during each even ever every few for from further get gets got had hadn\'t has hasn\'t have haven\'t having he he\'d he\'ll he\'s her here here\'s hers herself him himself his how how\'s however i i\'d i\'ll i\'m i\'ve if in into is isn\'t it it\'s its itself just let\'s like make many may me might more most much must mustn\'t my myself need no nor not now of off often on once one only or other others our ours ourselves out over own per really same shall shan\'t she she\'d she\'ll she\'s should shouldn\'t so some such than that that\'s the their theirs them themselves then there there\'s these they they\'d they\'ll they\'re they\'ve this those through to too under until up upon us use used using very via was wasn\'t we we\'d we\'ll we\'re we\'ve well were weren\'t what what\'s when when\'s where where\'s whether which while who who\'s whom why why\'s will with within without won\'t would wouldn\'t yes yet you you\'d you\'ll you\'re you\'ve your yours yourself yourselves').split(' ');
  var STOP_HI = ('hai hain ka ki ke ko se me mein main par aur ya bhi to tha thi the nahi nahin na kya ye yeh wo woh is us ek jo kar karo kare karna karte karta karti liye lie hum aap tum mera meri mere apna apni apne sab kuch koi ab jab tab agar lekin phir raha rahi rahe gaya gayi gaye hota hoti hote ho hua hui hue wala wali wale kaise kyun kyon kahan yahan wahan bahut sirf saath tak dwara diya liya ji hi ' +
    'है हैं का की के को से में पर और या भी तो था थी थे नहीं न क्या यह ये वह वो इस उस एक जो कि लिए हम आप तुम मैं कर करें करना हो हुआ हुई गया गई कुछ कोई अब जब तब अगर लेकिन फिर रहा रही रहे साथ तक द्वारा ही').split(' ');
  function setOf(arr) { var o = Object.create(null); arr.forEach(function (w) { o[w] = 1; }); return o; }
  var SET_EN = setOf(STOP_EN), SET_HI = setOf(STOP_HI);
  var BLOCK_TAGS = setOf('address article aside blockquote br dd div dl dt fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr li main nav ol p pre section table tbody td tfoot th thead tr ul option button label caption summary details'.split(' '));
  /** Visible text of an HTML string, with block boundaries kept as line breaks. Scripts/styles are dropped. */
  function htmlToText(html) { return docText(new DOMParser().parseFromString(html, 'text/html')); }
  function docText(d) {
    BT.$$('script,style,noscript,template,svg,iframe,object,embed,head', d).forEach(function (n) { n.remove(); });
    var outp = [];
    (function walk(n) {
      if (n.nodeType === 3) { outp.push(n.data); return; }
      if (n.nodeType !== 1 && n.nodeType !== 9 && n.nodeType !== 11) return;
      var tag = n.nodeName.toLowerCase(), blk = BLOCK_TAGS[tag];
      if (blk) outp.push('\n');
      if (tag === 'img' && n.getAttribute('alt')) outp.push(' ');
      for (var c = n.firstChild; c; c = c.nextSibling) walk(c);
      if (blk) outp.push('\n');
    })(d.body || d);
    return outp.join('').replace(/[ \t ]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
  }
  var segmenter = null;
  try { if (window.Intl && Intl.Segmenter) segmenter = new Intl.Segmenter(undefined, { granularity: 'word' }); } catch (e) { segmenter = null; }
  var WORD_RE;
  try { WORD_RE = new RegExp('[\\p{L}\\p{N}\\p{M}][\\p{L}\\p{N}\\p{M}\'’\\-]*', 'gu'); } catch (e) { WORD_RE = /[A-Za-z0-9À-ɏऀ-෿][A-Za-z0-9À-ɏऀ-෿'’\-]*/g; }
  function tokenize(text) {
    var toks = [];
    text = String(text).replace(/[’‘]/g, "'");
    if (segmenter) {
      for (var it = segmenter.segment(text)[Symbol.iterator](), r = it.next(); !r.done; r = it.next()) {
        if (r.value.isWordLike) toks.push(r.value.segment.toLowerCase());
      }
    } else {
      (text.match(WORD_RE) || []).forEach(function (w) { toks.push(w.toLowerCase()); });
    }
    return toks.map(function (w) { return w.replace(/^['\-]+|['\-]+$/g, ''); }).filter(Boolean);
  }
  /** Split into phrase chunks (sentences / clauses) of tokens so n-grams never cross punctuation. */
  function chunks(text) {
    return String(text).split(/[.!?;:।|•·,()[\]{}"“”\n\r\t]+|\s[-–—]\s/).map(tokenize).filter(function (c) { return c.length; });
  }

  BT.impl('keyword-density-checker', function (root) {
    css();
    var sort = { key: 'c', dir: -1 }, showAll = false, lastRows = [];
    root.innerHTML = '<div class="card"><div class="seo-toolbar">' +
      '<label class="sr-only" for="kd-in">Text or HTML</label>' + chk('kd-html', 'Input is HTML (strip tags, scripts &amp; styles)', false) +
      '<span class="spacer"></span>' + fileBtn('kd-file', '.txt,.html,.htm,.md,text/plain,text/html', 'Upload') +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<textarea id="kd-in" style="min-height:220px" placeholder="Paste your article, page copy or full HTML here…"></textarea>' +
      '<div class="row cols-2" style="margin-top:14px">' +
      field('kd-kw', 'Focus keyword or phrase', inp('kd-kw', 'text', 'e.g. gst calculator')) +
      '<div class="field"><span class="label">Options</span><div class="seo-checks" style="margin:6px 0 0">' + chk('kd-stop', 'Ignore English stopwords', true) +
      chk('kd-hi', 'Ignore Hindi stopwords (hai, ka, ki…)', false) + chk('kd-num', 'Ignore numbers', true) + '</div></div>' +
      '</div></div>' +
      '<div class="card"><div class="stats" id="kd-stats"></div><div id="kd-focus" class="seo-msgs"></div></div>' +
      '<div class="card"><div class="card-title"><h2 class="seo-h">Top keywords</h2>' + seg('kd-n', [['1', '1 word'], ['2', '2 words'], ['3', '3 words']], '1', 'Phrase length') + '</div>' +
      '<div id="kd-table"></div><div class="seo-toolbar" style="margin:12px 0 0">' + btn('data-a="more"', 'list-ordered', '<span id="kd-more-l">Show all</span>', 'btn-ghost') +
      '<span class="spacer"></span>' + btn('data-a="csv"', 'download', 'Download CSV') + '</div>' +
      '<p class="muted small" style="margin:10px 0 0">Density = occurrences ÷ total words × 100. Phrases never cross sentence or comma boundaries' + (segmenter ? '; words are split with your browser’s language-aware segmenter.' : '.') + '</p></div>';

    var ta = BT.$('#kd-in', root), nSeg = BT.$('#kd-n', root), autoHtml = true;
    function textOf() {
      var t = ta.value;
      return val(root, 'kd-html') ? htmlToText(t) : t;
    }
    function run() {
      var raw = ta.value;
      if (autoHtml) BT.$('#kd-html', root).checked = /<(html|body|p|div|h[1-6]|span|article|section|script|style)\b/i.test(raw);
      var text = textOf(), ch = chunks(text);
      var all = [].concat.apply([], ch), total = all.length;
      var stopEn = val(root, 'kd-stop'), stopHi = val(root, 'kd-hi'), noNum = val(root, 'kd-num');
      function isStop(w) { return (stopEn && SET_EN[w]) || (stopHi && SET_HI[w]); }
      function isNum(w) { return /^[\d.,:/%₹$-]+$/.test(w) || /^[०-९]+$/.test(w); }
      var uniq = {};
      all.forEach(function (w) { uniq[w] = 1; });
      var sentences = String(text).split(/[.!?।]+(\s|$)/).filter(function (s) { return s && s.trim().length > 1; }).length;
      BT.$('#kd-stats', root).innerHTML = [['Words', BT.fmtNum(total, 0)], ['Unique words', BT.fmtNum(Object.keys(uniq).length, 0)], ['Characters', BT.fmtNum([...text].length, 0)],
        ['Sentences', BT.fmtNum(sentences, 0)], ['Reading time', total ? Math.max(1, Math.round(total / 220)) + ' min' : '—']].map(function (s) {
        return '<div class="stat"><div class="label">' + s[0] + '</div><div class="value">' + s[1] + '</div></div>';
      }).join('');

      var n = +segVal(nSeg), counts = Object.create(null);
      ch.forEach(function (c) {
        for (var i = 0; i + n <= c.length; i++) {
          var g = c.slice(i, i + n);
          if (n === 1) { if (g[0].length < 2 && !/[^\x00-\x7f]/.test(g[0])) continue; if (isStop(g[0])) continue; }
          else if (isStop(g[0]) || isStop(g[n - 1])) continue;
          if (noNum && g.some(isNum)) continue;
          var k = g.join(' ');
          counts[k] = (counts[k] || 0) + 1;
        }
      });
      lastRows = Object.keys(counts).map(function (k) { return { k: k, c: counts[k], d: total ? counts[k] / total * 100 : 0 }; })
        .filter(function (r) { return n === 1 || r.c > 1; });
      renderTable();

      // Focus keyword
      var kw = tokenize(val(root, 'kd-kw')), fb = BT.$('#kd-focus', root);
      if (!kw.length || !total) { fb.innerHTML = total ? '' : '<p class="muted" style="margin:12px 0 0">Paste some text to see keyword statistics.</p>'; return; }
      var occ = 0;
      ch.forEach(function (c) {
        for (var i = 0; i + kw.length <= c.length; i++) {
          var ok = true;
          for (var j = 0; j < kw.length; j++) if (c[i + j] !== kw[j]) { ok = false; break; }
          if (ok) occ++;
        }
      });
      var dens = occ / total * 100, kind, msg;
      if (!occ) { kind = 'error'; msg = 'not found in the text. Use it naturally in the first paragraph and a heading.'; }
      else if (dens < 0.5) { kind = 'warn'; msg = 'a little low. Mention it naturally a few more times if it fits.'; }
      else if (dens <= 2.5) { kind = 'ok'; msg = 'in a healthy range (about 0.5–2.5%).'; }
      else if (dens <= 4) { kind = 'warn'; msg = 'high. Repeating it too often reads badly and can look like keyword stuffing; use synonyms instead.'; }
      else { kind = 'error'; msg = 'much too high and may be treated as keyword stuffing. Rewrite with synonyms and natural language.'; }
      fb.innerHTML = '<div style="margin-top:12px">' + notice(kind, '“<strong>' + esc(kw.join(' ')) + '</strong>” appears <strong>' + plural(occ, 'time') + '</strong> · density <strong>' + dens.toFixed(2) + '%</strong>, which is ' + msg) + '</div>';
    }
    function renderTable() {
      var rows = lastRows.slice().sort(function (a, b) {
        if (sort.key === 'k') return a.k.localeCompare(b.k) * sort.dir;
        return (a[sort.key] - b[sort.key]) * sort.dir || a.k.localeCompare(b.k);
      });
      var max = lastRows.reduce(function (m, r) { return Math.max(m, r.c); }, 1);
      var lim = showAll ? rows.length : Math.min(rows.length, 50);
      BT.$('#kd-more-l', root).textContent = showAll ? 'Show top 50' : 'Show all (' + BT.fmtNum(rows.length, 0) + ')';
      BT.$('[data-a="more"]', root).classList.toggle('hidden', rows.length <= 50);
      function th(key, label, cls) {
        var on = sort.key === key, arrow = on ? (sort.dir > 0 ? ' ▲' : ' ▼') : '';
        return '<th' + (cls ? ' class="' + cls + '"' : '') + ' aria-sort="' + (on ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none') + '"><button type="button" class="seo-sort" data-a="sort" data-k="' + key + '">' + label + arrow + '</button></th>';
      }
      BT.$('#kd-table', root).innerHTML = rows.length ? '<div class="table-wrap" style="max-height:520px;overflow:auto"><table class="table"><thead><tr><th class="num">#</th>' +
        th('k', 'Keyword') + th('c', 'Count', 'num') + th('d', 'Density', 'num') + '<th>Share</th></tr></thead><tbody>' +
        rows.slice(0, lim).map(function (r, i) {
          return '<tr><td class="num muted">' + (i + 1) + '</td><td class="seo-kw-cell">' + esc(r.k) + '</td><td class="num">' + r.c + '</td><td class="num">' + r.d.toFixed(2) + '%</td>' +
            '<td><span class="seo-kd-bar" style="width:' + Math.round(r.c / max * 90) + 'px"></span></td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="muted" style="margin:0">No ' + (segVal(nSeg) === '1' ? 'keywords' : 'repeated phrases') + ' yet.</p>';
    }
    var deb = BT.debounce(run, 250);
    ta.addEventListener('input', function () { ta.value.length > 100000 ? deb() : run(); });
    BT.$('#kd-kw', root).addEventListener('input', run);
    BT.$('#kd-html', root).addEventListener('change', function () { autoHtml = false; run(); });
    BT.$$('#kd-stop,#kd-hi,#kd-num', root).forEach(function (el) { el.addEventListener('change', run); });
    wireSeg(nSeg, function () { showAll = false; run(); });
    BT.$('#kd-file', root).addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      BT.readFile(f, 'text').then(function (t) { ta.value = t; autoHtml = true; run(); BT.toast('Loaded ' + f.name); }, function () { BT.toast('Could not read that file', 'error'); });
      e.target.value = '';
    });
    onClickA(root, {
      sort: function (b) {
        var k = b.getAttribute('data-k');
        if (sort.key === k) sort.dir = -sort.dir; else { sort.key = k; sort.dir = k === 'k' ? 1 : -1; }
        renderTable();
      },
      more: function () { showAll = !showAll; renderTable(); },
      sample: function () {
        autoHtml = true;
        ta.value = 'GST Calculator for Small Businesses in India\n\nOur free GST calculator helps small businesses work out GST in seconds. Enter the amount, choose the GST rate and the calculator shows the CGST, SGST and IGST split instantly.\n\n' +
          'Why use an online GST calculator? Manual calculations take time and mistakes are common, especially when you add GST to a price or remove GST from an inclusive amount. A GST calculator removes the guesswork.\n\n' +
          'How to calculate GST: multiply the original price by the GST rate and divide by 100. For example, 18% GST on ₹1,000 is ₹180, so the final price is ₹1,180. Small businesses, freelancers and shop owners use this every day.\n\n' +
          'The calculator works on your phone and computer, is free, and keeps your numbers private because nothing leaves your browser.';
        BT.$('#kd-kw', root).value = 'gst calculator';
        run();
      },
      clear: function () { ta.value = ''; autoHtml = true; run(); ta.focus(); },
      csv: function () {
        if (!lastRows.length) { BT.toast('Nothing to export yet', 'error'); return; }
        var rows = lastRows.slice().sort(function (a, b) { return b.c - a.c; });
        BT.download('keyword,count,density_percent\n' + rows.map(function (r) { return '"' + r.k.replace(/"/g, '""') + '",' + r.c + ',' + r.d.toFixed(3); }).join('\n') + '\n',
          'keyword-density-' + segVal(nSeg) + 'word.csv', 'text/csv');
      }
    });
    run();
  });

  // ============================================================== utm-builder
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'];
  var UTM_PRESETS = {
    whatsapp: ['WhatsApp', 'whatsapp', 'social'],
    facebook: ['Facebook', 'facebook', 'social'],
    instagram: ['Instagram', 'instagram', 'social'],
    email: ['Email newsletter', 'newsletter', 'email'],
    gads: ['Google Ads', 'google', 'cpc']
  };
  var UTM_HIST = 'seo-utm-history';
  /**
   * Add UTM parameters to a URL, keeping its other query parameters and #fragment
   * exactly as they were. Existing utm_* keys that are being set are replaced.
   */
  function addUtm(raw, params) {
    raw = String(raw || '').trim();
    if (!raw) throw new Error('Enter a URL');
    if (!/^[a-z][a-z0-9+.\-]*:/i.test(raw)) raw = 'https://' + raw.replace(/^\/+/, '');
    var hi = raw.indexOf('#'), hash = hi >= 0 ? raw.slice(hi) : '', rest = hi >= 0 ? raw.slice(0, hi) : raw;
    var qi = rest.indexOf('?'), base = qi >= 0 ? rest.slice(0, qi) : rest, query = qi >= 0 ? rest.slice(qi + 1) : '';
    var u = httpUrl(base);
    if (!u || /\s/.test(base)) throw new Error('“' + raw + '” is not a valid web address');
    if (/^https?:\/\/[^/]+$/i.test(base)) base += '/';
    var setting = {};
    Object.keys(params).forEach(function (k) { if (params[k]) setting[k] = 1; });
    var kept = query.split('&').filter(function (p) {
      if (!p) return false;
      var k = p.split('=')[0];
      try { k = decodeURIComponent(k.replace(/\+/g, ' ')); } catch (e) { /* keep raw */ }
      return !setting[k.toLowerCase()];
    });
    var add = UTM_KEYS.filter(function (k) { return params[k]; }).map(function (k) { return k + '=' + encodeURIComponent(params[k]); });
    var q = kept.concat(add).join('&');
    return base + (q ? '?' + q : '') + hash;
  }
  function qrSvg(q, text) {
    var qr = q(0, 'M');
    qr.addData(text);
    qr.make();
    var n = qr.getModuleCount(), m = 2, d = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) d += 'M' + (c + m) + ' ' + (r + m) + 'h1v1h-1z';
    return { n: n + m * 2, qr: qr, svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (n + m * 2) + ' ' + (n + m * 2) + '" shape-rendering="crispEdges" role="img" aria-label="QR code of the tagged link"><rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>' };
  }

  BT.impl('utm-builder', function (root) {
    css();
    var link = '', qrLib = null, hist = lsGet(UTM_HIST, []);
    if (!Array.isArray(hist)) hist = [];
    root.innerHTML = '<div class="card"><div class="card-title"><h2 class="seo-h">Campaign details</h2>' + seg('ub-mode', [['single', 'Single link'], ['bulk', 'Bulk']], 'single', 'Mode') + '</div>' +
      '<div class="seo-sec">Presets</div><div class="seo-presets">' + Object.keys(UTM_PRESETS).map(function (k) {
        return btn('data-a="preset" data-p="' + k + '"', null, esc(UTM_PRESETS[k][0]));
      }).join('') + btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<div id="ub-single">' + field('ub-url', 'Website URL <span style="color:var(--danger)" aria-hidden="true">*</span>', inp('ub-url', 'url', 'https://www.example.com/offer?ref=home#pricing'), 'Existing query parameters and #anchors are kept.') + '</div>' +
      '<div id="ub-bulk" class="hidden">' + field('ub-urls', 'Website URLs, one per line', '<textarea id="ub-urls" class="mono" style="min-height:130px" spellcheck="false" placeholder="https://www.example.com/\nhttps://www.example.com/pricing/"></textarea>') + '</div>' +
      '<div class="row cols-3">' +
      field('ub-source', 'Campaign source (utm_source) <span style="color:var(--danger)" aria-hidden="true">*</span>', inp('ub-source', 'text', 'google, newsletter, whatsapp')) +
      field('ub-medium', 'Campaign medium (utm_medium)', inp('ub-medium', 'text', 'cpc, email, social')) +
      field('ub-campaign', 'Campaign name (utm_campaign)', inp('ub-campaign', 'text', 'diwali_sale')) +
      field('ub-term', 'Campaign term (utm_term)', inp('ub-term', 'text', 'Paid keywords')) +
      field('ub-content', 'Campaign content (utm_content)', inp('ub-content', 'text', 'banner_top, link_2')) +
      field('ub-id', 'Campaign ID (utm_id)', inp('ub-id', 'text', 'Optional')) +
      '</div><div class="seo-checks">' + chk('ub-lower', 'Convert values to lowercase', true) + chk('ub-space', 'Replace spaces with _', true) + '</div></div>' +

      '<div class="card" id="ub-out-single"><div class="card-title"><h2 class="seo-h">Your tracking link</h2><div class="btn-group">' +
      btn('data-a="copy"', 'copy', 'Copy', 'btn-primary') + btn('data-a="save"', 'plus', 'Save to history') + '<a class="btn btn-sm btn-ghost hidden" id="ub-open" target="_blank" rel="noopener noreferrer">' + BT.icon('external-link') + '<span>Open</span></a></div></div>' +
      '<div class="seo-link" id="ub-link" aria-live="polite"></div><div id="ub-msgs" class="seo-msgs" aria-live="polite"></div>' +
      '<div style="margin-top:14px">' + chk('ub-qr', 'Show QR code for this link', false) + '</div>' +
      '<div class="seo-qr hidden" id="ub-qrwrap"><div class="box" id="ub-qrbox"></div><div class="btn-group">' + btn('data-a="qrpng"', 'download', 'PNG') + btn('data-a="qrsvg"', 'download', 'SVG') + '</div></div></div>' +

      '<div class="card hidden" id="ub-out-bulk"><div class="card-title"><h2 class="seo-h">Tagged links</h2><div class="btn-group">' + btn('data-a="copybulk"', 'copy', 'Copy all', 'btn-primary') + btn('data-a="csv"', 'download', 'Download CSV') + '</div></div>' +
      '<label for="ub-bout" class="sr-only">Tagged links</label><textarea id="ub-bout" class="mono" readonly spellcheck="false" style="min-height:180px"></textarea><div id="ub-bmsgs" class="seo-msgs"></div></div>' +

      '<div class="card"><div class="card-title"><h2 class="seo-h">History</h2>' + btn('data-a="clearhist"', 'trash-2', 'Clear history', 'btn-ghost') + '</div>' +
      '<div id="ub-hist" class="seo-hist"></div><p class="muted small" style="margin:10px 0 0">History is saved only in this browser.</p></div>';

    var modeEl = BT.$('#ub-mode', root), bulkRows = [];
    function params() {
      var p = {};
      [['utm_source', 'ub-source'], ['utm_medium', 'ub-medium'], ['utm_campaign', 'ub-campaign'], ['utm_term', 'ub-term'], ['utm_content', 'ub-content'], ['utm_id', 'ub-id']].forEach(function (x) {
        var v = val(root, x[1]).replace(/\s+/g, ' ');
        if (val(root, 'ub-lower')) v = v.toLowerCase();
        if (val(root, 'ub-space')) v = v.replace(/ /g, '_');
        p[x[0]] = v;
      });
      return p;
    }
    function pretty(l) {
      var hi = l.indexOf('#'), hash = hi >= 0 ? l.slice(hi) : '', rest = hi >= 0 ? l.slice(0, hi) : l, qi = rest.indexOf('?');
      return qi < 0 ? esc(rest) + (hash ? '<span class="hh">' + esc(hash) + '</span>' : '') :
        esc(rest.slice(0, qi)) + '<span class="q">' + esc(rest.slice(qi)) + '</span>' + (hash ? '<span class="hh">' + esc(hash) + '</span>' : '');
    }
    function update() {
      var bulk = segVal(modeEl) === 'bulk', p = params(), msgs = [];
      BT.$('#ub-single', root).classList.toggle('hidden', bulk);
      BT.$('#ub-bulk', root).classList.toggle('hidden', !bulk);
      BT.$('#ub-out-single', root).classList.toggle('hidden', bulk);
      BT.$('#ub-out-bulk', root).classList.toggle('hidden', !bulk);
      if (!p.utm_source) msgs.push(['warn', 'Add a campaign source (utm_source). It is required for tracking.']);
      if (p.utm_source && !p.utm_medium) msgs.push(['warn', 'Add a medium too, otherwise Google Analytics groups the visits poorly.']);
      if (p.utm_source && !p.utm_campaign) msgs.push(['', 'Tip: add a campaign name so you can compare campaigns in Google Analytics.']);
      if (/[A-Z]/.test(Object.keys(p).map(function (k) { return p[k]; }).join(''))) msgs.push(['', 'UTM values are case-sensitive: “Facebook” and “facebook” show up as different sources.']);
      if (!bulk) {
        var raw = val(root, 'ub-url'), open = BT.$('#ub-open', root);
        link = '';
        if (raw) { try { link = addUtm(raw, p); } catch (e) { msgs.unshift(['error', esc(e.message)]); } }
        BT.$('#ub-link', root).innerHTML = link ? pretty(link) : '<span class="muted">Enter a URL and a source to build your link.</span>';
        if (link && raw.indexOf('#') > -1 && /#.*\?/.test(raw)) msgs.push(['warn', 'This URL has a “?” after the # (common in single-page apps). The UTM tags were added before the # where analytics tools read them.']);
        if (link) { open.href = link; open.classList.remove('hidden'); } else open.classList.add('hidden');
        BT.$('#ub-msgs', root).innerHTML = msgs.map(function (m) { return notice(m[0], m[1]); }).join('');
        renderQr();
      } else {
        var bm = [];
        bulkRows = [];
        lines(val(root, 'ub-urls')).forEach(function (l, i) {
          try { bulkRows.push([l, addUtm(l, p)]); } catch (e) { bm.push('Line ' + (i + 1) + ': ' + e.message); }
        });
        BT.$('#ub-bout', root).value = bulkRows.map(function (r) { return r[1]; }).join('\n');
        BT.$('#ub-bmsgs', root).innerHTML = msgs.map(function (m) { return notice(m[0], m[1]); }).join('') +
          (bm.length ? notice('error', bm.slice(0, 10).map(esc).join('<br>') + (bm.length > 10 ? '<br>…' : '')) : '') +
          (bulkRows.length ? notice('ok', plural(bulkRows.length, 'link') + ' tagged.') : '');
      }
    }
    function renderQr() {
      var on = val(root, 'ub-qr'), wrap = BT.$('#ub-qrwrap', root), box = BT.$('#ub-qrbox', root);
      wrap.classList.toggle('hidden', !on || !link);
      if (!on || !link) return;
      if (!qrLib) {
        box.innerHTML = '<span class="spinner"></span>';
        BT.loadLib('qrcode').then(function (q) {
          if (q.stringToBytesFuncs && q.stringToBytesFuncs['UTF-8']) q.stringToBytes = q.stringToBytesFuncs['UTF-8'];
          qrLib = q;
          renderQr();
        }).catch(function () { box.innerHTML = '<span class="small" style="color:var(--danger)">Could not load the QR engine.</span>'; });
        return;
      }
      try { box.innerHTML = qrSvg(qrLib, link).svg; } catch (e) { box.innerHTML = '<span class="small" style="color:var(--danger)">Link too long for a QR code.</span>'; }
    }
    function renderHist() {
      BT.$('#ub-hist', root).innerHTML = hist.length ? hist.map(function (h, i) {
        return '<div class="seo-hist-item"><span class="u" title="' + esc(h.link) + '">' + esc(h.link) + '</span>' +
          '<button type="button" class="btn btn-sm btn-ghost seo-icon-btn" data-a="hcopy" data-i="' + i + '" aria-label="Copy link ' + (i + 1) + '">' + BT.icon('copy') + '</button>' +
          '<button type="button" class="btn btn-sm btn-ghost seo-icon-btn" data-a="huse" data-i="' + i + '" aria-label="Load link ' + (i + 1) + ' into the form">' + BT.icon('undo-2') + '</button>' +
          '<button type="button" class="btn btn-sm btn-ghost seo-icon-btn" data-a="hdel" data-i="' + i + '" aria-label="Remove link ' + (i + 1) + ' from history">' + BT.icon('x') + '</button></div>';
      }).join('') : '<p class="muted small" style="margin:0">Links you copy or save appear here.</p>';
    }
    function save() {
      if (!link) return;
      hist = hist.filter(function (h) { return h.link !== link; });
      hist.unshift({ link: link, url: val(root, 'ub-url'), p: params(), t: Date.now() });
      hist = hist.slice(0, 30);
      if (!lsSet(UTM_HIST, hist)) BT.toast('History could not be saved in this browser', 'error');
      renderHist();
    }
    function qrCanvas(scale) {
      var r = qrSvg(qrLib, link), n = r.n, cv = document.createElement('canvas'), x;
      cv.width = cv.height = n * scale;
      x = cv.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height); x.fillStyle = '#000';
      var mc = r.qr.getModuleCount();
      for (var i = 0; i < mc; i++) for (var j = 0; j < mc; j++) if (r.qr.isDark(i, j)) x.fillRect((j + 2) * scale, (i + 2) * scale, scale, scale);
      return cv;
    }

    BT.bindInputs(root, update);
    wireSeg(modeEl, update);
    onClickA(root, {
      preset: function (b) {
        var p = UTM_PRESETS[b.getAttribute('data-p')];
        BT.$('#ub-source', root).value = p[1];
        BT.$('#ub-medium', root).value = p[2];
        update();
        BT.$('#ub-campaign', root).focus();
      },
      sample: function () {
        BT.$('#ub-url', root).value = 'https://www.example.com/offers/?ref=home#pricing';
        BT.$('#ub-urls', root).value = 'https://www.example.com/\nhttps://www.example.com/pricing/?plan=pro\nexample.com/contact#form';
        BT.$('#ub-source', root).value = 'whatsapp'; BT.$('#ub-medium', root).value = 'social'; BT.$('#ub-campaign', root).value = 'Diwali Sale 2026';
        BT.$('#ub-content', root).value = 'status_post';
        update();
      },
      clear: function () { BT.$$('#ub-url,#ub-urls,#ub-source,#ub-medium,#ub-campaign,#ub-term,#ub-content,#ub-id', root).forEach(function (el) { el.value = ''; }); update(); },
      copy: function () { if (!link) { BT.toast('Enter a valid URL first', 'error'); return; } BT.copy(link, 'Link copied'); save(); },
      save: function () { if (!link) { BT.toast('Enter a valid URL first', 'error'); return; } save(); BT.toast('Saved to history'); },
      copybulk: function () { var t = BT.$('#ub-bout', root).value; if (t) BT.copy(t, 'Links copied'); else BT.toast('Nothing to copy', 'error'); },
      csv: function () {
        if (!bulkRows.length) { BT.toast('Nothing to export', 'error'); return; }
        var q = function (s) { return '"' + String(s).replace(/"/g, '""') + '"'; };
        BT.download('original_url,tagged_url\n' + bulkRows.map(function (r) { return q(r[0]) + ',' + q(r[1]); }).join('\n') + '\n', 'utm-links.csv', 'text/csv');
      },
      hcopy: function (b) { var h = hist[+b.getAttribute('data-i')]; if (h) BT.copy(h.link, 'Link copied'); },
      hdel: function (b) { hist.splice(+b.getAttribute('data-i'), 1); lsSet(UTM_HIST, hist.length ? hist : null); renderHist(); },
      huse: function (b) {
        var h = hist[+b.getAttribute('data-i')];
        if (!h) return;
        setSeg(modeEl, 'single');
        BT.$('#ub-url', root).value = h.url || '';
        var map = { utm_source: 'ub-source', utm_medium: 'ub-medium', utm_campaign: 'ub-campaign', utm_term: 'ub-term', utm_content: 'ub-content', utm_id: 'ub-id' };
        Object.keys(map).forEach(function (k) { BT.$('#' + map[k], root).value = (h.p && h.p[k]) || ''; });
        update();
        window.scrollTo({ top: root.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
      },
      clearhist: function () { hist = []; lsSet(UTM_HIST, null); renderHist(); BT.toast('History cleared'); },
      qrpng: function () { if (qrLib && link) BT.canvasToBlob(qrCanvas(10)).then(function (b) { BT.download(b, 'utm-link-qr.png'); }); },
      qrsvg: function () { if (qrLib && link) BT.download(qrSvg(qrLib, link).svg, 'utm-link-qr.svg', 'image/svg+xml'); }
    });
    renderHist();
  });

  // ======================================================= on-page-seo-checker
  function metaBy(doc, attr, name) {
    var all = doc.getElementsByTagName('meta');
    for (var i = 0; i < all.length; i++) if ((all[i].getAttribute(attr) || '').trim().toLowerCase() === name) return all[i];
    return null;
  }
  function relHas(el, v) { return (' ' + (el.getAttribute('rel') || '').toLowerCase().replace(/\s+/g, ' ') + ' ').indexOf(' ' + v + ' ') > -1; }
  function txt(el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function norm(s) { return String(s || '').toLowerCase().replace(/[\s\-_]+/g, ' ').trim(); }
  function schemaTypes(o, out) {
    if (Array.isArray(o)) { o.forEach(function (x) { schemaTypes(x, out); }); return out; }
    if (o && typeof o === 'object') {
      if (o['@type']) [].concat(o['@type']).forEach(function (t) { if (out.indexOf(String(t)) < 0) out.push(String(t)); });
      Object.keys(o).forEach(function (k) { if (o[k] && typeof o[k] === 'object') schemaTypes(o[k], out); });
    }
    return out;
  }

  /** Audit an HTML string. Never executes anything: DOMParser documents are inert. */
  function auditHtml(html, kwRaw, pageUrl) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var C = [], kw = norm(kwRaw);
    function add(group, name, status, weight, detail, list) { C.push({ group: group, name: name, status: status, weight: weight, detail: detail, list: list || null }); }
    var base = httpUrl(pageUrl);

    // Title
    var titles = doc.querySelectorAll('head title, title'), title = titles.length ? txt(titles[0]) : '';
    var tpx = textWidth(title, '20px Arial'), tn = [...title].length;
    if (!title) add('Basics', 'Title tag', 'fail', 10, 'No &lt;title&gt; found. Every page needs a unique, descriptive title.');
    else {
      add('Basics', 'Title tag', 'pass', 10, '“' + esc(title) + '”');
      add('Basics', 'Title length', tpx > 600 ? 'warn' : tn < 30 ? 'warn' : 'pass', 5,
        tn + ' characters, ~' + Math.round(tpx) + ' px. ' + (tpx > 600 ? 'Likely cut off in Google (≈600 px). Shorten it.' : tn < 30 ? 'Short; 50–60 characters usually works best.' : 'Good length.'));
    }
    if (doc.getElementsByTagName('title').length > 1) add('Basics', 'Multiple title tags', 'warn', 2, 'Found ' + doc.getElementsByTagName('title').length + ' &lt;title&gt; elements. Keep only one.');

    // Description
    var md = metaBy(doc, 'name', 'description'), desc = md ? (md.getAttribute('content') || '').trim() : '';
    if (!desc) add('Basics', 'Meta description', 'fail', 8, 'Missing. Write a 120–160 character summary to improve clicks from search.');
    else {
      var dn = [...desc].length;
      add('Basics', 'Meta description', dn < 70 || dn > 160 ? 'warn' : 'pass', 8, dn + ' characters. ' + (dn < 70 ? 'Rather short.' : dn > 160 ? 'May be truncated (aim for 120–160).' : 'Good length.') + ' “' + esc(desc.slice(0, 200)) + '”');
    }

    // Headings
    var h1s = Array.prototype.map.call(doc.querySelectorAll('h1'), txt);
    if (!h1s.length) add('Content', 'H1 heading', 'fail', 8, 'No H1 found. Use one H1 that describes the page topic.');
    else if (h1s.length > 1) add('Content', 'H1 heading', 'warn', 8, 'Found ' + h1s.length + ' H1 headings. Use a single H1 for the main topic and H2–H6 for sections.', h1s.map(function (h) { return h || '(empty)'; }));
    else add('Content', 'H1 heading', h1s[0] ? 'pass' : 'warn', 8, h1s[0] ? '“' + esc(h1s[0]) + '”' : 'The H1 is empty.');
    var hs = Array.prototype.map.call(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'), function (h) { return { l: +h.tagName[1], t: txt(h) }; });
    var prev = 0, skips = [];
    hs.forEach(function (h) { h.bad = prev && h.l > prev + 1; if (h.bad) skips.push('H' + prev + ' → H' + h.l + ': ' + (h.t || '(empty)')); prev = h.l; });
    if (hs.length) add('Content', 'Heading hierarchy', skips.length ? 'warn' : 'pass', 3, skips.length ? plural(skips.length, 'skipped level') + ' (e.g. H2 straight to H4). Keep the outline in order for screen readers and search engines.' : plural(hs.length, 'heading') + ' in a logical order.', skips.length ? skips : null);

    // Words
    var wordsAll = chunks(docText(doc.cloneNode(true))), words = [].concat.apply([], wordsAll), wc = words.length;
    add('Content', 'Word count', wc < 100 ? 'fail' : wc < 300 ? 'warn' : 'pass', 5, BT.fmtNum(wc, 0) + ' words of visible text. ' + (wc < 300 ? 'Thin content rarely ranks well; most pages need 300+ helpful words (unless it is a tool or contact page).' : 'Enough content to work with.'));

    // Keyword
    if (kw) {
      var paras = Array.prototype.map.call(doc.querySelectorAll('body p'), txt).filter(function (p) { return p.length > 30; });
      var inT = norm(title).indexOf(kw) > -1, inH = h1s.some(function (h) { return norm(h).indexOf(kw) > -1; }), inD = norm(desc).indexOf(kw) > -1, inP = paras.length && norm(paras[0]).indexOf(kw) > -1;
      add('Keyword', 'Keyword in title', inT ? 'pass' : 'fail', 4, inT ? 'Found in the title.' : 'The title does not contain “' + esc(kwRaw) + '”.');
      add('Keyword', 'Keyword in H1', inH ? 'pass' : 'warn', 3, inH ? 'Found in the H1.' : 'Not found in the H1.');
      add('Keyword', 'Keyword in meta description', inD ? 'pass' : 'warn', 3, inD ? 'Found in the description (Google bolds it).' : 'Not found in the meta description.');
      add('Keyword', 'Keyword in first paragraph', inP ? 'pass' : 'warn', 2, inP ? 'Found in the opening paragraph.' : paras.length ? 'Not in the first paragraph. Mention the topic early.' : 'No paragraph text found.');
      if (base) {
        var path = norm(decodeURIComponentSafe(base.pathname).replace(/[\/.]/g, ' '));
        var inU = path.indexOf(kw) > -1 || kw.split(' ').every(function (w) { return path.indexOf(w) > -1; });
        add('Keyword', 'Keyword in URL', inU ? 'pass' : 'warn', 2, inU ? 'The URL contains the keyword.' : 'The URL slug does not contain the keyword. Short, descriptive slugs help a little.');
      }
      var kt = tokenize(kwRaw), occ = 0;
      wordsAll.forEach(function (c) { for (var i = 0; i + kt.length <= c.length; i++) { var ok = true; for (var j = 0; j < kt.length; j++) if (c[i + j] !== kt[j]) { ok = false; break; } if (ok) occ++; } });
      var dens = wc ? occ / wc * 100 : 0;
      add('Keyword', 'Keyword density', !occ ? 'warn' : dens > 3 ? 'warn' : 'pass', 2, plural(occ, 'time') + ', ' + dens.toFixed(2) + '% of words. ' + (!occ ? 'Not used in the body text.' : dens > 3 ? 'Too frequent; it may read as keyword stuffing.' : 'Natural usage.'));
    }

    // Technical
    var canon = Array.prototype.filter.call(doc.querySelectorAll('link[rel]'), function (l) { return relHas(l, 'canonical'); });
    if (!canon.length) add('Technical', 'Canonical URL', 'warn', 5, 'No canonical link. Add &lt;link rel="canonical" href="https://…"&gt; to say which URL is the main version.');
    else {
      var ch = (canon[0].getAttribute('href') || '').trim(), cu = httpUrl(ch);
      var cst = canon.length > 1 ? 'warn' : cu ? 'pass' : 'warn';
      var cdet = canon.length > 1 ? 'Found ' + canon.length + ' canonical tags; Google may ignore them all. Keep one.' : cu ? esc(ch) : 'The canonical should be an absolute URL (https://…): “' + esc(ch) + '”.';
      if (cu && base && cu.href.replace(/\/$/, '') !== base.href.replace(/[#?].*$/, '').replace(/\/$/, '')) { cst = 'warn'; cdet += ' — points to a different URL than the page URL you entered. That is fine for duplicates, otherwise check it.'; }
      add('Technical', 'Canonical URL', cst, 5, cdet);
    }
    var rob = metaBy(doc, 'name', 'robots'), gbot = metaBy(doc, 'name', 'googlebot');
    var rc = ((rob ? rob.getAttribute('content') : '') + ',' + (gbot ? gbot.getAttribute('content') : '')).toLowerCase();
    if (/noindex|(^|[,\s])none([,\s]|$)/.test(rc)) add('Technical', 'Robots meta', 'fail', 10, '<strong>noindex</strong> is set, so search engines will not show this page. Remove it if the page should rank.');
    else if (/nofollow/.test(rc)) add('Technical', 'Robots meta', 'warn', 4, 'nofollow is set: search engines will not follow any links on this page.');
    else add('Technical', 'Robots meta', 'pass', 4, rob ? 'Indexable (' + esc(rob.getAttribute('content') || '') + ').' : 'No robots meta tag, so the page is indexable by default.');
    var lang = (doc.documentElement.getAttribute('lang') || '').trim();
    add('Technical', 'Language attribute', lang ? 'pass' : 'warn', 3, lang ? '&lt;html lang="' + esc(lang) + '"&gt;' : 'Add a lang attribute, e.g. &lt;html lang="en-IN"&gt;, for accessibility and correct language targeting.');
    var vp = metaBy(doc, 'name', 'viewport');
    add('Technical', 'Mobile viewport', vp && /width\s*=\s*device-width/i.test(vp.getAttribute('content') || '') ? 'pass' : 'fail', 5,
      vp ? esc(vp.getAttribute('content') || '') : 'Missing &lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;. Without it the page is not mobile-friendly.');
    var cs = doc.querySelector('meta[charset]') || metaBy(doc, 'http-equiv', 'content-type');
    add('Technical', 'Character set', cs ? 'pass' : 'warn', 2, cs ? 'Declared.' : 'Add &lt;meta charset="utf-8"&gt; as the first tag in &lt;head&gt;.');
    var fav = Array.prototype.some.call(doc.querySelectorAll('link[rel]'), function (l) { return relHas(l, 'icon') || relHas(l, 'apple-touch-icon'); });
    add('Technical', 'Favicon', fav ? 'pass' : 'warn', 2, fav ? 'Favicon link found.' : 'No favicon link. Google shows it next to your result on mobile and desktop.');
    var hre = Array.prototype.filter.call(doc.querySelectorAll('link[hreflang]'), function (l) { return relHas(l, 'alternate'); });
    if (!hre.length) add('Technical', 'hreflang', 'info', 0, 'Not used. Only needed if you have the same page in several languages or regions.');
    else {
      var badH = hre.filter(function (l) { return !/^(x-default|[a-z]{2,3}(-[a-z]{4})?(-([a-z]{2}|\d{3}))?)$/i.test(l.getAttribute('hreflang') || '') || !httpUrl(l.getAttribute('href') || ''); });
      var hasX = hre.some(function (l) { return (l.getAttribute('hreflang') || '').toLowerCase() === 'x-default'; });
      add('Technical', 'hreflang', badH.length ? 'warn' : 'pass', 1, plural(hre.length, 'alternate') + (hasX ? ' including x-default.' : ' (consider adding x-default).') + (badH.length ? ' Some codes or URLs are invalid (use codes like en-IN and absolute URLs).' : ''),
        hre.map(function (l) { return (l.getAttribute('hreflang') || '?') + ' → ' + (l.getAttribute('href') || ''); }));
    }
    var ids = {}, dup = [];
    Array.prototype.forEach.call(doc.querySelectorAll('[id]'), function (el) { var id = el.id; if (ids[id] === 1) dup.push(id); ids[id] = (ids[id] || 0) + 1; });
    add('Technical', 'Duplicate IDs', dup.length ? 'warn' : 'pass', 2, dup.length ? plural(dup.length, 'id') + ' used more than once. IDs must be unique (it breaks labels, anchors and scripts).' : 'All id attributes are unique.', dup.length ? dup : null);
    var inl = doc.querySelectorAll('body [style]').length;
    add('Technical', 'Inline styles', inl > 30 ? 'warn' : 'pass', 1, plural(inl, 'element') + ' with a style attribute.' + (inl > 30 ? ' Moving styles into a stylesheet keeps the HTML lighter.' : ''));

    // Social
    var ogs = ['og:title', 'og:description', 'og:image', 'og:url'].filter(function (p) { return !metaBy(doc, 'property', p) && !metaBy(doc, 'name', p); });
    add('Social', 'Open Graph tags', ogs.length === 0 ? 'pass' : ogs.length >= 3 ? 'fail' : 'warn', 4, ogs.length ? 'Missing: ' + ogs.join(', ') + '. These control how links look on WhatsApp, Facebook and LinkedIn.' : 'og:title, og:description, og:image and og:url are present.');
    var twc = metaBy(doc, 'name', 'twitter:card') || metaBy(doc, 'property', 'twitter:card');
    add('Social', 'X (Twitter) card', twc ? 'pass' : 'warn', 2, twc ? 'twitter:card = ' + esc(twc.getAttribute('content') || '') : 'No twitter:card tag. Add &lt;meta name="twitter:card" content="summary_large_image"&gt;.');

    // Structured data
    var ld = doc.querySelectorAll('script[type]'), types = [], errs = [], blocks = 0;
    Array.prototype.forEach.call(ld, function (s, i) {
      if ((s.getAttribute('type') || '').trim().toLowerCase() !== 'application/ld+json') return;
      blocks++;
      try { schemaTypes(JSON.parse(s.textContent), types); } catch (e) { errs.push('Block ' + blocks + ': ' + e.message); }
    });
    var micro = doc.querySelectorAll('[itemtype]').length;
    if (errs.length) add('Structured data', 'Structured data', 'fail', 3, plural(errs.length, 'JSON-LD block') + ' could not be parsed. Search engines ignore invalid JSON.', errs);
    else if (blocks || micro) add('Structured data', 'Structured data', 'pass', 3, (blocks ? plural(blocks, 'JSON-LD block') + (types.length ? ': ' + types.map(esc).join(', ') : '') : '') + (micro ? (blocks ? '; ' : '') + plural(micro, 'microdata item') : '') + '.');
    else add('Structured data', 'Structured data', 'warn', 3, 'None found. Schema markup (Organization, Article, Product, FAQ…) can earn rich results. Try the Schema Markup Generator.');

    // Images
    var imgs = doc.querySelectorAll('img'), noAlt = [], deco = 0;
    Array.prototype.forEach.call(imgs, function (im) {
      if (!im.hasAttribute('alt')) noAlt.push(im.getAttribute('src') || im.getAttribute('data-src') || '(no src)');
      else if (!im.getAttribute('alt').trim()) deco++;
    });
    if (!imgs.length) add('Images', 'Image alt text', 'info', 0, 'No images on the page.');
    else add('Images', 'Image alt text', !noAlt.length ? 'pass' : noAlt.length / imgs.length > 0.2 ? 'fail' : 'warn', 6,
      noAlt.length ? plural(noAlt.length, 'image') + ' of ' + imgs.length + ' have no alt attribute. Describe each image (or use alt="" if purely decorative).' :
        'All ' + plural(imgs.length, 'image') + ' have alt attributes' + (deco ? ' (' + deco + ' marked decorative with alt="")' : '') + '.', noAlt.length ? noAlt : null);

    // Links
    var anchors = doc.querySelectorAll('a[href]'), internal = 0, external = 0, nofollow = 0, other = 0, empty = [], extList = [];
    var hostRef = base || httpUrl(canon.length ? canon[0].getAttribute('href') : '');
    Array.prototype.forEach.call(anchors, function (a) {
      var href = (a.getAttribute('href') || '').trim();
      if (!href || href[0] === '#' || /^(javascript|mailto|tel|sms|data):/i.test(href)) { other++; return; }
      var abs = null;
      try { abs = new URL(href, hostRef ? hostRef.href : 'https://relative.invalid/'); } catch (e) { other++; return; }
      var isInt = abs.hostname === 'relative.invalid' || (hostRef && abs.hostname.replace(/^www\./, '') === hostRef.hostname.replace(/^www\./, ''));
      if (!isInt && !hostRef && !/^[a-z][a-z0-9+.\-]*:|^\/\//i.test(href)) isInt = true;
      if (isInt) internal++; else { external++; extList.push(abs.href); }
      if (relHas(a, 'nofollow') || relHas(a, 'ugc') || relHas(a, 'sponsored')) nofollow++;
      var label = txt(a) || (a.getAttribute('aria-label') || '').trim() || (a.getAttribute('title') || '').trim() ||
        Array.prototype.map.call(a.querySelectorAll('img[alt]'), function (i) { return i.getAttribute('alt'); }).join(' ').trim();
      if (!label) empty.push(href);
    });
    add('Links', 'Internal links', internal ? 'pass' : 'warn', 3, plural(internal, 'internal link') + (hostRef ? ' (same host as ' + esc(hostRef.hostname) + ')' : ' (relative links; enter the page URL for exact results)') + '. ' + (internal ? '' : 'Link to related pages on your site to help visitors and crawlers.'));
    add('Links', 'External links', 'info', 0, plural(external, 'external link') + ', ' + plural(nofollow, 'link') + ' marked nofollow/ugc/sponsored, ' + other + ' anchors, mailto: or tel: links.', extList.length ? extList.slice(0, 100) : null);
    if (empty.length) add('Links', 'Links without text', 'warn', 2, plural(empty.length, 'link') + ' have no text or accessible name. Search engines and screen readers cannot tell where they go.', empty);

    // Score
    var tot = 0, got = 0;
    C.forEach(function (c) { if (c.status === 'info') return; tot += c.weight; got += c.weight * (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0); });
    var outline = hs;
    return { checks: C, score: tot ? Math.round(got / tot * 100) : 0, outline: outline, stats: { words: wc, links: anchors.length, images: imgs.length, headings: hs.length } };
  }
  function decodeURIComponentSafe(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }

  BT.impl('on-page-seo-checker', function (root) {
    css();
    var last = null;
    root.innerHTML = '<div class="card"><div class="seo-toolbar"><label for="op-in" class="seo-inl" style="margin-right:auto">Page HTML</label>' +
      fileBtn('op-file', '.html,.htm,text/html', 'Upload .html') + btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<textarea id="op-in" class="mono" style="min-height:200px" spellcheck="false" placeholder="Paste the full HTML source of your page (in your browser: right-click → View page source → select all → copy)."></textarea>' +
      '<div class="row cols-2" style="margin-top:14px">' + field('op-kw', 'Focus keyword (optional)', inp('op-kw', 'text', 'e.g. gst calculator')) +
      field('op-url', 'Page URL (optional)', inp('op-url', 'url', 'https://www.example.com/page/'), 'Used to tell internal from external links and to check the slug.') + '</div>' +
      '<p class="muted small" style="margin:0">The HTML is analysed inside your browser as inert text: scripts in it are never run and nothing is uploaded.</p></div>' +
      '<div id="op-res"></div>';
    var ta = BT.$('#op-in', root), res = BT.$('#op-res', root), filter = 'all';

    function run() {
      var html = ta.value;
      if (!html.trim()) { last = null; res.innerHTML = '<div class="card"><p class="muted" style="margin:0">Paste HTML above to see the SEO report.</p></div>'; return; }
      last = auditHtml(html, val(root, 'op-kw'), val(root, 'op-url'));
      render();
    }
    function render() {
      var r = last, cnt = { pass: 0, warn: 0, fail: 0 };
      r.checks.forEach(function (c) { if (cnt[c.status] != null) cnt[c.status]++; });
      var col = r.score >= 80 ? 'var(--ok)' : r.score >= 50 ? 'var(--warn)' : 'var(--danger)';
      var verdict = r.score >= 80 ? 'Good. A few tweaks left.' : r.score >= 50 ? 'Needs work. Fix the failed checks first.' : 'Poor. Several important basics are missing.';
      var order = { fail: 0, warn: 1, pass: 2, info: 3 };
      var list = r.checks.slice().sort(function (a, b) { return order[a.status] - order[b.status] || b.weight - a.weight; })
        .filter(function (c) { return filter === 'all' || c.status === 'fail' || c.status === 'warn'; });
      var label = { pass: 'Pass', warn: 'Warn', fail: 'Fail', info: 'Info' }, bcls = { pass: 'ok', warn: 'warn', fail: 'danger', info: '' };
      res.innerHTML = '<div class="card"><div class="seo-score"><div class="seo-ring" style="--p:' + r.score + ';--c:' + col + '" role="img" aria-label="SEO score ' + r.score + ' out of 100"><div><span><b>' + r.score + '</b><small>/ 100</small></span></div></div>' +
        '<div style="flex:1;min-width:200px"><h2 class="seo-h" style="font-size:1.25rem">' + esc(verdict) + '</h2><p class="muted" style="margin:6px 0 10px">Weighted score from ' + plural(cnt.pass + cnt.warn + cnt.fail, 'check') + '.</p>' +
        '<div class="btn-group"><span class="badge danger">' + cnt.fail + ' failed</span><span class="badge warn">' + cnt.warn + ' warnings</span><span class="badge ok">' + cnt.pass + ' passed</span></div></div></div>' +
        '<div class="stats" style="margin-top:16px">' + [['Words', r.stats.words], ['Headings', r.stats.headings], ['Links', r.stats.links], ['Images', r.stats.images]].map(function (s) {
          return '<div class="stat"><div class="label">' + s[0] + '</div><div class="value">' + BT.fmtNum(s[1], 0) + '</div></div>';
        }).join('') + '</div></div>' +
        '<div class="card"><div class="card-title"><h2 class="seo-h">Checks</h2>' + seg('op-filter', [['all', 'All'], ['issues', 'Issues only']], filter, 'Filter checks') + '</div>' +
        '<div class="seo-clist">' + (list.length ? list.map(function (c) {
          return '<div class="seo-ci ' + c.status + '"><div class="hd"><span class="badge ' + bcls[c.status] + '">' + label[c.status] + '</span><div style="min-width:0"><div class="nm">' + esc(c.name) +
            ' <span class="muted small">· ' + esc(c.group) + '</span></div><div class="dt">' + c.detail + '</div>' +
            (c.list ? '<ul>' + c.list.slice(0, 60).map(function (x) { return '<li>' + esc(String(x).slice(0, 300)) + '</li>'; }).join('') + (c.list.length > 60 ? '<li>… and ' + (c.list.length - 60) + ' more</li>' : '') + '</ul>' : '') +
            '</div></div></div>';
        }).join('') : '<p class="muted" style="margin:0">No issues found.</p>') + '</div></div>' +
        '<div class="card"><div class="card-title"><h2 class="seo-h">Heading outline</h2><span class="muted small">Red = skipped level</span></div>' +
        (r.outline.length ? '<div class="seo-tree">' + r.outline.map(function (h) {
          return '<div' + (h.bad ? ' class="bad"' : '') + ' style="padding-left:' + ((h.l - 1) * 18) + 'px"><span class="tg">H' + h.l + '</span> ' + (h.t ? esc(h.t) : '<span class="muted">(empty)</span>') + '</div>';
        }).join('') + '</div>' : '<p class="muted" style="margin:0">No headings found.</p>') + '</div>';
      wireSeg(BT.$('#op-filter', res), function (v) { filter = v; render(); });
    }
    var deb = BT.debounce(run, 300);
    ta.addEventListener('input', deb);
    BT.$('#op-kw', root).addEventListener('input', deb);
    BT.$('#op-url', root).addEventListener('input', deb);
    BT.$('#op-file', root).addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      if (f.size > 20 * 1024 * 1024) { BT.toast('That file is larger than 20 MB', 'error'); return; }
      BT.readFile(f, 'text').then(function (t) { ta.value = t; run(); BT.toast('Loaded ' + f.name); }, function () { BT.toast('Could not read that file', 'error'); });
      e.target.value = '';
    });
    onClickA(root, {
      sample: function () {
        ta.value = '<!doctype html>\n<html lang="en-IN">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>GST Calculator Online – Free CGST, SGST &amp; IGST Calculator</title>\n' +
          '<meta name="description" content="Free GST calculator for India. Add or remove GST at 5%, 12%, 18% or 28% and see the CGST, SGST and IGST split instantly.">\n<link rel="canonical" href="https://www.example.com/tools/gst-calculator/">\n' +
          '<meta property="og:title" content="GST Calculator Online">\n<meta property="og:image" content="https://www.example.com/og.png">\n<link rel="icon" href="/favicon.svg">\n' +
          '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"GST Calculator","applicationCategory":"FinanceApplication"}</script>\n</head>\n<body>\n' +
          '<header><a href="/"><img src="/logo.svg"></a><nav><a href="/tools/">Tools</a> <a href="/about/">About</a></nav></header>\n<main>\n<h1>GST Calculator</h1>\n' +
          '<p>Use this free GST calculator to add or remove GST from any amount. Choose a rate and the GST calculator shows the tax split for intra-state and inter-state supplies.</p>\n' +
          '<h3>How GST is calculated</h3>\n<p>Multiply the price by the GST rate and divide by 100. For inclusive prices, divide by 1 plus the rate.</p>\n<img src="/gst-example.png" alt="GST calculation example">\n<img src="/chart.png">\n' +
          '<h2>Frequently asked questions</h2>\n<p>See the <a href="https://www.gst.gov.in/" rel="nofollow">official GST portal</a> for current rates.</p>\n</main>\n<footer><a href="/privacy/">Privacy</a></footer>\n</body>\n</html>';
        BT.$('#op-kw', root).value = 'gst calculator';
        BT.$('#op-url', root).value = 'https://www.example.com/tools/gst-calculator/';
        run();
      },
      clear: function () { ta.value = ''; run(); ta.focus(); }
    });
    run();
  });

  // ================================================== backlink-outreach-helper
  // [id, name, official URL or null, why it helps, tip]
  var BL_GROUPS = [
    ['Search engines & maps', 'map-pin', [
      ['gsc', 'Google Search Console', 'https://search.google.com/search-console', 'Verify your site, submit your sitemap and see which searches bring you visitors and which pages have problems.', 'Add a Domain property (DNS verification) so http/https and www/non-www are all covered.'],
      ['gbp', 'Google Business Profile', 'https://www.google.com/business/', 'Puts your business on Google Maps and in the local “near me” results, often the biggest source of local enquiries.', 'Use exactly the same name, address and phone number (NAP) everywhere. Add photos and politely ask real customers for reviews; never pay for or incentivise them.'],
      ['bwt', 'Bing Webmaster Tools', 'https://www.bing.com/webmasters', 'Bing’s index also feeds other search engines and AI assistants, so being verified there widens your reach.', 'You can import your site from Google Search Console in one click.'],
      ['bplaces', 'Bing Places for Business', 'https://www.bingplaces.com/', 'Your business listing on Bing Maps and Bing local results.', 'It can import your details from Google Business Profile.'],
      ['apple', 'Apple Business Connect', 'https://businessconnect.apple.com/', 'Shows your business correctly in Apple Maps, Siri and Spotlight on iPhones.', 'Add opening hours and photos; many iPhone users search maps directly.']
    ]],
    ['Indian business directories', 'landmark', [
      ['justdial', 'JustDial', 'https://www.justdial.com/', 'A widely used local search service in India; a consistent listing builds trust and local citations.', 'The free listing is enough to start. Be cautious of paid packages that promise rankings.'],
      ['sulekha', 'Sulekha', 'https://www.sulekha.com/', 'Popular for service businesses (IT, training, home services) looking for local leads.', 'Pick accurate categories and service areas instead of listing everything.'],
      ['indiamart', 'IndiaMART', 'https://www.indiamart.com/', 'India’s large B2B marketplace: useful if you manufacture, supply or trade products.', 'Complete the catalogue with real photos, specifications and GST details.'],
      ['tradeindia', 'TradeIndia', 'https://www.tradeindia.com/', 'Another established B2B directory for suppliers and exporters.', 'Keep company details identical to your website and GST registration.'],
      ['yellowpages', 'Yellow Pages India', null, 'A classic business directory that adds a consistent citation for your business.', 'Several look-alike sites use this name: make sure you are on a genuine, reputable directory before signing up or paying anything.'],
      ['asklaila', 'AskLaila', null, 'Local search for Indian cities; another citation for your name, address and phone number.', 'Check that the service is still active and well maintained before spending time on it.']
    ]],
    ['Social & profile pages', 'users', [
      ['linkedin', 'LinkedIn company page', 'https://www.linkedin.com/', 'Builds credibility with B2B clients and recruiters, and ranks for your brand name.', 'Add your website, logo, address and a short description that matches your site.'],
      ['facebook', 'Facebook page', 'https://www.facebook.com/', 'Many Indian customers check a Facebook page before calling a local business.', 'Fill in hours, phone, WhatsApp number and website; reply to messages promptly.'],
      ['instagram', 'Instagram', 'https://www.instagram.com/', 'Visual proof of your work; a professional account can show contact buttons.', 'Put your website in the bio and use a consistent handle across networks.'],
      ['x', 'X (Twitter)', 'https://x.com/', 'Claims your brand handle and helps people find official updates.', 'Even if you post rarely, keep the bio and website link accurate.'],
      ['youtube', 'YouTube', 'https://www.youtube.com/', 'The second-biggest search engine; short how-to videos can bring steady traffic.', 'Add your website to the channel links and to each video description.'],
      ['pinterest', 'Pinterest', 'https://www.pinterest.com/', 'Good for visual niches (design, food, décor, fashion); pins can drive traffic for years.', 'Use a free business account and claim your website.'],
      ['quora', 'Quora (Spaces & answers)', 'https://www.quora.com/', 'Answering real questions in your field builds authority and occasional referral visits.', 'Write genuinely helpful answers; only link when it truly adds value, and disclose your affiliation.'],
      ['medium', 'Medium', 'https://medium.com/', 'A place to republish or summarise your expertise and reach new readers.', 'If you republish an article, use Medium’s import feature so it sets a canonical link to your original.']
    ]],
    ['Tool & software directories', 'layout-grid', [
      ['producthunt', 'Product Hunt', 'https://www.producthunt.com/', 'A launch can bring a burst of early users, feedback and mentions from tech blogs.', 'Prepare good screenshots and a clear tagline, and launch when you can reply to comments all day.'],
      ['alternativeto', 'AlternativeTo', 'https://alternativeto.net/', 'People actively look for alternatives to popular tools here; a relevant listing brings qualified visitors.', 'List your tool as an alternative only to products it genuinely replaces.'],
      ['saashub', 'SaaSHub', 'https://www.saashub.com/', 'Software directory with comparison pages that rank well in search.', 'Claim the listing and keep features and pricing up to date.'],
      ['g2', 'G2 (for software products)', 'https://www.g2.com/', 'Business buyers compare software and read verified reviews here.', 'Only relevant if you sell software; invite real customers to review, never write reviews yourself.'],
      ['capterra', 'Capterra (for software products)', 'https://www.capterra.com/', 'Large software review directory used by small businesses.', 'Same as G2: genuine customer reviews only.']
    ]],
    ['Community & relationships', 'megaphone', [
      ['reddit', 'Relevant Reddit communities', 'https://www.reddit.com/', 'Being genuinely helpful in niche communities builds reputation and word-of-mouth.', 'Read and follow each community’s rules; most ban self-promotion. Contribute first and share links only where allowed.'],
      ['indiehackers', 'Indie Hackers', 'https://www.indiehackers.com/', 'A friendly community for founders; sharing your journey can attract users and feedback.', 'Share lessons and numbers, not just announcements.'],
      ['partners', 'Suppliers, partners & clients', null, 'Businesses you already work with may list you on their partners, clients or suppliers page: a highly relevant, natural link.', 'Ask politely (use the partnership template below) and offer a genuine testimonial in return.'],
      ['assoc', 'Trade associations & chambers of commerce', null, 'Member directories of industry bodies and local chambers are trusted, relevant citations.', 'Join only bodies that are genuinely useful to your business; the listing is a bonus.'],
      ['press', 'Local news & industry blogs', null, 'A real story (launch, milestone, community work) can earn coverage and editorial links.', 'Pitch journalists with a short, newsworthy angle; never pay for “sponsored” links without proper rel="sponsored" tags.']
    ]]
  ];
  var BL_KEY = 'seo-backlink-checklist';

  function blTemplates(d) {
    var me = d.name || '[Your name]', site = d.site || '[Your site name]', url = d.url || '[your website]', page = d.page || '[link to your page]';
    var who = d.partner || 'there', their = d.their || '[their page]', why = d.reason || '[why it is useful to their readers]', broken = d.broken || '[broken link URL]';
    var sig = '\n\nBest regards,\n' + me + '\n' + site + ' · ' + url;
    return [
      ['resource', 'Resource page link request', 'A suggestion for your resources page',
        'Hi ' + who + ',\n\nI came across your page ' + their + ' while researching this topic, and found it genuinely useful. Thank you for putting it together.\n\n' +
        'I run ' + site + ', and we recently published ' + page + '. ' + why + ' I thought it might be a helpful addition for your readers.\n\n' +
        'If you feel it fits, you are welcome to include it. Either way, thanks for the great resource.' + sig],
      ['broken', 'Broken link replacement', 'A broken link on your page',
        'Hi ' + who + ',\n\nI was reading ' + their + ' and noticed that one of the links no longer works:\n' + broken + '\n\n' +
        'In case it helps, we have an up-to-date page on the same topic: ' + page + '. ' + why + '\n\n' +
        'Of course, any working resource would do. I just wanted to let you know about the broken link.' + sig],
      ['guest', 'Guest post pitch', 'Article idea for ' + (d.partner ? d.partner + '’s readers' : 'your readers'),
        'Hi ' + who + ',\n\nI regularly read ' + their + ' and enjoy the practical advice. I would like to write an original article for your readers.\n\n' +
        'A few ideas:\n• ' + (d.reason || '[Topic idea 1]') + '\n• [Topic idea 2]\n• [Topic idea 3]\n\n' +
        'The article would be written only for you, follow your editorial guidelines, and include links only where they genuinely help readers. I am happy for any link to us to carry whatever rel attribute your policy requires.\n\n' +
        'You can see examples of my writing here: ' + page + '.\n\nWould any of these interest you?' + sig],
      ['partner', 'Partnership / supplier link', 'Listing ' + site + ' on your partners page',
        'Hi ' + who + ',\n\nIt has been great working with you. ' + why + '\n\n' +
        'I noticed you list partners and suppliers on ' + their + '. Would you be open to adding ' + site + ' there, with a link to ' + url + '?\n\n' +
        'In return I would be glad to write a short testimonial about working with you, or list you on our own clients/partners page if that is useful.\n\nThank you for considering it.' + sig]
    ];
  }

  BT.impl('backlink-outreach-helper', function (root) {
    css();
    var done = lsGet(BL_KEY, {});
    if (!done || typeof done !== 'object') done = {};
    var total = 0;
    BL_GROUPS.forEach(function (g) { total += g[2].length; });

    root.innerHTML = notice('warn', '<span><strong>Only use genuine methods.</strong> Automated “backlink generators”, buying or selling links, large-scale link exchanges, private blog networks (PBNs) and comment or forum spam violate ' +
        '<a href="https://developers.google.com/search/docs/essentials/spam-policies" target="_blank" rel="noopener noreferrer">Google’s spam policies</a> and can get a site penalised or removed from search results. ' +
        'This helper only lists legitimate places to list your business and polite, personal outreach. Many profile links are nofollow; their value is visibility, trust and real visitors.</span>') +
      '<div class="card" style="margin-top:16px"><div class="card-title"><h2 class="seo-h">Listing checklist</h2><div class="btn-group">' + btn('data-a="export"', 'download', 'Download') + btn('data-a="reset"', 'rotate-ccw', 'Reset', 'btn-ghost') + '</div></div>' +
      '<div style="display:flex;justify-content:space-between;gap:8px;font-size:.88rem;font-weight:600;margin-bottom:6px"><span id="bl-prog-t"></span><span id="bl-prog-p"></span></div>' +
      '<div class="seo-prog" role="progressbar" aria-label="Checklist progress" aria-valuemin="0" aria-valuemax="' + total + '" id="bl-prog"><span></span></div>' +
      BL_GROUPS.map(function (g, gi) {
        return '<div class="seo-bl-group"><h3>' + '<span style="display:inline-flex;gap:8px;align-items:center">' + BT.icon(g[1]) + esc(g[0]) + '</span><span class="badge" id="bl-g' + gi + '"></span></h3>' + g[2].map(function (it) {
          return '<div class="seo-bl-item" data-item="' + it[0] + '"><input type="checkbox" id="bl-' + it[0] + '" data-id="' + it[0] + '"' + (done[it[0]] ? ' checked' : '') + '>' +
            '<div style="min-width:0"><label class="nm" for="bl-' + it[0] + '">' + esc(it[1]) + '</label>' +
            (it[2] ? ' <a class="small" href="' + esc(it[2]) + '" target="_blank" rel="noopener noreferrer">' + esc(it[2].replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '')) + ' ' + BT.icon('external-link') + '<span class="sr-only"> (opens in a new tab)</span></a>' : '') +
            '<div class="why">' + esc(it[3]) + '</div><div class="tip"><strong>Tip:</strong> ' + esc(it[4]) + '</div></div></div>';
        }).join('') + '</div>';
      }).join('') +
      '<p class="muted small" style="margin:14px 0 0">Your progress is saved in this browser only. Keep your business name, address and phone number identical on every listing.</p></div>' +
      '<div class="card"><div class="card-title"><h2 class="seo-h">Outreach email templates</h2></div>' +
      '<div class="row cols-2">' +
      field('bl-name', 'Your name', inp('bl-name', 'text', 'Priya Sharma')) +
      field('bl-site', 'Your site / business name', inp('bl-site', 'text', 'BISCS India')) +
      field('bl-url', 'Your website', inp('bl-url', 'url', 'https://www.example.com/')) +
      field('bl-page', 'Your page to suggest', inp('bl-page', 'url', 'https://www.example.com/guides/gst-basics/')) +
      field('bl-partner', 'Their name', inp('bl-partner', 'text', 'Rahul')) +
      field('bl-their', 'Their page or site', inp('bl-their', 'text', 'https://partner.example/resources/')) +
      field('bl-broken', 'Broken link (for the broken-link email)', inp('bl-broken', 'text', 'https://old-site.example/gst-guide')) +
      '</div>' +
      field('bl-reason', 'Why your page helps their readers', '<textarea id="bl-reason" rows="2" style="min-height:70px" placeholder="It explains GST rates for small shops in plain language, with a free calculator."></textarea>') +
      notice('', 'Personalise every email, send them one at a time, and follow up at most once. If someone says no or does not reply, respect that.') +
      '<div class="seo-tpl" id="bl-tpl" style="margin-top:16px"></div></div>';

    function progress() {
      var n = 0;
      BL_GROUPS.forEach(function (g, gi) {
        var gn = g[2].filter(function (it) { return done[it[0]]; }).length;
        n += gn;
        BT.$('#bl-g' + gi, root).textContent = gn + ' / ' + g[2].length;
      });
      var pct = Math.round(n / total * 100);
      BT.$('#bl-prog span', root).style.width = pct + '%';
      BT.$('#bl-prog', root).setAttribute('aria-valuenow', n);
      BT.$('#bl-prog-t', root).textContent = n + ' of ' + total + ' done';
      BT.$('#bl-prog-p', root).textContent = pct + '%';
      BT.$$('.seo-bl-item', root).forEach(function (el) { el.classList.toggle('done', !!done[el.getAttribute('data-item')]); });
    }
    function templates() {
      var d = {};
      ['name', 'site', 'url', 'page', 'partner', 'their', 'broken', 'reason'].forEach(function (k) { d[k] = val(root, 'bl-' + k).replace(/\s+$/, ''); });
      if (d.reason && !/[.!?]$/.test(d.reason)) d.reason += '.';
      var T = blTemplates(d);
      BT.$('#bl-tpl', root).innerHTML = T.map(function (t) {
        return '<div><div class="card-title" style="margin-bottom:8px"><h3 class="seo-h" style="font-size:.98rem">' + esc(t[1]) + '</h3><div class="btn-group">' +
          btn('data-a="tcopy" data-t="' + t[0] + '"', 'copy', 'Copy', 'btn-primary') + '</div></div>' +
          '<label class="sr-only" for="bl-t-' + t[0] + '">' + esc(t[1]) + ' email</label>' +
          '<textarea id="bl-t-' + t[0] + '" spellcheck="true">Subject: ' + esc(t[2]) + '\n\n' + esc(t[3]) + '</textarea></div>';
      }).join('');
    }
    root.addEventListener('change', function (e) {
      var id = e.target.getAttribute && e.target.getAttribute('data-id');
      if (!id) return;
      if (e.target.checked) done[id] = Date.now(); else delete done[id];
      if (!lsSet(BL_KEY, done)) BT.toast('Progress could not be saved in this browser', 'error');
      progress();
    });
    BT.$$('#bl-name,#bl-site,#bl-url,#bl-page,#bl-partner,#bl-their,#bl-broken,#bl-reason', root).forEach(function (el) { el.addEventListener('input', templates); });
    onClickA(root, {
      tcopy: function (b) { var ta = BT.$('#bl-t-' + b.getAttribute('data-t'), root); if (ta) BT.copy(ta.value, 'Email copied'); },
      reset: function () {
        if (!window.confirm('Untick every item in the checklist?')) return;
        done = {};
        lsSet(BL_KEY, null);
        BT.$$('.seo-bl-item input', root).forEach(function (c) { c.checked = false; });
        progress();
      },
      export: function () {
        var out = ['Business listing checklist (BISCS Tools)', ''];
        BL_GROUPS.forEach(function (g) {
          out.push(g[0].toUpperCase());
          g[2].forEach(function (it) { out.push((done[it[0]] ? '[x] ' : '[ ] ') + it[1] + (it[2] ? ' - ' + it[2] : '')); });
          out.push('');
        });
        BT.download(out.join('\n'), 'listing-checklist.txt', 'text/plain');
      }
    });
    progress();
    templates();
  });

  // If core booted before this script registered its tools, start the tool now.
  function bootFallback() {
    var root = document.getElementById('tool-root');
    if (!root || root.getAttribute('data-bt-started')) return;
    var id = root.getAttribute('data-tool'), fn = LOCAL[id];
    var only = root.children.length === 1 && root.firstElementChild.matches('.notice.error');
    if (!fn || !only) return;
    root.setAttribute('data-bt-started', '1');
    root.innerHTML = '';
    try { fn(root, { tool: BT.tool(id), category: BT.category((BT.tool(id) || {}).cat) }); } catch (e) {
      console.error(e);
      root.innerHTML = '<div class="notice error">' + BT.icon('info') + '<span>Something went wrong: ' + esc(e.message) + '</span></div>';
    }
  }
  if (document.readyState === 'complete') setTimeout(bootFallback, 0);
  else {
    setTimeout(bootFallback, 0);
    window.addEventListener('load', bootFallback);
  }
})();
