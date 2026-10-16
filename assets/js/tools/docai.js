/*
 * BISCS Tools — documents & smart image tools ("docai").
 *
 *   image-to-text  OCR with tesseract.js 6 (self-hosted engine and English,
 *                  Hindi and Bengali language data), optional searchable PDF.
 *   pdf-to-word    PDF -> DOCX: editable text (headings, lists, bold/italic,
 *                  page breaks) or an exact copy with every page as an image.
 *                  Scanned pages can be recognised with OCR.
 *   scan-to-pdf    Camera / photo document scanner: automatic edge detection,
 *                  draggable corners with a loupe, perspective correction and
 *                  filters in a Web Worker, PDF (pdf-lib) or JPG export.
 *   object-eraser  Content-aware fill: multi-scale PatchMatch inpainting
 *                  (Barnes et al. 2009) in a Web Worker, plus a fast fill.
 *
 * Everything runs locally in the browser. No file is ever uploaded and no
 * third-party service is called; all libraries are served from this site.
 *
 * Structure:
 *   1. Styles (scoped, prefix dai-)
 *   2. Small UI helpers and the shared workspace shell
 *   3. Workers (inline, Blob URL): scanner warp/filters, inpainting
 *   4. Document edge detection (main thread, ~400 px)
 *   5. PDF text layout model (lines, paragraphs, headings, lists)
 *   6. Tools
 */
