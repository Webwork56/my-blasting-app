import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import {
  PageHeader,
  Card,
  CardHeader,
  Button,
  Select,
  Input,
  StatusBadge,
  PriorityBadge,
  Badge,
  KpiCard,
  DataTable,
} from '../components/ui';
import type { Job } from '../data/types';

type ReportType =
  | 'job-summary'
  | 'customer-wise'
  | 'engineer-wise'
  | 'site-wise'
  | 'date-wise'
  | 'blast-results'
  | 'finance-summary';

type GroupBy = 'none' | 'customer' | 'engineer' | 'site' | 'status' | 'month';

export function PrintReportsPage() {
  const {
    visibleJobs,
    customers,
    sites,
    employees,
    jobCosts,
    invoices,
    payments,
    blastReports,
    blastSchedules,
    drillingExecutions,
    getCustomer,
    getSite,
    getEmployee,
    isEngineer,
    user,
  } = useApp();

  const [reportType, setReportType] = useState<ReportType>('job-summary');
  const [customerId, setCustomerId] = useState('');
  const [engineerId, setEngineerId] = useState(isEngineer && user ? user.employeeId : '');
  const [siteId, setSiteId] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [priority, setPriority] = useState('');

  const engineers = employees.filter((e) => e.role === 'Engineer' || e.role === 'Admin');
  const statuses = [...new Set(visibleJobs.map((j) => j.status))].sort();

  // Sites filtered by selected customer (combination filter)
  const availableSites = useMemo(() => {
    if (customerId) return sites.filter((s) => s.customerId === customerId);
    return sites.filter((s) => visibleJobs.some((j) => j.siteId === s.id));
  }, [customerId, sites, visibleJobs]);

  // Customers that have visible jobs
  const availableCustomers = useMemo(() => {
    const ids = new Set(visibleJobs.map((j) => j.customerId));
    return customers.filter((c) => ids.has(c.id));
  }, [customers, visibleJobs]);

  const filteredJobs = useMemo(() => {
    return visibleJobs.filter((j) => {
      if (customerId && j.customerId !== customerId) return false;
      if (engineerId && j.engineerId !== engineerId) return false;
      if (siteId && j.siteId !== siteId) return false;
      if (status && j.status !== status) return false;
      if (priority && j.priority !== priority) return false;

      const jobDate = j.startDate || j.requestedDate || j.createdAt;
      if (dateFrom && jobDate < dateFrom) return false;
      if (dateTo && jobDate > dateTo) return false;
      return true;
    });
  }, [visibleJobs, customerId, engineerId, siteId, status, priority, dateFrom, dateTo]);

  const filteredJobIds = useMemo(() => new Set(filteredJobs.map((j) => j.id)), [filteredJobs]);

  const filteredCosts = useMemo(
    () => jobCosts.filter((c) => filteredJobIds.has(c.jobId)),
    [jobCosts, filteredJobIds]
  );
  const filteredInvoices = useMemo(
    () => invoices.filter((i) => filteredJobIds.has(i.jobId)),
    [invoices, filteredJobIds]
  );
  const filteredInvoiceIds = useMemo(
    () => new Set(filteredInvoices.map((i) => i.id)),
    [filteredInvoices]
  );
  const filteredPayments = useMemo(
    () => payments.filter((p) => filteredInvoiceIds.has(p.invoiceId)),
    [payments, filteredInvoiceIds]
  );
  const filteredBlastReports = useMemo(
    () => blastReports.filter((r) => filteredJobIds.has(r.jobId)),
    [blastReports, filteredJobIds]
  );
  const filteredSchedules = useMemo(
    () => blastSchedules.filter((s) => filteredJobIds.has(s.jobId)),
    [blastSchedules, filteredJobIds]
  );
  const filteredDrilling = useMemo(
    () => drillingExecutions.filter((d) => filteredJobIds.has(d.jobId)),
    [drillingExecutions, filteredJobIds]
  );

  const totalCost = filteredCosts.reduce((a, c) => a + c.amount, 0);
  const totalInvoiced = filteredInvoices.reduce((a, i) => a + i.total, 0);
  const totalPaid = filteredPayments.reduce((a, p) => a + p.amount, 0);
  const totalVolume = filteredBlastReports.reduce((a, r) => a + r.blastedVolume, 0);
  const totalHoles = filteredDrilling.reduce((a, d) => a + d.completedHoles, 0);

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (customerId) {
      const c = getCustomer(customerId);
      labels.push(`Customer: ${c?.name || customerId}`);
    }
    if (engineerId) {
      const e = getEmployee(engineerId);
      labels.push(`Engineer: ${e?.name || engineerId}`);
    }
    if (siteId) {
      const s = getSite(siteId);
      labels.push(`Site: ${s?.name || siteId}`);
    }
    if (status) labels.push(`Status: ${status}`);
    if (priority) labels.push(`Priority: ${priority}`);
    if (dateFrom || dateTo) {
      labels.push(`Date: ${dateFrom || '…'} → ${dateTo || '…'}`);
    }
    if (labels.length === 0) labels.push('All records (no filters)');
    return labels;
  }, [customerId, engineerId, siteId, status, priority, dateFrom, dateTo, getCustomer, getEmployee, getSite]);

  const clearFilters = () => {
    setCustomerId('');
    setEngineerId(isEngineer && user ? user.employeeId : '');
    setSiteId('');
    setStatus('');
    setPriority('');
    setDateFrom('');
    setDateTo('');
    setGroupBy('none');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    // Reset site if it doesn't belong to new customer
    if (id && siteId) {
      const site = sites.find((s) => s.id === siteId);
      if (site && site.customerId !== id) setSiteId('');
    }
  };

  const reportTitle: Record<ReportType, string> = {
    'job-summary': 'Job Summary Report',
    'customer-wise': 'Customer-Wise Report',
    'engineer-wise': 'Engineer-Wise Report',
    'site-wise': 'Site-Wise Report',
    'date-wise': 'Date-Wise Report',
    'blast-results': 'Blast Results Report',
    'finance-summary': 'Finance Summary Report',
  };

  // Grouping helpers
  const groupedJobs = useMemo(() => {
    if (groupBy === 'none' && reportType === 'job-summary') {
      return [{ key: 'All Jobs', jobs: filteredJobs }];
    }
    const effectiveGroup: GroupBy =
      groupBy !== 'none'
        ? groupBy
        : reportType === 'customer-wise'
          ? 'customer'
          : reportType === 'engineer-wise'
            ? 'engineer'
            : reportType === 'site-wise'
              ? 'site'
              : reportType === 'date-wise'
                ? 'month'
                : 'none';

    if (effectiveGroup === 'none') return [{ key: 'All Jobs', jobs: filteredJobs }];

    const map = new Map<string, Job[]>();
    for (const j of filteredJobs) {
      let key = 'Other';
      if (effectiveGroup === 'customer') key = getCustomer(j.customerId)?.name || j.customerId;
      if (effectiveGroup === 'engineer') key = getEmployee(j.engineerId)?.name || j.engineerId;
      if (effectiveGroup === 'site') key = getSite(j.siteId)?.name || j.siteId;
      if (effectiveGroup === 'status') key = j.status;
      if (effectiveGroup === 'month') {
        const d = j.startDate || j.requestedDate || j.createdAt;
        key = d.slice(0, 7); // YYYY-MM
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(j);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, jobs]) => ({ key, jobs }));
  }, [filteredJobs, groupBy, reportType, getCustomer, getEmployee, getSite]);

  const generatedAt = new Date().toLocaleString();

  return (
    <div>
      {/* Filter panel — hidden when printing */}
      <div className="print:hidden">
        <PageHeader
          title="Printable Reports"
          subtitle="Filter by customer, engineer, site, date — alone or combined — then print"
          actions={
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button onClick={handlePrint}>🖨 Print Report</Button>
            </div>
          }
        />

        {/* Report type */}
        <Card className="mb-4 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Report Type
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['job-summary', 'Job Summary'],
                ['customer-wise', 'Customer Wise'],
                ['engineer-wise', 'Engineer Wise'],
                ['site-wise', 'Site Wise'],
                ['date-wise', 'Date Wise'],
                ['blast-results', 'Blast Results'],
                ['finance-summary', 'Finance'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setReportType(id);
                  if (id === 'customer-wise') setGroupBy('customer');
                  else if (id === 'engineer-wise') setGroupBy('engineer');
                  else if (id === 'site-wise') setGroupBy('site');
                  else if (id === 'date-wise') setGroupBy('month');
                  else setGroupBy('none');
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
                  reportType === id
                    ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>

        {/* Filters */}
        <Card className="mb-4 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Filters · combine any fields
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <Select
              label="Customer"
              value={customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
            >
              <option value="">All Customers</option>
              {availableCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </Select>

            <Select
              label="Site"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
            >
              <option value="">All Sites{customerId ? ' (for selected customer)' : ''}</option>
              {availableSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.location}
                </option>
              ))}
            </Select>

            <Select
              label="Engineer"
              value={engineerId}
              onChange={(e) => setEngineerId(e.target.value)}
              disabled={isEngineer}
            >
              <option value="">All Engineers</option>
              {engineers.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>

            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>

            <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">All Priorities</option>
              {['Low', 'Normal', 'High', 'Urgent'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>

            <Input
              label="Date From"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              label="Date To"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />

            <Select
              label="Group By"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            >
              <option value="none">No grouping</option>
              <option value="customer">Customer</option>
              <option value="engineer">Engineer</option>
              <option value="site">Site</option>
              <option value="status">Status</option>
              <option value="month">Month</option>
            </Select>
          </div>

          {/* Active filters chips */}
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-medium self-center mr-1">Active:</span>
            {activeFilterLabels.map((l) => (
              <Badge key={l} color="cyan">
                {l}
              </Badge>
            ))}
            <span className="text-[10px] text-slate-500 self-center ml-auto">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} matched
            </span>
          </div>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <KpiCard label="Jobs" value={filteredJobs.length} icon="▣" color="cyan" />
          <KpiCard label="Holes Drilled" value={totalHoles} icon="●" color="orange" />
          <KpiCard label="Blast Volume m³" value={totalVolume.toLocaleString()} icon="✸" color="rose" />
          <KpiCard
            label="Total Cost"
            value={`AED ${(totalCost / 1000).toFixed(1)}k`}
            icon="◈"
            color="amber"
          />
          <KpiCard
            label="Invoiced"
            value={`AED ${(totalInvoiced / 1000).toFixed(1)}k`}
            icon="▤"
            color="blue"
          />
          <KpiCard
            label="Collected"
            value={`AED ${(totalPaid / 1000).toFixed(1)}k`}
            icon="✓"
            color="emerald"
          />
        </div>
      </div>

      {/* ========== PRINTABLE AREA ========== */}
      <div id="print-area" className="print-report">
        {/* Print header */}
        <div className="hidden print:block mb-6">
          <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3">
            <div>
              <div className="text-xl font-bold text-slate-900">IBTIKAR BMS</div>
              <div className="text-sm text-slate-600">Blasting Management System</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-slate-900">{reportTitle[reportType]}</div>
              <div className="text-xs text-slate-500">Generated: {generatedAt}</div>
              <div className="text-xs text-slate-500">By: {user?.name} ({user?.role})</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            <span className="font-semibold">Filters: </span>
            {activeFilterLabels.join(' · ')}
          </div>
        </div>

        {/* Screen header for print preview feel */}
        <Card className="mb-4 print:border-0 print:shadow-none print:mb-2">
          <div className="p-4 print:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 print:hidden">
              <div>
                <h2 className="text-base font-bold text-slate-900">{reportTitle[reportType]}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preview · {filteredJobs.length} jobs · Click Print to output
                </p>
              </div>
              <Button onClick={handlePrint}>🖨 Print / Save as PDF</Button>
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center print:grid-cols-6">
              <SummaryCell label="Jobs" value={String(filteredJobs.length)} />
              <SummaryCell label="Holes" value={String(totalHoles)} />
              <SummaryCell label="Volume m³" value={totalVolume.toLocaleString()} />
              <SummaryCell label="Cost AED" value={totalCost.toLocaleString()} />
              <SummaryCell label="Invoiced AED" value={totalInvoiced.toLocaleString()} />
              <SummaryCell label="Paid AED" value={totalPaid.toLocaleString()} />
            </div>
          </div>
        </Card>

        {/* JOB / GROUPED TABLES */}
        {(reportType === 'job-summary' ||
          reportType === 'customer-wise' ||
          reportType === 'engineer-wise' ||
          reportType === 'site-wise' ||
          reportType === 'date-wise') && (
          <div className="space-y-4">
            {groupedJobs.length === 0 && (
              <Card className="p-10 text-center text-sm text-slate-400">
                No jobs match the selected filters
              </Card>
            )}
            {groupedJobs.map((group) => {
              const gCost = filteredCosts
                .filter((c) => group.jobs.some((j) => j.id === c.jobId))
                .reduce((a, c) => a + c.amount, 0);
              const gInv = filteredInvoices
                .filter((i) => group.jobs.some((j) => j.id === i.jobId))
                .reduce((a, i) => a + i.total, 0);

              return (
                <Card key={group.key} className="print:break-inside-avoid print:shadow-none print:border print:border-slate-300">
                  {(groupBy !== 'none' ||
                    reportType === 'customer-wise' ||
                    reportType === 'engineer-wise' ||
                    reportType === 'site-wise' ||
                    reportType === 'date-wise') && (
                    <CardHeader
                      title={group.key}
                      subtitle={`${group.jobs.length} job(s) · Cost AED ${gCost.toLocaleString()} · Invoiced AED ${gInv.toLocaleString()}`}
                    />
                  )}
                  <DataTable
                    headers={[
                      'Job No',
                      'Title',
                      'Customer',
                      'Site',
                      'Engineer',
                      'Priority',
                      'Status',
                      'Requested',
                      'Start',
                      'Progress',
                    ]}
                  >
                    {group.jobs.map((j) => (
                      <tr key={j.id} className="print:break-inside-avoid">
                        <td className="px-3 py-2 text-xs font-semibold text-cyan-700 print:text-slate-900">
                          {j.jobNo}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-900 max-w-[140px] truncate">
                          {j.title}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">
                          {getCustomer(j.customerId)?.name}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">
                          {getSite(j.siteId)?.name}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">
                          {getEmployee(j.engineerId)?.name}
                        </td>
                        <td className="px-3 py-2">
                          <PriorityBadge priority={j.priority} />
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge status={j.status} />
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500">{j.requestedDate}</td>
                        <td className="px-3 py-2 text-xs text-slate-500">{j.startDate || '—'}</td>
                        <td className="px-3 py-2 text-xs text-slate-700 font-medium">{j.progress}%</td>
                      </tr>
                    ))}
                  </DataTable>
                </Card>
              );
            })}
          </div>
        )}

        {/* BLAST RESULTS */}
        {reportType === 'blast-results' && (
          <Card className="print:shadow-none print:border print:border-slate-300">
            <CardHeader title="Blast Results" subtitle={`${filteredBlastReports.length} report(s)`} />
            <DataTable
              headers={[
                'Job',
                'Customer',
                'Site',
                'Holes',
                'Material kg',
                'Volume m³',
                'Result',
                'Vibration',
                'Fly Rock',
                'Misfire',
                'Incident',
                'Status',
              ]}
            >
              {filteredBlastReports.map((r) => {
                const job = filteredJobs.find((j) => j.id === r.jobId);
                return (
                  <tr key={r.id} className="print:break-inside-avoid">
                    <td className="px-3 py-2 text-xs font-semibold text-slate-900">{job?.jobNo}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {job ? getCustomer(job.customerId)?.name : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {job ? getSite(job.siteId)?.name : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-900">{r.totalHoles}</td>
                    <td className="px-3 py-2 text-xs text-slate-900">{r.materialQty}</td>
                    <td className="px-3 py-2 text-xs text-slate-900">{r.blastedVolume}</td>
                    <td className="px-3 py-2 text-xs text-slate-600 max-w-[160px] truncate">
                      {r.result}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">{r.vibration}</td>
                    <td className="px-3 py-2 text-xs">{r.flyRock ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2 text-xs">{r.misfire ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2 text-xs">{r.safetyIncident ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                );
              })}
            </DataTable>
            {filteredBlastReports.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-400">No blast reports for filters</div>
            )}

            {filteredSchedules.length > 0 && (
              <div className="border-t border-slate-100 p-4">
                <div className="text-xs font-bold text-slate-700 mb-2">Related Blast Schedules</div>
                <DataTable headers={['Job', 'Date', 'Time', 'Manpower', 'Status']}>
                  {filteredSchedules.map((s) => {
                    const job = filteredJobs.find((j) => j.id === s.jobId);
                    return (
                      <tr key={s.id}>
                        <td className="px-3 py-2 text-xs font-semibold">{job?.jobNo}</td>
                        <td className="px-3 py-2 text-xs">{s.blastDate}</td>
                        <td className="px-3 py-2 text-xs">
                          {s.startTime}–{s.endTime}
                        </td>
                        <td className="px-3 py-2 text-xs">{s.manpower}</td>
                        <td className="px-3 py-2">
                          <StatusBadge status={s.status} />
                        </td>
                      </tr>
                    );
                  })}
                </DataTable>
              </div>
            )}
          </Card>
        )}

        {/* FINANCE */}
        {reportType === 'finance-summary' && (
          <div className="space-y-4">
            <Card className="print:shadow-none print:border print:border-slate-300">
              <CardHeader title="Job Costs" subtitle={`Total AED ${totalCost.toLocaleString()}`} />
              <DataTable headers={['Job', 'Customer', 'Category', 'Description', 'Amount', 'Date']}>
                {filteredCosts.map((c) => {
                  const job = filteredJobs.find((j) => j.id === c.jobId);
                  return (
                    <tr key={c.id} className="print:break-inside-avoid">
                      <td className="px-3 py-2 text-xs font-semibold">{job?.jobNo}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {job ? getCustomer(job.customerId)?.name : '—'}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <Badge color="slate">{c.category}</Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600 max-w-[160px] truncate">
                        {c.description}
                      </td>
                      <td className="px-3 py-2 text-xs font-bold text-slate-900">
                        AED {c.amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">{c.date}</td>
                    </tr>
                  );
                })}
              </DataTable>
              {filteredCosts.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-400">No costs for filters</div>
              )}
            </Card>

            <Card className="print:shadow-none print:border print:border-slate-300">
              <CardHeader
                title="Invoices & Payments"
                subtitle={`Invoiced AED ${totalInvoiced.toLocaleString()} · Paid AED ${totalPaid.toLocaleString()} · Outstanding AED ${(totalInvoiced - totalPaid).toLocaleString()}`}
              />
              <DataTable
                headers={['Invoice', 'Job', 'Customer', 'Date', 'Due', 'Total', 'Paid', 'Balance', 'Status']}
              >
                {filteredInvoices.map((inv) => {
                  const job = filteredJobs.find((j) => j.id === inv.jobId);
                  const paid = filteredPayments
                    .filter((p) => p.invoiceId === inv.id)
                    .reduce((s, p) => s + p.amount, 0);
                  return (
                    <tr key={inv.id} className="print:break-inside-avoid">
                      <td className="px-3 py-2 text-xs font-semibold">{inv.invoiceNo}</td>
                      <td className="px-3 py-2 text-xs">{job?.jobNo}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {getCustomer(inv.customerId)?.name}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">{inv.date}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{inv.dueDate}</td>
                      <td className="px-3 py-2 text-xs font-bold">{inv.total.toLocaleString()}</td>
                      <td className="px-3 py-2 text-xs text-emerald-700">{paid.toLocaleString()}</td>
                      <td className="px-3 py-2 text-xs font-semibold text-amber-700">
                        {(inv.total - paid).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={inv.status} />
                      </td>
                    </tr>
                  );
                })}
              </DataTable>
              {filteredInvoices.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-400">No invoices for filters</div>
              )}
            </Card>
          </div>
        )}

        {/* Print footer */}
        <div className="hidden print:block mt-8 pt-3 border-t border-slate-300 text-center">
          <p className="text-[9px] text-slate-400">
            IBTIKAR Blasting Management System · Confidential
          </p>
        </div>
      </div>

      {/* Screen-only print tip */}
      <div className="print:hidden mt-4 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-xs text-cyan-800">
        <span className="font-semibold">How to print:</span> Set filters above (Customer + Site,
        Engineer + Date, etc.), choose a report type, then click <strong>Print Report</strong>. Use
        your browser’s “Save as PDF” if you need a file. Combination example: select a Customer, then
        a Site belonging to that customer, and a date range.
      </div>
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 print:border-slate-300 print:bg-white">
      <div className="text-[9px] text-slate-400 uppercase font-medium">{label}</div>
      <div className="text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}
