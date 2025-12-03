/**
 * Interface for process launching functionality
 */

import { ProcessConfig } from "../types";

export interface IProcessLauncher {
  /**
   * Launch a new process with the given configuration
   * @param config Process configuration
   * @returns Process ID of the launched process
   */
  launch(config: ProcessConfig): Promise<number>;

  /**
   * Check if a process is running
   * @param pid Process ID
   * @returns True if the process is running
   */
  isRunning(pid: number): boolean;
}
