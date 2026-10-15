/*
 * BISCS Tools — PDF suite (17 tools).
 * Everything runs locally with pdf-lib (writing) and pdf.js (rendering/text).
 *
 * Structure:
 *   1. Styles (scoped, prefix pdft-)
 *   2. Small helpers (UI controls, ranges, colours, WinAnsi sanitising)
 *   3. Lazy sequential thumbnail renderer (IntersectionObserver)
 *   4. Sortable (pointer based, works for mouse and touch)
 *   5. Shell: dropzone -> workspace (main + options panel + action) -> result
 *   6. Tool implementations
 */
(function () {
  'use strict';
  var BT = window.BT;
  if (!BT) return;
  var h = BT.h, $$ = BT.$$, esc = BT.esc, icon = BT.icon;
  var PDF_COLOR = '#e5484d';
  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  var THUMB_PX = Math.round(160 * DPR);
  var MM = 72 / 25.4;
  var A4 = [595.28, 841.89], LETTER = [612, 792];

  // ================================================================ STYLES
  var CSS = [
    '.pdft{--pdf:#e5484d}',
    '.pdft-intro .dropzone{padding:60px 20px;min-height:280px;border-radius:24px;background:linear-gradient(180deg,var(--surface),var(--surface-2))}',
    '.pdft-intro .dropzone strong{font-size:1.3rem}',
    '.pdft-intro .dropzone .dz-icon{width:76px;height:76px;border-radius:22px}',
    '.pdft-intro .dropzone .dz-icon svg{width:36px;height:36px}',
    '.pdft-pick{margin-top:6px;pointer-events:none;background:#c62a2f!important;color:#fff!important;border-color:transparent!important;box-shadow:0 10px 24px -12px #c62a2f!important}',
    '.pdft-trust{display:flex;flex-wrap:wrap;justify-content:center;gap:8px 22px;margin:16px 0 0;color:var(--text-3);font-size:.86rem}',
    '.pdft-trust span{display:inline-flex;align-items:center;gap:6px}.pdft-trust .icon{color:var(--ok)}',
    '.pdft-msg{margin-top:14px}',
    '.pdft-filebar{display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:16px;box-shadow:var(--shadow-sm)}',
    '.pdft-fico{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;background:var(--pdf);color:#fff;flex:none}',
    '.pdft-finfo{min-width:0;flex:1}.pdft-fname{font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.pdft-warnslot:not(:empty){margin:-6px 0 16px}',
    '.pdft-layout{display:grid;gap:20px;grid-template-columns:minmax(0,1fr);align-items:start}',
    '.pdft-main{min-width:0;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;min-height:240px}',
    '.pdft-side{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow);overflow:hidden}',
    '.pdft-opts{padding:18px}.pdft-opts>h3{margin:0 0 14px;font-size:1.05rem}',
    '.pdft-opts:empty{display:none}',
    '.pdft-sec{margin-bottom:16px}.pdft-sec:last-child{margin-bottom:0}.pdft-sec>.label{display:block;margin-bottom:8px}',
    '.pdft-act{padding:16px 18px;border-top:1px solid var(--border);background:var(--surface-2);display:flex;flex-direction:column;gap:10px}',
    '.pdft-opts:empty+.pdft-act{border-top:0}',
    '.pdft-act>div:empty{display:none}',
    '@media (min-width:960px){.pdft-layout{grid-template-columns:minmax(0,1fr) 340px}.pdft-side{position:sticky;top:80px;max-height:calc(100vh - 96px);display:flex;flex-direction:column}.pdft-opts{overflow:auto;flex:1 1 auto}.pdft-act{flex:none}}',
    '@media (max-width:959px){.pdft-side{display:contents}.pdft-opts{order:-1;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg)}.pdft-act{order:5;position:sticky;bottom:8px;z-index:30;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--glass);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:var(--shadow-lg);padding:12px}}',
    '.pdft-seg{display:flex;width:100%}.pdft-seg button{flex:1 1 auto;padding:7px 8px}',
    '.pdft .toolbar .btn .icon{width:1em;height:1em}',
    '.pdft-hint{font-size:.82rem;color:var(--text-3);margin:8px 0 0}',
    '.pdft-err{color:var(--danger)!important;min-height:0}',
    '.pdft-err:empty{display:none}',
    '.pdft-count{font-weight:650;color:var(--text-2);font-size:.88rem}',
    /* thumbs */
    '.pdft .thumbs{grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:12px}',
    '@media (max-width:480px){.pdft .thumbs{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '.pdft-thumb{outline:none}.pdft-thumb:focus-visible{box-shadow:var(--ring)}',
    '.pdft-thumb.pdft-static{cursor:default}.pdft-thumb.pdft-static:hover{transform:none;box-shadow:none}',
    '.pdft-tw{position:relative;aspect-ratio:1/1.08}',
    '.pdft .thumb .pdft-tw canvas,.pdft .thumb .pdft-tw img{position:absolute;inset:0;margin:auto;width:auto;height:auto;max-width:100%;max-height:100%;transition:transform .25s cubic-bezier(.2,.8,.2,1),filter .2s}',
    '.pdft-ph{position:absolute;inset:4% 16%;border-radius:4px;background:linear-gradient(90deg,var(--surface-2),var(--border),var(--surface-2));background-size:200% 100%;animation:pdft-sh 1.3s infinite linear}',
    '@keyframes pdft-sh{to{background-position:-200% 0}}',
    '.pdft .thumb .thumb-actions{left:12px;flex-wrap:wrap;justify-content:flex-end;z-index:3}',
    '.pdft .thumb .thumb-actions button:hover{color:var(--brand);border-color:var(--brand)}',
    '.pdft .thumb .thumb-actions button.danger:hover{color:var(--danger);border-color:var(--danger)}',
    '.pdft .thumb .thumb-actions .icon{width:15px;height:15px}',
    '@media (hover:none){.pdft .thumb .thumb-actions{opacity:1}}',
    '.pdft .thumb .check-badge{z-index:3}.pdft .thumb .check-badge .icon{width:14px;height:14px}',
    '.pdft .thumb.removed .check-badge{display:none}',
    '.pdft-thumb .pdft-rbadge{position:absolute;left:12px;bottom:34px;z-index:3;font-size:.7rem;font-weight:700;padding:1px 7px;border-radius:99px;background:var(--brand);color:#fff}',
    '.pdft-thumb.pdft-g{border-color:color-mix(in srgb,var(--g) 60%,var(--border))}',
    '.pdft-thumb.pdft-g .pg{color:var(--g)}',
    '.pdft-thumb.pdft-out{opacity:.38}',
    '.pdft-cutmode .thumb.selected{border-color:var(--pdf);background:color-mix(in srgb,var(--pdf) 10%,var(--surface))}',
    '.pdft-cutmode .thumb.selected .check-badge{background:var(--pdf)}',
    '.pdft-cutmode .thumb.selected::after{content:"";position:absolute;top:8px;bottom:8px;right:-9px;border-right:3px dashed var(--pdf)}',
    '.pdft-gray .thumb canvas{filter:grayscale(1)}',
    '.pdft-blank{background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.15);border-radius:4px}',
    'body.pdft-dragging,body.pdft-dragging *{user-select:none!important;cursor:grabbing!important}',
    '.pdft-ghost{position:fixed;pointer-events:none;z-index:1000;opacity:.92;transform:rotate(2deg) scale(1.02);box-shadow:var(--shadow-lg)!important;margin:0}',
    '.pdft .thumb.dragging,.pdft .file-item.dragging{opacity:.35}',
    '.pdft .thumb.drop-before{box-shadow:-5px 0 0 0 var(--brand)}.pdft .thumb.drop-after{box-shadow:5px 0 0 0 var(--brand)}',
    '.pdft .file-item.drop-before{box-shadow:0 -3px 0 0 var(--brand)}.pdft .file-item.drop-after{box-shadow:0 3px 0 0 var(--brand)}',
    '.pdft-grip{cursor:grab;touch-action:none;border:0;background:transparent;color:var(--text-3);width:28px;height:40px;display:grid;place-items:center;border-radius:8px;flex:none;padding:0}',
    '.pdft-grip:hover{color:var(--text);background:var(--surface-2)}',
    '.pdft .thumb-actions .pdft-grip{width:28px;height:28px;border:1px solid var(--border);background:var(--surface);color:var(--text)}',
    '.pdft-fitem{padding:8px 10px;gap:10px;box-shadow:var(--shadow-sm)}',
    '.pdft-fthumb{width:44px;height:56px;flex:none;position:relative;border-radius:6px;background:var(--surface-2);border:1px solid var(--border)}',
    '.pdft-fthumb canvas,.pdft-fthumb img{position:absolute;inset:0;margin:auto;max-width:100%;max-height:100%;box-shadow:0 1px 3px rgba(0,0,0,.2)}',
    '.pdft-fitem .pdft-fmeta{flex:1;min-width:0}',
    '.pdft-fitem.pdft-bad{border-color:var(--danger)}.pdft-fitem.pdft-bad .meta{color:var(--danger)}',
    '.pdft-ibtns{display:flex;gap:4px;flex:none}',
    '.pdft-ibtn{width:34px;height:34px;border-radius:9px;border:1px solid var(--border);background:var(--surface);color:var(--text-2);display:inline-grid;place-items:center;cursor:pointer;padding:0}',
    '.pdft-ibtn:hover{color:var(--brand);border-color:var(--brand)}.pdft-ibtn.danger:hover{color:var(--danger);border-color:var(--danger)}',
    '.pdft-ibtn:disabled{opacity:.35;cursor:default;color:var(--text-3);border-color:var(--border)}',
    '.pdft-ibtn .icon{width:16px;height:16px}',
    '.pdft-up .icon{transform:rotate(180deg)}',
    '@media (max-width:520px){.pdft-fitem .pdft-fthumb{display:none}.pdft-ibtn{width:32px;height:32px}}',
    '.pdft-addzone{margin-top:12px}',
    '.pdft-choices{display:flex;flex-direction:column;gap:8px}',
    '.pdft-choice{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border:2px solid var(--border);border-radius:12px;cursor:pointer;background:var(--surface);text-align:left;font:inherit;color:inherit;width:100%}',
    '.pdft-choice:hover{border-color:var(--border-strong)}',
    '.pdft-choice[aria-checked="true"]{border-color:var(--brand);background:var(--brand-soft)}',
    '.pdft-choice .pdft-radio{width:18px;height:18px;border-radius:50%;border:2px solid var(--border-strong);flex:none;margin-top:2px;display:grid;place-items:center}',
    '.pdft-choice[aria-checked="true"] .pdft-radio{border-color:var(--brand)}',
    '.pdft-choice[aria-checked="true"] .pdft-radio::after{content:"";width:8px;height:8px;border-radius:50%;background:var(--brand)}',
    '.pdft-choice strong{display:block;font-size:.95rem}.pdft-choice small{display:block;color:var(--text-3);font-size:.8rem;line-height:1.4;margin-top:2px}',
    /* result */
    '.pdft-result{max-width:780px;margin:0 auto;text-align:center;padding:36px 24px}',
    '.pdft-done{width:76px;height:76px;border-radius:50%;margin:0 auto 14px;display:grid;place-items:center;background:var(--ok-soft);color:var(--ok)}',
    '.pdft-done .icon{width:38px;height:38px}',
    '.pdft-done.pdft-warnico{background:var(--warn-soft);color:var(--warn)}',
    '.pdft-result h2{font-size:1.5rem;margin-bottom:6px}',
    '.pdft-result .stats{margin:20px 0;text-align:left}',
    '.pdft-result .btn-group{justify-content:center}',
    '.pdft-result .notice{text-align:left;margin:16px 0}',
    '.pdft-next{margin-top:28px;padding-top:20px;border-top:1px solid var(--border)}.pdft-next .chips{justify-content:center}',
    '.pdft-next .chip .icon{color:var(--pdf)}',
    '.pdft-good{color:var(--ok)}.pdft-badv{color:var(--danger)}',
    /* preview */
    '.pdft-preview{display:flex;flex-direction:column;align-items:center;gap:12px}',
    '.pdft-pnav{display:flex;align-items:center;gap:10px;font-weight:600;font-size:.9rem;color:var(--text-2)}',
    '.pdft-pv{position:relative;line-height:0;box-shadow:var(--shadow);background:#fff;border-radius:2px;max-width:100%}',
    '.pdft-pv canvas{max-width:100%;height:auto}',
    /* position picker */
    '.pdft-pos{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:1fr 1fr;width:150px;height:112px;padding:8px;border:2px solid var(--border-strong);border-radius:8px;background:var(--surface);gap:4px 0;position:relative}',
    '.pdft-pos::before{content:"";position:absolute;left:22px;right:22px;top:42px;bottom:42px;background:repeating-linear-gradient(var(--border) 0 3px,transparent 3px 9px);opacity:.8}',
    '.pdft-pos button{width:26px;height:26px;border-radius:50%;border:2px solid var(--border-strong);background:var(--surface);cursor:pointer;padding:0;z-index:1}',
    '.pdft-pos button:nth-child(-n+3){align-self:start}.pdft-pos button:nth-child(n+4){align-self:end}',
    '.pdft-pos button:nth-child(3n+1){justify-self:start}.pdft-pos button:nth-child(3n+2){justify-self:center}.pdft-pos button:nth-child(3n){justify-self:end}',
    '.pdft-pos button[aria-pressed="true"]{background:var(--brand);border-color:var(--brand)}',
    /* crop */
    '.pdft-crop-wrap{display:flex;flex-direction:column;align-items:center;gap:12px}',
    '.pdft-stage{position:relative;line-height:0;touch-action:none;user-select:none;overflow:hidden;box-shadow:var(--shadow);background:#fff;cursor:crosshair}',
    '.pdft-stage canvas{display:block}',
    '.pdft-crect{position:absolute;outline:2px solid var(--brand);box-shadow:0 0 0 9999px rgba(10,12,30,.5);cursor:move}',
    '.pdft-crect::before,.pdft-crect::after{content:"";position:absolute;pointer-events:none;border:0 dashed rgba(255,255,255,.7)}',
    '.pdft-crect::before{left:33.3%;right:33.3%;top:0;bottom:0;border-left-width:1px;border-right-width:1px}',
    '.pdft-crect::after{top:33.3%;bottom:33.3%;left:0;right:0;border-top-width:1px;border-bottom-width:1px}',
    '.pdft-hd{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;background:#fff;border:2px solid var(--brand);border-radius:4px;z-index:2}',
    '@media (pointer:coarse){.pdft-hd{width:24px;height:24px;margin:-12px 0 0 -12px}}',
    '.pdft-mm{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
    '.pdft-mm .field{margin:0}',
    /* text output */
    '.pdft-tpage{background:var(--surface);border:1px solid var(--border);border-radius:12px;margin-bottom:12px;overflow:hidden}',
    '.pdft-tph{display:flex;justify-content:space-between;padding:8px 14px;border-bottom:1px solid var(--border);font-weight:650;font-size:.82rem;color:var(--text-3);background:var(--surface-2)}',
    '.pdft-tpage pre{margin:0;padding:14px;white-space:pre-wrap;word-break:break-word;font-family:var(--mono);font-size:.85rem;line-height:1.55;max-height:460px;overflow:auto;color:var(--text)}',
    '.pdft-tpage pre:empty::before{content:"(no text on this page)";color:var(--text-3);font-style:italic}',
    /* images out */
    '.pdft-imgs{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:18px;text-align:left}',
    '.pdft-imgc{border:1px solid var(--border);border-radius:12px;padding:8px;background:var(--surface-2);display:flex;flex-direction:column;gap:8px}',
    '.pdft-imgc .pdft-tw img{position:absolute;inset:0;margin:auto;max-width:100%;max-height:100%;box-shadow:0 1px 4px rgba(0,0,0,.15);background:#fff}',
    '.pdft-imgc .small{display:flex;justify-content:space-between;color:var(--text-3)}',
    /* forms */
    '.pdft-fgroup{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:14px}',
    '.pdft-fgroup>h3{display:flex;align-items:center;gap:8px;font-size:.95rem;margin:0 0 12px;color:var(--text-2)}',
    '.pdft-fgroup .field:last-child{margin-bottom:0}',
    '.pdft-radios{display:flex;flex-wrap:wrap;gap:8px 18px}',
    '.pdft-ro{font-size:.75rem;color:var(--text-3);font-weight:500;margin-left:6px}',
    '.pdft-editor textarea{min-height:380px;font-family:var(--mono);font-size:.88rem}',
    '.pdft-wmimg{display:flex;align-items:center;gap:10px}.pdft-wmimg img{max-width:60px;max-height:40px;border:1px solid var(--border);border-radius:6px;background:#fff}',
    '.pdft-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pdft-row2 .field{margin-bottom:0}',
    '.pdft-row3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.pdft-row3 .field{margin-bottom:0}',
    '.pdft-inline{display:flex;align-items:center;gap:10px}.pdft-inline input[type=range]{flex:1}',
    '.pdft-val{font-variant-numeric:tabular-nums;font-weight:650;min-width:3.2em;text-align:right;font-size:.88rem}'
  ].join('\n');

  function injectStyle() {
    if (document.getElementById('pdft-style')) return;
    var s = document.createElement('style');
    s.id = 'pdft-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // =============================================================== HELPERS
  var uidN = 0;
  function uid(p) { return (p || 'pdft') + '-' + (++uidN); }
  function norm(a) { a = Math.round(a / 90) * 90; return ((a % 360) + 360) % 360; }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function libs() { return Promise.all([BT.loadLib('pdflib'), BT.loadLib('pdfjs')]); }
  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }

  function friendlyPdfError(e) {
    var n = (e && e.name) || '', m = (e && e.message) || String(e);
    if (n === 'PasswordException' || /password/i.test(m)) return 'This PDF is password protected. Open it with its password and save an unprotected copy, then try again.';
    if (n === 'InvalidPDFException' || n === 'FormatError' || /Invalid PDF|No PDF header/i.test(m)) return 'This file does not look like a valid PDF, or it is damaged.';
    return m;
  }

  /** "1-3, 5" from sorted/unsorted 0-based indexes. */
  function toRanges(idx) {
    var a = idx.slice().sort(function (x, y) { return x - y; }), out = [], i = 0;
    while (i < a.length) {
      var s = a[i], e = s;
      while (i + 1 < a.length && a[i + 1] === e + 1) { e = a[++i]; }
      out.push(s === e ? String(s + 1) : (s + 1) + '-' + (e + 1));
      i++;
    }
    return out.join(', ');
  }

  /** "1-3, 4-6" -> [[0,1,2],[3,4,5]] (one group per comma part). */
  function parseGroups(str, total) {
    var parts = String(str || '').split(',').map(function (p) { return p.trim(); }).filter(Boolean);
    if (!parts.length) throw new Error('Enter at least one page range, e.g. 1-3, 4-6');
    return parts.map(function (p) { return BT.parsePageRanges(p, total); });
  }

  function hexToRgb(hex) {
    var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '') || [0, '00', '00', '00'];
    return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
  }
  function pdfColor(hex) { var c = hexToRgb(hex); return PDFLib.rgb(c[0], c[1], c[2]); }

  /** Detects an /Encrypt entry near the start or end of the file (cheap heuristic). */
  function looksEncrypted(buf) {
    var u = new Uint8Array(buf), n = u.length, W = 65536;
    function scan(a, b) {
      var s = '';
      for (var i = a; i < b; i++) s += String.fromCharCode(u[i]);
      return s.indexOf('/Encrypt') !== -1;
    }
    return scan(Math.max(0, n - W), n) || (n > W && scan(0, Math.min(W, n)));
  }

  /**
   * Standard 14 fonts only cover WinAnsi. Returns a function that replaces
   * unsupported characters with "?" and records them.
   */
  function winAnsiSanitizer(font) {
    var cache = {};
    var bad = {};
    function ok(ch) {
      if (cache[ch] !== undefined) return cache[ch];
      try { font.widthOfTextAtSize(ch, 10); cache[ch] = true; } catch (e) { cache[ch] = false; }
      return cache[ch];
    }
    function clean(str) {
      var out = '';
      Array.from(String(str)).forEach(function (ch) {
        if (ch === '\n' || ch === '\r') { out += ch; return; }
        if (ch === '\t') { out += '    '; return; }
        if (ok(ch)) out += ch;
        else { bad[ch] = (bad[ch] || 0) + 1; out += '?'; }
      });
      return out;
    }
    clean.bad = function () { return Object.keys(bad); };
    clean.badCount = function () { return Object.keys(bad).reduce(function (s, k) { return s + bad[k]; }, 0); };
    return clean;
  }
  function badCharsNote(clean) {
    var list = clean.bad();
    if (!list.length) return '';
    return clean.badCount() + ' character(s) are not supported by the standard PDF fonts and were replaced with "?" (' +
      list.slice(0, 12).join(' ') + (list.length > 12 ? ' …' : '') + '). Hindi and other non-Latin scripts need an embedded Unicode font, which this tool does not include.';
  }

  /**
   * Visual placement helper for a pdf-lib page: works in "visual" coordinates
   * (as the page is displayed, after /Rotate and inside the CropBox, origin
   * bottom-left) and converts them to the page's user space.
   */
  function placer(page) {
    var box = page.getCropBox();
    var rot = norm(page.getRotation().angle);
    var W = box.width, H = box.height;
    var swap = rot === 90 || rot === 270;
    return {
      vw: swap ? H : W, vh: swap ? W : H, rot: rot,
      at: function (vx, vy) {
        var u, v;
        if (rot === 0) { u = vx; v = vy; }
        else if (rot === 90) { u = W - vy; v = vx; }
        else if (rot === 180) { u = W - vx; v = H - vy; }
        else { u = vy; v = H - vx; }
        return { x: box.x + u, y: box.y + v };
      }
    };
  }
  function rotVec(dx, dy, deg) {
    var r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    return [dx * c - dy * s, dx * s + dy * c];
  }

  // ------------------------------------------------------------ UI controls
  function field(label, control, hint) {
    if (!control.id) control.id = uid('f');
    return h('div.field', null, [
      h('label', { text: label, 'for': control.id }),
      control,
      hint ? h('div.hint', { text: hint }) : null
    ]);
  }
  function sec(title, children) {
    return h('div.pdft-sec', null, [title ? h('span.label', { text: title }) : null].concat(children || []));
  }
  function seg(options, value, onChange, label) {
    var wrap = h('div.seg.pdft-seg', { role: 'group', 'aria-label': label || '' });
    var cur = value;
    options.forEach(function (o) {
      var b = h('button', { type: 'button', text: o[1] });
      b._v = o[0];
      b.addEventListener('click', function () { set(o[0]); if (onChange) onChange(o[0]); });
      wrap.appendChild(b);
    });
    function set(v) {
      cur = v;
      Array.prototype.forEach.call(wrap.children, function (b) {
        b.classList.toggle('active', b._v === v);
        b.setAttribute('aria-pressed', b._v === v ? 'true' : 'false');
      });
    }
    set(value);
    wrap.get = function () { return cur; };
    wrap.set = set;
    return wrap;
  }
  function choices(list, value, onChange) {
    var wrap = h('div.pdft-choices', { role: 'radiogroup' });
    var cur = value;
    list.forEach(function (c) {
      var b = h('button.pdft-choice', { type: 'button', role: 'radio' }, [
        h('span.pdft-radio'),
        h('span', null, [h('strong', { text: c.title }), h('small', { text: c.desc })])
      ]);
      b._v = c.v;
      b.addEventListener('click', function () { set(c.v); if (onChange) onChange(c.v); });
      wrap.appendChild(b);
    });
    function set(v) {
      cur = v;
      Array.prototype.forEach.call(wrap.children, function (b) { b.setAttribute('aria-checked', b._v === v ? 'true' : 'false'); });
    }
    set(value);
    wrap.get = function () { return cur; };
    return wrap;
  }
  function numInput(value, min, max, step) {
    return h('input', { type: 'number', value: String(value), min: min, max: max, step: step || 1, inputMode: 'decimal' });
  }
  function select(options, value) {
    var s = h('select');
    options.forEach(function (o) { s.appendChild(h('option', { value: o[0], text: o[1], selected: o[0] === value })); });
    return s;
  }
  function checkbox(label, checked) {
    var input = h('input', { type: 'checkbox', checked: !!checked });
    var l = h('label.check', null, [input, h('span', { text: label })]);
    l.input = input;
    return l;
  }
  function rangeCtl(value, min, max, step, fmt) {
    var r = h('input', { type: 'range', min: min, max: max, step: step || 1, value: String(value) });
    var v = h('span.pdft-val');
    function upd() { v.textContent = fmt ? fmt(+r.value) : r.value; }
    r.addEventListener('input', upd);
    upd();
    var wrap = h('div.pdft-inline', null, [r, v]);
    wrap.input = r;
    return wrap;
  }
  function ibtn(name, label, onClick, cls) {
    return h('button.pdft-ibtn' + (cls ? '.' + cls : ''), { type: 'button', title: label, 'aria-label': label, html: icon(name), onclick: onClick });
  }
  function notice(kind, text, iconName) {
    return h('div.notice' + (kind ? '.' + kind : ''), { html: icon(iconName || 'info') + '<span>' + esc(text) + '</span>' });
  }
  function filePicker(accept, multiple, onFiles) {
    var input = h('input.hidden', { type: 'file', accept: accept, multiple: !!multiple });
    input.addEventListener('change', function () {
      var files = filterAccept(input.files, accept);
      input.value = '';
      if (files.length) onFiles(files);
    });
    document.body.appendChild(input);
    return input;
  }
  function filterAccept(list, accept) {
    var files = Array.prototype.slice.call(list || []);
    if (!accept) return files;
    var acc = accept.split(',').map(function (s) { return s.trim().toLowerCase(); });
    var ok = files.filter(function (f) {
      var n = f.name.toLowerCase(), t = (f.type || '').toLowerCase();
      return acc.some(function (a) {
        if (a[0] === '.') return n.slice(-a.length) === a;
        if (a.slice(-2) === '/*') return t.indexOf(a.slice(0, -1)) === 0;
        return t === a;
      });
    });
    if (!ok.length && files.length) BT.toast('That file type is not supported here', 'error');
    return ok;
  }

  // ===================================================== LAZY THUMB QUEUE
  var queue = [], qBusy = false, io = null;
  function pump() {
    if (qBusy || !queue.length) return;
    var job = queue.shift();
    qBusy = true;
    Promise.resolve().then(job).catch(function (e) { console.warn('thumbnail', e); })
      .then(function () { qBusy = false; pump(); });
  }
  function enqueue(fn) { queue.push(fn); pump(); }
  /** Run fn (returns a promise) once el scrolls near the viewport; one job at a time. */
  function lazy(el, fn) {
    var run = function () { if (el.isConnected) return fn(); };
    if (!('IntersectionObserver' in window)) { enqueue(run); return; }
    if (!io) {
      io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          var f = en.target._pdftJob;
          en.target._pdftJob = null;
          if (f) enqueue(f);
        });
      }, { rootMargin: '400px 0px' });
    }
    el._pdftJob = run;
    io.observe(el);
  }
  function renderThumb(pdf, n, px) {
    return pdf.getPage(n).then(function (page) {
      var vp = page.getViewport({ scale: 1 });
      return BT.renderPdfPage(page, (px || THUMB_PX) / Math.max(vp.width, vp.height)).then(function (r) {
        page.cleanup();
        return r.canvas;
      });
    });
  }
  function pageThumb(label) {
    var box = h('div.pdft-tw', null, h('div.pdft-ph'));
    var el = h('div.thumb.pdft-thumb', { tabindex: '0', role: 'button' }, [
      h('span.check-badge', { html: icon('check') }), box, h('div.pg', { text: label })
    ]);
    el.box = box;
    el.pg = el.lastChild;
    return el;
  }
  function setThumbCanvas(el, c) { el.box.innerHTML = ''; el.box.appendChild(c); }
  function fillThumb(el, pdf, n) {
    lazy(el, function () {
      return renderThumb(pdf, n).then(function (c) { setThumbCanvas(el, c); });
    });
  }
  function blankCanvas(w, hh) {
    var c = h('canvas.pdft-blank');
    var s = THUMB_PX / Math.max(w, hh);
    c.width = Math.round(w * s); c.height = Math.round(hh * s);
    var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    return c;
  }

  /**
   * Thumbnail grid for one PDF. mode: 'select' | 'remove' | 'none'.
   * opts.onChange(indexes, source) fires on every change.
   */
  function pageGrid(st, opts) {
    opts = opts || {};
    var mode = opts.mode || 'select';
    var cls = mode === 'remove' ? 'removed' : 'selected';
    var grid = h('div.thumbs.pdft-grid');
    var on = [], thumbs = [], last = -1;
    var api = {
      el: grid, thumbs: thumbs,
      get: function () { var a = []; on.forEach(function (v, i) { if (v) a.push(i); }); return a; },
      set: function (idx, src) {
        for (var i = 0; i < on.length; i++) on[i] = false;
        idx.forEach(function (i) { on[i] = true; });
        thumbs.forEach(function (_, i) { paint(i); });
        changed(src);
      },
      toggle: function (i) { on[i] = !on[i]; paint(i); changed('grid'); }
    };
    function paint(i) {
      thumbs[i].classList.toggle(cls, !!on[i]);
      if (mode !== 'none') thumbs[i].setAttribute('aria-pressed', on[i] ? 'true' : 'false');
    }
    function changed(src) { if (opts.onChange) opts.onChange(api.get(), src || 'grid'); }
    for (var i = 0; i < st.pages; i++) {
      (function (i) {
        var el = pageThumb(String(i + 1));
        el.setAttribute('aria-label', 'Page ' + (i + 1));
        on.push(false);
        if (mode === 'none') {
          el.classList.add('pdft-static');
          el.removeAttribute('tabindex');
          el.removeAttribute('role');
        } else {
          el.addEventListener('click', function (e) {
            if (e.target.closest('.thumb-actions')) return;
            if (e.shiftKey && last >= 0 && last !== i) {
              var val = !on[i], a = Math.min(last, i), b = Math.max(last, i);
              for (var k = a; k <= b; k++) { on[k] = val; paint(k); }
              changed('grid');
            } else api.toggle(i);
            last = i;
          });
          el.addEventListener('keydown', function (e) {
            if ((e.key === 'Enter' || e.key === ' ') && e.target === el) { e.preventDefault(); el.click(); }
          });
        }
        fillThumb(el, st.pdf, i + 1);
        if (opts.decorate) opts.decorate(el, i);
        thumbs.push(el);
        grid.appendChild(el);
      })(i);
    }
    return api;
  }

  /** Page-range text input kept in sync with a pageGrid. */
  function rangeField(st, grid, label, hint) {
    var input = h('input', { type: 'text', placeholder: 'e.g. 1-3, 5, 8-', autocomplete: 'off', spellcheck: false });
    var err = h('div.hint.pdft-err', { role: 'alert' });
    input.addEventListener('input', function () {
      var v = input.value.trim();
      try {
        var idx = v ? BT.parsePageRanges(v, st.pages) : [];
        err.textContent = '';
        input.removeAttribute('aria-invalid');
        grid.set(idx, 'input');
      } catch (e) {
        err.textContent = e.message;
        input.setAttribute('aria-invalid', 'true');
      }
    });
    var f = field(label, input, hint);
    f.appendChild(err);
    f.input = input;
    f.sync = function (idx, src) {
      if (src === 'input') return;
      input.value = toRanges(idx);
      err.textContent = '';
      input.removeAttribute('aria-invalid');
    };
    return f;
  }

  // ============================================================ SORTABLE
  /**
   * Pointer-based drag reordering. Mouse can drag the whole item; touch and pen
   * only drag from the handle so the page can still scroll.
   * opts: { item: selector, handle: selector, axis: 'x'|'y', onReorder() }
   */
  function sortable(container, opts) {
    var d = null, suppress = false;
    container.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      var item = e.target.closest(opts.item);
      if (!item || !container.contains(item)) return;
      var onHandle = opts.handle && e.target.closest(opts.handle);
      if (!onHandle) {
        if (e.pointerType !== 'mouse') return;
        if (e.target.closest('button,input,select,textarea,a,label')) return;
      }
      d = { item: item, x0: e.clientX, y0: e.clientY, started: false, over: null, after: false };
      if (onHandle) e.preventDefault();
    });
    container.addEventListener('click', function (e) {
      if (suppress) { e.stopPropagation(); e.preventDefault(); suppress = false; }
    }, true);
    function clearMarks() {
      $$('.drop-before,.drop-after', container).forEach(function (el) { el.classList.remove('drop-before', 'drop-after'); });
    }
    function move(e) {
      if (!d) return;
      if (!d.started) {
        if (Math.abs(e.clientX - d.x0) + Math.abs(e.clientY - d.y0) < 6) return;
        d.started = true;
        var r = d.item.getBoundingClientRect();
        d.dx = d.x0 - r.left; d.dy = d.y0 - r.top;
        d.ghost = d.item.cloneNode(true);
        var src = d.item.querySelectorAll('canvas'), dst = d.ghost.querySelectorAll('canvas');
        for (var i = 0; i < src.length; i++) { try { dst[i].getContext('2d').drawImage(src[i], 0, 0); } catch (er) { /* ignore */ } }
        d.ghost.classList.add('pdft-ghost');
        d.ghost.style.width = r.width + 'px';
        d.ghost.style.height = r.height + 'px';
        document.body.appendChild(d.ghost);
        d.item.classList.add('dragging');
        document.body.classList.add('pdft-dragging');
      }
      e.preventDefault();
      d.ghost.style.left = (e.clientX - d.dx) + 'px';
      d.ghost.style.top = (e.clientY - d.dy) + 'px';
      var el = document.elementFromPoint(e.clientX, e.clientY);
      var over = el && el.closest(opts.item);
      clearMarks();
      d.over = null;
      if (over && over !== d.item && container.contains(over)) {
        var rr = over.getBoundingClientRect();
        d.after = opts.axis === 'y' ? e.clientY > rr.top + rr.height / 2 : e.clientX > rr.left + rr.width / 2;
        d.over = over;
        over.classList.add(d.after ? 'drop-after' : 'drop-before');
      }
      if (e.clientY < 70) window.scrollBy(0, -12);
      else if (e.clientY > window.innerHeight - 70) window.scrollBy(0, 12);
    }
    function end(cancel) {
      if (!d) return;
      if (d.started) {
        suppress = true;
        setTimeout(function () { suppress = false; }, 0);
        d.ghost.remove();
        d.item.classList.remove('dragging');
        document.body.classList.remove('pdft-dragging');
        clearMarks();
        if (!cancel && d.over) {
          container.insertBefore(d.item, d.after ? d.over.nextSibling : d.over);
          if (opts.onReorder) opts.onReorder();
        }
      }
      d = null;
    }
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', function () { end(false); });
    window.addEventListener('pointercancel', function () { end(true); });
  }

  // ================================================================ SHELL
  var NEXT = ['compress-pdf', 'merge-pdf', 'split-pdf', 'organize-pdf', 'pdf-page-numbers', 'watermark-pdf', 'rotate-pdf', 'pdf-editor', 'sign-pdf', 'pdf-to-jpg'];

  /**
   * Builds the standard layout. cfg: {
   *   accept, multiple, dzTitle, dzHint, onFiles(files), actionLabel, actionIcon,
   *   busyLabel, run(S) -> Promise<result|null>, startInWork, noFilebar
   * }
   * A result is { data|files, name, zipName, mime, title, stats:[[l,v]], note, noteKind, extra, noAutoDownload }.
   */
  function shell(root, ctx, cfg) {
    injectStyle();
    var tool = ctx.tool || { id: '', icon: 'file-text', name: 'PDF' };
    var S = { tool: tool, state: null };
    var app = h('div.pdft');
    root.appendChild(app);
    var accept = cfg.accept || '.pdf,application/pdf';

    // ---- intro
    var intro = h('div.pdft-intro');
    var msg = h('div.pdft-msg');
    if (!cfg.startInWork) {
      var dz = BT.dropzone({
        accept: accept, multiple: !!cfg.multiple, color: PDF_COLOR, icon: tool.icon,
        title: cfg.dzTitle || (cfg.multiple ? 'Select PDF files' : 'Select a PDF file'),
        hint: cfg.dzHint || 'or drag and drop it here',
        onFiles: function (files) { cfg.onFiles(files); }
      });
      dz.appendChild(h('span.btn.btn-lg.pdft-pick', { html: icon('upload') + ' ' + esc(cfg.multiple ? 'Choose files' : 'Choose file') }));
      intro.appendChild(dz);
      intro.appendChild(msg);
      intro.appendChild(h('p.pdft-trust', {
        html: '<span>' + icon('lock') + 'Processed on your device</span><span>' + icon('check') + 'No sign-up, no watermark</span><span>' + icon('zap') + 'Fast and free</span>'
      }));
      S.dropzone = dz;
    }

    // ---- workspace
    var work = h('div.pdft-work' + (cfg.startInWork ? '' : '.hidden'));
    var filebar = h('div.pdft-filebar.hidden');
    var warnslot = h('div.pdft-warnslot');
    var main = h('div.pdft-main');
    var opts = h('div.pdft-opts');
    var act = h('div.pdft-act');
    var side = h('aside.pdft-side', { 'aria-label': 'Options' }, [opts, act]);
    work.appendChild(filebar);
    work.appendChild(warnslot);
    work.appendChild(h('div.pdft-layout', null, [main, side]));
    var resultWrap = h('div.pdft-resultwrap.hidden');
    app.appendChild(intro);
    app.appendChild(work);
    app.appendChild(resultWrap);

    var actionBtn = h('button.btn.btn-primary.btn-lg.btn-block.pdft-go', {
      type: 'button', html: icon(cfg.actionIcon || tool.icon) + ' ' + esc(cfg.actionLabel || 'Apply')
    });
    var prog = h('div.progress.hidden', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100' }, h('span'));
    var status = h('div.pdft-status.small.muted', { 'aria-live': 'polite' });
    var errBox = h('div');
    act.appendChild(actionBtn);
    act.appendChild(prog);
    act.appendChild(status);
    act.appendChild(errBox);

    // Drop files anywhere on the workspace
    work.addEventListener('dragover', function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') !== -1) e.preventDefault(); });
    work.addEventListener('drop', function (e) {
      if (!e.dataTransfer || !e.dataTransfer.files.length) return;
      e.preventDefault();
      var files = filterAccept(e.dataTransfer.files, accept);
      if (files.length) cfg.onFiles(files);
    });

    var picker = cfg.onFiles ? filePicker(accept, cfg.multiple, function (files) { cfg.onFiles(files); }) : null;

    S.app = app; S.main = main; S.opts = opts; S.act = act; S.work = work; S.filebar = filebar;
    S.actionBtn = actionBtn; S.warnslot = warnslot; S.picker = picker;

    S.pick = function () { if (picker) picker.click(); };
    S.loading = function (text) {
      msg.innerHTML = '<div class="notice"><span class="spinner"></span><span>' + esc(text) + '</span></div>';
    };
    S.introError = function (text) {
      intro.classList.remove('hidden');
      work.classList.add('hidden');
      resultWrap.classList.add('hidden');
      msg.innerHTML = '';
      msg.appendChild(notice('error', text));
    };
    S.showWork = function () {
      msg.innerHTML = '';
      intro.classList.add('hidden');
      resultWrap.classList.add('hidden');
      work.classList.remove('hidden');
      errBox.innerHTML = '';
    };
    S.reset = function () {
      if (cfg.onReset) cfg.onReset();
      if (S.state && S.state.pdf) { try { S.state.pdf.destroy(); } catch (e) { /* ignore */ } }
      S.state = null;
      main.innerHTML = ''; opts.innerHTML = ''; warnslot.innerHTML = '';
      msg.innerHTML = '';
      resultWrap.classList.add('hidden');
      if (cfg.startInWork) { work.classList.remove('hidden'); if (cfg.rebuild) cfg.rebuild(); }
      else { work.classList.add('hidden'); intro.classList.remove('hidden'); }
      window.scrollTo({ top: Math.max(0, app.getBoundingClientRect().top + window.scrollY - 100), behavior: 'smooth' });
    };
    S.setFile = function (st) {
      filebar.innerHTML = '';
      filebar.classList.remove('hidden');
      filebar.appendChild(h('span.pdft-fico', { html: icon('file-text') }));
      filebar.appendChild(h('div.pdft-finfo', null, [
        h('div.pdft-fname', { text: st.name, title: st.name }),
        h('div.small.muted', { text: BT.fmtBytes(st.size) + (st.pages ? ' · ' + plural(st.pages, 'page') : '') })
      ]));
      filebar.appendChild(h('button.btn.btn-sm', { type: 'button', html: icon('refresh-cw') + ' Change file', onclick: S.pick }));
      warnslot.innerHTML = '';
      if (st.encrypted) warnslot.appendChild(notice('warn', 'This PDF has security restrictions (it is encrypted). Pages may not display correctly in the saved result.'));
    };
    S.progress = function (f, text) {
      prog.classList.remove('hidden');
      var pct = Math.max(0, Math.min(100, Math.round(f * 100)));
      prog.firstChild.style.width = pct + '%';
      prog.setAttribute('aria-valuenow', String(pct));
      if (text != null) status.textContent = text;
    };
    S.setStatus = function (t) { status.textContent = t || ''; };
    S.setAction = function (label, iconName) {
      actionBtn.innerHTML = icon(iconName || cfg.actionIcon || tool.icon) + ' ' + esc(label);
    };
    S.enable = function (on) { actionBtn.disabled = !on; };
    S.fail = function (text) { errBox.innerHTML = ''; if (text) errBox.appendChild(notice('error', text)); };

    actionBtn.addEventListener('click', function () {
      if (actionBtn.disabled) return;
      errBox.innerHTML = '';
      BT.busy(actionBtn, function () {
        S.progress(0, 'Starting…');
        return Promise.resolve().then(function () { return libs(); }).then(function () { return cfg.run(S); })
          .then(function (res) { if (res) return S.showResult(res); })
          .catch(function (e) {
            var m = friendlyPdfError(e);
            errBox.innerHTML = '';
            errBox.appendChild(notice('error', m));
            throw new Error(m);
          })
          .then(function () { prog.classList.add('hidden'); status.textContent = ''; },
            function (e) { prog.classList.add('hidden'); status.textContent = ''; throw e; });
      }, cfg.busyLabel || 'Working…');
    });

    function pack(res) {
      if (res.files && res.files.length > 1) {
        S.progress(1, 'Creating ZIP…');
        return BT.loadLib('jszip').then(function () {
          var zip = new window.JSZip();
          res.files.forEach(function (f) { zip.file(f.name, f.data); });
          return zip.generateAsync({ type: 'blob' });
        }).then(function (blob) { return { blob: blob, name: res.zipName || 'files.zip' }; });
      }
      var one = res.files ? res.files[0] : res;
      var blob = one.data instanceof Blob ? one.data : new Blob([one.data], { type: one.mime || res.mime || 'application/pdf' });
      return Promise.resolve({ blob: blob, name: one.name });
    }

    S.showResult = function (res) {
      return pack(res).then(function (out) {
        S.lastOut = out;
        if (!res.noAutoDownload) BT.download(out.blob, out.name);
        resultWrap.innerHTML = '';
        var stats = [['File', out.name]].concat(res.hideSize ? [] : [['Size', BT.fmtBytes(out.blob.size)]]).concat(res.stats || []);
        var dl = h('button.btn.btn-primary.btn-lg', { type: 'button', html: icon('download') + ' ' + (res.noAutoDownload ? 'Download' : 'Download again'), onclick: function () { BT.download(out.blob, out.name); } });
        var card = h('div.card.pdft-result', null, [
          h('div.pdft-done' + (res.warn ? '.pdft-warnico' : ''), { html: icon(res.warn ? 'info' : 'check') }),
          h('h2', { text: res.title || 'Your file is ready' }),
          h('p.muted', { text: res.subtitle || (res.noAutoDownload ? 'Click download to save it.' : 'The download should start automatically. If it did not, use the button below.') }),
          h('div.stats', null, stats.map(function (s) {
            return h('div.stat', null, [h('div.label', { text: s[0] }), h('div.value' + (s[2] ? '.' + s[2] : ''), { text: s[1], style: s[0] === 'File' ? { fontSize: '0.95rem', wordBreak: 'break-all' } : null })]);
          })),
          res.note ? notice(res.noteKind || 'ok', res.note) : null,
          h('div.btn-group', null, [
            dl,
            h('button.btn.btn-lg', { type: 'button', html: icon('arrow-left') + ' Back to editing', onclick: function () { S.showWork(); } }),
            h('button.btn.btn-lg.btn-ghost', { type: 'button', html: icon('refresh-cw') + ' Start over', onclick: function () { S.reset(); } })
          ]),
          res.extra || null,
          h('div.pdft-next', null, [
            h('p.label', { text: 'Continue with another tool' }),
            h('div.chips', null, NEXT.filter(function (id) { return id !== tool.id && BT.tool(id); }).slice(0, 6).map(function (id) {
              var t = BT.tool(id);
              return h('a.chip', { href: BT.toolUrl(id), html: icon(t.icon) + esc(t.name) });
            }))
          ])
        ]);
        resultWrap.appendChild(card);
        work.classList.add('hidden');
        resultWrap.classList.remove('hidden');
        window.scrollTo({ top: Math.max(0, app.getBoundingClientRect().top + window.scrollY - 90), behavior: 'smooth' });
      });
    };
    return S;
  }

  /** Read a PDF file and open it with pdf.js (and optionally pdf-lib). */
  function loadPdfFile(file, opt) {
    opt = opt || {};
    return libs().then(function () { return BT.readFile(file); }).then(function (buf) {
      var st = { file: file, name: file.name, base: BT.baseName(file.name), size: file.size, bytes: buf, encrypted: looksEncrypted(buf) };
      return BT.openPdfjs(buf).then(function (pdf) {
        st.pdf = pdf;
        st.pages = pdf.numPages;
        if (!opt.pdflib) return st;
        return BT.openPdfLib(buf).then(function (doc) { st.doc = doc; return st; });
      });
    }).catch(function (e) { throw new Error(friendlyPdfError(e)); });
  }

  /** Single-PDF tool: dropzone -> load -> cfg.setup(S, st). */
  function singlePdf(root, ctx, cfg) {
    var S = shell(root, ctx, {
      actionLabel: cfg.actionLabel, actionIcon: cfg.actionIcon, busyLabel: cfg.busyLabel, dzHint: cfg.dzHint,
      run: function (S) { return cfg.run(S, S.state); },
      onReset: cfg.onReset,
      onFiles: function (files) { open(files[0]); }
    });
    function open(file) {
      if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') { BT.toast('Please choose a PDF file', 'error'); return; }
      S.loading('Opening ' + file.name + '…');
      S.setStatus('');
      loadPdfFile(file, cfg).then(function (st) {
        if (S.state && S.state.pdf) { try { S.state.pdf.destroy(); } catch (e) { /* ignore */ } }
        S.state = st;
        S.main.innerHTML = '';
        S.opts.innerHTML = '';
        S.enable(true);
        S.setFile(st);
        S.showWork();
        cfg.setup(S, st);
      }).catch(function (e) {
        S.introError(friendlyPdfError(e));
      });
    }
    S.open = open;
    return S;
  }

  function newDoc() { return PDFLib.PDFDocument.create(); }
  function savePdf(doc) { return doc.save({ useObjectStreams: true }); }
  function pdfResult(bytes, st, suffix, extra) {
    var r = { data: bytes, name: st.base + '-' + suffix + '.pdf', mime: 'application/pdf' };
    if (extra) Object.keys(extra).forEach(function (k) { r[k] = extra[k]; });
    return r;
  }
  /** Copy pages (0-based, may repeat) from the loaded file into a new document. */
  async function extractPages(st, idx) {
    var src = await BT.openPdfLib(st.bytes);
    var out = await newDoc();
    var pages = await out.copyPages(src, idx);
    pages.forEach(function (p) { out.addPage(p); });
    return out;
  }
  async function sourceDoc(st) { return BT.openPdfLib(st.bytes); }

  /** Toolbar with quick selection buttons for a pageGrid. */
  function selectToolbar(st, grid) {
    function pick(fn) { var a = []; for (var i = 0; i < st.pages; i++) if (fn(i)) a.push(i); grid.set(a, 'tool'); }
    return h('div.btn-group', null, [
      h('button.btn.btn-sm', { type: 'button', text: 'All', onclick: function () { pick(function () { return true; }); } }),
      h('button.btn.btn-sm', { type: 'button', text: 'None', onclick: function () { pick(function () { return false; }); } }),
      h('button.btn.btn-sm', { type: 'button', text: 'Odd', onclick: function () { pick(function (i) { return i % 2 === 0; }); } }),
      h('button.btn.btn-sm', { type: 'button', text: 'Even', onclick: function () { pick(function (i) { return i % 2 === 1; }); } })
    ]);
  }
  function mainHead(text, right) {
    return h('div.toolbar', null, [h('span.pdft-count', { text: text }), h('span.spacer'), right || null]);
  }

  /** Render a page to JPEG bytes at a DPI; returns {bytes, w, h} with w/h in points (visual). */
  async function rasterPage(pdf, n, dpi, quality, gray) {
    var page = await pdf.getPage(n);
    var vp1 = page.getViewport({ scale: 1 });
    var scale = dpi / 72;
    var maxPx = 30e6;
    if (vp1.width * vp1.height * scale * scale > maxPx) scale = Math.sqrt(maxPx / (vp1.width * vp1.height));
    var r = await BT.renderPdfPage(page, scale);
    page.cleanup();
    if (gray) toGray(r.canvas);
    var blob = await BT.canvasToBlob(r.canvas, 'image/jpeg', quality);
    r.canvas.width = r.canvas.height = 0;
    var bytes = new Uint8Array(await blob.arrayBuffer());
    return { bytes: bytes, w: vp1.width, h: vp1.height };
  }
  function toGray(canvas) {
    var c = canvas.getContext('2d');
    var CH = 512;
    for (var y = 0; y < canvas.height; y += CH) {
      var hh = Math.min(CH, canvas.height - y);
      var im = c.getImageData(0, y, canvas.width, hh), d = im.data;
      for (var i = 0; i < d.length; i += 4) {
        var g = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0;
        d[i] = d[i + 1] = d[i + 2] = g;
      }
      c.putImageData(im, 0, y);
    }
  }
  async function rasterizePdf(S, st, dpi, quality, gray) {
    var out = await newDoc();
    for (var i = 1; i <= st.pages; i++) {
      S.progress((i - 1) / st.pages, 'Processing page ' + i + ' of ' + st.pages + '…');
      var r = await rasterPage(st.pdf, i, dpi, quality, gray);
      var img = await out.embedJpg(r.bytes);
      var p = out.addPage([r.w, r.h]);
      p.drawImage(img, { x: 0, y: 0, width: r.w, height: r.h });
    }
    S.progress(1, 'Saving…');
    return savePdf(out);
  }

  /** Large single-page preview with page navigation and an overlay painter. */
  function previewPane(st, draw, opts) {
    opts = opts || {};
    var cur = 0, base = null, vw = 0, vh = 0, token = 0;
    var canvas = h('canvas');
    var label = h('span');
    var prev = ibtn('arrow-left', 'Previous page', function () { if (cur > 0) go(cur - 1); });
    var next = ibtn('arrow-right', 'Next page', function () { if (cur < st.pages - 1) go(cur + 1); });
    var holder = h('div.pdft-pv', null, canvas);
    var wrap = h('div.pdft-preview', null, [h('div.pdft-pnav', null, [prev, label, next]), holder]);
    async function go(i) {
      cur = i;
      var my = ++token;
      label.textContent = 'Page ' + (i + 1) + ' of ' + st.pages;
      prev.disabled = i === 0; next.disabled = i === st.pages - 1;
      var page = await st.pdf.getPage(i + 1);
      var vp1 = page.getViewport({ scale: 1 });
      var avail = Math.max(240, (wrap.parentNode ? wrap.parentNode.clientWidth : 520) - 40);
      var cssW = Math.min(opts.maxW || 560, avail);
      var s = cssW / vp1.width;
      if (vp1.height * s > 720) s = 720 / vp1.height;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = await BT.renderPdfPage(page, s * dpr);
      page.cleanup();
      if (my !== token) return;
      base = r.canvas; vw = vp1.width; vh = vp1.height;
      canvas.width = base.width; canvas.height = base.height;
      canvas.style.width = Math.round(base.width / dpr) + 'px';
      redraw();
    }
    function redraw() {
      if (!base) return;
      var c = canvas.getContext('2d');
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = 1;
      c.drawImage(base, 0, 0);
      c.save();
      try { draw(c, base.width / vw, vw, vh, cur); } finally { c.restore(); }
    }
    wrap.go = go;
    wrap.redraw = redraw;
    wrap.current = function () { return cur; };
    return wrap;
  }

  // =============================================================== TOOLS
  // ------------------------------------------------------------ MERGE PDF
  BT.impl('merge-pdf', function (root, ctx) {
    var items = [], seq = 0;
    var list = h('div.file-list.pdft-flist');
    var count = h('span.pdft-count');
    var S = shell(root, ctx, {
      multiple: true, dzTitle: 'Select PDF files', dzHint: 'or drop them here. You can add more files later.',
      actionLabel: 'Merge PDF', actionIcon: 'combine', busyLabel: 'Merging…',
      onFiles: add, run: merge,
      onReset: function () { items.forEach(dispose); items = []; list.innerHTML = ''; refresh(); }
    });
    S.main.appendChild(h('div.toolbar', null, [
      count, h('span.spacer'),
      h('button.btn.btn-sm', { type: 'button', html: icon('arrow-down-a-z') + ' Sort A–Z', onclick: function () { sortBy(1); } }),
      h('button.btn.btn-sm', { type: 'button', html: icon('arrow-down-a-z') + ' Z–A', onclick: function () { sortBy(-1); } }),
      h('button.btn.btn-sm.btn-primary', { type: 'button', html: icon('plus') + ' Add files', onclick: function () { S.pick(); } })
    ]));
    S.main.appendChild(list);
    S.main.appendChild(h('p.pdft-hint', { html: icon('grip-vertical') + ' Drag files (or use the arrows) to set the order. Files are merged top to bottom.' }));
    var addDz = BT.dropzone({ accept: '.pdf,application/pdf', multiple: true, compact: true, color: PDF_COLOR, icon: 'file-plus-2', title: 'Add more PDFs', hint: 'Click or drop files here', onFiles: add });
    addDz.classList.add('pdft-addzone');
    S.main.appendChild(addDz);
    var summary = h('div.stats');
    S.opts.appendChild(h('h3', { text: 'Merge options' }));
    S.opts.appendChild(summary);
    S.opts.appendChild(h('p.pdft-hint', { text: 'Pages keep their original size and orientation. Bookmarks and form fields are not carried over.' }));

    sortable(list, { item: '.pdft-fitem', handle: '.pdft-grip', axis: 'y', onReorder: syncOrder });

    function dispose(it) { if (it.pdf) { try { it.pdf.destroy(); } catch (e) { /* ignore */ } } }
    function syncOrder() {
      items = $$('.pdft-fitem', list).map(function (el) { return el._item; });
      refresh();
    }
    function sortBy(dir) {
      items.sort(function (a, b) { return dir * a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }); });
      items.forEach(function (it) { list.appendChild(it.el); });
      refresh();
    }
    function moveItem(it, d) {
      var i = items.indexOf(it), j = i + d;
      if (j < 0 || j >= items.length) return;
      items.splice(i, 1);
      items.splice(j, 0, it);
      items.forEach(function (x) { list.appendChild(x.el); });
      refresh();
      var b = it.el.querySelector(d < 0 ? '.pdft-up' : '.pdft-down');
      if (b && !b.disabled) b.focus();
    }
    function add(files) {
      files = files.filter(function (f) { return /\.pdf$/i.test(f.name) || f.type === 'application/pdf'; });
      if (!files.length) return;
      S.showWork();
      files.forEach(function (f) {
        var it = { id: ++seq, file: f, name: f.name, size: f.size, pages: 0, ready: false };
        var meta = h('div.meta', { text: BT.fmtBytes(f.size) + ' · reading…' });
        var thumb = h('div.pdft-fthumb', null, h('div.pdft-ph'));
        it.el = h('div.file-item.pdft-fitem', null, [
          h('button.pdft-grip', { type: 'button', 'aria-label': 'Drag to reorder ' + f.name, title: 'Drag to reorder', html: icon('grip-vertical') }),
          thumb,
          h('div.pdft-fmeta', null, [h('div.name', { text: f.name, title: f.name }), meta]),
          h('div.pdft-ibtns', null, [
            ibtn('chevron-down', 'Move up', function () { moveItem(it, -1); }, 'pdft-up'),
            ibtn('chevron-down', 'Move down', function () { moveItem(it, 1); }, 'pdft-down'),
            ibtn('trash-2', 'Remove', function () { remove(it); }, 'danger')
          ])
        ]);
        it.el._item = it;
        it.meta = meta;
        items.push(it);
        list.appendChild(it.el);
        BT.readFile(f).then(function (buf) {
          it.bytes = buf;
          return BT.openPdfjs(buf);
        }).then(function (pdf) {
          it.pdf = pdf; it.pages = pdf.numPages; it.ready = true;
          meta.textContent = BT.fmtBytes(f.size) + ' · ' + plural(pdf.numPages, 'page');
          if (looksEncrypted(it.bytes)) meta.textContent += ' · encrypted';
          lazy(thumb, function () { return renderThumb(pdf, 1, 120).then(function (c) { thumb.innerHTML = ''; thumb.appendChild(c); }); });
          refresh();
        }).catch(function (e) {
          it.bad = true;
          it.el.classList.add('pdft-bad');
          thumb.innerHTML = '';
          meta.textContent = friendlyPdfError(e);
          refresh();
        });
      });
      refresh();
    }
    function remove(it) {
      dispose(it);
      items.splice(items.indexOf(it), 1);
      it.el.remove();
      if (!items.length) { S.reset(); return; }
      refresh();
    }
    function refresh() {
      var pages = 0, size = 0;
      items.forEach(function (it, i) {
        pages += it.pages; size += it.size;
        var up = it.el.querySelector('.pdft-up'), dn = it.el.querySelector('.pdft-down');
        up.disabled = i === 0; dn.disabled = i === items.length - 1;
      });
      count.textContent = plural(items.length, 'file');
      summary.innerHTML = '';
      [['Files', String(items.length)], ['Total pages', String(pages)], ['Total size', BT.fmtBytes(size)]].forEach(function (s) {
        summary.appendChild(h('div.stat', null, [h('div.label', { text: s[0] }), h('div.value', { text: s[1] })]));
      });
      var bad = items.some(function (it) { return it.bad; });
      var loading = items.some(function (it) { return !it.ready && !it.bad; });
      S.enable(items.length >= 2 && !bad && !loading);
      S.setStatus(bad ? 'Remove the files that could not be read.' : items.length < 2 ? 'Add at least 2 PDF files to merge.' : loading ? 'Reading files…' : '');
    }
    async function merge(S) {
      var out = await newDoc();
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        S.progress(i / items.length, 'Adding ' + it.name + '…');
        var src = await BT.openPdfLib(it.bytes);
        var pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach(function (p) { out.addPage(p); });
        await tick();
      }
      S.progress(1, 'Saving…');
      var bytes = await savePdf(out);
      return {
        data: bytes, name: BT.baseName(items[0].name) + '-merged.pdf',
        title: 'Your PDFs have been merged',
        stats: [['Pages', String(out.getPageCount())], ['Files merged', String(items.length)]]
      };
    }
    refresh();
  });

  // ------------------------------------------------------------ SPLIT PDF
  BT.impl('split-pdf', function (root, ctx) {
    var mode = 'ranges', grid, rangesIn, everyIn, info, rangeErr;
    singlePdf(root, ctx, {
      actionLabel: 'Split PDF', actionIcon: 'scissors', busyLabel: 'Splitting…',
      setup: function (S, st) {
        mode = st.pages > 1 ? 'ranges' : 'ranges';
        info = h('span.pdft-count');
        grid = pageGrid(st, { mode: 'select', onChange: update });
        S.main.appendChild(mainHead(plural(st.pages, 'page'), info));
        S.main.appendChild(grid.el);

        rangesIn = h('input', { type: 'text', value: st.pages > 1 ? '1-' + Math.ceil(st.pages / 2) + ', ' + (Math.ceil(st.pages / 2) + 1) + '-' + st.pages : '1', autocomplete: 'off', spellcheck: false });
        rangeErr = h('div.hint.pdft-err', { role: 'alert' });
        everyIn = numInput(Math.min(2, st.pages), 1, st.pages);
        var boxRanges = h('div', null, [field('Page ranges', rangesIn, 'Each comma-separated range becomes its own PDF. Example: 1-3, 4-6, 7'), rangeErr]);
        var boxEvery = h('div.hidden', null, [field('Pages per file', everyIn, 'Splits the document into chunks of this many pages.')]);
        var boxAll = h('div.hidden', null, [h('p.pdft-hint', { text: 'Every page will be saved as a separate PDF file.' })]);
        var boxSel = h('div.hidden', null, [h('p.pdft-hint', { text: 'Click pages in the preview. The document is cut after each selected page.' })]);
        var boxes = { ranges: boxRanges, every: boxEvery, all: boxAll, selected: boxSel };
        var modeSeg = seg([['ranges', 'Ranges'], ['every', 'Every N'], ['all', 'All pages'], ['selected', 'Pick']], mode, function (v) {
          mode = v;
          Object.keys(boxes).forEach(function (k) { boxes[k].classList.toggle('hidden', k !== v); });
          update();
        }, 'Split mode');
        S.opts.appendChild(h('h3', { text: 'Split options' }));
        S.opts.appendChild(sec('Split mode', [modeSeg]));
        S.opts.appendChild(boxRanges); S.opts.appendChild(boxEvery); S.opts.appendChild(boxAll); S.opts.appendChild(boxSel);
        rangesIn.addEventListener('input', update);
        everyIn.addEventListener('input', update);
        update();
      },
      run: async function (S, st) {
        var groups = getGroups(st);
        if (!groups.length) throw new Error('Nothing to split. Check your options.');
        var src = await sourceDoc(st);
        var files = [];
        for (var g = 0; g < groups.length; g++) {
          S.progress(g / groups.length, 'Creating file ' + (g + 1) + ' of ' + groups.length + '…');
          var out = await newDoc();
          var pages = await out.copyPages(src, groups[g]);
          pages.forEach(function (p) { out.addPage(p); });
          var label = mode === 'ranges' ? toRanges(groups[g]).replace(/, /g, '_') : mode === 'all' ? 'page-' + (groups[g][0] + 1) : 'part' + (g + 1);
          files.push({ name: st.base + '-' + (mode === 'ranges' ? 'pages-' + label : label) + '.pdf', data: await savePdf(out) });
          await tick();
        }
        return {
          files: files, zipName: st.base + '-split.zip',
          title: files.length > 1 ? 'Your PDF has been split into ' + files.length + ' files' : 'Your PDF is ready',
          stats: [['Files', String(files.length)]]
        };
      }
    });
    function getGroups(st) {
      var n = st.pages, out = [], i;
      if (mode === 'ranges') return parseGroups(rangesIn.value, n);
      if (mode === 'every') {
        var k = parseInt(everyIn.value, 10);
        if (!(k >= 1)) throw new Error('Enter how many pages each file should have');
        for (i = 0; i < n; i += k) { var g = []; for (var j = i; j < Math.min(n, i + k); j++) g.push(j); out.push(g); }
        return out;
      }
      if (mode === 'all') { for (i = 0; i < n; i++) out.push([i]); return out; }
      var cuts = grid.get().filter(function (c) { return c < n - 1; });
      var start = 0;
      cuts.concat([n - 1]).forEach(function (c) { var g = []; for (var j = start; j <= c; j++) g.push(j); out.push(g); start = c + 1; });
      return out;
    }
    function update() {
      if (!grid) return;
      var st = { pages: grid.thumbs.length };
      grid.el.classList.toggle('pdft-cutmode', mode === 'selected');
      var groups = [];
      rangeErr.textContent = '';
      try { groups = getGroups(st); } catch (e) { if (mode === 'ranges') rangeErr.textContent = e.message; }
      var owner = {};
      groups.forEach(function (g, gi) { g.forEach(function (p) { if (owner[p] === undefined) owner[p] = gi; }); });
      grid.thumbs.forEach(function (el, i) {
        var gi = owner[i];
        el.classList.toggle('pdft-out', gi === undefined);
        el.classList.toggle('pdft-g', gi !== undefined);
        if (gi !== undefined) el.style.setProperty('--g', 'hsl(' + ((gi * 67 + 350) % 360) + ' 70% 48%)');
        el.pg.textContent = (i + 1) + (gi !== undefined ? ' · File ' + (gi + 1) : '');
        if (mode !== 'selected' && el.classList.contains('selected')) el.classList.remove('selected');
      });
      info.textContent = groups.length ? '→ ' + plural(groups.length, 'output file') : '';
      if (mode !== 'selected' && grid.get().length) grid.set([], 'tool');
    }
  });

  // ----------------------------------------------------- REMOVE PDF PAGES
  BT.impl('remove-pdf-pages', function (root, ctx) {
    var grid, sum;
    singlePdf(root, ctx, {
      actionLabel: 'Remove pages', actionIcon: 'file-minus', busyLabel: 'Removing…',
      setup: function (S, st) {
        sum = h('span.pdft-count');
        var rf;
        grid = pageGrid(st, {
          mode: 'remove',
          onChange: function (idx, src) {
            rf.sync(idx, src);
            var keep = st.pages - idx.length;
            sum.textContent = idx.length ? 'Removing ' + idx.length + ' of ' + st.pages + ' pages' : 'Click pages to remove them';
            S.enable(idx.length > 0 && keep > 0);
            S.setStatus(keep === 0 ? 'You cannot remove every page. Keep at least one.' : idx.length ? 'The new PDF will have ' + plural(keep, 'page') + '.' : '');
          }
        });
        rf = rangeField(st, grid, 'Pages to remove', 'Type pages or ranges, or click thumbnails.');
        S.main.appendChild(mainHead(plural(st.pages, 'page'), sum));
        S.main.appendChild(grid.el);
        S.opts.appendChild(h('h3', { text: 'Remove pages' }));
        S.opts.appendChild(rf);
        grid.set([], 'tool');
      },
      run: async function (S, st) {
        var rem = grid.get();
        var keep = [];
        for (var i = 0; i < st.pages; i++) if (rem.indexOf(i) === -1) keep.push(i);
        if (!keep.length) throw new Error('You cannot remove every page.');
        S.progress(0.4, 'Copying pages…');
        var out = await extractPages(st, keep);
        S.progress(0.9, 'Saving…');
        return pdfResult(await savePdf(out), st, 'pages-removed', { title: rem.length + ' page(s) removed', stats: [['Pages left', String(keep.length)]] });
      }
    });
  });

  // ---------------------------------------------------- EXTRACT PDF PAGES
  BT.impl('extract-pdf-pages', function (root, ctx) {
    var grid, sep;
    singlePdf(root, ctx, {
      actionLabel: 'Extract pages', actionIcon: 'file-output', busyLabel: 'Extracting…',
      setup: function (S, st) {
        var sum = h('span.pdft-count');
        var rf;
        grid = pageGrid(st, {
          mode: 'select',
          onChange: function (idx, src) {
            rf.sync(idx, src);
            sum.textContent = idx.length ? idx.length + ' of ' + st.pages + ' selected' : 'Click pages to select them';
            S.enable(idx.length > 0);
          }
        });
        rf = rangeField(st, grid, 'Pages to extract', 'Type pages or ranges, or click thumbnails. Shift-click selects a run.');
        sep = checkbox('Save each page as a separate PDF (ZIP)', false);
        S.main.appendChild(mainHead(plural(st.pages, 'page'), sum));
        S.main.appendChild(grid.el);
        S.opts.appendChild(h('h3', { text: 'Extract pages' }));
        S.opts.appendChild(sec('Quick select', [selectToolbar(st, grid)]));
        S.opts.appendChild(rf);
        S.opts.appendChild(sec(null, [sep]));
        grid.set([], 'tool');
      },
      run: async function (S, st) {
        var idx = grid.get();
        if (!idx.length) throw new Error('Select at least one page.');
        if (sep.input.checked && idx.length > 1) {
          var src = await sourceDoc(st), files = [];
          for (var i = 0; i < idx.length; i++) {
            S.progress(i / idx.length, 'Page ' + (idx[i] + 1) + '…');
            var out = await newDoc();
            var p = await out.copyPages(src, [idx[i]]);
            out.addPage(p[0]);
            files.push({ name: st.base + '-page-' + (idx[i] + 1) + '.pdf', data: await savePdf(out) });
          }
          return { files: files, zipName: st.base + '-pages.zip', title: idx.length + ' pages extracted', stats: [['Files', String(files.length)]] };
        }
        S.progress(0.5, 'Copying pages…');
        var doc = await extractPages(st, idx);
        return pdfResult(await savePdf(doc), st, 'extracted', { title: plural(idx.length, 'page') + ' extracted', stats: [['Pages', String(idx.length)]] });
      }
    });
  });

  // ---------------------------------------------------------- ORGANIZE PDF
  BT.impl('organize-pdf', function (root, ctx) {
    var sources = [], items = [], gridEl, sum, S;
    S = singlePdf(root, ctx, {
      actionLabel: 'Save PDF', actionIcon: 'download', busyLabel: 'Saving…',
      onReset: function () { sources.slice(1).forEach(function (s) { try { s.pdf.destroy(); } catch (e) { /* ignore */ } }); sources = []; items = []; },
      setup: function (S2, st) {
        sources.slice(1).forEach(function (s) { try { s.pdf.destroy(); } catch (e) { /* ignore */ } });
        sources = [{ bytes: st.bytes, pdf: st.pdf, name: st.name }];
        items = [];
        sum = h('span.pdft-count');
        gridEl = h('div.thumbs.pdft-grid');
        var addPicker = filePicker('.pdf,application/pdf', true, addPdfs);
        S.main.appendChild(h('div.toolbar', null, [
          sum, h('span.spacer'),
          h('button.btn.btn-sm', { type: 'button', html: icon('file-plus-2') + ' Add PDF', onclick: function () { addPicker.click(); } }),
          h('button.btn.btn-sm', { type: 'button', html: icon('plus') + ' Blank page', onclick: function () { insertBlank(items.length - 1); } })
        ]));
        S.main.appendChild(gridEl);
        S.main.appendChild(h('p.pdft-hint', { text: 'Drag pages to reorder. Hover a page (or tap on touch screens) for rotate, duplicate, blank page and delete actions.' }));
        for (var i = 0; i < st.pages; i++) items.push(mkItem(0, i));
        items.forEach(function (it) { gridEl.appendChild(it.el); });
        sortable(gridEl, { item: '.pdft-thumb', handle: '.pdft-grip', axis: 'x', onReorder: function () { items = $$('.pdft-thumb', gridEl).map(function (el) { return el._item; }); refresh(); } });

        S.opts.appendChild(h('h3', { text: 'Organize pages' }));
        S.opts.appendChild(sec('All pages', [h('div.btn-group', null, [
          h('button.btn.btn-sm', { type: 'button', html: icon('rotate-ccw') + ' Rotate left', onclick: function () { items.forEach(function (it) { rot(it, -90); }); } }),
          h('button.btn.btn-sm', { type: 'button', html: icon('rotate-cw') + ' Rotate right', onclick: function () { items.forEach(function (it) { rot(it, 90); }); } }),
          h('button.btn.btn-sm', { type: 'button', html: icon('arrow-down-a-z') + ' Reverse order', onclick: function () { items.reverse(); items.forEach(function (it) { gridEl.appendChild(it.el); }); refresh(); } }),
          h('button.btn.btn-sm', { type: 'button', html: icon('undo-2') + ' Reset', onclick: function () { S.open(st.file); } })
        ])]));
        S.opts.appendChild(h('p.pdft-hint', { text: 'Tip: use “Add PDF” to append the pages of other PDF files, then arrange them freely.' }));
        refresh();
      },
      run: async function (S2, st) {
        if (!items.length) throw new Error('There are no pages left. Add or restore at least one page.');
        var out = await newDoc();
        var docs = {}, plan = {};
        items.forEach(function (it, k) { if (it.page != null) { (plan[it.src] = plan[it.src] || []).push(k); } });
        var copied = new Array(items.length);
        var keys = Object.keys(plan);
        for (var s = 0; s < keys.length; s++) {
          S.progress(s / (keys.length + 1), 'Reading ' + sources[keys[s]].name + '…');
          docs[keys[s]] = await BT.openPdfLib(sources[keys[s]].bytes);
          var pages = await out.copyPages(docs[keys[s]], plan[keys[s]].map(function (k) { return items[k].page; }));
          plan[keys[s]].forEach(function (k, j) { copied[k] = pages[j]; });
        }
        S.progress(0.9, 'Building document…');
        var last = null;
        items.forEach(function (it, k) {
          var p;
          if (it.page == null) {
            var sz = A4;
            if (last) { var ls = last.getSize(); var lr = norm(last.getRotation().angle); sz = (lr === 90 || lr === 270) ? [ls.height, ls.width] : [ls.width, ls.height]; }
            p = out.addPage(sz);
          } else {
            p = out.addPage(copied[k]);
          }
          if (it.rot) p.setRotation(PDFLib.degrees(norm(p.getRotation().angle + it.rot)));
          last = p;
        });
        return pdfResult(await savePdf(out), st, 'organized', { title: 'Your PDF has been organized', stats: [['Pages', String(items.length)]] });
      }
    });

    function mkItem(src, page) {
      var it = { src: src, page: page, rot: 0 };
      var el = pageThumb('');
      el._item = it;
      it.el = el;
      el.classList.add('pdft-static');
      el.style.cursor = 'grab';
      el.removeAttribute('role');
      el.setAttribute('aria-label', page == null ? 'Blank page' : 'Page ' + (page + 1));
      var acts = h('div.thumb-actions', null, [
        h('button.pdft-grip', { type: 'button', title: 'Drag to move', 'aria-label': 'Drag to move', html: icon('move') }),
        h('button', { type: 'button', title: 'Rotate left', 'aria-label': 'Rotate left', html: icon('rotate-ccw'), onclick: function () { rot(it, -90); } }),
        h('button', { type: 'button', title: 'Rotate right', 'aria-label': 'Rotate right', html: icon('rotate-cw'), onclick: function () { rot(it, 90); } }),
        h('button', { type: 'button', title: 'Duplicate', 'aria-label': 'Duplicate page', html: icon('copy'), onclick: function () { dup(it); } }),
        h('button', { type: 'button', title: 'Insert blank page after', 'aria-label': 'Insert blank page after', html: icon('file-plus-2'), onclick: function () { insertBlank(items.indexOf(it)); } }),
        h('button.danger', { type: 'button', title: 'Delete page', 'aria-label': 'Delete page', html: icon('trash-2'), onclick: function () { del(it); } })
      ]);
      el.insertBefore(acts, el.firstChild);
      if (page == null) setThumbCanvas(el, blankCanvas(A4[0], A4[1]));
      else {
        var pdf = sources[src].pdf;
        lazy(el, function () { return renderThumb(pdf, page + 1).then(function (c) { setThumbCanvas(el, c); applyRot(it); }); });
      }
      return it;
    }
    function applyRot(it) { var c = it.el.box.firstChild; if (c && c.style) c.style.transform = it.rot ? 'rotate(' + it.rot + 'deg)' : ''; }
    function rot(it, d) { it.rot = it.rot + d; applyRot(it); refresh(); }
    function dup(it) {
      var c = mkItem(it.src, it.page);
      c.rot = it.rot;
      items.splice(items.indexOf(it) + 1, 0, c);
      gridEl.insertBefore(c.el, it.el.nextSibling);
      applyRot(c);
      refresh();
    }
    function insertBlank(after) {
      var c = mkItem(0, null);
      items.splice(after + 1, 0, c);
      gridEl.insertBefore(c.el, items[after + 2] ? items[after + 2].el : null);
      refresh();
    }
    function del(it) {
      items.splice(items.indexOf(it), 1);
      it.el.remove();
      refresh();
    }
    function addPdfs(files) {
      files.reduce(function (p, f) {
        return p.then(function () {
          S.setStatus('Adding ' + f.name + '…');
          return loadPdfFile(f).then(function (st) {
            var k = sources.push({ bytes: st.bytes, pdf: st.pdf, name: st.name }) - 1;
            for (var i = 0; i < st.pages; i++) { var it = mkItem(k, i); items.push(it); gridEl.appendChild(it.el); }
            refresh();
            BT.toast('Added ' + plural(st.pages, 'page') + ' from ' + f.name);
          }).catch(function (e) { BT.toast(f.name + ': ' + friendlyPdfError(e), 'error'); });
        });
      }, Promise.resolve()).then(function () { S.setStatus(''); refresh(); });
    }
    function refresh() {
      items.forEach(function (it, i) {
        var lbl = String(i + 1);
        if (it.page == null) lbl += ' · blank';
        else if (sources.length > 1 || it.page !== i) lbl += ' (' + (sources.length > 1 ? 'F' + (it.src + 1) + ' ' : '') + 'p' + (it.page + 1) + ')';
        if (norm(it.rot)) lbl += ' ⟳' + norm(it.rot) + '°';
        it.el.pg.textContent = lbl;
      });
      sum.textContent = plural(items.length, 'page');
      S.enable(items.length > 0);
      S.setStatus(items.length ? '' : 'All pages were deleted. Add a page or reset.');
    }
  });

  // ------------------------------------------------------------ ROTATE PDF
  BT.impl('rotate-pdf', function (root, ctx) {
    var grid, delta = [], scopeTxt;
    singlePdf(root, ctx, {
      actionLabel: 'Save rotated PDF', actionIcon: 'rotate-cw', busyLabel: 'Rotating…',
      setup: function (S, st) {
        delta = new Array(st.pages).fill(0);
        var sum = h('span.pdft-count');
        scopeTxt = h('p.pdft-hint');
        grid = pageGrid(st, {
          mode: 'select',
          decorate: function (el, i) {
            el.insertBefore(h('div.thumb-actions', null, [
              h('button', { type: 'button', title: 'Rotate left', 'aria-label': 'Rotate page ' + (i + 1) + ' left', html: icon('rotate-ccw'), onclick: function () { turn([i], -90); } }),
              h('button', { type: 'button', title: 'Rotate right', 'aria-label': 'Rotate page ' + (i + 1) + ' right', html: icon('rotate-cw'), onclick: function () { turn([i], 90); } })
            ]), el.firstChild);
            el.appendChild(h('span.pdft-rbadge.hidden'));
          },
          onChange: function (idx) {
            sum.textContent = idx.length ? idx.length + ' selected' : '';
            scopeTxt.textContent = idx.length ? 'Buttons rotate the ' + plural(idx.length, 'selected page') + '.' : 'Buttons rotate all pages. Click thumbnails to rotate only some pages.';
          }
        });
        S.main.appendChild(mainHead(plural(st.pages, 'page'), sum));
        S.main.appendChild(grid.el);
        function target() { var s = grid.get(); if (s.length) return s; var a = []; for (var i = 0; i < st.pages; i++) a.push(i); return a; }
        S.opts.appendChild(h('h3', { text: 'Rotate pages' }));
        S.opts.appendChild(sec('Rotate', [h('div.btn-group', null, [
          h('button.btn', { type: 'button', html: icon('rotate-ccw') + ' Left', onclick: function () { turn(target(), -90); } }),
          h('button.btn', { type: 'button', html: icon('rotate-cw') + ' Right', onclick: function () { turn(target(), 90); } }),
          h('button.btn', { type: 'button', html: icon('refresh-cw') + ' 180°', onclick: function () { turn(target(), 180); } })
        ]), scopeTxt]));
        S.opts.appendChild(sec('Selection', [selectToolbar(st, grid)]));
        S.opts.appendChild(h('button.btn.btn-sm.btn-ghost', { type: 'button', html: icon('undo-2') + ' Reset rotation', onclick: function () { turn(target(), null); } }));
        grid.set([], 'tool');
        paintAll();
      },
      run: async function (S, st) {
        if (!delta.some(function (d) { return norm(d) !== 0; })) throw new Error('Rotate at least one page first.');
        var doc = await sourceDoc(st);
        doc.getPages().forEach(function (p, i) {
          var d = norm(delta[i]);
          if (d) p.setRotation(PDFLib.degrees(norm(p.getRotation().angle + d)));
        });
        S.progress(0.8, 'Saving…');
        var n = delta.filter(function (d) { return norm(d); }).length;
        return pdfResult(await savePdf(doc), st, 'rotated', { title: 'Your PDF has been rotated', stats: [['Pages rotated', String(n)]] });
      }
    });
    function turn(idx, d) {
      idx.forEach(function (i) { delta[i] = d == null ? 0 : delta[i] + d; });
      paintAll();
    }
    function paintAll() {
      grid.thumbs.forEach(function (el, i) {
        var c = el.box.firstChild;
        if (c && c.style) c.style.transform = delta[i] ? 'rotate(' + delta[i] + 'deg)' : '';
        var b = el.querySelector('.pdft-rbadge');
        var n = norm(delta[i]);
        b.classList.toggle('hidden', !n);
        b.textContent = '+' + n + '°';
        if (!el._obs) {
          el._obs = new MutationObserver(function () { var cc = el.box.firstChild; if (cc && cc.style) cc.style.transform = delta[i] ? 'rotate(' + delta[i] + 'deg)' : ''; });
          el._obs.observe(el.box, { childList: true });
        }
      });
    }
  });

  // ---------------------------------------------------------- COMPRESS PDF
  BT.impl('compress-pdf', function (root, ctx) {
    var level, stripMeta;
    var LEVELS = {
      basic: { dpi: 0 },
      strong: { dpi: 150, q: 0.7 },
      extreme: { dpi: 100, q: 0.5 }
    };
    singlePdf(root, ctx, {
      actionLabel: 'Compress PDF', actionIcon: 'minimize-2', busyLabel: 'Compressing…',
      setup: function (S, st) {
        var grid = pageGrid(st, { mode: 'none' });
        S.main.appendChild(mainHead(plural(st.pages, 'page') + ' · ' + BT.fmtBytes(st.size)));
        S.main.appendChild(grid.el);
        var note = notice('warn', 'Pages are re-drawn as images: text will no longer be selectable or searchable, and links/forms are removed.');
        stripMeta = checkbox('Also remove document metadata', false);
        var metaBox = sec(null, [stripMeta]);
        level = choices([
          { v: 'basic', title: 'Basic (lossless)', desc: 'Re-packs the file structure. Keeps text and quality 100% intact. Best for already-optimised PDFs.' },
          { v: 'strong', title: 'Strong', desc: 'Pages become 150 DPI images (JPEG quality 70%). Big savings on scans and photo-heavy files.' },
          { v: 'extreme', title: 'Extreme', desc: '100 DPI images at quality 50%. Smallest size, visibly lower quality.' }
        ], 'basic', function (v) { note.classList.toggle('hidden', v === 'basic'); metaBox.classList.toggle('hidden', v !== 'basic'); });
        note.classList.add('hidden');
        S.opts.appendChild(h('h3', { text: 'Compression level' }));
        S.opts.appendChild(sec(null, [level]));
        S.opts.appendChild(metaBox);
        S.opts.appendChild(note);
      },
      run: async function (S, st) {
        var lv = level.get(), bytes;
        if (lv === 'basic') {
          S.progress(0.3, 'Optimising structure…');
          var doc = await sourceDoc(st);
          if (stripMeta.input.checked) clearMeta(doc);
          S.progress(0.7, 'Saving…');
          bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
        } else {
          bytes = await rasterizePdf(S, st, LEVELS[lv].dpi, LEVELS[lv].q, false);
        }
        var before = st.size, after = bytes.length;
        var saved = before - after, pct = before ? Math.round(saved / before * 100) : 0;
        if (after >= before) {
          var origBtn = h('button.btn', { type: 'button', html: icon('download') + ' Download original instead', onclick: function () { BT.download(new Blob([st.bytes], { type: 'application/pdf' }), st.name); } });
          return pdfResult(bytes, st, 'compressed', {
            title: 'This PDF is already well compressed', noAutoDownload: true, hideSize: true, warn: true,
            subtitle: 'The compressed version is not smaller than your original.',
            stats: [['Original', BT.fmtBytes(before)], ['Result', BT.fmtBytes(after), 'pdft-badv']],
            note: 'The result is ' + BT.fmtBytes(after - before) + ' larger than the original, so we recommend keeping your original file.' + (lv === 'basic' ? ' You can try the Strong level for scanned or image-heavy PDFs.' : ''),
            noteKind: 'warn', extra: h('div.btn-group', { style: { marginTop: '12px' } }, [origBtn])
          });
        }
        return pdfResult(bytes, st, 'compressed', {
          title: 'Your PDF is now ' + pct + '% smaller', hideSize: true,
          stats: [['Original', BT.fmtBytes(before)], ['Compressed', BT.fmtBytes(after), 'pdft-good'], ['Saved', BT.fmtBytes(saved) + ' (' + pct + '%)', 'pdft-good']]
        });
      }
    });
  });
  function clearMeta(doc) {
    try {
      var info = doc.getInfoDict();
      ['Title', 'Author', 'Subject', 'Keywords', 'Creator', 'Producer', 'CreationDate', 'ModDate', 'Trapped'].forEach(function (k) { info.delete(PDFLib.PDFName.of(k)); });
    } catch (e) { /* ignore */ }
    try { doc.catalog.delete(PDFLib.PDFName.of('Metadata')); } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------- JPG TO PDF
  function jpegOrientation(buf) {
    try {
      var v = new DataView(buf);
      if (v.getUint16(0) !== 0xFFD8) return 1;
      var off = 2, len = v.byteLength;
      while (off + 4 < len) {
        var marker = v.getUint16(off); off += 2;
        if (marker === 0xFFE1) {
          if (v.getUint32(off + 2) !== 0x45786966) return 1;
          var tiff = off + 8, little = v.getUint16(tiff) === 0x4949;
          var ifd = tiff + v.getUint32(tiff + 4, little);
          var n = v.getUint16(ifd, little);
          for (var i = 0; i < n; i++) {
            var e = ifd + 2 + i * 12;
            if (e + 12 > len) break;
            if (v.getUint16(e, little) === 0x0112) return v.getUint16(e + 8, little);
          }
          return 1;
        }
        if ((marker & 0xFF00) !== 0xFF00 || marker === 0xFFDA) break;
        off += v.getUint16(off);
      }
    } catch (e) { /* ignore */ }
    return 1;
  }

  BT.impl('jpg-to-pdf', function (root, ctx) {
    var items = [], seq = 0;
    var gridEl = h('div.thumbs.pdft-grid');
    var count = h('span.pdft-count');
    var ACCEPT = '.jpg,.jpeg,.png,.webp,.gif,.bmp,image/jpeg,image/png,image/webp,image/gif,image/bmp';
    var S = shell(root, ctx, {
      accept: ACCEPT, multiple: true, dzTitle: 'Select images', dzHint: 'JPG, PNG, WebP or GIF. Drop as many as you like.',
      actionLabel: 'Convert to PDF', actionIcon: 'file-image', busyLabel: 'Converting…',
      onFiles: add, run: build,
      onReset: function () { items.forEach(function (it) { if (it.url) URL.revokeObjectURL(it.url); }); items = []; gridEl.innerHTML = ''; refresh(); }
    });
    S.main.appendChild(h('div.toolbar', null, [
      count, h('span.spacer'),
      h('button.btn.btn-sm', { type: 'button', html: icon('arrow-down-a-z') + ' Sort by name', onclick: function () {
        items.sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); });
        items.forEach(function (it) { gridEl.appendChild(it.el); }); refresh();
      } }),
      h('button.btn.btn-sm.btn-primary', { type: 'button', html: icon('plus') + ' Add images', onclick: function () { S.pick(); } })
    ]));
    S.main.appendChild(gridEl);
    S.main.appendChild(h('p.pdft-hint', { text: 'Drag images to reorder. Each image becomes one page.' }));
    sortable(gridEl, { item: '.pdft-thumb', handle: '.pdft-grip', axis: 'x', onReorder: function () { items = $$('.pdft-thumb', gridEl).map(function (el) { return el._item; }); refresh(); } });

    var size = seg([['fit', 'Fit image'], ['a4', 'A4'], ['letter', 'Letter']], 'a4', function (v) { orientBox.classList.toggle('hidden', v === 'fit'); }, 'Page size');
    var orient = seg([['auto', 'Auto'], ['portrait', 'Portrait'], ['landscape', 'Landscape']], 'auto', null, 'Orientation');
    var orientBox = sec('Orientation', [orient]);
    var margin = seg([['0', 'None'], ['20', 'Small'], ['40', 'Large']], '20', null, 'Margin');
    S.opts.appendChild(h('h3', { text: 'Page setup' }));
    S.opts.appendChild(sec('Page size', [size]));
    S.opts.appendChild(orientBox);
    S.opts.appendChild(sec('Margin', [margin]));
    S.opts.appendChild(h('p.pdft-hint', { text: 'JPG and PNG images are embedded as-is, without re-compression, so quality is preserved.' }));

    function add(files) {
      if (!files.length) return;
      S.showWork();
      files.forEach(function (f) {
        var it = { id: ++seq, file: f, name: f.name, rot: 0 };
        var el = pageThumb(f.name);
        el._item = it; it.el = el;
        el.classList.add('pdft-static');
        el.style.cursor = 'grab';
        el.removeAttribute('role');
        el.setAttribute('aria-label', f.name);
        el.pg.title = f.name;
        el.pg.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
        el.insertBefore(h('div.thumb-actions', null, [
          h('button.pdft-grip', { type: 'button', title: 'Drag to move', 'aria-label': 'Drag to move', html: icon('move') }),
          h('button', { type: 'button', title: 'Rotate left', 'aria-label': 'Rotate left', html: icon('rotate-ccw'), onclick: function () { turn(it, -90); } }),
          h('button', { type: 'button', title: 'Rotate right', 'aria-label': 'Rotate right', html: icon('rotate-cw'), onclick: function () { turn(it, 90); } }),
          h('button.danger', { type: 'button', title: 'Remove', 'aria-label': 'Remove image', html: icon('trash-2'), onclick: function () { remove(it); } })
        ]), el.firstChild);
        items.push(it);
        gridEl.appendChild(el);
        it.ready = BT.readFile(f).then(function (buf) {
          it.bytes = buf;
          var t = (f.type || '').toLowerCase(), n = f.name.toLowerCase();
          it.kind = (t === 'image/jpeg' || /\.jpe?g$/.test(n)) ? 'jpg' : (t === 'image/png' || /\.png$/.test(n)) ? 'png' : 'other';
          it.orient = it.kind === 'jpg' ? jpegOrientation(buf) : 1;
          it.url = URL.createObjectURL(f);
          return BT.loadImage(it.url);
        }).then(function (img) {
          it.w = img.naturalWidth; it.h = img.naturalHeight;
          var s = THUMB_PX / Math.max(it.w, it.h);
          var c = h('canvas');
          c.width = Math.max(1, Math.round(it.w * s)); c.height = Math.max(1, Math.round(it.h * s));
          var cx = c.getContext('2d');
          cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height);
          cx.drawImage(img, 0, 0, c.width, c.height);
          setThumbCanvas(el, c);
          it.img = img;
          refresh();
        }).catch(function () {
          it.bad = true;
          el.box.innerHTML = '<div class="notice error small" style="position:absolute;inset:10%">Unreadable image</div>';
          refresh();
        });
      });
      refresh();
    }
    function turn(it, d) {
      it.vis = (it.vis || 0) + d;
      it.rot = norm(it.vis);
      var c = it.el.box.firstChild;
      if (c && c.style) c.style.transform = it.vis ? 'rotate(' + it.vis + 'deg)' : '';
    }
    function remove(it) {
      if (it.url) URL.revokeObjectURL(it.url);
      items.splice(items.indexOf(it), 1);
      it.el.remove();
      if (!items.length) { S.reset(); return; }
      refresh();
    }
    function refresh() {
      count.textContent = plural(items.length, 'image');
      var bad = items.some(function (it) { return it.bad; });
      S.enable(items.length > 0 && !bad);
      S.setStatus(bad ? 'Remove the images that could not be read.' : '');
    }
    async function canvasEncode(it, out) {
      var img = it.img;
      var c = document.createElement('canvas');
      c.width = it.w; c.height = it.h;
      var cx = c.getContext('2d');
      var asPng = it.kind === 'png' || /gif/i.test(it.file.type) || /\.gif$/i.test(it.name);
      if (!asPng) { cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height); }
      cx.drawImage(img, 0, 0);
      var blob = await BT.canvasToBlob(c, asPng ? 'image/png' : 'image/jpeg', 0.92);
      c.width = c.height = 0;
      var b = new Uint8Array(await blob.arrayBuffer());
      return asPng ? out.embedPng(b) : out.embedJpg(b);
    }
    async function build(S) {
      await Promise.all(items.map(function (it) { return it.ready; }));
      var out = await newDoc();
      var m = parseFloat(margin.get());
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        S.progress(i / items.length, 'Adding ' + it.name + '…');
        var emb = null, baseRot = 0;
        if (it.kind === 'jpg' && [1, 3, 6, 8].indexOf(it.orient) !== -1) {
          try { emb = await out.embedJpg(it.bytes); baseRot = { 1: 0, 3: 180, 6: 90, 8: 270 }[it.orient]; } catch (e) { emb = null; }
        } else if (it.kind === 'png') {
          try { emb = await out.embedPng(it.bytes); } catch (e) { emb = null; }
        }
        if (!emb) { emb = await canvasEncode(it, out); baseRot = 0; }
        var r = (baseRot + it.rot) % 360;
        var iw = emb.width, ih = emb.height;
        var side = r === 90 || r === 270;
        var dw = side ? ih : iw, dh = side ? iw : ih;
        var pw, ph, scale;
        if (size.get() === 'fit') {
          scale = 0.75;
          if (Math.max(dw, dh) * scale > 14000) scale = 14000 / Math.max(dw, dh);
          pw = dw * scale + 2 * m; ph = dh * scale + 2 * m;
        } else {
          var base = size.get() === 'a4' ? A4 : LETTER;
          var o = orient.get();
          var land = o === 'landscape' || (o === 'auto' && dw > dh);
          pw = land ? base[1] : base[0]; ph = land ? base[0] : base[1];
          scale = Math.min((pw - 2 * m) / dw, (ph - 2 * m) / dh);
        }
        var bw = dw * scale, bh = dh * scale, bx = (pw - bw) / 2, by = (ph - bh) / 2;
        var page = out.addPage([pw, ph]);
        var x = bx, y = by;
        if (r === 90) { y = by + bh; } else if (r === 180) { x = bx + bw; y = by + bh; } else if (r === 270) { x = bx + bw; }
        page.drawImage(emb, { x: x, y: y, width: iw * scale, height: ih * scale, rotate: PDFLib.degrees(-r) });
        await tick();
      }
      S.progress(1, 'Saving…');
      var bytes = await savePdf(out);
      return { data: bytes, name: (items.length === 1 ? BT.baseName(items[0].name) : 'images') + '-converted.pdf', title: 'Your images are now a PDF', stats: [['Pages', String(items.length)]] };
    }
    refresh();
  });

  // ---------------------------------------------------------- PDF TO JPG
  BT.impl('pdf-to-jpg', function (root, ctx) {
    var grid, dpi, fmt, quality, urls = [];
    function revoke() { urls.forEach(URL.revokeObjectURL); urls = []; }
    singlePdf(root, ctx, {
      actionLabel: 'Convert to images', actionIcon: 'images', busyLabel: 'Converting…',
      onReset: revoke,
      setup: function (S, st) {
        var sum = h('span.pdft-count');
        var rf;
        grid = pageGrid(st, {
          mode: 'select',
          onChange: function (idx, src) {
            rf.sync(idx, src);
            sum.textContent = idx.length ? idx.length + ' selected' : 'All pages';
            S.setAction(idx.length === 1 ? 'Convert 1 page' : 'Convert ' + (idx.length || st.pages) + ' pages', 'images');
          }
        });
        rf = rangeField(st, grid, 'Pages', 'Leave empty to convert every page.');
        S.main.appendChild(mainHead(plural(st.pages, 'page'), sum));
        S.main.appendChild(grid.el);
        dpi = seg([['72', '72 DPI'], ['150', '150 DPI'], ['300', '300 DPI']], '150', null, 'Resolution');
        quality = rangeCtl(85, 40, 100, 1, function (v) { return v + '%'; });
        var qBox = sec('JPG quality', [quality]);
        fmt = seg([['jpg', 'JPG'], ['png', 'PNG']], 'jpg', function (v) { qBox.classList.toggle('hidden', v !== 'jpg'); }, 'Format');
        S.opts.appendChild(h('h3', { text: 'Image options' }));
        S.opts.appendChild(sec('Format', [fmt]));
        S.opts.appendChild(sec('Resolution', [dpi, h('p.pdft-hint', { text: '72 = screen, 150 = good quality, 300 = print quality (large files).' })]));
        S.opts.appendChild(qBox);
        S.opts.appendChild(rf);
        grid.set([], 'tool');
      },
      run: async function (S, st) {
        revoke();
        var idx = grid.get();
        if (!idx.length) for (var i = 0; i < st.pages; i++) idx.push(i);
        var isJpg = fmt.get() === 'jpg', d = parseInt(dpi.get(), 10), q = quality.input.value / 100;
        var files = [], cards = [];
        for (var k = 0; k < idx.length; k++) {
          S.progress(k / idx.length, 'Rendering page ' + (idx[k] + 1) + ' (' + (k + 1) + ' of ' + idx.length + ')…');
          var page = await st.pdf.getPage(idx[k] + 1);
          var vp = page.getViewport({ scale: 1 });
          var sc = d / 72;
          if (vp.width * vp.height * sc * sc > 40e6) sc = Math.sqrt(40e6 / (vp.width * vp.height));
          var r = await BT.renderPdfPage(page, sc);
          page.cleanup();
          var blob = await BT.canvasToBlob(r.canvas, isJpg ? 'image/jpeg' : 'image/png', q);
          var wpx = r.canvas.width, hpx = r.canvas.height;
          r.canvas.width = r.canvas.height = 0;
          var name = st.base + '-page-' + (idx[k] + 1) + (isJpg ? '.jpg' : '.png');
          files.push({ name: name, data: blob });
          var url = URL.createObjectURL(blob);
          urls.push(url);
          cards.push(h('div.pdft-imgc', null, [
            h('div.pdft-tw', null, h('img', { src: url, alt: 'Page ' + (idx[k] + 1), loading: 'lazy' })),
            h('div.small', null, [h('span', { text: 'Page ' + (idx[k] + 1) }), h('span', { text: wpx + '×' + hpx + ' · ' + BT.fmtBytes(blob.size) })]),
            (function (b, n) { return h('button.btn.btn-sm', { type: 'button', html: icon('download') + ' Download', onclick: function () { BT.download(b, n); } }); })(blob, name)
          ]));
        }
        return {
          files: files, zipName: st.base + '-images.zip',
          title: files.length > 1 ? files.length + ' images created' : 'Your image is ready',
          stats: [['Images', String(files.length)], ['Format', isJpg ? 'JPG' : 'PNG'], ['Resolution', d + ' DPI']],
          extra: h('div.pdft-imgs', null, cards)
        };
      }
    });
  });

  // ---------------------------------------------------- PDF PAGE NUMBERS
  var NUM_FORMATS = [['n', '1, 2, 3'], ['page', 'Page 1'], ['pageof', 'Page 1 of N'], ['slash', '1 / N']];
  function numText(f, n, total) {
    if (f === 'page') return 'Page ' + n;
    if (f === 'pageof') return 'Page ' + n + ' of ' + total;
    if (f === 'slash') return n + ' / ' + total;
    return String(n);
  }
  function posPicker(value, onChange) {
    var P = ['tl', 'tc', 'tr', 'bl', 'bc', 'br'], N = ['Top left', 'Top center', 'Top right', 'Bottom left', 'Bottom center', 'Bottom right'];
    var wrap = h('div.pdft-pos', { role: 'group', 'aria-label': 'Position' });
    var cur = value;
    P.forEach(function (p, i) {
      var b = h('button', { type: 'button', title: N[i], 'aria-label': N[i] });
      b._v = p;
      b.addEventListener('click', function () { set(p); onChange(p); });
      wrap.appendChild(b);
    });
    function set(v) { cur = v; Array.prototype.forEach.call(wrap.children, function (b) { b.setAttribute('aria-pressed', b._v === v ? 'true' : 'false'); }); }
    set(value);
    wrap.get = function () { return cur; };
    return wrap;
  }

  BT.impl('pdf-page-numbers', function (root, ctx) {
    var o = {};
    function cfgNow(st) {
      var idx;
      var rv = o.range.value.trim();
      idx = rv ? BT.parsePageRanges(rv, st.pages) : null;
      if (!idx) { idx = []; for (var i = 0; i < st.pages; i++) idx.push(i); }
      idx.sort(function (a, b) { return a - b; });
      var start = parseInt(o.start.value, 10);
      if (!isFinite(start)) start = 1;
      return {
        idx: idx, start: start, pos: o.pos.get(), fmt: o.fmt.value,
        size: Math.max(4, Math.min(72, parseFloat(o.size.value) || 11)),
        margin: Math.max(0, parseFloat(o.margin.value) || 0) * MM,
        color: o.color.value, total: start + idx.length - 1
      };
    }
    function layout(c, vw, vh, tw) {
      var capH = c.size * 0.72, p = c.pos;
      var x = p[1] === 'l' ? c.margin : p[1] === 'r' ? vw - c.margin - tw : (vw - tw) / 2;
      var y = p[0] === 'b' ? c.margin : vh - c.margin - capH;
      return { x: x, y: y };
    }
    var pane, rangeErr;
    singlePdf(root, ctx, {
      actionLabel: 'Add page numbers', actionIcon: 'list-ordered', busyLabel: 'Numbering…',
      setup: function (S, st) {
        pane = previewPane(st, function (cx, s, vw, vh, cur) {
          var c;
          try { c = cfgNow(st); } catch (e) { return; }
          var k = c.idx.indexOf(cur);
          if (k === -1) return;
          var txt = numText(c.fmt, c.start + k, c.total);
          cx.font = (c.size * s) + 'px Helvetica, Arial, sans-serif';
          var tw = cx.measureText(txt).width / s;
          var L = layout(c, vw, vh, tw);
          cx.fillStyle = c.color;
          cx.textBaseline = 'alphabetic';
          cx.fillText(txt, L.x * s, (vh - L.y) * s);
        });
        S.main.appendChild(pane);
        o.pos = posPicker('bc', function () { pane.redraw(); });
        o.fmt = select(NUM_FORMATS, 'n');
        o.start = numInput(1, 0, 99999);
        o.range = h('input', { type: 'text', placeholder: 'All pages', autocomplete: 'off' });
        rangeErr = h('div.hint.pdft-err', { role: 'alert' });
        o.size = numInput(11, 4, 72);
        o.margin = numInput(10, 0, 100, 1);
        o.color = h('input', { type: 'color', value: '#000000' });
        S.opts.appendChild(h('h3', { text: 'Page number options' }));
        S.opts.appendChild(sec('Position', [o.pos]));
        S.opts.appendChild(field('Format', o.fmt));
        var rf = field('Pages to number', o.range, 'Example: 2-' + st.pages + ' to skip a cover page.');
        rf.appendChild(rangeErr);
        S.opts.appendChild(h('div.pdft-row2', null, [field('Start at', o.start), field('Font size (pt)', o.size)]));
        S.opts.appendChild(h('div', { style: { height: '14px' } }));
        S.opts.appendChild(rf);
        S.opts.appendChild(h('div.pdft-row2', null, [field('Margin (mm)', o.margin), field('Colour', o.color)]));
        var upd = BT.debounce(function () {
          rangeErr.textContent = '';
          try { cfgNow(st); S.enable(true); } catch (e) { rangeErr.textContent = e.message; S.enable(false); }
          pane.redraw();
        }, 60);
        S.opts.addEventListener('input', upd);
        S.opts.addEventListener('change', upd);
        pane.go(0);
      },
      run: async function (S, st) {
        var c = cfgNow(st);
        var doc = await sourceDoc(st);
        var font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
        var color = pdfColor(c.color);
        var pages = doc.getPages();
        c.idx.forEach(function (pi, k) {
          var page = pages[pi], P = placer(page);
          var txt = numText(c.fmt, c.start + k, c.total);
          var tw = font.widthOfTextAtSize(txt, c.size);
          var L = layout(c, P.vw, P.vh, tw);
          var at = P.at(L.x, L.y);
          page.drawText(txt, { x: at.x, y: at.y, size: c.size, font: font, color: color, rotate: PDFLib.degrees(P.rot) });
        });
        S.progress(0.8, 'Saving…');
        return pdfResult(await savePdf(doc), st, 'numbered', { title: 'Page numbers added', stats: [['Pages numbered', String(c.idx.length)]] });
      }
    });
  });

  // -------------------------------------------------------- WATERMARK PDF
  BT.impl('watermark-pdf', function (root, ctx) {
    var o = {}, pane, wmImg = null;
    function conf(st) {
      var rv = o.range.value.trim();
      var idx = rv ? BT.parsePageRanges(rv, st.pages) : null;
      if (!idx) { idx = []; for (var i = 0; i < st.pages; i++) idx.push(i); }
      return {
        type: o.type.get(), text: o.text.value || ' ', size: Math.max(6, parseFloat(o.size.value) || 48),
        color: o.color.value, opacity: o.opacity.input.value / 100, layout: o.layout.get(),
        angle: parseFloat(o.angle.value) || 0, scale: o.scale.input.value / 100, idx: idx
      };
    }
    /** Placement list in visual coords: [{cx, cy, a}] */
    function spots(c, vw, vh, w, hh) {
      if (c.layout === 'tiled') {
        var a = c.angle;
        var gapX = Math.max(w * 0.6, 40), gapY = Math.max(hh * 3, 60);
        var sx = w + gapX, sy = hh + gapY, list = [], row = 0;
        var ext = Math.max(vw, vh) * 0.4;
        for (var y = -ext; y < vh + ext; y += sy, row++) {
          for (var x = -ext + (row % 2 ? sx / 2 : 0); x < vw + ext; x += sx) list.push({ cx: x, cy: y, a: a });
        }
        return list;
      }
      var ang = c.layout === 'diagonal' ? Math.atan2(vh, vw) * 180 / Math.PI : c.angle;
      return [{ cx: vw / 2, cy: vh / 2, a: ang }];
    }
    singlePdf(root, ctx, {
      actionLabel: 'Add watermark', actionIcon: 'stamp', busyLabel: 'Watermarking…',
      setup: function (S, st) {
        pane = previewPane(st, function (cx, s, vw, vh, cur) {
          var c;
          try { c = conf(st); } catch (e) { return; }
          if (c.idx.indexOf(cur) === -1) return;
          cx.globalAlpha = c.opacity;
          if (c.type === 'text') {
            cx.font = 'bold ' + (c.size * s) + 'px Helvetica, Arial, sans-serif';
            var tw = cx.measureText(c.text).width / s;
            cx.fillStyle = c.color;
            cx.textAlign = 'center';
            cx.textBaseline = 'middle';
            spots(c, vw, vh, tw, c.size * 0.72).forEach(function (p) {
              cx.save();
              cx.translate(p.cx * s, (vh - p.cy) * s);
              cx.rotate(-p.a * Math.PI / 180);
              cx.fillText(c.text, 0, 0);
              cx.restore();
            });
          } else if (wmImg) {
            var iw = vw * c.scale, ih = iw * wmImg.h / wmImg.w;
            spots(c, vw, vh, iw, ih).forEach(function (p) {
              cx.save();
              cx.translate(p.cx * s, (vh - p.cy) * s);
              cx.rotate(-p.a * Math.PI / 180);
              cx.drawImage(wmImg.img, -iw / 2 * s, -ih / 2 * s, iw * s, ih * s);
              cx.restore();
            });
          }
        });
        S.main.appendChild(pane);
        var textBox, imgBox;
        o.type = seg([['text', 'Text'], ['image', 'Image']], 'text', function (v) {
          textBox.classList.toggle('hidden', v !== 'text'); imgBox.classList.toggle('hidden', v !== 'image'); pane.redraw();
        }, 'Watermark type');
        o.text = h('input', { type: 'text', value: 'CONFIDENTIAL', maxLength: 200 });
        o.size = numInput(60, 6, 400);
        o.color = h('input', { type: 'color', value: '#e5484d' });
        var imgInfo = h('div.pdft-wmimg', null, [h('span.muted.small', { text: 'No image chosen' })]);
        var imgPick = filePicker('.png,.jpg,.jpeg,image/png,image/jpeg', false, function (files) {
          var f = files[0];
          BT.readFile(f).then(function (buf) {
            var url = URL.createObjectURL(f);
            return BT.loadImage(url).then(function (img) {
              wmImg = { bytes: buf, img: img, w: img.naturalWidth, h: img.naturalHeight, png: /png/i.test(f.type) || /\.png$/i.test(f.name), name: f.name };
              imgInfo.innerHTML = '';
              imgInfo.appendChild(h('img', { src: url, alt: '' }));
              imgInfo.appendChild(h('span.small', { text: f.name }));
              pane.redraw();
            });
          }).catch(function (e) { BT.toast(e.message, 'error'); });
        });
        o.scale = rangeCtl(40, 5, 100, 1, function (v) { return v + '%'; });
        textBox = h('div', null, [field('Text', o.text), h('div.pdft-row2', null, [field('Font size', o.size), field('Colour', o.color)]), h('div', { style: { height: '14px' } })]);
        imgBox = h('div.hidden', null, [sec('Image (PNG or JPG)', [h('div.btn-group', null, [h('button.btn.btn-sm', { type: 'button', html: icon('image-plus') + ' Choose image', onclick: function () { imgPick.click(); } })]), imgInfo]), sec('Width (% of page)', [o.scale])]);
        o.opacity = rangeCtl(30, 5, 100, 1, function (v) { return v + '%'; });
        o.layout = seg([['center', 'Center'], ['diagonal', 'Diagonal'], ['tiled', 'Tiled']], 'diagonal', function (v) { angleF.classList.toggle('hidden', v === 'diagonal'); pane.redraw(); }, 'Layout');
        o.angle = numInput(45, -180, 180, 5);
        var angleF = field('Rotation (degrees)', o.angle);
        angleF.classList.add('hidden');
        o.range = h('input', { type: 'text', placeholder: 'All pages', autocomplete: 'off' });
        var rangeErr = h('div.hint.pdft-err', { role: 'alert' });
        var rf = field('Pages', o.range);
        rf.appendChild(rangeErr);
        S.opts.appendChild(h('h3', { text: 'Watermark' }));
        S.opts.appendChild(sec(null, [o.type]));
        S.opts.appendChild(textBox);
        S.opts.appendChild(imgBox);
        S.opts.appendChild(sec('Layout', [o.layout]));
        S.opts.appendChild(angleF);
        S.opts.appendChild(sec('Opacity', [o.opacity]));
        S.opts.appendChild(rf);
        S.opts.appendChild(h('p.pdft-hint', { text: 'The watermark is drawn on top of the page content.' }));
        var upd = function () {
          rangeErr.textContent = '';
          try { conf(st); S.enable(true); } catch (e) { rangeErr.textContent = e.message; S.enable(false); }
          pane.redraw();
        };
        S.opts.addEventListener('input', upd);
        S.opts.addEventListener('change', upd);
        pane.go(0);
      },
      run: async function (S, st) {
        var c = conf(st);
        var doc = await sourceDoc(st);
        var pages = doc.getPages(), note = '';
        var font, emb, color = pdfColor(c.color), text = c.text;
        if (c.type === 'text') {
          font = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
          var clean = winAnsiSanitizer(font);
          text = clean(text).replace(/[\r\n]+/g, ' ');
          note = badCharsNote(clean);
        } else {
          if (!wmImg) throw new Error('Choose a PNG or JPG image for the watermark.');
          emb = wmImg.png ? await doc.embedPng(wmImg.bytes) : await doc.embedJpg(wmImg.bytes);
        }
        c.idx.forEach(function (pi, k) {
          var page = pages[pi], P = placer(page);
          if (c.type === 'text') {
            var tw = font.widthOfTextAtSize(text, c.size), th = c.size * 0.72;
            spots(c, P.vw, P.vh, tw, th).forEach(function (p) {
              var d = rotVec(-tw / 2, -th / 2, p.a);
              var at = P.at(p.cx + d[0], p.cy + d[1]);
              page.drawText(text, { x: at.x, y: at.y, size: c.size, font: font, color: color, opacity: c.opacity, rotate: PDFLib.degrees(P.rot + p.a) });
            });
          } else {
            var iw = P.vw * c.scale, ih = iw * emb.height / emb.width;
            spots(c, P.vw, P.vh, iw, ih).forEach(function (p) {
              var d = rotVec(-iw / 2, -ih / 2, p.a);
              var at = P.at(p.cx + d[0], p.cy + d[1]);
              page.drawImage(emb, { x: at.x, y: at.y, width: iw, height: ih, opacity: c.opacity, rotate: PDFLib.degrees(P.rot + p.a) });
            });
          }
          if (k % 20 === 0) S.progress(k / c.idx.length, 'Page ' + (pi + 1) + '…');
        });
        S.progress(0.9, 'Saving…');
        return pdfResult(await savePdf(doc), st, 'watermarked', {
          title: 'Watermark added', stats: [['Pages watermarked', String(c.idx.length)]],
          note: note || null, noteKind: 'warn'
        });
      }
    });
  });

  // ---------------------------------------------------------- PDF TO TEXT
  /** Rebuild reading-order lines from pdf.js text items. */
  function itemsToText(items) {
    var its = items.filter(function (it) { return it.str !== undefined && (it.str.length || it.hasEOL); }).map(function (it) {
      var t = it.transform;
      var size = Math.hypot(t[2], t[3]) || it.height || 10;
      return { s: it.str, x: t[4], y: t[5], w: it.width || 0, size: size };
    });
    if (!its.length) return '';
    its.sort(function (a, b) { return b.y - a.y || a.x - b.x; });
    var lines = [], cur = null;
    its.forEach(function (it) {
      if (cur && Math.abs(it.y - cur.y) <= Math.max(2, Math.min(it.size, cur.size) * 0.5)) cur.items.push(it);
      else { cur = { y: it.y, size: it.size, items: [it] }; lines.push(cur); }
    });
    var out = [], prevY = null, prevSize = 0;
    lines.forEach(function (ln) {
      ln.items.sort(function (a, b) { return a.x - b.x; });
      var s = '', end = null;
      ln.items.forEach(function (it) {
        if (!it.s) return;
        if (end !== null) {
          var gap = it.x - end;
          if (gap > it.size * 0.18 && !/\s$/.test(s) && !/^\s/.test(it.s)) s += gap > it.size * 2.5 ? '    ' : ' ';
        }
        s += it.s;
        end = it.x + it.w;
      });
      if (prevY !== null && prevY - ln.y > Math.max(prevSize, ln.size) * 1.9) out.push('');
      out.push(s.replace(/\s+$/, ''));
      prevY = ln.y; prevSize = ln.size;
    });
    return out.join('\n');
  }

  BT.impl('pdf-to-text', function (root, ctx) {
    var texts = [], sepBox, S;
    function joined(st) {
      var sep = sepBox.input.checked;
      return texts.map(function (t, i) { return (sep ? '----- Page ' + (i + 1) + ' of ' + st.pages + ' -----\n' : '') + t; }).join(sep ? '\n\n' : '\n\n').trim() + '\n';
    }
    S = singlePdf(root, ctx, {
      actionLabel: 'Download .txt', actionIcon: 'download', busyLabel: 'Preparing…',
      setup: async function (S2, st) {
        texts = [];
        var out = h('div');
        var head = mainHead('Extracting text…');
        S.main.appendChild(head);
        S.main.appendChild(out);
        sepBox = checkbox('Include page separators', true);
        var copyBtn = h('button.btn.btn-block', { type: 'button', html: icon('copy') + ' Copy all text', onclick: function () { BT.copy(joined(st), 'Text copied'); } });
        S.opts.appendChild(h('h3', { text: 'Text output' }));
        S.opts.appendChild(sec(null, [sepBox]));
        S.opts.appendChild(copyBtn);
        S.opts.appendChild(h('p.pdft-hint', { text: 'Only text that is selectable in the PDF can be extracted. Scanned pages need OCR, which is not available in this tool.' }));
        S.enable(false); copyBtn.disabled = true;
        var chars = 0;
        try {
          for (var i = 1; i <= st.pages; i++) {
            if (S.state !== st) return;
            S.progress((i - 1) / st.pages, 'Reading page ' + i + ' of ' + st.pages + '…');
            var page = await st.pdf.getPage(i);
            var tc = await page.getTextContent();
            page.cleanup();
            var txt = itemsToText(tc.items);
            texts.push(txt);
            chars += txt.replace(/\s/g, '').length;
            out.appendChild(h('div.pdft-tpage', null, [
              h('div.pdft-tph', null, [h('span', { text: 'Page ' + i }), h('span', { text: txt.replace(/\s/g, '').length + ' characters' })]),
              h('pre', { text: txt })
            ]));
          }
        } catch (e) {
          S.fail(friendlyPdfError(e));
        }
        S.progress(1, '');
        S.act.querySelector('.progress').classList.add('hidden');
        head.firstChild.textContent = plural(st.pages, 'page') + ' · ' + chars.toLocaleString('en-IN') + ' characters';
        if (chars < st.pages * 5) {
          S.main.insertBefore(notice('warn', chars === 0
            ? 'No text was found. This looks like a scanned or image-only PDF. Text recognition (OCR) is not available here, so the text cannot be extracted.'
            : 'Very little text was found. Parts of this PDF are probably scanned images, which need OCR (not available here).'), out);
        }
        S.enable(chars > 0); copyBtn.disabled = chars === 0;
      },
      run: async function (S2, st) {
        BT.download(new Blob([joined(st)], { type: 'text/plain;charset=utf-8' }), st.base + '.txt');
        BT.toast('Downloaded ' + st.base + '.txt');
        return null;
      }
    });
  });

  // ------------------------------------------------------------- CROP PDF
  BT.impl('crop-pdf', function (root, ctx) {
    var M = { t: 0, r: 0, b: 0, l: 0 }, cur = 0, vw = 0, vh = 0, cssScale = 1, token = 0;
    var inputs = {}, applySeg, mediaBox, stage, canvas, rect, label, prevB, nextB, S;
    var MIN = 18;
    S = singlePdf(root, ctx, {
      actionLabel: 'Crop PDF', actionIcon: 'crop', busyLabel: 'Cropping…',
      setup: function (S2, st) {
        M = { t: 0, r: 0, b: 0, l: 0 }; cur = 0;
        canvas = h('canvas');
        rect = h('div.pdft-crect');
        ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach(function (k) {
          var pos = { nw: [0, 0], n: [50, 0], ne: [100, 0], e: [100, 50], se: [100, 100], s: [50, 100], sw: [0, 100], w: [0, 50] }[k];
          var cur2 = { nw: 'nwse', se: 'nwse', ne: 'nesw', sw: 'nesw', n: 'ns', s: 'ns', e: 'ew', w: 'ew' }[k];
          rect.appendChild(h('div.pdft-hd', { 'data-h': k, style: { left: pos[0] + '%', top: pos[1] + '%', cursor: cur2 + '-resize' } }));
        });
        stage = h('div.pdft-stage', null, [canvas, rect]);
        label = h('span');
        prevB = ibtn('arrow-left', 'Previous page', function () { if (cur > 0) show(st, cur - 1); });
        nextB = ibtn('arrow-right', 'Next page', function () { if (cur < st.pages - 1) show(st, cur + 1); });
        S.main.appendChild(h('div.pdft-crop-wrap', null, [h('div.pdft-pnav', null, [prevB, label, nextB]), stage,
          h('p.pdft-hint', { text: 'Drag the handles or the box to choose the area to keep. Drag on the dark area to draw a new box.' })]));
        bindDrag(st);

        ['t', 'r', 'b', 'l'].forEach(function (k) {
          inputs[k] = numInput(0, 0, 2000, 0.5);
          inputs[k].addEventListener('input', function () {
            var v = parseFloat(inputs[k].value);
            M[k] = isFinite(v) && v > 0 ? v * MM : 0;
            clamp(k); paint(true);
          });
        });
        applySeg = seg([['all', 'All pages'], ['current', 'This page only']], 'all', null, 'Apply to');
        mediaBox = checkbox('Also shrink the page size (MediaBox)', true);
        S.opts.appendChild(h('h3', { text: 'Crop margins (mm)' }));
        S.opts.appendChild(h('div.pdft-mm', null, [field('Top', inputs.t), field('Bottom', inputs.b), field('Left', inputs.l), field('Right', inputs.r)]));
        S.opts.appendChild(h('div', { style: { height: '14px' } }));
        S.opts.appendChild(sec('Apply to', [applySeg]));
        S.opts.appendChild(sec(null, [mediaBox, h('p.pdft-hint', { text: 'When off, only the visible area (CropBox) changes and the hidden content stays in the file.' })]));
        S.opts.appendChild(h('button.btn.btn-sm.btn-ghost', { type: 'button', html: icon('undo-2') + ' Reset crop', onclick: function () { M = { t: 0, r: 0, b: 0, l: 0 }; paint(); } }));
        show(st, 0);
      },
      run: async function (S2, st) {
        if (!(M.t || M.r || M.b || M.l)) throw new Error('Drag the crop box or enter margins first.');
        var doc = await sourceDoc(st);
        var pages = doc.getPages();
        var targets = applySeg.get() === 'all' ? pages.map(function (_, i) { return i; }) : [cur];
        targets.forEach(function (i) {
          var p = pages[i], box = p.getCropBox(), rot = norm(p.getRotation().angle);
          var uL, uR, vT, vB;
          if (rot === 0) { uL = M.l; uR = M.r; vT = M.t; vB = M.b; }
          else if (rot === 90) { uL = M.t; vT = M.r; uR = M.b; vB = M.l; }
          else if (rot === 180) { uL = M.r; uR = M.l; vT = M.b; vB = M.t; }
          else { uR = M.t; vT = M.l; uL = M.b; vB = M.r; }
          var w = box.width - uL - uR, hh = box.height - vT - vB;
          if (w < 10 || hh < 10) throw new Error('The crop margins are larger than page ' + (i + 1) + '. Reduce them or crop only this page.');
          p.setCropBox(box.x + uL, box.y + vB, w, hh);
          if (mediaBox.input.checked) p.setMediaBox(box.x + uL, box.y + vB, w, hh);
        });
        S.progress(0.8, 'Saving…');
        return pdfResult(await savePdf(doc), st, 'cropped', {
          title: 'Your PDF has been cropped',
          stats: [['Pages cropped', String(targets.length)], ['New size (first)', Math.round((vw - M.l - M.r) / MM) + ' × ' + Math.round((vh - M.t - M.b) / MM) + ' mm']]
        });
      }
    });
    async function show(st, i) {
      cur = i;
      var my = ++token;
      label.textContent = 'Page ' + (i + 1) + ' of ' + st.pages;
      prevB.disabled = i === 0; nextB.disabled = i === st.pages - 1;
      var page = await st.pdf.getPage(i + 1);
      var vp1 = page.getViewport({ scale: 1 });
      var avail = Math.max(240, S.main.clientWidth - 40);
      var cssW = Math.min(560, avail);
      var s = cssW / vp1.width;
      if (vp1.height * s > 680) s = 680 / vp1.height;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = await BT.renderPdfPage(page, s * dpr);
      page.cleanup();
      if (my !== token) return;
      vw = vp1.width; vh = vp1.height; cssScale = s;
      canvas.width = r.canvas.width; canvas.height = r.canvas.height;
      canvas.getContext('2d').drawImage(r.canvas, 0, 0);
      canvas.style.width = Math.round(vw * s) + 'px';
      canvas.style.height = Math.round(vh * s) + 'px';
      clamp(); paint();
    }
    function clamp(changed) {
      ['t', 'r', 'b', 'l'].forEach(function (k) { M[k] = Math.max(0, M[k]); });
      if (M.l + M.r > vw - MIN) { if (changed === 'r') M.r = vw - MIN - M.l; else M.l = Math.max(0, vw - MIN - M.r); }
      if (M.t + M.b > vh - MIN) { if (changed === 'b') M.b = vh - MIN - M.t; else M.t = Math.max(0, vh - MIN - M.b); }
    }
    function paint(fromInput) {
      if (!vw) return;
      rect.style.left = (M.l / vw * 100) + '%';
      rect.style.top = (M.t / vh * 100) + '%';
      rect.style.width = ((vw - M.l - M.r) / vw * 100) + '%';
      rect.style.height = ((vh - M.t - M.b) / vh * 100) + '%';
      ['t', 'r', 'b', 'l'].forEach(function (k) {
        if (fromInput && document.activeElement === inputs[k]) return;
        inputs[k].value = String(Math.round(M[k] / MM * 10) / 10);
      });
      S.setStatus('Result: ' + Math.round((vw - M.l - M.r) / MM) + ' × ' + Math.round((vh - M.t - M.b) / MM) + ' mm (page ' + (cur + 1) + ')');
    }
    function bindDrag() {
      var d = null;
      stage.addEventListener('pointerdown', function (e) {
        if (!vw) return;
        e.preventDefault();
        var hd = e.target.closest('.pdft-hd');
        var r = stage.getBoundingClientRect();
        var px = (e.clientX - r.left) / cssScale, py = (e.clientY - r.top) / cssScale;
        var full = M.t + M.r + M.b + M.l < 1;
        d = { mode: hd ? hd.getAttribute('data-h') : (e.target.closest('.pdft-crect') && !full) ? 'move' : 'new', x0: e.clientX, y0: e.clientY, m: { t: M.t, r: M.r, b: M.b, l: M.l }, px: px, py: py };
        try { stage.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
      });
      stage.addEventListener('pointermove', function (e) {
        if (!d) return;
        var dx = (e.clientX - d.x0) / cssScale, dy = (e.clientY - d.y0) / cssScale, m = d.m;
        if (d.mode === 'move') {
          var w = vw - m.l - m.r, hh = vh - m.t - m.b;
          var l = Math.max(0, Math.min(vw - w, m.l + dx)), t = Math.max(0, Math.min(vh - hh, m.t + dy));
          M.l = l; M.r = vw - w - l; M.t = t; M.b = vh - hh - t;
        } else if (d.mode === 'new') {
          var x1 = Math.max(0, Math.min(vw, d.px)), y1 = Math.max(0, Math.min(vh, d.py));
          var x2 = Math.max(0, Math.min(vw, d.px + dx)), y2 = Math.max(0, Math.min(vh, d.py + dy));
          if (Math.abs(x2 - x1) < 4 && Math.abs(y2 - y1) < 4) return;
          M.l = Math.min(x1, x2); M.r = vw - Math.max(x1, x2); M.t = Math.min(y1, y2); M.b = vh - Math.max(y1, y2);
          clamp();
        } else {
          var k = d.mode;
          if (k.indexOf('n') !== -1) { M.t = m.t + dy; clamp('t'); }
          if (k.indexOf('s') !== -1) { M.b = m.b - dy; clamp('b'); }
          if (k.indexOf('w') !== -1) { M.l = m.l + dx; clamp('l'); }
          if (k.indexOf('e') !== -1) { M.r = m.r - dx; clamp('r'); }
        }
        paint();
      });
      var stop = function () { d = null; };
      stage.addEventListener('pointerup', stop);
      stage.addEventListener('pointercancel', stop);
    }
  });

  // --------------------------------------------------------- PDF METADATA
  function toLocalInput(d) {
    if (!d || isNaN(d)) return '';
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  BT.impl('pdf-metadata', function (root, ctx) {
    var F = {}, clearAll, touchMod;
    var KEYS = [['title', 'Title'], ['author', 'Author'], ['subject', 'Subject'], ['keywords', 'Keywords'], ['creator', 'Creator (application)'], ['producer', 'Producer (PDF library)']];
    singlePdf(root, ctx, {
      pdflib: true,
      actionLabel: 'Save metadata', actionIcon: 'file-cog', busyLabel: 'Saving…',
      setup: function (S, st) {
        var doc = st.doc;
        var get = function (fn) { try { return doc[fn]() || ''; } catch (e) { return ''; } };
        var vals = {
          title: get('getTitle'), author: get('getAuthor'), subject: get('getSubject'), keywords: get('getKeywords'),
          creator: get('getCreator'), producer: get('getProducer')
        };
        var created = null, modified = null;
        try { created = doc.getCreationDate(); } catch (e) { /* ignore */ }
        try { modified = doc.getModificationDate(); } catch (e) { /* ignore */ }
        var ver = '';
        try { var head = new Uint8Array(st.bytes, 0, 16); ver = (String.fromCharCode.apply(null, head).match(/%PDF-(\d\.\d)/) || [])[1] || ''; } catch (e) { /* ignore */ }
        var card = h('div.pdft-fgroup');
        card.appendChild(h('h3', { html: icon('file-cog') + ' Document properties' }));
        KEYS.forEach(function (k) {
          F[k[0]] = k[0] === 'subject' ? h('textarea', { rows: 2, style: { minHeight: '64px' } }) : h('input', { type: 'text' });
          F[k[0]].value = vals[k[0]];
          card.appendChild(field(k[1], F[k[0]], k[0] === 'keywords' ? 'Separate keywords with commas or spaces.' : null));
        });
        F.created = h('input', { type: 'datetime-local', value: toLocalInput(created) });
        F.modified = h('input', { type: 'datetime-local', value: toLocalInput(modified) });
        card.appendChild(h('div.row.cols-2', null, [field('Created', F.created), field('Modified', F.modified)]));
        S.main.appendChild(card);
        S.main.appendChild(h('div.stats', null, [
          [['Pages'], String(st.pages)], [['PDF version'], ver || '—'], [['File size'], BT.fmtBytes(st.size)]
        ].map(function (s) { return h('div.stat', null, [h('div.label', { text: s[0][0] }), h('div.value', { text: s[1] })]); })));
        clearAll = checkbox('Remove all metadata', false);
        touchMod = checkbox('Set “Modified” to now', true);
        clearAll.input.addEventListener('change', function () {
          Object.keys(F).forEach(function (k) { F[k].disabled = clearAll.input.checked; });
          touchMod.input.disabled = clearAll.input.checked;
        });
        S.opts.appendChild(h('h3', { text: 'Save options' }));
        S.opts.appendChild(sec(null, [touchMod]));
        S.opts.appendChild(sec(null, [clearAll, h('p.pdft-hint', { text: 'Strips title, author, dates, software names and the XMP metadata stream for privacy.' })]));
        S.opts.appendChild(h('p.pdft-hint', { text: 'Any embedded XMP metadata is removed when saving so that all PDF readers show the values you entered.' }));
      },
      run: async function (S, st) {
        var doc = await sourceDoc(st);
        clearMeta(doc);
        if (!clearAll.input.checked) {
          var v = function (k) { return F[k].value.trim(); };
          if (v('title')) doc.setTitle(v('title'));
          if (v('author')) doc.setAuthor(v('author'));
          if (v('subject')) doc.setSubject(v('subject'));
          if (v('keywords')) doc.setKeywords([v('keywords')]);
          if (v('creator')) doc.setCreator(v('creator'));
          if (v('producer')) doc.setProducer(v('producer'));
          var c = F.created.value ? new Date(F.created.value) : null;
          if (c && !isNaN(c)) doc.setCreationDate(c);
          var m = touchMod.input.checked ? new Date() : F.modified.value ? new Date(F.modified.value) : null;
          if (m && !isNaN(m)) doc.setModificationDate(m);
        }
        S.progress(0.7, 'Saving…');
        var bytes = await doc.save({ useObjectStreams: true });
        return pdfResult(bytes, st, clearAll.input.checked ? 'clean' : 'edited', { title: clearAll.input.checked ? 'All metadata removed' : 'Metadata updated' });
      }
    });
  });

  // -------------------------------------------------------- GRAYSCALE PDF
  BT.impl('grayscale-pdf', function (root, ctx) {
    var dpi, quality;
    singlePdf(root, ctx, {
      actionLabel: 'Convert to grayscale', actionIcon: 'contrast', busyLabel: 'Converting…',
      setup: function (S, st) {
        var grid = pageGrid(st, { mode: 'none' });
        grid.el.classList.add('pdft-gray');
        S.main.appendChild(mainHead(plural(st.pages, 'page') + ' · preview in grayscale'));
        S.main.appendChild(grid.el);
        dpi = seg([['100', '100'], ['150', '150'], ['200', '200'], ['300', '300']], '150', null, 'Resolution');
        quality = rangeCtl(80, 40, 100, 1, function (v) { return v + '%'; });
        S.opts.appendChild(h('h3', { text: 'Grayscale options' }));
        S.opts.appendChild(sec('Resolution (DPI)', [dpi, h('p.pdft-hint', { text: '150 DPI suits most printing. Use 300 for fine print.' })]));
        S.opts.appendChild(sec('Image quality', [quality]));
        S.opts.appendChild(notice('warn', 'Pages are converted to grayscale images, so text will no longer be selectable or searchable.'));
      },
      run: async function (S, st) {
        var bytes = await rasterizePdf(S, st, parseInt(dpi.get(), 10), quality.input.value / 100, true);
        return pdfResult(bytes, st, 'grayscale', { title: 'Your PDF is now black and white', stats: [['Pages', String(st.pages)], ['Original', BT.fmtBytes(st.size)]] });
      }
    });
  });

  // ---------------------------------------------------------- TEXT TO PDF
  BT.impl('text-to-pdf', function (root, ctx) {
    var S, ta, o = {}, warn, txtName = 'document';
    S = shell(root, ctx, {
      startInWork: true, actionLabel: 'Create PDF', actionIcon: 'file-plus', busyLabel: 'Creating…',
      accept: '.txt,.text,.md,.csv,.log,text/plain',
      onFiles: function (files) {
        var f = files[0];
        BT.readFile(f, 'text').then(function (t) { ta.value = t; txtName = BT.baseName(f.name); upd(); BT.toast('Loaded ' + f.name); });
      },
      run: build,
      rebuild: function () { setup(); }
    });
    function setup() {
      ta = h('textarea', { placeholder: 'Type or paste your text here…', spellcheck: true, 'aria-label': 'Text' });
      warn = h('div');
      var counter = h('span.pdft-count', { text: '0 characters' });
      S.main.appendChild(h('div.pdft-editor', null, [
        h('div.toolbar', null, [
          counter, h('span.spacer'),
          h('button.btn.btn-sm', { type: 'button', html: icon('upload') + ' Open .txt file', onclick: function () { S.pick(); } }),
          h('button.btn.btn-sm.btn-ghost', { type: 'button', html: icon('trash-2') + ' Clear', onclick: function () { ta.value = ''; upd(); ta.focus(); } })
        ]),
        ta, warn
      ]));
      upd = BT.debounce(function () {
        counter.textContent = ta.value.length.toLocaleString('en-IN') + ' characters · ' + (ta.value ? ta.value.split('\n').length : 0) + ' lines';
        S.enable(ta.value.trim().length > 0);
        warn.innerHTML = '';
        var bad = {};
        Array.from(ta.value).forEach(function (ch) { var c = ch.codePointAt(0); if (c > 255 && !WIN_EXTRA[ch]) bad[ch] = 1; });
        var list = Object.keys(bad);
        if (list.length) warn.appendChild(h('div.notice.warn', { style: { marginTop: '10px' }, html: icon('info') + '<span>' + esc(list.length + ' character(s) cannot be shown with the standard PDF fonts and will appear as "?": ' + list.slice(0, 12).join(' ') + (list.length > 12 ? ' …' : '') + '. Non-Latin scripts such as Hindi are not supported.') + '</span>' }));
      }, 200);
      ta.addEventListener('input', upd);
      o.font = seg([['Helvetica', 'Sans'], ['TimesRoman', 'Serif'], ['Courier', 'Mono']], 'Helvetica', null, 'Font');
      o.size = numInput(11, 6, 48, 0.5);
      o.page = seg([['a4', 'A4'], ['letter', 'Letter']], 'a4', null, 'Page size');
      o.orient = seg([['portrait', 'Portrait'], ['landscape', 'Landscape']], 'portrait', null, 'Orientation');
      o.margin = numInput(20, 0, 80, 1);
      o.spacing = select([['1', 'Single (1.0)'], ['1.15', '1.15'], ['1.5', '1.5'], ['2', 'Double (2.0)']], '1.15');
      o.nums = checkbox('Add page numbers', true);
      S.opts.appendChild(h('h3', { text: 'Document settings' }));
      S.opts.appendChild(sec('Font', [o.font]));
      S.opts.appendChild(h('div.pdft-row2', null, [field('Font size (pt)', o.size), field('Line spacing', o.spacing)]));
      S.opts.appendChild(h('div', { style: { height: '14px' } }));
      S.opts.appendChild(sec('Page size', [o.page]));
      S.opts.appendChild(sec('Orientation', [o.orient]));
      S.opts.appendChild(field('Margins (mm)', o.margin));
      S.opts.appendChild(sec(null, [o.nums]));
      upd();
    }
    var upd = function () {};
    setup();
    async function build(S) {
      var text = ta.value;
      if (!text.trim()) throw new Error('Type or paste some text first.');
      var doc = await newDoc();
      var font = await doc.embedFont(PDFLib.StandardFonts[o.font.get()]);
      var numFont = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
      var clean = winAnsiSanitizer(font);
      text = clean(text.replace(/\r\n?/g, '\n'));
      var size = Math.max(6, Math.min(48, parseFloat(o.size.value) || 11));
      var lh = size * 1.2 * parseFloat(o.spacing.value);
      var base = o.page.get() === 'a4' ? A4 : LETTER;
      var pw = o.orient.get() === 'landscape' ? base[1] : base[0], ph = o.orient.get() === 'landscape' ? base[0] : base[1];
      var m = Math.max(0, parseFloat(o.margin.value) || 0) * MM;
      var nums = o.nums.input.checked;
      var maxW = pw - 2 * m;
      if (maxW < size * 3) throw new Error('The margins are too large for this page size.');
      var footer = nums ? Math.max(18, m * 0.5) : 0;
      var usable = ph - 2 * m - footer;
      var perPage = Math.max(1, Math.floor((usable - size) / lh) + 1);
      var cw = {};
      function W(s) {
        var w = 0;
        for (var i = 0; i < s.length; i++) { var ch = s[i]; if (cw[ch] === undefined) cw[ch] = font.widthOfTextAtSize(ch, size); w += cw[ch]; }
        return w;
      }
      S.progress(0.1, 'Laying out text…');
      var lines = [];
      text.split('\n').forEach(function (para) {
        if (para === '') { lines.push(''); return; }
        var cur = '', curW = 0;
        para.split(/( +)/).forEach(function (tok) {
          if (!tok) return;
          var tw = W(tok);
          if (curW + tw <= maxW) { cur += tok; curW += tw; return; }
          if (/^ +$/.test(tok)) { lines.push(cur); cur = ''; curW = 0; return; }
          if (cur.replace(/ +$/, '') !== '') lines.push(cur.replace(/ +$/, ''));
          cur = ''; curW = 0;
          while (tw > maxW) {
            var k = 1, acc = W(tok[0]);
            while (k < tok.length && acc + W(tok[k]) <= maxW) { acc += W(tok[k]); k++; }
            lines.push(tok.slice(0, k));
            tok = tok.slice(k); tw = W(tok);
          }
          cur = tok; curW = tw;
        });
        lines.push(cur);
      });
      var total = Math.max(1, Math.ceil(lines.length / perPage));
      for (var p = 0; p < total; p++) {
        var page = doc.addPage([pw, ph]);
        var y = ph - m - size;
        lines.slice(p * perPage, (p + 1) * perPage).forEach(function (ln) {
          if (ln) page.drawText(ln, { x: m, y: y, size: size, font: font, color: PDFLib.rgb(0.07, 0.07, 0.1) });
          y -= lh;
        });
        if (nums) {
          var t = 'Page ' + (p + 1) + ' of ' + total, ns = 9;
          page.drawText(t, { x: (pw - numFont.widthOfTextAtSize(t, ns)) / 2, y: Math.max(10, m * 0.5), size: ns, font: numFont, color: PDFLib.rgb(0.45, 0.47, 0.55) });
        }
        if (p % 10 === 0) { S.progress(0.1 + 0.8 * p / total, 'Page ' + (p + 1) + ' of ' + total + '…'); await tick(); }
      }
      doc.setTitle(txtName);
      doc.setCreator('BISCS Tools');
      var bytes = await savePdf(doc);
      var note = badCharsNote(clean);
      return { data: bytes, name: txtName + '.pdf', title: 'Your PDF is ready', stats: [['Pages', String(total)], ['Lines', String(lines.length)]], note: note || null, noteKind: 'warn' };
    }
  });
  // Characters above U+00FF that WinAnsi (cp1252) can encode.
  var WIN_EXTRA = {};
  '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'.split('').forEach(function (c) { WIN_EXTRA[c] = 1; });

  // -------------------------------------------------------- FILL PDF FORM
  BT.impl('fill-pdf-form', function (root, ctx) {
    var ctrls = [], flatten;
    singlePdf(root, ctx, {
      pdflib: true,
      actionLabel: 'Save filled PDF', actionIcon: 'clipboard-pen-line', busyLabel: 'Saving…',
      setup: function (S, st) {
        ctrls = [];
        var fields = [];
        try { fields = st.doc.getForm().getFields(); } catch (e) { fields = []; }
        var L = PDFLib;
        var usable = fields.filter(function (f) { return !(f instanceof L.PDFButton) && !(f instanceof L.PDFSignature); });
        if (!usable.length) {
          S.main.appendChild(h('div.pdft-fgroup', null, [
            h('h3', { html: icon('info') + ' No fillable form fields found' }),
            h('p', { text: 'This PDF does not contain interactive (AcroForm) fields. You can still type on it with the PDF editor: add text boxes, ticks and your signature anywhere on the page.' }),
            h('a.btn.btn-primary', { href: BT.toolUrl('pdf-editor'), html: icon('file-pen-line') + ' Open Edit PDF' })
          ]));
          S.enable(false);
          S.opts.appendChild(h('p.pdft-hint', { text: 'Nothing to fill in this document.' }));
          return;
        }
        var pageRefs = st.doc.getPages().map(function (p) { return p.ref; });
        function pageOf(f) {
          try {
            var ws = f.acroField.getWidgets();
            for (var i = 0; i < ws.length; i++) {
              var pr = ws[i].P();
              var k = pr ? pageRefs.indexOf(pr) : -1;
              if (k !== -1) return k;
              var ref = st.doc.context.getObjectRef(ws[i].dict);
              var pages = st.doc.getPages();
              for (var j = 0; j < pages.length; j++) {
                var an = pages[j].node.Annots();
                if (an && ref && an.asArray().indexOf(ref) !== -1) return j;
              }
            }
          } catch (e) { /* ignore */ }
          return -1;
        }
        var groups = {};
        usable.forEach(function (f) { var p = pageOf(f); (groups[p] = groups[p] || []).push(f); });
        Object.keys(groups).map(Number).sort(function (a, b) { return (a < 0 ? 1e9 : a) - (b < 0 ? 1e9 : b); }).forEach(function (p) {
          var box = h('div.pdft-fgroup', null, h('h3', { html: icon('file-text') + ' ' + (p >= 0 ? 'Page ' + (p + 1) : 'Other fields') }));
          groups[p].forEach(function (f) { box.appendChild(control(f)); });
          S.main.appendChild(box);
        });
        flatten = checkbox('Flatten form (make fields non-editable)', false);
        S.opts.appendChild(h('h3', { text: 'Form' }));
        S.opts.appendChild(h('div.stats', null, [h('div.stat', null, [h('div.label', { text: 'Fields' }), h('div.value', { text: String(usable.length) })])]));
        S.opts.appendChild(h('div', { style: { height: '14px' } }));
        S.opts.appendChild(sec(null, [flatten, h('p.pdft-hint', { text: 'Flattening prints the values onto the page so they can no longer be changed.' })]));
        S.opts.appendChild(h('button.btn.btn-sm.btn-ghost', { type: 'button', html: icon('eraser') + ' Clear all fields', onclick: function () {
          ctrls.forEach(function (c) { c.clear(); });
        } }));
      },
      run: async function (S, st) {
        var doc = await sourceDoc(st);
        var form = doc.getForm();
        var font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
        var clean = winAnsiSanitizer(font);
        var L = PDFLib, skipped = 0;
        ctrls.forEach(function (c) {
          var f;
          try { f = form.getField(c.name); } catch (e) { skipped++; return; }
          try {
            var v = c.value();
            if (f instanceof L.PDFTextField) {
              var t = clean(v || '');
              var ml = f.getMaxLength();
              if (ml && t.length > ml) t = t.slice(0, ml);
              f.setText(t || undefined);
            } else if (f instanceof L.PDFCheckBox) { if (v) f.check(); else f.uncheck(); }
            else if (f instanceof L.PDFRadioGroup) { if (v) f.select(v); else f.clear(); }
            else if (f instanceof L.PDFDropdown) { if (v && v.length) f.select(Array.isArray(v) ? v : clean(v)); else f.clear(); }
            else if (f instanceof L.PDFOptionList) { if (v && v.length) f.select(v); else f.clear(); }
          } catch (e) { skipped++; console.warn(c.name, e); }
        });
        try { if (form.hasXFA && form.hasXFA()) form.deleteXFA(); } catch (e) { /* ignore */ }
        S.progress(0.6, 'Updating appearance…');
        try { form.updateFieldAppearances(font); } catch (e) { console.warn(e); }
        if (flatten && flatten.input.checked) form.flatten({ updateFieldAppearances: false });
        S.progress(0.8, 'Saving…');
        var bytes = await doc.save({ useObjectStreams: true, updateFieldAppearances: false });
        var note = badCharsNote(clean);
        if (skipped) note = (note ? note + ' ' : '') + skipped + ' field(s) could not be updated.';
        return pdfResult(bytes, st, flatten && flatten.input.checked ? 'filled-flat' : 'filled', {
          title: 'Your form has been filled', stats: [['Fields', String(ctrls.length)]], note: note || null, noteKind: 'warn'
        });
      }
    });
    function nice(name) {
      var n = String(name).split('.').pop().replace(/[_]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
      return n || name;
    }
    function control(f) {
      var L = PDFLib, name = f.getName(), ro = false, el, c = { name: name };
      try { ro = f.isReadOnly(); } catch (e) { /* ignore */ }
      var label = nice(name);
      if (f instanceof L.PDFTextField) {
        var multi = false; try { multi = f.isMultiline(); } catch (e) { /* ignore */ }
        el = multi ? h('textarea', { rows: 3, style: { minHeight: '84px' } }) : h('input', { type: 'text' });
        el.value = (function () { try { return f.getText() || ''; } catch (e) { return ''; } })();
        try { var ml = f.getMaxLength(); if (ml) el.maxLength = ml; } catch (e) { /* ignore */ }
        c.value = function () { return el.value; };
        c.clear = function () { if (!el.disabled) el.value = ''; };
      } else if (f instanceof L.PDFCheckBox) {
        var cb = checkbox(label, f.isChecked());
        el = cb.input;
        c.value = function () { return el.checked; };
        c.clear = function () { if (!el.disabled) el.checked = false; };
        el.disabled = ro;
        ctrls.push(c);
        return h('div.field', { 'data-field': name }, [cb]);
      } else if (f instanceof L.PDFRadioGroup) {
        var opts = f.getOptions(), sel = f.getSelected(), gname = uid('r');
        var wrap = h('div.pdft-radios', { role: 'radiogroup', 'aria-label': label });
        var radios = opts.map(function (op) {
          var r = h('input', { type: 'radio', name: gname, value: op, checked: op === sel, disabled: ro });
          wrap.appendChild(h('label.check', null, [r, h('span', { text: op })]));
          return r;
        });
        c.value = function () { var r = radios.filter(function (x) { return x.checked; })[0]; return r ? r.value : ''; };
        c.clear = function () { if (!ro) radios.forEach(function (r) { r.checked = false; }); };
        ctrls.push(c);
        return h('div.field', { 'data-field': name }, [h('span.label', { html: esc(label) + (ro ? '<span class="pdft-ro">read-only</span>' : '') }), wrap]);
      } else if (f instanceof L.PDFDropdown || f instanceof L.PDFOptionList) {
        var multiSel = false;
        try { multiSel = f.isMultiselect(); } catch (e) { /* ignore */ }
        var options = f.getOptions(), cur = f.getSelected() || [];
        el = h('select', { multiple: multiSel });
        if (!multiSel) el.appendChild(h('option', { value: '', text: '— None —' }));
        options.forEach(function (op) { el.appendChild(h('option', { value: op, text: op, selected: cur.indexOf(op) !== -1 })); });
        if (!multiSel && cur[0] && options.indexOf(cur[0]) === -1) el.appendChild(h('option', { value: cur[0], text: cur[0], selected: true }));
        c.value = function () {
          if (multiSel) return Array.prototype.filter.call(el.options, function (o) { return o.selected; }).map(function (o) { return o.value; });
          return el.value ? (f instanceof L.PDFOptionList ? [el.value] : el.value) : '';
        };
        c.clear = function () { if (!el.disabled) { Array.prototype.forEach.call(el.options, function (o) { o.selected = false; }); if (!multiSel) el.value = ''; } };
      } else {
        return h('div');
      }
      el.disabled = ro;
      el.setAttribute('data-field', name);
      ctrls.push(c);
      var fl = field(label, el);
      if (ro) fl.firstChild.appendChild(h('span.pdft-ro', { text: 'read-only' }));
      return fl;
    }
  });
})();
