// Domain-aware view components
// These components accept a Domain object and render the appropriate UI

export type {
  ColumnConfig,
  Domain,
  DomainData,
  DomainFieldName,
  DomainOperation,
  OperationConfig,
} from "@/lib/domain";
// Re-export domain types for convenience
export { createDomain } from "@/lib/domain";
export type { DomainDialogProps } from "./domain-dialog";
export { DomainDialog } from "./domain-dialog";
export type { DomainFormProps } from "./domain-form";
export { DomainForm, FieldSeparator } from "./domain-form";
export type {
  DomainTableProps,
  RowAction,
  RowActionConfig,
} from "./domain-table";
export { DomainTable } from "./domain-table";
