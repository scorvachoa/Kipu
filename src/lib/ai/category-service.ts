export interface CategoryCandidate {
  id: string;
  name: string;
}

export interface CategoryService {
  categorize(
    merchant: string,
    categories: CategoryCandidate[],
  ): Promise<string | null>;
}