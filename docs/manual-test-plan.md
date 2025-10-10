# Manual Test Plan for Apps SDK Examples README Workflows

## Context

The branch `docs/template-uri-access` refreshes the developer experience documented in every README:

- Root `README.md` now centers on repository prerequisites, build tooling, static asset serving, and launching the MCP servers with configuration sourced from per-server `.env` files.
- Server-specific READMEs (Node + Python) highlight identical environment flags (`ENVIRONMENT`, `DOMAIN`, `PORT`), hashed asset workflows, and optional pnpm wrappers for Python entry points.
- Scripts such as `scripts/run-python-server.mjs`, `pnpm run dev`, and `pnpm run serve` provide the canonical way to reproduce widget assets locally.

The test cases below validate those instructions end-to-end. Record **Pass** or **Fail** for each scenario in `docs/manual-test-results.md` (ignored by git).

## Test Matrix

| ID | Area | Preconditions | Steps | Expected Outcome | Pass/Fail |
|----|------|----------------|-------|------------------|-----------|
| TS-001 | Workspace Bootstrap | Node.js ≥18, pnpm installed | 1. From repo root run `pnpm install`. 2. Confirm dependency install completes without warnings about unsupported engine versions. | Workspace dependencies install successfully; lockfile unchanged. | PASS
| TS-002 | Build Pipeline | TS-001 completed | 1. Run `pnpm run build`. 2. Verify `assets/` contains `*-<hash>.js/css/html` for every widget named in `build-all.mts`. | Build succeeds; console shows 4-character hash (e.g., `new hash: xxxx`); assets include HTML wrappers per widget. | PASS
| TS-003 | Static Asset Server | TS-002 completed | 1. In new terminal run `pnpm run serve`. | Static server responds with 200; assets load from `localhost:4444` with the same hash produced in TS-002. | PASS
| TS-004 | Node MCP Quick Start | pnpm available | 1. `cd pizzaz_server_node`. 2. `pnpm install`. 3. `pnpm start`. | Server logs advertise `GET /mcp` and `POST /mcp/messages`; listening default `http://localhost:8000/mcp`. | PASS
| TS-005 | Static Assets + `.env` + ngrok | `.env` files created in `pizzaz_server_node/.env` and `pizzaz_server_python/.env` with `ENVIRONMENT=production` (required), `DOMAIN=http://localhost:4444` (required), `PORT=8123` (optional); static server running from TS-003 | 1. Keep TS-004 server stopped. 2. Relaunch `pnpm start` (Node) or `python pizzaz_server_python/main.py`. 3. Launch tunnel: `ngrok.exe http 8123`. 4. Configure ChatGPT connector with `<ngrok-url>/mcp` and invoke widgets while `pnpm run serve` hosts assets from `http://localhost:4444`. 5. Observe logs + browser responses; record PASS if everything resolves via ngrok. | Each server respects overrides: binds to port 8123, serves widgets referencing `http://localhost:4444/...` with `?v=<hash>` suffix, and widgets load successfully through the ngrok URL. Note discrepancies (e.g., if a server requires different `.env` placement). | PASS
| TS-006 | Local Dev Mode + `.env` + ngrok | TS-005 completed; `pizzaz_server_node/.env` and (optionally) `pizzaz_server_python/.env` updated with `ENVIRONMENT=local` (required), `DOMAIN` and `PORT`(Port defaults to '8000') are optional; Vite dev server running | 1. From repo root run `pnpm run dev`. 2. Start Node server (TS-004). 3. Launch tunnel: `ngrok.exe http 8000`. 4. Configure ChatGPT connector with `<ngrok-url>/mcp` and invoke the pizza map tool after editing `src/pizzaz/index.jsx`. 5. Record result (PASS if widgets stream over ngrok and reflect edits). | Server logs `dev-*` version; widget reloads without hash suffix, reflecting source change via ChatGPT session through the tunnel. | PASS
| TS-007 | CDN Fallback + ngrok | `assets/` backed up/renamed or removed; no per-server `.env` files present (or all variables commented out) so defaults apply; verify `ENVIRONMENT` is the only setting that needs to be cleared—`DOMAIN` is unnecessary for CDN fallback and `PORT` can be left unset or any value; no dev server running | 1. Move `assets/` to `assets.bak`. 2. Remove the `.env` files under each server or comment out every environment variable (at minimum ensure `ENVIRONMENT` is commented so CDN defaults engage; leave `DOMAIN` blank/absent and optionally omit `PORT`). 3. Start Node server (defaults to port 8000 unless `PORT` remains set). 4. Launch tunnel: `ngrok.exe http 8000`. 5. Configure ChatGPT connector with `<ngrok-url>/mcp` and invoke any widget. 6. Record result (PASS if widgets render using CDN assets through ngrok). | Widget HTML references `https://persistent.oaistatic.com/...-0038.*`; server binds to default `http://localhost:8000/mcp` (or the retained port); UI renders successfully through the tunnel without local env overrides. | PASS
| TS-008 | Pizzaz Python Quick Start | Python 3.10+, venv tooling | 1. `python -m venv .venv` (inside pizzaz_server_python directory). 2. Activate venv. 3. `pip install -r requirements.txt`. 4. `python main.py`. | FastAPI/uvicorn logs running on configured port with `/mcp` endpoints; tool metadata matches Node server titles. | PASS
| TS-009 | Pizzaz Python pnpm Wrapper | TS-008 venv active | 1. Stop direct server. 2. Run `pnpm start:pizzaz-python`. | Wrapper auto-detects interpreter (`python`/`py`); server starts identically to TS-008. | PASS
| TS-010 | Solar System Python Quick Start | TS-008 venv still active | 1. `pip install -r solar-system_server_python/requirements.txt` (reuse venv). 2. `python solar-system_server_python/main.py`. | FastAPI server exposes `/mcp`; invoking tool focuses requested planet and returns structured JSON (`planet_name`, `planet_description`). | PASS
| TS-011 | Solar System pnpm Wrapper | TS-010 dependencies installed | 1. Stop direct server. 2. Run `pnpm start:solar-python`. | Wrapper launches uvicorn; logs mirror direct run. | PASS
| TS-012 | Shared `.env` Validation | `.env` files under each server directory (`pizzaz_server_node`, `pizzaz_server_python`, `solar-system_server_python`) contain `PORT`, `DOMAIN` and `ENVIRONMENT`  | 1. With all servers stopped, launch Node, Pizzaz Python, and Solar Python servers sequentially. 2. Hit `/mcp` on each. | All servers honor shared settings (port override or documented behavior). Document any server requiring per-directory `.env`. | PASS
| TS-013 | ngrok Tunneling | ngrok installed; one MCP server active on configured port | 1. `ngrok http <port>` (matching `.env PORT`). 2. Configure ChatGPT connector with `<public_url>/mcp`. | ChatGPT connects, widgets render; ngrok dashboard shows requests proxied to chosen port. | PASS
| TS-014 | Windows Compatibility Smoke | Windows 11 PowerShell | Execute TS-001–TS-013 using PowerShell-friendly commands (no `source`, rely on `.\venv\Scripts\activate`). | All workflows succeed without shell syntax issues; README references align with Windows guidance. | PASS
| TS-015 | Linux Compatibility Smoke | Ubuntu (or similar) shell with Node, Python, pnpm | Repeat TS-001–TS-013 using POSIX syntax (`source`, `export`). | All workflows succeed; README guidance matches Unix shell expectations. | PASS
| TS-016 | README Consistency Review | None | 1. Cross-check root and server READMEs against observed behavior above. 2. Verify instructions for `.env`, build, dev server, and pnpm wrappers. | Documentation aligns with reality; log discrepancies (e.g., missing mention of per-directory `.env`). | PASS
| TS-017 | Pizzaz Video Production Widget | TS-005 completed | 1. With a Pizzaz server running in `ENVIRONMENT=production` and static assets served from TS-003, invoke the `pizza-video` tool through ChatGPT or mcp-inspector. 2. In devtools, confirm the widget requests `pizzaz-video-<hash>.css` and `.js` from the static origin and that the markup includes the `<script>window.__PIZZAZ_VIDEO_URL__</script>` snippet. 3. Verify the rendered video autoplays and loops in the widget. | Widget renders using hashed production assets; template URI ends with `?v=<hash>` matching the file suffix, and the default fallback video plays without errors. | PASS
| TS-018 | Pizzaz Video Local Dev Widget | TS-006 completed | 1. With `ENVIRONMENT=local` and `pnpm run dev` active, invoke `pizza-video`. 2. Confirm network requests for `pizzaz-video.css`/`.js` serve from the dev origin without hash suffixes. 3. Inspect the resource list (ChatGPT inspector or client logs) to ensure the template URI query string begins with `?v=dev-`. | Video widget streams from the dev server without hashed filenames, reflects live code edits, and reports a `dev-*` version tag in the template URI. | PASS
| TS-019 | Template Version Hash Propagation | TS-002 completed | 1. Note the 4-character hash emitted during the build (e.g., `294b`). 2. Inspect `assets/` to confirm each bundle—including `pizzaz-video`—uses that hash in filenames. 3. Start a Pizzaz server (Node or Python) in production mode and list resources via mcp-inspector. | Every widget resource/template URI ends with `?v=<hash>` that matches the built filenames; mismatches or missing `?v` values are defects. | PASS

