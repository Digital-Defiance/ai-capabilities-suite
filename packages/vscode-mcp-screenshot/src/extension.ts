import * as vscode from "vscode";
import { MCPScreenshotClient } from "./mcpClient";

let mcpClient: MCPScreenshotClient | undefined;
let outputChannel: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("MCP Screenshot");
  outputChannel.appendLine("MCP Screenshot extension activating...");

  // Initialize MCP client
  const config = vscode.workspace.getConfiguration("mcpScreenshot");
  const autoStart = config.get<boolean>("autoStart", true);

  if (autoStart) {
    try {
      mcpClient = new MCPScreenshotClient(outputChannel);
      await mcpClient.start();
      outputChannel.appendLine("MCP Screenshot server started successfully");
    } catch (error) {
      outputChannel.appendLine(`Failed to start MCP server: ${error}`);
      if (process.env.NODE_ENV === "production") {
        vscode.window.showErrorMessage("Failed to start MCP Screenshot server");
      }
    }
  }

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mcp-screenshot.captureFullScreen",
      async () => {
        await captureFullScreen();
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mcp-screenshot.captureWindow",
      async () => {
        await captureWindow();
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mcp-screenshot.captureRegion",
      async () => {
        await captureRegion();
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mcp-screenshot.listDisplays", async () => {
      await listDisplays();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mcp-screenshot.listWindows", async () => {
      await listWindows();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mcp-screenshot.openSettings", () => {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "mcpScreenshot"
      );
    })
  );

  outputChannel.appendLine("MCP Screenshot extension activated");
}

export async function deactivate() {
  if (mcpClient) {
    mcpClient.stop();
  }
  outputChannel.dispose();
}

async function captureFullScreen() {
  if (!mcpClient) {
    vscode.window.showErrorMessage("MCP Screenshot server not running");
    return;
  }

  try {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const format = config.get("defaultFormat", "png");
    const quality = config.get("defaultQuality", 90);
    const enablePIIMasking = config.get("enablePIIMasking", false);
    const autoSave = config.get("autoSave", true);

    let savePath: string | undefined;
    if (autoSave) {
      const saveDir = config.get(
        "saveDirectory",
        "${workspaceFolder}/screenshots"
      );
      const resolvedDir = saveDir.replace(
        "${workspaceFolder}",
        vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ""
      );
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      savePath = `${resolvedDir}/screenshot-${timestamp}.${format}`;
    }

    outputChannel.appendLine(`Capturing full screen...`);

    const result = await mcpClient.captureFullScreen({
      format,
      quality,
      enablePIIMasking,
      savePath,
    });

    if (result.status === "success") {
      if (savePath) {
        vscode.window.showInformationMessage(
          `Screenshot saved to ${result.filePath}`
        );
        outputChannel.appendLine(`Screenshot saved: ${result.filePath}`);
      } else {
        vscode.window.showInformationMessage(
          "Screenshot captured successfully"
        );
        outputChannel.appendLine("Screenshot captured (base64)");
      }
    } else {
      vscode.window.showErrorMessage(`Screenshot failed: ${result.message}`);
      outputChannel.appendLine(`Screenshot failed: ${result.message}`);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Screenshot error: ${error}`);
    outputChannel.appendLine(`Screenshot error: ${error}`);
  }
}

async function captureWindow() {
  if (!mcpClient) {
    vscode.window.showErrorMessage("MCP Screenshot server not running");
    return;
  }

  try {
    // First, list windows
    outputChannel.appendLine("Listing windows...");
    const windowsResult = await mcpClient.listWindows();

    if (windowsResult.status !== "success" || !windowsResult.windows) {
      vscode.window.showErrorMessage("Failed to list windows");
      return;
    }

    // Show quick pick for window selection
    const windowItems = windowsResult.windows.map((w: any) => ({
      label: w.title,
      description: w.processName,
      detail: `${w.bounds.width}x${w.bounds.height}`,
      window: w,
    }));

    const selected = await vscode.window.showQuickPick(windowItems, {
      placeHolder: "Select a window to capture",
    });

    if (!selected) {
      return;
    }

    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const format = config.get("defaultFormat", "png");
    const includeFrameChoice = await vscode.window.showQuickPick(
      ["Yes", "No"],
      {
        placeHolder: "Include window frame?",
      }
    );
    const includeFrame = includeFrameChoice === "Yes";

    outputChannel.appendLine(
      `Capturing window: ${(selected as any).window.title}`
    );

    const result = await mcpClient.captureWindow({
      windowId: (selected as any).window.id,
      format,
      includeFrame,
    });

    if (result.status === "success") {
      vscode.window.showInformationMessage("Window captured successfully");
      outputChannel.appendLine("Window captured successfully");
    } else {
      vscode.window.showErrorMessage(
        `Window capture failed: ${result.message}`
      );
      outputChannel.appendLine(`Window capture failed: ${result.message}`);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Window capture error: ${error}`);
    outputChannel.appendLine(`Window capture error: ${error}`);
  }
}

