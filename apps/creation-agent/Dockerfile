# Creation Agent Dockerfile
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /app

# Copy package files
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ../../nx.json ./
COPY ../../packages/common-backend/package.json ./packages/common-backend/
COPY ./package.json ./apps/creation-agent/

# Install dependencies
RUN pnpm install

# Install NestJS CLI globally for building
RUN npm install -g @nestjs/cli

# Copy source code
COPY packages/common-backend ./packages/common-backend/
COPY tsconfig*.json ./
COPY apps/creation-agent/src ./apps/creation-agent/src/
COPY apps/creation-agent/tsconfig*.json ./apps/creation-agent/

# Build the application
RUN cd apps/creation-agent && npm run build

# Production stage
FROM node:20-alpine AS production

# Install pnpm and curl for health checks
RUN npm install -g pnpm@8.15.0 && apk add --no-cache curl

WORKDIR /app

# Copy built application and dependencies
COPY --from=base /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=base /app/packages/common-backend/package.json ./packages/common-backend/
COPY --from=base /app/packages/common-backend/dist ./packages/common-backend/dist/
COPY --from=base /app/apps/creation-agent/package.json ./apps/creation-agent/
COPY --from=base /app/dist/apps/creation-agent ./apps/creation-agent/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Environment variables
ENV NODE_ENV=production
ENV CREATION_AGENT_HTTP_PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/v1/creation/creation-status || exit 1

# Start application
CMD ["pnpm", "nx", "serve", "creation-agent", "--prod"]
