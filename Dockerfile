FROM oven/bun:1-slim as base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install 

# Copy source code
COPY . .
ENV 693269408724-4d2npj45o5s1iehl2nv38mu9jn3oap61.apps.googleusercontent.com

# Build the application
RUN bun run build

WORKDIR /app/server
COPY server/package*.json server/bun.lockb ./
RUN bun install 

WORKDIR /app
ENV NODE_ENV=production

# Expose the port
EXPOSE 3000

# Start the server
CMD ["bun", "server/index.js"]