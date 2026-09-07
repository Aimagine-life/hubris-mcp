#!/usr/bin/env node
/**
 * Hubris MCP server, stdio transport.
 *
 * Hubris is a hosted service, so the tools themselves run on our side. This
 * package is the local end of that: it declares the tool surface and forwards
 * calls to https://api.hubris.pw/mcp with the caller's key.
 *
 * The declaration is deliberately local rather than proxied. A client — or a
 * directory's introspection crawler — can list the tools and read their
 * schemas without any credential; only an actual call needs HUBRIS_API_KEY.
 *
 * Configuration:
 *   HUBRIS_API_KEY   required to call a tool, not to list them
 *   HUBRIS_MCP_URL   override the endpoint (defaults to the hosted one)
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';

import { TOOLS } from './tools.js';

const ENDPOINT = process.env.HUBRIS_MCP_URL ?? 'https://api.hubris.pw/mcp';
const PACKAGE_VERSION = '0.1.0';

const INSTRUCTIONS = `Hubris is an OpenAI-compatible LLM gateway for the Russian market. It puts around 550 models from every major vendor behind one API billed in rubles, and this server exposes that catalogue, the account balance and the models themselves.

The usual order of work:
1. models_search — narrow the catalogue by capability, price ceiling and context window.
2. models_get_pricing — confirm what the chosen model actually costs.
3. chat_complete — run the request on it.
balance_get shows what is left on the account; check it before a long run.

Two things to keep in mind. Model ids are matched exactly and always carry the vendor prefix, as in "anthropic/claude-sonnet-5" — short names and names with a trailing date are rejected. And a "0.00" token price does not mean free: models billed per image, per second or per thousand characters report zero token rates, and their real price is in models_get_pricing under perUnit. The isFree flag is the only reliable answer to "is this free".

Everything except chat_complete is read-only. chat_complete spends money from the account.`;

/** Forwards one tools/call to the hosted server and returns its result. */
async function callRemote(name: string, args: unknown): Promise<CallToolResult> {
  const apiKey = process.env.HUBRIS_API_KEY;
  if (!apiKey) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text:
            'HUBRIS_API_KEY is not set. Create a key at https://hubris.pw/keys and pass it ' +
            'to this server through the environment. Listing tools works without one; ' +
            'calling them does not.',
        },
      ],
    };
  }

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name, arguments: args ?? {} },
      }),
    });
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    return { isError: true, content: [{ type: 'text', text: `Could not reach ${ENDPOINT}: ${reason}` }] };
  }

  const body = await response.text();

  if (!response.ok) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Hubris answered ${response.status}: ${body.slice(0, 600)}` }],
    };
  }

  // Streamable HTTP answers either with plain JSON or with a single SSE frame.
  const payload = body.trimStart().startsWith('{')
    ? body
    : (body.split('\n').find((line) => line.startsWith('data: '))?.slice('data: '.length) ?? '{}');

  let parsed: { result?: CallToolResult; error?: { message?: string } };
  try {
    parsed = JSON.parse(payload);
  } catch {
    return { isError: true, content: [{ type: 'text', text: `Unreadable answer from Hubris: ${body.slice(0, 600)}` }] };
  }

  if (parsed.error) {
    return { isError: true, content: [{ type: 'text', text: parsed.error.message ?? 'Hubris returned an error.' }] };
  }
  if (!parsed.result) {
    return { isError: true, content: [{ type: 'text', text: 'Hubris returned no result.' }] };
  }
  return parsed.result;
}

const server = new Server(
  { name: 'hubris', version: PACKAGE_VERSION },
  { capabilities: { tools: {} }, instructions: INSTRUCTIONS },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) =>
  callRemote(request.params.name, request.params.arguments),
);

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
}

main().catch((error) => {
  console.error('hubris-mcp failed to start:', error);
  process.exit(1);
});
