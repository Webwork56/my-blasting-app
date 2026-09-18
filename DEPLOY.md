# IBTIKAR BMS — Deployment Guide

Clean production seed is enabled: **no sample jobs, customers, or operational data**.  
Only one bootstrap Admin account exists so you can sign in and set up the system.

> **Office network (LAN) deploy:** see **NETWORK-DEPLOY.md**  
> Windows users can double-click **`start-network.bat`**

---

## 1. Default Admin Login (after clean install)

| Field    | Value               |
|----------|---------------------|
| Email    | `admin@ibtikar.com` |
| Password | any value for now   |

> This front-end build does **not** enforce real passwords yet. For true production security you need a backend (see section 7).

---

## 2. First-time setup after login (Admin)

1. Sign in as **admin@ibtikar.com**
2. **Employees** → Add engineers / staff  
   - Set **Job ID Short Code** (e.g. `HASH` for Eng. Hashmai)
3. **User Permissions** → Grant Create / Edit / Delete as needed
4. **Customers & Sites** → Register customers  
   - Set **Job ID Short Code** (e.g. `WE` for ALWESAM)
5. **Jobs** → Create jobs  
   - Job ID auto format: `{CUSTOMER}_{ENGINEER}_{0000}`  
   - Example: `WE_HASH_0000`

---

## 3. Build the application

### Requirements
- Node.js **18+** (recommend 20 LTS)
- npm 9+

### Commands

```bash
# 1) Install dependencies
npm install

# 2) Production build (outputs single-file dist/index.html)
npm run build

# 3) Optional: test the build locally
npm run preview
```

Build output:

```
dist/
  index.html   ← self-contained app (JS + CSS inlined)
```

The project uses `vite-plugin-singlefile`, so **one HTML file** is enough to host.

---

## 4. Deploy options

### A) Static hosting (simplest)

Upload `dist/index.html` (or the whole `dist/` folder) to:

- **Netlify** — drag & drop `dist`, or connect Git  
- **Vercel** — import repo, build command `npm run build`, output `dist`  
- **Cloudflare Pages** — same as above  
- **GitHub Pages** — publish `dist`  
- **IIS / Apache / Nginx** — copy `dist` to web root  

#### Nginx example

```nginx
server {
  listen 80;
  server_name bms.yourcompany.com;
  root /var/www/ibtikar-bms;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # Optional HTTPS — use certbot
}
```

#### IIS
1. Create a site pointing to the folder that contains `index.html`
2. Add URL Rewrite rule: all routes → `index.html` (SPA fallback)
3. Ensure MIME type for `.html` is correct

#### Apache (`.htaccess`)

```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### B) Local network / USB

Because the build is a **single HTML file**, you can:

1. Run `npm run build`
2. Copy `dist/index.html` to a shared folder or USB
3. Open it in Chrome/Edge (or host with any simple static server)

```bash
npx serve dist
```

### C) Company server with Node preview

```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

---

## 5. Clean database status (this build)

| Module              | Seed data      |
|---------------------|----------------|
| Admin user          | 1 bootstrap    |
| Employees           | Admin only     |
| Customers / Sites   | Empty          |
| Jobs                | Empty          |
| Surveys / Drilling  | Empty          |
| Blasting / Reports  | Empty          |
| Procurement / LPO   | Empty          |
| Finance / Invoices  | Empty          |
| Documents           | Empty          |
| Notifications       | Empty          |

---

## 6. Database (implemented)

### Current database: IndexedDB

| Item | Value |
|------|--------|
| Name | `IBTIKAR_BlastingDB` |
| Engine | Browser **IndexedDB** |
| Location | User’s browser storage (this PC + this browser) |
| Code | `src/db/database.ts` |
| Admin UI | Sidebar → **Admin → Database** |

**What works now**
- Data is saved automatically
- Survives refresh / close / reopen on the same browser
- Export / Import JSON backup
- Reset to clean Admin-only database
- Table/object stores match planned SQL domains

**Still not multi-PC shared**
- Chrome data ≠ Edge/Firefox data
- PC A data ≠ PC B data

### Future: Microsoft SQL Server

For company-wide multi-user sharing:

1. Keep this React UI  
2. Add API backend (.NET / Node)  
3. Create SQL Server DB `IBTIKAR_BlastingDB` with same tables  
4. Point UI API calls to server instead of IndexedDB only  
5. Real passwords + JWT  

Until then, use **Export Backup** regularly.

---

## 7. Production checklist

- [ ] Build with `npm run build`
- [ ] Host `dist` on HTTPS
- [ ] Login as `admin@ibtikar.com`
- [ ] Create real Admin profile (name/phone)
- [ ] Add employees + short codes
- [ ] Set User Permissions per person
- [ ] Add customers + short codes (e.g. WE)
- [ ] Create first job → verify ID like `WE_HASH_0000`
- [ ] Train users on Print Reports
- [ ] Plan SQL Server backend for shared data

---

## 8. Job ID reminder

```
{CUSTOMER_SHORT}_{ENGINEER_SHORT}_{SEQUENCE}

ALWESAM (WE) + Eng. Hashmai (HASH) → WE_HASH_0000
Next job same pair                 → WE_HASH_0001
```

Short codes are set when creating **Customer** and **Employee**.

---

## 9. Support

Application credit is stored in code (`src/constants/appInfo.ts`) and shown via the Dashboard **ⓘ** info icon.
