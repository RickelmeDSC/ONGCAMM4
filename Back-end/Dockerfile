# ── Build stage ──
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# ── Production stage ──
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Pasta de uploads
RUN mkdir -p /app/uploads

EXPOSE 3000

# Aplica migrations pendentes (se houver) antes de subir o app.
# Se a migration falhar, o container nao sobe — falha fica visivel
# em vez de virar erros silenciosos no runtime.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
