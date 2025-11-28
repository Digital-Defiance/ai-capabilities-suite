# VS Code and GitHub Copilot Integration Test Plan

## Date: 2024
## Task: 29.5 Test VS Code/Copilot integration

## Test Overview

This document outlines the test plan for verifying the MCP Debugger extension works correctly with VS Code and GitHub Copilot.

## Test Environment

### Prerequisites
- VS Code 1.85.0 or higher
- Node.js 16.x or higher
- GitHub Copilot extension installed
- MCP Debugger extension installed and compiled
- Test fixtures available

### Setup Steps
1. Install all dependencies: `yarn install`
2. Compile VS Code extension: `cd packages/vscode-mcp-debugger && npm run compile`
3. Build MCP server: `npx nx build @ai-capabilities-suite/mcp-debugger-server`
4. Configure workspace settings (see Configuration section)

## Test Categories

### Category 1: Extension Installation and Activation

#### Test 1.1: Extension Loads Successfully
**Objective**: Verify the extension loads without errors

**Steps**:
1. Open VS Code
2. Open a JavaScript or TypeScript file
3. Check the Output panel (View → Output → MCP Debugger)

**Expected Results**:
- ✅ Extension activates without errors
- ✅ "MCP Debugger extension activating..." message appears
- ✅ "MCP Debugger extension activated" message appears
- ✅ No error messages in the output

**Status**: ⏳ Pending Manual Test

---

#### Test 1.2: MCP Server Starts Automatically
**Objective**: Verify MCP server starts when autoStart is enabled

**Steps**:
1. Set `"mcp-debugger.autoStart": true` in settings
2. Restart VS Code
3. Check Output panel

**Expected Results**:
- ✅ "Starting MCP server..." message appears
- ✅ "MCP Debugger server started successfully" message appears
- ✅ Server process is running

**Status**: ⏳ Pending Manual Test

---

#### Test 1.3: Commands Are Available
**Objective**: Verify all extension commands are registered

**Steps**:
1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Type "MCP Debugger"

**Expected Results**:
- ✅ "MCP Debugger: Start Debug Session" appears
- ✅ "MCP Debugger: Detect Hanging Process" appears
- ✅ "MCP Debugger: Set Smart Breakpoint" appears
- ✅ "MCP Debugger: Start CPU Profiling" appears
- ✅ "MCP Debugger: Take Heap Snapshot" appears

**Status**: ⏳ Pending Manual Test

---

### Category 2: Basic Debugging Functionality

#### Test 2.1: Start Debug Session
**Objective**: Verify debug session can be started

**Steps**:
1. Open `packages/mcp-debugger-core/test-fixtures/simple-script.js`
2. Run command: "MCP Debugger: Start Debug Session"

**Expected Results**:
- ✅ Debug session starts
- ✅ Session ID is displayed
- ✅ Process is paused at start
- ✅ No errors in output

**Status**: ⏳ Pending Manual Test

---

#### Test 2.2: Set Breakpoint
**Objective**: Verify breakpoints can be set

**Steps**:
1. Open a JavaScript file
2. Click in the gutter to set a breakpoint
3. Start debugging with F5

**Expected Results**:
- ✅ Breakpoint is set (red dot appears)
- ✅ Execution pauses at breakpoint
- ✅ Variables are visible in Debug sidebar
- ✅ Call stack is shown

**Status**: ⏳ Pending Manual Test

---

#### Test 2.3: Step Through Code
**Objective**: Verify stepping operations work

**Steps**:
1. Start debug session and pause at breakpoint
2. Press F10 (Step Over)
3. Press F11 (Step Into)
4. Press Shift+F11 (Step Out)

**Expected Results**:
- ✅ Step Over moves to next line in same function
- ✅ Step Into enters called functions
- ✅ Step Out returns to caller
- ✅ Current line indicator updates correctly

**Status**: ⏳ Pending Manual Test

---

#### Test 2.4: Inspect Variables
**Objective**: Verify variable inspection works

**Steps**:
1. Pause at a breakpoint
2. Hover over a variable
3. Check Variables panel in Debug sidebar
4. Use Debug Console to evaluate expressions

**Expected Results**:
- ✅ Hover shows variable value
- ✅ Variables panel shows all local variables
- ✅ Debug Console can evaluate expressions
- ✅ Values are correctly formatted

