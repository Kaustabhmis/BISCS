/*
 * BISCS Tools — Image tools.
 * Resize, convert, compress, crop, rotate/flip, filters, Base64, favicon,
 * watermark, colour picker, meme generator and passport photo maker.
 * Everything runs locally on <canvas>; files are never uploaded.
 */
(function () {
  'use strict';
  var BT = window.BT;
  var doc = document;
  var IMPLS = {};
  /** Register a tool with core (and remember it for the late-boot rescue below). */
  function register(id, fn) { IMPLS[id] = fn; BT.impl(id, fn); }

  // =================================================================== CSS
  var CSS = [
    '.bi-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 14px;margin-bottom:16px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);box-shadow:var(--shadow-sm)}',
    '.bi-head .bi-ic{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#f76b15,#c2410c);flex:none}',
    '.bi-head .bi-name{font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}',
    '.bi-head .bi-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:3px}',
    '.bi-head .bi-txt{flex:1;min-width:0}',
    '.bi-stage{position:relative;min-height:260px}',
    '.bi-stage canvas,.bi-stage img{display:block;max-width:100%;max-height:min(62vh,560px);box-shadow:0 6px 24px -10px rgba(0,0,0,.35)}',
    '.bi-panel .field:last-child{margin-bottom:0}',
    '.bi-panel h3{font-size:1rem;margin:0 0 12px}',
    '.bi-sec{padding-top:14px;margin-top:14px;border-top:1px solid var(--border)}',
    '.bi-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}',
    '.bi-actions .btn-primary{flex:1 1 180px}',
    '.bi-range{display:flex;align-items:center;gap:10px}',
    '.bi-range input[type=range]{flex:1}',
    '.bi-range output,.bi-range .bi-val{min-width:52px;text-align:right;font-variant-numeric:tabular-nums;font-weight:600;font-size:.88rem;color:var(--text-2)}',
    '.bi-chips{display:flex;flex-wrap:wrap;gap:6px}',
    '.bi-chips .chip{padding:6px 11px;font-size:.82rem}',
    '.bi-seg{display:flex;width:100%}.bi-seg button{flex:1}',
    '.bi-wh{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:end}',
    '.bi-wh .bi-lock{height:42px;width:42px;padding:0}',
    '.bi-wh .bi-lock.on{color:var(--brand);border-color:var(--brand);background:var(--brand-soft)}',
    '.bi-files{display:flex;flex-direction:column;gap:8px}',
    '.bi-file{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface)}',
    '.bi-file img{width:52px;height:52px;object-fit:cover;border-radius:8px;background:var(--surface-2)}',
    '.bi-file .n{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.bi-file .m{font-size:.82rem;color:var(--text-3);display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center}',
    '.bi-file .bi-fa{display:flex;gap:6px;align-items:center}',
    '.bi-arrow{color:var(--text-3)}',
    '.bi-compare{position:relative;display:inline-block;max-width:100%;line-height:0;user-select:none;touch-action:none}',
    '.bi-compare img{display:block;max-width:100%;max-height:min(62vh,560px)}',
    '.bi-compare .bi-after{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;clip-path:inset(0 0 0 var(--pos,50%))}',
    '.bi-compare .bi-bar{position:absolute;top:0;bottom:0;left:var(--pos,50%);width:2px;margin-left:-1px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.25);pointer-events:none}',
    '.bi-compare .bi-knob{position:absolute;top:50%;left:var(--pos,50%);width:36px;height:36px;margin:-18px 0 0 -18px;border-radius:50%;background:#fff;color:#111;display:grid;place-items:center;box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:none;font:700 13px/1 var(--font)}',
    '.bi-compare .bi-tag{position:absolute;top:10px;padding:3px 8px;border-radius:6px;background:rgba(0,0,0,.6);color:#fff;font:600 11px/1.4 var(--font);pointer-events:none}',
    '.bi-compare input[type=range]{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:ew-resize;margin:0}',
    // cropper
    '.bi-crop{position:relative;display:inline-block;max-width:100%;line-height:0;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}',
    '.bi-crop canvas{display:block;max-width:100%;max-height:min(64vh,580px);box-shadow:none}',
    '.bi-cbox{position:absolute;box-shadow:0 0 0 9999px rgba(8,10,20,.58);outline:1.5px solid #fff;cursor:move;touch-action:none}',
    '.bi-cbox:focus-visible{outline:2px solid var(--brand);border-radius:0}',
    '.bi-cbox i.g{position:absolute;background:rgba(255,255,255,.45);pointer-events:none}',
    '.bi-cbox i.g1{left:33.33%;top:0;bottom:0;width:1px}.bi-cbox i.g2{left:66.66%;top:0;bottom:0;width:1px}',
    '.bi-cbox i.g3{top:33.33%;left:0;right:0;height:1px}.bi-cbox i.g4{top:66.66%;left:0;right:0;height:1px}',
    '.bi-cbox b{position:absolute;width:18px;height:18px;margin:-9px 0 0 -9px;background:#fff;border:2px solid #f76b15;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4)}',
    '.bi-cbox b.e,.bi-cbox b.w{width:8px;height:26px;margin:-13px 0 0 -4px;border-radius:4px}',
    '.bi-cbox b.n,.bi-cbox b.s{width:26px;height:8px;margin:-4px 0 0 -13px;border-radius:4px}',
    '@media (pointer:coarse){.bi-cbox b{width:26px;height:26px;margin:-13px 0 0 -13px}}',
    '.bi-cbox b.nw{left:0;top:0;cursor:nwse-resize}.bi-cbox b.ne{left:100%;top:0;cursor:nesw-resize}',
    '.bi-cbox b.sw{left:0;top:100%;cursor:nesw-resize}.bi-cbox b.se{left:100%;top:100%;cursor:nwse-resize}',
    '.bi-cbox b.n{left:50%;top:0;cursor:ns-resize}.bi-cbox b.s{left:50%;top:100%;cursor:ns-resize}',
    '.bi-cbox b.w{left:0;top:50%;cursor:ew-resize}.bi-cbox b.e{left:100%;top:50%;cursor:ew-resize}',
    '.bi-cbox.fixed b.n,.bi-cbox.fixed b.s,.bi-cbox.fixed b.e,.bi-cbox.fixed b.w{display:none}',
    '.bi-csize{position:absolute;left:50%;bottom:-30px;transform:translateX(-50%);background:rgba(0,0,0,.72);color:#fff;font:600 11px/1 var(--font);padding:5px 8px;border-radius:6px;white-space:nowrap;pointer-events:none}',
    '.bi-cbox.top-out .bi-csize{bottom:auto;top:6px}',
    // misc
    '.bi-grid9{display:grid;grid-template-columns:repeat(3,38px);gap:5px}',
    '.bi-grid9 button{width:38px;height:38px;border-radius:9px;border:1px solid var(--border-strong);background:var(--surface);cursor:pointer;display:grid;place-items:center;padding:0}',
    '.bi-grid9 button::after{content:"";width:9px;height:9px;border-radius:50%;background:var(--text-3)}',
    '.bi-grid9 button.active{border-color:var(--brand);background:var(--brand-soft)}.bi-grid9 button.active::after{background:var(--brand)}',
    '.bi-grid9.off{opacity:.45;pointer-events:none}',
    '.bi-icobtns{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px}',
    '.bi-icobtns .btn{height:auto;padding:12px 8px;flex-direction:column;gap:6px;font-size:.82rem}',
    '.bi-icobtns .btn svg{width:22px;height:22px}',
    '.bi-presets{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px}',
    '.bi-presets button{border:2px solid var(--border);background:var(--surface);border-radius:10px;padding:4px;cursor:pointer;font:600 .76rem var(--font);color:var(--text-2);display:flex;flex-direction:column;gap:4px;align-items:center}',
    '.bi-presets button canvas{width:100%;height:auto;border-radius:6px;display:block}',
    '.bi-presets button.active{border-color:var(--brand);color:var(--brand)}',
    '.bi-swatch{width:100%;height:84px;border-radius:12px;border:1px solid var(--border);box-shadow:inset 0 0 0 1px rgba(0,0,0,.04)}',
    '.bi-codes{display:flex;flex-direction:column;gap:8px;margin-top:12px}',
    '.bi-code{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 12px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2)}',
    '.bi-code .k{font-size:.72rem;font-weight:700;color:var(--text-3);width:34px}',
    '.bi-code .v{flex:1;font-family:var(--mono);font-size:.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.bi-palette{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:10px}',
    '.bi-pal{border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface);cursor:pointer;padding:0;font:inherit;color:var(--text);text-align:left}',
    '.bi-pal span{display:block;height:64px}',
    '.bi-pal small{display:flex;justify-content:space-between;padding:6px 8px;font-family:var(--mono);font-size:.76rem}',
    '.bi-pal:hover{box-shadow:var(--shadow)}',
    '.bi-hist{display:flex;flex-wrap:wrap;gap:6px}',
    '.bi-hist button{width:28px;height:28px;border-radius:8px;border:1px solid var(--border-strong);cursor:pointer;padding:0}',
    '.bi-pick{position:relative;display:inline-block;line-height:0;cursor:crosshair;touch-action:none}',
    '.bi-pick canvas{display:block;max-width:100%;max-height:min(64vh,580px)}',
    '.bi-lens{position:absolute;width:120px;height:120px;border-radius:50%;border:3px solid #fff;box-shadow:0 6px 20px rgba(0,0,0,.45);pointer-events:none;overflow:hidden;display:none;image-rendering:pixelated;background:#000}',
    '.bi-lens canvas{width:100%;height:100%;max-height:none;image-rendering:pixelated}',
    '.bi-lens::after{content:"";position:absolute;left:50%;top:50%;width:11px;height:11px;margin:-5.5px 0 0 -5.5px;border:1.5px solid #fff;box-shadow:0 0 0 1px #000}',
    '.bi-sizes{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end}',
    '.bi-sizes figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.bi-sizes figure canvas{image-rendering:auto;box-shadow:none;border-radius:2px}',
    '.bi-sizes figcaption{font-size:.72rem;color:var(--text-3);font-weight:600}',
    '.bi-tab{display:flex;align-items:center;gap:8px;max-width:260px;padding:8px 12px;border-radius:10px 10px 0 0;background:var(--surface);border:1px solid var(--border);border-bottom:0;font-size:.82rem}',
    '.bi-tab canvas{width:16px;height:16px;box-shadow:none}',
    '.bi-tabbar{background:var(--surface-2);padding:8px 8px 0;border-radius:10px;border:1px solid var(--border)}',
    '.bi-sheet{background:#fff;box-shadow:0 10px 30px -12px rgba(0,0,0,.4)}',
    '.bi-steps{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}',
    '.bi-steps span{display:inline-flex;align-items:center;gap:6px;font-size:.82rem;font-weight:600;color:var(--text-3)}',
    '.bi-steps span i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-style:normal;background:var(--surface-2);border:1px solid var(--border)}',
    '.bi-steps span.on{color:var(--text)}.bi-steps span.on i{background:var(--brand);color:#fff;border-color:var(--brand)}',
    '.bi-ta{min-height:110px;font-family:var(--mono);font-size:.8rem;word-break:break-all}',
    '.bi-loading{display:flex;align-items:center;gap:10px;color:var(--text-3);padding:40px 0}',
    '.bi-hold{position:absolute;right:10px;top:10px;z-index:2}',
    '.bi-under{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;margin-top:10px;font-size:.84rem;color:var(--text-3)}',
    '.bi-alt{text-align:center;margin-top:14px}',
    '.bi-xy{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px}',
    '.bi-paste{margin-top:10px;text-align:center;font-size:.84rem;color:var(--text-3)}'
  ].join('\n');

  function injectCSS() {
    if (doc.getElementById('bi-style')) return;
    var s = doc.createElement('style');
    s.id = 'bi-style';
    s.textContent = CSS;
    doc.head.appendChild(s);
  }

  // ================================================================ Helpers
  var h = BT.h, esc = BT.esc;
  var uid = 0;
  function nid(p) { uid++; return 'bi-' + (p || 'f') + uid; }

  function mk(w, hgt) {
    var c = doc.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(hgt));
    return c;
  }
  function c2d(c) { return c.getContext('2d'); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  var MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'image/svg+xml': 'svg', 'image/bmp': 'bmp' };
  var MIME_LABEL = { 'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/webp': 'WebP', 'image/gif': 'GIF', 'image/avif': 'AVIF', 'image/svg+xml': 'SVG', 'image/bmp': 'BMP' };
  function typeLabel(t, name) {
    return MIME_LABEL[t] || (String(name || '').split('.').pop() || 'IMG').toUpperCase();
  }

  // Which formats can this browser's canvas encode?
  var encCache = {};
  function canEncode(mime) {
    if (mime in encCache) return encCache[mime];
    var ok = false;
    try { ok = mk(2, 2).toDataURL(mime).indexOf('data:' + mime) === 0; } catch (e) { ok = false; }
    return (encCache[mime] = ok);
  }

  /** Decode a File into a canvas (EXIF orientation applied). */
  function decode(file) {
    var bmpP = window.createImageBitmap && !/svg/.test(file.type)
      ? createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return null; })
      : Promise.resolve(null);
    return bmpP.then(function (bmp) {
      if (bmp) return bmp;
      return new Promise(function (res, rej) {
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function () { URL.revokeObjectURL(url); res(img); };
        img.onerror = function () {
          URL.revokeObjectURL(url);
          rej(new Error('Could not read “' + file.name + '”. Please choose a JPG, PNG, WebP or GIF image.'));
        };
        img.src = url;
      });
    }).then(function (src) {
      var w = src.naturalWidth || src.width || 512, hh = src.naturalHeight || src.height || 512;
      var c = mk(w, hh);
      c2d(c).drawImage(src, 0, 0, w, hh);
      if (src.close) src.close();
      return { canvas: c, w: w, h: hh, name: file.name, size: file.size, type: file.type, file: file };
    });
  }

  /** True when any pixel is not fully opaque (sampled on a reduced copy for big images). */
  function hasAlpha(canvas) {
    var c = canvas, max = 1200;
    if (c.width * c.height > max * max) {
      var s = max / Math.max(c.width, c.height);
      c = mk(c.width * s, c.height * s);
      c2d(c).drawImage(canvas, 0, 0, c.width, c.height);
    }
    var d = c2d(c).getImageData(0, 0, c.width, c.height).data;
    for (var i = 3; i < d.length; i += 4) if (d[i] < 255) return true;
    return false;
  }

  /** High quality draw: halve the source repeatedly before a big downscale. */
  function drawHQ(ctx, src, sx, sy, sw, sh, dx, dy, dw, dh) {
    var cur = src, cx = sx, cy = sy, cw = sw, ch = sh;
    while (cw / 2 >= Math.abs(dw) && ch / 2 >= Math.abs(dh) && cw > 2 && ch > 2) {
      var t = mk(cw / 2, ch / 2);
      var tc = c2d(t);
      tc.imageSmoothingEnabled = true;
      tc.imageSmoothingQuality = 'high';
      tc.drawImage(cur, cx, cy, cw, ch, 0, 0, t.width, t.height);
      cur = t; cx = 0; cy = 0; cw = t.width; ch = t.height;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cur, cx, cy, cw, ch, dx, dy, dw, dh);
  }

  function scaled(src, w, hh) {
    var c = mk(w, hh);
    drawHQ(c2d(c), src, 0, 0, src.width, src.height, 0, 0, c.width, c.height);
    return c;
  }

  /** Copy of the canvas with a solid background behind transparent pixels. */
  function flatten(canvas, color) {
    var c = mk(canvas.width, canvas.height), x = c2d(c);
    x.fillStyle = color || '#ffffff';
    x.fillRect(0, 0, c.width, c.height);
    x.drawImage(canvas, 0, 0);
    return c;
  }

  /** Encode a canvas. JPEG gets a white (or given) background first. Resolves {blob, mime, ext}. */
  function encode(canvas, mime, quality, bg) {
    mime = mime || 'image/png';
    if (!canEncode(mime)) mime = mime === 'image/png' ? 'image/png' : (canEncode('image/jpeg') ? 'image/jpeg' : 'image/png');
    var src = mime === 'image/jpeg' ? flatten(canvas, bg) : canvas;
    return BT.canvasToBlob(src, mime, mime === 'image/png' ? undefined : quality).then(function (blob) {
      if (!blob) throw new Error('This image is too large for your browser to encode.');
      var m = blob.type || mime;
      return { blob: blob, mime: m, ext: MIME_EXT[m] || 'png' };
    });
  }

  /** Best output mime for a source type when the user picks "same as original". */
  function sameMime(type) {
    return (type === 'image/jpeg' || type === 'image/png' || type === 'image/webp') && canEncode(type) ? type : 'image/png';
  }

  function pctSaved(before, after) {
    if (!before) return 0;
    return Math.round((1 - after / before) * 1000) / 10;
  }

  // ------------------------------------------------------------- UI bits
  function field(label, control, hint) {
    var id = control.id || (control.id = nid());
    var lab = h('label', { 'for': id, text: label });
    return h('div.field', null, [lab, control, hint ? h('span.hint', { html: hint }) : null]);
  }
  function input(type, value, attrs) {
    var el = h('input', Object.assign({ type: type, id: nid() }, attrs || {}));
    el.value = value;
    return el;
  }
  function select(options, value) {
    var el = h('select', { id: nid() });
    options.forEach(function (o) {
      var opt = h('option', { value: o[0], text: o[1] });
      el.appendChild(opt);
    });
    el.value = value;
    return el;
  }
  /** Range slider with live value read-out. fmt(v) formats the label. */
  function range(label, min, max, step, value, fmt, hint) {
    var el = input('range', value, { min: min, max: max, step: step });
    var out = h('span.bi-val', { 'aria-hidden': 'true' });
    var f = fmt || function (v) { return v; };
    function upd() { out.textContent = f(Number(el.value)); }
    el.addEventListener('input', upd);
    upd();
    var lab = h('label', { 'for': el.id, text: label });
    var wrap = h('div.field', null, [lab, h('div.bi-range', null, [el, out]), hint ? h('span.hint', { text: hint }) : null]);
    wrap.input = el;
    wrap.refresh = upd;
    return wrap;
  }
  function checkbox(label, checked) {
    var el = h('input', { type: 'checkbox', id: nid() });
    el.checked = !!checked;
    var lab = h('label.check', { 'for': el.id }, [el, h('span', { text: label })]);
    lab.input = el;
    return lab;
  }
  /** Segmented control. items: [[value,label]]. Returns element with .value and onchange(cb). */
  function seg(items, value, onChange, label) {
    var el = h('div.seg.bi-seg', { role: 'group', 'aria-label': label || 'Options' });
    el.value = value;
    items.forEach(function (it) {
      var b = h('button', { type: 'button', text: it[1], 'data-v': it[0], 'aria-pressed': String(it[0] === value) });
      if (it[0] === value) b.classList.add('active');
      b.addEventListener('click', function () {
        el.set(it[0]);
        if (onChange) onChange(it[0]);
      });
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
  function btn(cls, iconName, text, onClick, attrs) {
    var b = h('button.btn' + (cls ? '.' + cls.split(' ').join('.') : ''), Object.assign({ type: 'button', html: (iconName ? BT.icon(iconName) : '') + '<span>' + esc(text) + '</span>' }, attrs || {}));
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }
  function stat(label, value) {
    var v = h('div.value', { text: value == null ? '—' : value });
    var s = h('div.stat', null, [h('div.label', { text: label }), v]);
    s.set = function (t) { v.textContent = t; };
    return s;
  }
  function loadingEl(text) {
    return h('div.bi-loading', { html: '<span class="spinner"></span> ' + esc(text || 'Reading image…') });
  }

  /** File info header with Start over button. */
  function infoBar(im, onReset, extra) {
    var meta = h('div.bi-meta', { html:
      '<span class="badge">' + esc(typeLabel(im.type, im.name)) + '</span>' +
      '<span class="badge">' + im.w + ' × ' + im.h + ' px</span>' +
      '<span class="badge">' + BT.fmtBytes(im.size) + '</span>' + (extra || '') });
    return h('div.bi-head', null, [
      h('span.bi-ic', { html: BT.icon('image') }),
      h('div.bi-txt', null, [h('div.bi-name', { text: im.name, title: im.name }), meta]),
      btn('btn-ghost btn-sm', 'rotate-ccw', 'Start over', onReset)
    ]);
  }

  /** Two-column editor: preview stage on the left, settings card on the right. */
  function editorLayout(root, im, onReset, title) {
    root.appendChild(infoBar(im, onReset));
    var stage = h('div.preview-box.bi-stage');
    var panel = h('div.card.bi-panel', null, [h('h3', { text: title || 'Settings' })]);
    var actions = h('div.bi-actions');
    var left = h('div', null, [stage]);
    root.appendChild(h('div.split.wide-left', null, [left, h('div', null, [panel])]));
    panel.appendChild(actions);
    return {
      stage: stage, left: left, actions: actions,
      add: function (el) { panel.insertBefore(el, actions); return el; }
    };
  }

  /** Paste-an-image support while a dropzone is on screen. */
  function pasteSupport(root, onFiles) {
    if (root._biPaste) doc.removeEventListener('paste', root._biPaste);
    root._biPaste = function (e) {
      if (!root.isConnected || !root.querySelector('.dropzone:not(.compact)')) return;
      var items = (e.clipboardData && e.clipboardData.files) || [];
      var files = Array.prototype.filter.call(items, function (f) { return /^image\//.test(f.type); });
      if (files.length) { e.preventDefault(); onFiles(files); }
    };
    doc.addEventListener('paste', root._biPaste);
  }

  /**
   * Single-image tool scaffold: dropzone → decode → build(im, api).
   * build may return {destroy} for cleanup on reset.
   */
  function singleTool(root, ctx, opts, build) {
    injectCSS();
    var cleanup = null;
    function reset() {
      if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
      root.innerHTML = '';
      root.appendChild(BT.dropzone({
        accept: 'image/*', title: opts.title || 'Choose an image', icon: opts.icon || 'image-plus',
        hint: opts.hint || 'or drag and drop it here · JPG, PNG, WebP, GIF',
        color: ctx.category && ctx.category.color, onFiles: function (f) { open(f[0]); }
      }));
      root.appendChild(h('p.bi-paste', { html: BT.icon('copy') + ' You can also paste an image with Ctrl + V' }));
      if (opts.extra) root.appendChild(opts.extra(openCanvas));
    }
    function openCanvas(im) {
      root.innerHTML = '';
      var r = build(im, { reset: reset, root: root });
      cleanup = r && r.destroy;
    }
    function open(file) {
      root.innerHTML = '';
      root.appendChild(loadingEl());
      decode(file).then(openCanvas).catch(function (e) {
        BT.toast(e.message || 'Could not read this image', 'error');
        reset();
      });
    }
    pasteSupport(root, function (f) { open(f[0]); });
    reset();
  }

  /** Read basic info (dims + thumbnail URL) for a batch of files without decoding them all. */
  function probe(file) {
    return new Promise(function (res) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { res({ file: file, name: file.name, size: file.size, type: file.type, url: url, w: img.naturalWidth || 512, h: img.naturalHeight || 512 }); };
      img.onerror = function () { URL.revokeObjectURL(url); res(null); };
      img.src = url;
    });
  }

  /**
   * Batch scaffold for resize / convert / compress.
   * opts.view(items, api) builds the editor; api.addFiles(files), api.reset().
   */
  function batchTool(root, ctx, opts) {
    injectCSS();
    var items = [];
    var cleanup = null;
    function revokeAll() { items.forEach(function (it) { if (it.url) URL.revokeObjectURL(it.url); }); items = []; }
    function reset() {
      if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
      revokeAll();
      root.innerHTML = '';
      root.appendChild(BT.dropzone({
        accept: 'image/*', multiple: true, title: opts.title || 'Choose images', icon: opts.icon || 'images',
        hint: 'or drag and drop them here · JPG, PNG, WebP, GIF · multiple files OK',
        color: ctx.category && ctx.category.color, onFiles: add
      }));
      root.appendChild(h('p.bi-paste', { html: BT.icon('copy') + ' You can also paste an image with Ctrl + V' }));
    }
    function add(files) {
      var first = !items.length;
      if (first) { root.innerHTML = ''; root.appendChild(loadingEl('Reading images…')); }
      Promise.all(files.map(probe)).then(function (list) {
        var bad = list.filter(function (x) { return !x; }).length;
        if (bad) BT.toast(bad + ' file' + (bad > 1 ? 's' : '') + ' could not be read and were skipped', 'error');
        list = list.filter(Boolean);
        if (!list.length && first) return reset();
        items = items.concat(list);
        if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } }
        root.innerHTML = '';
        var r = opts.view(items, { reset: reset, addFiles: add, remove: remove, root: root });
        cleanup = r && r.destroy;
      });
    }
    function remove(it) {
      var i = items.indexOf(it);
      if (i < 0) return;
      if (it.url) URL.revokeObjectURL(it.url);
      items.splice(i, 1);
      if (!items.length) return reset();
      if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } }
      root.innerHTML = '';
      var r = opts.view(items, { reset: reset, addFiles: add, remove: remove, root: root });
      cleanup = r && r.destroy;
    }
    pasteSupport(root, add);
    reset();
  }

  /**
   * Shared batch processing engine. process(item) → Promise<{blob, ext, w, h}>.
   * Re-runs automatically when schedule() is called; stale runs are abandoned.
   */
  function batchEngine(items, process, onItem, onProgress) {
    var gen = 0;
    var results = new Map();
    function run() {
      var my = ++gen;
      results.clear();
      var i = 0;
      onProgress && onProgress(0, items.length);
      function next() {
        if (my !== gen) return Promise.resolve(false);
        if (i >= items.length) { onProgress && onProgress(items.length, items.length); return Promise.resolve(true); }
        var it = items[i++];
        onItem(it, null, 'working');
        return Promise.resolve().then(function () { return process(it); }).then(function (r) {
          if (my !== gen) return;
          results.set(it, r);
          onItem(it, r, 'done');
        }, function (e) {
          if (my !== gen) return;
          console.error(e);
          results.set(it, { error: e.message || String(e) });
          onItem(it, { error: e.message || String(e) }, 'error');
        }).then(function () {
          onProgress && onProgress(i, items.length);
          return new Promise(function (r) { setTimeout(r, 0); });
        }).then(next);
      }
      return (current = next());
    }
    var current = Promise.resolve(true);
    var schedule = BT.debounce(run, 350);
    return {
      run: run,
      schedule: schedule,
      results: results,
      /** Resolves when every item has a fresh result. */
      ready: function () {
        var chk = function () {
          return current.then(function () {
            if (results.size >= items.length) return results;
            return run().then(chk);
          });
        };
        return chk();
      },
      stop: function () { gen++; }
    };
  }

  /** One row in a batch list. */
  function fileRow(it, onRemove) {
    var meta = h('div.m');
    var acts = h('div.bi-fa');
    var row = h('div.bi-file', null, [
      h('img', { src: it.url, alt: '' }),
      h('div', { style: { minWidth: 0 } }, [h('div.n', { text: it.name, title: it.name }), meta]),
      acts
    ]);
    if (onRemove) acts.appendChild(h('button.btn.btn-ghost.btn-sm', { type: 'button', 'aria-label': 'Remove ' + it.name, html: BT.icon('x'), onclick: onRemove }));
    row.meta = meta;
    row.acts = acts;
    return row;
  }

  function outName(name, suffix, ext) {
    return BT.baseName(name) + (suffix || '') + '.' + ext;
  }

  // ============================================================== CROPPER
  /**
   * Interactive crop box over a canvas preview.
   * opts: { aspect (w/h number or 0 for free), onChange(rect) }
   * Rect values are in natural image pixels.
   */
  function makeCropper(src, opts) {
    opts = opts || {};
    var W = src.width, H = src.height;
    var view = mk(1, 1);
    // Preview canvas limited to ~1600px so huge photos stay snappy.
    var vs = Math.min(1, 1600 / Math.max(W, H));
    view.width = Math.round(W * vs); view.height = Math.round(H * vs);
    drawHQ(c2d(view), src, 0, 0, W, H, 0, 0, view.width, view.height);
    var wrap = h('div.bi-crop');
    var box = h('div.bi-cbox', { tabindex: '0', role: 'slider', 'aria-label': 'Crop area. Use arrow keys to move, Shift + arrows to resize.' });
    box.innerHTML = '<i class="g g1"></i><i class="g g2"></i><i class="g g3"></i><i class="g g4"></i>' +
      ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].map(function (k) { return '<b class="' + k + '" data-h="' + k + '"></b>'; }).join('') +
      '<span class="bi-csize"></span>';
    wrap.appendChild(view);
    wrap.appendChild(box);
    var sizeLbl = box.querySelector('.bi-csize');
    var aspect = opts.aspect || 0;
    var r = { x: 0, y: 0, w: W, h: H };
    var MIN = Math.max(8, Math.round(Math.min(W, H) * 0.02));

    function paint() {
      box.style.left = (r.x / W * 100) + '%';
      box.style.top = (r.y / H * 100) + '%';
      box.style.width = (r.w / W * 100) + '%';
      box.style.height = (r.h / H * 100) + '%';
      box.classList.toggle('fixed', !!aspect);
      box.classList.toggle('top-out', r.y + r.h > H * 0.9);
      sizeLbl.textContent = Math.round(r.w) + ' × ' + Math.round(r.h);
      if (opts.onChange) opts.onChange(get());
    }
    function get() {
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.max(1, Math.round(r.w)), h: Math.max(1, Math.round(r.h)) };
    }
    function fitAspect(a) {
      // Largest centred box of aspect a (or 80% free box).
      if (!a) {
        r = { x: W * 0.05, y: H * 0.05, w: W * 0.9, h: H * 0.9 };
        return;
      }
      var w = W, hh = W / a;
      if (hh > H) { hh = H; w = H * a; }
      w *= 0.9; hh *= 0.9;
      r = { x: (W - w) / 2, y: (H - hh) / 2, w: w, h: hh };
    }
    function setAspect(a) { aspect = a || 0; fitAspect(aspect); paint(); }
    function set(nr) {
      var w = clamp(nr.w, MIN, W), hh = clamp(nr.h, MIN, H);
      if (aspect) {
        if (nr._from === 'h') w = hh * aspect; else hh = w / aspect;
        if (hh > H) { hh = H; w = hh * aspect; }
        if (w > W) { w = W; hh = w / aspect; }
      }
      r = { x: clamp(nr.x, 0, W - w), y: clamp(nr.y, 0, H - hh), w: w, h: hh };
      paint();
    }

    // Pointer interaction
    var drag = null;
    function pt(e) {
      var b = view.getBoundingClientRect();
      return { x: (e.clientX - b.left) / b.width * W, y: (e.clientY - b.top) / b.height * H };
    }
    box.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      var handle = e.target.getAttribute && e.target.getAttribute('data-h');
      drag = { h: handle || 'move', p: pt(e), r: { x: r.x, y: r.y, w: r.w, h: r.h } };
      box.setPointerCapture(e.pointerId);
      box.focus({ preventScroll: true });
    });
    box.addEventListener('pointermove', function (e) {
      if (!drag) return;
      e.preventDefault();
      var p = pt(e), o = drag.r, dx = p.x - drag.p.x, dy = p.y - drag.p.y;
      if (drag.h === 'move') {
        r.x = clamp(o.x + dx, 0, W - o.w);
        r.y = clamp(o.y + dy, 0, H - o.h);
        paint();
        return;
      }
      var k = drag.h;
      if (k.length === 2) {
        // Corner: anchor is the opposite corner.
        var sx = k[1] === 'e' ? 1 : -1, sy = k[0] === 's' ? 1 : -1;
        var ax = sx > 0 ? o.x : o.x + o.w, ay = sy > 0 ? o.y : o.y + o.h;
        var maxW = sx > 0 ? W - ax : ax, maxH = sy > 0 ? H - ay : ay;
        var w = clamp(sx * (p.x - ax), MIN, maxW), hh = clamp(sy * (p.y - ay), MIN, maxH);
        if (aspect) {
          if (w / hh > aspect) w = hh * aspect; else hh = w / aspect;
          if (w > maxW) { w = maxW; hh = w / aspect; }
          if (hh > maxH) { hh = maxH; w = hh * aspect; }
        }
        r = { x: sx > 0 ? ax : ax - w, y: sy > 0 ? ay : ay - hh, w: w, h: hh };
      } else if (!aspect) {
        var nr = { x: o.x, y: o.y, w: o.w, h: o.h };
        if (k === 'e') nr.w = clamp(o.w + dx, MIN, W - o.x);
        if (k === 's') nr.h = clamp(o.h + dy, MIN, H - o.y);
        if (k === 'w') { var nx = clamp(o.x + dx, 0, o.x + o.w - MIN); nr.w = o.x + o.w - nx; nr.x = nx; }
        if (k === 'n') { var ny = clamp(o.y + dy, 0, o.y + o.h - MIN); nr.h = o.y + o.h - ny; nr.y = ny; }
        r = nr;
      }
      paint();
    });
    function end() { drag = null; }
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
    box.addEventListener('keydown', function (e) {
      var step = (e.altKey ? 1 : Math.max(1, Math.round(Math.min(W, H) / 100)));
      var dx = 0, dy = 0;
      if (e.key === 'ArrowLeft') dx = -step; else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step; else if (e.key === 'ArrowDown') dy = step;
      else return;
      e.preventDefault();
      if (e.shiftKey) set({ x: r.x, y: r.y, w: r.w + dx + (aspect ? dy * aspect : 0), h: r.h + dy, _from: dx ? 'w' : 'h' });
      else set({ x: r.x + dx, y: r.y + dy, w: r.w, h: r.h });
    });
    // Drag on the image outside the box draws a new box.
    view.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      var p = pt(e);
      r = { x: p.x, y: p.y, w: MIN, h: aspect ? MIN / aspect : MIN };
      r.x = clamp(r.x, 0, W - r.w); r.y = clamp(r.y, 0, H - r.h);
      paint();
      drag = { h: 'se', p: p, r: { x: r.x, y: r.y, w: r.w, h: r.h } };
      box.setPointerCapture(e.pointerId);
    });

    fitAspect(aspect);
    paint();
    return { el: wrap, get: get, set: set, setAspect: setAspect, view: view };
  }

  var ASPECTS = [
    ['free', 'Free', 0], ['1:1', '1:1', 1], ['4:3', '4:3', 4 / 3], ['3:4', '3:4', 3 / 4], ['16:9', '16:9', 16 / 9],
    ['9:16', '9:16', 9 / 16], ['3:2', '3:2', 3 / 2], ['passport', 'Passport 35:45', 35 / 45]
  ];

  /** Chip group (single choice). */
  function chipGroup(items, value, onPick, label) {
    var el = h('div.bi-chips', { role: 'group', 'aria-label': label || 'Presets' });
    items.forEach(function (it) {
      var c = h('button.chip', { type: 'button', text: it[1], 'data-v': it[0], 'aria-pressed': String(it[0] === value) });
      c.addEventListener('click', function () { el.set(it[0]); onPick(it[0], it); });
      el.appendChild(c);
    });
    el.set = function (v) {
      BT.$$('.chip', el).forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-v') === v)); });
    };
    return el;
  }

  /** Output format select (+ quality slider that hides for PNG). */
  function formatControls(type, opts) {
    opts = opts || {};
    var list = [];
    if (opts.same !== false) list.push(['same', 'Same as original (' + typeLabel(sameMime(type)) + ')']);
    list.push(['image/jpeg', 'JPG']);
    list.push(['image/png', 'PNG']);
    if (canEncode('image/webp')) list.push(['image/webp', 'WebP']);
    var sel = select(list, opts.value || (opts.same === false ? 'image/jpeg' : 'same'));
    var q = range('Quality', 10, 100, 1, opts.quality || 90, function (v) { return v + '%'; });
    var wrap = h('div', null, [field('Output format', sel), q]);
    function mime() { return sel.value === 'same' ? sameMime(type) : sel.value; }
    function upd() { q.classList.toggle('hidden', mime() === 'image/png'); }
    sel.addEventListener('change', upd);
    upd();
    return {
      el: wrap, mime: mime, quality: function () { return Number(q.input.value) / 100; },
      key: function () { return mime() + '|' + q.input.value; }
    };
  }

  // Expose a few internals for other image scripts (and tests).
  BT.imageKit = { decode: decode, encode: encode, makeCropper: makeCropper, drawHQ: drawHQ, hasAlpha: hasAlpha };

  // ======================================================== Batch helpers
  /** Header for batch views: count, add more, start over. */
  function batchHeader(items, api, label) {
    var total = items.reduce(function (s, it) { return s + it.size; }, 0);
    var more = BT.dropzone({ accept: 'image/*', multiple: true, compact: true, title: 'Add more images', hint: 'or drop them here', icon: 'image-plus', onFiles: api.addFiles });
    var head = h('div.bi-head', null, [
      h('span.bi-ic', { html: BT.icon('images') }),
      h('div.bi-txt', null, [
        h('div.bi-name', { text: items.length + ' image' + (items.length > 1 ? 's' : '') + ' selected' }),
        h('div.bi-meta', { html: '<span class="badge">' + BT.fmtBytes(total) + ' total</span>' + (label ? '<span class="badge">' + esc(label) + '</span>' : '') })
      ]),
      btn('btn-ghost btn-sm', 'rotate-ccw', 'Start over', api.reset)
    ]);
    return { head: head, more: more };
  }

  function progressBar() {
    var bar = h('span');
    var wrap = h('div.progress', { role: 'progressbar', 'aria-label': 'Progress', 'aria-valuemin': '0', 'aria-valuemax': '100' }, [bar]);
    wrap.set = function (done, total) {
      var p = total ? Math.round(done / total * 100) : 0;
      bar.style.width = p + '%';
      wrap.setAttribute('aria-valuenow', String(p));
      wrap.classList.toggle('hidden', done >= total);
    };
    return wrap;
  }

  /** Before/after comparison slider. */
  function compareView() {
    var before = h('img', { alt: 'Original image' });
    var after = h('img.bi-after', { alt: 'Processed image' });
    var rng = h('input', { type: 'range', min: '0', max: '100', value: '50', 'aria-label': 'Compare original and result' });
    var el = h('div.bi-compare', null, [before, after, h('span.bi-bar'), h('span.bi-knob', { html: '⟷' }),
      h('span.bi-tag', { text: 'Original', style: { left: '10px' } }), h('span.bi-tag', { text: 'Result', style: { right: '10px' } }), rng]);
    function upd() { el.style.setProperty('--pos', rng.value + '%'); }
    rng.addEventListener('input', upd);
    upd();
    var urls = [];
    return {
      el: el,
      setBefore: function (u) { before.src = u; },
      setAfter: function (blob) {
        var u = URL.createObjectURL(blob);
        after.src = u;
        urls.push(u);
        while (urls.length > 2) URL.revokeObjectURL(urls.shift());
      },
      destroy: function () { urls.forEach(function (u) { URL.revokeObjectURL(u); }); }
    };
  }

  /** Item canvas cache for small batches (avoids re-decoding while tweaking). */
  function itemCanvas(it, cache) {
    if (it._im) return Promise.resolve(it._im);
    return decode(it.file).then(function (im) { if (cache) it._im = im; return im; });
  }

  // ========================================================== RESIZER
  var SIZE_PRESETS = [
    ['ig', 'Instagram post', 1080, 1080], ['igp', 'Instagram portrait', 1080, 1350], ['story', 'Story / Reel', 1080, 1920],
    ['fhd', 'Full HD 1920×1080', 1920, 1080], ['hd', 'HD / YouTube thumb', 1280, 720], ['4k', '4K UHD', 3840, 2160],
    ['fb', 'Facebook cover', 851, 315], ['li', 'LinkedIn banner', 1584, 396], ['wa', 'WhatsApp DP', 500, 500],
    ['passport', 'Passport 413×531', 413, 531]
  ];

  register('image-resizer', function (root, ctx) {
    batchTool(root, ctx, { title: 'Choose images to resize', icon: 'scaling', view: view });

    function view(items, api) {
      var single = items.length === 1, first = items[0];
      var cache = items.length <= 3;
      var hb = batchHeader(items, api);
      if (single) root.appendChild(infoBar(first, api.reset));
      else root.appendChild(hb.head);

      var stage = h('div.preview-box.bi-stage');
      var under = h('div.stats', { style: { marginTop: '14px' } });
      var sOrig = stat('Original', first.w + ' × ' + first.h);
      var sNew = stat('New size', '—');
      var sFile = stat('File size', '—');
      under.appendChild(sOrig); under.appendChild(sNew); under.appendChild(sFile);
      var list = h('div.bi-files');
      var prog = progressBar();
      var left = h('div');
      if (single) { left.appendChild(stage); left.appendChild(under); }
      else { left.appendChild(prog); left.appendChild(list); left.appendChild(h('div', { style: { marginTop: '12px' } }, [hb.more])); }

      var panel = h('div.card.bi-panel', null, [h('h3', { text: 'Resize settings' })]);
      root.appendChild(h('div.split.wide-left', null, [left, h('div', null, [panel])]));

      // ---- controls
      var mode = 'px', lock = true, last = 'w';
      var modeSeg = seg([['px', 'By pixels'], ['pct', 'By percentage']], 'px', function (v) { mode = v; sync(); changed(); }, 'Resize mode');
      var wIn = input('number', first.w, { min: 1, max: 20000, inputmode: 'numeric' });
      var hIn = input('number', first.h, { min: 1, max: 20000, inputmode: 'numeric' });
      var lockBtn = h('button.btn.bi-lock.on', { type: 'button', 'aria-pressed': 'true', 'aria-label': 'Lock aspect ratio', title: 'Lock aspect ratio', html: BT.icon('lock') });
      var wh = h('div.bi-wh', null, [field('Width (px)', wIn), h('div.field', null, [h('span.label', { html: '&nbsp;' }), lockBtn]), field('Height (px)', hIn)]);
      var fitSel = select([['stretch', 'Stretch to exact size'], ['cover', 'Crop to fill (no bars)'], ['contain', 'Fit inside (add padding)']], 'cover');
      var fitField = field('When the aspect ratio changes', fitSel);
      var presets = chipGroup(SIZE_PRESETS.map(function (p) { return [p[0], p[1]]; }), '', function (k) {
        var p = SIZE_PRESETS.filter(function (x) { return x[0] === k; })[0];
        setLock(false);
        wIn.value = p[2]; hIn.value = p[3];
        sync(); changed();
      }, 'Size presets');
      var pxGroup = h('div', null, [wh, fitField, h('div.field', null, [h('span.label', { text: 'Popular sizes' }), presets])]);
      var pct = range('Scale', 1, 400, 1, 50, function (v) { return v + '%'; });
      var pctChips = chipGroup([['25', '25%'], ['50', '50%'], ['75', '75%'], ['150', '150%'], ['200', '200%']], '50', function (v) {
        pct.input.value = v; pct.refresh(); changed();
      }, 'Scale presets');
      var pctGroup = h('div.hidden', null, [pct, pctChips]);
      var noUp = checkbox('Don’t enlarge images that are smaller', false);
      var fmt = formatControls(first.type);
      var dlBtn = btn('btn-primary', 'download', single ? 'Download image' : 'Download all (ZIP)');
      var actions = h('div.bi-actions', null, [dlBtn]);
      [h('div.field', null, [modeSeg]), pxGroup, pctGroup, h('div.field', null, [noUp]), h('div.bi-sec', null, [fmt.el]), actions].forEach(function (e) { panel.appendChild(e); });
      if (!single) panel.appendChild(h('p.small.muted', { style: { margin: '10px 0 0' }, text: 'With the lock on, each image keeps its own aspect ratio using the width (or height) you enter.' }));

      function setLock(on) {
        lock = on;
        lockBtn.classList.toggle('on', on);
        lockBtn.setAttribute('aria-pressed', String(on));
        lockBtn.innerHTML = BT.icon(on ? 'lock' : 'link-2');
        fitField.classList.toggle('hidden', on);
      }
      lockBtn.addEventListener('click', function () {
        setLock(!lock);
        if (lock) { presets.set(''); hIn.value = Math.round(BT.num(wIn) * first.h / first.w) || first.h; }
        changed();
      });
      wIn.addEventListener('input', function () {
        last = 'w'; presets.set('');
        if (lock && BT.num(wIn) > 0) hIn.value = Math.max(1, Math.round(BT.num(wIn) * first.h / first.w));
        changed();
      });
      hIn.addEventListener('input', function () {
        last = 'h'; presets.set('');
        if (lock && BT.num(hIn) > 0) wIn.value = Math.max(1, Math.round(BT.num(hIn) * first.w / first.h));
        changed();
      });
      pct.input.addEventListener('input', function () { pctChips.set(pct.input.value); changed(); });
      [noUp.input].forEach(function (e) { e.addEventListener('change', changed); });
      fitSel.addEventListener('change', changed);
      fmt.el.addEventListener('input', changed);
      fmt.el.addEventListener('change', changed);
      function sync() {
        pxGroup.classList.toggle('hidden', mode !== 'px');
        pctGroup.classList.toggle('hidden', mode !== 'pct');
      }
      setLock(true);
      sync();

      function dims(it) {
        var w, hh;
        if (mode === 'pct') {
          var p = Number(pct.input.value) / 100;
          w = it.w * p; hh = it.h * p;
        } else {
          var W = BT.num(wIn), Hh = BT.num(hIn);
          if (lock) {
            if (last === 'h' && Hh > 0) { hh = Hh; w = it.w * Hh / it.h; } else if (W > 0) { w = W; hh = it.h * W / it.w; } else { w = it.w; hh = it.h; }
          } else { w = W > 0 ? W : it.w; hh = Hh > 0 ? Hh : it.h; }
        }
        if (noUp.input.checked && (w > it.w || hh > it.h)) {
          var s = Math.min(it.w / w, it.h / hh);
          w *= s; hh *= s;
        }
        w = clamp(Math.round(w), 1, 16384); hh = clamp(Math.round(hh), 1, 16384);
        return { w: w, h: hh };
      }

      function render(src, d) {
        var out = mk(d.w, d.h), x = c2d(out);
        var fit = (mode === 'px' && !lock) ? fitSel.value : 'stretch';
        var sw = src.width, sh = src.height;
        if (fit === 'cover') {
          var s = Math.max(d.w / sw, d.h / sh), cw = d.w / s, ch = d.h / s;
          drawHQ(x, src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, d.w, d.h);
        } else if (fit === 'contain') {
          var s2 = Math.min(d.w / sw, d.h / sh), dw = sw * s2, dh = sh * s2;
          if (fmt.mime() === 'image/jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, d.w, d.h); }
          drawHQ(x, src, 0, 0, sw, sh, (d.w - dw) / 2, (d.h - dh) / 2, dw, dh);
        } else {
          drawHQ(x, src, 0, 0, sw, sh, 0, 0, d.w, d.h);
        }
        return out;
      }

      function process(it) {
        return itemCanvas(it, cache).then(function (im) {
          var d = dims(it);
          var c = render(im.canvas, d);
          return encode(c, fmt.mime(), fmt.quality()).then(function (e) {
            return { blob: e.blob, ext: e.ext, w: d.w, h: d.h, canvas: single ? c : null, name: outName(it.name, '-' + d.w + 'x' + d.h, e.ext) };
          });
        });
      }

      var rows = new Map();
      if (!single) {
        items.forEach(function (it) {
          var row = fileRow(it, function () { api.remove(it); });
          var dl = h('button.btn.btn-sm', { type: 'button', html: BT.icon('download') + '<span class="sr-only">Download ' + esc(it.name) + '</span>', disabled: true });
          dl.addEventListener('click', function () {
            var r = engine.results.get(it);
            if (r && r.blob) BT.download(r.blob, r.name);
          });
          row.acts.insertBefore(dl, row.acts.firstChild);
          row.dl = dl;
          row.meta.innerHTML = '<span>' + it.w + ' × ' + it.h + '</span><span>' + BT.fmtBytes(it.size) + '</span>';
          rows.set(it, row);
          list.appendChild(row);
        });
      }

      var engine = batchEngine(items, process, function (it, r, state) {
        if (single) {
          if (state === 'working') { stage.style.opacity = '.6'; return; }
          stage.style.opacity = '';
          if (r && r.canvas) {
            stage.innerHTML = '';
            stage.appendChild(r.canvas);
            r.canvas.setAttribute('role', 'img');
            r.canvas.setAttribute('aria-label', 'Resized preview');
            sNew.set(r.w + ' × ' + r.h);
            sFile.set(BT.fmtBytes(r.blob.size));
            r.canvas = null;
          } else if (r && r.error) { stage.innerHTML = '<p class="notice error">' + esc(r.error) + '</p>'; }
          return;
        }
        var row = rows.get(it);
        if (!row) return;
        var base = '<span>' + it.w + ' × ' + it.h + '</span><span class="bi-arrow">→</span>';
        if (state === 'working') { row.meta.innerHTML = base + '<span class="spinner" style="width:12px;height:12px"></span>'; row.dl.disabled = true; }
        else if (r && r.error) row.meta.innerHTML = '<span class="badge danger">' + esc(r.error) + '</span>';
        else { row.meta.innerHTML = base + '<strong>' + r.w + ' × ' + r.h + '</strong><span>' + BT.fmtBytes(r.blob.size) + '</span>'; row.dl.disabled = false; }
      }, function (d, t) { prog.set(d, t); });

      function changed() { engine.schedule(); }

      dlBtn.addEventListener('click', function () {
        BT.busy(dlBtn, function () {
          return engine.ready().then(function (res) {
            var outs = items.map(function (it) { return res.get(it); }).filter(function (r) { return r && r.blob; });
            if (!outs.length) throw new Error('Nothing to download yet');
            if (outs.length === 1) { BT.download(outs[0].blob, outs[0].name); return; }
            return BT.downloadZip(outs.map(function (r) { return { name: r.name, data: r.blob }; }), 'resized-images.zip');
          });
        }, 'Preparing…');
      });

      engine.run();
      return { destroy: function () { engine.stop(); items.forEach(function (it) { it._im = null; }); } };
    }
  });

  // ========================================================= CONVERTER
  register('image-converter', function (root, ctx) {
    batchTool(root, ctx, { title: 'Choose images to convert', icon: 'refresh-cw', view: view });

    function view(items, api) {
      var hb = batchHeader(items, api);
      root.appendChild(hb.head);
      var list = h('div.bi-files');
      var prog = progressBar();
      var panel = h('div.card.bi-panel', null, [h('h3', { text: 'Convert to' })]);
      root.appendChild(h('div.split.wide-left', null, [h('div', null, [prog, list, h('div', { style: { marginTop: '12px' } }, [hb.more])]), h('div', null, [panel])]));

      var targets = [['image/jpeg', 'JPG'], ['image/png', 'PNG']];
      if (canEncode('image/webp')) targets.push(['image/webp', 'WebP']);
      var allPng = items.every(function (it) { return it.type === 'image/png'; });
      var target = allPng ? 'image/jpeg' : 'image/png';
      if (items.every(function (it) { return it.type === 'image/jpeg'; })) target = 'image/png';
      var tSeg = seg(targets, target, function (v) { target = v; upd(); engine.schedule(); }, 'Target format');
      var q = range('Quality', 10, 100, 1, 92, function (v) { return v + '%'; });
      var bg = input('color', '#ffffff');
      var bgField = field('Background for transparent areas', bg, 'JPG has no transparency, so transparent pixels are filled with this colour.');
      var dlBtn = btn('btn-primary', 'download', items.length > 1 ? 'Download all (ZIP)' : 'Download image');
      [h('div.field', null, [tSeg]), q, bgField, h('div.bi-actions', null, [dlBtn])].forEach(function (e) { panel.appendChild(e); });
      if (!canEncode('image/webp')) panel.appendChild(h('p.small.muted', { text: 'Your browser cannot create WebP files. Try Chrome, Edge or Firefox for WebP output.' }));
      function upd() {
        q.classList.toggle('hidden', target === 'image/png');
        bgField.classList.toggle('hidden', target !== 'image/jpeg');
      }
      upd();
      q.input.addEventListener('input', function () { engine.schedule(); });
      bg.addEventListener('input', function () { engine.schedule(); });

      var rows = new Map();
      items.forEach(function (it) {
        var row = fileRow(it, function () { api.remove(it); });
        var dl = h('button.btn.btn-sm', { type: 'button', disabled: true, html: BT.icon('download') + '<span class="sr-only">Download ' + esc(it.name) + '</span>' });
        dl.addEventListener('click', function () { var r = engine.results.get(it); if (r && r.blob) BT.download(r.blob, r.name); });
        row.acts.insertBefore(dl, row.acts.firstChild);
        row.dl = dl;
        rows.set(it, row);
        list.appendChild(row);
      });

      var cache = items.length <= 3;
      var engine = batchEngine(items, function (it) {
        return itemCanvas(it, cache).then(function (im) {
          return encode(im.canvas, target, Number(q.input.value) / 100, bg.value).then(function (e) {
            return { blob: e.blob, ext: e.ext, name: outName(it.name, '', e.ext) };
          });
        });
      }, function (it, r, state) {
        var row = rows.get(it);
        var base = '<span class="badge">' + esc(typeLabel(it.type, it.name)) + '</span><span>' + BT.fmtBytes(it.size) + '</span><span class="bi-arrow">→</span>';
        if (state === 'working') { row.meta.innerHTML = base + '<span class="spinner" style="width:12px;height:12px"></span>'; row.dl.disabled = true; }
        else if (r.error) row.meta.innerHTML = '<span class="badge danger">' + esc(r.error) + '</span>';
        else {
          var p = pctSaved(it.size, r.blob.size);
          row.meta.innerHTML = base + '<span class="badge ok">' + esc(r.ext.toUpperCase()) + '</span><strong>' + BT.fmtBytes(r.blob.size) + '</strong>' +
            '<span class="' + (p >= 0 ? '' : 'muted') + '">' + (p >= 0 ? '−' + p : '+' + Math.abs(p)) + '%</span>';
          row.dl.disabled = false;
        }
      }, function (d, t) { prog.set(d, t); });

      dlBtn.addEventListener('click', function () {
        BT.busy(dlBtn, function () {
          return engine.ready().then(function (res) {
            var outs = items.map(function (it) { return res.get(it); }).filter(function (r) { return r && r.blob; });
            if (outs.length === 1) return BT.download(outs[0].blob, outs[0].name);
            return BT.downloadZip(uniqueNames(outs), 'converted-images.zip');
          });
        }, 'Preparing…');
      });
      engine.run();
      return { destroy: function () { engine.stop(); items.forEach(function (it) { it._im = null; }); } };
    }
  });

  /** Make zip entry names unique ("a.jpg", "a (2).jpg"). */
  function uniqueNames(outs) {
    var seen = {};
    return outs.map(function (r) {
      var n = r.name, k = n.toLowerCase(), i = 1;
      while (seen[k]) { i++; n = BT.baseName(r.name) + ' (' + i + ').' + r.ext; k = n.toLowerCase(); }
      seen[k] = 1;
      return { name: n, data: r.blob };
    });
  }

  // ======================================================== COMPRESSOR
  /** Compress one canvas. o: {mode, quality, targetKB, maxDim, mime}. */
  function compressCanvas(src, o) {
    var c = src;
    if (o.maxDim && Math.max(c.width, c.height) > o.maxDim) {
      var s = o.maxDim / Math.max(c.width, c.height);
      c = scaled(c, c.width * s, c.height * s);
    }
    if (o.mime === 'image/png' || o.mode === 'quality') {
      return encode(c, o.mime, o.quality).then(function (e) { e.w = c.width; e.h = c.height; return e; });
    }
    var target = o.targetKB * 1024;
    var tries = 0;
    function search(cv) {
      var lo = 0.05, hi = 0.95, best = null, n = 0;
      function step() {
        if (n++ >= 7) return Promise.resolve(best);
        var mid = (lo + hi) / 2;
        return encode(cv, o.mime, mid).then(function (e) {
          if (e.blob.size <= target) { best = e; best.q = mid; lo = mid; } else hi = mid;
          return step();
        });
      }
      // Try high quality first: if it already fits, keep it.
      return encode(cv, o.mime, 0.95).then(function (e) {
        if (e.blob.size <= target) { e.q = 0.95; return e; }
        return step();
      }).then(function (best) {
        if (best) { best.w = cv.width; best.h = cv.height; return best; }
        return encode(cv, o.mime, 0.05).then(function (e) {
          if (e.blob.size <= target || ++tries > 8 || cv.width < 32) { e.w = cv.width; e.h = cv.height; e.q = 0.05; e.missed = e.blob.size > target; return e; }
          var f = Math.max(0.3, Math.min(0.9, Math.sqrt(target / e.blob.size) * 1.1));
          return search(scaled(cv, cv.width * f, cv.height * f));
        });
      });
    }
    return search(c);
  }

  register('image-compressor', function (root, ctx) {
    batchTool(root, ctx, { title: 'Choose images to compress', icon: 'file-archive', view: view });

    function view(items, api) {
      var single = items.length === 1, first = items[0];
      var hb = batchHeader(items, api);
      root.appendChild(single ? infoBar(first, api.reset) : hb.head);
      var cmp = compareView();
      cmp.setBefore(first.url);
      var stage = h('div.preview-box.bi-stage', null, [cmp.el]);
      var sBefore = stat('Original', BT.fmtBytes(items.reduce(function (s, it) { return s + it.size; }, 0)));
      var sAfter = stat('Compressed', '—');
      var sSaved = stat('Saved', '—');
      var sDim = stat(single ? 'Dimensions' : 'Images', single ? first.w + ' × ' + first.h : String(items.length));
      var stats = h('div.stats', { style: { marginTop: '14px' } }, [sBefore, sAfter, sSaved, sDim]);
      var list = h('div.bi-files');
      var prog = progressBar();
      var left = h('div');
      if (single) { left.appendChild(stage); left.appendChild(h('p.bi-under', { text: 'Drag the slider to compare the original with the compressed image.' })); left.appendChild(stats); }
      else { left.appendChild(stats); left.appendChild(h('div', { style: { height: '12px' } })); left.appendChild(prog); left.appendChild(list); left.appendChild(h('div', { style: { marginTop: '12px' } }, [hb.more])); }
      var panel = h('div.card.bi-panel', null, [h('h3', { text: 'Compression' })]);
      root.appendChild(h('div.split.wide-left', null, [left, h('div', null, [panel])]));

      var mode = 'quality';
      var mSeg = seg([['quality', 'Quality'], ['target', 'Target size']], mode, function (v) { mode = v; upd(); engine.schedule(); }, 'Compression mode');
      var q = range('Quality', 5, 100, 1, 75, function (v) { return v + '%'; }, 'Lower quality = smaller file. 60–80% looks great for photos.');
      var kb = input('number', Math.max(10, Math.round(first.size / 1024 / 3)), { min: 1, inputmode: 'numeric' });
      var kbField = field('Target size per image (KB)', kb, 'We search for the best quality that fits, and shrink dimensions only if needed.');
      var kbChips = chipGroup([['20', '20 KB'], ['50', '50 KB'], ['100', '100 KB'], ['200', '200 KB'], ['500', '500 KB'], ['1000', '1 MB']], '', function (v) { kb.value = v; engine.schedule(); }, 'Target size presets');
      var targetGroup = h('div', null, [kbField, h('div.field', null, [kbChips])]);
      var maxSel = select([['0', 'Keep original'], ['3840', '3840 px (4K)'], ['2560', '2560 px'], ['1920', '1920 px (Full HD)'], ['1280', '1280 px'], ['1024', '1024 px'], ['800', '800 px'], ['600', '600 px']], '0');
      var fmtList = [['auto', 'Auto (best for each image)'], ['image/jpeg', 'JPG'], ['image/png', 'PNG (lossless)']];
      if (canEncode('image/webp')) fmtList.splice(2, 0, ['image/webp', 'WebP (smallest)']);
      var fmtSel = select(fmtList, 'auto');
      var note = h('p.small.muted', { style: { margin: '0' } });
      var dlBtn = btn('btn-primary', 'download', single ? 'Download compressed' : 'Download all (ZIP)');
      [h('div.field', null, [mSeg]), q, targetGroup, h('div.bi-sec', null, [field('Max width / height', maxSel), field('Output format', fmtSel)]), note, h('div.bi-actions', null, [dlBtn])]
        .forEach(function (e) { panel.appendChild(e); });
      function upd() {
        q.classList.toggle('hidden', mode !== 'quality');
        targetGroup.classList.toggle('hidden', mode !== 'target');
        note.textContent = fmtSel.value === 'image/png' ? 'PNG is lossless: quality has no effect. Reduce the max size or pick JPG/WebP for big savings.' :
          fmtSel.value === 'auto' ? 'Auto keeps JPG for photos, uses WebP for transparent images and converts opaque PNGs to JPG.' : '';
      }
      upd();
      [q.input, kb, maxSel, fmtSel].forEach(function (e) {
        e.addEventListener('input', function () { upd(); engine.schedule(); });
        e.addEventListener('change', function () { upd(); });
      });
      kb.addEventListener('input', function () { kbChips.set(kb.value); });

      function mimeFor(it, alpha) {
        var v = fmtSel.value;
        if (v !== 'auto') return v;
        if (it.type === 'image/webp' && canEncode('image/webp')) return 'image/webp';
        if (alpha) return canEncode('image/webp') ? 'image/webp' : 'image/png';
        return 'image/jpeg';
      }

      var rows = new Map();
      if (!single) items.forEach(function (it) {
        var row = fileRow(it, function () { api.remove(it); });
        var dl = h('button.btn.btn-sm', { type: 'button', disabled: true, html: BT.icon('download') + '<span class="sr-only">Download ' + esc(it.name) + '</span>' });
        dl.addEventListener('click', function () { var r = engine.results.get(it); if (r && r.blob) BT.download(r.blob, r.name); });
        row.acts.insertBefore(dl, row.acts.firstChild);
        row.dl = dl;
        rows.set(it, row);
        list.appendChild(row);
      });

      var cache = items.length <= 3;
      var engine = batchEngine(items, function (it) {
        return itemCanvas(it, cache).then(function (im) {
          if (im.alpha == null) im.alpha = hasAlpha(im.canvas);
          var mime = mimeFor(it, im.alpha);
          var maxDim = Number(maxSel.value) || 0;
          return compressCanvas(im.canvas, { mode: mode, quality: Number(q.input.value) / 100, targetKB: Math.max(1, BT.num(kb) || 1), maxDim: maxDim, mime: mime })
            .then(function (e) {
              var same = e.mime === it.type && e.w === it.w && e.h === it.h;
              if (same && e.blob.size >= it.size && (mode === 'quality' || it.size <= Math.max(1, BT.num(kb)) * 1024)) {
                return { blob: it.file, ext: MIME_EXT[it.type] || e.ext, name: outName(it.name, '-compressed', MIME_EXT[it.type] || e.ext), w: it.w, h: it.h, kept: true };
              }
              return { blob: e.blob, ext: e.ext, name: outName(it.name, '-compressed', e.ext), w: e.w, h: e.h, missed: e.missed };
            });
        });
      }, function (it, r, state) {
        if (state === 'working') {
          if (single) stage.style.opacity = '.7';
          else { var rw = rows.get(it); rw.meta.innerHTML = '<span>' + BT.fmtBytes(it.size) + '</span><span class="spinner" style="width:12px;height:12px"></span>'; rw.dl.disabled = true; }
          return;
        }
        if (single) {
          stage.style.opacity = '';
          if (r.error) { BT.toast(r.error, 'error'); return; }
          cmp.setAfter(r.blob);
          sAfter.set(BT.fmtBytes(r.blob.size));
          var p = pctSaved(it.size, r.blob.size);
          sSaved.set(r.kept ? 'Already optimised' : (p >= 0 ? p + '%' : 'Larger (+' + Math.abs(p) + '%)'));
          sDim.set(r.w + ' × ' + r.h);
          if (r.missed) BT.toast('Could not reach the target size; this is the smallest possible.', 'error');
        } else {
          var row = rows.get(it);
          if (r.error) { row.meta.innerHTML = '<span class="badge danger">' + esc(r.error) + '</span>'; return; }
          var pp = pctSaved(it.size, r.blob.size);
          row.meta.innerHTML = '<span>' + BT.fmtBytes(it.size) + '</span><span class="bi-arrow">→</span><strong>' + BT.fmtBytes(r.blob.size) + '</strong>' +
            (r.kept ? '<span class="badge">Already optimised</span>' : '<span class="badge ' + (pp > 0 ? 'ok' : 'warn') + '">' + (pp >= 0 ? '−' + pp : '+' + Math.abs(pp)) + '%</span>') +
            (r.w !== it.w ? '<span>' + r.w + ' × ' + r.h + '</span>' : '');
          row.dl.disabled = false;
        }
      }, function (d, t) {
        prog.set(d, t);
        if (d >= t) {
          var before = 0, after = 0;
          items.forEach(function (it) { var r = engine.results.get(it); if (r && r.blob) { before += it.size; after += r.blob.size; } });
          if (after) { sAfter.set(BT.fmtBytes(after)); if (!single) sSaved.set(pctSaved(before, after) + '%'); }
        }
      });

      dlBtn.addEventListener('click', function () {
        BT.busy(dlBtn, function () {
          return engine.ready().then(function (res) {
            var outs = items.map(function (it) { return res.get(it); }).filter(function (r) { return r && r.blob; });
            if (outs.length === 1) return BT.download(outs[0].blob, outs[0].name);
            return BT.downloadZip(uniqueNames(outs), 'compressed-images.zip');
          });
        }, 'Preparing…');
      });
      engine.run();
      return { destroy: function () { engine.stop(); cmp.destroy(); items.forEach(function (it) { it._im = null; }); } };
    }
  });

  // =========================================================== CROPPER
  register('image-cropper', function (root, ctx) {
    singleTool(root, ctx, { title: 'Choose an image to crop', icon: 'crop' }, function (im, api) {
      var L = editorLayout(root, im, api.reset, 'Crop settings');
      var ready = false;
      var fx = input('number', 0, { min: 0, inputmode: 'numeric' }), fy = input('number', 0, { min: 0, inputmode: 'numeric' });
      var fw = input('number', im.w, { min: 1, inputmode: 'numeric' }), fh = input('number', im.h, { min: 1, inputmode: 'numeric' });
      var thumb = mk(1, 1);
      thumb.style.maxWidth = '100%';
      thumb.style.maxHeight = '160px';
      var outLbl = h('span.badge');
      var raf = 0;
      var cr = makeCropper(im.canvas, {
        aspect: 0,
        onChange: function (r) {
          if (!ready) return;
          [[fx, r.x], [fy, r.y], [fw, r.w], [fh, r.h]].forEach(function (p) { if (doc.activeElement !== p[0]) p[0].value = p[1]; });
          outLbl.textContent = r.w + ' × ' + r.h + ' px';
          if (!raf) raf = requestAnimationFrame(function () { raf = 0; drawThumb(); });
        }
      });
      L.stage.appendChild(cr.el);
      L.stage.style.paddingBottom = '40px';
      L.left.appendChild(h('p.bi-under', { html: BT.icon('move') + ' Drag the box to move it, pull the handles to resize, or drag on the image to draw a new area. Arrow keys work too.' }));

      function drawThumb() {
        var r = cr.get();
        var s = Math.min(1, 320 / Math.max(r.w, r.h));
        thumb.width = Math.max(1, Math.round(r.w * s));
        thumb.height = Math.max(1, Math.round(r.h * s));
        drawHQ(c2d(thumb), im.canvas, r.x, r.y, r.w, r.h, 0, 0, thumb.width, thumb.height);
      }

      var origRatio = im.w / im.h;
      var aspects = ASPECTS.slice();
      aspects.splice(1, 0, ['orig', 'Original', origRatio]);
      var chips = chipGroup(aspects.map(function (a) { return [a[0], a[1]]; }), 'free', function (k) {
        var a = aspects.filter(function (x) { return x[0] === k; })[0];
        cr.setAspect(a[2]);
      }, 'Aspect ratio');
      L.add(h('div.field', null, [h('span.label', { text: 'Aspect ratio' }), chips]));
      L.add(h('div.row.cols-2.bi-xy', null, [field('X', fx), field('Y', fy), field('Width', fw), field('Height', fh)]));
      [fx, fy, fw, fh].forEach(function (el) {
        el.addEventListener('input', function () {
          var v = function (e) { return Math.max(0, BT.num(e) || 0); };
          cr.set({ x: v(fx), y: v(fy), w: Math.max(1, v(fw)), h: Math.max(1, v(fh)), _from: el === fh ? 'h' : 'w' });
        });
        el.addEventListener('blur', function () { var r = cr.get(); fx.value = r.x; fy.value = r.y; fw.value = r.w; fh.value = r.h; });
      });
      L.add(h('div.field', null, [h('span.label', { html: 'Result preview ' }), h('div.preview-box', { style: { minHeight: '120px' } }, [thumb]), h('div', null, [outLbl])]));
      var fmt = formatControls(im.type);
      L.add(h('div.bi-sec', null, [fmt.el]));
      var dl = btn('btn-primary', 'download', 'Download cropped image');
      dl.addEventListener('click', function () {
        BT.busy(dl, function () {
          var r = cr.get();
          var c = mk(r.w, r.h);
          c2d(c).drawImage(im.canvas, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
          return encode(c, fmt.mime(), fmt.quality()).then(function (e) {
            BT.download(e.blob, outName(im.name, '-cropped', e.ext));
          });
        });
      });
      L.actions.appendChild(dl);
      ready = true;
      cr.setAspect(0);
      return { destroy: function () { cancelAnimationFrame(raf); } };
    });
  });

  // ====================================================== ROTATE & FLIP
  /** Draw src rotated by deg (any angle) and flipped. Returns a new canvas. */
  function transformCanvas(src, deg, fh, fv, bg) {
    var a = deg * Math.PI / 180;
    var cos = Math.abs(Math.cos(a)), sin = Math.abs(Math.sin(a));
    if (cos < 1e-9) cos = 0; if (sin < 1e-9) sin = 0;
    var w = Math.round(src.width * cos + src.height * sin), hh = Math.round(src.width * sin + src.height * cos);
    var c = mk(w, hh), x = c2d(c);
    if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, hh); }
    x.imageSmoothingQuality = 'high';
    x.translate(w / 2, hh / 2);
    x.rotate(a);
    x.scale(fh ? -1 : 1, fv ? -1 : 1);
    x.drawImage(src, -src.width / 2, -src.height / 2);
    return c;
  }

  register('rotate-flip-image', function (root, ctx) {
    singleTool(root, ctx, { title: 'Choose an image to rotate or flip', icon: 'rotate-cw-square' }, function (im, api) {
      var L = editorLayout(root, im, api.reset, 'Rotate & flip');
      var st = { rot: 0, fine: 0, fh: false, fv: false };
      var ps = Math.min(1, 1100 / Math.max(im.w, im.h));
      var small = ps < 1 ? scaled(im.canvas, im.w * ps, im.h * ps) : im.canvas;
      var dimLbl = h('span.badge');
      L.left.appendChild(h('div.bi-under', null, [h('span', { text: 'Output size' }), dimLbl]));
      function draw() {
        var c = transformCanvas(small, st.rot + st.fine, st.fh, st.fv);
        c.setAttribute('role', 'img');
        c.setAttribute('aria-label', 'Preview rotated ' + (st.rot + st.fine) + ' degrees');
        L.stage.innerHTML = '';
        L.stage.appendChild(c);
        var a = (st.rot + st.fine) * Math.PI / 180, co = Math.abs(Math.cos(a)), si = Math.abs(Math.sin(a));
        if (co < 1e-9) co = 0; if (si < 1e-9) si = 0;
        dimLbl.textContent = Math.round(im.w * co + im.h * si) + ' × ' + Math.round(im.w * si + im.h * co) + ' px';
      }
      function b(iconName, label, fn, rot) {
        var el = btn('', iconName, label, function () { fn(); draw(); });
        if (rot) el.querySelector('svg').style.transform = 'rotate(' + rot + 'deg)';
        return el;
      }
      var fine = range('Straighten (fine angle)', -45, 45, 0.5, 0, function (v) { return v + '°'; });
      fine.input.addEventListener('input', function () { st.fine = Number(fine.input.value); draw(); });
      L.add(h('div.bi-icobtns', null, [
        b('rotate-ccw', 'Rotate left', function () { st.rot = (st.rot + 270) % 360; }),
        b('rotate-cw', 'Rotate right', function () { st.rot = (st.rot + 90) % 360; }),
        b('refresh-cw', 'Rotate 180°', function () { st.rot = (st.rot + 180) % 360; }),
        b('flip-horizontal', 'Flip horizontal', function () { st.fh = !st.fh; }),
        b('flip-horizontal', 'Flip vertical', function () { st.fv = !st.fv; }, 90),
        b('undo-2', 'Reset', function () { st = { rot: 0, fine: 0, fh: false, fv: false }; fine.input.value = 0; fine.refresh(); })
      ]));
      L.add(h('div.bi-sec', null, [fine]));
      var fmt = formatControls(im.type);
      L.add(h('div.bi-sec', null, [fmt.el]));
      var dl = btn('btn-primary', 'download', 'Download image');
      dl.addEventListener('click', function () {
        BT.busy(dl, function () {
          var c = transformCanvas(im.canvas, st.rot + st.fine, st.fh, st.fv);
          return encode(c, fmt.mime(), fmt.quality()).then(function (e) { BT.download(e.blob, outName(im.name, '-rotated', e.ext)); });
        });
      });
      L.actions.appendChild(dl);
      draw();
    });
  });

  // ============================================================ FILTERS
  var FILTER_OK = (function () {
    try {
      var x = mk(1, 1).getContext('2d');
      if (!('filter' in x)) return false;
      x.filter = 'blur(2px)';
      return x.filter === 'blur(2px)';
    } catch (e) { return false; }
  })();

  var FDEF = { brightness: 100, contrast: 100, saturate: 100, hue: 0, blur: 0, grayscale: 0, sepia: 0, invert: 0, vignette: 0 };
  var FPRESETS = [
    ['original', 'Original', {}],
    ['vivid', 'Vivid', { saturate: 150, contrast: 115, brightness: 104 }],
    ['bw', 'B&W', { grayscale: 100, contrast: 118 }],
    ['vintage', 'Vintage', { sepia: 45, contrast: 92, brightness: 106, saturate: 85, vignette: 45 }],
    ['warm', 'Warm', { sepia: 22, saturate: 125, brightness: 104, hue: -6 }],
    ['cool', 'Cool', { hue: 14, saturate: 110, brightness: 103, contrast: 105 }],
    ['fade', 'Fade', { contrast: 80, brightness: 114, saturate: 70 }],
    ['drama', 'Dramatic', { contrast: 150, brightness: 92, saturate: 120, vignette: 55 }],
    ['noir', 'Noir', { grayscale: 100, contrast: 165, brightness: 90, vignette: 50 }]
  ];

  function filterString(s, blurScale) {
    return 'brightness(' + s.brightness + '%) contrast(' + s.contrast + '%) saturate(' + s.saturate + '%) hue-rotate(' + s.hue + 'deg)' +
      (s.blur > 0 ? ' blur(' + (s.blur * blurScale).toFixed(2) + 'px)' : '') +
      ' grayscale(' + s.grayscale + '%) sepia(' + s.sepia + '%) invert(' + s.invert + '%)';
  }

  // 3x4 affine colour matrices (values in 0..255 space) for the pixel fallback.
  function mMul(b, a) { // apply a, then b
    var r = [];
    for (var i = 0; i < 3; i++) {
      r[i] = [];
      for (var j = 0; j < 3; j++) r[i][j] = b[i][0] * a[0][j] + b[i][1] * a[1][j] + b[i][2] * a[2][j];
      r[i][3] = b[i][0] * a[0][3] + b[i][1] * a[1][3] + b[i][2] * a[2][3] + b[i][3];
    }
    return r;
  }
  function mLin(m3, off) { return m3.map(function (row, i) { return row.concat([off ? off[i] : 0]); }); }
  function colourMatrix(s) {
    var M = mLin([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    var b = s.brightness / 100, c = s.contrast / 100, sa = s.saturate / 100;
    M = mMul(mLin([[b, 0, 0], [0, b, 0], [0, 0, b]]), M);
    var co = 255 * (0.5 - 0.5 * c);
    M = mMul(mLin([[c, 0, 0], [0, c, 0], [0, 0, c]], [co, co, co]), M);
    M = mMul(mLin([[0.213 + 0.787 * sa, 0.715 - 0.715 * sa, 0.072 - 0.072 * sa], [0.213 - 0.213 * sa, 0.715 + 0.285 * sa, 0.072 - 0.072 * sa], [0.213 - 0.213 * sa, 0.715 - 0.715 * sa, 0.072 + 0.928 * sa]]), M);
    var t = s.hue * Math.PI / 180, cs = Math.cos(t), sn = Math.sin(t);
    M = mMul(mLin([
      [0.213 + cs * 0.787 - sn * 0.213, 0.715 - cs * 0.715 - sn * 0.715, 0.072 - cs * 0.072 + sn * 0.928],
      [0.213 - cs * 0.213 + sn * 0.143, 0.715 + cs * 0.285 + sn * 0.140, 0.072 - cs * 0.072 - sn * 0.283],
      [0.213 - cs * 0.213 - sn * 0.787, 0.715 - cs * 0.715 + sn * 0.715, 0.072 + cs * 0.928 + sn * 0.072]]), M);
    var g = 1 - s.grayscale / 100;
    M = mMul(mLin([[0.2126 + 0.7874 * g, 0.7152 - 0.7152 * g, 0.0722 - 0.0722 * g], [0.2126 - 0.2126 * g, 0.7152 + 0.2848 * g, 0.0722 - 0.0722 * g], [0.2126 - 0.2126 * g, 0.7152 - 0.7152 * g, 0.0722 + 0.9278 * g]]), M);
    var p = 1 - s.sepia / 100;
    M = mMul(mLin([[0.393 + 0.607 * p, 0.769 - 0.769 * p, 0.189 - 0.189 * p], [0.349 - 0.349 * p, 0.686 + 0.314 * p, 0.168 - 0.168 * p], [0.272 - 0.272 * p, 0.534 - 0.534 * p, 0.131 + 0.869 * p]]), M);
    var iv = s.invert / 100, k = 1 - 2 * iv;
    M = mMul(mLin([[k, 0, 0], [0, k, 0], [0, 0, k]], [255 * iv, 255 * iv, 255 * iv]), M);
    return M;
  }
  function boxBlur(img, w, hh, r) {
    r = Math.round(r);
    if (r < 1) return;
    var d = img.data, tmp = new Float32Array(d.length);
    for (var pass = 0; pass < 3; pass++) {
      blur1(d, tmp, w, hh, r, true);
      blur1(tmp, d, w, hh, r, false);
    }
    function blur1(src, dst, W, H, rad, horiz) {
      var n = horiz ? W : H, m = horiz ? H : W, win = rad * 2 + 1;
      for (var line = 0; line < m; line++) {
        for (var ch = 0; ch < 4; ch++) {
          var sum = 0, idx = function (i) { i = i < 0 ? 0 : i >= n ? n - 1 : i; return ((horiz ? line * W + i : i * W + line) << 2) + ch; };
          for (var i = -rad; i <= rad; i++) sum += src[idx(i)];
          for (var p = 0; p < n; p++) {
            dst[idx(p)] = sum / win;
            sum += src[idx(p + rad + 1)] - src[idx(p - rad)];
          }
        }
      }
    }
  }

  /** Render src through the filter settings into a new canvas of size w×h. */
  function applyFilters(src, s, w, hh) {
    var c = mk(w, hh), x = c2d(c);
    var scale = w / src.width;
    var blurPx = s.blur * Math.max(src.width, src.height) / 1000; // blur is relative to image size
    if (FILTER_OK) {
      x.filter = filterString(s, 1).replace(/blur\([^)]*\)/, 'blur(' + (blurPx * scale).toFixed(2) + 'px)');
      drawHQ(x, src, 0, 0, src.width, src.height, 0, 0, w, hh);
      x.filter = 'none';
    } else {
      drawHQ(x, src, 0, 0, src.width, src.height, 0, 0, w, hh);
      var img = x.getImageData(0, 0, w, hh), d = img.data, M = colourMatrix(s);
      for (var i = 0; i < d.length; i += 4) {
        var r = d[i], g = d[i + 1], b = d[i + 2];
        d[i] = M[0][0] * r + M[0][1] * g + M[0][2] * b + M[0][3];
        d[i + 1] = M[1][0] * r + M[1][1] * g + M[1][2] * b + M[1][3];
        d[i + 2] = M[2][0] * r + M[2][1] * g + M[2][2] * b + M[2][3];
      }
      if (blurPx > 0) boxBlur(img, w, hh, blurPx * scale / 1.7);
      x.putImageData(img, 0, 0);
    }
    if (s.vignette > 0) {
      var rad = Math.sqrt(w * w + hh * hh) / 2;
      var gr = x.createRadialGradient(w / 2, hh / 2, rad * 0.35, w / 2, hh / 2, rad);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(1, 'rgba(0,0,0,' + (s.vignette / 100 * 0.85).toFixed(3) + ')');
      x.globalCompositeOperation = 'source-atop';
      x.fillStyle = gr;
      x.fillRect(0, 0, w, hh);
      x.globalCompositeOperation = 'source-over';
    }
    return c;
  }

  register('image-filters', function (root, ctx) {
    singleTool(root, ctx, { title: 'Choose a photo to edit', icon: 'sliders-horizontal' }, function (im, api) {
      var L = editorLayout(root, im, api.reset, 'Adjustments');
      var ps = Math.min(1, 1000 / Math.max(im.w, im.h));
      var small = ps < 1 ? scaled(im.canvas, im.w * ps, im.h * ps) : im.canvas;
      var s = Object.assign({}, FDEF);
      var view = mk(small.width, small.height);
      view.setAttribute('role', 'img');
      view.setAttribute('aria-label', 'Filtered preview');
      var orig = mk(small.width, small.height);
      c2d(orig).drawImage(small, 0, 0);
      orig.style.display = 'none';
      L.stage.appendChild(view);
      L.stage.appendChild(orig);
      var hold = h('button.btn.btn-sm.bi-hold', { type: 'button', html: BT.icon('contrast') + '<span>Hold to compare</span>' });
      L.stage.appendChild(hold);
      function showOrig(on) { orig.style.display = on ? '' : 'none'; view.style.display = on ? 'none' : ''; }
      hold.addEventListener('pointerdown', function (e) { e.preventDefault(); showOrig(true); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { hold.addEventListener(ev, function () { showOrig(false); }); });
      hold.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); showOrig(true); } });
      hold.addEventListener('keyup', function () { showOrig(false); });

      var raf = 0;
      function draw() {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var c = applyFilters(small, s, small.width, small.height);
          var x = c2d(view);
          x.clearRect(0, 0, view.width, view.height);
          x.drawImage(c, 0, 0);
        });
      }

      // Presets with thumbnails
      var ts = 84 / Math.max(small.width, small.height);
      var tsrc = scaled(small, small.width * ts, small.height * ts);
      var pwrap = h('div.bi-presets', { role: 'group', 'aria-label': 'Filter presets' });
      FPRESETS.forEach(function (p) {
        var vals = Object.assign({}, FDEF, p[2]);
        var tc = applyFilters(tsrc, vals, tsrc.width, tsrc.height);
        var b = h('button', { type: 'button', 'data-k': p[0], 'aria-pressed': String(p[0] === 'original') }, [tc, h('span', { text: p[1] })]);
        if (p[0] === 'original') b.classList.add('active');
        b.addEventListener('click', function () {
          s = Object.assign({}, vals);
          BT.$$('button', pwrap).forEach(function (x) { var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-pressed', String(on)); });
          syncSliders();
          draw();
        });
        pwrap.appendChild(b);
      });
      L.add(h('div.field', null, [h('span.label', { text: 'Presets' }), pwrap]));

      var defs = [
        ['brightness', 'Brightness', 0, 200, 1, '%'], ['contrast', 'Contrast', 0, 200, 1, '%'], ['saturate', 'Saturation', 0, 200, 1, '%'],
        ['hue', 'Hue', -180, 180, 1, '°'], ['blur', 'Blur', 0, 20, 0.5, ''], ['grayscale', 'Grayscale', 0, 100, 1, '%'],
        ['sepia', 'Sepia', 0, 100, 1, '%'], ['invert', 'Invert', 0, 100, 1, '%'], ['vignette', 'Vignette', 0, 100, 1, '%']
      ];
      var sliders = {};
      var sec = h('div.bi-sec');
      defs.forEach(function (d) {
        var r = range(d[1], d[2], d[3], d[4], s[d[0]], function (v) { return v + d[5]; });
        r.input.addEventListener('input', function () {
          s[d[0]] = Number(r.input.value);
          BT.$$('button', pwrap).forEach(function (x) { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
          draw();
        });
        r.input.addEventListener('dblclick', function () { s[d[0]] = FDEF[d[0]]; syncSliders(); draw(); });
        sliders[d[0]] = r;
        sec.appendChild(r);
      });
      sec.appendChild(h('p.small.muted', { style: { margin: '0' }, text: 'Tip: double-click a slider to reset it.' + (FILTER_OK ? '' : ' (Using compatibility mode for your browser.)') }));
      L.add(sec);
      function syncSliders() { Object.keys(sliders).forEach(function (k) { sliders[k].input.value = s[k]; sliders[k].refresh(); }); }

      var fmt = formatControls(im.type);
      L.add(h('div.bi-sec', null, [fmt.el]));
      var dl = btn('btn-primary', 'download', 'Download photo');
      dl.addEventListener('click', function () {
        BT.busy(dl, function () {
          var c = applyFilters(im.canvas, s, im.w, im.h);
          return encode(c, fmt.mime(), fmt.quality()).then(function (e) { BT.download(e.blob, outName(im.name, '-edited', e.ext)); });
        }, 'Rendering…');
      });
      var rs = btn('', 'undo-2', 'Reset all', function () { s = Object.assign({}, FDEF); pwrap.querySelector('button').click(); });
      L.actions.appendChild(dl);
      L.actions.appendChild(rs);
      draw();
      return { destroy: function () { cancelAnimationFrame(raf); } };
    });
  });

  // ===================================================== IMAGE → BASE64
  register('image-to-base64', function (root, ctx) {
    singleTool(root, ctx, { title: 'Choose an image to encode', icon: 'file-code-2' }, function (im, api) {
      root.appendChild(infoBar(im, api.reset));
      var mime = im.type || 'image/png';
      var out = h('textarea.bi-ta', { id: nid('b64'), readonly: true, spellcheck: false, 'aria-label': 'Base64 output', rows: 8 });
      var seg1;
      var stage = h('div.preview-box', { style: { minHeight: '160px' } });
      var sType = stat('Type', mime), sDim = stat('Dimensions', im.w + ' × ' + im.h), sOrig = stat('File size', BT.fmtBytes(im.size)), sB64 = stat('Base64 size', '…');
      var warn = h('div.notice.warn.hidden', { html: BT.icon('info') + '<span>This image is large. Inlining more than ~100 KB as Base64 makes pages slower; consider compressing it first or linking the file instead.</span>' });
      var copyBtn = btn('btn-primary', 'copy', 'Copy');
      var dlBtn = btn('', 'download', 'Download .txt');
      var layout = h('div.split', null, [
        h('div', null, [stage, h('div.stats', { style: { marginTop: '14px' } }, [sType, sDim, sOrig, sB64])]),
        h('div.card.bi-panel', null, [h('h3', { text: 'Output' })])
      ]);
      root.appendChild(layout);
      var panel = layout.lastChild;
      BT.readFile(im.file, 'dataURL').then(function (url) {
        if (!/^data:[^;]+;base64,/.test(url)) url = 'data:' + mime + ';base64,' + url.split(',')[1];
        var b64 = url.slice(url.indexOf(',') + 1);
        var img = h('img', { src: url, alt: 'Preview of ' + im.name });
        stage.appendChild(img);
        sB64.set(BT.fmtBytes(url.length) + ' (+' + Math.round((url.length / im.size - 1) * 100) + '%)');
        warn.classList.toggle('hidden', url.length < 150 * 1024);
        var outputs = {
          url: url,
          raw: b64,
          css: '.element {\n  background-image: url("' + url + '");\n}',
          img: '<img src="' + url + '" width="' + im.w + '" height="' + im.h + '" alt="">',
          md: '![image](' + url + ')',
          json: JSON.stringify({ name: im.name, mime: mime, width: im.w, height: im.h, data: b64 })
        };
        var cur = 'url';
        seg1 = seg([['url', 'Data URL'], ['raw', 'Base64'], ['css', 'CSS'], ['img', 'HTML <img>'], ['md', 'Markdown'], ['json', 'JSON']], cur, function (v) { cur = v; out.value = outputs[v]; }, 'Output format');
        out.value = outputs[cur];
        panel.appendChild(h('div.field', null, [seg1]));
        panel.appendChild(h('div.field', null, [h('label', { 'for': out.id, text: 'Encoded text' }), out]));
        panel.appendChild(warn);
        panel.appendChild(h('div.bi-actions', null, [copyBtn, dlBtn]));
        copyBtn.addEventListener('click', function () {
          BT.copy(outputs[cur], 'Copied ' + BT.fmtBytes(outputs[cur].length) + ' to clipboard').then(function () {
            copyBtn.innerHTML = BT.icon('check') + '<span>Copied</span>';
            setTimeout(function () { copyBtn.innerHTML = BT.icon('copy') + '<span>Copy</span>'; }, 1600);
          });
        });
        dlBtn.addEventListener('click', function () {
          BT.download(new Blob([outputs[cur]], { type: 'text/plain' }), BT.baseName(im.name) + '-base64.txt');
        });
      });
    });
  });

  // ========================================================== FAVICON
  function roundRectPath(x, X, Y, W, H, r) {
    r = Math.max(0, Math.min(r, W / 2, H / 2));
    x.beginPath();
    x.moveTo(X + r, Y);
    x.arcTo(X + W, Y, X + W, Y + H, r);
    x.arcTo(X + W, Y + H, X, Y + H, r);
    x.arcTo(X, Y + H, X, Y, r);
    x.arcTo(X, Y, X + W, Y, r);
    x.closePath();
  }

  /** Build a .ico file containing PNG-compressed entries. pngs: [{size, bytes}] */
  function buildIco(pngs) {
    var head = 6 + 16 * pngs.length;
    var total = head + pngs.reduce(function (s, p) { return s + p.bytes.length; }, 0);
    var buf = new Uint8Array(total), dv = new DataView(buf.buffer);
    dv.setUint16(0, 0, true);           // reserved
    dv.setUint16(2, 1, true);           // type: 1 = icon
    dv.setUint16(4, pngs.length, true); // image count
    var off = head;
    pngs.forEach(function (p, i) {
      var o = 6 + 16 * i;
      buf[o] = p.size >= 256 ? 0 : p.size;
      buf[o + 1] = p.size >= 256 ? 0 : p.size;
      buf[o + 2] = 0; // palette colours
      buf[o + 3] = 0; // reserved
      dv.setUint16(o + 4, 1, true);   // colour planes
      dv.setUint16(o + 6, 32, true);  // bits per pixel
      dv.setUint32(o + 8, p.bytes.length, true);
      dv.setUint32(o + 12, off, true);
      buf.set(p.bytes, off);
      off += p.bytes.length;
    });
    return buf;
  }
  BT.imageKit.buildIco = buildIco;

  function blobBytes(blob) { return BT.readFile(blob).then(function (b) { return new Uint8Array(b); }); }

  var FAV_SIZES = [16, 32, 48, 64, 128, 180, 192, 512];
  function favName(size) {
    if (size === 180) return 'apple-touch-icon.png';
    if (size === 192 || size === 512) return 'android-chrome-' + size + 'x' + size + '.png';
    return 'favicon-' + size + 'x' + size + '.png';
  }

  register('favicon-generator', function (root, ctx) {
    injectCSS();
    var S = {
      mode: 'image', img: null, name: '', text: 'B', font: 'sans', bold: true, fg: '#ffffff', bg: '#f76b15',
      transparent: false, radius: 22, padding: 10, textSize: 72, siteName: 'My Website', theme: '#ffffff'
    };

    function start() {
      root.innerHTML = '';
      root.appendChild(BT.dropzone({
        accept: 'image/*', title: 'Choose a logo or image', icon: 'app-window', hint: 'Square PNG or SVG works best (512 × 512 or larger)',
        color: ctx.category && ctx.category.color, onFiles: function (f) { openFile(f[0]); }
      }));
      var txtBtn = btn('btn-lg', 'type', 'Create from text or emoji', function () { S.mode = 'text'; S.img = null; S.transparent = false; editor(); });
      root.appendChild(h('div.bi-alt', null, [h('p.muted.small', { text: 'No logo yet?' }), txtBtn]));
    }
    function openFile(file) {
      root.innerHTML = '';
      root.appendChild(loadingEl());
      decode(file).then(function (im) {
        S.mode = 'image'; S.img = im.canvas; S.name = im.name;
        S.transparent = hasAlpha(im.canvas);
        S.padding = S.transparent ? 6 : 0;
        S.radius = 0;
        editor();
      }).catch(function (e) { BT.toast(e.message, 'error'); start(); });
    }
    pasteSupport(root, function (f) { openFile(f[0]); });

    function paint(size, opaque) {
      var c = mk(size, size), x = c2d(c);
      var r = S.radius / 100 * size; // 50% = circle
      roundRectPath(x, 0, 0, size, size, r);
      if (!S.transparent || opaque) {
        x.fillStyle = S.transparent ? '#ffffff' : S.bg;
        x.fill();
      }
      x.save();
      x.clip();
      var pad = S.padding / 100 * size, inner = size - pad * 2;
      if (S.mode === 'image' && S.img) {
        var s = Math.min(inner / S.img.width, inner / S.img.height);
        var dw = S.img.width * s, dh = S.img.height * s;
        drawHQ(x, S.img, 0, 0, S.img.width, S.img.height, (size - dw) / 2, (size - dh) / 2, dw, dh);
      } else {
        var fam = { sans: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif', serif: 'Georgia, "Times New Roman", serif', mono: 'ui-monospace, Menlo, Consolas, monospace', round: 'ui-rounded, "Arial Rounded MT Bold", "Nunito", system-ui, sans-serif' }[S.font];
        var fs = inner * S.textSize / 100;
        var txt = S.text || ' ';
        x.font = (S.bold ? '800 ' : '500 ') + fs + 'px ' + fam;
        var m = x.measureText(txt);
        if (m.width > inner) { fs *= inner / m.width; x.font = (S.bold ? '800 ' : '500 ') + fs + 'px ' + fam; m = x.measureText(txt); }
        x.fillStyle = S.fg;
        x.textAlign = 'center';
        x.textBaseline = 'alphabetic';
        var asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
        var y = (asc != null && desc != null && (asc + desc) > 0) ? size / 2 + (asc - desc) / 2 : size / 2 + fs * 0.35;
        x.fillText(txt, size / 2, y);
      }
      x.restore();
      return c;
    }

    function editor() {
      root.innerHTML = '';
      var info = h('div.bi-head', null, [
        h('span.bi-ic', { html: BT.icon('app-window') }),
        h('div.bi-txt', null, [h('div.bi-name', { text: S.mode === 'image' ? S.name : 'Text / emoji favicon' }),
          h('div.bi-meta', { html: '<span class="badge">8 PNG sizes</span><span class="badge">favicon.ico</span><span class="badge">site.webmanifest</span>' })]),
        btn('btn-ghost btn-sm', 'rotate-ccw', 'Start over', start)
      ]);
      root.appendChild(info);
      var sizes = h('div.bi-sizes');
      var tabMock = h('div.bi-tabbar');
      var snippet = h('pre.output', { style: { maxHeight: '220px', overflow: 'auto' } });
      var left = h('div', null, [
        h('div.card', null, [h('div.card-title', null, [h('h3', { text: 'Preview' })]), sizes, h('div', { style: { marginTop: '16px' } }, [tabMock])]),
        h('div.card', null, [h('div.card-title', null, [h('h3', { text: 'HTML to paste in <head>' }), btn('btn-sm', 'copy', 'Copy', function () { BT.copy(snippet.textContent); })]), snippet])
      ]);
      var panel = h('div.card.bi-panel', null, [h('h3', { text: 'Design' })]);
      root.appendChild(h('div.split.wide-left', null, [left, h('div', null, [panel])]));

      if (S.mode === 'text') {
        var t = input('text', S.text, { maxlength: 4, autocomplete: 'off' });
        t.addEventListener('input', function () { S.text = t.value; draw(); });
        var emo = chipGroup([['B', 'B'], ['★', '★'], ['🚀', '🚀'], ['💡', '💡'], ['🔥', '🔥'], ['✅', '✅'], ['❤️', '❤️'], ['ॐ', 'ॐ']], '', function (v) { t.value = v; S.text = v; draw(); }, 'Quick picks');
        var font = select([['sans', 'Sans-serif'], ['serif', 'Serif'], ['mono', 'Monospace'], ['round', 'Rounded']], S.font);
        font.addEventListener('change', function () { S.font = font.value; draw(); });
        var bold = checkbox('Bold', S.bold);
        bold.input.addEventListener('change', function () { S.bold = bold.input.checked; draw(); });
        var fg = input('color', S.fg);
        fg.addEventListener('input', function () { S.fg = fg.value; draw(); });
        var ts = range('Text size', 30, 100, 1, S.textSize, function (v) { return v + '%'; });
        ts.input.addEventListener('input', function () { S.textSize = Number(ts.input.value); draw(); });
        panel.appendChild(field('Letters or emoji', t, 'Up to 2–3 characters look best.'));
        panel.appendChild(h('div.field', null, [emo]));
        panel.appendChild(h('div.row.cols-2', null, [field('Font', font), field('Text colour', fg)]));
        panel.appendChild(ts);
        panel.appendChild(h('div.field', null, [bold]));
      } else {
        panel.appendChild(BT.dropzone({ accept: 'image/*', compact: true, title: 'Replace image', hint: 'PNG, SVG, JPG', icon: 'image-plus', onFiles: function (f) { openFile(f[0]); } }));
        panel.appendChild(h('div', { style: { height: '14px' } }));
      }
      var tr = checkbox('Transparent background', S.transparent);
      var bg = input('color', S.bg);
      tr.input.addEventListener('change', function () { S.transparent = tr.input.checked; bgF.classList.toggle('hidden', S.transparent); draw(); });
      bg.addEventListener('input', function () { S.bg = bg.value; draw(); });
      var bgF = field('Background colour', bg);
      bgF.classList.toggle('hidden', S.transparent);
      var rad = range('Corner radius', 0, 50, 1, S.radius, function (v) { return v === 50 ? 'Circle' : v + '%'; });
      rad.input.addEventListener('input', function () { S.radius = Number(rad.input.value); draw(); });
      var pad = range('Padding', 0, 30, 1, S.padding, function (v) { return v + '%'; });
      pad.input.addEventListener('input', function () { S.padding = Number(pad.input.value); draw(); });
      var site = input('text', S.siteName);
      site.addEventListener('input', function () { S.siteName = site.value; draw(); });
      var theme = input('color', S.theme);
      theme.addEventListener('input', function () { S.theme = theme.value; draw(); });
      [h('div.bi-sec', null, [h('div.field', null, [tr]), bgF, rad, pad]),
        h('div.bi-sec', null, [field('Website name (for manifest)', site), field('Theme colour', theme)])].forEach(function (e) { panel.appendChild(e); });
      var dl = btn('btn-primary', 'download', 'Download favicon pack (ZIP)');
      var dlIco = btn('', 'download', 'favicon.ico only');
      panel.appendChild(h('div.bi-actions', null, [dl, dlIco]));

      var raf = 0;
      function draw() {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          sizes.innerHTML = '';
          [16, 32, 48, 64, 128, 180].forEach(function (s) {
            var dpr = Math.min(2, window.devicePixelRatio || 1);
            var c = paint(Math.round(s * (s <= 64 ? dpr : 1)), s === 180);
            var disp = s === 180 ? 90 : s;
            c.style.width = disp + 'px'; c.style.height = disp + 'px';
            if (s === 180) c.style.borderRadius = '20px';
            sizes.appendChild(h('figure', null, [c, h('figcaption', { text: s === 180 ? 'Apple 180' : s + ' px' })]));
          });
          var tabIcon = paint(32);
          tabMock.innerHTML = '';
          tabMock.appendChild(h('div.bi-tab', null, [tabIcon, h('span', { text: S.siteName || 'My Website', style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }), h('span.muted', { html: '&times;', style: { marginLeft: 'auto' } })]));
          snippet.textContent = htmlSnippet();
        });
      }
      function htmlSnippet() {
        return '<link rel="icon" href="/favicon.ico" sizes="any">\n' +
          '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n' +
          '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">\n' +
          '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">\n' +
          '<link rel="manifest" href="/site.webmanifest">\n' +
          '<meta name="theme-color" content="' + S.theme + '">';
      }
      function manifest() {
        return JSON.stringify({
          name: S.siteName || 'My Website', short_name: (S.siteName || 'Website').slice(0, 12),
          icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' }, { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }],
          theme_color: S.theme, background_color: S.transparent ? '#ffffff' : S.bg, display: 'standalone'
        }, null, 2);
      }
      function makeIco() {
        return Promise.all([16, 32, 48].map(function (s) {
          return BT.canvasToBlob(paint(s), 'image/png').then(blobBytes).then(function (b) { return { size: s, bytes: b }; });
        })).then(buildIco);
      }
      dl.addEventListener('click', function () {
        BT.busy(dl, function () {
          return Promise.all(FAV_SIZES.map(function (s) {
            return BT.canvasToBlob(paint(s, s === 180), 'image/png').then(function (b) { return { name: favName(s), data: b }; });
          })).then(function (files) {
            return makeIco().then(function (ico) {
              files.unshift({ name: 'favicon.ico', data: ico });
              files.push({ name: 'site.webmanifest', data: manifest() });
              files.push({ name: 'favicon-snippet.html', data: htmlSnippet() + '\n' });
              return BT.downloadZip(files, 'favicons.zip');
            });
          });
        }, 'Generating…');
      });
      dlIco.addEventListener('click', function () {
        BT.busy(dlIco, function () { return makeIco().then(function (ico) { BT.download(ico, 'favicon.ico', 'image/x-icon'); }); });
      });
      draw();
    }
    start();
  });

  // ========================================================= WATERMARK
  var WM_FONTS = [
    ['sans', 'Sans-serif', 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'],
    ['serif', 'Serif', 'Georgia, "Times New Roman", serif'],
    ['mono', 'Monospace', 'ui-monospace, Menlo, Consolas, monospace'],
    ['impact', 'Impact', 'Impact, Anton, "Arial Black", sans-serif'],
    ['script', 'Script', '"Brush Script MT", "Segoe Script", cursive']
  ];
  function wmFont(k) { for (var i = 0; i < WM_FONTS.length; i++) if (WM_FONTS[i][0] === k) return WM_FONTS[i][2]; return WM_FONTS[0][2]; }

  register('image-watermark', function (root, ctx) {
    singleTool(root, ctx, { title: 'Choose a photo to watermark', icon: 'copyright' }, function (im, api) {
      var L = editorLayout(root, im, api.reset, 'Watermark');
      var S = { text: '© ' + new Date().getFullYear() + ' Your Name', font: 'sans', bold: true, size: 5, color: '#ffffff', opacity: 55, rotate: 0, pos: 8, tiled: false, margin: 3, gap: 8, shadow: true };
      var ps = Math.min(1, 1200 / Math.max(im.w, im.h));
      var small = ps < 1 ? scaled(im.canvas, im.w * ps, im.h * ps) : im.canvas;
      var view = mk(small.width, small.height);
      view.setAttribute('role', 'img');
      view.setAttribute('aria-label', 'Watermark preview');
      L.stage.appendChild(view);

      function render(c, src) {
        var x = c2d(c), w = c.width, hh = c.height;
        x.clearRect(0, 0, w, hh);
        x.drawImage(src, 0, 0, w, hh);
        var lines = String(S.text || '').split('\n');
        if (!lines.join('').trim()) return;
        var fs = Math.max(4, S.size / 100 * (w + hh) / 2);
        x.save();
        x.font = (S.bold ? '700 ' : '400 ') + fs + 'px ' + wmFont(S.font);
        x.fillStyle = S.color;
        x.globalAlpha = S.opacity / 100;
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        var lh = fs * 1.2;
        var tw = Math.max.apply(null, lines.map(function (l) { return x.measureText(l).width; }));
        var th = lh * lines.length;
        if (S.shadow) { x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = fs * 0.15; x.shadowOffsetY = fs * 0.04; }
        function block(cx, cy) {
          lines.forEach(function (l, i) { x.fillText(l, cx, cy - th / 2 + lh * (i + 0.5)); });
        }
        var rot = S.rotate * Math.PI / 180;
        if (S.tiled) {
          var gap = S.gap / 100 * (w + hh) / 2;
          var stepX = tw + gap * 1.5, stepY = th + gap;
          var diag = Math.sqrt(w * w + hh * hh);
          x.translate(w / 2, hh / 2);
          x.rotate(rot);
          var row = 0;
          for (var yy = -diag / 2; yy <= diag / 2 + stepY; yy += stepY, row++) {
            for (var xx = -diag / 2 + (row % 2 ? stepX / 2 : 0); xx <= diag / 2 + stepX; xx += stepX) block(xx, yy);
          }
        } else {
          var m = S.margin / 100 * Math.min(w, hh);
          var col = S.pos % 3, rw = Math.floor(S.pos / 3);
          var bw = Math.abs(tw * Math.cos(rot)) + Math.abs(th * Math.sin(rot)), bh = Math.abs(tw * Math.sin(rot)) + Math.abs(th * Math.cos(rot));
          var cx = col === 0 ? m + bw / 2 : col === 1 ? w / 2 : w - m - bw / 2;
          var cy = rw === 0 ? m + bh / 2 : rw === 1 ? hh / 2 : hh - m - bh / 2;
          x.translate(cx, cy);
          x.rotate(rot);
          block(0, 0);
        }
        x.restore();
      }
      var raf = 0;
      function draw() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; render(view, small); }); }

      var txt = h('textarea', { id: nid(), rows: 2, style: { minHeight: '64px' } });
      txt.value = S.text;
      txt.addEventListener('input', function () { S.text = txt.value; draw(); });
      var font = select(WM_FONTS.map(function (f) { return [f[0], f[1]]; }), S.font);
      font.addEventListener('change', function () { S.font = font.value; draw(); });
      var col = input('color', S.color);
      col.addEventListener('input', function () { S.color = col.value; draw(); });
      var bold = checkbox('Bold', S.bold), shadow = checkbox('Soft shadow', S.shadow);
      bold.input.addEventListener('change', function () { S.bold = bold.input.checked; draw(); });
      shadow.input.addEventListener('change', function () { S.shadow = shadow.input.checked; draw(); });
      function rng(label, key, min, max, step, unit) {
        var r = range(label, min, max, step, S[key], function (v) { return v + unit; });
        r.input.addEventListener('input', function () { S[key] = Number(r.input.value); draw(); });
        return r;
      }
      var grid = h('div.bi-grid9', { role: 'group', 'aria-label': 'Position' });
      var names = ['Top left', 'Top centre', 'Top right', 'Middle left', 'Centre', 'Middle right', 'Bottom left', 'Bottom centre', 'Bottom right'];
      names.forEach(function (n, i) {
        var b = h('button', { type: 'button', 'aria-label': n, title: n, 'aria-pressed': String(i === S.pos) });
        if (i === S.pos) b.classList.add('active');
        b.addEventListener('click', function () {
          S.pos = i;
          BT.$$('button', grid).forEach(function (x, j) { x.classList.toggle('active', j === i); x.setAttribute('aria-pressed', String(j === i)); });
          draw();
        });
        grid.appendChild(b);
      });
      var marginR = rng('Margin', 'margin', 0, 20, 0.5, '%');
      var gapR = rng('Spacing', 'gap', 2, 40, 1, '%');
      var single = h('div', null, [h('div.field', null, [h('span.label', { text: 'Position' }), grid]), marginR]);
      var tiledGrp = h('div.hidden', null, [gapR]);
      var mode = seg([['single', 'Single'], ['tiled', 'Tiled pattern']], 'single', function (v) {
        S.tiled = v === 'tiled';
        if (S.tiled && S.rotate === 0) { S.rotate = -30; rotR.input.value = -30; rotR.refresh(); }
        single.classList.toggle('hidden', S.tiled);
        tiledGrp.classList.toggle('hidden', !S.tiled);
        draw();
      }, 'Layout');
      var rotR = rng('Rotation', 'rotate', -90, 90, 1, '°');
      L.add(field('Watermark text', txt));
      L.add(h('div.row.cols-2', null, [field('Font', font), field('Colour', col)]));
      L.add(h('div.field', null, [h('div.btn-group', { style: { gap: '16px' } }, [bold, shadow])]));
      L.add(rng('Size', 'size', 1, 25, 0.5, '%'));
      L.add(rng('Opacity', 'opacity', 5, 100, 1, '%'));
      L.add(rotR);
      L.add(h('div.bi-sec', null, [h('div.field', null, [mode]), single, tiledGrp]));
      var fmt = formatControls(im.type);
      L.add(h('div.bi-sec', null, [fmt.el]));
      var dl = btn('btn-primary', 'download', 'Download watermarked image');
      dl.addEventListener('click', function () {
        BT.busy(dl, function () {
          var c = mk(im.w, im.h);
          render(c, im.canvas);
          return encode(c, fmt.mime(), fmt.quality()).then(function (e) { BT.download(e.blob, outName(im.name, '-watermarked', e.ext)); });
        });
      });
      L.actions.appendChild(dl);
      draw();
      return { destroy: function () { cancelAnimationFrame(raf); } };
    });
  });

  // ====================================================== COLOUR PICKER
  function hex2(n) { return ('0' + n.toString(16)).slice(-2); }
  function toHex(r, g, b) { return '#' + hex2(r) + hex2(g) + hex2(b); }
  function toHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, s = 0, hh = 0, d = max - min;
    if (d) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      hh = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      hh *= 60;
    }
    return [Math.round(hh), Math.round(s * 100), Math.round(l * 100)];
  }
  /** Dominant colours via k-means++ (deterministic seed) on a downsampled copy. */
  function palette(canvas, k) {
    var s = Math.min(1, 120 / Math.max(canvas.width, canvas.height));
    var c = mk(canvas.width * s, canvas.height * s);
    drawHQ(c2d(c), canvas, 0, 0, canvas.width, canvas.height, 0, 0, c.width, c.height);
    var d = c2d(c).getImageData(0, 0, c.width, c.height).data;
    var px = [];
    for (var i = 0; i < d.length; i += 4) if (d[i + 3] > 125) px.push([d[i], d[i + 1], d[i + 2]]);
    if (!px.length) return [];
    var seed = 12345;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    function dist(a, b) { var x = a[0] - b[0], y = a[1] - b[1], z = a[2] - b[2]; return x * x + y * y + z * z; }
    var cent = [px[Math.floor(rnd() * px.length)].slice()];
    while (cent.length < k) {
      var ds = px.map(function (p) { var m = Infinity; cent.forEach(function (q) { var v = dist(p, q); if (v < m) m = v; }); return m; });
      var sum = ds.reduce(function (a, b) { return a + b; }, 0);
      if (!sum) break;
      var t = rnd() * sum, j = 0;
      while (t > ds[j] && j < ds.length - 1) { t -= ds[j]; j++; }
      cent.push(px[j].slice());
    }
    var assign = new Int32Array(px.length);
    for (var it = 0; it < 14; it++) {
      var acc = cent.map(function () { return [0, 0, 0, 0]; });
      px.forEach(function (p, pi) {
        var best = 0, bd = Infinity;
        for (var ci = 0; ci < cent.length; ci++) { var v = dist(p, cent[ci]); if (v < bd) { bd = v; best = ci; } }
        assign[pi] = best;
        var a = acc[best]; a[0] += p[0]; a[1] += p[1]; a[2] += p[2]; a[3]++;
      });
      cent = acc.map(function (a, ci) { return a[3] ? [a[0] / a[3], a[1] / a[3], a[2] / a[3], a[3]] : cent[ci].slice(0, 3).concat([0]); });
    }
    return cent.filter(function (q) { return q[3] > 0; }).sort(function (a, b) { return b[3] - a[3]; }).map(function (q) {
      var r = Math.round(q[0]), g = Math.round(q[1]), b = Math.round(q[2]);
      return { r: r, g: g, b: b, hex: toHex(r, g, b), pct: q[3] / px.length * 100 };
    });
  }
  BT.imageKit.palette = palette;

  register('image-color-picker', function (root, ctx) {
    singleTool(root, ctx, { title: 'Choose an image to pick colours from', icon: 'pipette' }, function (im, api) {
      var L = editorLayout(root, im, api.reset, 'Picked colour');
      var data = null;
      try { data = c2d(im.canvas).getImageData(0, 0, im.w, im.h).data; } catch (e) { data = null; }
      var ps = Math.min(1, 1400 / Math.max(im.w, im.h));
      var view = ps < 1 ? scaled(im.canvas, im.w * ps, im.h * ps) : (function () { var c = mk(im.w, im.h); c2d(c).drawImage(im.canvas, 0, 0); return c; })();
      view.setAttribute('aria-label', 'Image: click to pick a colour');
      view.setAttribute('role', 'img');
      var lensC = mk(11, 11);
      var lens = h('div.bi-lens', null, [lensC]);
      var wrap = h('div.bi-pick', null, [view, lens]);
      L.stage.appendChild(wrap);
      L.left.appendChild(h('p.bi-under', { html: BT.icon('pipette') + ' Click (or tap and drag) on the image to pick a colour.' }));

      var sw = h('div.bi-swatch');
      var codes = h('div.bi-codes');
      var hist = h('div.bi-hist', { role: 'group', 'aria-label': 'Recently picked colours' });
      var history = [];
      L.add(sw);
      L.add(codes);
      L.add(h('div.bi-sec', null, [h('span.label', { text: 'History' }), h('div', { style: { height: '8px' } }), hist]));

      function pixel(x, y) {
        x = clamp(Math.floor(x), 0, im.w - 1); y = clamp(Math.floor(y), 0, im.h - 1);
        if (data) { var i = (y * im.w + x) * 4; return [data[i], data[i + 1], data[i + 2], data[i + 3]]; }
        var p = c2d(im.canvas).getImageData(x, y, 1, 1).data;
        return [p[0], p[1], p[2], p[3]];
      }
      function show(rgb, add) {
        var hex = toHex(rgb[0], rgb[1], rgb[2]), hsl = toHsl(rgb[0], rgb[1], rgb[2]);
        sw.style.background = hex;
        codes.innerHTML = '';
        [['HEX', hex.toUpperCase()], ['RGB', 'rgb(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ')'], ['HSL', 'hsl(' + hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%)']].forEach(function (p) {
          codes.appendChild(h('div.bi-code', null, [h('span.k', { text: p[0] }), h('span.v', { text: p[1] }),
            h('button.btn.btn-sm.btn-ghost', { type: 'button', 'aria-label': 'Copy ' + p[0], html: BT.icon('copy'), onclick: function () { BT.copy(p[1], 'Copied ' + p[1]); } })]));
        });
        if (add) {
          history = [hex].concat(history.filter(function (x) { return x !== hex; })).slice(0, 16);
          hist.innerHTML = '';
          history.forEach(function (hx) {
            var r = parseInt(hx.slice(1, 3), 16), g = parseInt(hx.slice(3, 5), 16), b = parseInt(hx.slice(5, 7), 16);
            hist.appendChild(h('button', { type: 'button', title: hx, 'aria-label': 'Select ' + hx, style: { background: hx }, onclick: function () { show([r, g, b], false); } }));
          });
        }
      }

      var down = false;
      function at(e) {
        var b = view.getBoundingClientRect();
        var fx = (e.clientX - b.left) / b.width, fy = (e.clientY - b.top) / b.height;
        return { fx: fx, fy: fy, x: fx * im.w, y: fy * im.h, lx: e.clientX - b.left, ly: e.clientY - b.top, inside: fx >= 0 && fy >= 0 && fx <= 1 && fy <= 1 };
      }
      function updLens(p, touch) {
        if (!p.inside) { lens.style.display = 'none'; return; }
        var x0 = clamp(Math.floor(p.x) - 5, 0, Math.max(0, im.w - 11)), y0 = clamp(Math.floor(p.y) - 5, 0, Math.max(0, im.h - 11));
        var lc = c2d(lensC);
        lc.clearRect(0, 0, 11, 11);
        lc.drawImage(im.canvas, x0, y0, 11, 11, 0, 0, 11, 11);
        lens.style.display = 'block';
        var off = touch ? -140 : 18;
        var lx = p.lx + 18, ly = p.ly + off;
        var vw = view.clientWidth;
        if (lx + 120 > vw) lx = p.lx - 138;
        if (ly < 0) ly = p.ly + 18;
        lens.style.left = lx + 'px';
        lens.style.top = ly + 'px';
      }
      wrap.addEventListener('pointermove', function (e) {
        var p = at(e);
        if (e.pointerType === 'mouse' || down) {
          updLens(p, e.pointerType !== 'mouse');
          if (p.inside) show(pixel(p.x, p.y), false);
        }
      });
      wrap.addEventListener('pointerdown', function (e) {
        down = true;
        try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        var p = at(e);
        updLens(p, e.pointerType !== 'mouse');
        if (p.inside) show(pixel(p.x, p.y), false);
      });
      wrap.addEventListener('pointerup', function (e) {
        if (!down) return;
        down = false;
        var p = at(e);
        if (p.inside) show(pixel(p.x, p.y), true);
        if (e.pointerType !== 'mouse') lens.style.display = 'none';
      });
      wrap.addEventListener('pointerleave', function () { if (!down) lens.style.display = 'none'; });

      // Palette card (full width under the editor)
      var palGrid = h('div.bi-palette');
      var kSel = select([['5', '5 colours'], ['6', '6 colours'], ['8', '8 colours'], ['10', '10 colours']], '8');
      kSel.setAttribute('aria-label', 'Number of palette colours');
      kSel.style.width = 'auto';
      var pal = [];
      var copyHex = btn('btn-sm', 'copy', 'Copy HEX list', function () { BT.copy(pal.map(function (p) { return p.hex.toUpperCase(); }).join(', ')); });
      var copyCss = btn('btn-sm', 'code-xml', 'Copy CSS variables', function () {
        BT.copy(':root {\n' + pal.map(function (p, i) { return '  --color-' + (i + 1) + ': ' + p.hex + ';'; }).join('\n') + '\n}');
      });
      var card = h('div.card', { style: { marginTop: '20px' } }, [
        h('div.card-title', null, [h('h3', { text: 'Dominant colour palette' }), kSel]),
        palGrid,
        h('div.btn-group', { style: { marginTop: '14px' } }, [copyHex, copyCss])
      ]);
      root.appendChild(card);
      function buildPalette() {
        pal = palette(im.canvas, Number(kSel.value));
        palGrid.innerHTML = '';
        pal.forEach(function (p) {
          var b = h('button.bi-pal', { type: 'button', title: 'Copy ' + p.hex, 'aria-label': 'Copy ' + p.hex + ' (' + p.pct.toFixed(1) + '%)' }, [
            h('span', { style: { background: p.hex } }), h('small', null, [h('b', { text: p.hex.toUpperCase() }), h('span', { text: Math.round(p.pct) + '%' })])]);
          b.addEventListener('click', function () { BT.copy(p.hex.toUpperCase(), 'Copied ' + p.hex.toUpperCase()); show([p.r, p.g, p.b], true); });
          palGrid.appendChild(b);
        });
      }
      kSel.addEventListener('change', buildPalette);
      setTimeout(buildPalette, 30);
      show(pixel(im.w / 2, im.h / 2), false);
    });
  });

  // ============================================================ MEME
  function loadFontCss(href, id) {
    if (doc.getElementById(id)) return;
    var l = doc.createElement('link');
    l.id = id;
    l.rel = 'stylesheet';
    l.href = href;
    doc.head.appendChild(l);
  }
  var MEME_FONTS = [
    ['impact', 'Impact (classic)', 'Impact, Anton, "Arial Black", sans-serif', 900],
    ['anton', 'Anton', 'Anton, Impact, sans-serif', 400],
    ['arial', 'Arial Black', '"Arial Black", "Helvetica Neue", Arial, sans-serif', 900],
    ['comic', 'Comic', '"Comic Sans MS", "Comic Neue", "Chalkboard SE", cursive', 700]
  ];

  register('meme-generator', function (root, ctx) {
    loadFontCss('https://fonts.googleapis.com/css2?family=Anton&display=swap', 'bi-font-anton');
    singleTool(root, ctx, {
      title: 'Choose an image for your meme', icon: 'laugh',
      extra: function (openCanvas) {
        var b = btn('', 'square', 'Start with a blank canvas', function () {
          var c = mk(1000, 1000), x = c2d(c);
          x.fillStyle = '#ffffff'; x.fillRect(0, 0, 1000, 1000);
          openCanvas({ canvas: c, w: 1000, h: 1000, name: 'blank-meme.png', size: 0, type: 'image/png' });
        });
        return h('div.bi-alt', null, [b]);
      }
    }, function (im, api) {
      var L = editorLayout(root, im, api.reset, 'Captions');
      var S = { top: 'When the code works', bottom: 'On the first try', size: 10, upper: true, fill: '#ffffff', stroke: '#000000', sw: 5, font: 'impact', pos: { top: null, bottom: null } };
      var ps = Math.min(1, 1000 / Math.max(im.w, im.h));
      var small = ps < 1 ? scaled(im.canvas, im.w * ps, im.h * ps) : im.canvas;
      var view = mk(small.width, small.height);
      view.style.touchAction = 'none';
      view.style.cursor = 'default';
      view.setAttribute('role', 'img');
      view.setAttribute('aria-label', 'Meme preview');
      L.stage.appendChild(view);
      L.left.appendChild(h('p.bi-under', { html: BT.icon('move') + ' Drag a caption on the image to move it.' }));

      function fontFor() { for (var i = 0; i < MEME_FONTS.length; i++) if (MEME_FONTS[i][0] === S.font) return MEME_FONTS[i]; return MEME_FONTS[0]; }
      function wrapLines(x, text, maxW) {
        var out = [];
        String(text).split('\n').forEach(function (para) {
          var words = para.split(/\s+/).filter(Boolean), line = '';
          words.forEach(function (w) {
            var t = line ? line + ' ' + w : w;
            if (x.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
          });
          if (line) out.push(line);
        });
        return out;
      }
      var boxes = {};
      function render(c, src) {
        var x = c2d(c), w = c.width, hh = c.height;
        x.clearRect(0, 0, w, hh);
        x.drawImage(src, 0, 0, w, hh);
        var f = fontFor();
        var fs = S.size / 100 * Math.min(w, hh * 1.25);
        x.font = f[3] + ' ' + fs + 'px ' + f[2];
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.lineJoin = 'round';
        x.miterLimit = 2;
        x.fillStyle = S.fill;
        x.strokeStyle = S.stroke;
        x.lineWidth = fs * S.sw / 40;
        var lh = fs * 1.12, m = hh * 0.03;
        boxes = {};
        ['top', 'bottom'].forEach(function (k) {
          var txt = S.upper ? String(S[k]).toUpperCase() : String(S[k]);
          var lines = wrapLines(x, txt, w * 0.94);
          if (!lines.length) return;
          var bh = lines.length * lh;
          var p = S.pos[k] || { x: 0.5, y: k === 'top' ? (m + bh / 2) / hh : (hh - m - bh / 2) / hh };
          var cx = p.x * w, cy = p.y * hh;
          var bw = Math.max.apply(null, lines.map(function (l) { return x.measureText(l).width; }));
          boxes[k] = { x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh, cx: p.x, cy: p.y };
          lines.forEach(function (l, i) {
            var ly = cy - bh / 2 + lh * (i + 0.5);
            if (S.sw > 0) x.strokeText(l, cx, ly);
            x.fillText(l, cx, ly);
          });
        });
      }
      var raf = 0;
      function draw() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; render(view, small); }); }

      // dragging captions
      var drag = null;
      function vp(e) { var b = view.getBoundingClientRect(); return { x: (e.clientX - b.left) / b.width * view.width, y: (e.clientY - b.top) / b.height * view.height }; }
      function hit(p) {
        var pad = view.width * 0.02;
        return ['bottom', 'top'].filter(function (k) { var b = boxes[k]; return b && p.x >= b.x - pad && p.x <= b.x + b.w + pad && p.y >= b.y - pad && p.y <= b.y + b.h + pad; })[0];
      }
      view.addEventListener('pointerdown', function (e) {
        var p = vp(e), k = hit(p);
        if (!k) return;
        e.preventDefault();
        drag = { k: k, p: p, o: { x: boxes[k].cx, y: boxes[k].cy } };
        view.setPointerCapture(e.pointerId);
      });
      view.addEventListener('pointermove', function (e) {
        var p = vp(e);
        if (!drag) { view.style.cursor = hit(p) ? 'move' : 'default'; return; }
        S.pos[drag.k] = { x: clamp(drag.o.x + (p.x - drag.p.x) / view.width, 0, 1), y: clamp(drag.o.y + (p.y - drag.p.y) / view.height, 0, 1) };
        draw();
      });
      ['pointerup', 'pointercancel'].forEach(function (ev) { view.addEventListener(ev, function () { drag = null; }); });

      function ta(label, key) {
        var t = h('textarea', { id: nid(), rows: 2, style: { minHeight: '60px' } });
        t.value = S[key];
        t.addEventListener('input', function () { S[key] = t.value; draw(); });
        return field(label, t);
      }
      L.add(ta('Top text', 'top'));
      L.add(ta('Bottom text', 'bottom'));
      var font = select(MEME_FONTS.map(function (f) { return [f[0], f[1]]; }), S.font);
      font.addEventListener('change', function () { S.font = font.value; draw(); });
      var sz = range('Font size', 4, 20, 0.5, S.size, function (v) { return v + '%'; });
      sz.input.addEventListener('input', function () { S.size = Number(sz.input.value); draw(); });
      var up = checkbox('UPPERCASE', S.upper);
      up.input.addEventListener('change', function () { S.upper = up.input.checked; draw(); });
      var fill = input('color', S.fill), stroke = input('color', S.stroke);
      fill.addEventListener('input', function () { S.fill = fill.value; draw(); });
      stroke.addEventListener('input', function () { S.stroke = stroke.value; draw(); });
      var swR = range('Outline thickness', 0, 12, 0.5, S.sw);
      swR.input.addEventListener('input', function () { S.sw = Number(swR.input.value); draw(); });
      L.add(h('div.bi-sec', null, [field('Font', font), sz, h('div.row.cols-2', null, [field('Text colour', fill), field('Outline colour', stroke)]), swR, h('div.field', null, [up])]));
      var fmt = formatControls(im.type, { same: false, value: 'image/jpeg', quality: 92 });
      L.add(h('div.bi-sec', null, [fmt.el]));
      var dl = btn('btn-primary', 'download', 'Download meme');
      dl.addEventListener('click', function () {
        BT.busy(dl, function () {
          var s = Math.min(1, 2400 / Math.max(im.w, im.h));
          var c = mk(im.w * s, im.h * s);
          render(c, im.canvas);
          return encode(c, fmt.mime(), fmt.quality()).then(function (e) { BT.download(e.blob, outName(im.name, '-meme', e.ext)); });
        });
      });
      L.actions.appendChild(dl);
      L.actions.appendChild(btn('', 'move', 'Reset positions', function () { S.pos = { top: null, bottom: null }; draw(); }));
      draw();
      if (doc.fonts && doc.fonts.load) {
        Promise.all([doc.fonts.load('40px Anton'), doc.fonts.load('900 40px Impact')]).then(draw, draw);
        if (doc.fonts.ready) doc.fonts.ready.then(draw);
      }
      return { destroy: function () { cancelAnimationFrame(raf); } };
    });
  });

  // ==================================================== PASSPORT PHOTO
  var DPI = 300;
  function mm2px(mm) { return Math.round(mm / 25.4 * DPI); }
  var PHOTO_SIZES = [
    ['in', '35 × 45 mm (India, UK, EU, Schengen)', 35, 45, 413, 531],
    ['us', '2 × 2 in / 51 × 51 mm (USA)', 50.8, 50.8, 600, 600]
  ];
  var PAPERS = { '4x6': ['4 × 6 in photo paper', 1200, 1800, 30], a4: ['A4 sheet', 2480, 3508, 70] };

  /** Lay out copies of a photo on a sheet. Returns {canvas, count, max}. */
  function passportSheet(photo, paperKey, copies, gapMm, guides) {
    var P = PAPERS[paperKey];
    var pw = photo.width, ph = photo.height, gap = mm2px(gapMm), m = P[3];
    function fit(W, H) {
      var cols = Math.max(0, Math.floor((W - 2 * m + gap) / (pw + gap)));
      var rows = Math.max(0, Math.floor((H - 2 * m + gap) / (ph + gap)));
      return { W: W, H: H, cols: cols, rows: rows, n: cols * rows };
    }
    var a = fit(P[1], P[2]), b = fit(P[2], P[1]);
    var L = b.n > a.n ? b : a;
    var n = Math.min(L.n, copies > 0 ? copies : L.n);
    var c = mk(L.W, L.H), x = c2d(c);
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, L.W, L.H);
    var usedRows = Math.ceil(n / L.cols) || 1;
    var gw = L.cols * pw + (L.cols - 1) * gap;
    var gh = usedRows * ph + (usedRows - 1) * gap;
    var ox = Math.round((L.W - gw) / 2), oy = Math.round(Math.min((L.H - gh) / 2, m + gap));
    oy = Math.max(m, Math.round((L.H - (L.rows * ph + (L.rows - 1) * gap)) / 2));
    for (var i = 0; i < n; i++) {
      var cx = ox + (i % L.cols) * (pw + gap), cy = oy + Math.floor(i / L.cols) * (ph + gap);
      x.drawImage(photo, cx, cy);
      if (guides) {
        x.strokeStyle = '#9aa0a6';
        x.lineWidth = 2;
        x.strokeRect(cx - 1, cy - 1, pw + 2, ph + 2);
      }
    }
    return { canvas: c, count: n, max: L.n, landscape: L.W > L.H };
  }

  register('passport-photo-maker', function (root, ctx) {
    singleTool(root, ctx, { title: 'Choose a portrait photo', icon: 'contact-round', hint: 'A clear, front-facing photo against a plain background works best' }, function (im, api) {
      root.appendChild(infoBar(im, api.reset));
      var S = { size: 'in', bg: 'none', bgColor: '#ffffff', paper: '4x6', copies: 0, gap: 2, guides: true };
      var sizeDef = function () { return PHOTO_SIZES.filter(function (p) { return p[0] === S.size; })[0]; };
      var alpha = hasAlpha(im.canvas);
      var photoC = mk(413, 531);
      var sheetPrev = mk(10, 10);
      sheetPrev.className = 'bi-sheet';
      sheetPrev.style.maxHeight = '420px';
      var lastSheet = null;

      var cr = makeCropper(im.canvas, { aspect: 35 / 45, onChange: function () { schedule(); } });
      var stage = h('div.preview-box.bi-stage', { style: { paddingBottom: '40px' } }, [cr.el]);
      var steps = h('div.bi-steps', { html: '<span class="on"><i>1</i>Frame the face</span><span class="on"><i>2</i>Choose sheet</span><span class="on"><i>3</i>Download</span>' });
      var tips = h('div.notice', { html: BT.icon('info') + '<span>Keep the head centred, with the chin near the bottom guide line and some space above the hair. Face should fill about 70–80% of the photo height.</span>' });
      var outCard = h('div.card', null, [
        h('div.card-title', null, [h('h3', { text: 'Print sheet preview' }), h('span.badge', { id: nid('cnt') })]),
        h('div.preview-box', { style: { minHeight: '240px' } }, [sheetPrev])
      ]);
      var cntBadge = outCard.querySelector('.badge');
      var left = h('div', null, [steps, stage, h('p.bi-under', { text: 'Drag the frame to position the face; pull a corner to zoom.' }), tips]);
      var panel = h('div.card.bi-panel', null, [h('h3', { text: 'Photo' })]);
      root.appendChild(h('div.split.wide-left', null, [left, h('div', null, [panel])]));
      root.appendChild(h('div', { style: { marginTop: '20px' } }, [outCard]));

      var sizeSel = select(PHOTO_SIZES.map(function (p) { return [p[0], p[1]]; }), S.size);
      sizeSel.addEventListener('change', function () { S.size = sizeSel.value; var d = sizeDef(); cr.setAspect(d[2] / d[3]); schedule(); });
      var photoBox = h('div.preview-box', { style: { minHeight: '150px' } }, [photoC]);
      photoC.style.maxHeight = '180px';
      var bgSeg = seg([['none', 'Keep'], ['#ffffff', 'White'], ['#dbeafe', 'Light blue'], ['custom', 'Custom']], 'none', function (v) {
        S.bg = v; bgCustom.classList.toggle('hidden', v !== 'custom'); schedule();
      }, 'Background fill');
      var bgIn = input('color', S.bgColor);
      bgIn.addEventListener('input', function () { S.bgColor = bgIn.value; schedule(); });
      var bgCustom = h('div.hidden', { style: { marginTop: '8px' } }, [bgIn]);
      var paperSeg = seg([['4x6', '4 × 6 in'], ['a4', 'A4']], S.paper, function (v) { S.paper = v; copies.value = ''; schedule(); }, 'Paper size');
      var copies = input('number', '', { min: 1, max: 60, placeholder: 'Fill sheet', inputmode: 'numeric' });
      copies.addEventListener('input', function () { S.copies = Math.max(0, Math.floor(BT.num(copies) || 0)); schedule(); });
      var gapR = range('Gap between photos', 0, 6, 0.5, S.gap, function (v) { return v + ' mm'; });
      gapR.input.addEventListener('input', function () { S.gap = Number(gapR.input.value); schedule(); });
      var guides = checkbox('Draw cut lines', S.guides);
      guides.input.addEventListener('change', function () { S.guides = guides.input.checked; schedule(); });

      panel.appendChild(field('Photo size', sizeSel));
      panel.appendChild(h('div.field', null, [h('span.label', { text: 'Your photo (300 DPI)' }), photoBox, h('span.hint', { id: nid('dim') })]));
      var dimHint = panel.querySelector('.hint');
      panel.appendChild(h('div.field', null, [h('span.label', { text: 'Background fill' }), bgSeg, bgCustom,
        h('span.hint', { text: alpha ? 'Fills transparent areas of your cut-out photo.' : 'Applies behind transparent areas only (use a PNG cut-out to replace a background).' })]));
      panel.appendChild(h('div.bi-sec', null, [h('div.field', null, [h('span.label', { text: 'Print sheet' }), paperSeg]), field('Number of copies', copies, 'Leave empty to fill the sheet.'), gapR, h('div.field', null, [guides])]));
      var dlPhoto = btn('btn-primary', 'download', 'Download photo (JPG)');
      var dlSheet = btn('', 'download', 'Sheet (JPG)');
      var dlPdf = btn('', 'file-text', 'Sheet (PDF)');
      panel.appendChild(h('div.bi-actions', null, [dlPhoto, dlSheet, dlPdf]));

      function bgColour() { return S.bg === 'none' ? (alpha ? '#ffffff' : null) : S.bg === 'custom' ? S.bgColor : S.bg; }
      function renderPhoto() {
        var d = sizeDef(), r = cr.get();
        photoC.width = d[4]; photoC.height = d[5];
        var x = c2d(photoC);
        x.fillStyle = bgColour() || '#ffffff';
        x.fillRect(0, 0, d[4], d[5]);
        drawHQ(x, im.canvas, r.x, r.y, r.w, r.h, 0, 0, d[4], d[5]);
        dimHint.textContent = d[4] + ' × ' + d[5] + ' px · ' + d[2] + ' × ' + d[3] + ' mm';
        if (r.w < d[4] * 0.8) dimHint.textContent += ' · Low resolution: use a sharper photo for best print quality';
      }
      function renderSheet() {
        lastSheet = passportSheet(photoC, S.paper, S.copies, S.gap, S.guides);
        var s = Math.min(1, 700 / Math.max(lastSheet.canvas.width, lastSheet.canvas.height));
        sheetPrev.width = Math.round(lastSheet.canvas.width * s);
        sheetPrev.height = Math.round(lastSheet.canvas.height * s);
        drawHQ(c2d(sheetPrev), lastSheet.canvas, 0, 0, lastSheet.canvas.width, lastSheet.canvas.height, 0, 0, sheetPrev.width, sheetPrev.height);
        cntBadge.textContent = lastSheet.count + ' photo' + (lastSheet.count === 1 ? '' : 's') + ' on ' + PAPERS[S.paper][0] + (lastSheet.landscape ? ' (landscape)' : '');
        copies.placeholder = 'Fill sheet (' + lastSheet.max + ')';
        copies.max = lastSheet.max;
      }
      var tmr = 0;
      function schedule() {
        clearTimeout(tmr);
        tmr = setTimeout(function () { renderPhoto(); renderSheet(); }, 60);
      }
      dlPhoto.addEventListener('click', function () {
        renderPhoto();
        BT.busy(dlPhoto, function () { return encode(photoC, 'image/jpeg', 0.95).then(function (e) { BT.download(e.blob, 'passport-photo.jpg'); }); });
      });
      dlSheet.addEventListener('click', function () {
        renderPhoto(); renderSheet();
        BT.busy(dlSheet, function () { return encode(lastSheet.canvas, 'image/jpeg', 0.95).then(function (e) { BT.download(e.blob, 'passport-photos-' + S.paper + '.jpg'); }); });
      });
      dlPdf.addEventListener('click', function () {
        renderPhoto(); renderSheet();
        BT.busy(dlPdf, function () {
          return Promise.all([BT.loadLib('pdflib'), encode(lastSheet.canvas, 'image/jpeg', 0.95)]).then(function (r) {
            var PDFLib = r[0], e = r[1];
            return blobBytes(e.blob).then(function (bytes) {
              return PDFLib.PDFDocument.create().then(function (pdf) {
                var wPt = lastSheet.canvas.width / DPI * 72, hPt = lastSheet.canvas.height / DPI * 72;
                pdf.setTitle('Passport photos');
                pdf.setCreator('BISCS India');
                return pdf.embedJpg(bytes).then(function (img) {
                  var page = pdf.addPage([wPt, hPt]);
                  page.drawImage(img, { x: 0, y: 0, width: wPt, height: hPt });
                  return pdf.save();
                });
              });
            }).then(function (out) { BT.download(out, 'passport-photos-' + S.paper + '.pdf', 'application/pdf'); });
          });
        }, 'Creating PDF…');
      });
      renderPhoto(); renderSheet();
      return { destroy: function () { clearTimeout(tmr); } };
    });
  });
  // core.js may boot before this (large, deferred) script has executed; if the
  // page already shows the "failed to load" notice for one of our tools, start it now.
  (function rescue() {
    var root = doc.getElementById('tool-root');
    if (!root) return;
    var id = root.getAttribute('data-tool');
    var tool = BT.tool(id);
    if (!tool || tool.cat !== 'image' || root.querySelector('.loading')) return;
    if (!root.querySelector('.notice.error')) return;
    var impl = IMPLS[id];
    if (!impl) return;
    root.innerHTML = '';
    try { impl(root, { tool: tool, category: BT.category(tool.cat) }); } catch (e) { console.error(e); }
  })();
})();
