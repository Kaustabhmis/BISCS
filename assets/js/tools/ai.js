/*
 * BISCS Tools — AI photo tools.
 * Background remover, background changer, image upscaler, face blur,
 * passport photo and photo enhancer.
 *
 * Every model runs in the browser (MediaPipe Tasks Vision on WebAssembly,
 * TensorFlow.js + UpscalerJS); photos are never uploaded. Models are
 * self-hosted under assets/vendor/ai/, downloaded lazily on first use and
 * cached for the rest of the page (and by the browser's HTTP cache).
 */
(function () {
  'use strict';
  var BT = window.BT;
  if (!BT) return;
  var doc = document;
  var h = BT.h, esc = BT.esc;
  var IMPLS = {};
  /** Register a tool with core (and remember it for the late-boot rescue at the end). */
  function register(id, fn) { IMPLS[id] = fn; BT.impl(id, fn); }

  // =================================================================== CSS
  var CSS = [
    '.ai-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 14px;margin-bottom:16px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);box-shadow:var(--shadow-sm)}',
    '.ai-head .ai-ic{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#8b74e8,#5b3fc4);flex:none}',
    '.ai-head .ai-txt{flex:1;min-width:0}',
    '.ai-head .ai-name{font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.ai-head .ai-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:3px}',
    '.ai-panel h3{font-size:1rem;margin:0 0 12px}',
    '.ai-panel .field:last-child{margin-bottom:0}',
    '.ai-sec{padding-top:14px;margin-top:14px;border-top:1px solid var(--border)}',
    '.ai-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}',
    '.ai-actions .btn-primary{flex:1 1 180px}',
    '.ai-range{display:flex;align-items:center;gap:10px}',
    '.ai-range input[type=range]{flex:1;min-width:0}',
    '.ai-val{min-width:52px;text-align:right;font-variant-numeric:tabular-nums;font-weight:600;font-size:.88rem;color:var(--text-2)}',
    '.ai-seg{display:flex;width:100%}.ai-seg button{flex:1 1 auto}',
    '.ai-stage{position:relative;padding:12px;min-height:280px}',
    '.ai-stage>canvas{display:block;max-width:100%;max-height:min(64vh,600px)}',
    '.ai-under{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;justify-content:center;margin:10px 0 0;font-size:.84rem;color:var(--text-3);text-align:center}',
    '.ai-tools{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:10px}',
    '.ai-tools .seg button{display:inline-flex;align-items:center;gap:6px}',
    '.ai-notes{display:flex;flex-direction:column;gap:6px;margin-top:14px;align-items:center;text-align:center}',
    '.ai-notes p{margin:0;display:inline-flex;align-items:center;gap:8px;font-size:.86rem;color:var(--text-3)}',
    '.ai-notes p:first-child{color:var(--ok);font-weight:600}',
    '.ai-loading{display:flex;align-items:center;gap:10px;color:var(--text-3);padding:40px 0}',
    '.ai-msgs{display:flex;flex-direction:column;gap:10px;margin-top:12px}.ai-msgs:empty{display:none}',
    '.ai-msgs .notice .btn{margin-top:8px}',
    // status overlay
    '.ai-status{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92%,380px);z-index:6;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;box-shadow:var(--shadow-lg);line-height:1.45;text-align:left}',
    '.ai-st-row{display:flex;align-items:center;gap:10px;font-weight:600;margin-bottom:10px;color:var(--text)}',
    '.ai-st-row .spinner{color:var(--brand);flex:none}',
    '.ai-st-note{margin:8px 0 0}.ai-st-note:empty{display:none}',
    '.ai-st-cancel{margin-top:10px}',
    '.ai-indet>span{width:35%!important;animation:ai-indet 1.3s ease-in-out infinite}',
    '@keyframes ai-indet{0%{transform:translateX(-110%)}100%{transform:translateX(300%)}}',
    '.ai-busy canvas{filter:saturate(.6) opacity(.75)}',
    // compare widget
    '.ai-cmp{position:relative;display:inline-block;max-width:100%;line-height:0;user-select:none;-webkit-user-select:none;vertical-align:top}',
    '.ai-cmp>canvas{display:block;max-width:100%;max-height:min(64vh,600px)}',
    '.ai-cmp>canvas.ai-before{position:absolute;left:0;top:0;width:100%;height:100%;max-height:none;clip-path:inset(0 calc(100% - var(--pos,50%)) 0 0)}',
    '.ai-cmp .ai-bar{position:absolute;top:0;bottom:0;left:var(--pos,50%);width:2px;margin-left:-1px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.3);pointer-events:none}',
    '.ai-cmp .ai-knob{position:absolute;top:50%;left:var(--pos,50%);width:36px;height:36px;margin:-18px 0 0 -18px;border-radius:50%;background:#fff;color:#111;display:grid;place-items:center;box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:none;font:700 14px/1 var(--font)}',
    '.ai-cmp:focus-within .ai-knob{box-shadow:0 0 0 3px var(--brand),0 4px 14px rgba(0,0,0,.35)}',
    '.ai-cmp .ai-tag{position:absolute;top:10px;padding:3px 8px;border-radius:6px;background:rgba(0,0,0,.62);color:#fff;font:600 11px/1.4 var(--font);pointer-events:none}',
    '.ai-cmp .ai-tag.l{left:10px}.ai-cmp .ai-tag.r{right:10px}',
    '.ai-cmp .ai-cmp-rng{position:absolute;inset:0;width:100%;height:100%;opacity:0;margin:0;cursor:ew-resize;touch-action:pan-y}',
    '.ai-cmp.off>canvas.ai-before,.ai-cmp.off .ai-bar,.ai-cmp.off .ai-knob,.ai-cmp.off .ai-tag,.ai-cmp.off .ai-cmp-rng{display:none}',
    '.ai-cmp.zoomed>canvas{max-width:none;max-height:none;width:100%;height:auto}',
    '.ai-cmp.zoomed .ai-cmp-rng{display:none}',
    '.ai-cmp.paint{cursor:none;touch-action:none}.ai-cmp.pick{cursor:crosshair;touch-action:none}',
    '.ai-zoom{max-width:100%;max-height:min(70vh,640px);overflow:auto;text-align:center;line-height:0;border-radius:6px}',
    '.ai-zoom.pan{cursor:grab;text-align:left}.ai-zoom.pan.drag{cursor:grabbing}',
    '.ai-brush{position:absolute;border:2px solid #fff;outline:1px solid rgba(0,0,0,.55);border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);z-index:3}',
    '.ai-dot{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:#22c55e;border:2px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.5);pointer-events:none;z-index:2}',
    '.ai-swatches{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
    '.ai-swatches button{width:30px;height:30px;border-radius:8px;border:1px solid var(--border-strong);cursor:pointer;padding:0}',
    '.ai-swatches button[aria-pressed=true]{box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--brand)}',
    '.ai-swatches input[type=color]{width:42px;height:32px}',
    '.ai-row2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
    '.ai-hint{font-size:.8rem;color:var(--text-3)}',
    // face blur
    '.ai-fwrap{position:relative;display:inline-block;max-width:100%;line-height:0;touch-action:none;user-select:none;-webkit-user-select:none;cursor:crosshair;vertical-align:top}',
    '.ai-fwrap>canvas{display:block;max-width:100%;max-height:min(64vh,600px)}',
    '.ai-fbox{position:absolute;border:2px solid #22c55e;border-radius:6px;background:transparent;padding:0;cursor:pointer;box-shadow:0 0 0 1px rgba(0,0,0,.45)}',
    '.ai-fbox.off{border-style:dashed;border-color:#fbbf24}',
    '.ai-fbox.manual{border-color:#38bdf8}',
    '.ai-fbox span{position:absolute;left:-2px;top:-22px;font:700 11px/1 var(--font);padding:4px 6px;border-radius:5px;background:rgba(0,0,0,.72);color:#fff;white-space:nowrap}',
    '.ai-fbox i{position:absolute;right:-12px;top:-12px;width:24px;height:24px;border-radius:50%;background:#fff;color:#111;display:grid;place-items:center;font-style:normal;font:700 15px/1 var(--font);box-shadow:0 1px 4px rgba(0,0,0,.4)}',
    '.ai-fbox:focus-visible{outline:3px solid var(--brand);outline-offset:2px}',
    '.ai-fwrap.hide-boxes .ai-fbox{opacity:0;pointer-events:none}',
    '.ai-draw{position:absolute;border:2px dashed #38bdf8;background:rgba(56,189,248,.12);pointer-events:none}',
    '.ai-flist{display:flex;flex-direction:column;gap:6px;max-height:220px;overflow:auto}',
    '.ai-flist .ai-fi{display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid var(--border);border-radius:9px;background:var(--surface-2);font-size:.88rem}',
    '.ai-flist .ai-fi .check{flex:1;min-width:0}',
    '.ai-flist .ai-fi .btn{height:28px;width:28px;padding:0}',
    '.ai-emoji{display:flex;flex-wrap:wrap;gap:6px}',
    '.ai-emoji button{font-size:20px;line-height:1;width:40px;height:40px;border-radius:9px;border:1px solid var(--border-strong);background:var(--surface);cursor:pointer}',
    '.ai-emoji button[aria-pressed=true]{border-color:var(--brand);background:var(--brand-soft)}',
    // passport
    '.ai-pp{display:grid;gap:16px;grid-template-columns:1fr;align-items:start}',
    '@media (min-width:560px){.ai-pp{grid-template-columns:auto minmax(0,1fr)}}',
    '.ai-ppbox{position:relative;line-height:0;touch-action:none;cursor:grab;justify-self:center;border-radius:4px;box-shadow:0 10px 30px -12px rgba(0,0,0,.45)}',
    '.ai-ppbox.drag{cursor:grabbing}',
    '.ai-ppbox canvas{display:block;width:260px;max-width:100%;height:auto;border-radius:4px}',
    '.ai-ppbox:focus-visible{outline:3px solid var(--brand);outline-offset:3px}',
    '.ai-checks{display:flex;flex-direction:column;gap:6px;font-size:.88rem;margin:0;padding:0;list-style:none}',
    '.ai-checks li{display:flex;gap:8px;align-items:flex-start}',
    '.ai-checks li .icon{margin-top:2px;color:var(--ok)}',
    '.ai-checks li.bad .icon{color:var(--warn)}',
    '.ai-sheet{background:#fff;box-shadow:0 10px 30px -12px rgba(0,0,0,.4);max-width:100%;height:auto;max-height:420px}',
    '.ai-sheetbox{min-height:200px}',
    '.ai-sm-badges{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}'
  ].join('\n');

  function injectCSS() {
    if (doc.getElementById('ai-style')) return;
    var s = doc.createElement('style');
    s.id = 'ai-style';
    s.textContent = CSS;
    doc.head.appendChild(s);
  }

  // ================================================================ Helpers
  var uid = 0;
  function nid(p) { uid++; return 'ai-' + (p || 'f') + uid; }
  function mk(w, hh) {
    var c = doc.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(hh));
    return c;
  }
  function c2d(c, readback) { return c.getContext('2d', readback ? { willReadFrequently: true } : undefined); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function tick(ms) { return new Promise(function (r) { setTimeout(r, ms == null ? 30 : ms); }); }
  function fmtMB(mb) { return (mb < 1 ? mb.toFixed(1) : Math.round(mb)) + ' MB'; }

  function copyCanvas(src) {
    var c = mk(src.width, src.height);
    c2d(c).drawImage(src, 0, 0);
    return c;
  }

  /** High quality draw: halve the source repeatedly before a big downscale. */
  function drawHQ(ctx, src, sx, sy, sw, sh, dx, dy, dw, dh) {
    var cur = src, cx = sx, cy = sy, cw = sw, ch = sh;
    while (cw / 2 >= Math.abs(dw) && ch / 2 >= Math.abs(dh) && cw > 2 && ch > 2) {
      var t = mk(cw / 2, ch / 2), tc = c2d(t);
      tc.imageSmoothingEnabled = true;
      tc.imageSmoothingQuality = 'high';
      tc.drawImage(cur, cx, cy, cw, ch, 0, 0, t.width, t.height);
      cur = t; cx = 0; cy = 0; cw = t.width; ch = t.height;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cur, cx, cy, cw, ch, dx, dy, dw, dh);
  }

  /** Copy scaled so the long side is at most `max` (returns src itself when already small enough). */
  function scaleTo(src, max) {
    var s = Math.min(1, max / Math.max(src.width, src.height));
    if (s >= 1) return src;
    var c = mk(src.width * s, src.height * s);
    drawHQ(c2d(c), src, 0, 0, src.width, src.height, 0, 0, c.width, c.height);
    return c;
  }

  function hasAlpha(canvas) {
    var c = scaleTo(canvas, 800);
    var d = c2d(c, true).getImageData(0, 0, c.width, c.height).data;
    for (var i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
    return false;
  }

  function flatten(canvas, color) {
    var c = mk(canvas.width, canvas.height), x = c2d(c);
    x.fillStyle = color || '#ffffff';
    x.fillRect(0, 0, c.width, c.height);
    x.drawImage(canvas, 0, 0);
    return c;
  }

  /** Encode a canvas as 'png' or 'jpg' (JPG gets a solid background first). */
  function encode(canvas, fmt, bg, quality) {
    var jpg = fmt === 'jpg';
    var src = jpg ? flatten(canvas, bg) : canvas;
    return BT.canvasToBlob(src, jpg ? 'image/jpeg' : 'image/png', jpg ? (quality || 0.92) : undefined).then(function (b) {
      if (!b) throw new Error('This image is too large for your browser to save. Try a smaller photo.');
      return b;
    });
  }

  /** Write the print resolution (DPI) into a JPEG's JFIF header. */
  function jpegDpi(blob, dpi) {
    return blob.arrayBuffer().then(function (buf) {
      var b = new Uint8Array(buf);
      if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF && b[3] === 0xE0 &&
          b[6] === 0x4A && b[7] === 0x46 && b[8] === 0x49 && b[9] === 0x46 && b[10] === 0) {
        b[13] = 1;
        b[14] = dpi >> 8; b[15] = dpi & 255;
        b[16] = dpi >> 8; b[17] = dpi & 255;
      }
      return new Blob([b], { type: 'image/jpeg' });
    }).catch(function () { return blob; });
  }

  var MAX_AREA = 16e6; // keeps every canvas inside mobile Safari's limits
  /** Decode a File into a canvas (EXIF orientation applied, very large photos reduced). */
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
          rej(new Error('Could not read “' + file.name + '”. Please choose a JPG, PNG or WebP image.'));
        };
        img.src = url;
      });
    }).then(function (src) {
      var w0 = src.naturalWidth || src.width, h0 = src.naturalHeight || src.height;
      if (!w0 || !h0) throw new Error('This image appears to be empty.');
      var s = Math.min(1, Math.sqrt(MAX_AREA / (w0 * h0)));
      var w = Math.max(1, Math.round(w0 * s)), hh = Math.max(1, Math.round(h0 * s));
      var c = mk(w, hh);
      if (s < 1) drawHQ(c2d(c), src, 0, 0, w0, h0, 0, 0, w, hh);
      else c2d(c).drawImage(src, 0, 0);
      if (src.close) src.close();
      return { canvas: c, w: w, h: hh, origW: w0, origH: h0, reduced: s < 1, name: file.name || 'image', size: file.size, type: file.type };
    });
  }

  // --------------------------------------------------------- Blur & masks
  var FILTER_OK = (function () {
    try { return typeof mk(1, 1).getContext('2d').filter === 'string'; } catch (e) { return false; }
  })();

  /** Canvas with its edge pixels repeated `p` px outwards (avoids dark/transparent borders when blurring). */
  function padCanvas(src, p) {
    var w = src.width, hh = src.height, c = mk(w + 2 * p, hh + 2 * p), x = c2d(c);
    x.imageSmoothingEnabled = false;
    x.drawImage(src, p, p);
    x.drawImage(src, 0, 0, w, 1, p, 0, w, p);
    x.drawImage(src, 0, hh - 1, w, 1, p, p + hh, w, p);
    x.drawImage(src, 0, 0, 1, hh, 0, p, p, hh);
    x.drawImage(src, w - 1, 0, 1, hh, p + w, p, p, hh);
    x.drawImage(src, 0, 0, 1, 1, 0, 0, p, p);
    x.drawImage(src, w - 1, 0, 1, 1, p + w, 0, p, p);
    x.drawImage(src, 0, hh - 1, 1, 1, 0, p + hh, p, p);
    x.drawImage(src, w - 1, hh - 1, 1, 1, p + w, p + hh, p, p);
    return c;
  }

  /** Gaussian-like blur of a whole canvas (canvas filter, or down/up-sampling where unsupported). */
  function blurCanvas(src, r) {
    var w = src.width, hh = src.height, out = mk(w, hh), x = c2d(out);
    if (r < 0.5) { x.drawImage(src, 0, 0); return out; }
    if (FILTER_OK) {
      var p = Math.ceil(r * 2.5) + 2;
      var pad = padCanvas(src, p);
      x.filter = 'blur(' + r.toFixed(2) + 'px)';
      x.drawImage(pad, -p, -p);
      x.filter = 'none';
      return out;
    }
    var k = Math.max(1, r / 1.2);
    var small = mk(w / k, hh / k);
    drawHQ(c2d(small), src, 0, 0, w, hh, 0, 0, small.width, small.height);
    var mid = mk(Math.min(w, small.width * 2), Math.min(hh, small.height * 2)), mx = c2d(mid);
    mx.imageSmoothingEnabled = true; mx.imageSmoothingQuality = 'high';
    mx.drawImage(small, 0, 0, mid.width, mid.height);
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(mid, 0, 0, w, hh);
    return out;
  }

  /**
   * Fill transparent holes with surrounding colours ("pull-push" inpainting):
   * build a pyramid of halved copies and paint each coarser level underneath.
   */
  function pullPush(src) {
    var levels = [copyCanvas(src)], cur = levels[0];
    while (cur.width > 4 || cur.height > 4) {
      var n = mk(Math.ceil(cur.width / 2), Math.ceil(cur.height / 2)), nx = c2d(n);
      nx.imageSmoothingEnabled = true; nx.imageSmoothingQuality = 'high';
      nx.drawImage(cur, 0, 0, n.width, n.height);
      levels.push(n);
      cur = n;
    }
    // Coarsest level: anything still transparent gets the average colour.
    var top = levels[levels.length - 1], one = mk(1, 1), ox = c2d(one, true);
    ox.imageSmoothingEnabled = true; ox.imageSmoothingQuality = 'high';
    ox.drawImage(top, 0, 0, 1, 1);
    var px = ox.getImageData(0, 0, 1, 1).data;
    var tx = c2d(top);
    tx.globalCompositeOperation = 'destination-over';
    tx.fillStyle = px[3] ? 'rgb(' + px[0] + ',' + px[1] + ',' + px[2] + ')' : '#808080';
    tx.fillRect(0, 0, top.width, top.height);
    for (var i = levels.length - 2; i >= 0; i--) {
      var L = levels[i], lx = c2d(L);
      lx.globalCompositeOperation = 'destination-over';
      lx.imageSmoothingEnabled = true; lx.imageSmoothingQuality = 'high';
      lx.drawImage(levels[i + 1], 0, 0, L.width, L.height);
      lx.globalCompositeOperation = 'source-over';
    }
    return levels[0];
  }

  /** Separable 3-pass box blur (≈ Gaussian) of a Float32 mask. */
  function boxBlur(src, w, hh, r) {
    r = Math.round(r);
    if (r < 1) return src;
    var a = new Float32Array(src), b = new Float32Array(src.length), inv = 1 / (2 * r + 1);
    for (var pass = 0; pass < 3; pass++) {
      var x, y, acc, row, k;
      for (y = 0; y < hh; y++) {
        row = y * w; acc = 0;
        for (k = -r; k <= r; k++) acc += a[row + clamp(k, 0, w - 1)];
        for (x = 0; x < w; x++) {
          b[row + x] = acc * inv;
          acc += a[row + Math.min(x + r + 1, w - 1)] - a[row + Math.max(x - r, 0)];
        }
      }
      for (x = 0; x < w; x++) {
        acc = 0;
        for (k = -r; k <= r; k++) acc += b[clamp(k, 0, hh - 1) * w + x];
        for (y = 0; y < hh; y++) {
          a[y * w + x] = acc * inv;
          acc += b[Math.min(y + r + 1, hh - 1) * w + x] - b[Math.max(y - r, 0) * w + x];
        }
      }
    }
    return a;
  }

  /** Threshold a soft mask with a smooth edge of ±soft, then feather by blurR px. */
  function shapeMask(src, w, hh, thr, soft, blurR) {
    var lo = thr - soft, inv = 1 / Math.max(1e-3, 2 * soft), out = new Float32Array(src.length);
    for (var i = 0; i < src.length; i++) {
      var t = (src[i] - lo) * inv;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      out[i] = t * t * (3 - 2 * t);
    }
    return blurR >= 1 ? boxBlur(out, w, hh, blurR) : out;
  }

  /** Grow a mask outwards by about r px (soft edged). */
  function dilateMask(src, w, hh, r) {
    var bin = new Float32Array(src.length);
    for (var i = 0; i < src.length; i++) bin[i] = src[i] > 0.3 ? 1 : 0;
    var b = boxBlur(bin, w, hh, Math.max(1, r / 1.7));
    for (i = 0; i < b.length; i++) b[i] = clamp(b[i] * 10, 0, 1);
    return b;
  }

  /** White canvas whose alpha channel is the mask (0..1). */
  function maskToCanvas(f, w, hh) {
    var c = mk(w, hh), x = c2d(c), id = x.createImageData(w, hh), d = id.data;
    for (var i = 0, j = 0; i < f.length; i++, j += 4) {
      d[j] = 255; d[j + 1] = 255; d[j + 2] = 255; d[j + 3] = f[i] * 255;
    }
    x.putImageData(id, 0, 0);
    return c;
  }

  function maskCoverage(m) {
    var c = 0, n = 0;
    for (var i = 0; i < m.data.length; i += 7) { n++; if (m.data[i] > 0.5) c++; }
    return n ? c / n : 0;
  }

  // ============================================================ UI helpers
  function field(label, control, hint) {
    var id = control.id || (control.id = nid());
    return h('div.field', null, [h('label', { 'for': id, text: label }), control, hint ? h('span.hint', { text: hint }) : null]);
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
  /** Range slider with live value read-out. Returns wrapper with .input. */
  function range(label, min, max, step, value, fmt, hint) {
    var el = input('range', value, { min: min, max: max, step: step });
    var out = h('span.ai-val', { 'aria-hidden': 'true' });
    var f = fmt || function (v) { return v; };
    function upd() { var t = String(f(Number(el.value))); out.textContent = t; el.setAttribute('aria-valuetext', t); }
    el.addEventListener('input', upd);
    upd();
    var wrap = h('div.field', null, [h('label', { 'for': el.id, text: label }), h('div.ai-range', null, [el, out]), hint ? h('span.hint', { text: hint }) : null]);
    wrap.input = el;
    wrap.refresh = upd;
    wrap.set = function (v) { el.value = v; upd(); };
    return wrap;
  }
  function checkbox(label, checked) {
    var el = h('input', { type: 'checkbox', id: nid() });
    el.checked = !!checked;
    var lab = h('label.check', { 'for': el.id }, [el, h('span', { text: label })]);
    lab.input = el;
    return lab;
  }
  /** Segmented control. items: [[value, label, icon?]]. */
  function seg(items, value, onChange, label, full) {
    var el = h('div.seg' + (full === false ? '' : '.ai-seg'), { role: 'group', 'aria-label': label || 'Options' });
    el.value = value;
    items.forEach(function (it) {
      var b = h('button', { type: 'button', 'data-v': it[0], html: (it[2] ? BT.icon(it[2]) : '') + '<span>' + esc(it[1]) + '</span>' });
      b.addEventListener('click', function () {
        if (b.disabled) return;
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
    el.btn = function (v) { return BT.$('button[data-v="' + v + '"]', el); };
    el.set(value);
    return el;
  }
  function btn(cls, iconName, text, onClick, attrs) {
    var b = h('button.btn' + (cls ? '.' + cls.split(' ').join('.') : ''), Object.assign({ type: 'button', html: (iconName ? BT.icon(iconName) : '') + '<span>' + esc(text) + '</span>' }, attrs || {}));
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }
  function notice(kind, html, extra) {
    var n = h('div.notice' + (kind ? '.' + kind : ''), { html: BT.icon(kind === 'ok' ? 'check' : 'info') + '<div class="ai-ntxt">' + html + '</div>' });
    if (extra) BT.$('.ai-ntxt', n).appendChild(extra);
    return n;
  }
  /** Colour picker with preset swatches. onChange(hex). */
  function swatches(presets, value, onChange, label) {
    var wrap = h('div.ai-swatches', { role: 'group', 'aria-label': label || 'Colour' });
    var picker = input('color', value, { 'aria-label': 'Custom colour' });
    function mark(v) {
      BT.$$('button', wrap).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-c') === v)); });
    }
    presets.forEach(function (p) {
      var b = h('button', { type: 'button', 'data-c': p[0], title: p[1], 'aria-label': p[1], style: { background: p[0] } });
      b.addEventListener('click', function () { picker.value = p[0]; mark(p[0]); onChange(p[0]); });
      wrap.appendChild(b);
    });
    picker.addEventListener('input', function () { mark(picker.value); onChange(picker.value); });
    wrap.appendChild(picker);
    mark(value);
    wrap.set = function (v) { picker.value = v; mark(v); };
    return wrap;
  }

  /** Overlay status card (model download progress, processing, cancel). */
  function statusBox() {
    var txt = h('span.ai-st-text'), bar = h('span');
    var prog = h('div.progress', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': 'Progress' }, [bar]);
    var note = h('p.small.muted.ai-st-note');
    var cancel = btn('btn-sm ai-st-cancel hidden', 'x', 'Cancel');
    var el = h('div.ai-status.hidden', { role: 'status', 'aria-live': 'polite' }, [h('div.ai-st-row', null, [h('span.spinner', { 'aria-hidden': 'true' }), txt]), prog, note, cancel]);
    var onCancel = null;
    cancel.addEventListener('click', function () { if (onCancel) onCancel(); });
    var api = {
      el: el,
      start: function (t, n) { api.text(t, n || ''); api.progress(0); },
      text: function (t, n) {
        el.classList.remove('hidden');
        txt.textContent = t;
        if (n != null) note.textContent = n;
      },
      progress: function (f) {
        if (f == null) { prog.classList.add('ai-indet'); bar.style.width = ''; prog.removeAttribute('aria-valuenow'); return; }
        prog.classList.remove('ai-indet');
        var pc = Math.round(clamp(f, 0, 1) * 100);
        bar.style.width = pc + '%';
        prog.setAttribute('aria-valuenow', String(pc));
      },
      cancellable: function (fn) { onCancel = fn; cancel.classList.toggle('hidden', !fn); },
      hide: function () { el.classList.add('hidden'); api.cancellable(null); },
      visible: function () { return !el.classList.contains('hidden'); }
    };
    return api;
  }

  /** Before/after comparison: `after` is in flow, `before` is overlaid and clipped. */
  function compareWidget(after, before, labels) {
    labels = labels || {};
    before.classList.add('ai-before');
    var rng = h('input.ai-cmp-rng', { type: 'range', min: '0', max: '100', value: '50', 'aria-label': labels.aria || 'Compare original and result' });
    var el = h('div.ai-cmp', null, [after, before, h('span.ai-bar'), h('span.ai-knob', { html: '&#x27F7;', 'aria-hidden': 'true' }),
      h('span.ai-tag.l', { text: labels.before || 'Original' }), h('span.ai-tag.r', { text: labels.after || 'Result' }), rng]);
    function set(v) { el.style.setProperty('--pos', v + '%'); rng.value = v; }
    rng.addEventListener('input', function () { set(Number(rng.value)); });
    set(50);
    return {
      el: el, range: rng, set: set,
      enable: function (on) { el.classList.toggle('off', !on); }
    };
  }

  function friendlyError(e) {
    var m = (e && e.message) || String(e || '');
    if (typeof WebAssembly !== 'object') return 'Your browser does not support WebAssembly, which these AI tools need. Please use an up-to-date Chrome, Edge, Firefox or Safari.';
    if (/Failed to fetch|NetworkError|download|Load failed|HTTP|import/i.test(m)) return 'The AI model could not be downloaded. Please check your internet connection and try again.';
    if (/webgl|gpu|context|emscripten|graph/i.test(m)) return 'Your browser could not start the AI engine (WebGL may be unavailable or blocked). Try an up-to-date Chrome, Edge, Firefox or Safari with hardware acceleration enabled.';
    if (/memory|allocation|OOM/i.test(m)) return 'Your device ran out of memory. Try a smaller photo or close other tabs.';
    return 'Something went wrong while processing: ' + m;
  }

  /** File info header with Start over button. */
  function infoBar(im, onReset, extraHtml) {
    var meta = h('div.ai-meta', { html:
      '<span class="badge">' + im.w + ' × ' + im.h + ' px</span>' +
      (im.size ? '<span class="badge">' + BT.fmtBytes(im.size) + '</span>' : '') +
      (im.reduced ? '<span class="badge warn" title="Reduced from ' + im.origW + ' × ' + im.origH + ' px to stay within browser limits">Reduced for processing</span>' : '') +
      (extraHtml || '') });
    return h('div.ai-head', null, [
      h('span.ai-ic', { html: BT.icon('image') }),
      h('div.ai-txt', null, [h('div.ai-name', { text: im.name, title: im.name }), meta]),
      btn('btn-ghost btn-sm', 'rotate-ccw', 'Start over', onReset)
    ]);
  }

  function outName(name, suffix, ext) { return BT.baseName(name).replace(/[\\/:*?"<>|]+/g, '_') + suffix + '.' + ext; }

  /**
   * Single-image tool scaffold: dropzone → decode → build(im, api).
   * build may return {destroy} for cleanup on Start over.
   */
  function singleTool(root, ctx, opts, build) {
    injectCSS();
    var cleanup = null, gen = 0;
    function reset() {
      gen++;
      if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
      root.innerHTML = '';
      root.appendChild(BT.dropzone({
        accept: 'image/*', title: opts.title || 'Choose a photo', icon: opts.icon || 'image-plus',
        hint: opts.hint || 'or drag and drop it here · JPG, PNG, WebP',
        color: ctx.category && ctx.category.color, onFiles: function (f) { open(f[0]); }
      }));
      root.appendChild(h('div.ai-notes', null, [
        h('p', { html: BT.icon('shield-check') + '<span>Runs on your device — your photo is never uploaded.</span>' }),
        opts.model ? h('p', { html: BT.icon('download') + '<span>' + esc(opts.model) + '</span>' }) : null,
        h('p', { html: BT.icon('copy') + '<span>You can also paste an image with Ctrl + V.</span>' })
      ]));
    }
    function open(file) {
      var my = ++gen;
      if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
      root.innerHTML = '';
      root.appendChild(h('div.ai-loading', { html: '<span class="spinner"></span> Reading image…' }));
      decode(file).then(function (im) {
        if (my !== gen) return;
        root.innerHTML = '';
        var r = build(im, { reset: reset, root: root });
        cleanup = r && r.destroy;
      }).catch(function (e) {
        console.error(e);
        BT.toast(e.message || 'Could not read this image', 'error');
        reset();
      });
    }
    if (root._aiPaste) doc.removeEventListener('paste', root._aiPaste);
    root._aiPaste = function (e) {
      if (!root.isConnected || !root.querySelector('.dropzone')) return;
      var files = Array.prototype.filter.call((e.clipboardData && e.clipboardData.files) || [], function (f) { return /^image\//.test(f.type); });
      if (files.length) { e.preventDefault(); open(files[0]); }
    };
    doc.addEventListener('paste', root._aiPaste);
    reset();
  }

  /** Standard two-column editor: stage on the left, settings card on the right. */
  function editorLayout(root, im, onReset, title) {
    root.appendChild(infoBar(im, onReset));
    var tools = h('div.ai-tools');
    var stage = h('div.preview-box.ai-stage');
    var under = h('p.ai-under');
    var msgs = h('div.ai-msgs');
    var panel = h('div.card.ai-panel', null, [h('h3', { text: title || 'Settings' })]);
    var actions = h('div.ai-actions');
    panel.appendChild(actions);
    var left = h('div', null, [tools, stage, under, msgs]);
    root.appendChild(h('div.split.wide-left', null, [left, h('div', null, [panel])]));
    return {
      tools: tools, stage: stage, under: under, msgs: msgs, left: left, panel: panel, actions: actions,
      add: function (el) { panel.insertBefore(el, actions); return el; }
    };
  }

  /** Keyboard shortcut helper that removes itself on cleanup. */
  function onKey(fn) {
    function k(e) {
      var t = e.target, typing = /INPUT|TEXTAREA|SELECT/.test(t.tagName || '') && t.type !== 'range' && t.type !== 'checkbox' || t.isContentEditable;
      if (!typing) fn(e);
    }
    doc.addEventListener('keydown', k);
    return function () { doc.removeEventListener('keydown', k); };
  }

  // ============================================================ AI engine
  var WASM_MB = 9.4;
  var MODEL_MB = { 'selfie-multiclass': 16.4, 'magic-touch': 6.2, 'face-short': 0.2 };
  var TASKS = {
    person: { model: 'selfie-multiclass', cls: 'ImageSegmenter', gpu: true,
      opts: { runningMode: 'IMAGE', outputCategoryMask: false, outputConfidenceMasks: true } },
    object: { model: 'magic-touch', cls: 'InteractiveSegmenter', gpu: true,
      opts: { outputCategoryMask: false, outputConfidenceMasks: true } },
    // Note: blaze_face_full_range (2304 anchors) is not supported by the 0.10.14
    // FaceDetector graph (it expects 896), so small faces are found by tiling instead.
    'face-short': { model: 'face-short', cls: 'FaceDetector', gpu: false,
      opts: { runningMode: 'IMAGE', minDetectionConfidence: 0.5, minSuppressionThreshold: 0.3 } }
  };

  /** Fetch a file while reporting progress (warms the HTTP cache for the real loader). */
  function prefetch(url, onP) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var total = +res.headers.get('Content-Length') || 0;
      if (!res.body || !res.body.getReader || !total) return res.arrayBuffer().then(function () { if (onP) onP(1); });
      var rd = res.body.getReader(), got = 0;
      return (function pump() {
        return rd.read().then(function (r) {
          if (r.done) { if (onP) onP(1); return; }
          got += r.value.length;
          if (onP) onP(Math.min(1, got / total));
          return pump();
        });
      })();
    });
  }

  var wasmState = { done: false, p: null };
  var taskP = {};
  /**
   * Lazily create (once per page) a MediaPipe task. ui is a statusBox for the
   * one-time download progress. Resolves to a wrapper { task, delegate, run(fn) }.
   */
  function getTask(key, ui) {
    if (taskP[key]) return taskP[key];
    var def = TASKS[key];
    var wW = wasmState.done ? 0 : WASM_MB, wM = MODEL_MB[def.model], pw = 0, pm = 0;
    if (ui) ui.start('Downloading AI model (' + fmtMB(wW + wM) + ', one time)…', 'It is saved by your browser, so next time it starts instantly.');
    function rep() { if (ui) ui.progress((pw * wW + pm * wM) / (wW + wM)); }
    taskP[key] = BT.loadMediapipe().then(function (mp) {
      var wp = wasmState.done ? Promise.resolve() : (wasmState.p || (wasmState.p = prefetch(mp.fileset.wasmBinaryPath, function (f) { pw = f; rep(); })
        .then(function () { wasmState.done = true; }, function () { wasmState.p = null; })));
      return Promise.all([wp, BT.loadAiModel(def.model, function (f) { pm = f; rep(); })]).then(function (r) {
        if (ui) { ui.text('Starting the AI engine…', ''); ui.progress(null); }
        return createTask(mp, def, r[1]);
      });
    }).catch(function (e) { delete taskP[key]; throw e; });
    return taskP[key];
  }

  function createTask(mp, def, buf) {
    var Cls = mp.vision[def.cls];
    function make(delegate) {
      return Cls.createFromOptions(mp.fileset, Object.assign({}, def.opts, {
        baseOptions: { modelAssetBuffer: new Uint8Array(buf), delegate: delegate }
      }));
    }
    var w = { delegate: def.gpu ? 'GPU' : 'CPU', task: null };
    /** Run fn(task); if the GPU path fails, rebuild on the CPU and retry once. */
    w.run = function (fn) {
      return Promise.resolve().then(function () { return fn(w.task); }).catch(function (e) {
        if (w.delegate !== 'GPU') throw e;
        console.warn('AI: GPU delegate failed, using CPU instead.', e);
        try { w.task.close(); } catch (e2) { /* ignore */ }
        w.delegate = 'CPU';
        return make('CPU').then(function (t) { w.task = t; return fn(t); });
      });
    };
    return make(w.delegate).catch(function (e) {
      if (w.delegate !== 'GPU') throw e;
      console.warn('AI: GPU delegate unavailable, using CPU.', e);
      w.delegate = 'CPU';
      return make('CPU');
    }).then(function (t) { w.task = t; return w; });
  }

  /** Person mask (foreground = 1 − background confidence) at the canvas' resolution. */
  function segmentPerson(wrap, canvas) {
    return wrap.run(function (task) {
      var out = null, err = null;
      task.segment(canvas, function (res) {
        try {
          var ms = res.confidenceMasks;
          if (!ms || !ms.length) throw new Error('The AI returned no mask');
          var m = ms[0], bg = m.getAsFloat32Array(), f = new Float32Array(bg.length);
          for (var i = 0; i < bg.length; i++) f[i] = 1 - bg[i];
          out = { w: m.width, h: m.height, data: f };
        } catch (e) { err = e; }
      });
      if (err) throw err;
      if (!out) throw new Error('The AI returned no result');
      return out;
    });
  }

  /** Object mask from one click (x, y normalised 0..1) with the interactive segmenter. */
  function segmentObject(wrap, canvas, x, y) {
    return wrap.run(function (task) {
      var out = null, err = null;
      task.segment(canvas, { keypoint: { x: x, y: y } }, function (res) {
        try {
          var ms = res.confidenceMasks;
          if (!ms || !ms.length) throw new Error('The AI returned no mask');
          // Pick the mask that is most confident at the clicked point.
          var best = null, bestV = -1;
          ms.forEach(function (m) {
            var d = m.getAsFloat32Array();
            var px = clamp(Math.floor(x * m.width), 0, m.width - 1), py = clamp(Math.floor(y * m.height), 0, m.height - 1);
            var v = d[py * m.width + px];
            if (v > bestV) { bestV = v; best = { w: m.width, h: m.height, data: new Float32Array(d) }; }
          });
          out = best;
        } catch (e) { err = e; }
      });
      if (err) throw err;
      if (!out) throw new Error('The AI returned no result');
      return out;
    });
  }

  function detectFacesOnce(wrap, canvas) {
    return wrap.run(function (task) {
      var r = task.detect(canvas);
      return (r && r.detections || []).map(function (d) {
        var b = d.boundingBox;
        return {
          x: b.originX, y: b.originY, w: b.width, h: b.height,
          score: d.categories && d.categories[0] ? d.categories[0].score : 0.5,
          kp: (d.keypoints || []).map(function (k) { return { x: k.x * canvas.width, y: k.y * canvas.height }; })
        };
      });
    });
  }

  function iou(a, b) {
    var x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y), x2 = Math.min(a.x + a.w, b.x + b.w), y2 = Math.min(a.y + a.h, b.y + b.h);
    var inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    if (!inter) return { iou: 0, cover: 0 };
    return { iou: inter / (a.w * a.h + b.w * b.h - inter), cover: inter / Math.min(a.w * a.h, b.w * b.h) };
  }

  /**
   * Detect faces; with deep=true also scan overlapping tiles (2×2, 3×3, 4×4) so
   * small faces in group photos are found. Boxes are in the canvas' pixel coordinates.
   */
  function detectFaces(wrap, canvas, deep) {
    var W = canvas.width, H = canvas.height;
    return detectFacesOnce(wrap, canvas).then(function (all) {
      if (!deep) return all;
      var grids = Math.max(W, H) < 400 ? [2, 3] : [2, 3, 4], jobs = [];
      grids.forEach(function (n) {
        var tw = W / n * 1.35, th = H / n * 1.35;
        for (var gy = 0; gy < n; gy++) for (var gx = 0; gx < n; gx++) {
          var x0 = clamp(Math.round(gx * W / n - (tw - W / n) / 2), 0, Math.max(0, W - tw));
          var y0 = clamp(Math.round(gy * H / n - (th - H / n) / 2), 0, Math.max(0, H - th));
          jobs.push([x0, y0, Math.round(Math.min(tw, W)), Math.round(Math.min(th, H))]);
        }
      });
      var tile = mk(10, 10);
      return jobs.reduce(function (p, j) {
        return p.then(function () {
          tile.width = j[2]; tile.height = j[3];
          c2d(tile).drawImage(canvas, j[0], j[1], j[2], j[3], 0, 0, j[2], j[3]);
          return detectFacesOnce(wrap, tile).then(function (list) {
            list.forEach(function (f) {
              // Tiles see a zoomed-in view: be stricter and ignore implausibly big boxes.
              if (f.score < 0.7 || f.w > j[2] * 0.6) return;
              f.x += j[0]; f.y += j[1];
              f.kp.forEach(function (k) { k.x += j[0]; k.y += j[1]; });
              all.push(f);
            });
          });
        });
      }, Promise.resolve()).then(function () { return all; });
    }).then(function (all) {
      all.sort(function (a, b) { return b.score - a.score; });
      var keep = [];
      all.forEach(function (f) {
        if (f.w < 4 || f.h < 4) return;
        for (var i = 0; i < keep.length; i++) {
          var o = iou(f, keep[i]);
          if (o.iou > 0.3 || o.cover > 0.6) return;
        }
        keep.push(f);
      });
      return keep;
    });
  }

  // =========================================================== Upscaler
  var tfP = null;
  /** TensorFlow.js with the WebGL backend when it works, CPU otherwise. */
  function loadTf() {
    if (tfP) return tfP;
    tfP = BT.loadLib('tfjs').then(function (tf) {
      return Promise.resolve().then(function () { return tf.setBackend('webgl'); }).then(function (ok) {
        if (!ok) return false;
        return tf.ready().then(function () {
          // A real op proves the context works (some browsers fail lazily).
          var v = tf.tidy(function () { return tf.add(tf.scalar(1), tf.scalar(1)).dataSync()[0]; });
          return v === 2;
        });
      }).catch(function () { return false; }).then(function (ok) {
        if (ok && tf.getBackend() === 'webgl') return { tf: tf, backend: 'webgl' };
        return tf.setBackend('cpu').then(function () { return tf.ready(); }).then(function () { return { tf: tf, backend: 'cpu' }; });
      });
    }).catch(function (e) { tfP = null; throw e; });
    return tfP;
  }

  var upP = {};
  /** UpscalerJS instance for ESRGAN-medium at scale 2 or 4 (created once per page). */
  function getUpscaler(scale, ui) {
    if (upP[scale]) return upP[scale];
    var dir = BT.aiBase + 'upscaler/esrgan-medium/x' + scale + '/';
    if (ui) ui.start('Downloading AI model (about ' + (window.tf ? 3 : 4) + ' MB, one time)…', 'It is saved by your browser, so next time it starts instantly.');
    var pm = 0, pl = window.tf ? 1 : 0;
    function rep() { if (ui) ui.progress(pl * 0.3 + pm * 0.7); }
    upP[scale] = loadTf().then(function (T) {
      pl = 1; rep();
      // The UMD bundle expects this global for its built-in default model; we always pass our own.
      if (!window.DefaultUpscalerJSModel) window.DefaultUpscalerJSModel = {};
      return Promise.all([
        BT.loadLib('upscaler'),
        prefetch(dir + 'group1-shard1of1.bin', function (f) { pm = f; rep(); }).catch(function () { /* the real load reports errors */ })
      ]).then(function (r) {
        if (ui) { ui.text('Starting the AI engine…', T.backend === 'cpu' ? 'No GPU acceleration available: this will be slow.' : ''); ui.progress(null); }
        var Up = r[0];
        var up = new Up({
          model: { scale: scale, modelType: 'layers', path: dir + 'model.json', inputRange: [0, 255], outputRange: [0, 255], meta: { architecture: 'rdn' } }
        });
        return Promise.resolve(up.ready).then(function () { return { up: up, tf: T.tf, backend: T.backend }; });
      });
    }).catch(function (e) { delete upP[scale]; throw e; });
    return upP[scale];
  }

  function isAbort(e) { return e && (e.name === 'AbortError' || /abort/i.test(e.message || '')); }

  /**
   * AI super-resolution of a canvas (shared by the upscaler and the enhancer).
   * o: { ui, progress(0..1), signal }. Resolves to { canvas, backend }.
   */
  function aiUpscale(src, scale, o) {
    o = o || {};
    var alpha = hasAlpha(src);
    return getUpscaler(scale, o.ui).then(function (U) {
      var tf = U.tf;
      if (o.signal && o.signal.aborted) throw Object.assign(new Error('Cancelled'), { name: 'AbortError' });
      if (o.ui) { o.ui.text('Upscaling ' + scale + '× …', U.backend === 'cpu' ? 'Running without GPU acceleration — this can take a while.' : 'This can take a little while for larger photos.'); o.ui.progress(0); }
      var inp = tf.tidy(function () { return tf.browser.fromPixels(src).toFloat(); });
      return Promise.resolve(U.up.upscale(inp, {
        output: 'tensor', patchSize: 64, padding: 6, awaitNextFrame: true, signal: o.signal,
        progress: function (p) { if (o.progress) o.progress(typeof p === 'number' ? p : 0); }
      })).then(function (out) {
        inp.dispose();
        var px = tf.tidy(function () {
          var t = out.rank === 4 ? out.squeeze([0]) : out;
          return t.clipByValue(0, 255).round().toInt();
        });
        out.dispose();
        var c = mk(px.shape[1], px.shape[0]);
        return tf.browser.toPixels(px, c).then(function () {
          px.dispose();
          if (alpha) {
            var a = mk(c.width, c.height), ax = c2d(a);
            ax.imageSmoothingEnabled = true; ax.imageSmoothingQuality = 'high';
            ax.drawImage(src, 0, 0, c.width, c.height);
            var cx = c2d(c);
            cx.globalCompositeOperation = 'destination-in';
            cx.drawImage(a, 0, 0);
            cx.globalCompositeOperation = 'source-over';
          }
          return { canvas: c, backend: U.backend };
        });
      }, function (e) { try { inp.dispose(); } catch (e2) { /* ignore */ } throw e; });
    });
  }

  var WORK_MAX = 2048; // long side used for inference and mask editing

  // ===================================================== BACKGROUND REMOVER
  register('ai-background-remover', function (root, ctx) {
    singleTool(root, ctx, {
      title: 'Choose a photo', icon: 'image-minus',
      hint: 'or drag and drop it here · portraits, products, pets · JPG, PNG, WebP',
      model: 'First use downloads the AI engine and model (about 26 MB). Your browser keeps it for next time.'
    }, function (im, api) {
      var L = editorLayout(root, im, api.reset, 'Cut-out');
      var work = scaleTo(im.canvas, WORK_MAX), W = work.width, H = work.height;
      var S = { mode: 'auto', thr: 50, feather: 2, tool: 'compare', brush: 40, bg: 'transparent', color: '#ffffff', fmt: 'png' };
      var personMask = null, points = [], strokes = [], history = [], adjC = null, busy = false, alive = true, cur = null;
      var finalC = mk(W, H), outC = mk(W, H), beforeC = copyCanvas(work);
      outC.setAttribute('aria-label', 'Cut-out preview');
      var cmp = compareWidget(outC, beforeC, { after: 'Cut-out' });
      var cursor = h('div.ai-brush.hidden'), markers = h('div');
      cmp.el.appendChild(markers);
      cmp.el.appendChild(cursor);
      var status = statusBox();
      L.stage.appendChild(cmp.el);
      L.stage.appendChild(status.el);
      c2d(outC).drawImage(work, 0, 0);
      cmp.enable(false);

      // ---- toolbar
      var toolSeg = seg([['compare', 'Compare', 'git-compare'], ['erase', 'Erase', 'eraser'], ['restore', 'Restore', 'pencil'], ['point', 'Add object', 'mouse-pointer-2']],
        'compare', setTool, 'Editing tool', false);
      var undoB = btn('btn-sm', 'undo-2', 'Undo', undo, { title: 'Undo (Ctrl+Z)', disabled: true });
      var clearB = btn('btn-sm btn-ghost', 'rotate-ccw', 'Reset edits', function () {
        strokes = []; history = history.filter(function (e) { return e.type !== 'stroke'; });
        rebuildFinal(); render(); updUndo();
      }, { disabled: true });
      L.tools.appendChild(toolSeg);
      L.tools.appendChild(undoB);
      L.tools.appendChild(clearB);
      toolSeg.btn('point').classList.add('hidden');

      // ---- panel
      var modeSeg = seg([['auto', 'Person (auto)'], ['object', 'Object (click)']], 'auto', setMode, 'What to keep');
      L.add(h('div.field', null, [h('span.label', { text: 'What to keep' }), modeSeg,
        h('span.hint', { text: 'Person finds people automatically. Object lets you click any thing to keep.' })]));
      var thrR = range('Edge threshold', 10, 90, 1, S.thr, function (v) { return v + '%'; }, 'Higher removes more of the soft edges.');
      var featherR = range('Edge feather', 0, 10, 1, S.feather, function (v) { return v ? v : 'Off'; });
      var brushR = range('Brush size', 6, 160, 2, S.brush, function (v) { return v + ' px'; });
      var edgeSec = h('div.ai-sec', null, [h('h3', { text: 'Edges' }), thrR, featherR, brushR,
        h('p.ai-hint', { text: 'Use Erase and Restore above the photo to paint fixes onto the mask.' })]);
      L.add(edgeSec);
      var bgSeg = seg([['transparent', 'Transparent'], ['color', 'Colour']], 'transparent', function (v) {
        S.bg = v; colorWrap.classList.toggle('hidden', v !== 'color'); fmtWrap.classList.toggle('hidden', v !== 'color');
        if (v !== 'color') S.fmt = 'png';
        else S.fmt = fmtSeg.value;
        render(); updInfo();
      }, 'Background');
      var colorPick = swatches([['#ffffff', 'White'], ['#000000', 'Black'], ['#f1f5f9', 'Light grey'], ['#dbeafe', 'Light blue'], ['#fde68a', 'Yellow'], ['#22c55e', 'Green']],
        S.color, function (c) { S.color = c; render(); }, 'Background colour');
      var colorWrap = h('div.field.hidden', null, [h('span.label', { text: 'Background colour' }), colorPick]);
      var fmtSeg = seg([['png', 'PNG'], ['jpg', 'JPG']], 'png', function (v) { S.fmt = v; updInfo(); }, 'File format');
      var fmtWrap = h('div.field.hidden', null, [h('span.label', { text: 'Format' }), fmtSeg]);
      var info = h('p.ai-hint');
      L.add(h('div.ai-sec', null, [h('h3', { text: 'Output' }), h('div.field', null, [h('span.label', { text: 'Background' }), bgSeg]), colorWrap, fmtWrap, info]));
      var dl = btn('btn-primary btn-lg', 'download', 'Download', download, { disabled: true });
      L.actions.appendChild(dl);

      thrR.input.addEventListener('input', BT.debounce(function () { S.thr = +thrR.input.value; rebuildAll(); }, 60));
      featherR.input.addEventListener('input', BT.debounce(function () { S.feather = +featherR.input.value; rebuildAll(); }, 60));
      brushR.input.addEventListener('input', function () { S.brush = +brushR.input.value; });

      function updInfo() {
        info.textContent = 'Saves at full size: ' + im.w + ' × ' + im.h + ' px ' + (S.bg === 'transparent' ? 'PNG with transparency.' : S.fmt.toUpperCase() + '.');
      }
      updInfo();
      function updUndo() {
        undoB.disabled = !history.length;
        clearB.disabled = !strokes.length;
      }
      function setBusy(b) { busy = b; L.stage.classList.toggle('ai-busy', b); dl.disabled = b || !hasMask(); }
      function hasMask() { return S.mode === 'auto' ? !!personMask : points.length > 0; }

      function setTool(t) {
        S.tool = t;
        toolSeg.set(t);
        cmp.enable(t === 'compare' && hasMask());
        cmp.el.classList.toggle('paint', t === 'erase' || t === 'restore');
        cmp.el.classList.toggle('pick', t === 'point');
        cursor.classList.add('hidden');
        L.under.textContent = t === 'compare' ? 'Drag across the photo to compare the original and the cut-out.'
          : t === 'point' ? 'Click on the object you want to keep. Click more parts to add them.'
          : t === 'erase' ? 'Paint over areas that should be removed.' : 'Paint over areas that should be kept.';
      }

      function baseMask() {
        if (S.mode === 'auto') return personMask;
        if (!points.length) return null;
        var m = points[0].mask, u = new Float32Array(m.data);
        for (var p = 1; p < points.length; p++) {
          var d = points[p].mask.data;
          for (var i = 0; i < u.length; i++) if (d[i] > u[i]) u[i] = d[i];
        }
        return { w: m.w, h: m.h, data: u };
      }
      function rebuildAdj() {
        var m = baseMask();
        if (!m) { adjC = null; return; }
        var r = S.feather * Math.max(m.w, m.h) / 1000;
        adjC = maskToCanvas(shapeMask(m.data, m.w, m.h, S.thr / 100, 0.08, r), m.w, m.h);
      }
      function drawSeg(x, s, i) {
        x.save();
        x.globalCompositeOperation = s.mode === 'erase' ? 'destination-out' : 'source-over';
        x.strokeStyle = x.fillStyle = '#fff';
        x.lineWidth = s.r * 2; x.lineCap = 'round'; x.lineJoin = 'round';
        x.beginPath();
        var b = s.pts[i];
        if (i === 0) { x.arc(b[0], b[1], s.r, 0, Math.PI * 2); x.fill(); }
        else { var a = s.pts[i - 1]; x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); }
        x.restore();
      }
      function rebuildFinal() {
        var x = c2d(finalC);
        x.clearRect(0, 0, W, H);
        if (adjC) { x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(adjC, 0, 0, W, H); }
        strokes.forEach(function (s) { for (var i = 0; i < s.pts.length; i++) drawSeg(x, s, i); });
      }
      function rebuildAll() { rebuildAdj(); rebuildFinal(); render(); }
      var raf = 0;
      function schedule() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; render(); }); }
      function render() {
        var x = c2d(outC);
        x.save();
        x.clearRect(0, 0, W, H);
        if (!hasMask()) {
          x.globalAlpha = S.mode === 'object' ? 0.45 : 1;
          x.drawImage(work, 0, 0);
        } else {
          x.drawImage(finalC, 0, 0);
          x.globalCompositeOperation = 'source-in';
          x.drawImage(work, 0, 0);
          if (S.bg === 'color') {
            x.globalCompositeOperation = 'destination-over';
            x.fillStyle = S.color;
            x.fillRect(0, 0, W, H);
          }
        }
        x.restore();
      }
      function updMarkers() {
        markers.innerHTML = '';
        if (S.mode !== 'object') return;
        points.forEach(function (p) {
          markers.appendChild(h('span.ai-dot', { style: { left: (p.x * 100) + '%', top: (p.y * 100) + '%' } }));
        });
      }
      function showError(e) {
        console.error(e);
        status.hide();
        setBusy(false);
        L.msgs.innerHTML = '';
        L.msgs.appendChild(notice('error', esc(friendlyError(e))));
      }

      // ---- AI runs
      function runAuto() {
        setBusy(true);
        L.msgs.innerHTML = '';
        getTask('person', status).then(function (t) {
          if (!alive) return;
          status.text('Removing the background…', ''); status.progress(null);
          return tick().then(function () { return segmentPerson(t, work); }).then(function (m) {
            if (!alive) return;
            personMask = m;
            status.hide();
            setBusy(false);
            if (S.mode !== 'auto') return;
            rebuildAll();
            setTool('compare');
            updUndo();
            if (maskCoverage(m) < 0.01) {
              L.msgs.appendChild(notice('warn', '<strong>No person was found in this photo.</strong> Switch to Object mode and click the thing you want to keep.',
                btn('btn-sm', 'mouse-pointer-2', 'Use Object mode', function () { modeSeg.set('object'); setMode('object'); })));
            }
          });
        }).catch(showError);
      }
      function setMode(m) {
        S.mode = m;
        L.msgs.innerHTML = '';
        toolSeg.btn('point').classList.toggle('hidden', m !== 'object');
        updMarkers();
        if (m === 'auto') {
          if (S.tool === 'point') setTool('compare');
          if (!personMask && !busy) runAuto();
          rebuildAll();
          setBusy(busy);
          return;
        }
        rebuildAll();
        setTool('point');
        setBusy(true);
        getTask('object', status).then(function () {
          if (!alive) return;
          status.hide(); setBusy(false);
          if (!points.length) L.msgs.appendChild(notice('', 'Click on the object you want to keep. You can click several parts (for example a bag and its strap); each click adds to the selection.'));
        }).catch(showError);
      }
      function addPoint(px, py) {
        if (busy) return;
        var nx = clamp(px / W, 0, 1), ny = clamp(py / H, 0, 1);
        setBusy(true);
        status.text('Selecting the object…', ''); status.progress(null);
        getTask('object', status).then(function (t) {
          return tick(10).then(function () { return segmentObject(t, work, nx, ny); });
        }).then(function (m) {
          if (!alive) return;
          status.hide(); setBusy(false);
          L.msgs.innerHTML = '';
          points.push({ x: nx, y: ny, mask: m });
          history.push({ type: 'point' });
          updMarkers(); rebuildAll(); updUndo();
          dl.disabled = false;
          if (maskCoverage(m) < 0.002) BT.toast('Nothing was selected there. Try clicking the middle of the object.', 'error');
        }).catch(showError);
      }
      function undo() {
        var last = history.pop();
        if (!last) return;
        if (last.type === 'stroke') { strokes.pop(); rebuildFinal(); render(); }
        else { points.pop(); updMarkers(); rebuildAll(); setBusy(busy); }
        updUndo();
      }

      // ---- pointer editing
      function toWork(e) {
        var r = outC.getBoundingClientRect();
        return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height, r];
      }
      function moveCursor(e) {
        if (S.tool !== 'erase' && S.tool !== 'restore') return;
        var r = cmp.el.getBoundingClientRect();
        cursor.classList.remove('hidden');
        cursor.style.left = (e.clientX - r.left) + 'px';
        cursor.style.top = (e.clientY - r.top) + 'px';
        cursor.style.width = cursor.style.height = S.brush + 'px';
      }
      cmp.el.addEventListener('pointerdown', function (e) {
        if (S.tool === 'compare' || busy || e.button > 0) return;
        var p = toWork(e);
        if (S.tool === 'point') { e.preventDefault(); addPoint(p[0], p[1]); return; }
        if (!hasMask()) { BT.toast(S.mode === 'object' ? 'Click the object first, then refine it.' : 'Please wait for the AI to finish.', 'error'); return; }
        e.preventDefault();
        try { cmp.el.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
        cur = { mode: S.tool, r: S.brush / 2 * W / p[2].width, pts: [[p[0], p[1]]] };
        strokes.push(cur);
        history.push({ type: 'stroke' });
        drawSeg(c2d(finalC), cur, 0);
        schedule();
        moveCursor(e);
      });
      cmp.el.addEventListener('pointermove', function (e) {
        moveCursor(e);
        if (!cur) return;
        var p = toWork(e), last = cur.pts[cur.pts.length - 1];
        if (Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) < 1) return;
        cur.pts.push([p[0], p[1]]);
        drawSeg(c2d(finalC), cur, cur.pts.length - 1);
        schedule();
      });
      function endStroke() { if (cur) { cur = null; updUndo(); } }
      cmp.el.addEventListener('pointerup', endStroke);
      cmp.el.addEventListener('pointercancel', endStroke);
      cmp.el.addEventListener('pointerleave', function () { cursor.classList.add('hidden'); });
      var offKey = onKey(function (e) {
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && history.length) { e.preventDefault(); undo(); }
      });

      function download() {
        if (!hasMask()) return;
        BT.busy(dl, function () {
          return tick(20).then(function () {
            var out = mk(im.w, im.h), x = c2d(out);
            x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
            x.drawImage(finalC, 0, 0, im.w, im.h);
            x.globalCompositeOperation = 'source-in';
            x.drawImage(im.canvas, 0, 0);
            if (S.bg === 'color') {
              x.globalCompositeOperation = 'destination-over';
              x.fillStyle = S.color;
              x.fillRect(0, 0, im.w, im.h);
            }
            var fmt = S.bg === 'color' ? S.fmt : 'png';
            return encode(out, fmt, S.color).then(function (b) {
              BT.download(b, outName(im.name, S.bg === 'color' ? '-new-bg' : '-no-bg', fmt));
              BT.toast('Saved ' + im.w + ' × ' + im.h + ' ' + fmt.toUpperCase());
            });
          });
        }, 'Saving…');
      }

      setTool('compare');
      L.under.textContent = 'Finding the subject…';
      runAuto();
      return { destroy: function () { alive = false; offKey(); cancelAnimationFrame(raf); } };
    });
  });

  // ===================================================== BACKGROUND CHANGER
  register('ai-background-changer', function (root, ctx) {
    singleTool(root, ctx, {
      title: 'Choose a photo of a person', icon: 'aperture',
      hint: 'or drag and drop it here · portraits and selfies work best',
      model: 'First use downloads the AI engine and model (about 26 MB). Your browser keeps it for next time.'
    }, function (im, api) {
      var L = editorLayout(root, im, api.reset, 'New background');
      var work = scaleTo(im.canvas, WORK_MAX);
      var prev = scaleTo(im.canvas, 1280), PW = prev.width, PH = prev.height;
      var S = { mode: 'blur', strength: 55, color: '#2563eb', g1: '#c4b5fd', g2: '#1e3a8a', gdir: 'vertical', feather: 2, fmt: 'jpg' };
      var mask = null, fgC = null, holeC = null, bgImg = null, alive = true, blurCache = null;
      var outC = mk(PW, PH), beforeC = copyCanvas(prev);
      c2d(outC).drawImage(prev, 0, 0);
      var cmp = compareWidget(outC, beforeC);
      cmp.enable(false);
      var status = statusBox();
      L.stage.appendChild(cmp.el);
      L.stage.appendChild(status.el);
      L.under.textContent = 'Finding the person…';

      var modeSeg = seg([['blur', 'Blur'], ['color', 'Colour'], ['gradient', 'Gradient'], ['image', 'Image']], S.mode, function (v) { S.mode = v; showSecs(); draw(); }, 'Background type');
      L.add(h('div.field', null, [h('span.label', { text: 'Background' }), modeSeg]));
      var strR = range('Blur strength', 5, 100, 1, S.strength, function (v) { return v + '%'; });
      strR.input.addEventListener('input', BT.debounce(function () { S.strength = +strR.input.value; draw(); }, 40));
      var secBlur = h('div', null, [strR]);
      var colorPick = swatches([['#ffffff', 'White'], ['#f1f5f9', 'Light grey'], ['#dbeafe', 'Light blue'], ['#2563eb', 'Blue'], ['#111827', 'Charcoal'], ['#16a34a', 'Green'], ['#f59e0b', 'Amber']],
        S.color, function (c) { S.color = c; draw(); }, 'Background colour');
      var secColor = h('div.field', null, [h('span.label', { text: 'Colour' }), colorPick]);
      var g1 = input('color', S.g1, { 'aria-label': 'Gradient start colour' }), g2 = input('color', S.g2, { 'aria-label': 'Gradient end colour' });
      g1.addEventListener('input', function () { S.g1 = g1.value; draw(); });
      g2.addEventListener('input', function () { S.g2 = g2.value; draw(); });
      var gdir = select([['vertical', 'Top to bottom'], ['diagonal', 'Diagonal'], ['radial', 'Radial (spotlight)']], S.gdir);
      gdir.addEventListener('change', function () { S.gdir = gdir.value; draw(); });
      var presets = h('div.ai-swatches', { role: 'group', 'aria-label': 'Gradient presets' });
      [['#c4b5fd', '#1e3a8a'], ['#fde68a', '#f97316'], ['#a7f3d0', '#0e7490'], ['#f9fafb', '#9ca3af'], ['#fbcfe8', '#7c3aed']].forEach(function (p) {
        var b = h('button', { type: 'button', 'aria-label': 'Gradient preset', style: { background: 'linear-gradient(135deg,' + p[0] + ',' + p[1] + ')' } });
        b.addEventListener('click', function () { S.g1 = g1.value = p[0]; S.g2 = g2.value = p[1]; draw(); });
        presets.appendChild(b);
      });
      var secGrad = h('div', null, [h('div.field', null, [h('span.label', { text: 'Presets' }), presets]),
        h('div.ai-row2', null, [h('div.field', null, [h('label', { 'for': g1.id, text: 'From' }), g1]), h('div.field', null, [h('label', { 'for': g2.id, text: 'To' }), g2])]),
        field('Direction', gdir)]);
      var bgName = h('span.ai-hint', { text: 'No image chosen yet.' });
      var bgDz = BT.dropzone({ accept: 'image/*', compact: true, title: 'Choose background image', hint: 'JPG, PNG or WebP', icon: 'image-plus', onFiles: function (f) {
        decode(f[0]).then(function (b) { bgImg = b.canvas; bgName.textContent = b.name + ' · ' + b.w + ' × ' + b.h + ' px'; draw(); })
          .catch(function (e) { BT.toast(e.message, 'error'); });
      } });
      var bgBlurR = range('Soften background image', 0, 100, 1, 0, function (v) { return v ? v + '%' : 'Off'; });
      bgBlurR.input.addEventListener('input', BT.debounce(draw, 60));
      var secImg = h('div', null, [h('div.field', null, [bgDz, bgName]), bgBlurR]);
      var featherR = range('Edge softness', 0, 10, 1, S.feather, function (v) { return v ? v : 'Off'; });
      featherR.input.addEventListener('input', BT.debounce(function () { S.feather = +featherR.input.value; buildMasks(); draw(); }, 60));
      L.add(h('div', null, [secBlur, secColor, secGrad, secImg]));
      L.add(h('div.ai-sec', null, [featherR]));
      var fmtSeg = seg([['jpg', 'JPG'], ['png', 'PNG']], S.fmt, function (v) { S.fmt = v; }, 'File format');
      L.add(h('div.ai-sec', null, [h('div.field', null, [h('span.label', { text: 'Format' }), fmtSeg]), h('p.ai-hint', { text: 'Saves at full size: ' + im.w + ' × ' + im.h + ' px.' })]));
      var dl = btn('btn-primary btn-lg', 'download', 'Download', download, { disabled: true });
      L.actions.appendChild(dl);
      function showSecs() {
        secBlur.classList.toggle('hidden', S.mode !== 'blur');
        secColor.classList.toggle('hidden', S.mode !== 'color');
        secGrad.classList.toggle('hidden', S.mode !== 'gradient');
        secImg.classList.toggle('hidden', S.mode !== 'image');
      }
      showSecs();

      function buildMasks() {
        if (!mask) return;
        var r = S.feather * Math.max(mask.w, mask.h) / 1000;
        fgC = maskToCanvas(shapeMask(mask.data, mask.w, mask.h, 0.5, 0.12, r), mask.w, mask.h);
        if (!holeC) holeC = maskToCanvas(dilateMask(mask.data, mask.w, mask.h, Math.max(mask.w, mask.h) * 0.012), mask.w, mask.h);
      }
      /** Background with the person removed and the hole filled from its surroundings. */
      function cleanPlate(src, w, hh) {
        var c = mk(w, hh), x = c2d(c);
        x.drawImage(src, 0, 0, w, hh);
        x.globalCompositeOperation = 'destination-out';
        x.imageSmoothingEnabled = true;
        x.drawImage(holeC, 0, 0, w, hh);
        return pullPush(c);
      }
      function coverDraw(x, img, w, hh) {
        var s = Math.max(w / img.width, hh / img.height), dw = img.width * s, dh = img.height * s;
        drawHQ(x, img, 0, 0, img.width, img.height, (w - dw) / 2, (hh - dh) / 2, dw, dh);
      }
      function compose(src, w, hh, preview) {
        var out = mk(w, hh), x = c2d(out), long = Math.max(w, hh);
        if (S.mode === 'blur') {
          var key = w + 'x' + hh + ':' + S.strength;
          var bl;
          if (preview && blurCache && blurCache.key === key) bl = blurCache.c;
          else {
            if (!preview || !blurCache || !blurCache.plate) {
              var plate = cleanPlate(src, w, hh);
              if (preview) blurCache = { plate: plate };
            }
            var pl = preview ? blurCache.plate : plate;
            bl = blurCanvas(pl, S.strength / 100 * long * 0.022);
            if (preview) { blurCache.key = key; blurCache.c = bl; }
          }
          x.drawImage(bl, 0, 0);
        } else if (S.mode === 'color') {
          x.fillStyle = S.color; x.fillRect(0, 0, w, hh);
        } else if (S.mode === 'gradient') {
          var g;
          if (S.gdir === 'radial') g = x.createRadialGradient(w / 2, hh * 0.4, 0, w / 2, hh * 0.4, Math.hypot(w, hh) * 0.6);
          else if (S.gdir === 'diagonal') g = x.createLinearGradient(0, 0, w, hh);
          else g = x.createLinearGradient(0, 0, 0, hh);
          g.addColorStop(0, S.g1); g.addColorStop(1, S.g2);
          x.fillStyle = g; x.fillRect(0, 0, w, hh);
        } else if (bgImg) {
          var bb = mk(w, hh);
          coverDraw(c2d(bb), bgImg, w, hh);
          var sb = +bgBlurR.input.value;
          x.drawImage(sb ? blurCanvas(bb, sb / 100 * long * 0.02) : bb, 0, 0);
        } else {
          x.drawImage(src, 0, 0, w, hh);
        }
        var fg = mk(w, hh), f = c2d(fg);
        f.imageSmoothingEnabled = true; f.imageSmoothingQuality = 'high';
        f.drawImage(fgC, 0, 0, w, hh);
        f.globalCompositeOperation = 'source-in';
        f.drawImage(src, 0, 0, w, hh);
        x.drawImage(fg, 0, 0);
        return out;
      }
      var raf = 0;
      function draw() {
        if (!fgC) return;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          raf = 0;
          var c = compose(prev, PW, PH, true);
          c2d(outC).clearRect(0, 0, PW, PH);
          c2d(outC).drawImage(c, 0, 0);
          if (S.mode === 'image' && !bgImg) L.under.textContent = 'Choose a background image in the panel.';
          else L.under.textContent = 'Drag across the photo to compare the original and the result.';
        });
      }
      function download() {
        BT.busy(dl, function () {
          return tick(20).then(function () {
            var out = compose(im.canvas, im.w, im.h, false);
            return encode(out, S.fmt, '#ffffff').then(function (b) {
              BT.download(b, outName(im.name, S.mode === 'blur' ? '-blurred-bg' : '-new-bg', S.fmt));
            });
          });
        }, 'Saving…');
      }

      getTask('person', status).then(function (t) {
        if (!alive) return;
        status.text('Finding the person…', ''); status.progress(null);
        return tick().then(function () { return segmentPerson(t, work); }).then(function (m) {
          if (!alive) return;
          mask = m;
          status.hide();
          buildMasks();
          cmp.enable(true);
          dl.disabled = false;
          draw();
          if (maskCoverage(m) < 0.01) L.msgs.appendChild(notice('warn', '<strong>No person was found in this photo.</strong> This tool works best with people. For other subjects try the AI Background Remover’s Object mode.'));
        });
      }).catch(function (e) {
        console.error(e);
        status.hide();
        L.under.textContent = '';
        L.msgs.appendChild(notice('error', esc(friendlyError(e))));
      });
      return { destroy: function () { alive = false; cancelAnimationFrame(raf); } };
    });
  });

  // ========================================================== UPSCALER
  var UP_LIMIT = { 2: 1200, 4: 600 };

  /** Zoomable holder for a compare widget: Fit / 100% / 200%, drag to pan when zoomed. */
  function zoomer(box, extRange) {
    var cmp = null, zoom = 'fit', drag = null;
    function apply() {
      if (!cmp) return;
      var c = cmp.el.querySelector('canvas');
      var z = zoom === 'fit' ? 0 : +zoom;
      cmp.el.classList.toggle('zoomed', !!z);
      box.classList.toggle('pan', !!z);
      cmp.el.style.width = z ? Math.round(c.width * z / (window.devicePixelRatio || 1)) + 'px' : '';
      extRange.classList.toggle('hidden', !z);
    }
    box.addEventListener('pointerdown', function (e) {
      if (zoom === 'fit' || e.button > 0) return;
      drag = { x: e.clientX, y: e.clientY, l: box.scrollLeft, t: box.scrollTop };
      box.classList.add('drag');
      try { box.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
      e.preventDefault();
    });
    box.addEventListener('pointermove', function (e) {
      if (!drag) return;
      box.scrollLeft = drag.l - (e.clientX - drag.x);
      box.scrollTop = drag.t - (e.clientY - drag.y);
    });
    function end() { drag = null; box.classList.remove('drag'); }
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
    extRange.addEventListener('input', function () { if (cmp) cmp.set(+extRange.value); });
    return {
      setCompare: function (c) {
        cmp = c;
        box.innerHTML = '';
        box.appendChild(c.el);
        c.range.addEventListener('input', function () { extRange.value = c.range.value; });
        apply();
      },
      setZoom: function (z) { zoom = z; apply(); }
    };
  }

  register('ai-image-upscaler', function (root, ctx) {
    singleTool(root, ctx, {
      title: 'Choose an image to upscale', icon: 'scaling',
      hint: 'or drag and drop it here · best for small photos, up to 1200 px',
      model: 'First use downloads the AI engine and model (about 4 MB). Your browser keeps it for next time.'
    }, function (im, api) {
      var L = editorLayout(root, im, api.reset, 'Upscale');
      var S = { scale: 2, fmt: im.type === 'image/jpeg' ? 'jpg' : 'png' };
      var result = null, resultScale = 2, ctrl = null, alive = true;
      var status = statusBox();
      var zoomBox = h('div.ai-zoom', null, [scaleTo(im.canvas, 1600)]);
      var extR = h('input.hidden', { type: 'range', min: '0', max: '100', value: '50', 'aria-label': 'Compare original and upscaled' });
      var Z = zoomer(zoomBox, extR);
      L.stage.appendChild(zoomBox);
      L.stage.appendChild(status.el);
      L.left.insertBefore(extR, L.under);
      var zoomSeg = seg([['fit', 'Fit'], ['1', '100%'], ['2', '200%']], 'fit', function (v) { Z.setZoom(v); }, 'Zoom', false);
      BT.$$('button', zoomSeg).forEach(function (b) { b.disabled = true; });
      L.tools.appendChild(h('span.label', { text: 'Zoom' }));
      L.tools.appendChild(zoomSeg);
      L.under.textContent = 'Choose 2× or 4× and press Upscale.';

      var scaleSeg = seg([['2', '2× (double)'], ['4', '4× (quadruple)']], '2', function (v) { S.scale = +v; upd(); }, 'Upscale factor');
      L.add(h('div.field', null, [h('span.label', { text: 'Enlarge by' }), scaleSeg]));
      var sizeInfo = h('div.stats', { style: { gridTemplateColumns: 'repeat(2,minmax(0,1fr))' } });
      L.add(sizeInfo);
      var warnBox = h('div', { style: { marginTop: '12px' } });
      L.add(warnBox);
      var fmtSeg = seg([['png', 'PNG'], ['jpg', 'JPG']], S.fmt, function (v) { S.fmt = v; }, 'File format');
      L.add(h('div.ai-sec', null, [h('div.field', null, [h('span.label', { text: 'Save as' }), fmtSeg])]));
      var runB = btn('btn-primary btn-lg', 'sparkles', 'Upscale 2×', run);
      var dl = btn('btn-lg', 'download', 'Download', download, { disabled: true });
      L.actions.appendChild(runB);
      L.actions.appendChild(dl);

      function stat(label, value) { return h('div.stat', null, [h('div.label', { text: label }), h('div.value', { text: value })]); }
      function upd() {
        var lim = UP_LIMIT[S.scale], long = Math.max(im.w, im.h), s = Math.min(1, lim / long);
        var iw = Math.round(im.w * s), ih = Math.round(im.h * s);
        sizeInfo.innerHTML = '';
        sizeInfo.appendChild(stat('Input', iw + ' × ' + ih));
        sizeInfo.appendChild(stat('Output', iw * S.scale + ' × ' + ih * S.scale));
        warnBox.innerHTML = '';
        if (s < 1) {
          warnBox.appendChild(notice('warn', 'This photo is ' + long + ' px on its long side. AI upscaling ' + S.scale + '× is limited to ' + lim +
            ' px input because it is very heavy for a browser, so it will be <strong>downscaled to ' + lim + ' px first</strong>' +
            (S.scale === 4 ? '. Choose 2× to keep more detail.' : '.')));
          runB.innerHTML = BT.icon('sparkles') + '<span>Downscale &amp; upscale ' + S.scale + '×</span>';
        } else {
          runB.innerHTML = BT.icon('sparkles') + '<span>Upscale ' + S.scale + '×</span>';
        }
      }
      upd();

      function run() {
        if (ctrl) return;
        var scale = S.scale, src = scaleTo(im.canvas, UP_LIMIT[scale]);
        ctrl = window.AbortController ? new AbortController() : { signal: null, abort: function () {} };
        runB.disabled = true; dl.disabled = true;
        L.msgs.innerHTML = '';
        L.stage.classList.add('ai-busy');
        status.cancellable(function () { ctrl.abort(); status.text('Cancelling…'); });
        var t0 = Date.now(), lastPc = -1;
        aiUpscale(src, scale, {
          ui: status, signal: ctrl.signal,
          progress: function (p) {
            status.progress(p);
            var pc = Math.floor(p * 10) * 10;
            if (pc !== lastPc) { lastPc = pc; status.text('Upscaling ' + scale + '× … ' + pc + '%'); }
          }
        }).then(function (r) {
          if (!alive) return;
          result = r.canvas;
          resultScale = scale;
          var cmp = compareWidget(result, copyCanvas(src), { before: 'Original', after: 'AI ' + scale + '×', aria: 'Compare original and upscaled' });
          Z.setCompare(cmp);
          BT.$$('button', zoomSeg).forEach(function (b) { b.disabled = false; });
          dl.disabled = false;
          var secs = ((Date.now() - t0) / 1000).toFixed(1);
          L.under.textContent = 'Done in ' + secs + ' s · ' + result.width + ' × ' + result.height + ' px · Drag across the image to compare; zoom in to see detail.';
          if (r.backend === 'cpu') L.msgs.appendChild(notice('warn', 'Your browser has no GPU acceleration (WebGL) available, so the AI ran on the CPU. It works, but is much slower.'));
        }).catch(function (e) {
          if (!alive) return;
          if (isAbort(e)) { BT.toast('Upscaling cancelled'); return; }
          console.error(e);
          L.msgs.appendChild(notice('error', esc(friendlyError(e))));
        }).then(function () {
          ctrl = null;
          if (!alive) return;
          status.hide();
          runB.disabled = false;
          L.stage.classList.remove('ai-busy');
        });
      }
      function download() {
        if (!result) return;
        BT.busy(dl, function () {
          return encode(result, S.fmt, '#ffffff', 0.95).then(function (b) {
            BT.download(b, outName(im.name, '-upscaled-' + resultScale + 'x', S.fmt));
          });
        }, 'Saving…');
      }
      return { destroy: function () { alive = false; if (ctrl) ctrl.abort(); } };
    });
  });

  // =========================================================== FACE BLUR
  var EMOJIS = ['😀', '😎', '🙂', '🤐', '⭐', '❤️'];

  register('ai-face-blur', function (root, ctx) {
    singleTool(root, ctx, {
      title: 'Choose a photo with faces', icon: 'scan-face',
      hint: 'or drag and drop it here · group photos, street photos, screenshots',
      model: 'First use downloads the AI engine and face model (about 10 MB). Your browser keeps it for next time.'
    }, function (im, api) {
      var L = editorLayout(root, im, api.reset, 'Face blur');
      var work = scaleTo(im.canvas, WORK_MAX), wk = im.w / work.width;
      var prev = scaleTo(im.canvas, 1600), PW = prev.width, PH = prev.height, pk = PW / im.w;
      var S = { effect: 'blur', strength: 60, pad: 15, shape: 'ellipse', color: '#111111', emoji: EMOJIS[0], range: 'group', fmt: im.type === 'image/png' ? 'png' : 'jpg' };
      var faces = [], alive = true, busy = false;
      var outC = mk(PW, PH);
      outC.setAttribute('aria-label', 'Photo preview with faces hidden');
      c2d(outC).drawImage(prev, 0, 0);
      var wrap = h('div.ai-fwrap', null, [outC]);
      var boxLayer = h('div');
      wrap.appendChild(boxLayer);
      var status = statusBox();
      L.stage.appendChild(wrap);
      L.stage.appendChild(status.el);
      var showBoxes = checkbox('Show face boxes', true);
      showBoxes.input.addEventListener('change', function () { wrap.classList.toggle('hide-boxes', !showBoxes.input.checked); });
      L.tools.appendChild(showBoxes);
      L.under.textContent = 'Click a box to switch it on or off. Drag on the photo to add a box by hand.';

      // ---- panel
      var countEl = h('span.badge', { text: '…' });
      var list = h('div.ai-flist', { role: 'list', 'aria-label': 'Detected faces' });
      var allB = btn('btn-sm', 'check', 'All', function () { faces.forEach(function (f) { f.on = true; }); refresh(); });
      var noneB = btn('btn-sm btn-ghost', 'x', 'None', function () { faces.forEach(function (f) { f.on = false; }); refresh(); });
      L.add(h('div.field', null, [h('div.card-title', { style: { marginBottom: '6px' } }, [h('span.label', { text: 'Faces' }), countEl]), list, h('div.btn-group', { style: { marginTop: '8px' } }, [allB, noneB])]));
      var effSeg = seg([['blur', 'Blur'], ['pixelate', 'Pixelate'], ['bar', 'Solid'], ['emoji', 'Emoji']], S.effect, function (v) { S.effect = v; showSecs(); draw(); }, 'Effect');
      var strR = range('Strength', 1, 100, 1, S.strength, function (v) { return v + '%'; });
      strR.input.addEventListener('input', function () { S.strength = +strR.input.value; draw(); });
      var padR = range('Box padding', 0, 60, 1, S.pad, function (v) { return v + '%'; });
      padR.input.addEventListener('input', function () { S.pad = +padR.input.value; draw(); });
      var shapeSeg = seg([['ellipse', 'Oval'], ['rounded', 'Rounded'], ['rect', 'Square']], S.shape, function (v) { S.shape = v; draw(); }, 'Shape');
      var colorPick = swatches([['#111111', 'Black'], ['#ffffff', 'White'], ['#6b7280', 'Grey'], ['#4f46e5', 'Indigo'], ['#dc2626', 'Red']], S.color, function (c) { S.color = c; draw(); }, 'Bar colour');
      var secColor = h('div.field', null, [h('span.label', { text: 'Colour' }), colorPick]);
      var emo = h('div.ai-emoji', { role: 'group', 'aria-label': 'Emoji' });
      EMOJIS.forEach(function (e) {
        var b = h('button', { type: 'button', text: e, 'aria-pressed': String(e === S.emoji), 'aria-label': 'Emoji ' + e });
        b.addEventListener('click', function () { S.emoji = e; BT.$$('button', emo).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); draw(); });
        emo.appendChild(b);
      });
      var secEmoji = h('div.field', null, [h('span.label', { text: 'Sticker' }), emo]);
      L.add(h('div.ai-sec', null, [h('div.field', null, [h('span.label', { text: 'Effect' }), effSeg]), strR, secColor, secEmoji, padR,
        h('div.field', null, [h('span.label', { text: 'Shape' }), shapeSeg])]));
      var rangeSeg = seg([['group', 'Group / distant'], ['close', 'Close-up / selfie']], S.range, function (v) { S.range = v; detect(); }, 'Detection mode');
      L.add(h('div.ai-sec', null, [h('div.field', null, [h('span.label', { text: 'Detection' }), rangeSeg,
        h('span.hint', { text: 'Group mode scans the photo in tiles to find small faces in the background.' })])]));
      var fmtSeg = seg([['jpg', 'JPG'], ['png', 'PNG']], S.fmt, function (v) { S.fmt = v; }, 'File format');
      L.add(h('div.ai-sec', null, [h('div.field', null, [h('span.label', { text: 'Save as' }), fmtSeg])]));
      var dl = btn('btn-primary btn-lg', 'download', 'Download', download, { disabled: true });
      L.actions.appendChild(dl);
      function showSecs() {
        secColor.classList.toggle('hidden', S.effect !== 'bar');
        secEmoji.classList.toggle('hidden', S.effect !== 'emoji');
        strR.classList.toggle('hidden', S.effect === 'bar' || S.effect === 'emoji');
      }
      showSecs();

      // ---- rendering
      function region(f, s) {
        var p = S.pad / 100;
        return { x: (f.x - f.w * p) * s, y: (f.y - f.h * p) * s, w: f.w * (1 + 2 * p) * s, h: f.h * (1 + 2 * p) * s };
      }
      function path(x, r) {
        x.beginPath();
        if (S.shape === 'ellipse') x.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2, 0, 0, Math.PI * 2);
        else if (S.shape === 'rounded') {
          var rr = Math.min(r.w, r.h) * 0.22;
          x.moveTo(r.x + rr, r.y);
          x.arcTo(r.x + r.w, r.y, r.x + r.w, r.y + r.h, rr);
          x.arcTo(r.x + r.w, r.y + r.h, r.x, r.y + r.h, rr);
          x.arcTo(r.x, r.y + r.h, r.x, r.y, rr);
          x.arcTo(r.x, r.y, r.x + r.w, r.y, rr);
          x.closePath();
        } else x.rect(r.x, r.y, r.w, r.h);
      }
      function effect(x, src, r) {
        var W = src.width, H = src.height, st = S.strength / 100, minSide = Math.max(2, Math.min(r.w, r.h));
        if (S.effect === 'emoji') {
          var size = Math.max(r.w, r.h) * 0.95;
          x.save();
          x.font = Math.round(size) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
          x.textAlign = 'center'; x.textBaseline = 'middle';
          x.fillText(S.emoji, r.x + r.w / 2, r.y + r.h / 2 + size * 0.05);
          x.restore();
          return;
        }
        x.save();
        path(x, r);
        x.clip();
        if (S.effect === 'bar') {
          x.fillStyle = S.color;
          x.fillRect(r.x, r.y, r.w, r.h);
        } else if (S.effect === 'pixelate') {
          var n = Math.max(3, Math.round(18 - 15 * st)), cell = minSide / n;
          var sm = mk(Math.max(1, r.w / cell), Math.max(1, r.h / cell)), sx = c2d(sm);
          drawHQ(sx, src, r.x, r.y, r.w, r.h, 0, 0, sm.width, sm.height);
          x.imageSmoothingEnabled = false;
          x.drawImage(sm, r.x, r.y, r.w, r.h);
        } else {
          var rad = Math.max(2, minSide * (0.03 + 0.17 * st)), m = Math.ceil(rad * 3);
          var x0 = Math.max(0, Math.floor(r.x - m)), y0 = Math.max(0, Math.floor(r.y - m));
          var x1 = Math.min(W, Math.ceil(r.x + r.w + m)), y1 = Math.min(H, Math.ceil(r.y + r.h + m));
          if (x1 > x0 && y1 > y0) {
            var tile = mk(x1 - x0, y1 - y0);
            c2d(tile).drawImage(src, x0, y0, tile.width, tile.height, 0, 0, tile.width, tile.height);
            var b = blurCanvas(tile, rad);
            if (st > 0.6) b = blurCanvas(b, rad * 0.6);
            x.drawImage(b, x0, y0);
          }
        }
        x.restore();
      }
      function renderTo(target, src, s) {
        var x = c2d(target);
        x.clearRect(0, 0, target.width, target.height);
        x.drawImage(src, 0, 0, target.width, target.height);
        faces.forEach(function (f) { if (f.on) effect(x, src, region(f, s)); });
      }
      var raf = 0;
      function draw() {
        if (raf) return;
        raf = requestAnimationFrame(function () { raf = 0; renderTo(outC, prev, pk); });
      }
      function refresh() {
        boxLayer.innerHTML = '';
        list.innerHTML = '';
        countEl.textContent = faces.length + (faces.length === 1 ? ' face' : ' faces');
        faces.forEach(function (f, i) {
          var label = 'Face ' + (i + 1) + (f.manual ? ' (manual)' : '');
          var box = h('button.ai-fbox' + (f.on ? '' : '.off') + (f.manual ? '.manual' : ''), {
            type: 'button', 'aria-pressed': String(f.on), 'aria-label': label + (f.on ? ', hidden — press to show' : ', visible — press to hide') + '. Delete key removes it.',
            style: { left: (f.x / im.w * 100) + '%', top: (f.y / im.h * 100) + '%', width: (f.w / im.w * 100) + '%', height: (f.h / im.h * 100) + '%' }
          }, [h('span', { text: String(i + 1) })]);
          box.addEventListener('click', function () { f.on = !f.on; refresh(); });
          box.addEventListener('keydown', function (e) { if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove(f); } });
          var x = h('button.btn.btn-sm.ai-fx', { type: 'button', 'aria-label': 'Remove ' + label, title: 'Remove box', html: BT.icon('x'),
            style: { position: 'absolute', left: ((f.x + f.w) / im.w * 100) + '%', top: (f.y / im.h * 100) + '%', width: '24px', height: '24px', padding: '0', margin: '-12px 0 0 -12px', borderRadius: '50%' } });
          x.addEventListener('click', function () { remove(f); });
          boxLayer.appendChild(box);
          boxLayer.appendChild(x);
          var cb = checkbox(label + (f.manual ? '' : ' · ' + Math.round(f.score * 100) + '%'), f.on);
          cb.input.addEventListener('change', function () { f.on = cb.input.checked; refresh(); });
          list.appendChild(h('div.ai-fi', { role: 'listitem' }, [cb, btn('btn-ghost btn-sm', 'trash-2', '', function () { remove(f); }, { 'aria-label': 'Remove ' + label, title: 'Remove' })]));
        });
        if (!faces.length) list.appendChild(h('p.ai-hint', { text: 'No faces yet. Drag on the photo to draw a box.' }));
        dl.disabled = busy;
        draw();
      }
      function remove(f) { faces.splice(faces.indexOf(f), 1); refresh(); }

      // ---- manual boxes
      var drawing = null, ghost = h('div.ai-draw.hidden');
      wrap.appendChild(ghost);
      function local(e) {
        var r = outC.getBoundingClientRect();
        return { x: clamp(e.clientX - r.left, 0, r.width), y: clamp(e.clientY - r.top, 0, r.height), r: r };
      }
      wrap.addEventListener('pointerdown', function (e) {
        if (e.button > 0 || e.target.closest('.ai-fbox, .ai-fx')) return;
        e.preventDefault();
        var p = local(e);
        drawing = { x0: p.x, y0: p.y, x1: p.x, y1: p.y, r: p.r };
        try { wrap.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
      });
      wrap.addEventListener('pointermove', function (e) {
        if (!drawing) return;
        var p = local(e);
        drawing.x1 = p.x; drawing.y1 = p.y;
        var x = Math.min(drawing.x0, p.x), y = Math.min(drawing.y0, p.y);
        ghost.classList.remove('hidden');
        Object.assign(ghost.style, { left: x + 'px', top: y + 'px', width: Math.abs(p.x - drawing.x0) + 'px', height: Math.abs(p.y - drawing.y0) + 'px' });
      });
      function endDraw() {
        if (!drawing) return;
        var d = drawing; drawing = null;
        ghost.classList.add('hidden');
        var w = Math.abs(d.x1 - d.x0), hh = Math.abs(d.y1 - d.y0);
        if (w < 8 || hh < 8) return;
        var k = im.w / d.r.width;
        faces.push({ x: Math.min(d.x0, d.x1) * k, y: Math.min(d.y0, d.y1) * k, w: w * k, h: hh * k, on: true, manual: true, score: 1 });
        refresh();
      }
      wrap.addEventListener('pointerup', endDraw);
      wrap.addEventListener('pointercancel', function () { drawing = null; ghost.classList.add('hidden'); });

      // ---- detection
      function detect() {
        if (busy) return;
        busy = true;
        dl.disabled = true;
        L.msgs.innerHTML = '';
        L.stage.classList.add('ai-busy');
        getTask('face-short', status).then(function (t) {
          if (!alive) return;
          status.text('Looking for faces…', ''); status.progress(null);
          return tick().then(function () { return detectFaces(t, work, S.range === 'group'); }).then(function (found) {
            if (!alive) return;
            faces = faces.filter(function (f) { return f.manual; }).concat(found.map(function (f) {
              return { x: f.x * wk, y: f.y * wk, w: f.w * wk, h: f.h * wk, score: f.score, on: true, manual: false };
            }));
            if (!found.length) {
              L.msgs.appendChild(notice('warn', '<strong>No faces were found.</strong> Drag on the photo to draw a box by hand' +
                (S.range === 'group' ? ', or try “Close-up / selfie” detection.' : ', or try “Group / distant” detection.')));
            }
          });
        }).catch(function (e) {
          console.error(e);
          L.msgs.appendChild(notice('error', esc(friendlyError(e)) + ' You can still draw boxes by hand.'));
        }).then(function () {
          busy = false;
          if (!alive) return;
          status.hide();
          L.stage.classList.remove('ai-busy');
          refresh();
        });
      }
      function download() {
        BT.busy(dl, function () {
          return tick(20).then(function () {
            var out = mk(im.w, im.h);
            renderTo(out, im.canvas, 1);
            return encode(out, S.fmt, '#ffffff', 0.93).then(function (b) { BT.download(b, outName(im.name, '-faces-hidden', S.fmt)); });
          });
        }, 'Saving…');
      }
      detect();
      return { destroy: function () { alive = false; cancelAnimationFrame(raf); } };
    });
  });

  // ====================================================== PASSPORT PHOTO
  var PP_W = 413, PP_H = 531;           // 35 × 45 mm at 300 DPI
  var PP_TOP = 0.42;                     // share of the free space above the crown
  var PP_SHEETS = {
    '4x6': { label: '4 × 6 in (8 photos)', W: 1800, H: 1200, cols: 4, rows: 2 },
    a4: { label: 'A4 (30 photos)', W: 2480, H: 3508, cols: 5, rows: 6 }
  };

  /** Lay out copies of a photo on a print sheet with thin cut lines. */
  function ppSheet(photo, key) {
    var P = PP_SHEETS[key], gap = 24; // 2 mm
    var c = mk(P.W, P.H), x = c2d(c);
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, P.W, P.H);
    var gw = P.cols * PP_W + (P.cols - 1) * gap, gh = P.rows * PP_H + (P.rows - 1) * gap;
    var ox = Math.round((P.W - gw) / 2), oy = Math.round((P.H - gh) / 2);
    x.strokeStyle = '#a3a3a3';
    x.lineWidth = 1;
    for (var r = 0; r < P.rows; r++) for (var col = 0; col < P.cols; col++) {
      var px = ox + col * (PP_W + gap), py = oy + r * (PP_H + gap);
      x.drawImage(photo, px, py);
      x.strokeRect(px - 0.5, py - 0.5, PP_W + 1, PP_H + 1);
    }
    x.fillStyle = '#8a8a8a';
    x.font = '20px sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('35 × 45 mm passport photos · print at 100% / actual size (300 DPI) · cut along the grey lines', P.W / 2, P.H - Math.max(14, (P.H - gh) / 4));
    return c;
  }

  register('ai-passport-photo', function (root, ctx) {
    singleTool(root, ctx, {
      title: 'Choose a front-facing photo', icon: 'square-user-round',
      hint: 'or drag and drop it here · face the camera, good even light',
      model: 'First use downloads the AI engine and models (about 26 MB). Your browser keeps it for next time.'
    }, function (im, api) {
      var L = editorLayout(root, im, api.reset, 'Adjust');
      var work = scaleTo(im.canvas, WORK_MAX), wk = im.w / work.width;
      var S = { head: 75, dx: 0, dy: 0, removeBg: true, bg: '#ffffff', feather: 2, guides: true, paper: '4x6' };
      var geo = null, faceInfo = { found: false, count: 0, tilt: 0 }, segData = null, segBusy = null, alive = true, ready = false;
      var photoC = mk(PP_W, PP_H), dispC = mk(PP_W, PP_H);
      dispC.setAttribute('aria-hidden', 'true');
      var box = h('div.ai-ppbox', { tabindex: '0', role: 'img', 'aria-label': 'Passport photo preview. Drag or use arrow keys to move, plus and minus keys to zoom.' }, [dispC]);
      var status = statusBox();
      var checks = h('ul.ai-checks');
      L.stage.appendChild(h('div.ai-pp', null, [box, h('div', null, [h('h3', { text: 'Photo check', style: { fontSize: '1rem' } }), checks,
        h('p.ai-hint', { style: { marginTop: '10px' }, html: '35 × 45 mm · ' + PP_W + ' × ' + PP_H + ' px at 300 DPI (India, UK, EU, Schengen, ICAO).' })])]));
      L.stage.style.textAlign = 'left';
      L.stage.style.placeItems = 'stretch';
      L.stage.appendChild(status.el);
      L.under.textContent = 'Drag the photo to reposition it. Use the sliders to fine-tune.';

      var headR = range('Head size', 60, 90, 1, S.head, function (v) { return v + '% of height'; }, 'Chin to top of head. Most countries require 70–80%.');
      var dxR = range('Move left / right', -25, 25, 0.5, 0, function (v) { return (v > 0 ? '+' : '') + v; });
      var dyR = range('Move up / down', -25, 25, 0.5, 0, function (v) { return (v > 0 ? '+' : '') + v; });
      headR.input.addEventListener('input', function () { S.head = +headR.input.value; schedule(); });
      dxR.input.addEventListener('input', function () { S.dx = +dxR.input.value; schedule(); });
      dyR.input.addEventListener('input', function () { S.dy = -dyR.input.value; schedule(); });
      var recenter = btn('btn-sm btn-ghost', 'rotate-ccw', 'Re-centre', function () {
        S.head = 75; S.dx = 0; S.dy = 0; headR.set(75); dxR.set(0); dyR.set(0); schedule();
      });
      L.add(h('div', null, [headR, dxR, dyR, recenter]));
      var bgC = checkbox('Replace background', S.removeBg);
      var bgPick = swatches([['#ffffff', 'White'], ['#f2f2f2', 'Off-white'], ['#d6e6fb', 'Light blue'], ['#e8eef7', 'Pale grey-blue']], S.bg,
        function (c) { S.bg = c; schedule(); }, 'Background colour');
      var featherR = range('Edge softness', 0, 8, 1, S.feather, function (v) { return v ? v : 'Off'; });
      featherR.input.addEventListener('input', BT.debounce(function () { S.feather = +featherR.input.value; buildMask(); schedule(); }, 60));
      var bgOpts = h('div', null, [h('div.field', null, [h('span.label', { text: 'Background colour' }), bgPick]), featherR]);
      bgC.input.addEventListener('change', function () {
        S.removeBg = bgC.input.checked;
        bgOpts.classList.toggle('hidden', !S.removeBg);
        ensureSeg(); schedule();
      });
      var guideC = checkbox('Show alignment guides', true);
      guideC.input.addEventListener('change', function () { S.guides = guideC.input.checked; schedule(); });
      L.add(h('div.ai-sec', null, [h('div.field', null, [bgC]), bgOpts, h('div.field', null, [guideC])]));
      var dl = btn('btn-primary btn-lg', 'download', 'Download photo (JPG)', downloadPhoto, { disabled: true });
      L.actions.appendChild(dl);
      L.actions.appendChild(h('p.ai-hint', { style: { margin: '4px 0 0', flexBasis: '100%' }, html: 'Need full control? Use the <a href="../passport-photo-maker/">manual Passport Photo Maker</a>.' }));

      // ---- sheet + guidelines
      var sheetPrev = mk(10, 10);
      sheetPrev.className = 'ai-sheet';
      var paperSeg = seg([['4x6', PP_SHEETS['4x6'].label], ['a4', PP_SHEETS.a4.label]], S.paper, function (v) { S.paper = v; schedule(); }, 'Print sheet size', false);
      var dlSheet = btn('', 'download', 'Download print sheet (JPG)', downloadSheet, { disabled: true });
      root.appendChild(h('div.card', { style: { marginTop: '20px' } }, [
        h('div.card-title', null, [h('h3', { text: 'Print sheet' }), paperSeg]),
        h('div.preview-box.ai-sheetbox', null, [sheetPrev]),
        h('div.ai-actions', null, [dlSheet, h('span.ai-hint', { text: 'Print at 100% / “actual size” on photo paper, then cut along the grey lines.' })])
      ]));
      root.appendChild(h('div.card', null, [h('h3', { text: 'Photo guidelines', style: { fontSize: '1rem' } }), h('ul.ai-checks', { html: [
        'Look straight at the camera with a neutral expression and your mouth closed.',
        'Keep both eyes open and clearly visible; hair should not cover the eyes or face.',
        'Avoid glasses if possible; otherwise make sure there is no glare or tinted lenses.',
        'Use even, bright light with no shadows on the face or background.',
        'No hats or head coverings, except for religious reasons (the full face must still show).',
        'Always check the latest rules of the authority you are applying to.'
      ].map(function (t) { return '<li>' + BT.icon('check') + '<span>' + esc(t) + '</span></li>'; }).join('') })]));

      // ---- geometry
      function headGeometry(f) {
        var top = f.y, bot = f.y + f.h, cx = f.x + f.w / 2;
        var crown = top - 0.38 * f.h, chin = bot, tilt = 0;
        if (f.kp && f.kp.length >= 4) {
          var re = f.kp[0], le = f.kp[1], mo = f.kp[3];
          var ey = (re.y + le.y) / 2, ex = (re.x + le.x) / 2, d = mo.y - ey;
          if (d > 2) {
            chin = (chin + mo.y + 1.05 * d) / 2;
            crown = (crown + ey - 1.8 * d) / 2;
            cx = (cx + ex) / 2;
          }
          tilt = Math.atan2(le.y - re.y, le.x - re.x) * 180 / Math.PI;
          if (tilt > 90) tilt -= 180; else if (tilt < -90) tilt += 180;
        }
        return { cx: cx * wk, crown: crown * wk, chin: chin * wk, tilt: tilt };
      }
      function cropRect() {
        var headH = Math.max(10, geo.chin - geo.crown);
        var ph = headH / (S.head / 100), pw = ph * PP_W / PP_H, spare = ph - headH;
        return { x: geo.cx - pw / 2 - S.dx / 100 * pw, y: geo.crown - spare * PP_TOP - S.dy / 100 * ph, w: pw, h: ph };
      }
      function inter(r) {
        var x0 = Math.max(0, r.x), y0 = Math.max(0, r.y), x1 = Math.min(im.w, r.x + r.w), y1 = Math.min(im.h, r.y + r.h);
        return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
      }

      // ---- segmentation of the area around the crop (finer than the whole photo)
      function buildMask() {
        if (!segData) return;
        var m = segData.mask, r = S.feather * Math.max(m.w, m.h) / 1000;
        segData.maskC = maskToCanvas(shapeMask(m.data, m.w, m.h, 0.5, 0.12, r), m.w, m.h);
      }
      function covered() {
        var c = inter(cropRect());
        if (!segData || !c) return !!segData;
        var s = segData.rect;
        return c.x >= s.x - 1 && c.y >= s.y - 1 && c.x + c.w <= s.x + s.w + 1 && c.y + c.h <= s.y + s.h + 1;
      }
      function ensureSeg() {
        if (!S.removeBg || !geo || segBusy || covered()) return segBusy || Promise.resolve();
        var r = cropRect(), m = 0.3;
        var reg = inter({ x: r.x - r.w * m, y: r.y - r.h * m, w: r.w * (1 + 2 * m), h: r.h * (1 + 2 * m) });
        if (!reg) return Promise.resolve();
        var s = Math.min(1, 1024 / Math.max(reg.w, reg.h));
        var c = mk(reg.w * s, reg.h * s);
        drawHQ(c2d(c), im.canvas, reg.x, reg.y, reg.w, reg.h, 0, 0, c.width, c.height);
        segBusy = getTask('person', status).then(function (t) {
          if (!alive) return;
          if (!ready) { status.text('Replacing the background…', ''); status.progress(null); }
          return tick().then(function () { return segmentPerson(t, c); }).then(function (mask) {
            segData = { rect: reg, mask: mask };
            buildMask();
          });
        }).catch(function (e) {
          console.error(e);
          L.msgs.appendChild(notice('error', esc(friendlyError(e)) + ' The background was not replaced.'));
          S.removeBg = false; bgC.input.checked = false; bgOpts.classList.add('hidden');
        }).then(function () {
          segBusy = null;
          if (alive && ready) { schedule(); if (!covered()) ensureSeg(); }
        });
        return segBusy;
      }

      // ---- rendering
      function renderPhoto(target) {
        var r = cropRect(), W = target.width, H = target.height, s = W / r.w, x = c2d(target);
        x.save();
        x.fillStyle = S.removeBg ? S.bg : '#ffffff';
        x.fillRect(0, 0, W, H);
        var layer = mk(W, H), lx = c2d(layer), c = inter(r);
        if (c) drawHQ(lx, im.canvas, c.x, c.y, c.w, c.h, (c.x - r.x) * s, (c.y - r.y) * s, c.w * s, c.h * s);
        if (S.removeBg && segData && segData.maskC) {
          var g = segData.rect;
          lx.globalCompositeOperation = 'destination-in';
          lx.imageSmoothingEnabled = true; lx.imageSmoothingQuality = 'high';
          lx.drawImage(segData.maskC, (g.x - r.x) * s, (g.y - r.y) * s, g.w * s, g.h * s);
        }
        x.drawImage(layer, 0, 0);
        x.restore();
      }
      function renderDisplay() {
        var x = c2d(dispC);
        x.clearRect(0, 0, PP_W, PP_H);
        x.drawImage(photoC, 0, 0);
        if (!S.guides) return;
        var head = 0.755 * PP_H, crownY = (PP_H - head) * PP_TOP, chinY = crownY + head;
        x.save();
        x.strokeStyle = 'rgba(79,70,229,.85)';
        x.lineWidth = 2;
        x.setLineDash([8, 6]);
        [crownY, chinY].forEach(function (y) { x.beginPath(); x.moveTo(0, y); x.lineTo(PP_W, y); x.stroke(); });
        x.beginPath(); x.moveTo(PP_W / 2, 0); x.lineTo(PP_W / 2, PP_H); x.stroke();
        x.setLineDash([]);
        x.strokeStyle = 'rgba(255,255,255,.75)';
        x.beginPath(); x.ellipse(PP_W / 2, (crownY + chinY) / 2, head * 0.36, head / 2, 0, 0, Math.PI * 2); x.stroke();
        x.fillStyle = 'rgba(79,70,229,.95)';
        x.font = '600 15px sans-serif';
        x.fillText('Top of head', 8, crownY - 7);
        x.fillText('Chin', 8, chinY - 7);
        x.restore();
      }
      function renderSheet() {
        var sh = ppSheet(photoC, S.paper);
        var s = Math.min(1, 720 / Math.max(sh.width, sh.height));
        sheetPrev.width = Math.round(sh.width * s);
        sheetPrev.height = Math.round(sh.height * s);
        drawHQ(c2d(sheetPrev), sh, 0, 0, sh.width, sh.height, 0, 0, sheetPrev.width, sheetPrev.height);
      }
      function updChecks() {
        var r = cropRect(), c = inter(r);
        var items = [
          [faceInfo.found, faceInfo.found ? (faceInfo.count > 1 ? faceInfo.count + ' faces found — using the largest one.' : 'Face detected and centred.') : 'No face detected — positioned by hand. Adjust with the sliders.'],
          [S.head >= 70 && S.head <= 80, 'Head height ' + S.head + '% of photo (required 70–80%).'],
          [Math.abs(faceInfo.tilt) < 6, Math.abs(faceInfo.tilt) < 6 ? 'Head is level.' : 'Head looks tilted by about ' + Math.round(Math.abs(faceInfo.tilt)) + '° — retake with your head straight.'],
          [r.h >= PP_H * 0.75, r.h >= PP_H * 0.75 ? 'Resolution is good for printing.' : 'Low resolution (' + Math.round(r.h) + ' px tall crop) — the print may look soft.'],
          [!!c && c.w >= r.w - 2 && c.h >= r.h - 2 || S.removeBg, (!!c && c.w >= r.w - 2 && c.h >= r.h - 2) ? 'Photo fills the frame.' : 'Frame goes past the photo edge; filled with background colour.'],
          [S.removeBg, S.removeBg ? 'Background replaced with a plain colour.' : 'Original background kept — it must be plain and light.']
        ];
        checks.innerHTML = items.map(function (it) {
          return '<li' + (it[0] ? '' : ' class="bad"') + '>' + BT.icon(it[0] ? 'check' : 'info') + '<span>' + esc(it[1]) + '</span></li>';
        }).join('');
      }
      var raf = 0;
      function schedule() {
        if (!ready || raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          renderPhoto(photoC); renderDisplay(); renderSheet(); updChecks();
          if (S.removeBg && !covered()) ensureSeg();
        });
      }

      // ---- drag & keyboard on the preview
      var drag = null;
      box.addEventListener('pointerdown', function (e) {
        if (!ready || e.button > 0) return;
        e.preventDefault();
        drag = { x: e.clientX, y: e.clientY, dx: S.dx, dy: S.dy, w: dispC.getBoundingClientRect().width };
        box.classList.add('drag');
        try { box.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
      });
      box.addEventListener('pointermove', function (e) {
        if (!drag) return;
        var hgt = drag.w * PP_H / PP_W;
        S.dx = clamp(drag.dx + (e.clientX - drag.x) / drag.w * 100, -25, 25);
        S.dy = clamp(drag.dy + (e.clientY - drag.y) / hgt * 100, -25, 25);
        dxR.set(Math.round(S.dx * 2) / 2); dyR.set(Math.round(-S.dy * 2) / 2);
        schedule();
      });
      function endDrag() { drag = null; box.classList.remove('drag'); }
      box.addEventListener('pointerup', endDrag);
      box.addEventListener('pointercancel', endDrag);
      box.addEventListener('keydown', function (e) {
        if (!ready) return;
        var st = e.shiftKey ? 5 : 1, used = true;
        if (e.key === 'ArrowLeft') S.dx -= st;
        else if (e.key === 'ArrowRight') S.dx += st;
        else if (e.key === 'ArrowUp') S.dy -= st;
        else if (e.key === 'ArrowDown') S.dy += st;
        else if (e.key === '+' || e.key === '=') S.head = Math.min(90, S.head + 1);
        else if (e.key === '-' || e.key === '_') S.head = Math.max(60, S.head - 1);
        else used = false;
        if (!used) return;
        e.preventDefault();
        S.dx = clamp(S.dx, -25, 25); S.dy = clamp(S.dy, -25, 25);
        dxR.set(S.dx); dyR.set(-S.dy); headR.set(S.head);
        schedule();
      });

      // ---- downloads
      function downloadPhoto() {
        BT.busy(dl, function () {
          renderPhoto(photoC);
          return encode(photoC, 'jpg', '#ffffff', 0.95).then(function (b) { return jpegDpi(b, 300); })
            .then(function (b) { BT.download(b, 'passport-photo-35x45mm.jpg'); });
        }, 'Saving…');
      }
      function downloadSheet() {
        BT.busy(dlSheet, function () {
          renderPhoto(photoC);
          return encode(ppSheet(photoC, S.paper), 'jpg', '#ffffff', 0.95).then(function (b) { return jpegDpi(b, 300); })
            .then(function (b) { BT.download(b, 'passport-photos-' + S.paper + '.jpg'); });
        }, 'Saving…');
      }

      // ---- start: detect the face, then segment around it
      function largest(list) { return list.sort(function (a, b) { return b.w * b.h - a.w * a.h; })[0]; }
      c2d(dispC).drawImage(scaleTo(im.canvas, 600), 0, 0, PP_W, PP_H * Math.min(1, (im.h / im.w) * PP_W / PP_H));
      getTask('face-short', status).then(function (t) {
        status.text('Finding your face…', ''); status.progress(null);
        return tick().then(function () { return detectFaces(t, work, false); });
      }).then(function (list) {
        if (list.length) return list;
        return getTask('face-short', status).then(function (t) { return detectFaces(t, work, true); });
      }).then(function (list) {
        if (!alive) return;
        if (list.length) {
          var f = largest(list);
          geo = headGeometry(f);
          faceInfo = { found: true, count: list.length, tilt: geo.tilt };
        } else {
          geo = { cx: im.w / 2, crown: im.h * 0.15, chin: im.h * 0.15 + Math.min(im.h * 0.5, im.w * 0.6) };
          L.msgs.appendChild(notice('warn', '<strong>No face was found.</strong> Use a clear, front-facing photo, or position it by hand with the sliders. You can also use the <a href="../passport-photo-maker/">manual Passport Photo Maker</a>.'));
        }
        return ensureSeg();
      }).then(function () {
        if (!alive) return;
        status.hide();
        ready = true;
        dl.disabled = false; dlSheet.disabled = false;
        schedule();
      }).catch(function (e) {
        console.error(e);
        status.hide();
        L.msgs.appendChild(notice('error', esc(friendlyError(e)) + ' You can use the <a href="../passport-photo-maker/">manual Passport Photo Maker</a> instead.'));
      });
      return { destroy: function () { alive = false; cancelAnimationFrame(raf); } };
    });
  });

  // ===================================================== PHOTO ENHANCER
  /**
   * Pixel pipeline (self-contained so it can also run inside a Web Worker):
   * denoise → per-channel LUT (levels, white balance, brightness, contrast)
   * → vibrance/saturation → unsharp-mask sharpening. Mutates/returns RGBA data.
   */
  function enhanceKernel(d, w, hh, p) {
    var n = w * hh, i;
    if (p.denoise === 'median') d = median3(d);
    else if (p.denoise === 'light' || p.denoise === 'strong') d = bilateral(d, p.dnR || 1, p.sigma || 18);
    if (p.lut) {
      var L = p.lut;
      for (i = 0; i < d.length; i += 4) { d[i] = L[d[i]]; d[i + 1] = L[256 + d[i + 1]]; d[i + 2] = L[512 + d[i + 2]]; }
    }
    if (p.vib || p.sat) {
      for (i = 0; i < d.length; i += 4) {
        var r = d[i], g = d[i + 1], b = d[i + 2];
        var mx = r > g ? (r > b ? r : b) : (g > b ? g : b), mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
        var s = (mx - mn) / 255, l = 0.299 * r + 0.587 * g + 0.114 * b;
        var k = 1 + p.sat + p.vib * (1 - s) * (1 - s);
        if (k < 0) k = 0;
        d[i] = l + (r - l) * k; d[i + 1] = l + (g - l) * k; d[i + 2] = l + (b - l) * k;
      }
    }
    if (p.sharpen > 0) sharpen(p.sharpen, p.sharpR || 1);
    return d;

    function luma(src) {
      var Y = new Float32Array(n);
      for (var q = 0, o = 0; q < n; q++, o += 4) Y[q] = 0.299 * src[o] + 0.587 * src[o + 1] + 0.114 * src[o + 2];
      return Y;
    }
    function blur(a, r) {
      var t = new Float32Array(n), x, y, acc, row, k2, inv = 1 / (2 * r + 1);
      for (var pass = 0; pass < 2; pass++) {
        for (y = 0; y < hh; y++) {
          row = y * w; acc = 0;
          for (k2 = -r; k2 <= r; k2++) acc += a[row + (k2 < 0 ? 0 : k2 > w - 1 ? w - 1 : k2)];
          for (x = 0; x < w; x++) {
            t[row + x] = acc * inv;
            acc += a[row + (x + r + 1 < w ? x + r + 1 : w - 1)] - a[row + (x - r > 0 ? x - r : 0)];
          }
        }
        for (x = 0; x < w; x++) {
          acc = 0;
          for (k2 = -r; k2 <= r; k2++) acc += t[(k2 < 0 ? 0 : k2 > hh - 1 ? hh - 1 : k2) * w + x];
          for (y = 0; y < hh; y++) {
            a[y * w + x] = acc * inv;
            acc += t[(y + r + 1 < hh ? y + r + 1 : hh - 1) * w + x] - t[(y - r > 0 ? y - r : 0) * w + x];
          }
        }
      }
      return a;
    }
    function sharpen(amount, r) {
      var Y = luma(d), B = blur(new Float32Array(Y), r);
      for (var q = 0, o = 0; q < n; q++, o += 4) {
        var diff = Y[q] - B[q];
        if (diff > -1.5 && diff < 1.5) continue;
        var add = amount * diff;
        d[o] += add; d[o + 1] += add; d[o + 2] += add;
      }
    }
    function median3(src) {
      var out = new Uint8ClampedArray(src.length), m = new Int32Array(9), x, y, c, a, j, v;
      for (y = 0; y < hh; y++) {
        var r0 = (y > 0 ? y - 1 : 0) * w, r1 = y * w, r2 = (y < hh - 1 ? y + 1 : y) * w;
        for (x = 0; x < w; x++) {
          var x0 = x > 0 ? x - 1 : 0, x2 = x < w - 1 ? x + 1 : x, o = (r1 + x) * 4;
          for (c = 0; c < 3; c++) {
            m[0] = src[(r0 + x0) * 4 + c]; m[1] = src[(r0 + x) * 4 + c]; m[2] = src[(r0 + x2) * 4 + c];
            m[3] = src[(r1 + x0) * 4 + c]; m[4] = src[o + c]; m[5] = src[(r1 + x2) * 4 + c];
            m[6] = src[(r2 + x0) * 4 + c]; m[7] = src[(r2 + x) * 4 + c]; m[8] = src[(r2 + x2) * 4 + c];
            for (a = 1; a < 9; a++) { v = m[a]; j = a - 1; while (j >= 0 && m[j] > v) { m[j + 1] = m[j]; j--; } m[j + 1] = v; }
            out[o + c] = m[4];
          }
          out[o + 3] = src[o + 3];
        }
      }
      return out;
    }
    function bilateral(src, rad, sigma) {
      var Y = luma(src), out = new Uint8ClampedArray(src.length), rw = new Float32Array(256), sw = [], x, y, k3;
      for (k3 = 0; k3 < 256; k3++) rw[k3] = Math.exp(-(k3 * k3) / (2 * sigma * sigma));
      var ss = rad * 0.8 + 0.4;
      for (var dy = -rad; dy <= rad; dy++) for (var dx = -rad; dx <= rad; dx++) sw.push(Math.exp(-(dx * dx + dy * dy) / (2 * ss * ss)));
      for (y = 0; y < hh; y++) {
        for (x = 0; x < w; x++) {
          var c0 = y * w + x, yc = Y[c0], ws = 0, sr = 0, sg = 0, sb = 0, idx = 0;
          for (var oy = -rad; oy <= rad; oy++) {
            var yy = y + oy; yy = yy < 0 ? 0 : yy >= hh ? hh - 1 : yy;
            for (var ox = -rad; ox <= rad; ox++) {
              var xx = x + ox; xx = xx < 0 ? 0 : xx >= w ? w - 1 : xx;
              var q = yy * w + xx, dl = Y[q] - yc; if (dl < 0) dl = -dl;
              var wt = sw[idx++] * rw[dl > 255 ? 255 : dl | 0], o2 = q * 4;
              ws += wt; sr += src[o2] * wt; sg += src[o2 + 1] * wt; sb += src[o2 + 2] * wt;
            }
          }
          var o3 = c0 * 4;
          out[o3] = sr / ws; out[o3 + 1] = sg / ws; out[o3 + 2] = sb / ws; out[o3 + 3] = src[o3 + 3];
        }
      }
      return out;
    }
  }

  function imgStats(d) {
    var H = [new Float64Array(256), new Float64Array(256), new Float64Array(256)], n = 0;
    for (var i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 8) continue;
      H[0][d[i]]++; H[1][d[i + 1]]++; H[2][d[i + 2]]++; n++;
    }
    return { hist: H, n: n || 1 };
  }
  function pct(hist, n, p) {
    var t = n * p, acc = 0;
    for (var v = 0; v < 256; v++) { acc += hist[v]; if (acc >= t) return v; }
    return 255;
  }
  /** Levels, white balance, brightness and contrast folded into one 3×256 lookup table. */
  function enhanceLut(st, S) {
    var lo = [0, 0, 0], hi = [255, 255, 255], c, v;
    for (c = 0; c < 3; c++) {
      if (S.levels) {
        lo[c] = pct(st.hist[c], st.n, 0.005);
        hi[c] = pct(st.hist[c], st.n, 0.995);
        if (hi[c] - lo[c] < 48) { var mid = (hi[c] + lo[c]) / 2; lo[c] = Math.max(0, mid - 24); hi[c] = Math.min(255, mid + 24); }
      }
    }
    var mean = [0, 0, 0];
    for (c = 0; c < 3; c++) {
      var s = 0;
      for (v = 0; v < 256; v++) s += st.hist[c][v] * clamp((v - lo[c]) / (hi[c] - lo[c]), 0, 1);
      mean[c] = s / st.n;
    }
    var avg = (mean[0] + mean[1] + mean[2]) / 3, gain = [1, 1, 1];
    for (c = 0; c < 3; c++) {
      var g = mean[c] > 0.02 ? avg / mean[c] : 1;
      gain[c] = clamp(1 + (g - 1) * S.wb / 100, 0.6, 1.6);
    }
    var wm = S.warmth / 100;
    gain[0] *= 1 + 0.12 * wm; gain[2] *= 1 - 0.12 * wm;
    var gamma = Math.pow(2, -S.bright / 50), a = S.contrast / 100 * 0.7, lut = new Uint8Array(768);
    for (c = 0; c < 3; c++) for (v = 0; v < 256; v++) {
      var x = clamp(clamp((v - lo[c]) / (hi[c] - lo[c]), 0, 1) * gain[c], 0, 1);
      x = Math.pow(x, gamma);
      x = x + a * (x * x * (3 - 2 * x) - x);
      lut[c * 256 + v] = Math.round(clamp(x, 0, 1) * 255);
    }
    return { lut: lut, mean: mean, gain: gain };
  }
  /** Brightness boost (0..40) that lifts a dark photo's mid-tones towards ~0.46. */
  function autoBright(st, S) {
    var r = enhanceLut(st, Object.assign({}, S, { bright: 0, contrast: 0 }));
    var Lm = 0.299 * r.mean[0] * r.gain[0] + 0.587 * r.mean[1] * r.gain[1] + 0.114 * r.mean[2] * r.gain[2];
    if (Lm >= 0.42 || Lm <= 0.01) return 0;
    var g = Math.log(0.46) / Math.log(Lm);
    return Math.round(clamp(-50 * Math.log(g) / Math.LN2, 0, 40));
  }

  var kernelUrl = null;
  /** Run the kernel; images over 4 MP go to a Web Worker so the page stays responsive. */
  function runKernel(data, w, hh, p) {
    if (w * hh <= 4e6 || !window.Worker || !window.Blob) return tick(0).then(function () { return enhanceKernel(data, w, hh, p); });
    return new Promise(function (res, rej) {
      var wk;
      try {
        if (!kernelUrl) kernelUrl = URL.createObjectURL(new Blob(['var enhanceKernel=' + enhanceKernel.toString() + ';\n' +
          'onmessage=function(e){var m=e.data;try{var o=enhanceKernel(m.d,m.w,m.h,m.p);postMessage({d:o},[o.buffer]);}catch(err){postMessage({error:String(err&&err.message||err)});}};'], { type: 'text/javascript' }));
        wk = new Worker(kernelUrl);
      } catch (e) { res(enhanceKernel(data, w, hh, p)); return; }
      wk.onmessage = function (e) { wk.terminate(); if (e.data.error) rej(new Error(e.data.error)); else res(e.data.d); };
      wk.onerror = function (e) { wk.terminate(); rej(new Error((e && e.message) || 'Background processing failed')); };
      wk.postMessage({ d: data, w: w, h: hh, p: p }, [data.buffer]);
    });
  }

  var ENH_PRESETS = {
    auto: { levels: true, wb: 60, warmth: 0, bright: 'auto', contrast: 25, vib: 25, sat: 0, denoise: 'light', sharp: 35 },
    old: { levels: true, wb: 90, warmth: 6, bright: 'auto', contrast: 35, vib: 10, sat: 0, denoise: 'median', sharp: 30 },
    vivid: { levels: true, wb: 40, warmth: 0, bright: 'auto', contrast: 40, vib: 55, sat: 10, denoise: 'off', sharp: 45 },
    subtle: { levels: true, wb: 30, warmth: 0, bright: 0, contrast: 12, vib: 12, sat: 0, denoise: 'off', sharp: 20 }
  };

  register('ai-photo-enhancer', function (root, ctx) {
    singleTool(root, ctx, {
      title: 'Choose a photo to enhance', icon: 'wand-sparkles',
      hint: 'or drag and drop it here · dull, dark, noisy or old scanned photos',
      model: 'No download needed: enhancement is instant. The optional AI 2× upscale downloads a 4 MB model once.'
    }, function (im, api) {
      var L = editorLayout(root, im, api.reset, 'Enhance');
      var prev = scaleTo(im.canvas, 1200), PW = prev.width, PH = prev.height;
      var prevData = c2d(prev, true).getImageData(0, 0, PW, PH);
      var st = imgStats(prevData.data);
      var long = Math.max(im.w, im.h), fullK = long / Math.max(PW, PH);
      var S = {}, preset = 'auto', alive = true, ctrl = null;
      var outC = mk(PW, PH), cmp = compareWidget(outC, copyCanvas(prev), { after: 'Enhanced' });
      var status = statusBox();
      L.stage.appendChild(cmp.el);
      L.stage.appendChild(status.el);
      L.under.textContent = 'Drag across the photo to compare before and after.';

      var presetSeg = seg([['auto', 'Auto'], ['old', 'Old photo'], ['vivid', 'Vivid'], ['subtle', 'Subtle']], preset, applyPreset, 'Preset');
      L.add(h('div.field', null, [h('span.label', { text: 'Preset' }), presetSeg,
        h('span.hint', { text: '“Old photo” removes dust and noise, fixes fading and colour casts.' })]));
      var levelsC = checkbox('Auto levels (stretch light & colour)', true);
      var brightR = range('Brightness', -50, 50, 1, 0, function (v) { return (v > 0 ? '+' : '') + v; });
      var contrastR = range('Contrast', 0, 100, 1, 25);
      var wbR = range('Auto white balance', 0, 100, 1, 60, function (v) { return v + '%'; });
      var warmR = range('Warmth', -50, 50, 1, 0, function (v) { return (v > 0 ? '+' : '') + v; });
      var vibR = range('Vibrance', -50, 100, 1, 25);
      var satR = range('Saturation', -100, 100, 1, 0, function (v) { return (v > 0 ? '+' : '') + v; });
      var dnSel = select([['off', 'Off'], ['light', 'Light (keeps edges)'], ['strong', 'Strong (keeps edges)'], ['median', 'Median 3×3 (old scans, dust)']], 'light');
      var sharpR = range('Sharpen', 0, 100, 1, 35);
      var upC = checkbox('Upscale 2× with AI', false);
      var upHint = h('span.hint');
      if (long > UP_LIMIT[2]) {
        upC.input.disabled = true;
        upHint.textContent = 'Available for photos up to ' + UP_LIMIT[2] + ' px. Your photo is already ' + long + ' px.';
      } else upHint.textContent = 'Doubles the size with an AI model (4 MB download, takes a little while).';
      var fmtSeg = seg([['jpg', 'JPG'], ['png', 'PNG']], im.type === 'image/png' ? 'png' : 'jpg', null, 'File format');
      L.add(h('div.ai-sec', null, [h('h3', { text: 'Light & colour' }), h('div.field', null, [levelsC]), brightR, contrastR, wbR, warmR, vibR, satR]));
      L.add(h('div.ai-sec', null, [h('h3', { text: 'Detail' }), field('Noise reduction', dnSel), sharpR]));
      L.add(h('div.ai-sec', null, [h('div.field', null, [upC, upHint]), h('div.field', null, [h('span.label', { text: 'Save as' }), fmtSeg])]));
      var dl = btn('btn-primary btn-lg', 'download', 'Download', download);
      var resetB = btn('', 'rotate-ccw', 'Reset to Auto', function () { presetSeg.set('auto'); applyPreset('auto'); });
      L.actions.appendChild(dl);
      L.actions.appendChild(resetB);

      function readUI() {
        S = {
          levels: levelsC.input.checked, bright: +brightR.input.value, contrast: +contrastR.input.value, wb: +wbR.input.value,
          warmth: +warmR.input.value, vib: +vibR.input.value, sat: +satR.input.value, denoise: dnSel.value, sharp: +sharpR.input.value
        };
      }
      function applyPreset(k) {
        preset = k;
        var P = Object.assign({}, ENH_PRESETS[k]);
        if (P.bright === 'auto') P.bright = autoBright(st, P);
        levelsC.input.checked = P.levels;
        brightR.set(P.bright); contrastR.set(P.contrast); wbR.set(P.wb); warmR.set(P.warmth);
        vibR.set(P.vib); satR.set(P.sat); dnSel.value = P.denoise; sharpR.set(P.sharp);
        update();
      }
      function params(scale) {
        var p = enhanceLut(st, S);
        return {
          lut: p.lut, denoise: S.denoise, dnR: Math.min(2, Math.max(1, Math.round(scale * (S.denoise === 'strong' ? 1.5 : 0.7)))),
          sigma: S.denoise === 'strong' ? 30 : 16, vib: S.vib / 100, sat: S.sat / 100,
          sharpen: S.sharp / 100 * 1.4, sharpR: Math.min(3, Math.max(1, Math.round(scale)))
        };
      }
      var seq = 0;
      function update() {
        readUI();
        var my = ++seq;
        var data = new Uint8ClampedArray(prevData.data);
        runKernel(data, PW, PH, params(1)).then(function (out) {
          if (my !== seq || !alive) return;
          c2d(outC).putImageData(new ImageData(out, PW, PH), 0, 0);
        }).catch(function (e) { console.error(e); BT.toast(e.message || 'Could not process the photo', 'error'); });
      }
      var debounced = BT.debounce(update, 70);
      L.panel.addEventListener('input', function (e) {
        if (e.target.type === 'range') { presetSeg.set(''); debounced(); }
      });
      L.panel.addEventListener('change', function (e) {
        if (e.target === levelsC.input || e.target === dnSel) { presetSeg.set(''); update(); }
      });

      function download() {
        if (ctrl) return;
        readUI();
        var useAI = upC.input.checked && !upC.input.disabled;
        dl.disabled = true;
        L.stage.classList.add('ai-busy');
        status.text(im.w * im.h > 4e6 ? 'Enhancing the full-size photo (in the background)…' : 'Enhancing the full-size photo…', '');
        status.progress(null);
        var full = c2d(im.canvas, true).getImageData(0, 0, im.w, im.h);
        runKernel(full.data, im.w, im.h, params(fullK)).then(function (out) {
          var c = mk(im.w, im.h);
          c2d(c).putImageData(new ImageData(out, im.w, im.h), 0, 0);
          if (!useAI) return c;
          ctrl = window.AbortController ? new AbortController() : { signal: null, abort: function () {} };
          status.cancellable(function () { ctrl.abort(); });
          return aiUpscale(c, 2, { ui: status, signal: ctrl.signal, progress: function (p) { status.progress(p); } }).then(function (r) { return r.canvas; });
        }).then(function (c) {
          return encode(c, fmtSeg.value, '#ffffff', 0.93).then(function (b) {
            BT.download(b, outName(im.name, useAI ? '-enhanced-2x' : '-enhanced', fmtSeg.value));
            BT.toast('Saved ' + c.width + ' × ' + c.height + ' ' + fmtSeg.value.toUpperCase());
          });
        }).catch(function (e) {
          if (isAbort(e)) { BT.toast('Upscaling cancelled'); return; }
          console.error(e);
          BT.toast(friendlyError(e), 'error');
        }).then(function () {
          ctrl = null;
          if (!alive) return;
          status.hide();
          dl.disabled = false;
          L.stage.classList.remove('ai-busy');
        });
      }
      applyPreset('auto');
      return { destroy: function () { alive = false; seq++; if (ctrl) ctrl.abort(); } };
    });
  });

  // core.js boots on DOMContentLoaded, after deferred scripts like this one;
  // if it somehow booted first and showed its "failed to load" notice, start our tool now.
  (function rescue() {
    var root = doc.getElementById('tool-root');
    if (!root) return;
    var id = root.getAttribute('data-tool'), impl = IMPLS[id];
    if (!impl || root.querySelector('.loading') || !root.querySelector('.notice.error')) return;
    var tool = BT.tool(id);
    root.innerHTML = '';
    root.setAttribute('data-mounted', '1');
    try { impl(root, { tool: tool, category: tool && BT.category(tool.cat) }); } catch (e) { console.error(e); }
  })();
})();
