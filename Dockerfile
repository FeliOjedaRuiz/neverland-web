# Stage 1: Build frontend
FROM node:20-slim AS build-stage
WORKDIR /app/web
COPY web/package*.json ./
RUN npm install
COPY web/ ./
RUN npm run build

# Stage 2: Setup backend
FROM node:20-slim
WORKDIR /app
COPY api/package*.json ./api/
RUN cd api && npm install --omit=dev

COPY api/ ./api/
COPY --from=build-stage /app/web/dist ./api/public

EXPOSE 8080
WORKDIR /app/api
CMD ["node", "app.js"]