**Status**: ⏳ Pending Manual Test

---

#### Test 2.5: Detect Hang
**Objective**: Verify hang detection works

**Steps**:
1. Open `packages/mcp-debugger-core/test-fixtures/infinite-loop.js`
2. Run command: "MCP Debugger: Detect Hanging Process"

**Expected Results**:
- ✅ Hang is detected
- ✅ Location of hang is shown
- ✅ Call stack is displayed
- ✅ Webview panel shows details

**Status**: ⏳ Pending Manual Test

---

### Category 3: GitHub Copilot Integration

#### Test 3.1: Copilot Discovers MCP Tools
**Objective**: Verify Copilot can discover debugging tools

**Prerequisites**:
- GitHub Copilot extension installed
- MCP integration enabled in settings

**Steps**:
1. Open Copilot Chat (Ctrl+Shift+I / Cmd+Shift+I)
2. Ask: "What debugging tools are available?"

**Expected Results**:
- ✅ Copilot responds with list of debugging tools
- ✅ Tools include: debugger_start, debugger_set_breakpoint, etc.
- ✅ Tool descriptions are shown
- ✅ No errors in response

**Status**: ⏳ Pending Manual Test

---

#### Test 3.2: Copilot Can Start Debug Session
**Objective**: Verify Copilot can use debugger_start tool

**Steps**:
1. Open `packages/mcp-debugger-core/test-fixtures/simple-script.js`
2. Ask Copilot: "Debug this file"

**Expected Results**:
- ✅ Copilot starts a debug session
- ✅ Session ID is mentioned in response
- ✅ Copilot confirms session started
- ✅ No errors occur

**Status**: ⏳ Pending Manual Test

---

#### Test 3.3: Copilot Can Set Breakpoints
**Objective**: Verify Copilot can set breakpoints

**Steps**:
1. Open a JavaScript file
2. Ask Copilot: "Set a breakpoint at line 10"

**Expected Results**:
- ✅ Copilot sets the breakpoint
- ✅ Breakpoint appears in editor
- ✅ Copilot confirms breakpoint set
- ✅ Breakpoint is verified

**Status**: ⏳ Pending Manual Test

---

#### Test 3.4: Copilot Can Find Bugs
**Objective**: Verify Copilot can autonomously debug code

**Steps**:
1. Open a file with a known bug (e.g., undefined variable)
2. Ask Copilot: "Find the bug in this code"

**Expected Results**:
- ✅ Copilot starts debugging
- ✅ Copilot sets breakpoints
- ✅ Copilot inspects variables
- ✅ Copilot identifies the bug
- ✅ Copilot explains the issue
- ✅ Copilot suggests a fix

**Status**: ⏳ Pending Manual Test

---

#### Test 3.5: Copilot Can Detect Hangs
**Objective**: Verify Copilot can detect infinite loops

**Steps**:
1. Open `packages/mcp-debugger-core/test-fixtures/infinite-loop.js`
2. Ask Copilot: "Check if this script has an infinite loop"

**Expected Results**:
- ✅ Copilot uses hang detection
- ✅ Copilot identifies the infinite loop
- ✅ Copilot shows the loop location
- ✅ Copilot explains the issue
- ✅ Copilot suggests a fix

**Status**: ⏳ Pending Manual Test

---

#### Test 3.6: Copilot Can Explain Execution
**Objective**: Verify Copilot can step through and explain code

**Steps**:
1. Open a function with complex logic
2. Ask Copilot: "Step through this function and explain how it works"

**Expected Results**:
- ✅ Copilot starts debug session
- ✅ Copilot steps through the code
- ✅ Copilot inspects variables at each step
- ✅ Copilot explains each step
- ✅ Copilot provides clear summary

**Status**: ⏳ Pending Manual Test

---

### Category 4: Error Handling

#### Test 4.1: Invalid File Path
**Objective**: Verify graceful handling of invalid file paths

**Steps**:
1. Ask Copilot: "Debug /nonexistent/file.js"

**Expected Results**:
- ✅ Error is caught gracefully
- ✅ Copilot explains the error
- ✅ No crash or hang
- ✅ Helpful error message

**Status**: ⏳ Pending Manual Test

