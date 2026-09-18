import { useState } from 'react';
import { useApp } from '../store/AppContext';
import {
  PageHeader, Card, CardHeader, StatusBadge, ProgressBar, DataTable, Badge, Button, KpiCard,
  Modal, Input, Select, Textarea,
} from '../components/ui';

export function SurveyPage() {
  const {
    surveys, visibleJobs, visibleJobIds, getEmployee, navigate, isEngineer,
    addSurvey, canEditJob, isAdmin, user, employees,
  } = useApp();
  const canAdd = isAdmin || canEditJob;
  const mySurveys = surveys.filter((s) => visibleJobIds.has(s.jobId));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    jobId: '',
    areaName: '',
    plannedDate: '',
    surveyorId: user?.employeeId || '',
    gpsPoints: '0',
    result: '',
    status: 'Planned',
    notes: '',
  });

  const handleSave = () => {
    if (!form.jobId || !form.areaName || !form.plannedDate) return;
    const status = form.status as 'Planned' | 'In Progress' | 'Completed' | 'Approved' | 'Rejected';
    const ok = addSurvey({
      jobId: form.jobId,
      areaName: form.areaName,
      plannedDate: form.plannedDate,
      surveyorId: form.surveyorId || user?.employeeId || '',
      gpsPoints: Number(form.gpsPoints) || 0,
      result: form.result,
      status,
      notes: form.notes,
      completedDate:
        status === 'Completed' || status === 'Approved'
          ? new Date().toISOString().slice(0, 10)
          : undefined,
    });
    if (ok) setOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Area & Survey"
        subtitle={isEngineer ? 'Surveys for your assigned jobs' : 'Site surveys, GPS data, and approvals'}
        actions={
          canAdd ? (
            <Button onClick={() => setOpen(true)}>+ Add Survey</Button>
          ) : undefined
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Total Surveys" value={mySurveys.length} icon="◉" color="cyan" />
        <KpiCard label="Approved" value={mySurveys.filter((s) => s.status === 'Approved').length} icon="✓" color="emerald" />
        <KpiCard label="In Progress" value={mySurveys.filter((s) => s.status === 'In Progress').length} icon="◐" color="amber" />
        <KpiCard label="GPS Points" value={mySurveys.reduce((a, s) => a + s.gpsPoints, 0)} icon="⌖" color="blue" />
      </div>
      <Card>
        <DataTable headers={['Job', 'Area', 'Surveyor', 'Planned', 'Completed', 'GPS', 'Result', 'Status', '']}>
          {mySurveys.map((s) => {
            const job = visibleJobs.find((j) => j.id === s.jobId);
            const surveyor = getEmployee(s.surveyorId);
            return (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-3 py-3 text-xs font-semibold text-cyan-700">{job?.jobNo}</td>
                <td className="px-3 py-3 text-xs text-slate-900">{s.areaName}</td>
                <td className="px-3 py-3 text-xs text-slate-500">{surveyor?.name || '—'}</td>
                <td className="px-3 py-3 text-xs text-slate-500">{s.plannedDate}</td>
                <td className="px-3 py-3 text-xs text-slate-500">{s.completedDate || '—'}</td>
                <td className="px-3 py-3 text-xs text-slate-700">{s.gpsPoints}</td>
                <td className="px-3 py-3 text-xs text-slate-500 max-w-[160px] truncate">{s.result || '—'}</td>
                <td className="px-3 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-3 py-3">
                  <Button size="sm" variant="ghost" onClick={() => job && navigate('job-detail', job.id)}>View</Button>
                </td>
              </tr>
            );
          })}
        </DataTable>
        {mySurveys.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-400">No surveys yet. Click + Add Survey.</div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Survey">
        <div className="space-y-3">
          <Select label="Job" value={form.jobId} onChange={(e) => setForm({ ...form, jobId: e.target.value })}>
            <option value="">Select job…</option>
            {visibleJobs.map((j) => (
              <option key={j.id} value={j.id}>{j.jobNo} — {j.title}</option>
            ))}
          </Select>
          <Input label="Area Name" value={form.areaName} onChange={(e) => setForm({ ...form, areaName: e.target.value })} placeholder="e.g. Block A East Face" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Planned Date" type="date" value={form.plannedDate} onChange={(e) => setForm({ ...form, plannedDate: e.target.value })} />
            <Input label="GPS Points" type="number" value={form.gpsPoints} onChange={(e) => setForm({ ...form, gpsPoints: e.target.value })} />
          </div>
          <Select label="Surveyor" value={form.surveyorId} onChange={(e) => setForm({ ...form, surveyorId: e.target.value })}>
            <option value="">Select…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </Select>
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {['Planned', 'In Progress', 'Completed', 'Approved', 'Rejected'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Textarea label="Result" value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} />
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Survey</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function DrillingPage() {
  const {
    drillingDesigns, drillingExecutions, holeChecks, visibleJobs, visibleJobIds,
    machines, crews, navigate, isEngineer, canEditJob, isAdmin, user,
    addDrillingDesign, addDrillingExecution, addHoleCheck,
  } = useApp();
  const canAdd = isAdmin || canEditJob;
  const myDesigns = drillingDesigns.filter((d) => visibleJobIds.has(d.jobId));
  const myExec = drillingExecutions.filter((d) => visibleJobIds.has(d.jobId));
  const myHoles = holeChecks.filter((h) => visibleJobIds.has(h.jobId));

  const [tab, setTab] = useState<'design' | 'execution' | 'hole'>('design');
  const [open, setOpen] = useState(false);

  const [designForm, setDesignForm] = useState({
    jobId: '', burden: '3', spacing: '3.5', holeDiameter: '115', holeDepth: '12',
    numberOfHoles: '20', pattern: 'Staggered', status: 'Draft', notes: '',
  });
  const [execForm, setExecForm] = useState({
    jobId: '', machineId: '', crewId: '', startDate: '', plannedHoles: '20',
    completedHoles: '0', plannedDepth: '100', actualDepth: '0', downtimeHours: '0',
    status: 'In Progress', notes: '',
  });
  const [holeForm, setHoleForm] = useState({
    jobId: '', inspectedHoles: '0', totalHoles: '20', depthOk: true, diameterOk: true,
    spacingOk: true, status: 'Pending', notes: '',
  });

  const saveDesign = () => {
    if (!designForm.jobId) return;
    const ok = addDrillingDesign({
      jobId: designForm.jobId,
      burden: Number(designForm.burden) || 0,
      spacing: Number(designForm.spacing) || 0,
      holeDiameter: Number(designForm.holeDiameter) || 0,
      holeDepth: Number(designForm.holeDepth) || 0,
      numberOfHoles: Number(designForm.numberOfHoles) || 0,
      pattern: designForm.pattern,
      status: designForm.status as 'Draft' | 'Submitted' | 'Approved' | 'Revision',
      designedBy: user?.employeeId || '',
      notes: designForm.notes,
    });
    if (ok) setOpen(false);
  };

  const saveExec = () => {
    if (!execForm.jobId) return;
    const status = execForm.status as 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
    const ok = addDrillingExecution({
      jobId: execForm.jobId,
      machineId: execForm.machineId,
      crewId: execForm.crewId,
      startDate: execForm.startDate || new Date().toISOString().slice(0, 10),
      plannedHoles: Number(execForm.plannedHoles) || 0,
      completedHoles: Number(execForm.completedHoles) || 0,
      plannedDepth: Number(execForm.plannedDepth) || 0,
      actualDepth: Number(execForm.actualDepth) || 0,
      downtimeHours: Number(execForm.downtimeHours) || 0,
      status,
      notes: execForm.notes,
      endDate: status === 'Completed' ? new Date().toISOString().slice(0, 10) : undefined,
    });
    if (ok) setOpen(false);
  };

  const saveHole = () => {
    if (!holeForm.jobId) return;
    const ok = addHoleCheck({
      jobId: holeForm.jobId,
      inspectedHoles: Number(holeForm.inspectedHoles) || 0,
      totalHoles: Number(holeForm.totalHoles) || 0,
      depthOk: holeForm.depthOk,
      diameterOk: holeForm.diameterOk,
      spacingOk: holeForm.spacingOk,
      status: holeForm.status as 'Pending' | 'In Progress' | 'Approved' | 'Rejected',
      inspectorId: user?.employeeId || '',
      notes: holeForm.notes,
      checkedAt: new Date().toISOString().slice(0, 10),
    });
    if (ok) setOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Drilling Operations"
        subtitle={isEngineer ? 'Drilling for your assigned jobs' : 'Designs, execution, and hole verification'}
        actions={
          canAdd ? (
            <Button onClick={() => setOpen(true)}>
              + Add {tab === 'design' ? 'Design' : tab === 'execution' ? 'Execution' : 'Hole Check'}
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Designs" value={myDesigns.length} icon="⬡" color="indigo" />
        <KpiCard label="In Progress" value={myExec.filter((d) => d.status === 'In Progress').length} icon="▶" color="orange" />
        <KpiCard label="Completed Holes" value={myExec.reduce((a, d) => a + d.completedHoles, 0)} icon="●" color="cyan" />
        <KpiCard label="Hole Checks" value={myHoles.filter((h) => h.status === 'Approved').length} icon="✓" color="emerald" />
      </div>

      <div className="flex gap-2 mb-3">
        {([
          ['design', 'Designs'],
          ['execution', 'Execution'],
          ['hole', 'Hole Checks'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold border ${
              tab === id ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'design' && (
        <Card>
          <CardHeader title="Drilling Designs" />
          <DataTable headers={['Job', 'Holes', 'Diameter', 'Depth', 'Burden', 'Spacing', 'Pattern', 'Status', '']}>
            {myDesigns.map((d) => {
              const job = visibleJobs.find((j) => j.id === d.jobId);
              return (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-xs font-semibold text-cyan-700">{job?.jobNo}</td>
                  <td className="px-3 py-3 text-xs text-slate-900">{d.numberOfHoles}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{d.holeDiameter} mm</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{d.holeDepth} m</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{d.burden} m</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{d.spacing} m</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{d.pattern}</td>
                  <td className="px-3 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-3 py-3">
                    <Button size="sm" variant="ghost" onClick={() => job && navigate('job-detail', job.id)}>View</Button>
                  </td>
                </tr>
              );
            })}
          </DataTable>
          {myDesigns.length === 0 && <div className="py-8 text-center text-sm text-slate-400">No designs. Click + Add Design.</div>}
        </Card>
      )}

      {tab === 'execution' && (
        <Card>
          <CardHeader title="Drilling Execution" />
          <DataTable headers={['Job', 'Machine', 'Crew', 'Holes', 'Depth (P/A)', 'Downtime', 'Progress', 'Status']}>
            {myExec.map((d) => {
              const job = visibleJobs.find((j) => j.id === d.jobId);
              const machine = machines.find((m) => m.id === d.machineId);
              const crew = crews.find((c) => c.id === d.crewId);
              const pct = d.plannedHoles ? Math.round((d.completedHoles / d.plannedHoles) * 100) : 0;
              return (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-xs font-semibold text-cyan-700">{job?.jobNo}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{machine?.code || '—'}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{crew?.name || '—'}</td>
                  <td className="px-3 py-3 text-xs text-slate-900">{d.completedHoles}/{d.plannedHoles}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{d.plannedDepth}/{d.actualDepth} m</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{d.downtimeHours} h</td>
                  <td className="px-3 py-3 min-w-[100px]">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={pct} className="flex-1" />
                      <span className="text-[10px] text-slate-500">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={d.status} /></td>
                </tr>
              );
            })}
          </DataTable>
          {myExec.length === 0 && <div className="py-8 text-center text-sm text-slate-400">No executions. Click + Add Execution.</div>}
        </Card>
      )}

      {tab === 'hole' && (
        <Card>
          <CardHeader title="Hole Check / Verification" />
          <DataTable headers={['Job', 'Inspected', 'Depth', 'Diameter', 'Spacing', 'Status', 'Checked']}>
            {myHoles.map((h) => {
              const job = visibleJobs.find((j) => j.id === h.jobId);
              return (
                <tr key={h.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-xs font-semibold text-cyan-700">{job?.jobNo}</td>
                  <td className="px-3 py-3 text-xs text-slate-900">{h.inspectedHoles}/{h.totalHoles}</td>
                  <td className="px-3 py-3 text-xs text-slate-700">{h.depthOk ? '✓' : '✗'}</td>
                  <td className="px-3 py-3 text-xs text-slate-700">{h.diameterOk ? '✓' : '✗'}</td>
                  <td className="px-3 py-3 text-xs text-slate-700">{h.spacingOk ? '✓' : '✗'}</td>
                  <td className="px-3 py-3"><StatusBadge status={h.status} /></td>
                  <td className="px-3 py-3 text-xs text-slate-500">{h.checkedAt || '—'}</td>
                </tr>
              );
            })}
          </DataTable>
          {myHoles.length === 0 && <div className="py-8 text-center text-sm text-slate-400">No hole checks. Click + Add Hole Check.</div>}
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={tab === 'design' ? 'Add Drilling Design' : tab === 'execution' ? 'Add Drilling Execution' : 'Add Hole Check'}
        wide
      >
        {tab === 'design' && (
          <div className="space-y-3">
            <Select label="Job" value={designForm.jobId} onChange={(e) => setDesignForm({ ...designForm, jobId: e.target.value })}>
              <option value="">Select job…</option>
              {visibleJobs.map((j) => <option key={j.id} value={j.id}>{j.jobNo} — {j.title}</option>)}
            </Select>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Input label="Burden (m)" value={designForm.burden} onChange={(e) => setDesignForm({ ...designForm, burden: e.target.value })} />
              <Input label="Spacing (m)" value={designForm.spacing} onChange={(e) => setDesignForm({ ...designForm, spacing: e.target.value })} />
              <Input label="Hole Diameter (mm)" value={designForm.holeDiameter} onChange={(e) => setDesignForm({ ...designForm, holeDiameter: e.target.value })} />
              <Input label="Hole Depth (m)" value={designForm.holeDepth} onChange={(e) => setDesignForm({ ...designForm, holeDepth: e.target.value })} />
              <Input label="Number of Holes" value={designForm.numberOfHoles} onChange={(e) => setDesignForm({ ...designForm, numberOfHoles: e.target.value })} />
              <Input label="Pattern" value={designForm.pattern} onChange={(e) => setDesignForm({ ...designForm, pattern: e.target.value })} />
            </div>
            <Select label="Status" value={designForm.status} onChange={(e) => setDesignForm({ ...designForm, status: e.target.value })}>
              {['Draft', 'Submitted', 'Approved', 'Revision'].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Textarea label="Notes" value={designForm.notes} onChange={(e) => setDesignForm({ ...designForm, notes: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={saveDesign}>Save Design</Button>
            </div>
          </div>
        )}
        {tab === 'execution' && (
          <div className="space-y-3">
            <Select label="Job" value={execForm.jobId} onChange={(e) => setExecForm({ ...execForm, jobId: e.target.value })}>
              <option value="">Select job…</option>
              {visibleJobs.map((j) => <option key={j.id} value={j.id}>{j.jobNo} — {j.title}</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Machine" value={execForm.machineId} onChange={(e) => setExecForm({ ...execForm, machineId: e.target.value })}>
                <option value="">Select…</option>
                {machines.map((m) => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
              </Select>
              <Select label="Crew" value={execForm.crewId} onChange={(e) => setExecForm({ ...execForm, crewId: e.target.value })}>
                <option value="">Select…</option>
                {crews.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Input label="Start Date" type="date" value={execForm.startDate} onChange={(e) => setExecForm({ ...execForm, startDate: e.target.value })} />
              <Input label="Planned Holes" value={execForm.plannedHoles} onChange={(e) => setExecForm({ ...execForm, plannedHoles: e.target.value })} />
              <Input label="Completed Holes" value={execForm.completedHoles} onChange={(e) => setExecForm({ ...execForm, completedHoles: e.target.value })} />
              <Input label="Planned Depth" value={execForm.plannedDepth} onChange={(e) => setExecForm({ ...execForm, plannedDepth: e.target.value })} />
              <Input label="Actual Depth" value={execForm.actualDepth} onChange={(e) => setExecForm({ ...execForm, actualDepth: e.target.value })} />
              <Input label="Downtime Hours" value={execForm.downtimeHours} onChange={(e) => setExecForm({ ...execForm, downtimeHours: e.target.value })} />
            </div>
            <Select label="Status" value={execForm.status} onChange={(e) => setExecForm({ ...execForm, status: e.target.value })}>
              {['Not Started', 'In Progress', 'Completed', 'On Hold'].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Textarea label="Notes" value={execForm.notes} onChange={(e) => setExecForm({ ...execForm, notes: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={saveExec}>Save Execution</Button>
            </div>
          </div>
        )}
        {tab === 'hole' && (
          <div className="space-y-3">
            <Select label="Job" value={holeForm.jobId} onChange={(e) => setHoleForm({ ...holeForm, jobId: e.target.value })}>
              <option value="">Select job…</option>
              {visibleJobs.map((j) => <option key={j.id} value={j.id}>{j.jobNo} — {j.title}</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Inspected Holes" value={holeForm.inspectedHoles} onChange={(e) => setHoleForm({ ...holeForm, inspectedHoles: e.target.value })} />
              <Input label="Total Holes" value={holeForm.totalHoles} onChange={(e) => setHoleForm({ ...holeForm, totalHoles: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              {([
                ['depthOk', 'Depth OK'],
                ['diameterOk', 'Diameter OK'],
                ['spacingOk', 'Spacing OK'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={holeForm[key]}
                    onChange={(e) => setHoleForm({ ...holeForm, [key]: e.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>
            <Select label="Status" value={holeForm.status} onChange={(e) => setHoleForm({ ...holeForm, status: e.target.value })}>
              {['Pending', 'In Progress', 'Approved', 'Rejected'].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Textarea label="Notes" value={holeForm.notes} onChange={(e) => setHoleForm({ ...holeForm, notes: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={saveHole}>Save Hole Check</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function BlastingPage() {
  const {
    blastingDesigns, visibleJobs, visibleJobIds, navigate, isEngineer,
    canEditJob, isAdmin, user, addBlastingDesign,
  } = useApp();
  const canAdd = isAdmin || canEditJob;
  const myBlasts = blastingDesigns.filter((b) => visibleJobIds.has(b.jobId));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    jobId: '',
    totalHoles: '20',
    totalDepth: '200',
    initiationSystem: 'Nonel',
    delayPattern: '25ms sequential',
    plannedQuantity: '500',
    materialType: 'ANFO',
    status: 'Draft',
    notes: '',
  });

  const handleSave = () => {
    if (!form.jobId) return;
    const ok = addBlastingDesign({
      jobId: form.jobId,
      totalHoles: Number(form.totalHoles) || 0,
      totalDepth: Number(form.totalDepth) || 0,
      initiationSystem: form.initiationSystem,
      delayPattern: form.delayPattern,
      plannedQuantity: Number(form.plannedQuantity) || 0,
      materialType: form.materialType,
      status: form.status as 'Draft' | 'Submitted' | 'Approved' | 'Revision',
      designedBy: user?.employeeId || '',
      notes: form.notes,
    });
    if (ok) setOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Blasting Design"
        subtitle={isEngineer ? 'Blast designs for your assigned jobs' : 'Blast engineering and material planning'}
        actions={canAdd ? <Button onClick={() => setOpen(true)}>+ Add Blast Design</Button> : undefined}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Designs" value={myBlasts.length} icon="✸" color="rose" />
        <KpiCard label="Approved" value={myBlasts.filter((b) => b.status === 'Approved').length} icon="✓" color="emerald" />
        <KpiCard label="Total Holes" value={myBlasts.reduce((a, b) => a + b.totalHoles, 0)} icon="●" color="cyan" />
        <KpiCard label="Planned Qty (kg)" value={myBlasts.reduce((a, b) => a + b.plannedQuantity, 0).toLocaleString()} icon="⬡" color="amber" />
      </div>
      <Card>
        <DataTable headers={['Job', 'Holes', 'Depth', 'Initiation', 'Delay', 'Material', 'Qty (kg)', 'Status', '']}>
          {myBlasts.map((b) => {
            const job = visibleJobs.find((j) => j.id === b.jobId);
            return (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="px-3 py-3 text-xs font-semibold text-cyan-700">{job?.jobNo}</td>
                <td className="px-3 py-3 text-xs text-slate-900">{b.totalHoles}</td>
                <td className="px-3 py-3 text-xs text-slate-600">{b.totalDepth} m</td>
                <td className="px-3 py-3 text-xs text-slate-600">{b.initiationSystem}</td>
                <td className="px-3 py-3 text-xs text-slate-500">{b.delayPattern}</td>
                <td className="px-3 py-3 text-xs text-slate-600">{b.materialType}</td>
                <td className="px-3 py-3 text-xs font-semibold text-slate-900">{b.plannedQuantity.toLocaleString()}</td>
                <td className="px-3 py-3"><StatusBadge status={b.status} /></td>
                <td className="px-3 py-3">
                  <Button size="sm" variant="ghost" onClick={() => job && navigate('job-detail', job.id)}>View</Button>
                </td>
              </tr>
            );
          })}
        </DataTable>
        {myBlasts.length === 0 && <div className="py-8 text-center text-sm text-slate-400">No blast designs. Click + Add Blast Design.</div>}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Blast Design" wide>
        <div className="space-y-3">
          <Select label="Job" value={form.jobId} onChange={(e) => setForm({ ...form, jobId: e.target.value })}>
            <option value="">Select job…</option>
            {visibleJobs.map((j) => <option key={j.id} value={j.id}>{j.jobNo} — {j.title}</option>)}
          </Select>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Input label="Total Holes" value={form.totalHoles} onChange={(e) => setForm({ ...form, totalHoles: e.target.value })} />
            <Input label="Total Depth (m)" value={form.totalDepth} onChange={(e) => setForm({ ...form, totalDepth: e.target.value })} />
            <Input label="Planned Qty (kg)" value={form.plannedQuantity} onChange={(e) => setForm({ ...form, plannedQuantity: e.target.value })} />
            <Input label="Initiation System" value={form.initiationSystem} onChange={(e) => setForm({ ...form, initiationSystem: e.target.value })} />
            <Input label="Delay Pattern" value={form.delayPattern} onChange={(e) => setForm({ ...form, delayPattern: e.target.value })} />
            <Input label="Material Type" value={form.materialType} onChange={(e) => setForm({ ...form, materialType: e.target.value })} />
          </div>
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {['Draft', 'Submitted', 'Approved', 'Revision'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Design</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function ResourcesPage() {
  const { machines, crews, getEmployee, employees, isAdmin, canEditJob, addMachine, addCrew } = useApp();
  const canAdd = isAdmin || canEditJob;
  const [openMachine, setOpenMachine] = useState(false);
  const [openCrew, setOpenCrew] = useState(false);
  const [machineForm, setMachineForm] = useState({
    code: '', name: '', type: 'Crawler Drill', status: 'Available', operator: '',
  });
  const [crewForm, setCrewForm] = useState({
    name: '', supervisorId: '', members: '', status: 'Available',
  });

  const saveMachine = () => {
    if (!machineForm.name.trim()) return;
    const ok = addMachine({
      code: machineForm.code || `DRL-${String(machines.length + 1).padStart(2, '0')}`,
      name: machineForm.name.trim(),
      type: machineForm.type,
      status: machineForm.status as 'Available' | 'Assigned' | 'Maintenance' | 'Down',
      operator: machineForm.operator || undefined,
    });
    if (ok) setOpenMachine(false);
  };

  const saveCrew = () => {
    if (!crewForm.name.trim()) return;
    const ok = addCrew({
      name: crewForm.name.trim(),
      supervisorId: crewForm.supervisorId,
      members: crewForm.members.split(',').map((m) => m.trim()).filter(Boolean),
      status: crewForm.status as 'Available' | 'Assigned' | 'Off',
    });
    if (ok) setOpenCrew(false);
  };

  return (
    <div>
      <PageHeader
        title="Resources"
        subtitle="Drilling machines, crews, operators, and manpower"
        actions={
          canAdd ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setOpenMachine(true)}>+ Machine</Button>
              <Button onClick={() => setOpenCrew(true)}>+ Crew</Button>
            </div>
          ) : undefined
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Drilling Machines" subtitle={`${machines.length} units`} />
          <div className="divide-y divide-slate-100">
            {machines.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600 text-sm font-bold border border-orange-100">
                  {(m.code || 'XX').slice(-2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-900">{m.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {m.code} · {m.type}
                    {m.operator ? ` · Op: ${m.operator}` : ''}
                  </div>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
            {machines.length === 0 && (
              <div className="p-6 text-center text-sm text-slate-400">No machines. Click + Machine.</div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Crews" subtitle={`${crews.length} crews`} />
          <div className="divide-y divide-slate-100">
            {crews.map((c) => {
              const supervisor = getEmployee(c.supervisorId);
              return (
                <div key={c.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-xs font-semibold text-slate-900">{c.name}</div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="text-[11px] text-slate-500 mb-1.5">
                    Supervisor: {supervisor?.name || '—'}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {c.members.map((m) => (
                      <Badge key={m} color="slate">{m}</Badge>
                    ))}
                  </div>
                </div>
              );
            })}
            {crews.length === 0 && (
              <div className="p-6 text-center text-sm text-slate-400">No crews. Click + Crew.</div>
            )}
          </div>
        </Card>
      </div>

      <Modal open={openMachine} onClose={() => setOpenMachine(false)} title="Add Machine">
        <div className="space-y-3">
          <Input label="Code" value={machineForm.code} onChange={(e) => setMachineForm({ ...machineForm, code: e.target.value })} placeholder="DRL-01" />
          <Input label="Name" value={machineForm.name} onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })} placeholder="Atlas Copco ROC D7" />
          <Input label="Type" value={machineForm.type} onChange={(e) => setMachineForm({ ...machineForm, type: e.target.value })} />
          <Input label="Operator" value={machineForm.operator} onChange={(e) => setMachineForm({ ...machineForm, operator: e.target.value })} />
          <Select label="Status" value={machineForm.status} onChange={(e) => setMachineForm({ ...machineForm, status: e.target.value })}>
            {['Available', 'Assigned', 'Maintenance', 'Down'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenMachine(false)}>Cancel</Button>
            <Button onClick={saveMachine}>Save Machine</Button>
          </div>
        </div>
      </Modal>

      <Modal open={openCrew} onClose={() => setOpenCrew(false)} title="Add Crew">
        <div className="space-y-3">
          <Input label="Crew Name" value={crewForm.name} onChange={(e) => setCrewForm({ ...crewForm, name: e.target.value })} placeholder="Alpha Drill Crew" />
          <Select label="Supervisor" value={crewForm.supervisorId} onChange={(e) => setCrewForm({ ...crewForm, supervisorId: e.target.value })}>
            <option value="">Select…</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
          <Input
            label="Members (comma separated)"
            value={crewForm.members}
            onChange={(e) => setCrewForm({ ...crewForm, members: e.target.value })}
            placeholder="Ali, Omar, Hassan"
          />
          <Select label="Status" value={crewForm.status} onChange={(e) => setCrewForm({ ...crewForm, status: e.target.value })}>
            {['Available', 'Assigned', 'Off'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenCrew(false)}>Cancel</Button>
            <Button onClick={saveCrew}>Save Crew</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
