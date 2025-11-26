
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

const pageSizeOptions = [50, 100, 200];

export const FilterControls: React.FC<FilterControlsProps> = ({ filters, onFilterChange, disabled, darkMode }) => {
    const handleCityStateChange = () => {
        if (filters.radius !== 0) {
            onFilterChange({ radius: 0 });
        }
    };
    
    const handleRadiusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRadius = parseInt(e.target.value, 10);
        onFilterChange({ 
            radius: newRadius,
            city: '',
            state: '',
        });
    };

    const hasCityStateFilter = filters.city.trim() !== '' || filters.state.trim() !== '';

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
                        placeholder="Cidade"
                        value={filters.city}
                        onChange={(e) => {
                            onFilterChange({ city: e.target.value });
                            handleCityStateChange();
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:outline-none transition ${inputClass}`}
                        disabled={disabled}
                    />
                    <input
                        type="text"
                        placeholder="UF"
                        value={filters.state}
                        maxLength={2}
                        onChange={(e) => {
                            onFilterChange({ state: e.target.value.toUpperCase() });
                            handleCityStateChange();
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:outline-none transition ${inputClass}`}
                        disabled={disabled}
                    />
                </div>

                {/* Filtro Raio */}
                <div>
                    <label htmlFor="radius-filter" className={`block text-xs font-medium mb-1 uppercase tracking-wide ${labelClass}`}>Raio</label>
                    <select
                        id="radius-filter"
                        value={filters.radius}
                        onChange={handleRadiusChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:outline-none transition disabled:opacity-50 ${inputClass}`}
                        disabled={disabled || hasCityStateFilter}
                    >
                        {radiusOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>

                {/* Filtro Quantidade */}
                <div>
                    <label htmlFor="pagesize-filter" className={`block text-xs font-medium mb-1 uppercase tracking-wide ${labelClass}`}>Resultados</label>
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
             {hasCityStateFilter && (
                <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>A busca por raio foi desabilitada pois Cidade/Estado está preenchido.</p>
            )}
        </div>
    );
};
