"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FieldConfig, FieldType } from "@/lib/form-config";

// ============================================
// Field Component Props
// ============================================

export interface FieldComponentProps {
  name: string;
  config: FieldConfig;
  defaultValue?: string;
  error?: string;
  testId?: string;
}

// ============================================
// Input Field Component
// ============================================

function InputField({
  name,
  config,
  defaultValue,
  error,
  testId,
}: FieldComponentProps) {
  return (
    <Input
      aria-invalid={!!error}
      autoComplete={config.autoComplete}
      data-testid={testId}
      defaultValue={defaultValue}
      id={name}
      name={name}
      placeholder={config.placeholder}
      type={config.type as ComponentProps<typeof Input>["type"]}
    />
  );
}

// ============================================
// Select Field Component
// ============================================

function SelectField({
  name,
  config,
  defaultValue,
  error,
  testId,
}: FieldComponentProps) {
  const options = config.options ?? [];
  const firstValue = options[0]?.value ?? "";

  return (
    <Select defaultValue={defaultValue || firstValue} name={name}>
      <SelectTrigger aria-invalid={!!error} data-testid={testId} id={name}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ============================================
// Type-to-Component Map
// ============================================

type FieldComponent = (props: FieldComponentProps) => React.ReactNode;

export const fieldComponents: Record<FieldType, FieldComponent> = {
  text: InputField,
  email: InputField,
  password: InputField,
  number: InputField,
  tel: InputField,
  url: InputField,
  select: SelectField,
};
