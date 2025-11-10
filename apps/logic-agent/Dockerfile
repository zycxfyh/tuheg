# Logic Agent Dockerfile
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /app

# Copy package files
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ../../nx.json ./
COPY ../../packages/common-backend/package.json ./packages/common-backend/
COPY ./package.json ./apps/logic-agent/

# Install dependencies
RUN pnpm install

# Install NestJS CLI globally for building
RUN npm install -g @nestjs/cli

# Copy source code
COPY packages/common-backend ./packages/common-backend/
COPY tsconfig*.json ./
COPY apps/logic-agent/src ./apps/logic-agent/src/
COPY apps/logic-agent/tsconfig*.json ./apps/logic-agent/

# Build the application
RUN cd apps/logic-agent && npm run build

# Production stage
FROM node:20-alpine AS production

# Install pnpm and curl for health checks
RUN npm install -g pnpm@8.15.0 && apk add --no-cache curl

WORKDIR /app

# Copy built application and dependencies
COPY --from=base /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=base /app/packages/common-backend/package.json ./packages/common-backend/
COPY --from=base /app/packages/common-backend/dist ./packages/common-backend/dist/
COPY --from=base /app/apps/logic-agent/package.json ./apps/logic-agent/
COPY --from=base /app/dist/apps/logic-agent ./apps/logic-agent/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Environment variables
ENV NODE_ENV=production
ENV LOGIC_AGENT_HTTP_PORT=8081

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8081/api/v1/logic/health || exit 1

# Start application
CMD ["pnpm", "nx", "serve", "logic-agent", "--prod"]
