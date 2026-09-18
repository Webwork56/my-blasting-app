/*
================================================================================
  IBTIKAR BLASTING MANAGEMENT SYSTEM
  Microsoft SQL Server Database
  Name: IBTIKAR_BlastingDB
================================================================================
  Matches the current React app schema.

  HOW TO RUN
  1. Open SQL Server Management Studio (SSMS)
  2. Connect to your SQL Server instance
  3. Open this file
  4. Execute (F5)

  APP LOGIN AFTER SEED
    Username : admin
    Password : Krypton

  JOB NUMBER FORMAT
    {CustomerShort}_{EngineerShort}_{0000}
    Example: WE_HASH_0000
================================================================================
*/

USE master;
GO

IF DB_ID(N'IBTIKAR_BlastingDB') IS NULL
BEGIN
  CREATE DATABASE IBTIKAR_BlastingDB;
END
GO

USE IBTIKAR_BlastingDB;
GO

/* -------------------------------------------------------------------------- */
/* DROP EXISTING OBJECTS (clean install)                                      */
/* -------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.vw_JobSummary','V') IS NOT NULL DROP VIEW dbo.vw_JobSummary;
IF OBJECT_ID('dbo.vw_UserPermissions','V') IS NOT NULL DROP VIEW dbo.vw_UserPermissions;

IF OBJECT_ID('dbo.tblNotifications','U') IS NOT NULL DROP TABLE dbo.tblNotifications;
IF OBJECT_ID('dbo.tblDocuments','U') IS NOT NULL DROP TABLE dbo.tblDocuments;
IF OBJECT_ID('dbo.tblPayments','U') IS NOT NULL DROP TABLE dbo.tblPayments;
IF OBJECT_ID('dbo.tblInvoices','U') IS NOT NULL DROP TABLE dbo.tblInvoices;
IF OBJECT_ID('dbo.tblJobCosts','U') IS NOT NULL DROP TABLE dbo.tblJobCosts;
IF OBJECT_ID('dbo.tblApprovals','U') IS NOT NULL DROP TABLE dbo.tblApprovals;
IF OBJECT_ID('dbo.tblFinalChecks','U') IS NOT NULL DROP TABLE dbo.tblFinalChecks;
IF OBJECT_ID('dbo.tblSupplierConfirmations','U') IS NOT NULL DROP TABLE dbo.tblSupplierConfirmations;
IF OBJECT_ID('dbo.tblLPODetails','U') IS NOT NULL DROP TABLE dbo.tblLPODetails;
IF OBJECT_ID('dbo.tblLPO','U') IS NOT NULL DROP TABLE dbo.tblLPO;
IF OBJECT_ID('dbo.tblMaterials','U') IS NOT NULL DROP TABLE dbo.tblMaterials;
IF OBJECT_ID('dbo.tblSuppliers','U') IS NOT NULL DROP TABLE dbo.tblSuppliers;
IF OBJECT_ID('dbo.tblBlastingReports','U') IS NOT NULL DROP TABLE dbo.tblBlastingReports;
IF OBJECT_ID('dbo.tblBlastingExecution','U') IS NOT NULL DROP TABLE dbo.tblBlastingExecution;
IF OBJECT_ID('dbo.tblBlastSchedules','U') IS NOT NULL DROP TABLE dbo.tblBlastSchedules;
IF OBJECT_ID('dbo.tblBlastingDesign','U') IS NOT NULL DROP TABLE dbo.tblBlastingDesign;
IF OBJECT_ID('dbo.tblHoleChecks','U') IS NOT NULL DROP TABLE dbo.tblHoleChecks;
IF OBJECT_ID('dbo.tblDrillingExecution','U') IS NOT NULL DROP TABLE dbo.tblDrillingExecution;
IF OBJECT_ID('dbo.tblCrewMembers','U') IS NOT NULL DROP TABLE dbo.tblCrewMembers;
IF OBJECT_ID('dbo.tblDrillingCrews','U') IS NOT NULL DROP TABLE dbo.tblDrillingCrews;
IF OBJECT_ID('dbo.tblDrillingMachines','U') IS NOT NULL DROP TABLE dbo.tblDrillingMachines;
IF OBJECT_ID('dbo.tblDrillingDesign','U') IS NOT NULL DROP TABLE dbo.tblDrillingDesign;
IF OBJECT_ID('dbo.tblSurveys','U') IS NOT NULL DROP TABLE dbo.tblSurveys;
IF OBJECT_ID('dbo.tblJobs','U') IS NOT NULL DROP TABLE dbo.tblJobs;
IF OBJECT_ID('dbo.tblSites','U') IS NOT NULL DROP TABLE dbo.tblSites;
IF OBJECT_ID('dbo.tblCustomers','U') IS NOT NULL DROP TABLE dbo.tblCustomers;
IF OBJECT_ID('dbo.tblUsers','U') IS NOT NULL DROP TABLE dbo.tblUsers;
IF OBJECT_ID('dbo.tblEmployees','U') IS NOT NULL DROP TABLE dbo.tblEmployees;
IF OBJECT_ID('dbo.tblMeta','U') IS NOT NULL DROP TABLE dbo.tblMeta;
GO

/* ========================================================================== */
/* 1) SECURITY                                                                */
/* ========================================================================== */
CREATE TABLE dbo.tblEmployees (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblEmployees PRIMARY KEY,
  Code          NVARCHAR(30)  NOT NULL,          -- EMP-001
  ShortCode     NVARCHAR(10)  NOT NULL,          -- HASH (used in JobNo)
  Name          NVARCHAR(150) NOT NULL,
  Role          NVARCHAR(30)  NOT NULL,          -- Admin/Engineer/Supervisor/Operator/Finance/PRO/Viewer
  Department    NVARCHAR(100) NOT NULL CONSTRAINT DF_Emp_Dept DEFAULT (''),
  Phone         NVARCHAR(50)  NOT NULL CONSTRAINT DF_Emp_Phone DEFAULT (''),
  Email         NVARCHAR(150) NOT NULL,          -- login username/email
  Status        NVARCHAR(20)  NOT NULL CONSTRAINT DF_Emp_Status DEFAULT ('Active'),
  CreatedAt     DATETIME2     NOT NULL CONSTRAINT DF_Emp_Created DEFAULT (SYSUTCDATETIME())
);
GO

