# API image - build context is city-services-portal/ (see docker-compose.yml)
FROM node:20-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/api

# Install all deps (tsx, prisma and faker are needed at runtime for seeding)
COPY api/package*.json ./
RUN npm ci

COPY api/ ./
RUN npx prisma generate

# Seed scripts read sample photos from ../../ui/images relative to prisma/
COPY ui/images /app/ui/images

COPY api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh \
    && mkdir -p /data

ENV NODE_ENV=development \
    PORT=3001 \
    DATABASE_URL=file:/data/app.db

EXPOSE 3001

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npx", "tsx", "src/server.ts"]
