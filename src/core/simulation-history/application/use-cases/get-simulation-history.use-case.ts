import { ISimulationHistoryRepository } from '../../domain';
import {
  GetSimulationHistoryInput,
  SimulationHistoryEntryOutput,
  toSimulationHistoryEntryOutput,
} from '../dto';
import { NotFoundError } from '@core/shared/domain/errors';

/**
 * GetSimulationHistoryUseCase
 *
 * Application Layer use case for getting a single simulation history entry by ID.
 *
 * RESPONSIBILITIES:
 * - Retrieve entity from repository
 * - Throw NotFoundError if not found
 * - Transform to output DTO
 *
 * This use case is FRAMEWORK-AGNOSTIC.
 */
export class GetSimulationHistoryUseCase {
  constructor(private readonly simulationHistoryRepository: ISimulationHistoryRepository) {}

  /**
   * Execute the use case
   *
   * @param input - ID of the entry to retrieve
   * @returns Simulation history entry
   * @throws NotFoundError if entry not found
   */
  async execute(input: GetSimulationHistoryInput): Promise<SimulationHistoryEntryOutput> {
    const entry = await this.simulationHistoryRepository.findById(input.id);

    if (!entry) {
      throw new NotFoundError(input.id, 'SimulationHistoryEntry');
    }

    return toSimulationHistoryEntryOutput(entry);
  }
}
