-- ============================================================================
-- IBTIKAR BLASTING MANAGEMENT SYSTEM
-- Hostinger hPanel / phpMyAdmin (MySQL / MariaDB) Database Script
-- Database: u365882270_IB_BlastingDB
-- ============================================================================
-- HOW TO IMPORT IN HOSTINGER hPANEL:
-- 1. Open Hostinger hPanel -> Databases -> phpMyAdmin
-- 2. Click "Enter phpMyAdmin" next to u365882270_IB_BlastingDB
-- 3. Click the "Import" tab at the top
-- 4. Choose this file (u365882270_IB_BlastingDB_phpMyAdmin.sql) and click "Import"
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE IF NOT EXISTS `tblEmployees` (
  `Id` varchar(50) NOT NULL,
  `Code` varchar(30) NOT NULL,
  `ShortCode` varchar(10) NOT NULL,
  `Name` varchar(150) NOT NULL,
  `Role` varchar(30) NOT NULL,
  `Department` varchar(100) NOT NULL DEFAULT '',
  `Phone` varchar(50) NOT NULL DEFAULT '',
  `Email` varchar(150) NOT NULL,
  `Status` varchar(20) NOT NULL DEFAULT 'Active',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tblUsers` (
  `Id` varchar(50) NOT NULL,
  `EmployeeId` varchar(50) NOT NULL,
  `Name` varchar(150) NOT NULL,
  `Email` varchar(150) NOT NULL,
  `Role` varchar(30) NOT NULL,
  `Department` varchar(100) NOT NULL DEFAULT '',
  `PermissionsJson` text DEFAULT NULL,
  `PasswordHash` varchar(200) DEFAULT 'Krypton',
  `Status` varchar(20) NOT NULL DEFAULT 'Active',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UX_Users_Email` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tblCustomers` (
  `Id` varchar(50) NOT NULL,
  `Code` varchar(30) NOT NULL,
  `ShortCode` varchar(10) NOT NULL,
  `Name` varchar(200) NOT NULL,
  `ContactPerson` varchar(150) NOT NULL DEFAULT '',
  `Phone` varchar(50) NOT NULL DEFAULT '',
  `Email` varchar(150) NOT NULL DEFAULT '',
  `Address` varchar(300) NOT NULL DEFAULT '',
  `City` varchar(100) NOT NULL DEFAULT '',
  `Status` varchar(20) NOT NULL DEFAULT 'Active',
  `CreatedAt` varchar(30) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tblSites` (
  `Id` varchar(50) NOT NULL,
  `CustomerId` varchar(50) NOT NULL,
  `Name` varchar(200) NOT NULL,
  `Location` varchar(300) NOT NULL DEFAULT '',
  `GpsLat` double NOT NULL DEFAULT 0,
  `GpsLng` double NOT NULL DEFAULT 0,
  `AreaSize` varchar(100) NOT NULL DEFAULT '',
  `Notes` text DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Sites_Customer` (`CustomerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tblJobs` (
  `Id` varchar(50) NOT NULL,
  `JobNo` varchar(50) NOT NULL,
  `CustomerId` varchar(50) NOT NULL,
  `SiteId` varchar(50) NOT NULL,
  `Title` varchar(300) NOT NULL,
  `Description` text DEFAULT NULL,
  `Priority` varchar(20) NOT NULL DEFAULT 'Normal',
  `Status` varchar(50) NOT NULL DEFAULT 'Order Received',
  `EngineerId` varchar(50) NOT NULL,
  `RequestedDate` varchar(30) NOT NULL,
  `StartDate` varchar(30) DEFAULT NULL,
  `EndDate` varchar(30) DEFAULT NULL,
  `CreatedAt` varchar(30) NOT NULL,
  `Progress` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UX_Jobs_JobNo` (`JobNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tblSurveys` (
  `Id` varchar(50) NOT NULL,
  `JobId` varchar(50) NOT NULL,
  `AreaName` varchar(200) NOT NULL DEFAULT '',
  `PlannedDate` varchar(30) NOT NULL DEFAULT '',
  `CompletedDate` varchar(30) DEFAULT NULL,
  `SurveyorId` varchar(50) NOT NULL DEFAULT '',
  `GpsPoints` int(11) NOT NULL DEFAULT 0,
  `Result` text DEFAULT NULL,
  `Status` varchar(30) NOT NULL DEFAULT 'Planned',
  `Notes` text DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tblDrillingDesign` (
  `Id` varchar(50) NOT NULL,
  `JobId` varchar(50) NOT NULL,
  `Burden` double NOT NULL DEFAULT 0,
  `Spacing` double NOT NULL DEFAULT 0,
  `HoleDiameter` double NOT NULL DEFAULT 0,
  `HoleDepth` double NOT NULL DEFAULT 0,
  `NumberOfHoles` int(11) NOT NULL DEFAULT 0,
  `Pattern` varchar(100) NOT NULL DEFAULT '',
  `Status` varchar(30) NOT NULL DEFAULT 'Draft',
  `DesignedBy` varchar(50) NOT NULL DEFAULT '',
  `ApprovedBy` varchar(50) DEFAULT NULL,
  `Notes` text DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tblDrillingMachines` (
  `Id` varchar(50) NOT NULL,
  `Code` varchar(30) NOT NULL,
  `Name` varchar(150) NOT NULL,
  `Type` varchar(100) NOT NULL DEFAULT '',
  `Status` varchar(30) NOT NULL DEFAULT 'Available',
  `Operator` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tblDrillingCrews` (
  `Id` varchar(50) NOT NULL,
  `Name` varchar(150) NOT NULL,
  `SupervisorId` varchar(50) NOT NULL DEFAULT '',
  `Status` varchar(30) NOT NULL DEFAULT 'Available',
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tblDrillingExecution` (
  `Id` varchar(50) NOT NULL,
  `JobId` varchar(50) NOT NULL,
  `MachineId` varchar(50) NOT NULL DEFAULT '',
  `CrewId` varchar(50) NOT NULL DEFAULT '',
  `StartDate` varchar(30) NOT NULL DEFAULT '',
  `EndDate` varchar(30) DEFAULT NULL,
  `PlannedHoles` int(11) NOT NULL DEFAULT 0,
  `CompletedHoles` int(11) NOT NULL DEFAULT 0,
  `PlannedDepth` double NOT NULL DEFAULT 0,
  `ActualDepth` double NOT NULL DEFAULT 0,
  `DowntimeHours` double NOT NULL DEFAULT 0,
  `Status` varchar(30) NOT NULL DEFAULT 'Not Started',
  `Notes` text DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tblHoleChecks` (
  `Id` varchar(50) NOT NULL,
  `JobId` varchar(50) NOT NULL,
  `InspectedHoles` int(11) NOT NULL DEFAULT 0,
  `TotalHoles` int(11) NOT NULL DEFAULT 0,
  `DepthOk` tinyint(1) NOT NULL DEFAULT 0,
  `DiameterOk` tinyint(1) NOT NULL DEFAULT 0,
  `SpacingOk` tinyint(1) NOT NULL DEFAULT 0,
  `Status` varchar(30) NOT NULL DEFAULT 'Pending',
  `InspectorId` varchar(50) NOT NULL DEFAULT '',
  `Notes` text DEFAULT NULL,
  `CheckedAt` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tblBlastingDesign` (
  `Id` varchar(50) NOT NULL,
  `JobId` varchar(50) NOT NULL,
  `TotalHoles` int(11) NOT NULL DEFAULT 0,
  `TotalDepth` double NOT NULL DEFAULT 0,
  `InitiationSystem` varchar(100) NOT NULL DEFAULT '',
  `DelayPattern` varchar(100) NOT NULL DEFAULT '',
  `PlannedQuantity` double NOT NULL DEFAULT 0,
  `MaterialType` varchar(100) NOT NULL DEFAULT '',
  `Status` varchar(30) NOT NULL DEFAULT 'Draft',
  `DesignedBy` varchar(50) NOT NULL DEFAULT '',
  `Notes` text DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tblLPO` (
  `Id` varchar(50) NOT NULL,
  `LpoNo` varchar(50) NOT NULL,
  `JobId` varchar(50) NOT NULL,
  `SupplierId` varchar(50) NOT NULL,
  `Date` varchar(30) NOT NULL,
  `Status` varchar(30) NOT NULL DEFAULT 'Draft',
  `TotalAmount` double NOT NULL DEFAULT 0,
  `Notes` text DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tblInvoices` (
  `Id` varchar(50) NOT NULL,
  `InvoiceNo` varchar(50) NOT NULL,
  `JobId` varchar(50) NOT NULL,
  `CustomerId` varchar(50) NOT NULL,
  `Date` varchar(30) NOT NULL,
  `DueDate` varchar(30) NOT NULL,
  `Subtotal` double NOT NULL DEFAULT 0,
  `Vat` double NOT NULL DEFAULT 0,
  `Total` double NOT NULL DEFAULT 0,
  `Status` varchar(30) NOT NULL DEFAULT 'Draft',
  `ItemsJson` text DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default Admin Login: admin / Krypton
INSERT IGNORE INTO `tblEmployees` (`Id`, `Code`, `ShortCode`, `Name`, `Role`, `Department`, `Phone`, `Email`, `Status`)
VALUES ('e1', 'EMP-001', 'ADMIN', 'admin', 'Admin', 'Administration', '', 'admin', 'Active');

INSERT IGNORE INTO `tblUsers` (`Id`, `EmployeeId`, `Name`, `Email`, `Role`, `Department`, `PermissionsJson`, `PasswordHash`, `Status`)
VALUES (
  'u1',
  'e1',
  'admin',
  'admin',
  'Admin',
  'Administration',
  '["jobs.view","jobs.create","jobs.edit","jobs.delete","customers.view","customers.create","customers.edit","employees.view","employees.manage","reports.view","reports.print","finance.view","approvals.manage","procurement.manage","documents.view"]',
  'Krypton',
  'Active'
);

COMMIT;
