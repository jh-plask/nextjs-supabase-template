import { z } from "zod";
import type { FieldConfig, FormUIConfig } from "@/lib/form-config";
import type { OperationTestPlan } from "@/lib/test-types";

// ============================================
// Type Definitions
// ============================================

/**
 * Field definition combining Zod schema with UI configuration.
 * Single source of truth for both validation and display.
 */
export interface FieldDefinition<T extends z.ZodTypeAny = z.ZodTypeAny> {
  /** Zod schema for validation */
  schema: T;
  /** UI configuration for form rendering */
  ui: FieldConfig;
}

/**
 * Collection of field definitions for a domain.
 */
export type FieldDefinitions = Record<string, FieldDefinition>;

/**
 * Operation definition combining handler config, UI, and test data.
 */
export interface OperationDefinition<TFieldName extends string> {
  /** Fields to display in the form for this operation */
  fields: TFieldName[];
  /** Submit button configuration */
  submit: { label: string; pending: string };
  /** Operation description (used in dialog headers, etc.) */
  description?: string;
  /** Test plan for E2E testing (optional) */
  test?: OperationTestPlan<TFieldName>;
}

/**
 * Collection of operation definitions for a domain.
 */
export type OperationDefinitions<TFields extends FieldDefinitions> = Record<
  string,
  OperationDefinition<Extract<keyof TFields, string>>
>;

/**
 * Result of buildActionConfig - all derived configurations.
 */
export interface ActionConfig<
  TFieldName extends string,
  TOperation extends string,
> {
  /** Combined Zod schema with operation discriminator */
  schema: z.ZodObject<Record<string, z.ZodTypeAny>>;
  /** Field UI configs for ConfigDrivenForm */
  fieldConfigs: Record<TFieldName, FieldConfig>;
  /** Form UI configs per operation */
  formConfigs: Record<TOperation, FormUIConfig<TFieldName>>;
  /** Test plans per operation (only operations with test defined) */
  testPlans: Partial<Record<TOperation, OperationTestPlan<TFieldName>>>;
  /** List of operation names */
  operations: TOperation[];
  /** List of field names */
  fieldNames: TFieldName[];
}

// ============================================
// Builder Function
// ============================================

/**
 * Build a complete action configuration from field and operation definitions.
 *
 * This function takes a unified config and derives all the pieces needed
 * for forms, dialogs, and tests - ensuring type safety throughout.
 *
 * @example
 * ```ts
 * const orgFields = {
 *   name: {
 *     schema: z.string().min(2),
 *     ui: { label: "Name", type: "text" as const, placeholder: "Org name" },
 *   },
 * };
 *
 * const orgOperations = {
 *   create: {
 *     fields: ["name"],
 *     submit: { label: "Create", pending: "Creating..." },
 *     test: { valid: { name: "Test" }, db: [] },
 *   },
 * };
 *
 * const org = buildActionConfig(orgFields, orgOperations);
 * // org.schema, org.fieldConfigs, org.formConfigs, org.testPlans
 * ```
 */
export function buildActionConfig<
  TFields extends FieldDefinitions,
  TOps extends OperationDefinitions<TFields>,
>(
  fields: TFields,
  operations: TOps
): ActionConfig<Extract<keyof TFields, string>, Extract<keyof TOps, string>> {
  type FieldName = Extract<keyof TFields, string>;
  type Operation = Extract<keyof TOps, string>;

  const fieldNames = Object.keys(fields) as FieldName[];
  const operationNames = Object.keys(operations) as Operation[];

  // Build Zod schema from field definitions
  const fieldSchemas = Object.fromEntries(
    fieldNames.map((name) => [name, fields[name].schema])
  ) as Record<FieldName, z.ZodTypeAny>;

  // Create the combined schema with operation discriminator
  const schema = z.object({
    operation: z.enum(operationNames as [Operation, ...Operation[]]),
    ...fieldSchemas,
  });

  // Extract field configs for UI
  const fieldConfigs = Object.fromEntries(
    fieldNames.map((name) => [name, fields[name].ui])
  ) as Record<FieldName, FieldConfig>;

  // Build form UI configs per operation
  const formConfigs = Object.fromEntries(
    operationNames.map((op) => {
      const def = operations[op];
      return [
        op,
        {
          label: def.description ?? op,
          description: def.description,
          fields: def.fields,
          submit: def.submit,
        } satisfies FormUIConfig<FieldName>,
      ];
    })
  ) as Record<Operation, FormUIConfig<FieldName>>;

  // Extract test plans (only for operations that have them)
  const testPlans = Object.fromEntries(
    operationNames
      .filter((op) => operations[op].test !== undefined)
      .map((op) => [op, operations[op].test])
  ) as Partial<Record<Operation, OperationTestPlan<FieldName>>>;

  return {
    schema,
    fieldConfigs,
    formConfigs,
    testPlans,
    operations: operationNames,
    fieldNames,
  };
}

// ============================================
// Helper Types for Domain Config
// ============================================

/**
 * Handler function type for operations.
 */
export type OperationHandler<TInput, TResult = unknown> = (
  data: TInput
) => Promise<TResult>;

/**
 * Domain configuration combining handlers with UI/test config.
 */
export interface DomainOperationConfig<TInput> {
  handler: OperationHandler<TInput>;
  label: string;
  description: string;
  icon?: string;
  confirmMessage?: string;
}

/**
 * Complete domain configuration type.
 */
export type DomainConfig<TInput, TOperation extends string> = Record<
  TOperation,
  DomainOperationConfig<TInput>
>;