---

#### Test 4.2: Invalid Session ID
**Objective**: Verify handling of invalid session IDs

**Steps**:
1. Manually call a tool with invalid session ID
2. Check error response

**Expected Results**:
- ✅ Error response is returned
- ✅ Error message is clear
- ✅ No crash or hang
- ✅ Session cleanup occurs

**Status**: ⏳ Pending Manual Test

---

#### Test 4.3: Process Crash During Debug
**Objective**: Verify handling of target process crashes

**Steps**:
1. Start debugging a script that crashes
2. Observe behavior

**Expected Results**:
- ✅ Crash is detected
- ✅ Error is reported
- ✅ Session is cleaned up
- ✅ Resources are released

**Status**: ⏳ Pending Manual Test

---

### Category 5: TypeScript Support

#### Test 5.1: Debug TypeScript File
**Objective**: Verify TypeScript debugging with source maps

**Steps**:
1. Open `packages/mcp-debugger-core/test-fixtures/typescript-sample.ts`
2. Compile with source maps
3. Start debugging

**Expected Results**:
- ✅ Breakpoints work in .ts file
- ✅ Source maps are loaded
- ✅ Variables show TypeScript names
- ✅ Locations map correctly

**Status**: ⏳ Pending Manual Test

---

#### Test 5.2: Copilot Debugs TypeScript
**Objective**: Verify Copilot can debug TypeScript

**Steps**:
1. Open a TypeScript file
2. Ask Copilot: "Debug this TypeScript file"

**Expected Results**:
- ✅ Copilot starts debug session
- ✅ Source maps are used
- ✅ TypeScript locations are shown
- ✅ Variables have TypeScript names

**Status**: ⏳ Pending Manual Test

---

### Category 6: Performance and Stability

#### Test 6.1: Multiple Debug Sessions
**Objective**: Verify multiple concurrent sessions work

**Steps**:
1. Start debug session for file A
2. Start debug session for file B
3. Verify both work independently

**Expected Results**:
- ✅ Both sessions start successfully
- ✅ Sessions are isolated
- ✅ Operations on one don't affect the other
- ✅ Both can be stopped independently

**Status**: ⏳ Pending Manual Test

---

#### Test 6.2: Long-Running Debug Session
**Objective**: Verify stability over time

**Steps**:
1. Start a debug session
2. Leave it running for 10+ minutes
3. Perform various operations

**Expected Results**:
- ✅ Session remains stable
- ✅ No memory leaks
- ✅ Operations continue to work
- ✅ No performance degradation

**Status**: ⏳ Pending Manual Test

---

#### Test 6.3: Rapid Tool Calls
**Objective**: Verify handling of rapid successive calls

**Steps**:
1. Use Copilot to make many rapid tool calls
2. Observe behavior

**Expected Results**:
- ✅ All calls are handled
- ✅ No race conditions
- ✅ Responses are correct
- ✅ No crashes or hangs

**Status**: ⏳ Pending Manual Test

---

### Category 7: Configuration

#### Test 7.1: Custom Server Path
**Objective**: Verify custom server path works

**Steps**:
1. Set `"mcp-debugger.serverPath"` to custom path
2. Restart VS Code
3. Verify server starts

**Expected Results**:
- ✅ Custom server is used
- ✅ Server starts successfully
- ✅ All features work

**Status**: ⏳ Pending Manual Test

---

#### Test 7.2: Timeout Configuration
**Objective**: Verify timeout settings work

**Steps**:
1. Set `"mcp-debugger.defaultTimeout"` to 5000
2. Debug a slow operation
3. Verify timeout is respected

**Expected Results**:
- ✅ Timeout is applied
- ✅ Operation times out after 5 seconds
- ✅ Error is reported gracefully

**Status**: ⏳ Pending Manual Test

---

#### Test 7.3: Hang Detection Configuration
**Objective**: Verify hang detection settings work

**Steps**:
1. Set `"mcp-debugger.hangDetectionTimeout"` to 2000
2. Run hang detection
3. Verify timeout is used

**Expected Results**:
- ✅ Custom timeout is used
- ✅ Hang is detected after 2 seconds
- ✅ Results are accurate

**Status**: ⏳ Pending Manual Test

---

## Configuration for Testing

