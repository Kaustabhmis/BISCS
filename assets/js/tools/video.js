/*
 * BISCS Tools — Video & audio tools.
 * Screen recorder, video compressor, trimmer, converter, video to GIF and
 * audio recorder. Recording uses MediaRecorder; processing runs ffmpeg.wasm
 * (self-hosted, loaded through BT.loadFFmpeg) in a web worker.
 * Files never leave the visitor's device.
 */
(function () {
  'use strict';
  var BT = window.BT;
  var doc = document;
  var h = BT.h, esc = BT.esc;
  var IMPLS = {};
  function register(id, fn) { IMPLS[id] = fn; BT.impl(id, fn); }
  function noop() {}

  // =================================================================== CSS
  var CSS = [
    '.vid-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 14px;margin-bottom:16px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);box-shadow:var(--shadow-sm)}',
    '.vid-ic{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#e5484d,#b4232a);flex:none}',
    '.vid-txt{flex:1;min-width:0}',
    '.vid-name{font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}',
    '.vid-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:3px}',
    '.vid-stage{position:relative;background:#05060a;border-radius:var(--radius-sm);overflow:hidden;display:grid;place-items:center;min-height:180px}',
    '.vid-stage video,.vid-stage img{display:block;max-width:100%;max-height:min(60vh,520px);width:auto;height:auto}',
    '.vid-stage .vid-nopreview{color:#c9cede;padding:24px;text-align:center;font-size:.9rem;max-width:420px}',
    '.vid-panel h3{font-size:1rem;margin:0 0 12px}',
    '.vid-panel .field:last-child{margin-bottom:0}',
    '.vid-sec{padding-top:14px;margin-top:14px;border-top:1px solid var(--border)}',
    '.vid-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}',
    '.vid-actions .btn-primary{flex:1 1 200px}',
    '.vid-seg{display:flex;width:100%}.vid-seg button{flex:1;padding:7px 8px}',
    '.vid-range{display:flex;align-items:center;gap:10px}.vid-range input{flex:1;min-width:0}',
    '.vid-val{min-width:64px;text-align:right;font-variant-numeric:tabular-nums;font-weight:600;font-size:.88rem;color:var(--text-2)}',
    '.vid-out{margin-top:16px}.vid-out>*+*{margin-top:16px}',
    '.vid-prog .vid-prow{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-weight:650;min-width:0}',
    '.vid-prog .vid-ptitle{min-width:0;overflow-wrap:anywhere}',
    '.vid-prog .vid-pct{margin-left:auto;font-variant-numeric:tabular-nums;color:var(--text-2)}',
    '.vid-prog .muted{margin-top:8px}',
    '.vid-prog .vid-actions{margin-top:10px}',
    '.progress.vid-ind>span{width:35%!important;animation:vid-ind 1.2s ease-in-out infinite}',
    '@keyframes vid-ind{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}',
    '@media (prefers-reduced-motion:reduce){.progress.vid-ind>span{animation:none;width:100%!important;opacity:.5}}',
    '.vid-loading{display:flex;align-items:center;gap:10px;color:var(--text-3);padding:40px 0}',
    '.vid-privacy{margin-top:14px}',
    // dual-handle range
    '.vid-dr{position:relative;height:60px;margin:12px 0 4px;user-select:none;-webkit-user-select:none}',
    '.vid-strip{position:absolute;left:8px;right:8px;top:6px;bottom:6px;display:flex;border-radius:8px;overflow:hidden;background:var(--surface-2);border:1px solid var(--border)}',
    '.vid-strip canvas{flex:1 1 0;min-width:0;width:100%;height:100%;object-fit:cover;display:block}',
    '.vid-strip canvas.vid-wavec{flex:none;object-fit:fill}',
    '.vid-shade{position:absolute;top:6px;bottom:6px;background:rgba(8,10,20,.6);pointer-events:none}',
    '.vid-shade.l{left:8px;border-radius:8px 0 0 8px}.vid-shade.r{right:8px;border-radius:0 8px 8px 0}',
    '.vid-selbox{position:absolute;top:3px;bottom:3px;border-top:3px solid var(--brand);border-bottom:3px solid var(--brand);pointer-events:none}',
    '.vid-ph{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.55);pointer-events:none;z-index:4}',
    '.vid-dr input[type=range]{position:absolute;left:0;top:0;width:100%;height:100%;margin:0;padding:0;background:transparent;pointer-events:none;-webkit-appearance:none;appearance:none;accent-color:auto}',
    '.vid-dr input[type=range]:focus{outline:none;box-shadow:none}',
    '.vid-dr input[type=range]::-webkit-slider-runnable-track{height:100%;background:transparent;border:0}',
    '.vid-dr input[type=range]::-moz-range-track{height:100%;background:transparent;border:0}',
    '.vid-dr input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;pointer-events:auto;width:16px;height:60px;border-radius:6px;background:var(--brand);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);cursor:ew-resize}',
    '.vid-dr input[type=range]::-moz-range-thumb{pointer-events:auto;width:12px;height:56px;border-radius:6px;background:var(--brand);border:2px solid #fff;cursor:ew-resize}',
    '.vid-dr input[type=range]:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 4px rgba(79,70,229,.5)}',
    '.vid-dr input[type=range]:focus-visible::-moz-range-thumb{box-shadow:0 0 0 4px rgba(79,70,229,.5)}',
    '.vid-times{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-items:end;margin-top:10px}',
    '.vid-times .field{margin:0}',
    '.vid-times input{font-variant-numeric:tabular-nums}',
    '.vid-tbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}',
    '.vid-tbar .vid-now{margin-left:auto;font:600 .85rem var(--mono);color:var(--text-3)}',
    // option cards
    '.vid-opts{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:8px}',
    '.vid-opt{border:2px solid var(--border);background:var(--surface);border-radius:12px;padding:9px 11px;text-align:left;cursor:pointer;font:inherit;color:var(--text);min-width:0}',
    '.vid-opt b{display:block;font-size:.92rem}',
    '.vid-opt small{display:block;color:var(--text-3);font-size:.75rem;margin-top:2px;line-height:1.35}',
    '.vid-opt[aria-pressed=true]{border-color:var(--brand);background:var(--brand-soft)}',
    '.vid-opt:focus-visible{outline:none;box-shadow:var(--ring)}',
    '.vid-opt:disabled{opacity:.45;cursor:not-allowed}',
    // recorder
    '.vid-recbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px}',
    '.vid-dot{width:12px;height:12px;border-radius:50%;background:var(--danger);animation:vid-blink 1s steps(2) infinite;flex:none}',
    '.vid-dot.paused{animation:none;background:var(--warn)}.vid-dot.idle{animation:none;background:var(--text-3)}',
    '@keyframes vid-blink{50%{opacity:.25}}',
    '.vid-timer{font:700 1.5rem/1 var(--mono);font-variant-numeric:tabular-nums}',
    '.vid-recbar .btn-group{margin-left:auto}',
    '.vid-live{position:relative;background:#05060a;border-radius:var(--radius-sm);overflow:hidden;aspect-ratio:16/9;display:grid;place-items:center}',
    '.vid-live video{width:100%;height:100%;object-fit:contain}',
    '.vid-count{position:absolute;inset:0;display:grid;place-items:center;background:rgba(8,10,20,.72);color:#fff;font:800 clamp(4rem,18vw,9rem)/1 var(--font);z-index:3}',
    '.vid-camopts{padding:12px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface-2);margin:2px 0 14px}',
    '.vid-camopts .field{margin-bottom:10px}',
    '.vid-checks{display:flex;flex-direction:column;gap:12px;margin-bottom:14px}',
    '.vid-checks .hint{display:block;font-size:.8rem;color:var(--text-3);margin:-6px 0 0 25px}',
    '.vid-wave{width:100%;height:120px;display:block;border-radius:var(--radius-sm);background:var(--surface-2);border:1px solid var(--border)}',
    '.vid-meter{height:8px;border-radius:99px;background:var(--surface-2);border:1px solid var(--border);overflow:hidden;margin-top:8px}',
    '.vid-meter span{display:block;height:100%;width:0;background:linear-gradient(90deg,#16a34a,#eab308 70%,#dc2626);transition:width .08s}',
    '.vid-takes{display:flex;flex-direction:column;gap:10px}',
    '.vid-take{border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;background:var(--surface);min-width:0}',
    '.vid-take .n{font-weight:600;display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
    '.vid-take audio,.vid-result audio,.vid-ed audio{width:100%;margin:8px 0;display:block}',
    '.vid-take .btn-group .btn{flex:1 1 auto}',
    '.vid-empty{padding:18px;text-align:center;color:var(--text-3);font-size:.9rem;border:1px dashed var(--border-strong);border-radius:var(--radius-sm)}',
    '.vid-result .vid-stage,.vid-result .preview-box{margin-top:14px}',
    '.vid-result .notice{margin-top:14px}',
    '.vid-result .card-title h3{display:flex;align-items:center;gap:8px}',
    '.vid-result .preview-box img{max-width:100%;height:auto}'
  ].join('\n');

  function injectCSS() {
    if (doc.getElementById('vid-style')) return;
    var s = doc.createElement('style');
    s.id = 'vid-style';
    s.textContent = CSS;
    doc.head.appendChild(s);
  }

  // ============================================================ UI helpers
  var uid = 0;
  function nid(p) { uid++; return 'vid-' + (p || 'f') + uid; }
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
  /** Range slider with live read-out. */
  function range(label, min, max, step, value, fmt, onInput) {
    var el = input('range', value, { min: min, max: max, step: step });
    var out = h('span.vid-val', { 'aria-hidden': 'true' });
    var f = fmt || function (v) { return v; };
    function upd() { out.textContent = f(Number(el.value)); el.setAttribute('aria-valuetext', f(Number(el.value))); }
    el.addEventListener('input', function () { upd(); if (onInput) onInput(Number(el.value)); });
    upd();
    var wrap = h('div.field', null, [h('label', { 'for': el.id, text: label }), h('div.vid-range', null, [el, out])]);
    wrap.input = el;
    wrap.refresh = upd;
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
  /** Segmented control: items [[value, label]]. */
  function seg(items, value, onChange, label) {
    var el = h('div.seg.vid-seg', { role: 'group', 'aria-label': label || 'Options' });
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
  /** Grid of option cards (toggle buttons). items: [{v, t, s, disabled}] */
  function optCards(items, value, onChange, label) {
    var el = h('div.vid-opts', { role: 'group', 'aria-label': label || 'Options' });
    el.value = value;
    el.render = function (list) {
      el.innerHTML = '';
      list.forEach(function (it) {
        var b = h('button.vid-opt', { type: 'button', 'data-v': it.v, 'aria-pressed': String(it.v === el.value), disabled: !!it.disabled,
          html: '<b>' + esc(it.t) + '</b>' + (it.s ? '<small>' + esc(it.s) + '</small>' : '') });
        b.addEventListener('click', function () { el.set(it.v); if (onChange) onChange(it.v); });
        el.appendChild(b);
      });
    };
    el.set = function (v) {
      el.value = v;
      BT.$$('button', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); });
    };
    el.render(items);
    return el;
  }
  function btn(cls, iconName, text, onClick, attrs) {
    var b = h('button.btn' + (cls ? '.' + cls.split(' ').join('.') : ''), Object.assign({ type: 'button', html: (iconName ? BT.icon(iconName) : '') + '<span>' + esc(text) + '</span>' }, attrs || {}));
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
    return h('div.notice.vid-privacy', { html: BT.icon('shield-check') + '<span><strong>Processed on your device — nothing is uploaded.</strong> ' +
      esc(extra || 'The video engine (about 32 MB) downloads once from this site and is then cached by your browser.') + '</span>' });
  }
  function scrollTo(el) { try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* old browsers */ } }

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
  /** "1:23.4", "83.4", "1:02:03" → seconds (NaN when invalid). */
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
  function stamp() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes());
  }
  function pctSaved(a, b) { return a ? Math.round((1 - b / a) * 1000) / 10 : 0; }
  function even(x) { return Math.max(2, Math.round(x / 2) * 2); }

  var VIDEO_ACCEPT = 'video/*,.mp4,.mov,.m4v,.webm,.mkv,.avi,.3gp,.wmv,.flv,.ts,.mts,.mpg,.mpeg,.ogv';
  var AUDIO_ACCEPT = 'audio/*,.mp3,.wav,.m4a,.aac,.ogg,.oga,.opus,.flac,.wma,.amr,.weba';
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
        if (isFinite(el.duration) && el.duration > 0) return finish(info());
        // MediaRecorder files carry no duration until the element seeks to the end.
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
    var r = { duration: null, width: 0, height: 0, hasVideo: false, hasAudio: false, vcodec: '', acodec: '', viaEngine: true };
    var cut = txt.indexOf('Output #0');
    if (cut > -1) txt = txt.slice(0, cut);
    var d = txt.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (d) r.duration = +d[1] * 3600 + +d[2] * 60 + parseFloat(d[3]);
    txt.split('\n').forEach(function (l) {
      var v = l.match(/Stream #\d+:\d+.*?: Video: (\w+)/);
      if (v && !r.hasVideo && !/attached pic/.test(l)) {
        r.hasVideo = true;
        r.vcodec = v[1];
        var s = l.match(/[ ,](\d{2,5})x(\d{2,5})[ ,\]]/);
        if (s) { r.width = +s[1]; r.height = +s[2]; }
      }
      var a = l.match(/Stream #\d+:\d+.*?: Audio: (\w+)/);
      if (a && !r.hasAudio) { r.hasAudio = true; r.acodec = a[1]; }
    });
    var rot = txt.match(/rotation of (-?\d+(?:\.\d+)?) degrees/);
    if (rot && Math.abs(Math.round(+rot[1])) % 180 === 90) { var t = r.width; r.width = r.height; r.height = t; }
    return r;
  }

  /** <video>/<audio> with controls; fixes the missing duration of recorded WebM. */
  function mediaEl(tag, url, label) {
    var el = h(tag, { controls: true, preload: 'metadata', playsinline: true, 'aria-label': label || (tag === 'video' ? 'Video preview' : 'Audio preview') });
    el.addEventListener('loadedmetadata', function onMeta() {
      el.removeEventListener('loadedmetadata', onMeta);
      if (isFinite(el.duration)) return;
      var fix = function () {
        if (!isFinite(el.duration)) return;
        el.removeEventListener('durationchange', fix);
        el.currentTime = 0;
      };
      el.addEventListener('durationchange', fix);
      try { el.currentTime = 1e101; } catch (e) { /* ignore */ }
    });
    el.src = url;
    return el;
  }

  // ================================================================ Engine
  var CANCELLED = { cancelled: true, message: 'Cancelled' };
  function isCancel(e) { return !!(e && e.cancelled); }
  var ENC_KEY = 'bt-vid-encoders-v1';
  var encoders = null, encChecked = false, encWatchers = [];
  try { var savedEnc = localStorage.getItem(ENC_KEY); if (savedEnc) encoders = JSON.parse(savedEnc); } catch (e) { encoders = null; }
  /** Unknown encoder list (engine not loaded yet) counts as available. */
  function hasEnc(name) { return !encoders || encoders.indexOf(name) > -1; }
  function pickEnc(list) {
    for (var i = 0; i < list.length; i++) if (encoders && encoders.indexOf(list[i]) > -1) return list[i];
    return encoders ? null : list[0];
  }
  var engineLoaded = false, running = null, jobSeq = 0;

  function loadEngine(ui) {
    if (ui && !engineLoaded) ui.stage('Preparing the video engine…', 'Processed on your device — nothing is uploaded.', null);
    return BT.loadFFmpeg(function (f) {
      if (ui) ui.stage('Downloading video engine (32 MB, one time)…', 'Your browser keeps it, so next time starts instantly.', f);
    }).then(function (ff) {
      if (ui && !engineLoaded) ui.stage('Starting the video engine…', '', null);
      engineLoaded = true;
      if (encChecked) return ff;
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
        if (list.length) {
          encoders = list;
          encChecked = true;
          try { localStorage.setItem(ENC_KEY, JSON.stringify(list)); } catch (e) { /* private mode */ }
          encWatchers.slice().forEach(function (f) { try { f(); } catch (e) { console.error(e); } });
        }
        return ff;
      }, function () { ff.off('log', cb); return ff; });
    });
  }

  function ffError(logs, what) {
    var txt = logs.join('\n');
    if (/matches no streams|does not contain any stream|Output file .*does not contain/i.test(txt)) {
      return new Error(what === 'audio' ? 'This file has no audio track to convert.' : 'This file does not have the video or audio track this output needs.');
    }
    if (/Invalid data found|could not find codec parameters|moov atom not found|EBML header parsing failed|Error opening input/i.test(txt)) {
      return new Error('This file could not be read. It may be damaged, incomplete or in an unsupported format.');
    }
    if (/Cannot allocate memory|out of memory/i.test(txt)) {
      return new Error('Your browser ran out of memory. Try a shorter clip or a lower resolution.');
    }
    var bad = logs.filter(function (l) { return /error|invalid|failed|not supported|unknown|no such/i.test(l); }).slice(-1)[0];
    return new Error('Processing failed' + (bad ? ': ' + bad.trim().slice(0, 180) : '.'));
  }

  /**
   * Run one ffmpeg job. fn(J) gets helpers:
   *   J.input(blob, ext) → path   (mounted read-only, no copy, when WORKERFS works)
   *   J.out(ext) → unique output name
   *   J.exec(args, {dur, from, to, label, sub}) → exit code (progress mapped to from..to)
   *   J.run(args, opts) → like exec but throws a friendly error on failure
   *   J.read(name) → Uint8Array, J.probe(path) → stream info
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
    function tag(ext) { J.n++; return 'vj' + J.id + '_' + J.n + (ext ? '.' + ext : ''); }
    function guard(v) { if (J.cancelled) throw CANCELLED; return v; }
    var api = {
      logs: J.logs,
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
      out: function (ext) { var f = tag(ext); J.files.push(f); return f; },
      exec: function (args, o) {
        o = o || {};
        var dur = o.dur, a = o.from || 0, b = o.to == null ? 1 : o.to;
        if (ui && o.label) ui.stage(o.label, o.sub || '', dur ? a : null);
        J.onTime = function (t) { if (ui && dur > 0) ui.set(a + (b - a) * Math.min(1, Math.max(0, t / dur))); };
        J.logs.length = 0;
        return ff.exec(['-hide_banner'].concat(args)).then(function (code) {
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
        if (J.logs.length > 2000) J.logs.splice(0, 1000);
        var t = msg.match(/time=\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
        if (t && J.onTime) J.onTime(+t[1] * 3600 + +t[2] * 60 + parseFloat(t[3]));
      };
      ff.on('log', onLog);
      offs.push(function () { ff.off('log', onLog); });
      return fn(api);
    });
    return p.then(function (r) { return cleanup().then(function () { return r; }); }, function (e) {
      var c = J.cancelled && !(e && e.crash);
      return cleanup().then(function () { throw c ? CANCELLED : e; });
    });
  }

  // ============================================================= UI cards
  function progressCard() {
    var title = h('span.vid-ptitle', { text: 'Working…', 'aria-live': 'polite' });
    var pct = h('span.vid-pct');
    var bar = h('span');
    var prog = h('div.progress.vid-ind', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': 'Progress' }, [bar]);
    var sub = h('div.muted.small');
    var cancel = btn('btn-sm', 'x', 'Cancel');
    cancel.classList.add('hidden');
    var el = h('div.card.vid-prog', null, [h('div.vid-prow', null, [h('span.spinner'), title, pct]), prog, sub, h('div.vid-actions', null, [cancel])]);
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
        if (f == null) { prog.classList.add('vid-ind'); pct.textContent = ''; prog.removeAttribute('aria-valuenow'); bar.style.width = ''; return; }
        prog.classList.remove('vid-ind');
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

  /**
   * Result card. o: { S, blob, name, kind: 'video'|'audio'|'image', title,
   *   stats: [[label, value]], note: {kind, html}, extra: [buttons], onReset, resetLabel }
   */
  function resultCard(o) {
    var url = o.S.url(o.blob), prev = null;
    if (o.kind === 'video') prev = h('div.vid-stage', null, [mediaEl('video', url, 'Result preview')]);
    else if (o.kind === 'audio') prev = mediaEl('audio', url, 'Result preview');
    else if (o.kind === 'image') prev = h('div.preview-box', null, [h('img', { src: url, alt: 'Preview of ' + o.name })]);
    var ext = (extOf(o.name) || 'file').toUpperCase();
    var actions = h('div.vid-actions', null, [btn('btn-primary btn-lg', 'download', 'Download ' + ext, function () { BT.download(o.blob, o.name); })]
      .concat(o.extra || [])
      .concat(o.onReset ? [btn('btn-lg', 'rotate-ccw', o.resetLabel || 'Start over', o.onReset)] : []));
    return h('div.card.vid-result', null, [
      h('div.card-title', null, [h('h3', { html: BT.icon('check') + '<span>' + esc(o.title || 'Done') + '</span>' })]),
      o.stats ? h('div.stats', null, o.stats.map(function (s) { return stat(s[0], s[1]); })) : null,
      o.note ? notice(o.note.kind, o.note.html) : null,
      prev,
      actions
    ]);
  }

  function fileHead(file, meta, onReset) {
    var b = '<span class="badge">' + esc((extOf(file.name) || 'file').toUpperCase()) + '</span>';
    if (meta.duration) b += '<span class="badge">' + esc(fmtDur(meta.duration)) + '</span>';
    if (meta.width) b += '<span class="badge">' + meta.width + ' × ' + meta.height + '</span>';
    b += '<span class="badge">' + esc(BT.fmtBytes(file.size)) + '</span>';
    if (!meta.hasVideo) b += '<span class="badge">Audio only</span>';
    return h('div.vid-head', null, [
      h('span.vid-ic', { html: BT.icon(meta.hasVideo ? 'film' : 'volume-2') }),
      h('div.vid-txt', null, [h('div.vid-name', { text: file.name, title: file.name }), h('div.vid-meta', { html: b })]),
      btn('btn-ghost btn-sm', 'rotate-ccw', 'Start over', onReset)
    ]);
  }

  function errorBox(host, e) {
    if (isCancel(e)) { BT.toast('Cancelled'); return; }
    console.error(e);
    var n = notice('error', esc(e && e.message ? e.message : String(e)));
    n.setAttribute('role', 'alert');
    host.appendChild(n);
  }

  /** Dual-handle range over a thumbnail/waveform strip. */
  function dualRange(o) {
    var D = o.duration, step = o.step || 0.1;
    var strip = h('div.vid-strip', { 'aria-hidden': 'true' });
    var shL = h('div.vid-shade.l'), shR = h('div.vid-shade.r'), box = h('div.vid-selbox'), ph = h('div.vid-ph.hidden');
    var a = h('input', { type: 'range', min: '0', max: String(D), step: String(step), 'aria-label': 'Start time' });
    var b = h('input', { type: 'range', min: '0', max: String(D), step: String(step), 'aria-label': 'End time' });
    a.value = o.start; b.value = o.end;
    var wrap = h('div.vid-dr', null, [strip, shL, shR, box, ph, a, b]);
    var W = 'calc((100% - 16px) * ';
    function paint() {
      var s = +a.value / D, e = +b.value / D;
      shL.style.width = W + s + ')';
      shR.style.width = W + (1 - e) + ')';
      box.style.left = 'calc(8px + (100% - 16px) * ' + s + ')';
      box.style.width = W + (e - s) + ')';
      a.setAttribute('aria-valuetext', fmtTime(+a.value));
      b.setAttribute('aria-valuetext', fmtTime(+b.value));
      // Keep the start handle reachable when both handles sit near the end.
      a.style.zIndex = +a.value > D / 2 ? '3' : '2';
      b.style.zIndex = +a.value > D / 2 ? '2' : '3';
    }
    function clampVals(which, s, e) {
      var gap = o.minGap || step;
      if (which === 'a') {
        if (s > e - gap) s = Math.max(0, e - gap);
        if (o.maxSpan && e - s > o.maxSpan) e = s + o.maxSpan;
      } else {
        if (e < s + gap) e = Math.min(D, s + gap);
        if (e < s + gap) s = Math.max(0, e - gap);
        if (o.maxSpan && e - s > o.maxSpan) s = e - o.maxSpan;
      }
      a.value = s; b.value = e;
      paint();
      if (o.onChange) o.onChange(+a.value, +b.value, which);
    }
    a.addEventListener('input', function () { clampVals('a', +a.value, +b.value); });
    b.addEventListener('input', function () { clampVals('b', +a.value, +b.value); });
    paint();
    return {
      el: wrap,
      strip: strip,
      get: function () { return [+a.value, +b.value]; },
      set: function (s, e, which) { clampVals(which || 'b', Math.max(0, Math.min(D, s)), Math.max(0, Math.min(D, e))); },
      playhead: function (t) {
        ph.classList.remove('hidden');
        ph.style.left = 'calc(8px + (100% - 16px) * ' + Math.max(0, Math.min(1, t / D)) + ')';
      }
    };
  }

  /** Fill a strip with n video frames, captured by seeking a hidden <video>. */
  function fillThumbs(url, D, strip, S, n) {
    n = n || 10;
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

  /** Draw an audio waveform into the strip (best effort). */
  function fillWave(blob, strip, S) {
    if (blob.size > 150 * 1024 * 1024) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    var c = h('canvas.vid-wavec');
    strip.appendChild(c);
    blob.arrayBuffer().then(function (buf) {
      var ac = new AC();
      return new Promise(function (res, rej) {
        var pr = ac.decodeAudioData(buf, res, rej);
        if (pr && pr.catch) pr.catch(rej);
      }).then(function (ab) {
        ac.close().catch(noop);
        if (S.dead) return;
        var W = 600, H = 96;
        c.width = W; c.height = H;
        c.style.width = '100%';
        var x = c.getContext('2d'), d = ab.getChannelData(0), per = Math.max(1, Math.floor(d.length / W));
        x.fillStyle = getComputedStyle(doc.documentElement).getPropertyValue('--brand').trim() || '#4f46e5';
        for (var i = 0; i < W; i++) {
          var mx = 0;
          for (var j = i * per, e = Math.min(d.length, j + per); j < e; j += 4) { var v = Math.abs(d[j]); if (v > mx) mx = v; }
          var hh = Math.max(1, mx * H * 0.9);
          x.fillRect(i, (H - hh) / 2, 1, hh);
        }
      }, function () { ac.close().catch(noop); });
    }).catch(noop);
  }

  /** Start / end / length fields bound to a dual range. */
  function timeFields(dr, D) {
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
    var el = h('div.vid-times', null, [field('Start', s), field('End', e), field('Length', len)]);
    var cur = dr.get();
    sync(cur[0], cur[1]);
    return { el: el, sync: sync };
  }

  // ===================================================== Scope / scaffold
  function newScope() {
    var S = { urls: [], fns: [], dead: false, job: null };
    S.url = function (b) { var u = URL.createObjectURL(b); S.urls.push(u); return u; };
    S.on = function (fn) { S.fns.push(fn); };
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
  function watchEncoders(S, fn) {
    encWatchers.push(fn);
    S.on(function () { var i = encWatchers.indexOf(fn); if (i > -1) encWatchers.splice(i, 1); });
  }

  /**
   * File tool scaffold: dropzone → read metadata (media element, or the
   * engine for formats the browser cannot play) → build(host, file, meta, S, reset).
   */
  function fileTool(root, o, build) {
    injectCSS();
    var S = null;
    function reset() {
      if (S) S.dispose();
      S = newScope();
      root.innerHTML = '';
      root.appendChild(BT.dropzone({ accept: o.accept || VIDEO_ACCEPT, title: o.title, hint: o.hint, icon: o.icon || 'upload', color: '#e5484d',
        onFiles: function (f) { open(f[0]); } }));
      root.appendChild(privacyNote());
    }
    function open(file) {
      if (S) S.dispose();
      S = newScope();
      var myS = S;
      root.innerHTML = '';
      root.appendChild(h('div.vid-loading', { html: '<span class="spinner"></span> Reading ' + esc(file.name) + '…' }));
      probeElement(file, 'video').then(function (meta) {
        if (myS.dead) return null;
        var unsure = !meta || !meta.duration || (o.needVideo !== false && !meta.hasVideo && looksVideo(file));
        if (!unsure) return meta;
        // The browser can't play this format: ask ffmpeg instead.
        root.innerHTML = '';
        var ui = progressCard();
        root.appendChild(ui.el);
        return job(myS, ui, function (J) {
          return J.input(file, extOf(file.name) || 'bin').then(J.probe);
        }).then(function (m) { ui.remove(); return m; });
      }).then(function (meta) {
        if (!meta || myS.dead) return;
        root.innerHTML = '';
        root.appendChild(fileHead(file, meta, reset));
        if (!meta.duration || (!meta.hasVideo && !meta.hasAudio && meta.viaEngine)) {
          root.appendChild(notice('error', 'This file could not be read. It may be damaged or not a video/audio file.'));
          return;
        }
        if (o.needVideo && !meta.hasVideo) {
          root.appendChild(notice('error', 'This file has no video track. ' + (o.audioHint || 'Please choose a video file.')));
          return;
        }
        if (file.size > 500 * 1024 * 1024) {
          root.appendChild(notice('warn', 'This is a large file (' + esc(BT.fmtBytes(file.size)) + '). Your browser processes it in memory, which can fail on phones or older computers. If it does, try a shorter clip first.'));
        }
        var host = h('div');
        root.appendChild(host);
        build(host, file, meta, myS, reset);
      }).catch(function (e) {
        if (myS.dead) return;
        root.innerHTML = '';
        if (!isCancel(e)) errorBox(root, e);
        root.appendChild(h('div.vid-actions', null, [btn('btn-primary', 'rotate-ccw', 'Choose another file', reset)]));
      });
    }
    reset();
    return { reset: reset };
  }

  /** Preview stage for an input file. */
  function previewStage(file, meta, S) {
    var stage = h('div.vid-stage');
    var vid = null;
    if (meta.viaEngine) {
      stage.appendChild(h('div.vid-nopreview', { text: 'Your browser can’t preview this format, but it can still be processed here.' }));
    } else {
      vid = mediaEl('video', S.url(file), 'Video preview');
      stage.appendChild(vid);
      S.on(function () { try { vid.pause(); } catch (e) { /* ignore */ } });
    }
    return { el: stage, video: vid };
  }

  function editorLayout(host, title) {
    var left = h('div');
    var panel = h('div.card.vid-panel', null, [h('h3', { text: title || 'Settings' })]);
    var actions = h('div.vid-actions');
    panel.appendChild(actions);
    var out = h('div.vid-out');
    host.appendChild(h('div.split.wide-left', null, [left, h('div', null, [panel])]));
    host.appendChild(out);
    return { left: left, panel: panel, actions: actions, out: out, add: function (el) { panel.insertBefore(el, actions); return el; } };
  }

  /** Trim selection UI: dual range + thumbnails + time fields + play controls. */
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
    if (o.wave) fillWave(file, dr.strip, S);
    else if (vid) fillThumbs(S.url(file), D, dr.strip, S, 10);
    tf = timeFields(dr, D);
    var playingSel = false;
    var now = h('span.vid-now', { 'aria-hidden': 'true', text: fmtTime(0) });
    var playBtn = btn('btn-sm', 'monitor-play', 'Play selection', function () {
      if (!vid) return;
      if (playingSel) { vid.pause(); return; }
      playingSel = true;
      setBtnText(playBtn, 'square', 'Stop');
      vid.currentTime = st.s;
      var p = vid.play();
      if (p && p.catch) p.catch(function () { playingSel = false; setBtnText(playBtn, 'monitor-play', 'Play selection'); });
    });
    var bar = h('div.vid-tbar', null, vid ? [
      btn('btn-sm', 'arrow-right', 'Set start here', function () { dr.set(vid.currentTime, st.e, 'a'); }),
      btn('btn-sm', 'arrow-left', 'Set end here', function () { dr.set(st.s, vid.currentTime, 'b'); }),
      playBtn, now
    ] : []);
    if (vid) {
      vid.addEventListener('timeupdate', function () {
        dr.playhead(vid.currentTime);
        now.textContent = fmtTime(vid.currentTime);
        if (playingSel && vid.currentTime >= st.e) vid.pause();
      });
      vid.addEventListener('pause', function () {
        if (playingSel) { playingSel = false; setBtnText(playBtn, 'monitor-play', 'Play selection'); }
      });
    }
    var wrap = h('div', { style: { marginTop: '14px' } }, [h('div.label', { text: o.label || 'Select the part to keep' }), dr.el, tf.el, bar]);
    L.appendChild(wrap);
    return { get: function () { return [st.s, st.e]; }, set: function (a, b) { dr.set(a, b); } };
  }

  // ======================================================= Recording bits
  function pickMime(list) {
    if (!window.MediaRecorder) return null;
    if (!MediaRecorder.isTypeSupported) return '';
    for (var i = 0; i < list.length; i++) if (MediaRecorder.isTypeSupported(list[i])) return list[i];
    return '';
  }
  var VIDEO_MIMES = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4'];
  var AUDIO_MIMES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg'];
  function stopStream(s) { if (s) s.getTracks().forEach(function (t) { try { t.stop(); } catch (e) { /* ignore */ } }); }

  /** Ticks every ~33 ms even in a background tab (a worker timer is not throttled like rAF). */
  function ticker(fn) {
    var raf = 0, w = null, url = null, alive = true;
    function loop() { if (!alive) return; if (!doc.hidden) fn(); raf = requestAnimationFrame(loop); }
    try {
      url = URL.createObjectURL(new Blob(['setInterval(function(){postMessage(0)},33)'], { type: 'text/javascript' }));
      w = new Worker(url);
      w.onmessage = function () { if (alive && doc.hidden) fn(); };
    } catch (e) { w = null; }
    raf = requestAnimationFrame(loop);
    return function stop() {
      alive = false;
      cancelAnimationFrame(raf);
      if (w) w.terminate();
      if (url) URL.revokeObjectURL(url);
    };
  }

  function friendlyMediaError(e, what) {
    var n = e && e.name;
    if (n === 'NotAllowedError' || n === 'SecurityError') return what + ' permission was denied. Allow it in your browser’s site settings and try again.';
    if (n === 'NotFoundError' || n === 'OverconstrainedError') return 'No ' + what.toLowerCase() + ' was found on this device.';
    if (n === 'NotReadableError') return 'The ' + what.toLowerCase() + ' is busy in another app. Close it there and try again.';
    return (e && e.message) || String(e);
  }

  // =========================================================== 1. Screen
  register('screen-recorder', function (root) {
    injectCSS();
    var md = navigator.mediaDevices;
    var supported = !!(md && md.getDisplayMedia) && !!window.MediaRecorder;
    var S = null;
    var opt = { sys: true, mic: false, cam: false, pos: 'br', size: 'm', circle: true, countdown: true };

    function setup() {
      if (S) S.dispose();
      S = newScope();
      root.innerHTML = '';
      if (!supported) {
        root.appendChild(h('div.card', null, [
          h('h3', { text: 'Screen recording isn’t available here' }),
          notice('warn', esc('This browser does not let websites record the screen. Phones and tablets (Android, iPhone, iPad) don’t support it. ' +
            'Please open this page in Chrome, Edge, Firefox or Safari on a computer.')),
          h('p.muted.small', { html: 'To record sound only, try the <a href="' + esc(BT.toolUrl('audio-recorder')) + '">Audio Recorder</a>.' })
        ]));
        root.appendChild(privacyNote('Recordings are created in your browser and never leave your device.'));
        return;
      }
      var camOpts = h('div.vid-camopts' + (opt.cam ? '' : '.hidden'), null, [
        h('div.field', null, [h('span.label', { text: 'Bubble position' }), seg([['tl', 'Top left'], ['tr', 'Top right'], ['bl', 'Bottom left'], ['br', 'Bottom right']], opt.pos, function (v) { opt.pos = v; }, 'Webcam position')]),
        h('div.field', null, [h('span.label', { text: 'Bubble size' }), seg([['s', 'Small'], ['m', 'Medium'], ['l', 'Large']], opt.size, function (v) { opt.size = v; }, 'Webcam size')]),
        checkbox('Round (circle) bubble', opt.circle, function (v) { opt.circle = v; })
      ]);
      var sysCb = checkbox('Record system / tab sound', opt.sys, function (v) { opt.sys = v; });
      var checks = h('div.vid-checks', null, [
        sysCb,
        h('span.hint', { text: 'In Chrome and Edge, tick “Share audio” in the share window. Tab sound works everywhere; full-system sound only on Windows and ChromeOS.' }),
        checkbox('Record my microphone (voice-over)', opt.mic, function (v) { opt.mic = v; }),
        checkbox('Show my webcam (picture-in-picture bubble)', opt.cam, function (v) { opt.cam = v; camOpts.classList.toggle('hidden', !v); }),
        camOpts,
        checkbox('3-2-1 countdown before recording', opt.countdown, function (v) { opt.countdown = v; })
      ]);
      var startBtn = btn('btn-primary btn-lg', 'monitor-play', 'Start recording', function () { start(startBtn); });
      var mime = pickMime(VIDEO_MIMES);
      root.appendChild(h('div.split', null, [
        h('div.card.vid-panel', null, [h('h3', { text: 'Recording options' }), checks, h('div.vid-actions', null, [startBtn])]),
        h('div.card', null, [
          h('h3', { text: 'How it works' }),
          h('ol.small', { html: '<li>Choose your options and press <strong>Start recording</strong>.</li>' +
            '<li>Pick a screen, window or browser tab to share.</li>' +
            '<li>Record — pause whenever you like.</li>' +
            '<li>Press <strong>Stop</strong> here, or the browser’s <strong>Stop sharing</strong> button.</li>' +
            '<li>Preview and download as ' + (/mp4/.test(mime) ? 'MP4' : 'WebM, or convert to MP4') + '. No watermark, no time limit.</li>' }),
          privacyNote('Recordings are made in your browser and never leave your device. MP4 conversion downloads a 32 MB video engine once.')
        ])
      ]));
    }

    function start(startBtn) {
      var R = { streams: [], stops: [], chunks: [], acc: 0, t0: 0, paused: false };
      var myS = S;
      function release() {
        R.stops.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } });
        R.stops = [];
        R.streams.forEach(stopStream);
        R.streams = [];
        if (R.ac) { R.ac.close().catch(noop); R.ac = null; }
      }
      myS.on(function () {
        if (R.rec && R.rec.state !== 'inactive') { R.discard = true; try { R.rec.stop(); } catch (e) { /* ignore */ } }
        release();
      });
      startBtn.disabled = true;
      var dmOpts = { video: { frameRate: { ideal: 30 } }, audio: opt.sys };
      if (opt.sys) dmOpts.systemAudio = 'include';
      md.getDisplayMedia(dmOpts).then(function (screen) {
        R.screen = screen;
        R.streams.push(screen);
        var extras = [];
        extras.push(opt.mic ? md.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).catch(function (e) {
          BT.toast(friendlyMediaError(e, 'Microphone') + ' Recording without it.', 'error'); return null;
        }) : null);
        extras.push(opt.cam ? md.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: false }).catch(function (e) {
          BT.toast(friendlyMediaError(e, 'Camera') + ' Recording without it.', 'error'); return null;
        }) : null);
        return Promise.all(extras);
      }).then(function (ex) {
        if (myS.dead) return release();
        R.mic = ex[0]; R.cam = ex[1];
        if (R.mic) R.streams.push(R.mic);
        if (R.cam) R.streams.push(R.cam);
        return buildStream(R).then(function (stream) {
          if (myS.dead) return release();
          R.stream = stream;
          recordingUI(R, release);
        });
      }).catch(function (e) {
        release();
        startBtn.disabled = false;
        if (e && e.name === 'NotAllowedError') { BT.toast('Screen sharing was cancelled', 'error'); return; }
        BT.toast(friendlyMediaError(e, 'Screen capture'), 'error');
      });
    }

    /** Combine screen, optional webcam bubble and mixed audio into one stream. */
    function buildStream(R) {
      var vTrack = R.screen.getVideoTracks()[0];
      var p = Promise.resolve(vTrack);
      if (R.cam) {
        p = new Promise(function (res) {
          var sv = h('video', { muted: true, playsinline: true });
          var cv = h('video', { muted: true, playsinline: true });
          sv.muted = cv.muted = true;
          sv.srcObject = R.screen; cv.srcObject = R.cam;
          var ready = 0;
          function go() {
            if (++ready < 2) return;
            var canvas = h('canvas'), x = canvas.getContext('2d');
            function size() {
              var w = sv.videoWidth || 1280, hh = sv.videoHeight || 720, k = Math.min(1, 2560 / Math.max(w, hh));
              w = even(w * k); hh = even(hh * k);
              if (canvas.width !== w || canvas.height !== hh) { canvas.width = w; canvas.height = hh; }
            }
            size();
            function draw() {
              size();
              var W = canvas.width, H = canvas.height;
              x.drawImage(sv, 0, 0, W, H);
              var f = { s: 0.2, m: 0.28, l: 0.38 }[opt.size] || 0.28;
              var bh = Math.round(Math.min(W, H) * f), bw = opt.circle ? bh : Math.round(bh * 4 / 3);
              var m = Math.round(Math.min(W, H) * 0.03);
              var bx = opt.pos[1] === 'l' ? m : W - bw - m, by = opt.pos[0] === 't' ? m : H - bh - m;
              var cw = cv.videoWidth || 4, ch = cv.videoHeight || 3;
              var sc = Math.max(bw / cw, bh / ch), sw = bw / sc, sh = bh / sc;
              x.save();
              x.beginPath();
              if (opt.circle) x.arc(bx + bw / 2, by + bh / 2, bh / 2, 0, Math.PI * 2);
              else roundRect(x, bx, by, bw, bh, Math.round(bh * 0.08));
              x.closePath();
              x.clip();
              // Mirror the webcam like a selfie view.
              x.translate(bx + bw, by);
              x.scale(-1, 1);
              x.drawImage(cv, (cw - sw) / 2, (ch - sh) / 2, sw, sh, 0, 0, bw, bh);
              x.restore();
              x.lineWidth = Math.max(2, Math.round(bh * 0.02));
              x.strokeStyle = 'rgba(255,255,255,.9)';
              x.beginPath();
              if (opt.circle) x.arc(bx + bw / 2, by + bh / 2, bh / 2, 0, Math.PI * 2);
              else roundRect(x, bx, by, bw, bh, Math.round(bh * 0.08));
              x.stroke();
            }
            draw();
            R.stops.push(ticker(draw));
            R.stops.push(function () { sv.srcObject = null; cv.srcObject = null; });
            var cs = canvas.captureStream(30);
            R.streams.push(cs);
            res(cs.getVideoTracks()[0]);
          }
          [sv, cv].forEach(function (v) {
            v.onloadedmetadata = function () { v.onloadedmetadata = null; v.play().catch(noop); go(); };
          });
          // Don't hang if a camera never delivers frames.
          setTimeout(function () { if (ready < 2) { ready = 1; sv.onloadedmetadata = cv.onloadedmetadata = null; sv.play().catch(noop); cv.play().catch(noop); go(); } }, 5000);
        });
      }
      return p.then(function (videoTrack) {
        var sysA = R.screen.getAudioTracks();
        var tracks = [videoTrack];
        if (R.mic) {
          var AC = window.AudioContext || window.webkitAudioContext;
          var ac = R.ac = new AC();
          var dest = ac.createMediaStreamDestination();
          if (sysA.length) ac.createMediaStreamSource(new MediaStream(sysA)).connect(dest);
          ac.createMediaStreamSource(R.mic).connect(dest);
          if (ac.resume) ac.resume().catch(noop);
          tracks.push(dest.stream.getAudioTracks()[0]);
        } else if (sysA.length) tracks.push(sysA[0]);
        R.hasAudio = tracks.length > 1;
        return new MediaStream(tracks);
      });
    }

    function roundRect(x, X, Y, W, H, r) {
      x.moveTo(X + r, Y);
      x.arcTo(X + W, Y, X + W, Y + H, r);
      x.arcTo(X + W, Y + H, X, Y + H, r);
      x.arcTo(X, Y + H, X, Y, r);
      x.arcTo(X, Y, X + W, Y, r);
    }

    function recordingUI(R, release) {
      root.innerHTML = '';
      var live = h('video', { muted: true, playsinline: true, autoplay: true, 'aria-label': 'Live preview of the recording' });
      live.muted = true;
      live.srcObject = new MediaStream(R.stream.getVideoTracks());
      live.play().catch(noop);
      var liveBox = h('div.vid-live', null, [live]);
      var dot = h('span.vid-dot.idle'), timer = h('span.vid-timer', { text: '0:00', role: 'timer', 'aria-label': 'Recording time' });
      var status = h('span.small.muted', { text: 'Get ready…', 'aria-live': 'polite' });
      var pauseBtn = btn('', 'clock', 'Pause', togglePause, { disabled: true });
      var stopBtn = btn('btn-danger', 'square', 'Stop', stop);
      root.appendChild(h('div.card', null, [
        liveBox,
        h('div.vid-recbar', null, [dot, timer, status, h('div.btn-group', null, [pauseBtn, stopBtn])]),
        h('p.small.muted', { style: { margin: '12px 0 0' }, text: 'Switch to what you want to record. Come back to this tab to pause or stop, or use the browser’s “Stop sharing” button.' })
      ]));
      var tick = setInterval(updTimer, 250);
      R.stops.push(function () { clearInterval(tick); live.srcObject = null; });
      function elapsed() { return R.acc + (R.t0 && !R.paused ? (performance.now() - R.t0) / 1000 : 0); }
      function updTimer() { timer.textContent = fmtTime(elapsed(), 0); }
      var vt = R.screen.getVideoTracks()[0];
      vt.addEventListener('ended', function () { stop(); });
      var unload = function (e) { if (R.rec && R.rec.state !== 'inactive') { e.preventDefault(); e.returnValue = ''; } };
      window.addEventListener('beforeunload', unload);
      R.stops.push(function () { window.removeEventListener('beforeunload', unload); });

      function begin() {
        if (R.stopped) return;
        var mime = pickMime(VIDEO_MIMES);
        var rec;
        try {
          rec = mime ? new MediaRecorder(R.stream, { mimeType: mime, videoBitsPerSecond: 5e6 }) : new MediaRecorder(R.stream);
        } catch (e) {
          rec = new MediaRecorder(R.stream);
        }
        R.rec = rec;
        rec.ondataavailable = function (e) { if (e.data && e.data.size) R.chunks.push(e.data); };
        rec.onstop = function () {
          var type = (rec.mimeType || mime || 'video/webm').split(';')[0];
          var blob = new Blob(R.chunks, { type: type });
          var secs = elapsed();
          release();
          if (R.discard) return;
          showResult(blob, secs, R.hasAudio);
        };
        rec.start(1000);
        R.t0 = performance.now();
        dot.className = 'vid-dot';
        status.textContent = 'Recording';
        pauseBtn.disabled = false;
      }
      if (opt.countdown) {
        var n = 3, cd = h('div.vid-count', { text: '3', 'aria-live': 'assertive' });
        liveBox.appendChild(cd);
        var iv = setInterval(function () {
          n--;
          if (n <= 0) { clearInterval(iv); cd.remove(); begin(); } else cd.textContent = String(n);
        }, 1000);
        R.stops.push(function () { clearInterval(iv); });
      } else begin();

      function togglePause() {
        var rec = R.rec;
        if (!rec) return;
        if (rec.state === 'recording') {
          rec.pause();
          R.acc += (performance.now() - R.t0) / 1000;
          R.paused = true;
          dot.className = 'vid-dot paused';
          status.textContent = 'Paused';
          setBtnText(pauseBtn, 'monitor-play', 'Resume');
        } else if (rec.state === 'paused') {
          rec.resume();
          R.t0 = performance.now();
          R.paused = false;
          dot.className = 'vid-dot';
          status.textContent = 'Recording';
          setBtnText(pauseBtn, 'clock', 'Pause');
        }
      }
      function stop() {
        if (R.stopped) return;
        R.stopped = true;
        stopBtn.disabled = pauseBtn.disabled = true;
        status.textContent = 'Finishing…';
        if (R.rec && R.rec.state !== 'inactive') {
          if (R.rec.state === 'recording') { R.acc += (performance.now() - R.t0) / 1000; }
          R.paused = true;
          R.rec.stop();
        } else { release(); setup(); }
      }
    }

    function showResult(blob, secs, hasAudio) {
      root.innerHTML = '';
      var isMp4 = /mp4/.test(blob.type);
      var name = 'screen-recording-' + stamp() + (isMp4 ? '.mp4' : '.webm');
      var out = h('div.vid-out');
      var extra = [];
      if (!isMp4) {
        var conv = btn('btn-lg', 'refresh-cw', 'Convert to MP4', function () {
          conv.disabled = true;
          var ui = progressCard();
          out.innerHTML = '';
          out.appendChild(ui.el);
          scrollTo(ui.el);
          job(S, ui, function (J) {
            return J.input(blob, 'webm').then(function (inp) {
              var o = J.out('mp4');
              var args = ['-i', inp, '-map', '0:v:0', '-map', '0:a:0?', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
                '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-pix_fmt', 'yuv420p'];
              args = args.concat(hasAudio ? ['-c:a', 'aac', '-b:a', '128k'] : ['-an']);
              args.push('-movflags', '+faststart', o);
              return J.run(args, { dur: secs, label: 'Converting to MP4…', sub: 'This takes roughly as long as the recording. Keep this tab open.' }).then(function () { return J.read(o); });
            });
          }).then(function (data) {
            ui.remove();
            var mp4 = new Blob([data], { type: 'video/mp4' });
            out.appendChild(resultCard({ S: S, blob: mp4, name: name.replace(/\.webm$/, '.mp4'), kind: null, title: 'MP4 ready',
              stats: [['MP4 size', BT.fmtBytes(mp4.size)], ['WebM size', BT.fmtBytes(blob.size)]] }));
          }).catch(function (e) { ui.remove(); conv.disabled = false; errorBox(out, e); });
        });
        extra.push(conv);
      }
      root.appendChild(resultCard({ S: S, blob: blob, name: name, kind: 'video', title: 'Recording ready',
        stats: [['Length', fmtDur(secs)], ['Size', BT.fmtBytes(blob.size)], ['Format', isMp4 ? 'MP4' : 'WebM']],
        extra: extra, onReset: setup, resetLabel: 'Record again' }));
      root.appendChild(out);
      root.appendChild(privacyNote('Your recording stays on this device.'));
    }

    setup();
  });

  // ========================================================= 2. Compress
  var COMP_PRESETS = {
    whatsapp: { t: 'WhatsApp', s: '≤ 16 MB', target: 16, res: '720' },
    email: { t: 'Email', s: '≤ 25 MB', target: 25, res: '720' },
    small: { t: 'Small', s: 'Smallest file', crf: 32, res: '480', ab: 96 },
    balanced: { t: 'Balanced', s: 'Good quality, much smaller', crf: 27, ab: 128 },
    high: { t: 'High quality', s: 'Close to the original', crf: 22, ab: 128 },
    target: { t: 'Target size', s: 'Choose the size in MB', target: null }
  };

  /** Output size for a resolution choice ('orig' or the short side), even dims, never upscaled. */
  function outDims(meta, res) {
    if (!meta.width || !meta.height) return null;
    var w = meta.width, hh = meta.height, short = Math.min(w, hh), lim = +res;
    if (res === 'orig' || !lim || short <= lim) return { w: even(w), h: even(hh) };
    var k = lim / short;
    return { w: even(w * k), h: even(hh * k) };
  }
  function scaleFilter(meta, res) {
    var d = outDims(meta, res);
    if (d) return 'scale=' + d.w + ':' + d.h;
    if (res === 'orig') return 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
    return "scale='if(gte(iw,ih),-2,min(" + res + ",iw))':'if(gte(iw,ih),min(" + res + ",ih),-2)'";
  }
  function resOptions(meta) {
    var short = meta.width ? Math.min(meta.width, meta.height) : 0;
    return [['orig', 'Original' + (meta.width ? ' (' + meta.width + '×' + meta.height + ')' : '')]].concat([1080, 720, 480].map(function (r) {
      return [String(r), r + 'p' + (short && short <= r ? ' (same as original)' : '')];
    }));
  }

  register('video-compressor', function (root) {
    fileTool(root, { title: 'Choose a video to compress', hint: 'MP4, MOV, WebM, MKV or AVI — or drag and drop it here', needVideo: true },
      function (host, file, meta, S, reset) {
        var L = editorLayout(host, 'Compression');
        var pv = previewStage(file, meta, S);
        L.left.appendChild(pv.el);
        var D = meta.duration;
        var st = { preset: file.size > 16 * 1048576 ? 'whatsapp' : 'balanced', target: Math.max(1, Math.round(file.size / 1048576 / 2)), res: 'orig', speed: 'veryfast', mute: false };
        st.res = COMP_PRESETS[st.preset].res || 'orig';
        var items = Object.keys(COMP_PRESETS).map(function (k) { return { v: k, t: COMP_PRESETS[k].t, s: COMP_PRESETS[k].s }; });
        var cards = optCards(items, st.preset, function (v) {
          st.preset = v;
          if (COMP_PRESETS[v].res) { st.res = COMP_PRESETS[v].res; resSel.value = st.res; }
          else if (v === 'balanced' || v === 'high') { st.res = 'orig'; resSel.value = 'orig'; }
          upd();
        }, 'Compression preset');
        L.add(h('div.field', null, [h('span.label', { text: 'Preset' }), cards]));
        var tIn = input('number', st.target, { min: '1', max: '4000', step: '1', inputmode: 'decimal' });
        var tField = L.add(field('Target size (MB)', tIn));
        tIn.addEventListener('input', function () { var v = parseFloat(tIn.value); if (v > 0) st.target = v; upd(); });
        var resSel = select(resOptions(meta), st.res);
        resSel.addEventListener('change', function () { st.res = resSel.value; upd(); });
        L.add(field('Resolution', resSel, 'Keeps the aspect ratio. Lower resolution = smaller file.'));
        L.add(h('div.field', null, [h('span.label', { text: 'Speed' }), seg([['veryfast', 'Smaller file'], ['ultrafast', 'Fastest']], st.speed, function (v) { st.speed = v; }, 'Encoding speed')]));
        L.add(h('div.field', null, [checkbox('Remove audio', false, function (v) { st.mute = v; upd(); })]));
        var info = L.add(h('div.notice', { 'aria-live': 'polite' }));
        var goBtn = btn('btn-primary btn-lg', 'minimize-2', 'Compress video', run);
        L.actions.appendChild(goBtn);

        function plan() {
          var p = COMP_PRESETS[st.preset];
          var r = { crf: null, vk: null, ab: st.mute ? 0 : (p.ab || 128), dims: outDims(meta, st.res) };
          if (p.target !== undefined) {
            var T = st.preset === 'target' ? st.target : p.target;
            var bps = T * 8 * 1024 * 1024 * 0.95 / D;
            if (!st.mute) r.ab = bps < 500e3 ? 64 : 96;
            var v = bps - r.ab * 1000;
            var srcV = file.size * 8 / D - r.ab * 1000;
            r.capped = srcV > 0 && v > srcV * 0.85;
            if (r.capped) v = srcV * 0.85;
            r.vk = Math.max(48, Math.floor(v / 1000));
            r.low = v < 150e3;
            r.target = T;
            r.under = file.size <= T * 1048576;
          } else r.crf = p.crf;
          return r;
        }
        function upd() {
          tField.classList.toggle('hidden', st.preset !== 'target');
          var P = plan(), msg = '';
          if (P.vk) {
            msg = 'Aiming for under ' + P.target + ' MB: video about ' + P.vk + ' kbps' + (P.ab ? ' + ' + P.ab + ' kbps audio' : '') + '.';
            if (P.under) msg += ' Your video is already under ' + P.target + ' MB, so it will just be made a little smaller.';
            if (P.low) msg += ' That is a very low bitrate for ' + fmtDur(D) + ' of video, so expect a blurry picture — choose 480p for a cleaner result.';
          } else {
            msg = { small: 'Strong compression and 480p: ideal for sharing on slow connections.', balanced: 'Visually close to the original, usually 40–80% smaller.', high: 'Keeps fine detail; saves less space.' }[st.preset] || '';
          }
          if (P.dims) msg += ' Output: ' + P.dims.w + '×' + P.dims.h + ' MP4 (H.264).';
          info.className = 'notice' + (P.low ? ' warn' : '');
          info.innerHTML = BT.icon('info') + '<span>' + esc(msg) + '</span>';
        }
        upd();

        function run() {
          var P = plan();
          goBtn.disabled = true;
          L.out.innerHTML = '';
          var ui = progressCard();
          L.out.appendChild(ui.el);
          scrollTo(ui.el);
          job(S, ui, function (J) {
            return J.input(file, extOf(file.name) || 'mp4').then(function (inp) {
              var o = J.out('mp4');
              var args = ['-i', inp, '-map', '0:v:0', '-map', '0:a:0?', '-vf', scaleFilter(meta, st.res), '-c:v', 'libx264', '-preset', st.speed];
              if (P.crf != null) args.push('-crf', String(P.crf));
              else args.push('-b:v', P.vk + 'k', '-maxrate', P.vk + 'k', '-bufsize', (P.vk * 2) + 'k');
              args.push('-pix_fmt', 'yuv420p');
              args = args.concat(st.mute ? ['-an'] : ['-c:a', 'aac', '-b:a', P.ab + 'k']);
              args.push('-movflags', '+faststart', o);
              return J.run(args, { dur: D, label: 'Compressing video…', sub: 'Keep this tab open. Long videos can take several minutes.' }).then(function () { return J.read(o); });
            });
          }).then(function (data) {
            ui.remove();
            goBtn.disabled = false;
            var blob = new Blob([data], { type: 'video/mp4' });
            var saved = pctSaved(file.size, blob.size), note = null;
            if (blob.size >= file.size) note = { kind: 'warn', html: 'This video was already well compressed — the result is not smaller. Try a lower resolution or the Small preset, or keep your original.' };
            else if (P.target && blob.size > P.target * 1048576) note = { kind: 'warn', html: 'The result is slightly above ' + esc(P.target) + ' MB. Try again with a lower target or 480p.' };
            else if (P.target) note = { kind: 'ok', html: 'Under ' + esc(P.target) + ' MB — ready to send.' };
            L.out.appendChild(resultCard({ S: S, blob: blob, name: BT.baseName(file.name) + '-compressed.mp4', kind: 'video', title: 'Video compressed',
              stats: [['Before', BT.fmtBytes(file.size)], ['After', BT.fmtBytes(blob.size)], ['Saved', saved > 0 ? saved + '%' : '0%']],
              note: note, onReset: reset, resetLabel: 'Compress another' }));
            scrollTo(L.out.lastChild);
          }).catch(function (e) { ui.remove(); goBtn.disabled = false; errorBox(L.out, e); });
        }
      });
  });

  // ============================================================ 3. Trim
  register('video-trimmer', function (root) {
    fileTool(root, { title: 'Choose a video to trim', hint: 'MP4, MOV, WebM, MKV or AVI — or drag and drop it here', needVideo: true },
      function (host, file, meta, S, reset) {
        var L = editorLayout(host, 'Trim settings');
        var pv = previewStage(file, meta, S);
        L.left.appendChild(pv.el);
        var D = meta.duration;
        var T = trimmer(L.left, file, meta, S, pv.video, { start: 0, end: D });
        var st = { mode: 'fast', mute: false };
        var ext = extOf(file.name);
        var modeHint = h('span.hint');
        function setHint() {
          modeHint.textContent = st.mode === 'fast' ? 'No re-encode: instant and lossless. Cuts land on the nearest keyframe, so the start can be up to a few seconds early.'
            : 'Re-encodes for a frame-accurate cut, which takes longer.';
          fmtInfo.textContent = 'Output: ' + outFmt().ext.toUpperCase();
        }
        function outFmt() {
          if (st.mode === 'fast') return { ext: /^(mp4|mov|webm|mkv|avi|3gp)$/.test(ext) ? ext : ext === 'm4v' ? 'mp4' : 'mkv' };
          if (ext === 'webm' && pickEnc(['libvpx', 'libvpx-vp9']) && pickEnc(['libopus', 'libvorbis'])) return { ext: 'webm' };
          return { ext: 'mp4' };
        }
        L.add(h('div.field', null, [h('span.label', { text: 'Mode' }),
          seg([['fast', 'Fast'], ['precise', 'Precise']], st.mode, function (v) { st.mode = v; setHint(); }, 'Trim mode'), modeHint]));
        L.add(h('div.field', null, [checkbox('Remove audio (mute)', false, function (v) { st.mute = v; })]));
        var fmtInfo = L.add(h('p.small.muted', { style: { margin: '0' } }));
        setHint();
        var goBtn = btn('btn-primary btn-lg', 'scissors', 'Trim video', run);
        L.actions.appendChild(goBtn);

        function run() {
          var r = T.get(), s = r[0], len = r[1] - r[0];
          if (len < 0.1) { BT.toast('Select a longer part', 'error'); return; }
          var F = outFmt();
          goBtn.disabled = true;
          L.out.innerHTML = '';
          var ui = progressCard();
          L.out.appendChild(ui.el);
          scrollTo(ui.el);
          job(S, ui, function (J) {
            return J.input(file, ext || 'mp4').then(function (inp) {
              var o = J.out(F.ext);
              var args = ['-ss', s.toFixed(3), '-i', inp, '-t', len.toFixed(3), '-map', '0:v:0'];
              if (!st.mute) args.push('-map', '0:a:0?');
              if (st.mode === 'fast') {
                args.push('-c', 'copy', '-avoid_negative_ts', 'make_zero');
              } else if (F.ext === 'webm') {
                var ve = pickEnc(['libvpx', 'libvpx-vp9']);
                args.push('-c:v', ve, '-deadline', 'good', '-cpu-used', ve === 'libvpx' ? '5' : '8', '-crf', ve === 'libvpx' ? '10' : '32', '-b:v', ve === 'libvpx' ? '4M' : '0');
                if (!st.mute) args.push('-c:a', pickEnc(['libopus', 'libvorbis']), '-b:a', '128k');
              } else {
                args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p');
                if (!st.mute) args.push('-c:a', 'aac', '-b:a', '160k');
              }
              if (st.mute) args.push('-an');
              if (/^(mp4|mov|3gp)$/.test(F.ext)) args.push('-movflags', '+faststart');
              args.push(o);
              return J.run(args, { dur: len, label: st.mode === 'fast' ? 'Cutting…' : 'Trimming and re-encoding…', sub: 'Keep this tab open.' }).then(function () { return J.read(o); });
            });
          }).then(function (data) {
            ui.remove();
            goBtn.disabled = false;
            var mime = { mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', mkv: 'video/x-matroska', avi: 'video/x-msvideo', '3gp': 'video/3gpp' }[F.ext] || 'video/mp4';
            var blob = new Blob([data], { type: mime });
            L.out.appendChild(resultCard({ S: S, blob: blob, name: BT.baseName(file.name) + '-trimmed.' + F.ext, kind: /^(mp4|webm|mov)$/.test(F.ext) ? 'video' : null,
              title: 'Clip ready', stats: [['Clip length', fmtDur(len)], ['From', fmtTime(s) + ' – ' + fmtTime(s + len)], ['Size', BT.fmtBytes(blob.size)]],
              onReset: reset, resetLabel: 'Trim another video' }));
            scrollTo(L.out.lastChild);
          }).catch(function (e) { ui.remove(); goBtn.disabled = false; errorBox(L.out, e); });
        }
      });
  });

  // ========================================================= 4. Convert
  var CONV_FORMATS = [
    { v: 'mp4', t: 'MP4', s: 'H.264 + AAC · plays everywhere', kind: 'video', need: [['libx264'], ['aac']], mime: 'video/mp4' },
    { v: 'webm', t: 'WebM', s: 'VP8/VP9 + Opus · for the web', kind: 'video', need: [['libvpx', 'libvpx-vp9'], ['libopus', 'libvorbis']], mime: 'video/webm' },
    { v: 'mov', t: 'MOV', s: 'H.264 + AAC · Apple, editing', kind: 'video', need: [['libx264'], ['aac']], mime: 'video/quicktime' },
    { v: 'mkv', t: 'MKV', s: 'H.264 + AAC · Matroska', kind: 'video', need: [['libx264'], ['aac']], mime: 'video/x-matroska' },
    { v: 'mp3', t: 'MP3', s: 'Audio only · universal', kind: 'audio', need: [['libmp3lame']], mime: 'audio/mpeg' },
    { v: 'm4a', t: 'M4A', s: 'AAC audio · Apple', kind: 'audio', need: [['aac']], mime: 'audio/mp4' },
    { v: 'wav', t: 'WAV', s: 'Uncompressed audio', kind: 'audio', need: [['pcm_s16le']], mime: 'audio/wav' }
  ];
  function fmtAvailable(f) { return f.need.every(function (alts) { return alts.some(hasEnc); }); }
  function fmtById(id) { for (var i = 0; i < CONV_FORMATS.length; i++) if (CONV_FORMATS[i].v === id) return CONV_FORMATS[i]; return null; }

  /** ffmpeg args for an audio export. */
  function audioArgs(fmt, kbps) {
    if (fmt === 'mp3') return ['-c:a', 'libmp3lame', '-b:a', kbps + 'k'];
    if (fmt === 'm4a') return ['-c:a', 'aac', '-b:a', kbps + 'k', '-movflags', '+faststart'];
    return ['-c:a', 'pcm_s16le'];
  }

  register('video-converter', function (root) {
    fileTool(root, { accept: VIDEO_ACCEPT + ',' + AUDIO_ACCEPT, title: 'Choose a video or audio file', hint: 'MP4, MOV, WebM, MKV, AVI, MP3, WAV… — or drag and drop it here', needVideo: false },
      function (host, file, meta, S, reset) {
        var L = editorLayout(host, 'Convert to');
        if (meta.hasVideo) L.left.appendChild(previewStage(file, meta, S).el);
        else L.left.appendChild(h('div.card', null, [mediaEl('audio', S.url(file))]));
        var ext = extOf(file.name);
        var st = { fmt: meta.hasVideo ? (ext === 'mp4' ? 'mp3' : 'mp4') : (ext === 'mp3' ? 'wav' : 'mp3'), q: 'balanced', res: 'orig', copy: true, kbps: { mp3: 192, m4a: 192 } };
        function list() {
          return CONV_FORMATS.filter(function (f) { return fmtAvailable(f) && (meta.hasVideo || f.kind === 'audio'); })
            .map(function (f) { return { v: f.v, t: f.t, s: f.s }; });
        }
        var cards = optCards(list(), st.fmt, function (v) { st.fmt = v; upd(); }, 'Output format');
        L.add(h('div.field', null, [h('span.label', { text: 'Format' }), cards]));
        var vOpts = h('div', null, [
          h('div.field', null, [h('span.label', { text: 'Quality' }), seg([['small', 'Smaller'], ['balanced', 'Balanced'], ['high', 'Better']], st.q, function (v) { st.q = v; }, 'Video quality')]),
          (function () { var s = select(resOptions(meta), st.res); s.addEventListener('change', function () { st.res = s.value; upd(); }); return field('Resolution', s); })(),
          h('div.field', null, [checkbox('Copy streams when possible (much faster, no quality loss)', st.copy, function (v) { st.copy = v; })])
        ]);
        var copyRow = vOpts.lastChild;
        var aOpts = h('div');
        L.add(vOpts);
        L.add(aOpts);
        var info = L.add(h('p.small.muted', { style: { margin: '0' } }));
        var goBtn = btn('btn-primary btn-lg', 'refresh-cw', 'Convert', run);
        L.actions.appendChild(goBtn);

        function upd() {
          var F = fmtById(st.fmt);
          if (!F || !fmtAvailable(F)) { st.fmt = (list()[0] || {}).v; F = fmtById(st.fmt); cards.set(st.fmt); }
          if (!F) return;
          vOpts.classList.toggle('hidden', F.kind !== 'video');
          copyRow.classList.toggle('hidden', F.v === 'webm' || st.res !== 'orig');
          aOpts.innerHTML = '';
          if (F.v === 'mp3' || F.v === 'm4a') {
            var choices = F.v === 'mp3' ? [128, 192, 320] : [128, 192, 256];
            aOpts.appendChild(h('div.field', null, [h('span.label', { text: 'Audio bitrate' }),
              seg(choices.map(function (k) { return [k, k + ' kbps']; }), st.kbps[F.v], function (v) { st.kbps[F.v] = v; }, 'Audio bitrate'),
              h('span.hint', { text: F.v === 'mp3' ? '128 kbps is fine for speech, 320 kbps for music.' : '192 kbps sounds great for most music.' })]));
          }
          info.textContent = F.kind === 'audio' ? (meta.hasVideo ? 'The audio track is extracted; the picture is dropped.' : '') + (F.v === 'wav' ? ' WAV files are large (about 10 MB per minute).' : '') : '';
        }
        watchEncoders(S, function () { cards.render(list()); cards.set(st.fmt); upd(); });
        upd();

        function videoArgs(F, inp, o, copy) {
          var args = ['-i', inp, '-map', '0:v:0', '-map', '0:a:0?'];
          if (copy) args.push('-c', 'copy');
          else if (F.v === 'webm') {
            var ve = pickEnc(['libvpx', 'libvpx-vp9']), ae = pickEnc(['libopus', 'libvorbis']);
            var d = outDims(meta, st.res), px = d ? d.w * d.h : 1280 * 720;
            var bpp = { small: 0.05, balanced: 0.09, high: 0.15 }[st.q];
            var br = Math.max(300, Math.round(px * 30 * bpp / 1000));
            args.push('-vf', scaleFilter(meta, st.res), '-c:v', ve);
            if (ve === 'libvpx') args.push('-deadline', 'good', '-cpu-used', '5', '-crf', String({ small: 32, balanced: 20, high: 10 }[st.q]), '-b:v', br + 'k');
            else args.push('-deadline', 'realtime', '-cpu-used', '8', '-crf', String({ small: 40, balanced: 33, high: 26 }[st.q]), '-b:v', '0');
            args.push('-c:a', ae, '-b:a', '128k');
          } else {
            args.push('-vf', scaleFilter(meta, st.res), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String({ small: 28, balanced: 23, high: 19 }[st.q]),
              '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k');
          }
          if (F.v === 'mp4' || F.v === 'mov') args.push('-movflags', '+faststart');
          args.push(o);
          return args;
        }

        function run() {
          var F = fmtById(st.fmt);
          if (!F) return;
          goBtn.disabled = true;
          L.out.innerHTML = '';
          var ui = progressCard();
          L.out.appendChild(ui.el);
          scrollTo(ui.el);
          var D = meta.duration;
          job(S, ui, function (J) {
            if (!fmtAvailable(F)) throw new Error(F.t + ' is not supported by this video engine. Please pick another format.');
            return J.input(file, ext || 'bin').then(function (inp) {
              var o = J.out(F.v);
              var opts = { dur: D, label: 'Converting to ' + F.t + '…', sub: 'Keep this tab open.', what: F.kind };
              if (F.kind === 'audio') {
                return J.run(['-i', inp, '-map', '0:a:0', '-vn'].concat(audioArgs(F.v, st.kbps[F.v])).concat([o]), opts).then(function () { return J.read(o); });
              }
              var tryCopy = st.copy && st.res === 'orig' && F.v !== 'webm';
              return (tryCopy ? J.probe(inp) : Promise.resolve(null)).then(function (pm) {
                var copy = !!(pm && pm.vcodec === 'h264' && (!pm.hasAudio || /^(aac|mp3)$/.test(pm.acodec)));
                return J.exec(videoArgs(F, inp, o, copy), opts).then(function (code) {
                  if (code === 0) return;
                  if (copy) return J.run(videoArgs(F, inp, o, false), opts);
                  throw ffError(J.logs, F.kind);
                });
              }).then(function () { return J.read(o); });
            });
          }).then(function (data) {
            ui.remove();
            goBtn.disabled = false;
            var blob = new Blob([data], { type: F.mime });
            var kind = F.kind === 'audio' ? 'audio' : (/^(mp4|webm|mov)$/.test(F.v) ? 'video' : null);
            L.out.appendChild(resultCard({ S: S, blob: blob, name: BT.baseName(file.name) + '.' + F.v, kind: kind, title: F.t + ' ready',
              stats: [['Original', BT.fmtBytes(file.size)], [F.t, BT.fmtBytes(blob.size)], ['Length', fmtDur(D)]],
              onReset: reset, resetLabel: 'Convert another' }));
            scrollTo(L.out.lastChild);
          }).catch(function (e) { ui.remove(); goBtn.disabled = false; errorBox(L.out, e); });
        }
      });
  });

  // ============================================================= 5. GIF
  register('video-to-gif', function (root) {
    fileTool(root, { title: 'Choose a video to turn into a GIF', hint: 'MP4, MOV, WebM, MKV or AVI — or drag and drop it here', needVideo: true },
      function (host, file, meta, S, reset) {
        var L = editorLayout(host, 'GIF settings');
        var pv = previewStage(file, meta, S);
        L.left.appendChild(pv.el);
        var D = meta.duration;
        var st = { fps: 12, width: Math.max(240, Math.min(480, Math.round((meta.width || 480) / 10) * 10)), loop: true, dither: 'sierra2_4a' };
        var T = trimmer(L.left, file, meta, S, pv.video, { start: 0, end: Math.min(D, 5), maxSpan: 30, label: 'Select the clip (up to 30 seconds)' });
        L.add(range('Frames per second', 5, 25, 1, st.fps, function (v) { return v + ' fps'; }, function (v) { st.fps = v; }));
        L.add(range('Width', 240, 800, 10, st.width, function (v) { return v + ' px'; }, function (v) { st.width = v; }));
        L.add(h('div.field', null, [h('span.label', { text: 'Dithering' }),
          seg([['sierra2_4a', 'Smooth'], ['bayer', 'Compact']], st.dither, function (v) { st.dither = v; }, 'Dithering'),
          h('span.hint', { text: 'Compact uses a fine pattern that compresses better (smaller file).' })]));
        L.add(h('div.field', null, [checkbox('Loop forever', true, function (v) { st.loop = v; })]));
        var goBtn = btn('btn-primary btn-lg', 'clapperboard', 'Make GIF', run);
        L.actions.appendChild(goBtn);

        function clipArgs(s, len, inp) { return ['-ss', s.toFixed(3), '-t', len.toFixed(3), '-i', inp]; }
        function run() {
          var r = T.get(), s = r[0], len = Math.min(30, r[1] - r[0]);
          if (len < 0.2) { BT.toast('Select a longer clip', 'error'); return; }
          var cfg = { fps: st.fps, width: st.width, loop: st.loop, dither: st.dither, s: s, len: len };
          goBtn.disabled = true;
          L.out.innerHTML = '';
          var ui = progressCard();
          L.out.appendChild(ui.el);
          scrollTo(ui.el);
          var vf = 'fps=' + cfg.fps + ',scale=' + cfg.width + ':-1:flags=lanczos';
          job(S, ui, function (J) {
            return J.input(file, extOf(file.name) || 'mp4').then(function (inp) {
              var pal = J.out('png'), o = J.out('gif');
              return J.run(clipArgs(s, len, inp).concat(['-vf', vf + ',palettegen=stats_mode=diff', pal]),
                { dur: len, from: 0, to: 0.3, label: 'Analysing colours…', sub: 'Pass 1 of 2' }).then(function () {
                var dith = cfg.dither === 'bayer' ? 'dither=bayer:bayer_scale=4' : 'dither=sierra2_4a';
                return J.run(clipArgs(s, len, inp).concat(['-i', pal, '-lavfi', vf + '[x];[x][1:v]paletteuse=' + dith + ':diff_mode=rectangle',
                  '-loop', cfg.loop ? '0' : '-1', o]), { dur: len, from: 0.3, to: 1, label: 'Rendering GIF…', sub: 'Pass 2 of 2' });
              }).then(function () { return J.read(o); });
            });
          }).then(function (data) {
            ui.remove();
            goBtn.disabled = false;
            var gif = new Blob([data], { type: 'image/gif' });
            var gw = data[6] | (data[7] << 8), gh = data[8] | (data[9] << 8);
            var mp4Out = h('div');
            var mp4Btn = btn('btn-lg', 'film', 'Make MP4 instead (smaller)', function () { makeMp4(cfg, gif, mp4Btn, mp4Out); });
            L.out.appendChild(resultCard({ S: S, blob: gif, name: BT.baseName(file.name) + '.gif', kind: 'image', title: 'GIF ready',
              stats: [['Size', BT.fmtBytes(gif.size)], ['Dimensions', gw + ' × ' + gh], ['Length', fmtDur(len) + ' · ' + cfg.fps + ' fps']],
              note: gif.size > 8 * 1048576 ? { kind: 'warn', html: 'This GIF is quite large. Lower the width, frame rate or length — or use the MP4 version, which is usually 5–10× smaller.' } : null,
              extra: [mp4Btn], onReset: reset, resetLabel: 'Start over' }));
            L.out.appendChild(mp4Out);
            scrollTo(L.out.firstChild);
          }).catch(function (e) { ui.remove(); goBtn.disabled = false; errorBox(L.out, e); });
        }

        function makeMp4(cfg, gif, b, out) {
          b.disabled = true;
          out.innerHTML = '';
          var ui = progressCard();
          out.appendChild(ui.el);
          job(S, ui, function (J) {
            return J.input(file, extOf(file.name) || 'mp4').then(function (inp) {
              var o = J.out('mp4');
              return J.run(clipArgs(cfg.s, cfg.len, inp).concat(['-vf', 'fps=' + cfg.fps + ',scale=' + cfg.width + ':-2:flags=lanczos', '-an',
                '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', o]),
                { dur: cfg.len, label: 'Making MP4 clip…' }).then(function () { return J.read(o); });
            });
          }).then(function (data) {
            ui.remove();
            var mp4 = new Blob([data], { type: 'video/mp4' });
            out.appendChild(resultCard({ S: S, blob: mp4, name: BT.baseName(file.name) + '-clip.mp4', kind: 'video', title: 'MP4 clip ready',
              stats: [['MP4 size', BT.fmtBytes(mp4.size)], ['GIF size', BT.fmtBytes(gif.size)], ['Smaller by', Math.max(0, pctSaved(gif.size, mp4.size)) + '%']],
              note: { kind: '', html: 'MP4 is silent and loops in most chat apps (WhatsApp, Telegram, Slack) just like a GIF.' } }));
          }).catch(function (e) { ui.remove(); b.disabled = false; errorBox(out, e); });
        }
      });
  });

  // ============================================================ 6. Audio
  register('audio-recorder', function (root) {
    injectCSS();
    var md = navigator.mediaDevices;
    var canRecord = !!(md && md.getUserMedia) && !!window.MediaRecorder;
    var S = newScope(), recS = null;
    var takes = [], takeNo = 0;
    var brand = function () { return getComputedStyle(doc.documentElement).getPropertyValue('--brand').trim() || '#4f46e5'; };

    var wave = h('canvas.vid-wave', { width: 800, height: 120, role: 'img', 'aria-label': 'Live microphone waveform' });
    var meter = h('span');
    var dot = h('span.vid-dot.idle'), timer = h('span.vid-timer', { text: '0:00', role: 'timer', 'aria-label': 'Recording time' });
    var status = h('span.small.muted', { text: 'Ready', 'aria-live': 'polite' });
    var recBtn = btn('btn-primary', 'mic', 'Record', startRec);
    var pauseBtn = btn('', 'clock', 'Pause', togglePause, { disabled: true });
    var stopBtn = btn('btn-danger', 'square', 'Stop', stopRec, { disabled: true });
    var nsCb = checkbox('Noise suppression & echo cancellation', true);
    var recCard = h('div.card', null, [
      h('h3', { text: 'Record from microphone' }),
      wave,
      h('div.vid-meter', { 'aria-hidden': 'true' }, [meter]),
      h('div.vid-recbar', null, [dot, timer, status, h('div.btn-group', null, [recBtn, pauseBtn, stopBtn])]),
      h('div', { style: { marginTop: '14px' } }, [nsCb])
    ]);
    var takesList = h('div.vid-takes');
    var dz = BT.dropzone({ accept: AUDIO_ACCEPT + ',' + VIDEO_ACCEPT, compact: true, title: 'Convert an existing file', hint: 'Audio or video: MP3, WAV, M4A, OGG, MP4…', icon: 'upload', color: '#e5484d',
      onFiles: function (f) { addTake(f[0], null, f[0].name, true); } });
    var takesCard = h('div.card', null, [h('h3', { text: 'Your takes' }), takesList, h('div', { style: { marginTop: '14px' } }, [dz])]);
    var editorHost = h('div.vid-out');
    root.appendChild(h('div.split', null, [recCard, takesCard]));
    root.appendChild(editorHost);
    root.appendChild(privacyNote('Recordings stay on your device. MP3/M4A export downloads a 32 MB audio/video engine once.'));
    if (!canRecord) {
      recCard.insertBefore(notice('warn', 'Recording isn’t supported in this browser. You can still convert audio files below.'), wave);
      recBtn.disabled = true;
    }
    renderTakes();
    drawIdle();

    function drawIdle() {
      var x = wave.getContext('2d');
      x.clearRect(0, 0, wave.width, wave.height);
      x.strokeStyle = brand();
      x.globalAlpha = 0.4;
      x.lineWidth = 2;
      x.beginPath(); x.moveTo(0, wave.height / 2); x.lineTo(wave.width, wave.height / 2); x.stroke();
      x.globalAlpha = 1;
      meter.style.width = '0';
    }

    var R = null;
    function release() {
      if (!R) return;
      if (R.raf) cancelAnimationFrame(R.raf);
      clearInterval(R.tick);
      stopStream(R.stream);
      if (R.ac) R.ac.close().catch(noop);
      R.released = true;
    }
    S.on(function () { if (R) { R.discard = true; if (R.rec && R.rec.state !== 'inactive') R.rec.stop(); release(); } });

    function startRec() {
      if (R && !R.released) return;
      recBtn.disabled = true;
      status.textContent = 'Asking for microphone…';
      var ns = nsCb.input.checked;
      md.getUserMedia({ audio: { echoCancellation: ns, noiseSuppression: ns, autoGainControl: ns } }).then(function (stream) {
        R = { stream: stream, chunks: [], acc: 0, t0: 0, paused: false };
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          R.ac = new AC();
          var an = R.ac.createAnalyser();
          an.fftSize = 2048;
          R.ac.createMediaStreamSource(stream).connect(an);
          if (R.ac.resume) R.ac.resume().catch(noop);
          var buf = new Float32Array(an.fftSize), x = wave.getContext('2d'), col = brand();
          var loop = function () {
            if (R.released) return;
            an.getFloatTimeDomainData(buf);
            var W = wave.width, H = wave.height, sum = 0;
            x.clearRect(0, 0, W, H);
            x.lineWidth = 2;
            x.strokeStyle = col;
            x.beginPath();
            for (var i = 0; i < buf.length; i++) {
              var v = buf[i];
              sum += v * v;
              var px = i / (buf.length - 1) * W, py = H / 2 - v * H * 0.45;
              if (i) x.lineTo(px, py); else x.moveTo(px, py);
            }
            x.stroke();
            var db = 20 * Math.log10(Math.sqrt(sum / buf.length) || 1e-8);
            meter.style.width = Math.max(0, Math.min(100, (db + 60) / 60 * 100)) + '%';
            R.raf = requestAnimationFrame(loop);
          };
          loop();
        }
        var mime = pickMime(AUDIO_MIMES);
        var rec;
        try { rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream); } catch (e) { rec = new MediaRecorder(stream); }
        R.rec = rec;
        rec.ondataavailable = function (e) { if (e.data && e.data.size) R.chunks.push(e.data); };
        rec.onstop = function () {
          var secs = elapsed();
          var type = (rec.mimeType || mime || 'audio/webm').split(';')[0];
          var blob = new Blob(R.chunks, { type: type });
          release();
          resetControls();
          if (R.discard) return;
          takeNo++;
          var ext = /mp4/.test(type) ? 'm4a' : /ogg/.test(type) ? 'ogg' : 'webm';
          addTake(blob, secs, 'Recording ' + takeNo + '.' + ext, false);
        };
        rec.start(1000);
        R.t0 = performance.now();
        R.tick = setInterval(function () { timer.textContent = fmtTime(elapsed(), 0); }, 250);
        dot.className = 'vid-dot';
        status.textContent = 'Recording';
        pauseBtn.disabled = stopBtn.disabled = false;
      }).catch(function (e) {
        recBtn.disabled = false;
        status.textContent = 'Ready';
        BT.toast(friendlyMediaError(e, 'Microphone'), 'error');
      });
    }
    function elapsed() { return R ? R.acc + (R.t0 && !R.paused ? (performance.now() - R.t0) / 1000 : 0) : 0; }
    function togglePause() {
      if (!R || !R.rec) return;
      if (R.rec.state === 'recording') {
        R.rec.pause();
        R.acc += (performance.now() - R.t0) / 1000;
        R.paused = true;
        dot.className = 'vid-dot paused';
        status.textContent = 'Paused';
        setBtnText(pauseBtn, 'mic', 'Resume');
      } else if (R.rec.state === 'paused') {
        R.rec.resume();
        R.t0 = performance.now();
        R.paused = false;
        dot.className = 'vid-dot';
        status.textContent = 'Recording';
        setBtnText(pauseBtn, 'clock', 'Pause');
      }
    }
    function stopRec() {
      if (!R || !R.rec || R.rec.state === 'inactive') return;
      if (R.rec.state === 'recording') R.acc += (performance.now() - R.t0) / 1000;
      R.paused = true;
      pauseBtn.disabled = stopBtn.disabled = true;
      status.textContent = 'Saving…';
      R.rec.stop();
    }
    function resetControls() {
      dot.className = 'vid-dot idle';
      status.textContent = 'Ready';
      recBtn.disabled = !canRecord;
      pauseBtn.disabled = stopBtn.disabled = true;
      setBtnText(pauseBtn, 'clock', 'Pause');
      timer.textContent = '0:00';
      drawIdle();
    }

    function addTake(blob, secs, name, uploaded) {
      var t = { id: takes.length + 1, blob: blob, name: name, secs: secs, url: S.url(blob), uploaded: uploaded };
      takes.unshift(t);
      renderTakes();
      if (uploaded) openEditor(t);
      else BT.toast('Recording saved');
    }
    function renderTakes() {
      takesList.innerHTML = '';
      if (!takes.length) { takesList.appendChild(h('div.vid-empty', { text: 'No recordings yet. Press Record to start, or add a file below.' })); return; }
      takes.forEach(function (t) {
        var meta = (t.secs ? fmtDur(t.secs) + ' · ' : '') + BT.fmtBytes(t.blob.size);
        takesList.appendChild(h('div.vid-take', null, [
          h('div.n', null, [h('span', { text: t.name, style: { overflowWrap: 'anywhere' } }), h('span.badge', { text: meta })]),
          mediaEl('audio', t.url, 'Play ' + t.name),
          h('div.btn-group', null, [
            btn('btn-sm btn-primary', 'scissors', 'Trim & export', function () { openEditor(t); }),
            btn('btn-sm', 'download', 'Original', function () { BT.download(t.blob, t.name); }),
            btn('btn-sm btn-ghost', 'trash-2', 'Delete', function () {
              takes.splice(takes.indexOf(t), 1);
              if (edS && edS.take === t) { edS.dispose(); edS = null; editorHost.innerHTML = ''; }
              renderTakes();
            }, { 'aria-label': 'Delete ' + t.name })
          ])
        ]));
      });
    }

    var edS = null;
    function openEditor(t) {
      if (edS) edS.dispose();
      edS = newScope();
      edS.take = t;
      var myS = edS;
      S.on(function () { myS.dispose(); });
      editorHost.innerHTML = '';
      var card = h('div.card.vid-ed', null, [h('div.vid-loading', { html: '<span class="spinner"></span> Reading audio…' })]);
      editorHost.appendChild(card);
      scrollTo(card);
      probeElement(t.blob, 'audio').then(function (m) {
        if (myS.dead) return null;
        if (m && m.duration) return m;
        if (t.secs) return { duration: t.secs };
        var ui = progressCard();
        card.innerHTML = '';
        card.appendChild(ui.el);
        return job(myS, ui, function (J) { return J.input(t.blob, extOf(t.name) || 'bin').then(J.probe); }).then(function (pm) { ui.remove(); return pm; });
      }).then(function (meta) {
        if (!meta || myS.dead) return;
        card.innerHTML = '';
        if (!meta.duration) { card.appendChild(notice('error', 'This file could not be read.')); return; }
        if (meta.viaEngine && !meta.hasAudio) { card.appendChild(notice('error', 'This file has no audio track.')); return; }
        buildEditor(card, t, meta, myS);
      }).catch(function (e) { if (!myS.dead) { card.innerHTML = ''; errorBox(card, e); } });
    }

    function buildEditor(card, t, meta, myS) {
      var D = meta.duration;
      card.appendChild(h('div.card-title', null, [h('h3', { text: 'Trim & export: ' + t.name, style: { overflowWrap: 'anywhere' } }),
        btn('btn-ghost btn-sm', 'x', 'Close', function () { myS.dispose(); editorHost.innerHTML = ''; })]));
      var player = mediaEl('audio', myS.url(t.blob), 'Preview ' + t.name);
      card.appendChild(player);
      // Use the trimmer with the audio element as the "video" for playhead/set-at-current.
      var T = trimmer(card, t.blob, { duration: D }, myS, player, { start: 0, end: D, wave: true, label: 'Keep this part' });
      var st = { fmt: hasEnc('libmp3lame') ? 'mp3' : 'wav', kbps: { mp3: 192, m4a: 192 } };
      var fmts = [['mp3', 'MP3'], ['wav', 'WAV'], ['m4a', 'M4A']].filter(function (f) { return fmtAvailable(fmtById(f[0])); });
      var fmtSeg = seg(fmts, st.fmt, function (v) { st.fmt = v; updBr(); }, 'Export format');
      var brHost = h('div');
      function updBr() {
        brHost.innerHTML = '';
        if (st.fmt === 'wav') { brHost.appendChild(h('p.small.muted', { style: { margin: '0' }, text: 'WAV is uncompressed (about 10 MB per minute) — best for editing.' })); return; }
        var ch = st.fmt === 'mp3' ? [128, 192, 320] : [128, 192, 256];
        brHost.appendChild(h('div.field', null, [h('span.label', { text: 'Bitrate' }),
          seg(ch.map(function (k) { return [k, k + ' kbps']; }), st.kbps[st.fmt], function (v) { st.kbps[st.fmt] = v; }, 'Bitrate')]));
      }
      var out = h('div.vid-out');
      var goBtn = btn('btn-primary btn-lg', 'download', 'Export', run);
      card.appendChild(h('div.row.cols-2', { style: { marginTop: '14px' } }, [h('div.field', null, [h('span.label', { text: 'Format' }), fmtSeg]), brHost]));
      card.appendChild(h('div.vid-actions', null, [goBtn]));
      card.appendChild(out);
      updBr();

      function run() {
        var r = T.get(), s = r[0], len = r[1] - r[0];
        if (len < 0.1) { BT.toast('Select a longer part', 'error'); return; }
        var full = s < 0.05 && r[1] > D - 0.05;
        var fmt = st.fmt, F = fmtById(fmt);
        goBtn.disabled = true;
        out.innerHTML = '';
        var ui = progressCard();
        out.appendChild(ui.el);
        scrollTo(ui.el);
        job(myS, ui, function (J) {
          return J.input(t.blob, extOf(t.name) || 'webm').then(function (inp) {
            var o = J.out(fmt);
            var args = ['-i', inp];
            if (!full) args.push('-ss', s.toFixed(3), '-t', len.toFixed(3));
            args = args.concat(['-map', '0:a:0', '-vn']).concat(audioArgs(fmt, st.kbps[fmt])).concat([o]);
            return J.run(args, { dur: full ? D : len, label: 'Exporting ' + F.t + '…', what: 'audio' }).then(function () { return J.read(o); });
          });
        }).then(function (data) {
          ui.remove();
          goBtn.disabled = false;
          var blob = new Blob([data], { type: F.mime });
          out.appendChild(resultCard({ S: myS, blob: blob, name: BT.baseName(t.name) + (full ? '' : '-trimmed') + '.' + fmt, kind: 'audio', title: F.t + ' ready',
            stats: [['Length', fmtDur(full ? D : len)], ['Size', BT.fmtBytes(blob.size)], ['Format', F.t + (fmt === 'wav' ? '' : ' · ' + st.kbps[fmt] + ' kbps')]] }));
          scrollTo(out.lastChild);
        }).catch(function (e) { ui.remove(); goBtn.disabled = false; errorBox(out, e); });
      }
    }
  });

  // core.js may boot before this deferred script has run; if the page already
  // shows the "failed to load" notice for one of our tools, start it now.
  (function rescue() {
    var root = doc.getElementById('tool-root');
    if (!root) return;
    var id = root.getAttribute('data-tool');
    var tool = BT.tool(id);
    if (!tool || tool.cat !== 'video' || !root.querySelector('.notice.error')) return;
    var impl = IMPLS[id];
    if (!impl) return;
    root.innerHTML = '';
    root.setAttribute('data-mounted', '1');
    try { impl(root, { tool: tool, category: BT.category(tool.cat) }); } catch (e) { console.error(e); }
  })();
})();
