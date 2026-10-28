import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-[var(--spacing-24)] py-[var(--spacing-128)] text-center">
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
  );
}