async function captureRegion() {
  if (!mcpClient) {
    vscode.window.showErrorMessage("MCP Screenshot server not running");
    return;
  }

  try {
    // Prompt for region coordinates
    const x = await vscode.window.showInputBox({
      prompt: "Enter X coordinate",
      value: "0",
      validateInput: (value) => {
        const num = parseInt(value);
        return isNaN(num) || num < 0 ? "Must be a non-negative number" : null;
      },
    });

    if (x === undefined) return;

    const y = await vscode.window.showInputBox({
      prompt: "Enter Y coordinate",
      value: "0",
      validateInput: (value) => {
        const num = parseInt(value);
        return isNaN(num) || num < 0 ? "Must be a non-negative number" : null;
      },
    });

    if (y === undefined) return;

    const width = await vscode.window.showInputBox({
      prompt: "Enter width",
      value: "800",
      validateInput: (value) => {
        const num = parseInt(value);
        return isNaN(num) || num <= 0 ? "Must be a positive number" : null;
      },
    });

    if (width === undefined) return;

    const height = await vscode.window.showInputBox({
      prompt: "Enter height",
      value: "600",
      validateInput: (value) => {
        const num = parseInt(value);
        return isNaN(num) || num <= 0 ? "Must be a positive number" : null;
      },
    });

    if (height === undefined) return;

    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const format = config.get("defaultFormat", "png");

    outputChannel.appendLine(`Capturing region: ${x},${y} ${width}x${height}`);

    const result = await mcpClient.captureRegion({
      x: parseInt(x),
      y: parseInt(y),
      width: parseInt(width),
      height: parseInt(height),
      format,
    });

    if (result.status === "success") {
      vscode.window.showInformationMessage("Region captured successfully");
      outputChannel.appendLine("Region captured successfully");
    } else {
      vscode.window.showErrorMessage(
        `Region capture failed: ${result.message}`
      );
      outputChannel.appendLine(`Region capture failed: ${result.message}`);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Region capture error: ${error}`);
    outputChannel.appendLine(`Region capture error: ${error}`);
  }
}

async function listDisplays() {
  if (!mcpClient) {
    vscode.window.showErrorMessage("MCP Screenshot server not running");
    return;
  }

  try {
    outputChannel.appendLine("Listing displays...");
    const result = await mcpClient.listDisplays();

    if (result.status === "success" && result.displays) {
      const displayInfo = result.displays
        .map(
          (d: any) =>
            `${d.name} (${d.resolution.width}x${d.resolution.height})${
              d.isPrimary ? " [Primary]" : ""
            }`
        )
        .join("\n");

      vscode.window.showInformationMessage(`Displays:\n${displayInfo}`, {
        modal: true,
      });
      outputChannel.appendLine(`Displays:\n${displayInfo}`);
    } else {
      vscode.window.showErrorMessage("Failed to list displays");
      outputChannel.appendLine("Failed to list displays");
    }
  } catch (error) {
    vscode.window.showErrorMessage(`List displays error: ${error}`);
    outputChannel.appendLine(`List displays error: ${error}`);
  }
}

async function listWindows() {
  if (!mcpClient) {
    vscode.window.showErrorMessage("MCP Screenshot server not running");
    return;
  }

  try {
    outputChannel.appendLine("Listing windows...");
    const result = await mcpClient.listWindows();

    if (result.status === "success" && result.windows) {
      const windowInfo = result.windows
        .map(
          (w: any) =>
            `${w.title} - ${w.processName} (${w.bounds.width}x${w.bounds.height})`
        )
        .join("\n");

      vscode.window.showInformationMessage(`Windows:\n${windowInfo}`, {
        modal: true,
      });
      outputChannel.appendLine(`Windows:\n${windowInfo}`);
    } else {
      vscode.window.showErrorMessage("Failed to list windows");
      outputChannel.appendLine("Failed to list windows");
    }
  } catch (error) {
    vscode.window.showErrorMessage(`List windows error: ${error}`);
    outputChannel.appendLine(`List windows error: ${error}`);
  }
}
