#!/bin/bash

# Manual submodule setup - one package at a time with verification
set -e

ORG="Digital-Defiance"
BASE_DIR="/home/jessica/source/repos/ai-capabilities-suite"

setup_one_package() {
    local package="$1"
    local repo_url="https://github.com/$ORG/$package.git"
    local package_dir="packages/$package"
    
    echo "🔄 Setting up $package as submodule..."
    
    cd "$BASE_DIR"
    
    # Check if package has content
    if [ -d "$package_dir" ] && [ "$(find "$package_dir" -type f | wc -l)" -gt "0" ]; then
        echo "  📦 Package has content - creating temporary backup"
        
        # Create backup outside the repo
        local backup_dir="/tmp/${package}-backup-$(date +%s)"
        cp -r "$package_dir" "$backup_dir"
        
        # Verify backup
        local original_files=$(find "$package_dir" -type f | wc -l)
        local backup_files=$(find "$backup_dir" -type f | wc -l)
        
        echo "  ✅ Backup created: $original_files files → $backup_dir"
        
        if [ "$original_files" -ne "$backup_files" ]; then
            echo "  🚨 ERROR: Backup verification failed!"
            return 1
        fi
        
        # Remove from git but keep directory structure
        git rm -r --cached "$package_dir" 2>/dev/null || true
        
        # Remove the actual directory
        rm -rf "$package_dir"
        
        # Clone the empty repository as submodule
        git submodule add "$repo_url" "$package_dir"
        
        # Initialize the submodule
        git submodule update --init "$package_dir"
        
        # Go into the submodule directory
        cd "$package_dir"
        
        # Remove any existing content (should be just README)
        rm -rf * .[!.]* 2>/dev/null || true
        
        # Copy our content back
        cp -r "$backup_dir"/* . 2>/dev/null || true
        cp -r "$backup_dir"/.[!.]* . 2>/dev/null || true
        
        # Verify restoration
        local restored_files=$(find . -type f | wc -l)
        echo "  ✅ Restored $restored_files files"
        
        if [ "$restored_files" -ne "$original_files" ]; then
            echo "  🚨 ERROR: File restoration failed!"
            return 1
        fi
        
        # Add and commit all content
        git add .
        git commit -m "Initial commit: Migrate $package from ai-capabilities-suite

This package was migrated from the main ai-capabilities-suite repository.
All $original_files files have been preserved.

Migration date: $(date)
Original location: packages/$package"
        
        # Push to the remote repository
        git push -u origin main
        
        # Return to base directory
        cd "$BASE_DIR"
        
        # Clean up backup
        rm -rf "$backup_dir"
        
        echo "  ✅ $package successfully set up as submodule with all content"
        
    else
        echo "  📝 Package is empty - setting up basic submodule"
        
        # Remove empty directory
        rm -rf "$package_dir"
        
        # Add as submodule
        git submodule add "$repo_url" "$package_dir"
        
        echo "  ✅ $package set up as empty submodule"
    fi
    
    echo ""
}

# Function to setup all packages
setup_all_packages() {
    local packages=(
        "mcp-debugger-core"
        "mcp-debugger-server" 
        "mcp-process"
        "mcp-screenshot"
        "vscode-mcp-debugger"
        "vscode-mcp-screenshot"
        "mcp-core"
        "debugger-core"
        "mcp-server"
        "mcp-filesystem"
        "mcp-recording"
    )
    
    echo "🚀 Setting up all packages as submodules..."
    echo ""
    
    for package in "${packages[@]}"; do
        setup_one_package "$package"
    done
    
    # Commit the submodule configuration
    cd "$BASE_DIR"
    git add .gitmodules
    git commit -m "Add all packages as submodules

All packages have been converted to individual repositories under the Digital-Defiance organization:
$(for pkg in "${packages[@]}"; do echo "- https://github.com/$ORG/$pkg"; done)

Each package maintains its complete history and content.
Use 'git submodule update --init --recursive' to work with submodules."
    
    echo "🎉 All packages successfully set up as submodules!"
    echo ""
    echo "📋 Summary:"
    for package in "${packages[@]}"; do
        echo "  ✅ $package → https://github.com/$ORG/$package"
    done
}

# Check if a specific package was requested
if [ $# -eq 1 ]; then
    setup_one_package "$1"
else
    setup_all_packages
fi