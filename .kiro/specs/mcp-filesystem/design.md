# MCP Filesystem - Design Document

## Overview

The MCP Filesystem server provides AI agents with advanced file operations beyond basic read/write, including batch operations, directory watching, file search/indexing, and permission management, all within strict security boundaries.

## Architecture

```
┌─────────────────┐
│   AI Agent      │
│   (Kiro)        │
└────────┬────────┘
         │ MCP Protocol
         │
┌────────▼────────┐
│ MCP Filesystem  │
│     Server      │
└────────┬────────┘
         │ Node.js fs APIs
         ├──────────────────┬──────────────┬──────────────┐
         │                  │              │              │
┌────────▼────────┐ ┌──────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
│  Batch Ops      │ │Dir Watcher  │ │  Search  │ │  Security  │
└─────────────────┘ └─────────────┘ └──────────┘ └────────────┘
```

## Core Components

### 1. MCP Server
- Implements MCP protocol
- Exposes filesystem tools
- Manages operations
- Enforces security policies

### 2. Batch Operation Manager
- Executes multiple operations atomically
- Handles rollback on failure
- Tracks operation progress
- Returns detailed results

### 3. Directory Watcher
- Monitors filesystem changes
- Filters events by pattern
- Manages watch sessions
- Handles recursive watching

### 4. Search Engine
- Indexes file metadata and content
- Performs fast searches
- Supports pattern matching
- Maintains search index

### 5. Permission Manager
- Manages file permissions
- Handles ownership changes
- Sets file attributes
- Validates permission operations

### 6. Security Manager
- Validates all paths against workspace root
- Prevents path traversal attacks
- Enforces blocklists
- Applies rate limiting
- Manages audit logging

## Data Models

```typescript
interface WorkspaceConfig {
  root: string;
  allowedPaths: string[];
  blockedPaths: string[];
  maxOperationsPerMinute: number;
  enableAuditLog: boolean;
}

interface BatchOperation {
  type: 'copy' | 'move' | 'delete';
  source: string;
  destination?: string;
}

interface WatchSession {
  id: string;
  path: string;
  recursive: boolean;
  filters: string[];
  events: FileSystemEvent[];
}

interface FileSystemEvent {
  type: 'create' | 'modify' | 'delete' | 'rename';
  path: string;
  timestamp: Date;
  oldPath?: string; // for rename events
}

interface FileIndex {
  files: Map<string, FileMetadata>;
  lastUpdate: Date;
  totalSize: number;
  fileCount: number;
}

interface FileMetadata {
  path: string;
  size: number;
  mtime: Date;
  type: string;
  checksum?: string;
  content?: string; // for indexed text files
}
```

## Security Implementation

### Multi-Layer Security Architecture

The filesystem server implements defense-in-depth with multiple security layers:

1. **Workspace Jail**: All operations confined to a single workspace root directory
2. **Path Validation**: Multiple checks to prevent escaping the workspace
3. **Blocklists**: Explicit denial of sensitive paths
4. **Operation Limits**: Rate limiting and size constraints
5. **Audit Logging**: Complete operation tracking for forensics

### Configuration-Based Security

```typescript
interface SecurityConfig {
  // REQUIRED: Workspace root - all operations confined to this directory
  workspaceRoot: string;
  
  // REQUIRED: Explicit allowlist of subdirectories within workspace
  // If empty, entire workspace is accessible
  allowedSubdirectories?: string[];
  
  // Paths that are explicitly blocked (e.g., .git, .env, node_modules)
  blockedPaths: string[];
  
  // Blocked file patterns (e.g., *.key, *.pem, *.env)
  blockedPatterns: string[];
  
  // Maximum file size for operations (bytes)
  maxFileSize: number; // default: 100MB
  
  // Maximum total size for batch operations (bytes)
  maxBatchSize: number; // default: 1GB
  
  // Maximum operations per minute per agent
  maxOperationsPerMinute: number; // default: 100
  
  // Enable audit logging
  enableAuditLog: boolean; // default: true
  
  // Require explicit confirmation for destructive operations
  requireConfirmation: boolean; // default: true
  
  // Read-only mode (no write/delete operations)
  readOnly: boolean; // default: false
}
```

