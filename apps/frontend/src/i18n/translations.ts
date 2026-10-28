/**
 * Lightweight, dependency-free i18n for Blooking (English default, Portuguese).
 * Keys are flat dotted strings. A missing key falls back to English, then to
 * the raw key, so adding strings never crashes the UI.
 */

export const LANGUAGES = ['en', 'pt'] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  pt: 'PT',
};

type Dict = Record<string, string>;

const en: Dict = {
  'common.soon': 'Soon',
  'a11y.skip': 'Skip to content',

  'nav.brand': 'Blooking',
  'nav.home': 'Blooking home',
  'nav.primary': 'Primary',
  'nav.genres': 'Genres',
  'nav.how': 'How it works',
  'nav.why': 'Why Blooking',
  'nav.login': 'Log in',
  'nav.signup': 'Sign up',
  'nav.language': 'Language',
  'nav.openMenu': 'Open menu',
  'nav.closeMenu': 'Close menu',
  'theme.toDark': 'Switch to dark mode',
  'theme.toLight': 'Switch to light mode',

  'announce.text': 'Hybrid semantic + keyword search is here.',
  'announce.link': 'See how it works',

  'hero.eyebrow': 'A night owl for readers',
  'hero.title.pre': 'Find the book you’ll read',
  'hero.title.accent': 'all night',
  'hero.title.post': 'long.',
  'hero.subtitle':
    'Blooking blends semantic and keyword search over thousands of books, then recommends titles tuned to your taste.',
  'hero.search.placeholder': 'Search by title, author, mood or idea…',
  'hero.search.button': 'Search',
  'hero.search.try': 'Try',
  'hero.chip1': 'young wizard at a magic school',
  'hero.chip2': 'dystopian teens',
  'hero.chip3': 'romance in regency England',

  'stats.books.value': '~3,000',
  'stats.books.label': 'Books in the catalog',
  'stats.lang.value': 'EN · PT',
  'stats.lang.label': 'Ask in either language',
  'stats.dim.value': '1024-d',
  'stats.dim.label': 'Semantic embeddings (bge-m3)',
  'stats.rrf.value': 'RRF',
  'stats.rrf.label': 'Keyword and semantic ranks fused',

  'shelves.eyebrow': 'Browse by genre',
  'shelves.title': 'A shelf for every mood',
  'shelves.subtitle': 'A first look at the catalog, grouped by genre.',
  'shelf.count': '{count} titles',
  'shelf.prev': 'Scroll shelf left',
  'shelf.next': 'Scroll shelf right',
  'shelf.fantasy.title': 'Fantasy',
  'shelf.fantasy.subtitle': 'Magic, quests and other worlds.',
  'shelf.classics.title': 'Classics',
  'shelf.classics.subtitle': 'Books that have outlived their century.',
  'shelf.romance.title': 'Romance',
  'shelf.romance.subtitle': 'Slow burns and star-crossed hearts.',
  'shelf.historical.title': 'Historical Fiction',
  'shelf.historical.subtitle': 'Stories set in times that shaped us.',
  'shelf.scifi.title': 'Sci-Fi & Dystopia',
  'shelf.scifi.subtitle': 'Futures worth worrying about, and laughing at.',

  'how.eyebrow': 'How it works',
  'how.title': 'Three steps to your next favorite',
  'how.step1.title': 'Search in your words',
  'how.step1.body':
    'Type a title, an author, or just a feeling. Hybrid search reads meaning and keywords alike, in English or Portuguese.',
  'how.step2.title': 'Discover the details',
  'how.step2.body':
    'Open any book for its synopsis, genres, ratings and more, everything you need to decide what to read next.',
  'how.step3.title': 'Build your shelf',
  'how.step3.body':
    'Favorite the books you love. Blooking learns your taste and recommends titles that fit it.',

  'why.eyebrow': 'Why Blooking',
  'why.title': 'Search that understands, not just matches',
  'why.tile1.title': 'Two searches, one answer',
  'why.tile1.body':
    'Keyword search finds the exact words. Semantic search finds the meaning. Reciprocal Rank Fusion merges both rankings so the right book rises, even when you don’t know its title.',
  'why.tile1.query': 'young wizard at a magic school',
  'why.tile2.title': 'Speaks your language',
  'why.tile2.body': 'Ask in English or Portuguese over the same catalog. No translation step.',
  'why.tile3.title': 'Learns your taste',
  'why.tile3.body':
    'Every favorite sharpens your recommendations, and new readers start with the most popular titles.',
  'why.tile4.title': 'Runs where you do',
  'why.tile4.body': 'One command starts the database, the message broker and the embedding model.',

  'cta.title': 'Your reading nights, organized',
  'cta.body': 'Create a free account to save favorites and unlock recommendations.',
  'cta.button': 'Create your account',
  'cta.secondary': 'Already have one? Log in',

  'card.ratings': '{count} ratings',
  'card.unrated': 'Not yet rated',

  'footer.tagline':
    'A night owl for readers. Hybrid search and personalized recommendations for your next book.',
  'footer.col.explore': 'Explore',
  'footer.col.product': 'Product',
  'footer.col.genres': 'Genres',
  'footer.col.project': 'Project',
  'footer.link.search': 'Search',
  'footer.link.recommendations': 'Recommendations',
  'footer.link.favorites': 'Favorites',
  'footer.link.github': 'GitHub',
  'footer.link.architecture': 'Architecture',
  'footer.link.api': 'API reference',
  'footer.link.dataset': 'Dataset',
  'footer.rights': '© {year} Blooking.',
  'footer.data': 'Book data from the Best Books Ever dataset on Kaggle.',
  'footer.top': 'Back to top',
};

