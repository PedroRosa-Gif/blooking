import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScrollManager } from '@/components/layout/ScrollManager';
import { HomePage } from '@/pages/HomePage';
import { CatalogPage } from '@/pages/CatalogPage';
import { SearchPage } from '@/pages/SearchPage';
import { BookDetailPage } from '@/pages/BookDetailPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export default function App() {
  return (
    <AppLayout>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/books" element={<CatalogPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        {/* Phase 3: /login, /register, /favorites, /recommendations */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppLayout>
  );
}
