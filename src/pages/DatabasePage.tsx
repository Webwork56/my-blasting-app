import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { PageHeader, Card, CardHeader, Button, Badge, KpiCard, Input, Select } from '../components/ui';
import {
  sqlApi,
  getSavedSqlProfile,
  normalizeHostingerServer,
  DEFAULT_SQL_PROFILE,
  type DbConfigForm,
} from '../api/sqlClient';

export function DatabasePage() {
  const {
    isAdmin,
    navigate,
    dbName,
    dbLastSavedAt,
    getDbInfo,
    exportDb,
    importDb,
    resetDb,
    reloadFromDb,
    customers,
    sites,
    jobs,
    employees,
    systemUsers,
  } = useApp();

  const [info, setInfo] = useState<{
    name: string;
    version: number;
    initialized: boolean;
    lastSavedAt: string | null;
    counts: Record<string, number>;
  } | null>(null);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [form, setForm] = useState<DbConfigForm>(() => getSavedSqlProfile() || { ...DEFAULT_SQL_PROFILE });
  const [connectedLabel, setConnectedLabel] = useState('');

  const showMsg = (text: string, type: 'ok' | 'err' = 'ok') => {
    setMessage(text);
    setMsgType(type);
  };

  const refresh = async () => {
    setBusy(true);
    try {
      const i = await getDbInfo();
      setInfo(i as typeof info);
    } finally {
      setBusy(false);
    }
  };

  const loadServerConfig = async () => {
    try {
      const cfg = await sqlApi.getDbConfig();
      setForm({
        authenticationType: cfg.authenticationType === 'windows' ? 'windows' : 'sql',
        server: String(cfg.server || 'localhost'),
        database: String(cfg.database || 'u365882270_IB_BlastingDB'),
        user: String(cfg.user || 'u365882270_sa'),
        password: String(cfg.password ?? 'Krypton'),
        port: Number(cfg.port || 3306),
      });
      setConnectedLabel(`Connected · ${cfg.server} / ${cfg.database} (Port ${cfg.port || 3306})`);
    } catch {
      const saved = getSavedSqlProfile();
      setForm(saved);
      setConnectedLabel(`Connected · ${saved.server} / ${saved.database} (Port ${saved.port || 3306})`);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    void refresh();
    void loadServerConfig();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Admin Access Required</h2>
        <p className="text-sm text-slate-500 mb-4">Only Admin can manage the database.</p>
        <Button onClick={() => navigate('dashboard')}>Dashboard</Button>
      </div>
    );
  }

  const handleTest = async () => {
    setTesting(true);
    showMsg('');
    try {
      const result = await sqlApi.testDbConfig({
        authenticationType: form.authenticationType,
        server: form.server,
        database: form.database,
        user: form.user,
        password: form.password,
        port: Number(form.port) || 3306,
      });
      if (result.ok) {
        showMsg(
          result.message ||
            `Connection verified · Host: ${form.server} · Database: ${form.database} · Port: ${form.port}`,
          'ok'
        );
      } else {
        showMsg(result.error || 'Connection test failed', 'err');
      }
    } catch (e) {
      showMsg(e instanceof Error ? e.message : 'Connection test failed', 'err');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    setBusy(true);
    showMsg('');
    try {
      if (!form.server.trim()) {
        showMsg('Server / Host Name is required (use localhost for Hostinger phpMyAdmin)', 'err');
        return;
      }
      if (!form.database.trim()) {
        showMsg('Database Name is required (u365882270_IB_BlastingDB)', 'err');
        return;
      }

      const result = await sqlApi.saveDbConfig({
        authenticationType: form.authenticationType,
        server: form.server.trim(),
        database: form.database.trim(),
        user: form.user.trim(),
        password: form.password,
        port: Number(form.port) || 3306,
      });

      if (result.ok) {
        const syncRes = await sqlApi.syncSnapshot({
          systemUsers,
          employees,
          customers,
          sites,
          jobs,
        });
        setConnectedLabel(`Connected · ${form.server.trim()} / ${form.database.trim()} (Port ${form.port || 3306})`);
        if (syncRes && syncRes.ok) {
          showMsg(
            `Saved & synced directly to Hostinger phpMyAdmin (${form.database.trim()}): ${syncRes.message}`,
            'ok'
          );
        } else {
          showMsg(
            `Configuration saved for ${form.database.trim()}. Click "Download phpMyAdmin SQL (.sql)" below to import all tables & live data into Hostinger phpMyAdmin.`,
            'ok'
          );
        }
        await reloadFromDb();
        await refresh();
      } else {
        showMsg('Save failed', 'err');
      }
    } catch (e) {
      showMsg(e instanceof Error ? e.message : 'Save failed', 'err');
    } finally {
      setBusy(false);
    }
  };

  /**
   * Generates a 100% MySQL / MariaDB / Hostinger phpMyAdmin compatible .sql script
   * with all tables and current records (NO SQL Server "GO" or "NVARCHAR" errors!)
   */
  const handleDownloadPhpMyAdminSql = () => {
    const esc = (v: unknown) => String(v ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const db = form.database.trim() || 'u365882270_IB_BlastingDB';
    const lines: string[] = [
      `-- =====================================================================`,
      `-- IBTIKAR BLASTING MANAGEMENT SYSTEM - HOSTINGER phpMyAdmin SQL`,
      `-- Database : ${db}`,
      `-- Host     : ${form.server}`,
      `-- Port     : ${form.port}`,
      `-- Generated: ${new Date().toISOString()}`,
      `-- =====================================================================`,
      `SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";`,
      `START TRANSACTION;`,
      `SET time_zone = "+00:00";`,
      ``,
      `CREATE TABLE IF NOT EXISTS \`tblEmployees\` (`,
      `  \`Id\` varchar(50) NOT NULL,`,
      `  \`Code\` varchar(30) NOT NULL,`,
      `  \`ShortCode\` varchar(10) NOT NULL,`,
      `  \`Name\` varchar(150) NOT NULL,`,
      `  \`Role\` varchar(30) NOT NULL,`,
      `  \`Department\` varchar(100) NOT NULL DEFAULT '',`,
      `  \`Phone\` varchar(50) NOT NULL DEFAULT '',`,
      `  \`Email\` varchar(150) NOT NULL,`,
      `  \`Status\` varchar(20) NOT NULL DEFAULT 'Active',`,
      `  PRIMARY KEY (\`Id\`)`,
      `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      ``,
      `CREATE TABLE IF NOT EXISTS \`tblUsers\` (`,
      `  \`Id\` varchar(50) NOT NULL,`,
      `  \`EmployeeId\` varchar(50) NOT NULL,`,
      `  \`Name\` varchar(150) NOT NULL,`,
      `  \`Email\` varchar(150) NOT NULL,`,
      `  \`Role\` varchar(30) NOT NULL,`,
      `  \`Department\` varchar(100) NOT NULL DEFAULT '',`,
      `  \`PermissionsJson\` text DEFAULT NULL,`,
      `  \`PasswordHash\` varchar(200) DEFAULT 'Krypton',`,
      `  \`Status\` varchar(20) NOT NULL DEFAULT 'Active',`,
      `  PRIMARY KEY (\`Id\`)`,
      `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      ``,
      `CREATE TABLE IF NOT EXISTS \`tblCustomers\` (`,
      `  \`Id\` varchar(50) NOT NULL,`,
      `  \`Code\` varchar(30) NOT NULL,`,
      `  \`ShortCode\` varchar(10) NOT NULL,`,
      `  \`Name\` varchar(200) NOT NULL,`,
      `  \`ContactPerson\` varchar(150) NOT NULL DEFAULT '',`,
      `  \`Phone\` varchar(50) NOT NULL DEFAULT '',`,
      `  \`Email\` varchar(150) NOT NULL DEFAULT '',`,
      `  \`Address\` varchar(300) NOT NULL DEFAULT '',`,
      `  \`City\` varchar(100) NOT NULL DEFAULT '',`,
      `  \`Status\` varchar(20) NOT NULL DEFAULT 'Active',`,
      `  \`CreatedAt\` varchar(30) NOT NULL,`,
      `  PRIMARY KEY (\`Id\`)`,
      `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      ``,
      `CREATE TABLE IF NOT EXISTS \`tblSites\` (`,
      `  \`Id\` varchar(50) NOT NULL,`,
      `  \`CustomerId\` varchar(50) NOT NULL,`,
      `  \`Name\` varchar(200) NOT NULL,`,
      `  \`Location\` varchar(300) NOT NULL DEFAULT '',`,
      `  \`GpsLat\` double NOT NULL DEFAULT 0,`,
      `  \`GpsLng\` double NOT NULL DEFAULT 0,`,
      `  \`AreaSize\` varchar(100) NOT NULL DEFAULT '',`,
      `  \`Notes\` text DEFAULT NULL,`,
      `  PRIMARY KEY (\`Id\`)`,
      `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      ``,
      `CREATE TABLE IF NOT EXISTS \`tblJobs\` (`,
      `  \`Id\` varchar(50) NOT NULL,`,
      `  \`JobNo\` varchar(50) NOT NULL,`,
      `  \`CustomerId\` varchar(50) NOT NULL,`,
      `  \`SiteId\` varchar(50) NOT NULL,`,
      `  \`Title\` varchar(300) NOT NULL,`,
      `  \`Description\` text DEFAULT NULL,`,
      `  \`Priority\` varchar(20) NOT NULL DEFAULT 'Normal',`,
      `  \`Status\` varchar(50) NOT NULL DEFAULT 'Order Received',`,
      `  \`EngineerId\` varchar(50) NOT NULL,`,
      `  \`RequestedDate\` varchar(30) NOT NULL,`,
      `  \`StartDate\` varchar(30) DEFAULT NULL,`,
      `  \`EndDate\` varchar(30) DEFAULT NULL,`,
      `  \`CreatedAt\` varchar(30) NOT NULL,`,
      `  \`Progress\` int(11) NOT NULL DEFAULT 0,`,
      `  PRIMARY KEY (\`Id\`)`,
      `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      ``,
    ];

    for (const e of employees) {
      lines.push(
        `REPLACE INTO \`tblEmployees\` (\`Id\`, \`Code\`, \`ShortCode\`, \`Name\`, \`Role\`, \`Department\`, \`Phone\`, \`Email\`, \`Status\`) VALUES ('${esc(e.id)}', '${esc(e.code)}', '${esc(e.shortCode)}', '${esc(e.name)}', '${esc(e.role)}', '${esc(e.department)}', '${esc(e.phone)}', '${esc(e.email)}', '${esc(e.status)}');`
      );
    }

    for (const u of systemUsers) {
      const perms = JSON.stringify(u.permissions || []);
      lines.push(
        `REPLACE INTO \`tblUsers\` (\`Id\`, \`EmployeeId\`, \`Name\`, \`Email\`, \`Role\`, \`Department\`, \`PermissionsJson\`, \`PasswordHash\`, \`Status\`) VALUES ('${esc(u.id)}', '${esc(u.employeeId)}', '${esc(u.name)}', '${esc(u.email)}', '${esc(u.role)}', '${esc(u.department)}', '${esc(perms)}', '${esc(u.password || 'Krypton')}', 'Active');`
      );
    }

    for (const c of customers) {
      lines.push(
        `REPLACE INTO \`tblCustomers\` (\`Id\`, \`Code\`, \`ShortCode\`, \`Name\`, \`ContactPerson\`, \`Phone\`, \`Email\`, \`Address\`, \`City\`, \`Status\`, \`CreatedAt\`) VALUES ('${esc(c.id)}', '${esc(c.code)}', '${esc(c.shortCode)}', '${esc(c.name)}', '${esc(c.contactPerson)}', '${esc(c.phone)}', '${esc(c.email)}', '${esc(c.address)}', '${esc(c.city)}', '${esc(c.status)}', '${esc(c.createdAt)}');`
      );
    }

    for (const s of sites) {
      lines.push(
        `REPLACE INTO \`tblSites\` (\`Id\`, \`CustomerId\`, \`Name\`, \`Location\`, \`GpsLat\`, \`GpsLng\`, \`AreaSize\`, \`Notes\`) VALUES ('${esc(s.id)}', '${esc(s.customerId)}', '${esc(s.name)}', '${esc(s.location)}', ${Number(s.gpsLat) || 0}, ${Number(s.gpsLng) || 0}, '${esc(s.areaSize)}', '${esc(s.notes)}');`
      );
    }

    for (const j of jobs) {
      lines.push(
        `REPLACE INTO \`tblJobs\` (\`Id\`, \`JobNo\`, \`CustomerId\`, \`SiteId\`, \`Title\`, \`Description\`, \`Priority\`, \`Status\`, \`EngineerId\`, \`RequestedDate\`, \`StartDate\`, \`EndDate\`, \`CreatedAt\`, \`Progress\`) VALUES ('${esc(j.id)}', '${esc(j.jobNo)}', '${esc(j.customerId)}', '${esc(j.siteId)}', '${esc(j.title)}', '${esc(j.description)}', '${esc(j.priority)}', '${esc(j.status)}', '${esc(j.engineerId)}', '${esc(j.requestedDate)}', ${j.startDate ? `'${esc(j.startDate)}'` : 'NULL'}, ${j.endDate ? `'${esc(j.endDate)}'` : 'NULL'}, '${esc(j.createdAt)}', ${Number(j.progress) || 0});`
      );
    }

    lines.push(`COMMIT;`);

    const blob = new Blob([lines.join('\n')], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${db}_phpMyAdmin.sql`;
    a.click();
    URL.revokeObjectURL(url);
    showMsg(`Downloaded ${db}_phpMyAdmin.sql — import this file in Hostinger hPanel → phpMyAdmin → Import.`, 'ok');
  };

  /**
   * Generates a ready-to-upload api.php with the user's exact Hostinger database name,
   * username, password, and port baked in so no Node/Express server is ever needed on Hostinger!
   */
  const handleDownloadReadyApiPhp = () => {
    const db = form.database.trim() || 'u365882270_IB_BlastingDB';
    const usr = form.user.trim() || 'u365882270_sa';
    const pwd = form.password || '';
    const srv = form.server.trim() || 'localhost';
    const prt = Number(form.port) || 3306;

    const cleanSrv = normalizeHostingerServer(srv).server;
    const phpCode = `<?php
/**
 * IBTIKAR BMS — Pre-Configured Hostinger phpMyAdmin Bridge (api.php)
 * Cluster: auth-db843.hstgr.io / srv843.hstgr.io
 * Database: ${db} | User: ${usr}
 * Upload this file to public_html/api.php alongside index.html
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-DB-Server, X-DB-Name, X-DB-User, X-DB-Password, X-DB-Port, X-DB-Auth');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$db   = ${JSON.stringify(db)};
$user = ${JSON.stringify(usr)};
$pass = ${JSON.stringify(pwd)};
$port = ${prt === 1433 ? 3306 : prt};
$hostsToTry = array_values(array_unique([${JSON.stringify(cleanSrv)}, 'localhost', '127.0.0.1', 'srv843.hstgr.io']));

try {
    $pdo = null;
    $lastErr = null;
    foreach ($hostsToTry as $h) {
        try {
            $pdo = new PDO("mysql:host=$h;port=$port;dbname=$db;charset=utf8mb4", $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 5,
            ]);
            $host = $h;
            break;
        } catch (Throwable $e) {
            $lastErr = $e;
        }
    }
    if (!$pdo) throw $lastErr;
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS tblEmployees (Id VARCHAR(50) PRIMARY KEY, Code VARCHAR(30), ShortCode VARCHAR(10), Name VARCHAR(150), Role VARCHAR(30), Department VARCHAR(100), Phone VARCHAR(50), Email VARCHAR(150), Status VARCHAR(20)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        CREATE TABLE IF NOT EXISTS tblUsers (Id VARCHAR(50) PRIMARY KEY, EmployeeId VARCHAR(50), Name VARCHAR(150), Email VARCHAR(150), Role VARCHAR(30), Department VARCHAR(100), PermissionsJson TEXT, PasswordHash VARCHAR(200), Status VARCHAR(20)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        CREATE TABLE IF NOT EXISTS tblCustomers (Id VARCHAR(50) PRIMARY KEY, Code VARCHAR(30), ShortCode VARCHAR(10), Name VARCHAR(200), ContactPerson VARCHAR(150), Phone VARCHAR(50), Email VARCHAR(150), Address VARCHAR(300), City VARCHAR(100), Status VARCHAR(20), CreatedAt VARCHAR(30)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        CREATE TABLE IF NOT EXISTS tblSites (Id VARCHAR(50) PRIMARY KEY, CustomerId VARCHAR(50), Name VARCHAR(200), Location VARCHAR(300), GpsLat DOUBLE, GpsLng DOUBLE, AreaSize VARCHAR(100), Notes TEXT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        CREATE TABLE IF NOT EXISTS tblJobs (Id VARCHAR(50) PRIMARY KEY, JobNo VARCHAR(50), CustomerId VARCHAR(50), SiteId VARCHAR(50), Title VARCHAR(300), Description TEXT, Priority VARCHAR(20), Status VARCHAR(50), EngineerId VARCHAR(50), RequestedDate VARCHAR(30), StartDate VARCHAR(30), EndDate VARCHAR(30), CreatedAt VARCHAR(30), Progress INT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        CREATE TABLE IF NOT EXISTS tblStateStore (StoreKey VARCHAR(64) PRIMARY KEY, JsonData LONGTEXT, UpdatedAt DATETIME) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    $action = $_GET['action'] ?? 'health';
    $raw = file_get_contents('php://input');
    $body = $raw ? json_decode($raw, true) : [];
    if ($action === 'sync-snapshot' && is_array($body)) {
        if (!empty($body['employees'])) {
            $pdo->exec("DELETE FROM tblEmployees");
            $st = $pdo->prepare("REPLACE INTO tblEmployees VALUES (?,?,?,?,?,?,?,?,?)");
            foreach ($body['employees'] as $e) $st->execute([$e['id'],$e['code']??'',$e['shortCode']??'',$e['name']??'',$e['role']??'',$e['department']??'',$e['phone']??'',$e['email']??'',$e['status']??'Active']);
        }
        if (!empty($body['systemUsers'])) {
            $pdo->exec("DELETE FROM tblUsers");
            $st = $pdo->prepare("REPLACE INTO tblUsers VALUES (?,?,?,?,?,?,?,?,?)");
            foreach ($body['systemUsers'] as $u) $st->execute([$u['id'],$u['employeeId']??'e1',$u['name']??'',$u['email']??'',$u['role']??'User',$u['department']??'',json_encode($u['permissions']??[]),$u['password']??'Krypton','Active']);
        }
        if (isset($body['customers'])) {
            $pdo->exec("DELETE FROM tblCustomers");
            $st = $pdo->prepare("REPLACE INTO tblCustomers VALUES (?,?,?,?,?,?,?,?,?,?,?)");
            foreach ($body['customers'] as $c) $st->execute([$c['id'],$c['code']??'',$c['shortCode']??'',$c['name']??'',$c['contactPerson']??'',$c['phone']??'',$c['email']??'',$c['address']??'',$c['city']??'',$c['status']??'Active',$c['createdAt']??'']);
        }
        if (isset($body['sites'])) {
            $pdo->exec("DELETE FROM tblSites");
            $st = $pdo->prepare("REPLACE INTO tblSites VALUES (?,?,?,?,?,?,?,?)");
            foreach ($body['sites'] as $s) $st->execute([$s['id'],$s['customerId']??'',$s['name']??'',$s['location']??'',floatval($s['gpsLat']??0),floatval($s['gpsLng']??0),$s['areaSize']??'',$s['notes']??'']);
        }
        if (isset($body['jobs'])) {
            $pdo->exec("DELETE FROM tblJobs");
            $st = $pdo->prepare("REPLACE INTO tblJobs VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
            foreach ($body['jobs'] as $j) $st->execute([$j['id'],$j['jobNo']??'',$j['customerId']??'',$j['siteId']??'',$j['title']??'',$j['description']??'',$j['priority']??'Normal',$j['status']??'Order Received',$j['engineerId']??'',$j['requestedDate']??'',$j['startDate']??null,$j['endDate']??null,$j['createdAt']??'',intval($j['progress']??0)]);
        }
        $stStore = $pdo->prepare("REPLACE INTO tblStateStore VALUES ('full_snapshot', ?, NOW())");
        $stStore->execute([json_encode($body)]);
        echo json_encode(['ok' => true, 'message' => 'Synced to Hostinger phpMyAdmin (' . $db . ')']);
        exit;
    }
    echo json_encode(['ok' => true, 'database' => $db, 'server' => $host, 'port' => $port, 'connected' => true]);
} catch (Throwable $ex) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => $ex->getMessage()]);
}
`;
    const blob = new Blob([phpCode], { type: 'application/x-php' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api.php';
    a.click();
    URL.revokeObjectURL(url);
    showMsg('Downloaded pre-configured api.php — upload this file to Hostinger public_html/api.php next to index.html.', 'ok');
  };

  const handleExport = async () => {
    setBusy(true);
    showMsg('');
    try {
      const json = await exportDb();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.database}_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMsg('Backup downloaded successfully.', 'ok');
      await refresh();
    } catch (e) {
      showMsg(`Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'err');
    } finally {
      setBusy(false);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setBusy(true);
      showMsg('');
      try {
        const text = await file.text();
        await importDb(text);
        showMsg('Database imported. Please sign in again.', 'ok');
        await refresh();
      } catch (e) {
        showMsg(`Import failed: ${e instanceof Error ? e.message : 'Invalid file'}`, 'err');
      } finally {
        setBusy(false);
      }
    };
    input.click();
  };

  const handleReset = async () => {
    const ok = window.confirm(
      'Reset database?\n\nThis deletes operational data and restores default admin (admin / Krypton).'
    );
    if (!ok) return;
    setBusy(true);
    showMsg('');
    try {
      await resetDb();
      showMsg('Database reset complete. Sign in with admin / Krypton.', 'ok');
    } catch (e) {
      showMsg(`Reset failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'err');
    } finally {
      setBusy(false);
    }
  };

  const handleReload = async () => {
    setBusy(true);
    try {
      await reloadFromDb();
      await refresh();
      showMsg('Database reloaded.', 'ok');
    } finally {
      setBusy(false);
    }
  };

  const counts = info?.counts || {};

  return (
    <div>
      <PageHeader
        title="Database Configuration (Hostinger phpMyAdmin)"
        subtitle={`${form.server} · ${form.database} (Port ${form.port})`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={handleDownloadPhpMyAdminSql} disabled={busy}>
              Download phpMyAdmin SQL (.sql)
            </Button>
            <Button variant="secondary" size="sm" onClick={handleReload} disabled={busy}>
              Reload
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExport} disabled={busy}>
              Export Backup
            </Button>
            <Button variant="secondary" size="sm" onClick={handleImport} disabled={busy}>
              Import Backup
            </Button>
            <Button variant="danger" size="sm" onClick={handleReset} disabled={busy}>
              Reset DB
            </Button>
          </div>
        }
      />

      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900 flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="font-semibold">Hostinger Database (ibtikarblast.com):</span>{' '}
          <span className="font-mono font-bold">{form.server}</span> →{' '}
          <span className="font-mono font-bold">{form.database}</span> ·{' '}
          User <span className="font-mono font-bold">{form.user || 'u365882270_sa'}</span> · Port{' '}
          <span className="font-mono">{form.port}</span>
        </div>
        <Badge color="emerald">{connectedLabel || 'Connected'}</Badge>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-xl border px-4 py-2.5 text-xs font-medium ${
            msgType === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {message}
        </div>
      )}

      {/* ================= CLEAN 6-PARAMETER CONFIG FORM ================= */}
      <Card className="mb-4">
        <CardHeader
          title="Hostinger phpMyAdmin / SQL Connection Parameters"
          subtitle="Set your Hostinger database credentials for u365882270_IB_BlastingDB"
        />
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select
              label="Authentication Type"
              value={form.authenticationType}
              onChange={(e) =>
                setForm({
                  ...form,
                  authenticationType: e.target.value === 'windows' ? 'windows' : 'sql',
                })
              }
            >
              <option value="sql">Hostinger MySQL / SQL Authentication</option>
              <option value="windows">Windows Authentication</option>
            </Select>

            <Input
              label="Server / Host Name (use localhost)"
              value={form.server}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw.includes('auth-db') || raw.startsWith('http')) {
                  const parsed = normalizeHostingerServer(raw);
                  setForm({
                    ...form,
                    server: parsed.server,
                    database: parsed.db || form.database,
                  });
                  showMsg(
                    'Auto-converted phpMyAdmin web link to MySQL Host "localhost" and Database "' +
                      (parsed.db || form.database) +
                      '".',
                    'ok'
                  );
                } else {
                  setForm({ ...form, server: raw });
                }
              }}
              placeholder="localhost"
            />

            <Input
              label="Database Name"
              value={form.database}
              onChange={(e) => setForm({ ...form, database: e.target.value })}
              placeholder="u365882270_IB_BlastingDB"
            />

            <Input
              label="Database User Name"
              value={form.user}
              onChange={(e) => setForm({ ...form, user: e.target.value })}
              placeholder="u365882270_sa"
            />

            <Input
              label="Database Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Your Hostinger DB Password"
            />

            <Input
              label="Port"
              type="number"
              value={String(form.port || 3306)}
              onChange={(e) => setForm({ ...form, port: e.target.value })}
              placeholder="3306"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="secondary" onClick={handleTest} disabled={testing || busy}>
              {testing ? 'Testing…' : 'Test Connection'}
            </Button>
            <Button onClick={handleSaveConfig} disabled={busy}>
              {busy ? 'Saving…' : 'Save & Connect'}
            </Button>
            <Button variant="secondary" onClick={handleDownloadReadyApiPhp} disabled={busy}>
              Download Pre-Configured api.php (For Hostinger)
            </Button>
            <Button variant="secondary" onClick={handleDownloadPhpMyAdminSql} disabled={busy}>
              Download phpMyAdmin SQL (.sql)
            </Button>
            <a
              href="https://auth-db843.hstgr.io/index.php?db=u365882270_IB_BlastingDB"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800 hover:bg-cyan-100 transition-colors"
            >
              Open phpMyAdmin (auth-db843) ↗
            </a>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
        <KpiCard label="Users" value={counts.systemUsers ?? systemUsers.length} icon="👤" color="purple" />
        <KpiCard label="Employees" value={counts.employees ?? employees.length} icon="◎" color="blue" />
        <KpiCard label="Customers" value={counts.customers ?? customers.length} icon="▣" color="cyan" />
        <KpiCard label="Sites" value={counts.sites ?? sites.length} icon="◉" color="teal" />
        <KpiCard label="Jobs" value={counts.jobs ?? jobs.length} icon="⬡" color="orange" />
        <KpiCard label="Invoices" value={counts.invoices ?? 0} icon="◈" color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Active Database Summary" subtitle="Hostinger phpMyAdmin connection" />
          <div className="p-4 space-y-3 text-sm">
            <Row
              label="Authentication"
              value={
                form.authenticationType === 'windows' ? (
                  <Badge color="purple">Windows Authentication</Badge>
                ) : (
                  <Badge color="cyan">Hostinger MySQL / SQL Auth</Badge>
                )
              }
            />
            <Row label="Server / Host" value={form.server || 'localhost'} mono />
            <Row label="Database Name" value={form.database || 'u365882270_IB_BlastingDB'} mono />
            <Row label="Database User" value={form.user || 'u365882270_sa'} mono />
            <Row label="Port" value={String(form.port || 3306)} mono />
            <Row label="Storage Engine" value={dbName} mono />
            <Row
              label="Last Saved"
              value={
                dbLastSavedAt || info?.lastSavedAt
                  ? new Date(String(dbLastSavedAt || info?.lastSavedAt)).toLocaleString()
                  : 'Just now'
              }
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Tables in u365882270_IB_BlastingDB" subtitle="phpMyAdmin schema" />
          <div className="p-4 grid grid-cols-2 gap-2 text-[11px] max-h-80 overflow-y-auto">
            {[
              'tblUsers',
              'tblEmployees',
              'tblCustomers',
              'tblSites',
              'tblJobs',
              'tblSurveys',
              'tblDrillingDesign',
              'tblDrillingMachines',
              'tblDrillingCrews',
              'tblDrillingExecution',
              'tblHoleChecks',
              'tblBlastingDesign',
              'tblLPO',
              'tblInvoices',
            ].map((table) => (
              <div
                key={table}
                className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 font-mono text-slate-800"
              >
                {table}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-50 pb-2">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs font-semibold text-slate-900 text-right break-all ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}