(function () {
  'use strict';
  var BT = window.BT;
  if (!BT) return;
  var doc = document;
  var h = BT.h, esc = BT.esc, icon = BT.icon;
  var IMPLS = {};
  function register(id, fn) { IMPLS[id] = fn; BT.impl(id, fn); }

  // ================================================================ STYLES
  var CSS = [
    '.dai{--dai:#4f46e5}',
    '.dai-intro .dropzone{padding:56px 20px;min-height:260px;border-radius:24px;background:linear-gradient(180deg,var(--surface),var(--surface-2))}',
    '.dai-intro .dropzone strong{font-size:1.25rem}',
    '.dai-intro .dropzone .dz-icon{width:72px;height:72px;border-radius:20px}',
    '.dai-intro .dropzone .dz-icon svg{width:34px;height:34px}',
    '.dai-pick{margin-top:6px;pointer-events:none}',
    '.dai-alt{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:10px;margin-top:14px}',
    '.dai-alt .muted{font-size:.88rem}',
    '.dai-trust{display:flex;flex-wrap:wrap;justify-content:center;gap:8px 22px;margin:16px 0 0;color:var(--text-3);font-size:.86rem}',
    '.dai-trust span{display:inline-flex;align-items:center;gap:6px}.dai-trust .icon{color:var(--ok);width:16px;height:16px}',
    '.dai-file{position:relative;overflow:hidden}.dai-file input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;font-size:0}',
    '.dai-file:focus-within{box-shadow:var(--ring)}',
    '.dai-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:16px;box-shadow:var(--shadow-sm)}',
    '.dai-fico{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;background:var(--dai);color:#fff;flex:none}',
    '.dai-finfo{min-width:0;flex:1 1 140px}.dai-fname{font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.dai-baracts{display:flex;flex-wrap:wrap;gap:6px}',
    '.dai-msgs{display:flex;flex-direction:column;gap:10px;margin-bottom:16px}.dai-msgs:empty{display:none}',
    '.dai-layout{display:grid;gap:20px;grid-template-columns:minmax(0,1fr);align-items:start}',
    '.dai-main{min-width:0;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;min-height:240px}',
    '.dai-side{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow);overflow:hidden;min-width:0}',
    '.dai-opts{padding:18px}.dai-opts>h3{margin:0 0 14px;font-size:1.05rem}.dai-opts:empty{display:none}',
    '.dai-act{padding:16px 18px;border-top:1px solid var(--border);background:var(--surface-2);display:flex;flex-direction:column;gap:10px}',
    '.dai-act:empty{display:none}',
    '@media (min-width:960px){.dai-layout{grid-template-columns:minmax(0,1fr) 330px}.dai-side{position:sticky;top:80px;max-height:calc(100vh - 96px);display:flex;flex-direction:column}.dai-opts{overflow:auto;flex:1 1 auto}.dai-act{flex:none}}',
    '@media (max-width:959px){.dai-side{display:contents}.dai-opts{order:-1;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg)}.dai-act{order:5;position:sticky;bottom:8px;z-index:30;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--glass);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:var(--shadow-lg);padding:12px}}',
    '.dai-sec{margin-bottom:16px}.dai-sec:last-child{margin-bottom:0}.dai-sec>.label{display:block;margin-bottom:8px}',
    '.dai-sec .field{margin-bottom:0}',
    '.dai-seg{display:flex;width:100%}.dai-seg button{flex:1 1 auto;padding:7px 8px;display:inline-flex;align-items:center;justify-content:center;gap:6px}',
    '.dai-seg button .icon{width:15px;height:15px}',
    '.dai-range{display:flex;align-items:center;gap:10px}.dai-range input{flex:1;min-width:0}',
    '.dai-val{min-width:48px;text-align:right;font-variant-numeric:tabular-nums;font-weight:600;font-size:.88rem;color:var(--text-2)}',
    '.dai-hint{font-size:.82rem;color:var(--text-3);margin:8px 0 0;line-height:1.45}',
    '.dai-checks{display:flex;flex-direction:column;gap:10px}',
    '.dai-checks .check{align-items:flex-start}.dai-checks .check input{margin-top:2px;flex:none}',
    '.dai-checks .check small{display:block;color:var(--text-3);font-size:.8rem;line-height:1.35}',
    '.dai-chips{display:flex;flex-wrap:wrap;gap:8px}',
    '.dai-chip{display:inline-flex;align-items:center;gap:8px;padding:7px 12px;border:1.5px solid var(--border-strong);border-radius:999px;cursor:pointer;font-weight:600;font-size:.9rem;background:var(--surface);user-select:none}',
    '.dai-chip:has(input:checked){border-color:var(--brand);background:var(--brand-soft)}',
    '.dai-chip:focus-within{box-shadow:var(--ring)}',
    '.dai-chip .dai-script{font-weight:500;color:var(--text-3);font-size:.85rem}',
    '.dai-ptxt{font-size:.85rem;color:var(--text-2);margin-bottom:6px;min-height:1.2em}',
    '.dai-indet>span{width:35%!important;animation:dai-indet 1.3s ease-in-out infinite}',
    '@keyframes dai-indet{0%{transform:translateX(-110%)}100%{transform:translateX(300%)}}',
    '.dai-act>.btn-primary{width:100%}',
    '.dai-brow{display:flex;flex-wrap:wrap;gap:8px}.dai-brow>.btn{flex:1 1 140px}',
    '.dai-choices{display:flex;flex-direction:column;gap:8px}',
    '.dai-choice{display:flex;gap:12px;align-items:flex-start;padding:11px 13px;border:2px solid var(--border);border-radius:12px;cursor:pointer;background:var(--surface);text-align:left;font:inherit;color:inherit;width:100%}',
    '.dai-choice:hover{border-color:var(--border-strong)}',
    '.dai-choice[aria-checked="true"]{border-color:var(--brand);background:var(--brand-soft)}',
    '.dai-radio{width:18px;height:18px;border-radius:50%;border:2px solid var(--border-strong);flex:none;margin-top:2px;display:grid;place-items:center}',
    '.dai-choice[aria-checked="true"] .dai-radio{border-color:var(--brand)}',
    '.dai-choice[aria-checked="true"] .dai-radio::after{content:"";width:8px;height:8px;border-radius:50%;background:var(--brand)}',
    '.dai-choice strong{display:block;font-size:.93rem}.dai-choice small{display:block;color:var(--text-3);font-size:.8rem;line-height:1.4;margin-top:2px}',
    '.dai-ibtn{width:34px;height:34px;border-radius:9px;border:1px solid var(--border);background:var(--surface);color:var(--text-2);display:inline-grid;place-items:center;cursor:pointer;padding:0;flex:none}',
    '.dai-ibtn:hover{color:var(--brand);border-color:var(--brand)}.dai-ibtn.danger:hover{color:var(--danger);border-color:var(--danger)}',
    '.dai-ibtn:disabled{opacity:.4;cursor:default;color:var(--text-3);border-color:var(--border)}',
    '.dai-ibtn .icon{width:16px;height:16px}',
    '.dai-ibtn[aria-pressed="true"]{background:var(--brand-soft);color:var(--brand);border-color:var(--brand)}',
    '.dai-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px}',
    '.dai-head h3{margin:0;font-size:1rem}',
    '.dai .btn .icon{width:1.05em;height:1.05em}',
    '.dai-done{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:var(--radius-sm);background:var(--ok-soft);line-height:1.45;font-size:.9rem}',
    '.dai-done .dai-dico{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:var(--ok);color:var(--surface);flex:none}',
    '.dai-done .dai-dico .icon{width:18px;height:18px}',
    '.dai-done strong{display:block;color:var(--text)}',
    /* thumbnails */
    '.dai-thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(122px,1fr));gap:12px}',
    '@media (max-width:480px){.dai-thumbs{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '.dai-thumb{position:relative;border:2px solid var(--border);border-radius:12px;background:var(--surface);padding:8px;cursor:pointer;user-select:none;-webkit-user-select:none;transition:border-color .15s,box-shadow .15s;text-align:center;font:inherit;color:inherit;min-width:0;display:block;width:100%}',
    '.dai-thumb:hover{box-shadow:var(--shadow)}',
    '.dai-thumb:focus-visible{outline:none;box-shadow:var(--ring)}',
    '.dai-thumb[aria-current="true"]{border-color:var(--brand);background:var(--brand-soft)}',
    '.dai-tw{position:relative;aspect-ratio:3/4;display:grid;place-items:center;overflow:hidden}',
    '.dai-tw canvas,.dai-tw img{max-width:100%;max-height:100%;display:block;box-shadow:0 1px 4px rgba(0,0,0,.18);background:#fff;border-radius:3px}',
    '.dai-pg{font-size:.78rem;color:var(--text-3);margin-top:6px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.dai-tx{position:absolute;top:4px;right:4px;z-index:3}',
    '.dai-tx .dai-ibtn{width:28px;height:28px;box-shadow:var(--shadow-sm)}',
    '.dai-tbadge{position:absolute;left:8px;top:8px;z-index:2;font-size:.68rem;font-weight:700;padding:2px 7px;border-radius:99px;background:var(--warn-soft);color:var(--warn);border:1px solid color-mix(in srgb,var(--warn) 35%,transparent)}',
    '.dai-tspin{position:absolute;inset:0;display:grid;place-items:center;background:color-mix(in srgb,var(--surface) 55%,transparent);color:var(--brand);z-index:2}',
    '.dai-ph{width:70%;height:86%;border-radius:4px;background:linear-gradient(90deg,var(--surface-2),var(--border),var(--surface-2));background-size:200% 100%;animation:dai-sh 1.3s infinite linear}',
    '@keyframes dai-sh{to{background-position:-200% 0}}',
    '.dai-grip{position:absolute;top:4px;left:4px;z-index:3;cursor:grab;touch-action:none}',
    '.dai-thumb.dragging{opacity:.35}.dai-thumb.drop-before{box-shadow:-5px 0 0 0 var(--brand)}.dai-thumb.drop-after{box-shadow:5px 0 0 0 var(--brand)}',
    '.dai-ghost{position:fixed;pointer-events:none;z-index:1000;opacity:.92;transform:rotate(2deg);box-shadow:var(--shadow-lg);margin:0}',
    'body.dai-dragging,body.dai-dragging *{user-select:none!important;cursor:grabbing!important}',
    '.dai-addrow{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}',
    /* OCR result */
    '.dai-res{margin-top:18px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;box-shadow:var(--shadow-sm)}',
    '.dai-res .stats{margin:0 0 14px;grid-template-columns:repeat(auto-fit,minmax(118px,1fr))}',
    '.dai-res textarea{min-height:260px;font-size:.98rem;line-height:1.6}',
    '.dai-res .btn-group{margin-top:10px}',
    '.dai-view{margin-top:18px}',
    '.dai-ovbox{text-align:center;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);padding:12px}',
    '.dai-ov{position:relative;display:inline-block;max-width:100%;line-height:0;vertical-align:top}',
    '.dai-ov canvas{display:block;max-width:100%;height:auto;max-height:70vh;border-radius:4px;box-shadow:var(--shadow-sm);background:#fff}',
    '.dai-ov svg{position:absolute;inset:0;width:100%;height:100%}',
    '.dai-ov.off svg{display:none}',
    '.dai-legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:.82rem;color:var(--text-2);margin-top:10px;justify-content:center}',
    '.dai-legend i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px;vertical-align:-2px}',
    '.dai-vtools{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin-bottom:10px}',
    '.dai-vtools select{width:auto;min-width:0;max-width:100%}',
    /* PDF -> Word preview */
    '.dai-doc{display:flex;flex-direction:column;gap:14px}',
    '.dai-page{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 18px;box-shadow:var(--shadow-sm);min-width:0}',
    '.dai-page-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:.76rem;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px}',
    '.dai-blk{margin:0 0 8px;line-height:1.55;color:var(--text);overflow-wrap:anywhere;font-size:.93rem}',
    '.dai-blk.h1{font-size:1.32rem;font-weight:750;line-height:1.3}.dai-blk.h2{font-size:1.14rem;font-weight:700;line-height:1.35}.dai-blk.h3{font-size:1rem;font-weight:700}',
    '.dai-tag{display:inline-block;font:700 .64rem/1 var(--font);padding:3px 5px;border-radius:5px;background:var(--brand-soft);color:var(--brand);margin-right:8px;vertical-align:3px;letter-spacing:.02em}',
    '.dai-blk.li{padding-left:22px;position:relative}.dai-blk.li::before{content:"\\2022";position:absolute;left:7px;color:var(--brand);font-weight:700}',
    '.dai-blk.num{padding-left:22px;text-indent:-16px}',
    '.dai-blk.c{text-align:center}',
    '.dai-blk b{font-weight:700}.dai-blk i{font-style:italic}',
    '.dai-pimg{display:block;max-width:100%;height:auto;margin:0 auto;box-shadow:var(--shadow-sm);background:#fff}',
    '.dai-more{font-size:.85rem;color:var(--text-3);margin:4px 0 0}',
    '.dai-empty{color:var(--text-3);font-size:.9rem;font-style:italic}',
    /* scanner: camera */
    '.dai-cam{position:relative;background:#05060a;border-radius:16px;overflow:hidden;line-height:0;min-height:260px;display:grid;place-items:center}',
    '.dai-cam video{display:block;width:100%;height:auto;max-height:min(70vh,640px);object-fit:contain;background:#000}',
    '.dai-camov{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}',
    '.dai-camctl{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 14px;background:linear-gradient(transparent,rgba(0,0,0,.7));line-height:1.2}',
    '.dai-shutter{width:68px;height:68px;border-radius:50%;border:4px solid #fff;background:rgba(255,255,255,.2);cursor:pointer;flex:none;box-shadow:0 0 0 2px rgba(0,0,0,.35);transition:transform .1s;padding:0;display:grid;place-items:center}',
    '.dai-shutter::after{content:"";display:block;width:48px;height:48px;border-radius:50%;background:#fff}',
    '.dai-shutter:active{transform:scale(.93)}.dai-shutter:disabled{opacity:.5}',
    '.dai-shutter:focus-visible{outline:3px solid #fde047;outline-offset:3px}',
    '.dai-cbtn{min-width:44px;height:44px;border-radius:22px;border:0;background:rgba(255,255,255,.18);color:#fff;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 13px;cursor:pointer;font:600 .86rem/1 var(--font);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);white-space:nowrap}',
    '.dai-cbtn:hover{background:rgba(255,255,255,.28)}',
    '.dai-cbtn[aria-pressed="true"]{background:#fde047;color:#111}',
    '.dai-cbtn.go{background:#fff;color:#111}',
    '.dai-cbtn:focus-visible{outline:3px solid #fde047;outline-offset:2px}',
    '.dai-cbtn .icon{width:18px;height:18px}',
    '.dai-camside{display:flex;gap:8px;align-items:center;flex:1 1 0;min-width:0}.dai-camside.r{justify-content:flex-end}',
    '.dai-camtop{position:absolute;top:12px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;line-height:1.2;pointer-events:none}',
    '.dai-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:99px;background:rgba(0,0,0,.55);color:#fff;font:600 .78rem/1.2 var(--font)}',
    '.dai-pill.ok{background:rgba(21,128,61,.9)}',
    '.dai-pill .icon{width:14px;height:14px}',
    '.dai-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity .3s}.dai-flash.on{opacity:.8;transition:none}',
    '.dai-last{width:44px;height:44px;border-radius:10px;border:2px solid #fff;background:#222;overflow:hidden;flex:none;display:grid;place-items:center;position:relative}',
    '.dai-last canvas{width:100%;height:100%;object-fit:cover}',
    '.dai-last b{position:absolute;right:-2px;bottom:-2px;background:var(--brand);color:#fff;font:700 .7rem/1 var(--font);padding:3px 5px;border-radius:8px}',
    '.dai-cammsg{color:#fff;line-height:1.5;padding:30px;text-align:center;max-width:420px}',
    /* scanner: crop editor */
    '.dai-crop{display:flex;flex-direction:column;align-items:center;gap:12px}',
    '.dai-cstage{position:relative;line-height:0;touch-action:none;user-select:none;-webkit-user-select:none;max-width:100%}',
    '.dai-cstage canvas{display:block;max-width:100%;height:auto;border-radius:4px}',
    '.dai-cstage svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}',
    '.dai-handle{position:absolute;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:0;background:transparent;cursor:grab;touch-action:none;padding:0;z-index:3}',
    '.dai-handle::after{content:"";position:absolute;inset:11px;border-radius:50%;background:#fff;border:3px solid var(--brand);box-shadow:0 2px 8px rgba(0,0,0,.45)}',
    '.dai-handle:focus-visible{outline:none}.dai-handle:focus-visible::after{box-shadow:0 0 0 4px #fde047}',
    '.dai-handle.drag{cursor:grabbing}',
    '.dai-loupe{position:absolute;width:120px;height:120px;border-radius:50%;border:3px solid #fff;box-shadow:0 6px 20px rgba(0,0,0,.5);pointer-events:none;z-index:5;background:#000;display:none}',
    '.dai-ctools{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}',
    '.dai-ptools{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:12px;padding:8px 10px;border:1px solid var(--border);border-radius:12px;background:var(--surface)}',
    '.dai-plabel{font-weight:650;font-size:.9rem;margin-right:auto;padding-left:2px}',
    '.dai-scanintro{display:grid;gap:16px;grid-template-columns:minmax(0,1fr)}',
    '@media (min-width:720px){.dai-scanintro{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}',
    '.dai-camcard{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:36px 20px;border-radius:24px;border:2px solid transparent;background:linear-gradient(145deg,#1e1b4b,#4338ca);color:#fff;cursor:pointer;font:inherit;min-height:260px;width:100%}',
    '.dai-camcard:hover{filter:brightness(1.08)}.dai-camcard:focus-visible{outline:3px solid var(--brand);outline-offset:3px}',
    '.dai-camcard .dz-icon{width:72px;height:72px;border-radius:20px;display:grid;place-items:center;background:rgba(255,255,255,.16)}',
    '.dai-camcard .dz-icon svg{width:34px;height:34px}',
    '.dai-camcard strong{font-size:1.25rem}.dai-camcard span.s{color:#c7cbea;font-size:.88rem}',
    '.dai-camcard:disabled{opacity:.6;cursor:not-allowed}',
    '.dai-scanintro .dropzone{min-height:260px}',
    /* object eraser */
    '.dai-etb{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}',
    '.dai-etb .spacer{flex:1}',
    '.dai-zoomv{min-width:50px;text-align:center;font-weight:650;font-size:.85rem;color:var(--text-2);font-variant-numeric:tabular-nums}',
    '.dai-stage{position:relative;overflow:hidden;border-radius:12px;background:repeating-conic-gradient(var(--surface-2) 0% 25%,var(--surface) 0% 50%) 50%/20px 20px;border:1px solid var(--border);touch-action:none;user-select:none;-webkit-user-select:none;cursor:none;height:360px}',
    '.dai-stage.pan{cursor:grab}.dai-stage.pan.dragging{cursor:grabbing}',
    '.dai-stage:focus-visible{outline:none;box-shadow:var(--ring)}',
    '.dai-world{position:absolute;left:0;top:0;transform-origin:0 0}',
    '.dai-world canvas{position:absolute;left:0;top:0;display:block}',
    '.dai-world canvas.dai-maskc{opacity:.5}',
    '.dai-cursor{position:absolute;left:0;top:0;border:2px solid #fff;outline:1px solid rgba(0,0,0,.6);border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);display:none;z-index:4}',
    '.dai-cursor.erase{border-style:dashed}',
    '.dai-busyov{position:absolute;inset:0;display:grid;place-items:center;background:rgba(10,12,24,.4);z-index:6;cursor:default}',
    '.dai-busycard{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;width:min(88%,340px);box-shadow:var(--shadow-lg);line-height:1.4}',
    '.dai-busycard .btn{margin-top:10px}',
    '.dai-under{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;justify-content:center;margin-top:10px;font-size:.82rem;color:var(--text-3);text-align:center}',
    '.dai-cmp{position:relative;display:block;line-height:0;user-select:none;-webkit-user-select:none;margin:0 auto;max-width:100%;width:max-content}',
    '.dai-cmp>canvas{display:block;max-width:100%;height:auto;max-height:min(68vh,640px);border-radius:8px}',
    '.dai-cmp>canvas.b{position:absolute;left:0;top:0;width:100%;height:100%;max-height:none;clip-path:inset(0 calc(100% - var(--pos,50%)) 0 0)}',
    '.dai-cmp .bar{position:absolute;top:0;bottom:0;left:var(--pos,50%);width:2px;margin-left:-1px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.3);pointer-events:none}',
    '.dai-cmp .knob{position:absolute;top:50%;left:var(--pos,50%);width:36px;height:36px;margin:-18px 0 0 -18px;border-radius:50%;background:#fff;color:#111;display:grid;place-items:center;box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:none;font:700 14px/1 var(--font)}',
    '.dai-cmp:focus-within .knob{box-shadow:0 0 0 3px var(--brand),0 4px 14px rgba(0,0,0,.35)}',
    '.dai-cmp .tag{position:absolute;top:10px;padding:3px 8px;border-radius:6px;background:rgba(0,0,0,.62);color:#fff;font:600 11px/1.4 var(--font);pointer-events:none}',
    '.dai-cmp .tag.l{left:10px}.dai-cmp .tag.r{right:10px}',
    '.dai-cmp input[type=range]{position:absolute;inset:0;width:100%;height:100%;opacity:0;margin:0;cursor:ew-resize;touch-action:pan-y}',
    '.sr-only-dai{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}'
  ].join('\n');

  function injectCSS() {
    if (doc.getElementById('dai-style')) return;
    var s = doc.createElement('style');
    s.id = 'dai-style';
    s.textContent = CSS;
    doc.head.appendChild(s);
  }

  // ============================================================ UI HELPERS
  var uidN = 0;
  function uid(p) { return 'dai-' + (p || 'x') + (++uidN); }
  function mk(w, hh) {
    var c = doc.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(hh));
    return c;
  }
  function c2d(c, readback) { return c.getContext('2d', readback ? { willReadFrequently: true } : undefined); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function tick(ms) { return new Promise(function (r) { setTimeout(r, ms || 0); }); }
  function plural(n, w) { return n.toLocaleString('en-IN') + ' ' + w + (n === 1 ? '' : 's'); }
  function median(a) {
    if (!a.length) return 0;
    var s = a.slice().sort(function (x, y) { return x - y; });
    return s[s.length >> 1];
  }
  /** Copy (and optionally scale down) any drawable into a new canvas. */
  function toCanvas(src, maxSide) {
    var w = src.naturalWidth || src.videoWidth || src.width, hh = src.naturalHeight || src.videoHeight || src.height;
    var s = maxSide ? Math.min(1, maxSide / Math.max(w, hh)) : 1;
    var c = mk(w * s, hh * s), g = c2d(c);
    g.imageSmoothingQuality = 'high';
    g.drawImage(src, 0, 0, c.width, c.height);
    return c;
  }
  function thumbOf(src, max, rot) {
    rot = rot || 0;
    var sw = src.width, sh = src.height, s = Math.min(1, max / Math.max(sw, sh));
    var w = Math.max(1, Math.round(sw * s)), hh = Math.max(1, Math.round(sh * s));
    var swap = rot % 180 !== 0;
    var c = mk(swap ? hh : w, swap ? w : hh), g = c2d(c);
    g.imageSmoothingQuality = 'high';
    g.translate(c.width / 2, c.height / 2);
    g.rotate(rot * Math.PI / 180);
    g.drawImage(src, -w / 2, -hh / 2, w, hh);
    return c;
  }
  function notice(kind, html, ic) {
    return h('div.notice' + (kind ? '.' + kind : ''), {
      html: icon(ic || (kind === 'ok' ? 'check' : 'info')) + '<span>' + html + '</span>'
    });
  }
  function btn(label, ic, cls, onClick, attrs) {
    var b = h('button.btn' + (cls ? '.' + cls.split(' ').join('.') : ''), Object.assign({
      type: 'button', html: (ic ? icon(ic) : '') + '<span>' + esc(label) + '</span>'
    }, attrs || {}));
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }
  function setBtn(b, label, ic) { b.innerHTML = (ic ? icon(ic) : '') + '<span>' + esc(label) + '</span>'; }
  function ibtn(ic, label, onClick, cls) {
    var b = h('button.dai-ibtn' + (cls ? '.' + cls : ''), { type: 'button', 'aria-label': label, title: label, html: icon(ic) });
    if (onClick) b.addEventListener('click', function (e) { e.stopPropagation(); onClick(e); });
    return b;
  }
  /** A button-styled label wrapping a hidden file input. */
  function fileBtn(label, ic, cls, accept, multiple, onFiles, capture) {
    var inp = h('input', { type: 'file', accept: accept, multiple: !!multiple, 'aria-label': label });
    if (capture) inp.setAttribute('capture', capture);
    var l = h('label.btn.dai-file' + (cls ? '.' + cls.split(' ').join('.') : ''), { html: icon(ic) + '<span>' + esc(label) + '</span>' });
    l.appendChild(inp);
    inp.addEventListener('change', function () {
      var files = Array.prototype.slice.call(inp.files || []);
      inp.value = '';
      if (files.length) onFiles(files);
    });
    l.input = inp;
    return l;
  }
  function field(label, control, hint) {
    if (!control.id) control.id = uid('in');
    var f = h('div.field', null, [h('label', { for: control.id, text: label }), control]);
    if (hint) f.appendChild(h('span.hint', { text: hint }));
    return f;
  }
  function sec(title, children, cls) {
    return h('div.dai-sec' + (cls ? '.' + cls : ''), null, [title ? h('span.label', { text: title }) : null].concat(children || []));
  }
  function hint(text) { return h('p.dai-hint', { text: text }); }
  function rangeCtl(label, value, min, max, step, fmt, onInput) {
    var inp = h('input', { type: 'range', min: String(min), max: String(max), step: String(step), id: uid('r') });
    inp.value = String(value);
    var out = h('span.dai-val', { 'aria-hidden': 'true' });
    function upd() { out.textContent = fmt ? fmt(+inp.value) : inp.value; inp.setAttribute('aria-valuetext', out.textContent); }
    inp.addEventListener('input', function () { upd(); if (onInput) onInput(+inp.value); });
    upd();
    var f = h('div.field', null, [h('label', { for: inp.id, text: label }), h('div.dai-range', null, [inp, out])]);
    f.input = inp;
    f.get = function () { return +inp.value; };
    f.set = function (v) { inp.value = String(v); upd(); };
    return f;
  }
  function checkbox(label, checked, onChange, sub) {
    var inp = h('input', { type: 'checkbox' });
    inp.checked = !!checked;
    var txt = h('span', { text: label });
    if (sub) txt.appendChild(h('small', { text: sub }));
    var l = h('label.check', null, [inp, txt]);
    if (onChange) inp.addEventListener('change', function () { onChange(inp.checked); });
    l.input = inp;
    return l;
  }
  function seg(options, value, onChange, label) {
    var wrap = h('div.seg.dai-seg', { role: 'group', 'aria-label': label || null });
    var cur = value;
    options.forEach(function (o) {
      var b = h('button', { type: 'button', html: (o[2] ? icon(o[2]) : '') + '<span>' + esc(o[1]) + '</span>' });
      b._v = o[0];
      b.addEventListener('click', function () { if (b.disabled) return; set(o[0]); if (onChange) onChange(o[0]); });
      wrap.appendChild(b);
    });
    function set(v) {
      cur = v;
      Array.prototype.forEach.call(wrap.children, function (b) { b.setAttribute('aria-pressed', b._v === v ? 'true' : 'false'); });
    }
    set(value);
    wrap.get = function () { return cur; };
    wrap.set = set;
    return wrap;
  }
  function choices(list, value, onChange, label) {
    var wrap = h('div.dai-choices', { role: 'radiogroup', 'aria-label': label || null });
    var cur = value;
    list.forEach(function (c) {
      var b = h('button.dai-choice', { type: 'button', role: 'radio', html: '<span class="dai-radio"></span><span><strong>' + esc(c.t) + '</strong><small>' + esc(c.d) + '</small></span>' });
      b._v = c.v;
      b.addEventListener('click', function () { set(c.v); if (onChange) onChange(c.v); });
      wrap.appendChild(b);
    });
    function set(v) {
      cur = v;
      Array.prototype.forEach.call(wrap.children, function (b) { b.setAttribute('aria-checked', b._v === v ? 'true' : 'false'); });
    }
    set(value);
    wrap.get = function () { return cur; };
    wrap.set = set;
    return wrap;
  }
  function progressBox() {
    var bar = h('span');
    var pr = h('div.progress', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': 'Progress' }, [bar]);
    var txt = h('div.dai-ptxt', { 'aria-live': 'polite' });
    var wrap = h('div.dai-prog.hidden', null, [txt, pr]);
    wrap.set = function (p, label) {
      wrap.classList.remove('hidden');
      if (p == null) { pr.classList.add('dai-indet'); pr.removeAttribute('aria-valuenow'); bar.style.width = ''; }
      else {
        pr.classList.remove('dai-indet');
        var v = Math.round(clamp(p, 0, 1) * 100);
        bar.style.width = v + '%';
        pr.setAttribute('aria-valuenow', String(v));
      }
      if (label != null) txt.textContent = label;
    };
    wrap.hide = function () { wrap.classList.add('hidden'); };
    return wrap;
  }
  function doneCard(title, text) {
    return h('div.dai-done', { role: 'status' }, [
      h('span.dai-dico', { html: icon('check') }),
      h('div', null, [h('strong', { text: title }), text ? h('span', { text: text }) : null])
    ]);
  }
  function stat(label, value) {
    return h('div.stat', null, [h('div.label', { text: label }), h('div.value', { text: value })]);
  }
  function friendlyPdfError(e) {
    var m = String(e && (e.name + ' ' + e.message) || e);
    if (/Password/i.test(m)) return 'This PDF is password protected. Please remove the password first (for example with our Unlock PDF tool) and try again.';
    if (/Invalid PDF|InvalidPDF|structure|Missing PDF/i.test(m)) return 'This file does not look like a valid PDF, or it is damaged.';
    return (e && e.message) || String(e);
  }
  function dateStamp() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + '.' + p(d.getMinutes());
  }
  function safeName(s, fallback) {
    s = String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
    return s || fallback || 'file';
  }
  function blobBytes(blob) { return blob.arrayBuffer().then(function (b) { return new Uint8Array(b); }); }

  /**
   * Shared workspace shell: intro dropzone -> workspace (file bar, main area,
   * options panel with a sticky action area) — mirrors the PDF suite.
   */
  function workspace(root, ctx, o) {
    injectCSS();
    var color = o.color || (ctx && ctx.category && ctx.category.color) || '#4f46e5';
    var wrap = h('div.dai', { style: { '--dai': color } });
    var intro = h('div.dai-intro');
    var dz = null;
    if (o.accept) {
      dz = BT.dropzone({ accept: o.accept, multiple: o.multiple, title: o.title, hint: o.hint, icon: o.icon, color: color, onFiles: o.onFiles });
      dz.appendChild(h('span.btn.btn-primary.dai-pick', { 'aria-hidden': 'true', html: icon('upload') + ' ' + esc(o.pick || 'Choose file') }));
      intro.appendChild(dz);
    }
    if (o.introExtra) intro.appendChild(o.introExtra);
    intro.appendChild(h('div.dai-trust', {
      html: '<span>' + icon('lock') + 'Files never leave your device</span><span>' + icon('zap') + 'Runs in your browser</span><span>' +
        icon('shield-check') + 'Free, no sign-up</span>'
    }));
    var fname = h('div.dai-fname'), fmeta = h('div.muted.small');
    var barActs = h('div.dai-baracts');
    var bar = h('div.dai-bar', null, [h('span.dai-fico', { html: icon(o.icon) }), h('div.dai-finfo', null, [fname, fmeta]), barActs]);
    var main = h('div.dai-main'), opts = h('div.dai-opts'), act = h('div.dai-act');
    var msgs = h('div.dai-msgs');
    var work = h('div.dai-work.hidden', null, [bar, msgs, h('div.dai-layout', null, [main, h('div.dai-side', null, [opts, act])])]);
    wrap.appendChild(intro);
    wrap.appendChild(work);
    root.appendChild(wrap);
    return {
      wrap: wrap, intro: intro, dz: dz, work: work, bar: bar, barActs: barActs, main: main, opts: opts, act: act, msgs: msgs,
      setFile: function (name, meta) { fname.textContent = name; fname.title = name; fmeta.textContent = meta || ''; },
      show: function (which) {
        intro.classList.toggle('hidden', which !== 'intro');
        work.classList.toggle('hidden', which !== 'work');
      },
      msg: function (kind, html) { msgs.innerHTML = ''; if (html) msgs.appendChild(notice(kind, html)); }
    };
  }

  // =============================================================== WORKERS
  /** Start a dedicated worker from a function's source (Blob URL, same origin policy friendly). */
  function workerFrom(fn) {
    var url = URL.createObjectURL(new Blob(['(' + fn.toString() + ')();'], { type: 'text/javascript' }));
    var w = new Worker(url);
    setTimeout(function () { URL.revokeObjectURL(url); }, 20000);
    return w;
  }
  /** A lazily started worker that answers {id}-tagged requests; supports progress and cancel. */
  function jobWorker(fn) {
    var w = null, seq = 0, pending = {};
    function fail(err) {
      Object.keys(pending).forEach(function (k) { pending[k].rej(err); });
      pending = {};
    }
    function ensure() {
      if (w) return w;
      w = workerFrom(fn);
      w.onmessage = function (e) {
        var m = e.data, p = pending[m.id];
        if (!p) return;
        if (m.type === 'progress') { if (p.onProgress) p.onProgress(m.p, m.label); return; }
        delete pending[m.id];
        if (m.error) p.rej(new Error(m.error)); else p.res(m);
      };
      w.onerror = function (e) {
        e.preventDefault();
        var err = new Error((e && e.message) || 'The background worker failed (the image may be too large for this device).');
        w.terminate(); w = null;
        fail(err);
      };
      return w;
    }
    return {
      run: function (msg, transfer, onProgress) {
        var id = ++seq;
        msg.id = id;
        return new Promise(function (res, rej) {
          pending[id] = { res: res, rej: rej, onProgress: onProgress };
          try { ensure().postMessage(msg, transfer || []); } catch (e) { delete pending[id]; rej(e); }
        });
      },
      kill: function () {
        if (w) { w.terminate(); w = null; }
        var e = new Error('Cancelled'); e.cancelled = true;
        fail(e);
      }
    };
  }

  /*
   * Scanner worker: perspective warp (homography + bilinear sampling, 2x2
   * supersampling when shrinking) and document filters.
   * Message: {op:'process', src:ArrayBuffer(RGBA), sw, sh, quad:[[x,y]x4], W, H, filter}
   */
  function SCAN_WORKER() {
    function solve(A, b) {
      var n = b.length, i, j, k;
      for (i = 0; i < n; i++) {
        var mx = i;
        for (j = i + 1; j < n; j++) if (Math.abs(A[j][i]) > Math.abs(A[mx][i])) mx = j;
        var t = A[i]; A[i] = A[mx]; A[mx] = t;
        var tb = b[i]; b[i] = b[mx]; b[mx] = tb;
        var p = A[i][i];
        if (Math.abs(p) < 1e-12) return null;
        for (j = i + 1; j < n; j++) {
          var f = A[j][i] / p;
          if (!f) continue;
          for (k = i; k < n; k++) A[j][k] -= f * A[i][k];
          b[j] -= f * b[i];
        }
      }
      var x = new Array(n);
      for (i = n - 1; i >= 0; i--) {
        var s = b[i];
        for (k = i + 1; k < n; k++) s -= A[i][k] * x[k];
        x[i] = s / A[i][i];
      }
      return x;
    }
    /** Homography mapping each from[i] to to[i]. */
    function homography(from, to) {
      var A = [], b = [];
      for (var i = 0; i < 4; i++) {
        var u = from[i][0], v = from[i][1], x = to[i][0], y = to[i][1];
        A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]); b.push(x);
        A.push([0, 0, 0, u, v, 1, -u * y, -v * y]); b.push(y);
      }
      return solve(A, b);
    }
    function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
    function warp(src, sw, sh, quad, W, H) {
      var m = homography([[0, 0], [W, 0], [W, H], [0, H]], quad);
      if (!m) throw new Error('Those corners do not form a usable shape.');
      var out = new Uint8ClampedArray(W * H * 4);
      var shrink = Math.max(dist(quad[0], quad[1]), dist(quad[3], quad[2])) / W;
      var ss = shrink > 1.5 ? 2 : 1, inv = 1 / (ss * ss), o = 0;
      for (var v = 0; v < H; v++) {
        for (var u = 0; u < W; u++) {
          var r = 0, g = 0, bl = 0;
          for (var sy = 0; sy < ss; sy++) {
            for (var sx = 0; sx < ss; sx++) {
              var uu = u + (sx + 0.5) / ss, vv = v + (sy + 0.5) / ss;
              var den = m[6] * uu + m[7] * vv + 1;
              var x = (m[0] * uu + m[1] * vv + m[2]) / den - 0.5, y = (m[3] * uu + m[4] * vv + m[5]) / den - 0.5;
              if (x < 0) x = 0; else if (x > sw - 1) x = sw - 1;
              if (y < 0) y = 0; else if (y > sh - 1) y = sh - 1;
              var x0 = x | 0, y0 = y | 0, x1 = x0 + 1 < sw ? x0 + 1 : x0, y1 = y0 + 1 < sh ? y0 + 1 : y0;
              var fx = x - x0, fy = y - y0;
              var i00 = (y0 * sw + x0) * 4, i10 = (y0 * sw + x1) * 4, i01 = (y1 * sw + x0) * 4, i11 = (y1 * sw + x1) * 4;
              var w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
              r += src[i00] * w00 + src[i10] * w10 + src[i01] * w01 + src[i11] * w11;
              g += src[i00 + 1] * w00 + src[i10 + 1] * w10 + src[i01 + 1] * w01 + src[i11 + 1] * w11;
              bl += src[i00 + 2] * w00 + src[i10 + 2] * w10 + src[i01 + 2] * w01 + src[i11 + 2] * w11;
            }
          }
          out[o] = r * inv; out[o + 1] = g * inv; out[o + 2] = bl * inv; out[o + 3] = 255;
          o += 4;
        }
      }
      return out;
    }
    function lum(px, n) {
      var L = new Float32Array(n);
      for (var i = 0, j = 0; i < n; i++, j += 4) L[i] = 0.299 * px[j] + 0.587 * px[j + 1] + 0.114 * px[j + 2];
      return L;
    }
    function ci(v, a, b) { return v < a ? a : v > b ? b : v; }
    function boxBlur(a, w, h, r) {
      var tmp = new Float32Array(w * h), out = new Float32Array(w * h), x, y, s, d = 2 * r + 1;
      for (y = 0; y < h; y++) {
        var row = y * w;
        s = 0;
        for (x = -r; x <= r; x++) s += a[row + ci(x, 0, w - 1)];
        for (x = 0; x < w; x++) {
          tmp[row + x] = s / d;
          s += a[row + ci(x + r + 1, 0, w - 1)] - a[row + ci(x - r, 0, w - 1)];
        }
      }
      for (x = 0; x < w; x++) {
        s = 0;
        for (y = -r; y <= r; y++) s += tmp[ci(y, 0, h - 1) * w + x];
        for (y = 0; y < h; y++) {
          out[y * w + x] = s / d;
          s += tmp[ci(y + r + 1, 0, h - 1) * w + x] - tmp[ci(y - r, 0, h - 1) * w + x];
        }
      }
      return out;
    }
    function maxFilter(a, w, h) {
      var out = new Float32Array(w * h);
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var m = 0;
        for (var dy = -1; dy <= 1; dy++) {
          var yy = y + dy;
          if (yy < 0 || yy >= h) continue;
          for (var dx = -1; dx <= 1; dx++) {
            var xx = x + dx;
            if (xx < 0 || xx >= w) continue;
            var v = a[yy * w + xx];
            if (v > m) m = v;
          }
        }
        out[y * w + x] = m;
      }
      return out;
    }
    /** Paper brightness (illumination) estimate: block maximum, spread, smoothed, upsampled. */
    function bgMap(L, w, h) {
      var bs = Math.max(8, Math.round(Math.max(w, h) / 40));
      var bw = Math.ceil(w / bs), bh = Math.ceil(h / bs), B = new Float32Array(bw * bh), x, y;
      var Lb = boxBlur(L, w, h, 1);
      for (y = 0; y < h; y++) {
        var brow = ((y / bs) | 0) * bw, row = y * w;
        for (x = 0; x < w; x++) {
          var k = brow + ((x / bs) | 0), v = Lb[row + x];
          if (v > B[k]) B[k] = v;
        }
      }
      B = maxFilter(B, bw, bh);
      B = boxBlur(B, bw, bh, 1);
      B = boxBlur(B, bw, bh, 1);
      var full = new Float32Array(w * h), cx0 = new Int32Array(w), cx1 = new Int32Array(w), cfx = new Float32Array(w);
      for (x = 0; x < w; x++) {
        var gx = ci((x + 0.5) / bs - 0.5, 0, bw - 1);
        cx0[x] = gx | 0; cx1[x] = Math.min(bw - 1, cx0[x] + 1); cfx[x] = gx - cx0[x];
      }
      for (y = 0; y < h; y++) {
        var gy = ci((y + 0.5) / bs - 0.5, 0, bh - 1), y0 = gy | 0, y1 = Math.min(bh - 1, y0 + 1), fy = gy - y0;
        var r0 = y0 * bw, r1 = y1 * bw, o = y * w;
        for (x = 0; x < w; x++) {
          var fx = cfx[x], a0 = cx0[x], a1 = cx1[x];
          full[o + x] = (B[r0 + a0] * (1 - fx) + B[r0 + a1] * fx) * (1 - fy) + (B[r1 + a0] * (1 - fx) + B[r1 + a1] * fx) * fy;
        }
      }
      return full;
    }
    function pct(hist, n, p) {
      var target = n * p, s = 0;
      for (var i = 0; i < 256; i++) { s += hist[i]; if (s >= target) return i; }
      return 255;
    }
    function enhance(px, w, h) {
      var n = w * h, L = lum(px, n), bg = bgMap(L, w, h), i, j;
      for (i = 0, j = 0; i < n; i++, j += 4) {
        var g = 248 / Math.max(bg[i], 40);
        if (g > 3) g = 3;
        px[j] *= g; px[j + 1] *= g; px[j + 2] *= g;
      }
      var hist = new Uint32Array(256);
      for (i = 0, j = 0; i < n; i++, j += 4) hist[(0.299 * px[j] + 0.587 * px[j + 1] + 0.114 * px[j + 2]) | 0]++;
      var lo = Math.min(pct(hist, n, 0.01), 90), hi = Math.max(lo + 80, Math.min(pct(hist, n, 0.97), 250));
      var lut = new Float32Array(256);
      for (i = 0; i < 256; i++) lut[i] = ci((i - lo) * 255 / (hi - lo), 0, 255);
      var L2 = new Float32Array(n);
      for (i = 0, j = 0; i < n; i++, j += 4) {
        var r = lut[px[j]], gg = lut[px[j + 1]], b = lut[px[j + 2]];
        var l = 0.299 * r + 0.587 * gg + 0.114 * b;
        px[j] = l + (r - l) * 1.2; px[j + 1] = l + (gg - l) * 1.2; px[j + 2] = l + (b - l) * 1.2;
        L2[i] = l;
      }
      var Lb = boxBlur(L2, w, h, 1);
      for (i = 0, j = 0; i < n; i++, j += 4) {
        var d = (L2[i] - Lb[i]) * 0.7;
        px[j] += d; px[j + 1] += d; px[j + 2] += d;
      }
    }
    function gray(px, w, h) {
      var n = w * h, L = lum(px, n), hist = new Uint32Array(256), i, j;
      for (i = 0; i < n; i++) hist[L[i] | 0]++;
      var lo = pct(hist, n, 0.005), hi = Math.max(lo + 40, pct(hist, n, 0.995));
      for (i = 0, j = 0; i < n; i++, j += 4) {
        var v = (L[i] - lo) * 255 / (hi - lo);
        px[j] = px[j + 1] = px[j + 2] = v;
      }
    }
    /** Black & white: illumination-normalised Sauvola threshold (integral images). */
    function bw(px, w, h) {
      var n = w * h, L = lum(px, n), bg = bgMap(L, w, h), i, x, y;
      for (i = 0; i < n; i++) L[i] = Math.min(255, L[i] * 248 / Math.max(bg[i], 40));
      var W1 = w + 1, I = new Float64Array(W1 * (h + 1)), I2 = new Float64Array(W1 * (h + 1));
      for (y = 0; y < h; y++) {
        var rs = 0, rs2 = 0;
        for (x = 0; x < w; x++) {
          var v = L[y * w + x];
          rs += v; rs2 += v * v;
          I[(y + 1) * W1 + x + 1] = I[y * W1 + x + 1] + rs;
          I2[(y + 1) * W1 + x + 1] = I2[y * W1 + x + 1] + rs2;
        }
      }
      var r = Math.max(7, Math.round(Math.min(w, h) / 60)), k = 0.2, R = 128;
      for (y = 0; y < h; y++) {
        var ya = Math.max(0, y - r), yb = Math.min(h, y + r + 1);
        for (x = 0; x < w; x++) {
          var xa = Math.max(0, x - r), xb = Math.min(w, x + r + 1), cnt = (yb - ya) * (xb - xa);
          var s = I[yb * W1 + xb] - I[ya * W1 + xb] - I[yb * W1 + xa] + I[ya * W1 + xa];
          var s2 = I2[yb * W1 + xb] - I2[ya * W1 + xb] - I2[yb * W1 + xa] + I2[ya * W1 + xa];
          var m = s / cnt, sd = Math.sqrt(Math.max(0, s2 / cnt - m * m));
          var T = m * (1 + k * (sd / R - 1));
          var o = (y * w + x) * 4, val = L[y * w + x] > T ? 255 : 0;
          px[o] = px[o + 1] = px[o + 2] = val;
        }
      }
    }
    self.onmessage = function (e) {
      var m = e.data;
      try {
        if (m.op !== 'process') throw new Error('Unknown operation');
        var px = warp(new Uint8ClampedArray(m.src), m.sw, m.sh, m.quad, m.W, m.H);
        if (m.filter === 'enhanced') enhance(px, m.W, m.H);
        else if (m.filter === 'gray') gray(px, m.W, m.H);
        else if (m.filter === 'bw') bw(px, m.W, m.H);
        self.postMessage({ id: m.id, w: m.W, h: m.H, data: px.buffer }, [px.buffer]);
      } catch (err) {
        self.postMessage({ id: m.id, error: String((err && err.message) || err) });
      }
    };
  }

  /*
   * Inpainting worker — content-aware fill.
   * "patch": multi-scale PatchMatch (Barnes et al. 2009) inside an EM loop
   *   (Wexler et al. 2007): image pyramid, nearest-neighbour field improved by
   *   propagation + random search, 7x7 patches, weighted voting reconstruction.
   * "fast": onion-peel fill from the boundary inwards (fast-marching style)
   *   followed by diffusion smoothing.
   * Message: {op:'inpaint', w, h, rgba:ArrayBuffer, mask:ArrayBuffer(Uint8 1=hole), method}
   */
  function ERASE_WORKER() {
    var PR = 3, PS = 2 * PR + 1, PN = PS * PS;
    var seed = 0x2545F491;
    function rnd() { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; }

    function down(L) {
      var w = L.w, h = L.h, w2 = (w + 1) >> 1, h2 = (h + 1) >> 1;
      var img = new Float32Array(w2 * h2 * 3), hole = new Uint8Array(w2 * h2);
      for (var y = 0; y < h2; y++) {
        for (var x = 0; x < w2; x++) {
          var r = 0, g = 0, b = 0, c = 0, any = 0;
          for (var dy = 0; dy < 2; dy++) {
            var yy = 2 * y + dy;
            if (yy >= h) continue;
            for (var dx = 0; dx < 2; dx++) {
              var xx = 2 * x + dx;
              if (xx >= w) continue;
              var p = yy * w + xx;
              if (L.hole[p]) { any = 1; continue; }
              r += L.img[p * 3]; g += L.img[p * 3 + 1]; b += L.img[p * 3 + 2]; c++;
            }
          }
          var q = y * w2 + x;
          hole[q] = any;
          if (c) { img[q * 3] = r / c; img[q * 3 + 1] = g / c; img[q * 3 + 2] = b / c; }
        }
      }
      return { w: w2, h: h2, img: img, hole: hole };
    }
    /** Dilate the hole by the patch radius: targets = patches touching the hole; sources = clean patches. */
    function regions(L) {
      var w = L.w, h = L.h, n = w * h, x, y, t = new Uint8Array(n), near = new Uint8Array(n);
      for (y = 0; y < h; y++) {
        var row = y * w, last = -1e9;
        for (x = 0; x < w; x++) { if (L.hole[row + x]) last = x; if (x - last <= PR) t[row + x] = 1; }
        last = 1e9;
        for (x = w - 1; x >= 0; x--) { if (L.hole[row + x]) last = x; if (last - x <= PR) t[row + x] = 1; }
      }
      for (x = 0; x < w; x++) {
        var lastY = -1e9;
        for (y = 0; y < h; y++) { if (t[y * w + x]) lastY = y; if (y - lastY <= PR) near[y * w + x] = 1; }
        lastY = 1e9;
        for (y = h - 1; y >= 0; y--) { if (t[y * w + x]) lastY = y; if (lastY - y <= PR) near[y * w + x] = 1; }
      }
      var ok = new Uint8Array(n), list = [], targets = [];
      for (y = 0; y < h; y++) {
        for (x = 0; x < w; x++) {
          var p = y * w + x;
          if (near[p]) targets.push(p);
          else if (x >= PR && y >= PR && x < w - PR && y < h - PR) { ok[p] = 1; list.push(p); }
        }
      }
      return { ok: ok, list: list, T: targets };
    }
    function dist(L, t, s, best) {
      var w = L.w, h = L.h, img = L.img;
      var tx = t % w, ty = (t / w) | 0, sx = s % w, sy = (s / w) | 0;
      var d = 0, cnt = 0, lim = best * PN;
      for (var dy = -PR; dy <= PR; dy++) {
        var yt = ty + dy;
        if (yt < 0 || yt >= h) continue;
        var rt = yt * w, rs = (sy + dy) * w + sx;
        for (var dx = -PR; dx <= PR; dx++) {
          var xt = tx + dx;
          if (xt < 0 || xt >= w) continue;
          var a = (rt + xt) * 3, b = (rs + dx) * 3;
          var e0 = img[a] - img[b], e1 = img[a + 1] - img[b + 1], e2 = img[a + 2] - img[b + 2];
          d += e0 * e0 + e1 * e1 + e2 * e2;
          cnt++;
        }
        if (d > lim) return Infinity;
      }
      return cnt ? d / cnt : Infinity;
    }
    function pmPass(L, R, nnf, cost, reverse) {
      var w = L.w, h = L.h, T = R.T, ok = R.ok, n = T.length, maxR = Math.max(w, h), step = reverse ? -1 : 1;
      for (var k = 0; k < n; k++) {
        var t = T[reverse ? n - 1 - k : k];
        var tx = t % w, ty = (t / w) | 0;
        var best = nnf[t], bc = cost[t], c, d, q;
        var nx = tx - step;
        if (nx >= 0 && nx < w) {
          q = nnf[t - step];
          if (q >= 0) {
            var qx = q % w + step;
            c = q + step;
            if (qx >= 0 && qx < w && ok[c]) { d = dist(L, t, c, bc); if (d < bc) { bc = d; best = c; } }
          }
        }
        var ny = ty - step;
        if (ny >= 0 && ny < h) {
          q = nnf[t - step * w];
          if (q >= 0) {
            c = q + step * w;
            if (c >= 0 && c < w * h && ok[c]) { d = dist(L, t, c, bc); if (d < bc) { bc = d; best = c; } }
          }
        }
        var bx = best % w, by = (best / w) | 0;
        for (var r = maxR; r >= 1; r >>= 1) {
          var sx = bx + Math.floor((rnd() * 2 - 1) * r), sy = by + Math.floor((rnd() * 2 - 1) * r);
          if (sx < PR) sx = PR; else if (sx > w - PR - 1) sx = w - PR - 1;
          if (sy < PR) sy = PR; else if (sy > h - PR - 1) sy = h - PR - 1;
          c = sy * w + sx;
          if (!ok[c]) continue;
          d = dist(L, t, c, bc);
          if (d < bc) { bc = d; best = c; }
        }
        nnf[t] = best; cost[t] = bc;
      }
    }
    function vote(L, R, nnf, cost) {
      var w = L.w, h = L.h, n = w * h, T = R.T, img = L.img, hole = L.hole, k;
      var acc = new Float32Array(n * 3), ws = new Float32Array(n);
      var sample = [], stride = Math.max(1, Math.floor(T.length / 2000));
      for (k = 0; k < T.length; k += stride) { var cv = cost[T[k]]; if (isFinite(cv)) sample.push(cv); }
      sample.sort(function (a, b) { return a - b; });
      var sig2 = sample.length ? sample[Math.floor(sample.length * 0.75)] : 1;
      if (!(sig2 > 0)) sig2 = 1;
      for (k = 0; k < T.length; k++) {
        var t = T[k], s = nnf[t];
        if (s < 0) continue;
        var wgt = Math.exp(-cost[t] / (2 * sig2));
        if (!(wgt > 1e-8)) wgt = 1e-8;
        var tx = t % w, ty = (t / w) | 0, sx = s % w, sy = (s / w) | 0;
        for (var dy = -PR; dy <= PR; dy++) {
          var yt = ty + dy;
          if (yt < 0 || yt >= h) continue;
          for (var dx = -PR; dx <= PR; dx++) {
            var xt = tx + dx;
            if (xt < 0 || xt >= w) continue;
            var p = yt * w + xt;
            if (!hole[p]) continue;
            var q = ((sy + dy) * w + sx + dx) * 3;
            acc[p * 3] += wgt * img[q]; acc[p * 3 + 1] += wgt * img[q + 1]; acc[p * 3 + 2] += wgt * img[q + 2];
            ws[p] += wgt;
          }
        }
      }
      for (var i = 0; i < n; i++) {
        if (!hole[i] || !ws[i]) continue;
        img[i * 3] = acc[i * 3] / ws[i]; img[i * 3 + 1] = acc[i * 3 + 1] / ws[i]; img[i * 3 + 2] = acc[i * 3 + 2] / ws[i];
      }
    }
    /** Onion-peel fill: each ring of the hole takes the distance-weighted mean of known pixels nearby. */
    function fastFill(L, smoothPasses) {
      var w = L.w, h = L.h, n = w * h, img = L.img, known = new Uint8Array(n), queued = new Uint8Array(n), i, x, y;
      var holes = 0;
      for (i = 0; i < n; i++) { known[i] = L.hole[i] ? 0 : 1; if (!known[i]) holes++; }
      if (!holes) return;
      if (holes === n) { for (i = 0; i < n * 3; i++) img[i] = 128; return; }
      var front = [];
      for (i = 0; i < n; i++) {
        if (known[i]) continue;
        x = i % w; y = (i / w) | 0;
        if ((x > 0 && known[i - 1]) || (x < w - 1 && known[i + 1]) || (y > 0 && known[i - w]) || (y < h - 1 && known[i + w])) { front.push(i); queued[i] = 1; }
      }
      while (front.length) {
        var vals = new Float32Array(front.length * 3), k;
        for (k = 0; k < front.length; k++) {
          var p = front[k], px = p % w, py = (p / w) | 0, r = 0, g = 0, b = 0, ws = 0;
          for (var dy = -2; dy <= 2; dy++) {
            var yy = py + dy;
            if (yy < 0 || yy >= h) continue;
            for (var dx = -2; dx <= 2; dx++) {
              var xx = px + dx;
              if (xx < 0 || xx >= w || (!dx && !dy)) continue;
              var q = yy * w + xx;
              if (!known[q]) continue;
              var wt = 1 / (dx * dx + dy * dy);
              r += img[q * 3] * wt; g += img[q * 3 + 1] * wt; b += img[q * 3 + 2] * wt; ws += wt;
            }
          }
          if (ws) { vals[k * 3] = r / ws; vals[k * 3 + 1] = g / ws; vals[k * 3 + 2] = b / ws; }
          else { vals[k * 3] = img[p * 3]; vals[k * 3 + 1] = img[p * 3 + 1]; vals[k * 3 + 2] = img[p * 3 + 2]; }
        }
        var next = [];
        for (k = 0; k < front.length; k++) {
          var f = front[k];
          img[f * 3] = vals[k * 3]; img[f * 3 + 1] = vals[k * 3 + 1]; img[f * 3 + 2] = vals[k * 3 + 2];
          known[f] = 1;
        }
        for (k = 0; k < front.length; k++) {
          var c = front[k], cx = c % w, cy = (c / w) | 0;
          for (var ny = cy - 1; ny <= cy + 1; ny++) {
            if (ny < 0 || ny >= h) continue;
            for (var nx = cx - 1; nx <= cx + 1; nx++) {
              if (nx < 0 || nx >= w) continue;
              var nb = ny * w + nx;
              if (!known[nb] && !queued[nb]) { queued[nb] = 1; next.push(nb); }
            }
          }
        }
        front = next;
      }
      // diffusion smoothing inside the hole to soften the radial streaks
      for (var s = 0; s < (smoothPasses || 0); s++) {
        var copy = img.slice();
        for (i = 0; i < n; i++) {
          if (!L.hole[i]) continue;
          x = i % w; y = (i / w) | 0;
          var sr = 0, sg = 0, sb = 0, c2 = 0;
          for (var yy2 = y - 1; yy2 <= y + 1; yy2++) {
            if (yy2 < 0 || yy2 >= h) continue;
            for (var xx2 = x - 1; xx2 <= x + 1; xx2++) {
              if (xx2 < 0 || xx2 >= w) continue;
              var q2 = (yy2 * w + xx2) * 3;
              sr += copy[q2]; sg += copy[q2 + 1]; sb += copy[q2 + 2]; c2++;
            }
          }
          img[i * 3] = sr / c2; img[i * 3 + 1] = sg / c2; img[i * 3 + 2] = sb / c2;
        }
      }
    }
    function holeExtent(L) {
      var w = L.w, h = L.h, x0 = w, y0 = h, x1 = -1, y1 = -1, c = 0;
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        if (!L.hole[y * w + x]) continue;
        c++;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      return { count: c, size: c ? Math.max(x1 - x0 + 1, y1 - y0 + 1) : 0 };
    }
    function upsample(C, cnnf, F, R) {
      var w = F.w, h = F.h, x, y, i;
      // initial colours of the fine hole: bilinear from the reconstructed coarse level
      for (i = 0; i < w * h; i++) {
        if (!F.hole[i]) continue;
        x = i % w; y = (i / w) | 0;
        var gx = Math.min(C.w - 1, Math.max(0, (x + 0.5) / 2 - 0.5)), gy = Math.min(C.h - 1, Math.max(0, (y + 0.5) / 2 - 0.5));
        var x0 = gx | 0, y0 = gy | 0, x1 = Math.min(C.w - 1, x0 + 1), y1 = Math.min(C.h - 1, y0 + 1), fx = gx - x0, fy = gy - y0;
        for (var ch = 0; ch < 3; ch++) {
          F.img[i * 3 + ch] = (C.img[(y0 * C.w + x0) * 3 + ch] * (1 - fx) + C.img[(y0 * C.w + x1) * 3 + ch] * fx) * (1 - fy) +
            (C.img[(y1 * C.w + x0) * 3 + ch] * (1 - fx) + C.img[(y1 * C.w + x1) * 3 + ch] * fx) * fy;
        }
      }
      var nnf = new Int32Array(w * h).fill(-1), T = R.T;
      for (var k = 0; k < T.length; k++) {
        var t = T[k];
        x = t % w; y = (t / w) | 0;
        var cq = Math.min(C.h - 1, y >> 1) * C.w + Math.min(C.w - 1, x >> 1);
        var cs = cnnf ? cnnf[cq] : -1;
        if (cs >= 0) {
          var sx = (cs % C.w) * 2 + (x & 1), sy = ((cs / C.w) | 0) * 2 + (y & 1);
          sx = Math.max(PR, Math.min(w - PR - 1, sx)); sy = Math.max(PR, Math.min(h - PR - 1, sy));
          var c = sy * w + sx;
          if (R.ok[c]) { nnf[t] = c; continue; }
        }
        nnf[t] = R.list[(rnd() * R.list.length) | 0];
      }
      return nnf;
    }
    function inpaint(m, progress) {
      var w = m.w, h = m.h, n = w * h, rgba = new Uint8ClampedArray(m.rgba), mask = new Uint8Array(m.mask), i;
      var L0 = { w: w, h: h, img: new Float32Array(n * 3), hole: mask };
      for (i = 0; i < n; i++) { L0.img[i * 3] = rgba[i * 4]; L0.img[i * 3 + 1] = rgba[i * 4 + 1]; L0.img[i * 3 + 2] = rgba[i * 4 + 2]; }
      var R0 = regions(L0);
      if (m.method === 'fast' || R0.list.length < 50) {
        progress(0.3, 'Filling…');
        fastFill(L0, 10);
      } else {
        var levels = [L0], regs = [R0];
        while (levels.length < 10) {
          var top = levels[levels.length - 1];
          if (holeExtent(top).size <= PS) break;
          if (Math.min(top.w, top.h) < 4 * PS) break;
          var nx = down(top), ext = holeExtent(nx);
          if (!ext.count) break;
          var rr = regions(nx);
          if (rr.list.length < Math.max(40, ext.count * 0.5)) break;
          levels.push(nx); regs.push(rr);
        }
        var nLev = levels.length, work = 0, done = 0, plan = [];
        for (i = 0; i < nLev; i++) {
          var em = i === nLev - 1 ? 10 : i === 0 ? 5 : 7;
          plan[i] = em;
          work += em * regs[i].T.length;
        }
        var nnf = null;
        for (var li = nLev - 1; li >= 0; li--) {
          var L = levels[li], R = regs[li];
          if (li === nLev - 1) {
            fastFill(L, 2);
            nnf = new Int32Array(L.w * L.h).fill(-1);
            for (var k = 0; k < R.T.length; k++) nnf[R.T[k]] = R.list[(rnd() * R.list.length) | 0];
          } else {
            nnf = upsample(levels[li + 1], nnf, L, R);
          }
          var cost = new Float32Array(L.w * L.h);
          for (var it = 0; it < plan[li]; it++) {
            for (k = 0; k < R.T.length; k++) cost[R.T[k]] = dist(L, R.T[k], nnf[R.T[k]], Infinity);
            pmPass(L, R, nnf, cost, it % 2 === 1);
            pmPass(L, R, nnf, cost, it % 2 === 0);
            vote(L, R, nnf, cost);
            done += R.T.length;
            progress(done / work, 'Filling… level ' + (nLev - li) + ' of ' + nLev);
          }
        }
      }
      for (i = 0; i < n; i++) {
        if (!mask[i]) continue;
        rgba[i * 4] = L0.img[i * 3]; rgba[i * 4 + 1] = L0.img[i * 3 + 1]; rgba[i * 4 + 2] = L0.img[i * 3 + 2];
      }
      return rgba;
    }
    self.onmessage = function (e) {
      var m = e.data;
      try {
        var last = 0;
        var out = inpaint(m, function (p, label) {
          var now = Date.now();
          if (now - last < 80 && p < 1) return;
          last = now;
          self.postMessage({ id: m.id, type: 'progress', p: p, label: label });
        });
        self.postMessage({ id: m.id, rgba: out.buffer }, [out.buffer]);
      } catch (err) {
        self.postMessage({ id: m.id, error: String((err && err.message) || err) });
      }
    };
  }

  // ===================================================== EDGE DETECTION
  // Document corner detection on a ~400 px copy: grayscale, Gaussian blur,
  // Canny edges (Sobel, non-maximum suppression, hysteresis), connected
  // components -> convex hull -> largest inscribed quadrilateral, plus an
  // Otsu "bright paper" candidate. Each quad is scored by how much of its
  // outline lies on edges; the fallback is a 5% inset rectangle.
  function gauss5(a, w, hh) {
    var t = new Float32Array(w * hh), o = new Float32Array(w * hh), x, y;
    for (y = 0; y < hh; y++) {
      var r = y * w;
      for (x = 0; x < w; x++) {
        var a2 = x < 2 ? 0 : x - 2, a1 = x < 1 ? 0 : x - 1, b1 = x + 1 >= w ? w - 1 : x + 1, b2 = x + 2 >= w ? w - 1 : x + 2;
        t[r + x] = (a[r + a2] + 4 * a[r + a1] + 6 * a[r + x] + 4 * a[r + b1] + a[r + b2]) / 16;
      }
    }
    for (y = 0; y < hh; y++) {
      var u2 = (y < 2 ? 0 : y - 2) * w, u1 = (y < 1 ? 0 : y - 1) * w, d1 = (y + 1 >= hh ? hh - 1 : y + 1) * w, d2 = (y + 2 >= hh ? hh - 1 : y + 2) * w, rr = y * w;
      for (x = 0; x < w; x++) o[rr + x] = (t[u2 + x] + 4 * t[u1 + x] + 6 * t[rr + x] + 4 * t[d1 + x] + t[d2 + x]) / 16;
    }
    return o;
  }
  function canny(G, w, hh) {
    var n = w * hh, mag = new Float32Array(n), dir = new Uint8Array(n), x, y, i;
    for (y = 1; y < hh - 1; y++) {
      for (x = 1; x < w - 1; x++) {
        i = y * w + x;
        var gx = -G[i - w - 1] - 2 * G[i - 1] - G[i + w - 1] + G[i - w + 1] + 2 * G[i + 1] + G[i + w + 1];
        var gy = -G[i - w - 1] - 2 * G[i - w] - G[i - w + 1] + G[i + w - 1] + 2 * G[i + w] + G[i + w + 1];
        mag[i] = Math.sqrt(gx * gx + gy * gy);
        var ang = Math.atan2(gy, gx) * 57.29578;
        if (ang < 0) ang += 180;
        dir[i] = ang < 22.5 || ang >= 157.5 ? 0 : ang < 67.5 ? 1 : ang < 112.5 ? 2 : 3;
      }
    }
    var nms = new Float32Array(n), vals = [];
    for (y = 2; y < hh - 2; y++) {
      for (x = 2; x < w - 2; x++) {
        i = y * w + x;
        var m = mag[i];
        if (m < 4) continue;
        var a, b, d = dir[i];
        if (d === 0) { a = i - 1; b = i + 1; }
        else if (d === 1) { a = i - w - 1; b = i + w + 1; }
        else if (d === 2) { a = i - w; b = i + w; }
        else { a = i - w + 1; b = i + w - 1; }
        if (m >= mag[a] && m > mag[b]) { nms[i] = m; vals.push(m); }
      }
    }
    if (!vals.length) return new Uint8Array(n);
    var sorted = Float32Array.from(vals).sort();
    var hi = Math.max(40, sorted[Math.floor(sorted.length * 0.8)]), lo = hi * 0.45;
    var out = new Uint8Array(n), stack = new Int32Array(n), sp = 0;
    for (i = 0; i < n; i++) {
      if (nms[i] < hi || out[i]) continue;
      out[i] = 1; stack[sp++] = i;
      while (sp) {
        var p = stack[--sp];
        for (var dy = -w; dy <= w; dy += w) {
          for (var dx = -1; dx <= 1; dx++) {
            var q = p + dy + dx;
            if (!out[q] && nms[q] >= lo) { out[q] = 1; stack[sp++] = q; }
          }
        }
      }
    }
    return out;
  }
  function dilate3(E, w, hh) {
    var o = new Uint8Array(w * hh);
    for (var y = 0; y < hh; y++) {
      for (var x = 0; x < w; x++) {
        if (!E[y * w + x]) continue;
        for (var yy = Math.max(0, y - 1); yy <= Math.min(hh - 1, y + 1); yy++) {
          for (var xx = Math.max(0, x - 1); xx <= Math.min(w - 1, x + 1); xx++) o[yy * w + xx] = 1;
        }
      }
    }
    return o;
  }
  function convexHull(pts) {
    if (pts.length < 3) return pts.slice();
    pts = pts.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    function cross(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
    var lower = [], upper = [], i;
    for (i = 0; i < pts.length; i++) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pts[i]) <= 0) lower.pop();
      lower.push(pts[i]);
    }
    for (i = pts.length - 1; i >= 0; i--) {
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pts[i]) <= 0) upper.pop();
      upper.push(pts[i]);
    }
    upper.pop(); lower.pop();
    return lower.concat(upper);
  }
  function polyArea(P) {
    var a = 0;
    for (var i = 0; i < P.length; i++) { var p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; }
    return Math.abs(a) / 2;
  }
  function triArea(a, b, c) { return Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2; }
  /** Largest-area quadrilateral with vertices on the hull (O(n^3), n is small). */
  function maxQuad(P) {
    var n = P.length;
    if (n < 4) return null;
    if (n > 120) {
      var sub = [], st = n / 120;
      for (var s = 0; s < 120; s++) sub.push(P[Math.floor(s * st)]);
      P = sub; n = P.length;
    }
    var best = 0, bq = null;
    for (var i = 0; i < n; i++) {
      for (var k = i + 2; k < n; k++) {
        if (i === 0 && k === n - 1) continue;
        var bj = -1, ba = 0, bl = -1, bb = 0, j, a;
        for (j = i + 1; j < k; j++) { a = triArea(P[i], P[j], P[k]); if (a > ba) { ba = a; bj = j; } }
        for (j = k + 1; j < n + i; j++) { a = triArea(P[k], P[j % n], P[i]); if (a > bb) { bb = a; bl = j % n; } }
        if (bj >= 0 && bl >= 0 && ba + bb > best) { best = ba + bb; bq = [P[i], P[bj], P[k], P[bl]]; }
      }
    }
    return bq;
  }
  /** Order 4 points as top-left, top-right, bottom-right, bottom-left. */
  function orderQuad(q) {
    var cx = 0, cy = 0;
    q.forEach(function (p) { cx += p[0] / 4; cy += p[1] / 4; });
    var s = q.slice().sort(function (a, b) { return Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx); });
    var tl = 0;
    for (var i = 1; i < 4; i++) if (s[i][0] + s[i][1] < s[tl][0] + s[tl][1]) tl = i;
    return [s[tl], s[(tl + 1) % 4], s[(tl + 2) % 4], s[(tl + 3) % 4]].map(function (p) { return [p[0], p[1]]; });
  }
  function componentHulls(E, w, hh, minCount, conn8) {
    var n = w * hh, lab = new Int32Array(n), q = new Int32Array(n), res = [], id = 0;
    var minX = new Int32Array(hh), maxX = new Int32Array(hh), rowMark = new Int32Array(hh);
    for (var s = 0; s < n; s++) {
      if (!E[s] || lab[s]) continue;
      id++;
      var qh = 0, qt = 0, cnt = 0, rows = [];
      q[qt++] = s; lab[s] = id;
      while (qh < qt) {
        var p = q[qh++], x = p % w, y = (p / w) | 0;
        cnt++;
        if (rowMark[y] !== id) { rowMark[y] = id; minX[y] = x; maxX[y] = x; rows.push(y); }
        else { if (x < minX[y]) minX[y] = x; if (x > maxX[y]) maxX[y] = x; }
        for (var dy = -1; dy <= 1; dy++) {
          var yy = y + dy;
          if (yy < 0 || yy >= hh) continue;
          for (var dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            if (!conn8 && dx && dy) continue;
            var xx = x + dx;
            if (xx < 0 || xx >= w) continue;
            var r = yy * w + xx;
            if (E[r] && !lab[r]) { lab[r] = id; q[qt++] = r; }
          }
        }
      }
      if (cnt >= minCount) {
        var pts = [];
        rows.forEach(function (yy2) { pts.push([minX[yy2], yy2]); pts.push([maxX[yy2] + 1, yy2]); pts.push([minX[yy2], yy2 + 1]); pts.push([maxX[yy2] + 1, yy2 + 1]); });
        res.push({ count: cnt, hull: convexHull(pts) });
      }
    }
    return res;
  }
  function quadScore(q, E, w, hh) {
    var ratio = polyArea(q) / (w * hh);
    if (ratio < 0.1 || ratio > 0.985) return null;
    var sign = 0;
    for (var i = 0; i < 4; i++) {
      var a = q[(i + 3) % 4], b = q[i], c = q[(i + 1) % 4];
      var v1x = a[0] - b[0], v1y = a[1] - b[1], v2x = c[0] - b[0], v2y = c[1] - b[1];
      var cr = v1x * v2y - v1y * v2x;
      if (sign && cr * sign < 0) return null;
      sign = cr || sign;
      var cos = (v1x * v2x + v1y * v2y) / (Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y) || 1);
      var ang = Math.acos(clamp(cos, -1, 1)) * 57.29578;
      if (ang < 40 || ang > 140) return null;
    }
    var sup = 0, minSide = 1, N = 40;
    for (i = 0; i < 4; i++) {
      var p0 = q[i], p1 = q[(i + 1) % 4], hit = 0;
      for (var s = 0; s < N; s++) {
        var t = (s + 0.5) / N, x = Math.round(p0[0] + (p1[0] - p0[0]) * t), y = Math.round(p0[1] + (p1[1] - p0[1]) * t);
        if (x <= 3 || y <= 3 || x >= w - 4 || y >= hh - 4) { hit++; continue; }
        var found = 0;
        for (var yy = y - 1; yy <= y + 1 && !found; yy++) for (var xx = x - 1; xx <= x + 1; xx++) if (E[yy * w + xx]) { found = 1; break; }
        hit += found;
      }
      sup += hit / N;
      minSide = Math.min(minSide, hit / N);
    }
    sup /= 4;
    return { ratio: ratio, support: sup, minSide: minSide, score: sup * (0.6 + ratio) };
  }
  function insetQuad(w, hh, f) {
    return [[w * f, hh * f], [w * (1 - f), hh * f], [w * (1 - f), hh * (1 - f)], [w * f, hh * (1 - f)]];
  }
  /**
   * Find the document outline in an image/canvas/video frame.
   * Returns {quad:[[x,y] TL,TR,BR,BL] in source pixels, found:boolean}.
   */
  function detectQuad(source, sw, sh) {
    var fallback = { quad: insetQuad(sw, sh, 0.05), found: false };
    try {
      var s = Math.min(1, 400 / Math.max(sw, sh)), w = Math.max(16, Math.round(sw * s)), hh = Math.max(16, Math.round(sh * s));
      var c = mk(w, hh), g = c2d(c, true);
      g.drawImage(source, 0, 0, w, hh);
      var d = g.getImageData(0, 0, w, hh).data, n = w * hh, G = new Float32Array(n), i;
      for (i = 0; i < n; i++) G[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
      G = gauss5(G, w, hh);
      var E = dilate3(canny(G, w, hh), w, hh);
      var hulls = componentHulls(E, w, hh, (w + hh) * 0.4, true);
      // Otsu: bright paper on a darker background
      var hist = new Float64Array(256);
      for (i = 0; i < n; i++) hist[G[i] | 0]++;
      var sumAll = 0, t, sumB = 0, wB = 0, best = 0, thr = 128;
      for (t = 0; t < 256; t++) sumAll += t * hist[t];
      for (t = 0; t < 256; t++) {
        wB += hist[t];
        if (!wB) continue;
        var wF = n - wB;
        if (!wF) break;
        sumB += t * hist[t];
        var mB = sumB / wB, mF = (sumAll - sumB) / wF, between = wB * wF * (mB - mF) * (mB - mF);
        if (between > best) { best = between; thr = t; }
      }
      var bright = new Uint8Array(n);
      for (i = 0; i < n; i++) bright[i] = G[i] > thr ? 1 : 0;
      var bh = componentHulls(bright, w, hh, n * 0.08, false).sort(function (a, b) { return b.count - a.count; }).slice(0, 2);
      hulls = hulls.concat(bh);
      var top = null;
      hulls.forEach(function (cmp) {
        var hullArea = polyArea(cmp.hull);
        if (hullArea < n * 0.1) return;
        var q = maxQuad(cmp.hull);
        if (!q) return;
        q = orderQuad(q);
        var fit = polyArea(q) / hullArea;
        if (fit < 0.85) return;
        var sc = quadScore(q, E, w, hh);
        if (!sc || sc.support < 0.6 || sc.minSide < 0.35) return;
        if (!top || sc.score > top.score) top = { q: q, score: sc.score };
      });
      if (!top) return fallback;
      return {
        quad: top.q.map(function (p) { return [clamp(p[0] / s, 0, sw), clamp(p[1] / s, 0, sh)]; }),
        found: true
      };
    } catch (e) {
      console.warn('edge detection', e);
      return fallback;
    }
  }

  // ===================================================== PDF TEXT MODEL
  var BULLET_RE = /^\s*([•●○◦▪■□►▸‣⁃∙·➢✓✔*\-–—])\s+/;
  var NUM_RE = /^\s*(\(?(?:\d{1,3}|[a-zA-Z]|[ivxlcIVXLC]{1,6})[.)])\s+/;
  var FONT = { sans: 'Calibri', serif: 'Times New Roman', mono: 'Courier New' };

  function percentile(arr, p) {
    if (!arr.length) return 0;
    var s = arr.slice().sort(function (a, b) { return a - b; });
    return s[Math.min(s.length - 1, Math.floor(s.length * p))];
  }

  /**
   * Text lines of a pdf.js page, in content-stream order (which follows the
   * reading order for most generated PDFs, including multi-column ones).
   * Each line has runs (segs) with bold/italic/size/family guesses.
   */
  function pdfTextModel(page, withFonts) {
    var lib = window.pdfjsLib, vp = page.getViewport({ scale: 1 });
    var pre = withFonts ? page.getOperatorList().catch(function () { return null; }) : Promise.resolve();
    return pre.then(function () { return page.getTextContent(); }).then(function (tc) {
      var fonts = {};
      function fontOf(name) {
        if (fonts[name]) return fonts[name];
        var st = (tc.styles && tc.styles[name]) || {}, fo = null, real = '';
        try { if (page.commonObjs.has(name)) fo = page.commonObjs.get(name); } catch (e) { fo = null; }
        if (fo) real = String(fo.name || '');
        var all = real + ' ' + (st.fontFamily || '');
        var fam = /courier|mono|consol/i.test(all) ? 'mono' : (/times|georgia|garamond|cambria|roman|minion|palatino|serif/i.test(all) && !/sans/i.test(all)) ? 'serif' : 'sans';
        fonts[name] = {
          bold: !!(fo && (fo.bold || fo.black)) || /bold|black|heavy|semibold|demibold|[-,_ ]bd\b|w[6-9]00/i.test(real),
          italic: !!(fo && fo.italic) || /italic|oblique/i.test(real),
          fam: fam
        };
        return fonts[name];
      }
      var raw = [];
      tc.items.forEach(function (it) {
        if (!it || typeof it.str !== 'string' || !it.transform) return;
        var t = lib.Util.transform(vp.transform, it.transform);
        var size = Math.hypot(t[2], t[3]);
        if (!(size > 1)) size = Math.hypot(t[0], t[1]);
        if (!(size > 1) || size > 500) return;
        if (Math.abs(t[1]) > Math.abs(t[0]) + 0.01) return; // vertical / rotated text
        raw.push({ s: it.str, x: t[4], y: t[5], w: it.width || 0, size: size, f: fontOf(it.fontName), eol: !!it.hasEOL });
      });
      var lines = [], cur = null, chars = 0;
      raw.forEach(function (r) {
        var blank = !r.s.trim();
        if (cur) {
          var tol = Math.max(1.5, Math.min(r.size, cur.size0) * 0.45);
          if (Math.abs(r.y - cur.y) > tol || (!blank && r.x < cur.x1 - Math.max(r.size, cur.size0) * 2)) cur = null;
        }
        if (blank) { if (cur) cur.space = true; return; }
        var text = r.s;
        if (!cur) {
          cur = { y: r.y, x0: r.x, x1: r.x + r.w, size0: r.size, segs: [], n: 0, sz: 0, space: false };
          lines.push(cur);
        } else {
          var gap = r.x - cur.x1, last = cur.segs[cur.segs.length - 1], sp = '';
          if (gap > r.size * 2.5) sp = '    ';
          else if (cur.space || gap > r.size * 0.16) sp = ' ';
          if (sp === ' ' && (/\s$/.test(last.text) || /^\s/.test(text))) sp = '';
          text = sp + text;
        }
        cur.space = r.eol;
        var len = text.replace(/\s/g, '').length;
        cur.n += len; cur.sz += len * r.size; chars += len;
        cur.x1 = Math.max(cur.x1, r.x + r.w); cur.x0 = Math.min(cur.x0, r.x);
        var seg = cur.segs[cur.segs.length - 1], sizeR = Math.round(r.size * 2) / 2;
        if (seg && seg.bold === r.f.bold && seg.italic === r.f.italic && seg.size === sizeR && seg.fam === r.f.fam) seg.text += text;
        else cur.segs.push({ text: text, bold: r.f.bold, italic: r.f.italic, size: sizeR, fam: r.f.fam });
      });
      lines.forEach(function (l) {
        l.size = l.n ? l.sz / l.n : l.size0;
        l.text = l.segs.map(function (s) { return s.text; }).join('');
        l.bold = l.segs.every(function (s) { return s.bold || !s.text.trim(); });
      });
      page.cleanup();
      return { w: vp.width, h: vp.height, lines: lines, chars: chars };
    });
  }

  function appendLine(p, ln, mb) {
    var segs = ln.segs.map(function (s) { return { text: s.text, bold: s.bold, italic: s.italic, size: s.size, fam: s.fam }; });
    if (mb) {
      var rest = mb[0].length;
      while (rest > 0 && segs.length) {
        var s0 = segs[0];
        if (s0.text.length <= rest) { rest -= s0.text.length; segs.shift(); }
        else { s0.text = s0.text.slice(rest); rest = 0; }
      }
    }
    if (segs.length) segs[0].text = segs[0].text.replace(/^\s+/, '');
    if (p.runs.length && segs.length) {
      var last = p.runs[p.runs.length - 1];
      if (/[A-Za-z]-$/.test(last.text) && /^[a-z]/.test(segs[0].text)) last.text = last.text.slice(0, -1);
      else if (!/\s$/.test(last.text)) segs[0].text = ' ' + segs[0].text;
    }
    segs.forEach(function (s) {
      if (!s.text) return;
      var last = p.runs[p.runs.length - 1];
      if (last && last.bold === s.bold && last.italic === s.italic && last.size === s.size && last.fam === s.fam) last.text += s.text;
      else p.runs.push(s);
    });
    p.lines.push(ln);
    p.n += ln.n; p.sz += ln.n * ln.size;
  }

  /** Group lines into paragraphs and list items (by spacing, indent, size, punctuation). */
  function buildParas(m) {
    var lines = m.lines.filter(function (l) { return l.text.trim(); }), paras = [];
    if (!lines.length) return paras;
    var gaps = [], i;
    for (i = 1; i < lines.length; i++) {
      var g0 = lines[i].y - lines[i - 1].y, s0 = Math.max(lines[i].size, lines[i - 1].size);
      if (g0 > s0 * 0.6 && g0 < s0 * 3 && Math.abs(lines[i].size - lines[i - 1].size) < s0 * 0.12) gaps.push(g0 / s0);
    }
    var lineGap = gaps.length ? percentile(gaps, 0.3) : 1.2;
    var right = percentile(lines.map(function (l) { return l.x1; }), 0.9);
    var left = percentile(lines.map(function (l) { return l.x0; }), 0.1);
    var cur = null, prev = null;
    lines.forEach(function (ln) {
      var mb = BULLET_RE.exec(ln.text), mn = !mb && NUM_RE.exec(ln.text);
      var centered = Math.abs((ln.x0 + ln.x1) / 2 - m.w / 2) < m.w * 0.04 && ln.x0 - left > m.w * 0.06;
      var start = !cur;
      if (!start) {
        var s = Math.max(ln.size, prev.size), g = ln.y - prev.y;
        if (mb || mn) start = true;
        else if (Math.abs(ln.size - cur.size0) > cur.size0 * 0.12) start = true;
        else if (g < -s * 0.3 || g > s * (lineGap + 0.45)) start = true;
        else if (cur.list) start = ln.x0 < cur.x0 + s * 0.4;
        else if (cur.center !== centered && (cur.center || centered)) start = true;
        else if (!centered && ln.x0 > prev.x0 + s * 1.2 && ln.x0 - left > s * 1.2) start = true;
        else if (!centered && prev.x1 < right - s * 5 && /[.!?:;]["'”’)]?$/.test(prev.text.trim())) start = true;
        else if (prev.bold !== ln.bold && prev.x1 < right - s * 5) start = true;
      }
      if (start) {
        cur = { lines: [], runs: [], n: 0, sz: 0, size0: ln.size, x0: ln.x0, list: mb ? 'bullet' : mn ? 'num' : null, heading: 0, center: centered, allCenter: true };
        paras.push(cur);
        appendLine(cur, ln, mb);
      } else appendLine(cur, ln, null);
      cur.allCenter = cur.allCenter && centered;
      prev = ln;
    });
    paras.forEach(function (p) {
      p.size = p.n ? p.sz / p.n : p.size0;
      p.align = p.allCenter ? 'center' : 'left';
      p.text = p.runs.map(function (r) { return r.text; }).join('');
    });
    return paras.filter(function (p) { return p.text.trim(); });
  }

  /** Body size = most common size by characters; larger short paragraphs become H1-H3. */
  function assignHeadings(pages) {
    var hist = {};
    pages.forEach(function (pg) {
      (pg.paras || []).forEach(function (p) { var k = Math.round(p.size * 2) / 2; hist[k] = (hist[k] || 0) + p.n; });
    });
    var keys = Object.keys(hist).sort(function (a, b) { return hist[b] - hist[a]; });
    var body = keys.length ? +keys[0] : 11, cand = [];
    pages.forEach(function (pg) {
      (pg.paras || []).forEach(function (p) {
        p.heading = 0;
        var allBold = p.runs.every(function (r) { return r.bold || !r.text.trim(); });
        var big = p.size >= body * 1.15 || (allBold && p.size >= body * 1.05);
        if (big && !p.list && p.text.length <= 200 && p.lines.length <= 3) cand.push(p);
      });
    });
    var sizes = [];
    cand.forEach(function (p) { var k = Math.round(p.size * 2) / 2; if (sizes.indexOf(k) < 0) sizes.push(k); });
    sizes.sort(function (a, b) { return b - a; });
    cand.forEach(function (p) { p.heading = Math.min(3, sizes.indexOf(Math.round(p.size * 2) / 2) + 1); });
    return body;
  }

  /** Plain text of a page model: paragraphs separated by blank lines. */
  function modelText(m) {
    return buildParas(m).map(function (p) {
      return (p.list === 'bullet' ? '• ' : '') + p.lines.map(function (l, i) {
        var t = l.text.trim();
        return i === 0 && p.list === 'bullet' ? t.replace(BULLET_RE, '') : t;
      }).join('\n');
    }).join('\n\n');
  }
