# Hot Reload for ui:// Templates (Apps SDK + Pizzaz)

This guide documents the changes and steps I used to resolve issue #17 (templateUri access, stale HTML, and local hot reloading) so you can re‑apply them on another fork of this project.

The fix has two parts:
- Make your MCP server return an HTML "bootstrap" template that loads JS/CSS from your live dev server (so edits show up instantly without rebuilding).
- Bust ChatGPT’s cached template by versioning the `ui://` URI.


---

## Symptoms
- Editing frontend code or data (like `markers.json`) doesn’t appear in ChatGPT.
- Even after restarting a static server, ChatGPT still renders an older component.
-

## Root cause
- In the Apps SDK model, the `ui://` URI is a canonical ID. ChatGPT caches the HTML you return for each `ui://...` resource.
- If you don’t change the `ui://` value, ChatGPT may continue to serve cached HTML.
- The Pizzaz examples originally embedded built CSS/JS into the HTML; that means any edit requires a rebuild, and caching hides new output.

## Design of the fix
1. Return a minimal HTML bootstrap from the MCP server whose `<script>`/`<link>` target your dev server (Vite) instead of embedding static bundles.
2. Add a version parameter (e.g., `?v=20251009...`) to the `ui://` resource URI so ChatGPT requests a fresh template when you want it.
3. Keep fallbacks: prefer dev server assets; if missing, inline local built assets; finally fall back to a CDN copy.

---

## Files changed (what to mirror on your fork)

### 1) Node MCP server — `pizzaz_server_node/src/server.ts`
- Added support for a development asset origin and a toggle for hashed filenames:
  - `PIZZAZ_ASSET_ORIGIN` — e.g., `http://localhost:4444`
  - `PIZZAZ_ASSET_HASHED` — set to `false` in dev so we request `/pizzaz.js` instead of `/pizzaz-XXXX.js`.
- Added `TEMPLATE_VERSION` — appended as a query string to each `ui://` URI: `ui://widget/pizza-list.html?v=<version>`.
- HTML building order now prefers:
  1) Dev hosted assets (if `PIZZAZ_ASSET_ORIGIN` set)
  2) Inline local built assets (reads from `assets/` with hash)
  3) CDN fallback

Key effects:
- You can edit frontend files and see changes live (no rebuild needed) because the HTML is a thin bootstrap that loads JS/CSS from Vite.
- Bumping `TEMPLATE_VERSION` forces ChatGPT to fetch a fresh template, avoiding stale HTML caching.

### 2) Python MCP server — `pizzaz_server_python/main.py`
- Mirror of the Node logic:
  - `PIZZAZ_ASSET_ORIGIN` to target the dev server
  - `PIZZAZ_ASSET_HASHED=false` to request un‑hashed assets in dev
  - `TEMPLATE_VERSION` added to `ui://` URIs for cache busting
- Same fallback order (dev → inline → CDN).

### 3) Vite dev server — `vite.config.mts`
path helper and falls back to `/@fs/...` when needed.
- Dev endpoints remain `/pizzaz.html`, `/pizzaz.js`, `/pizzaz.css`, etc., which are ideal for HMR.

---

## Environment variables (dev)

| Variable | Purpose | Typical dev value |
|---|---|---|
| `PIZZAZ_ASSET_ORIGIN` | Points the MCP server’s HTML to the Vite dev server | `http://localhost:4444` |
| `PIZZAZ_ASSET_HASHED` | If `false`, request non‑hashed filenames from dev (`/pizzaz.js`) | `false` |
| `TEMPLATE_VERSION` | Appended to the `ui://` URI to bust ChatGPT’s cached template | Timestamp, e.g. `20251009153000` |


Notes:
- You can leave `ASSET_HASH` alone; it’s used for built assets.
- Changing `TEMPLATE_VERSION` is only needed when the HTML bootstrap itself changes. Pure JS/CSS edits flow in via Vite HMR without bumping the version.

