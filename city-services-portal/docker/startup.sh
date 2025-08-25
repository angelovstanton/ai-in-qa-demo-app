#!/bin/bash

echo "?? Starting City Services Portal..."

# Navigate to API directory
cd /app/api

echo "?? Setting up database..."
# Push database schema
npx prisma db push --force-reset

echo "?? Seeding database with test data..."
# Seed the database
npm run db:seed

echo "?? Starting API server..."
# Start API server in background
npm start &

# Wait for API to be ready
echo "? Waiting for API to be ready..."
until curl -f http://localhost:3001/health 2>/dev/null; do
  echo "   Waiting for API..."
  sleep 2
done

echo "? API is ready at http://localhost:3001"
echo "?? Swagger docs available at http://localhost:3001/api-docs"

# Navigate to UI directory
cd /app/ui

echo "?? Starting UI server..."
echo "? UI will be available at http://localhost:5173"

# Start UI server (this will run in foreground)
npm run preview -- --host 0.0.0.0 --port 5173