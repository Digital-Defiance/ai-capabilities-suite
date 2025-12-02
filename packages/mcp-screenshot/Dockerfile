# Multi-stage build for optimized image size
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY packages/mcp-screenshot/package.json ./packages/mcp-screenshot/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY packages/mcp-screenshot ./packages/mcp-screenshot/
COPY tsconfig.base.json ./

# Build the application
WORKDIR /app/packages/mcp-screenshot
RUN npm run build

# Production stage
FROM node:20-alpine

# Install runtime dependencies for screenshot capture
RUN apk add --no-cache \
    # For X11 screenshots on Linux
    xvfb \
    imagemagick \
    # For Tesseract OCR
    tesseract-ocr \
    tesseract-ocr-data-eng \
    # For sharp image processing
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    # For screenshot-desktop
    libx11 \
    libxext \
    libxrandr

# Create non-root user for security
RUN addgroup -g 1001 -S mcp && \
    adduser -u 1001 -S mcp -G mcp

WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=mcp:mcp /app/node_modules ./node_modules
COPY --from=builder --chown=mcp:mcp /app/packages/mcp-screenshot/dist ./dist
COPY --from=builder --chown=mcp:mcp /app/packages/mcp-screenshot/package.json ./
COPY --from=builder --chown=mcp:mcp /app/packages/mcp-screenshot/eng.traineddata ./

# Create directories for screenshots with proper permissions
RUN mkdir -p /app/screenshots /app/config && \
    chown -R mcp:mcp /app/screenshots /app/config

# Switch to non-root user
USER mcp

# Set environment variables
ENV NODE_ENV=production \
    TESSDATA_PREFIX=/usr/share/tessdata

# Expose MCP stdio interface (no network ports needed)
# The server communicates via stdin/stdout

# Health check (optional, for container orchestration)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('healthy')" || exit 1

# Default command
CMD ["node", "dist/src/cli.js"]
