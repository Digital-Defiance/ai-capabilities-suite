#!/bin/bash

# Script to create GitHub repositories for each package under Digital-Defiance organization
# and set them up as submodules

set -e

ORG="Digital-Defiance"
BASE_DIR="/home/jessica/source/repos/ai-capabilities-suite"

# Package definitions with descriptions from package.json
declare -A PACKAGES=(
    ["debugger-core"]="Core debugging utilities and shared infrastructure"
    ["mcp-core"]="Shared infrastructure for AI Capability Extension Suite MCP servers"
    ["mcp-debugger-core"]="Core debugging engine for Node.js and TypeScript applications. Provides Inspector Protocol integration, breakpoint management, variable inspection, execution control, profiling, hang detection, and source map support."
    ["mcp-debugger-server"]="Enterprise-grade MCP server providing advanced debugging capabilities for Node.js and TypeScript applications. Features 25+ debugging tools including breakpoints, variable inspection, execution control, CPU/memory profiling, hang detection, source map support, and comprehensive observability."
    ["mcp-filesystem"]="MCP server for filesystem operations with security boundaries"
    ["mcp-process"]="MCP server for process management and monitoring with strict security boundaries"
    ["mcp-recording"]="MCP server for recording and playback capabilities"
    ["mcp-screenshot"]="MCP server providing screenshot capture capabilities for AI agents with multi-format support, PII masking, and security controls"
    ["mcp-server"]="Base MCP server implementation and utilities"
    ["vscode-mcp-debugger"]="Advanced debugging for Node.js and TypeScript with MCP integration"
    ["vscode-mcp-screenshot"]="Cross-platform screenshot capture for VS Code with MCP integration and Language Server Protocol support for intelligent code assistance"
)

echo "Creating GitHub repositories under $ORG organization..."

for package in "${!PACKAGES[@]}"; do
    repo_name="$package"
    description="${PACKAGES[$package]}"
    
    echo "Creating repository: $repo_name"
    
    # Create the repository
    gh repo create "$ORG/$repo_name" \
        --description "$description" \
        --public \
        --clone=false \
        --add-readme
    
    echo "Repository $repo_name created successfully"
done

echo ""
echo "All repositories created. Now setting up submodules..."

# Change to the main repository directory
cd "$BASE_DIR"

# Remove existing packages directory from git tracking (but keep files)
git rm -r --cached packages/ 2>/dev/null || true

# Add each package as a submodule
for package in "${!PACKAGES[@]}"; do
    package_dir="packages/$package"
    repo_url="https://github.com/$ORG/$package.git"
    
    echo "Adding submodule: $package"
    
    # Remove the directory temporarily
    if [ -d "$package_dir" ]; then
        mv "$package_dir" "${package_dir}.tmp"
    fi
    
    # Add as submodule
    git submodule add "$repo_url" "$package_dir"
    
    # If we had content, move it back
    if [ -d "${package_dir}.tmp" ]; then
        # Remove the empty cloned directory
        rm -rf "$package_dir"
        # Move our content back
        mv "${package_dir}.tmp" "$package_dir"
        
        # Initialize the submodule repository
        cd "$package_dir"
        git init
        git remote add origin "$repo_url"
        git add .
        git commit -m "Initial commit: Add existing package content"
        git branch -M main
        git push -u origin main
        cd "$BASE_DIR"
    fi
done

# Update .gitmodules and commit
git add .gitmodules
git commit -m "Add package submodules

- Convert packages to individual repositories under Digital-Defiance organization
- Each package is now a separate git submodule
- Maintains existing package structure and content"

echo ""
echo "Setup complete! All packages are now:"
echo "1. Individual repositories under the Digital-Defiance organization"
echo "2. Set up as submodules in this main repository"
echo ""
echo "To work with submodules:"
echo "  git submodule update --init --recursive  # Initialize all submodules"
echo "  git submodule update --remote            # Update all submodules to latest"
echo "  cd packages/<package-name>              # Work in individual package"
echo "  git pull origin main                     # Update specific package"