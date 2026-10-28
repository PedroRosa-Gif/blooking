import { LogoMark } from './LogoMark';

/** Mark + wordmark lockup. The wordmark is Geist semibold, tight tracking. */
export function BrandMark({ label = 'Blooking' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-fg">
      <LogoMark size={28} />
      <span className="text-lead font-semibold leading-none tracking-[-0.03em]">{label}</span>
    </span>
  );
}
