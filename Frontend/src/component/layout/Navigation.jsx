import { useApp } from "../../context/AppContext";

const Navigation = () => {
  const { activeTab, setActiveTab } = useApp();

  const navigationItems = [
    { name: 'Home', href: '#' },
    { name: 'Search', href: '#' },
    { name: 'Watchlist', href: '#' }
  ];

  return (
    <>
      <nav className="hidden md:block bg-gray-200 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-8 h-12">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`flex items-center font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === item.name
                    ? 'text-green-600 border-green-600' 
                    : 'text-gray-600 hover:text-green-600 border-transparent hover:border-green-600' 
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <nav className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-2">
          <div className="flex justify-around h-12">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`flex items-center justify-center font-medium text-sm border-b-2 transition-colors duration-200 px-3 flex-1 ${
                  activeTab === item.name
                    ? 'text-green-600 border-green-600' 
                    : 'text-gray-600 hover:text-green-600 border-transparent hover:border-green-600' 
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;