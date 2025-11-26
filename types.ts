
export interface Place {
  nome: string;
  telefone: string | null;
  email: string | null;
  instagram?: string | null;
  facebook?: string | null;
  linkedin?: string | null;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface FilterOptions {
  pageSize: number;
  city: string;
  state: string;
  radius: number; // 0 para "Qualquer"
}
