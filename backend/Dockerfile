FROM node:24-bookworm-slim AS deps

WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:24-bookworm-slim AS dev

WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

FROM node:24-bookworm-slim AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:24-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
EXPOSE 5000
CMD ["node", "dist/server.js"]
