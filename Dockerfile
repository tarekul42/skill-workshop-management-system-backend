# Stage 1: Build
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Stage 2: Production
FROM oven/bun:1-slim
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=1024

# Update and upgrade OS-level packages
RUN apt-get update && apt-get upgrade -y && apt-get clean && rm -rf /var/lib/apt/lists/*

# Switch to non-root user early
# Ensure the app directory is owned by the bun user
RUN chown -R bun:bun /app
USER bun

# Copy package files with correct ownership
COPY --chown=bun:bun package.json bun.lock ./

# Install production dependencies
RUN bun install --prod

# Copy built application and templates with correct ownership
COPY --chown=bun:bun --from=build /app/dist ./dist
COPY --chown=bun:bun --from=build /app/src/app/utils/templates ./dist/app/utils/templates

EXPOSE 5000
CMD ["bun", "dist/server.js"]
