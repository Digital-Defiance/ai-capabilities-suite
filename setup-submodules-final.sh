#!/bin/bash

# Final step: Set up submodules after repositories are populated
set -e

ORG="Digital-Defiance"
BASE_DIR="/home/jessica/source/repos/ai-capabilities-suite"

# Packages that have content and were successfully pushed
PACKAGES=(
    "mcp-core"
    "mcp-debugger-core"
    "mcp-debugger-server"
    "mcp-process"
    "mcp-screenshot"
    "vscode-mcp-debugger"
    "vscode-mcp-screenshot"
    "debugger-core"
    "mcp-server"
)

# Empty packages (will be added as empty submodules)
EMPTY_PACKAGES=(
    "mcp-filesystem"
    "mcp-recording"
)

echo "🔧 Setting up submodules for all packages..."
echo ""

cd "$BASE_DIR"

# Remove packages from git tracking
git rm -r --cached packages/ 2>/dev/null || true

# Add populated packages as submodules
for package in "${PACKAGES[@]}"; do
    package_dir="packages/$package"
    repo_url="https://github.com/$ORG/$package.git"
    
    echo "📦 Adding $package as submodule..."
    
    # Remove local directory
    rm -rf "$package_dir"
    
    # Add as submodule
    git submodule add "$repo_url" "$package_dir"
    
    echo "  ✅ $package added successfully"
done

# Add empty packages as submodules
for package in "${EMPTY_PACKAGES[@]}"; do
    package_dir="packages/$package"
    repo_url="https://github.com/$ORG/$package.git"
    
    echo "📝 Adding empty $package as submodule..."
    
    # Remove local directory
    rm -rf "$package_dir"
    
    # Add as submodule
    git submodule add "$repo_url" "$package_dir"
    
    echo "  ✅ $package added successfully"
done

# Initialize all submodules
echo ""
echo "🔄 Initializing all submodules..."
git submodule update --init --recursive

# Commit the submodule configuration
git add .gitmodules
git commit -m "Convert packages to individual repositories with submodules

✅ All packages successfully migrated to Digital-Defiance organization
✅ Each package maintains its complete codebase and history
✅ Submodules configured for seamless development workflow

Repositories:
$(for pkg in "${PACKAGES[@]}" "${EMPTY_PACKAGES[@]}"; do echo "- https://github.com/$ORG/$pkg"; done)

Commands:
- git submodule update --init --recursive  # Initialize all submodules
- git submodule update --remote            # Update all to latest
- cd packages/<name> && git pull          # Update specific package"

echo ""
echo "🎉 Migration completed successfully!"
echo ""
echo "📊 Summary:"
echo "✅ Populated repositories:"
for package in "${PACKAGES[@]}"; do
    echo "  - $package → https://github.com/$ORG/$package"
done
echo ""
echo "📝 Empty repositories (ready for development):"
for package in "${EMPTY_PACKAGES[@]}"; do
    echo "  - $package → https://github.com/$ORG/$package"
done
echo ""
echo "🔧 Working with submodules:"
echo "  git submodule update --init --recursive  # Initialize all submodules"
echo "  git submodule update --remote            # Update all to latest"
echo "  cd packages/<name>                      # Work in specific package"
echo "  git pull origin main                     # Update specific package"
echo ""
echo "💾 Original code backed up in: packages-backup-*"