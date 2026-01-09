"use client";

import { useCallback } from "react";
import type { z } from "zod";
import {
  ConfigDrivenForm,
  FieldSeparator,
} from "@/components/ui/config-driven-form";
import type { Domain } from "@/lib/domain";
import type { ActionState } from "@/lib/safe-action";

// --- Props ---
export interface DomainFormProps<
  TFieldName extends string,
  TOperation extends string,
  TSchema extends z.ZodType,
  TData,
> {
  /** The domain containing action, schema, fields, and operations */
  domain: Domain<TFieldName, TOperation, TSchema, TData>;
  /** The operation to perform (determines fields and submit button) */
  operation: TOperation;
  /** Additional hidden fields (e.g., entity IDs) */
  hiddenFields?: Record<string, string>;
  /** Initial values for form fields (for edit mode) */
  initialValues?: Partial<Record<TFieldName, string>>;
  /** Callback when form submission succeeds */
  onSuccess?: (data: TData) => void;
  /** Callback when form submission fails */
  onError?: (message: string) => void;
  /** Additional content to render after the form (e.g., OAuth buttons) */
  footer?: React.ReactNode;
  /** Custom class name for the form container */
  className?: string;
  /** Test ID prefix for form fields */
  testIdPrefix?: string;
  /** Submit button variant */
  submitVariant?: "default" | "destructive";
}

// --- Component ---
export function DomainForm<
  TFieldName extends string,
  TOperation extends string,
  TSchema extends z.ZodType,
  TData,
>({
  domain,
  operation,
  hiddenFields,
  initialValues,
  onSuccess,
  onError,
  footer,
  className,
  testIdPrefix,
  submitVariant,
}: DomainFormProps<TFieldName, TOperation, TSchema, TData>) {
  const formConfig = domain.getFormConfig(operation);
  const initialState = domain.getInitialState();

  // Merge operation into hidden fields
  const allHiddenFields = {
    operation,
    ...hiddenFields,
  };

  // Handle state changes
  const handleStateChange = useCallback(
    (state: ActionState<TData>) => {
      if (state.status === "success" && state.data) {
        onSuccess?.(state.data);
      } else if (state.status === "error") {
        onError?.(state.message);
      }
    },
    [onSuccess, onError]
  );

  // Generate test ID function if prefix provided
  const getFieldTestId = testIdPrefix
    ? (fieldName: TFieldName) => `${testIdPrefix}-field-${fieldName}`
    : undefined;

  const submitTestId = testIdPrefix ? `${testIdPrefix}-submit` : undefined;

  return (
    <ConfigDrivenForm
      action={domain.action}
      className={className}
      fieldConfigs={domain.fields}
      footer={footer}
      getFieldTestId={getFieldTestId}
      hiddenFields={allHiddenFields}
      initialState={initialState}
      initialValues={initialValues}
      onStateChange={handleStateChange}
      submitTestId={submitTestId}
      submitVariant={submitVariant}
      uiConfig={formConfig}
    />
  );
}

// Re-export FieldSeparator for footer use
export { FieldSeparator };
