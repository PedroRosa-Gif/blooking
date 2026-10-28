import { useI18n } from '@/i18n/I18nProvider';
import { BrandMark } from '@/components/ui/BrandMark';
import { ArrowUpIcon, GithubIcon } from '@/components/ui/Icon';
import { Tag } from '@/components/ui/Tag';
import { SHELF_DEFS } from '@/lib/shelves';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

const REPO = 'https://github.com/PedroRosa-Gif/blooking';
const DATASET = 'https://www.kaggle.com/datasets/pooriamst/best-books-ever-dataset';

const linkClass = 'text-body-sm text-fg-muted transition-colors hover:text-fg';

interface FooterLink {
  key: string;
  href?: string; // omitted = not built yet
  external?: boolean;
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  const { t } = useI18n();
  return (
    <div>
      <h4 className="font-mono text-caption uppercase tracking-wider text-fg-subtle">{title}</h4>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.key}>
            {l.href ? (
              <a
                href={l.href}
                className={linkClass}
                {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {t(l.key)}
              </a>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex items-center gap-2 text-body-sm text-fg-subtle"
              >
                {t(l.key)}
                <Tag>{t('common.soon')}</Tag>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const { t } = useI18n();

  const explore: FooterLink[] = [
    { key: 'nav.genres', href: '/#genres' },
    { key: 'nav.how', href: '/#how' },
    { key: 'nav.why', href: '/#why' },
  ];
  const product: FooterLink[] = [
    { key: 'footer.link.search' },
    { key: 'footer.link.recommendations' },
    { key: 'footer.link.favorites' },
  ];
  const genres: FooterLink[] = SHELF_DEFS.map((s) => ({
    key: `shelf.${s.id}.title`,
    href: `/#shelf-${s.id}`,
  }));
  const project: FooterLink[] = [
    { key: 'footer.link.github', href: REPO, external: true },
    {
      key: 'footer.link.architecture',
      href: `${REPO}/blob/main/docs/architecture.md`,
      external: true,
    },
    { key: 'footer.link.api', href: `${REPO}/blob/main/apps/backend/README.md`, external: true },
    { key: 'footer.link.dataset', href: DATASET, external: true },
  ];

  return (
    <footer className="relative border-t border-line bg-nav">
      <div className="mx-auto w-full max-w-[1200px] px-6 pb-8 pt-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <BrandMark label={t('nav.brand')} />
            <p className="mt-4 text-body-sm text-fg-muted">{t('footer.tagline')}</p>
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="mt-6 inline-flex size-9 items-center justify-center rounded-full border border-line text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              <GithubIcon />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4 lg:col-span-4">
            <FooterColumn title={t('footer.col.explore')} links={explore} />
            <FooterColumn title={t('footer.col.product')} links={product} />
            <FooterColumn title={t('footer.col.genres')} links={genres} />
            <FooterColumn title={t('footer.col.project')} links={project} />
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1 text-caption text-fg-subtle">
            <p>{t('footer.rights', { year: new Date().getFullYear() })}</p>
            <p>{t('footer.data')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-4 text-body-sm font-medium text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              {t('footer.top')}
              <ArrowUpIcon />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
