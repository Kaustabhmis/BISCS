/*
 * BISCS Tools — Text tools.
 * word-counter, case-converter, lorem-ipsum-generator, remove-duplicate-lines,
 * sort-lines, reverse-text, find-and-replace, text-diff, slug-generator,
 * whitespace-cleaner, text-to-speech, markdown-preview, fancy-text-generator,
 * text-extractor.
 */
(function () {
  'use strict';
  var BT = window.BT;
  var esc = BT.esc;

  // Keep a local copy of each implementation so the tool can still start if
  // core booted before this deferred script ran (see bootFallback below).
  var LOCAL = {};
  var coreImpl = BT.impl;
  BT.impl = function (id, fn) { LOCAL[id] = fn; return coreImpl.apply(this, arguments); };

  // =================================================================== shared
  var CSS = [
    '.bt-opts{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;margin-bottom:16px}',
    '.bt-opts .field{margin:0}',
    '.bt-fhead{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-height:34px;margin-bottom:6px}',
    '.bt-fhead>label,.bt-fhead>.lbl{font-size:.85rem;font-weight:600;color:var(--text-2)}',
    '.bt-fhead .spacer{flex:1}',
    '.bt-pane{display:flex;flex-direction:column;min-width:0}',
    '.bt-pane textarea{flex:1}',
    '.bt-info{margin-top:12px;font-size:.88rem;color:var(--text-2);display:flex;flex-wrap:wrap;gap:8px;align-items:center;min-height:22px}',
    '.bt-ta-lg{min-height:280px}',
    '.bt-ta-xl{min-height:420px}',
    'mark.bt-hl{background:color-mix(in srgb,var(--warn) 32%,transparent);color:inherit;border-radius:3px;box-shadow:0 0 0 1px color-mix(in srgb,var(--warn) 55%,transparent)}',
    'mark.bt-hl.alt{background:color-mix(in srgb,var(--brand) 26%,transparent);box-shadow:0 0 0 1px color-mix(in srgb,var(--brand) 50%,transparent)}',
    'mark.bt-rep{background:color-mix(in srgb,var(--ok) 28%,transparent);color:inherit;border-radius:3px;box-shadow:0 0 0 1px color-mix(in srgb,var(--ok) 50%,transparent)}',
    '.bt-scroll{max-height:460px;overflow:auto}',
    '.bt-case-grid{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));margin:14px 0 4px}',
    '.bt-case-grid .btn{justify-content:flex-start;font-weight:600}',
    '.bt-case-grid .btn small{color:var(--text-3);font-weight:500;margin-left:auto;font-size:.75rem}',
    '.bt-kw-bar{height:6px;border-radius:9px;background:var(--surface-2);overflow:hidden;min-width:60px}',
    '.bt-kw-bar span{display:block;height:100%;background:linear-gradient(90deg,var(--brand),var(--brand-2));border-radius:9px}',
    '.bt-diff{width:100%;border-collapse:collapse;font-family:var(--mono);font-size:.84rem;table-layout:fixed}',
    '.bt-diff td{padding:2px 8px;vertical-align:top;border:0}',
    '.bt-diff td.n{width:3.6em;text-align:right;color:var(--text-3);user-select:none;font-size:.78rem;padding-top:3px}',
    '.bt-diff td.s{width:1.6em;text-align:center;user-select:none;font-weight:700}',
    '.bt-diff td.c{white-space:pre-wrap;word-break:break-word}',
    '.bt-diff tr.add td{background:color-mix(in srgb,var(--ok) 13%,transparent)}',
    '.bt-diff tr.add td.s{color:var(--ok)}',
    '.bt-diff tr.del td{background:color-mix(in srgb,var(--danger) 12%,transparent)}',
    '.bt-diff tr.del td.s{color:var(--danger)}',
    '.bt-diff tr.gap td{background:var(--surface-2);color:var(--text-3);font-family:var(--font);font-size:.8rem;padding:5px 10px}',
    '.bt-diff ins{text-decoration:none;background:color-mix(in srgb,var(--ok) 38%,transparent);border-radius:3px}',
    '.bt-diff del{text-decoration:none;background:color-mix(in srgb,var(--danger) 34%,transparent);border-radius:3px}',
    '.bt-diff-wrap{border:1px solid var(--border);border-radius:var(--radius-sm);overflow:auto;max-height:640px;background:var(--surface)}',
    '.bt-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:999px;font-weight:700;font-size:.85rem}',
    '.bt-pill.add{background:var(--ok-soft);color:var(--ok)}.bt-pill.del{background:var(--danger-soft);color:var(--danger)}.bt-pill.eq{background:var(--surface-2);color:var(--text-2)}',
    '.bt-fancy{display:flex;flex-direction:column;gap:8px}',
    '.bt-fancy-row{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);cursor:pointer;transition:border-color .15s,background .15s}',
    '.bt-fancy-row:hover{border-color:var(--brand);background:var(--brand-soft)}',
    '.bt-fancy-row .nm{font-size:.75rem;color:var(--text-3);font-weight:600;text-transform:uppercase;letter-spacing:.04em}',
    '.bt-fancy-row .tx{font-size:1.15rem;word-break:break-word;line-height:1.4}',
    '.bt-fancy-row .bd{flex:1;min-width:0}',
    '.bt-md{line-height:1.65;overflow-wrap:anywhere;min-height:420px;max-height:720px;overflow:auto;padding:18px 20px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface)}',
    '.bt-md>:first-child{margin-top:0}',
    '.bt-md h1,.bt-md h2{border-bottom:1px solid var(--border);padding-bottom:.3em;margin-top:1.2em}',
    '.bt-md h1{font-size:1.8rem}.bt-md h2{font-size:1.4rem}.bt-md h3{font-size:1.15rem;margin-top:1.1em}',
    '.bt-md code{font-family:var(--mono);font-size:.86em;background:var(--surface-2);border:1px solid var(--border);padding:.1em .35em;border-radius:5px}',
    '.bt-md pre{background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:14px;overflow:auto}',
    '.bt-md pre code{background:none;border:0;padding:0}',
    '.bt-md blockquote{margin:0 0 1em;padding:4px 16px;border-left:4px solid var(--brand);color:var(--text-2);background:var(--surface-2);border-radius:0 8px 8px 0}',
    '.bt-md table{border-collapse:collapse;margin:0 0 1em;display:block;overflow:auto}',
    '.bt-md th,.bt-md td{border:1px solid var(--border);padding:6px 12px}',
    '.bt-md th{background:var(--surface-2)}',
    '.bt-md img{max-width:100%;border-radius:8px}',
    '.bt-md hr{border:0;border-top:1px solid var(--border);margin:1.5em 0}',
    '.bt-md ul,.bt-md ol{padding-left:1.6em}',
    '.bt-md li input[type=checkbox]{margin-right:6px;vertical-align:-2px}',
    '.bt-read{max-height:260px;overflow:auto;line-height:1.7;font-size:1rem;font-family:var(--font)}',
    '.bt-range{display:flex;flex-direction:column;gap:4px}',
    '.bt-range .lbl{display:flex;justify-content:space-between;font-size:.85rem;font-weight:600;color:var(--text-2)}',
    '.bt-range output{font-variant-numeric:tabular-nums;color:var(--text)}',
    '.bt-slug{font-family:var(--mono);font-size:1.05rem;font-weight:600;word-break:break-all}',
    '.bt-url{font-family:var(--mono);font-size:.85rem;color:var(--text-3);word-break:break-all;margin-top:6px}',
    '.bt-url b{color:var(--brand)}'
  ].join('\n');

  function css() {
    if (document.getElementById('bt-text-css')) return;
    var s = document.createElement('style');
    s.id = 'bt-text-css';
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
      return '<button type="button" data-v="' + it[0] + '" class="' + (on ? 'active' : '') + '" aria-pressed="' + on + '">' + esc(it[1]) + '</button>';
    }).join('') + '</div>';
  }
  function wireSeg(el, cb) {
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-v]');
      if (!b) return;
      setSeg(el, b.getAttribute('data-v'));
      cb(b.getAttribute('data-v'));
    });
  }
  function setSeg(el, v) {
    BT.$$('button[data-v]', el).forEach(function (x) {
      var on = x.getAttribute('data-v') === v;
      x.classList.toggle('active', on);
      x.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function segVal(el) {
    var b = BT.$('button.active', el);
    return b ? b.getAttribute('data-v') : null;
  }
  function splitLines(s) { return s.split(/\r\n|\r|\n/); }
  function plural(n, w) { return BT.fmtNum(n, 0) + ' ' + w + (n === 1 ? '' : 's'); }
  function store(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      localStorage.setItem(k, v);
    } catch (e) { /* storage unavailable */ }
    return null;
  }

  var HAS_SEG = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function';
  var segGraph = HAS_SEG ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  var segWord = HAS_SEG ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null;
  var segSent = HAS_SEG ? new Intl.Segmenter(undefined, { granularity: 'sentence' }) : null;

  function graphemes(s) {
    if (segGraph) return Array.from(segGraph.segment(s), function (x) { return x.segment; });
    // Fallback: code points, keeping combining marks attached.
    return s.match(/[\s\S][\p{M}‍️]*/gu) || [];
  }
  function wordList(s) {
    if (segWord) {
      var out = [];
      Array.from(segWord.segment(s)).forEach(function (x) { if (x.isWordLike) out.push(x.segment); });
      return out;
    }
    return s.match(/[\p{L}\p{M}\p{N}_]+(?:['’][\p{L}\p{M}\p{N}_]+)*/gu) || [];
  }

  /** Readable duration from minutes. */
  function fmtMin(min) {
    if (!min) return '0 sec';
    var s = Math.round(min * 60);
    if (s < 60) return s + ' sec';
    var m = Math.floor(s / 60), r = s % 60;
    if (m < 60) return m + ' min' + (r ? ' ' + r + ' sec' : '');
    return Math.floor(m / 60) + ' hr ' + (m % 60) + ' min';
  }

  /** Text area with a small undo stack for in-place transforms. */
  function undoable(ta, undoBtn) {
    var stack = [];
    function sync() { if (undoBtn) undoBtn.disabled = !stack.length; }
    sync();
    return {
      set: function (v) {
        if (v === ta.value) return;
        stack.push(ta.value);
        if (stack.length > 50) stack.shift();
        ta.value = v;
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        sync();
      },
      undo: function () {
        if (!stack.length) return;
        ta.value = stack.pop();
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        sync();
      }
    };
  }

  /**
   * Standard "input → options → output" tool layout.
   * o: { p, options, inLabel, outLabel, placeholder, sample, file, run(text) -> {out, info} }
   */
  function ioTool(root, o) {
    css();
    var p = o.p;
    root.innerHTML = '<div class="card">' +
      (o.options ? '<div class="bt-opts" id="' + p + '-opts">' + o.options + '</div>' : '') +
      '<div class="split">' +
      '<div class="bt-pane"><div class="bt-fhead"><label for="' + p + '-in">' + esc(o.inLabel || 'Input') + '</label>' +
      '<span class="muted small" id="' + p + '-in-n"></span><span class="spacer"></span>' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<textarea id="' + p + '-in" class="mono bt-ta-lg" spellcheck="false" placeholder="' + esc(o.placeholder || 'Paste or type your text here…') + '"></textarea></div>' +
      '<div class="bt-pane"><div class="bt-fhead"><label for="' + p + '-out">' + esc(o.outLabel || 'Result') + '</label>' +
      '<span class="muted small" id="' + p + '-out-n"></span><span class="spacer"></span>' +
      btn('data-a="use" title="Use the result as new input"', 'arrow-left', 'Use as input', 'btn-ghost') +
      btn('data-a="copy"', 'copy', 'Copy') + btn('data-a="dl"', 'download', 'Download') + '</div>' +
      '<textarea id="' + p + '-out" class="mono bt-ta-lg" spellcheck="false" readonly placeholder="Result appears here"></textarea></div>' +
      '</div><div class="bt-info" id="' + p + '-info" aria-live="polite"></div></div>';
    var inp = BT.$('#' + p + '-in', root), out = BT.$('#' + p + '-out', root), info = BT.$('#' + p + '-info', root);
    var inN = BT.$('#' + p + '-in-n', root), outN = BT.$('#' + p + '-out-n', root);
    function count(s) { return s ? plural(splitLines(s).length, 'line') + ' · ' + plural(s.length, 'char') : ''; }
    function update() {
      var r = o.run(inp.value) || {};
      out.value = r.out == null ? '' : r.out;
      info.innerHTML = r.info || '';
      inN.textContent = count(inp.value);
      outN.textContent = count(out.value);
    }
    var deb = BT.debounce(update, 60);
    root.addEventListener('input', function (e) { if (e.target === inp && inp.value.length > 200000) deb(); else update(); });
    root.addEventListener('change', update);
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'sample') { inp.value = o.sample; update(); }
      else if (a === 'clear') { inp.value = ''; update(); inp.focus(); }
      else if (a === 'copy') { if (out.value) BT.copy(out.value); else BT.toast('Nothing to copy yet', 'error'); }
      else if (a === 'dl') { if (out.value) BT.download(out.value, o.file || 'text.txt', 'text/plain;charset=utf-8'); else BT.toast('Nothing to download yet', 'error'); }
      else if (a === 'use') { inp.value = out.value; update(); }
    });
    update();
    return { inp: inp, out: out, update: update, $: function (s) { return BT.$(s, root); } };
  }

  var UPSIDE = {
    a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ', i: 'ᴉ', j: 'ɾ', k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd', q: 'b', r: 'ɹ', s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z',
    A: '∀', B: 'ꓭ', C: 'Ɔ', D: 'ꓷ', E: 'Ǝ', F: 'Ⅎ', G: '⅁', H: 'H', I: 'I', J: 'ſ', K: 'ꓘ', L: '˥', M: 'W', N: 'N', O: 'O', P: 'Ԁ', Q: 'Ό', R: 'ᴚ', S: 'S', T: '⊥', U: '∩', V: 'Λ', W: 'M', X: 'X', Y: '⅄', Z: 'Z',
    '0': '0', '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9', '7': 'ㄥ', '8': '8', '9': '6',
    '.': '˙', ',': '\'', '\'': ',', '"': '„', '?': '¿', '!': '¡', '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{',
    '<': '>', '>': '<', '&': '⅋', '_': '‾', ';': '؛', '`': ','
  };
  function upsideDown(s) {
    return splitLines(s).reverse().map(function (line) {
      return graphemes(line).reverse().map(function (g) { return UPSIDE[g] || g; }).join('');
    }).join('\n');
  }

  // ============================================================ word-counter
  var STOP = ('a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves also may might must shall us get got one two like via per etc s t ll re ve d m don isn aren wasn weren hasn haven hadn doesn didn won wouldn shan shouldn can’t cannot ' +
    'का की के है में और को से पर यह था थे थी एक भी नहीं तो हैं ने लिए कि हो जो कर इस उस वह ये वे हम आप मैं तुम गया गई किया करते करना होता होती होते रहा रहे रही अपने अपनी अपना साथ बहुत सकता सकते सबसे कुछ जब तक यदि या एवं तथा').split(' ');
  var STOPSET = new Set(STOP);

  BT.impl('word-counter', function (root) {
    css();
    root.innerHTML = '<div class="card">' +
      '<div class="bt-fhead"><label for="wc-in">Your text</label><span class="spacer"></span>' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="copy"', 'copy', 'Copy') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<textarea id="wc-in" class="bt-ta-lg" placeholder="Start typing or paste your text here… Works with English, Hindi and other languages."></textarea>' +
      '<div class="stats" id="wc-stats" style="margin-top:16px" aria-live="polite"></div></div>' +
      '<div class="card"><div class="card-title"><h3>Keyword density</h3><span class="muted small">Common stop words are excluded</span></div><div id="wc-kw"></div></div>';
    var ta = BT.$('#wc-in', root), stats = BT.$('#wc-stats', root), kw = BT.$('#wc-kw', root);
    var SAMPLE = 'Digital India is transforming how citizens access government services. From filing income tax returns online to paying GST, most tasks can now be completed from a phone.\n\nSmall businesses benefit the most. Online invoicing, UPI payments and digital records save time and reduce paperwork. Many owners say digital tools helped them grow faster than expected.\n\nडिजिटल इंडिया ने नागरिकों के जीवन को आसान बनाया है। अब अधिकतर सेवाएं ऑनलाइन उपलब्ध हैं।';

    function stat(label, value) { return '<div class="stat"><div class="label">' + label + '</div><div class="value">' + value + '</div></div>'; }

    function update() {
      var t = ta.value;
      var words = wordList(t);
      var wc = words.length;
      var chars = Array.from(t).length;
      var noSpace = Array.from(t.replace(/\s+/g, '')).length;
      var sentences = 0;
      if (segSent) {
        Array.from(segSent.segment(t)).forEach(function (x) { if (/[\p{L}\p{N}]/u.test(x.segment)) sentences++; });
      } else {
        sentences = (t.match(/[^.!?।]*[\p{L}\p{N}][^.!?।]*(?:[.!?।]+|$)/gu) || []).length;
      }
      var paras = t.split(/\n\s*\n/).filter(function (x) { return x.trim(); }).length;
      var lines = t ? splitLines(t).filter(function (x) { return x.trim(); }).length : 0;
      var letters = words.reduce(function (a, w) { return a + Array.from(w).length; }, 0);
      var uniq = new Set(words.map(function (w) { return w.toLocaleLowerCase(); })).size;
      stats.innerHTML =
        stat('Words', BT.fmtNum(wc, 0)) + stat('Characters', BT.fmtNum(chars, 0)) +
        stat('Without spaces', BT.fmtNum(noSpace, 0)) + stat('Sentences', BT.fmtNum(sentences, 0)) +
        stat('Paragraphs', BT.fmtNum(paras, 0)) + stat('Lines', BT.fmtNum(lines, 0)) +
        stat('Reading time', fmtMin(wc / 200)) + stat('Speaking time', fmtMin(wc / 130)) +
        stat('Unique words', BT.fmtNum(uniq, 0)) + stat('Avg word length', wc ? (letters / wc).toFixed(1) : '0');

      var freq = new Map();
      words.forEach(function (w) {
        var k = w.toLocaleLowerCase().replace(/['’]s$/, '');
        if (Array.from(k).length < 2 || STOPSET.has(k) || /^\d+$/.test(k)) return;
        freq.set(k, (freq.get(k) || 0) + 1);
      });
      var top = Array.from(freq.entries()).sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); }).slice(0, 12);
      if (!top.length) { kw.innerHTML = '<p class="muted" style="margin:0">Keywords will appear here as you type.</p>'; return; }
      var max = top[0][1];
      kw.innerHTML = '<div class="table-wrap"><table class="table"><thead><tr><th>Keyword</th><th class="num">Count</th><th class="num">Density</th><th style="width:35%"><span class="sr-only">Frequency bar</span></th></tr></thead><tbody>' +
        top.map(function (e) {
          return '<tr><td>' + esc(e[0]) + '</td><td class="num">' + e[1] + '</td><td class="num">' + (e[1] / wc * 100).toFixed(1) + '%</td>' +
            '<td><div class="bt-kw-bar"><span style="width:' + (e[1] / max * 100).toFixed(1) + '%"></span></div></td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    ta.addEventListener('input', BT.debounce(update, ta.value.length > 100000 ? 200 : 40));
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'sample') ta.value = SAMPLE;
      else if (a === 'clear') { ta.value = ''; ta.focus(); }
      else if (a === 'copy') { if (ta.value) BT.copy(ta.value); return; }
      update();
    });
    update();
  });

  // ========================================================== case-converter
  function caseWords(line) {
    return line.replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
      .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2')
      .match(/[\p{L}\p{M}\p{N}]+/gu) || [];
  }
  function cap(w) { var a = Array.from(w); return a.length ? a[0].toLocaleUpperCase() + a.slice(1).join('').toLocaleLowerCase() : w; }
  function perLine(s, fn) { return splitLines(s).map(fn).join('\n'); }
  var SMALL = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|vs?|via|with|from|into|onto|over|upon)$/i;
  var CASES = [
    ['upper', 'UPPER CASE', 'ABC', function (s) { return s.toLocaleUpperCase(); }],
    ['lower', 'lower case', 'abc', function (s) { return s.toLocaleLowerCase(); }],
    ['title', 'Title Case', 'Abc Def', function (s) {
      return perLine(s, function (line) {
        var re = /[\p{L}\p{N}][\p{L}\p{M}\p{N}'’]*/gu;
        var total = (line.match(re) || []).length, i = 0;
        return line.toLocaleLowerCase().replace(re, function (w, off, str) {
          var idx = i++;
          var afterColon = /[:—–-]\s*$/.test(str.slice(0, off));
          if (idx === 0 || idx === total - 1 || afterColon || !SMALL.test(w)) return cap(w);
          return w;
        });
      });
    }],
    ['sentence', 'Sentence case', 'Abc def.', function (s) {
      return s.toLocaleLowerCase()
        .replace(/(^|[.!?।]\s+|\n\s*)(\p{L})/gu, function (m, a, c) { return a + c.toLocaleUpperCase(); })
        .replace(/\bi\b/g, 'I').replace(/\bi'(m|ll|d|ve)\b/g, 'I\'$1');
    }],
    ['alt', 'aLtErNaTiNg', 'aBcD', function (s) {
      var n = 0;
      return Array.from(s).map(function (c) {
        if (c.toLocaleLowerCase() === c.toLocaleUpperCase()) return c;
        return (n++ % 2) ? c.toLocaleUpperCase() : c.toLocaleLowerCase();
      }).join('');
    }],
    ['inverse', 'iNVERSE cASE', 'aBC', function (s) {
      return Array.from(s).map(function (c) {
        var u = c.toLocaleUpperCase();
        return c === u ? c.toLocaleLowerCase() : u;
      }).join('');
    }],
    ['camel', 'camelCase', 'abcDef', function (s) {
      return perLine(s, function (l) { return caseWords(l).map(function (w, i) { return i ? cap(w) : w.toLocaleLowerCase(); }).join(''); });
    }],
    ['pascal', 'PascalCase', 'AbcDef', function (s) { return perLine(s, function (l) { return caseWords(l).map(cap).join(''); }); }],
    ['snake', 'snake_case', 'abc_def', function (s) { return perLine(s, function (l) { return caseWords(l).join('_').toLocaleLowerCase(); }); }],
    ['kebab', 'kebab-case', 'abc-def', function (s) { return perLine(s, function (l) { return caseWords(l).join('-').toLocaleLowerCase(); }); }],
    ['constant', 'CONSTANT_CASE', 'ABC_DEF', function (s) { return perLine(s, function (l) { return caseWords(l).join('_').toLocaleUpperCase(); }); }],
    ['dot', 'dot.case', 'abc.def', function (s) { return perLine(s, function (l) { return caseWords(l).join('.').toLocaleLowerCase(); }); }]
  ];

  BT.impl('case-converter', function (root) {
    css();
    root.innerHTML = '<div class="card">' +
      '<div class="bt-fhead"><label for="cc-in">Text</label><span class="muted small" id="cc-n"></span><span class="spacer"></span>' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="undo"', 'undo-2', 'Undo', 'btn-ghost') +
      btn('data-a="copy"', 'copy', 'Copy') + btn('data-a="dl"', 'download', 'Download') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<textarea id="cc-in" class="bt-ta-lg" placeholder="Type or paste text, then pick a case below."></textarea>' +
      '<div class="bt-case-grid" role="group" aria-label="Convert to">' + CASES.map(function (c) {
        return '<button type="button" class="btn" data-case="' + c[0] + '">' + esc(c[1]) + '</button>';
      }).join('') + '</div>' +
      '<p class="muted small" style="margin:8px 0 0">Buttons convert the text in place. camelCase, snake_case and similar work line by line, so you can convert a whole list of names at once.</p></div>';
    var ta = BT.$('#cc-in', root), n = BT.$('#cc-n', root);
    var u = undoable(ta, BT.$('[data-a="undo"]', root));
    function count() { var t = ta.value; n.textContent = t ? plural(wordList(t).length, 'word') + ' · ' + plural(Array.from(t).length, 'char') : ''; }
    ta.addEventListener('input', count);
    root.addEventListener('click', function (e) {
      var c = e.target.closest('[data-case]');
      if (c) {
        if (!ta.value) { BT.toast('Type or paste some text first', 'error'); ta.focus(); return; }
        var def = CASES.filter(function (x) { return x[0] === c.getAttribute('data-case'); })[0];
        u.set(def[3](ta.value));
        BT.toast('Converted to ' + def[1]);
        return;
      }
      var b = e.target.closest('[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'sample') u.set('the quick brown fox jumps over the lazy dog. it was a sunny day in new delhi!\nuserAccountId\nHTTPServerError\nfirst_name');
      else if (a === 'undo') u.undo();
      else if (a === 'copy') { if (ta.value) BT.copy(ta.value); }
      else if (a === 'dl') { if (ta.value) BT.download(ta.value, 'converted.txt', 'text/plain;charset=utf-8'); }
      else if (a === 'clear') u.set('');
    });
    count();
  });

  // =================================================== lorem-ipsum-generator
  var LOREM = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum ' +
    'curabitur pretium tincidunt lacus nulla gravida orci a odio nullam varius turpis et commodo pharetra eros bibendum elit nec luctus magna felis sollicitudin mauris integer dui risus iaculis vitae aliquet porta mattis vel neque donec vehicula ligula sagittis ornare praesent semper augue at viverra tortor quisque').split(' ');
  function rint(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function loremWords(n) { var o = []; for (var i = 0; i < n; i++) o.push(LOREM[rint(0, LOREM.length - 1)]); return o; }
  function loremSentence() {
    var w = loremWords(rint(6, 14));
    if (w.length > 7 && Math.random() < 0.5) w[rint(2, w.length - 4)] += ',';
    var s = w.join(' ');
    return s.charAt(0).toUpperCase() + s.slice(1) + '.';
  }
  var LOREM_FIRST = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

  BT.impl('lorem-ipsum-generator', function (root) {
    css();
    root.innerHTML = '<div class="card"><div class="row cols-3">' +
      '<div class="field"><span class="label" id="li-tl">Generate</span>' + seg('li-type', [['p', 'Paragraphs'], ['s', 'Sentences'], ['w', 'Words']], 'p', 'Generate') + '</div>' +
      '<div class="field"><label for="li-n">How many</label><input type="number" id="li-n" min="1" max="10000" value="3" inputmode="numeric"></div>' +
      '<div class="field"><span class="label">Options</span><div style="display:flex;flex-direction:column;gap:6px">' +
      chk('li-start', 'Start with “Lorem ipsum…”', true) + chk('li-html', 'Wrap in HTML &lt;p&gt; tags', false) + '</div></div>' +
      '</div><div class="toolbar">' + btn('data-a="gen" ', 'refresh-cw', 'Regenerate', 'btn-primary') + '<span class="spacer"></span>' +
      btn('data-a="copy"', 'copy', 'Copy') + btn('data-a="dl"', 'download', 'Download') + '</div>' +
      '<label for="li-out" class="sr-only">Generated text</label><textarea id="li-out" class="bt-ta-xl" readonly></textarea>' +
      '<div class="bt-info" id="li-info"></div></div>';
    var type = BT.$('#li-type', root), nIn = BT.$('#li-n', root), out = BT.$('#li-out', root), info = BT.$('#li-info', root);
    var LIM = { p: 100, s: 1000, w: 10000 };
    function gen() {
      var t = segVal(type), n = Math.floor(BT.num(nIn.value));
      var start = BT.$('#li-start', root).checked, html = BT.$('#li-html', root).checked;
      if (!(n >= 1)) n = 1;
      if (n > LIM[t]) { n = LIM[t]; nIn.value = n; BT.toast('Limited to ' + n, 'error'); }
      var paras = [];
      if (t === 'w') {
        var w = start ? 'lorem ipsum dolor sit amet consectetur adipiscing elit'.split(' ').slice(0, n) : [];
        w = w.concat(loremWords(n - w.length));
        var s = w.join(' ');
        paras.push(s.charAt(0).toUpperCase() + s.slice(1) + '.');
      } else if (t === 's') {
        var ss = [];
        for (var i = 0; i < n; i++) ss.push(i === 0 && start ? LOREM_FIRST : loremSentence());
        paras.push(ss.join(' '));
      } else {
        for (var p = 0; p < n; p++) {
          var ps = [], k = rint(4, 7);
          for (var j = 0; j < k; j++) ps.push(p === 0 && j === 0 && start ? LOREM_FIRST : loremSentence());
          paras.push(ps.join(' '));
        }
      }
      out.value = html ? paras.map(function (x) { return '<p>' + x + '</p>'; }).join('\n') : paras.join('\n\n');
      var words = paras.join(' ').split(/\s+/).length;
      info.innerHTML = '<span class="badge">' + plural(words, 'word') + '</span><span class="badge">' + plural(out.value.length, 'character') + '</span>';
    }
    wireSeg(type, function (v) { nIn.value = v === 'p' ? 3 : v === 's' ? 5 : 50; gen(); });
    nIn.addEventListener('input', BT.debounce(gen, 200));
    root.addEventListener('change', function (e) { if (e.target.type === 'checkbox') gen(); });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'gen') gen();
      else if (a === 'copy') BT.copy(out.value);
      else if (a === 'dl') BT.download(out.value, BT.$('#li-html', root).checked ? 'lorem-ipsum.html' : 'lorem-ipsum.txt', 'text/plain;charset=utf-8');
    });
    gen();
  });

  // ================================================== remove-duplicate-lines
  BT.impl('remove-duplicate-lines', function (root) {
    var io = ioTool(root, {
      p: 'rd', inLabel: 'Your list', outLabel: 'Unique lines', file: 'unique-lines.txt',
      placeholder: 'One item per line…',
      options: chk('rd-ci', 'Ignore case', true) + chk('rd-trim', 'Trim spaces', true) + chk('rd-empty', 'Remove empty lines', true),
      sample: 'apple\nBanana\nmango\napple\n  banana\nCherry\n\nmango\nGrapes\ncherry\nkiwi',
      run: function (t) {
        if (!t) return { out: '', info: '' };
        var ci = BT.$('#rd-ci', root).checked, trim = BT.$('#rd-trim', root).checked, rmEmpty = BT.$('#rd-empty', root).checked;
        var seen = new Set(), out = [], dup = 0, empty = 0, ls = splitLines(t);
        ls.forEach(function (l) {
          var v = trim ? l.trim() : l;
          if (!v.trim()) { if (rmEmpty) empty++; else out.push(v); return; }
          var key = ci ? v.toLocaleLowerCase() : v;
          if (seen.has(key)) { dup++; return; }
          seen.add(key);
          out.push(v);
        });
        return {
          out: out.join('\n'),
          info: '<span class="badge ' + (dup ? 'ok' : '') + '">' + plural(dup, 'duplicate') + ' removed</span>' +
            (empty ? '<span class="badge">' + plural(empty, 'empty line') + ' removed</span>' : '') +
            '<span class="muted">' + BT.fmtNum(ls.length, 0) + ' → ' + BT.fmtNum(out.length, 0) + ' lines</span>'
        };
      }
    });
    return io;
  });

  // ============================================================== sort-lines
  function secureRandom(n) { // uniform integer in [0, n)
    var c = window.crypto, buf = new Uint32Array(1), lim = Math.floor(0x100000000 / n) * n;
    if (!c || !c.getRandomValues) return Math.floor(Math.random() * n);
    do { c.getRandomValues(buf); } while (buf[0] >= lim);
    return buf[0] % n;
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = secureRandom(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  BT.impl('sort-lines', function (root) {
    var mode = 'az';
    var io = ioTool(root, {
      p: 'sl', inLabel: 'Lines to sort', outLabel: 'Sorted', file: 'sorted.txt', placeholder: 'One item per line…',
      options: '<div style="width:100%">' + seg('sl-mode', [['az', 'A → Z'], ['za', 'Z → A'], ['nat', 'Natural'], ['num', 'Numeric'], ['len', 'By length'], ['rev', 'Reverse order'], ['shuf', 'Shuffle']], 'az', 'Sort order') + '</div>' +
        chk('sl-uniq', 'Remove duplicates', false) + chk('sl-trim', 'Trim spaces', true) + chk('sl-empty', 'Remove empty lines', true) + chk('sl-ci', 'Ignore case', true) +
        '<span id="sl-again"></span>',
      sample: 'item 10\nBanana\nitem 2\napple\nCherry\nitem 1\n42\n7.5\nmango\n100',
      run: function (t) {
        if (!t) return { out: '', info: '' };
        var trim = BT.$('#sl-trim', root).checked, rmEmpty = BT.$('#sl-empty', root).checked;
        var uniq = BT.$('#sl-uniq', root).checked, ci = BT.$('#sl-ci', root).checked;
        var ls = splitLines(t).map(function (l) { return trim ? l.trim() : l; });
        if (rmEmpty) ls = ls.filter(function (l) { return l.trim(); });
        if (uniq) {
          var seen = new Set();
          ls = ls.filter(function (l) { var k = ci ? l.toLocaleLowerCase() : l; if (seen.has(k)) return false; seen.add(k); return true; });
        }
        var coll = new Intl.Collator(undefined, { sensitivity: ci ? 'base' : 'variant', caseFirst: ci ? 'false' : 'upper' });
        var nat = new Intl.Collator(undefined, { numeric: true, sensitivity: ci ? 'base' : 'variant' });
        function numOf(l) { var m = l.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/); return m ? parseFloat(m[0]) : NaN; }
        if (mode === 'az') ls.sort(coll.compare);
        else if (mode === 'za') ls.sort(function (a, b) { return coll.compare(b, a); });
        else if (mode === 'nat') ls.sort(nat.compare);
        else if (mode === 'num') ls.sort(function (a, b) {
          var x = numOf(a), y = numOf(b);
          if (isNaN(x) && isNaN(y)) return nat.compare(a, b);
          if (isNaN(x)) return 1;
          if (isNaN(y)) return -1;
          return x - y || nat.compare(a, b);
        });
        else if (mode === 'len') ls.sort(function (a, b) { return Array.from(a).length - Array.from(b).length || nat.compare(a, b); });
        else if (mode === 'rev') ls.reverse();
        else if (mode === 'shuf') shuffle(ls);
        return { out: ls.join('\n'), info: '<span class="badge">' + plural(ls.length, 'line') + '</span>' + (mode === 'shuf' ? '<span class="muted">Shuffled with a cryptographically secure random generator.</span>' : '') };
      }
    });
    wireSeg(BT.$('#sl-mode', root), function (v) {
      mode = v;
      BT.$('#sl-again', root).innerHTML = v === 'shuf' ? btn('data-a="reshuffle"', 'shuffle', 'Shuffle again', 'btn-ghost') : '';
      io.update();
    });
    root.addEventListener('click', function (e) { if (e.target.closest('[data-a="reshuffle"]')) io.update(); });
  });

  // ============================================================ reverse-text
  BT.impl('reverse-text', function (root) {
    var mode = 'chars';
    var io = ioTool(root, {
      p: 'rt', inLabel: 'Text', outLabel: 'Reversed', file: 'reversed.txt',
      options: seg('rt-mode', [['chars', 'Characters'], ['words', 'Word order'], ['each', 'Each word'], ['lines', 'Line order'], ['flip', 'Upside down']], 'chars', 'Reverse mode'),
      sample: 'Hello, World! नमस्ते 👋🏽\nThe quick brown fox jumps over the lazy dog.\nLine three 123',
      run: function (t) {
        if (!t) return { out: '' };
        var out;
        if (mode === 'chars') out = graphemes(t).reverse().join('');
        else if (mode === 'words') out = perLine(t, function (l) { return l.split(/(\s+)/).reverse().join(''); });
        else if (mode === 'each') out = t.replace(/[^\s]+/g, function (w) { return graphemes(w).reverse().join(''); });
        else if (mode === 'lines') out = splitLines(t).reverse().join('\n');
        else out = upsideDown(t);
        return { out: out, info: mode === 'chars' ? '<span class="muted">Emoji, accents and Indic conjuncts are kept intact.</span>' : mode === 'flip' ? '<span class="muted">Upside-down text uses look-alike Unicode characters — great for social media bios.</span>' : '' };
      }
    });
    wireSeg(BT.$('#rt-mode', root), function (v) { mode = v; io.update(); });
  });

  // ======================================================= find-and-replace
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  /** Expand $1, $&, $<name>, $$ etc. like String.prototype.replace. */
  function expandRep(rep, m, pos, str) {
    return rep.replace(/\$(\$|&|`|'|\d{1,2}|<([^>]*)>)/g, function (all, t, name) {
      if (t === '$') return '$';
      if (t === '&') return m[0];
      if (t === '`') return str.slice(0, pos);
      if (t === '\'') return str.slice(pos + m[0].length);
      if (name !== undefined) return m.groups ? (m.groups[name] == null ? '' : m.groups[name]) : all;
      var n = parseInt(t, 10);
      if (n > 0 && n < m.length) return m[n] == null ? '' : m[n];
      if (t.length === 2) { var n1 = parseInt(t[0], 10); if (n1 > 0 && n1 < m.length) return (m[n1] == null ? '' : m[n1]) + t[1]; }
      return all;
    });
  }
  /** All matches of a global regex, safe for zero-length matches. */
  function allMatches(re, s, limit) {
    var out = [], m, unicode = re.unicode;
    re.lastIndex = 0;
    while ((m = re.exec(s)) !== null) {
      out.push(m);
      if (m[0] === '') {
        var li = re.lastIndex;
        re.lastIndex = li + (unicode && li < s.length && s.codePointAt(li) > 0xffff ? 2 : 1);
        if (li >= s.length) break;
      }
      if (out.length >= limit) break;
    }
    return out;
  }

  BT.impl('find-and-replace', function (root) {
    css();
    root.innerHTML = '<div class="card"><div class="row cols-2">' +
      '<div class="field"><label for="fr-find">Find</label><input type="text" id="fr-find" class="mono" autocomplete="off" spellcheck="false" placeholder="Text or pattern to find"></div>' +
      '<div class="field"><label for="fr-rep">Replace with</label><input type="text" id="fr-rep" class="mono" autocomplete="off" spellcheck="false" placeholder="Leave empty to delete matches"></div></div>' +
      '<div class="bt-opts" style="margin-bottom:0">' + chk('fr-re', 'Regular expression', false) + chk('fr-case', 'Match case', false) + chk('fr-word', 'Whole words only', false) +
      '<span class="spacer" style="flex:1"></span><span id="fr-count" aria-live="polite"></span></div>' +
      '<p class="muted small hidden" id="fr-rehint" style="margin:8px 0 0">Regex mode: use $1, $2 or $&lt;name&gt; for groups, $&amp; for the whole match, \\n for a new line.</p>' +
      '<div id="fr-err"></div></div>' +
      '<div class="card"><div class="split">' +
      '<div class="bt-pane"><div class="bt-fhead"><label for="fr-in">Text</label><span class="spacer"></span>' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="undo"', 'undo-2', 'Undo', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<textarea id="fr-in" class="bt-ta-xl" spellcheck="false" placeholder="Paste the text to search in…"></textarea></div>' +
      '<div class="bt-pane"><div class="bt-fhead">' + seg('fr-view', [['hl', 'Matches'], ['res', 'Result']], 'hl', 'Preview') + '<span class="spacer"></span>' +
      btn('data-a="apply"', 'replace', 'Replace all', 'btn-primary') + btn('data-a="copy"', 'copy', 'Copy result') + btn('data-a="dl"', 'download', 'Download') + '</div>' +
      '<div id="fr-prev" class="output bt-scroll" style="min-height:420px;max-height:420px" aria-live="off" aria-label="Preview"></div></div>' +
      '</div></div>';
    var find = BT.$('#fr-find', root), rep = BT.$('#fr-rep', root), ta = BT.$('#fr-in', root), prev = BT.$('#fr-prev', root);
    var count = BT.$('#fr-count', root), err = BT.$('#fr-err', root), view = BT.$('#fr-view', root);
    var u = undoable(ta, BT.$('[data-a="undo"]', root));
    var LIMIT = 10000, last = { result: '' };

    function compute() {
      var t = ta.value, f = find.value;
      var isRe = BT.$('#fr-re', root).checked, mc = BT.$('#fr-case', root).checked, whole = BT.$('#fr-word', root).checked;
      BT.$('#fr-rehint', root).classList.toggle('hidden', !isRe);
      err.innerHTML = '';
      if (!f) return { matches: [], result: t, none: true };
      var re, src;
      try {
        if (isRe) {
          src = whole ? '\\b(?:' + f + ')\\b' : f;
          re = new RegExp(src, 'g' + (mc ? '' : 'i') + 'm');
        } else {
          src = escRe(f);
          if (whole) src = '(?<![\\p{L}\\p{M}\\p{N}_])' + src + '(?![\\p{L}\\p{M}\\p{N}_])';
          re = new RegExp(src, 'gu' + (mc ? '' : 'i'));
        }
      } catch (e) {
        err.innerHTML = '<div class="notice error" style="margin-top:12px">' + BT.icon('info') + '<span>Invalid regular expression: ' + esc(e.message.replace(/^Invalid regular expression: /, '')) + '</span></div>';
        return { matches: [], result: t, error: true };
      }
      var ms = allMatches(re, t, LIMIT);
      var r = rep.value;
      if (isRe) r = r.replace(/\\(n|t|\\)/g, function (a, c) { return c === 'n' ? '\n' : c === 't' ? '\t' : '\\'; });
      var parts = [], pos = 0, result = '';
      ms.forEach(function (m) {
        var with_ = isRe ? expandRep(r, m, m.index, t) : r;
        parts.push({ s: t.slice(pos, m.index), m: m[0], r: with_ });
        pos = m.index + m[0].length;
      });
      var tail = t.slice(pos);
      result = parts.map(function (p) { return p.s + p.r; }).join('') + tail;
      return { matches: ms, parts: parts, tail: tail, result: result };
    }
    function render() {
      var c = compute(), v = segVal(view);
      last = c;
      var n = c.matches.length;
      count.innerHTML = c.none || c.error ? '' : '<span class="badge ' + (n ? 'ok' : 'warn') + '">' + (n >= LIMIT ? LIMIT + '+' : BT.fmtNum(n, 0)) + ' match' + (n === 1 ? '' : 'es') + '</span>';
      if (!ta.value) { prev.innerHTML = '<span class="muted">Matches are highlighted here as you type.</span>'; return; }
      if (c.none || c.error || !n) { prev.textContent = ta.value; return; }
      var html = '';
      c.parts.forEach(function (p, i) {
        html += esc(p.s);
        if (v === 'hl') html += '<mark class="bt-hl' + (i % 2 ? ' alt' : '') + '">' + esc(p.m) + '</mark>';
        else html += p.r ? '<mark class="bt-rep">' + esc(p.r) + '</mark>' : '';
      });
      prev.innerHTML = html + esc(c.tail);
    }
    var deb = BT.debounce(render, 120);
    root.addEventListener('input', deb);
    root.addEventListener('change', render);
    wireSeg(view, render);
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'sample') {
        ta.value = 'Contact us at sales@example.com or support@example.com.\nOur office is in Mumbai. The Mumbai team replies within 24 hours.\nOrder #1042 shipped on 12/03/2025; order #1043 ships on 15/03/2025.';
        find.value = 'Mumbai'; rep.value = 'Pune'; render();
      } else if (a === 'clear') { u.set(''); render(); }
      else if (a === 'undo') { u.undo(); render(); }
      else if (a === 'apply') {
        var c = compute();
        if (!c.matches.length) { BT.toast('No matches to replace', 'error'); return; }
        u.set(c.result); render();
        BT.toast('Replaced ' + plural(c.matches.length, 'match'));
      } else if (a === 'copy') BT.copy(compute().result || '');
      else if (a === 'dl') BT.download(compute().result || '', 'replaced.txt', 'text/plain;charset=utf-8');
    });
    render();
  });

  // =============================================================== text-diff
  /** Myers O(ND) diff on integer arrays. Returns ops: ['=',i,j] | ['-',i] | ['+',j]. */
  function myers(a, b, maxD) {
    var n = a.length, m = b.length, max = n + m;
    var off = max + 1, V = new Int32Array(2 * max + 3), trace = [];
    V[off + 1] = 0;
    for (var d = 0; d <= max; d++) {
      if (d > maxD) return null;
      trace.push(V.slice(off - d - 1, off + d + 2));
      for (var k = -d; k <= d; k += 2) {
        var x = (k === -d || (k !== d && V[off + k - 1] < V[off + k + 1])) ? V[off + k + 1] : V[off + k - 1] + 1;
        var y = x - k;
        while (x < n && y < m && a[x] === b[y]) { x++; y++; }
        V[off + k] = x;
        if (x >= n && y >= m) return backtrack(trace, d, n, m);
      }
    }
    return null;
  }
  function backtrack(trace, D, n, m) {
    var x = n, y = m, ops = [];
    for (var d = D; d > 0; d--) {
      var v = trace[d], base = d + 1, k = x - y;
      var prevK = (k === -d || (k !== d && v[k - 1 + base] < v[k + 1 + base])) ? k + 1 : k - 1;
      var px = v[prevK + base], py = px - prevK;
      while (x > px && y > py) { ops.push(['=', x - 1, y - 1]); x--; y--; }
      if (prevK === k + 1) ops.push(['+', py]); else ops.push(['-', px]);
      x = px; y = py;
    }
    while (x > 0 && y > 0) { ops.push(['=', x - 1, y - 1]); x--; y--; }
    return ops.reverse();
  }
  /** Diff two arrays of strings (compared by key) with prefix/suffix trimming. */
  function diffSeq(A, B, keyFn, maxD) {
    var ids = new Map(), next = 0;
    function id(s) { var k = keyFn ? keyFn(s) : s; var v = ids.get(k); if (v === undefined) { v = next++; ids.set(k, v); } return v; }
    var a = A.map(id), b = B.map(id);
    var pre = 0;
    while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
    var suf = 0;
    while (suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
    var mid = myers(a.slice(pre, a.length - suf), b.slice(pre, b.length - suf), maxD);
    if (!mid) return null;
    var ops = [], i;
    for (i = 0; i < pre; i++) ops.push(['=', i, i]);
    mid.forEach(function (o) {
      if (o[0] === '=') ops.push(['=', o[1] + pre, o[2] + pre]);
      else if (o[0] === '-') ops.push(['-', o[1] + pre]);
      else ops.push(['+', o[1] + pre]);
    });
    for (i = 0; i < suf; i++) ops.push(['=', a.length - suf + i, b.length - suf + i]);
    return ops;
  }
  function tokens(s) { return s.match(/\s+|[\p{L}\p{M}\p{N}_]+|[^\s\p{L}\p{M}\p{N}_]/gu) || []; }
  /** Inline word-level highlight of two changed lines → [oldHtml, newHtml]. */
  function inlineDiff(o, n, keyFn) {
    var A = tokens(o), B = tokens(n);
    if (A.length + B.length > 3000) return null;
    var ops = diffSeq(A, B, keyFn, 1500);
    if (!ops) return null;
    var oh = '', nh = '', same = 0;
    ops.forEach(function (op) {
      if (op[0] === '=') { oh += esc(A[op[1]]); nh += esc(B[op[2]]); same += A[op[1]].trim() ? 1 : 0; }
      else if (op[0] === '-') oh += '<del>' + esc(A[op[1]]) + '</del>';
      else nh += '<ins>' + esc(B[op[1]]) + '</ins>';
    });
    if (!same) return null; // completely different lines: plain colouring reads better
    return [oh.replace(/<\/del><del>/g, ''), nh.replace(/<\/ins><ins>/g, '')];
  }

  BT.impl('text-diff', function (root) {
    css();
    root.innerHTML = '<div class="card"><div class="split">' +
      '<div class="bt-pane"><div class="bt-fhead"><label for="td-a">Original text</label><span class="muted small" id="td-an"></span></div>' +
      '<textarea id="td-a" class="mono bt-ta-lg" spellcheck="false" placeholder="Paste the original version…"></textarea></div>' +
      '<div class="bt-pane"><div class="bt-fhead"><label for="td-b">Changed text</label><span class="muted small" id="td-bn"></span></div>' +
      '<textarea id="td-b" class="mono bt-ta-lg" spellcheck="false" placeholder="Paste the new version…"></textarea></div>' +
      '</div><div class="bt-opts" style="margin:14px 0 0">' +
      chk('td-ws', 'Ignore whitespace', false) + chk('td-case', 'Ignore case', false) + chk('td-words', 'Highlight changed words', true) + chk('td-ctx', 'Only show changes', false) +
      '<span style="flex:1"></span>' + btn('data-a="swap"', 'refresh-cw', 'Swap', 'btn-ghost') + btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') +
      '</div></div>' +
      '<div class="card"><div class="card-title"><div id="td-sum" class="btn-group" aria-live="polite"></div><div class="btn-group">' +
      btn('data-a="copy"', 'copy', 'Copy diff') + btn('data-a="dl"', 'download', 'Download .diff') + '</div></div>' +
      '<div id="td-out"></div></div>';
    var A = BT.$('#td-a', root), B = BT.$('#td-b', root), out = BT.$('#td-out', root), sum = BT.$('#td-sum', root);
    var lastPatch = '';

    function render() {
      var ws = BT.$('#td-ws', root).checked, ic = BT.$('#td-case', root).checked;
      var words = BT.$('#td-words', root).checked, onlyCh = BT.$('#td-ctx', root).checked;
      BT.$('#td-an', root).textContent = A.value ? plural(splitLines(A.value).length, 'line') : '';
      BT.$('#td-bn', root).textContent = B.value ? plural(splitLines(B.value).length, 'line') : '';
      if (!A.value && !B.value) {
        sum.innerHTML = '<h3 style="margin:0">Differences</h3>';
        out.innerHTML = '<p class="muted" style="margin:0">Paste two versions of a text above to see what changed.</p>';
        lastPatch = '';
        return;
      }
      var key = function (s) { if (ws) s = s.replace(/\s+/g, ' ').trim(); if (ic) s = s.toLocaleLowerCase(); return s; };
      var tkey = function (s) { if (ws && !s.trim()) return ' '; return ic ? s.toLocaleLowerCase() : s; };
      var la = splitLines(A.value), lb = splitLines(B.value);
      var ops = diffSeq(la, lb, key, 5000);
      if (!ops) {
        out.innerHTML = '<div class="notice warn">' + BT.icon('info') + '<span>These texts are too different to compare line by line. Try comparing smaller sections.</span></div>';
        sum.innerHTML = '';
        return;
      }
      // Group into rows, pairing deletion/insertion blocks for word-level highlights.
      var rows = [], add = 0, del = 0, eq = 0, patch = [];
      for (var i = 0; i < ops.length;) {
        if (ops[i][0] === '=') { rows.push({ t: 'eq', a: ops[i][1], b: ops[i][2] }); eq++; patch.push('  ' + la[ops[i][1]]); i++; continue; }
        var dels = [], ins = [];
        while (i < ops.length && ops[i][0] !== '=') { if (ops[i][0] === '-') dels.push(ops[i][1]); else ins.push(ops[i][1]); i++; }
        del += dels.length; add += ins.length;
        var pairs = Math.min(dels.length, ins.length), inl = [];
        for (var p = 0; p < pairs; p++) inl.push(words ? inlineDiff(la[dels[p]], lb[ins[p]], tkey) : null);
        dels.forEach(function (d, k) { rows.push({ t: 'del', a: d, html: inl[k] ? inl[k][0] : null }); patch.push('- ' + la[d]); });
        ins.forEach(function (n, k) { rows.push({ t: 'add', b: n, html: inl[k] ? inl[k][1] : null }); patch.push('+ ' + lb[n]); });
      }
      lastPatch = '--- original\n+++ changed\n' + patch.join('\n') + '\n';
      sum.innerHTML = (add || del) ?
        '<span class="bt-pill add">+' + BT.fmtNum(add, 0) + ' added</span><span class="bt-pill del">−' + BT.fmtNum(del, 0) + ' removed</span><span class="bt-pill eq">' + BT.fmtNum(eq, 0) + ' unchanged</span>' :
        '<span class="bt-pill add">' + BT.icon('check') + ' No differences</span>';
      if (!add && !del) {
        out.innerHTML = '<div class="notice ok">' + BT.icon('check') + '<span>The two texts are identical' + (ws || ic ? ' (with the selected ignore options)' : '') + '.</span></div>';
        return;
      }
      // Context collapsing
      var show = rows.map(function () { return true; });
      if (onlyCh) {
        show = rows.map(function () { return false; });
        rows.forEach(function (r, idx) {
          if (r.t === 'eq') return;
          for (var c = Math.max(0, idx - 2); c <= Math.min(rows.length - 1, idx + 2); c++) show[c] = true;
        });
      }
      var html = '', hidden = 0, MAXROWS = 20000, shown = 0;
      rows.forEach(function (r, idx) {
        if (!show[idx]) { hidden++; return; }
        if (hidden) { html += '<tr class="gap"><td colspan="4">⋯ ' + plural(hidden, 'unchanged line') + '</td></tr>'; hidden = 0; }
        if (++shown > MAXROWS) return;
        var txt = r.html != null ? r.html : esc(r.t === 'add' ? lb[r.b] : la[r.a]);
        html += '<tr class="' + r.t + '"><td class="n">' + (r.a != null ? r.a + 1 : '') + '</td><td class="n">' + (r.b != null ? r.b + 1 : '') + '</td>' +
          '<td class="s">' + (r.t === 'add' ? '+' : r.t === 'del' ? '−' : '') + '</td><td class="c">' + (txt || ' ') + '</td></tr>';
      });
      if (hidden) html += '<tr class="gap"><td colspan="4">⋯ ' + plural(hidden, 'unchanged line') + '</td></tr>';
      out.innerHTML = '<div class="bt-diff-wrap"><table class="bt-diff"><caption class="sr-only">Line differences. Columns: original line number, new line number, change, text.</caption><colgroup><col style="width:3.6em"><col style="width:3.6em"><col style="width:1.8em"><col></colgroup><tbody>' + html + '</tbody></table></div>' +
        (shown > MAXROWS ? '<p class="muted small">Showing the first ' + BT.fmtNum(MAXROWS, 0) + ' lines.</p>' : '');
    }
    var deb = BT.debounce(render, 250);
    A.addEventListener('input', deb);
    B.addEventListener('input', deb);
    root.addEventListener('change', render);
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'swap') { var t = A.value; A.value = B.value; B.value = t; render(); }
      else if (a === 'sample') {
        A.value = 'Dear Customer,\n\nThank you for shopping with us.\nYour order #4521 will be delivered in 5 days.\nPayment: Cash on Delivery\n\nRegards,\nTeam Shop';
        B.value = 'Dear Customer,\n\nThank you for shopping with us!\nYour order #4521 will be delivered in 2 days.\nPayment: UPI\nTrack it anytime in the app.\n\nRegards,\nTeam Shop';
        render();
      } else if (a === 'clear') { A.value = ''; B.value = ''; render(); }
      else if (a === 'copy') { if (lastPatch) BT.copy(lastPatch); }
      else if (a === 'dl') { if (lastPatch) BT.download(lastPatch, 'changes.diff', 'text/plain;charset=utf-8'); }
    });
    render();
  });

  // ========================================================== slug-generator
  var SLUG_STOP = new Set('a an the and or but of in on at to for with by from as is are was were be this that these those it its into your our you we'.split(' '));
  var TRANS = { 'ß': 'ss', 'æ': 'ae', 'Æ': 'AE', 'ø': 'o', 'Ø': 'O', 'œ': 'oe', 'Œ': 'OE', 'đ': 'd', 'Đ': 'D', 'ł': 'l', 'Ł': 'L', 'þ': 'th', 'Þ': 'TH', 'ð': 'd', 'ı': 'i', '&': ' and ', '@': ' at ', '₹': ' rs ', '%': ' percent ', '+': ' plus ' };
  function slugify(s, o) {
    s = s.replace(/[ßæÆøØœŒđĐłŁþÞðı&@₹%+]/g, function (c) { return TRANS[c]; });
    s = s.normalize('NFKD').replace(/[̀-ͯ]/g, '').normalize('NFC');
    s = s.replace(/['’`]/g, '');
    if (o.lower) s = s.toLocaleLowerCase();
    var parts = o.ascii ? (s.match(/[A-Za-z0-9]+/g) || []) : (s.match(/[\p{L}\p{M}\p{N}]+/gu) || []);
    if (o.stop) {
      var kept = parts.filter(function (w) { return !SLUG_STOP.has(w.toLowerCase()); });
      if (kept.length) parts = kept;
    }
    var out = parts.join(o.sep);
    if (o.max > 0 && out.length > o.max) {
      var cut = out.slice(0, o.max), at = cut.lastIndexOf(o.sep);
      out = at > o.max * 0.5 ? cut.slice(0, at) : cut;
      out = out.replace(new RegExp(escRe(o.sep) + '+$'), '');
    }
    return out;
  }
  BT.impl('slug-generator', function (root) {
    css();
    root.innerHTML = '<div class="card">' +
      '<div class="field"><div class="bt-fhead"><label for="sg-in">Title or text</label><span class="muted small">One per line for bulk slugs</span><span class="spacer"></span>' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<textarea id="sg-in" style="min-height:120px" placeholder="e.g. 10 Best Places to Visit in Kerala — 2025 Guide!"></textarea></div>' +
      '<div class="row cols-4">' +
      '<div class="field"><span class="label">Separator</span>' + seg('sg-sep', [['-', 'Hyphen -'], ['_', 'Underscore _'], ['.', 'Dot .']], '-', 'Separator') + '</div>' +
      '<div class="field"><label for="sg-max">Max length</label><input type="number" id="sg-max" min="0" max="500" value="80" inputmode="numeric"><span class="hint">0 = no limit</span></div>' +
      '<div class="field"><label for="sg-base">Preview base URL</label><input type="url" id="sg-base" value="https://example.com/blog/" spellcheck="false"></div>' +
      '<div class="field"><span class="label">Options</span><div style="display:flex;flex-direction:column;gap:6px">' +
      chk('sg-lower', 'Lowercase', true) + chk('sg-stop', 'Remove stop words', false) + chk('sg-ascii', 'ASCII only', true) + '</div></div>' +
      '</div></div>' +
      '<div class="card"><div class="card-title"><h3>Slug</h3><div class="btn-group">' + btn('data-a="copy"', 'copy', 'Copy') + btn('data-a="dl"', 'download', 'Download') + '</div></div>' +
      '<div id="sg-out"></div></div>';
    var inp = BT.$('#sg-in', root), out = BT.$('#sg-out', root), sep = BT.$('#sg-sep', root);
    var result = [];
    function update() {
      var o = {
        sep: segVal(sep), max: Math.max(0, Math.floor(BT.num(BT.$('#sg-max', root).value)) || 0),
        lower: BT.$('#sg-lower', root).checked, stop: BT.$('#sg-stop', root).checked, ascii: BT.$('#sg-ascii', root).checked
      };
      var lines = splitLines(inp.value).filter(function (l) { return l.trim(); });
      result = lines.map(function (l) { return slugify(l, o); });
      var base = BT.$('#sg-base', root).value;
      if (!lines.length) { out.innerHTML = '<p class="muted" style="margin:0">Your slug will appear here.</p>'; return; }
      if (lines.length === 1) {
        out.innerHTML = '<div class="output"><div class="bt-slug">' + (esc(result[0]) || '<span class="muted">(empty — try turning off “ASCII only”)</span>') + '</div>' +
          '<div class="bt-url">' + esc(base) + '<b>' + esc(result[0]) + '</b></div></div>' +
          '<p class="muted small" style="margin:8px 0 0">' + result[0].length + ' characters</p>';
      } else {
        out.innerHTML = '<div class="table-wrap bt-scroll"><table class="table"><thead><tr><th>Title</th><th>Slug</th></tr></thead><tbody>' +
          lines.map(function (l, i) { return '<tr><td style="white-space:normal">' + esc(l) + '</td><td class="mono" style="white-space:normal;word-break:break-all">' + esc(result[i]) + '</td></tr>'; }).join('') +
          '</tbody></table></div><p class="muted small" style="margin:8px 0 0">' + plural(lines.length, 'slug') + '</p>';
      }
    }
    wireSeg(sep, update);
    BT.bindInputs(root, update);
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'sample') { inp.value = '10 Best Places to Visit in Kerala — 2025 Guide!\nCafé Crème & Crêpes: A Beginner’s Guide\nGST Rates for Small Businesses (Updated)\nHow to File ITR Online in 5 Easy Steps'; update(); }
      else if (a === 'clear') { inp.value = ''; update(); inp.focus(); }
      else if (a === 'copy') { if (result.length) BT.copy(result.join('\n')); }
      else if (a === 'dl') { if (result.length) BT.download(result.join('\n'), 'slugs.txt', 'text/plain;charset=utf-8'); }
    });
  });

  // ====================================================== whitespace-cleaner
  BT.impl('whitespace-cleaner', function (root) {
    ioTool(root, {
      p: 'wsc', inLabel: 'Messy text', outLabel: 'Clean text', file: 'clean.txt',
      options: chk('wsc-trim', 'Trim each line', true) + chk('wsc-spaces', 'Collapse multiple spaces', true) +
        chk('wsc-blank', 'Collapse blank lines', true) + chk('wsc-empty', 'Remove all empty lines', false) +
        chk('wsc-join', 'Remove line breaks', false) + chk('wsc-tabs', 'Tabs → spaces', true) + chk('wsc-np', 'Remove invisible characters', true),
      sample: '   This   text  was copied   from a PDF.  \n\n\n\tIt has\ttabs,   double  spaces and​ hidden characters.   \n\n\n\n   Lines   also have trailing spaces.     \n',
      run: function (t) {
        if (!t) return { out: '' };
        var g = function (id) { return BT.$('#wsc-' + id, root).checked; };
        var s = t.replace(/\r\n?/g, '\n'), before = t.length, inv = 0;
        if (g('np')) {
          s = s.replace(/[  -   　]/g, ' ');
          s = s.replace(/[​-‍⁠﻿­\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, function () { inv++; return ''; });
        }
        if (g('tabs')) s = s.replace(/\t/g, '    ');
        if (g('spaces')) s = s.replace(/[ \t]{2,}/g, ' ');
        if (g('trim')) s = s.split('\n').map(function (l) { return l.trim(); }).join('\n');
        if (g('empty')) s = s.split('\n').filter(function (l) { return l.trim(); }).join('\n');
        else if (g('blank')) s = s.replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n');
        if (g('join')) s = s.replace(/\s*\n+\s*/g, ' ');
        if (g('trim')) s = s.trim();
        var diff = before - s.length;
        return {
          out: s,
          info: '<span class="badge ' + (diff > 0 ? 'ok' : '') + '">' + plural(Math.max(0, diff), 'character') + ' removed</span>' +
            (inv ? '<span class="badge warn">' + plural(inv, 'invisible character') + ' found</span>' : '')
        };
      }
    });
  });

  // ========================================================== text-to-speech
  BT.impl('text-to-speech', function (root) {
    css();
    var synth = window.speechSynthesis;
    var supported = !!(synth && typeof window.SpeechSynthesisUtterance === 'function');
    function rng(id, label, min, max, step, val) {
      return '<div class="bt-range"><div class="lbl"><label for="' + id + '">' + label + '</label><output id="' + id + '-v" for="' + id + '">' + val + '</output></div>' +
        '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"></div>';
    }
    root.innerHTML = (supported ? '' : '<div class="notice error" style="margin-bottom:16px">' + BT.icon('info') + '<span>Your browser does not support speech synthesis. Try the latest Chrome, Edge or Safari.</span></div>') +
      '<div class="card"><div class="bt-fhead"><label for="tts-in">Text to read aloud</label><span class="muted small" id="tts-n"></span><span class="spacer"></span>' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<textarea id="tts-in" class="bt-ta-lg" placeholder="Type or paste text here…"></textarea>' +
      '<div class="field" style="margin-top:14px"><label for="tts-voice">Voice</label><select id="tts-voice"><option value="">Default voice</option></select>' +
      '<span class="hint" id="tts-vhint">Voices come from your device. Indian English and Hindi voices are listed first.</span></div>' +
      '<div class="row cols-3">' + rng('tts-rate', 'Speed', 0.5, 2, 0.1, 1) + rng('tts-pitch', 'Pitch', 0, 2, 0.1, 1) + rng('tts-vol', 'Volume', 0, 1, 0.05, 1) + '</div>' +
      '<div class="toolbar" style="margin:18px 0 0">' +
      '<button type="button" class="btn btn-primary" data-a="play">' + BT.icon('volume-2') + '<span>Play</span></button>' +
      '<button type="button" class="btn" data-a="pause" disabled>Pause</button>' +
      '<button type="button" class="btn" data-a="resume" disabled>Resume</button>' +
      '<button type="button" class="btn" data-a="stop" disabled>' + BT.icon('square') + '<span>Stop</span></button>' +
      '<span class="spacer"></span><span class="muted small" id="tts-status" aria-live="polite">Ready</span></div>' +
      '<div id="tts-read" class="output bt-read hidden" style="margin-top:14px" aria-hidden="true"></div></div>';
    var ta = BT.$('#tts-in', root), sel = BT.$('#tts-voice', root), status = BT.$('#tts-status', root), read = BT.$('#tts-read', root);
    ['rate', 'pitch', 'vol'].forEach(function (k) {
      var r = BT.$('#tts-' + k, root), o = BT.$('#tts-' + k + '-v', root);
      r.addEventListener('input', function () { o.textContent = (+r.value).toFixed(k === 'vol' ? 2 : 1).replace(/\.?0+$/, '') || '0'; });
    });
    function count() {
      var w = wordList(ta.value).length;
      BT.$('#tts-n', root).textContent = w ? plural(w, 'word') + ' · about ' + fmtMin(w / 130 / (+BT.$('#tts-rate', root).value || 1)) : '';
    }
    ta.addEventListener('input', count);
    BT.$('#tts-rate', root).addEventListener('input', count);
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'sample') { ta.value = 'Welcome to BISCS India. This free tool reads any text aloud using the voices on your device. You can change the voice, speed and pitch, and follow along as each word is highlighted.'; count(); }
      else if (a === 'clear') { stop(); ta.value = ''; count(); }
      else if (a === 'play') play();
      else if (a === 'pause') { synth.pause(); setState('paused'); }
      else if (a === 'resume') { synth.resume(); setState('speaking'); }
      else if (a === 'stop') stop();
    });
    if (!supported) { BT.$$('button[data-a="play"]', root).forEach(function (x) { x.disabled = true; }); return; }

    var voices = [];
    function rank(v) {
      var l = (v.lang || '').replace('_', '-').toLowerCase();
      if (l === 'en-in') return 0;
      if (l === 'hi-in') return 1;
      if (/-in$/.test(l)) return 2;
      if (/^en/.test(l)) return 3;
      return 4;
    }
    function loadVoices() {
      var list = synth.getVoices() || [];
      if (!list.length) return;
      voices = list.slice().sort(function (a, b) { return rank(a) - rank(b) || a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name); });
      var saved = store('bt-tts-voice') || (sel.value || '');
      var groups = [['Indian voices', [0, 1, 2]], ['English', [3]], ['Other languages', [4]]];
      sel.innerHTML = '<option value="">Default voice</option>' + groups.map(function (g) {
        var vs = voices.filter(function (v) { return g[1].indexOf(rank(v)) > -1; });
        if (!vs.length) return '';
        return '<optgroup label="' + g[0] + '">' + vs.map(function (v) {
          return '<option value="' + esc(v.voiceURI || v.name) + '">' + esc(v.name) + ' (' + esc(v.lang) + ')' + (v.localService === false ? ' · online' : '') + '</option>';
        }).join('') + '</optgroup>';
      }).join('');
      if (saved && voices.some(function (v) { return (v.voiceURI || v.name) === saved; })) sel.value = saved;
      else {
        var pref = voices.filter(function (v) { return rank(v) === 0; })[0];
        if (pref) sel.value = pref.voiceURI || pref.name;
      }
      BT.$('#tts-vhint', root).textContent = plural(voices.length, 'voice') + ' available on this device. Indian English and Hindi voices are listed first.';
    }
    loadVoices();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', loadVoices); else synth.onvoiceschanged = loadVoices;
    setTimeout(function () { if (!voices.length) BT.$('#tts-vhint', root).textContent = 'No voices were reported by your browser; the system default voice will be used.'; }, 2000);
    sel.addEventListener('change', function () { store('bt-tts-voice', sel.value); });

    var session = 0, chunks = [], text = '';
    function setState(s) {
      var on = function (a, v) { BT.$('[data-a="' + a + '"]', root).disabled = !v; };
      on('play', true); on('pause', s === 'speaking'); on('resume', s === 'paused'); on('stop', s !== 'idle');
      status.textContent = s === 'speaking' ? 'Speaking…' : s === 'paused' ? 'Paused' : 'Ready';
      read.classList.toggle('hidden', s === 'idle');
    }
    function makeChunks(t) {
      var out = [], re = /[^.!?।\n]+[.!?।]*\s*|\n+/g, m, cur = null;
      while ((m = re.exec(t)) !== null) {
        var piece = m[0];
        if (cur && cur.text.length + piece.length <= 220) cur.text += piece;
        else { cur = { start: m.index, text: piece }; out.push(cur); }
      }
      // Hard-split anything still very long at spaces (some engines stop after ~15s).
      var res = [];
      out.forEach(function (c) {
        var s = c.text, st = c.start;
        while (s.length > 260) {
          var at = s.lastIndexOf(' ', 240);
          if (at < 60) at = 240;
          res.push({ start: st, text: s.slice(0, at) });
          st += at; s = s.slice(at);
        }
        res.push({ start: st, text: s });
      });
      return res.filter(function (c) { return c.text.trim(); });
    }
    function highlight(start, len) {
      if (len <= 0) {
        var m = /^[\p{L}\p{M}\p{N}'’_-]+/u.exec(text.slice(start));
        len = m ? m[0].length : 1;
      }
      read.innerHTML = esc(text.slice(0, start)) + '<mark class="bt-hl">' + esc(text.slice(start, start + len)) + '</mark>' + esc(text.slice(start + len));
      var mk = BT.$('mark', read);
      if (mk) {
        var top = mk.offsetTop - read.offsetTop;
        if (top < read.scrollTop || top > read.scrollTop + read.clientHeight - 30) read.scrollTop = Math.max(0, top - 40);
      }
    }
    function play() {
      text = ta.value;
      if (!text.trim()) { BT.toast('Type or paste some text first', 'error'); ta.focus(); return; }
      synth.cancel();
      var my = ++session;
      chunks = makeChunks(text);
      read.textContent = text;
      setState('speaking');
      var voice = voices.filter(function (v) { return (v.voiceURI || v.name) === sel.value; })[0];
      function next(i) {
        if (my !== session) return;
        if (i >= chunks.length) { setState('idle'); return; }
        var c = chunks[i], gotBoundary = false;
        var u = new SpeechSynthesisUtterance(c.text);
        if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-IN';
        u.rate = +BT.$('#tts-rate', root).value;
        u.pitch = +BT.$('#tts-pitch', root).value;
        u.volume = +BT.$('#tts-vol', root).value;
        u.onstart = function () { if (my === session && !gotBoundary) { read.innerHTML = esc(text.slice(0, c.start)) + '<mark class="bt-hl alt">' + esc(c.text) + '</mark>' + esc(text.slice(c.start + c.text.length)); } };
        u.onboundary = function (e) {
          if (my !== session || (e.name && e.name !== 'word')) return;
          gotBoundary = true;
          highlight(c.start + e.charIndex, e.charLength || 0);
        };
        u.onend = function () { next(i + 1); };
        u.onerror = function (e) {
          if (my !== session) return;
          if (e.error && e.error !== 'interrupted' && e.error !== 'canceled') BT.toast('Speech error: ' + e.error, 'error');
          next(i + 1);
        };
        synth.speak(u);
      }
      next(0);
    }
    function stop() { session++; synth.cancel(); setState('idle'); }
    window.addEventListener('beforeunload', function () { synth.cancel(); });
    setState('idle');
    count();
  });

  // ======================================================== markdown-preview
  var MD_SAMPLE = '# Markdown Preview\n\nWrite **Markdown** on the left and see the *formatted* result on the right — instantly.\n\n## Features\n\n- Live preview as you type\n- GitHub-flavoured tables and task lists\n- Export a clean, styled **HTML** file\n\n### Task list\n\n- [x] Write the draft\n- [ ] Review with the team\n\n### Table\n\n| Plan | Price (₹) | Users |\n|------|----------:|:-----:|\n| Free | 0 | 1 |\n| Pro | 499 | 5 |\n\n> Tip: Markdown is plain text, so it works great with Git.\n\n```js\nfunction greet(name) {\n  return `Namaste, ${name}!`;\n}\n```\n\nVisit [BISCS India](https://www.biscsindia.com) for more free tools.\n';
  BT.impl('markdown-preview', function (root) {
    css();
    root.innerHTML = '<div class="card"><div class="toolbar">' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '<span class="spacer"></span>' +
      btn('data-a="copymd"', 'copy', 'Copy Markdown') + btn('data-a="copyhtml"', 'code-xml', 'Copy HTML') +
      btn('data-a="dlhtml"', 'download', 'Export HTML', 'btn-primary') + btn('data-a="dlmd"', 'download', '.md') + '</div>' +
      '<div class="split"><div class="bt-pane"><div class="bt-fhead"><label for="md-in">Markdown</label><span class="muted small" id="md-n"></span></div>' +
      '<textarea id="md-in" class="mono bt-ta-xl" spellcheck="false" placeholder="# Start writing Markdown…"></textarea></div>' +
      '<div class="bt-pane"><div class="bt-fhead"><span class="lbl" id="md-pl">Preview</span></div>' +
      '<div id="md-out" class="bt-md" aria-labelledby="md-pl"><p class="muted">Loading Markdown engine…</p></div></div></div></div>';
    var ta = BT.$('#md-in', root), out = BT.$('#md-out', root);
    var ready = false, html = '';
    ta.value = MD_SAMPLE;
    function render() {
      BT.$('#md-n', root).textContent = plural(wordList(ta.value).length, 'word');
      if (!ready) return;
      html = window.DOMPurify.sanitize(window.marked.parse(ta.value, { gfm: true }));
      out.innerHTML = html || '<p class="muted">Nothing to preview yet.</p>';
      BT.$$('a[href]', out).forEach(function (a) { a.target = '_blank'; a.rel = 'noopener noreferrer'; a.style.textDecoration = 'underline'; });
      BT.$$('input[type=checkbox]', out).forEach(function (c) {
        var li = c.closest('li');
        c.setAttribute('aria-label', li ? li.textContent.trim().slice(0, 80) || 'Task' : 'Task');
      });
    }
    Promise.all([BT.loadLib('marked'), BT.loadLib('dompurify')]).then(function () { ready = true; render(); }, function (e) {
      out.innerHTML = '<div class="notice error">' + BT.icon('info') + '<span>' + esc(e.message) + '. Check your connection and refresh.</span></div>';
    });
    ta.addEventListener('input', BT.debounce(render, ta.value.length > 50000 ? 250 : 60));
    function title() { var m = /^#{1,3}\s+(.+)$/m.exec(ta.value); return m ? m[1].replace(/[*_`#]/g, '').trim() : 'Document'; }
    function doc() {
      return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + esc(title()) + '</title>\n<style>\n' +
        'body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.65;color:#1f2330;max-width:780px;margin:40px auto;padding:0 20px}\n' +
        'h1,h2{border-bottom:1px solid #e5e7eb;padding-bottom:.3em}a{color:#4f46e5}img{max-width:100%}\n' +
        'code{font-family:ui-monospace,Menlo,Consolas,monospace;background:#f3f4f6;padding:.1em .35em;border-radius:5px;font-size:.9em}\n' +
        'pre{background:#f3f4f6;padding:14px;border-radius:8px;overflow:auto}pre code{background:none;padding:0}\n' +
        'blockquote{margin:0 0 1em;padding:4px 16px;border-left:4px solid #4f46e5;color:#4b5563;background:#f9fafb}\n' +
        'table{border-collapse:collapse;margin-bottom:1em}th,td{border:1px solid #e5e7eb;padding:6px 12px}th{background:#f9fafb}\n' +
        'hr{border:0;border-top:1px solid #e5e7eb}\n</style>\n</head>\n<body>\n' + html + '\n</body>\n</html>\n';
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'sample') { ta.value = MD_SAMPLE; render(); }
      else if (a === 'clear') { ta.value = ''; render(); ta.focus(); }
      else if (a === 'copymd') BT.copy(ta.value);
      else if (a === 'copyhtml') { if (ready) BT.copy(html, 'HTML copied'); }
      else if (a === 'dlhtml') { if (ready) BT.download(doc(), BT.baseName(slugify(title(), { sep: '-', lower: true, ascii: true, max: 60 }) || 'document') + '.html', 'text/html;charset=utf-8'); }
      else if (a === 'dlmd') BT.download(ta.value, (slugify(title(), { sep: '-', lower: true, ascii: true, max: 60 }) || 'document') + '.md', 'text/markdown;charset=utf-8');
    });
    render();
  });

  // ==================================================== fancy-text-generator
  function cp(n) { return String.fromCodePoint(n); }
  function mathMap(U, L, D, exc) {
    return function (ch) {
      if (exc && exc[ch]) return exc[ch];
      var c = ch.charCodeAt(0);
      if (ch.length === 1) {
        if (c >= 65 && c <= 90 && U) return cp(U + c - 65);
        if (c >= 97 && c <= 122 && L) return cp(L + c - 97);
        if (c >= 48 && c <= 57 && D) return cp(D + c - 48);
      }
      return ch;
    };
  }
  function exMap(o) { var r = {}; Object.keys(o).forEach(function (k) { r[k] = cp(o[k]); }); return r; }
  function charMap(fn) { return function (s) { return Array.from(s).map(fn).join(''); }; }
  function combine(mark) { return function (s) { return graphemes(s).map(function (g) { return g === '\n' ? g : g + mark; }).join(''); }; }
  var SMALLCAPS = { a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 'ꜱ', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ' };
  var FANCY = [
    ['Bold', charMap(mathMap(0x1D400, 0x1D41A, 0x1D7CE))],
    ['Italic', charMap(mathMap(0x1D434, 0x1D44E, 0, exMap({ h: 0x210E })))],
    ['Bold italic', charMap(mathMap(0x1D468, 0x1D482, 0x1D7CE))],
    ['Script', charMap(mathMap(0x1D49C, 0x1D4B6, 0, exMap({ B: 0x212C, E: 0x2130, F: 0x2131, H: 0x210B, I: 0x2110, L: 0x2112, M: 0x2133, R: 0x211B, e: 0x212F, g: 0x210A, o: 0x2134 })))],
    ['Bold script', charMap(mathMap(0x1D4D0, 0x1D4EA, 0x1D7CE))],
    ['Fraktur', charMap(mathMap(0x1D504, 0x1D51E, 0, exMap({ C: 0x212D, H: 0x210C, I: 0x2111, R: 0x211C, Z: 0x2128 })))],
    ['Bold fraktur', charMap(mathMap(0x1D56C, 0x1D586, 0x1D7CE))],
    ['Double-struck', charMap(mathMap(0x1D538, 0x1D552, 0x1D7D8, exMap({ C: 0x2102, H: 0x210D, N: 0x2115, P: 0x2119, Q: 0x211A, R: 0x211D, Z: 0x2124 })))],
    ['Monospace', charMap(mathMap(0x1D670, 0x1D68A, 0x1D7F6))],
    ['Sans-serif', charMap(mathMap(0x1D5A0, 0x1D5BA, 0x1D7E2))],
    ['Sans bold', charMap(mathMap(0x1D5D4, 0x1D5EE, 0x1D7EC))],
    ['Sans italic', charMap(mathMap(0x1D608, 0x1D622, 0x1D7E2))],
    ['Sans bold italic', charMap(mathMap(0x1D63C, 0x1D656, 0x1D7EC))],
    ['Bubble', charMap(function (ch) {
      var c = ch.charCodeAt(0);
      if (ch.length !== 1) return ch;
      if (c >= 65 && c <= 90) return cp(0x24B6 + c - 65);
      if (c >= 97 && c <= 122) return cp(0x24D0 + c - 97);
      if (c === 48) return cp(0x24EA);
      if (c >= 49 && c <= 57) return cp(0x2460 + c - 49);
      return ch;
    })],
    ['Bubble filled', charMap(function (ch) {
      var c = ch.charCodeAt(0);
      if (ch.length !== 1) return ch;
      if (c >= 97 && c <= 122) c -= 32;
      if (c >= 65 && c <= 90) return cp(0x1F150 + c - 65);
      if (c === 48) return cp(0x24FF);
      if (c >= 49 && c <= 57) return cp(0x2776 + c - 49);
      return ch;
    })],
    ['Squared', charMap(function (ch) {
      var c = ch.charCodeAt(0);
      if (ch.length !== 1) return ch;
      if (c >= 97 && c <= 122) c -= 32;
      return c >= 65 && c <= 90 ? cp(0x1F130 + c - 65) : ch;
    })],
    ['Squared filled', charMap(function (ch) {
      var c = ch.charCodeAt(0);
      if (ch.length !== 1) return ch;
      if (c >= 97 && c <= 122) c -= 32;
      return c >= 65 && c <= 90 ? cp(0x1F170 + c - 65) : ch;
    })],
    ['Small caps', charMap(function (ch) { return SMALLCAPS[ch.toLowerCase()] && /[a-z]/i.test(ch) ? SMALLCAPS[ch.toLowerCase()] : ch; })],
    ['Wide (fullwidth)', charMap(function (ch) {
      var c = ch.charCodeAt(0);
      if (ch === ' ') return '　';
      return ch.length === 1 && c >= 0x21 && c <= 0x7E ? cp(c + 0xFEE0) : ch;
    })],
    ['Upside down', function (s) { return upsideDown(s); }],
    ['Strikethrough', combine('̶')],
    ['Underline', combine('̲')],
    ['Double underline', combine('̳')],
    ['Slashed', combine('̸')],
    ['Spaced out', function (s) { return graphemes(s).join(' '); }]
  ];
  BT.impl('fancy-text-generator', function (root) {
    css();
    root.innerHTML = '<div class="card"><div class="field" style="margin:0"><label for="ft-in">Your text</label>' +
      '<input type="text" id="ft-in" value="BISCS Fancy Text 2025" maxlength="500" autocomplete="off" style="font-size:1.1rem;min-height:52px"></div>' +
      '<p class="muted small" style="margin:10px 0 0">Click any style to copy it. These are Unicode characters, so they work in Instagram bios, WhatsApp, X and most apps. Fancy letters only cover A–Z and 0–9.</p></div>' +
      '<div class="card"><div id="ft-list" class="bt-fancy"></div></div>';
    var inp = BT.$('#ft-in', root), list = BT.$('#ft-list', root), vals = [];
    function render() {
      var t = inp.value || 'Type something';
      vals = FANCY.map(function (f) { return f[1](t); });
      list.innerHTML = FANCY.map(function (f, i) {
        return '<div class="bt-fancy-row" data-i="' + i + '" role="button" tabindex="0" aria-label="Copy ' + esc(f[0]) + ' style">' +
          '<div class="bd"><div class="nm">' + esc(f[0]) + '</div><div class="tx">' + esc(vals[i]) + '</div></div>' +
          '<span class="btn btn-sm" aria-hidden="true">' + BT.icon('copy') + '<span>Copy</span></span></div>';
      }).join('');
    }
    function pick(row) { var i = +row.getAttribute('data-i'); BT.copy(vals[i], FANCY[i][0] + ' text copied'); }
    list.addEventListener('click', function (e) { var r = e.target.closest('[data-i]'); if (r) pick(r); });
    list.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-i]')) { e.preventDefault(); pick(e.target); } });
    inp.addEventListener('input', render);
    render();
  });

  // ========================================================== text-extractor
  var EXTRACT = {
    email: {
      label: 'Emails', re: /[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}/g,
      norm: function (s, o) { s = s.replace(/^[.]+|[.]+$/g, ''); return o.lower ? s.toLowerCase() : s; }
    },
    url: {
      label: 'URLs', re: /\b(?:https?:\/\/|www\.)[^\s<>"'`]+/gi,
      norm: function (s) {
        s = s.replace(/[.,;:!?'"»”’]+$/, '');
        while (/\)$/.test(s) && (s.match(/\(/g) || []).length < (s.match(/\)/g) || []).length) s = s.slice(0, -1);
        while (/\]$/.test(s) && (s.match(/\[/g) || []).length < (s.match(/\]/g) || []).length) s = s.slice(0, -1);
        return s;
      }
    },
    phone: {
      label: 'Phones', re: /(?<![\d+])(?:(?:\+|00)91[\s.-]?|0)?[6-9](?:[ .-]?\d){9}(?![\d])/g,
      norm: function (s, o) {
        if (!o.fmt) return s.trim();
        var d = s.replace(/\D/g, '').slice(-10);
        return '+91 ' + d.slice(0, 5) + ' ' + d.slice(5);
      }
    },
    hashtag: { label: 'Hashtags', re: /(?<![\p{L}\p{M}\p{N}_&#])#[\p{L}\p{M}\p{N}_]*[\p{L}_][\p{L}\p{M}\p{N}_]*/gu, norm: function (s) { return s; } },
    mention: { label: 'Mentions', re: /(?<![\p{L}\p{M}\p{N}_.@])@[A-Za-z0-9_](?:[A-Za-z0-9_.]*[A-Za-z0-9_])?(?![@\w]|\.[A-Za-z])/gu, norm: function (s) { return s; } },
    number: { label: 'Numbers', re: /(?<![\p{L}\d.,])-?\d{1,3}(?:,\d{2,3})+(?:\.\d+)?(?!\d)|(?<![\p{L}\d.,])-?\d+(?:\.\d+)?(?!\d)/gu, norm: function (s) { return s; } }
  };
  BT.impl('text-extractor', function (root) {
    css();
    var keys = Object.keys(EXTRACT), cur = 'email', results = {};
    root.innerHTML = '<div class="card"><div class="bt-fhead"><label for="te-in">Text to scan</label><span class="spacer"></span>' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<textarea id="te-in" class="bt-ta-lg" placeholder="Paste any text, HTML, CSV or email thread…"></textarea>' +
      '<div class="bt-opts" style="margin:14px 0 0">' + chk('te-dedupe', 'Remove duplicates', true) + chk('te-sort', 'Sort A → Z', false) +
      chk('te-lower', 'Lowercase emails', true) + chk('te-fmt', 'Format phones as +91 XXXXX XXXXX', true) + '</div></div>' +
      '<div class="card"><div class="toolbar"><div class="seg" id="te-tabs" role="tablist" aria-label="Extracted lists"></div><span class="spacer"></span>' +
      btn('data-a="copy"', 'copy', 'Copy') + btn('data-a="dl"', 'download', 'Download') + btn('data-a="csv"', 'sheet', 'All as CSV') + '</div>' +
      '<label for="te-out" class="sr-only">Extracted items</label><textarea id="te-out" class="mono bt-ta-lg" readonly placeholder="Nothing found yet"></textarea></div>';
    var ta = BT.$('#te-in', root), tabs = BT.$('#te-tabs', root), out = BT.$('#te-out', root);
    function run() {
      var o = { lower: BT.$('#te-lower', root).checked, fmt: BT.$('#te-fmt', root).checked };
      var dd = BT.$('#te-dedupe', root).checked, so = BT.$('#te-sort', root).checked, t = ta.value;
      keys.forEach(function (k) {
        var ex = EXTRACT[k], list = (t.match(ex.re) || []).map(function (s) { return ex.norm(s, o); }).filter(Boolean);
        if (dd) { var seen = new Set(); list = list.filter(function (x) { var key = x.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; }); }
        if (so) list.sort(new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare);
        results[k] = list;
      });
      tabs.innerHTML = keys.map(function (k) {
        var on = k === cur;
        return '<button type="button" role="tab" data-v="' + k + '" class="' + (on ? 'active' : '') + '" aria-selected="' + on + '" aria-pressed="' + on + '">' +
          EXTRACT[k].label + ' <span class="badge' + (results[k].length ? ' ok' : '') + '" style="margin-left:4px">' + results[k].length + '</span></button>';
      }).join('');
      out.value = results[cur].join('\n');
    }
    tabs.addEventListener('click', function (e) { var b = e.target.closest('[data-v]'); if (b) { cur = b.getAttribute('data-v'); run(); } });
    ta.addEventListener('input', BT.debounce(run, 120));
    root.addEventListener('change', run);
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'sample') {
        ta.value = 'Hi team, please contact Priya at priya.sharma@example.co.in or Rahul (RAHUL@Example.com) for details.\n' +
          'Call +91 98765 43210, 09123456789 or 8800-123-456 before 5 pm. Office landline: 022 2345 6789.\n' +
          'Docs: https://www.example.com/docs?ref=mail and www.biscsindia.com/tools (see also https://en.wikipedia.org/wiki/India_(disambiguation)).\n' +
          'Budget: ₹1,25,000 for Q3, 15.5% growth, 42 new users. #DigitalIndia #StartupIndia #डिजिटल_भारत — thanks @biscs_india!\n' +
          'Duplicate: priya.sharma@example.co.in';
        run();
      } else if (a === 'clear') { ta.value = ''; run(); ta.focus(); }
      else if (a === 'copy') { if (out.value) BT.copy(out.value, plural(results[cur].length, EXTRACT[cur].label.toLowerCase().replace(/s$/, '')) + ' copied'); else BT.toast('Nothing to copy', 'error'); }
      else if (a === 'dl') { if (out.value) BT.download(out.value, EXTRACT[cur].label.toLowerCase() + '.txt', 'text/plain;charset=utf-8'); else BT.toast('Nothing to download', 'error'); }
      else if (a === 'csv') {
        var rows = ['type,value'];
        keys.forEach(function (k) { results[k].forEach(function (v) { rows.push(EXTRACT[k].label.replace(/s$/, '').toLowerCase() + ',"' + v.replace(/"/g, '""') + '"'); }); });
        if (rows.length < 2) { BT.toast('Nothing found to export', 'error'); return; }
        BT.download('﻿' + rows.join('\r\n'), 'extracted.csv', 'text/csv;charset=utf-8');
      }
    });
    run();
  });

  // ------------------------------------------------------------ boot fallback
  BT.impl = coreImpl;
  function bootFallback() {
    var root = document.getElementById('tool-root');
    if (!root || root.getAttribute('data-bt-started')) return;
    var id = root.getAttribute('data-tool'), fn = LOCAL[id];
    if (!fn || !root.querySelector('.notice.error')) return;
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
