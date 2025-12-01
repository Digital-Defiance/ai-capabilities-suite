# MCP Debugger - AI Agent Profile

## Overview

This document provides instructions and context for AI agents (like GitHub Copilot) to effectively use the MCP Debugger tools for autonomous debugging.

## Tool Discovery

The MCP Debugger exposes the following tools through the Model Context Protocol:

### Core Debugging Tools

1. **debugger_start** - Start a debug session
2. **debugger_set_breakpoint** - Set a breakpoint at a specific location
3. **debugger_continue** - Resume execution until next breakpoint
4. **debugger_step_over** - Execute current line and pause at next line
5. **debugger_step_into** - Step into function calls
6. **debugger_step_out** - Step out of current function
7. **debugger_pause** - Pause running execution
8. **debugger_inspect** - Evaluate expressions and inspect variables
9. **debugger_get_stack** - Get current call stack
10. **debugger_stop_session** - Stop debug session and cleanup

### Breakpoint Management Tools

11. **debugger_list_breakpoints** - List all breakpoints
12. **debugger_remove_breakpoint** - Remove a specific breakpoint
13. **debugger_toggle_breakpoint** - Enable/disable a breakpoint

### Variable Inspection Tools

14. **debugger_get_local_variables** - Get all local variables
15. **debugger_get_global_variables** - Get global variables
16. **debugger_inspect_object** - Inspect object properties
17. **debugger_add_watch** - Add variable to watch list
18. **debugger_remove_watch** - Remove variable from watch list
19. **debugger_get_watches** - Get all watched variables

### Advanced Tools

20. **debugger_detect_hang** - Detect infinite loops and hangs
21. **debugger_start_cpu_profile** - Start CPU profiling
22. **debugger_stop_cpu_profile** - Stop CPU profiling
23. **debugger_take_heap_snapshot** - Take memory snapshot
24. **debugger_switch_stack_frame** - Switch to different stack frame

## Tool Schemas

### debugger_start

```json
{
  "name": "debugger_start",
  "description": "Start a debug session for a Node.js program",
  "inputSchema": {
    "type": "object",
    "properties": {
      "command": {
        "type": "string",
        "description": "Command to execute (usually 'node')"
      },
      "args": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Command arguments (file path and program args)"
      },
      "cwd": {
        "type": "string",
        "description": "Working directory"
      },
      "timeout": {
        "type": "number",
        "description": "Timeout in milliseconds (default: 30000)"
      }
    },
    "required": ["command", "args"]
  }
}
```

### debugger_set_breakpoint

```json
{
  "name": "debugger_set_breakpoint",
  "description": "Set a breakpoint at a specific file and line",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sessionId": {
        "type": "string",
        "description": "Debug session ID"
      },
      "file": {
        "type": "string",
        "description": "Absolute file path"
      },
      "line": {
        "type": "number",
        "description": "Line number (1-indexed)"
      },
      "condition": {
        "type": "string",
        "description": "Optional condition expression"
      }
    },
    "required": ["sessionId", "file", "line"]
  }
}
```

### debugger_inspect

```json
{
  "name": "debugger_inspect",
  "description": "Evaluate an expression and return its value",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sessionId": {
        "type": "string",
        "description": "Debug session ID"
      },
      "expression": {
        "type": "string",
        "description": "JavaScript expression to evaluate"
      }
    },
    "required": ["sessionId", "expression"]
  }
}
```

### debugger_detect_hang

```json
{
  "name": "debugger_detect_hang",
  "description": "Detect if a program has an infinite loop or is hanging",
  "inputSchema": {
    "type": "object",
    "properties": {
      "command": {
        "type": "string",
        "description": "Command to execute"
      },
      "args": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Command arguments"
      },
      "timeout": {
        "type": "number",
        "description": "Timeout in milliseconds"
      },
      "sampleInterval": {
        "type": "number",
        "description": "Sampling interval in milliseconds (default: 100)"
      }
    },
    "required": ["command", "args", "timeout"]
  }
}
```

## Debugging Workflows for AI Agents

### Workflow 1: Find and Fix a Bug

**Goal**: Identify and fix a bug in a JavaScript/TypeScript file

**Steps**:

1. **Analyze the code** to identify suspicious areas
2. **Start debug session**: Use `debugger_start` with the file path
3. **Set strategic breakpoints**: Use `debugger_set_breakpoint` at:
   - Function entry points
   - Conditional branches
   - Error-prone operations (API calls, data parsing, etc.)
4. **Continue execution**: Use `debugger_continue` to run until first breakpoint
5. **Inspect variables**: Use `debugger_inspect` to check variable values
6. **Step through code**: Use `debugger_step_over` or `debugger_step_into` to trace execution
7. **Identify the issue**: Compare expected vs actual values
8. **Explain the bug** to the user with evidence from debugging
9. **Suggest a fix** with code changes
10. **Cleanup**: Use `debugger_stop_session`

**Example**:

