import type {
  User, Customer, Site, Job, Survey, DrillingDesign, Machine, Crew,
  DrillingExecution, HoleCheck, BlastingDesign, Supplier, Material, LPO,
  SupplierConfirmation, FinalCheck, Approval, BlastSchedule, BlastExecution,
  BlastReport, JobCost, Invoice, Payment, AppDocument, Notification, Employee,
} from './types';
import { ADMIN_ALL_PERMISSIONS } from './types';

/**
 * Production seed — empty operational data.
 * Admin login:
 *   Username/Email: admin
 *   Password: Krypton
 */

export const systemUsers: User[] = [
  {
    id: 'u1',
    employeeId: 'e1',
    name: 'admin',
    email: 'admin',
    password: 'Krypton',
    role: 'Admin',
    department: 'Administration',
    permissions: [...ADMIN_ALL_PERMISSIONS],
  },
];

export const currentUser: User = systemUsers[0];

export const employees: Employee[] = [
  {
    id: 'e1',
    code: 'EMP-001',
    shortCode: 'ADMIN',
    name: 'admin',
    role: 'Admin',
    department: 'Administration',
    phone: '',
    email: 'admin',
    status: 'Active',
  },
];

export const customers: Customer[] = [];
export const sites: Site[] = [];
export const jobs: Job[] = [];
export const surveys: Survey[] = [];
export const drillingDesigns: DrillingDesign[] = [];
export const machines: Machine[] = [];
export const crews: Crew[] = [];
export const drillingExecutions: DrillingExecution[] = [];
export const holeChecks: HoleCheck[] = [];
export const blastingDesigns: BlastingDesign[] = [];
export const suppliers: Supplier[] = [];
export const materials: Material[] = [];
export const lpos: LPO[] = [];
export const supplierConfirmations: SupplierConfirmation[] = [];
export const finalChecks: FinalCheck[] = [];
export const approvals: Approval[] = [];
export const blastSchedules: BlastSchedule[] = [];
export const blastExecutions: BlastExecution[] = [];
export const blastReports: BlastReport[] = [];
export const jobCosts: JobCost[] = [];
export const invoices: Invoice[] = [];
export const payments: Payment[] = [];
export const documents: AppDocument[] = [];
export const notifications: Notification[] = [];
