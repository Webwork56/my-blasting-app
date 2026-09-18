import { useState } from 'react';
import { useApp } from '../store/AppContext';
import type { UserRole } from '../data/types';
import {
  PageHeader,
  Card,
  CardHeader,
  StatusBadge,
  DataTable,
  Badge,
  Button,
  KpiCard,
  ProgressBar,
  Modal,
  Input,
  Select,
} from '../components/ui';

export function ReportsPage() {
  const { blastReports, visibleJobs, visibleJobIds, getEmployee, navigate, isEngineer } = useApp();
  const myReports = blastReports.filter((r) => visibleJobIds.has(r.jobId));

  return (
    <div>
      <PageHeader
        title="Blast Reports"
        subtitle={
          isEngineer
            ? 'Reports for your assigned jobs only'
            : 'Results, vibration, incidents, and report approvals'
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Reports" value={myReports.length} icon="☰" color="fuchsia" />
        <KpiCard
          label="Approved"
          value={myReports.filter((r) => r.status === 'Approved').length}
          icon="✓"
          color="emerald"
        />
        <KpiCard
          label="Volume (m³)"
          value={myReports.reduce((a, r) => a + r.blastedVolume, 0).toLocaleString()}
          icon="▣"
          color="cyan"
        />
        <KpiCard
          label="Incidents"
          value={myReports.filter((r) => r.safetyIncident || r.misfire || r.flyRock).length}
          icon="!"
          color="red"
        />
      </div>
      <div className="space-y-3">
        {myReports.map((r) => {
          const job = visibleJobs.find((j) => j.id === r.jobId);
          const reporter = getEmployee(r.reportedBy);
          return (
            <Card key={r.id}>
              <div className="flex flex-col md:flex-row md:items-start gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <button
                      onClick={() => job && navigate('job-detail', job.id)}
                      className="text-sm font-bold text-cyan-700 hover:text-cyan-800"
                    >
                      {job?.jobNo}
                    </button>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="text-xs text-slate-600 mb-2">{r.result}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                    <MiniStat label="Holes" value={r.totalHoles} />
                    <MiniStat label="Material (kg)" value={r.materialQty} />
                    <MiniStat label="Volume (m³)" value={r.blastedVolume} />
                    <MiniStat label="Vibration" value={r.vibration} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge color={!r.flyRock ? 'emerald' : 'red'}>
                      {r.flyRock ? 'Fly Rock' : 'No Fly Rock'}
                    </Badge>
                    <Badge color={!r.misfire ? 'emerald' : 'red'}>
                      {r.misfire ? 'Misfire' : 'No Misfire'}
                    </Badge>
                    <Badge color={!r.safetyIncident ? 'emerald' : 'red'}>
                      {r.safetyIncident ? 'Incident' : 'No Incident'}
                    </Badge>
                    <Badge color="slate">Dust: {r.dust}</Badge>
                  </div>
                  {r.notes && <div className="text-[11px] text-slate-400 mt-2">{r.notes}</div>}
                </div>
                <div className="text-[11px] text-slate-500 shrink-0">
                  By {reporter?.name || r.reportedBy}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
      <div className="text-[9px] text-slate-400 uppercase">{label}</div>
      <div className="text-xs font-bold text-slate-900">{value}</div>
    </div>
  );
}

export function FinancePage() {
  const { invoices, payments, jobCosts, visibleJobs, visibleJobIds, getCustomer, navigate, isEngineer } = useApp();

  const myInvoices = invoices.filter((i) => visibleJobIds.has(i.jobId));
  const myInvoiceIds = new Set(myInvoices.map((i) => i.id));
  const myPayments = payments.filter((p) => myInvoiceIds.has(p.invoiceId));
  const myCosts = jobCosts.filter((c) => visibleJobIds.has(c.jobId));

  const totalInvoiced = myInvoices.reduce((a, i) => a + i.total, 0);
  const totalPaid = myPayments.reduce((a, p) => a + p.amount, 0);
  const totalCosts = myCosts.reduce((a, c) => a + c.amount, 0);
  const outstanding = totalInvoiced - totalPaid;

  const costsByCategory = myCosts.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + c.amount;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Job Costing & Finance"
        subtitle={
          isEngineer
            ? 'Finance for your assigned jobs only'
            : 'Costs, invoices, payments, and outstanding balances'
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label="Total Costs"
          value={`AED ${(totalCosts / 1000).toFixed(1)}k`}
          icon="◈"
          color="orange"
        />
        <KpiCard
          label="Invoiced"
          value={`AED ${(totalInvoiced / 1000).toFixed(1)}k`}
          icon="▤"
          color="cyan"
        />
        <KpiCard
          label="Received"
          value={`AED ${(totalPaid / 1000).toFixed(1)}k`}
          icon="✓"
          color="emerald"
        />
        <KpiCard
          label="Outstanding"
          value={`AED ${(outstanding / 1000).toFixed(1)}k`}
          icon="!"
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-1">
          <CardHeader title="Cost by Category" />
          <div className="p-4 space-y-2">
            {Object.entries(costsByCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => {
                const pct = Math.round((amt / totalCosts) * 100);
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">{cat}</span>
                      <span className="text-slate-900 font-semibold">AED {amt.toLocaleString()}</span>
                    </div>
                    <ProgressBar value={pct} />
                  </div>
                );
              })}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Invoices" />
          <DataTable
            headers={['Invoice', 'Job', 'Customer', 'Date', 'Due', 'Total', 'Status', '']}
          >
            {myInvoices.map((inv) => {
              const job = visibleJobs.find((j) => j.id === inv.jobId);
              const customer = getCustomer(inv.customerId);
              const paid = myPayments
                .filter((p) => p.invoiceId === inv.id)
                .reduce((s, p) => s + p.amount, 0);
              return (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-xs font-semibold text-cyan-700">{inv.invoiceNo}</td>
                  <td className="px-3 py-3 text-xs text-slate-900">{job?.jobNo}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{customer?.name}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{inv.date}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{inv.dueDate}</td>
                  <td className="px-3 py-3 text-xs font-bold text-slate-900">
                    AED {inv.total.toLocaleString()}
                    {paid > 0 && paid < inv.total && (
                      <div className="text-[10px] text-amber-600 font-normal">
                        Paid {paid.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-3 py-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => job && navigate('job-detail', job.id)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Payments Received" />
          <DataTable headers={['Invoice', 'Amount', 'Method', 'Reference', 'Date']}>
            {myPayments.map((p) => {
              const inv = myInvoices.find((i) => i.id === p.invoiceId);
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-xs font-semibold text-cyan-700">{inv?.invoiceNo}</td>
                  <td className="px-3 py-3 text-xs font-bold text-emerald-600">
                    AED {p.amount.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">{p.method}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{p.reference}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{p.date}</td>
                </tr>
              );
            })}
          </DataTable>
        </Card>

        <Card>
          <CardHeader title="Recent Job Costs" />
          <DataTable headers={['Job', 'Category', 'Description', 'Amount', 'Date']}>
            {myCosts.slice(0, 10).map((c) => {
              const job = visibleJobs.find((j) => j.id === c.jobId);
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-xs font-semibold text-cyan-700">{job?.jobNo}</td>
                  <td className="px-3 py-3">
                    <Badge color="slate">{c.category}</Badge>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500 max-w-[140px] truncate">
                    {c.description}
                  </td>
                  <td className="px-3 py-3 text-xs font-semibold text-slate-900">
                    AED {c.amount.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">{c.date}</td>
                </tr>
              );
            })}
          </DataTable>
        </Card>
      </div>
    </div>
  );
}

export function DocumentsPage() {
  const { documents, visibleJobs, visibleJobIds, navigate, isEngineer } = useApp();
  const myDocs = documents.filter((d) => !d.jobId || visibleJobIds.has(d.jobId));
  const categories = [...new Set(myDocs.map((d) => d.category))];

  return (
    <div>
      <PageHeader
        title="Document Management"
        subtitle={
          isEngineer
            ? 'Documents for your assigned jobs only'
            : 'Central repository with version control across the job lifecycle'
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
        {categories.map((cat) => (
          <div
            key={cat}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm"
          >
            <div className="text-lg font-bold text-slate-900">
              {myDocs.filter((d) => d.category === cat).length}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">{cat}</div>
          </div>
        ))}
      </div>
      <Card>
        <DataTable
          headers={['Document', 'Category', 'Job', 'Version', 'Size', 'Uploaded', 'By']}
        >
          {myDocs.map((d) => {
            const job = visibleJobs.find((j) => j.id === d.jobId);
            return (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-3 py-3 text-xs font-semibold text-slate-900">
                  <span className="mr-1.5 opacity-60">📄</span>
                  {d.name}
                </td>
                <td className="px-3 py-3">
                  <Badge color="cyan">{d.category}</Badge>
                </td>
                <td className="px-3 py-3 text-xs">
                  {job ? (
                    <button
                      onClick={() => navigate('job-detail', job.id)}
                      className="text-cyan-700 hover:text-cyan-800 font-semibold"
                    >
                      {job.jobNo}
                    </button>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-slate-600">v{d.version}</td>
                <td className="px-3 py-3 text-xs text-slate-500">{d.size}</td>
                <td className="px-3 py-3 text-xs text-slate-500">{d.uploadedAt}</td>
                <td className="px-3 py-3 text-xs text-slate-500">{d.uploadedBy}</td>
              </tr>
            );
          })}
        </DataTable>
      </Card>
    </div>
  );
}

export function EmployeesPage() {
  const {
    employees,
    canManageEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    user,
    navigate,
    isAdmin,
    hasPermission,
  } = useApp();

  const canViewEmployees = isAdmin || hasPermission('employees.view') || canManageEmployees;

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    shortCode: '',
    role: 'Engineer' as UserRole,
    department: '',
    phone: '',
    email: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const depts = [...new Set(employees.map((e) => e.department))];

  const resetForm = () =>
    setForm({
      name: '',
      shortCode: '',
      role: 'Engineer',
      department: '',
      phone: '',
      email: '',
      status: 'Active',
    });

  if (!canViewEmployees) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Access Denied</h2>
        <p className="text-sm text-slate-500 mb-4">You do not have employees.view permission.</p>
        <Button onClick={() => navigate('dashboard')}>Dashboard</Button>
      </div>
    );
  }

  const openAdd = () => {
    if (!canManageEmployees) return;
    resetForm();
    setShowAdd(true);
  };

  const openEdit = (id: string) => {
    if (!canManageEmployees) return;
    const emp = employees.find((e) => e.id === id);
    if (!emp) return;
    setForm({
      name: emp.name,
      shortCode: emp.shortCode,
      role: emp.role,
      department: emp.department,
      phone: emp.phone,
      email: emp.email,
      status: emp.status,
    });
    setEditId(id);
  };

  const handleAdd = () => {
    if (!canManageEmployees || !form.name.trim() || !form.email.trim()) return;
    addEmployee({
      name: form.name.trim(),
      shortCode: form.shortCode.trim().toUpperCase(),
      role: form.role,
      department: form.department.trim() || 'General',
      phone: form.phone.trim(),
      email: form.email.trim(),
      status: form.status,
    });
    setShowAdd(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!canManageEmployees || !editId || !form.name.trim()) return;
    updateEmployee(editId, {
      name: form.name.trim(),
      shortCode: form.shortCode.trim().toUpperCase() || undefined,
      role: form.role,
      department: form.department.trim() || 'General',
      phone: form.phone.trim(),
      email: form.email.trim(),
      status: form.status,
    });
    setEditId(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!canManageEmployees || !deleteId) return;
    const ok = deleteEmployee(deleteId);
    setDeleteId(null);
    if (!ok) {
      window.alert('Cannot remove this employee (maybe your own account).');
    }
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={
          canManageEmployees
            ? 'Add, edit, or remove staff (permission granted)'
            : 'Staff directory (view only) · Ask Admin for manage rights'
        }
        actions={
          canManageEmployees ? (
            <Button onClick={openAdd}>+ Add Employee</Button>
          ) : (
            <Badge color="amber">View only</Badge>
          )
        }
      />

      {!canManageEmployees && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <span className="font-semibold">Restricted:</span> You can view staff but cannot add or
          remove. Admin can grant <strong>employees.manage</strong> under User Permissions.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Total Staff" value={employees.length} icon="👤" color="blue" />
        <KpiCard
          label="Active"
          value={employees.filter((e) => e.status === 'Active').length}
          icon="✓"
          color="emerald"
        />
        <KpiCard label="Departments" value={depts.length} icon="▣" color="purple" />
        <KpiCard
          label="Engineers"
          value={employees.filter((e) => e.role === 'Engineer').length}
          icon="⬡"
          color="cyan"
        />
      </div>
      <Card>
        <DataTable
          headers={
            canManageEmployees
              ? ['Code', 'Short', 'Name', 'Role', 'Department', 'Phone', 'Email', 'Status', 'Actions']
              : ['Code', 'Short', 'Name', 'Role', 'Department', 'Phone', 'Email', 'Status']
          }
        >
            {employees.filter((e) => e && e.id).map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-3 py-3 text-xs font-semibold text-cyan-700">{e.code || 'EMP'}</td>
                <td className="px-3 py-3 text-xs font-bold text-slate-800">{e.shortCode || 'EMP'}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white">
                      {(e.name || 'U')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <span className="text-xs font-semibold text-slate-900">{e.name || 'Unnamed'}</span>
                  {user?.employeeId === e.id && (
                    <Badge color="cyan">You</Badge>
                  )}
                </div>
              </td>
              <td className="px-3 py-3">
                <Badge color="purple">{e.role}</Badge>
              </td>
              <td className="px-3 py-3 text-xs text-slate-600">{e.department}</td>
              <td className="px-3 py-3 text-xs text-slate-500">{e.phone}</td>
              <td className="px-3 py-3 text-xs text-slate-500">{e.email}</td>
              <td className="px-3 py-3">
                <StatusBadge status={e.status} />
              </td>
              {canManageEmployees && (
                <td className="px-3 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(e.id)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={user?.employeeId === e.id}
                      onClick={() => setDeleteId(e.id)}
                      title={user?.employeeId === e.id ? 'Cannot remove your own account' : 'Remove'}
                    >
                      Remove
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </DataTable>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Employee">
        <EmployeeForm form={form} setForm={setForm} />
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={() => setShowAdd(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Add Employee</Button>
        </div>
      </Modal>

      <Modal
        open={!!editId}
        onClose={() => {
          setEditId(null);
          resetForm();
        }}
        title="Edit Employee"
      >
        <EmployeeForm form={form} setForm={setForm} />
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="secondary"
            onClick={() => {
              setEditId(null);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleUpdate}>Save Changes</Button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Employee">
        <p className="text-sm text-slate-600 mb-4">
          Remove{' '}
          <span className="font-semibold">
            {employees.find((e) => e.id === deleteId)?.name}
          </span>{' '}
          from the system? They will no longer appear in assignments.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Keep
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function EmployeeForm({
  form,
  setForm,
}: {
  form: {
    name: string;
    shortCode: string;
    role: UserRole;
    department: string;
    phone: string;
    email: string;
    status: 'Active' | 'Inactive';
  };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
}) {
  const roles: UserRole[] = [
    'User',
    'Engineer',
    'Supervisor',
    'Operator',
    'Finance',
    'PRO',
    'Viewer',
  ];
  return (
    <div className="space-y-3">
      <Input
        label="Full Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="e.g. Eng. Hashmai"
      />
      <Input
        label="Job ID Short Code"
        value={form.shortCode}
        onChange={(e) =>
          setForm({
            ...form,
            shortCode: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6),
          })
        }
        placeholder="e.g. HASH (used in WE_HASH_0000)"
      />
      <p className="text-[11px] text-slate-500 -mt-1">
        Job cards: <span className="font-mono font-semibold text-slate-700">CUST_{form.shortCode || 'XXXX'}_0000</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <Input
          label="Department"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          placeholder="e.g. Engineering"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <Select
        label="Status"
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}
      >
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </Select>
    </div>
  );
}

export function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead, navigate } = useApp();

  const typeColor = {
    info: 'border-cyan-200 bg-cyan-50/50',
    warning: 'border-amber-200 bg-amber-50/50',
    success: 'border-emerald-200 bg-emerald-50/50',
    error: 'border-red-200 bg-red-50/50',
  };

  const typeDot = {
    info: 'bg-cyan-500',
    warning: 'bg-amber-500',
    success: 'bg-emerald-500',
    error: 'bg-red-500',
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="System alerts, workflow updates, and action items"
        actions={
          <Button variant="secondary" size="sm" onClick={markAllNotificationsRead}>
            Mark all read
          </Button>
        }
      />
      <div className="space-y-2 max-w-3xl">
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => {
              markNotificationRead(n.id);
              if (n.link) navigate(n.link as 'finance');
            }}
            className={`flex w-full gap-3 rounded-xl border p-4 text-left transition-colors hover:border-cyan-300 bg-white ${
              typeColor[n.type]
            } ${n.read ? 'opacity-60' : ''}`}
          >
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${typeDot[n.type]}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{n.title}</span>
                {!n.read && <Badge color="cyan">New</Badge>}
              </div>
              <div className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</div>
              <div className="text-[10px] text-slate-400 mt-1.5">{n.createdAt}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
