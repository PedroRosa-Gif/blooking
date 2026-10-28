import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-[var(--spacing-24)] py-[var(--spacing-80)] text-center">
      <h1 className="font-[var(--font-basier-circle)] text-[var(--text-heading)] font-semibold tracking-[-1.15px]">
        404
      </h1>
      <p className="text-[var(--text-body-lg)] text-[var(--color-graphite-body)]">
        This page wandered off the shelf.
      </p>
      <Link to="/">
        <Button variant="rainbow">Back home</Button>
      </Link>
    </div>
  );
}
