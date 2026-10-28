import { Link } from 'react-router-dom';

/** A labelled row of pill chips. Genre chips link into the catalog filter. */
export function ChipRow({
  label,
  items,
  linkGenre = false,
}: {
  label: string;
  items: string[];
  linkGenre?: boolean;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-mono text-caption uppercase tracking-wider text-fg-subtle">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) =>
          linkGenre ? (
            <Link
              key={item}
              to={`/books?genre=${encodeURIComponent(item)}`}
              className="rounded-full border border-line px-3.5 py-1.5 text-body-sm text-fg-muted transition-colors hover:border-accent/40 hover:text-accent"
            >
              {item}
            </Link>
          ) : (
            <span
              key={item}
              className="rounded-full border border-line bg-card px-3.5 py-1.5 text-body-sm text-fg-muted"
            >
              {item}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
