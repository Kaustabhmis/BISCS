/**
 * Kunnect website — Google Sheets connector
 * ─────────────────────────────────────────
 * This sheet is the website's database. The admin panel at
 * kunnectds.in/admin.html reads and writes it through this script, and every
 * website build reads its content from here.
 *
 * Paste this whole file into the sheet's Apps Script editor
 * (Extensions → Apps Script), fill in the two settings below, and deploy it
 * as a web app. Full steps: google-sheets/README.md in the website project.
 *
 * What it provides:
 *   1. A "Website → Publish changes" menu (for editing the sheet directly).
 *   2. A private API, protected by SECRET_KEY, used by the website:
 *        GET  ?key=…                     read all content (website builds)
 *        POST {key, action: 'read'}       read content + revision (admin panel)
 *        POST {key, action: 'write'}      save edits from the admin panel
 *        POST {key, action: 'upload'}     store an image in Google Drive
 *        POST {key, action: 'getUsers'}   admin-panel users (hashed passwords)
 *        POST {key, action: 'setUsers'}
 */

// ── Settings ────────────────────────────────────────────────────────────────

/** Netlify build hook URL (Netlify → Site configuration → Build & deploy → Build hooks). */
const NETLIFY_BUILD_HOOK = 'PASTE_YOUR_NETLIFY_BUILD_HOOK_URL_HERE';

/**
 * A long random password that protects the API. Use letters and numbers only,
 * at least 24 characters. The same value goes at the end of the
 * CONTENT_SHEET_URL variable in Netlify (…/exec?key=THIS_VALUE).
 */
const SECRET_KEY = 'PASTE_A_LONG_RANDOM_PASSWORD_HERE';

/** Google Drive folder for images uploaded through the admin panel. */
const IMAGE_FOLDER = 'Kunnect website images';

/** Tabs that are never sent to the website. Tabs starting with "_" are private too. */
const PRIVATE_TABS = ['Start here'];

/** Private tab that stores admin-panel users (created automatically, hidden). */
const USERS_TAB = '_Admin Users';
const USER_COLUMNS = ['username', 'name', 'salt', 'hash', 'version', 'createdAt', 'createdBy'];

// ── Menu ────────────────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Website')
    .addItem('Publish changes', 'publishWebsite')
    .addSeparator()
    .addItem('Help', 'showHelp')
    .addToUi();
}

/** Any manual edit changes the revision, so the admin panel never overwrites it unknowingly. */
function onEdit() {
  bumpRevision_();
}

function publishWebsite() {
  const ui = SpreadsheetApp.getUi();
  if (!/^https:\/\/api\.netlify\.com\/build_hooks\//.test(NETLIFY_BUILD_HOOK)) {
    ui.alert('Not set up yet', 'Add your Netlify build hook URL to NETLIFY_BUILD_HOOK in Extensions → Apps Script.', ui.ButtonSet.OK);
    return;
  }
  const answer = ui.alert('Publish changes?', 'The website will be rebuilt with the content in this sheet. It takes about 2 minutes.', ui.ButtonSet.OK_CANCEL);
  if (answer !== ui.Button.OK) return;
  const response = UrlFetchApp.fetch(NETLIFY_BUILD_HOOK, { method: 'post', contentType: 'application/json', payload: '{}', muteHttpExceptions: true });
  const code = response.getResponseCode();
  if (code >= 200 && code < 300) {
    SpreadsheetApp.getActive().toast('Publishing started — the website updates in about 2 minutes.', 'Website', 8);
  } else {
    ui.alert('Publishing failed', 'Netlify answered with error ' + code + '. Check the build hook URL.', ui.ButtonSet.OK);
  }
}

function showHelp() {
  SpreadsheetApp.getUi().alert(
    'Website help',
    'Most edits are easiest in the admin panel: kunnectds.in/admin.html\n\n' +
      'You can also edit the tabs here, then choose Website → Publish changes.\n\n' +
      'If the website did not change after a few minutes, open Netlify → Deploys to see the build log.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ── API ─────────────────────────────────────────────────────────────────────

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function keyOk_(key) {
  return SECRET_KEY && SECRET_KEY.indexOf('PASTE_') !== 0 && SECRET_KEY.length >= 24 && key === SECRET_KEY;
}

function revision_() {
  return PropertiesService.getScriptProperties().getProperty('revision') || '0';
}

function bumpRevision_() {
  const next = String(Number(revision_()) + 1);
  PropertiesService.getScriptProperties().setProperty('revision', next);
  return next;
}

function isPrivate_(name) {
  return PRIVATE_TABS.indexOf(name) !== -1 || name.charAt(0) === '_';
}

function cellText_(v, tz) {
  if (v instanceof Date) return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return v === null || v === undefined ? '' : String(v);
}

function readTabs_() {
  const tz = Session.getScriptTimeZone();
  const tabs = {};
  SpreadsheetApp.getActive().getSheets().forEach(function (sheet) {
    const name = sheet.getName();
    if (isPrivate_(name)) return;
    tabs[name] = sheet.getDataRange().getValues().map(function (row) {
      return row.map(function (v) { return cellText_(v, tz); });
    });
  });
  return tabs;
}

/** Website builds: GET …/exec?key=… */
function doGet(e) {
  const key = (e && e.parameter && e.parameter.key) || '';
  if (!keyOk_(key)) return json_({ error: 'unauthorised' });
  return json_({ version: 1, revision: revision_(), updated: new Date().toISOString(), tabs: readTabs_() });
}

/** Admin panel: POST JSON {key, action, …} */
function doPost(e) {
  let body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ error: 'invalid request' });
  }
  if (!keyOk_(body.key)) return json_({ error: 'unauthorised' });
  try {
    switch (body.action) {
      case 'read':
        return json_({ revision: revision_(), tabs: readTabs_() });
      case 'write':
        return json_(write_(body));
      case 'upload':
        return json_(upload_(body));
      case 'getUsers':
        return json_({ users: getUsers_() });
      case 'setUsers':
        return json_(setUsers_(body.users));
      default:
        return json_({ error: 'unknown action' });
    }
  } catch (err) {
    return json_({ error: String(err && err.message ? err.message : err) });
  }
}

