FROM node:22-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

FROM base AS builder

ENV NODE_ENV=development

COPY package*.json ./

RUN npm ci

COPY prisma ./prisma

RUN npm run prisma:generate

COPY . .

RUN npm run build

FROM base AS runner

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY prisma ./prisma

RUN npm run prisma:generate

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
