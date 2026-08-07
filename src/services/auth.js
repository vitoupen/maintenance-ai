// Hardcoded admin credentials for the frontend-only prototype.
// Regular users don't need an account — only the admin dashboard is gated.
// Replace this whole module with real backend auth calls later.
const USERS = [
  { username: "admin", password: "admin123", role: "admin", name: "Admin" },
];

const STORAGE_KEY = "maintenance_ai_auth";

export function login(username, password) {
  const match = USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!match) {
    return { success: false, message: "Invalid username or password." };
  }

  const session = { username: match.username, role: match.role, name: match.name };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return { success: true, user: session };
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem(STORAGE_KEY));
}

export function getCurrentUser() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getRole() {
  const user = getCurrentUser();
  return user ? user.role : null;
}