const pt: Dict = {
  'common.soon': 'Em breve',
  'a11y.skip': 'Pular para o conteúdo',

  'nav.brand': 'Blooking',
  'nav.home': 'Início do Blooking',
  'nav.primary': 'Principal',
  'nav.genres': 'Gêneros',
  'nav.how': 'Como funciona',
  'nav.why': 'Por que Blooking',
  'nav.login': 'Entrar',
  'nav.signup': 'Criar conta',
  'nav.language': 'Idioma',
  'nav.openMenu': 'Abrir menu',
  'nav.closeMenu': 'Fechar menu',
  'theme.toDark': 'Mudar para o modo escuro',
  'theme.toLight': 'Mudar para o modo claro',

  'announce.text': 'Busca híbrida semântica + por palavra-chave chegou.',
  'announce.link': 'Veja como funciona',

  'hero.eyebrow': 'Uma coruja para leitores',
  'hero.title.pre': 'Encontre o livro que você vai ler a',
  'hero.title.accent': 'noite inteira',
  'hero.title.post': '.',
  'hero.subtitle':
    'O Blooking combina busca semântica e por palavra-chave em milhares de livros e recomenda títulos no seu gosto.',
  'hero.search.placeholder': 'Busque por título, autor, clima ou ideia…',
  'hero.search.button': 'Buscar',
  'hero.search.try': 'Experimente',
  'hero.chip1': 'jovem bruxo numa escola de magia',
  'hero.chip2': 'distopia jovens',
  'hero.chip3': 'romance na Inglaterra da Regência',

  'stats.books.value': '~3.000',
  'stats.books.label': 'Livros no catálogo',
  'stats.lang.value': 'EN · PT',
  'stats.lang.label': 'Pergunte em qualquer idioma',
  'stats.dim.value': '1024-d',
  'stats.dim.label': 'Embeddings semânticos (bge-m3)',
  'stats.rrf.value': 'RRF',
  'stats.rrf.label': 'Rankings por palavra e significado fundidos',

  'shelves.eyebrow': 'Explore por gênero',
  'shelves.title': 'Uma prateleira para cada clima',
  'shelves.subtitle': 'Um primeiro olhar no catálogo, agrupado por gênero.',
  'shelf.count': '{count} títulos',
  'shelf.prev': 'Rolar prateleira para a esquerda',
  'shelf.next': 'Rolar prateleira para a direita',
  'shelf.fantasy.title': 'Fantasia',
  'shelf.fantasy.subtitle': 'Magia, jornadas e outros mundos.',
  'shelf.classics.title': 'Clássicos',
  'shelf.classics.subtitle': 'Livros que sobreviveram ao seu século.',
  'shelf.romance.title': 'Romance',
  'shelf.romance.subtitle': 'Paixões lentas e corações improváveis.',
  'shelf.historical.title': 'Ficção Histórica',
  'shelf.historical.subtitle': 'Histórias de épocas que nos moldaram.',
  'shelf.scifi.title': 'Ficção Científica e Distopia',
  'shelf.scifi.subtitle': 'Futuros para temer, e para rir.',

  'how.eyebrow': 'Como funciona',
  'how.title': 'Três passos até sua próxima leitura',
  'how.step1.title': 'Busque com suas palavras',
  'how.step1.body':
    'Digite um título, um autor ou só uma sensação. A busca híbrida entende significado e palavras-chave, em português ou inglês.',
  'how.step2.title': 'Descubra os detalhes',
  'how.step2.body':
    'Abra qualquer livro para ver sinopse, gêneros, avaliações e mais, tudo para decidir o que ler a seguir.',
  'how.step3.title': 'Monte sua estante',
  'how.step3.body':
    'Favorite os livros que você ama. O Blooking aprende seu gosto e recomenda títulos com a sua cara.',

  'why.eyebrow': 'Por que Blooking',
  'why.title': 'Uma busca que entende, não só compara',
  'why.tile1.title': 'Duas buscas, uma resposta',
  'why.tile1.body':
    'A busca por palavra-chave acha as palavras exatas. A semântica acha o significado. O Reciprocal Rank Fusion funde os dois rankings para o livro certo subir, mesmo sem você saber o título.',
  'why.tile1.query': 'jovem bruxo numa escola de magia',
  'why.tile2.title': 'Fala a sua língua',
  'why.tile2.body':
    'Pergunte em português ou inglês sobre o mesmo catálogo. Sem etapa de tradução.',
  'why.tile3.title': 'Aprende seu gosto',
  'why.tile3.body':
    'Cada favorito afina suas recomendações, e quem está começando vê primeiro os títulos mais populares.',
  'why.tile4.title': 'Roda onde você roda',
  'why.tile4.body':
    'Um comando sobe o banco de dados, o broker de mensagens e o modelo de embeddings.',

  'cta.title': 'Suas noites de leitura, organizadas',
  'cta.body': 'Crie uma conta gratuita para salvar favoritos e liberar recomendações.',
  'cta.button': 'Criar sua conta',
  'cta.secondary': 'Já tem conta? Entrar',

  'card.ratings': '{count} avaliações',
  'card.unrated': 'Sem avaliações',

  'footer.tagline':
    'Uma coruja para leitores. Busca híbrida e recomendações personalizadas para o seu próximo livro.',
  'footer.col.explore': 'Explorar',
  'footer.col.product': 'Produto',
  'footer.col.genres': 'Gêneros',
  'footer.col.project': 'Projeto',
  'footer.link.search': 'Busca',
  'footer.link.recommendations': 'Recomendações',
  'footer.link.favorites': 'Favoritos',
  'footer.link.github': 'GitHub',
  'footer.link.architecture': 'Arquitetura',
  'footer.link.api': 'Referência da API',
  'footer.link.dataset': 'Dataset',
  'footer.rights': '© {year} Blooking.',
  'footer.data': 'Dados de livros do dataset Best Books Ever, no Kaggle.',
  'footer.top': 'Voltar ao topo',
};

export const translations: Record<Language, Dict> = { en, pt };
