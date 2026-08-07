# Maintenance AI Assistant

A frontend-only prototype of a maintenance request system, built with React,
Vite, Tailwind CSS, and React Router.

Anyone can open the app and submit a work request through a ChatGPT-style
conversation — no account needed. Submitted requests show up live on the
admin dashboard, which is login-protected. The AI side of the conversation is
currently simulated — see [Connecting a real model](#connecting-a-real-model)
to hook up a local LLM.

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
  workOrder?: { requesterName, location, description, priority }, // if complete
}
```

Right now `getAgentResponse()` is a simple rule-based simulation (no network
calls) that asks for name → location → description, then confirms before
submitting. To connect a local model (e.g. [Ollama](https://ollama.com)),
replace its body with something like:

```js
export async function getAgentResponse({ messages, draft }) {
  const res = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3",
      stream: false,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    }),
  });
  const data = await res.json();
  return parseModelReply(data.message.content, draft); // your own parsing logic
}
```

Full guidance and an extended example are in the comment block at the top of
that file.

`src/services/auth.js` is the other mockable piece — it currently checks a
hardcoded admin login and stores the session in `localStorage`. Replace
`login()` with a call to a real auth endpoint when you have a backend.

## Project structure

```
maintenance-ai/
├── public/
├── src/
│   ├── assets/
│   ├── components/       # Reusable UI building blocks
│   ├── pages/             # RequestWork (public), Login, Admin
│   ├── services/          # auth.js, aiAgent.js, workOrders.js
│   ├── hooks/              # useAuth.js
│   ├── styles/             # Tailwind entrypoint
│   ├── App.jsx             # Route definitions
│   └── main.jsx             # App bootstrap
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```
