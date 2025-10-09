# Pizzaz MCP server (Node)

This directory contains a minimal Model Context Protocol (MCP) server implemented with the official TypeScript SDK. The server exposes the full suite of Pizzaz demo widgets so you can experiment with UI-bearing tools in ChatGPT developer mode.

## Prerequisites

- Node.js 18+
- pnpm, npm, or yarn for dependency management

## Install dependencies

```bash
pnpm install
```

If you prefer npm or yarn, adjust the command accordingly.

## Run the server

```bash
pnpm start
```

The script bootstraps the server over stdio, which makes it compatible with the MCP Inspector as well as ChatGPT connectors. Once running you can list the tools and invoke any of the pizza experiences.

Each tool responds with:

- `content`: a short text confirmation that mirrors the original Pizzaz examples.
- `structuredContent`: a small JSON payload that echoes the topping argument, demonstrating how to ship data alongside widgets.
- `_meta.openai/outputTemplate`: metadata that binds the response to the matching Skybridge widget shell.

Feel free to extend the handlers with real data sources, authentication, and persistence.

## Dev/serve/CDN modes

The server can load widget assets from a local dev server, a local hashed build, or the CDN. Control this via environment variables (PowerShell examples):

- Dev hot reload:
	- `$env:PIZZAZ_ASSET_ORIGIN = 'http://localhost:4444'`
	- `$env:PIZZAZ_ASSET_HASHED = 'false'`
	- Run `pnpm dev` at repo root, then `pnpm start` here.
	- Tip: if `TEMPLATE_VERSION` is unset in this mode, the server auto-generates a value that changes once per minute (e.g., `dev-k9`) to trigger template re-fetches while you iterate.
- Serve local build:
	- `pnpm build` at repo root
	- `$env:PIZZAZ_ASSET_ORIGIN = 'http://localhost:4444'`; `$env:PIZZAZ_ASSET_HASHED = 'true'`
	- `pnpm serve` at repo root to host `assets/`
	- `pnpm start` here
- CDN fallback only:
	- `Remove-Item Env:PIZZAZ_ASSET_ORIGIN`
	- Optionally set `$env:ASSET_HASH = 'dead'` to force CDN on hashed paths
	- `pnpm start`

Other useful env vars:

- `$env:TEMPLATE_VERSION = 'dev1'` – cache-busts template URIs in ChatGPT
- `$env:PIZZAZ_VIDEO_URL = 'https://...'` – override default video used by `pizzaz-video` widget
