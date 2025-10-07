import { useState } from 'react';
import { Menu, X, Search } from 'lucide-react';
import { useApp } from "../../Context/AppContext";
import SearchBar from "./SearchBar";
import LoginPage from "../../pages/LoginPage";
import SignupPage from "../../pages/SignupPage";

const Header = () => {
  const { setActiveTab } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const handleSignIn = () => {
    setShowLogin(true);
    setMobileMenuOpen(false);
  };

  const handleSignUp = () => {
    setShowSignup(true);
    setMobileMenuOpen(false);
  };

  const switchToSignup = () => {
    setShowLogin(false);
    setShowSignup(true);
  };

  const switchToLogin = () => {
    setShowSignup(false);
    setShowLogin(true);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <h1 
                className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => setActiveTab('Home')}
              >
                LOGO
              </h1>
            </div>

            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <SearchBar className="w-full" />
            </div>

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

            <div className="flex md:hidden items-center space-x-2">
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

          {mobileSearchOpen && (
            <div className="md:hidden pb-4">
              <SearchBar />
            </div>
          )}
        </div>

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

     
      {showLogin && (
        <LoginPage 
          onClose={() => setShowLogin(false)}
          onSwitchToSignup={switchToSignup}
        />
      )}

     
      {showSignup && (
        <SignupPage 
          onClose={() => setShowSignup(false)}
          onSwitchToLogin={switchToLogin}
        />
      )}
    </>
  );
};

export default Header;