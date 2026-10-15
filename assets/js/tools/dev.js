/*
 * BISCS Tools — Developer tools.
 * json-formatter, json-to-csv, csv-to-json, base64-encoder, url-encoder,
 * html-entity-encoder, hash-generator, uuid-generator, jwt-decoder,
 * regex-tester, timestamp-converter, color-converter, css-gradient-generator,
 * box-shadow-generator, code-minifier.
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
    '.bt-opts select{width:auto;min-height:34px;padding:5px 10px}',
    '.bt-inl{display:inline-flex;align-items:center;gap:8px;font-size:.88rem;font-weight:600;color:var(--text-2)}',
    '.bt-fhead{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-height:34px;margin-bottom:6px}',
    '.bt-fhead>label,.bt-fhead>.lbl{font-size:.85rem;font-weight:600;color:var(--text-2)}',
    '.bt-fhead .spacer{flex:1}',
    '.bt-pane{display:flex;flex-direction:column;min-width:0}',
    '.bt-pane textarea{flex:1}',
    '.bt-ta-lg{min-height:280px}',
    '.bt-ta-xl{min-height:440px}',
    '.bt-info{margin-top:12px;font-size:.88rem;color:var(--text-2);display:flex;flex-wrap:wrap;gap:8px;align-items:center;min-height:22px}',
    '.bt-file{position:relative;overflow:hidden}',
    '.bt-file input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%}',
    '.bt-file:focus-within{box-shadow:var(--ring)}',
    '.bt-drop{outline:2px dashed var(--brand);outline-offset:-6px}',
    '.bt-err-line{margin-top:10px;font-family:var(--mono);font-size:.82rem;white-space:pre;overflow:auto;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:10px;color:var(--text)}',
    '.bt-err-line b{color:var(--danger)}',
    '.bt-tree{font-family:var(--mono);font-size:.84rem;line-height:1.6;min-height:440px;max-height:640px;overflow:auto;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 14px}',
    '.bt-tree details>div{padding-left:18px;border-left:1px dashed var(--border-strong);margin-left:5px}',
    '.bt-tree summary{cursor:pointer;list-style-position:outside}',
    '.bt-tree .k{color:var(--brand-2);font-weight:600}.bt-tree .s{color:var(--ok)}.bt-tree .n{color:var(--brand)}.bt-tree .b{color:var(--warn)}.bt-tree .z{color:var(--text-3)}.bt-tree .m{color:var(--text-3);font-size:.78rem}',
    '.bt-kv{display:grid;grid-template-columns:minmax(110px,max-content) 1fr auto;gap:0;border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden}',
    '.bt-kv>div{padding:9px 12px;border-bottom:1px solid var(--border);min-width:0;display:flex;align-items:center}',
    '.bt-kv>div:nth-last-child(-n+3){border-bottom:0}',
    '.bt-kv .k{background:var(--surface-2);font-weight:600;font-size:.85rem;color:var(--text-2)}',
    '.bt-kv .v{font-family:var(--mono);font-size:.86rem;word-break:break-all}',
    '.bt-kv .c{padding:4px 8px}',
    '.bt-hash{font-family:var(--mono);font-size:.86rem;word-break:break-all}',
    'tr.bt-match td{background:var(--ok-soft)}',
    '.bt-jwt{font-family:var(--mono);font-size:.86rem;word-break:break-all;line-height:1.6}',
    '.bt-jwt .h{color:var(--danger)}.bt-jwt .p{color:var(--brand-2)}.bt-jwt .s{color:var(--ok)}',
    '.bt-rx{display:flex;align-items:stretch}',
    '.bt-rx .addon{display:grid;place-items:center;padding:0 12px;background:var(--surface-2);border:1px solid var(--border-strong);color:var(--text-3);font-family:var(--mono);font-weight:700}',
    '.bt-rx .addon:first-child{border-radius:var(--radius-sm) 0 0 var(--radius-sm);border-right:0}',
    '.bt-rx .addon:last-child{border-radius:0 var(--radius-sm) var(--radius-sm) 0;border-left:0;min-width:48px}',
    '.bt-rx input{border-radius:0;font-family:var(--mono)}',
    '.bt-hlbox{white-space:pre-wrap;word-break:break-word;min-height:120px;max-height:420px;overflow:auto;line-height:1.6}',
    'mark.bt-m{background:color-mix(in srgb,var(--warn) 32%,transparent);color:inherit;border-radius:3px;box-shadow:0 0 0 1px color-mix(in srgb,var(--warn) 55%,transparent)}',
    'mark.bt-m.alt{background:color-mix(in srgb,var(--brand) 26%,transparent);box-shadow:0 0 0 1px color-mix(in srgb,var(--brand) 50%,transparent)}',
    'mark.bt-m.z{display:inline-block;width:2px;height:1.1em;vertical-align:-2px;padding:0;background:var(--danger);box-shadow:none}',
    '.bt-cheat{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:4px 16px;font-size:.85rem;margin-top:10px}',
    '.bt-cheat code{font-family:var(--mono);color:var(--brand);font-weight:600;margin-right:6px}',
    '.bt-big{font-family:var(--mono);font-size:clamp(1.4rem,4vw,2rem);font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;word-break:break-all}',
    '.bt-swatch{height:150px;border-radius:var(--radius);border:1px solid var(--border);display:flex;align-items:flex-end;justify-content:space-between;padding:14px 16px;font-weight:700;gap:8px;flex-wrap:wrap}',
    '.bt-pal{display:grid;grid-template-columns:repeat(11,minmax(0,1fr));gap:4px}',
    '.bt-pal button{height:46px;border:1px solid var(--border);border-radius:8px;cursor:pointer;font:inherit;font-size:.62rem;font-family:var(--mono);padding:0;display:flex;align-items:flex-end;justify-content:center;padding-bottom:3px;overflow:hidden}',
    '@media (max-width:640px){.bt-pal button{font-size:0;height:38px}}',
    '.bt-pal button:hover{transform:translateY(-2px);box-shadow:var(--shadow)}',
    '.bt-cbox{border-radius:var(--radius-sm);padding:14px 16px;border:1px solid var(--border)}',
    '.bt-cbox .big{font-size:1.5rem;font-weight:800}',
    '.bt-grad{height:260px;border-radius:var(--radius);border:1px solid var(--border)}',
    '.bt-stop{display:grid;grid-template-columns:auto auto 1fr auto auto;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)}',
    '.bt-stop:last-child{border-bottom:0}',
    '.bt-stop input[type=text]{width:100px;min-height:36px;padding:6px 8px;font-family:var(--mono);font-size:.85rem}',
    '.bt-stop .pos{font-variant-numeric:tabular-nums;font-size:.85rem;color:var(--text-2);width:3.2em;text-align:right}',
    '.bt-presets{display:flex;flex-wrap:wrap;gap:8px}',
    '.bt-presets button{width:54px;height:36px;border-radius:9px;border:1px solid var(--border);cursor:pointer}',
    '.bt-presets button:hover{transform:translateY(-2px)}',
    '.bt-shadow-stage{display:grid;place-items:center;min-height:320px;border-radius:var(--radius);border:1px solid var(--border);padding:40px}',
    '.bt-shadow-box{width:min(180px,60%);aspect-ratio:1;display:grid;place-items:center;font-weight:700;color:var(--text-3)}',
    '.bt-rn{display:grid;grid-template-columns:72px 1fr 92px;gap:10px;align-items:center;margin-bottom:10px}',
    '.bt-rn label{font-size:.85rem;font-weight:600;color:var(--text-2)}',
    '.bt-rn input[type=number]{min-height:36px;padding:6px 8px}',
    '.bt-code{font-family:var(--mono);font-size:.86rem;white-space:pre-wrap;overflow-wrap:anywhere;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px}'
  ].join('\n');

  function css() {
    if (document.getElementById('bt-dev-css')) return;
    var s = document.createElement('style');
    s.id = 'bt-dev-css';
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
  function fileBtn(id, accept, label) {
    return '<span class="btn btn-sm btn-ghost bt-file">' + BT.icon('upload') + '<span>' + (label || 'Upload') + '</span>' +
      '<input type="file" id="' + id + '" accept="' + accept + '" aria-label="' + esc(label || 'Upload file') + '"></span>';
  }
  function seg(id, items, active, label) {
    return '<div class="seg" role="group" aria-label="' + esc(label) + '" id="' + id + '">' + items.map(function (it) {
      var on = it[0] === active;
      return '<button type="button" data-v="' + it[0] + '" class="' + (on ? 'active' : '') + '" aria-pressed="' + on + '">' + esc(it[1]) + '</button>';
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
  function plural(n, w) { return BT.fmtNum(n, 0) + ' ' + w + (n === 1 ? '' : 's'); }
  function notice(kind, msg) { return '<div class="notice ' + kind + '">' + BT.icon(kind === 'ok' ? 'check' : 'info') + '<span>' + msg + '</span></div>'; }
  function bytesLen(s) { return new TextEncoder().encode(s).length; }
  function onClickA(root, map) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (b && map[b.getAttribute('data-a')]) map[b.getAttribute('data-a')](b, e);
    });
  }
  /** Wire a file <input> and drag-and-drop on a textarea to load text files. */
  function textFileInput(input, ta, cb) {
    function load(f) {
      if (!f) return;
      if (f.size > 50 * 1024 * 1024) { BT.toast('File is larger than 50 MB', 'error'); return; }
      BT.readFile(f, 'text').then(function (t) { ta.value = t.replace(/^﻿/, ''); cb(f); }, function () { BT.toast('Could not read that file', 'error'); });
    }
    if (input) input.addEventListener('change', function () { load(input.files[0]); input.value = ''; });
    ta.addEventListener('dragover', function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') > -1) { e.preventDefault(); ta.classList.add('bt-drop'); } });
    ta.addEventListener('dragleave', function () { ta.classList.remove('bt-drop'); });
    ta.addEventListener('drop', function (e) {
      ta.classList.remove('bt-drop');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) { e.preventDefault(); load(e.dataTransfer.files[0]); }
    });
  }
  function bytesToB64(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function b64ToBytes(b64) {
    var bin = atob(b64), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  }
  function b64urlDecode(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
    if (s.length % 4 === 1) throw new Error('Invalid Base64 length');
    while (s.length % 4) s += '=';
    return b64ToBytes(s);
  }
  function utf8(bytes, fatal) { return new TextDecoder('utf-8', { fatal: !!fatal }).decode(bytes); }
  function hex(bytes) { var s = ''; for (var i = 0; i < bytes.length; i++) s += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16); return s; }
  function tableHTML(head, rows, max) {
    max = max || 100;
    return '<div class="table-wrap" style="max-height:420px;overflow:auto"><table class="table"><thead><tr>' +
      head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.slice(0, max).map(function (r) {
        return '<tr>' + head.map(function (h, i) {
          var v = r[i];
          var s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
          if (s.length > 120) s = s.slice(0, 117) + '…';
          return '<td>' + (v === null ? '<span class="muted">null</span>' : esc(s)) + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>' +
      (rows.length > max ? '<p class="muted small" style="margin:8px 0 0">Showing the first ' + max + ' of ' + BT.fmtNum(rows.length, 0) + ' rows.</p>' : '');
  }

  // ============================================================ JSON helpers
  /** Tiny strict JSON scanner used only to locate the first syntax error reliably in every browser. */
  function locateJsonError(t) {
    var i = 0, n = t.length;
    function fail(msg) { throw { pos: i, msg: msg }; }
    function ws() { while (i < n && (t[i] === ' ' || t[i] === '\t' || t[i] === '\n' || t[i] === '\r')) i++; }
    function tok() { return i >= n ? 'end of input' : '“' + t[i] + '”'; }
    function str() {
      i++;
      while (i < n) {
        var c = t[i];
        if (c === '"') { i++; return; }
        if (c === '\\') {
          i++;
          if (t[i] === 'u') { if (!/^[0-9a-fA-F]{4}$/.test(t.substr(i + 1, 4))) fail('Invalid \\u escape in string'); i += 5; continue; }
          if (i >= n || '"\\/bfnrt'.indexOf(t[i]) < 0) fail('Invalid escape sequence in string');
          i++; continue;
        }
        if (c < ' ') fail(c === '\n' ? 'Unterminated string (line break inside quotes)' : 'Control character inside string');
        i++;
      }
      fail('Unterminated string');
    }
    function val(depth) {
      if (depth > 5000) fail('Nesting is too deep');
      ws();
      var c = t[i];
      if (c === '{') {
        i++; ws();
        if (t[i] === '}') { i++; return; }
        for (;;) {
          ws();
          if (t[i] !== '"') fail(t[i] === '}' ? 'Trailing comma before “}”' : t[i] === "'" ? 'Property names must use double quotes' : 'Expected a property name in double quotes but found ' + tok());
          str(); ws();
          if (t[i] !== ':') fail('Expected “:” after property name but found ' + tok());
          i++; val(depth + 1); ws();
          if (t[i] === ',') { i++; continue; }
          if (t[i] === '}') { i++; return; }
          fail('Expected “,” or “}” after property value but found ' + tok());
        }
      }
      if (c === '[') {
        i++; ws();
        if (t[i] === ']') { i++; return; }
        for (;;) {
          ws();
          if (t[i] === ']') fail('Trailing comma before “]”');
          val(depth + 1); ws();
          if (t[i] === ',') { i++; continue; }
          if (t[i] === ']') { i++; return; }
          fail('Expected “,” or “]” after array item but found ' + tok());
        }
      }
      if (c === '"') return str();
      var m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(t.slice(i, i + 400));
      if (m && m[0] && m[0] !== '-') { i += m[0].length; return; }
      if (t.startsWith('true', i)) { i += 4; return; }
      if (t.startsWith('false', i)) { i += 5; return; }
      if (t.startsWith('null', i)) { i += 4; return; }
      if (c === "'") fail('Strings must use double quotes');
      fail(i >= n ? 'Unexpected end of input' : 'Unexpected ' + tok() + ' where a value was expected');
    }
    try {
      val(0); ws();
      if (i < n) fail('Unexpected ' + tok() + ' after the end of the JSON value');
    } catch (e) { if (e && e.pos != null) return e; throw e; }
    return null;
  }
  function jsonError(e, text) {
    var loc = null;
    try { loc = locateJsonError(text.replace(/^﻿/, '')); } catch (x) { loc = null; }
    if (loc) {
      var bl = text.slice(0, loc.pos).split('\n');
      return { msg: loc.msg, line: bl.length, col: bl[bl.length - 1].length + 1, pos: loc.pos };
    }
    var msg = String(e && e.message || e), line = null, col = null, pos = null, m;
    if ((m = /line (\d+) column (\d+)/i.exec(msg))) { line = +m[1]; col = +m[2]; }
    if ((m = /position (\d+)/i.exec(msg))) pos = +m[1];
    else if (line == null && /end of (JSON )?(input|data)|Unterminated/i.test(msg)) pos = text.length;
    if (pos != null && line == null) {
      var before = text.slice(0, pos).split('\n');
      line = before.length; col = before[before.length - 1].length + 1;
    }
    if (pos == null && line != null) {
      var ls = text.split('\n'); pos = 0;
      for (var i = 0; i < line - 1 && i < ls.length; i++) pos += ls[i].length + 1;
      pos += col - 1;
    }
    var clean = msg.replace(/^JSON\.parse:\s*/, '').replace(/\s*in JSON at position \d+.*$/, '').replace(/\s*at line \d+ column \d+ of the JSON data$/, '').replace(/\s*\(line \d+ column \d+\)$/, '');
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    return { msg: clean, line: line, col: col, pos: pos };
  }
  function errorBox(err, text) {
    var html = '<div class="notice error">' + BT.icon('info') + '<div style="min-width:0;flex:1"><strong>Invalid JSON</strong>' +
      (err.line != null ? ' — line ' + err.line + ', column ' + err.col : '') + '<br>' + esc(err.msg);
    if (err.line != null) {
      var ls = text.split('\n'), l = ls[err.line - 1];
      if (l != null) {
        var start = Math.max(0, err.col - 60), shown = l.slice(start, start + 120);
        var pre = String(err.line).length + 3;
        html += '<div class="bt-err-line">' + (err.line > 1 ? esc(pad(err.line - 1, pre) + truncate(ls[err.line - 2].slice(start, start + 120))) + '\n' : '') +
          esc(pad(err.line, pre) + shown) + '\n<b>' + ' '.repeat(pre + Math.max(0, err.col - 1 - start)) + '^</b></div>' +
          '<button type="button" class="btn btn-sm" data-a="goto" style="margin-top:8px">Go to error</button>';
      }
    }
    return html + '</div></div>';
  }
  function pad(n, w) { var s = String(n) + ' | '; while (s.length < w + 1) s = ' ' + s; return s; }
  function truncate(s) { return s.length > 120 ? s.slice(0, 120) : s; }
  function sortKeys(v) {
    if (Array.isArray(v)) return v.map(sortKeys);
    if (v && typeof v === 'object') {
      var o = {};
      Object.keys(v).sort(function (a, b) { return a.localeCompare(b); }).forEach(function (k) { o[k] = sortKeys(v[k]); });
      return o;
    }
    return v;
  }
  function jsonStats(v) {
    var keys = 0, depth = 0, nodes = 0;
    (function walk(x, d) {
      nodes++;
      if (d > depth) depth = d;
      if (x && typeof x === 'object') {
        var ks = Object.keys(x);
        if (!Array.isArray(x)) keys += ks.length;
        ks.forEach(function (k) { walk(x[k], d + 1); });
      }
    })(v, 0);
    return { keys: keys, depth: depth, nodes: nodes };
  }
  function buildTree(v) {
    var count = 0, LIMIT = 5000;
    function leaf(x) {
      if (x === null) return '<span class="z">null</span>';
      if (typeof x === 'string') return '<span class="s">"' + esc(x.length > 500 ? x.slice(0, 500) + '…' : x) + '"</span>';
      if (typeof x === 'number') return '<span class="n">' + x + '</span>';
      return '<span class="b">' + x + '</span>';
    }
    function node(k, x, depth) {
      if (++count > LIMIT) return count === LIMIT + 1 ? '<div class="m">… tree truncated (too many nodes)</div>' : '';
      var label = k == null ? '' : '<span class="k">' + esc(k) + '</span>: ';
      if (x && typeof x === 'object') {
        var arr = Array.isArray(x), ks = Object.keys(x);
        var meta = arr ? '[' + ks.length + ']' : '{' + ks.length + '}';
        return '<details' + (depth < 2 ? ' open' : '') + '><summary>' + label + '<span class="m">' + (arr ? 'Array ' : 'Object ') + meta + '</span></summary><div>' +
          ks.map(function (kk) { return node(arr ? kk : kk, x[kk], depth + 1); }).join('') + '</div></details>';
      }
      return '<div>' + label + leaf(x) + '</div>';
    }
    return node(null, v, 0);
  }

  // ========================================================== json-formatter
  BT.impl('json-formatter', function (root) {
    css();
    root.innerHTML = '<div class="card"><div class="toolbar">' +
      '<button type="button" class="btn btn-primary btn-sm" data-a="format">' + BT.icon('braces') + '<span>Format</span></button>' +
      btn('data-a="minify"', 'minimize-2', 'Minify') +
      '<label class="bt-inl" for="jf-indent">Indent <select id="jf-indent" style="width:auto;min-height:34px;padding:5px 10px"><option value="2">2 spaces</option><option value="4">4 spaces</option><option value="t">Tab</option></select></label>' +
      chk('jf-sort', 'Sort keys', false) + '<span class="spacer"></span>' +
      fileBtn('jf-file', '.json,application/json,text/plain', 'Upload') + btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') +
      '</div><div class="split">' +
      '<div class="bt-pane"><div class="bt-fhead"><label for="jf-in">Input JSON</label><span class="muted small" id="jf-in-n"></span></div>' +
      '<textarea id="jf-in" class="mono bt-ta-xl" spellcheck="false" placeholder="Paste JSON here, or drop a .json file…"></textarea></div>' +
      '<div class="bt-pane"><div class="bt-fhead">' + seg('jf-view', [['code', 'Code'], ['tree', 'Tree']], 'code', 'Output view') + '<span class="spacer"></span>' +
      btn('data-a="copy"', 'copy', 'Copy') + btn('data-a="dl"', 'download', 'Download') + '</div>' +
      '<label for="jf-out" class="sr-only">Formatted JSON</label><textarea id="jf-out" class="mono bt-ta-xl" spellcheck="false" readonly placeholder="Formatted JSON appears here"></textarea>' +
      '<div id="jf-tree" class="bt-tree hidden" aria-label="JSON tree"></div></div>' +
      '</div><div id="jf-status" class="bt-info" aria-live="polite"></div></div>';
    var inp = BT.$('#jf-in', root), out = BT.$('#jf-out', root), tree = BT.$('#jf-tree', root), status = BT.$('#jf-status', root), view = BT.$('#jf-view', root);
    var mode = 'format', lastErr = null, parsed, valid = false;

    function run() {
      var t = inp.value;
      BT.$('#jf-in-n', root).textContent = t ? BT.fmtBytes(bytesLen(t)) : '';
      lastErr = null; valid = false;
      if (!t.trim()) { out.value = ''; tree.innerHTML = ''; status.innerHTML = '<span class="muted">Paste JSON to validate and format it.</span>'; return; }
      try { parsed = JSON.parse(t.replace(/^﻿/, '')); } catch (e) {
        lastErr = jsonError(e, t);
        status.innerHTML = errorBox(lastErr, t);
        out.value = ''; tree.innerHTML = '';
        return;
      }
      valid = true;
      var v = BT.$('#jf-sort', root).checked ? sortKeys(parsed) : parsed;
      var ind = BT.$('#jf-indent', root).value;
      out.value = mode === 'minify' ? JSON.stringify(v) : JSON.stringify(v, null, ind === 't' ? '\t' : +ind);
      if (segVal(view) === 'tree') tree.innerHTML = buildTree(v);
      var st = jsonStats(parsed), type = Array.isArray(parsed) ? 'Array (' + parsed.length + ' items)' : parsed === null ? 'null' : typeof parsed === 'object' ? 'Object' : typeof parsed;
      status.innerHTML = '<span class="badge ok">' + BT.icon('check') + ' Valid JSON</span><span class="badge">' + esc(type) + '</span>' +
        '<span class="muted">' + plural(st.keys, 'key') + ' · depth ' + st.depth + ' · ' + BT.fmtBytes(bytesLen(out.value)) + (mode === 'minify' ? ' minified' : ' formatted') + '</span>' +
        (/\d{16,}/.test(t) ? '<span class="badge warn">Large numbers may lose precision</span>' : '');
    }
    var deb = BT.debounce(run, 200);
    inp.addEventListener('input', function () { inp.value.length > 300000 ? deb() : run(); });
    root.addEventListener('change', function (e) { if (e.target.id === 'jf-sort' || e.target.id === 'jf-indent') run(); });
    wireSeg(view, function (v) { out.classList.toggle('hidden', v === 'tree'); tree.classList.toggle('hidden', v !== 'tree'); run(); });
    textFileInput(BT.$('#jf-file', root), inp, function (f) { BT.toast('Loaded ' + f.name); run(); });
    onClickA(root, {
      format: function () { mode = 'format'; run(); if (valid) BT.toast('Formatted'); },
      minify: function () { mode = 'minify'; run(); if (valid) BT.toast('Minified'); },
      sample: function () { inp.value = '{"company":"BISCS India","founded":2019,"active":true,"rating":4.8,"address":{"city":"Pune","state":"Maharashtra","pin":"411001"},"tags":["tools","free","privacy"],"employees":[{"id":1,"name":"Priya","skills":["js","css"]},{"id":2,"name":"Rahul","manager":null}]}'; mode = 'format'; run(); },
      clear: function () { inp.value = ''; run(); inp.focus(); },
      copy: function () { if (out.value) BT.copy(out.value); else BT.toast('Nothing to copy', 'error'); },
      dl: function () { if (out.value) BT.download(out.value, mode === 'minify' ? 'data.min.json' : 'data.json', 'application/json'); else BT.toast('Nothing to download', 'error'); },
      'goto': function () { if (lastErr && lastErr.pos != null) { inp.focus(); inp.setSelectionRange(lastErr.pos, Math.min(inp.value.length, lastErr.pos + 1)); var lh = 20; inp.scrollTop = Math.max(0, (lastErr.line - 5) * lh); } }
    });
    run();
  });

  // ============================================================= json-to-csv
  var DELIMS = [[',', 'Comma ,'], [';', 'Semicolon ;'], ['\t', 'Tab'], ['|', 'Pipe |']];
  function delimSelect(id, withAuto) {
    return '<select id="' + id + '">' + (withAuto ? '<option value="auto">Auto-detect</option>' : '') +
      DELIMS.map(function (d) { return '<option value="' + (d[0] === '\t' ? 'tab' : esc(d[0])) + '">' + d[1] + '</option>'; }).join('') + '</select>';
  }
  function delimVal(v) { return v === 'tab' ? '\t' : v; }
  function csvCell(v, d) {
    if (v == null) return '';
    var s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return (s.indexOf(d) > -1 || /["\r\n]/.test(s) || /^\s|\s$/.test(s)) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function flattenObj(obj, prefix, out, deep) {
    Object.keys(obj).forEach(function (k) {
      var v = obj[k], key = prefix ? prefix + '.' + k : k;
      if (deep && v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length) flattenObj(v, key, out, true);
      else if (deep && Array.isArray(v) && v.every(function (x) { return x === null || typeof x !== 'object'; })) out[key] = v.join(', ');
      else out[key] = v;
    });
    return out;
  }
  BT.impl('json-to-csv', function (root) {
    css();
    root.innerHTML = '<div class="card"><div class="bt-opts">' +
      '<label class="bt-inl" for="jc-d">Delimiter ' + delimSelect('jc-d') + '</label>' +
      chk('jc-flat', 'Flatten nested objects (a.b.c)', true) + chk('jc-head', 'Header row', true) + chk('jc-bom', 'Excel-friendly download (UTF-8 BOM)', true) +
      '</div><div class="split">' +
      '<div class="bt-pane"><div class="bt-fhead"><label for="jc-in">JSON</label><span class="spacer"></span>' +
      fileBtn('jc-file', '.json,application/json,text/plain', 'Upload') + btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<textarea id="jc-in" class="mono bt-ta-lg" spellcheck="false" placeholder=\'[{"name":"Asha","city":"Delhi"}, …]\'></textarea></div>' +
      '<div class="bt-pane"><div class="bt-fhead"><label for="jc-out">CSV</label><span class="spacer"></span>' +
      btn('data-a="copy"', 'copy', 'Copy') + btn('data-a="dl"', 'download', 'Download .csv', 'btn-primary') + '</div>' +
      '<textarea id="jc-out" class="mono bt-ta-lg" spellcheck="false" readonly placeholder="CSV appears here"></textarea></div>' +
      '</div><div id="jc-status" class="bt-info" aria-live="polite"></div></div>' +
      '<div class="card"><div class="card-title"><h3>Preview</h3></div><div id="jc-prev"><p class="muted" style="margin:0">A table preview appears here.</p></div></div>';
    var inp = BT.$('#jc-in', root), out = BT.$('#jc-out', root), status = BT.$('#jc-status', root), prev = BT.$('#jc-prev', root);
    var csvText = '';
    function run() {
      var t = inp.value;
      out.value = ''; csvText = '';
      if (!t.trim()) { status.innerHTML = ''; prev.innerHTML = '<p class="muted" style="margin:0">A table preview appears here.</p>'; return; }
      var data;
      try { data = JSON.parse(t.replace(/^﻿/, '')); } catch (e) { status.innerHTML = errorBox(jsonError(e, t), t); prev.innerHTML = ''; return; }
      var note = '';
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        var arrKeys = Object.keys(data).filter(function (k) { return Array.isArray(data[k]) && data[k].length && data[k].every(function (x) { return x && typeof x === 'object'; }); });
        if (arrKeys.length === 1) { note = 'Using the “' + arrKeys[0] + '” array.'; data = data[arrKeys[0]]; }
        else data = [data];
      }
      if (!Array.isArray(data)) data = [data];
      if (!data.length) { status.innerHTML = notice('warn', 'The array is empty.'); prev.innerHTML = ''; return; }
      var d = delimVal(BT.$('#jc-d', root).value), deep = BT.$('#jc-flat', root).checked, head = BT.$('#jc-head', root).checked;
      var header, rows;
      if (data.every(Array.isArray)) {
        var w = Math.max.apply(null, data.map(function (r) { return r.length; }));
        header = []; for (var i = 0; i < w; i++) header.push('column_' + (i + 1));
        rows = data.map(function (r) { return header.map(function (_, j) { return r[j]; }); });
        if (head) note += ' Arrays were written as rows.';
      } else {
        var flat = data.map(function (x) { return x && typeof x === 'object' && !Array.isArray(x) ? flattenObj(x, '', {}, deep) : { value: x }; });
        var seen = new Set(); header = [];
        flat.forEach(function (o) { Object.keys(o).forEach(function (k) { if (!seen.has(k)) { seen.add(k); header.push(k); } }); });
        rows = flat.map(function (o) { return header.map(function (k) { return o[k]; }); });
      }
      var lines = [];
      if (head && !data.every(Array.isArray)) lines.push(header.map(function (h) { return csvCell(h, d); }).join(d));
      rows.forEach(function (r) { lines.push(r.map(function (c) { return csvCell(c, d); }).join(d)); });
      csvText = lines.join('\r\n');
      out.value = csvText;
      status.innerHTML = '<span class="badge ok">' + BT.icon('check') + ' ' + plural(rows.length, 'row') + '</span><span class="badge">' + plural(header.length, 'column') + '</span>' + (note ? '<span class="muted">' + esc(note) + '</span>' : '');
      prev.innerHTML = tableHTML(header, rows, 100);
    }
    var deb = BT.debounce(run, 200);
    inp.addEventListener('input', deb);
    root.addEventListener('change', function (e) { if (e.target !== BT.$('#jc-file', root)) run(); });
    textFileInput(BT.$('#jc-file', root), inp, function (f) { BT.toast('Loaded ' + f.name); run(); });
    onClickA(root, {
      sample: function () { inp.value = JSON.stringify([{ id: 1, name: 'Asha Verma', email: 'asha@example.com', address: { city: 'Delhi', pin: '110001' }, tags: ['admin', 'sales'], active: true }, { id: 2, name: 'Rohan "Ro" Das', email: 'rohan@example.com', address: { city: 'Kolkata', pin: '700001' }, tags: [], active: false, note: 'Line one\nLine two' }, { id: 3, name: 'Meera, K', address: { city: 'Chennai' }, active: true }], null, 2); run(); },
      clear: function () { inp.value = ''; run(); inp.focus(); },
      copy: function () { if (csvText) BT.copy(csvText); else BT.toast('Nothing to copy', 'error'); },
      dl: function () { if (!csvText) { BT.toast('Nothing to download', 'error'); return; } BT.download((BT.$('#jc-bom', root).checked ? '﻿' : '') + csvText, 'data.csv', 'text/csv;charset=utf-8'); }
    });
    run();
  });

  // ============================================================= csv-to-json
  /** RFC 4180 CSV parser. Handles quoted fields, "" escapes and newlines in quotes. */
  function parseCSV(text, d) {
    var rows = [], row = [], field = '', i = 0, n = text.length, inQ = false, quoted = false;
    while (i < n) {
      var c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQ = false; i++; continue;
        }
        var nq = text.indexOf('"', i);
        if (nq < 0) nq = n;
        field += text.slice(i, nq); i = nq; continue;
      }
      if (c === '"' && field === '' && !quoted) { inQ = true; quoted = true; i++; continue; }
      if (c === d) { row.push(field); field = ''; quoted = false; i++; continue; }
      if (c === '\n' || c === '\r') {
        row.push(field); rows.push(row); row = []; field = ''; quoted = false;
        if (c === '\r' && text[i + 1] === '\n') i++;
        i++; continue;
      }
      field += c; i++;
    }
    if (field !== '' || quoted || row.length) { row.push(field); rows.push(row); }
    return { rows: rows, unterminated: inQ };
  }
  function detectDelim(text) {
    var sample = text.slice(0, 20000), best = ',', bestScore = -1;
    [',', ';', '\t', '|'].forEach(function (d) {
      var rows = parseCSV(sample, d).rows.slice(0, 30).filter(function (r) { return r.length > 1 || r[0] !== ''; });
      if (!rows.length) return;
      var counts = {};
      rows.forEach(function (r) { counts[r.length] = (counts[r.length] || 0) + 1; });
      var mode = 0, freq = 0;
      Object.keys(counts).forEach(function (k) { if (counts[k] > freq || (counts[k] === freq && +k > mode)) { freq = counts[k]; mode = +k; } });
      var score = mode > 1 ? freq * 1000 + mode : 0;
      if (score > bestScore) { bestScore = score; best = d; }
    });
    return best;
  }
  function inferType(s, emptyNull) {
    var t = s.trim();
    if (t === '') return emptyNull ? null : '';
    if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(t) && t.replace(/[-.]/g, '').replace(/e.*$/i, '').length <= 15) return Number(t);
    if (/^(true|false)$/i.test(t)) return t.toLowerCase() === 'true';
    if (/^null$/i.test(t)) return null;
    return s;
  }
  BT.impl('csv-to-json', function (root) {
    css();
    root.innerHTML = '<div class="card"><div class="bt-opts">' +
      '<label class="bt-inl" for="cj-d">Delimiter ' + delimSelect('cj-d', true) + '</label>' +
      '<label class="bt-inl" for="cj-fmt">Output <select id="cj-fmt"><option value="obj">Array of objects</option><option value="arr">Array of arrays</option></select></label>' +
      chk('cj-head', 'First row is header', true) + chk('cj-type', 'Detect numbers, booleans &amp; null', true) + chk('cj-null', 'Empty cells as null', false) +
      chk('cj-skip', 'Skip empty lines', true) + chk('cj-min', 'Minify', false) +
      '</div><div class="split">' +
      '<div class="bt-pane"><div class="bt-fhead"><label for="cj-in">CSV</label><span class="spacer"></span>' +
      fileBtn('cj-file', '.csv,.tsv,.txt,text/csv,text/plain', 'Upload') + btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<textarea id="cj-in" class="mono bt-ta-lg" spellcheck="false" placeholder="name,city&#10;Asha,Delhi"></textarea></div>' +
      '<div class="bt-pane"><div class="bt-fhead"><label for="cj-out">JSON</label><span class="spacer"></span>' +
      btn('data-a="copy"', 'copy', 'Copy') + btn('data-a="dl"', 'download', 'Download .json', 'btn-primary') + '</div>' +
      '<textarea id="cj-out" class="mono bt-ta-lg" spellcheck="false" readonly placeholder="JSON appears here"></textarea></div>' +
      '</div><div id="cj-status" class="bt-info" aria-live="polite"></div></div>' +
      '<div class="card"><div class="card-title"><h3>Preview</h3></div><div id="cj-prev"><p class="muted" style="margin:0">A table preview appears here.</p></div></div>';
    var inp = BT.$('#cj-in', root), out = BT.$('#cj-out', root), status = BT.$('#cj-status', root), prev = BT.$('#cj-prev', root);
    var g = function (id) { return BT.$('#cj-' + id, root); };
    function run() {
      var t = inp.value.replace(/^﻿/, '');
      out.value = '';
      if (!t.trim()) { status.innerHTML = ''; prev.innerHTML = '<p class="muted" style="margin:0">A table preview appears here.</p>'; return; }
      var dv = g('d').value, d = dv === 'auto' ? detectDelim(t) : delimVal(dv);
      var res = parseCSV(t, d), rows = res.rows;
      if (g('skip').checked) rows = rows.filter(function (r) { return !(r.length === 1 && r[0].trim() === ''); });
      if (!rows.length) { status.innerHTML = notice('warn', 'No rows found.'); prev.innerHTML = ''; return; }
      var conv = g('type').checked ? function (s) { return inferType(s, g('null').checked); } : function (s) { return s === '' && g('null').checked ? null : s; };
      var header, body = rows, width = Math.max.apply(null, rows.map(function (r) { return r.length; }));
      if (g('head').checked) {
        body = rows.slice(1);
        var used = {};
        header = [];
        for (var i = 0; i < width; i++) {
          var h = (rows[0][i] || '').trim() || 'column_' + (i + 1), base = h, k = 2;
          while (used[h]) h = base + '_' + (k++);
          used[h] = true; header.push(h);
        }
      } else {
        header = []; for (var j = 0; j < width; j++) header.push('column_' + (j + 1));
      }
      var json, table = body.map(function (r) { return header.map(function (_, c) { return r[c] === undefined ? (g('null').checked ? null : '') : conv(r[c]); }); });
      if (g('fmt').value === 'arr') json = (g('head').checked ? [header] : []).concat(table);
      else json = table.map(function (r) { var o = {}; header.forEach(function (h, c) { o[h] = r[c]; }); return o; });
      out.value = g('min').checked ? JSON.stringify(json) : JSON.stringify(json, null, 2);
      var ragged = body.filter(function (r) { return r.length !== width; }).length;
      status.innerHTML = '<span class="badge ok">' + BT.icon('check') + ' ' + plural(body.length, 'row') + '</span><span class="badge">' + plural(header.length, 'column') + '</span>' +
        '<span class="muted">Delimiter: ' + (d === '\t' ? 'Tab' : d === ',' ? 'Comma' : d === ';' ? 'Semicolon' : 'Pipe') + (dv === 'auto' ? ' (detected)' : '') + '</span>' +
        (ragged ? '<span class="badge warn">' + plural(ragged, 'row') + ' with missing cells (filled with empty values)</span>' : '') +
        (res.unterminated ? '<span class="badge danger">Unclosed quote at the end of the file</span>' : '');
      prev.innerHTML = tableHTML(header, table, 100);
    }
    var deb = BT.debounce(run, 200);
    inp.addEventListener('input', deb);
    root.addEventListener('change', function (e) { if (e.target !== g('file')) run(); });
    textFileInput(g('file'), inp, function (f) { BT.toast('Loaded ' + f.name); run(); });
    onClickA(root, {
      sample: function () { inp.value = 'id,name,city,amount,paid,notes\n1,Asha Verma,Delhi,2500.50,true,\n2,"Das, Rohan",Kolkata,1200,false,"Said ""call later"""\n3,Meera,Chennai,980,true,"Address:\nLine 2 of note"\n4,Vikram,Pune,,null,0042'; run(); },
      clear: function () { inp.value = ''; run(); inp.focus(); },
      copy: function () { if (out.value) BT.copy(out.value); else BT.toast('Nothing to copy', 'error'); },
      dl: function () { if (out.value) BT.download(out.value, 'data.json', 'application/json'); else BT.toast('Nothing to download', 'error'); }
    });
    run();
  });

  // ========================================================== base64-encoder
  BT.impl('base64-encoder', function (root) {
    css();
    root.innerHTML = '<div class="card"><div class="bt-opts">' + seg('b64-mode', [['enc', 'Encode'], ['dec', 'Decode']], 'enc', 'Mode') +
      chk('b64-url', 'URL-safe (- _ no padding)', false) + chk('b64-wrap', 'Wrap lines at 76 chars', false) + '</div>' +
      '<div class="split"><div class="bt-pane"><div class="bt-fhead"><label for="b64-in" id="b64-inl">Text</label><span class="muted small" id="b64-in-n"></span><span class="spacer"></span>' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<textarea id="b64-in" class="mono bt-ta-lg" spellcheck="false" placeholder="Type or paste text…"></textarea></div>' +
      '<div class="bt-pane"><div class="bt-fhead"><label for="b64-out" id="b64-outl">Base64</label><span class="muted small" id="b64-out-n"></span><span class="spacer"></span>' +
      btn('data-a="swap" title="Use output as input and switch mode"', 'refresh-cw', 'Swap', 'btn-ghost') + btn('data-a="copy"', 'copy', 'Copy') + btn('data-a="dl"', 'download', 'Download') + '</div>' +
      '<textarea id="b64-out" class="mono bt-ta-lg" spellcheck="false" readonly></textarea></div></div>' +
      '<div id="b64-status" class="bt-info" aria-live="polite"></div></div>' +
      '<div class="card"><div class="card-title"><h3>File to Base64</h3>' + chk('b64-dataurl', 'Include data: URL prefix', true) + '</div><div id="b64-dz"></div><div id="b64-fres" class="bt-info"></div></div>';
    var mode = BT.$('#b64-mode', root), inp = BT.$('#b64-in', root), out = BT.$('#b64-out', root), status = BT.$('#b64-status', root);
    var lastBytes = null, fileB64 = null;
    function run() {
      var enc = segVal(mode) === 'enc', t = inp.value, url = BT.$('#b64-url', root).checked;
      BT.$('#b64-inl', root).textContent = enc ? 'Text' : 'Base64';
      BT.$('#b64-outl', root).textContent = enc ? 'Base64' : 'Decoded text';
      inp.placeholder = enc ? 'Type or paste text…' : 'Paste Base64 (standard or URL-safe)…';
      BT.$('#b64-in-n', root).textContent = t ? BT.fmtBytes(bytesLen(t)) : '';
      lastBytes = null; status.innerHTML = ''; out.value = '';
      if (!t) { BT.$('#b64-out-n', root).textContent = ''; return; }
      if (enc) {
        var s = bytesToB64(new TextEncoder().encode(t));
        if (url) s = s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        if (BT.$('#b64-wrap', root).checked) s = s.replace(/(.{76})(?=.)/g, '$1\n');
        out.value = s;
      } else {
        var src = t.trim().replace(/^data:[^,]*;base64,/i, '').replace(/\s+/g, '');
        if (!/^[A-Za-z0-9+/\-_]*={0,2}$/.test(src) || src.length % 4 === 1) {
          var bad = src.search(/[^A-Za-z0-9+/\-_=]/);
          status.innerHTML = notice('error', 'This is not valid Base64' + (bad > -1 ? ': unexpected character “' + esc(src[bad]) + '” at position ' + (bad + 1) : ' (wrong length or padding)') + '.');
          return;
        }
        var bytes;
        try { bytes = b64urlDecode(src); } catch (e) { status.innerHTML = notice('error', 'This is not valid Base64.'); return; }
        lastBytes = bytes;
        try { out.value = utf8(bytes, true); status.innerHTML = '<span class="badge ok">' + BT.icon('check') + ' Decoded ' + BT.fmtBytes(bytes.length) + '</span>'; }
        catch (e2) {
          out.value = utf8(bytes, false);
          status.innerHTML = notice('warn', 'The decoded data is binary, not UTF-8 text (' + BT.fmtBytes(bytes.length) + '). Use <strong>Download</strong> to save the original bytes.');
        }
      }
      BT.$('#b64-out-n', root).textContent = out.value ? BT.fmtBytes(bytesLen(out.value)) : '';
    }
    wireSeg(mode, run);
    BT.bindInputs(BT.$('.card', root), run);
    var dz = BT.dropzone({
      title: 'Choose a file to encode', hint: 'Images, PDFs or any file up to 25 MB — nothing is uploaded', compact: true, icon: 'file-digit',
      onFiles: function (files) {
        var f = files[0], res = BT.$('#b64-fres', root);
        if (f.size > 25 * 1024 * 1024) { BT.toast('Please choose a file under 25 MB', 'error'); return; }
        BT.readFile(f).then(function (buf) {
          var b = bytesToB64(new Uint8Array(buf));
          fileB64 = { name: f.name, type: f.type || 'application/octet-stream', b64: b };
          var withPrefix = BT.$('#b64-dataurl', root).checked;
          setSeg(mode, 'enc');
          inp.value = '';
          run();
          out.value = withPrefix ? 'data:' + fileB64.type + ';base64,' + b : b;
          BT.$('#b64-out-n', root).textContent = BT.fmtBytes(out.value.length);
          res.innerHTML = '<span class="badge ok">' + BT.icon('check') + ' ' + esc(f.name) + '</span><span class="muted">' + BT.fmtBytes(f.size) + ' → ' + BT.fmtBytes(out.value.length) + ' of Base64 (shown in the output box above)</span>';
          out.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, function () { BT.toast('Could not read that file', 'error'); });
      }
    });
    BT.$('#b64-dz', root).appendChild(dz);
    onClickA(root, {
      sample: function () { inp.value = segVal(mode) === 'enc' ? '₹ नमस्ते — Hello, World! 👋' : '4oK5IOCkqOCkruCkuOCljeCkpOClhyDigJQgSGVsbG8sIFdvcmxkISDwn5GL'; run(); },
      clear: function () { inp.value = ''; run(); inp.focus(); },
      swap: function () { var v = out.value; setSeg(mode, segVal(mode) === 'enc' ? 'dec' : 'enc'); inp.value = v; run(); },
      copy: function () { if (out.value) BT.copy(out.value); else BT.toast('Nothing to copy', 'error'); },
      dl: function () {
        if (!out.value) { BT.toast('Nothing to download', 'error'); return; }
        if (segVal(mode) === 'dec' && lastBytes) BT.download(lastBytes, 'decoded.bin', 'application/octet-stream');
        else BT.download(out.value, segVal(mode) === 'enc' ? 'base64.txt' : 'decoded.txt', 'text/plain;charset=utf-8');
      }
    });
  });

  // ============================================================= url-encoder
  BT.impl('url-encoder', function (root) {
    css();
    root.innerHTML = '<div class="card"><div class="bt-opts">' + seg('ue-mode', [['enc', 'Encode'], ['dec', 'Decode']], 'enc', 'Mode') +
      '<label class="bt-inl" for="ue-kind">Type <select id="ue-kind"><option value="comp">Component (encodeURIComponent)</option><option value="uri">Full URL (encodeURI)</option></select></label>' +
      chk('ue-plus', 'Spaces as + (form encoding)', false) + '</div>' +
      '<div class="split"><div class="bt-pane"><div class="bt-fhead"><label for="ue-in">Input</label><span class="spacer"></span>' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<textarea id="ue-in" class="mono" style="min-height:180px" spellcheck="false" placeholder="Text or URL…"></textarea></div>' +
      '<div class="bt-pane"><div class="bt-fhead"><label for="ue-out">Output</label><span class="spacer"></span>' +
      btn('data-a="swap"', 'refresh-cw', 'Swap', 'btn-ghost') + btn('data-a="copy"', 'copy', 'Copy') + '</div>' +
      '<textarea id="ue-out" class="mono" style="min-height:180px" spellcheck="false" readonly></textarea></div></div>' +
      '<div id="ue-status" class="bt-info" aria-live="polite"></div></div>' +
      '<div class="card"><div class="card-title"><h3>URL parser</h3><span class="muted small">Break a URL into its parts</span></div>' +
      '<div class="field"><label for="ue-url">URL</label><input type="url" id="ue-url" class="mono" spellcheck="false" value="https://user:pass@shop.example.com:8080/products/search?q=red%20saree&amp;size=M&amp;price=500-1000&amp;tags=silk&amp;tags=wedding#reviews"></div>' +
      '<div id="ue-parts"></div></div>';
    var mode = BT.$('#ue-mode', root), inp = BT.$('#ue-in', root), out = BT.$('#ue-out', root), status = BT.$('#ue-status', root);
    function run() {
      var enc = segVal(mode) === 'enc', t = inp.value, comp = BT.$('#ue-kind', root).value === 'comp', plus = BT.$('#ue-plus', root).checked;
      status.innerHTML = ''; out.value = '';
      if (!t) return;
      try {
        if (enc) {
          var s = comp ? encodeURIComponent(t) : encodeURI(t);
          if (plus) s = s.replace(/%20/g, '+');
          out.value = s;
        } else {
          var src = plus ? t.replace(/\+/g, ' ') : t;
          out.value = comp ? decodeURIComponent(src) : decodeURI(src);
        }
        status.innerHTML = '<span class="muted">' + BT.fmtNum(t.length, 0) + ' → ' + BT.fmtNum(out.value.length, 0) + ' characters</span>';
      } catch (e) {
        var bad = t.search(/%(?![0-9A-Fa-f]{2})/);
        status.innerHTML = notice('error', enc ? 'This text contains an invalid character (a lone surrogate) and cannot be encoded.' :
          'Malformed percent-encoding' + (bad > -1 ? ' near position ' + (bad + 1) + ' (“' + esc(t.slice(bad, bad + 3)) + '”)' : ' — a % sequence is not valid UTF-8') + '.');
      }
    }
    function parse() {
      var v = BT.$('#ue-url', root).value.trim(), box = BT.$('#ue-parts', root), u;
      if (!v) { box.innerHTML = ''; return; }
      try { u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(v) ? v : 'https://' + v); } catch (e) { box.innerHTML = notice('error', 'That does not look like a valid URL.'); return; }
      var rows = [['Protocol', u.protocol], ['Username', u.username], ['Password', u.password], ['Host name', u.hostname], ['Port', u.port || '(default)'], ['Path', u.pathname], ['Query string', u.search], ['Fragment', u.hash], ['Origin', u.origin]];
      var html = '<div class="bt-kv">' + rows.filter(function (r) { return r[1]; }).map(function (r) {
        return '<div class="k">' + r[0] + '</div><div class="v">' + esc(r[1]) + '</div><div class="c">' + '<button type="button" class="btn btn-sm btn-ghost" data-copy="' + esc(r[1]) + '" aria-label="Copy ' + r[0] + '">' + BT.icon('copy') + '</button></div>';
      }).join('') + '</div>';
      var params = Array.from(u.searchParams.entries());
      if (params.length) {
        html += '<h3 style="margin:18px 0 10px">Query parameters <span class="badge">' + params.length + '</span></h3><div class="table-wrap"><table class="table"><thead><tr><th>Key</th><th>Value (decoded)</th></tr></thead><tbody>' +
          params.map(function (p) { return '<tr><td class="mono">' + esc(p[0]) + '</td><td class="mono" style="white-space:normal;word-break:break-all">' + esc(p[1]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      }
      box.innerHTML = html;
    }
    wireSeg(mode, run);
    inp.addEventListener('input', run);
    root.addEventListener('change', function (e) { if (e.target.id !== 'ue-url') run(); });
    BT.$('#ue-url', root).addEventListener('input', parse);
    root.addEventListener('click', function (e) { var c = e.target.closest('[data-copy]'); if (c) BT.copy(c.getAttribute('data-copy')); });
    onClickA(root, {
      sample: function () { inp.value = segVal(mode) === 'enc' ? 'https://example.com/search?q=साड़ी & price=₹500' : 'q%3D%E0%A4%B8%E0%A4%BE%E0%A4%A1%E0%A4%BC%E0%A5%80%20%26%20price%3D%E2%82%B9500'; run(); },
      clear: function () { inp.value = ''; run(); inp.focus(); },
      swap: function () { var v = out.value; setSeg(mode, segVal(mode) === 'enc' ? 'dec' : 'enc'); inp.value = v; run(); },
      copy: function () { if (out.value) BT.copy(out.value); else BT.toast('Nothing to copy', 'error'); }
    });
    run(); parse();
  });

  // ===================================================== html-entity-encoder
  var NAMED = { 160: 'nbsp', 161: 'iexcl', 162: 'cent', 163: 'pound', 165: 'yen', 167: 'sect', 169: 'copy', 171: 'laquo', 174: 'reg', 176: 'deg', 177: 'plusmn', 181: 'micro', 182: 'para', 183: 'middot', 187: 'raquo', 188: 'frac14', 189: 'frac12', 190: 'frac34', 191: 'iquest', 215: 'times', 247: 'divide', 8211: 'ndash', 8212: 'mdash', 8216: 'lsquo', 8217: 'rsquo', 8220: 'ldquo', 8221: 'rdquo', 8226: 'bull', 8230: 'hellip', 8364: 'euro', 8482: 'trade', 8592: 'larr', 8593: 'uarr', 8594: 'rarr', 8595: 'darr', 8734: 'infin', 8800: 'ne', 8804: 'le', 8805: 'ge' };
  BT.impl('html-entity-encoder', function (root) {
    css();
    root.innerHTML = '<div class="card"><div class="bt-opts">' + seg('he-mode', [['enc', 'Encode'], ['dec', 'Decode']], 'enc', 'Mode') +
      '<span id="he-encopts" style="display:contents">' + chk('he-quotes', 'Encode quotes', true) + chk('he-all', 'Encode all non-ASCII', false) +
      '<label class="bt-inl" for="he-fmt">Style <select id="he-fmt"><option value="named">Named where possible</option><option value="dec">Decimal &amp;#8377;</option><option value="hex">Hex &amp;#x20B9;</option></select></label></span></div>' +
      '<div class="split"><div class="bt-pane"><div class="bt-fhead"><label for="he-in">Input</label><span class="spacer"></span>' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<textarea id="he-in" class="mono bt-ta-lg" spellcheck="false"></textarea></div>' +
      '<div class="bt-pane"><div class="bt-fhead"><label for="he-out">Output</label><span class="spacer"></span>' +
      btn('data-a="swap"', 'refresh-cw', 'Swap', 'btn-ghost') + btn('data-a="copy"', 'copy', 'Copy') + '</div>' +
      '<textarea id="he-out" class="mono bt-ta-lg" spellcheck="false" readonly></textarea></div></div>' +
      '<div id="he-status" class="bt-info" aria-live="polite"></div></div>';
    var mode = BT.$('#he-mode', root), inp = BT.$('#he-in', root), out = BT.$('#he-out', root);
    var decoder = document.createElement('textarea');
    function encode(t) {
      var q = BT.$('#he-quotes', root).checked, all = BT.$('#he-all', root).checked, fmt = BT.$('#he-fmt', root).value;
      function num(c) { return fmt === 'hex' ? '&#x' + c.toString(16).toUpperCase() + ';' : '&#' + c + ';'; }
      return Array.from(t).map(function (ch) {
        var c = ch.codePointAt(0);
        if (ch === '&') return '&amp;';
        if (ch === '<') return '&lt;';
        if (ch === '>') return '&gt;';
        if (ch === '"') return q ? '&quot;' : ch;
        if (ch === '\'') return q ? '&#39;' : ch;
        if (c === 160) return fmt === 'named' ? '&nbsp;' : num(c);
        if (c > 126 && all) return fmt === 'named' && NAMED[c] ? '&' + NAMED[c] + ';' : num(c);
        return ch;
      }).join('');
    }
    function decode(t) { decoder.innerHTML = t; return decoder.value; } // textarea content is RCDATA: entities decode, tags stay text.
    function run() {
      var enc = segVal(mode) === 'enc', t = inp.value;
      BT.$('#he-encopts', root).style.display = enc ? 'contents' : 'none';
      inp.placeholder = enc ? '<p class="note">Price: ₹500 & up</p>' : '&lt;p&gt;Price: &#8377;500 &amp; up&lt;/p&gt;';
      out.value = t ? (enc ? encode(t) : decode(t)) : '';
      var changed = 0;
      if (t) changed = enc ? (out.value.match(/&[#a-z0-9]+;/gi) || []).length : (t.match(/&[#a-z0-9]+;/gi) || []).length;
      BT.$('#he-status', root).innerHTML = t ? '<span class="badge">' + plural(changed, 'entit' + (changed === 1 ? 'y' : 'ie')).replace('entitys', 'entities').replace('entiti', 'entiti') + '</span>' : '';
    }
    wireSeg(mode, run);
    BT.bindInputs(root, run);
    onClickA(root, {
      sample: function () { inp.value = segVal(mode) === 'enc' ? '<a href="/offers?id=5&ref=home" title=\'Diwali "Sale"\'>Save 20% — ₹1,999 © 2025</a>' : '&lt;div class=&quot;price&quot;&gt;&#8377;1,999 &amp;mdash; &copy; 2025&lt;/div&gt; &#x1F600; &hellip;'; run(); },
      clear: function () { inp.value = ''; run(); inp.focus(); },
      swap: function () { var v = out.value; setSeg(mode, segVal(mode) === 'enc' ? 'dec' : 'enc'); inp.value = v; run(); },
      copy: function () { if (out.value) BT.copy(out.value); else BT.toast('Nothing to copy', 'error'); }
    });
  });

  // ========================================================== hash-generator
  var MD5_K = new Int32Array(64);
  for (var mk = 0; mk < 64; mk++) MD5_K[mk] = Math.floor(Math.abs(Math.sin(mk + 1)) * 4294967296) | 0;
  var MD5_S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  /** MD5 of a Uint8Array → Uint8Array(16). */
  function md5(bytes) {
    var n = bytes.length, blocks = ((n + 8) >>> 6) + 1, w = new Int32Array(blocks * 16), i;
    for (i = 0; i < n; i++) w[i >> 2] |= bytes[i] << ((i & 3) << 3);
    w[n >> 2] |= 0x80 << ((n & 3) << 3);
    w[blocks * 16 - 2] = (n << 3) | 0;
    w[blocks * 16 - 1] = Math.floor(n / 0x20000000);
    var a0 = 0x67452301, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476;
    for (var off = 0; off < w.length; off += 16) {
      var A = a0, B = b0, C = c0, D = d0, F, g, s;
      for (i = 0; i < 64; i++) {
        if (i < 16) { F = (B & C) | (~B & D); g = i; }
        else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) & 15; }
        else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) & 15; }
        else { F = C ^ (B | ~D); g = (7 * i) & 15; }
        F = (F + A + MD5_K[i] + w[off + g]) | 0;
        s = MD5_S[(i >> 4) * 4 + (i & 3)];
        A = D; D = C; C = B;
        B = (B + ((F << s) | (F >>> (32 - s)))) | 0;
      }
      a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
    }
    var out = new Uint8Array(16);
    [a0, b0, c0, d0].forEach(function (v, k) { for (var j = 0; j < 4; j++) out[k * 4 + j] = (v >>> (j * 8)) & 255; });
    return out;
  }
  function concatBytes(a, b) { var r = new Uint8Array(a.length + b.length); r.set(a); r.set(b, a.length); return r; }
  function hmacMd5(key, msg) {
    if (key.length > 64) key = md5(key);
    var k = new Uint8Array(64); k.set(key);
    var ip = new Uint8Array(64), op = new Uint8Array(64);
    for (var i = 0; i < 64; i++) { ip[i] = k[i] ^ 0x36; op[i] = k[i] ^ 0x5c; }
    return md5(concatBytes(op, md5(concatBytes(ip, msg))));
  }
  BT.md5 = function (s) { return hex(md5(typeof s === 'string' ? new TextEncoder().encode(s) : s)); };

  BT.impl('hash-generator', function (root) {
    css();
    var subtle = window.crypto && window.crypto.subtle;
    var ALGS = [['MD5', null], ['SHA-1', 'SHA-1'], ['SHA-256', 'SHA-256'], ['SHA-384', 'SHA-384'], ['SHA-512', 'SHA-512']];
    root.innerHTML = '<div class="card"><div class="bt-opts">' + seg('hg-src', [['text', 'Text'], ['file', 'File']], 'text', 'Input source') +
      chk('hg-upper', 'Uppercase', false) + '</div>' +
      '<div id="hg-textbox"><div class="bt-fhead"><label for="hg-in">Text</label><span class="muted small" id="hg-n"></span><span class="spacer"></span>' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<textarea id="hg-in" class="mono" style="min-height:160px" spellcheck="false" placeholder="Type or paste text to hash…"></textarea></div>' +
      '<div id="hg-filebox" class="hidden"><div id="hg-dz"></div><div id="hg-finfo" class="bt-info"></div></div>' +
      '<div class="row cols-2" style="margin-top:14px">' +
      '<div class="field"><label for="hg-key">HMAC secret key <span class="muted">(optional)</span></label><input type="text" id="hg-key" class="mono" autocomplete="off" spellcheck="false" placeholder="Leave empty for plain hashes"></div>' +
      '<div class="field"><label for="hg-cmp">Compare with a hash <span class="muted">(optional)</span></label><input type="text" id="hg-cmp" class="mono" autocomplete="off" spellcheck="false" placeholder="Paste an expected hash to verify"></div></div>' +
      (subtle ? '' : notice('warn', 'SHA hashes need a secure (https) page; only MD5 is available here.')) + '</div>' +
      '<div class="card"><div class="card-title"><h3 id="hg-title">Hashes</h3><span id="hg-cmpres"></span></div><div id="hg-out"></div></div>';
    var src = BT.$('#hg-src', root), inp = BT.$('#hg-in', root), outBox = BT.$('#hg-out', root);
    var fileBytes = null, fileName = '', job = 0, results = [];
    function getBytes() { return segVal(src) === 'file' ? fileBytes : new TextEncoder().encode(inp.value); }
    function render() {
      var up = BT.$('#hg-upper', root).checked, cmp = BT.$('#hg-cmp', root).value.trim().toLowerCase(), hit = false;
      outBox.innerHTML = '<div class="table-wrap"><table class="table"><tbody>' + results.map(function (r) {
        var v = r.v == null ? '' : (up ? r.v.toUpperCase() : r.v);
        var m = cmp && r.v && r.v === cmp;
        if (m) hit = true;
        return '<tr class="' + (m ? 'bt-match' : '') + '"><th scope="row" style="width:130px;position:static">' + esc(r.name) + (m ? ' ' + BT.icon('check') : '') + '</th>' +
          '<td style="white-space:normal"><span class="bt-hash">' + (r.v == null ? '<span class="muted">' + esc(r.err || '…') + '</span>' : esc(v)) + '</span></td>' +
          '<td style="width:60px">' + (r.v ? '<button type="button" class="btn btn-sm btn-ghost" data-copy="' + esc(v) + '" aria-label="Copy ' + esc(r.name) + '">' + BT.icon('copy') + '</button>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
      BT.$('#hg-cmpres', root).innerHTML = cmp ? (hit ? '<span class="badge ok">' + BT.icon('check') + ' Match found</span>' : '<span class="badge danger">No match</span>') : '';
    }
    function run() {
      var my = ++job, bytes = getBytes(), key = BT.$('#hg-key', root).value;
      var hm = !!key;
      BT.$('#hg-title', root).textContent = hm ? 'HMAC values' : 'Hashes';
      BT.$('#hg-n', root).textContent = inp.value ? BT.fmtBytes(bytesLen(inp.value)) : '';
      if (!bytes) { results = []; outBox.innerHTML = '<p class="muted" style="margin:0">Choose a file to hash.</p>'; return; }
      var keyBytes = new TextEncoder().encode(key);
      results = ALGS.map(function (a) { return { name: (hm ? 'HMAC-' : '') + a[0], alg: a[1], v: null }; });
      results[0].v = hex(hm ? hmacMd5(keyBytes, bytes) : md5(bytes));
      render();
      ALGS.slice(1).forEach(function (a, i) {
        var r = results[i + 1];
        if (!subtle) { r.err = 'Unavailable on insecure pages'; return; }
        var p = hm ? subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: a[1] }, false, ['sign']).then(function (k) { return subtle.sign('HMAC', k, bytes); }) : subtle.digest(a[1], bytes);
        p.then(function (buf) { if (my !== job) return; r.v = hex(new Uint8Array(buf)); render(); }, function (e) { if (my !== job) return; r.err = 'Error: ' + e.message; render(); });
      });
      render();
    }
    var deb = BT.debounce(run, 120);
    wireSeg(src, function (v) {
      BT.$('#hg-textbox', root).classList.toggle('hidden', v !== 'text');
      BT.$('#hg-filebox', root).classList.toggle('hidden', v !== 'file');
      run();
    });
    inp.addEventListener('input', deb);
    BT.$('#hg-key', root).addEventListener('input', deb);
    BT.$('#hg-cmp', root).addEventListener('input', render);
    BT.$('#hg-upper', root).addEventListener('change', render);
    BT.$('#hg-dz', root).appendChild(BT.dropzone({
      title: 'Choose a file to hash', hint: 'Files are hashed on your device and never uploaded', compact: true, icon: 'hash',
      onFiles: function (files) {
        var f = files[0], info = BT.$('#hg-finfo', root);
        if (f.size > 1024 * 1024 * 1024) { BT.toast('Please choose a file under 1 GB', 'error'); return; }
        info.innerHTML = '<span class="spinner"></span> Reading ' + esc(f.name) + '…';
        var t0 = performance.now();
        BT.readFile(f).then(function (buf) {
          fileBytes = new Uint8Array(buf); fileName = f.name;
          run();
          info.innerHTML = '<span class="badge ok">' + BT.icon('check') + ' ' + esc(fileName) + '</span><span class="muted">' + BT.fmtBytes(f.size) + ' · read in ' + Math.round(performance.now() - t0) + ' ms</span>';
        }, function () { info.innerHTML = ''; BT.toast('Could not read that file', 'error'); });
      }
    }));
    root.addEventListener('click', function (e) { var c = e.target.closest('[data-copy]'); if (c) BT.copy(c.getAttribute('data-copy')); });
    onClickA(root, {
      sample: function () { inp.value = 'abc'; run(); },
      clear: function () { inp.value = ''; run(); inp.focus(); }
    });
    run();
  });

  // ========================================================== uuid-generator
  function rnd(n) { var b = new Uint8Array(n); window.crypto.getRandomValues(b); return b; }
  function fmtUuid(b) { var h = hex(b); return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20); }
  function uuid4() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    var b = rnd(16); b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80; return fmtUuid(b);
  }
  var lastV7 = 0, v7seq = 0;
  function uuid7() {
    var b = rnd(16), ms = Date.now();
    if (ms <= lastV7) { ms = lastV7; v7seq++; } else { v7seq = 0; lastV7 = ms; }
    var t = ms;
    for (var i = 5; i >= 0; i--) { b[i] = t % 256; t = Math.floor(t / 256); }
    // 12-bit counter in rand_a keeps ids generated in the same millisecond ordered.
    b[6] = 0x70 | ((v7seq >> 8) & 0x0f); b[7] = v7seq & 0xff;
    b[8] = (b[8] & 0x3f) | 0x80;
    return fmtUuid(b);
  }
  BT.impl('uuid-generator', function (root) {
    css();
    root.innerHTML = '<div class="card"><div class="row cols-3">' +
      '<div class="field"><span class="label">Version</span>' + seg('ug-ver', [['4', 'v4 (random)'], ['7', 'v7 (time-ordered)']], '4', 'UUID version') + '</div>' +
      '<div class="field"><label for="ug-n">How many (1–1000)</label><input type="number" id="ug-n" min="1" max="1000" value="10" inputmode="numeric"></div>' +
      '<div class="field"><span class="label">Format</span><div style="display:flex;flex-wrap:wrap;gap:6px 14px">' +
      chk('ug-up', 'Uppercase', false) + chk('ug-nh', 'No hyphens', false) + chk('ug-br', 'Braces { }', false) + chk('ug-q', 'Quotes + commas', false) + '</div></div></div>' +
      '<div class="toolbar">' + btn('data-a="gen"', 'refresh-cw', 'Generate', 'btn-primary') + '<span class="spacer"></span>' +
      btn('data-a="copy"', 'copy', 'Copy all') + btn('data-a="dl"', 'download', 'Download') + '</div>' +
      '<label for="ug-out" class="sr-only">Generated UUIDs</label><textarea id="ug-out" class="mono bt-ta-lg" readonly spellcheck="false"></textarea>' +
      '<div class="bt-info" id="ug-info"></div></div>' +
      '<div class="card"><div class="card-title"><h3>Validate a UUID</h3></div><div class="field" style="margin-bottom:8px"><label for="ug-val" class="sr-only">UUID to validate</label>' +
      '<input type="text" id="ug-val" class="mono" spellcheck="false" autocomplete="off" placeholder="Paste a UUID to check its version"></div><div id="ug-vres" class="bt-info" style="margin:0"></div></div>';
    var out = BT.$('#ug-out', root), ver = BT.$('#ug-ver', root), raw = [];
    function fmt() {
      var up = BT.$('#ug-up', root).checked, nh = BT.$('#ug-nh', root).checked, br = BT.$('#ug-br', root).checked, q = BT.$('#ug-q', root).checked;
      var list = raw.map(function (u) {
        if (nh) u = u.replace(/-/g, '');
        if (up) u = u.toUpperCase();
        if (br) u = '{' + u + '}';
        if (q) u = '"' + u + '"';
        return u;
      });
      out.value = q ? list.join(',\n') : list.join('\n');
      BT.$('#ug-info', root).innerHTML = '<span class="badge ok">' + plural(raw.length, 'UUID') + '</span><span class="muted">Generated with your browser’s cryptographically secure random generator.</span>';
    }
    function gen() {
      var n = Math.floor(BT.num(BT.$('#ug-n', root).value));
      if (!(n >= 1)) n = 1;
      if (n > 1000) { n = 1000; BT.$('#ug-n', root).value = 1000; }
      var f = segVal(ver) === '7' ? uuid7 : uuid4;
      raw = [];
      for (var i = 0; i < n; i++) raw.push(f());
      fmt();
    }
    function validate() {
      var v = BT.$('#ug-val', root).value.trim(), box = BT.$('#ug-vres', root);
      if (!v) { box.innerHTML = ''; return; }
      var h = v.replace(/^[{("']+|[})"',]+$/g, '').replace(/^urn:uuid:/i, '');
      if (!/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(h)) { box.innerHTML = '<span class="badge danger">Not a valid UUID</span>'; return; }
      h = h.replace(/-/g, '').toLowerCase();
      if (/^0+$/.test(h)) { box.innerHTML = '<span class="badge ok">Valid</span><span class="muted">Nil UUID (all zeros)</span>'; return; }
      var vn = parseInt(h[12], 16), vr = parseInt(h[16], 16);
      var variant = vr >= 8 && vr <= 11 ? 'RFC 9562' : vr < 8 ? 'NCS (legacy)' : vr < 14 ? 'Microsoft' : 'Reserved';
      var extra = '';
      if (vn === 7) extra = ' · created ' + new Date(parseInt(h.slice(0, 12), 16)).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
      box.innerHTML = '<span class="badge ok">' + BT.icon('check') + ' Valid</span><span class="badge">Version ' + vn + '</span><span class="muted">Variant: ' + variant + extra + '</span>';
    }
    wireSeg(ver, gen);
    BT.$('#ug-n', root).addEventListener('change', gen);
    ['up', 'nh', 'br', 'q'].forEach(function (k) { BT.$('#ug-' + k, root).addEventListener('change', fmt); });
    BT.$('#ug-val', root).addEventListener('input', validate);
    onClickA(root, {
      gen: gen,
      copy: function () { BT.copy(out.value, plural(raw.length, 'UUID') + ' copied'); },
      dl: function () { BT.download(out.value + '\n', 'uuids.txt', 'text/plain;charset=utf-8'); }
    });
    gen();
  });

  // ============================================================= jwt-decoder
  function relTime(ms) {
    var diff = ms - Date.now(), a = Math.abs(diff), rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    var units = [['year', 31536000000], ['month', 2592000000], ['week', 604800000], ['day', 86400000], ['hour', 3600000], ['minute', 60000], ['second', 1000]];
    for (var i = 0; i < units.length; i++) if (a >= units[i][1] || units[i][0] === 'second') return rtf.format(Math.round(diff / units[i][1]), units[i][0]);
    return '';
  }
  var IST_FMT = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  function fmtIST(ms) { return IST_FMT.format(new Date(ms)) + ' IST'; }
  BT.impl('jwt-decoder', function (root) {
    css();
    root.innerHTML = '<div class="card"><div class="bt-fhead"><label for="jw-in">JSON Web Token</label><span class="spacer"></span>' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<textarea id="jw-in" class="mono" style="min-height:130px" spellcheck="false" placeholder="Paste a token (eyJhbGciOi…) — a “Bearer ” prefix is fine"></textarea>' +
      '<div id="jw-color" class="bt-info"></div>' +
      '<div class="notice warn" style="margin-top:12px">' + BT.icon('shield') + '<span><strong>The signature is not verified.</strong> This tool only decodes the token on your device. Never trust a token’s claims until your server has verified its signature.</span></div></div>' +
      '<div id="jw-out"></div>';
    var inp = BT.$('#jw-in', root), out = BT.$('#jw-out', root), color = BT.$('#jw-color', root);
    var decoded = {};
    function part(b64, label) {
      var bytes, txt;
      try { bytes = b64urlDecode(b64); } catch (e) { throw new Error('The ' + label + ' is not valid Base64URL.'); }
      try { txt = utf8(bytes, true); } catch (e2) { throw new Error('The ' + label + ' is not valid UTF-8 text.'); }
      try { return JSON.parse(txt); } catch (e3) { throw new Error('The ' + label + ' is not valid JSON.'); }
    }
    function jsonCard(title, obj, key) {
      return '<div class="card"><div class="card-title"><h3>' + title + '</h3>' + btn('data-copy-json="' + key + '"', 'copy', 'Copy JSON') + '</div>' +
        '<pre class="bt-code" style="margin:0">' + esc(JSON.stringify(obj, null, 2)) + '</pre></div>';
    }
    function run() {
      var t = inp.value.trim().replace(/^bearer\s+/i, '');
      if (!t) { out.innerHTML = ''; color.innerHTML = ''; return; }
      var parts = t.split('.');
      if (parts.length === 5) { out.innerHTML = '<div class="card">' + notice('warn', 'This looks like an encrypted JWE token (5 parts). Its payload cannot be read without the decryption key.') + '</div>'; color.innerHTML = ''; return; }
      if (parts.length !== 3) { out.innerHTML = '<div class="card">' + notice('error', 'A JWT has three parts separated by dots (header.payload.signature). This one has ' + parts.length + '.') + '</div>'; color.innerHTML = ''; return; }
      color.innerHTML = '<div class="bt-jwt"><span class="h">' + esc(parts[0]) + '</span>.<span class="p">' + esc(parts[1]) + '</span>.<span class="s">' + esc(parts[2]) + '</span></div>';
      var header, payload;
      try { header = part(parts[0], 'header'); payload = part(parts[1], 'payload'); } catch (e) { out.innerHTML = '<div class="card">' + notice('error', esc(e.message)) + '</div>'; return; }
      decoded = { header: header, payload: payload };
      var now = Date.now(), badges = '', rows = '';
      var NAMES = { iss: 'Issuer', sub: 'Subject', aud: 'Audience', exp: 'Expires', nbf: 'Not before', iat: 'Issued at', jti: 'Token ID', name: 'Name', email: 'Email', scope: 'Scope', role: 'Role' };
      if (payload && typeof payload === 'object') {
        if (typeof payload.exp === 'number') badges += now >= payload.exp * 1000 ? '<span class="badge danger">Expired ' + esc(relTime(payload.exp * 1000)) + '</span>' : '<span class="badge ok">' + BT.icon('check') + ' Not expired — expires ' + esc(relTime(payload.exp * 1000)) + '</span>';
        else badges += '<span class="badge warn">No expiry (exp) claim</span>';
        if (typeof payload.nbf === 'number' && now < payload.nbf * 1000) badges += '<span class="badge warn">Not valid yet — starts ' + esc(relTime(payload.nbf * 1000)) + '</span>';
        Object.keys(NAMES).forEach(function (k) {
          if (!(k in payload)) return;
          var v = payload[k], disp;
          if ((k === 'exp' || k === 'nbf' || k === 'iat') && typeof v === 'number') disp = esc(fmtIST(v * 1000)) + ' <span class="muted">(' + esc(relTime(v * 1000)) + ' · ' + v + ')</span>';
          else disp = esc(typeof v === 'object' ? JSON.stringify(v) : String(v));
          rows += '<tr><th scope="row" style="position:static;width:150px">' + NAMES[k] + ' <span class="muted mono">' + k + '</span></th><td style="white-space:normal;word-break:break-word">' + disp + '</td></tr>';
        });
      }
      var alg = header && header.alg ? String(header.alg) : 'unknown';
      out.innerHTML = '<div class="card"><div class="card-title"><h3>Status</h3><div class="btn-group">' + badges + '<span class="badge">Algorithm: ' + esc(alg) + '</span></div></div>' +
        (alg.toLowerCase() === 'none' ? notice('error', 'This token uses <code>alg: none</code> — it is unsigned and must never be accepted.') : '') +
        (rows ? '<div class="table-wrap" style="margin-top:12px"><table class="table"><tbody>' + rows + '</tbody></table></div>' : '') + '</div>' +
        '<div class="split" style="margin-top:16px"><div>' + jsonCard('Header', header, 'header') + '</div><div>' + jsonCard('Payload', payload, 'payload') + '</div></div>' +
        '<div class="card" style="margin-top:16px"><div class="card-title"><h3>Signature</h3></div><div class="bt-jwt"><span class="s">' + esc(parts[2] || '(empty)') + '</span></div>' +
        '<p class="muted small" style="margin:8px 0 0">' + esc(parts[2] ? b64urlSafeLen(parts[2]) : 'No signature present.') + '</p></div>';
    }
    function b64urlSafeLen(s) { try { return BT.fmtBytes(b64urlDecode(s).length) + ' signature — verify it on your server with the issuer’s key or secret.'; } catch (e) { return 'Signature is not valid Base64URL.'; } }
    inp.addEventListener('input', BT.debounce(run, 80));
    root.addEventListener('click', function (e) { var c = e.target.closest('[data-copy-json]'); if (c) BT.copy(JSON.stringify(decoded[c.getAttribute('data-copy-json')], null, 2)); });
    function enc(o) { return bytesToB64(new TextEncoder().encode(JSON.stringify(o))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
    onClickA(root, {
      sample: function () {
        var now = Math.floor(Date.now() / 1000);
        inp.value = enc({ alg: 'HS256', typ: 'JWT' }) + '.' + enc({ sub: 'user_1024', name: 'Priya Sharma', email: 'priya@example.com', role: 'admin', iss: 'https://auth.example.com', aud: 'biscs-app', iat: now - 3600, exp: now + 86400 }) + '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        run();
      },
      clear: function () { inp.value = ''; run(); inp.focus(); }
    });
    run();
  });

  // ============================================================ regex-tester
  /** Runs inside a Web Worker (stringified) or as a fallback on the main thread. */
  function regexJob(d) {
    var res = { matches: [], error: null, truncated: false, replaced: null };
    try {
      var re = new RegExp(d.p, d.f), s = d.s, m, LIMIT = 5000;
      var pack = function (x) { return { i: x.index, t: x[0], g: Array.prototype.slice.call(x, 1), n: x.groups || null }; };
      if (re.global || re.sticky) {
        re.lastIndex = 0;
        while ((m = re.exec(s)) !== null) {
          res.matches.push(pack(m));
          if (m[0] === '') {
            if (!re.global) break;
            var li = re.lastIndex;
            if (li >= s.length) break;
            re.lastIndex = li + ((re.unicode || re.unicodeSets) && s.codePointAt(li) > 0xffff ? 2 : 1);
          }
          if (!re.global) break;
          if (res.matches.length >= LIMIT) { res.truncated = true; break; }
        }
      } else if ((m = re.exec(s)) !== null) res.matches.push(pack(m));
      if (d.r !== null) { re.lastIndex = 0; res.replaced = s.replace(re, d.r); }
    } catch (e) { res.error = String(e && e.message || e); }
    return res;
  }
  var RX_PRESETS = [
    ['Email address', '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}', 'g'],
    ['Indian mobile number', '(?:\\+91[\\s-]?|\\b0)?[6-9]\\d{9}\\b', 'g'],
    ['PIN code (India)', '\\b[1-9][0-9]{5}\\b', 'g'],
    ['PAN', '\\b[A-Z]{5}[0-9]{4}[A-Z]\\b', 'g'],
    ['GSTIN', '\\b\\d{2}[A-Z]{5}\\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\\b', 'g'],
    ['IFSC code', '\\b[A-Z]{4}0[A-Z0-9]{6}\\b', 'g'],
    ['URL', 'https?:\\/\\/[^\\s/$.?#][^\\s]*', 'gi'],
    ['Date (DD/MM/YYYY)', '\\b(0?[1-9]|[12]\\d|3[01])[\\/\\-.](0?[1-9]|1[0-2])[\\/\\-.](\\d{4})\\b', 'g'],
    ['ISO date (named groups)', '(?<year>\\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\\d|3[01])', 'g'],
    ['IPv4 address', '\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b', 'g'],
    ['Hex colour', '#(?:[0-9a-fA-F]{3}){1,2}\\b', 'g'],
    ['Hashtag', '#\\w+', 'g']
  ];
  var RX_SAMPLE = 'Contact: priya.sharma@example.co.in, +91 98765 43210 or 9123456789\n' +
    'Ship to: 221B MG Road, Pune 411001. Alt PIN 560034\n' +
    'PAN: ABCDE1234F   GSTIN: 27ABCDE1234F1Z5   IFSC: HDFC0001234\n' +
    'Invoice dated 15/08/2025, due 2025-09-14. Server 192.168.1.20 replied.\n' +
    'Visit https://www.biscsindia.com/tools?ref=regex — brand colour #4f46e5 #DigitalIndia';
  BT.impl('regex-tester', function (root) {
    css();
    var FLAGS = [['g', 'global'], ['i', 'ignore case'], ['m', 'multiline'], ['s', 'dotAll'], ['u', 'unicode'], ['y', 'sticky']];
    root.innerHTML = '<div class="card"><div class="row cols-2" style="align-items:end">' +
      '<div class="field"><label for="rx-p">Regular expression</label><div class="bt-rx"><span class="addon" aria-hidden="true">/</span>' +
      '<input type="text" id="rx-p" spellcheck="false" autocomplete="off" placeholder="pattern"><span class="addon" id="rx-fl" aria-hidden="true">/g</span></div></div>' +
      '<div class="field"><label for="rx-preset">Common patterns</label><select id="rx-preset"><option value="">Choose a preset…</option>' +
      RX_PRESETS.map(function (p, i) { return '<option value="' + i + '">' + esc(p[0]) + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="bt-opts" style="margin:0" role="group" aria-label="Flags">' + FLAGS.map(function (f) {
        return '<label class="check" title="' + f[1] + '"><input type="checkbox" id="rx-f-' + f[0] + '"' + (f[0] === 'g' ? ' checked' : '') + '> <code class="mono">' + f[0] + '</code> <span class="muted small">' + f[1] + '</span></label>';
      }).join('') + '<span style="flex:1"></span><span id="rx-count" aria-live="polite"></span></div><div id="rx-err"></div></div>' +
      '<div class="card"><div class="split"><div class="bt-pane"><div class="bt-fhead"><label for="rx-s">Test string</label><span class="spacer"></span>' +
      btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<textarea id="rx-s" class="mono bt-ta-lg" spellcheck="false" placeholder="Text to test the pattern against…"></textarea></div>' +
      '<div class="bt-pane"><div class="bt-fhead"><span class="lbl" id="rx-hl-l">Highlighted matches</span></div>' +
      '<div id="rx-hl" class="output bt-hlbox" style="min-height:280px" aria-labelledby="rx-hl-l"></div></div></div></div>' +
      '<div class="card"><div class="card-title"><h3>Match details</h3>' + btn('data-a="copym"', 'copy', 'Copy matches') + '</div><div id="rx-list"></div></div>' +
      '<div class="card"><div class="card-title"><h3>Replace</h3></div><div class="field"><label for="rx-r">Replacement <span class="muted">($1, $&lt;name&gt;, $&amp;)</span></label>' +
      '<input type="text" id="rx-r" class="mono" spellcheck="false" autocomplete="off" placeholder="Leave empty to skip"></div>' +
      '<div class="bt-fhead"><span class="lbl">Result</span><span class="spacer"></span>' + btn('data-a="copyr"', 'copy', 'Copy result') + '</div>' +
      '<div id="rx-rep" class="output bt-hlbox"></div></div>' +
      '<div class="card"><details><summary style="cursor:pointer;font-weight:650">Regex cheat sheet</summary><div class="bt-cheat">' +
      [['.', 'any character'], ['\\d', 'digit 0–9'], ['\\w', 'word character'], ['\\s', 'whitespace'], ['\\b', 'word boundary'], ['^ $', 'start / end'], ['[abc]', 'any of a, b, c'], ['[^abc]', 'not a, b, c'], ['a|b', 'a or b'],
        ['*', '0 or more'], ['+', '1 or more'], ['?', '0 or 1'], ['{2,5}', '2 to 5 times'], ['*?', 'lazy (fewest)'], ['(…)', 'capture group'], ['(?:…)', 'non-capturing'], ['(?<n>…)', 'named group'], ['(?=…)', 'lookahead'], ['(?<=…)', 'lookbehind'], ['\\p{L}', 'any letter (u flag)']]
        .map(function (c) { return '<div><code>' + esc(c[0]) + '</code>' + esc(c[1]) + '</div>'; }).join('') + '</div></details></div>';
    var P = BT.$('#rx-p', root), S = BT.$('#rx-s', root), R = BT.$('#rx-r', root), hl = BT.$('#rx-hl', root), list = BT.$('#rx-list', root);
    var count = BT.$('#rx-count', root), err = BT.$('#rx-err', root), repBox = BT.$('#rx-rep', root);
    var worker = null, timer = null, seq = 0, last = null;
    function flags() { return FLAGS.map(function (f) { return BT.$('#rx-f-' + f[0], root).checked ? f[0] : ''; }).join(''); }
    function makeWorker() {
      try {
        var src = 'var job=' + regexJob.toString() + ';self.onmessage=function(e){self.postMessage({id:e.data.id,res:job(e.data)})};';
        worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
        worker.onmessage = function (e) { if (e.data.id === seq) { clearTimeout(timer); show(e.data.res); } };
      } catch (e) { worker = null; }
    }
    makeWorker();
    function run() {
      var f = flags();
      BT.$('#rx-fl', root).textContent = '/' + f;
      var p = P.value;
      // Accept a pasted /pattern/flags literal.
      var lit = /^\/([\s\S]+)\/([dgimsuvy]*)$/.exec(p);
      if (lit) {
        P.value = p = lit[1];
        FLAGS.forEach(function (x) { BT.$('#rx-f-' + x[0], root).checked = lit[2].indexOf(x[0]) > -1; });
        f = flags(); BT.$('#rx-fl', root).textContent = '/' + f;
      }
      if (!p) { show(null); return; }
      var job = { id: ++seq, p: p, f: f, s: S.value, r: R.value === '' ? null : R.value };
      if (!worker) { show(regexJob(job)); return; }
      clearTimeout(timer);
      timer = setTimeout(function () {
        worker.terminate(); makeWorker();
        show({ matches: [], error: 'The pattern took too long to run (possible catastrophic backtracking). Try making it more specific, e.g. avoid nested quantifiers like (a+)+.', timeout: true });
      }, 1500);
      worker.postMessage(job);
    }
    function show(res) {
      last = res;
      err.innerHTML = '';
      if (!res) { count.innerHTML = ''; hl.textContent = S.value; list.innerHTML = '<p class="muted" style="margin:0">Enter a pattern to see matches.</p>'; repBox.textContent = ''; return; }
      if (res.error) {
        count.innerHTML = '<span class="badge danger">Error</span>';
        err.innerHTML = '<div style="margin-top:12px">' + notice('error', esc(res.error.replace(/^Invalid regular expression: /, ''))) + '</div>';
        hl.textContent = S.value; list.innerHTML = ''; repBox.textContent = '';
        return;
      }
      var ms = res.matches, s = S.value, html = '', pos = 0;
      count.innerHTML = '<span class="badge ' + (ms.length ? 'ok' : 'warn') + '">' + (res.truncated ? '5000+' : ms.length) + ' match' + (ms.length === 1 ? '' : 'es') + '</span>';
      ms.forEach(function (m, i) {
        if (m.i < pos) return;
        html += esc(s.slice(pos, m.i));
        html += m.t === '' ? '<mark class="bt-m z" title="Empty match at ' + m.i + '"></mark>' : '<mark class="bt-m' + (i % 2 ? ' alt' : '') + '" title="Match ' + (i + 1) + ' at ' + m.i + '">' + esc(m.t) + '</mark>';
        pos = m.i + m.t.length;
      });
      hl.innerHTML = html + esc(s.slice(pos)) || '<span class="muted">Test string is empty.</span>';
      if (!ms.length) list.innerHTML = '<p class="muted" style="margin:0">No matches.</p>';
      else {
        list.innerHTML = '<div class="table-wrap" style="max-height:420px;overflow:auto"><table class="table"><thead><tr><th class="num">#</th><th>Match</th><th class="num">Index</th><th>Groups</th></tr></thead><tbody>' +
          ms.slice(0, 500).map(function (m, i) {
            var gs = m.g.map(function (g, k) { return '<span class="badge" style="margin:1px">' + (k + 1) + ': ' + (g == null ? '<i>undefined</i>' : esc(g)) + '</span>'; });
            if (m.n) Object.keys(m.n).forEach(function (k) { gs.push('<span class="badge ok" style="margin:1px">' + esc(k) + ': ' + (m.n[k] == null ? '<i>undefined</i>' : esc(m.n[k])) + '</span>'); });
            return '<tr><td class="num">' + (i + 1) + '</td><td class="mono" style="white-space:pre-wrap;word-break:break-all">' + (m.t === '' ? '<span class="muted">(empty)</span>' : esc(m.t)) + '</td><td class="num">' + m.i + '–' + (m.i + m.t.length) + '</td><td style="white-space:normal">' + (gs.join(' ') || '<span class="muted">—</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>' + (ms.length > 500 ? '<p class="muted small">Showing the first 500 matches.</p>' : '');
      }
      if (res.replaced == null) repBox.innerHTML = '<span class="muted">Type a replacement to preview the result.</span>';
      else repBox.textContent = res.replaced;
    }
    var deb = BT.debounce(run, 150);
    root.addEventListener('input', function (e) { if (e.target !== BT.$('#rx-preset', root)) deb(); });
    root.addEventListener('change', function (e) {
      if (e.target.id === 'rx-preset') {
        var p = RX_PRESETS[+e.target.value];
        if (!p) return;
        P.value = p[1];
        FLAGS.forEach(function (x) { BT.$('#rx-f-' + x[0], root).checked = p[2].indexOf(x[0]) > -1; });
        if (!S.value.trim()) S.value = RX_SAMPLE;
        run();
      } else if (e.target.type === 'checkbox') run();
    });
    onClickA(root, {
      sample: function () { S.value = RX_SAMPLE; if (!P.value) { P.value = RX_PRESETS[0][1]; } run(); },
      clear: function () { S.value = ''; run(); S.focus(); },
      copym: function () { if (last && last.matches && last.matches.length) BT.copy(last.matches.map(function (m) { return m.t; }).join('\n')); else BT.toast('No matches to copy', 'error'); },
      copyr: function () { if (last && last.replaced != null) BT.copy(last.replaced); else BT.toast('Nothing to copy', 'error'); }
    });
    P.value = RX_PRESETS[0][1];
    S.value = RX_SAMPLE;
    run();
  });

  // ===================================================== timestamp-converter
  BT.impl('timestamp-converter', function (root) {
    css();
    var localTZ = (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'Local';
    root.innerHTML = '<div class="card"><div class="card-title"><h3>Current Unix time</h3>' + btn('data-a="pause"', null, 'Pause', 'btn-ghost') + '</div>' +
      '<div class="row cols-2"><div class="stat"><div class="label">Seconds</div><div class="bt-big" id="ts-now-s"></div>' + btn('data-a="copy-now-s"', 'copy', 'Copy', 'btn-ghost') + '</div>' +
      '<div class="stat"><div class="label">Milliseconds</div><div class="bt-big" id="ts-now-ms"></div>' + btn('data-a="copy-now-ms"', 'copy', 'Copy', 'btn-ghost') + '</div></div>' +
      '<p class="muted small" style="margin:10px 0 0" id="ts-now-h"></p></div>' +
      '<div class="card"><div class="card-title"><h3>Timestamp → date</h3></div><div class="row cols-2">' +
      '<div class="field"><label for="ts-in">Unix timestamp</label><input type="text" id="ts-in" class="mono" inputmode="numeric" autocomplete="off" spellcheck="false"></div>' +
      '<div class="field"><label for="ts-unit">Unit</label><select id="ts-unit"><option value="auto">Auto-detect</option><option value="s">Seconds</option><option value="ms">Milliseconds</option><option value="us">Microseconds</option><option value="ns">Nanoseconds</option></select></div></div>' +
      '<div id="ts-out"></div></div>' +
      '<div class="card"><div class="card-title"><h3>Date → timestamp</h3>' + btn('data-a="now"', 'clock', 'Now', 'btn-ghost') + '</div><div class="row cols-2">' +
      '<div class="field"><label for="ts-dt">Date and time</label><input type="datetime-local" id="ts-dt" step="1"></div>' +
      '<div class="field"><label for="ts-tz">Time zone</label><select id="ts-tz"><option value="ist">India (IST, UTC+5:30)</option><option value="utc">UTC</option><option value="local">Your device (' + esc(localTZ) + ')</option></select></div></div>' +
      '<div id="ts-out2"></div></div>';
    var paused = false;
    var g = function (id) { return BT.$('#ts-' + id, root); };
    function kv(rows) {
      return '<div class="bt-kv">' + rows.map(function (r) {
        return '<div class="k">' + r[0] + '</div><div class="v">' + esc(r[1]) + '</div><div class="c"><button type="button" class="btn btn-sm btn-ghost" data-copy="' + esc(r[1]) + '" aria-label="Copy ' + r[0] + '">' + BT.icon('copy') + '</button></div>';
      }).join('') + '</div>';
    }
    function fmtTZ(d, tz) {
      return new Intl.DateTimeFormat('en-IN', { timeZone: tz, weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZoneName: 'short' }).format(d);
    }
    function tick() {
      if (paused) return;
      var n = Date.now();
      g('now-s').textContent = Math.floor(n / 1000);
      g('now-ms').textContent = n;
      g('now-h').textContent = fmtTZ(new Date(n), 'Asia/Kolkata');
    }
    var iv = setInterval(tick, 100);
    tick();
    function conv() {
      var v = g('in').value.trim().replace(/[,_\s]/g, ''), box = g('out');
      if (!v) { box.innerHTML = ''; return; }
      if (!/^-?\d+(\.\d+)?$/.test(v)) { box.innerHTML = notice('error', 'Enter a number such as 1735689600 (seconds) or 1735689600000 (milliseconds).'); return; }
      var unit = g('unit').value, digits = v.replace(/^-/, '').split('.')[0].length;
      if (unit === 'auto') unit = digits <= 11 ? 's' : digits <= 14 ? 'ms' : digits <= 17 ? 'us' : 'ns';
      var num = parseFloat(v), ms = unit === 's' ? num * 1000 : unit === 'ms' ? num : unit === 'us' ? num / 1000 : num / 1e6;
      var d = new Date(ms);
      if (isNaN(d.getTime())) { box.innerHTML = notice('error', 'That timestamp is outside the supported date range.'); return; }
      var unitName = { s: 'seconds', ms: 'milliseconds', us: 'microseconds', ns: 'nanoseconds' }[unit];
      box.innerHTML = '<p class="small muted" style="margin:0 0 10px">Interpreted as <strong>' + unitName + '</strong>' + (g('unit').value === 'auto' ? ' (auto-detected from ' + digits + ' digits)' : '') + '</p>' +
        kv([['India (IST)', fmtTZ(d, 'Asia/Kolkata')], ['UTC', fmtTZ(d, 'UTC')], ['Your time (' + localTZ + ')', fmtTZ(d, undefined)], ['ISO 8601', d.toISOString()], ['RFC 2822', d.toUTCString()], ['Relative', relTime(ms)], ['Seconds', String(Math.floor(ms / 1000))], ['Milliseconds', String(Math.round(ms))]]);
    }
    function pad2(n) { return (n < 10 ? '0' : '') + n; }
    function setDT(ms, tz) {
      var d = new Date(ms + (tz === 'ist' ? 19800000 : 0));
      var useUTC = tz !== 'local';
      var parts = useUTC ? [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()] : [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()];
      g('dt').value = parts[0] + '-' + pad2(parts[1]) + '-' + pad2(parts[2]) + 'T' + pad2(parts[3]) + ':' + pad2(parts[4]) + ':' + pad2(parts[5]);
    }
    function back() {
      var v = g('dt').value, box = g('out2'), tz = g('tz').value;
      var m = /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(v);
      if (!m) { box.innerHTML = '<p class="muted" style="margin:0">Pick a date and time.</p>'; return; }
      var p = m.slice(1).map(function (x) { return +(x || 0); }), ms;
      if (tz === 'local') ms = new Date(p[0], p[1] - 1, p[2], p[3], p[4], p[5]).getTime();
      else ms = Date.UTC(p[0], p[1] - 1, p[2], p[3], p[4], p[5]) - (tz === 'ist' ? 19800000 : 0);
      var d = new Date(ms);
      box.innerHTML = kv([['Seconds', String(Math.floor(ms / 1000))], ['Milliseconds', String(ms)], ['ISO 8601 (UTC)', d.toISOString()], ['India (IST)', fmtTZ(d, 'Asia/Kolkata')], ['Relative', relTime(ms)]]);
    }
    g('in').addEventListener('input', conv);
    g('unit').addEventListener('change', conv);
    g('dt').addEventListener('input', back);
    g('tz').addEventListener('change', function () { back(); });
    root.addEventListener('click', function (e) { var c = e.target.closest('[data-copy]'); if (c) BT.copy(c.getAttribute('data-copy')); });
    onClickA(root, {
      pause: function (b) { paused = !paused; b.querySelector('span').textContent = paused ? 'Resume' : 'Pause'; if (!paused) tick(); },
      'copy-now-s': function () { BT.copy(String(Math.floor(Date.now() / 1000))); },
      'copy-now-ms': function () { BT.copy(String(Date.now())); },
      now: function () { setDT(Date.now(), g('tz').value); back(); }
    });
    g('in').value = String(Math.floor(Date.now() / 1000));
    conv();
    setDT(Date.now(), 'ist');
    back();
    window.addEventListener('pagehide', function () { clearInterval(iv); });
  });

  // ========================================================= color-converter
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), h = 0, s = 0, l = (max + min) / 2, d = max - min;
    if (d) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return [h, s * 100, l * 100];
  }
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r, g, b;
    if (h < 60) { r = c; g = x; b = 0; } else if (h < 120) { r = x; g = c; b = 0; } else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; } else if (h < 300) { r = x; g = 0; b = c; } else { r = c; g = 0; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  function toHex(c) { return '#' + c.slice(0, 3).map(function (v) { return (v < 16 ? '0' : '') + Math.round(v).toString(16); }).join(''); }
  function parseColor(str) {
    var s = String(str || '').trim().toLowerCase(), m;
    if (!s) return null;
    if ((m = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s))) {
      var h = m[1];
      if (h.length <= 4) h = h.split('').map(function (c) { return c + c; }).join('');
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1];
    }
    var nums = function (x) { return x.split(/[\s,\/]+/).filter(Boolean); };
    if ((m = /^rgba?\(([^)]*)\)$/.exec(s)) || (m = /^(\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3})$/.exec(s))) {
      var p = nums(m[1]);
      if (p.length < 3) return null;
      var rgb = p.slice(0, 3).map(function (v) { return /%$/.test(v) ? parseFloat(v) * 2.55 : parseFloat(v); });
      if (rgb.some(isNaN)) return null;
      var a = p[3] != null ? (/%$/.test(p[3]) ? parseFloat(p[3]) / 100 : parseFloat(p[3])) : 1;
      return rgb.map(function (v) { return clamp(Math.round(v), 0, 255); }).concat([clamp(isNaN(a) ? 1 : a, 0, 1)]);
    }
    if ((m = /^hsla?\(([^)]*)\)$/.exec(s))) {
      var q = nums(m[1].replace(/deg/g, ''));
      if (q.length < 3) return null;
      var hh = parseFloat(q[0]), ss = parseFloat(q[1]), ll = parseFloat(q[2]);
      if ([hh, ss, ll].some(isNaN)) return null;
      var aa = q[3] != null ? (/%$/.test(q[3]) ? parseFloat(q[3]) / 100 : parseFloat(q[3])) : 1;
      return hslToRgb(hh, ss, ll).concat([clamp(isNaN(aa) ? 1 : aa, 0, 1)]);
    }
    if (/^[a-z]+$/.test(s)) { // CSS colour names via canvas
      var ctx = document.createElement('canvas').getContext('2d');
      ctx.fillStyle = '#010203'; ctx.fillStyle = s;
      if (ctx.fillStyle === '#010203') return null;
      return parseColor(ctx.fillStyle);
    }
    return null;
  }
  function lum(c) {
    var a = c.slice(0, 3).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function mix(c, t, w) { return [0, 1, 2].map(function (i) { return Math.round(c[i] + (t[i] - c[i]) * w); }); }
  function r1(n) { return Math.round(n * 10) / 10; }

  BT.impl('color-converter', function (root) {
    css();
    var hasEye = 'EyeDropper' in window;
    function f(id, label) {
      return '<div class="field"><label for="cc-' + id + '">' + label + '</label><div class="input-group"><input type="text" id="cc-' + id + '" class="mono" spellcheck="false" autocomplete="off">' +
        '<button type="button" class="btn" data-copy-f="' + id + '" aria-label="Copy ' + label + '">' + BT.icon('copy') + '</button></div></div>';
    }
    root.innerHTML = '<div class="split"><div class="card"><div class="toolbar"><label class="bt-inl" for="cc-pick">Pick <input type="color" id="cc-pick" value="#4f46e5"></label>' +
      (hasEye ? btn('data-a="eye"', 'pipette', 'Pick from screen', 'btn-ghost') : '') + btn('data-a="rand"', 'shuffle', 'Random', 'btn-ghost') + '</div>' +
      f('any', 'Any CSS colour (name, hex, rgb, hsl)') + f('hex', 'HEX') + f('rgb', 'RGB') + f('hsl', 'HSL') +
      '<div class="row cols-2">' + f('hsv', 'HSV / HSB') + f('cmyk', 'CMYK') + '</div><div id="cc-err"></div></div>' +
      '<div class="card"><div id="cc-sw" class="bt-swatch"></div><h3 style="margin:18px 0 10px">Contrast (WCAG 2.1)</h3><div class="row cols-2" id="cc-con"></div></div></div>' +
      '<div class="card"><div class="card-title"><h3>Tints &amp; shades</h3><span class="muted small">Click to copy</span></div>' +
      '<div class="label" style="margin-bottom:6px">Tints (mixed with white)</div><div class="bt-pal" id="cc-tints"></div>' +
      '<div class="label" style="margin:14px 0 6px">Shades (mixed with black)</div><div class="bt-pal" id="cc-shades"></div></div>';
    var col = [79, 70, 229, 1];
    var g = function (id) { return BT.$('#cc-' + id, root); };
    function hsvOf(c) {
      var r = c[0] / 255, gg = c[1] / 255, b = c[2] / 255, max = Math.max(r, gg, b), min = Math.min(r, gg, b), d = max - min;
      var h = rgbToHsl(c[0], c[1], c[2])[0];
      return [Math.round(h), Math.round(max ? d / max * 100 : 0), Math.round(max * 100)];
    }
    function cmykOf(c) {
      var r = c[0] / 255, gg = c[1] / 255, b = c[2] / 255, k = 1 - Math.max(r, gg, b);
      if (k >= 1) return [0, 0, 0, 100];
      return [(1 - r - k) / (1 - k), (1 - gg - k) / (1 - k), (1 - b - k) / (1 - k), k].map(function (v) { return Math.round(v * 100); });
    }
    function render(except) {
      var hsl = rgbToHsl(col[0], col[1], col[2]), a = col[3], hx = toHex(col);
      var aHex = a < 1 ? (Math.round(a * 255) < 16 ? '0' : '') + Math.round(a * 255).toString(16) : '';
      var vals = {
        hex: (hx + aHex).toUpperCase(),
        rgb: a < 1 ? 'rgba(' + col[0] + ', ' + col[1] + ', ' + col[2] + ', ' + r1(a * 100) / 100 + ')' : 'rgb(' + col[0] + ', ' + col[1] + ', ' + col[2] + ')',
        hsl: a < 1 ? 'hsla(' + Math.round(hsl[0]) + ', ' + Math.round(hsl[1]) + '%, ' + Math.round(hsl[2]) + '%, ' + r1(a * 100) / 100 + ')' : 'hsl(' + Math.round(hsl[0]) + ', ' + Math.round(hsl[1]) + '%, ' + Math.round(hsl[2]) + '%)',
        hsv: (function (v) { return 'hsv(' + v[0] + ', ' + v[1] + '%, ' + v[2] + '%)'; })(hsvOf(col)),
        cmyk: (function (v) { return 'cmyk(' + v.join('%, ') + '%)'; })(cmykOf(col))
      };
      Object.keys(vals).forEach(function (k) { if (k !== except) g(k).value = vals[k]; });
      if (except !== 'pick') g('pick').value = hx;
      var white = [255, 255, 255], black = [0, 0, 0], txt = contrast(col, white) >= contrast(col, black) ? '#fff' : '#000';
      var sw = g('sw');
      sw.style.background = vals.rgb; sw.style.color = txt;
      sw.innerHTML = '<span style="font-size:1.4rem">' + esc(vals.hex) + '</span><span>' + esc(vals.rgb) + '</span>';
      g('con').innerHTML = [['White text', white, '#fff'], ['Black text', black, '#000']].map(function (o) {
        var r = contrast(col, o[1]);
        var bd = function (ok, l) { return '<span class="badge ' + (ok ? 'ok' : 'danger') + '">' + (ok ? '✓' : '✗') + ' ' + l + '</span>'; };
        return '<div class="bt-cbox" style="background:' + hx + ';color:' + o[2] + '"><div class="big">Aa ' + o[0] + '</div><div style="font-weight:700">' + r.toFixed(2) + ' : 1</div></div>' +
          '<div class="btn-group" style="align-content:center">' + bd(r >= 4.5, 'AA') + bd(r >= 3, 'AA large') + bd(r >= 7, 'AAA') + bd(r >= 4.5, 'AAA large') + '</div>';
      }).join('');
      var pal = function (target) {
        var out = [];
        for (var i = 0; i <= 10; i++) out.push(mix(col, target, i / 10));
        return out.map(function (c) {
          var h2 = toHex(c), t2 = contrast(c, white) >= contrast(c, black) ? '#fff' : '#000';
          return '<button type="button" style="background:' + h2 + ';color:' + t2 + '" data-copy="' + h2.toUpperCase() + '" title="' + h2.toUpperCase() + '" aria-label="Copy ' + h2.toUpperCase() + '">' + h2.slice(1).toUpperCase() + '</button>';
        }).join('');
      };
      g('tints').innerHTML = pal(white);
      g('shades').innerHTML = pal(black);
      g('err').innerHTML = '';
    }
    function fromField(id) {
      var v = g(id).value, c = null;
      if (id === 'hsv') {
        var m = /(-?[\d.]+)[^\d.-]+([\d.]+)%?[^\d.]+([\d.]+)/.exec(v);
        if (m) { var h = +m[1], s = clamp(+m[2], 0, 100) / 100, vv = clamp(+m[3], 0, 100) / 100, l = vv * (1 - s / 2), sl = l === 0 || l === 1 ? 0 : (vv - l) / Math.min(l, 1 - l); c = hslToRgb(h, sl * 100, l * 100).concat([1]); }
      } else if (id === 'cmyk') {
        var n = (v.match(/[\d.]+/g) || []).map(Number);
        if (n.length === 4) { var k = clamp(n[3], 0, 100) / 100; c = n.slice(0, 3).map(function (x) { return Math.round(255 * (1 - clamp(x, 0, 100) / 100) * (1 - k)); }).concat([1]); }
      } else c = parseColor(v);
      if (!c) { g('err').innerHTML = v.trim() ? notice('error', 'Can’t read “' + esc(v) + '” as a colour.') : ''; return; }
      col = c; render(id);
    }
    ['any', 'hex', 'rgb', 'hsl', 'hsv', 'cmyk'].forEach(function (id) { g(id).addEventListener('input', function () { fromField(id); }); });
    g('pick').addEventListener('input', function () { col = parseColor(g('pick').value); render('pick'); g('any').value = ''; });
    root.addEventListener('click', function (e) {
      var c = e.target.closest('[data-copy]');
      if (c) { BT.copy(c.getAttribute('data-copy')); return; }
      var cf = e.target.closest('[data-copy-f]');
      if (cf) { var v = g(cf.getAttribute('data-copy-f')).value; if (v) BT.copy(v); }
    });
    onClickA(root, {
      rand: function () { col = hslToRgb(Math.random() * 360, 55 + Math.random() * 35, 40 + Math.random() * 25).concat([1]); g('any').value = ''; render(); },
      eye: function () { new window.EyeDropper().open().then(function (r) { col = parseColor(r.sRGBHex); g('any').value = ''; render(); }, function () { /* cancelled */ }); }
    });
    render();
  });

  // ================================================== css-gradient-generator
  var GRAD_PRESETS = [
    ['Indigo dusk', 'linear', 135, [['#4f46e5', 0], ['#ec4899', 100]]],
    ['Saffron', 'linear', 90, [['#ff9933', 0], ['#ffffff', 50], ['#138808', 100]]],
    ['Ocean', 'linear', 160, [['#0ea5e9', 0], ['#2563eb', 55], ['#1e1b4b', 100]]],
    ['Sunset', 'linear', 45, [['#f97316', 0], ['#facc15', 100]]],
    ['Mint', 'linear', 120, [['#34d399', 0], ['#22d3ee', 100]]],
    ['Peach', 'radial', 0, [['#fde68a', 0], ['#fb7185', 70], ['#9d174d', 100]]],
    ['Night', 'linear', 180, [['#0f172a', 0], ['#334155', 100]]],
    ['Aurora', 'conic', 0, [['#22d3ee', 0], ['#a78bfa', 33], ['#f472b6', 66], ['#22d3ee', 100]]]
  ];
  BT.impl('css-gradient-generator', function (root) {
    css();
    var st = { type: 'linear', angle: 135, shape: 'circle', pos: 'center', rep: false, stops: [{ c: '#4f46e5', p: 0 }, { c: '#ec4899', p: 100 }] };
    root.innerHTML = '<div class="card"><div id="gg-prev" class="bt-grad" role="img" aria-label="Gradient preview"></div>' +
      '<div class="bt-fhead" style="margin-top:14px"><span class="lbl">Presets</span></div><div class="bt-presets" id="gg-presets">' +
      GRAD_PRESETS.map(function (p, i) { return '<button type="button" data-preset="' + i + '" title="' + esc(p[0]) + '" aria-label="Preset: ' + esc(p[0]) + '"></button>'; }).join('') + '</div></div>' +
      '<div class="split" style="margin-top:16px"><div class="card"><div class="row cols-2">' +
      '<div class="field"><span class="label">Type</span>' + seg('gg-type', [['linear', 'Linear'], ['radial', 'Radial'], ['conic', 'Conic']], 'linear', 'Gradient type') + '</div>' +
      '<div class="field" id="gg-angle-f"><label for="gg-angle">Angle: <output id="gg-angle-v">135°</output></label><input type="range" id="gg-angle" min="0" max="360" value="135"></div>' +
      '<div class="field hidden" id="gg-shape-f"><label for="gg-shape">Shape</label><select id="gg-shape"><option value="circle">Circle</option><option value="ellipse">Ellipse</option></select></div>' +
      '<div class="field hidden" id="gg-pos-f"><label for="gg-pos">Position</label><select id="gg-pos">' +
      ['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right'].map(function (p) { return '<option value="' + p + '">' + p + '</option>'; }).join('') + '</select></div>' +
      '</div>' + chk('gg-rep', 'Repeating gradient', false) +
      '<div class="card-title" style="margin:18px 0 4px"><h3>Colour stops</h3><div class="btn-group">' + btn('data-a="add"', 'plus', 'Add stop') + btn('data-a="rand"', 'shuffle', 'Random', 'btn-ghost') + '</div></div>' +
      '<div id="gg-stops"></div></div>' +
      '<div class="card"><div class="card-title"><h3>CSS</h3>' + btn('data-a="copy"', 'copy', 'Copy CSS', 'btn-primary') + '</div><pre id="gg-css" class="bt-code" style="margin:0"></pre>' +
      '<p class="muted small" style="margin:10px 0 0">The first line is a solid-colour fallback for very old browsers.</p></div></div>';
    var g = function (id) { return BT.$('#gg-' + id, root); };
    function grad(s) {
      var stops = s.stops.slice().sort(function (a, b) { return a.p - b.p; }).map(function (x) { return x.c + ' ' + x.p + '%'; }).join(', ');
      var fn = (s.rep ? 'repeating-' : '') + s.type + '-gradient';
      if (s.type === 'linear') return fn + '(' + s.angle + 'deg, ' + stops + ')';
      if (s.type === 'radial') return fn + '(' + s.shape + ' at ' + s.pos + ', ' + stops + ')';
      return fn + '(from ' + s.angle + 'deg at ' + s.pos + ', ' + stops + ')';
    }
    function renderStops() {
      g('stops').innerHTML = st.stops.map(function (s, i) {
        return '<div class="bt-stop"><input type="color" value="' + s.c + '" data-i="' + i + '" data-k="c" aria-label="Stop ' + (i + 1) + ' colour">' +
          '<input type="text" value="' + s.c + '" data-i="' + i + '" data-k="t" aria-label="Stop ' + (i + 1) + ' hex" spellcheck="false">' +
          '<input type="range" min="0" max="100" value="' + s.p + '" data-i="' + i + '" data-k="p" aria-label="Stop ' + (i + 1) + ' position">' +
          '<span class="pos">' + s.p + '%</span>' +
          '<button type="button" class="btn btn-sm btn-ghost" data-rm="' + i + '" aria-label="Remove stop ' + (i + 1) + '"' + (st.stops.length <= 2 ? ' disabled' : '') + '>' + BT.icon('trash-2') + '</button></div>';
      }).join('');
      BT.$('[data-a="add"]', root).disabled = st.stops.length >= 5;
    }
    function render() {
      var css = grad(st);
      g('prev').style.background = css;
      g('css').textContent = 'background: ' + st.stops[0].c + ';\nbackground: ' + css + ';';
      g('angle-f').classList.toggle('hidden', st.type === 'radial');
      g('shape-f').classList.toggle('hidden', st.type !== 'radial');
      g('pos-f').classList.toggle('hidden', st.type === 'linear');
      g('angle-v').textContent = st.angle + '°';
    }
    BT.$$('[data-preset]', root).forEach(function (b) {
      var p = GRAD_PRESETS[+b.getAttribute('data-preset')];
      b.style.background = grad({ type: p[1], angle: p[2], shape: 'circle', pos: 'center', rep: false, stops: p[3].map(function (x) { return { c: x[0], p: x[1] }; }) });
    });
    g('stops').addEventListener('input', function (e) {
      var i = e.target.getAttribute('data-i'), k = e.target.getAttribute('data-k');
      if (i == null) return;
      var s = st.stops[+i];
      if (k === 'c') { s.c = e.target.value; e.target.nextElementSibling.value = s.c; }
      else if (k === 't') { var c = parseColor(e.target.value); if (!c) return; s.c = toHex(c); e.target.previousElementSibling.value = s.c; }
      else { s.p = +e.target.value; e.target.nextElementSibling.textContent = s.p + '%'; }
      render();
    });
    wireSeg(g('type'), function (v) { st.type = v; render(); });
    g('angle').addEventListener('input', function () { st.angle = +g('angle').value; render(); });
    g('shape').addEventListener('change', function () { st.shape = g('shape').value; render(); });
    g('pos').addEventListener('change', function () { st.pos = g('pos').value; render(); });
    g('rep').addEventListener('change', function () { st.rep = g('rep').checked; render(); });
    root.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-rm]');
      if (rm && st.stops.length > 2) { st.stops.splice(+rm.getAttribute('data-rm'), 1); renderStops(); render(); return; }
      var pr = e.target.closest('[data-preset]');
      if (pr) {
        var p = GRAD_PRESETS[+pr.getAttribute('data-preset')];
        st.type = p[1]; st.angle = p[2] || 0; st.stops = p[3].map(function (x) { return { c: x[0], p: x[1] }; });
        setSeg(g('type'), st.type); g('angle').value = st.angle;
        renderStops(); render();
      }
    });
    onClickA(root, {
      add: function () {
        if (st.stops.length >= 5) return;
        var s = st.stops.slice().sort(function (a, b) { return a.p - b.p; }), gap = 0, at = 0;
        for (var i = 0; i < s.length - 1; i++) if (s[i + 1].p - s[i].p > gap) { gap = s[i + 1].p - s[i].p; at = i; }
        var a = parseColor(s[at].c), b = parseColor(s[at + 1].c);
        st.stops.push({ c: toHex(mix(a, b, 0.5)), p: Math.round((s[at].p + s[at + 1].p) / 2) });
        renderStops(); render();
      },
      rand: function () {
        var h = Math.random() * 360;
        st.stops = st.stops.map(function (s, i) { return { c: toHex(hslToRgb(h + i * (40 + Math.random() * 60), 70 + Math.random() * 25, 45 + Math.random() * 20)), p: s.p }; });
        st.angle = Math.round(Math.random() * 36) * 10; g('angle').value = st.angle;
        renderStops(); render();
      },
      copy: function () { BT.copy(g('css').textContent, 'CSS copied'); }
    });
    renderStops();
    render();
  });

  // ==================================================== box-shadow-generator
  var SHADOW_PRESETS = [
    ['Soft', [[0, 10, 30, -5, '#000000', 0.18, false]]],
    ['Medium', [[0, 4, 6, -1, '#000000', 0.1, false], [0, 2, 4, -2, '#000000', 0.1, false]]],
    ['Large', [[0, 25, 50, -12, '#000000', 0.25, false]]],
    ['Hard', [[8, 8, 0, 0, '#111827', 1, false]]],
    ['Glow', [[0, 0, 24, 4, '#4f46e5', 0.55, false]]],
    ['Layered', [[0, 1, 1, 0, '#000000', 0.08, false], [0, 2, 2, 0, '#000000', 0.08, false], [0, 4, 4, 0, '#000000', 0.08, false], [0, 8, 8, 0, '#000000', 0.08, false], [0, 16, 16, 0, '#000000', 0.08, false]]],
    ['Neumorphic', [[9, 9, 16, 0, '#a3b1c6', 0.6, false], [-9, -9, 16, 0, '#ffffff', 0.8, false]]],
    ['Inset', [[0, 2, 8, 0, '#000000', 0.25, true]]]
  ];
  BT.impl('box-shadow-generator', function (root) {
    css();
    var layers = [{ x: 0, y: 10, blur: 30, spread: -5, color: '#000000', op: 0.18, inset: false }], sel = 0;
    var box = { radius: 16, bg: '#ffffff', stage: '#eef0f7' };
    function rn(id, label, min, max, step) {
      return '<div class="bt-rn"><label for="bs-' + id + '">' + label + '</label><input type="range" id="bs-' + id + '" min="' + min + '" max="' + max + '" step="' + (step || 1) + '" data-k="' + id + '">' +
        '<input type="number" id="bs-' + id + '-n" min="' + min + '" max="' + max + '" step="' + (step || 1) + '" data-k="' + id + '" aria-label="' + label + ' value"></div>';
    }
    root.innerHTML = '<div class="split"><div class="card"><div id="bs-stage" class="bt-shadow-stage"><div id="bs-box" class="bt-shadow-box">Preview</div></div>' +
      '<div class="bt-fhead" style="margin-top:14px"><span class="lbl">Presets</span></div><div class="chips" id="bs-presets">' +
      SHADOW_PRESETS.map(function (p, i) { return '<button type="button" class="chip" data-preset="' + i + '">' + esc(p[0]) + '</button>'; }).join('') + '</div>' +
      '<div class="row cols-3" style="margin-top:16px">' +
      '<div class="field"><label for="bs-radius">Corner radius</label><input type="number" id="bs-radius" min="0" max="200" value="16"></div>' +
      '<div class="field"><label for="bs-boxbg">Box colour</label><input type="color" id="bs-boxbg" value="#ffffff"></div>' +
      '<div class="field"><label for="bs-stagebg">Background</label><input type="color" id="bs-stagebg" value="#eef0f7"></div></div></div>' +
      '<div><div class="card"><div class="card-title"><h3>Layers</h3>' + btn('data-a="add"', 'plus', 'Add layer') + '</div>' +
      '<div class="chips" id="bs-layers" role="group" aria-label="Shadow layers" style="margin-bottom:16px"></div>' +
      rn('x', 'X offset', -100, 100) + rn('y', 'Y offset', -100, 100) + rn('blur', 'Blur', 0, 200) + rn('spread', 'Spread', -100, 100) + rn('op', 'Opacity', 0, 1, 0.01) +
      '<div class="toolbar" style="margin:6px 0 0"><label class="bt-inl" for="bs-color">Colour <input type="color" id="bs-color"></label>' + chk('bs-inset', 'Inset', false) +
      '<span class="spacer"></span>' + btn('data-a="rm"', 'trash-2', 'Remove layer', 'btn-ghost') + '</div></div>' +
      '<div class="card"><div class="card-title"><h3>CSS</h3>' + btn('data-a="copy"', 'copy', 'Copy CSS', 'btn-primary') + '</div><pre id="bs-css" class="bt-code" style="margin:0"></pre></div></div></div>';
    var g = function (id) { return BT.$('#bs-' + id, root); };
    function rgba(hx, a) { var c = parseColor(hx) || [0, 0, 0]; return a >= 1 ? 'rgb(' + c[0] + ', ' + c[1] + ', ' + c[2] + ')' : 'rgba(' + c[0] + ', ' + c[1] + ', ' + c[2] + ', ' + (+a).toFixed(2).replace(/0$/, '') + ')'; }
    function layerCSS(l) { return (l.inset ? 'inset ' : '') + l.x + 'px ' + l.y + 'px ' + l.blur + 'px ' + l.spread + 'px ' + rgba(l.color, l.op); }
    function sync() {
      var l = layers[sel];
      ['x', 'y', 'blur', 'spread', 'op'].forEach(function (k) { g(k).value = l[k]; g(k + '-n').value = l[k]; });
      g('color').value = l.color; g('inset').checked = l.inset;
      g('layers').innerHTML = layers.map(function (_, i) { return '<button type="button" class="chip" data-layer="' + i + '" aria-pressed="' + (i === sel) + '">Layer ' + (i + 1) + '</button>'; }).join('');
      BT.$('[data-a="rm"]', root).disabled = layers.length < 2;
      BT.$('[data-a="add"]', root).disabled = layers.length >= 8;
    }
    function render() {
      var v = layers.map(layerCSS).join(',\n    ');
      g('box').style.boxShadow = layers.map(layerCSS).join(', ');
      g('box').style.borderRadius = box.radius + 'px';
      g('box').style.background = box.bg;
      g('box').style.color = contrast(parseColor(box.bg), [0, 0, 0]) > 7 ? '#64748b' : '#cbd5e1';
      g('stage').style.background = box.stage;
      g('css').textContent = 'box-shadow: ' + v + ';';
    }
    root.addEventListener('input', function (e) {
      var k = e.target.getAttribute('data-k');
      if (k) {
        var v = parseFloat(e.target.value);
        if (isNaN(v)) return;
        layers[sel][k] = v;
        (e.target.type === 'range' ? g(k + '-n') : g(k)).value = v;
      } else if (e.target.id === 'bs-color') layers[sel].color = e.target.value;
      else if (e.target.id === 'bs-radius') box.radius = Math.max(0, BT.num(e.target.value) || 0);
      else if (e.target.id === 'bs-boxbg') box.bg = e.target.value;
      else if (e.target.id === 'bs-stagebg') box.stage = e.target.value;
      render();
    });
    g('inset').addEventListener('change', function () { layers[sel].inset = g('inset').checked; render(); });
    root.addEventListener('click', function (e) {
      var ly = e.target.closest('[data-layer]');
      if (ly) { sel = +ly.getAttribute('data-layer'); sync(); return; }
      var pr = e.target.closest('[data-preset]');
      if (pr) {
        var p = SHADOW_PRESETS[+pr.getAttribute('data-preset')];
        layers = p[1].map(function (a) { return { x: a[0], y: a[1], blur: a[2], spread: a[3], color: a[4], op: a[5], inset: a[6] }; });
        sel = 0;
        if (p[0] === 'Neumorphic') { box.bg = box.stage = '#e0e5ec'; g('boxbg').value = g('stagebg').value = '#e0e5ec'; }
        sync(); render();
      }
    });
    onClickA(root, {
      add: function () { if (layers.length >= 8) return; var c = layers[sel]; layers.push({ x: c.x, y: c.y + 4, blur: c.blur, spread: c.spread, color: c.color, op: c.op, inset: false }); sel = layers.length - 1; sync(); render(); },
      rm: function () { if (layers.length < 2) return; layers.splice(sel, 1); sel = Math.max(0, sel - 1); sync(); render(); },
      copy: function () { BT.copy(g('css').textContent, 'CSS copied'); }
    });
    sync();
    render();
  });

  // =========================================================== code-minifier
  function minifyCSS(src, keepBang) {
    var parts = [], buf = '', i = 0, n = src.length;
    function flush() { if (buf) { parts.push({ t: buf }); buf = ''; } }
    while (i < n) {
      var c = src[i];
      if (c === '/' && src[i + 1] === '*') {
        var end = src.indexOf('*/', i + 2);
        end = end < 0 ? n : end + 2;
        if (keepBang && src[i + 2] === '!') { flush(); parts.push({ raw: src.slice(i, end) + '\n' }); }
        else buf += ' ';
        i = end; continue;
      }
      if (c === '"' || c === '\'') {
        var j = i + 1;
        while (j < n && src[j] !== c) { if (src[j] === '\\') j++; else if (src[j] === '\n') break; j++; }
        flush(); parts.push({ raw: src.slice(i, j + 1) }); i = j + 1; continue;
      }
      buf += c; i++;
    }
    flush();
    var out = parts.map(function (p) {
      if (p.raw != null) return p.raw;
      return p.t.replace(/\s+/g, ' ')
        .replace(/\s*([{};,>~])\s*/g, '$1')
        .replace(/:\s+/g, ':')
        .replace(/\(\s+/g, '(').replace(/\s+\)/g, ')')
        .replace(/;+/g, ';');
    }).join('');
    return out.replace(/;}/g, '}').replace(/^\s+|\s+$/g, '').replace(/[^{}]+\{\}/g, function (m) { return /^@/.test(m.trim()) ? m : ''; });
  }
  var RAW_TAGS = /^(pre|textarea|script|style)$/;
  var BLOCK_TAGS = new Set(('html head body title meta link base script style noscript div p ul ol li dl dt dd table thead tbody tfoot tr td th caption colgroup col ' +
    'section article aside header footer nav main h1 h2 h3 h4 h5 h6 form fieldset legend hr br blockquote figure figcaption address details summary option optgroup ' +
    'select iframe template svg canvas video audio source track picture dialog menu').split(' '));
  function minifyHTML(src) {
    var toks = [], i = 0, n = src.length;
    var tagRe = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>/y;
    while (i < n) {
      if (src.startsWith('<!--', i)) {
        var e = src.indexOf('-->', i + 4), end = e < 0 ? n : e + 3, c = src.slice(i, end);
        if (/^<!--\[if|^<!--<!\[endif|<!\[endif\]-->$/i.test(c)) toks.push({ t: 'raw', s: c });
        i = end; continue;
      }
      if (src[i] === '<' && (src[i + 1] === '!' || src[i + 1] === '?')) {
        var e2 = src.indexOf('>', i), end2 = e2 < 0 ? n : e2 + 1;
        toks.push({ t: 'raw', s: src.slice(i, end2).replace(/\s+/g, ' ') }); i = end2; continue;
      }
      if (src[i] === '<') {
        tagRe.lastIndex = i;
        var m = tagRe.exec(src);
        if (m) {
          var name = m[2].toLowerCase(), closing = !!m[1];
          var attrs = (m[3].match(/[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g) || []).map(function (a) { return ' ' + a.replace(/^([^=\s]+)\s*=\s*/, '$1='); }).join('');
          toks.push({ t: 'tag', s: '<' + m[1] + m[2] + attrs + (m[4] ? '/' : '') + '>', name: name });
          i = tagRe.lastIndex;
          if (!closing && RAW_TAGS.test(name)) {
            var re2 = new RegExp('</' + name + '\\s*>', 'ig');
            re2.lastIndex = i;
            var mm = re2.exec(src), cend = mm ? mm.index : n;
            if (cend > i) toks.push({ t: 'raw', s: src.slice(i, cend), inner: true });
            i = cend;
          }
          continue;
        }
      }
      var nx = src.indexOf('<', src[i] === '<' ? i + 1 : i);
      if (nx < 0) nx = n;
      var last = toks[toks.length - 1];
      if (last && last.t === 'text') last.s += src.slice(i, nx); else toks.push({ t: 'text', s: src.slice(i, nx) });
      i = nx;
    }
    function block(t) { return !t || (t.t === 'raw' && !t.inner) || (t.t === 'tag' && BLOCK_TAGS.has(t.name)); }
    return toks.map(function (t, k) {
      if (t.t !== 'text') return t.s;
      var prev = toks[k - 1], next = toks[k + 1], s = t.s.replace(/\s+/g, ' ');
      if (s === ' ') return block(prev) || block(next) ? '' : ' ';
      if (block(prev)) s = s.replace(/^ /, '');
      if (block(next)) s = s.replace(/ $/, '');
      return s;
    }).join('').trim();
  }
  var MIN_SAMPLES = {
    css: '/*! Theme v1.0 | MIT */\n/* Main layout */\n.card {\n  display: flex;\n  padding: 16px 20px;\n  margin: 0 auto ;\n  color: #333333;\n  font-family: "Segoe UI", Roboto, sans-serif;\n  width: calc(100% - 2rem);\n}\n\n.card > .title:hover ,\n.card a::after {\n  content: "  →  ";\n  color: rgba( 79, 70, 229, 0.9 );\n}\n\n@media (max-width: 600px) {\n  .card { flex-direction: column; }\n}\n',
    html: '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <title>  My   Page </title>\n    <!-- page styles -->\n    <style>\n      body { margin: 0; }\n    </style>\n  </head>\n  <body>\n    <!--[if IE]><p>Please upgrade your browser.</p><![endif]-->\n    <div   class="hero"   id="top">\n      <h1>Hello,   <em>World</em>!</h1>\n      <p>\n        Some   <b>bold</b> <i>text</i>   here.\n      </p>\n      <pre>\n  keep   this\n    spacing\n</pre>\n    </div>\n    <script>\n      // comment inside script is kept\n      console.log("hi");\n    </script>\n  </body>\n</html>\n',
    json: '{\n  "name": "biscs-tools",\n  "version": "1.0.0",\n  "private": true,\n  "scripts": {\n    "build": "node scripts/build.mjs",\n    "test": "node scripts/smoke.mjs"\n  },\n  "keywords": [\n    "tools",\n    "india"\n  ]\n}\n'
  };
  BT.impl('code-minifier', function (root) {
    css();
    root.innerHTML = '<div class="card"><div class="toolbar">' + seg('cm-lang', [['css', 'CSS'], ['html', 'HTML'], ['json', 'JSON']], 'css', 'Language') +
      '<span id="cm-opt">' + chk('cm-bang', 'Keep /*! licence */ comments', true) + '</span><span class="spacer"></span>' +
      fileBtn('cm-file', '.css,.html,.htm,.json,.txt', 'Upload') + btn('data-a="sample"', 'sparkles', 'Sample', 'btn-ghost') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
      '<div class="split"><div class="bt-pane"><div class="bt-fhead"><label for="cm-in">Original</label><span class="muted small" id="cm-in-n"></span></div>' +
      '<textarea id="cm-in" class="mono bt-ta-xl" spellcheck="false" placeholder="Paste CSS here…"></textarea></div>' +
      '<div class="bt-pane"><div class="bt-fhead"><label for="cm-out">Minified</label><span class="muted small" id="cm-out-n"></span><span class="spacer"></span>' +
      btn('data-a="copy"', 'copy', 'Copy') + btn('data-a="dl"', 'download', 'Download', 'btn-primary') + '</div>' +
      '<textarea id="cm-out" class="mono bt-ta-xl" spellcheck="false" readonly></textarea></div></div>' +
      '<div class="stats" id="cm-stats" style="margin-top:16px"></div><div id="cm-err" style="margin-top:12px"></div></div>';
    var lang = BT.$('#cm-lang', root), inp = BT.$('#cm-in', root), out = BT.$('#cm-out', root);
    function stat(l, v) { return '<div class="stat"><div class="label">' + l + '</div><div class="value">' + v + '</div></div>'; }
    function run() {
      var L = segVal(lang), t = inp.value, err = BT.$('#cm-err', root);
      BT.$('#cm-opt', root).style.display = L === 'css' ? '' : 'none';
      inp.placeholder = 'Paste ' + L.toUpperCase() + ' here, or drop a file…';
      err.innerHTML = ''; out.value = '';
      if (!t.trim()) { BT.$('#cm-stats', root).innerHTML = ''; BT.$('#cm-in-n', root).textContent = ''; BT.$('#cm-out-n', root).textContent = ''; return; }
      try {
        if (L === 'css') out.value = minifyCSS(t, BT.$('#cm-bang', root).checked);
        else if (L === 'html') out.value = minifyHTML(t);
        else out.value = JSON.stringify(JSON.parse(t.replace(/^﻿/, '')));
      } catch (e) {
        if (L === 'json') err.innerHTML = errorBox(jsonError(e, t), t).replace(/<button[^>]*data-a="goto"[^>]*>.*?<\/button>/, '');
        else err.innerHTML = notice('error', esc(e.message));
      }
      var a = bytesLen(t), b = bytesLen(out.value), saved = a ? (a - b) / a * 100 : 0;
      BT.$('#cm-in-n', root).textContent = BT.fmtBytes(a);
      BT.$('#cm-out-n', root).textContent = out.value ? BT.fmtBytes(b) : '';
      BT.$('#cm-stats', root).innerHTML = out.value ? stat('Original', BT.fmtBytes(a)) + stat('Minified', BT.fmtBytes(b)) +
        stat('Saved', '<span style="color:var(--ok)">' + BT.fmtBytes(a - b) + ' (' + saved.toFixed(1) + '%)</span>') : '';
    }
    wireSeg(lang, run);
    var deb = BT.debounce(run, 200);
    inp.addEventListener('input', deb);
    BT.$('#cm-bang', root).addEventListener('change', run);
    textFileInput(BT.$('#cm-file', root), inp, function (f) {
      var ext = (f.name.split('.').pop() || '').toLowerCase();
      if (ext === 'htm' || ext === 'html') setSeg(lang, 'html'); else if (ext === 'json') setSeg(lang, 'json'); else if (ext === 'css') setSeg(lang, 'css');
      BT.toast('Loaded ' + f.name); run();
    });
    onClickA(root, {
      sample: function () { inp.value = MIN_SAMPLES[segVal(lang)]; run(); },
      clear: function () { inp.value = ''; run(); inp.focus(); },
      copy: function () { if (out.value) BT.copy(out.value); else BT.toast('Nothing to copy', 'error'); },
      dl: function () {
        if (!out.value) { BT.toast('Nothing to download', 'error'); return; }
        var L = segVal(lang);
        BT.download(out.value, L === 'css' ? 'styles.min.css' : L === 'html' ? 'index.min.html' : 'data.min.json', L === 'css' ? 'text/css' : L === 'html' ? 'text/html' : 'application/json');
      }
    });
    inp.value = MIN_SAMPLES.css;
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
