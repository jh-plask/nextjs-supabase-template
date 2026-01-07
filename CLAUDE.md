# Next.js 16 + Supabase + React 19 Architecture Guide

**Role:** You are an expert Full-Stack Engineer specializing in Next.js App Router, Supabase, and React 19.
**Goal:** Build type-safe, accessible, and robust mutation flows using Server Actions, Zod, and the `Field` UI component.

---

## 1. Project Directory Structure

Adopt a **Domain-Driven** structure with **Unified Config** for actions.

```text
src/
├── app/
│   └── dashboard/projects/page.tsx
│
├── actions/              # Server Actions (Grouped by Domain)
│   ├── org/
│   │   ├── index.ts      # Action (createSafeAction + dispatch)
│   │   ├── config.ts     # Unified: Fields + Operations + Test data
│   │   ├── schema.ts     # Zod Schema (uses config.ts fields)
│   │   └── logic/        # Operation handlers
│   │       ├── index.ts  # Config aggregator
│   │       ├── create.ts
│   │       └── update.ts
│   └── projects/
│
├── lib/                  # Core Utilities
│   ├── safe-action.ts    # Action wrapper + trycatch
│   ├── test-types.ts     # Shared test types (DbEffect, OperationTestPlan)
│   ├── action-builder.ts # Optional: buildActionConfig utility
│   ├── form-config.ts    # Base form config types
│   └── supabase/         # Client generators
│
├── components/
│   └── ui/
│       ├── config-driven-form.tsx   # Form with external submit support
│       ├── config-driven-dialog.tsx # Dialog with footer submit
│       ├── field.tsx                # Field ecosystem
│       └── dialog.tsx               # Dialog primitives
│
└── tests/
    ├── plans/            # Test plans (import from action configs)
    └── utils/            # DB effects, admin client
```

---

## 2. Unified Config Pattern

**Key Principle:** Define fields and operations ONCE. Derive schema, UI configs, and test plans.

### A. Field Definitions (`config.ts`)

Combine Zod schema with UI config in a single object:

```typescript
// actions/org/config.ts
import { z } from "zod";
import type { FieldConfig, FormUIConfig } from "@/lib/form-config";
import type { OperationTestPlan } from "@/lib/test-types";

// 1. Field names as const tuple
export const orgFieldNames = ["name", "slug"] as const;
export type OrgFieldName = (typeof orgFieldNames)[number];

// 2. Fields: Schema + UI unified
export const orgFields = {
  name: {
    schema: z.string().min(2, { message: "Name must be at least 2 characters" }).max(50).optional(),
    ui: {
      label: "Organization Name",
      type: "text" as const,
      placeholder: "Acme Inc.",
    },
  },
  slug: {
    schema: z.string().regex(/^[a-z0-9-]+$/).optional(),
    ui: {
      label: "Slug (optional)",
      type: "text" as const,
      placeholder: "acme-inc",
      description: "URL-friendly identifier.",
    },
  },
} as const;

// 3. Operations: UI + Test data
export const orgOperationNames = ["create", "update", "switch", "delete"] as const;
export type OrgOperation = (typeof orgOperationNames)[number];

export const orgOperations = {
  create: {
    fields: ["name", "slug"] as OrgFieldName[],
    submit: { label: "Create Organization", pending: "Creating..." },
    description: "Create a new organization.",
    icon: "plus-circle",
    test: {
      valid: { name: "Test Organization" },
      invalid: { name: "X" },
      success: /created/i,
      error: /at least 2 characters/i,
      db: [{ table: "organizations", op: "insert", match: { name: "Test Organization" } }],
    } satisfies OperationTestPlan<OrgFieldName>,
  },
  update: {
    fields: ["name", "slug"] as OrgFieldName[],
    submit: { label: "Save Changes", pending: "Saving..." },
    description: "Update organization details.",
    icon: "settings",
    test: {
      valid: { name: "Updated Org" },
      success: /updated/i,
      db: [{ table: "organizations", op: "update" }],
    } satisfies OperationTestPlan<OrgFieldName>,
  },
  // ... more operations
} as const;

// 4. Derived configs for UI components
export const orgFieldConfigs: Record<OrgFieldName, FieldConfig> = {
  name: orgFields.name.ui,
  slug: orgFields.slug.ui,
};

export const orgFormConfigs = {
  create: {
    label: "Create Organization",
    description: orgOperations.create.description,
    fields: orgOperations.create.fields,
    submit: orgOperations.create.submit,
  },
  // ... more operations
} satisfies Record<OrgOperation, FormUIConfig<OrgFieldName>>;

// 5. Test plans (extracted for E2E tests)
export const orgTestPlans = {
  create: orgOperations.create.test,
  update: orgOperations.update.test,
} satisfies Partial<Record<OrgOperation, OperationTestPlan<OrgFieldName>>>;
```

