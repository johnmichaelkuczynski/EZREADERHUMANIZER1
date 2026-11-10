# Environment variables

Set these in Coolify's application environment. Do not commit secret values.

## Required for production startup

| Variable | Expected value | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL, such as `postgresql://user:password@host:5432/database` | Persistent visitor counts and PostgreSQL access. The database must be reachable from the app container. |
| `PUBLIC_BASE_URL` | Public HTTPS origin, such as `https://reader.example.com` (no path required) | Canonical URLs, sitemap, and robots.txt. Set this to the domain served through Traefik. |
| `SESSION_SECRET` | Random secret, at least 32 characters | Signs the anonymous visitor cookie. Keep it stable across restarts. |

The app has no login or Express session middleware. `SESSION_SECRET` is used for signed visitor IDs, not user authentication.

## Optional integrations

The server starts without these values. The feature that uses a missing integration key will be unavailable until it is configured.

| Variable | Expected value | Used for |
| --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI API key | OpenAI text processing, transcription, and fallback |
| `OPENAI_API_KEY_ENV_VAR` | OpenAI API key | Legacy alternate OpenAI key used by the unused provider service |
| `ANTHROPIC_API_KEY` | Anthropic API key | Anthropic text processing |
| `DEEPSEEK_API_KEY` | DeepSeek API key | DeepSeek text processing |
| `DEEPSEEK_API_KEY_ENV_VAR` | DeepSeek API key | Legacy alternate DeepSeek key used by the unused provider service |
| `PERPLEXITY_API_KEY` | Perplexity API key | Perplexity text processing |
| `GPTZERO_API_KEY` | GPTZero API key | AI-text detection fallback |
| `SENDGRID_API_KEY` | SendGrid API key | Sending documents by email |
| `GOOGLE_API_KEY` | Google API key | Google Programmable Search |
| `GOOGLE_SEARCH_ENGINE_ID` | Programmable Search Engine ID | Google Programmable Search |
| `GOOGLE_CLOUD_VISION_KEY` | Google Cloud Vision API key | Image OCR |
| `MATHPIX_APP_ID` | Mathpix application ID | Math OCR |
| `MATHPIX_API_KEY` | Mathpix API key | Math OCR |
| `GLADIA_API_KEY` | Gladia API key | Audio transcription |
| `AZURE_OPENAI_KEY` | Azure OpenAI API key | Azure math processing |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI resource endpoint URL | Azure math processing |

## Runtime

| Variable | Expected value | Purpose |
| --- | --- | --- |
| `PORT` | TCP port number; defaults to `5000` | HTTP listener inside the container. |
| `NODE_ENV` | `production` in Coolify | Enables production behavior. The Docker image sets this automatically. |
| `PUPPETEER_SKIP_DOWNLOAD` | `true` | Set by the Dockerfile before dependency installation to skip Puppeteer's browser download. No app feature currently launches Puppeteer. |

## Coolify configuration

- Select the Dockerfile build pack, use the root `Dockerfile`, and select `linux/arm64` (or build on an ARM64 server).
- Route Traefik to the container's HTTP port `5000`. Terminate HTTPS at Traefik; the app trusts one reverse proxy.
- Supply all three required production variables above as runtime variables, not build arguments. API keys are runtime variables too.
- The image builds without database credentials or provider keys.
- For a new PostgreSQL database, initialize the schema with `npm run db:push` against the target `DATABASE_URL` before using database-backed features. Review proposed schema changes first if the database already contains data.
- There are no OAuth callbacks or login/session redirects to configure.
- Health check: `GET /api/health` returns HTTP 200. Public page check: `GET /` returns HTTP 200.
