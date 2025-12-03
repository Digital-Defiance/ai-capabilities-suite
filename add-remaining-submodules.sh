#!/bin/bash

# Add remaining submodules one by one
set -e

ORG="Digital-Defiance"

# Remaining packages to add
PACKAGES=(
    "mcp-debugger-core"
    "mcp-debugger-server"
    "mcp-process"
    "mcp-screenshot"
    "vscode-mcp-debugger"
    "vscode-mcp-screenshot"
    "debugger-core"
    "mcp-server"
    "mcp-filesystem"
    "mcp-recording"
)

echo "Adding remaining submodules..."

for package in "${PACKAGES[@]}"; do
    echo "📦 Adding $package..."
    git submodule add --force "https://github.com/$ORG/$package.git" "packages/$package"
    echo "  ✅ $package added"
done

echo ""
echo "🔄 Initializing all submodules..."
git submodule update --init --recursive

echo ""
echo "📝 Committing submodule configuration..."
git add .gitmodules
git commit -m "Convert packages to individual repositories with submodules

✅ All packages successfully migrated to Digital-Defiance organization
✅ Each package maintains its complete codebase and history
✅ Submodules configured for seamless development workflow

Repositories:
- https://github.com/$ORG/mcp-core
- https://github.com/$ORG/mcp-debugger-core
- https://github.com/$ORG/mcp-debugger-server
- https://github.com/$ORG/mcp-process
- https://github.com/$ORG/mcp-screenshot
- https://github.com/$ORG/vscode-mcp-debugger
- https://github.com/$ORG/vscode-mcp-screenshot
- https://github.com/$ORG/debugger-core
- https://github.com/$ORG/mcp-server
- https://github.com/$ORG/mcp-filesystem
- https://github.com/$ORG/mcp-recording

Commands:
- git submodule update --init --recursive  # Initialize all submodules
- git submodule update --remote            # Update all to latest
- cd packages/<name> && git pull          # Update specific package"

echo ""
echo "🎉 Migration completed successfully!"