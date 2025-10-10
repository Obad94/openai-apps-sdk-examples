# Manual Test Plan for Apps SDK Examples README Workflows

## Context

The branch `docs/template-uri-access` refreshes the developer experience documented in every README:

- Root `README.md` now centers on repository prerequisites, build tooling, static asset serving, and launching the MCP servers with configuration sourced from a `.env` file.
- Server-specific READMEs (Node + Python) highlight identical environment flags (`ENVIRONMENT`, `DOMAIN`, `PORT`), hashed asset workflows, and optional pnpm wrappers for Python entry points.
- Scripts such as `scripts/run-python-server.mjs`, `pnpm run dev`, and `pnpm run serve` provide the canonical way to reproduce widget assets locally.

The test cases below validate those instructions end-to-end. Record **Pass** or **Fail** for each scenario in `docs/manual-test-results.md` (ignored by git).

## Test Matrix

| ID | Area | Preconditions | Steps | Expected Outcome | Pass/Fail |
|----|------|----------------|-------|------------------|-----------|
| TS-001 | Workspace Bootstrap | Node.js ≥18, pnpm installed | 1. From repo root run `pnpm install`. 2. Confirm dependency install completes without warnings about unsupported engine versions. | Workspace dependencies install successfully; lockfile unchanged. |
| TS-002 | Build Pipeline | TS-001 completed | 1. Run `pnpm run build`. 2. Verify `assets/` contains `*-<hash>.js/css/html` for every widget named in `build-all.mts`. | Build succeeds; console shows 4-character hash (e.g., `new hash: xxxx`); assets include HTML wrappers per widget. |
| TS-003 | Static Asset Server | TS-002 completed | 1. In new terminal run `pnpm run serve`. 2. Visit `http://localhost:4444/pizzaz.html`. 3. Confirm gallery renders and network tab shows hashed filenames. | Static server responds with 200; assets load from `localhost:4444` with the same hash produced in TS-002. |
| TS-004 | Node MCP Quick Start | pnpm available | 1. `cd pizzaz_server_node`. 2. `pnpm install`. 3. `pnpm start`. | Server logs advertise `GET /mcp` and `POST /mcp/messages`; listening default `http://localhost:8000/mcp`. |
| TS-005 | `.env` Configuration Coverage | `.env` file created at repo root with `ENVIRONMENT=production`, `DOMAIN=http://localhost:4444`, `PORT=8123` | 1. Keep TS-004 server stopped. 2. Relaunch `pnpm start` (Node) and `python pizzaz_server_python/main.py`. 3. Observe logs + browser responses. | Each server respects overrides: binds to port 8123, serves widgets referencing `http://localhost:4444/...` with `?v=<hash>` suffix. Note discrepancies (e.g., if a server requires `.env` in its own directory). |
| TS-006 | Local Dev Mode | TS-001 completed; `.env` contains `ENVIRONMENT=local` and optional `PORT` | 1. From repo root run `pnpm run dev`. 2. Start Node server (TS-004). 3. Load widget via MCP Inspector (or HTTP GET resource) after editing `src/pizzaz/index.jsx`. | Server logs `dev-*` version; widget reloads without hash suffix, reflecting source change after page refresh. |
| TS-007 | CDN Fallback | `assets/` backed up or renamed temporarily; no dev server running | 1. Move `assets/` to `assets.bak`. 2. Ensure `.env` omits `ENVIRONMENT`. 3. Start Node server and request any widget. | Widget HTML references `https://persistent.oaistatic.com/...-0038.*`; UI renders successfully despite missing local assets. |
| TS-008 | Pizzaz Python Quick Start | Python 3.10+, venv tooling | 1. `python -m venv .venv` (inside repo). 2. Activate venv. 3. `pip install -r pizzaz_server_python/requirements.txt`. 4. `python pizzaz_server_python/main.py`. | FastAPI/uvicorn logs running on configured port with `/mcp` endpoints; tool metadata matches Node server titles. |
| TS-009 | Pizzaz Python pnpm Wrapper | TS-008 venv active | 1. Stop direct server. 2. Run `pnpm start:pizzaz-python`. | Wrapper auto-detects interpreter (`python`/`py`); server starts identically to TS-008. |
| TS-010 | Solar System Python Quick Start | TS-008 venv still active | 1. `pip install -r solar-system_server_python/requirements.txt` (reuse venv). 2. `python solar-system_server_python/main.py`. | FastAPI server exposes `/mcp`; invoking tool focuses requested planet and returns structured JSON (`planet_name`, `planet_description`). |
| TS-011 | Solar System pnpm Wrapper | TS-010 dependencies installed | 1. Stop direct server. 2. Run `pnpm start:solar-python`. | Wrapper launches uvicorn; logs mirror direct run. |
| TS-012 | Shared `.env` Validation | `.env` contains `PORT=9000` and `ENVIRONMENT=production` | 1. With all servers stopped, launch Node, Pizzaz Python, and Solar Python servers sequentially. 2. Hit `/mcp` on each. | All servers honor shared settings (port override or documented behavior). Document any server requiring per-directory `.env`. |
| TS-013 | ngrok Tunneling | ngrok installed; one MCP server active on configured port | 1. `ngrok http <port>` (matching `.env PORT`). 2. Configure ChatGPT connector with `<public_url>/mcp`. | ChatGPT connects, widgets render; ngrok dashboard shows requests proxied to chosen port. |
| TS-014 | Windows Compatibility Smoke | Windows 11 PowerShell | Execute TS-001–TS-013 using PowerShell-friendly commands (no `source`, rely on `.\venv\Scripts\activate`). | All workflows succeed without shell syntax issues; README references align with Windows guidance. |
| TS-015 | Linux Compatibility Smoke | Ubuntu (or similar) shell with Node, Python, pnpm | Repeat TS-001–TS-013 using POSIX syntax (`source`, `export`). | All workflows succeed; README guidance matches Unix shell expectations. |
| TS-016 | README Consistency Review | None | 1. Cross-check root and server READMEs against observed behavior above. 2. Verify instructions for `.env`, build, dev server, and pnpm wrappers. | Documentation aligns with reality; log discrepancies (e.g., missing mention of per-directory `.env`). |

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

## Exit Criteria

- All tests TS-001 through TS-016 must pass on Windows and at least one Linux distro.
- Document any failure with reproduction steps, logs, and recommended fixes before release.
