# Hubris MCP

[![smithery badge](https://smithery.ai/badge/hubris/hubris-mcp)](https://smithery.ai/servers/hubris/hubris-mcp) [![npm](https://img.shields.io/npm/v/hubris-mcp)](https://www.npmjs.com/package/hubris-mcp) [![Hubris MCP on mcprush](https://mcprush.com/badge/hubris-mcp/score.svg)](https://mcprush.com/to/hubris-mcp?ref=badge)

[Model Context Protocol](https://modelcontextprotocol.io) server for [Hubris](https://hubris.pw) — an OpenAI-compatible LLM gateway with billing in rubles. Connect Claude Desktop, Claude Code, Cline, Cursor or any other MCP client to a single hosted server and get access to the model catalog, account balance and spending, and every kind of model in it: text, embeddings, rerankers, decision models, images, speech, transcription, video and YouTube transcripts.

There are two ways in: connect your client straight to the hosted endpoint, or run the stdio server in this repository, which declares the same tools locally and forwards calls to that endpoint. The second is what you want for clients that speak stdio only, and for sandboxes that build from a Dockerfile.

Listing the tools needs no credential; only calling one does. With `HUBRIS_API_KEY` set, the stdio server takes the tool list live from the hosted endpoint, so it never lags behind new tools; without a key it serves the list bundled with the package.

- **Endpoint:** `https://api.hubris.pw/mcp`
- **Transport:** Streamable HTTP
- **Auth:** Bearer API key (`sk-gw-...`, create one at [hubris.pw/keys](https://hubris.pw/keys))
- **Full docs:** [hubris.pw/docs/integrations/mcp](https://hubris.pw/docs/integrations/mcp)

## Tools

| Tool | Description |
| --- | --- |
| `models_list` | Full catalog of active models, cursor-paginated. |
| `models_search` | Filter by the tool that runs the model (`tool`), capability, price, context length. |
| `models_get_pricing` | Pricing for a specific model, in rubles; voices for speech models, durations and resolutions for video models. |
| `balance_get` | Current account balance. |
| `usage_get` | Spending over a period: requests, tokens, rubles. |
| `chat_complete` | LLM chat request — same as `POST /v1/chat/completions`. |
| `embeddings_create` | Embedding vectors — `POST /v1/embeddings`. |
| `rerank` | Order documents by relevance to a query — `POST /v1/rerank`. |
| `decisions_ask` | Yes/no, choice and scale answers with probabilities — `POST /v1/decisions`. |
| `image_generate` | Draw an image, returned as image content — `POST /v1/images/generations`. |
| `speech_create` | Text to speech, returned as audio content — `POST /v1/audio/speech`. |
| `transcription_create` | Speech to text from base64 audio — `POST /v1/audio/transcriptions`. |
| `video_create` | Start a video generation — `POST /v1/videos`. |
| `video_get` | Status of a video task; download links once it is ready — `GET /v1/videos/{id}`. |
| `youtube_transcribe` | Transcript or summary of a YouTube video — `POST /v1/video/transcriptions`. |

## Resources

| URI | Content |
| --- | --- |
| `hubris://catalog/models` | Full model catalog as a single JSON document. |
| `hubris://docs/quickstart` | Quickstart page. |
| `hubris://videos/{id}/content` | A finished video, linked from `video_get` (hosted endpoint only). |

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
