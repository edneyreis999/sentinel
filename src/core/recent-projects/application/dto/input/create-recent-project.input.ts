/**
 * Input DTO for Create Recent Project Use Case
 */
export interface CreateRecentProjectInput {
  path: string;
  name: string;
  gameVersion?: string;
  screenshotPath?: string;
  trechoCount?: number;
}
