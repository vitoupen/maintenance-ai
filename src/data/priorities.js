// Priority levels (anonymized hackathon dataset).
export const PRIORITIES = [
  { code: "P0", name: "Critical", description: "Immediate H&S risk or production stopped", responseTime: "1 hour", escalation: "Yes - Immediate" },
  { code: "P1", name: "Urgent", description: "Operational safety affected, no workaround", responseTime: "4 hours", escalation: "Yes" },
  { code: "P2", name: "High", description: "Work stopped, multiple users affected", responseTime: "24 hours", escalation: "If unresolved" },
  { code: "P3", name: "Standard", description: "Non-urgent, workaround exists, minor impact", responseTime: "3 days", escalation: "No" },
  { code: "P4", name: "Scheduled", description: "General / cosmetic / scheduled maintenance", responseTime: "10 days", escalation: "No" },
  { code: "PROJECT", name: "Project", description: "Planned project work - To Be Confirmed", responseTime: "TBC", escalation: "Project Dependent" },
];

export const PRIORITY_RANK = PRIORITIES.reduce((rank, p, index) => {
  rank[p.code] = index;
  return rank;
}, {});

export function getPriorityByCode(code) {
  return PRIORITIES.find((p) => p.code === code) ?? null;
}

export function formatPriority(code) {
  const p = getPriorityByCode(code);
  return p ? `${p.code} — ${p.name}` : code;
}
