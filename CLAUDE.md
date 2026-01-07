# Next.js 16 + Supabase + React 19 Architecture Guide

**Role:** You are an expert Full-Stack Engineer specializing in Next.js App Router, Supabase, and React 19.
**Goal:** Build type-safe, accessible, and robust mutation flows using Server Actions, Zod, and the `Field` UI component.

---

## 1. Project Directory Structure

Adopt a **Domain-Driven** structure for actions to keep related logic together.

```text
src/
├── app/
│   └── (dashboard)/profile/page.tsx
│
├── actions/              # Server Actions (Grouped by Domain)
│   ├── profile/
│   │   ├── index.ts      # Action logic (createSafeAction)
│   │   └── schema.ts     # Zod Schema (Strictly Typed)
│   └── auth/
│
├── lib/                  # Core Utilities
│   ├── safe-action.ts    # The Wrapper + TryCatch logic
│   ├── supabase/         # Client generators
│
├── utils/                # Utility functions, should be pure.
│   ├── string-utils.ts   # String utilities
│   └── ...
│
├── types/
│   └── supabase.ts       # Generated via `supabase gen types`
│
└── components/
    └── ui/
        ├── field.tsx     # The "Field" ecosystem
        └── ...
```

---

## 2. Core Infrastructure Setup

Before implementing features, ensure these utilities exist.

### A. Supabase Client (`src/lib/supabase/server.ts`)

Standard Server Component client using `@supabase/ssr`.

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}
```

### B. Functional Error Handling & Action Wrapper (`src/lib/safe-action.ts`)

This bridges your functional `trycatch` pattern with React 19's `useActionState` requirements.

```typescript
import { z } from "zod";

// --- 1. React 19 State Shape ---
export type ActionState<T> = {
  status: "idle" | "success" | "error";
  message: string;
  data?: T | null;
  errors?: Record<string, string[]>; // Field-specific errors
  defaultValues?: any;               // For preserving input on error
};

// --- 2. Functional TryCatch Pattern ---
export type OperationResult<T, E> = readonly [T, null] | readonly [null, E];

export async function trycatch<T, E = Error>(
  promise: Promise<T>
): Promise<OperationResult<T, E>> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    const e = error instanceof Error ? error : new Error(String(error));
    return [null, e as unknown as E];
  }
}

// --- 3. The Safe Action Wrapper ---
export function createSafeAction<Schema extends z.ZodType<any>, Data>(
  schema: Schema,
  handler: (data: z.infer<Schema>) => Promise<Data>
) {
  return async (
    prevState: ActionState<Data>,
    formData: FormData
  ): Promise<ActionState<Data>> => {
    // A. Parse & Validate
    const rawData = Object.fromEntries(formData);
    const validation = schema.safeParse(rawData);

    if (!validation.success) {
      return {
        status: "error",
        message: "Please check your input.",
        errors: validation.error.flatten().fieldErrors,
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
      data: data,
      errors: {},
      defaultValues: {}, // Clear form on success (optional)
    };
  };
}

export function getZodDefaults<T extends z.ZodTypeAny>(schema: T): z.infer<T> {
  // Parsing an empty object forces Zod to apply .default() values
  const result = schema.safeParse({});
  if (result.success) return {
    status: "idle" as const,
    message: "",
    errors: {},
    defaultValues: result.data,
  };
  return {
    status: "error" as const,
    message: "Zod Default Parsing Error.",
    errors: {},
    defaultValues: result.error.flatten().fieldErrors,
  };
}
```

---

## 3. Implementation Rules (Step-by-Step)

### When to Use Simple vs. Homeomorphic Pattern

| Simple (Step 2) | Homeomorphic (Section 4) |
|-----------------|--------------------------|
| Single operation | Multiple operation types |
| `updateProfile`, `deletePost` | `processOrder` (create/cancel/refund) |
| Logic inline in `index.ts` | Logic in `logic/*.ts` files |

**Upgrade Signal:** When you write `if (data.type === 'X')` — use homeomorphism instead.

### Step 1: Strict Schema Definition

**Rule:** Zod Schema MUST match Supabase Generated Types exactly.
**Why:** Prevents "ghost fields" that exist in code but not in the DB.

```typescript
// src/actions/profile/schema.ts
import { z } from "zod";
import type { Tables } from "@/types/supabase";

// 1. Extract the exact Row type
type Profile = Tables<'profiles'>;

// 2. Define Schema with "z.ZodType<Profile>"
export const ProfileSchema: z.ZodType<Profile> = z.object({
  id: z.string().uuid(),
  updated_at: z.string().nullable(),

  // Custom Error Messages are MANDATORY
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters" })
    .default(""), // Zod Default

  full_name: z.string()
    .min(1, { message: "Name is required" })
    .default("Guest"), // Zod Default

  avatar_url: z.string().nullable(),
  website: z.string().url({ message: "Invalid URL" }).nullable().default(null),
});

// 3. Create a Mutation Schema (Omit system fields)
export const UpdateProfileSchema = ProfileSchema.pick({
  username: true,
  full_name: true,
  website: true,
});
```

### Step 2: Server Action Logic (Simple Actions)

**Rule:** Utility functions never return null, false, or undefined to indicate failure. They throw descriptive Error objects so they can be caught by the trycatch wrapper.
```typescript
// src/utils/string-utils.ts

/**
 * Generates a URL-friendly slug.
 * @throws Error if input is empty or invalid.
 */
export function toSlug(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new Error("Slug generation failed: Input cannot be empty.");
  }

  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug.length === 0) {
    throw new Error("Slug generation failed: Resulting string is empty.");
  }

  return slug;
}
```

**Rule:** Use `createSafeAction`. Focus only on the "Happy Path". Throw errors to trigger the failure state.

```typescript
// src/actions/profile/index.ts
'use server';

