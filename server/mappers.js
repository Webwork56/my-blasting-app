/** Map SQL rows ↔ frontend camelCase objects */

export function mapEmployee(r) {
  if (!r) return null;
  return {
    id: r.Id,
    code: r.Code,
    shortCode: r.ShortCode,
    name: r.Name,
    role: r.Role,
    department: r.Department || '',
    phone: r.Phone || '',
    email: r.Email,
    status: r.Status,
  };
}

export function mapUser(r) {
  if (!r) return null;
  let permissions;
  try {
    permissions = r.PermissionsJson ? JSON.parse(r.PermissionsJson) : undefined;
  } catch {
    permissions = undefined;
  }
  return {
    id: r.Id,
    employeeId: r.EmployeeId,
    name: r.Name,
    email: r.Email,
    password: r.PasswordHash || '',
    role: r.Role,
    department: r.Department || '',
    permissions,
  };
}

export function mapCustomer(r) {
  if (!r) return null;
  return {
    id: r.Id,
    code: r.Code,
    shortCode: r.ShortCode,
    name: r.Name,
    contactPerson: r.ContactPerson || '',
    phone: r.Phone || '',
    email: r.Email || '',
    address: r.Address || '',
    city: r.City || '',
    status: r.Status,
    createdAt: r.CreatedAt,
  };
}

export function mapSite(r) {
  if (!r) return null;
  return {
    id: r.Id,
    customerId: r.CustomerId,
    name: r.Name,
    location: r.Location || '',
    gpsLat: Number(r.GpsLat) || 0,
    gpsLng: Number(r.GpsLng) || 0,
    areaSize: r.AreaSize || '',
    notes: r.Notes || '',
  };
}

export function mapJob(r) {
  if (!r) return null;
  return {
    id: r.Id,
    jobNo: r.JobNo,
    customerId: r.CustomerId,
    siteId: r.SiteId,
    title: r.Title,
    description: r.Description || '',
    priority: r.Priority,
    status: r.Status,
    engineerId: r.EngineerId,
    requestedDate: r.RequestedDate,
    startDate: r.StartDate || undefined,
    endDate: r.EndDate || undefined,
    createdAt: r.CreatedAt,
    progress: Number(r.Progress) || 0,
  };
}

export function mapNotification(r) {
  if (!r) return null;
  return {
    id: r.Id,
    title: r.Title,
    message: r.Message || '',
    type: r.Type || 'info',
    read: !!r.IsRead,
    createdAt: r.CreatedAt || '',
    link: r.Link || undefined,
  };
}

export function mapLpo(r, items = []) {
  if (!r) return null;
  return {
    id: r.Id,
    lpoNo: r.LpoNo,
    jobId: r.JobId,
    supplierId: r.SupplierId,
    date: r.Date,
    status: r.Status,
    totalAmount: Number(r.TotalAmount) || 0,
    notes: r.Notes || '',
    items: items.map((i) => ({
      materialId: i.MaterialId,
      qty: Number(i.Qty) || 0,
      unitPrice: Number(i.UnitPrice) || 0,
    })),
  };
}

export function mapInvoice(r) {
  if (!r) return null;
  let items = [];
  try {
    items = r.ItemsJson ? JSON.parse(r.ItemsJson) : [];
  } catch {
    items = [];
  }
  return {
    id: r.Id,
    invoiceNo: r.InvoiceNo,
    jobId: r.JobId,
    customerId: r.CustomerId,
    date: r.Date,
    dueDate: r.DueDate,
    subtotal: Number(r.Subtotal) || 0,
    vat: Number(r.Vat) || 0,
    total: Number(r.Total) || 0,
    status: r.Status,
    items,
  };
}

export function mapGenericJobChild(r, extra = {}) {
  return { id: r.Id, jobId: r.JobId, ...extra };
}
