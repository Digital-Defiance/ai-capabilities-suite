import * as vscode from "vscode";
import { MCPDebuggerClient } from "./mcpClient";
import { DebugConfigurationProvider } from "./debugConfigProvider";

let mcpClient: MCPDebuggerClient | undefined;
let outputChannel: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("MCP Debugger");
  outputChannel.appendLine("MCP Debugger extension activating...");

  // Initialize MCP client
  const config = vscode.workspace.getConfiguration("mcp-debugger");
  const autoStart = config.get<boolean>("autoStart", true);

  if (autoStart) {
    try {
      mcpClient = new MCPDebuggerClient(outputChannel);
      await mcpClient.start();
      outputChannel.appendLine("MCP Debugger server started successfully");
    } catch (error) {
      outputChannel.appendLine(`Failed to start MCP server: ${error}`);
      vscode.window.showErrorMessage("Failed to start MCP Debugger server");
    }
  }

  // Register debug configuration provider
  const provider = new DebugConfigurationProvider();
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider("mcp-node", provider)
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("mcp-debugger.start", async () => {
      await startDebugSession();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mcp-debugger.detectHang", async () => {
      await detectHang();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mcp-debugger.setBreakpoint", async () => {
      await setSmartBreakpoint();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mcp-debugger.profileCPU", async () => {
      await startCPUProfiling();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mcp-debugger.profileMemory", async () => {
      await takeHeapSnapshot();
    })
  );

  outputChannel.appendLine("MCP Debugger extension activated");
}

export function deactivate() {
  if (mcpClient) {
    mcpClient.stop();
  }
  outputChannel.dispose();
}

async function startDebugSession() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active file to debug");
    return;
  }

  const filePath = editor.document.uri.fsPath;
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(
    editor.document.uri
  );

  if (!workspaceFolder) {
    vscode.window.showErrorMessage("File must be in a workspace");
    return;
  }

  // Start debug session
  const config: vscode.DebugConfiguration = {
    type: "mcp-node",
    request: "launch",
    name: "MCP Debug Current File",
    program: filePath,
    cwd: workspaceFolder.uri.fsPath,
    enableHangDetection: true,
  };

  await vscode.debug.startDebugging(workspaceFolder, config);
}

async function detectHang() {
  if (!mcpClient) {
    vscode.window.showErrorMessage("MCP Debugger server not running");
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active file");
    return;
  }

  const filePath = editor.document.uri.fsPath;
  const config = vscode.workspace.getConfiguration("mcp-debugger");
  const timeout = config.get<number>("hangDetectionTimeout", 5000);

  try {
    outputChannel.appendLine(`Detecting hangs in ${filePath}...`);

    const result = await mcpClient.detectHang({
      command: "node",
      args: [filePath],
      timeout: timeout,
    });

    if (result.hung) {
      vscode.window
        .showWarningMessage(
          `Hang detected at ${result.location}`,
          "Show Details"
        )
        .then((selection) => {
          if (selection === "Show Details") {
            const panel = vscode.window.createWebviewPanel(
              "hangDetails",
              "Hang Detection Results",
              vscode.ViewColumn.One,
              {}
            );
            panel.webview.html = getHangDetailsHTML(result);
          }
        });
    } else {
      vscode.window.showInformationMessage("No hangs detected");
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Hang detection failed: ${error}`);
  }
}

async function setSmartBreakpoint() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const position = editor.selection.active;
  const filePath = editor.document.uri.fsPath;

  // Get smart breakpoint suggestions from MCP server
  if (mcpClient) {
    try {
      const suggestions = await mcpClient.suggestBreakpoints(filePath);

      if (suggestions.length > 0) {
        const items = suggestions.map((s) => ({
          label: `Line ${s.line}: ${s.reason}`,
          description: s.functionName,
          line: s.line,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: "Select a suggested breakpoint location",
        });

        if (selected) {
          // Set breakpoint at suggested location
          const bp = new vscode.SourceBreakpoint(
            new vscode.Location(
              editor.document.uri,
              new vscode.Position(selected.line - 1, 0)
            )
          );
          vscode.debug.addBreakpoints([bp]);
        }
      } else {
        // Set breakpoint at current line
        const bp = new vscode.SourceBreakpoint(
          new vscode.Location(editor.document.uri, position)
        );
        vscode.debug.addBreakpoints([bp]);
      }
    } catch (error) {
      outputChannel.appendLine(
        `Failed to get breakpoint suggestions: ${error}`
      );
      // Fallback to setting breakpoint at current line
      const bp = new vscode.SourceBreakpoint(
        new vscode.Location(editor.document.uri, position)
      );
      vscode.debug.addBreakpoints([bp]);
    }
  }
}

async function startCPUProfiling() {
  if (!mcpClient) {
    vscode.window.showErrorMessage("MCP Debugger server not running");
    return;
  }

  const session = vscode.debug.activeDebugSession;
  if (!session) {
    vscode.window.showErrorMessage("No active debug session");
    return;
  }

  try {
    await mcpClient.startCPUProfile(session.id);
    vscode.window.showInformationMessage("CPU profiling started");
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to start CPU profiling: ${error}`);
  }
}

async function takeHeapSnapshot() {
  if (!mcpClient) {
    vscode.window.showErrorMessage("MCP Debugger server not running");
    return;
  }

  const session = vscode.debug.activeDebugSession;
  if (!session) {
    vscode.window.showErrorMessage("No active debug session");
    return;
  }

  try {
    const snapshot = await mcpClient.takeHeapSnapshot(session.id);

    // Save snapshot to file
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file("heap-snapshot.heapsnapshot"),
      filters: {
        "Heap Snapshot": ["heapsnapshot"],
      },
    });

    if (uri) {
      await vscode.workspace.fs.writeFile(
        uri,
        Buffer.from(JSON.stringify(snapshot))
      );
      vscode.window.showInformationMessage(
        `Heap snapshot saved to ${uri.fsPath}`
      );
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to take heap snapshot: ${error}`);
  }
}

function getHangDetailsHTML(result: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: var(--vscode-font-family); padding: 20px; }
        h1 { color: var(--vscode-errorForeground); }
        .location { font-family: monospace; background: var(--vscode-textCodeBlock-background); padding: 10px; }
        .stack { margin-top: 20px; }
        .frame { margin: 5px 0; padding: 5px; background: var(--vscode-editor-background); }
      </style>
    </head>
    <body>
      <h1>⚠️ Hang Detected</h1>
      <p><strong>Location:</strong></p>
      <div class="location">${result.location}</div>
      
      <div class="stack">
        <h2>Call Stack:</h2>
        ${result.stack
          .map(
            (frame: any) => `
          <div class="frame">
            <strong>${frame.function || "(anonymous)"}</strong><br>
            ${frame.file}:${frame.line}
          </div>
        `
          )
          .join("")}
      </div>
      
      <p><strong>Message:</strong> ${result.message}</p>
    </body>
    </html>
  `;
}
