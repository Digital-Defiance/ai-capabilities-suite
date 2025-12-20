# MCP ACS Debugger - Monorepo Setup

## Project Structure

Create a new standalone Nx monorepo for TS-MCP (TypeScript MCP ACS Debugger):

```
ts-mcp/                          # New repo root
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── packages/
│   ├── debugger-core/           # Core debugger functionality
│   │   ├── src/
│   │   │   ├── inspector/
│   │   │   │   ├── client.ts
│   │   │   │   └── protocol.ts
│   │   │   ├── session/
│   │   │   │   ├── manager.ts
│   │   │   │   └── session.ts
│   │   │   ├── detector/
│   │   │   │   ├── hang-detector.ts
│   │   │   │   └── sampler.ts
│   │   │   └── index.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   └── project.json
│   │
│   ├── mcp-server/              # MCP server implementation
│   │   ├── src/
│   │   │   ├── tools/
│   │   │   │   ├── detect-hang.ts
│   │   │   │   ├── start-debug.ts
│   │   │   │   ├── inspect.ts
│   │   │   │   └── index.ts
│   │   │   ├── server.ts
│   │   │   └── index.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   └── project.json
│   │
│   └── cli/                     # Optional CLI wrapper
│       ├── src/
│       │   ├── commands/
│       │   └── index.ts
│       ├── package.json
│       └── project.json
│
├── tools/
│   └── scripts/
│       ├── build.sh
│       └── test.sh
├── .gitignore
├── .prettierrc
├── .eslintrc.json
├── nx.json
├── package.json
├── tsconfig.base.json
├── yarn.lock
└── README.md
```

## Setup Commands

### 1. Create New Directory

```bash
cd ~/source/repos/DigitalBurnbag
mkdir ts-mcp
cd ts-mcp
```

### 2. Initialize Nx Workspace

```bash
# Create Nx workspace with TypeScript preset
npx create-nx-workspace@latest . \
  --preset=ts \
  --name=ts-mcp \
  --packageManager=yarn \
  --nxCloud=skip
```

### 3. Add Required Plugins

```bash
# Add Node plugin for library generation
yarn add -D @nx/node

# Add Jest for testing
yarn add -D @nx/jest

# Add ESLint
yarn add -D @nx/eslint-plugin
```

### 4. Generate Core Package

```bash
npx nx g @nx/node:library debugger-core \
  --directory=packages/debugger-core \
  --buildable \
  --publishable \
  --importPath=@ai-capabilities-suite/mcp-core \
  --unitTestRunner=jest
```

### 5. Generate MCP Server Package

```bash
npx nx g @nx/node:library mcp-server \
  --directory=packages/mcp-server \
  --buildable \
  --publishable \
  --importPath=@ai-capabilities-suite/mcp-server \
  --unitTestRunner=jest
```

### 6. Generate CLI Package (Optional)

```bash
npx nx g @nx/node:application cli \
  --directory=packages/cli \
  --bundler=esbuild
```

## Root package.json

```json
{
  "name": "@ai-capabilities-suite/ts-mcp-source",
  "version": "0.1.0",
  "license": "MIT",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "nx run-many --target=build --all",
    "test": "nx run-many --target=test --all",
    "lint": "nx run-many --target=lint --all",
    "format": "nx format:write",
    "affected:build": "nx affected --target=build",
    "affected:test": "nx affected --target=test"
  },
  "devDependencies": {
    "@nx/eslint-plugin": "^18.0.0",
    "@nx/jest": "^18.0.0",
    "@nx/js": "^18.0.0",
    "@nx/node": "^18.0.0",
    "@nx/workspace": "^18.0.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "jest": "^29.7.0",
    "nx": "^18.0.0",
    "prettier": "^3.0.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "typescript": "~5.4.0"
  }
}
```

## nx.json

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "test": {
      "cache": true
    },
    "lint": {
      "cache": true
    }
  },
  "defaultProject": "mcp-server",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/jest.config.[jt]s",
      "!{projectRoot}/.eslintrc.json"
    ],
    "sharedGlobals": []
  },
  "generators": {
    "@nx/node": {
      "library": {
        "buildable": true,
        "publishable": true,
        "unitTestRunner": "jest"
      }
    }
  }
}
```

## tsconfig.base.json

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "rootDir": ".",
    "sourceMap": true,
    "declaration": false,
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "ES2021",
    "module": "ESNext",
    "lib": ["ES2021"],
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@ai-capabilities-suite/mcp-core": [
        "packages/debugger-core/src/index.ts"
      ],
      "@ai-capabilities-suite/mcp-server": ["packages/mcp-server/src/index.ts"]
    }
  },
  "exclude": ["node_modules", "tmp"]
}
```

