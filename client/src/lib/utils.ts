// Simple utility functions for Material-UI

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Simple className helper (replacement for clsx)
export const cn = classNames;

// Format date helper
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString();
}

// Format time helper
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}
