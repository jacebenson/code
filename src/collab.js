import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";
import { IndexeddbPersistence } from "y-indexeddb";

const NAMES = [
  "Otter", "Maple", "Comet", "Wren", "Pixel", "Ember", "Nimbus", "Quill",
  "Cedar", "Falcon", "Ruby", "Slate", "Juniper", "Marlow", "Aspen", "Tandem"
];

const COLORS = [
  "#f4b400", "#ff7b6d", "#83d49b", "#6ab0ff", "#d59bff", "#ffd166",
  "#5fd3c4", "#f78fb3", "#9ad5ff", "#c1e07a"
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

// A name per browser, stable across reloads so a returning peer is recognizable.
const identity = () => {
  const key = "code.jace.pro:identity";
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    if (saved && saved.name) return saved;
  } catch (_) {}
  const fresh = { name: pick(NAMES) + " " + Math.floor(Math.random() * 90 + 10), color: pick(COLORS) };
  try { localStorage.setItem(key, JSON.stringify(fresh)); } catch (_) {}
  return fresh;
};

const renderUsers = (container, awareness) => {
  if (!container) return;
  const states = [...awareness.getStates().values()];
  const seen = states.map((state) => (state && state.user) || null).filter(Boolean);
  container.innerHTML = "";
  seen.forEach((user) => {
    const row = document.createElement("div");
    row.className = "user";
    row.textContent = user.name || "Anonymous";
    row.style.color = user.color || "";
    container.appendChild(row);
  });
};

export function attachCollab({ editor, room, password, signaling, userlist, onStatus }) {
  const ydoc = new Y.Doc();
  const ytext = ydoc.getText("monaco");
  const options = {};
  if (password) options.password = password;
  if (signaling && signaling.length) options.signaling = signaling;

  const provider = new WebrtcProvider(room, ydoc, options);
  const persistence = new IndexeddbPersistence(room, ydoc);
  const binding = new MonacoBinding(ytext, editor.getModel(), new Set([editor]), provider.awareness);

  provider.awareness.setLocalStateField("user", identity());

  const status = () => ({
    room,
    peers: provider.awareness.getStates().size,
    connected: provider.connected,
    characters: ytext.length
  });

  const report = () => {
    renderUsers(userlist, provider.awareness);
    if (typeof onStatus === "function") onStatus(status());
  };

  provider.awareness.on("change", report);
  provider.on("status", report);
  report();
  const timer = window.setInterval(report, 2000);

  return { ydoc, ytext, provider, persistence, binding, status, stop: () => window.clearInterval(timer) };
}
