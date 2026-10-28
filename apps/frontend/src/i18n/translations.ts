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
  'nav.announcement': 'Hybrid semantic + keyword search',
  'nav.home': 'Home',
  'nav.login': 'Login',
  'nav.signup': 'Sign up',
  'nav.language': 'Language',
  'theme.toDark': 'Switch to dark mode',
  'theme.toLight': 'Switch to light mode',

  'hero.eyebrow': 'A night owl for readers',
  'hero.title.pre': 'Find the book you’ll read',
  'hero.title.accent': 'all night',
  'hero.title.post': 'long.',
  'hero.subtitle':
    'Blooking blends semantic and keyword search over thousands of books, then recommends titles tuned to your taste.',
  'hero.search.placeholder': 'Search by title, author, mood or idea…',
  'hero.search.button': 'Search',
  'hero.search.hint': 'Try “young wizard at a magic school” or “distopia jovens”.',

  'hero.scroll': 'Scroll to explore',

  'how.eyebrow': 'How it works',
  'how.title': 'Three steps to your next favorite',
  'how.step1.title': 'Search in your words',
  'how.step1.body':
    'Type a title, an author, or just a feeling. Hybrid search reads meaning and keywords alike — in English or Portuguese.',
  'how.step2.title': 'Discover the details',
  'how.step2.body':
    'Open any book for its synopsis, genres, ratings and more — everything you need to decide what to read next.',
  'how.step3.title': 'Build your shelf',
  'how.step3.body':
    'Favorite the books you love. Blooking learns your taste and recommends titles that fit it.',

  'feature.eyebrow': 'Why Blooking',
  'feature.title': 'Search that understands, not just matches',
  'feature.body':
    'Most catalogs only match the words you type. Blooking also reads meaning with semantic search, then fuses both rankings so the right book surfaces — even when you don’t know its title.',
  'feature.point1': 'Semantic + keyword, fused with Reciprocal Rank Fusion',
  'feature.point2': 'Multilingual — ask in English or Portuguese',
  'feature.point3': 'Personalized recommendations from your favorites',

  'section.popular.title': 'Popular on Blooking',
  'section.popular.subtitle': 'A handful of favorites to get you started.',

  'cta.title': 'Your reading nights, organized',
  'cta.body': 'Create a free account to save favorites and unlock recommendations.',
  'cta.button': 'Create your account',
  'cta.secondary': 'Already have one? Log in',

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
  'theme.toDark': 'Mudar para o modo escuro',
  'theme.toLight': 'Mudar para o modo claro',

  'hero.eyebrow': 'Uma coruja para leitores',
  'hero.title.pre': 'Encontre o livro que você vai ler a',
  'hero.title.accent': 'noite inteira',
  'hero.title.post': '.',
  'hero.subtitle':
    'O Blooking combina busca semântica e por palavra-chave em milhares de livros e recomenda títulos no seu gosto.',
  'hero.search.placeholder': 'Busque por título, autor, clima ou ideia…',
  'hero.search.button': 'Buscar',
  'hero.search.hint': 'Tente “jovem bruxo numa escola de magia” ou “dystopian teens”.',

  'hero.scroll': 'Role para explorar',

  'how.eyebrow': 'Como funciona',
  'how.title': 'Três passos até sua próxima leitura',
  'how.step1.title': 'Busque com suas palavras',
  'how.step1.body':
    'Digite um título, um autor ou só uma sensação. A busca híbrida entende significado e palavras-chave — em português ou inglês.',
  'how.step2.title': 'Descubra os detalhes',
  'how.step2.body':
    'Abra qualquer livro para ver sinopse, gêneros, avaliações e mais — tudo para decidir o que ler a seguir.',
  'how.step3.title': 'Monte sua estante',
  'how.step3.body':
    'Favorite os livros que você ama. O Blooking aprende seu gosto e recomenda títulos com a sua cara.',

  'feature.eyebrow': 'Por que Blooking',
  'feature.title': 'Uma busca que entende, não só compara',
  'feature.body':
    'A maioria dos catálogos só casa as palavras que você digita. O Blooking também lê o significado com busca semântica e funde os dois rankings para o livro certo aparecer — mesmo sem saber o título.',
  'feature.point1': 'Semântica + palavra-chave, fundidas com Reciprocal Rank Fusion',
  'feature.point2': 'Multilíngue — pergunte em português ou inglês',
  'feature.point3': 'Recomendações personalizadas a partir dos seus favoritos',

  'section.popular.title': 'Populares no Blooking',
  'section.popular.subtitle': 'Alguns favoritos para você começar.',

  'cta.title': 'Suas noites de leitura, organizadas',
  'cta.body': 'Crie uma conta gratuita para salvar favoritos e liberar recomendações.',
  'cta.button': 'Criar sua conta',
  'cta.secondary': 'Já tem conta? Entrar',

  'card.ratings': '{count} avaliações',
  'card.unrated': 'Sem avaliações',

  'footer.tagline': 'Feito para leitores — busca híbrida e recomendações personalizadas.',
  'footer.note': 'Exibindo dados de exemplo — conecte o backend para ver o catálogo completo.',
};

export const translations: Record<Language, Dict> = { en, pt };
