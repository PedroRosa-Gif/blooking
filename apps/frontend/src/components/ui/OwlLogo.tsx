/**
 * Blooking brand mark — a stylized owl whose eyes read as spectacles, with the
 * right eye extended into a magnifier handle (search). Single-stroke, rounded
 * caps per the design plans' iconography rules. The eyes glow amber (the brand
 * accent); everything else uses currentColor so it adapts to light/dark.
 */
export function OwlLogo({
  size = 28,
  title = 'Blooking',
  className = '',
}: {
  size?: number;
  title?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <g
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Ear tufts */}
        <path d="M14 13.5c-1.6-2.2-2.2-4.4-2-6.8 2.2 0.8 3.9 2.1 5.1 4.1" />
        <path d="M34 13.5c1.6-2.2 2.2-4.4 2-6.8-2.2 0.8-3.9 2.1-5.1 4.1" />
        {/* Head + body silhouette */}
        <path d="M24 10c-7.2 0-12.5 5.2-12.5 12.4 0 3.1 0.7 5.7 2.2 8.2C15.8 34.3 19.2 38 24 38s8.2-3.7 10.3-7.4c1.5-2.5 2.2-5.1 2.2-8.2C36.5 15.2 31.2 10 24 10Z" />
        {/* Beak */}
        <path d="M24 24.5l-1.6 2.4h3.2L24 24.5Z" fill="currentColor" />
        {/* Brow / spectacle bridge */}
        <path d="M18.4 19.2h11.2" />
      </g>
      {/* Spectacle eyes in amber */}
      <g stroke="var(--accent)" strokeWidth="2" fill="none">
        <circle cx="19" cy="21.5" r="3.4" />
        <circle cx="29" cy="21.5" r="3.4" />
      </g>
      {/* Magnifier handle off the right lens */}
      <path
        d="M31.6 24.1l3.1 3.1"
        stroke="var(--accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Amber pupils / lamp-lit eyes */}
      <circle cx="19" cy="21.5" r="1" fill="var(--accent)" />
      <circle cx="29" cy="21.5" r="1" fill="var(--accent)" />
    </svg>
  );
}
