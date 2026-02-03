import { SimulationHistoryEntry, ISimulationHistoryRepository } from '../../domain';
import {
  CreateSimulationHistoryInput,
  SimulationHistoryEntryOutput,
  toSimulationHistoryEntryOutput,
} from '../dto';

/**
 * CreateSimulationHistoryUseCase
 *
 * Application Layer use case for creating simulation history entries.
 * Coordinates between Domain Layer and Infrastructure Layer.
 *
 * RESPONSIBILITIES:
 * - Validate input (via DTO)
 * - Create domain entity
 * - Persist via repository
 * - Return output (via DTO)
 *
 * This use case is FRAMEWORK-AGNOSTIC. It has no dependencies on
 * NestJS, Prisma, Express, or any external framework.
 */
export class CreateSimulationHistoryUseCase {
  constructor(private readonly simulationHistoryRepository: ISimulationHistoryRepository) {}

  /**
   * Execute the use case
   *
   * @param input - Validated input data
   * @returns Created simulation history entry
   */
  async execute(input: CreateSimulationHistoryInput): Promise<SimulationHistoryEntryOutput> {
    // Create domain entity
    const entry = SimulationHistoryEntry.create({
      ...input,
    });

    // Persist to repository
    await this.simulationHistoryRepository.insert(entry);

    // Return output DTO
    return toSimulationHistoryEntryOutput(entry);
  }
}
