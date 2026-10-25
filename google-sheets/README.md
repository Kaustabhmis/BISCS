# Editing the website with Google Sheets

All website content (testimonials, team, clients and collaborators, services,
page text, contact details, colours, SEO) is edited in **one Google Sheet**.
When you choose **Website → Publish changes** in the sheet, Netlify rebuilds
the website with the new content in about 2 minutes.

Nobody needs a GitHub account to edit content.

```
Google Sheet ──(Publish changes)──▶ Netlify build hook
                                        │
              Netlify build reads the sheet through a private link,
              downloads images, pre-renders every page ──▶ kunnectds.in
```

Files in this folder:

| File | What it is |
| --- | --- |
| `Kunnect-Website-Content.xlsx` | The sheet template, pre-filled with the current website content |
| `Code.gs` | The Apps Script that adds the *Website* menu and the private content link |

---

## One-time setup (about 15 minutes)

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

1. Netlify → your site → **Site configuration → Environment variables → Add a variable**:
   - Key: `CONTENT_SHEET_URL`
   - Value: the content link from step 3.5
2. Netlify → **Site configuration → Build & deploy → Build hooks → Add build hook**.
   Name it `Google Sheet` and copy the hook URL.
3. Back in Apps Script, paste the hook URL into `NETLIFY_BUILD_HOOK` and **Save**.
   (No need to redeploy for this setting.)
4. Reload the Google Sheet. A **Website** menu appears; choose
   **Website → Publish changes** and allow the permissions on first use.
5. In Netlify → **Deploys**, watch the new build. The log shows
   `✓ Content updated from Google Sheets`.

Done. From now on: **edit the sheet, then choose Website → Publish changes.**

---

## Everyday editing

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
- **Changed the script code?** In Apps Script use **Deploy → Manage deployments
  → Edit → Version: New version → Deploy** so the content link keeps the same URL.
- **Need a fresh template?** In the project run `npm run sheet:template`.
  It rebuilds `Kunnect-Website-Content.xlsx` from the content currently in `src/content`.
