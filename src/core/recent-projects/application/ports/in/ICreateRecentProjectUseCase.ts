import { CreateRecentProjectInput } from '../../dto/input/create-recent-project.input';
import { RecentProjectOutputDTO } from '../../dto/output/recent-project.output.dto';

/**
 * Input Port for Create Recent Project Use Case
 *
 * Defines the contract for creating a recent project.
 * Implementations must handle business logic and return OutputDTO.
 */
export interface ICreateRecentProjectUseCase {
  execute(input: CreateRecentProjectInput): Promise<RecentProjectOutputDTO>;
}
