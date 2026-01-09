"use client";

import type { z } from "zod";
import { ConfigDrivenDialog } from "@/components/ui/config-driven-dialog";
import type { Domain } from "@/lib/domain";

// --- Props ---
export interface DomainDialogProps<
  TFieldName extends string,
  TOperation extends string,
  TSchema extends z.ZodType,
  TData,
> {
  /** The domain containing action, schema, fields, and operations */
  domain: Domain<TFieldName, TOperation, TSchema, TData>;
  /** The operation to perform (determines fields, title, submit button) */
  operation: TOperation;
  /** Dialog open state */
  open: boolean;
  /** Dialog open state change handler */
  onOpenChange: (open: boolean) => void;
  /** Additional hidden fields (e.g., entity IDs) */
  hiddenFields?: Record<string, string>;
  /** Initial values for form fields (for edit mode) */
  initialValues?: Partial<Record<TFieldName, string>>;
  /** Override dialog title (defaults to operation label) */
  title?: string;
  /** Override dialog description */
  description?: React.ReactNode;
  /** Submit button variant */
  submitVariant?: "default" | "destructive";
  /** Test ID prefix for form fields */
  testIdPrefix?: string;
  /** Callback after successful submission */
  onSuccess?: () => void | Promise<void>;
  /** Whether to refresh the router on success */
  refreshOnSuccess?: boolean;
}

// --- Component ---
export function DomainDialog<
  TFieldName extends string,
  TOperation extends string,
  TSchema extends z.ZodType,
  TData,
>({
  domain,
  operation,
  open,
  onOpenChange,
  hiddenFields,
  initialValues,
  title,
  description,
  submitVariant,
  testIdPrefix,
  onSuccess,
  refreshOnSuccess = true,
}: DomainDialogProps<TFieldName, TOperation, TSchema, TData>) {
  const opConfig = domain.operations[operation];
  const formConfig = domain.getFormConfig(operation);

  // Merge operation into hidden fields
  const allHiddenFields = {
    operation,
    ...hiddenFields,
  };

  return (
    <ConfigDrivenDialog
      action={domain.action}
      description={description ?? opConfig.description}
      fieldConfigs={domain.fields}
      hiddenFields={allHiddenFields}
      initialValues={initialValues}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      open={open}
      refreshOnSuccess={refreshOnSuccess}
      schema={domain.schema}
      submitVariant={submitVariant}
      testIdPrefix={testIdPrefix ?? domain.name}
      title={title ?? opConfig.label}
      uiConfig={formConfig}
    />
  );
}
