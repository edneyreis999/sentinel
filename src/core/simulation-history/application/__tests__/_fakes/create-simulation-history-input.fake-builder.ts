import { CreateSimulationHistoryInput } from '../../dto';
import { SimulationStatus } from '../../../domain/value-objects';

/**
 * PropOrFactory type for FakeBuilder pattern
 * Allows properties to be either static values or factory functions
 */
type PropOrFactory<T> = T | ((index: number) => T);

/**
 * FakeBuilder for CreateSimulationHistoryInput
 *
 * Generates test data following the FakeBuilder with PropOrFactory pattern
 * Reference: TEST-ADR-001: FakeBuilder with PropOrFactory Pattern
 */
export class CreateSimulationHistoryInputFakeBuilder {
  private countObjs: number;
  private baseIndex: number;
  private static globalIndex = 0;

  private _projectPath: PropOrFactory<string> = (index) => `/test/project-${index + 1}`;
  private _projectName: PropOrFactory<string> = (index) => `Test Project ${index + 1}`;
  private _status: PropOrFactory<SimulationStatus | undefined> = undefined;
  private _ttkVersion: PropOrFactory<string> = '1.0.0';
  private _configJson: PropOrFactory<string> = () => JSON.stringify({ test: true });
  private _summaryJson: PropOrFactory<string | undefined> = undefined;
  private _hasReport: PropOrFactory<boolean | undefined> = undefined;
  private _reportFilePath: PropOrFactory<string | undefined> = undefined;
  private _durationMs: PropOrFactory<number> = 1000;
  private _battleCount: PropOrFactory<number> = 10;
  private _trechoCount: PropOrFactory<number> = 5;
  private _timestamp: PropOrFactory<Date | undefined> = undefined;

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.baseIndex = CreateSimulationHistoryInputFakeBuilder.globalIndex * 100;
    CreateSimulationHistoryInputFakeBuilder.globalIndex += 1;
  }

  static anInput(): CreateSimulationHistoryInputFakeBuilder {
    return new CreateSimulationHistoryInputFakeBuilder(1);
  }

  static theInputs(countObjs: number): CreateSimulationHistoryInputFakeBuilder {
    return new CreateSimulationHistoryInputFakeBuilder(countObjs);
  }

  withProjectPath(valueOrFactory: PropOrFactory<string>): this {
    this._projectPath = valueOrFactory;
    return this;
  }

  withProjectName(valueOrFactory: PropOrFactory<string>): this {
    this._projectName = valueOrFactory;
    return this;
  }

  withStatus(valueOrFactory: PropOrFactory<SimulationStatus | undefined>): this {
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

  withSummaryJson(valueOrFactory: PropOrFactory<string | undefined>): this {
    this._summaryJson = valueOrFactory;
    return this;
  }

  withHasReport(valueOrFactory: PropOrFactory<boolean | undefined>): this {
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

  withTimestamp(valueOrFactory: PropOrFactory<Date | undefined>): this {
    this._timestamp = valueOrFactory;
    return this;
  }

  private callFactory<T>(valueOrFactory: PropOrFactory<T>, index: number): T {
    return valueOrFactory instanceof Function ? valueOrFactory(index) : valueOrFactory;
  }

  build(index = 0): CreateSimulationHistoryInput {
    return {
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
  }

  buildMany(count: number): CreateSimulationHistoryInput[] {
    return Array.from({ length: count }, (_, index) => this.build(index));
  }
}
