// Tool definitions + execution for the admin chat (see adminAgent.js). These
// wrap the same functions the Admin dashboard's buttons already call —
// nothing here bypasses workOrders.js, so every change made through the chat
// shows up on the dashboard exactly like a manual edit would (same
// writeAll()/update-event plumbing).

import {
  STATUS,
  getWorkOrders,
  updateWorkOrder,
  setWorkOrderStatus,
  setWorkOrderTechnician,
  setWorkOrderArchived,
} from "./workOrders.js";
import { TEAM } from "../data/team.js";
import { PRIORITIES } from "../data/priorities.js";

const PRIORITY_CODES = PRIORITIES.map((p) => p.code);
const STATUS_VALUES = Object.values(STATUS);

function findTechnicianByName(name) {
  if (!name) return null;
  const lower = name.trim().toLowerCase();
  return (
    TEAM.find((t) => t.name.toLowerCase() === lower) ??
    TEAM.find((t) => t.name.toLowerCase().includes(lower)) ??
    null
  );
}

function summarize(order) {
  const label = order.title || order.description.slice(0, 50);
  return `${order.id}: "${label}" — status: ${order.status}, priority: ${order.priority}, requested by ${order.requesterName} at ${order.location}`;
}

export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "find_work_orders",
      description:
        "Search work orders by free text (matches requester name, location, description, title, category) and/or status. Always use this first to find a work order's exact ID before acting on it.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free text to search for. Leave empty to list all." },
          status: { type: "string", enum: STATUS_VALUES, description: "Optionally filter by status." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_status",
      description: "Change a work order's status (Open, In Progress, or Resolved).",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "The work order ID, e.g. HS-003 or WO-4F2A." },
          status: { type: "string", enum: STATUS_VALUES },
        },
        required: ["id", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_priority",
      description: "Change a work order's priority.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          priority: { type: "string", enum: PRIORITY_CODES },
        },
        required: ["id", "priority"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "assign_technician",
      description: "Assign a technician to a work order, or unassign by omitting technicianName.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          technicianName: {
            type: "string",
            description: `One of: ${TEAM.map((t) => t.name).join(", ")}. Leave empty to unassign.`,
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "archive_work_order",
      description: "Archive a Resolved work order so it no longer shows in the active Resolved list. Only works on work orders that are already Resolved.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
  },
];

export function executeTool(name, args = {}) {
  switch (name) {
    case "find_work_orders": {
      const all = getWorkOrders();
      const query = (args.query || "").toLowerCase().trim();
      const matches = all
        .filter((o) => {
          if (args.status && o.status !== args.status) return false;
          if (!query) return true;
          const haystack = `${o.requesterName} ${o.location} ${o.description} ${o.category} ${o.title ?? ""}`.toLowerCase();
          return haystack.includes(query);
        })
        .slice(0, 10);
      return matches.length === 0 ? "No matching work orders found." : matches.map(summarize).join("\n");
    }

    case "set_status": {
      if (!STATUS_VALUES.includes(args.status)) {
        return `"${args.status}" isn't a valid status. Use one of: ${STATUS_VALUES.join(", ")}.`;
      }
      const updated = setWorkOrderStatus(args.id, args.status);
      return updated ? `Updated ${args.id} to status "${args.status}".` : `No work order found with id "${args.id}".`;
    }

    case "set_priority": {
      if (!PRIORITY_CODES.includes(args.priority)) {
        return `"${args.priority}" isn't a valid priority. Use one of: ${PRIORITY_CODES.join(", ")}.`;
      }
      const updated = updateWorkOrder(args.id, { priority: args.priority });
      return updated ? `Updated ${args.id} priority to ${args.priority}.` : `No work order found with id "${args.id}".`;
    }

    case "assign_technician": {
      const member = findTechnicianByName(args.technicianName);
      if (args.technicianName && !member) {
        return `No technician named "${args.technicianName}" found. Team: ${TEAM.map((t) => t.name).join(", ")}.`;
      }
      const updated = setWorkOrderTechnician(args.id, member?.id ?? null);
      if (!updated) return `No work order found with id "${args.id}".`;
      return member ? `Assigned ${member.name} to ${args.id}.` : `Unassigned ${args.id}.`;
    }

    case "archive_work_order": {
      const order = getWorkOrders().find((o) => o.id === args.id);
      if (!order) return `No work order found with id "${args.id}".`;
      if (order.status !== STATUS.RESOLVED) {
        return `Only Resolved work orders can be archived — ${args.id} is currently ${order.status}.`;
      }
      setWorkOrderArchived(args.id, true);
      return `Archived ${args.id}.`;
    }

    default:
      return `Unknown tool "${name}".`;
  }
}
