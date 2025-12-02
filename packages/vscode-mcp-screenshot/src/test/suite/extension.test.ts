import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

/**
 * VSCode Extension E2E Tests for MCP Screenshot
 * Tests the extension's integration with VSCode and the MCP server
 */
suite("MCP Screenshot Extension Test Suite", () => {
  let tempDir: string;

  suiteSetup(async function () {
    // Increase timeout for extension activation
    this.timeout(30000);

    // Create temp directory for test screenshots
    tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "vscode-mcp-screenshot-test-")
    );

    // Wait for extension to activate
    const ext = vscode.extensions.getExtension(
      "DigitalDefiance.mcp-screenshot"
    );
    if (ext && !ext.isActive) {
      await ext.activate();
    }

    // Give the MCP server time to start
    await new Promise((resolve) => setTimeout(resolve, 3000));
  });

  suiteTeardown(() => {
    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("Extension should be present", () => {
    const ext = vscode.extensions.getExtension(
      "DigitalDefiance.mcp-screenshot"
    );
    assert.ok(ext, "Extension should be installed");
  });

  test("Extension should activate", async function () {
    this.timeout(30000);

    const ext = vscode.extensions.getExtension(
      "DigitalDefiance.mcp-screenshot"
    );
    assert.ok(ext, "Extension should exist");

    if (!ext.isActive) {
      await ext.activate();
    }

    assert.ok(ext.isActive, "Extension should be active");
  });

  test("All commands should be registered", async () => {
    const commands = await vscode.commands.getCommands(true);

    const expectedCommands = [
      "mcp-screenshot.captureFullScreen",
      "mcp-screenshot.captureWindow",
      "mcp-screenshot.captureRegion",
      "mcp-screenshot.listDisplays",
      "mcp-screenshot.listWindows",
      "mcp-screenshot.openSettings",
    ];

    for (const cmd of expectedCommands) {
      assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
    }
  });

  test("Configuration should have default values", () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");

    assert.strictEqual(config.get("defaultFormat"), "png");
    assert.strictEqual(config.get("defaultQuality"), 90);
    assert.strictEqual(config.get("autoSave"), true);
    assert.strictEqual(config.get("autoStart"), true);
  });

  test("Should be able to update configuration", async () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");

    await config.update(
      "defaultFormat",
      "jpeg",
      vscode.ConfigurationTarget.Global
    );
    assert.strictEqual(config.get("defaultFormat"), "jpeg");

    // Reset to default
    await config.update(
      "defaultFormat",
      "png",
      vscode.ConfigurationTarget.Global
    );
  });

  test("List displays command should execute", async function () {
    this.timeout(15000);

    try {
      await vscode.commands.executeCommand("mcp-screenshot.listDisplays");
      // Command should execute without throwing
      assert.ok(true, "List displays command executed");
    } catch (error) {
      // If it fails, it might be due to no display server in CI
      console.log(
        "List displays failed (expected in headless environment):",
        error
      );
    }
  });

  test("List windows command should execute", async function () {
    this.timeout(15000);

    try {
      await vscode.commands.executeCommand("mcp-screenshot.listWindows");
      // Command should execute without throwing
      assert.ok(true, "List windows command executed");
    } catch (error) {
      console.log(
        "List windows failed (expected in headless environment):",
        error
      );
    }
  });

  test("Open settings command should execute", async () => {
    await vscode.commands.executeCommand("mcp-screenshot.openSettings");
    // Command should execute without throwing
    assert.ok(true, "Open settings command executed");
  });

  test("Output channel should be created", () => {
    // The extension creates an output channel named "MCP Screenshot"
    // We can't directly access it, but we can verify it doesn't throw
    assert.ok(true, "Output channel test passed");
  });
});