import { createSafeAction } from "@/lib/safe-action";
import { FormSchema } from "./schema";
import { createClient } from "@/lib/supabase/server";
import { toSlug } from "@/utils/string-utils"; // Utils that throw

export const updateProfile = createSafeAction(FormSchema, async (data) => {
  const supabase = await createClient();
  
  // 1. Use Utility (If input is bad, it throws -> Action returns Error State)
  const slug = toSlug(data.username); 

  // 2. Perform DB Operation
  const { error } = await supabase
    .from('profiles')
    .update({ ...data, username: slug }) // Use processed data
    .eq('id', (await supabase.auth.getUser()).data.user?.id!);

  // 3. Throw on DB Error
  if (error) throw new Error(error.message); 

  return { updated: true, slug };
});
```

---

## 4. Advanced: Domain Logic Homeomorphism

Use **const object key-based homeomorphism** when actions handle multiple operation types. The data determines which handler executes—no conditionals needed.

### Core Concept

```typescript
// ❌ Conditional dispatch
if (data.operation === 'create') return await createOrder(data);
if (data.operation === 'cancel') return await cancelOrder(data);

// ✅ Homeomorphic dispatch — data.operation IS the key
return await orderLogic[data.operation](data);
```

### Directory Structure

```text
src/actions/orders/
├── index.ts       # Action + re-exports config
├── schema.ts      # Schema + types + config interface
└── logic/
    ├── index.ts   # Config aggregator (orderConfig)
    ├── create.ts  # handler + label + icon + ...
    ├── cancel.ts
    └── refund.ts
```

### Implementation

#### `schema.ts` — Single source of truth

Schema defines operations once. Types and domain config interface are derived.

```typescript
// src/actions/orders/schema.ts
import { z } from "zod";

// 1. Define schema with error messages + advanced validators
export const OrderSchema = z.object({
  operation: z.enum(['create', 'cancel', 'refund'], {
    message: "Please select a valid operation",
  }).default('create'),

  orderId: z.string()
    .uuid({ message: "Invalid order ID format" })
    .optional(),

  couponCode: z.string()
    .regex(/^[A-Z0-9]{6,12}$/, { message: "Coupon must be 6-12 uppercase alphanumeric characters" })
    .optional(),

  scheduledAt: z.string()
    .datetime({ message: "Invalid date format" })
    .optional(),

  items: z.array(z.object({
    id: z.string().uuid({ message: "Invalid item ID" }),
    quantity: z.number()
      .int({ message: "Quantity must be a whole number" })
      .min(1, { message: "Minimum quantity is 1" })
      .max(99, { message: "Maximum quantity is 99" }),
  }))
    .min(1, { message: "At least one item is required" })
    // NOTE: `.optional().default([])` allows `getZodDefaults(OrderSchema)` to succeed,
    // while submitted empty arrays still fail `.min(1)` when present.
    .optional()
    .default([]),
});

