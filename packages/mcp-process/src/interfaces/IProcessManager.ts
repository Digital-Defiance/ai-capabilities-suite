/**
 * Interface for process management functionality
 */

import { ManagedProcess, ProcessGroup } from "../types";

export interface IProcessManager {
  /**
   * Register a managed process
   * @param process Managed process information
   */
  register(process: ManagedProcess): void;

  /**
   * Unregister a managed process
   * @param pid Process ID
   */
  unregister(pid: number): void;

  /**
   * Get a managed process by PID
   * @param pid Process ID
   * @returns Managed process or undefined
   */
  get(pid: number): ManagedProcess | undefined;

  /**
   * Get all managed processes
   * @returns Array of managed processes
   */
  getAll(): ManagedProcess[];

  /**
   * Create a process group
   * @param name Group name
   * @param pipeline Whether this is a pipeline group
   * @returns Group ID
   */
  createGroup(name: string, pipeline: boolean): string;

  /**
   * Add a process to a group
   * @param groupId Group ID
   * @param pid Process ID
   */
  addToGroup(groupId: string, pid: number): void;

  /**
   * Get a process group
   * @param groupId Group ID
   * @returns Process group or undefined
   */
  getGroup(groupId: string): ProcessGroup | undefined;

  /**
   * Get all process groups
   * @returns Array of process groups
   */
  getAllGroups(): ProcessGroup[];
}
