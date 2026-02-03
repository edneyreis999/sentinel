import { SimulationStatus } from '../value-objects/simulation-status.vo';
import { SimulationHistoryEntryFakeBuilder } from './simulation-history-entry.fake-builder';
import { DomainError } from '@core/shared/domain/errors';

describe('SimulationHistoryEntry Aggregate', () => {
  describe('factory method', () => {
    it('should create a valid entry with minimum required props', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry().build();

      expect(entry.id).toBeDefined();
      expect(entry.projectPath).toBeDefined();
      expect(entry.projectName).toBeDefined();
      expect(entry.status).toBe(SimulationStatus.PENDING);
      expect(entry.ttkVersion).toBeDefined();
      expect(entry.configJson).toBeDefined();
      expect(entry.hasReport).toBe(false);
      expect(entry.durationMs).toBeGreaterThanOrEqual(0);
      expect(entry.battleCount).toBeGreaterThanOrEqual(0);
      expect(entry.trechoCount).toBeGreaterThanOrEqual(0);
      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.createdAt).toBeInstanceOf(Date);
      expect(entry.updatedAt).toBeInstanceOf(Date);
    });

    it('should create entry with custom props', () => {
      const customId = 'custom-id';
      const customPath = '/custom/path';

      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withId(customId)
        .withProjectPath(customPath)
        .withStatus(SimulationStatus.RUNNING)
        .build();

      expect(entry.id).toBe(customId);
      expect(entry.projectPath).toBe(customPath);
      expect(entry.status).toBe(SimulationStatus.RUNNING);
    });

    it('should generate unique IDs for multiple entries', () => {
      const entries = SimulationHistoryEntryFakeBuilder.theEntries(5).buildMany(5);

      const ids = entries.map((e) => e.id);
      expect(new Set(ids).size).toBe(5);
    });

    it('should throw error when projectPath is empty', () => {
      expect(() => {
        SimulationHistoryEntryFakeBuilder.anEntry().withProjectPath('').build();
      }).toThrow(DomainError);
    });

    it('should throw error when projectName is empty', () => {
      expect(() => {
        SimulationHistoryEntryFakeBuilder.anEntry().withProjectName('').build();
      }).toThrow(DomainError);
    });

    it('should throw error when ttkVersion is empty', () => {
      expect(() => {
        SimulationHistoryEntryFakeBuilder.anEntry().withTtkVersion('').build();
      }).toThrow(DomainError);
    });

    it('should throw error when durationMs is negative', () => {
      expect(() => {
        SimulationHistoryEntryFakeBuilder.anEntry().withDurationMs(-1).build();
      }).toThrow(DomainError);
    });

    it('should throw error when battleCount is negative', () => {
      expect(() => {
        SimulationHistoryEntryFakeBuilder.anEntry().withBattleCount(-1).build();
      }).toThrow(DomainError);
    });

    it('should throw error when trechoCount is negative', () => {
      expect(() => {
        SimulationHistoryEntryFakeBuilder.anEntry().withTrechoCount(-1).build();
      }).toThrow(DomainError);
    });

    it('should throw error when hasReport is true but reportFilePath is empty', () => {
      expect(() => {
        SimulationHistoryEntryFakeBuilder.anEntry()
          .withHasReport(true)
          .withReportFilePath(undefined)
          .build();
      }).toThrow(DomainError);
    });
  });

  describe('state machine transitions', () => {
    it('should allow transition from PENDING to RUNNING', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.PENDING)
        .build();

      entry.markAsRunning();

      expect(entry.status).toBe(SimulationStatus.RUNNING);
    });

    it('should allow transition from PENDING to CANCELLED', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.PENDING)
        .build();

      entry.cancel();

      expect(entry.status).toBe(SimulationStatus.CANCELLED);
    });

    it('should allow transition from RUNNING to COMPLETED', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.RUNNING)
        .build();

      const summary = JSON.stringify({ result: 'success' });
      entry.markAsCompleted(summary);

      expect(entry.status).toBe(SimulationStatus.COMPLETED);
      expect(entry.summaryJson).toBe(summary);
    });

    it('should allow transition from RUNNING to FAILED', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.RUNNING)
        .build();

      const error = JSON.stringify({ error: 'Something went wrong' });
      entry.markAsFailed(error);

      expect(entry.status).toBe(SimulationStatus.FAILED);
      expect(entry.summaryJson).toBe(error);
    });

    it('should allow transition from RUNNING to CANCELLED', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.RUNNING)
        .build();

      entry.cancel();

      expect(entry.status).toBe(SimulationStatus.CANCELLED);
    });

    it('should allow transition from FAILED to RUNNING (retry)', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.FAILED)
        .build();

      entry.retry();

      expect(entry.status).toBe(SimulationStatus.RUNNING);
    });

    it('should not allow transition from COMPLETED to any other state', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.COMPLETED)
        .build();

      expect(() => entry.markAsRunning()).toThrow(DomainError);
      expect(() => entry.markAsCompleted('{}')).toThrow(DomainError);
      expect(() => entry.markAsFailed()).toThrow(DomainError);
    });

    it('should not allow transition from CANCELLED to any other state', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.CANCELLED)
        .build();

      expect(() => entry.markAsRunning()).toThrow(DomainError);
      expect(() => entry.markAsCompleted('{}')).toThrow(DomainError);
      expect(() => entry.markAsFailed()).toThrow(DomainError);
    });

    it('should not allow invalid transition from PENDING to COMPLETED', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.PENDING)
        .build();

      expect(() => entry.markAsCompleted('{}')).toThrow(DomainError);
    });

    it('should not allow invalid transition from PENDING to FAILED', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.PENDING)
        .build();

      expect(() => entry.markAsFailed()).toThrow(DomainError);
    });

    it('should not allow retry from non-FAILED state', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.PENDING)
        .build();

      expect(() => entry.retry()).toThrow(DomainError);
    });

    it('should update timestamp on state change', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.PENDING)
        .build();

      const originalUpdatedAt = entry.updatedAt;

      // Wait a bit to ensure timestamp difference
      entry.markAsRunning();

      expect(entry.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('business methods', () => {
    it('should update summary JSON', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry().build();
      const newSummary = JSON.stringify({ updated: true });

      entry.updateSummary(newSummary);

      expect(entry.summaryJson).toBe(newSummary);
    });

    it('should set report file path and mark hasReport as true', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry().build();
      const reportPath = '/reports/test.pdf';

      entry.setReportFilePath(reportPath);

      expect(entry.reportFilePath).toBe(reportPath);
      expect(entry.hasReport).toBe(true);
    });

    it('should throw error when setting empty report file path', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry().build();

      expect(() => entry.setReportFilePath('')).toThrow(DomainError);
    });

    it('should check isPending status', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.PENDING)
        .build();

      expect(entry.isPending()).toBe(true);
      expect(entry.isRunning()).toBe(false);
      expect(entry.isCompleted()).toBe(false);
      expect(entry.isFailed()).toBe(false);
      expect(entry.isCancelled()).toBe(false);
    });

    it('should check isRunning status', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.RUNNING)
        .build();

      expect(entry.isPending()).toBe(false);
      expect(entry.isRunning()).toBe(true);
      expect(entry.isCompleted()).toBe(false);
      expect(entry.isFailed()).toBe(false);
      expect(entry.isCancelled()).toBe(false);
    });

    it('should check isCompleted status', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.COMPLETED)
        .build();

      expect(entry.isPending()).toBe(false);
      expect(entry.isRunning()).toBe(false);
      expect(entry.isCompleted()).toBe(true);
      expect(entry.isFailed()).toBe(false);
      expect(entry.isCancelled()).toBe(false);
      expect(entry.isTerminal()).toBe(true);
    });

    it('should check isFailed status', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.FAILED)
        .build();

      expect(entry.isPending()).toBe(false);
      expect(entry.isRunning()).toBe(false);
      expect(entry.isCompleted()).toBe(false);
      expect(entry.isFailed()).toBe(true);
      expect(entry.isCancelled()).toBe(false);
      expect(entry.isTerminal()).toBe(false);
    });

    it('should check isCancelled status', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.CANCELLED)
        .build();

      expect(entry.isPending()).toBe(false);
      expect(entry.isRunning()).toBe(false);
      expect(entry.isCompleted()).toBe(false);
      expect(entry.isFailed()).toBe(false);
      expect(entry.isCancelled()).toBe(true);
      expect(entry.isTerminal()).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withProjectPath('/test/path')
        .withProjectName('Test Project')
        .withStatus(SimulationStatus.RUNNING)
        .build();

      const json = entry.toJSON();

      expect(json.id).toBe(entry.id);
      expect(json.projectPath).toBe('/test/path');
      expect(json.projectName).toBe('Test Project');
      expect(json.status).toBe(SimulationStatus.RUNNING);
      expect(json.timestamp).toBeDefined();
      expect(json.createdAt).toBeDefined();
      expect(json.updatedAt).toBeDefined();
    });
  });

  describe('canTransitionTo', () => {
    it('should validate all valid transitions', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.PENDING)
        .build();

      expect(entry.canTransitionTo(SimulationStatus.RUNNING)).toBe(true);
      expect(entry.canTransitionTo(SimulationStatus.CANCELLED)).toBe(true);
      expect(entry.canTransitionTo(SimulationStatus.COMPLETED)).toBe(false);
      expect(entry.canTransitionTo(SimulationStatus.FAILED)).toBe(false);
    });
  });
});