// 2. Derive types
export type OrderInput = z.infer<typeof OrderSchema>;
export type Operation = OrderInput['operation'];

// 3. Define domain config interface (handler + UI config)
export type OperationConfig = {
  handler: (data: OrderInput) => Promise<unknown>;
  label: string;
  description: string;
  icon: string;
  confirmMessage?: string;
};

export type OrderDomain = {
  [K in Operation]: OperationConfig;
};
```

#### `logic/*.ts` — One file per operation (handler + config)

```typescript
// src/actions/orders/logic/create.ts
import { createClient } from "@/lib/supabase/server";
import type { OperationConfig, OrderInput } from "../schema";

async function handler(data: OrderInput) {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error('Authentication required');

  const { data: order, error } = await supabase
    .from('orders')
    .insert({ user_id: userId, items: data.items })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return { orderId: order.id };
}

export const create: OperationConfig = {
  handler,
  label: 'Create Order',
  description: 'Place a new order with selected items',
  icon: 'plus-circle',
};
```

```typescript
// src/actions/orders/logic/cancel.ts
import { createClient } from "@/lib/supabase/server";
import type { OperationConfig, OrderInput } from "../schema";

async function handler(data: OrderInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', data.orderId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export const cancel: OperationConfig = {
  handler,
  label: 'Cancel Order',
  description: 'Cancel this order and stop processing',
  icon: 'x-circle',
  confirmMessage: 'Are you sure you want to cancel this order?',
};
```

```typescript
// src/actions/orders/logic/refund.ts
import { createClient } from "@/lib/supabase/server";
import type { OperationConfig, OrderInput } from "../schema";

async function handler(data: OrderInput) {
  const supabase = await createClient();
  const { data: rec, error } = await supabase
    .from('refunds')
    .insert({ order_id: data.orderId })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return { refundId: rec.id };
}

export const refund: OperationConfig = {
  handler,
  label: 'Refund Order',
  description: 'Process a full refund for this order',
  icon: 'arrow-left-circle',
  confirmMessage: 'Process refund? This cannot be undone.',
};
```

#### `logic/index.ts` — Domain config aggregator

```typescript
// src/actions/orders/logic/index.ts
import { create } from './create';
import { cancel } from './cancel';
import { refund } from './refund';
import type { OrderDomain } from '../schema';

export const orderConfig: OrderDomain = { create, cancel, refund };
```

#### `index.ts` — Action

```typescript
// src/actions/orders/index.ts
'use server';

import { createSafeAction } from "@/lib/safe-action";
import { OrderSchema } from "./schema";
import { orderConfig } from "./logic";

export const processOrder = createSafeAction(OrderSchema, async (data) => {
  return await orderConfig[data.operation].handler(data);
});

// Re-export config for use in React components
export { orderConfig } from "./logic";
```

#### Using config in React components

```tsx
// src/components/order-form.tsx
'use client';

import { useActionState } from "react";
import { processOrder, orderConfig } from "@/actions/orders";
import { OrderSchema, type Operation } from "@/actions/orders/schema";
import { getZodDefaults } from "@/lib/safe-action";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError, FieldGroup, FieldSet, FieldLegend } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const initialState = getZodDefaults(OrderSchema);
const operations = Object.keys(orderConfig) as Operation[];

export function OrderForm({ orderId }: { orderId?: string }) {
  const [state, action, isPending] = useActionState(processOrder, initialState);
  const selectedOp = (state.defaultValues?.operation ?? initialState.defaultValues.operation) as Operation;
  const { label, description } = orderConfig[selectedOp];

  return (
    <form action={action} className="max-w-md mx-auto space-y-6">
      <FieldSet>
        <FieldLegend>{label}</FieldLegend>
        <p className="text-sm text-muted-foreground">{description}</p>

        {state.status === 'error' && !Object.keys(state.errors || {}).length && (
          <div className="p-3 text-red-600 bg-red-50 border border-red-200 rounded text-sm">
            {state.message}
          </div>
        )}

        {state.status === 'success' && (
          <div className="p-3 text-green-600 bg-green-50 border border-green-200 rounded text-sm">
            {state.message}
          </div>
        )}

        <FieldGroup>
          <Field data-invalid={!!state.errors?.operation}>
            <FieldLabel htmlFor="operation">Operation</FieldLabel>
            <Select
              id="operation"
              name="operation"
              defaultValue={state.defaultValues?.operation}
            >
              {operations.map((op) => (
                <option key={op} value={op}>{orderConfig[op].label}</option>
              ))}
            </Select>
            <FieldError>{state.errors?.operation?.[0]}</FieldError>
          </Field>

          {orderId && <input type="hidden" name="orderId" value={orderId} />}
        </FieldGroup>

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Processing...' : label}
        </Button>
      </FieldSet>
    </form>
  );
}
```

### Adding New Operations

```typescript
// 1. Add to schema enum (single change propagates everywhere)
operation: z.enum(['create', 'cancel', 'refund', 'exchange'])

// 2. Create logic/exchange.ts with handler + config
export const exchange: OperationConfig = {
  handler: async (data) => { ... },
  label: 'Exchange Items',
  description: 'Exchange items for different products',
  icon: 'refresh-cw',
};

// 3. Add to aggregator
export const orderConfig: OrderDomain = { create, cancel, refund, exchange };

// TypeScript errors if any operation key is missing
// UI automatically picks up new operation's label, icon, etc.
```

### Nested Hierarchies

```typescript
// schema.ts
export const ProductSchema = z.object({
  category: z.enum(['electronics', 'clothing']),
  type: z.enum(['laptop', 'phone', 'shirt', 'pants']),
});

type Input = z.infer<typeof ProductSchema>;
type Category = Input['category'];

export type ItemConfig = {
  handler: (data: Input) => Promise<number>;
  label: string;
  basePrice: number;
};

export type ProductDomain = {
  [C in Category]: Record<string, ItemConfig>;
};

// Action dispatch
const price = await productConfig[data.category][data.type].handler(data);

// UI usage
const label = productConfig[data.category][data.type].label;
```

### Rules

1. **Schema is single source of truth** — Types derived via `z.infer`
2. **One file per operation** — `create.ts`, `cancel.ts`, not `operations.ts`
3. **Config holds handler + metadata** — UI copy, icons, constants in same object
4. **Index only aggregates** — No implementation in `logic/index.ts`

---

### Step 3: UI Implementation (React 19 + Field)

**Rule:** Connect `useActionState` results to the `Field` components.

#### Error Handling Linkage Logic:

1. **Global Errors (DB/Network):** Read `state.message` when `state.status === 'error'`. Display at the top of the form.
2. **Field Errors (Validation):** Read `state.errors?.fieldName`. Pass to `<FieldError>`.
3. **Values (Progressive Enhancement):** Read `state.defaultValues?.fieldName`. Pass to `defaultValue` prop.

```tsx
// src/components/profile-form.tsx
'use client';

import { useActionState } from "react";
import { updateProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field, FieldLabel, FieldInput, FieldError, FieldGroup, FieldSet, FieldLegend
} from "@/components/ui/field";

const initialState = getZodDefaults(UpdateProfileSchema);

export default function ProfileForm() {
  const [state, action, isPending] = useActionState(updateProfile, initialState);

  return (
    <form action={action} className="max-w-md mx-auto space-y-6">
      <FieldSet>
        <FieldLegend>Edit Profile</FieldLegend>

        {/* --- Global Error Handling --- */}
        {state.status === 'error' && !Object.keys(state.errors || {}).length && (
          <div className="p-3 text-red-600 bg-red-50 border border-red-200 rounded text-sm">
            Server Error: {state.message}
          </div>
        )}

        {/* --- Success Message --- */}
        {state.status === 'success' && (
           <div className="p-3 text-green-600 bg-green-50 border border-green-200 rounded text-sm">
            {state.message}
          </div>
        )}

        <FieldGroup>
          {/* Field: Full Name */}
          <Field data-invalid={!!state.errors?.full_name}>
            <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={state.defaultValues?.full_name}
              aria-invalid={!!state.errors?.full_name}
            />
            {/* Links specific validation error to this field */}
            <FieldError>{state.errors?.full_name?.[0]}</FieldError>
          </Field>

          {/* Field: Username */}
          <Field data-invalid={!!state.errors?.username}>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              name="username"
              defaultValue={state.defaultValues?.username}
              aria-invalid={!!state.errors?.username}
            />
            <FieldError>{state.errors?.username?.[0]}</FieldError>
          </Field>

        </FieldGroup>

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Update Profile'}
        </Button>

      </FieldSet>
    </form>
  );
}
```

---

## 5. Testing: Config-Driven E2E + DB Effects

Because every operation is a **serializable key**, you can run a single generic E2E runner that:
- selects the UI element for an operation by key
- submits the form
- verifies **database effects** (insert/update/delete) by querying Supabase with a **service-role client** (Node-only)

### A. Add stable selectors (key → element)

In your form, make the mapping explicit:

```tsx
<option value={op} data-testid={`order-op-${op}`}>
  {orderConfig[op].label}
