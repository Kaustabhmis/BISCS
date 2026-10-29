# Kunnect website — Google Sheet + admin panel

The website's content lives in **one Google Sheet** (the database).

- **Admin panel:** `kunnectds.in/admin.html`. Log in, edit, click **Save**.
  Changes are written into the Google Sheet.
- **Website:** reads the Google Sheet on every visit, so saved changes show
  up for visitors within about a minute (they may need to refresh).
- **`Code.gs`:** the small program inside the Google Sheet that makes this work
  (logins, saving, image uploads, and serving the content to the website).

Nothing to build, no GitHub, no server. You upload the website once.

---

## Setup (about 15 minutes)

### 1. Create the Google Sheet

1. Go to **drive.google.com → New → File upload** and upload `Kunnect-Website-Content.xlsx`
   (it is pre-filled with the current website content).
2. Open it with Google Sheets, then **File → Save as Google Sheets**. Use
   that Google Sheets version from now on.
3. Keep the sheet **private**. Only share it with people who should see it.

### 2. Add Code.gs

1. In the sheet: **Extensions → Apps Script**.
2. Delete everything in the editor, then paste the whole contents of `Code.gs`.
3. At the top, set your admin login:
   ```js
   const ADMIN_USERNAME = 'admin';
   const ADMIN_PASSWORD = 'CHANGE-THIS-PASSWORD';   // ← a long password, 12+ characters
   ```
4. Click **Save** (💾).

### 3. Deploy it and copy the /exec URL

1. **Deploy → New deployment** → click ⚙ next to “Select type” → **Web app**.
2. Execute as: **Me**. Who has access: **Anyone**.
3. **Deploy** → **Authorize access** → choose your Google account. If Google
   warns the app is unverified, click **Advanced → Go to … (unsafe)**: it's
   your own script.
4. Copy the **Web app URL**. It looks like
   `https://script.google.com/macros/s/AKfy…/exec`.

   Check it: open the URL in your browser. You should see text starting with `{"version":2`.

### 4. Put the URL in the website and upload to Netlify

Choose **one** way:

**A. Edit the file before uploading (simplest)**
1. Unzip `kunnect-netlify-site.zip`.
2. Open `site-config.js` in a text editor and paste your URL between the quotes:
   ```js
   window.KUNNECT_SHEET_URL = window.KUNNECT_SHEET_URL || 'https://script.google.com/macros/s/AKfy…/exec'
   ```
3. Go to **app.netlify.com → Add new site → Deploy manually** and drag the
   unzipped folder in.

**B. Paste it in Netlify (no file editing)**
1. Upload the unzipped folder as in A.3.
2. Netlify → your site → **Site configuration → Build & deploy → Post processing →
   Snippet injection → Add snippet**. Inject **before `</head>`**:
   ```html
   <script>window.KUNNECT_SHEET_URL = "https://script.google.com/macros/s/AKfy…/exec"</script>
   ```
3. Save. It applies immediately; no re-upload needed.

### 5. Log in

Open **kunnectds.in/admin.html** and log in with the username and password
from step 2.3. Done.

Also in Netlify (once): **Site configuration → Forms → Enable form detection**,
then re-upload the folder so the contact and feedback forms are registered,
and add email notifications under *Forms → Form notifications*.

---

## Using the admin panel

- **Sections:** Testimonials, Team, Clients & collaborators, Services, Home
  page, About page, Pages & forms, Company & contact, Colours, SEO.
- **Lists:** **Add**, edit, reorder (↑ ↓), **hide** (eye icon) or delete items.
- **Images:** **Upload image** stores the picture in your Google Drive (folder
  *Kunnect website images*, shared as “anyone with the link”) and fills in the link.
- Fields with problems are marked in red, and nothing is saved until they're fixed.
- **Save** writes everything into the Google Sheet, and the website updates by itself.
- **Users:** add people with their own username and password. They can
  change it under **My account**. Passwords are stored only as secure hashes,
  in a hidden `_Admin Users` tab.
- **Undo a mistake:** in the Google Sheet use **File → Version history**.
- You can still edit the sheet directly; the website picks that up the same way.

## Good to know

- **Changing the main password:** edit `ADMIN_PASSWORD` in Apps Script, then
  **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**.
  The URL stays the same. Do the same after any change to `Code.gs`.
- **Security:** five wrong passwords lock that username for 15 minutes.
  Logins last 8 hours. The sheet stays private; visitors only see the
  website content, never the users tab.
- **Search engines:** the uploaded pages contain the content as it was when
  the zip was made, and the live sheet content replaces it in the browser.
  Google sees the live content. If you change a lot of text, ask for a fresh
  zip now and then, so the pre-built pages (used by social previews) match.
- **Limits:** Google Apps Script has daily usage quotas. The website caches the
  content for a minute in each visitor's browser and five minutes in the
  script, which comfortably covers a normal business website.

## If something goes wrong

- **Admin says “not connected to the Google Sheet yet”:** the URL is missing or
  wrong in `site-config.js` / snippet injection. It must start with
  `https://script.google.com/` and end with `/exec`.
- **“The Google Sheet did not answer correctly”:** re-check the deployment
  (access **Anyone**), and that you deployed a **new version** after editing `Code.gs`.
- **“The admin password has not been set yet”:** set `ADMIN_PASSWORD` (10+ characters) and deploy a new version.
- **Changes don't show on the website:** wait a minute and refresh. Check the
  item isn't hidden and that its required fields are filled.
