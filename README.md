# Apps SDK Examples Gallery

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

This repository showcases example UI components to be used with the Apps SDK, as well as example MCP servers that expose a collection of components as tools.
It is meant to be used as a starting point and source of inspiration to build your own apps for ChatGPT.

## MCP + Apps SDK overview

The Model Context Protocol (MCP) is an open specification for connecting large language model clients to external tools, data, and user interfaces. An MCP server exposes tools that a model can call during a conversation and returns results according to the tool contracts. Those results can include extra metadata—such as inline HTML—that the Apps SDK uses to render rich UI components (widgets) alongside assistant messages.

Within the Apps SDK, MCP keeps the server, model, and UI in sync. By standardizing the wire format, authentication, and metadata, it lets ChatGPT reason about your connector the same way it reasons about built-in tools. A minimal MCP integration for Apps SDK implements three capabilities:

1. **List tools** – Your server advertises the tools it supports, including their JSON Schema input/output contracts and optional annotations (for example, `readOnlyHint`).
2. **Call tools** – When a model selects a tool, it issues a `call_tool` request with arguments that match the user intent. Your server executes the action and returns structured content the model can parse.
3. **Return widgets** – Alongside structured content, return embedded resources in the response metadata so the Apps SDK can render the interface inline in the Apps SDK client (ChatGPT).

Because the protocol is transport agnostic, you can host the server over Server-Sent Events or streaming HTTP—Apps SDK supports both.

The MCP servers in this demo highlight how each tool can light up widgets by combining structured payloads with `_meta.openai/outputTemplate` metadata returned from the MCP servers.

## Repository structure

- `src/` – Source for each widget example.
- `assets/` – Generated HTML, JS, and CSS bundles after running the build step.
- `pizzaz_server_node/` – MCP server implemented with the official TypeScript SDK.
- `pizzaz_server_python/` – Python MCP server that returns the Pizzaz widgets.
- `solar-system_server_python/` – Python MCP server for the 3D solar system widget.
- `build-all.mts` – Vite build orchestrator that produces hashed bundles for every widget entrypoint.

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn
- Python 3.10+ (for the Python MCP server)

## Install dependencies

Clone the repository and install the workspace dependencies:

```bash
pnpm install
```

> Using npm or yarn? Install the root dependencies with your preferred client and adjust the commands below accordingly.

## Build the components gallery

The components are bundled into standalone assets that the MCP servers serve as reusable UI resources.

```bash
pnpm run build
```

This command runs `build-all.mts`, producing versioned `.html`, `.js`, and `.css` files inside `assets/`. Each widget is wrapped with the CSS it needs so you can host the bundles directly or ship them with your own server.

To iterate locally, you can also launch the Vite dev server:

```bash
pnpm run dev
```

## Serve the static assets

If you want to preview the generated bundles without the MCP servers, start the static file server after running a build:

```bash
pnpm run serve
```