```typescript
class FilesystemSecurityManager {
  private workspaceRoot: string;
  private allowedSubdirectories: Set<string>;
  private blockedPaths: Set<string>;
  private blockedPatterns: RegExp[];
  private operationCount: Map<string, number[]> = new Map();
  private config: SecurityConfig;
  
  // Hardcoded system paths that are ALWAYS blocked
  private readonly SYSTEM_PATHS = [
    '/etc', '/sys', '/proc', '/dev', '/boot', '/root',
    'C:\\Windows', 'C:\\Program Files', 'C:\\Program Files (x86)',
    '/System', '/Library', '/Applications', // macOS
    '/bin', '/sbin', '/usr/bin', '/usr/sbin'
  ];
  
  // Hardcoded sensitive file patterns that are ALWAYS blocked
  private readonly SENSITIVE_PATTERNS = [
    /\.ssh\//,
    /\.aws\//,
    /\.kube\//,
    /id_rsa/,
    /\.pem$/,
    /\.key$/,
    /\.p12$/,
    /\.pfx$/,
    /password/i,
    /secret/i,
    /token/i,
    /\.env$/
  ];
  
  constructor(config: SecurityConfig) {
    this.config = config;
    this.workspaceRoot = path.resolve(config.workspaceRoot);
    
    // Validate workspace root exists and is a directory
    if (!fs.existsSync(this.workspaceRoot)) {
      throw new Error('Workspace root does not exist');
    }
    
    // Set up allowed subdirectories
    if (config.allowedSubdirectories && config.allowedSubdirectories.length > 0) {
      this.allowedSubdirectories = new Set(
        config.allowedSubdirectories.map(p => path.resolve(this.workspaceRoot, p))
      );
    }
    
    // Set up blocklists
    this.blockedPaths = new Set(config.blockedPaths.map(p => path.resolve(this.workspaceRoot, p)));
    this.blockedPatterns = config.blockedPatterns.map(p => new RegExp(p));
  }
  
  validatePath(filePath: string, operation: 'read' | 'write' | 'delete'): string {
    // 1. Resolve to absolute path (prevents relative path tricks)
    const resolved = path.resolve(this.workspaceRoot, filePath);
    
    // 2. Check workspace boundary (CRITICAL)
    if (!resolved.startsWith(this.workspaceRoot + path.sep) && resolved !== this.workspaceRoot) {
      this.auditSecurityViolation('workspace_escape', filePath, resolved);
      throw new SecurityError('Path traversal detected - path outside workspace');
    }
    
    // 3. Check for path traversal sequences
    if (filePath.includes('..') || filePath.includes('./') || filePath.includes('.\\')) {
      this.auditSecurityViolation('path_traversal', filePath, resolved);
      throw new SecurityError('Path contains traversal sequences');
    }
    
    // 4. Check against system paths (ALWAYS blocked)
    for (const systemPath of this.SYSTEM_PATHS) {
      if (resolved.startsWith(systemPath)) {
        this.auditSecurityViolation('system_path_access', filePath, resolved);
        throw new SecurityError('Cannot access system directories');
      }
    }
    
    // 5. Check against sensitive patterns (ALWAYS blocked)
    for (const pattern of this.SENSITIVE_PATTERNS) {
      if (pattern.test(resolved)) {
        this.auditSecurityViolation('sensitive_file_access', filePath, resolved);
        throw new SecurityError('Cannot access sensitive files');
      }
    }
    
    // 6. Check allowed subdirectories (if configured)
    if (this.allowedSubdirectories && this.allowedSubdirectories.size > 0) {
      const isAllowed = Array.from(this.allowedSubdirectories).some(allowed =>
        resolved.startsWith(allowed + path.sep) || resolved === allowed
      );
      
      if (!isAllowed) {
        this.auditSecurityViolation('subdirectory_restriction', filePath, resolved);
        throw new SecurityError('Path not in allowed subdirectories');
      }
    }
    
    // 7. Check user-configured blocklist
    for (const blocked of this.blockedPaths) {
      if (resolved.startsWith(blocked)) {
        this.auditSecurityViolation('blocked_path', filePath, resolved);
        throw new SecurityError('Path is blocked by security policy');
      }
    }
    
    // 8. Check user-configured patterns
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(resolved)) {
        this.auditSecurityViolation('blocked_pattern', filePath, resolved);
        throw new SecurityError('Path matches blocked pattern');
      }
    }
    
    // 9. Check read-only mode
    if (this.config.readOnly && (operation === 'write' || operation === 'delete')) {
      throw new SecurityError('Filesystem is in read-only mode');
    }
    
    // 10. Resolve symlinks and validate target
    if (fs.existsSync(resolved)) {
      const stats = fs.lstatSync(resolved);
      if (stats.isSymbolicLink()) {
        const target = fs.readlinkSync(resolved);
        const resolvedTarget = path.resolve(path.dirname(resolved), target);
        
        // Recursively validate symlink target
        this.validatePath(resolvedTarget, operation);
      }
    }
    
    return resolved;
  }
  
  validateSymlink(linkPath: string, targetPath: string): void {
    const resolvedLink = this.validatePath(linkPath, 'write');
    const resolvedTarget = path.resolve(path.dirname(resolvedLink), targetPath);
    
    // Ensure symlink target is within workspace
    if (!resolvedTarget.startsWith(this.workspaceRoot + path.sep)) {
      this.auditSecurityViolation('symlink_escape', linkPath, resolvedTarget);
      throw new SecurityError('Symlink target outside workspace');
    }
    
    // Validate target path through normal validation
    this.validatePath(resolvedTarget, 'read');
  }
  
  validateFileSize(size: number): void {
    if (size > this.config.maxFileSize) {
      throw new SecurityError(`File size ${size} exceeds maximum ${this.config.maxFileSize}`);
    }
  }
  
  validateBatchSize(totalSize: number): void {
    if (totalSize > this.config.maxBatchSize) {
      throw new SecurityError(`Batch size ${totalSize} exceeds maximum ${this.config.maxBatchSize}`);
    }
  }
  
  checkRateLimit(agentId: string): void {
    const now = Date.now();
    const ops = this.operationCount.get(agentId) || [];
    
    // Remove operations older than 1 minute
    const recent = ops.filter(t => now - t < 60000);
    
    if (recent.length >= this.config.maxOperationsPerMinute) {
      this.auditSecurityViolation('rate_limit', agentId, `${recent.length} ops/min`);
      throw new SecurityError('Rate limit exceeded');
    }
    
    recent.push(now);
    this.operationCount.set(agentId, recent);
  }
  
  private auditSecurityViolation(type: string, input: string, resolved: string): void {
    if (this.config.enableAuditLog) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'SECURITY_VIOLATION',
        type,
        input,
        resolved,
        workspaceRoot: this.workspaceRoot
      }));
    }
  }
  
  auditOperation(operation: string, paths: string[], result: string): void {
    if (this.config.enableAuditLog) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'AUDIT',
        operation,
        paths,
        result
      }));
    }
  }
}
```

