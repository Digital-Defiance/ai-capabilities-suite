# Design Document: LSP Integration for MCP Screenshot

## Overview

This design adds Language Server Protocol (LSP) capabilities to the existing MCP Screenshot VSCode extension. The LSP will provide intelligent code assistance including hover information, code lenses, diagnostics, code completion, and command execution for screenshot-related operations. The implementation follows the same pattern used in the mcp-debugger extension, integrating seamlessly with the existing MCPScreenshotClient and extension architecture.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VSCode Extension                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           extension.ts (existing)                     │   │
│  │  - Manages MCP Client lifecycle                       │   │
│  │  - Registers commands                                 │   │
│  │  - NEW: Starts Language Server                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                    │
│         ┌────────────────┴────────────────┐                  │
│         │                                  │                  │
│  ┌──────▼──────────┐            ┌─────────▼────────┐        │
│  │  MCPScreenshot  │            │  Language Server │        │
│  │     Client      │◄───────────┤  (languageServer.ts)      │
│  │   (existing)    │            │      (NEW)        │        │
│  └─────────────────┘            └───────────────────┘        │
│         │                                  │                  │
└─────────┼──────────────────────────────────┼─────────────────┘
          │                                  │
          │                                  │
    ┌─────▼──────┐                    ┌─────▼──────┐
    │    MCP     │                    │   VSCode   │
    │ Screenshot │                    │   Editor   │
    │   Server   │                    │  Features  │
    └────────────┘                    └────────────┘
```

### Component Interaction Flow

1. **Extension Activation**: The extension starts the MCP client and language server
2. **Language Server Initialization**: LSP connects to VSCode and registers capabilities
3. **Document Events**: LSP receives document open/change events from VSCode
4. **Feature Provision**: LSP analyzes code and provides hover, completion, diagnostics, code lenses
5. **Command Execution**: LSP delegates screenshot commands to the MCP client
6. **Extension Deactivation**: Both MCP client and language server shut down cleanly

## Components and Interfaces

### 1. Language Server (languageServer.ts) - NEW

The main LSP implementation that provides all language intelligence features.

```typescript
interface LanguageServerCapabilities {
  textDocumentSync: TextDocumentSyncKind;
  completionProvider: CompletionOptions;
  hoverProvider: boolean;
  codeLensProvider: CodeLensOptions;
  executeCommandProvider: ExecuteCommandOptions;
}

interface ScreenshotPattern {
  type: 'capture' | 'list_displays' | 'list_windows' | 'region';
  location: Range;
  parameters?: Record<string, any>;
}
```

**Key Responsibilities:**
- Initialize LSP connection with VSCode
- Listen to document lifecycle events
- Provide hover information for screenshot APIs
- Generate code lenses for quick actions
- Validate screenshot parameters and generate diagnostics
- Provide code completion for screenshot options
- Execute commands from AI agents or UI

### 2. Extension Integration (extension.ts) - MODIFIED

Extends the existing extension to start and manage the language server.

```typescript
interface ExtensionState {
  mcpClient: MCPScreenshotClient | undefined;
  languageClient: LanguageClient | undefined;
  outputChannel: OutputChannel;
}

function startLanguageServer(context: ExtensionContext): Promise<void>;
function getMCPClient(): MCPScreenshotClient | undefined;
```

**Key Responsibilities:**
- Start language server during activation
- Provide MCP client reference to language server
- Handle language server lifecycle
- Maintain backward compatibility with existing commands

### 3. MCP Client Accessor - NEW

A module to safely access the MCP client from the language server.

```typescript
interface MCPClientAccessor {
  getClient(): MCPScreenshotClient | undefined;
  setClient(client: MCPScreenshotClient): void;
  isAvailable(): boolean;
}
```

## Data Models

### Screenshot Configuration

```typescript
interface ScreenshotConfig {
  format: 'png' | 'jpeg' | 'webp';
  quality?: number; // 0-100
  enablePIIMasking?: boolean;
  savePath?: string;
}

interface CaptureRegionParams {
  x: number;
  y: number;
  width: number;
  height: number;
  format: string;
}

interface CaptureWindowParams {
  windowId?: string;
  windowTitle?: string;
  format: string;
  includeFrame?: boolean;
}
```

### LSP Data Models

```typescript
interface DiagnosticInfo {
  severity: DiagnosticSeverity;
  message: string;
  range: Range;
  source: string;
  code?: string;
}

interface CompletionItemData {
  label: string;
  kind: CompletionItemKind;
  documentation: string;
  insertText: string;
}

