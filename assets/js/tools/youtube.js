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

  // ========================================================= 3. Tag builder
  function pluralWord(w) {
    if (/[^aeiou]y$/i.test(w)) return w.slice(0, -1) + 'ies';
    if (/(s|x|z|ch|sh)$/i.test(w)) return w + 'es';
    return w + 's';
  }
  function singularWord(w) {
    if (/[^aeiou]ies$/i.test(w)) return w.slice(0, -3) + 'y';
    if (/(ses|xes|zes|ches|shes)$/i.test(w)) return w.slice(0, -2);
    if (/[^su]s$/i.test(w) && w.length > 3) return w.slice(0, -1);
    return w;
  }
  /** Swap the number of the last (English) word: "phone case" -> "phone cases". */
  function numberVariant(phrase) {
    var m = phrase.match(/^(.*?)([A-Za-z]+)$/);
    if (!m || m[2].length < 3) return '';
    var w = m[2], s = singularWord(w);
    var alt = s !== w ? s : pluralWord(w);
    return alt === w ? '' : m[1] + alt;
  }
  /**
   * Characters YouTube counts towards its 500-character tag limit (our model):
   * each tag's length, +2 for the quotes added around tags containing a space,
   * plus one comma between tags.
   */
  function tagCost(t) { return chars(t) + (/\s/.test(t) ? 2 : 0); }
  function tagTotal(tags) {
    return tags.reduce(function (a, t) { return a + tagCost(t); }, 0) + Math.max(0, tags.length - 1);
  }
  function cleanTag(t) { return String(t || '').replace(/[<>,"]/g, ' ').replace(/^#+/, '').replace(/\s+/g, ' ').trim(); }

  BT.impl('youtube-tag-generator', function (root) {
    css();
    var tags = [];
    var MODS = [
      ['tm-plural', 'Singular / plural', true], ['tm-howto', '“how to …”', true], ['tm-beg', '“… for beginners”', true],
      ['tm-tut', '“… tutorial”', true], ['tm-tips', '“… tips”', true], ['tm-exp', '“… explained”', false],
      ['tm-rev', '“… review”', false], ['tm-hindi', '“… in hindi”', false], ['tm-bengali', '“… in bengali”', false], ['tm-india', '“… india”', false]
    ];
    root.innerHTML =
      hero('tags', 'Tags from your own keywords', 'Built from your seed keywords with common modifiers — no search data is used. Year-free, so they don’t go stale.') +
      '<div class="card">' +
        field('tt-seed', 'Seed keywords', txa('tt-seed', 'excel pivot table, excel for beginners, data analysis', '', 3), 'Separate with commas or new lines. Most important first.') +
        '<div class="row cols-2">' + field('tt-city', 'City / location (optional)', inp('tt-city', 'text', 'e.g. Kolkata', '', ' maxlength="40"')) +
        field('tt-brand', 'Channel or brand name (optional)', inp('tt-brand', 'text', 'e.g. BISCS India', '', ' maxlength="60"')) + '</div>' +
        '<div class="field"><span class="label">Add variations</span><div class="yt-checks">' + MODS.map(function (m) { return chk(m[0], m[1], m[2]); }).join('') + '</div></div>' +
        '<div class="btn-group">' + btn('data-a="gen"', 'sparkles', 'Generate tags', 'btn-primary') + '</div>' +
      '</div>' +
      '<div class="card"><div class="card-title"><h3 class="yt-h">Your tags</h3><span class="yt-count" id="tt-n" aria-live="polite"></span></div>' +
        '<div class="yt-meter" id="tt-m" style="margin-bottom:12px"><span></span></div>' +
        '<div class="yt-tags" id="tt-list" role="list" aria-label="Tags (drag or use arrow keys to reorder, Delete to remove)" data-empty="Generate tags or add your own below."></div>' +
        '<p class="small muted" style="margin:8px 0 12px">Drag the ' + BT.icon('grip-vertical') + ' handle to reorder. On a keyboard: focus a tag, use the arrow keys to move it and Delete to remove it. Tags past the limit are crossed out.</p>' +
        '<div class="field"><label for="tt-add">Add your own tag</label><div class="input-group">' + inp('tt-add', 'text', 'Type a tag (or several, comma-separated) and press Enter', '', ' autocomplete="off"') +
          '<button type="button" class="btn" data-a="add">' + BT.icon('plus') + '<span>Add</span></button></div></div>' +
        '<div class="yt-toolbar">' + btn('data-a="copy"', 'copy', 'Copy (comma-separated)', 'btn-primary') + btn('data-a="trim"', 'scissors', 'Trim to 500') +
          btn('data-a="dl"', 'download', 'TXT') + btn('data-a="clear"', 'trash-2', 'Clear', 'btn-ghost') + '</div>' +
        '<div class="yt-msgs">' + notice('', '<strong>How the counter works:</strong> YouTube allows about 500 characters of tags in total. We count every character, one comma between tags, and 2 extra for the quotes YouTube adds around tags that contain a space (e.g. <code>"excel tips"</code> = 12). This is an approximation of how YouTube Studio counts — Studio’s own counter is the final word.') +
          notice('warn', '<strong>Tags matter less than you might think.</strong> YouTube says tags play a minimal role in discovery and are mainly useful for commonly misspelled words. Your title, thumbnail and description matter far more. Don’t add tags that aren’t about your video — misleading metadata is against YouTube’s policies.') + '</div>' +
        '<div aria-live="polite" class="sr-only" id="tt-live"></div>' +
      '</div>';

    var listEl = $('tt-list', root);
    function within() {
      var used = 0, n = 0;
      for (var i = 0; i < tags.length; i++) {
        var add = tagCost(tags[i]) + (i ? 1 : 0);
        if (used + add > 500) break;
        used += add; n++;
      }
      return n;
    }
    function addTags(arr) {
      var seen = {};
      tags.forEach(function (t) { seen[t.toLowerCase()] = 1; });
      var added = 0;
      arr.forEach(function (t) {
        t = cleanTag(t);
        if (!t || chars(t) > 100 || seen[t.toLowerCase()]) return;
        seen[t.toLowerCase()] = 1; tags.push(t); added++;
      });
      return added;
    }
    function generate() {
      var seeds = val(root, 'tt-seed').split(/[,\n]+/).map(function (s) { return cleanTag(s).toLowerCase(); }).filter(Boolean);
      if (!seeds.length) { BT.toast('Type at least one keyword', 'error'); $('tt-seed', root).focus(); return; }
      var on = function (id) { return val(root, id); };
      var city = cleanTag(val(root, 'tt-city')).toLowerCase(), brand = cleanTag(val(root, 'tt-brand'));
      var out = [];
      seeds.forEach(function (s) { out.push(s); });
      if (on('tm-plural')) seeds.forEach(function (s) { var v = numberVariant(s); if (v) out.push(v); });
      seeds.forEach(function (s, i) {
        var base = s.replace(/^how to\s+/, '');
        var strip = !/(tutorial|tips|review|explained|guide)$/.test(base);
        if (on('tm-howto') && !/^how to /.test(s)) out.push('how to ' + (/^(use|make|learn|start|do|get|build|create|fix|choose|cook|edit|play)\b/.test(base) ? base : 'use ' + base));
        if (on('tm-beg') && !/beginners?$/.test(base)) out.push(base + ' for beginners');
        if (on('tm-tut') && strip) out.push(base + ' tutorial');
        if (on('tm-tips') && strip) out.push(base + ' tips');
        if (on('tm-exp') && strip) out.push(base + ' explained');
        if (on('tm-rev') && strip) out.push(base + ' review');
        if (on('tm-hindi')) out.push(base + ' in hindi');
        if (on('tm-bengali')) out.push(base + ' in bengali');
        if (on('tm-india') && !/india/.test(base)) out.push(base + ' india');
        if (city && i < 3) out.push(base + ' ' + city);
      });
      if (seeds.length > 1 && on('tm-beg')) out.push(seeds[0] + ' guide');
      if (on('tm-hindi') && on('tm-tut')) out.push(seeds[0] + ' tutorial in hindi');
      if (city) out.push(city);
      if (brand) out.push(brand);
      tags = [];
      addTags(out);
      render();
      announce(plural(tags.length, 'tag') + ' generated');
    }
    function announce(m) { $('tt-live', root).textContent = m; }
    function render(focusIdx) {
      var n = within(), total = tagTotal(tags);
      $('tt-n', root).textContent = BT.fmtNum(total, 0) + ' / 500 characters · ' + plural(tags.length, 'tag');
      meter($('tt-m', root), total, 500, 450);
      listEl.innerHTML = tags.map(function (t, i) {
        return '<span class="yt-tag' + (i >= n ? ' over' : '') + '" role="listitem" tabindex="0" data-i="' + i + '" aria-label="' + esc(t) + ', tag ' + (i + 1) + ' of ' + tags.length + (i >= n ? ', over the limit' : '') + '">' +
          '<span class="gr" data-grip aria-hidden="true">' + BT.icon('grip-vertical') + '</span><span class="tx">' + esc(t) + '</span><span class="n" aria-hidden="true">' + tagCost(t) + '</span>' +
          '<button type="button" data-a="del" data-i="' + i + '" aria-label="Remove ' + esc(t) + '">' + BT.icon('x') + '</button></span>';
      }).join('');
      if (focusIdx != null && listEl.children[focusIdx]) listEl.children[focusIdx].focus();
    }
    function move(from, to) {
      if (to < 0 || to >= tags.length || from === to) return;
      var t = tags.splice(from, 1)[0];
      tags.splice(to, 0, t);
    }
    // Pointer drag (mouse + touch) on the grip handle.
    var drag = null;
    listEl.addEventListener('pointerdown', function (e) {
      var g = e.target.closest('[data-grip]');
      if (!g) return;
      var chip = g.closest('.yt-tag');
      e.preventDefault();
      drag = { from: +chip.getAttribute('data-i'), chip: chip, id: e.pointerId };
      chip.classList.add('drag');
      try { g.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
    });
    listEl.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var el = doc.elementFromPoint(e.clientX, e.clientY), over = el && el.closest && el.closest('.yt-tag');
      BT.$$('.yt-tag.ph', listEl).forEach(function (x) { x.classList.remove('ph'); });
      if (over && over !== drag.chip) { over.classList.add('ph'); drag.to = +over.getAttribute('data-i'); }
      else drag.to = null;
    });
    function endDrag() {
      if (!drag) return;
      var d = drag; drag = null;
      if (d.to != null) { move(d.from, d.to); announce('Moved to position ' + (d.to + 1)); render(); }
      else { d.chip.classList.remove('drag'); BT.$$('.yt-tag.ph', listEl).forEach(function (x) { x.classList.remove('ph'); }); }
    }
    listEl.addEventListener('pointerup', endDrag);
    listEl.addEventListener('pointercancel', endDrag);
    listEl.addEventListener('keydown', function (e) {
      var chip = e.target.closest('.yt-tag');
      if (!chip || e.target !== chip) return;
      var i = +chip.getAttribute('data-i');
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); if (i > 0) { move(i, i - 1); render(i - 1); announce('Moved to position ' + i); } }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); if (i < tags.length - 1) { move(i, i + 1); render(i + 1); announce('Moved to position ' + (i + 2)); } }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); var t = tags.splice(i, 1)[0]; render(Math.min(i, tags.length - 1)); announce('Removed ' + t); }
    });
    function addOwn() {
      var el = $('tt-add', root), v = el.value;
      if (!v.trim()) return;
      var n = addTags(v.split(','));
      if (!n) BT.toast('That tag is already in the list', 'error');
      el.value = '';
      render();
    }
    $('tt-add', root).addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addOwn(); } });
    onA(root, {
      gen: generate,
      add: addOwn,
      del: function (b) { var i = +b.getAttribute('data-i'); var t = tags.splice(i, 1)[0]; render(); announce('Removed ' + t); },
      copy: function () {
        if (!tags.length) return BT.toast('No tags yet', 'error');
        var n = within();
        BT.copy(tags.slice(0, n).join(','), plural(n, 'tag') + ' copied' + (n < tags.length ? ' (tags over the limit left out)' : ''));
      },
      trim: function () { var n = within(); if (n < tags.length) { tags = tags.slice(0, n); render(); BT.toast('Trimmed to ' + plural(n, 'tag')); } else BT.toast('Already within 500 characters'); },
      dl: function () { if (tags.length) BT.download(tags.join(', '), 'youtube-tags.txt', 'text/plain;charset=utf-8'); },
      clear: function () { tags = []; render(); }
    });
    render();
    // expose for tests / power users: count rule
    root.setAttribute('data-rule', 'chars + 2 per spaced tag + commas');
  });

  // ===================================================== 4. Hashtag builder
  // Built-in topic dictionaries (no popularity data). m: words that detect the topic.
  var HT = {
    tech: { n: 'Tech & gadgets', m: 'tech technology phone smartphone mobile laptop gadget android iphone ai software coding programming computer app pc camera headphone earbuds smartwatch excel', broad: ['Tech', 'Technology', 'Gadgets', 'TechNews', 'Smartphone', 'Innovation'], niche: ['TechReview', 'TechTips', 'Unboxing', 'AndroidTips', 'iPhoneTips', 'LaptopReview', 'GadgetReview', 'TechExplained', 'AITools', 'Coding', 'Programming', 'TechIndia'] },
    food: { n: 'Food & recipes', m: 'food recipe cooking cook kitchen biryani dish snack street sweet mishti restaurant cafe baking cake veg chicken fish thali dessert', broad: ['Food', 'Foodie', 'FoodLover', 'Recipe', 'Cooking', 'Homemade'], niche: ['IndianFood', 'StreetFood', 'HomeCooking', 'EasyRecipes', 'DesiFood', 'FoodBlogger', 'FoodPhotography', 'VegRecipes', 'Baking', 'QuickRecipes', 'IndianStreetFood', 'FoodVlog'] },
    travel: { n: 'Travel', m: 'travel trip tour vlog journey hill beach mountain trek darjeeling goa himalaya road hotel holiday vacation explore', broad: ['Travel', 'TravelGram', 'Wanderlust', 'TravelVlog', 'Explore', 'Adventure'], niche: ['IncredibleIndia', 'TravelIndia', 'BudgetTravel', 'RoadTrip', 'Backpacking', 'HillStation', 'WeekendGetaway', 'SoloTravel', 'TravelTips', 'IndiaTravel', 'TravelDiaries', 'Trekking'] },
    fitness: { n: 'Fitness', m: 'fitness gym workout exercise yoga weight loss fat muscle diet running cardio abs', broad: ['Fitness', 'Workout', 'Gym', 'Health', 'FitnessMotivation', 'HealthyLifestyle'], niche: ['HomeWorkout', 'Yoga', 'WeightLoss', 'FitIndia', 'Running', 'StrengthTraining', 'FitnessTips', 'GymLife', 'YogaPractice', 'FatLoss', 'NoEquipmentWorkout', 'DesiFitness'] },
    education: { n: 'Education & exams', m: 'study exam student education learn learning class course school college upsc neet jee board teacher tuition english maths science', broad: ['Education', 'Learning', 'Students', 'Study', 'Knowledge', 'OnlineLearning'], niche: ['StudyTips', 'ExamPreparation', 'StudyMotivation', 'UPSC', 'NEET', 'JEE', 'BoardExams', 'LearnEnglish', 'StudyWithMe', 'CompetitiveExams', 'EdTech', 'TeachersOfIndia'] },
    business: { n: 'Business & startups (India)', m: 'business startup entrepreneur company brand marketing sales shop msme small gst founder freelance agency ecommerce', broad: ['Business', 'Entrepreneur', 'Startup', 'Marketing', 'SmallBusiness', 'Success'], niche: ['StartupIndia', 'MSME', 'DigitalMarketing', 'Branding', 'BusinessTips', 'Entrepreneurship', 'MakeInIndia', 'VocalForLocal', 'SideHustle', 'SmallBusinessIndia', 'IndianStartups', 'GrowYourBusiness'] },
    finance: { n: 'Money & investing', m: 'money finance invest investing stock share market mutual fund sip tax saving loan budget crypto trading insurance', broad: ['PersonalFinance', 'Investing', 'Money', 'Finance', 'StockMarket', 'FinancialFreedom'], niche: ['MutualFunds', 'SIP', 'MoneyTips', 'Nifty', 'Sensex', 'TaxSaving', 'FinancialLiteracy', 'Budgeting', 'StockMarketIndia', 'IncomeTax', 'WealthCreation', 'PersonalFinanceIndia'] },
    festivals: { n: 'Festivals in India', m: 'festival diwali holi puja durga navratri eid christmas ganesh rakhi raksha pongal onam dussehra bihu chhath kali saraswati poila boishakh celebration', broad: ['Festival', 'IndianFestivals', 'Celebration', 'FestiveSeason', 'India', 'Tradition'], niche: ['Diwali', 'Holi', 'DurgaPuja', 'Navratri', 'Eid', 'Christmas', 'GaneshChaturthi', 'RakshaBandhan', 'Pongal', 'Onam', 'Dussehra', 'KaliPuja'] },
    kolkata: { n: 'Kolkata & West Bengal', m: 'kolkata calcutta bengal bengali bangla howrah salt lake durga puja park street sealdah siliguri durgapur', broad: ['Kolkata', 'WestBengal', 'Bengal', 'CityOfJoy', 'Bengali', 'Calcutta'], niche: ['KolkataDiaries', 'KolkataFood', 'KolkataStreetFood', 'KolkataVlog', 'Howrah', 'DurgaPujaKolkata', 'KolkataBlogger', 'BengaliFood', 'Bangla', 'KolkataCity', 'KolkataEvents', 'BengalTourism'] },
    fashion: { n: 'Fashion', m: 'fashion style outfit saree kurti dress clothes wear ethnic shopping lehenga jewellery', broad: ['Fashion', 'Style', 'OOTD', 'FashionBlogger', 'Outfit', 'Shopping'], niche: ['IndianWear', 'Saree', 'EthnicWear', 'StreetStyle', 'FashionInspo', 'Kurti', 'SareeLove', 'IndianFashion', 'StyleTips', 'Lehenga', 'HandloomSaree', 'BudgetFashion'] },
    beauty: { n: 'Beauty & skincare', m: 'beauty makeup skincare skin hair glow cosmetic lipstick serum facial', broad: ['Beauty', 'Makeup', 'Skincare', 'SelfCare', 'Glow', 'BeautyTips'], niche: ['MakeupTutorial', 'SkincareRoutine', 'GlowingSkin', 'NaturalBeauty', 'HairCare', 'IndianSkincare', 'MakeupLook', 'SkincareTips', 'HomeRemedies', 'BeautyBlogger', 'Haircut', 'MakeupForBeginners'] },
    gaming: { n: 'Gaming', m: 'game gaming gamer play bgmi freefire minecraft gta valorant pubg esports stream console playstation xbox', broad: ['Gaming', 'Gamer', 'Games', 'GamingCommunity', 'LiveStream', 'Esports'], niche: ['MobileGaming', 'PCGaming', 'BGMI', 'Minecraft', 'GamingClips', 'IndianGamer', 'GameplayVideo', 'GamingSetup', 'Streamer', 'GamingIndia', 'Valorant', 'ConsoleGaming'] },
    music: { n: 'Music', m: 'music song singing singer cover guitar piano band lyrics rabindra sangeet bollywood rap beat dance', broad: ['Music', 'Song', 'Singer', 'Musician', 'LiveMusic', 'NewMusic'], niche: ['CoverSong', 'IndianMusic', 'Bollywood', 'BollywoodSongs', 'Rabindrasangeet', 'Guitar', 'Singing', 'IndieMusic', 'Unplugged', 'BengaliSong', 'ClassicalMusic', 'OriginalSong'] },
    photo: { n: 'Photography & video', m: 'photography photo photographer camera video editing videography lightroom reel cinematic shot portrait', broad: ['Photography', 'Photographer', 'PhotoOfTheDay', 'Photo', 'Camera', 'Creative'], niche: ['MobilePhotography', 'StreetPhotography', 'NaturePhotography', 'PortraitPhotography', 'PhotographyTips', 'VideoEditing', 'Videography', 'CinematicVideo', 'PhotoEditing', 'IndianPhotography', 'ShotOnPhone', 'GoldenHour'] },
    motivation: { n: 'Motivation & self-growth', m: 'motivation inspiration success mindset habit productivity life lesson goal discipline self improvement', broad: ['Motivation', 'Inspiration', 'Success', 'Mindset', 'Life', 'Goals'], niche: ['SelfImprovement', 'Productivity', 'PersonalGrowth', 'DailyMotivation', 'MotivationalVideo', 'GrowthMindset', 'Discipline', 'MorningRoutine', 'LifeLessons', 'SuccessMindset', 'HabitBuilding', 'PositiveVibes'] },
    health: { n: 'Health & wellness', m: 'health wellness doctor medical mental ayurveda nutrition diabetes sleep diet care home remedy', broad: ['Health', 'Wellness', 'HealthyLiving', 'SelfCare', 'Nutrition', 'HealthTips'], niche: ['MentalHealth', 'Ayurveda', 'HealthyEating', 'HealthAwareness', 'HomeRemedies', 'WellnessJourney', 'HealthyHabits', 'Mindfulness', 'GutHealth', 'DiabetesCare', 'SleepBetter', 'IndianDiet'] },
    property: { n: 'Home & real estate', m: 'home house flat apartment property real estate interior decor room design renovation rent', broad: ['RealEstate', 'Home', 'HomeDecor', 'InteriorDesign', 'Property', 'HomeTour'], niche: ['RealEstateIndia', 'InteriorDesignIdeas', 'HomeRenovation', 'SmallSpaces', 'DreamHome', 'ApartmentTour', 'HomeMakeover', 'KolkataRealEstate', 'Vastu', 'DIYHomeDecor', 'ModularKitchen', 'BudgetDecor'] }
  };
  var HT_INDIA = ['India', 'IncredibleIndia', 'Indian', 'Desi', 'Bharat', 'MadeInIndia'];
  var HT_PLAT = {
    youtube: { n: 'YouTube', def: 3, hard: 60, extra: ['YouTube', 'YouTuber', 'Shorts', 'YouTubeShorts', 'ContentCreator'] },
    instagram: { n: 'Instagram', def: 5, hard: 30, extra: ['Reels', 'InstagramReels', 'Instagram', 'ContentCreator', 'ReelItFeelIt'] },
    facebook: { n: 'Facebook', def: 3, hard: null, extra: ['FacebookReels', 'Facebook', 'ContentCreator'] }
  };
  function camel(words) { return words.map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(''); }
  function detectCats(topic) {
    var words = String(topic).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    var score = [];
    Object.keys(HT).forEach(function (k) {
      var dict = ' ' + HT[k].m + ' ', s = 0;
      words.forEach(function (w) { if (w.length > 1 && dict.indexOf(' ' + w + ' ') >= 0) s++; });
      if (s) score.push([k, s]);
    });
    return score.sort(function (a, b) { return b[1] - a[1]; }).map(function (x) { return x[0]; });
  }

  BT.impl('hashtag-generator', function (root) {
    css();
    var plat = 'youtube', groups = [], picked = {};
    var CATS = [['auto', 'Auto-detect from topic']].concat(Object.keys(HT).map(function (k) { return [k, HT[k].n]; }));
    root.innerHTML =
      hero('hash', 'Relevant hashtags for each platform', 'From built-in topic lists — no popularity numbers, because we don’t use any platform data.') +
      '<div class="card"><div class="row cols-2">' +
        field('hg-topic', 'Topic', inp('hg-topic', 'text', 'e.g. Kolkata street food, budget phone review', '', ' maxlength="80" autocomplete="off"')) +
        field('hg-cat', 'Category', sel('hg-cat', CATS, 'auto')) +
      '</div><div class="yt-checks">' + chk('hg-in', 'Add India tags', true) + chk('hg-kol', 'Add Kolkata / West Bengal tags', false) +
        chk('hg-camel', 'CamelCase (#StreetFood — easier to read and screen-reader friendly)', true) + '</div>' +
        '<div class="btn-group">' + btn('data-a="gen"', 'sparkles', 'Generate hashtags', 'btn-primary') + '</div>' +
      '</div>' +
      '<div class="card hidden" id="hg-out">' +
        '<div class="yt-tabs">' + seg('hg-plat', [['youtube', 'YouTube'], ['instagram', 'Instagram'], ['facebook', 'Facebook']], 'youtube', 'Platform') + '</div>' +
        '<div id="hg-rules"></div>' +
        '<div class="card-title yt-gap"><h3 class="yt-h">Selected</h3><span class="yt-count" id="hg-n" aria-live="polite"></span></div>' +
        '<div class="yt-hout" id="hg-sel" aria-live="polite"></div>' +
        '<div class="yt-toolbar yt-gap">' + btn('data-a="copy"', 'copy', 'Copy selected', 'btn-primary') + btn('data-a="copyall"', 'copy', 'Copy all') +
          btn('data-a="none"', 'x', 'Clear selection', 'btn-ghost') + '</div>' +
        '<p class="small muted">Tap a hashtag to add or remove it.</p>' +
        '<div id="hg-groups"></div>' +
      '</div>';

    var platEl = $('hg-plat', root);
    wireSeg(platEl, function (v) { plat = v; autoPick(); render(); });
    function fmt(words) {
      var camelOn = val(root, 'hg-camel');
      return camelOn ? camel(words) : words.join('').toLowerCase();
    }
    function tagOf(raw) {
      var c = cleanHashtag(val(root, 'hg-camel') ? raw : String(raw).toLowerCase());
      return c;
    }
    function generate() {
      var topic = val(root, 'hg-topic');
      if (!topic) { BT.toast('Type a topic first', 'error'); $('hg-topic', root).focus(); return; }
      var words = topic.split(/[^\p{L}\p{N}\p{M}]+/u).filter(Boolean);
      var stop = /^(a|an|and|the|of|for|in|on|to|with|my|your|how|what|why|vs|is|are|best|top)$/i;
      var key = words.filter(function (w) { return !stop.test(w); });
      var own = [];
      if (key.length) own.push(fmt(key));
      if (key.length > 1) {
        for (var i = 0; i < key.length - 1; i++) own.push(fmt([key[i], key[i + 1]]));
        key.forEach(function (w) { if (w.length > 3) own.push(fmt([w])); });
      }
      if (key.length) { own.push(fmt(key.concat(['tips']))); own.push(fmt(key.concat(['india']))); }
      var cat = val(root, 'hg-cat'), cats = cat === 'auto' ? detectCats(topic).slice(0, 2) : [cat];
      var niche = [], broad = [];
      cats.forEach(function (k) {
        var d = HT[k];
        // dictionary entries that literally match the topic go first
        var lower = topic.toLowerCase().replace(/\s+/g, '');
        d.niche.forEach(function (t) { (lower.indexOf(t.toLowerCase()) >= 0 ? niche.unshift(t) : niche.push(t)); });
        broad = broad.concat(d.broad);
      });
      var local = [];
      if (val(root, 'hg-kol') && cats.indexOf('kolkata') < 0) local = local.concat(HT.kolkata.broad.slice(0, 4), HT.kolkata.niche.slice(0, 4));
      if (val(root, 'hg-in')) local = local.concat(HT_INDIA);
      groups = [
        { id: 'own', n: 'From your topic', d: 'most specific', tags: own },
        { id: 'niche', n: 'Niche', d: cats.length ? cats.map(function (k) { return HT[k].n; }).join(' + ') : 'choose a category for more', tags: niche },
        { id: 'broad', n: 'Broad', d: 'large, very competitive', tags: broad },
        { id: 'local', n: 'Local', d: 'India / Kolkata', tags: local },
        { id: 'plat', n: 'Platform', d: 'only if they fit your post', tags: [] }
      ];
      var seen = {};
      groups.forEach(function (g) {
        g.tags = g.tags.map(tagOf).filter(function (t) { if (!t || seen[t.toLowerCase()]) return false; seen[t.toLowerCase()] = 1; return true; });
      });
      if (!cats.length) BT.toast('No matching category found — pick one for more ideas');
      picked = {};
      autoPick();
      render();
      $('hg-out', root).classList.remove('hidden');
    }
    function platTags() {
      var seen = {};
      groups.forEach(function (g) { if (g.id !== 'plat') g.tags.forEach(function (t) { seen[t.toLowerCase()] = 1; }); });
      return HT_PLAT[plat].extra.map(tagOf).filter(function (t) { return t && !seen[t.toLowerCase()]; });
    }
    function autoPick() {
      if (!groups.length) return;
      groups[4].tags = platTags();
      var want = HT_PLAT[plat].def, order = [];
      // mix: specific first, then niche, then one broad
      var g = groups;
      [g[0].tags[0], g[1].tags[0], g[0].tags[1], g[1].tags[1], g[2].tags[0], g[1].tags[2], g[3].tags[0], g[0].tags[2]].forEach(function (t) { if (t && order.indexOf(t) < 0) order.push(t); });
      picked = {};
      order.slice(0, want).forEach(function (t) { picked[t] = 1; });
    }
    function selected() {
      var out = [];
      groups.forEach(function (g) { g.tags.forEach(function (t) { if (picked[t] && out.indexOf(t) < 0) out.push(t); }); });
      return out;
    }
    function render() {
      var P = HT_PLAT[plat], s = selected(), str = s.join(' ');
      var rules = {
        youtube: 'Hashtags can’t contain spaces. YouTube can show the <strong>first 3 hashtags</strong> from your description above your title (when the title itself has none). If a video has <strong>more than 60 hashtags</strong>, YouTube ignores all of them — 3 to 5 relevant ones are plenty.',
        instagram: 'Instagram allows <strong>up to 30 hashtags</strong> per post, but its current guidance is to use <strong>a few (around 3–5) relevant hashtags</strong> rather than the maximum. Mix specific and broad tags that truly describe the post.',
        facebook: 'On Facebook, use <strong>just a few relevant hashtags</strong> (1–3 is typical). Too many can make a post look like spam.'
      };
      $('hg-rules', root).innerHTML = notice('', rules[plat]) + '<div class="yt-msgs">' + notice('warn', 'No popularity or reach numbers are shown because we don’t have that data — anyone showing “post counts” is reading platform data we don’t use. Avoid hashtags that don’t match your content.') + '</div>';
      var n = s.length, warn = '';
      if (P.hard && n > P.hard) warn = ' · over ' + P.n + '’s limit of ' + P.hard;
      else if (n > (plat === 'instagram' ? 10 : 5)) warn = ' · more than recommended';
      $('hg-n', root).innerHTML = '<span class="badge ' + (P.hard && n > P.hard ? 'danger' : warn ? 'warn' : 'ok') + '">' + n + (P.hard ? ' / ' + P.hard : '') + ' hashtags' + esc(warn) + '</span> <span>' + BT.fmtNum(chars(str), 0) + ' characters</span>';
      $('hg-sel', root).textContent = str || 'Nothing selected yet.';
      $('hg-groups', root).innerHTML = groups.filter(function (g) { return g.tags.length; }).map(function (g) {
        return '<div class="yt-hgroup"><h4>' + esc(g.n) + ' <span class="badge">' + esc(g.d) + '</span></h4><div class="yt-hchips">' + g.tags.map(function (t) {
          return '<button type="button" class="yt-hchip" data-a="tog" data-t="' + esc(t) + '" aria-pressed="' + !!picked[t] + '">' + esc(t) + '</button>';
        }).join('') + '</div></div>';
      }).join('');
    }
    onA(root, {
      gen: generate,
      tog: function (b) { var t = b.getAttribute('data-t'); picked[t] = !picked[t]; render(); var nb = BT.$('[data-t="' + window.CSS.escape(t) + '"]', root); if (nb) nb.focus(); },
      copy: function () { var s = selected(); if (!s.length) return BT.toast('Select some hashtags first', 'error'); BT.copy(s.join(' '), plural(s.length, 'hashtag') + ' copied'); },
      copyall: function () { var all = []; groups.forEach(function (g) { all = all.concat(g.tags); }); BT.copy(all.join(' '), plural(all.length, 'hashtag') + ' copied'); },
      none: function () { picked = {}; render(); }
    });
    $('hg-topic', root).addEventListener('keydown', function (e) { if (e.key === 'Enter') generate(); });
  });

  // ========================================================= 5. Embed code
  var LANGS = [['', 'Default'], ['en', 'English'], ['hi', 'Hindi'], ['bn', 'Bengali'], ['ta', 'Tamil'], ['te', 'Telugu'], ['mr', 'Marathi'], ['gu', 'Gujarati'], ['kn', 'Kannada'], ['ml', 'Malayalam'], ['pa', 'Punjabi'], ['ur', 'Urdu'], ['or', 'Odia'], ['as', 'Assamese']];

  /** Build the iframe src and HTML for the embed options (pure, for tests too). */
  function embedBuild(o) {
    var host = o.privacy ? 'https://www.youtube-nocookie.com' : 'https://www.youtube.com';
    var p = [];
    var src = host + '/embed/' + (o.id || 'videoseries');
    if (o.list) p.push('list=' + o.list);
    if (o.start > 0) p.push('start=' + o.start);
    if (o.end > 0) p.push('end=' + o.end);
    if (o.autoplay) p.push('autoplay=1');
    if (o.autoplay || o.mute) p.push('mute=1');
    if (o.autoplay) p.push('playsinline=1');
    if (o.loop) { p.push('loop=1'); if (o.id && !o.list) p.push('playlist=' + o.id); }
    if (o.nocontrols) p.push('controls=0');
    if (o.cc) p.push('cc_load_policy=1');
    if (o.cclang) p.push('cc_lang_pref=' + o.cclang);
    if (o.hl) p.push('hl=' + o.hl);
    if (o.rel) p.push('rel=0');
    src += p.length ? '?' + p.join('&') : '';
    var attrs = 'src="' + esc(src) + '" title="' + esc(o.title || 'YouTube video player') + '"' +
      ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"' +
      ' referrerpolicy="strict-origin-when-cross-origin" allowfullscreen' + (o.lazy ? ' loading="lazy"' : '');
    var html;
    if (o.size === 'fixed') {
      html = '<iframe width="' + o.w + '" height="' + o.h + '" style="border:0;max-width:100%" ' + attrs + '></iframe>';
    } else {
      var tall = o.size === 'r916';
      html = (tall ? '<div style="max-width:360px;margin:0 auto">\n' : '') +
        '<div style="position:relative;width:100%;padding-top:' + (tall ? '177.78' : '56.25') + '%;overflow:hidden;border-radius:12px">\n' +
        '  <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" ' + attrs + '></iframe>\n</div>' + (tall ? '\n</div>' : '');
    }
    return { src: src, html: html };
  }

  BT.impl('youtube-embed-code-generator', function (root) {
    css();
    var size = 'r169', loaded = false;
    root.innerHTML =
      hero('code-xml', 'Clean, responsive YouTube embed code', 'Nothing loads from YouTube until you press “Load preview”.') +
      '<div class="split"><div><div class="card">' +
        field('ec-url', 'YouTube link or video ID', inp('ec-url', 'text', 'https://www.youtube.com/watch?v=… or youtu.be/… or 11-character ID', '', ' autocomplete="off" spellcheck="false"')) +
        '<div id="ec-parse" class="yt-msgs" style="margin:-4px 0 12px"></div>' +
        '<div class="field"><span class="label">Player size</span>' + seg('ec-size', [['r169', 'Responsive 16:9'], ['r916', 'Responsive 9:16 (Shorts)'], ['fixed', 'Fixed size']], size, 'Player size') + '</div>' +
        '<div class="row cols-2 hidden" id="ec-fixed">' + field('ec-w', 'Width (px)', inp('ec-w', 'number', '560', '560', ' min="200" max="3840"')) + field('ec-h', 'Height (px)', inp('ec-h', 'number', '315', '315', ' min="100" max="2160"')) + '</div>' +
        '<div class="row cols-2">' + field('ec-start', 'Start at', inp('ec-start', 'text', 'e.g. 1:30 or 90', '', ' autocomplete="off"'), 'Leave empty to start at the beginning.') +
          field('ec-end', 'Stop at (optional)', inp('ec-end', 'text', 'e.g. 3:45', '', ' autocomplete="off"')) + '</div>' +
        field('ec-title', 'Title for screen readers', inp('ec-title', 'text', 'Describe the video, e.g. “How to make a pivot table”', '', ' maxlength="120"'), 'Every iframe needs a title so screen-reader users know what it is.') +
        '<div class="field"><span class="label">Options</span><div class="yt-checks" style="flex-direction:column;gap:10px">' +
          chk('ec-priv', 'Privacy-enhanced mode (youtube-nocookie.com)', true) +
          chk('ec-lazy', 'Lazy-load (loading="lazy" — faster pages)', true) +
          chk('ec-auto', 'Autoplay (also mutes the video)', false) +
          chk('ec-mute', 'Start muted', false) +
          chk('ec-loop', 'Loop the video', false) +
          chk('ec-noc', 'Hide player controls', false) +
          chk('ec-cc', 'Show captions by default', false) +
          chk('ec-rel', 'Related videos from the same channel only (rel=0)', false) +
        '</div></div>' +
        '<div class="row cols-2">' + field('ec-cclang', 'Caption language', sel('ec-cclang', LANGS, '')) + field('ec-hl', 'Player language', sel('ec-hl', LANGS, '')) + '</div>' +
      '</div></div>' +
      '<div><div class="card"><div class="card-title"><h3 class="yt-h">Embed code</h3>' + btn('data-a="copy"', 'copy', 'Copy code', 'btn-primary') + '</div>' +
        '<pre class="yt-code" id="ec-code" tabindex="0" aria-label="Embed code"></pre><div class="yt-msgs" id="ec-msg"></div></div>' +
        '<div class="card"><div class="card-title"><h3 class="yt-h">Preview</h3>' + btn('data-a="load"', 'monitor-play', 'Load preview', '') + '</div>' +
        '<div class="yt-frame" id="ec-frame" style="aspect-ratio:16/9"><div class="ph">' + BT.icon('tv-minimal-play') +
          '<span>Press <strong>Load preview</strong> to load the player from YouTube.<br>Until then, nothing is requested from YouTube.</span></div></div>' +
        '<p class="small muted" style="margin:8px 0 0">The preview loads YouTube’s player in your browser, so YouTube’s own privacy policy applies to it. Privacy-enhanced mode means YouTube doesn’t store viewing information until the visitor plays the video.</p></div>' +
        '<div class="yt-msgs">' + notice('', '<strong>About autoplay:</strong> browsers (Chrome, Safari, Firefox) block autoplay with sound, so autoplaying videos must start muted — that’s why ticking Autoplay adds <code>mute=1</code>. Some phones may still not autoplay to save data. <strong>Loop</strong> needs the <code>playlist</code> parameter set to the same video ID, which we add for you.') + '</div>' +
      '</div></div>';

    var sizeEl = $('ec-size', root), last = null;
    wireSeg(sizeEl, function (v) { size = v; $('ec-fixed', root).classList.toggle('hidden', v !== 'fixed'); update(); });
    function opts() {
      var p = parseYT(val(root, 'ec-url'));
      var st = val(root, 'ec-start'), en = val(root, 'ec-end');
      var s = st ? parseTime(st) : (p.start || 0), e = en ? parseTime(en) : 0;
      return {
        parsed: p, id: p.id, list: p.list, start: isFinite(s) ? s : 0, end: isFinite(e) ? e : 0, badStart: st && !isFinite(s), badEnd: en && !isFinite(e),
        privacy: val(root, 'ec-priv'), lazy: val(root, 'ec-lazy'), autoplay: val(root, 'ec-auto'), mute: val(root, 'ec-mute'), loop: val(root, 'ec-loop'),
        nocontrols: val(root, 'ec-noc'), cc: val(root, 'ec-cc'), cclang: val(root, 'ec-cclang'), hl: val(root, 'ec-hl'), rel: val(root, 'ec-rel'),
        title: val(root, 'ec-title'), size: size,
        w: clamp(Math.round(BT.num(val(root, 'ec-w'))) || 560, 200, 3840), h: clamp(Math.round(BT.num(val(root, 'ec-h'))) || 315, 100, 2160)
      };
    }
    function update() {
      var o = opts(), p = o.parsed, code = $('ec-code', root), msgs = [];
      var raw = val(root, 'ec-url');
      $('ec-parse', root).innerHTML = !raw ? '' : p.error ? notice('error', esc(p.error)) :
        notice('ok', (p.id ? 'Video ID <code>' + esc(p.id) + '</code>' : '') + (p.list ? (p.id ? ' · ' : '') + 'Playlist <code>' + esc(p.list) + '</code>' : '') + (p.start ? ' · starts at ' + clock(p.start) : '') + ' · ' + esc(p.kind));
      if (!raw || p.error) { code.textContent = 'Paste a YouTube link or video ID to get the embed code.'; last = null; $('ec-msg', root).innerHTML = ''; return; }
      var b = embedBuild(o);
      last = b;
      code.textContent = b.html;
      if (o.badStart) msgs.push(notice('error', 'Couldn’t read the start time. Use 1:30, 90 or 1m30s.'));
      if (o.badEnd) msgs.push(notice('error', 'Couldn’t read the stop time. Use 3:45, 225 or 3m45s.'));
      if (o.end && o.end <= o.start) msgs.push(notice('warn', 'The stop time must be after the start time.'));
      if (!o.title) msgs.push(notice('warn', 'Add a descriptive title — it helps screen-reader users (we used “YouTube video player”).'));
      if (o.nocontrols && !o.autoplay) msgs.push(notice('warn', 'With controls hidden, visitors can still start the video by clicking it, but can’t pause easily. Use with care.'));
      $('ec-msg', root).innerHTML = msgs.join('');
      if (loaded) loadPreview();
    }
    function loadPreview() {
      if (!last) return BT.toast('Paste a valid YouTube link first', 'error');
      var o = opts(), fr = $('ec-frame', root);
      fr.style.aspectRatio = size === 'r916' ? '9/16' : size === 'fixed' ? o.w + '/' + o.h : '16/9';
      fr.style.maxWidth = size === 'r916' ? '320px' : '';
      fr.style.margin = size === 'r916' ? '0 auto' : '';
      var cur = BT.$('iframe', fr);
      if (cur && cur.getAttribute('src') === last.src) return;
      fr.innerHTML = '';
      var f = h('iframe', { title: o.title || 'YouTube video player', allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share', referrerpolicy: 'strict-origin-when-cross-origin', allowfullscreen: true });
      // src only ever contains validated IDs and fixed parameter names
      f.src = last.src;
      fr.appendChild(f);
      loaded = true;
    }
    var upd = BT.debounce(update, 150);
    root.addEventListener('input', upd);
    root.addEventListener('change', function (e) {
      if (e.target.id === 'ec-auto' && e.target.checked) { $('ec-mute', root).checked = true; BT.toast('Autoplay needs the video to start muted'); }
      if (e.target.tagName === 'SELECT' || e.target.type === 'checkbox') update();
    });
    onA(root, {
      copy: function () { if (!last) return BT.toast('Paste a YouTube link first', 'error'); BT.copy($('ec-code', root).textContent, 'Embed code copied'); },
      load: loadPreview
    });
    update();
  });

  // ===================================================== 6. Timestamp links
  BT.impl('youtube-timestamp-link', function (root) {
    css();
    root.innerHTML =
      hero('link', 'Links that start at the right moment', 'Works with any YouTube link — nothing is sent anywhere.') +
      '<div class="card"><div class="row cols-2">' +
        field('ts-url', 'YouTube link or video ID', inp('ts-url', 'text', 'https://youtu.be/… or https://www.youtube.com/watch?v=…', '', ' autocomplete="off" spellcheck="false"')) +
        field('ts-time', 'Start time', inp('ts-time', 'text', 'e.g. 1:30, 90, 1m30s or 1:02:03', '', ' autocomplete="off"'), 'Hours, minutes and seconds all work.') +
      '</div><div id="ts-parse" class="yt-msgs" style="margin:-4px 0 12px"></div>' +
      '<div class="yt-checks">' + chk('ts-list', 'Keep the playlist in the link (if any)', false) + '</div>' +
      '<div id="ts-out"></div></div>' +
      '<div class="card"><h3 class="yt-h" style="margin-bottom:12px">Many timestamps at once</h3>' +
        field('ts-multi', 'One per line: time, then an optional label', txa('ts-multi', '0:00 Intro\n1:30 The main tip\n4:05 Results', '', 5, ' class="mono"'), 'Uses the video link above.') +
        '<div class="yt-toolbar">' + btn('data-a="copyall"', 'copy', 'Copy all as text', 'btn-primary') + btn('data-a="csv"', 'sheet', 'CSV') + '</div>' +
        '<div id="ts-table"></div>' +
      '</div>' +
      '<div class="yt-msgs">' + notice('', 'YouTube accepts <code>t=90</code> on youtu.be links and <code>t=90s</code> (or <code>t=1m30s</code>) on watch links. Some apps and embedded players may ignore the start time.') + '</div>';
    var rows = [];
    function update() {
      var p = parseYT(val(root, 'ts-url')), raw = val(root, 'ts-url'), keep = val(root, 'ts-list');
      $('ts-parse', root).innerHTML = !raw ? '' : p.error ? notice('error', esc(p.error)) : !p.id ? notice('error', 'This is a playlist link without a video. Open a video in the playlist and copy its link.') :
        notice('ok', 'Video ID <code>' + esc(p.id) + '</code>' + (p.start ? ' · link already had t=' + p.start : ''));
      var out = $('ts-out', root), tRaw = val(root, 'ts-time'), t = tRaw ? parseTime(tRaw) : (p.start || 0);
      if (!p.id) { out.innerHTML = ''; rows = []; $('ts-table', root).innerHTML = ''; return; }
      if (tRaw && !isFinite(t)) out.innerHTML = notice('error', 'Couldn’t read that time. Try 1:30, 90 or 1m30s.');
      else {
        var list = keep ? p.list : '';
        var u = ytUrls(p.id, t, list);
        out.innerHTML = '<div class="yt-sec">Starts at ' + clock(t) + ' (' + t + ' seconds)</div>' + linkRow('Short', u.short) + linkRow('Watch', u.watch) +
          linkRow('Watch (h/m/s)', 'https://www.youtube.com/watch?v=' + p.id + (list ? '&list=' + list : '') + (t ? '&t=' + hms(t) : ''));
      }
      // many
      rows = [];
      var bad = [];
      val(root, 'ts-multi').split(/\r?\n/).forEach(function (l, i) {
        l = l.trim();
        if (!l) return;
        var m = l.match(/^(\S+)\s*(?:[-–—|:]\s*)?(.*)$/), sec = m ? parseTime(m[1]) : NaN;
        if (!isFinite(sec)) { bad.push(i + 1); return; }
        var uu = ytUrls(p.id, sec, keep ? p.list : '');
        rows.push({ t: sec, label: m[2] || '', short: uu.short, watch: uu.watch });
      });
      $('ts-table', root).innerHTML = (rows.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Time</th><th>Label</th><th>Link</th><th><span class="sr-only">Copy</span></th></tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><td>' + clock(r.t) + '</td><td class="yt-tcell">' + esc(r.label) + '</td><td class="yt-tcell"><code>' + esc(r.short) + '</code></td><td>' + iconBtn('data-copy="' + esc(r.short) + '"', 'copy', 'Copy link at ' + clock(r.t)) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '') +
        (bad.length ? '<div class="yt-msgs">' + notice('warn', 'Couldn’t read line ' + bad.slice(0, 6).join(', ') + '. Start each line with a time like 1:30.') + '</div>' : '');
    }
    wireCopy(root);
    root.addEventListener('input', BT.debounce(update, 120));
    root.addEventListener('change', function (e) { if (e.target.type === 'checkbox') update(); });
    onA(root, {
      copyall: function () {
        if (!rows.length) return BT.toast('Add a video link and some timestamps first', 'error');
        BT.copy(rows.map(function (r) { return clock(r.t) + (r.label ? ' ' + r.label : '') + ' – ' + r.short; }).join('\n'), plural(rows.length, 'link') + ' copied');
      },
      csv: function () {
        if (!rows.length) return BT.toast('Nothing to export yet', 'error');
        BT.download(toCSV([['Time', 'Seconds', 'Label', 'Short link', 'Watch link']].concat(rows.map(function (r) { return [clock(r.t), r.t, r.label, r.short, r.watch]; }))), 'youtube-timestamp-links.csv', 'text/csv;charset=utf-8');
      }
    });
    update();
  });

  // ========================================================== 7. URL parser
  BT.impl('youtube-url-parser', function (root) {
    css();
    var results = [];
    root.innerHTML =
      hero('scan-line', 'Video IDs, clean links and thumbnail URLs', 'Paste one link or hundreds. Parsing happens on your device; thumbnails load only if you ask.') +
      '<div class="card">' +
        field('up-in', 'YouTube links (one per line)', txa('up-in', 'https://www.youtube.com/watch?v=…\nhttps://youtu.be/…\nhttps://www.youtube.com/shorts/…', '', 6, ' class="mono" spellcheck="false"'),
          'Supports watch, youtu.be, Shorts, embed, live, mobile (m.), YouTube Music and playlist links, with any extra parameters.') +
        '<div class="yt-checks">' + chk('up-dedupe', 'Remove duplicate videos', true) + '</div>' +
        '<div class="btn-group">' + btn('data-a="parse"', 'scan-line', 'Extract', 'btn-primary') + btn('data-a="sample"', 'list', 'Try examples', 'btn-ghost') + '</div>' +
      '</div>' +
      '<div class="card hidden" id="up-out"><div class="card-title"><h3 class="yt-h">Results</h3><span id="up-sum"></span></div>' +
        '<div class="yt-toolbar">' + btn('data-a="csv"', 'sheet', 'Export CSV', 'btn-primary') + btn('data-a="ids"', 'copy', 'Copy IDs') + btn('data-a="thumbsall"', 'image', 'Show thumbnails (first 10)') + '</div>' +
        '<div id="up-table"></div>' +
        '<div id="up-cards" class="yt-gap"></div>' +
        '<div class="yt-msgs">' + notice('', 'Thumbnail URLs follow YouTube’s standard pattern at <code>i.ytimg.com</code>. <strong>maxresdefault</strong> (1280 × 720) and sometimes <strong>sddefault</strong> exist only for videos uploaded in high resolution. Pressing “Show thumbnails” loads the images from YouTube’s servers.') + '</div>' +
      '</div>';
    function parseAll() {
      var lines = val(root, 'up-in').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (!lines.length) { BT.toast('Paste at least one link', 'error'); return; }
      if (lines.length > 2000) { BT.toast('Only the first 2,000 lines are processed'); lines = lines.slice(0, 2000); }
      var seen = {}, dd = val(root, 'up-dedupe');
      results = lines.map(function (l, i) {
        var r = parseYT(l);
        r.n = i + 1;
        var k = r.id || r.list;
        if (!r.error && dd && k) { if (seen[k]) r.dup = true; seen[k] = 1; }
        return r;
      }).filter(function (r) { return !r.dup; });
      render();
      $('up-out', root).classList.remove('hidden');
    }
    function render() {
      var ok = results.filter(function (r) { return !r.error; }).length, bad = results.length - ok;
      $('up-sum', root).innerHTML = '<span class="badge ok">' + ok + ' valid</span> ' + (bad ? '<span class="badge danger">' + bad + ' invalid</span>' : '');
      $('up-table', root).innerHTML = '<div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Status</th><th>Video ID</th><th>Playlist</th><th class="num">Start</th><th>Type</th></tr></thead><tbody>' +
        results.map(function (r) {
          return '<tr><td>' + r.n + '</td><td>' + (r.error ? '<span class="badge danger">Invalid</span>' : '<span class="badge ok">OK</span>') + '</td>' +
            '<td><code data-id>' + esc(r.id || '—') + '</code></td><td class="yt-tcell"><code>' + esc(r.list || '—') + '</code></td>' +
            '<td class="num">' + (r.start != null ? r.start + ' s' : '—') + '</td><td class="yt-tcell">' + esc(r.error || r.kind) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      var shown = results.slice(0, 100);
      $('up-cards', root).innerHTML = shown.map(function (r, i) {
        if (r.error) return '<div class="yt-res bad"><div class="hd"><strong>Line ' + r.n + '</strong><span class="badge danger">Invalid</span></div><div class="in">' + esc(r.input.slice(0, 300)) + '</div><div class="small">' + esc(r.error) + '</div></div>';
        var body = '';
        if (r.id) {
          var u = ytUrls(r.id, 0, '');
          body += linkRow('Canonical', 'https://www.youtube.com/watch?v=' + r.id) + linkRow('Short', u.short) + linkRow('Embed', u.embed) + linkRow('No-cookie', u.nocookie) + linkRow('Shorts', u.shorts);
          if (r.start) body += linkRow('With start', ytUrls(r.id, r.start, '').short);
          if (r.list) body += linkRow('In playlist', 'https://www.youtube.com/watch?v=' + r.id + '&list=' + r.list);
          body += '<details><summary class="small" style="cursor:pointer;font-weight:600;margin:4px 0 8px">Thumbnail image URLs</summary>' + THUMBS.map(function (t) { return linkRow(t[0], thumbUrl(r.id, t[0])); }).join('') + '</details>' +
            '<div class="btn-group">' + btn('data-a="thumbs" data-i="' + i + '"', 'image', 'Show thumbnails') + '</div><div class="yt-thumbs" id="up-th-' + i + '"></div>';
        } else if (r.list) {
          body += linkRow('Playlist', 'https://www.youtube.com/playlist?list=' + r.list) + linkRow('Embed', 'https://www.youtube-nocookie.com/embed/videoseries?list=' + r.list);
        }
        return '<div class="yt-res good"><div class="hd"><strong>Line ' + r.n + (r.id ? ' · <code>' + esc(r.id) + '</code>' : '') + '</strong><span class="badge">' + esc(r.kind) + '</span></div><div class="in">' + esc(r.input.slice(0, 300)) + '</div>' + body + '</div>';
      }).join('') + (results.length > 100 ? '<p class="muted small">Showing details for the first 100 lines. The CSV includes all of them.</p>' : '');
    }
    function showThumbs(i) {
      var r = results[i], box = $('up-th-' + i, root);
      if (!r || !r.id || !box || box.children.length) return;
      box.innerHTML = THUMBS.map(function (t) {
        return '<figure><img alt="' + esc(t[0]) + ' thumbnail of ' + esc(r.id) + '" loading="lazy" decoding="async" data-n="' + t[0] + '"><figcaption><b>' + t[0] + '</b><span>' + t[1] + '</span></figcaption></figure>';
      }).join('');
      BT.$$('img', box).forEach(function (img) {
        img.onload = function () {
          // YouTube serves a 120 × 90 grey placeholder when a size doesn't exist
          if (img.naturalWidth <= 120 && img.getAttribute('data-n') !== 'default') { img.parentNode.classList.add('na'); img.nextElementSibling.lastElementChild.textContent = 'not available'; }
        };
        img.onerror = function () { img.parentNode.classList.add('na'); img.nextElementSibling.lastElementChild.textContent = 'not available'; };
        img.src = thumbUrl(r.id, img.getAttribute('data-n'));
      });
    }
    wireCopy(root);
    onA(root, {
      parse: parseAll,
      sample: function () {
        $('up-in', root).value = [
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s',
          'https://youtu.be/dQw4w9WgXcQ?si=abc123&t=42',
          'https://www.youtube.com/shorts/aqz-KE-bpKQ',
          'https://m.youtube.com/watch?v=aqz-KE-bpKQ&list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI&index=2',
          'https://www.youtube.com/embed/jNQXAC9IVRw?start=10',
          'https://music.youtube.com/watch?v=jNQXAC9IVRw',
          'https://www.youtube.com/playlist?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI',
          'https://www.youtube.com/@SomeChannel',
          'not a link'
        ].join('\n');
        parseAll();
      },
      thumbs: function (b) { showThumbs(+b.getAttribute('data-i')); },
      thumbsall: function () { var n = 0; results.slice(0, 100).forEach(function (r, i) { if (r.id && n < 10) { showThumbs(i); n++; } }); if (!n) BT.toast('No videos to show', 'error'); },
      ids: function () { var ids = results.filter(function (r) { return r.id; }).map(function (r) { return r.id; }); if (!ids.length) return BT.toast('No video IDs found', 'error'); BT.copy(ids.join('\n'), plural(ids.length, 'ID') + ' copied'); },
      csv: function () {
        var rows = [['Line', 'Input', 'Valid', 'Video ID', 'Playlist ID', 'Start (s)', 'Type / error', 'Watch URL', 'Short URL', 'Embed URL', 'Shorts URL', 'Thumbnail (hq)', 'Thumbnail (maxres)']];
        results.forEach(function (r) {
          var u = r.id ? ytUrls(r.id, 0, '') : {};
          rows.push([r.n, r.input, r.error ? 'no' : 'yes', r.id, r.list, r.start == null ? '' : r.start, r.error || r.kind,
            r.id ? 'https://www.youtube.com/watch?v=' + r.id : '', u.short || '', u.embed || '', u.shorts || '',
            r.id ? thumbUrl(r.id, 'hqdefault') : '', r.id ? thumbUrl(r.id, 'maxresdefault') : '']);
        });
        BT.download(toCSV(rows), 'youtube-links.csv', 'text/csv;charset=utf-8');
      }
    });
  });

  // ======================================================= 8. Banner maker
  function mkCanvas(w, hh) { var c = doc.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(hh)); return c; }
  var BFONTS = [
    ['sans', 'Sans (Inter)', "Inter, 'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Bengali', 'Nirmala UI', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"],
    ['serif', 'Serif', "Georgia, 'Noto Serif', 'Noto Serif Devanagari', 'Noto Serif Bengali', 'Nirmala UI', 'Times New Roman', serif"],
    ['impact', 'Impact (bold condensed)', "Impact, Haettenschweiler, 'Arial Narrow Bold', 'Nirmala UI', sans-serif"],
    ['rounded', 'Rounded', "ui-rounded, 'SF Pro Rounded', 'Arial Rounded MT Bold', 'Nirmala UI', system-ui, sans-serif"],
    ['mono', 'Typewriter', "'Courier New', Courier, ui-monospace, monospace"],
    ['hindi', 'Hindi (Devanagari)', "'Noto Sans Devanagari', 'Nirmala UI', Mangal, 'Kohinoor Devanagari', 'Devanagari Sangam MN', sans-serif"],
    ['bengali', 'Bengali (Bangla)', "'Noto Sans Bengali', 'Nirmala UI', Vrinda, 'Shonar Bangla', 'Bangla Sangam MN', 'Kohinoor Bangla', sans-serif"]
  ];
  function bfont(L) {
    var f = BFONTS.filter(function (x) { return x[0] === L.font; })[0] || BFONTS[0];
    return (L.italic ? 'italic ' : '') + (L.weight || 700) + ' ' + Math.max(1, L.size) + 'px ' + f[2];
  }
  // Presets. safe = where text/logos are always visible; guides drawn on screen only.
  var BPRESETS = [
    { id: 'yt', file: 'youtube-channel-banner', name: 'YouTube channel banner', w: 2560, h: 1440, max: 6 * 1024 * 1024, fmt: 'image/jpeg',
      safe: { x: 507, y: 508.5, w: 1546, h: 423 },
      guides: [
        { l: 'TV (full image) 2560 × 1440', x: 0, y: 0, w: 2560, h: 1440, c: '#60a5fa' },
        { l: 'Desktop 2560 × 423', x: 0, y: 508.5, w: 2560, h: 423, c: '#a78bfa' },
        { l: 'Tablet 1855 × 423', x: 352.5, y: 508.5, w: 1855, h: 423, c: '#f59e0b' },
        { l: 'Safe area for text & logos (all devices) 1546 × 423', x: 507, y: 508.5, w: 1546, h: 423, c: '#22c55e', bold: true }
      ],
      devices: [['TV', 0, 0, 2560, 1440], ['Desktop', 0, 508.5, 2560, 423], ['Tablet', 352.5, 508.5, 1855, 423], ['Mobile', 507, 508.5, 1546, 423]],
      note: 'YouTube shows the full 2560 × 1440 image only on TVs. Desktop, tablet and phone show a centred strip, so keep text and logos inside the green safe area. Upload limit: 6 MB.' },
    { id: 'fb', file: 'facebook-cover', name: 'Facebook cover (export 1640 × 624)', w: 1640, h: 624, fmt: 'image/jpeg',
      safe: { x: 265.3, y: 8.5, w: 1109.4, h: 607 },
      guides: [
        { l: 'Desktop view (~851 × 315 shape)', x: 0, y: 8.5, w: 1640, h: 607, c: '#a78bfa' },
        { l: 'Mobile view (~640 × 360 shape)', x: 265.3, y: 0, w: 1109.4, h: 624, c: '#f59e0b' },
        { l: 'Safe on both', x: 265.3, y: 8.5, w: 1109.4, h: 607, c: '#22c55e', bold: true }
      ],
      devices: [['Desktop', 0, 8.5, 1640, 607], ['Mobile', 265.3, 0, 1109.4, 624]],
      note: 'Facebook displays covers at about 851 × 315 on computers and crops the sides on phones. We export at 1640 × 624 so it stays sharp on high-resolution screens. Facebook changes its layout from time to time — check after uploading.' },
    { id: 'lip', file: 'linkedin-banner', name: 'LinkedIn personal banner 1584 × 396', w: 1584, h: 396, fmt: 'image/jpeg',
      safe: { x: 420, y: 30, w: 1124, h: 336 },
      circle: { l: 'Profile photo (approx.)', cx: 200, cy: 380, r: 175 },
      guides: [{ l: 'Keep text clear of the photo area', x: 420, y: 30, w: 1124, h: 336, c: '#22c55e', bold: true }],
      devices: [['Desktop', 0, 0, 1584, 396], ['Mobile (approx.)', 100, 0, 1384, 396]],
      note: 'Your profile photo covers the lower-left corner, and phones may crop the edges slightly. Keep important content on the right two-thirds.' },
    { id: 'lic', file: 'linkedin-company-cover', name: 'LinkedIn company cover 1128 × 191', w: 1128, h: 191, fmt: 'image/jpeg',
      safe: { x: 230, y: 16, w: 870, h: 159 },
      circle: { l: 'Logo (approx.)', cx: 110, cy: 185, r: 85, sq: true },
      guides: [{ l: 'Clear of the logo', x: 230, y: 16, w: 870, h: 159, c: '#22c55e', bold: true }],
      devices: [['Desktop', 0, 0, 1128, 191]],
      note: 'The company logo overlaps the lower-left corner. LinkedIn may crop slightly on phones.' },
    { id: 'x', file: 'x-header', name: 'X / Twitter header 1500 × 500', w: 1500, h: 500, fmt: 'image/jpeg',
      safe: { x: 420, y: 60, w: 1020, h: 380 },
      circle: { l: 'Profile photo (approx.)', cx: 207, cy: 500, r: 168 },
      guides: [{ l: 'Safe area (approx.)', x: 420, y: 60, w: 1020, h: 380, c: '#22c55e', bold: true }],
      devices: [['Desktop', 0, 0, 1500, 500], ['Mobile (approx.)', 0, 40, 1500, 420]],
      note: 'The profile photo overlaps the bottom-left, and some screens crop the top and bottom a little.' }
  ];
  function bpreset(id) { return BPRESETS.filter(function (p) { return p.id === id; })[0] || BPRESETS[0]; }
  var BGRADS = [['#4f46e5', '#db2777'], ['#0f172a', '#1e3a8a'], ['#f97316', '#dc2626'], ['#065f46', '#0e7490'], ['#7c2d12', '#b91c1c'], ['#111827', '#374151'], ['#fde68a', '#f472b6'], ['#0ea5e9', '#22c55e']];
  // Templates: positions relative to the preset's safe area (rx/ry 0..1), sizes relative to its height.
  var BTPL = [
    { id: 'creator', name: 'Creator', bg: { type: 'linear', c1: '#4f46e5', c2: '#db2777', angle: 120 }, layers: [
      { type: 'icon', name: 'tv-minimal-play', rx: 0.1, ry: 0.5, s: 0.42, color: '#ffffff', bg: 'circle', bgColor: 'rgba(255,255,255,0.18)' },
      { type: 'text', text: 'Your Channel Name', rx: 0.58, ry: 0.4, s: 0.24, rw: 0.78, weight: 800, color: '#ffffff', shadow: true },
      { type: 'text', text: 'New videos every Friday', rx: 0.58, ry: 0.72, s: 0.1, rw: 0.78, weight: 600, color: '#fde68a' }] },
    { id: 'tech', name: 'Tech', bg: { type: 'linear', c1: '#0b1020', c2: '#1e3a8a', angle: 160 }, layers: [
      { type: 'shape', shape: 'rect', rx: 0.5, ry: 0.86, rw: 0.18, rh: 0.03, fill: '#38bdf8', radius: 6 },
      { type: 'text', text: 'TECH WITH YOU', rx: 0.5, ry: 0.36, s: 0.26, rw: 0.95, weight: 800, color: '#ffffff', font: 'impact' },
      { type: 'text', text: 'Reviews · Tutorials · Honest tips', rx: 0.5, ry: 0.66, s: 0.1, rw: 0.95, weight: 500, color: '#bae6fd' }] },
    { id: 'food', name: 'Food & travel', bg: { type: 'linear', c1: '#f97316', c2: '#dc2626', angle: 135 }, layers: [
      { type: 'icon', name: 'flame', rx: 0.12, ry: 0.5, s: 0.4, color: '#ffffff', bg: 'none' },
      { type: 'text', text: 'Kolkata Food Diaries', rx: 0.58, ry: 0.4, s: 0.22, rw: 0.78, weight: 800, color: '#ffffff', font: 'serif', shadow: true },
      { type: 'text', text: 'STREET FOOD · RECIPES · TRAVEL', rx: 0.58, ry: 0.72, s: 0.085, rw: 0.78, weight: 700, color: '#ffffff', pill: true, pillColor: 'rgba(0,0,0,0.28)' }] },
    { id: 'biz', name: 'Business', bg: { type: 'solid', c1: '#f8fafc', c2: '#e2e8f0', angle: 90 }, layers: [
      { type: 'shape', shape: 'rect', rx: 0.02, ry: 0.5, rw: 0.012, rh: 0.7, fill: '#4f46e5', radius: 4 },
      { type: 'icon', name: 'briefcase-business', rx: 0.11, ry: 0.5, s: 0.34, color: '#ffffff', bg: 'rounded', bgColor: '#4f46e5' },
      { type: 'text', text: 'Your Business Name', rx: 0.57, ry: 0.38, s: 0.2, rw: 0.76, weight: 800, color: '#0f172a', align: 'left' },
      { type: 'text', text: 'Trusted service in Kolkata since 2010', rx: 0.57, ry: 0.66, s: 0.09, rw: 0.76, weight: 500, color: '#475569', align: 'left' }] },
    { id: 'hindi', name: 'Hindi', bg: { type: 'linear', c1: '#065f46', c2: '#0e7490', angle: 135 }, layers: [
      { type: 'icon', name: 'book-open-text', rx: 0.1, ry: 0.5, s: 0.36, color: '#ffffff', bg: 'circle', bgColor: 'rgba(255,255,255,0.16)' },
      { type: 'text', text: 'आसान पढ़ाई', rx: 0.58, ry: 0.4, s: 0.25, rw: 0.78, weight: 800, color: '#ffffff', font: 'hindi', shadow: true },
      { type: 'text', text: 'हर हफ़्ते नई वीडियो', rx: 0.58, ry: 0.73, s: 0.11, rw: 0.78, weight: 600, color: '#a7f3d0', font: 'hindi' }] },
    { id: 'bengali', name: 'Bengali', bg: { type: 'linear', c1: '#7c2d12', c2: '#be123c', angle: 120 }, layers: [
      { type: 'icon', name: 'sparkles', rx: 0.1, ry: 0.5, s: 0.36, color: '#fde68a', bg: 'none' },
      { type: 'text', text: 'আমার চ্যানেল', rx: 0.58, ry: 0.4, s: 0.25, rw: 0.78, weight: 800, color: '#ffffff', font: 'bengali', shadow: true },
      { type: 'text', text: 'প্রতি সপ্তাহে নতুন ভিডিও', rx: 0.58, ry: 0.73, s: 0.11, rw: 0.78, weight: 600, color: '#fde68a', font: 'bengali' }] }
  ];
  var BICONS = ['tv-minimal-play', 'clapperboard', 'camera', 'mic', 'music', 'gamepad', 'heart', 'star', 'sparkles', 'flame', 'zap', 'globe', 'map-pin', 'book-open-text', 'briefcase-business', 'palette', 'brush', 'code', 'smartphone', 'monitor-play', 'film', 'image', 'gift', 'cake', 'laugh', 'trending-up', 'chart-line', 'indian-rupee', 'shield-check', 'badge-check', 'users', 'messages-square', 'megaphone', 'house', 'landmark', 'calendar-days', 'clock', 'scissors', 'pen-tool', 'wand-sparkles', 'instagram', 'facebook', 'linkedin', 'rss', 'mail', 'link', 'qr-code', 'sun', 'moon', 'activity'];

  BT.impl('channel-banner-maker', function (root, ctx) {
    css();
    var ICONS = window.BT_ICONS || {};
    var D = { preset: 'yt', bg: { type: 'linear', c1: '#4f46e5', c2: '#db2777', angle: 120, img: null, blur: 0, dim: 25 }, layers: [], guides: true, fmt: 'image/jpeg', tpl: 'creator' };
    var sel = -1, view = null, drag = null, P = {};
    function PR() { return bpreset(D.preset); }
    function W() { return PR().w; }
    function H() { return PR().h; }

    // ---------------------------------------------------------- icons
    var iconCache = {};
    function iconImg(name, color) {
      var key = name + '|' + color;
      if (iconCache[key]) return iconCache[key].img;
      var img = new Image(), rec = { img: null };
      iconCache[key] = rec;
      img.onload = function () { rec.img = img; render(); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 24 24" fill="none" stroke="' +
        String(color).replace(/[^#a-zA-Z0-9(),.\s]/g, '') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || ICONS.sparkles || '') + '</svg>');
      return null;
    }

    // ---------------------------------------------------------- layers
    var mctx = mkCanvas(4, 4).getContext('2d');
    function wrap(L) {
      mctx.font = bfont(L);
      var maxW = Math.max(L.size, L.w), out = [];
      String(L.text || '').split('\n').forEach(function (para) {
        var words = para.split(/\s+/), line = '';
        words.forEach(function (w) {
          var t = line ? line + ' ' + w : w;
          if (line && mctx.measureText(t).width > maxW) { out.push(line); line = w; } else line = t;
        });
        out.push(line);
      });
      return out;
    }
    function box(L) {
      if (L.type === 'text') {
        var lines = wrap(L), mw = 0;
        lines.forEach(function (l) { mw = Math.max(mw, mctx.measureText(l).width); });
        var padX = L.pill ? L.size * 0.6 : 0, padY = L.pill ? L.size * 0.35 : 0;
        var bw = Math.max(mw, 10) + padX * 2, bh = lines.length * L.size * 1.18 + padY * 2;
        var x = L.align === 'left' && !L.pill ? L.x - L.w / 2 : L.align === 'right' && !L.pill ? L.x + L.w / 2 - bw : L.x - bw / 2;
        return { x: x, y: L.y - bh / 2, w: bw, h: bh, lines: lines };
      }
      if (L.type === 'icon') { var s = L.size * (L.bg !== 'none' ? 1.7 : 1); return { x: L.x - s / 2, y: L.y - s / 2, w: s, h: s }; }
      return { x: L.x - L.w / 2, y: L.y - L.h / 2, w: L.w, h: L.h };
    }
    function rr(c, x, y, w, hh, r) {
      r = Math.max(0, Math.min(r || 0, w / 2, hh / 2));
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + hh, r); c.arcTo(x + w, y + hh, x, y + hh, r);
      c.arcTo(x, y + hh, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    function cover(c, img, x, y, w, hh) {
      var iw = img.width, ih = img.height, s = Math.max(w / iw, hh / ih), dw = iw * s, dh = ih * s;
      c.drawImage(img, x + (w - dw) / 2, y + (hh - dh) / 2, dw, dh);
    }
    var blurCache = { key: '', canvas: null };
    function bgImage() {
      var b = D.bg, img = b.img;
      if (!b.blur) return img;
      var key = b.blur + '|' + img.width;
      if (blurCache.key === key) return blurCache.canvas;
      // cheap, consistent blur: downscale twice then let drawImage upscale smoothly
      var f = 1 / (1 + b.blur / 4), t = mkCanvas(img.width * f, img.height * f), tt = mkCanvas(Math.max(8, t.width * f), Math.max(8, t.height * f));
      var x = t.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, t.width, t.height);
      tt.getContext('2d').drawImage(t, 0, 0, tt.width, tt.height);
      blurCache = { key: key, canvas: tt };
      return tt;
    }
    function paintBg(c) {
      var b = D.bg, w = W(), hh = H();
      if (b.type === 'image' && b.img) {
        c.fillStyle = '#000'; c.fillRect(0, 0, w, hh);
        c.imageSmoothingQuality = 'high';
        cover(c, bgImage(), 0, 0, w, hh);
        if (b.dim > 0) { c.fillStyle = 'rgba(0,0,0,' + b.dim / 100 + ')'; c.fillRect(0, 0, w, hh); }
        return;
      }
      if (b.type === 'linear' || b.type === 'radial') {
        var g;
        if (b.type === 'radial') g = c.createRadialGradient(w / 2, hh / 2, 0, w / 2, hh / 2, Math.hypot(w, hh) / 2);
        else {
          var a = (b.angle || 0) * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), len = Math.abs(w * dx) + Math.abs(hh * dy);
          g = c.createLinearGradient(w / 2 - dx * len / 2, hh / 2 - dy * len / 2, w / 2 + dx * len / 2, hh / 2 + dy * len / 2);
        }
        g.addColorStop(0, b.c1); g.addColorStop(1, b.c2);
        c.fillStyle = g;
      } else c.fillStyle = b.c1;
      c.fillRect(0, 0, w, hh);
    }
    function drawLayer(c, L) {
      c.save();
      if (L.type === 'text') {
        var b = box(L);
        c.font = bfont(L);
        if (L.pill) { c.fillStyle = L.pillColor || 'rgba(0,0,0,.3)'; rr(c, b.x, b.y, b.w, b.h, b.h / 2); c.fill(); }
        if (L.shadow) { c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = L.size * 0.18; c.shadowOffsetY = L.size * 0.06; }
        c.fillStyle = L.color; c.textBaseline = 'middle';
        var x;
        if (L.pill || !L.align || L.align === 'center') { c.textAlign = 'center'; x = L.x; }
        else if (L.align === 'left') { c.textAlign = 'left'; x = L.x - L.w / 2; }
        else { c.textAlign = 'right'; x = L.x + L.w / 2; }
        var lh = L.size * 1.18, y0 = L.y - (b.lines.length - 1) * lh / 2;
        b.lines.forEach(function (l, i) { c.fillText(l, x, y0 + i * lh + L.size * 0.04); });
      } else if (L.type === 'icon') {
        if (L.bg !== 'none') {
          var bs = L.size * 1.7;
          c.fillStyle = L.bgColor;
          if (L.bg === 'circle') { c.beginPath(); c.arc(L.x, L.y, bs / 2, 0, Math.PI * 2); c.fill(); }
          else { rr(c, L.x - bs / 2, L.y - bs / 2, bs, bs, bs * 0.24); c.fill(); }
        }
        var img = iconImg(L.name, L.color);
        if (img) c.drawImage(img, L.x - L.size / 2, L.y - L.size / 2, L.size, L.size);
      } else if (L.type === 'shape') {
        c.globalAlpha = L.opacity == null ? 1 : L.opacity;
        c.fillStyle = L.fill;
        if (L.shape === 'circle') { c.beginPath(); c.ellipse(L.x, L.y, L.w / 2, L.h / 2, 0, 0, Math.PI * 2); c.fill(); }
        else { rr(c, L.x - L.w / 2, L.y - L.h / 2, L.w, L.h, L.radius || 0); c.fill(); }
      } else if (L.type === 'image' && L.img) {
        c.globalAlpha = L.opacity == null ? 1 : L.opacity;
        if (L.radius) { rr(c, L.x - L.w / 2, L.y - L.h / 2, L.w, L.h, L.radius); c.clip(); }
        c.drawImage(L.img, L.x - L.w / 2, L.y - L.h / 2, L.w, L.h);
      }
      c.restore();
    }
    /** Paint the design. ui=true adds guides and selection (screen only, never exported). */
    function paint(c, k, ui) {
      c.save();
      c.scale(k, k);
      paintBg(c);
      D.layers.forEach(function (L) { drawLayer(c, L); });
      if (ui && D.guides) drawGuides(c, k);
      if (ui && sel >= 0 && D.layers[sel]) {
        var b = box(D.layers[sel]);
        c.strokeStyle = '#6366f1'; c.lineWidth = 2 / k; c.setLineDash([8 / k, 5 / k]);
        c.strokeRect(b.x, b.y, b.w, b.h); c.setLineDash([]);
        corners(b).forEach(function (p) {
          c.fillStyle = '#fff'; c.strokeStyle = '#6366f1'; c.lineWidth = 2.5 / k;
          c.fillRect(p.x - 7 / k, p.y - 7 / k, 14 / k, 14 / k); c.strokeRect(p.x - 7 / k, p.y - 7 / k, 14 / k, 14 / k);
        });
      }
      c.restore();
    }
    function drawGuides(c, k) {
      var p = PR(), w = p.w, hh = p.h, s = p.safe;
      // dim everything outside the safe area
      c.save();
      c.fillStyle = 'rgba(0,0,0,.28)';
      c.beginPath(); c.rect(0, 0, w, hh); c.rect(s.x, s.y, s.w, s.h); c.fill('evenodd');
      c.restore();
      // labels are sized in CSS pixels and only drawn when the canvas is big
      // enough to keep them apart; the legend under the canvas always names them
      var u = 1 / (view && view.cssK ? view.cssK : k), labels = w / u >= 760;
      c.font = '600 ' + 13 * u + 'px system-ui, sans-serif';
      c.textBaseline = 'top';
      p.guides.forEach(function (g, i) {
        c.strokeStyle = g.c; c.lineWidth = (g.bold ? 3 : 2) / k;
        c.setLineDash(g.bold ? [] : [10 / k, 7 / k]);
        c.strokeRect(g.x + 1 / k, g.y + 1 / k, g.w - 2 / k, g.h - 2 / k);
        c.setLineDash([]);
        // label placement: safe area top-left, others top-right; YouTube's
        // desktop/tablet strips share a top edge, so stagger those labels
        if (!labels) return;
        var tw = c.measureText(g.l).width + 10 * u, ly = g.y + 4 * u;
        var lx = g.bold ? g.x + 4 * u : g.x + g.w - tw - 4 * u;
        if (p.id === 'yt' && i === 1) lx = g.x + 4 * u;
        if (p.id === 'yt' && i === 2) { lx = g.x + 4 * u; ly = g.y + g.h - 24 * u; }
        c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(lx, ly, tw, 20 * u);
        c.fillStyle = '#fff'; c.fillText(g.l, lx + 5 * u, ly + 3 * u);
      });
      if (p.circle) {
        var ci = p.circle;
        c.fillStyle = 'rgba(239,68,68,.22)'; c.strokeStyle = '#ef4444'; c.lineWidth = 2 / k; c.setLineDash([8 / k, 6 / k]);
        c.beginPath();
        if (ci.sq) rr(c, ci.cx - ci.r, ci.cy - ci.r, ci.r * 2, ci.r * 2, ci.r * 0.12); else c.arc(ci.cx, ci.cy, ci.r, 0, Math.PI * 2);
        c.fill(); c.stroke(); c.setLineDash([]);
        if (labels) {
          var tw2 = c.measureText(ci.l).width + 10 * u;
          c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(ci.cx - tw2 / 2, ci.cy - ci.r * 0.55, tw2, 20 * u);
          c.fillStyle = '#fff'; c.fillText(ci.l, ci.cx - tw2 / 2 + 5 * u, ci.cy - ci.r * 0.55 + 3 * u);
        }
      }
    }
    function corners(b) { return [{ x: b.x, y: b.y, ax: b.x + b.w, ay: b.y + b.h }, { x: b.x + b.w, y: b.y, ax: b.x, ay: b.y + b.h }, { x: b.x, y: b.y + b.h, ax: b.x + b.w, ay: b.y }, { x: b.x + b.w, y: b.y + b.h, ax: b.x, ay: b.y }]; }

    // ---------------------------------------------------------- templates
    function applyTemplate(id) {
      var t = BTPL.filter(function (x) { return x.id === id; })[0] || BTPL[0], s = PR().safe;
      Object.assign(D.bg, { blur: 0, dim: 25 }, t.bg);
      if (D.bg.type !== 'image') D.bg.img = D.bg.img || null;
      D.layers = t.layers.map(function (l) {
        var L = Object.assign({}, l);
        L.x = s.x + l.rx * s.w; L.y = s.y + l.ry * s.h;
        if (l.type === 'text') { L.size = l.s * s.h; L.w = l.rw * s.w; L.font = l.font || 'sans'; L.align = l.align || 'center'; if (L.align === 'left') L.x = s.x + (l.rx - l.rw / 2) * s.w + L.w / 2; }
        else if (l.type === 'icon') L.size = l.s * s.h;
        else if (l.type === 'shape') { L.w = Math.max(4, l.rw * s.w); L.h = Math.max(4, l.rh * s.h); L.radius = (l.radius || 0) * s.h / 200; }
        ['rx', 'ry', 's', 'rw', 'rh'].forEach(function (k) { delete L[k]; });
        return L;
      });
      D.tpl = id; sel = -1;
    }
    function tplThumb(t) {
      var c = mkCanvas(220, 124), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 220, 124);
      g.addColorStop(0, t.bg.c1); g.addColorStop(1, t.bg.type === 'solid' ? t.bg.c1 : t.bg.c2);
      x.fillStyle = g; x.fillRect(0, 0, 220, 124);
      var txt = t.layers.filter(function (l) { return l.type === 'text'; });
      x.textAlign = 'center'; x.textBaseline = 'middle';
      txt.forEach(function (l, i) {
        x.fillStyle = l.color; x.font = (i ? '600 11px ' : '800 17px ') + (BFONTS.filter(function (f) { return f[0] === (l.font || 'sans'); })[0] || BFONTS[0])[2];
        x.fillText(l.text, 110, 54 + i * 24, 200);
      });
      return c;
    }

    // ---------------------------------------------------------- view
    function fit() {
      var cv = view.cv, st = view.stage, cs = getComputedStyle(st);
      var aw = st.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (aw <= 0) aw = 320;
      var ah = Math.min(window.innerHeight * 0.6, 640), s = Math.min(aw / W(), ah / H());
      var cw = Math.max(40, Math.floor(W() * s)), ch = Math.max(30, Math.floor(H() * s)), dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
      var pw = Math.round(cw * dpr), ph = Math.round(ch * dpr);
      if (cv.width !== pw) cv.width = pw;
      if (cv.height !== ph) cv.height = ph;
      view.k = pw / W(); view.cssK = cw / W();
    }
    var raf = 0;
    function render() {
      if (!view || raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        fit();
        var c = view.cv.getContext('2d');
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, view.cv.width, view.cv.height);
        paint(c, view.k, true);
        devicesSoon();
      });
    }
    function pt(e) { var r = view.cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W(), y: (e.clientY - r.top) / r.height * H() }; }
    function hit(p) {
      for (var i = D.layers.length - 1; i >= 0; i--) { var b = box(D.layers[i]); if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return i; }
      return -1;
    }
    function down(e) {
      if (e.button > 0) return;
      view.cv.setPointerCapture(e.pointerId);
      var p = pt(e), tol = 16 / view.cssK;
      if (sel >= 0 && D.layers[sel]) {
        var b = box(D.layers[sel]), cs = corners(b);
        for (var i = 0; i < 4; i++) if (Math.abs(p.x - cs[i].x) <= tol && Math.abs(p.y - cs[i].y) <= tol) {
          var L = D.layers[sel];
          drag = { type: 'resize', L: L, ax: cs[i].ax, ay: cs[i].ay, dx: cs[i].x > cs[i].ax ? 1 : -1, dy: cs[i].y > cs[i].ay ? 1 : -1, b0: b, s0: { size: L.size, w: L.w, h: L.h } };
          return;
        }
      }
      var hi = hit(p);
      if (hi !== sel) { sel = hi; refreshLayers(); }
      if (hi >= 0) drag = { type: 'move', L: D.layers[hi], sx: p.x, sy: p.y, x0: D.layers[hi].x, y0: D.layers[hi].y };
      render();
    }
    function move(e) {
      if (!drag) return;
      var p = pt(e), L = drag.L;
      if (drag.type === 'move') {
        L.x = drag.x0 + p.x - drag.sx; L.y = drag.y0 + p.y - drag.sy;
        var snap = 8 / view.cssK;
        if (Math.abs(L.x - W() / 2) < snap) L.x = W() / 2;
        if (Math.abs(L.y - H() / 2) < snap) L.y = H() / 2;
      } else {
        var nw = Math.max(20, Math.abs(p.x - drag.ax)), nh = Math.max(20, Math.abs(p.y - drag.ay)), s0 = drag.s0;
        var f = Math.max(nw / drag.b0.w, nh / drag.b0.h);
        if (L.type === 'text') { L.size = clamp(s0.size * f, 8, 900); L.w = s0.w * f; }
        else if (L.type === 'icon') L.size = clamp(s0.size * f, 10, 2000);
        else if (L.type === 'image') { L.w = s0.w * f; L.h = s0.h * f; }
        else { L.w = nw; L.h = nh; }
        var nb = box(L);
        L.x += (drag.dx > 0 ? drag.ax : drag.ax - nb.w) - nb.x;
        L.y += (drag.dy > 0 ? drag.ay : drag.ay - nb.h) - nb.y;
        syncProps();
      }
      render();
    }
    function up() { drag = null; }
    function key(e) {
      if (sel < 0 || !D.layers[sel]) return;
      var L = D.layers[sel], st = e.shiftKey ? 40 : 8;
      var m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (m) { L.x += m[0] * st; L.y += m[1] * st; }
      else if (e.key === 'Delete' || e.key === 'Backspace') { D.layers.splice(sel, 1); sel = -1; refreshLayers(); }
      else if (e.key === 'Escape') { sel = -1; refreshLayers(); }
      else return;
      e.preventDefault();
      render();
    }

    // ---------------------------------------------------------- devices strip
    var devTimer = 0;
    function devicesSoon() { clearTimeout(devTimer); devTimer = setTimeout(drawDevices, 180); }
    function drawDevices() {
      if (!P.devs) return;
      var p = PR(), k = Math.min(1, 640 / p.w), full = mkCanvas(p.w * k, p.h * k);
      paint(full.getContext('2d'), k, false);
      P.devs.innerHTML = '';
      p.devices.forEach(function (d) {
        var maxW = 240, sc = Math.min(maxW / d[3], 140 / d[4]), c = mkCanvas(d[3] * sc, d[4] * sc);
        c.getContext('2d').drawImage(full, d[1] * k, d[2] * k, d[3] * k, d[4] * k, 0, 0, c.width, c.height);
        c.setAttribute('role', 'img'); c.setAttribute('aria-label', d[0] + ' preview');
        P.devs.appendChild(h('figure.yt-dev', null, [h('div.sc', null, [c]), h('figcaption', { text: d[0] + ' · ' + Math.round(d[3]) + ' × ' + Math.round(d[4]) })]));
      });
    }

    // ---------------------------------------------------------- UI helpers
    function fld(label, control, hint) {
      var id = control.id || (control.id = nid('b'));
      return h('div.field', null, [h('label', { 'for': id, text: label }), control, hint ? h('span.hint', { text: hint }) : null]);
    }
    function rng(label, min, max, step, value, fmt, onInput) {
      var id = nid('r'), el = h('input', { type: 'range', min: min, max: max, step: step, id: id });
      el.value = value;
      var out = h('output', { 'for': id });
      function upd() { var t = fmt ? fmt(+el.value) : el.value; out.textContent = t; el.setAttribute('aria-valuetext', t); }
      el.addEventListener('input', function () { upd(); onInput(+el.value); });
      upd();
      var w = h('div.field', null, [h('label', { 'for': id, text: label }), h('div.yt-range', null, [el, out])]);
      w.set = function (v) { el.value = v; upd(); };
      return w;
    }
    function colr(label, value, onInput) {
      var el = h('input', { type: 'color', id: nid('c'), 'aria-label': label });
      el.value = /^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff';
      el.addEventListener('input', function () { onInput(el.value); });
      return h('div.field', null, [h('label', { 'for': el.id, text: label }), el]);
    }
    function sg(label, items, value, onChange) {
      var id = nid('s'), el = h('div.seg', { role: 'group', 'aria-label': label, id: id, html: items.map(function (it) {
        return '<button type="button" data-v="' + esc(it[0]) + '" class="' + (it[0] === value ? 'active' : '') + '" aria-pressed="' + (it[0] === value) + '">' + esc(it[1]) + '</button>';
      }).join('') });
      wireSeg(el, onChange);
      var w = h('div.field', null, [h('span.label', { text: label }), el]);
      w.set = function (v) { setSeg(el, v); };
      return w;
    }
    function bt(cls, icon, text, onClick) {
      var b = h('button.btn' + (cls ? '.' + cls.split(' ').join('.') : ''), { type: 'button', html: (icon ? BT.icon(icon) : '') + '<span>' + esc(text) + '</span>' });
      b.addEventListener('click', onClick);
      return b;
    }
    function filePick(label, onFile) {
      var fi = h('input', { type: 'file', accept: 'image/*', 'aria-label': label });
      fi.addEventListener('change', function () { var f = fi.files[0]; fi.value = ''; if (f) onFile(f); });
      return h('label.btn.btn-sm.yt-file', { html: BT.icon('image-plus') + '<span>' + esc(label) + '</span>' }, [fi]);
    }
    function decode(file, max) {
      if (!/^image\//.test(file.type)) return Promise.reject(new Error('Please choose an image file'));
      return BT.loadImage(file).then(function (img) {
        var s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), c = mkCanvas(img.naturalWidth * s, img.naturalHeight * s);
        var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, c.width, c.height);
        try { URL.revokeObjectURL(img.src); } catch (e) { /* ignore */ }
        return c;
      });
    }
    function sec(title, kids) { return h('div.yt-bsec', null, [h('h4', { text: title })].concat(kids)); }

    // ---------------------------------------------------------- panel
    function build() {
      root.innerHTML = hero('panels-top-left', 'Banners and covers with safe-area guides', 'Designed and exported in your browser. Guides are only shown on screen — they are never part of the download.');
      var stage = h('div.yt-stage');
      var under = h('div.yt-under');
      P.devs = h('div.yt-devs', { 'aria-label': 'Device previews' });
      var left = h('div', null, [stage, under, h('div.yt-sec.yt-gap', { text: 'How it looks on each device' }), P.devs]);
      var panel = h('div.card.yt-bpanel');
      root.appendChild(h('div.split.wide-left', null, [h('div.yt-sticky', null, [left]), h('div', null, [panel])]));
      var cv = h('canvas', { tabindex: '0', role: 'img', 'aria-label': 'Banner canvas. Click a layer to select it, drag to move, drag a corner to resize. Arrow keys move the selected layer, Delete removes it.' });
      stage.appendChild(cv);
      view = { cv: cv, stage: stage, k: 1, cssK: 1 };
      cv.addEventListener('pointerdown', down);
      cv.addEventListener('pointermove', move);
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', up);
      cv.addEventListener('keydown', key);
      if (window.ResizeObserver) new ResizeObserver(function () { render(); }).observe(stage);
      else window.addEventListener('resize', render);
      P.under = under;

      // size
      P.preset = h('select', { id: nid('p'), html: BPRESETS.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join('') });
      P.preset.value = D.preset;
      P.preset.addEventListener('change', function () { setPreset(P.preset.value); });
      panel.appendChild(h('h3', { text: 'Size' }));
      panel.appendChild(fld('Banner type', P.preset));
      var g = h('label.check', null, [h('input', { type: 'checkbox', checked: D.guides, onchange: function (e) { D.guides = e.target.checked; refreshUnder(); render(); } }), ' Show safe-area guides']);
      panel.appendChild(g);
      P.note = h('p.small.muted', { style: { margin: '8px 0 0' } });
      panel.appendChild(P.note);

      // templates
      var tg = h('div.yt-tpls', { role: 'group', 'aria-label': 'Templates' });
      BTPL.forEach(function (t) {
        var b = h('button', { type: 'button', 'aria-pressed': String(t.id === D.tpl), 'aria-label': 'Template: ' + t.name }, [tplThumb(t), h('span', { text: t.name })]);
        b.addEventListener('click', function () {
          applyTemplate(t.id);
          BT.$$('button', tg).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          syncBg(); refreshLayers(); render();
        });
        tg.appendChild(b);
      });
      panel.appendChild(sec('Templates', [tg]));

      // background
      P.bgType = sg('Background', [['solid', 'Colour'], ['linear', 'Gradient'], ['radial', 'Glow'], ['image', 'Photo']], D.bg.type, function (v) { D.bg.type = v; syncBg(); render(); if (v === 'image' && !D.bg.img) BT.toast('Choose a background photo'); });
      P.c1 = colr('Colour 1', D.bg.c1, function (v) { D.bg.c1 = v; render(); });
      P.c2 = colr('Colour 2', D.bg.c2, function (v) { D.bg.c2 = v; render(); });
      P.ang = rng('Gradient angle', 0, 360, 5, D.bg.angle, function (v) { return v + '°'; }, function (v) { D.bg.angle = v; render(); });
      var grads = h('div.yt-grads', { role: 'group', 'aria-label': 'Gradient presets' });
      BGRADS.forEach(function (gc) {
        var b = h('button', { type: 'button', 'aria-label': 'Gradient ' + gc[0] + ' to ' + gc[1], style: { background: 'linear-gradient(135deg,' + gc[0] + ',' + gc[1] + ')' } });
        b.addEventListener('click', function () { D.bg.c1 = gc[0]; D.bg.c2 = gc[1]; if (D.bg.type === 'solid' || D.bg.type === 'image') D.bg.type = 'linear'; syncBg(); render(); });
        grads.appendChild(b);
      });
      P.colors = h('div', null, [h('div.yt-colors', null, [P.c1, P.c2]), P.ang, grads]);
      P.imgBox = h('div', null, [
        filePick('Choose photo', function (f) { decode(f, 3200).then(function (c) { D.bg.img = c; blurCache.key = ''; D.bg.type = 'image'; syncBg(); render(); }).catch(function (e) { BT.toast(e.message, 'error'); }); }),
        h('p.small.muted', { text: 'Fills the whole banner (cover). Use a photo at least as wide as the banner.', style: { margin: '8px 0 12px' } }),
        P.blur = rng('Blur', 0, 40, 1, D.bg.blur, null, function (v) { D.bg.blur = v; render(); }),
        P.dim = rng('Darken', 0, 85, 1, D.bg.dim, function (v) { return v + '%'; }, function (v) { D.bg.dim = v; render(); })
      ]);
      panel.appendChild(sec('Background', [P.bgType, P.colors, P.imgBox]));

      // layers
      var addBar = h('div.btn-group', null, [
        bt('btn-sm', 'type', 'Text', function () { var s = PR().safe; addLayer({ type: 'text', text: 'Your text', x: s.x + s.w / 2, y: s.y + s.h / 2, w: s.w * 0.8, size: s.h * 0.18, weight: 800, color: '#ffffff', font: 'sans', align: 'center', shadow: true }); }),
        bt('btn-sm', 'star', 'Sticker', function () { var s = PR().safe; addLayer({ type: 'icon', name: 'star', x: s.x + s.w / 2, y: s.y + s.h / 2, size: s.h * 0.3, color: '#ffffff', bg: 'none', bgColor: '#000000' }); }),
        bt('btn-sm', 'square', 'Shape', function () { var s = PR().safe; addLayer({ type: 'shape', shape: 'rect', x: s.x + s.w / 2, y: s.y + s.h / 2, w: s.w * 0.4, h: s.h * 0.3, fill: '#ffffff', opacity: 0.85, radius: s.h * 0.05 }); }),
        filePick('Logo', function (f) {
          decode(f, 1600).then(function (c) {
            var s = PR().safe, hh = s.h * 0.6, w = hh * c.width / c.height;
            if (w > s.w * 0.5) { w = s.w * 0.5; hh = w * c.height / c.width; }
            addLayer({ type: 'image', img: c, x: s.x + w / 2 + s.w * 0.04, y: s.y + s.h / 2, w: w, h: hh, radius: 0, opacity: 1 });
          }).catch(function (e) { BT.toast(e.message, 'error'); });
        })
      ]);
      P.layers = h('div.yt-layers');
      panel.appendChild(sec('Layers', [addBar, P.layers]));
      P.props = h('div');
      panel.appendChild(P.propSec = sec('Selected layer', [P.props]));

      // export
      P.fmt = sg('Format', [['image/jpeg', 'JPG'], ['image/png', 'PNG']], D.fmt, function (v) { D.fmt = v; });
      var dl = bt('btn-primary', 'download', 'Download', function () { BT.busy(dl, exportImage, 'Rendering…'); });
      dl.setAttribute('data-download', '');
      P.size = h('div.yt-size', { 'aria-live': 'polite' });
      panel.appendChild(sec('Export', [P.fmt, h('div.btn-group', null, [dl]), P.size]));

      syncBg(); refreshLayers(); render();
      if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(render);
    }
    function syncBg() {
      P.bgType.set(D.bg.type);
      P.colors.classList.toggle('hidden', D.bg.type === 'image');
      P.c2.classList.toggle('hidden', D.bg.type === 'solid');
      P.ang.classList.toggle('hidden', D.bg.type !== 'linear');
      BT.$('input', P.c1).value = /^#[0-9a-f]{6}$/i.test(D.bg.c1) ? D.bg.c1 : '#000000';
      BT.$('input', P.c2).value = /^#[0-9a-f]{6}$/i.test(D.bg.c2) ? D.bg.c2 : '#000000';
      P.ang.set(D.bg.angle || 0);
      P.imgBox.classList.toggle('hidden', D.bg.type !== 'image');
      P.blur.set(D.bg.blur); P.dim.set(D.bg.dim);
    }
    function setPreset(id) {
      var o = PR(), n = bpreset(id), so = o.safe, sn = n.safe, f = Math.min(sn.w / so.w, sn.h / so.h);
      D.layers.forEach(function (L) {
        L.x = sn.x + (L.x - so.x) / so.w * sn.w; L.y = sn.y + (L.y - so.y) / so.h * sn.h;
        if (L.type === 'text') { L.size *= f; L.w = Math.min(L.w * sn.w / so.w, n.w * 0.95); }
        else if (L.type === 'icon') L.size *= f;
        else { L.w *= f; L.h *= f; if (L.radius) L.radius *= f; }
      });
      D.preset = id;
      D.fmt = n.fmt; P.fmt.set(n.fmt);
      P.size.textContent = '';
      refreshLayers(); render();
    }
    function refreshUnder() {
      var p = PR();
      P.under.innerHTML = BT.icon('move') + '<span>Drag to move · corners resize · exports at ' + p.w + ' × ' + p.h + ' px</span>' +
        (D.guides ? p.guides.map(function (g) { return '<span><span style="color:' + g.c + '" aria-hidden="true">■</span> ' + esc(g.l) + '</span>'; }).join('') +
          (p.circle ? '<span><span style="color:#ef4444" aria-hidden="true">●</span> ' + esc(p.circle.l) + '</span>' : '') : '');
      P.note.textContent = p.note;
    }
    function addLayer(L) { D.layers.push(L); sel = D.layers.length - 1; refreshLayers(); render(); }
    function layerName(L) {
      if (L.type === 'text') return '“' + String(L.text).replace(/\n/g, ' ').slice(0, 26) + '”';
      if (L.type === 'icon') return 'Sticker: ' + L.name.replace(/-/g, ' ');
      if (L.type === 'image') return 'Logo / image';
      return 'Shape: ' + L.shape;
    }
    function smallBtn(icon, label, fn) {
      var b = h('button.btn.btn-sm.btn-ghost.yt-icon-btn', { type: 'button', 'aria-label': label, title: label, html: BT.icon(icon) });
      b.addEventListener('click', fn);
      return b;
    }
    function refreshLayers() {
      refreshUnder();
      P.layers.innerHTML = '';
      if (!D.layers.length) P.layers.appendChild(h('p.small.muted', { text: 'No layers yet — add text, a sticker or your logo.' }));
      for (var i = D.layers.length - 1; i >= 0; i--) (function (i) {
        var L = D.layers[i];
        var t = h('button.t', { type: 'button', text: layerName(L), 'aria-pressed': String(i === sel) });
        t.addEventListener('click', function () { sel = i; refreshLayers(); render(); });
        P.layers.appendChild(h('div.yt-li' + (i === sel ? '.on' : ''), null, [
          h('span.icon-sm', { html: BT.icon(L.type === 'text' ? 'type' : L.type === 'icon' ? 'star' : L.type === 'image' ? 'image' : 'square') }), t,
          smallBtn('chevron-down', 'Move down', function () { if (i > 0) { var x = D.layers.splice(i, 1)[0]; D.layers.splice(i - 1, 0, x); if (sel === i) sel = i - 1; refreshLayers(); render(); } }),
          smallBtn('copy', 'Duplicate', function () { var c = Object.assign({}, L); c.x += 30; c.y += 30; D.layers.splice(i + 1, 0, c); sel = i + 1; refreshLayers(); render(); }),
          smallBtn('trash-2', 'Delete', function () { D.layers.splice(i, 1); if (sel === i) sel = -1; else if (sel > i) sel--; refreshLayers(); render(); })
        ]));
      })(i);
      buildProps();
    }
    function syncProps() { if (P.sync) P.sync(); }
    function buildProps() {
      P.props.innerHTML = ''; P.sync = null;
      var L = D.layers[sel];
      P.propSec.classList.toggle('hidden', !L);
      if (!L) return;
      var kids = [];
      if (L.type === 'text') {
        var ta = h('textarea', { rows: 2, style: { minHeight: '0' } });
        ta.value = L.text;
        ta.addEventListener('input', function () { L.text = ta.value; render(); var b = BT.$('.yt-li.on .t', P.layers); if (b) b.textContent = layerName(L); });
        kids.push(fld('Text (Hindi, Bengali and emoji work)', ta));
        var fs = h('select', { html: BFONTS.map(function (f) { return '<option value="' + f[0] + '">' + esc(f[1]) + '</option>'; }).join('') });
        fs.value = L.font || 'sans';
        fs.addEventListener('change', function () { L.font = fs.value; render(); });
        kids.push(fld('Font', fs));
        var sz = rng('Size', 10, Math.round(H() * 0.5), 1, Math.round(L.size), function (v) { return v + ' px'; }, function (v) { L.size = v; render(); });
        kids.push(sz);
        kids.push(sg('Weight', [['400', 'Regular'], ['600', 'Semibold'], ['800', 'Bold']], String(L.weight >= 700 ? 800 : L.weight >= 500 ? 600 : 400), function (v) { L.weight = +v; render(); }));
        kids.push(sg('Align', [['left', 'Left'], ['center', 'Centre'], ['right', 'Right']], L.align || 'center', function (v) { L.align = v; render(); }));
        kids.push(h('div.yt-colors', null, [colr('Text colour', L.color, function (v) { L.color = v; render(); }), colr('Label colour', /^#/.test(L.pillColor || '') ? L.pillColor : '#000000', function (v) { L.pillColor = v; render(); })]));
        kids.push(h('div.yt-checks', { style: { marginTop: '12px' } }, [
          h('label.check', null, [h('input', { type: 'checkbox', checked: !!L.shadow, onchange: function (e) { L.shadow = e.target.checked; render(); } }), ' Shadow']),
          h('label.check', null, [h('input', { type: 'checkbox', checked: !!L.pill, onchange: function (e) { L.pill = e.target.checked; if (!L.pillColor) L.pillColor = '#000000'; render(); } }), ' Label background']),
          h('label.check', null, [h('input', { type: 'checkbox', checked: !!L.italic, onchange: function (e) { L.italic = e.target.checked; render(); } }), ' Italic'])
        ]));
        P.sync = function () { sz.set(Math.round(L.size)); };
      } else if (L.type === 'icon') {
        var search = h('input', { type: 'search', placeholder: 'Search stickers…', 'aria-label': 'Search stickers' });
        var grid = h('div.yt-icons', { role: 'group', 'aria-label': 'Stickers' });
        var all = BICONS.filter(function (n) { return ICONS[n]; }).concat(Object.keys(ICONS).filter(function (n) { return BICONS.indexOf(n) < 0; }));
        var fill = function () {
          var q = search.value.toLowerCase().trim();
          grid.innerHTML = all.filter(function (n) { return !q || n.indexOf(q) >= 0; }).slice(0, 120).map(function (n) {
            return '<button type="button" data-n="' + esc(n) + '" aria-label="' + esc(n.replace(/-/g, ' ')) + '" aria-pressed="' + (n === L.name) + '">' + BT.icon(n) + '</button>';
          }).join('');
        };
        grid.addEventListener('click', function (e) { var b = e.target.closest('button[data-n]'); if (!b) return; L.name = b.getAttribute('data-n'); fill(); render(); refreshLayersSoft(); });
        search.addEventListener('input', fill);
        fill();
        kids.push(search, grid);
        var isz = rng('Size', 20, Math.round(H() * 0.6), 1, Math.round(L.size), function (v) { return v + ' px'; }, function (v) { L.size = v; render(); });
        kids.push(isz);
        kids.push(h('div.yt-colors', { style: { marginTop: '4px' } }, [colr('Colour', L.color, function (v) { L.color = v; render(); }), colr('Badge colour', /^#/.test(L.bgColor) ? L.bgColor : '#000000', function (v) { L.bgColor = v; render(); })]));
        kids.push(sg('Badge', [['none', 'None'], ['circle', 'Circle'], ['rounded', 'Rounded']], L.bg, function (v) { L.bg = v; render(); }));
        P.sync = function () { isz.set(Math.round(L.size)); };
      } else if (L.type === 'shape') {
        kids.push(sg('Shape', [['rect', 'Rectangle'], ['circle', 'Ellipse']], L.shape, function (v) { L.shape = v; render(); }));
        kids.push(colr('Fill', L.fill, function (v) { L.fill = v; render(); }));
        kids.push(rng('Opacity', 0.05, 1, 0.05, L.opacity == null ? 1 : L.opacity, function (v) { return Math.round(v * 100) + '%'; }, function (v) { L.opacity = v; render(); }));
        kids.push(rng('Corner radius', 0, Math.round(H() * 0.2), 1, L.radius || 0, null, function (v) { L.radius = v; render(); }));
      } else if (L.type === 'image') {
        var isz2 = rng('Width', 20, W(), 1, Math.round(L.w), function (v) { return v + ' px'; }, function (v) { var r = L.h / L.w; L.w = v; L.h = v * r; render(); });
        kids.push(isz2);
        kids.push(rng('Opacity', 0.05, 1, 0.05, L.opacity == null ? 1 : L.opacity, function (v) { return Math.round(v * 100) + '%'; }, function (v) { L.opacity = v; render(); }));
        kids.push(rng('Corner radius', 0, Math.round(Math.min(L.w, L.h) / 2), 1, L.radius || 0, null, function (v) { L.radius = v; render(); }));
        P.sync = function () { isz2.set(Math.round(L.w)); };
      }
      var cen = bt('btn-sm btn-ghost', 'move', 'Centre in safe area', function () { var s = PR().safe; L.x = s.x + s.w / 2; L.y = s.y + s.h / 2; render(); });
      kids.push(h('div.btn-group', { style: { marginTop: '6px' } }, [cen]));
      kids.forEach(function (k) { P.props.appendChild(k); });
    }
    function refreshLayersSoft() { var b = BT.$('.yt-li.on .t', P.layers); if (b && D.layers[sel]) b.textContent = layerName(D.layers[sel]); }

    // ---------------------------------------------------------- export
    function exportImage() {
      var p = PR();
      var ready = doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve();
      // make sure sticker images are decoded before the final render
      var icons = D.layers.filter(function (L) { return L.type === 'icon'; }).map(function (L) {
        return new Promise(function (res) {
          if (iconImg(L.name, L.color)) return res();
          var tries = 0, t = setInterval(function () { if (iconImg(L.name, L.color) || ++tries > 40) { clearInterval(t); res(); } }, 50);
        });
      });
      return Promise.all([ready].concat(icons)).then(function () {
        var out = mkCanvas(p.w, p.h);
        paint(out.getContext('2d'), 1, false);
        var mime = D.fmt;
        var limit = p.max || 0;
        var tryQ = function (m, q) {
          return BT.canvasToBlob(out, m, m === 'image/png' ? undefined : q).then(function (blob) {
            if (!blob) throw new Error('Your browser could not create the image');
            if (limit && blob.size > limit) {
              if (m === 'image/png') { BT.toast('PNG is over 6 MB — switching to JPG'); return tryQ('image/jpeg', 0.92); }
              if (q > 0.55) return tryQ(m, Math.round((q - 0.08) * 100) / 100);
            }
            return { blob: blob, mime: m, q: q };
          });
        };
        return tryQ(mime, 0.92).then(function (r) {
          var ext = r.mime === 'image/png' ? 'png' : 'jpg';
          var name = p.file + '-' + p.w + 'x' + p.h + '.' + ext;
          BT.download(r.blob, name, r.mime);
          var over = limit && r.blob.size > limit;
          P.size.innerHTML = (over ? '<span class="badge danger">' : '<span class="badge ok">') + esc(BT.fmtBytes(r.blob.size)) + '</span> ' +
            esc(p.w + ' × ' + p.h + ' ' + ext.toUpperCase() + (r.mime === 'image/jpeg' ? ' · quality ' + Math.round(r.q * 100) + '%' : '')) +
            (limit ? (over ? ' — still over YouTube’s 6 MB limit; try a simpler background.' : ' — within YouTube’s 6 MB limit') : '');
          BT.toast('Saved ' + name);
        });
      });
    }

    applyTemplate('creator');
    build();
    void ctx;
  });

  // =================================================== 9. Earnings estimator
  /** Pure estimate (monthly figures). Exposed on the element for tests via data attributes only. */
  function earnCalc(o) {
    var lo = Math.min(o.rpmLo, o.rpmHi), hi = Math.max(o.rpmLo, o.rpmHi);
    var slo = Math.min(o.sRpmLo, o.sRpmHi), shi = Math.max(o.sRpmLo, o.sRpmHi);
    var mem = o.members * o.memPrice * o.memShare / 100;
    var r = {
      long: [o.views / 1000 * lo, o.views / 1000 * hi],
      shorts: [o.sViews / 1000 * slo, o.sViews / 1000 * shi],
      mem: [mem, mem], spon: [o.spon, o.spon], other: [o.other, o.other]
    };
    r.total = [0, 1].map(function (i) { return r.long[i] + r.shorts[i] + r.mem[i] + r.spon[i] + r.other[i]; });
    return r;
  }

  BT.impl('youtube-earnings-calculator', function (root) {
    css();
    var period = 'month';
    root.innerHTML =
      hero('indian-rupee', 'Estimate YouTube income in rupees', 'Based on the views and RPM you enter. It is an estimate only — real earnings vary a lot.') +
      '<div class="split"><div><div class="card">' +
        '<div class="field"><span class="label">I’ll enter views</span>' + seg('ye-per', [['month', 'Per month'], ['day', 'Per day']], period, 'Views period') + '</div>' +
        field('ye-views', 'Long-form video views', inp('ye-views', 'text', 'e.g. 1,00,000', '100000', ' inputmode="decimal" autocomplete="off"'), 'Views on regular (non-Shorts) videos that can show ads.') +
        '<div class="row cols-2">' + field('ye-lo', 'RPM — low (₹ per 1,000 views)', inp('ye-lo', 'text', '₹', '30', ' inputmode="decimal"')) +
          field('ye-hi', 'RPM — high (₹ per 1,000 views)', inp('ye-hi', 'text', '₹', '120', ' inputmode="decimal"')) + '</div>' +
        '<p class="small muted" style="margin:-6px 0 14px">The ₹30–₹120 pre-filled here is <strong>only an example to show how the maths works</strong> — not an average. Find your real RPM in YouTube Studio → Analytics → Revenue, and enter the same value in both boxes for a single figure.</p>' +
        '<details class="yt-faq" id="ye-more"><summary>Shorts, memberships and sponsorships (optional)</summary><div style="margin-top:12px">' +
          field('ye-sv', 'Shorts views', inp('ye-sv', 'text', '0', '', ' inputmode="decimal"')) +
          '<div class="row cols-2">' + field('ye-slo', 'Shorts RPM — low (₹)', inp('ye-slo', 'text', '₹', '2', ' inputmode="decimal"')) + field('ye-shi', 'Shorts RPM — high (₹)', inp('ye-shi', 'text', '₹', '8', ' inputmode="decimal"')) + '</div>' +
          '<p class="small muted" style="margin:-6px 0 14px">Shorts are paid from a shared revenue pool, so their RPM is usually much lower than long videos. Again, these numbers are only an example.</p>' +
          '<div class="row cols-3">' + field('ye-mem', 'Channel members', inp('ye-mem', 'text', '0', '', ' inputmode="decimal"')) +
            field('ye-mp', 'Price per month (₹)', inp('ye-mp', 'text', '₹', '59', ' inputmode="decimal"')) +
            field('ye-ms', 'Your share (%)', inp('ye-ms', 'text', '%', '70', ' inputmode="decimal"'), 'Check YouTube’s current terms.') + '</div>' +
          '<div class="row cols-2">' + field('ye-sp', 'Sponsorships per month (₹)', inp('ye-sp', 'text', '₹', '', ' inputmode="decimal"')) +
            field('ye-ot', 'Other income per month (₹)', inp('ye-ot', 'text', 'Super Thanks, affiliates…', '', ' inputmode="decimal"')) + '</div>' +
        '</div></details>' +
        '<p class="small muted" style="margin:10px 0 0">Shorts views, members and sponsorships use the same period you chose above.</p>' +
      '</div></div>' +
      '<div><div class="result" id="ye-res" aria-live="polite"></div>' +
        '<div class="stats yt-gap" id="ye-stats"></div>' +
        '<div class="card yt-gap"><h3 class="yt-h" style="margin-bottom:10px">Monthly breakdown</h3><div class="yt-bars" id="ye-bars"></div>' +
          '<div class="table-wrap yt-gap"><table class="table"><thead><tr><th>Source</th><th class="num">Low</th><th class="num">High</th></tr></thead><tbody id="ye-table"></tbody></table></div></div>' +
        '<div class="card"><h3 class="yt-h" style="margin-bottom:10px">Views needed for a monthly target</h3>' +
          field('ye-goal', 'Target ad income per month (₹)', inp('ye-goal', 'text', 'e.g. 25,000', '25000', ' inputmode="decimal"')) + '<div id="ye-need" class="small"></div></div>' +
      '</div></div>' +
      '<div class="yt-faq yt-gap">' +
        '<details open><summary>RPM vs CPM — what’s the difference?</summary><p><strong>CPM</strong> is what advertisers pay per 1,000 ad impressions, before YouTube’s share. <strong>RPM</strong> (revenue per mille) is what <em>you</em> actually earn per 1,000 views after YouTube’s share, counting all views — including ones with no ads. That’s why this calculator uses RPM. RPM varies widely by niche (finance and tech often differ greatly from entertainment), by where your viewers live, by video length and by season (ad rates often rise before festivals and year-end and dip in January).</p></details>' +
        '<details><summary>When can a channel start earning?</summary><p>Ad income needs the YouTube Partner Programme (YPP). Eligibility depends on things like subscriber count, watch hours or Shorts views, following YouTube’s policies and having an AdSense account — and the thresholds change from time to time. Please <strong>check YouTube’s current requirements</strong> in YouTube Studio → Earn before planning around them.</p></details>' +
        '<details><summary>Tax on YouTube income in India (general information)</summary><ul>' +
          '<li>Income from YouTube is generally taxable in India and is often treated as business or professional income. GST may also apply in some cases.</li>' +
          '<li>Google may withhold US tax on the part of your earnings that comes from viewers in the United States. If you haven’t submitted your tax information in AdSense, a higher withholding rate may apply; submitting it and claiming tax-treaty benefits, where eligible, can reduce it.</li>' +
          '<li>Rules change and depend on your situation, so please talk to a chartered accountant or tax professional. This is general information, not tax advice.</li></ul></details>' +
      '</div>' +
      '<div class="yt-msgs">' + notice('warn', '<strong>Estimates only.</strong> Results depend entirely on the views and RPM you enter. Actual earnings depend on ads shown, viewer location, niche, season, eligibility and YouTube’s terms, and can be much higher or lower. BISCS is not affiliated with YouTube or Google.') + '</div>';

    var perEl = $('ye-per', root);
    wireSeg(perEl, function (v) {
      var old = period; period = v;
      // keep the same real-world numbers when switching
      var f = old === 'month' && v === 'day' ? 12 / 365 : old === 'day' && v === 'month' ? 365 / 12 : 1;
      ['ye-views', 'ye-sv', 'ye-sp', 'ye-ot'].forEach(function (id) {
        var el = $(id, root), n = BT.num(el.value);
        if (isFinite(n) && n) el.value = Math.round(n * f);
      });
      update();
    });
    function num(id, def) { var n = BT.num(val(root, id)); return isFinite(n) && n >= 0 ? n : (def || 0); }
    function range(a, b) { return Math.round(a) === Math.round(b) ? BT.fmtINR(a) : BT.fmtINR(a) + ' – ' + BT.fmtINR(b); }
    function update() {
      var toM = period === 'day' ? 365 / 12 : 1;
      var o = {
        views: num('ye-views') * toM, rpmLo: num('ye-lo'), rpmHi: num('ye-hi', num('ye-lo')),
        sViews: num('ye-sv') * toM, sRpmLo: num('ye-slo'), sRpmHi: num('ye-shi', num('ye-slo')),
        members: num('ye-mem'), memPrice: num('ye-mp'), memShare: Math.min(100, num('ye-ms')),
        spon: num('ye-sp') * toM, other: num('ye-ot') * toM
      };
      var r = earnCalc(o), t = r.total;
      $('ye-res', root).innerHTML = '<div class="label">Estimated monthly earnings</div><div class="value" data-monthly-low="' + Math.round(t[0]) + '" data-monthly-high="' + Math.round(t[1]) + '">' + range(t[0], t[1]) + '</div>' +
        '<div class="small" style="opacity:.85;margin-top:6px">From ' + BT.fmtNum(Math.round(o.views), 0) + ' long-form views a month' + (o.sViews ? ' + ' + BT.fmtNum(Math.round(o.sViews), 0) + ' Shorts views' : '') + '</div>';
      $('ye-stats', root).innerHTML = [['Per day', 12 / 365], ['Per month', 1], ['Per year', 12]].map(function (p) {
        return '<div class="stat"><div class="label">' + p[0] + '</div><div class="value">' + range(t[0] * p[1], t[1] * p[1]) + '</div></div>';
      }).join('');
      var rows = [['Long-form ads', r.long, '#ef4444'], ['Shorts', r.shorts, '#f59e0b'], ['Memberships', r.mem, '#8b5cf6'], ['Sponsorships', r.spon, '#10b981'], ['Other', r.other, '#0ea5e9']];
      var max = Math.max.apply(null, rows.map(function (x) { return x[1][1]; }).concat([1]));
      $('ye-bars', root).innerHTML = rows.filter(function (x) { return x[1][1] > 0; }).map(function (x) {
        return '<div class="yt-bar"><span>' + x[0] + '</span><span class="tr"><span style="width:' + (x[1][1] / max * 100).toFixed(1) + '%;background:' + x[2] + '"></span></span><b>' + range(x[1][0], x[1][1]) + '</b></div>';
      }).join('') || '<p class="muted small">Enter your views and RPM to see the breakdown.</p>';
      $('ye-table', root).innerHTML = rows.map(function (x) {
        return '<tr><td>' + x[0] + '</td><td class="num">' + BT.fmtINR(x[1][0]) + '</td><td class="num">' + BT.fmtINR(x[1][1]) + '</td></tr>';
      }).join('') + '<tr><td><strong>Total</strong></td><td class="num"><strong>' + BT.fmtINR(t[0]) + '</strong></td><td class="num"><strong>' + BT.fmtINR(t[1]) + '</strong></td></tr>';
      var goal = num('ye-goal'), lo = Math.min(o.rpmLo, o.rpmHi), hi = Math.max(o.rpmLo, o.rpmHi);
      $('ye-need', root).innerHTML = goal && hi > 0 ? 'About <strong>' + BT.fmtNum(Math.ceil(goal / hi * 1000), 0) + '</strong>' + (lo > 0 && lo !== hi ? ' to <strong>' + BT.fmtNum(Math.ceil(goal / lo * 1000), 0) + '</strong>' : '') +
        ' long-form views a month (≈ ' + BT.fmtNum(Math.ceil(goal / hi * 1000 * 12 / 365), 0) + (lo > 0 && lo !== hi ? '–' + BT.fmtNum(Math.ceil(goal / lo * 1000 * 12 / 365), 0) : '') + ' a day) at your RPM range.'
        : '<span class="muted">Enter a target and an RPM above.</span>';
    }
    root.addEventListener('input', BT.debounce(update, 80));
    update();
  });

})();
