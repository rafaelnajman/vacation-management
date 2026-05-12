# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder
WORKDIR /repo

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/api/package.json packages/api/

RUN npm ci

# Copy sources
COPY packages/shared packages/shared
COPY packages/api packages/api

# Build the api (compiles api + shared into packages/api/dist/)
RUN npm run build --workspace=@vacation/api

# ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy workspace root manifests
COPY --from=builder /repo/package.json /repo/package-lock.json ./

# Copy shared package manifest and its compiled output
# packages/shared/package.json exports field points to ./dist/src/index.js
COPY --from=builder /repo/packages/shared/package.json /app/packages/shared/package.json
RUN mkdir -p /app/packages/shared/dist/src
COPY --from=builder /repo/packages/api/dist/packages/shared/src /app/packages/shared/dist/src

# Copy api package manifest and compiled dist
COPY --from=builder /repo/packages/api/package.json /app/packages/api/package.json
COPY --from=builder /repo/packages/api/dist /app/packages/api/dist

# Install runtime deps only (no devDeps)
# Use root npm ci --omit=dev; workspaces will resolve correctly
RUN npm ci --omit=dev

EXPOSE 3000
WORKDIR /app/packages/api

# dist path: dist/packages/api/src/index.js  (rootDir: "../.." from packages/api)
CMD ["node", "--enable-source-maps", "dist/packages/api/src/index.js"]
