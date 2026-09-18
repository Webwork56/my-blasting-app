<?php
/**
 * IBTIKAR BMS — Hostinger MySQL / MariaDB Backend Bridge (api.php)
 * Reads credentials from .env (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT)
 * Uses persistent PDO MySQL connection pooling (PDO::ATTR_PERSISTENT => true)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-DB-Server, X-DB-Name, X-DB-User, X-DB-Password, X-DB-Port, X-DB-Auth');
header('Access-Control-Allow-Private-Network: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/**
 * Load environment variables from .env file in same folder or parent folder
 */
function loadDotEnv() {
    $candidates = [__DIR__ . '/.env', dirname(__DIR__) . '/.env'];
    $env = [];
    foreach ($candidates as $file) {
        if (file_exists($file)) {
            $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || strpos($line, '#') === 0) continue;
                $parts = explode('=', $line, 2);
                if (count($parts) === 2) {
                    $key = trim($parts[0]);
                    $val = trim($parts[1]);
                    $val = trim($val, "\"'");
                    $env[$key] = $val;
                }
            }
            break;
        }
    }
    return $env;
}

$ENV_VARS = loadDotEnv();
$configFile = __DIR__ . '/db-config.json';

function getSavedConfig() {
    global $ENV_VARS, $configFile;
    $defaults = [
        'authenticationType' => 'sql',
        'server' => $ENV_VARS['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost',
        'database' => $ENV_VARS['DB_NAME'] ?? getenv('DB_NAME') ?: 'u365882270_IB_BlastingDB',
        'user' => $ENV_VARS['DB_USER'] ?? getenv('DB_USER') ?: 'u365882270_sa',
        'password' => $ENV_VARS['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?: '',
        'port' => intval($ENV_VARS['DB_PORT'] ?? getenv('DB_PORT') ?: 3306),
    ];
    if (file_exists($configFile)) {
        $raw = json_decode(file_get_contents($configFile), true);
        if (is_array($raw) && !empty($raw['password'])) {
            return array_merge($defaults, $raw);
        }
    }
    return $defaults;
}

function sanitizeHost($raw) {
    $h = trim(strval($raw));
    if ($h === '' || stripos($h, 'auth-db') !== false || stripos($h, 'http://') !== false || stripos($h, 'https://') !== false || strpos($h, '\\') !== false) {
        return 'localhost';
    }
    return $h;
}

function resolveRequestConfig($body = []) {
    $saved = getSavedConfig();
    $server = $body['server'] ?? ($_SERVER['HTTP_X_DB_SERVER'] ?? $saved['server']);
    $passFromReq = $body['password'] ?? ($_SERVER['HTTP_X_DB_PASSWORD'] ?? '');
    $finalPass = ($passFromReq !== '' && $passFromReq !== '********') ? $passFromReq : $saved['password'];

    return [
        'authenticationType' => 'sql',
        'server' => sanitizeHost($server),
        'mysqlHost' => sanitizeHost($server),
        'database' => $body['database'] ?? ($_SERVER['HTTP_X_DB_NAME'] ?? $saved['database']),
        'user' => $body['user'] ?? ($_SERVER['HTTP_X_DB_USER'] ?? $saved['user']),
        'password' => $finalPass,
        'port' => intval($body['port'] ?? ($_SERVER['HTTP_X_DB_PORT'] ?? $saved['port'] ?: 3306)),
    ];
}

/**
 * Create a pooled/persistent PDO MySQL connection with error logging
 */
function getPdoConnection($cfg) {
    $db = $cfg['database'];
    $user = $cfg['user'];
    $pass = $cfg['password'];
    $port = intval($cfg['port'] ?: 3306);
    if ($port === 1433) $port = 3306;

    $hostsToTry = array_values(array_unique([$cfg['mysqlHost'], 'localhost', '127.0.0.1']));
    $lastError = null;

    foreach ($hostsToTry as $host) {
        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_PERSISTENT => true, // Connection pooling across PHP worker requests
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 5,
            ]);
            return [$pdo, 'mysql'];
        } catch (Throwable $e) {
            $lastError = $e;
            error_log("[IBTIKAR MySQL Connection Error] Host={$host}:{$port} DB={$db} User={$user} Error=" . $e->getMessage());
        }
    }

    throw new Exception("MySQL Connection Failed for {$user}@{$cfg['mysqlHost']}:{$port}/{$db} — " . ($lastError ? $lastError->getMessage() : 'Unknown error'));
}

