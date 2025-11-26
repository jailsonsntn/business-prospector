
import React, { useState } from 'react';
import type { Place } from '../types';
import { PhoneIcon, MailIcon, ClipboardIcon, CheckIcon, ExternalLinkIcon, InstagramIcon, FacebookIcon, LinkedinIcon } from './Icons';

interface ResultCardProps {
  data: Place;
  darkMode: boolean;
}

const CopyableField: React.FC<{ value: string | null; icon: React.ReactNode; type: 'email' | 'phone'; darkMode: boolean }> = ({ value, icon, type, darkMode }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const textClass = darkMode ? "text-gray-300" : "text-gray-700";
  const mutedTextClass = darkMode ? "text-gray-500" : "text-gray-400";
  const hoverBgClass = darkMode ? "hover:bg-gray-600 hover:text-white" : "hover:bg-gray-100 hover:text-gray-900";

  if (!value) {
    return (
      <div className={`flex items-center gap-3 ${mutedTextClass}`}>
        {icon}
        <span className="italic text-sm">Não disponível</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 group ${textClass}`}>
      {icon}
      <span className="flex-grow truncate text-sm sm:text-base" title={value}>{value}</span>
      <button 
        onClick={handleCopy} 
        className={`p-1.5 rounded-md text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all opacity-0 group-hover:opacity-100 ${hoverBgClass}`}
        aria-label={`Copiar ${type}`}
      >
        {copied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <ClipboardIcon className="h-4 w-4" />}
      </button>
    </div>
  );
};

export const ResultCard: React.FC<ResultCardProps> = ({ data, darkMode }) => {
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(data.nome)}`;

  const cardClass = darkMode 
    ? "bg-gray-800 border-gray-700 hover:border-teal-500/50 hover:shadow-teal-500/10" 
    : "bg-white border-gray-200 hover:border-teal-300 hover:shadow-md";

  const titleClass = darkMode 
    ? "text-teal-400 hover:text-teal-300" 
    : "text-teal-600 hover:text-teal-700";

  const iconColor = darkMode ? "text-gray-500" : "text-gray-400";
  const socialIconClass = darkMode ? "text-gray-400 hover:text-teal-400" : "text-gray-500 hover:text-teal-600";

  const hasSocials = data.instagram || data.facebook || data.linkedin;

  return (
    <div className={`border rounded-xl shadow-sm p-5 flex flex-col gap-4 transition-all duration-300 ${cardClass}`}>
      <div className="flex justify-between items-start gap-2">
        <a 
            href={searchUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`text-lg font-bold truncate transition-colors flex items-center gap-2 group ${titleClass}`}
            title={`Pesquisar ${data.nome} no Google`}
        >
            <span className="truncate">{data.nome}</span>
            <ExternalLinkIcon className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </a>
      </div>
      
      <div className="space-y-3 flex-grow">
        <CopyableField value={data.telefone} icon={<PhoneIcon className={`h-4 w-4 ${iconColor}`}/>} type="phone" darkMode={darkMode} />
        <CopyableField value={data.email} icon={<MailIcon className={`h-4 w-4 ${iconColor}`}/>} type="email" darkMode={darkMode} />
      </div>

      {hasSocials && (
        <div className={`flex items-center gap-3 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
           {data.instagram && (
               <a href={data.instagram} target="_blank" rel="noopener noreferrer" className={`transition-colors ${socialIconClass}`} title="Instagram">
                   <InstagramIcon className="h-5 w-5" />
               </a>
           )}
           {data.facebook && (
               <a href={data.facebook} target="_blank" rel="noopener noreferrer" className={`transition-colors ${socialIconClass}`} title="Facebook">
                   <FacebookIcon className="h-5 w-5" />
               </a>
           )}
           {data.linkedin && (
               <a href={data.linkedin} target="_blank" rel="noopener noreferrer" className={`transition-colors ${socialIconClass}`} title="LinkedIn">
                   <LinkedinIcon className="h-5 w-5" />
               </a>
           )}
        </div>
      )}
    </div>
  );
};
