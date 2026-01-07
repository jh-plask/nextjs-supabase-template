import type { z } from "zod";

// --- 1. React 19 State Shape ---
export interface ActionState<T> {
  status: "idle" | "success" | "error";
  message: string;
  data?: T | null;
  errors?: Record<string, string[]>;
  defaultValues?: Record<string, unknown>;
}

// --- 2. Functional TryCatch Pattern ---
export type OperationResult<T, E> = readonly [T, null] | readonly [null, E];

// Check if error is a Next.js redirect (should not be caught)
function isRedirectError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "digest" in error &&
    typeof (error as { digest?: string }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function trycatch<T, E = Error>(
  promise: Promise<T>
): Promise<OperationResult<T, E>> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    // Re-throw Next.js redirects - they're not real errors
    if (isRedirectError(error)) {
      throw error;
    }
    const e = error instanceof Error ? error : new Error(String(error));
    return [null, e as unknown as E];
  }
}

// --- 3. The Safe Action Wrapper ---
export function createSafeAction<Schema extends z.ZodType<unknown>, Data>(
  schema: Schema,
  handler: (data: z.infer<Schema>) => Promise<Data>
) {
  return async (
    _prevState: ActionState<Data>,
    formData: FormData
  ): Promise<ActionState<Data>> => {
    // A. Parse & Validate
    const rawData = Object.fromEntries(formData);
    const validation = schema.safeParse(rawData);

    if (!validation.success) {
      return {
        status: "error",
        message: "Please check your input.",
        errors: validation.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
        defaultValues: rawData,
      };
    }

    // B. Execute with TryCatch
    const [data, error] = await trycatch<Data>(handler(validation.data));

    // C. Handle Failure
    if (error) {
      console.error("Action Failure:", error);
      return {
        status: "error",
        message: error.message || "An unexpected error occurred.",
        errors: {},
        defaultValues: rawData,
      };
    }

    // D. Handle Success
    return {
      status: "success",
      message: "Success",
      data,
      errors: {},
      defaultValues: {},
    };
  };
}

// --- 4. Get Zod Defaults Helper ---
export function getZodDefaults<T extends z.ZodTypeAny>(
  schema: T
): ActionState<z.infer<T>> {
  const result = schema.safeParse({});
  if (result.success) {
    return {
      status: "idle" as const,
      message: "",
      errors: {},
      defaultValues: result.data as Record<string, unknown>,
    };
  }
  return {
    status: "idle" as const,
    message: "",
    errors: {},
    defaultValues: {},
  };
}
