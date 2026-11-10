---
name: Clean-image startup checks
description: Why deployment readiness must be checked in the freshly installed container, not just on the workspace host.
---

Verify startup in the actual built image with only required runtime configuration, rather than treating a successful workspace launch as sufficient evidence.

**Why:** A workspace production launch succeeded while a clean npm-ci image crashed: a dependency's default entrypoint ran debug code that expected an absent test fixture. Adding that fixture would have hidden the packaging defect.

**How to apply:** Smoke-test the image's production command and public health/root endpoints without optional integration keys or workspace test files. Fix the dependency entrypoint rather than copying debug fixtures into production.
