# Stack Diagnostic & QA Report — BANK PROJECT

**Date:** 2026-03-01  
**Scope:** MCP servers, tool plugins, AI agents, model plugins, end-to-end integration

---

## 1. MCP SERVER — CONNECTION & HEALTH CHECK

### Summary
- **Status:** ✅ MCP layer is reachable and responding. Tools are invoked via Cursor’s MCP client; no standalone MCP server process runs inside the BANK PROJECT repo.
- **Configuration:** MCP servers are defined in the Cursor project (`mcps/` under the Cursor project root). Plugins enabled in `.cursor/settings.json`: deploy-on-aws, cloudflare, phantom-connect, continual-learning, cursor-team-kit, langfuse, slack, figma, vercel, clerk.

### Tests Performed
| Test | Result | Notes |
|------|--------|--------|
| Tool invocation (Figma `whoami`) | ✅ Responded | Returned resource link (auth/context may vary) |
| Tool invocation (Cloudflare Docs `search_cloudflare_documentation`) | ✅ Responded | Returns `url`, `title`, `text` doc chunks |
| Tool invocation (Cloudflare Observability `accounts_list`) | ✅ Responded | Returns `accounts` array and `count` |
| Auth/headers | N/A | Handled by Cursor; no CORS in local MCP context |

### Expected Output
- MCP tool calls return structured data (e.g. JSON-like or documented schema). Observed: Cloudflare tools return result objects; Figma returned a resource link.

---

## 2. TOOL PLUGINS — FUNCTIONAL TESTS

### Happy Path (valid inputs)
| Tool | Server | Input | Result |
|------|--------|--------|--------|
| `search_cloudflare_documentation` | plugin-cloudflare-cloudflare-docs | `{"query": "Workers"}` | ✅ Multiple doc results with url/title/text |
| `search_cloudflare_documentation` | plugin-cloudflare-cloudflare-docs | `{"query": "MCP server"}` | ✅ Relevant MCP docs returned |
| `accounts_list` | plugin-cloudflare-cloudflare-observability | `{}` | ✅ `accounts` + `count` |
| `whoami` | plugin-figma-figma | `{}` | ✅ Response (resource link) |

### Edge Cases
| Test Case | Tool | Input | Result |
|-----------|------|--------|--------|
| Empty input | `search_cloudflare_documentation` | `{"query": ""}` | ❌ Internal Error |
| Invalid type | Not sent (schema enforced by client) | — | N/A |

**Finding:** Empty string for required `query` in `search_cloudflare_documentation` causes an Internal Error. Recommendation: validate non-empty `query` in the plugin or in Cursor’s tool-call layer and return a clear error message.

### Tool Descriptions / Metadata
- Tool descriptors under `mcps/<server>/tools/*.json` include `name`, `description`, and `arguments` (JSON schema). Discoverable by the model via Cursor’s tool list.

### Timeouts / Retries
- Not configurable in-repo; handled by Cursor. For long-running tools (e.g. browser, deploy), consider documenting recommended timeout in project docs.

---

## 3. AGENTS — ORCHESTRATION & REASONING TEST

### Test Executed
- **Prompt:** Use Cloudflare MCP docs tool to search for “Model Context Protocol” and summarize in one sentence.
- **Outcome:** ✅ Subagent (generalPurpose) correctly called `search_cloudflare_documentation`, received doc chunks, and returned a coherent summary (MCP described as a standardized way for AI agents to get information and tools, with Cloudflare deployment context).

### Conclusion
- Agent selected the correct MCP tool and produced a correct, relevant response. Multi-step reasoning (call tool → read result → summarize) worked as expected.

### In-Repo “Agents”
- The BANK PROJECT app does not define its own agent config (e.g. `agents.json`). Intelligence features are implemented in `bank_system/api/routes/intelligence.py` and engines (AML, Financial Health, Portfolio). “Agents” in your stack are the Cursor AI agents that use MCP tools.

---

## 4. MODEL PLUGINS — SWITCHING & COMPATIBILITY

- **Location:** Model/provider selection (e.g. GPT-4, Claude, Gemini) is done in **Cursor IDE settings**, not in the BANK PROJECT codebase.
- **Verification:** Manually in Cursor: switch model, then send the test prompt below and confirm response format and quality.

**Test prompt to send to each model:**
> You are a helpful assistant. Explain what an MCP server is in 2 sentences.

**Checks:**
- Same prompt → each model returns a short, coherent explanation.
- System prompt (“You are a helpful assistant”) is respected.
- Streaming vs non-streaming is a Cursor UI/API option; not testable from this repo.
- Token/context limits are per-model and documented by each provider; no in-repo config to validate.
- Fallback: If one model fails, Cursor may retry or the user can switch model; no app-level fallback logic in repo.

---

## 5. END-TO-END INTEGRATION TEST

**Flow:** User prompt → Agent receives → Chooses MCP tool(s) → Tool executes → Model uses result → Response to user.

