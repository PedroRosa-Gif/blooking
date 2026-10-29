import { Link } from 'react-router-dom';
import { Section } from '@/components/layout/Section';
import { buttonClasses } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <Section tone="sky" className="py-32">
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="font-mono text-title text-accent">404</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.045em] sm:text-6xl">
          This page flew off into the night.
        </h1>
        <p className="mt-4 text-lead text-fg-muted">The page you’re looking for doesn’t exist.</p>
        <Link to="/" className={buttonClasses({ size: 'lg', className: 'mt-8' })}>
          Back home
        </Link>
      </div>
    </Section>
  );
}
