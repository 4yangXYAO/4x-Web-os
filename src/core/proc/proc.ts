/**
 * NA.os Process Manager
 * 
 * Manages application lifecycle and process scheduling.
 * Handles process creation, termination, and resource accounting.
 * 
 * Responsibilities:
 * - Spawn new processes from app manifests
 * - Manage process states (running, paused, terminated)
 * - Enforce process limits (max processes, memory quota)
 * - Provide process listing and signaling
 * - Emit events on process lifecycle changes
 */

// import { v4 as uuidv4 } from 'uuid';
import { emit } from '@services/event-bus';
import { info, error as logError } from '@services/logger';
import type { 
  ProcessInfo, 
  AppManifest, 
  ProcError,
  Result
} from '@include/types';
import { SYSTEM_LIMITS } from '@include/config';

// ============================================================================
// PROCESS STORE
// ============================================================================

// Global process table: PID → ProcessInfo
const processTable = new Map<string, ProcessInfo>();

// Track process relationships: Parent PID → Child PIDs[]
const processTree = new Map<string, string[]>();

// ============================================================================
// PROCESS LIFECYCLE
// ============================================================================

/**
 * Spawn a new process from an application manifest.
 * 
 * @param manifest App manifest to spawn
 * @param parentPid Optional parent process ID
 * @returns Result with ProcessInfo if successful
 */
export function spawn(manifest: AppManifest, parentPid?: string): Result<ProcessInfo, ProcError> {
  // Check system limits
  if (processTable.size >= SYSTEM_LIMITS.MAX_PROCESSES) {
    const err = new Error('Maximum process limit reached') as ProcError;
    err.code = 'SPAWN_FAILED';
    logError('kernel', 'Failed to spawn process: limit reached', new Error(manifest.id));
    return { ok: false, error: err };
  }

  // Check parent process existence if provided
  if (parentPid && !processTable.has(parentPid)) {
    const err = new Error(`Parent process not found: ${parentPid}`) as ProcError;
    err.code = 'NOT_FOUND';
    return { ok: false, error: err };
  }

  const pid = crypto.randomUUID();
  
  const processInfo: ProcessInfo = {
    pid,
    name: manifest.name,
    appId: manifest.id,
    state: 'running',
    parentPid,
    memoryUsageMB: 0, // Initial memory usage
    createdAt: new Date(),
    metadata: {
      priority: 128, // Default priority
      cpuPercentage: 0,
      uptime: 0
    }
  };

  // Register in process table
  processTable.set(pid, processInfo);

  // Update process tree
  if (parentPid) {
    const children = processTree.get(parentPid) || [];
    children.push(pid);
    processTree.set(parentPid, children);
  }

  info('kernel', `Spawned process ${pid} (${manifest.name})`, { appId: manifest.id, parentPid });
  emit('proc:spawned', processInfo);

  return { ok: true, value: processInfo };
}

/**
 * Terminate a process by PID.
 * 
 * @param pid Process ID to kill
 * @param exitCode Optional exit code (defaults to 0)
 * @returns Result indicating success or failure
 */
export function kill(pid: string, exitCode = 0): Result<boolean, ProcError> {
  const proc = processTable.get(pid);
  
  if (!proc) {
    const err = new Error(`Process not found: ${pid}`) as ProcError;
    err.code = 'NOT_FOUND';
    return { ok: false, error: err };
  }

  // Transition state
  proc.state = 'terminated';
  proc.metadata.exitCode = exitCode;
  proc.metadata.uptime = Date.now() - proc.createdAt.getTime();

  // Terminate all children recursively (orphan management)
  const children = processTree.get(pid);
  if (children) {
    for (const childPid of [...children]) {
      kill(childPid, -1); // Signal child termination with -1
    }
    processTree.delete(pid);
  }

  info('kernel', `Terminated process ${pid} (${proc.name})`, { exitCode });
  emit('proc:terminated', { pid, exitCode });

  // cleanupTerminated(pid); // Keep it in table as zombie for a while or remove immediately?
  // For now, let's remove immediately to free up slots
  processTable.delete(pid);
  
  // Remove from parent's children list
  if (proc.parentPid) {
    const siblings = processTree.get(proc.parentPid);
    if (siblings) {
      const index = siblings.indexOf(pid);
      if (index > -1) {
        siblings.splice(index, 1);
      }
    }
  }

  return { ok: true, value: true };
}

/**
 * Get information about a specific process.
 * 
 * @param pid Process ID
 * @returns ProcessInfo or undefined
 */
export function getProcess(pid: string): ProcessInfo | undefined {
  return processTable.get(pid);
}

/**
 * List all active processes.
 * 
 * @returns Array of ProcessInfo
 */
export function listProcesses(): ProcessInfo[] {
  return Array.from(processTable.values());
}

/**
 * Update process resource usage.
 * Called by system monitors or the app itself.
 * 
 * @param pid Process ID
 * @param memoryMB New memory usage in MB
 * @param cpu Percentage of CPU usage
 */
export function updateResources(pid: string, memoryMB: number, cpu: number): void {
  const proc = processTable.get(pid);
  if (proc) {
    proc.memoryUsageMB = memoryMB;
    proc.metadata.cpuPercentage = cpu;
    proc.metadata.uptime = Date.now() - proc.createdAt.getTime();
  }
}

// ============================================================================
// SYSTEM OPERATIONS
// ============================================================================

/**
 * Initialize the process manager.
 */
export function initializeProc(): void {
  processTable.clear();
  processTree.clear();
  info('kernel', 'Process Manager initialized');
}

/**
 * Kill all processes (system shutdown/reboot).
 */
export function killAll(): void {
  const pids = Array.from(processTable.keys());
  for (const pid of pids) {
    kill(pid, 0);
  }
  info('kernel', 'All processes terminated');
}

export default {
  spawn,
  kill,
  getProcess,
  listProcesses,
  updateResources,
  initializeProc,
  killAll
};
