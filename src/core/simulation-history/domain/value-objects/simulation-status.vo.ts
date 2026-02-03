/**
 * SimulationStatus Value Object
 *
 * Represents the current state of a simulation execution.
 * This enum is used in the state machine pattern for status transitions.
 */
export enum SimulationStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Type guard for checking if a string is a valid SimulationStatus
 */
export function isSimulationStatus(value: string): value is SimulationStatus {
  return Object.values(SimulationStatus).includes(value as SimulationStatus);
}

/**
 * Parses a string to SimulationStatus, throws if invalid
 */
export function parseSimulationStatus(value: string): SimulationStatus {
  if (!isSimulationStatus(value)) {
    throw new Error(`Invalid simulation status: ${value}`);
  }
  return value;
}
