
import React, { useState, useEffect, useCallback } from 'react';
import type { Place, Location, FilterOptions } from './types';
import { findPlaces } from './services/geminiService';
import { SearchForm } from './components/SearchForm';
import { ResultCard } from './components/ResultCard';
import { Loader } from './components/Loader';
import { FilterControls } from './components/FilterControls';
import { MapPinIcon, AlertTriangleIcon, DownloadIcon, ChevronLeftIcon, ChevronRightIcon, SunIcon, MoonIcon } from './components/Icons';

const App: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);
  const [filters, setFilters] = useState<FilterOptions>({
    pageSize: 50,
    city: '',
    state: '',
    radius: 0, 
  });
  
  // Theme State
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError(null);
        setIsLocating(false);
      },
      (geoError) => {
        setError(
          'Acesso à localização negado. Por favor, habilite a permissão de localização no seu navegador para encontrar estabelecimentos próximos.'
        );
        setIsLocating(false);
      }
    );
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleSearch = useCallback(async () => {
    if (isLoading || !query.trim()) return;
    if (!location) {
      setError('A localização é necessária para a busca. Por favor, habilite a permissão.');
      return;
    }

    setIsLoading(true);
    // Mensagem indicando paralelismo
    const batchCount = Math.ceil(filters.pageSize / 50);
    setLoadingMessage(`Iniciando ${batchCount} agentes de busca paralela...`);
    
    setError(null);
    setResults([]);
    setCurrentPage(1); 

    try {
      const places = await findPlaces(
        query, 
        location, 
        filters, 
        (count, total) => {
          // Feedback de progresso
          setLoadingMessage(`Processando setores... Análise de dados em andamento.`);
        }
      );
      setResults(places);
      if (places.length === 0) {
        setError('Nenhum resultado encontrado para os critérios selecionados.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setError(`Falha ao buscar dados: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [query, location, isLoading, filters]);

  const handleExportCSV = useCallback(() => {
    if (results.length === 0) return;

    const headers = ['Nome', 'Telefone', 'Email', 'Instagram', 'Facebook', 'LinkedIn'];
    const csvContent = [
        headers.join(','),
        ...results.map(item => {
            const nome = `"${(item.nome || '').replace(/"/g, '""')}"`;
            const telefone = `"${(item.telefone || '').replace(/"/g, '""')}"`;
            const email = `"${(item.email || '').replace(/"/g, '""')}"`;
            const insta = `"${(item.instagram || '').replace(/"/g, '""')}"`;
            const face = `"${(item.facebook || '').replace(/"/g, '""')}"`;
            const linked = `"${(item.linkedin || '').replace(/"/g, '""')}"`;
            return `${nome},${telefone},${email},${insta},${face},${linked}`;
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_${query.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [results, query]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = results.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(results.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const toggleTheme = () => setDarkMode(!darkMode);

  // Common styles based on theme
  const bgClass = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textClass = darkMode ? "text-gray-200" : "text-gray-900";
  const mutedTextClass = darkMode ? "text-gray-400" : "text-gray-500";
  const buttonBaseClass = darkMode 
    ? "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white" 
    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-sm";

  const renderContent = () => {
    if (isLocating) {
      return (
        <div className={`text-center flex flex-col items-center gap-4 mt-8 ${mutedTextClass}`}>
          <Loader color={darkMode ? "text-teal-400" : "text-teal-600"} />
          <p>Obtendo sua localização...</p>
        </div>
      );
    }
  
    if (isLoading) {
      return (
        <div className={`text-center flex flex-col items-center gap-4 mt-8 ${mutedTextClass}`}>
          <Loader color={darkMode ? "text-teal-400" : "text-teal-600"} />
          <p className={`max-w-md font-medium ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>{loadingMessage}</p>
          <p className="text-sm max-w-sm">
            Nossa IA está cruzando dados de múltiplos setores simultaneamente para acelerar sua prospecção.
          </p>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className={`mt-8 text-center border p-4 rounded-lg max-w-2xl mx-auto flex items-center justify-center gap-3 ${darkMode ? 'bg-red-900/20 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-600'}`}>
          <AlertTriangleIcon className="h-6 w-6 shrink-0" />
          <p>{error}</p>
        </div>
      );
    }
  
    if (results.length > 0) {
      return (
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <p className={mutedTextClass}>
              {`Total de ${results.length} resultado(s) único(s) encontrado(s).`}
            </p>
            <button 
                onClick={handleExportCSV}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm font-medium ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-teal-400 border-gray-600' : 'bg-white hover:bg-gray-50 text-teal-600 border-gray-200 shadow-sm'}`}
            >
                <DownloadIcon className="h-4 w-4" />
                Exportar CSV
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentItems.map((place, index) => (
              <ResultCard key={`${place.nome}-${index}`} data={place} darkMode={darkMode} />
            ))}
          </div>

          {totalPages > 1 && (
             <div className="mt-10 flex justify-center items-center gap-2">
                <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition ${buttonBaseClass}`}
                >
                    <ChevronLeftIcon className="h-5 w-5" />
                </button>
                
                <span className={`text-sm px-4 ${mutedTextClass}`}>
                    Página <span className={`font-medium ${textClass}`}>{currentPage}</span> de {totalPages}
                </span>

                <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition ${buttonBaseClass}`}
                >
                    <ChevronRightIcon className="h-5 w-5" />
                </button>
             </div>
          )}
        </div>
      );
    }
  
    return (
      <div className={`text-center mt-12 flex flex-col items-center gap-4 ${mutedTextClass}`}>
        <MapPinIcon className="h-12 w-12 opacity-50" />
        <h2 className={`text-xl font-semibold ${textClass}`}>O que você busca hoje?</h2>
        <p>Digite o que procura (ex: Barbearia), escolha a quantidade (50, 100, 200) e clique em "Buscar".</p>
      </div>
    );
  };
  

  return (
    <div className={`min-h-screen font-sans p-4 sm:p-6 lg:p-8 transition-colors duration-300 ${bgClass} ${textClass}`}>
      <div className="max-w-7xl mx-auto flex flex-col min-h-screen">
        
        {/* Theme Toggle - Top Right */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-all duration-300 ${darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-md border border-gray-200'}`}
                title={darkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
            >
                {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
        </div>

        <header className="text-center mb-8 flex-none pt-4">
          <h1 className={`text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${darkMode ? 'from-teal-400 to-blue-500' : 'from-teal-600 to-blue-700'} pb-2 leading-relaxed`}>
            Prospector de Negócios
          </h1>
          <p className={`mt-0 text-lg ${mutedTextClass}`}>
            Encontre contatos de negócios locais para seus serviços de marketing.
          </p>
        </header>
        
        <main className="flex-grow">
          <SearchForm 
            query={query} 
            setQuery={setQuery} 
            onSearch={handleSearch}
            isLoading={isLoading || isLocating}
            locationReady={!!location}
            darkMode={darkMode}
          />
          <FilterControls 
            filters={filters}
            onFilterChange={handleFilterChange}
            disabled={isLoading || isLocating}
            darkMode={darkMode}
          />
          <div className="mt-6">
            {renderContent()}
          </div>
        </main>

        <footer className={`mt-20 border-t pt-10 pb-6 text-sm flex-none transition-colors ${darkMode ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-500'}`}>
          <div className="grid md:grid-cols-3 gap-8 mb-8 text-left max-w-5xl mx-auto">
            <div className="space-y-3">
              <h3 className={`font-bold text-base uppercase tracking-wider ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>Como Funciona</h3>
              <p className="leading-relaxed opacity-80">
                Nossa ferramenta utiliza a API avançada do Google Gemini para cruzar dados do Google Maps e Search. A IA lê rodapés de sites e perfis sociais para encontrar e-mails públicos.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className={`font-bold text-base uppercase tracking-wider ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>Potencialize Resultados</h3>
              <p className="leading-relaxed opacity-80">
                Utilize os filtros de cidade e estado para prospecção segmentada. Exporte os dados em CSV para importar diretamente no seu CRM ou ferramenta de disparo de e-mails.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className={`font-bold text-base uppercase tracking-wider ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>Nota Legal</h3>
              <p className="leading-relaxed opacity-80">
                Esta ferramenta é destinada ao uso ético para B2B. As informações são públicas e obtidas através de varredura web. Respeite as leis de proteção de dados (LGPD) ao entrar em contato.
              </p>
            </div>
          </div>
          
          <div className={`text-center pt-8 border-t ${darkMode ? 'border-gray-800/50' : 'border-gray-200'}`}>
             <p className="text-xs opacity-50 mb-2">
               Tags: Gerador de Leads B2B, Busca de Empresas, Extrator de E-mails, Marketing Digital, Prospecção Ativa, Vendas B2B, Lista de Contatos, CRM Data Enrichment.
             </p>
             <p>&copy; {new Date().getFullYear()} Prospector de Negócios. Desenvolvido com React & Google Gemini API.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
