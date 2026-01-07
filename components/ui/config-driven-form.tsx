"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { fieldComponents } from "@/lib/form/field-components";
import type { FieldConfig, FormUIConfig } from "@/lib/form-config";
import type { ActionState } from "@/lib/safe-action";

// Re-export shared types for convenience
export type { FieldConfig, FormUIConfig } from "@/lib/form-config";

// --- Component Props ---
export interface ConfigDrivenFormProps<TFieldName extends string, TData> {
  /** Server action to handle form submission */
  action: (
    prevState: ActionState<TData>,
    formData: FormData
  ) => Promise<ActionState<TData>>;
  /** Initial state for useActionState */
  initialState: ActionState<TData>;
  /** UI configuration (label, description, fields, submit) */
  uiConfig: FormUIConfig<TFieldName>;
  /** Field configurations (label, type, placeholder, autoComplete) */
  fieldConfigs: Record<TFieldName, FieldConfig>;
  /** Hidden fields to include in form submission */
  hiddenFields?: Record<string, string>;
  /** Initial values for form fields (for edit mode) */
  initialValues?: Partial<Record<TFieldName, string>>;
  /** Additional content to render after the form (e.g., OAuth buttons) */
  footer?: React.ReactNode;
  /** Test ID for form fields (receives field name, returns test ID) */
  getFieldTestId?: (fieldName: TFieldName) => string;
  /** Test ID for submit button */
  submitTestId?: string;
  /** Submit button variant (default: "default", use "destructive" for delete) */
  submitVariant?: "default" | "destructive";
  /** Callback when form state changes */
  onStateChange?: (state: ActionState<TData>) => void;
  /** Custom class name for the form container */
  className?: string;
}

function getSuccessMessage(data: unknown): string | null {
  if (data && typeof data === "object" && "message" in data) {
    return (data as { message: string }).message;
  }
  return null;
}

export function ConfigDrivenForm<TFieldName extends string, TData>({
  action,
  initialState,
  uiConfig,
  fieldConfigs,
  hiddenFields,
  initialValues,
  footer,
  getFieldTestId,
  submitTestId,
  submitVariant,
  onStateChange,
  className,
}: ConfigDrivenFormProps<TFieldName, TData>) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const { label, description, fields, submit } = uiConfig;

  // Track previous status to detect changes
  const prevStatusRef = useRef(state.status);

  // Call onStateChange when status changes (not on initial mount)
  useEffect(() => {
    if (prevStatusRef.current !== state.status && state.status !== "idle") {
      onStateChange?.(state);
    }
    prevStatusRef.current = state.status;
  }, [state, onStateChange]);

  const successMessage =
    state.status === "success" ? getSuccessMessage(state.data) : null;
  const hasGlobalError =
    state.status === "error" && !Object.keys(state.errors ?? {}).length;

  return (
    <div className={className ?? "mx-auto flex max-w-xs flex-col gap-6"}>
      <form action={formAction} className="flex flex-col gap-6">
        {/* Hidden fields */}
        {hiddenFields &&
          Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} name={name} type="hidden" value={value} />
          ))}

        <FieldSet>
          <FieldLegend>{label}</FieldLegend>
          {description && <FieldDescription>{description}</FieldDescription>}

          {/* Global error message */}
          {hasGlobalError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
              {state.message}
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-600 text-sm">
              {successMessage}
            </div>
          )}

          {/* Form fields */}
          {fields.length > 0 && (
            <FieldGroup>
              {fields.map((fieldName) => {
                const config = fieldConfigs[fieldName];
                const error = state.errors?.[fieldName]?.[0];
                // Use initialValues first (for edit mode), then fall back to state.defaultValues
                const defaultValue = (initialValues?.[fieldName] ??
                  state.defaultValues?.[fieldName]) as string;

                const Component = fieldComponents[config.type];

                return (
                  <Field data-invalid={!!error} key={fieldName}>
                    <FieldLabel htmlFor={fieldName}>{config.label}</FieldLabel>

                    <Component
                      config={config}
                      defaultValue={defaultValue}
                      error={error}
                      name={fieldName}
                      testId={getFieldTestId?.(fieldName)}
                    />

                    {config.description && (
                      <p className="text-muted-foreground text-xs">
                        {config.description}
                      </p>
                    )}
                    <FieldError>{error}</FieldError>
                  </Field>
                );
              })}
            </FieldGroup>
          )}

          <Button
            className="w-full"
            data-testid={submitTestId}
            disabled={isPending}
            type="submit"
            variant={submitVariant}
          >
            {isPending ? submit.pending : submit.label}
          </Button>
        </FieldSet>
      </form>

      {footer}
    </div>
  );
}

// Re-export FieldSeparator for use in footers
export { FieldSeparator };
