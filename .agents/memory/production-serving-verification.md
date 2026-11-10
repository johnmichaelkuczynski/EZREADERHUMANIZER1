---
name: Production serving verification
description: Why production-mode and compiled-asset checks are necessary even after publishing succeeds.
---

Do not treat a successful publish or a homepage HTTP 200 as proof that production serving mode is correct.

**Why:** The published server has returned homepage HTML from Vite before failing on a source-only module request. The successful readiness probe masked failures across SEO and API routes. Earlier production-mode tests explicitly supplied the environment, which did not prove that the actual publishing command selected that mode.

**How to apply:** Check the actual publishing startup command, not just a manually supplied test environment. Verify compiled asset delivery and multiple live routes after publishing. Scope runtime logs to the current revision; historical startup errors do not establish why a later build fails.
