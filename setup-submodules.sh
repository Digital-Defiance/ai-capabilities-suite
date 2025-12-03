#!/bin/bash

# Script to set up existing packages as submodules
# Assumes repositories already exist on GitHub

set -e

ORG="Digital-Defiance"
BASE_DIR="/home/jessica/source/repos/ai-capabilities-suite"

# Package list
PACKAGES=(
    "debugger-core"
    "mcp-core"
    "mcp-debugger-core"
    "mcp-debugger-server"
    "mcp-filesystem"
    "mcp-process"
    "mcp-recording"
    "mcp-screenshot"
    "mcp-server"
    "vscode-mcp-debugger"
    "vscode-mcp-screenshot"
)

echo "Setting up packages as submodules..."

cd "$BASE_DIR"

# Remove packages from git tracking but keep files
git rm -r --cached packages/ 2>/dev/null || true

for package in "${PACKAGES[@]}"; do
    package_dir="packages/$package"
    repo_url="https://github.com/$ORG/$package.git"
    
    echo "Processing: $package"
    
    # Check if package directory has content
    if [ -d "$package_dir" ] && [ "$(ls -A "$package_dir" 2>/dev/null)" ]; then
        echo "  Package has content, backing up..."
        
        # Create backup
        cp -r "$package_dir" "${package_dir}.backup"
        
        # Remove original
        rm -rf "$package_dir"
        
        # Add as submodule
        git submodule add "$repo_url" "$package_dir"
        
        # Remove the empty cloned content
        rm -rf "$package_dir"/*
        rm -rf "$package_dir"/.[!.]*
        
        # Restore our content
        cp -r "${package_dir}.backup"/* "$package_dir"/ 2>/dev/null || true
        cp -r "${package_dir}.backup"/.[!.]* "$package_dir"/ 2>/dev/null || true
        
        # Clean up backup
        rm -rf "${package_dir}.backup"
        
        # Initialize and push to remote
        cd "$package_dir"
        git add .
        git commit -m "Initial commit: Add existing package content

This package was migrated from the ai-capabilities-suite monorepo.
All existing functionality and history is preserved."
        git push -u origin main
        cd "$BASE_DIR"
        
        echo "  ✓ $package set up as submodule with content"
    else
        echo "  Package is empty, creating basic submodule..."
        
        # Remove empty directory if it exists
        rm -rf "$package_dir"
        
        # Add as submodule
        git submodule add "$repo_url" "$package_dir"
        
        echo "  ✓ $package set up as empty submodule"
    fi
done

# Commit the submodule configuration
git add .gitmodules
git commit -m "Convert packages to submodules

- Each package is now an individual repository under Digital-Defiance
- Packages are linked as git submodules
- All existing content has been preserved and pushed to individual repos"

echo ""
echo "✅ Setup complete!"
echo ""
echo "All packages are now individual repositories and submodules:"
for package in "${PACKAGES[@]}"; do
    echo "  - https://github.com/$ORG/$package"
done
echo ""
echo "Submodule commands:"
echo "  git submodule update --init --recursive  # Initialize all submodules"
echo "  git submodule update --remote            # Update all to latest"
echo "  cd packages/<name> && git pull          # Update specific package"