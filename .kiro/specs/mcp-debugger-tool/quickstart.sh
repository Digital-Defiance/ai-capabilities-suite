#!/bin/bash
set -e

echo "🚀 Setting up TS-MCP (TypeScript MCP ACS Debugger) monorepo..."

# Navigate to repos directory
cd ~/source/repos/DigitalBurnbag

# Create directory
echo "📁 Creating ts-mcp directory..."
mkdir -p ts-mcp
cd ts-mcp

# Initialize Nx workspace
echo "⚙️  Initializing Nx workspace..."
npx create-nx-workspace@latest . \
  --preset=ts \
  --name=ts-mcp \
  --packageManager=yarn \
  --nxCloud=skip \
  --interactive=false

# Add required plugins
echo "📦 Adding Nx plugins..."
yarn add -D @nx/node @nx/jest @nx/eslint-plugin

# Generate debugger-core package
echo "🔧 Generating debugger-core package..."
npx nx g @nx/node:library debugger-core \
  --directory=packages/debugger-core \
  --buildable \
  --publishable \
  --importPath=@ai-capabilities-suite/mcp-core \
  --unitTestRunner=jest \
  --skipFormat

# Generate mcp-server package
echo "🔧 Generating mcp-server package..."
npx nx g @nx/node:library mcp-server \
  --directory=packages/mcp-server \
  --buildable \
  --publishable \
  --importPath=@ai-capabilities-suite/mcp-server \
  --unitTestRunner=jest \
  --skipFormat

# Install MCP SDK
echo "📦 Installing MCP SDK..."
cd packages/mcp-server
yarn add @modelcontextprotocol/sdk
cd ../..

# Install ws for WebSocket support
echo "📦 Installing WebSocket library..."
cd packages/debugger-core
yarn add ws
yarn add -D @types/ws
cd ../..

# Initialize git
echo "🔧 Initializing git repository..."
git init
git add .
git commit -m "Initial commit: TS-MCP monorepo setup"

# Create GitHub repo (optional)
echo ""
echo "✅ Setup complete!"
echo ""
echo "📍 Location: ~/source/repos/DigitalBurnbag/ts-mcp"
echo ""
echo "Next steps:"
echo "  cd ~/source/repos/DigitalBurnbag/ts-mcp"
echo "  yarn build"
echo "  yarn test"
echo ""
echo "To create GitHub repo:"
echo "  gh repo create DigitalBurnbag/ts-mcp --public --source=. --remote=origin"
echo "  git push -u origin main"
