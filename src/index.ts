#!/usr/bin/env node
/**
 * Hubris MCP server, stdio transport.
 *
 * Hubris is a hosted service, so the tools themselves run on our side. This
 * package is the local end of that: it declares the tool surface and forwards
 * calls to https://api.hubris.pw/mcp with the caller's key.
 *
 * With a key, the tool list comes live from the hosted server, so the package
 * never lags behind new tools. Without one — or if the server cannot be
 * reached — the list bundled with this version is served, so a client or a
 * directory's introspection crawler can read the tools and their schemas
 * without any credential. Only an actual call needs HUBRIS_API_KEY.
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
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { TOOLS } from './tools.js';

const ENDPOINT = process.env.HUBRIS_MCP_URL ?? 'https://api.hubris.pw/mcp';
const PACKAGE_VERSION = '0.2.0';

const INSTRUCTIONS = `Hubris is an OpenAI-compatible LLM gateway for the Russian market. It puts around 550 models from every major vendor behind one API billed in rubles, and this server exposes that catalogue, the account balance and the models themselves.

The usual order of work:
1. models_search — narrow the catalogue by the tool that runs the model, capability, price ceiling and context window. Every model in the answer names its \`tool\`.
2. models_get_pricing — confirm what the chosen model actually costs, and for speech and video models which voices or durations it takes.
3. Run the request with that tool: chat_complete for text, embeddings_create, rerank, decisions_ask, image_generate, speech_create, transcription_create, video_create (then poll video_get) or youtube_transcribe.
balance_get shows what is left on the account and usage_get what has been spent; check them before and after a long run.

Two things to keep in mind. Model ids are matched exactly and always carry the vendor prefix, as in "anthropic/claude-sonnet-5" — short names and names with a trailing date are rejected. And a "0.00" token price does not mean free: models billed per image, per second or per thousand characters report zero token rates, and their real price is in models_get_pricing under perUnit. The isFree flag is the only reliable answer to "is this free".

Tools that run a model spend money from the account; the catalogue, balance_get, usage_get and video_get only read.`;

type RpcResponse<T> = { result?: T; error?: { message?: string } };

/** One JSON-RPC request to the hosted server. Throws with a readable reason. */
async function rpc<T>(apiKey: string, method: string, params: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Could not reach ${ENDPOINT}: ${reason}`);
  }

  const body = await response.text();
  if (!response.ok) throw new Error(`Hubris answered ${response.status}: ${body.slice(0, 600)}`);

  // Streamable HTTP answers either with plain JSON or with a single SSE frame.
  const payload = body.trimStart().startsWith('{')
    ? body
    : (body.split('\n').find((line) => line.startsWith('data: '))?.slice('data: '.length) ?? '{}');

  let parsed: RpcResponse<T>;
  try {
    parsed = JSON.parse(payload);
  } catch {
    throw new Error(`Unreadable answer from Hubris: ${body.slice(0, 600)}`);
  }
  if (parsed.error) throw new Error(parsed.error.message ?? 'Hubris returned an error.');
  if (parsed.result === undefined) throw new Error('Hubris returned no result.');
  return parsed.result;
}

/** The live tool list with a key; the bundled one without a key or when the server is unreachable. */
async function listTools(): Promise<Tool[]> {
  const apiKey = process.env.HUBRIS_API_KEY;
  if (!apiKey) return TOOLS;
  try {
    const { tools } = await rpc<{ tools?: Tool[] }>(apiKey, 'tools/list', {});
    return tools && tools.length > 0 ? tools : TOOLS;
  } catch {
    return TOOLS;
  }
}

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
  try {
    return await rpc<CallToolResult>(apiKey, 'tools/call', { name, arguments: args ?? {} });
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }] };
  }
}

const server = new Server(
  { name: 'hubris', version: PACKAGE_VERSION },
  { capabilities: { tools: {} }, instructions: INSTRUCTIONS },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: await listTools() }));

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
