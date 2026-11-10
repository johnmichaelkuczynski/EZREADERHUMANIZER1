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

- `DATABASE_URL`: required at server startup. Use the complete connection string
  for your own external Neon database, including its SSL parameters. Use this
  exact variable name, not `NEON_DATABASE_URL`. The app uses the standard
  PostgreSQL driver and honors the connection string's SSL settings.
- `SESSION_SECRET`: required for signed visitor cookies; at least 32 characters.
- `PUBLIC_BASE_URL`: required in production; the final public HTTPS origin, such as
  `https://reader.example.com`. This must match the domain configured in Coolify.
- Copy the provider keys for the features you use: `OPENAI_API_KEY`,
  `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY`, `DEEPSEEK_API_KEY`, and
  `GPTZERO_API_KEY`. Optional integrations use their existing environment
  variables, including `SENDGRID_API_KEY`, `MATHPIX_APP_ID`, `MATHPIX_API_KEY`,
  `AZURE_OPENAI_ENDPOINT`, and `AZURE_OPENAI_KEY`.

The image requires no secrets to build. Do not expose secret keys to the frontend.
This Dockerfile does not create a database or run migrations automatically.
The database connection saved in Replit Secrets is not transferred to Coolify:
enter the same connection string securely as `DATABASE_URL` in Coolify.

## Database tables and migrations

With `DATABASE_URL` configured, run `npm run db:migrate` against your external
Neon database before starting a new installation. The container includes this
command and the versioned SQL migrations. It creates `users`, `documents`,
`rewrite_jobs`, and `visitors`, and records applied migrations so later runs
do not recreate the tables. Run only one migration process at a time.

This external database is not managed by Replit publishing. Never run a
destructive schema push to fix a migration error. New changes should use
reviewed, additive migrations. Existing records from another database or an
older in-memory server are not automatically imported.

## After publishing

Confirm `/api/health`, `/`, `/gpt-bypass`, `/settings`, `/robots.txt`, and
`/sitemap.xml` respond correctly; a nonexistent route should return HTTP 404.
Check that canonical URLs and sitemap entries use the HTTPS `PUBLIC_BASE_URL`.
Submit that domain's `/sitemap.xml` in Google Search Console and Bing Webmaster
Tools after verifying ownership.

## Existing runtime constraints

Documents, rewrite jobs, and visitors use the database configured in
`DATABASE_URL`. Saved records survive container restarts. An in-flight AI
request is not automatically resumed if its container stops; its job record
remains available, but the work itself must be retried. Keep one replica until
background job execution and recovery are coordinated.

The runtime retains development dependencies because the existing server bundle
imports Vite/plugins on startup. The container explicitly runs in production.
The PDF library's direct entrypoint avoids its package-root debug behavior, so
workspace test fixtures are not included in the image.
