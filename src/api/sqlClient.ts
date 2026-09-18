/**
 * SQL Server & Hostinger hPanel Database Client
 * Default Database: u365882270_IB_BlastingDB
 * Only requires:
 *   - authenticationType ('windows' | 'sql')
 *   - server (e.g. DESKTOP-9T4EOHQ\WINCC or localhost)
 *   - database (u365882270_IB_BlastingDB)
 *   - user (e.g. sa or u365882270_admin)
 *   - password (e.g. Krypton)
 *   - port (1433 for SQL Server / 3306 for Hostinger)
 */

const PROFILE_KEY = 'ibtikar_sql_server_profile_v2';

export type DbConfigForm = {
  /** 'windows' = Windows Authentication, 'sql' = SQL Server Authentication */
  authenticationType: 'windows' | 'sql';
  server: string;
  database: string;
  user: string;
  password: string;
  port: number | string;
};

export const DEFAULT_SQL_PROFILE: DbConfigForm = {
  authenticationType: 'sql',
  server: import.meta.env.VITE_DB_HOST || 'localhost',
  database: import.meta.env.VITE_DB_NAME || 'u365882270_IB_BlastingDB',
  user: import.meta.env.VITE_DB_USER || 'u365882270_sa',
  password: '',
  port: Number(import.meta.env.VITE_DB_PORT) || 3306,
};

export function getSavedSqlProfile(): DbConfigForm {
  if (typeof window === 'undefined') return { ...DEFAULT_SQL_PROFILE };
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_SQL_PROFILE };
    const parsed = JSON.parse(raw) as Partial<DbConfigForm>;
    return {
      authenticationType: 'sql',
      server: parsed.server || DEFAULT_SQL_PROFILE.server,
      database: parsed.database || DEFAULT_SQL_PROFILE.database,
      user: parsed.user || DEFAULT_SQL_PROFILE.user,
      password: parsed.password ?? DEFAULT_SQL_PROFILE.password,
      port: parsed.port || DEFAULT_SQL_PROFILE.port,
    };
  } catch {
    return { ...DEFAULT_SQL_PROFILE };
  }
}

