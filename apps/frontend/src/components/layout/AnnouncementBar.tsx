import { useI18n } from '@/i18n/I18nProvider';
import { ArrowRightIcon, SparkleIcon } from '@/components/ui/Icon';

/** Quiet one-line strip above the nav (design_v3 "Announcement Strip"). */
export function AnnouncementBar() {
  const { t } = useI18n();

  return (
    <div className="border-b border-line bg-band">
      <div className="mx-auto flex min-h-9 max-w-[1200px] items-center justify-center gap-2 px-6 py-2 text-caption text-fg-muted">
        <SparkleIcon className="shrink-0 text-accent" />
        <span className="truncate">{t('announce.text')}</span>
        <a
          href="/#how"
          className="hidden shrink-0 items-center gap-1 font-medium text-fg transition-colors hover:text-accent sm:inline-flex"
        >
          {t('announce.link')}
          <ArrowRightIcon />
        </a>
      </div>
    </div>
  );
}
