import { SimulationHistoryEntry, CreateSimulationHistoryEntryProps } from '../entities';
import { SimulationStatus } from '../value-objects';

/**
 * PropOrFactory type for FakeBuilder pattern
 * Allows properties to be either static values or factory functions
 */
type PropOrFactory<T> = T | ((index: number) => T);

/**
 * FakeBuilder for SimulationHistoryEntry
 *
 * Generates test data following the FakeBuilder with PropOrFactory pattern
 * Reference: TEST-ADR-001: FakeBuilder with PropOrFactory Pattern
 */
export class SimulationHistoryEntryFakeBuilder {
  private countObjs: number;
  private baseIndex: number;
  private static globalIndex = 0;

  private _id: PropOrFactory<string> = () => crypto.randomUUID();
  private _projectPath: PropOrFactory<string> = (index) => `/projects/project-${index + 1}`;
  private _projectName: PropOrFactory<string> = (index) => `Test Project ${index + 1}`;
  private _status: PropOrFactory<SimulationStatus> = SimulationStatus.PENDING;
  private _ttkVersion: PropOrFactory<string> = '1.0.0';
  private _configJson: PropOrFactory<string> = () => JSON.stringify({ test: true });
  private _summaryJson: PropOrFactory<string> = () => JSON.stringify({ summary: 'test' });
  private _hasReport: PropOrFactory<boolean> = false;
  private _reportFilePath: PropOrFactory<string | undefined> = undefined;
  private _durationMs: PropOrFactory<number> = 1000;
  private _battleCount: PropOrFactory<number> = 10;
  private _trechoCount: PropOrFactory<number> = 5;
  private _timestamp: PropOrFactory<Date> = () => new Date();

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.baseIndex = SimulationHistoryEntryFakeBuilder.globalIndex * 100;
    SimulationHistoryEntryFakeBuilder.globalIndex += 1;
  }

  static anEntry(): SimulationHistoryEntryFakeBuilder {
    return new SimulationHistoryEntryFakeBuilder(1);
  }

  static theEntries(countObjs: number): SimulationHistoryEntryFakeBuilder {
    return new SimulationHistoryEntryFakeBuilder(countObjs);
  }

  withId(valueOrFactory: PropOrFactory<string>): this {
    this._id = valueOrFactory;
    return this;
  }

  withProjectPath(valueOrFactory: PropOrFactory<string>): this {
    this._projectPath = valueOrFactory;
    return this;
  }

  withProjectName(valueOrFactory: PropOrFactory<string>): this {
    this._projectName = valueOrFactory;
    return this;
  }

  withStatus(valueOrFactory: PropOrFactory<SimulationStatus>): this {
    this._status = valueOrFactory;
    return this;
  }

  withTtkVersion(valueOrFactory: PropOrFactory<string>): this {
    this._ttkVersion = valueOrFactory;
    return this;
  }

  withConfigJson(valueOrFactory: PropOrFactory<string>): this {
    this._configJson = valueOrFactory;
    return this;
  }

  withSummaryJson(valueOrFactory: PropOrFactory<string>): this {
    this._summaryJson = valueOrFactory;
    return this;
  }

  withHasReport(valueOrFactory: PropOrFactory<boolean>): this {
    this._hasReport = valueOrFactory;
    return this;
  }

  withReportFilePath(valueOrFactory: PropOrFactory<string | undefined>): this {
    this._reportFilePath = valueOrFactory;
    return this;
  }

  withDurationMs(valueOrFactory: PropOrFactory<number>): this {
    this._durationMs = valueOrFactory;
    return this;
  }

  withBattleCount(valueOrFactory: PropOrFactory<number>): this {
    this._battleCount = valueOrFactory;
    return this;
  }

  withTrechoCount(valueOrFactory: PropOrFactory<number>): this {
    this._trechoCount = valueOrFactory;
    return this;
  }

  withTimestamp(valueOrFactory: PropOrFactory<Date>): this {
    this._timestamp = valueOrFactory;
    return this;
  }

  private callFactory<T>(valueOrFactory: PropOrFactory<T>, index: number): T {
    return valueOrFactory instanceof Function ? valueOrFactory(index) : valueOrFactory;
  }

  build(index = 0): SimulationHistoryEntry {
    const props: CreateSimulationHistoryEntryProps = {
      id: this.callFactory(this._id, index),
      projectPath: this.callFactory(this._projectPath, index),
      projectName: this.callFactory(this._projectName, index),
      status: this.callFactory(this._status, index),
      ttkVersion: this.callFactory(this._ttkVersion, index),
      configJson: this.callFactory(this._configJson, index),
      summaryJson: this.callFactory(this._summaryJson, index),
      hasReport: this.callFactory(this._hasReport, index),
      reportFilePath: this.callFactory(this._reportFilePath, index),
      durationMs: this.callFactory(this._durationMs, index),
      battleCount: this.callFactory(this._battleCount, index),
      trechoCount: this.callFactory(this._trechoCount, index),
      timestamp: this.callFactory(this._timestamp, index),
    };

    return SimulationHistoryEntry.create(props);
  }

  buildMany(count: number): SimulationHistoryEntry[] {
    return Array.from({ length: count }, (_, index) => this.build(index));
  }
}
