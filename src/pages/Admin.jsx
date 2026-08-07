import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import StatCard from "../components/StatCard.jsx";
import Table from "../components/Table.jsx";
import Button from "../components/Button.jsx";
import Modal from "../components/Modal.jsx";
import TextInput from "../components/TextInput.jsx";
import { useAuth } from "../hooks/useAuth.js";
import {
  STATUS,
  getWorkOrders,
  subscribeToWorkOrders,
  updateWorkOrder,
  setWorkOrderStatus,
  deleteWorkOrder,
} from "../services/workOrders.js";

const PRIORITY_STYLES = {
  High: "bg-red-50 text-red-600",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-slate-100 text-slate-500",
};

const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

function formatTimestamp(iso) {
  return iso ? new Date(iso).toLocaleString() : "—";
}

function priorityBadge(row) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        PRIORITY_STYLES[row.priority] ?? PRIORITY_STYLES.Low
      }`}
    >
      {row.priority}
    </span>
  );
}

const EMPTY_FORM = { requesterName: "", location: "", description: "", priority: "Low" };

export default function Admin() {
  const { user, logout } = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setWorkOrders(getWorkOrders());
    return subscribeToWorkOrders(setWorkOrders);
  }, []);

  const pending = workOrders.filter((order) => order.status !== STATUS.COMPLETED);
  const completed = workOrders.filter((order) => order.status === STATUS.COMPLETED);

  const openEdit = (order) => {
    setEditingId(order.id);
    setForm({
      requesterName: order.requesterName,
      location: order.location,
      description: order.description,
      priority: order.priority,
    });
  };

  const closeEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    updateWorkOrder(editingId, form);
    closeEdit();
  };

  const handleDelete = (order) => {
    if (window.confirm(`Delete the work order from ${order.requesterName}?`)) {
      deleteWorkOrder(order.id);
    }
  };

  const pendingColumns = [
    { key: "requesterName", header: "Requested By" },
    { key: "location", header: "Location" },
    { key: "description", header: "Description" },
    { key: "priority", header: "Priority", render: priorityBadge },
    { key: "submittedAt", header: "Submitted", render: (row) => formatTimestamp(row.submittedAt) },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setWorkOrderStatus(row.id, STATUS.COMPLETED)}>
            Mark Complete
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const completedColumns = [
    { key: "requesterName", header: "Requested By" },
    { key: "location", header: "Location" },
    { key: "description", header: "Description" },
    { key: "priority", header: "Priority", render: priorityBadge },
    { key: "completedAt", header: "Completed", render: (row) => formatTimestamp(row.completedAt) },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setWorkOrderStatus(row.id, STATUS.PENDING)}>
            Reopen
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar
        title="Admin Console"
        items={[{ label: "Dashboard", icon: "📊", to: "/admin", end: true }]}
        footerItems={[{ label: "Logout", icon: "↩", onClick: logout }]}
      />

      <div className="flex flex-1 flex-col overflow-y-auto scrollbar-thin">
        <Navbar title="Dashboard" subtitle={`Signed in as ${user?.name ?? "Admin"}`} />

        <main className="flex-1 px-6 py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:max-w-xl">
            <StatCard label="Total Work Orders" value={workOrders.length} icon="🧰" />
            <StatCard label="Pending" value={pending.length} icon="⏳" />
            <StatCard label="Completed" value={completed.length} icon="✅" />
          </div>

          <section className="mt-8 mb-8">
            <h3 className="text-base font-semibold text-slate-800">Pending Work Orders</h3>
            <p className="text-sm text-slate-500">
              Submissions from the public request form appear here automatically.
            </p>
            <div className="mt-3">
              <Table columns={pendingColumns} rows={pending} emptyMessage="No pending work orders." />
            </div>
          </section>

          <section className="mb-4">
            <h3 className="text-base font-semibold text-slate-800">Completed Work Orders</h3>
            <div className="mt-3">
              <Table
                columns={completedColumns}
                rows={completed}
                emptyMessage="No work orders completed yet."
              />
            </div>
          </section>
        </main>
      </div>

      <Modal
        open={editingId !== null}
        title="Edit Work Order"
        onClose={closeEdit}
        footer={
          <>
            <Button variant="secondary" onClick={closeEdit}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-left">
          <TextInput
            id="edit-requesterName"
            label="Requested By"
            value={form.requesterName}
            onChange={(e) => setForm((f) => ({ ...f, requesterName: e.target.value }))}
          />
          <TextInput
            id="edit-location"
            label="Location"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-description" className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="edit-description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm
                text-slate-800 shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-priority" className="text-sm font-medium text-slate-700">
              Priority
            </label>
            <select
              id="edit-priority"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm
                text-slate-800 shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