CREATE UNIQUE INDEX UX_Employees_Code ON dbo.tblEmployees(Code);
CREATE UNIQUE INDEX UX_Employees_Email ON dbo.tblEmployees(Email);
GO

CREATE TABLE dbo.tblUsers (
  Id              NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblUsers PRIMARY KEY,
  EmployeeId      NVARCHAR(50)  NOT NULL,
  Name            NVARCHAR(150) NOT NULL,        -- display/login name e.g. admin
  Email           NVARCHAR(150) NOT NULL,        -- login key (can be 'admin')
  Role            NVARCHAR(30)  NOT NULL,
  Department      NVARCHAR(100) NOT NULL CONSTRAINT DF_Users_Dept DEFAULT (''),
  PermissionsJson NVARCHAR(MAX) NULL,            -- JSON array of rights
  PasswordHash    NVARCHAR(200) NULL,            -- plain for now: Krypton
  Status          NVARCHAR(20)  NOT NULL CONSTRAINT DF_Users_Status DEFAULT ('Active'),
  CreatedAt       DATETIME2     NOT NULL CONSTRAINT DF_Users_Created DEFAULT (SYSUTCDATETIME()),
  CONSTRAINT FK_Users_Employees FOREIGN KEY (EmployeeId) REFERENCES dbo.tblEmployees(Id)
);
GO

CREATE UNIQUE INDEX UX_Users_Email ON dbo.tblUsers(Email);
GO

/* ========================================================================== */
/* 2) CUSTOMER & SITES                                                        */
/* ========================================================================== */
CREATE TABLE dbo.tblCustomers (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblCustomers PRIMARY KEY,
  Code          NVARCHAR(30)  NOT NULL,          -- CUS-001
  ShortCode     NVARCHAR(10)  NOT NULL,          -- WE (ALWESAM)
  Name          NVARCHAR(200) NOT NULL,
  ContactPerson NVARCHAR(150) NOT NULL CONSTRAINT DF_Cust_Contact DEFAULT (''),
  Phone         NVARCHAR(50)  NOT NULL CONSTRAINT DF_Cust_Phone DEFAULT (''),
  Email         NVARCHAR(150) NOT NULL CONSTRAINT DF_Cust_Email DEFAULT (''),
  Address       NVARCHAR(300) NOT NULL CONSTRAINT DF_Cust_Addr DEFAULT (''),
  City          NVARCHAR(100) NOT NULL CONSTRAINT DF_Cust_City DEFAULT (''),
  Status        NVARCHAR(20)  NOT NULL CONSTRAINT DF_Cust_Status DEFAULT ('Active'),
  CreatedAt     NVARCHAR(30)  NOT NULL            -- yyyy-mm-dd
);
GO

CREATE UNIQUE INDEX UX_Customers_Code ON dbo.tblCustomers(Code);
CREATE INDEX IX_Customers_ShortCode ON dbo.tblCustomers(ShortCode);
GO

CREATE TABLE dbo.tblSites (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblSites PRIMARY KEY,
  CustomerId    NVARCHAR(50)  NOT NULL,
  Name          NVARCHAR(200) NOT NULL,
  Location      NVARCHAR(300) NOT NULL CONSTRAINT DF_Sites_Loc DEFAULT (''),
  GpsLat        FLOAT         NOT NULL CONSTRAINT DF_Sites_Lat DEFAULT (0),
  GpsLng        FLOAT         NOT NULL CONSTRAINT DF_Sites_Lng DEFAULT (0),
  AreaSize      NVARCHAR(100) NOT NULL CONSTRAINT DF_Sites_Area DEFAULT (''),
  Notes         NVARCHAR(MAX) NOT NULL CONSTRAINT DF_Sites_Notes DEFAULT (''),
  CONSTRAINT FK_Sites_Customers FOREIGN KEY (CustomerId) REFERENCES dbo.tblCustomers(Id)
);
GO

CREATE INDEX IX_Sites_Customer ON dbo.tblSites(CustomerId);
GO

