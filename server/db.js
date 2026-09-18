import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

function getEnvConfig(overrides = {}) {
  const host = String(overrides.server || overrides.host || process.env.DB_HOST || 'localhost').trim();
  const database = String(overrides.database || process.env.DB_NAME || '').trim();
  const user = String(overrides.user || process.env.DB_USER || '').trim();
  const password =
    overrides.password !== undefined
      ? String(overrides.password)
      : String(process.env.DB_PASSWORD || '');
  const port = Number(overrides.port || process.env.DB_PORT || 3306);
  const connectionLimit = Number(process.env.DB_CONNECTION_LIMIT || 10);

  return {
    host: host.includes('\\') || host.includes('auth-db') ? 'localhost' : host,
    database,
    user,
    password,
    port: port === 1433 ? 3306 : port,
    waitForConnections: true,
    connectionLimit,
    queueLimit: 0,
    charset: 'utf8mb4',
  };
}

let currentPoolConfig = getEnvConfig();
/** @type {mysql.Pool | null} */
let pool = null;

export function getConfigMeta(maskPassword = true) {
  return {
    authenticationType: 'sql',
    server: currentPoolConfig.host,
    database: currentPoolConfig.database,
    user: currentPoolConfig.user,
    password: maskPassword && currentPoolConfig.password ? '********' : currentPoolConfig.password,
    passwordSet: Boolean(currentPoolConfig.password),
    port: currentPoolConfig.port,
    engine: 'MySQL (MariaDB)',
  };
}

export async function closePool() {
  if (pool) {
    try {
      await pool.end();
    } catch (err) {
      console.error('[MySQL Pool Error] Failed to close pool cleanly:', err.message);
    }
    pool = null;
  }
}

export async function getPool() {
  if (pool) return pool;
  try {
    pool = mysql.createPool(currentPoolConfig);
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return pool;
  } catch (err) {
    pool = null;
    console.error(
      `[MySQL Connection Error] Failed to connect to MySQL database "${currentPoolConfig.database}" at ${currentPoolConfig.host}:${currentPoolConfig.port} as user "${currentPoolConfig.user}":`,
      err.message
    );
    throw err;
  }
}

/**
 * Execute a parameterized MySQL query using the connection pool.
 * Supports ? positional parameters (array).
 */
export async function query(sqlText, params = []) {
  try {
    const activePool = await getPool();
    const [rows] = await activePool.execute(sqlText, Array.isArray(params) ? params : []);
    return rows;
  } catch (err) {
    console.error(`[MySQL Query Error] ${err.message} | SQL: ${sqlText}`);
    throw err;
  }
}

/**
 * Ensure all application tables exist in the MySQL / MariaDB database.
 */
