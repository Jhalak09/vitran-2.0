# ---------- Stage 1: Builder ----------
FROM node:20-bookworm AS builder

WORKDIR /app

# Install build dependencies...
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    bash \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

# Copy the rest of the code (including the prisma schema)
COPY . .

# Generate the Prisma Client
RUN npx prisma generate

# Build NestJS project
RUN npm run build

# (This should be at the end of your Dockerfile)

# Copy the entrypoint script
COPY ./docker-entrypoint.sh /usr/src/app/docker-entrypoint.sh

# Make the script executable
RUN chmod +x /usr/src/app/docker-entrypoint.sh

EXPOSE 4000

# Set the entrypoint script as the command to run
CMD ["/usr/src/app/docker-entrypoint.sh"]