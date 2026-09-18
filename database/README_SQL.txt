IBTIKAR_BlastingDB — SQL Server setup
=====================================

File to run:
  database/IBTIKAR_BlastingDB.sql

In SSMS:
  1. Connect to SQL Server
  2. File > Open > IBTIKAR_BlastingDB.sql
  3. Press F5 (Execute)

Login after seed:
  Username: admin
  Password: Krypton

Main tables used by the app:
  tblUsers, tblEmployees
  tblCustomers, tblSites
  tblJobs                 (JobNo like WE_HASH_0000, Progress auto)
  tblSurveys
  tblDrillingDesign, tblDrillingMachines, tblDrillingCrews, tblCrewMembers
  tblDrillingExecution, tblHoleChecks
  tblBlastingDesign, tblBlastSchedules, tblBlastingExecution, tblBlastingReports
  tblSuppliers, tblMaterials, tblLPO, tblLPODetails, tblSupplierConfirmations
  tblFinalChecks, tblApprovals
  tblJobCosts, tblInvoices, tblPayments
  tblDocuments, tblNotifications, tblMeta

Views:
  vw_JobSummary
  vw_UserPermissions

Connect app API (.env):
  SQL_SERVER=localhost
  SQL_DATABASE=IBTIKAR_BlastingDB
  SQL_USER=sa
  SQL_PASSWORD=YourPassword
  VITE_API_URL=http://localhost:3001

Then:
  npm run server
  npm run dev   (or npm run build)
