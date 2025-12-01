# MCP Process - Design Document

## Overview

The MCP Process server provides AI agents with process management capabilities, enabling them to launch processes, monitor resource usage, manage application lifecycle, and orchestrate services, all within strict security boundaries enforced by executable allowlists and resource limits.

## Architecture

```
┌─────────────────┐
│   AI Agent      │
│   (Kiro)        │
└────────┬────────┘
         │ MCP Protocol
         │
┌────────▼────────┐
│  MCP Process    │
│     Server      │
└────────┬────────┘
         │ Node.js child_process
         ├──────────────────┬──────────────┬──────────────┐
         │                  │              │              │
┌────────▼────────┐ ┌──────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
│Process Launcher │ │  Monitor    │ │  I/O     │ │  Security  │
└─────────────────┘ └─────────────┘ └──────────┘ └────────────┘
```

## Core Components

### 1. MCP Server
- Implements MCP protocol
- Exposes process management tools
- Manages process lifecycle
- Enforces security policies

### 2. Process Launcher
- Spawns child processes
- Sets environment variables
- Configures working directory
- Validates against allowlist

### 3. Resource Monitor
- Tracks CPU and memory usage
- Monitors I/O statistics
- Collects historical data
- Enforces resource limits

### 4. I/O Manager
- Captures stdout and stderr
- Manages stdin input
- Buffers output streams
- Handles binary data

### 5. Service Manager
- Manages long-running services
- Implements auto-restart
- Performs health checks
- Tracks service state

### 6. Process Group Manager
- Creates and manages process groups
- Implements process pipelines
- Handles group termination
- Tracks group membership

### 7. Security Manager
- Validates executables against allowlist
- Prevents privilege escalation
- Sanitizes environment variables
- Enforces resource limits
- Manages audit logging

## Data Models

```typescript
interface ProcessConfig {
  executable: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  resourceLimits?: ResourceLimits;
  captureOutput?: boolean;
  autoRestart?: boolean;
}

interface ResourceLimits {
  maxCpuPercent?: number;
  maxMemoryMB?: number;
  maxFileDescriptors?: number;
  maxCpuTime?: number; // seconds
}

interface ManagedProcess {
  pid: number;
  command: string;
  args: string[];
  state: 'running' | 'stopped' | 'crashed';
  startTime: Date;
  exitCode?: number;
  stats: ProcessStats;
  outputBuffer: Buffer[];
  errorBuffer: Buffer[];
}

interface ProcessStats {
  cpuPercent: number;
  memoryMB: number;
  threadCount: number;
  ioRead: number;
  ioWrite: number;
  uptime: number;
}

interface ProcessGroup {
  id: string;
  name: string;
  processes: number[];
  pipeline?: boolean;
}

interface ServiceConfig extends ProcessConfig {
  healthCheck?: {
    command: string;
    interval: number;
    timeout: number;
  };
  restartPolicy: {
    enabled: boolean;
    maxRetries: number;
    backoffMs: number;
  };
}
```

## Security Implementation

### Multi-Layer Security Architecture

The process server implements defense-in-depth with multiple security layers:

1. **Executable Allowlist**: Only pre-approved executables can be launched
2. **Argument Validation**: Command arguments are validated for injection attacks
3. **Environment Sanitization**: Dangerous environment variables are removed
4. **Resource Limits**: CPU, memory, and time limits prevent resource exhaustion
5. **Privilege Prevention**: No privilege escalation or setuid executables
6. **Signal Restrictions**: Only managed processes can receive signals
7. **Audit Logging**: Complete operation tracking for forensics

### Configuration-Based Security

