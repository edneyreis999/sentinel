import { SimulationHistoryFilters, PaginationParams } from '../../domain/ports';
import { SimulationHistoryEntryOutput } from './create-simulation-history.input.dto';

/**
 * Input DTO for listing simulation history entries
 */
export interface ListSimulationHistoryInput {
  filters?: SimulationHistoryFilters;
  pagination?: Partial<PaginationParams>;
}

/**
 * Output DTO for simulation history search result
 */
export interface SimulationHistorySearchOutput {
  items: SimulationHistoryEntryOutput[];
  filters: SimulationHistoryFilters;
  pagination: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
  };
}
