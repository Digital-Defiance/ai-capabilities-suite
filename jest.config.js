/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/packages"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  // Exclude VSCode extension packages - they use Mocha, not Jest
  testPathIgnorePatterns: [
    "/node_modules/",
    "/out/",
    "/dist/",
    "/.vscode-test/",
    "/packages/vscode-mcp-debugger/",
    "/packages/vscode-mcp-acs-filesystem/",
    "/packages/vscode-mcp-acs-process/",
    "/packages/vscode-mcp-screenshot/",
    "/packages/vscode-shared-status-bar/",
  ],
  modulePathIgnorePatterns: [
    "<rootDir>/packages/vscode-mcp-debugger/",
    "<rootDir>/packages/vscode-mcp-acs-filesystem/",
    "<rootDir>/packages/vscode-mcp-acs-process/",
    "<rootDir>/packages/vscode-mcp-screenshot/",
    "<rootDir>/packages/vscode-shared-status-bar/",
    "<rootDir>/.*/\\.vscode-test/",
    "<rootDir>/.*/out/",
    "<rootDir>/.*/dist/",
  ],
  collectCoverageFrom: [
    "packages/*/src/**/*.ts",
    "!packages/vscode-*/**",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/out/**",
    "!**/dist/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
};
