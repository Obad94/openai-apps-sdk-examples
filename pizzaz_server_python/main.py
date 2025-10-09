"""Pizzaz demo MCP server implemented with the Python FastMCP helper.

The server mirrors the Node example in this repository and exposes
widget-backed tools that render the Pizzaz UI bundle. Each handler returns the
HTML shell via an MCP resource and echoes the selected topping as structured
content so the ChatGPT client can hydrate the widget. The module also wires the
handlers into an HTTP/SSE stack so you can run the server with uvicorn on port
8000, matching the Node transport behavior."""

from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List

import hashlib
import json
import logging
import os

import mcp.types as types
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, ConfigDict, Field, ValidationError

logger = logging.getLogger(__name__)


REPO_ROOT = Path(__file__).resolve().parents[1]
ASSETS_DIR = REPO_ROOT / "assets"

with (REPO_ROOT / "package.json").open("r", encoding="utf-8") as package_file:
    _package_version = json.load(package_file)["version"]

DEFAULT_ASSET_HASH = hashlib.sha256(_package_version.encode("utf-8")).hexdigest()[:4]
ASSET_HASH = (os.environ.get("ASSET_HASH") or DEFAULT_ASSET_HASH).lower()

CDN_BASE = "https://persistent.oaistatic.com/ecosystem-built-assets"
CDN_VERSION = "0038"

DEV_ASSET_ORIGIN = os.environ.get("PIZZAZ_ASSET_ORIGIN")
if DEV_ASSET_ORIGIN:
    DEV_ASSET_ORIGIN = DEV_ASSET_ORIGIN.rstrip("/")

# When using the Vite dev server (`pnpm run dev`), assets are served without the hash suffix.
# Set PIZZAZ_ASSET_HASHED=false to request un-hashed filenames from the dev origin.
DEV_ASSET_HASHED = (os.environ.get("PIZZAZ_ASSET_HASHED") or "true").lower() != "false"

TEMPLATE_VERSION = (os.environ.get("TEMPLATE_VERSION") or ASSET_HASH).lower()
VERSION_SUFFIX = f"?v={TEMPLATE_VERSION}" if TEMPLATE_VERSION else ""


@dataclass(frozen=True)
class PizzazWidget:
    identifier: str
    title: str
    template_uri: str
    invoking: str
    invoked: str
    html: str
    response_text: str


def _inline_widget_markup(asset_name: str) -> str | None:
    css_path = ASSETS_DIR / f"{asset_name}-{ASSET_HASH}.css"
    js_path = ASSETS_DIR / f"{asset_name}-{ASSET_HASH}.js"

    try:
        css = css_path.read_text(encoding="utf-8")
        js = js_path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return None
    except OSError as exc:  # pragma: no cover
        logger.warning("Failed to load local assets for %s (%s)", asset_name, exc)
        return None

    return (
        f'<div id="{asset_name}-root"></div>\n'
        f"<style>\n{css}\n</style>\n"
        f"<script type=\"module\">\n{js}\n</script>"
    )


def _cdn_widget_markup(asset_name: str) -> str:
    return (
        f'<div id="{asset_name}-root"></div>\n'
        f'<link rel="stylesheet" href="{CDN_BASE}/{asset_name}-{CDN_VERSION}.css">\n'
        f'<script type="module" src="{CDN_BASE}/{asset_name}-{CDN_VERSION}.js"></script>'
    )


def _dev_hosted_widget_markup(asset_name: str) -> str | None:
    if not DEV_ASSET_ORIGIN:
        return None

    # Only serve from the dev origin if a corresponding entry exists under src/
    # This avoids emitting broken links for widgets that rely on CDN-only assets.
    src_dir = REPO_ROOT / "src" / asset_name
    if not src_dir.exists():
        return None

    hash_segment = f"-{ASSET_HASH}" if DEV_ASSET_HASHED else ""
    css_href = f"{DEV_ASSET_ORIGIN}/{asset_name}{hash_segment}.css"
    js_src = f"{DEV_ASSET_ORIGIN}/{asset_name}{hash_segment}.js"

    return (
        f'<div id="{asset_name}-root"></div>\n'
        f'<link rel="stylesheet" href="{css_href}">\n'
        f'<script type="module" src="{js_src}"></script>'
    )


