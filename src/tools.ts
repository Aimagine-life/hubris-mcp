/**
 * Tool declarations, taken verbatim from the hosted server's tools/list. With
 * HUBRIS_API_KEY set the server serves the live list instead (index.ts); this
 * copy answers clients and directories that list tools without a key.
 * Regenerate from the live endpoint when that surface changes.
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
              "tool": {
                "type": "string",
                "enum": [
                  "chat_complete",
                  "embeddings_create",
                  "rerank",
                  "decisions_ask",
                  "image_generate",
                  "speech_create",
                  "transcription_create",
                  "video_create"
                ],
                "description": "The tool that runs this model, e.g. \"chat_complete\" for text models or \"video_create\" for video ones."
              },
              "capabilities": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "Any of: vision, image_gen, transcription, audio_in, audio_out, audio (legacy, means either audio direction), decisions, rerank, tools, reasoning, web_search."
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
              "tool",
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
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    },
    "execution": {
      "taskSupport": "forbidden"
    }
  },
  {
    "name": "models_search",
    "title": "Search models",
    "description": "Find models that fit a task. Filters by name, the tool that runs the model, capability, price ceiling and context window, and can sort the result. This is the tool to reach for when choosing a model — it does the filtering server-side and returns at most 50 rows.\n\nAll filters combine with AND, and every one of them is optional: calling with no arguments returns the first 50 active models.\n\nTwo things worth knowing about prices. `maxInputPer1MRub` keeps only models billed per token, because a ruble-per-million ceiling is meaningless for a model billed per image. The `cheap_input` and `cheap_output` sorts push non-token models to the end of the list for the same reason — their token rate reads as zero, which would otherwise put video models at the top of \"cheapest\".",
    "inputSchema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Case-insensitive substring matched against the model id and display name, e.g. \"claude\" or \"gpt\"."
        },
        "tool": {
          "type": "string",
          "enum": [
            "chat_complete",
            "embeddings_create",
            "rerank",
            "decisions_ask",
            "image_generate",
            "speech_create",
            "transcription_create",
            "video_create"
          ],
          "description": "Keep only models run by this tool: \"chat_complete\" for text, \"embeddings_create\", \"rerank\", \"decisions_ask\", \"image_generate\", \"speech_create\", \"transcription_create\" or \"video_create\". The way to find a model for any tool other than chat_complete."
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
            "transcription",
            "decisions",
            "rerank"
          ],
          "description": "Keep only models with this capability. vision — reads images. image_gen — draws them. transcription — speech to text via /v1/audio/transcriptions. audio_in — accepts an audio recording in chat. audio_out — answers with speech. audio — legacy, matches either audio direction. tools — function calling. reasoning — extended thinking. web_search — built-in web search. decisions — yes/no, choice and scale answers with probabilities via /v1/decisions (no text output). rerank — orders documents by relevance to a query via /v1/rerank (no text output)."
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
              "tool": {
                "type": "string",
                "enum": [
                  "chat_complete",
                  "embeddings_create",
                  "rerank",
                  "decisions_ask",
                  "image_generate",
                  "speech_create",
                  "transcription_create",
                  "video_create"
                ],
                "description": "The tool that runs this model, e.g. \"chat_complete\" for text models or \"video_create\" for video ones."
              },
              "capabilities": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "Any of: vision, image_gen, transcription, audio_in, audio_out, audio (legacy, means either audio direction), decisions, rerank, tools, reasoning, web_search."
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
              "tool",
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
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    },
    "execution": {
      "taskSupport": "forbidden"
    }
  },
  {
    "name": "models_get_pricing",
    "title": "Get model pricing",
    "description": "The full price of one model in rubles — the authoritative answer to \"what does this cost\".\n\nPrefer this over the pricing embedded in models_list and models_search whenever the model is not billed per token. Those two return \"0.00\" token rates for such models; only this tool returns `perUnit`, where the real price per image, per second or per thousand characters lives.\n\nFor speech models it also lists the voices speech_create accepts (`supportedVoices`), for video models the durations, resolutions and aspect ratios video_create accepts (`video`).\n\nErrors with InvalidParams if the model id is unknown or the model is no longer active.",
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
        },
        "supportedVoices": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Speech models only: voice names to pass as `voice` to speech_create. Absent when the model has no list."
        },
        "video": {
          "type": "object",
          "properties": {
            "durations": {
              "type": "array",
              "items": {
                "type": "number"
              },
              "description": "Allowed `duration` values in seconds. Empty when the model does not take this parameter."
            },
            "resolutions": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Allowed `resolution` values, e.g. \"720p\". Empty when not selectable."
            },
            "aspectRatios": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Allowed `aspect_ratio` values, e.g. \"16:9\". Empty when not selectable."
            },
            "generateAudio": {
              "type": "boolean",
              "description": "Whether `generate_audio` is available on this model."
            },
            "seed": {
              "type": "boolean",
              "description": "Whether `seed` is available on this model."
            }
          },
          "required": [
            "durations",
            "resolutions",
            "aspectRatios",
            "generateAudio",
            "seed"
          ],
          "additionalProperties": false,
          "description": "Video models only: the values video_create accepts for this model."
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
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    },
    "execution": {
      "taskSupport": "forbidden"
    }
  },
  {
    "name": "balance_get",
    "title": "Get account balance",
    "description": "Current balance of the Hubris account the API key belongs to, in rubles.\n\nWorth checking before a long or expensive run: requests are refused once the balance is spent. The balance can go slightly negative — one operation is allowed to overdraw it, and the next one is refused.\n\nTwo representations of the same number come back. Use `balanceKopecks` for arithmetic and comparisons — it is an exact integer string. Use `balanceRub` for display.",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "$schema": "http://json-schema.org/draft-07/schema#"
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
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    },
    "execution": {
      "taskSupport": "forbidden"
    }
  },
  {
    "name": "chat_complete",
    "title": "Chat completion",
    "description": "Run a chat completion on any model in the Hubris catalogue and get the answer back. Full parity with POST /v1/chat/completions — same request shape, same response shape, including tool calls, structured output and reasoning. Streaming is not available here: MCP tool calls are synchronous, and `stream` is ignored if you pass it.\n\nThis is how you reach a model you cannot reach otherwise — pick an id with models_search, then call it here. Useful for delegating a subtask to a cheaper or a stronger model than the one you are running on.\n\nChat models that draw (Gemini Image, GPT-5 Image) take modalities [\"image\",\"text\"]; their pictures come back as image content next to the JSON. Voice answers of audio models need streaming and are available through the HTTP API only.\n\nThe call spends real money from the account balance: it is billed per token at the catalogue price, in rubles. balance_get shows what is left.",
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
        "modalities": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "text",
              "image"
            ]
          },
          "description": "[\"image\",\"text\"] on chat models that draw (Gemini Image, GPT-5 Image): the pictures come back as image content."
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
  },
  {
    "name": "embeddings_create",
    "title": "Create embeddings",
    "description": "Turn text into embedding vectors with any embedding model in the Hubris catalogue — for semantic search, RAG, deduplication and clustering. Same as POST /v1/embeddings, OpenAI shape: data[i].embedding is the vector for input[i].\n\nPass a list of strings to embed a batch in one call, which is faster and cheaper than one call per string. Vectors are long: 1536 numbers make about 30 KB of JSON, and the whole answer lands in your context. Embed only what you will actually store or compare, use `dimensions` where the model allows it, and send large batches through the HTTP API (POST /v1/embeddings).\n\nSpends money from the account balance: billed per input token. usage.cost_rub is what this call cost.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "model": {
          "type": "string",
          "description": "Model id from the catalogue, vendor included and matched exactly, e.g. \"openai/text-embedding-3-small\". Find one with models_search and tool: \"embeddings_create\"."
        },
        "input": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "array",
              "items": {
                "type": "string"
              },
              "minItems": 1,
              "maxItems": 16
            }
          ],
          "description": "Text to embed: one string, or a list of up to 16 strings embedded in one call."
        },
        "dimensions": {
          "type": "integer",
          "exclusiveMinimum": 0,
          "description": "Shorter vectors, only on models that support it (openai/text-embedding-3-*). Leave out otherwise."
        }
      },
      "required": [
        "model",
        "input"
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
  },
  {
    "name": "rerank",
    "title": "Rerank documents",
    "description": "Order documents by how well they answer a query, best first, with a relevance score each. Same as POST /v1/rerank. Typical use: a vector or keyword search finds 50–100 candidates, rerank picks the few that really answer the question, and only those go to the model — answers get more accurate and prompts shorter.\n\nresults[].index points into the documents list you sent. Scores are comparable only within one response.\n\nSpends money from the account balance: Cohere models are billed per search (up to 100 documents), the rest per input token. usage.cost_rub is what this call cost.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "model": {
          "type": "string",
          "description": "Model id from the catalogue, vendor included and matched exactly, e.g. \"cohere/rerank-v3.5\". Find one with models_search and tool: \"rerank\"."
        },
        "query": {
          "type": "string",
          "minLength": 1,
          "description": "The question or search query to rank the documents against."
        },
        "documents": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "minItems": 1,
          "maxItems": 1000,
          "description": "Candidate documents as plain text, 1 to 1000 of them. Their order in the answer is by relevance."
        },
        "top_n": {
          "type": "integer",
          "exclusiveMinimum": 0,
          "description": "Return only this many best documents. Leave out to get all of them, ranked."
        }
      },
      "required": [
        "model",
        "query",
        "documents"
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
  },
  {
    "name": "decisions_ask",
    "title": "Ask a decision model",
    "description": "Ask a decision model (Jev, Clef, Mercury Decide and others) structured questions about some data and get probabilities instead of text. Same as POST /v1/decisions. Question types: \"noul\" — yes or no, answered as the probability of yes; \"choice\" — one option out of criteria; \"score\" — a level on the scale given in criteria. All questions are answered in one call.\n\nGood for classification, routing and triage where you need a calibrated number rather than prose — and much cheaper than asking a chat model.\n\nSpends money from the account balance: billed per input token only. usage.cost_rub is what this call cost.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "model": {
          "type": "string",
          "description": "Model id from the catalogue, vendor included and matched exactly, e.g. \"typesafe/jev-1.13\". Find one with models_search and tool: \"decisions_ask\"."
        },
        "state": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "object",
              "additionalProperties": {}
            },
            {
              "type": "array",
              "items": {}
            }
          ],
          "description": "The data the questions are about: a string, an object or an array."
        },
        "questions": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "additionalProperties": {}
          },
          "description": "Questions by key, e.g. {\"urgent\": {\"type\": \"noul\", \"instructions\": \"Is this urgent?\"}, \"team\": {\"type\": \"choice\", \"instructions\": \"Which team?\", \"criteria\": {\"billing\": \"Payments\", \"tech\": \"Outages\"}}}. \"score\" takes criteria as an array of level descriptions. Each key comes back in answers."
        }
      },
      "required": [
        "model",
        "state",
        "questions"
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
  },
  {
    "name": "image_generate",
    "title": "Generate an image",
    "description": "Draw an image from a text description with an image model from the Hubris catalogue (FLUX, Recraft, Seedream, GPT Image and others) and get the picture back right away as image content. Same as POST /v1/images/generations.\n\nOnly models whose `tool` is \"image_generate\" work here. Models that draw inside a chat answer and also write text (Gemini Image, GPT-5 Image) have tool \"chat_complete\" and run there. Sizes such as 4K can be heavier than your client accepts in one answer — ask for 2K or less here.\n\nSpends money from the account balance: most image models are billed per image, some per megapixel or per token — models_get_pricing shows the price before you call. The charge shows up in usage_get.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "model": {
          "type": "string",
          "description": "Image model id, vendor included and matched exactly, e.g. \"black-forest-labs/flux.2-pro\". Find one with models_search and tool: \"image_generate\"."
        },
        "prompt": {
          "type": "string",
          "minLength": 1,
          "description": "What to draw. Be specific about subject, style and composition."
        },
        "n": {
          "type": "integer",
          "minimum": 1,
          "maximum": 2,
          "description": "How many images to draw, 1 or 2. Each one is billed. Defaults to 1."
        },
        "size": {
          "type": "string",
          "description": "Image size such as \"1024x1024\", or a tier such as \"2K\" on models that use tiers. Leave out for the model default."
        }
      },
      "required": [
        "model",
        "prompt"
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
  },
  {
    "name": "speech_create",
    "title": "Text to speech",
    "description": "Read text aloud with a text-to-speech model from the Hubris catalogue and get the audio file back as audio content. Same as POST /v1/audio/speech.\n\nMany models need a voice: the list of voices is on the model card (models_get_pricing → supportedVoices) — pick one from there. The answer is mp3 unless you ask for pcm. Up to 5 000 characters per call, a few minutes of speech; split longer texts or use the HTTP API (POST /v1/audio/speech).\n\nSpends money from the account balance: priced per character of text or per second of audio, depending on the model — models_get_pricing shows which. The charge shows up in usage_get.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "model": {
          "type": "string",
          "description": "Speech model id, vendor included and matched exactly, e.g. \"microsoft/mai-voice-2-flash\". Find one with models_search and tool: \"speech_create\"."
        },
        "input": {
          "type": "string",
          "minLength": 1,
          "maxLength": 5000,
          "description": "Text to read aloud, up to 5 000 characters."
        },
        "voice": {
          "type": "string",
          "description": "Voice name from the model card. Required when the model has a list of voices."
        },
        "response_format": {
          "type": "string",
          "enum": [
            "mp3",
            "pcm"
          ],
          "description": "Audio format: \"mp3\" (default here, plays everywhere) or \"pcm\" (raw 16-bit samples)."
        }
      },
      "required": [
        "model",
        "input"
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
  },
  {
    "name": "transcription_create",
    "title": "Speech to text",
    "description": "Transcribe a recording to text with a speech recognition model from the Hubris catalogue (Whisper, GPT-4o Transcribe, Deepgram, ElevenLabs Scribe and others). Same as POST /v1/audio/transcriptions with the audio sent as base64.\n\nPass the file content itself, base64-encoded — links to files are not accepted. Every byte of the recording is written out inside this call, so it suits clips of seconds, not minutes; send longer recordings through the HTTP API (POST /v1/audio/transcriptions).\n\nSpends money from the account balance: most models are billed per second or minute of audio, some per token. usage.cost_rub is what this call cost.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "model": {
          "type": "string",
          "description": "Recognition model id, vendor included and matched exactly, e.g. \"openai/whisper-1\". Find one with models_search and tool: \"transcription_create\"."
        },
        "audio_base64": {
          "type": "string",
          "minLength": 1,
          "description": "The recording, base64-encoded, without a \"data:\" prefix."
        },
        "format": {
          "type": "string",
          "minLength": 1,
          "description": "Audio format of the recording: wav, mp3, flac, m4a, ogg, webm or aac."
        },
        "language": {
          "type": "string",
          "description": "Language of the speech as an ISO-639-1 code, e.g. \"ru\". Helps accuracy; leave out to detect it automatically."
        }
      },
      "required": [
        "model",
        "audio_base64",
        "format"
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
  },
  {
    "name": "video_create",
    "title": "Start a video generation",
    "description": "Start generating a video from a text prompt with a video model from the Hubris catalogue (Veo, Kling, Seedance, Wan, Hailuo, Runway and others). Same as POST /v1/videos. Generation takes from one to several minutes, so this returns a task id right away; poll video_get with it every 15–30 seconds until status is \"completed\" or \"failed\".\n\nAllowed durations, resolutions and aspect ratios differ per model — models_get_pricing lists them under `video`. This tool takes a text prompt only: starting from images or a source video, and models that need a source — video editing, upscaling and talking avatars (FLUX Video Edit, FLUX Video Upscale, Runway Aleph, HeyGen Avatar) — work through the HTTP API (POST /v1/videos).\n\nConnected through OAuth (Claude, Cursor, VS Code)? Video needs the permission to create videos on the consent screen. If this tool answers that videos:write is missing, reconnect.\n\nSpends money from the account balance: priced per second of video. The largest possible cost is held when the task starts, the actual cost is charged when it completes and the difference is returned; a failed generation returns the whole hold.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "model": {
          "type": "string",
          "description": "Video model id, vendor included and matched exactly, e.g. \"kwaivgi/kling-v3.0-pro\". Find one with models_search and tool: \"video_create\"."
        },
        "prompt": {
          "type": "string",
          "minLength": 1,
          "maxLength": 50000,
          "description": "What should happen in the video: subject, action, camera, style."
        },
        "duration": {
          "type": "integer",
          "minimum": 1,
          "maximum": 60,
          "description": "Length in seconds, from the values the model supports."
        },
        "resolution": {
          "type": "string",
          "description": "Resolution such as \"720p\" or \"1080p\", from the values the model supports."
        },
        "aspect_ratio": {
          "type": "string",
          "description": "Frame shape such as \"16:9\" or \"9:16\", from the values the model supports."
        },
        "generate_audio": {
          "type": "boolean",
          "description": "Generate a soundtrack, on models that can. Usually costs more per second."
        },
        "seed": {
          "type": "integer",
          "description": "Fixed seed for a repeatable result, on models that support it."
        },
        "idempotency_key": {
          "type": "string",
          "maxLength": 255,
          "description": "Your own unique string for this request. Repeating the call with the same key returns the same task instead of starting and paying for a second one."
        }
      },
      "required": [
        "model",
        "prompt"
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
  },
  {
    "name": "video_get",
    "title": "Check a video generation",
    "description": "Status of a video task started with video_create: \"pending\", \"in_progress\", \"completed\" or \"failed\". Same as GET /v1/videos/{id}.\n\nWhile the video is being made, usage.estimated_cost is the amount held on the balance. Once it is \"completed\", usage.cost is the final price and the answer carries a link to the video file as an MCP resource (video/mp4) — read that resource to get the video itself. The file is kept for 72 hours. Files over 25 MB are not served as a resource; download those over HTTP (GET /v1/videos/{id}/content) with the same key.\n\nFree to call: it only reads the task. Poll every 15–30 seconds, not more often.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid",
          "description": "Task id returned by video_create."
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "Task id."
        },
        "status": {
          "type": "string",
          "enum": [
            "pending",
            "in_progress",
            "completed",
            "failed"
          ],
          "description": "\"pending\" and \"in_progress\" — keep polling; \"completed\" — the video is ready; \"failed\" — the hold is returned."
        },
        "created": {
          "type": "integer",
          "description": "When the task was started, Unix seconds."
        },
        "unsigned_urls": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "HTTP download links for the finished video; they need the same Bearer key. The MCP resource link in the answer needs nothing extra."
        },
        "usage": {
          "type": "object",
          "properties": {
            "cost": {
              "type": "number",
              "description": "Final price in kopecks, once completed."
            },
            "estimated_cost": {
              "type": "number",
              "description": "Amount held on the balance while the video is being made, in kopecks."
            }
          },
          "additionalProperties": false,
          "description": "Money: the hold while in progress, the final price once completed."
        },
        "error": {
          "type": "string",
          "description": "Why the generation failed, when status is \"failed\"."
        }
      },
      "required": [
        "id",
        "status",
        "created"
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
    }
  },
  {
    "name": "youtube_transcribe",
    "title": "Transcribe a YouTube video",
    "description": "Transcript or summary of a YouTube video by its link. Same as POST /v1/video/transcriptions. The video is checked before any model is called: a deleted, private or link-only video, a live stream and a video longer than four hours are refused without charge.\n\nmode \"exact\" gives a word-for-word transcript, each line with an [HH:MM:SS] timecode, optionally labelled by speaker. mode \"fast\" gives a summary with key points and rough timecodes — several times faster and cheaper on long videos. An hour-long video in \"exact\" takes several minutes, which may exceed your client's tool timeout; prefer \"fast\" there.\n\nSpends money from the account balance: billed per token of the model doing the work. usage.cost_rub is what this call cost.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "url": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2000,
          "description": "Link to the YouTube video, e.g. \"https://youtu.be/ITL6WqcV6sE\"."
        },
        "mode": {
          "type": "string",
          "enum": [
            "exact",
            "fast"
          ],
          "description": "\"exact\" — word-for-word transcript with timecodes (default); \"fast\" — summary with key points."
        },
        "diarize": {
          "type": "boolean",
          "description": "With mode \"exact\": label lines by speaker (\"Speaker 1:\", or by name when it is said in the video)."
        }
      },
      "required": [
        "url"
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
  },
  {
    "name": "usage_get",
    "title": "Get spending for a period",
    "description": "What this connection has spent over a period: requests, tokens, cache savings and the total in rubles. Same as GET /v1/usage. With an API key that is the key's spending; connected through OAuth, it is the spending of the whole app connection over the period, not just of the current hourly token.\n\nUse it to report what a run cost, to check spending against a budget, or to see the charge of tools that do not return their own price (image_generate, speech_create). balance_get shows what is left on the account.\n\nFree to call: it only reads.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "period": {
          "type": "string",
          "enum": [
            "today",
            "24h",
            "7d",
            "30d",
            "mtd"
          ],
          "description": "Period: \"today\", \"24h\" (default), \"7d\", \"30d\" or \"mtd\" — month to date. All times in UTC."
        }
      },
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "object": {
          "type": "string",
          "const": "usage"
        },
        "period": {
          "type": "object",
          "properties": {
            "from": {
              "type": "string",
              "format": "date-time"
            },
            "to": {
              "type": "string",
              "format": "date-time"
            },
            "shortcut": {
              "anyOf": [
                {
                  "type": "string",
                  "enum": [
                    "today",
                    "24h",
                    "7d",
                    "30d",
                    "mtd"
                  ]
                },
                {
                  "type": "null"
                }
              ]
            }
          },
          "required": [
            "from",
            "to",
            "shortcut"
          ],
          "additionalProperties": false
        },
        "scope": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "key_id": {
                  "type": "string",
                  "format": "uuid"
                },
                "key_prefix": {
                  "type": "string"
                }
              },
              "required": [
                "key_id",
                "key_prefix"
              ],
              "additionalProperties": false
            },
            {
              "type": "object",
              "properties": {
                "account": {
                  "type": "boolean",
                  "const": true
                },
                "key_id": {
                  "anyOf": [
                    {
                      "type": "string",
                      "format": "uuid"
                    },
                    {
                      "type": "null"
                    }
                  ]
                }
              },
              "required": [
                "account",
                "key_id"
              ],
              "additionalProperties": false
            }
          ]
        },
        "totals": {
          "type": "object",
          "properties": {
            "requests": {
              "type": "integer",
              "minimum": 0
            },
            "prompt_tokens": {
              "type": "integer",
              "minimum": 0
            },
            "completion_tokens": {
              "type": "integer",
              "minimum": 0
            },
            "total_tokens": {
              "type": "integer",
              "minimum": 0
            },
            "cost_rub": {
              "type": "number"
            },
            "cost_kopecks": {
              "type": "string"
            },
            "cache_read_tokens": {
              "type": "integer"
            },
            "cache_write_tokens": {
              "type": "integer"
            },
            "reasoning_tokens": {
              "type": "integer"
            },
            "cache_hit_rate": {
              "type": "number"
            },
            "cache_savings_kopecks": {
              "type": "string"
            },
            "cache_savings_rub": {
              "type": "number"
            }
          },
          "required": [
            "requests",
            "prompt_tokens",
            "completion_tokens",
            "total_tokens",
            "cost_rub",
            "cost_kopecks",
            "cache_read_tokens",
            "cache_write_tokens",
            "reasoning_tokens",
            "cache_hit_rate",
            "cache_savings_kopecks",
            "cache_savings_rub"
          ],
          "additionalProperties": false
        },
        "granularity": {
          "anyOf": [
            {
              "type": "string",
              "enum": [
                "hour",
                "day"
              ]
            },
            {
              "type": "null"
            }
          ]
        },
        "buckets": {
          "anyOf": [
            {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "bucket": {
                    "type": "string",
                    "format": "date-time"
                  },
                  "cost_rub": {
                    "type": "number"
                  },
                  "cost_kopecks": {
                    "type": "string"
                  },
                  "requests": {
                    "type": "integer",
                    "minimum": 0
                  }
                },
                "required": [
                  "bucket",
                  "cost_rub",
                  "cost_kopecks",
                  "requests"
                ],
                "additionalProperties": false
              }
            },
            {
              "type": "null"
            }
          ]
        },
        "by_key": {
          "anyOf": [
            {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "key_id": {
                    "anyOf": [
                      {
                        "type": "string",
                        "format": "uuid"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  },
                  "key_prefix": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "name": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "requests": {
                    "type": "integer",
                    "minimum": 0
                  },
                  "total_tokens": {
                    "type": "integer",
                    "minimum": 0
                  },
                  "cost_kopecks": {
                    "type": "string"
                  }
                },
                "required": [
                  "key_id",
                  "key_prefix",
                  "name",
                  "requests",
                  "total_tokens",
                  "cost_kopecks"
                ],
                "additionalProperties": false
              }
            },
            {
              "type": "null"
            }
          ]
        },
        "by_model": {
          "anyOf": [
            {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "model": {
                    "type": "string"
                  },
                  "requests": {
                    "type": "integer",
                    "minimum": 0
                  },
                  "prompt_tokens": {
                    "type": "integer",
                    "minimum": 0
                  },
                  "completion_tokens": {
                    "type": "integer",
                    "minimum": 0
                  },
                  "cost_kopecks": {
                    "type": "string"
                  }
                },
                "required": [
                  "model",
                  "requests",
                  "prompt_tokens",
                  "completion_tokens",
                  "cost_kopecks"
                ],
                "additionalProperties": false
              }
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "object",
        "period",
        "scope",
        "totals",
        "granularity",
        "buckets"
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
    }
  }
];
