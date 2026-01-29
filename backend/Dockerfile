# Multi-stage Dockerfile for NestJS Backend

# ============================================
# Base Stage - Common dependencies
# ============================================
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# ============================================
# Development Stage
# ============================================
FROM base AS development

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 5200

# Start in development mode with hot reload
CMD ["dumb-init", "npm", "run", "start:dev"]

# ============================================
# Builder Stage - Compile TypeScript
# ============================================
FROM base AS builder

# Install all dependencies (needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# ============================================
# Production Stage
# ============================================
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Copy production dependencies from builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application from builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy .env.example as reference (actual .env should be provided at runtime)
COPY --chown=nestjs:nodejs src/.env.example ./src/.env.example

# Create data directory with proper permissions
RUN mkdir -p /app/data && chown -R nestjs:nodejs /app/data

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 5200

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5200', (r) => {process.exit(r.statusCode === 404 ? 0 : 1)})"

# Start the application
CMD ["dumb-init", "node", "dist/main"]
