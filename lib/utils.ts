/**
 * Utility Functions
 * Card: FI-INFRA-STR-014
 */

type ClassValue = string | number | boolean | undefined | null | ClassValue[];

/**
 * Merge class names (simplified version of clsx + tailwind-merge)
 */
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat()
    .filter((x) => typeof x === "string")
    .join(" ")
    .trim();
}
