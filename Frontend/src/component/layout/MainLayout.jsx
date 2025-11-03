// component/layout/MainLayout.jsx - Optimized with lazy loading
import { lazy, Suspense, useMemo } from 'react';
import { useApp } from "../../context/AppContext";
import Header from "./Header";
import Navigation from "./Navigation";
import { LoadingSpinner } from "../common/Loading";

// Lazy load pages to split code
const HomePage = lazy(() => import('../../pages/HomePage'));
const SearchPage = lazy(() => import('../../pages/SearchPage'));
const WatchlistPage = lazy(() => import('../../pages/WatchlistPage'));

const MainLayout = () => {
  const { activeTab } = useApp();

  // Memoize page component to prevent unnecessary re-renders
  const PageComponent = useMemo(() => {
    switch (activeTab) {
      case 'Home':
        return HomePage;
      case 'Search':
        return SearchPage;
      case 'Watchlist':
        return WatchlistPage;
      default:
        return HomePage;
    }
  }, [activeTab]);

  return (
    <div className="bg-gray-200 min-h-screen">
      <Header />
      <Navigation />
      <Suspense 
        fallback={
          <div className="flex justify-center items-center min-h-[60vh]">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <PageComponent />
      </Suspense>
    </div>
  );
};

export default MainLayout;