/**
 * IBTIKAR BMS — Hostinger MySQL / MariaDB Backend API
 * Uses mysql2/promise connection pool + environment variables (.env)
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import {
  getPool,
  query,
  getConfigMeta,
  saveAndReconnect,
  testConnection,
  ensureMysqlSchema,
} from './db.js';
import {
  mapEmployee,
  mapUser,
  mapCustomer,
  mapSite,
  mapJob,
} from './mappers.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.API_PORT || 3001);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-DB-Server, X-DB-Name, X-DB-User, X-DB-Password, X-DB-Port, X-DB-Auth'
  );
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(cors());
app.use(express.json({ limit: '15mb' }));

function uid(prefix = 'id') {
  return `${prefix}-${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function progressFromStatus(status) {
  const map = {
    Draft: 0,
    'Order Received': 0,
    'Area Assigned': 1,
    Survey: 1,
    'Drilling Design': 2,
    'Resource Assigned': 3,
    Drilling: 3,
    'Hole Check': 4,
    'Blasting Design': 5,
    'Final Check': 6,
    Procurement: 7,
    'Supplier Confirmed': 7,
    'Admin Verification': 8,
    'PRO Submission': 8,
    'Police Approval': 8,
    'Blast Scheduled': 9,
    Blasting: 10,
    'Blast Completed': 10,
    Report: 11,
    Invoice: 12,
    Payment: 12,
    Closed: 13,
    Cancelled: -1,
  };
  const step = map[status];
  if (step === undefined || step < 0) return 0;
  return Math.round((step / 13) * 100);
}

function makeShortCode(name, maxLen = 4) {
  const cleaned = String(name || '')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .trim()
    .toUpperCase();
  if (!cleaned) return 'XX';
  const stop = new Set(['AL', 'EL', 'THE', 'AND', 'OF', 'CO', 'LLC', 'LTD', 'ENG', 'MR', 'MS']);
  const words = cleaned.split(/\s+/).filter((w) => w.length && !stop.has(w));
  if (words.length >= 2) {
    const initials = words.map((w) => w[0]).join('');
    if (initials.length >= 2) return initials.slice(0, maxLen);
  }
  const one = words[0] || cleaned.replace(/\s/g, '');
  return one.slice(0, maxLen).padEnd(Math.min(2, maxLen), 'X');
}

function normalizeShortCode(code, fallback = 'XX', maxLen = 6) {
  const c = String(code || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
  return (c || fallback).slice(0, maxLen);
}

async function generateJobNo(custCode, engCode) {
  const prefix = `${custCode}_${engCode}_`;
  const rows = await query('SELECT JobNo FROM tblJobs WHERE JobNo LIKE ?', [`${prefix}%`]);
  let max = -1;
  for (const row of rows) {
    const tail = String(row.JobNo).slice(prefix.length);
    const n = parseInt(tail, 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  const seq = String(max + 1).padStart(4, '0');
  return `${prefix}${seq}`;
}

/** Health check */
app.get('/api/health', async (_req, res) => {
  try {
    await getPool();
    await ensureMysqlSchema();
    const meta = getConfigMeta(true);
    res.json({
      ok: true,
      database: meta.database,
      server: meta.server,
      port: meta.port,
      engine: 'MySQL (MariaDB)',
      time: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[/api/health MySQL Error]:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/** Get MySQL configuration */
app.get('/api/db-config', async (_req, res) => {
  try {
    const meta = getConfigMeta(true);
    res.json({
      ...meta,
      connected: true,
    });
  } catch (e) {
    res.status(500).json({ error: e.message, connected: false });
  }
});

/** Test MySQL connection */
app.post('/api/db-config/test', async (req, res) => {
  try {
    const result = await testConnection(req.body || {});
    res.json(result);
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message, message: e.message });
  }
});

/** Save MySQL configuration and reconnect pool */
app.post('/api/db-config', async (req, res) => {
  try {
    const body = req.body || {};
    const meta = await saveAndReconnect(body);
    res.json({
      ok: true,
      message: `Connected to MySQL database ${meta.database} on ${meta.server}:${meta.port}`,
      config: meta,
    });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message, message: e.message });
  }
});

/** Full snapshot read from MySQL */
app.get('/api/snapshot', async (_req, res) => {
  try {
    await ensureMysqlSchema();
    const [employees, users, customers, sites, jobs, stateRows] = await Promise.all([
      query('SELECT * FROM tblEmployees'),
      query('SELECT * FROM tblUsers'),
      query('SELECT * FROM tblCustomers'),
      query('SELECT * FROM tblSites'),
      query('SELECT * FROM tblJobs'),
      query("SELECT JsonData FROM tblStateStore WHERE StoreKey = 'full_snapshot'"),
    ]);

    let extra = {};
    if (stateRows.length > 0 && stateRows[0].JsonData) {
      try {
        extra = JSON.parse(stateRows[0].JsonData) || {};
      } catch {
        extra = {};
      }
    }

    res.json({
      surveys: [],
      drillingDesigns: [],
      machines: [],
      crews: [],
      drillingExecutions: [],
      holeChecks: [],
      blastingDesigns: [],
      suppliers: [],
      materials: [],
      lpos: [],
      supplierConfirmations: [],
      finalChecks: [],
      approvals: [],
      blastSchedules: [],
      blastExecutions: [],
      blastReports: [],
      jobCosts: [],
      invoices: [],
      payments: [],
      documents: [],
      notifications: [],
      ...extra,
      systemUsers: users.map(mapUser),
      employees: employees.map(mapEmployee),
      customers: customers.map(mapCustomer),
      sites: sites.map(mapSite),
      jobs: jobs.map(mapJob),
    });
  } catch (e) {
    console.error('[/api/snapshot MySQL Error]:', e.message);
    res.status(500).json({ error: e.message });
  }
});

/** Login against MySQL tblUsers */
app.post('/api/login', async (req, res) => {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const rows = await query(
      `SELECT * FROM tblUsers WHERE (LOWER(Email) = ? OR LOWER(Name) = ?) AND Status = 'Active'`,
      [email, email]
    );
    if (!rows.length || (rows[0].PasswordHash || '') !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    res.json({ user: mapUser(rows[0]) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Create Customer in MySQL */
app.post('/api/customers', async (req, res) => {
  try {
    const b = req.body;
    const id = b.id || uid('c');
    const countRows = await query('SELECT COUNT(*) AS c FROM tblCustomers');
    const code = b.code || `CUS-${String((countRows[0]?.c || 0) + 1).padStart(3, '0')}`;
    const shortCode = normalizeShortCode(b.shortCode || makeShortCode(b.name), makeShortCode(b.name));
    const createdAt = b.createdAt || new Date().toISOString().slice(0, 10);

    await query(
      `REPLACE INTO tblCustomers (Id, Code, ShortCode, Name, ContactPerson, Phone, Email, Address, City, Status, CreatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        code,
        shortCode,
        b.name || '',
        b.contactPerson || '',
        b.phone || '',
        b.email || '',
        b.address || '',
        b.city || '',
        b.status || 'Active',
        createdAt,
      ]
    );

    res.json({
      id,
      code,
      shortCode,
      name: b.name,
      contactPerson: b.contactPerson || '',
      phone: b.phone || '',
      email: b.email || '',
      address: b.address || '',
      city: b.city || '',
      status: b.status || 'Active',
      createdAt,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Create Site in MySQL */
app.post('/api/sites', async (req, res) => {
  try {
    const b = req.body;
    const id = b.id || uid('s');
    await query(
      `REPLACE INTO tblSites (Id, CustomerId, Name, Location, GpsLat, GpsLng, AreaSize, Notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        b.customerId,
        b.name || '',
        b.location || '',
        Number(b.gpsLat) || 0,
        Number(b.gpsLng) || 0,
        b.areaSize || '',
        b.notes || '',
      ]
    );
    res.json({
      id,
      customerId: b.customerId,
      name: b.name,
      location: b.location || '',
      gpsLat: Number(b.gpsLat) || 0,
      gpsLng: Number(b.gpsLng) || 0,
      areaSize: b.areaSize || '',
      notes: b.notes || '',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Create Job in MySQL */
app.post('/api/jobs', async (req, res) => {
  try {
    const b = req.body;
    const id = b.id || uid('j');
    const custRows = await query('SELECT ShortCode, Name FROM tblCustomers WHERE Id = ?', [b.customerId]);
    const engRows = await query('SELECT ShortCode, Name FROM tblEmployees WHERE Id = ?', [b.engineerId]);
    const custCode = custRows.length
      ? normalizeShortCode(custRows[0].ShortCode, makeShortCode(custRows[0].Name))
      : 'CUST';
    const engCode = engRows.length
      ? normalizeShortCode(engRows[0].ShortCode, makeShortCode(engRows[0].Name))
      : 'ENG';
    const jobNo = b.jobNo || (await generateJobNo(custCode, engCode));
    const status = b.status || 'Order Received';
    const progress = progressFromStatus(status);
    const createdAt = b.createdAt || new Date().toISOString().slice(0, 10);

    await query(
      `REPLACE INTO tblJobs (Id, JobNo, CustomerId, SiteId, Title, Description, Priority, Status, EngineerId, RequestedDate, StartDate, EndDate, CreatedAt, Progress)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        jobNo,
        b.customerId,
        b.siteId,
        b.title || '',
        b.description || '',
        b.priority || 'Normal',
        status,
        b.engineerId,
        b.requestedDate,
        b.startDate || null,
        b.endDate || null,
        createdAt,
        progress,
      ]
    );

    res.json({
      id,
      jobNo,
      customerId: b.customerId,
      siteId: b.siteId,
      title: b.title,
      description: b.description || '',
      priority: b.priority || 'Normal',
      status,
      engineerId: b.engineerId,
      requestedDate: b.requestedDate,
      startDate: b.startDate || undefined,
      endDate: b.endDate || undefined,
      createdAt,
      progress,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Update Job in MySQL */
app.put('/api/jobs/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const b = req.body;
    const rows = await query('SELECT * FROM tblJobs WHERE Id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Job not found' });
    const cur = rows[0];
    const status = b.status !== undefined ? b.status : cur.Status;
    const progress =
      b.status !== undefined ? progressFromStatus(status) : (b.progress ?? cur.Progress);

    await query(
      `UPDATE tblJobs SET CustomerId = ?, SiteId = ?, Title = ?, Description = ?, Priority = ?, Status = ?, EngineerId = ?, RequestedDate = ?, StartDate = ?, EndDate = ?, Progress = ? WHERE Id = ?`,
      [
        b.customerId ?? cur.CustomerId,
        b.siteId ?? cur.SiteId,
        b.title ?? cur.Title,
        b.description ?? cur.Description,
        b.priority ?? cur.Priority,
        status,
        b.engineerId ?? cur.EngineerId,
        b.requestedDate ?? cur.RequestedDate,
        b.startDate ?? cur.StartDate,
        b.endDate ?? cur.EndDate,
        progress,
        id,
      ]
    );
    const updated = await query('SELECT * FROM tblJobs WHERE Id = ?', [id]);
    res.json(mapJob(updated[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Delete Job in MySQL */
app.delete('/api/jobs/:id', async (req, res) => {
  try {
    await query('DELETE FROM tblJobs WHERE Id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Full Snapshot Sync into MySQL (used by frontend auto-save) */
app.post('/api/sync-snapshot', async (req, res) => {
  try {
    await ensureMysqlSchema();
    const snap = req.body || {};
    let syncedEmployees = 0;
    let syncedUsers = 0;
    let syncedCustomers = 0;
    let syncedSites = 0;
    let syncedJobs = 0;

    if (Array.isArray(snap.employees)) {
      await query('DELETE FROM tblEmployees');
      for (const e of snap.employees) {
        await query(
          `REPLACE INTO tblEmployees (Id, Code, ShortCode, Name, Role, Department, Phone, Email, Status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            e.id,
            e.code || 'EMP-001',
            e.shortCode || 'EMP',
            e.name || '',
            e.role || 'Engineer',
            e.department || '',
            e.phone || '',
            e.email || e.id,
            e.status || 'Active',
          ]
        );
        syncedEmployees++;
      }
    }

    if (Array.isArray(snap.systemUsers)) {
      await query('DELETE FROM tblUsers');
      for (const u of snap.systemUsers) {
        await query(
          `REPLACE INTO tblUsers (Id, EmployeeId, Name, Email, Role, Department, PermissionsJson, PasswordHash, Status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
          [
            u.id,
            u.employeeId || 'e1',
            u.name || '',
            u.email || u.id,
            u.role || 'User',
            u.department || '',
            JSON.stringify(u.permissions || []),
            u.password || 'Krypton',
          ]
        );
        syncedUsers++;
      }
    }

    if (Array.isArray(snap.customers)) {
      await query('DELETE FROM tblCustomers');
      for (const c of snap.customers) {
        await query(
          `REPLACE INTO tblCustomers (Id, Code, ShortCode, Name, ContactPerson, Phone, Email, Address, City, Status, CreatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            c.id,
            c.code || 'CUS-001',
            c.shortCode || 'CU',
            c.name || '',
            c.contactPerson || '',
            c.phone || '',
            c.email || '',
            c.address || '',
            c.city || '',
            c.status || 'Active',
            c.createdAt || new Date().toISOString().slice(0, 10),
          ]
        );
        syncedCustomers++;
      }
    }

    if (Array.isArray(snap.sites)) {
      await query('DELETE FROM tblSites');
      for (const s of snap.sites) {
        await query(
          `REPLACE INTO tblSites (Id, CustomerId, Name, Location, GpsLat, GpsLng, AreaSize, Notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            s.id,
            s.customerId || '',
            s.name || '',
            s.location || '',
            Number(s.gpsLat) || 0,
            Number(s.gpsLng) || 0,
            s.areaSize || '',
            s.notes || '',
          ]
        );
        syncedSites++;
      }
    }

    if (Array.isArray(snap.jobs)) {
      await query('DELETE FROM tblJobs');
      for (const j of snap.jobs) {
        await query(
          `REPLACE INTO tblJobs (Id, JobNo, CustomerId, SiteId, Title, Description, Priority, Status, EngineerId, RequestedDate, StartDate, EndDate, CreatedAt, Progress)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            j.id,
            j.jobNo || '',
            j.customerId || '',
            j.siteId || '',
            j.title || '',
            j.description || '',
            j.priority || 'Normal',
            j.status || 'Order Received',
            j.engineerId || '',
            j.requestedDate || new Date().toISOString().slice(0, 10),
            j.startDate || null,
            j.endDate || null,
            j.createdAt || new Date().toISOString().slice(0, 10),
            Number(j.progress) || 0,
          ]
        );
        syncedJobs++;
      }
    }

    await query(
      `REPLACE INTO tblStateStore (StoreKey, JsonData, UpdatedAt) VALUES ('full_snapshot', ?, NOW())`,
      [JSON.stringify(snap)]
    );

    res.json({
      ok: true,
      message: `Synced to MySQL (${syncedCustomers} Customers, ${syncedSites} Sites, ${syncedEmployees} Employees, ${syncedJobs} Jobs)`,
      counts: { syncedEmployees, syncedUsers, syncedCustomers, syncedSites, syncedJobs },
    });
  } catch (e) {
    console.error('[/api/sync-snapshot MySQL Error]:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/** DB info */
app.get('/api/db-info', async (_req, res) => {
  try {
    await ensureMysqlSchema();
    const meta = getConfigMeta(true);
    const [u, e, c, s, j] = await Promise.all([
      query('SELECT COUNT(*) AS c FROM tblUsers'),
      query('SELECT COUNT(*) AS c FROM tblEmployees'),
      query('SELECT COUNT(*) AS c FROM tblCustomers'),
      query('SELECT COUNT(*) AS c FROM tblSites'),
      query('SELECT COUNT(*) AS c FROM tblJobs'),
    ]);
    res.json({
      name: meta.database,
      server: meta.server,
      port: meta.port,
      engine: 'MySQL (MariaDB)',
      version: 1,
      initialized: true,
      lastSavedAt: new Date().toISOString(),
      counts: {
        systemUsers: Number(u[0]?.c || 0),
        employees: Number(e[0]?.c || 0),
        customers: Number(c[0]?.c || 0),
        sites: Number(s[0]?.c || 0),
        jobs: Number(j[0]?.c || 0),
      },
      time: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

async function start() {
  try {
    await getPool();
    await ensureMysqlSchema();
    const meta = getConfigMeta(true);
    console.log(
      `[MySQL Connected] ${meta.user}@${meta.server}:${meta.port}/${meta.database}`
    );
    app.listen(PORT, () => {
      console.log(`IBTIKAR MySQL API listening on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('[MySQL Startup Failure]:', e.message);
    console.error('Verify DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, and DB_PORT in .env');
    process.exit(1);
  }
}

start();
