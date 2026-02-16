# ============================
# DJ Rotation App - Dockerfile
# ============================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (including better-sqlite3 native build)
RUN npm install --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Image metadata
LABEL org.opencontainers.image.title="DJ Helper"
LABEL org.opencontainers.image.description="DJ Rotation App"
LABEL org.opencontainers.image.source="https://github.com/BorisHenne/dj-helper"

# Install sqlite3 for backup operations
RUN apk add --no-cache sqlite

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user with home directory
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --home /home/nextjs nextjs

# Copy necessary files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copy Drizzle config and schema
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/db ./src/db

# Copy database files (schema, migrations, seed data)
COPY --from=builder --chown=nextjs:nodejs /app/database ./database

# Copy scripts
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
RUN chmod +x /app/scripts/*.sh

# Copy node_modules for runtime (better-sqlite3, drizzle-orm, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create data and backup directories with correct permissions
RUN mkdir -p /app/database/data /app/backups && chown -R nextjs:nodejs /app/database /app/backups

# Allow nextjs user to use cron
RUN echo "nextjs" >> /etc/cron.allow 2>/dev/null || true

USER nextjs

# Set home directory for npm
ENV HOME /home/nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Use entrypoint script for initialization
CMD ["/app/scripts/entrypoint.sh"]
