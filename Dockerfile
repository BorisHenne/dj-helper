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

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user with home directory
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --home /home/nextjs nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy Drizzle config and schema
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/db ./src/db

# Copy seed files and data
COPY --from=builder /app/prisma ./prisma

# Copy node_modules for runtime (better-sqlite3, drizzle-orm, etc.)
COPY --from=builder /app/node_modules ./node_modules

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
RUN chown -R nextjs:nodejs /app/src
RUN chown -R nextjs:nodejs /home/nextjs

USER nextjs

# Set home directory for npm
ENV HOME /home/nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Initialize database with Drizzle, seed data, and start
CMD npx drizzle-kit push && npx tsx prisma/seed.ts && node server.js
