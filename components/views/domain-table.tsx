"use client";

import type { z } from "zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ColumnConfig, Domain } from "@/lib/domain";
import { cn } from "@/lib/utils";

// --- Row Action Types ---
export type RowAction = "edit" | "delete" | "view" | (string & {});

export interface RowActionConfig {
  action: RowAction;
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "destructive";
}

// --- Props ---
export interface DomainTableProps<
  TFieldName extends string,
  TOperation extends string,
  TSchema extends z.ZodType,
  TData extends Record<string, unknown> = Record<string, unknown>,
> {
  /** The domain containing column configuration */
  domain: Domain<TFieldName, TOperation, TSchema>;
  /** The operation that defines which columns to display */
  operation: TOperation;
  /** Data rows to display */
  data: TData[];
  /** Row action handler */
  onRowAction?: (action: RowAction, row: TData) => void;
  /** Available row actions (defaults to edit/delete) */
  rowActions?: RowActionConfig[];
  /** Empty state content */
  emptyState?: React.ReactNode;
  /** Custom class name */
  className?: string;
  /** Test ID prefix */
  testIdPrefix?: string;
  /** Row key extractor (defaults to "id" field) */
  getRowKey?: (row: TData) => string;
}

// --- Default Row Actions ---
const DEFAULT_ROW_ACTIONS: RowActionConfig[] = [
  { action: "edit", label: "Edit" },
  { action: "delete", label: "Delete", variant: "destructive" },
];

// --- MoreVertical Icon ---
function MoreVerticalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

// --- Component ---
export function DomainTable<
  TFieldName extends string,
  TOperation extends string,
  TSchema extends z.ZodType,
  TData extends Record<string, unknown> = Record<string, unknown>,
>({
  domain,
  operation,
  data,
  onRowAction,
  rowActions = DEFAULT_ROW_ACTIONS,
  emptyState,
  className,
  testIdPrefix,
  getRowKey,
}: DomainTableProps<TFieldName, TOperation, TSchema, TData>) {
  const opConfig = domain.operations[operation];
  const columns = opConfig.columns ?? [];

  // Default key extractor
  const extractKey = getRowKey ?? ((row: TData) => String(row.id ?? row.uuid));

  // Render cell value
  const renderCell = (
    column: ColumnConfig<TFieldName>,
    row: TData
  ): React.ReactNode => {
    const value = row[column.field];
    if (column.render) {
      return column.render(value, row);
    }
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>;
    }
    return String(value);
  };

  // Empty state
  if (data.length === 0) {
    return (
      <div className={cn("rounded-lg border p-8 text-center", className)}>
        {emptyState ?? <p className="text-muted-foreground">No items found.</p>}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <table
        className="w-full"
        data-testid={testIdPrefix ? `${testIdPrefix}-table` : undefined}
      >
        <thead className="border-b bg-muted/50">
          <tr>
            {columns.map((column) => (
              <th
                className={cn(
                  "px-4 py-3 text-left font-medium text-muted-foreground text-sm",
                  column.width && `w-[${column.width}]`
                )}
                key={column.field}
              >
                {column.header}
              </th>
            ))}
            {onRowAction && (
              <th className="w-12 px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const key = extractKey(row);
            return (
              <tr
                className="border-b last:border-0 hover:bg-muted/25"
                data-testid={
                  testIdPrefix ? `${testIdPrefix}-row-${key}` : undefined
                }
                key={key}
              >
                {columns.map((column) => (
                  <td className="px-4 py-3 text-sm" key={column.field}>
                    {renderCell(column, row)}
                  </td>
                ))}
                {onRowAction && (
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                        data-testid={
                          testIdPrefix
                            ? `${testIdPrefix}-row-${key}-actions`
                            : undefined
                        }
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreVerticalIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {rowActions.map(({ action, label, variant }) => (
                          <DropdownMenuItem
                            className={cn(
                              variant === "destructive" && "text-destructive"
                            )}
                            data-testid={
                              testIdPrefix
                                ? `${testIdPrefix}-row-${key}-${action}`
                                : undefined
                            }
                            key={action}
                            onSelect={() => onRowAction(action, row)}
                          >
                            {label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
