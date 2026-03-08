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
ENV NODE_OPTIONS=--max-old-space-size=384

COPY package.json bun.lock ./

# Remove --frozen-lockfile to resolve potential sync issues during production install
RUN bun install --prod

COPY --from=build /app/dist ./dist
# Copy ejs templates as they are not copied by tsc
COPY --from=build /app/src/app/utils/templates ./dist/app/utils/templates
EXPOSE 5000
CMD ["bun", "dist/server.js"]