## Test Notes Template

Create `docs/manual-test-results.md` (ignored by git) and copy the table above. Add a **Date**, **Tester**, platform details, and per-scenario notes (logs, issues). Example front matter:

```markdown
# Manual Test Results
- Date: 2025-10-10
- Tester: <your name>
- Platform: Windows 11 / WSL2 Ubuntu 24.04

| ID | Pass/Fail | Notes |
|----|-----------|-------|
| TS-001 | Pass | Logs show ... |
```

## Regression Considerations

- Bump the CDN version constant in `pizzaz_server_node/src/server.ts`, `pizzaz_server_python/main.py`, or `solar-system_server_python/main.py` ➜ rerun TS-002, TS-003, TS-006, and TS-007.
- Changes to `build-all.mts`, Vite configs, or Tailwind setup ➜ rerun TS-002, TS-003, and TS-006.
- Updates to `scripts/run-python-server.mjs` or pnpm wrapper scripts ➜ rerun TS-009 and TS-011.
- Modifying environment variable names or `.env` loading logic ➜ rerun TS-005 and TS-012.
- Changes to the `pizzaz-video` widget, video script injection, or asset hash derivation ➜ rerun TS-017, TS-018, and TS-019.

## Exit Criteria

- All tests TS-001 through TS-016 must pass on Windows and at least one Linux distro.
- Document any failure with reproduction steps, logs, and recommended fixes before release.
