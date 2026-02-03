import { ISimulationHistoryRepository, SimulationStatus } from '../../domain';
import {
  UpdateSimulationStatusInput,
  SimulationHistoryEntryOutput,
  toSimulationHistoryEntryOutput,
} from '../dto';
import { NotFoundError } from '@core/shared/domain/errors';

/**
 * UpdateSimulationStatusUseCase
 *
 * Application Layer use case for updating simulation status.
 * Uses state machine pattern for valid transitions.
 *
 * RESPONSIBILITIES:
 * - Retrieve entity from repository
 * - Apply status transition using domain methods
 * - Persist updated entity
 * - Return transformed output
 *
 * This use case is FRAMEWORK-AGNOSTIC.
 */
export class UpdateSimulationStatusUseCase {
  constructor(private readonly simulationHistoryRepository: ISimulationHistoryRepository) {}

  /**
   * Execute the use case
   *
   * @param input - ID and new status with optional summary
   * @returns Updated simulation history entry
   * @throws NotFoundError if entry not found
   * @throws DomainError if status transition is invalid
   */
  async execute(input: UpdateSimulationStatusInput): Promise<SimulationHistoryEntryOutput> {
    const entry = await this.simulationHistoryRepository.findById(input.id);

    if (!entry) {
      throw new NotFoundError(input.id, 'SimulationHistoryEntry');
    }

    // Apply status transition using domain's state machine
    switch (input.status) {
      case SimulationStatus.RUNNING:
        entry.markAsRunning();
        break;
      case SimulationStatus.COMPLETED:
        entry.markAsCompleted(input.summaryJson ?? '{}');
        break;
      case SimulationStatus.FAILED:
        entry.markAsFailed(input.summaryJson);
        break;
      case SimulationStatus.CANCELLED:
        entry.cancel();
        break;
      default:
        throw new Error(`Unknown status: ${input.status}`);
    }

    // Persist updated entity
    await this.simulationHistoryRepository.update(entry);

    return toSimulationHistoryEntryOutput(entry);
  }
}
