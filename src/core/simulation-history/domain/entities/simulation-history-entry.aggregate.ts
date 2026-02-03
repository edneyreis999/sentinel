import { DomainError } from '@core/shared/domain/errors';
import { SimulationStatus } from '../value-objects/simulation-status.vo';

/**
 * SimulationHistoryEntry Aggregate
 *
 * This aggregate represents a single simulation execution record with state machine
 * for status transitions. It encapsulates business rules for simulation lifecycle.
 *
 * State Machine Transitions:
 * - PENDING → RUNNING, CANCELLED
 * - RUNNING → COMPLETED, FAILED, CANCELLED
 * - COMPLETED → (terminal state)
 * - FAILED → RUNNING (retry)
 * - CANCELLED → (terminal state)
 */
export class SimulationHistoryEntry {
  private readonly _id: string;
  private readonly _projectPath: string;
  private readonly _projectName: string;
  private _status: SimulationStatus;
  private readonly _ttkVersion: string;
  private _configJson: string;
  private _summaryJson: string;
  private _hasReport: boolean;
  private _reportFilePath?: string;
  private readonly _durationMs: number;
  private readonly _battleCount: number;
  private readonly _trechoCount: number;
  private readonly _timestamp: Date;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: SimulationHistoryEntryProps) {
    this._id = props.id;
    this._projectPath = props.projectPath;
    this._projectName = props.projectName;
    this._status = props.status ?? SimulationStatus.PENDING;
    this._ttkVersion = props.ttkVersion;
    this._configJson = props.configJson;
    this._summaryJson = props.summaryJson;
    this._hasReport = props.hasReport ?? false;
    this._reportFilePath = props.reportFilePath;
    this._durationMs = props.durationMs;
    this._battleCount = props.battleCount;
    this._trechoCount = props.trechoCount;
    this._timestamp = props.timestamp ?? new Date();
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? this._createdAt;

    this.validate();
  }

  /**
   * Factory method to create a new SimulationHistoryEntry
   */
  static create(props: CreateSimulationHistoryEntryProps): SimulationHistoryEntry {
    const entry = new SimulationHistoryEntry({
      ...props,
      id: props.id ?? crypto.randomUUID(),
      status: props.status ?? SimulationStatus.PENDING,
      timestamp: props.timestamp ?? new Date(),
      summaryJson: props.summaryJson ?? '{}',
      hasReport: props.hasReport ?? false,
      reportFilePath: props.reportFilePath ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return entry;
  }

  /**
   * Validates the aggregate's invariants
   */
  private validate(): void {
    if (!this._projectPath?.trim()) {
      throw new DomainError('Project path is required');
    }

    if (!this._projectName?.trim()) {
      throw new DomainError('Project name is required');
    }

    if (!this._ttkVersion?.trim()) {
      throw new DomainError('TTK version is required');
    }

    if (this._durationMs < 0) {
      throw new DomainError('Duration cannot be negative');
    }

    if (this._battleCount < 0) {
      throw new DomainError('Battle count cannot be negative');
    }

    if (this._trechoCount < 0) {
      throw new DomainError('Trecho count cannot be negative');
    }

    // Business rule: If hasReport is true, reportFilePath must be provided
    if (this._hasReport && !this._reportFilePath?.trim()) {
      throw new DomainError('Report file path is required when hasReport is true');
    }
  }

  /**
   * Checks if a transition to the new status is valid
   */
  canTransitionTo(newStatus: SimulationStatus): boolean {
    const transitions: Record<SimulationStatus, SimulationStatus[]> = {
      [SimulationStatus.PENDING]: [SimulationStatus.RUNNING, SimulationStatus.CANCELLED],
      [SimulationStatus.RUNNING]: [
        SimulationStatus.COMPLETED,
        SimulationStatus.FAILED,
        SimulationStatus.CANCELLED,
      ],
      [SimulationStatus.COMPLETED]: [], // Terminal state
      [SimulationStatus.FAILED]: [SimulationStatus.RUNNING], // Can retry
      [SimulationStatus.CANCELLED]: [], // Terminal state
    };

    return transitions[this._status]?.includes(newStatus) ?? false;
  }

  /**
   * Transitions to a new status with validation
   */
  private transitionTo(newStatus: SimulationStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new DomainError(`Cannot transition from ${this._status} to ${newStatus}`);
    }

    this._status = newStatus;
    this.touch();
  }

  /**
   * Marks the simulation as running
   */
  markAsRunning(): void {
    this.transitionTo(SimulationStatus.RUNNING);
  }

  /**
   * Marks the simulation as completed with summary
   */
  markAsCompleted(summaryJson: string): void {
    this.transitionTo(SimulationStatus.COMPLETED);
    this._summaryJson = summaryJson;
  }

  /**
   * Marks the simulation as failed with optional error details
   */
  markAsFailed(errorJson?: string): void {
    this.transitionTo(SimulationStatus.FAILED);
    if (errorJson) {
      this._summaryJson = errorJson;
    }
  }

  /**
   * Cancels the simulation
   */
  cancel(): void {
    this.transitionTo(SimulationStatus.CANCELLED);
  }

  /**
   * Retries a failed simulation
   */
  retry(): void {
    if (this._status !== SimulationStatus.FAILED) {
      throw new DomainError('Only failed simulations can be retried');
    }
    this.transitionTo(SimulationStatus.RUNNING);
  }

  /**
   * Updates the summary JSON
   */
  updateSummary(summaryJson: string): void {
    this._summaryJson = summaryJson;
    this.touch();
  }

  /**
   * Sets report file path and marks hasReport as true
   */
  setReportFilePath(reportFilePath: string): void {
    if (!reportFilePath?.trim()) {
      throw new DomainError('Report file path cannot be empty');
    }
    this._reportFilePath = reportFilePath;
    this._hasReport = true;
    this.touch();
  }

  /**
   * Updates the timestamp
   */
  private touch(): void {
    this._updatedAt = new Date();
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get projectPath(): string {
    return this._projectPath;
  }

  get projectName(): string {
    return this._projectName;
  }

  get status(): SimulationStatus {
    return this._status;
  }

  get ttkVersion(): string {
    return this._ttkVersion;
  }

  get configJson(): string {
    return this._configJson;
  }

  get summaryJson(): string {
    return this._summaryJson;
  }

  get hasReport(): boolean {
    return this._hasReport;
  }

  get reportFilePath(): string | undefined {
    return this._reportFilePath;
  }

  get durationMs(): number {
    return this._durationMs;
  }

  get battleCount(): number {
    return this._battleCount;
  }

  get trechoCount(): number {
    return this._trechoCount;
  }

  get timestamp(): Date {
    return new Date(this._timestamp);
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  // Business query methods
  isPending(): boolean {
    return this._status === SimulationStatus.PENDING;
  }

  isRunning(): boolean {
    return this._status === SimulationStatus.RUNNING;
  }

  isCompleted(): boolean {
    return this._status === SimulationStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this._status === SimulationStatus.FAILED;
  }

  isCancelled(): boolean {
    return this._status === SimulationStatus.CANCELLED;
  }

  isTerminal(): boolean {
    return [SimulationStatus.COMPLETED, SimulationStatus.CANCELLED].includes(this._status);
  }

  toJSON() {
    return {
      id: this._id,
      projectPath: this._projectPath,
      projectName: this._projectName,
      status: this._status,
      ttkVersion: this._ttkVersion,
      configJson: this._configJson,
      summaryJson: this._summaryJson,
      hasReport: this._hasReport,
      reportFilePath: this._reportFilePath,
      durationMs: this._durationMs,
      battleCount: this._battleCount,
      trechoCount: this._trechoCount,
      timestamp: this._timestamp.toISOString(),
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }
}

/**
 * Props for creating a new SimulationHistoryEntry
 */
export interface CreateSimulationHistoryEntryProps {
  id?: string;
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
 * Internal props for the aggregate (includes dates)
 */
interface SimulationHistoryEntryProps extends CreateSimulationHistoryEntryProps {
  id: string;
  status: SimulationStatus;
  summaryJson: string;
  hasReport: boolean;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}
