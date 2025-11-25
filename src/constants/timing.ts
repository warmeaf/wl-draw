/**
 * Timing constants for throttling and debouncing operations
 */

export const TIMING = {
  /**
   * Throttle interval for history snapshot creation
   * Prevents excessive snapshot creation during rapid property updates
   */
  HISTORY_SNAPSHOT_THROTTLE: 500,

  /**
   * Throttle interval for drawing update events
   * Optimized for smooth 60fps updates during drawing operations
   */
  DRAWING_UPDATE_THROTTLE: 16,

  /**
   * Throttle interval for canvas zoom events
   * Optimized for smooth zoom interactions
   */
  CANVAS_ZOOM_THROTTLE: 16,
} as const
