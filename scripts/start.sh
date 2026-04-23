#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma db push --accept-data-loss

echo "Starting Next.js..."
exec node server.js
