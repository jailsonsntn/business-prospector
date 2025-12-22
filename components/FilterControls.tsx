
import React from 'react';
import type { FilterOptions } from '../types';
import { FilterIcon } from './Icons';

interface FilterControlsProps {
  filters: FilterOptions;
  onFilterChange: (newFilters: Partial<FilterOptions>) => void;
  disabled: boolean;
  darkMode: boolean;
}

const radiusOptions = [
  { value: 0, label: 'Qualquer' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
];

// Opções aumentadas conforme solicitado
const pageSizeOptions = [50, 100, 200, 300, 400, 500];

export const FilterControls: React.FC<FilterControlsProps> = ({ filters, onFilterChange, disabled, darkMode }) => {
    
    // Função para manipular mudanças em Cidade/Estado
    const handleLocationTextChange = (field: 'city' | 'state', value: string) => {
        const updates: Partial<FilterOptions> = { [field]: value };
        
        // Se o usuário começar a digitar Cidade ou Estado, o Raio GPS perde o sentido.
        // Resetamos para 0 automaticamente.
        if (value.trim() !== '') {
            updates.radius = 0;
        }

        onFilterChange(updates);
    };

    const handleRadiusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRadius = parseInt(e.target.value, 10);
        // Se selecionar um raio, limpa cidade e estado para evitar conflito
        if (newRadius > 0) {
            onFilterChange({ 
                radius: newRadius,
                city: '',
                state: '',
            });
        } else {
            onFilterChange({ radius: newRadius });
        }
    };

    const hasLocationFilter = filters.city.trim() !== '' || filters.state.trim() !== '';

    // Style Helpers
    const containerClass = darkMode 
        ? "bg-gray-800/30 border-gray-700" 
        : "bg-white/50 border-gray-200";

    const labelClass = darkMode ? "text-gray-400" : "text-gray-500";
    const titleClass = darkMode ? "text-gray-300" : "text-gray-700";
    
    const inputClass = darkMode
        ? "bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-teal-500"
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-teal-500";

    return (
        <div className={`max-w-4xl mx-auto mt-6 p-4 rounded-xl border transition-colors ${containerClass}`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${titleClass}`}>
                <FilterIcon className="h-5 w-5" />
                Filtros de Busca
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtro Cidade e Estado */}
                <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Cidade (ex: Santos)"
                        value={filters.city}
                        onChange={(e) => handleLocationTextChange('city', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:outline-none transition ${inputClass}`}
                        disabled={disabled}
                    />
                    <input
                        type="text"
                        placeholder="UF"
                        value={filters.state}
                        maxLength={2}
                        onChange={(e) => handleLocationTextChange('state', e.target.value.toUpperCase())}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:outline-none transition ${inputClass}`}
                        disabled={disabled}
                    />
                </div>

                {/* Filtro Raio */}
                <div>
                    <label htmlFor="radius-filter" className={`block text-xs font-medium mb-1 uppercase tracking-wide ${labelClass}`}>Raio (do seu GPS)</label>
                    <select
                        id="radius-filter"
                        value={filters.radius}
                        onChange={handleRadiusChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed ${inputClass}`}
                        disabled={disabled || hasLocationFilter}
                    >
                        {radiusOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>

                {/* Filtro Quantidade */}
                <div>
                    <label htmlFor="pagesize-filter" className={`block text-xs font-medium mb-1 uppercase tracking-wide ${labelClass}`}>Meta de Resultados</label>
                    <select
                        id="pagesize-filter"
                        value={filters.pageSize}
                        onChange={(e) => onFilterChange({ pageSize: parseInt(e.target.value, 10) })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:outline-none transition ${inputClass}`}
                        disabled={disabled}
                    >
                        {pageSizeOptions.map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                </div>
            </div>
             {hasLocationFilter && (
                <div className={`mt-3 p-3 rounded-lg text-sm flex items-start gap-2 border ${darkMode ? 'bg-blue-900/20 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                    <span className="text-lg leading-none">ℹ️</span>
                    <span>
                        O filtro de <strong>Raio</strong> foi desabilitado. A busca será focada na localização digitada (Cidade/UF) ao invés do seu GPS.
                    </span>
                </div>
            )}
        </div>
    );
};
