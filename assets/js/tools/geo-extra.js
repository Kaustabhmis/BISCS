/*
 * BISCS Tools — GEO/AEO extras: Readability Checker, Entity & Author Schema
 * Builder and Hreflang Tag Generator. Everything runs on the user's input in
 * the browser; nothing is fetched.
 */
(function () {
  'use strict';
  var BT = window.BT;
  var esc = BT.esc;

  var CSS = [
    '.gx-hl{line-height:1.8;white-space:pre-wrap;word-break:break-word}',
    '.gx-hl mark{border-radius:4px;padding:0 2px;color:inherit}',
    '.gx-hl .long{background:color-mix(in srgb,#facc15 35%,transparent)}',
    '.gx-hl .vlong{background:color-mix(in srgb,#ef4444 28%,transparent)}',
    '.gx-hl .pass{background:color-mix(in srgb,#3b82f6 25%,transparent)}',
    '.gx-hl .adv{background:color-mix(in srgb,#a855f7 25%,transparent)}',
    '.gx-hl .cx{text-decoration:underline dotted;text-underline-offset:3px}',
    '.gx-legend{display:flex;flex-wrap:wrap;gap:8px 14px;font-size:.82rem;color:var(--text-2);margin:8px 0}',
    '.gx-legend i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px;vertical-align:-1px}',
    '.gx-meter{height:10px;border-radius:99px;background:linear-gradient(90deg,#ef4444,#f59e0b,#22c55e);position:relative;margin:10px 0 4px}',
    '.gx-meter span{position:absolute;top:-4px;width:4px;height:18px;border-radius:2px;background:var(--text);transform:translateX(-50%)}',
    '.gx-rows{display:flex;flex-direction:column;gap:8px}',
    '.gx-row{display:grid;grid-template-columns:minmax(0,170px) minmax(0,1fr) auto;gap:8px;align-items:center}',
    '@media (max-width:560px){.gx-row{grid-template-columns:minmax(0,1fr) auto}.gx-row select{grid-column:1/-1}}',
    '.gx-check li{margin-bottom:6px}',
    '.gx-issues{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px}',
    '.gx-issues li{display:flex;gap:8px;align-items:flex-start;font-size:.9rem}'
  ].join('\n');
  function injectCss() {
    if (document.getElementById('gx-css')) return;
    document.head.appendChild(BT.h('style', { id: 'gx-css', text: CSS }));
  }
  function fmt(n, d) { return isFinite(n) ? Number(n).toFixed(d == null ? 1 : d) : '—'; }

  // ================================================== Readability Checker
  var SAMPLE = 'BISCS India makes free tools that run in your browser. Your files stay on your device, so they are never uploaded to a server. ' +
    'Pick a tool, add your file and download the result in seconds.\n\n' +
    'Readability matters because most readers skim. Short sentences and familiar words are understood faster, and they are easier for search engines and AI assistants to quote accurately. ' +
    'It is generally recommended by writing guides that sentences should be kept under about twenty words, although a variety of sentence lengths is also considered important for a natural rhythm.';

  /** Approximate English syllable count (heuristic, good for scoring). */
  function syllables(word) {
    var w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 0;
    if (w.length <= 3) return 1;
    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
    var m = w.match(/[aeiouy]{1,2}/g);
    return Math.max(1, m ? m.length : 1);
  }
  function splitSentences(text) {
    return text.replace(/\s+/g, ' ').trim()
      .split(/(?<=[.!?])\s+(?=["'“‘(]?[A-Z0-9])/)
      .map(function (s) { return s.trim(); }).filter(function (s) { return /[A-Za-z0-9]/.test(s); });
  }
  var BE = '(?:am|is|are|was|were|be|been|being|get|gets|got|gotten)';
  var IRREG = 'built|done|made|written|given|taken|seen|known|shown|sent|found|held|kept|told|paid|sold|put|set|cut|read|brought|bought|thought|caught|taught|left|lost|meant|spent|won|chosen|driven|eaten|fallen|forgotten|hidden|ridden|risen|spoken|stolen|sworn|torn|worn|woken|drawn|grown|thrown|flown|blown|born|begun|run|sung|drunk|swum|understood|stood|led|fed|met|bound|ground|wound|hung|struck|laid|said|heard|felt|dealt|considered|recommended|uploaded|processed';
  var PASSIVE_RE = new RegExp('\\b' + BE + '\\s+(?:\\w+ly\\s+)?(?:\\w+ed|' + IRREG + ')\\b', 'gi');
  var ADV_OK = /^(only|early|family|reply|apply|supply|holy|ugly|daily|weekly|monthly|yearly|july|italy|fly|rely|belly|bully|ally|jelly|lily|silly|likely|friendly|lonely|lovely|costly|elderly)$/i;

  function analyse(text) {
    var paras = text.split(/\n\s*\n/).filter(function (p) { return p.trim(); }).length;
    var sents = splitSentences(text);
    var words = (text.match(/[A-Za-z0-9’'-]+/g) || []).filter(function (w) { return /[A-Za-z0-9]/.test(w); });
    var W = words.length, S = Math.max(1, sents.length);
    var syl = 0, poly = 0, chars = 0, complex = 0;
    words.forEach(function (w) {
      var n = syllables(w);
      syl += n;
      chars += w.replace(/[^A-Za-z0-9]/g, '').length;
      if (n >= 3) { poly++; if (!/(?:ing|ed|es)$/i.test(w) && !/^[A-Z]/.test(w)) complex++; }
    });
    var wps = W / S, spw = W ? syl / W : 0;
    var r = {
      words: W, sentences: sents.length, paragraphs: paras, syllables: syl, chars: chars,
      wps: wps, spw: spw,
      flesch: 206.835 - 1.015 * wps - 84.6 * spw,
      fk: 0.39 * wps + 11.8 * spw - 15.59,
      fog: 0.4 * (wps + 100 * (W ? complex / W : 0)),
      smog: sents.length >= 3 ? 1.043 * Math.sqrt(poly * (30 / S)) + 3.1291 : NaN,
      cli: W ? 0.0588 * (chars / W * 100) - 0.296 * (S / W * 100) - 15.8 : NaN,
      ari: W ? 4.71 * (chars / W) + 0.5 * wps - 21.43 : NaN,
      sents: sents,
      long: sents.filter(function (s) { var n = s.split(/\s+/).length; return n > 25 && n <= 35; }).length,
      vlong: sents.filter(function (s) { return s.split(/\s+/).length > 35; }).length,
      passive: (text.match(PASSIVE_RE) || []).length,
      adverbs: words.filter(function (w) { return /ly$/i.test(w) && w.length > 4 && !ADV_OK.test(w); }).length,
      readMin: W / 230
    };
    return r;
  }
  function fleschLabel(f) {
    if (!isFinite(f)) return ['—', ''];
    if (f >= 90) return ['Very easy', 'Easily understood by an average 11-year-old.'];
    if (f >= 80) return ['Easy', 'Conversational English for most readers.'];
    if (f >= 70) return ['Fairly easy', 'Good for blogs, help pages and marketing.'];
    if (f >= 60) return ['Plain English', 'Easily understood by 13–15-year-olds. A good target for the web.'];
    if (f >= 50) return ['Fairly difficult', 'Fine for professionals; consider shorter sentences for a general audience.'];
    if (f >= 30) return ['Difficult', 'Academic or technical. Many web readers will skim or leave.'];
    return ['Very difficult', 'Best understood by university graduates.'];
  }
  var AUDIENCES = {
    general: { label: 'General public', target: 60, grade: 8 },
    students: { label: 'Students (school)', target: 70, grade: 7 },
    pros: { label: 'Professionals', target: 45, grade: 12 }
  };

  BT.impl('readability-checker', function (root) {
    injectCss();
    root.innerHTML =
      '<div class="split wide-left">' +
      '<div class="card"><div class="card-title"><h3>Your text</h3><div class="btn-group">' +
      '<button type="button" class="btn btn-sm btn-ghost" id="rc-sample">Sample</button><button type="button" class="btn btn-sm btn-ghost" id="rc-clear">Clear</button></div></div>' +
      '<div class="field"><label for="rc-text" class="sr-only">Text to check</label><textarea id="rc-text" rows="12" placeholder="Paste an article, product description or email…"></textarea></div>' +
      '<div class="field"><label for="rc-aud">Target audience</label><select id="rc-aud">' +
      Object.keys(AUDIENCES).map(function (k) { return '<option value="' + k + '">' + AUDIENCES[k].label + '</option>'; }).join('') + '</select></div>' +
      '</div>' +
      '<div id="rc-out"></div></div>' +
      '<div class="card" style="margin-top:16px"><div class="card-title"><h3>Highlighted text</h3></div>' +
      '<div class="gx-legend"><span><i style="background:#facc1599"></i>Long sentence (26–35 words)</span><span><i style="background:#ef444477"></i>Very long (35+)</span><span><i style="background:#3b82f666"></i>Possible passive voice</span><span><i style="background:#a855f766"></i>Adverb</span></div>' +
      '<div class="output gx-hl" id="rc-hl" aria-live="polite"></div></div>';
    var ta = BT.$('#rc-text', root), out = BT.$('#rc-out', root), hl = BT.$('#rc-hl', root), aud = BT.$('#rc-aud', root);
    ta.value = SAMPLE;

    function highlight(text) {
      return text.split(/(\n\s*\n)/).map(function (para) {
        if (/^\n\s*\n$/.test(para)) return '\n\n';
        return splitSentences(para).map(function (s) {
          var n = s.split(/\s+/).length;
          var inner = esc(s)
            .replace(PASSIVE_RE, function (m) { return '<mark class="pass">' + m + '</mark>'; })
            .replace(/\b([A-Za-z]{3,}ly)\b/g, function (m) { return ADV_OK.test(m) ? m : '<mark class="adv">' + m + '</mark>'; });
          if (n > 35) return '<mark class="vlong">' + inner + '</mark>';
          if (n > 25) return '<mark class="long">' + inner + '</mark>';
          return inner;
        }).join(' ');
      }).join('');
    }

    function update() {
      var text = ta.value;
      if (!text.trim()) { out.innerHTML = '<div class="notice">' + BT.icon('info') + '<span>Paste some text to see its readability scores.</span></div>'; hl.innerHTML = ''; return; }
      var r = analyse(text), a = AUDIENCES[aud.value], lab = fleschLabel(r.flesch);
      var pos = Math.max(0, Math.min(100, r.flesch));
      var verdict = r.flesch >= a.target ? 'ok' : r.flesch >= a.target - 15 ? 'warn' : 'danger';
      var tips = [];
      if (r.wps > 20) tips.push('Average sentence length is ' + fmt(r.wps) + ' words. Aim for 15–20 by splitting long sentences.');
      if (r.vlong) tips.push(r.vlong + ' very long sentence' + (r.vlong > 1 ? 's' : '') + ' (35+ words). Break each into two or three.');
      if (r.passive > Math.max(1, r.sentences * 0.1)) tips.push('Passive voice appears ' + r.passive + ' times. Prefer "we checked the file" over "the file was checked".');
      if (r.adverbs > r.words * 0.03) tips.push('Quite a few adverbs (' + r.adverbs + '). Stronger verbs often read better.');
      if (r.spw > 1.6) tips.push('Many long words (' + fmt(r.spw, 2) + ' syllables per word). Swap jargon for everyday words where you can.');
      if (r.fk > a.grade) tips.push('Grade level ' + fmt(r.fk) + ' is above the target for ' + a.label.toLowerCase() + ' (about grade ' + a.grade + ').');
      if (!tips.length) tips.push('Nicely readable for ' + a.label.toLowerCase() + '. Keep headings and lists to help skimmers.');
      out.innerHTML =
        '<div class="result"><div class="label">Flesch Reading Ease</div><div class="value">' + fmt(Math.max(0, Math.min(100, r.flesch)), 0) + ' · ' + lab[0] + '</div>' +
        '<div style="opacity:.9;margin-top:4px">' + lab[1] + '</div></div>' +
        '<div class="card" style="margin-top:14px"><div class="gx-meter" aria-hidden="true"><span style="left:' + pos + '%"></span></div>' +
        '<div class="small muted" style="display:flex;justify-content:space-between"><span>Difficult</span><span>Target ' + a.target + '+ for ' + esc(a.label.toLowerCase()) + ' <span class="badge ' + verdict + '">' + (verdict === 'ok' ? 'On target' : verdict === 'warn' ? 'Close' : 'Too hard') + '</span></span><span>Easy</span></div></div>' +
        '<div class="stats" style="margin-top:14px">' +
        stat('Grade (Flesch-Kincaid)', fmt(r.fk)) + stat('Gunning Fog', fmt(r.fog)) + stat('SMOG', fmt(r.smog)) +
        stat('Coleman-Liau', fmt(r.cli)) + stat('ARI', fmt(r.ari)) + stat('Reading time', Math.max(1, Math.round(r.readMin)) + ' min') +
        stat('Words', BT.fmtNum(r.words)) + stat('Sentences', BT.fmtNum(r.sentences)) + stat('Paragraphs', BT.fmtNum(r.paragraphs)) +
        stat('Words / sentence', fmt(r.wps)) + stat('Long sentences', r.long + r.vlong) + stat('Passive (approx.)', r.passive) + '</div>' +
        '<div class="card" style="margin-top:14px"><h3>Suggestions</h3><ul class="gx-issues">' +
        tips.map(function (t) { return '<li>' + BT.icon('info') + '<span>' + esc(t) + '</span></li>'; }).join('') + '</ul>' +
        '<p class="small muted" style="margin:10px 0 0">Scores use standard formulas with an English syllable estimate, so treat them as a guide. Passive-voice detection is approximate.</p></div>';
      hl.innerHTML = highlight(text);
    }
    function stat(l, v) { return '<div class="stat"><div class="label">' + esc(l) + '</div><div class="value">' + esc(String(v)) + '</div></div>'; }
    ta.addEventListener('input', BT.debounce(update, 150));
    aud.addEventListener('change', update);
    BT.$('#rc-sample', root).addEventListener('click', function () { ta.value = SAMPLE; update(); });
    BT.$('#rc-clear', root).addEventListener('click', function () { ta.value = ''; update(); ta.focus(); });
    update();
  });

  // ============================================ Entity & Author Schema Builder
  BT.impl('entity-schema-builder', function (root) {
    injectCss();
    var F = [
      ['Organisation', [
        ['org-type', 'Type', 'select', 'Organization', ['Organization', 'LocalBusiness', 'ProfessionalService', 'Corporation', 'EducationalOrganization', 'NGO']],
        ['org-name', 'Official name', 'text', 'BISCS India'],
        ['org-alt', 'Other names (comma separated)', 'text', 'BISCS'],
        ['org-url', 'Website URL', 'url', 'https://biscsindia.com/'],
        ['org-logo', 'Logo URL (square, 112px+)', 'url', 'https://biscsindia.com/assets/img/icon-512.png'],
        ['org-desc', 'Short description', 'textarea', 'Free, private browser-based tools for PDFs, GST, images, video, office work and SEO, made in Kolkata.'],
        ['org-founded', 'Founding date (YYYY or YYYY-MM-DD)', 'text', ''],
        ['org-email', 'Email', 'email', 'info@biscsindia.com'],
        ['org-phone', 'Phone (with country code)', 'tel', ''],
        ['org-locality', 'City', 'text', 'Kolkata'],
        ['org-region', 'State', 'text', 'West Bengal'],
        ['org-postcode', 'PIN code', 'text', '700026'],
        ['org-country', 'Country code', 'text', 'IN'],
        ['org-same', 'Official profiles (sameAs), one URL per line', 'textarea', 'https://www.linkedin.com/in/biscs-india-7a0ab03a6\nhttps://www.facebook.com/share/1PyhN1vLey/\nhttps://www.instagram.com/biscsindia/'],
        ['org-knows', 'Topics you are known for (comma separated)', 'text', 'PDF tools, GST, Online tools, SEO']
      ]],
      ['Author (person)', [
        ['p-on', 'Include an author / founder', 'checkbox', true],
        ['p-name', 'Full name', 'text', ''],
        ['p-title', 'Job title', 'text', 'Founder'],
        ['p-url', 'Author page URL', 'url', ''],
        ['p-img', 'Photo URL', 'url', ''],
        ['p-same', 'Profiles (sameAs), one URL per line', 'textarea', ''],
        ['p-alumni', 'Studied at (comma separated)', 'text', ''],
        ['p-knows', 'Expertise (comma separated)', 'text', '']
      ]]
    ];
    var html = '<div class="split wide-left"><div>';
    F.forEach(function (sec) {
      html += '<div class="card"><div class="card-title"><h3>' + sec[0] + '</h3></div><div class="row cols-2">';
      sec[1].forEach(function (f) {
        var id = 'es-' + f[0], wide = f[2] === 'textarea' ? ' style="grid-column:1/-1"' : '';
        if (f[2] === 'checkbox') { html += '<label class="check" style="grid-column:1/-1"><input type="checkbox" id="' + id + '"' + (f[3] ? ' checked' : '') + '> ' + f[1] + '</label>'; return; }
        html += '<div class="field"' + wide + '><label for="' + id + '">' + f[1] + '</label>';
        if (f[2] === 'select') html += '<select id="' + id + '">' + f[4].map(function (o) { return '<option' + (o === f[3] ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>';
        else if (f[2] === 'textarea') html += '<textarea id="' + id + '" rows="3">' + esc(f[3]) + '</textarea>';
        else html += '<input type="' + f[2] + '" id="' + id + '" value="' + esc(f[3]) + '">';
        html += '</div>';
      });
      html += '</div></div>';
    });
    html += '</div><div><div class="card"><div class="card-title"><h3>JSON-LD</h3><div class="btn-group">' +
      '<button type="button" class="btn btn-sm btn-primary" id="es-copy">' + BT.icon('copy') + ' Copy</button>' +
      '<button type="button" class="btn btn-sm" id="es-dl">' + BT.icon('download') + ' Download</button></div></div>' +
      '<div id="es-warn"></div><pre class="output" id="es-out" style="max-height:460px;overflow:auto" tabindex="0" aria-label="Generated JSON-LD"></pre>' +
      '<p class="small muted">Paste it into the &lt;head&gt; of your home page (and About page). Then check it with Google’s Rich Results Test.</p></div>' +
      '<div class="card"><h3>E-E-A-T checklist</h3><ul class="gx-check small">' +
      '<li>Use the <strong>same name, logo and address</strong> everywhere: your site, Google Business Profile and social pages.</li>' +
      '<li>List only <strong>official profiles you control</strong> in sameAs. Don’t list directories or other people’s pages.</li>' +
      '<li>Add a real <strong>About page</strong> and author pages with expertise, and link articles to them.</li>' +
      '<li>Show <strong>contact details</strong> and keep them consistent.</li>' +
      '<li>Keep the <strong>@id</strong> URLs stable so other pages (articles, products) can reference the same entity.</li></ul></div></div></div>';
    root.innerHTML = html;
    var $ = function (id) { return BT.$('#es-' + id, root); };
    var out = $('out'), warn = $('warn'), json = '';

    function lines(v) { return v.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean); }
    function list(v) { return v.split(',').map(function (s) { return s.trim(); }).filter(Boolean); }
    function isUrl(u) { return /^https:\/\/[^\s/$.?#].[^\s]*$/i.test(u); }

    function update() {
      var w = [];
      var site = $('org-url').value.trim(), base = site.replace(/\/+$/, '');
      if (!isUrl(site)) w.push('Website URL must be a full https:// address.');
      var orgId = base + '/#organization', personId = base + '/#founder', siteId = base + '/#website';
      var org = { '@type': $('org-type').value, '@id': orgId, name: $('org-name').value.trim() };
      if (!org.name) w.push('Add your organisation’s official name.');
      var alt = list($('org-alt').value); if (alt.length) org.alternateName = alt.length === 1 ? alt[0] : alt;
      org.url = site;
      var logo = $('org-logo').value.trim();
      if (logo) { org.logo = { '@type': 'ImageObject', url: logo }; if (!isUrl(logo)) w.push('Logo should be a full https:// URL.'); }
      if ($('org-desc').value.trim()) org.description = $('org-desc').value.trim();
      var fd = $('org-founded').value.trim();
      if (fd) { if (/^\d{4}(-\d{2}-\d{2})?$/.test(fd)) org.foundingDate = fd; else w.push('Founding date should look like 2020 or 2020-04-15.'); }
      var email = $('org-email').value.trim(), phone = $('org-phone').value.trim();
      if (email) org.email = email;
      if (phone) org.telephone = phone;
      var addr = { '@type': 'PostalAddress' };
      [['locality', 'addressLocality'], ['region', 'addressRegion'], ['postcode', 'postalCode'], ['country', 'addressCountry']].forEach(function (p) { var v = $('org-' + p[0]).value.trim(); if (v) addr[p[1]] = v; });
      if (Object.keys(addr).length > 1) org.address = addr;
      if (email || phone) org.contactPoint = { '@type': 'ContactPoint', contactType: 'customer support' };
      if (email) org.contactPoint.email = email;
      if (phone) org.contactPoint.telephone = phone;
      var same = lines($('org-same').value);
      same.forEach(function (u) { if (!isUrl(u)) w.push('Not a valid https URL in sameAs: ' + u); });
      if (same.length) org.sameAs = same; else w.push('Add your official social or directory profiles to sameAs. They help search engines confirm who you are.');
      var knows = list($('org-knows').value); if (knows.length) org.knowsAbout = knows;

      var graph = [org, { '@type': 'WebSite', '@id': siteId, url: site, name: org.name, publisher: { '@id': orgId } }];
      if ($('p-on').checked) {
        var pn = $('p-name').value.trim();
        if (!pn) w.push('Add the author’s name, or untick “Include an author”.');
        var p = { '@type': 'Person', '@id': personId, name: pn || 'Your Name' };
        if ($('p-title').value.trim()) p.jobTitle = $('p-title').value.trim();
        p.worksFor = { '@id': orgId };
        if ($('p-url').value.trim()) p.url = $('p-url').value.trim();
        if ($('p-img').value.trim()) p.image = $('p-img').value.trim();
        var ps = lines($('p-same').value); if (ps.length) p.sameAs = ps;
        var al = list($('p-alumni').value); if (al.length) p.alumniOf = al.map(function (n) { return { '@type': 'EducationalOrganization', name: n }; });
        var pk = list($('p-knows').value); if (pk.length) p.knowsAbout = pk;
        graph.push(p);
        org.founder = { '@id': personId };
      }
      json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/</g, '\\u003c');
      out.textContent = '<script type="application/ld+json">\n' + json + '\n</script>';
      warn.innerHTML = w.length ? '<div class="notice warn" style="margin-bottom:10px">' + BT.icon('info') + '<span>' + w.map(esc).join('<br>') + '</span></div>'
        : '<div class="notice ok" style="margin-bottom:10px">' + BT.icon('check') + '<span>Looks complete. Articles can reference the author with {"@id": "' + esc(personId) + '"}.</span></div>';
    }
    BT.bindInputs(root, update);
    root.addEventListener('input', BT.debounce(update, 120));
    $('copy').addEventListener('click', function () { BT.copy(out.textContent); });
    $('dl').addEventListener('click', function () { BT.download(new Blob([json], { type: 'application/ld+json' }), 'entity-schema.json'); });
  });

  // ================================================== Hreflang Tag Generator
  var LANGS = [['en', 'English'], ['hi', 'Hindi'], ['bn', 'Bengali'], ['ta', 'Tamil'], ['te', 'Telugu'], ['mr', 'Marathi'], ['gu', 'Gujarati'], ['kn', 'Kannada'], ['ml', 'Malayalam'], ['pa', 'Punjabi'], ['or', 'Odia'], ['as', 'Assamese'], ['ur', 'Urdu'], ['ne', 'Nepali'], ['ar', 'Arabic'], ['fr', 'French'], ['de', 'German'], ['es', 'Spanish'], ['pt', 'Portuguese'], ['ja', 'Japanese'], ['zh', 'Chinese']];
  var REGIONS = ['', 'IN', 'US', 'GB', 'AE', 'SG', 'AU', 'CA', 'NP', 'BD', 'LK'];
  var VALID_LANG = /^(x-default|[a-z]{2,3}(-[A-Z]{2}|-[0-9]{3})?)$/;

  BT.impl('hreflang-generator', function (root) {
    injectCss();
    root.innerHTML =
      '<div class="split wide-left"><div class="card"><div class="card-title"><h3>Page versions</h3>' +
      '<button type="button" class="btn btn-sm" id="hf-add">' + BT.icon('plus') + ' Add version</button></div>' +
      '<p class="small muted" style="margin-top:0">Add every language or region version of the <strong>same page</strong>, including the one you are on.</p>' +
      '<div class="gx-rows" id="hf-rows"></div>' +
      '<label class="check" style="margin-top:12px"><input type="checkbox" id="hf-xd" checked> Add x-default (fallback for all other visitors)</label>' +
      '<div class="field" style="margin-top:8px"><label for="hf-xdurl">x-default URL</label><input type="url" id="hf-xdurl" placeholder="Usually your main English or language-picker page"></div></div>' +
      '<div><div class="card"><div class="card-title"><h3>HTML &lt;head&gt; tags</h3><button type="button" class="btn btn-sm btn-primary" id="hf-copy1">' + BT.icon('copy') + ' Copy</button></div>' +
      '<div id="hf-warn"></div><pre class="output" id="hf-out1" tabindex="0" aria-label="Hreflang tags"></pre></div>' +
      '<div class="card"><div class="card-title"><h3>XML sitemap entries</h3><button type="button" class="btn btn-sm" id="hf-copy2">' + BT.icon('copy') + ' Copy</button></div>' +
      '<pre class="output" id="hf-out2" style="max-height:320px;overflow:auto" tabindex="0" aria-label="Sitemap entries"></pre>' +
      '<p class="small muted">Add xmlns:xhtml="http://www.w3.org/1999/xhtml" to your &lt;urlset&gt;. Use either head tags or the sitemap; both is fine but they must match.</p></div></div></div>';
    var rows = BT.$('#hf-rows', root);
    function addRow(lang, region, url) {
      var row = BT.h('div.gx-row');
      var sel = BT.h('select', { 'aria-label': 'Language and region' });
      LANGS.forEach(function (l) {
        REGIONS.forEach(function (r) {
          var code = l[0] + (r ? '-' + r : '');
          sel.appendChild(BT.h('option', { value: code, text: l[1] + (r ? ' (' + r + ')' : '') + ' – ' + code, selected: code === (lang + (region ? '-' + region : '')) }));
        });
      });
      var inp = BT.h('input', { type: 'url', placeholder: 'https://example.com/hi/page/', 'aria-label': 'Page URL', value: url || '' });
      var del = BT.h('button.btn.btn-sm.btn-ghost', { type: 'button', 'aria-label': 'Remove version', html: BT.icon('trash-2') });
      del.addEventListener('click', function () { row.remove(); update(); });
      row.appendChild(sel); row.appendChild(inp); row.appendChild(del);
      rows.appendChild(row);
    }
    addRow('en', 'IN', 'https://www.example.com/');
    addRow('hi', 'IN', 'https://www.example.com/hi/');
    addRow('bn', 'IN', 'https://www.example.com/bn/');
    BT.$('#hf-xdurl', root).value = 'https://www.example.com/';

    var o1 = BT.$('#hf-out1', root), o2 = BT.$('#hf-out2', root), warn = BT.$('#hf-warn', root);
    function update() {
      var w = [], seen = {}, entries = [];
      BT.$$('.gx-row', rows).forEach(function (r) {
        var code = r.querySelector('select').value, url = r.querySelector('input').value.trim();
        if (!url) return;
        if (!/^https?:\/\/[^\s]+$/i.test(url)) w.push('Use a full absolute URL (https://…): ' + url);
        if (!VALID_LANG.test(code)) w.push('Invalid hreflang code: ' + code);
        if (seen[code]) w.push('Duplicate language code ' + code + '. Each code should point to one URL.');
        seen[code] = true;
        entries.push([code, url]);
      });
      if (BT.$('#hf-xd', root).checked) {
        var xu = BT.$('#hf-xdurl', root).value.trim();
        if (xu) entries.push(['x-default', xu]); else w.push('Add the x-default URL, or untick the option.');
      }
      if (entries.length < 2) w.push('Add at least two versions. hreflang only makes sense between alternatives.');
      var urls = {};
      entries.forEach(function (e) { if (urls[e[1]] && e[0] !== 'x-default' && urls[e[1]] !== 'x-default') w.push('The same URL is used for ' + urls[e[1]] + ' and ' + e[0] + '.'); urls[e[1]] = urls[e[1]] || e[0]; });
      var tags = entries.map(function (e) { return '<link rel="alternate" hreflang="' + e[0] + '" href="' + e[1] + '" />'; }).join('\n');
      o1.textContent = tags;
      var xml = entries.filter(function (e) { return e[0] !== 'x-default'; }).map(function (e) {
        return '<url>\n  <loc>' + xmlEsc(e[1]) + '</loc>\n' + entries.map(function (x) { return '  <xhtml:link rel="alternate" hreflang="' + x[0] + '" href="' + xmlEsc(x[1]) + '"/>'; }).join('\n') + '\n</url>';
      }).join('\n');
      o2.textContent = xml;
      warn.innerHTML = (w.length ? '<div class="notice warn" style="margin-bottom:10px">' + BT.icon('info') + '<span>' + w.map(esc).join('<br>') + '</span></div>' : '<div class="notice ok" style="margin-bottom:10px">' + BT.icon('check') + '<span>Valid set. Put the same block on <strong>every</strong> version so each page links back to the others (return links).</span></div>');
    }
    function xmlEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    BT.$('#hf-add', root).addEventListener('click', function () { addRow('en', '', ''); update(); rows.lastChild.querySelector('input').focus(); });
    root.addEventListener('input', BT.debounce(update, 100));
    root.addEventListener('change', update);
    BT.$('#hf-copy1', root).addEventListener('click', function () { BT.copy(o1.textContent); });
    BT.$('#hf-copy2', root).addEventListener('click', function () { BT.copy(o2.textContent); });
    update();
  });
})();
