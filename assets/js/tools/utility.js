/*
 * BISCS Tools — Generators & utilities.
 * Passwords, QR codes, barcodes, random numbers, coin/dice, pickers,
 * stopwatch/timer, GST invoice and signature maker. All client-side.
 */
(function () {
  'use strict';
  var BT = window.BT;
  var doc = document;
  var h = BT.h, esc = BT.esc;
  var IMPLS = {};
  /** Register with core (and remember for the late-boot rescue at the end). */
  function register(id, fn) { IMPLS[id] = fn; BT.impl(id, fn); }

  // =================================================================== CSS
  var CSS = [
    '.ut-out{display:flex;align-items:center;gap:8px;padding:10px 10px 10px 16px;border:1px solid var(--border-strong);border-radius:var(--radius);background:var(--surface-2)}',
    '.ut-out .pw{flex:1;min-width:0;font-family:var(--mono);font-size:clamp(1rem,2.6vw,1.35rem);font-weight:600;word-break:break-all;line-height:1.4;letter-spacing:.02em}',
    '.ut-out .pw .d{color:#0090ff}.ut-out .pw .s{color:#e5484d}',
    '.ut-meter{height:8px;border-radius:99px;background:var(--surface-2);border:1px solid var(--border);overflow:hidden;margin-top:12px}',
    '.ut-meter span{display:block;height:100%;width:0;border-radius:99px;transition:width .3s,background .3s}',
    '.ut-mrow{display:flex;justify-content:space-between;gap:8px;margin-top:6px;font-size:.85rem;font-weight:600}',
    '.ut-list{display:flex;flex-direction:column;gap:6px;margin-top:14px;max-height:360px;overflow:auto}',
    '.ut-list .ut-li{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 12px;border:1px solid var(--border);border-radius:10px;background:var(--surface)}',
    '.ut-list .ut-li code{flex:1;min-width:0;font-family:var(--mono);font-size:.88rem;word-break:break-all}',
    '.ut-range{display:flex;align-items:center;gap:10px}.ut-range input[type=range]{flex:1}.ut-range input[type=number]{width:84px;flex:none}',
    '.ut-range .v{min-width:48px;text-align:right;font-weight:600;font-size:.88rem;color:var(--text-2);font-variant-numeric:tabular-nums}',
    '.ut-checks{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px 16px;margin-bottom:14px}',
    '.ut-seg{display:flex;width:100%}.ut-seg button{flex:1}',
    '.ut-wrap button{flex:1 0 23%;white-space:nowrap;padding:7px 8px}',
    '.ut-checklist{list-style:none;margin:0;padding:0;display:grid;gap:8px}',
    '.ut-checklist li{display:flex;gap:10px;align-items:flex-start;font-size:.92rem}',
    '.ut-checklist li .i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;flex:none;font-size:.8rem;font-weight:800}',
    '.ut-checklist li.ok .i{background:var(--ok-soft);color:var(--ok)}.ut-checklist li.bad .i{background:var(--danger-soft);color:var(--danger)}',
    '.ut-big{font-size:clamp(1.6rem,5vw,2.6rem);font-weight:800;letter-spacing:-.03em;line-height:1.1}',
    '.ut-qr{display:grid;place-items:center;padding:18px;border-radius:var(--radius);background:repeating-conic-gradient(var(--surface-2) 0% 25%,var(--surface) 0% 50%) 50%/20px 20px;border:1px solid var(--border);min-height:280px}',
    '.ut-qr canvas,.ut-qr svg{max-width:100%;height:auto;box-shadow:0 10px 30px -14px rgba(0,0,0,.45);border-radius:6px}',
    '.ut-payload{font-family:var(--mono);font-size:.78rem;color:var(--text-3);word-break:break-all;max-height:90px;overflow:auto;margin-top:10px}',
    '.ut-err{margin-top:10px}',
    // random numbers
    '.ut-nums{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}',
    '.ut-nums span{min-width:56px;padding:10px 14px;border-radius:12px;background:var(--surface);border:1px solid var(--border);font-weight:750;font-size:1.15rem;text-align:center;font-variant-numeric:tabular-nums;animation:utpop .35s cubic-bezier(.2,.8,.2,1) both}',
    '@keyframes utpop{from{transform:scale(.6);opacity:0}}',
    '.ut-hero{display:grid;place-items:center;gap:14px;padding:26px 16px;border-radius:var(--radius-lg);background:radial-gradient(500px 220px at 50% 0%,color-mix(in srgb,#d6409f 14%,transparent),transparent 70%),var(--surface);border:1px solid var(--border);text-align:center;min-height:200px}',
    '.ut-hero .n{font-size:clamp(3rem,12vw,5.5rem);font-weight:850;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums;background:linear-gradient(135deg,#d6409f,#7c3aed);-webkit-background-clip:text;background-clip:text;color:transparent}',
    // coin
    '.ut-stage3d{perspective:900px;display:grid;place-items:center;min-height:230px}',
    '.ut-coin-wrap{width:170px;height:170px}',
    '.ut-coin-wrap.toss{animation:uttoss 1.6s cubic-bezier(.3,.1,.3,1)}',
    '@keyframes uttoss{0%{transform:translateY(0) scale(1)}45%{transform:translateY(-90px) scale(1.15)}100%{transform:translateY(0) scale(1)}}',
    '.ut-coin{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform 1.6s cubic-bezier(.2,.7,.25,1)}',
    '.ut-coin .face{position:absolute;inset:0;border-radius:50%;display:grid;place-items:center;backface-visibility:hidden;-webkit-backface-visibility:hidden;font-weight:850;color:#7a4a00;text-shadow:0 1px 0 rgba(255,255,255,.5);',
    'background:radial-gradient(circle at 35% 30%,#fff6c8,#f7c948 38%,#d99a06 72%,#a66d00);box-shadow:inset 0 0 0 7px rgba(166,109,0,.55),inset 0 0 0 11px rgba(255,236,170,.6),0 12px 30px -10px rgba(0,0,0,.5)}',
    '.ut-coin .face b{font-size:3.6rem;line-height:1}.ut-coin .face small{display:block;font-size:.8rem;letter-spacing:.2em;margin-top:2px}',
    '.ut-coin .face div{text-align:center}',
    '.ut-coin .tails{transform:rotateY(180deg);background:radial-gradient(circle at 35% 30%,#f4f4f5,#c9cbd1 40%,#9ea3ad 75%,#6b7280);color:#374151;box-shadow:inset 0 0 0 7px rgba(75,85,99,.45),inset 0 0 0 11px rgba(255,255,255,.55),0 12px 30px -10px rgba(0,0,0,.5)}',
    // dice
    '.ut-dice{display:flex;flex-wrap:wrap;gap:26px;justify-content:center;padding:20px 0;perspective:900px;min-height:150px}',
    '.ut-die{--s:74px;width:var(--s);height:var(--s);position:relative;transform-style:preserve-3d;transition:transform 1.2s cubic-bezier(.2,.75,.25,1)}',
    '.ut-die .f{position:absolute;inset:0;border-radius:14px;background:linear-gradient(145deg,#ffffff,#e9e9f1);box-shadow:inset 0 0 0 1px rgba(0,0,0,.08),inset 0 -4px 10px rgba(0,0,0,.08);display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);padding:12%;backface-visibility:hidden;-webkit-backface-visibility:hidden}',
    '.ut-die .f i{width:72%;height:72%;margin:auto;border-radius:50%;background:radial-gradient(circle at 35% 35%,#444,#0f1424);visibility:hidden}',
    '.ut-die .f1{transform:translateZ(calc(var(--s)/2))}.ut-die .f6{transform:rotateY(180deg) translateZ(calc(var(--s)/2))}',
    '.ut-die .f3{transform:rotateY(90deg) translateZ(calc(var(--s)/2))}.ut-die .f4{transform:rotateY(-90deg) translateZ(calc(var(--s)/2))}',
    '.ut-die .f2{transform:rotateX(90deg) translateZ(calc(var(--s)/2))}.ut-die .f5{transform:rotateX(-90deg) translateZ(calc(var(--s)/2))}',
    '.ut-die .f1 i:nth-child(5){visibility:visible;background:radial-gradient(circle at 35% 35%,#ff6b6b,#c81e1e)}',
    '.ut-die .f2 i:nth-child(1),.ut-die .f2 i:nth-child(9){visibility:visible}',
    '.ut-die .f3 i:nth-child(1),.ut-die .f3 i:nth-child(5),.ut-die .f3 i:nth-child(9){visibility:visible}',
    '.ut-die .f4 i:nth-child(1),.ut-die .f4 i:nth-child(3),.ut-die .f4 i:nth-child(7),.ut-die .f4 i:nth-child(9){visibility:visible}',
    '.ut-die .f5 i:nth-child(1),.ut-die .f5 i:nth-child(3),.ut-die .f5 i:nth-child(5),.ut-die .f5 i:nth-child(7),.ut-die .f5 i:nth-child(9){visibility:visible}',
    '.ut-die .f6 i:nth-child(1),.ut-die .f6 i:nth-child(3),.ut-die .f6 i:nth-child(4),.ut-die .f6 i:nth-child(6),.ut-die .f6 i:nth-child(7),.ut-die .f6 i:nth-child(9){visibility:visible}',
    '.ut-hist{display:flex;flex-wrap:wrap;gap:6px}',
    '.ut-hist span{display:inline-grid;place-items:center;min-width:30px;height:30px;padding:0 8px;border-radius:8px;background:var(--surface-2);border:1px solid var(--border);font-weight:700;font-size:.82rem}',
    '.ut-hist span.h{background:#fff3c4;color:#7a4a00;border-color:#f7c948}.ut-hist span.t{background:#e5e7eb;color:#374151;border-color:#c9cbd1}',
    // picker
    '.ut-reel{font-size:clamp(1.8rem,6vw,3rem);font-weight:850;letter-spacing:-.03em;text-align:center;min-height:1.3em;word-break:break-word}',
    '.ut-reel.spin{opacity:.75;filter:blur(.4px)}',
    '.ut-winners{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:16px}',
    '.ut-winners .w{display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;background:var(--surface);border:1px solid var(--border);font-weight:650;box-shadow:var(--shadow-sm);animation:utpop .4s cubic-bezier(.2,.8,.2,1) both}',
    '.ut-winners .w i{font-style:normal;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#d6409f,#7c3aed);color:#fff;font-size:.75rem;font-weight:800}',
    '.ut-teams{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-top:16px}',
    '.ut-team{border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;background:var(--surface);animation:utpop .4s both}',
    '.ut-team h4{margin:0;padding:10px 14px;color:#fff;font-size:.95rem;display:flex;justify-content:space-between}',
    '.ut-team ol{margin:0;padding:10px 14px 12px 34px}.ut-team li{padding:2px 0}',
    // stopwatch
    '.ut-clock{font-family:var(--mono);font-size:clamp(2.6rem,10vw,5.2rem);font-weight:700;letter-spacing:-.04em;text-align:center;font-variant-numeric:tabular-nums;line-height:1.1}',
    '.ut-clock small{font-size:.5em;color:var(--text-3)}',
    '.ut-ring{position:relative;width:min(300px,78vw);aspect-ratio:1;margin:0 auto}',
    '.ut-ring svg{width:100%;height:100%;transform:rotate(-90deg)}',
    '.ut-ring .c{position:absolute;inset:0;display:grid;place-items:center;text-align:center}',
    '.ut-ring .c .ut-clock{font-size:clamp(2.2rem,9vw,3.6rem)}',
    '.ut-ctrl{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:18px}',
    '.ut-ctrl .btn{min-width:120px}',
    '.ut-hms{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:380px;margin:0 auto}',
    '.ut-hms input{text-align:center;font-size:1.3rem;font-weight:700;font-family:var(--mono)}',
    '.ut-laps td.best{color:var(--ok);font-weight:700}.ut-laps td.worst{color:var(--danger);font-weight:700}',
    '.ut-phase{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;font-weight:700;font-size:.85rem}',
    '.ut-dots{display:flex;gap:6px;justify-content:center;margin-top:10px}.ut-dots i{width:10px;height:10px;border-radius:50%;background:var(--border-strong)}.ut-dots i.on{background:#e5484d}',
    // signature
    '.ut-sigpad{position:relative;border:1px solid var(--border-strong);border-radius:var(--radius);background:#fff;overflow:hidden;touch-action:none}',
    '.ut-sigpad canvas{display:block;width:100%;height:240px;cursor:crosshair;touch-action:none}',
    '.ut-sigpad .line{position:absolute;left:8%;right:8%;bottom:56px;border-bottom:1.5px dashed #c5c9d6;pointer-events:none}',
    '.ut-sigpad .ph{position:absolute;left:0;right:0;bottom:24px;text-align:center;color:#9aa0b4;font-size:.85rem;pointer-events:none}',
    '.ut-fonts{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}',
    '.ut-fonts button{border:2px solid var(--border);background:#fff;color:#111;border-radius:12px;padding:12px 14px;cursor:pointer;text-align:left;min-height:86px;display:flex;flex-direction:column;justify-content:space-between;gap:4px;overflow:hidden}',
    '.ut-fonts button span{font-size:2rem;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.ut-fonts button small{font:600 .72rem var(--font);color:#6b7280}',
    '.ut-fonts button.active{border-color:var(--brand);box-shadow:var(--ring)}',
    '.ut-swatches{display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
    '.ut-swatches button{width:34px;height:34px;border-radius:50%;border:2px solid var(--surface);box-shadow:0 0 0 1px var(--border-strong);cursor:pointer}',
    '.ut-swatches button.active{box-shadow:0 0 0 2px var(--brand)}',
    '.ut-barcode{display:grid;place-items:center;padding:20px;border-radius:var(--radius);background:repeating-conic-gradient(var(--surface-2) 0% 25%,var(--surface) 0% 50%) 50%/20px 20px;border:1px solid var(--border);min-height:200px;overflow:auto}',
    '.ut-barcode svg{max-width:100%;height:auto}'
  ].join('\n');
  function injectCSS() {
    if (doc.getElementById('ut-style')) return;
    var s = doc.createElement('style');
    s.id = 'ut-style';
    s.textContent = CSS;
    doc.head.appendChild(s);
  }

  // ============================================================ Helpers
  var uid = 0;
  function nid(p) { uid++; return 'ut-' + (p || 'f') + uid; }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  // ---- crypto randomness
  var cryptoObj = window.crypto || window.msCrypto;
  function u32() { var a = new Uint32Array(1); cryptoObj.getRandomValues(a); return a[0]; }
  /** Uniform integer in [0, n) via rejection sampling (no modulo bias). Supports n up to 2^53. */
  function randInt(n) {
    n = Math.floor(n);
    if (n <= 1) return 0;
    if (n <= 0x100000000) {
      var lim = Math.floor(0x100000000 / n) * n, x;
      do { x = u32(); } while (x >= lim);
      return x % n;
    }
    var TWO53 = 9007199254740992, lim2 = Math.floor(TWO53 / n) * n, y;
    do { y = (u32() & 0x1fffff) * 0x100000000 + u32(); } while (y >= lim2);
    return y % n;
  }
  /** Uniform float in [0, 1) with 53 bits of randomness. */
  function randFloat() { return ((u32() & 0x1fffff) * 0x100000000 + u32()) / 9007199254740992; }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) { var j = randInt(i + 1), t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  }
  BT.secureRandom = { randInt: randInt, randFloat: randFloat, shuffle: shuffle };

  // ---- UI helpers
  function field(label, control, hint) {
    if (!control.id) control.id = nid();
    return h('div.field', null, [h('label', { 'for': control.id, text: label }), control, hint ? h('span.hint', { html: hint }) : null]);
  }
  function input(type, value, attrs) {
    var el = h('input', Object.assign({ type: type, id: nid() }, attrs || {}));
    if (value != null) el.value = value;
    return el;
  }
  function textarea(value, attrs) {
    var el = h('textarea', Object.assign({ id: nid() }, attrs || {}));
    el.value = value || '';
    return el;
  }
  function select(options, value) {
    var el = h('select', { id: nid() });
    options.forEach(function (o) {
      if (o.group) {
        var g = h('optgroup', { label: o.group });
        o.items.forEach(function (x) { g.appendChild(h('option', { value: x[0], text: x[1] })); });
        el.appendChild(g);
      } else el.appendChild(h('option', { value: o[0], text: o[1] }));
    });
    if (value != null) el.value = value;
    return el;
  }
  function checkbox(label, checked) {
    var el = h('input', { type: 'checkbox', id: nid() });
    el.checked = !!checked;
    var lab = h('label.check', { 'for': el.id }, [el, h('span', { text: label })]);
    lab.input = el;
    return lab;
  }
  function seg(items, value, onChange, label) {
    var el = h('div.seg.ut-seg', { role: 'group', 'aria-label': label || 'Options' });
    el.value = value;
    items.forEach(function (it) {
      var b = h('button', { type: 'button', html: it[1], 'data-v': it[0] });
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
    el.set(value);
    return el;
  }
  function btn(cls, iconName, text, onClick, attrs) {
    var b = h('button.btn' + (cls ? '.' + cls.split(' ').join('.') : ''), Object.assign({ type: 'button', html: (iconName ? BT.icon(iconName) : '') + (text ? '<span>' + esc(text) + '</span>' : '') }, attrs || {}));
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }
  /** Copy text and flash "Copied" on the button. */
  function copyBtn(getText, label, cls) {
    var b = btn(cls || 'btn-sm', 'copy', label === undefined ? 'Copy' : label, null, { 'aria-label': 'Copy' });
    b.addEventListener('click', function () {
      var t = typeof getText === 'function' ? getText() : getText;
      if (!t) return;
      BT.copy(t).then(function () {
        var old = b.innerHTML;
        b.innerHTML = BT.icon('check') + (label === '' ? '' : '<span>Copied</span>');
        b.classList.add('copied');
        setTimeout(function () { b.innerHTML = old; b.classList.remove('copied'); }, 1400);
      });
    });
    return b;
  }
  function card(title, children, extra) {
    return h('div.card', null, [title ? h('div.card-title', null, [h('h3', { text: title }), extra || null]) : null].concat(children || []));
  }
  /** Range + number input pair kept in sync. */
  function rangeNum(label, min, max, value, onInput) {
    var r = input('range', value, { min: min, max: max, step: 1, 'aria-label': label + ' slider' });
    var n = input('number', value, { min: min, max: max, inputmode: 'numeric' });
    r.addEventListener('input', function () { n.value = r.value; onInput(Number(r.value)); });
    n.addEventListener('input', function () {
      var v = BT.num(n);
      if (isFinite(v)) { r.value = clamp(v, min, max); onInput(clamp(Math.round(v), min, max)); }
    });
    n.addEventListener('blur', function () { n.value = r.value; });
    var f = h('div.field', null, [h('label', { 'for': n.id, text: label }), h('div.ut-range', null, [r, n])]);
    f.set = function (v) { r.value = v; n.value = v; };
    return f;
  }
  function stat(label, value) {
    var v = h('div.value', { text: value == null ? '—' : value });
    var s = h('div.stat', null, [h('div.label', { text: label }), v]);
    s.set = function (t) { v.textContent = t; };
    return s;
  }
  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val);
    } catch (e) { return null; }
    return null;
  }

  // ===================================================== WORDS & STRENGTH
  var WORDS = ('able acid aged also area army away baby back ball band bank base bath bear beat bell belt best bird blue boat body bold bone book boot born boss both bowl bulk burn bush busy cake calm came camp card care cart case cash cast cave chef chip city clay club coal coat code cold cook cool copy corn cost crew crop cube cup curl cute dare dark data date dawn deal deer desk dial diet dish dock door dose dove down draw drum duck dune dust duty each earn east easy echo edge else epic even ever exam exit face fact fair fall farm fast fern film fine fire firm fish flag flat flow foam fold folk food foot fork form fort four free frog fuel full fund gain game gate gear gift girl glad glow goal gold golf good gown grab gray grid grow gulf hail hair half hall hand harp hawk head heat herb hero high hike hill hint hold home hood hook hope horn host hour huge hunt idea inch iron isle item jade jazz jeep join joke jump june jury keen keep kelp kept kick kind king kite knee knot lake lamb lamp land lane last lava lawn lead leaf left lens lift lily lime line link lion list live load loaf lock loft logo long loop lord loud love luck lung mail main make mall malt many maple mars mask mast math maze meal meat melt menu mild milk mill mind mint mist moat mode mole monk moon moss moth move much mule muse nail name navy neat neck nest news next nice nine node noon nose note oaks oath oboe odds oven over pace pack page pail palm park part pass path peak pear pine pink pipe plan play plot plum poem poet pole pond pony pool port pose post pour pure quiz race raft rain ramp rare raven read real reef rest rice rich ride ring ripe rise road robe rock roof room root rope rose ruby rule rush safe saga sage sail salt same sand save scan seal seat seed self ship shoe shop shot side sign silk sing sink site size skip sky slim slow snow soap sock soda sofa soft soil solo song soup spin spot star stay stem step stew stir stop such suit sun surf swan swim tail tale talk tall tank tape task team tent term test text tide tile time tiny toad tone tool torch tour town tree trim trip tube tuna tune turn twin type unit urge vast vest view vine visa void vote wade wage wait wake walk wall wand warm wash wave weed week well west whale wheat wide wild wind wine wing wire wise wish wolf wood wool word work worm yard yarn year yoga zeal zero zinc zone zoom acorn amber angel apple arrow aspen atlas bacon badge baker beach berry bison blaze bloom brave bread brick brook brush cabin candy canoe cargo cedar chalk charm chess chili cider clock cloud cocoa coral crane cream crisp crown daisy delta diary dream eagle earth ember fable fairy feast fiber flame flute frost fruit globe grape grass guava happy hazel heart honey horse house igloo ivory jelly jewel juice karma kayak koala lemon lilac llama lotus lucky mango maple medal melon mercy metal mocha moose mango novel ocean olive onion opera orbit otter panda paper peach pearl pecan piano pilot pixel pizza plaza polar quilt radar raven river robin rover salad scarf shark sheep shell skate sleep smile snack solar spice spoon storm sugar sunny swift table tango tiger toast topaz tower train tulip ultra umbra union valley vapor velvet vivid waltz water wheel willow wonder yacht zebra').split(' ').filter(function (w, i, a) { return w && a.indexOf(w) === i; });

  var COMMON = ('password 123456 123456789 12345678 12345 1234567 1234567890 qwerty abc123 password1 111111 iloveyou 123123 admin welcome monkey dragon letmein football baseball sunshine princess qwerty123 1q2w3e4r 000000 654321 superman 1qaz2wsx 7777777 121212 qazwsx master hello freedom whatever trustno1 starwars shadow michael jennifer jordan hunter ashley killer batman charlie 696969 mustang access flower passw0rd login solo loveme zaq12wsx password123 1234 12345678910 india india123 cricket krishna sairam omsairam ganesh love123 987654321 qwertyuiop asdfgh asdfghjkl zxcvbnm google secret test test123 guest root pass pass123 changeme default samsung iphone apple computer internet summer winter pokemon naruto mobile 1111 112233 159753 147258369 aa123456 a123456 qwe123 admin123 welcome1 abcd1234 india@123 password@123 p@ssw0rd hello123 iloveyou1 lovely angel nicole daniel jessica').split(' ');
  var KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890', '1qaz2wsx3edc4rfv5tgb6yhn7ujm8ik9ol0p', 'qazwsxedcrfvtgbyhnujmikolp'];
  var LEET = { '@': 'a', '4': 'a', '3': 'e', '1': 'i', '!': 'i', '0': 'o', '$': 's', '5': 's', '7': 't', '+': 't', '8': 'b', '9': 'g' };

  /** Analyse a password: entropy estimate (bits) plus the patterns found. */
  function analyse(pw) {
    var len = Array.from(pw).length;
    var lower = /[a-z]/.test(pw), upper = /[A-Z]/.test(pw), digit = /\d/.test(pw), sym = /[^A-Za-z0-9]/.test(pw.replace(/[^\x00-\x7f]/g, '')), uni = /[^\x00-\x7f]/.test(pw);
    var pool = (lower ? 26 : 0) + (upper ? 26 : 0) + (digit ? 10 : 0) + (sym ? 33 : 0) + (uni ? 100 : 0);
    var res = { len: len, lower: lower, upper: upper, digit: digit, sym: sym || uni, pool: pool, patterns: [], common: false, bits: 0 };
    if (!len) return res;
    var chars = Array.from(pw), lc = pw.toLowerCase();
    var weak = new Array(chars.length).fill(false);
    function mark(start, n, label) {
      for (var i = start + 1; i < start + n && i < weak.length; i++) weak[i] = true;
      if (res.patterns.indexOf(label) < 0) res.patterns.push(label);
    }
    // repeats: aaa, abab
    var m, re = /(.)\1{2,}/g;
    while ((m = re.exec(pw))) mark(m.index, m[0].length, 'repeat');
    re = /(.{2,}?)\1+/g;
    while ((m = re.exec(pw))) if (m[0].length >= 4) mark(m.index, m[0].length, 'repeat');
    // sequences: abc, 123, cba
    for (var i = 0; i < chars.length - 2;) {
      var d = chars[i + 1].charCodeAt(0) - chars[i].charCodeAt(0);
      if (Math.abs(d) === 1) {
        var j = i + 1;
        while (j < chars.length - 1 && chars[j + 1].charCodeAt(0) - chars[j].charCodeAt(0) === d) j++;
        if (j - i >= 2) { mark(i, j - i + 1, 'sequence'); i = j; continue; }
      }
      i++;
    }
    // keyboard walks (4+)
    KEY_ROWS.forEach(function (row) {
      [row, row.split('').reverse().join('')].forEach(function (r) {
        for (var k = 0; k + 4 <= r.length; k++) {
          var sub = r.substr(k, 4), at = lc.indexOf(sub);
          while (at >= 0) {
            var n = 4;
            while (at + n < lc.length && r.indexOf(lc.substr(at, n + 1)) >= 0) n++;
            mark(at, n, 'keyboard');
            at = lc.indexOf(sub, at + 1);
          }
        }
      });
    });
    // years and dates
    re = /(19|20)\d\d/g;
    while ((m = re.exec(pw))) mark(m.index, 4, 'year');
    // dictionary words (also de-leeted)
    var norm = lc.split('').map(function (c) { return LEET[c] || c; }).join('');
    var dict = COMMON.filter(function (w) { return w.length >= 4; }).concat(WORDS.filter(function (w) { return w.length >= 4; }));
    dict.forEach(function (w) {
      var at = norm.indexOf(w);
      if (at < 0) at = lc.indexOf(w);
      if (at >= 0) mark(at, w.length, 'word');
    });
    var per = Math.log2(Math.max(pool, 2));
    var bits = 0;
    for (var q = 0; q < chars.length; q++) bits += weak[q] ? 1.2 : per;
    // exact common password (optionally with a short suffix)
    var stripped = norm.replace(/[\d!@#$%^&*.?_-]{0,4}$/, '');
    var idx = COMMON.indexOf(lc), idx2 = COMMON.indexOf(norm), idx3 = stripped.length >= 3 ? COMMON.indexOf(stripped) : -1;
    if (idx >= 0 || idx2 >= 0) { res.common = true; bits = Math.min(bits, Math.log2((idx >= 0 ? idx : idx2) + 2) + 1); }
    else if (idx3 >= 0) { res.common = true; bits = Math.min(bits, Math.log2(idx3 + 2) + 1 + (norm.length - stripped.length) * 3.3); }
    res.bits = Math.max(0, bits);
    return res;
  }
  function crackTime(bits) {
    var sec = Math.pow(2, bits) / 2 / 1e10;
    if (sec < 1) return 'Instantly';
    var units = [[60, 'second'], [60, 'minute'], [24, 'hour'], [30.44, 'day'], [12, 'month'], [100, 'year']];
    var v = sec;
    for (var i = 0; i < units.length; i++) {
      if (v < units[i][0]) { var r = Math.round(v); return r + ' ' + units[i][1] + (r === 1 ? '' : 's'); }
      v /= units[i][0];
    }
    if (v < 1000) return Math.round(v) + ' centuries';
    if (v < 1e4) return 'Thousands of years';
    if (v < 1e7) return 'Millions of years';
    return 'Longer than the age of the universe';
  }
  var LEVELS = [
    [0, 'Very weak', 'var(--danger)'], [28, 'Weak', '#f76b15'], [40, 'Fair', 'var(--warn)'], [60, 'Strong', 'var(--ok)'], [80, 'Very strong', 'var(--ok)']
  ];
  function level(bits) { var l = LEVELS[0]; LEVELS.forEach(function (x, i) { if (bits >= x[0]) l = x.concat([i]); }); return l; }
  function meter() {
    var bar = h('span');
    var lab = h('span'), bitsEl = h('span.muted');
    var el = h('div', null, [h('div.ut-meter', { role: 'meter', 'aria-label': 'Password strength', 'aria-valuemin': '0', 'aria-valuemax': '128' }, [bar]), h('div.ut-mrow', null, [lab, bitsEl])]);
    el.set = function (bits, extra) {
      var l = level(bits);
      bar.style.width = Math.max(4, Math.min(100, bits / 128 * 100)) + '%';
      bar.style.background = l[2];
      lab.textContent = l[1];
      lab.style.color = l[2];
      bitsEl.textContent = Math.round(bits) + ' bits of entropy' + (extra || '');
      el.firstChild.setAttribute('aria-valuenow', String(Math.round(bits)));
      el.firstChild.setAttribute('aria-valuetext', l[1]);
    };
    return el;
  }

  // ================================================= PASSWORD GENERATOR
  var SETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lower: 'abcdefghijklmnopqrstuvwxyz', digits: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.<>/?~'
  };
  var AMBIG = 'Il1|O0o`\'";:,.';

  register('password-generator', function (root) {
    injectCSS();
    var S = { mode: 'password', len: 16, upper: true, lower: true, digits: true, symbols: true, ambig: false, count: 1, words: 5, sep: '-', cap: true, num: true };
    try { Object.assign(S, JSON.parse(store('bt-pwgen') || '{}')); } catch (e) { /* ignore */ }
    var pwEl = h('div.pw', { 'aria-live': 'polite' });
    var mtr = meter();
    var current = '';
    var copyMain = copyBtn(function () { return current; }, 'Copy', 'btn-primary');
    var regen = btn('', 'refresh-cw', '', gen, { 'aria-label': 'Generate new password', title: 'Generate new' });
    var list = h('div.ut-list.hidden');
    var top = card(null, [h('div.ut-out', null, [pwEl, regen, copyMain]), mtr, list]);

    var modeSeg = seg([['password', 'Password'], ['passphrase', 'Passphrase']], S.mode, function (v) { S.mode = v; sync(); gen(); }, 'Generator mode');
    var lenF = rangeNum('Length', 4, 128, S.len, function (v) { S.len = v; gen(); });
    var checks = {};
    var checkWrap = h('div.ut-checks');
    [['upper', 'Uppercase (A–Z)'], ['lower', 'Lowercase (a–z)'], ['digits', 'Numbers (0–9)'], ['symbols', 'Symbols (!@#$…)'], ['ambig', 'Exclude look-alikes (I l 1 O 0)']].forEach(function (c) {
      var cb = checkbox(c[1], S[c[0]]);
      cb.input.addEventListener('change', function () {
        S[c[0]] = cb.input.checked;
        if (!S.upper && !S.lower && !S.digits && !S.symbols) { S.lower = true; checks.lower.input.checked = true; BT.toast('At least one character type is needed'); }
        gen();
      });
      checks[c[0]] = cb;
      checkWrap.appendChild(cb);
    });
    var pwOpts = h('div', null, [lenF, checkWrap]);
    var wordsF = rangeNum('Number of words', 3, 12, S.words, function (v) { S.words = v; gen(); });
    var sepSel = select([['-', 'Hyphen ( - )'], [' ', 'Space'], ['.', 'Dot ( . )'], ['_', 'Underscore ( _ )'], ['', 'None']], S.sep);
    sepSel.addEventListener('change', function () { S.sep = sepSel.value; gen(); });
    var capCb = checkbox('Capitalise words', S.cap), numCb = checkbox('Add a number', S.num);
    capCb.input.addEventListener('change', function () { S.cap = capCb.input.checked; gen(); });
    numCb.input.addEventListener('change', function () { S.num = numCb.input.checked; gen(); });
    var ppOpts = h('div', null, [wordsF, field('Separator', sepSel), h('div.ut-checks', null, [capCb, numCb]),
      h('p.small.muted', { text: 'Passphrases are easy to remember and type. Words are picked from a list of ' + WORDS.length + ' common words.' })]);
    var countSel = select([['1', '1 password'], ['5', '5 passwords'], ['10', '10 passwords'], ['25', '25 passwords']], String(S.count));
    countSel.addEventListener('change', function () { S.count = Number(countSel.value); gen(); });
    var settings = card('Options', [h('div.field', null, [modeSeg]), pwOpts, ppOpts, field('How many', countSel),
      h('div.notice', { html: BT.icon('lock') + '<span>Generated on your device with <code>crypto.getRandomValues</code>. Nothing is sent or stored online.</span>' })]);
    root.appendChild(top);
    root.appendChild(settings);
    function sync() {
      pwOpts.classList.toggle('hidden', S.mode !== 'password');
      ppOpts.classList.toggle('hidden', S.mode !== 'passphrase');
      countSel.options[0].text = S.mode === 'password' ? '1 password' : '1 passphrase';
    }

    function makePassword() {
      var classes = ['upper', 'lower', 'digits', 'symbols'].filter(function (k) { return S[k]; }).map(function (k) {
        var set = SETS[k];
        if (S.ambig) set = set.split('').filter(function (c) { return AMBIG.indexOf(c) < 0; }).join('');
        return set;
      });
      var all = classes.join('');
      var out = [];
      // one from each selected class (when length allows), then fill, then shuffle
      classes.forEach(function (set) { if (out.length < S.len) out.push(set[randInt(set.length)]); });
      while (out.length < S.len) out.push(all[randInt(all.length)]);
      return { text: shuffle(out).join(''), bits: S.len * Math.log2(all.length) };
    }
    function makePhrase() {
      var w = [];
      for (var i = 0; i < S.words; i++) {
        var word = WORDS[randInt(WORDS.length)];
        w.push(S.cap ? word[0].toUpperCase() + word.slice(1) : word);
      }
      var bits = S.words * Math.log2(WORDS.length);
      if (S.num) { var pos = randInt(w.length); w[pos] += String(randInt(100)); bits += Math.log2(100) + Math.log2(S.words); }
      return { text: w.join(S.sep), bits: bits };
    }
    function colourise(t) {
      return esc(t).replace(/(&[a-z#0-9]+;)|(\d)|([^A-Za-z0-9&])/g, function (m, ent, d, s) {
        if (ent) return '<span class="s">' + ent + '</span>';
        return d ? '<span class="d">' + d + '</span>' : '<span class="s">' + s + '</span>';
      });
    }
    function gen() {
      store('bt-pwgen', JSON.stringify(S));
      var results = [];
      for (var i = 0; i < S.count; i++) results.push(S.mode === 'password' ? makePassword() : makePhrase());
      current = results[0].text;
      pwEl.innerHTML = colourise(current);
      mtr.set(results[0].bits, ' · crack time ≈ ' + crackTime(results[0].bits).toLowerCase());
      list.innerHTML = '';
      list.classList.toggle('hidden', S.count < 2);
      if (S.count > 1) {
        results.slice(1).forEach(function (r) {
          list.appendChild(h('div.ut-li', null, [h('code', { text: r.text }), copyBtn(r.text, '', 'btn-sm btn-ghost')]));
        });
        var all = results.map(function (r) { return r.text; }).join('\n');
        list.appendChild(h('div.btn-group', { style: { marginTop: '6px' } }, [copyBtn(all, 'Copy all'), btn('btn-sm', 'download', 'Download .txt', function () { BT.download(new Blob([all + '\n'], { type: 'text/plain' }), 'passwords.txt'); })]));
      }
    }
    sync();
    gen();
  });

  // =========================================== PASSWORD STRENGTH CHECKER
  register('password-strength-checker', function (root) {
    injectCSS();
    var pw = input('password', '', { autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Type or paste a password', style: { fontFamily: 'var(--mono)', fontSize: '1.05rem' } });
    var eye = btn('', 'search', 'Show', null, { 'aria-label': 'Show password', 'aria-pressed': 'false' });
    eye.addEventListener('click', function () {
      var show = pw.type === 'password';
      pw.type = show ? 'text' : 'password';
      eye.querySelector('span').textContent = show ? 'Hide' : 'Show';
      eye.setAttribute('aria-pressed', String(show));
      pw.focus();
    });
    var mtr = meter();
    var sTime = stat('Time to crack', '—'), sLen = stat('Length', '0'), sPool = stat('Character pool', '0');
    var checksEl = h('ul.ut-checklist');
    var sugg = h('ul', { style: { margin: 0, paddingLeft: '20px', color: 'var(--text-2)' } });
    root.appendChild(card(null, [
      h('div.field', null, [h('label', { 'for': pw.id, text: 'Password to check' }), h('div.input-group', null, [pw, eye])]),
      mtr,
      h('div.stats', { style: { marginTop: '16px' } }, [sTime, sLen, sPool])
    ]));
    root.appendChild(h('div.split', { style: { marginTop: '16px' } }, [card('Checks', [checksEl]), card('Suggestions', [sugg])]));
    root.appendChild(h('div.notice.ok', { style: { marginTop: '16px' }, html: BT.icon('shield-check') + '<span>Your password never leaves this page: the check runs entirely in your browser and nothing is stored or sent. Crack times assume an offline attack at 10 billion guesses per second.</span>' }));

    function upd() {
      var v = pw.value, a = analyse(v);
      mtr.set(a.bits);
      sTime.set(v ? crackTime(a.bits) : '—');
      sLen.set(String(a.len));
      sPool.set(String(a.pool));
      var checks = [
        [a.len >= 12, 'At least 12 characters' + (a.len ? ' (' + a.len + ')' : '')],
        [a.lower, 'Lowercase letters'], [a.upper, 'Uppercase letters'], [a.digit, 'Numbers'], [a.sym, 'Symbols'],
        [!a.common, 'Not a commonly used password'],
        [a.patterns.indexOf('sequence') < 0, 'No sequences like abc or 123'],
        [a.patterns.indexOf('repeat') < 0, 'No repeated characters or chunks'],
        [a.patterns.indexOf('keyboard') < 0, 'No keyboard patterns like qwerty'],
        [a.patterns.indexOf('word') < 0 && a.patterns.indexOf('year') < 0, 'No dictionary words or years']
      ];
      checksEl.innerHTML = checks.map(function (c) {
        var okk = v ? c[0] : false;
        return '<li class="' + (okk ? 'ok' : 'bad') + '"><span class="i" aria-hidden="true">' + (okk ? '✓' : '✕') + '</span><span>' + esc(c[1]) + '<span class="sr-only">: ' + (okk ? 'passed' : 'not met') + '</span></span></li>';
      }).join('');
      var s = [];
      if (!v) s.push('Start typing to see how strong your password is.');
      else {
        if (a.common) s.push('This is one of the most common passwords. Attackers try these first, so change it.');
        if (a.len < 12) s.push('Make it longer: 12–16+ characters adds far more strength than symbols do.');
        if (!a.upper || !a.lower) s.push('Mix uppercase and lowercase letters.');
        if (!a.digit) s.push('Add a few numbers, not just at the end.');
        if (!a.sym) s.push('Add symbols such as ! # % or *.');
        if (a.patterns.indexOf('keyboard') >= 0 || a.patterns.indexOf('sequence') >= 0) s.push('Avoid keyboard walks and sequences (qwerty, 1234, abcd).');
        if (a.patterns.indexOf('repeat') >= 0) s.push('Avoid repeating characters or groups.');
        if (a.patterns.indexOf('word') >= 0 || a.patterns.indexOf('year') >= 0) s.push('Avoid names, common words and years, even with @ for a or 0 for o.');
        if (a.bits >= 80) s.push('Excellent. Use a password manager so you can have a unique one for every site.');
        else s.push('Tip: a random passphrase of 5 or more words is both strong and memorable.');
      }
      sugg.innerHTML = s.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
    }
    pw.addEventListener('input', upd);
    upd();
  });

  // ======================================================== QR CODE
  function escWifi(s) { return String(s).replace(/([\\;,:"])/g, '\\$1'); }
  function escV(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1'); }
  var QR_TYPES = [['url', 'URL'], ['text', 'Text'], ['wifi', 'Wi-Fi'], ['upi', 'UPI'], ['vcard', 'Contact'], ['email', 'Email'], ['sms', 'SMS'], ['phone', 'Phone']];

  register('qr-code-generator', function (root) {
    injectCSS();
    var S = { type: 'url', ecl: 'M', size: 512, margin: 4, fg: '#111827', bg: '#ffffff', logo: null, logoImg: null, logoPct: 22 };
    var vals = {
      url: 'https://www.biscsindia.com', text: 'Hello from BISCS India!', ssid: '', wpass: '', sec: 'WPA', hidden: false,
      pa: '', pn: '', am: '', tn: '', first: '', last: '', org: '', title: '', tel: '', email: '', web: '', adr: '',
      to: '', subject: '', body: '', smsTo: '', smsMsg: '', phone: '+91'
    };
    var fieldsBox = h('div');
    var typeSeg = seg(QR_TYPES, S.type, function (v) { S.type = v; buildFields(); render(); }, 'QR code type');
    typeSeg.classList.add('ut-wrap');
    var qrBox = h('div.ut-qr', { role: 'img', 'aria-label': 'QR code preview' });
    var payloadEl = h('div.ut-payload');
    var errEl = h('div.notice.error.ut-err.hidden');
    var info = h('div.muted.small', { style: { marginTop: '8px', textAlign: 'center' } });
    var dlPng = btn('btn-primary', 'download', 'Download PNG');
    var dlSvg = btn('', 'download', 'Download SVG');
    var cp = btn('', 'copy', 'Copy image');

    var ecl = select([['L', 'Low (7%)'], ['M', 'Medium (15%)'], ['Q', 'Quartile (25%)'], ['H', 'High (30%)']], S.ecl);
    var size = select([['256', '256 px'], ['512', '512 px'], ['768', '768 px'], ['1024', '1024 px'], ['2048', '2048 px (print)']], String(S.size));
    var margin = input('number', S.margin, { min: 0, max: 12 });
    var fg = input('color', S.fg), bg = input('color', S.bg);
    var logoIn = input('file', null, { accept: 'image/*', 'aria-label': 'Centre logo image' });
    var logoClear = btn('btn-sm btn-ghost hidden', 'x', 'Remove logo');
    var logoPct = input('range', S.logoPct, { min: 10, max: 30, 'aria-label': 'Logo size' });
    var logoNote = h('span.hint', { text: 'Adding a logo switches error correction to High so the code still scans.' });
    [ecl, size, margin, fg, bg, logoPct].forEach(function (e) { e.addEventListener('input', readOpts); e.addEventListener('change', readOpts); });
    function readOpts() {
      S.ecl = ecl.value; S.size = Number(size.value); S.margin = clamp(Math.round(BT.num(margin) || 0), 0, 12);
      S.fg = fg.value; S.bg = bg.value; S.logoPct = Number(logoPct.value);
      render();
    }
    logoIn.addEventListener('change', function () {
      var f = logoIn.files && logoIn.files[0];
      if (!f) return;
      BT.readFile(f, 'dataURL').then(function (url) {
        return BT.loadImage(url).then(function (img) { S.logo = url; S.logoImg = img; logoClear.classList.remove('hidden'); render(); });
      }).catch(function () { BT.toast('Could not read that image', 'error'); });
    });
    logoClear.addEventListener('click', function () { S.logo = S.logoImg = null; logoIn.value = ''; logoClear.classList.add('hidden'); render(); });

    var left = h('div', null, [
      card('Content', [h('div.field', null, [typeSeg]), fieldsBox]),
      card('Design', [
        h('div.row.cols-2', null, [field('Error correction', ecl), field('Size', size)]),
        h('div.row.cols-3', null, [field('Margin (modules)', margin), field('Foreground', fg), field('Background', bg)]),
        h('div.field', null, [h('label', { 'for': logoIn.id, text: 'Centre logo (optional)' }), logoIn, h('div.ut-range', null, [logoPct]), logoNote, logoClear])
      ])
    ]);
    var right = card('Your QR code', [qrBox, info, errEl, h('div.btn-group', { style: { marginTop: '14px', justifyContent: 'center' } }, [dlPng, dlSvg, cp]), payloadEl]);
    root.appendChild(h('div.split', null, [left, h('div', null, [right])]));

    function inp(key, label, type, attrs, hint) {
      var el = type === 'textarea' ? textarea(vals[key], Object.assign({ rows: 3, style: { minHeight: '90px' } }, attrs || {})) : input(type || 'text', vals[key], attrs);
      el.addEventListener('input', function () { vals[key] = el.value; render(); });
      return field(label, el, hint);
    }
    function buildFields() {
      fieldsBox.innerHTML = '';
      var t = S.type, add = function (e) { fieldsBox.appendChild(e); };
      if (t === 'url') add(inp('url', 'Website URL', 'url', { placeholder: 'https://', inputmode: 'url' }));
      if (t === 'text') add(inp('text', 'Text', 'textarea'));
      if (t === 'wifi') {
        add(inp('ssid', 'Network name (SSID)', 'text', { autocomplete: 'off' }));
        add(inp('wpass', 'Password', 'text', { autocomplete: 'off' }));
        var sec = select([['WPA', 'WPA / WPA2 / WPA3'], ['WEP', 'WEP'], ['nopass', 'No password']], vals.sec);
        sec.addEventListener('change', function () { vals.sec = sec.value; render(); });
        var hid = checkbox('Hidden network', vals.hidden);
        hid.input.addEventListener('change', function () { vals.hidden = hid.input.checked; render(); });
        add(h('div.row.cols-2', null, [field('Security', sec), h('div.field', { style: { justifyContent: 'flex-end' } }, [hid])]));
        add(h('p.small.muted', { text: 'Guests can scan this with their phone camera to join without typing the password.' }));
      }
      if (t === 'upi') {
        add(inp('pa', 'UPI ID (VPA)', 'text', { placeholder: 'name@okbank', autocomplete: 'off' }, 'The payee address, e.g. shopname@ybl'));
        add(inp('pn', 'Payee name', 'text', { placeholder: 'Business or person name' }));
        add(h('div.row.cols-2', null, [inp('am', 'Amount (₹, optional)', 'number', { min: 0, step: '0.01', inputmode: 'decimal' }), inp('tn', 'Note (optional)', 'text', { maxlength: 50 })]));
        add(h('p.small.muted', { text: 'Works with GPay, PhonePe, Paytm, BHIM and all UPI apps. Leave the amount empty to let the payer enter it.' }));
      }
      if (t === 'vcard') {
        add(h('div.row.cols-2', null, [inp('first', 'First name'), inp('last', 'Last name')]));
        add(h('div.row.cols-2', null, [inp('org', 'Company'), inp('title', 'Job title')]));
        add(h('div.row.cols-2', null, [inp('tel', 'Phone', 'tel', { inputmode: 'tel' }), inp('email', 'Email', 'email')]));
        add(inp('web', 'Website', 'url'));
        add(inp('adr', 'Address', 'textarea', { rows: 2, style: { minHeight: '64px' } }));
      }
      if (t === 'email') {
        add(inp('to', 'Email address', 'email'));
        add(inp('subject', 'Subject'));
        add(inp('body', 'Message', 'textarea'));
      }
      if (t === 'sms') { add(inp('smsTo', 'Phone number', 'tel', { inputmode: 'tel' })); add(inp('smsMsg', 'Message', 'textarea')); }
      if (t === 'phone') add(inp('phone', 'Phone number', 'tel', { inputmode: 'tel' }));
    }

    function payload() {
      var v = vals, t = S.type;
      if (t === 'url') { var u = v.url.trim(); if (u && !/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u; return u; }
      if (t === 'text') return v.text;
      if (t === 'wifi') {
        if (!v.ssid) return '';
        return 'WIFI:T:' + v.sec + ';S:' + escWifi(v.ssid) + ';' + (v.sec !== 'nopass' ? 'P:' + escWifi(v.wpass) + ';' : '') + 'H:' + (v.hidden ? 'true' : 'false') + ';;';
      }
      if (t === 'upi') {
        if (!v.pa) return '';
        var q = ['pa=' + encodeURIComponent(v.pa.trim()).replace(/%40/g, '@')];
        if (v.pn) q.push('pn=' + encodeURIComponent(v.pn.trim()));
        var am = BT.num(v.am);
        if (am > 0) q.push('am=' + am.toFixed(2));
        q.push('cu=INR');
        if (v.tn) q.push('tn=' + encodeURIComponent(v.tn.trim()));
        return 'upi://pay?' + q.join('&');
      }
      if (t === 'vcard') {
        if (!(v.first || v.last || v.org || v.tel || v.email)) return '';
        var L = ['BEGIN:VCARD', 'VERSION:3.0', 'N:' + escV(v.last) + ';' + escV(v.first) + ';;;', 'FN:' + escV((v.first + ' ' + v.last).trim() || v.org)];
        if (v.org) L.push('ORG:' + escV(v.org));
        if (v.title) L.push('TITLE:' + escV(v.title));
        if (v.tel) L.push('TEL;TYPE=CELL:' + v.tel.trim());
        if (v.email) L.push('EMAIL:' + v.email.trim());
        if (v.web) L.push('URL:' + v.web.trim());
        if (v.adr) L.push('ADR;TYPE=WORK:;;' + escV(v.adr) + ';;;;');
        L.push('END:VCARD');
        return L.join('\n');
      }
      if (t === 'email') {
        if (!v.to) return '';
        var p = [];
        if (v.subject) p.push('subject=' + encodeURIComponent(v.subject));
        if (v.body) p.push('body=' + encodeURIComponent(v.body));
        return 'mailto:' + v.to.trim() + (p.length ? '?' + p.join('&') : '');
      }
      if (t === 'sms') return v.smsTo ? 'SMSTO:' + v.smsTo.replace(/\s/g, '') + ':' + v.smsMsg : '';
      if (t === 'phone') return v.phone.replace(/\s/g, '').length > 3 ? 'tel:' + v.phone.replace(/\s/g, '') : '';
      return '';
    }

    var qr = null, lastText = '';
    function matrix(text) {
      var level = S.logo ? 'H' : S.ecl;
      var q = window.qrcode(0, level);
      q.addData(text, 'Byte');
      q.make();
      return q;
    }
    function drawCanvas(px) {
      var n = qr.getModuleCount(), tot = n + S.margin * 2, cell = px / tot;
      var c = doc.createElement('canvas');
      c.width = c.height = px;
      var x = c.getContext('2d');
      x.fillStyle = S.bg;
      x.fillRect(0, 0, px, px);
      x.fillStyle = S.fg;
      for (var r = 0; r < n; r++) for (var col = 0; col < n; col++) {
        if (!qr.isDark(r, col)) continue;
        var x0 = Math.round((col + S.margin) * cell), y0 = Math.round((r + S.margin) * cell);
        var x1 = Math.round((col + 1 + S.margin) * cell), y1 = Math.round((r + 1 + S.margin) * cell);
        x.fillRect(x0, y0, x1 - x0, y1 - y0);
      }
      if (S.logoImg) {
        var ls = n * cell * S.logoPct / 100, pad = cell * 1.2, cx = px / 2;
        var iw = S.logoImg.naturalWidth, ih = S.logoImg.naturalHeight, sc = ls / Math.max(iw, ih);
        var dw = iw * sc, dh = ih * sc;
        x.fillStyle = S.bg;
        roundRect(x, cx - dw / 2 - pad, cx - dh / 2 - pad, dw + pad * 2, dh + pad * 2, pad * 1.5);
        x.fill();
        x.drawImage(S.logoImg, cx - dw / 2, cx - dh / 2, dw, dh);
      }
      return c;
    }
    function svgString() {
      var n = qr.getModuleCount(), tot = n + S.margin * 2, d = '';
      for (var r = 0; r < n; r++) {
        for (var col = 0; col < n;) {
          if (!qr.isDark(r, col)) { col++; continue; }
          var start = col;
          while (col < n && qr.isDark(r, col)) col++;
          d += 'M' + (start + S.margin) + ' ' + (r + S.margin) + 'h' + (col - start) + 'v1h-' + (col - start) + 'z';
        }
      }
      var out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + tot + ' ' + tot + '" width="' + S.size + '" height="' + S.size + '" shape-rendering="crispEdges">' +
        '<rect width="100%" height="100%" fill="' + S.bg + '"/><path fill="' + S.fg + '" d="' + d + '"/>';
      if (S.logo) {
        var ls = n * S.logoPct / 100, iw = S.logoImg.naturalWidth, ih = S.logoImg.naturalHeight, sc = ls / Math.max(iw, ih);
        var dw = iw * sc, dh = ih * sc, c = tot / 2, pad = 1.2;
        out += '<rect x="' + (c - dw / 2 - pad) + '" y="' + (c - dh / 2 - pad) + '" width="' + (dw + pad * 2) + '" height="' + (dh + pad * 2) + '" rx="' + pad * 1.5 + '" fill="' + S.bg + '" shape-rendering="geometricPrecision"/>' +
          '<image href="' + S.logo + '" x="' + (c - dw / 2) + '" y="' + (c - dh / 2) + '" width="' + dw + '" height="' + dh + '"/>';
      }
      return out + '</svg>';
    }
    function lum(hex) {
      var v = parseInt(hex.slice(1), 16), f = function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(v >> 16 & 255) + 0.7152 * f(v >> 8 & 255) + 0.0722 * f(v & 255);
    }
    function render() {
      if (!window.qrcode) return;
      var text = payload();
      lastText = text;
      payloadEl.textContent = text ? 'Encoded: ' + text : '';
      errEl.classList.add('hidden');
      errEl.innerHTML = '';
      [dlPng, dlSvg, cp].forEach(function (b) { b.disabled = !text; });
      if (!text) {
        qr = null;
        qrBox.innerHTML = '<p class="muted" style="text-align:center;max-width:240px">Fill in the details on the left and your QR code appears here instantly.</p>';
        info.textContent = '';
        return;
      }
      try { qr = matrix(text); } catch (e) {
        qr = null;
        qrBox.innerHTML = '';
        errEl.innerHTML = BT.icon('info') + '<span>That is too much data for a QR code. Shorten the content or lower the error correction level.</span>';
        errEl.classList.remove('hidden');
        return;
      }
      var c = drawCanvas(Math.min(S.size, 640));
      c.style.width = 'min(100%, 320px)';
      qrBox.innerHTML = '';
      qrBox.appendChild(c);
      var ratio = (Math.max(lum(S.fg), lum(S.bg)) + 0.05) / (Math.min(lum(S.fg), lum(S.bg)) + 0.05);
      info.textContent = qr.getModuleCount() + ' × ' + qr.getModuleCount() + ' modules · error correction ' + (S.logo ? 'H' : S.ecl) +
        (lum(S.fg) > lum(S.bg) ? ' · Warning: light-on-dark codes do not scan in some apps' : ratio < 4 ? ' · Warning: low contrast may not scan' : '');
    }
    dlPng.addEventListener('click', function () {
      if (!qr) return;
      BT.canvasToBlob(drawCanvas(S.size), 'image/png').then(function (b) { BT.download(b, 'qr-' + S.type + '.png'); });
    });
    dlSvg.addEventListener('click', function () { if (qr) BT.download(new Blob([svgString()], { type: 'image/svg+xml' }), 'qr-' + S.type + '.svg'); });
    cp.addEventListener('click', function () {
      if (!qr) return;
      if (!navigator.clipboard || !window.ClipboardItem) { BT.toast('Your browser cannot copy images. Use Download instead.', 'error'); return; }
      BT.canvasToBlob(drawCanvas(S.size), 'image/png').then(function (b) {
        return navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]);
      }).then(function () { BT.toast('QR code copied as image'); }, function () { BT.toast('Copy failed. Use Download instead.', 'error'); });
    });

    buildFields();
    qrBox.innerHTML = '<span class="spinner"></span>';
    BT.loadLib('qrcode').then(function (q) {
      if (q.stringToBytesFuncs && q.stringToBytesFuncs['UTF-8']) q.stringToBytes = q.stringToBytesFuncs['UTF-8'];
      render();
    }).catch(function () { qrBox.innerHTML = '<p class="notice error">Could not load the QR engine. Please refresh.</p>'; });
    BT.qrDebug = { payload: payload, vals: vals, svg: function () { return qr ? svgString() : ''; } };
  });

  function roundRect(x, X, Y, W, H, r) {
    r = Math.max(0, Math.min(r, W / 2, H / 2));
    x.beginPath();
    x.moveTo(X + r, Y);
    x.arcTo(X + W, Y, X + W, Y + H, r);
    x.arcTo(X + W, Y + H, X, Y + H, r);
    x.arcTo(X, Y + H, X, Y, r);
    x.arcTo(X, Y, X + W, Y, r);
    x.closePath();
  }

  // ========================================================== BARCODE
  var BC_FORMATS = [
    ['CODE128', 'Code 128 (any text)', 'BISCS-2026', 'Any letters, numbers and symbols. The most versatile choice.'],
    ['EAN13', 'EAN-13 (retail)', '890123456789', '12 digits (the 13th check digit is added for you) or 13 digits with a valid check digit. Indian products start with 890.'],
    ['EAN8', 'EAN-8', '9638507', '7 digits (+ check digit) or 8 digits.'],
    ['UPC', 'UPC-A', '12345678901', '11 digits (+ check digit) or 12 digits.'],
    ['CODE39', 'Code 39', 'BISCS 39', 'Uppercase A–Z, digits, space and - . $ / + %'],
    ['ITF14', 'ITF-14 (cartons)', '1540014128876', '13 digits (+ check digit) or 14 digits.'],
    ['MSI', 'MSI Plessey', '1234567', 'Digits only.'],
    ['pharmacode', 'Pharmacode', '1234', 'A number from 3 to 131070.'],
    ['codabar', 'Codabar', 'A12345B', 'Digits and - $ : / . +, optionally wrapped in start/stop letters A–D.']
  ];
  register('barcode-generator', function (root) {
    injectCSS();
    var S = { format: 'CODE128', value: BC_FORMATS[0][2], width: 2, height: 100, text: true, fontSize: 18, margin: 10, fg: '#000000', bg: '#ffffff' };
    var fmtSel = select(BC_FORMATS.map(function (f) { return [f[0], f[1]]; }), S.format);
    var val = input('text', S.value, { autocomplete: 'off', spellcheck: 'false', style: { fontFamily: 'var(--mono)' } });
    var hint = h('span.hint');
    var wR = input('range', S.width, { min: 1, max: 5, step: 1 }), hR = input('range', S.height, { min: 30, max: 250, step: 5 });
    var fsR = input('range', S.fontSize, { min: 10, max: 32 }), mR = input('range', S.margin, { min: 0, max: 40 });
    var txt = checkbox('Show text below', S.text);
    var fg = input('color', S.fg), bg = input('color', S.bg);
    var tr = checkbox('Transparent background (PNG/SVG)', false);
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = doc.createElementNS(svgNS, 'svg');
    svg.setAttribute('role', 'img');
    var box = h('div.ut-barcode', null, [svg]);
    var err = h('div.notice.error.hidden', { style: { marginTop: '12px' } });
    var dlPng = btn('btn-primary', 'download', 'Download PNG'), dlSvg = btn('', 'download', 'Download SVG');
    function lbl(t, el) { var o = h('span.muted.small'); el.addEventListener('input', function () { o.textContent = el.value; }); o.textContent = el.value; return h('div.field', null, [h('label', { 'for': el.id, text: t }), h('div.ut-range', null, [el, o])]); }
    root.appendChild(h('div.split', null, [
      card('Barcode', [field('Type', fmtSel), h('div.field', null, [h('label', { 'for': val.id, text: 'Content' }), val, hint]),
        h('div.row.cols-2', null, [lbl('Bar width', wR), lbl('Height', hR)]),
        h('div.row.cols-2', null, [lbl('Font size', fsR), lbl('Quiet zone', mR)]),
        h('div.row.cols-2', null, [field('Bar colour', fg), field('Background', bg)]),
        h('div.ut-checks', null, [txt, tr])]),
      card('Preview', [box, err, h('div.btn-group', { style: { marginTop: '14px', justifyContent: 'center' } }, [dlPng, dlSvg])])
    ]));
    fmtSel.addEventListener('change', function () {
      var f = BC_FORMATS.filter(function (x) { return x[0] === fmtSel.value; })[0];
      val.value = f[2];
      render();
    });
    [val, wR, hR, fsR, mR, fg, bg, txt.input, tr.input].forEach(function (e) { e.addEventListener('input', render); e.addEventListener('change', render); });
    var valid = true;
    function opts(extra) {
      return Object.assign({
        format: fmtSel.value, width: Number(wR.value), height: Number(hR.value), displayValue: txt.input.checked, fontSize: Number(fsR.value),
        margin: Number(mR.value), lineColor: fg.value, background: tr.input.checked ? 'transparent' : bg.value, font: 'monospace', textMargin: 4,
        valid: function (v) { valid = v; }
      }, extra || {});
    }
    function render() {
      if (!window.JsBarcode) return;
      var f = BC_FORMATS.filter(function (x) { return x[0] === fmtSel.value; })[0];
      hint.textContent = f[3];
      valid = true;
      var v = val.value;
      try { window.JsBarcode(svg, v, opts()); } catch (e) { valid = false; }
      if (!v) valid = false;
      err.classList.toggle('hidden', valid);
      err.innerHTML = valid ? '' : BT.icon('info') + '<span>' + (v ? '“' + esc(v) + '” is not valid for ' + esc(f[1]) + '. ' : 'Enter something to encode. ') + esc(f[3]) + '</span>';
      svg.style.display = valid ? '' : 'none';
      svg.setAttribute('aria-label', valid ? f[1] + ' barcode for ' + v : 'Invalid barcode');
      dlPng.disabled = dlSvg.disabled = !valid;
      val.setAttribute('aria-invalid', String(!valid));
    }
    dlPng.addEventListener('click', function () {
      var c = doc.createElement('canvas');
      window.JsBarcode(c, val.value, opts({ width: Number(wR.value) * 2, height: Number(hR.value) * 2, fontSize: Number(fsR.value) * 2, margin: Number(mR.value) * 2, textMargin: 8 }));
      BT.canvasToBlob(c, 'image/png').then(function (b) { BT.download(b, 'barcode-' + fmtSel.value.toLowerCase() + '.png'); });
    });
    dlSvg.addEventListener('click', function () {
      var s = new XMLSerializer().serializeToString(svg);
      if (s.indexOf('xmlns=') < 0) s = s.replace('<svg', '<svg xmlns="' + svgNS + '"');
      BT.download(new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + s], { type: 'image/svg+xml' }), 'barcode-' + fmtSel.value.toLowerCase() + '.svg');
    });
    BT.loadLib('jsbarcode').then(render).catch(function () { box.innerHTML = '<p class="notice error">Could not load the barcode engine. Please refresh.</p>'; });
  });

  // ================================================== RANDOM NUMBERS
  register('random-number-generator', function (root) {
    injectCSS();
    var min = input('number', 1, { inputmode: 'numeric' }), max = input('number', 100, { inputmode: 'numeric' });
    var count = input('number', 1, { min: 1, max: 10000, inputmode: 'numeric' });
    var typeSeg = seg([['int', 'Whole numbers'], ['dec', 'Decimals']], 'int', function () { dpF.classList.toggle('hidden', typeSeg.value !== 'dec'); }, 'Number type');
    var dp = input('number', 2, { min: 1, max: 10 });
    var dpF = field('Decimal places', dp);
    dpF.classList.add('hidden');
    var dup = checkbox('Allow repeats', false);
    var sortSel = select([['none', 'Random order'], ['asc', 'Smallest first'], ['desc', 'Largest first']], 'none');
    var go = btn('btn-primary btn-lg btn-block', 'shuffle', 'Generate');
    var presets = h('div.chips', null, [['1–6 (dice)', 1, 6, 1], ['1–10', 1, 10, 1], ['1–100', 1, 100, 1], ['Lottery 6 of 49', 1, 49, 6], ['PIN (4 digits)', 0, 9999, 1], ['OTP 6 digits', 100000, 999999, 1]].map(function (p) {
      return h('button.chip', { type: 'button', text: p[0], onclick: function () { min.value = p[1]; max.value = p[2]; count.value = p[3]; typeSeg.set('int'); dpF.classList.add('hidden'); generate(); } });
    }));
    var hero = h('div.ut-hero', { 'aria-live': 'polite' }, [h('div.muted', { text: 'Press Generate' })]);
    var sumEl = h('div.stats.hidden', { style: { marginTop: '14px' } });
    var tools = h('div.btn-group.hidden', { style: { marginTop: '12px', justifyContent: 'center' } });
    var last = [];
    root.appendChild(h('div.split', null, [
      card('Range', [h('div.row.cols-2', null, [field('Minimum', min), field('Maximum', max)]), h('div.field', null, [typeSeg]), dpF,
        h('div.row.cols-2', null, [field('How many numbers', count), field('Order', sortSel)]), h('div.field', null, [dup]), go,
        h('div.field', { style: { marginTop: '16px' } }, [h('span.label', { text: 'Quick presets' }), presets])]),
      h('div', null, [hero, sumEl, tools, h('p.small.muted', { style: { textAlign: 'center', marginTop: '12px' }, text: 'Uses your browser’s cryptographically secure random generator, with unbiased sampling.' })])
    ]));
    function generate() {
      var a = BT.num(min), b = BT.num(max), n = Math.floor(BT.num(count)), isDec = typeSeg.value === 'dec', places = clamp(Math.floor(BT.num(dp) || 2), 1, 10);
      if (!isFinite(a) || !isFinite(b)) return BT.toast('Enter a minimum and maximum', 'error');
      if (a > b) { var t = a; a = b; b = t; min.value = a; max.value = b; }
      if (!(n >= 1)) n = 1;
      if (n > 10000) { n = 10000; count.value = n; }
      var out = [];
      if (!isDec) {
        a = Math.ceil(a); b = Math.floor(b);
        var span = b - a + 1;
        if (span < 1) return BT.toast('There are no whole numbers in that range', 'error');
        if (span > 9007199254740991) return BT.toast('That range is too large', 'error');
        if (!dup.input.checked && n > span) return BT.toast('Only ' + span + ' unique numbers exist in this range. Allow repeats or widen the range.', 'error');
        if (!dup.input.checked && span <= 200000 && n > span / 3) {
          var all = []; for (var i = 0; i < span; i++) all.push(a + i);
          out = shuffle(all).slice(0, n);
        } else {
          var seen = new Set();
          while (out.length < n) { var v = a + randInt(span); if (dup.input.checked || !seen.has(v)) { seen.add(v); out.push(v); } }
        }
      } else {
        var f = Math.pow(10, places), seenD = new Set(), guard = 0;
        while (out.length < n && guard++ < n * 50) {
          var x = Math.round((a + randFloat() * (b - a)) * f) / f;
          if (dup.input.checked || !seenD.has(x)) { seenD.add(x); out.push(x); }
        }
        if (out.length < n) BT.toast('Not enough unique decimals in this range', 'error');
      }
      if (sortSel.value === 'asc') out.sort(function (p, q) { return p - q; });
      if (sortSel.value === 'desc') out.sort(function (p, q) { return q - p; });
      last = out;
      var fmt = function (v) { return isDec ? v.toFixed(places) : String(v); };
      hero.innerHTML = '';
      if (out.length === 1) { hero.appendChild(h('div.n', { text: fmt(out[0]) })); hero.appendChild(h('div.muted.small', { text: 'Between ' + a + ' and ' + b })); }
      else {
        var wrap = h('div.ut-nums');
        out.slice(0, 500).forEach(function (v, i) { var s = h('span', { text: fmt(v) }); s.style.animationDelay = Math.min(i * 25, 600) + 'ms'; wrap.appendChild(s); });
        hero.appendChild(wrap);
        if (out.length > 500) hero.appendChild(h('div.muted.small', { text: 'Showing 500 of ' + out.length + '. Copy or download for the full list.' }));
      }
      var sum = out.reduce(function (p, q) { return p + q; }, 0);
      sumEl.innerHTML = '';
      [['Count', out.length], ['Sum', BT.fmtNum(sum, places)], ['Average', BT.fmtNum(sum / out.length, 3)], ['Range', fmt(Math.min.apply(null, out)) + ' – ' + fmt(Math.max.apply(null, out))]]
        .forEach(function (s) { sumEl.appendChild(stat(s[0], String(s[1]))); });
      sumEl.classList.toggle('hidden', out.length < 2);
      tools.innerHTML = '';
      tools.appendChild(copyBtn(function () { return last.map(fmt).join(', '); }, 'Copy'));
      if (out.length > 1) tools.appendChild(btn('btn-sm', 'download', 'Download .txt', function () { BT.download(new Blob([last.map(fmt).join('\n') + '\n'], { type: 'text/plain' }), 'random-numbers.txt'); }));
      tools.classList.remove('hidden');
    }
    go.addEventListener('click', generate);
    [min, max, count].forEach(function (e) { e.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') generate(); }); });
  });

  // ================================================== COIN & DICE
  var DIE_ROT = { 1: [0, 0], 2: [-90, 0], 3: [0, -90], 4: [0, 90], 5: [90, 0], 6: [0, 180] };
  register('coin-dice-roller', function (root) {
    injectCSS();
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var tabs = seg([['coin', BT.icon('circle') + ' Coin flip'], ['dice', BT.icon('dices') + ' Dice roller']], 'coin', function (v) { coinP.classList.toggle('hidden', v !== 'coin'); diceP.classList.toggle('hidden', v !== 'dice'); }, 'Mode');
    root.appendChild(h('div', { style: { maxWidth: '420px', margin: '0 auto 16px' } }, [tabs]));

    // ---- coin
    var coin = h('div.ut-coin', { html: '<div class="face heads"><div><b>₹</b><small>HEADS</small></div></div><div class="face tails"><div><b>1</b><small>TAILS</small></div></div>' });
    var coinWrap = h('div.ut-coin-wrap', null, [coin]);
    var coinRes = h('div.ut-big', { 'aria-live': 'polite', style: { textAlign: 'center', minHeight: '1.2em' } });
    var flipBtn = btn('btn-primary btn-lg', 'refresh-cw', 'Flip coin');
    var cStats = { h: 0, t: 0, hist: [], streak: 0, last: null };
    var sH = stat('Heads', '0'), sT = stat('Tails', '0'), sS = stat('Current streak', '—');
    var cHist = h('div.ut-hist');
    var coinAngle = 0, flipping = false;
    var coinP = h('div', null, [card(null, [h('div.ut-stage3d', null, [coinWrap]), coinRes, h('div.ut-ctrl', null, [flipBtn, btn('', 'undo-2', 'Reset', function () {
      cStats = { h: 0, t: 0, hist: [], streak: 0, last: null }; updCoin(); coinRes.textContent = '';
    })])]), card('History', [h('div.stats', null, [sH, sT, sS]), h('div', { style: { height: '12px' } }), cHist])]);
    function updCoin() {
      var tot = cStats.h + cStats.t;
      sH.set(cStats.h + (tot ? ' (' + Math.round(cStats.h / tot * 100) + '%)' : ''));
      sT.set(cStats.t + (tot ? ' (' + Math.round(cStats.t / tot * 100) + '%)' : ''));
      sS.set(cStats.last ? cStats.streak + ' × ' + (cStats.last === 'H' ? 'Heads' : 'Tails') : '—');
      cHist.innerHTML = cStats.hist.slice(-40).map(function (x) { return '<span class="' + x.toLowerCase() + '">' + x + '</span>'; }).join('') || '<span class="muted small" style="border:0;background:none">No flips yet</span>';
    }
    flipBtn.addEventListener('click', function () {
      if (flipping) return;
      flipping = true;
      var heads = randInt(2) === 0;
      var base = Math.ceil(coinAngle / 360) * 360 + 360 * 5;
      coinAngle = base + (heads ? 0 : 180);
      coinWrap.classList.remove('toss');
      void coinWrap.offsetWidth;
      if (!reduce) coinWrap.classList.add('toss');
      coin.style.transform = 'rotateY(' + coinAngle + 'deg)';
      coinRes.textContent = '';
      setTimeout(function () {
        flipping = false;
        var r = heads ? 'H' : 'T';
        cStats[heads ? 'h' : 't']++;
        cStats.streak = cStats.last === r ? cStats.streak + 1 : 1;
        cStats.last = r;
        cStats.hist.push(r);
        coinRes.textContent = heads ? 'Heads!' : 'Tails!';
        updCoin();
      }, reduce ? 50 : 1600);
    });
    updCoin();

    // ---- dice
    var nDice = 2, rolling = false;
    var diceBox = h('div.ut-dice');
    var diceRes = h('div.ut-big', { 'aria-live': 'polite', style: { textAlign: 'center', minHeight: '1.2em' } });
    var rollBtn = btn('btn-primary btn-lg', 'dices', 'Roll dice');
    var countSel = select([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) { return [String(n), n + (n === 1 ? ' die' : ' dice')]; }), '2');
    countSel.style.width = 'auto';
    var dHist = h('div.table-wrap', { style: { maxHeight: '260px', overflow: 'auto' } });
    var sRolls = stat('Rolls', '0'), sAvg = stat('Average total', '—'), sBest = stat('Highest total', '—');
    var rolls = [];
    var dice = [];
    var diceP = h('div.hidden', null, [card(null, [
      h('div.toolbar', { style: { justifyContent: 'center' } }, [h('label.label', { 'for': countSel.id, text: 'Number of dice' }), countSel]),
      diceBox, diceRes, h('div.ut-ctrl', null, [rollBtn, btn('', 'undo-2', 'Reset', function () { rolls = []; updDice(); diceRes.textContent = ''; })])
    ]), card('History', [h('div.stats', null, [sRolls, sAvg, sBest]), h('div', { style: { height: '12px' } }), dHist])]);
    function buildDice() {
      diceBox.innerHTML = '';
      dice = [];
      var size = nDice > 6 ? 56 : nDice > 3 ? 64 : 80;
      for (var i = 0; i < nDice; i++) {
        var d = h('div.ut-die', { 'aria-hidden': 'true' });
        d.style.setProperty('--s', size + 'px');
        for (var f = 1; f <= 6; f++) d.appendChild(h('div.f.f' + f, { html: '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>' }));
        d._rx = 0; d._ry = 0; d._spins = 0;
        d.style.transform = 'rotateX(-20deg) rotateY(25deg)';
        diceBox.appendChild(d);
        dice.push(d);
      }
    }
    function updDice() {
      sRolls.set(String(rolls.length));
      if (rolls.length) {
        var tot = rolls.map(function (r) { return r.reduce(function (a, b) { return a + b; }, 0); });
        sAvg.set((tot.reduce(function (a, b) { return a + b; }, 0) / tot.length).toFixed(2));
        sBest.set(String(Math.max.apply(null, tot)));
      } else { sAvg.set('—'); sBest.set('—'); }
      dHist.innerHTML = rolls.length ? '<table class="table"><thead><tr><th>#</th><th>Dice</th><th class="num">Total</th></tr></thead><tbody>' +
        rolls.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td><td>' + r.join(' · ') + '</td><td class="num"><b>' + r.reduce(function (a, b) { return a + b; }, 0) + '</b></td></tr>'; }).reverse().join('') + '</tbody></table>'
        : '<p class="muted small" style="padding:12px;margin:0">No rolls yet</p>';
    }
    countSel.addEventListener('change', function () { nDice = Number(countSel.value); buildDice(); });
    rollBtn.addEventListener('click', function () {
      if (rolling) return;
      rolling = true;
      var res = dice.map(function () { return randInt(6) + 1; });
      dice.forEach(function (d, i) {
        var t = DIE_ROT[res[i]];
        d._spins += 2 + randInt(2);
        var rx = t[0] + 360 * d._spins, ry = t[1] + 360 * d._spins * (randInt(2) ? 1 : -1);
        d.style.transitionDuration = reduce ? '0s' : (1 + i * 0.08) + 's';
        d.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
      });
      diceRes.textContent = '';
      setTimeout(function () {
        rolling = false;
        rolls.push(res);
        var total = res.reduce(function (a, b) { return a + b; }, 0);
        diceRes.textContent = (res.length > 1 ? res.join(' + ') + ' = ' : 'You rolled ') + total;
        updDice();
      }, reduce ? 50 : 1200 + nDice * 80);
    });
    root.appendChild(coinP);
    root.appendChild(diceP);
    buildDice();
    updDice();
  });

  // ===================================================== RANDOM PICKER
  var TEAM_COLOURS = ['#e5484d', '#0090ff', '#12a594', '#f76b15', '#8e4ec6', '#d6409f', '#3e63dd', '#ad7f58', '#46a758', '#e54666'];
  register('random-picker', function (root) {
    injectCSS();
    var ta = textarea(store('bt-picker-list') || 'Aarav\nAnanya\nVihaan\nDiya\nArjun\nIsha\nKabir\nMeera\nRohan\nSara\nVivaan\nZara', { rows: 10, spellcheck: 'false' });
    var cnt = h('span.badge');
    var dedupe = checkbox('Ignore duplicates', true);
    var mode = seg([['pick', 'Pick winners'], ['teams', 'Make teams']], 'pick', function (v) { pickOpts.classList.toggle('hidden', v !== 'pick'); teamOpts.classList.toggle('hidden', v !== 'teams'); }, 'Mode');
    var nWin = input('number', 1, { min: 1, inputmode: 'numeric' });
    var removePicked = checkbox('Remove winners from the list', false);
    var pickBtn = btn('btn-primary btn-lg btn-block', 'gift', 'Pick winner');
    var pickOpts = h('div', null, [field('Number of winners', nWin), h('div.field', null, [removePicked]), pickBtn]);
    var teamBy = seg([['count', 'Number of teams'], ['size', 'People per team']], 'count', function () { tNum.value = teamBy.value === 'count' ? 2 : 3; }, 'Split by');
    var tNum = input('number', 2, { min: 1, inputmode: 'numeric' });
    var teamBtn = btn('btn-primary btn-lg btn-block', 'users', 'Make teams');
    var teamOpts = h('div.hidden', null, [h('div.field', null, [teamBy]), field('How many', tNum), teamBtn]);
    var reel = h('div.ut-reel', { 'aria-live': 'polite' }, [h('span.muted', { style: { fontSize: '1rem', fontWeight: 500 }, text: 'Your result will appear here' })]);
    var results = h('div');
    var resTools = h('div.btn-group.hidden', { style: { marginTop: '16px', justifyContent: 'center' } });
    var resultText = '';
    root.appendChild(h('div.split', null, [
      card('Entries', [h('div.field', null, [h('label', { 'for': ta.id, html: 'One name or item per line ' }), ta, h('div', null, [cnt])]), h('div.toolbar', null, [dedupe,
        h('span.spacer'), btn('btn-sm btn-ghost', 'shuffle', 'Shuffle list', function () { ta.value = shuffle(entries()).join('\n'); upd(); }),
        btn('btn-sm btn-ghost', 'trash-2', 'Clear', function () { ta.value = ''; upd(); ta.focus(); })])]),
      h('div', null, [card('Options', [h('div.field', null, [mode]), pickOpts, teamOpts]),
        h('div.ut-hero', { style: { marginTop: '16px' } }, [reel, results, resTools])])
    ]));
    resTools.appendChild(copyBtn(function () { return resultText; }, 'Copy results'));
    function entries() {
      var list = ta.value.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (dedupe.input.checked) { var seen = {}; list = list.filter(function (s) { var k = s.toLowerCase(); if (seen[k]) return false; seen[k] = 1; return true; }); }
      return list;
    }
    function upd() {
      var n = entries().length;
      cnt.textContent = n + ' entr' + (n === 1 ? 'y' : 'ies');
      store('bt-picker-list', ta.value);
      nWin.max = Math.max(1, n);
    }
    ta.addEventListener('input', upd);
    dedupe.input.addEventListener('change', upd);
    nWin.addEventListener('input', function () { pickBtn.querySelector('span').textContent = (BT.num(nWin) > 1 ? 'Pick winners' : 'Pick winner'); });
    var busy = false;
    pickBtn.addEventListener('click', function () {
      if (busy) return;
      var list = entries();
      if (list.length < 1) return BT.toast('Add at least one entry', 'error');
      var n = clamp(Math.floor(BT.num(nWin) || 1), 1, list.length);
      var winners = shuffle(list.slice()).slice(0, n);
      busy = true;
      results.innerHTML = '';
      resTools.classList.add('hidden');
      reel.classList.add('spin');
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      var delay = 40, elapsed = 0;
      (function tick() {
        reel.textContent = list[randInt(list.length)];
        elapsed += delay;
        if (!reduce && elapsed < 2200) { delay = Math.min(260, delay * 1.12); setTimeout(tick, delay); return; }
        reel.classList.remove('spin');
        reel.textContent = n === 1 ? '🎉 ' + winners[0] : '🎉 ' + n + ' winners';
        var w = h('div.ut-winners');
        winners.forEach(function (name, i) {
          var p = h('div.w', null, [h('i', { text: String(i + 1) }), h('span', { text: name })]);
          p.style.animationDelay = (i * 90) + 'ms';
          w.appendChild(p);
        });
        results.appendChild(w);
        resultText = winners.map(function (x, i) { return (i + 1) + '. ' + x; }).join('\n');
        resTools.classList.remove('hidden');
        if (removePicked.input.checked) {
          var lines = ta.value.split(/\r?\n/);
          winners.forEach(function (wn) {
            var idx = lines.findIndex(function (l) { return l.trim().toLowerCase() === wn.toLowerCase(); });
            if (idx >= 0) lines.splice(idx, 1);
          });
          ta.value = lines.join('\n');
          upd();
        }
        busy = false;
      })();
    });
    teamBtn.addEventListener('click', function () {
      var list = shuffle(entries());
      if (list.length < 2) return BT.toast('Add at least two entries', 'error');
      var v = Math.max(1, Math.floor(BT.num(tNum) || 1));
      var k = teamBy.value === 'count' ? Math.min(v, list.length) : Math.ceil(list.length / v);
      var teams = [];
      for (var i = 0; i < k; i++) teams.push([]);
      list.forEach(function (name, i) { teams[i % k].push(name); });
      reel.textContent = k + ' teams';
      results.innerHTML = '';
      var grid = h('div.ut-teams', { style: { textAlign: 'left', width: '100%' } });
      teams.forEach(function (t, i) {
        var c = h('div.ut-team', null, [h('h4', { style: { background: TEAM_COLOURS[i % TEAM_COLOURS.length] }, html: '<span>Team ' + (i + 1) + '</span><span>' + t.length + '</span>' }),
          h('ol', { html: t.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') })]);
        c.style.animationDelay = (i * 80) + 'ms';
        grid.appendChild(c);
      });
      results.appendChild(grid);
      resultText = teams.map(function (t, i) { return 'Team ' + (i + 1) + ': ' + t.join(', '); }).join('\n');
      resTools.classList.remove('hidden');
    });
    upd();
  });

  // ================================================= STOPWATCH & TIMER
  var audioCtx = null;
  function ensureAudio() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { audioCtx = null; }
  }
  function beep(times, freq) {
    ensureAudio();
    if (!audioCtx) return;
    var t = audioCtx.currentTime + 0.05;
    for (var i = 0; i < (times || 3); i++) {
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = freq || 880;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t); o.stop(t + 0.25);
      t += 0.35;
    }
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtClock(ms, showMs) {
    ms = Math.max(0, ms);
    var tot = Math.floor(ms / 1000), hh = Math.floor(tot / 3600), mm = Math.floor(tot % 3600 / 60), ss = tot % 60;
    var s = (hh ? hh + ':' + pad2(mm) : pad2(mm)) + ':' + pad2(ss);
    if (showMs) s += '.' + ('00' + Math.floor(ms % 1000)).slice(-3);
    return s;
  }
  function ring(color) {
    var R = 54, C = 2 * Math.PI * R;
    var el = h('div.ut-ring', { html: '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="' + R + '" fill="none" stroke="var(--surface-2)" stroke-width="7"/><circle class="p" cx="60" cy="60" r="' + R + '" fill="none" stroke="' + color + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="0"/></svg><div class="c"></div>' });
    var p = el.querySelector('.p');
    el.set = function (frac) { p.setAttribute('stroke-dashoffset', String(C * (1 - clamp(frac, 0, 1)))); };
    el.setColor = function (c) { p.setAttribute('stroke', c); };
    el.center = el.querySelector('.c');
    return el;
  }

  register('stopwatch-timer', function (root) {
    injectCSS();
    var baseTitle = doc.title;
    var tabs = seg([['sw', BT.icon('timer') + ' Stopwatch'], ['timer', BT.icon('clock') + ' Timer'], ['pomo', BT.icon('flame') + ' Pomodoro']], 'sw', function (v) {
      [swP, tmP, poP].forEach(function (p) { p.classList.add('hidden'); });
      ({ sw: swP, timer: tmP, pomo: poP })[v].classList.remove('hidden');
      draw();
    }, 'Mode');
    root.appendChild(h('div', { style: { maxWidth: '520px', margin: '0 auto 16px' } }, [tabs]));

    // ---- Stopwatch
    var sw = { running: false, acc: 0, t0: 0, laps: [] };
    function swNow() { return sw.acc + (sw.running ? performance.now() - sw.t0 : 0); }
    var swClock = h('div.ut-clock', { role: 'timer', 'aria-live': 'off' });
    var swStart = btn('btn-primary btn-lg', 'zap', 'Start'), swLap = btn('btn-lg', 'list-ordered', 'Lap'), swReset = btn('btn-lg', 'undo-2', 'Reset');
    var lapBox = h('div.table-wrap.hidden', { style: { marginTop: '18px', maxHeight: '320px', overflow: 'auto' } });
    var swP = h('div', null, [card(null, [h('div', { style: { padding: '18px 0 4px' } }, [swClock]), h('div.ut-ctrl', null, [swStart, swLap, swReset]), lapBox,
      h('p.small.muted', { style: { textAlign: 'center', margin: '14px 0 0' }, text: 'Keyboard: Space = start/pause, L = lap, R = reset' })])]);
    swStart.addEventListener('click', function () {
      if (sw.running) { sw.acc = swNow(); sw.running = false; }
      else { sw.t0 = performance.now(); sw.running = true; loop(); }
      swUi();
    });
    swLap.addEventListener('click', function () { if (!sw.running && !sw.acc) return; sw.laps.push(swNow()); renderLaps(); });
    swReset.addEventListener('click', function () { sw = { running: false, acc: 0, t0: 0, laps: [] }; renderLaps(); swUi(); draw(); });
    function swUi() {
      swStart.innerHTML = BT.icon(sw.running ? 'minus' : 'zap') + '<span>' + (sw.running ? 'Pause' : (sw.acc ? 'Resume' : 'Start')) + '</span>';
      swLap.disabled = !sw.running;
    }
    function renderLaps() {
      lapBox.classList.toggle('hidden', !sw.laps.length);
      if (!sw.laps.length) { lapBox.innerHTML = ''; return; }
      var splits = sw.laps.map(function (t, i) { return t - (i ? sw.laps[i - 1] : 0); });
      var best = Math.min.apply(null, splits), worst = Math.max.apply(null, splits);
      lapBox.innerHTML = '<table class="table ut-laps"><thead><tr><th>Lap</th><th class="num">Lap time</th><th class="num">Total</th></tr></thead><tbody>' +
        sw.laps.map(function (t, i) {
          var cls = splits.length > 1 ? (splits[i] === best ? ' best' : splits[i] === worst ? ' worst' : '') : '';
          return '<tr><td>' + (i + 1) + '</td><td class="num' + cls + '">' + fmtClock(splits[i], true) + '</td><td class="num">' + fmtClock(t, true) + '</td></tr>';
        }).reverse().join('') + '</tbody></table>';
    }

    // ---- Timer
    var tm = { running: false, total: 5 * 60000, remain: 5 * 60000, end: 0, done: false };
    var tH = input('number', 0, { min: 0, max: 99, 'aria-label': 'Hours', inputmode: 'numeric' }), tM = input('number', 5, { min: 0, max: 59, 'aria-label': 'Minutes', inputmode: 'numeric' }), tS = input('number', 0, { min: 0, max: 59, 'aria-label': 'Seconds', inputmode: 'numeric' });
    var tRing = ring('#d6409f');
    var tClock = h('div.ut-clock', { role: 'timer' });
    tRing.center.appendChild(h('div', null, [tClock, h('div.muted.small', { id: nid('tl'), text: 'Timer' })]));
    var tLabel = tRing.center.querySelector('.muted');
    var tStart = btn('btn-primary btn-lg', 'zap', 'Start'), tReset = btn('btn-lg', 'undo-2', 'Reset');
    var hms = h('div.ut-hms', null, [field('Hours', tH), field('Minutes', tM), field('Seconds', tS)]);
    var presets = h('div.chips', { style: { justifyContent: 'center', marginTop: '6px' } }, [1, 2, 3, 5, 10, 15, 20, 30, 45, 60].map(function (m) {
      return h('button.chip', { type: 'button', text: m < 60 ? m + ' min' : '1 hour', onclick: function () { tH.value = Math.floor(m / 60); tM.value = m % 60; tS.value = 0; setFromInputs(); } });
    }));
    var tmP = h('div.hidden', null, [card(null, [tRing, h('div.ut-ctrl', null, [tStart, tReset]), h('div.bi-sec', { style: { marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' } }, [hms, presets])])]);
    function setFromInputs() {
      if (tm.running) return;
      var ms = ((BT.num(tH) || 0) * 3600 + (BT.num(tM) || 0) * 60 + (BT.num(tS) || 0)) * 1000;
      tm.total = tm.remain = Math.max(0, ms);
      tm.done = false;
      draw();
      tmUi();
    }
    [tH, tM, tS].forEach(function (e) { e.addEventListener('input', setFromInputs); });
    tStart.addEventListener('click', function () {
      ensureAudio();
      if (tm.running) { tm.remain = Math.max(0, tm.end - Date.now()); tm.running = false; }
      else {
        if (tm.done || tm.remain <= 0) setFromInputs();
        if (tm.remain <= 0) return BT.toast('Set a time first', 'error');
        tm.end = Date.now() + tm.remain; tm.running = true; tm.done = false; loop();
      }
      tmUi();
    });
    tReset.addEventListener('click', function () { tm.running = false; tm.done = false; setFromInputs(); doc.title = baseTitle; });
    function tmUi() {
      tStart.innerHTML = BT.icon(tm.running ? 'minus' : 'zap') + '<span>' + (tm.running ? 'Pause' : tm.remain < tm.total && tm.remain > 0 ? 'Resume' : 'Start') + '</span>';
      [tH, tM, tS].forEach(function (e) { e.disabled = tm.running; });
    }

    // ---- Pomodoro
    var PH = { work: ['Focus', '#e5484d'], short: ['Short break', '#12a594'], long: ['Long break', '#0090ff'] };
    var po = { phase: 'work', running: false, remain: 25 * 60000, end: 0, done: 0, dur: { work: 25, short: 5, long: 15 } };
    var pRing = ring(PH.work[1]);
    var pClock = h('div.ut-clock', { role: 'timer' });
    var pPhase = h('span.ut-phase');
    var pDots = h('div.ut-dots', { 'aria-hidden': 'true' });
    var pCount = h('div.muted.small');
    pRing.center.appendChild(h('div', null, [pPhase, pClock, pDots, pCount]));
    var pStart = btn('btn-primary btn-lg', 'zap', 'Start'), pSkip = btn('btn-lg', 'chevron-right', 'Skip'), pReset = btn('btn-lg', 'undo-2', 'Reset');
    var auto = checkbox('Start the next session automatically', true);
    var dW = input('number', 25, { min: 1, max: 120 }), dS = input('number', 5, { min: 1, max: 60 }), dL = input('number', 15, { min: 1, max: 60 });
    var poP = h('div.hidden', null, [card(null, [pRing, h('div.ut-ctrl', null, [pStart, pSkip, pReset]),
      h('div', { style: { marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' } }, [h('div.row.cols-3', null, [field('Focus (min)', dW), field('Short break', dS), field('Long break', dL)]), auto,
        h('p.small.muted', { style: { margin: '10px 0 0' }, text: 'A long break follows every 4 focus sessions.' })])])]);
    [dW, dS, dL].forEach(function (e) {
      e.addEventListener('input', function () {
        po.dur = { work: clamp(BT.num(dW) || 25, 1, 120), short: clamp(BT.num(dS) || 5, 1, 60), long: clamp(BT.num(dL) || 15, 1, 60) };
        if (!po.running) { po.remain = po.dur[po.phase] * 60000; draw(); }
      });
    });
    function setPhase(p) {
      po.phase = p; po.remain = po.dur[p] * 60000; po.running = false;
      pRing.setColor(PH[p][1]);
    }
    function nextPhase(completed) {
      if (po.phase === 'work' && completed) po.done++;
      var next = po.phase === 'work' ? (po.done > 0 && po.done % 4 === 0 ? 'long' : 'short') : 'work';
      setPhase(next);
      if (auto.input.checked && completed) { po.end = Date.now() + po.remain; po.running = true; loop(); }
      poUi(); draw();
    }
    pStart.addEventListener('click', function () {
      ensureAudio();
      if (po.running) { po.remain = Math.max(0, po.end - Date.now()); po.running = false; }
      else { po.end = Date.now() + po.remain; po.running = true; loop(); }
      poUi();
    });
    pSkip.addEventListener('click', function () { nextPhase(false); });
    pReset.addEventListener('click', function () { po.done = 0; setPhase('work'); poUi(); draw(); doc.title = baseTitle; });
    function poUi() {
      pStart.innerHTML = BT.icon(po.running ? 'minus' : 'zap') + '<span>' + (po.running ? 'Pause' : 'Start') + '</span>';
      pPhase.textContent = PH[po.phase][0];
      pPhase.style.background = 'color-mix(in srgb,' + PH[po.phase][1] + ' 15%, transparent)';
      pPhase.style.color = PH[po.phase][1];
      pDots.innerHTML = [0, 1, 2, 3].map(function (i) { return '<i class="' + (i < po.done % 4 || (po.done && po.done % 4 === 0 && po.phase === 'long') ? 'on' : '') + '"></i>'; }).join('');
      pCount.textContent = po.done + ' session' + (po.done === 1 ? '' : 's') + ' completed';
    }

    // ---- shared clock
    var raf = 0;
    function loop() { if (!raf) raf = requestAnimationFrame(frame); }
    function frame() { raf = 0; tick(); if (sw.running || tm.running || po.running) loop(); }
    function tick() {
      var now = Date.now();
      if (tm.running && now >= tm.end) {
        tm.running = false; tm.remain = 0; tm.done = true; tmUi();
        beep(4, 880);
        BT.toast('Time’s up!');
        doc.title = '⏰ Time’s up! · ' + baseTitle;
      }
      if (po.running && now >= po.end) {
        beep(3, po.phase === 'work' ? 660 : 990);
        BT.toast(po.phase === 'work' ? 'Focus session done. Take a break!' : 'Break over. Back to focus!');
        nextPhase(true);
      }
      draw();
    }
    function draw() {
      var e = swNow();
      swClock.innerHTML = fmtClock(e, false) + '<small>.' + ('00' + Math.floor(e % 1000)).slice(-3) + '</small>';
      var tr = tm.running ? Math.max(0, tm.end - Date.now()) : tm.remain;
      tClock.textContent = fmtClock(Math.ceil(tr / 1000) * 1000);
      tRing.set(tm.total ? tr / tm.total : 0);
      tLabel.textContent = tm.done ? 'Time’s up!' : tm.running ? 'Running' : 'Timer';
      var pr = po.running ? Math.max(0, po.end - Date.now()) : po.remain;
      pClock.textContent = fmtClock(Math.ceil(pr / 1000) * 1000);
      pRing.set(pr / (po.dur[po.phase] * 60000));
      if (tm.running) doc.title = '(' + fmtClock(Math.ceil(tr / 1000) * 1000) + ') Timer · ' + baseTitle;
      else if (po.running) doc.title = '(' + fmtClock(Math.ceil(pr / 1000) * 1000) + ') ' + PH[po.phase][0] + ' · ' + baseTitle;
      else if (!tm.done && doc.title !== baseTitle) doc.title = baseTitle;
    }
    // Background tabs throttle rAF: a slow interval keeps alarms and the title correct.
    setInterval(function () { if (sw.running || tm.running || po.running) tick(); }, 500);
    doc.addEventListener('visibilitychange', function () { if (!doc.hidden && (sw.running || tm.running || po.running)) loop(); });
    doc.addEventListener('keydown', function (e) {
      if (/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey || swP.classList.contains('hidden')) return;
      if (e.key === ' ') { e.preventDefault(); swStart.click(); }
      else if (e.key === 'l' || e.key === 'L') swLap.click();
      else if (e.key === 'r' || e.key === 'R') swReset.click();
    });
    root.appendChild(swP); root.appendChild(tmP); root.appendChild(poP);
    swUi(); tmUi(); poUi(); draw();
    BT.timerDebug = { sw: function () { return sw; }, tm: function () { return tm; } };
  });

  // ==================================================== SIGNATURE MAKER
  var SIG_FONTS = [['Great Vibes', 'Great Vibes'], ['Dancing Script', 'Dancing Script'], ['Allura', 'Allura'], ['Sacramento', 'Sacramento'], ['Satisfy', 'Satisfy'], ['Homemade Apple', 'Homemade Apple']];
  /** Crop a canvas to its non-transparent pixels plus padding. */
  function trimCanvas(c, padPx) {
    var x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data;
    var minX = c.width, minY = c.height, maxX = -1, maxY = -1;
    for (var y = 0; y < c.height; y++) for (var xx = 0; xx < c.width; xx++) {
      if (d[(y * c.width + xx) * 4 + 3] > 8) { if (xx < minX) minX = xx; if (xx > maxX) maxX = xx; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
    if (maxX < 0) return null;
    minX = Math.max(0, minX - padPx); minY = Math.max(0, minY - padPx);
    maxX = Math.min(c.width - 1, maxX + padPx); maxY = Math.min(c.height - 1, maxY + padPx);
    var o = doc.createElement('canvas');
    o.width = maxX - minX + 1; o.height = maxY - minY + 1;
    o.getContext('2d').drawImage(c, minX, minY, o.width, o.height, 0, 0, o.width, o.height);
    return o;
  }
  register('signature-maker', function (root) {
    injectCSS();
    if (!doc.getElementById('ut-sig-fonts')) {
      var l = h('link', { id: 'ut-sig-fonts', rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Allura&family=Dancing+Script:wght@600&family=Great+Vibes&family=Homemade+Apple&family=Sacramento&family=Satisfy&display=swap' });
      doc.head.appendChild(l);
    }
    var S = { color: '#0f1424', width: 3, font: 'Great Vibes', name: 'Your Name', size: 64, white: false };
    var tabs = seg([['draw', BT.icon('pen-tool') + ' Draw'], ['type', BT.icon('type') + ' Type']], 'draw', function (v) { drawP.classList.toggle('hidden', v !== 'draw'); typeP.classList.toggle('hidden', v !== 'type'); if (v === 'draw') resize(); }, 'Signature method');
    root.appendChild(h('div', { style: { maxWidth: '420px', margin: '0 auto 16px' } }, [tabs]));

    // colour + options (shared)
    var sw = h('div.ut-swatches', { role: 'group', 'aria-label': 'Ink colour' });
    [['#0f1424', 'Black'], ['#1d3d9e', 'Blue'], ['#0b5e3b', 'Green'], ['#9b1c1c', 'Red']].forEach(function (c, i) {
      var b = h('button', { type: 'button', title: c[1], 'aria-label': c[1] + ' ink', style: { background: c[0] } });
      if (!i) b.classList.add('active');
      b.addEventListener('click', function () { S.color = c[0]; BT.$$('button', sw).forEach(function (x) { x.classList.toggle('active', x === b); }); custom.value = c[0]; redraw(); renderType(); });
      sw.appendChild(b);
    });
    var custom = input('color', S.color, { 'aria-label': 'Custom ink colour' });
    custom.style.width = '40px'; custom.style.height = '36px';
    custom.addEventListener('input', function () { S.color = custom.value; BT.$$('button', sw).forEach(function (x) { x.classList.remove('active'); }); redraw(); renderType(); });
    sw.appendChild(custom);
    var white = checkbox('White background instead of transparent', false);
    white.input.addEventListener('change', function () { S.white = white.input.checked; });

    // ---- draw
    var cv = h('canvas', { 'aria-label': 'Signature drawing area. Draw with mouse, finger or stylus.', role: 'img' });
    var pad = h('div.ut-sigpad', null, [cv, h('div.line'), h('div.ph', { text: 'Sign above the line' })]);
    var ph = pad.querySelector('.ph');
    var strokes = [], cur = null, dpr = 1;
    var thick = input('range', S.width, { min: 1, max: 10, step: 0.5, 'aria-label': 'Pen thickness' });
    thick.addEventListener('input', function () { S.width = Number(thick.value); });
    var undo = btn('', 'undo-2', 'Undo', function () { strokes.pop(); redraw(); });
    var clear = btn('', 'trash-2', 'Clear', function () { strokes = []; redraw(); });
    var dlDraw = btn('btn-primary', 'download', 'Download PNG');
    var drawP = h('div', null, [card(null, [pad,
      h('div.toolbar', { style: { marginTop: '14px' } }, [h('label.label', { 'for': thick.id, text: 'Pen thickness' }), h('div', { style: { width: '140px' } }, [thick])]),
      h('div.toolbar', null, [undo, clear, h('span.spacer'), dlDraw])])]);
    function resize() {
      var w = cv.clientWidth || pad.clientWidth || 600;
      dpr = Math.min(3, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr); cv.height = Math.round(240 * dpr);
      redraw();
    }
    function paint(ctx, list, scale) {
      list.forEach(function (s) {
        ctx.strokeStyle = ctx.fillStyle = s.color;
        ctx.lineWidth = s.width * scale;
        ctx.lineCap = ctx.lineJoin = 'round';
        var p = s.pts;
        if (p.length === 1) { ctx.beginPath(); ctx.arc(p[0].x * scale, p[0].y * scale, s.width * scale / 2, 0, Math.PI * 2); ctx.fill(); return; }
        ctx.beginPath();
        ctx.moveTo(p[0].x * scale, p[0].y * scale);
        for (var i = 1; i < p.length - 1; i++) {
          var mx = (p[i].x + p[i + 1].x) / 2, my = (p[i].y + p[i + 1].y) / 2;
          ctx.quadraticCurveTo(p[i].x * scale, p[i].y * scale, mx * scale, my * scale);
        }
        var last = p[p.length - 1];
        ctx.lineTo(last.x * scale, last.y * scale);
        ctx.stroke();
      });
    }
    function redraw() {
      var x = cv.getContext('2d');
      x.clearRect(0, 0, cv.width, cv.height);
      paint(x, strokes, dpr);
      ph.style.display = strokes.length ? 'none' : '';
      undo.disabled = clear.disabled = dlDraw.disabled = !strokes.length;
    }
    function pos(e) { var b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
    cv.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      cv.setPointerCapture(e.pointerId);
      cur = { color: S.color, width: S.width, pts: [pos(e)] };
      strokes.push(cur);
      redraw();
    });
    cv.addEventListener('pointermove', function (e) {
      if (!cur) return;
      e.preventDefault();
      var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      (evs.length ? evs : [e]).forEach(function (ev) {
        var p = pos(ev), l = cur.pts[cur.pts.length - 1];
        if (Math.abs(p.x - l.x) + Math.abs(p.y - l.y) > 0.8) cur.pts.push(p);
      });
      redraw();
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { cv.addEventListener(ev, function () { cur = null; }); });
    window.addEventListener('resize', BT.debounce(function () { if (!drawP.classList.contains('hidden')) resize(); }, 150));

    function exportCanvas(c, name) {
      var t = trimCanvas(c, Math.round(c.width * 0.02) + 8);
      if (!t) return BT.toast('Nothing to download yet', 'error');
      if (S.white) {
        var w = doc.createElement('canvas'); w.width = t.width; w.height = t.height;
        var wx = w.getContext('2d'); wx.fillStyle = '#fff'; wx.fillRect(0, 0, w.width, w.height); wx.drawImage(t, 0, 0); t = w;
      }
      BT.canvasToBlob(t, 'image/png').then(function (b) { BT.download(b, name); });
    }
    dlDraw.addEventListener('click', function () {
      var scale = 3, w = cv.width / dpr;
      var c = doc.createElement('canvas'); c.width = Math.round(w * scale); c.height = 240 * scale;
      paint(c.getContext('2d'), strokes, scale);
      exportCanvas(c, 'signature.png');
    });

    // ---- type
    var nameIn = input('text', S.name, { autocomplete: 'name', maxlength: 60 });
    var sizeIn = input('range', S.size, { min: 32, max: 110, 'aria-label': 'Text size' });
    var fontsBox = h('div.ut-fonts', { role: 'group', 'aria-label': 'Signature style' });
    var typePrev = doc.createElement('canvas');
    typePrev.style.width = '100%';
    typePrev.setAttribute('role', 'img');
    typePrev.setAttribute('aria-label', 'Typed signature preview');
    var dlType = btn('btn-primary', 'download', 'Download PNG');
    var typeP = h('div.hidden', null, [card(null, [field('Your name', nameIn), h('div.field', null, [h('span.label', { text: 'Choose a style' }), fontsBox]),
      h('div.toolbar', null, [h('label.label', { 'for': sizeIn.id, text: 'Size' }), h('div', { style: { width: '160px' } }, [sizeIn])]),
      h('div.ut-sigpad', { style: { padding: '8px' } }, [typePrev]),
      h('div.toolbar', { style: { marginTop: '14px' } }, [h('span.spacer'), dlType])])]);
    SIG_FONTS.forEach(function (f) {
      var b = h('button', { type: 'button', 'data-f': f[0], 'aria-pressed': String(f[0] === S.font) }, [h('span', { style: { fontFamily: "'" + f[0] + "', cursive" } }), h('small', { text: f[1] })]);
      if (f[0] === S.font) b.classList.add('active');
      b.addEventListener('click', function () {
        S.font = f[0];
        BT.$$('button', fontsBox).forEach(function (x) { var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-pressed', String(on)); });
        renderType();
      });
      fontsBox.appendChild(b);
    });
    function typeFont(scale) { return (S.font === 'Dancing Script' ? '600 ' : '400 ') + (S.size * scale) + "px '" + S.font + "', cursive"; }
    function renderTypeTo(scale) {
      var c = doc.createElement('canvas'), x = c.getContext('2d');
      x.font = typeFont(scale);
      var w = Math.max(10, x.measureText(S.name || ' ').width);
      c.width = Math.ceil(w + S.size * scale * 1.2);
      c.height = Math.ceil(S.size * scale * 2);
      x.font = typeFont(scale);
      x.fillStyle = S.color;
      x.textBaseline = 'middle';
      x.fillText(S.name, S.size * scale * 0.6, c.height / 2);
      return c;
    }
    function renderType() {
      S.name = nameIn.value;
      BT.$$('button span', fontsBox).forEach(function (s) { s.textContent = S.name || 'Your Name'; s.style.color = S.color; });
      var c = renderTypeTo(2);
      typePrev.width = c.width; typePrev.height = c.height;
      typePrev.style.maxWidth = (c.width / 2) + 'px';
      typePrev.getContext('2d').drawImage(c, 0, 0);
      dlType.disabled = !S.name.trim();
    }
    nameIn.addEventListener('input', renderType);
    sizeIn.addEventListener('input', function () { S.size = Number(sizeIn.value); renderType(); });
    dlType.addEventListener('click', function () {
      var go = function () { exportCanvas(renderTypeTo(3), 'signature-' + (S.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'typed') + '.png'); };
      if (doc.fonts && doc.fonts.load) doc.fonts.load(typeFont(3)).then(go, go); else go();
    });
    root.appendChild(drawP);
    root.appendChild(typeP);
    root.appendChild(card('Ink & export', [h('div.field', null, [h('span.label', { text: 'Ink colour' }), sw]), h('div.field', { style: { margin: 0 } }, [white]), h('p.small.muted', { style: { margin: '8px 0 0' }, text: 'Downloads are trimmed to the signature with a small margin, ready to place on documents. Use Sign PDF to add it to a PDF.' })]));
    renderType();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(renderType);
    SIG_FONTS.forEach(function (f) { if (doc.fonts && doc.fonts.load) doc.fonts.load("40px '" + f[0] + "'").then(renderType, function () {}); });
    requestAnimationFrame(resize);
  });

  // ================================================== GST INVOICE
  var STATES = [
    ['01', 'Jammu and Kashmir'], ['02', 'Himachal Pradesh'], ['03', 'Punjab'], ['04', 'Chandigarh'], ['05', 'Uttarakhand'], ['06', 'Haryana'],
    ['07', 'Delhi'], ['08', 'Rajasthan'], ['09', 'Uttar Pradesh'], ['10', 'Bihar'], ['11', 'Sikkim'], ['12', 'Arunachal Pradesh'],
    ['13', 'Nagaland'], ['14', 'Manipur'], ['15', 'Mizoram'], ['16', 'Tripura'], ['17', 'Meghalaya'], ['18', 'Assam'], ['19', 'West Bengal'],
    ['20', 'Jharkhand'], ['21', 'Odisha'], ['22', 'Chhattisgarh'], ['23', 'Madhya Pradesh'], ['24', 'Gujarat'],
    ['26', 'Dadra and Nagar Haveli and Daman and Diu'], ['27', 'Maharashtra'], ['29', 'Karnataka'], ['30', 'Goa'], ['31', 'Lakshadweep'],
    ['32', 'Kerala'], ['33', 'Tamil Nadu'], ['34', 'Puducherry'], ['35', 'Andaman and Nicobar Islands'], ['36', 'Telangana'],
    ['37', 'Andhra Pradesh'], ['38', 'Ladakh'], ['97', 'Other Territory'], ['96', 'Outside India (export)']
  ];
  function stateName(code) { for (var i = 0; i < STATES.length; i++) if (STATES[i][0] === code) return STATES[i][1]; return ''; }
  var GST_CH = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function gstinCheck(g14) {
    var sum = 0;
    for (var i = 0; i < 14; i++) {
      var p = GST_CH.indexOf(g14[i]) * (i % 2 ? 2 : 1);
      sum += Math.floor(p / 36) + p % 36;
    }
    return GST_CH[(36 - sum % 36) % 36];
  }
  function gstinStatus(g) {
    g = String(g || '').toUpperCase().trim();
    if (!g) return { ok: null };
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return { ok: false, msg: 'GSTIN format looks wrong (15 characters, e.g. 27ABCDE1234F1Z5)' };
    if (gstinCheck(g.slice(0, 14)) !== g[14]) return { ok: false, msg: 'Check digit does not match. Please re-check the GSTIN.' };
    return { ok: true, state: g.slice(0, 2), msg: 'Valid GSTIN · ' + (stateName(g.slice(0, 2)) || 'state ' + g.slice(0, 2)) };
  }
  BT.gstin = { check: gstinCheck, status: gstinStatus };

  var ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function w2(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : ''); }
  function w3(n) { var hh = Math.floor(n / 100), r = n % 100; return (hh ? ONES[hh] + ' Hundred' + (r ? ' ' : '') : '') + (r ? w2(r) : ''); }
  function indianWords(n) {
    n = Math.floor(n);
    if (n === 0) return 'Zero';
    var out = [];
    var crore = Math.floor(n / 1e7); n %= 1e7;
    var lakh = Math.floor(n / 1e5); n %= 1e5;
    var th = Math.floor(n / 1000); n %= 1000;
    if (crore) out.push((crore > 99 ? indianWords(crore) : w2(crore)) + ' Crore');
    if (lakh) out.push(w2(lakh) + ' Lakh');
    if (th) out.push(w2(th) + ' Thousand');
    if (n) out.push(w3(n));
    return out.join(' ');
  }
  function amountWords(amt) {
    amt = Math.round(Math.abs(amt) * 100);
    var r = Math.floor(amt / 100), p = amt % 100;
    return 'Rupees ' + indianWords(r) + (p ? ' and ' + w2(p) + ' Paise' : '') + ' Only';
  }
  BT.amountInWords = amountWords;
  function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function money(n) { return (n < 0 ? '-' : '') + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function isoDate(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function niceDate(s) {
    if (!s) return '';
    var p = s.split('-');
    var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return p.length === 3 ? Number(p[2]) + ' ' + M[Number(p[1]) - 1] + ' ' + p[0] : s;
  }
  function withCheck(g14) { return g14 + gstinCheck(g14); }

  /** Pure calculation, shared with tests via BT.invoiceCalc. */
  function invoiceCalc(d) {
    var intra = d.seller.state === d.pos;
    var lines = d.items.map(function (it) {
      var qty = BT.num(it.qty) || 0, rate = BT.num(it.rate) || 0, disc = clamp(BT.num(it.disc) || 0, 0, 100), gst = BT.num(it.gst) || 0;
      var gross = qty * rate;
      var taxable = r2(gross - gross * disc / 100);
      var tax = r2(taxable * gst / 100);
      var cgst = intra ? r2(tax / 2) : 0, sgst = intra ? r2(tax - cgst) : 0, igst = intra ? 0 : tax;
      return { it: it, qty: qty, rate: rate, disc: disc, gst: gst, taxable: taxable, cgst: cgst, sgst: sgst, igst: igst, total: r2(taxable + tax) };
    });
    var t = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    var byRate = {};
    lines.forEach(function (l) {
      t.taxable += l.taxable; t.cgst += l.cgst; t.sgst += l.sgst; t.igst += l.igst;
      var k = String(l.gst);
      byRate[k] = byRate[k] || { rate: l.gst, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
      ['taxable', 'cgst', 'sgst', 'igst'].forEach(function (f) { byRate[k][f] += l[f]; });
    });
    Object.keys(t).forEach(function (k) { t[k] = r2(t[k]); });
    var gross = r2(t.taxable + t.cgst + t.sgst + t.igst);
    var grand = d.round ? Math.round(gross) : gross;
    return { intra: intra, lines: lines, totals: t, tax: r2(t.cgst + t.sgst + t.igst), gross: gross, roundOff: r2(grand - gross), grand: grand,
      byRate: Object.keys(byRate).map(function (k) { return byRate[k]; }).sort(function (a, b) { return a.rate - b.rate; }) };
  }
  BT.invoiceCalc = invoiceCalc;

  var INV_CSS = [
    '.inv{--acc:#1e3a8a}',
    '.inv-items{display:flex;flex-direction:column;gap:10px}',
    '.inv-row{display:grid;gap:8px;grid-template-columns:1fr 1fr;padding:12px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface-2);position:relative}',
    '.inv-row .c-desc{grid-column:1/-1}.inv-row .c-amt{display:flex;align-items:center;justify-content:space-between;grid-column:1/-1;font-weight:700}',
    '.inv-row label{font-size:.72rem;font-weight:650;color:var(--text-3);display:block;margin-bottom:3px}',
    '.inv-row input,.inv-row select{min-height:38px;padding:7px 10px;font-size:.92rem}',
    '.inv-head{display:none}',
    '@media (min-width:760px){.inv-row,.inv-head{grid-template-columns:minmax(0,3fr) minmax(0,1.1fr) minmax(0,.8fr) minmax(0,1.2fr) minmax(0,.8fr) minmax(0,.9fr) minmax(0,1.2fr) 36px;align-items:center}',
    '.inv-head{display:grid;gap:8px;padding:0 12px;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--text-3)}',
    '.inv-row{padding:8px 12px;background:var(--surface)}.inv-row .c-desc,.inv-row .c-amt{grid-column:auto}.inv-row label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.inv-row .c-amt{justify-content:flex-end}.inv-row .c-amt .lbl{display:none}}',
    '.inv-row .rm{width:36px;height:36px;padding:0}',
    '.inv-gst{font-size:.78rem;margin-top:4px}.inv-gst.ok{color:var(--ok)}.inv-gst.bad{color:var(--danger)}',
    '.inv-supply{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.inv-bar{position:sticky;top:72px;z-index:10;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--glass);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);margin-bottom:16px;box-shadow:var(--shadow-sm)}',
    '.inv-bar .spacer{flex:1}',
    '@media (max-width:719px){.inv-bar{position:static}.inv-bar .spacer{flex-basis:100%;height:0}}',
    '.inv-grid{display:grid;gap:16px}.inv-grid>.card{margin:0}',
    '@media (min-width:900px){.inv-grid.two{grid-template-columns:1fr 1fr}}',
    '.inv-preview-wrap{overflow:hidden;border-radius:6px}',
    '.inv-scale{transform-origin:top left;width:794px}',
    // the paper itself (always light: it is a printed document)
    '.inv-sheet{width:794px;min-height:1123px;background:#fff;color:#1f2937;padding:44px 48px;font:13px/1.45 Inter,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;box-shadow:0 18px 50px -20px rgba(0,0,0,.45);box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
    '.inv-sheet *{box-sizing:border-box}',
    '.inv-sheet .top{display:flex;justify-content:space-between;gap:24px;padding-bottom:18px;border-bottom:3px solid var(--acc)}',
    '.inv-sheet .seller{display:flex;gap:14px;max-width:60%}.inv-sheet .seller img{max-width:110px;max-height:70px;object-fit:contain}',
    '.inv-sheet .seller h2{margin:0 0 4px;font-size:19px;color:#111827;letter-spacing:-.01em}',
    '.inv-sheet .muted{color:#6b7280}.inv-sheet .pre{white-space:pre-line}',
    '.inv-sheet .title{text-align:right}.inv-sheet .title h1{margin:0;font-size:24px;letter-spacing:.08em;color:var(--acc);font-weight:800}',
    '.inv-sheet .title table{margin-left:auto;margin-top:8px;border-collapse:collapse}.inv-sheet .title td{padding:2px 0 2px 14px;text-align:right}.inv-sheet .title td:first-child{color:#6b7280}',
    '.inv-sheet .parties{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:18px 0}',
    '.inv-sheet .box{border:1px solid #e5e7eb;border-radius:6px;padding:12px 14px}',
    '.inv-sheet .box h3{margin:0 0 6px;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--acc)}',
    '.inv-sheet .box b{font-size:14px;color:#111827}',
    '.inv-sheet table.items{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}',
    '.inv-sheet table.items th{background:var(--acc);color:#fff;font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;padding:8px 6px;text-align:left}',
    '.inv-sheet table.items td{padding:8px 6px;border-bottom:1px solid #e5e7eb;vertical-align:top}',
    '.inv-sheet table.items tr:nth-child(even) td{background:#f9fafb}',
    '.inv-sheet .r{text-align:right}.inv-sheet .c{text-align:center}',
    '.inv-sheet .bottom{display:grid;grid-template-columns:1.25fr 1fr;gap:22px;margin-top:16px}',
    '.inv-sheet table.tot{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}.inv-sheet table.tot td{padding:5px 0}.inv-sheet table.tot td:last-child{text-align:right}',
    '.inv-sheet table.tot tr.grand td{border-top:2px solid var(--acc);padding-top:8px;font-size:16px;font-weight:800;color:#111827}',
    '.inv-sheet table.rates{width:100%;border-collapse:collapse;font-size:11px;margin-top:10px;font-variant-numeric:tabular-nums}.inv-sheet table.rates th,.inv-sheet table.rates td{border:1px solid #e5e7eb;padding:4px 6px;text-align:right}.inv-sheet table.rates th{background:#f3f4f6;font-weight:650}',
    '.inv-sheet .words{background:#f3f4f6;border-left:3px solid var(--acc);padding:8px 12px;border-radius:4px;font-weight:600;margin-bottom:12px}',
    '.inv-sheet h5{margin:12px 0 4px;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280}',
    '.inv-sheet .sign{margin-top:36px;text-align:right}.inv-sheet .sign .ln{display:inline-block;min-width:200px;border-top:1px solid #9ca3af;padding-top:4px;margin-top:46px}',
    '.inv-sheet .foot{margin-top:28px;padding-top:10px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#5f6780}',
    '.inv-sheet .tag{display:inline-block;padding:2px 8px;border-radius:99px;background:#eef2ff;color:var(--acc);font-size:10.5px;font-weight:700}',
    '@media print{',
    '  @page{size:A4;margin:10mm}',
    '  body{background:#fff!important}',
    '  .inv .no-print,.ad-slot{display:none!important}',
    '  .inv .inv-preview-card{border:0!important;box-shadow:none!important;padding:0!important;background:none!important}',
    '  .inv .inv-preview-wrap{overflow:visible!important;height:auto!important}',
    '  .inv .inv-scale{transform:none!important;width:auto!important}',
    '  .inv .inv-sheet{width:auto!important;min-height:0!important;box-shadow:none!important;padding:0!important}',
    '  .inv table.items tr{break-inside:avoid}',
    '}'
  ].join('\n');

  function blankItem() { return { id: 'i' + Date.now().toString(36) + randInt(1e6).toString(36), desc: '', hsn: '', qty: '1', rate: '', disc: '0', gst: '18' }; }
  function sampleInvoice() {
    var today = new Date(), due = new Date(Date.now() + 15 * 864e5);
    return {
      seller: { name: 'Sharma Electronics Pvt. Ltd.', address: '402, Lotus Business Park, Andheri East\nMumbai 400069', state: '27', gstin: withCheck('27AABCS1234D1Z'), phone: '+91 98200 12345', email: 'accounts@sharmaelectronics.in', logo: null },
      buyer: { name: 'Patel Traders', address: '12, C.G. Road, Navrangpura\nAhmedabad 380009', gstin: withCheck('24AAFFP5678K1Z') },
      pos: '24', no: 'INV-2026-001', date: isoDate(today), due: isoDate(due), round: true, accent: '#1e3a8a',
      items: [
        { id: 'a1', desc: 'LED Monitor 24" Full HD', hsn: '8528', qty: '4', rate: '8500', disc: '5', gst: '18' },
        { id: 'a2', desc: 'Wireless keyboard & mouse combo', hsn: '8471', qty: '10', rate: '1250', disc: '0', gst: '18' },
        { id: 'a3', desc: 'Installation & setup', hsn: '998713', qty: '1', rate: '2000', disc: '0', gst: '18' }
      ],
      notes: 'Thank you for your business!',
      terms: 'Payment due within 15 days.\nGoods once sold will not be taken back.\nSubject to Mumbai jurisdiction.',
      bank: { name: 'HDFC Bank, Andheri East', acc: '50200012345678', ifsc: 'HDFC0001234', holder: 'Sharma Electronics Pvt. Ltd.', upi: 'sharmaelec@hdfcbank' },
      signatory: 'Authorised Signatory'
    };
  }
  function nextNo(no) {
    var m = String(no || '').match(/^(.*?)(\d+)(\D*)$/);
    if (!m) return (no || 'INV') + '-2';
    var n = String(Number(m[2]) + 1);
    while (n.length < m[2].length) n = '0' + n;
    return m[1] + n + m[3];
  }

  register('invoice-generator', function (root) {
    injectCSS();
    if (!doc.getElementById('inv-style')) { var st = doc.createElement('style'); st.id = 'inv-style'; st.textContent = INV_CSS; doc.head.appendChild(st); }
    var KEY = 'bt-invoice-draft';
    var D;
    try { D = JSON.parse(store(KEY) || 'null'); } catch (e) { D = null; }
    if (!D || !D.seller || !Array.isArray(D.items)) D = sampleInvoice();
    var wrap = h('div.inv');
    root.appendChild(wrap);
    var saveState = h('span.small.muted', { 'aria-live': 'polite' });

    function stateSelect(path) {
      var s = select(STATES, getP(path));
      s.setAttribute('data-p', path);
      return s;
    }
    function getP(path) { return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, D); }
    function setP(path, v) { var ks = path.split('.'), o = D; for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]] = o[ks[i]] || {}; o[ks[ks.length - 1]] = v; }
    function bound(type, path, attrs) {
      var el = type === 'textarea' ? textarea(getP(path) || '', Object.assign({ rows: 3, style: { minHeight: '76px' } }, attrs || {})) : input(type, getP(path) == null ? '' : getP(path), attrs);
      el.setAttribute('data-p', path);
      return el;
    }
    function gstHint(path) { var e = h('div.inv-gst'); e.setAttribute('data-gst-for', path); return e; }

    // ---- toolbar
    var pdfBtn = btn('btn-primary', 'download', 'Download PDF');
    var bar = h('div.inv-bar.no-print', null, [pdfBtn,
      btn('', 'file-plus', 'New invoice', function () {
        if (!confirm('Start a new invoice? Your business and bank details are kept; customer and items are cleared.')) return;
        D.buyer = { name: '', address: '', gstin: '' }; D.items = [blankItem()]; D.no = nextNo(D.no); D.date = isoDate(new Date()); D.due = isoDate(new Date(Date.now() + 15 * 864e5)); D.notes = 'Thank you for your business!';
        build();
      }),
      btn('btn-ghost', 'sparkles', 'Sample', function () { D = sampleInvoice(); build(); }),
      btn('btn-ghost', 'trash-2', 'Clear all', function () {
        if (!confirm('Clear every field, including your business details?')) return;
        D = sampleInvoice();
        D.seller = { name: '', address: '', state: '27', gstin: '', phone: '', email: '', logo: null };
        D.buyer = { name: '', address: '', gstin: '' }; D.items = [blankItem()]; D.notes = ''; D.terms = ''; D.bank = { name: '', acc: '', ifsc: '', holder: '', upi: '' }; D.no = 'INV-001';
        build();
      }),
      h('span.spacer'), saveState]);

    var sheetHost = h('div.inv-scale');
    var previewWrap = h('div.inv-preview-wrap', null, [sheetHost]);
    var editor = h('div.no-print');
    var previewCard = h('div.card.inv-preview-card', { style: { marginTop: '16px' } }, [h('div.card-title.no-print', null, [h('h3', { text: 'Live preview' }), h('span.badge', { text: 'A4' })]), previewWrap]);
    wrap.appendChild(bar);
    wrap.appendChild(editor);
    wrap.appendChild(previewCard);

    var itemsBox, rowsById = {};
    function build() {
      editor.innerHTML = '';
      rowsById = {};
      D.seller = D.seller || {}; D.buyer = D.buyer || {}; D.bank = D.bank || {};
      // seller
      var logoIn = input('file', null, { accept: 'image/*', 'aria-label': 'Upload logo' });
      var logoRm = btn('btn-sm btn-ghost' + (D.seller.logo ? '' : ' hidden'), 'x', 'Remove logo', function () { D.seller.logo = null; logoRm.classList.add('hidden'); logoIn.value = ''; changed(); });
      logoIn.addEventListener('change', function () {
        var f = logoIn.files && logoIn.files[0];
        if (!f) return;
        BT.loadImage(f).then(function (img) {
          var s = Math.min(1, 360 / Math.max(img.naturalWidth, img.naturalHeight));
          var c = doc.createElement('canvas'); c.width = Math.max(1, Math.round(img.naturalWidth * s)); c.height = Math.max(1, Math.round(img.naturalHeight * s));
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(img.src);
          D.seller.logo = c.toDataURL('image/png');
          logoRm.classList.remove('hidden');
          changed();
        }).catch(function () { BT.toast('Could not read that image', 'error'); });
      });
      var sellerCard = card('From (your business)', [
        field('Business name', bound('text', 'seller.name', { autocomplete: 'organization' })),
        field('Address', bound('textarea', 'seller.address')),
        h('div.row.cols-2', null, [field('State', stateSelect('seller.state')), h('div.field', null, [h('label', { 'for': 'x', text: 'GSTIN' }), bound('text', 'seller.gstin', { maxlength: 15, autocapitalize: 'characters', spellcheck: 'false', placeholder: '27ABCDE1234F1Z5' }), gstHint('seller.gstin')])]),
        h('div.row.cols-2', null, [field('Phone', bound('tel', 'seller.phone')), field('Email', bound('email', 'seller.email'))]),
        h('div.field', null, [h('label', { 'for': logoIn.id, text: 'Logo (optional)' }), logoIn, logoRm])
      ]);
      // fix label for GSTIN
      var sg = sellerCard.querySelector('[data-p="seller.gstin"]'); sg.previousSibling.setAttribute('for', sg.id);
      var buyerCard = card('Bill to (customer)', [
        field('Customer name', bound('text', 'buyer.name')),
        field('Address', bound('textarea', 'buyer.address')),
        h('div.row.cols-2', null, [field('Place of supply (state)', stateSelect('pos')), h('div.field', null, [h('label', { text: 'Customer GSTIN (optional)' }), bound('text', 'buyer.gstin', { maxlength: 15, autocapitalize: 'characters', spellcheck: 'false', placeholder: 'Leave empty for B2C' }), gstHint('buyer.gstin')])]),
        h('div.inv-supply', { 'data-supply': '1' })
      ]);
      var bg = buyerCard.querySelector('[data-p="buyer.gstin"]'); bg.previousSibling.setAttribute('for', bg.id);
      var accent = bound('color', 'accent');
      var roundCb = checkbox('Round off total to nearest rupee', D.round !== false);
      roundCb.input.setAttribute('data-p', 'round');
      var detailsCard = card('Invoice details', [h('div.row.cols-3', null, [field('Invoice number', bound('text', 'no')), field('Invoice date', bound('date', 'date')), field('Due date', bound('date', 'due'))]),
        h('div.toolbar', { style: { margin: 0 } }, [roundCb, h('span.spacer'), h('label.label', { 'for': accent.id, text: 'Accent colour' }), accent])]);
      itemsBox = h('div.inv-items');
      var head = h('div.inv-head', { 'aria-hidden': 'true', html: '<span>Description</span><span>HSN/SAC</span><span>Qty</span><span>Rate (₹)</span><span>Disc %</span><span>GST %</span><span style="text-align:right">Amount</span><span></span>' });
      var addBtn = btn('', 'plus', 'Add item', function () { var it = blankItem(); D.items.push(it); var r = itemRow(it); itemsBox.appendChild(r); r.querySelector('input').focus(); changed(); });
      var itemsCard = card('Items', [head, itemsBox, h('div', { style: { marginTop: '12px' } }, [addBtn])]);
      D.items.forEach(function (it) { if (!it.id) it.id = blankItem().id; itemsBox.appendChild(itemRow(it)); });
      var notesCard = card('Notes & terms', [field('Notes', bound('textarea', 'notes', { rows: 2, style: { minHeight: '60px' } })), field('Terms & conditions', bound('textarea', 'terms'))]);
      var bankCard = card('Payment & signature', [
        h('div.row.cols-2', null, [field('Bank name & branch', bound('text', 'bank.name')), field('Account holder', bound('text', 'bank.holder'))]),
        h('div.row.cols-2', null, [field('Account number', bound('text', 'bank.acc', { inputmode: 'numeric' })), field('IFSC', bound('text', 'bank.ifsc', { autocapitalize: 'characters', maxlength: 11 }))]),
        h('div.row.cols-2', null, [field('UPI ID (optional)', bound('text', 'bank.upi')), field('Signature line text', bound('text', 'signatory'))])
      ]);
      [h('div.inv-grid.two', null, [sellerCard, buyerCard]), detailsCard, itemsCard, h('div.inv-grid.two', null, [notesCard, bankCard])].forEach(function (e) {
        e.style.marginTop = '16px';
        editor.appendChild(e);
      });
      editor.firstChild.style.marginTop = '0';
      changed(true);
    }

    function itemRow(it) {
      var row = h('div.inv-row', { 'data-id': it.id });
      function cell(cls, label, el) { el.setAttribute('data-f', cls); return h('div.c-' + cls, null, [h('label', { 'for': el.id, text: label }), el]); }
      var gsel = select([['0', '0%'], ['0.25', '0.25%'], ['3', '3%'], ['5', '5%'], ['12', '12%'], ['18', '18%'], ['28', '28%'], ['40', '40%']], String(it.gst));
      var amt = h('strong', { text: '₹0.00' });
      row.appendChild(cell('desc', 'Description', input('text', it.desc, { placeholder: 'Item or service' })));
      row.appendChild(cell('hsn', 'HSN/SAC', input('text', it.hsn, { inputmode: 'numeric', maxlength: 8 })));
      row.appendChild(cell('qty', 'Qty', input('number', it.qty, { min: 0, step: 'any', inputmode: 'decimal' })));
      row.appendChild(cell('rate', 'Rate (₹)', input('number', it.rate, { min: 0, step: 'any', inputmode: 'decimal' })));
      row.appendChild(cell('disc', 'Discount %', input('number', it.disc, { min: 0, max: 100, step: 'any', inputmode: 'decimal' })));
      row.appendChild(cell('gst', 'GST %', gsel));
      row.appendChild(h('div.c-amt', null, [h('span.lbl.muted.small', { text: 'Amount (incl. GST)' }), amt]));
      var rm = h('button.btn.btn-ghost.rm', { type: 'button', 'aria-label': 'Remove item', title: 'Remove item', html: BT.icon('trash-2') });
      rm.addEventListener('click', function () {
        if (D.items.length === 1) { BT.toast('An invoice needs at least one item'); return; }
        D.items = D.items.filter(function (x) { return x.id !== it.id; });
        delete rowsById[it.id];
        row.remove();
        changed();
      });
      row.appendChild(rm);
      row.amt = amt;
      rowsById[it.id] = row;
      return row;
    }

    // One delegated listener: update the model; never rebuild inputs while typing.
    function onEdit(e) {
      var t = e.target;
      var p = t.getAttribute && t.getAttribute('data-p');
      if (p) {
        var v = t.type === 'checkbox' ? t.checked : t.value;
        if (/gstin$/.test(p)) {
          v = v.toUpperCase();
          if (t.value !== v) { var pos = t.selectionStart; t.value = v; try { t.setSelectionRange(pos, pos); } catch (err) { /* ignore */ } }
          var stt = gstinStatus(v);
          if (stt.ok && stateName(stt.state)) {
            var target = p === 'seller.gstin' ? 'seller.state' : 'pos';
            if (getP(target) !== stt.state) { setP(target, stt.state); var sel = editor.querySelector('[data-p="' + target + '"]'); if (sel) sel.value = stt.state; }
          }
        }
        setP(p, v);
        changed();
        return;
      }
      var f = t.getAttribute && t.getAttribute('data-f');
      var row = t.closest && t.closest('.inv-row');
      if (f && row) {
        var it = D.items.filter(function (x) { return x.id === row.getAttribute('data-id'); })[0];
        if (it) { it[f] = t.value; changed(); }
      }
    }
    editor.addEventListener('input', onEdit);
    editor.addEventListener('change', onEdit);

    var saveT = 0;
    function changed(skipSave) {
      var C = invoiceCalc(D);
      // live amounts in rows + GSTIN hints + supply badge, without touching inputs
      C.lines.forEach(function (l) { var r = rowsById[l.it.id]; if (r) r.amt.textContent = '₹' + money(l.total); });
      BT.$$('[data-gst-for]', editor).forEach(function (el) {
        var s = gstinStatus(getP(el.getAttribute('data-gst-for')));
        el.className = 'inv-gst' + (s.ok === true ? ' ok' : s.ok === false ? ' bad' : '');
        el.textContent = s.ok == null ? '' : s.msg;
      });
      var sup = editor.querySelector('[data-supply]');
      if (sup) sup.innerHTML = '<span class="badge ' + (C.intra ? 'ok' : 'warn') + '">' + (C.intra ? 'Intra-state supply: CGST + SGST' : 'Inter-state supply: IGST') + '</span><span class="small muted">' +
        esc(stateName(D.seller.state)) + ' → ' + esc(stateName(D.pos)) + '</span>';
      renderSheet(C);
      if (!skipSave) {
        saveState.textContent = 'Saving…';
        clearTimeout(saveT);
        saveT = setTimeout(save, 500);
      } else saveState.textContent = 'Drafts save automatically on this device';
    }
    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(D)); saveState.textContent = 'Draft saved on this device'; }
      catch (e) { saveState.textContent = 'Could not save draft (storage full or blocked)'; }
    }

    function renderSheet(C) {
      var s = D.seller, b = D.buyer, bk = D.bank || {};
      var e = function (v) { return esc(v || ''); };
      var colTax = C.intra;
      var rowsHtml = C.lines.map(function (l, i) {
        return '<tr><td class="c">' + (i + 1) + '</td><td><b>' + e(l.it.desc || '—') + '</b></td><td>' + e(l.it.hsn) + '</td><td class="r">' + BT.fmtNum(l.qty, 3) + '</td><td class="r">' + money(l.rate) + '</td>' +
          '<td class="r">' + (l.disc ? BT.fmtNum(l.disc, 2) + '%' : '—') + '</td><td class="r">' + money(l.taxable) + '</td><td class="r">' + BT.fmtNum(l.gst, 2) + '%</td>' +
          (colTax ? '<td class="r">' + money(l.cgst) + '</td><td class="r">' + money(l.sgst) + '</td>' : '<td class="r">' + money(l.igst) + '</td>') +
          '<td class="r"><b>' + money(l.total) + '</b></td></tr>';
      }).join('');
      var rates = C.byRate.filter(function (r) { return r.taxable; }).map(function (r) {
        return '<tr><td>' + BT.fmtNum(r.rate, 2) + '%</td><td>' + money(r2(r.taxable)) + '</td>' + (colTax ? '<td>' + money(r2(r.cgst)) + '</td><td>' + money(r2(r.sgst)) + '</td>' : '<td>' + money(r2(r.igst)) + '</td>') + '</tr>';
      }).join('');
      var bankBits = [[bk.holder, 'A/c name'], [bk.name, 'Bank'], [bk.acc, 'A/c no.'], [bk.ifsc, 'IFSC'], [bk.upi, 'UPI']].filter(function (x) { return x[0]; });
      var html =
        '<div class="inv-sheet" style="--acc:' + e(D.accent || '#1e3a8a') + '">' +
        '<div class="top"><div class="seller">' + (s.logo ? '<img src="' + s.logo + '" alt="">' : '') +
        '<div><h2>' + e(s.name || 'Your Business Name') + '</h2><div class="pre muted">' + e(s.address) + '</div>' +
        (s.state ? '<div class="muted">' + e(stateName(s.state)) + ' (' + e(s.state) + ')</div>' : '') +
        (s.gstin ? '<div><b>GSTIN:</b> ' + e(s.gstin) + '</div>' : '') +
        '<div class="muted">' + [s.phone, s.email].filter(Boolean).map(e).join(' · ') + '</div></div></div>' +
        '<div class="title"><h1>TAX INVOICE</h1><table><tr><td>Invoice no.</td><td><b>' + e(D.no) + '</b></td></tr><tr><td>Date</td><td>' + e(niceDate(D.date)) + '</td></tr>' +
        (D.due ? '<tr><td>Due date</td><td>' + e(niceDate(D.due)) + '</td></tr>' : '') + '</table></div></div>' +
        '<div class="parties"><div class="box"><h3>Bill to</h3><b>' + e(b.name || 'Customer name') + '</b><div class="pre muted">' + e(b.address) + '</div>' +
        (b.gstin ? '<div><b>GSTIN:</b> ' + e(b.gstin) + '</div>' : '') + '</div>' +
        '<div class="box"><h3>Supply details</h3><div><b>Place of supply:</b> ' + e(stateName(D.pos)) + ' (' + e(D.pos) + ')</div>' +
        '<div><b>Supply type:</b> ' + (C.intra ? 'Intra-state' : 'Inter-state') + ' <span class="tag">' + (C.intra ? 'CGST + SGST' : 'IGST') + '</span></div>' +
        '<div><b>Reverse charge:</b> No</div></div></div>' +
        '<table class="items"><thead><tr><th class="c">#</th><th>Description</th><th>HSN/SAC</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Disc</th><th class="r">Taxable</th><th class="r">GST</th>' +
        (colTax ? '<th class="r">CGST</th><th class="r">SGST</th>' : '<th class="r">IGST</th>') + '<th class="r">Amount</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>' +
        '<div class="bottom"><div><div class="words">' + esc(amountWords(C.grand)) + '</div>' +
        (rates ? '<h5>Tax summary</h5><table class="rates"><thead><tr><th>Rate</th><th>Taxable</th>' + (colTax ? '<th>CGST</th><th>SGST</th>' : '<th>IGST</th>') + '</tr></thead><tbody>' + rates + '</tbody></table>' : '') +
        (bankBits.length ? '<h5>Bank details</h5><div>' + bankBits.map(function (x) { return '<div><span class="muted">' + x[1] + ':</span> ' + e(x[0]) + '</div>'; }).join('') + '</div>' : '') +
        (D.notes ? '<h5>Notes</h5><div class="pre">' + e(D.notes) + '</div>' : '') +
        (D.terms ? '<h5>Terms &amp; conditions</h5><div class="pre muted">' + e(D.terms) + '</div>' : '') + '</div>' +
        '<div><table class="tot"><tr><td>Taxable amount</td><td>₹' + money(C.totals.taxable) + '</td></tr>' +
        (colTax ? '<tr><td>CGST</td><td>₹' + money(C.totals.cgst) + '</td></tr><tr><td>SGST</td><td>₹' + money(C.totals.sgst) + '</td></tr>' : '<tr><td>IGST</td><td>₹' + money(C.totals.igst) + '</td></tr>') +
        (D.round && C.roundOff ? '<tr><td>Round off</td><td>' + (C.roundOff > 0 ? '+' : '') + money(C.roundOff) + '</td></tr>' : '') +
        '<tr class="grand"><td>Total</td><td>₹' + money(C.grand) + '</td></tr></table>' +
        '<div class="sign"><div>For <b>' + e(s.name || 'Your Business') + '</b></div><div class="ln">' + e(D.signatory || 'Authorised Signatory') + '</div></div></div></div>' +
        '<div class="foot">This is a computer-generated invoice.</div></div>';
      sheetHost.innerHTML = html;
      fit();
    }
    function fit() {
      var w = previewWrap.clientWidth || 794;
      var sc = Math.min(1, w / 794);
      sheetHost.style.transform = sc < 1 ? 'scale(' + sc + ')' : '';
      var sheet = sheetHost.firstChild;
      previewWrap.style.height = sheet ? Math.ceil(sheet.offsetHeight * sc) + 'px' : '';
    }
    if (window.ResizeObserver) new ResizeObserver(fit).observe(previewWrap);
    else window.addEventListener('resize', fit);

    var oldTitle = doc.title;
    pdfBtn.addEventListener('click', function () {
      save();
      doc.title = (D.no || 'Invoice') + (D.buyer && D.buyer.name ? ' - ' + D.buyer.name : '');
      setTimeout(function () { window.print(); }, 30);
    });
    window.addEventListener('afterprint', function () { doc.title = oldTitle; fit(); });
    window.addEventListener('beforeprint', function () { sheetHost.style.transform = ''; });
    build();
    BT.invoiceDebug = { data: function () { return D; }, calc: function () { return invoiceCalc(D); } };
  });

  // core.js may boot before this (deferred) script has run; if the page already
  // shows the "failed to load" notice for one of our tools, start it now.
  (function rescue() {
    var root = doc.getElementById('tool-root');
    if (!root) return;
    var id = root.getAttribute('data-tool');
    var tool = BT.tool(id);
    if (!tool || tool.cat !== 'utility' || root.querySelector('.loading') || !root.querySelector('.notice.error')) return;
    var impl = IMPLS[id];
    if (!impl) return;
    root.innerHTML = '';
    try { impl(root, { tool: tool, category: BT.category(tool.cat) }); } catch (e) { console.error(e); }
  })();
})();
