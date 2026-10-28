import { cn } from '@/lib/cn';

/** Small amber ring spinner. */
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 10)) }}
      className={cn(
        'inline-block animate-spin rounded-full border-line border-t-accent',
        className,
      )}
    />
  );
}
