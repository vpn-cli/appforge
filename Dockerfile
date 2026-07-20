# Stage 1: Base image
FROM node:20-alpine AS base
WORKDIR /app
# Install core build dependencies
RUN apk add --no-cache libc6-compat

# Stage 2: Install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
# We forcefully install using legacy-peer-deps to natively support React 19 overrides
RUN npm ci --legacy-peer-deps

# Stage 3: Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Temporarily disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Supply simulated build-time environment variables so Next.js static prerendering (Clerk) doesn't crash the container execution
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmsuYXBwZm9yZ2UuY29tJA==
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_INSFORGE_URL=https://dummy.supabase.co
ENV NEXT_PUBLIC_INSFORGE_URL=$NEXT_PUBLIC_INSFORGE_URL
ARG NEXT_PUBLIC_INSFORGE_ANON_KEY=dummy
ENV NEXT_PUBLIC_INSFORGE_ANON_KEY=$NEXT_PUBLIC_INSFORGE_ANON_KEY

RUN npm run build

# Stage 4: Production server (Standalone)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Secure the container natively by running it down-privileged
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set correct permissions
COPY --from=builder /app/public ./public

# Automatically leverage Next.js standalone output to reduce image massive weight
RUN mkdir .next
RUN chown nextjs:nodejs .next

# The standalone output dumps node_modules implicitly inside the tracer
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Note: server.js is automatically created by Next.js in the standalone trace process
CMD ["node", "server.js"]
