"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useId, useRef } from "react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { ConfigDrivenFormBody } from "@/components/ui/config-driven-form";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import type { FieldConfig, FormUIConfig } from "@/lib/form-config";
import type { ActionState } from "@/lib/safe-action";
import { getZodDefaults } from "@/lib/safe-action";

// ===========================================
// Types
// ===========================================

export interface ConfigDrivenDialogProps<TFieldName extends string> {
  /** Dialog open state */
  open: boolean;
  /** Dialog open state change handler */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description (static string or React node for dynamic content) */
  description?: React.ReactNode;
  /** Server action to handle form submission */
  action: (
    // biome-ignore lint/suspicious/noExplicitAny: Action state is generic
    prevState: ActionState<any>,
    formData: FormData
    // biome-ignore lint/suspicious/noExplicitAny: Action state is generic
  ) => Promise<ActionState<any>>;
  /** Zod schema for initial state */
  schema: z.ZodType;
  /** UI configuration from action form-config */
  uiConfig: FormUIConfig<TFieldName>;
  /** Field configurations (label, type, placeholder) */
  fields: Record<TFieldName, FieldConfig>;
  /** Hidden fields (e.g., operation type) */
  hiddenFields?: Record<string, string>;
  /** Initial values for form fields (for edit mode) */
  initialValues?: Partial<Record<TFieldName, string>>;
  /** Submit button variant (default: "default", use "destructive" for delete) */
  submitVariant?: "default" | "destructive";
  /** Test ID prefix for form fields */
  testIdPrefix?: string;
  /** Callback after successful submission (before close) */
  onSuccess?: () => void | Promise<void>;
  /** Whether to refresh the router on success */
  refreshOnSuccess?: boolean;
}

// ===========================================
// Component
// ===========================================

export function ConfigDrivenDialog<TFieldName extends string>({
  open,
  onOpenChange,
  title,
  description,
  action,
  schema,
  uiConfig,
  fields,
  hiddenFields,
  initialValues,
  submitVariant,
  testIdPrefix,
  onSuccess,
  refreshOnSuccess = true,
}: ConfigDrivenDialogProps<TFieldName>) {
  const router = useRouter();
  const generatedId = useId();
  const formId = `dialog-form-${generatedId.replace(/:/g, "")}`;
  const initialState = getZodDefaults(schema);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const prevStatusRef = useRef(state.status);

  // Handle success state changes
  useEffect(() => {
    if (prevStatusRef.current !== state.status && state.status === "success") {
      const handleSuccess = async () => {
        await onSuccess?.();
        onOpenChange(false);
        if (refreshOnSuccess) {
          router.refresh();
        }
      };
      handleSuccess();
    }
    prevStatusRef.current = state.status;
  }, [state.status, onSuccess, onOpenChange, refreshOnSuccess, router]);

  // Reset form state when dialog closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  // Generate test ID function if prefix provided
  const getFieldTestId = testIdPrefix
    ? (fieldName: TFieldName) => `${testIdPrefix}-field-${fieldName}`
    : undefined;

  const submitTestId = testIdPrefix ? `${testIdPrefix}-submit` : undefined;

  // Check for global errors (non-field-specific)
  const hasGlobalError =
    state.status === "error" && !Object.keys(state.errors ?? {}).length;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* Global error message */}
        {hasGlobalError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
            {state.message}
          </div>
        )}

        {/* Form with fields only (submit is in footer) */}
        <form action={formAction} className="flex flex-col gap-4" id={formId}>
          <FieldGroup>
            <ConfigDrivenFormBody
              fields={fields}
              formId={formId}
              getFieldTestId={getFieldTestId}
              hiddenFields={hiddenFields}
              initialValues={initialValues}
              state={state}
              uiConfig={uiConfig}
            />
          </FieldGroup>
        </form>

        {/* Footer with Cancel and Submit buttons */}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            data-testid={submitTestId}
            disabled={isPending}
            form={formId}
            type="submit"
            variant={submitVariant}
          >
            {isPending ? uiConfig.submit.pending : uiConfig.submit.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
