# Admin panel + Google Sheet database

All website content (testimonials, team, clients and collaborators, services,
page text, contact details, colours, SEO) is stored in **one Google Sheet**,
which works as the website's database.

Editors use the **admin panel at `kunnectds.in/admin.html`**: log in with a
username and password, edit forms, upload images, and click **Save &
publish**. The admin panel writes to the Google Sheet, and the website
rebuilds itself in about 2 minutes. Nobody needs a GitHub account, and editors
never have to open the sheet (though they can).

```
kunnectds.in/admin.html ──▶ Netlify Functions ──▶ Google Sheet (Apps Script API)
   (login, forms, uploads)    (checks every value)     content · users · images in Drive
                                     │
                                     └──▶ Netlify build hook ──▶ build reads the sheet,
                                                                 pre-renders every page
```

Files in this folder:

| File | What it is |
| --- | --- |
| `Kunnect-Website-Content.xlsx` | The sheet template, pre-filled with the current website content |
| `Code.gs` | The Apps Script: the private API used by the admin panel and the builds, plus a *Website* menu |

---

## One-time setup (about 20 minutes)

You need: a Google account, and the website deployed on Netlify from its code
repository (see the main README → *Deploying*). Netlify uses the code
repository only to build the site; you never edit there.

### 1. Create the Google Sheet

1. Go to **drive.google.com → New → File upload** and upload
   `Kunnect-Website-Content.xlsx`.
2. Open it with **Google Sheets**, then choose **File → Save as Google Sheets**.
   Use the new Google Sheets version from now on; you can delete the uploaded `.xlsx`.
3. Keep the sheet **private** (only share it with people who should edit the
   website). The website reads it through the private link created below.

### 2. Add the script

1. In the sheet: **Extensions → Apps Script**.
2. Delete everything in `Code.gs`, then paste the whole contents of `Code.gs` from this folder.
3. Create a password for the content link: a random string of 24+ letters
   and numbers (for example from a password manager). Put it in `SECRET_KEY`.
4. Leave `NETLIFY_BUILD_HOOK` for now (step 4). Click **Save**.

### 3. Create the private content link

1. In Apps Script: **Deploy → New deployment**, then click the gear and choose **Web app**.
2. Description: `Website content`. **Execute as: Me**. **Who has access: Anyone**.
   (“Anyone” is required so Netlify can call it. It only returns content when the
   correct password is included, and it never allows changes.)
