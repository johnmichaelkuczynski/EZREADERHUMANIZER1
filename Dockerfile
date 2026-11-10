# syntax=docker/dockerfile:1
# Build natively on the Coolify server (including ARM64); do not pin amd64.
FROM node:22-bookworm-slim AS build

WORKDIR /app

# The application does not launch Puppeteer; avoid downloading an unused browser.
ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true

# Keep the incoming project's current package manager and registry settings.
RUN npm install --global npm@11
COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund --registry=https://registry.npmjs.org

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    PORT=5000 \
    PUPPETEER_SKIP_DOWNLOAD=true

COPY --from=build --chown=node:node /app/package.json ./package.json
# The server bundle imports Vite and its plugins at startup even in production,
# so do not prune the development dependencies until those imports are separated.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

USER node
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:5000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "dist/index.js"]
