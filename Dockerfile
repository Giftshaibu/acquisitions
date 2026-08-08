# syntax=docker/dockerfile:1

FROM node:22-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM node:22-alpine AS production-dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM development AS migration
CMD ["npm", "run", "db:migrate"]

FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node src ./src
RUN mkdir -p logs && chown node:node logs
USER node
EXPOSE 3000
CMD ["npm", "run", "start"]
