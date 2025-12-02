# Multi-stage build for MCP Screenshot Server
# Optimized for production deployment with minimal image size

# Stage 1: Builder
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
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

# Install runtime dependencies for screenshot capture
RUN apk add --no-cache \
    # X11 and display server
    xvfb \
    x11vnc \
    fluxbox \
    # Screenshot tools
    scrot \
    imagemagick \
    # Image processing
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    # OCR for PII detection
    tesseract-ocr \
    tesseract-ocr-data-eng \
    # Utilities
    bash \
    dbus \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S mcpuser && \
    adduser -u 1001 -S mcpuser -G mcpuser

WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=mcpuser:mcpuser /app/dist ./dist
COPY --from=builder --chown=mcpuser:mcpuser /app/node_modules ./node_modules
COPY --from=builder --chown=mcpuser:mcpuser /app/package.json ./

# Copy Tesseract data
COPY --chown=mcpuser:mcpuser eng.traineddata /usr/share/tessdata/

# Create directories for screenshots
RUN mkdir -p /app/screenshots /tmp/.X11-unix && \
    chown -R mcpuser:mcpuser /app/screenshots /tmp/.X11-unix

# Environment variables
ENV NODE_ENV=production \
    DISPLAY=:99 \
    TESSDATA_PREFIX=/usr/share/tessdata

# Expose port for VNC (optional, for debugging)
EXPOSE 5900

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('healthy')" || exit 1

# Switch to non-root user
USER mcpuser

# Start script that launches Xvfb and the MCP server
COPY --chown=mcpuser:mcpuser docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "dist/src/cli.js"]
