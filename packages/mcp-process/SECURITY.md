# Security Implementation

## Cross-Platform Security

The MCP Process Server implements comprehensive security across all platforms:

### Unix/Linux Security

**Blocked Executables:**
- `sudo`, `su`, `doas` - Privilege escalation
- `chmod`, `chown`, `chgrp` - Permission modification
- `rm`, `rmdir` - File deletion
- `dd` - Disk operations
- `mkfs`, `fdisk`, `parted` - Filesystem operations
- `iptables`, `nft` - Firewall configuration
- `systemctl`, `service` - Service management
- `reboot`, `shutdown`, `halt` - System control

**Blocked Environment Variables:**
- `LD_PRELOAD`, `LD_LIBRARY_PATH` - Library injection
- `PATH` - Path manipulation
- `PYTHONPATH`, `NODE_PATH`, `PERL5LIB`, `RUBYLIB` - Language-specific paths

**Additional Checks:**
- Setuid/setgid executable detection and blocking
- File permission validation

### Windows Security

**Blocked Executables:**
- `runas.exe` - Privilege escalation
- `psexec.exe`, `psexec64.exe` - Remote execution
- `del.exe`, `erase.exe` - File deletion
- `format.com`, `diskpart.exe` - Disk operations
- `bcdedit.exe` - Boot configuration
- `reg.exe`, `regedit.exe` - Registry modification
- `sc.exe` - Service control
- `net.exe`, `netsh.exe` - Network configuration
- `wmic.exe` - WMI operations
- `msiexec.exe` - Installer execution
- `taskkill.exe` - Process termination
- `shutdown.exe` - System control

**Blocked Environment Variables:**
- `Path`, `PATH` - Path manipulation (case-insensitive)
- `PATHEXT` - Executable extension manipulation
- `COMSPEC` - Command interpreter manipulation
- `PROCESSOR_ARCHITECTURE` - Architecture spoofing

**Additional Checks:**
- Windows path separator handling (`\` and `/`)
- Case-insensitive executable matching

### macOS Security

**Blocked Executables:**
- Same as Unix/Linux

**Blocked Environment Variables:**
- `DYLD_INSERT_LIBRARIES`, `DYLD_LIBRARY_PATH` - Dynamic library injection
- All Unix/Linux blocked variables

**Additional Checks:**
- Setuid/setgid executable detection
- macOS-specific library injection prevention

## Security Layers

All platforms implement 6 layers of validation:

1. **Executable Resolution** - Verify executable exists and is accessible
2. **Dangerous Executable Check** - Block known dangerous commands
3. **Shell Interpreter Check** - Optionally block shell access
4. **Privilege Check** - Block setuid/setgid (Unix) or admin tools (Windows)
5. **Allowlist Check** - Only permit explicitly allowed executables
6. **Argument Validation** - Prevent command injection

## Configuration

```json
{
  "allowedExecutables": ["node", "python3", "git"],
  "blockShellInterpreters": true,
  "blockSetuidExecutables": true,
  "enableAuditLog": true
}
```

## What AI Agents CANNOT Do

- Launch executables not in the allowlist
- Launch shell interpreters (if blocked)
- Launch dangerous system commands
- Launch privilege escalation tools
- Modify PATH or other dangerous environment variables
- Execute command injection via arguments
- Access arbitrary working directories (if restricted)
- Terminate processes they didn't create

## What AI Agents CAN Do (Within Allowlist)

- Launch approved executables with arguments
- Set safe environment variables
- Capture stdout/stderr
- Send stdin input
- Monitor resource usage
- Terminate processes they created
- Create process groups
- Set resource limits
