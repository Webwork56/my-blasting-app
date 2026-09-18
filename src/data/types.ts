export type JobStatus =
  | 'Draft'
  | 'Order Received'
  | 'Area Assigned'
  | 'Survey'
  | 'Drilling Design'
  | 'Resource Assigned'
  | 'Drilling'
  | 'Hole Check'
  | 'Blasting Design'
  | 'Final Check'
  | 'Procurement'
  | 'Supplier Confirmed'
  | 'Admin Verification'
  | 'PRO Submission'
  | 'Police Approval'
  | 'Blast Scheduled'
  | 'Blasting'
  | 'Blast Completed'
  | 'Report'
  | 'Invoice'
  | 'Payment'
  | 'Closed'
  | 'Cancelled';

export type Priority = 'Low' | 'Normal' | 'High' | 'Urgent';
export type UserRole =
  | 'Admin'
  | 'User'
  | 'Engineer'
  | 'Supervisor'
  | 'Operator'
  | 'Finance'
  | 'PRO'
  | 'Viewer';

/** Granular rights Admin can grant or revoke per login account */
export type PermissionKey =
  | 'jobs.view'
  | 'jobs.create'
  | 'jobs.edit'
  | 'jobs.delete'
  | 'customers.view'
  | 'customers.create'
  | 'customers.edit'
  | 'employees.view'
  | 'employees.manage'
  | 'reports.view'
  | 'reports.print'
  | 'finance.view'
  | 'approvals.manage'
  | 'procurement.manage'
  | 'documents.view';

export const ALL_PERMISSIONS: { key: PermissionKey; label: string; group: string }[] = [
  { key: 'jobs.view', label: 'View Jobs', group: 'Jobs' },
  { key: 'jobs.create', label: 'Create Jobs', group: 'Jobs' },
  { key: 'jobs.edit', label: 'Edit / Modify Jobs', group: 'Jobs' },
  { key: 'jobs.delete', label: 'Delete Jobs', group: 'Jobs' },
  { key: 'customers.view', label: 'View Customers', group: 'Customers' },
  { key: 'customers.create', label: 'Create Customers', group: 'Customers' },
  { key: 'customers.edit', label: 'Edit Customers', group: 'Customers' },
  { key: 'employees.view', label: 'View Employees', group: 'Employees' },
  { key: 'employees.manage', label: 'Add / Edit / Remove Employees', group: 'Employees' },
  { key: 'reports.view', label: 'View Reports', group: 'Reports' },
  { key: 'reports.print', label: 'Print Reports', group: 'Reports' },
  { key: 'finance.view', label: 'View Finance', group: 'Finance' },
  { key: 'approvals.manage', label: 'Manage Approvals', group: 'Operations' },
  { key: 'procurement.manage', label: 'Manage Procurement', group: 'Operations' },
  { key: 'documents.view', label: 'View Documents', group: 'Documents' },
];

export const ADMIN_ALL_PERMISSIONS: PermissionKey[] = ALL_PERMISSIONS.map((p) => p.key);

/** Default rights by role (Admin can override per user) */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  Admin: [...ADMIN_ALL_PERMISSIONS],
  // Standard user: operational access only — NO admin/database/permission rights
  User: [
    'jobs.view',
    'jobs.create',
    'jobs.edit',
    'customers.view',
    'customers.create',
    'reports.view',
    'reports.print',
    'documents.view',
  ],
  Engineer: [
    'jobs.view',
    'jobs.edit',
    'customers.view',
    'reports.view',
    'reports.print',
    'documents.view',
  ],
  Supervisor: [
    'jobs.view',
    'customers.view',
    'reports.view',
    'reports.print',
    'approvals.manage',
    'documents.view',
  ],
  Operator: ['jobs.view', 'documents.view'],
  Finance: [
    'jobs.view',
    'customers.view',
    'finance.view',
    'reports.view',
    'reports.print',
    'documents.view',
  ],
  PRO: [
    'jobs.view',
    'customers.view',
    'approvals.manage',
    'reports.view',
    'documents.view',
  ],
  Viewer: ['jobs.view', 'customers.view', 'reports.view', 'documents.view'],
};

export interface User {
  id: string;
  /** Links to Employee.id for job assignment scoping */
  employeeId: string;
  name: string;
  email: string;
  /** Required login password */
  password: string;
  role: UserRole;
  department: string;
  avatar?: string;
  /**
   * Custom permissions set by Admin.
   * undefined = use DEFAULT_ROLE_PERMISSIONS for role
   * [] = no rights (except Admin always full)
   */
  permissions?: PermissionKey[];
}

