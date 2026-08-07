// Work order storage. Frontend-only for now — backed by localStorage so the
// public request form and the admin dashboard (same browser, same origin)
// share data. Replace with real backend calls (e.g. POST/GET /api/work-orders)
// once a server exists; keep the same function signatures so callers don't change.

const STORAGE_KEY = "maintenance_ai_work_orders";
const UPDATED_EVENT = "workorders:updated";

export const STATUS = { OPEN: "Open", IN_PROGRESS: "In Progress", RESOLVED: "Resolved" };

// Seed data: 20 real (anonymized) facility issues from the hackathon dataset,
// covering all 20 original entries. Two (HS-016, HS-020) are marked Resolved
// here for demo purposes so the dashboard shows all three states on first
// load — the source data itself only has Open/In Progress.
// Only written once, the first time the app ever runs (see
// seedDemoDataIfEmpty below) — never overwrites real submissions or
// reappears after everything's deleted.
const DEMO_ORDERS = [
  {
    id: "HS-001",
    title: "Broken Glass Hazard",
    requesterName: "User A",
    location: "Alpha Building — Central Corridor",
    locationId: "LOC006",
    description: "Glass broken on floor outside doors to Zone B1/B0 area. Large shards have been picked up, please vacuum up remainder. Note the glass smashed and sent shards across the hallway.",
    category: "Slip/Trip/Cut Hazard",
    priority: "P1",
    technicianId: "FT002",
    status: STATUS.OPEN,
    submittedAt: "2026-08-04T08:15:00Z",
    resolvedAt: null,
  },
  {
    id: "HS-002",
    title: "Water Leak in Stairwell",
    requesterName: "User B",
    location: "Alpha Building — Parking Stair NW",
    locationId: "LOC010",
    description: "Rain is coming through the ceiling in the stairwell by Echo Room down to the external carpark. Water pooling on stairs creating slip hazard.",
    category: "Water/Flood Hazard",
    priority: "P0",
    technicianId: "FT004",
    status: STATUS.IN_PROGRESS,
    submittedAt: "2026-08-03T14:30:00Z",
    resolvedAt: null,
  },
  {
    id: "HS-003",
    title: "Urinal Running Non-Stop",
    requesterName: "User C",
    location: "Alpha Building — Zone B4",
    locationId: "LOC012",
    description: "Male toilet behind Zone B4 - urinal is running non stop, has been for 2 days now. Water waste and potential overflow risk.",
    category: "Plumbing/Water Hazard",
    priority: "P0",
    technicianId: "FT004",
    status: STATUS.OPEN,
    submittedAt: "2026-08-04T09:00:00Z",
    resolvedAt: null,
  },
  {
    id: "HS-004",
    title: "Unsafe Carpark Markings",
    requesterName: "User D",
    location: "Alpha Building — Lower Parking Level",
    locationId: "LOC009",
    description: "Give way markings faded at carpark intersection near Echo Room end exit. Near-miss incidents reported - vehicles not giving way when coming straight through.",
    category: "Vehicle/Traffic Hazard",
    priority: "P2",
    technicianId: "FT006",
    status: STATUS.OPEN,
    submittedAt: "2026-08-02T11:25:00Z",
    resolvedAt: null,
  },
  {
    id: "HS-005",
    title: "Security Door Beeping",
    requesterName: "User E",
    location: "Alpha Building — Workshop Area",
    locationId: "LOC007",
    description: "Workshop Area doors in Alpha Building, Zone A4 (both sides) have started beeping continuously. Potential fire safety/security breach concern.",
    category: "Security/Access Hazard",
    priority: "P1",
    technicianId: "FT008",
    status: STATUS.IN_PROGRESS,
    submittedAt: "2026-08-03T12:50:00Z",
    resolvedAt: null,
  },
  {
    id: "HS-006",
    title: "Blocked Toilet - Health Risk",
    requesterName: "User F",
    location: "Alpha Building — Male Restroom - Zone 3/4",
    locationId: "LOC008",
    description: "Accessible toilet constantly overruns / stays stuck. The toilet closest to the basins has a note saying it is blocked. Hygiene and overflow risk.",
    category: "Sanitation Hazard",
    priority: "P1",
    technicianId: "FT004",
    status: STATUS.OPEN,
    submittedAt: "2026-08-04T07:30:00Z",
    resolvedAt: null,
  },
  {
    id: "HS-007",
    title: "Emergency Exit Light Out",
    requesterName: "User G",
    location: "Alpha Building — Summit Room",
    locationId: "LOC003",
    description: "Emergency exit sign light not working near Summit meeting room. Compliance issue for emergency evacuation.",
    category: "Emergency/Fire Safety",
    priority: "P1",
    technicianId: "FT002",
    status: STATUS.OPEN,
    submittedAt: "2026-08-04T10:00:00Z",
    resolvedAt: null,
  },
  {
    id: "HS-008",
    title: "Loose Handrail on Stairs",
    requesterName: "User H",
    location: "Alpha Building — Zone B1",
    locationId: "LOC011",
    description: "Handrail on internal staircase near Zone B1 is loose and wobbling. Risk of fall if someone relies on it for support.",
    category: "Fall Hazard",
    priority: "P1",
    technicianId: "FT006",
    status: STATUS.IN_PROGRESS,
    submittedAt: "2026-08-03T15:45:00Z",
    resolvedAt: null,
  },
  {
    id: "HS-009",
    title: "Wet Floor - No Signage",
    requesterName: "User I",
    location: "Alpha Building — Horizon Room",
    locationId: "LOC004",
    description: "Persistent condensation drip from aircon unit in Horizon meeting room creating wet floor. No wet floor signs in place.",
    category: "Slip Hazard",
    priority: "P2",
    technicianId: "FT004",
    status: STATUS.OPEN,
    submittedAt: "2026-08-04T08:45:00Z",
    resolvedAt: null,
  },
  {
    id: "HS-010",
    title: "Exposed Electrical Wiring",
    requesterName: "User J",
    location: "Alpha Building — Zone A4 Kitchen",
    locationId: "LOC002",
    description: "Cable cover damaged near Zone A4 kitchen showing exposed wiring underneath. Electrical and trip hazard.",
    category: "Electrical Hazard",
    priority: "P0",
    technicianId: "FT002",
    status: STATUS.IN_PROGRESS,
    submittedAt: "2026-08-03T16:00:00Z",
    resolvedAt: null,
  },
  {
    id: "HS-011",
    title: "Fire Extinguisher Expired",
    requesterName: "User K",
    location: "Alpha Building — Cascade Room",
    locationId: "LOC013",
    description: "Fire extinguisher in corridor near Cascade meeting room has expired inspection tag (overdue by 3 months).",
    category: "Emergency/Fire Safety",
    priority: "P1",
    technicianId: "FT005",
    status: STATUS.OPEN,
    submittedAt: "2026-08-04T09:30:00Z",
    resolvedAt: null,
  },
  {
    id: "HS-012",
    title: "Ceiling Tile Falling",
    requesterName: "User L",
    location: "Alpha Building — Zone B4",
    locationId: "LOC012",
    description: "Ceiling tile above workstation in Zone B4 is sagging and at risk of falling. Items have been placed below as precaution.",
    category: "Falling Object Hazard",
    priority: "P1",
    technicianId: "FT006",
    status: STATUS.OPEN,
    submittedAt: "2026-08-04T11:00:00Z",
    resolvedAt: null,
  },
  {
    id: "HS-013",
    title: "Chemical Spill in Carpark",
    requesterName: "User M",
    location: "Alpha Building — Lower Parking Level",
    locationId: "LOC009",
    description: "Small oil spill near EV charging stations in lower parking level. Slip hazard and potential environmental concern.",
    category: "Chemical/Spill Hazard",
    priority: "P1",
    technicianId: "FT007",
    status: STATUS.IN_PROGRESS,
    submittedAt: "2026-08-03T17:30:00Z",
    resolvedAt: null,
  },
  {
    id: "HS-014",
    title: "Broken Step Edge",
    requesterName: "User N",
    location: "Alpha Building — Interior Commons",
    locationId: "LOC015",
    description: "Step edge on main entrance to Alpha Building is cracked and uneven. Trip hazard for staff and visitors.",
    category: "Trip Hazard",
    priority: "P2",
    technicianId: "FT006",
    status: STATUS.OPEN,
    submittedAt: "2026-08-02T14:00:00Z",
    resolvedAt: null,
  },
  {
    id: "HS-015",
    title: "Smoke Detector Fault",
    requesterName: "User O",
    location: "Alpha Building — Stellar Room",
    locationId: "LOC014",
    description: "Smoke detector in Stellar meeting room showing fault light. Has been beeping intermittently.",
    category: "Emergency/Fire Safety",
    priority: "P1",
    technicianId: "FT002",
    status: STATUS.OPEN,
    submittedAt: "2026-08-04T07:45:00Z",
    resolvedAt: null,
  },
  {
    id: "HS-016",
    title: "First Aid Kit Needs Restocking",
    requesterName: "User P",
    location: "Alpha Building — Zone A4 Kitchen",
    locationId: "LOC002",
    description: "First aid kit in Zone A4 kitchen is running low on supplies - bandages, antiseptic wipes, and paracetamol need replenishing. Last checked 2 weeks ago.",
    category: "First Aid/Medical",
    priority: "P3",
    technicianId: "FT005",
    status: STATUS.RESOLVED,
    submittedAt: "2026-08-04T09:15:00Z",
    resolvedAt: "2026-08-04T12:15:00Z",
  },
  {
    id: "HS-017",
    title: "Ergonomic Assessment Required",
    requesterName: "User Q",
    location: "Alpha Building — Zone B1",
    locationId: "LOC011",
    description: "Staff member in Zone B1 reporting recurring back and neck discomfort. Workstation may need ergonomic review - monitor height and chair adjustment required.",
    category: "Ergonomic Hazard",
    priority: "P3",
    technicianId: "FT005",
    status: STATUS.OPEN,
    submittedAt: "2026-08-04T10:30:00Z",
    resolvedAt: null,
  },
  {
    id: "HS-018",
    title: "AED Device Monthly Check Due",
    requesterName: "User R",
    location: "Beta Building — Reception - Beta",
    locationId: "LOC067",
    description: "Automated External Defibrillator (AED) near Beta Building reception is due for monthly inspection. Visual check and battery status verification needed.",
    category: "Emergency Equipment",
    priority: "P2",
    technicianId: "FT005",
    status: STATUS.OPEN,
    submittedAt: "2026-08-03T08:00:00Z",
    resolvedAt: null,
  },
  {
    id: "HS-019",
    title: "Trip Hazard - Lifted Carpet Edge",
    requesterName: "User S",
    location: "Alpha Building — Highland Room",
    locationId: "LOC031",
    description: "Carpet edge lifting near entrance to Highland meeting room. Adhesive has come loose and creating a trip hazard for foot traffic.",
    category: "Trip Hazard",
    priority: "P2",
    technicianId: "FT006",
    status: STATUS.IN_PROGRESS,
    submittedAt: "2026-08-03T14:15:00Z",
    resolvedAt: null,
  },
  {
    id: "HS-020",
    title: "Emergency Evacuation Map Outdated",
    requesterName: "User T",
    location: "Alpha Building — Zone A2",
    locationId: "LOC019",
    description: "Emergency evacuation map posted in Zone A3 corridor shows old floor layout from before recent refurbishment. New exit routes not reflected.",
    category: "Emergency/Evacuation",
    priority: "P2",
    technicianId: "FT005",
    status: STATUS.RESOLVED,
    submittedAt: "2026-08-04T11:45:00Z",
    resolvedAt: "2026-08-04T15:00:00Z",
  },
];

