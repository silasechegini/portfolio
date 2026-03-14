# Use the official Node.js Debian-based image
FROM node:20-bookworm-slim AS builder

# 1. Install necessary system build tools for Canvas
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Copy only package files first
COPY package*.json ./

# 3. Clean install (this will now use the system's Node, not a node_modules version)
RUN npm ci

# 4. Copy the rest of your source code
COPY . .

# 5. Build the project
RUN npm run build

# --- Production Stage ---
FROM node:20-bookworm-slim
WORKDIR /app

# Copy only the necessary files from the builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install ONLY the runtime libraries (much smaller)
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 3000
CMD ["node", "dist/index.js"]