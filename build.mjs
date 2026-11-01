import { build } from "esbuild";

// Bundles the collaboration stack into public/js/collab.bundle.js.
// The output is committed: this app has no JavaScript build step on the host.
await build({
  entryPoints: ["src/collab.js"],
  bundle: true,
  format: "esm",
  minify: true,
  sourcemap: false,
  target: ["es2020"],
  outfile: "public/js/collab.bundle.js",
  alias: { "monaco-editor/esm/vs/editor/editor.api.js": "./src/monaco-alias.js" },
  logLevel: "info",
});
