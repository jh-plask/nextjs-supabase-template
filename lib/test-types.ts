// ============================================
// Shared Test Types
// ============================================

/**
 * Database effect for E2E test verification.
 * Used to assert that operations correctly modify the database.
 */
export interface DbEffect<TTable extends string = string> {
  /** Table name to check */
  table: TTable;
  /** Expected operation type */
  op: "insert" | "update" | "delete";
  /** Fields to match in the query */
  match?: Record<string, unknown>;
  /** Expected row count (defaults to 1 for insert/update, 0 for delete) */
  expectCount?: number;
}

/**
 * Test plan for a single operation.
 * Generic over field names for type-safe test data.
 */
export interface OperationTestPlan<TFieldName extends string = string> {
  /** Form data that should succeed validation and complete the operation */
  valid: Partial<Record<TFieldName, string>>;
  /** Form data that should fail validation (optional) */
  invalid?: Partial<Record<TFieldName, string>>;
  /** Expected success message pattern */
  success?: RegExp;
  /** Expected error message pattern (for invalid submissions) */
  error?: RegExp;
  /** Expected redirect URL after success */
  redirectTo?: string;
  /** Database effects to verify after operation */
  db: DbEffect[];
  /** Setup function to run before test (returns additional form data) */
  setup?: () => Promise<Partial<Record<TFieldName, string>>>;
  /** Cleanup function to run after test */
  cleanup?: () => Promise<void>;
}
