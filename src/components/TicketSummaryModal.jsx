import { useState } from "react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";
import TextInput from "./TextInput.jsx";
import { getPriorityByCode } from "../data/priorities.js";
import { updateWorkOrder, applyPriorityReconsideration } from "../services/workOrders.js";
import { reconsiderPriority } from "../services/aiAgent.js";

// Placeholder on purpose — a fabricated real-looking number could mislead
// someone in an actual emergency. Swap this for your facilities emergency
// line before shipping.
const EMERGENCY_CONTACT = "XXX-XXX-XXXX (replace with your facilities emergency line)";

export default function TicketSummaryModal({ order, onClose }) {
  const [requesterName, setRequesterName] = useState(order.requesterName);
  const [location, setLocation] = useState(order.location);
  const [description, setDescription] = useState(order.description);
  const [priority, setPriority] = useState(order.priority);
  const [explanation, setExplanation] = useState(null);
  const [reason, setReason] = useState("");
  const [isReconsidering, setIsReconsidering] = useState(false);
  const [saved, setSaved] = useState(false);

  const priorityInfo = getPriorityByCode(priority);
  const isUrgent = priority === "P0" || priority === "P1";

  const handleSaveDetails = () => {
    updateWorkOrder(order.id, { requesterName, location, description });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleReconsider = async () => {
    if (!reason.trim() || isReconsidering) return;
    setIsReconsidering(true);
    setExplanation(null);
    const result = await reconsiderPriority({
      location,
      description,
      category: order.category,
      priority,
      reason: reason.trim(),
    });
    setIsReconsidering(false);

    if (!result) {
      setExplanation("Couldn't reach the local model to review this — please try again, or call the emergency line above if it's urgent.");
      return;
    }

    applyPriorityReconsideration(order.id, {
      reason: reason.trim(),
      newPriority: result.priority,
      explanation: result.explanation,
    });
    setPriority(result.priority);
    setExplanation(result.explanation);
    setReason("");
  };

  return (
    <Modal
      open
      title="Request Submitted"
      onClose={onClose}
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <div className="flex flex-col gap-4 text-left">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Ticket Number</p>
          <p className="font-mono text-sm text-slate-800">{order.id}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isUrgent ? "bg-red-600 text-white" : "bg-primary-50 text-primary-700"
            }`}
          >
            {priority}
          </span>
          <span className="text-sm text-slate-600">
            {priorityInfo?.name} — response within {priorityInfo?.responseTime}
          </span>
        </div>

        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            isUrgent ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          <p className="font-medium">Need immediate help?</p>
          <p>
            Call the facilities emergency line:{" "}
            <span className="font-mono">{EMERGENCY_CONTACT}</span>
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
          <TextInput
            id="ticket-requesterName"
            label="Requested By"
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
          />
          <TextInput
            id="ticket-location"
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ticket-description" className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="ticket-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm
                text-slate-800 shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary"
            />
          </div>
          <Button variant="secondary" size="sm" className="self-start" onClick={handleSaveDetails}>
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-700">Think this priority is wrong?</p>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why, e.g. this is blocking a whole team from working"
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm
              text-slate-800 placeholder:text-slate-400 shadow-sm
              focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary"
          />
          <Button
            size="sm"
            className="self-start"
            onClick={handleReconsider}
            disabled={!reason.trim() || isReconsidering}
          >
            {isReconsidering ? "Reviewing..." : "Ask AI to reconsider"}
          </Button>
          {explanation && <p className="text-xs text-slate-500">{explanation}</p>}
        </div>
      </div>
    </Modal>
  );
}
