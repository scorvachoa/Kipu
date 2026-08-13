export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MerchantRule {
  id: string;
  user_id: string;
  merchant_pattern: string;
  category_id: string;
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}