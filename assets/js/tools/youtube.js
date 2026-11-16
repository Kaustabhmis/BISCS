/*
 * BISCS Tools — YouTube & social media creator tools.
 * youtube-title-generator, youtube-description-generator, youtube-tag-generator,
 * hashtag-generator, youtube-embed-code-generator, youtube-timestamp-link,
 * youtube-url-parser, channel-banner-maker, youtube-earnings-calculator.
 *
 * Everything runs in the browser on what the user types. No YouTube or Google
 * API is called and nothing is fetched automatically: the only requests to
 * YouTube happen when the user presses "Load preview" (embed tool) or
 * "Show thumbnails" (URL parser), and those buttons say so.
 */
(function () {
  'use strict';
  var BT = window.BT;
  if (!BT) return;
  var esc = BT.esc, h = BT.h, doc = document;

  // =================================================================== CSS
  var CSS = [
    '.yt-h{font-size:1.05rem;margin:0}',
    '.yt-sec{font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);margin:4px 0 10px}',
    '.yt-lrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:space-between}',
    '.yt-lrow>label{font-size:.85rem;font-weight:600;color:var(--text-2)}',
    '.yt-count{font-size:.78rem;color:var(--text-3);font-variant-numeric:tabular-nums;display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap}',
    '.yt-meter{height:6px;border-radius:99px;background:var(--surface-2);border:1px solid var(--border);overflow:hidden;margin-top:4px}',
    '.yt-meter>span{display:block;height:100%;width:0;background:var(--ok);transition:width .15s,background .15s}',
    '.yt-meter.warn>span{background:var(--warn)}.yt-meter.bad>span{background:var(--danger)}',
    '.yt-checks{display:flex;flex-wrap:wrap;gap:10px 18px;margin:2px 0 14px}',
    '.yt-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}',
    '.yt-toolbar .spacer{flex:1}',
    '.yt-msgs{display:flex;flex-direction:column;gap:8px;margin-top:12px}.yt-msgs:empty{display:none}',
    '.yt-hero{display:flex;gap:14px;align-items:center;padding:14px 16px;border-radius:var(--radius);margin-bottom:16px;color:#fff;background:radial-gradient(500px 160px at 100% 0%,rgba(255,255,255,.18),transparent 60%),linear-gradient(135deg,#b91c1c,#e11d48 55%,#a16207);box-shadow:0 16px 36px -22px #b91c1c}',
    '.yt-hero .ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:rgba(255,255,255,.18);flex:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.3)}',
    '.yt-hero b{display:block;font-size:.98rem}.yt-hero span{font-size:.86rem;opacity:.92}',
    '.yt-gap{margin-top:16px}',
    '.yt-icon-btn{width:34px;height:34px;padding:0;flex:none}',
    '.yt-inl{display:inline-flex;align-items:center;gap:8px;font-size:.88rem;font-weight:600;color:var(--text-2)}',
    '.yt-inl select{width:auto;min-height:34px;padding:5px 10px}',
    /* title list */
    '.yt-list{display:flex;flex-direction:column;gap:8px}',
    '.yt-ti{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);transition:border-color .15s,box-shadow .15s}',
    '.yt-ti:hover{border-color:var(--border-strong);box-shadow:var(--shadow-sm)}',
    '.yt-ti.on{border-color:color-mix(in srgb,#f59e0b 55%,var(--border));background:color-mix(in srgb,#f59e0b 7%,var(--surface))}',
    '.yt-ti .tx{flex:1;min-width:0}',
    '.yt-ti .tt{font-weight:600;line-height:1.4;word-break:break-word}',
    '.yt-ti .mt{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}',
    '.yt-ti .tt mark{background:color-mix(in srgb,var(--warn) 22%,transparent);color:inherit;border-radius:3px}',
    '.yt-star{background:none;border:1px solid transparent;border-radius:9px;width:34px;height:34px;display:grid;place-items:center;cursor:pointer;color:var(--text-3);flex:none}',
    '.yt-star:hover{color:#f59e0b;border-color:var(--border)}',
    '.yt-star[aria-pressed=true]{color:#f59e0b}.yt-star[aria-pressed=true] svg{fill:#f59e0b}',
    '.yt-filter{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}',
    '.yt-filter .chip{padding:5px 11px;font-size:.82rem}',
    /* description */
    '.yt-desc{white-space:pre-wrap;word-break:break-word;font-size:.9rem;line-height:1.6;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;min-height:200px;max-height:640px;overflow:auto}',
    '.yt-desc mark.fold{background:color-mix(in srgb,var(--brand) 18%,transparent);color:inherit;border-radius:3px;box-shadow:0 0 0 2px color-mix(in srgb,var(--brand) 18%,transparent)}',
    '.yt-desc .more{display:inline-block;margin:0 4px;font-size:.72rem;font-weight:700;color:var(--brand);border:1px dashed var(--brand);border-radius:6px;padding:0 6px;vertical-align:1px}',
    '.yt-desc .hl{color:var(--brand)}',
    '.yt-legend{display:flex;flex-wrap:wrap;gap:10px 16px;font-size:.8rem;color:var(--text-3);margin-top:8px}',
    '.yt-legend i{display:inline-block;width:12px;height:12px;border-radius:3px;background:color-mix(in srgb,var(--brand) 25%,transparent);vertical-align:-2px;margin-right:6px}',
    '.yt-ck{display:flex;flex-direction:column;gap:6px;margin-top:8px;font-size:.86rem}',
    '.yt-ck div{display:flex;gap:8px;align-items:flex-start}',
    '.yt-ck .icon{margin-top:2px}.yt-ck .y{color:var(--ok)}.yt-ck .n{color:var(--danger)}.yt-ck .w{color:var(--warn)}',
    '@media(min-width:900px){.yt-sticky{position:sticky;top:84px;align-self:start}}',
    /* tags */
    '.yt-tags{display:flex;flex-wrap:wrap;gap:8px;min-height:52px;padding:10px;border:1px dashed var(--border-strong);border-radius:var(--radius-sm);background:var(--surface-2)}',
    '.yt-tags:empty::before{content:attr(data-empty);color:var(--text-3);font-size:.88rem;align-self:center}',
    '.yt-tag{display:inline-flex;align-items:center;gap:2px;padding:3px 4px 3px 2px;border-radius:999px;border:1px solid var(--border-strong);background:var(--surface);font-size:.88rem;font-weight:550;max-width:100%;user-select:none;transition:transform .12s,box-shadow .12s}',
    '.yt-tag:focus-visible{box-shadow:var(--ring);outline:none}',
    '.yt-tag .gr{display:grid;place-items:center;width:24px;height:26px;color:var(--text-3);cursor:grab;touch-action:none;border-radius:99px}',
    '.yt-tag .gr .icon{width:15px;height:15px}',
    '.yt-tag .tx{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 2px}',
    '.yt-tag .n{font-size:.7rem;color:var(--text-3);font-variant-numeric:tabular-nums;padding:0 4px}',
    '.yt-tag button{width:24px;height:24px;border-radius:99px;border:0;background:transparent;color:var(--text-3);display:grid;place-items:center;cursor:pointer;padding:0}',
    '.yt-tag button:hover{background:var(--danger-soft);color:var(--danger)}',
    '.yt-tag button .icon{width:14px;height:14px}',
    '.yt-tag.over{border-style:dashed;border-color:var(--danger);opacity:.7}',
    '.yt-tag.over .tx{text-decoration:line-through;text-decoration-color:var(--danger)}',
    '.yt-tag.drag{box-shadow:var(--shadow-lg);transform:scale(1.04);border-color:var(--brand);z-index:2;position:relative}',
    '.yt-tag.ph{opacity:.35}',
    /* hashtags */
    '.yt-hgroup{margin-bottom:14px}',
    '.yt-hgroup h4{font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);margin:0 0 8px;display:flex;gap:8px;align-items:center}',
    '.yt-hchips{display:flex;flex-wrap:wrap;gap:6px}',
    '.yt-hchip{font:inherit;font-size:.86rem;font-weight:600;padding:5px 11px;border-radius:999px;border:1px solid var(--border);background:var(--surface);color:var(--text-2);cursor:pointer;transition:all .12s}',
    '.yt-hchip:hover{border-color:var(--border-strong);color:var(--text)}',
    '.yt-hchip[aria-pressed=true]{background:var(--brand-soft);border-color:var(--brand);color:var(--brand)}',
    '.yt-hout{font-size:.95rem;line-height:1.7;word-break:break-word;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 14px;min-height:56px;color:var(--brand);font-weight:600}',
    '.yt-tabs{margin-bottom:14px}',
    /* code / link outputs */
    '.yt-code{font-family:var(--mono);font-size:.82rem;line-height:1.55;white-space:pre-wrap;word-break:break-all;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;min-height:80px;margin:0;max-height:420px;overflow:auto}',
    '.yt-link{display:flex;align-items:center;gap:8px;padding:8px 8px 8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);margin-bottom:8px}',
    '.yt-link .lb{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--text-3);min-width:72px;flex:none}',
    '.yt-link code{flex:1;min-width:0;font-family:var(--mono);font-size:.84rem;word-break:break-all;color:var(--text)}',
    '@media(max-width:520px){.yt-link{flex-wrap:wrap}.yt-link .lb{min-width:0;flex-basis:100%}}',
    '.yt-frame{position:relative;width:100%;border-radius:var(--radius-sm);overflow:hidden;background:#0b0d16;border:1px solid var(--border)}',
    '.yt-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}',
    '.yt-frame .ph{position:absolute;inset:0;display:flex;flex-direction:column;gap:12px;align-items:center;justify-content:center;text-align:center;padding:16px;color:#c7cbea;font-size:.88rem}',
    '.yt-frame .ph .icon{width:42px;height:42px;color:#ef4444}',
    /* url parser */
    '.yt-res{border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;background:var(--surface);margin-bottom:10px}',
    '.yt-res.bad{border-left:4px solid var(--danger)}.yt-res.good{border-left:4px solid var(--ok)}',
    '.yt-res .hd{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin-bottom:8px}',
    '.yt-res .in{font-family:var(--mono);font-size:.78rem;color:var(--text-3);word-break:break-all;margin-bottom:8px}',
    '.yt-thumbs{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));margin-top:10px}',
    '.yt-thumbs figure{margin:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--surface-2)}',
    '.yt-thumbs img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#111}',
    '.yt-thumbs figcaption{font-size:.74rem;padding:6px 8px;color:var(--text-2);display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap}',
    '.yt-thumbs .na img{opacity:.35}',
    '.yt-tcell{white-space:normal!important;word-break:break-all;min-width:140px;max-width:280px}',
    /* banner */
    '.yt-stage{position:relative;display:flex;align-items:center;justify-content:center;min-height:180px;padding:12px;border:1px solid var(--border);border-radius:var(--radius);background:repeating-conic-gradient(var(--surface-2) 0% 25%,var(--surface) 0% 50%) 50%/20px 20px;overflow:hidden}',
    '.yt-stage canvas{display:block;touch-action:none;box-shadow:0 10px 34px -14px rgba(0,0,0,.45);border-radius:4px;max-width:100%}',
    '.yt-stage canvas:focus-visible{outline:3px solid var(--brand);outline-offset:3px}',
    '.yt-under{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;font-size:.82rem;color:var(--text-3);margin:8px 2px 0}',
    '.yt-under .icon{width:14px;height:14px}',
    '.yt-devs{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));margin-top:14px}',
    '.yt-dev{margin:0;text-align:center;font-size:.76rem;color:var(--text-3);font-weight:600}',
    '.yt-dev .sc{background:#0f1222;border-radius:10px;padding:6px;display:grid;place-items:center;min-height:70px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}',
    '.yt-dev canvas{display:block;max-width:100%;height:auto;border-radius:3px}',
    '.yt-dev figcaption{margin-top:5px}',
    '.yt-bpanel h3{font-size:1rem;margin:0 0 12px}',
    '.yt-bpanel .field:last-child{margin-bottom:0}',
    '.yt-bsec{padding-top:14px;margin-top:14px;border-top:1px solid var(--border)}',
    '.yt-bsec>h4{font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);margin:0 0 10px}',
    '.yt-layers{display:flex;flex-direction:column;gap:6px;margin-top:10px}',
    '.yt-li{display:flex;align-items:center;gap:6px;padding:4px 4px 4px 10px;border:1px solid var(--border);border-radius:10px;background:var(--surface)}',
    '.yt-li.on{border-color:var(--brand);background:var(--brand-soft)}',
    '.yt-li .t{flex:1;min-width:0;text-align:left;background:none;border:0;font:inherit;font-size:.88rem;color:var(--text);cursor:pointer;padding:6px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.yt-li .icon-sm{color:var(--text-3);display:grid}',
    '.yt-tpls{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px}',
    '.yt-tpls button{border:2px solid var(--border);border-radius:10px;padding:0;overflow:hidden;cursor:pointer;background:var(--surface);text-align:left;font:inherit}',
    '.yt-tpls button[aria-pressed=true]{border-color:var(--brand)}',
    '.yt-tpls button span{display:block;padding:5px 8px;font-size:.76rem;font-weight:650;color:var(--text-2)}',
    '.yt-tpls canvas{display:block;width:100%;height:auto}',
    '.yt-icons{display:grid;grid-template-columns:repeat(auto-fill,minmax(40px,1fr));gap:6px;max-height:190px;overflow-y:auto;padding:2px;margin-top:8px}',
    '.yt-icons button{height:40px;border-radius:9px;border:1px solid var(--border);background:var(--surface);color:var(--text-2);display:grid;place-items:center;cursor:pointer;padding:0}',
    '.yt-icons button[aria-pressed=true]{border-color:var(--brand);background:var(--brand-soft);color:var(--brand)}',
    '.yt-range{display:flex;align-items:center;gap:10px}.yt-range input{flex:1}.yt-range output{min-width:46px;text-align:right;font-variant-numeric:tabular-nums;font-size:.85rem;color:var(--text-2)}',
    '.yt-colors{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap}',
    '.yt-colors .field{margin-bottom:0}',
    '.yt-grads{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}',
    '.yt-grads button{width:34px;height:34px;border-radius:9px;border:2px solid var(--border);cursor:pointer;padding:0}',
    '.yt-file{position:relative;overflow:hidden}.yt-file input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%}',
    '.yt-file:focus-within{box-shadow:var(--ring)}',
    '.yt-size{font-size:.85rem;color:var(--text-2);margin-top:8px}',
    /* earnings */
    '.yt-rng{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline}',
    '.yt-rng .value{font-size:clamp(1.5rem,4vw,2.2rem)}',
    '.yt-bars{display:flex;flex-direction:column;gap:10px;margin-top:6px}',
    '.yt-bar{display:grid;grid-template-columns:minmax(0,130px) minmax(0,1fr) auto;gap:10px;align-items:center;font-size:.86rem}',
    '.yt-bar .tr{height:10px;border-radius:99px;background:var(--surface-2);border:1px solid var(--border);overflow:hidden}',
    '.yt-bar .tr span{display:block;height:100%;border-radius:99px}',
    '.yt-bar b{font-variant-numeric:tabular-nums;white-space:nowrap}',
    '@media(max-width:480px){.yt-bar{grid-template-columns:minmax(0,1fr) auto}.yt-bar .tr{grid-column:1/-1;grid-row:2}}',
    '.yt-faq details{border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 14px;background:var(--surface);margin-bottom:8px}',
    '.yt-faq summary{cursor:pointer;font-weight:600}',
    '.yt-faq details p,.yt-faq details ul{margin:8px 0 0;color:var(--text-2);font-size:.9rem}',
    '.yt-faq details ul{padding-left:20px}',
    '@media(max-width:480px){.yt-ti{padding:9px 10px;gap:8px}.card{padding:16px}}'
  ].join('\n');

  function css() {
    if (doc.getElementById('yt-css')) return;
    var s = doc.createElement('style');
    s.id = 'yt-css';
    s.textContent = CSS;
    doc.head.appendChild(s);
  }

  // ================================================================ Helpers
  var uid = 0;
  function nid(p) { uid++; return 'yt-' + (p || 'f') + uid; }
  function $(id, root) { return BT.$('#' + id, root); }
  function btn(attrs, icon, label, cls) {
    return '<button type="button" class="btn btn-sm ' + (cls || '') + '" ' + (attrs || '') + '>' +
      (icon ? BT.icon(icon) : '') + '<span>' + label + '</span></button>';
  }
  function iconBtn(attrs, icon, label, cls) {
    return '<button type="button" class="btn btn-sm btn-ghost yt-icon-btn ' + (cls || '') + '" aria-label="' + esc(label) + '" title="' + esc(label) + '" ' + (attrs || '') + '>' + BT.icon(icon) + '</button>';
  }
  function notice(kind, html) {
    return '<div class="notice ' + (kind || '') + '">' + BT.icon(kind === 'ok' ? 'check' : 'info') + '<span>' + html + '</span></div>';
  }
  function hero(icon, title, sub) {
    return '<div class="yt-hero"><span class="ic">' + BT.icon(icon) + '</span><div><b>' + title + '</b><span>' + sub + '</span></div></div>';
  }
  function field(id, label, control, hint, counter) {
    return '<div class="field">' +
      (counter ? '<div class="yt-lrow"><label for="' + id + '">' + label + '</label><span class="yt-count" id="' + id + '-c" aria-live="polite"></span></div>'
        : '<label for="' + id + '">' + label + '</label>') +
      control + (hint ? '<span class="hint">' + hint + '</span>' : '') + '</div>';
  }
  function inp(id, type, ph, val, extra) {
    return '<input type="' + (type || 'text') + '" id="' + id + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') +
      (val != null && val !== '' ? ' value="' + esc(val) + '"' : '') + (extra || '') + '>';
  }
  function txa(id, ph, val, rows, extra) {
    return '<textarea id="' + id + '" rows="' + (rows || 4) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + ' style="min-height:0"' + (extra || '') + '>' + esc(val || '') + '</textarea>';
  }
  function sel(id, opts, val) {
    return '<select id="' + id + '">' + opts.map(function (o) {
      var v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o;
      return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(l) + '</option>';
    }).join('') + '</select>';
  }
  function chk(id, label, on) {
    return '<label class="check"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '> ' + label + '</label>';
  }
  function seg(id, items, active, label) {
    return '<div class="seg" role="group" aria-label="' + esc(label) + '" id="' + id + '">' + items.map(function (it) {
      var on = it[0] === active;
      return '<button type="button" data-v="' + esc(it[0]) + '" class="' + (on ? 'active' : '') + '" aria-pressed="' + on + '">' + esc(it[1]) + '</button>';
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
  /** Delegate clicks on [data-a] elements to handlers. */
  function onA(root, map) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (b && root.contains(b) && map[b.getAttribute('data-a')]) map[b.getAttribute('data-a')](b, e);
    });
  }
  function val(root, id) { var el = $(id, root); return el ? (el.type === 'checkbox' ? el.checked : el.value.trim()) : ''; }
  function chars(s) { return Array.from(String(s || '')).length; }
  function plural(n, w, ws) { return BT.fmtNum(n, 0) + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function csvCell(v) { v = String(v == null ? '' : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function toCSV(rows) { return '﻿' + rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n'); }
  function meter(el, used, max, warnAt) {
    if (!el) return;
    var p = Math.min(100, used / max * 100);
    el.firstElementChild.style.width = p + '%';
    el.classList.toggle('bad', used > max);
    el.classList.toggle('warn', used <= max && warnAt != null && used > warnAt);
  }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'file'; }
  function isUrl(s) { try { var u = new URL(s); return /^https?:$/.test(u.protocol) && !!u.hostname; } catch (e) { return false; } }
  function isEmail(s) { return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(s); }
  /** Title Case a phrase but keep words the user already capitalised (GST, iPhone). */
  function titleCase(s) {
    var small = /^(a|an|and|as|at|but|by|for|in|of|on|or|the|to|vs|via|with|ki|ka|ke|se)$/i;
    return String(s || '').split(/(\s+)/).map(function (w, i) {
      if (!w.trim()) return w;
      if (/[A-Z]/.test(w.slice(1)) || /^[^a-z]/.test(w)) return w;
      if (i > 0 && small.test(w)) return w.toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join('');
  }

  // --------------------------------------------------------- YouTube links
  var ID_RE = /^[A-Za-z0-9_-]{11}$/;
  var LIST_RE = /^[A-Za-z0-9_-]{2,80}$/;

  /** "90", "90s", "1:30", "1:02:03", "1m30s", "1h2m3s" -> seconds (NaN if invalid). */
  function parseTime(s) {
    s = String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, '');
    if (!s) return NaN;
    if (/^\d+(\.\d+)?s?$/.test(s)) return Math.floor(parseFloat(s));
    var m = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    if (m && (m[1] || m[2] || m[3])) return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
    m = s.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
    if (m) {
      if (m[3] != null) return (+m[2] > 59 || +m[3] > 59) ? NaN : +m[1] * 3600 + +m[2] * 60 + +m[3];
      return +m[2] > 59 ? NaN : +m[1] * 60 + +m[2];
    }
    return NaN;
  }
  /** seconds -> "1:02:03" or "4:05" */
  function clock(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var hh = Math.floor(sec / 3600), mm = Math.floor(sec % 3600 / 60), ss = sec % 60;
    return (hh ? hh + ':' + (mm < 10 ? '0' : '') : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
  }
  /** seconds -> "1h2m3s" */
  function hms(sec) {
    var hh = Math.floor(sec / 3600), mm = Math.floor(sec % 3600 / 60), ss = sec % 60;
    return (hh ? hh + 'h' : '') + (mm ? mm + 'm' : '') + (ss || (!hh && !mm) ? ss + 's' : '');
  }

  /**
   * Parse a YouTube link or bare video ID.
   * Returns { input, id, list, start, kind, error }.
   */
  function parseYT(raw) {
    var s = String(raw == null ? '' : raw).trim().replace(/^<|>$/g, '');
    var r = { input: String(raw == null ? '' : raw).trim(), id: '', list: '', start: null, kind: '', error: '' };
    if (!s) { r.error = 'Empty line'; return r; }
    if (ID_RE.test(s)) { r.id = s; r.kind = 'Video ID'; return r; }
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) {
      if (/^([a-z0-9-]+\.)*(youtube\.com|youtu\.be|youtube-nocookie\.com)([\/?#]|$)/i.test(s)) s = 'https://' + s;
      else { r.error = 'Not a YouTube link or an 11-character video ID'; return r; }
    }
    var u;
    try { u = new URL(s); } catch (e) { r.error = 'Not a valid link'; return r; }
    if (!/^https?:$/.test(u.protocol)) { r.error = 'Only http(s) links are supported'; return r; }
    var full = u.hostname.toLowerCase();
    var host = full.replace(/^(www|m|music|gaming)\./, '');
    var parts = u.pathname.split('/').filter(Boolean);
    var q = u.searchParams;
    var sub = /^music\./.test(full) ? ' · YouTube Music' : /^m\./.test(full) ? ' · mobile site' : '';
    if (host === 'youtu.be') {
      r.id = parts[0] || ''; r.kind = 'Short link (youtu.be)';
    } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      var p0 = (parts[0] || '').toLowerCase();
      if (p0 === 'watch') { r.id = q.get('v') || parts[1] || ''; r.kind = 'Watch page'; }
      else if (p0 === 'shorts') { r.id = parts[1] || ''; r.kind = 'Shorts'; }
      else if (p0 === 'live') { r.id = parts[1] || ''; r.kind = 'Live'; }
      else if (p0 === 'embed' || p0 === 'v' || p0 === 'e') {
        r.id = parts[1] || ''; r.kind = host === 'youtube-nocookie.com' ? 'Embed (privacy-enhanced)' : 'Embed';
        if (r.id === 'videoseries') { r.id = ''; r.kind = 'Embedded playlist'; }
      }
      else if (p0 === 'playlist') r.kind = 'Playlist';
      else if (p0 === 'attribution_link' && q.get('u')) {
        var inner = parseYT('https://www.youtube.com' + (q.get('u').charAt(0) === '/' ? '' : '/') + q.get('u'));
        inner.input = r.input; inner.kind = inner.kind ? inner.kind + ' (attribution link)' : '';
        return inner;
      }
      else { r.error = 'This YouTube link is not a video or playlist (for example a channel, search or home page)'; return r; }
      r.kind += sub;
    } else { r.error = 'Not a YouTube link'; return r; }
    var list = q.get('list');
    if (list && LIST_RE.test(list)) r.list = list;
    var t = q.get('t') || q.get('start') || q.get('time_continue');
    if (!t && u.hash) { var hm = u.hash.match(/[#&]t=([^&]+)/); if (hm) t = hm[1]; }
    if (t) { var sec = parseTime(t); if (isFinite(sec)) r.start = sec; }
    if (r.id && !ID_RE.test(r.id)) {
      r.error = 'The video ID “' + r.id.slice(0, 30) + '” is not valid (it must be exactly 11 characters: A–Z, a–z, 0–9, _ or -)';
      r.id = '';
      return r;
    }
    if (!r.id && !r.list) r.error = 'No video or playlist ID found in this link';
    return r;
  }
  function ytUrls(id, start, list) {
    var t = start > 0 ? Math.floor(start) : 0;
    return {
      watch: 'https://www.youtube.com/watch?v=' + id + (list ? '&list=' + list : '') + (t ? '&t=' + t + 's' : ''),
      short: 'https://youtu.be/' + id + (t ? '?t=' + t : ''),
      embed: 'https://www.youtube.com/embed/' + id + (t ? '?start=' + t : ''),
      nocookie: 'https://www.youtube-nocookie.com/embed/' + id + (t ? '?start=' + t : ''),
      shorts: 'https://www.youtube.com/shorts/' + id
    };
  }
  var THUMBS = [['default', '120 × 90'], ['mqdefault', '320 × 180'], ['hqdefault', '480 × 360'], ['sddefault', '640 × 480'], ['maxresdefault', '1280 × 720']];
  function thumbUrl(id, n) { return 'https://i.ytimg.com/vi/' + id + '/' + n + '.jpg'; }
  function linkRow(label, url) {
    return '<div class="yt-link"><span class="lb">' + esc(label) + '</span><code>' + esc(url) + '</code>' +
      iconBtn('data-a="copy" data-copy="' + esc(url) + '"', 'copy', 'Copy ' + label) + '</div>';
  }
  /** Shared copy handler for [data-copy] buttons. */
  function wireCopy(root) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-copy]');
      if (b && root.contains(b)) BT.copy(b.getAttribute('data-copy'));
    });
  }

  // ======================================================= 1. Title ideas
  // Tokens: {T} topic, {B} second item, {G} goal, {N} number, {Y} year,
  // {forA} " for Beginners" / " in India", {who} "Beginner", {whos} "Beginners".
  // Angle codes: h how-to, l list, r review, c comparison, q curiosity, v vlog, n news, s shorts, x Hinglish.
  var AUD = {
    '': { forA: '', who: 'Beginner', whos: 'Beginners' },
    beginners: { forA: ' for Beginners', who: 'Beginner', whos: 'Beginners' },
    students: { forA: ' for Students', who: 'Student', whos: 'Students' },
    india: { forA: ' in India', who: 'Indian', whos: 'Indians' },
    business: { forA: ' for Small Businesses', who: 'Small Business Owner', whos: 'Small Business Owners' },
    creators: { forA: ' for Creators', who: 'Creator', whos: 'Creators' },
    professionals: { forA: ' for Working Professionals', who: 'Working Professional', whos: 'Working Professionals' },
    parents: { forA: ' for Parents', who: 'Parent', whos: 'Parents' },
    seniors: { forA: ' for Seniors', who: 'Senior Citizen', whos: 'Senior Citizens' }
  };
  var ANGLES = { h: 'How-to', l: 'List', r: 'Review', c: 'Comparison', q: 'Curiosity', v: 'Vlog', n: 'News', s: 'Shorts', x: 'Hinglish', g: 'Goal' };
  var TPL = {
    tutorial: [
      ['h', '{T}{forA}: Complete Step-by-Step Guide'], ['h', '{T} Tutorial{forA}'], ['h', 'How {T} Works (Explained Simply)'],
      ['h', 'Learn {T} in {N} Minutes'], ['h', 'Getting Started with {T}{forA}'], ['h', '{T} Made Easy: Beginner to Confident'],
      ['h', '{T} Crash Course{forA}'], ['h', '{T} Basics: What to Learn First'], ['h', 'Master {T}: From Basics to Advanced'],
      ['h', '{T} Setup Guide, Step by Step'], ['q', '{T} Tips I Wish I Knew Earlier'], ['q', 'Do This Before You Start {T}'],
      ['h', 'The Easiest Way to Understand {T}'], ['h', '{T} in {Y}: Full Tutorial{forA}']
    ],
    review: [
      ['r', '{T} Review: Honest Opinion After {N} Weeks'], ['r', '{T} Review — Is It Worth It{forA}?'], ['r', '{T}: Pros, Cons and Who Should Buy It'],
      ['r', '{T} Unboxing and First Impressions'], ['r', '{T} Long-Term Review'], ['r', 'Watch This Before You Buy {T}'],
      ['r', '{T}: The Good, the Bad and the Verdict'], ['r', '{T} Real-World Test{forA}'], ['r', 'Who Should (and Shouldn’t) Buy {T}'],
      ['r', '{T} After {N} Months: Still Worth It?'], ['r', '{T}: What I Like and What I Don’t'], ['r', 'Is {T} Worth Buying in {Y}?']
    ],
    vlog: [
      ['v', 'A Day in My Life: {T}'], ['v', 'I Spent a Day Exploring {T}'], ['v', '{T} — Behind the Scenes'], ['v', 'My First Time Trying {T}'],
      ['v', '{T} Diaries: Episode {N}'], ['v', 'What a Day of {T} Really Looks Like'], ['v', 'Come With Me: {T}'], ['v', '{T} | Weekend Vlog'],
      ['v', 'Exploring {T} on a Budget'], ['v', 'Real Talk: My {T} Experience'], ['v', 'Day {N} of {T}'], ['v', '{T} Vlog: Unplanned and Honest']
    ],
    listicle: [
      ['l', '{N} {T} Tips Every {who} Should Know'], ['l', '{N} Best {T} Ideas{forA}'], ['l', 'Top {N} {T} Tools{forA}'],
      ['l', '{N} {T} Hacks That Actually Work'], ['l', '{N} Things Nobody Tells You About {T}'], ['l', '{N} {T} Mistakes {whos} Make (and How to Fix Them)'],
      ['l', '{N} Underrated {T} Tips'], ['l', '{N} Ways to Get Better at {T}'], ['l', '{N} {T} Ideas You Can Try Today'],
      ['l', '{N} Smart {T} Tips to Save Time'], ['l', '{N} {T} Myths, Busted'], ['l', 'Top {N} {T} Picks{forA} in {Y}']
    ],
    comparison: [
      ['c', '{T} vs {B}: Which Is Better{forA}?'], ['c', '{T} vs {B} — Honest Comparison'], ['c', '{T} or {B}? Watch Before You Choose'],
      ['c', '{T} vs {B}: {N} Key Differences'], ['c', 'I Used {T} and {B} — Here’s the Real Difference'], ['c', '{T} vs {B}: Price, Features and Verdict'],
      ['c', '{T} vs {B} in {Y}: Which Should You Pick?'],
      ['c', '{T} vs the Alternatives: Which Should You Pick?'], ['c', 'Is {T} Still the Best Option? Compared'], ['c', '{T}: Best Alternatives Compared{forA}'],
      ['c', 'Choosing {T}: {N} Options Compared'], ['c', '{T} Comparison: Budget vs Premium']
    ],
    news: [
      ['n', '{T}: What’s New and What It Means for You'], ['n', '{T} Update Explained'], ['n', '{T} News: Key Changes{forA}'],
      ['n', 'Big {T} Changes — What You Need to Know'], ['n', '{T} Announced: First Look and Key Details'], ['n', '{T} Explained in {N} Minutes'],
      ['n', 'What the New {T} Rules Mean{forA}'], ['n', '{T}: Latest Update Summarised'], ['n', 'Breaking Down the {T} Announcement'],
      ['n', '{T} in {Y}: What Has Changed']
    ],
    shorts: [
      ['s', '{T} in 60 Seconds'], ['s', 'Quick {T} Tip'], ['s', 'Did You Know This About {T}?'], ['s', '{T} Mistake to Avoid'],
      ['s', 'One-Minute {T} Guide'], ['s', '{T}: Before vs After'], ['s', 'Try This {T} Trick'], ['s', '{T} Explained Fast'],
      ['s', '{T} Hack You’ll Use Daily'], ['s', 'The {T} Tip Nobody Mentions'], ['s', '{T} #Shorts']
    ],
    general: [
      ['h', 'Everything You Need to Know About {T}'], ['q', 'The Truth About {T} (Facts, Not Hype)'], ['h', '{T} Explained Simply{forA}'],
      ['q', 'What I Learned From {T}'], ['h', '{T}: Beginner to Pro'], ['q', 'Why {T} Matters{forA}'], ['q', '{T}: Your Questions Answered'],
      ['q', 'Is {T} Right for You?'], ['l', 'Stop Making These {T} Mistakes'], ['q', '{T}: Myths vs Facts'], ['l', '{N} Lessons From {T}'],
      ['q', 'Watch This Before Starting {T}'], ['h', 'A Practical Guide to {T}{forA}'], ['q', 'What Nobody Explains About {T}']
    ],
    goal: [
      ['g', 'How to {G}{forA}'], ['g', 'How to {G} with {T}'], ['g', 'The Simple Way to {G}'], ['g', 'How I {G} Using {T}'],
      ['g', 'Can You Really {G} with {T}? I Tested It'], ['g', '{N} Steps to {G}'], ['g', 'How to {G} Faster (Without Spending Extra)'],
      ['g', 'Want to {G}? Start Here']
    ],
    hinglish: [
      ['x', '{T} kaise sikhe? Step by Step Guide'], ['x', '{T} ki puri jankari (Complete Guide)'], ['x', '{T} Explained in Hindi'],
      ['x', '{T} ke {N} Tips jo aapko pata hone chahiye'], ['x', '{T}: Beginners ke liye Guide'], ['x', '{T} Review — Paisa Vasool ya Nahi?'],
      ['x', '{T} vs {B}: Kaun Sa Better Hai?'], ['x', '{T} ki {N} Galtiyan jo Log Karte Hain'], ['x', '{T} ka Sach (Facts, Not Hype)'],
      ['x', 'Ek Din {T} ke Saath | Vlog'], ['x', '{G} kaise kare? Aasan Tarika']
    ]
  };
  var RELATED = { tutorial: ['listicle'], review: ['comparison', 'listicle'], vlog: ['listicle'], listicle: ['tutorial'], comparison: ['review'], news: ['tutorial'], shorts: ['listicle', 'tutorial'] };

  function capsWords(t) {
    var words = String(t).match(/[A-Za-z]{2,}/g) || [];
    var caps = words.filter(function (w) { return w.length >= 3 && w === w.toUpperCase(); });
    return { n: caps.length, flag: caps.length >= 3 || (caps.length >= 2 && caps.length / words.length > 0.3), words: caps };
  }
  function titleBadges(t) {
    var n = chars(t), out = [];
    if (n > 100) out.push('<span class="badge danger">' + n + ' / 100 · too long for YouTube</span>');
    else if (n > 70) out.push('<span class="badge warn">' + n + ' / 100 · may be cut off in search</span>');
    else if (n > 60) out.push('<span class="badge ok">' + n + ' / 100 · near the search limit</span>');
    else out.push('<span class="badge ok">' + n + ' / 100 · fits in search</span>');
    if (capsWords(t).flag) out.push('<span class="badge warn">Many ALL-CAPS words</span>');
    return out.join('');
  }

  BT.impl('youtube-title-generator', function (root) {
    css();
    var starred = {}, list = [], angle = 'all', shuffleSeed = 0;
    var TYPES = [['tutorial', 'Tutorial / how-to'], ['review', 'Product review'], ['vlog', 'Vlog'], ['listicle', 'List / tips'], ['comparison', 'Comparison (A vs B)'], ['news', 'News / update'], ['shorts', 'Shorts']];
    var AUDS = [['', 'Anyone (no audience)'], ['beginners', 'Beginners'], ['students', 'Students'], ['india', 'Viewers in India'], ['business', 'Small businesses'], ['creators', 'Creators'], ['professionals', 'Working professionals'], ['parents', 'Parents'], ['seniors', 'Senior citizens']];
    root.innerHTML =
      hero('heading-1', 'Title ideas from proven patterns', 'Generated on your device from curated templates — no search data, no AI service, nothing is uploaded.') +
      '<div class="card"><div class="row cols-2">' +
        field('tg-topic', 'Topic or main keyword', inp('tg-topic', 'text', 'e.g. Excel pivot tables, budget smartphone, Kolkata street food', '', ' maxlength="80" autocomplete="off"'), 'A short noun phrase works best. Put your main keyword first.') +
        field('tg-type', 'Video type', sel('tg-type', TYPES, 'tutorial')) +
      '</div><div class="row cols-3">' +
        field('tg-aud', 'Audience', sel('tg-aud', AUDS, '')) +
        field('tg-num', 'Number (for list titles)', inp('tg-num', 'number', '7', '7', ' min="2" max="99" inputmode="numeric"')) +
        field('tg-year', 'Year (optional)', inp('tg-year', 'number', 'Leave empty', '', ' min="2000" max="2100" inputmode="numeric"'), 'Year-free titles stay fresh longer.') +
      '</div><div class="row cols-2">' +
        field('tg-goal', 'What will viewers achieve? (optional)', inp('tg-goal', 'text', 'e.g. edit videos faster, save tax legally', '', ' maxlength="70"'), 'Adds “How to …” titles. Start with a verb.') +
        field('tg-b', 'Compare with (optional)', inp('tg-b', 'text', 'e.g. Google Sheets', '', ' maxlength="50"'), 'Used for “A vs B” titles.') +
      '</div><div class="yt-checks">' + chk('tg-hing', 'Add Hinglish-friendly titles (Roman Hindi)', false) + chk('tg-case', 'Title Case my topic', true) + '</div>' +
      '<div class="btn-group">' + btn('data-a="gen"', 'sparkles', 'Generate titles', 'btn-primary') + btn('data-a="shuffle"', 'shuffle', 'Shuffle') + '</div>' +
      '</div>' +
      '<div class="card hidden" id="tg-out"><div class="card-title"><h3 class="yt-h">Title ideas</h3><span class="badge" id="tg-n"></span></div>' +
        '<div class="yt-filter" id="tg-filter" role="group" aria-label="Filter by angle"></div>' +
        '<div class="yt-toolbar">' + btn('data-a="copyall"', 'copy', 'Copy all') + btn('data-a="copystar"', 'star', 'Copy starred') +
          btn('data-a="txt"', 'download', 'TXT') + btn('data-a="csv"', 'sheet', 'CSV') + '<span class="spacer"></span>' +
          '<label class="yt-inl" for="tg-sort">Sort ' + sel('tg-sort', [['mix', 'Mixed'], ['short', 'Shortest first'], ['star', 'Starred first']], 'mix') + '</label></div>' +
        '<div class="yt-list" id="tg-list" aria-live="polite"></div>' +
        '<div class="yt-msgs">' + notice('', 'These are <strong>ideas, not data</strong>: no search volume or trend data is used. Pick a title that honestly matches your video — misleading titles can hurt watch time and may break YouTube’s policies. Keep the most important words in the first ~60–70 characters, because longer titles are often cut off in search and suggestions (YouTube allows up to 100).') + '</div>' +
      '</div>' +
      '<div class="card"><h3 class="yt-h" style="margin-bottom:12px">Check your own title</h3>' +
        field('tg-own', 'Your title', inp('tg-own', 'text', 'Type or paste a title to check its length', '', ' maxlength="150"'), '', true) +
        '<div class="yt-meter" id="tg-own-m"><span></span></div><div class="yt-msgs" id="tg-own-msg"></div></div>';

    var listEl = $('tg-list', root);
    function fill(t, ctx) {
      return t.replace(/\{T\}/g, ctx.T).replace(/\{B\}/g, ctx.B).replace(/\{G\}/g, ctx.G).replace(/\{N\}/g, ctx.N)
        .replace(/\{Y\}/g, ctx.Y).replace(/\{forA\}/g, ctx.a.forA).replace(/\{whos\}/g, ctx.a.whos).replace(/\{who\}/g, ctx.a.who);
    }
    function generate() {
      var topic = val(root, 'tg-topic').replace(/\s+/g, ' ');
      if (!topic) { BT.toast('Type a topic or keyword first', 'error'); $('tg-topic', root).focus(); return; }
      var type = val(root, 'tg-type'), n = Math.round(BT.num(val(root, 'tg-num')));
      var y = val(root, 'tg-year');
      var ctx = {
        T: val(root, 'tg-case') ? titleCase(topic) : topic,
        B: val(root, 'tg-b').replace(/\s+/g, ' '), G: val(root, 'tg-goal').replace(/\s+/g, ' ').replace(/[.?!]+$/, ''),
        N: isFinite(n) && n >= 2 && n <= 99 ? n : 7, Y: /^\d{4}$/.test(y) ? y : '', a: AUD[val(root, 'tg-aud')] || AUD['']
      };
      if (ctx.B && val(root, 'tg-case')) ctx.B = titleCase(ctx.B);
      var pools = [type, 'goal', 'general'].concat(RELATED[type] || []);
      if (val(root, 'tg-hing')) pools.splice(1, 0, 'hinglish');
      var seen = {}, out = [];
      pools.forEach(function (p) {
        (TPL[p] || []).forEach(function (t) {
          var s = t[1];
          if (/\{Y\}/.test(s) && !ctx.Y) return;
          if (/\{G\}/.test(s) && !ctx.G) return;
          if (/\{B\}/.test(s) && !ctx.B) return;
          if (p === 'comparison' && ctx.B && /Alternatives|Options Compared|Budget vs|Still the Best/.test(s) && out.length > 40) return;
          var title = fill(s, ctx).replace(/\s+/g, ' ').trim();
          var k = title.toLowerCase();
          if (seen[k]) return;
          seen[k] = 1;
          out.push({ t: title, a: t[0], i: out.length });
        });
      });
      // Always offer 30+ ideas: borrow from the remaining types if needed.
      Object.keys(TPL).forEach(function (p) {
        if (out.length >= 36 || pools.indexOf(p) >= 0 || p === 'hinglish') return;
        TPL[p].forEach(function (t) {
          if (out.length >= 40 || /\{[YGB]\}/.test(t[1])) return;
          var title = fill(t[1], ctx).replace(/\s+/g, ' ').trim();
          if (seen[title.toLowerCase()]) return;
          seen[title.toLowerCase()] = 1;
          out.push({ t: title, a: t[0], i: out.length });
        });
      });
      list = out;
      shuffleSeed = 0;
      angle = 'all';
      render();
      $('tg-out', root).classList.remove('hidden');
    }
    function shown() {
      var arr = list.filter(function (x) { return angle === 'all' || (angle === 'star' ? starred[x.t] : x.a === angle); });
      var sort = val(root, 'tg-sort');
      if (shuffleSeed) {
        var s = shuffleSeed;
        arr = arr.map(function (x) { s = (s * 9301 + 49297) % 233280; return { x: x, r: s }; }).sort(function (a, b) { return a.r - b.r; }).map(function (o) { return o.x; });
      }
      if (sort === 'short') arr.sort(function (a, b) { return chars(a.t) - chars(b.t); });
      else if (sort === 'star') arr.sort(function (a, b) { return (starred[b.t] ? 1 : 0) - (starred[a.t] ? 1 : 0); });
      return arr;
    }
    function render() {
      var counts = { all: list.length, star: Object.keys(starred).filter(function (k) { return starred[k]; }).length };
      list.forEach(function (x) { counts[x.a] = (counts[x.a] || 0) + 1; });
      var f = [['all', 'All']].concat(Object.keys(ANGLES).filter(function (k) { return counts[k]; }).map(function (k) { return [k, ANGLES[k]]; })).concat([['star', '★ Starred']]);
      $('tg-filter', root).innerHTML = f.map(function (x) {
        return '<button type="button" class="chip" data-a="angle" data-v="' + x[0] + '" aria-pressed="' + (angle === x[0]) + '">' + esc(x[1]) + ' <span class="muted">' + (counts[x[0]] || 0) + '</span></button>';
      }).join('');
      var arr = shown();
      $('tg-n', root).textContent = plural(list.length, 'idea');
      listEl.innerHTML = arr.length ? arr.map(function (x) {
        var on = !!starred[x.t];
        return '<div class="yt-ti' + (on ? ' on' : '') + '">' +
          '<button type="button" class="yt-star" data-a="star" data-t="' + esc(x.t) + '" aria-pressed="' + on + '" aria-label="Star this title">' + BT.icon('star') + '</button>' +
          '<div class="tx"><div class="tt">' + esc(x.t) + '</div><div class="mt"><span class="badge">' + esc(ANGLES[x.a]) + '</span>' + titleBadges(x.t) + '</div></div>' +
          iconBtn('data-copy="' + esc(x.t) + '"', 'copy', 'Copy title') + '</div>';
      }).join('') : '<p class="muted">' + (angle === 'star' ? 'Star the titles you like and they will appear here.' : 'No titles in this group.') + '</p>';
    }
    function all(onlyStar) {
      return list.filter(function (x) { return !onlyStar || starred[x.t]; }).map(function (x) { return x.t; });
    }
    wireCopy(root);
    onA(root, {
      gen: generate,
      shuffle: function () { if (!list.length) return generate(); shuffleSeed = 1 + Math.floor(Math.random() * 99999); render(); },
      angle: function (b) { angle = b.getAttribute('data-v'); render(); },
      star: function (b) { var t = b.getAttribute('data-t'); starred[t] = !starred[t]; render(); },
      copyall: function () { if (list.length) BT.copy(all().join('\n'), plural(list.length, 'title') + ' copied'); },
      copystar: function () { var s = all(true); if (!s.length) return BT.toast('Star some titles first', 'error'); BT.copy(s.join('\n'), plural(s.length, 'title') + ' copied'); },
      txt: function () { BT.download(all().join('\r\n'), 'youtube-title-ideas.txt', 'text/plain;charset=utf-8'); },
      csv: function () {
        BT.download(toCSV([['Title', 'Characters', 'Angle', 'Starred']].concat(list.map(function (x) { return [x.t, chars(x.t), ANGLES[x.a], starred[x.t] ? 'yes' : '']; }))), 'youtube-title-ideas.csv', 'text/csv;charset=utf-8');
      }
    });
    $('tg-sort', root).addEventListener('change', render);
    $('tg-topic', root).addEventListener('keydown', function (e) { if (e.key === 'Enter') generate(); });
    var own = $('tg-own', root);
    function checkOwn() {
      var t = own.value, n = chars(t), msgs = [];
      $('tg-own-c', root).textContent = n + ' / 100';
      meter($('tg-own-m', root), n, 100, 70);
      if (!t.trim()) { $('tg-own-msg', root).innerHTML = ''; return; }
      if (n > 100) msgs.push(notice('error', 'YouTube titles can be at most 100 characters. Remove ' + (n - 100) + '.'));
      else if (n > 70) msgs.push(notice('warn', 'Longer than ~70 characters: the end may be cut off in search results and on phones. Put the key words first.'));
      else msgs.push(notice('ok', 'Good length — likely to show in full in most places.'));
      var c = capsWords(t);
      if (c.flag) msgs.push(notice('warn', 'Lots of ALL-CAPS words (' + esc(c.words.slice(0, 5).join(', ')) + '). Use capitals for one or two words at most; all-caps titles can look like clickbait.'));
      if (/[<>]/.test(t)) msgs.push(notice('error', 'YouTube does not allow the characters &lt; and &gt; in titles.'));
      if (/(!{2,}|\?{2,})/.test(t)) msgs.push(notice('warn', 'Repeated punctuation (!! or ??) can look spammy.'));
      $('tg-own-msg', root).innerHTML = msgs.join('');
    }
    own.addEventListener('input', checkOwn);
    checkOwn();
  });

  // =================================================== 2. Description builder
  /** Parse chapter lines: "0:00 Intro", "Intro - 1:30", "0:00<TAB>Intro" (spreadsheet rows). */
  function parseChapters(text) {
    var out = [], bad = [];
    String(text || '').split(/\r?\n/).forEach(function (line, i) {
      var l = line.trim();
      if (!l) return;
      var m = l.match(/^\(?(\d{1,2}(?::\d{1,2}){1,2})\)?\s*(?:[-–—|:.)\]]\s*|\t+|\s+)(.+)$/);
      if (m) { out.push({ t: parseTime(m[1]), raw: m[1], title: m[2].trim(), line: i + 1 }); return; }
      m = l.match(/^(.+?)\s*(?:[-–—|]\s*|\t+|\s+)\(?(\d{1,2}(?::\d{1,2}){1,2})\)?$/);
      if (m) { out.push({ t: parseTime(m[2]), raw: m[2], title: m[1].trim(), line: i + 1 }); return; }
      bad.push(i + 1);
    });
    out.forEach(function (c) { if (!isFinite(c.t)) bad.push(c.line); });
    return { items: out.filter(function (c) { return isFinite(c.t); }), bad: bad };
  }
  /** YouTube's chapter rules: first at 0:00, at least 3, ascending, each at least 10 seconds. */
  function checkChapters(items) {
    var r = [];
    if (!items.length) return r;
    r.push([items[0].t === 0, 'First timestamp is 0:00' + (items[0].t === 0 ? '' : ' (yours starts at ' + clock(items[0].t) + ')')]);
    r.push([items.length >= 3, 'At least 3 timestamps (' + items.length + ')']);
    var asc = true, short = [];
    for (var i = 1; i < items.length; i++) {
      if (items[i].t <= items[i - 1].t) asc = false;
      else if (items[i].t - items[i - 1].t < 10) short.push(items[i - 1].title);
    }
    r.push([asc, 'Timestamps are in increasing order']);
    r.push([!short.length, 'Each chapter is at least 10 seconds long' + (short.length ? ' (too short: ' + short.slice(0, 3).join(', ') + ')' : '')]);
    return r;
  }
  function cleanHashtag(s) {
    var t = String(s || '').replace(/^#+/, '').replace(/[^\p{L}\p{N}\p{M}_]/gu, '');
    return t && !/^\d+$/.test(t) ? '#' + t : '';
  }
  function parseHashtags(s) {
    var seen = {}, out = [];
    String(s || '').split(/[\s,]+/).forEach(function (w) {
      var t = cleanHashtag(w);
      if (t && !seen[t.toLowerCase()]) { seen[t.toLowerCase()] = 1; out.push(t); }
    });
    return out;
  }

  BT.impl('youtube-description-generator', function (root) {
    css();
    var STYLES = [['tutorial', 'Tutorial'], ['review', 'Product review'], ['vlog', 'Vlog'], ['business', 'Business']];
    var CTA = {
      tutorial: 'If this helped, please like the video and subscribe for more tutorials. Questions? Ask in the comments and I’ll try to answer.',
      review: 'Have you used it? Tell me what you think in the comments. Subscribe for more honest reviews.',
      vlog: 'Thanks for watching! Subscribe and turn on notifications so you don’t miss the next vlog.',
      business: 'Call or WhatsApp us today for a free consultation. Subscribe for tips and updates from our team.'
    };
    var DISC = 'Disclosure: some links above are affiliate links. If you buy through them, I may earn a small commission at no extra cost to you.';
    root.innerHTML =
      hero('notebook-pen', 'Build a clear, well-structured description', 'Fill in what you have — empty fields are skipped. Everything stays on your device.') +
      '<div class="split wide-left"><div>' +
      '<div class="card"><div class="field"><span class="label" id="dg-style-l">Template style</span>' + seg('dg-style', STYLES, 'tutorial', 'Template style') + '</div>' +
        field('dg-sum', 'Video summary (the most important part)', txa('dg-sum', 'In 1–2 sentences, say what the video is about. Use your main keyword naturally — this is what people see before “…more”.', '', 3), 'The first ~150 characters appear in search and above the fold — make them count.', true) +
        field('dg-points', 'Key points (one per line)', txa('dg-points', 'What viewers will learn or see\nAnother key point', '', 4)) +
        '<div class="field"><div class="yt-lrow"><label for="dg-chap">Chapters / timestamps</label><span class="btn-group">' +
          btn('data-a="tidy"', 'list-ordered', 'Tidy', 'btn-ghost') + btn('data-a="sample"', 'list-video', 'Example', 'btn-ghost') + '</span></div>' +
          txa('dg-chap', '0:00 Intro\n0:45 Setting up\n3:10 Results', '', 5, ' class="mono"') +
          '<span class="hint">One per line, like <code>0:00 Intro</code>. You can paste two columns from Excel/Sheets (time and title) — press Tidy to clean them up.</span>' +
          '<div class="yt-ck" id="dg-chk" aria-live="polite"></div></div>' +
      '</div>' +
      '<div class="card"><h3 class="yt-h" style="margin-bottom:12px">Links</h3><div class="row cols-2">' +
        field('dg-web', 'Website', inp('dg-web', 'url', 'https://example.com')) +
        field('dg-sub', 'Subscribe / channel link', inp('dg-sub', 'url', 'https://www.youtube.com/@yourchannel')) +
        field('dg-ig', 'Instagram', inp('dg-ig', 'url', 'https://instagram.com/…')) +
        field('dg-fb', 'Facebook', inp('dg-fb', 'url', 'https://facebook.com/…')) +
        field('dg-x', 'X (Twitter)', inp('dg-x', 'url', 'https://x.com/…')) +
        field('dg-li', 'LinkedIn', inp('dg-li', 'url', 'https://linkedin.com/in/…')) +
      '</div>' +
        field('dg-links', 'Other links — products, resources (one per line: Label | URL)', txa('dg-links', 'Camera I use | https://…\nFree checklist | https://…', '', 3)) +
        '<div class="yt-checks">' + chk('dg-aff', 'These links include affiliate links or a paid promotion', false) + '</div>' +
        field('dg-disc', 'Disclosure text', txa('dg-disc', '', DISC, 2), 'Shown near the top when ticked. Also tick “paid promotion” in YouTube Studio if the video is sponsored.') +
      '</div>' +
      '<div class="card"><h3 class="yt-h" style="margin-bottom:12px">Extras</h3>' +
        field('dg-tags', 'Hashtags', inp('dg-tags', 'text', '#excel #exceltips #learnexcel'), 'Separated by spaces or commas. YouTube can show the first 3 hashtags from your description above your title (if the title has none). Use a few relevant ones — if a video has more than 60 hashtags, YouTube ignores all of them.') +
        field('dg-cta', 'Call to action', txa('dg-cta', '', CTA.tutorial, 2)) +
        field('dg-credits', 'Credits / music attribution', txa('dg-credits', 'Music: “Track name” by Artist — licence (e.g. CC BY 4.0) — link', '', 2), 'Paste exactly the attribution text your music or footage licence asks for.') +
        '<div class="row cols-2">' + field('dg-email', 'Contact email', inp('dg-email', 'email', 'hello@example.com')) +
        field('dg-biz', 'Business details (optional)', txa('dg-biz', 'Address, phone, working hours', '', 2)) + '</div>' +
      '</div></div>' +
      '<div class="yt-sticky"><div class="card"><div class="card-title"><h3 class="yt-h">Your description</h3><span class="yt-count" id="dg-n" aria-live="polite"></span></div>' +
        '<div class="yt-meter" id="dg-m" style="margin-bottom:12px"><span></span></div>' +
        '<div class="yt-desc" id="dg-prev" tabindex="0" aria-label="Description preview"></div>' +
        '<div class="yt-legend"><span><i></i>First ~150 characters: shown in search and before “…more”</span></div>' +
        '<div class="yt-toolbar yt-gap">' + btn('data-a="copy"', 'copy', 'Copy description', 'btn-primary') + btn('data-a="dl"', 'download', 'Download .txt') + '</div>' +
        '<div class="yt-msgs" id="dg-msg"></div>' +
      '</div></div></div>';

    var styleEl = $('dg-style', root), style = 'tutorial', text = '';
    wireSeg(styleEl, function (v) {
      var cta = $('dg-cta', root);
      if (!cta.value.trim() || Object.keys(CTA).some(function (k) { return CTA[k] === cta.value; })) cta.value = CTA[v];
      style = v;
      if (v === 'review' && !$('dg-aff', root).checked) BT.toast('Tip: tick the affiliate box if you link to products');
      update();
    });
    function lines(id) { return val(root, id).split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean); }
    function build() {
      var S = [], sum = val(root, 'dg-sum'), pts = lines('dg-points'), ch = parseChapters(val(root, 'dg-chap')).items;
      var other = lines('dg-links').map(function (l) {
        var m = l.match(/^(.*?)\s*[|–—-]\s*(https?:\/\/\S+)$/) || l.match(/^(.*?)\s*:\s*(https?:\/\/\S+)$/);
        return m ? (m[1] ? m[1] + ': ' : '') + m[2] : l;
      });
      var aff = val(root, 'dg-aff'), disc = val(root, 'dg-disc');
      var soc = [['Instagram', 'dg-ig'], ['Facebook', 'dg-fb'], ['X', 'dg-x'], ['LinkedIn', 'dg-li']].filter(function (s) { return val(root, s[1]); })
        .map(function (s) { return s[0] + ': ' + val(root, s[1]); });
      var web = val(root, 'dg-web'), sub = val(root, 'dg-sub'), email = val(root, 'dg-email'), biz = val(root, 'dg-biz');
      var cta = val(root, 'dg-cta'), cred = val(root, 'dg-credits'), tags = parseHashtags(val(root, 'dg-tags'));
      function block(title, arr, bullet) {
        if (!arr.length) return;
        S.push((title ? title + '\n' : '') + arr.map(function (x) { return (bullet ? '• ' : '') + x; }).join('\n'));
      }
      function chapters() { if (ch.length) block(style === 'vlog' ? 'Timestamps:' : 'Chapters:', ch.map(function (c) { return clock(c.t) + ' ' + c.title; })); }
      if (sum) S.push(sum);
      if (aff && disc && style === 'review') S.push(disc);
      if (style === 'business') {
        block('Highlights:', pts, true);
        block('Contact us:', [email ? 'Email: ' + email : '', web ? 'Website: ' + web : ''].filter(Boolean).concat(biz ? biz.split(/\r?\n/) : []));
        chapters();
        block('Useful links:', other);
      } else {
        block(style === 'tutorial' ? 'In this video:' : style === 'review' ? 'What I cover:' : 'Highlights:', pts, true);
        chapters();
        block(style === 'review' ? 'Links mentioned:' : 'Resources & links:', other.concat(web && style !== 'vlog' ? ['Website: ' + web] : []));
        if (aff && disc && style !== 'review') S.push(disc);
      }
      if (aff && disc && style === 'business') S.push(disc);
      if (cta) S.push(cta + (sub ? '\nSubscribe: ' + sub : ''));
      else if (sub) S.push('Subscribe: ' + sub);
      block(style === 'vlog' ? 'Follow along:' : 'Connect with me:', soc.concat(style === 'vlog' && web ? ['Website: ' + web] : []));
      if (cred) block('Credits:', cred.split(/\r?\n/).filter(Boolean));
      if (email && style !== 'business') S.push('Business enquiries: ' + email);
      if (biz && style !== 'business') S.push(biz);
      if (tags.length) S.push(tags.join(' '));
      return S.join('\n\n');
    }
    function update() {
      text = build();
      var n = chars(text), fold = 150;
      var arr = Array.from(text), head = arr.slice(0, fold).join(''), rest = arr.slice(fold).join('');
      var prev = $('dg-prev', root);
      prev.innerHTML = text ? '<mark class="fold">' + esc(head) + '</mark>' + (rest ? '<span class="more" aria-hidden="true">…more</span>' + esc(rest) : '')
        : '<span class="muted">Start typing a summary and your description will appear here.</span>';
      $('dg-n', root).textContent = BT.fmtNum(n, 0) + ' / 5,000 characters';
      meter($('dg-m', root), n, 5000, 4500);
      $('dg-sum-c', root).textContent = chars(val(root, 'dg-sum')) + ' characters';
      // chapter checks
      var pc = parseChapters(val(root, 'dg-chap')), ck = checkChapters(pc.items), ce = $('dg-chk', root);
      ce.innerHTML = ck.map(function (c) { return '<div><span class="' + (c[0] ? 'y' : 'n') + '">' + BT.icon(c[0] ? 'check' : 'x') + '</span><span>' + esc(c[1]) + '</span></div>'; }).join('') +
        (pc.bad.length ? '<div><span class="w">' + BT.icon('info') + '</span><span>Could not read line ' + pc.bad.slice(0, 5).join(', ') + ' — use “0:00 Title”.</span></div>' : '');
      var m = [];
      if (n > 5000) m.push(notice('error', 'Too long: YouTube descriptions can be at most 5,000 characters. Remove ' + BT.fmtNum(n - 5000, 0) + '.'));
      if (/[<>]/.test(text)) m.push(notice('error', 'YouTube does not accept the characters &lt; and &gt; in descriptions. Remove them before pasting.'));
      var tags = parseHashtags(val(root, 'dg-tags'));
      if (tags.length > 60) m.push(notice('error', 'More than 60 hashtags: YouTube ignores all hashtags on the video.'));
      else if (tags.length > 15) m.push(notice('warn', plural(tags.length, 'hashtag') + ' — a few relevant hashtags usually work better than many.'));
      if (pc.items.length && ck.some(function (c) { return !c[0]; })) m.push(notice('warn', 'Your chapters don’t meet YouTube’s rules yet, so they may not show as chapters on the video timeline.'));
      var em = val(root, 'dg-email');
      if (em && !isEmail(em)) m.push(notice('warn', 'The contact email doesn’t look valid.'));
      var badUrl = ['dg-web', 'dg-sub', 'dg-ig', 'dg-fb', 'dg-x', 'dg-li'].filter(function (id) { var v = val(root, id); return v && !isUrl(v); });
      if (badUrl.length) m.push(notice('warn', 'Start links with https:// so YouTube makes them clickable.'));
      if (val(root, 'dg-aff') && !val(root, 'dg-disc')) m.push(notice('warn', 'Add disclosure text for your affiliate links.'));
      $('dg-msg', root).innerHTML = m.join('');
    }
    var upd = BT.debounce(update, 120);
    root.addEventListener('input', upd);
    root.addEventListener('change', function (e) { if (e.target.type === 'checkbox') update(); });
    onA(root, {
      copy: function () { if (!text) return BT.toast('Nothing to copy yet', 'error'); BT.copy(text, 'Description copied'); },
      dl: function () { if (!text) return BT.toast('Nothing to download yet', 'error'); BT.download(text, 'youtube-description.txt', 'text/plain;charset=utf-8'); },
      tidy: function () {
        var pc = parseChapters(val(root, 'dg-chap'));
        if (!pc.items.length) return BT.toast('No chapters found to tidy', 'error');
        pc.items.sort(function (a, b) { return a.t - b.t; });
        $('dg-chap', root).value = pc.items.map(function (c) { return clock(c.t) + ' ' + c.title; }).join('\n');
        update();
        BT.toast('Chapters tidied and sorted');
      },
      sample: function () {
        var c = $('dg-chap', root);
        if (c.value.trim() && !confirm('Replace your chapters with an example?')) return;
        c.value = '0:00 Intro\n0:35 What you need\n2:10 Step 1 — Setup\n5:40 Step 2 — Main part\n9:15 Common mistakes\n11:30 Final result';
        update();
      }
    });
    update();
  });

  /*__END__*/
})();
