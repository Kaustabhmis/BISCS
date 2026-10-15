/*
 * BISCS Tools — Finance & Tax calculators (India).
 * GST, EMI, SIP, lumpsum, FD, RD, PPF, income tax, HRA, gratuity,
 * compound/simple interest, CAGR, inflation, profit margin and discount.
 */
(function () {
  'use strict';
  var BT = window.BT;
  var $ = BT.$, $$ = BT.$$, esc = BT.esc, num = BT.num;
  var INR = function (n, dp) { return BT.fmtINR(n, dp); };
  var N = function (n, dp) { return BT.fmtNum(n, dp); };

  // ------------------------------------------------------------------ styles
  var CSS = [
    '.fx-col{display:flex;flex-direction:column;gap:16px;min-width:0}',
    '.fx-col>.card+.card,.fx-col>*{margin-top:0}',
    '.fx-stack>*+*{margin-top:16px}',
    '.fx-sl{margin-bottom:18px}',
    '.fx-sl-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}',
    '.fx-sl-head label{font-size:.85rem;font-weight:600;color:var(--text-2)}',
    '.fx-sl-head .input-group{width:190px;max-width:100%}',
    '.fx-sl-head .input-group input{text-align:right;font-weight:700;min-height:38px;padding:7px 10px}',
    '.fx-sl input[type=range]{margin:10px 0 0}',
    '.fx-sl-scale{display:flex;justify-content:space-between;font-size:.75rem;color:var(--text-3)}',
    '.fx-sub{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:10px;font-size:.92rem;opacity:.92}',
    '.fx-sub b{font-weight:700}',
    '.fx-donut{display:flex;align-items:center;gap:22px;flex-wrap:wrap}',
    '.fx-donut svg{width:132px;height:132px;flex:none;transform:rotate(-90deg)}',
    '.fx-donut ul{list-style:none;margin:0;padding:0;display:grid;gap:10px;flex:1;min-width:170px}',
    '.fx-donut li{display:flex;align-items:center;gap:10px;font-size:.9rem;color:var(--text-2)}',
    '.fx-donut li i{width:12px;height:12px;border-radius:4px;flex:none}',
    '.fx-donut li b{margin-left:auto;color:var(--text);font-variant-numeric:tabular-nums}',
    '.fx-cols{position:relative;display:flex;align-items:flex-end;gap:3px;height:190px;padding-top:6px;border-bottom:1px solid var(--border-strong);',
    'background-image:linear-gradient(to bottom,var(--border) 1px,transparent 1px);background-size:100% 25%}',
    '.fx-cols>div{flex:1;min-width:0;height:100%;display:flex;flex-direction:column-reverse}',
    '.fx-cols>div>span{display:block;width:100%;min-height:0}',
    '.fx-cols>div>span:last-child{border-radius:4px 4px 0 0}',
    '.fx-cols>div:hover>span{filter:brightness(1.12)}',
    '.fx-xl{display:flex;gap:3px;margin-top:6px}',
    '.fx-xl span{flex:1;min-width:0;text-align:center;font-size:.7rem;color:var(--text-3);overflow:visible;white-space:nowrap}',
    '.fx-ymax{display:flex;justify-content:space-between;font-size:.75rem;color:var(--text-3);margin-bottom:4px}',
    '.fx-details>summary{cursor:pointer;font-weight:650;display:flex;align-items:center;gap:8px;list-style:none;padding:2px 0}',
    '.fx-details>summary::-webkit-details-marker{display:none}',
    '.fx-details>summary .icon{transition:transform .15s}',
    '.fx-details[open]>summary .icon{transform:rotate(180deg)}',
    '.fx-details[open]>summary{margin-bottom:12px}',
    '.fx-details .table-wrap{max-height:420px;overflow:auto}',
    '.fx-seg-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:14px}',
    '.fx-seg-wrap .seg{display:flex;width:fit-content;max-width:100%}',
    '.fx-regimes{display:grid;gap:12px;grid-template-columns:1fr}',
    '@media(min-width:520px){.fx-regimes{grid-template-columns:1fr 1fr}}',
    '.fx-reg{border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;background:var(--surface-2);position:relative}',
    '.fx-reg.win{border-color:var(--ok);background:var(--ok-soft)}',
    '.fx-reg h4{margin:0 0 6px;font-size:.95rem;display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.fx-reg .big{font-size:1.6rem;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums}',
    '.fx-reg .meta{font-size:.82rem;color:var(--text-3);margin-top:4px}',
    '.table tr.fx-hl td{background:var(--ok-soft);font-weight:650}',
    '.table tr.fx-total td{font-weight:750;border-top:2px solid var(--border-strong)}',
    '.fx-note{font-size:.8rem;color:var(--text-3);margin:10px 0 0}',
    '.fx-inline{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center}',
    '.fx-mt{margin-top:14px}',
    '#tool-root .card-title{flex-wrap:wrap}',
    '@media(max-width:560px){.fx-fit .table th,.fx-fit .table td{white-space:normal;padding:8px 8px;font-size:.84rem}.fx-fit .table td.num{white-space:nowrap}}'
  ].join('\n');
  function injectStyle() {
    if (document.getElementById('fx-style')) return;
    var s = document.createElement('style');
    s.id = 'fx-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ----------------------------------------------------------------- helpers
  /**
   * Like BT.bindInputs, but ignores the "change" that text fields fire on blur:
   * they already fired "input", and re-rendering on blur would swallow the
   * first click on any button inside the re-rendered output.
   */
  function bindLive(root, fn) {
    root.addEventListener('input', fn);
    root.addEventListener('change', function (e) {
      var t = e.target;
      if (t && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && !/^(checkbox|radio|range|date|time)$/.test(t.type)))) return;
      fn(e);
    });
    fn();
  }
  function ok(n) { return typeof n === 'number' && isFinite(n); }
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
  function pct(n, dp) { return ok(n) ? N(n, dp == null ? 2 : dp) + '%' : '—'; }
  function trimNum(n, dp) { return Number(n.toFixed(dp == null ? 2 : dp)).toString(); }
  /** ₹12.5 L / ₹3.2 Cr compact rupees */
  function compact(n) {
    if (!ok(n)) return '—';
    var a = Math.abs(n), s = n < 0 ? '-₹' : '₹';
    if (a >= 1e7) return s + trimNum(a / 1e7) + ' Cr';
    if (a >= 1e5) return s + trimNum(a / 1e5) + ' L';
    if (a >= 1e3) return s + trimNum(a / 1e3, 1) + 'K';
    return s + Math.round(a);
  }
  /** "23.23 Lakh" style words for the hero card. */
  function lakhWords(n) {
    if (!ok(n)) return '';
    var a = Math.abs(n);
    if (a >= 1e7) return trimNum(a / 1e7) + ' Crore';
    if (a >= 1e5) return trimNum(a / 1e5) + ' Lakh';
    if (a >= 1e3) return trimNum(a / 1e3) + ' Thousand';
    return '';
  }
  function val(root, id) { var el = $('#' + id, root); return el ? num(el.value) : NaN; }
  function segVal(root, id) { var b = $('#' + id + ' button.active', root); return b ? b.getAttribute('data-v') : null; }
  function setSeg(root, id, v) {
    $$('#' + id + ' button', root).forEach(function (b) {
      var on = b.getAttribute('data-v') === String(v);
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  /** Plain text field. o: {id,label,value,pre,post,hint,amt,cls,ph} */
  function F(o) {
    var input = '<input type="text" inputmode="decimal" autocomplete="off" id="' + o.id + '" value="' + esc(o.value == null ? '' : o.value) + '"' +
      (o.amt ? ' data-amt' : '') + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + '>';
    var ctl = (o.pre || o.post) ? '<div class="input-group">' + (o.pre ? '<span class="addon">' + o.pre + '</span>' : '') + input +
      (o.post ? '<span class="addon">' + o.post + '</span>' : '') + '</div>' : input;
    return '<div class="field' + (o.cls ? ' ' + o.cls : '') + '"><label for="' + o.id + '">' + o.label + '</label>' + ctl +
      (o.hint ? '<div class="hint" id="' + o.id + '-hint">' + o.hint + '</div>' : '') + '</div>';
  }
  /** Field with a synced range slider. o: F options + {min,max,step,scale:[lo,hi]} */
  function S(o) {
    var v = o.value;
    var shown = o.amt ? N(v, 2) : v;
    var input = '<input type="text" inputmode="decimal" autocomplete="off" id="' + o.id + '" value="' + esc(shown) + '"' + (o.amt ? ' data-amt' : '') + '>';
    return '<div class="field fx-sl"><div class="fx-sl-head"><label for="' + o.id + '">' + o.label + '</label>' +
      '<div class="input-group">' + (o.pre ? '<span class="addon">' + o.pre + '</span>' : '') + input + (o.post ? '<span class="addon" id="' + o.id + '-post">' + o.post + '</span>' : '') + '</div></div>' +
      '<input type="range" id="' + o.id + '-r" data-for="' + o.id + '" min="' + o.min + '" max="' + o.max + '" step="' + o.step + '" value="' + v + '" aria-label="' + esc(o.label.replace(/<[^>]+>/g, '')) + ' slider">' +
      '<div class="fx-sl-scale"><span id="' + o.id + '-lo">' + (o.scale ? o.scale[0] : o.min) + '</span><span id="' + o.id + '-hi">' + (o.scale ? o.scale[1] : o.max) + '</span></div>' +
      (o.hint ? '<div class="hint">' + o.hint + '</div>' : '') + '</div>';
  }
  /** Segmented control. opts: [[value,label],...] */
  function Seg(id, opts, active, label) {
    return '<div class="seg" id="' + id + '" data-seg role="group"' + (label ? ' aria-label="' + esc(label) + '"' : '') + '>' + opts.map(function (o) {
      var on = String(o[0]) === String(active);
      return '<button type="button" data-v="' + esc(o[0]) + '" class="' + (on ? 'active' : '') + '" aria-pressed="' + on + '">' + o[1] + '</button>';
    }).join('') + '</div>';
  }
  function SegField(id, label, opts, active) {
    return '<div class="field fx-seg-wrap"><span class="label" id="' + id + '-lbl">' + label + '</span>' + Seg(id, opts, active, label) + '</div>';
  }
  function Sel(id, label, opts, active, hint) {
    return '<div class="field"><label for="' + id + '">' + label + '</label><select id="' + id + '">' + opts.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(active) ? ' selected' : '') + '>' + o[1] + '</option>';
    }).join('') + '</select>' + (hint ? '<div class="hint">' + hint + '</div>' : '') + '</div>';
  }

  function hero(label, value, sub) {
    return '<div class="result" aria-live="polite"><div class="label">' + label + '</div><div class="value">' + value + '</div>' +
      (sub ? '<div class="fx-sub">' + sub + '</div>' : '') + '</div>';
  }
  function stats(arr) {
    return '<div class="stats">' + arr.filter(Boolean).map(function (s) {
      return '<div class="stat"><div class="label">' + s[0] + '</div><div class="value"' + (s[2] ? ' style="color:' + s[2] + '"' : '') + '>' + s[1] + '</div></div>';
    }).join('') + '</div>';
  }
  function notice(kind, msg) {
    return '<div class="notice ' + (kind || '') + '">' + BT.icon('info') + '<span>' + msg + '</span></div>';
  }
  function table(head, rows, numFrom, cls) {
    numFrom = numFrom == null ? 1 : numFrom;
    return '<div class="table-wrap"><table class="table"><thead><tr>' + head.map(function (h, i) {
      return '<th' + (i >= numFrom ? ' class="num"' : '') + ' scope="col">' + h + '</th>';
    }).join('') + '</tr></thead><tbody>' + rows.map(function (r) {
      var rc = r.cls ? ' class="' + r.cls + '"' : '';
      var cells = r.cells || r;
      return '<tr' + rc + '>' + cells.map(function (c, i) { return '<td' + (i >= numFrom ? ' class="num"' : '') + '>' + c + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>';
  }
  function details(summary, inner, open) {
    return '<details class="fx-details"' + (open ? ' open' : '') + '><summary>' + BT.icon('chevron-down') + summary + '</summary>' + inner + '</details>';
  }
  /** Donut chart. parts: [{v, color, label}] */
  function donut(parts, aria) {
    var total = parts.reduce(function (s, p) { return s + Math.max(0, p.v); }, 0);
    var off = 0, segs = '';
    if (total > 0) {
      parts.forEach(function (p) {
        var f = Math.max(0, p.v) / total * 100;
        if (f <= 0) return;
        segs += '<circle cx="21" cy="21" r="15.9155" fill="none" stroke="' + p.color + '" stroke-width="6" stroke-dasharray="' + f.toFixed(3) + ' ' + (100 - f).toFixed(3) + '" stroke-dashoffset="' + (-off).toFixed(3) + '"></circle>';
        off += f;
      });
    }
    return '<div class="fx-donut"><svg viewBox="0 0 42 42" role="img" aria-label="' + esc(aria || 'Breakdown chart') + '">' +
      '<circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--surface-2)" stroke-width="6"></circle>' + segs + '</svg><ul>' +
      parts.map(function (p) {
        return '<li><i style="background:' + p.color + '"></i>' + p.label + '<b>' + INR(p.v) + (total > 0 ? ' <span class="muted small">(' + N(p.v / total * 100, 1) + '%)</span>' : '') + '</b></li>';
      }).join('') + '</ul></div>';
  }
  /** Stacked column chart. data: [{x, parts:[v...]}], series: [{name,color}] */
  function columns(data, series, aria) {
    if (!data.length) return '';
    var max = 0;
    data.forEach(function (d) { var s = d.parts.reduce(function (a, b) { return a + Math.max(0, b); }, 0); if (s > max) max = s; });
    if (max <= 0) max = 1;
    var every = Math.ceil(data.length / 10);
    var cols = data.map(function (d) {
      var tip = d.x + ': ' + series.map(function (s, i) { return s.name + ' ' + INR(d.parts[i]); }).join(', ');
      return '<div title="' + esc(tip) + '">' + d.parts.map(function (v, i) {
        return '<span style="height:' + (Math.max(0, v) / max * 100).toFixed(3) + '%;background:' + series[i].color + '"></span>';
      }).join('') + '</div>';
    }).join('');
    var xl = data.map(function (d, i) {
      return '<span>' + ((data.length - 1 - i) % every === 0 ? esc(d.x) : '') + '</span>';
    }).join('');
    return '<div role="img" aria-label="' + esc(aria || 'Growth chart') + '"><div class="fx-ymax"><span>' + compact(max) + '</span><span></span></div>' +
      '<div class="fx-cols">' + cols + '</div><div class="fx-xl" aria-hidden="true">' + xl + '</div>' +
      '<div class="legend">' + series.map(function (s) { return '<span><i style="background:' + s.color + '"></i>' + s.name + '</span>'; }).join('') + '</div></div>';
  }
  function bar(parts) {
    var total = parts.reduce(function (s, p) { return s + Math.max(0, p.v); }, 0) || 1;
    return '<div class="bar-chart" role="img" aria-label="' + esc(parts.map(function (p) { return p.label + ' ' + N(p.v / total * 100, 1) + '%'; }).join(', ')) + '">' +
      parts.map(function (p) { return '<span style="width:' + (Math.max(0, p.v) / total * 100).toFixed(3) + '%;background:' + p.color + '"></span>'; }).join('') + '</div>' +
      '<div class="legend">' + parts.map(function (p) { return '<span><i style="background:' + p.color + '"></i>' + p.label + ' · ' + N(p.v / total * 100, 1) + '%</span>'; }).join('') + '</div>';
  }

  var C1 = 'var(--brand)', C2 = 'var(--ok)', C3 = 'var(--warn)', C4 = 'var(--danger)';

  /** Common wiring: sliders, segmented controls, amount formatting, live updates. */
  function wire(root, update) {
    injectStyle();
    $$('input[type=range][data-for]', root).forEach(function (r) {
      var t = $('#' + r.getAttribute('data-for'), root);
      r.addEventListener('input', function () {
        t.value = t.hasAttribute('data-amt') ? N(Number(r.value), 2) : r.value;
      });
      t.addEventListener('input', function () {
        var v = num(t.value);
        if (ok(v)) r.value = v;
      });
    });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('.seg[data-seg] button');
      if (!b || !root.contains(b)) return;
      var seg = b.parentNode;
      $$('button', seg).forEach(function (x) {
        x.classList.toggle('active', x === b);
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      seg.dispatchEvent(new Event('change', { bubbles: true }));
    });
    root.addEventListener('focusout', function (e) {
      var t = e.target;
      if (t && t.hasAttribute && t.hasAttribute('data-amt')) {
        var v = num(t.value);
        if (ok(v)) t.value = N(v, 2);
      }
    });
    bindLive(root, update);
  }

  function layout(left, right, below) {
    return '<div class="split"><div class="fx-col">' + left + '</div><div class="fx-col" id="fx-out">' + right + '</div></div>' +
      (below ? '<div class="fx-stack fx-mt" id="fx-below">' + below + '</div>' : '');
  }
  function card(title, inner, extra) {
    return '<div class="card">' + (title ? '<div class="card-title"><h3>' + title + '</h3>' + (extra || '') + '</div>' : '') + inner + '</div>';
  }
  function emptyHero(label, msg) {
    return hero(label, '—') + notice('warn', msg);
  }

  // ================================================================== GST
  BT.impl('gst-calculator', function (root) {
    var RATES = ['0.25', '3', '5', '12', '18', '28', '40'];
    root.innerHTML = layout(
      card('GST details',
        SegField('gst-mode', 'Calculation', [['add', 'Add GST (exclusive)'], ['remove', 'Remove GST (inclusive)']], 'add') +
        F({ id: 'gst-amt', label: 'Amount', value: '10,000', pre: '₹', amt: true, hint: 'Price before GST' }) +
        SegField('gst-rate', 'GST rate', RATES.map(function (r) { return [r, r + '%']; }).concat([['custom', 'Custom']]), '18') +
        F({ id: 'gst-custom', label: 'Custom GST rate', value: '', post: '%', cls: 'hidden', ph: 'e.g. 1.5' }) +
        SegField('gst-supply', 'Type of supply', [['intra', 'Within state (CGST + SGST)'], ['inter', 'Inter-state (IGST)']], 'intra') +
        '<p class="fx-note">GST 2.0 (from 22 Sep 2025) moved most goods and services to 5% and 18%, with 40% for luxury and sin goods. 12% and 28% remain available for older invoices and exceptions.</p>'),
      '<div id="gst-out"></div>',
      card('Same amount at every GST rate', '<div id="gst-table"></div>')
    );
    function update() {
      var mode = segVal(root, 'gst-mode');
      var rs = segVal(root, 'gst-rate');
      $('#gst-custom', root).closest('.field').classList.toggle('hidden', rs !== 'custom');
      $('#gst-amt-hint', root).textContent = mode === 'add' ? 'Price before GST' : 'Price including GST';
      var amt = val(root, 'gst-amt');
      var rate = rs === 'custom' ? val(root, 'gst-custom') : Number(rs);
      var inter = segVal(root, 'gst-supply') === 'inter';
      var out = $('#gst-out', root);
      if (!ok(amt) || amt < 0) { out.innerHTML = emptyHero('Total amount', 'Enter a valid amount.'); $('#gst-table', root).innerHTML = ''; return; }
      if (!ok(rate) || rate < 0 || rate > 100) { out.innerHTML = emptyHero('Total amount', 'Enter a GST rate between 0 and 100%.'); return; }
      function calc(a, r) {
        var net, gst, total;
        if (mode === 'add') { net = a; gst = a * r / 100; total = net + gst; }
        else { total = a; net = a / (1 + r / 100); gst = total - net; }
        return { net: net, gst: gst, total: total };
      }
      var c = calc(amt, rate);
      var heroH = mode === 'add'
        ? hero('Total amount (incl. ' + N(rate) + '% GST)', INR(c.total, 2), '<span>Net <b>' + INR(c.net, 2) + '</b></span><span>GST <b>' + INR(c.gst, 2) + '</b></span>')
        : hero('Amount before GST (' + N(rate) + '%)', INR(c.net, 2), '<span>GST included <b>' + INR(c.gst, 2) + '</b></span><span>Total <b>' + INR(c.total, 2) + '</b></span>');
      var split = inter
        ? [['IGST @ ' + N(rate) + '%', INR(c.gst, 2)]]
        : [['CGST @ ' + N(rate / 2, 3) + '%', INR(c.gst / 2, 2)], ['SGST @ ' + N(rate / 2, 3) + '%', INR(c.gst / 2, 2)]];
      out.innerHTML = heroH +
        card('Breakdown', stats([['Net amount', INR(c.net, 2)], ['Total GST', INR(c.gst, 2), C3]].concat(split).concat([['Total amount', INR(c.total, 2)]])) +
          '<div class="fx-mt">' + bar([{ v: c.net, color: C1, label: 'Net amount' }, { v: c.gst, color: C3, label: 'GST' }]) + '</div>' +
          '<p class="fx-note">' + (inter ? 'Inter-state supplies attract IGST, which equals the full GST rate.' : 'Intra-state supplies split GST equally into CGST (Centre) and SGST/UTGST (State). For inter-state supplies, the whole amount is IGST.') + '</p>');
      $('#gst-table', root).innerHTML = table(['Rate', 'Net amount', 'GST', mode === 'add' ? 'CGST / SGST each' : 'CGST / SGST each', 'Total'],
        RATES.map(function (r) {
          var x = calc(amt, Number(r));
          return { cls: Number(r) === rate ? 'fx-hl' : '', cells: [r + '%', INR(x.net, 2), INR(x.gst, 2), INR(x.gst / 2, 2), INR(x.total, 2)] };
        }));
    }
    wire(root, update);
  });

  // ================================================================== EMI
  BT.impl('emi-calculator', function (root) {
    root.innerHTML = layout(
      card('Loan details',
        S({ id: 'emi-p', label: 'Loan amount', value: 2500000, amt: true, pre: '₹', min: 50000, max: 20000000, step: 10000, scale: ['₹50K', '₹2 Cr'] }) +
        S({ id: 'emi-r', label: 'Interest rate (p.a.)', value: 8.5, post: '%', min: 1, max: 20, step: 0.05, scale: ['1%', '20%'] }) +
        SegField('emi-unit', 'Tenure in', [['y', 'Years'], ['m', 'Months']], 'y') +
        S({ id: 'emi-n', label: 'Loan tenure', value: 20, post: 'Yr', min: 1, max: 30, step: 1, scale: ['1 Yr', '30 Yr'] })),
      '<div id="emi-out"></div>',
      '<div class="card" id="emi-sched"></div>'
    );
    var unitSeg = $('#emi-unit', root), nIn = $('#emi-n', root), nR = $('#emi-n-r', root);
    unitSeg.addEventListener('change', function () {
      var u = segVal(root, 'emi-unit'), v = num(nIn.value);
      if (u === 'm') {
        nR.min = 1; nR.max = 360; nR.step = 1;
        if (ok(v)) nIn.value = Math.round(v * 12);
        $('#emi-n-post', root).textContent = 'Mo'; $('#emi-n-lo', root).textContent = '1 Mo'; $('#emi-n-hi', root).textContent = '360 Mo';
      } else {
        nR.min = 1; nR.max = 30; nR.step = 1;
        if (ok(v)) nIn.value = trimNum(v / 12, 2);
        $('#emi-n-post', root).textContent = 'Yr'; $('#emi-n-lo', root).textContent = '1 Yr'; $('#emi-n-hi', root).textContent = '30 Yr';
      }
      nR.value = num(nIn.value);
    });
    function update() {
      var P = val(root, 'emi-p'), R = val(root, 'emi-r'), n = val(root, 'emi-n');
      var months = segVal(root, 'emi-unit') === 'm' ? Math.round(n) : Math.round(n * 12);
      var out = $('#emi-out', root), sch = $('#emi-sched', root);
      if (!ok(P) || P <= 0 || !ok(R) || R < 0 || R > 100 || !ok(months) || months < 1 || months > 1200) {
        out.innerHTML = emptyHero('Monthly EMI', 'Enter a loan amount, an interest rate between 0 and 100% and a tenure of 1 month to 100 years.');
        sch.innerHTML = '';
        return;
      }
      var i = R / 1200;
      var emi = i === 0 ? P / months : P * i * Math.pow(1 + i, months) / (Math.pow(1 + i, months) - 1);
      var total = emi * months, interest = total - P;
      out.innerHTML = hero('Monthly EMI', INR(emi), '<span>for <b>' + months + ' months</b> (' + trimNum(months / 12, 1) + ' yrs)</span><span>at <b>' + N(R) + '%</b> p.a.</span>') +
        card('', stats([['Principal amount', INR(P)], ['Total interest', INR(interest), C3], ['Total payment', INR(total)]]) +
          '<div class="fx-mt">' + donut([{ v: P, color: C1, label: 'Principal' }, { v: interest, color: C3, label: 'Interest' }], 'Principal versus interest') + '</div>' +
          '<div class="fx-mt">' + bar([{ v: P, color: C1, label: 'Principal' }, { v: interest, color: C3, label: 'Interest' }]) + '</div>');
      // yearly amortisation
      var bal = P, rows = [], yP = 0, yI = 0, chart = [], paidP = 0;
      for (var m = 1; m <= months; m++) {
        var int = bal * i, pr = emi - int;
        if (m === months) pr = bal;
        bal = Math.max(0, bal - pr);
        yP += pr; yI += int; paidP += pr;
        if (m % 12 === 0 || m === months) {
          var y = Math.ceil(m / 12);
          rows.push(['Year ' + y, INR(yP), INR(yI), INR(yP + yI), INR(bal), N(paidP / P * 100, 1) + '%']);
          chart.push({ x: 'Y' + y, parts: [yP, yI] });
          yP = 0; yI = 0;
        }
      }
      var wasOpen = $('details', sch) && $('details', sch).open;
      sch.innerHTML = '<div class="card-title"><h3>Amortisation schedule</h3><span class="badge">' + rows.length + ' years</span></div>' +
        columns(chart, [{ name: 'Principal paid', color: C1 }, { name: 'Interest paid', color: C3 }], 'Yearly principal and interest') +
        '<div class="fx-mt">' + details('Show year-by-year table', table(['Year', 'Principal', 'Interest', 'Total paid', 'Balance', 'Loan paid'], rows), wasOpen) + '</div>';
    }
    wire(root, update);
  });

  // ============================================================ SIP / Lumpsum
  function growthTable(rows) {
    return table(['Year', 'Invested', 'Returns', 'Value'], rows.map(function (r) { return ['Year ' + r.y, INR(r.inv), INR(r.val - r.inv), INR(r.val)]; }));
  }

  BT.impl('sip-calculator', function (root) {
    root.innerHTML = layout(
      card('Your SIP',
        S({ id: 'sip-p', label: 'Monthly investment', value: 10000, amt: true, pre: '₹', min: 500, max: 200000, step: 500, scale: ['₹500', '₹2 L'] }) +
        S({ id: 'sip-r', label: 'Expected return (p.a.)', value: 12, post: '%', min: 1, max: 30, step: 0.1, scale: ['1%', '30%'] }) +
        S({ id: 'sip-n', label: 'Time period', value: 10, post: 'Yr', min: 1, max: 40, step: 1, scale: ['1 Yr', '40 Yr'] }) +
        S({ id: 'sip-s', label: 'Annual step-up (optional)', value: 0, post: '%', min: 0, max: 25, step: 1, scale: ['0%', '25%'], hint: 'Increase your SIP by this percentage every year.' })),
      '<div id="sip-out"></div>',
      '<div class="card" id="sip-tbl"></div>'
    );
    function update() {
      var P = val(root, 'sip-p'), R = val(root, 'sip-r'), Y = val(root, 'sip-n'), st = val(root, 'sip-s');
      if (!ok(st)) st = 0;
      var out = $('#sip-out', root), tb = $('#sip-tbl', root);
      if (!ok(P) || P <= 0 || !ok(R) || R < 0 || R > 100 || !ok(Y) || Y <= 0 || Y > 60 || st < 0 || st > 100) {
        out.innerHTML = emptyHero('Estimated value', 'Enter a monthly amount, a return of 0–100% and a period of up to 60 years.');
        tb.innerHTML = '';
        return;
      }
      var i = R / 1200, months = Math.round(Y * 12), bal = 0, inv = 0, amt = P, rows = [];
      for (var m = 1; m <= months; m++) {
        if (m > 1 && (m - 1) % 12 === 0) amt = amt * (1 + st / 100);
        bal = (bal + amt) * (1 + i);
        inv += amt;
        if (m % 12 === 0 || m === months) rows.push({ y: Math.ceil(m / 12), inv: inv, val: bal });
      }
      var gain = bal - inv;
      out.innerHTML = hero('Estimated value after ' + N(Y) + ' years', INR(bal), '<span>≈ ' + lakhWords(bal) + '</span><span>Wealth gain <b>' + INR(gain) + '</b></span>') +
        card('', stats([['Invested amount', INR(inv)], ['Est. returns', INR(gain), C2], ['Total value', INR(bal)]].concat(st > 0 ? [['Final monthly SIP', INR(amt)]] : [])) +
          '<div class="fx-mt">' + donut([{ v: inv, color: C1, label: 'Invested' }, { v: gain, color: C2, label: 'Returns' }], 'Invested versus returns') + '</div>' +
          '<p class="fx-note">Assumes investments at the start of each month, compounded monthly (' + N(R / 12, 4) + '% a month). Mutual fund returns are market-linked and not guaranteed.</p>');
      tb.innerHTML = '<div class="card-title"><h3>Growth over time</h3></div>' +
        columns(rows.map(function (r) { return { x: 'Y' + r.y, parts: [r.inv, r.val - r.inv] }; }), [{ name: 'Invested', color: C1 }, { name: 'Returns', color: C2 }], 'SIP growth by year') +
        '<div class="fx-mt">' + details('Year-by-year table', growthTable(rows)) + '</div>';
    }
    wire(root, update);
  });

  BT.impl('lumpsum-calculator', function (root) {
    root.innerHTML = layout(
      card('Your investment',
        S({ id: 'ls-p', label: 'Total investment', value: 100000, amt: true, pre: '₹', min: 1000, max: 10000000, step: 1000, scale: ['₹1K', '₹1 Cr'] }) +
        S({ id: 'ls-r', label: 'Expected return (p.a.)', value: 12, post: '%', min: 1, max: 30, step: 0.1, scale: ['1%', '30%'] }) +
        S({ id: 'ls-n', label: 'Time period', value: 10, post: 'Yr', min: 1, max: 40, step: 1, scale: ['1 Yr', '40 Yr'] }) +
        F({ id: 'ls-inf', label: 'Inflation for real value (optional)', value: '6', post: '%', hint: 'Shows what the final amount is worth in today’s money.' })),
      '<div id="ls-out"></div>',
      '<div class="card" id="ls-tbl"></div>'
    );
    function update() {
      var P = val(root, 'ls-p'), R = val(root, 'ls-r'), Y = val(root, 'ls-n'), inf = val(root, 'ls-inf');
      var out = $('#ls-out', root), tb = $('#ls-tbl', root);
      if (!ok(P) || P <= 0 || !ok(R) || R < 0 || R > 100 || !ok(Y) || Y <= 0 || Y > 100) {
        out.innerHTML = emptyHero('Estimated value', 'Enter an amount, a return of 0–100% and a period of up to 100 years.');
        tb.innerHTML = '';
        return;
      }
      var fv = P * Math.pow(1 + R / 100, Y), gain = fv - P;
      var real = ok(inf) && inf > -100 ? fv / Math.pow(1 + inf / 100, Y) : NaN;
      var rows = [];
      for (var y = 1; y <= Math.ceil(Y); y++) rows.push({ y: y, inv: P, val: P * Math.pow(1 + R / 100, Math.min(y, Y)) });
      out.innerHTML = hero('Estimated value after ' + N(Y) + ' years', INR(fv), '<span>≈ ' + lakhWords(fv) + '</span><span>Money grows <b>' + N(fv / P, 2) + '×</b></span>') +
        card('', stats([['Invested amount', INR(P)], ['Est. returns', INR(gain), C2], ['Total value', INR(fv)], ok(real) ? ['Value in today’s ₹', INR(real)] : null]) +
          '<div class="fx-mt">' + donut([{ v: P, color: C1, label: 'Invested' }, { v: gain, color: C2, label: 'Returns' }], 'Invested versus returns') + '</div>' +
          '<p class="fx-note">Compounded annually. Market-linked returns are not guaranteed.</p>');
      tb.innerHTML = '<div class="card-title"><h3>Growth over time</h3></div>' +
        columns(rows.map(function (r) { return { x: 'Y' + r.y, parts: [r.inv, r.val - r.inv] }; }), [{ name: 'Invested', color: C1 }, { name: 'Returns', color: C2 }], 'Lumpsum growth by year') +
        '<div class="fx-mt">' + details('Year-by-year table', growthTable(rows)) + '</div>';
    }
    wire(root, update);
  });

  // ==================================================================== FD
  BT.impl('fd-calculator', function (root) {
    root.innerHTML = layout(
      card('Deposit details',
        S({ id: 'fd-p', label: 'Deposit amount', value: 100000, amt: true, pre: '₹', min: 1000, max: 10000000, step: 1000, scale: ['₹1K', '₹1 Cr'] }) +
        S({ id: 'fd-r', label: 'Interest rate (p.a.)', value: 7, post: '%', min: 1, max: 15, step: 0.05, scale: ['1%', '15%'] }) +
        '<div class="row cols-3">' + F({ id: 'fd-y', label: 'Years', value: '5' }) + F({ id: 'fd-m', label: 'Months', value: '0' }) + F({ id: 'fd-d', label: 'Days', value: '0' }) + '</div>' +
        Sel('fd-f', 'Compounding frequency', [['12', 'Monthly'], ['4', 'Quarterly'], ['2', 'Half-yearly'], ['1', 'Yearly']], '4', 'Most Indian banks compound FD interest quarterly.')),
      '<div id="fd-out"></div>',
      '<div class="card" id="fd-tbl"></div>'
    );
    function update() {
      var P = val(root, 'fd-p'), R = val(root, 'fd-r'), y = val(root, 'fd-y'), m = val(root, 'fd-m'), d = val(root, 'fd-d'), f = Number($('#fd-f', root).value);
      y = ok(y) ? y : 0; m = ok(m) ? m : 0; d = ok(d) ? d : 0;
      var t = y + m / 12 + d / 365;
      var out = $('#fd-out', root), tb = $('#fd-tbl', root);
      if (!ok(P) || P <= 0 || !ok(R) || R < 0 || R > 100 || y < 0 || m < 0 || d < 0 || t <= 0 || t > 50) {
        out.innerHTML = emptyHero('Maturity amount', 'Enter a deposit amount, interest rate and a tenure of up to 50 years.');
        tb.innerHTML = '';
        return;
      }
      var A = P * Math.pow(1 + R / 100 / f, f * t), I = A - P;
      var eff = (Math.pow(1 + R / 100 / f, f) - 1) * 100;
      var parts = [];
      if (y) parts.push(N(y) + ' yr'); if (m) parts.push(N(m) + ' mo'); if (d) parts.push(N(d) + ' days');
      out.innerHTML = hero('Maturity amount', INR(A), '<span>Interest earned <b>' + INR(I) + '</b></span><span>Tenure <b>' + parts.join(' ') + '</b></span>') +
        card('', stats([['Principal', INR(P)], ['Total interest', INR(I), C2], ['Effective yield', pct(eff) + ' p.a.']]) +
          '<div class="fx-mt">' + donut([{ v: P, color: C1, label: 'Principal' }, { v: I, color: C2, label: 'Interest' }], 'Principal versus interest') + '</div>' +
          '<p class="fx-note">Banks deduct TDS at 10% when FD interest exceeds ₹50,000 in a year (₹1,00,000 for senior citizens). Interest is taxable at your slab rate.</p>');
      var rows = [];
      for (var k = 1; k <= Math.floor(t); k++) {
        var open = P * Math.pow(1 + R / 100 / f, f * (k - 1)), close = P * Math.pow(1 + R / 100 / f, f * k);
        rows.push(['Year ' + k, INR(open), INR(close - open), INR(close)]);
      }
      if (t > Math.floor(t)) {
        var o2 = P * Math.pow(1 + R / 100 / f, f * Math.floor(t));
        rows.push(['Maturity', INR(o2), INR(A - o2), INR(A)]);
      }
      tb.innerHTML = '<div class="card-title"><h3>Year-wise growth</h3></div>' + table(['Period', 'Opening balance', 'Interest', 'Closing balance'], rows);
    }
    wire(root, update);
  });

  // ==================================================================== RD
  BT.impl('rd-calculator', function (root) {
    root.innerHTML = layout(
      card('Recurring deposit',
        S({ id: 'rd-p', label: 'Monthly deposit', value: 5000, amt: true, pre: '₹', min: 100, max: 200000, step: 100, scale: ['₹100', '₹2 L'] }) +
        S({ id: 'rd-r', label: 'Interest rate (p.a.)', value: 7, post: '%', min: 1, max: 15, step: 0.05, scale: ['1%', '15%'] }) +
        '<div class="row cols-2">' + F({ id: 'rd-y', label: 'Years', value: '5' }) + F({ id: 'rd-m', label: 'Months', value: '0' }) + '</div>' +
        '<p class="fx-note">Indian banks compound RD interest quarterly. Each instalment earns interest for the time it stays deposited.</p>'),
      '<div id="rd-out"></div>',
      '<div class="card" id="rd-tbl"></div>'
    );
    function valueAt(R, rate, m) {
      var q = rate / 400, s = 0;
      for (var k = 1; k <= m; k++) s += R * Math.pow(1 + q, (m - k + 1) / 3);
      return s;
    }
    function update() {
      var R = val(root, 'rd-p'), r = val(root, 'rd-r'), y = val(root, 'rd-y'), mo = val(root, 'rd-m');
      y = ok(y) ? y : 0; mo = ok(mo) ? mo : 0;
      var n = Math.round(y * 12 + mo);
      var out = $('#rd-out', root), tb = $('#rd-tbl', root);
      if (!ok(R) || R <= 0 || !ok(r) || r < 0 || r > 100 || y < 0 || mo < 0 || n < 1 || n > 600) {
        out.innerHTML = emptyHero('Maturity amount', 'Enter a monthly deposit, interest rate and a tenure between 1 month and 50 years.');
        tb.innerHTML = '';
        return;
      }
      var A = valueAt(R, r, n), dep = R * n, I = A - dep;
      out.innerHTML = hero('Maturity amount', INR(A), '<span>after <b>' + n + ' months</b></span><span>Interest <b>' + INR(I) + '</b></span>') +
        card('', stats([['Total deposited', INR(dep)], ['Interest earned', INR(I), C2], ['Maturity value', INR(A)]]) +
          '<div class="fx-mt">' + donut([{ v: dep, color: C1, label: 'Deposits' }, { v: I, color: C2, label: 'Interest' }], 'Deposits versus interest') + '</div>');
      var rows = [], chart = [];
      for (var k = 12; k <= n + 11; k += 12) {
        var mm = Math.min(k, n), v = valueAt(R, r, mm);
        rows.push([mm % 12 === 0 ? 'Year ' + mm / 12 : 'Month ' + mm, INR(R * mm), INR(v - R * mm), INR(v)]);
        chart.push({ x: mm % 12 === 0 ? 'Y' + mm / 12 : 'M' + mm, parts: [R * mm, v - R * mm] });
        if (mm === n) break;
      }
      tb.innerHTML = '<div class="card-title"><h3>Growth over time</h3></div>' +
        columns(chart, [{ name: 'Deposits', color: C1 }, { name: 'Interest', color: C2 }], 'RD growth') +
        '<div class="fx-mt">' + details('Year-by-year table', table(['Period', 'Deposited', 'Interest', 'Balance'], rows)) + '</div>';
    }
    wire(root, update);
  });

  // =================================================================== PPF
  BT.impl('ppf-calculator', function (root) {
    root.innerHTML = layout(
      card('PPF details',
        S({ id: 'ppf-p', label: 'Yearly investment', value: 150000, amt: true, pre: '₹', min: 500, max: 150000, step: 500, scale: ['₹500', '₹1.5 L'], hint: 'Minimum ₹500, maximum ₹1,50,000 per financial year.' }) +
        S({ id: 'ppf-r', label: 'Interest rate (p.a.)', value: 7.1, post: '%', min: 5, max: 10, step: 0.05, scale: ['5%', '10%'] }) +
        SegField('ppf-ext', 'Extend after 15 years', [['0', 'No'], ['5', '+5 yrs'], ['10', '+10 yrs'], ['15', '+15 yrs'], ['20', '+20 yrs']], '0') +
        Sel('ppf-extmode', 'During extension', [['with', 'Keep investing every year'], ['without', 'Stop investing (balance keeps earning)']], 'with') +
        '<p class="fx-note">Deposits are assumed before 5 April each year, so they earn interest for the full year. Interest, maturity and deposits (under 80C, old regime) are tax-free.</p>'),
      '<div id="ppf-out"></div>',
      '<div class="card" id="ppf-tbl"></div>'
    );
    function update() {
      var P = val(root, 'ppf-p'), r = val(root, 'ppf-r'), ext = Number(segVal(root, 'ppf-ext')), mode = $('#ppf-extmode', root).value;
      $('#ppf-extmode', root).closest('.field').classList.toggle('hidden', ext === 0);
      var out = $('#ppf-out', root), tb = $('#ppf-tbl', root);
      if (!ok(P) || P < 500 || P > 150000) {
        out.innerHTML = emptyHero('Maturity value', 'PPF deposits must be between ₹500 and ₹1,50,000 in a financial year.');
        tb.innerHTML = '';
        return;
      }
      if (!ok(r) || r < 0 || r > 30) { out.innerHTML = emptyHero('Maturity value', 'Enter a valid interest rate.'); tb.innerHTML = ''; return; }
      var years = 15 + ext, bal = 0, inv = 0, rows = [], chart = [];
      for (var y = 1; y <= years; y++) {
        var dep = (y <= 15 || mode === 'with') ? P : 0;
        var open = bal;
        var interest = (open + dep) * r / 100;
        bal = open + dep + interest;
        inv += dep;
        rows.push({ cls: y === 15 ? 'fx-hl' : '', cells: ['Year ' + y, INR(open), INR(dep), INR(interest), INR(bal)] });
        chart.push({ x: 'Y' + y, parts: [inv, bal - inv] });
      }
      var gain = bal - inv;
      out.innerHTML = hero('Maturity value after ' + years + ' years', INR(bal), '<span>≈ ' + lakhWords(bal) + '</span><span>Tax-free interest <b>' + INR(gain) + '</b></span>') +
        card('', stats([['Total invested', INR(inv)], ['Total interest', INR(gain), C2], ['Maturity value', INR(bal)]]) +
          '<div class="fx-mt">' + donut([{ v: inv, color: C1, label: 'Invested' }, { v: gain, color: C2, label: 'Interest' }], 'Invested versus interest') + '</div>');
      tb.innerHTML = '<div class="card-title"><h3>Year-wise PPF balance</h3>' + (ext ? '<span class="badge">Extended ' + ext + ' yrs</span>' : '') + '</div>' +
        columns(chart, [{ name: 'Invested', color: C1 }, { name: 'Interest', color: C2 }], 'PPF growth') +
        '<div class="fx-mt">' + details('Year-by-year table', table(['Year', 'Opening', 'Deposit', 'Interest', 'Closing'], rows), true) + '</div>';
    }
    wire(root, update);
  });

  // ============================================================ Income tax
  var NEW_SLABS = [[0, 400000, 0], [400000, 800000, 5], [800000, 1200000, 10], [1200000, 1600000, 15], [1600000, 2000000, 20], [2000000, 2400000, 25], [2400000, Infinity, 30]];
  function oldSlabs(age) {
    var ex = age === '80' ? 500000 : age === '60' ? 300000 : 250000;
    var s = [[0, ex, 0]];
    if (ex < 500000) s.push([ex, 500000, 5]);
    s.push([500000, 1000000, 20], [1000000, Infinity, 30]);
    return s;
  }
  function slabTax(income, slabs) {
    var rows = [], total = 0;
    slabs.forEach(function (s) {
      var amt = Math.max(0, Math.min(income, s[1]) - s[0]);
      var t = amt * s[2] / 100;
      total += t;
      rows.push({ from: s[0], to: s[1], rate: s[2], amt: amt, tax: t });
    });
    return { rows: rows, tax: total };
  }
  function computeTax(regime, d) {
    var isNew = regime === 'new';
    var std = d.salaried ? Math.min(isNew ? 75000 : 50000, d.salary) : 0;
    var gross = d.salary + d.other;
    var ded = 0, dedRows = [];
    if (!isNew) {
      var items = [
        ['HRA exemption', Math.min(d.hra, Math.max(0, d.salary - std))],
        ['Home loan interest 24(b)', Math.min(d.home, 200000)],
        ['Section 80C', Math.min(d.c80, 150000)],
        ['Section 80D', Math.min(d.d80, 100000)],
        ['NPS 80CCD(1B)', Math.min(d.nps, 50000)],
        ['Other deductions', d.oth]
      ];
      items.forEach(function (it) { ded += it[1]; if (it[1] > 0) dedRows.push(it); });
    }
    var taxable = Math.max(0, gross - std - ded);
    var st = slabTax(taxable, isNew ? NEW_SLABS : oldSlabs(d.age));
    var tax = st.tax, rebate = 0, relief = 0;
    if (isNew) {
      if (taxable <= 1200000) rebate = Math.min(tax, 60000);
      else if (tax > taxable - 1200000) relief = tax - (taxable - 1200000);
    } else if (taxable <= 500000) rebate = Math.min(tax, 12500);
    var after = Math.max(0, tax - rebate - relief);
    var sr = 0;
    if (taxable > 50000000) sr = isNew ? 25 : 37;
    else if (taxable > 20000000) sr = 25;
    else if (taxable > 10000000) sr = 15;
    else if (taxable > 5000000) sr = 10;
    var surcharge = after * sr / 100;
    var cess = (after + surcharge) * 0.04;
    var total = Math.round(after + surcharge + cess);
    return { gross: gross, std: std, ded: ded, dedRows: dedRows, taxable: taxable, slabs: st.rows, slabTax: tax, rebate: rebate, relief: relief,
      after: after, sr: sr, surcharge: surcharge, cess: cess, total: total };
  }

  BT.impl('income-tax-calculator', function (root) {
    root.innerHTML = layout(
      card('Income <span class="badge">FY 2025-26 · AY 2026-27</span>',
        SegField('it-age', 'Your age', [['0', 'Below 60'], ['60', '60 to 79'], ['80', '80 and above']], '0') +
        F({ id: 'it-sal', label: 'Gross salary / pension (per year)', value: '12,75,000', pre: '₹', amt: true, hint: 'Total salary before deductions (CTC minus employer PF/gratuity).' }) +
        F({ id: 'it-oth', label: 'Other income (per year)', value: '0', pre: '₹', amt: true, hint: 'Interest, rent, freelance income etc. taxed at slab rates.' }) +
        '<label class="check"><input type="checkbox" id="it-salaried" checked> I am salaried / a pensioner (standard deduction)</label>') +
      card('Deductions <span class="badge warn">Old regime only</span>',
        '<div class="row cols-2">' +
        F({ id: 'it-80c', label: 'Section 80C', value: '1,50,000', pre: '₹', amt: true, hint: 'PF, PPF, ELSS, LIC, tuition. Max ₹1.5 L' }) +
        F({ id: 'it-80d', label: 'Section 80D', value: '25,000', pre: '₹', amt: true, hint: 'Health insurance premiums' }) +
        F({ id: 'it-hra', label: 'HRA exemption', value: '0', pre: '₹', amt: true, hint: 'Use the HRA calculator to work this out' }) +
        F({ id: 'it-home', label: 'Home loan interest 24(b)', value: '0', pre: '₹', amt: true, hint: 'Self-occupied: max ₹2 L' }) +
        F({ id: 'it-nps', label: 'NPS 80CCD(1B)', value: '0', pre: '₹', amt: true, hint: 'Extra NPS: max ₹50,000' }) +
        F({ id: 'it-ded', label: 'Other deductions', value: '0', pre: '₹', amt: true, hint: '80E, 80G, 80TTA etc.' }) +
        '</div>'),
      '<div id="it-out"></div>',
      '<div class="card" id="it-cmp"></div><div class="card" id="it-slab"></div>'
    );
    var slabView = 'new';
    root.addEventListener('change', function (e) { if (e.target.id === 'it-slabseg') slabView = segVal(root, 'it-slabseg'); });
    function update() {
      var d = {
        age: segVal(root, 'it-age'), salaried: $('#it-salaried', root).checked,
        salary: val(root, 'it-sal'), other: val(root, 'it-oth'),
        c80: val(root, 'it-80c'), d80: val(root, 'it-80d'), hra: val(root, 'it-hra'), home: val(root, 'it-home'), nps: val(root, 'it-nps'), oth: val(root, 'it-ded')
      };
      ['other', 'c80', 'd80', 'hra', 'home', 'nps', 'oth'].forEach(function (k) { if (!ok(d[k]) || d[k] < 0) d[k] = 0; });
      var out = $('#it-out', root), cmp = $('#it-cmp', root), sl = $('#it-slab', root);
      if (!ok(d.salary) || d.salary < 0) d.salary = NaN;
      if (!ok(d.salary) && !(d.other > 0)) {
        out.innerHTML = emptyHero('Your tax', 'Enter your annual salary or other income.');
        cmp.innerHTML = sl.innerHTML = '';
        return;
      }
      if (!ok(d.salary)) d.salary = 0;
      var nw = computeTax('new', d), od = computeTax('old', d);
      var diff = od.total - nw.total;
      var best = diff > 0 ? 'new' : diff < 0 ? 'old' : 'same';
      var headline = best === 'same' ? hero('Both regimes cost the same', INR(nw.total), '<span>Total tax payable under either regime</span>')
        : hero((best === 'new' ? 'New regime' : 'Old regime') + ' saves you', INR(Math.abs(diff)),
          '<span>Tax <b>' + INR(Math.min(nw.total, od.total)) + '</b> vs <b>' + INR(Math.max(nw.total, od.total)) + '</b></span><span>≈ ' + INR(Math.abs(diff) / 12) + ' a month</span>');
      function regCard(key, t, name) {
        var gross = t.gross || 1;
        return '<div class="fx-reg' + (best === key ? ' win' : '') + '"><h4>' + name + (best === key ? ' <span class="badge ok">' + BT.icon('check') + ' Better</span>' : '') + '</h4>' +
          '<div class="big">' + INR(t.total) + '</div>' +
          '<div class="meta">Taxable income ' + INR(t.taxable) + '</div>' +
          '<div class="meta">Effective rate ' + pct(t.gross > 0 ? t.total / gross * 100 : 0) + ' · ' + INR(t.total / 12) + '/month</div>' +
          '<div class="meta">In-hand ≈ ' + INR((t.gross - t.total) / 12) + '/month</div></div>';
      }
      out.innerHTML = headline + '<div class="fx-regimes">' + regCard('new', nw, 'New regime') + regCard('old', od, 'Old regime') + '</div>' +
        (nw.rebate > 0 ? notice('ok', 'Your taxable income is within ₹12 lakh, so the Section 87A rebate makes your tax nil under the new regime.') : '') +
        (nw.relief > 0 ? notice('', 'Marginal relief of ' + INR(nw.relief) + ' applies: tax cannot exceed the income above ₹12 lakh.') : '');
      var dash = '—';
      function f(v) { return v > 0 ? INR(v) : dash; }
      function neg(v) { return v > 0 ? '−' + INR(v) : dash; }
      var rows = [
        ['Gross income', INR(nw.gross), INR(od.gross)],
        ['Standard deduction', neg(nw.std), neg(od.std)],
        ['Deductions & exemptions', dash, neg(od.ded)]
      ];
      od.dedRows.forEach(function (r) { rows.push(['<span class="muted small">&nbsp;&nbsp;' + r[0] + '</span>', dash, '<span class="muted small">' + INR(r[1]) + '</span>']); });
      rows.push({ cls: 'fx-total', cells: ['Taxable income', INR(nw.taxable), INR(od.taxable)] });
      rows.push(['Tax on slabs', INR(nw.slabTax), INR(od.slabTax)]);
      rows.push(['Rebate u/s 87A', neg(nw.rebate), neg(od.rebate)]);
      if (nw.relief > 0) rows.push(['Marginal relief (87A)', neg(nw.relief), dash]);
      rows.push(['Surcharge', nw.sr ? INR(nw.surcharge) + ' <span class="muted small">(' + nw.sr + '%)</span>' : dash, od.sr ? INR(od.surcharge) + ' <span class="muted small">(' + od.sr + '%)</span>' : dash]);
      rows.push(['Health & education cess (4%)', f(nw.cess), f(od.cess)]);
      rows.push({ cls: 'fx-total', cells: ['Total tax payable', INR(nw.total), INR(od.total)] });
      cmp.innerHTML = '<div class="card-title"><h3>Side-by-side comparison</h3></div><div class="fx-fit">' + table(['Item', 'New regime', 'Old regime'], rows) + '</div>';
      var t = slabView === 'old' ? od : nw;
      sl.innerHTML = '<div class="card-title"><h3>Slab-wise breakup</h3>' + Seg('it-slabseg', [['new', 'New regime'], ['old', 'Old regime']], slabView, 'Regime') + '</div><div class="fx-fit">' +
        table(['Income slab', 'Rate', 'Income in slab', 'Tax'], t.slabs.map(function (s) {
          var label = s.to === Infinity ? 'Above ' + INR(s.from) : INR(s.from) + ' – ' + INR(s.to);
          return { cls: s.amt > 0 && s.rate > 0 ? '' : '', cells: [label, s.rate + '%', s.amt > 0 ? INR(s.amt) : dash, s.tax > 0 ? INR(s.tax) : dash] };
        }).concat([{ cls: 'fx-total', cells: ['Total', '', INR(t.taxable), INR(t.slabTax)] }])) + '</div>' +
        '<p class="fx-note">Estimates for resident individuals for FY 2025-26. Marginal relief on surcharge is not applied, and special-rate income (capital gains, lottery) is not covered. New regime surcharge is capped at 25%. Old regime deductions are capped at statutory limits automatically.</p>';
    }
    wire(root, update);
  });

  // =================================================================== HRA
  BT.impl('hra-calculator', function (root) {
    root.innerHTML = layout(
      card('Salary & rent',
        SegField('hra-per', 'Enter amounts', [['m', 'Per month'], ['y', 'Per year']], 'm') +
        F({ id: 'hra-basic', label: 'Basic salary + DA', value: '50,000', pre: '₹', amt: true, hint: 'Include DA only if it counts for retirement benefits.' }) +
        F({ id: 'hra-rec', label: 'HRA received', value: '20,000', pre: '₹', amt: true }) +
        F({ id: 'hra-rent', label: 'Rent paid', value: '18,000', pre: '₹', amt: true }) +
        SegField('hra-city', 'City', [['metro', 'Metro (50%)'], ['non', 'Non-metro (40%)']], 'metro') +
        '<p class="fx-note">Metro cities: Delhi, Mumbai, Kolkata and Chennai. HRA exemption is available only under the old tax regime.</p>'),
      '<div id="hra-out"></div>'
    );
    function update() {
      var f = segVal(root, 'hra-per') === 'm' ? 12 : 1;
      var b = val(root, 'hra-basic') * f, h = val(root, 'hra-rec') * f, r = val(root, 'hra-rent') * f;
      var metro = segVal(root, 'hra-city') === 'metro';
      var out = $('#hra-out', root);
      if (!ok(b) || b <= 0 || !ok(h) || h < 0 || !ok(r) || r < 0) { out.innerHTML = emptyHero('Exempt HRA (per year)', 'Enter basic salary, HRA received and rent paid.'); return; }
      var c = [h, Math.max(0, r - 0.1 * b), (metro ? 0.5 : 0.4) * b];
      var ex = Math.min.apply(null, c), idx = c.indexOf(ex), taxable = h - ex;
      var labels = ['Actual HRA received', 'Rent paid − 10% of basic + DA', (metro ? '50%' : '40%') + ' of basic + DA'];
      out.innerHTML = hero('Exempt HRA (per year)', INR(ex), '<span>Per month <b>' + INR(ex / 12) + '</b></span><span>Taxable HRA <b>' + INR(taxable) + '</b></span>') +
        card('', stats([['HRA received', INR(h)], ['Exempt', INR(ex), C2], ['Taxable HRA', INR(taxable), taxable > 0 ? C3 : null]]) +
          '<div class="fx-mt">' + bar([{ v: ex, color: C2, label: 'Exempt' }, { v: taxable, color: C3, label: 'Taxable' }]) + '</div>') +
        card('How it is worked out', '<p class="small muted" style="margin-top:-6px">The exemption is the lowest of these three amounts (annual):</p>' +
          table(['Condition', 'Amount', ''], c.map(function (v, i) {
            return { cls: i === idx ? 'fx-hl' : '', cells: [labels[i], INR(v), i === idx ? '<span class="badge ok">' + BT.icon('check') + ' Lowest</span>' : ''] };
          }))) +
        (r === 0 ? notice('warn', 'No rent paid means no HRA exemption: the full HRA is taxable.') : '') +
        (r > 100000 ? notice('', 'Annual rent is above ₹1 lakh, so you must give your landlord’s PAN to your employer.') : '');
    }
    wire(root, update);
  });

  // ============================================================== Gratuity
  BT.impl('gratuity-calculator', function (root) {
    root.innerHTML = layout(
      card('Service details',
        F({ id: 'gr-sal', label: 'Last drawn monthly salary (Basic + DA)', value: '60,000', pre: '₹', amt: true }) +
        '<div class="row cols-2">' + F({ id: 'gr-y', label: 'Years of service', value: '10' }) + F({ id: 'gr-m', label: 'Additional months', value: '7' }) + '</div>' +
        SegField('gr-act', 'Employer covered under the Gratuity Act?', [['yes', 'Yes'], ['no', 'No']], 'yes')),
      '<div id="gr-out"></div>'
    );
    function update() {
      var s = val(root, 'gr-sal'), y = val(root, 'gr-y'), m = val(root, 'gr-m');
      m = ok(m) ? m : 0;
      var covered = segVal(root, 'gr-act') === 'yes';
      var out = $('#gr-out', root);
      if (!ok(s) || s <= 0 || !ok(y) || y < 0 || m < 0 || m >= 12 || y > 60) {
        out.innerHTML = emptyHero('Gratuity payable', 'Enter your monthly basic + DA, years of service and 0–11 additional months.');
        return;
      }
      y = Math.floor(y);
      var yrs = covered ? y + (m >= 6 ? 1 : 0) : y;
      var g = covered ? 15 / 26 * s * yrs : 15 / 30 * s * yrs;
      var exempt = Math.min(g, 2000000), taxable = Math.max(0, g - 2000000);
      var formula = covered ? '15 × ' + INR(s) + ' × ' + yrs + ' ÷ 26' : '15 × ' + INR(s) + ' × ' + yrs + ' ÷ 30';
      out.innerHTML = hero('Gratuity payable', INR(g), '<span>≈ ' + (lakhWords(g) || INR(g)) + '</span><span>' + yrs + ' years counted</span>') +
        card('', stats([['Years counted', String(yrs)], ['Tax-exempt', INR(exempt), C2], ['Taxable', INR(taxable), taxable > 0 ? C3 : null]]) +
          '<p class="fx-note mono">' + esc(formula) + '</p>' +
          '<p class="fx-note">' + (covered ? 'Covered employees: 15 days’ wages (month = 26 working days) per year; a final part-year of 6 months or more counts as a full year.' : 'Not covered: 15 days’ wages based on a 30-day month, for each completed year only.') + '</p>') +
        (y < 5 ? notice('warn', 'Gratuity is normally payable only after 5 years of continuous service (except on death or disablement). Some courts count 4 years and 240 days as 5 years.') : '') +
        notice('', 'Gratuity up to ₹20 lakh is tax-exempt for private-sector employees over their working life. Government employees’ gratuity is fully exempt.');
    }
    wire(root, update);
  });

  // ======================================================= Compound interest
  BT.impl('compound-interest-calculator', function (root) {
    root.innerHTML = layout(
      card('Investment',
        S({ id: 'ci-p', label: 'Principal amount', value: 100000, amt: true, pre: '₹', min: 1000, max: 10000000, step: 1000, scale: ['₹1K', '₹1 Cr'] }) +
        S({ id: 'ci-r', label: 'Interest rate (p.a.)', value: 8, post: '%', min: 1, max: 30, step: 0.1, scale: ['1%', '30%'] }) +
        S({ id: 'ci-n', label: 'Time period', value: 10, post: 'Yr', min: 1, max: 40, step: 1, scale: ['1 Yr', '40 Yr'] }) +
        Sel('ci-f', 'Compounding frequency', [['1', 'Yearly'], ['2', 'Half-yearly'], ['4', 'Quarterly'], ['12', 'Monthly'], ['365', 'Daily']], '4') +
        F({ id: 'ci-c', label: 'Monthly contribution (optional)', value: '0', pre: '₹', amt: true, hint: 'Added at the end of every month.' })),
      '<div id="ci-out"></div>',
      '<div class="card" id="ci-tbl"></div>'
    );
    function update() {
      var P = val(root, 'ci-p'), r = val(root, 'ci-r'), Y = val(root, 'ci-n'), f = Number($('#ci-f', root).value), c = val(root, 'ci-c');
      if (!ok(c) || c < 0) c = 0;
      var out = $('#ci-out', root), tb = $('#ci-tbl', root);
      if (!ok(P) || P < 0 || (P === 0 && c === 0) || !ok(r) || r < 0 || r > 100 || !ok(Y) || Y <= 0 || Y > 100) {
        out.innerHTML = emptyHero('Future value', 'Enter a principal (or monthly contribution), a rate of 0–100% and a period of up to 100 years.');
        tb.innerHTML = '';
        return;
      }
      var rm = Math.pow(1 + r / 100 / f, f / 12) - 1, months = Math.round(Y * 12), bal = P, inv = P, rows = [];
      for (var m = 1; m <= months; m++) {
        bal = bal * (1 + rm) + c;
        inv += c;
        if (m % 12 === 0 || m === months) rows.push({ y: Math.ceil(m / 12), inv: inv, val: bal });
      }
      var I = bal - inv, eff = (Math.pow(1 + r / 100 / f, f) - 1) * 100;
      out.innerHTML = hero('Future value', INR(bal), '<span>≈ ' + (lakhWords(bal) || INR(bal)) + '</span><span>Interest <b>' + INR(I) + '</b></span>') +
        card('', stats([['Total invested', INR(inv)], ['Interest earned', INR(I), C2], ['Effective annual rate', pct(eff)]]) +
          '<div class="fx-mt">' + donut([{ v: inv, color: C1, label: 'Invested' }, { v: I, color: C2, label: 'Interest' }], 'Invested versus interest') + '</div>');
      tb.innerHTML = '<div class="card-title"><h3>Growth over time</h3></div>' +
        columns(rows.map(function (x) { return { x: 'Y' + x.y, parts: [x.inv, x.val - x.inv] }; }), [{ name: 'Invested', color: C1 }, { name: 'Interest', color: C2 }], 'Compound growth') +
        '<div class="fx-mt">' + details('Year-by-year table', growthTable(rows)) + '</div>';
    }
    wire(root, update);
  });

  // ========================================================= Simple interest
  BT.impl('simple-interest-calculator', function (root) {
    root.innerHTML = layout(
      card('Loan or deposit',
        F({ id: 'si-p', label: 'Principal amount', value: '1,00,000', pre: '₹', amt: true }) +
        F({ id: 'si-r', label: 'Interest rate', value: '8', post: '% p.a.' }) +
        '<div class="row cols-2">' + F({ id: 'si-t', label: 'Time period', value: '5' }) +
        Sel('si-u', 'Unit', [['y', 'Years'], ['m', 'Months'], ['d', 'Days']], 'y') + '</div>'),
      '<div id="si-out"></div>'
    );
    function update() {
      var P = val(root, 'si-p'), r = val(root, 'si-r'), t = val(root, 'si-t'), u = $('#si-u', root).value;
      var out = $('#si-out', root);
      if (!ok(P) || P <= 0 || !ok(r) || r < 0 || !ok(t) || t <= 0) { out.innerHTML = emptyHero('Total amount', 'Enter principal, rate and time.'); return; }
      var yrs = u === 'y' ? t : u === 'm' ? t / 12 : t / 365;
      var SI = P * r * yrs / 100, A = P + SI, CI = P * Math.pow(1 + r / 100, yrs) - P;
      var rows = [];
      if (yrs >= 1 && yrs <= 50) for (var y = 1; y <= Math.floor(yrs); y++) rows.push(['Year ' + y, INR(P * r * y / 100), INR(P + P * r * y / 100), INR(P * Math.pow(1 + r / 100, y))]);
      out.innerHTML = hero('Total amount', INR(A, 2), '<span>Simple interest <b>' + INR(SI, 2) + '</b></span><span>SI = P × R × T ÷ 100</span>') +
        card('', stats([['Principal', INR(P)], ['Interest', INR(SI, 2), C2], ['Per year', INR(P * r / 100, 2)], ['If compounded yearly', INR(CI)]]) +
          '<div class="fx-mt">' + bar([{ v: P, color: C1, label: 'Principal' }, { v: SI, color: C2, label: 'Interest' }]) + '</div>') +
        (rows.length ? card('Simple vs compound (yearly)', table(['Year', 'Simple interest', 'Amount (SI)', 'Amount (CI)'], rows)) : '');
    }
    wire(root, update);
  });

  // ==================================================================== CAGR
  BT.impl('cagr-calculator', function (root) {
    root.innerHTML = layout(
      card('Values',
        SegField('cg-mode', 'I want to find', [['cagr', 'CAGR'], ['fv', 'Future value']], 'cagr') +
        F({ id: 'cg-a', label: 'Initial value', value: '1,00,000', pre: '₹', amt: true }) +
        F({ id: 'cg-b', label: 'Final value', value: '2,50,000', pre: '₹', amt: true }) +
        F({ id: 'cg-r', label: 'CAGR', value: '12', post: '%', cls: 'hidden' }) +
        F({ id: 'cg-n', label: 'Duration', value: '5', post: 'years' })),
      '<div id="cg-out"></div>'
    );
    function update() {
      var mode = segVal(root, 'cg-mode');
      $('#cg-b', root).closest('.field').classList.toggle('hidden', mode !== 'cagr');
      $('#cg-r', root).closest('.field').classList.toggle('hidden', mode === 'cagr');
      var a = val(root, 'cg-a'), b = val(root, 'cg-b'), r = val(root, 'cg-r'), n = val(root, 'cg-n');
      var out = $('#cg-out', root);
      if (!ok(a) || a <= 0 || !ok(n) || n <= 0) { out.innerHTML = emptyHero(mode === 'cagr' ? 'CAGR' : 'Future value', 'Enter a positive initial value and duration.'); return; }
      var rows = [];
      if (mode === 'cagr') {
        if (!ok(b) || b < 0) { out.innerHTML = emptyHero('CAGR', 'Enter a final value of 0 or more.'); return; }
        var cagr = (Math.pow(b / a, 1 / n) - 1) * 100, abs = (b - a) / a * 100;
        for (var y = 1; y <= Math.min(Math.ceil(n), 50); y++) rows.push(['Year ' + y, INR(a * Math.pow(1 + cagr / 100, Math.min(y, n)))]);
        out.innerHTML = hero('Compound annual growth rate', pct(cagr), '<span>Absolute return <b>' + pct(abs) + '</b></span><span>' + N(b / a, 2) + '× in ' + N(n) + ' years</span>') +
          card('', stats([['Initial value', INR(a)], ['Final value', INR(b)], ['Total gain', INR(b - a), b >= a ? C2 : C4], ['Absolute return', pct(abs)]]) +
            '<p class="fx-note mono">CAGR = (Final ÷ Initial)^(1 ÷ years) − 1</p>') +
          card('Value path at this CAGR', table(['Year', 'Value'], rows));
      } else {
        if (!ok(r) || r <= -100) { out.innerHTML = emptyHero('Future value', 'Enter a CAGR above −100%.'); return; }
        var fv = a * Math.pow(1 + r / 100, n);
        for (var k = 1; k <= Math.min(Math.ceil(n), 50); k++) {
          var v = a * Math.pow(1 + r / 100, Math.min(k, n));
          rows.push(['Year ' + k, INR(v), INR(v - a)]);
        }
        out.innerHTML = hero('Future value', INR(fv), '<span>≈ ' + (lakhWords(fv) || INR(fv)) + '</span><span>Gain <b>' + INR(fv - a) + '</b></span>') +
          card('', stats([['Initial value', INR(a)], ['Growth', N(fv / a, 2) + '×'], ['Total gain', INR(fv - a), fv >= a ? C2 : C4]])) +
          card('Year-by-year', table(['Year', 'Value', 'Gain'], rows));
      }
    }
    wire(root, update);
  });

  // =============================================================== Inflation
  BT.impl('inflation-calculator', function (root) {
    root.innerHTML = layout(
      card('Inflation',
        SegField('inf-mode', 'Calculate', [['fv', 'Future cost'], ['pv', 'Today’s value']], 'fv') +
        F({ id: 'inf-a', label: 'Cost today', value: '1,00,000', pre: '₹', amt: true }) +
        S({ id: 'inf-r', label: 'Inflation rate (p.a.)', value: 6, post: '%', min: 1, max: 15, step: 0.1, scale: ['1%', '15%'] }) +
        S({ id: 'inf-n', label: 'Years', value: 10, post: 'Yr', min: 1, max: 50, step: 1, scale: ['1 Yr', '50 Yr'] }) +
        '<p class="fx-note">India’s CPI inflation has averaged roughly 5–6% over the long run.</p>'),
      '<div id="inf-out"></div>'
    );
    function update() {
      var mode = segVal(root, 'inf-mode');
      $('label[for=inf-a]', root).textContent = mode === 'fv' ? 'Cost today' : 'Amount in the future';
      var a = val(root, 'inf-a'), r = val(root, 'inf-r'), n = val(root, 'inf-n');
      var out = $('#inf-out', root);
      if (!ok(a) || a <= 0 || !ok(r) || r <= -100 || r > 100 || !ok(n) || n <= 0 || n > 100) { out.innerHTML = emptyHero('Result', 'Enter an amount, an inflation rate and a number of years.'); return; }
      var f = Math.pow(1 + r / 100, n), rows = [];
      for (var y = 1; y <= Math.min(Math.ceil(n), 50); y++) {
        var g = Math.pow(1 + r / 100, Math.min(y, n));
        rows.push(['Year ' + y, INR(a * g), INR(a / g)]);
      }
      if (mode === 'fv') {
        out.innerHTML = hero('Cost after ' + N(n) + ' years', INR(a * f), '<span>Prices rise <b>' + N(f, 2) + '×</b></span><span>+' + INR(a * f - a) + '</span>') +
          card('', stats([['Cost today', INR(a)], ['Future cost', INR(a * f), C3], [INR(a) + ' will be worth', INR(a / f)], ['Purchasing power lost', pct((1 - 1 / f) * 100, 1), C4]]));
      } else {
        out.innerHTML = hero('Worth in today’s money', INR(a / f), '<span>' + INR(a) + ' in ' + N(n) + ' years</span><span>Loses <b>' + pct((1 - 1 / f) * 100, 1) + '</b> of its value</span>') +
          card('', stats([['Future amount', INR(a)], ['Today’s value', INR(a / f), C3], ['Erosion', INR(a - a / f), C4]]));
      }
      out.innerHTML += card('Year by year', table(['Year', 'Future cost of ' + INR(a), 'Today’s value of ' + INR(a)], rows));
    }
    wire(root, update);
  });

  // =========================================================== Profit margin
  BT.impl('profit-margin-calculator', function (root) {
    root.innerHTML = layout(
      card('Pricing',
        SegField('pm-mode', 'Mode', [['cp', 'Cost & price'], ['margin', 'Price from margin'], ['markup', 'Price from markup']], 'cp') +
        F({ id: 'pm-cost', label: 'Cost price', value: '750', pre: '₹', amt: true }) +
        F({ id: 'pm-price', label: 'Selling price', value: '1,000', pre: '₹', amt: true }) +
        F({ id: 'pm-m', label: 'Desired margin', value: '25', post: '%', cls: 'hidden' }) +
        F({ id: 'pm-k', label: 'Desired markup', value: '33.33', post: '%', cls: 'hidden' }) +
        F({ id: 'pm-q', label: 'Quantity (optional)', value: '1', hint: 'Totals are multiplied by this.' }) +
        '<p class="fx-note">Margin is profit as a share of the selling price; markup is profit as a share of the cost.</p>'),
      '<div id="pm-out"></div>'
    );
    function update() {
      var mode = segVal(root, 'pm-mode');
      $('#pm-price', root).closest('.field').classList.toggle('hidden', mode !== 'cp');
      $('#pm-m', root).closest('.field').classList.toggle('hidden', mode !== 'margin');
      $('#pm-k', root).closest('.field').classList.toggle('hidden', mode !== 'markup');
      var c = val(root, 'pm-cost'), q = val(root, 'pm-q'), p;
      if (!ok(q) || q <= 0) q = 1;
      var out = $('#pm-out', root);
      if (!ok(c) || c < 0) { out.innerHTML = emptyHero('Profit', 'Enter a cost price.'); return; }
      if (mode === 'cp') p = val(root, 'pm-price');
      else if (mode === 'margin') {
        var m = val(root, 'pm-m');
        if (!ok(m) || m >= 100) { out.innerHTML = emptyHero('Selling price', 'Margin must be below 100% (a 100% margin would need an infinite price).'); return; }
        p = c / (1 - m / 100);
      } else {
        var k = val(root, 'pm-k');
        if (!ok(k) || k <= -100) { out.innerHTML = emptyHero('Selling price', 'Enter a markup above −100%.'); return; }
        p = c * (1 + k / 100);
      }
      if (!ok(p) || p <= 0) { out.innerHTML = emptyHero('Profit', 'Enter a selling price above zero.'); return; }
      var profit = p - c, margin = profit / p * 100, markup = c > 0 ? profit / c * 100 : NaN;
      var loss = profit < 0;
      out.innerHTML = (mode === 'cp'
        ? hero(loss ? 'Loss per unit' : 'Profit margin', loss ? INR(-profit, 2) : pct(margin), '<span>' + (loss ? 'Margin <b>' + pct(margin) + '</b>' : 'Profit <b>' + INR(profit, 2) + '</b> per unit') + '</span><span>Markup <b>' + pct(markup) + '</b></span>')
        : hero('Selling price', INR(p, 2), '<span>Profit <b>' + INR(profit, 2) + '</b></span><span>Margin <b>' + pct(margin) + '</b> · Markup <b>' + pct(markup) + '</b></span>')) +
        card('', stats([['Cost price', INR(c, 2)], ['Selling price', INR(p, 2)], [loss ? 'Loss' : 'Profit', INR(Math.abs(profit), 2), loss ? C4 : C2], ['Margin', pct(margin)], ['Markup', pct(markup)]].concat(q !== 1 ? [['Revenue × ' + N(q), INR(p * q)], ['Total ' + (loss ? 'loss' : 'profit'), INR(Math.abs(profit * q)), loss ? C4 : C2]] : [])) +
          (!loss ? '<div class="fx-mt">' + bar([{ v: c, color: C1, label: 'Cost' }, { v: profit, color: C2, label: 'Profit' }]) + '</div>' : '')) +
        (loss ? notice('warn', 'The selling price is below cost, so you make a loss on each unit.') : '');
    }
    wire(root, update);
  });

  // ================================================================ Discount
  BT.impl('discount-calculator', function (root) {
    root.innerHTML = layout(
      card('Price & offers',
        F({ id: 'dc-p', label: 'Original price (MRP)', value: '2,999', pre: '₹', amt: true }) +
        '<div class="row cols-2">' + F({ id: 'dc-d1', label: 'Discount', value: '20', post: '%' }) + F({ id: 'dc-d2', label: 'Extra discount (optional)', value: '10', post: '%' }) + '</div>' +
        '<div class="fx-inline" style="margin-bottom:14px"><label class="check"><input type="checkbox" id="dc-gst"> Add GST on the final price</label>' +
        '<select id="dc-rate" aria-label="GST rate" style="width:auto" disabled>' + ['5', '12', '18', '28', '40'].map(function (r) { return '<option value="' + r + '"' + (r === '18' ? ' selected' : '') + '>' + r + '% GST</option>'; }).join('') + '</select></div>' +
        '<p class="fx-note">Stacked discounts apply one after another: 20% + 10% off is 28% off, not 30%.</p>'),
      '<div id="dc-out"></div>'
    );
    function update() {
      var gOn = $('#dc-gst', root).checked;
      $('#dc-rate', root).disabled = !gOn;
      var p = val(root, 'dc-p'), d1 = val(root, 'dc-d1'), d2 = val(root, 'dc-d2'), g = Number($('#dc-rate', root).value);
      if (!ok(d1)) d1 = 0; if (!ok(d2)) d2 = 0;
      var out = $('#dc-out', root);
      if (!ok(p) || p <= 0) { out.innerHTML = emptyHero('Final price', 'Enter the original price.'); return; }
      if (d1 < 0 || d1 > 100 || d2 < 0 || d2 > 100) { out.innerHTML = emptyHero('Final price', 'Discounts must be between 0 and 100%.'); return; }
      var a1 = p * (1 - d1 / 100), a2 = a1 * (1 - d2 / 100), save = p - a2, eff = save / p * 100;
      var gst = gOn ? a2 * g / 100 : 0, fin = a2 + gst;
      out.innerHTML = hero(gOn ? 'Final price (incl. ' + g + '% GST)' : 'Final price', INR(fin, 2), '<span>You save <b>' + INR(save, 2) + '</b></span><span>Effective discount <b>' + pct(eff) + '</b></span>') +
        card('', stats([['Original price', INR(p, 2)], ['After ' + N(d1) + '% off', INR(a1, 2)], d2 ? ['After extra ' + N(d2) + '%', INR(a2, 2)] : null, ['Total savings', INR(save, 2), C2], gOn ? ['GST @ ' + g + '%', INR(gst, 2), C3] : null]) +
          '<div class="fx-mt">' + bar([{ v: a2, color: C1, label: 'You pay' }, { v: save, color: C2, label: 'You save' }].concat(gOn ? [{ v: gst, color: C3, label: 'GST' }] : [])) + '</div>');
    }
    wire(root, update);
  });
})();