```typescript
interface SecurityConfig {
  // REQUIRED: Explicit allowlist of executables
  // Can be absolute paths, basenames, or glob patterns
  allowedExecutables: string[];
  
  // REQUIRED: Default resource limits applied to all processes
  defaultResourceLimits: ResourceLimits;
  
  // Maximum concurrent processes across all agents
  maxConcurrentProcesses: number; // default: 10
  
  // Maximum process lifetime (seconds)
  maxProcessLifetime: number; // default: 3600 (1 hour)
  
  // Blocked environment variables (in addition to hardcoded list)
  additionalBlockedEnvVars?: string[];
  
  // Allowed working directories (if empty, any directory allowed)
  allowedWorkingDirectories?: string[];
  
  // Enable audit logging
  enableAuditLog: boolean; // default: true
  
  // Require explicit confirmation for process launches
  requireConfirmation: boolean; // default: false
  
  // Block setuid/setgid executables
  blockSetuidExecutables: boolean; // default: true
  
  // Block shell interpreters (bash, sh, zsh, etc.)
  blockShellInterpreters: boolean; // default: true
}

interface ResourceLimits {
  maxCpuPercent?: number; // default: 80
  maxMemoryMB?: number; // default: 1024
  maxFileDescriptors?: number; // default: 1024
  maxCpuTime?: number; // seconds, default: 300
  maxProcesses?: number; // default: 10 (for process trees)
}
```

