import { useTheme } from '@/theme/ThemeProvider';
import { useI18n } from '@/i18n/I18nProvider';
import { MoonIcon, SunIcon } from '@/components/ui/Icon';

/** 36px round toggle. The icon shows the theme you will switch to. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const isDark = theme === 'dark';
  const label = isDark ? t('theme.toLight') : t('theme.toDark');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="inline-flex size-9 items-center justify-center rounded-full border border-line text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
