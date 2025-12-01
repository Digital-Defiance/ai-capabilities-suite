# Docker Setup for DigiDefiance Organization

This guide covers building and publishing the MCP Debugger Server Docker image to the `digidefiance` Docker Hub organization.

**Image Name:** `digidefiance/mcp-debugger-server`

## Prerequisites

1. Docker installed and running
2. Docker Hub account with access to `digidefiance` organization
3. NPM package `@ai-capabilities-suite/mcp-debugger-server@1.0.3` published

## Quick Start

### Option 1: Build Only

```bash
# From repository root
./packages/mcp-debugger-server/docker-build-push.sh
```

This will:
- Build the Docker image with multiple tags
- Test the image locally
- Show you the push commands

### Option 2: Build and Push

```bash
# From repository root
./packages/mcp-debugger-server/docker-build-push.sh --push
```

This will:
- Build the Docker image
- Test the image locally
- Login to Docker Hub (you'll be prompted)
- Push all tags to Docker Hub

## Manual Steps

If you prefer to run commands manually:

### 1. Build the Image

```bash
cd /path/to/ai-capabilities-suite

docker build \
  -f packages/mcp-debugger-server/Dockerfile \
  -t digidefiance/mcp-debugger-server:latest \
  -t digidefiance/mcp-debugger-server:1.0.3 \
  -t digidefiance/mcp-debugger-server:v1.0.3 \
  .
```

### 2. Test the Image

```bash
# Check if image was built
docker images digidefiance/mcp-debugger-server

# Test running the container
docker run --rm digidefiance/mcp-debugger-server:latest --version

# Test with help command
docker run --rm digidefiance/mcp-debugger-server:latest --help
```

### 3. Login to Docker Hub

```bash
docker login
# Enter your Docker Hub credentials when prompted
```

### 4. Push to Docker Hub

```bash
docker push digidefiance/mcp-debugger-server:latest
docker push digidefiance/mcp-debugger-server:1.0.3
docker push digidefiance/mcp-debugger-server:v1.0.3
```

## Verify the Published Image

After pushing, verify the image is available:

```bash
# Pull from Docker Hub
docker pull digidefiance/mcp-debugger-server:latest

# Run it
docker run --rm digidefiance/mcp-debugger-server:latest --version
```

You can also check on Docker Hub:
- https://hub.docker.com/r/digidefiance/mcp-debugger-server

## Using the Image

### Basic Usage

```bash
docker run -d \
  --name mcp-debugger \
  -p 3000:3000 \
  digidefiance/mcp-debugger-server:latest
```

### With Docker Compose

```bash
cd packages/mcp-debugger-server
docker-compose up -d
```

The `docker-compose.yml` has been updated to use `digidefiance/mcp-debugger-server:latest`.

### In MCP Configuration

Update your MCP client configuration to use the Docker image:

```json
{
  "mcpServers": {
    "ts-mcp-debugger": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "digidefiance/mcp-debugger-server:latest"
      ]
    }
  }
}
```

## Available Tags

After publishing, these tags will be available:

- `digidefiance/mcp-debugger-server:latest` - Latest stable version
- `digidefiance/mcp-debugger-server:1.0.3` - Specific version
- `digidefiance/mcp-debugger-server:v1.0.3` - Specific version with 'v' prefix

## Image Details

- **Base Image:** node:18-alpine
- **Size:** ~150MB
- **Platforms:** linux/amd64, linux/arm64
- **User:** Non-root user `mcp` (UID 1001)
- **Package:** @ai-capabilities-suite/mcp-debugger-server@1.0.3

## Troubleshooting

### Build Fails

**Issue:** Docker build fails with "Cannot find module"

**Solution:** Ensure the NPM package is published:
```bash
npm view @ai-capabilities-suite/mcp-debugger-server@1.0.3
```

### Push Fails

**Issue:** "denied: requested access to the resource is denied"

**Solution:** 
1. Ensure you're logged in: `docker login`
2. Verify you have access to the `digidefiance` organization
3. Check your Docker Hub permissions

### Image Too Large

**Issue:** Image size is larger than expected

**Solution:** The image uses Alpine Linux and should be ~150MB. If larger:
1. Check for unnecessary files in the build context
2. Verify `.dockerignore` is working
3. Use `docker image inspect digidefiance/mcp-debugger-server:latest` to analyze layers

## Multi-Platform Builds

To build for multiple platforms (amd64 and arm64):

```bash
# Create a builder
docker buildx create --name multiplatform --use

# Build and push for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f packages/mcp-debugger-server/Dockerfile \
  -t digidefiance/mcp-debugger-server:latest \
  -t digidefiance/mcp-debugger-server:1.0.3 \
  --push \
  .
```

## Next Steps

1. ✅ Build the image
2. ✅ Test locally
3. ✅ Push to Docker Hub
4. 📝 Update MCP Registry submission with Docker image
5. 📝 Update documentation with new image name
6. 📝 Announce availability to users

## Support

For issues:
- GitHub: https://github.com/digital-defiance/ai-capabilities-suite/issues
- Email: info@digitaldefiance.org

## License

MIT License - see LICENSE file for details.
