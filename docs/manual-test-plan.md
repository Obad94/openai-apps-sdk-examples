# Manual Test Plan for README Quick Start Changes

## Change Summary

Updates on branch `docs/template-uri-access` reorganize the root `README.md` to:

- Capitalize section headers consistently.
- Introduce a "Quick Start" flow for Pizzaz (Node & Python) and the Solar System server.
- Document ngrok usage, dev/prod environment variables, and CDN fallbacks.
- Move dependency and build guidance into a new "Advanced Setup" section.

The scenarios below validate those instructions end-to-end. Record **Pass** or **Fail** for each case in your personal results file (`docs/manual-test-results.md`, ignored by git).

## Test Matrix

| ID | Area | Preconditions | Steps | Expected Outcome | Pass/Fail |
|----|------|----------------|-------|------------------|-----------|
| TS-001 | Pizzaz Node Quick Start | Node.js ≥18, pnpm installed | 1. `cd pizzaz_server_node` 2. `pnpm install` 3. `pnpm start` | Server boots on `http://localhost:8000/mcp`, logs SSE + POST endpoints. | |
| TS-002 | Pizzaz Python Quick Start (Launch via pnpm script) | Python 3.10+ with venv support, pnpm installed | 1. `python -m venv .venv` 2. Activate venv (`.venv\\Scripts\\activate` on Windows or `source .venv/bin/activate` on Unix) 3. `pip install -r pizzaz_server_python/requirements.txt` 4. `pnpm start:pizzaz-python` | FastAPI server starts, logs uvicorn binding to `http://127.0.0.1:8000/mcp`. | |
| TS-003 | Pizzaz Python Quick Start (Direct Python) | Same as TS-002 | 1. Reuse activated venv 2. `python pizzaz_server_python/main.py` | Identical behavior to TS-002 with confirmation banner in terminal. | |
| TS-004 | Solar System Python Quick Start (pnpm script) | Python venv active, dependencies installed with `pip install -r solar-system_server_python/requirements.txt` | 1. `pnpm start:solar-python` | FastAPI server starts, exposes solar-system widget tools on `http://localhost:8000/mcp`. | |
| TS-005 | Solar System Python Quick Start (Direct Python) | Same as TS-004 | 1. `python solar-system_server_python/main.py` | Server starts at `http://localhost:8000/mcp` with log banner. | |
| TS-006 | CDN Fallback | No local build artifacts (`assets/` missing relevant hashed files) | 1. Ensure `ENVIRONMENT` unset 2. Start Pizzaz Node server 3. Invoke any widget via MCP inspector | Widget HTML references `https://persistent.oaistatic.com/...` URLs with CDN version `0038` and renders successfully. | |
| TS-007 | Local Dev Mode | Root dependencies installed (`pnpm install`) | 1. `pnpm run dev` in repo root 2. In new terminal set env (`$env:ENVIRONMENT='local'` on PowerShell or `export ENVIRONMENT=local`) 3. `pnpm start:pizzaz-node` 4. Modify `src/pizzaz/index.jsx` | Widget reloads without hash suffix; terminal logs show dynamic `dev-*` template version; browser refresh picks up changes live. | |
| TS-008 | Static Build & Serve | pnpm dependencies installed | 1. `pnpm run build` 2. Confirm hashed assets appear in `assets/` 3. `pnpm run serve` 4. Visit `http://localhost:4444/pizzaz.html` | Assets served with matching hash suffix (`-<hash>.css/js`), page renders Pizzaz gallery. | |
| TS-009 | Production Domain Override | Completed TS-008, static server running on :4444 | 1. In new terminal set `$env:ENVIRONMENT='production'` and `$env:DOMAIN='http://localhost:4444'` (PowerShell) 2. `pnpm start:pizzaz-node` 3. Trigger a widget response | Widget HTML references `http://localhost:4444/...` assets, server logs template URI query `?v=<hash>`. | |
| TS-010 | Port Override | Any MCP server running | 1. Stop existing server 2. Start with `$env:PORT='8123'` (PowerShell) or `export PORT=8123` (Unix) before `pnpm start:pizzaz-node` | Server listens on `http://localhost:8123`, logs updated endpoints; MCP inspector connects successfully. | |
| TS-011 | ngrok Tunneling | ngrok installed, TS-001 or TS-002 server active | 1. `ngrok http 8000` 2. Note public URL 3. Configure ChatGPT connector with `<public URL>/mcp` | ChatGPT connects and renders widgets; ngrok dashboard shows traffic. | |
| TS-012 | Windows Compatibility Smoke | Windows PowerShell | Execute TS-001 through TS-011 commands using PowerShell syntax (`$env:`). | All scenarios succeed without shell errors; README instructions match command syntax. | |
| TS-013 | Linux Compatibility Smoke | Linux shell with Node, Python, pnpm | Repeat TS-001–TS-011 using shell syntax (`export`, `source`). | All scenarios succeed; README instructions match Unix syntax. | |
| TS-014 | README Consistency Review | None | 1. Compare current README structure against origin/main 2. Ensure Quick Start and Advanced Setup sections align with validated workflows | No missing pathways versus tested scenarios; headings and link targets correct. | |

## Test Notes Template

Create `docs/manual-test-results.md` (ignored by git) and copy the table above. Add a **Date**, **Tester**, and detailed notes per scenario (logs, platform, issues). Example front matter:

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

- When updating the CDN version constant in `pizzaz_server_node/src/server.ts`, redo TS-006 and TS-009.
- Changes to build tooling (`build-all.mts`, Vite config) require rerunning TS-007 and TS-008.
- Modifying environment variable names in the servers requires repeating TS-009–TS-011.

## Exit Criteria

- All tests TS-001 through TS-014 must be marked **Pass** on Windows and one Linux distro.
- Any failure requires documenting reproduction steps, logs, and follow-up issues before release.
