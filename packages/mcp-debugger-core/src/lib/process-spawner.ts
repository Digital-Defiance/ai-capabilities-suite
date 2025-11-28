import { spawn, ChildProcess } from 'child_process';

export interface SpawnWithInspectorResult {
  process: ChildProcess;
  wsUrl: string;
}

/**
 * Spawn a Node.js process with inspector enabled
 * @param command Command to execute
 * @param args Command arguments
 * @param cwd Working directory
 * @returns Process handle and inspector WebSocket URL
 */
/**
 * Spawn a Node.js process with inspector enabled (without breaking at start)
 * Useful for hang detection where we want the process to run normally
 * @param command Command to execute
 * @param args Command arguments
 * @param cwd Working directory
 * @returns Process handle and inspector WebSocket URL
 */
export async function spawnWithInspectorRunning(
  command: string,
  args: string[] = [],
  cwd?: string,
): Promise<SpawnWithInspectorResult> {
  return new Promise((resolve, reject) => {
    const inspectorArgs = ['--inspect=0', '--enable-source-maps', ...args];

    const child = spawn(command, inspectorArgs, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_OPTIONS: '--enable-source-maps' },
    });

    let wsUrl: string | null = null;
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('Timeout waiting for inspector URL'));
    }, 5000);

    child.stderr.on('data', (data: Buffer) => {
      const output = data.toString();
      const match = output.match(/ws:\/\/127\.0\.0\.1:\d+\/[a-f0-9-]+/);

      if (match && !wsUrl) {
        wsUrl = match[0];
        clearTimeout(timeout);
        resolve({
          process: child,
          wsUrl,
        });
      }
    });

    child.on('error', (error: Error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on('exit', (code: number | null) => {
      if (!wsUrl) {
        clearTimeout(timeout);
        reject(
          new Error(
            `Process exited with code ${code} before inspector URL was found`,
          ),
        );
      }
    });
  });
}

export async function spawnWithInspector(
  command: string,
  args: string[] = [],
  cwd?: string,
): Promise<SpawnWithInspectorResult> {
  return new Promise((resolve, reject) => {
    const inspectorArgs = ['--inspect-brk=0', '--enable-source-maps', ...args];

    const child = spawn(command, inspectorArgs, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_OPTIONS: '--enable-source-maps' },
    });

    let wsUrl: string | null = null;
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('Timeout waiting for inspector URL'));
    }, 5000);

    child.stderr.on('data', (data: Buffer) => {
      const output = data.toString();
      const match = output.match(/ws:\/\/127\.0\.0\.1:\d+\/[a-f0-9-]+/);

      if (match && !wsUrl) {
        wsUrl = match[0];
        clearTimeout(timeout);
        resolve({
          process: child,
          wsUrl,
        });
      }
    });

    child.on('error', (error: Error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on('exit', (code: number | null) => {
      if (!wsUrl) {
        clearTimeout(timeout);
        reject(
          new Error(
            `Process exited with code ${code} before inspector URL was found`,
          ),
        );
      }
    });
  });
}
