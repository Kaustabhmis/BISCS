/**
 * Kunnect website — Google Sheets connector
 * ─────────────────────────────────────────
 * Paste this whole file into the sheet's Apps Script editor
 * (Extensions → Apps Script), fill in the two settings below, and deploy it
 * as a web app. Full steps: google-sheets/README.md in the website project.
 *
 * What it does:
 *   1. Adds a "Website → Publish changes" menu that asks Netlify to rebuild
 *      the site with the latest content from this sheet.
 *   2. Serves the sheet's content (read-only) to the website build through a
 *      private web-app URL protected by SECRET_KEY.
 */

// ── Settings ────────────────────────────────────────────────────────────────

/** Netlify build hook URL (Netlify → Site configuration → Build & deploy → Build hooks). */
const NETLIFY_BUILD_HOOK = 'PASTE_YOUR_NETLIFY_BUILD_HOOK_URL_HERE';

/**
 * A long random password that protects the content link. Use letters and
 * numbers only, at least 24 characters. The same value goes at the end of the
 * CONTENT_SHEET_URL variable in Netlify (…/exec?key=THIS_VALUE).
 */
const SECRET_KEY = 'PASTE_A_LONG_RANDOM_PASSWORD_HERE';

// ── Menu ────────────────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Website')
    .addItem('Publish changes', 'publishWebsite')
    .addSeparator()
    .addItem('Help', 'showHelp')
    .addToUi();
}

function publishWebsite() {
  const ui = SpreadsheetApp.getUi();
  if (!/^https:\/\/api\.netlify\.com\/build_hooks\//.test(NETLIFY_BUILD_HOOK)) {
    ui.alert('Not set up yet', 'Add your Netlify build hook URL to NETLIFY_BUILD_HOOK in Extensions → Apps Script.', ui.ButtonSet.OK);
    return;
  }
  const answer = ui.alert('Publish changes?', 'The website will be rebuilt with the content in this sheet. It takes about 2 minutes.', ui.ButtonSet.OK_CANCEL);
  if (answer !== ui.Button.OK) return;
  const response = UrlFetchApp.fetch(NETLIFY_BUILD_HOOK, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({}),
    muteHttpExceptions: true,
  });
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
    'Edit the tabs, then choose Website → Publish changes.\n\n' +
      'If the website did not change after a few minutes, open Netlify → Deploys to see the build log ' +
      '(it lists any rows that need fixing).',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ── Content link (read-only) ────────────────────────────────────────────────

/** Tabs that are never sent to the website. */
const PRIVATE_TABS = ['Start here'];

function doGet(e) {
  const key = (e && e.parameter && e.parameter.key) || '';
  if (!SECRET_KEY || SECRET_KEY.indexOf('PASTE_') === 0 || key !== SECRET_KEY) {
    return json({ error: 'unauthorised' });
  }
  const tz = Session.getScriptTimeZone();
  const tabs = {};
  SpreadsheetApp.getActive()
    .getSheets()
    .forEach(function (sheet) {
      const name = sheet.getName();
      if (PRIVATE_TABS.indexOf(name) !== -1 || name.charAt(0) === '_') return;
      const values = sheet.getDataRange().getValues();
      tabs[name] = values.map(function (row) {
        return row.map(function (v) {
          if (v instanceof Date) return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
          if (typeof v === 'boolean') return v ? 'Yes' : 'No';
          return v === null || v === undefined ? '' : String(v);
        });
      });
    });
  return json({ version: 1, updated: new Date().toISOString(), tabs: tabs });
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
