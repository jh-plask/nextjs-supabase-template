/**
 * Organization Test Plans
 *
 * Imports test plans directly from the unified config.
 * This ensures type safety and eliminates drift.
 */

import type { OrgOperation } from "@/actions/org/config";
import { orgTestPlans } from "@/actions/org/config";
import { orgConfig } from "@/actions/org/logic";

// Re-export for backwards compatibility
export type { OrgOperation as Operation };
export { orgTestPlans };

// Type safety: ensure plan keys match config keys
const _typeCheck: OrgOperation[] = Object.keys(orgConfig) as OrgOperation[];
void _typeCheck;
