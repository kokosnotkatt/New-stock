// component/layout/Header.jsx - No Authentication
import { useState } from 'react';
import { Menu, X, Search } from 'lucide-react';
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import SearchBar from "./SearchBar";
import LanguageToggle from "../common/LanguageToggle";

const Header = () => {
  const { setActiveTab } = useApp();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <>
      <header className="bg-gray-200 shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 
                className="text-xl font-bold text-gray-900 cursor-pointer hover:text-green-600 transition-colors"
                onClick={() => setActiveTab('Home')}
              >
                LOGO
              </h1>
            </div>

            {/* Desktop Actions - เหลือแค่ Language Toggle */}
            <div className="hidden md:flex items-center space-x-4">
              <LanguageToggle />
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center space-x-2">
              <LanguageToggle />
              
              <button
                onClick={() => {
                  setMobileSearchOpen(!mobileSearchOpen);
                  setMobileMenuOpen(false);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle search"
              >
                <Search className="w-6 h-6 text-gray-600" />
              </button>
              
              <button
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  setMobileSearchOpen(false);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
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

        {/* Mobile Menu - ลบส่วน Sign In/Up */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3">
              <p className="text-sm text-gray-600 text-center">
                {t('header.welcome') || 'Welcome to News App'}
              </p>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;