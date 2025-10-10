# Apps SDK Examples Gallery

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

This repository showcases example UI components to be used with the Apps SDK, as well as example MCP servers that expose a collection of components as tools.
It is meant to be used as a starting point and source of inspiration to build your own apps for ChatGPT.

## Quick Start

### 1. Choose and Run a Server

**Node Server (Pizzaz):**
```bash
cd pizzaz_server_node
pnpm install
pnpm start
```

**Python Server (Pizzaz):**
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate
pip install -r pizzaz_server_python/requirements.txt
python pizzaz_server_python/main.py

# Unix/Mac
python -m venv .venv
source .venv/bin/activate
pip install -r pizzaz_server_python/requirements.txt
python pizzaz_server_python/main.py
```

> Prefer a one-liner? After installing requirements you can run `pnpm start:pizzaz-python`. The helper script
> auto-detects the right Python executable on Windows, macOS, and Linux.

**Python Server (Solar System):**
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate
pip install -r solar-system_server_python/requirements.txt
python solar-system_server_python/main.py

# Unix/Mac
python -m venv .venv
source .venv/bin/activate
pip install -r solar-system_server_python/requirements.txt
python solar-system_server_python/main.py
```

> Or use `pnpm start:solar-python` after installing dependencies—the launcher works across operating systems.

Server runs at `http://localhost:8000/mcp` using CDN-hosted widgets (zero configuration required).

### 2. Test in ChatGPT

To add these apps to ChatGPT, enable [developer mode](https://platform.openai.com/docs/guides/developer-mode), and add your apps in Settings > Connectors.

To add your local server without deploying it, use a tool like [ngrok](https://ngrok.com/) to expose your local server to the internet.

Once your MCP server is running:

```bash
ngrok http 8000
```

You will get a public URL that you can use to add your local server to ChatGPT in Settings > Connectors.

For example: `https://<custom_endpoint>.ngrok-free.app/mcp`

## MCP + Apps SDK Overview

The Model Context Protocol (MCP) is an open specification for connecting large language model clients to external tools, data, and user interfaces. An MCP server exposes tools that a model can call during a conversation and returns results according to the tool contracts. Those results can include extra metadata—such as inline HTML—that the Apps SDK uses to render rich UI components (widgets) alongside assistant messages.

Within the Apps SDK, MCP keeps the server, model, and UI in sync. By standardizing the wire format, authentication, and metadata, it lets ChatGPT reason about your connector the same way it reasons about built-in tools. A minimal MCP integration for Apps SDK implements three capabilities:

1. **List tools** – Your server advertises the tools it supports, including their JSON Schema input/output contracts and optional annotations (for example, `readOnlyHint`).
2. **Call tools** – When a model selects a tool, it issues a `call_tool` request with arguments that match the user intent. Your server executes the action and returns structured content the model can parse.
3. **Return widgets** – Alongside structured content, return embedded resources in the response metadata so the Apps SDK can render the interface inline in the Apps SDK client (ChatGPT).

Because the protocol is transport agnostic, you can host the server over Server-Sent Events or streaming HTTP—Apps SDK supports both.

The MCP servers in this demo highlight how each tool can light up widgets by combining structured payloads with `_meta.openai/outputTemplate` metadata returned from the MCP servers.

## Repository Structure

- `src/` – Source for each widget example.
- `assets/` – Generated HTML, JS, and CSS bundles after running the build step.
- `pizzaz_server_node/` – MCP server implemented with the official TypeScript SDK.
- `pizzaz_server_python/` – Python MCP server that returns the Pizzaz widgets.
- `solar-system_server_python/` – Python MCP server for the 3D solar system widget.
- `build-all.mts` – Vite build orchestrator that produces hashed bundles for every widget entrypoint.

## Available Servers

### Pizzaz (Node & Python)
- 5 pizza-themed widget tools (map, carousel, albums, list, video)
- See [pizzaz_server_node/README.md](pizzaz_server_node/README.md) or [pizzaz_server_python/README.md](pizzaz_server_python/README.md)

### Solar System (Python)
- 3D solar system visualization widget
- See [solar-system_server_python/README.md](solar-system_server_python/README.md)

## Advanced Setup

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn
- Python 3.10+ (for Python servers)

### Building Widgets Locally

Install root dependencies:
```bash
pnpm install
```

Build widgets:
```bash
pnpm run build
```

This produces versioned `.html`, `.js`, and `.css` files in `assets/` with hashed filenames.

### Development Mode (Hot Reload)

Terminal 1 - Start Vite dev server:
```bash
pnpm run dev
```

Terminal 2 - Start MCP server with dev mode:
```bash
# Windows PowerShell
$env:ENVIRONMENT = 'local'
pnpm start:pizzaz-node

# Unix/Mac
export ENVIRONMENT=local
pnpm start:pizzaz-node
```

Widgets refresh automatically on file changes.

### Serve Local Build

Build and serve static assets:
```bash
pnpm run build
pnpm run serve
```

Start server with local assets:
```bash
# Windows PowerShell
$env:ENVIRONMENT = 'production'
$env:DOMAIN = 'http://localhost:4444'
pnpm start:pizzaz-node

# Unix/Mac
export ENVIRONMENT=production
export DOMAIN=http://localhost:4444
pnpm start:pizzaz-node
```

## Configuration

All servers support **3 optional environment variables**:

- `ENVIRONMENT`: `'local'` (dev mode with hot reload) or `'production'` (default, uses hashed/CDN assets)
- `DOMAIN`: Asset origin URL override (e.g., `'http://localhost:4444'`)
- `PORT`: Server port (default: `8000`)

**With zero configuration, servers use CDN assets and sensible defaults.**

Each server directory supports a `.env` file (see `.env.example` files). OS environment variables take precedence over `.env` files.

### Asset Loading Strategy

Servers load widget assets in this order:

1. **Dev Origin** (if `DOMAIN` is set OR `ENVIRONMENT=local`):
   - Loads from specified origin (default `http://localhost:4444` in local mode)
   - Uses un-hashed filenames in local mode (e.g., `/pizzaz.js`)
   - Auto-bumps template version every minute in dev mode for cache refresh

2. **Inline Local Build** (if dev origin fails and local `assets/` exist):
   - Reads hashed files from `assets/` directory
   - Inlines CSS/JS into HTML templates

3. **CDN Fallback** (if above fail):
   - Uses published CDN version at `https://persistent.oaistatic.com/ecosystem-built-assets`

## Next Steps

- Customize the widget data: edit the handlers in `pizzaz_server_node/src`, `pizzaz_server_python/main.py`, or the solar system server to fetch data from your systems.
- Create your own components and add them to the gallery: drop new entries into `src/` and they will be picked up automatically by the build script.

## Contributing

You are welcome to open issues or submit PRs to improve this app, however, please note that we may not review all suggestions.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
