# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: deps - Cài đặt dependencies production lẫn dev bằng pnpm
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

WORKDIR /app

# Copy lockfile & manifest trước để tận dụng Docker layer cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Cài toàn bộ dependencies (cần dev để build)
RUN pnpm install --frozen-lockfile

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: builder - Build Next.js app với output standalone
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Biến môi trường build time (chỉ các giá trị không nhạy cảm)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: runner - Image production siêu nhẹ (chỉ dùng standalone output)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Tạo user không có quyền root để chạy app (bảo mật production)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static files & standalone server
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Next.js standalone server.js
CMD ["node", "server.js"]