### B. Schema Uses Config Fields (`schema.ts`)

```typescript
// actions/org/schema.ts
import { z } from "zod";
import { orgFields, orgOperationNames } from "./config";

export const OrgSchema = z.object({
  operation: z.enum(orgOperationNames).default("create"),
  orgId: z.string().uuid().optional(),
  // Use field schemas from config
  name: orgFields.name.schema,
  slug: orgFields.slug.schema,
});

export type OrgInput = z.infer<typeof OrgSchema>;
export type Operation = OrgInput["operation"];
```

### C. Benefits

| Before (2 files) | After (1 config) |
|------------------|------------------|
| `schema.ts` + `form-config.ts` | `config.ts` (unified) |
| Field names duplicated | Single source of truth |
| Test data in separate `tests/plans/` | Colocated with operation |
| `Record<string, string>` test data | `Partial<Record<FieldName, string>>` |

---

## 3. ConfigDrivenDialog with Footer Submit

**Rule:** Dialog submit button goes in `DialogFooter`, not inside form body.

### Component Usage

```tsx
// Using ConfigDrivenDialog
import { ConfigDrivenDialog } from "@/components/ui/config-driven-dialog";
import { processProject } from "@/actions/projects";
import { projectFieldConfigs, projectFormConfigs } from "@/actions/projects/config";
import { ProjectSchema } from "@/actions/projects/schema";

<ConfigDrivenDialog
  open={createOpen}
  onOpenChange={setCreateOpen}
  title={projectFormConfigs.create.label}
  description={projectFormConfigs.create.description}
  action={processProject}
  schema={ProjectSchema}
  uiConfig={projectFormConfigs.create}
  fieldConfigs={projectFieldConfigs}
  hiddenFields={{ operation: "create" }}
  testIdPrefix="project"
/>

// For edit mode (with initial values)
<ConfigDrivenDialog
  // ...same props
  hiddenFields={{ operation: "update", projectId: editProject.id }}
  initialValues={{ name: editProject.name, description: editProject.description }}
  key={editProject.id}  // Remount on project change
/>

// For destructive actions
<ConfigDrivenDialog
  // ...same props
  submitVariant="destructive"
  description={<>Are you sure you want to delete "{name}"?</>}
/>
```

### Dialog Structure

```tsx
// Dialog renders submit in footer (not inside form)
<Dialog>
  <DialogContent showCloseButton={false}>
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>

    {/* Form body only - no submit */}
    <form id={formId} action={formAction}>
      <FieldGroup>
        <ConfigDrivenFormBody ... />
      </FieldGroup>
    </form>

    {/* Submit in footer */}
    <DialogFooter>
      <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
      <Button type="submit" form={formId} disabled={isPending}>
        {isPending ? submit.pending : submit.label}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 4. Type-Safe Test Plans

### Shared Test Types (`lib/test-types.ts`)

```typescript
export interface DbEffect<TTable extends string = string> {
  table: TTable;
  op: "insert" | "update" | "delete";
  match?: Record<string, unknown>;
  expectCount?: number;  // Defaults to 1 for insert/update, 0 for delete
}

export interface OperationTestPlan<TFieldName extends string = string> {
  valid: Partial<Record<TFieldName, string>>;    // Type-safe!
  invalid?: Partial<Record<TFieldName, string>>; // Type-safe!
  success?: RegExp;
  error?: RegExp;
  redirectTo?: string;
  db: DbEffect[];
}
```

### Test Plans Import from Config

```typescript
// tests/plans/org.ts
import { orgTestPlans } from "@/actions/org/config";
import type { OrgOperation } from "@/actions/org/config";

// Re-export for use in tests
export { orgTestPlans };
export type { OrgOperation as Operation };
```

### Type Safety Example

```typescript
// ✓ TypeScript catches typos
const plan: OperationTestPlan<"name" | "slug"> = {
  valid: { name: "Test" },      // OK
  invalid: { naem: "X" },       // Error: 'naem' not in field names
};
```

---

## 5. Homeomorphic Action Pattern

### Directory Structure

```text
actions/org/
├── index.ts       # Action + dispatch
├── config.ts      # Unified config (fields, operations, tests)
├── schema.ts      # Zod schema (uses config fields)
└── logic/
    ├── index.ts   # Config aggregator
    ├── create.ts  # Handler + metadata
    ├── update.ts
    └── delete.ts