## MCP Tool Implementations

### Tool: fs_batch_operations
```typescript
{
  name: 'fs_batch_operations',
  description: 'Execute multiple filesystem operations atomically',
  inputSchema: {
    type: 'object',
    properties: {
      operations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['copy', 'move', 'delete'] },
            source: { type: 'string' },
            destination: { type: 'string' }
          }
        }
      },
      atomic: { type: 'boolean', default: true }
    }
  },
  async handler(args) {
    // Validate all paths first
    for (const op of args.operations) {
      validatePath(op.source);
      if (op.destination) {
        validatePath(op.destination);
      }
    }
    
    const results = [];
    const completed = [];
    
    try {
      for (const op of args.operations) {
        const result = await executeOperation(op);
        results.push(result);
        completed.push(op);
      }
      
      return {
        status: 'success',
        results
      };
    } catch (error) {
      // Rollback if atomic
      if (args.atomic) {
        await rollbackOperations(completed);
      }
      throw error;
    }
  }
}
```

### Tool: fs_watch_directory
```typescript
{
  name: 'fs_watch_directory',
  description: 'Watch directory for filesystem changes',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', required: true },
      recursive: { type: 'boolean', default: false },
      filters: { type: 'array', items: { type: 'string' } }
    }
  },
  async handler(args) {
    const validPath = validatePath(args.path);
    
    const sessionId = generateId();
    const watcher = fs.watch(validPath, { recursive: args.recursive }, (eventType, filename) => {
      if (shouldIncludeEvent(filename, args.filters)) {
        recordEvent(sessionId, {
          type: eventType,
          path: path.join(validPath, filename),
          timestamp: new Date()
        });
      }
    });
    
    watchSessions.set(sessionId, {
      id: sessionId,
      path: validPath,
      watcher,
      events: []
    });
    
    return {
      status: 'success',
      sessionId
    };
  }
}
```

