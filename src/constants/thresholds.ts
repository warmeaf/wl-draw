/**
 * Threshold constants for various calculations and comparisons
 */

export const THRESHOLDS = {
  /**
   * Minimum distance threshold for pen tool point updates
   * Points closer than this distance are ignored to reduce noise
   */
  PEN_POINT_MIN_DISTANCE: 0.5,

  /**
   * Minimum position change threshold for detecting object movement
   * Objects moved less than this threshold are considered unchanged
   */
  POSITION_CHANGE_MIN_DELTA: 0.5,
} as const
