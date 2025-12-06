export const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const calculateProgress = (currentTime: number, duration: number): number => {
  if (duration === 0 || isNaN(duration) || isNaN(currentTime)) return 0;
  return Math.max(0, Math.min(100, (currentTime / duration) * 100));
};

export const clampTime = (time: number, duration: number): number => {
  return Math.max(0, Math.min(time, duration));
};