## Package: debugger-core/package.json

```json
{
  "name": "@ai-capabilities-suite/mcp-core",
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.js",
  "types": "./src/index.d.ts",
  "exports": {
    ".": {
      "import": "./src/index.js",
      "types": "./src/index.d.ts"
    }
  },
  "dependencies": {
    "ws": "^8.16.0"
  },
  "devDependencies": {
    "@types/ws": "^8.5.10"
  }
}
```

## Package: mcp-server/package.json

```json
{
  "name": "@ai-capabilities-suite/mcp-server",
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.js",
  "types": "./src/index.d.ts",
  "bin": {
    "ts-mcp": "./src/index.js"
  },
  "exports": {
    ".": {
      "import": "./src/index.js",
      "types": "./src/index.d.ts"
    }
  },
  "dependencies": {
    "@ai-capabilities-suite/mcp-core": "*",
    "@modelcontextprotocol/sdk": "^0.5.0"
  }
}
```

## .gitignore

```gitignore
# Nx
.nx/cache
.nx/workspace-data

# Build outputs
dist/
build/
*.tsbuildinfo

# Dependencies
node_modules/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/

# Environment
.env
.env.local
.env.*.local
```

## README.md

```markdown
# TS-MCP (TypeScript MCP ACS Debugger)

A Model Context Protocol (MCP) server that provides debugging capabilities for Node.js/TypeScript applications.

## Features

- 🔍 Hang detection - Automatically detect where code hangs
- 🐛 Interactive debugging - Set breakpoints and inspect variables
- 📊 Call stack analysis - See exactly what's executing
- 🔬 Expression evaluation - Check variable values at runtime
- 🗺️ Source map support - Debug TypeScript directly

## Installation

\`\`\`bash
yarn install
yarn build
\`\`\`

## Usage

### As MCP Server

Add to your MCP configuration:

\`\`\`json
{
"mcpServers": {
"debugger": {
"command": "node",
"args": ["path/to/mcp-debugger/dist/packages/mcp-server/src/index.js"]
}
}
}
\`\`\`

### Detect Hanging Process

\`\`\`typescript
// Via MCP
const result = await mcpCall('debugger_detect_hang', {
command: 'node',
args: ['script.js'],
timeout: 10000
});

if (result.hung) {
console.log('Hung at:', result.location);
console.log('Stack:', result.stack);
}
\`\`\`

## Development

\`\`\`bash

# Build all packages

yarn build

# Run tests

yarn test

# Run tests in watch mode

yarn test --watch

# Lint

yarn lint

# Format

yarn format
\`\`\`

## Packages

- **@ai-capabilities-suite/mcp-core** - Core debugging functionality
- **@ai-capabilities-suite/mcp-server** - MCP server implementation
- **@ai-capabilities-suite/ts-mcp-cli** - Command-line interface (optional)

## License

MIT
```

## GitHub Actions CI

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "yarn"

      - name: Install dependencies
        run: yarn install --immutable

      - name: Lint
        run: yarn lint

      - name: Build
        run: yarn build

      - name: Test
        run: yarn test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: always()
```

## Setup Checklist

- [ ] Create new directory `ts-mcp`
- [ ] Initialize Nx workspace with yarn
- [ ] Add Nx plugins (@nx/node, @nx/jest)
- [ ] Generate `debugger-core` package (@ai-capabilities-suite/mcp-core)
- [ ] Generate `mcp-server` package (@ai-capabilities-suite/mcp-server)
- [ ] Configure tsconfig.base.json with path mappings
- [ ] Set up .gitignore
- [ ] Create README.md
- [ ] Set up GitHub Actions CI
- [ ] Initialize git repository
- [ ] Create initial commit
- [ ] Push to GitHub (DigitalBurnbag/ts-mcp)

## Next Steps

After setup:

1. Implement core debugger functionality in `debugger-core`
2. Implement MCP tools in `mcp-server`
3. Add tests
4. Build and test locally
5. Use to debug the hanging audit tests
