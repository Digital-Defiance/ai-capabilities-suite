# Docker Build and Push Instructions

## Current Status

The Docker image build is ready, but requires republishing the NPM package first with the corrected dependency.

## Issue

The currently published package (`@ai-capabilities-suite/mcp-debugger-server@1.0.0`) has a `workspace:^` dependency which doesn't work outside of the monorepo:

```json
"dependencies": {
  "@ai-capabilities-suite/mcp-debugger-core": "workspace:^",  // ❌ This doesn't work in Docker
  ...
}
```

## Solution

### Step 1: Republish NPM Package (Version 1.0.1)

The package.json has been updated to use the published version:

```json
"dependencies": {
  "@ai-capabilities-suite/mcp-debugger-core": "^1.0.1",  // ✅ This works everywhere
  ...
}
```

**Publish the updated package:**

```bash
cd packages/mcp-debugger-server
npm publish --access public
```

This will publish version 1.0.1 with the corrected dependency.

### Step 2: Build Docker Image

Once the package is published to NPM, build the Docker image:

```bash
# From repository root
docker build -f packages/mcp-debugger-server/Dockerfile \
  -t digitaldefiance/ts-mcp-server:latest \
  -t digitaldefiance/ts-mcp-server:1.0.1 \
  .
```

### Step 3: Test Docker Image

Test the image locally:

```bash
# Run the container
docker run --rm digitaldefiance/ts-mcp-server:latest --help

# Test with a simple script
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | docker run -i --rm digitaldefiance/ts-mcp-server:latest
```

### Step 4: Push to Docker Hub

Login and push:

```bash
# Login to Docker Hub
docker login

# Push both tags
docker push digitaldefiance/ts-mcp-server:latest
docker push digitaldefiance/ts-mcp-server:1.0.1
```

## Files Updated

The following files have been updated for version 1.0.1:

1. **package.json**
   - Version: 1.0.0 → 1.0.1
   - Dependency: `workspace:^` → `^1.0.1`

2. **server.json**
   - Version: 1.0.0 → 1.0.1
   - Package version: 1.0.0 → 1.0.1

3. **Dockerfile**
   - Install version: 1.0.0 → 1.0.1
   - Label version: 1.0.0 → 1.0.1

## Dockerfile Strategy

The Dockerfile uses a simple strategy:

1. Start with `node:18-alpine` base image
2. Install the published NPM package globally
3. Run the `ts-mcp-server` command

This approach:
- ✅ Always uses the latest published version
- ✅ No build complexity in Docker
- ✅ Smaller image size
- ✅ Faster builds (no compilation)
- ✅ Consistent with NPM installation

## Verification

After pushing, verify the image:

```bash
# Pull and test
docker pull digitaldefiance/ts-mcp-server:latest
docker run --rm digitaldefiance/ts-mcp-server:latest --version
```

## Troubleshooting

### Error: "Unsupported URL Type workspace:"

**Cause**: The NPM package still has `workspace:^` dependency

**Solution**: Ensure version 1.0.1 is published to NPM first

### Error: "Cannot find module"

**Cause**: The package wasn't installed correctly

**Solution**: Rebuild the Docker image after confirming NPM publication

### Error: "Permission denied"

**Cause**: Not logged into Docker Hub

**Solution**: Run `docker login` first

## Next Steps

1. ✅ Update package.json (DONE)
2. ✅ Update server.json (DONE)
3. ✅ Update Dockerfile (DONE)
4. ⏳ Publish to NPM (MANUAL - Run `npm publish`)
5. ⏳ Build Docker image (MANUAL - Run `docker build`)
6. ⏳ Push to Docker Hub (MANUAL - Run `docker push`)

## Summary

All files are ready for Docker deployment. The only remaining steps are:

1. Publish version 1.0.1 to NPM
2. Build the Docker image
3. Push to Docker Hub

These are manual steps that require authentication and cannot be automated in this context.
