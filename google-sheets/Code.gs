/**
 * Kunnect website — Google Sheet backend
 * ──────────────────────────────────────
 * This sheet is the website's database, and this script is its backend.
 *
 *   • The website (kunnectds.in) reads its content from here on every visit.
 *   • The admin panel (kunnectds.in/admin.html) logs in here and saves here.
 *
 * Setup (once):
 *   1. Extensions → Apps Script → paste this whole file → set the admin
 *      username and password below → Save.
 *   2. Deploy → New deployment → type: Web app → Execute as: Me →
 *      Who has access: Anyone → Deploy → Authorize → copy the Web app URL
 *      (it ends in /exec).
 *   3. Put that URL in Netlify (see google-sheets/README.md) and upload the site.
 *
 * After changing this code: Deploy → Manage deployments → Edit (pencil) →
 * Version: New version → Deploy. The URL stays the same.
 */

// ── Settings ────────────────────────────────────────────────────────────────

/** The main admin login. Choose a long password (12+ characters). */
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'CHANGE-THIS-PASSWORD';

/** Google Drive folder for images uploaded in the admin panel. */
const IMAGE_FOLDER = 'Kunnect website images';

/** How long an admin login lasts. */
const SESSION_HOURS = 8;

/** Tabs that are never sent to the website. Tabs starting with "_" are private too. */
const PRIVATE_TABS = ['Start here'];

/** Private tab with extra admin users (created automatically, hidden). */
const USERS_TAB = '_Admin Users';
const USER_COLUMNS = ['username', 'name', 'salt', 'hash', 'version', 'createdAt', 'createdBy'];

// ── Menu ────────────────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Website').addItem('Help', 'showHelp').addToUi();
}

/** Manual edits update the website right away and protect against overwriting. */
function onEdit() {
  bumpRevision_();
}

function showHelp() {
  SpreadsheetApp.getUi().alert(
    'Website help',
    'The website reads this sheet directly — changes appear for visitors within a few minutes ' +
      '(they may need to refresh).\n\nThe easiest way to edit is the admin panel: kunnectds.in/admin.html',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

const props_ = () => PropertiesService.getScriptProperties();

function revision_() {
  return props_().getProperty('revision') || '1';
}

function bumpRevision_() {
  const next = String(Number(revision_()) + 1);
  props_().setProperty('revision', next);
  CacheService.getScriptCache().remove('content');
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

const b64_ = (bytes) => Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '');

function secret_() {
  let s = props_().getProperty('tokenSecret');
  if (!s) {
    s = Utilities.getUuid() + Utilities.getUuid();
    props_().setProperty('tokenSecret', s);
  }
  return s;
}

function sign_(text) {
  return b64_(Utilities.computeHmacSha256Signature(text, secret_()));
}

function sameText_(a, b) {
  // Compare signatures of both values so timing does not reveal how much matched.
  return sign_('cmp:' + a) === sign_('cmp:' + b);
}

function hashPassword_(password, salt) {
  let h = b64_(Utilities.computeHmacSha256Signature(password, salt));
  for (let i = 0; i < 2000; i++) h = b64_(Utilities.computeHmacSha256Signature(h + password, salt));
  return h;
}

function passwordProblem_(p) {
  if (typeof p !== 'string' || p.length < 10) return 'Use at least 10 characters.';
  if (p.length > 200) return 'Use at most 200 characters.';
  return '';
}

// ── Users & sessions ────────────────────────────────────────────────────────

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
    const u = {};
    header.forEach(function (h, i) { u[h] = String(r[i]); });
    return u;
  });
}

function saveUsers_(users) {
  const sheet = usersSheet_();
  const last = sheet.getLastRow();
  if (last > 1) sheet.getRange(2, 1, last - 1, USER_COLUMNS.length).clearContent();
  const rows = users.map(function (u) {
    return USER_COLUMNS.map(function (c) { return u[c] === undefined ? '' : String(u[c]); });
  });
  if (rows.length) sheet.getRange(2, 1, rows.length, USER_COLUMNS.length).setNumberFormat('@').setValues(rows);
}

const ownerName_ = () => String(ADMIN_USERNAME).trim().toLowerCase();
const ownerVersion_ = () => sign_('owner:' + ADMIN_PASSWORD).slice(0, 16);
const ownerReady_ = () => ADMIN_PASSWORD && ADMIN_PASSWORD !== 'CHANGE-THIS-PASSWORD' && ADMIN_PASSWORD.length >= 10;

function createToken_(user) {
  const payload = b64_(Utilities.newBlob(JSON.stringify({ u: user.username, v: user.version, exp: Date.now() + SESSION_HOURS * 3600000 })).getBytes());
  return payload + '.' + sign_(payload);
}

