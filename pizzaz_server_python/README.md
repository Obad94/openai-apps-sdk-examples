# Pizzaz MCP Server (Python)

MCP server implementation using the official Python SDK (FastMCP). Exposes 5 pizza-themed widget tools for ChatGPT.

## Quick Start

**Install:**
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

> **Note:** The official MCP package is named `mcp` (not `modelcontextprotocol`). If you previously installed the unrelated `modelcontextprotocol` package, run `pip uninstall modelcontextprotocol` first.

**Run (cross-platform launcher):**
```bash
pnpm start:pizzaz-python
```

> Equivalent to running `python main.py` after activating your virtual environment.

Server runs at `http://localhost:8000/mcp` with CDN-hosted widgets.

## Available Tools

- **pizza-map** - Interactive map of pizza places
- **pizza-carousel** - Carousel of pizza images
- **pizza-albums** - Pizza photo albums
- **pizza-list** - List of pizza options
- **pizza-video** - Pizza video player

Each tool returns:
- Text confirmation
- Structured JSON data
- Widget metadata for ChatGPT to render the UI

## Configuration

Create a `.env` file (see `.env.example`) or set OS environment variables:

- `ENVIRONMENT`: `'local'` or `'production'` (default: `'production'`)
- `DOMAIN`: Asset origin URL (optional)
- `PORT`: Server port (default: `8000`)

**All variables are optional.** With zero configuration, the server uses CDN assets.

## Development Workflows

### Hot Reload (Dev Mode)

Terminal 1 - Start Vite dev server (from repo root):
```bash
pnpm dev
```

Terminal 2 - Start MCP server:
```bash
# Windows PowerShell
$env:ENVIRONMENT = 'local'
pnpm start:pizzaz-python

# Unix/Mac
export ENVIRONMENT=local
pnpm start:pizzaz-python
```

Widgets auto-refresh on file changes. Template version auto-bumps every minute for cache refresh.

### Serve Local Build

From repo root:
```bash
pnpm build
pnpm serve
```

Start server with local assets:
```bash
# Windows PowerShell
$env:ENVIRONMENT = 'production'
$env:DOMAIN = 'http://localhost:4444'
pnpm start:pizzaz-python

# Unix/Mac
export ENVIRONMENT=production
export DOMAIN=http://localhost:4444
pnpm start:pizzaz-python
```

### CDN Only (Default)

```bash
pnpm start:pizzaz-python
```

No configuration needed. Uses published CDN version.

## Alternative Run Command

You can also run the server using uvicorn directly:
```bash
uvicorn pizzaz_server_python.main:app --port 8000
```

## Next Steps

See main [README.md](../README.md) for:
- Testing in ChatGPT
- Architecture overview
- Advanced configuration