/** Finds the header row (first cell equal to `first`, case-insensitive). Returns a 1-based row number or 0. */
function headerRow_(values, first) {
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === first) return i + 1;
  }
  return 0;
}

const norm_ = function (h) { return String(h).replace(/\(.*?\)/g, '').trim().toLowerCase(); };

/**
 * Saves admin-panel edits.
 *   settings: { "Company": { "contact.phone": "+91 …", … }, … }   (Value column, matched by Key)
 *   lists:    { "Testimonials": [ { "Show": "Yes", "Quote": "…", … }, … ], … }   (replaces the rows)
 *   revision: the revision the editor started from; a different one means someone
 *             else changed the sheet in the meantime, and nothing is written.
 */
function write_(body) {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) return { error: 'busy' };
  try {
    if (String(body.revision) !== revision_()) return { error: 'conflict', revision: revision_() };
    const ss = SpreadsheetApp.getActive();

    Object.keys(body.settings || {}).forEach(function (tabName) {
      const sheet = ss.getSheetByName(tabName);
      if (!sheet || isPrivate_(tabName)) throw new Error('Missing tab: ' + tabName);
      const values = sheet.getDataRange().getValues();
      const hr = headerRow_(values, 'key');
      if (!hr) throw new Error('No Key column in tab ' + tabName);
      const valueCol = values[hr - 1].map(norm_).indexOf('value') + 1;
      const updates = body.settings[tabName];
      const rowOf = {};
      for (let r = hr; r < values.length; r++) rowOf[String(values[r][0]).trim()] = r + 1;
      Object.keys(updates).forEach(function (key) {
        const value = String(updates[key]);
        let row = rowOf[key];
        if (!row) {
          row = sheet.getLastRow() + 1;
          sheet.getRange(row, 1).setNumberFormat('@').setValue(key);
        }
        sheet.getRange(row, valueCol).setNumberFormat('@').setValue(value);
      });
    });

    Object.keys(body.lists || {}).forEach(function (tabName) {
      if (isPrivate_(tabName)) throw new Error('Private tab: ' + tabName);
      const sheet = ss.getSheetByName(tabName);
      if (!sheet) throw new Error('Missing tab: ' + tabName);
      const values = sheet.getDataRange().getValues();
      const hr = headerRow_(values, 'show');
      if (!hr) throw new Error('No Show column in tab ' + tabName);
      const headers = values[hr - 1].map(norm_);
      const width = headers.length;
      const rows = (body.lists[tabName] || []).map(function (item) {
        const byHeader = {};
        Object.keys(item).forEach(function (k) { byHeader[norm_(k)] = item[k]; });
        return headers.map(function (h) { return byHeader[h] === undefined ? '' : String(byHeader[h]); });
      });
      const last = sheet.getLastRow();
      if (last > hr) sheet.getRange(hr + 1, 1, last - hr, width).clearContent();
      if (rows.length) sheet.getRange(hr + 1, 1, rows.length, width).setNumberFormat('@').setValues(rows);
    });

    SpreadsheetApp.flush();
    return { ok: true, revision: bumpRevision_() };
  } finally {
    lock.releaseLock();
  }
}

/** Stores an uploaded image in Google Drive and shares it as "anyone with the link can view". */
function upload_(body) {
  const allowed = { 'image/png': 1, 'image/jpeg': 1, 'image/webp': 1, 'image/gif': 1, 'image/avif': 1 };
  if (!allowed[body.mimeType]) return { error: 'unsupported image type' };
  const bytes = Utilities.base64Decode(body.data || '');
  if (!bytes.length || bytes.length > 5 * 1024 * 1024) return { error: 'image too large' };
  const folders = DriveApp.getFoldersByName(IMAGE_FOLDER);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(IMAGE_FOLDER);
  const name = String(body.name || 'image').replace(/[^\w .()-]/g, '').slice(0, 100) || 'image';
  const file = folder.createFile(Utilities.newBlob(bytes, body.mimeType, name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { id: file.getId(), url: 'https://drive.google.com/file/d/' + file.getId() + '/view' };
}

function usersSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(USERS_TAB);
  if (!sheet) {
    sheet = ss.insertSheet(USERS_TAB);
    sheet.getRange(1, 1, 1, USER_COLUMNS.length).setValues([USER_COLUMNS]);
    sheet.hideSheet();
  }
  return sheet;
}

function getUsers_() {
  const values = usersSheet_().getDataRange().getValues();
  const header = values[0];
  return values.slice(1).filter(function (r) { return r[0]; }).map(function (r) {
    const user = {};
    header.forEach(function (h, i) { user[h] = String(r[i]); });
    return user;
  });
}

function setUsers_(users) {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) return { error: 'busy' };
  try {
    const sheet = usersSheet_();
    const last = sheet.getLastRow();
    if (last > 1) sheet.getRange(2, 1, last - 1, USER_COLUMNS.length).clearContent();
    const rows = (users || []).map(function (u) {
      return USER_COLUMNS.map(function (c) { return u[c] === undefined ? '' : String(u[c]); });
    });
    if (rows.length) sheet.getRange(2, 1, rows.length, USER_COLUMNS.length).setNumberFormat('@').setValues(rows);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}
