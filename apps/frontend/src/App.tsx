import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScrollManager } from '@/components/layout/ScrollManager';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { HomePage } from '@/pages/HomePage';
import { CatalogPage } from '@/pages/CatalogPage';
import { SearchPage } from '@/pages/SearchPage';
import { BookDetailPage } from '@/pages/BookDetailPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { RecommendationsPage } from '@/pages/RecommendationsPage';
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recommendations"
          element={
            <ProtectedRoute>
              <RecommendationsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppLayout>
  );
}
