import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";
import { IndexeddbPersistence } from "y-indexeddb";
import { unusedUser } from "./characters.js";

const IDENTITY_KEY = "code.jace.pro:identity";
const NAME_LIMIT = 40;

const COLORS = [
  "#f4b400", "#ff7b6d", "#83d49b", "#6ab0ff", "#d59bff", "#ffd166",
  "#5fd3c4", "#f78fb3", "#9ad5ff", "#c1e07a"
];

// Same name, same color, so a returning peer is recognizable.
const colorFor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 100000;
  return COLORS[hash % COLORS.length];
};

const readStored = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(IDENTITY_KEY) || "null");
    if (saved && saved.name) return saved;
  } catch (_) {}
  return null;
};

const store = (identity) => {
  try { localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity)); } catch (_) {}
};

const namesInRoom = (awareness) =>
  [...awareness.getStates().values()].map((state) => state && state.user && state.user.name);

const buildIdentity = (awareness) => {
  const stored = readStored();
  if (stored) return { name: stored.name, color: stored.color || colorFor(stored.name) };
  const name = unusedUser(namesInRoom(awareness));
  return { name, color: colorFor(name) };
};

const renderUsers = (container, awareness) => {
  if (!container) return;
  const localId = awareness.clientID;
  const rows = [...awareness.getStates().entries()]
    .map(([clientId, state]) => ({ clientId, user: state && state.user }))
    .filter((entry) => entry.user && entry.user.name);

  container.innerHTML = "";
  rows.forEach(({ clientId, user }) => {
    const row = document.createElement("div");
    row.className = "user";
    row.textContent = user.name + (clientId === localId ? " (you)" : "");
    row.style.color = user.color || "";
    container.appendChild(row);
  });
};

export function attachCollab({ editor, room, password, signaling, userlist, nameInput, onStatus }) {
  const ydoc = new Y.Doc();
  const ytext = ydoc.getText("monaco");
  const options = {};
  if (password) options.password = password;
  if (signaling && signaling.length) options.signaling = signaling;

  const provider = new WebrtcProvider(room, ydoc, options);
  const persistence = new IndexeddbPersistence(room, ydoc);
  const binding = new MonacoBinding(ytext, editor.getModel(), new Set([editor]), provider.awareness);

  const currentUser = () => (provider.awareness.getLocalState() || {}).user || null;

  const setName = (raw) => {
    const cleaned = String(raw == null ? "" : raw).trim().slice(0, NAME_LIMIT);
    if (!cleaned) return currentUser();
    const user = { name: cleaned, color: colorFor(cleaned) };
    provider.awareness.setLocalStateField("user", user);
    store(user);
    if (nameInput) nameInput.value = user.name;
    report();
    return user;
  };

  const status = () => ({
    room,
    peers: provider.awareness.getStates().size,
    connected: provider.connected,
    characters: ytext.length,
    name: (currentUser() || {}).name || null
  });

  const report = () => {
    renderUsers(userlist, provider.awareness);
    if (typeof onStatus === "function") onStatus(status());
  };

  provider.awareness.setLocalStateField("user", buildIdentity(provider.awareness));

  if (nameInput) {
    nameInput.value = (currentUser() || {}).name || "";
    nameInput.addEventListener("change", () => setName(nameInput.value));
    nameInput.addEventListener("blur", () => setName(nameInput.value));
  }

  provider.awareness.on("change", report);
  provider.on("status", report);
  report();
  const timer = window.setInterval(report, 2000);

  return {
    ydoc,
    ytext,
    provider,
    persistence,
    binding,
    status,
    setName,
    currentUser,
    stop: () => window.clearInterval(timer)
  };
}