</option>

<Button data-testid={`order-submit-${selectedOp}`} type="submit">
  {isPending ? 'Processing...' : label}
</Button>
```

### B. Define DB effects once (per operation)

```ts
// tests/plans/orders.ts
import { orderConfig } from '@/actions/orders';
import type { OrderInput, Operation } from '@/actions/orders/schema';

export type DbEffect = {
  table: 'orders' | 'refunds';
  op: 'insert' | 'update' | 'delete';
  match: Record<string, unknown>; // fields to match after the action
  expectCount?: number;          // defaults to 1
};

export type OperationTestPlan = {
  valid: Partial<OrderInput>;
  invalid?: Partial<OrderInput>;
  successMessage: RegExp;
  db: DbEffect[];
};

export const orderTestPlan: Record<Operation, OperationTestPlan> = {
  create: {
    valid: { items: [{ id: '00000000-0000-0000-0000-000000000001', quantity: 1 }] },
    invalid: { items: [] },
    successMessage: /success|created/i,
    db: [{ table: 'orders', op: 'insert', match: { /* e.g. status: 'pending' */ } }],
  },
  cancel: {
    valid: { orderId: '00000000-0000-0000-0000-000000000002' },
    invalid: { orderId: 'not-a-uuid' },
    successMessage: /success|cancel/i,
    db: [{ table: 'orders', op: 'update', match: { id: '00000000-0000-0000-0000-000000000002', status: 'cancelled' } }],
  },
  refund: {
    valid: { orderId: '00000000-0000-0000-0000-000000000003' },
    successMessage: /success|refund/i,
    db: [{ table: 'refunds', op: 'insert', match: { order_id: '00000000-0000-0000-0000-000000000003' } }],
  },
};

