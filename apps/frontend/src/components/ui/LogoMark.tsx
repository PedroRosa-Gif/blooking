import { cn } from '@/lib/cn';

/**
 * Blooking mark: two amber eyes glowing in the dark, looking up and to the
 * right, as if scanning a shelf. Book + looking. The pair also echoes the
 * "oo" in Bl-oo-king.
 *
 * The colors are fixed on purpose (dark tile, amber eyes) so the mark is
 * identical in both themes, like an app icon. Decorative: the wordmark next to
 * it carries the accessible name. Keep in sync with public/favicon.svg.
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="9"
        fill="#05080f"
        stroke="#fff"
        strokeOpacity="0.14"
      />
      <circle cx="10.6" cy="16" r="5.1" fill="#e8b059" />
      <circle cx="21.4" cy="16" r="5.1" fill="#e8b059" />
      <circle cx="11.5" cy="15.1" r="2" fill="#05080f" />
      <circle cx="22.3" cy="15.1" r="2" fill="#05080f" />
    </svg>
  );
}
