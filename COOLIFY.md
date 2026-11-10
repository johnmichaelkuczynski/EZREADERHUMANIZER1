# Deploy EZ Reader with Coolify

## Source and build

- Repository: `EZREADERHUMANIZER1`.
- Branch: the branch containing the root-level `Dockerfile`.
- Build pack: **Dockerfile**.
- Base directory/build context: `/` (repository root).
- Dockerfile location: `/Dockerfile`.
- Exposed/container port: **5000**.
- Health check: HTTP GET `/api/health` on port **5000**.
- Leave custom build and start commands empty: the Dockerfile builds the app
  and starts `dist/index.js` with `NODE_ENV=production`.

The image uses Node 22 on Debian and does not pin an architecture. Build it on
the target server so npm installs the appropriate native dependencies. Native
ARM64 verification remains a separate check.

## Runtime environment variables

Enter secrets in Coolify's environment-variable settings, never in Git or as
Docker build arguments.

- `DATABASE_URL`: required at server startup. Keep the existing Neon-compatible
  database connection; the current database driver uses Neon WebSockets and
  cannot be pointed at an ordinary PostgreSQL service without a driver change.
- `SESSION_SECRET`: required for signed visitor cookies.
- `PUBLIC_SITE_URL`: the final public HTTPS origin, such as
  `https://reader.example.com`. This must match the domain configured in Coolify.
- Copy the provider keys for the features you use: `OPENAI_API_KEY`,
  `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY`, `DEEPSEEK_API_KEY`, and
  `GPTZERO_API_KEY`. Optional integrations use their existing environment
  variables, including `SENDGRID_API_KEY`, `MATHPIX_APP_ID`, `MATHPIX_API_KEY`,
  `AZURE_OPENAI_ENDPOINT`, and `AZURE_OPENAI_KEY`.

The image requires no secrets to build. Do not expose secret keys to the frontend.
This Dockerfile neither creates a database nor runs migrations automatically.

## After publishing

Confirm `/api/health`, `/`, `/gpt-bypass`, `/settings`, `/robots.txt`, and
`/sitemap.xml` respond correctly; a nonexistent route should return HTTP 404.
Check that canonical URLs and sitemap entries use the final HTTPS domain.
Submit that domain's `/sitemap.xml` in Google Search Console and Bing Webmaster
Tools after verifying ownership.

## Existing runtime constraints

Rewrite jobs currently live in memory and do not survive a container restart.
Keep one replica until job storage is made durable.

The runtime retains development dependencies because the existing server bundle
imports Vite/plugins on startup. It also includes the small PDF fixture used by
the current `pdf-parse` ESM startup behavior. These are deliberate compatibility
choices, not a development server: the container explicitly runs in production.
