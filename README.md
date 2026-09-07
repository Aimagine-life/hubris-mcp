# Hubris MCP

[Model Context Protocol](https://modelcontextprotocol.io) server for [Hubris](https://hubris.pw) — an OpenAI-compatible LLM gateway with billing in rubles. Connect Claude Desktop, Claude Code, Cline, Cursor or any other MCP client to a single hosted server and get access to the model catalog, account balance and chat completions.

There are two ways in: connect your client straight to the hosted endpoint, or run the stdio server in this repository, which declares the same tools locally and forwards calls to that endpoint. The second is what you want for clients that speak stdio only, and for sandboxes that build from a Dockerfile.

Listing the tools needs no credential; only calling one does.

- **Endpoint:** `https://api.hubris.pw/mcp`
- **Transport:** Streamable HTTP
- **Auth:** Bearer API key (`sk-gw-...`, create one at [hubris.pw/keys](https://hubris.pw/keys))
- **Full docs:** [hubris.pw/docs/integrations/mcp](https://hubris.pw/docs/integrations/mcp)

## Tools

| Tool | Description |
| --- | --- |
| `models_list` | Full catalog of active models, cursor-paginated. |
| `models_search` | Filter by capability (vision / reasoning / tools / web_search / audio_in / audio_out / image_gen / transcription), price, context length. |
| `models_get_pricing` | Pricing for a specific model, in rubles. |
| `balance_get` | Current account balance. |
| `chat_complete` | LLM chat request — full parity with `POST /v1/chat/completions`. |

## Resources

| URI | Content |
| --- | --- |
| `hubris://catalog/models` | Full model catalog as a single JSON document. |
| `hubris://docs/quickstart` | Quickstart page. |

## Prompts

- `compare-models {task}` — ready-made prompt for comparing models for a given task.

## Run locally (stdio)

```bash
npm install && npm run build
HUBRIS_API_KEY=sk-gw-... node dist/index.js
```

Or with Docker:

```bash
docker build -t hubris-mcp .
docker run -i --rm -e HUBRIS_API_KEY=sk-gw-... hubris-mcp
```

In an MCP client config:

```json
{
  "mcpServers": {
    "hubris": {
      "command": "node",
      "args": ["/path/to/hubris-mcp/dist/index.js"],
      "env": { "HUBRIS_API_KEY": "sk-gw-..." }
    }
  }
}
```

`HUBRIS_MCP_URL` overrides the endpoint if you need to point it elsewhere.

## Connect

### Claude Code

```bash
claude mcp add --transport http hubris https://api.hubris.pw/mcp \
  --header "Authorization: Bearer sk-gw-..."
```

### Claude Desktop

Claude Desktop only speaks stdio, so remote HTTP servers go through the [`mcp-remote`](https://github.com/geelen/mcp-remote) shim. Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "hubris": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://api.hubris.pw/mcp",
        "--transport",
        "http-only",
        "--header",
        "Authorization:${AUTH_TOKEN}"
      ],
      "env": {
        "AUTH_TOKEN": "Bearer sk-gw-..."
      }
    }
  }
}
```

### Cline / Cursor / other clients

Any MCP client with Streamable HTTP transport support:

| Field | Value |
| --- | --- |
| Transport | Streamable HTTP |
| URL | `https://api.hubris.pw/mcp` |
| Auth header | `Authorization: Bearer sk-gw-...` |

Full connection guide (with client-specific caveats): [hubris.pw/docs/integrations/mcp](https://hubris.pw/docs/integrations/mcp).

## Security

The Bearer key grants access to your account balance. We recommend creating a dedicated key for MCP at [hubris.pw/keys](https://hubris.pw/keys) so it can be revoked independently of other integrations.

## About Hubris

Hubris is an OpenAI-compatible LLM gateway for the Russian market — one API key, one ruble-denominated balance, 400+ models. [hubris.pw](https://hubris.pw)
