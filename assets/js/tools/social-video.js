/*
 * BISCS Tools — YouTube & social video tools.
 * Shorts & Reels maker, aspect converter, thumbnail maker, frame grabber,
 * subtitle maker, chapters generator, speed changer, add music, merger,
 * watermark and specs checker.
 *
 * Everything runs in the visitor's browser on their own files: processing
 * uses the shared self-hosted ffmpeg.wasm engine (BT.loadFFmpeg) and face
 * tracking uses the self-hosted MediaPipe face detector. No file is uploaded
 * and no third-party service is contacted. Text that is burned into a video
 * (titles, captions, watermarks) is drawn with <canvas> — so Hindi, Bengali
 * and emoji are shaped correctly by the browser — and composited by ffmpeg.
 */
(function () {
  'use strict';
  var BT = window.BT;
  if (!BT) return;
  var doc = document;
  var h = BT.h, esc = BT.esc;
  function register(id, fn) { BT.impl(id, fn); }
  function noop() {}
  var BRAND = '#a16207';

  // =================================================================== CSS
  var CSS = [
    '.sv-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 14px;margin-bottom:16px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);box-shadow:var(--shadow-sm)}',
    '.sv-ic{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#ca8a04,#a16207);flex:none}',
    '.sv-txt{flex:1;min-width:0}',
    '.sv-name{font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}',
    '.sv-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:3px}',
    '.sv-stage{position:relative;background:#05060a;border-radius:var(--radius-sm);overflow:hidden;display:grid;place-items:center;min-height:180px}',
    '.sv-stage>video,.sv-stage>img,.sv-stage>canvas{display:block;max-width:100%;max-height:min(60vh,520px);width:auto;height:auto}',
    '.sv-nopreview{color:#c9cede;padding:24px;text-align:center;font-size:.9rem;max-width:420px}',
    '.sv-frame{position:relative;margin:0 auto;max-width:100%;width:calc(min(60vh,520px) * var(--ar,1.7778));aspect-ratio:var(--ar,1.7778)}',
    '.sv-frame>video,.sv-frame>canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block}',
    '.sv-crop{position:absolute;top:0;height:100%;border:2px solid #fff;box-shadow:0 0 0 9999px rgba(5,6,10,.55);border-radius:4px;cursor:grab;touch-action:none;z-index:2}',
    '.sv-crop:focus-visible{outline:3px solid #facc15;outline-offset:1px}',
    '.sv-crop.sv-dragging{cursor:grabbing}',
    '.sv-crop.sv-static{cursor:default;pointer-events:none}',
    '.sv-crop::after{content:"";position:absolute;left:50%;top:50%;width:18px;height:18px;margin:-9px 0 0 -9px;border:2px solid rgba(255,255,255,.8);border-radius:50%}',
    '.sv-crop.sv-v{left:0;width:100%!important;cursor:ns-resize}',
    '.sv-capprev{position:absolute;left:5%;right:5%;bottom:8%;text-align:center;pointer-events:none;z-index:3}',
    '.sv-capprev span{display:inline;background:rgba(0,0,0,.6);color:#fff;font-weight:700;padding:2px 8px;border-radius:6px;font-size:clamp(.8rem,2.4vw,1.2rem);line-height:1.6;box-decoration-break:clone;-webkit-box-decoration-break:clone;white-space:pre-wrap}',
    '.sv-panel h3{font-size:1rem;margin:0 0 12px}',
    '.sv-panel .field:last-child{margin-bottom:0}',
    '.sv-sec{padding-top:14px;margin-top:14px;border-top:1px solid var(--border)}',
    '.sv-sec>h4{font-size:.92rem;margin:0 0 10px}',
    '.sv-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}',
    '.sv-actions .btn-primary{flex:1 1 200px}',
    '.sv-seg{display:flex;width:100%}.sv-seg button{flex:1 1 auto;padding:7px 8px}',
    '.sv-range{display:flex;align-items:center;gap:10px}.sv-range input{flex:1;min-width:0}',
    '.sv-val{min-width:58px;text-align:right;font-variant-numeric:tabular-nums;font-weight:600;font-size:.88rem;color:var(--text-2)}',
    '.sv-out{margin-top:16px}.sv-out>*+*{margin-top:16px}',
    '.sv-prog .sv-prow{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-weight:650;min-width:0}',
    '.sv-prog .sv-ptitle{min-width:0;overflow-wrap:anywhere}',
    '.sv-prog .sv-pct{margin-left:auto;font-variant-numeric:tabular-nums;color:var(--text-2)}',
    '.sv-prog .muted{margin-top:8px}',
    '.sv-prog .sv-actions{margin-top:10px}',
    '.progress.sv-ind>span{width:35%!important;animation:sv-ind 1.2s ease-in-out infinite}',
    '@keyframes sv-ind{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}',
    '@media (prefers-reduced-motion:reduce){.progress.sv-ind>span{animation:none;width:100%!important;opacity:.5}}',
    '.sv-loading{display:flex;align-items:center;gap:10px;color:var(--text-3);padding:40px 0}',
    '.sv-privacy{margin-top:14px}',
    '.sv-start{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}',
    // dual range
    '.sv-dr{position:relative;height:60px;margin:12px 0 4px;user-select:none;-webkit-user-select:none}',
    '.sv-strip{position:absolute;left:8px;right:8px;top:6px;bottom:6px;display:flex;border-radius:8px;overflow:hidden;background:var(--surface-2);border:1px solid var(--border)}',
    '.sv-strip canvas{flex:1 1 0;min-width:0;width:100%;height:100%;object-fit:cover;display:block}',
    '.sv-shade{position:absolute;top:6px;bottom:6px;background:rgba(8,10,20,.6);pointer-events:none}',
    '.sv-shade.l{left:8px;border-radius:8px 0 0 8px}.sv-shade.r{right:8px;border-radius:0 8px 8px 0}',
    '.sv-selbox{position:absolute;top:3px;bottom:3px;border-top:3px solid var(--brand);border-bottom:3px solid var(--brand);pointer-events:none}',
    '.sv-ph{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.55);pointer-events:none;z-index:4}',
    '.sv-mark{position:absolute;top:2px;height:5px;background:#facc15;border-radius:3px;pointer-events:none;opacity:.9}',
    '.sv-dr input[type=range]{position:absolute;left:0;top:0;width:100%;height:100%;margin:0;padding:0;background:transparent;pointer-events:none;-webkit-appearance:none;appearance:none;accent-color:auto}',
    '.sv-dr input[type=range]:focus{outline:none;box-shadow:none}',
    '.sv-dr input[type=range]::-webkit-slider-runnable-track{height:100%;background:transparent;border:0}',
    '.sv-dr input[type=range]::-moz-range-track{height:100%;background:transparent;border:0}',
    '.sv-dr input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;pointer-events:auto;width:16px;height:60px;border-radius:6px;background:var(--brand);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);cursor:ew-resize}',
    '.sv-dr input[type=range]::-moz-range-thumb{pointer-events:auto;width:12px;height:56px;border-radius:6px;background:var(--brand);border:2px solid #fff;cursor:ew-resize}',
    '.sv-dr input[type=range]:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 4px rgba(79,70,229,.5)}',
    '.sv-dr input[type=range]:focus-visible::-moz-range-thumb{box-shadow:0 0 0 4px rgba(79,70,229,.5)}',
    '.sv-times{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-items:end;margin-top:10px}',
    '.sv-times .field{margin:0}',
    '.sv-times input,.sv-tin{font-variant-numeric:tabular-nums}',
    '.sv-tbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}',
    '.sv-tbar .sv-now{margin-left:auto;font:600 .85rem var(--mono);color:var(--text-3)}',
    // option cards
    '.sv-opts{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:8px}',
    '.sv-opt{border:2px solid var(--border);background:var(--surface);border-radius:12px;padding:9px 11px;text-align:left;cursor:pointer;font:inherit;color:var(--text);min-width:0}',
    '.sv-opt b{display:block;font-size:.92rem}',
    '.sv-opt small{display:block;color:var(--text-3);font-size:.75rem;margin-top:2px;line-height:1.35}',
    '.sv-opt[aria-pressed=true]{border-color:var(--brand);background:var(--brand-soft)}',
    '.sv-opt:focus-visible{outline:none;box-shadow:var(--ring)}',
    // lists
    '.sv-list{display:flex;flex-direction:column;gap:8px}',
    '.sv-item{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 10px;background:var(--surface);min-width:0}',
    '.sv-item.sv-sel{border-color:var(--brand);box-shadow:0 0 0 1px var(--brand)}',
    '.sv-item .sv-grow{flex:1 1 160px;min-width:0}',
    '.sv-item .sv-t{font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.sv-item .sv-btns{display:flex;gap:6px;flex-wrap:wrap}',
    '.sv-item.sv-drag{opacity:.5}',
    '.sv-item.sv-over{border-color:var(--brand);border-style:dashed}',
    '.sv-grip{cursor:grab;color:var(--text-3);display:grid;place-items:center}',
    '.sv-iconbtn{padding:6px 8px}',
    '.sv-up .icon{transform:rotate(180deg)}',
    '.sv-empty{padding:18px;text-align:center;color:var(--text-3);font-size:.9rem;border:1px dashed var(--border-strong);border-radius:var(--radius-sm)}',
    // results
    '.sv-result .sv-stage,.sv-result .preview-box{margin-top:14px}',
    '.sv-result .notice{margin-top:14px}',
    '.sv-result .card-title h3{display:flex;align-items:center;gap:8px}',
    '.sv-result .sv-stage video{max-height:min(55vh,460px)}',
    '.sv-results{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}',
    '.sv-rc{border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px;background:var(--surface-2);min-width:0}',
    '.sv-rc video{width:100%;max-height:360px;background:#05060a;border-radius:8px;display:block}',
    '.sv-rc .sv-rn{font-weight:650;margin:8px 0 2px;overflow-wrap:anywhere}',
    '.sv-rc .btn{width:100%;margin-top:8px;justify-content:center}',
    // subtitles editor
    '.sv-subs{display:flex;flex-direction:column;gap:8px;max-height:560px;overflow:auto;padding:2px}',
    '.sv-sub{display:grid;grid-template-columns:34px minmax(0,1fr);gap:8px;border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px;background:var(--surface)}',
    '.sv-sub.sv-cur{border-color:var(--brand);box-shadow:0 0 0 1px var(--brand)}',
    '.sv-sub .sv-no{font:700 .85rem var(--mono);color:var(--text-3);padding-top:8px;text-align:center}',
    '.sv-sub .sv-tm{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:6px}',
    '.sv-sub .sv-tm input{width:112px;flex:0 1 112px;min-width:0;padding:6px 8px;font:500 .85rem var(--mono)}',
    '.sv-sub textarea{width:100%;min-height:44px;resize:vertical}',
    '.sv-sub .sv-btns{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}',
    '.sv-sub .sv-err{color:var(--danger);font-size:.8rem;margin-top:4px}',
    '.sv-tap{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px;border:1px dashed var(--brand);border-radius:var(--radius-sm);background:var(--brand-soft);margin-top:10px}',
    '.sv-tap .sv-tapline{flex:1 1 200px;min-width:0;font-weight:600;overflow-wrap:anywhere}',
    '.sv-hold{touch-action:none;user-select:none;-webkit-user-select:none}',
    '.sv-hold.sv-on{background:var(--danger);color:#fff;border-color:var(--danger)}',
    // chapters
    '.sv-chap{display:grid;grid-template-columns:110px minmax(0,1fr) auto;gap:8px;align-items:center}',
    '.sv-chap input{min-width:0}',
    '.sv-chap.sv-bad input{border-color:var(--danger)}',
    '.sv-out-text{white-space:pre-wrap;font-family:var(--mono);font-size:.9rem;min-height:120px;width:100%}',
    '.sv-errs{margin:8px 0 0;padding-left:20px;color:var(--danger);font-size:.88rem}',
    '.sv-errs li+li{margin-top:4px}',
    // checker
    '.sv-pass{color:var(--ok);font-weight:700;white-space:nowrap}.sv-warn{color:var(--warn);font-weight:700;white-space:nowrap}.sv-info{color:var(--text-3);font-weight:700;white-space:nowrap}',
    '.sv-ctable td{white-space:normal;vertical-align:top}',
    '.sv-ctable td:first-child{white-space:nowrap}',
    '.sv-plat{margin-top:18px}.sv-plat h4{display:flex;align-items:center;gap:8px;margin:0 0 8px;font-size:1rem}',
    // thumbnails & frames
    '.sv-canvaswrap{position:relative;background:repeating-conic-gradient(var(--surface-2) 0% 25%, var(--surface) 0% 50%) 50% / 20px 20px;border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden}',
    '.sv-canvaswrap canvas{display:block;width:100%;height:auto;touch-action:none;cursor:move}',
    '.sv-layers{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}',
    '.sv-layer{display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid var(--border);border-radius:9px;background:var(--surface);cursor:pointer;min-width:0;font:inherit;color:var(--text);text-align:left;width:100%}',
    '.sv-layer.sv-sel{border-color:var(--brand);background:var(--brand-soft)}',
    '.sv-layer .sv-ln{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.88rem}',
    '.sv-tpls{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px}',
    '.sv-tpl{border:2px solid var(--border);border-radius:10px;padding:0;overflow:hidden;cursor:pointer;background:var(--surface);font:inherit;color:var(--text)}',
    '.sv-tpl canvas{display:block;width:100%;height:auto}',
    '.sv-tpl span{display:block;font-size:.75rem;font-weight:600;padding:4px 6px}',
    '.sv-tpl:focus-visible{outline:none;box-shadow:var(--ring)}',
    '.sv-stickers{display:grid;grid-template-columns:repeat(auto-fill,minmax(40px,1fr));gap:6px}',
    '.sv-stickers button{padding:7px;border:1px solid var(--border);border-radius:8px;background:var(--surface);cursor:pointer;color:var(--text);display:grid;place-items:center}',
    '.sv-stickers button:focus-visible{outline:none;box-shadow:var(--ring)}',
    '.sv-shots{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}',
    '.sv-shot{border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;background:var(--surface-2);min-width:0}',
    '.sv-shot img{display:block;width:100%;height:auto;background:#05060a}',
    '.sv-shot div{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:6px 8px;font:600 .8rem var(--mono)}',
    '.sv-colors{display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
    '.sv-colors input[type=color]{width:44px;height:34px;padding:2px}',
    '.sv-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
    '.sv-2 .field{margin-bottom:10px}',
    '.sv-kbd{font:600 .78rem var(--mono);padding:1px 6px;border:1px solid var(--border-strong);border-radius:5px;background:var(--surface-2)}',
    '@media (max-width:520px){.sv-times{grid-template-columns:repeat(2,minmax(0,1fr))}.sv-times .field:last-child{grid-column:1/-1}.sv-chap{grid-template-columns:88px minmax(0,1fr) auto}.sv-2{grid-template-columns:1fr}}'
  ].join('\n');

  function injectCSS() {
    if (doc.getElementById('sv-style')) return;
    var s = doc.createElement('style');
    s.id = 'sv-style';
    s.textContent = CSS;
    doc.head.appendChild(s);
  }

  // ============================================================ UI helpers
  var uid = 0;
  function nid(p) { uid++; return 'sv-' + (p || 'f') + uid; }
  function field(label, control, hint) {
    var id = control.id || (control.id = nid());
    var hid = hint ? id + '-h' : null;
    if (hid) control.setAttribute('aria-describedby', hid);
    return h('div.field', null, [h('label', { 'for': id, text: label }), control, hint ? h('span.hint', { id: hid, text: hint }) : null]);
  }
  function input(type, value, attrs) {
    var el = h('input', Object.assign({ type: type, id: nid() }, attrs || {}));
    el.value = value;
    return el;
  }
  function select(options, value) {
    var el = h('select', { id: nid() });
    options.forEach(function (o) { el.appendChild(h('option', { value: o[0], text: o[1] })); });
    el.value = value;
    return el;
  }
  function range(label, min, max, step, value, fmt, onInput) {
    var el = input('range', value, { min: min, max: max, step: step });
    var out = h('span.sv-val', { 'aria-hidden': 'true' });
    var f = fmt || function (v) { return v; };
    function upd() { out.textContent = f(Number(el.value)); el.setAttribute('aria-valuetext', f(Number(el.value))); }
    el.addEventListener('input', function () { upd(); if (onInput) onInput(Number(el.value)); });
    upd();
    var wrap = h('div.field', null, [h('label', { 'for': el.id, text: label }), h('div.sv-range', null, [el, out])]);
    wrap.input = el;
    wrap.refresh = upd;
    wrap.setValue = function (v) { el.value = v; upd(); };
    return wrap;
  }
  function checkbox(label, checked, onChange) {
    var el = h('input', { type: 'checkbox', id: nid() });
    el.checked = !!checked;
    if (onChange) el.addEventListener('change', function () { onChange(el.checked); });
    var lab = h('label.check', { 'for': el.id }, [el, h('span', { text: label })]);
    lab.input = el;
    return lab;
  }
  function seg(items, value, onChange, label) {
    var el = h('div.seg.sv-seg', { role: 'group', 'aria-label': label || 'Options' });
    el.value = value;
    items.forEach(function (it) {
      var b = h('button', { type: 'button', text: it[1], 'data-v': String(it[0]), 'aria-pressed': String(it[0] === value) });
      if (it[0] === value) b.classList.add('active');
      b.addEventListener('click', function () { el.set(it[0]); if (onChange) onChange(it[0]); });
      el.appendChild(b);
    });
    el.set = function (v) {
      el.value = v;
      BT.$$('button', el).forEach(function (b) {
        var on = b.getAttribute('data-v') === String(v);
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    };
    return el;
  }
  function labeled(label, control) { return h('div.field', null, [h('span.label', { text: label }), control]); }
  function optCards(items, value, onChange, label) {
    var el = h('div.sv-opts', { role: 'group', 'aria-label': label || 'Options' });
    el.value = value;
    items.forEach(function (it) {
      var b = h('button.sv-opt', { type: 'button', 'data-v': it.v, 'aria-pressed': String(it.v === value),
        html: '<b>' + esc(it.t) + '</b>' + (it.s ? '<small>' + esc(it.s) + '</small>' : '') });
      b.addEventListener('click', function () { el.set(it.v); if (onChange) onChange(it.v); });
      el.appendChild(b);
    });
    el.set = function (v) {
      el.value = v;
      BT.$$('button', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); });
    };
    return el;
  }
  function btn(cls, iconName, text, onClick, attrs) {
    var b = h('button.btn' + (cls ? '.' + cls.split(' ').join('.') : ''), Object.assign({ type: 'button', html: (iconName ? BT.icon(iconName) : '') + '<span>' + esc(text) + '</span>' }, attrs || {}));
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }
  function iconBtn(iconName, label, onClick, cls) {
    var b = h('button.btn.btn-sm.sv-iconbtn' + (cls ? '.' + cls : ''), { type: 'button', 'aria-label': label, title: label, html: BT.icon(iconName) });
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }
  function setBtnText(b, iconName, text) { b.innerHTML = (iconName ? BT.icon(iconName) : '') + '<span>' + esc(text) + '</span>'; }
  function stat(label, value) {
    return h('div.stat', null, [h('div.label', { text: label }), h('div.value', { text: value == null ? '—' : String(value) })]);
  }
  /** Notice box. `html` must already be escaped. */
  function notice(kind, html, iconName) {
    return h('div.notice' + (kind ? '.' + kind : ''), { html: BT.icon(iconName || (kind === 'ok' ? 'check' : 'info')) + '<span>' + html + '</span>' });
  }
  function privacyNote(extra) {
    return h('div.notice.sv-privacy', { html: BT.icon('shield-check') + '<span><strong>Processed on your device — nothing is uploaded.</strong> ' +
      esc(extra == null ? 'The video engine (about 32 MB) downloads once from this site the first time you process a video, and is then cached by your browser. Video processing is slower on phones.' : extra) + '</span>' });
  }
  function scrollTo(el) { try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* old browsers */ } }
  function toolLink(id, text) { return '<a href="' + esc(BT.toolUrl(id)) + '">' + esc(text) + '</a>'; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // ------------------------------------------------------------- Formats
  function pad(n, w) { n = String(n); while (n.length < (w || 2)) n = '0' + n; return n; }
  /** 83.45 → "1:23.4" (h:mm:ss.s for an hour or more). */
  function fmtTime(s, dp) {
    if (!isFinite(s) || s < 0) s = 0;
    dp = dp == null ? 1 : dp;
    var m = Math.pow(10, dp);
    s = Math.round(s * m) / m;
    var hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s - hh * 3600 - mm * 60;
    var sec = ss.toFixed(dp);
    if (ss < 10) sec = '0' + sec;
    return (hh ? hh + ':' + pad(mm) : String(mm)) + ':' + sec;
  }
  /** "1:23.4", "83.4", "1:02:03", "00:01:02,500" → seconds (NaN when invalid). */
  function parseTime(str) {
    str = String(str || '').trim().replace(',', '.');
    if (!/^\d+(:\d+){0,2}(\.\d*)?$|^\d*\.\d+$/.test(str)) return NaN;
    return str.split(':').reduce(function (a, p) { return a * 60 + parseFloat(p || '0'); }, 0);
  }
  function fmtDur(s) {
    if (!isFinite(s)) return '—';
    if (s < 60) return (Math.round(s * 10) / 10) + ' s';
    return fmtTime(s, 0);
  }
  function extOf(name) { var m = String(name || '').toLowerCase().match(/\.([a-z0-9]{1,5})$/); return m ? m[1] : ''; }
  function even(x) { return Math.max(2, Math.round(x / 2) * 2); }
  function hexToFF(hex) { return '0x' + String(hex || '#000000').replace('#', '').slice(0, 6); }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function ratioLabel(w, h2) {
    if (!w || !h2) return '—';
    var r = w / h2, known = [[16, 9], [9, 16], [1, 1], [4, 5], [5, 4], [4, 3], [3, 4], [21, 9], [2, 3], [3, 2]];
    for (var i = 0; i < known.length; i++) if (Math.abs(r - known[i][0] / known[i][1]) < 0.02) return known[i][0] + ':' + known[i][1];
    var g = gcd(w, h2);
    return (w / g > 50 ? r.toFixed(2) + ':1' : (w / g) + ':' + (h2 / g));
  }

  var VIDEO_ACCEPT = 'video/*,.mp4,.mov,.m4v,.webm,.mkv,.avi,.3gp,.wmv,.flv,.ts,.mts,.mpg,.mpeg,.ogv';
  var AUDIO_ACCEPT = 'audio/*,.mp3,.wav,.m4a,.aac,.ogg,.oga,.opus,.flac,.weba';
  var IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.png,.jpg,.jpeg,.webp,.gif,.svg';
  var SUB_ACCEPT = '.srt,.vtt,.txt,text/plain,text/vtt';
  var VIDEO_EXT = /^(mp4|mov|m4v|webm|mkv|avi|3gp|wmv|flv|ts|mts|m2ts|mpg|mpeg|ogv)$/;
  function looksVideo(file) { return /^video\//.test(file.type || '') || VIDEO_EXT.test(extOf(file.name)); }

  // ======================================================= Media metadata
  /** Read duration/size with a media element. Resolves null when unreadable. */
  function probeElement(blob, tag) {
    return new Promise(function (res) {
      var el = doc.createElement(tag || 'video');
      el.preload = 'metadata';
      el.muted = true;
      el.playsInline = true;
      var url = URL.createObjectURL(blob), done = false;
      var tm = setTimeout(function () { finish(null); }, 12000);
      function finish(r) {
        if (done) return;
        done = true;
        clearTimeout(tm);
        el.removeAttribute('src');
        try { el.load(); } catch (e) { /* ignore */ }
        URL.revokeObjectURL(url);
        res(r);
      }
      function info() {
        return { duration: el.duration, width: el.videoWidth || 0, height: el.videoHeight || 0, hasVideo: (el.videoWidth || 0) > 0, hasAudio: null };
      }
      el.onloadedmetadata = function () {
        if (isFinite(el.duration) && el.duration > 0) {
          if (tag === 'audio' || el.videoWidth) return finish(info());
          // Metadata without a decodable video track: give the decoder a moment.
          el.onloadeddata = function () { finish(info()); };
          setTimeout(function () { finish(info()); }, 1500);
          return;
        }
        el.ondurationchange = el.ontimeupdate = function () {
          if (isFinite(el.duration) && el.duration > 0) finish(info());
        };
        try { el.currentTime = 1e101; } catch (e) { finish(null); }
      };
      el.onerror = function () { finish(null); };
      el.src = url;
    });
  }

  /** Parse the stream summary that `ffmpeg -i` prints. */
  function parseProbe(txt) {
    var r = { duration: null, width: 0, height: 0, hasVideo: false, hasAudio: false, vcodec: '', acodec: '', fps: 0, bitrate: 0, vbitrate: 0, abitrate: 0,
      container: '', pixfmt: '', vprofile: '', arate: 0, achannels: '', viaEngine: true, rotation: 0 };
    var cut = txt.indexOf('Output #0');
    if (cut > -1) txt = txt.slice(0, cut);
    var d = txt.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (d) r.duration = +d[1] * 3600 + +d[2] * 60 + parseFloat(d[3]);
    var br = txt.match(/bitrate:\s*(\d+)\s*kb\/s/);
    if (br) r.bitrate = +br[1];
    var c = txt.match(/Input #0, (.+?), from/);
    if (c) r.container = c[1];
    txt.split('\n').forEach(function (l) {
      var v = l.match(/Stream #\d+:\d+.*?: Video: (\w+)(?: \(([^)]*)\))?/);
      if (v && !r.hasVideo && !/attached pic/.test(l)) {
        r.hasVideo = true;
        r.vcodec = v[1];
        r.vprofile = v[2] && !/0x|\//.test(v[2]) ? v[2] : '';
        var s = l.match(/[ ,](\d{2,5})x(\d{2,5})[ ,\]]/);
        if (s) { r.width = +s[1]; r.height = +s[2]; }
        var f = l.match(/(\d+(?:\.\d+)?) fps/) || l.match(/(\d+(?:\.\d+)?)k? tbr/);
        if (f) r.fps = parseFloat(f[1]);
        var pf = l.match(/, (yuv\w+|yuvj\w+|rgb\w*|bgr\w*|nv12|gray\w*)[(,\s]/);
        if (pf) r.pixfmt = pf[1];
        var vb = l.match(/(\d+) kb\/s/);
        if (vb) r.vbitrate = +vb[1];
      }
      var a = l.match(/Stream #\d+:\d+.*?: Audio: (\w+)/);
      if (a && !r.hasAudio) {
        r.hasAudio = true; r.acodec = a[1];
        var ar = l.match(/(\d+) Hz/); if (ar) r.arate = +ar[1];
        var ch = l.match(/Hz, ([^,]+),/); if (ch) r.achannels = ch[1];
        var ab = l.match(/(\d+) kb\/s/); if (ab) r.abitrate = +ab[1];
      }
    });
    var rot = txt.match(/rotation of (-?\d+(?:\.\d+)?) degrees/) || txt.match(/rotate\s*:\s*(-?\d+)/);
    if (rot) r.rotation = Math.round(+rot[1]);
    if (rot && Math.abs(Math.round(+rot[1])) % 180 === 90) { var t = r.width; r.width = r.height; r.height = t; }
    return r;
  }

  function mediaEl(tag, url, label) {
    var el = h(tag, { controls: true, preload: 'metadata', playsinline: true, 'aria-label': label || (tag === 'video' ? 'Video preview' : 'Audio preview') });
    el.src = url;
    return el;
  }

  // ================================================================ Engine
  var CANCELLED = { cancelled: true, message: 'Cancelled' };
  function isCancel(e) { return !!(e && e.cancelled); }
  var encoders = null;
  var engineLoaded = false, running = null, jobSeq = 0;

  function loadEngine(ui) {
    if (ui && !engineLoaded) ui.stage('Preparing the video engine…', 'Processed on your device — nothing is uploaded.', null);
    return BT.loadFFmpeg(function (f) {
      if (ui) ui.stage('Downloading video engine (32 MB, one time)…', 'Your browser keeps it, so next time starts instantly.', f);
    }).then(function (ff) {
      if (ui && !engineLoaded) ui.stage('Starting the video engine…', '', null);
      engineLoaded = true;
      if (encoders) return ff;
      var lines = [];
      var cb = function (m) { lines.push(m && m.message || ''); };
      ff.on('log', cb);
      return ff.exec(['-hide_banner', '-encoders']).then(function () {
        ff.off('log', cb);
        var list = [];
        lines.join('\n').split('\n').forEach(function (l) {
          var m = l.match(/^\s*[VAS][A-Z.]{5}\s+(\S+)/);
          if (m && m[1] !== '=') list.push(m[1]);
        });
        if (list.length) encoders = list;
        return ff;
      }, function () { ff.off('log', cb); return ff; });
    });
  }
  function needH264() {
    if (encoders && encoders.indexOf('libx264') < 0) throw new Error('This browser’s video engine has no H.264 encoder, so MP4 output is not possible here.');
  }

  function ffError(logs, what) {
    var txt = logs.join('\n');
    if (/matches no streams|does not contain any stream|Output file .*does not contain/i.test(txt)) {
      return new Error(what === 'audio' ? 'This file has no audio track.' : 'This file does not have the video or audio track this output needs.');
    }
    if (/Invalid data found|could not find codec parameters|moov atom not found|EBML header parsing failed|Error opening input/i.test(txt)) {
      return new Error('A file could not be read. It may be damaged, incomplete or in an unsupported format.');
    }
    if (/Cannot allocate memory|out of memory/i.test(txt)) {
      return new Error('Your browser ran out of memory. Try a shorter clip or a lower resolution.');
    }
    var bad = logs.filter(function (l) { return /error|invalid|failed|not supported|unknown|no such/i.test(l); }).slice(-1)[0];
    return new Error('Processing failed' + (bad ? ': ' + bad.trim().slice(0, 180) : '.'));
  }

  /**
   * Run one ffmpeg job. fn(J) gets helpers:
   *   J.input(blob, ext) → path   (mounted read-only via WORKERFS — no copy — when possible)
   *   J.write(ext, data) → path   (small generated files: PNG overlays, lists)
   *   J.out(ext) → unique output name
   *   J.exec(args, {dur, from, to, label, sub}) → exit code (progress mapped to from..to)
   *   J.run(args, opts) → like exec but throws a friendly error on failure
   *   J.read(name) → Uint8Array, J.del(name), J.probe(path) → stream info
   *   J.stage(label, sub, fraction) → update the progress card
   * Temporary files are deleted afterwards. Cancel terminates the engine.
   */
  function job(S, ui, fn) {
    if (running) return Promise.reject(new Error('Another video job is still running on this page. Please wait for it or cancel it.'));
    var J = { id: ++jobSeq, cancelled: false, finished: false, files: [], dirs: [], logs: [], n: 0, onTime: null };
    running = J;
    J.cancel = function () {
      if (J.cancelled || J.finished) return;
      J.cancelled = true;
      engineLoaded = false;
      BT.resetFFmpeg();
    };
    if (S) S.job = J;
    if (ui) ui.onCancel(J.cancel);
    var ff = null, offs = [];
    var pfx = 'sv' + J.id + '_' + Date.now().toString(36);
    function tag(ext) { J.n++; return pfx + '_' + J.n + (ext ? '.' + ext : ''); }
    function guard(v) { if (J.cancelled) throw CANCELLED; return v; }
    var api = {
      logs: J.logs,
      isCancelled: function () { return J.cancelled; },
      guard: guard,
      stage: function (t, s, f) { if (ui) ui.stage(t, s, f); },
      set: function (f) { if (ui) ui.set(f); },
      input: function (blob, ext) {
        var dir = { path: '/' + tag(), mounted: false }, name = 'input.' + (ext || 'bin');
        return ff.createDir(dir.path).then(function () {
          J.dirs.push(dir);
          return ff.mount('WORKERFS', { blobs: [{ name: name, data: blob }] }, dir.path);
        }).then(function () { dir.mounted = true; return dir.path + '/' + name; }, function () {
          guard();
          var f = tag(ext || 'bin');
          return blob.arrayBuffer().then(function (buf) { return ff.writeFile(f, new Uint8Array(buf)); }).then(function () { J.files.push(f); return f; });
        }).then(guard);
      },
      write: function (ext, data) {
        var f = tag(ext);
        J.files.push(f);
        var p = data instanceof Blob ? data.arrayBuffer().then(function (b) { return new Uint8Array(b); }) : Promise.resolve(data);
        return p.then(function (d) { return ff.writeFile(f, d); }).then(function () { return guard(f); });
      },
      out: function (ext) { var f = tag(ext); J.files.push(f); return f; },
      exec: function (args, o) {
        o = o || {};
        var dur = o.dur, a = o.from || 0, b = o.to == null ? 1 : o.to;
        if (ui && o.label) ui.stage(o.label, o.sub || '', dur ? a : null);
        J.onTime = function (t) { if (ui && dur > 0) ui.set(a + (b - a) * Math.min(1, Math.max(0, t / dur))); };
        J.logs.length = 0;
        return ff.exec(['-hide_banner', '-nostdin'].concat(args)).then(function (code) {
          guard();
          J.onTime = null;
          if (ui && dur) ui.set(b);
          return code;
        }, function (e) {
          if (J.cancelled) throw CANCELLED;
          console.error(e);
          // The wasm instance is unusable after a crash; start fresh next time.
          engineLoaded = false;
          J.cancelled = true;
          BT.resetFFmpeg();
          var err = new Error('The video engine stopped unexpectedly, usually because the browser ran out of memory. Try a shorter clip or a lower resolution.');
          err.crash = true;
          throw err;
        });
      },
      run: function (args, o) {
        return api.exec(args, o).then(function (code) {
          if (code !== 0) throw ffError(J.logs, o && o.what);
          return code;
        });
      },
      read: function (f) { return ff.readFile(f).then(guard); },
      del: function (f) { var i = J.files.indexOf(f); if (i > -1) J.files.splice(i, 1); return ff.deleteFile(f).catch(noop); },
      probe: function (path) { return api.exec(['-i', path]).then(function () { return parseProbe(J.logs.join('\n')); }); }
    };
    function cleanup() {
      J.finished = true;
      offs.forEach(function (f) { f(); });
      if (running === J) running = null;
      if (S && S.job === J) S.job = null;
      if (!ff || J.cancelled) return Promise.resolve();
      return Promise.all(J.files.map(function (f) { return ff.deleteFile(f).catch(noop); })).then(function () {
        return Promise.all(J.dirs.map(function (d) {
          return (d.mounted ? ff.unmount(d.path).catch(noop) : Promise.resolve()).then(function () { return ff.deleteDir(d.path).catch(noop); });
        }));
      }).catch(noop);
    }
    var p = loadEngine(ui).then(function (inst) {
      guard();
      ff = inst;
      var onLog = function (m) {
        var msg = (m && m.message) || '';
        J.logs.push(msg);
        if (J.logs.length > 4000) J.logs.splice(0, 2000);
        var t = msg.match(/time=\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
        if (t && J.onTime) J.onTime(+t[1] * 3600 + +t[2] * 60 + parseFloat(t[3]));
      };
      ff.on('log', onLog);
      offs.push(function () { ff.off('log', onLog); });
      return fn(api);
    });
    return p.then(function (r) { return cleanup().then(function () { return r; }); }, function (e) {
      var c = J.cancelled && !(e && e.crash);
      if (!c && !(e && e.crash) && ff && !J.cancelled) {
        // Unknown failure: the engine itself is fine, files are cleaned below.
      }
      return cleanup().then(function () { throw c ? CANCELLED : e; });
    });
  }

  /** Standard MP4 (H.264 + AAC, faststart) output arguments. */
  function h264Args(speed, crf) {
    return ['-c:v', 'libx264', '-preset', speed || 'veryfast', '-crf', String(crf || 23), '-pix_fmt', 'yuv420p'];
  }
  var AAC = ['-c:a', 'aac', '-b:a', '160k'];
  var FASTSTART = ['-movflags', '+faststart'];

  // ============================================================= UI cards
  function progressCard() {
    var title = h('span.sv-ptitle', { text: 'Working…', 'aria-live': 'polite' });
    var pct = h('span.sv-pct');
    var bar = h('span');
    var prog = h('div.progress.sv-ind', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': 'Progress' }, [bar]);
    var sub = h('div.muted.small');
    var cancel = btn('btn-sm', 'x', 'Cancel');
    cancel.classList.add('hidden');
    var el = h('div.card.sv-prog', null, [h('div.sv-prow', null, [h('span.spinner'), title, pct]), prog, sub, h('div.sv-actions', null, [cancel])]);
    var cancelFn = null;
    cancel.addEventListener('click', function () {
      if (!cancelFn) return;
      cancel.disabled = true;
      title.textContent = 'Cancelling…';
      cancelFn();
    });
    var api = {
      el: el,
      stage: function (t, s, f) { title.textContent = t; sub.textContent = s || ''; api.set(f); },
      set: function (f) {
        if (f == null) { prog.classList.add('sv-ind'); pct.textContent = ''; prog.removeAttribute('aria-valuenow'); bar.style.width = ''; return; }
        prog.classList.remove('sv-ind');
        var p = Math.max(0, Math.min(100, Math.round(f * 100)));
        bar.style.width = p + '%';
        pct.textContent = p + '%';
        prog.setAttribute('aria-valuenow', String(p));
      },
      onCancel: function (fn) { cancelFn = fn; cancel.classList.remove('hidden'); cancel.disabled = false; },
      remove: function () { el.remove(); }
    };
    return api;
  }

  function resultCard(o) {
    var url = o.S.url(o.blob), prev = null;
    if (o.kind === 'video') prev = h('div.sv-stage', null, [mediaEl('video', url, 'Result preview')]);
    else if (o.kind === 'image') prev = h('div.preview-box', null, [h('img', { src: url, alt: 'Preview of ' + o.name })]);
    var ext = (extOf(o.name) || 'file').toUpperCase();
    var actions = h('div.sv-actions', null, [btn('btn-primary btn-lg', 'download', 'Download ' + ext, function () { BT.download(o.blob, o.name); })]
      .concat(o.extra || [])
      .concat(o.onReset ? [btn('btn-lg', 'rotate-ccw', o.resetLabel || 'Start over', o.onReset)] : []));
    return h('div.card.sv-result', null, [
      h('div.card-title', null, [h('h3', { html: BT.icon('check') + '<span>' + esc(o.title || 'Done') + '</span>' })]),
      o.stats ? h('div.stats', null, o.stats.map(function (s) { return stat(s[0], s[1]); })) : null,
      o.note ? notice(o.note.kind, o.note.html) : null,
      prev,
      o.after || null,
      actions
    ]);
  }

  function fileHead(file, meta, onReset) {
    var b = '<span class="badge">' + esc((extOf(file.name) || 'file').toUpperCase()) + '</span>';
    if (meta.duration) b += '<span class="badge">' + esc(fmtDur(meta.duration)) + '</span>';
    if (meta.width) b += '<span class="badge">' + meta.width + ' × ' + meta.height + '</span>';
    b += '<span class="badge">' + esc(BT.fmtBytes(file.size)) + '</span>';
    if (meta.hasVideo === false) b += '<span class="badge">Audio only</span>';
    return h('div.sv-head', null, [
      h('span.sv-ic', { html: BT.icon('film') }),
      h('div.sv-txt', null, [h('div.sv-name', { text: file.name, title: file.name }), h('div.sv-meta', { html: b })]),
      onReset ? btn('btn-ghost btn-sm', 'rotate-ccw', 'Start over', onReset) : null
    ]);
  }

  function errorBox(host, e) {
    if (isCancel(e)) { BT.toast('Cancelled'); return; }
    console.error(e);
    var n = notice('error', esc(e && e.message ? e.message : String(e)));
    n.setAttribute('role', 'alert');
    host.appendChild(n);
  }

  /** Dual-handle range over a thumbnail strip. o.maxSpan may change later. */
  function dualRange(o) {
    var D = o.duration, step = o.step || 0.1;
    var strip = h('div.sv-strip', { 'aria-hidden': 'true' });
    var shL = h('div.sv-shade.l'), shR = h('div.sv-shade.r'), box = h('div.sv-selbox'), ph = h('div.sv-ph.hidden');
    var marks = h('div', { 'aria-hidden': 'true' });
    var a = h('input', { type: 'range', min: '0', max: String(D), step: String(step), 'aria-label': o.labelA || 'Start time' });
    var b = h('input', { type: 'range', min: '0', max: String(D), step: String(step), 'aria-label': o.labelB || 'End time' });
    a.value = o.start; b.value = o.end;
    var wrap = h('div.sv-dr', null, [strip, marks, shL, shR, box, ph, a, b]);
    var W = 'calc((100% - 16px) * ';
    function paint() {
      var s = +a.value / D, e = +b.value / D;
      shL.style.width = W + s + ')';
      shR.style.width = W + (1 - e) + ')';
      box.style.left = 'calc(8px + (100% - 16px) * ' + s + ')';
      box.style.width = W + (e - s) + ')';
      a.setAttribute('aria-valuetext', fmtTime(+a.value));
      b.setAttribute('aria-valuetext', fmtTime(+b.value));
      a.style.zIndex = +a.value > D / 2 ? '3' : '2';
      b.style.zIndex = +a.value > D / 2 ? '2' : '3';
    }
    function clampVals(which, s, e, silent) {
      var gap = o.minGap || step;
      if (which === 'a') {
        if (s > e - gap) s = Math.max(0, e - gap);
        if (o.maxSpan && e - s > o.maxSpan) e = Math.min(D, s + o.maxSpan);
        if (e < s + gap) { e = Math.min(D, s + gap); s = Math.max(0, e - gap); }
      } else {
        if (e < s + gap) e = Math.min(D, s + gap);
        if (e < s + gap) s = Math.max(0, e - gap);
        if (o.maxSpan && e - s > o.maxSpan) s = Math.max(0, e - o.maxSpan);
      }
      a.value = s; b.value = e;
      paint();
      if (!silent && o.onChange) o.onChange(+a.value, +b.value, which);
    }
    a.addEventListener('input', function () { clampVals('a', +a.value, +b.value); });
    b.addEventListener('input', function () { clampVals('b', +a.value, +b.value); });
    paint();
    return {
      el: wrap,
      strip: strip,
      o: o,
      get: function () { return [+a.value, +b.value]; },
      set: function (s, e, which, silent) { clampVals(which || 'b', Math.max(0, Math.min(D, s)), Math.max(0, Math.min(D, e)), silent); },
      playhead: function (t) {
        ph.classList.remove('hidden');
        ph.style.left = 'calc(8px + (100% - 16px) * ' + Math.max(0, Math.min(1, t / D)) + ')';
      },
      marks: function (list) {
        marks.innerHTML = '';
        (list || []).forEach(function (m) {
          marks.appendChild(h('div.sv-mark', { style: { left: 'calc(8px + (100% - 16px) * ' + (m[0] / D) + ')', width: 'calc((100% - 16px) * ' + ((m[1] - m[0]) / D) + ')' } }));
        });
      }
    };
  }

  /** Fill a strip with n video frames, captured by seeking a hidden <video>. */
  function fillThumbs(url, D, strip, S, n) {
    n = n || 12;
    var cvs = [];
    for (var k = 0; k < n; k++) { var c = h('canvas'); c.width = 16; c.height = 9; strip.appendChild(c); cvs.push(c); }
    var v = doc.createElement('video');
    v.muted = true; v.preload = 'auto'; v.playsInline = true;
    var i = 0, alive = true;
    function stop() { alive = false; v.onseeked = v.onloadeddata = v.onerror = null; v.removeAttribute('src'); try { v.load(); } catch (e) { /* ignore */ } }
    S.on(stop);
    function next() {
      if (!alive) return;
      if (i >= n) return stop();
      var t = Math.max(0, Math.min(D - 0.05, (i + 0.5) * D / n));
      var to = setTimeout(done, 4000);
      function done() {
        clearTimeout(to);
        v.onseeked = null;
        if (!alive) return;
        var c = cvs[i], vw = v.videoWidth || 16, vh = v.videoHeight || 9;
        c.height = 72; c.width = Math.max(1, Math.round(72 * vw / vh));
        try { c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); } catch (e) { /* ignore */ }
        i++;
        next();
      }
      v.onseeked = done;
      v.currentTime = t;
    }
    v.onloadeddata = function () { v.onloadeddata = null; next(); };
    v.onerror = stop;
    v.src = url;
  }

  function timeFields(dr) {
    var s = input('text', '', { inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false' });
    var e = input('text', '', { inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false' });
    var len = input('text', '', { readonly: true, tabindex: '-1' });
    function commit(which) {
      var v = parseTime((which === 'a' ? s : e).value);
      var cur = dr.get();
      if (!isFinite(v)) { sync(cur[0], cur[1]); BT.toast('Use a time like 1:23.5 or 83.5', 'error'); return; }
      if (which === 'a') dr.set(v, cur[1], 'a'); else dr.set(cur[0], v, 'b');
    }
    function sync(a, b) { s.value = fmtTime(a); e.value = fmtTime(b); len.value = fmtTime(b - a); }
    [[s, 'a'], [e, 'b']].forEach(function (p) {
      p[0].addEventListener('change', function () { commit(p[1]); });
      p[0].addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); commit(p[1]); } });
    });
    var el = h('div.sv-times', null, [field('Start', s), field('End', e), field('Length', len)]);
    var cur = dr.get();
    sync(cur[0], cur[1]);
    return { el: el, sync: sync };
  }

  // ===================================================== Scope / scaffold
  function newScope() {
    var S = { urls: [], fns: [], dead: false, job: null };
    S.url = function (b) { var u = URL.createObjectURL(b); S.urls.push(u); return u; };
    S.on = function (fn) { S.fns.push(fn); };
    S.listen = function (target, ev, fn, opt) { target.addEventListener(ev, fn, opt); S.on(function () { target.removeEventListener(ev, fn, opt); }); };
    S.dispose = function () {
      S.dead = true;
      if (S.job) S.job.cancel();
      S.fns.forEach(function (f) { try { f(); } catch (e) { console.error(e); } });
      S.fns = [];
      S.urls.forEach(function (u) { URL.revokeObjectURL(u); });
      S.urls = [];
    };
    return S;
  }

  function sizeWarning(file, meta) {
    var msgs = [];
    if (file.size > 500 * 1024 * 1024) msgs.push('This is a large file (' + esc(BT.fmtBytes(file.size)) + '). Your browser processes it in memory, which can fail on phones or older computers. If it does, trim it first with the ' + toolLink('video-trimmer', 'Video Trimmer') + '.');
    else if (meta && meta.duration > 45 * 60) msgs.push('This is a long video (' + esc(fmtDur(meta.duration)) + '). Processing a long video in the browser takes time and memory — keep this tab open, and use a computer rather than a phone if you can.');
    return msgs.length ? notice('warn', msgs.join(' ')) : null;
  }

  /** Probe a file: media element first, then the engine for formats the browser cannot play. */
  function probeFile(file, S, ui, needVideo) {
    return probeElement(file, 'video').then(function (meta) {
      if (S.dead) return null;
      var unsure = !meta || !meta.duration || (needVideo !== false && !meta.hasVideo && looksVideo(file));
      if (!unsure) return meta;
      return job(S, ui, function (J) {
        return J.input(file, extOf(file.name) || 'bin').then(J.probe);
      });
    });
  }

  /**
   * File tool scaffold: dropzone → read metadata → build(host, file, meta, S, reset).
   * o.pre(root) may add extra content below the dropzone (e.g. "start without a video").
   */
  function fileTool(root, o, build) {
    injectCSS();
    var S = null;
    function reset() {
      if (S) S.dispose();
      S = newScope();
      root.innerHTML = '';
      root.appendChild(BT.dropzone({ accept: o.accept || VIDEO_ACCEPT, title: o.title, hint: o.hint, icon: o.icon || 'upload', color: BRAND,
        onFiles: function (f) { open(f[0]); } }));
      if (o.pre) o.pre(root, S, startWith);
      root.appendChild(privacyNote(o.privacy));
    }
    function startWith(fn) {
      if (S) S.dispose();
      S = newScope();
      root.innerHTML = '';
      fn(root, S, reset);
    }
    function open(file) {
      if (S) S.dispose();
      S = newScope();
      var myS = S;
      root.innerHTML = '';
      root.appendChild(h('div.sv-loading', { html: '<span class="spinner"></span> Reading ' + esc(file.name) + '…' }));
      var ui = progressCard();
      probeElement(file, 'video').then(function (meta) {
        if (myS.dead) return null;
        var unsure = !meta || !meta.duration || (o.needVideo !== false && !meta.hasVideo && looksVideo(file));
        if (!unsure) return meta;
        root.innerHTML = '';
        root.appendChild(ui.el);
        return job(myS, ui, function (J) {
          return J.input(file, extOf(file.name) || 'bin').then(J.probe);
        }).then(function (m) { ui.remove(); return m; });
      }).then(function (meta) {
        if (!meta || myS.dead) return;
        root.innerHTML = '';
        root.appendChild(fileHead(file, meta, reset));
        if (!meta.duration || (!meta.hasVideo && !meta.hasAudio && meta.viaEngine)) {
          root.appendChild(notice('error', 'This file could not be read. It may be damaged or not a video file.'));
          return;
        }
        if (o.needVideo !== false && !meta.hasVideo) {
          root.appendChild(notice('error', 'This file has no video track. Please choose a video file.'));
          return;
        }
        var w = sizeWarning(file, meta);
        if (w) root.appendChild(w);
        var host = h('div');
        root.appendChild(host);
        build(host, file, meta, myS, reset);
      }).catch(function (e) {
        if (myS.dead) return;
        root.innerHTML = '';
        if (!isCancel(e)) errorBox(root, e);
        root.appendChild(h('div.sv-actions', null, [btn('btn-primary', 'rotate-ccw', 'Choose another file', reset)]));
      });
    }
    reset();
    return { reset: reset, open: open };
  }

  /** Preview stage for an input file (video element, or a note when the browser cannot play it). */
  function previewStage(file, meta, S) {
    var stage = h('div.sv-stage');
    var vid = null;
    if (meta.viaEngine) {
      stage.appendChild(h('div.sv-nopreview', { text: 'Your browser can’t preview this format, but it can still be processed here.' }));
    } else {
      vid = mediaEl('video', S.url(file), 'Video preview');
      stage.appendChild(vid);
      S.on(function () { try { vid.pause(); } catch (e) { /* ignore */ } });
    }
    return { el: stage, video: vid };
  }

  /** Preview inside an aspect-locked frame so overlays (crop box, captions) line up with the picture. */
  function framedPreview(file, meta, S) {
    var stage = h('div.sv-stage');
    var frame = null, vid = null;
    if (meta.viaEngine) {
      stage.appendChild(h('div.sv-nopreview', { text: 'Your browser can’t preview this format, but it can still be processed here. Use the sliders to choose times and position.' }));
    } else {
      frame = h('div.sv-frame', { style: { '--ar': String((meta.width || 16) / (meta.height || 9)) } });
      vid = mediaEl('video', S.url(file), 'Video preview');
      frame.appendChild(vid);
      stage.appendChild(frame);
      S.on(function () { try { vid.pause(); } catch (e) { /* ignore */ } });
    }
    return { el: stage, frame: frame, video: vid };
  }

  function editorLayout(host, title) {
    var left = h('div');
    var panel = h('div.card.sv-panel', null, [h('h3', { text: title || 'Settings' })]);
    var actions = h('div.sv-actions');
    panel.appendChild(actions);
    var out = h('div.sv-out');
    host.appendChild(h('div.split.wide-left', null, [left, h('div', null, [panel])]));
    host.appendChild(out);
    return { left: left, panel: panel, actions: actions, out: out, add: function (el) { panel.insertBefore(el, actions); return el; } };
  }

  /** Clip selection UI: dual range + thumbnails + time fields + play controls. */
  function trimmer(L, file, meta, S, vid, o) {
    var D = meta.duration;
    var st = { s: o.start || 0, e: o.end == null ? D : o.end };
    var tf;
    var dr = dualRange({ duration: D, start: st.s, end: st.e, maxSpan: o.maxSpan, onChange: function (a, b, which) {
      st.s = a; st.e = b;
      if (tf) tf.sync(a, b);
      if (vid && !playingSel) { try { vid.currentTime = which === 'a' ? a : b; } catch (e) { /* ignore */ } }
      if (o.onChange) o.onChange(a, b);
    } });
    if (vid) fillThumbs(S.url(file), D, dr.strip, S, o.thumbs || 12);
    tf = timeFields(dr);
    var playingSel = false;
    var now = h('span.sv-now', { 'aria-hidden': 'true', text: fmtTime(0) });
    var playBtn = btn('btn-sm', 'monitor-play', o.playLabel || 'Play selection', function () {
      if (!vid) return;
      if (playingSel) { vid.pause(); return; }
      playingSel = true;
      setBtnText(playBtn, 'square', 'Stop');
      vid.currentTime = st.s;
      var p = vid.play();
      if (p && p.catch) p.catch(function () { playingSel = false; setBtnText(playBtn, 'monitor-play', o.playLabel || 'Play selection'); });
    });
    var bar = h('div.sv-tbar', null, vid ? [
      btn('btn-sm', 'arrow-right', 'Set start at playhead', function () { dr.set(vid.currentTime, Math.max(st.e, vid.currentTime + 0.1), 'a'); }),
      btn('btn-sm', 'arrow-left', 'Set end at playhead', function () { dr.set(st.s, vid.currentTime, 'b'); }),
      playBtn, now
    ] : []);
    if (vid) {
      vid.addEventListener('timeupdate', function () {
        dr.playhead(vid.currentTime);
        now.textContent = fmtTime(vid.currentTime);
        if (playingSel && vid.currentTime >= st.e) vid.pause();
      });
      vid.addEventListener('pause', function () {
        if (playingSel) { playingSel = false; setBtnText(playBtn, 'monitor-play', o.playLabel || 'Play selection'); }
      });
    }
    var wrap = h('div', { style: { marginTop: '14px' } }, [h('div.label', { text: o.label || 'Select the part to keep' }), dr.el, tf.el, bar]);
    L.appendChild(wrap);
    return {
      dr: dr,
      get: function () { return [st.s, st.e]; },
      set: function (a, b, silent) { dr.set(a, b, 'b', silent); var g = dr.get(); st.s = g[0]; st.e = g[1]; tf.sync(g[0], g[1]); },
      setMax: function (m) { dr.o.maxSpan = m; }
    };
  }

  function stepper(label, value, min, max, step, onChange, fmt) {
    var el = input('number', value, { min: String(min), max: String(max), step: String(step), inputmode: 'decimal' });
    el.addEventListener('input', function () {
      var v = parseFloat(el.value);
      if (isFinite(v)) onChange(clamp(v, min, max));
    });
    el.addEventListener('change', function () {
      var v = parseFloat(el.value);
      if (!isFinite(v)) v = value;
      v = clamp(v, min, max);
      el.value = v;
      onChange(v);
    });
    return field(label, el, fmt);
  }

  // ================================================== Canvas text rendering
  var FONTS = {
    sans: { t: 'Sans (clean)', f: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Noto Sans Devanagari", "Noto Sans Bengali", "Nirmala UI", Mangal, Vrinda, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' },
    impact: { t: 'Impact (bold)', f: 'Impact, Haettenschweiler, "Arial Narrow Bold", "Arial Black", "Noto Sans", "Noto Sans Devanagari", "Noto Sans Bengali", "Nirmala UI", Mangal, Vrinda, "Segoe UI Emoji", "Noto Color Emoji", sans-serif' },
    rounded: { t: 'Rounded', f: '"Trebuchet MS", "Verdana", "Segoe UI", "Noto Sans", "Noto Sans Devanagari", "Noto Sans Bengali", "Nirmala UI", Mangal, Vrinda, "Segoe UI Emoji", "Noto Color Emoji", sans-serif' },
    serif: { t: 'Serif', f: 'Georgia, Cambria, "Times New Roman", "Noto Serif", "Noto Serif Devanagari", "Noto Serif Bengali", "Nirmala UI", Mangal, Vrinda, serif' },
    mono: { t: 'Monospace', f: 'ui-monospace, Consolas, "Courier New", "Noto Sans Mono", "Noto Sans Devanagari", "Noto Sans Bengali", "Nirmala UI", monospace' }
  };
  function fontOptions() { return Object.keys(FONTS).map(function (k) { return [k, FONTS[k].t]; }); }
  function fontCss(st, size) { return (st.italic ? 'italic ' : '') + (st.weight || 800) + ' ' + Math.round(size) + 'px ' + (FONTS[st.font] || FONTS.sans).f; }

  /** Split text into grapheme clusters (keeps Indic conjuncts and emoji whole). */
  function graphemes(s) {
    if (window.Intl && Intl.Segmenter) {
      try { return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s), function (x) { return x.segment; }); } catch (e) { /* fall through */ }
    }
    return Array.from(s);
  }

  /** Word-wrap text to maxW using the context's current font. */
  function wrapText(ctx, text, maxW) {
    var out = [];
    String(text || '').split('\n').forEach(function (para) {
      var words = para.split(/(\s+)/).filter(function (w) { return w.length; });
      var line = '';
      words.forEach(function (w) {
        var test = line + w;
        if (!line || ctx.measureText(test.trim()).width <= maxW || /^\s+$/.test(w)) { line = test; }
        else { out.push(line.trim()); line = w.trim() ? w : ''; }
        // A single over-long word: break by grapheme.
        if (ctx.measureText(line.trim()).width > maxW && line.trim().indexOf(' ') < 0) {
          var g = graphemes(line.trim()), cur = '';
          g.forEach(function (ch) {
            if (cur && ctx.measureText(cur + ch).width > maxW) { out.push(cur); cur = ch; } else cur += ch;
          });
          line = cur;
        }
      });
      out.push(line.trim());
    });
    while (out.length > 1 && out[out.length - 1] === '') out.pop();
    return out;
  }

  /**
   * Text style: { font, weight, size (px), color, stroke, strokeW (px), shadow (bool),
   *   box (bool), boxColor, boxAlpha (0..1), align ('center'|'left'|'right'), lineH, upper }
   * Measures a wrapped block. Returns { lines, w, h, lineH, pad }.
   */
  function measureBlock(ctx, text, st, maxW) {
    ctx.font = fontCss(st, st.size);
    var t = st.upper ? String(text || '').toLocaleUpperCase() : String(text || '');
    var lines = wrapText(ctx, t, maxW);
    var lineH = st.size * (st.lineH || 1.22);
    var w = 0;
    lines.forEach(function (l) { w = Math.max(w, ctx.measureText(l).width); });
    var padX = st.box ? st.size * 0.35 : 0, padY = st.box ? st.size * 0.14 : 0;
    var extra = (st.strokeW || 0) + (st.shadow ? st.size * 0.12 : 0);
    return { lines: lines, w: w, h: lines.length * lineH, lineH: lineH, padX: padX, padY: padY, extra: extra };
  }

  /** Draw a measured block with its top-left text area at (x, y) and width bw (for alignment). */
  function drawBlock(ctx, m, st, x, y, bw) {
    ctx.save();
    ctx.font = fontCss(st, st.size);
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    var align = st.align || 'center';
    m.lines.forEach(function (line, i) {
      var lw = ctx.measureText(line).width;
      var lx = align === 'left' ? x : align === 'right' ? x + bw - lw : x + (bw - lw) / 2;
      var cy = y + m.lineH * (i + 0.5);
      if (st.box && line) {
        ctx.save();
        ctx.globalAlpha = st.boxAlpha == null ? 0.7 : st.boxAlpha;
        ctx.fillStyle = st.boxColor || '#000000';
        roundRect(ctx, lx - m.padX, cy - m.lineH / 2 - m.padY + m.lineH * 0.04, lw + m.padX * 2, m.lineH + m.padY * 2 - m.lineH * 0.08, st.size * 0.18);
        ctx.fill();
        ctx.restore();
      }
      if (st.shadow) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,.75)';
        ctx.shadowBlur = st.size * 0.12;
        ctx.shadowOffsetX = st.size * 0.04;
        ctx.shadowOffsetY = st.size * 0.06;
        ctx.fillStyle = st.strokeW ? (st.stroke || '#000') : 'rgba(0,0,0,.6)';
        if (st.strokeW) { ctx.lineWidth = st.strokeW * 2; ctx.strokeStyle = st.stroke || '#000'; ctx.strokeText(line, lx, cy); }
        else ctx.fillText(line, lx, cy);
        ctx.restore();
      }
      if (st.strokeW) {
        ctx.lineWidth = st.strokeW * 2;
        ctx.strokeStyle = st.stroke || '#000000';
        ctx.strokeText(line, lx, cy);
      }
      ctx.fillStyle = st.color || '#ffffff';
      ctx.fillText(line, lx, cy);
    });
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, hh, r) {
    r = Math.max(0, Math.min(r, w / 2, hh / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + hh, r);
    ctx.arcTo(x + w, y + hh, x, y + hh, r);
    ctx.arcTo(x, y + hh, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function mkCanvas(w, hh) { var c = doc.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(hh)); return c; }

  /** Tight transparent canvas holding the text block. */
  function textCanvas(text, st, maxW) {
    var c = mkCanvas(4, 4), ctx = c.getContext('2d');
    var m = measureBlock(ctx, text, st, maxW);
    var pad = Math.ceil(m.extra + Math.max(m.padX, m.padY) + 2);
    c.width = Math.ceil(m.w + pad * 2 + m.padX * 2);
    c.height = Math.ceil(m.h + pad * 2 + m.padY * 2);
    ctx = c.getContext('2d');
    drawBlock(ctx, m, st, pad + m.padX, pad + m.padY, m.w);
    return c;
  }

  /**
   * Caption band: W × bandH transparent canvas with the text anchored to the
   * band's bottom/middle/top, so every caption image has the same size.
   */
  function bandCanvas(text, st, W, bandH, anchor, maxW) {
    var c = mkCanvas(W, bandH), ctx = c.getContext('2d');
    if (!text) return c;
    var m = measureBlock(ctx, text, st, maxW);
    var tw = m.w;
    var x = (W - tw) / 2;
    if (st.align === 'left') x = (W - maxW) / 2;
    else if (st.align === 'right') x = (W + maxW) / 2 - tw;
    var pad = m.extra + m.padY + 2;
    var y = anchor === 'top' ? pad : anchor === 'middle' ? (bandH - m.h) / 2 : bandH - m.h - pad;
    drawBlock(ctx, m, st, x, y, tw);
    return c;
  }
  function bandHeight(texts, st, maxW) {
    var ctx = mkCanvas(4, 4).getContext('2d'), mx = 0, extra = 0;
    texts.forEach(function (t) {
      var m = measureBlock(ctx, t, st, maxW);
      mx = Math.max(mx, m.h + m.padY * 2);
      extra = m.extra;
    });
    return even(mx + extra * 2 + 8);
  }
  function canvasPNG(c) { return BT.canvasToBlob(c, 'image/png'); }

  /** Strip markup that subtitle files may carry (<i>, <font>, {\an8}, VTT voice tags). */
  function cleanCue(t) {
    return String(t || '').replace(/\{\\[^}]*\}/g, '').replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').trim();
  }

  // ===================================================== Subtitle parsing
  var TS_RE = /((?:\d+:)?\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?)\s*-->\s*((?:\d+:)?\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?)/;
  function parseTs(s) {
    var p = s.replace(',', '.').split(':');
    var sec = 0;
    p.forEach(function (x) { sec = sec * 60 + parseFloat(x); });
    return sec;
  }
  /** Parse SRT or WebVTT text into [{start, end, text}] (robust to BOM, CRLF, missing numbers, cue settings). */
  function parseSubs(txt) {
    txt = String(txt || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    var lines = txt.split('\n'), out = [], cur = null;
    function flush() {
      if (cur) {
        var t = cur.text.join('\n').replace(/\n+$/, '');
        if (cur.end > cur.start) out.push({ start: cur.start, end: cur.end, text: cleanCue(t) });
      }
      cur = null;
    }
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      var m = l.match(TS_RE);
      if (m) {
        // A line with a bare number just before the timing line is the cue index; drop it.
        if (cur && cur.text.length && /^\s*\d+\s*$/.test(cur.text[cur.text.length - 1])) cur.text.pop();
        flush();
        cur = { start: parseTs(m[1]), end: parseTs(m[2]), text: [] };
        continue;
      }
      if (!cur) continue;
      if (/^\s*$/.test(l)) {
        // Blank line ends the cue, unless the next non-blank line is plain text without a timing (lenient).
        if (cur.text.length) { cur.text.push(''); }
        continue;
      }
      if (/^(NOTE|STYLE|REGION)(\s|$)/.test(l) && cur.text.length && cur.text[cur.text.length - 1] === '') { flush(); continue; }
      cur.text.push(l);
    }
    if (cur && cur.text.length && /^\s*\d+\s*$/.test(cur.text[cur.text.length - 1])) cur.text.pop();
    flush();
    out.forEach(function (c) { c.text = c.text.replace(/\n{2,}/g, '\n').replace(/\n\s*\d+\s*$/, '').trim(); });
    out = out.filter(function (c) { return c.text.length; });
    out.sort(function (a, b) { return a.start - b.start; });
    return out;
  }
  function tsSrt(s, sep) {
    s = Math.max(0, s);
    var ms = Math.round(s * 1000);
    var hh = Math.floor(ms / 3600000), mm = Math.floor(ms / 60000) % 60, ss = Math.floor(ms / 1000) % 60, f = ms % 1000;
    return pad(hh) + ':' + pad(mm) + ':' + pad(ss) + (sep || ',') + pad(f, 3);
  }
  function toSrt(cues) {
    return cues.map(function (c, i) { return (i + 1) + '\n' + tsSrt(c.start) + ' --> ' + tsSrt(c.end) + '\n' + String(c.text).trim(); }).join('\n\n') + '\n';
  }
  function toVtt(cues) {
    return 'WEBVTT\n\n' + cues.map(function (c, i) { return (i + 1) + '\n' + tsSrt(c.start, '.') + ' --> ' + tsSrt(c.end, '.') + '\n' + String(c.text).trim(); }).join('\n\n') + '\n';
  }

  /**
   * Write a caption track for ffmpeg: one same-size PNG per caption (plus a
   * transparent gap image) joined with the concat demuxer, so any number of
   * captions is composited in a single overlay pass.
   * cues: [{start, end, text}] in output time. Returns the concat list path or null.
   */
  function writeCaptionTrack(J, cues, st, W, bandH, anchor, maxW, total) {
    cues = cues.filter(function (c) { return c.end > c.start && c.start < total && c.text; })
      .map(function (c) { return { start: Math.max(0, c.start), end: Math.min(total, c.end), text: c.text }; })
      .sort(function (a, b) { return a.start - b.start; });
    if (!cues.length) return Promise.resolve(null);
    var blank = null, list = ['ffconcat version 1.0'], t = 0, chain = Promise.resolve();
    function blankPng() {
      if (blank) return Promise.resolve(blank);
      return canvasPNG(mkCanvas(W, bandH)).then(function (b) { return J.write('png', b); }).then(function (f) { blank = f; return f; });
    }
    function name(p) { return 'file \'' + p.replace(/^\//, '').replace(/'/g, '') + '\''; }
    cues.forEach(function (c, i) {
      chain = chain.then(function () {
        J.guard();
        var start = Math.max(c.start, t);
        var end = c.end;
        if (end - start < 0.04) return;
        var p = Promise.resolve();
        if (start - t >= 0.04) p = blankPng().then(function (f) { list.push(name(f), 'duration ' + (start - t).toFixed(3)); });
        return p.then(function () { return canvasPNG(bandCanvas(c.text, st, W, bandH, anchor, maxW)); })
          .then(function (b) { return J.write('png', b); })
          .then(function (f) { list.push(name(f), 'duration ' + (end - start).toFixed(3)); t = end; });
      });
    });
    return chain.then(blankPng).then(function (f) {
      list.push(name(f), 'duration ' + Math.max(0.1, total - t + 1).toFixed(3));
      list.push(name(f));
      return J.write('txt', new TextEncoder().encode(list.join('\n') + '\n'));
    });
  }

  // ======================================================== Reframe engine
  /** Crop geometry for fitting an iw×ih picture to aspect W/H. */
  function cropGeom(iw, ih, W, H) {
    var A = W / H, horiz = iw / ih > A, cw, ch;
    if (horiz) { ch = ih - (ih % 2); cw = Math.min(iw - (iw % 2), even(ch * A)); }
    else { cw = iw - (iw % 2); ch = Math.min(ih - (ih % 2), even(cw / A)); }
    return { horiz: horiz, cw: cw, ch: ch, iw: iw, ih: ih };
  }

  /** Piecewise-linear crop x(t) as a flat ffmpeg expression (no deep nesting). */
  function pathExpr(pts) {
    if (pts.length === 1) return String(Math.round(pts[0].x));
    var parts = ['lt(t,' + pts[0].t.toFixed(2) + ')*' + pts[0].x.toFixed(1)];
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1], dt = b.t - a.t;
      if (dt <= 0) continue;
      var slope = (b.x - a.x) / dt;
      parts.push('gte(t,' + a.t.toFixed(2) + ')*lt(t,' + b.t.toFixed(2) + ')*(' + a.x.toFixed(1) + '+(t-' + a.t.toFixed(2) + ')*' + slope.toFixed(3) + ')');
    }
    var z = pts[pts.length - 1];
    parts.push('gte(t,' + z.t.toFixed(2) + ')*' + z.x.toFixed(1));
    return parts.join('+');
  }

  /**
   * Filter chain from [inL] to [outL] that turns iw×ih into W×H.
   * mode: 'crop' (o.pos 0..1, o.path = [{t, c}] face centres), 'bars' (o.color), 'blur'.
   */
  function reframeChain(inL, outL, iw, ih, W, H, mode, o) {
    o = o || {};
    var pre = o.pre ? o.pre + ',' : '';
    if (mode === 'bars') {
      return '[' + inL + ']' + pre + 'scale=' + W + ':' + H + ':force_original_aspect_ratio=decrease:force_divisible_by=2,pad=' + W + ':' + H +
        ':(ow-iw)/2:(oh-ih)/2:color=' + hexToFF(o.color) + ',setsar=1[' + outL + ']';
    }
    if (mode === 'blur') {
      var bw = even(W / 6), bh = even(H / 6);
      return '[' + inL + ']' + pre + 'split=2[' + outL + 'a][' + outL + 'b];' +
        '[' + outL + 'a]scale=' + bw + ':' + bh + ':force_original_aspect_ratio=increase,crop=' + bw + ':' + bh + ',boxblur=6:2,eq=brightness=-0.06,scale=' + W + ':' + H + ',setsar=1[' + outL + 'c];' +
        '[' + outL + 'b]scale=' + W + ':' + H + ':force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1[' + outL + 'd];' +
        '[' + outL + 'c][' + outL + 'd]overlay=(W-w)/2:(H-h)/2[' + outL + ']';
    }
    var g = cropGeom(iw, ih, W, H), x = 0, y = 0, p = o.pos == null ? 0.5 : clamp(o.pos, 0, 1);
    if (g.horiz) x = Math.round((iw - g.cw) * p); else y = Math.round((ih - g.ch) * p);
    var xs = String(x - (x % 2));
    if (o.path && o.path.length && g.horiz) {
      var pts = o.path.map(function (q) { return { t: q.t, x: clamp(q.c * iw - g.cw / 2, 0, iw - g.cw) }; });
      xs = '\'' + pathExpr(pts) + '\'';
    }
    return '[' + inL + ']' + pre + 'crop=' + g.cw + ':' + g.ch + ':' + xs + ':' + (y - (y % 2)) + ',scale=' + W + ':' + H + ':flags=bicubic,setsar=1[' + outL + ']';
  }

  /**
   * Encode one reframed clip. o: { s, len, W, H, mode, pos, path, color, title, titleStyle,
   *   cues (output-time), capStyle, capAnchor, speed, crf, label, from, to }
   */
  function encodeReframed(J, inp, pm, o) {
    var W = o.W, H = o.H, len = o.len;
    var args = [];
    if (o.s > 0) args.push('-ss', o.s.toFixed(3));
    args.push('-i', inp);
    var n = 1, chain = [], cur = 'v0';
    var pre = pm.fps > 31 ? 'fps=30' : '';
    chain.push(reframeChain('0:v', cur, pm.width, pm.height, W, H, o.mode, { pos: o.pos, path: o.path, color: o.color, pre: pre }));
    var p = Promise.resolve();
    if (o.title && o.title.trim()) {
      p = p.then(function () {
        var c = textCanvas(o.title.trim(), o.titleStyle, W * 0.86);
        var x = Math.round((W - c.width) / 2), y = Math.round(H * (o.titleY == null ? 0.08 : o.titleY));
        return canvasPNG(c).then(function (b) { return J.write('png', b); }).then(function (f) {
          args.push('-i', f);
          chain.push('[' + cur + '][' + n + ':v]overlay=' + x + ':' + y + '[v' + n + ']');
          cur = 'v' + n; n++;
        });
      });
    }
    if (o.cues && o.cues.length) {
      p = p.then(function () {
        var maxW = W * 0.86;
        var bh = Math.min(Math.round(H * 0.45), bandHeight(o.cues.map(function (c) { return c.text; }), o.capStyle, maxW));
        return writeCaptionTrack(J, o.cues, o.capStyle, W, bh, o.capAnchor || 'bottom', maxW, len).then(function (list) {
          if (!list) return;
          var y = o.capAnchor === 'top' ? Math.round(H * 0.06) : o.capAnchor === 'middle' ? Math.round((H - bh) / 2) : Math.round(H * (o.capBottom || 0.92) - bh);
          args.push('-f', 'concat', '-safe', '0', '-i', list);
          chain.push('[' + cur + '][' + n + ':v]overlay=0:' + Math.max(0, y) + ':format=auto[v' + n + ']');
          cur = 'v' + n; n++;
        });
      });
    }
    return p.then(function () {
      chain.push('[' + cur + ']format=yuv420p[vout]');
      var out = J.out('mp4');
      args.push('-filter_complex', chain.join(';'), '-map', '[vout]');
      if (pm.hasAudio && !o.mute) args.push('-map', '0:a:0?');
      args.push('-t', len.toFixed(3));
      args = args.concat(h264Args(o.speed, o.crf));
      args = args.concat(pm.hasAudio && !o.mute ? AAC : ['-an']);
      args = args.concat(FASTSTART, [out]);
      return J.run(args, { dur: len, label: o.label || 'Encoding…', sub: o.sub || 'Keep this tab open.', from: o.from, to: o.to }).then(function () {
        return J.read(out).then(function (data) { J.del(out); return data; });
      });
    });
  }

  // ======================================================== Face tracking
  var faceTaskP = null;
  function getFaceTask(onProgress) {
    if (faceTaskP) return faceTaskP;
    faceTaskP = Promise.all([BT.loadMediapipe(), BT.loadAiModel('face-short', onProgress)]).then(function (r) {
      return r[0].vision.FaceDetector.createFromOptions(r[0].fileset, {
        baseOptions: { modelAssetBuffer: new Uint8Array(r[1]), delegate: 'CPU' },
        runningMode: 'IMAGE', minDetectionConfidence: 0.5, minSuppressionThreshold: 0.3
      });
    }).catch(function (e) { faceTaskP = null; throw e; });
    return faceTaskP;
  }

  /** Smooth a face-centre series (nulls = no face) into a gentle camera path [{t, c}]. */
  function smoothPath(times, cs, frac) {
    var n = cs.length, found = cs.filter(function (c) { return c != null; }).length;
    if (!n || found / n < 0.2) return null;
    var v = cs.slice();
    // Fill gaps: hold the nearest known value.
    var last = null;
    for (var i = 0; i < n; i++) { if (v[i] != null) last = v[i]; else v[i] = last; }
    last = null;
    for (i = n - 1; i >= 0; i--) { if (cs[i] != null) last = cs[i]; else if (v[i] == null) v[i] = last; }
    // Median (removes blips), then moving average.
    function filt(arr, r, fn) {
      return arr.map(function (_, k) { var w = arr.slice(Math.max(0, k - r), Math.min(n, k + r + 1)); return fn(w); });
    }
    v = filt(v, 2, function (w) { var s = w.slice().sort(function (a, b) { return a - b; }); return s[s.length >> 1]; });
    v = filt(v, 3, function (w) { return w.reduce(function (a, b) { return a + b; }, 0) / w.length; });
    // Dead zone: the virtual camera only moves when the face leaves the middle of the frame.
    var dz = frac * 0.18, cam = v[0], out = [];
    for (i = 0; i < n; i++) {
      if (v[i] > cam + dz) cam = v[i] - dz;
      else if (v[i] < cam - dz) cam = v[i] + dz;
      out.push(cam);
    }
    // Simplify to key points (Ramer–Douglas–Peucker).
    var pts = out.map(function (c, k) { return { t: times[k], c: c }; });
    function rdp(a, b, eps, acc) {
      var mx = 0, idx = -1;
      for (var k = a + 1; k < b; k++) {
        var tt = (pts[k].t - pts[a].t) / ((pts[b].t - pts[a].t) || 1);
        var ex = pts[a].c + (pts[b].c - pts[a].c) * tt, d = Math.abs(pts[k].c - ex);
        if (d > mx) { mx = d; idx = k; }
      }
      if (mx > eps && idx > -1) { rdp(a, idx, eps, acc); acc.push(pts[idx]); rdp(idx, b, eps, acc); }
    }
    var keep = [pts[0]];
    if (n > 1) { rdp(0, n - 1, 0.008, keep); keep.push(pts[n - 1]); }
    while (keep.length > 80) keep = keep.filter(function (_, k) { return k % 2 === 0 || k === keep.length - 1; });
    keep[0] = { t: 0, c: keep[0].c };
    return keep;
  }

  /** Detect faces on the whole frame and on overlapping square tiles (finds smaller faces). Returns centres 0..1 with sizes. */
  function detectAll(task, c, tile, SW, SH) {
    var found = [];
    function run(src, ox, oy, sc) {
      var r = null;
      try { r = task.detect(src); } catch (e) { r = null; }
      ((r && r.detections) || []).forEach(function (d) {
        var b = d.boundingBox;
        if (!b) return;
        var sco = d.categories && d.categories[0] ? d.categories[0].score : 0.5;
        found.push({ cx: (ox + (b.originX + b.width / 2) * sc) / SW, cy: (oy + (b.originY + b.height / 2) * sc) / SH, size: b.width * b.height * sc * sc, score: sco });
      });
    }
    run(c, 0, 0, 1);
    var side = Math.min(SW, SH), long = Math.max(SW, SH);
    if (long / side > 1.2) {
      var n = Math.ceil(long / side * 1.5), tctx = tile.getContext('2d');
      tile.width = side; tile.height = side;
      for (var k = 0; k < n; k++) {
        var off = Math.round((long - side) * k / (n - 1));
        var ox = SW > SH ? off : 0, oy = SW > SH ? 0 : off;
        tctx.drawImage(c, ox, oy, side, side, 0, 0, side, side);
        run(tile, ox, oy, 1);
      }
    }
    // Merge duplicates found by the full frame and by overlapping tiles.
    var keep = [];
    found.sort(function (a, b) { return b.score - a.score; }).forEach(function (f) {
      var dup = keep.some(function (q) { return Math.abs(q.cx - f.cx) < 0.06 && Math.abs(q.cy - f.cy) < 0.1; });
      if (!dup && f.score >= 0.55) keep.push(f);
    });
    return keep;
  }

  /** Main face → horizontal centre 0..1 (largest, biased to stay near the previous one), or null. */
  function pickFace(faces, prev) {
    var best = null, bestScore = -1;
    faces.forEach(function (f) {
      var sc = f.size * (prev == null ? 1 : 1 / (1 + Math.abs(f.cx - prev) * 4));
      if (sc > bestScore) { bestScore = sc; best = f.cx; }
    });
    return best;
  }

  /** Sample frames of [s, s+len] with ffmpeg and find the face path. Resolves {path, ratio} (path null = no faces). */
  function trackFaces(J, inp, pm, s, len, from, to) {
    var fps = len > 150 ? 0.5 : len > 60 ? 1 : 2;
    var SW = 480, SH = even(480 * pm.height / pm.width);
    if (SH > 480) { SH = 480; SW = even(480 * pm.width / pm.height); }
    var raw = J.out('raw');
    var args = [];
    if (s > 0) args.push('-ss', s.toFixed(3));
    args.push('-i', inp, '-t', len.toFixed(3), '-an', '-sn', '-vf', 'fps=' + fps + ',scale=' + SW + ':' + SH + ',format=rgba', '-f', 'rawvideo', raw);
    var mid = from + (to - from) * 0.4;
    return J.run(args, { dur: len, label: 'Finding faces…', sub: 'Sampling frames for face tracking.', from: from, to: mid }).then(function () {
      return J.read(raw);
    }).then(function (data) {
      J.del(raw);
      J.stage('Finding faces…', 'Running the face detector on your device (about 10 MB, downloaded once).', mid);
      return getFaceTask().then(function (task) {
        var fsz = SW * SH * 4, nf = Math.floor(data.length / fsz), times = [], cs = [], prev = null;
        var c = mkCanvas(SW, SH), ctx = c.getContext('2d'), tile = mkCanvas(2, 2);
        var i = 0;
        function step() {
          J.guard();
          var end = Math.min(nf, i + 4);
          for (; i < end; i++) {
            ctx.putImageData(new ImageData(new Uint8ClampedArray(data.buffer, data.byteOffset + i * fsz, fsz), SW, SH), 0, 0);
            var cx = pickFace(detectAll(task, c, tile, SW, SH), prev);
            if (cx != null) prev = cx;
            times.push(i / fps);
            cs.push(cx);
          }
          J.set(mid + (to - mid) * (nf ? i / nf : 1));
          if (i < nf) return new Promise(function (res) { setTimeout(res, 0); }).then(step);
          data = null;
          var g = cropGeom(pm.width, pm.height, 9, 16);
          var found = cs.filter(function (x) { return x != null; }).length;
          return { path: smoothPath(times, cs, g.cw / pm.width), ratio: nf ? found / nf : 0 };
        }
        return step();
      });
    });
  }

  // ======================================================== Highlight finder
  /** Loudness envelope (dB per 0.5 s window) from mono s16le PCM. */
  function loudness(pcm, rate, win) {
    var n = Math.floor(pcm.length / (rate * win)), out = new Float32Array(n), per = Math.floor(rate * win);
    for (var i = 0; i < n; i++) {
      var sum = 0;
      for (var j = i * per, e = j + per; j < e; j++) { var v = pcm[j] / 32768; sum += v * v; }
      out[i] = 10 * Math.log10(sum / per + 1e-9);
    }
    return out;
  }

  /** Scene-change score per window by sampling frames with a hidden <video>. */
  function sceneScores(url, D, win, S, onP) {
    return new Promise(function (resolve) {
      var n = Math.floor(D / win), out = new Float32Array(n);
      var step = Math.max(1, D / 300), times = [];
      for (var t = step / 2; t < D - 0.05; t += step) times.push(t);
      var v = doc.createElement('video');
      v.muted = true; v.preload = 'auto'; v.playsInline = true;
      var c = mkCanvas(48, 27), ctx = c.getContext('2d', { willReadFrequently: true }), prev = null, i = 0, alive = true;
      function stop() { alive = false; v.onseeked = v.onloadeddata = v.onerror = null; v.removeAttribute('src'); try { v.load(); } catch (e) { /* ignore */ } }
      S.on(stop);
      function finish() { stop(); resolve(out); }
      function next() {
        if (!alive || S.dead) return finish();
        if (i >= times.length) return finish();
        var to = setTimeout(grab, 3000);
        function grab() {
          clearTimeout(to);
          v.onseeked = null;
          try {
            ctx.drawImage(v, 0, 0, 48, 27);
            var d = ctx.getImageData(0, 0, 48, 27).data, g = new Float32Array(48 * 27);
            for (var k = 0; k < g.length; k++) g[k] = d[k * 4] * 0.3 + d[k * 4 + 1] * 0.59 + d[k * 4 + 2] * 0.11;
            if (prev) {
              var diff = 0;
              for (k = 0; k < g.length; k++) diff += Math.abs(g[k] - prev[k]);
              diff /= g.length * 255;
              var w = Math.min(n - 1, Math.floor(times[i] / win));
              if (w >= 0) for (var q = Math.max(0, w - 1); q <= Math.min(n - 1, w + 1); q++) out[q] = Math.max(out[q], diff);
            }
            prev = g;
          } catch (e) { /* frame unavailable */ }
          i++;
          if (onP) onP(i / times.length);
          next();
        }
        v.onseeked = grab;
        v.currentTime = times[i];
      }
      v.onloadeddata = function () { v.onloadeddata = null; next(); };
      v.onerror = finish;
      v.src = url;
    });
  }

  function zscore(a) {
    var n = a.length, m = 0, s = 0, i;
    if (!n) return a;
    for (i = 0; i < n; i++) m += a[i];
    m /= n;
    for (i = 0; i < n; i++) s += (a[i] - m) * (a[i] - m);
    s = Math.sqrt(s / n) || 1;
    var out = new Float32Array(n);
    for (i = 0; i < n; i++) out[i] = Math.max(-3, Math.min(3, (a[i] - m) / s));
    return out;
  }

  /**
   * Pick the top `count` non-overlapping segments of length L seconds.
   * loud / scene: per-window scores (either may be null).
   */
  function pickHighlights(loud, scene, win, D, L, count) {
    var n = Math.max(loud ? loud.length : 0, scene ? scene.length : 0, Math.floor(D / win));
    var lz = loud && loud.length ? zscore(loud) : null, sz = scene && scene.length ? zscore(scene) : null;
    var score = new Float32Array(n);
    for (var i = 0; i < n; i++) score[i] = (lz && i < lz.length ? lz[i] : 0) + (sz && i < sz.length ? sz[i] * 0.6 : 0);
    var k = Math.max(1, Math.round(L / win));
    if (k >= n) return [{ s: 0, e: Math.min(D, L) }];
    var pre = new Float32Array(n + 1);
    for (i = 0; i < n; i++) pre[i + 1] = pre[i] + score[i];
    var cands = [];
    for (i = 0; i + k <= n; i++) cands.push({ i: i, v: (pre[i + k] - pre[i]) / k });
    cands.sort(function (a, b) { return b.v - a.v; });
    var picks = [];
    for (var c = 0; c < cands.length && picks.length < count; c++) {
      var st = cands[c].i * win, en = st + L;
      if (en > D) { en = D; st = Math.max(0, D - L); }
      var ok = picks.every(function (p) { return en + 1 <= p.s || st >= p.e + 1; });
      if (ok) picks.push({ s: st, e: en, score: cands[c].v });
    }
    // Start on a quieter moment (within 1.5 s earlier) so a clip does not begin mid-word.
    if (loud) picks.forEach(function (p) {
      var w0 = Math.floor(p.s / win), best = w0;
      for (var q = w0; q >= Math.max(0, w0 - Math.round(1.5 / win)); q--) if (loud[q] < loud[best] - 3) best = q;
      var shift = (w0 - best) * win;
      var ok = picks.every(function (o) { return o === p || p.s - shift >= o.e + 1 || p.e - shift + 1 <= o.s; });
      if (shift > 0 && ok) { p.s -= shift; p.e -= shift; }
    });
    picks.sort(function (a, b) { return a.s - b.s; });
    return picks.map(function (p) { return { s: Math.round(p.s * 10) / 10, e: Math.round(Math.min(D, p.e) * 10) / 10 }; });
  }

  /** Crop-box overlay on a framed preview: draggable (manual) or static. */
  function cropBox(frame, iw, ih, onMove) {
    var box = h('div.sv-crop', { tabindex: '0', role: 'slider', 'aria-label': 'Crop position', 'aria-valuemin': '0', 'aria-valuemax': '100' });
    frame.appendChild(box);
    var st = { pos: 0.5, W: 9, H: 16, draggable: true, visible: true };
    function geom() { return cropGeom(iw, ih, st.W, st.H); }
    function paint() {
      var g = geom();
      box.classList.toggle('hidden', !st.visible);
      box.classList.toggle('sv-static', !st.draggable);
      box.classList.toggle('sv-v', !g.horiz);
      box.tabIndex = st.draggable ? 0 : -1;
      if (g.horiz) {
        var wf = g.cw / iw;
        box.style.width = (wf * 100) + '%';
        box.style.height = '100%';
        box.style.top = '0';
        box.style.left = ((1 - wf) * st.pos * 100) + '%';
      } else {
        var hf = g.ch / ih;
        box.style.height = (hf * 100) + '%';
        box.style.left = '0';
        box.style.top = ((1 - hf) * st.pos * 100) + '%';
      }
      box.setAttribute('aria-valuenow', String(Math.round(st.pos * 100)));
      box.setAttribute('aria-valuetext', Math.round(st.pos * 100) + '%');
    }
    var drag = null;
    box.addEventListener('pointerdown', function (e) {
      if (!st.draggable) return;
      e.preventDefault();
      box.setPointerCapture(e.pointerId);
      drag = { x: e.clientX, y: e.clientY, pos: st.pos };
      box.classList.add('sv-dragging');
    });
    box.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var g = geom(), r = frame.getBoundingClientRect();
      var free = g.horiz ? r.width * (1 - g.cw / iw) : r.height * (1 - g.ch / ih);
      if (free <= 0) return;
      var d = g.horiz ? e.clientX - drag.x : e.clientY - drag.y;
      st.pos = clamp(drag.pos + d / free, 0, 1);
      paint();
      onMove(st.pos);
    });
    function end() { drag = null; box.classList.remove('sv-dragging'); }
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
    box.addEventListener('keydown', function (e) {
      if (!st.draggable) return;
      var d = { ArrowLeft: -0.03, ArrowUp: -0.03, ArrowRight: 0.03, ArrowDown: 0.03, Home: -1, End: 1 }[e.key];
      if (d == null) return;
      e.preventDefault();
      st.pos = clamp(st.pos + d, 0, 1);
      paint();
      onMove(st.pos);
    });
    paint();
    return {
      set: function (o) { Object.assign(st, o); paint(); }
    };
  }

  function readTextFile(file) {
    return BT.readFile(file, 'text');
  }

  /** Hidden file input + button. */
  function fileButton(text, iconName, accept, onFile, cls) {
    var inp = h('input', { type: 'file', accept: accept, class: 'hidden', 'aria-hidden': 'true', tabindex: '-1' });
    var b = btn(cls || 'btn-sm', iconName, text, function () { inp.click(); });
    inp.addEventListener('change', function () { var f = inp.files && inp.files[0]; inp.value = ''; if (f) onFile(f); });
    var wrap = h('span', null, [b, inp]);
    wrap.button = b;
    return wrap;
  }

  /** Result tile (several outputs in a grid). */
  function resultTile(S, blob, name, lines) {
    var v = h('video', { controls: true, preload: 'metadata', playsinline: true, 'aria-label': 'Preview of ' + name });
    v.src = S.url(blob);
    return h('div.sv-rc', null, [v, h('div.sv-rn', { text: name }), h('div.muted.small', { text: lines }),
      btn('btn-primary btn-sm', 'download', 'Download MP4', function () { BT.download(blob, name); })]);
  }

  var TITLE_SIZES = { s: 0.05, m: 0.065, l: 0.085 };
  var CAP_SIZES = { s: 0.045, m: 0.058, l: 0.072 };

  // ======================================================== 1. SHORTS MAKER
  var SHORT_LIMITS = [
    { v: '60', t: 'YouTube Shorts', s: '≤ 60 s · safest length', max: 60 },
    { v: '180', t: 'Shorts up to 3 min', s: 'Allowed for most channels', max: 180 },
    { v: '90', t: 'Reels', s: '≤ 90 s · Instagram & Facebook', max: 90 },
    { v: '0', t: 'Any length', s: 'No limit applied', max: 0 }
  ];

  register('shorts-maker', function (root) {
    fileTool(root, { title: 'Choose a long video', hint: 'MP4, MOV, WebM or MKV — or drag and drop it here', needVideo: true },
      function (host, file, meta, S, reset) {
        var D = meta.duration;
        var L = editorLayout(host, 'Shorts settings');
        var pv = framedPreview(file, meta, S);
        L.left.appendChild(pv.el);
        var vid = pv.video;
        var st = { limit: '60', mode: 'crop', res: '1080', titleSize: 'm', titleColor: '#ffffff', capSize: 'm', cues: [], capName: '' };
        function maxLen() { var l = SHORT_LIMITS.filter(function (x) { return x.v === st.limit; })[0]; return l ? l.max : 0; }
        var clips = [], sel = 0, cidSeq = 0;
        function newClip(s, e) { return { id: ++cidSeq, s: s, e: e, pos: 0.5, title: '' }; }
        clips.push(newClip(0, Math.min(D, maxLen() || D, 30)));

        // --- crop box over the preview
        var box = pv.frame ? cropBox(pv.frame, meta.width, meta.height, function (p) { clips[sel].pos = p; posField.setValue(Math.round(p * 100)); }) : null;

        // --- timeline for the selected clip
        var T = trimmer(L.left, file, meta, S, vid, { start: clips[0].s, end: clips[0].e, maxSpan: maxLen(), label: 'Selected clip — drag the handles or type times', playLabel: 'Play clip',
          onChange: function (a, b) { clips[sel].s = a; clips[sel].e = b; renderClips(true); } });

        // --- clips list + highlights
        var listEl = h('div.sv-list');
        var clipsCard = h('div.card', { style: { marginTop: '16px' } }, [
          h('div.card-title', null, [h('h3', { text: 'Clips to export' }), btn('btn-sm', 'plus', 'Add clip', addClip)]),
          listEl
        ]);
        L.left.appendChild(clipsCard);

        var hiCount = select([['1', '1 clip'], ['2', '2 clips'], ['3', '3 clips'], ['4', '4 clips'], ['5', '5 clips'], ['6', '6 clips'], ['8', '8 clips']], D > 240 ? '3' : '2');
        var hiLen = select([['15', '15 s'], ['20', '20 s'], ['30', '30 s'], ['45', '45 s'], ['60', '60 s'], ['90', '90 s']], '30');
        var hiScene = checkbox('Also look for visual changes (slower)', !!vid && D <= 1800);
        if (!vid) { hiScene.input.disabled = true; hiScene.input.checked = false; }
        var hiOut = h('div');
        var hiBtn = btn('btn-sm', 'sparkles', 'Suggest highlights', suggest);
        clipsCard.appendChild(h('div.sv-sec', null, [
          h('h4', { text: 'Suggest highlights' }),
          h('p.small.muted', { style: { marginTop: '0' }, text: 'Finds the loudest, liveliest moments (speech peaks, cheering, music drops' + (vid ? ', scene changes' : '') + '). It’s a starting point — check and adjust each clip.' }),
          h('div.sv-2', null, [field('How many', hiCount), field('Length each', hiLen)]),
          h('div.field', null, [hiScene]),
          h('div.sv-tbar', null, [hiBtn]),
          hiOut
        ]));

        // --- settings panel
        var limCards = optCards(SHORT_LIMITS.map(function (x) { return { v: x.v, t: x.t, s: x.s }; }), st.limit, function (v) {
          st.limit = v; T.setMax(maxLen());
          var m = maxLen();
          if (m) clips.forEach(function (c) { if (c.e - c.s > m) c.e = c.s + m; });
          selectClip(sel);
        }, 'Maximum clip length');
        L.add(labeled('Platform and length', limCards));
        L.add(h('p.small.muted', { style: { margin: '-6px 0 14px' }, html: 'Platform limits change — check the app before posting. YouTube allows Shorts up to 3 minutes for most channels at the time of writing.' }));
        var modeCards = optCards([
          { v: 'crop', t: 'Center crop', s: 'Fill the screen' },
          { v: 'manual', t: 'Choose position', s: 'Drag the box' },
          { v: 'face', t: 'Follow faces', s: 'Auto, on your device' },
          { v: 'blur', t: 'Fit + blur', s: 'Whole frame, blurred fill' }
        ], st.mode, function (v) { st.mode = v; updMode(); }, 'Reframe mode');
        L.add(labeled('Reframe to 9:16', modeCards));
        var posField = L.add(range('Crop position (selected clip)', 0, 100, 1, 50, function (v) { return v + '%'; }, function (v) {
          clips[sel].pos = v / 100; if (box) box.set({ pos: clips[sel].pos });
        }));
        var modeNote = L.add(h('p.small.muted', { style: { margin: '-6px 0 14px' } }));
        L.add(labeled('Output size', seg([['1080', '1080×1920 HD'], ['720', '720×1280 · faster']], st.res, function (v) { st.res = v; }, 'Output size')));

        var titleIn = input('text', '', { maxlength: '120', placeholder: 'e.g. Wait for it… 😂', autocomplete: 'off' });
        titleIn.addEventListener('input', function () { clips[sel].title = titleIn.value; renderClips(true); });
        var titleSec = h('div.sv-sec', null, [h('h4', { text: 'Title text (optional)' }),
          field('Title for the selected clip', titleIn, 'Shown at the top. Hindi, Bengali and emoji work.'),
          h('div.sv-2', null, [
            labeled('Size', seg([['s', 'S'], ['m', 'M'], ['l', 'L']], st.titleSize, function (v) { st.titleSize = v; }, 'Title size')),
            field('Colour', (function () { var c = input('color', st.titleColor); c.addEventListener('input', function () { st.titleColor = c.value; }); return c; })())
          ]),
          btn('btn-sm', 'copy', 'Use this title for all clips', function () { clips.forEach(function (c) { c.title = titleIn.value; }); renderClips(); BT.toast('Title applied to all clips'); })
        ]);
        L.add(titleSec);
        var capInfo = h('p.small.muted', { style: { margin: '6px 0 0' }, text: 'No captions loaded.' });
        var capClear = btn('btn-sm btn-ghost', 'x', 'Remove', function () { st.cues = []; st.capName = ''; updCaps(); });
        var capBtn = fileButton('Import SRT / VTT', 'captions', SUB_ACCEPT, function (f) {
          readTextFile(f).then(function (txt) {
            var cues = parseSubs(txt);
            if (!cues.length) { BT.toast('No captions found in that file', 'error'); return; }
            st.cues = cues; st.capName = f.name; updCaps();
            BT.toast(cues.length + ' captions loaded');
          }).catch(function () { BT.toast('Could not read that file', 'error'); });
        });
        function updCaps() {
          capInfo.textContent = st.cues.length ? st.cues.length + ' captions from ' + st.capName + '. Only the lines inside each clip are used.' : 'No captions loaded.';
          capClear.classList.toggle('hidden', !st.cues.length);
        }
        updCaps();
        L.add(h('div.sv-sec', null, [h('h4', { text: 'Captions (optional)' }),
          h('p.small.muted', { style: { marginTop: '0' }, html: 'Import captions timed to this video (make them with the ' + toolLink('subtitle-maker', 'Subtitle Maker') + ').' }),
          h('div.sv-tbar', null, [capBtn, capClear]), capInfo,
          h('div', { style: { marginTop: '10px' } }, [labeled('Caption size', seg([['s', 'S'], ['m', 'M'], ['l', 'L']], st.capSize, function (v) { st.capSize = v; }, 'Caption size'))])
        ]));
        var goBtn = btn('btn-primary btn-lg', 'smartphone', 'Create shorts', run);
        L.actions.appendChild(goBtn);

        function updMode() {
          posField.classList.toggle('hidden', st.mode !== 'manual');
          modeNote.textContent = {
            crop: 'Keeps the middle of the picture.',
            manual: pv.frame ? 'Drag the bright box on the preview (or use the slider / arrow keys) to choose what stays in frame. Each clip keeps its own position.' : 'Use the slider to choose what stays in frame.',
            face: 'Detects faces on your device and pans smoothly to follow the main speaker. If no face is found, the clip is centre-cropped.',
            blur: 'Shows the whole picture with a blurred copy filling the top and bottom.'
          }[st.mode];
          if (box) box.set({ visible: st.mode !== 'blur', draggable: st.mode === 'manual', pos: st.mode === 'manual' ? clips[sel].pos : 0.5 });
        }

        function renderClips(light) {
          if (light) {
            BT.$$('.sv-item', listEl).forEach(function (row, i) {
              var c = clips[i]; if (!c) return;
              BT.$('.sv-t', row).textContent = 'Clip ' + (i + 1) + ' · ' + fmtTime(c.s) + ' – ' + fmtTime(c.e);
              BT.$('.sv-d', row).textContent = fmtDur(c.e - c.s) + (c.title ? ' · “' + c.title + '”' : '');
            });
            T.dr.marks(clips.map(function (c) { return [c.s, c.e]; }));
            return;
          }
          listEl.innerHTML = '';
          clips.forEach(function (c, i) {
            var row = h('div.sv-item' + (i === sel ? '.sv-sel' : ''), null, [
              h('div.sv-grow', null, [h('div.sv-t'), h('div.sv-d.muted.small')]),
              h('div.sv-btns', null, [
                btn('btn-sm' + (i === sel ? ' btn-primary' : ''), 'pencil', i === sel ? 'Editing' : 'Edit', function () { selectClip(i); }, { 'aria-pressed': String(i === sel) }),
                vid ? iconBtn('monitor-play', 'Preview clip ' + (i + 1), function () { selectClip(i); vid.currentTime = c.s; vid.play().catch(noop); }) : null,
                clips.length > 1 ? iconBtn('trash-2', 'Remove clip ' + (i + 1), function () { clips.splice(i, 1); selectClip(Math.min(sel, clips.length - 1)); }) : null
              ])
            ]);
            listEl.appendChild(row);
          });
          renderClips(true);
          goBtn.querySelector('span').textContent = clips.length > 1 ? 'Create ' + clips.length + ' shorts' : 'Create short';
        }
        function selectClip(i) {
          sel = clamp(i, 0, clips.length - 1);
          var c = clips[sel];
          T.set(c.s, c.e, true);
          var g = T.get(); c.s = g[0]; c.e = g[1];
          titleIn.value = c.title || '';
          posField.setValue(Math.round(c.pos * 100));
          if (box && st.mode === 'manual') box.set({ pos: c.pos });
          if (vid) { try { vid.currentTime = c.s; } catch (e) { /* ignore */ } }
          renderClips();
        }
        function addClip() {
          var m = maxLen() || 30;
          var start = vid ? vid.currentTime : (clips.length ? clips[clips.length - 1].e : 0);
          if (start >= D - 1) start = 0;
          var len = Math.min(m, 30, D - start);
          clips.push(newClip(start, start + len));
          selectClip(clips.length - 1);
          BT.toast('Clip ' + clips.length + ' added — adjust its start and end');
        }

        function suggest() {
          var count = +hiCount.value, len = Math.min(+hiLen.value, D), useScene = hiScene.input.checked && !!vid;
          var m = maxLen();
          if (m && len > m) { len = m; }
          hiOut.innerHTML = '';
          hiBtn.disabled = true; goBtn.disabled = true;
          var ui = progressCard();
          hiOut.appendChild(ui.el);
          var WIN = 0.5, rate = D > 1200 ? 8000 : 16000, loud = null;
          job(S, ui, function (J) {
            return J.input(file, extOf(file.name) || 'mp4').then(function (inp) {
              if (meta.viaEngine === true && !meta.hasAudio) return null;
              var o = J.out('raw');
              return J.exec(['-i', inp, '-map', '0:a:0', '-vn', '-sn', '-ac', '1', '-ar', String(rate), '-f', 's16le', o],
                { dur: D, label: 'Listening to the audio…', sub: 'Measuring loudness across the video.', from: 0, to: useScene ? 0.5 : 1 }).then(function (code) {
                if (code !== 0) return null;
                return J.read(o).then(function (d) { return new Int16Array(d.buffer, d.byteOffset, Math.floor(d.byteLength / 2)); });
              });
            });
          }).then(function (pcm) {
            if (pcm && pcm.length > rate) loud = loudness(pcm, rate, WIN);
            if (!useScene) return null;
            ui.stage('Looking for scene changes…', 'Sampling frames from the video.', 0.5);
            return sceneScores(S.url(file), D, WIN, S, function (f) { ui.set(0.5 + f * 0.5); });
          }).then(function (scene) {
            ui.remove();
            hiBtn.disabled = false; goBtn.disabled = false;
            if (S.dead) return;
            if (!loud && !scene) { errorBox(hiOut, new Error('This video has no audio to analyse. Choose clips by hand instead' + (vid ? ', or tick “visual changes”.' : '.'))); return; }
            var picks = pickHighlights(loud, scene, WIN, D, len, count);
            if (!picks.length) { errorBox(hiOut, new Error('No highlights found. Try a shorter clip length.')); return; }
            clips = picks.map(function (p) { return newClip(p.s, p.e); });
            sel = 0;
            selectClip(0);
            hiOut.appendChild(notice('ok', esc(picks.length + ' suggested clip' + (picks.length > 1 ? 's' : '') + ' added to the list' + (picks.length < count ? ' (the video is too short for more without overlapping)' : '') + '. Play each one and adjust the start and end if needed.')));
          }).catch(function (e) { ui.remove(); hiBtn.disabled = false; goBtn.disabled = false; errorBox(hiOut, e); });
        }

        function run() {
          var m = maxLen();
          var bad = clips.filter(function (c) { return c.e - c.s < 1; });
          if (bad.length) { BT.toast('Each clip must be at least 1 second long', 'error'); return; }
          if (m && clips.some(function (c) { return c.e - c.s > m + 0.05; })) { BT.toast('A clip is longer than ' + m + ' s — shorten it or choose another length', 'error'); return; }
          var W = st.res === '1080' ? 1080 : 720, H = st.res === '1080' ? 1920 : 1280;
          goBtn.disabled = true; hiBtn.disabled = true;
          L.out.innerHTML = '';
          var ui = progressCard();
          L.out.appendChild(ui.el);
          scrollTo(ui.el);
          var results = [], notes = [];
          var list = clips.map(function (c) { return Object.assign({}, c); });
          var total = list.reduce(function (a, c) { return a + (c.e - c.s); }, 0);
          job(S, ui, function (J) {
            needH264();
            return J.input(file, extOf(file.name) || 'mp4').then(function (inp) {
              return J.probe(inp).then(function (pm) {
                if (!pm.width) { pm.width = meta.width; pm.height = meta.height; }
                var done = 0;
                return list.reduce(function (p, c, i) {
                  return p.then(function () {
                    var len = c.e - c.s, from = done / total, to = (done + len) / total;
                    var tag = list.length > 1 ? ' (' + (i + 1) + ' of ' + list.length + ')' : '';
                    var path = null, pos = st.mode === 'manual' ? c.pos : 0.5;
                    var q = Promise.resolve();
                    if (st.mode === 'face') {
                      var mid = from + (to - from) * 0.3;
                      q = trackFaces(J, inp, pm, c.s, len, from, mid).then(function (r) {
                        if (r.path) { path = r.path; notes.push('Clip ' + (i + 1) + ': following faces (found in ' + Math.round(r.ratio * 100) + '% of frames).'); }
                        else notes.push('Clip ' + (i + 1) + ': no clear face found, so it was centre-cropped.');
                        from = mid;
                      }, function (e) {
                        if (isCancel(e) || (e && e.crash)) throw e;
                        console.warn(e);
                        notes.push('Clip ' + (i + 1) + ': face tracking was not available here, so it was centre-cropped.');
                        from = mid;
                      });
                    }
                    return q.then(function () {
                      var cues = st.cues.filter(function (q2) { return q2.end > c.s && q2.start < c.e; })
                        .map(function (q2) { return { start: q2.start - c.s, end: q2.end - c.s, text: q2.text }; });
                      return encodeReframed(J, inp, pm, {
                        s: c.s, len: len, W: W, H: H, mode: st.mode === 'blur' ? 'blur' : 'crop', pos: pos, path: path,
                        title: c.title, titleStyle: { font: 'sans', weight: 800, size: Math.round(W * TITLE_SIZES[st.titleSize]), color: st.titleColor, stroke: '#000000', strokeW: Math.round(W * 0.006), shadow: true },
                        cues: cues, capStyle: { font: 'sans', weight: 800, size: Math.round(W * CAP_SIZES[st.capSize]), color: '#ffffff', stroke: '#000000', strokeW: Math.round(W * 0.005), box: false, shadow: true },
                        capAnchor: 'bottom', capBottom: 0.78,
                        speed: st.res === '1080' ? 'veryfast' : 'superfast',
                        label: 'Creating short' + tag + '…', sub: 'Keep this tab open. Each minute of HD video can take a few minutes on a laptop.', from: from, to: to
                      });
                    }).then(function (data) {
                      done += len;
                      results.push({ blob: new Blob([data], { type: 'video/mp4' }), name: BT.baseName(file.name) + '-short-' + (i + 1) + '.mp4', len: len, c: c });
                    });
                  });
                }, Promise.resolve());
              });
            });
          }).then(function () {
            ui.remove();
            goBtn.disabled = false; hiBtn.disabled = false;
            var grid = h('div.sv-results');
            results.forEach(function (r) { grid.appendChild(resultTile(S, r.blob, r.name, fmtDur(r.len) + ' · ' + W + '×' + H + ' · ' + BT.fmtBytes(r.blob.size))); });
            var extra = results.length > 1 ? [btn('btn-primary btn-lg', 'file-archive', 'Download all (ZIP)', function (e) {
              var b = e.currentTarget;
              BT.busy(b, function () { return BT.downloadZip(results.map(function (r) { return { name: r.name, data: r.blob }; }), BT.baseName(file.name) + '-shorts.zip'); }, 'Zipping…');
            })] : [btn('btn-primary btn-lg', 'download', 'Download MP4', function () { BT.download(results[0].blob, results[0].name); })];
            var card = h('div.card.sv-result', null, [
              h('div.card-title', null, [h('h3', { html: BT.icon('check') + '<span>' + esc(results.length > 1 ? results.length + ' shorts ready' : 'Your short is ready') + '</span>' })]),
              notes.length ? notice('', esc(notes.join(' '))) : null,
              h('div', { style: { marginTop: '14px' } }, [grid]),
              h('div.sv-actions', null, extra.concat([btn('btn-lg', 'rotate-ccw', 'Start over', reset)])),
              h('p.small.muted', { style: { marginTop: '12px' }, text: 'Vertical 9:16 MP4 (H.264 + AAC). Upload from the YouTube or Instagram app, and check the app’s current length limit.' })
            ]);
            L.out.appendChild(card);
            scrollTo(card);
          }).catch(function (e) { ui.remove(); goBtn.disabled = false; hiBtn.disabled = false; errorBox(L.out, e); });
        }

        updMode();
        renderClips();
      });
  });

  // ============================================== 2. VIDEO ASPECT CONVERTER
  var ASPECTS = [
    { v: '9:16', t: '9:16 Vertical', s: 'Shorts, Reels, Status', w: 9, h: 16 },
    { v: '1:1', t: '1:1 Square', s: 'Instagram & Facebook feed', w: 1, h: 1 },
    { v: '4:5', t: '4:5 Portrait', s: 'Instagram & Facebook feed', w: 4, h: 5 },
    { v: '16:9', t: '16:9 Landscape', s: 'YouTube, Facebook', w: 16, h: 9 },
    { v: '4:3', t: '4:3 Classic', s: 'Older TVs, presentations', w: 4, h: 3 }
  ];
  function aspectDims(a, short) {
    if (a.w >= a.h) return { W: even(short * a.w / a.h), H: short };
    return { W: short, H: even(short * a.h / a.w) };
  }

  register('video-aspect-converter', function (root) {
    fileTool(root, { title: 'Choose a video to resize', hint: 'MP4, MOV, WebM or MKV — or drag and drop it here', needVideo: true },
      function (host, file, meta, S, reset) {
        var D = meta.duration;
        var L = editorLayout(host, 'Resize for social media');
        var pv = framedPreview(file, meta, S);
        L.left.appendChild(pv.el);
        var st = { aspect: meta.width > meta.height ? '9:16' : '16:9', mode: 'crop', pos: 0.5, color: '#000000', res: '1080' };
        function A() { return ASPECTS.filter(function (x) { return x.v === st.aspect; })[0]; }
        var box = pv.frame ? cropBox(pv.frame, meta.width, meta.height, function (p) { st.pos = p; posField.setValue(Math.round(p * 100)); }) : null;
        L.add(labeled('Target shape', optCards(ASPECTS, st.aspect, function (v) { st.aspect = v; upd(); }, 'Target aspect ratio')));
        L.add(labeled('How to fit', seg([['crop', 'Crop'], ['bars', 'Fit with bars'], ['blur', 'Blur fill']], st.mode, function (v) { st.mode = v; upd(); }, 'Fit mode')));
        var posField = L.add(range('Crop position', 0, 100, 1, 50, function (v) { return v + '%'; }, function (v) { st.pos = v / 100; if (box) box.set({ pos: st.pos }); }));
        var colIn = input('color', st.color);
        colIn.addEventListener('input', function () { st.color = colIn.value; });
        var colField = L.add(field('Bar colour', colIn));
        L.add(labeled('Resolution', seg([['1080', '1080p'], ['720', '720p'], ['480', '480p']], st.res, function (v) { st.res = v; upd(); }, 'Resolution')));
        var info = L.add(h('p.small.muted', { style: { margin: '0' }, 'aria-live': 'polite' }));
        var goBtn = btn('btn-primary btn-lg', 'ratio', 'Resize video', run);
        L.actions.appendChild(goBtn);
        function upd() {
          var a = A(), d = aspectDims(a, +st.res);
          posField.classList.toggle('hidden', st.mode !== 'crop');
          colField.classList.toggle('hidden', st.mode !== 'bars');
          if (box) box.set({ W: a.w, H: a.h, visible: st.mode === 'crop', draggable: true, pos: st.pos });
          var same = Math.abs(meta.width / meta.height - a.w / a.h) < 0.01;
          info.textContent = 'Output: ' + d.W + '×' + d.H + ' MP4 (H.264 + AAC).' + (same ? ' Your video already has this shape, so it will only be resized.' : st.mode === 'crop' ? ' Drag the box on the preview to choose what stays in frame.' : '');
        }
        upd();
        function run() {
          var a = A(), d = aspectDims(a, +st.res);
          goBtn.disabled = true;
          L.out.innerHTML = '';
          var ui = progressCard();
          L.out.appendChild(ui.el);
          scrollTo(ui.el);
          job(S, ui, function (J) {
            needH264();
            return J.input(file, extOf(file.name) || 'mp4').then(function (inp) {
              return J.probe(inp).then(function (pm) {
                if (!pm.width) { pm.width = meta.width; pm.height = meta.height; }
                return encodeReframed(J, inp, pm, { s: 0, len: pm.duration || D, W: d.W, H: d.H, mode: st.mode, pos: st.pos, color: st.color,
                  label: 'Resizing to ' + a.v + '…', sub: 'Keep this tab open. Long videos can take several minutes.' });
              });
            });
          }).then(function (data) {
            ui.remove(); goBtn.disabled = false;
            var blob = new Blob([data], { type: 'video/mp4' });
            L.out.appendChild(resultCard({ S: S, blob: blob, name: BT.baseName(file.name) + '-' + a.v.replace(':', 'x') + '.mp4', kind: 'video', title: 'Video resized to ' + a.v,
              stats: [['Size', d.W + ' × ' + d.H], ['Shape', a.v], ['File', BT.fmtBytes(blob.size)]], onReset: reset, resetLabel: 'Resize another' }));
            scrollTo(L.out.lastChild);
          }).catch(function (e) { ui.remove(); goBtn.disabled = false; errorBox(L.out, e); });
        }
      });
  });

  // ================================================== 7. VIDEO SPEED CHANGER
  /** atempo accepts 0.5–2 per stage, so chain stages for wider factors. */
  function atempoChain(sp) {
    var st = [];
    while (sp > 2.0001) { st.push(2); sp /= 2; }
    while (sp < 0.4999) { st.push(0.5); sp /= 0.5; }
    st.push(sp);
    return st.map(function (x) { return 'atempo=' + (+x.toFixed(5)); }).join(',');
  }

  register('video-speed-changer', function (root) {
    fileTool(root, { title: 'Choose a video', hint: 'MP4, MOV, WebM or MKV — or drag and drop it here', needVideo: true },
      function (host, file, meta, S, reset) {
        var D = meta.duration;
        var L = editorLayout(host, 'Speed');
        var pv = previewStage(file, meta, S);
        L.left.appendChild(pv.el);
        var st = { speed: 2, mute: false };
        var presets = seg([[0.5, '0.5×'], [0.75, '0.75×'], [1.25, '1.25×'], [1.5, '1.5×'], [2, '2×']], st.speed, function (v) { st.speed = v; sl.setValue(v); upd(); }, 'Speed presets');
        L.add(labeled('Quick choice', presets));
        var sl = L.add(range('Speed', 0.25, 4, 0.05, st.speed, function (v) { return v.toFixed(2) + '×'; }, function (v) { st.speed = v; presets.set(v); upd(); }));
        L.add(h('div.field', null, [checkbox('Remove audio (mute)', false, function (v) { st.mute = v; })]));
        var info = L.add(h('p.small.muted', { style: { margin: '0' }, 'aria-live': 'polite' }));
        var goBtn = btn('btn-primary btn-lg', 'gauge', 'Change speed', run);
        L.actions.appendChild(goBtn);
        function upd() {
          info.textContent = 'New length: ' + fmtDur(D / st.speed) + ' (from ' + fmtDur(D) + '). ' + (st.speed < 1 ? 'Slow motion: frames are repeated, so very slow speeds look steppy.' : 'Audio pitch stays natural.');
          if (pv.video) { try { pv.video.playbackRate = clamp(st.speed, 0.25, 4); } catch (e) { /* ignore */ } }
        }
        upd();
        function run() {
          var sp = st.speed;
          if (Math.abs(sp - 1) < 0.001) { BT.toast('Choose a speed other than 1×', 'error'); return; }
          goBtn.disabled = true;
          L.out.innerHTML = '';
          var ui = progressCard();
          L.out.appendChild(ui.el);
          scrollTo(ui.el);
          var outDur = D / sp;
          job(S, ui, function (J) {
            needH264();
            return J.input(file, extOf(file.name) || 'mp4').then(function (inp) {
              return J.probe(inp).then(function (pm) {
                var fps = pm.fps && pm.fps <= 60 ? Math.min(pm.fps, 30 * Math.max(1, Math.round(pm.fps / 30))) : 30;
                if (sp > 1 && fps > 30) fps = 30;
                var o = J.out('mp4');
                var fc = '[0:v]setpts=PTS/' + sp + ',fps=' + (+fps.toFixed(3)) + ',format=yuv420p[v]';
                var audio = pm.hasAudio && !st.mute;
                if (audio) fc += ';[0:a]' + atempoChain(sp) + '[a]';
                var args = ['-i', inp, '-filter_complex', fc, '-map', '[v]'];
                if (audio) args.push('-map', '[a]');
                args = args.concat(h264Args('veryfast'), audio ? AAC : ['-an'], FASTSTART, [o]);
                return J.run(args, { dur: outDur, label: 'Changing speed to ' + sp + '×…', sub: 'Keep this tab open.' }).then(function () { return J.read(o); });
              });
            });
          }).then(function (data) {
            ui.remove(); goBtn.disabled = false;
            var blob = new Blob([data], { type: 'video/mp4' });
            L.out.appendChild(resultCard({ S: S, blob: blob, name: BT.baseName(file.name) + '-' + String(sp).replace('.', '_') + 'x.mp4', kind: 'video', title: 'Speed changed to ' + sp + '×',
              stats: [['New length', fmtDur(outDur)], ['Speed', sp + '×'], ['File', BT.fmtBytes(blob.size)]], onReset: reset, resetLabel: 'Change another' }));
            scrollTo(L.out.lastChild);
          }).catch(function (e) { ui.remove(); goBtn.disabled = false; errorBox(L.out, e); });
        }
      });
  });

  // ================================================== 8. ADD MUSIC TO VIDEO
  register('add-music-to-video', function (root) {
    fileTool(root, { title: 'Choose your video', hint: 'MP4, MOV, WebM or MKV — then add a music file', needVideo: true },
      function (host, file, meta, S, reset) {
        var D = meta.duration;
        var L = editorLayout(host, 'Music');
        var pv = previewStage(file, meta, S);
        L.left.appendChild(pv.el);
        var st = { music: null, mdur: 0, mode: 'mix', ov: 100, mv: 60, fin: 1, fout: 2, loop: true, offset: 0, delay: 0 };
        var mInfo = h('div.small.muted', { text: 'No music chosen yet.' });
        var mPlayer = h('div');
        var mBtn = fileButton('Choose music file', 'music', AUDIO_ACCEPT, function (f) {
          probeElement(f, 'audio').then(function (m) {
            st.music = f; st.mdur = m && m.duration || 0;
            mInfo.textContent = f.name + ' · ' + (st.mdur ? fmtDur(st.mdur) : 'length unknown') + ' · ' + BT.fmtBytes(f.size);
            mPlayer.innerHTML = '';
            if (m) mPlayer.appendChild(mediaEl('audio', S.url(f), 'Music preview'));
            setBtnText(mBtn.button, 'music', 'Change music');
            upd();
          });
        }, 'btn-primary');
        L.add(h('div.field', null, [h('span.label', { text: 'Music (MP3, M4A, WAV, AAC or OGG)' }), h('div', null, [mBtn]), mInfo, mPlayer]));
        L.add(h('p.small.muted', { style: { margin: '0 0 14px' }, text: 'Use music you have the rights to. YouTube and Instagram may mute or block videos with copyrighted songs.' }));
        L.add(labeled('Audio', seg([['mix', 'Mix with original'], ['replace', 'Replace original']], st.mode, function (v) { st.mode = v; upd(); }, 'Audio mode')));
        var ovF = L.add(range('Original sound volume', 0, 200, 5, st.ov, function (v) { return v + '%'; }, function (v) { st.ov = v; }));
        L.add(range('Music volume', 0, 200, 5, st.mv, function (v) { return v + '%'; }, function (v) { st.mv = v; }));
        L.add(h('div.sv-2', null, [
          stepper('Fade in (s)', st.fin, 0, 15, 0.5, function (v) { st.fin = v; }),
          stepper('Fade out (s)', st.fout, 0, 15, 0.5, function (v) { st.fout = v; })
        ]));
        L.add(h('div.sv-2', null, [
          stepper('Skip start of music (s)', st.offset, 0, 3600, 0.5, function (v) { st.offset = v; upd(); }),
          stepper('Music starts at (s)', st.delay, 0, Math.floor(D), 0.5, function (v) { st.delay = v; upd(); })
        ]));
        var loopCb = L.add(h('div.field', null, [checkbox('Loop music to the end of the video', st.loop, function (v) { st.loop = v; upd(); })]));
        var info = L.add(h('p.small.muted', { style: { margin: '0' }, 'aria-live': 'polite' }));
        var goBtn = btn('btn-primary btn-lg', 'music', 'Add music', run);
        L.actions.appendChild(goBtn);
        function upd() {
          ovF.classList.toggle('hidden', st.mode !== 'mix');
          var avail = st.mdur ? st.mdur - st.offset : 0, need = D - st.delay;
          loopCb.classList.toggle('hidden', !!st.mdur && avail >= need);
          var t = 'The video keeps its length (' + fmtDur(D) + ').';
          if (st.mdur && avail < need) t += st.loop ? ' The music repeats to fill the video.' : ' The music ends early; the rest is ' + (st.mode === 'mix' ? 'original sound only.' : 'silent.');
          if (st.mdur && avail > need) t += ' Extra music is cut off at the end.';
          info.textContent = t;
          goBtn.disabled = !st.music;
        }
        upd();
        function run() {
          if (!st.music) { BT.toast('Choose a music file first', 'error'); return; }
          goBtn.disabled = true;
          L.out.innerHTML = '';
          var ui = progressCard();
          L.out.appendChild(ui.el);
          scrollTo(ui.el);
          var copied = false;
          job(S, ui, function (J) {
            return J.input(file, extOf(file.name) || 'mp4').then(function (inp) {
              return J.input(st.music, extOf(st.music.name) || 'mp3').then(function (mus) {
                return J.probe(inp).then(function (pm) {
                  var dur = pm.duration || D;
                  var args = ['-i', inp];
                  if (st.loop) args.push('-stream_loop', '-1');
                  if (st.offset > 0) args.push('-ss', st.offset.toFixed(3));
                  args.push('-i', mus);
                  var m = '[1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=' + (st.mv / 100).toFixed(2);
                  if (st.fin > 0) m += ',afade=t=in:st=0:d=' + st.fin;
                  if (st.delay > 0) { var ms = Math.round(st.delay * 1000); m += ',adelay=' + ms + '|' + ms; }
                  m += ',apad,atrim=0:' + dur.toFixed(3);
                  if (st.fout > 0) m += ',afade=t=out:st=' + Math.max(0, dur - st.fout).toFixed(3) + ':d=' + st.fout;
                  var fc = m + '[m]';
                  var mix = st.mode === 'mix' && pm.hasAudio;
                  if (mix) fc += ';[0:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=' + (st.ov / 100).toFixed(2) + ',apad,atrim=0:' + dur.toFixed(3) + '[o];[o][m]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]';
                  var o = J.out('mp4');
                  args.push('-filter_complex', fc, '-map', '0:v:0', '-map', mix ? '[a]' : '[m]');
                  copied = /^(h264|hevc)$/.test(pm.vcodec);
                  if (copied) args.push('-c:v', 'copy'); else { needH264(); args = args.concat(h264Args('veryfast')); }
                  args.push('-c:a', 'aac', '-b:a', '192k', '-t', dur.toFixed(3));
                  args = args.concat(FASTSTART, [o]);
                  return J.run(args, { dur: dur, label: 'Adding music…', sub: copied ? 'The picture is copied without re-encoding, so this is quick.' : 'Re-encoding the picture to MP4. Keep this tab open.' })
                    .then(function () { return J.read(o); });
                });
              });
            });
          }).then(function (data) {
            ui.remove(); goBtn.disabled = false;
            var blob = new Blob([data], { type: 'video/mp4' });
            L.out.appendChild(resultCard({ S: S, blob: blob, name: BT.baseName(file.name) + '-with-music.mp4', kind: 'video', title: 'Music added',
              stats: [['Length', fmtDur(D)], ['Audio', st.mode === 'mix' && meta.hasAudio !== false ? 'Mixed' : 'Music only'], ['File', BT.fmtBytes(blob.size)]],
              note: copied ? { kind: 'ok', html: 'Picture copied without quality loss.' } : null, onReset: reset, resetLabel: 'Start over' }));
            scrollTo(L.out.lastChild);
          }).catch(function (e) { ui.remove(); goBtn.disabled = false; errorBox(L.out, e); });
        }
      });
  });

  // ======================================================== 9. VIDEO MERGER
  var MERGE_SIZES = [
    { v: 'auto', t: 'Match first clip', s: 'Same size as clip 1' },
    { v: '1920x1080', t: '1920×1080', s: '16:9 · YouTube' },
    { v: '1080x1920', t: '1080×1920', s: '9:16 · Shorts, Reels' },
    { v: '1080x1080', t: '1080×1080', s: '1:1 · Square' },
    { v: '1280x720', t: '1280×720', s: '16:9 · smaller, faster' }
  ];
  register('video-merger', function (root) {
    injectCSS();
    var S = null, items = [], seq = 0;
    var st = { size: 'auto', fit: 'bars', fps: '30', fade: false, color: '#000000' };
    function reset() {
      if (S) S.dispose();
      S = newScope();
      items = [];
      root.innerHTML = '';
      root.appendChild(BT.dropzone({ accept: VIDEO_ACCEPT, multiple: true, title: 'Choose two or more videos', hint: 'MP4, MOV, WebM or MKV — select several at once, or drag them here', icon: 'layers', color: BRAND,
        onFiles: function (f) { addFiles(f); } }));
      root.appendChild(privacyNote());
    }
    function addFiles(files) {
      if (!files.length) return;
      var first = !items.length;
      files.forEach(function (f) { items.push({ id: ++seq, file: f, meta: null, loading: true }); });
      if (first) build();
      renderList();
      files.forEach(function (f) {
        var it = items.filter(function (x) { return x.file === f; })[0];
        probeElement(f, 'video').then(function (m) {
          if (!it) return;
          it.meta = m; it.loading = false;
          renderList();
        });
      });
    }
    var listEl, L, goBtn, sumEl;
    function build() {
      root.innerHTML = '';
      L = editorLayout(root, 'Merge settings');
      listEl = h('div.sv-list', { 'aria-label': 'Clips in order' });
      sumEl = h('p.small.muted', { style: { margin: '10px 0 0' } });
      var addBtn = h('span');
      var more = BT.dropzone({ accept: VIDEO_ACCEPT, multiple: true, compact: true, title: 'Add more clips', hint: 'or drag them here', icon: 'plus', color: BRAND, onFiles: addFiles });
      addBtn.appendChild(more);
      L.left.appendChild(h('div.card', null, [
        h('div.card-title', null, [h('h3', { text: 'Clips (in order)' }), btn('btn-ghost btn-sm', 'rotate-ccw', 'Start over', reset)]),
        h('p.small.muted', { style: { marginTop: '0' }, text: 'Drag to reorder, or use the arrow buttons.' }),
        listEl, sumEl, h('div', { style: { marginTop: '12px' } }, [addBtn])
      ]));
      L.add(labeled('Output size', optCards(MERGE_SIZES, st.size, function (v) { st.size = v; }, 'Output size')));
      L.add(labeled('Clips with a different shape', seg([['bars', 'Fit with bars'], ['blur', 'Blur fill'], ['crop', 'Crop to fill']], st.fit, function (v) { st.fit = v; colF.classList.toggle('hidden', v !== 'bars'); }, 'Fit mode')));
      var col = input('color', st.color);
      col.addEventListener('input', function () { st.color = col.value; });
      var colF = L.add(field('Bar colour', col));
      L.add(labeled('Frame rate', seg([['24', '24'], ['25', '25'], ['30', '30'], ['60', '60']], st.fps, function (v) { st.fps = v; }, 'Frame rate')));
      L.add(h('div.field', null, [checkbox('Smooth 0.5 s fade between clips', st.fade, function (v) { st.fade = v; renderList(); })]));
      goBtn = btn('btn-primary btn-lg', 'layers', 'Merge videos', run);
      L.actions.appendChild(goBtn);
      root.appendChild(privacyNote());
    }
    function move(i, d) {
      var j = i + d;
      if (j < 0 || j >= items.length) return;
      var t = items[i]; items[i] = items[j]; items[j] = t;
      renderList();
      var b = BT.$$('.sv-item', listEl)[j];
      if (b) { var f = BT.$(d < 0 ? '.sv-up' : '.sv-down', b) || BT.$('button', b); if (f) f.focus(); }
    }
    var dragId = null;
    function renderList() {
      if (!listEl) return;
      listEl.innerHTML = '';
      var total = 0, unknown = false;
      items.forEach(function (it, i) {
        var m = it.meta;
        if (m && m.duration) total += m.duration; else unknown = true;
        var d = it.loading ? 'Reading…' : m ? fmtDur(m.duration) + (m.width ? ' · ' + m.width + '×' + m.height : '') + ' · ' + BT.fmtBytes(it.file.size) : BT.fmtBytes(it.file.size) + ' · no preview (will still be merged)';
        var row = h('div.sv-item', { draggable: 'true', 'data-id': it.id }, [
          h('span.sv-grip', { html: BT.icon('grip-vertical'), 'aria-hidden': 'true' }),
          h('div.sv-grow', null, [h('div.sv-t', { text: (i + 1) + '. ' + it.file.name, title: it.file.name }), h('div.muted.small', { text: d })]),
          h('div.sv-btns', null, [
            iconBtn('chevron-down', 'Move ' + it.file.name + ' up', function () { move(i, -1); }, 'sv-up'),
            iconBtn('chevron-down', 'Move ' + it.file.name + ' down', function () { move(i, 1); }, 'sv-down'),
            iconBtn('trash-2', 'Remove ' + it.file.name, function () { items.splice(i, 1); if (!items.length) reset(); else renderList(); })
          ])
        ]);
        row.addEventListener('dragstart', function (e) { dragId = it.id; row.classList.add('sv-drag'); try { e.dataTransfer.setData('text/plain', String(it.id)); e.dataTransfer.effectAllowed = 'move'; } catch (x) { /* ignore */ } });
        row.addEventListener('dragend', function () { dragId = null; row.classList.remove('sv-drag'); });
        row.addEventListener('dragover', function (e) { if (dragId == null) return; e.preventDefault(); row.classList.add('sv-over'); });
        row.addEventListener('dragleave', function () { row.classList.remove('sv-over'); });
        row.addEventListener('drop', function (e) {
          if (dragId == null) return;
          e.preventDefault();
          e.stopPropagation();
          var from = -1;
          items.forEach(function (x, k) { if (x.id === dragId) from = k; });
          if (from < 0 || from === i) { renderList(); return; }
          var it2 = items.splice(from, 1)[0];
          items.splice(i, 0, it2);
          renderList();
        });
        listEl.appendChild(row);
      });
      if (st.fade && items.length > 1) total -= (items.length - 1) * 0.5;
      sumEl.textContent = items.length + ' clip' + (items.length === 1 ? '' : 's') + (total ? ' · about ' + fmtDur(total) + ' in total' + (unknown ? ' (some lengths unknown)' : '') : '') + (items.length < 2 ? ' — add at least one more clip.' : '');
      var big = items.reduce(function (a, it) { return a + it.file.size; }, 0);
      if (goBtn) goBtn.disabled = items.length < 2;
      if (big > 500 * 1024 * 1024) sumEl.textContent += ' Large total size (' + BT.fmtBytes(big) + '): this may run out of memory in the browser.';
    }
    function run() {
      if (items.length < 2) { BT.toast('Add at least two clips', 'error'); return; }
      goBtn.disabled = true;
      L.out.innerHTML = '';
      var ui = progressCard();
      L.out.appendChild(ui.el);
      scrollTo(ui.el);
      var list = items.slice(), fade = st.fade, FD = 0.5, outDur = 0, W, H;
      job(S, ui, function (J) {
        needH264();
        var paths = [], pms = [];
        return list.reduce(function (p, it, i) {
          return p.then(function () {
            ui.stage('Reading clip ' + (i + 1) + ' of ' + list.length + '…', '', null);
            return J.input(it.file, extOf(it.file.name) || 'mp4').then(function (inp) {
              paths.push(inp);
              return J.probe(inp);
            }).then(function (pm) {
              if (!pm.hasVideo || !pm.duration) throw new Error('“' + it.file.name + '” could not be read as a video.');
              pms.push(pm);
            });
          });
        }, Promise.resolve()).then(function () {
          if (st.size === 'auto') { W = even(pms[0].width); H = even(pms[0].height); }
          else { var p = st.size.split('x'); W = +p[0]; H = +p[1]; }
          if (fade && pms.some(function (pm) { return pm.duration <= FD * 2 + 0.1; })) fade = false;
          var fps = +st.fps, fc = [], args = [];
          paths.forEach(function (pth) { args.push('-i', pth); });
          pms.forEach(function (pm, i) {
            var d = pm.duration.toFixed(3);
            var mode = st.fit === 'crop' ? 'crop' : st.fit;
            fc.push(reframeChain(i + ':v', 'r' + i, pm.width, pm.height, W, H, mode, { color: st.color }));
            fc.push('[r' + i + ']fps=' + fps + ',format=yuv420p,trim=duration=' + d + ',setpts=PTS-STARTPTS,settb=AVTB[v' + i + ']');
            if (pm.hasAudio) fc.push('[' + i + ':a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,apad,atrim=0:' + d + ',asetpts=PTS-STARTPTS[a' + i + ']');
            else fc.push('aevalsrc=0:c=stereo:s=48000:d=' + d + ',aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[a' + i + ']');
          });
          var n = pms.length;
          if (!fade) {
            fc.push(pms.map(function (_, i) { return '[v' + i + '][a' + i + ']'; }).join('') + 'concat=n=' + n + ':v=1:a=1[vout][aout]');
            outDur = pms.reduce(function (a, pm) { return a + pm.duration; }, 0);
          } else {
            var vcur = 'v0', acur = 'a0', off = 0;
            for (var i = 1; i < n; i++) {
              off += pms[i - 1].duration - FD;
              var vl = i === n - 1 ? 'vout' : 'vx' + i, al = i === n - 1 ? 'aout' : 'ax' + i;
              fc.push('[' + vcur + '][v' + i + ']xfade=transition=fade:duration=' + FD + ':offset=' + off.toFixed(3) + '[' + vl + ']');
              fc.push('[' + acur + '][a' + i + ']acrossfade=d=' + FD + '[' + al + ']');
              vcur = vl; acur = al;
            }
            outDur = off + pms[n - 1].duration;
          }
          var o = J.out('mp4');
          args.push('-filter_complex', fc.join(';'), '-map', '[vout]', '-map', '[aout]');
          args = args.concat(h264Args('veryfast'), AAC, FASTSTART, [o]);
          return J.run(args, { dur: outDur, label: 'Merging ' + n + ' clips…', sub: 'Keep this tab open. This re-encodes every clip to the same size.' }).then(function () { return J.read(o); });
        });
      }).then(function (data) {
        ui.remove(); goBtn.disabled = false;
        var blob = new Blob([data], { type: 'video/mp4' });
        L.out.appendChild(resultCard({ S: S, blob: blob, name: 'merged-video.mp4', kind: 'video', title: 'Videos merged',
          stats: [['Clips', String(list.length)], ['Length', fmtDur(outDur)], ['Size', W + ' × ' + H], ['File', BT.fmtBytes(blob.size)]],
          note: st.fade && !fade ? { kind: 'warn', html: 'Fades were skipped because a clip is shorter than 1.1 seconds.' } : null, onReset: reset, resetLabel: 'Merge other videos' }));
        scrollTo(L.out.lastChild);
      }).catch(function (e) { ui.remove(); goBtn.disabled = false; errorBox(L.out, e); });
    }
    reset();
  });

  // ===================================================== 10. VIDEO WATERMARK
  var WM_POS = [['tl', 'Top left'], ['tc', 'Top centre'], ['tr', 'Top right'], ['ml', 'Middle left'], ['c', 'Centre'], ['mr', 'Middle right'], ['bl', 'Bottom left'], ['bc', 'Bottom centre'], ['br', 'Bottom right']];
  function wmXY(pos, W, H, w, hh, margin) {
    var mx = Math.round(Math.min(W, H) * margin), x, y;
    x = pos[1] === 'l' ? mx : pos[1] === 'r' ? W - w - mx : (W - w) / 2;
    if (pos === 'c') x = (W - w) / 2;
    y = pos[0] === 't' ? mx : pos[0] === 'b' ? H - hh - mx : (H - hh) / 2;
    if (pos === 'ml' || pos === 'mr') y = (H - hh) / 2;
    return { x: Math.round(x), y: Math.round(y) };
  }

  register('video-watermark', function (root) {
    fileTool(root, { title: 'Choose a video to watermark', hint: 'MP4, MOV, WebM or MKV — or drag and drop it here', needVideo: true },
      function (host, file, meta, S, reset) {
        var D = meta.duration, VW = meta.width, VH = meta.height;
        var L = editorLayout(host, 'Watermark');
        var pv = framedPreview(file, meta, S);
        L.left.appendChild(pv.el);
        var st = { logo: null, logoImg: null, text: '', color: '#ffffff', font: 'sans', shadow: true, pos: 'br', margin: 3, size: 18, opacity: 80, whole: true, from: 0, to: D };
        var prevImg = h('img', { alt: '', style: { position: 'absolute', zIndex: '3', pointerEvents: 'none', display: 'none' } });
        if (pv.frame) pv.frame.appendChild(prevImg);
        var lInfo = h('span.small.muted', { text: '' });
        var lBtn = fileButton('Choose logo image', 'image-plus', IMAGE_ACCEPT, function (f) {
          BT.loadImage(f).then(function (img) {
            st.logo = f; st.logoImg = img;
            lInfo.textContent = f.name + ' · ' + img.naturalWidth + '×' + img.naturalHeight;
            lRemove.classList.remove('hidden');
            schedule();
          }).catch(function (e) { BT.toast(e.message, 'error'); });
        });
        var lRemove = btn('btn-sm btn-ghost hidden', 'x', 'Remove logo', function () { st.logo = st.logoImg = null; lInfo.textContent = ''; lRemove.classList.add('hidden'); schedule(); });
        L.add(h('div.field', null, [h('span.label', { text: 'Logo (PNG with transparency works best)' }), h('div.sv-tbar', { style: { marginTop: '0' } }, [lBtn, lRemove]), lInfo]));
        var tIn = input('text', '', { maxlength: '80', placeholder: 'e.g. @YourChannel', autocomplete: 'off' });
        tIn.addEventListener('input', function () { st.text = tIn.value; schedule(); });
        L.add(field('Text', tIn, 'Any language — Hindi, Bengali and emoji are drawn by your browser.'));
        var col = input('color', st.color);
        col.addEventListener('input', function () { st.color = col.value; schedule(); });
        var fSel = select(fontOptions(), st.font);
        fSel.addEventListener('change', function () { st.font = fSel.value; schedule(); });
        L.add(h('div.sv-2', null, [field('Text colour', col), field('Font', fSel)]));
        L.add(h('div.field', null, [checkbox('Soft shadow (readable on any background)', st.shadow, function (v) { st.shadow = v; schedule(); })]));
        var pSel = select(WM_POS, st.pos);
        pSel.addEventListener('change', function () { st.pos = pSel.value; schedule(); });
        L.add(field('Position', pSel));
        L.add(range('Size (width of video)', 4, 60, 1, st.size, function (v) { return v + '%'; }, function (v) { st.size = v; schedule(); }));
        L.add(range('Margin', 0, 15, 0.5, st.margin, function (v) { return v + '%'; }, function (v) { st.margin = v; schedule(); }));
        L.add(range('Opacity', 10, 100, 5, st.opacity, function (v) { return v + '%'; }, function (v) { st.opacity = v; schedule(); }));
        var fromIn = input('text', fmtTime(0), { inputmode: 'decimal', class: 'sv-tin', autocomplete: 'off' });
        var toIn = input('text', fmtTime(D), { inputmode: 'decimal', class: 'sv-tin', autocomplete: 'off' });
        var timeRow = h('div.sv-2.hidden', null, [field('Show from', fromIn), field('Until', toIn)]);
        L.add(h('div.field', null, [checkbox('Show for the whole video', true, function (v) { st.whole = v; timeRow.classList.toggle('hidden', v); })]));
        L.add(timeRow);
        var goBtn = btn('btn-primary btn-lg', 'stamp', 'Add watermark', run);
        L.actions.appendChild(goBtn);

        /** Compose logo + text into one canvas at final pixel size. */
        function compose() {
          var hasT = st.text.trim(), hasL = !!st.logoImg;
          if (!hasT && !hasL) return null;
          var F = 120, gap = F * 0.35, parts = [];
          if (hasL) {
            var lh = hasT ? F * 1.4 : 600, lw = lh * st.logoImg.naturalWidth / st.logoImg.naturalHeight;
            parts.push({ w: lw, h: lh, draw: function (ctx, x, y) { ctx.drawImage(st.logoImg, x, y, lw, lh); } });
          }
          if (hasT) {
            var tc = textCanvas(st.text.trim(), { font: st.font, weight: 800, size: F, color: st.color, shadow: st.shadow, strokeW: 0 }, 4000);
            parts.push({ w: tc.width, h: tc.height, draw: function (ctx, x, y) { ctx.drawImage(tc, x, y); } });
          }
          var tw = parts.reduce(function (a, p) { return a + p.w; }, 0) + gap * (parts.length - 1);
          var th = Math.max.apply(null, parts.map(function (p) { return p.h; }));
          var targetW = Math.max(16, Math.round(VW * st.size / 100));
          var sc = targetW / tw;
          if (th * sc > VH * 0.8) sc = VH * 0.8 / th;
          var c = mkCanvas(Math.max(2, even(tw * sc)), Math.max(2, even(th * sc))), ctx = c.getContext('2d');
          ctx.imageSmoothingQuality = 'high';
          ctx.scale(c.width / tw, c.height / th);
          var x = 0;
          parts.forEach(function (p) { p.draw(ctx, x, (th - p.h) / 2); x += p.w + gap; });
          return c;
        }
        var raf = 0, prevUrl = null;
        function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(paint); }
        S.on(function () { cancelAnimationFrame(raf); if (prevUrl) URL.revokeObjectURL(prevUrl); });
        function paint() {
          var c = compose();
          goBtn.disabled = !c;
          if (!pv.frame) return;
          if (!c) { prevImg.style.display = 'none'; return; }
          var p = wmXY(st.pos, VW, VH, c.width, c.height, st.margin / 100);
          prevImg.src = c.toDataURL('image/png');
          Object.assign(prevImg.style, { display: 'block', left: (p.x / VW * 100) + '%', top: (p.y / VH * 100) + '%', width: (c.width / VW * 100) + '%', opacity: String(st.opacity / 100) });
        }
        schedule();

        function run() {
          var c = compose();
          if (!c) { BT.toast('Add a logo or some text first', 'error'); return; }
          var a = 0, b = D;
          if (!st.whole) {
            a = parseTime(fromIn.value); b = parseTime(toIn.value);
            if (!isFinite(a) || !isFinite(b) || b <= a) { BT.toast('Check the show-from and until times', 'error'); return; }
          }
          goBtn.disabled = true;
          L.out.innerHTML = '';
          var ui = progressCard();
          L.out.appendChild(ui.el);
          scrollTo(ui.el);
          job(S, ui, function (J) {
            needH264();
            return J.input(file, extOf(file.name) || 'mp4').then(function (inp) {
              return J.probe(inp).then(function (pm) {
                var W = pm.width || VW, H = pm.height || VH, cc = c;
                if (W !== VW || H !== VH) { VW = W; VH = H; cc = compose(); }
                var p = wmXY(st.pos, W, H, cc.width, cc.height, st.margin / 100);
                return canvasPNG(cc).then(function (png) { return J.write('png', png); }).then(function (png) {
                  var o = J.out('mp4');
                  var en = st.whole ? '' : ':enable=\'between(t,' + a.toFixed(2) + ',' + b.toFixed(2) + ')\'';
                  var fc = '[1:v]format=rgba,colorchannelmixer=aa=' + (st.opacity / 100).toFixed(2) + '[wm];[0:v][wm]overlay=' + p.x + ':' + p.y + en + ',format=yuv420p[v]';
                  var args = ['-i', inp, '-i', png, '-filter_complex', fc, '-map', '[v]', '-map', '0:a:0?'];
                  args = args.concat(h264Args('veryfast'), /^(aac|mp3)$/.test(pm.acodec) ? ['-c:a', 'copy'] : AAC, FASTSTART, [o]);
                  return J.run(args, { dur: pm.duration || D, label: 'Adding watermark…', sub: 'Keep this tab open.' }).then(function () { return J.read(o); });
                });
              });
            });
          }).then(function (data) {
            ui.remove(); goBtn.disabled = false;
            var blob = new Blob([data], { type: 'video/mp4' });
            L.out.appendChild(resultCard({ S: S, blob: blob, name: BT.baseName(file.name) + '-watermarked.mp4', kind: 'video', title: 'Watermark added',
              stats: [['Length', fmtDur(D)], ['Position', WM_POS.filter(function (x) { return x[0] === st.pos; })[0][1]], ['File', BT.fmtBytes(blob.size)]], onReset: reset, resetLabel: 'Watermark another' }));
            scrollTo(L.out.lastChild);
          }).catch(function (e) { ui.remove(); goBtn.disabled = false; errorBox(L.out, e); });
        }
      });
  });

  // ================================================ 11. SOCIAL VIDEO CHECKER
  function checkVideo(m, file) {
    var W = m.width, H = m.height, D = m.duration, size = file.size, ext = extOf(file.name);
    var r = W && H ? W / H : 0, short = Math.min(W, H), MB = 1048576;
    var vertical = r && r < 0.95, square = r && Math.abs(r - 1) < 0.05, is916 = r && Math.abs(r - 9 / 16) < 0.02, is169 = r && Math.abs(r - 16 / 9) < 0.02, is45 = r && Math.abs(r - 0.8) < 0.02;
    var known = !!m.vcodec;
    var fix = {
      shorts: toolLink('shorts-maker', 'Make a vertical short'),
      aspect: function (t) { return toolLink('video-aspect-converter', t || 'Resize the video'); },
      compress: toolLink('video-compressor', 'Compress it'),
      trim: toolLink('video-trimmer', 'Trim it'),
      convert: toolLink('video-converter', 'Convert to MP4')
    };
    function row(label, value, status, note, fixHtml) { return { label: label, value: value, status: status, note: note || '', fix: fixHtml || '' }; }
    var res = W ? W + '×' + H : 'Unknown';
    var codecRow = known
      ? (/^(h264|hevc|vp9|av1)$/.test(m.vcodec) ? row('Video codec', m.vcodec.toUpperCase(), 'pass', m.vcodec === 'h264' ? 'H.264 is the most compatible choice.' : 'Supported. H.264 is the most compatible choice.')
        : row('Video codec', m.vcodec, 'warn', 'Less common codec — converting to H.264 MP4 is safest.', fix.convert))
      : row('Video codec', 'Not checked yet', 'info', 'Press “Check codecs and bitrate” above.');
    var audioRow = known ? (m.hasAudio ? (/^(aac|mp3|opus)$/.test(m.acodec) ? row('Audio', m.acodec.toUpperCase() + (m.arate ? ' · ' + m.arate / 1000 + ' kHz' : ''), 'pass', 'AAC is recommended.')
      : row('Audio', m.acodec, 'warn', 'Converting audio to AAC is safest.', fix.convert)) : row('Audio', 'No audio track', 'info', 'Fine if intended (silent video).')) : null;
    var fpsRow = m.fps ? row('Frame rate', (Math.round(m.fps * 100) / 100) + ' fps', m.fps <= 60.5 ? 'pass' : 'warn', m.fps <= 60.5 ? 'Common rates are 24, 25, 30 and 60.' : 'Above 60 fps — platforms may convert it.') : null;
    var containerOk = /^(mp4|mov|m4v|webm|mkv|avi|wmv|flv|3gp|mpg|mpeg)$/.test(ext);
    var P = [];
    P.push({ name: 'YouTube (regular video)', icon: 'tv-minimal-play', rows: [
      row('File type', (ext || '?').toUpperCase(), ext === 'mp4' || ext === 'mov' ? 'pass' : containerOk ? 'pass' : 'warn', ext === 'mp4' ? 'MP4 is recommended.' : containerOk ? 'Accepted. MP4 is recommended.' : 'May not be accepted.', ext === 'mp4' ? '' : fix.convert),
      codecRow, audioRow,
      row('Shape', ratioLabel(W, H), is169 ? 'pass' : 'info', is169 ? '16:9 fills the player.' : vertical ? 'Vertical videos up to 3 minutes may be treated as Shorts. Black bars appear on computers.' : 'Accepted; YouTube adds black bars. 16:9 is recommended.', is169 || vertical ? '' : fix.aspect('Convert to 16:9')),
      row('Resolution', res, short >= 1080 ? 'pass' : short >= 720 ? 'pass' : 'warn', short >= 1080 ? 'Full HD or better.' : short >= 720 ? 'HD. 1920×1080 is recommended.' : 'Low resolution — will look soft on large screens.'),
      fpsRow,
      row('Length and size', fmtDur(D) + ' · ' + BT.fmtBytes(size), 'pass', 'YouTube’s upload limits are very high. Videos longer than 15 minutes need a verified account.')
    ].filter(Boolean) });
    P.push({ name: 'YouTube Shorts', icon: 'smartphone', rows: [
      row('Shape', ratioLabel(W, H), vertical || square ? 'pass' : 'warn', vertical ? 'Vertical — right for Shorts.' : square ? 'Square works; vertical 9:16 fills the screen.' : 'Landscape videos are not shown as Shorts.', vertical ? '' : fix.shorts),
      row('Length', fmtDur(D), D <= 60.5 ? 'pass' : D <= 180.5 ? 'pass' : 'warn', D <= 60.5 ? 'Within 60 seconds.' : D <= 180.5 ? 'Shorts can currently be up to 3 minutes for most channels — check YouTube’s current limit.' : 'Too long for a Short — split it into clips.', D > 180.5 ? fix.shorts : ''),
      row('Resolution', res, is916 && short >= 1080 ? 'pass' : short >= 720 ? 'pass' : 'warn', '1080×1920 is recommended.', is916 ? '' : fix.aspect('Resize to 9:16'))
    ] });
    P.push({ name: 'Instagram & Facebook Reels', icon: 'instagram', rows: [
      row('Shape', ratioLabel(W, H), is916 ? 'pass' : vertical || square ? 'info' : 'warn', is916 ? '9:16 fills the screen.' : vertical || square ? 'Works, but may show bars or be cropped. 9:16 is best.' : 'Landscape looks small in Reels.', is916 ? '' : fix.aspect('Resize to 9:16')),
      row('Length', fmtDur(D), D <= 90.5 ? 'pass' : D <= 180.5 ? 'info' : 'warn', D <= 90.5 ? 'Within 90 seconds — fine on both apps at the time of writing.' : D <= 180.5 ? 'Instagram currently allows longer Reels (around 3 minutes at the time of writing); Facebook may limit Reels to 90 seconds. Check the app.' : 'Longer than Reels currently allow — trim it.', D > 90.5 ? fix.trim : ''),
      row('Resolution', res, is916 && short >= 1080 ? 'pass' : short >= 720 ? 'pass' : 'warn', '1080×1920 is recommended.'),
      row('File size', BT.fmtBytes(size), size <= 1024 * MB ? 'pass' : 'warn', size <= 1024 * MB ? 'Fine.' : 'Very large file — slow to upload on mobile data.', size > 1024 * MB ? fix.compress : '')
    ] });
    P.push({ name: 'Facebook feed', icon: 'facebook', rows: [
      row('Shape', ratioLabel(W, H), square || is45 ? 'pass' : 'info', square || is45 ? 'Square and 4:5 take the most space in the feed.' : is169 ? 'Works; square (1:1) or 4:5 shows larger in the feed.' : vertical ? 'Vertical video may be shown cropped to 4:5 in the feed.' : 'Works; 1:1 or 4:5 is recommended.', square || is45 ? '' : fix.aspect('Make it 1:1 or 4:5')),
      codecRow,
      row('Resolution', res, short >= 720 ? 'pass' : 'warn', short >= 1080 ? 'Sharp.' : short >= 720 ? 'Good. 1080p is sharper.' : 'Low resolution.'),
      row('File size', BT.fmtBytes(size), size <= 1024 * MB ? 'pass' : 'info', 'Facebook accepts large files, but smaller files upload faster.', size > 1024 * MB ? fix.compress : '')
    ] });
    P.push({ name: 'WhatsApp Status', icon: 'message-circle-question', rows: [
      row('Length', fmtDur(D), D <= 60.5 ? 'pass' : 'warn', D <= 60.5 ? 'Fits one status (currently around 60 seconds per status at the time of writing — check the app).' : 'Longer than one status (currently around 60 seconds at the time of writing) — WhatsApp asks you to trim or splits it.', D > 60.5 ? fix.trim : ''),
      row('File size', BT.fmtBytes(size), size <= 16 * MB ? 'pass' : 'warn', size <= 16 * MB ? 'Small enough to keep good quality.' : 'WhatsApp compresses large videos heavily; a smaller file (around 16 MB or less) usually looks better.', size > 16 * MB ? fix.compress : ''),
      row('Shape', ratioLabel(W, H), vertical ? 'pass' : 'info', vertical ? 'Vertical fills the phone screen.' : 'Shown with bars — vertical 9:16 fills the screen.', vertical ? '' : fix.aspect('Resize to 9:16'))
    ] });
    return P;
  }

  register('social-video-checker', function (root) {
    fileTool(root, { title: 'Choose a video to check', hint: 'Any video file — nothing is uploaded', needVideo: true, privacy: 'The basic check reads your file in the browser. The optional codec check uses the video engine (about 32 MB, downloaded once).' },
      function (host, file, meta, S) {
        var m = Object.assign({}, meta);
        var out = h('div');
        var stats = h('div.stats');
        var detBtn = btn('btn-primary', 'scan-search', 'Check codecs and bitrate', details);
        var detWrap = h('div', { style: { margin: '14px 0' } });
        host.appendChild(h('div.card', null, [h('div.card-title', null, [h('h3', { text: 'Your video' })]), stats, detWrap]));
        host.appendChild(out);
        function renderStats() {
          stats.innerHTML = '';
          [['Length', fmtDur(m.duration)], ['Resolution', m.width ? m.width + ' × ' + m.height : '—'], ['Shape', ratioLabel(m.width, m.height)], ['File size', BT.fmtBytes(file.size)],
            ['Format', (extOf(file.name) || '?').toUpperCase()]].concat(m.vcodec ? [['Video', m.vcodec.toUpperCase() + (m.vprofile ? ' ' + m.vprofile : '')], ['Audio', m.hasAudio ? m.acodec.toUpperCase() : 'None'],
              ['Frame rate', m.fps ? (Math.round(m.fps * 100) / 100) + ' fps' : '—'], ['Bitrate', m.bitrate ? (m.bitrate >= 1000 ? (m.bitrate / 1000).toFixed(1) + ' Mbps' : m.bitrate + ' kbps') : '—']] : [])
            .forEach(function (s) { stats.appendChild(stat(s[0], s[1])); });
          detWrap.innerHTML = '';
          if (!m.vcodec) detWrap.appendChild(h('div.sv-tbar', null, [detBtn, h('span.small.muted', { text: 'Reads codec, frame rate and bitrate on your device.' })]));
        }
        function renderChecks() {
          out.innerHTML = '';
          var P = checkVideo(m, file);
          var card = h('div.card', { style: { marginTop: '16px' } }, [h('div.card-title', null, [h('h3', { text: 'Platform checklist' })]),
            h('p.small.muted', { style: { marginTop: '0' }, text: 'Platform rules change often. These checks reflect common recommendations at the time of writing — always check the app before posting.' })]);
          P.forEach(function (p) {
            var pass = p.rows.filter(function (r) { return r.status === 'warn'; }).length === 0;
            var tb = '<table class="table sv-ctable"><thead><tr><th scope="col">Check</th><th scope="col">Your video</th><th scope="col">Result</th><th scope="col">Notes</th></tr></thead><tbody>' +
              p.rows.map(function (r) {
                var lab = { pass: 'Pass', warn: 'Fix', info: 'Note' }[r.status];
                return '<tr><td>' + esc(r.label) + '</td><td>' + esc(r.value) + '</td><td><span class="sv-' + r.status + '">' + BT.icon(r.status === 'pass' ? 'check' : 'info') + ' ' + lab + '</span></td><td>' + esc(r.note) + (r.fix ? ' ' + r.fix + '.' : '') + '</td></tr>';
              }).join('') + '</tbody></table>';
            card.appendChild(h('div.sv-plat', null, [
              h('h4', { html: BT.icon(p.icon) + '<span>' + esc(p.name) + '</span> <span class="badge ' + (pass ? 'ok' : 'warn') + '">' + (pass ? 'Ready' : 'Needs changes') + '</span>' }),
              h('div.table-wrap', { html: tb })
            ]));
          });
          out.appendChild(card);
        }
        function details() {
          var ui = progressCard();
          detWrap.innerHTML = '';
          detWrap.appendChild(ui.el);
          job(S, ui, function (J) { return J.input(file, extOf(file.name) || 'bin').then(J.probe); }).then(function (pm) {
            Object.assign(m, pm, { duration: m.duration || pm.duration, viaEngine: meta.viaEngine });
            if (!pm.width) { m.width = meta.width; m.height = meta.height; }
            renderStats(); renderChecks();
          }).catch(function (e) { renderStats(); errorBox(detWrap, e); });
        }
        renderStats();
        renderChecks();
      });
  });

  // ============================================= 3. YOUTUBE THUMBNAIL MAKER
  var TW = 1280, TH = 720;
  var STICKERS = ['star', 'heart', 'flame', 'zap', 'check', 'x', 'trending-up', 'trending-down', 'indian-rupee', 'laugh', 'sparkles', 'camera', 'music', 'gift', 'megaphone', 'circle-help', 'lock', 'shield-check', 'smartphone', 'clock', 'map-pin', 'search', 'bot', 'crown'];
  var iconCache = {};
  function iconImage(name, color, cb) {
    var key = name + color;
    if (iconCache[key]) { if (iconCache[key].complete) return iconCache[key]; return null; }
    var inner = (window.BT_ICONS || {})[name];
    if (!inner) return null;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
    var img = new Image();
    img.onload = function () { if (cb) cb(); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    iconCache[key] = img;
    return null;
  }

  function thumbTemplates() {
    return [
      { name: 'Bold left', bg: { dim: 0.15, grad: 'left' }, layers: [
        { type: 'text', text: 'BIG TITLE\nHERE', x: 380, y: 300, size: 120, font: 'impact', color: '#facc15', stroke: '#000000', strokeW: 10, shadow: true, align: 'left', maxW: 680, box: false, boxColor: '#000000' },
        { type: 'text', text: 'Short subtitle', x: 300, y: 560, size: 56, font: 'sans', color: '#ffffff', stroke: '#000000', strokeW: 6, shadow: true, align: 'left', maxW: 640, box: false, boxColor: '#000000' }] },
      { name: 'Centre box', bg: { dim: 0.25, grad: 'none' }, layers: [
        { type: 'text', text: 'YOUR HEADLINE', x: 640, y: 360, size: 110, font: 'impact', color: '#ffffff', stroke: '#000000', strokeW: 0, shadow: false, align: 'center', maxW: 1100, box: true, boxColor: '#dc2626' }] },
      { name: 'Bottom bar', bg: { dim: 0, grad: 'bottom' }, layers: [
        { type: 'rect', x: 520, y: 600, w: 1040, h: 150, color: '#111827', radius: 18, alpha: 0.85 },
        { type: 'text', text: 'How I did it in 7 days', x: 520, y: 600, size: 72, font: 'sans', color: '#ffffff', stroke: '#000000', strokeW: 0, shadow: false, align: 'center', maxW: 980, box: false, boxColor: '#000000' }] },
      { name: 'Arrow & circle', bg: { dim: 0.1, grad: 'none' }, layers: [
        { type: 'text', text: 'WAIT FOR IT!', x: 380, y: 120, size: 100, font: 'impact', color: '#ffffff', stroke: '#dc2626', strokeW: 9, shadow: true, align: 'center', maxW: 700, box: false, boxColor: '#000000' },
        { type: 'circle', x: 900, y: 380, r: 150, color: '#ef4444', width: 14 },
        { type: 'arrow', x: 560, y: 420, len: 260, angle: -10, color: '#ef4444', width: 26 }] },
      { name: 'Hindi title', bg: { dim: 0.2, grad: 'left' }, layers: [
        { type: 'text', text: 'पूरी जानकारी\nसिर्फ 5 मिनट में', x: 380, y: 330, size: 104, font: 'sans', color: '#ffffff', stroke: '#000000', strokeW: 9, shadow: true, align: 'left', maxW: 700, box: false, boxColor: '#000000' },
        { type: 'icon', name: 'flame', x: 1100, y: 140, size: 150, color: '#f97316' }] }
    ];
  }

  function layerBounds(ctx, L) {
    if (L.type === 'text') {
      var mw = L.maxW || 1100, m = measureBlock(ctx, L.text, L, mw);
      var bx = L.align === 'left' ? L.x - mw / 2 : L.align === 'right' ? L.x + mw / 2 - m.w : L.x - m.w / 2;
      return { x: bx - m.padX - 6, y: L.y - m.h / 2 - m.padY - 6, w: m.w + m.padX * 2 + 12, h: m.h + m.padY * 2 + 12 };
    }
    if (L.type === 'rect') return { x: L.x - L.w / 2, y: L.y - L.h / 2, w: L.w, h: L.h };
    if (L.type === 'circle') return { x: L.x - L.r - L.width, y: L.y - L.r - L.width, w: (L.r + L.width) * 2, h: (L.r + L.width) * 2 };
    if (L.type === 'arrow') { var r = L.len / 2 + L.width; return { x: L.x - r, y: L.y - r, w: r * 2, h: r * 2 }; }
    if (L.type === 'icon') return { x: L.x - L.size / 2, y: L.y - L.size / 2, w: L.size, h: L.size };
    return { x: 0, y: 0, w: 0, h: 0 };
  }

  function drawLayer(ctx, L, redraw) {
    ctx.save();
    if (L.type === 'text') {
      var mw = L.maxW || 1100, m = measureBlock(ctx, L.text, L, mw);
      var bx = L.align === 'left' ? L.x - mw / 2 : L.align === 'right' ? L.x + mw / 2 - m.w : L.x - m.w / 2;
      drawBlock(ctx, m, L, bx, L.y - m.h / 2, m.w);
    } else if (L.type === 'rect') {
      ctx.globalAlpha = L.alpha == null ? 1 : L.alpha;
      ctx.fillStyle = L.color;
      roundRect(ctx, L.x - L.w / 2, L.y - L.h / 2, L.w, L.h, L.radius || 0);
      ctx.fill();
    } else if (L.type === 'circle') {
      ctx.strokeStyle = L.color; ctx.lineWidth = L.width;
      ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(L.x, L.y, L.r, 0, Math.PI * 2); ctx.stroke();
    } else if (L.type === 'arrow') {
      ctx.translate(L.x, L.y); ctx.rotate(L.angle * Math.PI / 180);
      var hl = L.len / 2, head = L.width * 2.2;
      ctx.fillStyle = L.color; ctx.strokeStyle = L.color;
      ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 8;
      ctx.lineWidth = L.width; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-hl, 0); ctx.lineTo(hl - head, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hl, 0); ctx.lineTo(hl - head * 1.3, -head); ctx.lineTo(hl - head * 1.3, head); ctx.closePath(); ctx.fill();
    } else if (L.type === 'icon') {
      var img = iconImage(L.name, L.color, redraw);
      if (img) {
        ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 10;
        ctx.drawImage(img, L.x - L.size / 2, L.y - L.size / 2, L.size, L.size);
      }
    }
    ctx.restore();
  }

  register('youtube-thumbnail-maker', function (root) {
    injectCSS();
    var S = null;
    function reset() {
      if (S) S.dispose();
      S = newScope();
      root.innerHTML = '';
      root.appendChild(BT.dropzone({ accept: VIDEO_ACCEPT + ',' + IMAGE_ACCEPT, title: 'Choose a video or photo', hint: 'Pick a frame from your video, or use any image — or drag it here', icon: 'image-play', color: BRAND,
        onFiles: function (f) { start(f[0]); } }));
      root.appendChild(h('div.sv-start', null, [btn('btn', 'palette', 'Start with a plain colour background', function () { start(null); })]));
      root.appendChild(privacyNote('Your video and images stay in your browser. No video engine download is needed for thumbnails.'));
    }
    function start(file) {
      if (S) S.dispose();
      S = newScope();
      var myS = S;
      root.innerHTML = '';
      var isVid = file && looksVideo(file) && !/^image\//.test(file.type || '');
      if (!file) return editor(null, null, myS);
      if (!isVid) {
        return BT.loadImage(file).then(function (img) { if (!myS.dead) editor(img, file, myS); }).catch(function (e) { errorBox(root, e); root.appendChild(btn('btn-primary', 'rotate-ccw', 'Choose another file', reset)); });
      }
      // Video: pick a frame.
      root.appendChild(h('div.sv-loading', { html: '<span class="spinner"></span> Reading ' + esc(file.name) + '…' }));
      probeElement(file, 'video').then(function (meta) {
        if (myS.dead) return;
        root.innerHTML = '';
        if (!meta || !meta.hasVideo) {
          root.appendChild(notice('error', 'Your browser can’t play this video format, so a frame can’t be picked here. Take a screenshot of the frame you want, or convert the video to MP4 with the ' + toolLink('video-converter', 'Video Converter') + ', then try again.'));
          root.appendChild(h('div.sv-actions', null, [btn('btn-primary', 'rotate-ccw', 'Choose another file', reset)]));
          return;
        }
        root.appendChild(fileHead(file, meta, reset));
        var v = mediaEl('video', myS.url(file), 'Video — choose a frame');
        v.muted = true;
        var stage = h('div.sv-stage', null, [v]);
        var useBtn = btn('btn-primary btn-lg', 'image', 'Use this frame', function () {
          var c = mkCanvas(v.videoWidth, v.videoHeight);
          c.getContext('2d').drawImage(v, 0, 0);
          v.pause();
          editor(c, file, myS, v.currentTime);
        });
        var fps = 30;
        var stepB = iconBtn('arrow-left', 'Previous frame', function () { v.pause(); v.currentTime = Math.max(0, v.currentTime - 1 / fps); });
        var stepF = iconBtn('arrow-right', 'Next frame', function () { v.pause(); v.currentTime = Math.min(meta.duration, v.currentTime + 1 / fps); });
        var tl = h('span.sv-now', { text: fmtTime(0, 2) });
        v.addEventListener('timeupdate', function () { tl.textContent = fmtTime(v.currentTime, 2); });
        v.addEventListener('seeked', function () { tl.textContent = fmtTime(v.currentTime, 2); });
        root.appendChild(h('div.card', null, [
          h('div.card-title', null, [h('h3', { text: 'Pick a frame for the background' })]),
          stage,
          h('div.sv-tbar', null, [stepB, stepF, tl]),
          h('p.small.muted', { text: 'Play or scrub the video, pause on a good moment (clear face, big expression), then press “Use this frame”.' }),
          h('div.sv-actions', null, [useBtn])
        ]));
      });
    }

    function editor(bgSrc, file, S2, frameTime) {
      root.innerHTML = '';
      var host = h('div');
      root.appendChild(host);
      var L = editorLayout(host, 'Layers');
      var cv = mkCanvas(TW, TH);
      cv.setAttribute('tabindex', '0');
      cv.setAttribute('role', 'img');
      cv.setAttribute('aria-label', 'Thumbnail preview, 1280 by 720. Drag layers to move them; arrow keys move the selected layer.');
      var ctx = cv.getContext('2d');
      var bg = { src: bgSrc, color: '#1f2937', color2: '#7c3aed', dim: 0.15, grad: 'left', zoom: 1, ox: 0.5, oy: 0.5 };
      var layers = [], sel = -1, guide = true;
      L.left.appendChild(h('div.sv-canvaswrap', null, [cv]));
      var guideCb = checkbox('Show the timestamp safe area (bottom right)', true, function (v) { guide = v; draw(); });
      L.left.appendChild(h('div.sv-tbar', null, [guideCb,
        btn('btn-sm btn-ghost', 'rotate-ccw', 'Start over', reset)]));

      // templates
      var tplWrap = h('div.sv-tpls', { role: 'group', 'aria-label': 'Templates' });
      L.left.appendChild(h('div.card', { style: { marginTop: '16px' } }, [h('div.card-title', null, [h('h3', { text: 'Templates' })]), tplWrap,
        h('p.small.muted', { style: { marginBottom: '0' }, text: 'A template replaces your layers. Then edit the text — Hindi and Bengali work too.' })]));
      function renderTemplates() {
        tplWrap.innerHTML = '';
        thumbTemplates().forEach(function (t) {
          var c = mkCanvas(256, 144), x = c.getContext('2d');
          x.scale(0.2, 0.2);
          paintBg(x, Object.assign({}, bg, t.bg));
          t.layers.forEach(function (ly) { drawLayer(x, ly); });
          var b = h('button.sv-tpl', { type: 'button', 'aria-label': 'Use template: ' + t.name }, [c, h('span', { text: t.name })]);
          b.addEventListener('click', function () {
            layers = JSON.parse(JSON.stringify(t.layers));
            bg.dim = t.bg.dim; bg.grad = t.bg.grad; dimF.setValue(Math.round(bg.dim * 100)); gradSel.value = bg.grad;
            pick(0);
          });
          tplWrap.appendChild(b);
        });
      }

      // panel: layers list + add buttons + properties
      var layerList = h('div.sv-layers', { role: 'listbox', 'aria-label': 'Layers' });
      L.add(layerList);
      L.add(h('div.sv-tbar', { style: { marginTop: '0', marginBottom: '12px' } }, [
        btn('btn-sm', 'type', 'Text', function () { addLayer({ type: 'text', text: 'New text', x: 640, y: 360, size: 90, font: 'impact', color: '#ffffff', stroke: '#000000', strokeW: 8, shadow: true, align: 'center', maxW: 1100, box: false, boxColor: '#dc2626' }); }),
        btn('btn-sm', 'square', 'Box', function () { addLayer({ type: 'rect', x: 640, y: 600, w: 700, h: 140, color: '#dc2626', radius: 16, alpha: 1 }); }),
        btn('btn-sm', 'circle', 'Circle', function () { addLayer({ type: 'circle', x: 640, y: 360, r: 120, color: '#ef4444', width: 12 }); }),
        btn('btn-sm', 'arrow-right', 'Arrow', function () { addLayer({ type: 'arrow', x: 640, y: 360, len: 260, angle: 0, color: '#facc15', width: 24 }); })
      ]));
      var stickerGrid = h('div.sv-stickers', { role: 'group', 'aria-label': 'Stickers' });
      STICKERS.forEach(function (n) {
        if (!(window.BT_ICONS || {})[n]) return;
        var b = h('button', { type: 'button', 'aria-label': 'Add sticker: ' + n, title: n, html: BT.icon(n) });
        b.addEventListener('click', function () { addLayer({ type: 'icon', name: n, x: 1080, y: 160, size: 160, color: '#facc15' }); });
        stickerGrid.appendChild(b);
      });
      var stickDet = h('details', { style: { marginBottom: '12px' } }, [h('summary', { text: 'Stickers', style: { cursor: 'pointer', fontWeight: '600', fontSize: '.9rem', marginBottom: '8px' } }), stickerGrid]);
      L.add(stickDet);
      var props = L.add(h('div'));

      // background controls
      var bgSec = h('div.sv-sec');
      var dimF = range('Darken background', 0, 80, 1, Math.round(bg.dim * 100), function (v) { return v + '%'; }, function (v) { bg.dim = v / 100; draw(); });
      var gradSel = select([['none', 'None'], ['left', 'Dark on the left'], ['bottom', 'Dark at the bottom'], ['vignette', 'Vignette']], bg.grad);
      gradSel.addEventListener('change', function () { bg.grad = gradSel.value; draw(); });
      var zoomF = range('Zoom', 100, 300, 5, 100, function (v) { return v + '%'; }, function (v) { bg.zoom = v / 100; draw(); });
      var oxF = range('Move left / right', 0, 100, 1, 50, function (v) { return v + '%'; }, function (v) { bg.ox = v / 100; draw(); });
      var oyF = range('Move up / down', 0, 100, 1, 50, function (v) { return v + '%'; }, function (v) { bg.oy = v / 100; draw(); });
      var c1 = input('color', bg.color), c2 = input('color', bg.color2);
      c1.addEventListener('input', function () { bg.color = c1.value; draw(); });
      c2.addEventListener('input', function () { bg.color2 = c2.value; draw(); });
      var imgBtn = fileButton(bgSrc ? 'Change background image' : 'Add background image', 'image-plus', IMAGE_ACCEPT, function (f) {
        BT.loadImage(f).then(function (img) { bg.src = img; bg.zoom = 1; zoomF.setValue(100); draw(); renderTemplates(); }).catch(function (e) { BT.toast(e.message, 'error'); });
      });
      bgSec.appendChild(h('h4', { text: 'Background' }));
      bgSec.appendChild(h('div', { style: { marginBottom: '12px' } }, [imgBtn]));
      bgSec.appendChild(h('div.sv-2', null, [field('Colour', c1), field('Gradient colour', c2)]));
      [dimF, field('Shade', gradSel), zoomF, oxF, oyF].forEach(function (x) { bgSec.appendChild(x); });
      L.add(bgSec);

      var info = h('p.small.muted', { style: { margin: '10px 0 0' }, text: '1280 × 720 px (16:9). YouTube’s thumbnail size limit has been 2 MB — the JPG download stays under it.' });
      L.actions.appendChild(btn('btn-primary btn-lg', 'download', 'Download JPG', function (e) { exportImg(e.currentTarget, 'jpg'); }));
      L.actions.appendChild(btn('btn-lg', 'download', 'PNG', function (e) { exportImg(e.currentTarget, 'png'); }));
      L.panel.appendChild(info);
      L.panel.appendChild(privacyNote('Your images never leave your device.'));

      function paintBg(x, b) {
        x.fillStyle = b.color;
        x.fillRect(0, 0, TW, TH);
        if (!b.src) {
          var g0 = x.createLinearGradient(0, 0, TW, TH);
          g0.addColorStop(0, b.color); g0.addColorStop(1, b.color2);
          x.fillStyle = g0; x.fillRect(0, 0, TW, TH);
        } else {
          var iw = b.src.naturalWidth || b.src.width, ih = b.src.naturalHeight || b.src.height;
          var sc = Math.max(TW / iw, TH / ih) * (b.zoom || 1), dw = iw * sc, dh = ih * sc;
          x.drawImage(b.src, (TW - dw) * (b.ox == null ? 0.5 : b.ox), (TH - dh) * (b.oy == null ? 0.5 : b.oy), dw, dh);
        }
        if (b.dim) { x.fillStyle = 'rgba(0,0,0,' + b.dim + ')'; x.fillRect(0, 0, TW, TH); }
        var g;
        if (b.grad === 'left') { g = x.createLinearGradient(0, 0, TW * 0.75, 0); g.addColorStop(0, 'rgba(0,0,0,.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); }
        else if (b.grad === 'bottom') { g = x.createLinearGradient(0, TH * 0.4, 0, TH); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.8)'); }
        else if (b.grad === 'vignette') { g = x.createRadialGradient(TW / 2, TH / 2, TH * 0.3, TW / 2, TH / 2, TW * 0.7); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.7)'); }
        if (g) { x.fillStyle = g; x.fillRect(0, 0, TW, TH); }
      }
      function render(x, withUi) {
        paintBg(x, bg);
        layers.forEach(function (ly) { drawLayer(x, ly, draw); });
        if (!withUi) return;
        if (guide) {
          x.save();
          x.setLineDash([10, 8]); x.lineWidth = 3; x.strokeStyle = 'rgba(255,255,255,.85)';
          x.fillStyle = 'rgba(0,0,0,.35)';
          x.fillRect(TW - 190, TH - 70, 170, 52);
          x.strokeRect(TW - 190, TH - 70, 170, 52);
          x.font = '600 22px ' + FONTS.sans.f; x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
          x.fillText('10:24', TW - 105, TH - 44);
          x.restore();
        }
        if (sel > -1 && layers[sel]) {
          var bb = layerBounds(x, layers[sel]);
          x.save(); x.setLineDash([8, 6]); x.lineWidth = 3; x.strokeStyle = '#38bdf8';
          x.strokeRect(bb.x, bb.y, bb.w, bb.h); x.restore();
        }
      }
      var raf = 0;
      function draw() { cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { render(ctx, true); }); }
      S2.on(function () { cancelAnimationFrame(raf); });

      function addLayer(ly) { layers.push(ly); pick(layers.length - 1); }
      function pick(i) { sel = i; renderLayers(); renderProps(); draw(); }
      function layerName(ly) {
        return { text: 'Text: ' + (ly.text || '').split('\n')[0], rect: 'Box', circle: 'Circle', arrow: 'Arrow', icon: 'Sticker: ' + ly.name }[ly.type];
      }
      function renderLayers() {
        layerList.innerHTML = '';
        if (!layers.length) { layerList.appendChild(h('div.sv-empty', { text: 'No layers yet — pick a template or add text.' })); return; }
        layers.slice().reverse().forEach(function (ly, ri) {
          var i = layers.length - 1 - ri;
          var b = h('button.sv-layer' + (i === sel ? '.sv-sel' : ''), { type: 'button', role: 'option', 'aria-selected': String(i === sel) }, [
            h('span', { html: BT.icon({ text: 'type', rect: 'square', circle: 'circle', arrow: 'arrow-right', icon: 'star' }[ly.type]) }),
            h('span.sv-ln', { text: layerName(ly) })
          ]);
          b.addEventListener('click', function () { pick(i); });
          layerList.appendChild(b);
        });
      }
      function prop(label, el) { return field(label, el); }
      function colorIn(ly, key, label) {
        var c = input('color', ly[key]);
        c.addEventListener('input', function () { ly[key] = c.value; draw(); renderTemplatesLazy(); });
        return prop(label, c);
      }
      function numRange(ly, key, label, min, max, step, fmt) {
        return range(label, min, max, step, ly[key], fmt, function (v) { ly[key] = v; draw(); });
      }
      var renderTemplatesLazy = noop;
      function renderProps() {
        props.innerHTML = '';
        var ly = layers[sel];
        if (!ly) return;
        var wrap = h('div.sv-sec', { style: { marginTop: '0' } }, [h('h4', { text: layerName(ly) })]);
        if (ly.type === 'text') {
          var ta = h('textarea', { id: nid(), rows: '3', maxlength: '200' });
          ta.value = ly.text;
          ta.addEventListener('input', function () { ly.text = ta.value; draw(); var b = BT.$('.sv-sel .sv-ln', layerList); if (b) b.textContent = layerName(ly); });
          wrap.appendChild(prop('Text', ta));
          var fSel = select(fontOptions(), ly.font);
          fSel.addEventListener('change', function () { ly.font = fSel.value; draw(); });
          var aSel = select([['left', 'Left'], ['center', 'Centre'], ['right', 'Right']], ly.align);
          aSel.addEventListener('change', function () { ly.align = aSel.value; draw(); });
          wrap.appendChild(h('div.sv-2', null, [prop('Font', fSel), prop('Align', aSel)]));
          wrap.appendChild(numRange(ly, 'size', 'Size', 24, 220, 1, function (v) { return v + ' px'; }));
          wrap.appendChild(h('div.sv-2', null, [colorIn(ly, 'color', 'Text colour'), colorIn(ly, 'stroke', 'Outline colour')]));
          wrap.appendChild(numRange(ly, 'strokeW', 'Outline width', 0, 24, 1, function (v) { return v + ' px'; }));
          wrap.appendChild(h('div.field', null, [checkbox('Drop shadow', ly.shadow, function (v) { ly.shadow = v; draw(); })]));
          wrap.appendChild(h('div.field', null, [checkbox('Background box', ly.box, function (v) { ly.box = v; draw(); })]));
          wrap.appendChild(colorIn(ly, 'boxColor', 'Box colour'));
        } else if (ly.type === 'rect') {
          wrap.appendChild(colorIn(ly, 'color', 'Colour'));
          wrap.appendChild(numRange(ly, 'w', 'Width', 40, 1280, 10, function (v) { return v + ' px'; }));
          wrap.appendChild(numRange(ly, 'h', 'Height', 20, 720, 5, function (v) { return v + ' px'; }));
          wrap.appendChild(numRange(ly, 'radius', 'Rounded corners', 0, 80, 1, function (v) { return v + ' px'; }));
          wrap.appendChild(range('Opacity', 10, 100, 5, Math.round((ly.alpha == null ? 1 : ly.alpha) * 100), function (v) { return v + '%'; }, function (v) { ly.alpha = v / 100; draw(); }));
        } else if (ly.type === 'circle') {
          wrap.appendChild(colorIn(ly, 'color', 'Colour'));
          wrap.appendChild(numRange(ly, 'r', 'Size', 20, 360, 2, function (v) { return v + ' px'; }));
          wrap.appendChild(numRange(ly, 'width', 'Line width', 2, 40, 1, function (v) { return v + ' px'; }));
        } else if (ly.type === 'arrow') {
          wrap.appendChild(colorIn(ly, 'color', 'Colour'));
          wrap.appendChild(numRange(ly, 'len', 'Length', 80, 900, 10, function (v) { return v + ' px'; }));
          wrap.appendChild(numRange(ly, 'angle', 'Direction', -180, 180, 5, function (v) { return v + '°'; }));
          wrap.appendChild(numRange(ly, 'width', 'Thickness', 6, 60, 1, function (v) { return v + ' px'; }));
        } else if (ly.type === 'icon') {
          wrap.appendChild(colorIn(ly, 'color', 'Colour'));
          wrap.appendChild(numRange(ly, 'size', 'Size', 40, 500, 5, function (v) { return v + ' px'; }));
        }
        wrap.appendChild(h('div.sv-tbar', null, [
          btn('btn-sm sv-up', 'chevron-down', 'Bring forward', function () { if (sel < layers.length - 1) { var t = layers[sel]; layers[sel] = layers[sel + 1]; layers[sel + 1] = t; pick(sel + 1); } }),
          btn('btn-sm', 'chevron-down', 'Send back', function () { if (sel > 0) { var t = layers[sel]; layers[sel] = layers[sel - 1]; layers[sel - 1] = t; pick(sel - 1); } }),
          btn('btn-sm', 'copy', 'Duplicate', function () { var c = JSON.parse(JSON.stringify(ly)); c.x += 30; c.y += 30; addLayer(c); }),
          btn('btn-sm btn-danger', 'trash-2', 'Delete', function () { layers.splice(sel, 1); pick(Math.min(sel, layers.length - 1)); })
        ]));
        props.appendChild(wrap);
      }

      // pointer dragging on the canvas
      function pt(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * TW / r.width, y: (e.clientY - r.top) * TH / r.height }; }
      var drag = null;
      cv.addEventListener('pointerdown', function (e) {
        var p = pt(e), hit = -1;
        for (var i = layers.length - 1; i >= 0; i--) {
          var bb = layerBounds(ctx, layers[i]);
          if (p.x >= bb.x && p.x <= bb.x + bb.w && p.y >= bb.y && p.y <= bb.y + bb.h) { hit = i; break; }
        }
        if (hit < 0) { if (sel !== -1) pick(-1); return; }
        e.preventDefault();
        cv.setPointerCapture(e.pointerId);
        if (hit !== sel) pick(hit);
        drag = { x: p.x, y: p.y, lx: layers[hit].x, ly: layers[hit].y };
      });
      cv.addEventListener('pointermove', function (e) {
        if (!drag || !layers[sel]) return;
        var p = pt(e);
        layers[sel].x = Math.round(drag.lx + p.x - drag.x);
        layers[sel].y = Math.round(drag.ly + p.y - drag.y);
        draw();
      });
      cv.addEventListener('pointerup', function () { drag = null; });
      cv.addEventListener('pointercancel', function () { drag = null; });
      cv.addEventListener('keydown', function (e) {
        var ly = layers[sel];
        if (!ly) return;
        var d = e.shiftKey ? 20 : 5;
        var mv = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[e.key];
        if (mv) { e.preventDefault(); ly.x += mv[0]; ly.y += mv[1]; draw(); }
        else if (e.key === 'Delete') { e.preventDefault(); layers.splice(sel, 1); pick(Math.min(sel, layers.length - 1)); }
      });

      function exportImg(b, fmt) {
        BT.busy(b, function () {
          var c = mkCanvas(TW, TH);
          render(c.getContext('2d'), false);
          var name = (file ? BT.baseName(file.name) : 'youtube') + '-thumbnail.' + fmt;
          if (fmt === 'png') {
            return BT.canvasToBlob(c, 'image/png').then(function (bl) {
              BT.download(bl, name);
              if (bl.size > 2 * 1048576) BT.toast('This PNG is ' + BT.fmtBytes(bl.size) + ' — over YouTube’s 2 MB limit. Use the JPG download for YouTube.', 'error');
            });
          }
          var q = 0.92;
          function attempt() {
            return BT.canvasToBlob(c, 'image/jpeg', q).then(function (bl) {
              if (bl.size > 1.95 * 1048576 && q > 0.5) { q -= 0.08; return attempt(); }
              BT.download(bl, name);
              BT.toast('Saved ' + BT.fmtBytes(bl.size) + ' JPG');
            });
          }
          return attempt();
        }, 'Saving…');
      }

      renderTemplatesLazy = BT.debounce(renderTemplates, 400);
      renderTemplates();
      // Start with the first template when there is a background, so users see how it works.
      layers = JSON.parse(JSON.stringify(thumbTemplates()[bgSrc ? 0 : 1].layers));
      var t0 = thumbTemplates()[bgSrc ? 0 : 1].bg;
      bg.dim = t0.dim; bg.grad = t0.grad; dimF.setValue(Math.round(bg.dim * 100)); gradSel.value = bg.grad;
      pick(0);
      void frameTime;
    }
    reset();
  });

  // ================================================= 4. VIDEO FRAME GRABBER
  register('video-frame-grabber', function (root) {
    fileTool(root, { title: 'Choose a video', hint: 'MP4, MOV, WebM or MKV — or drag and drop it here', needVideo: true, privacy: 'Frames are captured in your browser at full resolution. Nothing is uploaded.' },
      function (host, file, meta, S, reset) {
        var D = meta.duration;
        var L = editorLayout(host, 'Capture');
        var pv = previewStage(file, meta, S);
        L.left.appendChild(pv.el);
        var v = pv.video;
        var shots = [];
        var st = { fmt: 'png', fps: 30, n: 12, cols: 4, stamp: true };
        var tIn = input('text', fmtTime(0, 2), { inputmode: 'decimal', autocomplete: 'off', class: 'sv-tin' });
        var now = h('span.sv-now', { text: fmtTime(0, 3) });
        if (v) {
          v.addEventListener('timeupdate', function () { now.textContent = fmtTime(v.currentTime, 3); });
          v.addEventListener('seeked', function () { now.textContent = fmtTime(v.currentTime, 3); });
          var step = function (d) { v.pause(); v.currentTime = clamp(v.currentTime + d / st.fps, 0, Math.max(0, D - 0.001)); };
          L.left.appendChild(h('div.sv-tbar', null, [
            iconBtn('arrow-left', 'Previous frame', function () { step(-1); }),
            iconBtn('arrow-right', 'Next frame', function () { step(1); }),
            btn('btn-sm btn-primary', 'camera', 'Capture this frame', function () { grabNow(); }),
            now
          ]));
          L.left.appendChild(h('p.small.muted', { html: 'Keyboard: click the video, then use <span class="sv-kbd">←</span> <span class="sv-kbd">→</span> to step one frame and <span class="sv-kbd">C</span> to capture.' }));
          S.listen(v, 'keydown', function (e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); step(e.key === 'ArrowLeft' ? -1 : 1); }
            else if (e.key === 'c' || e.key === 'C') { e.preventDefault(); grabNow(); }
          });
        } else {
          L.left.appendChild(h('div', { style: { marginTop: '12px' } }, [field('Time to capture (e.g. 1:23.5)', tIn),
            btn('btn-primary', 'camera', 'Capture at this time', function (e) {
              var t = parseTime(tIn.value);
              if (!isFinite(t) || t > D) { BT.toast('Enter a time within the video', 'error'); return; }
              captureEngine([t], e.currentTarget);
            })]));
        }
        var shotsEl = h('div.sv-shots');
        var shotsCard = h('div.card', { style: { marginTop: '16px' } }, [h('div.card-title', null, [h('h3', { text: 'Captured frames' })]), shotsEl,
          h('div.sv-actions', null, [
            btn('btn-primary', 'file-archive', 'Download all (ZIP)', function (e) {
              if (!shots.length) return;
              var b = e.currentTarget;
              BT.busy(b, function () { return BT.downloadZip(shots.map(function (s) { return { name: s.name, data: s.blob }; }), BT.baseName(file.name) + '-frames.zip'); }, 'Zipping…');
            }),
            btn('', 'layout-grid', 'Make contact sheet', function (e) { contactSheet(e.currentTarget); }),
            btn('btn-ghost', 'trash-2', 'Clear', function () { shots = []; renderShots(); })
          ])]);
        L.left.appendChild(shotsCard);

        L.add(labeled('Image format', seg([['png', 'PNG (lossless)'], ['jpg', 'JPG (smaller)']], st.fmt, function (v2) { st.fmt = v2; }, 'Image format')));
        if (v) L.add(field('Frame step', (function () {
          var s = select([['24', '24 fps'], ['25', '25 fps'], ['30', '30 fps'], ['50', '50 fps'], ['60', '60 fps']], '30');
          s.addEventListener('change', function () { st.fps = +s.value; });
          return s;
        })(), 'Match your video’s frame rate so ← → moves exactly one frame.'));
        var nIn = stepper('Number of frames', st.n, 2, 100, 1, function (x) { st.n = Math.round(x); });
        var evenBtn = btn('btn', 'images', 'Capture evenly spaced frames', function (e) { evenly(e.currentTarget); });
        L.add(h('div.sv-sec', null, [h('h4', { text: 'Many frames at once' }), nIn, evenBtn]));
        L.add(h('div.sv-sec', null, [h('h4', { text: 'Contact sheet' }),
          stepper('Columns', st.cols, 2, 8, 1, function (x) { st.cols = Math.round(x); }),
          h('div.field', null, [checkbox('Print the time on each frame', true, function (x) { st.stamp = x; })])]));
        L.panel.removeChild(L.actions);
        var resOut = L.out;

        function renderShots() {
          shotsEl.innerHTML = '';
          if (!shots.length) { shotsEl.appendChild(h('div.sv-empty', { text: 'No frames yet. Pause on a moment and press “Capture”.' })); shotsCard.querySelector('.sv-actions').classList.add('hidden'); return; }
          shotsCard.querySelector('.sv-actions').classList.remove('hidden');
          shots.forEach(function (s, i) {
            shotsEl.appendChild(h('div.sv-shot', null, [h('img', { src: s.url, alt: 'Frame at ' + fmtTime(s.t, 2) }),
              h('div', null, [h('span', { text: fmtTime(s.t, 2) }), h('span.sv-btns', { style: { display: 'flex', gap: '4px' } }, [
                iconBtn('download', 'Download frame at ' + fmtTime(s.t, 2), function () { BT.download(s.blob, s.name); }),
                iconBtn('x', 'Remove frame at ' + fmtTime(s.t, 2), function () { shots.splice(i, 1); renderShots(); })])])]));
          });
        }
        renderShots();
        function addShot(canvas, t) {
          var type = st.fmt === 'png' ? 'image/png' : 'image/jpeg';
          return BT.canvasToBlob(canvas, type, 0.92).then(function (b) {
            shots.push({ blob: b, url: S.url(b), t: t, w: canvas.width, h: canvas.height, name: BT.baseName(file.name) + '-' + fmtTime(t, 3).replace(/[:.]/g, '-') + '.' + st.fmt });
            shots.sort(function (a, c) { return a.t - c.t; });
          });
        }
        function frameCanvas() {
          var c = mkCanvas(v.videoWidth, v.videoHeight);
          c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
          return c;
        }
        function grabNow() {
          if (!v || !v.videoWidth) return;
          addShot(frameCanvas(), v.currentTime).then(function () { renderShots(); BT.toast('Frame captured (' + v.videoWidth + '×' + v.videoHeight + ')'); });
        }
        function seekTo(t) {
          return new Promise(function (res) {
            var done = false, to = setTimeout(fin, 5000);
            function fin() { if (done) return; done = true; clearTimeout(to); v.removeEventListener('seeked', fin); res(); }
            v.addEventListener('seeked', fin);
            v.currentTime = t;
          });
        }
        function evenTimes() {
          var n = st.n, out = [];
          for (var i = 0; i < n; i++) out.push(Math.min(D - 0.05, (i + 0.5) * D / n));
          return out;
        }
        function evenly(b) {
          var times = evenTimes();
          if (!v) return captureEngine(times, b);
          v.pause();
          BT.busy(b, function () {
            return times.reduce(function (p, t) {
              return p.then(function () { if (S.dead) return; return seekTo(t).then(function () { return addShot(frameCanvas(), t); }); });
            }, Promise.resolve()).then(function () { renderShots(); BT.toast(times.length + ' frames captured'); });
          }, 'Capturing…');
        }
        function captureEngine(times, b) {
          b.disabled = true;
          resOut.innerHTML = '';
          var ui = progressCard();
          resOut.appendChild(ui.el);
          job(S, ui, function (J) {
            return J.input(file, extOf(file.name) || 'mp4').then(function (inp) {
              var imgs = [];
              return times.reduce(function (p, t, i) {
                return p.then(function () {
                  var o = J.out('png');
                  ui.stage('Capturing frame ' + (i + 1) + ' of ' + times.length + '…', '', i / times.length);
                  return J.run(['-ss', t.toFixed(3), '-i', inp, '-frames:v', '1', '-update', '1', o]).then(function () { return J.read(o); })
                    .then(function (d) { J.del(o); imgs.push({ t: t, data: d }); });
                });
              }, Promise.resolve()).then(function () { return imgs; });
            });
          }).then(function (imgs) {
            ui.remove(); b.disabled = false;
            return imgs.reduce(function (p, im) {
              return p.then(function () { return BT.loadImage(new Blob([im.data], { type: 'image/png' })); }).then(function (img) {
                var c = mkCanvas(img.naturalWidth, img.naturalHeight);
                c.getContext('2d').drawImage(img, 0, 0);
                URL.revokeObjectURL(img.src);
                return addShot(c, im.t);
              });
            }, Promise.resolve()).then(renderShots);
          }).catch(function (e) { ui.remove(); b.disabled = false; errorBox(resOut, e); });
        }
        function contactSheet(b) {
          if (!shots.length) { BT.toast('Capture some frames first', 'error'); return; }
          BT.busy(b, function () {
            var cols = Math.min(st.cols, shots.length), rows = Math.ceil(shots.length / cols);
            var SW = 1920, gap = 12, cw = Math.floor((SW - gap * (cols + 1)) / cols);
            var ar = shots[0].h / shots[0].w, ch = Math.round(cw * ar), head = 70;
            var c = mkCanvas(SW, head + rows * (ch + gap) + gap), x = c.getContext('2d');
            x.fillStyle = '#111318'; x.fillRect(0, 0, c.width, c.height);
            x.fillStyle = '#ffffff'; x.font = '700 30px ' + FONTS.sans.f; x.textBaseline = 'middle';
            x.fillText(file.name.slice(0, 80), gap * 2, head / 2);
            x.font = '500 22px ' + FONTS.sans.f; x.fillStyle = '#c9cede'; x.textAlign = 'right';
            x.fillText(fmtDur(D) + ' · ' + (meta.width ? meta.width + '×' + meta.height : ''), SW - gap * 2, head / 2);
            x.textAlign = 'left';
            return shots.reduce(function (p, s, i) {
              return p.then(function () { return BT.loadImage(s.url); }).then(function (img) {
                var cx = gap + (i % cols) * (cw + gap), cy = head + Math.floor(i / cols) * (ch + gap);
                x.drawImage(img, cx, cy, cw, ch);
                if (st.stamp) {
                  x.font = '700 24px ' + FONTS.mono.f;
                  var label = fmtTime(s.t, 1), tw = x.measureText(label).width;
                  x.fillStyle = 'rgba(0,0,0,.65)'; x.fillRect(cx + 8, cy + ch - 42, tw + 16, 34);
                  x.fillStyle = '#fff'; x.fillText(label, cx + 16, cy + ch - 25);
                }
              });
            }, Promise.resolve()).then(function () { return BT.canvasToBlob(c, 'image/jpeg', 0.9); }).then(function (bl) {
              resOut.innerHTML = '';
              resOut.appendChild(resultCard({ S: S, blob: bl, name: BT.baseName(file.name) + '-contact-sheet.jpg', kind: 'image', title: 'Contact sheet ready',
                stats: [['Frames', String(shots.length)], ['Size', c.width + ' × ' + c.height], ['File', BT.fmtBytes(bl.size)]] }));
              scrollTo(resOut.lastChild);
            });
          }, 'Building…');
        }
        void reset;
      });
  });

  // ================================================== 5. SUBTITLE MAKER
  var CAP_FONT_PCT = { s: 0.042, m: 0.052, l: 0.064, xl: 0.078 };
  register('subtitle-maker', function (root) {
    fileTool(root, {
      title: 'Choose your video', hint: 'To time captions while watching, and to burn them in — or start without a video below', needVideo: true,
      privacy: 'Captions are typed by you — there is no automatic transcription here, and nothing is uploaded. (YouTube Studio can auto-generate captions after you upload a video.)',
      pre: function (r, S0, startWith) {
        r.appendChild(h('div.sv-start', null, [
          btn('btn', 'pen-line', 'Start typing without a video', function () { startWith(function (host, S1, reset) { editorUI(host, null, null, S1, reset, []); }); }),
          fileButton('Open an SRT / VTT file', 'captions', SUB_ACCEPT, function (f) {
            readTextFile(f).then(function (txt) {
              var cues = parseSubs(txt);
              if (!cues.length) { BT.toast('No captions found in that file', 'error'); return; }
              startWith(function (host, S1, reset) { editorUI(host, null, null, S1, reset, cues, f.name); });
            });
          }, 'btn')
        ]));
      }
    }, function (host, file, meta, S, reset) { editorUI(host, file, meta, S, reset, []); });

    function editorUI(host, file, meta, S, reset, initial, srcName) {
      injectCSS();
      if (!file) host.appendChild(h('div.sv-head', null, [h('span.sv-ic', { html: BT.icon('captions') }),
        h('div.sv-txt', null, [h('div.sv-name', { text: srcName || 'New captions' }), h('div.sv-meta', { html: '<span class="badge">No video</span>' })]),
        btn('btn-ghost btn-sm', 'rotate-ccw', 'Start over', reset)]));
      var cues = initial.map(function (c) { return { start: c.start, end: c.end, text: c.text }; });
      var D = meta ? meta.duration : 0;
      var L = editorLayout(host, 'Captions');
      var pv = file ? framedPreview(file, meta, S) : null;
      var v = pv && pv.video;
      var capPrev = h('div.sv-capprev', { 'aria-hidden': 'true' }, [h('span')]);
      if (pv) {
        L.left.appendChild(pv.el);
        if (pv.frame) pv.frame.appendChild(capPrev);
      }
      var cur = -1;
      var now = h('span.sv-now', { text: fmtTime(0, 2) });
      if (v) L.left.appendChild(h('div.sv-tbar', null, [
        iconBtn('arrow-left', 'Back 2 seconds', function () { v.currentTime = Math.max(0, v.currentTime - 2); }),
        iconBtn('monitor-play', 'Play or pause', function () { if (v.paused) v.play().catch(noop); else v.pause(); }),
        iconBtn('arrow-right', 'Forward 2 seconds', function () { v.currentTime = Math.min(D, v.currentTime + 2); }),
        btn('btn-sm', 'plus', 'Add caption at playhead', function () { addAt(v.currentTime); }),
        now
      ]));

      // tap-to-time
      var tapIdx = 0, tapOn = false, holdStart = null;
      var tapLine = h('span.sv-tapline');
      var holdBtn = btn('btn sv-hold', 'mic', 'Hold while this line is spoken', null);
      var tapBox = h('div.sv-tap.hidden', null, [h('div', { style: { flex: '1 1 100%' }, html: '<strong>Tap-to-time:</strong> play the video and <strong>hold</strong> the button (or the <span class="sv-kbd">T</span> key) while each line is spoken. Release to move to the next line.' }),
        tapLine, holdBtn, btn('btn-sm', 'undo-2', 'Back one line', function () { tapIdx = Math.max(0, tapIdx - 1); updTap(); }), btn('btn-sm btn-ghost', 'x', 'Stop', function () { setTap(false); })]);
      var tapToggle = btn('btn-sm', 'timer', 'Tap-to-time mode', function () { setTap(!tapOn); });
      if (v) {
        L.left.appendChild(h('div.sv-tbar', null, [tapToggle, h('span.small.muted', { text: 'Paste your script below first, one caption per line.' })]));
        L.left.appendChild(tapBox);
      }
      function setTap(on) {
        tapOn = on;
        tapBox.classList.toggle('hidden', !on);
        if (on) {
          if (!cues.length) { BT.toast('Add or paste caption lines first', 'error'); tapOn = false; tapBox.classList.add('hidden'); return; }
          var firstEmpty = cues.findIndex(function (c) { return !(c.end > c.start); });
          tapIdx = firstEmpty > -1 ? firstEmpty : 0;
          updTap();
        }
      }
      function updTap() {
        tapLine.textContent = cues[tapIdx] ? (tapIdx + 1) + '. ' + cues[tapIdx].text : 'All lines are timed. 🎉';
        holdBtn.disabled = !cues[tapIdx];
      }
      function holdDown() {
        if (!tapOn || !cues[tapIdx] || holdStart != null) return;
        holdStart = v.currentTime;
        holdBtn.classList.add('sv-on');
        if (v.paused) v.play().catch(noop);
      }
      function holdUp() {
        if (holdStart == null) return;
        var c = cues[tapIdx];
        var end = Math.max(v.currentTime, holdStart + 0.3);
        c.start = holdStart; c.end = end;
        holdStart = null;
        holdBtn.classList.remove('sv-on');
        tapIdx++;
        renderRows(); updTap();
      }
      holdBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); holdDown(); });
      holdBtn.addEventListener('pointerup', holdUp);
      holdBtn.addEventListener('pointercancel', holdUp);
      holdBtn.addEventListener('pointerleave', holdUp);
      holdBtn.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); holdDown(); } });
      holdBtn.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); holdUp(); } });
      S.listen(doc, 'keydown', function (e) {
        if (!tapOn || e.repeat || (e.key !== 't' && e.key !== 'T')) return;
        if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '')) return;
        e.preventDefault(); holdDown();
      });
      S.listen(doc, 'keyup', function (e) { if (tapOn && (e.key === 't' || e.key === 'T')) holdUp(); });

      // rows
      var rowsEl = h('div.sv-subs', { 'aria-label': 'Caption lines' });
      var countEl = h('span.badge');
      L.add(h('div.card-title', { style: { marginBottom: '8px' } }, [h('span.label', { text: 'Caption lines' }), countEl]));
      L.add(rowsEl);
      L.add(h('div.sv-tbar', { style: { marginBottom: '6px' } }, [btn('btn-sm', 'plus', 'Add line', function () { addAt(v ? v.currentTime : (cues.length ? cues[cues.length - 1].end : 0)); })]));
      L.panel.removeChild(L.actions);

      function sortCues() { cues.sort(function (a, b) { return (a.start - b.start) || (a.end - b.end); }); }
      function addAt(t) {
        var c = { start: t, end: Math.min(D || t + 3, t + 3), text: '' };
        if (!D) c.end = t + 3;
        cues.push(c); sortCues();
        renderRows();
        var i = cues.indexOf(c), ta = BT.$$('textarea', rowsEl)[i];
        if (ta) ta.focus();
      }
      function renderRows() {
        rowsEl.innerHTML = '';
        countEl.textContent = cues.length + ' line' + (cues.length === 1 ? '' : 's');
        if (!cues.length) { rowsEl.appendChild(h('div.sv-empty', { text: v ? 'No captions yet. Pause the video and press “Add caption at playhead”, or paste your script below.' : 'No captions yet. Press “Add line” or paste your script below.' })); return; }
        cues.forEach(function (c, i) {
          var sIn = input('text', tsSrt(c.start, ','), { 'aria-label': 'Line ' + (i + 1) + ' start', autocomplete: 'off', spellcheck: 'false' });
          var eIn = input('text', tsSrt(c.end, ','), { 'aria-label': 'Line ' + (i + 1) + ' end', autocomplete: 'off', spellcheck: 'false' });
          var ta = h('textarea', { 'aria-label': 'Line ' + (i + 1) + ' text', rows: '2' });
          ta.value = c.text;
          var err = h('div.sv-err');
          function check() {
            var msgs = [];
            if (!(c.end > c.start)) msgs.push('End must be after start.');
            if (i > 0 && cues[i - 1].end > c.start + 0.001) msgs.push('Overlaps the previous line.');
            if (D && c.start > D) msgs.push('Starts after the video ends.');
            err.textContent = msgs.join(' ');
          }
          function commitTime(inp, key) {
            var t = parseTime(inp.value);
            if (!isFinite(t)) { inp.value = tsSrt(c[key], ','); BT.toast('Use a time like 00:01:23,500 or 83.5', 'error'); return; }
            c[key] = t;
            inp.value = tsSrt(t, ',');
            check();
          }
          sIn.addEventListener('change', function () { commitTime(sIn, 'start'); });
          eIn.addEventListener('change', function () { commitTime(eIn, 'end'); });
          ta.addEventListener('input', function () { c.text = ta.value; if (i === cur) showCap(); });
          var tm = h('div.sv-tm', null, [sIn, h('span', { 'aria-hidden': 'true', text: '→' }), eIn]);
          var btns = h('div.sv-btns', null, v ? [
            btn('btn-sm', 'arrow-right', 'Start = playhead', function () { c.start = v.currentTime; sIn.value = tsSrt(c.start, ','); check(); }),
            btn('btn-sm', 'arrow-left', 'End = playhead', function () { c.end = v.currentTime; eIn.value = tsSrt(c.end, ','); check(); }),
            iconBtn('monitor-play', 'Play line ' + (i + 1), function () { v.currentTime = c.start; v.play().catch(noop); }),
            iconBtn('trash-2', 'Delete line ' + (i + 1), function () { cues.splice(i, 1); renderRows(); })
          ] : [iconBtn('trash-2', 'Delete line ' + (i + 1), function () { cues.splice(i, 1); renderRows(); })]);
          var row = h('div.sv-sub' + (i === cur ? '.sv-cur' : ''), null, [h('div.sv-no', { text: String(i + 1) }), h('div', null, [tm, ta, btns, err])]);
          rowsEl.appendChild(row);
          check();
        });
      }
      function showCap() {
        var span = capPrev.firstChild;
        span.textContent = cues[cur] ? cleanCue(cues[cur].text) : '';
        capPrev.style.display = span.textContent ? '' : 'none';
      }
      if (v) {
        v.addEventListener('timeupdate', function () {
          now.textContent = fmtTime(v.currentTime, 2);
          var t = v.currentTime, idx = -1;
          for (var i = 0; i < cues.length; i++) if (t >= cues[i].start && t < cues[i].end) { idx = i; break; }
          if (holdStart != null) idx = tapIdx;
          if (idx !== cur) {
            var rows = BT.$$('.sv-sub', rowsEl);
            if (rows[cur]) rows[cur].classList.remove('sv-cur');
            cur = idx;
            if (rows[cur]) { rows[cur].classList.add('sv-cur'); if (!rowsEl.contains(doc.activeElement)) rows[cur].scrollIntoView({ block: 'nearest' }); }
            showCap();
          }
        });
      }

      // tools card: paste, import, shift, export
      var paste = h('textarea', { id: nid(), rows: '4', placeholder: 'Paste your script here — one caption per line (blank lines are skipped).' });
      var pasteBtn = btn('btn-sm', 'list', 'Add lines', function () {
        var lines = paste.value.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
        if (!lines.length) { BT.toast('Paste some text first', 'error'); return; }
        var t = cues.length ? cues[cues.length - 1].end : 0;
        lines.forEach(function (l) {
          if (v) cues.push({ start: 0, end: 0, text: l });
          else { cues.push({ start: t, end: t + 2.5, text: l }); t += 2.5; }
        });
        if (!v) sortCues();
        paste.value = '';
        renderRows();
        BT.toast(lines.length + ' lines added' + (v ? ' — now use tap-to-time to set their timings' : ' with 2.5 s each'));
        if (v) setTap(true);
      });
      var shiftIn = input('number', '0.5', { step: '0.1', inputmode: 'decimal' });
      var tools = h('div.card', { style: { marginTop: '16px' } }, [
        h('div.card-title', null, [h('h3', { text: 'Script, import & export' })]),
        field('Paste lines', paste, v ? 'Lines are added untimed; then time them with tap-to-time.' : 'Each line gets 2.5 s — adjust the times as needed.'),
        h('div.sv-tbar', { style: { marginTop: '-4px' } }, [pasteBtn, fileButton('Import SRT / VTT', 'captions', SUB_ACCEPT, function (f) {
          readTextFile(f).then(function (txt) {
            var c2 = parseSubs(txt);
            if (!c2.length) { BT.toast('No captions found in that file', 'error'); return; }
            cues = c2; renderRows(); BT.toast(c2.length + ' captions imported');
          });
        })]),
        h('div.sv-sec', null, [h('h4', { text: 'Shift all timings' }),
          h('div.sv-tbar', { style: { marginTop: '0', alignItems: 'flex-end' } }, [h('div', { style: { flex: '0 1 140px' } }, [field('Seconds', shiftIn)]),
            btn('btn-sm', 'arrow-left', 'Earlier', function () { shift(-1); }), btn('btn-sm', 'arrow-right', 'Later', function () { shift(1); })])]),
        h('div.sv-sec', null, [h('h4', { text: 'Download captions' }),
          h('div.sv-tbar', { style: { marginTop: '0' } }, [
            btn('btn-primary', 'download', 'SRT', function () { exportSubs('srt'); }),
            btn('btn-primary', 'download', 'VTT', function () { exportSubs('vtt'); }),
            btn('btn', 'copy', 'Copy SRT', function () { if (validCues()) BT.copy(toSrt(validCues())); })
          ]),
          h('p.small.muted', { style: { marginBottom: '0' }, text: 'Upload the SRT in YouTube Studio → Subtitles, or on Facebook. Burned-in captions (below) show everywhere, including Instagram and WhatsApp.' })])
      ]);
      L.left.appendChild(tools);
      function shift(sign) {
        var d = parseFloat(shiftIn.value);
        if (!isFinite(d) || d <= 0) { BT.toast('Enter seconds to shift', 'error'); return; }
        cues.forEach(function (c) { c.start = Math.max(0, c.start + sign * d); c.end = Math.max(0, c.end + sign * d); });
        renderRows();
        BT.toast('Shifted ' + (sign > 0 ? 'later' : 'earlier') + ' by ' + d + ' s');
      }
      function validCues() {
        var ok = cues.filter(function (c) { return c.end > c.start && String(c.text).trim(); }).map(function (c) { return { start: c.start, end: c.end, text: c.text }; });
        ok.sort(function (a, b) { return a.start - b.start; });
        if (!ok.length) { BT.toast('There are no timed captions with text yet', 'error'); return null; }
        var skipped = cues.length - ok.length;
        if (skipped) BT.toast(skipped + ' line' + (skipped > 1 ? 's were' : ' was') + ' skipped (no text or no timing)');
        return ok;
      }
      function exportSubs(fmt) {
        var ok = validCues();
        if (!ok) return;
        var base = file ? BT.baseName(file.name) : srcName ? BT.baseName(srcName) : 'captions';
        if (fmt === 'srt') BT.download(new Blob([toSrt(ok)], { type: 'text/plain;charset=utf-8' }), base + '.srt');
        else BT.download(new Blob([toVtt(ok)], { type: 'text/vtt;charset=utf-8' }), base + '.vtt');
      }

      // burn-in
      if (file) {
        var bs = { font: 'sans', size: 'm', color: '#ffffff', stroke: '#000000', strokeW: 3, box: true, boxColor: '#000000', boxAlpha: 60, anchor: 'bottom' };
        var fSel = select(fontOptions(), bs.font);
        fSel.addEventListener('change', function () { bs.font = fSel.value; });
        var cCol = input('color', bs.color), sCol = input('color', bs.stroke), bCol = input('color', bs.boxColor);
        cCol.addEventListener('input', function () { bs.color = cCol.value; });
        sCol.addEventListener('input', function () { bs.stroke = sCol.value; });
        bCol.addEventListener('input', function () { bs.boxColor = bCol.value; });
        var burnBtn = btn('btn-primary btn-lg', 'captions', 'Burn captions into video', burn);
        var out = h('div.sv-out');
        L.left.appendChild(h('div.card', { style: { marginTop: '16px' } }, [
          h('div.card-title', null, [h('h3', { text: 'Burn captions into the video' })]),
          h('p.small.muted', { style: { marginTop: '0' }, text: 'Makes an MP4 with the captions drawn on the picture. Text is drawn by your browser, so Hindi, Bengali and emoji appear correctly.' }),
          h('div.sv-2', null, [field('Font', fSel), labeled('Size', seg([['s', 'S'], ['m', 'M'], ['l', 'L'], ['xl', 'XL']], bs.size, function (x) { bs.size = x; }, 'Caption size'))]),
          h('div.sv-2', null, [field('Text colour', cCol), field('Outline colour', sCol)]),
          range('Outline width', 0, 10, 1, bs.strokeW, function (x) { return x + ' px'; }, function (x) { bs.strokeW = x; }),
          h('div.field', null, [checkbox('Background box', bs.box, function (x) { bs.box = x; })]),
          h('div.sv-2', null, [field('Box colour', bCol), range('Box opacity', 10, 100, 5, bs.boxAlpha, function (x) { return x + '%'; }, function (x) { bs.boxAlpha = x; })]),
          labeled('Position', seg([['bottom', 'Bottom'], ['middle', 'Middle'], ['top', 'Top']], bs.anchor, function (x) { bs.anchor = x; }, 'Caption position')),
          h('div.sv-actions', null, [burnBtn]),
          out
        ]));
      }
      function burn() {
        var ok = validCues();
        if (!ok) return;
        burnBtn.disabled = true;
        out.innerHTML = '';
        var ui = progressCard();
        out.appendChild(ui.el);
        scrollTo(ui.el);
        job(S, ui, function (J) {
          needH264();
          return J.input(file, extOf(file.name) || 'mp4').then(function (inp) {
            return J.probe(inp).then(function (pm) {
              var W = pm.width || meta.width, H = pm.height || meta.height, dur = pm.duration || D;
              var size = Math.round(Math.min(H, W * 1.2) * CAP_FONT_PCT[bs.size]);
              var sty = { font: bs.font, weight: 700, size: size, color: bs.color, stroke: bs.stroke, strokeW: bs.strokeW ? Math.max(1, Math.round(bs.strokeW * size / 40)) : 0,
                box: bs.box, boxColor: bs.boxColor, boxAlpha: bs.boxAlpha / 100, shadow: !bs.box && !bs.strokeW, lineH: 1.25 };
              var maxW = Math.round(W * 0.88);
              var bh = Math.min(Math.round(H * 0.5), bandHeight(ok.map(function (c) { return cleanCue(c.text); }), sty, maxW));
              ui.stage('Drawing captions…', ok.length + ' lines', null);
              return writeCaptionTrack(J, ok.map(function (c) { return { start: c.start, end: c.end, text: cleanCue(c.text) }; }), sty, W, bh, bs.anchor, maxW, dur).then(function (list) {
                if (!list) throw new Error('No captions fall inside the video’s length.');
                var y = bs.anchor === 'top' ? Math.round(H * 0.05) : bs.anchor === 'middle' ? Math.round((H - bh) / 2) : Math.round(H * 0.95 - bh);
                var o = J.out('mp4');
                var args = ['-i', inp, '-f', 'concat', '-safe', '0', '-i', list, '-filter_complex', '[0:v][1:v]overlay=0:' + Math.max(0, y) + ':format=auto,format=yuv420p[v]', '-map', '[v]', '-map', '0:a:0?'];
                args = args.concat(h264Args('veryfast'), /^(aac|mp3)$/.test(pm.acodec) ? ['-c:a', 'copy'] : AAC, FASTSTART, [o]);
                return J.run(args, { dur: dur, label: 'Burning in captions…', sub: 'Keep this tab open.' }).then(function () { return J.read(o); });
              });
            });
          });
        }).then(function (data) {
          ui.remove(); burnBtn.disabled = false;
          var blob = new Blob([data], { type: 'video/mp4' });
          out.appendChild(resultCard({ S: S, blob: blob, name: BT.baseName(file.name) + '-captioned.mp4', kind: 'video', title: 'Captions burned in',
            stats: [['Captions', String(ok.length)], ['File', BT.fmtBytes(blob.size)]] }));
          scrollTo(out.lastChild);
        }).catch(function (e) { ui.remove(); burnBtn.disabled = false; errorBox(out, e); });
      }
      renderRows();
      showCap();
    }
  });

  // ============================================ 6. YOUTUBE CHAPTERS GENERATOR
  /** Parse "0:00 Intro", "00:00 - Intro", "Intro 1:23", "[1:02:03] Title" lines. */
  function parseChapters(txt) {
    var out = [];
    String(txt || '').split(/\r?\n/).forEach(function (line) {
      line = line.trim();
      if (!line) return;
      var m = line.match(/^[\[(]?((?:\d{1,2}:)?\d{1,2}:\d{2})[\])]?\s*[-–—:|.)]*\s*(.*)$/);
      if (m) { out.push({ time: m[1], title: m[2].trim() }); return; }
      m = line.match(/^(.*?)\s*[-–—:|(\[]*\s*((?:\d{1,2}:)?\d{1,2}:\d{2})[\])]?$/);
      if (m) out.push({ time: m[2], title: m[1].trim() });
    });
    return out;
  }
  function fmtChap(s, long) {
    s = Math.floor(s + 1e-6);
    var hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    return long ? hh + ':' + pad(mm) + ':' + pad(ss) : mm + ':' + pad(ss);
  }
  /** YouTube's chapter rules. rows: [{time (string), title}]. Returns {errors[], warnings[], text}. */
  function validateChapters(rows, duration) {
    var errors = [], warnings = [], list = [];
    rows.forEach(function (r, i) {
      var t = parseTime(r.time);
      if (!String(r.time).trim() && !String(r.title).trim()) return;
      if (!isFinite(t) || !/^\s*(\d+:)?\d{1,2}:\d{2}\s*$/.test(r.time)) { errors.push({ row: i, msg: 'Row ' + (i + 1) + ': “' + r.time + '” is not a valid time. Use m:ss or h:mm:ss, like 1:05.' }); return; }
      if (!String(r.title).trim()) warnings.push({ row: i, msg: 'Row ' + (i + 1) + ' has no title.' });
      list.push({ t: t, title: String(r.title).trim(), row: i });
    });
    if (list.length < 3) errors.push({ row: -1, msg: 'YouTube needs at least 3 chapters (you have ' + list.length + ').' });
    if (list.length && list[0].t !== 0) errors.push({ row: list[0].row, msg: 'The first chapter must start at 0:00.' });
    for (var i = 1; i < list.length; i++) {
      if (list[i].t <= list[i - 1].t) errors.push({ row: list[i].row, msg: 'Row ' + (list[i].row + 1) + ': times must go up — ' + fmtChap(list[i].t, list[i].t >= 3600) + ' is not after ' + fmtChap(list[i - 1].t, list[i - 1].t >= 3600) + '.' });
      else if (list[i].t - list[i - 1].t < 10) errors.push({ row: list[i - 1].row, msg: 'Row ' + (list[i - 1].row + 1) + ': chapter “' + (list[i - 1].title || 'untitled') + '” is only ' + Math.round(list[i].t - list[i - 1].t) + ' s long. Each chapter must be at least 10 seconds.' });
    }
    if (duration && list.length) {
      var last = list[list.length - 1];
      if (last.t >= duration) errors.push({ row: last.row, msg: 'Row ' + (last.row + 1) + ': starts after the video ends (' + fmtChap(duration, duration >= 3600) + ').' });
      else if (duration - last.t < 10) errors.push({ row: last.row, msg: 'Row ' + (last.row + 1) + ': the last chapter is only ' + Math.round(duration - last.t) + ' s long. Each chapter must be at least 10 seconds.' });
    }
    var long = list.some(function (x) { return x.t >= 3600; }) || duration >= 3600;
    var text = list.map(function (x) { return fmtChap(x.t, long) + ' ' + (x.title || 'Chapter'); }).join('\n');
    return { errors: errors, warnings: warnings, text: text, count: list.length };
  }

  register('youtube-chapters-generator', function (root) {
    injectCSS();
    var S = newScope();
    var rows = [{ time: '0:00', title: 'Intro' }, { time: '', title: '' }, { time: '', title: '' }];
    var dur = 0, vid = null, touched = false;
    var L = editorLayout(root, 'Your chapters');
    var vidHost = h('div');
    L.left.appendChild(vidHost);
    var rowsEl = h('div.sv-list', { 'aria-label': 'Chapters' });
    var durIn = input('text', '', { inputmode: 'decimal', placeholder: 'e.g. 12:34', autocomplete: 'off', class: 'sv-tin' });
    durIn.addEventListener('change', function () { touched = true; var t = parseTime(durIn.value); dur = isFinite(t) ? t : 0; if (!isFinite(t) && durIn.value.trim()) BT.toast('Use a time like 12:34', 'error'); validate(); });
    var paste = h('textarea', { id: nid(), rows: '5', placeholder: '0:00 Intro\n1:15 Setting up\n4:30 Results' });
    L.left.appendChild(h('div.card', null, [
      h('div.card-title', null, [h('h3', { text: 'Chapters' }), btn('btn-sm', 'plus', 'Add chapter', function () { rows.push({ time: vid ? fmtChap(vid.currentTime, vid.currentTime >= 3600) : '', title: '' }); touched = true; renderRows(true); })]),
      rowsEl,
      h('div', { style: { marginTop: '14px', maxWidth: '220px' } }, [field('Video length (optional)', durIn, 'Lets the tool check the last chapter.')])
    ]));
    L.left.appendChild(h('div.card', { style: { marginTop: '16px' } }, [
      h('div.card-title', null, [h('h3', { text: 'Paste existing timestamps' })]),
      field('One chapter per line', paste),
      btn('btn-sm', 'list', 'Use these lines', function () {
        var p = parseChapters(paste.value);
        if (!p.length) { BT.toast('No timestamps found — use lines like “1:23 Title”', 'error'); return; }
        rows = p; touched = true; renderRows(); BT.toast(p.length + ' chapters loaded');
      })
    ]));
    // optional video
    var dz = BT.dropzone({ accept: VIDEO_ACCEPT, compact: true, title: 'Optional: load your video', hint: 'Set chapter times while watching. Nothing is uploaded.', icon: 'film', color: BRAND,
      onFiles: function (f) { loadVideo(f[0]); } });
    vidHost.appendChild(dz);
    function loadVideo(f) {
      probeElement(f, 'video').then(function (m) {
        if (!m || !m.duration) { BT.toast('Your browser can’t play this video. Type the times instead.', 'error'); return; }
        dur = m.duration; durIn.value = fmtChap(dur, dur >= 3600);
        vid = mediaEl('video', S.url(f), 'Video preview');
        vidHost.innerHTML = '';
        vidHost.appendChild(h('div.sv-stage', { style: { marginBottom: '16px' } }, [vid]));
        renderRows();
      });
    }
    var errEl = h('div', { 'aria-live': 'polite' });
    var outTa = h('textarea.sv-out-text', { id: nid(), rows: '8', readonly: true });
    var copyBtn = btn('btn-primary btn-lg', 'copy', 'Copy for description', function () { BT.copy(outTa.value, 'Chapters copied — paste them into your video description'); });
    L.add(errEl);
    L.add(field('Description text', outTa, 'Paste this anywhere in your YouTube description. YouTube creates chapters automatically when the rules are met.'));
    L.actions.appendChild(copyBtn);
    L.panel.appendChild(h('div.notice', { style: { marginTop: '14px' }, html: BT.icon('info') + '<span>YouTube’s rules: the first chapter starts at <strong>0:00</strong>, there are at least <strong>3</strong> chapters, each is at least <strong>10 seconds</strong> long, and times go up in order.</span>' }));

    function renderRows(focusLast) {
      rowsEl.innerHTML = '';
      rows.forEach(function (r, i) {
        var tIn = input('text', r.time, { 'aria-label': 'Chapter ' + (i + 1) + ' time', placeholder: '0:00', autocomplete: 'off', spellcheck: 'false', class: 'sv-tin' });
        var nIn = input('text', r.title, { 'aria-label': 'Chapter ' + (i + 1) + ' title', placeholder: 'Chapter title', maxlength: '100', autocomplete: 'off' });
        tIn.addEventListener('input', function () { r.time = tIn.value.trim(); touched = true; validate(); });
        nIn.addEventListener('input', function () { r.title = nIn.value; touched = true; validate(); });
        var btns = h('div.sv-btns', { style: { display: 'flex', gap: '6px' } }, [
          vid ? iconBtn('clock', 'Set chapter ' + (i + 1) + ' to the current video time', function () { r.time = fmtChap(vid.currentTime, dur >= 3600); tIn.value = r.time; touched = true; validate(); }) : null,
          iconBtn('trash-2', 'Delete chapter ' + (i + 1), function () { rows.splice(i, 1); touched = true; renderRows(); })
        ]);
        rowsEl.appendChild(h('div.sv-chap', { 'data-row': i }, [tIn, nIn, btns]));
      });
      validate();
      if (focusLast) { var ins = BT.$$('input', rowsEl); if (ins.length) ins[ins.length - 2].focus(); }
    }
    function validate() {
      var r = validateChapters(rows, dur);
      BT.$$('.sv-chap', rowsEl).forEach(function (el) { el.classList.remove('sv-bad'); });
      r.errors.forEach(function (e) { var el = BT.$('.sv-chap[data-row="' + e.row + '"]', rowsEl); if (el) el.classList.add('sv-bad'); });
      errEl.innerHTML = '';
      if (r.errors.length && !touched) {
        errEl.appendChild(h('div.notice', { html: BT.icon('info') + '<span>Add at least 3 chapters with their start times. Problems are listed here as you type.</span>' }));
      } else if (r.errors.length) {
        errEl.appendChild(h('div.notice.error', { html: BT.icon('info') + '<span><strong>Not valid for YouTube yet</strong><ul class="sv-errs">' + r.errors.map(function (e) { return '<li>' + esc(e.msg) + '</li>'; }).join('') + '</ul></span>' }));
      } else {
        errEl.appendChild(h('div.notice.ok', { html: BT.icon('check') + '<span><strong>Looks good — ' + r.count + ' chapters.</strong>' + (r.warnings.length ? ' ' + esc(r.warnings.map(function (w) { return w.msg; }).join(' ')) : '') + '</span>' }));
      }
      errEl.lastChild.style.marginBottom = '14px';
      outTa.value = r.text;
      copyBtn.disabled = !r.text;
    }
    renderRows();
  });

  // Exposed for automated checks only (pure helpers, no side effects).
  BT._sv = { parseSubs: parseSubs, toSrt: toSrt, toVtt: toVtt, validateChapters: validateChapters, parseChapters: parseChapters, pickHighlights: pickHighlights,
    atempoChain: atempoChain, pathExpr: pathExpr, smoothPath: smoothPath, checkVideo: checkVideo, cropGeom: cropGeom };
})();
