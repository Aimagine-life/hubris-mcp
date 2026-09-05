# Installing the Hubris MCP server (for AI agents)

Hubris MCP is a **hosted** server — there is nothing to build, clone or run locally.

1. Ask the user for a Hubris API key. Keys look like `sk-gw-...` and are created at https://hubris.pw/keys (registration at https://hubris.pw). A key with the "read-only" flag is enough for catalog/balance tools; `chat_complete` needs a normal key with balance.
2. Add a remote server entry to the MCP client configuration:

   - **Transport:** Streamable HTTP
   - **URL:** `https://api.hubris.pw/mcp`
   - **Header:** `Authorization: Bearer <API key>`

   Cline (`cline_mcp_settings.json`):

   ```json
   {
     "mcpServers": {
       "hubris": {
         "type": "streamableHttp",
         "url": "https://api.hubris.pw/mcp",
         "headers": {
           "Authorization": "Bearer sk-gw-..."
         }
       }
     }
   }
   ```

   Claude Code:

   ```bash
   claude mcp add --transport http hubris https://api.hubris.pw/mcp \
     --header "Authorization: Bearer sk-gw-..."
   ```

3. Verify: call `models_search` with `{"capability": "vision", "limit": 3}` — the server returns three vision-capable models with prices in rubles. `balance_get` returns the account balance.

Notes:
- Do not use `sse` — the server speaks Streamable HTTP only.
- Model ids use the full `vendor/model` form (`anthropic/claude-sonnet-5`, `openai/gpt-5.6-luna`); `models_search` returns the exact ids to pass to `chat_complete`.
- Full documentation: https://hubris.pw/docs/integrations/mcp
