import type { z } from "zod";
import type { FieldConfig, FormUIConfig } from "./form-config";
import type { ActionState } from "./safe-action";

// --- Table Column Configuration ---
export interface ColumnConfig<TFieldName extends string = string> {
  field: TFieldName;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

// --- Operation Configuration ---
export interface OperationConfig<TFieldName extends string = string> {
  label: string;
  description?: string;
  icon?: string;
  fields: TFieldName[];
  submit: { label: string; pending: string };
  columns?: ColumnConfig<TFieldName>[];
}

// --- The Domain Type (Single Source of Truth) ---
export interface Domain<
  TFieldName extends string,
  TOperation extends string,
  TSchema extends z.ZodType,
  TData = unknown,
> {
  /** Domain identifier (e.g., "auth", "org", "project") */
  name: string;

  /** Server action bound to this domain */
  action: (
    prevState: ActionState<TData>,
    formData: FormData
  ) => Promise<ActionState<TData>>;

  /** Zod schema for validation */
  schema: TSchema;

  /** Field definitions for UI rendering */
  fields: Record<TFieldName, FieldConfig>;

  /** Operation definitions (CRUD, etc.) */
  operations: Record<TOperation, OperationConfig<TFieldName>>;

  /** Get FormUIConfig for a specific operation */
  getFormConfig: (operation: TOperation) => FormUIConfig<TFieldName>;

  /** Get initial ActionState from schema defaults */
  getInitialState: () => ActionState<TData>;
}

// --- Domain Creation Input ---
interface CreateDomainInput<
  TFieldName extends string,
  TOperation extends string,
  TSchema extends z.ZodType,
  TData = unknown,
> {
  name: string;
  action: Domain<TFieldName, TOperation, TSchema, TData>["action"];
  schema: TSchema;
  fields: Record<TFieldName, FieldConfig>;
  operations: Record<TOperation, OperationConfig<TFieldName>>;
}

// --- Domain Factory Function ---
export function createDomain<
  TFieldName extends string,
  TOperation extends string,
  TSchema extends z.ZodType,
  TData = unknown,
>(
  config: CreateDomainInput<TFieldName, TOperation, TSchema, TData>
): Domain<TFieldName, TOperation, TSchema, TData> {
  return {
    ...config,

    getFormConfig(operation: TOperation): FormUIConfig<TFieldName> {
      const op = config.operations[operation];
      return {
        label: op.label,
        description: op.description,
        fields: op.fields,
        submit: op.submit,
      };
    },

    getInitialState(): ActionState<TData> {
      const result = config.schema.safeParse({});
      return {
        status: "idle",
        message: "",
        errors: {},
        defaultValues: result.success
          ? (result.data as Record<string, unknown>)
          : {},
      };
    },
  };
}

// --- Type Helpers ---

/** Extract field names from a Domain */
export type DomainFieldName<D> =
  D extends Domain<infer F, string, z.ZodType, unknown> ? F : never;

/** Extract operation names from a Domain */
export type DomainOperation<D> =
  D extends Domain<string, infer O, z.ZodType, unknown> ? O : never;

/** Extract data type from a Domain */
export type DomainData<D> =
  D extends Domain<string, string, z.ZodType, infer T> ? T : never;
