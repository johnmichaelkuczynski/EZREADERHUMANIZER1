# Build this image as linux/arm64 in Coolify.
FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production \
    PORT=5000 \
    PUPPETEER_SKIP_DOWNLOAD=true

# Keep the builder package manager current before installing project packages.
RUN npm install --global npm@11

# Install exactly once; dev dependencies are needed for the frontend/server build.
COPY package.json package-lock.json ./
RUN npm ci --include=dev --registry=https://registry.npmjs.org

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "run", "start"]
