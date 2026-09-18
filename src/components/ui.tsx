import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '../utils/cn';
import type { JobStatus, Priority } from '../data/types';

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm',
        onClick && 'cursor-pointer hover:border-cyan-400/60 hover:shadow-md transition-all',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants = {
    primary: 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-600 shadow-sm shadow-cyan-600/20',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200',
    danger: 'bg-red-600 hover:bg-red-500 text-white border-red-600',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 border-transparent',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600',
  };
  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-xs font-medium text-slate-600">{label}</span>}
      <input
        className={cn(
          'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20',
          className
        )}
        {...props}
      />
    </label>
  );
}

export function Select({
  label,
  children,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-xs font-medium text-slate-600">{label}</span>}
      <select
        className={cn(
          'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({
  label,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-xs font-medium text-slate-600">{label}</span>}
      <textarea
        className={cn(
          'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 min-h-[80px]',
          className
        )}
        {...props}
      />
    </label>
  );
}

export function Badge({
  children,
  color = 'slate',
}: {
  children: ReactNode;
  color?: 'slate' | 'cyan' | 'emerald' | 'amber' | 'red' | 'blue' | 'purple' | 'orange';
}) {
  const colors = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        colors[color]
      )}
    >
      {children}
    </span>
  );
}

export function statusColor(
  status: string
): 'slate' | 'cyan' | 'emerald' | 'amber' | 'red' | 'blue' | 'purple' | 'orange' {
  const s = status.toLowerCase();
  if (['closed', 'paid', 'approved', 'completed', 'delivered', 'confirmed', 'active', 'allowed'].some((x) => s.includes(x)))
    return 'emerald';
  if (['cancelled', 'rejected', 'overdue', 'aborted', 'down', 'error', 'expired', 'denied'].some((x) => s.includes(x)))
    return 'red';
  if (['pending', 'draft', 'scheduled', 'submitted', 'partial'].some((x) => s.includes(x)))
    return 'amber';
  if (['progress', 'drilling', 'blasting', 'assigned', 'sent'].some((x) => s.includes(x)))
    return 'cyan';
  if (['maintenance', 'hold', 'postponed', 'revision'].some((x) => s.includes(x)))
    return 'orange';
  if (['urgent', 'high'].includes(s)) return 'red';
  return 'slate';
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge color={statusColor(status)}>{status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const map: Record<Priority, 'slate' | 'cyan' | 'amber' | 'red'> = {
    Low: 'slate',
    Normal: 'cyan',
    High: 'amber',
    Urgent: 'red',
  };
  return <Badge color={map[priority]}>{priority}</Badge>;
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-slate-100 overflow-hidden', className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl',
          wide ? 'max-w-3xl' : 'max-w-lg'
        )}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5 z-10">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3 opacity-40">📋</div>
      <div className="text-sm font-medium text-slate-700">{title}</div>
      {description && <div className="text-xs text-slate-500 mt-1 max-w-xs">{description}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  icon,
  color = 'cyan',
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    cyan: 'from-cyan-500 to-blue-600 text-white',
    emerald: 'from-emerald-500 to-teal-600 text-white',
    amber: 'from-amber-500 to-orange-600 text-white',
    red: 'from-red-500 to-rose-600 text-white',
    purple: 'from-purple-500 to-indigo-600 text-white',
    orange: 'from-orange-500 to-amber-600 text-white',
    blue: 'from-blue-500 to-indigo-600 text-white',
    rose: 'from-rose-500 to-pink-600 text-white',
    fuchsia: 'from-fuchsia-500 to-purple-600 text-white',
    indigo: 'from-indigo-500 to-blue-600 text-white',
  };
  const c = colorMap[color] || colorMap.cyan;
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
          {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
        </div>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-lg shadow-sm',
            c
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80">
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function WorkflowTracker({ status }: { status: JobStatus }) {
  // Shared with progressFromStatus so bar % matches tracker step
  const steps = [
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
  ];

  const statusToStep: Record<string, number> = {
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

  const current = statusToStep[status] ?? 0;
  const isCancelled = status === 'Cancelled';
  const last = steps.length - 1;
  const autoPct =
    isCancelled || current < 0 ? 0 : Math.round((current / last) * 100);

  return (
    <div className="w-full space-y-2">
      {isCancelled ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
          JOB CANCELLED
        </div>
      ) : (
        <>
          <div className="flex items-center gap-0.5 overflow-x-auto pb-1">
            {steps.map((step, i) => {
              const done = i < current;
              const active = i === current;
              return (
                <div key={step} className="flex items-center min-w-0">
                  <div
                    className={cn(
                      'rounded-md px-1.5 py-1 text-[9px] font-semibold whitespace-nowrap border',
                      done && 'bg-cyan-50 text-cyan-700 border-cyan-200',
                      active && 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-200',
                      !done && !active && 'bg-slate-50 text-slate-400 border-slate-200'
                    )}
                    title={`${step}${active ? ` · ${autoPct}%` : done ? ' · done' : ''}`}
                  >
                    {step}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        'h-0.5 w-2 sm:w-3 shrink-0',
                        i < current ? 'bg-cyan-400' : 'bg-slate-200'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>
              Step {Math.min(current + 1, steps.length)} of {steps.length}
              {current >= 0 && current < steps.length ? ` · ${steps[current]}` : ''}
            </span>
            <span className="font-semibold text-cyan-700">{autoPct}% complete</span>
          </div>
        </>
      )}
    </div>
  );
}

export function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
      <div className="text-lg font-bold text-slate-900">{value}</div>
      <div className="text-[10px] text-slate-500 font-medium">{label}</div>
    </div>
  );
}