### Tool: fs_search_files
```typescript
{
  name: 'fs_search_files',
  description: 'Search for files by name, content, or metadata',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      searchType: { type: 'string', enum: ['name', 'content', 'both'] },
      fileTypes: { type: 'array', items: { type: 'string' } },
      minSize: { type: 'number' },
      maxSize: { type: 'number' },
      modifiedAfter: { type: 'string' },
      useIndex: { type: 'boolean', default: true }
    }
  },
  async handler(args) {
    if (args.useIndex && fileIndex) {
      return await searchIndex(args);
    } else {
      return await searchFilesystem(args);
    }
  }
}
```

### Tool: fs_compute_checksum
```typescript
{
  name: 'fs_compute_checksum',
  description: 'Compute file checksum',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', required: true },
      algorithm: { type: 'string', enum: ['md5', 'sha1', 'sha256', 'sha512'], default: 'sha256' }
    }
  },
  async handler(args) {
    const validPath = validatePath(args.path);
    
    const hash = crypto.createHash(args.algorithm);
    const stream = fs.createReadStream(validPath);
    
    return new Promise((resolve, reject) => {
      stream.on('data', data => hash.update(data));
      stream.on('end', () => {
        resolve({
          status: 'success',
          path: validPath,
          algorithm: args.algorithm,
          checksum: hash.digest('hex')
        });
      });
      stream.on('error', reject);
    });
  }
}
```

## Directory Watching Implementation

```typescript
import chokidar from 'chokidar';

class DirectoryWatcher {
  private watchers: Map<string, chokidar.FSWatcher> = new Map();
  private sessions: Map<string, WatchSession> = new Map();
  
  async watch(sessionId: string, dirPath: string, options: WatchOptions): Promise<void> {
    const watcher = chokidar.watch(dirPath, {
      recursive: options.recursive,
      ignoreInitial: true,
      ignored: options.filters
    });
    
    const session: WatchSession = {
      id: sessionId,
      path: dirPath,
      recursive: options.recursive,
      filters: options.filters || [],
      events: []
    };
    
    watcher
      .on('add', path => this.recordEvent(sessionId, 'create', path))
      .on('change', path => this.recordEvent(sessionId, 'modify', path))
      .on('unlink', path => this.recordEvent(sessionId, 'delete', path))
      .on('addDir', path => this.recordEvent(sessionId, 'create', path))
      .on('unlinkDir', path => this.recordEvent(sessionId, 'delete', path));
    
    this.watchers.set(sessionId, watcher);
    this.sessions.set(sessionId, session);
  }
  
  private recordEvent(sessionId: string, type: string, filePath: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.events.push({
        type: type as any,
        path: filePath,
        timestamp: new Date()
      });
    }
  }
  
  async stopWatch(sessionId: string): Promise<void> {
    const watcher = this.watchers.get(sessionId);
    if (watcher) {
      await watcher.close();
      this.watchers.delete(sessionId);
      this.sessions.delete(sessionId);
    }
  }
}
```

