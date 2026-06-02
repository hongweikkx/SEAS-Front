# ── Builder 阶段 ──
FROM node:22-alpine AS builder

WORKDIR /app

# 利用 Docker 缓存：先复制依赖文件，再安装
COPY package.json package-lock.json ./
RUN npm ci

# 复制源码
COPY . .

# 构建时注入 API 地址（通过构建参数）
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/seas/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# 构建
RUN npm run build

# ── Runtime 阶段 ──
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV HOSTNAME=0.0.0.0

# 复制 standalone 运行所需的文件
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# 暴露 80 端口
EXPOSE 80

# 运行 Next.js standalone 服务器
CMD ["node", "server.js"]
