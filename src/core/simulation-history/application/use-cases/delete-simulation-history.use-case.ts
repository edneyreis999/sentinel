import { ISimulationHistoryRepository } from '../../domain';
import { DeleteSimulationHistoryInput } from '../dto';
import { NotFoundError } from '@core/shared/domain/errors';

/**
 * DeleteSimulationHistoryUseCase
 *
 * Application Layer use case for deleting a simulation history entry.
 *
 * RESPONSIBILITIES:
 * - Check if entry exists
 * - Delete from repository
 *
 * This use case is FRAMEWORK-AGNOSTIC.
 */
export class DeleteSimulationHistoryUseCase {
  constructor(private readonly simulationHistoryRepository: ISimulationHistoryRepository) {}

  /**
   * Execute the use case
   *
   * @param input - ID of the entry to delete
   * @returns void
   * @throws NotFoundError if entry not found
   */
  async execute(input: DeleteSimulationHistoryInput): Promise<void> {
    const exists = await this.simulationHistoryRepository.exists(input.id);

    if (!exists) {
      throw new NotFoundError(input.id, 'SimulationHistoryEntry');
    }

    await this.simulationHistoryRepository.delete(input.id);
  }
}