interface CodeLensData {
  range: Range;
  command: Command;
  title: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing all testable properties from the prework, I've identified the following consolidations:

**Redundancies Identified:**
- Properties 2.1, 2.2, 2.3 can be combined into one property about code lens generation for different patterns
- Properties 5.2 and 5.3 can be combined into one property about parameter-specific completions
- Properties 7.1, 7.2, 7.4 can be combined into one property about supported file types
- Properties 8.1, 8.2, 8.3, 8.4 can be combined into one property about pattern detection and feature provision

**Consolidated Properties:**
- Code lens generation: One property covering all screenshot-related patterns
- Completion suggestions: One property covering all parameter types
- File type support: One property covering all supported languages
- Pattern detection: One property covering all pattern types and their corresponding features

Property 1: Hover information for screenshot APIs
*For any* screenshot function call or configuration object in the code, hovering should return formatted markdown documentation with parameters, types, and examples
**Validates: Requirements 1.1, 1.2, 1.4**

Property 2: Hover information for identifiers
*For any* display or window identifier, hovering should return information about that resource when available, or handle absence gracefully
**Validates: Requirements 1.3**

Property 3: Code lens generation for screenshot patterns
*For any* screenshot-related code pattern (capture, list displays, list windows), the LSP should generate appropriate code lenses with correct actions and positioning
**Validates: Requirements 2.1, 2.2, 2.3, 2.5**

Property 4: Code lens execution
*For any* code lens action click, the LSP should execute the corresponding MCP Screenshot command
**Validates: Requirements 2.4**

Property 5: Invalid format diagnostics
*For any* screenshot format value that is not 'png', 'jpeg', or 'webp', the LSP should create a warning diagnostic with valid options
**Validates: Requirements 3.1**

Property 6: Quality range diagnostics
*For any* quality parameter value outside the range 0-100, the LSP should create an error diagnostic
**Validates: Requirements 3.2**

Property 7: Missing parameter diagnostics
*For any* screenshot function call with missing required parameters, the LSP should create an error diagnostic
**Validates: Requirements 3.3**

Property 8: Deprecated API diagnostics
*For any* deprecated screenshot API usage, the LSP should create an informational diagnostic with migration guidance
**Validates: Requirements 3.4**

Property 9: Diagnostic completeness
*For any* diagnostic created, it should include a valid range, non-empty message, and suggested fixes
**Validates: Requirements 3.5**

Property 10: Command execution with parameters
*For any* AI agent command request (capture, listDisplays, listWindows, getCapabilities), the LSP should execute it with the provided parameters and return the expected result format
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

Property 11: Command error handling
*For any* command execution that fails, the LSP should return a structured error with error code and message
**Validates: Requirements 4.5**

Property 12: Configuration completion
*For any* position within a screenshot configuration object, the LSP should provide completion items for valid properties with documentation
**Validates: Requirements 5.1, 5.4**

Property 13: Parameter-specific completion
*For any* format or quality parameter position, the LSP should suggest valid values (png/jpeg/webp for format, 80/90/95/100 for quality)
**Validates: Requirements 5.2, 5.3**

Property 14: Completion insertion
*For any* selected completion item, the LSP should insert correct syntax with proper formatting
**Validates: Requirements 5.5**

Property 15: MCP client delegation
*For any* LSP command execution, it should delegate to the existing MCP Screenshot client's methods
**Validates: Requirements 6.3**

Property 16: Client state synchronization
*For any* MCP Screenshot client state change, the LSP should update its capabilities accordingly
**Validates: Requirements 6.4**

Property 17: Backward compatibility
*For any* existing extension command, it should continue to work unchanged after LSP integration
**Validates: Requirements 6.6**

Property 18: File type support
*For any* supported file type (JavaScript, TypeScript, JSX, TSX), the LSP should provide screenshot-related features
**Validates: Requirements 7.1, 7.2, 7.4**

Property 19: JSON configuration validation
*For any* JSON configuration file, the LSP should provide screenshot configuration validation
**Validates: Requirements 7.3**

Property 20: Unsupported file type handling
*For any* unsupported file type, the LSP should not activate or provide features
**Validates: Requirements 7.5**

Property 21: Pattern detection and feature provision
*For any* detected screenshot pattern (capture, display enumeration, window selection, region capture), the LSP should provide relevant code lenses, hover information, and validation
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

Property 22: Pattern detection performance
*For any* code change, the LSP should update features within 500ms
**Validates: Requirements 8.5**

## Error Handling

### LSP Error Scenarios

1. **MCP Client Unavailable**
   - Detection: Check client availability before command execution
   - Response: Return structured error to caller, log warning
   - Recovery: Continue providing static features (hover, completion)

2. **Invalid Command Parameters**
   - Detection: Validate parameters before execution
   - Response: Return error with parameter validation details
   - Recovery: Suggest correct parameter format

3. **Language Server Startup Failure**
   - Detection: Catch exceptions during server initialization
   - Response: Log error, continue extension without LSP features
   - Recovery: Allow extension to function with existing commands

4. **Document Parsing Errors**
   - Detection: Catch exceptions during AST parsing
   - Response: Skip feature provision for that document
   - Recovery: Retry on next document change

5. **Command Execution Timeout**
   - Detection: Set timeout on MCP client calls
   - Response: Return timeout error to caller
   - Recovery: Allow retry

### Error Response Format

```typescript
interface LSPError {
  code: string;
  message: string;
  details?: Record<string, any>;
  suggestedFix?: string;
}
```

## Testing Strategy

### Unit Testing

Unit tests will verify specific behaviors and edge cases:

- **Hover Provider Tests**: Test hover information for known function signatures
- **Code Lens Provider Tests**: Test code lens generation for specific code patterns
- **Diagnostic Provider Tests**: Test diagnostic creation for known invalid configurations
- **Completion Provider Tests**: Test completion items for specific cursor positions
- **Command Handler Tests**: Test command execution with mock MCP client
- **Pattern Detection Tests**: Test pattern matching for known code structures
- **Error Handling Tests**: Test error scenarios with unavailable client

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** (JavaScript/TypeScript PBT library):

- Each property-based test will run a minimum of 100 iterations
- Each test will be tagged with: `**Feature: mcp-screenshot-lsp, Property {number}: {property_text}**`
- Each correctness property will be implemented by a SINGLE property-based test

**Property Test Examples:**

1. **Hover Information Property**: Generate random screenshot function calls and verify hover returns valid markdown
2. **Code Lens Property**: Generate random screenshot patterns and verify code lenses are created at correct positions
3. **Diagnostic Property**: Generate random invalid configurations and verify diagnostics are created with valid ranges
4. **Completion Property**: Generate random cursor positions in config objects and verify completions have documentation
5. **Command Execution Property**: Generate random command requests and verify they delegate to MCP client
6. **File Type Property**: Generate random file types and verify LSP activates only for supported types
7. **Pattern Detection Property**: Generate random code changes and verify features update within 500ms

### Integration Testing

Integration tests will verify the LSP works with the actual VSCode extension:

- Test LSP startup with extension activation
- Test LSP communication with MCP client
- Test LSP features in actual VSCode editor
- Test backward compatibility with existing commands
- Test graceful degradation when MCP client unavailable

## Implementation Notes

### Language Server Protocol Version

- Use `vscode-languageserver` version 8.x or later
- Use `vscode-languageclient` version 8.x or later
- Follow LSP 3.17 specification

### Code Pattern Detection

The LSP will use simple regex and AST-based pattern matching to detect screenshot-related code:

```typescript
// Patterns to detect
const PATTERNS = {
  captureFullScreen: /captureFullScreen|screenshot.*full/i,
  captureWindow: /captureWindow|screenshot.*window/i,
  captureRegion: /captureRegion|screenshot.*region/i,
  listDisplays: /listDisplays|getDisplays/i,
  listWindows: /listWindows|getWindows/i,
};
```

### Performance Considerations

- Debounce document change events (100ms)
- Cache parsed AST for documents
- Limit diagnostic computation to visible range
- Use incremental text document sync
- Lazy-load heavy features

### Backward Compatibility

- All existing extension commands must continue to work
- MCP client lifecycle management unchanged
- Extension configuration unchanged
- No breaking changes to public API

## Dependencies

### New Dependencies

```json
{
  "vscode-languageserver": "^8.1.0",
  "vscode-languageserver-textdocument": "^1.0.8"
}
```

### Existing Dependencies (No Changes)

- vscode: Extension API
- MCPScreenshotClient: Screenshot operations
- child_process: MCP server process management

## Deployment

### Build Process

1. Compile TypeScript to JavaScript
2. Bundle language server separately from extension
3. Include language server in extension package
4. Update package.json with new capabilities

### Extension Package Updates

```json
{
  "activationEvents": [
    "onLanguage:javascript",
    "onLanguage:typescript",
    "onLanguage:javascriptreact",
    "onLanguage:typescriptreact",
    "onLanguage:json"
  ],
  "contributes": {
    "commands": [
      {
        "command": "mcp.screenshot.capture",
        "title": "MCP Screenshot: Capture"
      },
      {
        "command": "mcp.screenshot.listDisplays",
        "title": "MCP Screenshot: List Displays"
      },
      {
        "command": "mcp.screenshot.listWindows",
        "title": "MCP Screenshot: List Windows"
      },
      {
        "command": "mcp.screenshot.getCapabilities",
        "title": "MCP Screenshot: Get Capabilities"
      }
    ]
  }
}
```

### Testing Before Release

1. Run all unit tests
2. Run all property-based tests
3. Run integration tests in VSCode
4. Test with existing extension commands
5. Test with MCP client unavailable
6. Test in multiple file types
7. Performance testing with large files

## Future Enhancements

- Semantic code analysis using TypeScript compiler API
- Smart refactoring support for screenshot code
- Screenshot preview in hover
- Code actions for quick fixes
- Workspace-wide screenshot usage analysis
- Integration with VSCode testing framework
