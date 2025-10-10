# Pizzaz MCP server (Python)

This directory packages a Python implementation of the Pizzaz demo server using the `FastMCP` helper from the official Model Context Protocol SDK. It mirrors the Node example and exposes each pizza widget as both a resource and a tool.

## Prerequisites

- Python 3.10+
- A virtual environment (recommended)

## Installation

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

> **Heads up:** There is a similarly named package named `modelcontextprotocol`
> on PyPI that is unrelated to the official MCP SDK. The requirements file
> installs the official `mcp` distribution with its FastAPI extra so that the
> `mcp.server.fastmcp` module is available. If you previously installed the
> other project, run `pip uninstall modelcontextprotocol` before reinstalling
> the requirements.

## Run the server

```bash
python main.py
```

This boots a FastAPI app with uvicorn on `http://127.0.0.1:8000` (equivalently `uvicorn pizzaz_server_python.main:app --port 8000`). The endpoints mirror the Node demo:

- `GET /mcp` exposes the SSE stream.
- `POST /mcp/messages?sessionId=...` accepts follow-up messages for an active session.

Cross-origin requests are allowed so you can drive the server from local tooling or the MCP Inspector. Each tool returns structured content that echoes the requested topping plus metadata that points to the correct Skybridge widget shell, matching the original Pizzaz documentation.

## Next steps

Use these handlers as a starting point when wiring in real data, authentication, or localization support. The structure demonstrates how to:

1. Register reusable UI resources that load static HTML bundles.
2. Associate tools with those widgets via `_meta.openai/outputTemplate`.
3. Ship structured JSON alongside human-readable confirmation text.

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

### .env support (per server)

You can create a `.env` file next to this README (see `.env.example`) to store these variables for Python. OS env always wins over `.env`. We intentionally don’t use a root-level `.env`.

Which vars matter?
- None are strictly required. With nothing set, the server serves widgets via CDN and uses sensible defaults.
- `ENVIRONMENT=local`: hot reload from Vite (the template version auto-bumps in this mode). Override `DOMAIN` if you prefer a different host.
- `ENVIRONMENT=production` (default): serve hashed assets (local or CDN depending on availability).
- `DOMAIN` and `PORT` are optional conveniences and are omitted from `.env.example`.
