/**
 * Input DTO for List Recent Projects Use Case
 */
export interface ListRecentProjectsInput {
  limit?: number;
  offset?: number;
  nameFilter?: string;
  gameVersion?: string;
}
