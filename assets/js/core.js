/*
 * BISCS Tools — core runtime.
 * Shared helpers for every tool (window.BT) plus site chrome behaviour:
 * theme, search palette, mobile menu, 3D card tilt and scroll reveal.
 *
 * A tool implementation registers itself with:
 *   BT.impl('tool-id', function (root, ctx) { ... })
 * where root is the empty #tool-root element and ctx.tool is its registry entry.
 */
(function () {
  'use strict';

  var doc = document;
  var BASE = doc.documentElement.getAttribute('data-base') || '';
  var REG = window.BT_REGISTRY || { TOOLS: [], CATEGORIES: [] };
  var ICONS = window.BT_ICONS || {};
  var impls = {};

  var BT = {
    base: BASE,
    tools: REG.TOOLS,
    categories: REG.CATEGORIES
  };

  // ----------------------------------------------------------------- DOM
  BT.$ = function (sel, root) { return (root || doc).querySelector(sel); };
  BT.$$ = function (sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); };

  BT.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /** SVG markup for a Lucide icon from the bundled subset. */
  BT.icon = function (name, cls) {
    var inner = ICONS[name] || ICONS['sparkles'] || '';
    return '<svg class="icon ' + (cls || '') + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  };

  /**
   * Tiny element builder: BT.h('div.card', {onclick: fn, 'data-x': 1}, [children | 'text'])
   * Attribute `html` sets innerHTML.
   */
  BT.h = function (spec, attrs, children) {
    var m = String(spec).split('.');
    var el = doc.createElement(m[0] || 'div');
    if (m.length > 1) el.className = m.slice(1).join(' ');
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k in el && typeof v !== 'string') el[k] = v;
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    if (children != null) {
      [].concat(children).forEach(function (c) {
        if (c == null || c === false) return;
        el.appendChild(typeof c === 'string' || typeof c === 'number' ? doc.createTextNode(String(c)) : c);
      });
    }
    return el;
  };

  BT.debounce = function (fn, ms) {
    var t;
    return function () {
      var a = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, a); }, ms == null ? 150 : ms);
    };
  };

  /** Call fn on every input/change inside root, and once immediately. */
  BT.bindInputs = function (root, fn) {
    root.addEventListener('input', fn);
    root.addEventListener('change', fn);
    fn();
  };

  // ------------------------------------------------------------- Numbers
  /** Parse a user-typed number; accepts "1,23,456.5". Returns NaN when empty/invalid. */
  BT.num = function (v) {
    if (typeof v === 'number') return v;
    if (v && v.value !== undefined) v = v.value;
    v = String(v == null ? '' : v).replace(/[,\s₹]/g, '');
    if (v === '' || v === '-' || v === '.') return NaN;
    return Number(v);
  };

  /** Indian digit grouping: 12,34,567.89 */
  BT.fmtNum = function (n, dp) {
    if (n == null || !isFinite(n)) return '—';
    dp = dp == null ? 2 : dp;
    return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: dp });
  };
  /** Rupee amount: ₹12,34,567 */
  BT.fmtINR = function (n, dp) {
    if (n == null || !isFinite(n)) return '—';
    return (n < 0 ? '-₹' : '₹') + BT.fmtNum(Math.abs(n), dp == null ? 0 : dp);
  };
  BT.fmtBytes = function (b) {
    if (!isFinite(b)) return '—';
    if (b < 1024) return b + ' B';
    var u = ['KB', 'MB', 'GB'], i = -1;
    do { b /= 1024; i++; } while (b >= 1024 && i < u.length - 1);
    return b.toFixed(b < 10 ? 2 : 1) + ' ' + u[i];
  };

  // ------------------------------------------------------- Feedback / IO
  var toastWrap;
  BT.toast = function (msg, kind) {
    if (!toastWrap) {
      toastWrap = BT.h('div.toasts', { role: 'status', 'aria-live': 'polite' });
      doc.body.appendChild(toastWrap);
    }
    var t = BT.h('div.toast' + (kind === 'error' ? '.error' : ''), {
      html: BT.icon(kind === 'error' ? 'info' : 'check') + '<span>' + BT.esc(msg) + '</span>'
    });
    toastWrap.appendChild(t);
    setTimeout(function () { t.remove(); }, kind === 'error' ? 4500 : 2200);
  };

  BT.copy = function (text, msg) {
    var done = function () { BT.toast(msg || 'Copied to clipboard'); };
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    }
    fallback();
    function fallback() {
      var ta = BT.h('textarea', { style: { position: 'fixed', opacity: '0' } });
      ta.value = text;
      doc.body.appendChild(ta);
      ta.select();
      try { doc.execCommand('copy'); done(); } catch (e) { BT.toast('Copy failed', 'error'); }
      ta.remove();
    }
    return Promise.resolve();
  };

  /** Download a Blob, Uint8Array/ArrayBuffer, data: URL or string. */
  BT.download = function (data, filename, mime) {
    var url, revoke = false;
    if (typeof data === 'string' && data.slice(0, 5) === 'data:') url = data;
    else {
      var blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
      url = URL.createObjectURL(blob);
      revoke = true;
    }
    var a = BT.h('a', { href: url, download: filename || 'download' });
    doc.body.appendChild(a);
    a.click();
    a.remove();
    if (revoke) setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  };

  /** Zip [{name, data}] with JSZip and download. */
  BT.downloadZip = function (files, zipName) {
    return BT.loadLib('jszip').then(function () {
      var zip = new window.JSZip();
      files.forEach(function (f) { zip.file(f.name, f.data); });
      return zip.generateAsync({ type: 'blob' });
    }).then(function (blob) { BT.download(blob, zipName || 'files.zip'); });
  };

  BT.readFile = function (file, as) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
      if (as === 'dataURL') r.readAsDataURL(file);
      else if (as === 'text') r.readAsText(file);
      else r.readAsArrayBuffer(file);
    });
  };

  /** Load an HTMLImageElement from a File/Blob or URL. */
  BT.loadImage = function (src) {
    return new Promise(function (res, rej) {
      var img = new Image();
      var url = src instanceof Blob ? URL.createObjectURL(src) : src;
      img.onload = function () { res(img); };
      img.onerror = function () { rej(new Error('Could not read this image')); };
      img.src = url;
    });
  };

  BT.canvasToBlob = function (canvas, type, quality) {
    return new Promise(function (res) { canvas.toBlob(res, type || 'image/png', quality); });
  };

  /** "photo.final.jpg" -> "photo.final" */
  BT.baseName = function (name) { return String(name || 'file').replace(/\.[^.]+$/, ''); };

  /**
   * Drag-and-drop file picker.
   * opts: { accept, multiple, title, hint, icon, color, compact, onFiles(files[]) }
   */
  BT.dropzone = function (opts) {
    opts = opts || {};
    var input = BT.h('input', { type: 'file', accept: opts.accept || '', multiple: !!opts.multiple, 'aria-label': opts.title || 'Choose file' });
    var dz = BT.h('label.dropzone' + (opts.compact ? '.compact' : ''), {
      style: opts.color ? { '--c': opts.color } : null,
      html: '<span class="dz-icon">' + BT.icon(opts.icon || 'upload') + '</span>' +
        '<span><strong>' + BT.esc(opts.title || 'Choose a file') + '</strong><br><span class="muted small">' +
        BT.esc(opts.hint || 'or drag and drop it here') + '</span></span>'
    });
    dz.appendChild(input);
    function take(list) {
      var files = Array.prototype.slice.call(list || []);
      if (opts.accept) {
        var acc = opts.accept.split(',').map(function (s) { return s.trim().toLowerCase(); });
        files = files.filter(function (f) {
          var n = f.name.toLowerCase(), t = (f.type || '').toLowerCase();
          return acc.some(function (a) {
            if (a[0] === '.') return n.slice(-a.length) === a;
            if (a.slice(-2) === '/*') return t.indexOf(a.slice(0, -1)) === 0;
            return t === a;
          });
        });
        if (!files.length && list && list.length) BT.toast('That file type is not supported here', 'error');
      }
      if (!opts.multiple) files = files.slice(0, 1);
      if (files.length && opts.onFiles) opts.onFiles(files);
      input.value = '';
    }
    input.addEventListener('change', function () { take(input.files); });
    ['dragenter', 'dragover'].forEach(function (e) {
      dz.addEventListener(e, function (ev) { ev.preventDefault(); dz.classList.add('drag'); });
    });
    ['dragleave', 'drop'].forEach(function (e) {
      dz.addEventListener(e, function (ev) { ev.preventDefault(); dz.classList.remove('drag'); });
    });
    dz.addEventListener('drop', function (ev) { take(ev.dataTransfer && ev.dataTransfer.files); });
    dz.input = input;
    return dz;
  };

  // --------------------------------------------------------- Lazy libs
  var LIBS = {
    pdflib: { src: 'pdf-lib.min.js', global: 'PDFLib' },
    pdfjs: { src: 'pdf.min.js', global: 'pdfjsLib' },
    jszip: { src: 'jszip.min.js', global: 'JSZip' },
    qrcode: { src: 'qrcode.js', global: 'qrcode' },
    jsbarcode: { src: 'JsBarcode.all.min.js', global: 'JsBarcode' },
    marked: { src: 'marked.min.js', global: 'marked' },
    dompurify: { src: 'purify.min.js', global: 'DOMPurify' }
  };
  var libPromises = {};
  BT.loadLib = function (name) {
    if (libPromises[name]) return libPromises[name];
    var lib = LIBS[name];
    if (!lib) return Promise.reject(new Error('Unknown library ' + name));
    libPromises[name] = new Promise(function (res, rej) {
      if (window[lib.global]) return res(window[lib.global]);
      var s = BT.h('script', { src: BASE + 'assets/vendor/' + lib.src });
      s.onload = function () {
        var g = window[lib.global];
        if (name === 'pdfjs' && g) g.GlobalWorkerOptions.workerSrc = BASE + 'assets/vendor/pdf.worker.min.js';
        g ? res(g) : rej(new Error(name + ' failed to initialise'));
      };
      s.onerror = function () { delete libPromises[name]; rej(new Error('Could not load ' + name)); };
      doc.head.appendChild(s);
    });
    return libPromises[name];
  };

  // ---------------------------------------------------------- PDF helpers
  /** Open a PDF for rendering with pdf.js. Accepts File/ArrayBuffer/Uint8Array. */
  BT.openPdfjs = function (src) {
    return BT.loadLib('pdfjs').then(function (pdfjsLib) {
      var p = src instanceof Blob ? BT.readFile(src) : Promise.resolve(src);
      return p.then(function (buf) {
        // pdf.js transfers the buffer to its worker, so hand it a copy.
        var data = new Uint8Array(buf instanceof ArrayBuffer ? buf.slice(0) : buf.slice(0));
        return pdfjsLib.getDocument({ data: data, isEvalSupported: false }).promise;
      });
    });
  };

  /** Render a pdf.js page into a new canvas. Returns {canvas, viewport}. */
  BT.renderPdfPage = function (page, scale, rotation) {
    var viewport = page.getViewport({ scale: scale || 1, rotation: rotation == null ? page.rotate : rotation });
    var canvas = doc.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
      return { canvas: canvas, viewport: viewport };
    });
  };

  /** Render a page so its longest side is `px` pixels (for thumbnails). */
  BT.renderPdfThumb = function (pdf, pageNo, px) {
    return pdf.getPage(pageNo).then(function (page) {
      var vp = page.getViewport({ scale: 1 });
      return BT.renderPdfPage(page, (px || 180) / Math.max(vp.width, vp.height));
    }).then(function (r) { return r.canvas; });
  };

  /**
   * Load a PDF with pdf-lib. Handles owner-password ("restrictions only")
   * files via ignoreEncryption, and throws a friendly error otherwise.
   */
  BT.openPdfLib = function (src) {
    return BT.loadLib('pdflib').then(function (PDFLib) {
      var p = src instanceof Blob ? BT.readFile(src) : Promise.resolve(src);
      return p.then(function (buf) {
        return PDFLib.PDFDocument.load(buf, { ignoreEncryption: true, updateMetadata: false });
      }).catch(function (e) {
        throw new Error('This PDF could not be opened. It may be damaged or password protected. (' + (e && e.message || e) + ')');
      });
    });
  };

  /**
   * Parse "1-3, 5, 8-" into sorted unique 0-based page indexes.
   * Throws an Error with a readable message for invalid input.
   */
  BT.parsePageRanges = function (str, total) {
    var out = [];
    String(str || '').split(',').forEach(function (part) {
      part = part.trim();
      if (!part) return;
      var m = part.match(/^(\d*)\s*-\s*(\d*)$/);
      var a, b;
      if (m) {
        a = m[1] ? parseInt(m[1], 10) : 1;
        b = m[2] ? parseInt(m[2], 10) : total;
      } else if (/^\d+$/.test(part)) {
        a = b = parseInt(part, 10);
      } else {
        throw new Error('"' + part + '" is not a valid page or range');
      }
      if (a < 1 || b > total || a > b) throw new Error('Pages must be between 1 and ' + total + ' ("' + part + '")');
      for (var i = a; i <= b; i++) out.push(i - 1);
    });
    out = out.filter(function (v, i, arr) { return arr.indexOf(v) === i; });
    return out;
  };

  /** Busy state for a button while a promise runs. */
  BT.busy = function (btn, promiseFn, label) {
    var old = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> ' + BT.esc(label || 'Working…');
    return Promise.resolve().then(promiseFn).catch(function (e) {
      console.error(e);
      BT.toast(e && e.message ? e.message : String(e), 'error');
    }).then(function (r) {
      btn.disabled = false;
      btn.innerHTML = old;
      return r;
    });
  };

  // ----------------------------------------------------------- Registry
  BT.impl = function (id, fn) { impls[id] = fn; };
  BT.tool = function (id) {
    for (var i = 0; i < REG.TOOLS.length; i++) if (REG.TOOLS[i].id === id) return REG.TOOLS[i];
    return null;
  };
  BT.category = function (id) {
    for (var i = 0; i < REG.CATEGORIES.length; i++) if (REG.CATEGORIES[i].id === id) return REG.CATEGORIES[i];
    return null;
  };
  BT.toolUrl = function (id) { return BASE + 'tools/' + id + '/'; };

  /** Fuzzy-ish search over name, description, keywords and category. */
  BT.search = function (q) {
    q = String(q || '').toLowerCase().trim();
    if (!q) return REG.TOOLS.slice();
    var words = q.split(/\s+/);
    return REG.TOOLS.map(function (t) {
      var cat = BT.category(t.cat);
      var name = t.name.toLowerCase();
      var hay = (t.name + ' ' + t.desc + ' ' + (t.kw || '') + ' ' + (cat ? cat.name : '') + ' ' + t.id).toLowerCase();
      var score = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (hay.indexOf(w) === -1) return null;
        if (name.indexOf(w) === 0) score += 6;
        else if (name.indexOf(w) > -1) score += 4;
        else if ((t.kw || '').indexOf(w) > -1) score += 2;
        else score += 1;
      }
      return { t: t, s: score };
    }).filter(Boolean).sort(function (a, b) { return b.s - a.s; }).map(function (r) { return r.t; });
  };

  // ======================================================== Site chrome
  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  function initTheme() {
    var saved = store('bt-theme');
    if (saved) doc.documentElement.setAttribute('data-theme', saved);
    BT.$$('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cur = doc.documentElement.getAttribute('data-theme') ||
          (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        var next = cur === 'dark' ? 'light' : 'dark';
        doc.documentElement.setAttribute('data-theme', next);
        store('bt-theme', next);
      });
    });
  }

  function initMenu() {
    var btn = BT.$('[data-menu-toggle]'), nav = BT.$('.mobile-nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function miniIcon(t) {
    var c = BT.category(t.cat);
    return '<span class="mi" style="background:' + (c ? c.color : 'var(--brand)') + '">' + BT.icon(t.icon) + '</span>';
  }

  function initSearch() {
    var modal = BT.h('div.search-modal', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Search tools' });
    modal.innerHTML = '<div class="search-panel"><div class="sp-input">' + BT.icon('search') +
      '<input type="search" placeholder="Search 100 free tools…" aria-label="Search tools" autocomplete="off">' +
      '<button class="icon-btn" data-close aria-label="Close search">' + BT.icon('x') + '</button></div>' +
      '<div class="search-results" role="listbox"></div></div>';
    doc.body.appendChild(modal);
    var input = BT.$('input', modal), results = BT.$('.search-results', modal), active = 0;

    function render() {
      var list = BT.search(input.value).slice(0, 12);
      active = 0;
      results.innerHTML = list.length ? list.map(function (t, i) {
        return '<a href="' + BT.toolUrl(t.id) + '" role="option"' + (i === 0 ? ' class="active"' : '') + '>' + miniIcon(t) +
          '<span><span class="t">' + BT.esc(t.name) + '</span><br><span class="d">' + BT.esc(t.desc) + '</span></span></a>';
      }).join('') : '<p class="muted" style="padding:16px">No tools match “' + BT.esc(input.value) + '”.</p>';
    }
    function open(q) {
      modal.classList.add('open');
      input.value = q || '';
      render();
      setTimeout(function () { input.focus(); }, 10);
    }
    function close() { modal.classList.remove('open'); }
    BT.openSearch = open;

    input.addEventListener('input', render);
    input.addEventListener('keydown', function (e) {
      var items = BT.$$('a', results);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!items.length) return;
        items[active].classList.remove('active');
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[active].classList.add('active');
        items[active].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && items[active]) {
        location.href = items[active].href;
      }
    });
    modal.addEventListener('click', function (e) { if (e.target === modal || e.target.closest('[data-close]')) close(); });
    doc.addEventListener('keydown', function (e) {
      var typing = /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || '')) || e.target.isContentEditable;
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) { e.preventDefault(); open(); }
      else if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });
    BT.$$('[data-search-open]').forEach(function (b) { b.addEventListener('click', function () { open(); }); });
  }

  /** Home/category page: live filter of the pre-rendered grid. */
  function initDirectory() {
    var grid = BT.$('[data-tool-grid]');
    if (!grid) return;
    var cards = BT.$$('.tool-card', grid);
    var input = BT.$('[data-filter-input]');
    var chips = BT.$$('[data-cat-chip]');
    var empty = BT.$('[data-empty]');
    var cat = 'all';

    function apply() {
      var q = input ? input.value : '';
      var allowed = {};
      BT.search(q).forEach(function (t) { allowed[t.id] = true; });
      var shown = 0;
      cards.forEach(function (c) {
        var ok = allowed[c.getAttribute('data-id')] && (cat === 'all' || c.getAttribute('data-cat') === cat);
        c.classList.toggle('hidden', !ok);
        if (ok) shown++;
      });
      if (empty) empty.classList.toggle('hidden', shown > 0);
    }
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        cat = chip.getAttribute('data-cat-chip');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        apply();
      });
    });
    if (input) {
      input.addEventListener('input', apply);
      var form = input.closest('form');
      if (form) form.addEventListener('submit', function (e) {
        e.preventDefault();
        var target = BT.$('#all-tools');
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    }
    var q = new URLSearchParams(location.search).get('q');
    if (q && input) { input.value = q; }
    apply();
  }

  /** 3D tilt that follows the pointer (fine pointers only). */
  function initTilt() {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    doc.addEventListener('pointermove', function (e) {
      var card = e.target.closest && e.target.closest('.tool-card, .cat-card');
      if (!card) return;
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      var max = card.classList.contains('cat-card') ? 8 : 10;
      card.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y) * max).toFixed(2) + 'deg) rotateY(' + ((x - 0.5) * max).toFixed(2) + 'deg) translateZ(6px)';
      card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    }, { passive: true });
    doc.addEventListener('pointerout', function (e) {
      var card = e.target.closest && e.target.closest('.tool-card, .cat-card');
      if (card && !card.contains(e.relatedTarget)) card.style.transform = '';
    });
  }

  function initReveal() {
    var els = BT.$$('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  function initTool() {
    var root = BT.$('#tool-root');
    if (!root) return;
    var id = root.getAttribute('data-tool');
    var fn = impls[id];
    var tool = BT.tool(id);
    if (!fn) {
      root.innerHTML = '<div class="notice error">' + BT.icon('info') + '<span>This tool failed to load. Please refresh the page.</span></div>';
      return;
    }
    root.innerHTML = '';
    try {
      fn(root, { tool: tool, category: tool && BT.category(tool.cat) });
    } catch (e) {
      console.error(e);
      root.innerHTML = '<div class="notice error">' + BT.icon('info') + '<span>Something went wrong: ' + BT.esc(e.message) + '</span></div>';
    }
  }

  function boot() {
    initTheme();
    initMenu();
    initSearch();
    initDirectory();
    initTilt();
    initReveal();
    initTool();
  }

  window.BT = BT;
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else setTimeout(boot, 0);
})();
