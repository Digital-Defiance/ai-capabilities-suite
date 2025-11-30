# Multi-stage Dockerfile for MCP Debugger Server
# Optimized for production deployment with minimal image size

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /build

# Copy package files for dependency installation
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY packages/mcp-debugger-server/package.json ./packages/mcp-debugger-server/
COPY packages/mcp-debugger-core/package.json ./packages/mcp-debugger-core/

# Install dependencies
RUN npm ci --only=production || yarn install --production --frozen-lockfile || pnpm install --prod --frozen-lockfile

# Copy source code
COPY packages/mcp-debugger-server ./packages/mcp-debugger-server
COPY packages/mcp-debugger-core ./packages/mcp-debugger-core
COPY tsconfig.base.json ./

# Build the application
WORKDIR /build/packages/mcp-debugger-server
RUN npm run build || yarn build || pnpm build

# Stage 2: Production stage
FROM node:18-alpine

# Install runtime dependencies only
RUN apk add --no-cache \
    tini \
    dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S mcp && \
    adduser -u 1001 -S mcp -G mcp

# Set working directory
WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=mcp:mcp /build/packages/mcp-debugger-server/dist ./dist
COPY --from=builder --chown=mcp:mcp /build/packages/mcp-debugger-core/dist ../mcp-debugger-core/dist
COPY --from=builder --chown=mcp:mcp /build/node_modules ./node_modules
COPY --from=builder --chown=mcp:mcp /build/packages/mcp-debugger-server/package.json ./

# Copy documentation
COPY --chown=mcp:mcp packages/mcp-debugger-server/README.md ./
COPY --chown=mcp:mcp packages/mcp-debugger-server/LICENSE ./
COPY --chown=mcp:mcp packages/mcp-debugger-server/API.md ./
COPY --chown=mcp:mcp packages/mcp-debugger-server/TOOL-REFERENCE.md ./

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    LOG_LEVEL=info

# Expose port (if needed for health checks)
EXPOSE 3000

# Switch to non-root user
USER mcp

# Use tini as init system for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Run the MCP server
CMD ["node", "dist/src/cli.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "process.exit(0)" || exit 1

# Labels for metadata
LABEL org.opencontainers.image.title="MCP Debugger Server" \
      org.opencontainers.image.description="Enterprise-grade MCP server for Node.js and TypeScript debugging" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.vendor="Digital Defiance" \
      org.opencontainers.image.authors="Jessica Mulein <jessica@digitaldefiance.org>" \
      org.opencontainers.image.url="https://github.com/digitaldefiance/ai-capabilities-suite" \
      org.opencontainers.image.source="https://github.com/digitaldefiance/ai-capabilities-suite" \
      org.opencontainers.image.licenses="MIT"