```

### Logic Files (Handler + Config)

```typescript
// actions/org/logic/create.ts
import type { OperationConfig, OrgInput } from "../schema";

async function handler(data: OrgInput) {
  const supabase = await createClient();
  if (!data.name) throw new Error("Organization name is required");

  const { data: result, error } = await supabase.rpc("create_organization", {
    p_name: data.name,
    p_slug: data.slug ?? null,
  });

  if (error) throw new Error(error.message);
  return { orgId: result.id };
}

export const create: OperationConfig = {
  handler,
  label: "Create Organization",
  description: "Create a new organization workspace",
  icon: "plus-circle",
};
```

### Config Aggregator

```typescript
// actions/org/logic/index.ts
import type { OrgDomain } from "../schema";
import { create } from "./create";
import { update } from "./update";
import { deleteOrg } from "./delete";

export const orgConfig: OrgDomain = { create, update, delete: deleteOrg };
```

### Action with Homeomorphic Dispatch

```typescript
// actions/org/index.ts
'use server';

import { createSafeAction } from "@/lib/safe-action";
import { OrgSchema } from "./schema";
import { orgConfig } from "./logic";

export const processOrg = createSafeAction(OrgSchema, async (data) => {
  // Data determines handler - no conditionals
  return await orgConfig[data.operation].handler(data);
});
```

---

## 6. ConfigDrivenForm Components

### Form Body (for external submit)

```typescript
// ConfigDrivenFormBody - renders fields without submit
export function ConfigDrivenFormBody<TFieldName extends string>({
  formId,
  uiConfig,
  fieldConfigs,
  state,
  hiddenFields,
  initialValues,
  getFieldTestId,
}: FormBodyProps<TFieldName>) {
  return (
    <>
      {hiddenFields && Object.entries(hiddenFields).map(([name, value]) => (
        <input form={formId} key={name} name={name} type="hidden" value={value} />
      ))}
      <FieldGroup>
        {uiConfig.fields.map((fieldName) => (
          <Field key={fieldName} data-invalid={!!state.errors?.[fieldName]}>
            <FieldLabel>{fieldConfigs[fieldName].label}</FieldLabel>
            <Component name={fieldName} defaultValue={...} />
            <FieldError>{state.errors?.[fieldName]?.[0]}</FieldError>
          </Field>
        ))}
      </FieldGroup>
    </>
  );
}
```

### External Submit Button

```typescript
// FormSubmitButton - connects to form via ID
export function FormSubmitButton({ formId, isPending, submit, variant, testId }) {
  return (
    <Button form={formId} type="submit" disabled={isPending} variant={variant}>
      {isPending ? submit.pending : submit.label}
    </Button>
  );
}
```

### Full Form (with internal submit)

```typescript
// ConfigDrivenForm - complete form with optional external submit
<ConfigDrivenForm
  action={processOrg}
  initialState={initialState}
  uiConfig={orgFormConfigs.create}
  fieldConfigs={orgFieldConfigs}
  hiddenFields={{ operation: "create" }}
  // externalSubmit={true}  // Set true to skip internal submit button
/>
```

---

## 7. Rules Summary

### Config Pattern
1. **Single source of truth** — Fields defined once in `config.ts`
2. **Schema uses config** — `schema.ts` imports field schemas from config
3. **Test data colocated** — Test plans embedded in operation definitions
4. **Type-safe field names** — `Partial<Record<FieldName, string>>` not `Record<string, string>`

### Dialog Pattern
1. **Submit in footer** — Use `DialogFooter` for actions, not inside form
2. **Cancel + Submit** — Footer has Cancel (DialogClose) and Submit buttons
3. **Form ID connection** — Use `form={formId}` attribute on external submit

### Homeomorphic Pattern
1. **One file per operation** — `create.ts`, `update.ts`, not `operations.ts`
2. **Config holds handler + metadata** — UI copy, icons in same object
3. **Index only aggregates** — No implementation in `logic/index.ts`
4. **Data determines handler** — `config[data.operation].handler(data)`

### Testing Pattern
1. **Import from config** — Test plans come from `actions/{domain}/config.ts`
2. **Type-safe test data** — Field names enforced by TypeScript
3. **DbEffect shared type** — From `lib/test-types.ts`
