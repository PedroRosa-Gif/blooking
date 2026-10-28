import { OwlLogo } from './OwlLogo';

/** Owl mark + wordmark. One size, one weight, in the UI sans. */
export function BrandMark({ label = 'Blooking' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-fg">
      <OwlLogo size={28} title={label} />
      <span className="text-lead font-semibold leading-none tracking-tight">{label}</span>
    </span>
  );
}
