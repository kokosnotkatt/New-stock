
import React, { useState } from 'react';
import { Menu, X, Search } from 'lucide-react';
import Content from './Content';
import SearchPage from './SearchPage';
import WatchlistPage from './WatchlistPage';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const navigationItems = [
    { name: 'Home', href: '#' },
    { name: 'Search', href: '#' },
    { name: 'Watchlist', href: '#' }
  ];

  const handleSearch = () => {
    console.log('Searching for:', searchQuery);
  };

  const handleSignIn = () => {
    console.log('Sign In clicked');
  };

  const handleSignUp = () => {
    console.log('Sign Up clicked');
  };

  const SearchBar = ({ className = "" }) => (
    <div className={`relative ${className}`}>
      <input 
        type="text" 
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        className="w-full px-4 py-2 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
      <button 
        onClick={handleSearch}
        className="absolute inset-y-0 right-0 flex items-center pr-3"
      >
        <Search className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
      </button>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return <Content />;
      case 'Search':
        return <SearchPage />;
      case 'Watchlist':
        return <WatchlistPage />;
      default:
        return <Content />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 
                className="text-xl font-bold text-gray-900 cursor-pointer"
                onClick={() => setActiveTab('Home')}
              >
                LOGO
              </h1>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <SearchBar className="w-full" />
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <button 
                onClick={handleSignIn}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-full transition-colors duration-200"
              >
                Sign In
              </button>
              <button 
                onClick={handleSignUp}
                className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 transition-colors duration-200"
              >
                Sign Up
              </button>
            </div>

            {/* Mobile Menu & Search Icons */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                onClick={() => {
                  setMobileSearchOpen(!mobileSearchOpen);
                  setMobileMenuOpen(false);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Search className="w-6 h-6 text-gray-600" />
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  setMobileSearchOpen(false);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-600" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {mobileSearchOpen && (
            <div className="md:hidden pb-4">
              <SearchBar />
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              <button 
                onClick={handleSignIn}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-full transition-colors duration-200"
              >
                Sign In
              </button>
              <button 
                onClick={handleSignUp}
                className="w-full text-gray-600 hover:text-gray-900 font-medium px-6 py-2 border border-gray-300 rounded-full transition-colors duration-200"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-8 h-12">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`flex items-center font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === item.name
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600 border-transparent hover:border-blue-600'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-2">
          <div className="flex justify-around h-12">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setActiveTab(item.name);
                  setMobileMenuOpen(false);
                  setMobileSearchOpen(false);
                }}
                className={`flex items-center justify-center font-medium text-sm border-b-2 transition-colors duration-200 px-3 flex-1 ${
                  activeTab === item.name
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600 border-transparent hover:border-blue-600'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      
      {renderContent()}
    </div>
  );
};

export default Navbar;