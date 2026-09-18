import { useState } from 'react';
import { useApp } from '../store/AppContext';
import type { Job, JobStatus, Priority } from '../data/types';
import {
  PageHeader, Card, CardHeader, Button, Input, Select, Textarea, Modal,
  StatusBadge, PriorityBadge, ProgressBar, DataTable, Badge, WorkflowTracker,
} from '../components/ui';

const ALL_STATUSES: JobStatus[] = [
  'Draft',
  'Order Received',
  'Area Assigned',
  'Survey',
  'Drilling Design',
  'Resource Assigned',
  'Drilling',
  'Hole Check',
  'Blasting Design',
  'Final Check',
  'Procurement',
  'Supplier Confirmed',
  'Admin Verification',
  'PRO Submission',
  'Police Approval',
  'Blast Scheduled',
  'Blasting',
  'Blast Completed',
  'Report',
  'Invoice',
  'Payment',
  'Closed',
  'Cancelled',
];

export function JobsPage() {
  const {
    visibleJobs,
    customers,
    sites,
    employees,
    navigate,
    addJob,
    updateJob,
    deleteJob,
    getCustomer,
    getSite,
    getEmployee,
    isEngineer,
    user,
    canCreateJob,
    canEditJob,
    canDeleteJob,
    canManageJobs,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const emptyForm = {
    customerId: '',
    siteId: '',
    title: '',
    description: '',
    priority: 'Normal' as Priority,
    engineerId: '',
    requestedDate: '',
    status: 'Order Received' as JobStatus,
    progress: 5,
    startDate: '',
  };

  const [form, setForm] = useState(emptyForm);

  const filtered = visibleJobs.filter((j) => {
    const q = search.toLowerCase();
    const customer = getCustomer(j.customerId);
    const matchQ =
      !q ||
      j.jobNo.toLowerCase().includes(q) ||
      j.title.toLowerCase().includes(q) ||
      (customer?.name.toLowerCase().includes(q) ?? false);
    const matchS = statusFilter === 'all' || j.status === statusFilter;
    return matchQ && matchS;
  });

  const statuses = [...new Set(visibleJobs.map((j) => j.status))];
  const customerSites = sites.filter((s) => s.customerId === form.customerId);
  const engineers = employees.filter((e) => e.role === 'Engineer' || e.role === 'Admin');

  const openCreate = () => {
    if (!canCreateJob) return;
    setForm({
      ...emptyForm,
      engineerId: isEngineer && user ? user.employeeId : '',
    });
    setShowCreate(true);
  };

  const openEdit = (job: Job, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!canEditJob) return;
    setForm({
      customerId: job.customerId,
      siteId: job.siteId,
      title: job.title,
      description: job.description,
      priority: job.priority,
      engineerId: job.engineerId,
      requestedDate: job.requestedDate,
      status: job.status,
      progress: job.progress,
      startDate: job.startDate || '',
    });
    setEditJob(job);
  };

  const handleCreate = () => {
    if (!canCreateJob) return;
    const engineerId =
      form.engineerId ||
      (isEngineer && user ? user.employeeId : '') ||
      '';
    if (!form.customerId || !form.siteId || !form.title || !engineerId || !form.requestedDate) {
      return;
    }
    const ok = addJob({
      customerId: form.customerId,
      siteId: form.siteId,
      title: form.title,
      description: form.description,
      priority: form.priority,
      status: form.status || 'Order Received',
      engineerId,
      requestedDate: form.requestedDate,
      startDate: form.startDate || undefined,
    });
    if (ok) {
      setShowCreate(false);
      setForm(emptyForm);
    }
  };

  const handleUpdate = () => {
    if (!canEditJob || !editJob) return;
    if (!form.customerId || !form.siteId || !form.title || !form.engineerId || !form.requestedDate)
      return;
    // progress is calculated automatically from status in the store
    const ok = updateJob(editJob.id, {
      customerId: form.customerId,
      siteId: form.siteId,
      title: form.title,
      description: form.description,
      priority: form.priority,
      engineerId: form.engineerId,
      requestedDate: form.requestedDate,
      status: form.status,
      startDate: form.startDate || undefined,
    });
    if (ok) {
      setEditJob(null);
      setForm(emptyForm);
    } else {
      window.alert('You do not have permission to edit jobs.');
    }
  };

  const handleDelete = (id: string) => {
    if (!canDeleteJob) return;
    const ok = deleteJob(id);
    if (ok) setDeleteConfirmId(null);
    else window.alert('You do not have permission to delete jobs.');
  };

  return (
    <div>
      <PageHeader
        title={isEngineer ? 'My Jobs' : 'Jobs & Orders'}
        subtitle={
          isEngineer
            ? `Jobs assigned to you (${visibleJobs.length}) · ${user?.name}`
            : canManageJobs
              ? 'Your account permissions control create, edit, and delete'
              : 'View only · Ask Admin to grant create / edit / delete rights'
        }
        actions={
          canCreateJob ? (
            <Button onClick={openCreate}>+ New Job</Button>
          ) : (
            <Badge color="amber">No create right</Badge>
          )
        }
      />

      {!canManageJobs && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <span className="font-semibold">Restricted:</span> Your login does not have job write
          rights. Admin can grant Create, Edit, or Delete under <strong>User Permissions</strong>.
        </div>
      )}

      <Card className="mb-4 p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs, customers…"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
          >
            <option value="all">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card>
        <DataTable
          headers={
            canEditJob || canDeleteJob
              ? ['Job No', 'Title', 'Customer', 'Site', 'Engineer', 'Priority', 'Status', 'Progress', 'Actions']
              : ['Job No', 'Title', 'Customer', 'Site', 'Engineer', 'Priority', 'Status', 'Progress', '']
          }
        >
          {filtered.map((job) => {
            const customer = getCustomer(job.customerId);
            const site = getSite(job.siteId);
            const engineer = getEmployee(job.engineerId);
            return (
              <tr
                key={job.id}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => navigate('job-detail', job.id)}
              >
                <td className="px-3 py-3 text-xs font-semibold text-cyan-700 whitespace-nowrap">
                  {job.jobNo}
                </td>
                <td className="px-3 py-3 text-xs text-slate-900 max-w-[180px] truncate">{job.title}</td>
                <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{customer?.name}</td>
                <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{site?.name}</td>
                <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{engineer?.name}</td>
                <td className="px-3 py-3">
                  <PriorityBadge priority={job.priority} />
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={job.status} />
                </td>
                <td className="px-3 py-3 min-w-[100px]">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={job.progress} className="flex-1" />
                    <span className="text-[10px] text-slate-500 w-7">{job.progress}%</span>
                  </div>
                </td>
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  {canEditJob || canDeleteJob ? (
                    <div className="flex gap-1">
                      {canEditJob && (
                        <Button size="sm" variant="secondary" onClick={(e) => openEdit(job, e)}>
                          Edit
                        </Button>
                      )}
                      {canDeleteJob && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(job.id);
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Badge color="cyan">View</Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </DataTable>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">No jobs match your filters</div>
        )}
      </Card>

      {/* Create */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Job / Order" wide>
        <div className="mb-3 rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-cyan-900">
          <span className="font-semibold">Job ID format:</span>{' '}
          <span className="font-mono font-bold">
            {customers.find((c) => c.id === form.customerId)?.shortCode || 'CUST'}_
            {isEngineer && user
              ? employees.find((e) => e.id === user.employeeId)?.shortCode || 'ENG'
              : employees.find((e) => e.id === form.engineerId)?.shortCode || 'ENG'}
            _0000
          </span>
          <span className="text-cyan-700"> (auto sequence per customer + engineer)</span>
        </div>
        <JobFormFields
          form={form}
          setForm={setForm}
          customers={customers}
          customerSites={customerSites}
          engineers={engineers}
          includeStatus={!!canEditJob}
          lockEngineer={isEngineer}
          lockedEngineerName={user?.name}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={() => setShowCreate(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create Job</Button>
        </div>
      </Modal>

      {/* Edit */}
      <Modal
        open={!!editJob}
        onClose={() => {
          setEditJob(null);
          setForm(emptyForm);
        }}
        title={`Edit Job · ${editJob?.jobNo || ''}`}
        wide
      >
        <JobFormFields
          form={form}
          setForm={setForm}
          customers={customers}
          customerSites={sites.filter((s) => s.customerId === form.customerId)}
          engineers={engineers}
          includeStatus
          includeProgress
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="secondary"
            onClick={() => {
              setEditJob(null);
              setForm(emptyForm);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleUpdate}>Save Changes</Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Job"
      >
        <p className="text-sm text-slate-600 mb-4">
          Are you sure you want to permanently delete{' '}
          <span className="font-semibold text-slate-900">
            {visibleJobs.find((j) => j.id === deleteConfirmId)?.jobNo}
          </span>
          ? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
            Keep Job
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
          >
            Delete Permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function JobFormFields({
  form,
  setForm,
  customers,
  customerSites,
  engineers,
  includeStatus,
  includeProgress,
  lockEngineer,
  lockedEngineerName,
}: {
  form: {
    customerId: string;
    siteId: string;
    title: string;
    description: string;
    priority: Priority;
    engineerId: string;
    requestedDate: string;
    status: JobStatus;
    progress: number;
    startDate: string;
  };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  customers: { id: string; code: string; name: string; status: string }[];
  customerSites: { id: string; name: string; location: string }[];
  engineers: { id: string; name: string; department: string }[];
  includeStatus?: boolean;
  includeProgress?: boolean;
  lockEngineer?: boolean;
  lockedEngineerName?: string;
}) {
  return (
    <div className="space-y-3">
      <Select
        label="Customer"
        value={form.customerId}
        onChange={(e) => setForm({ ...form, customerId: e.target.value, siteId: '' })}
      >
        <option value="">Select customer…</option>
        {customers
          .filter((c) => c.status === 'Active')
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.name}
            </option>
          ))}
      </Select>
      <Select
        label="Site"
        value={form.siteId}
        onChange={(e) => setForm({ ...form, siteId: e.target.value })}
      >
        <option value="">Select site…</option>
        {customerSites.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} — {s.location}
          </option>
        ))}
      </Select>
      <Input
        label="Job Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="e.g. Block A Phase 4 Blasting"
      />
      <Textarea
        label="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Job scope and requirements…"
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Priority"
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
        >
          {(['Low', 'Normal', 'High', 'Urgent'] as Priority[]).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Input
          label="Requested Date"
          type="date"
          value={form.requestedDate}
          onChange={(e) => setForm({ ...form, requestedDate: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {lockEngineer ? (
          <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2">
            <div className="text-[10px] font-medium text-slate-500">Assigned Engineer</div>
            <div className="text-sm font-semibold text-cyan-800">{lockedEngineerName || 'You'}</div>
          </div>
        ) : (
          <Select
            label="Assign Engineer"
            value={form.engineerId}
            onChange={(e) => setForm({ ...form, engineerId: e.target.value })}
          >
            <option value="">Select engineer…</option>
            {engineers.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} — {e.department}
              </option>
            ))}
          </Select>
        )}
        <Input
          label="Start Date"
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
        />
      </div>
      {includeStatus && (
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as JobStatus })}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      )}
      {includeProgress && (
        <div className="rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-cyan-900">
          <span className="font-semibold">Progress % is automatic.</span> It increases when Status
          moves to the next workflow step (Order → Survey → … → Closed = 100%).
        </div>
      )}
    </div>
  );
}

export function JobDetailPage() {
  const {
    selectedJobId,
    getJob,
    getCustomer,
    getSite,
    getEmployee,
    navigate,
    surveys,
    drillingDesigns,
    drillingExecutions,
    holeChecks,
    blastingDesigns,
    lpos,
    finalChecks,
    approvals,
    blastSchedules,
    blastExecutions,
    blastReports,
    jobCosts,
    invoices,
    documents,
    updateJobStatus,
    updateJob,
    deleteJob,
    machines,
    crews,
    canAccessJob,
    isEngineer,
    canCreateJob,
    canEditJob,
    canDeleteJob,
    customers,
    sites,
    employees,
  } = useApp();

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState({
    customerId: '',
    siteId: '',
    title: '',
    description: '',
    priority: 'Normal' as Priority,
    engineerId: '',
    requestedDate: '',
    status: 'Order Received' as JobStatus,
    progress: 5,
    startDate: '',
  });

  const job = selectedJobId ? getJob(selectedJobId) : null;
  if (!job || (selectedJobId && !canAccessJob(selectedJobId))) {
    return (
      <div className="text-center py-20">
        <div className="text-slate-500 mb-2">
          {!job ? 'Job not found' : 'Access denied — this job is not assigned to you'}
        </div>
        {isEngineer && job && (
          <p className="text-xs text-slate-400 mb-4">
            Engineers can only open jobs where they are the assigned engineer.
          </p>
        )}
        <Button onClick={() => navigate('jobs')}>Back to Jobs</Button>
      </div>
    );
  }

  const customer = getCustomer(job.customerId);
  const site = getSite(job.siteId);
  const engineer = getEmployee(job.engineerId);

  const jobSurveys = surveys.filter((s) => s.jobId === job.id);
  const jobDesigns = drillingDesigns.filter((d) => d.jobId === job.id);
  const jobDrilling = drillingExecutions.filter((d) => d.jobId === job.id);
  const jobHoles = holeChecks.filter((h) => h.jobId === job.id);
  const jobBlastDesigns = blastingDesigns.filter((b) => b.jobId === job.id);
  const jobLpos = lpos.filter((l) => l.jobId === job.id);
  const jobFinal = finalChecks.filter((f) => f.jobId === job.id);
  const jobApprovals = approvals.filter((a) => a.jobId === job.id);
  const jobSchedules = blastSchedules.filter((s) => s.jobId === job.id);
  const jobBlasts = blastExecutions.filter((b) => b.jobId === job.id);
  const jobReports = blastReports.filter((r) => r.jobId === job.id);
  const jobCostList = jobCosts.filter((c) => c.jobId === job.id);
  const jobInvoices = invoices.filter((i) => i.jobId === job.id);
  const jobDocs = documents.filter((d) => d.jobId === job.id);
  const totalCost = jobCostList.reduce((s, c) => s + c.amount, 0);

  const engineers = employees.filter((e) => e.role === 'Engineer' || e.role === 'Admin');

  const openEdit = () => {
    if (!canEditJob) return;
    setForm({
      customerId: job.customerId,
      siteId: job.siteId,
      title: job.title,
      description: job.description,
      priority: job.priority,
      engineerId: job.engineerId,
      requestedDate: job.requestedDate,
      status: job.status,
      progress: job.progress,
      startDate: job.startDate || '',
    });
    setShowEdit(true);
  };

  const saveEdit = () => {
    if (!canEditJob) return;
    // progress auto-updates from status in the store
    updateJob(job.id, {
      customerId: form.customerId,
      siteId: form.siteId,
      title: form.title,
      description: form.description,
      priority: form.priority,
      engineerId: form.engineerId,
      requestedDate: form.requestedDate,
      status: form.status,
      startDate: form.startDate || undefined,
    });
    setShowEdit(false);
  };

  const confirmDelete = () => {
    if (!canDeleteJob) return;
    const ok = deleteJob(job.id);
    if (ok) {
      setShowDelete(false);
      navigate('jobs');
    }
  };

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => navigate('jobs')}
          className="text-xs text-cyan-600 hover:text-cyan-700 font-medium mb-3"
        >
          ← Back to Jobs
        </button>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-slate-900">{job.jobNo}</h1>
              <StatusBadge status={job.status} />
              <PriorityBadge priority={job.priority} />
            </div>
            <p className="text-sm text-slate-700">{job.title}</p>
            <p className="text-xs text-slate-500 mt-1">{job.description}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canEditJob || canDeleteJob || canCreateJob ? (
              <>
                {canEditJob && (
                  <Button variant="secondary" size="sm" onClick={openEdit}>
                    Edit Job
                  </Button>
                )}
                {canEditJob && job.status !== 'Closed' && job.status !== 'Cancelled' && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => updateJobStatus(job.id, 'Closed', 100)}
                    >
                      Close Job
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateJobStatus(job.id, 'Cancelled')}
                    >
                      Cancel Job
                    </Button>
                  </>
                )}
                {canDeleteJob && (
                  <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
                    Delete
                  </Button>
                )}
              </>
            ) : (
              <Badge color="amber">View only · No modify rights on this account</Badge>
            )}
          </div>
        </div>
      </div>

      <Card className="p-4 mb-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Workflow Progress
        </div>
        <WorkflowTracker status={job.status} />
        <div className="mt-3 flex items-center gap-2">
          <ProgressBar value={job.progress} className="flex-1" />
          <span className="text-xs text-slate-500 font-semibold">{job.progress}%</span>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400">
          Progress updates automatically when the job moves to the next workflow step.
        </p>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <InfoTile label="Customer" value={customer?.name || '—'} sub={customer?.code} />
        <InfoTile label="Site" value={site?.name || '—'} sub={site?.location} />
        <InfoTile label="Engineer" value={engineer?.name || '—'} sub={engineer?.department} />
        <InfoTile
          label="Requested"
          value={job.requestedDate}
          sub={job.startDate ? `Started ${job.startDate}` : 'Not started'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Area & Survey" count={jobSurveys.length}>
          {jobSurveys.length === 0 && <Empty text="No surveys yet" />}
          {jobSurveys.map((s) => (
            <Row key={s.id}>
              <div>
                <div className="text-xs font-semibold text-slate-900">{s.areaName}</div>
                <div className="text-[11px] text-slate-500">
                  {s.plannedDate} · {s.gpsPoints} GPS points
                </div>
                {s.result && <div className="text-[11px] text-slate-400 mt-0.5">{s.result}</div>}
              </div>
              <StatusBadge status={s.status} />
            </Row>
          ))}
        </Section>

        <Section title="Drilling Design" count={jobDesigns.length}>
          {jobDesigns.length === 0 && <Empty text="No designs yet" />}
          {jobDesigns.map((d) => (
            <Row key={d.id}>
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  {d.numberOfHoles} holes · Ø{d.holeDiameter}mm · {d.holeDepth}m
                </div>
                <div className="text-[11px] text-slate-500">
                  Burden {d.burden}m · Spacing {d.spacing}m · {d.pattern}
                </div>
              </div>
              <StatusBadge status={d.status} />
            </Row>
          ))}
        </Section>

        <Section title="Drilling Execution" count={jobDrilling.length}>
          {jobDrilling.length === 0 && <Empty text="No drilling records" />}
          {jobDrilling.map((d) => {
            const machine = machines.find((m) => m.id === d.machineId);
            const crew = crews.find((c) => c.id === d.crewId);
            const pct = Math.round((d.completedHoles / d.plannedHoles) * 100);
            return (
              <Row key={d.id}>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-900">
                    {machine?.name} · {crew?.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-1.5">
                    {d.completedHoles}/{d.plannedHoles} holes · Depth {d.actualDepth}/
                    {d.plannedDepth}m
                  </div>
                  <ProgressBar value={pct} />
                </div>
                <StatusBadge status={d.status} />
              </Row>
            );
          })}
        </Section>

        <Section title="Hole Check / Verification" count={jobHoles.length}>
          {jobHoles.length === 0 && <Empty text="No hole checks" />}
          {jobHoles.map((h) => (
            <Row key={h.id}>
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  {h.inspectedHoles}/{h.totalHoles} inspected
                </div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <CheckOk ok={h.depthOk} label="Depth" />
                  <CheckOk ok={h.diameterOk} label="Diameter" />
                  <CheckOk ok={h.spacingOk} label="Spacing" />
                </div>
              </div>
              <StatusBadge status={h.status} />
            </Row>
          ))}
        </Section>

        <Section title="Blasting Design" count={jobBlastDesigns.length}>
          {jobBlastDesigns.length === 0 && <Empty text="No blast designs" />}
          {jobBlastDesigns.map((b) => (
            <Row key={b.id}>
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  {b.totalHoles} holes · {b.plannedQuantity} kg {b.materialType}
                </div>
                <div className="text-[11px] text-slate-500">
                  {b.initiationSystem} · {b.delayPattern}
                </div>
              </div>
              <StatusBadge status={b.status} />
            </Row>
          ))}
        </Section>

        <Section title="Procurement (LPO)" count={jobLpos.length}>
          {jobLpos.length === 0 && <Empty text="No LPOs" />}
          {jobLpos.map((l) => (
            <Row key={l.id}>
              <div>
                <div className="text-xs font-semibold text-slate-900">{l.lpoNo}</div>
                <div className="text-[11px] text-slate-500">
                  AED {l.totalAmount.toLocaleString()} · {l.date}
                </div>
              </div>
              <StatusBadge status={l.status} />
            </Row>
          ))}
        </Section>

        <Section title="Final Technical Check" count={jobFinal.length}>
          {jobFinal.length === 0 && <Empty text="No final check" />}
          {jobFinal.map((f) => (
            <div key={f.id} className="px-4 py-3 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-900">Technical Checklist</span>
                <StatusBadge status={f.status} />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <CheckOk ok={f.drillingDesignOk} label="Drilling Design" />
                <CheckOk ok={f.holeCheckingOk} label="Hole Checking" />
                <CheckOk ok={f.blastingDesignOk} label="Blasting Design" />
                <CheckOk ok={f.procurementOk} label="Procurement" />
                <CheckOk ok={f.documentsOk} label="Documents" />
              </div>
              {f.remarks && <div className="text-[11px] text-slate-500">{f.remarks}</div>}
            </div>
          ))}
        </Section>

        <Section title="Regulatory Approvals" count={jobApprovals.length}>
          {jobApprovals.length === 0 && <Empty text="No approvals" />}
          {jobApprovals.map((a) => (
            <Row key={a.id}>
              <div>
                <div className="text-xs font-semibold text-slate-900">{a.type}</div>
                <div className="text-[11px] text-slate-500">
                  {a.referenceNo || '—'}
                  {a.expiryDate ? ` · Exp ${a.expiryDate}` : ''}
                </div>
              </div>
              <StatusBadge status={a.status} />
            </Row>
          ))}
        </Section>

        <Section title="Blast Schedule & Execution" count={jobSchedules.length + jobBlasts.length}>
          {jobSchedules.map((s) => (
            <Row key={s.id}>
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  {s.blastDate} · {s.startTime}–{s.endTime}
                </div>
                <div className="text-[11px] text-slate-500">
                  Crew manpower: {s.manpower} · {s.equipment}
                </div>
              </div>
              <StatusBadge status={s.status} />
            </Row>
          ))}
          {jobBlasts.map((b) => (
            <Row key={b.id}>
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Executed · {b.actualQuantity} kg · {b.weather}
                </div>
                <div className="text-[11px] text-slate-500">
                  {b.blastStart} → {b.blastEnd}
                </div>
              </div>
              <StatusBadge status={b.status} />
            </Row>
          ))}
          {jobSchedules.length === 0 && jobBlasts.length === 0 && <Empty text="Not scheduled" />}
        </Section>

        <Section title="Blast Report" count={jobReports.length}>
          {jobReports.length === 0 && <Empty text="No reports" />}
          {jobReports.map((r) => (
            <Row key={r.id}>
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  {r.blastedVolume} m³ · {r.materialQty} kg · {r.result}
                </div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <CheckOk ok={!r.flyRock} label="No Fly Rock" />
                  <CheckOk ok={!r.misfire} label="No Misfire" />
                  <CheckOk ok={!r.safetyIncident} label="No Incident" />
                  <Badge color="slate">{r.vibration}</Badge>
                </div>
              </div>
              <StatusBadge status={r.status} />
            </Row>
          ))}
        </Section>

        <Section title={`Job Costing · AED ${totalCost.toLocaleString()}`} count={jobCostList.length}>
          {jobCostList.length === 0 && <Empty text="No costs recorded" />}
          {jobCostList.map((c) => (
            <Row key={c.id}>
              <div>
                <div className="text-xs font-semibold text-slate-900">{c.category}</div>
                <div className="text-[11px] text-slate-500">{c.description}</div>
              </div>
              <span className="text-xs font-bold text-emerald-600">
                AED {c.amount.toLocaleString()}
              </span>
            </Row>
          ))}
        </Section>

        <Section title="Invoices" count={jobInvoices.length}>
          {jobInvoices.length === 0 && <Empty text="No invoices" />}
          {jobInvoices.map((i) => (
            <Row key={i.id}>
              <div>
                <div className="text-xs font-semibold text-slate-900">{i.invoiceNo}</div>
                <div className="text-[11px] text-slate-500">
                  Due {i.dueDate} · VAT {i.vat.toLocaleString()}
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-xs font-bold text-slate-900">AED {i.total.toLocaleString()}</div>
                <StatusBadge status={i.status} />
              </div>
            </Row>
          ))}
        </Section>

        <Section title="Documents" count={jobDocs.length}>
          {jobDocs.length === 0 && <Empty text="No documents" />}
          {jobDocs.map((d) => (
            <Row key={d.id}>
              <div>
                <div className="text-xs font-semibold text-slate-900">{d.name}</div>
                <div className="text-[11px] text-slate-500">
                  {d.category} · v{d.version} · {d.size}
                </div>
              </div>
              <Badge color="slate">{d.uploadedAt}</Badge>
            </Row>
          ))}
        </Section>
      </div>

      {/* Admin edit modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title={`Edit Job · ${job.jobNo}`} wide>
        <JobFormFields
          form={form}
          setForm={setForm}
          customers={customers}
          customerSites={sites.filter((s) => s.customerId === form.customerId)}
          engineers={engineers}
          includeStatus
          includeProgress
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={() => setShowEdit(false)}>
            Cancel
          </Button>
          <Button onClick={saveEdit}>Save Changes</Button>
        </div>
      </Modal>

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Job">
        <p className="text-sm text-slate-600 mb-4">
          Permanently delete <span className="font-semibold">{job.jobNo}</span>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowDelete(false)}>
            Keep Job
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete Permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function InfoTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-3">
      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{value}</div>
      {sub && <div className="text-[11px] text-slate-500 truncate">{sub}</div>}
    </Card>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} action={<Badge color="slate">{count}</Badge>} />
      <div className="divide-y divide-slate-100">{children}</div>
    </Card>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-3 px-4 py-3">{children}</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="px-4 py-6 text-center text-xs text-slate-400">{text}</div>;
}

function CheckOk({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border ${
        ok
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-red-50 text-red-700 border-red-200'
      }`}
    >
      {ok ? '✓' : '✗'} {label}
    </span>
  );
}
