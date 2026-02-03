import { SimulationStatus } from '../../domain/value-objects';

/**
 * Input DTO for updating simulation status
 */
export interface UpdateSimulationStatusInput {
  id: string;
  status: SimulationStatus;
  summaryJson?: string;
}