```typescript
class ProcessSecurityManager {
  private allowlist: Set<string>;
  private blockedEnvVars: Set<string>;
  private allowedWorkingDirs: Set<string>;
  private config: SecurityConfig;
  private launchCount: Map<string, number[]> = new Map();
  
  // Hardcoded dangerous environment variables (ALWAYS blocked)
  private readonly DANGEROUS_ENV_VARS = [
    'LD_PRELOAD',
    'LD_LIBRARY_PATH',
    'DYLD_INSERT_LIBRARIES',
    'DYLD_LIBRARY_PATH',
    'PATH', // Prevent PATH manipulation
    'PYTHONPATH',
    'NODE_PATH',
    'PERL5LIB',
    'RUBYLIB'
  ];
  
  // Hardcoded shell interpreters (blocked if blockShellInterpreters=true)
  private readonly SHELL_INTERPRETERS = [
    'bash', 'sh', 'zsh', 'fish', 'csh', 'tcsh', 'ksh',
    'cmd.exe', 'powershell.exe', 'pwsh.exe'
  ];
  
  // Hardcoded dangerous executables (ALWAYS blocked)
  private readonly DANGEROUS_EXECUTABLES = [
    'sudo', 'su', 'doas',
    'chmod', 'chown', 'chgrp',
    'rm', 'rmdir', // Prevent direct file deletion
    'dd', // Prevent disk operations
    'mkfs', 'fdisk', 'parted',
    'iptables', 'nft',
    'systemctl', 'service',
    'reboot', 'shutdown', 'halt'
  ];
  
  constructor(config: SecurityConfig) {
    this.config = config;
    this.allowlist = new Set(config.allowedExecutables);
    
    // Combine hardcoded and user-configured blocked env vars
    this.blockedEnvVars = new Set([
      ...this.DANGEROUS_ENV_VARS,
      ...(config.additionalBlockedEnvVars || [])
    ]);
    
    // Set up allowed working directories
    if (config.allowedWorkingDirectories && config.allowedWorkingDirectories.length > 0) {
      this.allowedWorkingDirs = new Set(
        config.allowedWorkingDirectories.map(d => path.resolve(d))
      );
    }
    
    // Validate allowlist is not empty
    if (this.allowlist.size === 0) {
      throw new Error('Executable allowlist cannot be empty');
    }
  }
  
  validateExecutable(executable: string, args: string[]): void {
    // 1. Resolve executable path
    const resolved = which.sync(executable, { nothrow: true });
    
    if (!resolved) {
      this.auditSecurityViolation('executable_not_found', executable);
      throw new SecurityError('Executable not found');
    }
    
    // 2. Check against dangerous executables (ALWAYS blocked)
    const basename = path.basename(resolved);
    if (this.DANGEROUS_EXECUTABLES.includes(basename)) {
      this.auditSecurityViolation('dangerous_executable', executable, resolved);
      throw new SecurityError('Executable is blocked for security reasons');
    }
    
    // 3. Check against shell interpreters (if configured)
    if (this.config.blockShellInterpreters && this.SHELL_INTERPRETERS.includes(basename)) {
      this.auditSecurityViolation('shell_interpreter', executable, resolved);
      throw new SecurityError('Shell interpreters are blocked');
    }
    
    // 4. Check for setuid/setgid (if configured)
    if (this.config.blockSetuidExecutables) {
      const stats = fs.statSync(resolved);
      const isSetuid = (stats.mode & fs.constants.S_ISUID) !== 0;
      const isSetgid = (stats.mode & fs.constants.S_ISGID) !== 0;
      
      if (isSetuid || isSetgid) {
        this.auditSecurityViolation('setuid_executable', executable, resolved);
        throw new SecurityError('Setuid/setgid executables are blocked');
      }
    }
    
    // 5. Check allowlist
    const isAllowed = Array.from(this.allowlist).some(pattern => {
      if (pattern.includes('*')) {
        return minimatch(resolved, pattern) || minimatch(basename, pattern);
      }
      return resolved === pattern || basename === pattern;
    });
    
    if (!isAllowed) {
      this.auditSecurityViolation('not_in_allowlist', executable, resolved);
      throw new SecurityError('Executable not in allowlist');
    }
    
    // 6. Validate arguments for injection attacks
    this.validateArguments(args);
  }
  
  validateArguments(args: string[]): void {
    for (const arg of args) {
      // Check for command injection patterns
      if (arg.includes('$(') || arg.includes('`') || arg.includes('|') || 
          arg.includes(';') || arg.includes('&') || arg.includes('\n')) {
        this.auditSecurityViolation('argument_injection', arg);
        throw new SecurityError('Argument contains suspicious characters');
      }
      
      // Check for path traversal in arguments
      if (arg.includes('../') || arg.includes('..\\')) {
        this.auditSecurityViolation('argument_traversal', arg);
        throw new SecurityError('Argument contains path traversal');
      }
    }
  }
  
  validateWorkingDirectory(cwd: string): void {
    if (!this.allowedWorkingDirs || this.allowedWorkingDirs.size === 0) {
      return; // No restrictions
    }
    
    const resolved = path.resolve(cwd);
    const isAllowed = Array.from(this.allowedWorkingDirs).some(allowed =>
      resolved.startsWith(allowed + path.sep) || resolved === allowed
    );
    
    if (!isAllowed) {
      this.auditSecurityViolation('working_directory_restricted', cwd, resolved);
      throw new SecurityError('Working directory not in allowed list');
    }
  }
  
  sanitizeEnvironment(env: Record<string, string>): Record<string, string> {
    const sanitized = { ...env };
    
    // 1. Remove blocked variables
    for (const blocked of this.blockedEnvVars) {
      if (sanitized[blocked]) {
        delete sanitized[blocked];
        this.auditSecurityViolation('env_var_blocked', blocked);
      }
    }
    
    // 2. Check for command injection in values
    for (const [key, value] of Object.entries(sanitized)) {
      if (value.includes('$(') || value.includes('`') || value.includes('\n')) {
        this.auditSecurityViolation('env_var_injection', key, value);
        throw new SecurityError(`Suspicious environment variable value: ${key}`);
      }
      
      // Check for excessively long values (potential buffer overflow)
      if (value.length > 4096) {
        this.auditSecurityViolation('env_var_too_long', key, `${value.length} bytes`);
        throw new SecurityError(`Environment variable too long: ${key}`);
      }
    }
    
    // 3. Limit total environment size
    const totalSize = Object.entries(sanitized)
      .reduce((sum, [k, v]) => sum + k.length + v.length, 0);
    
    if (totalSize > 65536) { // 64KB limit
      this.auditSecurityViolation('env_size_exceeded', `${totalSize} bytes`);
      throw new SecurityError('Total environment size exceeds limit');
    }
    
    return sanitized;
  }
  
  checkConcurrentLimit(): void {
    const running = Array.from(processes.values())
      .filter(p => p.state === 'running').length;
    
    if (running >= this.config.maxConcurrentProcesses) {
      this.auditSecurityViolation('concurrent_limit', `${running} processes`);
      throw new Error('Maximum concurrent processes reached');
    }
  }
  
  checkLaunchRateLimit(agentId: string): void {
    const now = Date.now();
    const launches = this.launchCount.get(agentId) || [];
    
    // Remove launches older than 1 minute
    const recent = launches.filter(t => now - t < 60000);
    
    // Limit to 10 launches per minute per agent
    if (recent.length >= 10) {
      this.auditSecurityViolation('launch_rate_limit', agentId, `${recent.length} launches/min`);
      throw new SecurityError('Process launch rate limit exceeded');
    }
    
    recent.push(now);
    this.launchCount.set(agentId, recent);
  }
  
  enforceResourceLimits(pid: number, limits: ResourceLimits): void {
    const stats = getProcessStats(pid);
    
    if (limits.maxCpuPercent && stats.cpuPercent > limits.maxCpuPercent) {
      this.auditSecurityViolation('cpu_limit_exceeded', pid.toString(), `${stats.cpuPercent}%`);
      killProcess(pid);
      throw new Error(`CPU limit exceeded: ${stats.cpuPercent}%`);
    }
    
    if (limits.maxMemoryMB && stats.memoryMB > limits.maxMemoryMB) {
      this.auditSecurityViolation('memory_limit_exceeded', pid.toString(), `${stats.memoryMB}MB`);
      killProcess(pid);
      throw new Error(`Memory limit exceeded: ${stats.memoryMB}MB`);
    }
  }
  
  enforceLifetimeLimit(pid: number, startTime: Date): void {
    const uptime = (Date.now() - startTime.getTime()) / 1000;
    
    if (uptime > this.config.maxProcessLifetime) {
      this.auditSecurityViolation('lifetime_exceeded', pid.toString(), `${uptime}s`);
      killProcess(pid);
      throw new Error(`Process lifetime exceeded: ${uptime}s`);
    }
  }
  
  validateSignalTarget(pid: number): void {
    // Only allow signals to managed processes
    if (!processes.has(pid)) {
      this.auditSecurityViolation('signal_to_unmanaged', pid.toString());
      throw new SecurityError('Cannot send signal to unmanaged process');
    }
  }
  
  private auditSecurityViolation(type: string, ...details: string[]): void {
    if (this.config.enableAuditLog) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'SECURITY_VIOLATION',
        type,
        details
      }));
    }
  }
  
  auditOperation(operation: string, executable: string, pid: number, result: string): void {
    if (this.config.enableAuditLog) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'AUDIT',
        operation,
        executable,
        pid,
        result
      }));
    }
  }
}
```

## MCP Tool Implementations

### Tool: process_start
```typescript
{
  name: 'process_start',
  description: 'Launch a new process',
  inputSchema: {
    type: 'object',
    properties: {
      executable: { type: 'string', required: true },
      args: { type: 'array', items: { type: 'string' } },
      cwd: { type: 'string' },
      env: { type: 'object' },
      timeout: { type: 'number' },
      captureOutput: { type: 'boolean', default: true },
      resourceLimits: { type: 'object' }
    }
  },
  async handler(args) {
    // Security checks
    validateExecutable(args.executable);
    checkConcurrentLimit();
    const sanitizedEnv = sanitizeEnvironment(args.env || {});
    
    // Spawn process
    const child = spawn(args.executable, args.args || [], {
      cwd: args.cwd,
      env: { ...process.env, ...sanitizedEnv },
      stdio: args.captureOutput ? ['pipe', 'pipe', 'pipe'] : 'inherit'
    });
    
    // Track process
    const managed: ManagedProcess = {
      pid: child.pid,
      command: args.executable,
      args: args.args || [],
      state: 'running',
      startTime: new Date(),
      stats: getInitialStats(),
      outputBuffer: [],
      errorBuffer: []
    };
    
    processes.set(child.pid, managed);
    
    // Capture output
    if (args.captureOutput) {
      child.stdout.on('data', data => managed.outputBuffer.push(data));
      child.stderr.on('data', data => managed.errorBuffer.push(data));
    }
    
    // Handle exit
    child.on('exit', (code, signal) => {
      managed.state = code === 0 ? 'stopped' : 'crashed';
      managed.exitCode = code;
    });
    
    // Set timeout
    if (args.timeout) {
      setTimeout(() => {
        if (managed.state === 'running') {
          child.kill('SIGTERM');
        }
      }, args.timeout);
    }
    
    // Monitor resources
    if (args.resourceLimits) {
      startResourceMonitoring(child.pid, args.resourceLimits);
    }
    
    return {
      status: 'success',
      pid: child.pid,
      startTime: managed.startTime.toISOString()
    };
  }
}
```

### Tool: process_terminate
```typescript
{
  name: 'process_terminate',
  description: 'Terminate a process',
  inputSchema: {
    type: 'object',
    properties: {
      pid: { type: 'number', required: true },
      force: { type: 'boolean', default: false },
      timeout: { type: 'number', default: 5000 }
    }
  },
  async handler(args) {
    const managed = processes.get(args.pid);
    if (!managed) {
      throw new Error('Process not found');
    }
    
    if (args.force) {
      // Force kill
      process.kill(args.pid, 'SIGKILL');
    } else {
      // Graceful termination
      process.kill(args.pid, 'SIGTERM');
      
      // Wait for exit or timeout
      await Promise.race([
        waitForExit(args.pid),
        sleep(args.timeout).then(() => {
          // Escalate to SIGKILL
          process.kill(args.pid, 'SIGKILL');
        })
      ]);
    }
    
    return {
      status: 'success',
      pid: args.pid,
      exitCode: managed.exitCode,
      terminationReason: args.force ? 'forced' : 'graceful'
    };
  }
}
```

### Tool: process_get_stats
```typescript
{
  name: 'process_get_stats',
  description: 'Get process resource usage statistics',
  inputSchema: {
    type: 'object',
    properties: {
      pid: { type: 'number', required: true },
      includeHistory: { type: 'boolean', default: false }
    }
  },
  async handler(args) {
    const managed = processes.get(args.pid);
    if (!managed) {
      throw new Error('Process not found');
    }
    
    const stats = await getProcessStats(args.pid);
    
    return {
      status: 'success',
      pid: args.pid,
      state: managed.state,
      uptime: Date.now() - managed.startTime.getTime(),
      stats: {
        cpuPercent: stats.cpuPercent,
        memoryMB: stats.memoryMB,
        threadCount: stats.threadCount,
        ioRead: stats.ioRead,
        ioWrite: stats.ioWrite
      },
      history: args.includeHistory ? getStatsHistory(args.pid) : undefined
    };
  }
}
```

### Tool: process_send_stdin
```typescript
{
  name: 'process_send_stdin',
  description: 'Send input to process stdin',
  inputSchema: {
    type: 'object',
    properties: {
      pid: { type: 'number', required: true },
      data: { type: 'string', required: true },
      encoding: { type: 'string', default: 'utf-8' }
    }
  },
  async handler(args) {
    const managed = processes.get(args.pid);
    if (!managed) {
      throw new Error('Process not found');
    }
    
    const child = getChildProcess(args.pid);
    if (!child.stdin || !child.stdin.writable) {
      throw new Error('Process stdin not available');
    }
    
    child.stdin.write(args.data, args.encoding);
    
    return {
      status: 'success',
      bytesWritten: Buffer.byteLength(args.data, args.encoding)
    };
  }
}
```

### Tool: process_get_output
```typescript
{
  name: 'process_get_output',
  description: 'Get captured process output',
  inputSchema: {
    type: 'object',
    properties: {
      pid: { type: 'number', required: true },
      stream: { type: 'string', enum: ['stdout', 'stderr', 'both'], default: 'both' },
      encoding: { type: 'string', default: 'utf-8' }
    }
  },
  async handler(args) {
    const managed = processes.get(args.pid);
    if (!managed) {
      throw new Error('Process not found');
    }
    
    const stdout = args.stream !== 'stderr' 
      ? Buffer.concat(managed.outputBuffer).toString(args.encoding)
      : '';
    
    const stderr = args.stream !== 'stdout'
      ? Buffer.concat(managed.errorBuffer).toString(args.encoding)
      : '';
    
    return {
      status: 'success',
      pid: args.pid,
      stdout,
      stderr,
      stdoutBytes: managed.outputBuffer.reduce((sum, buf) => sum + buf.length, 0),
      stderrBytes: managed.errorBuffer.reduce((sum, buf) => sum + buf.length, 0)
    };
  }
}
```

### Tool: process_create_group
```typescript
{
  name: 'process_create_group',
  description: 'Create a process group',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', required: true },
      pipeline: { type: 'boolean', default: false }
    }
  },
  async handler(args) {
    const groupId = generateId();
    
    processGroups.set(groupId, {
      id: groupId,
      name: args.name,
      processes: [],
      pipeline: args.pipeline
    });
    
    return {
      status: 'success',
      groupId,
      name: args.name
    };
  }
}
```

## Resource Monitoring Implementation

```typescript
import pidusage from 'pidusage';