// No-ops if storage has ever been written to (including if the user deleted
// everything — that's a real empty state). Run once, below, at module load —
// not from a React effect: child components' effects (e.g. Admin's initial
// getWorkOrders() read) fire before a parent's, so seeding from App.jsx's
// effect was too late to be visible on first render.
function seedDemoDataIfEmpty() {
  if (localStorage.getItem(STORAGE_KEY) !== null) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_ORDERS));
}

seedDemoDataIfEmpty();

// Earlier versions of this app used a 2-state status ("Pending"/"Completed")
// before it became the current 3-state Open/In Progress/Resolved. Orders
// saved under that old schema still carry those old string values, which
// don't match any of the current STATUS constants — remap them here so they
// don't silently vanish from every status table while still counting toward
// the total.
const LEGACY_STATUS_MAP = { Pending: STATUS.OPEN, Completed: STATUS.RESOLVED };

function normalizeStatus(status) {
  if (status === STATUS.OPEN || status === STATUS.IN_PROGRESS || status === STATUS.RESOLVED) {
    return status;
  }
  return LEGACY_STATUS_MAP[status] ?? STATUS.OPEN;
}

function readAll() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  // Default older stored orders (saved before status/technician/archive tracking existed).
  return JSON.parse(raw).map((order) => ({
    technicianId: null,
    category: "General Maintenance",
    archived: false,
    priorityNote: null,
    ...order,
    status: normalizeStatus(order.status),
  }));
}

