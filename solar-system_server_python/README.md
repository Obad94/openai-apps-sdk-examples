# Solar system MCP server (Python)

This directory packages a Python implementation of the solar-system demo server
using the official Model Context Protocol FastMCP helper. It mirrors the widget
experience shipped in this repository and lets you drive the 3D solar system UI
from ChatGPT or the MCP Inspector.

## Prerequisites

- Python 3.10+
- A virtual environment (recommended)

## Installation

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

> The requirements pin the official `mcp` distribution with its FastAPI extra. If
you previously installed the unrelated `modelcontextprotocol` package, uninstall
it first to avoid import conflicts.

## Run the server

```bash
python main.py
```

This boots a FastAPI app with uvicorn on `http://127.0.0.1:8000` (equivalently
`uvicorn solar-system_server_python.main:app --port 8000`). The server exposes
streaming endpoints compatible with the MCP Inspector and ChatGPT connectors:

- `GET /mcp` provides the SSE stream.
- `POST /mcp/messages?sessionId=...` receives follow-up messages for a session.

Each tool call returns a small JSON payload describing the requested planet plus
metadata that embeds the solar-system widget, so the Apps SDK can render the 3D
experience inline.

## Dev/serve/CDN modes

Control where the widget assets load from via environment variables (PowerShell examples):

- Dev hot reload:
	- `$env:PIZZAZ_ASSET_ORIGIN = 'http://localhost:4444'`
	- `$env:PIZZAZ_ASSET_HASHED = 'false'`
	- In another terminal, run `pnpm dev` at the repo root
	- Start this server: `python main.py`
	- Note: If `TEMPLATE_VERSION` is unset in this mode, it auto-bumps once per minute to trigger template re-fetches during development.
- Serve local build:
	- `pnpm build` then `pnpm serve` at the repo root
	- `$env:PIZZAZ_ASSET_ORIGIN = 'http://localhost:4444'`; `$env:PIZZAZ_ASSET_HASHED = 'true'`
	- Start this server: `python main.py`
- CDN fallback only:
	- `Remove-Item Env:PIZZAZ_ASSET_ORIGIN`
	- Start this server: `python main.py`

### .env support

Create a `.env` file next to this README (see `.env.example`) to store these variables. OS env always wins over `.env`. We intentionally don’t use a root-level `.env`.

## Next steps

- Expand the schema with additional celestial bodies or mission telemetry.
- Source live ephemeris data to position planets in real time.
- Gate access with authentication before exposing the widget in production.
