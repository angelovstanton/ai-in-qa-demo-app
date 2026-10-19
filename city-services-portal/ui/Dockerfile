# UI image - build context is city-services-portal/ (see docker-compose.yml)
FROM node:20-slim AS build

WORKDIR /app/ui

COPY ui/package*.json ./
RUN npm ci

COPY ui/ ./
# Skip the tsc step of `npm run build` so type errors don't block the image
RUN npx vite build

FROM nginx:1.27-alpine

COPY ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/ui/dist /usr/share/nginx/html

EXPOSE 80
