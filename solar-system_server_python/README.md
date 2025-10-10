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

- **Dev hot reload**
	- `$env:ENVIRONMENT = 'local'`
	- (Optional) `$env:DOMAIN = 'http://localhost:4444'` if you want a different host than the default
	- In another terminal, run `pnpm dev` at the repo root
	- Start this server: `python main.py`
	- In this mode the server auto-generates a `dev-*` template version once per minute so ChatGPT refreshes frequently.
- **Local hashed serve**
	- `pnpm build` then `pnpm serve` at the repo root
	- `$env:ENVIRONMENT = 'production'`
	- `$env:DOMAIN = 'http://localhost:4444'`
	- Start this server: `python main.py`
- **CDN fallback**
	- `Remove-Item Env:DOMAIN`
	- Start this server: `python main.py`

Supported environment variables:

- `ENVIRONMENT` – `'local'` enables dev defaults (origin `http://localhost:4444`, unhashed assets). `'production'` (default) uses hashed/CDN behavior.
- `DOMAIN` – overrides the asset origin (e.g. `$env:DOMAIN = 'http://localhost:4444'`).
- `PORT` – overrides the HTTP port (defaults to `8000`).

### .env support

Create a `.env` file next to this README (see `.env.example`) to store these variables. OS env always wins over `.env`. We intentionally don’t use a root-level `.env`.

## Next steps

- Expand the schema with additional celestial bodies or mission telemetry.
- Source live ephemeris data to position planets in real time.
- Gate access with authentication before exposing the widget in production.
