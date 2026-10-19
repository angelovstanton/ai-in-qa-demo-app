#!/bin/sh
set -e

DB_FILE="${DATABASE_URL#file:}"

FRESH_DB=false
if [ ! -s "$DB_FILE" ]; then
  FRESH_DB=true
fi

echo "[entrypoint] Applying database schema ($DB_FILE)..."
npx prisma db push --skip-generate --accept-data-loss

if [ "$FRESH_DB" = "true" ] || [ "$FORCE_SEED" = "true" ]; then
  echo "[entrypoint] Seeding database with demo data..."
  npx tsx prisma/seed.ts
else
  echo "[entrypoint] Existing database found - skipping seed (use reset/reseed to start over)"
fi

exec "$@"