class ResourceMonitor {
  private monitors: Map<number, NodeJS.Timer> = new Map();
  private history: Map<number, ProcessStats[]> = new Map();
  
  startMonitoring(pid: number, limits: ResourceLimits): void {
    const interval = setInterval(async () => {
      try {
        const stats = await pidusage(pid);
        
        const processStats: ProcessStats = {
          cpuPercent: stats.cpu,
          memoryMB: stats.memory / 1024 / 1024,
          threadCount: stats.threads || 1,
          ioRead: stats.ioRead || 0,
          ioWrite: stats.ioWrite || 0,
          uptime: stats.elapsed / 1000
        };
        
        // Store history
        const hist = this.history.get(pid) || [];
        hist.push(processStats);
        if (hist.length > 100) hist.shift(); // Keep last 100 samples
        this.history.set(pid, hist);
        
        // Check limits
        if (limits.maxCpuPercent && processStats.cpuPercent > limits.maxCpuPercent) {
          this.stopMonitoring(pid);
          process.kill(pid, 'SIGTERM');
          throw new Error(`CPU limit exceeded: ${processStats.cpuPercent}%`);
        }
        
        if (limits.maxMemoryMB && processStats.memoryMB > limits.maxMemoryMB) {
          this.stopMonitoring(pid);
          process.kill(pid, 'SIGTERM');
          throw new Error(`Memory limit exceeded: ${processStats.memoryMB}MB`);
        }
      } catch (error) {
        // Process may have exited
        this.stopMonitoring(pid);
      }
    }, 1000);
    
    this.monitors.set(pid, interval);
  }
  
