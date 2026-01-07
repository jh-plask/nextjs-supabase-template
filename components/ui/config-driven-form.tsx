"use client";

import { useActionState, useEffect, useId, useRef } from "react";
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

// ============================================
// Types
// ============================================

export interface FormBodyProps<TFieldName extends string> {
  /** Form ID for connecting external submit buttons */
  formId: string;
  /** UI configuration (fields array) */
  uiConfig: Pick<FormUIConfig<TFieldName>, "fields">;
  /** Field configurations (label, type, placeholder, autoComplete) */
  fieldConfigs: Record<TFieldName, FieldConfig>;
  /** Current form state (for errors and default values) */
  state: ActionState<unknown>;
  /** Hidden fields to include in form submission */
  hiddenFields?: Record<string, string>;
  /** Initial values for form fields (for edit mode) */
  initialValues?: Partial<Record<TFieldName, string>>;
  /** Test ID generator for form fields */
  getFieldTestId?: (fieldName: TFieldName) => string;
}

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
  /**
   * If true, does not render the submit button inside the form.
   * Use FormSubmitButton with the formId to render submit externally.
   */
  externalSubmit?: boolean;
  /** Exposed form ID for external submit button connection */
  formIdRef?: React.RefObject<string>;
}

// ============================================
// Helpers
// ============================================

function getSuccessMessage(data: unknown): string | null {
  if (data && typeof data === "object" && "message" in data) {
    return (data as { message: string }).message;
  }
  return null;
}

// ============================================
// Form Body Component (fields only, no submit)
// ============================================

/**
 * Renders form fields without the submit button.
 * Used by ConfigDrivenDialog to separate fields from footer actions.
 */
export function ConfigDrivenFormBody<TFieldName extends string>({
  formId,
  uiConfig,
  fieldConfigs,
  state,
  hiddenFields,
  initialValues,
  getFieldTestId,
}: FormBodyProps<TFieldName>) {
  const { fields } = uiConfig;

  return (
    <>
      {/* Hidden fields */}
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input
            form={formId}
            key={name}
            name={name}
            type="hidden"
            value={value}
          />
        ))}

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
    </>
  );
}

// ============================================
// Form Submit Button (for external use)
// ============================================

export interface FormSubmitButtonProps {
  /** Form ID to connect the button to */
  formId: string;
  /** Whether the form is pending */
  isPending: boolean;
  /** Submit button configuration */
  submit: { label: string; pending: string };
  /** Button variant */
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  /** Test ID for the button */
  testId?: string;
  /** Additional class name */
  className?: string;
}

/**
 * Submit button that can be placed outside the form.
 * Uses the form attribute to connect to the form by ID.
 */
export function FormSubmitButton({
  formId,
  isPending,
  submit,
  variant,
  testId,
  className,
}: FormSubmitButtonProps) {
  return (
    <Button
      className={className}
      data-testid={testId}
      disabled={isPending}
      form={formId}
      type="submit"
      variant={variant}
    >
      {isPending ? submit.pending : submit.label}
    </Button>
  );
}

// ============================================
// Main Form Component
// ============================================

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
  externalSubmit = false,
  formIdRef,
}: ConfigDrivenFormProps<TFieldName, TData>) {
  const generatedFormId = useId();
  const formId = `form-${generatedFormId.replace(/:/g, "")}`;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const { label, description, submit } = uiConfig;

  // Expose form ID for external submit button
  useEffect(() => {
    if (formIdRef) {
      formIdRef.current = formId;
    }
  }, [formId, formIdRef]);

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
      <form action={formAction} className="flex flex-col gap-6" id={formId}>
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

          {/* Form body (fields) */}
          <ConfigDrivenFormBody
            fieldConfigs={fieldConfigs}
            formId={formId}
            getFieldTestId={getFieldTestId}
            hiddenFields={hiddenFields}
            initialValues={initialValues}
            state={state}
            uiConfig={uiConfig}
          />

          {/* Submit button (unless external) */}
          {!externalSubmit && (
            <Button
              className="w-full"
              data-testid={submitTestId}
              disabled={isPending}
              type="submit"
              variant={submitVariant}
            >
              {isPending ? submit.pending : submit.label}
            </Button>
          )}
        </FieldSet>
      </form>

      {footer}
    </div>
  );
}

// Re-export FieldSeparator for use in footers
export { FieldSeparator };
