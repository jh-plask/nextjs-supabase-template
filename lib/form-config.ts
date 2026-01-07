// --- Base Field Configuration ---
export interface FieldConfig {
  label: string;
  type: "text" | "email" | "password" | "number" | "tel" | "url";
  placeholder?: string;
  autoComplete?: string;
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