export async function ensureMysqlSchema() {
  const activePool = await getPool();
  const statements = [
    `CREATE TABLE IF NOT EXISTS tblEmployees (
      Id VARCHAR(50) PRIMARY KEY,
      Code VARCHAR(30) NOT NULL,
      ShortCode VARCHAR(10) NOT NULL,
      Name VARCHAR(150) NOT NULL,
      Role VARCHAR(30) NOT NULL,
      Department VARCHAR(100) DEFAULT '',
      Phone VARCHAR(50) DEFAULT '',
      Email VARCHAR(150) NOT NULL,
      Status VARCHAR(20) DEFAULT 'Active',
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS tblUsers (
      Id VARCHAR(50) PRIMARY KEY,
      EmployeeId VARCHAR(50) NOT NULL,
      Name VARCHAR(150) NOT NULL,
      Email VARCHAR(150) NOT NULL UNIQUE,
      Role VARCHAR(30) NOT NULL,
      Department VARCHAR(100) DEFAULT '',
      PermissionsJson TEXT,
      PasswordHash VARCHAR(200) DEFAULT 'Krypton',
      Status VARCHAR(20) DEFAULT 'Active',
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS tblCustomers (
      Id VARCHAR(50) PRIMARY KEY,
      Code VARCHAR(30) NOT NULL,
      ShortCode VARCHAR(10) NOT NULL,
      Name VARCHAR(200) NOT NULL,
      ContactPerson VARCHAR(150) DEFAULT '',
      Phone VARCHAR(50) DEFAULT '',
      Email VARCHAR(150) DEFAULT '',
      Address VARCHAR(300) DEFAULT '',
      City VARCHAR(100) DEFAULT '',
      Status VARCHAR(20) DEFAULT 'Active',
      CreatedAt VARCHAR(30) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS tblSites (
      Id VARCHAR(50) PRIMARY KEY,
      CustomerId VARCHAR(50) NOT NULL,
      Name VARCHAR(200) NOT NULL,
      Location VARCHAR(300) DEFAULT '',
      GpsLat DOUBLE DEFAULT 0,
      GpsLng DOUBLE DEFAULT 0,
      AreaSize VARCHAR(100) DEFAULT '',
      Notes TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS tblJobs (
      Id VARCHAR(50) PRIMARY KEY,
      JobNo VARCHAR(50) NOT NULL UNIQUE,
      CustomerId VARCHAR(50) NOT NULL,
      SiteId VARCHAR(50) NOT NULL,
      Title VARCHAR(300) NOT NULL,
      Description TEXT,
      Priority VARCHAR(20) DEFAULT 'Normal',
      Status VARCHAR(50) DEFAULT 'Order Received',
      EngineerId VARCHAR(50) NOT NULL,
      RequestedDate VARCHAR(30) NOT NULL,
      StartDate VARCHAR(30) NULL,
      EndDate VARCHAR(30) NULL,
      CreatedAt VARCHAR(30) NOT NULL,
      Progress INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS tblStateStore (
      StoreKey VARCHAR(64) PRIMARY KEY,
      JsonData LONGTEXT NOT NULL,
      UpdatedAt DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ];

  for (const stmt of statements) {
    await activePool.query(stmt);
  }

  // Seed default admin user if tblUsers is empty
  const [userRows] = await activePool.query('SELECT COUNT(*) AS c FROM tblUsers');
  const count = Number(userRows?.[0]?.c || 0);
  if (count === 0) {
    await activePool.execute(
      `INSERT IGNORE INTO tblEmployees (Id, Code, ShortCode, Name, Role, Department, Phone, Email, Status)
       VALUES ('e1', 'EMP-001', 'ADMIN', 'admin', 'Admin', 'Administration', '', 'admin', 'Active')`
    );
    const adminPerms = JSON.stringify([
      'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.delete',
      'customers.view', 'customers.create', 'customers.edit',
      'employees.view', 'employees.manage',
      'reports.view', 'reports.print',
      'finance.view', 'approvals.manage', 'procurement.manage', 'documents.view',
    ]);
    await activePool.execute(
      `INSERT IGNORE INTO tblUsers (Id, EmployeeId, Name, Email, Role, Department, PermissionsJson, PasswordHash, Status)
       VALUES ('u1', 'e1', 'admin', 'admin', 'Admin', 'Administration', ?, 'Krypton', 'Active')`,
      [adminPerms]
    );
  }
}

export async function testConnection(input = {}) {
  const cfg = getEnvConfig(input);
  let tempPool = null;
  try {
    tempPool = mysql.createPool(cfg);
    const [rows] = await tempPool.query(
      'SELECT DATABASE() AS dbName, @@hostname AS serverName, CURRENT_USER() AS loginUser'
    );
    return {
      ok: true,
      database: rows?.[0]?.dbName || cfg.database,
      server: rows?.[0]?.serverName || cfg.host,
      loginUser: rows?.[0]?.loginUser || cfg.user,
      authenticationType: 'sql',
      message: `MySQL (MariaDB) connection successful to ${cfg.database} on ${cfg.host}:${cfg.port}`,
    };
  } catch (err) {
    console.error('[MySQL Test Connection Error]:', err.message);
    throw err;
  } finally {
    if (tempPool) {
      await tempPool.end().catch(() => {});
    }
  }
}

export async function saveAndReconnect(input = {}) {
  await closePool();
  currentPoolConfig = getEnvConfig({
    ...input,
    password:
      input.password && input.password !== '********'
        ? input.password
        : currentPoolConfig.password,
  });
  await getPool();
  await ensureMysqlSchema();
  return getConfigMeta(true);
}