---

## Dev workflow (Windows PowerShell)

Terminal 1 – Vite dev server (HMR):
```powershell

pnpm run dev
```

Terminal 2 – MCP Node server pointing to dev assets:
```powershell
$env:PIZZAZ_ASSET_ORIGIN = "http://localhost:4444"
$env:PIZZAZ_ASSET_HASHED = "false"
$env:TEMPLATE_VERSION   = (Get-Date -Format "yyyyMMddHHmmss")

pnpm --filter pizzaz-mcp-node run start
```

Connect ChatGPT (or MCP Inspector) to your MCP endpoint (ngrok if needed), then:
- Edit `src/...` files (e.g., `src/pizzaz/markers.json`, JSX, CSS). Vite updates instantly.
- Re-open the widget in ChatGPT. If you changed the HTML bootstrap wiring, bump `TEMPLATE_VERSION` and re-open.

---

## Static/production workflow (hashed assets, no HMR)
```powershell
pnpm run build
pnpm run serve  # serves ./assets on port 4444 by default

# For MCP server (choose one):
# Node:
#   $env:PIZZAZ_ASSET_ORIGIN = "http://localhost:4444"
#   $env:PIZZAZ_ASSET_HASHED = "true"  # or unset
#   pnpm --filter pizzaz-mcp-node run start
# Python:
#   $env:PIZZAZ_ASSET_ORIGIN = "http://localhost:4444"
#   $env:PIZZAZ_ASSET_HASHED = "true"
#   uvicorn pizzaz_server_python.main:app --port 8000
```
Use this for demos without live editing. For a new production release, also bump `TEMPLATE_VERSION` (or change the `ui://` path entirely) to avoid cached HTML.

---

## Verification checklist
- Browser: `http://localhost:4444/pizzaz.html` loads and hot‑reloads.
- Browser: `http://localhost:4444/pizzaz.js` shows Vite/HMR preamble (expected in dev).
- MCP Node logs show the server running and responding to `/mcp`.
- In ChatGPT: re-open the tool, and your latest edits render. If not, bump `TEMPLATE_VERSION`.

---

## Troubleshooting
- ChatGPT still shows stale HTML
  - Bump `TEMPLATE_VERSION` and re-open the tool.
- You see `-2d2b` files in `assets/` but HMR serves non‑hashed URLs
  - That’s expected. Dev mode uses non‑hashed entries; build mode produces hashed artifacts.
- Serving both Vite dev and static server on the same port
  - Don’t. If you need both, run static serve on a different port (e.g., 8888) and set `PIZZAZ_ASSET_ORIGIN` accordingly.

---

## Optional convenience scripts
Add to the root `package.json` if you want a single command to start the stack on Windows PowerShell:

```json
{
  "scripts": {
    "dev:stack": "cross-env-shell \"VITE_DEV_CSS_MODE=inline\" \"start powershell -NoExit -Command \"pnpm run dev\"\" & cross-env-shell \"PIZZAZ_ASSET_ORIGIN=http://localhost:4444 PIZZAZ_ASSET_HASHED=false TEMPLATE_VERSION=%date:~10,4%%date:~4,2%%date:~7,2%%time:~0,2%%time:~3,2%%time:~6,2%\" \"pnpm --filter pizzaz-mcp-node run start\""
  }
}
```
Note: If you’d rather not add `cross-env-shell`, you can run the two terminals manually as shown above.

---

## Summary
- ui:// templates are cached by ChatGPT. We added query‑string versioning to the resource ID and pointed the HTML at your Vite dev server for live JS/CSS.
- Dev flow uses non‑hashed endpoints and HMR; build flow uses hashed assets.
- Windows path issues were resolved by inlining CSS in the Vite dev plugin (with an optional import mode using a fallback helper).

Reuse these changes on any fork to get reliable hot reload without repeated rebuilds, while keeping a clear path to static/production assets.
