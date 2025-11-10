// App.jsx - WITH LanguageProvider
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import ErrorBoundary from "./component/common/ErrorBoundary";
import MainLayout from './component/layout/MainLayout';
import { LoadingSpinner } from './component/common/Loading';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const NewsDetailPage = lazy(() => import('./pages/NewsDetailPage'));

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AppProvider>
          <BrowserRouter>
            <Suspense 
              fallback={
                <div className="flex justify-center items-center min-h-screen bg-gray-200">
                  <LoadingSpinner size="lg" />
                </div>
              }
            >
              <Routes>
                {/* Routes with Layout (Header + Nav) */}
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="search" element={<SearchPage />} />
                  <Route path="watchlist" element={<WatchlistPage />} />
                </Route>
                
                {/* News Detail - Full Screen (No Layout) */}
                <Route path="/news/:newsId" element={<NewsDetailPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AppProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;