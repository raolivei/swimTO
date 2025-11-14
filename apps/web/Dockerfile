# Development stage
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/vite.config.ts ./vite.config.ts

# Use non-root user (same as canopy)
RUN chown -R 1000:1000 /app 2>/dev/null || \
    (adduser -D -u 1001 swimto && chown -R swimto:swimto /app) || \
    chown -R node:node /app || true
USER 1000

# Expose port (same as canopy frontend)
EXPOSE 3000

# Run vite preview to serve the built static files
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "3000"]