## File Indexing Implementation

```typescript
import lunr from 'lunr';

class FileIndexer {
  private index: lunr.Index;
  private files: Map<string, FileMetadata> = new Map();
  
  async buildIndex(rootPath: string): Promise<void> {
    const files = await this.scanDirectory(rootPath);
    
    this.index = lunr(function() {
      this.ref('path');
      this.field('name');
      this.field('content');
      this.field('type');
      
      files.forEach(file => {
        this.add(file);
      });
    });
    
    files.forEach(file => {
      this.files.set(file.path, file);
    });
  }
  
  async scanDirectory(dirPath: string): Promise<FileMetadata[]> {
    const files: FileMetadata[] = [];
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...await this.scanDirectory(fullPath));
      } else {
        const stats = await fs.promises.stat(fullPath);
        const metadata: FileMetadata = {
          path: fullPath,
          size: stats.size,
          mtime: stats.mtime,
          type: path.extname(entry.name)
        };
        
        // Index text file content
        if (this.isTextFile(entry.name) && stats.size < 1024 * 1024) {
          metadata.content = await fs.promises.readFile(fullPath, 'utf-8');
        }
        
        files.push(metadata);
      }
    }
    
    return files;
  }
  
  search(query: string): FileMetadata[] {
    const results = this.index.search(query);
    return results.map(r => this.files.get(r.ref)).filter(Boolean);
  }
}
```

## Testing Strategy

### Unit Tests
- Test path validation with various inputs
- Test batch operation rollback
- Test directory watching event filtering
- Test file search with different criteria
- Test checksum computation
- Test symlink validation

### Property-Based Tests
- Use fast-check library for TypeScript
- Each property test runs minimum 100 iterations
- Tag format: `// Feature: mcp-filesystem, Property {number}: {property_text}`

### Integration Tests
- Test batch operations with real files
- Test directory watching with file changes
- Test file indexing and search
- Test security policy enforcement
- Test symlink creation and resolution

## Performance Considerations

1. **Batch Operations**: Execute in parallel when possible
2. **Indexing**: Use incremental updates
3. **Watching**: Debounce rapid events
4. **Search**: Cache recent queries

## Security Considerations

### Critical Security Principles

1. **Workspace Jail (MANDATORY)**
   - ALL operations MUST be confined to a single workspace root directory
   - The workspace root is set at server startup and CANNOT be changed
   - Any path that resolves outside the workspace is REJECTED
   - Symlinks pointing outside the workspace are REJECTED

2. **Defense in Depth**
   - 10 layers of path validation (see Security Implementation)
   - Hardcoded system path blocklist (cannot be overridden)
   - Hardcoded sensitive file pattern blocklist (cannot be overridden)
   - User-configurable additional blocklists
   - Symlink target validation

3. **Principle of Least Privilege**
   - Optional subdirectory restrictions within workspace
   - Read-only mode available
   - Explicit confirmation for destructive operations
   - File size limits to prevent disk exhaustion

4. **Audit and Accountability**
   - All operations logged with timestamps
   - Security violations logged separately
   - Path resolution logged for forensics
   - Rate limiting to prevent abuse

### Example Secure Configuration

```json
{
  "workspaceRoot": "/home/user/projects/my-project",
  "allowedSubdirectories": [
    "src",
    "tests",
    "docs"
  ],
  "blockedPaths": [
    ".git",
    ".env",
    "node_modules",
    ".ssh"
  ],
  "blockedPatterns": [
    "*.key",
    "*.pem",
    "*.env",
    "*secret*",
    "*password*"
  ],
  "maxFileSize": 104857600,
  "maxBatchSize": 1073741824,
  "maxOperationsPerMinute": 100,
  "enableAuditLog": true,
  "requireConfirmation": true,
  "readOnly": false
}
```

