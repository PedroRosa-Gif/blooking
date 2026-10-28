import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/layout/Section';

export function NotFoundPage() {
  return (
    <Section band="sky" className="py-[var(--spacing-128)]">
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-[var(--spacing-24)] text-center">
        <h1 className="font-[family-name:var(--font-serif)] text-[var(--text-display)] font-light leading-none text-[var(--accent)]">
          404
        </h1>
        <p className="text-[var(--text-body-lg)] text-[var(--text-muted)]">
          This page flew off into the night.
        </p>
        <Link to="/">
          <Button variant="accent">Back home</Button>
        </Link>
      </div>
    </Section>
  );
}
