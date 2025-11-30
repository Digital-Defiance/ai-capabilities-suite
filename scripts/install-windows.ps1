# MCP Debugger Server - Windows Installation Script
# This script downloads and installs the MCP Debugger Server binary for Windows

param(
    [string]$InstallDir = "$env:ProgramFiles\ts-mcp-server",
    [switch]$AddToPath = $true
)

$ErrorActionPreference = "Stop"

# Configuration
$Repo = "digitaldefiance/ai-capabilities-suite"
$BinaryName = "ts-mcp-server-win-x64.exe"
$InstallName = "ts-mcp-server.exe"

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Get latest version from GitHub API
Write-ColorOutput "Fetching latest version..." "Yellow"
try {
    $LatestRelease = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest"
    $LatestVersion = $LatestRelease.tag_name
    Write-ColorOutput "Latest version: $LatestVersion" "Green"
} catch {
    Write-ColorOutput "Error: Could not fetch latest version" "Red"
    exit 1
}

# Download URLs
$DownloadUrl = "https://github.com/$Repo/releases/download/$LatestVersion/$BinaryName.zip"
$ChecksumUrl = "https://github.com/$Repo/releases/download/$LatestVersion/$BinaryName.zip.sha256"

# Create temporary directory
$TmpDir = New-Item -ItemType Directory -Path (Join-Path $env:TEMP ([System.IO.Path]::GetRandomFileName()))

try {
    # Download binary
    Write-ColorOutput "Downloading $BinaryName..." "Yellow"
    $ZipPath = Join-Path $TmpDir "$BinaryName.zip"
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath

    # Download checksum
    Write-ColorOutput "Downloading checksum..." "Yellow"
    $ChecksumPath = Join-Path $TmpDir "$BinaryName.zip.sha256"
    try {
        Invoke-WebRequest -Uri $ChecksumUrl -OutFile $ChecksumPath
        
        # Verify checksum
        Write-ColorOutput "Verifying checksum..." "Yellow"
        $ExpectedHash = (Get-Content $ChecksumPath).Split()[0]
        $ActualHash = (Get-FileHash -Path $ZipPath -Algorithm SHA256).Hash
        
        if ($ExpectedHash -eq $ActualHash) {
            Write-ColorOutput "Checksum verified successfully" "Green"
        } else {
            Write-ColorOutput "Error: Checksum verification failed" "Red"
            exit 1
        }
    } catch {
        Write-ColorOutput "Warning: Could not download checksum, skipping verification" "Yellow"
    }

    # Extract binary
    Write-ColorOutput "Extracting binary..." "Yellow"
    Expand-Archive -Path $ZipPath -DestinationPath $TmpDir -Force

    # Create installation directory
    if (-not (Test-Path $InstallDir)) {
        Write-ColorOutput "Creating installation directory: $InstallDir" "Yellow"
        New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    }

    # Copy binary to installation directory
    Write-ColorOutput "Installing to $InstallDir..." "Yellow"
    $SourcePath = Join-Path $TmpDir $BinaryName
    $DestPath = Join-Path $InstallDir $InstallName
    Copy-Item -Path $SourcePath -Destination $DestPath -Force

    # Add to PATH if requested
    if ($AddToPath) {
        Write-ColorOutput "Adding to PATH..." "Yellow"
        $CurrentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
        
        if ($CurrentPath -notlike "*$InstallDir*") {
            $NewPath = "$CurrentPath;$InstallDir"
            [Environment]::SetEnvironmentVariable("Path", $NewPath, "Machine")
            Write-ColorOutput "Added $InstallDir to system PATH" "Green"
            Write-ColorOutput "Note: You may need to restart your terminal for PATH changes to take effect" "Yellow"
        } else {
            Write-ColorOutput "$InstallDir is already in PATH" "Green"
        }
    }

    Write-ColorOutput "`n✓ Installation successful!" "Green"
    Write-ColorOutput "`nMCP Debugger Server has been installed to $InstallDir" "White"
    Write-ColorOutput "`nUsage:" "White"
    Write-ColorOutput "  ts-mcp-server --help" "Cyan"
    Write-ColorOutput "`nTo get started, run:" "White"
    Write-ColorOutput "  ts-mcp-server" "Cyan"
    
    if ($AddToPath) {
        Write-ColorOutput "`nNote: Restart your terminal to use the 'ts-mcp-server' command" "Yellow"
    } else {
        Write-ColorOutput "`nTo run the server, use the full path:" "Yellow"
        Write-ColorOutput "  $DestPath" "Cyan"
    }

} catch {
    Write-ColorOutput "Error: Installation failed - $_" "Red"
    exit 1
} finally {
    # Clean up
    if (Test-Path $TmpDir) {
        Remove-Item -Path $TmpDir -Recurse -Force
    }
}