  stopMonitoring(pid: number): void {
    const interval = this.monitors.get(pid);
    if (interval) {
      clearInterval(interval);
      this.monitors.delete(pid);
    }
  }
  
  getHistory(pid: number): ProcessStats[] {
    return this.history.get(pid) || [];
  }
}
```

## Service Management Implementation

```typescript
class ServiceManager {
  private services: Map<string, ServiceConfig> = new Map();
  private healthChecks: Map<string, NodeJS.Timer> = new Map();
  
  async startService(config: ServiceConfig): Promise<number> {
    const pid = await launchProcess(config);
    
    this.services.set(config.name, config);
    
    // Set up health check
    if (config.healthCheck) {
      this.startHealthCheck(config.name, pid, config.healthCheck);
    }
    
    // Set up auto-restart
    if (config.restartPolicy.enabled) {
      this.setupAutoRestart(config.name, pid, config);
    }
    
    return pid;
  }
  
  private startHealthCheck(name: string, pid: number, healthCheck: HealthCheckConfig): void {
    const interval = setInterval(async () => {
      try {
        const result = await execHealthCheck(healthCheck.command, healthCheck.timeout);
        if (!result.success) {
          console.log(`Health check failed for ${name}, restarting...`);
          await this.restartService(name);
        }
      } catch (error) {
        console.error(`Health check error for ${name}:`, error);
      }
    }, healthCheck.interval);
    
    this.healthChecks.set(name, interval);
  }
  
