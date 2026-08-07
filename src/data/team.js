// Facilities team roster (anonymized hackathon dataset).
export const TEAM = [
  { id: "FT001", name: "Alex Morgan", role: "Facilities Supervisor", specialisation: "General Facilities Management" },
  { id: "FT002", name: "Jordan Smith", role: "Senior Technician", specialisation: "Electrical & Building Systems" },
  { id: "FT003", name: "Casey Taylor", role: "Facilities Coordinator", specialisation: "Request Coordination & Scheduling" },
  { id: "FT004", name: "Riley Chen", role: "Maintenance Technician", specialisation: "HVAC & Plumbing" },
  { id: "FT005", name: "Morgan Garcia", role: "Health & Safety Officer", specialisation: "H&S Compliance & Risk Assessment" },
  { id: "FT006", name: "Drew Williams", role: "Building Services Technician", specialisation: "Carpentry & General Repairs" },
  { id: "FT007", name: "Jamie Thompson", role: "Cleaning Services Lead", specialisation: "Cleaning & Hygiene Services" },
  { id: "FT008", name: "Sam Brown", role: "Security Systems Technician", specialisation: "Access Control & Security" },
];

export function getTeamMemberById(id) {
  return TEAM.find((member) => member.id === id) ?? null;
}

export function formatTeamMember(member) {
  return member ? `${member.name} — ${member.specialisation}` : "";
}
