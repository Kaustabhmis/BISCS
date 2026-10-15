/*
 * BISCS Tools — everyday calculators.
 * Percentage, age, BMI, calories, dates, units, scientific, bill split,
 * number to words, Roman numerals, number bases, statistics and time zones.
 */
(function () {
  'use strict';
  var BT = window.BT;
  var $ = BT.$, $$ = BT.$$, esc = BT.esc, num = BT.num;
  var N = function (n, dp) { return BT.fmtNum(n, dp); };
  var INR = function (n, dp) { return BT.fmtINR(n, dp); };

  // ------------------------------------------------------------------ styles
  var CSS = [
    '.cx-col{display:flex;flex-direction:column;gap:16px;min-width:0}',
    '.cx-col>*,.cx-grid>.card{margin-top:0!important}',
    '.cx-grid{display:grid;gap:16px;grid-template-columns:1fr}',
    '@media(min-width:700px){.cx-grid.c2{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '.cx-stack>*+*{margin-top:16px}',
    '.cx-mt{margin-top:14px}',
    '.cx-sub{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:10px;font-size:.92rem;opacity:.92}',
    '.cx-sent{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-weight:600;color:var(--text-2)}',
    '.cx-sent input{width:120px;flex:1 1 90px;min-width:80px}',
    '.cx-ans{margin-top:14px;padding:12px 16px;border-radius:var(--radius-sm);background:var(--brand-soft);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}',
    '.cx-ans b{font-size:1.45rem;font-weight:800;color:var(--brand);letter-spacing:-.02em;word-break:break-all}',
    '.cx-ans span{font-size:.8rem;color:var(--text-3)}',
    '.cx-seg-wrap .seg{display:flex;width:fit-content;max-width:100%}',
    '.cx-note{font-size:.8rem;color:var(--text-3);margin:10px 0 0}',
    '.cx-scale{position:relative;margin:26px 0 6px}',
    '.cx-scale .bar-chart{height:12px}',
    '.cx-mark{position:absolute;top:-24px;transform:translateX(-50%);font-size:.75rem;font-weight:800;color:var(--text);white-space:nowrap}',
    '.cx-mark::after{content:"";display:block;width:3px;height:22px;margin:2px auto 0;background:var(--text);border-radius:2px}',
    '.cx-scale-l{display:flex;font-size:.72rem;color:var(--text-3);margin-top:4px}',
    '.cx-calc{max-width:520px}',
    '.cx-disp{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:12px}',
    '.cx-disp input{border:0!important;box-shadow:none!important;background:transparent!important;font-family:var(--mono);font-size:1.1rem;padding:4px 0!important;min-height:0!important}',
    '.cx-disp .res{font-size:2rem;font-weight:800;text-align:right;font-variant-numeric:tabular-nums;letter-spacing:-.02em;word-break:break-all;min-height:2.4rem;line-height:1.2}',
    '.cx-disp .res.err{color:var(--danger);font-size:1.1rem;font-weight:600}',
    '.cx-disp .res.pre{color:var(--text-3)}',
    '.cx-disp .top{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:.75rem;color:var(--text-3)}',
    '.cx-keys{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}',
    '.cx-keys button{font:inherit;font-weight:650;font-size:1rem;height:48px;border-radius:11px;border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;transition:transform .06s,background .15s}',
    '.cx-keys button:hover{background:var(--surface-2)}',
    '.cx-keys button:active{transform:translateY(1px)}',
    '.cx-keys button.fn{background:var(--surface-2);color:var(--text-2);font-size:.92rem}',
    '.cx-keys button.op{background:var(--brand-soft);color:var(--brand)}',
    '.cx-keys button.eq{background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;border-color:transparent}',
    '.cx-keys button.mem{height:36px;font-size:.8rem;color:var(--text-3)}',
    '.cx-keys button.on{background:var(--brand);color:#fff}',
    '.cx-hist{list-style:none;margin:0;padding:0;display:grid;gap:6px;max-height:360px;overflow:auto}',
    '.cx-hist button{width:100%;text-align:right;font:inherit;font-family:var(--mono);font-size:.85rem;background:var(--surface-2);border:1px solid var(--border);border-radius:9px;padding:8px 10px;color:var(--text-2);cursor:pointer}',
    '.cx-hist button b{display:block;color:var(--text);font-size:1rem}',
    '.cx-tz{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}',
    '.cx-tzc{position:relative;border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 14px;background:var(--surface)}',
    '.cx-tzc.src{border-color:var(--brand);background:var(--brand-soft)}',
    '.cx-tzc .city{font-weight:700;display:flex;align-items:center;gap:6px;padding-right:22px}',
    '.cx-tzc .city .icon{color:var(--text-3);width:15px;height:15px}',
    '.cx-tzc .t{font-size:1.6rem;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1.2;margin-top:2px}',
    '.cx-tzc .t small{font-size:.8rem;font-weight:600;color:var(--text-3);margin-left:6px}',
    '.cx-tzc .m{font-size:.8rem;color:var(--text-3)}',
    '.cx-tzc .rm{position:absolute;top:8px;right:8px;border:0;background:transparent;color:var(--text-3);cursor:pointer;padding:2px;border-radius:6px}',
    '.cx-tzc .rm:hover{color:var(--danger)}',
    '.cx-big-out{font-size:1.05rem;line-height:1.6;font-family:var(--font);white-space:normal}',
    '.cx-copyrow{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}',
    '.cx-copyrow .label{margin:0}',
    '.cx-people{display:flex;align-items:center;gap:8px}',
    '.cx-people input{text-align:center;font-weight:700;width:90px;flex:none}',
    '.table tr.cx-hl td{background:var(--brand-soft);font-weight:650}'
  ].join('\n');
  function injectStyle() {
    if (document.getElementById('cx-style')) return;
    var s = document.createElement('style');
    s.id = 'cx-style';
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
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function val(root, id) { var el = $('#' + id, root); return el ? num(el.value) : NaN; }
  function segVal(root, id) { var b = $('#' + id + ' button.active', root); return b ? b.getAttribute('data-v') : null; }
  function setSeg(root, id, v) {
    $$('#' + id + ' button', root).forEach(function (b) {
      var on = b.getAttribute('data-v') === String(v);
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function F(o) {
    var input = '<input type="' + (o.type || 'text') + '"' + (o.type ? '' : ' inputmode="' + (o.mode || 'decimal') + '"') + ' autocomplete="off" id="' + o.id + '" value="' + esc(o.value == null ? '' : o.value) + '"' +
      (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o.attrs || '') + '>';
    var ctl = (o.pre || o.post) ? '<div class="input-group">' + (o.pre ? '<span class="addon">' + o.pre + '</span>' : '') + input +
      (o.post ? '<span class="addon"' + (o.postId ? ' id="' + o.postId + '"' : '') + '>' + o.post + '</span>' : '') + '</div>' : input;
    return '<div class="field' + (o.cls ? ' ' + o.cls : '') + '"><label for="' + o.id + '">' + o.label + '</label>' + ctl +
      (o.hint ? '<div class="hint">' + o.hint + '</div>' : '') + '</div>';
  }
  function Seg(id, opts, active, label) {
    return '<div class="seg" id="' + id + '" data-seg role="group"' + (label ? ' aria-label="' + esc(label) + '"' : '') + '>' + opts.map(function (o) {
      var on = String(o[0]) === String(active);
      return '<button type="button" data-v="' + esc(o[0]) + '" class="' + (on ? 'active' : '') + '" aria-pressed="' + on + '">' + o[1] + '</button>';
    }).join('') + '</div>';
  }
  function SegField(id, label, opts, active) {
    return '<div class="field cx-seg-wrap"><span class="label">' + label + '</span>' + Seg(id, opts, active, label) + '</div>';
  }
  function Sel(id, label, opts, active, hint) {
    return '<div class="field"><label for="' + id + '">' + label + '</label><select id="' + id + '">' + opts.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(active) ? ' selected' : '') + '>' + o[1] + '</option>';
    }).join('') + '</select>' + (hint ? '<div class="hint">' + hint + '</div>' : '') + '</div>';
  }
  function hero(label, value, sub) {
    return '<div class="result" aria-live="polite"><div class="label">' + label + '</div><div class="value">' + value + '</div>' +
      (sub ? '<div class="cx-sub">' + sub + '</div>' : '') + '</div>';
  }
  function stats(arr) {
    return '<div class="stats">' + arr.filter(Boolean).map(function (s) {
      return '<div class="stat"><div class="label">' + s[0] + '</div><div class="value"' + (s[2] ? ' style="color:' + s[2] + '"' : '') + '>' + s[1] + '</div></div>';
    }).join('') + '</div>';
  }
  function notice(kind, msg) { return '<div class="notice ' + (kind || '') + '">' + BT.icon('info') + '<span>' + msg + '</span></div>'; }
  function card(title, inner, extra) {
    return '<div class="card">' + (title ? '<div class="card-title"><h3>' + title + '</h3>' + (extra || '') + '</div>' : '') + inner + '</div>';
  }
  function table(head, rows, numFrom) {
    numFrom = numFrom == null ? 1 : numFrom;
    return '<div class="table-wrap"><table class="table"><thead><tr>' + head.map(function (h, i) {
      return '<th scope="col"' + (i >= numFrom ? ' class="num"' : '') + '>' + h + '</th>';
    }).join('') + '</tr></thead><tbody>' + rows.map(function (r) {
      var cells = r.cells || r;
      return '<tr' + (r.cls ? ' class="' + r.cls + '"' : '') + '>' + cells.map(function (c, i) { return '<td' + (i >= numFrom ? ' class="num"' : '') + '>' + c + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>';
  }
  function layout(left, right, below) {
    return '<div class="split"><div class="cx-col">' + left + '</div><div class="cx-col">' + right + '</div></div>' +
      (below ? '<div class="cx-stack cx-mt">' + below + '</div>' : '');
  }
  function emptyHero(label, msg) { return hero(label, '—') + notice('warn', msg); }
  function wire(root, update) {
    injectStyle();
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
    if (update) bindLive(root, update);
  }
  /** Number formatting with up to `sig` significant digits, Indian grouping, exponent for extremes. */
  function fmtSig(v, sig) {
    if (!ok(v)) return '—';
    if (v === 0) return '0';
    var a = Math.abs(v);
    if (a >= 1e15 || a < 1e-7) return v.toExponential(6).replace(/\.?0+e/, 'e');
    var r = Number(v.toPrecision(sig || 10));
    return r.toLocaleString('en-IN', { maximumFractionDigits: 12 });
  }
  function rawSig(v) {
    if (!ok(v)) return '';
    return String(Number(v.toPrecision(12)));
  }

  // ----------------------------------------------------------- date helpers
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return isNaN(d) ? null : d;
  }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function isoStr(d) { return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  function dim(y, m) { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); }
  function addMonths(d, n) {
    var y = d.getUTCFullYear(), m = d.getUTCMonth() + n;
    var ty = y + Math.floor(m / 12), tm = ((m % 12) + 12) % 12;
    return new Date(Date.UTC(ty, tm, Math.min(d.getUTCDate(), dim(ty, tm))));
  }
  function addDays(d, n) { return new Date(d.getTime() + n * 864e5); }
  function dayDiff(a, b) { return Math.round((b - a) / 864e5); }
  /** Calendar difference a → b (a <= b) as {y, m, d}. */
  function ymd(a, b) {
    var total = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
    if (addMonths(a, total) > b) total--;
    return { y: Math.floor(total / 12), m: total % 12, d: dayDiff(addMonths(a, total), b), months: total };
  }
  function fmtDate(d, opts) {
    return d.toLocaleDateString('en-IN', Object.assign({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }, opts || {}));
  }
  function plural(n, w) { return N(n, 0) + ' ' + w + (n === 1 ? '' : 's'); }
  function ymdText(r) {
    var p = [];
    if (r.y) p.push(plural(r.y, 'year'));
    if (r.m) p.push(plural(r.m, 'month'));
    if (r.d || !p.length) p.push(plural(r.d, 'day'));
    return p.join(', ');
  }
  /** Weekdays (Mon–Fri) in [start, start + n days). */
  function weekdays(start, n) {
    if (n <= 0) return 0;
    var full = Math.floor(n / 7), c = full * 5, dow = start.getUTCDay();
    for (var i = 0; i < n % 7; i++) { var w = (dow + i) % 7; if (w !== 0 && w !== 6) c++; }
    return c;
  }

  // ============================================================ Percentage
  BT.impl('percentage-calculator', function (root) {
    function sent(id, parts) {
      return '<div class="cx-sent">' + parts.map(function (p) {
        if (typeof p === 'string') return '<span>' + p + '</span>';
        return '<label class="sr-only" for="' + p.id + '">' + p.label + '</label><input type="text" inputmode="decimal" autocomplete="off" id="' + p.id + '" value="' + p.value + '">';
      }).join('') + '</div><div class="cx-ans" aria-live="polite"><b id="' + id + '-a">—</b><span id="' + id + '-f"></span></div>';
    }
    root.innerHTML = '<div class="cx-grid c2">' +
      card('Percentage of a number', sent('p1', ['What is', { id: 'p1-x', label: 'Percent', value: '15' }, '% of', { id: 'p1-y', label: 'Number', value: '2,400' }, '?'])) +
      card('What percent is X of Y', sent('p2', [{ id: 'p2-x', label: 'Part', value: '360' }, 'is what % of', { id: 'p2-y', label: 'Whole', value: '1,200' }, '?'])) +
      card('Percentage change', sent('p3', ['From', { id: 'p3-x', label: 'Old value', value: '50,000' }, 'to', { id: 'p3-y', label: 'New value', value: '65,000' }])) +
      card('Increase or decrease by %', '<div class="cx-mt" style="margin-top:-4px;margin-bottom:10px">' + Seg('p4-op', [['inc', 'Increase'], ['dec', 'Decrease']], 'inc', 'Direction') + '</div>' +
        sent('p4', [{ id: 'p4-y', label: 'Value', value: '1,000' }, 'by', { id: 'p4-x', label: 'Percent', value: '18' }, '%'])) +
      card('X is P% of what?', sent('p5', [{ id: 'p5-x', label: 'Part', value: '45' }, 'is', { id: 'p5-p', label: 'Percent', value: '30' }, '% of what?'])) +
      card('Percentage difference', sent('p6', ['Between', { id: 'p6-x', label: 'First value', value: '80' }, 'and', { id: 'p6-y', label: 'Second value', value: '120' }])) +
      '</div>';
    function set(id, v, f) { $('#' + id + '-a', root).textContent = v; $('#' + id + '-f', root).textContent = f || ''; }
    function update() {
      var x, y, p;
      x = val(root, 'p1-x'); y = val(root, 'p1-y');
      ok(x) && ok(y) ? set('p1', fmtSig(x * y / 100), N(x) + '% × ' + N(y)) : set('p1', '—');
      x = val(root, 'p2-x'); y = val(root, 'p2-y');
      ok(x) && ok(y) && y !== 0 ? set('p2', fmtSig(x / y * 100) + '%', N(x) + ' ÷ ' + N(y) + ' × 100') : set('p2', '—', y === 0 ? 'Whole cannot be 0' : '');
      x = val(root, 'p3-x'); y = val(root, 'p3-y');
      if (ok(x) && ok(y) && x !== 0) {
        var ch = (y - x) / Math.abs(x) * 100;
        set('p3', (ch > 0 ? '+' : '') + fmtSig(ch) + '%', (ch >= 0 ? 'Increase' : 'Decrease') + ' of ' + fmtSig(Math.abs(y - x)));
      } else set('p3', '—', x === 0 ? 'Starting value cannot be 0' : '');
      x = val(root, 'p4-x'); y = val(root, 'p4-y');
      var inc = segVal(root, 'p4-op') === 'inc';
      ok(x) && ok(y) ? set('p4', fmtSig(y * (1 + (inc ? 1 : -1) * x / 100)), (inc ? '+' : '−') + fmtSig(Math.abs(y * x / 100))) : set('p4', '—');
      x = val(root, 'p5-x'); p = val(root, 'p5-p');
      ok(x) && ok(p) && p !== 0 ? set('p5', fmtSig(x / p * 100), N(x) + ' ÷ ' + N(p) + '%') : set('p5', '—');
      x = val(root, 'p6-x'); y = val(root, 'p6-y');
      ok(x) && ok(y) && (x + y) !== 0 ? set('p6', fmtSig(Math.abs(x - y) / ((x + y) / 2) * 100) + '%', '|a − b| ÷ average') : set('p6', '—');
    }
    wire(root, update);
  });

  // =================================================================== Age
  BT.impl('age-calculator', function (root) {
    root.innerHTML = layout(
      card('Dates', F({ id: 'ag-dob', label: 'Date of birth', type: 'date', value: '1995-08-15' }) +
        F({ id: 'ag-at', label: 'Age on', type: 'date', value: todayStr(), hint: 'Defaults to today.' }) +
        '<button type="button" class="btn btn-sm" id="ag-today">' + BT.icon('calendar-days') + ' Today</button>'),
      '<div id="ag-out"></div>'
    );
    $('#ag-today', root).addEventListener('click', function () { $('#ag-at', root).value = todayStr(); update(); });
    function update() {
      var a = parseDate($('#ag-dob', root).value), b = parseDate($('#ag-at', root).value), out = $('#ag-out', root);
      if (!a || !b) { out.innerHTML = emptyHero('Your age', 'Pick your date of birth and the date to calculate age on.'); return; }
      if (a > b) { out.innerHTML = emptyHero('Your age', 'The date of birth is after the “age on” date.'); return; }
      var r = ymd(a, b), days = dayDiff(a, b);
      // next birthday
      var by = b.getUTCFullYear(), m = a.getUTCMonth(), d = a.getUTCDate();
      function bday(y) { return new Date(Date.UTC(y, m, Math.min(d, dim(y, m)))); }
      var next = bday(by), isToday = next.getTime() === b.getTime();
      if (next < b) next = bday(by + 1);
      var toNext = ymd(b, next), daysNext = dayDiff(b, next), turning = next.getUTCFullYear() - a.getUTCFullYear();
      out.innerHTML = hero('Your age', r.y + ' <span style="font-size:.55em;font-weight:700">years</span> ' + r.m + ' <span style="font-size:.55em;font-weight:700">months</span> ' + r.d + ' <span style="font-size:.55em;font-weight:700">days</span>',
        '<span>Born on a <b>' + fmtDate(a, { weekday: 'long', day: undefined, month: undefined, year: undefined }) + '</b></span>' + (isToday ? '<span><b>' + BT.icon('cake') + ' Happy birthday!</b></span>' : '')) +
        card('In total', stats([['Months', N(r.months)], ['Weeks', N(Math.floor(days / 7)) + (days % 7 ? ' <span class="muted small">+' + days % 7 + 'd</span>' : '')], ['Days', N(days)], ['Hours', N(days * 24)], ['Minutes', N(days * 1440)]])) +
        card('Next birthday', stats([['Date', fmtDate(next, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })], ['Turning', String(turning)], ['Countdown', isToday ? 'Today!' : (toNext.m ? plural(toNext.m, 'month') + ' ' : '') + plural(toNext.d, 'day')], ['Days left', isToday ? '0' : N(daysNext)]]) +
          '<p class="cx-note">Born ' + esc(fmtDate(a)) + '.' + (m === 1 && d === 29 ? ' Leap-day birthdays are counted on 28 February in non-leap years.' : '') + '</p>');
    }
    wire(root, update);
  });

  // =================================================================== BMI
  BT.impl('bmi-calculator', function (root) {
    root.innerHTML = layout(
      card('Your measurements',
        SegField('bmi-u', 'Units', [['m', 'Metric (cm, kg)'], ['i', 'Imperial (ft, lb)']], 'm') +
        '<div id="bmi-metric">' + F({ id: 'bmi-cm', label: 'Height', value: '170', post: 'cm' }) + F({ id: 'bmi-kg', label: 'Weight', value: '68', post: 'kg' }) + '</div>' +
        '<div id="bmi-imp" class="hidden"><div class="row cols-2">' + F({ id: 'bmi-ft', label: 'Height (feet)', value: '5', post: 'ft' }) + F({ id: 'bmi-in', label: 'Inches', value: '7', post: 'in' }) + '</div>' +
        F({ id: 'bmi-lb', label: 'Weight', value: '150', post: 'lb' }) + '</div>' +
        '<label class="check"><input type="checkbox" id="bmi-asia"> Use Asian / Indian cut-offs (overweight from 23)</label>' +
        '<p class="cx-note">BMI is a screening tool for adults (18+). It does not account for muscle mass, age, sex or ethnicity.</p>'),
      '<div id="bmi-out"></div>'
    );
    $('#bmi-u', root).addEventListener('change', function () {
      var imp = segVal(root, 'bmi-u') === 'i';
      // carry values across units
      if (imp) {
        var cm = val(root, 'bmi-cm'), kg = val(root, 'bmi-kg');
        if (ok(cm)) { var tin = cm / 2.54; $('#bmi-ft', root).value = Math.floor(tin / 12); $('#bmi-in', root).value = Math.round(tin % 12 * 10) / 10; }
        if (ok(kg)) $('#bmi-lb', root).value = Math.round(kg / 0.45359237 * 10) / 10;
      } else {
        var ft = val(root, 'bmi-ft'), inch = val(root, 'bmi-in'), lb = val(root, 'bmi-lb');
        if (ok(ft)) $('#bmi-cm', root).value = Math.round(((ft * 12) + (ok(inch) ? inch : 0)) * 2.54 * 10) / 10;
        if (ok(lb)) $('#bmi-kg', root).value = Math.round(lb * 0.45359237 * 10) / 10;
      }
      $('#bmi-metric', root).classList.toggle('hidden', imp);
      $('#bmi-imp', root).classList.toggle('hidden', !imp);
    });
    function update() {
      var imp = segVal(root, 'bmi-u') === 'i', asia = $('#bmi-asia', root).checked;
      var m, kg;
      if (imp) {
        var ft = val(root, 'bmi-ft'), inch = val(root, 'bmi-in'), lb = val(root, 'bmi-lb');
        m = ((ok(ft) ? ft : 0) * 12 + (ok(inch) ? inch : 0)) * 0.0254; kg = lb * 0.45359237;
      } else { m = val(root, 'bmi-cm') / 100; kg = val(root, 'bmi-kg'); }
      var out = $('#bmi-out', root);
      if (!ok(m) || !ok(kg) || m < 0.5 || m > 2.8 || kg < 2 || kg > 500) { out.innerHTML = emptyHero('Your BMI', 'Enter a height between 50 and 280 cm and a realistic weight.'); return; }
      var bmi = kg / (m * m);
      var cuts = asia ? [18.5, 23, 25] : [18.5, 25, 30];
      var cats = [['Underweight', 'var(--warn)', 'warn'], ['Healthy weight', 'var(--ok)', 'ok'], ['Overweight', 'var(--warn)', 'warn'], ['Obese', 'var(--danger)', 'danger']];
      var ci = bmi < cuts[0] ? 0 : bmi < cuts[1] ? 1 : bmi < cuts[2] ? 2 : 3;
      var lo = 18.5 * m * m, hi = (cuts[1] - 0.1) * m * m;
      var unit = imp ? 'lb' : 'kg', conv = function (x) { return imp ? x / 0.45359237 : x; };
      var LO = 15, HI = 40, segs = [[LO, cuts[0]], [cuts[0], cuts[1]], [cuts[1], cuts[2]], [cuts[2], HI]];
      var colors = ['#60a5fa', 'var(--ok)', 'var(--warn)', 'var(--danger)'];
      var pos = Math.min(100, Math.max(0, (bmi - LO) / (HI - LO) * 100));
      var target = ci === 0 ? 'Gain ' + N(conv(lo - kg), 1) + ' ' + unit + ' to reach a healthy BMI.' : ci >= 2 ? 'Lose ' + N(conv(kg - hi), 1) + ' ' + unit + ' to reach a healthy BMI.' : 'You are within the healthy range.';
      out.innerHTML = hero('Your BMI', N(bmi, 1) + ' <span style="font-size:.5em;font-weight:700">kg/m²</span>', '<span><b>' + cats[ci][0] + '</b></span><span>' + target + '</span>') +
        card('BMI scale' + (asia ? ' <span class="badge">Asian cut-offs</span>' : ''),
          '<div class="cx-scale"><div class="cx-mark" style="left:' + pos.toFixed(2) + '%">' + N(bmi, 1) + '</div><div class="bar-chart" role="img" aria-label="BMI scale with your value ' + N(bmi, 1) + '">' +
          segs.map(function (s, i) { return '<span style="width:' + ((s[1] - s[0]) / (HI - LO) * 100).toFixed(3) + '%;background:' + colors[i] + '"></span>'; }).join('') + '</div>' +
          '<div class="cx-scale-l">' + segs.map(function (s, i) { return '<span style="width:' + ((s[1] - s[0]) / (HI - LO) * 100).toFixed(3) + '%">' + (i ? s[0] : '') + '</span>'; }).join('') + '</div></div>' +
          '<div class="legend">' + cats.map(function (c, i) { return '<span><i style="background:' + colors[i] + '"></i>' + c[0] + '</span>'; }).join('') + '</div>') +
        card('', stats([['Category', '<span class="badge ' + cats[ci][2] + '">' + cats[ci][0] + '</span>'], ['Healthy weight', N(conv(lo), 1) + '–' + N(conv(hi), 1) + ' ' + unit], ['BMI Prime', N(bmi / (cuts[1]), 2)], ['Height', imp ? Math.floor(m / 0.0254 / 12) + '′ ' + N(m / 0.0254 % 12, 1) + '″' : N(m * 100, 1) + ' cm']]));
    }
    wire(root, update);
  });

  // =============================================================== Calories
  BT.impl('calorie-calculator', function (root) {
    var ACT = [['1.2', 'Sedentary (little or no exercise)'], ['1.375', 'Light (exercise 1–3 days/week)'], ['1.55', 'Moderate (exercise 3–5 days/week)'], ['1.725', 'Active (hard exercise 6–7 days/week)'], ['1.9', 'Very active (physical job or 2× training)']];
    root.innerHTML = layout(
      card('About you',
        '<div class="row cols-2">' + SegField('cal-sex', 'Sex', [['m', 'Male'], ['f', 'Female']], 'm') + SegField('cal-u', 'Units', [['m', 'Metric'], ['i', 'Imperial']], 'm') + '</div>' +
        F({ id: 'cal-age', label: 'Age', value: '30', post: 'years' }) +
        '<div id="cal-metric" class="row cols-2">' + F({ id: 'cal-cm', label: 'Height', value: '170', post: 'cm' }) + F({ id: 'cal-kg', label: 'Weight', value: '70', post: 'kg' }) + '</div>' +
        '<div id="cal-imp" class="hidden"><div class="row cols-3">' + F({ id: 'cal-ft', label: 'Feet', value: '5', post: 'ft' }) + F({ id: 'cal-in', label: 'Inches', value: '7', post: 'in' }) + F({ id: 'cal-lb', label: 'Weight', value: '154', post: 'lb' }) + '</div></div>' +
        Sel('cal-act', 'Activity level', ACT, '1.375')),
      '<div id="cal-out"></div>'
    );
    $('#cal-u', root).addEventListener('change', function () {
      var imp = segVal(root, 'cal-u') === 'i';
      $('#cal-metric', root).classList.toggle('hidden', imp);
      $('#cal-imp', root).classList.toggle('hidden', !imp);
    });
    function update() {
      var imp = segVal(root, 'cal-u') === 'i', male = segVal(root, 'cal-sex') === 'm';
      var age = val(root, 'cal-age'), cm, kg;
      if (imp) { cm = ((val(root, 'cal-ft') || 0) * 12 + (val(root, 'cal-in') || 0)) * 2.54; kg = val(root, 'cal-lb') * 0.45359237; }
      else { cm = val(root, 'cal-cm'); kg = val(root, 'cal-kg'); }
      var act = Number($('#cal-act', root).value), out = $('#cal-out', root);
      if (!ok(age) || age < 15 || age > 100 || !ok(cm) || cm < 100 || cm > 250 || !ok(kg) || kg < 25 || kg > 300) {
        out.innerHTML = emptyHero('Maintenance calories', 'Enter an age of 15–100, height of 100–250 cm and weight of 25–300 kg.');
        return;
      }
      var bmr = 10 * kg + 6.25 * cm - 5 * age + (male ? 5 : -161), tdee = bmr * act, floor = male ? 1500 : 1200;
      var goals = [['Extreme weight loss', -1000, '~1 kg/week'], ['Weight loss', -500, '~0.5 kg/week'], ['Mild weight loss', -250, '~0.25 kg/week'], ['Maintain weight', 0, ''], ['Mild weight gain', 250, '~0.25 kg/week'], ['Weight gain', 500, '~0.5 kg/week']];
      out.innerHTML = hero('Maintenance calories', N(Math.round(tdee)) + ' <span style="font-size:.5em;font-weight:700">kcal/day</span>', '<span>BMR <b>' + N(Math.round(bmr)) + ' kcal</b></span><span>× ' + act + ' activity</span>') +
        card('Calories for your goal', table(['Goal', 'Calories / day', 'Rate'], goals.map(function (g) {
          var c = Math.round(tdee + g[1]), low = c < floor;
          return { cls: g[1] === 0 ? 'cx-hl' : '', cells: [g[0], N(c) + ' kcal' + (low ? ' <span class="badge warn">low</span>' : ''), g[2] || '—'] };
        })) + '<p class="cx-note">Mifflin–St Jeor equation. Avoid going below ' + N(floor) + ' kcal/day without medical supervision.</p>') +
        card('Suggested macros (maintenance)', stats([['Protein (25%)', N(Math.round(tdee * 0.25 / 4)) + ' g'], ['Carbs (50%)', N(Math.round(tdee * 0.5 / 4)) + ' g'], ['Fat (25%)', N(Math.round(tdee * 0.25 / 9)) + ' g']]));
    }
    wire(root, update);
  });

  // ======================================================= Date difference
  BT.impl('date-difference-calculator', function (root) {
    var t = todayStr(), td = parseDate(t);
    root.innerHTML = layout(
      card('Dates', F({ id: 'dd-a', label: 'Start date', type: 'date', value: t }) +
        F({ id: 'dd-b', label: 'End date', type: 'date', value: isoStr(addMonths(td, 3)) }) +
        '<label class="check"><input type="checkbox" id="dd-inc"> Include the end date (add 1 day)</label>' +
        '<div class="btn-group cx-mt"><button type="button" class="btn btn-sm" id="dd-swap">' + BT.icon('refresh-cw') + ' Swap dates</button></div>'),
      '<div id="dd-out"></div>'
    );
    $('#dd-swap', root).addEventListener('click', function () {
      var a = $('#dd-a', root), b = $('#dd-b', root), x = a.value; a.value = b.value; b.value = x; update();
    });
    function update() {
      var a = parseDate($('#dd-a', root).value), b = parseDate($('#dd-b', root).value), inc = $('#dd-inc', root).checked, out = $('#dd-out', root);
      if (!a || !b) { out.innerHTML = emptyHero('Difference', 'Pick both dates.'); return; }
      var rev = b < a;
      if (rev) { var x = a; a = b; b = x; }
      var end = inc ? addDays(b, 1) : b;
      var days = dayDiff(a, end), r = ymd(a, end), wd = weekdays(a, days);
      out.innerHTML = hero('Difference', plural(days, 'day'), '<span><b>' + ymdText(r) + '</b></span>' + (rev ? '<span>(end date is before start)</span>' : '')) +
        card('', stats([['Weeks', N(Math.floor(days / 7)) + (days % 7 ? ' <span class="muted small">+ ' + plural(days % 7, 'day') + '</span>' : '')], ['Total months', N(r.months) + (r.d ? ' <span class="muted small">+ ' + r.d + 'd</span>' : '')],
          ['Working days', N(wd), 'var(--ok)'], ['Weekend days', N(days - wd)], ['Hours', N(days * 24)], ['Minutes', N(days * 1440)]]) +
          '<p class="cx-note">From ' + esc(fmtDate(a)) + ' to ' + esc(fmtDate(b)) + (inc ? ', end date included' : ', end date not included') + '. Working days count Monday to Friday and ignore public holidays.</p>');
    }
    wire(root, update);
  });

  // ============================================================== Date add
  BT.impl('date-add-calculator', function (root) {
    root.innerHTML = layout(
      card('Start & duration', F({ id: 'da-s', label: 'Start date', type: 'date', value: todayStr() }) +
        SegField('da-op', 'Operation', [['add', BT.icon('plus') + ' Add'], ['sub', BT.icon('minus') + ' Subtract']], 'add') +
        '<div class="row cols-2">' + F({ id: 'da-y', label: 'Years', value: '0', mode: 'numeric' }) + F({ id: 'da-m', label: 'Months', value: '0', mode: 'numeric' }) +
        F({ id: 'da-w', label: 'Weeks', value: '0', mode: 'numeric' }) + F({ id: 'da-d', label: 'Days', value: '90', mode: 'numeric' }) + '</div>' +
        '<label class="check"><input type="checkbox" id="da-biz"> Count days as business days (skip Sat & Sun)</label>'),
      '<div id="da-out"></div>'
    );
    function update() {
      var s = parseDate($('#da-s', root).value), out = $('#da-out', root);
      var sign = segVal(root, 'da-op') === 'sub' ? -1 : 1, biz = $('#da-biz', root).checked;
      var y = val(root, 'da-y'), m = val(root, 'da-m'), w = val(root, 'da-w'), d = val(root, 'da-d');
      y = ok(y) ? Math.trunc(y) : 0; m = ok(m) ? Math.trunc(m) : 0; w = ok(w) ? Math.trunc(w) : 0; d = ok(d) ? Math.trunc(d) : 0;
      if (!s) { out.innerHTML = emptyHero('Result date', 'Pick a start date.'); return; }
      if (Math.abs(y) > 5000 || Math.abs(m) > 60000 || Math.abs(w) > 260000 || Math.abs(d) > 1830000) { out.innerHTML = emptyHero('Result date', 'That duration is too large.'); return; }
      var r = addMonths(s, sign * (y * 12 + m));
      r = addDays(r, sign * w * 7);
      if (biz) {
        var left = Math.abs(d), step = sign * (d < 0 ? -1 : 1);
        var full = Math.floor(left / 5); r = addDays(r, step * full * 7); left -= full * 5;
        while (left > 0) { r = addDays(r, step); var dw = r.getUTCDay(); if (dw !== 0 && dw !== 6) left--; }
      } else r = addDays(r, sign * d);
      if (isNaN(r) || r.getUTCFullYear() < 1 || r.getUTCFullYear() > 275000) { out.innerHTML = emptyHero('Result date', 'The result is outside the supported date range.'); return; }
      var diff = dayDiff(s, r), we = r.getUTCDay() === 0 || r.getUTCDay() === 6;
      out.innerHTML = hero('Result date', esc(fmtDate(r, { weekday: undefined })), '<span><b>' + esc(fmtDate(r, { weekday: 'long', day: undefined, month: undefined, year: undefined })) + '</b></span><span>' + plural(Math.abs(diff), 'calendar day') + (diff < 0 ? ' before' : ' after') + ' start</span>') +
        card('', stats([['ISO date', isoStr(r)], ['Calendar days', (diff >= 0 ? '+' : '−') + N(Math.abs(diff))], ['Weeks', N(Math.abs(diff) / 7, 1)], ['Working days', N(diff >= 0 ? weekdays(s, diff) : weekdays(r, -diff))]]) +
          '<p class="cx-note">Months and years are added first (31 Jan + 1 month = end of February), then weeks, then days.' + (biz ? ' Business days skip weekends but not public holidays.' : '') + '</p>') +
        (we ? notice('warn', 'This date falls on a weekend.') : '');
    }
    wire(root, update);
  });

  // ========================================================= Unit converter
  var UNITS = {
    length: { name: 'Length', units: [['mm', 'Millimetre', 0.001], ['cm', 'Centimetre', 0.01], ['m', 'Metre', 1], ['km', 'Kilometre', 1000], ['in', 'Inch', 0.0254], ['ft', 'Foot', 0.3048], ['yd', 'Yard', 0.9144], ['mi', 'Mile', 1609.344], ['nmi', 'Nautical mile', 1852], ['um', 'Micrometre', 1e-6]], a: 'ft', b: 'cm' },
    weight: { name: 'Weight', units: [['mg', 'Milligram', 1e-6], ['g', 'Gram', 0.001], ['kg', 'Kilogram', 1], ['t', 'Tonne', 1000], ['q', 'Quintal', 100], ['oz', 'Ounce', 0.028349523125], ['lb', 'Pound', 0.45359237], ['st', 'Stone', 6.35029318], ['tola', 'Tola', 0.0116638], ['ct', 'Carat', 0.0002]], a: 'kg', b: 'lb' },
    temperature: { name: 'Temperature', units: [['C', 'Celsius'], ['F', 'Fahrenheit'], ['K', 'Kelvin']], a: 'C', b: 'F' },
    area: { name: 'Area', units: [['m2', 'Square metre', 1], ['cm2', 'Square centimetre', 1e-4], ['km2', 'Square kilometre', 1e6], ['ha', 'Hectare', 1e4], ['ac', 'Acre', 4046.8564224], ['ft2', 'Square foot', 0.09290304], ['yd2', 'Square yard (gaj)', 0.83612736], ['in2', 'Square inch', 0.00064516], ['mi2', 'Square mile', 2589988.110336], ['cent', 'Cent', 40.468564224], ['guntha', 'Guntha', 101.17141056]], a: 'ft2', b: 'm2' },
    volume: { name: 'Volume', units: [['ml', 'Millilitre', 0.001], ['l', 'Litre', 1], ['m3', 'Cubic metre', 1000], ['cm3', 'Cubic centimetre', 0.001], ['tsp', 'Teaspoon (US)', 0.00492892159375], ['tbsp', 'Tablespoon (US)', 0.0147867647825], ['cup', 'Cup (US)', 0.2365882365], ['floz', 'Fluid ounce (US)', 0.0295735295625], ['pt', 'Pint (US)', 0.473176473], ['gal', 'Gallon (US)', 3.785411784], ['galuk', 'Gallon (UK)', 4.54609], ['ft3', 'Cubic foot', 28.316846592]], a: 'l', b: 'gal' },
    speed: { name: 'Speed', units: [['mps', 'Metre/second', 1], ['kmh', 'Kilometre/hour', 1 / 3.6], ['mph', 'Mile/hour', 0.44704], ['kn', 'Knot', 1852 / 3600], ['fps', 'Foot/second', 0.3048]], a: 'kmh', b: 'mph' },
    time: { name: 'Time', units: [['ms', 'Millisecond', 0.001], ['s', 'Second', 1], ['min', 'Minute', 60], ['h', 'Hour', 3600], ['d', 'Day', 86400], ['wk', 'Week', 604800], ['mo', 'Month (avg)', 2629800], ['yr', 'Year (365.25 d)', 31557600]], a: 'h', b: 'min' },
    data: { name: 'Digital storage', units: [['bit', 'Bit', 0.125], ['B', 'Byte', 1], ['KB', 'Kilobyte (1000)', 1e3], ['MB', 'Megabyte (1000²)', 1e6], ['GB', 'Gigabyte (1000³)', 1e9], ['TB', 'Terabyte (1000⁴)', 1e12], ['PB', 'Petabyte (1000⁵)', 1e15], ['KiB', 'Kibibyte (1024)', 1024], ['MiB', 'Mebibyte (1024²)', 1048576], ['GiB', 'Gibibyte (1024³)', 1073741824], ['TiB', 'Tebibyte (1024⁴)', 1099511627776]], a: 'GB', b: 'MB' }
  };
  function toBase(cat, u, v) {
    if (cat === 'temperature') return u === 'C' ? v : u === 'F' ? (v - 32) * 5 / 9 : v - 273.15;
    return v * unitOf(cat, u)[2];
  }
  function fromBase(cat, u, v) {
    if (cat === 'temperature') return u === 'C' ? v : u === 'F' ? v * 9 / 5 + 32 : v + 273.15;
    return v / unitOf(cat, u)[2];
  }
  function unitOf(cat, id) { var l = UNITS[cat].units; for (var i = 0; i < l.length; i++) if (l[i][0] === id) return l[i]; return l[0]; }

  BT.impl('unit-converter', function (root) {
    var cats = Object.keys(UNITS);
    root.innerHTML = '<div class="card"><div class="field cx-seg-wrap"><span class="label">Category</span>' + Seg('uc-cat', cats.map(function (c) { return [c, UNITS[c].name]; }), 'length', 'Category') + '</div>' +
      '<div class="row cols-2" style="align-items:end">' +
      '<div><div class="field"><label for="uc-a">From</label><input type="text" inputmode="decimal" autocomplete="off" id="uc-a" value="1"></div><div class="field"><label for="uc-ua" class="sr-only">From unit</label><select id="uc-ua"></select></div></div>' +
      '<div><div class="field"><label for="uc-b">To</label><input type="text" inputmode="decimal" autocomplete="off" id="uc-b"></div><div class="field"><label for="uc-ub" class="sr-only">To unit</label><select id="uc-ub"></select></div></div>' +
      '</div><div class="btn-group"><button type="button" class="btn btn-sm" id="uc-swap">' + BT.icon('refresh-cw') + ' Swap units</button><button type="button" class="btn btn-sm" id="uc-copy">' + BT.icon('copy') + ' Copy result</button></div>' +
      '<div id="uc-line" class="cx-ans" aria-live="polite"></div></div>' +
      '<div class="card"><div class="card-title"><h3 id="uc-all-t">All conversions</h3></div><div id="uc-all"></div><p class="cx-note" id="uc-note"></p></div>';
    injectStyle();
    var cat = 'length', last = 'a';
    var A = $('#uc-a', root), B = $('#uc-b', root), UA = $('#uc-ua', root), UB = $('#uc-ub', root);
    function fill() {
      var opts = UNITS[cat].units.map(function (u) { return '<option value="' + u[0] + '">' + esc(u[1]) + ' (' + esc(u[0].replace('2', '²').replace('3', '³')) + ')</option>'; }).join('');
      UA.innerHTML = opts; UB.innerHTML = opts;
      UA.value = UNITS[cat].a; UB.value = UNITS[cat].b;
      $('#uc-note', root).textContent = cat === 'area' ? 'Indian land units: 1 cent = 435.6 sq ft, 1 guntha = 1,089 sq ft, 1 sq yard (gaj) = 9 sq ft. Bigha, biswa and kanal vary by state, so they are not included.'
        : cat === 'weight' ? '1 tola = 11.6638 g (standard Indian tola), 1 quintal = 100 kg.' : cat === 'data' ? 'KB/MB/GB use powers of 1000 (SI); KiB/MiB/GiB use powers of 1024.' : '';
    }
    function update() {
      var src = last === 'a' ? A : B, dst = last === 'a' ? B : A, us = last === 'a' ? UA.value : UB.value, ud = last === 'a' ? UB.value : UA.value;
      var v = num(src.value), line = $('#uc-line', root);
      if (!ok(v)) {
        dst.value = '';
        line.innerHTML = '<span>Enter a number to convert.</span>';
        $('#uc-all', root).innerHTML = '';
        return;
      }
      var base = toBase(cat, us, v), r = fromBase(cat, ud, base);
      dst.value = rawSig(r);
      var av = num(A.value), ab = toBase(cat, UA.value, av);
      var ua = unitOf(cat, UA.value), ub = unitOf(cat, UB.value);
      line.innerHTML = '<b>' + fmtSig(av) + ' ' + esc(ua[0].replace('2', '²').replace('3', '³')) + ' = ' + fmtSig(fromBase(cat, UB.value, ab)) + ' ' + esc(ub[0].replace('2', '²').replace('3', '³')) + '</b><span>' + esc(ua[1]) + ' → ' + esc(ub[1]) + '</span>';
      var warn = cat === 'temperature' && ab < -273.15 ? notice('warn', 'That is below absolute zero (−273.15 °C).') : '';
      $('#uc-all-t', root).textContent = fmtSig(av) + ' ' + ua[1] + ' equals';
      $('#uc-all', root).innerHTML = warn + table(['Unit', 'Value'], UNITS[cat].units.map(function (u) {
        return { cls: u[0] === UB.value ? 'cx-hl' : '', cells: [esc(u[1]) + ' <span class="muted small">' + esc(u[0].replace('2', '²').replace('3', '³')) + '</span>', fmtSig(fromBase(cat, u[0], ab))] };
      }));
    }
    $('#uc-cat', root).addEventListener('change', function () { cat = segVal(root, 'uc-cat'); fill(); last = 'a'; update(); });
    A.addEventListener('input', function () { last = 'a'; update(); });
    B.addEventListener('input', function () { last = 'b'; update(); });
    UA.addEventListener('change', function () { last = 'a'; update(); });
    UB.addEventListener('change', function () { last = 'a'; update(); });
    $('#uc-swap', root).addEventListener('click', function () { var x = UA.value; UA.value = UB.value; UB.value = x; last = 'a'; update(); });
    $('#uc-copy', root).addEventListener('click', function () { if (B.value) BT.copy(B.value + ' ' + UB.value); });
    wire(root, null);
    fill();
    update();
  });

  // =================================================== Scientific calculator
  /** Safe expression evaluator: tokenizer + recursive-descent parser (no eval). */
  function evaluate(src, opt) {
    var s = String(src).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\s+/g, '');
    var toks = [], i = 0, m;
    while (i < s.length) {
      var rest = s.slice(i);
      if ((m = /^(\d+\.?\d*|\.\d+)/.exec(rest))) {
        toks.push({ t: 'n', v: parseFloat(m[0]) }); i += m[0].length;
      } else if ((m = /^[a-z]+/i.exec(rest))) {
        toks.push({ t: 'id', v: m[0].toLowerCase() }); i += m[0].length;
      } else if ('+-*/^()!%√∛π'.indexOf(s[i]) > -1) {
        toks.push({ t: s[i] }); i++;
      } else throw new Error('Unexpected “' + s[i] + '”');
    }
    // split runs of letters like "pie" are not supported; identifiers must be known
    var FUN = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'log', 'ln', 'sqrt', 'cbrt', 'abs', 'exp'];
    var CON = ['pi', 'e', 'ans', 'mem'];
    var p = 0;
    function peek() { return toks[p]; }
    function take(t) { if (toks[p] && toks[p].t === t) { p++; return true; } return false; }
    function startsPrimary(k) { return k && (k.t === 'n' || k.t === 'id' || k.t === '(' || k.t === '√' || k.t === '∛' || k.t === 'π'); }
    function toRad(x) { return opt.deg ? x * Math.PI / 180 : x; }
    function fromRad(x) { return opt.deg ? x * 180 / Math.PI : x; }
    function clean(x) { return Math.abs(x) < 1e-14 ? 0 : x; }
    function fact(n) {
      if (n < 0 || Math.floor(n) !== n) throw new Error('Factorial needs a whole number ≥ 0');
      if (n > 170) return Infinity;
      var r = 1; for (var k = 2; k <= n; k++) r *= k; return r;
    }
    function apply(f, x) {
      switch (f) {
        case 'sin': return clean(Math.sin(toRad(x)));
        case 'cos': return clean(Math.cos(toRad(x)));
        case 'tan': { var c = Math.cos(toRad(x)); if (Math.abs(c) < 1e-14) throw new Error('tan is undefined here'); return clean(Math.sin(toRad(x)) / c); }
        case 'asin': if (x < -1 || x > 1) throw new Error('sin⁻¹ needs −1 to 1'); return fromRad(Math.asin(x));
        case 'acos': if (x < -1 || x > 1) throw new Error('cos⁻¹ needs −1 to 1'); return fromRad(Math.acos(x));
        case 'atan': return fromRad(Math.atan(x));
        case 'sinh': return Math.sinh(x);
        case 'cosh': return Math.cosh(x);
        case 'tanh': return Math.tanh(x);
        case 'log': if (x <= 0) throw new Error('log needs a positive number'); return Math.log10(x);
        case 'ln': if (x <= 0) throw new Error('ln needs a positive number'); return Math.log(x);
        case 'sqrt': if (x < 0) throw new Error('√ of a negative number'); return Math.sqrt(x);
        case 'cbrt': return Math.cbrt(x);
        case 'abs': return Math.abs(x);
        case 'exp': return Math.exp(x);
      }
      throw new Error('Unknown function');
    }
    function expr() {
      var v = term();
      for (;;) {
        if (take('+')) v += term();
        else if (take('-')) v -= term();
        else return v;
      }
    }
    function term() {
      var v = unary();
      for (;;) {
        if (take('*')) v *= unary();
        else if (take('/')) { var d = unary(); if (d === 0) throw new Error('Cannot divide by zero'); v /= d; }
        else if (startsPrimary(peek())) v *= power();
        else return v;
      }
    }
    function unary() {
      if (take('-')) return -unary();
      if (take('+')) return unary();
      return power();
    }
    function power() {
      var b = postfix();
      if (take('^')) {
        var e = unary(), r = Math.pow(b, e);
        if (isNaN(r)) throw new Error('Invalid power');
        return r;
      }
      return b;
    }
    function postfix() {
      var v = primary();
      for (;;) {
        if (take('!')) v = fact(v);
        else if (take('%')) v = v / 100;
        else return v;
      }
    }
    function group() {
      if (!take('(')) throw new Error('Expected (');
      var v = expr();
      if (!take(')') && p < toks.length) throw new Error('Expected )');
      return v;
    }
    function primary() {
      var k = peek();
      if (!k) throw new Error('Incomplete expression');
      if (k.t === 'n') { p++; return k.v; }
      if (k.t === '(') return group();
      if (k.t === 'π') { p++; return Math.PI; }
      if (k.t === '√' || k.t === '∛') { p++; var a = peek() && peek().t === '(' ? group() : power(); return apply(k.t === '√' ? 'sqrt' : 'cbrt', a); }
      if (k.t === 'id') {
        p++;
        if (FUN.indexOf(k.v) > -1) { var x = peek() && peek().t === '(' ? group() : power(); return apply(k.v, x); }
        if (CON.indexOf(k.v) > -1) {
          if (k.v === 'pi') return Math.PI;
          if (k.v === 'e') return Math.E;
          if (k.v === 'ans') return opt.ans || 0;
          return opt.mem || 0;
        }
        throw new Error('Unknown name “' + k.v + '”');
      }
      throw new Error('Unexpected “' + k.t + '”');
    }
    if (!toks.length) return null;
    var out = expr();
    if (p < toks.length) throw new Error('Unexpected “' + (toks[p].t === 'n' ? toks[p].v : toks[p].t === 'id' ? toks[p].v : toks[p].t) + '”');
    if (!isFinite(out)) throw new Error(isNaN(out) ? 'Not a number' : 'Result is too large');
    return Number(out.toPrecision(12));
  }
  BT.calcEvaluate = evaluate;

  BT.impl('scientific-calculator', function (root) {
    injectStyle();
    var KEYS = [
      [['MC', 'mem', 'mc'], ['MR', 'mem', 'mr'], ['M+', 'mem', 'm+'], ['M−', 'mem', 'm-'], ['EE', 'mem', 'ins:×10^']],
      [['2nd', 'fn', 'second'], ['(', 'fn', 'ins:('], [')', 'fn', 'ins:)'], ['%', 'fn', 'ins:%'], ['AC', 'fn', 'clear']],
      [['sin', 'fn', 'f:sin'], ['cos', 'fn', 'f:cos'], ['tan', 'fn', 'f:tan'], ['π', 'fn', 'ins:π'], ['e', 'fn', 'ins:e']],
      [['x²', 'fn', 'ins:^2'], ['√', 'fn', 'f:√'], ['xʸ', 'fn', 'ins:^'], ['log', 'fn', 'f:log'], ['ln', 'fn', 'f:ln']],
      [['7', '', 'ins:7'], ['8', '', 'ins:8'], ['9', '', 'ins:9'], ['÷', 'op', 'ins:÷'], ['⌫', 'fn', 'back']],
      [['4', '', 'ins:4'], ['5', '', 'ins:5'], ['6', '', 'ins:6'], ['×', 'op', 'ins:×'], ['n!', 'fn', 'ins:!']],
      [['1', '', 'ins:1'], ['2', '', 'ins:2'], ['3', '', 'ins:3'], ['−', 'op', 'ins:−'], ['1/x', 'fn', 'ins:^(−1)']],
      [['0', '', 'ins:0'], ['.', '', 'ins:.'], ['Ans', 'fn', 'ins:Ans'], ['+', 'op', 'ins:+'], ['=', 'eq', 'eval']]
    ];
    var SECOND = { 'f:sin': ['sin⁻¹', 'f:asin'], 'f:cos': ['cos⁻¹', 'f:acos'], 'f:tan': ['tan⁻¹', 'f:atan'], 'ins:^2': ['x³', 'ins:^3'], 'f:√': ['∛', 'f:∛'], 'f:log': ['10ˣ', 'ins:10^('], 'f:ln': ['eˣ', 'ins:e^('] };
    root.innerHTML = '<div class="split wide-left"><div class="card cx-calc">' +
      '<div class="cx-disp"><div class="top"><span>' + Seg('sc-angle', [['deg', 'DEG'], ['rad', 'RAD']], 'deg', 'Angle unit') + '</span><span id="sc-mem" class="badge hidden">M</span></div>' +
      '<label for="sc-in" class="sr-only">Expression</label><input type="text" id="sc-in" autocomplete="off" spellcheck="false" placeholder="Type or tap, e.g. 2sin(30)+√16">' +
      '<div class="res pre" id="sc-res" aria-live="polite">0</div></div>' +
      '<div class="cx-keys" id="sc-keys">' + KEYS.map(function (row) {
        return row.map(function (k) { return '<button type="button" class="' + k[1] + '" data-k="' + esc(k[2]) + '" data-base="' + esc(k[2]) + '" data-label="' + esc(k[0]) + '">' + esc(k[0]) + '</button>'; }).join('');
      }).join('') + '</div>' +
      '<p class="cx-note">Keyboard: type numbers and + − * / ^ ( ) ! %, Enter for =, Esc to clear. Functions: sin cos tan asin log ln sqrt; constants pi, e, Ans.</p></div>' +
      '<div class="card"><div class="card-title"><h3>History</h3><button type="button" class="btn btn-sm btn-ghost" id="sc-clearh">' + BT.icon('trash-2') + ' Clear</button></div><ul class="cx-hist" id="sc-hist"><li class="muted small">Your calculations will appear here.</li></ul></div></div>';
    wire(root, null);
    var input = $('#sc-in', root), res = $('#sc-res', root), second = false, ans = 0, mem = 0, hist = [], justEval = false;
    var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    function opts() { return { deg: segVal(root, 'sc-angle') === 'deg', ans: ans, mem: mem }; }
    function preview() {
      var v = input.value.trim();
      res.className = 'res pre';
      if (!v) { res.textContent = '0'; return; }
      try { var r = evaluate(v, opts()); res.textContent = r == null ? '' : fmtSig(r, 12); }
      catch (e) { res.textContent = ''; }
    }
    function insert(t) {
      if (justEval && /^[0-9.(πe√∛A]|^[a-z]/i.test(t) && !/^\^/.test(t)) input.value = '';
      justEval = false;
      var a = input.selectionStart == null ? input.value.length : input.selectionStart, b = input.selectionEnd == null ? a : input.selectionEnd;
      input.setRangeText(t, a, b, 'end');
      if (fine) input.focus();
      preview();
    }
    function run() {
      var v = input.value.trim();
      if (!v) return;
      try {
        var r = evaluate(v, opts());
        if (r == null) return;
        ans = r;
        hist.unshift({ e: v, r: r });
        hist = hist.slice(0, 20);
        renderHist();
        input.value = rawSig(r);
        res.className = 'res';
        res.textContent = fmtSig(r, 12);
        justEval = true;
      } catch (e) {
        res.className = 'res err';
        res.textContent = e.message || 'Error';
      }
    }
    function renderHist() {
      $('#sc-hist', root).innerHTML = hist.length ? hist.map(function (h, i) {
        return '<li><button type="button" data-h="' + i + '">' + esc(h.e) + ' =<b>' + esc(fmtSig(h.r, 12)) + '</b></button></li>';
      }).join('') : '<li class="muted small">Your calculations will appear here.</li>';
    }
    function setSecond(on) {
      second = on;
      $$('#sc-keys button', root).forEach(function (b) {
        var base = b.getAttribute('data-base');
        if (base === 'second') { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); return; }
        var alt = SECOND[base];
        if (!alt) return;
        b.textContent = on ? alt[0] : b.getAttribute('data-label');
        b.setAttribute('data-k', on ? alt[1] : base);
      });
    }
    $('#sc-keys', root).addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var k = b.getAttribute('data-k');
      if (k === 'second') { setSecond(!second); return; }
      if (k.indexOf('ins:') === 0) insert(k.slice(4));
      else if (k.indexOf('f:') === 0) { var f = k.slice(2); insert(f === '√' || f === '∛' ? f + '(' : f + '('); }
      else if (k === 'clear') { input.value = ''; justEval = false; preview(); }
      else if (k === 'back') {
        var a = input.selectionStart, z = input.selectionEnd;
        if (a == null) { a = z = input.value.length; }
        if (a !== z) input.setRangeText('', a, z, 'end');
        else if (a > 0) {
          var before = input.value.slice(0, a), mm = /(asin|acos|atan|sinh|cosh|tanh|sin|cos|tan|log|ln|sqrt|cbrt|Ans)\($|Ans$|.$/.exec(before);
          input.setRangeText('', a - mm[0].length, a, 'end');
        }
        justEval = false; preview();
      } else if (k === 'eval') run();
      else if (k === 'mc') { mem = 0; BT.toast('Memory cleared'); }
      else if (k === 'mr') insert(rawSig(mem));
      else if (k === 'm+' || k === 'm-') {
        try { var v = evaluate(input.value || '0', opts()) || 0; mem += k === 'm+' ? v : -v; BT.toast('Memory: ' + fmtSig(mem, 12)); }
        catch (er) { BT.toast(er.message, 'error'); }
      }
      if (second && k !== 'second' && b.getAttribute('data-base') !== k) setSecond(false);
      $('#sc-mem', root).classList.toggle('hidden', mem === 0);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); run(); }
      else if (e.key === 'Escape') { e.preventDefault(); input.value = ''; preview(); }
      else if (justEval && e.key.length === 1) {
        if (/[0-9.(a-z]/i.test(e.key)) input.value = '';
        justEval = false;
      }
    });
    input.addEventListener('input', preview);
    $('#sc-angle', root).addEventListener('change', preview);
    $('#sc-hist', root).addEventListener('click', function (e) {
      var b = e.target.closest('button[data-h]');
      if (!b) return;
      var h = hist[+b.getAttribute('data-h')];
      input.value = h.e; preview();
      if (fine) input.focus();
    });
    $('#sc-clearh', root).addEventListener('click', function () { hist = []; renderHist(); });
    // type anywhere in the calculator card (when the input is not focused)
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var tag = (e.target.tagName || '');
      if (/INPUT|TEXTAREA|SELECT/.test(tag) || e.target.isContentEditable) return;
      if ($('.search-modal.open')) return;
      if (/^[0-9+\-*/^().!%]$/.test(e.key)) { e.preventDefault(); input.selectionStart = input.selectionEnd = input.value.length; insert(e.key); }
      else if (e.key === 'Enter' && document.activeElement === document.body && input.value) { e.preventDefault(); run(); }
      else if (e.key === 'Backspace' && document.activeElement === document.body) { e.preventDefault(); input.value = input.value.slice(0, -1); preview(); }
    });
  });

  // ============================================================ Bill split
  BT.impl('bill-split-calculator', function (root) {
    root.innerHTML = layout(
      card('Bill',
        F({ id: 'bs-amt', label: 'Bill amount', value: '2,450', pre: '₹' }) +
        '<div class="field cx-seg-wrap"><span class="label">Tip</span>' + Seg('bs-tip', [['0', 'None'], ['5', '5%'], ['10', '10%'], ['15', '15%'], ['20', '20%'], ['c', 'Custom']], '10', 'Tip') + '</div>' +
        F({ id: 'bs-tipc', label: 'Custom tip', value: '12', post: '%', cls: 'hidden' }) +
        F({ id: 'bs-tax', label: 'Tax / service charge', value: '0', post: '%', hint: 'Leave at 0 if the bill already includes GST.' }) +
        '<div class="field"><label for="bs-n">Number of people</label><div class="cx-people"><button type="button" class="btn" id="bs-minus" aria-label="Fewer people">' + BT.icon('minus') + '</button>' +
        '<input type="text" inputmode="numeric" id="bs-n" value="4" autocomplete="off"><button type="button" class="btn" id="bs-plus" aria-label="More people">' + BT.icon('plus') + '</button></div></div>' +
        Sel('bs-round', 'Round each share', [['0', 'No rounding'], ['1', 'Up to nearest ₹1'], ['10', 'Up to nearest ₹10'], ['50', 'Up to nearest ₹50'], ['100', 'Up to nearest ₹100']], '1')),
      '<div id="bs-out"></div>'
    );
    function step(d) { var n = $('#bs-n', root), v = Math.round(num(n.value)); n.value = Math.max(1, Math.min(999, (ok(v) ? v : 1) + d)); update(); }
    $('#bs-minus', root).addEventListener('click', function () { step(-1); });
    $('#bs-plus', root).addEventListener('click', function () { step(1); });
    function update() {
      var t = segVal(root, 'bs-tip');
      $('#bs-tipc', root).closest('.field').classList.toggle('hidden', t !== 'c');
      var bill = val(root, 'bs-amt'), tip = t === 'c' ? val(root, 'bs-tipc') : Number(t), tax = val(root, 'bs-tax'), n = Math.round(val(root, 'bs-n')), r = Number($('#bs-round', root).value);
      if (!ok(tax) || tax < 0) tax = 0;
      var out = $('#bs-out', root);
      if (!ok(bill) || bill <= 0) { out.innerHTML = emptyHero('Each person pays', 'Enter the bill amount.'); return; }
      if (!ok(tip) || tip < 0 || tip > 100) { out.innerHTML = emptyHero('Each person pays', 'Enter a tip between 0 and 100%.'); return; }
      if (!ok(n) || n < 1) { out.innerHTML = emptyHero('Each person pays', 'Enter at least 1 person.'); return; }
      var tipAmt = bill * tip / 100, taxAmt = bill * tax / 100, total = bill + tipAmt + taxAmt, each = total / n;
      var eachR = r ? Math.ceil(each / r - 1e-9) * r : each, collected = eachR * n, extra = collected - total;
      out.innerHTML = hero('Each person pays', INR(eachR, r ? 0 : 2), '<span>' + plural(n, 'person') + ' · total <b>' + INR(total, 2) + '</b></span>' + (r && extra > 0.004 ? '<span>Extra collected <b>' + INR(extra, 2) + '</b> (add to tip)</span>' : '')) +
        card('', stats([['Bill', INR(bill, 2)], ['Tip (' + BT.fmtNum(tip) + '%)', INR(tipAmt, 2), 'var(--ok)'], tax ? ['Tax (' + BT.fmtNum(tax) + '%)', INR(taxAmt, 2)] : null, ['Grand total', INR(total, 2)], ['Exact share', INR(each, 2)], ['Tip per person', INR(tipAmt / n, 2)]])) +
        card('Quick split for other group sizes', table(['People', 'Each pays (exact)', r ? 'Rounded' : ''], [2, 3, 4, 5, 6, 8, 10, 12].map(function (k) {
          var e = total / k;
          return { cls: k === n ? 'cx-hl' : '', cells: [String(k), INR(e, 2), r ? INR(Math.ceil(e / r - 1e-9) * r) : ''] };
        })));
    }
    wire(root, update);
  });

  // ======================================================== Number to words
  var ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function w2(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : ''); }
  function w3(n) { var h = Math.floor(n / 100), r = n % 100; return (h ? ONES[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? w2(r) : ''); }
  function indianWords(n) {
    if (n === 0) return 'Zero';
    var parts = [], crore = Math.floor(n / 1e7), rest = n % 1e7;
    if (crore) parts.push(indianWords(crore) + ' Crore');
    var lakh = Math.floor(rest / 1e5), th = Math.floor(rest % 1e5 / 1000), h = rest % 1000;
    if (lakh) parts.push(w2(lakh) + ' Lakh');
    if (th) parts.push(w2(th) + ' Thousand');
    if (h) parts.push(w3(h));
    return parts.join(' ');
  }
  function intlWords(n) {
    if (n === 0) return 'Zero';
    var scales = ['', ' Thousand', ' Million', ' Billion', ' Trillion'], parts = [], i = 0;
    while (n > 0) { var g = n % 1000; if (g) parts.unshift(w3(g) + scales[i]); n = Math.floor(n / 1000); i++; }
    return parts.join(' ');
  }
  BT.impl('number-to-words', function (root) {
    root.innerHTML = '<div class="card">' + F({ id: 'nw-in', label: 'Number or amount', value: '12,34,567.50', hint: 'Up to 15 digits before the decimal point (99,99,99,99,99,999.99 and more). Commas are ignored.' }) +
      '<div class="fx-row" style="display:flex;flex-wrap:wrap;gap:12px;align-items:center">' + Seg('nw-case', [['title', 'Title Case'], ['upper', 'UPPERCASE'], ['lower', 'lowercase'], ['sentence', 'Sentence case']], 'title', 'Letter case') + '</div></div>' +
      '<div id="nw-out" class="cx-stack cx-mt"></div>';
    var outs = [];
    function caseIt(s) {
      var c = segVal(root, 'nw-case');
      if (c === 'upper') return s.toUpperCase();
      if (c === 'lower') return s.toLowerCase();
      if (c === 'sentence') { s = s.toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); }
      return s;
    }
    function block(title, text, i) {
      return '<div class="card"><div class="cx-copyrow"><span class="label">' + title + '</span><button type="button" class="btn btn-sm" data-copy="' + i + '">' + BT.icon('copy') + ' Copy</button></div><div class="output cx-big-out">' + esc(text) + '</div></div>';
    }
    function update() {
      var raw = $('#nw-in', root).value.replace(/[,\s₹]/g, ''), out = $('#nw-out', root);
      outs = [];
      if (!raw) { out.innerHTML = notice('', 'Type a number to see it in words.'); return; }
      var m = /^(-)?(\d*)(?:\.(\d*))?$/.exec(raw);
      if (!m || (!m[2] && !m[3])) { out.innerHTML = notice('error', 'Please enter a valid number, e.g. 125000.75'); return; }
      var neg = !!m[1], ip = (m[2] || '0').replace(/^0+(?=\d)/, ''), fp = m[3] || '';
      if (ip.length > 15) { out.innerHTML = notice('error', 'That number is too large. Please use up to 15 digits before the decimal point.'); return; }
      var intN = Number(ip);
      var paise = fp ? Math.round(Number('0.' + fp) * 100) : 0;
      if (paise === 100) { intN += 1; paise = 0; }
      var minus = neg ? 'Minus ' : '';
      var ind = minus + indianWords(intN), intl = minus + intlWords(intN);
      var dec = fp ? ' Point ' + fp.split('').map(function (d) { return d === '0' ? 'Zero' : ONES[+d]; }).join(' ') : '';
      var cheque = 'Rupees ' + indianWords(intN) + (paise ? ' and ' + w2(paise) + ' Paise' : '') + ' Only';
      var chequeIntl = indianWords(intN) === 'Zero' && paise ? 'Rupees Zero and ' + w2(paise) + ' Paise Only' : cheque;
      outs = [caseIt(chequeIntl), caseIt(ind + dec), caseIt(intl + dec), caseIt(intl + (paise ? ' and ' + pad(paise) + '/100' : '') + ' Only')];
      var digitsIN = Number(ip).toLocaleString('en-IN'), digitsUS = Number(ip).toLocaleString('en-US');
      out.innerHTML = (neg ? notice('warn', 'Cheques and invoices cannot carry negative amounts; the cheque format ignores the minus sign.') : '') +
        block('Cheque / invoice format (₹)', outs[0], 0) +
        block('Indian system (lakh, crore)', outs[1], 1) +
        block('International system (million, billion)', outs[2], 2) +
        block('International currency style', outs[3], 3) +
        card('', stats([['Indian grouping', (neg ? '-' : '') + digitsIN + (fp ? '.' + esc(fp) : '')], ['International grouping', (neg ? '-' : '') + digitsUS + (fp ? '.' + esc(fp) : '')], ['Digits', String(ip.length)]]));
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-copy]');
      if (b) BT.copy(outs[+b.getAttribute('data-copy')] || '');
    });
    wire(root, update);
  });

  // ======================================================== Roman numerals
  var ROMAN = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  function toRoman(n) { var s = '', parts = []; ROMAN.forEach(function (r) { while (n >= r[0]) { s += r[1]; parts.push(r); n -= r[0]; } }); return { s: s, parts: parts }; }
  function fromRoman(s) {
    s = s.toUpperCase().trim();
    if (!s || !/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(s)) return null;
    var map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }, t = 0;
    for (var i = 0; i < s.length; i++) { var v = map[s[i]], nx = map[s[i + 1]] || 0; t += v < nx ? -v : v; }
    return t;
  }
  BT.impl('roman-numeral-converter', function (root) {
    root.innerHTML = layout(
      card('Convert', F({ id: 'rn-n', label: 'Number (1 – 3999)', value: '2026', mode: 'numeric' }) +
        F({ id: 'rn-r', label: 'Roman numeral', value: 'MMXXVI', attrs: ' style="text-transform:uppercase;font-family:var(--mono);letter-spacing:.06em"' }) +
        '<div id="rn-msg"></div>'),
      '<div id="rn-out"></div>',
      card('Reference', table(['Symbol', 'Value', 'Symbol', 'Value'], [['I', '1', 'IV', '4'], ['V', '5', 'IX', '9'], ['X', '10', 'XL', '40'], ['L', '50', 'XC', '90'], ['C', '100', 'CD', '400'], ['D', '500', 'CM', '900'], ['M', '1000', '', '']].map(function (r) {
        return ['<b class="mono">' + r[0] + '</b>', r[1], '<b class="mono">' + r[2] + '</b>', r[3]];
      }), 9))
    );
    injectStyle();
    wire(root, null);
    var NI = $('#rn-n', root), RI = $('#rn-r', root), msg = $('#rn-msg', root), out = $('#rn-out', root);
    function show(n, r) {
      var t = toRoman(n);
      out.innerHTML = hero(N(n, 0) + ' in Roman numerals', '<span class="mono">' + t.s + '</span>', '<span>' + t.s.length + ' characters</span>') +
        card('Breakdown', table(['Part', 'Numeral', 'Value'], t.parts.reduce(function (acc, p) {
          var last = acc[acc.length - 1];
          if (last && last.sym === p[1]) { last.count++; } else acc.push({ sym: p[1], val: p[0], count: 1 });
          return acc;
        }, []).map(function (g) { return [String(g.val * g.count), '<b class="mono">' + g.sym.repeat(g.count) + '</b>', g.count > 1 ? g.count + ' × ' + g.val : String(g.val)]; }), 2)) +
        '<div class="btn-group"><button type="button" class="btn btn-sm" id="rn-copy">' + BT.icon('copy') + ' Copy ' + t.s + '</button></div>';
      $('#rn-copy', root).addEventListener('click', function () { BT.copy(t.s); });
    }
    function fromNum() {
      var n = num(NI.value);
      if (!ok(n) || Math.floor(n) !== n || n < 1 || n > 3999) {
        RI.value = ''; out.innerHTML = '';
        msg.innerHTML = NI.value.trim() ? notice('error', 'Enter a whole number from 1 to 3999. (Standard Roman numerals have no zero or negatives.)') : '';
        return;
      }
      msg.innerHTML = '';
      RI.value = toRoman(n).s;
      show(n);
    }
    function fromRom() {
      var v = RI.value.trim();
      var n = fromRoman(v);
      if (n == null) {
        out.innerHTML = '';
        msg.innerHTML = v ? notice('error', '“' + esc(v.toUpperCase()) + '” is not a valid Roman numeral. Use I, V, X, L, C, D, M in standard form (e.g. IV not IIII, XC not LXXXX).') : '';
        NI.value = '';
        return;
      }
      msg.innerHTML = '';
      NI.value = n;
      show(n);
    }
    NI.addEventListener('input', fromNum);
    RI.addEventListener('input', fromRom);
    fromNum();
  });

  // ===================================================== Number base converter
  var DIG = '0123456789abcdefghijklmnopqrstuvwxyz';
  function parseBig(str, base) {
    var s = String(str).trim().replace(/[\s_,]/g, '').toLowerCase();
    var neg = false;
    if (s[0] === '-') { neg = true; s = s.slice(1); } else if (s[0] === '+') s = s.slice(1);
    if (base === 16) s = s.replace(/^0x/, ''); else if (base === 2) s = s.replace(/^0b/, ''); else if (base === 8) s = s.replace(/^0o/, '');
    if (!s) throw new Error('empty');
    var B = BigInt(base), v = BigInt(0);
    for (var i = 0; i < s.length; i++) {
      var d = DIG.indexOf(s[i]);
      if (d < 0 || d >= base) throw new Error('“' + s[i] + '” is not a valid base-' + base + ' digit');
      v = v * B + BigInt(d);
    }
    return neg ? -v : v;
  }
  function groupStr(s, n, sep) {
    var neg = s[0] === '-'; if (neg) s = s.slice(1);
    var out = '';
    while (s.length > n) { out = sep + s.slice(-n) + out; s = s.slice(0, -n); }
    return (neg ? '-' : '') + s + out;
  }
  BT.impl('number-base-converter', function (root) {
    var BASES = [['bin', 'Binary', 2, 'base 2'], ['oct', 'Octal', 8, 'base 8'], ['dec', 'Decimal', 10, 'base 10'], ['hex', 'Hexadecimal', 16, 'base 16']];
    function row(id, label, post) {
      return '<div class="field"><label for="nb-' + id + '">' + label + '</label><div class="input-group"><input type="text" class="mono" id="nb-' + id + '" autocomplete="off" spellcheck="false">' +
        '<span class="addon">' + post + '</span><button type="button" class="btn" data-copy="' + id + '" aria-label="Copy ' + label + '">' + BT.icon('copy') + '</button></div><div class="hint" id="nb-' + id + '-e" aria-live="polite"></div></div>';
    }
    root.innerHTML = '<div class="split"><div class="card">' + BASES.map(function (b) { return row(b[0], b[1], b[3]); }).join('') +
      '<div class="row cols-2" style="align-items:start"><div class="field"><label for="nb-cb">Custom base (2–36)</label><input type="text" inputmode="numeric" id="nb-cb" value="36"></div>' +
      '<div style="min-width:0">' + row('custom', 'Value in custom base', 'base <span id="nb-cbl">36</span>') + '</div></div>' +
      '<p class="cx-note">Works with arbitrarily large integers (BigInt). Prefixes 0x, 0b and 0o, spaces and underscores are accepted. Negative numbers use a leading minus.</p></div>' +
      '<div class="cx-col" id="nb-out"></div></div>';
    injectStyle();
    wire(root, null);
    var current = BigInt(255);
    function cb() { var b = Math.round(num($('#nb-cb', root).value)); return ok(b) && b >= 2 && b <= 36 ? b : null; }
    function render(skip) {
      BASES.forEach(function (b) { if (b[0] !== skip) $('#nb-' + b[0], root).value = current.toString(b[2]).toUpperCase(); $('#nb-' + b[0] + '-e', root).textContent = ''; });
      var base = cb();
      $('#nb-cbl', root).textContent = base || '?';
      if (skip !== 'custom') $('#nb-custom', root).value = base ? current.toString(base).toUpperCase() : '';
      $('#nb-custom-e', root).textContent = base ? '' : 'Choose a base from 2 to 36.';
      var abs = current < BigInt(0) ? -current : current, bin = abs.toString(2), bits = abs === BigInt(0) ? 1 : bin.length;
      var bytes = Math.ceil(bits / 8);
      $('#nb-out', root).innerHTML = hero('Decimal value', esc(groupStr(current.toString(10), 3, ',')), '<span>Hex <b class="mono">0x' + esc(current.toString(16).toUpperCase()) + '</b></span>') +
        card('Details', stats([['Bits needed', N(bits)], ['Bytes', N(bytes)], ['Digits (decimal)', N(abs.toString().length)], ['Even / odd', abs % BigInt(2) === BigInt(0) ? 'Even' : 'Odd']]) +
          '<div class="cx-mt"><span class="label">Binary, grouped in nibbles</span><div class="output">' + esc(groupStr((current < 0 ? '-' : '') + bin.padStart(Math.ceil(bin.length / 4) * 4, '0'), 4, ' ')) + '</div></div>');
    }
    BASES.concat([['custom']]).forEach(function (b) {
      var el = $('#nb-' + b[0], root);
      el.addEventListener('input', function () {
        var base = b[0] === 'custom' ? cb() : b[2];
        var err = $('#nb-' + b[0] + '-e', root);
        if (!base) return;
        if (!el.value.trim()) { err.textContent = ''; return; }
        try { current = parseBig(el.value, base); err.textContent = ''; err.style.color = ''; render(b[0]); }
        catch (e) { err.textContent = e.message === 'empty' ? 'Enter a number.' : e.message; err.style.color = 'var(--danger)'; }
      });
    });
    $('#nb-cb', root).addEventListener('input', function () { render(); });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-copy]');
      if (b) { var v = $('#nb-' + b.getAttribute('data-copy'), root).value; if (v) BT.copy(v); }
    });
    render();
  });

  // ============================================================ Statistics
  BT.impl('statistics-calculator', function (root) {
    root.innerHTML = '<div class="card"><div class="field"><label for="st-in">Numbers</label><textarea id="st-in" class="mono" spellcheck="false" style="min-height:120px" placeholder="Separate with commas, spaces or new lines">12, 15, 18, 22, 22, 25, 30, 31, 35, 42</textarea>' +
      '<div class="hint">Paste from a spreadsheet, list or CSV. Anything that is not a number is skipped.</div></div>' +
      '<div class="btn-group"><button type="button" class="btn btn-sm" id="st-sort">' + BT.icon('arrow-down-a-z') + ' Sort list</button><button type="button" class="btn btn-sm" id="st-clear">' + BT.icon('x') + ' Clear</button></div></div>' +
      '<div id="st-out" class="cx-stack cx-mt"></div>';
    function quant(s, q) { var pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos); return s[lo] + (s[hi] - s[lo]) * (pos - lo); }
    function parse() {
      var toks = $('#st-in', root).value.split(/[\s,;|\t]+/).filter(Boolean), nums = [], bad = [];
      toks.forEach(function (t) {
        var c = t.replace(/[₹$€£%]/g, '');
        var v = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(c) ? Number(c) : NaN;
        if (ok(v)) nums.push(v); else bad.push(t);
      });
      return { nums: nums, bad: bad };
    }
    $('#st-sort', root).addEventListener('click', function () {
      var p = parse(); $('#st-in', root).value = p.nums.slice().sort(function (a, b) { return a - b; }).join(', '); update();
    });
    $('#st-clear', root).addEventListener('click', function () { $('#st-in', root).value = ''; update(); $('#st-in', root).focus(); });
    function f(v) { return fmtSig(v, 10); }
    function update() {
      var p = parse(), a = p.nums, out = $('#st-out', root);
      if (!a.length) { out.innerHTML = notice('', 'Enter at least one number to see statistics.') + (p.bad.length ? notice('warn', 'Skipped: ' + esc(p.bad.slice(0, 10).join(', '))) : ''); return; }
      var n = a.length, s = a.slice().sort(function (x, y) { return x - y; });
      var sum = a.reduce(function (x, y) { return x + y; }, 0), mean = sum / n;
      var med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
      var freq = {}, maxF = 0;
      a.forEach(function (v) { freq[v] = (freq[v] || 0) + 1; if (freq[v] > maxF) maxF = freq[v]; });
      var modes = maxF > 1 ? Object.keys(freq).filter(function (k) { return freq[k] === maxF; }).map(Number).sort(function (x, y) { return x - y; }) : [];
      var ss = a.reduce(function (acc, v) { return acc + (v - mean) * (v - mean); }, 0);
      var pv = ss / n, sv = n > 1 ? ss / (n - 1) : NaN;
      var q1 = quant(s, 0.25), q3 = quant(s, 0.75);
      var allPos = a.every(function (v) { return v > 0; });
      var gm = allPos ? Math.exp(a.reduce(function (acc, v) { return acc + Math.log(v); }, 0) / n) : NaN;
      out.innerHTML = hero('Mean (average)', f(mean), '<span>Count <b>' + n + '</b></span><span>Sum <b>' + f(sum) + '</b></span><span>Median <b>' + f(med) + '</b></span>') +
        card('Central tendency', stats([['Count', N(n)], ['Sum', f(sum)], ['Mean', f(mean)], ['Median', f(med)], ['Mode', modes.length ? (modes.length > 5 ? modes.slice(0, 5).map(f).join(', ') + '…' : modes.map(f).join(', ')) + ' <span class="muted small">(×' + maxF + ')</span>' : 'No mode'], ['Geometric mean', allPos ? f(gm) : '—']])) +
        card('Spread', stats([['Minimum', f(s[0])], ['Maximum', f(s[n - 1])], ['Range', f(s[n - 1] - s[0])], ['Q1', f(q1)], ['Q3', f(q3)], ['IQR', f(q3 - q1)]])) +
        card('Variance & standard deviation', table(['Measure', 'Population (σ, N)', 'Sample (s, n − 1)'], [
          ['Variance', f(pv), n > 1 ? f(sv) : '—'],
          ['Standard deviation', f(Math.sqrt(pv)), n > 1 ? f(Math.sqrt(sv)) : '—'],
          ['Coefficient of variation', mean !== 0 ? f(Math.sqrt(pv) / Math.abs(mean) * 100) + '%' : '—', n > 1 && mean !== 0 ? f(Math.sqrt(sv) / Math.abs(mean) * 100) + '%' : '—']
        ]) + '<p class="cx-note">Use the sample figures when your numbers are a sample of a larger group. Quartiles use linear interpolation (inclusive method, like Excel QUARTILE.INC).</p>') +
        card('Sorted values', '<div class="output">' + esc(s.map(f).join(', ')) + '</div>') +
        (p.bad.length ? notice('warn', 'Skipped ' + p.bad.length + ' non-numeric item' + (p.bad.length > 1 ? 's' : '') + ': ' + esc(p.bad.slice(0, 10).join(', ')) + (p.bad.length > 10 ? '…' : '')) : '');
    }
    wire(root, update);
  });

  // ======================================================= Time zone converter
  var DEFAULT_ZONES = [
    ['Asia/Kolkata', 'India (IST)'], ['UTC', 'UTC'], ['Europe/London', 'London'], ['Europe/Berlin', 'Berlin'], ['Europe/Paris', 'Paris'],
    ['Asia/Dubai', 'Dubai'], ['Asia/Riyadh', 'Riyadh'], ['Asia/Karachi', 'Karachi'], ['Asia/Kathmandu', 'Kathmandu'], ['Asia/Dhaka', 'Dhaka'],
    ['Asia/Singapore', 'Singapore'], ['Asia/Hong_Kong', 'Hong Kong'], ['Asia/Shanghai', 'Shanghai'], ['Asia/Tokyo', 'Tokyo'], ['Australia/Sydney', 'Sydney'],
    ['America/New_York', 'New York'], ['America/Toronto', 'Toronto'], ['America/Chicago', 'Chicago'], ['America/Los_Angeles', 'Los Angeles']
  ];
  var fmtCache = {};
  function tzParts(tz, ms) {
    var f = fmtCache[tz] || (fmtCache[tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short' }));
    var o = {};
    f.formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = p.value; });
    return { y: +o.year, mo: +o.month, d: +o.day, h: (+o.hour) % 24, mi: +o.minute, s: +o.second, wd: o.weekday };
  }
  /** Offset of tz from UTC at instant ms, in minutes. */
  function tzOffset(tz, ms) {
    var p = tzParts(tz, ms);
    var asUTC = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s);
    return Math.round((asUTC - Math.floor(ms / 1000) * 1000) / 60000);
  }
  /** Wall-clock time in tz → UTC ms (iterates the offset to handle DST). */
  function zonedToUTC(y, mo, d, h, mi, tz) {
    var guess = Date.UTC(y, mo - 1, d, h, mi);
    var o1 = tzOffset(tz, guess), t = guess - o1 * 60000;
    var o2 = tzOffset(tz, t);
    if (o2 !== o1) t = guess - o2 * 60000;
    return t;
  }
  function validTZ(tz) { try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch (e) { return false; } }
  function offStr(min) { var s = min < 0 ? '−' : '+', a = Math.abs(min); return 'UTC' + s + pad(Math.floor(a / 60)) + ':' + pad(a % 60); }
  function cityName(tz) {
    for (var i = 0; i < DEFAULT_ZONES.length; i++) if (DEFAULT_ZONES[i][0] === tz) return DEFAULT_ZONES[i][1];
    return tz.split('/').pop().replace(/_/g, ' ');
  }
  BT.impl('time-zone-converter', function (root) {
    var all = [];
    try { if (Intl.supportedValuesOf) all = Intl.supportedValuesOf('timeZone'); } catch (e) { all = []; }
    if (all.indexOf('UTC') < 0) all = ['UTC'].concat(all);
    if (!all.length || all.length < 2) all = DEFAULT_ZONES.map(function (z) { return z[0]; });
    var extra = [];
    try { extra = JSON.parse(localStorage.getItem('bt-tz-extra') || '[]').filter(validTZ); } catch (e) { extra = []; }
    var srcOpts = DEFAULT_ZONES.map(function (z) { return [z[0], z[1] + ' — ' + z[0]]; });
    var others = all.filter(function (z) { return !DEFAULT_ZONES.some(function (d) { return d[0] === z; }); }).map(function (z) { return [z, z.replace(/_/g, ' ')]; });
    var now = Date.now(), p = tzParts('Asia/Kolkata', now);
    root.innerHTML = '<div class="card"><div class="row cols-3">' +
      F({ id: 'tz-date', label: 'Date', type: 'date', value: p.y + '-' + pad(p.mo) + '-' + pad(p.d) }) +
      F({ id: 'tz-time', label: 'Time', type: 'time', value: pad(p.h) + ':' + pad(p.mi) }) +
      '<div class="field"><label for="tz-src">From time zone</label><select id="tz-src"><optgroup label="Popular">' + srcOpts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === 'Asia/Kolkata' ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') +
      '</optgroup>' + (others.length ? '<optgroup label="All time zones">' + others.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('') + '</optgroup>' : '') + '</select></div></div>' +
      '<div class="toolbar" style="margin:0"><button type="button" class="btn btn-sm" id="tz-now">' + BT.icon('clock') + ' Now</button>' +
      '<span class="spacer"></span><label for="tz-add" class="sr-only">Add a time zone</label><input type="text" id="tz-add" list="tz-list" placeholder="Add a city or zone, e.g. Europe/Madrid" style="max-width:300px;min-height:34px;padding:6px 10px">' +
      '<datalist id="tz-list">' + all.map(function (z) { return '<option value="' + esc(z) + '">'; }).join('') + '</datalist>' +
      '<button type="button" class="btn btn-sm btn-primary" id="tz-addb">' + BT.icon('plus') + ' Add</button></div></div>' +
      '<div id="tz-out" class="cx-stack cx-mt"></div>';
    function save() { try { localStorage.setItem('bt-tz-extra', JSON.stringify(extra)); } catch (e) { /* ignore */ } }
    function addZone() {
      var inp = $('#tz-add', root), v = inp.value.trim();
      if (!v) return;
      var match = all.filter(function (z) { return z.toLowerCase() === v.toLowerCase() || z.toLowerCase().replace(/_/g, ' ').split('/').pop() === v.toLowerCase(); })[0] || v;
      if (!validTZ(match)) { BT.toast('Unknown time zone “' + v + '”', 'error'); return; }
      if (DEFAULT_ZONES.some(function (z) { return z[0] === match; }) || extra.indexOf(match) > -1) { BT.toast(cityName(match) + ' is already listed'); inp.value = ''; return; }
      extra.push(match); save(); inp.value = ''; update();
    }
    $('#tz-addb', root).addEventListener('click', addZone);
    $('#tz-add', root).addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addZone(); } });
    $('#tz-now', root).addEventListener('click', function () {
      var tz = $('#tz-src', root).value, q = tzParts(tz, Date.now());
      $('#tz-date', root).value = q.y + '-' + pad(q.mo) + '-' + pad(q.d);
      $('#tz-time', root).value = pad(q.h) + ':' + pad(q.mi);
      update();
    });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-rm]');
      if (!b) return;
      extra = extra.filter(function (z) { return z !== b.getAttribute('data-rm'); }); save(); update();
    });
    function update(e) {
      if (e && e.target && e.target.id === 'tz-add') return;
      var src = $('#tz-src', root).value, dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec($('#tz-date', root).value), tm = /^(\d{2}):(\d{2})/.exec($('#tz-time', root).value), out = $('#tz-out', root);
      if (!dm || !tm) { out.innerHTML = notice('warn', 'Pick a date and time.'); return; }
      var y = +dm[1], mo = +dm[2], d = +dm[3], h = +tm[1], mi = +tm[2];
      var t = zonedToUTC(y, mo, d, h, mi, src), back = tzParts(src, t);
      var gap = back.h !== h || back.mi !== mi;
      var srcOff = tzOffset(src, t), srcDay = Date.UTC(back.y, back.mo - 1, back.d);
      var zones = DEFAULT_ZONES.map(function (z) { return z[0]; }).concat(extra);
      if (zones.indexOf(src) < 0) zones.unshift(src);
      var cards = zones.map(function (z) {
        var q = tzParts(z, t), off = tzOffset(z, t), dd = Math.round((Date.UTC(q.y, q.mo - 1, q.d) - srcDay) / 864e5);
        var diff = off - srcOff, ad = Math.abs(diff), dh = Math.floor(ad / 60), dmn = ad % 60;
        var diffS = diff === 0 ? 'Same time' : (diff > 0 ? '+' : '−') + (dh ? dh + 'h' : '') + (dh && dmn ? ' ' : '') + (dmn ? dmn + 'm' : '');
        var h12 = (q.h % 12 || 12) + ':' + pad(q.mi) + ' ' + (q.h < 12 ? 'am' : 'pm');
        var day = q.h >= 6 && q.h < 18, work = q.h >= 9 && q.h < 18 && q.wd !== 'Sat' && q.wd !== 'Sun';
        var dateS = new Date(Date.UTC(q.y, q.mo - 1, q.d)).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
        return '<div class="cx-tzc' + (z === src ? ' src' : '') + '" data-zone="' + esc(z) + '"><div class="city">' + BT.icon(day ? 'sun' : 'moon') + esc(cityName(z)) + '</div>' +
          (extra.indexOf(z) > -1 ? '<button type="button" class="rm" data-rm="' + esc(z) + '" aria-label="Remove ' + esc(cityName(z)) + '">' + BT.icon('x') + '</button>' : '') +
          '<div class="t" data-time>' + pad(q.h) + ':' + pad(q.mi) + '<small>' + h12 + '</small></div>' +
          '<div class="m">' + esc(dateS) + (dd ? ' <span class="badge ' + (dd > 0 ? 'ok' : 'warn') + '">' + (dd > 0 ? '+' : '−') + Math.abs(dd) + ' day</span>' : '') + (work ? ' <span class="badge">Work hours</span>' : '') + '</div>' +
          '<div class="m">' + offStr(off) + ' · ' + (z === src ? 'Source' : diffS) + '</div></div>';
      }).join('');
      var u = tzParts('UTC', t);
      out.innerHTML = hero(esc(cityName(src)) + ' · ' + offStr(srcOff), pad(back.h) + ':' + pad(back.mi) + ' <span style="font-size:.5em;font-weight:700">' + esc(new Date(srcDay).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })) + '</span>',
        '<span>= <b>' + pad(u.h) + ':' + pad(u.mi) + ' UTC</b></span><span>' + esc(src) + '</span>') +
        (gap ? notice('warn', 'That local time does not exist in ' + esc(cityName(src)) + ' (clocks jump forward for daylight saving). Showing ' + pad(back.h) + ':' + pad(back.mi) + ' instead.') : '') +
        '<div class="cx-tz">' + cards + '</div>' +
        '<p class="cx-note">Times use your browser’s time-zone database and include daylight saving where it applies.</p>';
    }
    wire(root, update);
  });
})();
