# Maintenance AI Assistant

A frontend-only prototype of a maintenance request system, built with React,
Vite, Tailwind CSS, and React Router.

Anyone can open the app and submit a work request through a ChatGPT-style
conversation — no account needed. Submitted requests show up live on the
admin dashboard, which is login-protected. The AI side of the conversation is
powered by a local [Ollama](https://ollama.com) model, `maintenance-llama` (a
`llama3.1` base customized via the [`Modelfile`](Modelfile) at the project
root) — see [Connecting a real model](#connecting-a-real-model) for how it's
wired up and how to swap the model.

The priority scale (P0 Critical → P4 Scheduled, plus PROJECT), hazard
categories, the 90-location building directory, and the 8-person facilities
team roster are all real (anonymized) data from a hackathon facilities
dataset — see [`src/data/`](src/data). The 20 seeded work orders on first run
are the dataset's real anonymized issues (two are marked Resolved for demo
purposes; the source data only has Open/In Progress).

After submitting a request, a popup shows the ticket number, assigned
priority, and a placeholder emergency contact — the requester can edit their
own details, or explain why they think the priority is wrong and have the AI
re-evaluate it (see [The ticket popup](#the-ticket-popup)). On the admin
side, a floating chat widget lets an admin make changes ("mark HS-003 in
progress", "assign Riley Chen to the urinal ticket") through conversation
instead of clicking — see [The admin chat](#the-admin-chat).

## Quick start

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`) and submit
a request. To see it land on the dashboard, open `/#/login` and sign in with
the admin account below.

Requires [Node.js](https://nodejs.org) 18+ (includes npm).

## Demo account (admin dashboard only)

| Username | Password  |
| -------- | --------- |
| `admin`  | `admin123` |

## Installation

```bash
npm install
```

## Run (development)

```bash
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

## Build (production)

```bash
npm run build
```

Output is written to `dist/`.

```bash
npm run preview
```

Serves the production build locally so you can sanity-check it before deploying.

## Deploying to GitHub Pages

1. Create a GitHub repository named `maintenance-ai` (or update `base` in
   `vite.config.js` to match whatever repo name you use).
2. Install the deploy dependency (already listed in `package.json`):
   ```bash
   npm install
   ```
3. Build and publish the `dist/` folder to the `gh-pages` branch:
   ```bash
   npm run deploy
   ```
4. In your repository settings, enable GitHub Pages for the `gh-pages` branch.
5. The app will be available at `https://<your-username>.github.io/maintenance-ai/`.

> The app uses `HashRouter` specifically so client-side routes (`/admin`,
> `/login`) work correctly on GitHub Pages without extra server config.

## Connecting a real model

**Edit only [`src/services/aiAgent.js`](src/services/aiAgent.js).** Every
other file (the chat UI, work order storage, admin dashboard) talks to the
agent exclusively through its exported `getAgentResponse()` function, so
nothing else needs to change when you swap in a real model.

The function's contract:

```js
// input
{
  messages: [{ role: "user" | "assistant", content: string }, ...],
  draft: { requesterName, location, description, awaitingConfirmation },
}

// output
{
  reply: string,        // assistant's next message
  draft: { ...same shape, updated },
  complete: boolean,    // true once a work order is ready
  workOrder?: { requesterName, location, description, priority, category }, // if complete
}
```

`priority` must be one of the codes in [`src/data/priorities.js`](src/data/priorities.js)
(`P0`–`P4` or `PROJECT`) and `category` one of the strings in
[`src/data/categories.js`](src/data/categories.js) — the admin dashboard
renders both from those lists, badges and all.

### How the current implementation works

`getAgentResponse()` calls Ollama's `/api/chat` at `http://localhost:11434`
with a system prompt (built in `buildSystemPrompt()`) that:

- Instructs the model to collect `requesterName` / `location` / `description`
  across the conversation, then ask for confirmation before submitting.
- Interpolates the real priority and category lists directly into the prompt,
  so the model only ever sees valid options to choose from.
- Requires every reply to end with a fenced ` ```json ` block carrying the
  model's current understanding of the draft, a `complete` flag, and — once
  complete — a `priority` code and `category`.

That block is parsed out of the reply and hidden from the user; if the model
ever omits it or returns something unparseable, the conversation just
continues with whatever text it did produce rather than crashing. Priority
and category are also validated against the real lists on the way out, with
safe fallbacks (`P3` / `General Maintenance`) if the model ever returns
something invalid.

**Prerequisites:** [Ollama](https://ollama.com) installed and running, with
the base model pulled and the custom model built from the
[`Modelfile`](Modelfile):

```bash
ollama pull llama3.1
ollama create maintenance-llama -f Modelfile
```

If Ollama isn't running or the model doesn't exist, the chat shows a clear
error message telling the user what to do instead of failing silently.

### Why a custom Modelfile

`Modelfile` builds `maintenance-llama` as a `llama3.1` base with
`temperature` lowered to `0.3`. `aiAgent.js` always sends its own system
message (built dynamically so it stays in sync with `src/data/`), which
overrides the Modelfile's `SYSTEM` block for every real request — so the
Modelfile's actual job here is the `PARAMETER` settings, not the prompt. A
lower temperature makes the model far more consistent about following the
"always end with a fenced json block" instruction, which directly reduces
the most common failure mode (skipping the fence and silently dropping the
submission — `aiAgent.js` has a fallback for when that still happens, but
fewer occurrences is better).

To tweak it: edit `Modelfile`, then rebuild with the same `ollama create`
command above — it overwrites the existing `maintenance-llama` in place.

**To use a different base model:** change both `FROM` in `Modelfile` and the
`MODEL` constant at the top of `aiAgent.js`, then rebuild. Any
instruction-following chat model works — this integration uses a
JSON-in-text convention rather than native tool-calling, so no particular
tool-calling support is required.

`src/services/auth.js` is the other mockable piece — it currently checks a
hardcoded admin login and stores the session in `localStorage`. Replace
`login()` with a call to a real auth endpoint when you have a backend.

## The ticket popup

[`TicketSummaryModal.jsx`](src/components/TicketSummaryModal.jsx) opens
right after a request is submitted. It shows the generated ticket number
(`WO-XXXX`, or the original `HS-###` ID for seeded tickets), the assigned
priority with its response time, and lets the requester:

- **Edit their own details** (name, location, description) and save changes.
- **Call the emergency line** — the number shown is a deliberate placeholder
  (`XXX-XXX-XXXX`). Swap `EMERGENCY_CONTACT` in that file for your facilities
  emergency line before this goes anywhere real; a fabricated real-looking
  number could mislead someone in an actual emergency.
- **Ask the AI to reconsider the priority.** They explain why in a text box;
  `reconsiderPriority()` in `aiAgent.js` sends that reason plus the ticket
  details to the model, which decides on a (possibly unchanged) priority and
  a one-sentence explanation. Both are saved to the ticket as `priorityNote`
  (`{ reason, explanation, previousPriority, updatedAt }`) so there's a
  record of why it changed — visible to anyone reading the raw work order
  even though the current admin UI doesn't surface it in its own column yet.

## The admin chat

[`AdminChat.jsx`](src/components/AdminChat.jsx) is the floating 💬 button on
the admin dashboard. It's a real tool-calling agent, not the JSON-in-text
convention the public chat uses — [`adminAgent.js`](src/services/adminAgent.js)
sends Ollama's native `tools` parameter, and [`agentTools.js`](src/services/agentTools.js)
defines what the model can do:

- `find_work_orders` — search by text and/or status (always called first to
  resolve a ticket's exact ID)
- `set_status`, `set_priority`, `assign_technician`, `archive_work_order`

Every tool is a thin wrapper around the same `workOrders.js` functions the
dashboard's buttons call, so anything the chat does shows up live in the
tables immediately, and deleting a work order is deliberately **not** exposed
as a tool — that stays a manual, confirmed action only.

**Reliability note:** local 8B models are inconsistent with tool-calling —
in testing, `maintenance-llama` sometimes wrote out a tool call as plain
text (e.g. `find_work_orders` or a raw JSON blob) instead of using the
proper mechanism. `adminAgent.js` detects both patterns and recovers: a
bare tool name or JSON-shaped text is parsed and executed like a real tool
call, and if the model still doesn't give a clean final answer, the reply
falls back to the literal result of the last action taken (e.g. `Updated
HS-003 to status "In Progress".`) rather than showing garbage or a made-up
summary.

## Project structure

```
maintenance-ai/
├── public/
├── src/
│   ├── assets/
│   ├── components/       # Reusable UI building blocks, incl. TicketSummaryModal, AdminChat
│   ├── data/               # locations.js, team.js, priorities.js, categories.js
│   ├── pages/             # RequestWork (public), Login, Admin
│   ├── services/          # auth.js, aiAgent.js, adminAgent.js, agentTools.js, workOrders.js
│   ├── hooks/              # useAuth.js
│   ├── styles/             # Tailwind entrypoint
│   ├── App.jsx             # Route definitions
│   └── main.jsx             # App bootstrap
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── Modelfile                # Custom Ollama model (maintenance-llama)
```
