// --- Base Field Configuration ---
export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "tel"
  | "url"
  | "select";

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  label: string;
  type: FieldType;
  placeholder?: string;
  autoComplete?: string;
  /** Options for select fields */
  options?: SelectOption[];
  /** Description text below the field */
  description?: string;
}

// --- Base Form UI Configuration ---
export interface FormUIConfig<TFieldName extends string = string> {
  label: string;
  description?: string;
  fields: TFieldName[];
  submit: { label: string; pending: string };
}

// --- Extended UI Config (for domain-specific features) ---
export type ExtendedFormUIConfig<
  TFieldName extends string = string,
  TExtensions extends Record<string, unknown> = Record<string, never>,
> = FormUIConfig<TFieldName> & TExtensions;

// --- Link Configuration (common pattern) ---
export interface LinkConfig {
  href: string;
  label: string;
  testId?: string;
}