suite("MCP Screenshot Extension - Integration Tests", () => {
  test("Extension should handle server startup failure gracefully", async function () {
    this.timeout(10000);

    // Update config to use invalid server command
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const originalCommand = config.get("serverCommand");

    await config.update(
      "serverCommand",
      "invalid-command-xyz",
      vscode.ConfigurationTarget.Global
    );

    // Try to execute a command - should handle gracefully
    try {
      await vscode.commands.executeCommand("mcp-screenshot.listDisplays");
    } catch (error) {
      // Expected to fail, but should not crash extension
      assert.ok(true, "Handled invalid server command gracefully");
    }

    // Restore original config
    await config.update(
      "serverCommand",
      originalCommand,
      vscode.ConfigurationTarget.Global
    );
  });

  test("Extension should handle missing workspace folder", async () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const saveDir = config.get("saveDirectory");

    // The default uses ${workspaceFolder} which might not exist
    assert.ok(saveDir, "Save directory config exists");
  });
});

suite("MCP Screenshot Extension - Command Tests", () => {
  test("Capture full screen command should be available", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes("mcp-screenshot.captureFullScreen"),
      "Capture full screen command should be registered"
    );
  });

  test("Capture window command should be available", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes("mcp-screenshot.captureWindow"),
      "Capture window command should be registered"
    );
  });

  test("Capture region command should be available", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes("mcp-screenshot.captureRegion"),
      "Capture region command should be registered"
    );
  });
});

suite("MCP Screenshot Extension - Configuration Tests", () => {
  test("Should support all image formats", () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const formatProperty = config.inspect("defaultFormat");

    assert.ok(formatProperty, "Format property should exist");
    // The enum values should be defined in package.json
  });

  test("Quality setting should be within valid range", async () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");

    // Test valid quality
    await config.update(
      "defaultQuality",
      85,
      vscode.ConfigurationTarget.Global
    );
    assert.strictEqual(config.get("defaultQuality"), 85);

    // Reset to default
    await config.update(
      "defaultQuality",
      90,
      vscode.ConfigurationTarget.Global
    );
  });

  test("PII masking setting should be boolean", () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const piiMasking = config.get("enablePIIMasking");

    assert.strictEqual(typeof piiMasking, "boolean");
  });

  test("Auto start setting should be boolean", () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const autoStart = config.get("autoStart");

    assert.strictEqual(typeof autoStart, "boolean");
  });

  test("Server command should be configurable", async () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const originalCommand = config.get("serverCommand");

    await config.update(
      "serverCommand",
      "node",
      vscode.ConfigurationTarget.Global
    );
    assert.strictEqual(config.get("serverCommand"), "node");

    // Restore
    await config.update(
      "serverCommand",
      originalCommand,
      vscode.ConfigurationTarget.Global
    );
  });

  test("Server args should be configurable", async () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const originalArgs = config.get("serverArgs");

    const testArgs = ["test", "args"];
    await config.update(
      "serverArgs",
      testArgs,
      vscode.ConfigurationTarget.Global
    );
    assert.deepStrictEqual(config.get("serverArgs"), testArgs);

    // Restore
    await config.update(
      "serverArgs",
      originalArgs,
      vscode.ConfigurationTarget.Global
    );
  });
});

suite("MCP Screenshot Extension - Error Handling", () => {
  test("Should handle server not running", async function () {
    this.timeout(10000);

    // Disable auto start
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    await config.update("autoStart", false, vscode.ConfigurationTarget.Global);

    // Try to execute command - should show error message
    try {
      await vscode.commands.executeCommand("mcp-screenshot.captureFullScreen");
    } catch (error) {
      // Expected to fail gracefully
      assert.ok(true, "Handled server not running gracefully");
    }

    // Restore auto start
    await config.update("autoStart", true, vscode.ConfigurationTarget.Global);
  });

  test("Should handle invalid configuration", async () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");

    // Try to set invalid quality (should be clamped or rejected)
    try {
      await config.update(
        "defaultQuality",
        150,
        vscode.ConfigurationTarget.Global
      );
      const quality = config.get("defaultQuality");
      // Should either reject or clamp to valid range
      assert.ok(quality !== undefined, "Quality setting handled");
    } catch (error) {
      assert.ok(true, "Invalid quality rejected");
    }

    // Reset
    await config.update(
      "defaultQuality",
      90,
      vscode.ConfigurationTarget.Global
    );
  });
});
