/**
 * Lightweight, dependency-free i18n for Blooking.
 *
 * Only two languages are planned: English (default) and Portuguese. Keys are
 * flat dotted strings. If a key is missing in the active language it falls back
 * to English, then to the raw key — so adding strings never crashes the UI.
 *
 * This is intentionally minimal; if the string set grows a lot we can swap in a
 * library (react-i18next) behind the same `useI18n()` hook without touching
 * call sites.
 */

export const LANGUAGES = ['en', 'pt'] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  pt: 'PT',
};

type Dict = Record<string, string>;

const en: Dict = {
  'nav.brand': 'Blooking',
  'nav.announcement': 'New — hybrid semantic + keyword search',
  'nav.home': 'Home',
  'nav.login': 'Login',
  'nav.signup': 'Sign up',
  'nav.language': 'Language',

  'hero.eyebrow': 'Discover your next read',
  'hero.title.pre': 'Find the book you’ll',
  'hero.title.accent': 'love',
  'hero.title.post': 'with search that just gets you.',
  'hero.subtitle':
    'Blooking blends semantic and keyword search over thousands of books, then recommends titles tuned to your taste.',
  'hero.search.placeholder': 'Search by title, author, mood or idea…',
  'hero.search.button': 'Search',
  'hero.search.hint': 'Try “young wizard at a magic school” or “distopia jovens”.',

  'section.popular.title': 'Popular on Blooking',
  'section.popular.subtitle': 'A handful of favorites to get you started.',

  'card.ratings': '{count} ratings',
  'card.unrated': 'Not yet rated',

  'footer.tagline': 'Built for readers — hybrid search & personalized recommendations.',
  'footer.note': 'Sample data shown — connect the backend to browse the full catalog.',
};

const pt: Dict = {
  'nav.brand': 'Blooking',
  'nav.announcement': 'Novo — busca híbrida semântica + por palavra-chave',
  'nav.home': 'Início',
  'nav.login': 'Entrar',
  'nav.signup': 'Criar conta',
  'nav.language': 'Idioma',

  'hero.eyebrow': 'Descubra sua próxima leitura',
  'hero.title.pre': 'Encontre o livro que você vai',
  'hero.title.accent': 'amar',
  'hero.title.post': 'com uma busca que entende você.',
  'hero.subtitle':
    'O Blooking combina busca semântica e por palavra-chave em milhares de livros e recomenda títulos no seu gosto.',
  'hero.search.placeholder': 'Busque por título, autor, clima ou ideia…',
  'hero.search.button': 'Buscar',
  'hero.search.hint': 'Tente “jovem bruxo numa escola de magia” ou “dystopian teens”.',

  'section.popular.title': 'Populares no Blooking',
  'section.popular.subtitle': 'Alguns favoritos para você começar.',

  'card.ratings': '{count} avaliações',
  'card.unrated': 'Sem avaliações',

  'footer.tagline': 'Feito para leitores — busca híbrida e recomendações personalizadas.',
  'footer.note': 'Exibindo dados de exemplo — conecte o backend para ver o catálogo completo.',
};

export const translations: Record<Language, Dict> = { en, pt };