```
User: "Find the bug in app.js"

Agent Actions:
1. Read app.js and analyze code
2. debugger_start({ command: "node", args: ["app.js"], cwd: "/workspace" })
3. debugger_set_breakpoint({ sessionId: "...", file: "/workspace/app.js", line: 25 })
4. debugger_continue({ sessionId: "..." })
5. debugger_inspect({ sessionId: "...", expression: "user" })
   Result: { value: null, type: "object" }
6. debugger_get_stack({ sessionId: "..." })
7. Analyze: user is null, causing error on line 26

Agent Response:
"I found the bug! At line 25, the 'user' variable is null because getUserById() 
returns null when the user is not found. Line 26 tries to access user.name, 
which causes a TypeError. 

Fix: Add null check before accessing properties:
```javascript
const user = getUserById(userId);
if (!user) {
  console.error('User not found');
  return;
}
console.log(user.name);
```"
```

### Workflow 2: Detect Infinite Loop

**Goal**: Identify if a program has an infinite loop

**Steps**:

1. **Use hang detection**: Call `debugger_detect_hang` with appropriate timeout
2. **Analyze results**: If hung, examine the location and call stack
3. **Explain the issue**: Describe the infinite loop condition
4. **Suggest a fix**: Provide code to break the loop

**Example**:

```
User: "Check if this script has an infinite loop"

Agent Actions:
1. debugger_detect_hang({ 
     command: "node", 
     args: ["script.js"], 
     timeout: 5000,
     sampleInterval: 100
   })
   Result: { 
     hung: true, 
     location: "script.js:42",
     stack: [...]
   }

Agent Response:
"Yes, I detected an infinite loop at line 42 in script.js.

The loop condition is:
```javascript
while (i < items.length) {
  processItem(items[i]);
  // Missing: i++
}
```

The problem is that 'i' is never incremented, so the loop never exits.

Fix: Add i++ inside the loop:
```javascript
while (i < items.length) {
  processItem(items[i]);
  i++;
}
```"
```

### Workflow 3: Understand Code Execution

**Goal**: Trace how a function executes and explain its behavior

**Steps**:

1. **Start debug session**
2. **Set breakpoint** at function entry
3. **Step through** each line using `debugger_step_over`
4. **Inspect variables** at each step
5. **Build execution trace** with variable values
6. **Explain** the execution flow to the user

**Example**:

```
User: "Explain how the calculateDiscount function works"

Agent Actions:
1. debugger_start({ command: "node", args: ["app.js"], cwd: "/workspace" })
2. debugger_set_breakpoint({ sessionId: "...", file: "/workspace/app.js", line: 15 })
3. debugger_continue({ sessionId: "..." })
4. debugger_step_over({ sessionId: "..." })
5. debugger_inspect({ sessionId: "...", expression: "basePrice" })
   Result: { value: 100, type: "number" }
6. debugger_step_over({ sessionId: "..." })
7. debugger_inspect({ sessionId: "...", expression: "discountPercent" })
   Result: { value: 20, type: "number" }
8. Continue stepping and inspecting...

Agent Response:
"Here's how the calculateDiscount function executes:

1. Line 15: Initializes basePrice = 100
2. Line 16: Gets discountPercent = 20 from the user object
3. Line 17: Calculates discount = 20 (20% of 100)
4. Line 18: Calculates finalPrice = 80 (100 - 20)
5. Line 19: Returns 80

The function calculates a percentage discount and subtracts it from the base price."
```

### Workflow 4: Debug Failing Test

**Goal**: Identify why a test is failing

**Steps**:

1. **Start debug session** with test runner (Jest/Mocha/Vitest)
2. **Set breakpoint** in the failing test
3. **Continue** to breakpoint
4. **Inspect** test variables and assertions
5. **Compare** expected vs actual values
6. **Identify** the discrepancy
7. **Explain** why the test fails
8. **Suggest** a fix

### Workflow 5: Profile Performance

**Goal**: Identify performance bottlenecks

**Steps**:

1. **Start debug session**
2. **Start CPU profiling**: Use `debugger_start_cpu_profile`
3. **Let code execute**
4. **Stop profiling**: Use `debugger_stop_cpu_profile`
5. **Analyze** profile data
6. **Identify** slow functions
7. **Suggest** optimizations

## Context Enrichment

When debugging, AI agents should provide rich context:

### Variable Context

When inspecting variables, include:
- **Type information**: "user is an object"
- **Value**: "user = { id: 123, name: 'John' }"
- **Scope**: "user is a local variable in the login function"
- **History**: "user was null before line 25"

### Execution Context

When explaining execution:
- **Current location**: "Paused at line 42 in app.js"
- **Call stack**: "Called from main() → processData() → validateUser()"
- **Execution path**: "Took the if branch because condition was true"

### Error Context

When identifying errors:
- **Error type**: "TypeError: Cannot read property 'name' of null"
- **Root cause**: "user is null because getUserById returned null"
- **Impact**: "This causes the application to crash"
- **Fix**: "Add null check before accessing properties"

## Best Practices for AI Agents

### 1. Always Clean Up

```javascript
// Always stop debug sessions when done
await debugger_stop_session({ sessionId });
```

### 2. Use Strategic Breakpoints

