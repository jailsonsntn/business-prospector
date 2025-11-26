import { GoogleGenAI } from "@google/genai";
import type { Place, Location, FilterOptions } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Estratégias para diversificar os resultados quando fazemos requisições paralelas
const SEARCH_STRATEGIES = [
  "Foque nos estabelecimentos mais populares, bem avaliados e consolidados da região.",
  "Foque estritamente em 'Hidden Gems' (joias escondidas), novos negócios e estabelecimentos com poucas avaliações online.",
  "Foque em estabelecimentos localizados nos bairros periféricos ou zonas adjacentes ao centro da localização.",
  "Foque em nichos específicos e serviços especializados dentro desta categoria de negócio."
];

export const findPlaces = async (
  query: string, 
  location: Location, 
  filters: FilterOptions,
  onProgress?: (count: number, total: number) => void
): Promise<Place[]> => {
  if (!query || !query.trim()) {
    throw new Error("O termo de busca é obrigatório.");
  }

  const BATCH_SIZE = 50; // O Gemini lida bem com ~50 itens por prompt
  const totalRequested = filters.pageSize;
  
  // Calculamos quantos lotes paralelos precisamos (ex: 200 resultados = 4 lotes)
  const numberOfBatches = Math.ceil(totalRequested / BATCH_SIZE);
  
  const promises = [];

  for (let i = 0; i < numberOfBatches; i++) {
    // Atribuímos uma estratégia diferente para cada lote para evitar duplicatas
    const strategy = SEARCH_STRATEGIES[i % SEARCH_STRATEGIES.length];
    
    // Dispara a promessa sem await (paralelismo)
    promises.push(
      fetchBatch(query, location, filters, strategy, BATCH_SIZE)
        .then(results => {
           // Opcional: Notificar progresso parcial (embora impreciso no paralelismo total, dá feedback)
           if (onProgress) onProgress((i + 1) * BATCH_SIZE, totalRequested);
           return results;
        })
    );
  }

  try {
    // Aguarda todas as requisições paralelas terminarem (seja sucesso ou falha)
    const results = await Promise.allSettled(promises);
    
    const allPlaces: Place[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allPlaces.push(...result.value);
      } else {
        console.error("Um dos lotes falhou:", result.reason);
      }
    });

    // Deduplicação baseada no nome normalizado
    const uniquePlaces = Array.from(new Map(allPlaces.map(item => [item.nome.toLowerCase().trim(), item])).values());

    return uniquePlaces;

  } catch (error) {
    console.error("Erro fatal na orquestração da busca:", error);
    throw new Error("Falha ao processar as buscas paralelas.");
  }
};

async function fetchBatch(
  query: string, 
  location: Location, 
  filters: FilterOptions, 
  strategy: string,
  batchSize: number
): Promise<Place[]> {
  
  let locationPromptPart = `próximos à latitude ${location.latitude} e longitude ${location.longitude}`;

  if (filters.city.trim() && filters.state.trim()) {
    locationPromptPart = `na cidade de ${filters.city}, estado de ${filters.state}`;
  } else if (filters.radius > 0) {
    locationPromptPart = `num raio de ${filters.radius}km a partir da latitude ${location.latitude} e longitude ${location.longitude}`;
  }

  const prompt = `
    Atue como um especialista Sênior em OSINT (Open Source Intelligence).
    
    MISSÃO:
    Encontrar uma lista de ${batchSize} estabelecimentos do tipo "${query}" ${locationPromptPart}.
    
    ESTRATÉGIA DESTE LOTE (IMPORTANTE):
    ${strategy}
    (Use esta estratégia para encontrar resultados únicos que não apareceriam em uma busca genérica).

    INSTRUÇÕES DE MINERAÇÃO:
    1. **Geolocalização:** Valide a existência no Google Maps.
    2. **E-mail (Prioridade):** Use o Google Search para varrer rodapés de sites, páginas de contato, Instagram e Facebook Bios em busca de e-mails.
    3. **Dados de Contato:** Formate telefones como (XX) XXXXX-XXXX.
    4. **Redes Sociais:** Inclua links diretos para Instagram, Facebook e LinkedIn se encontrar.

    FORMATO DE SAÍDA JSON:
    [
      {
        "nome": "Nome da Empresa",
        "telefone": "(XX) XXXXX-XXXX",
        "email": "email@dominio.com",
        "instagram": "url",
        "facebook": "url",
        "linkedin": "url"
      }
    ]
    
    Retorne APENAS o JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [
          { googleMaps: {} }, 
          { googleSearch: {} }
        ],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
          },
        },
      },
    });

    const rawText = response.text;
    const jsonMatch = rawText?.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch || !jsonMatch[0]) return [];

    return JSON.parse(jsonMatch[0]) as Place[];

  } catch (e) {
    console.warn("Erro em um lote específico (ignorado para não quebrar o fluxo):", e);
    return [];
  }
}