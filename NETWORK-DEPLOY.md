# IBTIKAR BMS — Deploy on Office Network (LAN)

This guide puts the app on your **local office network** so other PCs can open it in a browser.

---

## What you will get

- One PC acts as the **server**
- Other office PCs open: `http://SERVER-IP:5000`
- Login: `admin@ibtikar.com`

---

## STEP 1 — Choose the Server PC

Pick one office computer that will stay on:

- Prefer a desktop that is always powered on
- Must be connected to the same Wi‑Fi / LAN as other users
- Install **Node.js 18+** from https://nodejs.org  
  (choose LTS → install → restart PC)

Check:

```bat
node -v
npm -v
```

---

## STEP 2 — Put the project on the Server PC

Copy your full project folder to that PC, for example:

```text
C:\IBTIKAR-BMS\
```

Folder must contain:

- `package.json`
- `src\`
- `start-network.bat`
- etc.

---

## STEP 3 — Start the network server (Windows)

1. Open the project folder
2. Double-click **`start-network.bat`**
3. Wait for:
   - install
   - build
   - server start
4. Leave the black window **OPEN**

In that window you will see IP lines like:

```text
IPv4 Address . . . . . . . . . . : 192.168.1.20
```

That number is your server address.

### Manual commands (if bat file not used)

```bat
cd C:\IBTIKAR-BMS
npm install
npm run build
npx --yes serve dist -l 5000
```

---

## STEP 4 — Open from the Server PC

Browser:

```text
http://localhost:5000
```

Login:

| Field | Value |
|--------|--------|
| Email | `admin@ibtikar.com` |
| Password | any |

If this works, go to next step.

---

## STEP 5 — Open from other PCs on the network

On another office PC browser:

```text
http://192.168.1.20:5000
```

(Replace `192.168.1.20` with the IP shown on the server.)

### If it does not open

#### A) Windows Firewall

On the **server PC**:

1. Windows Search → **Windows Defender Firewall**
2. **Advanced settings**
3. **Inbound Rules** → **New Rule**
4. Port → TCP → **5000**
5. Allow the connection
6. Apply to Domain/Private (office network)
7. Name: `IBTIKAR BMS Port 5000`

Or quick PowerShell (Admin):

```powershell
New-NetFirewallRule -DisplayName "IBTIKAR BMS" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
```

#### B) Same network

All PCs must be on same office LAN/Wi‑Fi (not guest Wi‑Fi isolation).

#### C) Find IP again

On server PC:

```bat
ipconfig
```

Use the **IPv4** of Ethernet or Wi‑Fi adapter.

---

## STEP 6 — First-time company setup (Admin)

After login on any PC:

1. **Employees** → add staff + short codes (`HASH`, etc.)
2. **User Permissions** → grant Create/Edit/Delete as needed
3. **Customers** → add customers + short codes (`WE` for ALWESAM)
4. **Jobs** → create jobs → IDs like `WE_HASH_0000`
5. **Database** → **Export Backup** (save weekly)

---

## STEP 7 — Daily use

### Morning (server PC)
1. Turn on server PC  
2. Run `start-network.bat`  
3. Keep window open  

### Users
Open:

```text
http://SERVER-IP:5000
```

### Evening
Press `Ctrl+C` in server window to stop (optional).

---

## Important: Database on network

| Topic | Reality |
|--------|---------|
| App files | Shared by the server (one website) |
| Database | **Each browser has its own IndexedDB** |

Meaning:

- PC1 Chrome data ≠ PC2 Chrome data  
- Same URL, but local DB per browser  

### Practical office approach now

**Option 1 — Single workstation (simplest)**  
Only one main PC enters live data. Others mostly view/print if acceptable.

**Option 2 — One shared browser profile PC**  
Users work on the same office computer/browser for live data.

**Option 3 — Admin backup transfer**
1. On main PC: **Database → Export Backup**
2. Copy JSON to USB/shared folder
3. On another PC: **Database → Import Backup**

For true multi-user shared DB (everyone sees same jobs live), you later need SQL Server + API.

---

## Linux / Mac server

```bash
cd /path/to/IBTIKAR-BMS
chmod +x start-network.sh
./start-network.sh
```

Or:

```bash
npm install
npm run build
npx --yes serve dist -l 5000
```

Find IP:

```bash
hostname -I
```

Open from other PCs: `http://IP:5000`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `node` not recognized | Install Node.js LTS and reopen terminal |
| Other PC cannot connect | Open firewall port 5000; check same LAN |
| Page blank | Rebuild: `npm run build` then restart server |
| Data missing after refresh | Wrong browser/PC; use Export/Import backup |
| Port in use | Change port: `npx --yes serve dist -l 5080` |

---

## Quick checklist

- [ ] Node.js installed on server PC  
- [ ] Run `start-network.bat`  
- [ ] Note IPv4 address  
- [ ] Open firewall TCP 5000  
- [ ] Test `http://localhost:5000` on server  
- [ ] Test `http://SERVER-IP:5000` from another PC  
- [ ] Login admin and create employees/customers/jobs  
- [ ] Export database backup  

---

## Commands cheat sheet

```bat
npm install
npm run build
npx --yes serve dist -l 5000
ipconfig
```

**Login:** `admin@ibtikar.com`  
**App URL:** `http://YOUR-SERVER-IP:5000`
