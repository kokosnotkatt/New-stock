import { AppProvider } from './Context/AppContext';
import ErrorBoundary from "./component/common/ErrorBoundary";
import MainLayout from "./component/layout/MainLayout";

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;