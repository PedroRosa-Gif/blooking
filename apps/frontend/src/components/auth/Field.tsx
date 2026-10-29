import { useId, useState, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** Resolved error message (already translated), or null. */
  error?: string | null;
  hint?: string;
}

/** Labelled input with inline error + optional show/hide for passwords. */
export function Field({ label, error, hint, type, className, ...rest }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && reveal ? 'text' : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-body-sm font-medium text-fg">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(error ? errorId : null, hint ? hintId : null) || undefined}
          className={cn(
            'h-11 w-full rounded-2xl border bg-card px-4 text-body text-fg placeholder:text-fg-subtle focus:outline-none',
            isPassword && 'pr-16',
            error ? 'border-danger/60 focus:border-danger' : 'border-line focus:border-fg/50',
            className,
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-caption font-medium text-fg-muted transition-colors hover:text-fg"
            tabIndex={-1}
          >
            {reveal ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={hintId} className="text-caption text-fg-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