  private async restartService(name: string): Promise<void> {
    const config = this.services.get(name);
    if (!config) return;
    
    // Stop existing process
    const managed = Array.from(processes.values())
      .find(p => p.command === config.executable);
    
    if (managed) {
      process.kill(managed.pid, 'SIGTERM');
      await waitForExit(managed.pid);
    }
    
    // Start new process
    await this.startService(config);
  }
}
```

## Testing Strategy

### Unit Tests
- Test executable validation against allowlist
- Test environment variable sanitization
- Test resource limit enforcement
- Test output capture and buffering
- Test process group management
- Test service auto-restart logic

### Property-Based Tests
- Use fast-check library for TypeScript
- Each property test runs minimum 100 iterations
- Tag format: `// Feature: mcp-process, Property {number}: {property_text}`

### Integration Tests
- Test process launching with real executables
- Test resource monitoring with actual processes
- Test stdin/stdout/stderr I/O
- Test process termination (graceful and forced)
- Test security policy enforcement
- Test service health checks and restarts

## Performance Considerations

1. **Output Buffering**: Limit buffer size to prevent memory growth
2. **Resource Monitoring**: Sample at 1-second intervals
3. **Process Cleanup**: Reap zombie processes promptly
4. **Concurrent Limits**: Enforce to prevent resource exhaustion

