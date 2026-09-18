import { useApp, type Page } from '../store/AppContext';
import { cn } from '../utils/cn';

const NAV: { id: Page; label: string; icon: string; section?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈', section: 'Overview' },
  { id: 'jobs', label: 'Jobs / Orders', icon: '▣', section: 'Core' },
  { id: 'customers', label: 'Customers & Sites', icon: '◎' },
  { id: 'survey', label: 'Area & Survey', icon: '◉', section: 'Operations' },
  { id: 'drilling', label: 'Drilling', icon: '⬡' },
  { id: 'blasting', label: 'Blasting Design', icon: '✸' },
  { id: 'resources', label: 'Resources', icon: '⚙' },
  { id: 'procurement', label: 'Procurement', icon: '▤', section: 'Supply' },
  { id: 'final-check', label: 'Final Check', icon: '✓' },
  { id: 'approvals', label: 'Approvals', icon: '⛨' },
  { id: 'scheduling', label: 'Blast Schedule', icon: '◷' },
  { id: 'reports', label: 'Blast Reports', icon: '☰', section: 'Output' },
  { id: 'print-reports', label: 'Print Reports', icon: '🖨' },
  { id: 'finance', label: 'Finance', icon: '◈' },
  { id: 'documents', label: 'Documents', icon: '📁' },
  { id: 'employees', label: 'Employees', icon: '👤', section: 'Admin' },
  { id: 'user-accounts', label: 'User Accounts', icon: '👥' },
  { id: 'user-permissions', label: 'User Permissions', icon: '🔑' },
  { id: 'database', label: 'Database', icon: '🗄' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const {
    user,
    page,
    navigate,
    logout,
    sidebarOpen,
    setSidebarOpen,
    unreadCount,
    isEngineer,
    isAdmin,
    visibleJobs,
    hasPermission,
    canCreateJob,
    canEditJob,
    canDeleteJob,
  } = useApp();

  const visibleNav = NAV.filter((item) => {
    if (item.id === 'employees') return isAdmin || hasPermission('employees.view') || hasPermission('employees.manage');
    // Admin-only control pages — never shown to normal users
    if (item.id === 'user-accounts') return isAdmin;
    if (item.id === 'user-permissions') return isAdmin;
    if (item.id === 'database') return isAdmin;
    if (item.id === 'finance') return isAdmin || hasPermission('finance.view');
    if (item.id === 'print-reports') return isAdmin || hasPermission('reports.print') || hasPermission('reports.view');
    if (item.id === 'reports') return isAdmin || hasPermission('reports.view');
    if (item.id === 'documents') return isAdmin || hasPermission('documents.view');
    if (item.id === 'customers') return isAdmin || hasPermission('customers.view');
    if (item.id === 'jobs' || item.id === 'job-detail') return isAdmin || hasPermission('jobs.view');
    if (item.id === 'procurement') return isAdmin || hasPermission('procurement.manage') || hasPermission('jobs.view');
    if (item.id === 'approvals' || item.id === 'final-check') return isAdmin || hasPermission('approvals.manage') || hasPermission('jobs.view');
    return true;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-sm shadow-md shadow-cyan-500/25">
            IB
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 truncate">IBTIKAR BMS</div>
            <div className="text-[10px] text-cyan-600 font-medium">Blasting Management</div>
          </div>
        </div>

        <nav className="sidebar-scroll flex-1 min-h-0 overflow-y-scroll px-2 py-3 space-y-0.5">
          {visibleNav.map((item) => {
            const active = page === item.id || (page === 'job-detail' && item.id === 'jobs');
            return (
              <div key={item.id}>
                {item.section && (
                  <div className="px-3 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    {item.section}
                  </div>
                )}
                <button
                  onClick={() => navigate(item.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors',
                    active
                      ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  )}
                >
                  <span className="text-sm w-5 text-center opacity-80">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {(item.id === 'employees' ||
                    item.id === 'user-accounts' ||
                    item.id === 'user-permissions' ||
                    item.id === 'database') &&
                    isAdmin && (
                    <span className="text-[9px] font-bold text-purple-600 bg-purple-50 border border-purple-100 rounded px-1">
                      ADMIN
                    </span>
                  )}
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-slate-100 p-3">
          <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-2.5 py-2 border border-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
              {(user?.name || 'A')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-900 truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-500">
                {user?.role} · {user?.department}
              </div>
              {isEngineer && (
                <div className="text-[9px] text-cyan-600 font-medium mt-0.5">
                  {visibleJobs.length} assigned job{visibleJobs.length !== 1 ? 's' : ''}
                </div>
              )}
              {!isAdmin && (
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Rights: {[
                    canCreateJob ? 'Create' : null,
                    canEditJob ? 'Edit' : null,
                    canDeleteJob ? 'Delete' : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'View only'}
                </div>
              )}
            </div>
            <button
              onClick={logout}
              className="text-[10px] text-slate-400 hover:text-red-500 font-medium px-1"
              title="Logout"
            >
              ⎋
            </button>
          </div>
        </div>
      </aside>

      <div className="flex h-screen flex-1 flex-col min-w-0 overflow-hidden">
        <header className="shrink-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
          >
            ☰
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 font-medium">
              IBTIKAR Blasting Management System
              {isEngineer && (
                <span className="ml-2 inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700">
                  Engineer view · My jobs only
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('notifications')}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-slate-500 font-medium">DB Online</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