function ensureSchema($pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS tblEmployees (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS tblUsers (
            Id VARCHAR(50) PRIMARY KEY,
            EmployeeId VARCHAR(50) NOT NULL,
            Name VARCHAR(150) NOT NULL,
            Email VARCHAR(150) NOT NULL,
            Role VARCHAR(30) NOT NULL,
            Department VARCHAR(100) DEFAULT '',
            PermissionsJson TEXT,
            PasswordHash VARCHAR(200) DEFAULT 'Krypton',
            Status VARCHAR(20) DEFAULT 'Active',
            CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS tblCustomers (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS tblSites (
            Id VARCHAR(50) PRIMARY KEY,
            CustomerId VARCHAR(50) NOT NULL,
            Name VARCHAR(200) NOT NULL,
            Location VARCHAR(300) DEFAULT '',
            GpsLat DOUBLE DEFAULT 0,
            GpsLng DOUBLE DEFAULT 0,
            AreaSize VARCHAR(100) DEFAULT '',
            Notes TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS tblJobs (
            Id VARCHAR(50) PRIMARY KEY,
            JobNo VARCHAR(50) NOT NULL,
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS tblStateStore (
            StoreKey VARCHAR(64) PRIMARY KEY,
            JsonData LONGTEXT NOT NULL,
            UpdatedAt DATETIME NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $stmt = $pdo->query("SELECT COUNT(*) AS c FROM tblUsers");
    $row = $stmt->fetch();
    if (intval($row['c'] ?? 0) === 0) {
        $pdo->exec("INSERT IGNORE INTO tblEmployees (Id, Code, ShortCode, Name, Role, Department, Phone, Email, Status)
                    VALUES ('e1', 'EMP-001', 'ADMIN', 'admin', 'Admin', 'Administration', '', 'admin', 'Active')");
        $perms = '["jobs.view","jobs.create","jobs.edit","jobs.delete","customers.view","customers.create","customers.edit","employees.view","employees.manage","reports.view","reports.print","finance.view","approvals.manage","procurement.manage","documents.view"]';
        $ins = $pdo->prepare("INSERT IGNORE INTO tblUsers (Id, EmployeeId, Name, Email, Role, Department, PermissionsJson, PasswordHash, Status)
                              VALUES ('u1', 'e1', 'admin', 'admin', 'Admin', 'Administration', ?, 'Krypton', 'Active')");
        $ins->execute([$perms]);
    }
}

$action = $_GET['action'] ?? 'health';
$rawInput = file_get_contents('php://input');
$body = $rawInput ? json_decode($rawInput, true) : [];
if (!is_array($body)) $body = [];

try {
    if ($action === 'db-config' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $cfg = getSavedConfig();
        $cfg['password'] = !empty($cfg['password']) ? '********' : '';
        echo json_encode(array_merge($cfg, ['ok' => true, 'connected' => true]));
        exit;
    }

    if ($action === 'save-config' || $action === 'db-config' || $action === 'test' || $action === 'db-config/test') {
        $cfg = resolveRequestConfig($body);
        if ($action === 'save-config' || ($action === 'db-config' && $_SERVER['REQUEST_METHOD'] === 'POST')) {
            @file_put_contents($configFile, json_encode([
                'authenticationType' => 'sql',
                'server' => $cfg['server'],
                'database' => $cfg['database'],
                'user' => $cfg['user'],
                'password' => $cfg['password'],
                'port' => $cfg['port'],
            ], JSON_PRETTY_PRINT));
        }
        list($pdo, $driver) = getPdoConnection($cfg);
        ensureSchema($pdo);
        echo json_encode([
            'ok' => true,
            'database' => $cfg['database'],
            'server' => $cfg['server'],
            'port' => $cfg['port'],
            'driver' => $driver,
            'message' => "Connected to MySQL (MariaDB) database {$cfg['database']} as {$cfg['user']}@{$cfg['server']}:{$cfg['port']}",
        ]);
        exit;
    }

    if ($action === 'snapshot') {
        $cfg = resolveRequestConfig($body);
        list($pdo, $driver) = getPdoConnection($cfg);
        ensureSchema($pdo);

        $st = $pdo->prepare("SELECT JsonData FROM tblStateStore WHERE StoreKey = 'full_snapshot'");
        $st->execute();
        $savedSnap = $st->fetch();

        $users = [];
        foreach ($pdo->query("SELECT * FROM tblUsers")->fetchAll() as $r) {
            $users[] = [
                'id' => $r['Id'],
                'employeeId' => $r['EmployeeId'],
                'name' => $r['Name'],
                'email' => $r['Email'],
                'role' => $r['Role'],
                'department' => $r['Department'],
                'permissions' => json_decode($r['PermissionsJson'] ?: '[]', true),
                'password' => $r['PasswordHash'] ?: 'Krypton',
            ];
        }

        $employees = [];
        foreach ($pdo->query("SELECT * FROM tblEmployees")->fetchAll() as $r) {
            $employees[] = [
                'id' => $r['Id'],
                'code' => $r['Code'],
                'shortCode' => $r['ShortCode'],
                'name' => $r['Name'],
                'role' => $r['Role'],
                'department' => $r['Department'],
                'phone' => $r['Phone'],
                'email' => $r['Email'],
                'status' => $r['Status'],
            ];
        }

        $customers = [];
        foreach ($pdo->query("SELECT * FROM tblCustomers")->fetchAll() as $r) {
            $customers[] = [
                'id' => $r['Id'],
                'code' => $r['Code'],
                'shortCode' => $r['ShortCode'],
                'name' => $r['Name'],
                'contactPerson' => $r['ContactPerson'],
                'phone' => $r['Phone'],
                'email' => $r['Email'],
                'address' => $r['Address'],
                'city' => $r['City'],
                'status' => $r['Status'],
                'createdAt' => $r['CreatedAt'],
            ];
        }

        $sites = [];
        foreach ($pdo->query("SELECT * FROM tblSites")->fetchAll() as $r) {
            $sites[] = [
                'id' => $r['Id'],
                'customerId' => $r['CustomerId'],
                'name' => $r['Name'],
                'location' => $r['Location'],
                'gpsLat' => floatval($r['GpsLat']),
                'gpsLng' => floatval($r['GpsLng']),
                'areaSize' => $r['AreaSize'],
                'notes' => $r['Notes'],
            ];
        }

        $jobs = [];
        foreach ($pdo->query("SELECT * FROM tblJobs")->fetchAll() as $r) {
            $jobs[] = [
                'id' => $r['Id'],
                'jobNo' => $r['JobNo'],
                'customerId' => $r['CustomerId'],
                'siteId' => $r['SiteId'],
                'title' => $r['Title'],
                'description' => $r['Description'],
                'priority' => $r['Priority'],
                'status' => $r['Status'],
                'engineerId' => $r['EngineerId'],
                'requestedDate' => $r['RequestedDate'],
                'startDate' => $r['StartDate'],
                'endDate' => $r['EndDate'],
                'createdAt' => $r['CreatedAt'],
                'progress' => intval($r['Progress']),
            ];
        }

        $extra = ($savedSnap && !empty($savedSnap['JsonData'])) ? json_decode($savedSnap['JsonData'], true) : [];
        if (!is_array($extra)) $extra = [];

        echo json_encode(array_merge([
            'surveys' => [],
            'drillingDesigns' => [],
            'machines' => [],
            'crews' => [],
            'drillingExecutions' => [],
            'holeChecks' => [],
            'blastingDesigns' => [],
            'suppliers' => [],
            'materials' => [],
            'lpos' => [],
            'supplierConfirmations' => [],
            'finalChecks' => [],
            'approvals' => [],
            'blastSchedules' => [],
            'blastExecutions' => [],
            'blastReports' => [],
            'jobCosts' => [],
            'invoices' => [],
            'payments' => [],
            'documents' => [],
            'notifications' => [],
        ], $extra, [
            'systemUsers' => $users,
            'employees' => $employees,
            'customers' => $customers,
            'sites' => $sites,
            'jobs' => $jobs,
        ]));
        exit;
    }

    if ($action === 'sync-snapshot') {
        $cfg = resolveRequestConfig($body['_dbConfig'] ?? []);
        list($pdo, $driver) = getPdoConnection($cfg);
        ensureSchema($pdo);

        $syncedCustomers = 0;
        $syncedSites = 0;
        $syncedEmployees = 0;
        $syncedJobs = 0;

        if (!empty($body['employees']) && is_array($body['employees'])) {
            $pdo->exec("DELETE FROM tblEmployees");
            $stmt = $pdo->prepare("REPLACE INTO tblEmployees (Id, Code, ShortCode, Name, Role, Department, Phone, Email, Status) VALUES (?,?,?,?,?,?,?,?,?)");
            foreach ($body['employees'] as $e) {
                $stmt->execute([
                    $e['id'], $e['code'] ?? 'EMP-001', $e['shortCode'] ?? 'EMP', $e['name'] ?? '',
                    $e['role'] ?? 'Engineer', $e['department'] ?? '', $e['phone'] ?? '', $e['email'] ?? '', $e['status'] ?? 'Active'
                ]);
                $syncedEmployees++;
            }
        }

        if (!empty($body['systemUsers']) && is_array($body['systemUsers'])) {
            $pdo->exec("DELETE FROM tblUsers");
            $stmt = $pdo->prepare("REPLACE INTO tblUsers (Id, EmployeeId, Name, Email, Role, Department, PermissionsJson, PasswordHash, Status) VALUES (?,?,?,?,?,?,?,?,?)");
            foreach ($body['systemUsers'] as $u) {
                $stmt->execute([
                    $u['id'], $u['employeeId'] ?? 'e1', $u['name'] ?? '', $u['email'] ?? '',
                    $u['role'] ?? 'User', $u['department'] ?? '', json_encode($u['permissions'] ?? []),
                    $u['password'] ?? 'Krypton', 'Active'
                ]);
            }
        }

        if (isset($body['customers']) && is_array($body['customers'])) {
            $pdo->exec("DELETE FROM tblCustomers");
            $stmt = $pdo->prepare("REPLACE INTO tblCustomers (Id, Code, ShortCode, Name, ContactPerson, Phone, Email, Address, City, Status, CreatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
            foreach ($body['customers'] as $c) {
                $stmt->execute([
                    $c['id'], $c['code'] ?? 'CUS-001', $c['shortCode'] ?? 'CU', $c['name'] ?? '',
                    $c['contactPerson'] ?? '', $c['phone'] ?? '', $c['email'] ?? '', $c['address'] ?? '',
                    $c['city'] ?? '', $c['status'] ?? 'Active', $c['createdAt'] ?? date('Y-m-d')
                ]);
                $syncedCustomers++;
            }
        }

        if (isset($body['sites']) && is_array($body['sites'])) {
            $pdo->exec("DELETE FROM tblSites");
            $stmt = $pdo->prepare("REPLACE INTO tblSites (Id, CustomerId, Name, Location, GpsLat, GpsLng, AreaSize, Notes) VALUES (?,?,?,?,?,?,?,?)");
            foreach ($body['sites'] as $s) {
                $stmt->execute([
                    $s['id'], $s['customerId'] ?? '', $s['name'] ?? '', $s['location'] ?? '',
                    floatval($s['gpsLat'] ?? 0), floatval($s['gpsLng'] ?? 0), $s['areaSize'] ?? '', $s['notes'] ?? ''
                ]);
                $syncedSites++;
            }
        }

        if (isset($body['jobs']) && is_array($body['jobs'])) {
            $pdo->exec("DELETE FROM tblJobs");
            $stmt = $pdo->prepare("REPLACE INTO tblJobs (Id, JobNo, CustomerId, SiteId, Title, Description, Priority, Status, EngineerId, RequestedDate, StartDate, EndDate, CreatedAt, Progress) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
            foreach ($body['jobs'] as $j) {
                $stmt->execute([
                    $j['id'], $j['jobNo'] ?? '', $j['customerId'] ?? '', $j['siteId'] ?? '',
                    $j['title'] ?? '', $j['description'] ?? '', $j['priority'] ?? 'Normal',
                    $j['status'] ?? 'Order Received', $j['engineerId'] ?? '', $j['requestedDate'] ?? date('Y-m-d'),
                    $j['startDate'] ?? null, $j['endDate'] ?? null, $j['createdAt'] ?? date('Y-m-d'), intval($j['progress'] ?? 0)
                ]);
                $syncedJobs++;
            }
        }

        $stmtStore = $pdo->prepare("REPLACE INTO tblStateStore (StoreKey, JsonData, UpdatedAt) VALUES ('full_snapshot', ?, NOW())");
        $stmtStore->execute([json_encode($body)]);

        echo json_encode([
            'ok' => true,
            'message' => "Saved to MySQL ({$cfg['database']}): {$syncedCustomers} Customers, {$syncedSites} Sites, {$syncedEmployees} Employees, {$syncedJobs} Jobs",
        ]);
        exit;
    }

    $cfg = resolveRequestConfig([]);
    list($pdo, $driver) = getPdoConnection($cfg);
    ensureSchema($pdo);
    echo json_encode([
        'ok' => true,
        'database' => $cfg['database'],
        'server' => $cfg['server'],
        'port' => $cfg['port'],
        'engine' => 'MySQL (MariaDB)',
    ]);
} catch (Throwable $e) {
    error_log("[IBTIKAR MySQL API Error]: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage(),
    ]);
}
