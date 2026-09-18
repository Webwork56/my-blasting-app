/**
 * IBTIKAR_BlastingDB
 * ------------------
 * Browser database implementation using IndexedDB.
 * Database name mirrors planned SQL Server: IBTIKAR_BlastingDB
 *
 * Tables (object stores):
 *   Security: systemUsers, employees
 *   Customer: customers, sites
 *   Jobs: jobs
 *   Survey: surveys
 *   Drilling: drillingDesigns, machines, crews, drillingExecutions, holeChecks
 *   Blasting: blastingDesigns, blastSchedules, blastExecutions, blastReports
 *   Procurement: suppliers, materials, lpos, supplierConfirmations
 *   Approvals: finalChecks, approvals
 *   Finance: jobCosts, invoices, payments
 *   System: documents, notifications, meta
 */

import type {
  User,
  Customer,
  Site,
  Job,
  Survey,
  DrillingDesign,
  Machine,
  Crew,
  DrillingExecution,
  HoleCheck,
  BlastingDesign,
  Supplier,
  Material,
  LPO,
  SupplierConfirmation,
  FinalCheck,
  Approval,
  BlastSchedule,
  BlastExecution,
  BlastReport,
  JobCost,
  Invoice,
  Payment,
  AppDocument,
  Notification,
  Employee,
} from '../data/types';
import * as seed from '../data/seed';
import { DEFAULT_ROLE_PERMISSIONS, ADMIN_ALL_PERMISSIONS } from '../data/types';

export const DB_NAME = 'u365882270_IB_BlastingDB';
export const DB_VERSION = 1;
const LS_SNAPSHOT_KEY = 'u365882270_IB_BlastingDB_snapshot_v1';

function saveLocalFallback(snap: AppDatabaseSnapshot) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LS_SNAPSHOT_KEY, JSON.stringify(snap));
    }
  } catch {
    // ignore quota errors
  }
}

function loadLocalFallback(): AppDatabaseSnapshot | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LS_SNAPSHOT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppDatabaseSnapshot;
        if (parsed && Array.isArray(parsed.systemUsers)) {
          return parsed;
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/** All object store names (= logical tables) */
export const STORES = [
  'systemUsers',
  'employees',
  'customers',
  'sites',
  'jobs',
  'surveys',
  'drillingDesigns',
  'machines',
  'crews',
  'drillingExecutions',
  'holeChecks',
  'blastingDesigns',
  'suppliers',
  'materials',
  'lpos',
  'supplierConfirmations',
  'finalChecks',
  'approvals',
  'blastSchedules',
  'blastExecutions',
  'blastReports',
  'jobCosts',
  'invoices',
  'payments',
  'documents',
  'notifications',
  'meta',
] as const;

export type StoreName = (typeof STORES)[number];

export interface AppDatabaseSnapshot {
  systemUsers: User[];
  employees: Employee[];
  customers: Customer[];
  sites: Site[];
  jobs: Job[];
  surveys: Survey[];
  drillingDesigns: DrillingDesign[];
  machines: Machine[];
  crews: Crew[];
  drillingExecutions: DrillingExecution[];
  holeChecks: HoleCheck[];
  blastingDesigns: BlastingDesign[];
  suppliers: Supplier[];
  materials: Material[];
  lpos: LPO[];
  supplierConfirmations: SupplierConfirmation[];
  finalChecks: FinalCheck[];
  approvals: Approval[];
  blastSchedules: BlastSchedule[];
  blastExecutions: BlastExecution[];
  blastReports: BlastReport[];
  jobCosts: JobCost[];
  invoices: Invoice[];
  payments: Payment[];
  documents: AppDocument[];
  notifications: Notification[];
}

export function emptySnapshot(): AppDatabaseSnapshot {
  return {
    systemUsers: seed.systemUsers.map((u) => ({
      ...u,
      permissions: u.permissions
        ? [...u.permissions]
        : u.role === 'Admin'
          ? [...ADMIN_ALL_PERMISSIONS]
          : [...(DEFAULT_ROLE_PERMISSIONS[u.role] || [])],
    })),
    employees: seed.employees.map((e) => ({ ...e })),
    customers: [],
    sites: [],
    jobs: [],
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
  };
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error('Failed to open IBTIKAR_BlastingDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          // meta uses key "id"; all entity tables use "id"
          db.createObjectStore(name, { keyPath: 'id' });
        }
      }
    };
  });

  return dbPromise;
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Transaction failed'));
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
  });
}

async function clearStore(db: IDBDatabase, storeName: StoreName): Promise<void> {
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).clear();
  await txDone(tx);
}

async function putAll<T extends { id: string }>(
  db: IDBDatabase,
  storeName: StoreName,
  rows: T[]
): Promise<void> {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  store.clear();
  for (const row of rows) {
    store.put(row);
  }
  await txDone(tx);
}

async function getAll<T>(db: IDBDatabase, storeName: StoreName): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve((req.result as T[]) || []);
    req.onerror = () => reject(req.error);
  });
}

