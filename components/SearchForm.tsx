
import React from 'react';
import { SearchIcon } from './Icons';

interface SearchFormProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  locationReady: boolean;
  darkMode: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({ query, setQuery, onSearch, isLoading, locationReady, darkMode }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading && locationReady && query.trim()) {
      onSearch();
    }
  };
  
  const isButtonDisabled = isLoading || !locationReady || !query.trim();

  // Theme Styles
  const containerClass = darkMode 
    ? "bg-gray-800/50 border-gray-700 shadow-lg" 
    : "bg-white border-gray-200 shadow-sm";
  
  const inputClass = darkMode
    ? "bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-teal-500 focus:border-teal-500"
    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-teal-500 focus:border-teal-500";

  return (
    <div className={`max-w-2xl mx-auto p-4 rounded-xl border transition-colors duration-300 ${containerClass}`}>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite um tipo de negócio (ex: restaurante)"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition duration-200 ${inputClass}`}
          disabled={isLoading}
        />
        <button
          onClick={onSearch}
          disabled={isButtonDisabled}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-semibold rounded-lg shadow-sm hover:from-teal-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 whitespace-nowrap"
        >
          <SearchIcon className="h-4 w-4" />
          <span>
            {isLoading ? 'Buscando...' : 'Buscar'}
          </span>
        </button>
      </div>
    </div>
  );
};