/* ========================================================================== */
/* 3) JOBS (central business object)                                          */
/* ========================================================================== */
CREATE TABLE dbo.tblJobs (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblJobs PRIMARY KEY,
  JobNo         NVARCHAR(50)  NOT NULL,          -- WE_HASH_0000
  CustomerId    NVARCHAR(50)  NOT NULL,
  SiteId        NVARCHAR(50)  NOT NULL,
  Title         NVARCHAR(300) NOT NULL,
  Description   NVARCHAR(MAX) NOT NULL CONSTRAINT DF_Jobs_Desc DEFAULT (''),
  Priority      NVARCHAR(20)  NOT NULL CONSTRAINT DF_Jobs_Priority DEFAULT ('Normal'),
  -- Draft, Order Received, Area Assigned, Survey, Drilling Design, Resource Assigned,
  -- Drilling, Hole Check, Blasting Design, Final Check, Procurement, Supplier Confirmed,
  -- Admin Verification, PRO Submission, Police Approval, Blast Scheduled, Blasting,
  -- Blast Completed, Report, Invoice, Payment, Closed, Cancelled
  Status        NVARCHAR(50)  NOT NULL CONSTRAINT DF_Jobs_Status DEFAULT ('Order Received'),
  EngineerId    NVARCHAR(50)  NOT NULL,
  RequestedDate NVARCHAR(30)  NOT NULL,
  StartDate     NVARCHAR(30)  NULL,
  EndDate       NVARCHAR(30)  NULL,
  CreatedAt     NVARCHAR(30)  NOT NULL,
  Progress      INT           NOT NULL CONSTRAINT DF_Jobs_Progress DEFAULT (0), -- auto from status
  CONSTRAINT FK_Jobs_Customers FOREIGN KEY (CustomerId) REFERENCES dbo.tblCustomers(Id),
  CONSTRAINT FK_Jobs_Sites FOREIGN KEY (SiteId) REFERENCES dbo.tblSites(Id),
  CONSTRAINT FK_Jobs_Engineer FOREIGN KEY (EngineerId) REFERENCES dbo.tblEmployees(Id)
);
GO

CREATE UNIQUE INDEX UX_Jobs_JobNo ON dbo.tblJobs(JobNo);
CREATE INDEX IX_Jobs_Customer ON dbo.tblJobs(CustomerId);
CREATE INDEX IX_Jobs_Site ON dbo.tblJobs(SiteId);
CREATE INDEX IX_Jobs_Engineer ON dbo.tblJobs(EngineerId);
CREATE INDEX IX_Jobs_Status ON dbo.tblJobs(Status);
GO

