FROM node:24-bookworm-slim AS deps

WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm install

FROM node:24-bookworm-slim AS dev

WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ .
RUN npx prisma generate
EXPOSE 5000
CMD ["npm", "run", "dev"]

FROM node:24-bookworm-slim AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY shared/ /shared
COPY backend/ .
RUN ls -la prisma/
RUN npx prisma generate --schema=prisma/schema.prisma 2>&1
RUN npm run build 2>&1

FROM node:24-bookworm-slim AS runner

RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
EXPOSE 5000
CMD ["node", "dist/server.js"]