## Security Considerations

### Critical Security Principles

1. **Executable Allowlist (MANDATORY)**
   - ONLY executables in the allowlist can be launched
   - The allowlist is set at server startup and CANNOT be modified at runtime
   - Empty allowlist = server refuses to start
   - Dangerous executables (sudo, rm, dd, etc.) are ALWAYS blocked

2. **Defense in Depth**
   - 6 layers of executable validation (see Security Implementation)
   - Hardcoded dangerous executable blocklist (cannot be overridden)
   - Hardcoded dangerous environment variable blocklist (cannot be overridden)
   - Argument injection prevention
   - Setuid/setgid executable blocking
   - Shell interpreter blocking (optional)

3. **Principle of Least Privilege**
   - No privilege escalation ever
   - Resource limits on all processes
   - Working directory restrictions (optional)
   - Process lifetime limits
   - Concurrent process limits

4. **Audit and Accountability**
   - All process launches logged with full command line
   - Security violations logged separately
   - Resource limit violations logged
   - Process terminations logged with reason

### Example Secure Configuration

```json
{
  "allowedExecutables": [
    "node",
    "python3",
    "npm",
    "yarn",
    "git",
    "/usr/bin/jest",
    "/usr/bin/eslint"
  ],
  "defaultResourceLimits": {
    "maxCpuPercent": 80,
    "maxMemoryMB": 1024,
    "maxFileDescriptors": 1024,
    "maxCpuTime": 300,
    "maxProcesses": 10
  },
  "maxConcurrentProcesses": 10,
  "maxProcessLifetime": 3600,
  "allowedWorkingDirectories": [
    "/home/user/projects/my-project"
  ],
  "enableAuditLog": true,
  "requireConfirmation": false,
  "blockSetuidExecutables": true,
  "blockShellInterpreters": true
}
```

### What AI Agents CANNOT Do

- Launch executables not in the allowlist
- Launch shell interpreters (bash, sh, etc.) if blocked
- Launch dangerous executables (sudo, rm, dd, etc.)
- Launch setuid/setgid executables
- Modify PATH or other dangerous environment variables
- Send signals to processes they didn't create
- Escalate privileges
- Bypass resource limits
- Launch unlimited concurrent processes
- Keep processes running indefinitely
- Execute command injection via arguments
- Access arbitrary working directories (if restricted)

