#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Restore the exact locked dependencies without downloading a browser.
export PUPPETEER_SKIP_DOWNLOAD=true
npm ci --include=dev --no-audit --no-fund
npm run build

# Database schema changes require separate review; never push them implicitly.