async function getMeta(db: IDBDatabase, key: string): Promise<unknown | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readonly');
    const req = tx.objectStore('meta').get(key);
    req.onsuccess = () => {
      const row = req.result as { id: string; value: unknown } | undefined;
      resolve(row ? row.value : null);
    };
    req.onerror = () => reject(req.error);
  });
}

async function setMeta(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  const tx = db.transaction('meta', 'readwrite');
  tx.objectStore('meta').put({ id: key, value });
  await txDone(tx);
}

/** Initialize DB and seed clean data if first run (with localStorage fallback for file:// protocol) */
export async function initDatabase(): Promise<AppDatabaseSnapshot> {
  try {
    const db = await openDb();
    const initialized = await getMeta(db, 'initialized');

    if (!initialized) {
      const fallback = loadLocalFallback() || emptySnapshot();
      await saveSnapshot(fallback);
      await setMeta(db, 'initialized', true);
      await setMeta(db, 'createdAt', new Date().toISOString());
      await setMeta(db, 'dbName', DB_NAME);
      await setMeta(db, 'version', DB_VERSION);
      return fallback;
    }

    return await loadSnapshot();
  } catch {
    const fallback = loadLocalFallback() || emptySnapshot();
    saveLocalFallback(fallback);
    return fallback;
  }
}

/** Load full database snapshot */
export async function loadSnapshot(): Promise<AppDatabaseSnapshot> {
  const db = await openDb();
  const snap = emptySnapshot();

  const [
    systemUsers,
    employees,
    customers,
    sites,
    jobs,
    surveys,
    drillingDesigns,
    machines,
    crews,
    drillingExecutions,
    holeChecks,
    blastingDesigns,
    suppliers,
    materials,
    lpos,
    supplierConfirmations,
    finalChecks,
    approvals,
    blastSchedules,
    blastExecutions,
    blastReports,
    jobCosts,
    invoices,
    payments,
    documents,
    notifications,
  ] = await Promise.all([
    getAll<User>(db, 'systemUsers'),
    getAll<Employee>(db, 'employees'),
    getAll<Customer>(db, 'customers'),
    getAll<Site>(db, 'sites'),
    getAll<Job>(db, 'jobs'),
    getAll<Survey>(db, 'surveys'),
    getAll<DrillingDesign>(db, 'drillingDesigns'),
    getAll<Machine>(db, 'machines'),
    getAll<Crew>(db, 'crews'),
    getAll<DrillingExecution>(db, 'drillingExecutions'),
    getAll<HoleCheck>(db, 'holeChecks'),
    getAll<BlastingDesign>(db, 'blastingDesigns'),
    getAll<Supplier>(db, 'suppliers'),
    getAll<Material>(db, 'materials'),
    getAll<LPO>(db, 'lpos'),
    getAll<SupplierConfirmation>(db, 'supplierConfirmations'),
    getAll<FinalCheck>(db, 'finalChecks'),
    getAll<Approval>(db, 'approvals'),
    getAll<BlastSchedule>(db, 'blastSchedules'),
    getAll<BlastExecution>(db, 'blastExecutions'),
    getAll<BlastReport>(db, 'blastReports'),
    getAll<JobCost>(db, 'jobCosts'),
    getAll<Invoice>(db, 'invoices'),
    getAll<Payment>(db, 'payments'),
    getAll<AppDocument>(db, 'documents'),
    getAll<Notification>(db, 'notifications'),
  ]);

  // If users/employees missing (corrupt), restore bootstrap admin
  const bootstrap = emptySnapshot();
  snap.systemUsers =
    systemUsers.length > 0
      ? systemUsers.map((u) => {
          const email = u.email === 'admin@ibtikar.com' ? 'admin' : u.email;
          const name =
            u.name === 'System Administrator' || email === 'admin' || u.name === 'admin'
              ? 'admin'
              : u.name;
          return {
            ...u,
            email,
            name,
            password:
              u.password ||
              (email === 'admin' || name === 'admin' ? 'Krypton' : 'ChangeMe123'),
          };
        })
      : bootstrap.systemUsers;
  snap.employees =
    employees.length > 0
      ? employees.map((e) => {
          const email = e.email === 'admin@ibtikar.com' ? 'admin' : e.email;
          const name =
            e.name === 'System Administrator' || email === 'admin' || e.name === 'admin'
              ? 'admin'
              : e.name;
          return { ...e, email, name };
        })
      : bootstrap.employees;
  snap.customers = customers;
  snap.sites = sites;
  snap.jobs = jobs;
  snap.surveys = surveys;
  snap.drillingDesigns = drillingDesigns;
  snap.machines = machines;
  snap.crews = crews;
  snap.drillingExecutions = drillingExecutions;
  snap.holeChecks = holeChecks;
  snap.blastingDesigns = blastingDesigns;
  snap.suppliers = suppliers;
  snap.materials = materials;
  snap.lpos = lpos;
  snap.supplierConfirmations = supplierConfirmations;
  snap.finalChecks = finalChecks;
  snap.approvals = approvals;
  snap.blastSchedules = blastSchedules;
  snap.blastExecutions = blastExecutions;
  snap.blastReports = blastReports;
  snap.jobCosts = jobCosts;
  snap.invoices = invoices;
  snap.payments = payments;
  snap.documents = documents;
  snap.notifications = notifications;

  return snap;
}

