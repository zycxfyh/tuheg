# Narrative Agent Dockerfile
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /app

# Copy package files
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ./
COPY ../../packages/common-backend/package.json ./packages/common-backend/
COPY ./package.json ./apps/narrative-agent/

# Install dependencies
RUN pnpm install

# Copy source code
COPY packages/common-backend ./packages/common-backend/
COPY tsconfig*.json ./
COPY apps/narrative-agent/src ./apps/narrative-agent/src/
COPY apps/narrative-agent/tsconfig*.json ./apps/narrative-agent/

# Build the application
RUN npx nest build narrative-agent --webpack

# Production stage
FROM node:20-alpine AS production

# Install pnpm and curl for health checks
RUN npm install -g pnpm@8.15.0 && apk add --no-cache curl

WORKDIR /app

# Copy built application and dependencies
COPY --from=base /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=base /app/packages/common-backend/package.json ./packages/common-backend/
COPY --from=base /app/packages/common-backend/dist ./packages/common-backend/dist/
COPY --from=base /app/apps/narrative-agent/package.json ./apps/narrative-agent/
COPY --from=base /app/dist/apps/narrative-agent ./apps/narrative-agent/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Environment variables
ENV NODE_ENV=production
ENV NARRATIVE_AGENT_HTTP_PORT=8082

# Expose port
EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8082/api/v1/narrative/health || exit 1

# Start application
CMD ["pnpm", "nx", "serve", "narrative-agent", "--prod"]
