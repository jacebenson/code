# code.jace.pro

A co-working code editor. Two or more people open the same room URL and edit the
same document at the same time.

Rails serves the page and one WebSocket endpoint. The document itself never
touches the server: browsers exchange edits directly over WebRTC, and each one
keeps its own copy in IndexedDB. There is no database in this app, by design.

## How it fits together

| Piece | Where | What it does |
|---|---|---|
| `app/lib/signal_relay.rb` | mounted at `/signal` | Introduces peers to each other. Stores nothing. |
| `src/collab.js` | bundled to `public/js/collab.bundle.js` | Yjs document, WebRTC transport, Monaco binding |
| `public/monaco-editor/` | vendored in the repo | The editor itself |
| `public/js/webmcp.js` | served as-is | Read-only WebMCP tools for browser agents |

Everything the browser loads is served from this app. There are no CDN
dependencies and no hosted realtime service.

## Rooms

`/` redirects to a fresh room, `/new` does the same on request, and `/room-name`
opens an existing room. Whoever has the URL can join and edit. Room names are
not secrets, so treat a room URL like a shared document link.

Rooms exist only while someone has them open. A peer that reloads keeps its own
copy through IndexedDB, but a room nobody has open has no content to serve.

## Local development

```bash
bundle install
bin/rails server            # http://localhost:3000
```

The collaboration bundle is committed, so no JavaScript toolchain is needed to
run the app. Rebuild it only after changing `src/`:

```bash
npm install
npm run build               # writes public/js/collab.bundle.js
```

## Tests

```bash
bin/rails test
```

`test/lib/signal_relay_test.rb` covers the relay protocol without a socket, and
`test/integration/editor_flow_test.rb` covers the routes, the page, and the
absence of the old hosted dependencies.

## Verifying collaboration by hand

Two tabs of one browser profile are not a valid test: same-origin tabs sync
through `BroadcastChannel`, so a broken transport still looks like it works. Use
two profiles, two browsers, or two devices.

```js
// in each peer's console
window.collab.provider.awareness.getStates().size  // 2 when both are present
window.collab.provider.room.webrtcConns.size       // 1 means a peer connection
window.editor.getValue()
```

## Deploy notes

- Coolify build pack: Dockerfile, port 3000.
- `SECRET_KEY_BASE` must be set (the app has no credentials file).
- `/up` is the health endpoint.

## Limits worth knowing

- Every peer connects to every other peer, so this suits a handful of people in
  one room, not a large audience.
- A strict corporate network or symmetric NAT can block the direct connection.
  That needs a TURN relay, which is not part of this app.
- The relay holds topics in memory. Multiple app instances would each have their
  own peer set, so run one instance.
