#!/bin/sh

# Apply database migrations
echo "Applying Prisma migrations..."

npx prisma migrate deploy

# Start the application
echo "Starting the server..."
exec node dist/main