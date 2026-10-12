// WebMCP tools for the code.jace.pro playground.
// WebMCP is an early-preview browser API. The page works normally without it.
(() => {
  const modelContext = document.modelContext;
  if (!modelContext?.registerTool) return;

  const MAX_CONTENT = 8000;

  const selectFor = (id) => document.getElementById(id);
  const optionsFor = (id) => {
    const select = selectFor(id);
    return select ? [...select.options].map((option) => option.value) : [];
  };
  const valueFor = (id) => {
    const select = selectFor(id);
    return select ? select.value : null;
  };

  const roomKey = () => {
    const url = new URL(location.href);
    const fromQuery = url.searchParams.get("id");
    if (fromQuery) return fromQuery;
    const fromPath = url.pathname.replace(/^\/+|\/+$/g, "");
    return fromPath || null;
  };

  const editor = () => window.editor || null;

  const fit = (payload) => {
    const json = JSON.stringify(payload);
    if (json.length <= 1500) return json;
    const trimmed = { ...payload, content: null, contentNote: "Content omitted to stay within the result budget. Call with a shorter document or read the page directly." };
    return JSON.stringify(trimmed);
  };

  const applySelect = (id, value, handlerName) => {
    const select = selectFor(id);
    if (!select) return { ok: false, reason: "This page has no control for that setting." };
    const options = [...select.options];
    const match = options.find((option) => option.value === value || option.text === value);
    if (!match) {
      const names = options.map((option) => option.value);
      return { ok: false, reason: `Valid values are: ${names.slice(0, 12).join(", ")}${names.length > 12 ? ` (${names.length} total)` : ""}` };
    }
    select.value = match.value;
    const handler = window[handlerName];
    if (typeof handler === "function") handler();
    return { ok: true, value: match.value };
  };

  const languages = optionsFor("lang");
  const themes = optionsFor("theme");
  const indentUnits = optionsFor("indentUnit");

  modelContext.registerTool({
    name: "code_editor_read",
    description: "Read the current code, language, theme, and indent unit in the code.jace.pro editor. Read-only.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    execute: async () => {
      const instance = editor();
      const content = instance ? instance.getValue() : null;
      return fit({
        page: location.href,
        room: roomKey(),
        editorReady: Boolean(instance),
        language: valueFor("lang"),
        theme: valueFor("theme"),
        indentUnit: valueFor("indentUnit"),
        contentCharacters: content ? content.length : 0,
        contentTruncated: Boolean(content && content.length > MAX_CONTENT),
        content: content === null ? null : content.slice(0, MAX_CONTENT),
      });
    },
  });

  modelContext.registerTool({
    name: "code_editor_write",
    description: "Replace the code in the code.jace.pro editor and optionally change language, theme, or indent unit. The editor is a shared document, so anyone in this room sees the change immediately.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "The full replacement document text." },
        language: languages.length ? { type: "string", enum: languages, description: "Syntax highlighting language." } : { type: "string", description: "Syntax highlighting language." },
        theme: themes.length ? { type: "string", enum: themes, description: "Editor theme." } : { type: "string", description: "Editor theme." },
        indentUnit: indentUnits.length ? { type: "string", enum: indentUnits, description: "Spaces per indent level." } : { type: "string", description: "Spaces per indent level." },
      },
    },
    execute: async ({ content, language, theme, indentUnit }) => {
      const instance = editor();
      const applied = {};
      const problems = [];
      if (typeof content === "string") {
        if (!instance) problems.push("The editor is still loading, so the code was not replaced. Try again in a moment.");
        else {
          instance.setValue(content);
          applied.contentCharacters = content.length;
        }
      }
      for (const [key, value, id, handler] of [
        ["language", language, "lang", "selectLang"],
        ["theme", theme, "theme", "selectTheme"],
        ["indentUnit", indentUnit, "indentUnit", "selectIndentUnit"],
      ]) {
        if (value === undefined || value === null) continue;
        const result = applySelect(id, value, handler);
        if (result.ok) applied[key] = result.value;
        else problems.push(`${key}: ${result.reason}`);
      }
      if (!Object.keys(applied).length && !problems.length) return "Nothing to change. Pass content, language, theme, or indentUnit.";
      return JSON.stringify({ applied, problems });
    },
  });
})();