// Short, human-readable ticket numbers for new submissions (e.g. "WO-4F2A").
// Seed data keeps its original HS-### IDs, which double as ticket numbers too.
function generateTicketNumber() {
  const code = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WO-${code}`;
}

function writeAll(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  // "storage" only fires in *other* tabs, so also notify listeners in this tab.
  window.dispatchEvent(new Event(UPDATED_EVENT));
}

export function getWorkOrders() {
  return readAll().sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

export function addWorkOrder({ requesterName, location, description, priority, category, title }) {
  const order = {
    id: generateTicketNumber(),
    title: title ?? null,
    requesterName,
    location,
    locationId: null,
    description,
    category,
    priority,
    technicianId: null,
    status: STATUS.OPEN,
    submittedAt: new Date().toISOString(),
    resolvedAt: null,
    archived: false,
    priorityNote: null,
  };
  writeAll([...readAll(), order]);
  return order;
}

export function updateWorkOrder(id, updates) {
  const orders = readAll();
  const index = orders.findIndex((order) => order.id === id);
  if (index === -1) return null;

  const updated = { ...orders[index], ...updates };
  orders[index] = updated;
  writeAll(orders);
  return updated;
}

export function setWorkOrderStatus(id, status) {
  const updates = {
    status,
    resolvedAt: status === STATUS.RESOLVED ? new Date().toISOString() : null,
  };
  // Reopening an archived order should bring it back into view, not leave it
  // archived-but-open.
  if (status !== STATUS.RESOLVED) updates.archived = false;
  return updateWorkOrder(id, updates);
}

export function setWorkOrderTechnician(id, technicianId) {
  return updateWorkOrder(id, { technicianId: technicianId || null });
}

export function setWorkOrderArchived(id, archived) {
  return updateWorkOrder(id, { archived });
}

// Records the outcome of asking the AI to reconsider a ticket's priority
// (see src/services/aiAgent.js's reconsiderPriority) — updates the priority
// and keeps a note of why, for anyone reviewing the ticket later.
export function applyPriorityReconsideration(id, { reason, newPriority, explanation }) {
  const orders = readAll();
  const index = orders.findIndex((order) => order.id === id);
  if (index === -1) return null;

  const updated = {
    ...orders[index],
    priority: newPriority,
    priorityNote: {
      reason,
      explanation,
      previousPriority: orders[index].priority,
      updatedAt: new Date().toISOString(),
    },
  };
  orders[index] = updated;
  writeAll(orders);
  return updated;
}

export function deleteWorkOrder(id) {
  writeAll(readAll().filter((order) => order.id !== id));
}

// Call with a callback to be notified whenever work orders change, whether
// from this tab (submitting the form) or another tab/window (storage event).
// Returns an unsubscribe function.
export function subscribeToWorkOrders(callback) {
  const handler = () => callback(getWorkOrders());
  window.addEventListener(UPDATED_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(UPDATED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