### Workspace Settings (.vscode/settings.json)

```json
{
  "mcp.servers": {
    "debugger": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-debugger-server/dist/src/index.js"],
      "transport": "stdio"
    }
  },
  "github.copilot.advanced": {
    "mcp": {
      "enabled": true,
      "servers": ["debugger"]
    }
  },
  "mcp-debugger.autoStart": true,
  "mcp-debugger.defaultTimeout": 30000,
  "mcp-debugger.enableHangDetection": true,
  "mcp-debugger.hangDetectionTimeout": 5000,
  "mcp-debugger.logLevel": "debug"
}
```

### Launch Configuration (.vscode/launch.json)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "mcp-node",
      "request": "launch",
      "name": "MCP Debug Current File",
      "program": "${file}",
      "cwd": "${workspaceFolder}",
      "enableHangDetection": true
    },
    {
      "type": "mcp-node",
      "request": "launch",
      "name": "MCP Debug with Profiling",
      "program": "${workspaceFolder}/packages/mcp-debugger-core/test-fixtures/simple-script.js",
      "cwd": "${workspaceFolder}",
      "enableProfiling": true
    }
  ]
}
```

## Test Execution Checklist

### Pre-Test Setup
- [ ] Install VS Code 1.85.0+
- [ ] Install Node.js 16.x+
- [ ] Install GitHub Copilot extension
- [ ] Clone repository
- [ ] Run `yarn install`
- [ ] Build MCP server: `npx nx build @ai-capabilities-suite/mcp-debugger-server`
- [ ] Compile VS Code extension: `cd packages/vscode-mcp-debugger && npm run compile`
- [ ] Configure workspace settings
- [ ] Verify test fixtures exist

### Test Execution
- [ ] Run Category 1 tests (Extension Installation)
- [ ] Run Category 2 tests (Basic Debugging)
- [ ] Run Category 3 tests (Copilot Integration)
- [ ] Run Category 4 tests (Error Handling)
- [ ] Run Category 5 tests (TypeScript Support)
- [ ] Run Category 6 tests (Performance)
- [ ] Run Category 7 tests (Configuration)

### Post-Test
- [ ] Document any failures
- [ ] Create issues for bugs found
- [ ] Update documentation based on findings
- [ ] Create test report

## Known Limitations

### Current Limitations
1. **Copilot MCP Support**: Requires specific Copilot version with MCP support
2. **Tool Approval**: Some tools may require manual approval
3. **Context Limits**: Large debugging outputs may be truncated
4. **Async Operations**: Long-running operations may timeout

### Workarounds
1. **MCP Support**: Ensure Copilot is up to date
2. **Tool Approval**: Configure auto-approval for trusted tools
3. **Context Limits**: Break large operations into smaller steps
4. **Timeouts**: Increase timeout settings for slow operations

## Test Results Summary

### Overall Status
- **Total Tests**: 23
- **Passed**: 0 (⏳ Pending Manual Testing)
- **Failed**: 0
- **Skipped**: 0
- **Blocked**: 0

### Category Status
- **Category 1 (Installation)**: ⏳ Pending (3 tests)
- **Category 2 (Basic Debugging)**: ⏳ Pending (5 tests)
- **Category 3 (Copilot Integration)**: ⏳ Pending (6 tests)
- **Category 4 (Error Handling)**: ⏳ Pending (3 tests)
- **Category 5 (TypeScript)**: ⏳ Pending (2 tests)
- **Category 6 (Performance)**: ⏳ Pending (3 tests)
- **Category 7 (Configuration)**: ⏳ Pending (3 tests)

## Next Steps

1. **Manual Testing**: Execute all tests manually in VS Code
2. **Document Results**: Record pass/fail status for each test
3. **Fix Issues**: Address any failures found
4. **Automated Testing**: Consider creating automated tests where possible
5. **User Testing**: Get feedback from real users
6. **Iterate**: Improve based on test results and feedback

## Conclusion

This test plan provides comprehensive coverage of the VS Code and GitHub Copilot integration. All tests are currently pending manual execution. Once testing is complete, this document should be updated with results and any issues found should be documented and addressed.

The extension is functionally complete and ready for testing. The main focus should be on verifying Copilot integration works as expected and that all debugging features function correctly in the VS Code environment.