**Test run:**
1. User (implicit) asked for MCP explanation using Cloudflare docs.
2. Agent received the task and chose `search_cloudflare_documentation`.
3. Tool was invoked with query “Model Context Protocol”; Cloudflare docs returned.
4. Model processed the result and generated a two-sentence summary.
5. Response was returned successfully.

**Result:** ✅ Zero errors; output was correct and relevant. Latency was acceptable (single tool call + LLM reply).

---

## 6. DIAGNOSTICS CHECKLIST

| Component | Status | Latency | Notes |
|-----------|--------|---------|--------|
| MCP (Cursor ↔ plugins) | ✅ | ~1–3s per call | Connection OK; tools respond |
| Tool: search_cloudflare_documentation | ✅ | ~2s | Fails on empty `query` |
| Tool: accounts_list (Cloudflare Observability) | ✅ | ~1s | Returns account list |
| Tool: whoami (Figma) | ✅ | ~1s | Returns resource/auth info |
| Agent (generalPurpose / MCP orchestration) | ✅ | ~5–10s | Correct tool choice and summary |
| Model (per-provider) | ⚠️ Manual | — | Test via Cursor with shared prompt above |
| NexusBank Backend (FastAPI) | ❌ | — | Not running at test time (`/health` unreachable) |
| End-to-End (prompt → MCP → response) | ✅ | <15s | Single tool + model path verified |

---

## 7. BUG REPORTING

### BUG 1: Empty query on Cloudflare Docs search
- **Component:** Tool plugin — plugin-cloudflare-cloudflare-docs / `search_cloudflare_documentation`
- **Severity:** Medium
- **Description:** Invoking the tool with `{"query": ""}` results in “Internal Error” instead of a validation error.
- **Steps to Reproduce:** Call `search_cloudflare_documentation` with `query: ""`.
- **Expected:** HTTP 400 or a clear error message (e.g. “query must be non-empty”).
- **Actual:** Internal Error.
- **Fix Suggestion:** In the Cloudflare MCP plugin (or Cursor’s tool layer), validate `query` before calling the docs API: reject empty string and return a structured error.

### BUG 2: NexusBank backend not running during QA
- **Component:** Application — FastAPI backend
- **Severity:** Low (environment)
- **Description:** `GET http://127.0.0.1:8000/health` was unreachable during the diagnostic run.
- **Steps to Reproduce:** Start QA with backend stopped; run health check.
- **Expected:** Backend running (e.g. Docker or `uvicorn`) so `/health` returns 200.
- **Fix Suggestion:** Run backend before QA (e.g. `docker-compose up -d` or `uvicorn bank_system.main:app --reload`) or add a note in QA docs that backend must be up for app health checks.

---

## Summary

- **MCP:** Connected and working; multiple plugins (Figma, Cloudflare Docs, Cloudflare Observability) respond correctly to tool calls.
- **Tools:** Happy path passes; one edge case (empty `query`) causes an Internal Error and should be handled with validation.
- **Agents:** Orchestration test passed; agent chose the right MCP tool and produced a correct summary.
- **Models:** No in-repo model plugins; use Cursor settings and the provided test prompt for manual verification per model.
- **E2E:** Full path (prompt → MCP tool → model → response) succeeded with no errors.
- **Backend:** Not running during tests; start FastAPI (or Docker) for full app-level checks.

---

## Recommended Next Steps

1. **Fix empty-query handling** for `search_cloudflare_documentation` (plugin or client-side validation).
2. **Document backend startup** in QA or README so `/health` can be checked in future runs.
3. **Use the in-repo health script** `scripts/stack_health_check.ps1` to ping `/health` and list MCP server names (set `$env:CURSOR_MCPS_PATH` if your mcps folder is elsewhere).
4. **Model testing:** Run the MCP explanation prompt once per model in Cursor and record results in a short table (model name, response length, any errors).
5. **Concurrent tool calls:** If Cursor supports parallel MCP calls, run two independent tools (e.g. Figma whoami + Cloudflare accounts_list) and confirm both succeed and responses are not mixed.

---

## Suggested Additional Features

- **Backend health in CI:** Add a step in CI (e.g. GitHub Actions) that starts the app (or uses a pre-built image), hits `/health`, and optionally hits `/api/auth/login` or a read-only API to verify DB/Redis.
- **MCP tool allowlist for banking:** If only a subset of MCP tools should be used in banking context, document an allowlist (e.g. Cloudflare docs, Figma for UI, Slack for notifications) and add a short Cursor rule so the agent prefers those tools for this repo.
- **Structured E2E test prompt:** Add a file `docs/E2E_TEST_PROMPTS.md` with copy-paste prompts for “summarize from data source”, “search and report”, “run workflow” so anyone can re-run E2E tests consistently.
- **Model test log:** Keep a small `docs/MODEL_TEST_LOG.md` where you paste the “Explain MCP in 2 sentences” response per model and date, to track compatibility over time.
- **Rate limiting / cost:** Document or add a note about MCP/API rate limits and token usage for heavy tool use (e.g. Cloudflare, Figma) to avoid surprises.
