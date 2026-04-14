# Multi-stage Dockerfile for Next.js Frontend

# ============================================
# Base Stage - Common dependencies
# ============================================
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies needed for some node-modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# ============================================
# Development Stage
# ============================================
FROM base AS development

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Next.js development mode
CMD ["npm", "run", "dev"]

# ============================================
# Builder Stage - Compile Next.js
# ============================================
FROM base AS builder

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
# We need to set this at build time if we want to bake it into the client-side bundle
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build

# ============================================
# Production Stage
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Security: Don't run as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# If using Next.js standalone mode (optional, but good for minimal images)
# COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Note: The 'start' script usually runs 'next start'
CMD ["npm", "run", "start"]
