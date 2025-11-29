/**
 * Utility functions for stroke-related calculations
 */

export function calculateDashPattern(strokeWidth: number): number[] {
  const dashLength = Math.max(5, strokeWidth * 3)
  const gapLength = Math.max(3, strokeWidth * 2)
  return [dashLength, gapLength]
}
