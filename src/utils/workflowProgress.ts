import type { JobStatus } from '../data/types';

/**
 * Workflow steps used for progress % (must stay in sync with WorkflowTracker UI).
 * Progress = (currentStepIndex / lastStepIndex) * 100
 */
export const WORKFLOW_STEPS = [
  'Order Received',
  'Survey',
  'Drilling Design',
  'Drilling',
  'Hole Check',
  'Blasting Design',
  'Final Check',
  'Procurement',
  'Police Approval',
  'Blast Scheduled',
  'Blasting',
  'Report',
  'Invoice',
  'Closed',
] as const;

/** Map every job status to a workflow step index (0 … WORKFLOW_STEPS.length-1) */
export const STATUS_TO_STEP: Record<string, number> = {
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

const LAST_STEP = WORKFLOW_STEPS.length - 1; // 13 = Closed = 100%

/**
 * Automatic progress % from workflow status.
 * - Order Received → ~0–7%
 * - each next step increases
 * - Closed → 100%
 * - Cancelled → keep previous or 0 (caller can pass current)
 */
export function progressFromStatus(status: JobStatus | string, fallback = 0): number {
  if (status === 'Cancelled') return fallback;
  const step = STATUS_TO_STEP[status];
  if (step === undefined || step < 0) return fallback;
  if (LAST_STEP <= 0) return 0;
  const pct = Math.round((step / LAST_STEP) * 100);
  return Math.min(100, Math.max(0, pct));
}

/** Human label for current step */
export function workflowStepLabel(status: JobStatus | string): string {
  const step = STATUS_TO_STEP[status];
  if (step === undefined || step < 0) return status === 'Cancelled' ? 'Cancelled' : String(status);
  return WORKFLOW_STEPS[step] || String(status);
}