The assets are exposed at [`http://localhost:4444`](http://localhost:4444) with CORS enabled so that local tooling (including MCP inspectors) can fetch them.

## Run modes at a glance (dev, serve, CDN)

These examples support multiple ways to load widget assets. Pick the mode that suits your workflow:

- Dev (hot reload): run `pnpm dev` to start Vite at `http://localhost:4444`, then start a Pizzaz MCP server. The servers will fetch un-hashed dev bundles from the dev origin so UI changes reflect instantly.
	- In dev with un-hashed assets and no `TEMPLATE_VERSION` set, the servers auto-generate a minute-granularity version like `dev-k9` so ChatGPT refetches the template periodically while you iterate.
- Serve (local hashed build): run `pnpm build` then `pnpm serve` to host hashed bundles from the `assets/` folder at `http://localhost:4444`. Start a Pizzaz MCP server and it will use the same origin.
- CDN fallback: if no dev origin is set and the local hashed files are missing, the servers fall back to the published CDN snapshot. This is useful for quick testing without building locally. Note: `pizzaz-video` is local-only and not on the CDN.

Environment variables you can set before starting a server (PowerShell examples):

- `PIZZAZ_ASSET_ORIGIN`: when set, points to a dev/serve host, e.g. `$env:PIZZAZ_ASSET_ORIGIN = 'http://localhost:4444'`
- `PIZZAZ_ASSET_HASHED`: set to `true` to request hashed assets from the origin; `false` for dev un-hashed, e.g. `$env:PIZZAZ_ASSET_HASHED = 'false'`
- `ASSET_HASH`: optionally override the asset hash (4 chars) used for lookups, e.g. `$env:ASSET_HASH = '2d2b'`
- `TEMPLATE_VERSION`: cache-busting query value appended to `ui://` template URIs, e.g. `$env:TEMPLATE_VERSION = 'dev1'`
- `PIZZAZ_VIDEO_URL`: override the default video used in the `pizzaz-video` widget

Examples (PowerShell):

- Dev hot reload:
	- `$env:PIZZAZ_ASSET_ORIGIN = 'http://localhost:4444'`; `$env:PIZZAZ_ASSET_HASHED = 'false'`; `pnpm dev` in one terminal; `pnpm start:pizzaz-node` in another.
- Serve local build:
	- `pnpm build`; `$env:PIZZAZ_ASSET_ORIGIN = 'http://localhost:4444'`; `$env:PIZZAZ_ASSET_HASHED = 'true'`; `pnpm serve`; `pnpm start:pizzaz-node`.
- CDN-only (no local assets):
	- `Remove-Item Env:PIZZAZ_ASSET_ORIGIN`; `Remove-Item Env:ASSET_HASH` (optional); `pnpm start:pizzaz-node`.

## Local bundles in the MCP servers

Both Pizzaz MCP servers select assets in this order: dev origin → inline local build → CDN fallback. The CSS/JS are inlined when using local builds so the widgets render the same as your local output.

- Run `pnpm run build` when UI changes; the servers read the hashed files that `build-all.mts` generates (for example, `pizzaz-2d2b.js`).
- If a local file is missing, the servers silently fall back to the CDN (info-level logs only) so expected CDN usage stays clean.
- Override the bundle hash with `ASSET_HASH` if you want to target a specific build output.

## Run the MCP servers

The repository ships several demo MCP servers that highlight different widget bundles:

- **Pizzaz (Node & Python)** – pizza-inspired collection of tools and components
- **Solar system (Python)** – 3D solar system viewer

Every tool response includes plain text content, structured JSON, and `_meta.openai/outputTemplate` metadata so the Apps SDK can hydrate the matching widget.

### Pizzaz Node server

```bash
cd pizzaz_server_node
pnpm start
```

### Pizzaz Python server

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r pizzaz_server_python/requirements.txt
uvicorn pizzaz_server_python.main:app --port 8000
```

### Solar system Python server

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r solar-system_server_python/requirements.txt
uvicorn solar-system_server_python.main:app --port 8000
```

You can reuse the same virtual environment for all Python servers—install the dependencies once and run whichever entry point you need.

## Testing in ChatGPT

To add these apps to ChatGPT, enable [developer mode](https://platform.openai.com/docs/guides/developer-mode), and add your apps in Settings > Connectors.

To add your local server without deploying it, you can use a tool like [ngrok](https://ngrok.com/) to expose your local server to the internet.

For example, once your mcp servers are running, you can run:

```bash
ngrok http 8000
```

You will get a public URL that you can use to add your local server to ChatGPT in Settings > Connectors.

For example: `https://<custom_endpoint>.ngrok-free.app/mcp`

## Next steps

- Customize the widget data: edit the handlers in `pizzaz_server_node/src`, `pizzaz_server_python/main.py`, or the solar system server to fetch data from your systems.
- Create your own components and add them to the gallery: drop new entries into `src/` and they will be picked up automatically by the build script.

## Contributing

You are welcome to open issues or submit PRs to improve this app, however, please note that we may not review all suggestions.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
