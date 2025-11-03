// App.jsx - Optimized with lazy loading and code splitting
import { lazy, Suspense } from 'react';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from "./component/common/ErrorBoundary";
import { LoadingSpinner } from "./component/common/Loading";

// Lazy load the main layout to reduce initial bundle size
const MainLayout = lazy(() => import('./component/layout/MainLayout'));

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Suspense 
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-200">
              <LoadingSpinner size="lg" />
            </div>
          }
        >
          <MainLayout />
        </Suspense>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;