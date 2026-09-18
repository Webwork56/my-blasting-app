import { useState } from 'react';
import { useApp } from '../store/AppContext';
import {
  PageHeader, Card, CardHeader, Button, Input, Select, Modal, StatusBadge,
  DataTable, Badge, KpiCard,
} from '../components/ui';

export function ProcurementPage() {
  const { lpos, suppliers, materials, visibleJobs, visibleJobIds, supplierConfirmations, addLpo, navigate, isEngineer } = useApp();
  const myLpos = lpos.filter((l) => visibleJobIds.has(l.jobId));
  const myConfirms = supplierConfirmations.filter((sc) => {
    const lpo = lpos.find((l) => l.id === sc.lpoId);
    return lpo ? visibleJobIds.has(lpo.jobId) : false;
  });
  const [tab, setTab] = useState<'lpo' | 'materials' | 'suppliers' | 'confirm'>('lpo');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    jobId: '',
    supplierId: '',
    materialId: '',
    qty: '',
    notes: '',
  });

  const handleCreate = () => {
    const mat = materials.find((m) => m.id === form.materialId);
    if (!form.jobId || !form.supplierId || !mat || !form.qty) return;
    const qty = Number(form.qty);
    addLpo({
      jobId: form.jobId,
      supplierId: form.supplierId,
      date: new Date().toISOString().slice(0, 10),
      status: 'Draft',
      totalAmount: qty * mat.unitCost,
      items: [{ materialId: mat.id, qty, unitPrice: mat.unitCost }],
      notes: form.notes,
    });
    setShowCreate(false);
    setForm({ jobId: '', supplierId: '', materialId: '', qty: '', notes: '' });
  };

  return (
    <div>
      <PageHeader
        title="Procurement & Materials"
        subtitle={
          isEngineer
            ? 'Procurement for your assigned jobs only'
            : 'Material master, LPO, suppliers, and confirmations'
        }
        actions={<Button onClick={() => setShowCreate(true)}>+ Create LPO</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="LPOs" value={myLpos.length} icon="▤" color="amber" />
        <KpiCard label="Suppliers" value={suppliers.length} icon="◎" color="cyan" />
        <KpiCard label="Materials" value={materials.length} icon="⬡" color="blue" />
        <KpiCard
          label="Pending Confirm"
          value={myConfirms.filter((s) => s.status === 'Pending').length}
          icon="…"
          color="orange"
        />
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {(
          [
            ['lpo', 'LPOs'],
            ['materials', 'Materials'],
            ['suppliers', 'Suppliers'],
            ['confirm', 'Confirmations'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
              tab === id
                ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'lpo' && (
        <Card>
          <DataTable
            headers={['LPO No', 'Job', 'Supplier', 'Date', 'Amount', 'Items', 'Status', '']}
          >
            {myLpos.map((l) => {
              const job = visibleJobs.find((j) => j.id === l.jobId);
              const sup = suppliers.find((s) => s.id === l.supplierId);
              return (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-xs font-semibold text-cyan-700">{l.lpoNo}</td>
                  <td className="px-3 py-3 text-xs text-slate-900">{job?.jobNo}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{sup?.name}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{l.date}</td>
                  <td className="px-3 py-3 text-xs font-semibold text-slate-900">
                    AED {l.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">{l.items.length}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={l.status} />
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
      )}

      {tab === 'materials' && (
        <Card>
          <DataTable headers={['Code', 'Material', 'Category', 'Unit', 'Stock', 'Unit Cost']}>
            {materials.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-3 py-3 text-xs font-semibold text-cyan-700">{m.code}</td>
                <td className="px-3 py-3 text-xs text-slate-900">{m.name}</td>
                <td className="px-3 py-3">
                  <Badge color={m.category === 'Explosive' ? 'red' : 'purple'}>{m.category}</Badge>
                </td>
                <td className="px-3 py-3 text-xs text-slate-500">{m.unit}</td>
                <td className="px-3 py-3 text-xs font-semibold text-slate-900">
                  {m.stockQty.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-xs text-slate-600">AED {m.unitCost.toFixed(2)}</td>
              </tr>
            ))}
          </DataTable>
        </Card>
      )}

      {tab === 'suppliers' && (
        <Card>
          <DataTable headers={['Code', 'Supplier', 'Contact', 'Phone', 'Materials', 'Status']}>
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-3 py-3 text-xs font-semibold text-cyan-700">{s.code}</td>
                <td className="px-3 py-3 text-xs text-slate-900 font-medium">{s.name}</td>
                <td className="px-3 py-3 text-xs text-slate-600">{s.contact}</td>
                <td className="px-3 py-3 text-xs text-slate-500">{s.phone}</td>
                <td className="px-3 py-3 text-xs text-slate-500 max-w-[180px] truncate">
                  {s.materials}
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>
      )}

      {tab === 'confirm' && (
        <Card>
          <DataTable headers={['LPO', 'Confirmed Qty', 'Expected Delivery', 'Status', 'Notes']}>
            {myConfirms.map((sc) => {
              const lpo = lpos.find((l) => l.id === sc.lpoId);
              return (
                <tr key={sc.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-xs font-semibold text-cyan-700">{lpo?.lpoNo}</td>
                  <td className="px-3 py-3 text-xs text-slate-900">{sc.confirmedQty || '—'}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">
                    {sc.expectedDelivery || '—'}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={sc.status} />
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">{sc.notes}</td>
                </tr>
              );
            })}
          </DataTable>
        </Card>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create LPO">
        <div className="space-y-3">
          <Select
            label="Job"
            value={form.jobId}
            onChange={(e) => setForm({ ...form, jobId: e.target.value })}
          >
            <option value="">Select job…</option>
            {visibleJobs
              .filter((j) => !['Closed', 'Cancelled'].includes(j.status))
              .map((j) => (
                <option key={j.id} value={j.id}>
                  {j.jobNo} — {j.title}
                </option>
              ))}
          </Select>
          <Select
            label="Supplier"
            value={form.supplierId}
            onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
          >
            <option value="">Select supplier…</option>
            {suppliers
              .filter((s) => s.status === 'Active')
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </Select>
          <Select
            label="Material"
            value={form.materialId}
            onChange={(e) => setForm({ ...form, materialId: e.target.value })}
          >
            <option value="">Select material…</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — AED {m.unitCost}/{m.unit}
              </option>
            ))}
          </Select>
          <Input
            label="Quantity"
            type="number"
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
          />
          <Input
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create LPO</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function FinalCheckPage() {
  const { finalChecks, visibleJobs, visibleJobIds, updateFinalCheck, user, navigate, isEngineer } = useApp();
  const myChecks = finalChecks.filter((f) => visibleJobIds.has(f.jobId));

  const approve = (id: string) => {
    updateFinalCheck(id, {
      status: 'Approved',
      checkedBy: user?.id,
      checkedAt: new Date().toISOString().slice(0, 10),
      drillingDesignOk: true,
      holeCheckingOk: true,
      blastingDesignOk: true,
      procurementOk: true,
      documentsOk: true,
    });
  };

  const reject = (id: string) => {
    updateFinalCheck(id, {
      status: 'Rejected',
      checkedBy: user?.id,
      checkedAt: new Date().toISOString().slice(0, 10),
      remarks: 'Rejected — incomplete requirements',
    });
  };

  return (
    <div>
      <PageHeader
        title="Final Technical Check"
        subtitle={
          isEngineer
            ? 'Final checks for your assigned jobs only'
            : 'Decision checkpoint before regulatory approvals and blast'
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {myChecks.map((f) => {
          const job = visibleJobs.find((j) => j.id === f.jobId);
          const allOk =
            f.drillingDesignOk &&
            f.holeCheckingOk &&
            f.blastingDesignOk &&
            f.procurementOk &&
            f.documentsOk;
          return (
            <Card key={f.id} className="overflow-hidden">
              <div
                className={`px-4 py-3 border-b border-slate-100 ${
                  f.status === 'Approved'
                    ? 'bg-emerald-50'
                    : f.status === 'Rejected'
                      ? 'bg-red-50'
                      : 'bg-amber-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{job?.jobNo}</div>
                    <div className="text-xs text-slate-500">{job?.title}</div>
                  </div>
                  <StatusBadge status={f.status} />
                </div>
              </div>
              <div className="p-4 space-y-2">
                {(
                  [
                    ['Drilling Design OK', f.drillingDesignOk],
                    ['Hole Checking OK', f.holeCheckingOk],
                    ['Blasting Design OK', f.blastingDesignOk],
                    ['Procurement OK', f.procurementOk],
                    ['Documents OK', f.documentsOk],
                  ] as const
                ).map(([label, ok]) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
                      ok
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    <span>{ok ? '✓' : '✗'}</span>
                    {label}
                  </div>
                ))}
                {f.remarks && (
                  <div className="text-xs text-slate-500 pt-1">Remarks: {f.remarks}</div>
                )}
                {f.status === 'Pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="success"
                      size="sm"
                      className="flex-1"
                      onClick={() => approve(f.id)}
                      disabled={!allOk && !f.documentsOk}
                    >
                      Approve → Continue
                    </Button>
                    <Button variant="danger" size="sm" className="flex-1" onClick={() => reject(f.id)}>
                      Reject → Return
                    </Button>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => job && navigate('job-detail', job.id)}
                >
                  Open Job
                </Button>
              </div>
            </Card>
          );
        })}
        {myChecks.length === 0 && (
          <Card className="p-10 text-center text-sm text-slate-400 col-span-full">
            No final checks pending
          </Card>
        )}
      </div>
    </div>
  );
}

export function ApprovalsPage() {
  const { approvals, visibleJobs, visibleJobIds, updateApproval, navigate, isEngineer } = useApp();
  const myApprovals = approvals.filter((a) => visibleJobIds.has(a.jobId));

  const approve = (id: string) => {
    const ref = `REF-${Date.now().toString(36).toUpperCase()}`;
    updateApproval(id, {
      status: 'Approved',
      approvedAt: new Date().toISOString().slice(0, 10),
      referenceNo: ref,
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    });
  };

  const submit = (id: string) => {
    updateApproval(id, {
      status: 'Submitted',
      submittedAt: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <div>
      <PageHeader
        title="Regulatory & Admin Approvals"
        subtitle={
          isEngineer
            ? 'Approvals for your assigned jobs only'
            : 'Administrative verification, PRO, police, and permit tracking'
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label="Pending"
          value={myApprovals.filter((a) => a.status === 'Pending').length}
          icon="…"
          color="amber"
        />
        <KpiCard
          label="Submitted"
          value={myApprovals.filter((a) => a.status === 'Submitted').length}
          icon="↑"
          color="cyan"
        />
        <KpiCard
          label="Approved"
          value={myApprovals.filter((a) => a.status === 'Approved').length}
          icon="✓"
          color="emerald"
        />
        <KpiCard label="Total" value={myApprovals.length} icon="⛨" color="purple" />
      </div>
      <Card>
        <DataTable
          headers={[
            'Job',
            'Type',
            'Reference',
            'Submitted',
            'Approved',
            'Expiry',
            'Status',
            'Actions',
          ]}
        >
          {myApprovals.map((a) => {
            const job = visibleJobs.find((j) => j.id === a.jobId);
            return (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-3 py-3 text-xs font-semibold text-cyan-700">
                  <button onClick={() => job && navigate('job-detail', job.id)}>{job?.jobNo}</button>
                </td>
                <td className="px-3 py-3 text-xs text-slate-900">{a.type}</td>
                <td className="px-3 py-3 text-xs text-slate-500">{a.referenceNo || '—'}</td>
                <td className="px-3 py-3 text-xs text-slate-500">{a.submittedAt || '—'}</td>
                <td className="px-3 py-3 text-xs text-slate-500">{a.approvedAt || '—'}</td>
                <td className="px-3 py-3 text-xs text-slate-500">{a.expiryDate || '—'}</td>
                <td className="px-3 py-3">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-1">
                    {a.status === 'Pending' && (
                      <Button size="sm" variant="secondary" onClick={() => submit(a.id)}>
                        Submit
                      </Button>
                    )}
                    {a.status === 'Submitted' && (
                      <Button size="sm" variant="success" onClick={() => approve(a.id)}>
                        Approve
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      </Card>
    </div>
  );
}

export function SchedulingPage() {
  const { blastSchedules, blastExecutions, visibleJobs, visibleJobIds, crews, navigate, isEngineer } = useApp();
  const mySchedules = blastSchedules.filter((s) => visibleJobIds.has(s.jobId));
  const myExecs = blastExecutions.filter((b) => visibleJobIds.has(b.jobId));

  return (
    <div>
      <PageHeader
        title="Blast Scheduling & Execution"
        subtitle={
          isEngineer
            ? 'Schedules for your assigned jobs only'
            : 'Blast dates, crews, safety prep, and field execution'
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Scheduled Blasts" />
          <div className="divide-y divide-slate-100">
            {mySchedules.map((s) => {
              const job = visibleJobs.find((j) => j.id === s.jobId);
              const crew = crews.find((c) => c.id === s.crewId);
              return (
                <div key={s.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <button
                        onClick={() => job && navigate('job-detail', job.id)}
                        className="text-sm font-bold text-cyan-700 hover:text-cyan-800"
                      >
                        {job?.jobNo}
                      </button>
                      <div className="text-xs text-slate-500 mt-0.5">{job?.title}</div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
                      <div className="text-slate-400">Date / Time</div>
                      <div className="text-slate-900 font-semibold">
                        {s.blastDate} · {s.startTime}–{s.endTime}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
                      <div className="text-slate-400">Crew / Manpower</div>
                      <div className="text-slate-900 font-semibold">
                        {crew?.name} · {s.manpower} pax
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 col-span-2">
                      <div className="text-slate-400">Equipment</div>
                      <div className="text-slate-900 font-semibold">{s.equipment}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge color={s.materialsReady ? 'emerald' : 'amber'}>
                      {s.materialsReady ? '✓ Materials Ready' : 'Materials Pending'}
                    </Badge>
                    <Badge color={s.safetyPrep ? 'emerald' : 'amber'}>
                      {s.safetyPrep ? '✓ Safety Prep' : 'Safety Pending'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Blast Executions" />
          <div className="divide-y divide-slate-100">
            {myExecs.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">No executions recorded</div>
            )}
            {myExecs.map((b) => {
              const job = visibleJobs.find((j) => j.id === b.jobId);
              return (
                <div key={b.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{job?.jobNo}</div>
                      <div className="text-xs text-slate-500">
                        {b.blastStart} → {b.blastEnd}
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <Badge color={b.safetyInspection ? 'emerald' : 'red'}>Safety Inspection</Badge>
                    <Badge color={b.areaCleared ? 'emerald' : 'red'}>Area Cleared</Badge>
                    <Badge color={b.approvalsValid ? 'emerald' : 'red'}>Approvals Valid</Badge>
                  </div>
                  <div className="text-xs text-slate-600">
                    Actual qty: <span className="font-bold text-slate-900">{b.actualQuantity} kg</span>
                    {' · '}
                    Weather: {b.weather}
                  </div>
                  {b.notes && <div className="text-[11px] text-slate-400 mt-1">{b.notes}</div>}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
