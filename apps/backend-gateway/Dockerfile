# Backend Gateway Dockerfile
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /app

# Copy package files
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ../../nx.json ./
COPY ../../packages/common-backend/package.json ./packages/common-backend/
COPY ./package.json ./apps/backend-gateway/

# Install dependencies
RUN pnpm install

# Install NestJS CLI globally for building
RUN npm install -g @nestjs/cli

# Copy source code
COPY packages/common-backend ./packages/common-backend/
COPY tsconfig*.json ./
COPY apps/backend-gateway/src ./apps/backend-gateway/src/
COPY apps/backend-gateway/tsconfig*.json ./apps/backend-gateway/

# Build the application
RUN cd apps/backend-gateway && npm run build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm@8.15.0

WORKDIR /app

# Copy built application and dependencies
COPY --from=base /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=base /app/packages/common-backend/package.json ./packages/common-backend/
COPY --from=base /app/packages/common-backend/dist ./packages/common-backend/dist/
COPY --from=base /app/apps/backend-gateway/package.json ./apps/backend-gateway/
COPY --from=base /app/dist/apps/backend-gateway ./apps/backend-gateway/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start application
CMD ["pnpm", "nx", "serve", "backend-gateway", "--prod"]
