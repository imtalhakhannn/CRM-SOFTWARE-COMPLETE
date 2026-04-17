# syntax=docker/dockerfile:1.7
# ---------- build ----------
FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
# Build-time default — can be overridden by passing --build-arg VITE_API_URL=... to docker build
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---------- runtime ----------
FROM nginx:1.27-alpine AS runtime

# Install bash for the entrypoint script
RUN apk add --no-cache bash

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.d/40-api-url.sh
RUN chmod +x /docker-entrypoint.d/40-api-url.sh

EXPOSE 80

# nginx:alpine ships with an entrypoint that runs /docker-entrypoint.d/*.sh then starts nginx