/* ========================================================================== */
/* 4) SURVEY                                                                  */
/* ========================================================================== */
CREATE TABLE dbo.tblSurveys (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblSurveys PRIMARY KEY,
  JobId         NVARCHAR(50)  NOT NULL,
  AreaName      NVARCHAR(200) NOT NULL CONSTRAINT DF_Survey_Area DEFAULT (''),
  PlannedDate   NVARCHAR(30)  NOT NULL CONSTRAINT DF_Survey_Plan DEFAULT (''),
  CompletedDate NVARCHAR(30)  NULL,
  SurveyorId    NVARCHAR(50)  NOT NULL CONSTRAINT DF_Survey_By DEFAULT (''),
  GpsPoints     INT           NOT NULL CONSTRAINT DF_Survey_Gps DEFAULT (0),
  Result        NVARCHAR(MAX) NOT NULL CONSTRAINT DF_Survey_Result DEFAULT (''),
  -- Planned | In Progress | Completed | Approved | Rejected
  Status        NVARCHAR(30)  NOT NULL CONSTRAINT DF_Survey_Status DEFAULT ('Planned'),
  Notes         NVARCHAR(MAX) NOT NULL CONSTRAINT DF_Survey_Notes DEFAULT (''),
  CONSTRAINT FK_Surveys_Jobs FOREIGN KEY (JobId) REFERENCES dbo.tblJobs(Id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_Surveys_Job ON dbo.tblSurveys(JobId);
GO

/* ========================================================================== */
/* 5) DRILLING                                                                */
/* ========================================================================== */
CREATE TABLE dbo.tblDrillingDesign (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblDrillingDesign PRIMARY KEY,
  JobId         NVARCHAR(50)  NOT NULL,
  Burden        FLOAT         NOT NULL CONSTRAINT DF_DD_Burden DEFAULT (0),
  Spacing       FLOAT         NOT NULL CONSTRAINT DF_DD_Spacing DEFAULT (0),
  HoleDiameter  FLOAT         NOT NULL CONSTRAINT DF_DD_Dia DEFAULT (0),
  HoleDepth     FLOAT         NOT NULL CONSTRAINT DF_DD_Depth DEFAULT (0),
  NumberOfHoles INT           NOT NULL CONSTRAINT DF_DD_Holes DEFAULT (0),
  Pattern       NVARCHAR(100) NOT NULL CONSTRAINT DF_DD_Pattern DEFAULT (''),
  -- Draft | Submitted | Approved | Revision
  Status        NVARCHAR(30)  NOT NULL CONSTRAINT DF_DD_Status DEFAULT ('Draft'),
  DesignedBy    NVARCHAR(50)  NOT NULL CONSTRAINT DF_DD_By DEFAULT (''),
  ApprovedBy    NVARCHAR(50)  NULL,
  Notes         NVARCHAR(MAX) NOT NULL CONSTRAINT DF_DD_Notes DEFAULT (''),
  CONSTRAINT FK_DrillDesign_Jobs FOREIGN KEY (JobId) REFERENCES dbo.tblJobs(Id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.tblDrillingMachines (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblDrillingMachines PRIMARY KEY,
  Code          NVARCHAR(30)  NOT NULL,          -- DRL-01
  Name          NVARCHAR(150) NOT NULL,
  Type          NVARCHAR(100) NOT NULL CONSTRAINT DF_Mach_Type DEFAULT (''),
  -- Available | Assigned | Maintenance | Down
  Status        NVARCHAR(30)  NOT NULL CONSTRAINT DF_Mach_Status DEFAULT ('Available'),
  Operator      NVARCHAR(150) NULL
);
GO

CREATE UNIQUE INDEX UX_Machines_Code ON dbo.tblDrillingMachines(Code);
GO

CREATE TABLE dbo.tblDrillingCrews (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblDrillingCrews PRIMARY KEY,
  Name          NVARCHAR(150) NOT NULL,
  SupervisorId  NVARCHAR(50)  NOT NULL CONSTRAINT DF_Crew_Sup DEFAULT (''),
  -- Available | Assigned | Off
  Status        NVARCHAR(30)  NOT NULL CONSTRAINT DF_Crew_Status DEFAULT ('Available')
);
GO

CREATE TABLE dbo.tblCrewMembers (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblCrewMembers PRIMARY KEY,
  CrewId        NVARCHAR(50)  NOT NULL,
  MemberName    NVARCHAR(150) NOT NULL,
  CONSTRAINT FK_CrewMembers_Crews FOREIGN KEY (CrewId) REFERENCES dbo.tblDrillingCrews(Id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.tblDrillingExecution (
  Id             NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblDrillingExecution PRIMARY KEY,
  JobId          NVARCHAR(50)  NOT NULL,
  MachineId      NVARCHAR(50)  NOT NULL CONSTRAINT DF_DE_Machine DEFAULT (''),
  CrewId         NVARCHAR(50)  NOT NULL CONSTRAINT DF_DE_Crew DEFAULT (''),
  StartDate      NVARCHAR(30)  NOT NULL CONSTRAINT DF_DE_Start DEFAULT (''),
  EndDate        NVARCHAR(30)  NULL,
  PlannedHoles   INT           NOT NULL CONSTRAINT DF_DE_PHoles DEFAULT (0),
  CompletedHoles INT           NOT NULL CONSTRAINT DF_DE_CHoles DEFAULT (0),
  PlannedDepth   FLOAT         NOT NULL CONSTRAINT DF_DE_PDepth DEFAULT (0),
  ActualDepth    FLOAT         NOT NULL CONSTRAINT DF_DE_ADepth DEFAULT (0),
  DowntimeHours  FLOAT         NOT NULL CONSTRAINT DF_DE_Down DEFAULT (0),
  -- Not Started | In Progress | Completed | On Hold
  Status         NVARCHAR(30)  NOT NULL CONSTRAINT DF_DE_Status DEFAULT ('Not Started'),
  Notes          NVARCHAR(MAX) NOT NULL CONSTRAINT DF_DE_Notes DEFAULT (''),
  CONSTRAINT FK_DrillExec_Jobs FOREIGN KEY (JobId) REFERENCES dbo.tblJobs(Id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.tblHoleChecks (
  Id             NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblHoleChecks PRIMARY KEY,
  JobId          NVARCHAR(50)  NOT NULL,
  InspectedHoles INT           NOT NULL CONSTRAINT DF_HC_Insp DEFAULT (0),
  TotalHoles     INT           NOT NULL CONSTRAINT DF_HC_Total DEFAULT (0),
  DepthOk        BIT           NOT NULL CONSTRAINT DF_HC_Depth DEFAULT (0),
  DiameterOk     BIT           NOT NULL CONSTRAINT DF_HC_Dia DEFAULT (0),
  SpacingOk      BIT           NOT NULL CONSTRAINT DF_HC_Space DEFAULT (0),
  -- Pending | In Progress | Approved | Rejected
  Status         NVARCHAR(30)  NOT NULL CONSTRAINT DF_HC_Status DEFAULT ('Pending'),
  InspectorId    NVARCHAR(50)  NOT NULL CONSTRAINT DF_HC_By DEFAULT (''),
  Notes          NVARCHAR(MAX) NOT NULL CONSTRAINT DF_HC_Notes DEFAULT (''),
  CheckedAt      NVARCHAR(30)  NULL,
  CONSTRAINT FK_HoleChecks_Jobs FOREIGN KEY (JobId) REFERENCES dbo.tblJobs(Id) ON DELETE CASCADE
);
GO

/* ========================================================================== */
/* 6) BLASTING                                                                */
/* ========================================================================== */
CREATE TABLE dbo.tblBlastingDesign (
  Id               NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblBlastingDesign PRIMARY KEY,
  JobId            NVARCHAR(50)  NOT NULL,
  TotalHoles       INT           NOT NULL CONSTRAINT DF_BD_Holes DEFAULT (0),
  TotalDepth       FLOAT         NOT NULL CONSTRAINT DF_BD_Depth DEFAULT (0),
  InitiationSystem NVARCHAR(100) NOT NULL CONSTRAINT DF_BD_Init DEFAULT (''),
  DelayPattern     NVARCHAR(100) NOT NULL CONSTRAINT DF_BD_Delay DEFAULT (''),
  PlannedQuantity  FLOAT         NOT NULL CONSTRAINT DF_BD_Qty DEFAULT (0),
  MaterialType     NVARCHAR(100) NOT NULL CONSTRAINT DF_BD_Mat DEFAULT (''),
  -- Draft | Submitted | Approved | Revision
  Status           NVARCHAR(30)  NOT NULL CONSTRAINT DF_BD_Status DEFAULT ('Draft'),
  DesignedBy       NVARCHAR(50)  NOT NULL CONSTRAINT DF_BD_By DEFAULT (''),
  Notes            NVARCHAR(MAX) NOT NULL CONSTRAINT DF_BD_Notes DEFAULT (''),
  CONSTRAINT FK_BlastDesign_Jobs FOREIGN KEY (JobId) REFERENCES dbo.tblJobs(Id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.tblBlastSchedules (
  Id             NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblBlastSchedules PRIMARY KEY,
  JobId          NVARCHAR(50)  NOT NULL,
  BlastDate      NVARCHAR(30)  NOT NULL CONSTRAINT DF_BS_Date DEFAULT (''),
  StartTime      NVARCHAR(20)  NOT NULL CONSTRAINT DF_BS_Start DEFAULT (''),
  EndTime        NVARCHAR(20)  NOT NULL CONSTRAINT DF_BS_End DEFAULT (''),
  CrewId         NVARCHAR(50)  NOT NULL CONSTRAINT DF_BS_Crew DEFAULT (''),
  Manpower       INT           NOT NULL CONSTRAINT DF_BS_Man DEFAULT (0),
  Equipment      NVARCHAR(300) NOT NULL CONSTRAINT DF_BS_Eq DEFAULT (''),
  MaterialsReady BIT           NOT NULL CONSTRAINT DF_BS_Mat DEFAULT (0),
  SafetyPrep     BIT           NOT NULL CONSTRAINT DF_BS_Safe DEFAULT (0),
  -- Scheduled | Confirmed | Completed | Postponed
  Status         NVARCHAR(30)  NOT NULL CONSTRAINT DF_BS_Status DEFAULT ('Scheduled'),
  CONSTRAINT FK_BlastSched_Jobs FOREIGN KEY (JobId) REFERENCES dbo.tblJobs(Id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.tblBlastingExecution (
  Id               NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblBlastingExecution PRIMARY KEY,
  JobId            NVARCHAR(50)  NOT NULL,
  ScheduleId       NVARCHAR(50)  NOT NULL CONSTRAINT DF_BE_Sched DEFAULT (''),
  SafetyInspection BIT           NOT NULL CONSTRAINT DF_BE_Safe DEFAULT (0),
  AreaCleared      BIT           NOT NULL CONSTRAINT DF_BE_Area DEFAULT (0),
  ApprovalsValid   BIT           NOT NULL CONSTRAINT DF_BE_App DEFAULT (0),
  ActualQuantity   FLOAT         NOT NULL CONSTRAINT DF_BE_Qty DEFAULT (0),
  BlastStart       NVARCHAR(40)  NOT NULL CONSTRAINT DF_BE_Start DEFAULT (''),
  BlastEnd         NVARCHAR(40)  NOT NULL CONSTRAINT DF_BE_End DEFAULT (''),
  Weather          NVARCHAR(200) NOT NULL CONSTRAINT DF_BE_Weather DEFAULT (''),
  -- Ready | In Progress | Completed | Aborted
  Status           NVARCHAR(30)  NOT NULL CONSTRAINT DF_BE_Status DEFAULT ('Ready'),
  Notes            NVARCHAR(MAX) NOT NULL CONSTRAINT DF_BE_Notes DEFAULT (''),
  CONSTRAINT FK_BlastExec_Jobs FOREIGN KEY (JobId) REFERENCES dbo.tblJobs(Id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.tblBlastingReports (
  Id             NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblBlastingReports PRIMARY KEY,
  JobId          NVARCHAR(50)  NOT NULL,
  TotalHoles     INT           NOT NULL CONSTRAINT DF_BR_Holes DEFAULT (0),
  MaterialQty    FLOAT         NOT NULL CONSTRAINT DF_BR_Mat DEFAULT (0),
  BlastedVolume  FLOAT         NOT NULL CONSTRAINT DF_BR_Vol DEFAULT (0),
  Result         NVARCHAR(MAX) NOT NULL CONSTRAINT DF_BR_Result DEFAULT (''),
  FlyRock        BIT           NOT NULL CONSTRAINT DF_BR_Fly DEFAULT (0),
  Vibration      NVARCHAR(100) NOT NULL CONSTRAINT DF_BR_Vib DEFAULT (''),
  Misfire        BIT           NOT NULL CONSTRAINT DF_BR_Mis DEFAULT (0),
  Dust           NVARCHAR(100) NOT NULL CONSTRAINT DF_BR_Dust DEFAULT (''),
  SafetyIncident BIT           NOT NULL CONSTRAINT DF_BR_Inc DEFAULT (0),
  -- Draft | Submitted | Approved
  Status         NVARCHAR(30)  NOT NULL CONSTRAINT DF_BR_Status DEFAULT ('Draft'),
  ReportedBy     NVARCHAR(50)  NOT NULL CONSTRAINT DF_BR_By DEFAULT (''),
  Notes          NVARCHAR(MAX) NOT NULL CONSTRAINT DF_BR_Notes DEFAULT (''),
  CONSTRAINT FK_BlastReports_Jobs FOREIGN KEY (JobId) REFERENCES dbo.tblJobs(Id) ON DELETE CASCADE
);
GO

/* ========================================================================== */
/* 7) PROCUREMENT                                                             */
/* ========================================================================== */
CREATE TABLE dbo.tblSuppliers (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblSuppliers PRIMARY KEY,
  Code          NVARCHAR(30)  NOT NULL,
  Name          NVARCHAR(200) NOT NULL,
  Contact       NVARCHAR(150) NOT NULL CONSTRAINT DF_Sup_Contact DEFAULT (''),
  Phone         NVARCHAR(50)  NOT NULL CONSTRAINT DF_Sup_Phone DEFAULT (''),
  Email         NVARCHAR(150) NOT NULL CONSTRAINT DF_Sup_Email DEFAULT (''),
  Materials     NVARCHAR(300) NOT NULL CONSTRAINT DF_Sup_Mat DEFAULT (''),
  Status        NVARCHAR(20)  NOT NULL CONSTRAINT DF_Sup_Status DEFAULT ('Active')
);
GO

CREATE TABLE dbo.tblMaterials (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblMaterials PRIMARY KEY,
  Code          NVARCHAR(30)  NOT NULL,
  Name          NVARCHAR(200) NOT NULL,
  Unit          NVARCHAR(30)  NOT NULL CONSTRAINT DF_Mat_Unit DEFAULT (''),
  Category      NVARCHAR(50)  NOT NULL CONSTRAINT DF_Mat_Cat DEFAULT (''),
  StockQty      FLOAT         NOT NULL CONSTRAINT DF_Mat_Stock DEFAULT (0),
  UnitCost      FLOAT         NOT NULL CONSTRAINT DF_Mat_Cost DEFAULT (0)
);
GO

CREATE TABLE dbo.tblLPO (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblLPO PRIMARY KEY,
  LpoNo         NVARCHAR(50)  NOT NULL,
  JobId         NVARCHAR(50)  NOT NULL,
  SupplierId    NVARCHAR(50)  NOT NULL,
  [Date]        NVARCHAR(30)  NOT NULL,
  -- Draft | Submitted | Approved | Rejected | Delivered
  Status        NVARCHAR(30)  NOT NULL CONSTRAINT DF_LPO_Status DEFAULT ('Draft'),
  TotalAmount   FLOAT         NOT NULL CONSTRAINT DF_LPO_Total DEFAULT (0),
  Notes         NVARCHAR(MAX) NOT NULL CONSTRAINT DF_LPO_Notes DEFAULT (''),
  CONSTRAINT FK_LPO_Jobs FOREIGN KEY (JobId) REFERENCES dbo.tblJobs(Id),
  CONSTRAINT FK_LPO_Suppliers FOREIGN KEY (SupplierId) REFERENCES dbo.tblSuppliers(Id)
);
GO

CREATE UNIQUE INDEX UX_LPO_No ON dbo.tblLPO(LpoNo);
GO

CREATE TABLE dbo.tblLPODetails (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblLPODetails PRIMARY KEY,
  LpoId         NVARCHAR(50)  NOT NULL,
  MaterialId    NVARCHAR(50)  NOT NULL,
  Qty           FLOAT         NOT NULL CONSTRAINT DF_LPODet_Qty DEFAULT (0),
  UnitPrice     FLOAT         NOT NULL CONSTRAINT DF_LPODet_Price DEFAULT (0),
  CONSTRAINT FK_LPODet_LPO FOREIGN KEY (LpoId) REFERENCES dbo.tblLPO(Id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.tblSupplierConfirmations (
  Id               NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblSupplierConfirmations PRIMARY KEY,
  LpoId            NVARCHAR(50)  NOT NULL,
  ConfirmedQty     FLOAT         NOT NULL CONSTRAINT DF_SC_Qty DEFAULT (0),
  ExpectedDelivery NVARCHAR(30)  NOT NULL CONSTRAINT DF_SC_Del DEFAULT (''),
  -- Pending | Confirmed | Partial | Unavailable
  Status           NVARCHAR(30)  NOT NULL CONSTRAINT DF_SC_Status DEFAULT ('Pending'),
  Notes            NVARCHAR(MAX) NOT NULL CONSTRAINT DF_SC_Notes DEFAULT (''),
  CONSTRAINT FK_SupConf_LPO FOREIGN KEY (LpoId) REFERENCES dbo.tblLPO(Id) ON DELETE CASCADE
);
GO

/* ========================================================================== */
/* 8) APPROVALS / FINAL CHECK                                                 */
/* ========================================================================== */
CREATE TABLE dbo.tblFinalChecks (
  Id               NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblFinalChecks PRIMARY KEY,
  JobId            NVARCHAR(50)  NOT NULL,
  DrillingDesignOk BIT           NOT NULL CONSTRAINT DF_FC_DD DEFAULT (0),
  HoleCheckingOk   BIT           NOT NULL CONSTRAINT DF_FC_HC DEFAULT (0),
  BlastingDesignOk BIT           NOT NULL CONSTRAINT DF_FC_BD DEFAULT (0),
  ProcurementOk    BIT           NOT NULL CONSTRAINT DF_FC_PR DEFAULT (0),
  DocumentsOk      BIT           NOT NULL CONSTRAINT DF_FC_DOC DEFAULT (0),
  -- Pending | Approved | Rejected
  Status           NVARCHAR(30)  NOT NULL CONSTRAINT DF_FC_Status DEFAULT ('Pending'),
  CheckedBy        NVARCHAR(50)  NULL,
  CheckedAt        NVARCHAR(30)  NULL,
  Remarks          NVARCHAR(MAX) NOT NULL CONSTRAINT DF_FC_Rem DEFAULT (''),
  CONSTRAINT FK_FinalChecks_Jobs FOREIGN KEY (JobId) REFERENCES dbo.tblJobs(Id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.tblApprovals (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblApprovals PRIMARY KEY,
  JobId         NVARCHAR(50)  NOT NULL,
  -- Administrative | PRO | Police | Permit
  [Type]        NVARCHAR(30)  NOT NULL,
  -- Pending | Submitted | Approved | Rejected | Expired
  Status        NVARCHAR(30)  NOT NULL CONSTRAINT DF_App_Status DEFAULT ('Pending'),
  SubmittedAt   NVARCHAR(30)  NULL,
  ApprovedAt    NVARCHAR(30)  NULL,
  ExpiryDate    NVARCHAR(30)  NULL,
  ReferenceNo   NVARCHAR(100) NULL,
  Notes         NVARCHAR(MAX) NOT NULL CONSTRAINT DF_App_Notes DEFAULT (''),
  CONSTRAINT FK_Approvals_Jobs FOREIGN KEY (JobId) REFERENCES dbo.tblJobs(Id) ON DELETE CASCADE
);
GO

/* ========================================================================== */
/* 9) FINANCE                                                                 */
/* ========================================================================== */
CREATE TABLE dbo.tblJobCosts (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblJobCosts PRIMARY KEY,
  JobId         NVARCHAR(50)  NOT NULL,
  Category      NVARCHAR(50)  NOT NULL CONSTRAINT DF_JC_Cat DEFAULT (''),
  Description   NVARCHAR(300) NOT NULL CONSTRAINT DF_JC_Desc DEFAULT (''),
  Amount        FLOAT         NOT NULL CONSTRAINT DF_JC_Amt DEFAULT (0),
  [Date]        NVARCHAR(30)  NOT NULL CONSTRAINT DF_JC_Date DEFAULT (''),
  CONSTRAINT FK_JobCosts_Jobs FOREIGN KEY (JobId) REFERENCES dbo.tblJobs(Id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.tblInvoices (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblInvoices PRIMARY KEY,
  InvoiceNo     NVARCHAR(50)  NOT NULL,
  JobId         NVARCHAR(50)  NOT NULL,
  CustomerId    NVARCHAR(50)  NOT NULL,
  [Date]        NVARCHAR(30)  NOT NULL,
  DueDate       NVARCHAR(30)  NOT NULL,
  Subtotal      FLOAT         NOT NULL CONSTRAINT DF_Inv_Sub DEFAULT (0),
  Vat           FLOAT         NOT NULL CONSTRAINT DF_Inv_Vat DEFAULT (0),
  Total         FLOAT         NOT NULL CONSTRAINT DF_Inv_Total DEFAULT (0),
  -- Draft | Sent | Paid | Partial | Overdue
  Status        NVARCHAR(30)  NOT NULL CONSTRAINT DF_Inv_Status DEFAULT ('Draft'),
  ItemsJson     NVARCHAR(MAX) NOT NULL CONSTRAINT DF_Inv_Items DEFAULT ('[]'),
  CONSTRAINT FK_Invoices_Jobs FOREIGN KEY (JobId) REFERENCES dbo.tblJobs(Id),
  CONSTRAINT FK_Invoices_Customers FOREIGN KEY (CustomerId) REFERENCES dbo.tblCustomers(Id)
);
GO

CREATE UNIQUE INDEX UX_Invoices_No ON dbo.tblInvoices(InvoiceNo);
GO

CREATE TABLE dbo.tblPayments (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblPayments PRIMARY KEY,
  InvoiceId     NVARCHAR(50)  NOT NULL,
  Amount        FLOAT         NOT NULL CONSTRAINT DF_Pay_Amt DEFAULT (0),
  Method        NVARCHAR(50)  NOT NULL CONSTRAINT DF_Pay_Method DEFAULT (''),
  Reference     NVARCHAR(100) NOT NULL CONSTRAINT DF_Pay_Ref DEFAULT (''),
  [Date]        NVARCHAR(30)  NOT NULL CONSTRAINT DF_Pay_Date DEFAULT (''),
  Notes         NVARCHAR(MAX) NOT NULL CONSTRAINT DF_Pay_Notes DEFAULT (''),
  CONSTRAINT FK_Payments_Invoices FOREIGN KEY (InvoiceId) REFERENCES dbo.tblInvoices(Id) ON DELETE CASCADE
);
GO

/* ========================================================================== */
/* 10) DOCUMENTS / NOTIFICATIONS / META                                       */
/* ========================================================================== */
CREATE TABLE dbo.tblDocuments (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblDocuments PRIMARY KEY,
  JobId         NVARCHAR(50)  NULL,
  Name          NVARCHAR(300) NOT NULL,
  Category      NVARCHAR(100) NOT NULL CONSTRAINT DF_Doc_Cat DEFAULT (''),
  Version       NVARCHAR(20)  NOT NULL CONSTRAINT DF_Doc_Ver DEFAULT ('1.0'),
  UploadedBy    NVARCHAR(50)  NOT NULL CONSTRAINT DF_Doc_By DEFAULT (''),
  UploadedAt    NVARCHAR(30)  NOT NULL CONSTRAINT DF_Doc_At DEFAULT (''),
  Size          NVARCHAR(30)  NOT NULL CONSTRAINT DF_Doc_Size DEFAULT ('')
);
GO

CREATE TABLE dbo.tblNotifications (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblNotifications PRIMARY KEY,
  Title         NVARCHAR(200) NOT NULL,
  Message       NVARCHAR(MAX) NOT NULL CONSTRAINT DF_Notif_Msg DEFAULT (''),
  -- info | warning | success | error
  [Type]        NVARCHAR(20)  NOT NULL CONSTRAINT DF_Notif_Type DEFAULT ('info'),
  IsRead        BIT           NOT NULL CONSTRAINT DF_Notif_Read DEFAULT (0),
  CreatedAt     NVARCHAR(40)  NOT NULL CONSTRAINT DF_Notif_At DEFAULT (''),
  Link          NVARCHAR(100) NULL
);
GO

CREATE TABLE dbo.tblMeta (
  Id            NVARCHAR(50)  NOT NULL CONSTRAINT PK_tblMeta PRIMARY KEY,
  ValueJson     NVARCHAR(MAX) NULL
);
GO

/* ========================================================================== */
/* 11) USEFUL VIEWS                                                           */
/* ========================================================================== */
GO
CREATE VIEW dbo.vw_JobSummary
AS
SELECT
  j.Id,
  j.JobNo,
  j.Title,
  j.Status,
  j.Priority,
  j.Progress,
  j.RequestedDate,
  j.StartDate,
  j.EndDate,
  j.CreatedAt,
  c.Name AS CustomerName,
  c.ShortCode AS CustomerShortCode,
  s.Name AS SiteName,
  s.Location AS SiteLocation,
  e.Name AS EngineerName,
  e.ShortCode AS EngineerShortCode
FROM dbo.tblJobs j
INNER JOIN dbo.tblCustomers c ON c.Id = j.CustomerId
INNER JOIN dbo.tblSites s ON s.Id = j.SiteId
INNER JOIN dbo.tblEmployees e ON e.Id = j.EngineerId;
GO

CREATE VIEW dbo.vw_UserPermissions
AS
SELECT
  u.Id AS UserId,
  u.Name AS UserName,
  u.Email,
  u.Role,
  u.Status,
  u.PasswordHash AS Password,
  u.PermissionsJson,
  e.Id AS EmployeeId,
  e.Code AS EmployeeCode,
  e.ShortCode AS EmployeeShortCode,
  e.Department
FROM dbo.tblUsers u
INNER JOIN dbo.tblEmployees e ON e.Id = u.EmployeeId;
GO

/* ========================================================================== */
/* 12) SEED DATA (clean system — admin only)                                  */
/* ========================================================================== */
INSERT INTO dbo.tblEmployees
  (Id, Code, ShortCode, Name, Role, Department, Phone, Email, Status)
VALUES
  ('e1', 'EMP-001', 'ADMIN', 'admin', 'Admin', 'Administration', '', 'admin', 'Active');
GO

INSERT INTO dbo.tblUsers
  (Id, EmployeeId, Name, Email, Role, Department, PermissionsJson, PasswordHash, Status)
VALUES
  (
    'u1',
    'e1',
    'admin',
    'admin',
    'Admin',
    'Administration',
    N'["jobs.view","jobs.create","jobs.edit","jobs.delete","customers.view","customers.create","customers.edit","employees.view","employees.manage","reports.view","reports.print","finance.view","approvals.manage","procurement.manage","documents.view"]',
    N'Krypton',
    'Active'
  );
GO

INSERT INTO dbo.tblMeta (Id, ValueJson) VALUES
  ('dbName', N'"u365882270_IB_BlastingDB"'),
  ('version', N'1'),
  ('initialized', N'true'),
  ('app', N'"IBTIKAR Blasting Management System"'),
  ('createdAt', N'"' + CONVERT(NVARCHAR(33), SYSUTCDATETIME(), 127) + '"');
GO

/* ========================================================================== */
/* 13) VERIFY                                                                 */
/* ========================================================================== */
PRINT '================================================';
PRINT 'IBTIKAR_BlastingDB created successfully.';
PRINT 'Tables:';
SELECT name AS TableName FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') ORDER BY name;
PRINT '------------------------------------------------';
PRINT 'Admin login:';
PRINT '  Username: admin';
PRINT '  Password: Krypton';
PRINT '================================================';
GO

-- Quick checks
SELECT Email AS Username, Role, PasswordHash AS Password FROM dbo.tblUsers;
SELECT COUNT(*) AS TableCount FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo');
GO
