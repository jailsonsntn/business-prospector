
import { GoogleGenAI } from "@google/genai";
import type { Place, Location, FilterOptions } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// MUDANÇA CRÍTICA: Segmentação Alfabética.
// Em vez de conceitos abstratos, dividimos a busca em fatias do alfabeto.
// Isso força o Google Maps a retornar resultados diferentes em cada requisição paralela.
const SEARCH_SEGMENTS = [
  "cujos nomes começam com as letras A, B, C ou D",
  "cujos nomes começam com as letras E, F, G ou H",
  "cujos nomes começam com as letras I, J, K ou L",
  "cujos nomes começam com as letras M, N, O, P ou Q",
  "cujos nomes começam com as letras R, S, T, U ou V",
  "cujos nomes começam com as letras W, X, Y, Z ou números",
  "que são novos ou pouco avaliados (Hidden Gems)",
  "que estão localizados em bairros periféricos"
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

  // Define o tamanho do lote. Pedimos 30 por letra/segmento para garantir densidade.
  const BATCH_SIZE = 30; 
  
  // Define quantos segmentos usar baseados na meta total
  // Se o usuário quer 50, usamos 2 segmentos. Se quer 200, usamos todos os 8 segmentos disponíveis.
  const totalRequested = filters.pageSize;
  let numberOfSegmentsToUse = Math.ceil(totalRequested / 20); // Aprox 20 resultados úteis por segmento
  if (numberOfSegmentsToUse > SEARCH_SEGMENTS.length) numberOfSegmentsToUse = SEARCH_SEGMENTS.length;
  
  const promises = [];

  for (let i = 0; i < numberOfSegmentsToUse; i++) {
    const segment = SEARCH_SEGMENTS[i];
    
    // Dispara a promessa sem await (paralelismo real)
    promises.push(
      fetchBatch(query, location, filters, segment, BATCH_SIZE)
        .then(results => {
           // Notifica progresso visualmente
           if (onProgress) onProgress((i + 1) * 20, totalRequested);
           return results;
        })
    );
  }

  try {
    const results = await Promise.allSettled(promises);
    
    const allPlaces: Place[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allPlaces.push(...result.value);
      }
    });

    // Deduplicação robusta
    const uniquePlaces = Array.from(new Map(allPlaces.map(item => [item.nome.toLowerCase().trim(), item])).values());

    return uniquePlaces;

  } catch (error) {
    console.error("Erro na busca paralela:", error);
    throw new Error("Falha ao processar as buscas.");
  }
};

async function fetchBatch(
  query: string, 
  location: Location, 
  filters: FilterOptions, 
  segment: string,
  batchSize: number
): Promise<Place[]> {
  
  const city = filters.city.trim();
  const state = filters.state.trim();

  let locationContext = '';
  const requestConfig: any = {
    tools: [
      { googleMaps: {} }, 
      { googleSearch: {} }
    ]
  };

  // Lógica de Localização
  if (city || state) {
    // Busca por Texto (Global)
    const parts = [];
    if (city) parts.push(`cidade de ${city}`);
    if (state) parts.push(`estado de ${state}`);
    locationContext = `localizados em: ${parts.join(', ')}`;
  } else {
    // Busca por GPS (Local)
    const radius = filters.radius > 0 ? filters.radius : 10;
    locationContext = `num raio de ${radius}km da minha localização atual`;
    
    requestConfig.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      },
    };
  }

  // Prompt Otimizado para Volume e Segmentação
  const prompt = `
    Atue como um gerador de leads focado em volume.
    
    OBJETIVO:
    Encontrar lista de negócios do tipo "${query}" ${segment}.
    ${locationContext}

    INSTRUÇÕES ESTRITAS:
    1. SEGMENTAÇÃO OBRIGATÓRIA: Você DEVE focar apenas em negócios ${segment}. Não traga os mesmos lugares famosos de sempre. Varra o mapa.
    2. QUANTIDADE: Liste pelo menos ${batchSize} locais únicos.
    3. DADOS: O foco é NOME e TELEFONE.
       - Se não achar email/social, deixe null. NÃO EXCLUA O LOCAL DA LISTA.
       - Queremos volume de contatos telefônicos.
    4. PESQUISA: Use o Google Maps para achar os locais e o Google Search APENAS se precisar confirmar um telefone difícil.

    SAÍDA JSON (ARRAY):
    [
      {
        "nome": "Nome Exato",
        "telefone": "(XX) XXXX-XXXX ou null",
        "email": "email ou null",
        "instagram": "url ou null",
        "facebook": "url ou null",
        "linkedin": "url ou null"
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: requestConfig,
    });

    const rawText = response.text;
    const jsonMatch = rawText?.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch || !jsonMatch[0]) return [];

    return JSON.parse(jsonMatch[0]) as Place[];

  } catch (e) {
    return [];
  }
}
