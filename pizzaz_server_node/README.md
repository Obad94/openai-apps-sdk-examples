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
	- `$env:ENVIRONMENT = 'local'`
	- (Optional) `$env:DOMAIN = 'http://localhost:4444'` if you need a different host
	- Run `pnpm dev` at repo root, then `pnpm start` here.
	- Tip: in this mode, the server auto-generates a template version that changes once per minute (e.g., `dev-k9`) to trigger template re-fetches while you iterate.
- Serve local build:
	- `pnpm build` at repo root
	- `$env:ENVIRONMENT = 'production'`
	- `pnpm serve` at repo root to host `assets/`
	- `pnpm start` here
- CDN fallback only:
	- `Remove-Item Env:DOMAIN`
	- `pnpm start`

Other useful env vars:

- `$env:ENVIRONMENT = 'local'` – enables dev defaults (origin `http://localhost:4444`, unhashed assets) without setting each variable individually. Use `'production'` (default) for CDN/hashed behavior.
- `$env:DOMAIN = 'http://localhost:4444'` – overrides the asset origin.
- `$env:PORT = '9000'` – runs the HTTP listener on a different port (defaults to `8000`).

### .env support (per server)

You can create a `.env` file next to this README (see `.env.example`) to store these variables for Node. OS env always wins over `.env`. We intentionally don’t use a root-level `.env`.

Which vars matter?
- None are strictly required. With nothing set, the server serves widgets via CDN and uses sensible defaults.
- `ENVIRONMENT=local`: hot reload from Vite (the template version auto-bumps in this mode). Override `DOMAIN` if you prefer a different host.
- `ENVIRONMENT=production` (default): serve hashed assets (local or CDN depending on what’s available).
- `DOMAIN` and `PORT` are optional conveniences and are omitted from `.env.example`.
