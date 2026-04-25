#!/bin/sh
set -e

MAX_RETRIES=30
RETRY_DELAY=2

echo "Waiting for database to be ready..."
for i in $(seq 1 $MAX_RETRIES); do
  if npx prisma db push --skip-generate 2>/dev/null; then
    echo "Database is ready and schema is up to date."
    break
  fi
  if [ "$i" -eq "$MAX_RETRIES" ]; then
    echo "Error: Could not connect to database after $MAX_RETRIES attempts."
    echo "Check your DATABASE_URL environment variable."
    # Run one more time without suppressing output to show the actual error
    npx prisma db push --skip-generate
    exit 1
  fi
  echo "Attempt $i/$MAX_RETRIES failed. Retrying in ${RETRY_DELAY}s..."
  sleep $RETRY_DELAY
done

echo "Starting Next.js..."
exec node server.js
