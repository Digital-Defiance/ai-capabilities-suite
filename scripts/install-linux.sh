#!/bin/bash

# MCP Debugger Server - Linux Installation Script
# This script downloads and installs the MCP Debugger Server binary for Linux

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO="digitaldefiance/ai-capabilities-suite"
BINARY_NAME="ts-mcp-server-linux-x64"
INSTALL_DIR="/usr/local/bin"
INSTALL_NAME="ts-mcp-server"

# Get latest version from GitHub API
echo -e "${YELLOW}Fetching latest version...${NC}"
LATEST_VERSION=$(curl -s "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$LATEST_VERSION" ]; then
    echo -e "${RED}Error: Could not fetch latest version${NC}"
    exit 1
fi

echo -e "${GREEN}Latest version: ${LATEST_VERSION}${NC}"

# Download URL
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${LATEST_VERSION}/${BINARY_NAME}.tar.gz"
CHECKSUM_URL="https://github.com/${REPO}/releases/download/${LATEST_VERSION}/${BINARY_NAME}.tar.gz.sha256"

# Create temporary directory
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

# Download binary
echo -e "${YELLOW}Downloading ${BINARY_NAME}...${NC}"
if ! curl -L -o "${BINARY_NAME}.tar.gz" "$DOWNLOAD_URL"; then
    echo -e "${RED}Error: Failed to download binary${NC}"
    rm -rf "$TMP_DIR"
    exit 1
fi

# Download checksum
echo -e "${YELLOW}Downloading checksum...${NC}"
if ! curl -L -o "${BINARY_NAME}.tar.gz.sha256" "$CHECKSUM_URL"; then
    echo -e "${YELLOW}Warning: Could not download checksum, skipping verification${NC}"
else
    # Verify checksum
    echo -e "${YELLOW}Verifying checksum...${NC}"
    if sha256sum -c "${BINARY_NAME}.tar.gz.sha256"; then
        echo -e "${GREEN}Checksum verified successfully${NC}"
    else
        echo -e "${RED}Error: Checksum verification failed${NC}"
        rm -rf "$TMP_DIR"
        exit 1
    fi
fi

# Extract binary
echo -e "${YELLOW}Extracting binary...${NC}"
tar -xzf "${BINARY_NAME}.tar.gz"

# Make binary executable
chmod +x "$BINARY_NAME"

# Install binary
echo -e "${YELLOW}Installing to ${INSTALL_DIR}...${NC}"
if [ -w "$INSTALL_DIR" ]; then
    mv "$BINARY_NAME" "${INSTALL_DIR}/${INSTALL_NAME}"
else
    echo -e "${YELLOW}Requesting sudo access to install to ${INSTALL_DIR}...${NC}"
    sudo mv "$BINARY_NAME" "${INSTALL_DIR}/${INSTALL_NAME}"
fi

# Clean up
cd - > /dev/null
rm -rf "$TMP_DIR"

# Verify installation
if command -v "$INSTALL_NAME" &> /dev/null; then
    echo -e "${GREEN}✓ Installation successful!${NC}"
    echo ""
    echo "MCP Debugger Server has been installed to ${INSTALL_DIR}/${INSTALL_NAME}"
    echo ""
    echo "Usage:"
    echo "  ${INSTALL_NAME} --help"
    echo ""
    echo "To get started, run:"
    echo "  ${INSTALL_NAME}"
else
    echo -e "${RED}Error: Installation failed${NC}"
    exit 1
fi
