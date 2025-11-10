// component/layout/Navigation.jsx - WITH Translation
import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';

const Navigation = () => {
  const location = useLocation();
  const { setActiveTab } = useApp();
  const { t } = useLanguage();

  const navigationItems = [
    { name: t('nav.home'), path: '/', tab: 'Home' },
    { name: t('nav.search'), path: '/search', tab: 'Search' },
    { name: t('nav.watchlist'), path: '/watchlist', tab: 'Watchlist' }
  ];

  // ✅ Sync Context activeTab กับ current route
  useEffect(() => {
    const currentItem = navigationItems.find(item => {
      if (item.path === '/' && location.pathname === '/') return true;
      if (item.path !== '/' && location.pathname.startsWith(item.path)) return true;
      return false;
    });
    
    if (currentItem) {
      setActiveTab(currentItem.tab);
    }
  }, [location.pathname, setActiveTab]);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-gray-200 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-8 h-12">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center font-medium border-b-2 transition-colors duration-200 ${
                    isActive
                      ? 'text-green-600 border-green-600'
                      : 'text-gray-600 hover:text-green-600 border-transparent hover:border-green-600'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-2">
          <div className="flex justify-around h-12">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-center font-medium text-sm border-b-2 transition-colors duration-200 px-3 flex-1 ${
                    isActive
                      ? 'text-green-600 border-green-600'
                      : 'text-gray-600 hover:text-green-600 border-transparent hover:border-green-600'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;