// Safety: ensure plan keys match config keys
void (Object.keys(orderConfig) satisfies Operation[]);
```

### C. Query Supabase in tests (service role, Node-only)

```ts
// tests/utils/supabase-admin.ts
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Node-only env var (never in the browser)
  );
}
```

```ts
// tests/utils/db-effects.ts
import { expect } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DbEffect } from '../plans/orders';

export async function expectDbEffects(admin: SupabaseClient, effects: DbEffect[]) {
  for (const effect of effects) {
    const expected = effect.expectCount ?? (effect.op === 'delete' ? 0 : 1);
    const { count, error } = await admin
      .from(effect.table)
      .select('*', { count: 'exact', head: true })
      .match(effect.match);

    expect(error, `DB error on ${effect.table}`).toBeNull();
    expect(count, `DB effect mismatch: ${effect.op} on ${effect.table}`).toBe(expected);
  }
}
```

### D. One generic E2E runner (covers all operations)

```ts
// tests/orders.spec.ts
import { test, expect } from '@playwright/test';
import { orderConfig } from '@/actions/orders';
import { orderTestPlan } from './plans/orders';
import { createAdminClient } from './utils/supabase-admin';
import { expectDbEffects } from './utils/db-effects';

const admin = createAdminClient();

test.describe('Orders (homeomorphic E2E)', () => {
  for (const [operation, plan] of Object.entries(orderTestPlan) as any) {
    test(`${operation}: success + db effects`, async ({ page }) => {
      await page.goto('/orders');

      // key → element mapping
      await page.getByTestId(`order-op-${operation}`).click();

      // fill inputs (simple scalar fields only)
      for (const [k, v] of Object.entries(plan.valid)) {
        await page.getByLabel(k, { exact: false }).fill(String(v));
      }

      await page.getByTestId(`order-submit-${operation}`).click();
      await expect(page.getByText(plan.successMessage)).toBeVisible();

      // verify DB effects
      await expectDbEffects(admin, plan.db);
    });
  }
});
```
