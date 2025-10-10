# Pizzaz MCP Server (Python)

This directory packages a Python implementation of the Pizzaz demo server using the `FastMCP` helper from the official Model Context Protocol SDK. It mirrors the Node example and exposes each pizza widget as both a resource and a tool while sharing configuration through a local `.env` file and falling back to the published CDN bundles when needed.

## Prerequisites

- Python 3.10+
- A virtual environment (recommended)

## Installation

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# Unix/Mac
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

> **Heads up:** The official MCP package is named `mcp` (with a FastAPI extra). If you previously installed the unrelated `modelcontextprotocol` project from PyPI, run `pip uninstall modelcontextprotocol` before reinstalling the requirements.

## Run the Server

```bash
python main.py
```

This boots a FastAPI app with uvicorn on `http://127.0.0.1:8000` (equivalently `uvicorn pizzaz_server_python.main:app --port 8000`). The process loads configuration from `.env` in this directory. Update it to control asset origin and port selection, for example:

```env
# Use the Vite dev server started in the repo root with `pnpm run dev`
ENVIRONMENT=local

# After `pnpm run build && pnpm run serve`, point to the static bundles
# ENVIRONMENT=production
# DOMAIN=http://localhost:4444

# Change the default port (defaults to 8000)
# PORT=8123
```

- When `ENVIRONMENT=local`, widgets hydrate from the running Vite dev server without hashed filenames.
- When `ENVIRONMENT=production` alongside a `DOMAIN`, widgets load from your local static server.
- If neither local source is available, the server falls back to the CDN assets (version `0038`).
- Each tool response includes confirmation text, structured JSON echoing the requested topping, and `_meta.openai/outputTemplate` metadata for the Skybridge widget.

Prefer a cross-platform launcher? After activating the environment you can run:

```bash
pnpm start:pizzaz-python
```

## Next steps

Use these handlers as a starting point when wiring in real data, authentication, or localization support. The structure demonstrates how to:

1. Register reusable UI resources that load static HTML bundles.
2. Associate tools with those widgets via `_meta.openai/outputTemplate`.
3. Ship structured JSON alongside human-readable confirmation text.

See main [README.md](../README.md) for:
- Testing in ChatGPT
- Architecture overview
- Advanced configuration
