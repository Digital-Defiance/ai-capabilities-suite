#!/bin/bash

# Final clean submodule setup without debugger-core
set -e

ORG="Digital-Defiance"

# Final list of packages (excluding debugger-core)
PACKAGES=(
    "mcp-core"
    "mcp-debugger-core"
    "mcp-debugger-server"
    "mcp-process"
    "mcp-screenshot"
    "vscode-mcp-debugger"
    "vscode-mcp-screenshot"
    "mcp-server"
    "mcp-filesystem"
    "mcp-recording"
)

echo "🔧 Setting up final submodules (excluding debugger-core)..."
echo ""

# Remove any existing .gitmodules
rm -f .gitmodules

# Add each package as a submodule
for package in "${PACKAGES[@]}"; do
    echo "📦 Adding $package..."
    git submodule add "https://github.com/$ORG/$package.git" "packages/$package"
    echo "  ✅ $package added successfully"
done

echo ""
echo "🔄 Initializing all submodules..."
git submodule update --init --recursive

echo ""
echo "📝 Committing final submodule configuration..."
git add .gitmodules
git commit -m "Convert packages to individual repositories with submodules

✅ All packages successfully migrated to Digital-Defiance organization
✅ Each package maintains its complete codebase and history  
✅ Submodules configured for seamless development workflow
✅ Removed debugger-core (not needed)

Final repositories:
- https://github.com/$ORG/mcp-core
- https://github.com/$ORG/mcp-debugger-core
- https://github.com/$ORG/mcp-debugger-server
- https://github.com/$ORG/mcp-process
- https://github.com/$ORG/mcp-screenshot
- https://github.com/$ORG/vscode-mcp-debugger
- https://github.com/$ORG/vscode-mcp-screenshot
- https://github.com/$ORG/mcp-server
- https://github.com/$ORG/mcp-filesystem
- https://github.com/$ORG/mcp-recording

Working with submodules:
- git submodule update --init --recursive  # Initialize all submodules
- git submodule update --remote            # Update all to latest
- cd packages/<name> && git pull          # Update specific package"

echo ""
echo "🎉 Migration completed successfully!"
echo ""
echo "📊 Final summary:"
for package in "${PACKAGES[@]}"; do
    echo "  ✅ $package → https://github.com/$ORG/$package"
done
echo ""
echo "💾 Original code backed up in: packages-backup-*"