/*
 * BISCS Tools — Design Studio.
 * Collage maker, photo art effects, Instagram grid & post/story designer,
 * logo maker and device mockup generator. Everything is drawn locally with
 * <canvas>/SVG; photos never leave the device and no remote assets are used.
 */
(function () {
  'use strict';
  var BT = window.BT;
  var doc = document;
  var IMPLS = {};
  function register(id, fn) { IMPLS[id] = fn; BT.impl(id, fn); }

  // =================================================================== CSS
  var CSS = [
    '.dsn-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 14px;margin-bottom:16px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);box-shadow:var(--shadow-sm)}',
    '.dsn-head .dsn-ic{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#db2777,#9d174d);flex:none}',
    '.dsn-head .dsn-txt{flex:1;min-width:0}',
    '.dsn-head .dsn-name{font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.dsn-head .dsn-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:3px}',
    '.dsn-stage{position:relative;display:flex;align-items:center;justify-content:center;min-height:240px;padding:14px;border:1px solid var(--border);border-radius:var(--radius);background:repeating-conic-gradient(var(--surface-2) 0% 25%,var(--surface) 0% 50%) 50%/20px 20px;overflow:hidden}',
    '.dsn-stage canvas.dsn-view{display:block;touch-action:none;box-shadow:0 10px 34px -14px rgba(0,0,0,.45);border-radius:4px;max-width:100%}',
    '.dsn-stage canvas.dsn-view:focus-visible{outline:3px solid var(--brand);outline-offset:3px}',
    '.dsn-stage.dark{background:#0d1020}',
    '.dsn-panel h3{font-size:1rem;margin:0 0 12px}',
    '@media(min-width:900px){.dsn-left{position:sticky;top:84px;align-self:start}}',
    '.dsn-panel .field:last-child{margin-bottom:0}',
    '.dsn-sec{padding-top:14px;margin-top:14px;border-top:1px solid var(--border)}',
    '.dsn-sec>h4{font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);margin:0 0 10px}',
    '.dsn-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}',
    '.dsn-actions .btn-primary{flex:1 1 170px}',
    '.dsn-range{display:flex;align-items:center;gap:10px}',
    '.dsn-range input[type=range]{flex:1;min-width:0}',
    '.dsn-val{min-width:46px;text-align:right;font-variant-numeric:tabular-nums;font-weight:600;font-size:.86rem;color:var(--text-2)}',
    '.dsn-seg{display:flex;width:100%}.dsn-seg button{flex:1 1 auto;padding:7px 10px}',
    '.dsn-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
    '.dsn-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}',
    '.dsn-colors{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}',
    '.dsn-colors .field{margin-bottom:0}',
    '.dsn-under{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;margin-top:10px;font-size:.84rem;color:var(--text-3);text-align:center}',
    '.dsn-paste{margin-top:10px;text-align:center;font-size:.84rem;color:var(--text-3)}',
    '.dsn-tabs{margin-bottom:16px}',
    // pickers
    '.dsn-pick{display:grid;grid-template-columns:repeat(auto-fill,minmax(58px,1fr));gap:8px}',
    '.dsn-pick button{position:relative;border:2px solid var(--border);background:var(--surface);border-radius:10px;padding:5px;cursor:pointer;line-height:0;color:var(--text-3)}',
    '.dsn-pick button svg{width:100%;height:auto;display:block}',
    '.dsn-pick button:hover{border-color:var(--border-strong)}',
    '.dsn-pick button[aria-pressed=true]{border-color:var(--brand);background:var(--brand-soft);color:var(--brand)}',
    '.dsn-pick button.dim{opacity:.45}',
    '.dsn-pick button .n{position:absolute;right:3px;bottom:3px;font:700 10px/1 var(--font);background:var(--surface);border-radius:5px;padding:2px 4px;color:var(--text-2)}',
    '.dsn-chips{display:flex;flex-wrap:wrap;gap:6px}',
    '.dsn-chips .chip{padding:6px 11px;font-size:.82rem}',
    '.dsn-photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:8px}',
    '.dsn-photo{position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;border:1px solid var(--border);background:var(--surface-2)}',
    '.dsn-photo img{width:100%;height:100%;object-fit:cover;display:block}',
    '.dsn-photo button{position:absolute;top:3px;right:3px;width:24px;height:24px;border-radius:7px;border:0;background:rgba(0,0,0,.6);color:#fff;display:grid;place-items:center;cursor:pointer;padding:0}',
    '.dsn-photo button svg{width:14px;height:14px}',
    '.dsn-photo .n{position:absolute;left:4px;bottom:4px;font:700 11px/1 var(--font);color:#fff;background:rgba(0,0,0,.55);border-radius:5px;padding:3px 5px}',
    '.dsn-add{aspect-ratio:1;border-radius:10px;border:2px dashed var(--border-strong);display:grid;place-items:center;color:var(--text-3);cursor:pointer;position:relative;background:var(--surface)}',
    '.dsn-add:hover{border-color:var(--brand);color:var(--brand)}',
    '.dsn-add input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%}',
    '.dsn-list{display:flex;flex-direction:column;gap:6px}',
    '.dsn-item{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 10px;border:1px solid var(--border);border-radius:10px;background:var(--surface);font-size:.88rem}',
    '.dsn-item.on{border-color:var(--brand);background:var(--brand-soft)}',
    '.dsn-item .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;background:none;border:0;font:inherit;color:inherit;text-align:left;padding:4px 0}',
    '.dsn-item .ib{width:30px;height:30px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text-2);display:grid;place-items:center;cursor:pointer;padding:0;flex:none}',
    '.dsn-item .ib svg{width:15px;height:15px}',
    '.dsn-item .ib:hover{color:var(--text);border-color:var(--border-strong)}',
    // art effects
    '.dsn-fx{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}',
    '.dsn-fx button{border:2px solid var(--border);background:var(--surface);border-radius:12px;padding:4px 4px 6px;cursor:pointer;font:600 .76rem var(--font);color:var(--text-2);display:flex;flex-direction:column;gap:5px;align-items:center}',
    '.dsn-fx button canvas{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block;background:var(--surface-2)}',
    '.dsn-fx button[aria-pressed=true]{border-color:var(--brand);color:var(--brand);background:var(--brand-soft)}',
    '.dsn-compare{position:relative;display:inline-block;max-width:100%;line-height:0;user-select:none;touch-action:none}',
    '.dsn-compare canvas{display:block;max-width:100%;max-height:min(64vh,600px);height:auto}',
    '.dsn-compare .dsn-after{position:absolute;inset:0;width:100%;height:100%;clip-path:inset(0 0 0 var(--pos,50%))}',
    '.dsn-compare .dsn-bar{position:absolute;top:0;bottom:0;left:var(--pos,50%);width:2px;margin-left:-1px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.25);pointer-events:none}',
    '.dsn-compare .dsn-knob{position:absolute;top:50%;left:var(--pos,50%);width:38px;height:38px;margin:-19px 0 0 -19px;border-radius:50%;background:#fff;color:#111;display:grid;place-items:center;box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:none}',
    '.dsn-compare .dsn-tag{position:absolute;top:10px;padding:3px 8px;border-radius:6px;background:rgba(0,0,0,.6);color:#fff;font:600 11px/1.4 var(--font);pointer-events:none}',
    '.dsn-compare input[type=range]{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:ew-resize;margin:0}',
    '.dsn-compare:focus-within .dsn-knob{box-shadow:0 0 0 3px var(--brand),0 4px 14px rgba(0,0,0,.35)}',
    '.dsn-busy{position:absolute;right:12px;top:12px;display:none;align-items:center;gap:8px;padding:6px 10px;border-radius:9px;background:rgba(0,0,0,.65);color:#fff;font-size:.8rem;font-weight:600;z-index:3}',
    '.dsn-busy.on{display:flex}',
    // instagram profile mock
    '.dsn-ig{max-width:380px;margin:0 auto;background:#fff;color:#111;border-radius:22px;border:1px solid #e5e7eb;box-shadow:0 18px 40px -22px rgba(0,0,0,.45);overflow:hidden;font-family:var(--font)}',
    '.dsn-ig .top{display:flex;align-items:center;gap:14px;padding:16px}',
    '.dsn-ig .av{width:62px;height:62px;border-radius:50%;background:conic-gradient(#f59e0b,#ec4899,#8b5cf6,#f59e0b);padding:3px;flex:none}',
    '.dsn-ig .av i{display:block;width:100%;height:100%;border-radius:50%;background:#e5e7eb;border:3px solid #fff}',
    '.dsn-ig .st{display:flex;flex:1;justify-content:space-around;text-align:center;font-size:.78rem;color:#555}',
    '.dsn-ig .st b{display:block;font-size:.98rem;color:#111}',
    '.dsn-ig .bio{padding:0 16px 12px;font-size:.8rem}.dsn-ig .bio b{display:block;font-size:.86rem}',
    '.dsn-ig .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;background:#fff}',
    '.dsn-ig .grid canvas{width:100%;height:auto;display:block;background:#f3f4f6}',
    '.dsn-ig .grid .old{background:linear-gradient(135deg,#e5e7eb,#d1d5db)}',
    // logo maker
    '.dsn-prev3{display:grid;gap:12px;grid-template-columns:1fr}',
    '@media(min-width:640px){.dsn-prev3{grid-template-columns:repeat(2,minmax(0,1fr))}.dsn-prev3 .wide{grid-column:1/-1}}',
    '.dsn-lp{border-radius:var(--radius);border:1px solid var(--border);display:grid;place-items:center;padding:22px;min-height:150px;overflow:hidden}',
    '.dsn-lp svg{max-width:100%;height:auto;max-height:200px;display:block}',
    '.dsn-lp.light{background:#ffffff}.dsn-lp.dark{background:#0f1222;border-color:#262c40}',
    '.dsn-lp.wide{min-height:220px;background:radial-gradient(500px 220px at 30% 0%,#ffffff 0%,#eef0f7 70%)}',
    '.dsn-lp .lbl{justify-self:start;align-self:start;font:700 10px/1 var(--font);letter-spacing:.06em;text-transform:uppercase;padding:4px 7px;border-radius:6px;background:rgba(127,127,127,.15);color:#8a90a6;margin:-10px 0 8px -8px}',
    '.dsn-bcard{width:min(100%,380px);aspect-ratio:1.75;background:#fff;border-radius:12px;box-shadow:0 22px 44px -20px rgba(0,0,0,.45),0 2px 6px rgba(0,0,0,.08);display:grid;grid-template-columns:1fr;align-content:space-between;padding:20px 22px;color:#1f2433;transform:perspective(900px) rotateX(8deg) rotateZ(-2deg)}',
    '.dsn-bcard .lg svg{max-height:70px;max-width:75%;height:auto;display:block}',
    '.dsn-bcard .ct{font:500 11px/1.5 var(--font);color:#5b6275;text-align:right}.dsn-bcard .ct b{display:block;color:#1f2433;font-size:13px}',
    '.dsn-vars{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}',
    '.dsn-vars button{border:2px solid var(--border);border-radius:12px;padding:12px;cursor:pointer;display:grid;place-items:center;min-height:110px;background:#fff}',
    '.dsn-vars button.dk{background:#11142a}',
    '.dsn-vars button:hover{border-color:var(--brand);box-shadow:var(--shadow)}',
    '.dsn-vars button svg{max-width:100%;max-height:90px;height:auto;display:block}',
    '.dsn-icons{display:grid;grid-template-columns:repeat(auto-fill,minmax(42px,1fr));gap:6px;max-height:228px;overflow-y:auto;padding:2px}',
    '.dsn-icons button{height:42px;border-radius:9px;border:1px solid var(--border);background:var(--surface);color:var(--text-2);display:grid;place-items:center;cursor:pointer;padding:0}',
    '.dsn-icons button svg{width:20px;height:20px}',
    '.dsn-icons button[aria-pressed=true]{border-color:var(--brand);background:var(--brand-soft);color:var(--brand)}',
    '.dsn-pal{display:flex;flex-wrap:wrap;gap:8px}',
    '.dsn-pal button{display:flex;border-radius:9px;overflow:hidden;border:2px solid var(--border);padding:0;cursor:pointer;height:30px;width:58px}',
    '.dsn-pal button i{flex:1;display:block}',
    '.dsn-pal button[aria-pressed=true]{border-color:var(--brand)}',
    '.dsn-dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}',
    '.dsn-dl .btn{white-space:normal;height:auto;min-height:42px;padding:8px 12px;line-height:1.25;text-align:center}',
    '@media(max-width:480px){.dsn-stage{padding:8px}.dsn-pick{grid-template-columns:repeat(auto-fill,minmax(50px,1fr))}}'
  ].join('\n');

  function injectCSS() {
    if (doc.getElementById('dsn-style')) return;
    var s = doc.createElement('style');
    s.id = 'dsn-style';
    s.textContent = CSS;
    doc.head.appendChild(s);
  }

  // ================================================================ Helpers
  var h = BT.h, esc = BT.esc;
  var uid = 0;
  function nid(p) { uid++; return 'dsn-' + (p || 'f') + uid; }
  function mk(w, hh) {
    var c = doc.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(hh));
    return c;
  }
  function c2d(c) { return c.getContext('2d'); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function rad(d) { return d * Math.PI / 180; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hashStr(s) {
    var x = 2166136261;
    for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
    return x >>> 0;
  }
  function rng(seed) {
    var a = seed >>> 0 || 1;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hexToRgb(hex) {
    var m = String(hex || '').replace('#', '');
    if (m.length === 3) m = m[0] + m[0] + m[1] + m[1] + m[2] + m[2];
    var n = parseInt(m, 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (v) { v = clamp(Math.round(v), 0, 255); return (v < 16 ? '0' : '') + v.toString(16); }).join('');
  }
  function luma(hex) { var c = hexToRgb(hex); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }
  function mixHex(a, b, t) {
    var x = hexToRgb(a), y = hexToRgb(b);
    return rgbToHex(lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t));
  }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'design'; }

  var MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  function flatten(canvas, color) {
    var c = mk(canvas.width, canvas.height), x = c2d(c);
    x.fillStyle = color || '#ffffff';
    x.fillRect(0, 0, c.width, c.height);
    x.drawImage(canvas, 0, 0);
    return c;
  }
  /** Encode a canvas; JPEG gets a white background first. Resolves {blob, ext}. */
  function encode(canvas, mime, quality) {
    mime = mime || 'image/png';
    var src = mime === 'image/jpeg' ? flatten(canvas) : canvas;
    return BT.canvasToBlob(src, mime, mime === 'image/png' ? undefined : (quality || 0.92)).then(function (blob) {
      if (!blob) throw new Error('This image is too large for your browser to encode. Try a smaller size.');
      return { blob: blob, ext: MIME_EXT[blob.type] || (mime === 'image/jpeg' ? 'jpg' : 'png') };
    });
  }

  /** Decode a File into a canvas (EXIF orientation applied), long side capped at max. */
  function decode(file, max) {
    max = max || 4096;
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
      var ow = w, oh = hh, s = Math.min(1, max / Math.max(w, hh));
      var c = mk(w * s, hh * s);
      var x = c2d(c);
      x.imageSmoothingQuality = 'high';
      x.drawImage(src, 0, 0, c.width, c.height);
      if (src.close) src.close();
      return { canvas: c, w: c.width, h: c.height, ow: ow, oh: oh, name: file.name, size: file.size, type: file.type };
    });
  }

  /** Small object URL thumbnail (caller revokes). */
  function thumbURL(canvas, px) {
    var s = Math.min(1, (px || 160) / Math.max(canvas.width, canvas.height));
    var t = mk(canvas.width * s, canvas.height * s);
    var x = c2d(t);
    x.imageSmoothingQuality = 'high';
    x.drawImage(canvas, 0, 0, t.width, t.height);
    return t.toDataURL('image/jpeg', 0.8);
  }

  /** Draw src covering (or containing) the box, with zoom and pan (-1..1). */
  function drawFit(ctx, src, x, y, w, hh, mode, zoom, ox, oy, anchorTop) {
    var sw = src.width, sh = src.height;
    if (!sw || !sh || w <= 0 || hh <= 0) return;
    var s = mode === 'contain' ? Math.min(w / sw, hh / sh) : Math.max(w / sw, hh / sh);
    s *= zoom || 1;
    var dw = sw * s, dh = sh * s;
    var dx = x + (w - dw) / 2 + (ox || 0) * Math.abs(dw - w) / 2;
    var dy = anchorTop && dh > hh ? y : y + (hh - dh) / 2 + (oy || 0) * Math.abs(dh - hh) / 2;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, dx, dy, dw, dh);
  }

  function rrect(ctx, x, y, w, hh, r) {
    r = Math.max(0, Math.min(r || 0, w / 2, hh / 2));
    ctx.beginPath();
    if (!r) { ctx.rect(x, y, w, hh); return; }
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + hh, r);
    ctx.arcTo(x + w, y + hh, x, y + hh, r);
    ctx.arcTo(x, y + hh, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /** Background fill: {type:'solid'|'linear'|'radial', c1, c2, angle} */
  function paintBg(ctx, w, hh, bg) {
    if (!bg || bg.type === 'none') return;
    if (bg.type === 'solid') { ctx.fillStyle = bg.c1; ctx.fillRect(0, 0, w, hh); return; }
    var g;
    if (bg.type === 'radial') {
      g = ctx.createRadialGradient(w * 0.5, hh * 0.38, 0, w * 0.5, hh * 0.5, Math.max(w, hh) * 0.75);
    } else {
      var a = rad(bg.angle == null ? 135 : bg.angle), cx = w / 2, cy = hh / 2;
      var len = Math.abs(w * Math.sin(a)) / 2 + Math.abs(hh * Math.cos(a)) / 2;
      var dx = Math.sin(a) * len, dy = -Math.cos(a) * len;
      g = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    }
    g.addColorStop(0, bg.c1);
    g.addColorStop(1, bg.c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, hh);
  }

  /** Word-wrap text to lines no wider than maxW (ctx font must be set). */
  function wrapLines(ctx, text, maxW) {
    var out = [];
    String(text || '').split('\n').forEach(function (para) {
      var words = para.split(/\s+/).filter(Boolean), line = '';
      if (!words.length) { out.push(''); return; }
      words.forEach(function (w) {
        var t = line ? line + ' ' + w : w;
        if (line && ctx.measureText(t).width > maxW) { out.push(line); line = w; } else line = t;
      });
      out.push(line);
    });
    return out;
  }

  // ---------------------------------------------------------------- Fonts
  var FONTS = [
    { id: 'inter', name: 'Inter', css: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
    { id: 'system', name: 'System sans', css: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" },
    { id: 'georgia', name: 'Georgia serif', css: "Georgia, 'Times New Roman', Times, serif" },
    { id: 'palatino', name: 'Elegant serif', css: "'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif" },
    { id: 'trebuchet', name: 'Trebuchet', css: "'Trebuchet MS', 'Lucida Grande', 'Segoe UI', sans-serif" },
    { id: 'impact', name: 'Impact / condensed', css: "Impact, Haettenschweiler, 'Arial Narrow Bold', 'Arial Black', sans-serif" },
    { id: 'mono', name: 'Typewriter mono', css: "'Courier New', Courier, ui-monospace, Menlo, monospace" },
    { id: 'rounded', name: 'Rounded', css: "ui-rounded, 'SF Pro Rounded', 'Arial Rounded MT Bold', 'Varela Round', 'Segoe UI', system-ui, sans-serif" },
    { id: 'verdana', name: 'Verdana wide', css: "Verdana, Geneva, Tahoma, sans-serif" },
    { id: 'script', name: 'Casual hand', css: "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', 'Chalkboard SE', cursive" }
  ];
  function fontById(id) { for (var i = 0; i < FONTS.length; i++) if (FONTS[i].id === id) return FONTS[i]; return FONTS[0]; }
  function fontStr(weight, size, fontId, italic) {
    return (italic ? 'italic ' : '') + (weight || 400) + ' ' + Math.max(1, size) + 'px ' + fontById(fontId).css;
  }
  /** Make sure the Inter faces used are ready before drawing on canvas. */
  function fontsReady(weights) {
    if (!doc.fonts || !doc.fonts.load) return Promise.resolve();
    var ws = weights && weights.length ? weights : [400, 600, 700, 800];
    return Promise.all(ws.map(function (w) { return doc.fonts.load(w + ' 40px Inter').catch(function () {}); }))
      .then(function () { return doc.fonts.ready; }).catch(function () {});
  }

  // ---------------------------------------------------------------- Icons
  var ICONS = window.BT_ICONS || {};
  function iconNames() { return Object.keys(ICONS); }
  function iconSVG(name, color, sw, size) {
    var inner = ICONS[name] || ICONS.sparkles || '';
    size = size || 24;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + esc(color || '#000') +
      '" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }
  var iconCache = {};
  /** Rasterisable image of a Lucide icon (data: URL, no network). */
  function iconImage(name, color, sw) {
    var key = name + '|' + color + '|' + sw;
    if (iconCache[key]) return iconCache[key];
    iconCache[key] = new Promise(function (res) {
      var img = new Image();
      img.onload = function () { res(img); };
      img.onerror = function () { res(null); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(iconSVG(name, color, sw, 512));
    });
    return iconCache[key];
  }
  /** Synchronous lookup of an already-loaded icon image (null if loading). */
  var iconReady = {};
  function iconNow(name, color, sw, onLoad) {
    var key = name + '|' + color + '|' + sw;
    if (iconReady[key]) return iconReady[key];
    iconImage(name, color, sw).then(function (img) {
      if (img && !iconReady[key]) { iconReady[key] = img; if (onLoad) onLoad(); }
    });
    return null;
  }

  // ------------------------------------------------------------- UI bits
  function field(label, control, hint) {
    var id = control.id || (control.id = nid());
    return h('div.field', null, [h('label', { 'for': id, text: label }), control, hint ? h('span.hint', { html: hint }) : null]);
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
    var out = h('span.dsn-val', { 'aria-hidden': 'true' });
    var f = fmt || function (v) { return v; };
    function upd() { out.textContent = f(Number(el.value)); el.setAttribute('aria-valuetext', f(Number(el.value))); }
    el.addEventListener('input', function () { upd(); if (onInput) onInput(Number(el.value)); });
    upd();
    var wrap = h('div.field', null, [h('label', { 'for': el.id, text: label }), h('div.dsn-range', null, [el, out])]);
    wrap.input = el;
    wrap.set = function (v) { el.value = v; upd(); };
    return wrap;
  }
  function colorInput(label, value, onInput) {
    var el = input('color', value, { 'aria-label': label });
    if (onInput) el.addEventListener('input', function () { onInput(el.value); });
    var f = field(label, el);
    f.input = el;
    return f;
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
    var el = h('div.seg.dsn-seg', { role: 'group', 'aria-label': label || 'Options' });
    el.value = value;
    items.forEach(function (it) {
      var b = h('button', { type: 'button', text: it[1], 'data-v': it[0], 'aria-pressed': String(it[0] === value) });
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
  function segField(label, items, value, onChange) {
    var s = seg(items, value, onChange, label);
    var wrap = h('div.field', null, [h('span.label', { text: label }), s]);
    wrap.seg = s;
    return wrap;
  }
  function btn(cls, iconName, text, onClick, attrs) {
    var b = h('button.btn' + (cls ? '.' + cls.split(' ').join('.') : ''), Object.assign({ type: 'button', html: (iconName ? BT.icon(iconName) : '') + '<span>' + esc(text) + '</span>' }, attrs || {}));
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }
  function iconBtn(iconName, label, onClick) {
    var b = h('button.ib', { type: 'button', 'aria-label': label, title: label, html: BT.icon(iconName) });
    b.addEventListener('click', onClick);
    return b;
  }
  function sec(title, kids) { return h('div.dsn-sec', null, [title ? h('h4', { text: title }) : null].concat(kids)); }
  function headBar(iconName, title, meta, onReset) {
    return h('div.dsn-head', null, [
      h('span.dsn-ic', { html: BT.icon(iconName) }),
      h('div.dsn-txt', null, [h('div.dsn-name', { text: title, title: title }), h('div.dsn-meta', { html: meta || '' })]),
      onReset ? btn('btn-ghost btn-sm', 'rotate-ccw', 'Start over', onReset) : null
    ]);
  }
  function loadingEl(text) {
    return h('div.loading', { html: '<span class="spinner"></span> ' + esc(text || 'Reading image…') });
  }

  /** Paste-an-image support while the tool is on screen. */
  function pasteSupport(root, onFiles, always) {
    if (root._dsnPaste) doc.removeEventListener('paste', root._dsnPaste);
    root._dsnPaste = function (e) {
      if (!root.isConnected) return;
      if (!always && !root.querySelector('.dropzone:not(.compact)')) return;
      var t = e.target;
      if (t && /INPUT|TEXTAREA/.test(t.tagName) && t.type !== 'file') return;
      var items = (e.clipboardData && e.clipboardData.files) || [];
      var files = Array.prototype.filter.call(items, function (f) { return /^image\//.test(f.type); });
      if (files.length) { e.preventDefault(); onFiles(files); }
    };
    doc.addEventListener('paste', root._dsnPaste);
  }
  function pasteHint() { return h('p.dsn-paste', { html: BT.icon('copy') + ' You can also paste an image with Ctrl + V' }); }

  /**
   * Interactive canvas view that fits a design of (dw × dh) units into its
   * container and re-renders on resize. draw(ctx, k) paints at k px per unit.
   */
  function canvasView(container, opts) {
    var cv = h('canvas.dsn-view', { tabindex: opts.tabindex == null ? '0' : opts.tabindex, role: 'img', 'aria-label': opts.label || 'Preview' });
    container.appendChild(cv);
    var view = { canvas: cv, k: 1, cssK: 1 };
    var raf = 0;
    function size() {
      var d = opts.size();
      var cs = getComputedStyle(container);
      var availW = container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var availH = Math.min(window.innerHeight * (opts.vh || 0.66), opts.maxH || 680);
      if (availW <= 0) availW = 320;
      var s = Math.min(availW / d.w, availH / d.h);
      var cssW = Math.max(40, Math.floor(d.w * s)), cssH = Math.max(40, Math.floor(d.h * s));
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.style.width = cssW + 'px';
      cv.style.height = cssH + 'px';
      var pw = Math.round(cssW * dpr), ph = Math.round(cssH * dpr);
      if (cv.width !== pw) cv.width = pw;
      if (cv.height !== ph) cv.height = ph;
      view.k = pw / d.w;
      view.cssK = cssW / d.w;
    }
    view.render = function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; view.renderNow(); });
    };
    view.renderNow = function () {
      size();
      var ctx = c2d(cv);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      opts.draw(ctx, view.k);
    };
    /** Pointer event → design coordinates. */
    view.pt = function (e) {
      var r = cv.getBoundingClientRect(), d = opts.size();
      return { x: (e.clientX - r.left) / r.width * d.w, y: (e.clientY - r.top) / r.height * d.h };
    };
    var ro = window.ResizeObserver ? new ResizeObserver(function () { view.render(); }) : null;
    if (ro) ro.observe(container); else window.addEventListener('resize', view.render);
    view.destroy = function () { if (ro) ro.disconnect(); else window.removeEventListener('resize', view.render); };
    view.renderNow();
    return view;
  }

  /** Two-column editor layout. */
  function editor(root) {
    var stage = h('div.dsn-stage');
    var under = h('div.dsn-under');
    var panel = h('div.card.dsn-panel');
    var left = h('div.dsn-left', null, [stage, under]);
    root.appendChild(h('div.split.wide-left', null, [left, h('div', null, [panel])]));
    return { stage: stage, under: under, panel: panel, left: left };
  }

  /** Download a canvas as PNG/JPG with a filename stem. */
  function saveCanvas(canvas, mime, stem, quality) {
    return encode(canvas, mime, quality).then(function (e) {
      BT.download(e.blob, stem + '.' + e.ext);
      BT.toast('Saved ' + canvas.width + ' × ' + canvas.height + ' px ' + e.ext.toUpperCase());
      return e;
    });
  }

  var GRADS = [
    ['#fdf2f8', '#fce7f3'], ['#eef2ff', '#e0e7ff'], ['#f97316', '#db2777'], ['#4f46e5', '#7c3aed'],
    ['#0ea5e9', '#22d3ee'], ['#10b981', '#84cc16'], ['#0f172a', '#334155'], ['#fbbf24', '#f472b6'],
    ['#111827', '#4c1d95'], ['#fde68a', '#fca5a5'], ['#a7f3d0', '#93c5fd'], ['#ffffff', '#e5e7eb']
  ];
  /** Background editor (solid / gradient). bg object is mutated; onChange called. */
  function bgEditor(bg, onChange, opts) {
    opts = opts || {};
    var types = [['solid', 'Solid'], ['linear', 'Gradient'], ['radial', 'Radial']];
    if (opts.allowNone) types.unshift(['none', 'Transparent']);
    if (opts.allowImage) types.push(['image', 'Photo']);
    var c1 = colorInput(opts.l1 || 'Colour 1', bg.c1, function (v) { bg.c1 = v; onChange(); });
    var c2 = colorInput('Colour 2', bg.c2, function (v) { bg.c2 = v; onChange(); });
    var ang = range('Gradient angle', 0, 360, 5, bg.angle == null ? 135 : bg.angle, function (v) { return v + '°'; }, function (v) { bg.angle = v; onChange(); });
    var presets = h('div.dsn-pal', { role: 'group', 'aria-label': 'Gradient presets' });
    GRADS.forEach(function (g, i) {
      var b = h('button', { type: 'button', 'aria-label': 'Gradient preset ' + (i + 1), html: '<i style="background:' + g[0] + '"></i><i style="background:' + g[1] + '"></i>' });
      b.addEventListener('click', function () {
        bg.c1 = g[0]; bg.c2 = g[1];
        if (bg.type === 'solid' || bg.type === 'none' || bg.type === 'image') { bg.type = 'linear'; t.seg.set('linear'); }
        c1.input.value = g[0]; c2.input.value = g[1];
        sync(); onChange();
      });
      presets.appendChild(b);
    });
    var extra = h('div');
    var t = segField(opts.label || 'Background', types, bg.type, function (v) { bg.type = v; sync(); onChange(); });
    function sync() {
      var grad = bg.type === 'linear' || bg.type === 'radial';
      c1.style.display = bg.type === 'none' || bg.type === 'image' ? 'none' : '';
      c2.style.display = grad ? '' : 'none';
      ang.style.display = bg.type === 'linear' ? '' : 'none';
      presets.style.display = bg.type === 'none' || bg.type === 'image' ? 'none' : '';
      if (opts.onType) opts.onType(bg.type, extra);
    }
    var wrap = h('div', null, [t, h('div.dsn-colors', null, [c1, c2]), ang, presets, extra]);
    wrap.sync = function () {
      t.seg.set(bg.type); c1.input.value = bg.c1; c2.input.value = bg.c2; ang.set(bg.angle == null ? 135 : bg.angle); sync();
    };
    sync();
    presets.style.marginTop = '10px';
    return wrap;
  }

  /** Two-finger pinch + wheel helper; returns pointer map utilities. */
  function pointers() {
    var map = {};
    return {
      add: function (e) { map[e.pointerId] = { x: e.clientX, y: e.clientY }; },
      move: function (e) { if (map[e.pointerId]) { map[e.pointerId].x = e.clientX; map[e.pointerId].y = e.clientY; } },
      del: function (e) { delete map[e.pointerId]; },
      count: function () { return Object.keys(map).length; },
      dist: function () {
        var k = Object.keys(map);
        if (k.length < 2) return 0;
        var a = map[k[0]], b = map[k[1]];
        return Math.hypot(a.x - b.x, a.y - b.y);
      }
    };
  }

  // =========================================================== Collage maker
  var T3 = 1 / 3, T23 = 2 / 3;
  var LAYOUTS = [
    { id: 'h2', name: 'Side by side', r: [[0, 0, .5, 1], [.5, 0, .5, 1]] },
    { id: 'v2', name: 'Stacked', r: [[0, 0, 1, .5], [0, .5, 1, .5]] },
    { id: 'h2b', name: 'Wide and narrow', r: [[0, 0, T23, 1], [T23, 0, T3, 1]] },
    { id: 'v2b', name: 'Tall top', r: [[0, 0, 1, T23], [0, T23, 1, T3]] },
    { id: 'c3', name: '3 columns', r: [[0, 0, T3, 1], [T3, 0, T3, 1], [T23, 0, T3, 1]] },
    { id: 'r3', name: '3 rows', r: [[0, 0, 1, T3], [0, T3, 1, T3], [0, T23, 1, T3]] },
    { id: 'l1r2', name: '1 big + 2 small', r: [[0, 0, .6, 1], [.6, 0, .4, .5], [.6, .5, .4, .5]] },
    { id: 't1b2', name: 'Big top + 2', r: [[0, 0, 1, .6], [0, .6, .5, .4], [.5, .6, .5, .4]] },
    { id: 'l2r1', name: '2 small + 1 big', r: [[0, 0, .4, .5], [0, .5, .4, .5], [.4, 0, .6, 1]] },
    { id: 't2b1', name: '2 top + big bottom', r: [[0, 0, .5, .4], [.5, 0, .5, .4], [0, .4, 1, .6]] },
    { id: 'g4', name: '2 × 2 grid', r: [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, .5, .5], [.5, .5, .5, .5]] },
    { id: 'c4', name: '4 columns', r: [[0, 0, .25, 1], [.25, 0, .25, 1], [.5, 0, .25, 1], [.75, 0, .25, 1]] },
    { id: 'l1r3', name: '1 big + 3 small', r: [[0, 0, T23, 1], [T23, 0, T3, T3], [T23, T3, T3, T3], [T23, T23, T3, T3]] },
    { id: 't1b3', name: 'Big top + 3', r: [[0, 0, 1, T23], [0, T23, T3, T3], [T3, T23, T3, T3], [T23, T23, T3, T3]] },
    { id: 'm4', name: 'Brick mosaic', r: [[0, 0, .6, .55], [.6, 0, .4, .55], [0, .55, .4, .45], [.4, .55, .6, .45]] },
    { id: 't2b3', name: '2 top + 3 bottom', r: [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, T3, .5], [T3, .5, T3, .5], [T23, .5, T3, .5]] },
    { id: 'l1g4', name: '1 big + 4 grid', r: [[0, 0, .5, 1], [.5, 0, .25, .5], [.75, 0, .25, .5], [.5, .5, .25, .5], [.75, .5, .25, .5]] },
    { id: 'm5', name: 'Centre column', r: [[0, 0, T3, .5], [0, .5, T3, .5], [T3, 0, T3, 1], [T23, 0, T3, .5], [T23, .5, T3, .5]] },
    { id: 'g6', name: '3 × 2 grid', r: [[0, 0, T3, .5], [T3, 0, T3, .5], [T23, 0, T3, .5], [0, .5, T3, .5], [T3, .5, T3, .5], [T23, .5, T3, .5]] },
    { id: 'g6v', name: '2 × 3 grid', r: [[0, 0, .5, T3], [.5, 0, .5, T3], [0, T3, .5, T3], [.5, T3, .5, T3], [0, T23, .5, T3], [.5, T23, .5, T3]] },
    { id: 'm6', name: '1 big + 5', r: [[0, 0, T23, T23], [T23, 0, T3, T3], [T23, T3, T3, T3], [0, T23, T3, T3], [T3, T23, T3, T3], [T23, T23, T3, T3]] },
    { id: 'm7', name: 'Hero + 6', r: [[0, 0, 1, .5], [0, .5, T3, .25], [T3, .5, T3, .25], [T23, .5, T3, .25], [0, .75, T3, .25], [T3, .75, T3, .25], [T23, .75, T3, .25]] },
    { id: 'm7b', name: 'Big left + 6', r: [[0, 0, .5, 1], [.5, 0, .25, T3], [.75, 0, .25, T3], [.5, T3, .25, T3], [.75, T3, .25, T3], [.5, T23, .25, T3], [.75, T23, .25, T3]] },
    { id: 'g8', name: '4 × 2 grid', r: [[0, 0, .25, .5], [.25, 0, .25, .5], [.5, 0, .25, .5], [.75, 0, .25, .5], [0, .5, .25, .5], [.25, .5, .25, .5], [.5, .5, .25, .5], [.75, .5, .25, .5]] },
    { id: 'm8', name: 'Mosaic 8', r: [[0, 0, .5, .5], [.5, 0, .25, .25], [.75, 0, .25, .25], [.5, .25, .25, .25], [.75, .25, .25, .25], [0, .5, T3, .5], [T3, .5, T3, .5], [T23, .5, T3, .5]] },
    { id: 'g9', name: '3 × 3 grid', r: [[0, 0, T3, T3], [T3, 0, T3, T3], [T23, 0, T3, T3], [0, T3, T3, T3], [T3, T3, T3, T3], [T23, T3, T3, T3], [0, T23, T3, T3], [T3, T23, T3, T3], [T23, T23, T3, T3]] },
    { id: 'm9', name: 'Mosaic 9', r: [[0, 0, T3, .3], [T3, 0, T3, .3], [T23, 0, T3, .3], [0, .3, .5, .4], [.5, .3, .5, .4], [0, .7, .25, .3], [.25, .7, .25, .3], [.5, .7, .25, .3], [.75, .7, .25, .3]] }
  ];
  function layoutById(id) { for (var i = 0; i < LAYOUTS.length; i++) if (LAYOUTS[i].id === id) return LAYOUTS[i]; return LAYOUTS[0]; }
  function defaultLayout(n) {
    n = clamp(n, 2, 9);
    for (var i = 0; i < LAYOUTS.length; i++) if (LAYOUTS[i].r.length === n) return LAYOUTS[i];
    return LAYOUTS[0];
  }
  function layoutThumb(l) {
    var g = 3, W = 60, H = 60, s = '';
    l.r.forEach(function (r) {
      s += '<rect x="' + (r[0] * (W + g) + 2).toFixed(1) + '" y="' + (r[1] * (H + g) + 2).toFixed(1) + '" width="' + Math.max(1, r[2] * (W + g) - g - 0).toFixed(1) +
        '" height="' + Math.max(1, r[3] * (H + g) - g).toFixed(1) + '" rx="3" fill="currentColor" opacity=".55"/>';
    });
    return '<svg viewBox="0 0 64 64" aria-hidden="true">' + s + '</svg>';
  }

  var COLLAGE_SIZES = [
    ['square', 'Square 1:1', 1, 1], ['portrait', 'Portrait 4:5', 4, 5], ['story', 'Story 9:16', 9, 16],
    ['landscape', 'Landscape 16:9', 16, 9], ['a4', 'A4 portrait', 210, 297], ['a4l', 'A4 landscape', 297, 210], ['custom', 'Custom', 0, 0]
  ];

  register('collage-maker', function (root, ctx) {
    injectCSS();
    var S, view, ed;

    function fresh() {
      return {
        photos: [], mode: 'grid', layout: 'h2', cells: [], free: [], captions: [],
        size: 'square', cw: 1200, ch: 800, spacing: 12, border: 16, radius: 10,
        bg: { type: 'solid', c1: '#ffffff', c2: '#e0e7ff', angle: 135 }, frame: 'polaroid',
        sel: { kind: 'cell', i: 0 }, outLong: 2160, fmt: 'image/jpeg'
      };
    }

    function dims() {
      var p = COLLAGE_SIZES.filter(function (s) { return s[0] === S.size; })[0];
      var rw = p[2], rh = p[3];
      if (S.size === 'custom') { rw = Math.max(1, S.cw); rh = Math.max(1, S.ch); }
      var m = Math.max(rw, rh);
      return { w: rw / m * 1000, h: rh / m * 1000 };
    }

    function start() {
      if (view) view.destroy();
      view = null;
      S = fresh();
      root.innerHTML = '';
      root.appendChild(BT.dropzone({
        accept: 'image/*', multiple: true, title: 'Choose 2 to 9 photos', icon: 'images',
        hint: 'or drag and drop them here · JPG, PNG, WebP', color: ctx.category && ctx.category.color,
        onFiles: function (f) { addFiles(f); }
      }));
      root.appendChild(pasteHint());
    }

    function addFiles(files) {
      var room = 9 - S.photos.length;
      if (room <= 0) { BT.toast('A collage can have up to 9 photos', 'error'); return; }
      if (files.length > room) BT.toast('Only the first ' + room + ' photo' + (room > 1 ? 's were' : ' was') + ' added (9 max)', 'error');
      files = files.slice(0, room);
      var first = !S.photos.length;
      if (first) { root.innerHTML = ''; root.appendChild(loadingEl('Reading photos…')); }
      Promise.all(files.map(function (f) { return decode(f, 2400).catch(function (e) { BT.toast(e.message, 'error'); return null; }); })).then(function (list) {
        list.filter(Boolean).forEach(function (im) {
          im.prev = mk(1, 1);
          var s = Math.min(1, 900 / Math.max(im.w, im.h));
          im.prev = mk(im.w * s, im.h * s);
          c2d(im.prev).drawImage(im.canvas, 0, 0, im.prev.width, im.prev.height);
          im.thumb = thumbURL(im.canvas, 140);
          S.photos.push(im);
        });
        if (!S.photos.length) { start(); return; }
        S.layout = defaultLayout(S.photos.length).id;
        assignCells();
        syncFree();
        if (first || !ed) build(); else { refreshPanel(); view.render(); }
      });
    }

    function assignCells() {
      var n = layoutById(S.layout).r.length, used = {}, cells = [];
      for (var i = 0; i < n; i++) {
        var old = S.cells[i];
        if (old && old.p >= 0 && old.p < S.photos.length && !used[old.p]) { cells.push(old); used[old.p] = 1; } else cells.push(null);
      }
      var next = 0;
      for (i = 0; i < n; i++) {
        if (cells[i]) continue;
        while (next < S.photos.length && used[next]) next++;
        cells[i] = { p: next < S.photos.length ? next : -1, zoom: 1, ox: 0, oy: 0 };
        if (next < S.photos.length) used[next] = 1;
      }
      S.cells = cells;
      if (S.sel.kind === 'cell' && S.sel.i >= n) S.sel.i = 0;
    }

    function syncFree() {
      var d = dims(), r = rng(S.photos.length * 97 + 3);
      S.free = S.free.filter(function (it) { return it.p < S.photos.length; });
      var have = {};
      S.free.forEach(function (it) { have[it.p] = 1; });
      S.photos.forEach(function (p, i) {
        if (have[i]) return;
        var n = S.photos.length, cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
        var cx = ((i % cols) + 0.5) / cols, cy = (Math.floor(i / cols) + 0.5) / rows;
        S.free.push({ p: i, x: d.w * (0.12 + cx * 0.76) + (r() - 0.5) * 40, y: d.h * (0.12 + cy * 0.76) + (r() - 0.5) * 40,
          w: Math.min(d.w, d.h) * (n <= 2 ? 0.52 : n <= 4 ? 0.42 : 0.32), rot: (r() - 0.5) * 22 });
      });
    }

    function removePhoto(i) {
      S.photos.splice(i, 1);
      S.cells.forEach(function (c) { if (c.p === i) c.p = -1; else if (c.p > i) c.p--; });
      S.free = S.free.filter(function (it) { return it.p !== i; });
      S.free.forEach(function (it) { if (it.p > i) it.p--; });
      if (!S.photos.length) { start(); return; }
      refreshPanel(); view.render();
    }

    // -------------------------------------------------------------- geometry
    function cellRect(i, d) {
      var r = layoutById(S.layout).r[i], b = S.border, g = S.spacing;
      var iw = d.w - 2 * b, ih = d.h - 2 * b;
      return { x: b + r[0] * (iw + g), y: b + r[1] * (ih + g), w: r[2] * (iw + g) - g, h: r[3] * (ih + g) - g };
    }
    function freeBox(it) {
      var p = S.photos[it.p], ar = p.h / p.w, iw = it.w, ih = iw * ar, pad = 0, bottom = 0;
      if (S.frame === 'polaroid') { pad = iw * 0.05; bottom = iw * 0.2; } else if (S.frame === 'border') { pad = iw * 0.035; bottom = pad; }
      var bw = iw + 2 * pad, bh = ih + pad + (bottom || pad);
      return { bw: bw, bh: bh, ix: -bw / 2 + pad, iy: -bh / 2 + pad, iw: iw, ih: ih };
    }
    function capFont(c) { return fontStr(c.bold ? 800 : 500, c.size, c.font); }
    var measureCtx = c2d(mk(4, 4));
    function capBox(c) {
      measureCtx.font = capFont(c);
      var lines = String(c.text || ' ').split('\n'), w = 0;
      lines.forEach(function (l) { w = Math.max(w, measureCtx.measureText(l || ' ').width); });
      var lh = c.size * 1.2, hh = lh * lines.length, pad = c.bg ? c.size * 0.45 : 4;
      return { x: c.x - w / 2 - pad, y: c.y - hh / 2 - pad * 0.7, w: w + pad * 2, h: hh + pad * 1.4, lines: lines, lh: lh };
    }
    function toLocal(it, x, y) {
      var a = -rad(it.rot), dx = x - it.x, dy = y - it.y;
      return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
    }
    function handlePos(it) {
      var b = freeBox(it), a = rad(it.rot), lx = b.bw / 2, ly = b.bh / 2;
      return { x: it.x + lx * Math.cos(a) - ly * Math.sin(a), y: it.y + lx * Math.sin(a) + ly * Math.cos(a) };
    }

    // ---------------------------------------------------------------- render
    function render(c, k, hi, ui) {
      var d = dims();
      c.save();
      c.scale(k, k);
      if (S.bg.type !== 'none') paintBg(c, d.w, d.h, S.bg);
      if (S.mode === 'grid') {
        var n = layoutById(S.layout).r.length;
        for (var i = 0; i < n; i++) {
          var r = cellRect(i, d), cell = S.cells[i];
          if (r.w <= 0 || r.h <= 0) continue;
          c.save();
          rrect(c, r.x, r.y, r.w, r.h, S.radius);
          c.clip();
          if (cell && cell.p >= 0 && S.photos[cell.p]) {
            var ph = S.photos[cell.p];
            drawFit(c, hi ? ph.canvas : ph.prev, r.x, r.y, r.w, r.h, 'cover', cell.zoom, cell.ox, cell.oy);
          } else {
            c.fillStyle = ui ? 'rgba(148,163,184,.35)' : '#e5e7eb';
            c.fillRect(r.x, r.y, r.w, r.h);
            if (ui) {
              c.fillStyle = 'rgba(71,85,105,.85)';
              c.font = fontStr(600, Math.max(10, Math.min(r.w, r.h) * 0.09), 'inter');
              c.textAlign = 'center'; c.textBaseline = 'middle';
              c.fillText('Empty – add a photo', r.x + r.w / 2, r.y + r.h / 2);
            }
          }
          c.restore();
          if (ui && S.sel.kind === 'cell' && S.sel.i === i) outline(c, r.x, r.y, r.w, r.h, k, S.radius);
          if (ui && drag && drag.swapTo === i) outline(c, r.x, r.y, r.w, r.h, k, S.radius, '#f59e0b');
        }
      } else {
        S.free.forEach(function (it, idx) {
          var ph = S.photos[it.p];
          if (!ph) return;
          var b = freeBox(it);
          c.save();
          c.translate(it.x, it.y);
          c.rotate(rad(it.rot));
          if (S.frame !== 'none') {
            c.shadowColor = 'rgba(0,0,0,.32)';
            c.shadowBlur = b.bw * 0.06;
            c.shadowOffsetY = b.bw * 0.025;
          }
          if (S.frame === 'polaroid' || S.frame === 'border') {
            c.fillStyle = '#ffffff';
            rrect(c, -b.bw / 2, -b.bh / 2, b.bw, b.bh, S.frame === 'polaroid' ? b.bw * 0.008 : 0);
            c.fill();
            c.shadowColor = 'transparent';
          } else if (S.frame === 'shadow') {
            c.fillStyle = '#000';
            rrect(c, b.ix, b.iy, b.iw, b.ih, S.radius);
            c.fill();
            c.shadowColor = 'transparent';
          }
          c.save();
          rrect(c, b.ix, b.iy, b.iw, b.ih, S.frame === 'polaroid' || S.frame === 'border' ? 0 : S.radius);
          c.clip();
          c.drawImage(hi ? ph.canvas : ph.prev, b.ix, b.iy, b.iw, b.ih);
          c.restore();
          if (ui && S.sel.kind === 'free' && S.sel.i === idx) {
            c.strokeStyle = '#6366f1'; c.lineWidth = 2 / k;
            c.setLineDash([6 / k, 4 / k]);
            c.strokeRect(-b.bw / 2, -b.bh / 2, b.bw, b.bh);
            c.setLineDash([]);
            handleDot(c, b.bw / 2, b.bh / 2, k);
          }
          c.restore();
        });
      }
      S.captions.forEach(function (cp, idx) {
        var bx = capBox(cp);
        c.save();
        c.font = capFont(cp);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        if (cp.bg) {
          c.fillStyle = cp.bgColor || 'rgba(0,0,0,.55)';
          rrect(c, bx.x, bx.y, bx.w, bx.h, Math.min(bx.h / 2, cp.size * 0.6));
          c.fill();
        }
        if (cp.shadow) { c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = cp.size * 0.25; c.shadowOffsetY = cp.size * 0.06; }
        c.fillStyle = cp.color;
        bx.lines.forEach(function (l, li) { c.fillText(l, cp.x, cp.y - (bx.lines.length - 1) * bx.lh / 2 + li * bx.lh); });
        c.restore();
        if (ui && S.sel.kind === 'cap' && S.sel.i === idx) {
          c.save(); c.strokeStyle = '#6366f1'; c.lineWidth = 2 / k; c.setLineDash([6 / k, 4 / k]);
          c.strokeRect(bx.x, bx.y, bx.w, bx.h); c.restore();
        }
      });
      c.restore();
    }
    function outline(c, x, y, w, hh, k, r, col) {
      c.save();
      c.strokeStyle = col || '#6366f1';
      c.lineWidth = 3 / k;
      rrect(c, x + 1.5 / k, y + 1.5 / k, w - 3 / k, hh - 3 / k, Math.max(0, r - 1.5 / k));
      c.stroke();
      c.restore();
    }
    function handleDot(c, x, y, k) {
      c.save();
      c.fillStyle = '#fff'; c.strokeStyle = '#6366f1'; c.lineWidth = 2.5 / k;
      c.beginPath(); c.arc(x, y, 9 / k, 0, Math.PI * 2); c.fill(); c.stroke();
      c.restore();
    }

    // ------------------------------------------------------------ hit tests
    function hitCaption(p) {
      for (var i = S.captions.length - 1; i >= 0; i--) {
        var b = capBox(S.captions[i]);
        if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return i;
      }
      return -1;
    }
    function hitCell(p) {
      var d = dims(), n = layoutById(S.layout).r.length;
      for (var i = 0; i < n; i++) {
        var r = cellRect(i, d);
        if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return i;
      }
      return -1;
    }
    function hitFree(p) {
      for (var i = S.free.length - 1; i >= 0; i--) {
        var it = S.free[i], b = freeBox(it), l = toLocal(it, p.x, p.y);
        if (Math.abs(l.x) <= b.bw / 2 && Math.abs(l.y) <= b.bh / 2) return i;
      }
      return -1;
    }

    // ---------------------------------------------------------- interaction
    var drag = null, ptrs = pointers();
    function onDown(e) {
      if (e.button > 0) return;
      view.canvas.setPointerCapture(e.pointerId);
      ptrs.add(e);
      var p = view.pt(e);
      if (ptrs.count() === 2 && drag) { drag.pinch = ptrs.dist(); drag.pinchBase = currentScale(); return; }
      var tol = 14 / view.cssK;
      if (S.mode === 'free' && S.sel.kind === 'free' && S.free[S.sel.i]) {
        var hp = handlePos(S.free[S.sel.i]);
        if (Math.hypot(p.x - hp.x, p.y - hp.y) <= tol) {
          var it = S.free[S.sel.i];
          drag = { type: 'handle', it: it, w0: it.w, rot0: it.rot, d0: Math.hypot(p.x - it.x, p.y - it.y), a0: Math.atan2(p.y - it.y, p.x - it.x) };
          return;
        }
      }
      var ci = hitCaption(p);
      if (ci >= 0) {
        S.sel = { kind: 'cap', i: ci };
        drag = { type: 'cap', c: S.captions[ci], sx: p.x, sy: p.y, x0: S.captions[ci].x, y0: S.captions[ci].y };
      } else if (S.mode === 'grid') {
        var i = hitCell(p);
        if (i < 0) { drag = null; return; }
        S.sel = { kind: 'cell', i: i };
        var c = S.cells[i];
        drag = { type: 'pan', i: i, sx: p.x, sy: p.y, ox: c.ox, oy: c.oy, swapTo: -1 };
      } else {
        var fi = hitFree(p);
        if (fi < 0) { drag = null; refreshSel(); view.render(); return; }
        var item = S.free.splice(fi, 1)[0];
        S.free.push(item);
        S.sel = { kind: 'free', i: S.free.length - 1 };
        drag = { type: 'move', it: item, sx: p.x, sy: p.y, x0: item.x, y0: item.y };
      }
      refreshSel();
      if (S.sel.kind === 'cap') refreshCaps();
      view.render();
    }
    function currentScale() {
      if (S.sel.kind === 'cell' && S.cells[S.sel.i]) return S.cells[S.sel.i].zoom;
      if (S.sel.kind === 'free' && S.free[S.sel.i]) return S.free[S.sel.i].w;
      return 1;
    }
    function setScale(v) {
      if (S.sel.kind === 'cell' && S.cells[S.sel.i]) S.cells[S.sel.i].zoom = clamp(v, 1, 5);
      else if (S.sel.kind === 'free' && S.free[S.sel.i]) S.free[S.sel.i].w = clamp(v, 40, 1600);
      syncSelControls();
    }
    function onMove(e) {
      ptrs.move(e);
      if (!drag) return;
      var p = view.pt(e);
      if (drag.pinch && ptrs.count() >= 2) { setScale(drag.pinchBase * ptrs.dist() / drag.pinch); view.render(); return; }
      if (drag.type === 'cap') { drag.c.x = drag.x0 + p.x - drag.sx; drag.c.y = drag.y0 + p.y - drag.sy; }
      else if (drag.type === 'move') { drag.it.x = drag.x0 + p.x - drag.sx; drag.it.y = drag.y0 + p.y - drag.sy; }
      else if (drag.type === 'handle') {
        var it = drag.it;
        it.w = clamp(drag.w0 * Math.hypot(p.x - it.x, p.y - it.y) / Math.max(1, drag.d0), 40, 1600);
        it.rot = drag.rot0 + (Math.atan2(p.y - it.y, p.x - it.x) - drag.a0) * 180 / Math.PI;
        syncSelControls();
      } else if (drag.type === 'pan') {
        var over = hitCell(p), cell = S.cells[drag.i];
        if (over >= 0 && over !== drag.i) {
          cell.ox = drag.ox; cell.oy = drag.oy; drag.swapTo = over;
        } else {
          drag.swapTo = -1;
          var ph = S.photos[cell.p];
          if (ph) {
            var r = cellRect(drag.i, dims());
            var s = Math.max(r.w / ph.w, r.h / ph.h) * cell.zoom;
            var ovx = Math.abs(ph.w * s - r.w) / 2, ovy = Math.abs(ph.h * s - r.h) / 2;
            cell.ox = ovx > 0.5 ? clamp(drag.ox + (p.x - drag.sx) / ovx, -1, 1) : 0;
            cell.oy = ovy > 0.5 ? clamp(drag.oy + (p.y - drag.sy) / ovy, -1, 1) : 0;
          }
        }
      }
      view.render();
    }
    function onUp(e) {
      ptrs.del(e);
      if (drag && drag.type === 'pan' && drag.swapTo >= 0) {
        var a = drag.i, b = drag.swapTo, t = S.cells[a];
        S.cells[a] = S.cells[b]; S.cells[b] = t;
        S.sel = { kind: 'cell', i: b };
        BT.toast('Photos swapped');
        refreshSel();
      }
      if (ptrs.count() === 0) drag = null;
      view.render();
    }
    function onWheel(e) {
      var p = view.pt(e);
      if (S.mode === 'grid') {
        var i = hitCell(p);
        if (i < 0) return;
        e.preventDefault();
        S.sel = { kind: 'cell', i: i };
        S.cells[i].zoom = clamp(S.cells[i].zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08), 1, 5);
      } else {
        var fi = hitFree(p);
        if (fi < 0) return;
        e.preventDefault();
        S.sel = { kind: 'free', i: fi };
        S.free[fi].w = clamp(S.free[fi].w * (e.deltaY < 0 ? 1.06 : 1 / 1.06), 40, 1600);
      }
      refreshSel();
      view.render();
    }
    function onKey(e) {
      var step = e.shiftKey ? 10 : 2, k = e.key, did = true;
      var dx = k === 'ArrowLeft' ? -1 : k === 'ArrowRight' ? 1 : 0, dy = k === 'ArrowUp' ? -1 : k === 'ArrowDown' ? 1 : 0;
      if (S.sel.kind === 'cap' && S.captions[S.sel.i]) {
        var cp = S.captions[S.sel.i];
        if (dx || dy) { cp.x += dx * step * 2; cp.y += dy * step * 2; } else if (k === 'Delete' || k === 'Backspace') { S.captions.splice(S.sel.i, 1); S.sel = { kind: 'cell', i: 0 }; refreshPanel(); } else did = false;
      } else if (S.sel.kind === 'cell' && S.cells[S.sel.i]) {
        var c = S.cells[S.sel.i];
        if (dx || dy) { c.ox = clamp(c.ox + dx * step * 0.02, -1, 1); c.oy = clamp(c.oy + dy * step * 0.02, -1, 1); }
        else if (k === '+' || k === '=') c.zoom = clamp(c.zoom * 1.1, 1, 5);
        else if (k === '-') c.zoom = clamp(c.zoom / 1.1, 1, 5);
        else if (k === 'Tab' && !e.shiftKey && S.sel.i < S.cells.length - 1) S.sel.i++;
        else if (k === 'Tab' && e.shiftKey && S.sel.i > 0) S.sel.i--;
        else did = false;
      } else if (S.sel.kind === 'free' && S.free[S.sel.i]) {
        var it = S.free[S.sel.i];
        if (dx || dy) { it.x += dx * step * 2; it.y += dy * step * 2; }
        else if (k === '+' || k === '=') it.w *= 1.06;
        else if (k === '-') it.w /= 1.06;
        else if (k === '[') it.rot -= 3;
        else if (k === ']') it.rot += 3;
        else did = false;
      } else did = false;
      if (did) { e.preventDefault(); refreshSel(); view.render(); }
    }

    // ----------------------------------------------------------------- panel
    var P = {};
    function build() {
      root.innerHTML = '';
      root.appendChild(headBar('layout-dashboard', 'Collage', '<span class="badge" data-cnt></span>', start));
      ed = editor(root);
      view = canvasView(ed.stage, {
        label: 'Collage preview. Drag a photo to reposition it, drag it onto another cell to swap, scroll or pinch to zoom. Arrow keys pan, plus and minus zoom.',
        size: dims, draw: function (c, k) { render(c, k, false, true); }
      });
      var cv = view.canvas;
      cv.addEventListener('pointerdown', onDown);
      cv.addEventListener('pointermove', onMove);
      cv.addEventListener('pointerup', onUp);
      cv.addEventListener('pointercancel', onUp);
      cv.addEventListener('wheel', onWheel, { passive: false });
      cv.addEventListener('keydown', onKey);
      ed.under.innerHTML = BT.icon('move') + '<span>Drag to reposition · drop on another photo to swap · scroll / pinch to zoom</span>';
      pasteSupport(root, function (f) { addFiles(f); }, true);

      var pn = ed.panel;
      P.mode = segField('Mode', [['grid', 'Grid'], ['free', 'Freestyle']], S.mode, function (v) {
        S.mode = v;
        S.sel = v === 'grid' ? { kind: 'cell', i: 0 } : { kind: 'free', i: S.free.length - 1 };
        refreshPanel(); view.render();
      });
      pn.appendChild(P.mode);

      P.layoutSec = sec('Layout', [P.layouts = h('div.dsn-pick', { role: 'group', 'aria-label': 'Collage layouts' })]);
      P.layouts.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        S.layout = b.getAttribute('data-id');
        assignCells();
        refreshPanel(); view.render();
      });
      pn.appendChild(P.layoutSec);

      P.photos = h('div.dsn-photos');
      pn.appendChild(sec('Photos', [P.photos]));

      // canvas size
      P.sizes = h('div.dsn-chips', { role: 'group', 'aria-label': 'Canvas size' });
      COLLAGE_SIZES.forEach(function (s) {
        var b = h('button.chip', { type: 'button', text: s[1], 'data-v': s[0], 'aria-pressed': String(S.size === s[0]) });
        b.addEventListener('click', function () {
          S.size = s[0];
          BT.$$('button', P.sizes).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          P.custom.style.display = S.size === 'custom' ? '' : 'none';
          view.render();
        });
        P.sizes.appendChild(b);
      });
      var cw = input('number', S.cw, { min: 1, max: 20000, 'aria-label': 'Custom width' });
      var chh = input('number', S.ch, { min: 1, max: 20000, 'aria-label': 'Custom height' });
      function onCustom() { S.cw = clamp(BT.num(cw) || 1, 1, 20000); S.ch = clamp(BT.num(chh) || 1, 1, 20000); view.render(); }
      cw.addEventListener('input', onCustom); chh.addEventListener('input', onCustom);
      P.custom = h('div.dsn-two', { style: { marginTop: '10px', display: 'none' } }, [field('Width ratio', cw), field('Height ratio', chh)]);
      pn.appendChild(sec('Canvas size', [P.sizes, P.custom]));

      // style
      P.spacing = range('Spacing', 0, 60, 1, S.spacing, null, function (v) { S.spacing = v; view.render(); });
      P.border = range('Outer border', 0, 120, 1, S.border, null, function (v) { S.border = v; view.render(); });
      P.radius = range('Corner radius', 0, 80, 1, S.radius, null, function (v) { S.radius = v; view.render(); });
      P.frame = segField('Photo frame', [['none', 'None'], ['shadow', 'Shadow'], ['border', 'Border'], ['polaroid', 'Polaroid']], S.frame, function (v) { S.frame = v; view.render(); });
      P.gridStyle = h('div', null, [P.spacing, P.border]);
      pn.appendChild(sec('Style', [P.gridStyle, P.radius, P.frame, bgEditor(S.bg, function () { view.render(); })]));

      // selection
      P.selBox = h('div');
      pn.appendChild(P.selSec = sec('Selected photo', [P.selBox]));

      // captions
      P.capList = h('div.dsn-list');
      P.capEdit = h('div');
      pn.appendChild(sec('Text', [btn('btn-sm', 'type', 'Add text', function () {
        var d = dims();
        S.captions.push({ text: 'Your caption', x: d.w / 2, y: d.h * 0.88, size: 44, color: '#ffffff', font: 'inter', bold: true, shadow: true, bg: false, bgColor: '#000000' });
        S.sel = { kind: 'cap', i: S.captions.length - 1 };
        refreshPanel(); view.render();
      }), P.capList, P.capEdit]));

      // export
      P.outLong = select([[1080, '1080 px (long side)'], [2160, '2160 px (recommended)'], [3240, '3240 px'], [3508, '3508 px (A4 at 300 dpi)'], [4320, '4320 px']], String(S.outLong));
      P.outLong.addEventListener('change', function () { S.outLong = +P.outLong.value; });
      P.fmt = segField('Format', [['image/jpeg', 'JPG'], ['image/png', 'PNG']], S.fmt, function (v) { S.fmt = v; });
      var dl = btn('btn-primary', 'download', 'Download collage', function () {
        BT.busy(dl, function () {
          return fontsReady().then(function () {
            var d = dims(), L = S.outLong, k = L / 1000;
            var out = mk(Math.round(d.w * k), Math.round(d.h * k));
            render(c2d(out), out.width / d.w, true, false);
            return saveCanvas(out, S.fmt, 'collage-' + out.width + 'x' + out.height, 0.93);
          });
        }, 'Rendering…');
      });
      dl.setAttribute('data-download', '');
      pn.appendChild(sec('Export', [field('Size', P.outLong), P.fmt, h('div.dsn-actions', null, [dl, btn('', 'rotate-ccw', 'Start over', start)])]));
      refreshPanel();
    }

    function refreshPanel() {
      var cnt = BT.$('[data-cnt]', root);
      if (cnt) cnt.textContent = S.photos.length + ' photo' + (S.photos.length === 1 ? '' : 's');
      P.layoutSec.style.display = S.mode === 'grid' ? '' : 'none';
      P.gridStyle.style.display = S.mode === 'grid' ? '' : 'none';
      P.frame.style.display = S.mode === 'free' ? '' : 'none';
      // layouts: matching count first
      var n = S.photos.length;
      var sorted = LAYOUTS.slice().sort(function (a, b) { return (a.r.length === n ? 0 : 1) - (b.r.length === n ? 0 : 1) || a.r.length - b.r.length; });
      P.layouts.innerHTML = sorted.map(function (l) {
        return '<button type="button" data-id="' + l.id + '" aria-pressed="' + (l.id === S.layout) + '" aria-label="' + esc(l.name + ', ' + l.r.length + ' photos') + '" title="' + esc(l.name) + '" class="' + (l.r.length === n ? '' : 'dim') + '">' +
          layoutThumb(l) + '<span class="n">' + l.r.length + '</span></button>';
      }).join('');
      // photos
      P.photos.innerHTML = '';
      S.photos.forEach(function (p, i) {
        var rm = h('button', { type: 'button', 'aria-label': 'Remove photo ' + (i + 1), html: BT.icon('x') });
        rm.addEventListener('click', function () { removePhoto(i); });
        P.photos.appendChild(h('div.dsn-photo', null, [h('img', { src: p.thumb, alt: 'Photo ' + (i + 1) }), h('span.n', { text: String(i + 1) }), rm]));
      });
      if (S.photos.length < 9) {
        var fi = h('input', { type: 'file', accept: 'image/*', multiple: true, 'aria-label': 'Add photos' });
        fi.addEventListener('change', function () { addFiles(Array.prototype.slice.call(fi.files)); fi.value = ''; });
        P.photos.appendChild(h('label.dsn-add', { title: 'Add photos', html: BT.icon('plus') }, [fi]));
      }
      refreshCaps();
      refreshSel();
    }

    function refreshCaps() {
      P.capList.innerHTML = '';
      S.captions.forEach(function (cp, i) {
        var on = S.sel.kind === 'cap' && S.sel.i === i;
        var t = h('button.t', { type: 'button', text: cp.text || '(empty)' });
        t.addEventListener('click', function () { S.sel = { kind: 'cap', i: i }; refreshPanel(); view.render(); });
        P.capList.appendChild(h('div.dsn-item' + (on ? '.on' : ''), null, [t, iconBtn('trash-2', 'Delete text', function () {
          S.captions.splice(i, 1); S.sel = { kind: 'cell', i: 0 }; refreshPanel(); view.render();
        })]));
      });
      P.capEdit.innerHTML = '';
      var cp = S.sel.kind === 'cap' && S.captions[S.sel.i];
      if (!cp) return;
      var ta = h('textarea', { id: nid(), rows: 2, style: { minHeight: '64px' } });
      ta.value = cp.text;
      ta.addEventListener('input', function () { cp.text = ta.value; view.render(); var it = BT.$('.dsn-item.on .t', P.capList); if (it) it.textContent = cp.text || '(empty)'; });
      var fs = select(FONTS.map(function (f) { return [f.id, f.name]; }), cp.font);
      fs.addEventListener('change', function () { cp.font = fs.value; view.render(); });
      P.capEdit.appendChild(h('div', { style: { marginTop: '12px' } }, [
        field('Text', ta), field('Font', fs),
        range('Size', 12, 160, 1, cp.size, null, function (v) { cp.size = v; view.render(); }),
        h('div.dsn-colors', null, [colorInput('Colour', cp.color, function (v) { cp.color = v; view.render(); }), colorInput('Box colour', cp.bgColor, function (v) { cp.bgColor = v; view.render(); })]),
        h('div.dsn-chips', { style: { marginTop: '12px' } }, [
          checkbox('Bold', cp.bold, function (v) { cp.bold = v; view.render(); }),
          checkbox('Shadow', cp.shadow, function (v) { cp.shadow = v; view.render(); }),
          checkbox('Background box', cp.bg, function (v) { cp.bg = v; view.render(); })
        ])
      ]));
    }

    function refreshSel() {
      var box = P.selBox;
      if (!box) return;
      box.innerHTML = '';
      P.selCtl = null;
      if (S.sel.kind === 'cell' && S.mode === 'grid') {
        var c = S.cells[S.sel.i];
        if (!c) return;
        P.selSec.querySelector('h4').textContent = 'Selected cell ' + (S.sel.i + 1);
        var z = range('Zoom', 1, 5, 0.01, c.zoom, function (v) { return Math.round(v * 100) + '%'; }, function (v) { c.zoom = v; view.render(); });
        P.selCtl = z;
        var rep = h('input', { type: 'file', accept: 'image/*', 'aria-label': 'Replace photo in this cell' });
        rep.addEventListener('change', function () {
          var f = rep.files[0];
          rep.value = '';
          if (!f) return;
          decode(f, 2400).then(function (im) {
            var s = Math.min(1, 900 / Math.max(im.w, im.h));
            im.prev = mk(im.w * s, im.h * s);
            c2d(im.prev).drawImage(im.canvas, 0, 0, im.prev.width, im.prev.height);
            im.thumb = thumbURL(im.canvas, 140);
            if (c.p >= 0 && S.photos[c.p]) S.photos[c.p] = im; else if (S.photos.length < 9) { S.photos.push(im); c.p = S.photos.length - 1; syncFree(); }
            else { BT.toast('Remove a photo first (9 max)', 'error'); return; }
            c.zoom = 1; c.ox = 0; c.oy = 0;
            refreshPanel(); view.render();
          }).catch(function (e) { BT.toast(e.message, 'error'); });
        });
        var repBtn = h('label.btn.btn-sm', { html: BT.icon('image-plus') + '<span>' + (c.p >= 0 ? 'Replace' : 'Add photo') + '</span>', style: { position: 'relative', overflow: 'hidden' } }, [rep]);
        rep.style.cssText = 'position:absolute;inset:0;opacity:0;cursor:pointer';
        box.appendChild(z);
        box.appendChild(h('div.btn-group', null, [
          repBtn,
          btn('btn-sm', 'refresh-cw', 'Reset', function () { c.zoom = 1; c.ox = 0; c.oy = 0; refreshSel(); view.render(); }),
          btn('btn-sm', 'x', 'Empty cell', function () { c.p = -1; refreshSel(); view.render(); })
        ]));
        box.appendChild(h('p.muted.small', { style: { margin: '10px 0 0' }, text: 'Tip: drag one photo onto another to swap them.' }));
      } else if (S.sel.kind === 'free' && S.mode === 'free' && S.free[S.sel.i]) {
        var it = S.free[S.sel.i];
        P.selSec.querySelector('h4').textContent = 'Selected photo';
        var sz = range('Size', 40, 1200, 1, it.w, function (v) { return Math.round(v); }, function (v) { it.w = v; view.render(); });
        var rot = range('Rotation', -180, 180, 1, Math.round(((it.rot + 540) % 360) - 180), function (v) { return v + '°'; }, function (v) { it.rot = v; view.render(); });
        P.selCtl = sz; P.rotCtl = rot;
        box.appendChild(sz); box.appendChild(rot);
        box.appendChild(h('div.btn-group', null, [
          btn('btn-sm', 'layers', 'Send to back', function () { var x = S.free.splice(S.sel.i, 1)[0]; S.free.unshift(x); S.sel.i = 0; view.render(); }),
          btn('btn-sm', 'shuffle', 'Scatter all', function () { S.free = []; syncFree(); S.sel = { kind: 'free', i: S.free.length - 1 }; refreshSel(); view.render(); })
        ]));
        box.appendChild(h('p.muted.small', { style: { margin: '10px 0 0' }, text: 'Drag the round handle to resize and rotate. Keys: arrows move, + / − size, [ ] rotate.' }));
      } else {
        P.selSec.querySelector('h4').textContent = S.mode === 'grid' ? 'Selected cell' : 'Selected photo';
        box.appendChild(h('p.muted.small', { style: { margin: 0 }, text: S.mode === 'grid' ? 'Tap a cell in the preview to adjust it.' : 'Tap a photo in the preview to move, resize or rotate it.' }));
      }
      if (P.capList && S.sel.kind !== 'cap' && P.capEdit.childNodes.length) refreshCaps();
    }
    function syncSelControls() {
      if (!P.selCtl) return;
      if (S.sel.kind === 'cell' && S.cells[S.sel.i]) P.selCtl.set(S.cells[S.sel.i].zoom);
      else if (S.sel.kind === 'free' && S.free[S.sel.i]) {
        P.selCtl.set(S.free[S.sel.i].w);
        if (P.rotCtl) P.rotCtl.set(Math.round(((S.free[S.sel.i].rot % 360) + 540) % 360 - 180));
      }
    }

    start();
  });

  // ======================================================= Photo art effects
  /*
   * Self-contained pixel library. It is stringified into a Web Worker, so it
   * must not reference anything outside its own body.
   * run(fx, data, w, h, params) -> Uint8ClampedArray RGBA (same size).
   */
  function fxLib() {
    function ci(v, a, b) { return v < a ? a : v > b ? b : v; }
    function c8(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }
    function hash(x, y, s) {
      var n = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
      n = Math.imul(n ^ (n >>> 13), 1274126177);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
    }
    function gray(d, n) {
      var g = new Float32Array(n);
      for (var i = 0, j = 0; i < n; i++, j += 4) g[i] = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2];
      return g;
    }
    function chan(d, n, c) {
      var o = new Float32Array(n);
      for (var i = 0, j = c; i < n; i++, j += 4) o[i] = d[j];
      return o;
    }
    // Mean over a horizontal window [x-a, x+b] (edge clamped), then vertical [y-a, y+b].
    function winMean(src, w, h, a, b) {
      var tmp = new Float32Array(w * h), out = new Float32Array(w * h), inv = 1 / (a + b + 1), x, y, acc, row;
      for (y = 0; y < h; y++) {
        row = y * w; acc = 0;
        for (x = -a; x <= b; x++) acc += src[row + ci(x, 0, w - 1)];
        for (x = 0; x < w; x++) {
          tmp[row + x] = acc * inv;
          acc += src[row + ci(x + b + 1, 0, w - 1)] - src[row + ci(x - a, 0, w - 1)];
        }
      }
      for (x = 0; x < w; x++) {
        acc = 0;
        for (y = -a; y <= b; y++) acc += tmp[ci(y, 0, h - 1) * w + x];
        for (y = 0; y < h; y++) {
          out[y * w + x] = acc * inv;
          acc += tmp[ci(y + b + 1, 0, h - 1) * w + x] - tmp[ci(y - a, 0, h - 1) * w + x];
        }
      }
      return out;
    }
    function gauss(src, w, h, sigma) {
      if (sigma < 0.4) return src;
      var n = 3, wIdeal = Math.sqrt(12 * sigma * sigma / n + 1), wl = Math.floor(wIdeal);
      if (wl % 2 === 0) wl--;
      var wu = wl + 2, m = Math.round((12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4));
      var out = src;
      for (var i = 0; i < n; i++) {
        var r = ((i < m ? wl : wu) - 1) / 2;
        out = winMean(out, w, h, r, r);
      }
      return out;
    }
    function rgbF(d, n) { return [chan(d, n, 0), chan(d, n, 1), chan(d, n, 2)]; }
    function gaussRGB(ch, w, h, s) { return [gauss(ch[0], w, h, s), gauss(ch[1], w, h, s), gauss(ch[2], w, h, s)]; }
    function sobel(g, w, h) {
      var mag = new Float32Array(w * h), gxA = new Float32Array(w * h), gyA = new Float32Array(w * h);
      for (var y = 0; y < h; y++) {
        var y0 = (y > 0 ? y - 1 : 0) * w, y1 = y * w, y2 = (y < h - 1 ? y + 1 : y) * w;
        for (var x = 0; x < w; x++) {
          var x0 = x > 0 ? x - 1 : 0, x2 = x < w - 1 ? x + 1 : x;
          var gx = -g[y0 + x0] - 2 * g[y1 + x0] - g[y2 + x0] + g[y0 + x2] + 2 * g[y1 + x2] + g[y2 + x2];
          var gy = -g[y0 + x0] - 2 * g[y0 + x] - g[y0 + x2] + g[y2 + x0] + 2 * g[y2 + x] + g[y2 + x2];
          mag[y1 + x] = Math.sqrt(gx * gx + gy * gy) * 0.25;
          gxA[y1 + x] = gx; gyA[y1 + x] = gy;
        }
      }
      return { mag: mag, gx: gxA, gy: gyA };
    }
    /** Kuwahara filter (edge-preserving painterly smoothing) using box means. */
    function kuwahara(d, w, h, r) {
      var n = w * h, ch = rgbF(d, n), L = gray(d, n), L2 = new Float32Array(n), i;
      for (i = 0; i < n; i++) L2[i] = L[i] * L[i];
      var mr = winMean(ch[0], w, h, r, 0), mg = winMean(ch[1], w, h, r, 0), mb = winMean(ch[2], w, h, r, 0);
      var ml = winMean(L, w, h, r, 0), ml2 = winMean(L2, w, h, r, 0);
      var out = new Uint8ClampedArray(n * 4);
      for (var y = 0; y < h; y++) {
        var ya = y * w, yb = Math.min(h - 1, y + r) * w;
        for (var x = 0; x < w; x++) {
          var xb = Math.min(w - 1, x + r);
          var q0 = ya + x, q1 = ya + xb, q2 = yb + x, q3 = yb + xb;
          var best = q0, bv = ml2[q0] - ml[q0] * ml[q0], v;
          v = ml2[q1] - ml[q1] * ml[q1]; if (v < bv) { bv = v; best = q1; }
          v = ml2[q2] - ml[q2] * ml[q2]; if (v < bv) { bv = v; best = q2; }
          v = ml2[q3] - ml[q3] * ml[q3]; if (v < bv) { bv = v; best = q3; }
          var o = (ya + x) * 4;
          out[o] = mr[best]; out[o + 1] = mg[best]; out[o + 2] = mb[best]; out[o + 3] = 255;
        }
      }
      return out;
    }
    function kmeans(d, n, k, seed) {
      var step = Math.max(1, Math.floor(n / 6000)), pts = [], i, j;
      for (i = 0; i < n; i += step) pts.push([d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]);
      var r = seed || 7;
      function rnd() { r = (Math.imul(r, 1103515245) + 12345) & 0x7fffffff; return r / 0x7fffffff; }
      var cent = [pts[Math.floor(rnd() * pts.length)].slice()];
      var dist = new Float64Array(pts.length);
      while (cent.length < k) {
        var sum = 0;
        for (i = 0; i < pts.length; i++) {
          var best = 1e12;
          for (j = 0; j < cent.length; j++) {
            var a = pts[i][0] - cent[j][0], b = pts[i][1] - cent[j][1], c = pts[i][2] - cent[j][2], dd = a * a + b * b + c * c;
            if (dd < best) best = dd;
          }
          dist[i] = best; sum += best;
        }
        if (sum <= 0) break;
        var t = rnd() * sum;
        for (i = 0; i < pts.length; i++) { t -= dist[i]; if (t <= 0) break; }
        cent.push(pts[Math.min(i, pts.length - 1)].slice());
      }
      for (var it = 0; it < 10; it++) {
        var acc = cent.map(function () { return [0, 0, 0, 0]; });
        for (i = 0; i < pts.length; i++) {
          var bi = 0, bd = 1e12;
          for (j = 0; j < cent.length; j++) {
            var e = pts[i][0] - cent[j][0], f = pts[i][1] - cent[j][1], g = pts[i][2] - cent[j][2], q = e * e + f * f + g * g;
            if (q < bd) { bd = q; bi = j; }
          }
          acc[bi][0] += pts[i][0]; acc[bi][1] += pts[i][1]; acc[bi][2] += pts[i][2]; acc[bi][3]++;
        }
        for (j = 0; j < cent.length; j++) if (acc[j][3]) cent[j] = [acc[j][0] / acc[j][3], acc[j][1] / acc[j][3], acc[j][2] / acc[j][3]];
      }
      return cent;
    }
    /** Map every pixel to its nearest palette colour through a 15-bit lookup table. */
    function quantize(d, n, pal) {
      var lut = new Int16Array(32768).fill(-1), out = new Uint8ClampedArray(n * 4);
      for (var i = 0; i < n; i++) {
        var o = i * 4, key = (d[o] >> 3) << 10 | (d[o + 1] >> 3) << 5 | (d[o + 2] >> 3), p = lut[key];
        if (p < 0) {
          var r = (d[o] & 248) + 4, g = (d[o + 1] & 248) + 4, b = (d[o + 2] & 248) + 4, bd = 1e12;
          for (var j = 0; j < pal.length; j++) {
            var e = r - pal[j][0], f = g - pal[j][1], q = b - pal[j][2], dd = e * e * 0.3 + f * f * 0.59 + q * q * 0.11;
            if (dd < bd) { bd = dd; p = j; }
          }
          lut[key] = p;
        }
        out[o] = pal[p][0]; out[o + 1] = pal[p][1]; out[o + 2] = pal[p][2]; out[o + 3] = 255;
      }
      return out;
    }
    function hex(c) { var v = parseInt(c.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
    /** Smooth fractal value noise 0..1. */
    function vnoise(w, h, cell, seed) {
      var out = new Float32Array(w * h), amp = 1, tot = 0, oct;
      for (oct = 0; oct < 4; oct++) {
        var c = Math.max(1.5, cell / Math.pow(2, oct));
        for (var y = 0; y < h; y++) {
          var fy = y / c, iy = Math.floor(fy), ty = fy - iy; ty = ty * ty * (3 - 2 * ty);
          for (var x = 0; x < w; x++) {
            var fx = x / c, ix = Math.floor(fx), tx = fx - ix; tx = tx * tx * (3 - 2 * tx);
            var a = hash(ix, iy, seed + oct), b = hash(ix + 1, iy, seed + oct), cc = hash(ix, iy + 1, seed + oct), dd = hash(ix + 1, iy + 1, seed + oct);
            out[y * w + x] += amp * ((a + (b - a) * tx) * (1 - ty) + (cc + (dd - cc) * tx) * ty);
          }
        }
        tot += amp; amp *= 0.5;
      }
      for (var i = 0; i < out.length; i++) out[i] /= tot;
      return out;
    }
    function dodge(g, b, n) {
      var o = new Float32Array(n);
      for (var i = 0; i < n; i++) o[i] = Math.min(255, g[i] * 255 / Math.max(1, 255 - b[i]));
      return o;
    }
    function hsv(hh, s, v) {
      var i = Math.floor(hh * 6), f = hh * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
      switch (((i % 6) + 6) % 6) { case 0: return [v, t, p]; case 1: return [q, v, p]; case 2: return [p, v, t]; case 3: return [p, q, v]; case 4: return [t, p, v]; default: return [v, p, q]; }
    }

    var E = {};
    E.sketch = function (d, w, h, p, s) {
      var n = w * h, g = gray(d, n), inv = new Float32Array(n), i;
      for (i = 0; i < n; i++) inv[i] = 255 - g[i];
      var sk = dodge(g, gauss(inv, w, h, Math.max(0.6, p.blur * s)), n), out = new Uint8ClampedArray(n * 4), gm = 1 + p.dark / 35;
      for (i = 0; i < n; i++) {
        var v = 255 * Math.pow(sk[i] / 255, gm), o = i * 4;
        out[o] = out[o + 1] = out[o + 2] = v; out[o + 3] = 255;
      }
      return out;
    };
    E.colorpencil = function (d, w, h, p, s) {
      var n = w * h, g = gray(d, n), inv = new Float32Array(n), i;
      for (i = 0; i < n; i++) inv[i] = 255 - g[i];
      var sk = dodge(g, gauss(inv, w, h, Math.max(0.6, p.blur * s)), n), out = new Uint8ClampedArray(n * 4), sat = p.color / 100;
      var hs = Math.max(1, 1.6 * s);
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        i = y * w + x;
        var o = i * 4, k = Math.pow(sk[i] / 255, 1.25);
        var hatch = 0.86 + 0.14 * hash(Math.floor((x + y) / hs), 0, 3);
        for (var c = 0; c < 3; c++) {
          var tint = 255 - (255 - d[o + c]) * sat * 1.15;
          out[o + c] = c8(tint * k * (k < 0.97 ? hatch : 1));
        }
        out[o + 3] = 255;
      }
      return out;
    };
    E.charcoal = function (d, w, h, p, s) {
      var n = w * h, g = gauss(gray(d, n), w, h, Math.max(0.8, 1.4 * s)), sb = sobel(g, w, h), i;
      var out = new Uint8ClampedArray(n * 4), k = 0.6 + p.strength / 25, gr = p.grain / 100;
      var paper = [242, 238, 230];
      var tone = new Float32Array(n);
      for (i = 0; i < n; i++) {
        var t = (g[i] - 128) * 1.5 + 150;
        var e = Math.min(1, sb.mag[i] * k / 60);
        tone[i] = c8(t) * (1 - e * 0.92);
      }
      tone = gauss(tone, w, h, Math.max(0.5, 0.9 * s));
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        i = y * w + x;
        var v = tone[i] / 255, nz = (hash(x, y, 11) - 0.5) * gr * 0.5 + (hash(Math.floor(x / 2), Math.floor((y + x * 0.3) / 6), 5) - 0.5) * gr * 0.25;
        v = Math.max(0, Math.min(1, v + nz * (1 - v * 0.6)));
        var o = i * 4;
        out[o] = paper[0] * v; out[o + 1] = paper[1] * v; out[o + 2] = paper[2] * v; out[o + 3] = 255;
      }
      return out;
    };
    E.cartoon = function (d, w, h, p, s) {
      var n = w * h, sm = kuwahara(d, w, h, Math.max(1, Math.round(p.smooth * s)));
      var pal = kmeans(sm, n, Math.round(p.colors), 17);
      pal = pal.map(function (c) {
        var mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]), av = (mx + mn) / 2;
        return [c8(av + (c[0] - av) * 1.25), c8(av + (c[1] - av) * 1.25), c8(av + (c[2] - av) * 1.25)];
      });
      var q = quantize(sm, n, pal), g = gray(d, n);
      var g1 = gauss(g, w, h, Math.max(0.7, 1.0 * s)), g2 = gauss(g, w, h, Math.max(1.1, 1.7 * s));
      var t = 7 - p.edges / 100 * 5.5;
      for (var i = 0; i < n; i++) {
        var dog = g1[i] - g2[i], dk = Math.max(0, Math.min(1, (-dog - t) / (t * 0.8)));
        var o = i * 4;
        q[o] *= 1 - dk; q[o + 1] *= 1 - dk; q[o + 2] *= 1 - dk;
      }
      return q;
    };
    E.oil = function (d, w, h, p, s) {
      var n = w * h, k = kuwahara(d, w, h, Math.max(1, Math.round(p.radius * s))), L = gray(k, n);
      var sb = sobel(gauss(L, w, h, Math.max(0.5, 0.8 * s)), w, h), tex = p.texture / 100 * 0.22;
      for (var i = 0; i < n; i++) {
        var o = i * 4, av = (k[o] + k[o + 1] + k[o + 2]) / 3, rel = (sb.gx[i] - sb.gy[i]) * tex;
        for (var c = 0; c < 3; c++) k[o + c] = c8(av + (k[o + c] - av) * 1.18 + rel);
      }
      return k;
    };
    E.watercolor = function (d, w, h, p, s) {
      var n = w * h, k = kuwahara(d, w, h, Math.max(1, Math.round(p.smooth * s)));
      var ch = gaussRGB(rgbF(k, n), w, h, Math.max(0.6, (0.8 + p.bleed / 30) * s));
      var L = gray(k, n), sb = sobel(gauss(L, w, h, Math.max(0.6, 1.2 * s)), w, h);
      var paper = vnoise(w, h, 5 * Math.max(1, s), 9), fib = vnoise(w, h, 60 * Math.max(0.3, s), 21), pp = p.paper / 100;
      var out = new Uint8ClampedArray(n * 4);
      for (var i = 0; i < n; i++) {
        var o = i * 4, e = Math.min(1, sb.mag[i] / 45), dark = 1 - e * 0.38;
        var tex = 1 - pp * (0.16 * (paper[i] - 0.5) * 2 + 0.06 * (fib[i] - 0.5) * 2);
        for (var c = 0; c < 3; c++) {
          var v = ch[c][i] * 0.6 + k[o + c] * 0.4;
          v = 255 - (255 - v) * 0.82;
          out[o + c] = c8(v * dark * tex + (1 - tex) * 18);
        }
        out[o + 3] = 255;
      }
      return out;
    };
    E.popart = function (d, w, h, p, s) {
      var n = w * h, g = gauss(gray(d, n), w, h, Math.max(0.6, 1.2 * s)), out = new Uint8ClampedArray(n * 4);
      var pals = [['#141452', '#ff2e88', '#ffe14d'], ['#0b3d2e', '#16c79a', '#f9f871'], ['#3a0ca3', '#4cc9f0', '#ffd6a5'], ['#7f1d1d', '#f97316', '#fde68a']].map(function (pl) { return pl.map(hex); });
      var pw = Math.floor(w / 2), ph = Math.floor(h / 2), gut = Math.max(1, Math.round(5 * s)), con = 1 + p.contrast / 50;
      var three = p.tones >= 3, mean = 0, i;
      for (i = 0; i < n; i++) mean += g[i];
      mean /= n;
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var o = (y * w + x) * 4, px = x >= pw ? 1 : 0, py = y >= ph ? 1 : 0;
        var lx = x - px * pw, ly = y - py * ph;
        if (lx < gut / 2 && px || ly < gut / 2 && py || lx >= pw - gut / 2 && !px || ly >= ph - gut / 2 && !py || x >= 2 * pw || y >= 2 * ph) {
          out[o] = out[o + 1] = out[o + 2] = 255; out[o + 3] = 255; continue;
        }
        var sx = Math.min(w - 1, lx * 2), sy = Math.min(h - 1, ly * 2), v = (g[sy * w + sx] - mean) * con + 128;
        var pal = pals[py * 2 + px], c = three ? (v < 100 ? pal[0] : v < 170 ? pal[1] : pal[2]) : (v < 128 ? pal[0] : pal[2]);
        out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = 255;
      }
      return out;
    };
    E.halftone = function (d, w, h, p, s) {
      var n = w * h, cs = Math.max(3, p.size * s), ch = gaussRGB(rgbF(d, n), w, h, cs / 3), out = new Uint8ClampedArray(n * 4);
      var a = p.angle * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), mono = p.mode === 'mono';
      var paper = [251, 248, 240];
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var u = x * ca + y * sa, v = -x * sa + y * ca;
        var cu = (Math.floor(u / cs) + 0.5) * cs, cv = (Math.floor(v / cs) + 0.5) * cs;
        var cx = Math.round(cu * ca - cv * sa), cy = Math.round(cu * sa + cv * ca);
        var j = ci(cy, 0, h - 1) * w + ci(cx, 0, w - 1);
        var r = ch[0][j], gg = ch[1][j], b = ch[2][j], lum = (0.299 * r + 0.587 * gg + 0.114 * b) / 255;
        var rad = cs * 0.5 * Math.sqrt(Math.max(0, 1 - lum)) * 1.38;
        var dist = Math.sqrt((u - cu) * (u - cu) + (v - cv) * (v - cv));
        var cov = Math.max(0, Math.min(1, rad - dist + 0.5));
        var o = (y * w + x) * 4, ink;
        if (mono) ink = [24, 24, 32];
        else {
          var mx = Math.max(r, gg, b, 1), boost = Math.min(1.6, 200 / mx);
          ink = [r * boost * 0.85, gg * boost * 0.85, b * boost * 0.85];
          cov = Math.max(cov, 0);
        }
        out[o] = paper[0] + (ink[0] - paper[0]) * cov; out[o + 1] = paper[1] + (ink[1] - paper[1]) * cov; out[o + 2] = paper[2] + (ink[2] - paper[2]) * cov; out[o + 3] = 255;
      }
      return out;
    };
    var PALS = {
      gameboy: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
      pico8: ['#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8', '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ffccaa'],
      gray: ['#000000', '#3a3a3a', '#6e6e6e', '#a3a3a3', '#d6d6d6', '#ffffff'],
      nes: ['#000000', '#fcfcfc', '#f8f8f8', '#bcbcbc', '#7c7c7c', '#a4e4fc', '#3cbcfc', '#0078f8', '#0000fc', '#b8b8f8', '#6888fc', '#0058f8', '#d8b8f8', '#9878f8', '#6844fc', '#f8b8f8', '#f878f8', '#d800cc', '#f8a4c0', '#f85898', '#e40058', '#f0d0b0', '#f87858', '#f83800', '#fce0a8', '#fca044', '#e45c10', '#f8d878', '#f8b800', '#ac7c00', '#d8f878', '#b8f818', '#00b800', '#b8f8b8', '#58d854', '#00a800', '#b8f8d8', '#58f898', '#00a844', '#00fcfc', '#00e8d8', '#008888']
    };
    E.pixel = function (d, w, h, p, s) {
      var b = Math.max(2, Math.round(p.block * s)), bw = Math.ceil(w / b), bh = Math.ceil(h / b), avg = new Uint8ClampedArray(bw * bh * 4);
      for (var by = 0; by < bh; by++) for (var bx = 0; bx < bw; bx++) {
        var r = 0, g = 0, bl = 0, c = 0;
        for (var y = by * b; y < Math.min(h, by * b + b); y++) for (var x = bx * b; x < Math.min(w, bx * b + b); x++) {
          var o = (y * w + x) * 4; r += d[o]; g += d[o + 1]; bl += d[o + 2]; c++;
        }
        var q = (by * bw + bx) * 4;
        avg[q] = r / c; avg[q + 1] = g / c; avg[q + 2] = bl / c; avg[q + 3] = 255;
      }
      var pal = p.palette === 'auto' ? kmeans(avg, bw * bh, Math.round(p.colors), 5) : PALS[p.palette] ? PALS[p.palette].map(hex) : null;
      var qa = pal ? quantize(avg, bw * bh, pal) : avg, out = new Uint8ClampedArray(w * h * 4);
      for (var yy = 0; yy < h; yy++) {
        var row = Math.floor(yy / b) * bw;
        for (var xx = 0; xx < w; xx++) {
          var src = (row + Math.floor(xx / b)) * 4, dst = (yy * w + xx) * 4;
          out[dst] = qa[src]; out[dst + 1] = qa[src + 1]; out[dst + 2] = qa[src + 2]; out[dst + 3] = 255;
        }
      }
      return out;
    };
    E.vintage = function (d, w, h, p, s) {
      var n = w * h, out = new Uint8ClampedArray(n * 4), am = p.amount / 100, gr = p.grain / 100, vg = p.vignette / 100;
      var cx = w / 2, cy = h / 2, md = Math.sqrt(cx * cx + cy * cy), gs = Math.max(1, Math.round(1.2 * s));
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var o = (y * w + x) * 4, r = d[o], g = d[o + 1], b = d[o + 2];
        var sr = 0.393 * r + 0.769 * g + 0.189 * b, sg = 0.349 * r + 0.686 * g + 0.168 * b, sbb = 0.272 * r + 0.534 * g + 0.131 * b;
        r = r + (sr - r) * am * 0.75; g = g + (sg - g) * am * 0.75; b = b + (sbb - b) * am * 0.75;
        r = r * 0.86 + 28 + 8 * am; g = g * 0.86 + 24; b = b * 0.82 + 22 - 6 * am;
        var dd = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) / md, vf = 1 - vg * 0.75 * Math.pow(dd, 2.2);
        var nz = (hash(Math.floor(x / gs), Math.floor(y / gs), 3) - 0.5) * 60 * gr;
        out[o] = c8(r * vf + nz); out[o + 1] = c8(g * vf + nz); out[o + 2] = c8(b * vf + nz); out[o + 3] = 255;
      }
      return out;
    };
    E.neon = function (d, w, h, p, s) {
      var n = w * h, g = gauss(gray(d, n), w, h, Math.max(0.7, 1.1 * s)), sb = sobel(g, w, h), i;
      var th = 0.5 + p.thickness / 40, rainbow = p.colors === 'rainbow';
      var e = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
      for (i = 0; i < n; i++) {
        var m = Math.min(1, Math.max(0, (sb.mag[i] * th - 6) / 40));
        if (m <= 0) continue;
        var col;
        if (rainbow) col = hsv((Math.atan2(sb.gy[i], sb.gx[i]) / (2 * Math.PI) + 1) % 1, 0.9, 1);
        else {
          var o = i * 4, mx = Math.max(d[o], d[o + 1], d[o + 2], 1);
          col = [d[o] / mx, d[o + 1] / mx, d[o + 2] / mx];
        }
        e[0][i] = col[0] * m * 255; e[1][i] = col[1] * m * 255; e[2][i] = col[2] * m * 255;
      }
      var gl = gaussRGB(e, w, h, Math.max(1, (2 + p.glow / 12) * s)), gk = 1 + p.glow / 40;
      var out = new Uint8ClampedArray(n * 4);
      for (i = 0; i < n; i++) {
        var q = i * 4;
        out[q] = c8(e[0][i] + gl[0][i] * gk + 6); out[q + 1] = c8(e[1][i] + gl[1][i] * gk + 4); out[q + 2] = c8(e[2][i] + gl[2][i] * gk + 14); out[q + 3] = 255;
      }
      return out;
    };
    return {
      run: function (fx, data, w, h, params) {
        var s = Math.max(w, h) / 1000;
        if (!E[fx]) throw new Error('Unknown effect ' + fx);
        var out = E[fx](data, w, h, params || {}, s);
        // keep the source alpha
        for (var i = 3; i < out.length; i += 4) out[i] = data[i];
        return out;
      }
    };
  }

  var FX_LIST = [
    { id: 'sketch', name: 'Pencil sketch', ctl: [['blur', 'Stroke softness', 1, 20, 6], ['dark', 'Darkness', 0, 100, 35]] },
    { id: 'colorpencil', name: 'Colour pencil', ctl: [['blur', 'Stroke softness', 1, 20, 5], ['color', 'Colour amount', 0, 100, 75]] },
    { id: 'charcoal', name: 'Charcoal', ctl: [['strength', 'Line strength', 0, 100, 55], ['grain', 'Paper grain', 0, 100, 45]] },
    { id: 'cartoon', name: 'Cartoon', ctl: [['smooth', 'Smoothing', 1, 10, 4], ['colors', 'Colours', 4, 16, 8], ['edges', 'Outline strength', 0, 100, 60]] },
    { id: 'oil', name: 'Oil painting', ctl: [['radius', 'Brush size', 2, 14, 5], ['texture', 'Canvas texture', 0, 100, 45]] },
    { id: 'watercolor', name: 'Watercolour', ctl: [['smooth', 'Wash size', 1, 10, 4], ['bleed', 'Colour bleed', 0, 100, 45], ['paper', 'Paper texture', 0, 100, 55]] },
    { id: 'popart', name: 'Pop art', ctl: [['contrast', 'Contrast', 0, 100, 45], ['tones', 'Tones', 2, 3, 3]] },
    { id: 'halftone', name: 'Halftone dots', ctl: [['size', 'Dot size', 4, 30, 10], ['angle', 'Screen angle', 0, 90, 45]], opt: ['mode', 'Ink', [['mono', 'Black'], ['color', 'Colour']], 'mono'] },
    { id: 'pixel', name: 'Pixel art', ctl: [['block', 'Pixel size', 3, 40, 10], ['colors', 'Colours (auto)', 4, 32, 16]], opt: ['palette', 'Palette', [['auto', 'Auto'], ['pico8', 'PICO-8'], ['gameboy', 'Game Boy'], ['nes', 'NES'], ['gray', 'Grey']], 'auto'] },
    { id: 'vintage', name: 'Vintage', ctl: [['amount', 'Strength', 0, 100, 70], ['grain', 'Film grain', 0, 100, 40], ['vignette', 'Vignette', 0, 100, 60]] },
    { id: 'neon', name: 'Neon edges', ctl: [['glow', 'Glow', 0, 100, 60], ['thickness', 'Line strength', 0, 100, 45]], opt: ['colors', 'Colours', [['rainbow', 'Rainbow'], ['photo', 'Photo']], 'rainbow'] }
  ];
  function fxDefaults(fx) {
    var p = {};
    fx.ctl.forEach(function (c) { p[c[0]] = c[4]; });
    if (fx.opt) p[fx.opt[0]] = fx.opt[3];
    return p;
  }

  var FX_MAIN = null, FX_WORKER, fxSeq = 0, fxWait = {};
  function fxMain() { return FX_MAIN || (FX_MAIN = fxLib()); }
  function fxWorker() {
    if (FX_WORKER !== undefined) return FX_WORKER;
    try {
      var src = 'var FX=(' + fxLib.toString() + ')();onmessage=function(e){var m=e.data;try{var o=FX.run(m.fx,m.data,m.w,m.h,m.p);postMessage({id:m.id,data:o},[o.buffer]);}catch(err){postMessage({id:m.id,error:String(err&&err.message||err)});}};';
      var url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      FX_WORKER = new Worker(url);
      setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
      FX_WORKER.onmessage = function (e) {
        var m = e.data, w = fxWait[m.id];
        if (!w) return;
        delete fxWait[m.id];
        if (m.error) w.rej(new Error(m.error)); else w.res(m.data);
      };
      FX_WORKER.onerror = function (e) {
        Object.keys(fxWait).forEach(function (k) { fxWait[k].rej(new Error('The effect worker stopped: ' + (e.message || 'out of memory?'))); delete fxWait[k]; });
      };
    } catch (e) { FX_WORKER = null; }
    return FX_WORKER;
  }
  /** Apply an effect to a canvas; resolves a new canvas of the same size. Worker for > 2 MP (or always if available). */
  function applyFx(canvas, fx, params, forceWorker) {
    var w = canvas.width, hh = canvas.height, id = c2d(canvas).getImageData(0, 0, w, hh);
    var wk = (forceWorker || w * hh > 2e6) ? fxWorker() : null;
    var p = wk ? new Promise(function (res, rej) {
      var n = ++fxSeq;
      fxWait[n] = { res: res, rej: rej };
      wk.postMessage({ id: n, fx: fx, data: id.data, w: w, h: hh, p: params }, [id.data.buffer]);
    }) : new Promise(function (res) { setTimeout(function () { res(fxMain().run(fx, id.data, w, hh, params)); }, 0); });
    return p.then(function (data) {
      var out = mk(w, hh);
      c2d(out).putImageData(new ImageData(data, w, hh), 0, 0);
      return out;
    });
  }

  register('photo-art-effects', function (root, ctx) {
    injectCSS();
    var MAX_PX = 12e6;
    function start() {
      root.innerHTML = '';
      root.appendChild(BT.dropzone({
        accept: 'image/*', title: 'Choose a photo', icon: 'brush', hint: 'or drag and drop it here · JPG, PNG, WebP',
        color: ctx.category && ctx.category.color, onFiles: function (f) { open(f[0]); }
      }));
      root.appendChild(pasteHint());
    }
    function open(file) {
      root.innerHTML = '';
      root.appendChild(loadingEl());
      decode(file, 12000).then(function (im) {
        if (im.w * im.h > MAX_PX) {
          var s = Math.sqrt(MAX_PX / (im.w * im.h)), c = mk(im.w * s, im.h * s);
          var x = c2d(c); x.imageSmoothingQuality = 'high'; x.drawImage(im.canvas, 0, 0, c.width, c.height);
          im.canvas = c; im.w = c.width; im.h = c.height; im.capped = true;
        }
        build(im);
      }).catch(function (e) { BT.toast(e.message || 'Could not read this image', 'error'); start(); });
    }
    function build(im) {
      root.innerHTML = '';
      var fx = FX_LIST[0], params = fxDefaults(fx), fmt = 'image/png', paramsBy = {};
      root.appendChild(headBar('brush', im.name, '<span class="badge">' + im.w + ' × ' + im.h + ' px</span>' + (im.capped ? '<span class="badge warn">Scaled to 12 MP</span>' : ''), start));
      var ed = editor(root);
      // preview copy (≤ 1200 px)
      var ps = Math.min(1, 1200 / Math.max(im.w, im.h)), prev = mk(im.w * ps, im.h * ps);
      var px = c2d(prev); px.imageSmoothingQuality = 'high'; px.drawImage(im.canvas, 0, 0, prev.width, prev.height);
      var ts = Math.min(1, 150 / Math.max(im.w, im.h)), tsrc = mk(im.w * ts, im.h * ts);
      c2d(tsrc).drawImage(prev, 0, 0, tsrc.width, tsrc.height);

      var before = mk(prev.width, prev.height);
      c2d(before).drawImage(prev, 0, 0);
      var after = mk(prev.width, prev.height);
      c2d(after).drawImage(prev, 0, 0);
      after.className = 'dsn-after';
      var slider = input('range', 50, { min: 0, max: 100, step: 1, 'aria-label': 'Compare original and effect' });
      var cmp = h('div.dsn-compare', null, [before, after, h('div.dsn-bar'), h('div.dsn-knob', { html: BT.icon('git-compare') }),
        h('span.dsn-tag', { text: 'Original', style: { left: '10px' } }), h('span.dsn-tag', { text: 'Effect', style: { right: '10px' } }), slider]);
      slider.addEventListener('input', function () { cmp.style.setProperty('--pos', slider.value + '%'); });
      var busy = h('div.dsn-busy', { html: '<span class="spinner"></span> Applying…', role: 'status' });
      ed.stage.appendChild(cmp);
      ed.stage.appendChild(busy);
      ed.under.innerHTML = BT.icon('git-compare') + '<span>Drag the slider to compare the original with the effect.</span>';

      // effect thumbnails
      var grid = h('div.dsn-fx', { role: 'group', 'aria-label': 'Effects' });
      FX_LIST.forEach(function (f) {
        var tc = mk(tsrc.width, tsrc.height);
        c2d(tc).drawImage(tsrc, 0, 0);
        var b = h('button', { type: 'button', 'aria-pressed': String(f === fx), 'data-fx': f.id }, [tc, h('span', { text: f.name })]);
        b.addEventListener('click', function () {
          paramsBy[fx.id] = params;
          fx = f;
          params = paramsBy[f.id] || fxDefaults(f);
          BT.$$('button', grid).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          buildControls();
          update();
        });
        grid.appendChild(b);
        b._tc = tc;
      });
      // thumbnails rendered one after another so the first preview is not delayed
      var thumbs = BT.$$('button', grid);
      (function next(i) {
        if (i >= FX_LIST.length || !root.isConnected) return;
        applyFx(tsrc, FX_LIST[i].id, fxDefaults(FX_LIST[i]), true).then(function (c) {
          c2d(thumbs[i]._tc).drawImage(c, 0, 0);
          next(i + 1);
        }).catch(function () { next(i + 1); });
      })(0);

      ed.panel.appendChild(h('h3', { text: 'Effect' }));
      ed.panel.appendChild(grid);
      var ctlBox = h('div');
      ed.panel.appendChild(sec('Adjust', [ctlBox]));
      function buildControls() {
        ctlBox.innerHTML = '';
        ctlBox.parentNode.querySelector('h4').textContent = fx.name;
        fx.ctl.forEach(function (c) {
          ctlBox.appendChild(range(c[1], c[2], c[3], 1, params[c[0]], null, function (v) { params[c[0]] = v; updateSoon(); }));
        });
        if (fx.opt) {
          ctlBox.appendChild(segField(fx.opt[1], fx.opt[2], params[fx.opt[0]], function (v) { params[fx.opt[0]] = v; update(); }));
        }
        ctlBox.appendChild(btn('btn-ghost btn-sm', 'rotate-ccw', 'Reset to defaults', function () { params = fxDefaults(fx); buildControls(); update(); }));
      }

      // preview job queue: at most one running, newest request wins
      var running = false, queued = false;
      function update() {
        if (running) { queued = true; return; }
        running = true; queued = false;
        busy.classList.add('on');
        var f = fx.id, p = JSON.parse(JSON.stringify(params));
        applyFx(prev, f, p, true).then(function (c) {
          c2d(after).clearRect(0, 0, after.width, after.height);
          c2d(after).drawImage(c, 0, 0);
        }).catch(function (e) { BT.toast(e.message, 'error'); }).then(function () {
          running = false;
          busy.classList.remove('on');
          if (queued) update();
        });
      }
      var updateSoon = BT.debounce(update, 90);

      var fmtSeg = segField('Format', [['image/png', 'PNG'], ['image/jpeg', 'JPG']], fmt, function (v) { fmt = v; });
      var dl = btn('btn-primary', 'download', 'Download full size', function () {
        BT.busy(dl, function () {
          return applyFx(im.canvas, fx.id, JSON.parse(JSON.stringify(params)), true).then(function (out) {
            return saveCanvas(out, fmt, BT.baseName(im.name) + '-' + fx.id, 0.92);
          });
        }, 'Rendering ' + im.w + ' × ' + im.h + '…');
      });
      dl.setAttribute('data-download', '');
      ed.panel.appendChild(sec('Download', [fmtSeg, h('p.muted.small', { text: 'The effect is applied to the full ' + im.w + ' × ' + im.h + ' px image on your device. Large photos can take a few seconds.' }),
        h('div.dsn-actions', null, [dl, btn('', 'rotate-ccw', 'Start over', start)])]));
      buildControls();
      update();
    }
    pasteSupport(root, function (f) { open(f[0]); });
    start();
  });

  // ================================================== Shared: icon picker
  var ICON_SKIP = { x: 1, menu: 1, 'chevron-right': 1, 'chevron-down': 1, 'grip-vertical': 1, minus: 1, 'arrow-left': 1, 'loader-circle': 1, 'mouse-pointer-2': 1, 'undo-2': 1, 'redo-2': 1 };
  function pickerIcons() { return iconNames().filter(function (n) { return !ICON_SKIP[n]; }); }
  function iconPicker(current, onPick, label) {
    var q = input('search', '', { placeholder: 'Search icons (e.g. heart, star, code)…', 'aria-label': 'Search icons', autocomplete: 'off' });
    var grid = h('div.dsn-icons', { role: 'group', 'aria-label': label || 'Icons' });
    var count = h('span.hint');
    var cur = current;
    function render() {
      var term = q.value.trim().toLowerCase().replace(/\s+/g, '-');
      var list = pickerIcons().filter(function (n) { return !term || n.indexOf(term) > -1; });
      grid.innerHTML = list.map(function (n) {
        return '<button type="button" data-n="' + esc(n) + '" aria-label="' + esc(n.replace(/-/g, ' ')) + '" title="' + esc(n.replace(/-/g, ' ')) + '" aria-pressed="' + (n === cur) + '">' + BT.icon(n) + '</button>';
      }).join('') || '<p class="muted small" style="grid-column:1/-1;margin:6px">No icons match.</p>';
      count.textContent = list.length + ' icons';
    }
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-n]');
      if (!b) return;
      cur = b.getAttribute('data-n');
      BT.$$('button', grid).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      onPick(cur);
    });
    q.addEventListener('input', render);
    render();
    var wrap = h('div', null, [h('div.field', null, [q, count]), grid]);
    wrap.set = function (n) { cur = n; render(); };
    return wrap;
  }

  // ===================================================== Social post maker
  var SOCIAL_PRESETS = [
    ['ig-square', 'Instagram post 1:1', 1080, 1080], ['ig-portrait', 'Instagram post 4:5', 1080, 1350],
    ['ig-story', 'Instagram story / reel', 1080, 1920], ['fb', 'Facebook post', 1200, 630],
    ['linkedin', 'LinkedIn post', 1200, 627], ['youtube', 'YouTube thumbnail', 1280, 720],
    ['whatsapp', 'WhatsApp status', 1080, 1920], ['x', 'X (Twitter) post', 1600, 900]
  ];
  function presetById(id) { for (var i = 0; i < SOCIAL_PRESETS.length; i++) if (SOCIAL_PRESETS[i][0] === id) return SOCIAL_PRESETS[i]; return SOCIAL_PRESETS[0]; }

  /** Templates return {bg, layers} for a W×H canvas. */
  function T(type, o) { return Object.assign({ type: type }, o); }
  function txt(o) {
    return T('text', Object.assign({ font: 'inter', weight: 700, color: '#ffffff', align: 'center', shadow: false, pill: false, pillColor: '#000000', lh: 1.12, upper: false, italic: false }, o));
  }
  var TEMPLATES = [
    { id: 'sale', name: 'Sale announcement', make: function (W, H, u) {
      return { bg: { type: 'linear', c1: '#f97316', c2: '#db2777', angle: 145 }, layers: [
        T('shape', { shape: 'circle', x: W * 0.86, y: H * 0.12, w: 520 * u, h: 520 * u, fill: '#ffffff', opacity: 0.12, radius: 0 }),
        T('shape', { shape: 'circle', x: W * 0.08, y: H * 0.92, w: 380 * u, h: 380 * u, fill: '#ffffff', opacity: 0.1, radius: 0 }),
        T('icon', { name: 'tag', x: W / 2, y: H * 0.2, size: 120 * u, color: '#ffffff', sw: 2, bg: 'none', bgColor: '#ffffff' }),
        txt({ text: 'MEGA SALE', x: W / 2, y: H * 0.4, w: W * 0.9, size: 190 * u, font: 'impact', weight: 400, shadow: true }),
        txt({ text: 'UP TO 50% OFF', x: W / 2, y: H * 0.58, w: W * 0.8, size: 70 * u, weight: 800, color: '#db2777', pill: true, pillColor: '#ffffff' }),
        txt({ text: 'This weekend only · Shop now', x: W / 2, y: H * 0.74, w: W * 0.85, size: 46 * u, weight: 500 })
      ] };
    } },
    { id: 'quote', name: 'Quote', make: function (W, H, u) {
      return { bg: { type: 'solid', c1: '#0f172a', c2: '#1e293b', angle: 180 }, layers: [
        txt({ text: '“', x: W / 2, y: H * 0.26, w: 300 * u, size: 300 * u, font: 'georgia', color: '#fbbf24', weight: 700 }),
        txt({ text: 'The best way to predict the future is to create it.', x: W / 2, y: H * 0.5, w: W * 0.8, size: 72 * u, font: 'georgia', weight: 400, italic: true, lh: 1.25 }),
        T('shape', { shape: 'rect', x: W / 2, y: H * 0.7, w: 120 * u, h: 6 * u, fill: '#fbbf24', opacity: 1, radius: 3 * u }),
        txt({ text: 'Your Name', x: W / 2, y: H * 0.76, w: W * 0.7, size: 40 * u, weight: 600, color: '#cbd5e1', upper: true })
      ] };
    } },
    { id: 'event', name: 'Event / webinar', make: function (W, H, u) {
      return { bg: { type: 'radial', c1: '#6d28d9', c2: '#0b1023', angle: 0 }, layers: [
        txt({ text: 'LIVE WEBINAR', x: W / 2, y: H * 0.2, w: W * 0.6, size: 38 * u, weight: 800, color: '#0b1023', pill: true, pillColor: '#a5f3fc' }),
        txt({ text: 'Grow your business online', x: W / 2, y: H * 0.42, w: W * 0.82, size: 104 * u, weight: 800, lh: 1.05 }),
        T('icon', { name: 'calendar-days', x: W / 2, y: H * 0.62, size: 70 * u, color: '#a5f3fc', sw: 2, bg: 'none', bgColor: '#ffffff' }),
        txt({ text: 'Saturday · 6:00 PM IST', x: W / 2, y: H * 0.7, w: W * 0.8, size: 48 * u, weight: 600, color: '#e0e7ff' }),
        txt({ text: 'Register free →', x: W / 2, y: H * 0.83, w: W * 0.6, size: 44 * u, weight: 700, color: '#ffffff', pill: true, pillColor: '#7c3aed' })
      ] };
    } },
    { id: 'hiring', name: 'We are hiring', make: function (W, H, u) {
      return { bg: { type: 'solid', c1: '#eef2ff', c2: '#e0e7ff', angle: 0 }, layers: [
        T('shape', { shape: 'rect', x: W / 2, y: H * 0.5, w: W * 0.86, h: H * 0.8, fill: '#ffffff', opacity: 1, radius: 40 * u }),
        T('icon', { name: 'briefcase', x: W / 2, y: H * 0.23, size: 90 * u, color: '#ffffff', sw: 2, bg: 'circle', bgColor: '#4f46e5' }),
        txt({ text: "WE'RE HIRING", x: W / 2, y: H * 0.39, w: W * 0.8, size: 96 * u, weight: 800, color: '#4f46e5' }),
        txt({ text: 'Frontend Developer', x: W / 2, y: H * 0.51, w: W * 0.78, size: 60 * u, weight: 700, color: '#0f172a' }),
        txt({ text: 'Remote · Full time · 2+ years', x: W / 2, y: H * 0.6, w: W * 0.78, size: 38 * u, weight: 500, color: '#475569' }),
        txt({ text: 'Apply: careers@yourbrand.com', x: W / 2, y: H * 0.76, w: W * 0.78, size: 36 * u, weight: 700, color: '#ffffff', pill: true, pillColor: '#0f172a' })
      ] };
    } },
    { id: 'festival', name: 'Festival greeting', make: function (W, H, u) {
      return { bg: { type: 'radial', c1: '#9a3412', c2: '#1c0a05', angle: 0 }, layers: [
        T('icon', { name: 'sparkles', x: W * 0.2, y: H * 0.18, size: 90 * u, color: '#fde68a', sw: 1.5, bg: 'none', bgColor: '#ffffff' }),
        T('icon', { name: 'star', x: W * 0.82, y: H * 0.26, size: 60 * u, color: '#fbbf24', sw: 1.5, bg: 'none', bgColor: '#ffffff' }),
        T('icon', { name: 'flame', x: W / 2, y: H * 0.3, size: 130 * u, color: '#fbbf24', sw: 1.6, bg: 'none', bgColor: '#ffffff' }),
        txt({ text: 'Happy Diwali', x: W / 2, y: H * 0.5, w: W * 0.9, size: 140 * u, font: 'palatino', weight: 700, color: '#fde68a', shadow: true }),
        txt({ text: 'Wishing you light, joy and prosperity', x: W / 2, y: H * 0.63, w: W * 0.8, size: 46 * u, font: 'georgia', weight: 400, italic: true, color: '#fff7ed' }),
        txt({ text: 'From all of us at Your Brand', x: W / 2, y: H * 0.8, w: W * 0.8, size: 34 * u, weight: 600, color: '#fdba74', upper: true })
      ] };
    } },
    { id: 'launch', name: 'Product launch', make: function (W, H, u) {
      return { bg: { type: 'linear', c1: '#0ea5e9', c2: '#6366f1', angle: 160 }, layers: [
        txt({ text: 'NEW', x: W / 2, y: H * 0.16, w: 200 * u, size: 40 * u, weight: 800, color: '#4f46e5', pill: true, pillColor: '#ffffff' }),
        txt({ text: 'Introducing', x: W / 2, y: H * 0.27, w: W * 0.8, size: 54 * u, weight: 500, color: '#e0f2fe' }),
        txt({ text: 'Your Product 2.0', x: W / 2, y: H * 0.38, w: W * 0.85, size: 110 * u, weight: 800, lh: 1.05, shadow: true }),
        T('shape', { shape: 'rect', x: W / 2, y: H * 0.66, w: W * 0.6, h: H * 0.3, fill: '#ffffff', opacity: 0.18, radius: 36 * u }),
        T('icon', { name: 'sparkles', x: W / 2, y: H * 0.66, size: 140 * u, color: '#ffffff', sw: 1.6, bg: 'none', bgColor: '#ffffff' }),
        txt({ text: 'Available now · Link in bio', x: W / 2, y: H * 0.88, w: W * 0.8, size: 40 * u, weight: 600 })
      ] };
    } },
    { id: 'thanks', name: 'Milestone / thank you', make: function (W, H, u) {
      return { bg: { type: 'linear', c1: '#fdf2f8', c2: '#fce7f3', angle: 180 }, layers: [
        T('icon', { name: 'heart', x: W / 2, y: H * 0.2, size: 100 * u, color: '#ffffff', sw: 2, bg: 'circle', bgColor: '#db2777' }),
        txt({ text: '10K', x: W / 2, y: H * 0.42, w: W * 0.8, size: 260 * u, weight: 800, color: '#be185d' }),
        txt({ text: 'Thank you for 10,000 followers!', x: W / 2, y: H * 0.6, w: W * 0.8, size: 60 * u, weight: 700, color: '#0f172a' }),
        txt({ text: '@yourbrand', x: W / 2, y: H * 0.78, w: W * 0.6, size: 40 * u, weight: 600, color: '#be185d' })
      ] };
    } }
  ];

  register('social-post-maker', function (root, ctx) {
    injectCSS();
    var mode = 'grid', cleanup = null;
    function shell() {
      if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
      root.innerHTML = '';
      var tabs = seg([['grid', 'Instagram grid splitter'], ['design', 'Post & story designer']], mode, function (v) { mode = v; shell(); }, 'Tool mode');
      tabs.classList.add('dsn-tabs');
      root.appendChild(tabs);
      var body = h('div');
      root.appendChild(body);
      cleanup = mode === 'grid' ? gridSplitter(body) : designer(body);
    }

    // ------------------------------------------------------- grid splitter
    function gridSplitter(body) {
      var S = null, view = null;
      function start() {
        if (view) { view.destroy(); view = null; }
        body.innerHTML = '';
        body.appendChild(BT.dropzone({ accept: 'image/*', title: 'Choose a photo to split', icon: 'grid-3x3', hint: 'or drag and drop it here · wide or tall photos work best',
          color: ctx.category && ctx.category.color, onFiles: function (f) { open(f[0]); } }));
        body.appendChild(pasteHint());
      }
      function open(file) {
        body.innerHTML = '';
        body.appendChild(loadingEl());
        decode(file, 6000).then(function (im) {
          S = { im: im, rows: 3, shape: '45', zoom: 1, ox: 0, oy: 0, q: 0.92 };
          build();
        }).catch(function (e) { BT.toast(e.message, 'error'); start(); });
      }
      function tile() { return S.shape === '45' ? { w: 1080, h: 1350 } : { w: 1080, h: 1080 }; }
      function total() { var t = tile(); return { w: t.w * 3, h: t.h * S.rows }; }
      /** Source crop rect (in image px) for the whole grid. */
      function crop() {
        var t = total(), im = S.im, ar = t.w / t.h;
        var cw = im.w, ch = cw / ar;
        if (ch > im.h) { ch = im.h; cw = ch * ar; }
        cw /= S.zoom; ch /= S.zoom;
        var x = (im.w - cw) / 2 + S.ox * (im.w - cw) / 2, y = (im.h - ch) / 2 + S.oy * (im.h - ch) / 2;
        return { x: x, y: y, w: cw, h: ch };
      }
      function draw(c, k) {
        var t = total(), cr = crop();
        c.save();
        c.scale(k, k);
        c.imageSmoothingQuality = 'high';
        c.drawImage(S.im.canvas, cr.x, cr.y, cr.w, cr.h, 0, 0, t.w, t.h);
        var tl = tile();
        c.strokeStyle = 'rgba(255,255,255,.95)';
        c.lineWidth = 3 / k;
        c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 4 / k;
        for (var i = 1; i < 3; i++) { c.beginPath(); c.moveTo(i * tl.w, 0); c.lineTo(i * tl.w, t.h); c.stroke(); }
        for (var j = 1; j < S.rows; j++) { c.beginPath(); c.moveTo(0, j * tl.h); c.lineTo(t.w, j * tl.h); c.stroke(); }
        c.shadowColor = 'transparent';
        var n = S.rows * 3;
        c.font = fontStr(800, Math.min(tl.w, tl.h) * 0.09, 'inter');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        for (var r = 0; r < S.rows; r++) for (var cc = 0; cc < 3; cc++) {
          var order = n - (r * 3 + cc), x = cc * tl.w + tl.w - tl.w * 0.09, y = r * tl.h + tl.w * 0.09, rr = tl.w * 0.065;
          c.fillStyle = 'rgba(0,0,0,.6)';
          c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#fff';
          c.fillText(String(order), x, y + 2 / k);
        }
        c.restore();
      }
      function tiles() {
        var t = tile(), cr = crop(), out = [], sw = cr.w / 3, sh = cr.h / S.rows;
        for (var r = 0; r < S.rows; r++) for (var c = 0; c < 3; c++) {
          var cv = mk(t.w, t.h), x = c2d(cv);
          x.imageSmoothingQuality = 'high';
          x.drawImage(S.im.canvas, cr.x + c * sw, cr.y + r * sh, sw, sh, 0, 0, t.w, t.h);
          out.push({ r: r, c: c, canvas: cv, order: S.rows * 3 - (r * 3 + c) });
        }
        return out;
      }
      var igGrid;
      function refreshProfile() {
        if (!igGrid) return;
        igGrid.innerHTML = '';
        var t = tile(), cr = crop(), sw = cr.w / 3, sh = cr.h / S.rows, pw = 120, phh = Math.round(pw * t.h / t.w);
        for (var r = 0; r < S.rows; r++) for (var c = 0; c < 3; c++) {
          var cv = mk(pw, phh);
          c2d(cv).drawImage(S.im.canvas, cr.x + c * sw, cr.y + r * sh, sw, sh, 0, 0, pw, phh);
          igGrid.appendChild(cv);
        }
        for (var i = 0; i < 3; i++) igGrid.appendChild(h('div.old', { style: { aspectRatio: t.w + '/' + t.h }, 'aria-hidden': 'true' }));
      }
      var refreshProfileSoon = BT.debounce(refreshProfile, 120);
      function build() {
        body.innerHTML = '';
        body.appendChild(headBar('grid-3x3', S.im.name, '<span class="badge">' + S.im.ow + ' × ' + S.im.oh + ' px</span>', start));
        var ed = editor(body);
        view = canvasView(ed.stage, { label: 'Grid preview. Drag to reposition the photo, scroll to zoom, or use arrow keys.', size: total, draw: draw });
        var cv = view.canvas, drag = null;
        cv.addEventListener('pointerdown', function (e) {
          cv.setPointerCapture(e.pointerId);
          drag = { x: e.clientX, y: e.clientY, ox: S.ox, oy: S.oy };
        });
        cv.addEventListener('pointermove', function (e) {
          if (!drag) return;
          var cr = crop(), r = cv.getBoundingClientRect(), t = total();
          var pxPerSrc = r.width / cr.w;
          var spanX = (S.im.w - cr.w) / 2, spanY = (S.im.h - cr.h) / 2;
          if (spanX > 0.5) S.ox = clamp(drag.ox - (e.clientX - drag.x) / pxPerSrc / spanX, -1, 1);
          if (spanY > 0.5) S.oy = clamp(drag.oy - (e.clientY - drag.y) / pxPerSrc / spanY, -1, 1);
          void t;
          view.render(); refreshProfileSoon();
        });
        cv.addEventListener('pointerup', function () { drag = null; refreshProfile(); });
        cv.addEventListener('pointercancel', function () { drag = null; });
        cv.addEventListener('wheel', function (e) { e.preventDefault(); S.zoom = clamp(S.zoom * (e.deltaY < 0 ? 1.06 : 1 / 1.06), 1, 4); zoom.set(S.zoom); view.render(); refreshProfileSoon(); }, { passive: false });
        cv.addEventListener('keydown', function (e) {
          var m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
          if (!m) return;
          e.preventDefault();
          S.ox = clamp(S.ox + m[0] * 0.05, -1, 1); S.oy = clamp(S.oy + m[1] * 0.05, -1, 1);
          view.render(); refreshProfileSoon();
        });
        ed.under.innerHTML = BT.icon('move') + '<span>Drag to choose the crop · numbers show the posting order</span>';

        var pn = ed.panel;
        pn.appendChild(h('h3', { text: 'Grid' }));
        pn.appendChild(segField('Rows (3 photos each)', [['1', '3 × 1'], ['2', '3 × 2'], ['3', '3 × 3'], ['4', '3 × 4']], String(S.rows), function (v) { S.rows = +v; view.render(); refreshProfile(); }));
        pn.appendChild(segField('Tile size', [['45', '1080 × 1350 (4:5)'], ['11', '1080 × 1080 (1:1)']], S.shape, function (v) { S.shape = v; view.render(); refreshProfile(); }));
        var zoom = range('Zoom', 1, 4, 0.01, 1, function (v) { return Math.round(v * 100) + '%'; }, function (v) { S.zoom = v; view.render(); refreshProfileSoon(); });
        pn.appendChild(zoom);
        pn.appendChild(btn('btn-ghost btn-sm', 'refresh-cw', 'Centre photo', function () { S.ox = 0; S.oy = 0; S.zoom = 1; zoom.set(1); view.render(); refreshProfile(); }));
        igGrid = h('div.grid');
        var ig = h('div.dsn-ig', { 'aria-label': 'Profile preview' }, [
          h('div.top', { html: '<span class="av"><i></i></span><div class="st"><span><b>12</b>posts</span><span><b>1,204</b>followers</span><span><b>310</b>following</span></div>' }),
          h('div.bio', { html: '<b>yourprofile</b>How your grid will look on your profile' }),
          igGrid
        ]);
        pn.appendChild(sec('Profile preview', [ig]));
        pn.appendChild(sec('How to post', [h('div.notice', { html: BT.icon('info') + '<span>Instagram shows your newest post first (top-left). So <strong>post the tiles in number order: 01 first</strong> (the bottom-right piece) and the top-left tile last. The ZIP files are named in that order.</span>' })]));
        var dl = btn('btn-primary', 'download', 'Download ZIP', function () {
          BT.busy(dl, function () {
            var list = tiles().sort(function (a, b) { return a.order - b.order; });
            return Promise.all(list.map(function (t) { return encode(t.canvas, 'image/jpeg', S.q); })).then(function (enc) {
              var files = enc.map(function (e, i) {
                var t = list[i];
                return { name: (t.order < 10 ? '0' : '') + t.order + '-post-row' + (t.r + 1) + '-col' + (t.c + 1) + '.jpg', data: e.blob };
              });
              return BT.downloadZip(files, 'instagram-grid-3x' + S.rows + '.zip').then(function () { BT.toast(files.length + ' tiles saved'); });
            });
          }, 'Creating tiles…');
        });
        dl.setAttribute('data-download', '');
        pn.appendChild(h('div.dsn-actions', null, [dl, btn('', 'rotate-ccw', 'Start over', start)]));
        refreshProfile();
      }
      pasteSupport(body, function (f) { open(f[0]); });
      start();
      return function () { if (view) view.destroy(); };
    }

    // ---------------------------------------------------- post designer
    function designer(body) {
      var D = { preset: 'ig-square', w: 1080, h: 1080, bg: { type: 'linear', c1: '#4f46e5', c2: '#db2777', angle: 135, img: null, fit: 'cover', blur: 0, dim: 20 }, layers: [], safe: true, fmt: 'image/png', tpl: 'sale' };
      var sel = -1, view, P = {};
      function u() { return Math.min(D.w, D.h) / 1080; }
      function applyTemplate(id) {
        var t = TEMPLATES.filter(function (x) { return x.id === id; })[0] || TEMPLATES[0];
        var r = t.make(D.w, D.h, u());
        // mutate in place: the background editor holds a reference to D.bg
        Object.assign(D.bg, { fit: 'cover', blur: 0, dim: 20 }, r.bg);
        // tall formats (stories): pull content towards the middle, away from the safe zones
        if (D.h / D.w > 1.5) r.layers.forEach(function (L) { L.y = D.h * (0.5 + (L.y / D.h - 0.5) * 0.72); });
        D.layers = r.layers;
        D.tpl = id;
        sel = -1;
      }
      applyTemplate('sale');

      var mctx = c2d(mk(4, 4));
      function textLines(L) {
        mctx.font = fontStr(L.weight, L.size, L.font, L.italic);
        return wrapLines(mctx, L.upper ? String(L.text).toUpperCase() : L.text, Math.max(L.size, L.w));
      }
      function box(L) {
        if (L.type === 'text') {
          var lines = textLines(L), mw = 0;
          lines.forEach(function (l) { mw = Math.max(mw, mctx.measureText(l).width); });
          var hh = lines.length * L.size * L.lh, padX = L.pill ? L.size * 0.6 : 0, padY = L.pill ? L.size * 0.32 : 0;
          var bw = (L.pill ? mw : Math.max(mw, 10)) + padX * 2, bh = hh + padY * 2;
          var x = L.align === 'left' ? L.x - L.w / 2 : L.align === 'right' ? L.x + L.w / 2 - bw : L.x - bw / 2;
          if (L.pill) x = L.x - bw / 2;
          return { x: x, y: L.y - bh / 2, w: bw, h: bh, lines: lines, mw: mw };
        }
        if (L.type === 'icon') {
          var s = L.size * (L.bg !== 'none' ? 1.7 : 1);
          return { x: L.x - s / 2, y: L.y - s / 2, w: s, h: s };
        }
        return { x: L.x - L.w / 2, y: L.y - L.h / 2, w: L.w, h: L.h };
      }
      function drawBgImage(c) {
        var b = D.bg, img = b.img;
        if (!img) return;
        var src = img;
        if (b.blur > 0) {
          var f = 1 / (1 + b.blur / 3), t = mk(img.width * f, img.height * f), tt = mk(Math.max(8, t.width * f), Math.max(8, t.height * f));
          var x = c2d(t); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, t.width, t.height);
          c2d(tt).drawImage(t, 0, 0, tt.width, tt.height);
          src = tt;
        }
        if (b.fit === 'contain') {
          // blurred cover behind a contained photo
          var t2 = mk(48, 48 * img.height / img.width);
          c2d(t2).drawImage(img, 0, 0, t2.width, t2.height);
          drawFit(c, t2, 0, 0, D.w, D.h, 'cover');
          drawFit(c, b.blur > 0 ? src : img, 0, 0, D.w, D.h, 'contain');
        } else drawFit(c, src, 0, 0, D.w, D.h, 'cover');
        if (b.dim > 0) { c.fillStyle = 'rgba(0,0,0,' + (b.dim / 100) + ')'; c.fillRect(0, 0, D.w, D.h); }
      }
      function render(c, k, ui) {
        c.save();
        c.scale(k, k);
        if (D.bg.type === 'image' && D.bg.img) drawBgImage(c); else paintBg(c, D.w, D.h, D.bg.type === 'image' ? { type: 'solid', c1: D.bg.c1 } : D.bg);
        D.layers.forEach(function (L) { drawLayer(c, L, k); });
        if (ui) {
          if (D.safe && D.h / D.w > 1.7) {
            var top = D.h * 0.13, bot = D.h * 0.18;
            c.fillStyle = 'rgba(239,68,68,.16)';
            c.fillRect(0, 0, D.w, top); c.fillRect(0, D.h - bot, D.w, bot);
            c.strokeStyle = 'rgba(239,68,68,.85)'; c.lineWidth = 2 / k; c.setLineDash([10 / k, 8 / k]);
            c.beginPath(); c.moveTo(0, top); c.lineTo(D.w, top); c.moveTo(0, D.h - bot); c.lineTo(D.w, D.h - bot); c.stroke();
            c.setLineDash([]);
            c.fillStyle = 'rgba(255,255,255,.92)'; c.font = fontStr(600, D.w * 0.032, 'inter'); c.textAlign = 'center'; c.textBaseline = 'middle';
            c.fillText('Safe zone · profile and buttons cover this', D.w / 2, top / 2, D.w * 0.9);
            c.fillText('Safe zone · reply bar covers this', D.w / 2, D.h - bot / 2, D.w * 0.9);
          }
          if (sel >= 0 && D.layers[sel]) {
            var b = box(D.layers[sel]);
            c.strokeStyle = '#6366f1'; c.lineWidth = 2 / k; c.setLineDash([8 / k, 5 / k]);
            c.strokeRect(b.x, b.y, b.w, b.h);
            c.setLineDash([]);
            corners(b).forEach(function (p) {
              c.fillStyle = '#ffffff'; c.strokeStyle = '#6366f1'; c.lineWidth = 2.5 / k;
              c.fillRect(p.x - 7 / k, p.y - 7 / k, 14 / k, 14 / k); c.strokeRect(p.x - 7 / k, p.y - 7 / k, 14 / k, 14 / k);
            });
          }
        }
        c.restore();
      }
      function corners(b) { return [{ x: b.x, y: b.y, ax: b.x + b.w, ay: b.y + b.h }, { x: b.x + b.w, y: b.y, ax: b.x, ay: b.y + b.h }, { x: b.x, y: b.y + b.h, ax: b.x + b.w, ay: b.y }, { x: b.x + b.w, y: b.y + b.h, ax: b.x, ay: b.y }]; }
      function drawLayer(c, L, k) {
        c.save();
        if (L.type === 'text') {
          var b = box(L);
          c.font = fontStr(L.weight, L.size, L.font, L.italic);
          if (L.pill) {
            c.fillStyle = L.pillColor;
            rrect(c, b.x, b.y, b.w, b.h, b.h / 2);
            c.fill();
          }
          if (L.shadow) { c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = L.size * 0.18; c.shadowOffsetY = L.size * 0.06; }
          c.fillStyle = L.color;
          c.textBaseline = 'middle';
          var x;
          if (L.pill || L.align === 'center') { c.textAlign = 'center'; x = L.x; }
          else if (L.align === 'left') { c.textAlign = 'left'; x = L.x - L.w / 2; }
          else { c.textAlign = 'right'; x = L.x + L.w / 2; }
          var lh = L.size * L.lh, y0 = L.y - (b.lines.length - 1) * lh / 2;
          b.lines.forEach(function (l, i) { c.fillText(l, x, y0 + i * lh + L.size * 0.04); });
        } else if (L.type === 'icon') {
          var s = L.size;
          if (L.bg !== 'none') {
            var bs = s * 1.7;
            c.fillStyle = L.bgColor;
            if (L.bg === 'circle') { c.beginPath(); c.arc(L.x, L.y, bs / 2, 0, Math.PI * 2); c.fill(); }
            else { rrect(c, L.x - bs / 2, L.y - bs / 2, bs, bs, bs * 0.24); c.fill(); }
          }
          var img = iconNow(L.name, L.color, L.sw, function () { if (view) view.render(); });
          if (img) c.drawImage(img, L.x - s / 2, L.y - s / 2, s, s);
        } else if (L.type === 'shape') {
          c.globalAlpha = L.opacity == null ? 1 : L.opacity;
          c.fillStyle = L.fill;
          if (L.shape === 'circle') { c.beginPath(); c.ellipse(L.x, L.y, L.w / 2, L.h / 2, 0, 0, Math.PI * 2); c.fill(); }
          else { rrect(c, L.x - L.w / 2, L.y - L.h / 2, L.w, L.h, L.radius || 0); c.fill(); }
        } else if (L.type === 'image' && L.img) {
          rrect(c, L.x - L.w / 2, L.y - L.h / 2, L.w, L.h, L.radius || 0);
          c.clip();
          drawFit(c, L.img, L.x - L.w / 2, L.y - L.h / 2, L.w, L.h, 'cover');
        }
        c.restore();
      }

      // ------------------------------------------------------- interaction
      var drag = null;
      function hit(p) {
        for (var i = D.layers.length - 1; i >= 0; i--) {
          var b = box(D.layers[i]);
          if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return i;
        }
        return -1;
      }
      function down(e) {
        if (e.button > 0) return;
        view.canvas.setPointerCapture(e.pointerId);
        var p = view.pt(e), tol = 16 / view.cssK;
        if (sel >= 0 && D.layers[sel]) {
          var b = box(D.layers[sel]), cs = corners(b);
          for (var i = 0; i < 4; i++) if (Math.abs(p.x - cs[i].x) <= tol && Math.abs(p.y - cs[i].y) <= tol) {
            var L = D.layers[sel];
            drag = { type: 'resize', L: L, ax: cs[i].ax, ay: cs[i].ay, dx: cs[i].x > cs[i].ax ? 1 : -1, dy: cs[i].y > cs[i].ay ? 1 : -1, b0: b, snap: JSON.parse(JSON.stringify(L, function (k, v) { return k === 'img' ? undefined : v; })) };
            return;
          }
        }
        var hi = hit(p);
        if (hi !== sel) { sel = hi; refreshLayers(); }
        if (hi >= 0) drag = { type: 'move', L: D.layers[hi], sx: p.x, sy: p.y, x0: D.layers[hi].x, y0: D.layers[hi].y };
        view.render();
      }
      function move(e) {
        if (!drag) return;
        var p = view.pt(e), L = drag.L;
        if (drag.type === 'move') {
          L.x = drag.x0 + p.x - drag.sx; L.y = drag.y0 + p.y - drag.sy;
          // snap to centre lines
          var snap = 8 / view.cssK;
          if (Math.abs(L.x - D.w / 2) < snap) L.x = D.w / 2;
          if (Math.abs(L.y - D.h / 2) < snap) L.y = D.h / 2;
        } else {
          var nw = Math.max(20, Math.abs(p.x - drag.ax)), nh = Math.max(20, Math.abs(p.y - drag.ay)), s0 = drag.snap;
          var f = Math.max(nw / drag.b0.w, nh / drag.b0.h);
          if (L.type === 'text') { L.size = clamp(s0.size * f, 8, 600); L.w = s0.w * f; }
          else if (L.type === 'icon') L.size = clamp(s0.size * f, 10, 1600);
          else if (L.type === 'image') { L.w = s0.w * f; L.h = s0.h * f; }
          else { L.w = nw; L.h = nh; }
          // keep the opposite corner fixed
          var nb = box(L);
          L.x += (drag.dx > 0 ? drag.ax : drag.ax - nb.w) - nb.x;
          L.y += (drag.dy > 0 ? drag.ay : drag.ay - nb.h) - nb.y;
          syncProps();
        }
        view.render();
      }
      function up() { drag = null; }
      function key(e) {
        if (sel < 0 || !D.layers[sel]) return;
        var L = D.layers[sel], st = e.shiftKey ? 20 : 4;
        var m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
        if (m) { L.x += m[0] * st; L.y += m[1] * st; }
        else if (e.key === 'Delete' || e.key === 'Backspace') { D.layers.splice(sel, 1); sel = -1; refreshLayers(); }
        else if (e.key === 'Escape') { sel = -1; refreshLayers(); }
        else return;
        e.preventDefault();
        view.render();
      }

      // ------------------------------------------------------------- panel
      function build() {
        body.innerHTML = '';
        var ed = editor(body);
        view = canvasView(ed.stage, { label: 'Design canvas. Click a layer to select it, drag to move, drag a corner to resize. Arrow keys move the selected layer, Delete removes it.', size: function () { return { w: D.w, h: D.h }; }, draw: function (c, k) { render(c, k, true); } });
        var cv = view.canvas;
        cv.addEventListener('pointerdown', down);
        cv.addEventListener('pointermove', move);
        cv.addEventListener('pointerup', up);
        cv.addEventListener('pointercancel', up);
        cv.addEventListener('keydown', key);
        ed.under.innerHTML = '<span data-dims></span>';
        var pn = ed.panel;

        P.preset = select(SOCIAL_PRESETS.map(function (p) { return [p[0], p[1] + ' · ' + p[2] + '×' + p[3]]; }), D.preset);
        P.preset.addEventListener('change', function () { setPreset(P.preset.value); });
        pn.appendChild(field('Size', P.preset));
        P.safe = checkbox('Show story safe zones', D.safe, function (v) { D.safe = v; view.render(); });
        pn.appendChild(P.safe);

        var tg = h('div.dsn-chips', { role: 'group', 'aria-label': 'Templates' });
        TEMPLATES.forEach(function (t) {
          var b = h('button.chip', { type: 'button', text: t.name, 'aria-pressed': String(t.id === D.tpl) });
          b.addEventListener('click', function () {
            applyTemplate(t.id);
            BT.$$('button', tg).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
            P.bg.sync(); refreshLayers(); view.render();
          });
          tg.appendChild(b);
        });
        pn.appendChild(sec('Templates', [tg]));

        P.bgExtra = null;
        P.bg = bgEditor(D.bg, function () { view.render(); }, { allowImage: true, onType: function (t, extra) { bgImageControls(t, extra); } });
        pn.appendChild(sec('Background', [P.bg]));

        // add layers
        var addPhoto = h('input', { type: 'file', accept: 'image/*', 'aria-label': 'Add a photo layer' });
        addPhoto.style.cssText = 'position:absolute;inset:0;opacity:0;cursor:pointer';
        addPhoto.addEventListener('change', function () {
          var f = addPhoto.files[0]; addPhoto.value = '';
          if (!f) return;
          decode(f, 2400).then(function (im) {
            var w = D.w * 0.5, hh = w * im.h / im.w;
            D.layers.push(T('image', { img: im.canvas, x: D.w / 2, y: D.h / 2, w: w, h: hh, radius: 24 * u() }));
            sel = D.layers.length - 1; refreshLayers(); view.render();
          }).catch(function (e) { BT.toast(e.message, 'error'); });
        });
        var addBar = h('div.btn-group', null, [
          btn('btn-sm', 'type', 'Text', function () { addLayer(txt({ text: 'Your text here', x: D.w / 2, y: D.h / 2, w: D.w * 0.8, size: 72 * u(), weight: 800 })); }),
          btn('btn-sm', 'star', 'Sticker', function () { addLayer(T('icon', { name: 'star', x: D.w / 2, y: D.h / 2, size: 140 * u(), color: '#ffffff', sw: 2, bg: 'none', bgColor: '#000000' })); }),
          btn('btn-sm', 'square', 'Shape', function () { addLayer(T('shape', { shape: 'rect', x: D.w / 2, y: D.h / 2, w: D.w * 0.4, h: D.h * 0.2, fill: '#ffffff', opacity: 0.9, radius: 24 * u() })); }),
          h('label.btn.btn-sm', { html: BT.icon('image-plus') + '<span>Photo</span>', style: { position: 'relative', overflow: 'hidden' } }, [addPhoto])
        ]);
        P.layers = h('div.dsn-list', { style: { marginTop: '10px' } });
        pn.appendChild(sec('Layers', [addBar, P.layers]));
        P.props = h('div');
        pn.appendChild(P.propSec = sec('Selected layer', [P.props]));

        P.fmt = segField('Format', [['image/png', 'PNG'], ['image/jpeg', 'JPG']], D.fmt, function (v) { D.fmt = v; });
        var dl = btn('btn-primary', 'download', 'Download', function () {
          BT.busy(dl, function () {
            return fontsReady().then(function () {
              var out = mk(D.w, D.h);
              render(c2d(out), 1, false);
              return saveCanvas(out, D.fmt, slug(presetById(D.preset)[1]) + '-' + D.w + 'x' + D.h, 0.93);
            });
          }, 'Rendering…');
        });
        dl.setAttribute('data-download', '');
        pn.appendChild(sec('Export', [P.fmt, h('div.dsn-actions', null, [dl])]));
        refreshLayers();
        fontsReady().then(function () { view.render(); });
      }
      function bgImageControls(t, extra) {
        extra.innerHTML = '';
        if (t !== 'image') return;
        var fi = h('input', { type: 'file', accept: 'image/*', 'aria-label': 'Background photo' });
        fi.style.cssText = 'position:absolute;inset:0;opacity:0;cursor:pointer';
        fi.addEventListener('change', function () {
          var f = fi.files[0]; fi.value = '';
          if (!f) return;
          decode(f, 3000).then(function (im) { D.bg.img = im.canvas; view.render(); }).catch(function (e) { BT.toast(e.message, 'error'); });
        });
        extra.appendChild(h('div', { style: { marginTop: '10px' } }, [
          h('label.btn.btn-sm', { html: BT.icon('image-plus') + '<span>' + (D.bg.img ? 'Change photo' : 'Choose photo') + '</span>', style: { position: 'relative', overflow: 'hidden', marginBottom: '12px' } }, [fi]),
          segField('Photo fit', [['cover', 'Fill'], ['contain', 'Fit']], D.bg.fit, function (v) { D.bg.fit = v; view.render(); }),
          range('Blur', 0, 40, 1, D.bg.blur, null, function (v) { D.bg.blur = v; view.render(); }),
          range('Darken', 0, 80, 1, D.bg.dim, function (v) { return v + '%'; }, function (v) { D.bg.dim = v; view.render(); })
        ]));
        if (!D.bg.img) BT.toast('Choose a background photo');
      }
      function setPreset(id) {
        var p = presetById(id), fx = p[2] / D.w, fy = p[3] / D.h, fs = Math.min(p[2], p[3]) / Math.min(D.w, D.h);
        D.layers.forEach(function (L) {
          L.x *= fx; L.y *= fy;
          if (L.type === 'text') { L.size *= fs; L.w = Math.min(L.w * fs, p[2] * 0.95); }
          else if (L.type === 'icon') L.size *= fs;
          else { L.w *= fs; L.h *= fs; if (L.radius) L.radius *= fs; }
        });
        D.preset = id; D.w = p[2]; D.h = p[3];
        view.render(); refreshDims();
      }
      function refreshDims() {
        var el = BT.$('[data-dims]', body);
        if (el) el.textContent = presetById(D.preset)[1] + ' · ' + D.w + ' × ' + D.h + ' px' + (D.h / D.w > 1.7 ? ' · red bands = safe zones (not exported)' : '');
      }
      function addLayer(L) { D.layers.push(L); sel = D.layers.length - 1; refreshLayers(); view.render(); }
      function layerName(L) {
        if (L.type === 'text') return '“' + String(L.text).slice(0, 26) + '”';
        if (L.type === 'icon') return 'Sticker: ' + L.name.replace(/-/g, ' ');
        if (L.type === 'image') return 'Photo';
        return 'Shape: ' + L.shape;
      }
      function refreshLayers() {
        refreshDims();
        P.layers.innerHTML = '';
        for (var i = D.layers.length - 1; i >= 0; i--) (function (i) {
          var L = D.layers[i];
          var t = h('button.t', { type: 'button', text: layerName(L), 'aria-pressed': String(i === sel) });
          t.addEventListener('click', function () { sel = i; refreshLayers(); view.render(); });
          P.layers.appendChild(h('div.dsn-item' + (i === sel ? '.on' : ''), null, [
            h('span', { html: BT.icon(L.type === 'text' ? 'type' : L.type === 'icon' ? 'star' : L.type === 'image' ? 'image' : 'square'), style: { color: 'var(--text-3)', display: 'grid' } }), t,
            iconBtn('chevron-down', 'Move down', function () { if (i > 0) { var x = D.layers.splice(i, 1)[0]; D.layers.splice(i - 1, 0, x); if (sel === i) sel = i - 1; refreshLayers(); view.render(); } }),
            iconBtn('copy', 'Duplicate', function () { var c = Object.assign({}, L); c.x += 30; c.y += 30; D.layers.splice(i + 1, 0, c); sel = i + 1; refreshLayers(); view.render(); }),
            iconBtn('trash-2', 'Delete layer', function () { D.layers.splice(i, 1); sel = -1; refreshLayers(); view.render(); })
          ]));
        })(i);
        if (!D.layers.length) P.layers.appendChild(h('p.muted.small', { text: 'No layers yet. Add text, stickers, shapes or photos.' }));
        buildProps();
      }
      var propCtl = {};
      function buildProps() {
        P.props.innerHTML = '';
        propCtl = {};
        var L = D.layers[sel];
        P.propSec.style.display = L ? '' : 'none';
        if (!L) return;
        var R = function () { view.render(); };
        if (L.type === 'text') {
          var ta = h('textarea', { id: nid(), rows: 2, style: { minHeight: '70px' } });
          ta.value = L.text;
          ta.addEventListener('input', function () { L.text = ta.value; R(); var t = BT.$('.dsn-item.on .t', P.layers); if (t) t.textContent = layerName(L); });
          var fs = select(FONTS.map(function (f) { return [f.id, f.name]; }), L.font);
          fs.addEventListener('change', function () { L.font = fs.value; R(); });
          var ws = select([[300, 'Light'], [400, 'Regular'], [500, 'Medium'], [600, 'Semibold'], [700, 'Bold'], [800, 'Extra bold']], String(L.weight));
          ws.addEventListener('change', function () { L.weight = +ws.value; R(); });
          propCtl.size = range('Size', 8, 400, 1, Math.round(L.size), null, function (v) { L.size = v; R(); });
          P.props.appendChild(h('div', null, [field('Text', ta), h('div.dsn-two', null, [field('Font', fs), field('Weight', ws)]), propCtl.size,
            range('Box width', 60, D.w, 1, Math.round(L.w), null, function (v) { L.w = v; R(); }),
            range('Line height', 0.8, 2, 0.01, L.lh, null, function (v) { L.lh = v; R(); }),
            segField('Align', [['left', 'Left'], ['center', 'Centre'], ['right', 'Right']], L.align, function (v) { L.align = v; R(); }),
            h('div.dsn-colors', null, [colorInput('Text colour', L.color, function (v) { L.color = v; R(); }), colorInput('Pill colour', L.pillColor, function (v) { L.pillColor = v; R(); })]),
            h('div.dsn-chips', { style: { marginTop: '12px' } }, [
              checkbox('Shadow', L.shadow, function (v) { L.shadow = v; R(); }),
              checkbox('Background pill', L.pill, function (v) { L.pill = v; R(); }),
              checkbox('Italic', L.italic, function (v) { L.italic = v; R(); }),
              checkbox('UPPERCASE', L.upper, function (v) { L.upper = v; R(); })
            ])]));
        } else if (L.type === 'icon') {
          propCtl.size = range('Size', 10, 900, 1, Math.round(L.size), null, function (v) { L.size = v; R(); });
          P.props.appendChild(h('div', null, [
            propCtl.size,
            range('Line weight', 0.75, 3, 0.25, L.sw, null, function (v) { L.sw = v; R(); }),
            segField('Badge', [['none', 'None'], ['circle', 'Circle'], ['rounded', 'Rounded']], L.bg, function (v) { L.bg = v; R(); }),
            h('div.dsn-colors', null, [colorInput('Icon colour', L.color, function (v) { L.color = v; R(); }), colorInput('Badge colour', L.bgColor, function (v) { L.bgColor = v; R(); })]),
            h('div', { style: { marginTop: '12px' } }, [iconPicker(L.name, function (n) { L.name = n; R(); var t = BT.$('.dsn-item.on .t', P.layers); if (t) t.textContent = layerName(L); }, 'Stickers')])
          ]));
        } else if (L.type === 'shape') {
          P.props.appendChild(h('div', null, [
            segField('Shape', [['rect', 'Rectangle'], ['circle', 'Ellipse']], L.shape, function (v) { L.shape = v; R(); }),
            colorInput('Fill', L.fill, function (v) { L.fill = v; R(); }),
            range('Opacity', 0, 1, 0.01, L.opacity, function (v) { return Math.round(v * 100) + '%'; }, function (v) { L.opacity = v; R(); }),
            range('Corner radius', 0, 300, 1, Math.round(L.radius || 0), null, function (v) { L.radius = v; R(); })
          ]));
        } else if (L.type === 'image') {
          P.props.appendChild(range('Corner radius', 0, 400, 1, Math.round(L.radius || 0), null, function (v) { L.radius = v; R(); }));
        }
        P.props.appendChild(h('p.muted.small', { style: { margin: '12px 0 0' }, text: 'Drag a corner handle to resize. Arrow keys nudge (Shift = faster).' }));
      }
      function syncProps() {
        var L = D.layers[sel];
        if (L && propCtl.size && (L.type === 'text' || L.type === 'icon')) propCtl.size.set(Math.round(L.size));
      }
      build();
      return function () { if (view) view.destroy(); };
    }

    shell();
  });

  // ============================================================ Logo maker
  var LOGO_PALETTES = [
    { name: 'Indigo', text: '#1e1b4b', tag: '#64748b', c1: '#6366f1', c2: '#a855f7', ink: '#ffffff' },
    { name: 'Sunset', text: '#431407', tag: '#9a3412', c1: '#f97316', c2: '#db2777', ink: '#ffffff' },
    { name: 'Ocean', text: '#0c4a6e', tag: '#0369a1', c1: '#0284c7', c2: '#22d3ee', ink: '#ffffff' },
    { name: 'Forest', text: '#14532d', tag: '#4d7c0f', c1: '#15803d', c2: '#84cc16', ink: '#ffffff' },
    { name: 'Gold', text: '#1c1917', tag: '#78716c', c1: '#b45309', c2: '#f59e0b', ink: '#ffffff' },
    { name: 'Rose', text: '#4c0519', tag: '#9f1239', c1: '#e11d48', c2: '#fb7185', ink: '#ffffff' },
    { name: 'Teal', text: '#134e4a', tag: '#0f766e', c1: '#0d9488', c2: '#2dd4bf', ink: '#ffffff' },
    { name: 'Mono', text: '#111111', tag: '#555555', c1: '#111111', c2: '#3f3f46', ink: '#ffffff' },
    { name: 'Candy', text: '#3b0764', tag: '#7e22ce', c1: '#ec4899', c2: '#8b5cf6', ink: '#ffffff' },
    { name: 'Citrus', text: '#1a2e05', tag: '#4d7c0f', c1: '#facc15', c2: '#84cc16', ink: '#1a2e05' }
  ];
  var LOGO_FONTS = ['inter', 'georgia', 'trebuchet', 'mono', 'impact', 'rounded', 'palatino', 'verdana', 'system'];
  var ICON_WORDS = [
    [/tech|soft|code|dev|app|digital|web|data|cloud|ai|labs?|byte|cyber|it\b/, ['code', 'braces', 'binary', 'zap', 'bot', 'brain-circuit']],
    [/food|cafe|café|kitchen|bake|bakery|cake|sweet|restaurant|tea|coffee|chai/, ['cake', 'flame', 'heart', 'star']],
    [/home|house|real|estate|property|build|construct|interior|engineer/, ['house', 'landmark', 'ruler', 'layers']],
    [/financ|money|pay|bank|capital|invest|wealth|tax|account|fund|rupee/, ['piggy-bank', 'landmark', 'trending-up', 'badge-indian-rupee', 'vault']],
    [/health|care|clinic|fit|gym|yoga|med|pharma|doctor|dental/, ['activity', 'heart', 'shield-check']],
    [/travel|tour|trip|holiday|voyage|go\b/, ['map-pin', 'globe', 'map']],
    [/photo|studio|media|film|video|pixel|lens/, ['aperture', 'film', 'clapperboard', 'image']],
    [/edu|school|learn|academy|class|tutor|book|study/, ['book-open-text', 'pen-tool', 'pencil']],
    [/shop|store|mart|retail|bazaar|market|boutique|gift/, ['tag', 'gift', 'receipt', 'star']],
    [/design|art|creative|craft|paint|color|colour/, ['palette', 'brush', 'pen-tool', 'sparkles']],
    [/law|legal|advocate|justice/, ['scale', 'shield', 'landmark']],
    [/music|audio|sound|beat|radio|podcast/, ['mic', 'volume-2']],
    [/secur|safe|guard|protect|lock/, ['shield-check', 'lock', 'key-round', 'fingerprint']],
    [/consult|solution|service|group|global|international|enterprise|corp/, ['globe', 'briefcase', 'chart-line', 'layers']],
    [/event|wedding|party|celebrat/, ['sparkles', 'cake', 'gift', 'heart']],
    [/energy|power|electric|solar|sun/, ['zap', 'sun', 'flame']]
  ];
  var ICON_FALLBACK = ['sparkles', 'star', 'zap', 'layers', 'aperture', 'globe', 'heart', 'flame', 'palette', 'shield-check', 'scan-face', 'blend'];
  function iconsFor(name) {
    var n = String(name || '').toLowerCase(), out = [];
    ICON_WORDS.forEach(function (w) { if (w[0].test(n)) out = out.concat(w[1]); });
    out = out.concat(ICON_FALLBACK);
    return out.filter(function (x, i) { return ICONS[x] && out.indexOf(x) === i; });
  }
  function initialsOf(name) {
    var w = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!w.length) return 'A';
    var a = Array.from(w[0])[0] || '', b = w.length > 1 ? Array.from(w[w.length - 1])[0] || '' : (Array.from(w[0])[1] || '');
    return (a + (w.length > 1 ? b : '')).toUpperCase();
  }
  var lctx = c2d(mk(8, 8));
  function measureSpaced(text, font, ls) {
    lctx.font = font;
    if (!text) return 0;
    if ('letterSpacing' in lctx) {
      lctx.letterSpacing = ls + 'px';
      var w = lctx.measureText(text).width - ls;
      lctx.letterSpacing = '0px';
      return w;
    }
    if (!ls) return lctx.measureText(text).width;
    return Array.from(text).reduce(function (a, ch) { return a + lctx.measureText(ch).width; }, 0) + ls * (Array.from(text).length - 1);
  }
  function vmetrics(text, font, size) {
    lctx.font = font;
    var m = lctx.measureText(text || 'H'), cap = lctx.measureText('H');
    var asc = Math.max(m.actualBoundingBoxAscent || size * 0.72, cap.actualBoundingBoxAscent || size * 0.72);
    var desc = Math.max(0, m.actualBoundingBoxDescent || 0);
    return { asc: asc, desc: desc };
  }

  /** Compute logo geometry as a list of drawing ops. */
  function logoLayout(L, dark) {
    var name = L.upper ? String(L.name || '').toUpperCase() : String(L.name || '');
    var tag = String(L.tagline || '');
    var textC = L.text, tagC = L.tag;
    if (dark) {
      if (luma(textC) < 0.55) textC = '#ffffff';
      if (luma(tagC) < 0.55) tagC = '#cbd5e1';
    }
    var fontCss = fontById(L.font).css, ops = [], pad = 36;
    var mark = L.iconMode !== 'none' && L.layout !== 'wordmark';
    var grad = { grad: L.grad, c1: L.c1, c2: L.c2 };
    function markOps(cx, cy, M, onShape) {
      var shaped = L.shape !== 'none';
      if (shaped && !onShape) ops.push({ t: 'shape', kind: L.shape, cx: cx, cy: cy, size: M, fill: grad });
      var ink = shaped || onShape ? (onShape || L.ink) : L.c1;
      if (dark && !shaped && !onShape && luma(ink) < 0.3) ink = mixHex(ink, '#ffffff', 0.55);
      if (L.iconMode === 'initials') {
        var ini = initialsOf(L.name), fs = M * (Array.from(ini).length > 1 ? 0.42 : 0.52) * (shaped || onShape ? 1 : 1.5);
        ops.push({ t: 'mid', text: ini, cx: cx, cy: cy, size: fs, font: fontCss, weight: Math.max(700, L.weight), color: ink });
      } else {
        ops.push({ t: 'icon', name: L.icon, cx: cx, cy: cy, size: shaped || onShape ? M * 0.54 : M, color: ink, sw: L.sw || 2 });
      }
    }
    var ns = 100, ts = 40, nf = fontStr(L.weight, ns, L.font), tf = fontStr(500, ts, 'inter');
    var nls = L.ls / 100 * ns, tls = ts * 0.08;
    var nameW = measureSpaced(name, nf, nls), tagW = tag ? measureSpaced(tag, tf, tls) : 0;
    var nm = vmetrics(name, nf, ns), tm = vmetrics(tag, tf, ts);
    var gap = ns * 0.24, blockH = nm.asc + nm.desc + (tag ? gap + tm.asc + tm.desc : 0);
    var W, H;
    if (L.layout === 'badge') {
      var R = 250;
      W = H = 2 * R + 2 * pad;
      var cx = W / 2, cy = H / 2, bg = mixHex(L.c1, L.c2, 0.5), ink = luma(bg) > 0.62 ? '#111827' : '#ffffff';
      ops.push({ t: 'shape', kind: 'circle', cx: cx, cy: cy, size: 2 * R, fill: grad });
      ops.push({ t: 'ring', cx: cx, cy: cy, r: R - 18, color: ink, sw: 3, opacity: 0.55 });
      var bs = Math.min(76, 76 * (R * 1.45) / Math.max(1, measureSpaced(name, fontStr(L.weight, 76, L.font), L.ls / 100 * 76)));
      var bf = fontStr(L.weight, bs, L.font), bm = vmetrics(name, bf, bs);
      var hasMark = L.iconMode !== 'none';
      var nameY = hasMark ? cy + 40 + bm.asc / 2 : cy + bm.asc / 2;
      if (hasMark) markOps(cx, cy - 62, 128, ink);
      var bw = measureSpaced(name, bf, L.ls / 100 * bs);
      ops.push({ t: 'text', text: name, x: cx - bw / 2, y: nameY, size: bs, font: fontCss, weight: L.weight, ls: L.ls / 100 * bs, color: ink });
      if (tag) ops.push({ t: 'arc', text: tag.toUpperCase(), cx: cx, cy: cy, r: R - 50, size: 24, font: FONTS[0].css, weight: 600, ls: 24 * 0.18, color: ink });
      return { w: W, h: H, ops: ops };
    }
    if (L.layout === 'top' && mark) {
      var M = 170, cw = Math.max(M, nameW, tagW);
      W = cw + pad * 2;
      H = pad * 2 + M + ns * 0.34 + blockH;
      markOps(W / 2, pad + M / 2, M);
      var by = pad + M + ns * 0.34 + nm.asc;
      ops.push({ t: 'text', text: name, x: W / 2 - nameW / 2, y: by, size: ns, font: fontCss, weight: L.weight, ls: nls, color: textC });
      if (tag) ops.push({ t: 'text', text: tag, x: W / 2 - tagW / 2, y: by + nm.desc + gap + tm.asc, size: ts, font: FONTS[0].css, weight: 500, ls: tls, color: tagC });
      return { w: W, h: H, ops: ops };
    }
    if (L.layout === 'wordmark' || !mark) {
      var dot = L.layout === 'wordmark' ? ns * 0.1 : 0;
      W = pad * 2 + Math.max(nameW + (dot ? dot * 3.2 : 0), tagW);
      H = pad * 2 + blockH;
      var y0 = pad + nm.asc;
      ops.push({ t: 'text', text: name, x: pad, y: y0, size: ns, font: fontCss, weight: L.weight, ls: nls, color: textC });
      if (dot) ops.push({ t: 'shape', kind: 'circle', cx: pad + nameW + dot * 1.8, cy: y0 - dot, size: dot * 2, fill: grad });
      if (tag) ops.push({ t: 'text', text: tag, x: pad, y: y0 + nm.desc + gap + tm.asc, size: ts, font: FONTS[0].css, weight: 500, ls: tls, color: tagC });
      return { w: W, h: H, ops: ops };
    }
    // icon left
    var M2 = 150, ch = Math.max(M2, blockH), tx = pad + M2 + ns * 0.34;
    W = tx + Math.max(nameW, tagW) + pad;
    H = ch + pad * 2;
    markOps(pad + M2 / 2, pad + ch / 2, M2);
    var ny = pad + (ch - blockH) / 2 + nm.asc;
    ops.push({ t: 'text', text: name, x: tx, y: ny, size: ns, font: fontCss, weight: L.weight, ls: nls, color: textC });
    if (tag) ops.push({ t: 'text', text: tag, x: tx, y: ny + nm.desc + gap + tm.asc, size: ts, font: FONTS[0].css, weight: 500, ls: tls, color: tagC });
    return { w: W, h: H, ops: ops };
  }
  /** Favicon / app icon: the mark alone on a square. */
  function faviconLayout(L) {
    var S = 512, ops = [], grad = { grad: L.grad, c1: L.c1, c2: L.c2 };
    var shape = L.shape === 'none' ? 'rounded' : L.shape;
    ops.push({ t: 'shape', kind: shape, cx: S / 2, cy: S / 2, size: S * (shape === 'hexagon' ? 1 : 0.94), fill: grad });
    if (L.iconMode === 'icon') ops.push({ t: 'icon', name: L.icon, cx: S / 2, cy: S / 2, size: S * 0.5, color: L.ink, sw: L.sw || 2 });
    else {
      var ini = initialsOf(L.name);
      ops.push({ t: 'mid', text: ini, cx: S / 2, cy: S / 2, size: S * (Array.from(ini).length > 1 ? 0.4 : 0.5), font: fontById(L.font).css, weight: Math.max(700, L.weight), color: L.ink });
    }
    return { w: S, h: S, ops: ops };
  }

  function hexPoints(cx, cy, size) {
    var r = size / 2, pts = [];
    for (var i = 0; i < 6; i++) { var a = rad(-90 + 60 * i); pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return pts;
  }
  function f1(v) { return Math.round(v * 100) / 100; }
  function clean(s) { return String(s || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); }
  /** Ops -> standalone SVG markup (text kept as <text>). */
  var svgSeq = 0;
  function logoSVG(lay, title) {
    var defs = '', body = '', gid = 0, pre = 'l' + (++svgSeq).toString(36) + '-';
    function fill(f) {
      if (!f.grad) return esc(f.c1);
      var id = pre + 'g' + (++gid);
      defs += '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + esc(f.c1) + '"/><stop offset="1" stop-color="' + esc(f.c2) + '"/></linearGradient>';
      return 'url(#' + id + ')';
    }
    lay.ops.forEach(function (o) {
      if (o.t === 'shape') {
        var fl = fill(o.fill), s = o.size;
        if (o.kind === 'circle') body += '<circle cx="' + f1(o.cx) + '" cy="' + f1(o.cy) + '" r="' + f1(s / 2) + '" fill="' + fl + '"/>';
        else if (o.kind === 'rounded') body += '<rect x="' + f1(o.cx - s / 2) + '" y="' + f1(o.cy - s / 2) + '" width="' + f1(s) + '" height="' + f1(s) + '" rx="' + f1(s * 0.26) + '" fill="' + fl + '"/>';
        else if (o.kind === 'hexagon') body += '<polygon points="' + hexPoints(o.cx, o.cy, s).map(function (p) { return f1(p[0]) + ',' + f1(p[1]); }).join(' ') + '" fill="' + fl + '" stroke="' + fl + '" stroke-width="' + f1(s * 0.06) + '" stroke-linejoin="round"/>';
      } else if (o.t === 'ring') {
        body += '<circle cx="' + f1(o.cx) + '" cy="' + f1(o.cy) + '" r="' + f1(o.r) + '" fill="none" stroke="' + esc(o.color) + '" stroke-opacity="' + o.opacity + '" stroke-width="' + o.sw + '"/>';
      } else if (o.t === 'icon') {
        body += '<svg x="' + f1(o.cx - o.size / 2) + '" y="' + f1(o.cy - o.size / 2) + '" width="' + f1(o.size) + '" height="' + f1(o.size) + '" viewBox="0 0 24 24" fill="none" stroke="' + esc(o.color) +
          '" stroke-width="' + o.sw + '" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[o.name] || '') + '</svg>';
      } else if (o.t === 'text') {
        body += '<text x="' + f1(o.x) + '" y="' + f1(o.y) + '" font-family="' + esc(o.font) + '" font-size="' + f1(o.size) + '" font-weight="' + o.weight + '"' +
          (o.ls ? ' letter-spacing="' + f1(o.ls) + '"' : '') + ' fill="' + esc(o.color) + '">' + esc(clean(o.text)) + '</text>';
      } else if (o.t === 'mid') {
        body += '<text x="' + f1(o.cx) + '" y="' + f1(o.cy) + '" text-anchor="middle" dominant-baseline="central" font-family="' + esc(o.font) + '" font-size="' + f1(o.size) + '" font-weight="' + o.weight + '" fill="' + esc(o.color) + '">' + esc(clean(o.text)) + '</text>';
      } else if (o.t === 'arc') {
        var id = pre + 'arc' + (++gid), r = o.r;
        defs += '<path id="' + id + '" d="M ' + f1(o.cx - r) + ' ' + f1(o.cy) + ' A ' + f1(r) + ' ' + f1(r) + ' 0 0 0 ' + f1(o.cx + r) + ' ' + f1(o.cy) + '"/>';
        body += '<text font-family="' + esc(o.font) + '" font-size="' + o.size + '" font-weight="' + o.weight + '" letter-spacing="' + f1(o.ls) + '" fill="' + esc(o.color) + '"><textPath href="#' + id + '" startOffset="50%" text-anchor="middle">' + esc(clean(o.text)) + '</textPath></text>';
      }
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + f1(lay.w) + ' ' + f1(lay.h) + '" width="' + Math.round(lay.w) + '" height="' + Math.round(lay.h) + '">' +
      (title ? '<title>' + esc(clean(title)) + '</title>' : '') + (defs ? '<defs>' + defs + '</defs>' : '') + body + '</svg>';
  }
  /** Ops -> canvas (fonts from the page, icons rasterised). */
  function logoCanvas(lay, longSide, square) {
    var k = longSide / Math.max(lay.w, lay.h);
    var W = square ? longSide : Math.round(lay.w * k), H = square ? longSide : Math.round(lay.h * k);
    var icons = lay.ops.filter(function (o) { return o.t === 'icon'; });
    return Promise.all([fontsReady([400, 500, 600, 700, 800])].concat(icons.map(function (o) { return iconImage(o.name, o.color, o.sw); }))).then(function (r) {
      var cv = mk(W, H), c = c2d(cv), imgs = r.slice(1), ii = 0;
      c.translate((W - lay.w * k) / 2, (H - lay.h * k) / 2);
      c.scale(k, k);
      lay.ops.forEach(function (o) {
        c.save();
        if (o.t === 'shape') {
          var s = o.size, f = o.fill;
          if (f.grad) {
            var g = c.createLinearGradient(o.cx - s / 2, o.cy - s / 2, o.cx + s / 2, o.cy + s / 2);
            g.addColorStop(0, f.c1); g.addColorStop(1, f.c2); c.fillStyle = g;
          } else c.fillStyle = f.c1;
          if (o.kind === 'circle') { c.beginPath(); c.arc(o.cx, o.cy, s / 2, 0, Math.PI * 2); c.fill(); }
          else if (o.kind === 'rounded') { rrect(c, o.cx - s / 2, o.cy - s / 2, s, s, s * 0.26); c.fill(); }
          else if (o.kind === 'hexagon') {
            c.beginPath();
            hexPoints(o.cx, o.cy, s).forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
            c.closePath(); c.fill();
            c.strokeStyle = c.fillStyle; c.lineWidth = s * 0.06; c.lineJoin = 'round'; c.stroke();
          }
        } else if (o.t === 'ring') {
          c.globalAlpha = o.opacity; c.strokeStyle = o.color; c.lineWidth = o.sw;
          c.beginPath(); c.arc(o.cx, o.cy, o.r, 0, Math.PI * 2); c.stroke();
        } else if (o.t === 'icon') {
          var img = imgs[ii++];
          if (img) c.drawImage(img, o.cx - o.size / 2, o.cy - o.size / 2, o.size, o.size);
        } else if (o.t === 'text') {
          c.font = o.weight + ' ' + o.size + 'px ' + o.font;
          c.fillStyle = o.color; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
          fillSpaced(c, clean(o.text), o.x, o.y, o.ls || 0);
        } else if (o.t === 'mid') {
          c.font = o.weight + ' ' + o.size + 'px ' + o.font;
          c.fillStyle = o.color; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(clean(o.text), o.cx, o.cy);
        } else if (o.t === 'arc') {
          c.font = o.weight + ' ' + o.size + 'px ' + o.font;
          c.fillStyle = o.color; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
          var chars = Array.from(clean(o.text)), adv = chars.map(function (ch) { return c.measureText(ch).width + o.ls; });
          var total = adv.reduce(function (a, b) { return a + b; }, 0) - o.ls, phi = Math.PI / 2 + total / 2 / o.r;
          chars.forEach(function (ch, i) {
            var mid = phi - (adv[i] - o.ls) / 2 / o.r;
            c.save();
            c.translate(o.cx + o.r * Math.cos(mid), o.cy + o.r * Math.sin(mid));
            c.rotate(mid - Math.PI / 2);
            c.fillText(ch, 0, 0);
            c.restore();
            phi -= adv[i] / o.r;
          });
        }
        c.restore();
      });
      return cv;
    });
  }
  function fillSpaced(c, text, x, y, ls) {
    if (!ls) { c.fillText(text, x, y); return; }
    if ('letterSpacing' in c) { c.letterSpacing = ls + 'px'; c.fillText(text, x, y); c.letterSpacing = '0px'; return; }
    Array.from(text).forEach(function (ch) { c.fillText(ch, x, y); x += c.measureText(ch).width + ls; });
  }

  register('logo-maker', function (root) {
    injectCSS();
    var pal = LOGO_PALETTES[0];
    var L = { name: 'Brightpath', tagline: 'Creative studio', iconMode: 'icon', icon: 'sparkles', layout: 'left', font: 'inter', weight: 800, ls: -2, upper: false,
      shape: 'rounded', grad: true, text: pal.text, tag: pal.tag, c1: pal.c1, c2: pal.c2, ink: pal.ink, sw: 2 };
    var shuffle = 0, P = {};
    root.innerHTML = '';
    var left = h('div'), panel = h('div.card.dsn-panel');
    root.appendChild(h('div.split.wide-left', null, [left, h('div', null, [panel])]));

    P.light = h('div.dsn-lp.light', { role: 'img', 'aria-label': 'Logo on a light background' });
    P.dark = h('div.dsn-lp.dark', { role: 'img', 'aria-label': 'Logo on a dark background' });
    P.card = h('div.dsn-bcard', { role: 'img', 'aria-label': 'Logo on a sample business card' });
    left.appendChild(h('div.dsn-prev3', null, [
      h('div', null, [h('div.label', { text: 'On light', style: { marginBottom: '6px' } }), P.light]),
      h('div', null, [h('div.label', { text: 'On dark', style: { marginBottom: '6px' } }), P.dark]),
      h('div.wide', null, [h('div.label', { text: 'Business card', style: { marginBottom: '6px' } }), h('div.dsn-lp.wide', null, [P.card])])
    ]));
    P.vars = h('div.dsn-vars', { role: 'group', 'aria-label': 'Logo ideas' });
    var genBtn = btn('btn-sm', 'wand-sparkles', 'Generate new ideas', function () { shuffle++; renderVars(); });
    left.appendChild(h('div.card', { style: { marginTop: '16px' } }, [
      h('div.card-title', null, [h('h3', { text: 'Ideas for your name' }), genBtn]),
      h('p.muted.small', { text: 'Click an idea to use it as a starting point, then fine-tune it on the right.' }), P.vars]));

    function render() {
      var lay = logoLayout(L, false), dl = logoLayout(L, true);
      P.light.innerHTML = logoSVG(lay);
      P.dark.innerHTML = logoSVG(dl);
      var s = slug(L.name).replace(/-/g, '');
      P.card.innerHTML = '<div class="lg">' + logoSVG(lay) + '</div><div class="ct"><b>Your Name</b>Founder<br>hello@' + esc(s || 'yourbrand') + '.com · +91 98765 43210</div>';
    }
    var renderSoon = BT.debounce(function () { render(); renderVars(); }, 120);

    function variations() {
      var r = rng(hashStr(L.name.toLowerCase()) + shuffle * 7919), icons = iconsFor(L.name), out = [];
      var layouts = ['left', 'top', 'badge', 'wordmark'], shapes = ['rounded', 'circle', 'hexagon', 'none'];
      for (var i = 0; i < 12; i++) {
        var p = LOGO_PALETTES[Math.floor(r() * LOGO_PALETTES.length)], f = LOGO_FONTS[Math.floor(r() * LOGO_FONTS.length)];
        out.push(Object.assign({}, L, {
          layout: layouts[i % 4], shape: shapes[Math.floor(r() * shapes.length)], font: f,
          weight: f === 'impact' ? 400 : [600, 700, 800][Math.floor(r() * 3)], ls: f === 'impact' ? 2 : Math.round(r() * 3) * 4 - 2,
          upper: r() < 0.35, grad: r() < 0.7, iconMode: r() < 0.2 ? 'initials' : 'icon', icon: icons[Math.floor(r() * Math.min(icons.length, 8))],
          text: p.text, tag: p.tag, c1: p.c1, c2: p.c2, ink: p.ink
        }));
      }
      return out;
    }
    var VARS = [];
    function renderVars() {
      VARS = variations();
      P.vars.innerHTML = VARS.map(function (v, i) {
        var dk = i % 5 === 4;
        return '<button type="button" data-i="' + i + '" class="' + (dk ? 'dk' : '') + '" aria-label="Logo idea ' + (i + 1) + '">' + logoSVG(logoLayout(v, dk)) + '</button>';
      }).join('');
    }
    P.vars.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-i]');
      if (!b) return;
      Object.assign(L, VARS[+b.getAttribute('data-i')]);
      buildPanel(); render();
      BT.toast('Idea applied');
    });

    function buildPanel() {
      panel.innerHTML = '';
      var R = function () { render(); };
      var nm = input('text', L.name, { maxlength: 40, autocomplete: 'off' });
      nm.addEventListener('input', function () { L.name = nm.value; render(); renderSoon(); });
      var tg = input('text', L.tagline, { maxlength: 60, autocomplete: 'off', placeholder: 'Optional' });
      tg.addEventListener('input', function () { L.tagline = tg.value; render(); renderSoon(); });
      panel.appendChild(h('h3', { text: 'Your logo' }));
      panel.appendChild(field('Brand name', nm));
      panel.appendChild(field('Tagline', tg));

      panel.appendChild(sec('Layout', [seg([['left', 'Icon left'], ['top', 'Icon top'], ['badge', 'Badge'], ['wordmark', 'Wordmark']], L.layout, function (v) { L.layout = v; R(); }, 'Layout')]));

      var picker = iconPicker(L.icon, function (n) { L.icon = n; R(); }, 'Logo icon');
      var shapeSeg = segField('Icon background', [['none', 'None'], ['circle', 'Circle'], ['rounded', 'Rounded'], ['hexagon', 'Hexagon']], L.shape, function (v) { L.shape = v; R(); });
      function syncMark() { picker.style.display = L.iconMode === 'icon' ? '' : 'none'; shapeSeg.style.display = L.iconMode === 'none' ? 'none' : ''; }
      panel.appendChild(sec('Symbol', [
        segField('Symbol', [['icon', 'Icon'], ['initials', 'Initials'], ['none', 'None']], L.iconMode, function (v) { L.iconMode = v; syncMark(); R(); }),
        shapeSeg, picker,
        range('Icon line weight', 1, 3, 0.25, L.sw, null, function (v) { L.sw = v; R(); })
      ]));
      syncMark();

      var fs = select(LOGO_FONTS.map(function (id) { return [id, fontById(id).name]; }), L.font);
      fs.addEventListener('change', function () { L.font = fs.value; R(); });
      var ws = select([[400, 'Regular'], [500, 'Medium'], [600, 'Semibold'], [700, 'Bold'], [800, 'Extra bold']], String(L.weight));
      ws.addEventListener('change', function () { L.weight = +ws.value; R(); });
      panel.appendChild(sec('Typography', [h('div.dsn-two', null, [field('Font', fs), field('Weight', ws)]),
        range('Letter spacing', -6, 40, 1, L.ls, function (v) { return (v / 100).toFixed(2) + ' em'; }, function (v) { L.ls = v; R(); }),
        checkbox('UPPERCASE name', L.upper, function (v) { L.upper = v; R(); })]));

      var palWrap = h('div.dsn-pal', { role: 'group', 'aria-label': 'Colour palettes' });
      var pickers = {};
      LOGO_PALETTES.forEach(function (p) {
        var b = h('button', { type: 'button', 'aria-label': p.name + ' palette', title: p.name, 'aria-pressed': String(L.c1 === p.c1 && L.text === p.text), html: '<i style="background:' + p.text + '"></i><i style="background:' + p.c1 + '"></i><i style="background:' + p.c2 + '"></i>' });
        b.addEventListener('click', function () {
          L.text = p.text; L.tag = p.tag; L.c1 = p.c1; L.c2 = p.c2; L.ink = p.ink;
          Object.keys(pickers).forEach(function (k) { pickers[k].input.value = L[k]; });
          BT.$$('button', palWrap).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          R();
        });
        palWrap.appendChild(b);
      });
      [['text', 'Name'], ['tag', 'Tagline'], ['c1', 'Brand 1'], ['c2', 'Brand 2'], ['ink', 'Icon']].forEach(function (k) {
        pickers[k[0]] = colorInput(k[1], L[k[0]], function (v) { L[k[0]] = v; R(); });
      });
      panel.appendChild(sec('Colours', [palWrap, h('div.dsn-colors', { style: { marginTop: '12px' } }, Object.keys(pickers).map(function (k) { return pickers[k]; })),
        h('div', { style: { marginTop: '12px' } }, [checkbox('Gradient fill', L.grad, function (v) { L.grad = v; R(); })])]));

      var stem = function () { return 'logo-' + slug(L.name); };
      var svgBtn = btn('btn-primary', 'download', 'SVG (editable)', function () {
        BT.download(new Blob([logoSVG(logoLayout(L, false), L.name)], { type: 'image/svg+xml' }), stem() + '.svg');
        BT.toast('SVG saved');
      });
      svgBtn.setAttribute('data-svg', '');
      var pngs = [512, 1024, 2048].map(function (n) {
        var b = btn('', 'image', 'PNG ' + n + ' px', function () {
          BT.busy(b, function () { return logoCanvas(logoLayout(L, false), n).then(function (cv) { return saveCanvas(cv, 'image/png', stem() + '-' + n); }); }, 'Rendering…');
        });
        b.setAttribute('data-png', n);
        return b;
      });
      var darkPng = btn('', 'moon', 'PNG for dark backgrounds', function () {
        BT.busy(darkPng, function () { return logoCanvas(logoLayout(L, true), 2048).then(function (cv) { return saveCanvas(cv, 'image/png', stem() + '-dark-2048'); }); }, 'Rendering…');
      });
      var fav = btn('', 'app-window', 'Favicon / app icon 512', function () {
        BT.busy(fav, function () { return logoCanvas(faviconLayout(L), 512, true).then(function (cv) { return saveCanvas(cv, 'image/png', stem() + '-icon-512'); }); }, 'Rendering…');
      });
      fav.setAttribute('data-fav', '');
      panel.appendChild(sec('Download', [
        h('div.dsn-dl', null, [svgBtn].concat(pngs, [darkPng, fav])),
        h('p.muted.small', { style: { margin: '10px 0 0' }, html: 'PNG files have a transparent background and the fonts are baked in (outline-safe). The SVG keeps text editable, but uses fonts installed on each computer, so it can look different elsewhere. Use the PNG when in doubt.' })
      ]));
    }
    buildPanel();
    render();
    renderVars();
    fontsReady().then(function () { render(); renderVars(); });
  });

  // ====================================================== Mockup generator
  var FRAME_COLORS = {
    graphite: { name: 'Graphite', a: '#3a3d44', b: '#1c1e22', edge: '#5b5f68' },
    silver: { name: 'Silver', a: '#e7e9ec', b: '#b9bdc4', edge: '#f7f8fa' },
    gold: { name: 'Gold', a: '#efe0c4', b: '#c9ad82', edge: '#fbf2e2' },
    blue: { name: 'Blue', a: '#4b5f7a', b: '#28364a', edge: '#6f86a6' },
    pink: { name: 'Pink', a: '#f4cfd8', b: '#d99aab', edge: '#fde8ee' }
  };
  function metal(c, x, y, w, hh, fc, vertical) {
    var g = vertical ? c.createLinearGradient(x, y, x, y + hh) : c.createLinearGradient(x, y, x + w, y);
    g.addColorStop(0, fc.b); g.addColorStop(0.08, fc.edge); g.addColorStop(0.2, fc.a); g.addColorStop(0.8, fc.a); g.addColorStop(0.92, fc.edge); g.addColorStop(1, fc.b);
    return g;
  }
  function paintScreen(c, s, shot, fit, bg) {
    c.save();
    rrect(c, s.x, s.y, s.w, s.h, s.r);
    c.clip();
    c.fillStyle = bg || '#000';
    c.fillRect(s.x, s.y, s.w, s.h);
    if (shot) drawFit(c, shot, s.x, s.y, s.w, s.h, fit === 'contain' ? 'contain' : 'cover', 1, 0, 0, fit === 'top');
    // faint glass reflection
    var g = c.createLinearGradient(s.x, s.y, s.x + s.w, s.y + s.h);
    g.addColorStop(0, 'rgba(255,255,255,0.07)'); g.addColorStop(0.45, 'rgba(255,255,255,0.0)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(s.x, s.y, s.w, s.h);
    c.restore();
  }
  /** Device geometry + painter. o: {frame, theme, url, landscape} */
  function deviceSpec(id, o) {
    var fc = FRAME_COLORS[o.frame] || FRAME_COLORS.graphite;
    if (id === 'iphone') {
      return { w: 448, h: 900, screen: { x: 22, y: 18, w: 404, h: 864, r: 54 }, paint: function (c, shot, fit) {
        c.fillStyle = metal(c, 0, 0, 448, 900, fc);
        [[0, 168, 36], [0, 232, 64], [0, 312, 64]].forEach(function (b) { rrect(c, b[0], b[1], 8, b[2], 3); c.fill(); });
        rrect(c, 440, 262, 8, 104, 3); c.fill();
        rrect(c, 4, 0, 440, 900, 72); c.fillStyle = metal(c, 4, 0, 440, 900, fc); c.fill();
        rrect(c, 10, 6, 428, 888, 66); c.fillStyle = '#07080a'; c.fill();
        paintScreen(c, this.screen, shot, fit);
        rrect(c, 224 - 62, 32, 124, 36, 18); c.fillStyle = '#000'; c.fill();
        c.fillStyle = '#1a2233'; c.beginPath(); c.arc(224 + 40, 50, 7, 0, Math.PI * 2); c.fill();
      } };
    }
    if (id === 'android') {
      return { w: 440, h: 900, screen: { x: 17, y: 16, w: 398, h: 868, r: 36 }, paint: function (c, shot, fit) {
        c.fillStyle = metal(c, 0, 0, 440, 900, fc);
        rrect(c, 432, 210, 8, 110, 3); c.fill();
        rrect(c, 432, 350, 8, 64, 3); c.fill();
        rrect(c, 4, 0, 430, 900, 46); c.fillStyle = metal(c, 4, 0, 430, 900, fc); c.fill();
        rrect(c, 9, 5, 420, 890, 42); c.fillStyle = '#07080a'; c.fill();
        paintScreen(c, this.screen, shot, fit);
        c.fillStyle = '#000'; c.beginPath(); c.arc(216, 44, 11, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#1c2436'; c.beginPath(); c.arc(216, 44, 5, 0, Math.PI * 2); c.fill();
      } };
    }
    if (id === 'tablet') {
      var lw = o.landscape ? 1240 : 900, lh = o.landscape ? 900 : 1240;
      return { w: lw, h: lh, screen: { x: 36, y: 36, w: lw - 72, h: lh - 72, r: 22 }, paint: function (c, shot, fit) {
        rrect(c, 0, 0, lw, lh, 58); c.fillStyle = metal(c, 0, 0, lw, lh, fc); c.fill();
        rrect(c, 6, 6, lw - 12, lh - 12, 53); c.fillStyle = '#07080a'; c.fill();
        paintScreen(c, this.screen, shot, fit);
        c.fillStyle = '#1c2436';
        c.beginPath();
        if (o.landscape) c.arc(18, lh / 2, 5, 0, Math.PI * 2); else c.arc(lw / 2, 18, 5, 0, Math.PI * 2);
        c.fill();
      } };
    }
    if (id === 'laptop') {
      var LW = 1340, W = 1640, lx = 150, LH = 860;
      return { w: W, h: 1110, screen: { x: lx + 32, y: 38, w: LW - 64, h: LH - 84, r: 6 }, paint: function (c, shot, fit) {
        // lid
        rrect(c, lx, 0, LW, LH, 30); c.fillStyle = metal(c, lx, 0, LW, LH, fc); c.fill();
        rrect(c, lx + 5, 5, LW - 10, LH - 10, 26); c.fillStyle = '#0a0b0e'; c.fill();
        paintScreen(c, this.screen, shot, fit);
        c.fillStyle = '#20242e'; c.beginPath(); c.arc(W / 2, 20, 5, 0, Math.PI * 2); c.fill();
        // hinge
        var hg = c.createLinearGradient(0, LH, 0, LH + 14);
        hg.addColorStop(0, '#111'); hg.addColorStop(1, '#3a3d44');
        c.fillStyle = hg; c.fillRect(lx + 40, LH, LW - 80, 14);
        // keyboard deck (seen from slightly above)
        var top = LH + 12, bot = 1078, tw = LW + 20, bw = W;
        c.beginPath();
        c.moveTo(W / 2 - tw / 2, top); c.lineTo(W / 2 + tw / 2, top); c.lineTo(W / 2 + bw / 2, bot); c.lineTo(W / 2 - bw / 2, bot); c.closePath();
        var dg = c.createLinearGradient(0, top, 0, bot);
        dg.addColorStop(0, fc.b); dg.addColorStop(0.12, fc.a); dg.addColorStop(1, fc.edge);
        c.fillStyle = dg; c.fill();
        function at(t, u) { var wy = lerp(tw, bw, t); return { x: W / 2 - wy / 2 + wy * u, y: lerp(top, bot, t) }; }
        // keys: 5 rows
        var rows = [14, 14, 13, 12, 10];
        rows.forEach(function (n, r) {
          var t0 = 0.08 + r * 0.105, t1 = t0 + 0.085, u0 = 0.13, u1 = 0.87;
          for (var i = 0; i < n; i++) {
            var a = u0 + (u1 - u0) * i / n + 0.004, b = u0 + (u1 - u0) * (i + 1) / n - 0.004;
            if (r === 4 && i === Math.floor(n / 2) - 1) { b = u0 + (u1 - u0) * (i + 3) / n - 0.004; i += 2; }
            var p1 = at(t0, a), p2 = at(t0, b), p3 = at(t1, b), p4 = at(t1, a);
            c.beginPath(); c.moveTo(p1.x, p1.y); c.lineTo(p2.x, p2.y); c.lineTo(p3.x, p3.y); c.lineTo(p4.x, p4.y); c.closePath();
            c.fillStyle = '#1b1d22'; c.fill();
          }
        });
        // trackpad
        var q1 = at(0.66, 0.36), q2 = at(0.66, 0.64), q3 = at(0.95, 0.65), q4 = at(0.95, 0.35);
        c.beginPath(); c.moveTo(q1.x, q1.y); c.lineTo(q2.x, q2.y); c.lineTo(q3.x, q3.y); c.lineTo(q4.x, q4.y); c.closePath();
        c.fillStyle = 'rgba(0,0,0,.08)'; c.fill(); c.strokeStyle = 'rgba(0,0,0,.14)'; c.lineWidth = 1.5; c.stroke();
        // front lip
        var lg = c.createLinearGradient(0, bot, 0, 1110);
        lg.addColorStop(0, fc.b); lg.addColorStop(1, mixHex(fc.b, '#000000', 0.35));
        rrect(c, 0, bot - 2, W, 32, 14); c.fillStyle = lg; c.fill();
        rrect(c, W / 2 - 110, bot - 2, 220, 12, 6); c.fillStyle = 'rgba(0,0,0,.18)'; c.fill();
      } };
    }
    if (id === 'monitor') {
      var MW = 1600, MH = 1010;
      return { w: MW, h: 1230, screen: { x: 24, y: 24, w: MW - 48, h: 880, r: 4 }, paint: function (c, shot, fit) {
        rrect(c, 0, 0, MW, MH, 26); c.fillStyle = metal(c, 0, 0, MW, MH, fc); c.fill();
        c.save(); rrect(c, 0, 0, MW, MH, 26); c.clip();
        c.fillStyle = '#08090c'; c.fillRect(0, 0, MW, 928); c.restore();
        paintScreen(c, this.screen, shot, fit);
        // stand
        var ng = c.createLinearGradient(MW / 2 - 160, 0, MW / 2 + 160, 0);
        ng.addColorStop(0, fc.b); ng.addColorStop(0.5, fc.a); ng.addColorStop(1, fc.b);
        c.beginPath(); c.moveTo(MW / 2 - 150, MH); c.lineTo(MW / 2 + 150, MH); c.lineTo(MW / 2 + 128, 1196); c.lineTo(MW / 2 - 128, 1196); c.closePath();
        c.fillStyle = ng; c.fill();
        c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(MW / 2 - 150, MH, 300, 10);
        rrect(c, MW / 2 - 270, 1192, 540, 32, 12); c.fillStyle = metal(c, MW / 2 - 270, 1192, 540, 32, fc, true); c.fill();
      } };
    }
    if (id === 'browser') {
      var BW = 1440, BH = 940, dark = o.theme === 'dark';
      return { w: BW, h: BH, screen: { x: 0, y: 54, w: BW, h: BH - 54, r: 0 }, paint: function (c, shot, fit) {
        c.save();
        rrect(c, 0, 0, BW, BH, 16); c.clip();
        c.fillStyle = dark ? '#26282e' : '#eceef2'; c.fillRect(0, 0, BW, 54);
        c.fillStyle = dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)'; c.fillRect(0, 53, BW, 1);
        ['#ff5f57', '#febc2e', '#28c840'].forEach(function (col, i) { c.fillStyle = col; c.beginPath(); c.arc(28 + i * 24, 27, 7.5, 0, Math.PI * 2); c.fill(); });
        // nav arrows
        c.strokeStyle = dark ? '#8a8f9c' : '#8a8f9c'; c.lineWidth = 2.2; c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(122, 20); c.lineTo(115, 27); c.lineTo(122, 34); c.stroke();
        c.beginPath(); c.moveTo(146, 20); c.lineTo(153, 27); c.lineTo(146, 34); c.stroke();
        var ux = 190, uw = BW - 380;
        rrect(c, ux, 12, uw, 30, 15); c.fillStyle = dark ? '#18191d' : '#ffffff'; c.fill();
        // padlock
        var lx2 = ux + 20, ly = 27;
        c.strokeStyle = dark ? '#9aa0ad' : '#6b7280'; c.lineWidth = 1.6;
        c.beginPath(); c.arc(lx2, ly - 3, 3.6, Math.PI, 0); c.stroke();
        c.fillStyle = dark ? '#9aa0ad' : '#6b7280'; rrect(c, lx2 - 5, ly - 3, 10, 8, 2); c.fill();
        c.fillStyle = dark ? '#d5d8e0' : '#374151'; c.font = '500 15px ' + FONTS[0].css; c.textAlign = 'left'; c.textBaseline = 'middle';
        var url = String(o.url || '').slice(0, 120);
        c.fillText(url, ux + 36, 27.5, uw - 60);
        c.restore();
        paintScreen(c, { x: 0, y: 54, w: BW, h: BH - 54, r: 0 }, shot, fit, dark ? '#111' : '#fff');
        c.save(); rrect(c, 0.5, 0.5, BW - 1, BH - 1, 16); c.strokeStyle = dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)'; c.lineWidth = 1; c.stroke(); c.restore();
      }, clip: function (c) { rrect(c, 0, 0, BW, BH, 16); } };
    }
    // watch
    return { w: 320, h: 560, screen: { x: 26, y: 120, w: 260, h: 320, r: 64 }, paint: function (c, shot, fit) {
      var sg = c.createLinearGradient(0, 0, 320, 0);
      var strap = o.frame === 'silver' ? ['#d9dce1', '#b5bac2'] : o.frame === 'gold' ? ['#e8d8bf', '#c4a77d'] : o.frame === 'pink' ? ['#f3c7d2', '#d996a8'] : o.frame === 'blue' ? ['#3f5571', '#26354a'] : ['#2b2e35', '#16181c'];
      sg.addColorStop(0, strap[1]); sg.addColorStop(0.5, strap[0]); sg.addColorStop(1, strap[1]);
      rrect(c, 52, 0, 208, 130, 26); c.fillStyle = sg; c.fill();
      rrect(c, 52, 430, 208, 130, 26); c.fillStyle = sg; c.fill();
      c.fillStyle = metal(c, 0, 0, 320, 560, fc);
      rrect(c, 300, 200, 20, 60, 7); c.fill();
      rrect(c, 302, 290, 12, 72, 5); c.fill();
      rrect(c, 0, 94, 312, 372, 88); c.fillStyle = metal(c, 0, 94, 312, 372, fc); c.fill();
      rrect(c, 8, 102, 296, 356, 80); c.fillStyle = '#050506'; c.fill();
      paintScreen(c, { x: 26, y: 120, w: 260, h: 320, r: 64 }, shot, fit);
    } };
  }
  var DEVICES = [
    ['iphone', 'iPhone-style', 'smartphone'], ['android', 'Android phone', 'smartphone'], ['tablet', 'Tablet', 'square'],
    ['laptop', 'Laptop', 'monitor-smartphone'], ['monitor', 'Desktop', 'monitor-play'], ['browser', 'Browser', 'app-window'], ['watch', 'Smartwatch', 'clock']
  ];

  register('mockup-generator', function (root, ctx) {
    injectCSS();
    var S, view;
    function start() {
      if (view) { view.destroy(); view = null; }
      root.innerHTML = '';
      root.appendChild(BT.dropzone({ accept: 'image/*', title: 'Choose a screenshot', icon: 'monitor-smartphone', hint: 'or drag and drop it here · PNG, JPG, WebP',
        color: ctx.category && ctx.category.color, onFiles: function (f) { open(f[0]); } }));
      root.appendChild(pasteHint());
    }
    function open(file) {
      root.innerHTML = '';
      root.appendChild(loadingEl());
      decode(file, 4096).then(function (im) {
        var ar = im.w / im.h, dev = ar > 1.25 ? 'browser' : ar < 0.62 ? 'iphone' : ar < 0.9 ? 'tablet' : 'laptop';
        S = { im: im, shot2: null, device: dev, scene: 'single', frame: 'graphite', fit: 'top', theme: 'light', url: 'yourwebsite.com', landscape: false,
          tilt: 0, shadow: true, bg: { type: 'linear', c1: '#eef2ff', c2: '#fce7f3', angle: 135 }, scale: 2 };
        build();
      }).catch(function (e) { BT.toast(e.message, 'error'); start(); });
    }
    function opts() { return { frame: S.frame, theme: S.theme, url: S.url, landscape: S.landscape }; }
    /** Device group (unpadded) layout: [{spec, x, y, s, shot}] and its size. */
    function group() {
      if (S.scene === 'combo') {
        var lap = deviceSpec('laptop', opts()), ph = deviceSpec('iphone', opts()), ps = 0.6;
        var w = lap.w + ph.w * ps * 0.45, hh = lap.h + 30;
        return { w: w, h: hh, items: [
          { spec: lap, x: 0, y: 0, s: 1, shot: S.im.canvas },
          { spec: ph, x: lap.w - ph.w * ps * 0.55, y: hh - ph.h * ps, s: ps, shot: (S.shot2 || S.im).canvas }
        ] };
      }
      var sp = deviceSpec(S.device, opts());
      return { w: sp.w, h: sp.h, items: [{ spec: sp, x: 0, y: 0, s: 1, shot: S.im.canvas }] };
    }
    function sceneSize() {
      var g = group(), pad = Math.max(g.w, g.h) * 0.12, m = Math.max(g.w + 2 * pad, g.h + 2 * pad);
      return { w: (g.w + 2 * pad) / m * 1200, h: (g.h + 2 * pad) / m * 1200, g: g, pad: pad, unit: 1200 / m };
    }
    function renderScene(k) {
      var sz = sceneSize(), g = sz.g, u = sz.unit * k;
      var W = Math.round(sz.w * k), H = Math.round(sz.h * k);
      var out = mk(W, H), c = c2d(out);
      if (S.bg.type !== 'none') paintBg(c, W, H, S.bg);
      // device group at scale u
      var dev = mk(g.w * u + 2, g.h * u + 2), dc = c2d(dev);
      dc.scale(u, u);
      g.items.forEach(function (it) {
        dc.save();
        dc.translate(it.x, it.y);
        dc.scale(it.s, it.s);
        if (S.scene === 'combo' && it.s < 1) { dc.shadowColor = 'rgba(0,0,0,.35)'; dc.shadowBlur = 40; dc.shadowOffsetY = 16; rrect(dc, 4, 0, it.spec.w - 8, it.spec.h, 70); dc.fillStyle = '#000'; dc.fill(); dc.shadowColor = 'transparent'; }
        it.spec.paint(dc, it.shot, S.fit);
        dc.restore();
      });
      var src = dev;
      if (S.tilt) src = warp(dev, S.tilt);
      var dx = (W - src.width) / 2, dy = (H - src.height) / 2;
      if (S.shadow) {
        // contact shadow + soft drop shadow
        c.save();
        var cx = W / 2, cy = dy + src.height * 0.985, rw = src.width * 0.46, rh = Math.max(8, src.height * 0.035);
        var rg = c.createRadialGradient(cx, cy, 0, cx, cy, rw);
        rg.addColorStop(0, 'rgba(0,0,0,.30)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
        c.translate(cx, cy); c.scale(1, rh / rw); c.translate(-cx, -cy);
        c.fillStyle = rg; c.beginPath(); c.arc(cx, cy, rw, 0, Math.PI * 2); c.fill();
        c.restore();
        c.save();
        c.shadowColor = 'rgba(15,23,42,.35)'; c.shadowBlur = 60 * u; c.shadowOffsetY = 30 * u;
        c.drawImage(src, dx, dy);
        c.restore();
      } else c.drawImage(src, dx, dy);
      return out;
    }
    /** Simple 3D-ish rotateY: draw vertical strips with perspective scaling. */
    function warp(src, deg) {
      var a = rad(deg), w = src.width, hh = src.height, f = w * 2.4, cx = w / 2;
      function proj(x) { var X = (x - cx) * Math.cos(a), z = (x - cx) * Math.sin(a); var s = f / (f + z); return { x: X * s, s: s }; }
      var l = proj(0), r = proj(w), minX = Math.min(l.x, r.x), maxX = Math.max(l.x, r.x), maxS = Math.max(l.s, r.s);
      var out = mk(maxX - minX + 2, hh * maxS + 2), c = c2d(out), oy = out.height / 2;
      var step = Math.max(1, Math.round(w / 1400));
      for (var x = 0; x < w; x += step) {
        var p0 = proj(x), p1 = proj(Math.min(w, x + step)), sh = hh * p0.s;
        c.drawImage(src, x, 0, Math.min(step, w - x), hh, p0.x - minX, oy - sh / 2, Math.max(0.6, p1.x - p0.x) + 0.6, sh);
      }
      return out;
    }
    function build() {
      root.innerHTML = '';
      root.appendChild(headBar('monitor-smartphone', S.im.name, '<span class="badge">' + S.im.ow + ' × ' + S.im.oh + ' px</span>', start));
      var ed = editor(root);
      var cache = null;
      view = canvasView(ed.stage, { label: 'Mockup preview', tabindex: '-1', size: function () { var z = sceneSize(); return { w: z.w, h: z.h }; }, draw: function (c, k) {
        if (!cache || cache.k !== k || cache.v !== ver) cache = { k: k, v: ver, cv: renderScene(k) };
        c.drawImage(cache.cv, 0, 0, c.canvas.width, c.canvas.height);
      } });
      var ver = 0;
      function R() { ver++; view.render(); dims(); }
      ed.under.innerHTML = '<span data-dims></span>';
      var pn = ed.panel;

      var devGrid = h('div.dsn-chips', { role: 'group', 'aria-label': 'Device' });
      DEVICES.forEach(function (d) {
        var b = h('button.chip', { type: 'button', 'aria-pressed': String(S.device === d[0]), html: BT.icon(d[2]) + '<span>' + esc(d[1]) + '</span>' });
        b.addEventListener('click', function () {
          S.device = d[0]; S.scene = 'single'; sceneSeg.seg.set('single');
          BT.$$('button', devGrid).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          sync(); R();
        });
        devGrid.appendChild(b);
      });
      var sceneSeg = segField('Scene', [['single', 'One device'], ['combo', 'Phone + laptop']], S.scene, function (v) { S.scene = v; sync(); R(); });
      pn.appendChild(h('h3', { text: 'Device' }));
      pn.appendChild(devGrid);
      var shot2 = h('input', { type: 'file', accept: 'image/*', 'aria-label': 'Phone screenshot' });
      shot2.style.cssText = 'position:absolute;inset:0;opacity:0;cursor:pointer';
      shot2.addEventListener('change', function () {
        var f = shot2.files[0]; shot2.value = '';
        if (!f) return;
        decode(f, 3000).then(function (im) { S.shot2 = im; R(); BT.toast('Phone screenshot added'); }).catch(function (e) { BT.toast(e.message, 'error'); });
      });
      var shot2Btn = h('label.btn.btn-sm', { html: BT.icon('image-plus') + '<span>Different phone screenshot</span>', style: { position: 'relative', overflow: 'hidden' } }, [shot2]);
      pn.appendChild(h('div', { style: { marginTop: '14px' } }, [sceneSeg, shot2Btn]));

      var colors = h('div.dsn-chips', { role: 'group', 'aria-label': 'Frame colour' });
      Object.keys(FRAME_COLORS).forEach(function (k) {
        var fc = FRAME_COLORS[k];
        var b = h('button.chip', { type: 'button', 'aria-pressed': String(S.frame === k), html: '<span class="dot" style="background:linear-gradient(135deg,' + fc.edge + ',' + fc.b + ');width:12px;height:12px"></span><span>' + fc.name + '</span>' });
        b.addEventListener('click', function () { S.frame = k; BT.$$('button', colors).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); R(); });
        colors.appendChild(b);
      });
      var colorSec = sec('Frame colour', [colors]);
      pn.appendChild(colorSec);

      var url = input('text', S.url, { maxlength: 120, autocomplete: 'off' });
      url.addEventListener('input', function () { S.url = url.value; R(); });
      var browserBox = h('div', null, [segField('Window style', [['light', 'Light'], ['dark', 'Dark']], S.theme, function (v) { S.theme = v; R(); }), field('Address bar text', url)]);
      var tabletBox = segField('Orientation', [['p', 'Portrait'], ['l', 'Landscape']], 'p', function (v) { S.landscape = v === 'l'; R(); });
      pn.appendChild(sec('Screen', [
        segField('Screenshot fit', [['top', 'Fill (top)'], ['cover', 'Fill (centre)'], ['contain', 'Fit whole']], S.fit, function (v) { S.fit = v; R(); }),
        browserBox, tabletBox
      ]));

      var tilt = range('Perspective tilt', -30, 30, 1, S.tilt, function (v) { return v === 0 ? 'Flat' : (v < 0 ? 'Left ' : 'Right ') + Math.abs(v) + '°'; }, function (v) { S.tilt = v; R(); });
      pn.appendChild(sec('Scene', [tilt, checkbox('Soft shadow', S.shadow, function (v) { S.shadow = v; R(); }),
        h('div', { style: { marginTop: '12px' } }, [bgEditor(S.bg, R, { allowNone: true })])]));

      var scale = select([[1, '1× (1200 px)'], [2, '2× (2400 px, recommended)'], [3, '3× (3600 px)']], String(S.scale));
      scale.addEventListener('change', function () { S.scale = +scale.value; dims(); });
      var dl = btn('btn-primary', 'download', 'Download PNG', function () {
        BT.busy(dl, function () {
          return new Promise(function (res) { setTimeout(res, 20); }).then(function () {
            var out = renderScene(S.scale);
            return saveCanvas(out, 'image/png', 'mockup-' + (S.scene === 'combo' ? 'phone-laptop' : S.device) + '-' + out.width + 'x' + out.height);
          });
        }, 'Rendering…');
      });
      dl.setAttribute('data-download', '');
      pn.appendChild(sec('Export', [field('Resolution (long side)', scale), h('div.dsn-actions', null, [dl, btn('', 'rotate-ccw', 'Start over', start)])]));

      function dims() {
        var z = sceneSize(), el = BT.$('[data-dims]', root);
        if (el) el.textContent = 'Export: ' + Math.round(z.w * S.scale) + ' × ' + Math.round(z.h * S.scale) + ' px PNG' + (S.bg.type === 'none' ? ' with transparent background' : '');
      }
      function sync() {
        var single = S.scene === 'single';
        browserBox.style.display = single && S.device === 'browser' ? '' : 'none';
        tabletBox.style.display = single && S.device === 'tablet' ? '' : 'none';
        colorSec.style.display = single && S.device === 'browser' ? 'none' : '';
        shot2Btn.style.display = single ? 'none' : '';
        shot2Btn.style.marginTop = '10px';
        dims();
      }
      sync();
    }
    pasteSupport(root, function (f) { open(f[0]); });
    start();
  });

  // core.js may boot before this deferred script has executed; if the page
  // already shows the "failed to load" notice for one of our tools, start it now.
  (function rescue() {
    var root = doc.getElementById('tool-root');
    if (!root) return;
    var id = root.getAttribute('data-tool');
    var tool = BT.tool(id);
    if (!tool || tool.cat !== 'design' || root.querySelector('.loading')) return;
    if (!root.querySelector('.notice.error')) return;
    var impl = IMPLS[id];
    if (!impl) return;
    root.innerHTML = '';
    root.setAttribute('data-mounted', '1');
    try { impl(root, { tool: tool, category: BT.category(tool.cat) }); } catch (e) { console.error(e); }
  })();
})();
