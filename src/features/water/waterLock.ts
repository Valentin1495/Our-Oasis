export function isWaterActionLocked({
  isLoggingWater,
  isVisualFeedbackPlaying,
}: {
  isLoggingWater: boolean;
  isVisualFeedbackPlaying: boolean;
}): boolean {
  return isLoggingWater || isVisualFeedbackPlaying;
}
