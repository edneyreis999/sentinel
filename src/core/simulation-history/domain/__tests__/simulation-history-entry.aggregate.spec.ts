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

    describe('validation errors', () => {
      it.each([
        { field: 'projectPath', value: '', withMethod: 'withProjectPath' },
        { field: 'projectName', value: '', withMethod: 'withProjectName' },
        { field: 'ttkVersion', value: '', withMethod: 'withTtkVersion' },
      ])('should throw error when $field is empty', ({ withMethod, value }) => {
        expect(() => {
          const builder = SimulationHistoryEntryFakeBuilder.anEntry();
          (builder as any)[withMethod](value);
          builder.build();
        }).toThrow(DomainError);
      });

      it.each([
        { field: 'durationMs', value: -1, withMethod: 'withDurationMs' },
        { field: 'battleCount', value: -1, withMethod: 'withBattleCount' },
        { field: 'trechoCount', value: -1, withMethod: 'withTrechoCount' },
      ])('should throw error when $field is negative', ({ withMethod, value }) => {
        expect(() => {
          const builder = SimulationHistoryEntryFakeBuilder.anEntry();
          (builder as any)[withMethod](value);
          builder.build();
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
  });

  describe('state machine transitions', () => {
    describe('valid transitions', () => {
      it.each([
        {
          from: SimulationStatus.PENDING,
          to: SimulationStatus.RUNNING,
          method: 'markAsRunning',
          description: 'PENDING to RUNNING',
        },
        {
          from: SimulationStatus.PENDING,
          to: SimulationStatus.CANCELLED,
          method: 'cancel',
          description: 'PENDING to CANCELLED',
        },
        {
          from: SimulationStatus.RUNNING,
          to: SimulationStatus.CANCELLED,
          method: 'cancel',
          description: 'RUNNING to CANCELLED',
        },
      ])('should allow transition from $description', ({ from, to, method }) => {
        const entry = SimulationHistoryEntryFakeBuilder.anEntry().withStatus(from).build();

        (entry as any)[method]();

        expect(entry.status).toBe(to);
      });

      it('should allow transition from RUNNING to COMPLETED with summary', () => {
        const entry = SimulationHistoryEntryFakeBuilder.anEntry()
          .withStatus(SimulationStatus.RUNNING)
          .build();

        const summary = JSON.stringify({ result: 'success' });
        entry.markAsCompleted(summary);

        expect(entry.status).toBe(SimulationStatus.COMPLETED);
        expect(entry.summaryJson).toBe(summary);
      });

      it('should allow transition from RUNNING to FAILED with error', () => {
        const entry = SimulationHistoryEntryFakeBuilder.anEntry()
          .withStatus(SimulationStatus.RUNNING)
          .build();

        const error = JSON.stringify({ error: 'Something went wrong' });
        entry.markAsFailed(error);

        expect(entry.status).toBe(SimulationStatus.FAILED);
        expect(entry.summaryJson).toBe(error);
      });

      it('should allow transition from FAILED to RUNNING (retry)', () => {
        const entry = SimulationHistoryEntryFakeBuilder.anEntry()
          .withStatus(SimulationStatus.FAILED)
          .build();

        entry.retry();

        expect(entry.status).toBe(SimulationStatus.RUNNING);
      });
    });

    describe('invalid transitions from terminal states', () => {
      it.each([
        { status: SimulationStatus.COMPLETED, method: 'markAsRunning' },
        { status: SimulationStatus.COMPLETED, method: 'markAsCompleted' },
        { status: SimulationStatus.COMPLETED, method: 'markAsFailed' },
        { status: SimulationStatus.CANCELLED, method: 'markAsRunning' },
        { status: SimulationStatus.CANCELLED, method: 'markAsCompleted' },
        { status: SimulationStatus.CANCELLED, method: 'markAsFailed' },
      ])('should not allow $method from $status', ({ status, method }) => {
        const entry = SimulationHistoryEntryFakeBuilder.anEntry().withStatus(status).build();

        expect(() => {
          if (method === 'markAsCompleted') {
            (entry as any)[method]('{}');
          } else {
            (entry as any)[method]();
          }
        }).toThrow(DomainError);
      });
    });

    describe('invalid transitions from PENDING', () => {
      it.each([
        { method: 'markAsCompleted', args: ['{}'] },
        { method: 'markAsFailed', args: [] },
        { method: 'retry', args: [] },
      ])('should not allow $method from PENDING', ({ method, args }) => {
        const entry = SimulationHistoryEntryFakeBuilder.anEntry()
          .withStatus(SimulationStatus.PENDING)
          .build();

        expect(() => (entry as any)[method](...args)).toThrow(DomainError);
      });
    });

    it('should update timestamp on state change', () => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry()
        .withStatus(SimulationStatus.PENDING)
        .build();

      const originalUpdatedAt = entry.updatedAt;

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

    describe('status check methods', () => {
      it.each([
        {
          status: SimulationStatus.PENDING,
          isPending: true,
          isRunning: false,
          isCompleted: false,
          isFailed: false,
          isCancelled: false,
          isTerminal: false,
        },
        {
          status: SimulationStatus.RUNNING,
          isPending: false,
          isRunning: true,
          isCompleted: false,
          isFailed: false,
          isCancelled: false,
          isTerminal: false,
        },
        {
          status: SimulationStatus.COMPLETED,
          isPending: false,
          isRunning: false,
          isCompleted: true,
          isFailed: false,
          isCancelled: false,
          isTerminal: true,
        },
        {
          status: SimulationStatus.FAILED,
          isPending: false,
          isRunning: false,
          isCompleted: false,
          isFailed: true,
          isCancelled: false,
          isTerminal: false,
        },
        {
          status: SimulationStatus.CANCELLED,
          isPending: false,
          isRunning: false,
          isCompleted: false,
          isFailed: false,
          isCancelled: true,
          isTerminal: true,
        },
      ])(
        'should return correct status checks for $status',
        ({ status, isPending, isRunning, isCompleted, isFailed, isCancelled, isTerminal }) => {
          const entry = SimulationHistoryEntryFakeBuilder.anEntry().withStatus(status).build();

          expect(entry.isPending()).toBe(isPending);
          expect(entry.isRunning()).toBe(isRunning);
          expect(entry.isCompleted()).toBe(isCompleted);
          expect(entry.isFailed()).toBe(isFailed);
          expect(entry.isCancelled()).toBe(isCancelled);
          expect(entry.isTerminal()).toBe(isTerminal);
        },
      );
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
    it.each([
      { from: SimulationStatus.PENDING, to: SimulationStatus.RUNNING, expected: true },
      { from: SimulationStatus.PENDING, to: SimulationStatus.CANCELLED, expected: true },
      { from: SimulationStatus.PENDING, to: SimulationStatus.COMPLETED, expected: false },
      { from: SimulationStatus.PENDING, to: SimulationStatus.FAILED, expected: false },
      { from: SimulationStatus.RUNNING, to: SimulationStatus.COMPLETED, expected: true },
      { from: SimulationStatus.RUNNING, to: SimulationStatus.FAILED, expected: true },
      { from: SimulationStatus.RUNNING, to: SimulationStatus.CANCELLED, expected: true },
      { from: SimulationStatus.COMPLETED, to: SimulationStatus.RUNNING, expected: false },
      { from: SimulationStatus.CANCELLED, to: SimulationStatus.RUNNING, expected: false },
      { from: SimulationStatus.FAILED, to: SimulationStatus.RUNNING, expected: true },
    ])('should return $expected for transition from $from to $to', ({ from, to, expected }) => {
      const entry = SimulationHistoryEntryFakeBuilder.anEntry().withStatus(from).build();

      expect(entry.canTransitionTo(to)).toBe(expected);
    });
  });
});