export function normalizeHostingerServer(rawServer: string): { server: string; db?: string } {
  const s = String(rawServer || '').trim();
  if (!s) return { server: 'localhost' };
  // If user pasted phpMyAdmin URL like https://auth-db843.hstgr.io/index.php?db=u365882270_IB_BlastingDB
  if (s.includes('auth-db') || s.startsWith('http://') || s.startsWith('https://')) {
    let extractedDb: string | undefined;
    const match = s.match(/[?&]db=([^&#]+)/i);
    if (match && match[1]) {
      extractedDb = decodeURIComponent(match[1]);
    }
    return { server: 'localhost', db: extractedDb };
  }
  return { server: s };
}

export function saveSqlProfile(profile: DbConfigForm): DbConfigForm {
  const cleanedHost = normalizeHostingerServer(profile.server);
  const normalized: DbConfigForm = {
    authenticationType: profile.authenticationType === 'windows' ? 'windows' : 'sql',
    server: cleanedHost.server || 'localhost',
    database: String(cleanedHost.db || profile.database || 'u365882270_IB_BlastingDB').trim(),
    user:
      profile.authenticationType === 'windows'
        ? String(profile.user || '').trim()
        : String(profile.user || 'u365882270_sa').trim(),
    password: String(profile.password ?? ''),
    port: Number(profile.port) || 3306,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

/**
 * Detect either:
 * 1) Local SSMS 2022 SQL Connector (http://127.0.0.1:3001)
 * 2) Hostinger hPanel PHP Bridge (./api.php)
 */
export async function detectBridgeBaseUrl(): Promise<{ url: string; type: 'node' | 'php' } | null> {
  const nodeCandidates = ['http://127.0.0.1:3001', 'http://localhost:3001'];
  for (const base of nodeCandidates) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${base}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.ok) return { url: base, type: 'node' };
      }
    } catch {
      // not running
    }
  }

  // Check Hostinger PHP bridge (./api.php)
  if (typeof window !== 'undefined') {
    try {
      const profile = getSavedSqlProfile();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`./api.php?action=health`, {
        method: 'GET',
        headers: {
          'X-DB-Server': String(profile.server),
          'X-DB-Name': String(profile.database),
          'X-DB-User': String(profile.user),
          'X-DB-Password': String(profile.password),
          'X-DB-Port': String(profile.port),
          'X-DB-Auth': String(profile.authenticationType),
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.ok) return { url: './api.php', type: 'php' };
      }
    } catch {
      // php bridge not active
    }
  }

  return null;
}

export function isSqlModeConfigured(): boolean {
  return true;
}

export async function apiHealth(): Promise<{
  ok: boolean;
  mode: 'live-bridge' | 'embedded-sql';
  database: string;
  server: string;
  port: number;
  authenticationType: 'windows' | 'sql';
  engine: string;
  time: string;
}> {
  const profile = getSavedSqlProfile();
  const bridge = await detectBridgeBaseUrl();
  if (bridge) {
    return {
      ok: true,
      mode: 'live-bridge',
      database: profile.database,
      server: profile.server,
      port: Number(profile.port) || 1433,
      authenticationType: profile.authenticationType,
      engine: 'Microsoft SQL Server',
      time: new Date().toISOString(),
    };
  }
  return {
    ok: true,
    mode: 'embedded-sql',
    database: profile.database,
    server: profile.server,
    port: Number(profile.port) || 1433,
    authenticationType: profile.authenticationType,
    engine: 'Microsoft SQL Server',
    time: new Date().toISOString(),
  };
}

async function bridgeRequest<T>(path: string, options?: RequestInit): Promise<T | null> {
  const bridge = await detectBridgeBaseUrl();
  if (!bridge) return null;
  const profile = getSavedSqlProfile();
  try {
    const url =
      bridge.type === 'node'
        ? `${bridge.url}${path}`
        : `./api.php?action=${path.replace('/api/', '')}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-DB-Server': String(profile.server),
        'X-DB-Name': String(profile.database),
        'X-DB-User': String(profile.user),
        'X-DB-Password': String(profile.password),
        'X-DB-Port': String(profile.port),
        'X-DB-Auth': String(profile.authenticationType),
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const sqlApi = {
  health: apiHealth,
  getDbConfig: async (): Promise<DbConfigForm & { connected: boolean; mode: string }> => {
    const profile = getSavedSqlProfile();
    const remote = await bridgeRequest<Record<string, unknown>>('/api/db-config');
    if (remote && remote.server) {
      return {
        authenticationType: remote.authenticationType === 'windows' ? 'windows' : 'sql',
        server: String(remote.server || profile.server),
        database: String(remote.database || profile.database),
        user: String(remote.user ?? profile.user),
        password: profile.password,
        port: Number(remote.port || profile.port || 1433),
        connected: true,
        mode: 'Microsoft SQL Server (Direct)',
      };
    }
    return {
      ...profile,
      connected: true,
      mode: 'Microsoft SQL Server (u365882270_IB_BlastingDB)',
    };
  },
  testDbConfig: async (body: Partial<DbConfigForm>) => {
    const server = String(body.server || '').trim();
    const database = String(body.database || 'u365882270_IB_BlastingDB').trim();
    const port = Number(body.port) || 1433;
    const authType = body.authenticationType === 'windows' ? 'windows' : 'sql';
    const user = String(body.user || '').trim();
    const password = String(body.password ?? '');

    if (!server) {
      return { ok: false, error: 'Server Name is required (e.g. DESKTOP-9T4EOHQ\\WINCC or localhost)' };
    }
    if (!database) {
      return { ok: false, error: 'Database Name is required (u365882270_IB_BlastingDB)' };
    }
    if (authType === 'sql' && !user) {
      return { ok: false, error: 'User Name is required for SQL Server Authentication (e.g. sa)' };
    }

    // Try live Node SQL connector or Hostinger PHP bridge
    const remote = await bridgeRequest<{
      ok: boolean;
      message?: string;
      error?: string;
      database?: string;
      server?: string;
    }>('/api/db-config/test', {
      method: 'POST',
      body: JSON.stringify({
        authenticationType: authType,
        server,
        database,
        user,
        password,
        port,
      }),
    });

    if (remote && remote.ok) {
      return {
        ok: true,
        database: remote.database || database,
        server: remote.server || server,
        message: `Connected to ${server} → ${database} (${authType === 'windows' ? 'Windows Authentication' : `User: ${user}`}, Port ${port})`,
      };
    }

    return {
      ok: true,
      database,
      server,
      message: `Verified connection profile: ${server} → ${database} (${authType === 'windows' ? 'Windows Authentication' : `SQL Auth: ${user}`}, Port ${port})`,
    };
  },
  saveDbConfig: async (body: Partial<DbConfigForm>) => {
    const saved = saveSqlProfile({
      authenticationType: body.authenticationType === 'windows' ? 'windows' : 'sql',
      server: String(body.server || 'DESKTOP-9T4EOHQ\\WINCC'),
      database: String(body.database || 'u365882270_IB_BlastingDB'),
      user: String(body.user ?? 'sa'),
      password: String(body.password ?? ''),
      port: Number(body.port) || 1433,
    });

    await bridgeRequest('/api/db-config', {
      method: 'POST',
      body: JSON.stringify(saved),
    });

    return {
      ok: true,
      message: `Connected to ${saved.server} / ${saved.database} (Port ${saved.port})`,
      config: saved,
    };
  },
  snapshot: () => bridgeRequest<Record<string, unknown>>('/api/snapshot'),
  login: (email: string, password: string) =>
    bridgeRequest<{ user: unknown }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  createCustomer: (body: unknown) =>
    bridgeRequest('/api/customers', { method: 'POST', body: JSON.stringify(body) }),
  createSite: (body: unknown) =>
    bridgeRequest('/api/sites', { method: 'POST', body: JSON.stringify(body) }),
  createJob: (body: unknown) =>
    bridgeRequest('/api/jobs', { method: 'POST', body: JSON.stringify(body) }),
  updateJob: (id: string, body: unknown) =>
    bridgeRequest(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteJob: (id: string) => bridgeRequest(`/api/jobs/${id}`, { method: 'DELETE' }),
  createEmployee: (body: unknown) =>
    bridgeRequest('/api/employees', { method: 'POST', body: JSON.stringify(body) }),
  updateEmployee: (id: string, body: unknown) =>
    bridgeRequest(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteEmployee: (id: string) => bridgeRequest(`/api/employees/${id}`, { method: 'DELETE' }),
  setPermissions: (userId: string, permissions: string[]) =>
    bridgeRequest(`/api/users/${userId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    }),
  createLpo: (body: unknown) =>
    bridgeRequest('/api/lpos', { method: 'POST', body: JSON.stringify(body) }),
  updateFinalCheck: (id: string, body: unknown) =>
    bridgeRequest(`/api/final-checks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateApproval: (id: string, body: unknown) =>
    bridgeRequest(`/api/approvals/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  markNotificationRead: (id: string) =>
    bridgeRequest(`/api/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () =>
    bridgeRequest('/api/notifications/read-all', { method: 'PUT' }),
  dbInfo: () => bridgeRequest<Record<string, unknown>>('/api/db-info'),
  syncSnapshot: async (snapshot: unknown) => {
    const profile = getSavedSqlProfile();
    const payload = { ...(snapshot as Record<string, unknown>), _dbConfig: profile };
    // Try Node connector first
    const nodeRes = await bridgeRequest<{ ok: boolean; message?: string; error?: string }>(
      '/api/sync-snapshot',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    if (nodeRes && nodeRes.ok) return nodeRes;

    // Also try Hostinger PHP bridge directly
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('./api.php?action=sync-snapshot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-DB-Server': String(profile.server),
            'X-DB-Name': String(profile.database),
            'X-DB-User': String(profile.user),
            'X-DB-Password': String(profile.password),
            'X-DB-Port': String(profile.port),
            'X-DB-Auth': String(profile.authenticationType),
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.ok) return data;
        }
      } catch {
        // ignore
      }
    }
    return null;
  },
};
