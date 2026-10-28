/** The 8–12px rainbow square brand swatch + "Blooking" wordmark. */
export function BrandMark({ label = 'Blooking' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-[var(--spacing-8)]">
      <span
        aria-hidden
        className="brand-swatch inline-block h-[18px] w-[18px] rounded-[6px]"
      />
      <span className="font-[var(--font-basier-circle)] text-[var(--text-subheading)] font-semibold text-[var(--color-portrait-ink)]">
        {label}
      </span>
    </span>
  );
}
