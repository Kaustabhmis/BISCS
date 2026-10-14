/*
 * BISCS Tools — PDF editor ("Edit PDF") and "Sign PDF".
 *
 * Pages are rendered with pdf.js; annotations live in an HTML overlay and are
 * stored in "view units" (CSS px at zoom 1 in the page's displayed
 * orientation). On save they are drawn into the original PDF with pdf-lib, so
 * existing text stays selectable and vector content stays sharp. View → PDF
 * coordinates use pdf.js's viewport.convertToPdfPoint, which accounts for page
 * rotation and crop box offsets.
 */
(function () {
  'use strict';
  var BT = window.BT;

  var FONTS = {
    helv: { label: 'Helvetica', css: 'Helvetica, Arial, sans-serif', base: 0.947, std: ['Helvetica', 'HelveticaBold', 'HelveticaOblique', 'HelveticaBoldOblique'] },
    times: { label: 'Times', css: '"Times New Roman", Times, serif', base: 0.938, std: ['TimesRoman', 'TimesRomanBold', 'TimesRomanItalic', 'TimesRomanBoldItalic'] },
    cour: { label: 'Courier', css: '"Courier New", Courier, monospace', base: 0.867, std: ['Courier', 'CourierBold', 'CourierOblique', 'CourierBoldOblique'] }
  };
  var LINE_H = 1.2;
  var SWATCHES = ['#000000', '#1f2937', '#e5484d', '#f76b15', '#facc15', '#12a594', '#0090ff', '#3e63dd', '#8e4ec6', '#ffffff'];

  var TOOLS = [
    { id: 'select', label: 'Select', icon: 'mouse-pointer-2', key: 'v' },
    { id: 'edittext', label: 'Edit text', icon: 'file-pen-line', key: 'e' },
    { id: 'text', label: 'Add text', icon: 'type', key: 't' },
    { id: 'sign', label: 'Sign', icon: 'signature', key: 's' },
    { id: 'image', label: 'Image', icon: 'image-plus', key: 'i' },
    { id: 'whiteout', label: 'Whiteout', icon: 'eraser', key: 'w' },
    { id: 'highlight', label: 'Highlight', icon: 'highlighter', key: 'h' },
    { id: 'rect', label: 'Rectangle', icon: 'square', key: 'r' },
    { id: 'ellipse', label: 'Ellipse', icon: 'circle', key: 'o' },
    { id: 'line', label: 'Line', icon: 'minus', key: 'l' },
    { id: 'draw', label: 'Draw', icon: 'pencil', key: 'd' },
    { id: 'check', label: 'Tick', icon: 'check', key: 'k' }
  ];

  var CSS = [
    '.pe{border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--surface);overflow:hidden;box-shadow:var(--shadow)}',
    '.pe-top{display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid var(--border);background:var(--surface)}',
    '.pe-tools{display:flex;align-items:center;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:thin}',
    '.pe-actions{display:flex;align-items:center;gap:6px;flex:none}',
    '@media (max-width:640px){.pe-top{flex-wrap:wrap}.pe-tools{flex-basis:100%;order:2}.pe-actions{width:100%;justify-content:flex-end}}',
    '.pe-tool{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:54px;height:52px;padding:4px 6px;border:1px solid transparent;border-radius:10px;background:transparent;color:var(--text-2);font:inherit;font-size:.72rem;font-weight:600;cursor:pointer;flex:none}',
    '.pe-tool .icon{width:20px;height:20px}',
    '.pe-tool:hover{background:var(--surface-2);color:var(--text)}',
    '.pe-tool[aria-pressed="true"]{background:var(--brand-soft);color:var(--brand);border-color:color-mix(in srgb,var(--brand) 35%,transparent)}',
    '.pe-sep{width:1px;align-self:stretch;background:var(--border);margin:4px 4px;flex:none}',
    '.pe-top .spacer{flex:1;min-width:8px}',
    '.pe-props{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;padding:8px 12px;border-bottom:1px solid var(--border);background:var(--surface-2);font-size:.85rem;min-height:50px}',
    '.pe-props label{display:inline-flex;align-items:center;gap:6px;color:var(--text-2);font-weight:600}',
    '.pe-props select,.pe-props input[type=number]{min-height:34px;padding:4px 8px;width:auto}',
    '.pe-props input[type=number]{width:70px}',
    '.pe-props input[type=range]{width:90px}',
    '.pe-props input[type=color]{width:34px;height:30px;padding:2px}',
    '.pe-sw{display:inline-flex;gap:4px}',
    '.pe-sw button{width:20px;height:20px;border-radius:50%;border:2px solid var(--surface);box-shadow:0 0 0 1px var(--border-strong);cursor:pointer;padding:0}',
    '.pe-sw button.on{box-shadow:0 0 0 2px var(--brand)}',
    '.pe-tog{min-width:34px;height:34px;border-radius:8px;border:1px solid var(--border-strong);background:var(--surface);font:inherit;font-weight:700;cursor:pointer;color:var(--text)}',
    '.pe-tog[aria-pressed="true"]{background:var(--text);color:var(--bg)}',
    '.pe-hint{color:var(--text-3);font-size:.82rem}',
    '.pe-body{display:flex;height:calc(100vh - 220px);min-height:520px;background:var(--bg-2)}',
    '.pe-side{width:150px;flex:none;overflow-y:auto;border-right:1px solid var(--border);padding:12px;display:none;background:var(--surface)}',
    '@media (min-width:900px){.pe-side{display:block}}',
    '.pe-side .thumb{margin-bottom:12px;padding:6px}',
    '.pe-side .thumb.current{border-color:var(--brand)}',
    '.pe-scroll{flex:1;min-width:0;overflow:auto;position:relative;scroll-behavior:smooth}',
    '.pe-pages{display:flex;flex-direction:column;align-items:center;gap:20px;padding:24px 16px 80px;min-width:min-content}',
    '.pe-page{position:relative;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.12),0 18px 40px -20px rgba(0,0,0,.35);flex:none}',
    '.pe-page canvas{position:absolute;inset:0;width:100%;height:100%;display:block}',
    '.pe-page .pe-num{position:absolute;left:50%;bottom:-19px;transform:translateX(-50%);font-size:.75rem;color:var(--text-3);font-weight:600}',
    '.pe-ov{position:absolute;inset:0;touch-action:pan-x pan-y}',
    '.pe[data-tool]:not([data-tool="select"]):not([data-tool="edittext"]) .pe-ov{cursor:crosshair;touch-action:none}',
    '.pe[data-tool="text"] .pe-ov{cursor:text}',
    '.pe-a{position:absolute;box-sizing:border-box;touch-action:none}',
    '.pe[data-tool="select"] .pe-a{cursor:move}',
    '.pe-a.text{white-space:pre;line-height:' + LINE_H + ';padding:0;min-width:4px;outline:none;border-radius:2px}',
    '.pe-a.text:empty::before{content:"Type here";opacity:.4}',
    '.pe-a.text[contenteditable="true"]{cursor:text;box-shadow:0 0 0 1px var(--brand);background:rgba(79,70,229,.04)}',
    '.pe-a img{width:100%;height:100%;display:block;pointer-events:none;user-select:none}',
    '.pe-a svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}',
    '.pe-a.path{inset:0;width:100%;height:100%;pointer-events:none}',
    '.pe-a.path svg path.hit{pointer-events:stroke;cursor:move}',
    '.pe-sel{position:absolute;border:1.5px solid var(--brand);pointer-events:none;border-radius:2px;z-index:5}',
    '.pe-h{position:absolute;width:12px;height:12px;background:#fff;border:2px solid var(--brand);border-radius:50%;pointer-events:auto;touch-action:none;margin:-6px 0 0 -6px}',
    '.pe-h[data-h="nw"],.pe-h[data-h="se"]{cursor:nwse-resize}.pe-h[data-h="ne"],.pe-h[data-h="sw"]{cursor:nesw-resize}',
    '.pe-selbar{position:absolute;display:flex;gap:4px;pointer-events:auto;transform:translateY(-100%);margin-top:-8px;z-index:6}',
    '.pe-selbar button{height:30px;min-width:30px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);display:grid;place-items:center;cursor:pointer;box-shadow:var(--shadow-sm)}',
    '.pe-selbar button .icon{width:15px;height:15px}',
    '.pe-tl{position:absolute;inset:0;pointer-events:none}',
    '.pe[data-tool="edittext"] .pe-tl{pointer-events:auto}',
    '.pe[data-tool="edittext"] .pe-ov{pointer-events:none}',
    '.pe[data-tool="edittext"] .pe-ov .pe-a:not(.path),.pe[data-tool="edittext"] .pe-ov .pe-sel{pointer-events:auto}',
    '.pe-ti{position:absolute;cursor:text;border-radius:2px}',
    '.pe[data-tool="edittext"] .pe-ti:hover{background:rgba(79,70,229,.12);box-shadow:0 0 0 1px rgba(79,70,229,.5)}',
    '.pe-ti.used{display:none}',
    '.pe-draft{position:absolute;border:1.5px dashed var(--brand);background:rgba(79,70,229,.06);pointer-events:none}',
    '.pe-zoom{display:inline-flex;align-items:center;gap:2px;flex:none}',
    '.pe-zoom span{min-width:46px;text-align:center;font-size:.8rem;font-weight:700;color:var(--text-2)}',
    '.pe-modal{position:fixed;inset:0;z-index:120;background:rgba(8,10,25,.55);display:grid;place-items:center;padding:16px;animation:fade .15s}',
    '.pe-dialog{background:var(--surface);border-radius:18px;box-shadow:var(--shadow-lg);width:min(560px,100%);padding:20px;max-height:92vh;overflow:auto}',
    '.pe-dialog h3{display:flex;justify-content:space-between;align-items:center}',
    '.pe-sigpad{width:100%;height:200px;border:1.5px dashed var(--border-strong);border-radius:12px;background:#fff;touch-action:none;cursor:crosshair;display:block}',
    '.pe-sigfonts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}',
    '.pe-sigfonts button{height:64px;border:1.5px solid var(--border);border-radius:10px;background:#fff;color:#111;font-size:26px;cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;padding:0 8px}',
    '.pe-sigfonts button.on{border-color:var(--brand);box-shadow:var(--ring)}',
    '.pe-saved{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}',
    '.pe-saved button{height:56px;padding:4px 10px;border:1px solid var(--border);border-radius:10px;background:#fff;cursor:pointer}',
    '.pe-saved img{height:100%}',
    '.pe-empty-hint{position:absolute;left:50%;top:12px;transform:translateX(-50%);background:var(--text);color:var(--bg);padding:6px 14px;border-radius:14px;font-size:.8rem;font-weight:600;pointer-events:none;z-index:4;width:max-content;max-width:calc(100% - 24px);text-align:center;box-shadow:var(--shadow);animation:fade .2s}',
    '@media (max-width:640px){.pe-body{height:calc(100vh - 190px);min-height:420px}.pe-pages{padding:16px 10px 60px}.pe-tool{min-width:52px}}'
  ].join('\n');

  var SIG_FONTS = [
    { name: 'Great Vibes', css: '"Great Vibes", "Brush Script MT", cursive' },
    { name: 'Dancing Script', css: '"Dancing Script", "Segoe Script", cursive' },
    { name: 'Allura', css: 'Allura, "Lucida Handwriting", cursive' },
    { name: 'Caveat', css: 'Caveat, "Comic Sans MS", cursive' }
  ];

  function injectCss() {
    if (document.getElementById('pe-css')) return;
    document.head.appendChild(BT.h('style', { id: 'pe-css', text: CSS }));
    document.head.appendChild(BT.h('link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Allura&family=Caveat:wght@500&family=Dancing+Script:wght@500&family=Great+Vibes&display=swap' }));
  }

  function hexToRgb01(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    var n = m ? parseInt(m[1], 16) : 0;
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join('');
  }
  var uid = (function () { var n = 0; return function () { return 'a' + (++n) + Math.random().toString(36).slice(2, 6); }; })();

  // ===================================================================
  function Editor(root, opts) {
    injectCss();
    var mode = opts.mode;
    var S = {
      fileName: '', bytes: null, pdf: null, pages: [], anns: [], images: {}, sel: null,
      tool: 'select', zoom: 1, undo: [], redo: [], dirty: false, signatures: [],
      defaults: {
        text: { size: 16, font: 'helv', bold: false, italic: false, color: '#000000' },
        shape: { stroke: '#e5484d', fill: '', sw: 2, opacity: 1 },
        highlight: { fill: '#facc15', opacity: 0.4 },
        line: { stroke: '#e5484d', sw: 2, opacity: 1 },
        draw: { stroke: '#1d4ed8', sw: 2.5, opacity: 1 },
        whiteout: { fill: '#ffffff' }
      }
    };
    var el = {};

    // ------------------------------------------------------------ start
    function showStart() {
      root.innerHTML = '';
      var dz = BT.dropzone({
        accept: '.pdf,application/pdf', title: mode === 'sign' ? 'Choose a PDF to sign' : 'Choose a PDF to edit',
        hint: 'or drag and drop it here', icon: mode === 'sign' ? 'signature' : 'file-pen-line', color: '#e5484d',
        onFiles: function (f) { load(f[0]); }
      });
      root.appendChild(dz);
      root.appendChild(BT.h('div.features', { style: { marginTop: '18px' }, html:
        feat('type', 'Edit and add text', 'Click any existing line to change it, or add new text anywhere.') +
        feat('signature', 'Sign documents', 'Draw, type or upload your signature and place it on the page.') +
        feat('highlighter', 'Annotate', 'Highlight, whiteout, draw, add shapes, ticks and images.') +
        feat('lock', '100% private', 'Your PDF is edited in your browser and never uploaded.')
      }));
    }
    function feat(i, t, d) {
      return '<div class="feature"><span class="fi">' + BT.icon(i) + '</span><h3>' + t + '</h3><p>' + d + '</p></div>';
    }

    function load(file) {
      root.innerHTML = '<div class="loading"><span class="spinner"></span> Opening ' + BT.esc(file.name) + '…</div>';
      S.fileName = file.name;
      BT.readFile(file).then(function (buf) {
        S.bytes = new Uint8Array(buf);
        return Promise.all([BT.openPdfjs(S.bytes), BT.loadLib('pdflib')]);
      }).then(function (r) {
        S.pdf = r[0];
        buildUi();
        var jobs = [];
        for (var i = 1; i <= S.pdf.numPages; i++) jobs.push(S.pdf.getPage(i));
        return Promise.all(jobs);
      }).then(function (pages) {
        S.pages = pages.map(function (p, i) { return { index: i, page: p, vp1: p.getViewport({ scale: 1 }) }; });
        fitWidth();
        buildPages();
        buildThumbs();
        if (mode === 'sign') setTimeout(function () { setTool('sign'); }, 300);
      }).catch(function (e) {
        console.error(e);
        root.innerHTML = '';
        root.appendChild(BT.h('div.notice.error', { html: BT.icon('info') + '<span>' + BT.esc(e && e.message && /password/i.test(e.message) ? 'This PDF is password protected. Please unlock it first.' : 'Could not open this PDF. It may be damaged or password protected.') + '</span>' }));
        root.appendChild(BT.h('button.btn', { style: { marginTop: '12px' }, onclick: showStart, text: 'Choose another file' }));
      });
    }

    // --------------------------------------------------------------- UI
    function buildUi() {
      root.innerHTML = '';
      var pe = BT.h('div.pe', { 'data-tool': 'select' });
      var top = BT.h('div.pe-top');
      var tb = BT.h('div.pe-tools', { role: 'toolbar', 'aria-label': 'Editing tools' });
      top.appendChild(tb);
      var visibleTools = mode === 'sign'
        ? ['select', 'sign', 'text', 'check', 'image', 'whiteout', 'draw']
        : TOOLS.map(function (t) { return t.id; });
      TOOLS.filter(function (t) { return visibleTools.indexOf(t.id) > -1; })
        .sort(function (a, b) { return visibleTools.indexOf(a.id) - visibleTools.indexOf(b.id); })
        .forEach(function (t) {
          tb.appendChild(BT.h('button.pe-tool', {
            type: 'button', 'data-t': t.id, 'aria-pressed': 'false', title: t.label + ' (' + t.key.toUpperCase() + ')',
            html: BT.icon(t.icon) + '<span>' + t.label + '</span>', onclick: function () { setTool(t.id); }
          }));
        });
      tb.appendChild(BT.h('span.pe-sep'));
      el.undoBtn = BT.h('button.pe-tool', { type: 'button', title: 'Undo (Ctrl+Z)', html: BT.icon('undo-2') + '<span>Undo</span>', onclick: undo });
      el.redoBtn = BT.h('button.pe-tool', { type: 'button', title: 'Redo (Ctrl+Y)', html: BT.icon('redo-2') + '<span>Redo</span>', onclick: redo });
      tb.appendChild(el.undoBtn);
      tb.appendChild(el.redoBtn);
      tb.appendChild(BT.h('span.pe-sep'));
      var zoom = BT.h('span.pe-zoom');
      zoom.appendChild(BT.h('button.icon-btn', { type: 'button', 'aria-label': 'Zoom out', html: BT.icon('zoom-out'), onclick: function () { setZoom(S.zoom / 1.2); } }));
      el.zoomLabel = BT.h('span', { text: '100%' });
      zoom.appendChild(el.zoomLabel);
      zoom.appendChild(BT.h('button.icon-btn', { type: 'button', 'aria-label': 'Zoom in', html: BT.icon('zoom-in'), onclick: function () { setZoom(S.zoom * 1.2); } }));
      tb.appendChild(zoom);
      var actions = BT.h('div.pe-actions');
      actions.appendChild(BT.h('button.btn.btn-ghost.btn-sm', { type: 'button', html: BT.icon('x') + ' Close', onclick: function () {
        if (S.dirty && !confirm('Discard your changes to this PDF?')) return;
        reset();
      } }));
      el.saveBtn = BT.h('button.btn.btn-primary', { type: 'button', html: BT.icon('download') + ' Apply &amp; download', onclick: function () { BT.busy(el.saveBtn, save, 'Saving…'); } });
      actions.appendChild(el.saveBtn);
      top.appendChild(actions);

      el.props = BT.h('div.pe-props');
      var body = BT.h('div.pe-body');
      el.side = BT.h('aside.pe-side', { 'aria-label': 'Pages' });
      el.scroll = BT.h('div.pe-scroll');
      el.pagesWrap = BT.h('div.pe-pages');
      el.scroll.appendChild(el.pagesWrap);
      body.appendChild(el.side);
      body.appendChild(el.scroll);
      pe.appendChild(top);
      pe.appendChild(el.props);
      pe.appendChild(body);
      root.appendChild(pe);
      el.pe = pe;
      el.top = top;

      el.fileInput = BT.h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', style: { display: 'none' } });
      el.fileInput.addEventListener('change', function () {
        var f = el.fileInput.files[0];
        el.fileInput.value = '';
        if (f) addImageFile(f);
      });
      root.appendChild(el.fileInput);

      document.addEventListener('keydown', onKey);
      window.addEventListener('beforeunload', onUnload);
      el.scroll.addEventListener('scroll', BT.debounce(updateCurrentPage, 80));
      if (window.ResizeObserver) {
        var lastW = 0;
        S.ro = new ResizeObserver(BT.debounce(function () {
          var w = el.scroll.clientWidth;
          if (S.autoFit && S.pages.length && Math.abs(w - lastW) > 4) { lastW = w; fitWidth(); applyZoom(); }
        }, 120));
        S.ro.observe(el.scroll);
      }
      updateUndo();
      setTool('select');
    }

    function reset() {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('beforeunload', onUnload);
      if (S.io) S.io.disconnect();
      if (S.ro) S.ro.disconnect();
      if (S.pdf) S.pdf.destroy();
      S.pdf = null; S.pages = []; S.anns = []; S.images = {}; S.sel = null; S.undo = []; S.redo = []; S.dirty = false;
      showStart();
    }
    function onUnload(e) { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } }

    // ------------------------------------------------------------ pages
    function fitWidth() {
      var cw = el.scroll.clientWidth || root.clientWidth || 800;
      var avail = cw - (cw < 500 ? 20 : 48);
      var maxW = 0;
      S.pages.forEach(function (p) { maxW = Math.max(maxW, p.vp1.width); });
      S.zoom = Math.max(0.3, Math.min(2, avail / (maxW || 600)));
      S.autoFit = true;
    }

    function buildPages() {
      el.pagesWrap.innerHTML = '';
      if (S.io) S.io.disconnect();
      S.io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var p = S.pages[+en.target.getAttribute('data-i')];
          p.visible = en.isIntersecting;
          if (en.isIntersecting) renderPage(p);
        });
      }, { root: el.scroll, rootMargin: '800px 0px' });
      S.pages.forEach(function (p) {
        var wrap = BT.h('div.pe-page', { 'data-i': p.index });
        var canvas = BT.h('canvas');
        var tl = BT.h('div.pe-tl');
        var ov = BT.h('div.pe-ov', { 'data-i': p.index });
        wrap.appendChild(canvas);
        wrap.appendChild(tl);
        wrap.appendChild(ov);
        wrap.appendChild(BT.h('span.pe-num', { text: 'Page ' + (p.index + 1) + ' of ' + S.pages.length }));
        el.pagesWrap.appendChild(wrap);
        p.wrap = wrap; p.canvas = canvas; p.ov = ov; p.tl = tl; p.renderedZoom = 0;
        ov.addEventListener('pointerdown', function (e) { onPagePointerDown(e, p); });
        S.io.observe(wrap);
      });
      applyZoom();
    }

    function applyZoom() {
      el.zoomLabel.textContent = Math.round(S.zoom * 100) + '%';
      S.pages.forEach(function (p) {
        p.wrap.style.width = Math.floor(p.vp1.width * S.zoom) + 'px';
        p.wrap.style.height = Math.floor(p.vp1.height * S.zoom) + 'px';
        if (p.visible) renderPage(p);
        if (p.textItems) layoutTextLayer(p);
      });
      S.anns.forEach(layoutAnn);
      drawSelection();
    }

    function setZoom(z) {
      var sc = el.scroll, ratio = sc.scrollTop / (sc.scrollHeight || 1);
      S.zoom = Math.max(0.25, Math.min(4, z));
      S.autoFit = false;
      applyZoom();
      sc.scrollTop = ratio * sc.scrollHeight;
    }

    var renderQueue = Promise.resolve();
    function renderPage(p) {
      if (p.renderedZoom === S.zoom || p.rendering === S.zoom) return;
      p.rendering = S.zoom;
      renderQueue = renderQueue.then(function () {
        if (!p.visible && p.renderedZoom) return;
        var z = S.zoom, dpr = Math.min(window.devicePixelRatio || 1, 2);
        return BT.renderPdfPage(p.page, z * dpr).then(function (r) {
          var ctx = p.canvas.getContext('2d');
          p.canvas.width = r.canvas.width;
          p.canvas.height = r.canvas.height;
          ctx.drawImage(r.canvas, 0, 0);
          p.renderedZoom = z;
          p.rendering = 0;
          if (S.tool === 'edittext') loadTextLayer(p);
        });
      }).catch(function (e) { console.error(e); p.rendering = 0; });
    }

    function buildThumbs() {
      el.side.innerHTML = '';
      S.pages.forEach(function (p) {
        var t = BT.h('div.thumb', { tabindex: 0, role: 'button', 'aria-label': 'Go to page ' + (p.index + 1) });
        t.appendChild(BT.h('div.pg', { text: String(p.index + 1) }));
        t.addEventListener('click', function () { el.scroll.scrollTop = p.wrap.offsetTop - 16; });
        t.addEventListener('keydown', function (e) { if (e.key === 'Enter') t.click(); });
        el.side.appendChild(t);
        p.thumb = t;
      });
      // render thumbnails sequentially in the background
      var i = 0;
      (function next() {
        if (i >= S.pages.length || !S.pdf) return;
        var p = S.pages[i++];
        BT.renderPdfThumb(S.pdf, p.index + 1, 120).then(function (c) {
          p.thumb.insertBefore(c, p.thumb.firstChild);
          setTimeout(next, 30);
        }).catch(function () {});
      })();
      updateCurrentPage();
    }

    function updateCurrentPage() {
      var top = el.scroll.scrollTop + el.scroll.clientHeight / 3, cur = 0;
      S.pages.forEach(function (p) { if (p.wrap.offsetTop <= top) cur = p.index; });
      S.currentPage = cur;
      S.pages.forEach(function (p) { if (p.thumb) p.thumb.classList.toggle('current', p.index === cur); });
    }

    // -------------------------------------------------------- text layer
    function loadTextLayer(p) {
      if (p.textItems) { layoutTextLayer(p); return; }
      if (p.loadingText) return;
      p.loadingText = true;
      p.page.getTextContent().then(function (tc) {
        p.textStyles = tc.styles;
        p.textItems = tc.items.filter(function (it) { return it.str && it.str.trim(); });
        layoutTextLayer(p);
      }).catch(function () { p.textItems = []; });
    }

    function layoutTextLayer(p) {
      var pdfjsLib = window.pdfjsLib;
      p.tl.innerHTML = '';
      if (S.tool !== 'edittext') return;
      var vp = p.vp1;
      p.textItems.forEach(function (it, idx) {
        var tx = pdfjsLib.Util.transform(vp.transform, it.transform);
        var fh = Math.hypot(tx[2], tx[3]);
        var angle = Math.atan2(tx[1], tx[0]);
        if (Math.abs(angle) > 0.01 || fh < 2) return; // skip rotated / tiny text
        var w = it.width || fh * 0.5 * it.str.length;
        var box = { x: tx[4], y: tx[5] - fh * 0.92, w: w, h: fh * 1.18, fh: fh };
        var d = BT.h('div.pe-ti' + (it.used ? '.used' : ''), { title: 'Click to edit this text' });
        d.style.left = box.x * S.zoom + 'px';
        d.style.top = box.y * S.zoom + 'px';
        d.style.width = box.w * S.zoom + 'px';
        d.style.height = box.h * S.zoom + 'px';
        d.addEventListener('pointerdown', function (e) {
          e.preventDefault();
          e.stopPropagation();
          editExistingText(p, it, box, d);
        });
        p.tl.appendChild(d);
        it._idx = idx;
      });
    }

    /** Sample the rendered canvas: background colour (lightest) and ink colour (darkest). */
    function sampleColors(p, box) {
      try {
        var c = p.canvas, sx = c.width / (p.vp1.width), sy = c.height / (p.vp1.height);
        var x = Math.max(0, Math.floor(box.x * sx)), y = Math.max(0, Math.floor(box.y * sy));
        var w = Math.min(c.width - x, Math.ceil(box.w * sx)), h = Math.min(c.height - y, Math.ceil(box.h * sy));
        if (w < 1 || h < 1) return null;
        var data = c.getContext('2d').getImageData(x, y, w, h).data;
        var best = 999, ink = [0, 0, 0], light = -1, bg = [255, 255, 255];
        for (var i = 0; i < data.length; i += 16) {
          var l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (l < best) { best = l; ink = [data[i], data[i + 1], data[i + 2]]; }
          if (l > light) { light = l; bg = [data[i], data[i + 1], data[i + 2]]; }
        }
        return { ink: rgbToHex(ink[0], ink[1], ink[2]), bg: rgbToHex(bg[0], bg[1], bg[2]) };
      } catch (e) { return null; }
    }

    function editExistingText(p, it, box, node) {
      var style = (p.textStyles && p.textStyles[it.fontName]) || {};
      var fam = (style.fontFamily || '') + ' ' + (it.fontName || '');
      var font = /mono|courier/i.test(fam) ? 'cour' : /serif|times|roman|georgia|garamond|cambria/i.test(fam) && !/sans/i.test(fam) ? 'times' : 'helv';
      var bold = /bold|black|heavy|semibold/i.test(it.fontName || '') || /bold/i.test(style.fontFamily || '');
      var colors = sampleColors(p, box) || { ink: '#000000', bg: '#ffffff' };
      pushUndo();
      var pad = Math.max(1, box.fh * 0.08);
      var wo = { id: uid(), page: p.index, type: 'whiteout', x: box.x - pad, y: box.y - pad, w: box.w + pad * 2, h: box.h + pad * 2, fill: colors.bg };
      var size = Math.round(box.fh * 10) / 10;
      var tx = { id: uid(), page: p.index, type: 'text', text: it.str, size: size, font: font, bold: bold, italic: /italic|oblique/i.test(it.fontName || ''),
        color: colors.ink, x: box.x, y: box.y + box.fh * 0.92 - size * FONTS[font].base, linked: wo.id };
      S.anns.push(wo, tx);
      it.used = true;
      node.classList.add('used');
      renderAnn(wo);
      renderAnn(tx);
      markDirty();
      setTool('select', true);
      select(tx.id);
      startEditing(tx, true);
    }

    // ------------------------------------------------------------ tools
    function setTool(id, silent) {
      if (id === 'image') { el.fileInput.click(); return; }
      if (id === 'sign') { openSignature(); return; }
      S.tool = id;
      el.pe.setAttribute('data-tool', id);
      BT.$$('.pe-tool[data-t]', el.top).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-t') === id ? 'true' : 'false'); });
      if (id !== 'select') select(null);
      S.pages.forEach(function (p) {
        if (id === 'edittext') { if (p.renderedZoom) loadTextLayer(p); }
        else p.tl.innerHTML = '';
      });
      renderProps();
      if (!silent) hint();
    }

    var HINTS = {
      select: 'Click an item to select it. Drag to move, use the handles to resize, and press Delete to remove.',
      edittext: 'Click any line of text in the PDF to replace it.',
      text: 'Click anywhere on a page to add text.',
      whiteout: 'Drag over an area to cover it with a white box.',
      highlight: 'Drag over text to highlight it.',
      rect: 'Drag to draw a rectangle.', ellipse: 'Drag to draw an ellipse.', line: 'Drag to draw a line.',
      draw: 'Draw freehand on the page.', check: 'Click to place a tick mark.'
    };
    function hint() {
      if (S.hintEl) S.hintEl.remove();
      var h = HINTS[S.tool];
      if (!h) return;
      S.hintEl = BT.h('div.pe-empty-hint', { text: h });
      el.scroll.parentNode.style.position = 'relative';
      el.scroll.parentNode.appendChild(S.hintEl);
      var node = S.hintEl;
      setTimeout(function () { node.remove(); }, 3500);
    }

    // -------------------------------------------------------- properties
    function currentKind() {
      var a = selected();
      var t = a ? a.type : S.tool;
      if (t === 'text' || t === 'edittext' || t === 'check') return 'text';
      if (t === 'rect' || t === 'ellipse') return 'shape';
      if (t === 'line') return 'line';
      if (t === 'draw') return 'draw';
      if (t === 'highlight') return 'highlight';
      if (t === 'whiteout') return 'whiteout';
      if (t === 'image') return 'image';
      return null;
    }

    function propTarget(kind) {
      var a = selected();
      return a || S.defaults[kind];
    }

    function renderProps() {
      var kind = currentKind();
      var p = el.props;
      p.innerHTML = '';
      if (!kind || kind === 'image') {
        p.appendChild(BT.h('span.pe-hint', { html: BT.icon('info') + ' ' + (kind === 'image' ? 'Drag the corners to resize. Hold Shift to keep proportions free.' : (HINTS[S.tool] || '')) }));
        return;
      }
      var t = propTarget(kind);
      function onChange(key, val, isFinal) {
        var a = selected();
        if (a && isFinal !== false) pushUndo();
        if (a) { a[key] = val; layoutAnn(a); drawSelection(); markDirty(); }
        S.defaults[kind][key] = val;
      }
      if (kind === 'text') {
        var fontSel = BT.h('select', { 'aria-label': 'Font' });
        Object.keys(FONTS).forEach(function (k) { fontSel.appendChild(BT.h('option', { value: k, text: FONTS[k].label, selected: t.font === k })); });
        fontSel.addEventListener('change', function () { onChange('font', fontSel.value); });
        p.appendChild(fontSel);
        var size = BT.h('input', { type: 'number', min: 4, max: 200, step: 1, value: t.size, 'aria-label': 'Font size' });
        size.addEventListener('change', function () { var v = BT.num(size.value); if (v >= 4 && v <= 400) onChange('size', v); });
        p.appendChild(BT.h('label', {}, ['Size', size]));
        ['bold', 'italic'].forEach(function (k) {
          var b = BT.h('button.pe-tog', { type: 'button', 'aria-pressed': t[k] ? 'true' : 'false', 'aria-label': k, html: k === 'bold' ? 'B' : '<i>I</i>' });
          b.addEventListener('click', function () { var v = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', v); onChange(k, v); });
          p.appendChild(b);
        });
        p.appendChild(colorPicker('Colour', t.color, function (v, fin) { onChange('color', v, fin); }));
      } else if (kind === 'shape') {
        p.appendChild(colorPicker('Border', t.stroke, function (v, fin) { onChange('stroke', v, fin); }));
        var fillOn = BT.h('input', { type: 'checkbox', checked: !!t.fill });
        var fillCol = BT.h('input', { type: 'color', value: t.fill || '#facc15', 'aria-label': 'Fill colour' });
        fillOn.addEventListener('change', function () { onChange('fill', fillOn.checked ? fillCol.value : ''); });
        fillCol.addEventListener('input', function () { fillOn.checked = true; onChange('fill', fillCol.value, false); });
        fillCol.addEventListener('change', function () { onChange('fill', fillCol.value); });
        p.appendChild(BT.h('label', {}, [fillOn, 'Fill', fillCol]));
        p.appendChild(rangeCtl('Width', t.sw, 0, 12, 0.5, function (v, fin) { onChange('sw', v, fin); }));
        p.appendChild(rangeCtl('Opacity', t.opacity, 0.1, 1, 0.05, function (v, fin) { onChange('opacity', v, fin); }));
      } else if (kind === 'line' || kind === 'draw') {
        p.appendChild(colorPicker('Colour', t.stroke, function (v, fin) { onChange('stroke', v, fin); }));
        p.appendChild(rangeCtl('Width', t.sw, 0.5, 16, 0.5, function (v, fin) { onChange('sw', v, fin); }));
        p.appendChild(rangeCtl('Opacity', t.opacity, 0.1, 1, 0.05, function (v, fin) { onChange('opacity', v, fin); }));
      } else if (kind === 'highlight') {
        p.appendChild(colorPicker('Colour', t.fill, function (v, fin) { onChange('fill', v, fin); }, ['#facc15', '#4ade80', '#60a5fa', '#f472b6', '#fb923c']));
        p.appendChild(rangeCtl('Opacity', t.opacity, 0.1, 0.8, 0.05, function (v, fin) { onChange('opacity', v, fin); }));
      } else if (kind === 'whiteout') {
        p.appendChild(colorPicker('Fill', t.fill, function (v, fin) { onChange('fill', v, fin); }, ['#ffffff', '#f8fafc', '#fef9c3', '#000000']));
        p.appendChild(BT.h('span.pe-hint', { text: 'Whiteout covers content visually. It does not delete the text underneath.' }));
      }
    }

    function colorPicker(label, value, cb, list) {
      var wrap = BT.h('label', {}, [label]);
      var sw = BT.h('span.pe-sw');
      var input = BT.h('input', { type: 'color', value: value || '#000000', 'aria-label': label + ' colour' });
      (list || SWATCHES.slice(0, 8)).forEach(function (c) {
        var b = BT.h('button', { type: 'button', title: c, 'aria-label': 'Colour ' + c, style: { background: c } });
        if ((value || '').toLowerCase() === c) b.classList.add('on');
        b.addEventListener('click', function (e) {
          e.preventDefault();
          BT.$$('button', sw).forEach(function (x) { x.classList.toggle('on', x === b); });
          input.value = c;
          cb(c, true);
        });
        sw.appendChild(b);
      });
      input.addEventListener('input', function () { cb(input.value, false); });
      input.addEventListener('change', function () { cb(input.value, true); });
      wrap.appendChild(sw);
      wrap.appendChild(input);
      return wrap;
    }
    function rangeCtl(label, value, min, max, step, cb) {
      var r = BT.h('input', { type: 'range', min: min, max: max, step: step, value: value, 'aria-label': label });
      var first = true;
      r.addEventListener('input', function () { cb(+r.value, first); first = false; });
      r.addEventListener('change', function () { first = true; });
      return BT.h('label', {}, [label, r]);
    }

    // ------------------------------------------------------- annotations
    function selected() { return S.sel ? findAnn(S.sel) : null; }
    function findAnn(id) { for (var i = 0; i < S.anns.length; i++) if (S.anns[i].id === id) return S.anns[i]; return null; }
    function pageOf(a) { return S.pages[a.page]; }

    function bbox(a) {
      if (a.pts) {
        var xs = a.pts.map(function (p) { return p[0]; }), ys = a.pts.map(function (p) { return p[1]; });
        var pad = (a.sw || 2) / 2 + 2;
        var x0 = Math.min.apply(null, xs), y0 = Math.min.apply(null, ys);
        return { x: x0 - pad, y: y0 - pad, w: Math.max.apply(null, xs) - x0 + pad * 2, h: Math.max.apply(null, ys) - y0 + pad * 2 };
      }
      if (a.type === 'text') {
        var n = a.node;
        var w = n ? n.offsetWidth / S.zoom : 40, h = n ? n.offsetHeight / S.zoom : a.size * LINE_H;
        return { x: a.x, y: a.y, w: w, h: h };
      }
      return { x: a.x, y: a.y, w: a.w, h: a.h };
    }

    function renderAnn(a) {
      if (a.node) a.node.remove();
      var p = pageOf(a);
      var n;
      if (a.type === 'text') {
        n = BT.h('div.pe-a.text', { 'data-id': a.id, spellcheck: false });
        n.textContent = a.text;
        n.addEventListener('dblclick', function () { if (S.tool === 'select') startEditing(a); });
        n.addEventListener('blur', function () { stopEditing(a); });
        n.addEventListener('input', function () { a.text = n.innerText.replace(/\n$/, ''); drawSelection(); markDirty(); });
        n.addEventListener('paste', function (e) {
          e.preventDefault();
          var t = (e.clipboardData || window.clipboardData).getData('text');
          document.execCommand('insertText', false, t);
        });
      } else if (a.type === 'image') {
        n = BT.h('div.pe-a', { 'data-id': a.id });
        n.appendChild(BT.h('img', { src: S.images[a.imgId].url, alt: '', draggable: false }));
      } else if (a.type === 'line' || a.type === 'draw') {
        n = BT.h('div.pe-a.path', { 'data-id': a.id });
        n.innerHTML = '<svg><path class="vis" fill="none" stroke-linecap="round" stroke-linejoin="round"></path><path class="hit" fill="none" stroke="transparent" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
      } else {
        n = BT.h('div.pe-a', { 'data-id': a.id });
        if (a.type === 'rect' || a.type === 'ellipse') {
          n.innerHTML = '<svg>' + (a.type === 'rect' ? '<rect x="0" y="0" width="100%" height="100%"></rect>' : '<ellipse cx="50%" cy="50%" rx="50%" ry="50%"></ellipse>') + '</svg>';
        }
      }
      n.addEventListener('pointerdown', function (e) { onAnnPointerDown(e, a); });
      a.node = n;
      p.ov.appendChild(n);
      layoutAnn(a);
    }

    function layoutAnn(a) {
      var n = a.node, z = S.zoom;
      if (!n) return;
      if (a.type === 'text') {
        var f = FONTS[a.font] || FONTS.helv;
        n.style.left = a.x * z + 'px';
        n.style.top = a.y * z + 'px';
        n.style.fontFamily = f.css;
        n.style.fontSize = a.size * z + 'px';
        n.style.fontWeight = a.bold ? '700' : '400';
        n.style.fontStyle = a.italic ? 'italic' : 'normal';
        n.style.color = a.color;
        return;
      }
      if (a.type === 'line' || a.type === 'draw') {
        var d = a.pts.map(function (pt, i) { return (i ? 'L' : 'M') + (pt[0] * z).toFixed(1) + ' ' + (pt[1] * z).toFixed(1); }).join(' ');
        var vis = n.querySelector('path.vis'), hit = n.querySelector('path.hit');
        vis.setAttribute('d', d);
        vis.setAttribute('stroke', a.stroke);
        vis.setAttribute('stroke-width', a.sw * z);
        vis.setAttribute('stroke-opacity', a.opacity);
        hit.setAttribute('d', d);
        hit.setAttribute('stroke-width', Math.max(14, a.sw * z + 10));
        return;
      }
      n.style.left = a.x * z + 'px';
      n.style.top = a.y * z + 'px';
      n.style.width = a.w * z + 'px';
      n.style.height = a.h * z + 'px';
      if (a.type === 'whiteout') { n.style.background = a.fill; }
      else if (a.type === 'highlight') { n.style.background = a.fill; n.style.opacity = a.opacity; n.style.mixBlendMode = 'multiply'; }
      else if (a.type === 'image') { n.style.opacity = a.opacity == null ? 1 : a.opacity; }
      else if (a.type === 'rect' || a.type === 'ellipse') {
        var s = n.querySelector('rect,ellipse');
        s.setAttribute('fill', a.fill || 'none');
        s.setAttribute('stroke', a.sw > 0 ? a.stroke : 'none');
        s.setAttribute('stroke-width', a.sw * z);
        n.style.opacity = a.opacity;
      }
    }

    function select(id) {
      if (S.sel && S.sel !== id) {
        var prev = findAnn(S.sel);
        if (prev && prev.type === 'text' && prev.node && prev.node.isContentEditable) prev.node.blur();
      }
      S.sel = id;
      drawSelection();
      renderProps();
    }

    function drawSelection() {
      if (S.selEl) { S.selEl.remove(); S.selEl = null; }
      var a = selected();
      if (!a || !a.node) return;
      var b = bbox(a), z = S.zoom;
      var box = BT.h('div.pe-sel');
      box.style.left = b.x * z - 3 + 'px';
      box.style.top = b.y * z - 3 + 'px';
      box.style.width = b.w * z + 6 + 'px';
      box.style.height = b.h * z + 6 + 'px';
      if (a.type !== 'text') {
        ['nw', 'ne', 'sw', 'se'].forEach(function (h) {
          var hd = BT.h('span.pe-h', { 'data-h': h });
          hd.style.left = (h[1] === 'w' ? 0 : 100) + '%';
          hd.style.top = (h[0] === 'n' ? 0 : 100) + '%';
          hd.addEventListener('pointerdown', function (e) { onResizeDown(e, a, h); });
          box.appendChild(hd);
        });
      }
      var bar = BT.h('div.pe-selbar');
      if (a.type === 'text') bar.appendChild(BT.h('button', { type: 'button', title: 'Edit text', 'aria-label': 'Edit text', html: BT.icon('pencil'), onclick: function () { startEditing(a); } }));
      bar.appendChild(BT.h('button', { type: 'button', title: 'Duplicate (Ctrl+D)', 'aria-label': 'Duplicate', html: BT.icon('copy'), onclick: function () { duplicate(a); } }));
      bar.appendChild(BT.h('button', { type: 'button', title: 'Delete (Del)', 'aria-label': 'Delete', html: BT.icon('trash-2'), onclick: function () { removeAnn(a, true); } }));
      box.appendChild(bar);
      pageOf(a).ov.appendChild(box);
      S.selEl = box;
    }

    function startEditing(a, selectAll) {
      var n = a.node;
      n.contentEditable = 'true';
      n.focus();
      var range = document.createRange();
      range.selectNodeContents(n);
      if (!selectAll) range.collapse(false);
      var s = window.getSelection();
      s.removeAllRanges();
      s.addRange(range);
      S.editing = a.id;
    }
    function stopEditing(a) {
      if (!a.node) return;
      a.node.contentEditable = 'false';
      if (S.editing === a.id) S.editing = null;
      a.text = a.node.innerText.replace(/\n$/, '');
      if (!a.text.trim()) removeAnn(a, false);
      drawSelection();
    }

    function removeAnn(a, undoable) {
      if (undoable) pushUndo();
      S.anns = S.anns.filter(function (x) { return x !== a; });
      if (a.node) a.node.remove();
      a.node = null;
      if (S.sel === a.id) select(null);
      markDirty();
    }

    function duplicate(a) {
      pushUndo();
      var c = JSON.parse(JSON.stringify(strip(a)));
      c.id = uid();
      delete c.linked;
      var off = 12;
      if (c.pts) c.pts = c.pts.map(function (p) { return [p[0] + off, p[1] + off]; });
      else { c.x += off; c.y += off; }
      S.anns.push(c);
      renderAnn(c);
      select(c.id);
      markDirty();
    }

    function strip(a) {
      var o = {};
      Object.keys(a).forEach(function (k) { if (k !== 'node') o[k] = a[k]; });
      return o;
    }

    // ------------------------------------------------------- undo / redo
    function snapshot() { return JSON.stringify(S.anns.map(strip)); }
    function pushUndo() {
      S.undo.push(snapshot());
      if (S.undo.length > 100) S.undo.shift();
      S.redo = [];
      updateUndo();
    }
    function restore(json) {
      S.anns.forEach(function (a) { if (a.node) a.node.remove(); });
      S.anns = JSON.parse(json);
      S.anns.forEach(renderAnn);
      select(null);
      markDirty();
    }
    function undo() { if (!S.undo.length) return; S.redo.push(snapshot()); restore(S.undo.pop()); updateUndo(); }
    function redo() { if (!S.redo.length) return; S.undo.push(snapshot()); restore(S.redo.pop()); updateUndo(); }
    function updateUndo() {
      if (el.undoBtn) el.undoBtn.disabled = !S.undo.length;
      if (el.redoBtn) el.redoBtn.disabled = !S.redo.length;
    }
    function markDirty() { S.dirty = S.anns.length > 0; }

    // ---------------------------------------------------------- pointer
    function viewPoint(e, p) {
      var r = p.ov.getBoundingClientRect();
      return [(e.clientX - r.left) / S.zoom, (e.clientY - r.top) / S.zoom];
    }

    function onPagePointerDown(e, p) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target !== p.ov) return;
      var tool = S.tool;
      var pt = viewPoint(e, p);
      if (tool === 'select' || tool === 'edittext') { select(null); return; }
      e.preventDefault();
      if (tool === 'text' || tool === 'check') {
        pushUndo();
        var d = S.defaults.text;
        var a = { id: uid(), page: p.index, type: 'text', text: tool === 'check' ? '✓' : '', size: tool === 'check' ? Math.max(d.size, 18) : d.size,
          font: tool === 'check' ? 'helv' : d.font, bold: tool === 'check' ? true : d.bold, italic: d.italic, color: tool === 'check' ? (d.color === '#000000' ? '#12a594' : d.color) : d.color,
          x: pt[0], y: pt[1] - d.size * 0.6 };
        S.anns.push(a);
        renderAnn(a);
        setTool('select', true);
        select(a.id);
        if (tool === 'text') startEditing(a);
        markDirty();
        return;
      }
      // drag-to-create tools
      var start = pt, draft = null, pts = [pt];
      p.ov.setPointerCapture(e.pointerId);
      if (tool === 'draw') {
        var dd = S.defaults.draw;
        draft = { id: uid(), page: p.index, type: 'draw', pts: pts, stroke: dd.stroke, sw: dd.sw, opacity: dd.opacity };
        renderAnn(draft);
      } else if (tool === 'line') {
        var ld = S.defaults.line;
        draft = { id: uid(), page: p.index, type: 'line', pts: [start, start], stroke: ld.stroke, sw: ld.sw, opacity: ld.opacity };
        renderAnn(draft);
      } else {
        draft = BT.h('div.pe-draft');
        p.ov.appendChild(draft);
      }
      function move(ev) {
        var q = viewPoint(ev, p);
        q = [Math.max(0, Math.min(p.vp1.width, q[0])), Math.max(0, Math.min(p.vp1.height, q[1]))];
        if (tool === 'draw') {
          var last = pts[pts.length - 1];
          if (Math.hypot(q[0] - last[0], q[1] - last[1]) > 1.2 / S.zoom) { pts.push(q); layoutAnn(draft); }
        } else if (tool === 'line') {
          if (ev.shiftKey) { // snap to 45°
            var dx = q[0] - start[0], dy = q[1] - start[1], ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4), len = Math.hypot(dx, dy);
            q = [start[0] + Math.cos(ang) * len, start[1] + Math.sin(ang) * len];
          }
          draft.pts = [start, q];
          layoutAnn(draft);
        } else {
          var x = Math.min(start[0], q[0]), y = Math.min(start[1], q[1]);
          var w = Math.abs(q[0] - start[0]), h = Math.abs(q[1] - start[1]);
          if (ev.shiftKey && (tool === 'rect' || tool === 'ellipse')) { w = h = Math.max(w, h); }
          draft.style.left = x * S.zoom + 'px'; draft.style.top = y * S.zoom + 'px';
          draft.style.width = w * S.zoom + 'px'; draft.style.height = h * S.zoom + 'px';
          draft._r = { x: x, y: y, w: w, h: h };
        }
      }
      function up() {
        p.ov.removeEventListener('pointermove', move);
        p.ov.removeEventListener('pointerup', up);
        p.ov.removeEventListener('pointercancel', up);
        if (tool === 'draw' || tool === 'line') {
          var b = bbox(draft);
          if (pts.length < 2 && tool === 'draw') { draft.node.remove(); return; }
          if (tool === 'line' && b.w < 6 && b.h < 6) { draft.node.remove(); return; }
          S.undo.push(snapshot()); S.redo = []; updateUndo();
          S.anns.push(draft);
          markDirty();
          if (tool === 'line') { setTool('select', true); select(draft.id); }
          return;
        }
        var r = draft._r;
        draft.remove();
        if (!r || r.w < 4 || r.h < 4) {
          if (tool === 'highlight' || tool === 'whiteout') BT.toast('Drag to draw an area');
          return;
        }
        pushUndo();
        var a = { id: uid(), page: p.index, type: tool, x: r.x, y: r.y, w: r.w, h: r.h };
        if (tool === 'rect' || tool === 'ellipse') Object.assign(a, JSON.parse(JSON.stringify(S.defaults.shape)));
        else if (tool === 'highlight') Object.assign(a, S.defaults.highlight);
        else if (tool === 'whiteout') Object.assign(a, S.defaults.whiteout);
        S.anns.push(a);
        renderAnn(a);
        markDirty();
        if (tool === 'rect' || tool === 'ellipse') { setTool('select', true); select(a.id); }
      }
      p.ov.addEventListener('pointermove', move);
      p.ov.addEventListener('pointerup', up);
      p.ov.addEventListener('pointercancel', up);
    }

    function onAnnPointerDown(e, a) {
      if (S.tool !== 'select') {
        if (S.tool === 'edittext' || S.tool === 'text') { setTool('select', true); } else return;
      }
      if (S.editing === a.id) return; // let the caret move inside editable text
      e.preventDefault();
      e.stopPropagation();
      if (S.sel !== a.id) select(a.id);
      var p = pageOf(a), start = viewPoint(e, p), orig = JSON.parse(JSON.stringify(strip(a))), moved = false;
      var target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      function move(ev) {
        var q = viewPoint(ev, p), dx = q[0] - start[0], dy = q[1] - start[1];
        if (!moved && Math.hypot(dx, dy) < 2 / S.zoom) return;
        if (!moved) { S.undo.push(JSON.stringify(S.anns.map(function (x) { return x === a ? orig : strip(x); }))); S.redo = []; updateUndo(); }
        moved = true;
        if (a.pts) a.pts = orig.pts.map(function (pt) { return [pt[0] + dx, pt[1] + dy]; });
        else { a.x = orig.x + dx; a.y = orig.y + dy; }
        layoutAnn(a);
        drawSelection();
      }
      function up() {
        target.removeEventListener('pointermove', move);
        target.removeEventListener('pointerup', up);
        target.removeEventListener('pointercancel', up);
        if (moved) markDirty();
      }
      target.addEventListener('pointermove', move);
      target.addEventListener('pointerup', up);
      target.addEventListener('pointercancel', up);
    }

    function onResizeDown(e, a, h) {
      e.preventDefault();
      e.stopPropagation();
      var p = pageOf(a), start = viewPoint(e, p), orig = JSON.parse(JSON.stringify(strip(a))), b0 = bbox(orig);
      var keepRatio = a.type === 'image';
      var target = e.currentTarget, moved = false;
      target.setPointerCapture(e.pointerId);
      function move(ev) {
        var q = viewPoint(ev, p), dx = q[0] - start[0], dy = q[1] - start[1];
        if (!moved) { S.undo.push(JSON.stringify(S.anns.map(function (x) { return x === a ? orig : strip(x); }))); S.redo = []; updateUndo(); moved = true; }
        var x = b0.x, y = b0.y, w = b0.w, hgt = b0.h;
        if (h[1] === 'e') w = b0.w + dx; else { w = b0.w - dx; x = b0.x + dx; }
        if (h[0] === 's') hgt = b0.h + dy; else { hgt = b0.h - dy; y = b0.y + dy; }
        if (keepRatio && !ev.shiftKey) {
          var ratio = b0.w / b0.h;
          if (Math.abs(w / b0.w) > Math.abs(hgt / b0.h)) hgt = w / ratio; else w = hgt * ratio;
          if (h[1] === 'w') x = b0.x + b0.w - w;
          if (h[0] === 'n') y = b0.y + b0.h - hgt;
        }
        if (w < 6 || hgt < 6) return;
        if (a.pts) {
          a.pts = orig.pts.map(function (pt) { return [x + (pt[0] - b0.x) * w / b0.w, y + (pt[1] - b0.y) * hgt / b0.h]; });
        } else { a.x = x; a.y = y; a.w = w; a.h = hgt; }
        layoutAnn(a);
        drawSelection();
      }
      function up() {
        target.removeEventListener('pointermove', move);
        target.removeEventListener('pointerup', up);
        if (moved) markDirty();
      }
      target.addEventListener('pointermove', move);
      target.addEventListener('pointerup', up);
    }

    function onKey(e) {
      if (!document.body.contains(root) || !el.pe) return;
      var typing = S.editing || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
      var mod = e.ctrlKey || e.metaKey;
      if (mod && !typing && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if (mod && !typing && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
      if (typing) { if (e.key === 'Escape' && S.editing) { var ed = findAnn(S.editing); if (ed) ed.node.blur(); } return; }
      var a = selected();
      if (a && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); removeAnn(a, true); return; }
      if (a && mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicate(a); return; }
      if (a && /^Arrow/.test(e.key)) {
        e.preventDefault();
        var step = e.shiftKey ? 10 : 1, dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0, dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        pushUndo();
        if (a.pts) a.pts = a.pts.map(function (p) { return [p[0] + dx, p[1] + dy]; }); else { a.x += dx; a.y += dy; }
        layoutAnn(a); drawSelection(); markDirty();
        return;
      }
      if (e.key === 'Escape') { select(null); setTool('select'); return; }
      if (mod || e.altKey) return;
      var t = TOOLS.filter(function (x) { return x.key === e.key.toLowerCase(); })[0];
      if (t && BT.$('.pe-tool[data-t="' + t.id + '"]', el.top)) { e.preventDefault(); setTool(t.id); }
    }

    // ------------------------------------------------------------ images
    function visiblePage() { return S.pages[S.currentPage || 0]; }

    function addImageFile(file) {
      BT.loadImage(file).then(function (img) {
        // Normalise to PNG (keeps transparency) unless it is a JPEG.
        var isJpg = /jpe?g/i.test(file.type);
        var c = document.createElement('canvas');
        var max = 2000, sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
        var ctx = c.getContext('2d');
        if (isJpg) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(img, 0, 0, c.width, c.height);
        var url = c.toDataURL(isJpg ? 'image/jpeg' : 'image/png', 0.92);
        placeImage(url, isJpg ? 'jpg' : 'png', c.width, c.height, 220);
      }).catch(function (e) { BT.toast(e.message, 'error'); });
    }

    function placeImage(url, kind, w, h, targetW) {
      var p = visiblePage();
      var imgId = uid();
      S.images[imgId] = { url: url, kind: kind };
      var ww = Math.min(targetW, p.vp1.width * 0.6), hh = ww * h / w;
      var sc = el.scroll, viewTop = (sc.scrollTop - p.wrap.offsetTop) / S.zoom;
      var y = Math.max(20, Math.min(p.vp1.height - hh - 20, viewTop + 80));
      pushUndo();
      var a = { id: uid(), page: p.index, type: 'image', imgId: imgId, x: (p.vp1.width - ww) / 2, y: y, w: ww, h: hh, opacity: 1 };
      S.anns.push(a);
      renderAnn(a);
      setTool('select', true);
      select(a.id);
      markDirty();
    }

    // -------------------------------------------------------- signatures
    function openSignature() {
      var modal = BT.h('div.pe-modal', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Create signature' });
      var dlg = BT.h('div.pe-dialog');
      dlg.innerHTML = '<h3>Add your signature <button class="icon-btn" data-x aria-label="Close">' + BT.icon('x') + '</button></h3>';
      if (S.signatures.length) {
        var saved = BT.h('div.pe-saved');
        S.signatures.forEach(function (sig) {
          saved.appendChild(BT.h('button', { type: 'button', title: 'Use this signature', html: '<img alt="Saved signature" src="' + sig.url + '">', onclick: function () { close(); placeImage(sig.url, 'png', sig.w, sig.h, 170); } }));
        });
        dlg.appendChild(BT.h('p.small.muted', { text: 'Use a saved signature or create a new one:' }));
        dlg.appendChild(saved);
      }
      var seg = BT.h('div.seg', { role: 'tablist' });
      var panes = {};
      ['Draw', 'Type', 'Upload'].forEach(function (name, i) {
        var b = BT.h('button', { type: 'button', text: name, class: i === 0 ? 'active' : '' });
        b.addEventListener('click', function () {
          BT.$$('button', seg).forEach(function (x) { x.classList.toggle('active', x === b); });
          Object.keys(panes).forEach(function (k) { panes[k].classList.toggle('hidden', k !== name); });
          cur = name;
        });
        seg.appendChild(b);
      });
      dlg.appendChild(seg);
      var cur = 'Draw';
      var color = '#111827';

      // Draw
      var pad = BT.h('canvas.pe-sigpad');
      panes.Draw = BT.h('div', { style: { marginTop: '12px' } }, [pad]);
      var colors = BT.h('div.btn-group', { style: { marginTop: '10px', alignItems: 'center' } });
      ['#111827', '#1d4ed8', '#b91c1c'].forEach(function (c, i) {
        var b = BT.h('button.pe-tog', { type: 'button', 'aria-label': 'Ink ' + c, 'aria-pressed': i === 0 ? 'true' : 'false', style: { background: c, borderColor: c } });
        b.addEventListener('click', function () { color = c; BT.$$('.pe-tog', colors).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); drawTyped(); });
        colors.appendChild(b);
      });
      colors.appendChild(BT.h('span.spacer', { style: { flex: '1' } }));
      colors.appendChild(BT.h('button.btn.btn-sm.btn-ghost', { type: 'button', html: BT.icon('eraser') + ' Clear', onclick: function () { strokes = []; redrawPad(); } }));
      panes.Draw.appendChild(colors);
      var strokes = [], dpr = Math.min(window.devicePixelRatio || 1, 2);
      function sizePad() {
        var r = pad.getBoundingClientRect();
        pad.width = Math.max(300, r.width) * dpr; pad.height = 200 * dpr;
        redrawPad();
      }
      function redrawPad() {
        var g = pad.getContext('2d');
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.clearRect(0, 0, pad.width, pad.height);
        g.lineCap = 'round'; g.lineJoin = 'round';
        strokes.forEach(function (s) {
          g.strokeStyle = s.color; g.lineWidth = 2.6;
          g.beginPath();
          s.pts.forEach(function (p, i) {
            if (i === 0) g.moveTo(p[0], p[1]);
            else { var prev = s.pts[i - 1]; g.quadraticCurveTo(prev[0], prev[1], (prev[0] + p[0]) / 2, (prev[1] + p[1]) / 2); }
          });
          if (s.pts.length === 1) g.lineTo(s.pts[0][0] + 0.1, s.pts[0][1]);
          g.stroke();
        });
        g.fillStyle = '#9ca3af'; g.font = '12px Inter, sans-serif';
        if (!strokes.length) g.fillText('Sign here with your mouse, finger or stylus', 12, 190);
      }
      pad.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        pad.setPointerCapture(e.pointerId);
        var r = pad.getBoundingClientRect();
        var s = { color: color, pts: [[e.clientX - r.left, e.clientY - r.top]] };
        strokes.push(s);
        function mv(ev) { s.pts.push([ev.clientX - r.left, ev.clientY - r.top]); redrawPad(); }
        function upp() { pad.removeEventListener('pointermove', mv); pad.removeEventListener('pointerup', upp); }
        pad.addEventListener('pointermove', mv);
        pad.addEventListener('pointerup', upp);
        redrawPad();
      });

      // Type
      var nameIn = BT.h('input', { type: 'text', placeholder: 'Type your name', 'aria-label': 'Your name', value: S.lastName || '' });
      var fontsBox = BT.h('div.pe-sigfonts');
      var chosenFont = 0;
      SIG_FONTS.forEach(function (f, i) {
        var b = BT.h('button', { type: 'button', class: i === 0 ? 'on' : '', style: { fontFamily: f.css } });
        b.addEventListener('click', function () { chosenFont = i; BT.$$('button', fontsBox).forEach(function (x) { x.classList.toggle('on', x === b); }); });
        fontsBox.appendChild(b);
      });
      function drawTyped() {
        BT.$$('button', fontsBox).forEach(function (b) { b.textContent = nameIn.value || 'Your Name'; b.style.color = color; });
      }
      nameIn.addEventListener('input', drawTyped);
      panes.Type = BT.h('div.hidden', { style: { marginTop: '12px' } }, [nameIn, fontsBox]);
      drawTyped();

      // Upload
      var upImg = null;
      var upPrev = BT.h('div.preview-box', { style: { minHeight: '120px', marginTop: '10px' } });
      var removeBg = BT.h('input', { type: 'checkbox', checked: true });
      var upDz = BT.dropzone({ accept: 'image/*', compact: true, title: 'Upload a signature image', hint: 'PNG or JPG photo of your signature', icon: 'upload', onFiles: function (f) {
        BT.loadImage(f[0]).then(function (img) { upImg = img; upPrev.innerHTML = ''; upPrev.appendChild(processUpload()); });
      } });
      function processUpload() {
        var c = document.createElement('canvas'), sc = Math.min(1, 1200 / upImg.naturalWidth);
        c.width = upImg.naturalWidth * sc; c.height = upImg.naturalHeight * sc;
        var g = c.getContext('2d');
        g.drawImage(upImg, 0, 0, c.width, c.height);
        if (removeBg.checked) {
          var d = g.getImageData(0, 0, c.width, c.height), px = d.data;
          for (var i = 0; i < px.length; i += 4) {
            var l = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
            if (l > 200) px[i + 3] = 0; else if (l > 150) px[i + 3] = Math.round(px[i + 3] * (200 - l) / 50);
          }
          g.putImageData(d, 0, 0);
        }
        return c;
      }
      removeBg.addEventListener('change', function () { if (upImg) { upPrev.innerHTML = ''; upPrev.appendChild(processUpload()); } });
      panes.Upload = BT.h('div.hidden', { style: { marginTop: '12px' } }, [upDz, BT.h('label.check', { style: { marginTop: '10px' } }, [removeBg, 'Remove white background']), upPrev]);

      dlg.appendChild(panes.Draw);
      dlg.appendChild(panes.Type);
      dlg.appendChild(panes.Upload);
      var actions = BT.h('div.btn-group', { style: { marginTop: '16px', justifyContent: 'flex-end' } });
      actions.appendChild(BT.h('button.btn', { type: 'button', text: 'Cancel', onclick: function () { close(); } }));
      actions.appendChild(BT.h('button.btn.btn-primary', { type: 'button', html: BT.icon('check') + ' Place signature', onclick: done }));
      dlg.appendChild(actions);
      modal.appendChild(dlg);
      document.body.appendChild(modal);
      sizePad();
      modal.addEventListener('click', function (e) { if (e.target === modal || e.target.closest('[data-x]')) close(); });
      function escClose(e) { if (e.key === 'Escape') close(); }
      document.addEventListener('keydown', escClose, true);
      function close() { modal.remove(); document.removeEventListener('keydown', escClose, true); if (S.tool !== 'select') setTool('select', true); }

      function done() {
        var c;
        if (cur === 'Draw') {
          if (!strokes.length) { BT.toast('Please draw your signature first', 'error'); return; }
          c = trim(pad);
        } else if (cur === 'Type') {
          var name = nameIn.value.trim();
          if (!name) { BT.toast('Please type your name', 'error'); return; }
          S.lastName = name;
          c = document.createElement('canvas');
          c.width = 1400; c.height = 360;
          var g = c.getContext('2d');
          g.fillStyle = color;
          g.font = '180px ' + SIG_FONTS[chosenFont].css;
          g.textBaseline = 'middle';
          g.fillText(name, 40, 180);
          c = trim(c);
        } else {
          if (!upImg) { BT.toast('Please upload an image first', 'error'); return; }
          c = trim(processUpload());
        }
        if (!c) { BT.toast('Signature is empty', 'error'); return; }
        var url = c.toDataURL('image/png');
        S.signatures.unshift({ url: url, w: c.width, h: c.height });
        close();
        placeImage(url, 'png', c.width, c.height, 170);
      }
      // Make sure handwriting fonts are ready for the Type tab.
      if (document.fonts && document.fonts.load) SIG_FONTS.forEach(function (f) { document.fonts.load('40px "' + f.name + '"').then(drawTyped, function () {}); });
    }

    /** Crop a canvas to its non-transparent content (with a small margin). */
    function trim(c) {
      var g = c.getContext('2d'), w = c.width, h = c.height;
      var d = g.getImageData(0, 0, w, h).data;
      var x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      if (x1 < 0) return null;
      var m = 6;
      x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(w - 1, x1 + m); y1 = Math.min(h - 1, y1 + m);
      var out = document.createElement('canvas');
      out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
      out.getContext('2d').drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
      return out;
    }

    // -------------------------------------------------------------- save
    function save() {
      if (S.editing) { var ed = findAnn(S.editing); if (ed) ed.node.blur(); }
      if (!S.anns.length) { BT.toast('Add something to the PDF first: text, a signature, a shape…', 'error'); return; }
      var PDFLib = window.PDFLib;
      var rgb = PDFLib.rgb, degrees = PDFLib.degrees;
      var warned = false;
      return PDFLib.PDFDocument.load(S.bytes, { ignoreEncryption: true }).then(function (doc) {
        var pages = doc.getPages();
        var fontCache = {}, imgCache = {};
        function getFont(key, bold, italic) {
          var name = FONTS[key].std[(bold ? 1 : 0) + (italic ? 2 : 0)];
          if (!fontCache[name]) fontCache[name] = doc.embedFont(PDFLib.StandardFonts[name]);
          return fontCache[name];
        }
        function getImage(imgId) {
          if (!imgCache[imgId]) {
            var im = S.images[imgId];
            var b64 = im.url.split(',')[1], bin = atob(b64), bytes = new Uint8Array(bin.length);
            for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            imgCache[imgId] = im.kind === 'jpg' ? doc.embedJpg(bytes) : doc.embedPng(bytes);
          }
          return imgCache[imgId];
        }
        function color(hex) { var c = hexToRgb01(hex); return rgb(c[0], c[1], c[2]); }
        function safeText(font, s) {
          try { font.encodeText(s); return s; } catch (e) {
            var out = '';
            for (var i = 0; i < s.length; i++) {
              var ch = s[i];
              try { font.encodeText(ch); out += ch; } catch (err) { out += '?'; warned = true; }
            }
            return out;
          }
        }

        var chain = Promise.resolve();
        S.anns.forEach(function (a) {
          chain = chain.then(function () {
            var info = S.pages[a.page], vp = info.vp1, page = pages[a.page];
            var rot = degrees(vp.rotation || 0);
            function P(x, y) { var r = vp.convertToPdfPoint(x, y); return { x: r[0], y: r[1] }; }
            if (a.type === 'text') {
              var f = FONTS[a.font] || FONTS.helv;
              var lines = a.text.split('\n');
              var isTick = a.text.trim() === '✓' || a.text.trim() === '✔';
              if (isTick) {
                // Draw tick marks as vector paths (not in the standard fonts).
                var s = a.size, ox = a.x, oy = a.y + s * 0.15;
                var p1 = P(ox + s * 0.08, oy + s * 0.55), p2 = P(ox + s * 0.35, oy + s * 0.85), p3 = P(ox + s * 0.9, oy + s * 0.12);
                [[p1, p2], [p2, p3]].forEach(function (seg) {
                  page.drawLine({ start: seg[0], end: seg[1], thickness: s * 0.13, color: color(a.color), lineCap: PDFLib.LineCapStyle.Round });
                });
                return;
              }
              return getFont(a.font, a.bold, a.italic).then(function (font) {
                lines.forEach(function (line, i) {
                  if (!line) return;
                  var o = P(a.x, a.y + i * a.size * LINE_H + a.size * f.base);
                  page.drawText(safeText(font, line), { x: o.x, y: o.y, size: a.size, font: font, color: color(a.color), rotate: rot });
                });
              });
            }
            if (a.type === 'image') {
              return getImage(a.imgId).then(function (img) {
                var o = P(a.x, a.y + a.h);
                page.drawImage(img, { x: o.x, y: o.y, width: a.w, height: a.h, rotate: rot, opacity: a.opacity == null ? 1 : a.opacity });
              });
            }
            if (a.type === 'whiteout' || a.type === 'highlight' || a.type === 'rect') {
              var o2 = P(a.x, a.y + a.h);
              var opt = { x: o2.x, y: o2.y, width: a.w, height: a.h, rotate: rot };
              if (a.type === 'whiteout') { opt.color = color(a.fill); }
              else if (a.type === 'highlight') { opt.color = color(a.fill); opt.opacity = a.opacity; if (PDFLib.BlendMode) opt.blendMode = PDFLib.BlendMode.Multiply; }
              else {
                if (a.fill) { opt.color = color(a.fill); opt.opacity = a.opacity; }
                if (a.sw > 0) { opt.borderColor = color(a.stroke); opt.borderWidth = a.sw; opt.borderOpacity = a.opacity; }
              }
              page.drawRectangle(opt);
              return;
            }
            if (a.type === 'ellipse') {
              var c = P(a.x + a.w / 2, a.y + a.h / 2);
              var eo = { x: c.x, y: c.y, xScale: a.w / 2, yScale: a.h / 2, rotate: rot };
              if (a.fill) { eo.color = color(a.fill); eo.opacity = a.opacity; }
              if (a.sw > 0) { eo.borderColor = color(a.stroke); eo.borderWidth = a.sw; eo.borderOpacity = a.opacity; }
              page.drawEllipse(eo);
              return;
            }
            if (a.type === 'line' || a.type === 'draw') {
              // Path in absolute PDF coordinates; drawSvgPath flips y around (0,0).
              var d = a.pts.map(function (pt, i) { var q = P(pt[0], pt[1]); return (i ? 'L' : 'M') + q.x.toFixed(2) + ' ' + (-q.y).toFixed(2); }).join(' ');
              page.drawSvgPath(d, { x: 0, y: 0, borderColor: color(a.stroke), borderWidth: a.sw, borderOpacity: a.opacity, borderLineCap: PDFLib.LineCapStyle.Round });
            }
          });
        });
        return chain.then(function () { return doc.save(); });
      }).then(function (out) {
        BT.download(new Blob([out], { type: 'application/pdf' }), BT.baseName(S.fileName) + (mode === 'sign' ? '-signed.pdf' : '-edited.pdf'));
        S.dirty = false;
        BT.toast('Your PDF has been downloaded');
        if (warned) BT.toast('Some characters (e.g. ₹ or Hindi) aren’t supported by standard PDF fonts and were replaced with “?”', 'error');
      });
    }

    showStart();
  }

  BT.impl('pdf-editor', function (root) { Editor(root, { mode: 'edit' }); });
  BT.impl('sign-pdf', function (root) { Editor(root, { mode: 'sign' }); });
})();
