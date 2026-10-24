/*
 * BISCS Tools — Office & Business.
 * Resume builder, salary slip generator, rent receipt generator,
 * Excel/CSV converter and Word (DOCX) to PDF. Everything runs in the browser.
 */
(function () {
  'use strict';
  var BT = window.BT;
  var doc = document;
  var h = BT.h, esc = BT.esc;
  var IMPLS = {};
  function register(id, fn) { IMPLS[id] = fn; BT.impl(id, fn); }

  // =================================================================== CSS
  var PAGE_CSS = (function () {
    // Named pages so each document type gets its own paper size and margins.
    var out = [
      '@page off-a4{size:A4;margin:12mm 0}',
      '@page off-letter{size:letter;margin:12mm 0}',
      '@page off-a4p{size:A4;margin:10mm}'
    ];
    var margins = { normal: '25.4mm', moderate: '19mm', narrow: '12.7mm' };
    ['a4', 'letter'].forEach(function (s) {
      Object.keys(margins).forEach(function (m) { out.push('@page off-wd-' + s + '-' + m + '{size:' + (s === 'a4' ? 'A4' : 'letter') + ';margin:' + margins[m] + '}'); });
    });
    return out.join('\n');
  })();

  var CSS = [
    '.off-wrap{container-type:inline-size;--off-acc:var(--brand)}',
    '.off-bar{position:sticky;top:72px;z-index:12;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--glass);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);margin-bottom:16px;box-shadow:var(--shadow-sm)}',
    '.off-bar .spacer{flex:1}',
    '.off-status{font-size:.8rem;color:var(--text-3);display:inline-flex;align-items:center;gap:6px}',
    '.off-status::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--ok);box-shadow:0 0 0 3px var(--ok-soft)}',
    '@media (max-width:719px){.off-bar{position:static}.off-bar .spacer{flex-basis:100%;height:0}.off-bar .btn{flex:1 1 auto}}',
    '.off-cols{display:grid;gap:16px;grid-template-columns:minmax(0,1fr)}',
    '.off-cols>*{min-width:0}',
    '@container (min-width:760px){.off-cols.doc-first{grid-template-columns:minmax(0,1.55fr) minmax(0,1fr)}}',
    '@container (min-width:760px){.off-cols{grid-template-columns:minmax(0,1fr) minmax(0,1.02fr);align-items:start}.off-cols .off-side{align-self:stretch}.off-cols .off-sticky{position:sticky;top:var(--off-top,140px)}.off-cols .off-sticky .off-preview{max-height:calc(100vh - var(--off-top,140px) - 16px);overflow:auto}}',
    '.off-stack>*+*{margin-top:16px}',
    '.off-stack>.card+.card{margin-top:16px}',
    '.off-grid2{display:grid;gap:0 12px;grid-template-columns:minmax(0,1fr)}',
    '@container (min-width:420px){.off-grid2{grid-template-columns:repeat(2,minmax(0,1fr))}.off-grid2 .full{grid-column:1/-1}.off-grid3{grid-template-columns:repeat(3,minmax(0,1fr))}}',
    '.off-grid3{display:grid;gap:0 12px;grid-template-columns:minmax(0,1fr)}',
    '.off-wrap textarea{min-height:84px}',
    '.off-wrap .field{margin-bottom:12px}',
    '.off-hint{font-size:.8rem;color:var(--text-3);margin:-4px 0 10px}',
    '.off-ib{width:34px;height:34px;border-radius:9px;border:1px solid var(--border);background:var(--surface);color:var(--text-2);display:inline-grid;place-items:center;cursor:pointer;flex:none;padding:0}',
    '.off-ib:hover{color:var(--text);border-color:var(--border-strong)}',
    '.off-ib:disabled{opacity:.35;cursor:default}',
    '.off-ib.danger:hover{color:var(--danger);border-color:color-mix(in srgb,var(--danger) 40%,var(--border))}',
    '.off-ib .icon{width:16px;height:16px}',
    '.off-chev{transition:transform .2s}',
    '.off-sec.collapsed .off-chev{transform:rotate(-90deg)}',
    // section cards
    '.off-sec{border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);box-shadow:var(--shadow-sm);transition:box-shadow .2s,border-color .2s}',
    '.off-sec:focus-within{border-color:color-mix(in srgb,var(--brand) 35%,var(--border))}',
    '.off-sec-h{display:flex;align-items:center;gap:8px;padding:10px 12px 10px 14px}',
    '.off-sec-h .t{flex:1;min-width:0;display:flex;align-items:center;gap:10px;background:none;border:0;padding:4px 0;font:inherit;font-weight:650;font-size:1rem;color:var(--text);cursor:pointer;text-align:left}',
    '.off-sec-h .t .ic{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:var(--brand-soft);color:var(--brand);flex:none}',
    '.off-sec-h .t .ic .icon{width:16px;height:16px}',
    '.off-sec-h .t .cnt{font-size:.75rem;font-weight:700;color:var(--text-3);background:var(--surface-2);border:1px solid var(--border);border-radius:99px;padding:1px 8px}',
    '.off-sec-b{padding:2px 14px 14px}',
    '.off-sec.collapsed .off-sec-b{display:none}',
    '.off-item{border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface-2);padding:10px 12px 2px}',
    '.off-item+.off-item{margin-top:10px}',
    '.off-item-h{display:flex;align-items:center;gap:6px;margin-bottom:8px}',
    '.off-item-h .n{flex:1;min-width:0;font-weight:650;font-size:.82rem;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.off-item-h .off-ib{width:30px;height:30px}',
    '.off-item input,.off-item select,.off-item textarea{background:var(--surface)}',
    '.off-add{margin-top:10px}',
    '.off-mini{display:grid;gap:8px;grid-template-columns:minmax(0,1fr) 120px 34px;align-items:center}',
    '.off-mini+.off-mini{margin-top:8px}',
    '.off-mini input,.off-mini select{min-height:38px;padding:7px 10px;font-size:.92rem}',
    '.off-mini.k4{grid-template-columns:minmax(0,1fr) 120px auto 34px}',
    '@container (max-width:380px){.off-mini.k4{grid-template-columns:minmax(0,1fr) 100px 34px}.off-mini.k4 .check{grid-column:1/-1;grid-row:2}}',
    // design pickers
    '.off-tpls{display:grid;gap:10px;grid-template-columns:repeat(2,minmax(0,1fr))}',
    '@container (min-width:520px){.off-tpls{grid-template-columns:repeat(4,minmax(0,1fr))}}',
    '.off-tpl{display:flex;flex-direction:column;gap:6px;align-items:stretch;padding:8px;border:2px solid var(--border);border-radius:12px;background:var(--surface);cursor:pointer;font:inherit;font-size:.82rem;font-weight:650;color:var(--text-2);transition:border-color .15s,transform .15s}',
    '.off-tpl:hover{transform:translateY(-1px);border-color:var(--border-strong)}',
    '.off-tpl[aria-pressed="true"]{border-color:var(--brand);color:var(--text);box-shadow:var(--ring)}',
    '.off-tpl .pv{height:64px;border-radius:6px;background:#fff;border:1px solid #e5e7eb;position:relative;overflow:hidden}',
    '.off-tpl .pv i{position:absolute;display:block;border-radius:2px;background:#d1d5db}',
    '.off-swatches{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
    '.off-swatches button{width:28px;height:28px;border-radius:50%;border:2px solid var(--surface);box-shadow:0 0 0 1px var(--border-strong);cursor:pointer;padding:0}',
    '.off-swatches button[aria-pressed="true"]{box-shadow:0 0 0 2px var(--text)}',
    '.off-swatches input[type=color]{width:34px;height:34px;padding:2px;border-radius:50%}',
    // preview
    '.off-preview{padding:14px;border-radius:var(--radius);border:1px solid var(--border);background:radial-gradient(circle at 1px 1px,var(--border) 1px,transparent 0) 0 0/16px 16px,var(--surface-2)}',
    '.off-preview-h{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap}',
    '.off-preview-h h3{margin:0;font-size:.95rem;flex:1}',
    '.off-pwrap{overflow:hidden;margin:0 auto}',
    '.off-scale{transform-origin:top left}',
    '.off-sheet{position:relative;background:#fff;color:#1f2937;box-shadow:0 18px 50px -20px rgba(0,0,0,.45),0 0 0 1px rgba(0,0,0,.05);box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;overflow-wrap:break-word}',
    '.off-sheet *{box-sizing:border-box}',
    '.off-sheet+.off-sheet{margin-top:24px}',
    '.off-pb{position:absolute;left:0;right:0;border-top:1.5px dashed #64748b;pointer-events:none}',
    '.off-pb span{position:absolute;right:8px;top:-10px;font:600 10px/1 system-ui,sans-serif;color:#64748b;background:#fff;padding:2px 6px;border-radius:99px;border:1px solid #cbd5e1}',
    // ATS / checklist
    '.off-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}',
    '.off-list li{display:flex;gap:10px;align-items:flex-start;font-size:.9rem;color:var(--text-2)}',
    '.off-list li .i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;flex:none}',
    '.off-list li .i .icon{width:13px;height:13px}',
    '.off-list li.ok .i{background:var(--ok-soft);color:var(--ok)}',
    '.off-list li.warn .i{background:var(--warn-soft);color:var(--warn)}',
    '.off-score{display:flex;align-items:center;gap:14px;margin-bottom:14px}',
    '.off-ring{--p:0;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--ok) calc(var(--p)*1%),var(--surface-2) 0);flex:none}',
    '.off-ring b{width:46px;height:46px;border-radius:50%;background:var(--surface);display:grid;place-items:center;font-size:.95rem}',
    '.off-kv{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;font-size:.88rem}',
    '.off-kv dt{color:var(--text-3)}.off-kv dd{margin:0;font-weight:600;text-align:right;font-variant-numeric:tabular-nums}',
    '.off-total{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:12px 14px;border-radius:var(--radius-sm);background:linear-gradient(135deg,var(--brand-soft),var(--surface-2));border:1px solid var(--border);margin-top:12px}',
    '.off-total b{font-size:1.3rem;font-variant-numeric:tabular-nums}',
    '.off-msgs{max-height:180px;overflow:auto;margin:0;padding-left:18px;font-size:.85rem;color:var(--text-2)}',
    '.off-file{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);flex-wrap:wrap}',
    '.off-file .fi{width:42px;height:42px;border-radius:11px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#0e7490,#155e75);flex:none}',
    '.off-file .nm{flex:1;min-width:140px}.off-file .nm b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',

    // ---------------------------------------------------------- resume sheet
    '.off-rs-sheet{--acc:#0e7490;--ff:Inter,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;width:794px;min-height:1123px;padding:48px 54px;font-family:var(--ff);font-size:13px;line-height:1.45;color:#1f2937}',
    '.off-rs-sheet.off-letter{width:816px;min-height:1056px}',
    '.off-rs-sheet h1{font-size:30px;line-height:1.1;margin:0;color:#0f172a;letter-spacing:-.015em;font-weight:750}',
    '.off-rs-sheet a{color:inherit;text-decoration:none}',
    '.off-rs-sheet .r-title{font-size:14.5px;font-weight:600;color:var(--acc);margin-top:4px}',
    '.off-rs-sheet .r-contact{display:flex;flex-wrap:wrap;gap:3px 14px;font-size:12px;color:#4b5563;margin-top:9px}',
    '.off-rs-sheet .r-contact span{white-space:nowrap}',
    '.off-rs-sheet .r-sec{margin-top:18px}',
    '.off-rs-sheet .r-sec:first-child{margin-top:0}',
    '.off-rs-sheet .r-sec>h2{font-size:11.5px;text-transform:uppercase;letter-spacing:.13em;color:var(--acc);margin:0 0 9px;padding-bottom:5px;border-bottom:1.5px solid color-mix(in srgb,var(--acc) 30%,#fff);font-weight:750;break-after:avoid;page-break-after:avoid}',
    '.off-rs-sheet .r-it{break-inside:avoid;page-break-inside:avoid;margin-bottom:11px}',
    '.off-rs-sheet .r-it:last-child{margin-bottom:0}',
    '.off-rs-sheet .r-row{display:flex;justify-content:space-between;gap:12px;align-items:baseline}',
    '.off-rs-sheet .r-role{font-weight:700;color:#111827;font-size:13.5px}',
    '.off-rs-sheet .r-org{color:#374151;font-weight:550}',
    '.off-rs-sheet .r-date{font-size:11.5px;color:#4b5563;white-space:nowrap;font-variant-numeric:tabular-nums}',
    '.off-rs-sheet ul{margin:5px 0 0;padding-left:17px}',
    '.off-rs-sheet li{margin:2px 0;padding-left:2px}',
    '.off-rs-sheet li::marker{color:var(--acc)}',
    '.off-rs-sheet p{margin:0}',
    '.off-rs-sheet .r-sum{color:#374151}',
    '.off-rs-sheet .r-chips{display:flex;flex-wrap:wrap;gap:6px}',
    '.off-rs-sheet .r-chip{padding:3px 10px;border-radius:99px;background:color-mix(in srgb,var(--acc) 9%,#fff);border:1px solid color-mix(in srgb,var(--acc) 22%,#fff);font-size:12px;color:#1f2937;break-inside:avoid}',
    '.off-rs-sheet .r-sk{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px;break-inside:avoid}',
    '.off-rs-sheet .r-dots{display:inline-flex;gap:3px;flex:none}',
    '.off-rs-sheet .r-dots i{width:7px;height:7px;border-radius:50%;background:#e5e7eb}',
    '.off-rs-sheet .r-dots i.on{background:var(--acc)}',
    '.off-rs-sheet .r-photo{width:92px;height:92px;border-radius:50%;object-fit:cover;flex:none}',
    '.off-rs-sheet .r-small{font-size:12px;color:#4b5563}',
    '.off-rs-sheet .r-empty{color:#9ca3af;font-style:italic}',
    // modern
    '.off-rs-sheet.t-modern .r-head{display:flex;gap:20px;align-items:center;padding-bottom:18px;border-bottom:3px solid var(--acc)}',
    '.off-rs-sheet.t-modern .r-body{display:grid;grid-template-columns:31% minmax(0,1fr);gap:24px;margin-top:20px}',
    '.off-rs-sheet.t-modern .r-side{background:color-mix(in srgb,var(--acc) 6%,#fff);border-radius:10px;padding:16px 15px;align-self:start}',
    '.off-rs-sheet.t-modern .r-side .r-contact{flex-direction:column;gap:5px;margin:0}',
    '.off-rs-sheet.t-modern .r-side .r-contact span{white-space:normal;word-break:break-word}',
    '.off-rs-sheet.t-modern .r-side .r-sec>h2{border-bottom-color:color-mix(in srgb,var(--acc) 25%,#fff)}',
    // classic
    '.off-rs-sheet.t-classic{--ff:Georgia,"Times New Roman",Times,serif}',
    '.off-rs-sheet.t-classic .r-head{text-align:center;padding-bottom:14px;border-bottom:1px solid #111827}',
    '.off-rs-sheet.t-classic h1{font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:27px}',
    '.off-rs-sheet.t-classic .r-title{color:#374151;font-style:italic;font-weight:400}',
    '.off-rs-sheet.t-classic .r-contact{justify-content:center}',
    '.off-rs-sheet.t-classic .r-head .r-photo{display:block;margin:0 auto 10px;width:84px;height:84px}',
    '.off-rs-sheet.t-classic .r-body{margin-top:16px}',
    '.off-rs-sheet.t-classic .r-sec>h2{color:var(--acc);letter-spacing:.16em;font-size:12px;border-bottom:1px solid #9ca3af}',
    '.off-rs-sheet.t-classic .r-chip{border-radius:3px;background:none;border-color:#d1d5db}',
    // minimal
    '.off-rs-sheet.t-minimal .r-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;padding-bottom:20px}',
    '.off-rs-sheet.t-minimal h1{font-weight:300;font-size:34px;letter-spacing:-.02em}',
    '.off-rs-sheet.t-minimal .r-title{color:#4b5563;font-weight:500}',
    '.off-rs-sheet.t-minimal .r-head .r-contact{flex-direction:column;align-items:flex-end;gap:2px;margin:0;text-align:right}',
    '.off-rs-sheet.t-minimal .r-sec{display:grid;grid-template-columns:120px minmax(0,1fr);gap:16px;margin-top:0;padding:14px 0;border-top:1px solid #e5e7eb}',
    '.off-rs-sheet.t-minimal .r-sec>h2{border:0;padding:2px 0 0;color:#4b5563;letter-spacing:.12em;font-size:10.5px}',
    '.off-rs-sheet.t-minimal .r-chip{background:#f3f4f6;border-color:#f3f4f6}',
    '.off-rs-sheet.t-minimal .r-role{color:var(--acc)}',
    // creative
    '.off-rs-sheet.t-creative .r-head{display:flex;gap:20px;align-items:center;padding:24px 26px;border-radius:16px;background:linear-gradient(135deg,var(--acc),color-mix(in srgb,var(--acc) 70%,#000));color:var(--ink,#fff)}',
    '.off-rs-sheet.t-creative .r-head h1,.off-rs-sheet.t-creative .r-head .r-title,.off-rs-sheet.t-creative .r-head .r-contact{color:inherit}',
    '.off-rs-sheet.t-creative .r-head .r-title{opacity:.9}',
    '.off-rs-sheet.t-creative .r-head .r-contact{opacity:.92}',
    '.off-rs-sheet.t-creative .r-head .r-photo{border:3px solid rgba(255,255,255,.75)}',
    '.off-rs-sheet.t-creative .r-body{margin-top:22px}',
    '.off-rs-sheet.t-creative .r-sec>h2{border:0;padding:0;display:flex;align-items:center;gap:9px;color:#111827;font-size:12.5px}',
    '.off-rs-sheet.t-creative .r-sec>h2::before{content:"";width:22px;height:5px;border-radius:3px;background:var(--acc);flex:none}',
    '.off-rs-sheet.t-creative .r-sec>h2::after{content:"";flex:1;height:1px;background:#e5e7eb}',
    '.off-rs-sheet.t-creative .r-exp .r-it{border-left:2px solid color-mix(in srgb,var(--acc) 35%,#fff);padding-left:13px;position:relative}',
    '.off-rs-sheet.t-creative .r-exp .r-it::before{content:"";position:absolute;left:-6px;top:4px;width:10px;height:10px;border-radius:50%;background:#fff;border:2px solid var(--acc)}',
    '.off-rs-sheet.t-creative .r-chip{background:var(--acc);border-color:var(--acc);color:var(--ink,#fff)}',
    '.off-rs-sheet.t-creative .r-role{color:var(--acc)}',

    // ------------------------------------------------------- salary slip sheet
    '.off-ss-sheet{width:794px;min-height:1123px;padding:44px 48px;font:12.5px/1.45 Inter,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#1f2937;--acc:#0e7490}',
    '.off-ss-sheet .top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding-bottom:16px;border-bottom:3px solid var(--acc)}',
    '.off-ss-sheet .co{display:flex;gap:14px;align-items:center;max-width:62%}',
    '.off-ss-sheet .co img{max-width:110px;max-height:64px;object-fit:contain}',
    '.off-ss-sheet .co .cn{margin:0 0 3px;font-size:19px;font-weight:700;color:#0f172a;letter-spacing:-.01em}',
    '.off-ss-sheet .pre{white-space:pre-line}.off-ss-sheet .mut{color:#4b5563}',
    '.off-ss-sheet .ttl{text-align:right}.off-ss-sheet .ttl .pt{margin:0;font-size:21px;letter-spacing:.06em;color:var(--acc);font-weight:800}',
    '.off-ss-sheet .ttl div{margin-top:4px;font-weight:600}',
    '.off-ss-sheet .emp{display:grid;grid-template-columns:1fr 1fr;gap:0 26px;margin:18px 0 0;padding:14px 16px;border:1px solid #e5e7eb;border-radius:8px;background:#fafafa}',
    '.off-ss-sheet .emp div{display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-bottom:1px dashed #e5e7eb}',
    '.off-ss-sheet .emp div span:first-child{color:#4b5563}.off-ss-sheet .emp div span:last-child{font-weight:600;text-align:right}',
    '.off-ss-sheet .att{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}',
    '.off-ss-sheet .att div{border:1px solid #e5e7eb;border-radius:8px;padding:8px 12px}',
    '.off-ss-sheet .att b{display:block;font-size:15px;color:#0f172a}.off-ss-sheet .att span{font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:#4b5563}',
    '.off-ss-sheet .ed{display:grid;grid-template-columns:1fr 1fr;border:1px solid #d1d5db;border-radius:8px;overflow:hidden}',
    '.off-ss-sheet .ed>div+div{border-left:1px solid #d1d5db}',
    '.off-ss-sheet table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}',
    '.off-ss-sheet th{background:var(--acc);color:#fff;text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;padding:8px 12px}',
    '.off-ss-sheet td{padding:7px 12px;border-bottom:1px solid #f0f0f0}',
    '.off-ss-sheet .r{text-align:right}',
    '.off-ss-sheet tr.tot td{font-weight:750;border-top:1.5px solid #d1d5db;border-bottom:0;background:#f8fafc}',
    '.off-ss-sheet .net{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:16px;padding:14px 18px;border-radius:8px;background:color-mix(in srgb,var(--acc) 9%,#fff);border:1px solid color-mix(in srgb,var(--acc) 30%,#fff)}',
    '.off-ss-sheet .net b{font-size:22px;color:#0f172a;white-space:nowrap}',
    '.off-ss-sheet .net .w{font-weight:600;color:#374151}',
    '.off-ss-sheet h4,.off-ss-sheet .er-h{font-weight:700;margin:18px 0 6px;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:#4b5563}',
    '.off-ss-sheet .er{border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}',
    '.off-ss-sheet .er th{background:#f3f4f6;color:#374151}',
    '.off-ss-sheet .foot{margin-top:28px;padding-top:10px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#4b5563}',
    '.off-ss-sheet .sig{display:flex;justify-content:space-between;margin-top:46px;font-size:11.5px;color:#4b5563}',
    '.off-ss-sheet .sig span{border-top:1px solid #9ca3af;padding-top:4px;min-width:180px;text-align:center}',

    // ------------------------------------------------------ rent receipt pages
    '.off-rr-page{width:794px;height:1123px;padding:38px 44px;display:flex;flex-direction:column;gap:0}',
    '.off-rr-rc{flex:1;display:flex;flex-direction:column;border:1.5px solid #cbd5e1;border-radius:10px;padding:26px 30px;font:13px/1.55 Inter,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#1f2937;position:relative;overflow:hidden;--acc:#0e7490}',
    '.off-rr-rc::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--acc)}',
    '.off-rr-cut{height:44px;display:flex;align-items:center;gap:8px;color:#64748b;font:600 10px/1 system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase}',
    '.off-rr-cut::before,.off-rr-cut::after{content:"";flex:1;border-top:1.5px dashed #cbd5e1}',
    '.off-rr-rc .hd{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding-bottom:12px;border-bottom:1px solid #e5e7eb}',
    '.off-rr-rc .rt{margin:0;font-size:20px;letter-spacing:.14em;color:var(--acc);font-weight:800}',
    '.off-rr-rc .no{text-align:right;font-size:12px;color:#4b5563}.off-rr-rc .no b{color:#111827;font-size:13px}',
    '.off-rr-rc .bd{margin:16px 0 0;font-size:14px;line-height:1.85}',
    '.off-rr-rc .bd b{color:#0f172a}',
    '.off-rr-rc .amt{display:inline-block;padding:1px 10px;border-radius:6px;background:color-mix(in srgb,var(--acc) 10%,#fff);border:1px solid color-mix(in srgb,var(--acc) 25%,#fff);font-weight:800;color:#0f172a}',
    '.off-rr-rc .ft{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:20px;padding-top:14px}',
    '.off-rr-rc .ll{font-size:12.5px;color:#374151}.off-rr-rc .ll b{color:#111827}',
    '.off-rr-rc .sg{display:flex;align-items:flex-end;gap:16px}',
    '.off-rr-rc .stamp{width:76px;height:84px;border:1.5px dashed #64748b;border-radius:6px;display:grid;place-items:center;text-align:center;font-size:9.5px;color:#64748b;line-height:1.3;text-transform:uppercase;letter-spacing:.06em}',
    '.off-rr-rc .sl{min-width:170px;border-top:1px solid #4b5563;padding-top:5px;text-align:center;font-size:11.5px;color:#4b5563}',

    // --------------------------------------------------------- excel viewer
    '.off-xc-tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;margin-bottom:12px}',
    '.off-xc-tabs button{flex:none;font:inherit;font-size:.86rem;font-weight:600;padding:7px 14px;border-radius:9px;border:1px solid var(--border);background:var(--surface);color:var(--text-2);cursor:pointer;display:inline-flex;gap:6px;align-items:center}',
    '.off-xc-tabs button[aria-selected="true"]{background:var(--text);color:var(--bg);border-color:var(--text)}',
    '.off-xc-tabs button .c{font-size:.72rem;opacity:.7}',
    '.off-xc-grid{max-height:min(560px,64vh);overflow:auto;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);position:relative;overscroll-behavior:contain}',
    '.off-xc-grid table{min-width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed;font-size:.86rem;font-variant-numeric:tabular-nums}',
    '.off-xc-grid th,.off-xc-grid td{height:34px;padding:0 10px;border-right:1px solid var(--border);border-bottom:1px solid var(--border);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left}',
    '.off-xc-grid thead th{position:sticky;top:0;z-index:2;background:var(--surface-2);font-weight:650;color:var(--text);cursor:pointer;user-select:none}',
    '.off-xc-grid thead th:hover{background:var(--bg-2)}',
    '.off-xc-grid thead th .s{margin-left:4px;color:var(--brand)}',
    '.off-xc-grid th.rn,.off-xc-grid td.rn{position:sticky;left:0;z-index:1;background:var(--surface-2);color:var(--text-3);text-align:right;font-size:.75rem;width:64px;cursor:default}',
    '.off-xc-grid thead th.rn{z-index:3}',
    '.off-xc-grid td.n{text-align:right}',
    '.off-xc-grid td.e{color:var(--text-3)}',
    '.off-xc-grid tbody tr:hover td{background:var(--brand-soft)}',
    '.off-xc-grid tr.sp td{padding:0;border:0;height:auto}',
    '.off-xc-grid mark{background:color-mix(in srgb,var(--warn) 30%,transparent);color:inherit;border-radius:2px}',
    '.off-xc-empty{padding:40px;text-align:center;color:var(--text-3)}',
    '.off-xc-tools{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px}',
    '.off-xc-tools .grow{flex:1;min-width:200px;position:relative}',
    '.off-xc-tools .grow .icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-3)}',
    '.off-xc-tools .grow input{padding-left:36px}',
    '.off-xc-exp{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(190px,1fr))}',
    '.off-xc-exp .opt{border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;background:var(--surface-2);display:flex;flex-direction:column;gap:8px}',
    '.off-xc-exp .opt b{display:flex;align-items:center;gap:8px;font-size:.92rem}',
    '.off-xc-exp .opt select{min-height:36px;padding:6px 10px;font-size:.88rem}',

    // ----------------------------------------------------------- word preview
    '.off-wd-doc{--wf:Calibri,Carlito,"Segoe UI","Helvetica Neue",Arial,sans-serif;width:794px;min-height:1123px;padding:96px;font-family:var(--wf);font-size:14.67px;line-height:1.5;color:#111}',
    '.off-wd-doc.off-letter{width:816px;min-height:1056px}',
    '.off-wd-doc.m-moderate{padding:72px}.off-wd-doc.m-narrow{padding:48px}',
    '.off-wd-doc h1{font-size:2em;margin:.6em 0 .35em;color:#1f3864;font-weight:600;line-height:1.2;break-after:avoid}',
    '.off-wd-doc h2{font-size:1.5em;margin:.8em 0 .3em;color:#2f5496;font-weight:600;line-height:1.25;break-after:avoid}',
    '.off-wd-doc h3{font-size:1.2em;margin:.8em 0 .3em;color:#1f3763;font-weight:600;break-after:avoid}',
    '.off-wd-doc h4,.off-wd-doc h5,.off-wd-doc h6{font-size:1em;margin:.8em 0 .3em;color:#2f5496;break-after:avoid}',
    '.off-wd-doc>*:first-child{margin-top:0}',
    '.off-wd-doc p{margin:0 0 .6em;orphans:3;widows:3}',
    '.off-wd-doc ul,.off-wd-doc ol{margin:0 0 .7em;padding-left:1.6em}',
    '.off-wd-doc li{margin:.15em 0}',
    '.off-wd-doc table{border-collapse:collapse;width:100%;margin:.4em 0 1em;font-size:.95em}',
    '.off-wd-doc td,.off-wd-doc th{border:1px solid #9ca3af;padding:5px 8px;vertical-align:top;text-align:left}',
    '.off-wd-doc th{background:#f3f4f6}',
    '.off-wd-doc tr{break-inside:avoid}',
    '.off-wd-doc td p,.off-wd-doc th p{margin:0}',
    '.off-wd-doc img{max-width:100%;height:auto}',
    '.off-wd-doc a{color:#0563c1;text-decoration:underline}',
    '.off-wd-doc blockquote{margin:0 0 .7em;padding-left:1em;border-left:3px solid #d1d5db;color:#374151}',
    '.off-wd-doc sup,.off-wd-doc sub{line-height:0}',
    '.off-wd-doc.f-serif{--wf:Cambria,Caladea,Georgia,"Times New Roman",serif}',
    '.off-wd-doc.f-times{--wf:"Times New Roman",Times,"Liberation Serif",serif}',
    '.off-wd-doc.f-arial{--wf:Arial,"Helvetica Neue",Helvetica,"Liberation Sans",sans-serif}',

    // ------------------------------------------------------------------ print
    '@media print{',
    '  body{background:#fff!important}',
    '  .off-wrap .no-print,.ad-slot{display:none!important}',
    '  .off-wrap{container-type:normal}',
    '  .off-cols{display:block!important}',
    '  .off-preview{border:0!important;padding:0!important;background:none!important;box-shadow:none!important;max-height:none!important;overflow:visible!important}',
    '  .off-sticky{position:static!important}',
    '  .off-pwrap{overflow:visible!important;height:auto!important;width:auto!important}',
    '  .off-scale{transform:none!important;width:auto!important}',
    '  .off-sheet{box-shadow:none!important;margin:0!important}',
    '  .off-pb{display:none!important}',
    '  .off-rs-sheet{width:auto!important;min-height:0!important;padding:0 54px!important;page:off-a4}',
    '  .off-rs-sheet.off-letter{page:off-letter;padding:0 60px!important}',
    '  .off-ss-sheet{width:auto!important;min-height:0!important;padding:0!important;page:off-a4p;break-after:page}',
    '  .off-ss-sheet:last-child{break-after:auto}',
    '  .off-rr-page{width:auto!important;height:276mm!important;padding:0!important;page:off-a4p;break-after:page;break-inside:avoid}',
    '  .off-rr-page:last-child{break-after:auto}',
    '  .off-wd-doc{width:auto!important;min-height:0!important;padding:0!important}',
    '  .off-wd-doc.off-a4.m-normal{page:off-wd-a4-normal}.off-wd-doc.off-a4.m-moderate{page:off-wd-a4-moderate}.off-wd-doc.off-a4.m-narrow{page:off-wd-a4-narrow}',
    '  .off-wd-doc.off-letter.m-normal{page:off-wd-letter-normal}.off-wd-doc.off-letter.m-moderate{page:off-wd-letter-moderate}.off-wd-doc.off-letter.m-narrow{page:off-wd-letter-narrow}',
    '  .off-sheet+.off-sheet{margin-top:0!important}',
    '}'
  ].join('\n');

  function injectCSS() {
    if (doc.getElementById('off-style')) return;
    var s = doc.createElement('style');
    s.id = 'off-style';
    s.textContent = PAGE_CSS + '\n' + CSS;
    doc.head.appendChild(s);
  }

  // ============================================================ Helpers
  var uid = 0;
  function nid(p) { uid++; return 'off-' + (p || 'f') + uid; }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function money(n) { return (n < 0 ? '-' : '') + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function money0(n) { return (n < 0 ? '-' : '') + Math.abs(Math.round(n)).toLocaleString('en-IN'); }
  function rid() { return 'x' + Date.now().toString(36) + Math.floor(Math.random() * 1e8).toString(36); }
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function daysIn(y, m) { return new Date(y, m, 0).getDate(); } // m: 1..12

  function field(label, control, hint, cls) {
    if (!control.id) control.id = nid();
    return h('div.field' + (cls ? '.' + cls : ''), null, [h('label', { 'for': control.id, text: label }), control, hint ? h('span.hint', { html: hint }) : null]);
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
  function select(options, value, attrs) {
    var el = h('select', Object.assign({ id: nid() }, attrs || {}));
    options.forEach(function (o) {
      if (typeof o === 'string') o = [o, o];
      el.appendChild(h('option', { value: o[0], text: o[1] }));
    });
    if (value != null) el.value = value;
    return el;
  }
  function checkbox(label, checked, attrs) {
    var el = h('input', Object.assign({ type: 'checkbox', id: nid() }, attrs || {}));
    el.checked = !!checked;
    var lab = h('label.check', { 'for': el.id }, [el, h('span', { text: label })]);
    lab.input = el;
    return lab;
  }
  function btn(cls, iconName, text, onClick, attrs) {
    var b = h('button.btn' + (cls ? '.' + cls.split(' ').join('.') : ''), Object.assign({ type: 'button', html: (iconName ? BT.icon(iconName) : '') + (text ? '<span>' + esc(text) + '</span>' : '') }, attrs || {}));
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }
  function ib(iconName, label, onClick, cls) {
    var b = h('button.off-ib' + (cls ? '.' + cls : ''), { type: 'button', 'aria-label': label, title: label, html: BT.icon(iconName) });
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }
  function card(title, children, extra) {
    return h('div.card', null, [title ? h('div.card-title', null, [h('h3', { text: title }), extra || null]) : null].concat(children || []));
  }
  function seg(items, value, onChange, label) {
    var el = h('div.seg', { role: 'group', 'aria-label': label || 'Options' });
    items.forEach(function (it) {
      var b = h('button', { type: 'button', text: it[1], 'data-v': it[0] });
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
  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val);
      return true;
    } catch (e) { return null; }
  }
  function loadJSON(key) { try { return JSON.parse(store(key) || 'null'); } catch (e) { return null; } }
  function monthOptions() { return MONTHS.map(function (m, i) { return [String(i + 1), m]; }); }
  function slug(s) { return String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'document'; }

  /** Read an image file and return a downscaled data URL (optionally square-cropped). */
  function imageToDataURL(file, max, square, type) {
    return BT.loadImage(file).then(function (img) {
      var w = img.naturalWidth, hh = img.naturalHeight, sx = 0, sy = 0, sw = w, sh = hh;
      if (square) { var m = Math.min(w, hh); sx = (w - m) / 2; sy = (hh - m) / 2; sw = sh = m; }
      var s = Math.min(1, max / Math.max(sw, sh));
      var c = doc.createElement('canvas');
      c.width = Math.max(1, Math.round(sw * s)); c.height = Math.max(1, Math.round(sh * s));
      var g = c.getContext('2d');
      if (type === 'image/jpeg') { g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); }
      g.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
      try { URL.revokeObjectURL(img.src); } catch (e) { /* ignore */ }
      return c.toDataURL(type || 'image/png', 0.88);
    });
  }
  function dataURLBytes(u) {
    var b64 = String(u).split(',')[1] || '';
    var bin = atob(b64), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  // ---- Indian-system amount in words
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

  /**
   * Fit a fixed-width paper element into its wrapper by CSS scaling.
   * Returns a function to call after the content changes.
   */
  function scaler(wrap, host, paperWidth) {
    function fit() {
      var pw = typeof paperWidth === 'function' ? paperWidth() : paperWidth;
      var par = wrap.parentNode, w = pw;
      if (par) { var cs = getComputedStyle(par); w = par.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0); }
      var sc = Math.min(1, (w || pw) / pw);
      host.style.width = pw + 'px';
      host.style.transform = sc < 1 ? 'scale(' + sc + ')' : '';
      wrap.style.width = Math.floor(pw * sc) + 'px';
      wrap.style.height = Math.ceil(host.offsetHeight * sc) + 'px';
    }
    if (window.ResizeObserver) new ResizeObserver(function () { fit(); }).observe(wrap.parentNode || wrap);
    else window.addEventListener('resize', fit);
    return fit;
  }

  /** Height of the real content inside a paper sheet (ignores min-height), minus its top padding. */
  function contentHeight(sheet, padTop) {
    var m = 0;
    Array.prototype.forEach.call(sheet.children, function (c) {
      if (c.classList.contains('off-pb')) return;
      var mb = parseFloat(getComputedStyle(c).marginBottom) || 0;
      m = Math.max(m, c.offsetTop + c.offsetHeight + mb);
    });
    return Math.max(0, m - padTop);
  }

  /** Keep the sticky preview below the sticky toolbar, whatever its height. */
  function watchBar(wrap, bar) {
    function upd() { wrap.style.setProperty('--off-top', (72 + bar.offsetHeight + 12) + 'px'); }
    if (window.ResizeObserver) new ResizeObserver(upd).observe(bar);
    upd();
  }

  /** Print the page with a nicer document title (used as the default PDF file name). */
  function printDoc(title) {
    var old = doc.title;
    doc.title = title || old;
    var restore = function () { doc.title = old; window.removeEventListener('afterprint', restore); };
    window.addEventListener('afterprint', restore);
    setTimeout(function () { window.print(); setTimeout(restore, 1500); }, 40);
  }

  /** Read a file picked by a hidden input. */
  function pickFile(accept, cb) {
    var inp = h('input', { type: 'file', accept: accept, style: { display: 'none' } });
    doc.body.appendChild(inp);
    inp.addEventListener('change', function () { var f = inp.files && inp.files[0]; inp.remove(); if (f) cb(f); });
    inp.click();
  }

  function sanitizeWinAnsi(s) {
    return String(s == null ? '' : s)
      .replace(/₹/g, 'Rs.').replace(/[‘’‚′]/g, "'").replace(/[“”„″]/g, '"')
      .replace(/[–—]/g, '-').replace(/…/g, '...').replace(/[•·]/g, '-').replace(/ /g, ' ')
      .replace(/[\t\r]/g, ' ')
      .replace(/[^\n\x20-\x7e¡-ÿ]/g, '?');
  }

  // ===================================================== RESUME BUILDER
  var RS_SECS = {
    summary: { label: 'Summary', icon: 'text' },
    experience: { label: 'Experience', icon: 'briefcase' },
    education: { label: 'Education', icon: 'book-open-text' },
    skills: { label: 'Skills', icon: 'sparkles' },
    projects: { label: 'Projects', icon: 'layers' },
    certifications: { label: 'Certifications', icon: 'badge-check' },
    languages: { label: 'Languages', icon: 'globe' },
    custom: { label: 'Custom section', icon: 'plus' }
  };
  var RS_ORDER = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'custom'];
  var RS_SIDE = { skills: 1, languages: 1, certifications: 1 };
  var RS_FIELDS = {
    experience: [['role', 'Job title'], ['company', 'Company'], ['location', 'Location'], ['start', 'Start', 'Jan 2022'], ['end', 'End', 'Present'], ['bullets', 'Achievements (one per line)', 'ta']],
    education: [['degree', 'Degree / course'], ['school', 'Institution'], ['location', 'Location'], ['start', 'Start', '2016'], ['end', 'End', '2020'], ['details', 'Details: grade, honours (one per line)', 'ta']],
    projects: [['name', 'Project name'], ['link', 'Link (optional)', 'github.com/you/project'], ['dates', 'Dates', '2024', 'full'], ['desc', 'Description (one point per line)', 'ta']],
    certifications: [['name', 'Certification'], ['issuer', 'Issued by'], ['date', 'Year / date', '2024', 'full']],
    custom: [['title', 'Title'], ['subtitle', 'Organisation / subtitle'], ['date', 'Date', '', 'full'], ['desc', 'Details (one per line)', 'ta']]
  };
  var RS_ITEM_NAME = { experience: 'role', education: 'degree', projects: 'name', certifications: 'name', custom: 'title' };
  var LANG_LEVELS = ['', 'Native', 'Fluent', 'Professional', 'Intermediate', 'Basic'];
  var SKILL_LEVELS = [['', 'No level'], ['5', 'Expert'], ['4', 'Advanced'], ['3', 'Intermediate'], ['2', 'Elementary'], ['1', 'Beginner']];
  var RS_TEMPLATES = [
    ['modern', 'Modern', [[6, 6, 30, 5, 1], [6, 16, 88, 1.5, 1], [6, 22, 26, 36, 0.35], [36, 22, 58, 4], [36, 30, 50, 3], [36, 37, 56, 3]]],
    ['classic', 'Classic', [[30, 6, 40, 5, 1], [20, 14, 60, 2], [8, 22, 84, 1], [8, 28, 70, 3], [8, 35, 80, 3], [8, 42, 64, 3]]],
    ['minimal', 'Minimal', [[6, 6, 40, 6], [6, 20, 16, 2], [28, 20, 64, 3], [6, 30, 16, 2], [28, 30, 58, 3], [28, 37, 50, 3]]],
    ['creative', 'Creative', [[4, 4, 92, 18, 1], [8, 26, 30, 3, 1], [8, 33, 80, 3], [8, 40, 70, 3], [8, 47, 60, 3]]]
  ];
  var RS_FONTS = [
    ['auto', 'Template default'],
    ['inter', 'Inter / system sans'],
    ['helvetica', 'Helvetica / Arial'],
    ['calibri', 'Calibri style'],
    ['georgia', 'Georgia serif'],
    ['garamond', 'Garamond / Palatino'],
    ['verdana', 'Verdana (wide)']
  ];
  var RS_FONT_STACK = {
    inter: 'Inter,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
    helvetica: '"Helvetica Neue",Helvetica,Arial,"Liberation Sans",sans-serif',
    calibri: 'Calibri,Carlito,"Segoe UI","Helvetica Neue",Arial,sans-serif',
    georgia: 'Georgia,"Times New Roman",Times,serif',
    garamond: '"EB Garamond",Garamond,"Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif',
    verdana: 'Verdana,Geneva,"DejaVu Sans",sans-serif'
  };
  var RS_DOCX_FONT = { inter: 'Calibri', helvetica: 'Arial', calibri: 'Calibri', georgia: 'Georgia', garamond: 'Garamond', verdana: 'Verdana' };
  var ACCENTS = ['#0e7490', '#1d4ed8', '#4f46e5', '#7c3aed', '#be185d', '#dc2626', '#c2410c', '#15803d', '#0f172a'];

  function rsBlank() {
    return {
      v: 1, template: 'modern', accent: '#0e7490', font: 'auto', paper: 'a4', showLevels: false,
      personal: { name: '', title: '', phone: '', email: '', location: '', links: '', photo: null },
      summary: '', order: RS_ORDER.slice(), titles: {}, collapsed: {},
      experience: [], education: [], skills: [], projects: [], certifications: [], languages: [],
      custom: { title: 'Achievements', items: [] }
    };
  }
  function rsItem(sec, data) { var o = { id: rid() }; (RS_FIELDS[sec] || [['name'], ['level']]).forEach(function (f) { o[f[0]] = ''; }); return Object.assign(o, data || {}); }
  function rsSample() {
    var d = rsBlank();
    d.personal = { name: 'Ananya Sen', title: 'Senior Product Designer', phone: '+91 98300 12345', email: 'ananya.sen@example.com', location: 'Kolkata, West Bengal', links: 'linkedin.com/in/ananyasen\nananyasen.design', photo: null };
    d.summary = 'Product designer with 7+ years of experience shaping fintech and e-commerce products used by millions. I turn messy problems into simple, accessible interfaces, and work closely with engineering to ship fast and measure impact.';
    d.experience = [
      rsItem('experience', { role: 'Senior Product Designer', company: 'Finserve Technologies', location: 'Bengaluru (Remote)', start: 'Apr 2022', end: 'Present', bullets: 'Led the redesign of the UPI payments flow, cutting failed payments by 23% and support tickets by 31%.\nBuilt and documented a design system of 120+ components adopted by 6 product teams.\nMentored 4 junior designers and ran weekly design critiques.' }),
      rsItem('experience', { role: 'Product Designer', company: 'ShopKart India', location: 'Kolkata', start: 'Jul 2019', end: 'Mar 2022', bullets: 'Designed the seller onboarding app, raising completed sign-ups from 41% to 68%.\nRan 30+ usability studies across Tier 2 and Tier 3 cities to localise the checkout for 9 languages.' }),
      rsItem('experience', { role: 'UI Designer', company: 'Pixel Studio', location: 'Kolkata', start: 'Jun 2017', end: 'Jun 2019', bullets: 'Delivered web and mobile UI for 25+ client projects in retail, education and healthcare.' })
    ];
    d.education = [rsItem('education', { degree: 'B.Des. in Communication Design', school: 'National Institute of Design', location: 'Ahmedabad', start: '2013', end: '2017', details: 'CGPA 8.6 / 10' })];
    d.skills = ['Figma', 'User research', 'Design systems', 'Prototyping', 'Accessibility (WCAG)', 'HTML & CSS', 'Usability testing', 'Data-informed design'].map(function (s, i) { return { id: rid(), name: s, level: String([5, 4, 5, 4, 4, 3, 4, 3][i]) }; });
    d.projects = [rsItem('projects', { name: 'Open-source icon set', link: 'github.com/ananyasen/icons', dates: '2023', desc: '400+ icons for Indic scripts, used by 1,200+ developers.' })];
    d.certifications = [rsItem('certifications', { name: 'Google UX Design Professional Certificate', issuer: 'Google', date: '2021' })];
    d.languages = [{ id: rid(), name: 'Bengali', level: 'Native' }, { id: rid(), name: 'English', level: 'Fluent' }, { id: rid(), name: 'Hindi', level: 'Professional' }];
    d.custom = { title: 'Awards', items: [rsItem('custom', { title: 'Best Fintech Experience', subtitle: 'India Design Awards', date: '2023', desc: '' })] };
    return d;
  }
  function rsNormalize(x) {
    var d = rsBlank();
    if (!x || typeof x !== 'object') return d;
    ['template', 'accent', 'font', 'paper', 'summary'].forEach(function (k) { if (typeof x[k] === 'string') d[k] = x[k]; });
    if (!/^#[0-9a-f]{6}$/i.test(d.accent)) d.accent = '#0e7490';
    if (!RS_TEMPLATES.some(function (t) { return t[0] === d.template; })) d.template = 'modern';
    if (d.paper !== 'letter') d.paper = 'a4';
    if (!RS_FONT_STACK[d.font]) d.font = 'auto';
    d.showLevels = !!x.showLevels;
    if (x.personal && typeof x.personal === 'object') Object.keys(d.personal).forEach(function (k) { if (x.personal[k] != null) d.personal[k] = k === 'photo' ? (/^data:image\//.test(x.personal.photo) ? x.personal.photo : null) : String(x.personal[k]); });
    if (x.titles && typeof x.titles === 'object') Object.keys(x.titles).forEach(function (k) { if (RS_SECS[k]) d.titles[k] = String(x.titles[k]); });
    if (x.collapsed && typeof x.collapsed === 'object') d.collapsed = x.collapsed;
    var order = Array.isArray(x.order) ? x.order.filter(function (k, i, a) { return RS_SECS[k] && a.indexOf(k) === i; }) : [];
    RS_ORDER.forEach(function (k) { if (order.indexOf(k) < 0) order.push(k); });
    d.order = order;
    function list(arr, sec) {
      return (Array.isArray(arr) ? arr : []).filter(function (o) { return o && typeof o === 'object'; }).map(function (o) {
        var it = rsItem(sec);
        Object.keys(it).forEach(function (k) { if (k !== 'id' && o[k] != null) it[k] = String(o[k]); });
        if (o.id) it.id = String(o.id);
        return it;
      });
    }
    ['experience', 'education', 'projects', 'certifications'].forEach(function (s) { d[s] = list(x[s], s); });
    d.skills = list(x.skills, 'skills');
    d.languages = list(x.languages, 'languages');
    if (x.custom && typeof x.custom === 'object') { d.custom.title = String(x.custom.title || 'Achievements'); d.custom.items = list(x.custom.items, 'custom'); }
    return d;
  }
  function lines(s) { return String(s || '').split(/\n+/).map(function (l) { return l.replace(/^\s*[-•*▪·]\s*/, '').trim(); }).filter(Boolean); }
  function secTitle(d, k) { return k === 'custom' ? (d.custom.title || 'Additional') : (d.titles[k] || RS_SECS[k].label); }
  function linkHref(t) {
    t = String(t || '').trim();
    if (/^mailto:/i.test(t) || /^https?:\/\//i.test(t)) return t;
    if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(t)) return 'mailto:' + t;
    if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t)) return 'https://' + t;
    return '';
  }
  function linkHtml(t) { var u = linkHref(t); return u ? '<a href="' + esc(u) + '">' + esc(t) + '</a>' : esc(t); }
  function hasContent(d, k) {
    if (k === 'summary') return !!d.summary.trim();
    if (k === 'custom') return d.custom.items.length > 0;
    return d[k].some(function (it) { return Object.keys(it).some(function (f) { return f !== 'id' && String(it[f]).trim(); }); });
  }

  function rsSectionHtml(d, k) {
    var e = esc, body = '';
    function dates(a, b) { return [a, b].filter(function (x) { return String(x || '').trim(); }).map(e).join(' – '); }
    function ul(t) { var l = lines(t); return l.length ? '<ul>' + l.map(function (x) { return '<li>' + e(x) + '</li>'; }).join('') + '</ul>' : ''; }
    if (k === 'summary') body = '<p class="r-sum">' + e(d.summary).replace(/\n/g, '<br>') + '</p>';
    else if (k === 'experience') body = d.experience.map(function (it) {
      var org = [it.company, it.location].filter(function (x) { return x.trim(); }).map(e).join(' · ');
      return '<div class="r-it"><div class="r-row"><span class="r-role">' + e(it.role || 'Job title') + '</span><span class="r-date">' + dates(it.start, it.end) + '</span></div>' +
        (org ? '<div class="r-org">' + org + '</div>' : '') + ul(it.bullets) + '</div>';
    }).join('');
    else if (k === 'education') body = d.education.map(function (it) {
      var org = [it.school, it.location].filter(function (x) { return x.trim(); }).map(e).join(' · ');
      return '<div class="r-it"><div class="r-row"><span class="r-role">' + e(it.degree || 'Degree') + '</span><span class="r-date">' + dates(it.start, it.end) + '</span></div>' +
        (org ? '<div class="r-org">' + org + '</div>' : '') + ul(it.details) + '</div>';
    }).join('');
    else if (k === 'skills') {
      var sk = d.skills.filter(function (s) { return s.name.trim(); });
      if (d.showLevels) body = sk.map(function (s) {
        var lv = parseInt(s.level, 10) || 0, dots = '';
        for (var i = 1; i <= 5; i++) dots += '<i' + (i <= lv ? ' class="on"' : '') + '></i>';
        return '<div class="r-sk"><span>' + e(s.name) + '</span>' + (lv ? '<span class="r-dots" aria-label="' + lv + ' of 5">' + dots + '</span>' : '') + '</div>';
      }).join('');
      else body = '<div class="r-chips">' + sk.map(function (s) { return '<span class="r-chip">' + e(s.name) + '</span>'; }).join('') + '</div>';
    } else if (k === 'projects') body = d.projects.map(function (it) {
      return '<div class="r-it"><div class="r-row"><span class="r-role">' + e(it.name || 'Project') + '</span><span class="r-date">' + e(it.dates) + '</span></div>' +
        (it.link.trim() ? '<div class="r-small">' + linkHtml(it.link.trim()) + '</div>' : '') + ul(it.desc) + '</div>';
    }).join('');
    else if (k === 'certifications') body = d.certifications.map(function (it) {
      return '<div class="r-it"><div class="r-row"><span class="r-role" style="font-size:13px">' + e(it.name || 'Certification') + '</span><span class="r-date">' + e(it.date) + '</span></div>' +
        (it.issuer.trim() ? '<div class="r-small">' + e(it.issuer) + '</div>' : '') + '</div>';
    }).join('');
    else if (k === 'languages') body = d.languages.filter(function (l) { return l.name.trim(); }).map(function (l) {
      return '<div class="r-sk"><span>' + e(l.name) + '</span><span class="r-small">' + e(l.level) + '</span></div>';
    }).join('');
    else if (k === 'custom') body = d.custom.items.map(function (it) {
      return '<div class="r-it"><div class="r-row"><span class="r-role">' + e(it.title || 'Title') + '</span><span class="r-date">' + e(it.date) + '</span></div>' +
        (it.subtitle.trim() ? '<div class="r-org">' + e(it.subtitle) + '</div>' : '') + ul(it.desc) + '</div>';
    }).join('');
    return '<section class="r-sec r-' + (k === 'experience' ? 'exp' : k) + '"><h2>' + e(secTitle(d, k)) + '</h2><div class="r-cnt">' + body + '</div></section>';
  }
  function inkFor(hex) {
    var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
    if (!m) return '#fff';
    var c = [m[1], m[2], m[3]].map(function (x) { x = parseInt(x, 16) / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    var L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    return L > 0.4 ? '#111827' : '#ffffff';
  }
  function rsHtml(d) {
    var p = d.personal, e = esc;
    var contacts = [p.phone, p.email, p.location].concat(lines(p.links)).filter(function (x) { return String(x || '').trim(); });
    var contactHtml = '<div class="r-contact">' + contacts.map(function (c) { return '<span>' + linkHtml(String(c).trim()) + '</span>'; }).join('') + '</div>';
    var photo = p.photo ? '<img class="r-photo" src="' + e(p.photo) + '" alt="">' : '';
    var nameBlock = '<div style="min-width:0;flex:1"><h1>' + e(p.name || 'Your Name') + '</h1>' + (p.title ? '<div class="r-title">' + e(p.title) + '</div>' : '');
    var secs = d.order.filter(function (k) { return hasContent(d, k); });
    var head, body;
    if (d.template === 'modern') {
      head = '<header class="r-head">' + photo + nameBlock + '</div></header>';
      var side = secs.filter(function (k) { return RS_SIDE[k]; }), main = secs.filter(function (k) { return !RS_SIDE[k]; });
      body = '<div class="r-body"><div class="r-side"><section class="r-sec"><h2>Contact</h2>' + contactHtml + '</section>' +
        side.map(function (k) { return rsSectionHtml(d, k); }).join('') + '</div><div class="r-main">' +
        (main.length ? main.map(function (k) { return rsSectionHtml(d, k); }).join('') : '<p class="r-empty">Add your experience, education and more on the left.</p>') + '</div></div>';
    } else {
      if (d.template === 'minimal') head = '<header class="r-head">' + (photo ? '<div style="display:flex;gap:16px;align-items:center">' + photo + nameBlock + '</div></div>' : nameBlock + '</div>') + contactHtml + '</header>';
      else if (d.template === 'classic') head = '<header class="r-head">' + photo + '<h1>' + e(p.name || 'Your Name') + '</h1>' + (p.title ? '<div class="r-title">' + e(p.title) + '</div>' : '') + contactHtml + '</header>';
      else head = '<header class="r-head">' + photo + nameBlock + contactHtml + '</div></header>';
      body = '<div class="r-body">' + (secs.length ? secs.map(function (k) { return rsSectionHtml(d, k); }).join('') : '<p class="r-empty" style="margin-top:20px">Your sections will appear here.</p>') + '</div>';
    }
    var ff = d.font !== 'auto' && RS_FONT_STACK[d.font] ? '--ff:' + RS_FONT_STACK[d.font] + ';' : '';
    return '<div class="off-sheet off-rs-sheet t-' + e(d.template) + ' off-' + (d.paper === 'letter' ? 'letter' : 'a4') + '" style="--acc:' + e(d.accent) + ';--ink:' + inkFor(d.accent) + ';' + ff.replace(/"/g, "'") + '">' + head + body + '</div>';
  }

  function rsAts(d) {
    var p = d.personal, out = [];
    function add(ok, text) { out.push({ ok: !!ok, text: text }); }
    var allBul = [];
    d.experience.forEach(function (it) { allBul = allBul.concat(lines(it.bullets)); });
    var words = d.summary.trim() ? d.summary.trim().split(/\s+/).length : 0;
    add(p.name.trim() && p.email.trim() && p.phone.trim(), 'Name, email and phone number are filled in');
    add(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.email.trim()), 'Email address looks valid and professional');
    add(p.title.trim(), 'A headline (target job title) under your name');
    add(words >= 25 && words <= 90, 'Summary is 25–90 words (now ' + words + ')');
    add(d.experience.length && d.experience.every(function (it) { return lines(it.bullets).length >= 2; }), 'Every job has at least 2 achievement bullets');
    add(allBul.length && allBul.filter(function (b) { return /\d/.test(b); }).length >= Math.ceil(allBul.length / 2), 'At least half your bullets include numbers (%, ₹, counts)');
    add(allBul.every(function (b) { return b.length <= 220; }), 'Bullets are short (under about 2 lines each)');
    add(d.skills.filter(function (s) { return s.name.trim(); }).length >= 6, 'Six or more skills that match the job description');
    add(d.experience.every(function (it) { return it.start.trim() && it.end.trim(); }), 'Start and end dates on every job');
    add(d.template === 'classic' || d.template === 'minimal', 'Single-column template (Classic or Minimal) for the safest ATS parsing');
    add(!p.photo, 'No photo (many ATS and overseas employers prefer none)');
    return out;
  }

  function rsDocx(d) {
    return BT.loadLib('docx').then(function (X) {
      var acc = d.accent.replace('#', '');
      var font = RS_DOCX_FONT[d.font] || (d.template === 'classic' ? 'Georgia' : 'Calibri');
      var paper = d.paper === 'letter' ? { width: 12240, height: 15840 } : { width: 11906, height: 16838 };
      var margin = 720, right = paper.width - margin * 2;
      var kids = [];
      var P = X.Paragraph, T = X.TextRun;
      var p = d.personal;
      if (p.photo) {
        try {
          kids.push(new P({ children: [new X.ImageRun({ type: 'jpg', data: dataURLBytes(p.photo), transformation: { width: 84, height: 84 } })] }));
        } catch (e) { /* photo optional */ }
      }
      kids.push(new P({ spacing: { after: 40 }, children: [new T({ text: p.name || 'Your Name', bold: true, size: 44, color: '111827' })] }));
      if (p.title) kids.push(new P({ spacing: { after: 60 }, children: [new T({ text: p.title, size: 26, color: acc })] }));
      var contacts = [p.phone, p.email, p.location].concat(lines(p.links)).filter(function (x) { return String(x || '').trim(); });
      if (contacts.length) kids.push(new P({ spacing: { after: 120 }, children: [new T({ text: contacts.join('  |  '), size: 19, color: '4B5563' })] }));
      function heading(t) {
        return new P({ spacing: { before: 240, after: 80 }, keepNext: true, border: { bottom: { color: acc, space: 2, style: X.BorderStyle.SINGLE, size: 8 } },
          children: [new T({ text: t.toUpperCase(), bold: true, size: 21, color: acc, characterSpacing: 30 })] });
      }
      function rowLine(left, sub, date) {
        var ch = [new T({ text: left, bold: true, size: 22 })];
        if (date) ch.push(new T({ text: '\t' + date, size: 19, color: '6B7280' }));
        var out = [new P({ keepNext: true, tabStops: [{ type: X.TabStopType.RIGHT, position: right }], spacing: { before: 100 }, children: ch })];
        if (sub) out.push(new P({ keepNext: true, children: [new T({ text: sub, size: 20, color: '374151' })] }));
        return out;
      }
      function bullets(t) { return lines(t).map(function (l) { return new P({ text: l, bullet: { level: 0 }, spacing: { after: 30 } }); }); }
      function dates(a, b) { return [a, b].filter(function (x) { return String(x || '').trim(); }).join(' – '); }
      d.order.filter(function (k) { return hasContent(d, k); }).forEach(function (k) {
        kids.push(heading(secTitle(d, k)));
        if (k === 'summary') kids.push(new P({ text: d.summary }));
        else if (k === 'experience') d.experience.forEach(function (it) { kids = kids.concat(rowLine(it.role, [it.company, it.location].filter(Boolean).join(' · '), dates(it.start, it.end)), bullets(it.bullets)); });
        else if (k === 'education') d.education.forEach(function (it) { kids = kids.concat(rowLine(it.degree, [it.school, it.location].filter(Boolean).join(' · '), dates(it.start, it.end)), bullets(it.details)); });
        else if (k === 'projects') d.projects.forEach(function (it) { kids = kids.concat(rowLine(it.name, it.link, it.dates), bullets(it.desc)); });
        else if (k === 'certifications') d.certifications.forEach(function (it) { kids = kids.concat(rowLine(it.name, it.issuer, it.date)); });
        else if (k === 'custom') d.custom.items.forEach(function (it) { kids = kids.concat(rowLine(it.title, it.subtitle, it.date), bullets(it.desc)); });
        else if (k === 'skills') {
          var names = d.skills.filter(function (s) { return s.name.trim(); }).map(function (s) {
            var lv = SKILL_LEVELS.filter(function (x) { return x[0] === s.level && x[0]; })[0];
            return s.name + (d.showLevels && lv ? ' (' + lv[1] + ')' : '');
          });
          kids.push(new P({ text: names.join('  •  ') }));
        } else if (k === 'languages') {
          kids.push(new P({ text: d.languages.filter(function (l) { return l.name.trim(); }).map(function (l) { return l.name + (l.level ? ' (' + l.level + ')' : ''); }).join('  •  ') }));
        }
      });
      var docu = new X.Document({
        creator: p.name || 'Resume', title: (p.name || 'Resume') + ' - Resume',
        styles: { default: { document: { run: { font: font, size: 21, color: '1F2937' }, paragraph: { spacing: { line: 264 } } } } },
        sections: [{ properties: { page: { size: paper, margin: { top: margin, right: margin, bottom: margin, left: margin } } }, children: kids }]
      });
      return X.Packer.toBlob(docu);
    });
  }

  register('resume-builder', function (root) {
    injectCSS();
    var KEY = 'bt-resume-draft';
    var D = rsNormalize(loadJSON(KEY) || rsSample());
    var wrap = h('div.off-wrap.off-rs');
    root.appendChild(wrap);
    var status = h('span.off-status', { 'aria-live': 'polite', text: 'Autosaves on this device' });

    var pdfBtn = btn('btn-primary', 'download', 'Download PDF');
    var docxBtn = btn('', 'file-text', 'Word (.docx)');
    var bar = h('div.off-bar.no-print', null, [pdfBtn, docxBtn,
      btn('btn-ghost', 'sparkles', 'Sample', function () { if (!confirm('Replace your resume with the sample data?')) return; D = rsSample(); build(); changed(); }),
      btn('btn-ghost', 'download', 'Export', function () {
        BT.download(new Blob([JSON.stringify(D, null, 2)], { type: 'application/json' }), slug(D.personal.name || 'resume') + '-resume.json');
      }),
      btn('btn-ghost', 'upload', 'Import', function () {
        pickFile('.json,application/json', function (f) {
          BT.readFile(f, 'text').then(function (t) {
            var x = JSON.parse(t);
            if (!x || typeof x !== 'object' || !x.personal) throw new Error('This file is not a resume exported from this tool');
            D = rsNormalize(x); build(); changed(); BT.toast('Resume imported');
          }).catch(function (e) { BT.toast(e.message || 'Could not read that file', 'error'); });
        });
      }),
      btn('btn-ghost', 'trash-2', 'Clear', function () { if (!confirm('Clear every field and start an empty resume?')) return; D = rsBlank(); build(); changed(); }),
      h('span.spacer'), status]);
    wrap.appendChild(bar);
    watchBar(wrap, bar);

    var editor = h('div.off-stack.no-print');
    var sheetHost = h('div.off-scale');
    var pwrap = h('div.off-pwrap', null, [sheetHost]);
    var pageInfo = h('span.badge');
    var preview = h('div.off-preview', { tabindex: '0', role: 'region', 'aria-label': 'Resume preview' }, [h('div.off-preview-h.no-print', null, [h('h3', { text: 'Live preview' }), pageInfo]), pwrap]);
    var atsBox = h('div');
    var atsCard = h('div.card.no-print', null, [h('div.card-title', null, [h('h3', { text: 'ATS & recruiter checklist' })]), atsBox]);
    wrap.appendChild(h('div.off-cols', null, [editor, h('div.off-side', null, [h('div.off-sticky', null, [preview])])]));
    var paperW = function () { return D.paper === 'letter' ? 816 : 794; };
    var fit = scaler(pwrap, sheetHost, paperW);

    // ----- design card
    var tplBtns = {};
    var tplRow = h('div.off-tpls', { role: 'group', 'aria-label': 'Template' });
    RS_TEMPLATES.forEach(function (t) {
      var pv = h('span.pv');
      t[2].forEach(function (r) {
        var i = h('i');
        i.style.cssText = 'left:' + r[0] + '%;top:' + r[1] + 'px;width:' + r[2] + '%;height:' + r[3] + 'px;' + (r[4] ? 'background:var(--tpl-acc);opacity:' + r[4] : '');
        pv.appendChild(i);
      });
      var b = h('button.off-tpl', { type: 'button', 'aria-pressed': 'false' }, [pv, h('span', { text: t[1] })]);
      b.addEventListener('click', function () { D.template = t[0]; syncDesign(); changed(); });
      tplBtns[t[0]] = b;
      tplRow.appendChild(b);
    });
    var sw = h('div.off-swatches', { role: 'group', 'aria-label': 'Accent colour' });
    var colorIn = input('color', D.accent, { 'aria-label': 'Custom accent colour' });
    ACCENTS.forEach(function (c) {
      var b = h('button', { type: 'button', 'aria-label': 'Accent ' + c, title: c, style: { background: c }, 'data-c': c });
      b.addEventListener('click', function () { D.accent = c; syncDesign(); changed(); });
      sw.appendChild(b);
    });
    sw.appendChild(colorIn);
    colorIn.addEventListener('input', function () { D.accent = colorIn.value; syncDesign(); changed(); });
    var fontSel = select(RS_FONTS, D.font);
    fontSel.addEventListener('change', function () { D.font = fontSel.value; changed(); });
    var paperSeg = seg([['a4', 'A4'], ['letter', 'US Letter']], D.paper, function (v) { D.paper = v; changed(); }, 'Paper size');
    var designCard = card('Design', [
      h('div.field', null, [h('span.label', { text: 'Template' }), tplRow]),
      h('div.field', null, [h('span.label', { text: 'Accent colour' }), sw]),
      h('div.off-grid2', null, [field('Font', fontSel), h('div.field', null, [h('span.label', { text: 'Paper' }), paperSeg])])
    ]);
    function syncDesign() {
      Object.keys(tplBtns).forEach(function (k) { tplBtns[k].setAttribute('aria-pressed', String(k === D.template)); tplBtns[k].style.setProperty('--tpl-acc', D.accent); });
      BT.$$('button', sw).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-c') === D.accent)); });
      colorIn.value = D.accent; fontSel.value = D.font; paperSeg.set(D.paper);
    }

    // ----- bound fields (one delegated listener, never rebuilt while typing)
    function bind(el, sec, f, id) {
      el.setAttribute('data-sec', sec);
      if (f) el.setAttribute('data-f', f);
      if (id) el.setAttribute('data-id', id);
      return el;
    }
    function textIn(label, sec, f, val, attrs, id, cls) {
      var el = (attrs && attrs.ta) ? textarea(val, { rows: 3 }) : input((attrs && attrs.type) || 'text', val, attrs && attrs.ph ? { placeholder: attrs.ph } : null);
      if (attrs && attrs.ac) el.setAttribute('autocomplete', attrs.ac);
      return field(label, bind(el, sec, f, id), null, cls);
    }

    var secEls = {};
    function sectionCard(k) {
      var meta = RS_SECS[k];
      var body = h('div.off-sec-b');
      var cnt = h('span.cnt');
      var tbtn = h('button.t', { type: 'button', 'aria-expanded': 'true' }, [h('span.ic', { html: BT.icon(meta.icon) }), h('span', { text: k === 'custom' ? (D.custom.title || meta.label) : secTitle(D, k), 'data-title': k }), cnt]);
      var up = ib('chevron-down', 'Move section up', function () { moveSec(k, -1, up); });
      up.querySelector('svg').style.transform = 'rotate(180deg)';
      var down = ib('chevron-down', 'Move section down', function () { moveSec(k, 1, down); });
      var chev = h('span.off-chev', { html: BT.icon('chevron-down') });
      tbtn.appendChild(chev);
      var el = h('div.off-sec' + (D.collapsed[k] ? '.collapsed' : ''), { 'data-k': k }, [h('div.off-sec-h', null, [tbtn, up, down]), body]);
      tbtn.setAttribute('aria-expanded', String(!D.collapsed[k]));
      tbtn.addEventListener('click', function () {
        var c = el.classList.toggle('collapsed');
        D.collapsed[k] = c; tbtn.setAttribute('aria-expanded', String(!c)); save();
      });
      el.cnt = cnt; el.up = up; el.down = down;
      secEls[k] = el;
      if (k === 'summary') {
        body.appendChild(textIn('Section title', 'title', 'summary', D.titles.summary || '', { ph: 'Summary' }));
        var ta = textarea(D.summary, { rows: 5, placeholder: 'Two or three sentences about who you are, your strengths and what you are looking for.' });
        body.appendChild(field('Professional summary', bind(ta, 'summary')));
      } else if (k === 'skills') {
        var listBox = h('div');
        body.appendChild(textIn('Section title', 'title', 'skills', D.titles.skills || '', { ph: 'Skills' }));
        var quick = input('text', '', { placeholder: 'Type skills separated by commas, then press Enter' });
        var qAdd = btn('', 'plus', 'Add', function () { addSkills(); });
        function addSkills() {
          var names = quick.value.split(/[,;\n]/).map(function (s) { return s.trim(); }).filter(Boolean);
          if (!names.length) { quick.focus(); return; }
          names.forEach(function (n) { var it = { id: rid(), name: n, level: '' }; D.skills.push(it); listBox.appendChild(miniRow('skills', it)); });
          quick.value = ''; quick.focus(); changed();
        }
        quick.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addSkills(); } });
        body.appendChild(h('div.field', null, [h('label', { 'for': quick.id, text: 'Quick add' }), h('div.input-group', null, [quick, qAdd])]));
        var lv = checkbox('Show skill levels (dots)', D.showLevels);
        lv.input.addEventListener('change', function () { D.showLevels = lv.input.checked; changed(); });
        body.appendChild(h('div', { style: { marginBottom: '10px' } }, [lv]));
        D.skills.forEach(function (it) { listBox.appendChild(miniRow('skills', it)); });
        body.appendChild(listBox);
        el.listBox = listBox;
      } else if (k === 'languages') {
        var lb = h('div');
        body.appendChild(textIn('Section title', 'title', 'languages', D.titles.languages || '', { ph: 'Languages' }));
        D.languages.forEach(function (it) { lb.appendChild(miniRow('languages', it)); });
        body.appendChild(lb);
        body.appendChild(h('div.off-add', null, [btn('btn-sm', 'plus', 'Add language', function () {
          var it = { id: rid(), name: '', level: '' }; D.languages.push(it); var r = miniRow('languages', it); lb.appendChild(r); r.querySelector('input').focus(); changed();
        })]));
      } else {
        var items = h('div');
        if (k === 'custom') body.appendChild(textIn('Section title', 'customTitle', null, D.custom.title, { ph: 'e.g. Awards, Volunteering, Publications' }));
        else body.appendChild(textIn('Section title', 'title', k, D.titles[k] || '', { ph: meta.label }));
        listOf(k).forEach(function (it) { items.appendChild(itemBox(k, it)); });
        body.appendChild(items);
        var addLabel = { experience: 'Add job', education: 'Add education', projects: 'Add project', certifications: 'Add certification', custom: 'Add entry' }[k];
        body.appendChild(h('div.off-add', null, [btn('btn-sm', 'plus', addLabel, function () {
          var it = rsItem(k); listOf(k).push(it); var box = itemBox(k, it); items.appendChild(box); box.querySelector('input').focus(); changed();
        })]));
      }
      return el;
    }
    function listOf(k) { return k === 'custom' ? D.custom.items : D[k]; }
    function itemBox(k, it) {
      var nm = h('span.n', { text: it[RS_ITEM_NAME[k]] || 'New entry' });
      var box = h('div.off-item', { 'data-id': it.id });
      var up = ib('chevron-down', 'Move up', function () { moveItem(k, it, -1, up); });
      up.querySelector('svg').style.transform = 'rotate(180deg)';
      var down = ib('chevron-down', 'Move down', function () { moveItem(k, it, 1, down); });
      var rm = ib('trash-2', 'Remove entry', function () {
        var arr = listOf(k), i = arr.indexOf(it);
        if (i < 0) return;
        arr.splice(i, 1);
        var next = box.nextElementSibling || box.previousElementSibling;
        box.remove();
        (next ? next.querySelector('input') : secEls[k].querySelector('.off-add button')).focus();
        changed();
      }, 'danger');
      box.appendChild(h('div.off-item-h', null, [nm, up, down, rm]));
      var g = h('div.off-grid2');
      RS_FIELDS[k].forEach(function (f) {
        var isTa = f[2] === 'ta';
        g.appendChild(textIn(f[1], k, f[0], it[f[0]], { ta: isTa, ph: isTa ? '' : f[2] }, it.id, isTa || f[3] === 'full' ? 'full' : ''));
      });
      box.appendChild(g);
      box.nm = nm;
      return box;
    }
    function miniRow(k, it) {
      var name = bind(input('text', it.name, { placeholder: k === 'skills' ? 'Skill' : 'Language', 'aria-label': k === 'skills' ? 'Skill name' : 'Language' }), k, 'name', it.id);
      var lvl = bind(select(k === 'skills' ? SKILL_LEVELS : LANG_LEVELS.map(function (l) { return [l, l || 'Proficiency']; }), it.level, { 'aria-label': 'Level' }), k, 'level', it.id);
      var row = h('div.off-mini', { 'data-id': it.id }, [name, lvl]);
      row.appendChild(ib('x', 'Remove ' + (k === 'skills' ? 'skill' : 'language'), function () {
        var arr = D[k], i = arr.indexOf(it);
        if (i >= 0) arr.splice(i, 1);
        var next = row.nextElementSibling || row.previousElementSibling;
        row.remove();
        if (next) next.querySelector('input').focus();
        changed();
      }, 'danger'));
      return row;
    }
    function moveSec(k, dir, focusEl) {
      var i = D.order.indexOf(k), j = i + dir;
      if (j < 0 || j >= D.order.length) return;
      D.order.splice(i, 1); D.order.splice(j, 0, k);
      var el = secEls[k], other = secEls[D.order[dir < 0 ? j + 1 : j - 1]];
      if (dir < 0) other.parentNode.insertBefore(el, other); else other.parentNode.insertBefore(el, other.nextSibling);
      var edge = dir < 0 ? j === 0 : j === D.order.length - 1;
      (edge ? (dir < 0 ? el.down : el.up) : focusEl).focus();
      changed();
    }
    function moveItem(k, it, dir, focusEl) {
      var arr = listOf(k), i = arr.indexOf(it), j = i + dir;
      if (j < 0 || j >= arr.length) return;
      arr.splice(i, 1); arr.splice(j, 0, it);
      var box = focusEl.closest('.off-item'), par = box.parentNode;
      if (dir < 0) par.insertBefore(box, box.previousElementSibling); else par.insertBefore(box, box.nextElementSibling.nextSibling);
      focusEl.focus();
      changed();
    }

    var secHost;
    function build() {
      editor.innerHTML = '';
      secEls = {};
      editor.appendChild(designCard);
      syncDesign();
      // personal
      var photoIn = input('file', null, { accept: 'image/*' });
      var photoPrev = h('img', { alt: 'Photo preview', style: { width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', display: D.personal.photo ? 'block' : 'none' } });
      if (D.personal.photo) photoPrev.src = D.personal.photo;
      var photoRm = btn('btn-sm btn-ghost' + (D.personal.photo ? '' : '.hidden'), 'x', 'Remove photo', function () {
        D.personal.photo = null; photoPrev.style.display = 'none'; photoRm.classList.add('hidden'); photoIn.value = ''; changed();
      });
      photoIn.addEventListener('change', function () {
        var f = photoIn.files && photoIn.files[0];
        if (!f) return;
        imageToDataURL(f, 320, true, 'image/jpeg').then(function (u) {
          D.personal.photo = u; photoPrev.src = u; photoPrev.style.display = 'block'; photoRm.classList.remove('hidden'); changed();
        }).catch(function () { BT.toast('Could not read that image', 'error'); });
      });
      var P = D.personal;
      var personal = card('Personal details', [
        h('div.off-grid2', null, [
          textIn('Full name', 'personal', 'name', P.name, { ac: 'name' }),
          textIn('Headline / job title', 'personal', 'title', P.title, { ph: 'e.g. Senior Accountant' }),
          textIn('Phone', 'personal', 'phone', P.phone, { type: 'tel', ac: 'tel' }),
          textIn('Email', 'personal', 'email', P.email, { type: 'email', ac: 'email' }),
          textIn('Location', 'personal', 'location', P.location, { ph: 'City, State' }),
          textIn('Links (one per line)', 'personal', 'links', P.links, { ta: true }, null, 'full')
        ]),
        h('div.field', { style: { marginBottom: 0 } }, [h('label', { 'for': photoIn.id, text: 'Photo (optional)' }), h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' } }, [photoPrev, photoIn, photoRm])])
      ]);
      var ta = personal.querySelector('textarea'); ta.rows = 2; ta.style.minHeight = '64px'; ta.placeholder = 'linkedin.com/in/you\ngithub.com/you';
      editor.appendChild(personal);
      secHost = h('div.off-stack');
      D.order.forEach(function (k) { secHost.appendChild(sectionCard(k)); });
      editor.appendChild(secHost);
      editor.appendChild(atsCard);
      editor.appendChild(h('p.small.muted', { text: 'Tip: use the arrows on each section to change its order on the page. In the Modern template, Skills, Languages and Certifications sit in the side column.' }));
    }

    function onEdit(e) {
      var t = e.target, sec = t.getAttribute && t.getAttribute('data-sec');
      if (!sec) return;
      var f = t.getAttribute('data-f'), id = t.getAttribute('data-id'), v = t.value;
      if (sec === 'personal') D.personal[f] = v;
      else if (sec === 'summary') D.summary = v;
      else if (sec === 'title') {
        D.titles[f] = v;
        var lab = secEls[f] && secEls[f].querySelector('[data-title]'); if (lab) lab.textContent = v.trim() || RS_SECS[f].label;
      } else if (sec === 'customTitle') {
        D.custom.title = v;
        var cl = secEls.custom && secEls.custom.querySelector('[data-title]'); if (cl) cl.textContent = v.trim() || 'Custom section';
      } else {
        var arr = listOf(sec), it = arr && arr.filter(function (x) { return x.id === id; })[0];
        if (!it) return;
        it[f] = v;
        if (RS_ITEM_NAME[sec] === f) { var box = t.closest('.off-item'); if (box && box.nm) box.nm.textContent = v || 'New entry'; }
      }
      changed();
    }
    editor.addEventListener('input', onEdit);
    editor.addEventListener('change', function (e) { if (e.target.tagName === 'SELECT' && e.target.getAttribute('data-sec')) onEdit(e); });

    var raf = 0, saveT = 0;
    function changed() {
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; render(); });
      status.textContent = 'Saving…';
      clearTimeout(saveT);
      saveT = setTimeout(save, 600);
    }
    function save() {
      status.textContent = store(KEY, JSON.stringify(D)) ? 'Draft saved on this device' : 'Could not save (storage full or blocked)';
    }
    function render() {
      sheetHost.innerHTML = rsHtml(D);
      var sheet = sheetHost.firstChild;
      // dashed page-break guides (approximate: printable height per page)
      var pageH = D.paper === 'letter' ? 1056 - 91 : 1123 - 91;
      var contentH = contentHeight(sheet, 48);
      var n = Math.max(1, Math.ceil((contentH - 2) / pageH));
      for (var i = 1; i < n; i++) {
        var pb = h('div.off-pb', { style: { top: (48 + i * pageH) + 'px' }, html: '<span>Page ' + (i + 1) + '</span>' });
        sheet.appendChild(pb);
      }
      pageInfo.textContent = (D.paper === 'letter' ? 'Letter' : 'A4') + ' · about ' + n + ' page' + (n > 1 ? 's' : '');
      fit();
      // counts + section arrows
      D.order.forEach(function (k, idx) {
        var el = secEls[k];
        if (!el) return;
        var c = k === 'summary' ? '' : k === 'custom' ? D.custom.items.length : D[k].length;
        el.cnt.textContent = c === '' ? '' : String(c);
        el.cnt.style.display = c === '' ? 'none' : '';
        el.up.disabled = idx === 0; el.down.disabled = idx === D.order.length - 1;
      });
      renderAts();
    }
    function renderAts() {
      var list = rsAts(D), ok = list.filter(function (x) { return x.ok; }).length, pct = Math.round(ok / list.length * 100);
      atsBox.innerHTML = '<div class="off-score"><span class="off-ring" style="--p:' + pct + '"><b>' + pct + '</b></span><div><b>' + ok + ' of ' + list.length + ' checks passed</b><div class="small muted">Recruiters skim for about 7 seconds. Keep it to 1–2 pages, lead with results, and mirror keywords from the job post.</div></div></div>' +
        '<ul class="off-list">' + list.map(function (x) { return '<li class="' + (x.ok ? 'ok' : 'warn') + '"><span class="i">' + BT.icon(x.ok ? 'check' : 'info') + '</span><span>' + esc(x.text) + '</span></li>'; }).join('') + '</ul>';
    }

    pdfBtn.addEventListener('click', function () {
      save();
      sheetHost.style.transform = '';
      printDoc((D.personal.name || 'Resume') + ' - Resume');
    });
    docxBtn.addEventListener('click', function () {
      BT.busy(docxBtn, function () {
        return rsDocx(D).then(function (blob) { BT.download(blob, slug(D.personal.name || 'resume') + '-resume.docx'); BT.toast('Word file downloaded'); });
      }, 'Building…');
    });
    window.addEventListener('afterprint', function () { fit(); });
    build();
    render();
    BT.resumeDebug = { data: function () { return D; }, docx: function () { return rsDocx(D); }, ats: function () { return rsAts(D); } };
  });

  // ================================================ SALARY SLIP GENERATOR
  var PT_STATES = [
    ['WB', 'West Bengal'], ['MH', 'Maharashtra'], ['KA', 'Karnataka'], ['manual', 'Other state (enter amount)'], ['none', 'No professional tax']
  ];
  /** Monthly professional tax. gross = earned gross for the month, month 1..12. */
  function professionalTax(state, gross, month, gender) {
    if (state === 'WB') {
      if (gross <= 10000) return 0;
      if (gross <= 15000) return 110;
      if (gross <= 25000) return 130;
      if (gross <= 40000) return 150;
      return 200;
    }
    if (state === 'MH') {
      if (gender === 'female') return gross > 25000 ? (month === 2 ? 300 : 200) : 0;
      if (gross > 10000) return month === 2 ? 300 : 200;
      if (gross > 7500) return 175;
      return 0;
    }
    if (state === 'KA') return gross > 25000 ? 200 : 0;
    return 0;
  }
  var PT_NOTE = {
    WB: 'West Bengal slab: up to ₹10,000 nil; ₹10,001–15,000 ₹110; ₹15,001–25,000 ₹130; ₹25,001–40,000 ₹150; above ₹40,000 ₹200 per month.',
    MH: 'Maharashtra (simplified): men ₹175 for ₹7,501–10,000 and ₹200 above ₹10,000; women nil up to ₹25,000 and ₹200 above. ₹300 in February.',
    KA: 'Karnataka: ₹200 per month when gross salary is above ₹25,000.',
    manual: 'Enter the professional tax for your state. Rates and slabs differ by state.',
    none: 'Some states (e.g. Delhi, Haryana, Uttar Pradesh) do not levy professional tax.'
  };

  function slipCalc(d, monthOverride, lopOverride) {
    var m = monthOverride ? monthOverride.m : (parseInt(d.month, 10) || 1);
    var y = monthOverride ? monthOverride.y : (parseInt(d.year, 10) || new Date().getFullYear());
    var dim = BT.num(d.days);
    if (!isFinite(dim) || dim <= 0) dim = daysIn(y, m);
    dim = Math.round(dim);
    var lop = lopOverride != null ? lopOverride : BT.num(d.lop);
    lop = clamp(isFinite(lop) ? lop : 0, 0, dim);
    var paid = dim - lop;
    var factor = d.prorate ? paid / dim : 1;
    var earnings = d.earnings.map(function (e) {
      var rate = BT.num(e.amount) || 0;
      return { id: e.id, name: e.name || 'Earning', rate: rate, amount: Math.round(rate * factor), pf: !!e.pf };
    });
    var gross = earnings.reduce(function (a, e) { return a + e.amount; }, 0);
    var rateGross = earnings.reduce(function (a, e) { return a + e.rate; }, 0);
    var pfWageFull = earnings.filter(function (e) { return e.pf; }).reduce(function (a, e) { return a + e.amount; }, 0);
    var pfWage = d.pfCap ? Math.min(pfWageFull, 15000) : pfWageFull;
    var epf = d.pf ? Math.round(pfWage * 0.12) : 0;
    var esiEligible = d.esi && rateGross > 0 && rateGross <= 21000;
    var esi = esiEligible ? Math.ceil(gross * 0.0075) : 0;
    var pt = d.ptState === 'manual' ? Math.max(0, BT.num(d.ptManual) || 0) : professionalTax(d.ptState, gross, m, d.gender);
    var tds = Math.max(0, BT.num(d.tds) || 0);
    var deductions = [];
    if (d.pf) deductions.push({ name: 'EPF (employee 12%)', amount: epf });
    if (esiEligible) deductions.push({ name: 'ESI (employee 0.75%)', amount: esi });
    if (d.ptState !== 'none') deductions.push({ name: 'Professional tax', amount: pt });
    if (tds) deductions.push({ name: 'Income tax (TDS)', amount: tds });
    d.deductions.forEach(function (x) { var a = BT.num(x.amount) || 0; if (x.name || a) deductions.push({ name: x.name || 'Deduction', amount: a }); });
    var totalDed = deductions.reduce(function (a, x) { return a + x.amount; }, 0);
    var net = gross - totalDed;
    var eps = d.pf ? Math.round(Math.min(pfWageFull, 15000) * 0.0833) : 0;
    var erPf = d.pf ? Math.round(pfWage * 0.12) : 0;
    var employer = { epf: erPf - Math.min(eps, erPf), eps: Math.min(eps, erPf), pf: erPf, esi: esiEligible ? Math.ceil(gross * 0.0325) : 0 };
    employer.total = employer.pf + employer.esi;
    return { m: m, y: y, dim: dim, lop: lop, paid: paid, factor: factor, earnings: earnings, gross: gross, rateGross: rateGross, pfWage: pfWage, epf: epf,
      esi: esi, esiEligible: esiEligible, pt: pt, tds: tds, deductions: deductions, totalDed: totalDed, net: net, words: amountWords(Math.max(0, net)),
      employer: employer, ctc: gross + employer.total };
  }

  function slipSample() {
    var now = new Date(), pm = now.getMonth() === 0 ? 12 : now.getMonth(), py = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return {
      v: 1, accent: '#0e7490',
      company: { name: 'BISCS India Pvt. Ltd.', address: '12, Park Street, Kolkata 700016\nWest Bengal', logo: null },
      emp: { name: 'Rahul Das', id: 'EMP-0142', designation: 'Accounts Executive', department: 'Finance', pan: 'ABCPD1234E', uan: '100987654321', bank: '4821', doj: '2023-06-01', location: 'Kolkata' },
      month: String(pm), year: String(py), days: '', lop: '0', prorate: true, payDate: '',
      earnings: [
        { id: rid(), name: 'Basic', amount: '15000', pf: true },
        { id: rid(), name: 'HRA', amount: '7500', pf: false },
        { id: rid(), name: 'Conveyance allowance', amount: '1600', pf: false },
        { id: rid(), name: 'Special allowance', amount: '5900', pf: false }
      ],
      pf: true, pfCap: true, esi: true, ptState: 'WB', gender: 'male', ptManual: '', tds: '0',
      deductions: [], employerSection: true, batchFrom: '', batchTo: ''
    };
  }
  function slipNormalize(x) {
    var d = slipSample();
    if (!x || typeof x !== 'object' || !Array.isArray(x.earnings)) return d;
    Object.keys(d).forEach(function (k) { if (x[k] !== undefined && typeof x[k] === typeof d[k]) d[k] = x[k]; });
    d.company = Object.assign(slipSample().company, x.company || {});
    d.emp = Object.assign(slipSample().emp, x.emp || {});
    d.earnings = x.earnings.map(function (e) { return { id: e.id || rid(), name: String(e.name || ''), amount: String(e.amount == null ? '' : e.amount), pf: !!e.pf }; });
    d.deductions = (Array.isArray(x.deductions) ? x.deductions : []).map(function (e) { return { id: e.id || rid(), name: String(e.name || ''), amount: String(e.amount == null ? '' : e.amount) }; });
    return d;
  }

  function slipHtml(d, C) {
    var e = function (v) { return esc(v || ''); };
    var E = d.emp, co = d.company;
    var doj = E.doj && /^\d{4}-\d{2}-\d{2}$/.test(E.doj) ? (function (p) { return Number(p[2]) + ' ' + MON3[Number(p[1]) - 1] + ' ' + p[0]; })(E.doj.split('-')) : E.doj;
    var info = [['Employee name', E.name], ['Employee ID', E.id], ['Designation', E.designation], ['Department', E.department], ['Date of joining', doj], ['PAN', E.pan], ['UAN', E.uan],
      ['Bank A/c', E.bank ? 'XXXX' + String(E.bank).slice(-4) : ''], ['Location', E.location]].filter(function (x) { return String(x[1] || '').trim(); });
    var rows = Math.max(C.earnings.length, C.deductions.length);
    function td(list, i) {
      var x = list[i];
      return x ? '<tr><td>' + e(x.name) + '</td><td class="r">' + money(x.amount) + '</td></tr>' : '<tr><td>&nbsp;</td><td></td></tr>';
    }
    var er = '', ed = '';
    for (var i = 0; i < rows; i++) { er += td(C.earnings, i); ed += td(C.deductions, i); }
    var period = MONTHS[C.m - 1] + ' ' + C.y;
    return '<div class="off-sheet off-ss-sheet" style="--acc:' + e(d.accent || '#0e7490') + '">' +
      '<div class="top"><div class="co">' + (co.logo ? '<img src="' + e(co.logo) + '" alt="">' : '') + '<div><div class="cn">' + e(co.name || 'Company name') + '</div><div class="pre mut">' + e(co.address) + '</div></div></div>' +
      '<div class="ttl"><div class="pt">PAYSLIP</div><div>' + e(period) + '</div></div></div>' +
      '<div class="emp">' + info.map(function (x) { return '<div><span>' + e(x[0]) + '</span><span>' + e(x[1]) + '</span></div>'; }).join('') + '</div>' +
      '<div class="att"><div><span>Days in month</span><b>' + C.dim + '</b></div><div><span>Paid days</span><b>' + BT.fmtNum(C.paid, 1) + '</b></div><div><span>LOP days</span><b>' + BT.fmtNum(C.lop, 1) + '</b></div><div><span>Pay period</span><b>' + MON3[C.m - 1] + ' ' + C.y + '</b></div></div>' +
      '<div class="ed"><div><table><thead><tr><th>Earnings</th><th class="r">Amount (₹)</th></tr></thead><tbody>' + er +
      '<tr class="tot"><td>Gross earnings</td><td class="r">' + money(C.gross) + '</td></tr></tbody></table></div>' +
      '<div><table><thead><tr><th>Deductions</th><th class="r">Amount (₹)</th></tr></thead><tbody>' + ed +
      '<tr class="tot"><td>Total deductions</td><td class="r">' + money(C.totalDed) + '</td></tr></tbody></table></div></div>' +
      '<div class="net"><div><div class="mut" style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:700">Net pay</div><div class="w">' + e(C.words) + '</div></div><b>₹' + money(C.net) + '</b></div>' +
      (d.employerSection && (C.employer.total > 0) ? '<p class="er-h">Employer contributions (not part of net pay)</p><div class="er"><table><thead><tr><th>Contribution</th><th class="r">Amount (₹)</th></tr></thead><tbody>' +
        (d.pf ? '<tr><td>EPF employer share (3.67%)</td><td class="r">' + money(C.employer.epf) + '</td></tr><tr><td>EPS pension (8.33%)</td><td class="r">' + money(C.employer.eps) + '</td></tr>' : '') +
        (C.esiEligible ? '<tr><td>ESI employer (3.25%)</td><td class="r">' + money(C.employer.esi) + '</td></tr>' : '') +
        '<tr class="tot"><td>Cost to company this month</td><td class="r">' + money(C.ctc) + '</td></tr></tbody></table></div>' : '') +
      '<div class="sig"><span>Employee signature</span><span>For ' + e(co.name || 'the employer') + '</span></div>' +
      '<div class="foot">This is a computer-generated payslip.' + (d.payDate ? ' Paid on ' + e(d.payDate) + '.' : '') + '</div></div>';
  }

  register('salary-slip-generator', function (root) {
    injectCSS();
    var KEY = 'bt-salary-slip-draft';
    var D = slipNormalize(loadJSON(KEY));
    var wrap = h('div.off-wrap.off-ss');
    root.appendChild(wrap);
    var status = h('span.off-status', { 'aria-live': 'polite', text: 'Autosaves on this device' });
    var pdfBtn = btn('btn-primary', 'download', 'Download PDF');
    var batchBtn = btn('', 'calendar-range', 'Print several months');
    var bar = h('div.off-bar.no-print', null, [pdfBtn, batchBtn,
      btn('btn-ghost', 'sparkles', 'Sample', function () { if (!confirm('Replace all fields with sample data?')) return; D = slipSample(); build(); changed(); }),
      btn('btn-ghost', 'trash-2', 'Clear employee', function () {
        if (!confirm('Clear the employee details? Company details and pay structure are kept.')) return;
        D.emp = { name: '', id: '', designation: '', department: '', pan: '', uan: '', bank: '', doj: '', location: '' }; build(); changed();
      }),
      h('span.spacer'), status]);
    wrap.appendChild(bar);
    watchBar(wrap, bar);
    var editor = h('div.off-stack.no-print');
    var sheetHost = h('div.off-scale');
    var pwrap = h('div.off-pwrap', null, [sheetHost]);
    var badge = h('span.badge', { text: 'A4' });
    var preview = h('div.off-preview', { tabindex: '0', role: 'region', 'aria-label': 'Payslip preview' }, [h('div.off-preview-h.no-print', null, [h('h3', { text: 'Payslip preview' }), badge]), pwrap]);
    wrap.appendChild(h('div.off-cols', null, [editor, h('div.off-side', null, [h('div.off-sticky', null, [preview])])]));
    var fit = scaler(pwrap, sheetHost, 794);
    var batch = null; // [{m,y}] while printing several months

    function bound(type, path, attrs) {
      var v = path.split('.').reduce(function (o, k) { return o == null ? '' : o[k]; }, D);
      var el = type === 'textarea' ? textarea(v, Object.assign({ rows: 2 }, attrs || {})) : input(type, v == null ? '' : v, attrs);
      el.setAttribute('data-p', path);
      if (type === 'textarea') el.style.minHeight = '64px';
      return el;
    }
    var earnBox, dedBox, totals, ptHint, ptManualF, genderF, esiHint, daysHint;
    function build() {
      editor.innerHTML = '';
      var logoIn = input('file', null, { accept: 'image/*' });
      var logoRm = btn('btn-sm btn-ghost' + (D.company.logo ? '' : '.hidden'), 'x', 'Remove logo', function () { D.company.logo = null; logoRm.classList.add('hidden'); logoIn.value = ''; changed(); });
      logoIn.addEventListener('change', function () {
        var f = logoIn.files && logoIn.files[0];
        if (!f) return;
        imageToDataURL(f, 360, false, 'image/png').then(function (u) { D.company.logo = u; logoRm.classList.remove('hidden'); changed(); }).catch(function () { BT.toast('Could not read that image', 'error'); });
      });
      var accent = bound('color', 'accent', { 'aria-label': 'Accent colour' });
      editor.appendChild(card('Company', [
        field('Company name', bound('text', 'company.name', { autocomplete: 'organization' })),
        field('Address', bound('textarea', 'company.address')),
        h('div.off-grid2', null, [h('div.field', null, [h('label', { 'for': logoIn.id, text: 'Logo (optional)' }), logoIn, logoRm]),
          h('div.field', null, [h('label', { 'for': accent.id, text: 'Accent colour' }), accent])])
      ]));
      editor.appendChild(card('Employee', [h('div.off-grid2', null, [
        field('Employee name', bound('text', 'emp.name')), field('Employee ID', bound('text', 'emp.id')),
        field('Designation', bound('text', 'emp.designation')), field('Department', bound('text', 'emp.department')),
        field('PAN', bound('text', 'emp.pan', { maxlength: 10, autocapitalize: 'characters', spellcheck: 'false', placeholder: 'ABCDE1234F' })),
        field('UAN', bound('text', 'emp.uan', { inputmode: 'numeric', maxlength: 12 })),
        field('Bank account (last 4 digits)', bound('text', 'emp.bank', { inputmode: 'numeric', maxlength: 4 })),
        field('Date of joining', bound('date', 'emp.doj')),
        field('Work location', bound('text', 'emp.location'), null, 'full')
      ])]));
      var monthSel = bound('select-month', 'month');
      daysHint = h('span.hint');
      editor.appendChild(card('Pay period & attendance', [
        h('div.off-grid2', null, [field('Month', monthSel), field('Year', bound('number', 'year', { min: 2000, max: 2100, inputmode: 'numeric' })),
          h('div.field', null, [h('label', { 'for': 'off-days', text: 'Days in month' }), (function () { var x = bound('number', 'days', { min: 1, max: 31, placeholder: 'Auto', inputmode: 'numeric' }); x.id = 'off-days'; return x; })(), daysHint]),
          field('Loss-of-pay (LOP) days', bound('number', 'lop', { min: 0, step: '0.5', inputmode: 'decimal' }))]),
        (function () { var c = checkbox('Reduce earnings for LOP days (pro-rata)', D.prorate); c.input.setAttribute('data-p', 'prorate'); return h('div.field', null, [c]); })(),
        field('Payment date (optional)', bound('text', 'payDate', { placeholder: 'e.g. 31 Oct 2026' }))
      ]));
      // earnings
      earnBox = h('div');
      D.earnings.forEach(function (it) { earnBox.appendChild(earnRow(it)); });
      editor.appendChild(card('Earnings (monthly, full attendance)', [
        h('p.off-hint', { text: 'Tick “PF wage” for components that count towards EPF (usually Basic and DA).' }),
        earnBox,
        h('div.off-add', null, [btn('btn-sm', 'plus', 'Add earning', function () { var it = { id: rid(), name: '', amount: '', pf: false }; D.earnings.push(it); var r = earnRow(it); earnBox.appendChild(r); r.querySelector('input').focus(); changed(); })])
      ]));
      // deductions
      dedBox = h('div');
      D.deductions.forEach(function (it) { dedBox.appendChild(dedRow(it)); });
      var pfC = checkbox('Deduct EPF (12% of PF wage)', D.pf); pfC.input.setAttribute('data-p', 'pf');
      var capC = checkbox('Cap PF wage at ₹15,000 (max ₹1,800)', D.pfCap); capC.input.setAttribute('data-p', 'pfCap');
      var esiC = checkbox('Deduct ESI when gross ≤ ₹21,000', D.esi); esiC.input.setAttribute('data-p', 'esi');
      esiHint = h('p.off-hint');
      ptHint = h('p.off-hint');
      var ptSel = bound('select-pt', 'ptState');
      ptManualF = field('Professional tax amount (₹)', bound('number', 'ptManual', { min: 0, inputmode: 'decimal' }));
      genderF = field('Employee gender (Maharashtra slab)', bound('select-gender', 'gender'));
      var erC = checkbox('Show employer contributions (EPF 12%, ESI 3.25%)', D.employerSection); erC.input.setAttribute('data-p', 'employerSection');
      editor.appendChild(card('Deductions', [
        h('div', { style: { display: 'grid', gap: '8px', marginBottom: '6px' } }, [pfC, capC, esiC]), esiHint,
        h('div.off-grid2', null, [field('Professional tax (state)', ptSel), ptManualF, genderF]), ptHint,
        h('div.off-grid2', null, [field('Income tax / TDS this month (₹)', bound('number', 'tds', { min: 0, inputmode: 'decimal' }))]),
        h('div.label', { text: 'Other deductions', style: { margin: '4px 0 8px' } }),
        dedBox,
        h('div.off-add', null, [btn('btn-sm', 'plus', 'Add deduction', function () { var it = { id: rid(), name: '', amount: '' }; D.deductions.push(it); var r = dedRow(it); dedBox.appendChild(r); r.querySelector('input').focus(); changed(); })]),
        h('div', { style: { marginTop: '14px' } }, [erC])
      ]));
      totals = h('div');
      editor.appendChild(card('Summary', [totals,
        h('div.notice.warn', { style: { marginTop: '14px' }, html: BT.icon('info') + '<span>Rates used: EPF 12% (wage ceiling ₹15,000), ESI 0.75% / 3.25% up to ₹21,000 gross, and simplified professional tax slabs. Rules change, so please verify current rates with your payroll advisor before issuing payslips.</span>' })]));
      // batch range
      var bf = bound('month-range', 'batchFrom'), bt = bound('month-range', 'batchTo');
      editor.appendChild(card('Print several months', [
        h('p.off-hint', { text: 'Print one payslip per month for a range (for example a financial year). Months other than the selected pay month assume full attendance.' }),
        h('div.off-grid2', null, [field('From', bf), field('To', bt)])
      ]));
      changed(true);
    }
    // select-type helpers inside bound()
    var _bound = bound;
    bound = function (type, path, attrs) {
      var el;
      if (type === 'select-month') el = select(monthOptions(), D.month);
      else if (type === 'select-pt') el = select(PT_STATES, D.ptState);
      else if (type === 'select-gender') el = select([['male', 'Male'], ['female', 'Female']], D.gender);
      else if (type === 'month-range') {
        var opts = [['', 'Choose…']], now = new Date();
        for (var i = -24; i <= 12; i++) { var dt = new Date(now.getFullYear(), now.getMonth() + i, 1); opts.push([dt.getFullYear() + '-' + pad2(dt.getMonth() + 1), MONTHS[dt.getMonth()] + ' ' + dt.getFullYear()]); }
        el = select(opts, D[path]);
      } else return _bound(type, path, attrs);
      el.setAttribute('data-p', path);
      return el;
    };
    function earnRow(it) {
      var name = input('text', it.name, { placeholder: 'Component', 'aria-label': 'Earning name' });
      var amt = input('number', it.amount, { min: 0, inputmode: 'decimal', placeholder: '0', 'aria-label': 'Monthly amount' });
      var pf = checkbox('PF wage', it.pf);
      name.setAttribute('data-f', 'name'); amt.setAttribute('data-f', 'amount'); pf.input.setAttribute('data-f', 'pf');
      var row = h('div.off-mini.k4', { 'data-id': it.id, 'data-list': 'earnings' }, [name, amt, pf]);
      row.appendChild(ib('x', 'Remove earning', function () {
        D.earnings = D.earnings.filter(function (x) { return x !== it; });
        var next = row.nextElementSibling || row.previousElementSibling; row.remove(); if (next) next.querySelector('input').focus(); changed();
      }, 'danger'));
      return row;
    }
    function dedRow(it) {
      var name = input('text', it.name, { placeholder: 'e.g. Salary advance, Canteen', 'aria-label': 'Deduction name' });
      var amt = input('number', it.amount, { min: 0, inputmode: 'decimal', placeholder: '0', 'aria-label': 'Deduction amount' });
      name.setAttribute('data-f', 'name'); amt.setAttribute('data-f', 'amount');
      var row = h('div.off-mini', { 'data-id': it.id, 'data-list': 'deductions' }, [name, amt]);
      row.appendChild(ib('x', 'Remove deduction', function () {
        D.deductions = D.deductions.filter(function (x) { return x !== it; });
        var next = row.nextElementSibling || row.previousElementSibling; row.remove(); if (next) next.querySelector('input').focus(); changed();
      }, 'danger'));
      return row;
    }
    function onEdit(e) {
      batch = null;
      var t = e.target, p = t.getAttribute && t.getAttribute('data-p');
      if (p) {
        var v = t.type === 'checkbox' ? t.checked : t.value;
        if (p === 'emp.pan') { var up = String(v).toUpperCase(); if (up !== v) { var pos = t.selectionStart; t.value = up; try { t.setSelectionRange(pos, pos); } catch (er) { /* ignore */ } } v = up; }
        var ks = p.split('.'), o = D;
        for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]];
        o[ks[ks.length - 1]] = v;
        changed();
        return;
      }
      var f = t.getAttribute && t.getAttribute('data-f'), row = t.closest && t.closest('[data-list]');
      if (f && row) {
        var it = D[row.getAttribute('data-list')].filter(function (x) { return x.id === row.getAttribute('data-id'); })[0];
        if (it) { it[f] = t.type === 'checkbox' ? t.checked : t.value; changed(); }
      }
    }
    editor.addEventListener('input', onEdit);
    editor.addEventListener('change', function (e) { if (e.target.tagName === 'SELECT' || e.target.type === 'checkbox' || e.target.type === 'date' || e.target.type === 'color') onEdit(e); });

    var saveT = 0;
    function changed(skipSave) {
      var C = slipCalc(D);
      daysHint.textContent = 'Blank = calendar days (' + daysIn(C.y, C.m) + ')';
      ptManualF.classList.toggle('hidden', D.ptState !== 'manual');
      genderF.classList.toggle('hidden', D.ptState !== 'MH');
      ptHint.textContent = PT_NOTE[D.ptState] || '';
      esiHint.textContent = D.esi ? (C.esiEligible ? 'ESI applies: monthly gross is ₹' + money0(C.rateGross) + ' (limit ₹21,000).' : 'ESI not applicable: monthly gross ₹' + money0(C.rateGross) + ' is above ₹21,000.') : '';
      totals.innerHTML = '<dl class="off-kv"><dt>Gross earnings</dt><dd>₹' + money(C.gross) + '</dd><dt>Total deductions</dt><dd>₹' + money(C.totalDed) + '</dd>' +
        C.deductions.map(function (x) { return '<dt style="padding-left:12px">' + esc(x.name) + '</dt><dd style="font-weight:500">₹' + money(x.amount) + '</dd>'; }).join('') +
        (D.employerSection ? '<dt>Employer contributions</dt><dd>₹' + money(C.employer.total) + '</dd>' : '') + '</dl>' +
        '<div class="off-total"><span>Net pay</span><b>₹' + money(C.net) + '</b></div><p class="small muted" style="margin:8px 0 0">' + esc(C.words) + '</p>';
      render(C);
      if (!skipSave) {
        status.textContent = 'Saving…';
        clearTimeout(saveT);
        saveT = setTimeout(function () { status.textContent = store(KEY, JSON.stringify(D)) ? 'Draft saved on this device' : 'Could not save (storage full or blocked)'; }, 500);
      }
    }
    function render(C) {
      var months = batch || [{ m: C.m, y: C.y }];
      sheetHost.innerHTML = months.map(function (mm) {
        var same = mm.m === C.m && mm.y === C.y;
        return slipHtml(D, same ? C : slipCalc(D, mm, 0));
      }).join('');
      badge.textContent = batch ? 'A4 · ' + months.length + ' payslips' : 'A4';
      fit();
    }
    function rangeMonths() {
      var a = /^(\d{4})-(\d{2})$/.exec(D.batchFrom || ''), b = /^(\d{4})-(\d{2})$/.exec(D.batchTo || '');
      if (!a || !b) return null;
      var out = [], y = +a[1], m = +a[2], ey = +b[1], em = +b[2];
      while ((y < ey || (y === ey && m <= em)) && out.length < 24) { out.push({ m: m, y: y }); m++; if (m > 12) { m = 1; y++; } }
      return out.length ? out : null;
    }
    pdfBtn.addEventListener('click', function () {
      batch = null; changed(true);
      printDoc('Payslip ' + MONTHS[(parseInt(D.month, 10) || 1) - 1] + ' ' + D.year + (D.emp.name ? ' - ' + D.emp.name : ''));
    });
    batchBtn.addEventListener('click', function () {
      var r = rangeMonths();
      if (!r) { BT.toast('Choose a From and To month under “Print several months”', 'error'); var s = editor.querySelector('[data-p="batchFrom"]'); if (s) { s.scrollIntoView({ block: 'center' }); s.focus(); } return; }
      batch = r; changed(true);
      printDoc('Payslips ' + MON3[r[0].m - 1] + ' ' + r[0].y + ' to ' + MON3[r[r.length - 1].m - 1] + ' ' + r[r.length - 1].y + (D.emp.name ? ' - ' + D.emp.name : ''));
    });
    window.addEventListener('afterprint', function () { if (batch) { batch = null; changed(true); } fit(); });
    build();
    BT.salaryDebug = { data: function () { return D; }, calc: function () { return slipCalc(D); }, set: function (x) { D = slipNormalize(Object.assign({}, D, x)); build(); return slipCalc(D); } };
  });
  BT.office = BT.office || {};
  BT.office.slipCalc = slipCalc;
  BT.office.professionalTax = professionalTax;

  // ============================================== RENT RECEIPT GENERATOR
  var PAY_MODES = ['Cash', 'UPI', 'Bank transfer (NEFT/IMPS)', 'Cheque'];
  function rentSample() {
    var now = new Date(), fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return {
      v: 1, accent: '#0e7490', tenant: 'Priya Banerjee', landlord: 'Subhash Chatterjee', pan: 'ABCPC1234D', landlordAddr: '',
      address: 'Flat 3B, Lake View Apartments, 45 Southern Avenue, Kolkata 700029', rent: '18000',
      fromM: '4', fromY: String(fy), toM: '3', toY: String(fy + 1), mode: 'Bank transfer (NEFT/IMPS)', ref: '',
      dateMode: 'last', prefix: 'RR-', startNo: '1', place: 'Kolkata', stamp: true
    };
  }
  function rentNormalize(x) {
    var d = rentSample();
    if (!x || typeof x !== 'object') return d;
    Object.keys(d).forEach(function (k) { if (x[k] !== undefined && typeof x[k] === typeof d[k]) d[k] = x[k]; });
    return d;
  }
  /** One entry per month in the range (max 36). */
  function rentMonths(d) {
    var y = parseInt(d.fromY, 10), m = parseInt(d.fromM, 10), ey = parseInt(d.toY, 10), em = parseInt(d.toM, 10);
    var out = [];
    if (!(y && m && ey && em)) return out;
    var start = parseInt(d.startNo, 10);
    if (!isFinite(start)) start = 1;
    while ((y < ey || (y === ey && m <= em)) && out.length < 36) {
      var last = daysIn(y, m);
      var n = String(start + out.length);
      while (n.length < 3) n = '0' + n;
      out.push({
        m: m, y: y, no: (d.prefix || '') + n,
        period: '1 ' + MON3[m - 1] + ' ' + y + ' to ' + last + ' ' + MON3[m - 1] + ' ' + y,
        label: MONTHS[m - 1] + ' ' + y,
        date: (d.dateMode === 'first' ? 1 : last) + ' ' + MON3[m - 1] + ' ' + y
      });
      m++; if (m > 12) { m = 1; y++; }
    }
    return out;
  }
  function rentHtmlOne(d, r) {
    var e = function (v) { return esc(v || ''); };
    var rent = BT.num(d.rent) || 0;
    var ref = d.ref ? ' (ref. ' + e(d.ref) + ')' : '';
    return '<div class="off-rr-rc" style="--acc:' + e(d.accent) + '"><div class="hd"><div><div class="rt">RENT RECEIPT</div><div class="mut" style="color:#4b5563;font-size:12px">For the month of ' + e(r.label) + '</div></div>' +
      '<div class="no">Receipt no. <b>' + e(r.no) + '</b><br>Date: <b>' + e(r.date) + '</b></div></div>' +
      '<p class="bd">Received with thanks from <b>' + e(d.tenant || 'Tenant name') + '</b> a sum of <span class="amt">₹' + money0(rent) + '</span> (' + e(amountWords(rent)) + ') by <b>' + e(d.mode) + '</b>' + ref +
      ' towards rent for the period <b>' + e(r.period) + '</b> for the property at <b>' + e(d.address || 'Property address') + '</b>.</p>' +
      '<div class="ft"><div class="ll"><div>Landlord: <b>' + e(d.landlord || 'Landlord name') + '</b></div>' + (d.pan ? '<div>PAN: <b>' + e(d.pan) + '</b></div>' : '') +
      (d.landlordAddr ? '<div style="max-width:300px">' + e(d.landlordAddr) + '</div>' : '') + (d.place ? '<div>Place: ' + e(d.place) + '</div>' : '') + '</div>' +
      '<div class="sg">' + (d.stamp ? '<div class="stamp">Revenue<br>stamp</div>' : '') + '<div class="sl">Signature of landlord</div></div></div></div>';
  }
  function rentHtml(d, months) {
    var out = '';
    for (var i = 0; i < months.length; i += 2) {
      out += '<div class="off-sheet off-rr-page">' + rentHtmlOne(d, months[i]) +
        (months[i + 1] ? '<div class="off-rr-cut">Cut here</div>' + rentHtmlOne(d, months[i + 1]) : '<div style="flex:1"></div>') + '</div>';
    }
    return out;
  }
  function hexRgb(hex) {
    var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '') || [0, '0e', '74', '90'];
    return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
  }
  /** Build all receipts as one PDF (2 per A4 page) with pdf-lib. Resolves to Uint8Array. */
  function rentPdf(d) {
    return BT.loadLib('pdflib').then(function (L) {
      return L.PDFDocument.create().then(function (pdf) {
        return Promise.all([pdf.embedFont(L.StandardFonts.Helvetica), pdf.embedFont(L.StandardFonts.HelveticaBold)]).then(function (fonts) {
          var F = fonts[0], B = fonts[1], S = sanitizeWinAnsi;
          var acc = hexRgb(d.accent), accC = L.rgb(acc[0], acc[1], acc[2]);
          var grey = L.rgb(0.42, 0.45, 0.5), dark = L.rgb(0.07, 0.09, 0.15), line = L.rgb(0.8, 0.84, 0.88);
          var months = rentMonths(d);
          var W = 595.28, H = 841.89, M = 30, gap = 34, boxH = (H - M * 2 - gap) / 2, boxW = W - M * 2;
          var rent = BT.num(d.rent) || 0;
          pdf.setTitle('Rent receipts - ' + S(d.tenant || 'Tenant'));
          pdf.setCreator('BISCS India Rent Receipt Generator');
          var page;
          months.forEach(function (r, idx) {
            if (idx % 2 === 0) {
              page = pdf.addPage([W, H]);
              if (months[idx + 1]) page.drawLine({ start: { x: M, y: H / 2 }, end: { x: W - M, y: H / 2 }, thickness: 0.8, color: line, dashArray: [5, 4] });
            }
            var top = idx % 2 === 0 ? H - M : H - M - boxH - gap, x0 = M, y0 = top - boxH;
            page.drawRectangle({ x: x0, y: y0, width: boxW, height: boxH, borderColor: line, borderWidth: 1.2 });
            page.drawRectangle({ x: x0, y: y0, width: 5, height: boxH, color: accC });
            var px = x0 + 26, pr = x0 + boxW - 22;
            page.drawText('RENT RECEIPT', { x: px, y: top - 40, size: 17, font: B, color: accC });
            page.drawText(S('For the month of ' + r.label), { x: px, y: top - 56, size: 9.5, font: F, color: grey });
            var t1 = S('Receipt no. ' + r.no), t2 = S('Date: ' + r.date);
            page.drawText(t1, { x: pr - B.widthOfTextAtSize(t1, 10), y: top - 38, size: 10, font: B, color: dark });
            page.drawText(t2, { x: pr - F.widthOfTextAtSize(t2, 10), y: top - 53, size: 10, font: F, color: dark });
            page.drawLine({ start: { x: px, y: top - 68 }, end: { x: pr, y: top - 68 }, thickness: 0.7, color: line });
            // body paragraph with bold runs, word-wrapped
            var segs = [['Received with thanks from ', 0], [d.tenant || 'Tenant name', 1], [' a sum of ', 0], ['Rs. ' + money0(rent), 1], [' (' + amountWords(rent) + ') by ', 0], [d.mode, 1],
              [d.ref ? ' (ref. ' + d.ref + ')' : '', 0], [' towards rent for the period ', 0], [r.period, 1], [' for the property at ', 0], [d.address || 'Property address', 1], ['.', 0]];
            var size = 11.5, lh = 19, maxW = pr - px, cx = px, cy = top - 94;
            segs.forEach(function (sg) {
              var font = sg[1] ? B : F;
              S(sg[0]).split(/(\s+)/).forEach(function (w) {
                if (!w) return;
                var ww = font.widthOfTextAtSize(w, size);
                if (/^\s+$/.test(w)) { if (cx > px) cx += font.widthOfTextAtSize(' ', size); return; }
                if (cx + ww > px + maxW && cx > px) { cx = px; cy -= lh; }
                page.drawText(w, { x: cx, y: cy, size: size, font: font, color: dark });
                cx += ww;
              });
            });
            // footer: landlord block + stamp + signature
            var fy = y0 + 26;
            var ll = [['Landlord: ', d.landlord || 'Landlord name']];
            if (d.pan) ll.push(['PAN: ', d.pan]);
            if (d.landlordAddr) ll.push(['', d.landlordAddr]);
            if (d.place) ll.push(['Place: ', d.place]);
            ll.reverse().forEach(function (l, i) {
              var yy = fy + i * 15, lx = px;
              if (l[0]) { page.drawText(l[0], { x: lx, y: yy, size: 10, font: F, color: grey }); lx += F.widthOfTextAtSize(l[0], 10); }
              var txt = S(l[1]);
              while (txt.length > 4 && F.widthOfTextAtSize(txt, 10) > 300) txt = txt.slice(0, -2);
              page.drawText(txt + (txt.length < S(l[1]).length ? '...' : ''), { x: lx, y: yy, size: 10, font: l[0] ? B : F, color: dark });
            });
            var sx = pr - 150;
            page.drawLine({ start: { x: sx, y: fy + 10 }, end: { x: pr, y: fy + 10 }, thickness: 0.8, color: grey });
            var sl = 'Signature of landlord';
            page.drawText(sl, { x: sx + (150 - F.widthOfTextAtSize(sl, 9)) / 2, y: fy - 2, size: 9, font: F, color: grey });
            if (d.stamp) {
              var bx = sx - 74, by = fy - 4;
              page.drawRectangle({ x: bx, y: by, width: 58, height: 64, borderColor: L.rgb(0.6, 0.64, 0.7), borderWidth: 0.9, borderDashArray: [3, 3] });
              ['REVENUE', 'STAMP'].forEach(function (t, i) { page.drawText(t, { x: bx + (58 - F.widthOfTextAtSize(t, 7)) / 2, y: by + 36 - i * 10, size: 7, font: F, color: L.rgb(0.6, 0.64, 0.7) }); });
            }
          });
          return pdf.save();
        });
      });
    });
  }

  register('rent-receipt-generator', function (root) {
    injectCSS();
    var KEY = 'bt-rent-receipt-draft';
    var D = rentNormalize(loadJSON(KEY));
    var wrap = h('div.off-wrap.off-rr');
    root.appendChild(wrap);
    var status = h('span.off-status', { 'aria-live': 'polite', text: 'Autosaves on this device' });
    var printBtn = btn('btn-primary', 'download', 'Print / Save as PDF');
    var pdfBtn = btn('', 'file-output', 'Download all as one PDF');
    var bar = h('div.off-bar.no-print', null, [printBtn, pdfBtn,
      btn('btn-ghost', 'sparkles', 'Sample', function () { if (!confirm('Replace all fields with sample data?')) return; D = rentSample(); build(); changed(); }),
      h('span.spacer'), status]);
    wrap.appendChild(bar);
    watchBar(wrap, bar);
    var editor = h('div.off-stack.no-print');
    var sheetHost = h('div.off-scale');
    var pwrap = h('div.off-pwrap', null, [sheetHost]);
    var badge = h('span.badge');
    var preview = h('div.off-preview', { tabindex: '0', role: 'region', 'aria-label': 'Receipts preview' }, [h('div.off-preview-h.no-print', null, [h('h3', { text: 'Receipts preview' }), badge]), pwrap]);
    wrap.appendChild(h('div.off-cols', null, [editor, h('div.off-side', null, [h('div.off-sticky', null, [preview])])]));
    var fit = scaler(pwrap, sheetHost, 794);

    function bound(type, key, attrs, opts) {
      var el;
      if (type === 'select') el = select(opts, D[key]);
      else if (type === 'textarea') { el = textarea(D[key], Object.assign({ rows: 2 }, attrs || {})); el.style.minHeight = '64px'; }
      else el = input(type, D[key], attrs);
      el.setAttribute('data-k', key);
      return el;
    }
    var notes, info;
    function build() {
      editor.innerHTML = '';
      var years = [];
      for (var y = new Date().getFullYear() - 6; y <= new Date().getFullYear() + 2; y++) years.push([String(y), String(y)]);
      var stampC = checkbox('Show revenue stamp box', D.stamp); stampC.input.setAttribute('data-k', 'stamp');
      editor.appendChild(card('Tenant & landlord', [h('div.off-grid2', null, [
        field('Tenant name', bound('text', 'tenant', { autocomplete: 'name' })),
        field('Landlord name', bound('text', 'landlord')),
        field('Landlord PAN', bound('text', 'pan', { maxlength: 10, autocapitalize: 'characters', spellcheck: 'false', placeholder: 'ABCDE1234F' })),
        field('Place (city)', bound('text', 'place')),
        field('Rented property address', bound('textarea', 'address'), null, 'full'),
        field('Landlord address (optional)', bound('textarea', 'landlordAddr'), null, 'full')
      ])]));
      editor.appendChild(card('Rent & period', [h('div.off-grid2', null, [
        field('Monthly rent (₹)', bound('number', 'rent', { min: 0, inputmode: 'decimal' })),
        field('Payment mode', bound('select', 'mode', null, PAY_MODES)),
        field('From month', bound('select', 'fromM', null, monthOptions())), field('From year', bound('select', 'fromY', null, years)),
        field('To month', bound('select', 'toM', null, monthOptions())), field('To year', bound('select', 'toY', null, years)),
        field('Cheque no. / UTR (optional)', bound('text', 'ref')),
        field('Receipt date', bound('select', 'dateMode', null, [['last', 'Last day of each month'], ['first', 'First day of each month']])),
        field('Receipt no. prefix', bound('text', 'prefix', { maxlength: 12 })),
        field('First receipt number', bound('number', 'startNo', { min: 0, inputmode: 'numeric' }))
      ]), h('div.off-grid2', null, [stampC, h('div.field', null, [h('label', { 'for': 'off-rr-acc', text: 'Accent colour' }), (function () { var c = bound('color', 'accent'); c.id = 'off-rr-acc'; return c; })()])])]));
      info = h('div');
      notes = h('div', { style: { display: 'grid', gap: '10px' } });
      editor.appendChild(card('Summary', [info, notes]));
      changed(true);
    }
    function onEdit(e) {
      var t = e.target, k = t.getAttribute && t.getAttribute('data-k');
      if (!k) return;
      var v = t.type === 'checkbox' ? t.checked : t.value;
      if (k === 'pan') { var up = String(v).toUpperCase(); if (up !== v) { var pos = t.selectionStart; t.value = up; try { t.setSelectionRange(pos, pos); } catch (er) { /* ignore */ } } v = up; }
      D[k] = v;
      changed();
    }
    editor.addEventListener('input', onEdit);
    editor.addEventListener('change', function (e) { if (e.target.tagName === 'SELECT' || e.target.type === 'checkbox' || e.target.type === 'color') onEdit(e); });
    var saveT = 0;
    function changed(skipSave) {
      var months = rentMonths(D), rent = BT.num(D.rent) || 0, annual = rent * 12, total = rent * months.length;
      info.innerHTML = '<div class="stats"><div class="stat"><div class="label">Receipts</div><div class="value">' + months.length + '</div></div>' +
        '<div class="stat"><div class="label">Pages (2 per A4)</div><div class="value">' + Math.ceil(months.length / 2) + '</div></div>' +
        '<div class="stat"><div class="label">Total rent</div><div class="value">₹' + money0(total) + '</div></div></div>';
      var n = [];
      if (!months.length) n.push(['warn', 'The “To” month must be the same as or after the “From” month.']);
      var panOk = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(D.pan || '');
      if (annual > 100000 && !D.pan) n.push(['warn', 'Annual rent is ₹' + money0(annual) + ' (above ₹1,00,000), so your employer will need the landlord’s PAN for your HRA claim. If the landlord has no PAN, a signed declaration from them is usually accepted.']);
      else if (D.pan && !panOk) n.push(['warn', 'The PAN should look like ABCDE1234F (5 letters, 4 digits, 1 letter).']);
      else if (annual > 100000) n.push(['ok', 'Landlord PAN included, as needed when annual rent is above ₹1,00,000.']);
      if (/cash/i.test(D.mode) && rent > 5000) n.push(['warn', 'Cash payment above ₹5,000: affix a ₹1 revenue stamp on each receipt and have the landlord sign across it.']);
      if (months.length >= 36) n.push(['warn', 'Up to 36 receipts are generated at a time.']);
      notes.innerHTML = n.map(function (x) { return '<div class="notice ' + x[0] + '">' + BT.icon(x[0] === 'ok' ? 'check' : 'info') + '<span>' + esc(x[1]) + '</span></div>'; }).join('') +
        '<p class="small muted" style="margin:0">Keep receipts for the full financial year (April to March). Requirements can vary by employer, so check with your HR or tax advisor.</p>';
      sheetHost.innerHTML = months.length ? rentHtml(D, months) : '<div class="off-sheet off-rr-page" style="display:grid;place-items:center;color:#9ca3af">No receipts for this range</div>';
      badge.textContent = months.length + ' receipt' + (months.length === 1 ? '' : 's') + ' · ' + Math.ceil(months.length / 2) + ' page' + (Math.ceil(months.length / 2) === 1 ? '' : 's');
      fit();
      if (!skipSave) {
        status.textContent = 'Saving…';
        clearTimeout(saveT);
        saveT = setTimeout(function () { status.textContent = store(KEY, JSON.stringify(D)) ? 'Draft saved on this device' : 'Could not save (storage full or blocked)'; }, 500);
      }
    }
    printBtn.addEventListener('click', function () {
      if (!rentMonths(D).length) { BT.toast('Choose a valid month range first', 'error'); return; }
      printDoc('Rent receipts' + (D.tenant ? ' - ' + D.tenant : ''));
    });
    pdfBtn.addEventListener('click', function () {
      if (!rentMonths(D).length) { BT.toast('Choose a valid month range first', 'error'); return; }
      BT.busy(pdfBtn, function () {
        return rentPdf(D).then(function (bytes) { BT.download(new Blob([bytes], { type: 'application/pdf' }), 'rent-receipts-' + slug(D.tenant || 'tenant') + '.pdf'); BT.toast('PDF downloaded'); });
      }, 'Building PDF…');
    });
    window.addEventListener('afterprint', function () { fit(); });
    build();
    BT.rentDebug = { data: function () { return D; }, months: function () { return rentMonths(D); }, pdf: function () { return rentPdf(D); } };
  });
  BT.office.rentMonths = rentMonths;

  // ================================================ EXCEL & CSV CONVERTER
  /** Pick the most consistent delimiter among , ; TAB | in the first lines. */
  function detectDelimiter(text) {
    var cands = [',', ';', '\t', '|'], sample = text.slice(0, 64 * 1024);
    var best = ',', bestScore = -1;
    cands.forEach(function (c) {
      var counts = [], n = 0, q = false;
      for (var i = 0; i < sample.length && counts.length < 30; i++) {
        var ch = sample[i];
        if (ch === '"') q = !q;
        else if (!q && ch === c) n++;
        else if (!q && (ch === '\n' || ch === '\r')) {
          if (ch === '\r' && sample[i + 1] === '\n') i++;
          counts.push(n); n = 0;
        }
      }
      if (n || !counts.length) counts.push(n);
      var freq = {};
      counts.forEach(function (k) { if (k > 0) freq[k] = (freq[k] || 0) + 1; });
      var mode = 0, modeN = 0;
      Object.keys(freq).forEach(function (k) { if (freq[k] > modeN || (freq[k] === modeN && +k > mode)) { mode = +k; modeN = freq[k]; } });
      var score = mode ? modeN * 1000 + mode : -1;
      if (score > bestScore) { bestScore = score; best = c; }
    });
    return best;
  }
  /** RFC 4180 parser: quoted fields, doubled quotes, embedded delimiters and newlines, CRLF/LF/CR. */
  function parseCSV(text, delim) {
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    delim = delim || detectDelimiter(text);
    var rows = [], row = [], f = '', i = 0, n = text.length, q = false, c;
    while (i < n) {
      c = text[i];
      if (q) {
        if (c === '"') {
          if (text[i + 1] === '"') { f += '"'; i += 2; continue; }
          q = false; i++; continue;
        }
        f += c; i++; continue;
      }
      if (c === '"' && f === '') { q = true; i++; continue; }
      if (c === delim) { row.push(f); f = ''; i++; continue; }
      if (c === '\r' || c === '\n') {
        row.push(f); rows.push(row); row = []; f = '';
        if (c === '\r' && text[i + 1] === '\n') i++;
        i++; continue;
      }
      f += c; i++;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return { rows: rows, delimiter: delim };
  }
  function csvField(v, delim) {
    var s = v == null ? '' : String(v);
    return (s.indexOf(delim) >= 0 || /["\r\n]/.test(s) || /^\s|\s$/.test(s)) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCSV(rows, delim) { return rows.map(function (r) { return r.map(function (v) { return csvField(v, delim); }).join(delim); }).join('\r\n') + '\r\n'; }

  function fmtDate(d) {
    if (!(d instanceof Date) || isNaN(d)) return '';
    var Y = d.getUTCFullYear(), hh = d.getUTCHours(), mi = d.getUTCMinutes(), ss = d.getUTCSeconds();
    var time = pad2(hh) + ':' + pad2(mi) + (ss ? ':' + pad2(ss) : '');
    if (Y < 1900) return time; // Excel time-only values
    var date = Y + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
    return hh || mi || ss ? date + ' ' + time : date;
  }
  function fmtCell(v) {
    if (v == null) return '';
    if (typeof v === 'number') return isFinite(v) ? String(parseFloat(v.toPrecision(15))) : String(v);
    if (v instanceof Date) return fmtDate(v);
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    return String(v);
  }
  function excelValue(v) {
    if (v == null) return null;
    if (v instanceof Date || typeof v !== 'object') return v;
    if (v.richText) return v.richText.map(function (t) { return t.text; }).join('');
    if ('formula' in v || 'sharedFormula' in v) return v.result === undefined ? null : excelValue(v.result);
    if (v.hyperlink !== undefined) return excelValue(v.text);
    if (v.error) return v.error;
    if (v.text !== undefined) return excelValue(v.text);
    return String(v);
  }
  /** Turn text like "42", "3.5", "2024-01-31" into typed values for XLSX output. */
  function typedValue(s) {
    if (typeof s !== 'string') return s;
    var t = s.trim();
    if (t === '') return null;
    if (/^-?(0|[1-9]\d{0,14})(\.\d+)?$/.test(t)) return Number(t);
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(t);
    if (m && +m[2] >= 1 && +m[2] <= 12 && +m[3] >= 1 && +m[3] <= 31) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)));
    return s;
  }
  function colName(i) { var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function sheetName(n, used) {
    var b = String(n || 'Sheet').replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 31).trim() || 'Sheet', s = b, k = 2;
    while (used[s.toLowerCase()]) { s = b.slice(0, 28) + ' ' + k++; }
    used[s.toLowerCase()] = 1;
    return s;
  }
  function uniqueKeys(heads) {
    var seen = {};
    return heads.map(function (hd, i) {
      var k = String(hd == null ? '' : fmtCell(hd)).trim() || 'Column ' + (i + 1), b = k, n = 2;
      while (seen[k]) k = b + '_' + n++;
      seen[k] = 1;
      return k;
    });
  }
  function readSpreadsheet(file) {
    var name = file.name.toLowerCase();
    if (/\.xls$/.test(name)) return Promise.reject(new Error('Old binary .xls files are not supported. Open the file in Excel, LibreOffice or Google Sheets and save it as .xlsx or .csv, then try again.'));
    if (/\.(xlsx|xlsm)$/.test(name)) {
      return Promise.all([BT.loadLib('exceljs'), BT.readFile(file)]).then(function (r) {
        var wb = new window.ExcelJS.Workbook();
        return wb.xlsx.load(r[1]).then(function () {
          var sheets = [];
          wb.worksheets.forEach(function (ws) {
            var rows = [];
            ws.eachRow({ includeEmpty: false }, function (row, rn) {
              var arr = [];
              row.eachCell({ includeEmpty: false }, function (cell, cn) { arr[cn - 1] = excelValue(cell.value); });
              for (var i = 0; i < arr.length; i++) if (arr[i] === undefined) arr[i] = null;
              rows[rn - 1] = arr;
            });
            for (var i = 0; i < rows.length; i++) if (!rows[i]) rows[i] = [];
            sheets.push({ name: ws.name, rows: rows, typed: true });
          });
          if (!sheets.length) throw new Error('This workbook has no worksheets');
          return { sheets: sheets, kind: 'xlsx' };
        });
      }, function (e) { throw e; }).catch(function (e) {
        if (/no worksheets|not supported/.test(e.message)) throw e;
        throw new Error('Could not read this Excel file. It may be password protected or damaged. (' + (e.message || e) + ')');
      });
    }
    return BT.readFile(file, 'text').then(function (text) {
      if (/\.json$/.test(name)) {
        var data = JSON.parse(text);
        if (data && !Array.isArray(data) && typeof data === 'object') {
          var arrKey = Object.keys(data).filter(function (k) { return Array.isArray(data[k]); })[0];
          if (arrKey) data = data[arrKey];
        }
        if (!Array.isArray(data)) throw new Error('JSON must be an array of objects or an array of arrays');
        var rows;
        function val(v) { return v == null ? null : typeof v === 'object' ? JSON.stringify(v) : v; }
        if (data.every(Array.isArray)) rows = data.map(function (r) { return r.map(val); });
        else {
          var keys = [], seen = {};
          data.forEach(function (o) { if (o && typeof o === 'object') Object.keys(o).forEach(function (k) { if (!seen[k]) { seen[k] = 1; keys.push(k); } }); });
          rows = [keys].concat(data.map(function (o) { return keys.map(function (k) { return o && typeof o === 'object' ? val(o[k]) : null; }); }));
        }
        return { sheets: [{ name: BT.baseName(file.name), rows: rows, typed: true }], kind: 'json' };
      }
      var p = parseCSV(text, /\.tsv$/.test(name) ? '\t' : null);
      return { sheets: [{ name: BT.baseName(file.name), rows: p.rows, typed: false }], kind: 'csv', delimiter: p.delimiter };
    });
  }
  function buildXlsx(sheets, opts) {
    return BT.loadLib('exceljs').then(function (X) {
      var wb = new X.Workbook();
      wb.creator = 'BISCS India Excel & CSV Converter';
      var used = {};
      sheets.forEach(function (s) {
        var ws = wb.addWorksheet(sheetName(s.name, used));
        var widths = [];
        s.rows.forEach(function (r, ri) {
          var vals = r.map(function (v) { return !s.typed && opts.detect && !(opts.header && ri === 0) ? typedValue(v) : (v === '' ? null : v); });
          var row = ws.addRow(vals);
          vals.forEach(function (v, ci) {
            if (v instanceof Date) row.getCell(ci + 1).numFmt = (v.getUTCHours() || v.getUTCMinutes()) ? 'yyyy-mm-dd hh:mm' : 'yyyy-mm-dd';
            if (ri < 200) { var l = fmtCell(v).length; widths[ci] = Math.max(widths[ci] || 6, Math.min(48, l + 2)); }
          });
        });
        widths.forEach(function (w, i) { ws.getColumn(i + 1).width = w; });
        if (opts.header && s.rows.length) { ws.getRow(1).font = { bold: true }; ws.views = [{ state: 'frozen', ySplit: 1 }]; }
      });
      return wb.xlsx.writeBuffer();
    });
  }

  register('excel-csv-converter', function (root) {
    injectCSS();
    var wrap = h('div.off-wrap.off-xc');
    root.appendChild(wrap);
    var S = { book: null, file: null, cur: 0, header: true, q: '', sort: null, view: null, rh: 34 };
    var dz = BT.dropzone({ accept: '.xlsx,.xlsm,.xls,.csv,.tsv,.txt,.json', title: 'Choose an Excel, CSV or JSON file', hint: 'XLSX, CSV, TSV or JSON · or drag and drop it here', icon: 'sheet', color: '#0e7490', onFiles: function (f) { load(f[0]); } });
    var msg = h('div');
    var app = h('div.hidden');
    wrap.appendChild(dz); wrap.appendChild(msg); wrap.appendChild(app);
    wrap.appendChild(h('p.small.muted', { style: { marginTop: '12px' }, text: 'Files are opened on your device; nothing is uploaded. Large files (50,000+ rows) are fine: the table only draws the rows you can see.' }));

    var fileBar = h('div.off-file');
    var headerC = checkbox('First row is the header', true);
    var search = input('search', '', { placeholder: 'Search all cells…', 'aria-label': 'Search rows' });
    var stats = h('div.stats', { style: { marginBottom: '12px' } });
    var tabs = h('div.off-xc-tabs', { role: 'tablist', 'aria-label': 'Sheets' });
    var grid = h('div.off-xc-grid', { tabindex: '0', role: 'region', 'aria-label': 'Spreadsheet data' });
    var table = h('table');
    grid.appendChild(table);
    var csvDelim = select([[',', 'Comma ( , )'], [';', 'Semicolon ( ; )'], ['\t', 'Tab'], ['|', 'Pipe ( | )']], ',', { 'aria-label': 'CSV delimiter' });
    var bomC = checkbox('UTF-8 BOM (for Excel)', true);
    var detectC = checkbox('Detect numbers & dates', true);
    var viewOnlyC = checkbox('Only rows matching search', false);
    var xlsxBtn = btn('btn-primary btn-sm', 'download', 'Download .xlsx');
    var csvBtn = btn('btn-sm', 'download', 'Download .csv');
    var jsonBtn = btn('btn-sm', 'download', 'Download .json');
    var htmlBtn = btn('btn-sm', 'copy', 'Copy as table');
    var exp = card('Convert & export', [
      h('div.off-xc-exp', null, [
        h('div.opt', null, [h('b', { html: BT.icon('sheet') + 'Excel workbook' }), h('span.small.muted', { text: 'All sheets, header row bold and frozen.' }), detectC, xlsxBtn]),
        h('div.opt', null, [h('b', { html: BT.icon('file-text') + 'CSV (current sheet)' }), csvDelim, bomC, csvBtn]),
        h('div.opt', null, [h('b', { html: BT.icon('braces') + 'JSON (current sheet)' }), h('span.small.muted', { text: 'Array of objects using the header row, or array of arrays.' }), jsonBtn]),
        h('div.opt', null, [h('b', { html: BT.icon('table') + 'HTML table' }), h('span.small.muted', { text: 'Paste into Word, Gmail or Google Docs with formatting.' }), htmlBtn])
      ]),
      h('div', { style: { marginTop: '12px' } }, [viewOnlyC])
    ]);
    app.appendChild(fileBar);
    app.appendChild(h('div.card', { style: { marginTop: '16px' } }, [
      h('div.off-xc-tools', null, [h('div.grow', { html: BT.icon('search') }, [search]), headerC]),
      stats, tabs, grid
    ]));
    app.appendChild(h('div', { style: { marginTop: '16px' } }, [exp]));

    function sheet() { return S.book && S.book.sheets[S.cur]; }
    function disp(s) {
      if (!s.disp) s.disp = s.rows.map(function (r) { return r.map(fmtCell); });
      return s.disp;
    }
    function ncols(s) { if (s.nc == null) s.nc = s.rows.reduce(function (a, r) { return Math.max(a, r.length); }, 0); return s.nc; }
    function headers(s) {
      var n = ncols(s);
      if (S.header && s.rows.length) { var hd = disp(s)[0]; var out = []; for (var i = 0; i < n; i++) out.push(hd[i] || ''); return out; }
      var o = []; for (var j = 0; j < n; j++) o.push(colName(j)); return o;
    }
    function dataStart() { return S.header ? 1 : 0; }
    var collator = window.Intl ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }) : null;
    function computeView() {
      var s = sheet(), D0 = dataStart(), dd = disp(s), idx = [];
      var q = S.q.trim().toLowerCase();
      if (q) {
        if (!s.lc) s.lc = dd.map(function (r) { return r.join('\u0001').toLowerCase(); });
        for (var i = D0; i < s.rows.length; i++) if (s.lc[i].indexOf(q) >= 0) idx.push(i);
      } else for (var k = D0; k < s.rows.length; k++) idx.push(k);
      if (S.sort) {
        var c = S.sort.col, dir = S.sort.dir;
        idx.sort(function (a, b) {
          var va = s.rows[a][c], vb = s.rows[b][c];
          var ea = va == null || va === '', eb = vb == null || vb === '';
          if (ea || eb) return ea === eb ? a - b : ea ? 1 : -1;
          var na = va instanceof Date ? +va : typeof va === 'number' ? va : (!s.typed && /^-?\d+(\.\d+)?$/.test(String(va).trim()) ? +va : NaN);
          var nb = vb instanceof Date ? +vb : typeof vb === 'number' ? vb : (!s.typed && /^-?\d+(\.\d+)?$/.test(String(vb).trim()) ? +vb : NaN);
          var r = !isNaN(na) && !isNaN(nb) ? na - nb : collator ? collator.compare(dd[a][c] || '', dd[b][c] || '') : String(dd[a][c]).localeCompare(String(dd[b][c]));
          return (r || a - b) * (r ? dir : 1);
        });
      }
      S.view = idx;
    }
    function colWidths(s) {
      if (s.w && s.wh === S.header) return s.w;
      var n = ncols(s), dd = disp(s), hd = headers(s), w = [];
      for (var c = 0; c < n; c++) {
        var m = String(hd[c] || '').length + 3;
        var step = Math.max(1, Math.floor(dd.length / 300));
        for (var r = 0; r < dd.length; r += (r < 200 ? 1 : step)) { var l = (dd[r][c] || '').length; if (l > m) m = l; }
        if (dd.length) { var ll = (dd[dd.length - 1][c] || '').length; if (ll > m) m = ll; }
        w.push(clamp(Math.round(m * 8.2 + 30), 80, 360));
      }
      s.w = w; s.wh = S.header;
      return w;
    }
    function isNum(v) { return typeof v === 'number' || v instanceof Date; }
    function hl(text) {
      var t = esc(text), q = S.q.trim();
      if (!q) return t;
      var lo = text.toLowerCase(), ql = q.toLowerCase(), out = '', i = 0, j;
      while ((j = lo.indexOf(ql, i)) >= 0) { out += esc(text.slice(i, j)) + '<mark>' + esc(text.slice(j, j + q.length)) + '</mark>'; i = j + q.length; }
      return out + esc(text.slice(i));
    }
    function drawHead() {
      var s = sheet(), w = colWidths(s), hd = headers(s);
      var total = 64 + w.reduce(function (a, b) { return a + b; }, 0);
      table.style.width = total + 'px';
      var cg = '<colgroup><col style="width:64px">' + w.map(function (x) { return '<col style="width:' + x + 'px">'; }).join('') + '</colgroup>';
      var th = '<thead><tr><th class="rn" scope="col">#</th>' + hd.map(function (x, i) {
        var srt = S.sort && S.sort.col === i ? (S.sort.dir > 0 ? '▲' : '▼') : '';
        return '<th scope="col" data-col="' + i + '" tabindex="0" title="Sort by ' + esc(x || colName(i)) + '" aria-sort="' + (srt ? (S.sort.dir > 0 ? 'ascending' : 'descending') : 'none') + '">' + esc(x || (S.header ? 'Column ' + (i + 1) : colName(i))) + (srt ? '<span class="s">' + srt + '</span>' : '') + '</th>';
      }).join('') + '</tr></thead>';
      table.innerHTML = cg + th + '<tbody></tbody>';
      drawBody(true);
    }
    var lastRange = '';
    function drawBody(force) {
      var s = sheet(), v = S.view, tb = table.tBodies[0];
      if (!tb) return;
      var n = ncols(s), dd = disp(s);
      if (!v.length) { tb.innerHTML = '<tr><td colspan="' + (n + 1) + '" class="off-xc-empty" style="height:auto">' + (S.q ? 'No rows match your search.' : 'This sheet is empty.') + '</td></tr>'; lastRange = ''; return; }
      var rh = S.rh, top = grid.scrollTop, vh = grid.clientHeight || 520;
      var start = Math.max(0, Math.floor(top / rh) - 12), end = Math.min(v.length, start + Math.ceil(vh / rh) + 30);
      var key = start + ':' + end;
      if (!force && key === lastRange) return;
      lastRange = key;
      var html = '<tr class="sp"><td colspan="' + (n + 1) + '" style="height:' + (start * rh) + 'px"></td></tr>';
      for (var i = start; i < end; i++) {
        var ri = v[i], raw = s.rows[ri], row = dd[ri];
        html += '<tr><td class="rn">' + (ri + 1) + '</td>';
        for (var c = 0; c < n; c++) {
          var t = row[c] || '';
          var cls = t === '' ? '' : (s.typed ? isNum(raw[c]) : /^-?\d[\d,]*(\.\d+)?%?$/.test(t)) ? 'n' : '';
          html += '<td' + (cls ? ' class="' + cls + '"' : '') + (t.length > 40 ? ' title="' + esc(t.slice(0, 500)) + '"' : '') + '>' + hl(t) + '</td>';
        }
        html += '</tr>';
      }
      html += '<tr class="sp"><td colspan="' + (n + 1) + '" style="height:' + ((v.length - end) * rh) + 'px"></td></tr>';
      tb.innerHTML = html;
      if (!S.measured) {
        var tr = tb.rows[1];
        if (tr) { var r = tr.getBoundingClientRect().height; if (r > 10 && Math.abs(r - S.rh) > 0.5) { S.rh = r; S.measured = true; drawBody(true); return; } S.measured = true; }
      }
    }
    grid.addEventListener('scroll', function () { requestAnimationFrame(function () { drawBody(false); }); }, { passive: true });
    function sortBy(col) {
      if (!S.sort || S.sort.col !== col) S.sort = { col: col, dir: 1 };
      else if (S.sort.dir === 1) S.sort.dir = -1;
      else S.sort = null;
      refresh();
      var th = table.querySelector('th[data-col="' + col + '"]'); if (th) th.focus({ preventScroll: true });
    }
    table.addEventListener('click', function (e) { var th = e.target.closest('th[data-col]'); if (th) sortBy(+th.getAttribute('data-col')); });
    table.addEventListener('keydown', function (e) { var th = e.target.closest('th[data-col]'); if (th && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); sortBy(+th.getAttribute('data-col')); } });
    function drawStats() {
      var s = sheet(), total = Math.max(0, s.rows.length - dataStart());
      stats.innerHTML = '<div class="stat"><div class="label">Rows</div><div class="value">' + total.toLocaleString('en-IN') + '</div></div>' +
        '<div class="stat"><div class="label">Columns</div><div class="value">' + ncols(s) + '</div></div>' +
        '<div class="stat"><div class="label">' + (S.q ? 'Matching' : 'Sheets') + '</div><div class="value">' + (S.q ? S.view.length.toLocaleString('en-IN') : S.book.sheets.length) + '</div></div>';
      viewOnlyC.classList.toggle('hidden', !S.q && !S.sort);
      viewOnlyC.querySelector('span').textContent = S.q ? 'Export only the ' + S.view.length.toLocaleString('en-IN') + ' rows matching your search (in sorted order)' : 'Export rows in the current sorted order';
    }
    function refresh() { computeView(); drawStats(); grid.scrollTop = Math.min(grid.scrollTop, S.view.length * S.rh); drawHead(); }
    function drawTabs() {
      tabs.innerHTML = '';
      tabs.classList.toggle('hidden', S.book.sheets.length < 2);
      S.book.sheets.forEach(function (s, i) {
        var b = h('button', { type: 'button', role: 'tab', 'aria-selected': String(i === S.cur), html: esc(s.name) + ' <span class="c">' + s.rows.length.toLocaleString('en-IN') + '</span>' });
        b.addEventListener('click', function () { S.cur = i; S.sort = null; grid.scrollTop = 0; drawTabs(); refresh(); });
        tabs.appendChild(b);
      });
    }
    search.addEventListener('input', BT.debounce(function () { S.q = search.value; grid.scrollTop = 0; refresh(); }, 160));
    headerC.input.addEventListener('change', function () { S.header = headerC.input.checked; S.sort = null; refresh(); });

    function load(file) {
      msg.innerHTML = '';
      var b = h('div.card', { html: '<div style="display:flex;align-items:center;gap:10px"><span class="spinner"></span> Reading ' + esc(file.name) + '…</div>' });
      msg.appendChild(b);
      readSpreadsheet(file).then(function (book) {
        msg.innerHTML = '';
        S.book = book; S.file = file; S.cur = 0; S.sort = null; S.q = ''; search.value = '';
        S.header = book.sheets[0].rows.length > 1 || book.kind === 'json';
        headerC.input.checked = S.header;
        if (book.delimiter) csvDelim.value = book.delimiter;
        fileBar.innerHTML = '';
        fileBar.appendChild(h('span.fi', { html: BT.icon('sheet') }));
        fileBar.appendChild(h('div.nm', { html: '<b>' + esc(file.name) + '</b><span class="small muted">' + BT.fmtBytes(file.size) + ' · ' + book.kind.toUpperCase() +
          (book.delimiter ? ' · delimiter: ' + ({ ',': 'comma', ';': 'semicolon', '\t': 'tab', '|': 'pipe' }[book.delimiter]) : '') + ' · ' + book.sheets.length + ' sheet' + (book.sheets.length > 1 ? 's' : '') + '</span>' }));
        fileBar.appendChild(btn('btn-sm', 'upload', 'Open another file', function () { pickFile('.xlsx,.xlsm,.xls,.csv,.tsv,.txt,.json', load); }));
        dz.classList.add('hidden');
        app.classList.remove('hidden');
        drawTabs();
        grid.scrollTop = 0;
        refresh();
      }).catch(function (e) {
        msg.innerHTML = '<div class="notice warn" style="margin-top:12px">' + BT.icon('info') + '<span>' + esc(e.message || String(e)) + '</span></div>';
      });
    }
    function exportRows(s, useView) {
      var rows = s.rows;
      if (useView && s === sheet() && (S.q || S.sort)) {
        rows = (S.header && rows.length ? [rows[0]] : []).concat(S.view.map(function (i) { return s.rows[i]; }));
      }
      return rows;
    }
    function base() { return BT.baseName(S.file ? S.file.name : 'data'); }
    xlsxBtn.addEventListener('click', function () {
      BT.busy(xlsxBtn, function () {
        var sheets = S.book.sheets.map(function (s) { return { name: s.name, typed: s.typed, rows: exportRows(s, viewOnlyC.input.checked) }; });
        return buildXlsx(sheets, { header: S.header, detect: detectC.input.checked }).then(function (buf) {
          BT.download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), base() + '.xlsx');
          BT.toast('Excel file downloaded');
        });
      }, 'Building…');
    });
    csvBtn.addEventListener('click', function () {
      var s = sheet(), d = csvDelim.value;
      var rows = exportRows(s, viewOnlyC.input.checked).map(function (r) { var o = []; for (var i = 0; i < ncols(s); i++) o.push(fmtCell(r[i])); return o; });
      var text = toCSV(rows, d);
      BT.download(new Blob([(bomC.input.checked ? '﻿' : '') + text], { type: 'text/csv;charset=utf-8' }), base() + (S.book.sheets.length > 1 ? '-' + slug(s.name) : '') + (d === '\t' ? '.tsv' : '.csv'));
      BT.toast('CSV downloaded');
    });
    function jsonValue(v) { return v == null || v === '' ? null : v instanceof Date ? fmtDate(v) : v; }
    jsonBtn.addEventListener('click', function () {
      var s = sheet(), rows = exportRows(s, viewOnlyC.input.checked), n = ncols(s), out;
      if (S.header && rows.length) {
        var keys = uniqueKeys(headers(s));
        out = rows.slice(1).map(function (r) { var o = {}; for (var i = 0; i < n; i++) o[keys[i]] = s.typed ? jsonValue(r[i]) : (r[i] == null ? null : r[i]); return o; });
      } else out = rows.map(function (r) { var o = []; for (var i = 0; i < n; i++) o.push(s.typed ? jsonValue(r[i]) : (r[i] == null ? null : r[i])); return o; });
      BT.download(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }), base() + (S.book.sheets.length > 1 ? '-' + slug(s.name) : '') + '.json');
      BT.toast('JSON downloaded');
    });
    htmlBtn.addEventListener('click', function () {
      var s = sheet(), n = ncols(s), hd = headers(s);
      var idx = S.view.slice(0, 10000);
      var dd = disp(s);
      var html = '<table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:10pt"><thead><tr>' +
        hd.map(function (x) { return '<th style="background:#f3f4f6;text-align:left">' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        idx.map(function (i) { var r = dd[i], o = '<tr>'; for (var c = 0; c < n; c++) o += '<td>' + esc(r[c] || '') + '</td>'; return o + '</tr>'; }).join('') + '</tbody></table>';
      var tsv = [hd].concat(idx.map(function (i) { return dd[i]; })).map(function (r) { var o = []; for (var c = 0; c < n; c++) o.push(String(r[c] || '').replace(/[\t\r\n]+/g, ' ')); return o.join('\t'); }).join('\n');
      var note = S.view.length > 10000 ? ' (first 10,000 rows)' : '';
      if (navigator.clipboard && window.ClipboardItem && window.isSecureContext) {
        navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([tsv], { type: 'text/plain' }) })])
          .then(function () { BT.toast('Table copied' + note); }, function () { BT.copy(tsv, 'Copied as tab-separated text' + note); });
      } else BT.copy(tsv, 'Copied as tab-separated text' + note);
    });
    BT.excelDebug = { state: function () { return S; }, load: load };
  });
  BT.office.parseCSV = parseCSV;
  BT.office.detectDelimiter = detectDelimiter;
  BT.office.toCSV = toCSV;

  // ========================================================== WORD TO PDF
  var BAD_TAGS = { SCRIPT: 1, STYLE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, LINK: 1, META: 1, BASE: 1, FORM: 1, INPUT: 1, BUTTON: 1, TEXTAREA: 1, SELECT: 1, FRAME: 1, FRAMESET: 1, SVG: 1, MATH: 1, TEMPLATE: 1 };
  /** Strip anything executable from converted HTML: risky tags, on* handlers, javascript: URLs. */
  function sanitizeHtml(html) {
    var t = doc.createElement('template');
    t.innerHTML = String(html || '');
    var all = t.content.querySelectorAll('*');
    for (var i = all.length - 1; i >= 0; i--) {
      var el = all[i];
      if (BAD_TAGS[el.tagName.toUpperCase()]) { el.remove(); continue; }
      for (var j = el.attributes.length - 1; j >= 0; j--) {
        var a = el.attributes[j], n = a.name.toLowerCase(), v = String(a.value).replace(/[\s\u0000-\u001f]+/g, '').toLowerCase();
        if (n.indexOf('on') === 0 || n === 'style' || n === 'srcdoc' || n === 'formaction') el.removeAttribute(a.name);
        else if ((n === 'href' || n === 'src' || n === 'xlink:href' || n === 'action') && (/^(javascript|vbscript):/.test(v) || (/^data:/.test(v) && !(n === 'src' && /^data:image\/(png|jpe?g|gif|bmp|webp|x-emf|x-wmf|tiff)/.test(v))))) el.removeAttribute(a.name);
      }
      if (el.tagName === 'A' && el.getAttribute('href')) { el.setAttribute('rel', 'noopener noreferrer'); if (!/^#/.test(el.getAttribute('href'))) el.setAttribute('target', '_blank'); }
    }
    return t.innerHTML;
  }
  var WD_STYLE_MAP = [
    "p[style-name='Title'] => h1.title:fresh",
    "p[style-name='Subtitle'] => p.subtitle:fresh",
    "p[style-name='Quote'] => blockquote:fresh",
    "p[style-name='Intense Quote'] => blockquote:fresh",
    "r[style-name='Strong'] => strong",
    "p[style-name='Caption'] => p.caption:fresh"
  ];
  function wordToHtml(buf) {
    return BT.loadLib('mammoth').then(function (M) {
      return M.convertToHtml({ arrayBuffer: buf }, {
        styleMap: WD_STYLE_MAP,
        convertImage: M.images.imgElement(function (image) {
          return image.read('base64').then(function (b) { return { src: 'data:' + image.contentType + ';base64,' + b }; });
        })
      });
    }).then(function (r) { return { html: sanitizeHtml(r.value), messages: r.messages || [] }; });
  }
  function wordCss() { return CSS.split('\n').filter(function (l) { return l.indexOf('.off-wd-doc') === 0; }).join('\n'); }

  register('word-to-pdf', function (root) {
    injectCSS();
    var KEY = 'bt-word-to-pdf-opts';
    var O = Object.assign({ paper: 'a4', margin: 'normal', font: 'calibri', size: '11' }, loadJSON(KEY) || {});
    var S = { html: '', name: '', messages: [] };
    var wrap = h('div.off-wrap.off-wd');
    root.appendChild(wrap);
    var dz = BT.dropzone({ accept: '.docx,.doc', title: 'Choose a Word document (.docx)', hint: 'or drag and drop it here', icon: 'file-type-2', color: '#2b579a', onFiles: function (f) { load(f[0]); } });
    var msg = h('div');
    var intro = h('div.no-print', null, [dz, msg,
      h('div.notice', { style: { marginTop: '14px' }, html: BT.icon('info') + '<span>Text, headings, lists, tables, links and images are converted. Complex layouts such as text boxes, multiple columns, headers and footers, footnote placement and exact page breaks are simplified, so check the preview before saving.</span>' })]);
    wrap.appendChild(intro);
    var app = h('div.hidden');
    wrap.appendChild(app);

    var printBtn = btn('btn-primary', 'download', 'Download PDF');
    var htmlBtn = btn('', 'file-code', 'Download HTML');
    var newBtn = btn('btn-ghost', 'upload', 'Open another', function () { pickFile('.docx,.doc', load); });
    var nameEl = h('span.small.muted', { style: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px' } });
    var bar = h('div.off-bar.no-print', null, [printBtn, htmlBtn, newBtn, h('span.spacer'), nameEl]);
    app.appendChild(bar);
    watchBar(wrap, bar);
    var paperSeg = seg([['a4', 'A4'], ['letter', 'Letter']], O.paper, function (v) { O.paper = v; opts(); }, 'Paper size');
    var marginSel = select([['normal', 'Normal (2.54 cm)'], ['moderate', 'Moderate (1.9 cm)'], ['narrow', 'Narrow (1.27 cm)']], O.margin);
    var fontSel = select([['calibri', 'Calibri style (sans)'], ['serif', 'Cambria style (serif)'], ['times', 'Times New Roman'], ['arial', 'Arial']], O.font);
    var sizeSel = select([['10', '10 pt'], ['10.5', '10.5 pt'], ['11', '11 pt'], ['12', '12 pt']], O.size);
    marginSel.addEventListener('change', function () { O.margin = marginSel.value; opts(); });
    fontSel.addEventListener('change', function () { O.font = fontSel.value; opts(); });
    sizeSel.addEventListener('change', function () { O.size = sizeSel.value; opts(); });
    var statsEl = h('div.stats');
    var warnBox = h('div');
    var side = h('div.off-stack.no-print', null, [
      card('Page setup', [h('div.field', null, [h('span.label', { text: 'Paper' }), paperSeg]), field('Margins', marginSel), field('Body font', fontSel), field('Base font size', sizeSel),
        h('p.small.muted', { style: { margin: 0 }, text: 'In the print dialog choose “Save as PDF” as the destination. Turn off “Headers and footers” for a clean page.' })]),
      card('Document', [statsEl, warnBox])
    ]);
    var host = h('div.off-scale');
    var pwrap = h('div.off-pwrap', null, [host]);
    var pinfo = h('span.badge');
    var preview = h('div.off-preview', null, [h('div.off-preview-h.no-print', null, [h('h3', { text: 'Preview' }), pinfo]), pwrap]);
    app.appendChild(h('div.off-cols.doc-first', null, [h('div.off-side', null, [h('div.off-sticky', null, [preview])]), side]));
    var fit = scaler(pwrap, host, function () { return O.paper === 'letter' ? 816 : 794; });

    function cls() { return 'off-sheet off-wd-doc off-' + O.paper + ' m-' + O.margin + (O.font === 'calibri' ? '' : ' f-' + O.font); }
    function opts() { store(KEY, JSON.stringify(O)); render(); }
    function render() {
      if (!S.html) return;
      host.innerHTML = '<article class="' + cls() + '" style="font-size:' + (parseFloat(O.size) * 4 / 3).toFixed(2) + 'px">' + (S.html || '<p style="color:#9ca3af">This document has no text.</p>') + '</article>';
      var sheet = host.firstChild;
      var pad = { normal: 96, moderate: 72, narrow: 48 }[O.margin], ph = (O.paper === 'letter' ? 1056 : 1123) - pad * 2;
      var n = Math.max(1, Math.ceil((contentHeight(sheet, pad) - 2) / ph));
      for (var i = 1; i < n; i++) sheet.appendChild(h('div.off-pb', { style: { top: (pad + i * ph) + 'px' }, html: '<span>Page ' + (i + 1) + '</span>' }));
      pinfo.textContent = (O.paper === 'letter' ? 'Letter' : 'A4') + ' · about ' + n + ' page' + (n > 1 ? 's' : '');
      fit();
      // images load asynchronously: refit once they have size
      BT.$$('img', sheet).forEach(function (im) { if (!im.complete) im.addEventListener('load', function () { fit(); }, { once: true }); });
    }
    function load(file) {
      if (/\.doc$/i.test(file.name)) {
        msg.innerHTML = '<div class="notice warn" style="margin-top:12px">' + BT.icon('info') + '<span>Old .doc files (Word 97–2003) are not supported. Open it in Word, LibreOffice or Google Docs and save it as .docx, then try again.</span></div>';
        return;
      }
      msg.innerHTML = '<div class="card" style="margin-top:12px;display:flex;align-items:center;gap:10px"><span class="spinner"></span> Converting ' + esc(file.name) + '…</div>';
      BT.readFile(file).then(wordToHtml).then(function (r) {
        msg.innerHTML = '';
        S.html = r.html; S.messages = r.messages; S.name = BT.baseName(file.name);
        nameEl.textContent = file.name;
        intro.classList.add('hidden');
        app.classList.remove('hidden');
        render();
        var sheet = host.firstChild;
        var text = sheet.textContent || '';
        var words = (text.match(/\S+/g) || []).length;
        statsEl.innerHTML = [['Words', words.toLocaleString('en-IN')], ['Headings', BT.$$('h1,h2,h3,h4,h5,h6', sheet).length], ['Tables', BT.$$('table', sheet).length], ['Images', BT.$$('img', sheet).length]]
          .map(function (x) { return '<div class="stat"><div class="label">' + x[0] + '</div><div class="value">' + x[1] + '</div></div>'; }).join('');
        var ms = r.messages.filter(function (m) { return m && m.message; });
        warnBox.innerHTML = ms.length ? '<div class="notice warn" style="margin-top:12px;flex-direction:column;gap:6px"><b>' + ms.length + ' conversion note' + (ms.length > 1 ? 's' : '') + '</b><ul class="off-msgs">' +
          ms.slice(0, 50).map(function (m) { return '<li>' + esc(m.message) + '</li>'; }).join('') + '</ul></div>' :
          '<div class="notice ok" style="margin-top:12px">' + BT.icon('check') + '<span>Converted without warnings.</span></div>';
        if (!text.trim() && !BT.$$('img', sheet).length) BT.toast('No text was found in this document', 'error');
      }).catch(function (e) {
        console.error(e);
        msg.innerHTML = '<div class="notice warn" style="margin-top:12px">' + BT.icon('info') + '<span>Could not convert this file. Make sure it is a valid .docx document that is not password protected. (' + esc(e.message || String(e)) + ')</span></div>';
      });
    }
    printBtn.addEventListener('click', function () { printDoc(S.name || 'Document'); });
    htmlBtn.addEventListener('click', function () {
      var margins = { normal: '25.4mm', moderate: '19mm', narrow: '12.7mm' };
      var page = '@page{size:' + (O.paper === 'letter' ? 'letter' : 'A4') + ';margin:' + margins[O.margin] + '}';
      var out = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(S.name) + '</title><style>\n' +
        'body{margin:0;background:#eef0f4}*{box-sizing:border-box}\n' + wordCss() + '\n.off-wd-doc{margin:24px auto;background:#fff;box-shadow:0 10px 40px -16px rgba(0,0,0,.35);max-width:100%}\n' +
        page + '\n@media print{body{background:#fff}.off-wd-doc{margin:0;padding:0!important;width:auto!important;min-height:0!important;box-shadow:none}}\n' +
        '@media (max-width:840px){.off-wd-doc{width:auto!important;min-height:0!important;margin:0;padding:24px!important}}\n</style></head><body>\n<article class="' + cls().replace('off-sheet ', '') + '" style="font-size:' + (parseFloat(O.size) * 4 / 3).toFixed(2) + 'px">\n' + S.html + '\n</article>\n</body></html>\n';
      BT.download(new Blob([out], { type: 'text/html;charset=utf-8' }), S.name + '.html');
      BT.toast('HTML downloaded');
    });
    window.addEventListener('afterprint', function () { fit(); });
    BT.wordDebug = { load: load, state: function () { return S; } };
  });
  BT.office.sanitizeHtml = sanitizeHtml;

})();