### What AI Agents CANNOT Do

- Access files outside the workspace root
- Access system directories (/etc, /sys, /proc, C:\Windows, etc.)
- Access SSH keys, AWS credentials, or other sensitive files
- Create symlinks pointing outside the workspace
- Bypass rate limits
- Disable audit logging
- Modify the workspace root
- Access files matching sensitive patterns (*.key, *.pem, etc.)

### What AI Agents CAN Do (Within Workspace)

- Read, write, and delete files
- Create and navigate directories
- Search for files by name or content
- Watch directories for changes
- Compute checksums
- Create symlinks (within workspace)
- Batch operations
- Sync directories

## Dependencies

- `chokidar`: Directory watching
- `lunr`: Full-text search indexing
- `fast-glob`: Fast file pattern matching
- `@modelcontextprotocol/sdk`: MCP protocol implementation


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Batch copy completeness
*For any* list of valid file copy operations, all files should be copied and results returned for each operation.
**Validates: Requirements 1.1**

### Property 2: Atomic batch operations
*For any* batch of file move operations with atomic flag, either all operations should succeed or all should be rolled back.
**Validates: Requirements 1.2**

### Property 3: Directory watching event detection
*For any* watched directory, when files are created, modified, deleted, or renamed, those events should be detected and reported.
**Validates: Requirements 2.1**

### Property 4: Event filtering accuracy
*For any* watch session with event filters, only events matching the filter patterns should be reported.
**Validates: Requirements 2.4**

### Property 5: File search completeness
*For any* filename pattern, all files matching that pattern should be returned in search results.
**Validates: Requirements 3.1**

### Property 6: Indexed search performance
*For any* indexed search query, results should be returned within 100ms for typical queries (< 10,000 files).
**Validates: Requirements 3.5**

### Property 7: Index update on file changes
*For any* file change in an indexed directory, the index should be updated and subsequent searches should reflect the change.
**Validates: Requirements 4.3**

### Property 8: Symlink creation correctness
*For any* valid symlink request with target within workspace, a symlink should be created pointing to the specified target.
**Validates: Requirements 6.1**

### Property 9: Symlink target validation
*For any* symlink creation request with target outside workspace, the operation should be rejected with a security error.
**Validates: Requirements 6.4**

### Property 10: Checksum computation accuracy
*For any* file and hash algorithm, the computed checksum should match the expected hash for that file and algorithm.
**Validates: Requirements 7.1**

### Property 11: Checksum verification correctness
*For any* file and provided checksum, verification should return success if checksums match and failure if they don't.
**Validates: Requirements 7.2**

### Property 12: Workspace boundary enforcement
*For any* file path, operations should only succeed if the resolved path is within the workspace root.
**Validates: Requirements 9.1**

### Property 13: Path traversal prevention
*For any* path containing traversal sequences (..), the operation should be rejected with a path validation error.
**Validates: Requirements 9.2**

### Property 14: Atomic file replacement
*For any* atomic file replacement, the operation should be atomic (no partial writes visible to other processes).
**Validates: Requirements 9.5**

### Property 15: Recursive copy completeness
*For any* directory copy operation, all files and subdirectories should be copied to the destination.
**Validates: Requirements 10.1**

### Property 16: Sync operation efficiency
*For any* sync operation, only files that are newer or missing in the destination should be copied.
**Validates: Requirements 10.2**

### Property 17: Workspace root enforcement at startup
*For any* MCP Server instance, operations outside the configured workspace root should be rejected.
**Validates: Requirements 11.1**

### Property 18: Symlink security enforcement
*For any* symbolic link pointing outside the workspace, operations on that link should be rejected.
**Validates: Requirements 11.2**
