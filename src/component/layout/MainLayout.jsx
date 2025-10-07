import { useApp } from "../../Context/AppContext";
import Header from "./Header";
import Navigation from "./Navigation";
import HomePage from "../../pages/HomePage";
import SearchPage from "../../pages/SearchPage";
import WatchlistPage from "../../pages/WatchlistPage";

const MainLayout = () => {
  const { activeTab } = useApp();

  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return <HomePage />;
      case 'Search':
        return <SearchPage />;
      case 'Watchlist':
        return <WatchlistPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <Navigation />
      {renderContent()}
    </div>
  );
};

export default MainLayout;