def _build_widget_markup(asset_name: str) -> str:
    dev_markup = _dev_hosted_widget_markup(asset_name)
    if dev_markup is not None:
        logger.info("Serving %s from dev asset origin %s", asset_name, DEV_ASSET_ORIGIN)
        return dev_markup

    inline = _inline_widget_markup(asset_name)
    if inline is not None:
        return inline

    logger.warning(
        "Falling back to CDN assets for %s (hash %s not found in %s)",
        asset_name,
        ASSET_HASH,
        ASSETS_DIR,
    )
    return _cdn_widget_markup(asset_name)


_WIDGET_CONFIGS: List[Dict[str, str]] = [
    {
        "identifier": "pizza-map",
        "title": "Show Pizza Map",
        "template_uri_base": "ui://widget/pizza-map.html",
        "invoking": "Hand-tossing a map",
        "invoked": "Served a fresh map",
        "response_text": "Rendered a pizza map!",
        "asset_name": "pizzaz",
    },
    {
        "identifier": "pizza-carousel",
        "title": "Show Pizza Carousel",
        "template_uri_base": "ui://widget/pizza-carousel.html",
        "invoking": "Carousel some spots",
        "invoked": "Served a fresh carousel",
        "response_text": "Rendered a pizza carousel!",
        "asset_name": "pizzaz-carousel",
    },
    {
        "identifier": "pizza-albums",
        "title": "Show Pizza Album",
        "template_uri_base": "ui://widget/pizza-albums.html",
        "invoking": "Hand-tossing an album",
        "invoked": "Served a fresh album",
        "response_text": "Rendered a pizza album!",
        "asset_name": "pizzaz-albums",
    },
    {
        "identifier": "pizza-list",
        "title": "Show Pizza List",
        "template_uri_base": "ui://widget/pizza-list.html",
        "invoking": "Hand-tossing a list",
        "invoked": "Served a fresh list",
        "response_text": "Rendered a pizza list!",
        "asset_name": "pizzaz-list",
    },
    {
        "identifier": "pizza-video",
        "title": "Show Pizza Video",
        "template_uri_base": "ui://widget/pizza-video.html",
        "invoking": "Hand-tossing a video",
        "invoked": "Served a fresh video",
        "response_text": "Rendered a pizza video!",
        "asset_name": "pizzaz-video",
    },
]


widgets: List[PizzazWidget] = [
    PizzazWidget(
        identifier=config["identifier"],
        title=config["title"],
        template_uri=f"{config['template_uri_base']}{VERSION_SUFFIX}",
        invoking=config["invoking"],
        invoked=config["invoked"],
        html=_build_widget_markup(config["asset_name"]),
        response_text=config["response_text"],
    )
    for config in _WIDGET_CONFIGS
]


MIME_TYPE = "text/html+skybridge"


WIDGETS_BY_ID: Dict[str, PizzazWidget] = {widget.identifier: widget for widget in widgets}
WIDGETS_BY_URI: Dict[str, PizzazWidget] = {widget.template_uri: widget for widget in widgets}


class PizzaInput(BaseModel):
    """Schema for pizza tools."""

    pizza_topping: str = Field(
        ...,
        alias="pizzaTopping",
        description="Topping to mention when rendering the widget.",
    )

    model_config = ConfigDict(populate_by_name=True, extra="forbid")


mcp = FastMCP(
    name="pizzaz-python",
    sse_path="/mcp",
    message_path="/mcp/messages",
    stateless_http=True,
)


TOOL_INPUT_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "pizzaTopping": {
            "type": "string",
            "description": "Topping to mention when rendering the widget.",
        }
    },
    "required": ["pizzaTopping"],
    "additionalProperties": False,
}


def _resource_description(widget: PizzazWidget) -> str:
    return f"{widget.title} widget markup"


def _tool_meta(widget: PizzazWidget) -> Dict[str, Any]:
    return {
        "openai/outputTemplate": widget.template_uri,
        "openai/toolInvocation/invoking": widget.invoking,
        "openai/toolInvocation/invoked": widget.invoked,
        "openai/widgetAccessible": True,
        "openai/resultCanProduceWidget": True,
        "annotations": {
          "destructiveHint": False,
          "openWorldHint": False,
          "readOnlyHint": True,
        }
    }


