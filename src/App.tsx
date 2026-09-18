import { AppProvider, useApp } from './store/AppContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { JobsPage, JobDetailPage } from './pages/Jobs';
import { CustomersPage } from './pages/Customers';
import {
  SurveyPage,
  DrillingPage,
  BlastingPage,
  ResourcesPage,
} from './pages/Operations';
import {
  ProcurementPage,
  FinalCheckPage,
  ApprovalsPage,
  SchedulingPage,
} from './pages/Supply';
import {
  ReportsPage,
  FinancePage,
  DocumentsPage,
  EmployeesPage,
  NotificationsPage,
} from './pages/Output';
import { PrintReportsPage } from './pages/PrintReports';
import { UserPermissionsPage } from './pages/UserPermissions';
import { UserAccountsPage } from './pages/UserAccounts';
import { DatabasePage } from './pages/DatabasePage';

function AppRouter() {
  const { isAuthenticated, page, isAdmin, navigate, hasPermission } = useApp();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const denied = (title: string, message: string) => (
    <Layout>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">{title}</h2>
        <p className="text-sm text-slate-500 mb-4 max-w-sm">{message}</p>
        <button
          type="button"
          onClick={() => navigate('dashboard')}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
        >
          Go to Dashboard
        </button>
      </div>
    </Layout>
  );

  if ((page === 'user-permissions' || page === 'database' || page === 'user-accounts') && !isAdmin) {
    return denied(
      'Admin Access Required',
      page === 'database'
        ? 'Only Admin can manage the database.'
        : page === 'user-accounts'
          ? 'Only Admin can create and control user accounts.'
          : 'Only Admin can grant or revoke user permissions.'
    );
  }

  if (
    page === 'employees' &&
    !isAdmin &&
    !hasPermission('employees.manage') &&
    !hasPermission('employees.view')
  ) {
    return denied(
      'Access Denied',
      'You do not have permission to view employees. Ask Admin to grant access.'
    );
  }

  if (page === 'finance' && !isAdmin && !hasPermission('finance.view')) {
    return denied('Access Denied', 'You do not have finance.view permission.');
  }

  if (
    (page === 'reports' || page === 'print-reports') &&
    !isAdmin &&
    !hasPermission('reports.view') &&
    !hasPermission('reports.print')
  ) {
    return denied('Access Denied', 'You do not have reports access.');
  }

  if ((page === 'jobs' || page === 'job-detail') && !isAdmin && !hasPermission('jobs.view')) {
    return denied('Access Denied', 'You do not have jobs.view permission.');
  }

  let content: React.ReactNode;
  switch (page) {
    case 'dashboard':
      content = <DashboardPage />;
      break;
    case 'jobs':
      content = <JobsPage />;
      break;
    case 'job-detail':
      content = <JobDetailPage />;
      break;
    case 'customers':
      content = <CustomersPage />;
      break;
    case 'survey':
      content = <SurveyPage />;
      break;
    case 'drilling':
      content = <DrillingPage />;
      break;
    case 'blasting':
      content = <BlastingPage />;
      break;
    case 'resources':
      content = <ResourcesPage />;
      break;
    case 'procurement':
      content = <ProcurementPage />;
      break;
    case 'final-check':
      content = <FinalCheckPage />;
      break;
    case 'approvals':
      content = <ApprovalsPage />;
      break;
    case 'scheduling':
      content = <SchedulingPage />;
      break;
    case 'reports':
      content = <ReportsPage />;
      break;
    case 'print-reports':
      content = <PrintReportsPage />;
      break;
    case 'finance':
      content = <FinancePage />;
      break;
    case 'documents':
      content = <DocumentsPage />;
      break;
    case 'employees':
      content = <EmployeesPage />;
      break;
    case 'user-accounts':
      content = <UserAccountsPage />;
      break;
    case 'user-permissions':
      content = <UserPermissionsPage />;
      break;
    case 'database':
      content = <DatabasePage />;
      break;
    case 'notifications':
      content = <NotificationsPage />;
      break;
    default:
      content = <DashboardPage />;
  }

  return <Layout>{content}</Layout>;
}

import { Component, type ErrorInfo, type ReactNode } from 'react';

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(err: Error) {
    return { hasError: true, message: err?.message || 'Unexpected error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg">
            <h2 className="text-base font-bold text-slate-900 mb-2">Session Recovered</h2>
            <p className="text-xs text-slate-500 mb-4">{this.state.message}</p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </AppErrorBoundary>
  );
}
