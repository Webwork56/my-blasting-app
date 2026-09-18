# IBTIKAR BMS — Microsoft SQL Server Setup

This guide connects the app to a real **SQL Server** database: `IBTIKAR_BlastingDB`.

---

## Architecture

```text
Browser (React UI)
        │
        │  HTTP API  (http://localhost:3001)
        ▼
Node.js API  (server/index.js)
        │
        │  mssql driver
        ▼
Microsoft SQL Server
Database: IBTIKAR_BlastingDB
```

- **Shared data** for all users on the network  
- Job IDs still: `WE_HASH_0000`  
- Progress % still auto from workflow status  

---

## Step 1 — Install SQL Server

Install one of:

- SQL Server 2019/2022 (Express is free)
- Or LocalDB / Developer edition

Also install **SQL Server Management Studio (SSMS)**.

Enable:

- TCP/IP protocol (SQL Server Configuration Manager)
- SQL Server Authentication (mixed mode) if using `sa`
- Firewall port **1433** if remote PCs connect to SQL

---

## Step 2 — Create the database

1. Open **SSMS**
2. Connect to your SQL instance
3. File → Open →  
   `database/IBTIKAR_BlastingDB.sql`
4. Execute (F5)

You should see:

```text
IBTIKAR_BlastingDB created successfully.
Login: admin@ibtikar.com
```

### Verify

```sql
USE IBTIKAR_BlastingDB;
SELECT name FROM sys.tables ORDER BY name;
SELECT Email, Role FROM dbo.tblUsers;
```

---

## Step 3 — Configure API connection

1. Copy env file:

```bash
copy .env.example .env
```

2. Edit `.env`:

```env
SQL_SERVER=localhost
SQL_DATABASE=IBTIKAR_BlastingDB
SQL_USER=sa
SQL_PASSWORD=YourStrongPassword123
SQL_PORT=1433
SQL_ENCRYPT=false
SQL_TRUST_CERT=true
API_PORT=3001
VITE_API_URL=http://localhost:3001
```

### Notes

| Setting | Example | Meaning |
|---------|---------|---------|
| SQL_SERVER | `localhost` or `192.168.1.10` | SQL host |
| SQL_USER / PASSWORD | sa + password | SQL login |
| VITE_API_URL | `http://SERVER-IP:3001` | Frontend talks to API |

For named instance:

```env
SQL_SERVER=localhost\\SQLEXPRESS
```

---

## Step 4 — Install & start API server

```bash
npm install
node server/index.js
```

Success looks like:

```text
Connected to SQL Server: localhost / IBTIKAR_BlastingDB
IBTIKAR API listening on http://localhost:3001
```

Test in browser:

```text
http://localhost:3001/api/health
```

Should return `"ok": true`.

---

## Step 5 — Start the web app with SQL mode

```bash
npm run dev
```

Or production build **after** setting `VITE_API_URL` in `.env`:

```bash
npm run build
npx serve dist -l 5000
```

> `VITE_API_URL` is baked in at **build time**.  
> If you change it, rebuild the frontend.

---

## Step 6 — Login

- Email: **`admin@ibtikar.com`**
- Password: any (API does not enforce password hash yet)

Open **Admin → Database**  
You should see:

- Engine: **Microsoft SQL Server**
- Database: **IBTIKAR_BlastingDB**

---

## Step 7 — Office network (multi-user)

### On SQL Server PC
1. SQL Server running  
2. Database created  
3. Firewall allow **1433** (SQL) and **3001** (API)

### On API PC (can be same PC)
```bash
node server/index.js
```
Listen on all interfaces if needed (already default).

### Frontend `.env` for other PCs
```env
VITE_API_URL=http://192.168.1.20:3001
```
Then rebuild:

```bash
npm run build
```

Host `dist` with:

```bash
npx serve dist -l 5000
```

Users open:

```text
http://192.168.1.20:5000
```

All users share **same SQL data**.

---

## Tables created

| Domain | Tables |
|--------|--------|
| Security | tblUsers, tblEmployees |
| Customer | tblCustomers, tblSites |
| Jobs | tblJobs |
| Survey | tblSurveys |
| Drilling | tblDrillingDesign, tblDrillingMachines, tblDrillingCrews, tblCrewMembers, tblDrillingExecution, tblHoleChecks |
| Blasting | tblBlastingDesign, tblBlastSchedules, tblBlastingExecution, tblBlastingReports |
| Procurement | tblSuppliers, tblMaterials, tblLPO, tblLPODetails, tblSupplierConfirmations |
| Approvals | tblFinalChecks, tblApprovals |
| Finance | tblJobCosts, tblInvoices, tblPayments |
| System | tblDocuments, tblNotifications, tblMeta |

---

## Fallback mode

If `VITE_API_URL` is empty **or** API is down:

- App uses browser **IndexedDB** (`IBTIKAR_BlastingDB` local)
- Good for offline demo
- Not shared between PCs

When API is up:

- App uses **SQL Server**
- Shared multi-user database

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Login failed / cannot connect | Check SQL service running; user/password; TCP 1433 |
| `Login failed for user sa` | Enable SQL auth; reset sa password |
| API starts then crashes | Wrong DB name; run SQL script first |
| Frontend still IndexedDB | Set `VITE_API_URL` and **rebuild** frontend |
| CORS errors | API already has `cors()`; check URL/port |
| Firewall blocks | Allow 1433 + 3001 inbound |

### Test SQL connection in SSMS first
If SSMS connects, API can connect with same server/user/password.

---

## Daily run (SQL mode)

```bash
# Terminal 1 — API
node server/index.js

# Terminal 2 — Web
npx serve dist -l 5000
```

Or during development:

```bash
# Terminal 1
node server/index.js

# Terminal 2
npm run dev
```

---

## Security note

Current API accepts login by email without strong password check.  
For production hardening later:

- Hash passwords in `tblUsers.PasswordHash`
- JWT tokens
- HTTPS reverse proxy

---

## Quick checklist

- [ ] Install SQL Server + SSMS  
- [ ] Run `database/IBTIKAR_BlastingDB.sql`  
- [ ] Create `.env` from `.env.example`  
- [ ] `node server/index.js` → health OK  
- [ ] Set `VITE_API_URL=http://localhost:3001`  
- [ ] `npm run build`  
- [ ] Open app → login admin  
- [ ] Database page shows SQL Server  
