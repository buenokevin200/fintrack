#!/bin/sh
set -e

echo "Running Prisma migrations..."
./node_modules/prisma/build/index.js db push --accept-data-loss --schema=./prisma/schema.prisma

echo "Starting Next.js..."
exec node server.js