/** Returns the signed-in user for a token, or null. */
function userFromToken_(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2 || sign_(parts[0]) !== parts[1]) return null;
  let data;
  try {
    data = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
  } catch (e) {
    return null;
  }
  if (!data || data.exp < Date.now()) return null;
  if (data.u === ownerName_()) return data.v === ownerVersion_() ? { username: ownerName_(), name: 'Owner', owner: true } : null;
  const u = getUsers_().filter(function (x) { return x.username === data.u; })[0];
  return u && String(u.version) === String(data.v) ? { username: u.username, name: u.name, owner: false, version: u.version } : null;
}

function login_(body) {
  if (!ownerReady_()) return { error: 'The admin password has not been set yet. Open the sheet → Extensions → Apps Script and set ADMIN_PASSWORD (10+ characters), then deploy a new version.' };
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  const cache = CacheService.getScriptCache();
  const failKey = 'fail:' + username;
  const fails = Number(cache.get(failKey) || 0);
  if (fails >= 5) return { error: 'Too many wrong attempts. Please wait 15 minutes and try again.' };

  let user = null;
  if (sameText_(username, ownerName_())) {
    if (sameText_(password, ADMIN_PASSWORD)) user = { username: ownerName_(), name: 'Owner', owner: true, version: ownerVersion_() };
  } else {
    const u = getUsers_().filter(function (x) { return x.username === username; })[0];
    if (u && sameText_(hashPassword_(password, u.salt), u.hash)) user = { username: u.username, name: u.name, owner: false, version: u.version };
  }
  if (!user) {
    cache.put(failKey, String(fails + 1), 900);
    return { error: 'Wrong username or password.' };
  }
  cache.remove(failKey);
  return { token: createToken_(user), user: { username: user.username, name: user.name, owner: user.owner } };
}

// ── Content ─────────────────────────────────────────────────────────────────

/** Finds the header row (first cell equal to `first`). Returns a 1-based row number or 0. */
function headerRow_(values, first) {
  for (let i = 0; i < values.length; i++) if (String(values[i][0]).trim().toLowerCase() === first) return i + 1;
  return 0;
}

const norm_ = function (h) { return String(h).replace(/\(.*?\)/g, '').trim().toLowerCase(); };

const MAX_TEXT = 10000;

/**
 * Saves admin-panel edits.
 *   settings: { "Company": { "contact.phone": "+91 …" } }   (Value column, matched by Key)
 *   lists:    { "Testimonials": [ { "show": "Yes", "quote": "…" } ] }   (replaces the rows)
 *   revision: the revision the editor started from; if the sheet changed since, nothing is written.
 */
