import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a string to a URL-friendly slug.
 * @throws Error if input is empty or results in empty slug.
 */
export function toSlug(text: string): string {
  if (!text || typeof text !== "string") {
    throw new Error("Slug generation failed: Input cannot be empty.");
  }

  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length === 0) {
    throw new Error("Slug generation failed: Resulting string is empty.");
  }

  return slug;
}
