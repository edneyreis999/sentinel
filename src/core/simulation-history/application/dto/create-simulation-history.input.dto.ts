import { SimulationStatus } from '../../domain/value-objects';

/**
 * Input DTO for creating a simulation history entry
 */
export interface CreateSimulationHistoryInput {
  projectPath: string;
  projectName: string;
  status?: SimulationStatus;
  ttkVersion: string;
  configJson: string;
  summaryJson?: string;
  hasReport?: boolean;
  reportFilePath?: string;
  durationMs: number;
  battleCount: number;
  trechoCount: number;
  timestamp?: Date;
}

/**
 * Output DTO for simulation history entry
 */
export interface SimulationHistoryEntryOutput {
  id: string;
  projectPath: string;
  projectName: string;
  status: SimulationStatus;
  ttkVersion: string;
  configJson: string;
  summaryJson: string;
  hasReport: boolean;
  reportFilePath?: string;
  durationMs: number;
  battleCount: number;
  trechoCount: number;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates an output DTO from the domain entity
 */
export function toSimulationHistoryEntryOutput(
  entry: SimulationHistoryEntryOutput,
): SimulationHistoryEntryOutput {
  return {
    id: entry.id,
    projectPath: entry.projectPath,
    projectName: entry.projectName,
    status: entry.status,
    ttkVersion: entry.ttkVersion,
    configJson: entry.configJson,
    summaryJson: entry.summaryJson,
    hasReport: entry.hasReport,
    reportFilePath: entry.reportFilePath,
    durationMs: entry.durationMs,
    battleCount: entry.battleCount,
    trechoCount: entry.trechoCount,
    timestamp: entry.timestamp,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}