Don't set breakpoints on every line. Focus on:
- Function entry points
- Conditional branches
- Error-prone operations
- Loop boundaries

### 3. Inspect Relevant Variables

Don't inspect every variable. Focus on:
- Variables involved in the bug
- Function parameters
- Return values
- Variables in error messages

### 4. Provide Evidence

Always show evidence from debugging:
- Variable values
- Execution paths
- Call stacks
- Error messages

### 5. Explain Clearly

Use clear, concise language:
- Describe what you found
- Explain why it's a problem
- Suggest how to fix it
- Provide code examples

### 6. Handle Errors Gracefully

If debugging fails:
- Explain what went wrong
- Suggest alternative approaches
- Ask for clarification if needed

## Tool Usage Patterns

### Pattern 1: Quick Variable Inspection

```javascript
// Start session
const session = await debugger_start({ command: "node", args: ["app.js"] });

// Set breakpoint
await debugger_set_breakpoint({ 
  sessionId: session.sessionId, 
  file: "/workspace/app.js", 
  line: 42 
});

// Continue to breakpoint
await debugger_continue({ sessionId: session.sessionId });

// Inspect variable
const result = await debugger_inspect({ 
  sessionId: session.sessionId, 
  expression: "user" 
});

// Cleanup
await debugger_stop_session({ sessionId: session.sessionId });
```

### Pattern 2: Step-by-Step Execution

```javascript
// Start and set breakpoint
const session = await debugger_start({ command: "node", args: ["app.js"] });
await debugger_set_breakpoint({ sessionId: session.sessionId, file: "...", line: 10 });
await debugger_continue({ sessionId: session.sessionId });

// Step through code
for (let i = 0; i < 5; i++) {
  await debugger_step_over({ sessionId: session.sessionId });
  const locals = await debugger_get_local_variables({ sessionId: session.sessionId });
  // Analyze locals
}

// Cleanup
await debugger_stop_session({ sessionId: session.sessionId });
```

### Pattern 3: Hang Detection

```javascript
// Simple hang detection
const result = await debugger_detect_hang({
  command: "node",
  args: ["script.js"],
  timeout: 5000,
  sampleInterval: 100
});

if (result.hung) {
  console.log(`Hang detected at ${result.location}`);
  console.log(`Call stack: ${JSON.stringify(result.stack)}`);
}
```

## LSP Integration

The MCP Debugger also provides Language Server Protocol (LSP) features:

### Hover Provider

When hovering over a variable, the LSP provides:
- Variable name
- Instructions for inspection
- Quick actions

### Code Lens

The LSP suggests breakpoints at:
- Function declarations
- Loop statements
- Error handlers

### Diagnostics

The LSP provides warnings for:
- Potential infinite loops (`while(true)`)
- Missing error handling
- Console.log statements (suggest using debugger)

### Commands

AI agents can execute LSP commands:
- `mcp.debugger.start`
- `mcp.debugger.setBreakpoint`
- `mcp.debugger.inspect`
- And all other MCP tools

## Example Agent Conversations

### Example 1: Simple Bug Fix

```
User: "Why does this function return undefined?"

Agent:
1. Analyzes code
2. Starts debug session
3. Sets breakpoint at function entry
4. Steps through execution
5. Identifies missing return statement

Response: "The function returns undefined because there's no return statement 
in the else branch. Add: return defaultValue;"
```

### Example 2: Complex Debugging

```
User: "Debug this authentication flow"

Agent:
1. Starts debug session
2. Sets breakpoints at key points:
   - Login function entry
   - Token validation
   - Database query
   - Response generation
3. Steps through each breakpoint
4. Inspects variables at each step
5. Identifies issue: token validation fails due to incorrect secret

Response: "The authentication fails at token validation because the JWT secret 
in the config doesn't match the secret used to sign the token. Update the 
secret in config.js to match the signing secret."
```

## Troubleshooting for AI Agents

### Issue: Session Not Starting

**Symptoms**: `debugger_start` fails

**Solutions**:
1. Check file path is absolute
2. Verify file exists
3. Check Node.js is available
4. Try with simpler program first

### Issue: Breakpoint Not Hitting

**Symptoms**: Execution doesn't pause at breakpoint

**Solutions**:
1. Verify file path is absolute
2. Check line number has executable code
3. Try adjacent lines
4. Check if code is actually executed

### Issue: Variable Shows Undefined

**Symptoms**: `debugger_inspect` returns undefined

**Solutions**:
1. Check if session is paused
2. Verify variable is in scope
3. Check spelling
4. Try inspecting parent object

## Summary

This agent profile provides AI agents with:
- Complete tool catalog
- Tool schemas for validation
- Debugging workflows
- Best practices
- Example conversations
- Troubleshooting guide

AI agents should use this information to:
- Discover available tools
- Understand tool capabilities
- Execute effective debugging workflows
- Provide helpful debugging assistance
- Handle errors gracefully

---

**For more information**, see:
- [README.md](README.md) - Extension overview
- [COPILOT-GUIDE.md](COPILOT-GUIDE.md) - Copilot integration
- [API Documentation](../mcp-debugger-server/API.md) - Detailed API reference
