import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@shared/dto/auth/auth.dto';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'cylinder' | 'product' | 'customer' | 'inkFormula' | 'job';
  link: string;
}

export interface SearchResultsDto {
  cylinders: SearchResultItem[];
  products: SearchResultItem[];
  customers: SearchResultItem[];
  inkFormulas: SearchResultItem[];
  jobs: SearchResultItem[];
}

export async function globalSearch(q: string): Promise<SearchResultsDto> {
  const res = await apiClient.get<ApiResponse<SearchResultsDto>>('/api/v1/search', {
    params: { q }
  });
  return res.data.data!;
}
