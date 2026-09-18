import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type {
  Job, Customer, Site, Survey, DrillingDesign, Machine, Crew,
  DrillingExecution, HoleCheck, BlastingDesign, Supplier, Material, LPO,
  SupplierConfirmation, FinalCheck, Approval, BlastSchedule, BlastExecution,
  BlastReport, JobCost, Invoice, Payment, AppDocument, Notification, Employee,
  JobStatus, User, PermissionKey, UserRole,
} from '../data/types';
import {
  ADMIN_ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
} from '../data/types';
import * as seed from '../data/seed';
import { generateJobNo, makeShortCode, normalizeShortCode } from '../utils/jobNumber';
import { progressFromStatus } from '../utils/workflowProgress';
import {
  initDatabase,
  saveSnapshot,
  resetDatabase,
  exportDatabaseJson,
  importDatabaseJson,
  getDatabaseInfo,
  type AppDatabaseSnapshot,
  DB_NAME,
} from '../db/database';
import { sqlApi, isSqlModeConfigured, apiHealth } from '../api/sqlClient';

export type Page =
  | 'dashboard'
  | 'customers'
  | 'jobs'
  | 'job-detail'
  | 'survey'
  | 'drilling'
  | 'blasting'
  | 'procurement'
  | 'approvals'
  | 'final-check'
  | 'scheduling'
  | 'reports'
  | 'print-reports'
  | 'finance'
  | 'documents'
  | 'resources'
  | 'employees'
  | 'user-accounts'
  | 'user-permissions'
  | 'notifications'
  | 'database';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  page: Page;
  selectedJobId: string | null;
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
  employees: Employee[];
  /** Login accounts whose permissions Admin can change */
  systemUsers: User[];
  sidebarOpen: boolean;
  dbReady: boolean;
  dbName: string;
  dbLastSavedAt: string | null;
  /** true when connected to Microsoft SQL Server API */
  dbEngine: 'sqlserver' | 'indexeddb';
}

