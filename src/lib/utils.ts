import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * @fileoverview Utility functions for the application.
 * 
 * This module provides general-purpose utility functions used throughout
 * the application, including Tailwind CSS class name management.
 * 
 * @module lib/utils
 */

/**
 * Combines and merges Tailwind CSS class names intelligently.
 * 
 * This utility function combines multiple class names using `clsx` and then
 * merges them using `tailwind-merge` to resolve conflicts. This is particularly
 * useful when you need to conditionally apply classes or override Tailwind
 * classes in component props.
 * 
 * @param inputs - Variable number of class values (strings, objects, arrays)
 * @returns A single merged class name string
 * 
 * @example
 * ```typescript
 * import { cn } from '@/lib/utils';
 * 
 * // Basic usage
 * cn('px-4 py-2', 'bg-blue-500');
 * // => 'px-4 py-2 bg-blue-500'
 * 
 * // Conditional classes
 * cn('text-base', isLarge && 'text-lg', isError && 'text-red-500');
 * // => 'text-base text-lg' (if isLarge=true, isError=false)
 * 
 * // Overriding conflicting Tailwind classes
 * cn('px-4 py-2', 'px-6'); // Later px-6 wins
 * // => 'py-2 px-6'
 * 
 * // With objects
 * cn('base-class', {
 *   'active-class': isActive,
 *   'disabled-class': isDisabled
 * });
 * 
 * // Complex example in a component
 * function Button({ className, variant, size }) {
 *   return (
 *     <button
 *       className={cn(
 *         'rounded font-medium transition-colors',
 *         variant === 'primary' && 'bg-blue-500 text-white',
 *         variant === 'secondary' && 'bg-gray-200 text-gray-900',
 *         size === 'sm' && 'px-3 py-1 text-sm',
 *         size === 'lg' && 'px-6 py-3 text-lg',
 *         className // Allow prop overrides
 *       )}
 *     />
 *   );
 * }
 * ```
 * 
 * @remarks
 * - Uses `clsx` for combining class names with conditional logic
 * - Uses `tailwind-merge` to intelligently resolve Tailwind class conflicts
 * - Later classes override earlier ones when they conflict
 * - Handles strings, objects, arrays, and conditional expressions
 * - Commonly used for component className props that need to be mergeable
 * 
 * @see {@link https://github.com/lukeed/clsx | clsx documentation}
 * @see {@link https://github.com/dcastil/tailwind-merge | tailwind-merge documentation}
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
