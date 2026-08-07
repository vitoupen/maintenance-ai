import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import StatCard from "../components/StatCard.jsx";
import Table from "../components/Table.jsx";
import Button from "../components/Button.jsx";
import Modal from "../components/Modal.jsx";
import TextInput from "../components/TextInput.jsx";
import AdminChat from "../components/AdminChat.jsx";
import { useAuth } from "../hooks/useAuth.js";
import {
  STATUS,
  getWorkOrders,
  subscribeToWorkOrders,
  updateWorkOrder,
  setWorkOrderStatus,
  setWorkOrderTechnician,
  setWorkOrderArchived,
  deleteWorkOrder,
} from "../services/workOrders.js";
import { PRIORITIES, PRIORITY_RANK } from "../data/priorities.js";
import { TEAM, getTeamMemberById } from "../data/team.js";
import { CATEGORIES } from "../data/categories.js";
import { LOCATIONS_BY_BUILDING, getLocationById, formatLocation } from "../data/locations.js";

const PRIORITY_STYLES = {
  P0: "bg-red-600 text-white",
  P1: "bg-red-50 text-red-600",
  P2: "bg-amber-50 text-amber-600",
  P3: "bg-blue-50 text-blue-600",
  P4: "bg-slate-100 text-slate-500",
  PROJECT: "bg-purple-50 text-purple-600",
};

function formatTimestamp(iso) {
  return iso ? new Date(iso).toLocaleString() : "—";
}