interface AppContextValue extends AppState {
  login: (email: string, password: string) => boolean;
  logout: () => void;
  navigate: (page: Page, jobId?: string) => void;
  setSidebarOpen: (open: boolean) => void;
  updateJobStatus: (jobId: string, status: JobStatus, progress?: number) => boolean;
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt'>) => void;
  addSite: (s: Omit<Site, 'id'>) => boolean;
  addJob: (j: Omit<Job, 'id' | 'jobNo' | 'createdAt' | 'progress'>) => boolean;
  updateJob: (jobId: string, patch: Partial<Omit<Job, 'id' | 'jobNo' | 'createdAt'>>) => boolean;
  deleteJob: (jobId: string) => boolean;
  addEmployee: (e: Omit<Employee, 'id' | 'code'>) => boolean;
  updateEmployee: (id: string, patch: Partial<Omit<Employee, 'id'>>) => boolean;
  deleteEmployee: (id: string) => boolean;
  /** Admin creates login user accounts */
  addUserAccount: (input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    department?: string;
    shortCode?: string;
    phone?: string;
  }) => boolean;
  updateUserAccount: (
    userId: string,
    patch: Partial<Pick<User, 'name' | 'email' | 'password' | 'role' | 'department' | 'permissions'>> & {
      status?: 'Active' | 'Inactive';
    }
  ) => boolean;
  deleteUserAccount: (userId: string) => boolean;
  /** Admin sets exact permissions for a login user */
  setUserPermissions: (userId: string, permissions: PermissionKey[]) => boolean;
  /** Reset user to default role permissions */
  resetUserPermissions: (userId: string) => boolean;
  addLpo: (l: Omit<LPO, 'id' | 'lpoNo'>) => void;
  addSupplier: (s: Omit<Supplier, 'id' | 'code'>) => boolean;
  addMaterial: (m: Omit<Material, 'id' | 'code'>) => boolean;
  addSurvey: (s: Omit<Survey, 'id'>) => boolean;
  addDrillingDesign: (d: Omit<DrillingDesign, 'id'>) => boolean;
  addDrillingExecution: (d: Omit<DrillingExecution, 'id'>) => boolean;
  addHoleCheck: (h: Omit<HoleCheck, 'id'>) => boolean;
  addBlastingDesign: (d: Omit<BlastingDesign, 'id'>) => boolean;
  addMachine: (m: Omit<Machine, 'id'>) => boolean;
  addCrew: (c: Omit<Crew, 'id'>) => boolean;
  addBlastSchedule: (s: Omit<BlastSchedule, 'id'>) => boolean;
  addBlastExecution: (b: Omit<BlastExecution, 'id'>) => boolean;
  addBlastReport: (r: Omit<BlastReport, 'id'>) => boolean;
  addFinalCheck: (f: Omit<FinalCheck, 'id'>) => boolean;
  addApproval: (a: Omit<Approval, 'id'>) => boolean;
  addJobCost: (c: Omit<JobCost, 'id'>) => boolean;
  addInvoice: (i: Omit<Invoice, 'id' | 'invoiceNo'>) => boolean;
  addPayment: (p: Omit<Payment, 'id'>) => boolean;
  addDocument: (d: Omit<AppDocument, 'id'>) => boolean;
  updateFinalCheck: (id: string, patch: Partial<FinalCheck>) => void;
  updateApproval: (id: string, patch: Partial<Approval>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  getCustomer: (id: string) => Customer | undefined;
  getSite: (id: string) => Site | undefined;
  getEmployee: (id: string) => Employee | undefined;
  getJob: (id: string) => Job | undefined;
  unreadCount: number;
  visibleJobs: Job[];
  visibleJobIds: Set<string>;
  canViewAllJobs: boolean;
  isEngineer: boolean;
  isAdmin: boolean;
  /** Resolved permissions for current user */
  permissions: PermissionKey[];
  /** Check if current user has a right */
  hasPermission: (key: PermissionKey) => boolean;
  canCreateJob: boolean;
  canEditJob: boolean;
  canDeleteJob: boolean;
  canManageJobs: boolean;
  canManageEmployees: boolean;
  canManageCustomers: boolean;
  canAccessJob: (jobId: string) => boolean;
  /** Database operations */
  resetDb: () => Promise<void>;
  exportDb: () => Promise<string>;
  importDb: (json: string) => Promise<void>;
  getDbInfo: () => Promise<{
    name: string;
    version: number;
    initialized: boolean;
    lastSavedAt: string | null;
    counts: Record<string, number>;
  }>;
  reloadFromDb: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function resolvePermissions(u: User | null | undefined): PermissionKey[] {
  if (!u) return [];
  if (u.role === 'Admin') return [...ADMIN_ALL_PERMISSIONS];
  if (u.permissions) return [...u.permissions];
  return [...(DEFAULT_ROLE_PERMISSIONS[u.role] || [])];
}

/** Roles that see every job; Engineer is scoped to assigned jobs only */
const FULL_ACCESS_ROLES = new Set(['Admin', 'Supervisor', 'Finance', 'PRO', 'Viewer', 'Operator']);

export function AppProvider({ children }: { children: ReactNode }) {
  const [dbReady, setDbReady] = useState(true);
  const [dbLastSavedAt, setDbLastSavedAt] = useState<string | null>(null);
  const [dbEngine, setDbEngine] = useState<'sqlserver' | 'indexeddb'>('indexeddb');
  const persistReady = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sqlMode = useRef(false);

  const [user, setUser] = useState<User | null>(null);
  const [systemUsers, setSystemUsers] = useState<User[]>(() =>
    seed.systemUsers.map((u) => ({
      ...u,
      permissions: u.permissions ? [...u.permissions] : [...(DEFAULT_ROLE_PERMISSIONS[u.role] || [])],
    }))
  );
  const [page, setPage] = useState<Page>('dashboard');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>(seed.customers);
  const [sites, setSites] = useState<Site[]>(seed.sites);
  const [jobs, setJobs] = useState<Job[]>(seed.jobs);
  const [surveys, setSurveys] = useState<Survey[]>(seed.surveys);
  const [drillingDesigns, setDrillingDesigns] = useState<DrillingDesign[]>(seed.drillingDesigns);
  const [machines, setMachines] = useState<Machine[]>(seed.machines);
  const [crews, setCrews] = useState<Crew[]>(seed.crews);
  const [drillingExecutions, setDrillingExecutions] = useState<DrillingExecution[]>(seed.drillingExecutions);
  const [holeChecks, setHoleChecks] = useState<HoleCheck[]>(seed.holeChecks);
  const [blastingDesigns, setBlastingDesigns] = useState<BlastingDesign[]>(seed.blastingDesigns);
  const [suppliers, setSuppliers] = useState<Supplier[]>(seed.suppliers);
  const [materials, setMaterials] = useState<Material[]>(seed.materials);
  const [lpos, setLpos] = useState<LPO[]>(seed.lpos);
  const [supplierConfirmations, setSupplierConfirmations] = useState<SupplierConfirmation[]>(seed.supplierConfirmations);
  const [finalChecks, setFinalChecks] = useState<FinalCheck[]>(seed.finalChecks);
  const [approvals, setApprovals] = useState<Approval[]>(seed.approvals);
  const [blastSchedules, setBlastSchedules] = useState<BlastSchedule[]>(seed.blastSchedules);
  const [blastExecutions, setBlastExecutions] = useState<BlastExecution[]>(seed.blastExecutions);
  const [blastReports, setBlastReports] = useState<BlastReport[]>(seed.blastReports);
  const [jobCosts, setJobCosts] = useState<JobCost[]>(seed.jobCosts);
  const [invoices, setInvoices] = useState<Invoice[]>(seed.invoices);
  const [payments, setPayments] = useState<Payment[]>(seed.payments);
  const [documents, setDocuments] = useState<AppDocument[]>(seed.documents);
  const [notifications, setNotifications] = useState<Notification[]>(seed.notifications);
  const [employees, setEmployees] = useState<Employee[]>(seed.employees);

  const applySnapshot = useCallback((snap: AppDatabaseSnapshot) => {
    const validUsers = Array.isArray(snap.systemUsers)
      ? snap.systemUsers.filter((u) => u && typeof u.id === 'string' && typeof u.name === 'string')
      : [];
    const validEmployees = Array.isArray(snap.employees)
      ? snap.employees.filter((e) => e && typeof e.id === 'string' && typeof e.name === 'string')
      : [];
    const validCustomers = Array.isArray(snap.customers)
      ? snap.customers.filter((c) => c && typeof c.id === 'string' && typeof c.name === 'string')
      : [];
    const validSites = Array.isArray(snap.sites)
      ? snap.sites.filter((s) => s && typeof s.id === 'string' && typeof s.name === 'string')
      : [];
    const validJobs = Array.isArray(snap.jobs)
      ? snap.jobs.filter((j) => j && typeof j.id === 'string' && typeof j.jobNo === 'string')
      : [];

    setSystemUsers(validUsers.length > 0 ? validUsers : seed.systemUsers);
    setEmployees(validEmployees.length > 0 ? validEmployees : seed.employees);
    setCustomers(validCustomers);
    setSites(validSites);
    setJobs(validJobs);
    setSurveys(Array.isArray(snap.surveys) ? snap.surveys : []);
    setDrillingDesigns(Array.isArray(snap.drillingDesigns) ? snap.drillingDesigns : []);
    setMachines(Array.isArray(snap.machines) ? snap.machines : []);
    setCrews(Array.isArray(snap.crews) ? snap.crews : []);
    setDrillingExecutions(Array.isArray(snap.drillingExecutions) ? snap.drillingExecutions : []);
    setHoleChecks(Array.isArray(snap.holeChecks) ? snap.holeChecks : []);
    setBlastingDesigns(Array.isArray(snap.blastingDesigns) ? snap.blastingDesigns : []);
    setSuppliers(Array.isArray(snap.suppliers) ? snap.suppliers : []);
    setMaterials(Array.isArray(snap.materials) ? snap.materials : []);
    setLpos(Array.isArray(snap.lpos) ? snap.lpos : []);
    setSupplierConfirmations(Array.isArray(snap.supplierConfirmations) ? snap.supplierConfirmations : []);
    setFinalChecks(Array.isArray(snap.finalChecks) ? snap.finalChecks : []);
    setApprovals(Array.isArray(snap.approvals) ? snap.approvals : []);
    setBlastSchedules(Array.isArray(snap.blastSchedules) ? snap.blastSchedules : []);
    setBlastExecutions(Array.isArray(snap.blastExecutions) ? snap.blastExecutions : []);
    setBlastReports(Array.isArray(snap.blastReports) ? snap.blastReports : []);
    setJobCosts(Array.isArray(snap.jobCosts) ? snap.jobCosts : []);
    setInvoices(Array.isArray(snap.invoices) ? snap.invoices : []);
    setPayments(Array.isArray(snap.payments) ? snap.payments : []);
    setDocuments(Array.isArray(snap.documents) ? snap.documents : []);
    setNotifications(Array.isArray(snap.notifications) ? snap.notifications : []);
  }, []);

  const buildSnapshot = useCallback((): AppDatabaseSnapshot => {
    return {
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
    };
  }, [
    systemUsers, employees, customers, sites, jobs, surveys, drillingDesigns, machines, crews,
    drillingExecutions, holeChecks, blastingDesigns, suppliers, materials, lpos,
    supplierConfirmations, finalChecks, approvals, blastSchedules, blastExecutions, blastReports,
    jobCosts, invoices, payments, documents, notifications,
  ]);

  // Load database on mount — prefer SQL Server API if configured & healthy
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (isSqlModeConfigured()) {
          const health = await apiHealth();
          if (health.ok && health.mode === 'live-bridge') {
            const snap = (await sqlApi.snapshot()) as unknown as AppDatabaseSnapshot | null;
            if (snap && Array.isArray(snap.systemUsers) && snap.systemUsers.length > 0) {
              if (cancelled) return;
              applySnapshot(snap);
              sqlMode.current = true;
              setDbEngine('sqlserver');
              setDbLastSavedAt(new Date().toISOString());
              setDbReady(true);
              // Keep persistReady = true so every change auto-syncs to phpMyAdmin AND local backup
              setTimeout(() => {
                persistReady.current = true;
              }, 200);
              return;
            }
          }
        }

        const snap = await initDatabase();
        if (cancelled) return;
        applySnapshot(snap);
        sqlMode.current = false;
        setDbEngine('indexeddb');
        const info = await getDatabaseInfo();
        if (!cancelled) {
          setDbLastSavedAt(info.lastSavedAt);
          setDbReady(true);
          setTimeout(() => {
            persistReady.current = true;
          }, 300);
        }
      } catch (err) {
        console.error('Database init failed', err);
        if (!cancelled) {
          setDbReady(true);
          persistReady.current = true;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applySnapshot]);

  // Auto-save to IndexedDB AND auto-sync to local SQL Server Connector whenever running
  useEffect(() => {
    if (!dbReady || !persistReady.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const snap = buildSnapshot();
        await saveSnapshot(snap);
        // Also push to local SSMS 2022 SQL Connector if reachable
        const synced = await sqlApi.syncSnapshot(snap);
        if (synced && synced.ok) {
          sqlMode.current = true;
          setDbEngine('sqlserver');
        }
        setDbLastSavedAt(new Date().toISOString());
      } catch (err) {
        console.error('IBTIKAR_BlastingDB save failed', err);
      }
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [dbReady, buildSnapshot]);

  const isEngineer = user?.role === 'Engineer';
  const isAdmin = user?.role === 'Admin';

  /** Always resolve from live systemUsers so Admin permission changes apply immediately if same session is refreshed via id */
  const permissions = useMemo(() => {
    if (!user) return [];
    const live = systemUsers.find((u) => u.id === user.id) || user;
    return resolvePermissions(live);
  }, [user, systemUsers]);

  const hasPermission = useCallback(
    (key: PermissionKey) => {
      if (!user) return false;
      if (user.role === 'Admin') return true;
      // Hard block: non-admin never gets employee-manage / admin control by permission spoofing
      if (key === 'employees.manage') return false;
      return permissions.includes(key);
    },
    [user, permissions]
  );

  const canCreateJob = hasPermission('jobs.create');
  const canEditJob = hasPermission('jobs.edit');
  const canDeleteJob = hasPermission('jobs.delete');
  const canManageJobs = canCreateJob || canEditJob || canDeleteJob;
  const canManageEmployees = hasPermission('employees.manage');
  const canManageCustomers =
    hasPermission('customers.create') || hasPermission('customers.edit');
  const canViewAllJobs = !user ? false : FULL_ACCESS_ROLES.has(user.role);

  const visibleJobs = useMemo(() => {
    if (!user) return [];
    if (!hasPermission('jobs.view') && user.role !== 'Admin') return [];
    if (user.role === 'Engineer') {
      return jobs.filter((j) => j.engineerId === user.employeeId);
    }
    return jobs;
  }, [user, jobs, hasPermission]);

  const visibleJobIds = useMemo(
    () => new Set(visibleJobs.map((j) => j.id)),
    [visibleJobs]
  );

  const canAccessJob = useCallback(
    (jobId: string) => {
      if (!user) return false;
      if (user.role === 'Admin') return true;
      if (!hasPermission('jobs.view')) return false;
      if (user.role !== 'Engineer') return true;
      return visibleJobIds.has(jobId);
    },
    [user, visibleJobIds, hasPermission]
  );

  const login = useCallback(
    (email: string, password: string) => {
      const normalized = email.trim().toLowerCase();
      if (!normalized) return false;
      if (!password) return false;

      const found = systemUsers.find(
        (u) =>
          (u.email.toLowerCase() === normalized || u.name.toLowerCase() === normalized) &&
          u.password === password
      );
      if (found) {
        setUser({ ...found, permissions: resolvePermissions(found) });
        setPage('dashboard');
        setSelectedJobId(null);
        return true;
      }

      return false;
    },
    [systemUsers]
  );

  const logout = useCallback(() => {
    setUser(null);
    setPage('dashboard');
    setSelectedJobId(null);
  }, []);

  const navigate = useCallback((p: Page, jobId?: string) => {
    setPage(p);
    if (jobId !== undefined) setSelectedJobId(jobId);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  const updateJobStatus = useCallback(
    (jobId: string, status: JobStatus, progress?: number) => {
      if (!hasPermission('jobs.edit')) return false;
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          const auto = progressFromStatus(status, j.progress);
          const nextProgress = progress !== undefined ? progress : auto;
          return {
            ...j,
            status,
            progress: nextProgress,
            ...(status === 'Closed' && !j.endDate
              ? { endDate: new Date().toISOString().slice(0, 10) }
              : {}),
            ...(status !== 'Order Received' &&
              status !== 'Draft' &&
              status !== 'Cancelled' &&
              !j.startDate
              ? { startDate: new Date().toISOString().slice(0, 10) }
              : {}),
          };
        })
      );
      return true;
    },
    [hasPermission]
  );

  const addCustomer = useCallback(
    (c: Omit<Customer, 'id' | 'createdAt'>) => {
      if (!hasPermission('customers.create')) return;
      const code = `CUS-${String(customers.length + 1).padStart(3, '0')}`;
      const shortCode = normalizeShortCode(
        c.shortCode || makeShortCode(c.name, 4),
        makeShortCode(c.name, 4)
      );
      setCustomers((prev) => [
        ...prev,
        {
          ...c,
          id: uid('c'),
          code,
          shortCode,
          createdAt: new Date().toISOString().slice(0, 10),
        },
      ]);
    },
    [customers.length, hasPermission]
  );

  const addSite = useCallback(
    (s: Omit<Site, 'id'>) => {
      if (!hasPermission('customers.create') && !hasPermission('customers.edit') && user?.role !== 'Admin') {
        return false;
      }
      setSites((prev) => [...prev, { ...s, id: uid('s') }]);
      return true;
    },
    [hasPermission, user]
  );

  const addJob = useCallback(
    (j: Omit<Job, 'id' | 'jobNo' | 'createdAt' | 'progress'>) => {
      if (!hasPermission('jobs.create')) return false;
      const customer = customers.find((c) => c.id === j.customerId);
      const engineer = employees.find((e) => e.id === j.engineerId);
      const custCode = customer?.shortCode || makeShortCode(customer?.name || 'CUST', 4);
      const engCode = engineer?.shortCode || makeShortCode(engineer?.name || 'ENG', 4);
      const existingNos = jobs.map((x) => x.jobNo);
      const jobNo = generateJobNo(custCode, engCode, existingNos);
      const initialStatus = j.status || 'Order Received';
      setJobs((prev) => [
        ...prev,
        {
          ...j,
          status: initialStatus,
          id: uid('j'),
          jobNo,
          createdAt: new Date().toISOString().slice(0, 10),
          progress: progressFromStatus(initialStatus, 0),
        },
      ]);
      return true;
    },
    [jobs, customers, employees, hasPermission]
  );

  const updateJob = useCallback(
    (jobId: string, patch: Partial<Omit<Job, 'id' | 'jobNo' | 'createdAt'>>) => {
      if (!hasPermission('jobs.edit')) return false;
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          const next = { ...j, ...patch };
          if (patch.status !== undefined) {
            next.progress = progressFromStatus(patch.status, j.progress);
            if (
              patch.status !== 'Order Received' &&
              patch.status !== 'Draft' &&
              patch.status !== 'Cancelled' &&
              !next.startDate
            ) {
              next.startDate = new Date().toISOString().slice(0, 10);
            }
            if (patch.status === 'Closed' && !next.endDate) {
              next.endDate = new Date().toISOString().slice(0, 10);
            }
          }
          return next;
        })
      );
      return true;
    },
    [hasPermission]
  );

  const deleteJob = useCallback(
    (jobId: string) => {
      if (!hasPermission('jobs.delete')) return false;
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setSelectedJobId((cur) => (cur === jobId ? null : cur));
      return true;
    },
    [hasPermission]
  );

  const addEmployee = useCallback(
    (e: Omit<Employee, 'id' | 'code'>) => {
      if (!hasPermission('employees.manage')) return false;
      const code = `EMP-${String(employees.length + 1).padStart(3, '0')}`;
      const empId = uid('e');
      const shortCode = normalizeShortCode(
        e.shortCode || makeShortCode(e.name, 4),
        makeShortCode(e.name, 4)
      );
      const newEmp: Employee = { ...e, id: empId, code, shortCode };
      setEmployees((prev) => [...prev, newEmp]);
      const loginUser: User = {
        id: uid('u'),
        employeeId: empId,
        name: e.name,
        email: e.email,
        password: 'ChangeMe123',
        role: e.role,
        department: e.department,
        permissions:
          e.role === 'Admin'
            ? [...ADMIN_ALL_PERMISSIONS]
            : [...(DEFAULT_ROLE_PERMISSIONS[e.role] || [])],
      };
      setSystemUsers((prev) => {
        if (prev.some((u) => (u.email || '').toLowerCase() === (e.email || '').toLowerCase())) {
          return prev;
        }
        return [...prev, loginUser];
      });
      return true;
    },
    [employees.length, hasPermission]
  );

  const updateEmployee = useCallback(
    (id: string, patch: Partial<Omit<Employee, 'id'>>) => {
      if (!hasPermission('employees.manage')) return false;
      setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
      setSystemUsers((prev) =>
        prev.map((u) => {
          if (u.employeeId !== id) return u;
          return {
            ...u,
            name: patch.name ?? u.name,
            email: patch.email ?? u.email,
            role: patch.role ?? u.role,
            department: patch.department ?? u.department,
          };
        })
      );
      return true;
    },
    [hasPermission]
  );

  const deleteEmployee = useCallback(
    (id: string) => {
      if (!hasPermission('employees.manage')) return false;
      if (user?.employeeId === id) return false;
      if (sqlMode.current) {
        void sqlApi.deleteEmployee(id).catch((err) => console.error(err));
      }
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      setSystemUsers((prev) =>
        prev.filter((u) => !(u.employeeId === id && u.role !== 'Admin'))
      );
      return true;
    },
    [hasPermission, user]
  );

  const addUserAccount = useCallback(
    (input: {
      name: string;
      email: string;
      password: string;
      role: UserRole;
      department?: string;
      shortCode?: string;
      phone?: string;
    }) => {
      if (user?.role !== 'Admin') return false;
      const username = input.email.trim().toLowerCase();
      if (!username || !input.password || !input.name.trim()) return false;
      if (systemUsers.some((u) => u.email.toLowerCase() === username)) return false;
      // Never allow creating another Admin from this screen except existing bootstrap
      const role: UserRole = input.role === 'Admin' ? 'User' : input.role;

      const empId = uid('e');
      const userId = uid('u');
      const code = `EMP-${String(employees.length + 1).padStart(3, '0')}`;
      const shortCode = normalizeShortCode(
        input.shortCode || makeShortCode(input.name, 4),
        makeShortCode(input.name, 4)
      );
      const department = input.department?.trim() || 'Operations';

      setEmployees((prev) => [
        ...prev,
        {
          id: empId,
          code,
          shortCode,
          name: input.name.trim(),
          role,
          department,
          phone: input.phone || '',
          email: username,
          status: 'Active',
        },
      ]);

      const perms = [...(DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.User)];

      setSystemUsers((prev) => [
        ...prev,
        {
          id: userId,
          employeeId: empId,
          name: input.name.trim(),
          email: username,
          password: input.password,
          role,
          department,
          permissions: perms,
        },
      ]);
      return true;
    },
    [user, systemUsers, employees.length]
  );

  const updateUserAccount = useCallback(
    (
      userId: string,
      patch: Partial<Pick<User, 'name' | 'email' | 'password' | 'role' | 'department' | 'permissions'>> & {
        status?: 'Active' | 'Inactive';
      }
    ) => {
      if (user?.role !== 'Admin') return false;
      const target = systemUsers.find((u) => u.id === userId);
      if (!target) return false;
      // Protect bootstrap admin account role
      if (target.role === 'Admin' && target.email === 'admin') {
        // allow password/name update only, not role demotion via this path if needed
      }
      const nextRole =
        patch.role && patch.role !== 'Admin'
          ? patch.role
          : target.role === 'Admin'
            ? 'Admin'
            : patch.role || target.role;

      setSystemUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          return {
            ...u,
            name: patch.name ?? u.name,
            email: patch.email ? patch.email.trim().toLowerCase() : u.email,
            password: patch.password && patch.password.length > 0 ? patch.password : u.password,
            role: nextRole,
            department: patch.department ?? u.department,
            permissions:
              nextRole === 'Admin'
                ? [...ADMIN_ALL_PERMISSIONS]
                : patch.permissions
                  ? [...patch.permissions]
                  : u.permissions || [...(DEFAULT_ROLE_PERMISSIONS[nextRole] || [])],
          };
        })
      );

      setEmployees((prev) =>
        prev.map((e) => {
          if (e.id !== target.employeeId) return e;
          return {
            ...e,
            name: patch.name ?? e.name,
            email: patch.email ? patch.email.trim().toLowerCase() : e.email,
            role: nextRole,
            department: patch.department ?? e.department,
            status: patch.status ?? e.status,
          };
        })
      );
      return true;
    },
    [user, systemUsers]
  );

  const deleteUserAccount = useCallback(
    (userId: string) => {
      if (user?.role !== 'Admin') return false;
      const target = systemUsers.find((u) => u.id === userId);
      if (!target) return false;
      if (target.role === 'Admin' || target.email === 'admin' || target.id === user.id) return false;

      setSystemUsers((prev) => prev.filter((u) => u.id !== userId));
      setEmployees((prev) => prev.filter((e) => e.id !== target.employeeId));
      return true;
    },
    [user, systemUsers]
  );

  const setUserPermissions = useCallback(
    (userId: string, next: PermissionKey[]) => {
      if (user?.role !== 'Admin') return false;
      const unique = [...new Set(next)];
      if (sqlMode.current) {
        void sqlApi.setPermissions(userId, unique).catch((err) => console.error(err));
      }
      setSystemUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          if (u.role === 'Admin') {
            return { ...u, permissions: [...ADMIN_ALL_PERMISSIONS] };
          }
          return { ...u, permissions: unique };
        })
      );
      setUser((cur) => {
        if (!cur || cur.id !== userId) return cur;
        if (cur.role === 'Admin') return { ...cur, permissions: [...ADMIN_ALL_PERMISSIONS] };
        return { ...cur, permissions: unique };
      });
      return true;
    },
    [user]
  );

  const resetUserPermissions = useCallback(
    (userId: string) => {
      if (user?.role !== 'Admin') return false;
      setSystemUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          const defaults =
            u.role === 'Admin'
              ? [...ADMIN_ALL_PERMISSIONS]
              : [...(DEFAULT_ROLE_PERMISSIONS[u.role] || [])];
          return { ...u, permissions: defaults };
        })
      );
      setUser((cur) => {
        if (!cur || cur.id !== userId) return cur;
        const defaults =
          cur.role === 'Admin'
            ? [...ADMIN_ALL_PERMISSIONS]
            : [...(DEFAULT_ROLE_PERMISSIONS[cur.role] || [])];
        return { ...cur, permissions: defaults };
      });
      return true;
    },
    [user]
  );

  const addLpo = useCallback(
    (l: Omit<LPO, 'id' | 'lpoNo'>) => {
      if (!hasPermission('procurement.manage') && user?.role !== 'Admin') return;
      const num = 89 + lpos.length + 1;
      setLpos((prev) => [...prev, { ...l, id: uid('lpo'), lpoNo: `LPO-2026-0${num}` }]);
    },
    [lpos.length, hasPermission, user]
  );

  const canOperate = useCallback(() => {
    return !!(user && (user.role === 'Admin' || hasPermission('jobs.edit') || hasPermission('jobs.create')));
  }, [user, hasPermission]);

  const addSurvey = useCallback(
    (s: Omit<Survey, 'id'>) => {
      if (!canOperate()) return false;
      setSurveys((prev) => [...prev, { ...s, id: uid('sv') }]);
      if (s.jobId) updateJobStatus(s.jobId, s.status === 'Approved' ? 'Drilling Design' : 'Survey');
      return true;
    },
    [canOperate, updateJobStatus]
  );

  const addDrillingDesign = useCallback(
    (d: Omit<DrillingDesign, 'id'>) => {
      if (!canOperate()) return false;
      setDrillingDesigns((prev) => [...prev, { ...d, id: uid('dd') }]);
      if (d.jobId) updateJobStatus(d.jobId, d.status === 'Approved' ? 'Resource Assigned' : 'Drilling Design');
      return true;
    },
    [canOperate, updateJobStatus]
  );

  const addDrillingExecution = useCallback(
    (d: Omit<DrillingExecution, 'id'>) => {
      if (!canOperate()) return false;
      setDrillingExecutions((prev) => [...prev, { ...d, id: uid('de') }]);
      if (d.jobId) {
        updateJobStatus(
          d.jobId,
          d.status === 'Completed' ? 'Hole Check' : 'Drilling'
        );
      }
      return true;
    },
    [canOperate, updateJobStatus]
  );

  const addHoleCheck = useCallback(
    (h: Omit<HoleCheck, 'id'>) => {
      if (!canOperate()) return false;
      setHoleChecks((prev) => [...prev, { ...h, id: uid('hc') }]);
      if (h.jobId) updateJobStatus(h.jobId, h.status === 'Approved' ? 'Blasting Design' : 'Hole Check');
      return true;
    },
    [canOperate, updateJobStatus]
  );

  const addBlastingDesign = useCallback(
    (d: Omit<BlastingDesign, 'id'>) => {
      if (!canOperate()) return false;
      setBlastingDesigns((prev) => [...prev, { ...d, id: uid('bd') }]);
      if (d.jobId) updateJobStatus(d.jobId, d.status === 'Approved' ? 'Final Check' : 'Blasting Design');
      return true;
    },
    [canOperate, updateJobStatus]
  );

  const addMachine = useCallback(
    (m: Omit<Machine, 'id'>) => {
      if (!canOperate() && user?.role !== 'Admin') return false;
      const code = m.code || `DRL-${String(machines.length + 1).padStart(2, '0')}`;
      setMachines((prev) => [...prev, { ...m, id: uid('m'), code }]);
      return true;
    },
    [canOperate, user, machines.length]
  );

  const addCrew = useCallback(
    (c: Omit<Crew, 'id'>) => {
      if (!canOperate() && user?.role !== 'Admin') return false;
      setCrews((prev) => [...prev, { ...c, id: uid('cr') }]);
      return true;
    },
    [canOperate, user]
  );

  const addBlastSchedule = useCallback(
    (s: Omit<BlastSchedule, 'id'>) => {
      if (!canOperate()) return false;
      setBlastSchedules((prev) => [...prev, { ...s, id: uid('bs') }]);
      if (s.jobId) updateJobStatus(s.jobId, 'Blast Scheduled');
      return true;
    },
    [canOperate, updateJobStatus]
  );

  const addBlastReport = useCallback(
    (r: Omit<BlastReport, 'id'>) => {
      if (!canOperate()) return false;
      setBlastReports((prev) => [...prev, { ...r, id: uid('br') }]);
      if (r.jobId) updateJobStatus(r.jobId, r.status === 'Approved' ? 'Invoice' : 'Report');
      return true;
    },
    [canOperate, updateJobStatus]
  );

  const addSupplier = useCallback(
    (s: Omit<Supplier, 'id' | 'code'>) => {
      if (!canOperate() && !hasPermission('procurement.manage')) return false;
      const code = `SUP-${String(suppliers.length + 1).padStart(3, '0')}`;
      setSuppliers((prev) => [...prev, { ...s, id: uid('sup'), code }]);
      return true;
    },
    [canOperate, hasPermission, suppliers.length]
  );

  const addMaterial = useCallback(
    (m: Omit<Material, 'id' | 'code'>) => {
      if (!canOperate() && !hasPermission('procurement.manage')) return false;
      const code = `MAT-${String(materials.length + 1).padStart(3, '0')}`;
      setMaterials((prev) => [...prev, { ...m, id: uid('mat'), code }]);
      return true;
    },
    [canOperate, hasPermission, materials.length]
  );

  const addBlastExecution = useCallback(
    (b: Omit<BlastExecution, 'id'>) => {
      if (!canOperate()) return false;
      setBlastExecutions((prev) => [...prev, { ...b, id: uid('be') }]);
      if (b.jobId) updateJobStatus(b.jobId, b.status === 'Completed' ? 'Blast Completed' : 'Blasting');
      return true;
    },
    [canOperate, updateJobStatus]
  );

  const addFinalCheck = useCallback(
    (f: Omit<FinalCheck, 'id'>) => {
      if (!canOperate()) return false;
      setFinalChecks((prev) => [...prev, { ...f, id: uid('fc') }]);
      if (f.jobId) updateJobStatus(f.jobId, f.status === 'Approved' ? 'Procurement' : 'Final Check');
      return true;
    },
    [canOperate, updateJobStatus]
  );

  const addApproval = useCallback(
    (a: Omit<Approval, 'id'>) => {
      if (!canOperate() && !hasPermission('approvals.manage')) return false;
      setApprovals((prev) => [...prev, { ...a, id: uid('ap') }]);
      if (a.jobId && a.status === 'Approved') updateJobStatus(a.jobId, 'Police Approval');
      return true;
    },
    [canOperate, hasPermission, updateJobStatus]
  );

  const addJobCost = useCallback(
    (c: Omit<JobCost, 'id'>) => {
      if (!canOperate() && !hasPermission('finance.view')) return false;
      setJobCosts((prev) => [...prev, { ...c, id: uid('jc') }]);
      return true;
    },
    [canOperate, hasPermission]
  );

  const addInvoice = useCallback(
    (i: Omit<Invoice, 'id' | 'invoiceNo'>) => {
      if (!canOperate() && !hasPermission('finance.view')) return false;
      const invoiceNo = `INV-2026-${String(invoices.length + 1).padStart(4, '0')}`;
      setInvoices((prev) => [...prev, { ...i, id: uid('inv'), invoiceNo }]);
      if (i.jobId) updateJobStatus(i.jobId, i.status === 'Paid' ? 'Closed' : 'Invoice');
      return true;
    },
    [canOperate, hasPermission, invoices.length, updateJobStatus]
  );

  const addPayment = useCallback(
    (p: Omit<Payment, 'id'>) => {
      if (!canOperate() && !hasPermission('finance.view')) return false;
      setPayments((prev) => [...prev, { ...p, id: uid('pay') }]);
      const inv = invoices.find((x) => x.id === p.invoiceId);
      if (inv) {
        const totalPaid =
          payments.filter((x) => x.invoiceId === inv.id).reduce((s, x) => s + x.amount, 0) +
          p.amount;
        const nextStatus = totalPaid >= inv.total ? 'Paid' : 'Partial';
        setInvoices((prev) => prev.map((x) => (x.id === inv.id ? { ...x, status: nextStatus } : x)));
        if (inv.jobId) {
          updateJobStatus(inv.jobId, nextStatus === 'Paid' ? 'Closed' : 'Payment');
        }
      }
      return true;
    },
    [canOperate, hasPermission, invoices, payments, updateJobStatus]
  );

  const addDocument = useCallback(
    (d: Omit<AppDocument, 'id'>) => {
      if (!canOperate() && !hasPermission('documents.view')) return false;
      setDocuments((prev) => [...prev, { ...d, id: uid('doc') }]);
      return true;
    },
    [canOperate, hasPermission]
  );

  const updateFinalCheck = useCallback((id: string, patch: Partial<FinalCheck>) => {
    setFinalChecks((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  const updateApproval = useCallback(
    (id: string, patch: Partial<Approval>) => {
      if (!hasPermission('approvals.manage') && user?.role !== 'Admin') return;
      setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    },
    [hasPermission, user]
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const getCustomer = useCallback((id: string) => customers.find((c) => c.id === id), [customers]);
  const getSite = useCallback((id: string) => sites.find((s) => s.id === id), [sites]);
  const getEmployee = useCallback((id: string) => employees.find((e) => e.id === id), [employees]);
  const getJob = useCallback((id: string) => jobs.find((j) => j.id === id), [jobs]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const reloadFromDb = useCallback(async () => {
    const snap = await initDatabase();
    applySnapshot(snap);
    const info = await getDatabaseInfo();
    setDbLastSavedAt(info.lastSavedAt);
  }, [applySnapshot]);

  const resetDb = useCallback(async () => {
    if (user?.role !== 'Admin') throw new Error('Admin only');
    persistReady.current = false;
    const snap = await resetDatabase();
    applySnapshot(snap);
    setUser(null);
    setPage('dashboard');
    setSelectedJobId(null);
    const info = await getDatabaseInfo();
    setDbLastSavedAt(info.lastSavedAt);
    setTimeout(() => {
      persistReady.current = true;
    }, 300);
  }, [user, applySnapshot]);

  const exportDb = useCallback(async () => {
    // flush current state first
    await saveSnapshot(buildSnapshot());
    return exportDatabaseJson();
  }, [buildSnapshot]);

  const importDb = useCallback(
    async (json: string) => {
      if (user?.role !== 'Admin') throw new Error('Admin only');
      persistReady.current = false;
      const snap = await importDatabaseJson(json);
      applySnapshot(snap);
      setUser(null);
      setPage('dashboard');
      const info = await getDatabaseInfo();
      setDbLastSavedAt(info.lastSavedAt);
      setTimeout(() => {
        persistReady.current = true;
      }, 300);
    },
    [user, applySnapshot]
  );

  const getDbInfo = useCallback(async () => {
    await saveSnapshot(buildSnapshot());
    return getDatabaseInfo();
  }, [buildSnapshot]);

  const value: AppContextValue = {
    user,
    isAuthenticated: !!user,
    page,
    selectedJobId,
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
    employees,
    systemUsers,
    sidebarOpen,
    dbReady,
    dbName: sqlMode.current || dbEngine === 'sqlserver' ? 'IBTIKAR_BlastingDB (SQL Server)' : DB_NAME,
    dbLastSavedAt,
    dbEngine,
    login,
    logout,
    navigate,
    setSidebarOpen,
    updateJobStatus,
    addCustomer,
    addSite,
    addJob,
    updateJob,
    deleteJob,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addUserAccount,
    updateUserAccount,
    deleteUserAccount,
    setUserPermissions,
    resetUserPermissions,
    addLpo,
    addSurvey,
    addDrillingDesign,
    addDrillingExecution,
    addHoleCheck,
    addBlastingDesign,
    addMachine,
    addCrew,
    addSupplier,
    addMaterial,
    addBlastSchedule,
    addBlastExecution,
    addBlastReport,
    addFinalCheck,
    addApproval,
    addJobCost,
    addInvoice,
    addPayment,
    addDocument,
    updateFinalCheck,
    updateApproval,
    markNotificationRead,
    markAllNotificationsRead,
    getCustomer,
    getSite,
    getEmployee,
    getJob,
    unreadCount,
    visibleJobs,
    visibleJobIds,
    canViewAllJobs,
    isEngineer: !!isEngineer,
    isAdmin: !!isAdmin,
    permissions,
    hasPermission,
    canCreateJob,
    canEditJob,
    canDeleteJob,
    canManageJobs,
    canManageEmployees,
    canManageCustomers,
    canAccessJob,
    resetDb,
    exportDb,
    importDb,
    getDbInfo,
    reloadFromDb,
  };

  if (!dbReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />
          <div className="text-sm font-semibold text-slate-800">Loading IBTIKAR_BlastingDB…</div>
          <div className="text-xs text-slate-500 mt-1">IndexedDB · local persistent database</div>
        </div>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
