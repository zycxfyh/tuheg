# Multi-stage build for Creation Ring
FROM node:18-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Stage 1: Install dependencies
FROM base AS deps
RUN pnpm install --frozen-lockfile

# Stage 2: Build application
FROM deps AS builder
COPY . .
RUN pnpm run build

# Stage 3: Production image
FROM node:18-alpine AS runner

# Install pnpm in production image
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 creation-ring

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=creation-ring:nodejs /app/dist ./dist
COPY --from=builder --chown=creation-ring:nodejs /app/package.json ./
COPY --from=builder --chown=creation-ring:nodejs /app/pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Switch to non-root user
USER creation-ring

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["pnpm", "start"]