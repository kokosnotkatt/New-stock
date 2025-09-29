import { useState } from 'react';
import { Search } from 'lucide-react';

const SearchPage = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const stockData = [
    { symbol: 'CPALL', name: 'CP ALL', sector: 'Retail', price: '221.10', change: '+3.25%', positive: true },
    { symbol: 'PTT', name: 'PTT Public Company', sector: 'Energy', price: '38.50', change: '-1.15%', positive: false },
    { symbol: 'KBANK', name: 'Kasikornbank', sector: 'Banking', price: '152.00', change: '+2.10%', positive: true },
    { symbol: 'AOT', name: 'Airports of Thailand', sector: 'Transportation', price: '68.25', change: '+4.50%', positive: true },
    { symbol: 'SCB', name: 'Siam Commercial Bank', sector: 'Banking', price: '125.50', change: '+1.80%', positive: true },
    { symbol: 'ADVANC', name: 'Advanced Info Service', sector: 'Telecommunication', price: '189.00', change: '-0.50%', positive: false },
    { symbol: 'TRUE', name: 'True Corporation', sector: 'Telecommunication', price: '4.82', change: '+2.55%', positive: true },
    { symbol: 'BBL', name: 'Bangkok Bank', sector: 'Banking', price: '145.00', change: '-0.68%', positive: false },
    { symbol: 'GULF', name: 'Gulf Energy Development', sector: 'Energy', price: '42.75', change: '+1.19%', positive: true },
    { symbol: 'TOP', name: 'Thai Oil', sector: 'Energy', price: '55.25', change: '+0.91%', positive: true }
  ];

  const handleLocalSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    setTimeout(() => {
      const filtered = stockData.filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase()) ||
        stock.sector.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      setIsSearching(false);
    }, 300);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Search Stocks</h2>
      
      {/* Search Input */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search by symbol, name, or sector..."
            onChange={(e) => handleLocalSearch(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 ? (
        <div className="space-y-4">
          <p className="text-gray-600 font-medium">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
          </p>
          {searchResults.map((stock) => (
            <div
              key={stock.symbol}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-300"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{stock.symbol}</h3>
                    <span className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                      {stock.sector}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{stock.name}</p>
                  <p className="text-lg font-semibold text-gray-900">THB {stock.price}</p>
                </div>
                <div className={`text-lg font-bold ${stock.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {stock.positive ? '▲' : '▼'} {stock.change}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isSearching ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Your Search</h3>
          <p className="text-gray-600">Search for stocks by symbol, company name, or sector</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;