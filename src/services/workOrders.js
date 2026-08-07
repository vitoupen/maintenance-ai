// Work order storage. Frontend-only for now — backed by localStorage so the
// public request form and the admin dashboard (same browser, same origin)
// share data. Replace with real backend calls (e.g. POST/GET /api/work-orders)
// once a server exists; keep the same function signatures so callers don't change.

const STORAGE_KEY = "maintenance_ai_work_orders";
const UPDATED_EVENT = "workorders:updated";

export const STATUS = { PENDING: "Pending", COMPLETED: "Completed" };

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