def _embedded_widget_resource(widget: PizzazWidget) -> types.EmbeddedResource:
    # Some typed clients expect AnyUrl; cast string to the expected type at runtime
    text_contents = types.TextResourceContents(
        uri=widget.template_uri,  # type: ignore[arg-type]
        mimeType=MIME_TYPE,
        text=widget.html,
    )
    # EmbeddedResource in latest FastMCP generally takes (type, resource)
    return types.EmbeddedResource(
        type="resource",
        resource=text_contents,
    )


@mcp._mcp_server.list_tools()
async def _list_tools() -> List[types.Tool]:
    return [
        types.Tool(
            name=widget.identifier,
            title=widget.title,
            description=widget.title,
            inputSchema=deepcopy(TOOL_INPUT_SCHEMA),
            _meta=_tool_meta(widget),
        )
        for widget in widgets
    ]


@mcp._mcp_server.list_resources()
async def _list_resources() -> List[types.Resource]:
    return [
        types.Resource(
            name=widget.title,
            uri=widget.template_uri,  # type: ignore[arg-type]
            description=_resource_description(widget),
            mimeType=MIME_TYPE,
            _meta=_tool_meta(widget),
        )
        for widget in widgets
    ]


@mcp._mcp_server.list_resource_templates()
async def _list_resource_templates() -> List[types.ResourceTemplate]:
    return [
        types.ResourceTemplate(
            name=widget.title,
            uriTemplate=widget.template_uri,  # type: ignore[arg-type]
            description=_resource_description(widget),
            mimeType=MIME_TYPE,
            _meta=_tool_meta(widget),
        )
        for widget in widgets
    ]


async def _handle_read_resource(req: types.ReadResourceRequest) -> types.ServerResult:
    widget = WIDGETS_BY_URI.get(str(req.params.uri))
    if widget is None:
        return types.ServerResult(
            types.ReadResourceResult(
                contents=[],
                _meta={"error": f"Unknown resource: {req.params.uri}"},
            )
        )

    contents: List[types.TextResourceContents | types.BlobResourceContents] = [
        types.TextResourceContents(
            uri=widget.template_uri,  # type: ignore[arg-type]
            mimeType=MIME_TYPE,
            text=widget.html,
            _meta=_tool_meta(widget),
        )
    ]

    return types.ServerResult(
        types.ReadResourceResult(contents=contents)  # type: ignore[arg-type]
    )


async def _call_tool_request(req: types.CallToolRequest) -> types.ServerResult:
    widget = WIDGETS_BY_ID.get(req.params.name)
    if widget is None:
        return types.ServerResult(
            types.CallToolResult(
                content=[
                    types.TextContent(
                        type="text",
                        text=f"Unknown tool: {req.params.name}",
                    )
                ],
                isError=True,
            )
        )

    arguments = req.params.arguments or {}
    try:
        payload = PizzaInput.model_validate(arguments)
    except ValidationError as exc:
        return types.ServerResult(
            types.CallToolResult(
                content=[
                    types.TextContent(
                        type="text",
                        text=f"Input validation error: {exc.errors()}",
                    )
                ],
                isError=True,
            )
        )

    topping = payload.pizza_topping
    widget_resource = _embedded_widget_resource(widget)
    meta: Dict[str, Any] = {
        "openai.com/widget": widget_resource.model_dump(mode="json"),
        "openai/outputTemplate": widget.template_uri,
        "openai/toolInvocation/invoking": widget.invoking,
        "openai/toolInvocation/invoked": widget.invoked,
        "openai/widgetAccessible": True,
        "openai/resultCanProduceWidget": True,
    }

    return types.ServerResult(
        types.CallToolResult(
            content=[
                types.TextContent(
                    type="text",
                    text=widget.response_text,
                )
            ],
            structuredContent={"pizzaTopping": topping},
            _meta=meta,
        )
    )


mcp._mcp_server.request_handlers[types.CallToolRequest] = _call_tool_request
mcp._mcp_server.request_handlers[types.ReadResourceRequest] = _handle_read_resource


app = mcp.streamable_http_app()

try:
    from starlette.middleware.cors import CORSMiddleware

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=False,
    )
except Exception:
    pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("pizzaz_server_python.main:app", host="0.0.0.0", port=8000)
