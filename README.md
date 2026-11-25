# Grocery Store Website

Mobile-first bilingual (Myanmar / English) grocery menu using Google Sheets, Google Apps Script and Cloudflare Pages.

## Project files

- `index.html` — page structure
- `style.css` — responsive styling
- `app.js` — search, filters, language switch and product rendering
- `Code.gs` — Google Apps Script JSON API
- `functions/api/products.js` — Cloudflare Pages Function proxy
- `.dev.vars.example` — local environment variable example

## Spreadsheet format expected

Spreadsheet ID is already set in `Code.gs` from the Google Sheets link supplied in the project conversation.

### Inventory sheet

- Sheet tab: `Inventory`
- Header row: **4**
- Product data starts: **5**
- Required unique field: `SKU_ID`

Supported columns:
`SKU_ID`, `Family_ID`, `Category_ID`, `Subcategory_ID`, `Item_Name_MM`, `Item_Name_EN`, `Brand_MM`, `Brand_EN`, `Variant_MM`, `Variant_EN`, `Pack_Type`, `Size_Value`, `Size_Unit`, `Price_MMK`, `Available`, `Image_URL`, `Sort_Order`, `Updated_At`, `Notes`.

The website currently does not require product images.

### Categories sheet

The script looks for a row within the first 10 rows that contains `Category_ID` or `Subcategory_ID`. It returns the category rows with their original column names. The website can use `Category_MM`, `Category_EN`, `Subcategory_MM`, and `Subcategory_EN` when present; otherwise it shows the category ID.

## 1. Set up Google Apps Script

1. Open the Google spreadsheet.
2. Select **Extensions → Apps Script**.
3. Replace the editor content with `Code.gs`.
4. Save the project.
5. Run no function manually; deploy it as a web app:
   - **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Deploy and copy the Web app URL ending in `/exec`.
7. Test the URL by adding `?action=products`.
8. The JSON should contain `success: true`, `total`, `data`, and `categories`.

If you change the Apps Script code after deployment, use **Deploy → Manage deployments → Edit → New version → Deploy**.

## 2. Run locally

From this project folder:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and replace the example URL with the real Apps Script `/exec` URL. Do not add `?action=products` to the environment variable.

Install Wrangler if needed and run:

```bash
npm install --save-dev wrangler
npx wrangler pages dev . --ip 0.0.0.0 --port 8788
```

Open `http://localhost:8788`. Test the API separately at `http://localhost:8788/api/products`.

To test on another device on the same Wi-Fi, find the computer's LAN IP with `hostname -I`, then open `http://LAN-IP:8788` on that device.

## 3. Deploy to Cloudflare Pages

1. Push this folder to your GitHub repository.
2. In Cloudflare Dashboard, create or connect a Pages project from the repository.
3. Framework preset: **None**.
4. Build command: leave blank.
5. Build output directory: `.`.
6. Add an environment variable named `APPS_SCRIPT_URL` with the Apps Script `/exec` URL. Add it to Production and Preview environments.
7. Deploy.
8. Test `https://YOUR-PROJECT.pages.dev/api/products`.

## Notes

- Do not commit `.dev.vars`; it is ignored by Git.
- If the spreadsheet uses different tab names or header row, update `CONFIG` in `Code.gs`.
- Product rows without `SKU_ID` are skipped.
- `Available` should be TRUE/FALSE or a value such as Yes/No.
- Brand display fallback is built in:
  - Myanmar: `Brand_MM`, then `Brand_EN`.
  - English: `Brand_EN`, then `Brand_MM`.
  - If both are blank, the brand line is hidden.
- This version is a product catalogue only; it does not include checkout, online payment or order submission.
