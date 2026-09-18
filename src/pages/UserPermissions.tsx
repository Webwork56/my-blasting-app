import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import {
  PageHeader,
  Card,
  CardHeader,
  Button,
  Badge,
  StatusBadge,
} from '../components/ui';
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  type PermissionKey,
  type User,
} from '../data/types';

export function UserPermissionsPage() {
  const {
    isAdmin,
    systemUsers,
    setUserPermissions,
    resetUserPermissions,
    user: currentUser,
    navigate,
  } = useApp();

  const [selectedId, setSelectedId] = useState<string | null>(
    systemUsers.find((u) => u.role !== 'Admin')?.id || systemUsers[0]?.id || null
  );
  const [draft, setDraft] = useState<PermissionKey[] | null>(null);
  const [savedMsg, setSavedMsg] = useState('');

  const selected = systemUsers.find((u) => u.id === selectedId) || null;

  const activePerms: PermissionKey[] = useMemo(() => {
    if (draft && selectedId) return draft;
    if (!selected) return [];
    if (selected.role === 'Admin') return [...ALL_PERMISSIONS.map((p) => p.key)];
    if (selected.permissions) return [...selected.permissions];
    return [...(DEFAULT_ROLE_PERMISSIONS[selected.role] || [])];
  }, [draft, selected, selectedId]);

  const selectUser = (u: User) => {
    setSelectedId(u.id);
    setDraft(null);
    setSavedMsg('');
  };

  const toggle = (key: PermissionKey) => {
    if (!selected || selected.role === 'Admin') return;
    const set = new Set(activePerms);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    setDraft([...set]);
    setSavedMsg('');
  };

  const setGroup = (group: string, on: boolean) => {
    if (!selected || selected.role === 'Admin') return;
    const groupKeys = ALL_PERMISSIONS.filter((p) => p.group === group).map((p) => p.key);
    const set = new Set(activePerms);
    groupKeys.forEach((k) => {
      if (on) set.add(k);
      else set.delete(k);
    });
    setDraft([...set]);
    setSavedMsg('');
  };

  const save = () => {
    if (!selected || selected.role === 'Admin') return;
    // Safety: non-admin users can never receive employees.manage
    const safePerms = activePerms.filter((k) => k !== 'employees.manage');
    const ok = setUserPermissions(selected.id, safePerms);
    if (ok) {
      setDraft(null);
      setSavedMsg(
        `Permissions saved for ${selected.name}. Only the ticked rights apply. If they are logged in, ask them to refresh or re-login for full menu update — job buttons update from live rights immediately for the same browser session when they re-open Jobs.`
      );
    }
  };

  const reset = () => {
    if (!selected || selected.role === 'Admin') return;
    resetUserPermissions(selected.id);
    setDraft(null);
    setSavedMsg('Reset to default role permissions.');
  };

  const grantAll = () => {
    if (!selected || selected.role === 'Admin') return;
    // Never grant employees.manage as "all" for non-admin; keep operational rights only
    const safe = ALL_PERMISSIONS.map((p) => p.key).filter((k) => k !== 'employees.manage');
    setDraft(safe);
    setSavedMsg('');
  };

  const revokeAll = () => {
    if (!selected || selected.role === 'Admin') return;
    // Keep at least jobs.view so they can still open the app usefully — admin can uncheck if wanted
    setDraft([]);
    setSavedMsg('');
  };

  const groups = [...new Set(ALL_PERMISSIONS.map((p) => p.group))];

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Admin Access Required</h2>
        <p className="text-sm text-slate-500 mb-4 max-w-sm">
          Only Admin can grant or revoke user permissions.
        </p>
        <Button onClick={() => navigate('dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  const dirty = draft !== null;

  return (
    <div>
      <PageHeader
        title="User Permissions"
        subtitle="Grant or remove Read / Write / Delete and other rights per login account"
        actions={
          selected && selected.role !== 'Admin' ? (
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" size="sm" onClick={reset}>
                Reset to Role Default
              </Button>
              <Button variant="secondary" size="sm" onClick={grantAll}>
                Grant All
              </Button>
              <Button variant="secondary" size="sm" onClick={revokeAll}>
                Revoke All
              </Button>
              <Button size="sm" onClick={save} disabled={!dirty}>
                Save Permissions
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="mb-4 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-xs text-cyan-900">
        <span className="font-semibold">How it works:</span> Select a user → tick only the rights
        they should have (e.g. Create Job, Edit Job, Delete Job) → <strong>Save Permissions</strong>.
        If you remove a right, that user loses the button and the action is blocked. Admin always
        keeps full access.
      </div>

      {savedMsg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800 font-medium">
          {savedMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* User list */}
        <Card className="lg:col-span-2">
          <CardHeader title="Login Accounts" subtitle={`${systemUsers.length} users`} />
          <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
            {systemUsers.map((u) => {
              const perms =
                u.role === 'Admin'
                  ? ALL_PERMISSIONS.length
                  : (u.permissions || DEFAULT_ROLE_PERMISSIONS[u.role] || []).length;
              const active = selectedId === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => selectUser(u)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    active ? 'bg-cyan-50 border-l-2 border-l-cyan-500' : 'hover:bg-slate-50 border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[11px] font-bold text-white">
                    {(u.name || 'U')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      {u.name}
                      {currentUser?.id === u.id && <Badge color="cyan">You</Badge>}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge color={u.role === 'Admin' ? 'purple' : 'slate'}>{u.role}</Badge>
                      <span className="text-[10px] text-slate-400">{perms} rights</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Permission matrix */}
        <Card className="lg:col-span-3">
          {!selected ? (
            <div className="p-10 text-center text-sm text-slate-400">Select a user</div>
          ) : (
            <>
              <div className="border-b border-slate-100 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{selected.name}</div>
                    <div className="text-xs text-slate-500">
                      {selected.email} · {selected.department}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color="purple">{selected.role}</Badge>
                    {selected.role === 'Admin' && (
                      <Badge color="emerald">Full access (locked)</Badge>
                    )}
                    {dirty && <Badge color="amber">Unsaved changes</Badge>}
                  </div>
                </div>
              </div>

              {selected.role === 'Admin' ? (
                <div className="p-6 text-sm text-slate-600">
                  Admin accounts always have complete rights. Permissions cannot be reduced for
                  Admin.
                </div>
              ) : (
                <div className="p-4 space-y-5">
                  {/* Quick job rights */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Job rights (most used)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(
                        [
                          ['jobs.view', 'Read / View'],
                          ['jobs.create', 'Create / Write'],
                          ['jobs.edit', 'Modify / Edit'],
                          ['jobs.delete', 'Delete'],
                        ] as const
                      ).map(([key, label]) => {
                        const on = activePerms.includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggle(key)}
                            className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                              on
                                ? 'border-cyan-300 bg-cyan-50 text-cyan-800'
                                : 'border-slate-200 bg-white text-slate-500'
                            }`}
                          >
                            <div className="text-sm font-bold">{on ? '✓' : '○'}</div>
                            <div className="text-[11px] font-semibold mt-0.5">{label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {groups.map((group) => {
                    const items = ALL_PERMISSIONS.filter((p) => p.group === group);
                    const allOn = items.every((p) => activePerms.includes(p.key));
                    const someOn = items.some((p) => activePerms.includes(p.key));
                    return (
                      <div key={group}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-bold text-slate-800">{group}</div>
                          <button
                            type="button"
                            onClick={() => setGroup(group, !allOn)}
                            className="text-[10px] font-semibold text-cyan-700 hover:text-cyan-800"
                          >
                            {allOn ? 'Clear group' : someOn ? 'Enable all' : 'Enable all'}
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {items.map((p) => {
                            const on = activePerms.includes(p.key);
                            return (
                              <label
                                key={p.key}
                                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                                  on
                                    ? 'border-cyan-200 bg-cyan-50/60'
                                    : 'border-slate-100 bg-white hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={() => toggle(p.key)}
                                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold text-slate-800">
                                    {p.label}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">{p.key}</div>
                                </div>
                                <StatusBadge status={on ? 'Allowed' : 'Denied'} />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button variant="secondary" onClick={reset}>
                      Reset Default
                    </Button>
                    <Button onClick={save} disabled={!dirty}>
                      Save Permissions
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