### What AI Agents CAN Do (Within Allowlist)

- Launch approved executables with arguments
- Set safe environment variables
- Capture stdout/stderr
- Send stdin input
- Monitor resource usage
- Terminate processes they created
- Create process groups
- Set resource limits (within configured maximums)
- Manage long-running services with auto-restart

### Recommended Allowlist Examples

**For Node.js Development:**
```json
["node", "npm", "yarn", "npx", "jest", "eslint", "prettier", "tsc"]
```

**For Python Development:**
```json
["python3", "pip3", "pytest", "black", "flake8", "mypy"]
```

**For General Development:**
```json
["git", "node", "python3", "npm", "pip3", "make"]
```

**For Testing Only (Most Restrictive):**
```json
["jest", "pytest", "mocha"]
```

## Dependencies

- `pidusage`: Process resource usage monitoring
- `which`: Executable path resolution
- `minimatch`: Pattern matching for allowlist
- `@modelcontextprotocol/sdk`: MCP protocol implementation


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Process launch returns PID
*For any* valid executable in the allowlist with arguments, when launched, a process should be spawned and its PID returned.
**Validates: Requirements 1.1**

### Property 2: Allowlist enforcement on launch
*For any* executable not in the allowlist, launch attempts should be rejected with a security error.
**Validates: Requirements 1.4, 11.2, 14.2**

### Property 3: Process statistics completeness
*For any* running process, when statistics are requested, the response should include CPU usage, memory usage, and thread count.
**Validates: Requirements 2.1**

### Property 4: Output capture separation
*For any* process with output capture enabled, stdout and stderr should be buffered separately and retrievable independently.
**Validates: Requirements 3.1**

### Property 5: Output flush on termination
*For any* process that terminates, all buffered output should be flushed and available for retrieval.
**Validates: Requirements 3.5**

### Property 6: Stdin data delivery
*For any* process with stdin available, when data is sent, that data should be written to the process's stdin stream.
**Validates: Requirements 4.1**

### Property 7: Graceful termination sends SIGTERM
*For any* process, when graceful termination is requested, SIGTERM (or platform equivalent) should be sent to the process.
**Validates: Requirements 5.1**

### Property 8: Timeout escalation to SIGKILL
*For any* graceful termination with timeout, if the process doesn't exit within the timeout, SIGKILL should be sent.
**Validates: Requirements 5.3**

### Property 9: Process status completeness
*For any* process, when status is queried, the response should include running state, uptime, and resource usage.
**Validates: Requirements 6.1**

### Property 10: Process list completeness
*For any* process list request, all managed processes should be returned with their PIDs, commands, and states.
**Validates: Requirements 6.2**

### Property 11: Resource limit enforcement
*For any* process with resource limits, when a limit is exceeded, the process should be terminated with a resource-limit-exceeded error.
**Validates: Requirements 7.4**

### Property 12: Auto-restart on crash
*For any* service with auto-restart enabled, when the service crashes, it should be automatically restarted.
**Validates: Requirements 8.2**

### Property 13: Timeout enforcement
*For any* process with a timeout, when the timeout is exceeded, the process should be terminated.
**Validates: Requirements 9.1**

### Property 14: Process group termination
*For any* process group, when group termination is requested, all processes in the group should be terminated.
**Validates: Requirements 10.4**

### Property 15: Environment variable sanitization
*For any* process launch with environment variables, dangerous variables (LD_PRELOAD, etc.) should be removed or rejected.
**Validates: Requirements 11.4**

### Property 16: Process information completeness
*For any* process information request, the response should include PID, command, state, uptime, and resource usage.
**Validates: Requirements 13.3**

### Property 17: Concurrent process limit enforcement
*For any* configured maximum concurrent processes, when that limit is reached, new launch requests should be rejected.
**Validates: Requirements 14.3**
