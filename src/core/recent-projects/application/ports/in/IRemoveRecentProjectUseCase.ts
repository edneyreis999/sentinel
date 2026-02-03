import { RemoveRecentProjectInput } from '../../dto/input/remove-recent-project.input';

/**
 * Input Port for Remove Recent Project Use Case
 *
 * Defines the contract for removing a recent project.
 * Implementations must handle business logic.
 */
export interface IRemoveRecentProjectUseCase {
  execute(input: RemoveRecentProjectInput): Promise<void>;
}
