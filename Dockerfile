# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_DEFAULT_BOT_ID
ENV VITE_DEFAULT_BOT_ID=${VITE_DEFAULT_BOT_ID}

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY server ./server

EXPOSE 3000

CMD ["node", "server/index.js"]
