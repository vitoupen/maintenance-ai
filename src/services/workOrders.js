// Work order storage. Frontend-only for now — backed by localStorage so the
// public request form and the admin dashboard (same browser, same origin)
// share data. Replace with real backend calls (e.g. POST/GET /api/work-orders)
// once a server exists; keep the same function signatures so callers don't change.

const STORAGE_KEY = "maintenance_ai_work_orders";
const UPDATED_EVENT = "workorders:updated";

export const STATUS = { PENDING: "Pending", COMPLETED: "Completed" };

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

// Seed data so the dashboard isn't empty on first load. Only written once,
// the first time the app ever runs (see seedDemoDataIfEmpty below) — never
// overwrites real submissions or reappears after everything's deleted.
const DEMO_ORDERS = [
  {
    id: "demo-1",
    requesterName: "Dana Kim",
    location: "Building 3, Kitchen",
    description: "Gas smell near the stove",
    priority: "High",
    status: STATUS.PENDING,
    submittedAt: hoursAgo(2),
    completedAt: null,
  },
  {
    id: "demo-2",
    requesterName: "Marcus Webb",
    location: "Loading Dock 2",
    description: "Hydraulic lift is leaking fluid",
    priority: "Medium",
    status: STATUS.PENDING,
    submittedAt: hoursAgo(6),
    completedAt: null,
  },
  {
    id: "demo-3",
    requesterName: "Alicia Gomez",
    location: "Building 1, Room 204",
    description: "Ceiling light flickering on and off",
    priority: "Low",
    status: STATUS.PENDING,
    submittedAt: hoursAgo(20),
    completedAt: null,
  },
  {
    id: "demo-4",
    requesterName: "Omar Haddad",
    location: "Building 2, Room 110",
    description: "Thermostat not responding to changes",
    priority: "Medium",
    status: STATUS.COMPLETED,
    submittedAt: hoursAgo(50),
    completedAt: hoursAgo(30),
  },
  {
    id: "demo-5",
    requesterName: "Grace Liu",
    location: "Parking Garage Level 1",
    description: "Broken security camera near entrance",
    priority: "Low",
    status: STATUS.COMPLETED,
    submittedAt: hoursAgo(96),
    completedAt: hoursAgo(72),
  },
];

// Call once at app startup. No-ops if storage has ever been written to
// (including if the user deleted everything — that's a real empty state).
export function seedDemoDataIfEmpty() {
  if (localStorage.getItem(STORAGE_KEY) !== null) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_ORDERS));
}

function readAll() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  // Default older stored orders (saved before status tracking existed) to Pending.
  return JSON.parse(raw).map((order) => ({ status: STATUS.PENDING, ...order }));
}

function writeAll(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  // "storage" only fires in *other* tabs, so also notify listeners in this tab.
  window.dispatchEvent(new Event(UPDATED_EVENT));
}

export function getWorkOrders() {
  return readAll().sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

export function addWorkOrder({ requesterName, location, description, priority }) {
  const order = {
    id: crypto.randomUUID?.() ?? String(Date.now()),
    requesterName,
    location,
    description,
    priority,
    status: STATUS.PENDING,
    submittedAt: new Date().toISOString(),
    completedAt: null,
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
  return updateWorkOrder(id, {
    status,
    completedAt: status === STATUS.COMPLETED ? new Date().toISOString() : null,
  });
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