export interface Customer {
  id: string;
  code: string;
  /** Short code used in Job ID, e.g. WE for ALWESAM → WE_HASH_0001 */
  shortCode: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Site {
  id: string;
  customerId: string;
  name: string;
  location: string;
  gpsLat: number;
  gpsLng: number;
  areaSize: string;
  notes: string;
}

export interface Job {
  id: string;
  jobNo: string;
  customerId: string;
  siteId: string;
  title: string;
  description: string;
  priority: Priority;
  status: JobStatus;
  engineerId: string;
  requestedDate: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  progress: number;
}

export interface Survey {
  id: string;
  jobId: string;
  areaName: string;
  plannedDate: string;
  completedDate?: string;
  surveyorId: string;
  gpsPoints: number;
  result: string;
  status: 'Planned' | 'In Progress' | 'Completed' | 'Approved' | 'Rejected';
  notes: string;
}

export interface DrillingDesign {
  id: string;
  jobId: string;
  burden: number;
  spacing: number;
  holeDiameter: number;
  holeDepth: number;
  numberOfHoles: number;
  pattern: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Revision';
  designedBy: string;
  approvedBy?: string;
  notes: string;
}

export interface Machine {
  id: string;
  code: string;
  name: string;
  type: string;
  status: 'Available' | 'Assigned' | 'Maintenance' | 'Down';
  operator?: string;
}

export interface Crew {
  id: string;
  name: string;
  supervisorId: string;
  members: string[];
  status: 'Available' | 'Assigned' | 'Off';
}

export interface DrillingExecution {
  id: string;
  jobId: string;
  machineId: string;
  crewId: string;
  startDate: string;
  endDate?: string;
  plannedHoles: number;
  completedHoles: number;
  plannedDepth: number;
  actualDepth: number;
  downtimeHours: number;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  notes: string;
}

export interface HoleCheck {
  id: string;
  jobId: string;
  inspectedHoles: number;
  totalHoles: number;
  depthOk: boolean;
  diameterOk: boolean;
  spacingOk: boolean;
  status: 'Pending' | 'In Progress' | 'Approved' | 'Rejected';
  inspectorId: string;
  notes: string;
  checkedAt?: string;
}

export interface BlastingDesign {
  id: string;
  jobId: string;
  totalHoles: number;
  totalDepth: number;
  initiationSystem: string;
  delayPattern: string;
  plannedQuantity: number;
  materialType: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Revision';
  designedBy: string;
  notes: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  materials: string;
  status: 'Active' | 'Inactive';
}

export interface Material {
  id: string;
  code: string;
  name: string;
  unit: string;
  category: string;
  stockQty: number;
  unitCost: number;
}

export interface LPO {
  id: string;
  lpoNo: string;
  jobId: string;
  supplierId: string;
  date: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Delivered';
  totalAmount: number;
  items: { materialId: string; qty: number; unitPrice: number }[];
  notes: string;
}

export interface SupplierConfirmation {
  id: string;
  lpoId: string;
  confirmedQty: number;
  expectedDelivery: string;
  status: 'Pending' | 'Confirmed' | 'Partial' | 'Unavailable';
  notes: string;
}

export interface FinalCheck {
  id: string;
  jobId: string;
  drillingDesignOk: boolean;
  holeCheckingOk: boolean;
  blastingDesignOk: boolean;
  procurementOk: boolean;
  documentsOk: boolean;
  status: 'Pending' | 'Approved' | 'Rejected';
  checkedBy?: string;
  checkedAt?: string;
  remarks: string;
}

export interface Approval {
  id: string;
  jobId: string;
  type: 'Administrative' | 'PRO' | 'Police' | 'Permit';
  status: 'Pending' | 'Submitted' | 'Approved' | 'Rejected' | 'Expired';
  submittedAt?: string;
  approvedAt?: string;
  expiryDate?: string;
  referenceNo?: string;
  notes: string;
}

export interface BlastSchedule {
  id: string;
  jobId: string;
  blastDate: string;
  startTime: string;
  endTime: string;
  crewId: string;
  manpower: number;
  equipment: string;
  materialsReady: boolean;
  safetyPrep: boolean;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Postponed';
}

export interface BlastExecution {
  id: string;
  jobId: string;
  scheduleId: string;
  safetyInspection: boolean;
  areaCleared: boolean;
  approvalsValid: boolean;
  actualQuantity: number;
  blastStart: string;
  blastEnd: string;
  weather: string;
  status: 'Ready' | 'In Progress' | 'Completed' | 'Aborted';
  notes: string;
}

export interface BlastReport {
  id: string;
  jobId: string;
  totalHoles: number;
  materialQty: number;
  blastedVolume: number;
  result: string;
  flyRock: boolean;
  vibration: string;
  misfire: boolean;
  dust: string;
  safetyIncident: boolean;
  status: 'Draft' | 'Submitted' | 'Approved';
  reportedBy: string;
  notes: string;
}

export interface JobCost {
  id: string;
  jobId: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  jobId: string;
  customerId: string;
  date: string;
  dueDate: string;
  subtotal: number;
  vat: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Partial' | 'Overdue';
  items: { description: string; amount: number }[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  reference: string;
  date: string;
  notes: string;
}

export interface AppDocument {
  id: string;
  jobId?: string;
  name: string;
  category: string;
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface Employee {
  id: string;
  code: string;
  /** Short code used in Job ID, e.g. HASH for Eng. Hashmai → WE_HASH_0001 */
  shortCode: string;
  name: string;
  role: UserRole;
  department: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
}
