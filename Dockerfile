# ============================
# DJ Rotation App - Dockerfile
# ============================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Runner (use Debian slim for OpenSSL compatibility)
FROM node:20-slim AS runner
WORKDIR /app

# Image metadata
LABEL org.opencontainers.image.title="DJ Helper"
LABEL org.opencontainers.image.description="DJ Rotation App"
LABEL org.opencontainers.image.source="https://github.com/BorisHenne/dj-helper"

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user with home directory
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --home /home/nextjs nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create data directory for SQLite with correct permissions
RUN mkdir -p /app/prisma/data
RUN chown -R nextjs:nodejs /app/prisma
RUN chown -R nextjs:nodejs /app/node_modules
RUN chown -R nextjs:nodejs /app/public
RUN chown -R nextjs:nodejs /home/nextjs

USER nextjs

# Set home directory for npm
ENV HOME /home/nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Initialize database, seed data, and start
CMD node node_modules/prisma/build/index.js db push && node prisma/seed.mjs && node server.js
