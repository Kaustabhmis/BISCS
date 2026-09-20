# GeoCRM — Google Sheets setup

GeoCRM (`geocrm.html` / your deployed `index.html`) is a single-file real-estate CRM. It runs in two modes:

- **Offline demo** — set `GAS_WEB_APP_URL = ""`. Uses built-in mock data, nothing is saved, safe for trying out features.
- **Google Sheets** (production) — every lead, property, remark, note, task, and change history is stored in a Google Sheet via a small Apps Script Web App (`apps-script/Code.gs`).

This guide wires up the Google Sheets mode and documents every role and method.

---

## 1. Create the spreadsheet

1. Go to <https://sheets.new> and create a spreadsheet. Name it e.g. **GeoCRM DB**.
2. `Extensions ▸ Apps Script`. This opens a script bound to the sheet.

## 2. Add the backend code

1. In the Apps Script editor, delete the placeholder `Code.gs` contents.
2. Paste the entire contents of **`apps-script/Code.gs`** from this repo.
3. Save (💾).

## 3. Create the sheets/tabs

1. In the Apps Script editor, pick the function **`setupSheets`** from the dropdown and click **Run**.
2. Approve the permission prompt the first time (it needs access to *this* spreadsheet).
3. Back in the spreadsheet you'll now have four tabs with headers:

   | Sheet | Columns |
   |-------|---------|
   | **Leads** | `LeadID, Name, Phone, Requirement, Status, Agent, Source, Priority, Remarks, Docs, CreatedAt, Email, Trashed, TrashedBy, TrashedAt, History` |
   | **Properties** | `PropertyID, Title, Type, Price, Address, Lat, Lng, Status, Image, AssignedTo, Remarks` |
   | **Tasks** | `TaskID, LeadName, Agent, TaskType, Date, Status` |
   | **Users** | `Email, Name, Salt, PasswordHash, Role, CreatedAt, Token` |

   > Upgrading from an earlier version? Re-run `setupSheets` after pasting the new `Code.gs` — it adds any newly introduced columns without touching existing data.

   `Remarks`, `Docs`, `AssignedTo`, and `History` are stored as JSON text in a single cell — the app and backend parse them automatically. `Status` values for leads must be one of `New, Contacted, Viewing, Negotiation, Closed` (the Kanban columns). `Trashed` is `"true"` or blank.

## 4. Deploy as a Web App

1. `Deploy ▸ New deployment ▸` gear icon ▸ **Web app**.
2. Settings:
   - **Execute as:** *Me*
   - **Who has access:** *Anyone* (required so the browser can call it without a Google login).
3. **Deploy**, approve, and copy the **Web app URL** (ends in `/exec`).

> Re-deploying: after editing `Code.gs`, use `Deploy ▸ Manage deployments ▸ ✏️ ▸ Version: New version` so the live URL picks up your changes. Pasting new code alone does **not** update the live `/exec` endpoint.

## 5. Point the frontend at it

In `geocrm.html`, find near the top of the `<script>` block:

```js
const GAS_WEB_APP_URL = "";
```

Paste your `/exec` URL between the quotes, then rename the file to `index.html` for static hosts (Netlify, etc.) that serve that filename by default:

```js
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfyc.../exec";
```

Reload the app. It now reads from and writes to your Google Sheet. `Syncing database...` flashes on each save. To go back to demo mode, set the URL back to `""`.

---

## Accounts & roles

Sign-up/sign-in run **server-side** against the **Users** sheet when a Web App URL is set. Passwords are stored as salted SHA-256 hashes — never plaintext.

- **The first account to sign up becomes Admin — then public sign-up locks.** Anyone else who tries to sign up is told to ask the Admin for an account.
- **Admins add team members from the "Team" tab** (visible to Admins only): set a name, email, temporary password, and role. The member signs in with those credentials right away. Admins can change anyone's role via a dropdown (Admin/Agent/CRM/Viewer) or remove them — but never their own account, and role changes to yourself are blocked server-side.

### The four roles

| Role | Sees | Can write |
|------|------|-----------|
| **Admin** | Everything | Everything — leads, properties, tasks, team, Excel import, permanent deletes |
| **Agent** | Only their own assigned leads/tasks. Properties only if explicitly assigned to them. | Full CRUD on their **own** leads (add/edit/reassign-away/move to Trash), add remarks, drag their own cards |
| **CRM** | **Everything** — every lead, every property, every task, like an Admin | Full management of **every** lead: add, edit any field, reassign to any employee (individually or in bulk), move to Trash, restore. Can add property notes. Cannot touch property records, tasks, team, or Excel import — those stay Admin-only |
| **Viewer** ("View Manager") | **Everything**, same as CRM | **Nothing.** Pure read-only — cannot add a remark, a note, or any record. Every write button is hidden in the UI and rejected server-side |

All of this is enforced **server-side in `doPost`**, not just hidden in the UI — a hand-crafted API call with a Viewer's token gets `"View Manager is read-only"`, and an Agent's token trying to touch a lead assigned to someone else gets `"You can only manage your own leads"`, regardless of what the browser shows.