3. Click **Deploy** and **Authorize access** (choose your account, then
   *Advanced → Go to …* if Google warns that the app is unverified, since it's your own script).
4. Copy the **Web app URL** (it ends in `/exec`).
5. Your content link is that URL plus `?key=` and your password, for example:
   `https://script.google.com/macros/s/AKfy…/exec?key=YOUR_SECRET_KEY`

   Open it in a browser: you should see text starting with `{"version":1`.

### 4. Connect Netlify

1. Netlify → **Site configuration → Build & deploy → Build hooks → Add build hook**.
   Name it `Website content` and copy the hook URL.
2. Back in Apps Script, paste the hook URL into `NETLIFY_BUILD_HOOK` and **Save**.
3. Netlify → your site → **Site configuration → Environment variables**. Add
   these variables (scope: all, or at least *Builds* and *Functions*):

   | Key | Value |
   | --- | --- |
   | `CONTENT_SHEET_URL` | the content link from step 3.5 (ending in `?key=…`) |
   | `NETLIFY_BUILD_HOOK` | the build hook URL from step 4.1 |
   | `ADMIN_USERNAME` | the owner's login name, e.g. `kunnect` |
   | `ADMIN_PASSWORD` | the owner's password: long and unique (12+ characters) |
   | `SESSION_SECRET` | a random string of 40+ letters and numbers (used to sign logins) |

   Mark `ADMIN_PASSWORD`, `SESSION_SECRET`, `CONTENT_SHEET_URL` and
   `NETLIFY_BUILD_HOOK` as **secret**.
4. **Deploys → Trigger deploy → Deploy site** so the new variables take effect.
5. Open **kunnectds.in/admin.html** and log in with `ADMIN_USERNAME` /
   `ADMIN_PASSWORD`. The dashboard should show your testimonials and services.
6. Reload the Google Sheet. A **Website** menu appears (allow permissions on first use).

Done. From now on: **log in at kunnectds.in/admin.html, edit, click Save & publish.**

### 5. Add more people (optional)

In the admin panel, open **Users → Add a user**. Each person gets their own
username and password; they can change it under **My account**. Their
passwords are stored only as secure hashes, in a hidden `_Admin Users` tab.
The owner account (from Netlify) can't be removed and always works, so you
can't lock yourself out.

---

## Using the admin panel

- **Dashboard:** counts of what's on the site, reminders about placeholder
  content, and a *Publish now* button (only needed after editing the sheet directly).
- **Content sections:** Testimonials, Team, Clients & collaborators, Services,
  Home page, About page, Pages & forms, Company & contact, Colours, SEO.
  - Lists: **Add**, edit, reorder (↑ ↓), **hide** (eye icon) or delete items.
  - Images: **Upload image** stores the picture in your Google Drive (folder
    *Kunnect website images*, shared as “anyone with the link”) and fills in the link.
  - Fields with problems are marked in red, and the sidebar shows how many need fixing.
- **Save & publish** saves everything to the Google Sheet and rebuilds the
  website. The bar at the top says when the change is live.
- If someone else changed the sheet while you were editing, the panel won't
  overwrite their work: it asks you to reload first.
- To undo a mistake, use **File → Version history** in the Google Sheet, then *Publish now*.

## Security

- Logins are checked on the server. Wrong passwords are slowed down
  (8 tries per minute), and sessions last 8 hours in a secure, HttpOnly cookie.
- Every value is checked again on the server before it reaches the sheet,
  and again during the build. Unsafe links (e.g. `javascript:`) and fake
  image files are rejected.
- The Google Sheet stays private. The website talks to it only through the
  Apps Script with the secret key, which is never sent to browsers.
- Editing is switched off on Netlify deploy previews, so tests can't change live content.

## Editing the sheet directly

- **Settings tabs** (Company, Home, Pages, SEO, Colours): change only the **Value** column.
  Don't edit the *Key* column.
- **List tabs** (Testimonials, Team, Clients, Services, Highlights, Stats,
  Values, How We Work, Milestones, Achievements, Contact Steps, Social Links):
  one row per item, shown in the same order on the website.
  - Add a row to add an item. Delete a row, or set **Show = No**, to remove it.
  - **Placeholder = Yes** marks temporary content. Company → *Hide placeholder
    content* = Yes removes all placeholders at launch.
- **New line inside a cell:** Ctrl + Enter (Windows) or ⌘ + Enter (Mac).
- **Lists** (benefits, budget options, 3D labels): one item per line.
  **Paragraphs:** leave an empty line between them.
- **Steps** (Services): one per line, `Title: description`.
- **Links** (Team): one per line, `Label | https://…`.
- **Images:** upload to Google Drive, share as **Anyone with the link**, and
  paste the share link, or paste any https image link. Images are copied onto
  the website during the build.
- **Colours:** hex codes like `#F2B33D`.
- Don't rename tabs or column headers; the website uses them to find content.

### Approving customer reviews

Reviews sent from the website's **Share your experience** page arrive in
Netlify → **Forms → feedback**. If the customer ticked “I agree … may be
published”, add a row to the **Testimonials** tab and publish.

### If something goes wrong

- **The website didn't change:** open Netlify → Deploys → latest deploy → log.
  - `Could not load content from Google Sheets` means the build stopped on
    purpose and the previous website is still online. Check `CONTENT_SHEET_URL`
    (including `?key=`), and that the web app is deployed with access **Anyone**.
  - Lines starting with `⚠` list rows to fix (for example a missing required
    field or an invalid colour). Those rows are skipped and the rest is published.
- **Admin panel says “not set up yet”:** check the five environment variables
  above, then trigger a new deploy.
- **Admin panel can't load or save content:** check `CONTENT_SHEET_URL`
  and that the Apps Script is deployed as a web app with access **Anyone**.
  After updating `Code.gs`, create a **new version** of the deployment (below).
- **Forgot a password:** the owner can reset anyone by removing and re-adding
  them under Users. The owner password is changed in Netlify (`ADMIN_PASSWORD`, then redeploy).
- **Changed the script code?** In Apps Script use **Deploy → Manage deployments
  → Edit → Version: New version → Deploy** so the content link keeps the same URL.
- **Need a fresh template?** In the project run `npm run sheet:template`.
  It rebuilds `Kunnect-Website-Content.xlsx` from the content currently in `src/content`.
