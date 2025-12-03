#!/bin/bash

# Simple script to push each package to its individual repository
# This doesn't set up submodules yet - just gets the code into the repos

set -e

ORG="Digital-Defiance"
BASE_DIR="/home/jessica/source/repos/ai-capabilities-suite"

push_package() {
    local package="$1"
    local package_dir="packages/$package"
    local repo_url="https://github.com/$ORG/$package.git"
    
    echo "📦 Pushing $package to repository..."
    
    if [ ! -d "$package_dir" ]; then
        echo "  ⚠️  Directory $package_dir does not exist, skipping"
        return
    fi
    
    # Count files to see if package has content
    local file_count=$(find "$package_dir" -type f | wc -l)
    
    if [ "$file_count" -eq "0" ]; then
        echo "  📝 Package is empty, skipping"
        return
    fi
    
    echo "  📊 Found $file_count files"
    
    # Create a temporary directory for git operations
    local temp_dir="/tmp/${package}-repo-$(date +%s)"
    mkdir -p "$temp_dir"
    
    # Clone the empty repository
    git clone "$repo_url" "$temp_dir"
    
    # Copy all package content to the cloned repo
    cd "$temp_dir"
    
    # Remove the default README if it exists
    rm -f README.md
    
    # Copy all content from our package
    cp -r "$BASE_DIR/$package_dir"/* . 2>/dev/null || true
    cp -r "$BASE_DIR/$package_dir"/.[!.]* . 2>/dev/null || true
    
    # Verify files were copied
    local copied_files=$(find . -type f -not -path './.git/*' | wc -l)
    echo "  ✅ Copied $copied_files files to repository"
    
    if [ "$copied_files" -ne "$file_count" ]; then
        echo "  ⚠️  File count mismatch: expected $file_count, got $copied_files"
    fi
    
    # Add all files
    git add .
    
    # Check if there are changes to commit
    if git diff --staged --quiet; then
        echo "  ℹ️  No changes to commit"
    else
        # Commit
        git commit -m "Initial commit: Add $package content from ai-capabilities-suite

This package contains the complete codebase migrated from the main
ai-capabilities-suite repository.

Files migrated: $file_count
Migration date: $(date)
Source: packages/$package"
        
        # Push to main branch
        git push origin main
        
        echo "  ✅ Successfully pushed $package ($file_count files)"
    fi
    
    # Clean up
    cd "$BASE_DIR"
    rm -rf "$temp_dir"
    
    echo ""
}

# List of packages to process
packages=(
    "mcp-core"
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

echo "🚀 Pushing all packages to their individual repositories..."
echo ""

for package in "${packages[@]}"; do
    push_package "$package"
done

echo "🎉 All packages have been pushed to their repositories!"
echo ""
echo "📋 Repositories:"
for package in "${packages[@]}"; do
    echo "  - https://github.com/$ORG/$package"
done
echo ""
echo "🔧 Next step: Set up submodules with 'git submodule add' commands"