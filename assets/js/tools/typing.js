/*
 * BISCS Tools — Typing Speed Test.
 * Timed test with live WPM, accuracy and per-character feedback. Runs fully
 * in the browser; the best score is kept in this browser only.
 */
(function () {
  'use strict';
  var BT = window.BT;
  var esc = BT.esc;

  var CSS = [
    '.ty-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:14px}',
    '.ty-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}',
    '@media(max-width:560px){.ty-stats{grid-template-columns:repeat(2,1fr)}}',
    '.ty-stat{border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface-2);padding:10px 12px}',
    '.ty-stat span{display:block;font-size:.75rem;font-weight:650;color:var(--text-3);text-transform:uppercase;letter-spacing:.04em}',
    '.ty-stat b{display:block;font-size:1.6rem;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1.2}',
    '.ty-text{font-family:var(--mono);font-size:clamp(1rem,2.4vw,1.2rem);line-height:1.9;padding:16px 18px;border:1px solid var(--border-strong);border-radius:var(--radius);background:var(--surface);max-height:12.2em;overflow:hidden;position:relative;word-break:break-word;user-select:none;cursor:text}',
    '.ty-text .ok{color:var(--ok)}',
    '.ty-text .bad{color:var(--danger);background:var(--danger-soft);border-radius:3px}',
    '.ty-text .cur{border-left:2px solid var(--brand);margin-left:-2px;animation:tyb 1s steps(1) infinite}',
    '.ty-text .todo{color:var(--text-2)}',
    '@keyframes tyb{50%{border-color:transparent}}',
    '@media(prefers-reduced-motion:reduce){.ty-text .cur{animation:none}}',
    '.ty-in{width:100%;margin-top:12px;font-family:var(--mono)}',
    '.ty-res{margin-top:16px}',
    '.ty-big{font-size:clamp(2.2rem,7vw,3.4rem);font-weight:800;letter-spacing:-.03em;line-height:1}',
    '.ty-hint{font-size:.85rem;color:var(--text-3);margin-top:8px}'
  ].join('\n');

  // Original practice passages written for this site.
  var PASSAGES = [
    'Good typing is not about speed alone. It is about keeping your eyes on the screen, your fingers on the home row and a steady rhythm from one word to the next. Speed comes naturally once accuracy becomes a habit, so slow down whenever you make a mistake and try again.',
    'Every morning the tea stall near the station opens before sunrise. The owner boils milk in a large steel pot, adds ginger and cardamom, and pours the tea into small clay cups. Office workers, students and taxi drivers stop for a few minutes before their busy day begins.',
    'A small business owner often wears many hats. In a single day she may answer customer calls, prepare invoices, check stock, pay suppliers and plan the next sale. Simple tools that save a few minutes on each task can add up to several hours every week.',
    'The monsoon brings relief from the summer heat, but it also brings traffic jams, flooded roads and power cuts. Many families keep candles, a torch and a charged power bank ready. Children, of course, simply enjoy jumping in the puddles and making paper boats.',
    'When you write an email at work, start with the main point, keep each paragraph short and end with a clear request. Read it once before you press send. A message that takes thirty seconds longer to check can save a long chain of confused replies later.',
    'Learning a new skill takes patience. At first every step feels slow and clumsy, and progress seems invisible. Then one day you notice that something which used to be difficult now feels easy. Practise a little every day, and the improvement will surprise you.',
    'Our planet has only one atmosphere, and we all share it. Planting trees, saving electricity, using public transport and carrying a cloth bag to the market are small choices. When millions of people make them together, they become a powerful force for change.',
    'Cricket in India is more than a sport. On match days, offices go quiet, shops turn on their radios and strangers discuss every ball as if they were old friends. A last over finish can make an entire city cheer or fall silent within a few seconds.',
    'Data entry jobs and many government exams test typing speed, so it is worth practising with a timer. Aim for accuracy above ninety five percent first. Once you can type without looking at the keyboard, increase your speed gradually by a few words each week.',
    'Reading regularly improves your vocabulary, your spelling and even your typing. When you know how a word is spelt, your fingers can find the keys without hesitation. Try reading a newspaper article each day and then typing a short summary of what you learnt.'
  ];

  function injectCSS() {
    if (document.getElementById('ty-css')) return;
    var s = document.createElement('style'); s.id = 'ty-css'; s.textContent = CSS; document.head.appendChild(s);
  }
  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
    return null;
  }

  BT.impl('typing-speed-test', function (root) {
    injectCSS();
    var S = { secs: 60, text: '', typed: '', started: 0, timer: null, done: false, idx: -1, keys: 0, errs: 0 };
    root.innerHTML =
      '<div class="card">' +
        '<div class="ty-bar">' +
          '<div class="seg" id="ty-dur" role="group" aria-label="Test length">' +
            [[60, '1 min'], [120, '2 min'], [300, '5 min']].map(function (o) {
              return '<button type="button" data-v="' + o[0] + '" class="' + (o[0] === 60 ? 'active' : '') + '" aria-pressed="' + (o[0] === 60) + '">' + o[1] + '</button>';
            }).join('') + '</div>' +
          '<div class="btn-group"><button type="button" class="btn btn-sm" id="ty-new">' + BT.icon('shuffle') + ' New text</button>' +
          '<button type="button" class="btn btn-sm" id="ty-restart">' + BT.icon('rotate-ccw') + ' Restart</button></div>' +
        '</div>' +
        '<div class="ty-stats" aria-live="off">' +
          '<div class="ty-stat"><span>Time left</span><b id="ty-time">1:00</b></div>' +
          '<div class="ty-stat"><span>WPM</span><b id="ty-wpm">0</b></div>' +
          '<div class="ty-stat"><span>Accuracy</span><b id="ty-acc">100%</b></div>' +
          '<div class="ty-stat"><span>Best</span><b id="ty-best">–</b></div>' +
        '</div>' +
        '<div class="ty-text" id="ty-text" aria-hidden="true"></div>' +
        '<label class="sr-only" for="ty-in">Type the text shown above</label>' +
        '<textarea id="ty-in" class="ty-in" rows="3" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Start typing here. The timer starts with your first key."></textarea>' +
        '<p class="ty-hint" id="ty-passage-sr"></p>' +
        '<div class="ty-res" id="ty-res" aria-live="polite"></div>' +
      '</div>';

    var $ = function (s) { return root.querySelector(s); };
    var textEl = $('#ty-text'), inEl = $('#ty-in'), res = $('#ty-res');
    var best = Number(store('bt-typing-best') || 0);
    if (best) $('#ty-best').textContent = best;

    function pick() {
      var i;
      do { i = Math.floor(Math.random() * PASSAGES.length); } while (i === S.idx && PASSAGES.length > 1);
      S.idx = i;
      // Long tests chain several passages so nobody runs out of text.
      var parts = [PASSAGES[i]], j = i;
      while (parts.join(' ').length < S.secs * 14) { j = (j + 1) % PASSAGES.length; parts.push(PASSAGES[j]); }
      S.text = parts.join(' ');
    }
    function fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
    function counts() {
      var correct = 0, t = S.typed;
      for (var k = 0; k < t.length; k++) if (t[k] === S.text[k]) correct++;
      return { correct: correct, wrong: t.length - correct, total: t.length };
    }
    function elapsed() { return S.started ? Math.min(S.secs, (Date.now() - S.started) / 1000) : 0; }
    function stats() {
      var c = counts(), mins = Math.max(elapsed(), S.done ? 1 : 3) / 60;
      return {
        net: Math.max(0, Math.round(c.correct / 5 / mins)),
        gross: Math.round(c.total / 5 / mins),
        acc: S.keys ? Math.max(0, Math.round((S.keys - S.errs) / S.keys * 100)) : 100,
        c: c
      };
    }
    function paint() {
      var t = S.typed, txt = S.text, html = '';
      var end = Math.min(txt.length, t.length + 400);
      for (var k = 0; k < end; k++) {
        var ch = esc(txt[k]);
        if (k < t.length) html += '<span class="' + (t[k] === txt[k] ? 'ok' : 'bad') + '">' + ch + '</span>';
        else if (k === t.length) html += '<span class="cur todo">' + ch + '</span>';
        else html += ch;
      }
      textEl.innerHTML = '<span class="todo">' + html + '</span>';
      // Keep the cursor line in view.
      var cur = textEl.querySelector('.cur');
      if (cur) textEl.scrollTop = Math.max(0, cur.offsetTop - textEl.clientHeight / 3);
      var s = stats();
      $('#ty-wpm').textContent = s.net;
      $('#ty-acc').textContent = s.acc + '%';
      $('#ty-time').textContent = fmt(S.secs - elapsed());
    }
    function reset(newText) {
      clearInterval(S.timer); S.timer = null;
      if (newText || !S.text) pick();
      S.typed = ''; S.started = 0; S.done = false; S.keys = 0; S.errs = 0;
      inEl.value = ''; inEl.disabled = false; res.innerHTML = '';
      $('#ty-passage-sr').textContent = 'Text to type: ' + S.text.slice(0, 300) + (S.text.length > 300 ? '…' : '');
      paint();
    }
    function finish() {
      if (S.done) return;
      S.done = true; clearInterval(S.timer); S.timer = null; inEl.disabled = true;
      paint();
      var s = stats(), took = elapsed();
      var isBest = s.net > best;
      if (isBest) { best = s.net; store('bt-typing-best', String(best)); $('#ty-best').textContent = best; }
      var level = s.net < 25 ? 'Beginner: focus on accuracy and the home row.' : s.net < 40 ? 'Average: steady practice will push you past 40 WPM.' :
        s.net < 60 ? 'Good: faster than most people.' : s.net < 80 ? 'Excellent: a professional typing speed.' : 'Outstanding: you type faster than almost everyone.';
      res.innerHTML = '<div class="notice ok">' + BT.icon('trophy') + '<span><span class="ty-big">' + s.net + ' WPM</span><br>' +
        '<b>' + s.acc + '%</b> accuracy · ' + s.gross + ' gross WPM · ' + s.c.correct + ' correct and ' + s.c.wrong + ' wrong characters in ' + fmt(took) +
        (isBest ? ' · <b>New personal best!</b>' : '') + '<br>' + esc(level) + '</span></div>' +
        '<p class="ty-hint">Net WPM counts only correct characters (5 characters = 1 word). Gross WPM counts everything you typed. Press Restart to try the same text again.</p>';
      $('#ty-restart').focus();
    }
    inEl.addEventListener('input', function () {
      if (S.done) return;
      var v = inEl.value.replace(/\r?\n/g, ' ');
      if (v.length > S.typed.length) {
        // Count every new keystroke for accuracy, even if later corrected.
        for (var k = S.typed.length; k < v.length; k++) { S.keys++; if (v[k] !== S.text[k]) S.errs++; }
      }
      S.typed = v.slice(0, S.text.length);
      if (!S.started && S.typed.length) {
        S.started = Date.now();
        S.timer = setInterval(function () { if (elapsed() >= S.secs) finish(); else paint(); }, 250);
      }
      paint();
      if (S.typed.length >= S.text.length) finish();
    });
    inEl.addEventListener('paste', function (e) { e.preventDefault(); BT.toast('Pasting is turned off during the test', 'error'); });
    textEl.addEventListener('click', function () { inEl.focus(); });
    $('#ty-dur').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      root.querySelectorAll('#ty-dur button').forEach(function (x) { var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on); });
      S.secs = Number(b.getAttribute('data-v')); reset(true); inEl.focus();
    });
    $('#ty-new').addEventListener('click', function () { reset(true); inEl.focus(); });
    $('#ty-restart').addEventListener('click', function () { reset(false); inEl.focus(); });
    reset(true);
  });
})();
