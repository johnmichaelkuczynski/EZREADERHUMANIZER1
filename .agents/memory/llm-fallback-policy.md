---
name: Silent LLM fallback policy
description: Product rule for provider ordering and user-visible failure behavior across ZHI AI operations.
---

Provider-selectable AI operations must try the user's selected ZHI provider first, then silently try every remaining ZHI provider until one succeeds. Empty or malformed provider output counts as a failure and must continue the chain. AI detection may use GPTZero only after the ZHI chain is exhausted.

**Why:** The product must remain usable when any individual provider or credential fails, without exposing provider names, API errors, fallback activity, or terminal availability errors to end users.

**How to apply:** Route all new provider-selectable generation, chat, homework, rewrite, chunk, and detection operations through the shared fallback policy. Keep fallback diagnostics in server logs only and suppress aggregate provider-unavailable errors in user-facing UI.