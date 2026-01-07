"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { z } from "zod";
import { ConfigDrivenForm } from "@/components/ui/config-driven-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  /** Field configurations from action form-config */
  fieldConfigs: Record<TFieldName, FieldConfig>;
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
  fieldConfigs,
  hiddenFields,
  initialValues,
  submitVariant,
  testIdPrefix,
  onSuccess,
  refreshOnSuccess = true,
}: ConfigDrivenDialogProps<TFieldName>) {
  const router = useRouter();
  const initialState = getZodDefaults(schema);

  const handleStateChange = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: Action state is generic
    async (state: ActionState<any>) => {
      if (state.status === "success") {
        await onSuccess?.();
        onOpenChange(false);
        // Trigger client-side refresh after dialog closes
        // Server action should use revalidatePath for cache invalidation
        if (refreshOnSuccess) {
          router.refresh();
        }
      }
    },
    [router, onOpenChange, onSuccess, refreshOnSuccess]
  );

  // Generate test ID function if prefix provided
  const getFieldTestId = testIdPrefix
    ? (fieldName: TFieldName) => `${testIdPrefix}-field-${fieldName}`
    : undefined;

  const submitTestId = testIdPrefix ? `${testIdPrefix}-submit` : undefined;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <ConfigDrivenForm
          action={action}
          className="flex flex-col gap-4"
          fieldConfigs={fieldConfigs}
          getFieldTestId={getFieldTestId}
          hiddenFields={hiddenFields}
          initialState={initialState}
          initialValues={initialValues}
          onStateChange={handleStateChange}
          submitTestId={submitTestId}
          submitVariant={submitVariant}
          uiConfig={{
            ...uiConfig,
            label: "", // Hide legend since dialog has title
            description: undefined,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
