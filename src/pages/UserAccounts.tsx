import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import type { UserRole } from '../data/types';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Modal,
  Badge,
  StatusBadge,
  DataTable,
  KpiCard,
} from '../components/ui';

const NON_ADMIN_ROLES: UserRole[] = [
  'User',
  'Engineer',
  'Supervisor',
  'Operator',
  'Finance',
  'PRO',
  'Viewer',
];

export function UserAccountsPage() {
  const {
    isAdmin,
    navigate,
    systemUsers,
    employees,
    addUserAccount,
    updateUserAccount,
    deleteUserAccount,
    user,
  } = useApp();

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'User' as UserRole,
    department: 'Operations',
    shortCode: '',
    phone: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return systemUsers
      .filter((u) => u.role !== 'Admin')
      .filter((u) => {
        if (!q) return true;
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q)
        );
      });
  }, [systemUsers, search]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Admin Access Required</h2>
        <p className="text-sm text-slate-500 mb-4 max-w-sm">
          Only Admin can create and manage user accounts. Users cannot access this page, Database, or
          User Permissions.
        </p>
        <Button onClick={() => navigate('dashboard')}>Dashboard</Button>
      </div>
    );
  }

  const resetForm = () =>
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'User',
      department: 'Operations',
      shortCode: '',
      phone: '',
      status: 'Active',
    });

  const openAdd = () => {
    resetForm();
    setError('');
    setShowAdd(true);
  };

  const openEdit = (id: string) => {
    const u = systemUsers.find((x) => x.id === id);
    if (!u || u.role === 'Admin') return;
    const emp = employees.find((e) => e.id === u.employeeId);
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: (NON_ADMIN_ROLES.includes(u.role) ? u.role : 'User') as UserRole,
      department: u.department || 'Operations',
      shortCode: emp?.shortCode || '',
      phone: emp?.phone || '',
      status: emp?.status || 'Active',
    });
    setError('');
    setEditId(id);
  };

  const handleAdd = () => {
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Name, username and password are required');
      return;
    }
    if (form.password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    const ok = addUserAccount({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role === 'Admin' ? 'User' : form.role,
      department: form.department,
      shortCode: form.shortCode,
      phone: form.phone,
    });
    if (!ok) {
      setError('Could not create account. Username may already exist.');
      return;
    }
    setShowAdd(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editId) return;
    setError('');
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and username are required');
      return;
    }
    const ok = updateUserAccount(editId, {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password || undefined,
      role: form.role === 'Admin' ? 'User' : form.role,
      department: form.department,
      status: form.status,
    });
    if (!ok) {
      setError('Could not update account');
      return;
    }
    setEditId(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const ok = deleteUserAccount(deleteId);
    setDeleteId(null);
    if (!ok) {
      window.alert('Cannot delete this account (Admin accounts are protected).');
    }
  };

  return (
    <div>
      <PageHeader
        title="User Accounts"
        subtitle="Admin-only · Create and control login users (no admin/database/permission access)"
        actions={<Button onClick={openAdd}>+ Add User Account</Button>}
      />

      <div className="mb-4 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-xs text-cyan-900">
        <span className="font-semibold">Rule:</span> User accounts created here cannot access{' '}
        <strong>Database</strong>, <strong>User Permissions</strong>, or other Admin-only controls.
        Admin manages their rights from User Permissions if needed.
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="User Accounts" value={systemUsers.filter((u) => u.role !== 'Admin').length} icon="👤" color="blue" />
        <KpiCard label="Total Logins" value={systemUsers.length} icon="◎" color="cyan" />
        <KpiCard label="Employees" value={employees.length} icon="▣" color="purple" />
        <KpiCard label="Admins" value={systemUsers.filter((u) => u.role === 'Admin').length} icon="🔑" color="amber" />
      </div>

      <Card className="mb-4 p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users…"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-cyan-500"
        />
      </Card>

      <Card>
        <DataTable headers={['Username', 'Name', 'Role', 'Department', 'Rights', 'Status', 'Actions']}>
          {rows.map((u) => {
            const emp = employees.find((e) => e.id === u.employeeId);
            const rights = u.permissions?.length || 0;
            return (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-3 py-3 text-xs font-semibold text-cyan-700 font-mono">{u.email}</td>
                <td className="px-3 py-3 text-xs text-slate-900 font-medium">{u.name}</td>
                <td className="px-3 py-3">
                  <Badge color={u.role === 'User' ? 'cyan' : 'slate'}>{u.role}</Badge>
                </td>
                <td className="px-3 py-3 text-xs text-slate-600">{u.department}</td>
                <td className="px-3 py-3 text-xs text-slate-500">{rights} permissions</td>
                <td className="px-3 py-3">
                  <StatusBadge status={emp?.status || 'Active'} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(u.id)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteId(u.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
        {rows.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">
            No user accounts yet. Click <strong>+ Add User Account</strong>.
          </div>
        )}
      </Card>

      {/* Protected admin note */}
      <div className="mt-3 text-[11px] text-slate-500">
        Logged in as <span className="font-semibold">{user?.name}</span>. Admin account is protected and
        not listed here for deletion.
      </div>

      {/* Add */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add User Account">
        <AccountForm form={form} setForm={setForm} requirePassword />
        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={() => setShowAdd(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Create Account</Button>
        </div>
      </Modal>

      {/* Edit */}
      <Modal
        open={!!editId}
        onClose={() => {
          setEditId(null);
          resetForm();
        }}
        title="Edit User Account"
      >
        <AccountForm form={form} setForm={setForm} requirePassword={false} />
        <p className="mt-2 text-[11px] text-slate-500">
          Leave password blank to keep the current password.
        </p>
        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
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

      {/* Delete */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete User Account">
        <p className="text-sm text-slate-600 mb-4">
          Delete account{' '}
          <span className="font-semibold">
            {systemUsers.find((u) => u.id === deleteId)?.email}
          </span>
          ? This user will no longer be able to login.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function AccountForm({
  form,
  setForm,
  requirePassword,
}: {
  form: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    department: string;
    shortCode: string;
    phone: string;
    status: 'Active' | 'Inactive';
  };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  requirePassword: boolean;
}) {
  return (
    <div className="space-y-3">
      <Input
        label="Full Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="e.g. Hassan Ali"
      />
      <Input
        label="Username (login)"
        value={form.email}
        onChange={(e) =>
          setForm({
            ...form,
            email: e.target.value.replace(/\s/g, '').toLowerCase(),
          })
        }
        placeholder="e.g. hassan"
      />
      <Input
        label={requirePassword ? 'Password' : 'New Password (optional)'}
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        placeholder={requirePassword ? 'Set password' : 'Leave blank to keep current'}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
        >
          {NON_ADMIN_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <Input
          label="Department"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          placeholder="Operations"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Short Code"
          value={form.shortCode}
          onChange={(e) =>
            setForm({
              ...form,
              shortCode: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6),
            })
          }
          placeholder="e.g. HASH"
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
        This account will <strong>not</strong> have access to Admin menu items: Database, User
        Permissions, or User Accounts.
      </div>
    </div>
  );
}