/** Persist full snapshot to IndexedDB + localStorage mirror */
export async function saveSnapshot(snap: AppDatabaseSnapshot): Promise<void> {
  saveLocalFallback(snap);
  try {
    const db = await openDb();

  await Promise.all([
    putAll(db, 'systemUsers', snap.systemUsers),
    putAll(db, 'employees', snap.employees),
    putAll(db, 'customers', snap.customers),
    putAll(db, 'sites', snap.sites),
    putAll(db, 'jobs', snap.jobs),
    putAll(db, 'surveys', snap.surveys),
    putAll(db, 'drillingDesigns', snap.drillingDesigns),
    putAll(db, 'machines', snap.machines),
    putAll(db, 'crews', snap.crews),
    putAll(db, 'drillingExecutions', snap.drillingExecutions),
    putAll(db, 'holeChecks', snap.holeChecks),
    putAll(db, 'blastingDesigns', snap.blastingDesigns),
    putAll(db, 'suppliers', snap.suppliers),
    putAll(db, 'materials', snap.materials),
    putAll(db, 'lpos', snap.lpos),
    putAll(db, 'supplierConfirmations', snap.supplierConfirmations),
    putAll(db, 'finalChecks', snap.finalChecks),
    putAll(db, 'approvals', snap.approvals),
    putAll(db, 'blastSchedules', snap.blastSchedules),
    putAll(db, 'blastExecutions', snap.blastExecutions),
    putAll(db, 'blastReports', snap.blastReports),
    putAll(db, 'jobCosts', snap.jobCosts),
    putAll(db, 'invoices', snap.invoices),
    putAll(db, 'payments', snap.payments),
    putAll(db, 'documents', snap.documents),
    putAll(db, 'notifications', snap.notifications),
  ]);

    await setMeta(db, 'lastSavedAt', new Date().toISOString());
  } catch {
    // localStorage mirror already saved above
  }
}

/** Wipe DB and re-seed clean bootstrap admin */
export async function resetDatabase(): Promise<AppDatabaseSnapshot> {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LS_SNAPSHOT_KEY);
    }
  } catch {
    // ignore
  }
  const snap = emptySnapshot();
  saveLocalFallback(snap);
  try {
    const db = await openDb();
    for (const name of STORES) {
      await clearStore(db, name);
    }
    await saveSnapshot(snap);
    await setMeta(db, 'initialized', true);
    await setMeta(db, 'resetAt', new Date().toISOString());
  } catch {
    // ignore
  }
  return snap;
}

/** Export JSON backup */
export async function exportDatabaseJson(): Promise<string> {
  const snap = await initDatabase();
  const payload = {
    database: DB_NAME,
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    lastSavedAt: new Date().toISOString(),
    data: snap,
  };
  return JSON.stringify(payload, null, 2);
}

/** Import JSON backup */
export async function importDatabaseJson(json: string): Promise<AppDatabaseSnapshot> {
  const parsed = JSON.parse(json) as {
    data?: AppDatabaseSnapshot;
  } & Partial<AppDatabaseSnapshot>;

  const data = parsed.data || (parsed as unknown as AppDatabaseSnapshot);
  if (!data || !Array.isArray(data.systemUsers) || !Array.isArray(data.employees)) {
    throw new Error('Invalid database backup file');
  }

  // Merge with empty defaults for missing arrays
  const base = emptySnapshot();
  const snap: AppDatabaseSnapshot = {
    ...base,
    ...data,
    systemUsers: data.systemUsers.length ? data.systemUsers : base.systemUsers,
    employees: data.employees.length ? data.employees : base.employees,
  };

  await saveSnapshot(snap);
  return snap;
}

export async function getDatabaseInfo(): Promise<{
  name: string;
  version: number;
  initialized: boolean;
  lastSavedAt: string | null;
  counts: Record<string, number>;
}> {
  const snap = await initDatabase();
  const lastSavedAt = new Date().toISOString();
  const initialized = true;

  return {
    name: DB_NAME,
    version: DB_VERSION,
    initialized,
    lastSavedAt,
    counts: {
      systemUsers: snap.systemUsers.length,
      employees: snap.employees.length,
      customers: snap.customers.length,
      sites: snap.sites.length,
      jobs: snap.jobs.length,
      surveys: snap.surveys.length,
      lpos: snap.lpos.length,
      invoices: snap.invoices.length,
      documents: snap.documents.length,
      notifications: snap.notifications.length,
    },
  };
}
