---
name: Clean-image startup checks
description: Why deployment readiness must be checked in the freshly installed container, not just on the workspace host.
---

Verify startup in the actual built image with only required runtime configuration, rather than treating a successful workspace launch as sufficient evidence.

**Why:** A workspace production launch succeeded while a clean npm-ci image crashed: a dependency's default entrypoint ran debug code that expected an absent test fixture. Adding that fixture would have hidden the packaging defect.

**How to apply:** Smoke-test the image's production command and public health/root endpoints without optional integration keys or workspace test files. Fix the dependency entrypoint rather than copying debug fixtures into production.

Package updates in the workspace can reintroduce private registry URLs into the lockfile. Preserve public-registry portability after dependency changes.

**Why:** The workspace package installer rewrites newly resolved tarball URLs to its internal registry, which external Coolify builders cannot access.

**How to apply:** Inspect changed lockfile URLs after installs and normalize internal tarball URLs to their matching public npm URLs. If the package firewall blocks a vulnerable version, upgrade it rather than bypassing the policy.
