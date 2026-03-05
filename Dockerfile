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
COPY package.json bun.lock ./
RUN bun install --prod --frozen-lockfile
COPY --from=build /app/dist ./dist
# Copy ejs templates as they are not copied by tsc
COPY --from=build /app/src/app/utils/templates ./dist/app/utils/templates
EXPOSE 5000
CMD ["bun", "dist/server.js"]
