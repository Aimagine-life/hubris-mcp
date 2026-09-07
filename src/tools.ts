/**
 * Tool declarations, taken verbatim from the hosted server's tools/list so the
 * two never drift. Regenerate from the live endpoint when that surface changes.
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const TOOLS: Tool[] = [
  {
    "name": "models_list",
    "title": "List models",
    "description": "Walk the whole Hubris catalogue page by page, ordered by model id. Returns every active model with its capabilities, context window and ruble price.\n\nUse this when you need the complete catalogue — to cache it, to count models, or to scan for something no filter covers. When you are looking for a model that fits a task, use models_search instead: it filters by capability, price and context server-side and saves you a few hundred rows.\n\nPaging: read `nextCursor` from the response and pass it back as `cursor`. When `nextCursor` is absent you have reached the end. The catalogue holds roughly 550 models, so a full walk is about 11 calls at the default page size.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "cursor": {
          "type": "string",
          "description": "The `nextCursor` value from the previous response. Omit for the first page."
        },
        "limit": {
          "type": "integer",
          "minimum": 1,
          "maximum": 200,
          "default": 50,
          "description": "Models per page, 1–200. Defaults to 50."
        }
      },
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    },
    "execution": {
      "taskSupport": "forbidden"
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "models": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "description": "Model id to pass to chat_complete and to the OpenAI-compatible API, e.g. \"anthropic/claude-sonnet-5\"."
              },
              "displayName": {
                "type": "string",
                "description": "Human-readable model name."
              },
              "capabilities": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "Any of: vision, image_gen, transcription, audio_in, audio_out, audio (legacy, means either audio direction), tools, reasoning, web_search."
              },
              "contextLength": {
                "type": "number",
                "description": "Context window in tokens."
              },
              "pricing": {
                "type": "object",
                "properties": {
                  "unit": {
                    "type": "string",
                    "enum": [
                      "token",
                      "unit",
                      "unknown"
                    ],
                    "description": "Billing unit. \"token\" — priced per token, the two Rub fields below are meaningful. \"unit\" — priced per image, per minute, per character and so on; token fields are \"0.00\" and the real price is in models_get_pricing → perUnit. \"unknown\" — no pricing on record."
                  },
                  "inputPer1MRub": {
                    "type": "string",
                    "description": "Price of 1M input tokens in rubles, decimal string, e.g. \"182.40\". \"0.00\" when unit is not \"token\"."
                  },
                  "outputPer1MRub": {
                    "type": "string",
                    "description": "Price of 1M output tokens in rubles, decimal string. \"0.00\" when unit is not \"token\"."
                  },
                  "isFree": {
                    "type": "boolean",
                    "description": "True only for genuinely free models. Do not infer this from a zero price: models billed per image or per minute also report \"0.00\" token rates."
                  }
                },
                "required": [
                  "unit",
                  "inputPer1MRub",
                  "outputPer1MRub",
                  "isFree"
                ],
                "additionalProperties": false
              }
            },
            "required": [
              "id",
              "displayName",
              "capabilities",
              "contextLength",
              "pricing"
            ],
            "additionalProperties": false
          }
        },
        "nextCursor": {
          "type": "string",
          "description": "Pass back as `cursor` to fetch the next page. Absent when the last page was returned."
        }
      },
      "required": [
        "models"
      ],
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    "name": "models_search",
    "title": "Search models",
    "description": "Find models that fit a task. Filters by name, capability, price ceiling and context window, and can sort the result. This is the tool to reach for when choosing a model — it does the filtering server-side and returns at most 50 rows.\n\nAll filters combine with AND, and every one of them is optional: calling with no arguments returns the first 50 active models.\n\nTwo things worth knowing about prices. `maxInputPer1MRub` keeps only models billed per token, because a ruble-per-million ceiling is meaningless for a model billed per image. The `cheap_input` and `cheap_output` sorts push non-token models to the end of the list for the same reason — their token rate reads as zero, which would otherwise put video models at the top of \"cheapest\".",
    "inputSchema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Case-insensitive substring matched against the model id and display name, e.g. \"claude\" or \"gpt\"."
        },
        "capability": {
          "type": "string",
          "enum": [
            "vision",
            "reasoning",
            "tools",
            "web_search",
            "audio_in",
            "audio_out",
            "audio",
            "image_gen",
            "transcription"
          ],
          "description": "Keep only models with this capability. vision — reads images. image_gen — draws them. transcription — speech to text via /v1/audio/transcriptions. audio_in — accepts an audio recording in chat. audio_out — answers with speech. audio — legacy, matches either audio direction. tools — function calling. reasoning — extended thinking. web_search — built-in web search."
        },
        "maxInputPer1MRub": {
          "type": "number",
          "description": "Ceiling on the price of 1M input tokens, in rubles. Also restricts the result to models billed per token, since the ceiling means nothing for models billed per image or minute."
        },
        "minContext": {
          "type": "integer",
          "description": "Keep only models whose context window is at least this many tokens."
        },
        "sort": {
          "type": "string",
          "enum": [
            "cheap_input",
            "cheap_output",
            "big_context",
            "popular"
          ],
          "description": "cheap_input / cheap_output — ascending token price, models not billed per token go last. big_context — widest context window first. popular — most used on Hubris first. Unsorted when omitted."
        }
      },
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    },
    "execution": {
      "taskSupport": "forbidden"
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "models": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "description": "Model id to pass to chat_complete and to the OpenAI-compatible API, e.g. \"anthropic/claude-sonnet-5\"."
              },
              "displayName": {
                "type": "string",
                "description": "Human-readable model name."
              },
              "capabilities": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "Any of: vision, image_gen, transcription, audio_in, audio_out, audio (legacy, means either audio direction), tools, reasoning, web_search."
              },
              "contextLength": {
                "type": "number",
                "description": "Context window in tokens."
              },
              "pricing": {
                "type": "object",
                "properties": {
                  "unit": {
                    "type": "string",
                    "enum": [
                      "token",
                      "unit",
                      "unknown"
                    ],
                    "description": "Billing unit. \"token\" — priced per token, the two Rub fields below are meaningful. \"unit\" — priced per image, per minute, per character and so on; token fields are \"0.00\" and the real price is in models_get_pricing → perUnit. \"unknown\" — no pricing on record."
                  },
                  "inputPer1MRub": {
                    "type": "string",
                    "description": "Price of 1M input tokens in rubles, decimal string, e.g. \"182.40\". \"0.00\" when unit is not \"token\"."
                  },
                  "outputPer1MRub": {
                    "type": "string",
                    "description": "Price of 1M output tokens in rubles, decimal string. \"0.00\" when unit is not \"token\"."
                  },
                  "isFree": {
                    "type": "boolean",
                    "description": "True only for genuinely free models. Do not infer this from a zero price: models billed per image or per minute also report \"0.00\" token rates."
                  }
                },
                "required": [
                  "unit",
                  "inputPer1MRub",
                  "outputPer1MRub",
                  "isFree"
                ],
                "additionalProperties": false
              }
            },
            "required": [
              "id",
              "displayName",
              "capabilities",
              "contextLength",
              "pricing"
            ],
            "additionalProperties": false
          },
          "description": "Matching models, at most 50."
        }
      },
      "required": [
        "models"
      ],
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    "name": "models_get_pricing",
    "title": "Get model pricing",
    "description": "The full price of one model in rubles — the authoritative answer to \"what does this cost\".\n\nPrefer this over the pricing embedded in models_list and models_search whenever the model is not billed per token. Those two return \"0.00\" token rates for such models; only this tool returns `perUnit`, where the real price per image, per second or per thousand characters lives.\n\nErrors with InvalidParams if the model id is unknown or the model is no longer active.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "modelId": {
          "type": "string",
          "description": "Exact model id from the catalogue, vendor included, e.g. \"openai/gpt-6-astra\"."
        }
      },
      "required": [
        "modelId"
      ],
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    },
    "execution": {
      "taskSupport": "forbidden"
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "unit": {
          "type": "string",
          "enum": [
            "token",
            "unit",
            "unknown"
          ],
          "description": "Billing unit. \"token\" — priced per token, the two Rub fields below are meaningful. \"unit\" — priced per image, per minute, per character and so on; token fields are \"0.00\" and the real price is in models_get_pricing → perUnit. \"unknown\" — no pricing on record."
        },
        "inputPer1MRub": {
          "type": "string",
          "description": "Price of 1M input tokens in rubles, decimal string, e.g. \"182.40\". \"0.00\" when unit is not \"token\"."
        },
        "outputPer1MRub": {
          "type": "string",
          "description": "Price of 1M output tokens in rubles, decimal string. \"0.00\" when unit is not \"token\"."
        },
        "isFree": {
          "type": "boolean",
          "description": "True only for genuinely free models. Do not infer this from a zero price: models billed per image or per minute also report \"0.00\" token rates."
        },
        "currency": {
          "type": "string",
          "const": "RUB",
          "description": "All prices are in rubles."
        },
        "perUnit": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "sku": {
                "type": "string",
                "description": "What exactly is billed, e.g. \"image\", \"video\", \"speech\"."
              },
              "unit": {
                "type": "string",
                "description": "Unit of billing, e.g. \"image\", \"second\", \"1k characters\"."
              },
              "priceRub": {
                "type": "string",
                "description": "Price of one unit in rubles, decimal string."
              }
            },
            "required": [
              "sku",
              "unit",
              "priceRub"
            ],
            "additionalProperties": false
          },
          "description": "Present only for models not billed per token. This is where their real price lives."
        }
      },
      "required": [
        "unit",
        "inputPer1MRub",
        "outputPer1MRub",
        "isFree",
        "currency"
      ],
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    "name": "balance_get",
    "title": "Get account balance",
    "description": "Current balance of the Hubris account the API key belongs to, in rubles.\n\nWorth checking before a long or expensive run: requests are refused once the balance is spent. The balance can go slightly negative — one operation is allowed to overdraw it, and the next one is refused.\n\nTwo representations of the same number come back. Use `balanceKopecks` for arithmetic and comparisons — it is an exact integer string. Use `balanceRub` for display.",
    "inputSchema": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {}
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    },
    "execution": {
      "taskSupport": "forbidden"
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "balanceRub": {
          "type": "string",
          "description": "Balance in rubles as a decimal string, e.g. \"1240.55\". Negative when the account is overdrawn."
        },
        "balanceKopecks": {
          "type": "string",
          "description": "The same balance in kopecks as an integer string. Use this one for arithmetic: it is exact, while the ruble string is for display."
        }
      },
      "required": [
        "balanceRub",
        "balanceKopecks"
      ],
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    "name": "chat_complete",
    "title": "Chat completion",
    "description": "Run a chat completion on any model in the Hubris catalogue and get the answer back. Full parity with POST /v1/chat/completions — same request shape, same response shape, including tool calls, structured output and reasoning. Streaming is not available here: MCP tool calls are synchronous, and `stream` is ignored if you pass it.\n\nThis is how you reach a model you cannot reach otherwise — pick an id with models_search, then call it here. Useful for delegating a subtask to a cheaper or a stronger model than the one you are running on.\n\nThe call spends real money from the account balance: it is billed per token at the catalogue price, in rubles. balance_get shows what is left.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "model": {
          "type": "string",
          "description": "Model id from the catalogue, vendor included and matched exactly, e.g. \"anthropic/claude-sonnet-5\". Short names and names with a trailing date are rejected. Use models_search to find one."
        },
        "messages": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "role": {
                "type": "string",
                "enum": [
                  "system",
                  "user",
                  "assistant",
                  "tool"
                ],
                "description": "Who the message is from."
              },
              "content": {
                "anyOf": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "array"
                  },
                  {
                    "type": "null"
                  }
                ],
                "description": "Message text. Can be an array of parts for multimodal input — {type:\"text\"} and {type:\"image_url\"} — on models whose capabilities include \"vision\"."
              },
              "name": {
                "type": "string",
                "description": "Optional author name."
              },
              "tool_calls": {
                "type": "array",
                "description": "Tool calls the model asked for, on an assistant message."
              },
              "tool_call_id": {
                "type": "string",
                "description": "Which tool call this result answers, on a tool message."
              }
            },
            "required": [
              "role"
            ],
            "additionalProperties": false
          },
          "minItems": 1,
          "description": "Conversation so far, oldest first."
        },
        "temperature": {
          "type": "number",
          "minimum": 0,
          "maximum": 2,
          "description": "Sampling temperature, 0–2. Some newer models reject it; leave it out unless you need it."
        },
        "max_tokens": {
          "type": "integer",
          "minimum": 1,
          "description": "Cap on the length of the answer, in tokens."
        },
        "tools": {
          "type": "array",
          "description": "Function-calling tools, OpenAI shape. Model must have the \"tools\" capability."
        },
        "tool_choice": {
          "description": "\"auto\", \"none\", \"required\", or a specific function to force."
        },
        "response_format": {
          "description": "{type:\"json_object\"} or {type:\"json_schema\", json_schema:{…}} to constrain the answer to JSON."
        },
        "web_search": {
          "description": "Enables built-in web search on models whose capabilities include \"web_search\"."
        },
        "reasoning": {
          "description": "Extended thinking on models with the \"reasoning\" capability: {effort:\"low\"|\"medium\"|\"high\"}, {max_tokens:N}, or {enabled:false} to turn it off."
        },
        "stop": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          ],
          "description": "Up to four strings that cut the answer short."
        },
        "seed": {
          "type": "integer",
          "description": "Best-effort determinism. Not every model honours it."
        }
      },
      "required": [
        "model",
        "messages"
      ],
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    },
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": false,
      "idempotentHint": false,
      "openWorldHint": true
    },
    "execution": {
      "taskSupport": "forbidden"
    }
  }
];