function priorityBadge(row) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${
        PRIORITY_STYLES[row.priority] ?? PRIORITY_STYLES.P4
      }`}
    >
      {row.priority}
    </span>
  );
}

function technicianSelect(row) {
  return (
    <select
      value={row.technicianId ?? ""}
      onChange={(e) => setWorkOrderTechnician(row.id, e.target.value)}
      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700
        focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary"
    >
      <option value="">Unassigned</option>
      {TEAM.map((member) => (
        <option key={member.id} value={member.id}>
          {member.name}
        </option>
      ))}
    </select>
  );
}

// Resolved (and archived) work orders are read-only on the technician front —
// reassigning a closed-out request doesn't make sense, so just show who it
// was last assigned to instead of an editable dropdown.
function technicianLabel(row) {
  const member = row.technicianId ? getTeamMemberById(row.technicianId) : null;
  return <span className="text-xs text-slate-500">{member ? member.name : "Unassigned"}</span>;
}

const EMPTY_FORM = {
  requesterName: "",
  location: "",
  locationId: "",
  description: "",
  priority: "P3",
  category: "General Maintenance",
};

const PRIORITY_FILTER_OPTIONS = ["All", ...PRIORITIES.map((p) => p.code)];
const CATEGORY_FILTER_OPTIONS = ["All", ...CATEGORIES];
const TECHNICIAN_FILTER_OPTIONS = ["All", "Unassigned", ...TEAM.map((t) => t.id)];

function matchesFilters(order, search, priorityFilter, categoryFilter, technicianFilter) {
  if (priorityFilter !== "All" && order.priority !== priorityFilter) return false;
  if (categoryFilter !== "All" && order.category !== categoryFilter) return false;
  if (technicianFilter === "Unassigned" && order.technicianId) return false;
  if (
    technicianFilter !== "All" &&
    technicianFilter !== "Unassigned" &&
    order.technicianId !== technicianFilter
  ) {
    return false;
  }
  if (!search.trim()) return true;
  const haystack = `${order.requesterName} ${order.location} ${order.description} ${order.category}`.toLowerCase();
  return haystack.includes(search.trim().toLowerCase());
}

function sortByPriority(a, b) {
  return (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99);
}

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [technicianFilter, setTechnicianFilter] = useState("All");

  useEffect(() => {
    setWorkOrders(getWorkOrders());
    return subscribeToWorkOrders(setWorkOrders);
  }, []);

  // Stat cards always reflect the true totals; only the tables below react to filters.
  const totalOpen = workOrders.filter((o) => o.status === STATUS.OPEN).length;
  const totalInProgress = workOrders.filter((o) => o.status === STATUS.IN_PROGRESS).length;
  const totalResolved = workOrders.filter((o) => o.status === STATUS.RESOLVED && !o.archived).length;
  const totalArchived = workOrders.filter((o) => o.archived).length;
  const totalUnassigned = workOrders.filter(
    (o) => o.status !== STATUS.RESOLVED && !o.technicianId
  ).length;

  const filtered = workOrders.filter((order) =>
    matchesFilters(order, search, priorityFilter, categoryFilter, technicianFilter)
  );
  const open = filtered.filter((o) => o.status === STATUS.OPEN).sort(sortByPriority);
  const inProgress = filtered.filter((o) => o.status === STATUS.IN_PROGRESS).sort(sortByPriority);
  const resolved = filtered
    .filter((o) => o.status === STATUS.RESOLVED && !o.archived)
    .sort((a, b) => new Date(b.resolvedAt) - new Date(a.resolvedAt));
  const archived = filtered
    .filter((o) => o.archived)
    .sort((a, b) => new Date(b.resolvedAt) - new Date(a.resolvedAt));

  const openEdit = (order) => {
    setEditingId(order.id);
    setForm({
      requesterName: order.requesterName,
      location: order.location,
      locationId: order.locationId ?? "",
      description: order.description,
      priority: order.priority,
      category: order.category,
    });
  };

  const closeEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    updateWorkOrder(editingId, {
      requesterName: form.requesterName,
      location: form.location,
      locationId: form.locationId || null,
      description: form.description,
      priority: form.priority,
      category: form.category,
    });
    closeEdit();
  };

  const handleLocationChange = (locationId) => {
    const loc = getLocationById(locationId);
    setForm((f) => ({ ...f, locationId, location: loc ? formatLocation(loc) : f.location }));
  };

  const handleDelete = (order) => {
    if (window.confirm(`Delete the work order from ${order.requesterName}?`)) {
      deleteWorkOrder(order.id);
    }
  };

  const editingOrder = workOrders.find((o) => o.id === editingId);

  function baseColumns() {
    return [
      { key: "requesterName", header: "Requested By" },
      { key: "location", header: "Location" },
      { key: "description", header: "Issue", render: (row) => (
        <div className="max-w-xs">
          {row.title && <p className="font-medium text-slate-800">{row.title}</p>}
          <p className="line-clamp-2 text-slate-500">{row.description}</p>
        </div>
      ) },
      { key: "category", header: "Category" },
      { key: "priority", header: "Priority", render: priorityBadge },
      { key: "technician", header: "Technician", render: technicianSelect },
    ];
  }

  const openColumns = [
    ...baseColumns(),
    { key: "submittedAt", header: "Submitted", render: (row) => formatTimestamp(row.submittedAt) },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setWorkOrderStatus(row.id, STATUS.IN_PROGRESS)}>
            Start Progress
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setWorkOrderStatus(row.id, STATUS.RESOLVED)}>
            Mark Resolved
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

  const inProgressColumns = [
    ...baseColumns(),
    { key: "submittedAt", header: "Submitted", render: (row) => formatTimestamp(row.submittedAt) },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setWorkOrderStatus(row.id, STATUS.RESOLVED)}>
            Mark Resolved
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setWorkOrderStatus(row.id, STATUS.OPEN)}>
            Back to Open
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

  // Resolved rows: technician is shown read-only (reassigning a closed-out
  // request doesn't make sense), and deletion is disallowed — the only ways
  // out are reopening it or archiving it.
  const resolvedColumns = [
    ...baseColumns().map((col) => (col.key === "technician" ? { ...col, render: technicianLabel } : col)),
    { key: "resolvedAt", header: "Resolved", render: (row) => formatTimestamp(row.resolvedAt) },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setWorkOrderStatus(row.id, STATUS.OPEN)}>
            Reopen
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setWorkOrderArchived(row.id, true)}>
            Archive
          </Button>
        </div>
      ),
    },
  ];

  // Archived rows follow the same no-delete policy — only Reopen brings one back.
  const archivedColumns = [
    ...baseColumns().map((col) => (col.key === "technician" ? { ...col, render: technicianLabel } : col)),
    { key: "resolvedAt", header: "Resolved", render: (row) => formatTimestamp(row.resolvedAt) },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => setWorkOrderStatus(row.id, STATUS.OPEN)}>
          Reopen
        </Button>
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
        <Navbar
          title="Dashboard"
          subtitle={`Signed in as ${user?.name ?? "Admin"}`}
          right={
            <Button variant="secondary" size="sm" onClick={() => navigate("/")}>
              ← Back to Home
            </Button>
          }
        />

        <main className="flex-1 px-6 py-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total Work Orders" value={workOrders.length} icon="🧰" />
            <StatCard label="Unassigned" value={totalUnassigned} icon="🙋" />
            <StatCard label="Open" value={totalOpen} icon="🟡" />
            <StatCard label="In Progress" value={totalInProgress} icon="🔧" />
            <StatCard label="Resolved" value={totalResolved} icon="✅" />
            <StatCard label="Archived" value={totalArchived} icon="🗄️" />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, location, description, category..."
              aria-label="Search work orders"
              className="w-full flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm
                text-slate-800 placeholder:text-slate-400 shadow-sm
                focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary sm:max-w-xs"
            />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Filter by priority"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm
                text-slate-800 shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary"
            >
              {PRIORITY_FILTER_OPTIONS.map((code) => (
                <option key={code} value={code}>
                  {code === "All" ? "All priorities" : code}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm
                text-slate-800 shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary"
            >
              {CATEGORY_FILTER_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "All categories" : cat}
                </option>
              ))}
            </select>
            <select
              value={technicianFilter}
              onChange={(e) => setTechnicianFilter(e.target.value)}
              aria-label="Filter by technician"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm
                text-slate-800 shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary"
            >
              {TECHNICIAN_FILTER_OPTIONS.map((id) => (
                <option key={id} value={id}>
                  {id === "All" ? "All technicians" : id === "Unassigned" ? "Unassigned" : getTeamMemberById(id)?.name}
                </option>
              ))}
            </select>
          </div>

          <section className="mt-8 mb-8">
            <h3 className="text-base font-semibold text-slate-800">Open</h3>
            <p className="text-sm text-slate-500">
              Submissions from the public request form appear here automatically, sorted by priority.
            </p>
            <div className="mt-3">
              <Table columns={openColumns} rows={open} emptyMessage="No open work orders." />
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-semibold text-slate-800">In Progress</h3>
            <div className="mt-3">
              <Table columns={inProgressColumns} rows={inProgress} emptyMessage="Nothing in progress." />
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-semibold text-slate-800">Resolved</h3>
            <div className="mt-3">
              <Table columns={resolvedColumns} rows={resolved} emptyMessage="No work orders resolved yet." />
            </div>
          </section>

          <section className="mb-4">
            <h3 className="text-base font-semibold text-slate-800">Archived</h3>
            <div className="mt-3">
              <Table columns={archivedColumns} rows={archived} emptyMessage="No work orders archived yet." />
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
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-location" className="text-sm font-medium text-slate-700">
              Location
            </label>
            <select
              id="edit-location"
              value={form.locationId}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm
                text-slate-800 shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary"
            >
              <option value="">Select a location…</option>
              {Object.entries(LOCATIONS_BY_BUILDING).map(([building, locs]) => (
                <optgroup key={building} label={building}>
                  {locs.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.area}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {!editingOrder?.locationId && (
              <p className="text-xs text-slate-400">Originally entered: "{form.location}"</p>
            )}
          </div>
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
              {PRIORITIES.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code} — {p.name} ({p.responseTime})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-category" className="text-sm font-medium text-slate-700">
              Category
            </label>
            <select
              id="edit-category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm
                text-slate-800 shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <AdminChat />
    </div>
  );
}
