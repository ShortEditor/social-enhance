# ─── Stage 1: Runtime ────────────────────────────────────────────────────────
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency manifests first (layer cache optimization)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Cloud Run injects PORT env var automatically
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
