/**
 * Capitalizes the first letter of a string
 * @example capitalize("admin") => "Admin"
 */
export function capitalize(str: string): string {
  if (!str) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a string to title case
 * @example toTitleCase("hello world") => "Hello World"
 */
export function toTitleCase(str: string): string {
  if (!str) {
    return str;
  }
  return str.replace(/\w\S*/g, (txt) => capitalize(txt.toLowerCase()));
}

/**
 * Converts an array of string values to select options
 * @example toSelectOptions(["admin", "member"]) => [{ value: "admin", label: "Admin" }, ...]
 */
export function toSelectOptions(values: readonly string[]) {
  return values.map((value) => ({
    value,
    label: capitalize(value),
  }));
}