Name matching (Agent ↔ lead's `Agent` field) is trimmed and case-insensitive, so a stray space or capitalization difference never silently hides an assigned lead.

## Lead management features

- **Search** — a search box lives on both the Dashboard and directly on the **Kanban Pipeline** tab; typing in either filters leads by name, requirement, phone, or email, and keeps both boxes in sync.
- **Bulk assignment** — Admins and CRM get a checkbox on every Kanban card. Ticking any shows an assign bar: pick an agent, one click reassigns every selected lead in a single Sheet write.
- **Individual reassignment** — the "Assigned Agent" dropdown in Add/Edit Lead (Admin/CRM only) includes an explicit **"— Unassigned —"** option, so a lead can be deliberately left unassigned rather than defaulting to whoever created it.
- **Trash** — moving a lead to Trash (the "Move to Trash" button in Edit Lead) is a **soft delete**: the lead disappears from the pipeline but isn't erased. A dedicated **Trash tab** (Admin + CRM) lists trashed leads with who trashed them and when, with a **Restore** button for everyone who can reach the tab and a **Delete Forever** button (single lead) plus **Empty Trash** (all at once) reserved for **Admin only** — the only truly destructive, unrecoverable actions in the app.
- **Version history** — every lead has a **History** tab (next to Remarks/Matches/Vault) logging every field change, stage move, reassignment, and trash/restore action, each stamped with who made it and when. History is computed client-side (the same pattern as Remarks) so it works identically in offline demo mode and once connected to Sheets — the server stamps the authoritative name/timestamp when it persists.
- **Property notes** — every property has a Notes button (💬 on hover) open to every role that can see the property; Viewer can read notes but not add them.
- **Duplicate detection & no-contact filtering** — capturing a lead whose phone/email matches an existing one warns before adding; Excel import skips rows with neither a phone nor an email and reports the skip count; the Admin-only **Clean Up** button purges existing no-contact leads.
- **Excel import** (Admin only) — `.xlsx`/`.xls`/`.csv` with automatic column-name mapping, a preview before committing, and optional bulk-assignment to one agent.

## How the pieces talk

```
geocrm.html ──POST {method, args, token} (text/plain)──▶ doPost(e) in Code.gs ──▶ Google Sheet
     ▲                                                                                │
     └──────────────────────────── JSON rows ◀────────────── readSheet() ◀───────────┘
```

The request is sent as `text/plain` on purpose: it stops the browser from firing a CORS preflight `OPTIONS`, which Apps Script Web Apps do not answer.

**Every call except `signup`/`login` must carry a valid session token** — issued at sign-in, sent automatically with each request, and checked against the Users sheet. A revoked or missing token returns `{"error": "Unauthorized"}` and the app forces a clean re-login. Logging in again replaces the previous token (one active session per user).

### Methods reference

| Method | Who | Effect |
|--------|-----|--------|
| `signup` / `login` | Public | Bootstrap the first Admin / verify credentials and issue a token (sign-up locks after the first account) |
| `logout` | Any authenticated user | Clear the session token server-side |
| `getUsers` / `addUser` / `updateUserRole` / `deleteUser` | Admin only | List / create / re-role / remove team members |
| `getAgents` | Any authenticated user | Names + roles, for assignment dropdowns |
| `getLeads` / `getProperties` / `getFollowUps` | Any authenticated user | Read all rows (visibility is filtered client-side by role) |
| `addLead` | Agent (own), CRM, Admin | Append a new lead |
| `updateLead` | Owner Agent, CRM, Admin | Update any field; persists the client-computed History entries, stamped with the real caller's name/time |
| `updateLeadStatus` | Owner Agent, CRM, Admin | Kanban drag — change stage, logs a History entry |
| `trashLead` / `restoreLead` | Owner Agent, CRM, Admin | Soft delete / undelete a lead |
| `purgeLead` / `purgeAllTrash` | **Admin only** | Permanently remove one or all trashed leads |
| `assignLeadsBulk` | CRM, Admin | Reassign many leads to one agent in a single write, with per-lead History entries |
| `addRemark` | Owner Agent, CRM, Admin | Append a remark to a lead |
| `addPropertyRemark` | Any authenticated user except Viewer | Append a note to a property |
| `addProperty` / `updateProperty` / `deleteProperty` | Admin | Manage property records |
| `addLeadsBulk` / `addPropertiesBulk` | Admin only | Bulk import (single batched Sheet write) |
| `deleteLeadsNoContact` | Admin only | Purge existing leads with no phone/email |
| `addTask` / `updateTask` | Non-CRM, non-Viewer roles | Calendar tasks |

## Notes & limits

- **Auth is solid for a small team, not a bank.** Credentials are verified server-side, hashed at rest, and every data call requires a session token. Remaining limits: tokens live in `localStorage` and don't expire on a timer (only on logout or a new login).
- **Concurrency:** Apps Script serializes calls per user; fine for a small team, not a high-throughput database.
- **Scale:** Kanban columns render the first 50 cards each (search reaches everything, counts always show real totals); the property panel lists the first 100 with the first 300 map pins; bulk writes use single-batch Sheet calls so imports of thousands of rows complete in seconds.
- **Writes are optimistic:** the UI updates immediately, then syncs. If a sync fails you'll see an error toast and the change reconciles on the next reload.
- **Document Vault** ("+ Upload File") is still a simulation — hooking it to Google Drive is a natural next step.
- **Dialer** places real calls via the device's own phone app (`tel:` links) while GeoCRM runs the call timer and prompts you to log a remark afterward — it is not a VoIP service.
