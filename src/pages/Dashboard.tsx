import { useState } from 'react';
import { useApp } from '../store/AppContext';
import {
  PageHeader, KpiCard, Card, CardHeader, StatusBadge, PriorityBadge,
  ProgressBar, Badge,
} from '../components/ui';
import { APP_INFO } from '../constants/appInfo';

export function DashboardPage() {
  const {
    visibleJobs, visibleJobIds, approvals, blastSchedules, invoices, payments, notifications,
    drillingExecutions, navigate, getCustomer, markNotificationRead, isEngineer, user,
    canCreateJob, canEditJob, canDeleteJob, isAdmin,
  } = useApp();

  const activeJobs = visibleJobs.filter((j) => !['Closed', 'Cancelled'].includes(j.status));
  const drillingJobs = visibleJobs.filter((j) => j.status === 'Drilling');
  const pendingApprovals = approvals.filter(
    (a) => ['Pending', 'Submitted'].includes(a.status) && visibleJobIds.has(a.jobId)
  );
  const scheduledBlasts = blastSchedules.filter(
    (s) => ['Scheduled', 'Confirmed'].includes(s.status) && visibleJobIds.has(s.jobId)
  );
  const completedBlasts = visibleJobs.filter((j) =>
    ['Blast Completed', 'Report', 'Invoice', 'Payment', 'Closed'].includes(j.status)
  );
  const outstandingInv = invoices.filter(
    (i) =>
      ['Sent', 'Partial', 'Overdue', 'Draft'].includes(i.status) && visibleJobIds.has(i.jobId)
  );
  const pendingPay = invoices.filter((i) => {
    if (!visibleJobIds.has(i.jobId)) return false;
    if (i.status === 'Paid') return false;
    const paid = payments.filter((p) => p.invoiceId === i.id).reduce((s, p) => s + p.amount, 0);
    return paid < i.total;
  });

  const recentJobs = [...visibleJobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const unread = notifications.filter((n) => !n.read).slice(0, 5);
  const drillingProgress = drillingExecutions.filter(
    (d) => d.status === 'In Progress' && visibleJobIds.has(d.jobId)
  );

  const [showInfo, setShowInfo] = useState(false);

  return (
    <div>
      <PageHeader
        title="Operations Dashboard"
        subtitle={
          isEngineer
            ? `Engineer view · Showing jobs assigned to ${user?.name}`
            : 'Real-time overview of blasting operations and job lifecycle'
        }
        actions={
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <div className="hidden sm:flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600">
                <span className="text-slate-400 font-medium">Access</span>
                {canCreateJob && <span className="text-emerald-600">Create</span>}
                {canEditJob && <span className="text-cyan-600">Edit</span>}
                {canDeleteJob && <span className="text-red-600">Delete</span>}
                {!canCreateJob && !canEditJob && !canDeleteJob && (
                  <span className="text-amber-600">View only</span>
                )}
              </div>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowInfo((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-cyan-300 hover:text-cyan-600 hover:bg-cyan-50 transition-colors shadow-sm"
                title="Application information"
                aria-label="Application information"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </button>
              {showInfo && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowInfo(false)} aria-hidden />
                  <div className="absolute right-0 top-11 z-50 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{APP_INFO.fullName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Version {APP_INFO.version}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowInfo(false)}
                        className="text-slate-400 hover:text-slate-600 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">Platform</span>
                        <span className="font-medium text-slate-800">Enterprise ERP</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">Signed in</span>
                        <span className="font-medium text-slate-800">{user?.name}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">Role</span>
                        <span className="font-medium text-slate-800">{user?.role}</span>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 mt-2">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                          Development
                        </div>
                        <div className="text-xs font-semibold text-slate-800">{APP_INFO.author}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Tel: {APP_INFO.phone}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        <KpiCard label="Active Jobs" value={activeJobs.length} icon="▣" color="cyan" sub="In workflow" />
        <KpiCard label="Drilling" value={drillingJobs.length} icon="⬡" color="orange" sub="In progress" />
        <KpiCard label="Approvals" value={pendingApprovals.length} icon="⛨" color="amber" sub="Pending" />
        <KpiCard label="Scheduled" value={scheduledBlasts.length} icon="◷" color="purple" sub="Blasts" />
        <KpiCard label="Completed" value={completedBlasts.length} icon="✓" color="emerald" sub="Blasts done" />
        <KpiCard label="Invoices" value={outstandingInv.length} icon="◈" color="blue" sub="Outstanding" />
        <KpiCard label="Payments" value={pendingPay.length} icon="💰" color="red" sub="Pending" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Active Jobs"
            subtitle="Click a job to open full details"
            action={
              <button
                onClick={() => navigate('jobs')}
                className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
              >
                View all →
              </button>
            }
          />
          <div className="divide-y divide-slate-100">
            {recentJobs.map((job) => {
              const customer = getCustomer(job.customerId);
              return (
                <button
                  key={job.id}
                  onClick={() => navigate('job-detail', job.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{job.jobNo}</span>
                      <StatusBadge status={job.status} />
                      <PriorityBadge priority={job.priority} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {job.title} · {customer?.name}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <ProgressBar value={job.progress} className="flex-1" />
                      <span className="text-[10px] text-slate-500 font-medium w-8">{job.progress}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Alerts"
            subtitle={`${notifications.filter((n) => !n.read).length} unread`}
            action={
              <button
                onClick={() => navigate('notifications')}
                className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
              >
                All →
              </button>
            }
          />
          <div className="divide-y divide-slate-100">
            {unread.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-slate-400">No new alerts</div>
            )}
            {unread.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  markNotificationRead(n.id);
                  if (n.link) navigate(n.link as 'finance');
                }}
                className="flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
              >
                <span
                  className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                    n.type === 'error'
                      ? 'bg-red-500'
                      : n.type === 'warning'
                        ? 'bg-amber-500'
                        : n.type === 'success'
                          ? 'bg-emerald-500'
                          : 'bg-cyan-500'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900">{n.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{n.createdAt}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Drilling In Progress" subtitle="Live field execution" />
          <div className="p-4 space-y-3">
            {drillingProgress.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-4">No active drilling</div>
            )}
            {drillingProgress.map((d) => {
              const job = visibleJobs.find((j) => j.id === d.jobId);
              const pct = Math.round((d.completedHoles / d.plannedHoles) * 100);
              return (
                <div
                  key={d.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 cursor-pointer hover:border-cyan-300"
                  onClick={() => job && navigate('job-detail', job.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-900">{job?.jobNo}</span>
                    <Badge color="cyan">{d.completedHoles}/{d.plannedHoles} holes</Badge>
                  </div>
                  <ProgressBar value={pct} />
                  <div className="flex justify-between mt-1.5 text-[10px] text-slate-500">
                    <span>Depth: {d.actualDepth}m / {d.plannedDepth}m</span>
                    <span>Downtime: {d.downtimeHours}h</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Upcoming Blasts & Approvals" />
          <div className="p-4 space-y-3">
            {scheduledBlasts.map((s) => {
              const job = visibleJobs.find((j) => j.id === s.jobId);
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg border border-purple-100 bg-purple-50/50 p-3 cursor-pointer hover:border-purple-300"
                  onClick={() => job && navigate('job-detail', job.id)}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 text-lg">
                    ◷
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-900">{job?.jobNo}</div>
                    <div className="text-[11px] text-slate-500">
                      {s.blastDate} · {s.startTime}–{s.endTime}
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              );
            })}
            {pendingApprovals.slice(0, 4).map((a) => {
              const job = visibleJobs.find((j) => j.id === a.jobId);
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50/50 p-3 cursor-pointer hover:border-amber-300"
                  onClick={() => navigate('approvals')}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 text-lg">
                    ⛨
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-900">
                      {a.type} · {job?.jobNo}
                    </div>
                    <div className="text-[11px] text-slate-500">{a.referenceNo || 'No reference yet'}</div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