function write_(body) {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) return { error: 'The sheet is busy saving another change. Please try again.' };
  try {
    if (String(body.revision) !== revision_()) return { error: 'conflict', revision: revision_() };
    const ss = SpreadsheetApp.getActive();
    const text = function (v) { return String(v === undefined || v === null ? '' : v).slice(0, MAX_TEXT); };

    Object.keys(body.settings || {}).forEach(function (tabName) {
      const sheet = ss.getSheetByName(tabName);
      if (!sheet || isPrivate_(tabName)) return;
      const values = sheet.getDataRange().getValues();
      const hr = headerRow_(values, 'key');
      if (!hr) return;
      const valueCol = values[hr - 1].map(norm_).indexOf('value') + 1;
      if (!valueCol) return;
      const rowOf = {};
      for (let r = hr; r < values.length; r++) rowOf[String(values[r][0]).trim()] = r + 1;
      const updates = body.settings[tabName] || {};
      Object.keys(updates).forEach(function (key) {
        if (!/^[\w.]{1,80}$/.test(key)) return;
        let row = rowOf[key];
        if (!row) {
          row = sheet.getLastRow() + 1;
          sheet.getRange(row, 1).setNumberFormat('@').setValue(key);
          rowOf[key] = row;
        }
        sheet.getRange(row, valueCol).setNumberFormat('@').setValue(text(updates[key]));
      });
    });

    Object.keys(body.lists || {}).forEach(function (tabName) {
      const sheet = ss.getSheetByName(tabName);
      if (!sheet || isPrivate_(tabName)) return;
      const values = sheet.getDataRange().getValues();
      const hr = headerRow_(values, 'show');
      if (!hr) return;
      const headers = values[hr - 1].map(norm_);
      const width = headers.length;
      const items = (body.lists[tabName] || []).slice(0, 300);
      const rows = items.map(function (item) {
        const byHeader = {};
        Object.keys(item || {}).forEach(function (k) { byHeader[norm_(k)] = item[k]; });
        return headers.map(function (h) { return byHeader[h] === undefined ? '' : text(byHeader[h]); });
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

/** Stores an uploaded image in Google Drive, shared as "anyone with the link can view". */
function upload_(body) {
  const allowed = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' };
  if (!allowed[body.mimeType]) return { error: 'Please upload a PNG, JPG, WebP, GIF or AVIF image.' };
  const bytes = Utilities.base64Decode(String(body.data || ''));
  if (!bytes.length) return { error: 'The image is empty.' };
  if (bytes.length > 5 * 1024 * 1024) return { error: 'Images must be 5 MB or smaller.' };
  const folders = DriveApp.getFoldersByName(IMAGE_FOLDER);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(IMAGE_FOLDER);
  const base = String(body.name || 'image').replace(/\.[^.]+$/, '').replace(/[^\w .()-]/g, '').slice(0, 80) || 'image';
  const file = folder.createFile(Utilities.newBlob(bytes, body.mimeType, base + '.' + allowed[body.mimeType]));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { id: file.getId(), url: 'https://drive.google.com/file/d/' + file.getId() + '/view' };
}

// ── Web app ─────────────────────────────────────────────────────────────────

/** Public, read-only: the website's content (no private tabs). Cached for a few minutes. */
function doGet() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('content');
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
  const text = JSON.stringify({ version: 2, revision: revision_(), updated: new Date().toISOString(), tabs: readTabs_() });
  if (text.length < 95000) cache.put('content', text, 300);
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}

/** Admin panel API: POST {action, token, …} as text. */
function doPost(e) {
  let body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ error: 'Invalid request.' });
  }
  try {
    if (body.action === 'login') return json_(login_(body));

    const me = userFromToken_(body.token);
    if (!me) return json_({ error: 'session', message: 'Please log in again.' });

    switch (body.action) {
      case 'me':
        return json_({ user: { username: me.username, name: me.name, owner: me.owner } });
      case 'read':
        return json_({ revision: revision_(), tabs: readTabs_() });
      case 'write':
        return json_(write_(body));
      case 'upload':
        return json_(upload_(body));
      case 'users': {
        const users = getUsers_().map(function (u) { return { username: u.username, name: u.name, owner: false, createdAt: u.createdAt, createdBy: u.createdBy }; });
        return json_({ users: [{ username: ownerName_(), name: 'Owner', owner: true, createdAt: '', createdBy: '' }].concat(users) });
      }
      case 'addUser': {
        const username = String(body.username || '').trim().toLowerCase();
        const name = String(body.name || '').trim().slice(0, 80);
        if (!/^[a-z0-9._-]{3,32}$/.test(username)) return json_({ error: 'Usernames are 3–32 characters: lowercase letters, numbers, dots, dashes or underscores.' });
        if (!name) return json_({ error: 'Please enter the person’s name.' });
        const problem = passwordProblem_(body.password);
        if (problem) return json_({ error: 'Password: ' + problem });
        const users = getUsers_();
        if (username === ownerName_() || users.some(function (u) { return u.username === username; })) return json_({ error: 'That username is already taken.' });
        if (users.length >= 20) return json_({ error: 'You can have up to 20 users.' });
        const salt = Utilities.getUuid();
        users.push({ username: username, name: name, salt: salt, hash: hashPassword_(body.password, salt), version: 1, createdAt: new Date().toISOString(), createdBy: me.username });
        saveUsers_(users);
        return json_({ ok: true });
      }
      case 'removeUser': {
        const username = String(body.username || '').toLowerCase();
        if (username === ownerName_()) return json_({ error: 'The main admin account is set in the Apps Script and can’t be removed here.' });
        if (username === me.username) return json_({ error: 'You can’t remove your own account while logged in.' });
        saveUsers_(getUsers_().filter(function (u) { return u.username !== username; }));
        return json_({ ok: true });
      }
      case 'changePassword': {
        if (me.owner) return json_({ error: 'The main admin password is set in the Apps Script (ADMIN_PASSWORD). Change it there and deploy a new version.' });
        const problem = passwordProblem_(body.password);
        if (problem) return json_({ error: 'New password: ' + problem });
        const users = getUsers_();
        const u = users.filter(function (x) { return x.username === me.username; })[0];
        if (!u || !sameText_(hashPassword_(String(body.current || ''), u.salt), u.hash)) return json_({ error: 'Your current password is not correct.' });
        u.salt = Utilities.getUuid();
        u.hash = hashPassword_(body.password, u.salt);
        u.version = Number(u.version || 1) + 1;
        saveUsers_(users);
        return json_({ ok: true, signedOut: true });
      }
      default:
        return json_({ error: 'Unknown action.' });
    }
  } catch (err) {
    return json_({ error: 'Sheet error: ' + (err && err.message ? err.message : err) });
  }
}
