import { OwlLogo } from './OwlLogo';

/** Owl-with-magnifier mark + "Blooking" wordmark (serif). */
export function BrandMark({ label = 'Blooking' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-[var(--spacing-8)] text-[var(--text)]">
      <OwlLogo size={28} title={label} />
      <span className="font-[family-name:var(--font-serif)] text-[var(--text-subheading)] font-semibold leading-none">
        {label}
      </span>
    </span>
  );
}
