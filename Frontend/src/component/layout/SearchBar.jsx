import { Search } from 'lucide-react';
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext"; // 1. Import

const SearchBar = ({ className = "" }) => {
  const { searchQuery, setSearchQuery, setActiveTab, addRecentSearch } = useApp();
  const { t } = useLanguage(); // 2. เรียกใช้

  const handleSearch = () => {
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery);
      setActiveTab('Search');
      console.log('Searching for:', searchQuery);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input 
        type="text" 
        placeholder={t('search.placeholder')} // 3. แก้ไข
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        className="w-full px-4 py-2 pl-4 pr-10 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" // (แก้สี focus)
        aria-label="Search"
      />
      <button 
        onClick={handleSearch}
        className="absolute inset-y-0 right-0 flex items-center pr-3"
        aria-label="Submit search"
      >
        <Search className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
      </button>
    </div>
  );
};

export default SearchBar;