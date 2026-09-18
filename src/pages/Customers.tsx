import { useState } from 'react';
import { useApp } from '../store/AppContext';
import {
  PageHeader, Card, Button, Input, Select, Modal, StatusBadge, DataTable, Badge, Textarea,
} from '../components/ui';

export function CustomersPage() {
  const {
    customers,
    sites,
    visibleJobs,
    addCustomer,
    addSite,
    navigate,
    isEngineer,
    isAdmin,
    canManageCustomers,
    hasPermission,
  } = useApp();

  const canAdd =
    isAdmin || canManageCustomers || hasPermission('customers.create') || hasPermission('customers.edit');

  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showSite, setShowSite] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    shortCode: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    status: 'Active' as 'Active' | 'Inactive',
    code: '',
  });

  const [siteForm, setSiteForm] = useState({
    name: '',
    location: '',
    gpsLat: '',
    gpsLng: '',
    areaSize: '',
    notes: '',
  });

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.shortCode.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  const selected = customers.find((c) => c.id === selectedId);
  const selectedSites = sites.filter((s) => s.customerId === selectedId);
  const selectedJobs = visibleJobs.filter((j) => j.customerId === selectedId);

  const handleCreate = () => {
    if (!canAdd || !form.name || !form.contactPerson) return;
    addCustomer({
      code: '',
      shortCode: form.shortCode.trim().toUpperCase(),
      name: form.name,
      contactPerson: form.contactPerson,
      phone: form.phone,
      email: form.email,
      address: form.address,
      city: form.city,
      status: form.status,
    });
    setShowCreate(false);
    setForm({
      name: '',
      shortCode: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      status: 'Active',
      code: '',
    });
  };

  const openAddSite = () => {
    if (!selectedId || !canAdd) return;
    setSiteForm({
      name: '',
      location: '',
      gpsLat: '',
      gpsLng: '',
      areaSize: '',
      notes: '',
    });
    setShowSite(true);
  };

  const handleAddSite = () => {
    if (!selectedId || !canAdd || !siteForm.name.trim()) return;
    const lat = parseFloat(siteForm.gpsLat);
    const lng = parseFloat(siteForm.gpsLng);
    const ok = addSite({
      customerId: selectedId,
      name: siteForm.name.trim(),
      location: siteForm.location.trim() || selected?.city || '',
      gpsLat: Number.isFinite(lat) ? lat : 0,
      gpsLng: Number.isFinite(lng) ? lng : 0,
      areaSize: siteForm.areaSize.trim() || '—',
      notes: siteForm.notes.trim(),
    });
    if (ok) {
      setShowSite(false);
    } else {
      window.alert('You do not have permission to add sites.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Customers & Sites"
        subtitle={
          isEngineer
            ? 'Customers linked to your assigned jobs'
            : 'Register customers, then add sites under each customer'
        }
        actions={
          canAdd ? (
            <Button onClick={() => setShowCreate(true)}>+ New Customer</Button>
          ) : (
            <Badge color="amber">No create right</Badge>
          )
        }
      />

      <div className="mb-4 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-xs text-cyan-900">
        <span className="font-semibold">Where to add a Site:</span> Click a customer in the left list →
        on the right panel click <strong>+ Add Site</strong>. Sites always belong to a customer. You
        need a site before creating a Job for that customer.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <div className="p-3 border-b border-slate-100">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
          <DataTable headers={['Code', 'Short', 'Customer', 'Contact', 'City', 'Status', 'Sites', 'Jobs']}>
            {filtered.map((c) => {
              const siteCount = sites.filter((s) => s.customerId === c.id).length;
              const jobCount = visibleJobs.filter((j) => j.customerId === c.id).length;
              return (
                <tr
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`cursor-pointer hover:bg-slate-50 transition-colors ${
                    selectedId === c.id ? 'bg-cyan-50' : ''
                  }`}
                >
                  <td className="px-3 py-3 text-xs font-semibold text-cyan-700">{c.code}</td>
                  <td className="px-3 py-3 text-xs font-bold text-slate-800">{c.shortCode}</td>
                  <td className="px-3 py-3 text-xs text-slate-900 font-medium">{c.name}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">
                    <div>{c.contactPerson}</div>
                    <div className="text-[10px]">{c.phone}</div>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">{c.city}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-700">{siteCount}</td>
                  <td className="px-3 py-3 text-xs text-slate-700">{jobCount}</td>
                </tr>
              );
            })}
          </DataTable>
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-400">
              No customers yet. Click <strong>+ New Customer</strong> first.
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          {!selected ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Select a customer to view / add sites and jobs
            </div>
          ) : (
            <div>
              <div className="border-b border-slate-100 p-4">
                <div className="text-sm font-bold text-slate-900">{selected.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {selected.contactPerson} · {selected.email}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {selected.address}, {selected.city}
                </div>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <StatusBadge status={selected.status} />
                  <Badge color="slate">Short: {selected.shortCode}</Badge>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sites ({selectedSites.length})
                  </div>
                  {canAdd && (
                    <Button size="sm" onClick={openAddSite}>
                      + Add Site
                    </Button>
                  )}
                </div>
                <div className="space-y-2 mb-4">
                  {selectedSites.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-2.5"
                    >
                      <div className="text-xs font-semibold text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-500">{s.location}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        GPS {s.gpsLat.toFixed(4)}, {s.gpsLng.toFixed(4)} · {s.areaSize}
                      </div>
                      {s.notes && (
                        <div className="text-[10px] text-slate-500 mt-1">{s.notes}</div>
                      )}
                    </div>
                  ))}
                  {selectedSites.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center">
                      <div className="text-xs text-slate-400 mb-2">No sites registered</div>
                      {canAdd && (
                        <Button size="sm" variant="secondary" onClick={openAddSite}>
                          + Add first site
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Jobs ({selectedJobs.length})
                </div>
                <div className="space-y-2">
                  {selectedJobs.map((j) => (
                    <button
                      key={j.id}
                      onClick={() => navigate('job-detail', j.id)}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-left hover:border-cyan-300"
                    >
                      <div>
                        <div className="text-xs font-semibold text-cyan-700">{j.jobNo}</div>
                        <div className="text-[11px] text-slate-500">{j.title}</div>
                      </div>
                      <StatusBadge status={j.status} />
                    </button>
                  ))}
                  {selectedJobs.length === 0 && (
                    <div className="text-xs text-slate-400">No jobs for this customer yet</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* New Customer */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Register Customer">
        <div className="space-y-3">
          <Input
            label="Company Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. ALWESAM"
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
            placeholder="e.g. WE (used in WE_HASH_0000)"
          />
          <p className="text-[11px] text-slate-500 -mt-1">
            Job cards use:{' '}
            <span className="font-mono font-semibold text-slate-700">
              {form.shortCode || 'XX'}_ENG_0000
            </span>
          </p>
          <Input
            label="Contact Person"
            value={form.contactPerson}
            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
          />
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
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })
              }
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Register</Button>
          </div>
        </div>
      </Modal>

      {/* Add Site */}
      <Modal
        open={showSite}
        onClose={() => setShowSite(false)}
        title={`Add Site · ${selected?.name || ''}`}
      >
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Customer: <span className="font-semibold text-slate-900">{selected?.name}</span>
          </div>
          <Input
            label="Site Name"
            value={siteForm.name}
            onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
            placeholder="e.g. ALWESAM Main Pit"
          />
          <Input
            label="Location"
            value={siteForm.location}
            onChange={(e) => setSiteForm({ ...siteForm, location: e.target.value })}
            placeholder="e.g. Dubai Industrial Area"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="GPS Latitude"
              value={siteForm.gpsLat}
              onChange={(e) => setSiteForm({ ...siteForm, gpsLat: e.target.value })}
              placeholder="25.2769"
            />
            <Input
              label="GPS Longitude"
              value={siteForm.gpsLng}
              onChange={(e) => setSiteForm({ ...siteForm, gpsLng: e.target.value })}
              placeholder="55.2962"
            />
          </div>
          <Input
            label="Area Size"
            value={siteForm.areaSize}
            onChange={(e) => setSiteForm({ ...siteForm, areaSize: e.target.value })}
            placeholder="e.g. 10 hectares"
          />
          <Textarea
            label="Notes"
            value={siteForm.notes}
            onChange={(e) => setSiteForm({ ...siteForm, notes: e.target.value })}
            placeholder="Optional site notes…"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowSite(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSite}>Save Site</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
