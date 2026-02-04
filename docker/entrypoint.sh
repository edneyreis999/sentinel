#!/bin/sh
set -e

echo "[1/3] Waiting for PostgreSQL..."
until pg_isready -h postgres -p 5432 -U "$POSTGRES_USER"; do
  sleep 2
done
echo "[1/3] PostgreSQL ready"

echo "[2/3] Running database migrations..."
npx prisma migrate deploy
echo "[2/3] Migrations complete"

echo "[3/3] Starting application..."
exec "$@"
