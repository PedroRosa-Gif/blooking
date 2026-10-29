import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '@/components/ui/BrandMark';

/** Centered card shell shared by the login and register pages. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center py-16">
      <div className="rounded-card border border-line bg-card/70 p-8 shadow-cover backdrop-blur-xl">
        <Link to="/" className="inline-flex" aria-label="Blooking">
          <BrandMark />
        </Link>
        <h1 className="mt-8 text-heading-sm font-semibold tracking-[-0.02em] text-fg">{title}</h1>
        <p className="mt-2 text-body-sm text-fg-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
      <p className="mt-6 text-center text-body-sm text-fg-muted">{footer}</p>
    </div>
  );
}
