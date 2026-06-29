export type KharchoCategory =
  | 'bhadu'
  | 'nokar_salary'
  | 'bill'
  | 'maintenance'
  | 'car_insurance'
  | 'car_petrol'
  | 'emi'
  | 'other';

export const KHARCHO_CATEGORIES: {
  id: KharchoCategory;
  label: string;
  labelGu: string;
}[] = [
  { id: 'bhadu', label: 'Rent (Bhadu)', labelGu: 'Bhadu' },
  { id: 'nokar_salary', label: 'Staff salary (Nokar)', labelGu: 'Nokar salary' },
  { id: 'bill', label: 'Bills (light, phone…)', labelGu: 'Bill' },
  { id: 'maintenance', label: 'Maintenance', labelGu: 'Maintenance' },
  { id: 'car_insurance', label: 'Car insurance', labelGu: 'Car insurance' },
  { id: 'car_petrol', label: 'Car petrol', labelGu: 'Car petrol' },
  { id: 'emi', label: 'EMI / loan', labelGu: 'EMI' },
  { id: 'other', label: 'Other kharcho', labelGu: 'Other' },
];

export function kharchoCategoryLabel(category: KharchoCategory): string {
  return KHARCHO_CATEGORIES.find((c) => c.id === category)?.label ?? category;
}

export interface ShopKharcho {
  id: string;
  shopId: string;
  date: string;
  category: KharchoCategory;
  categoryLabel: string;
  amountPaise: number;
  note: string | null;
  createdAt: string;
}

export interface KharchoSummary {
  totalPaise: number;
  entryCount: number;
  byCategory: {
    category: KharchoCategory;
    categoryLabel: string;
    totalPaise: number;
    entryCount: number;
  }[];
}

export interface CreateKharchoInput {
  category: KharchoCategory;
  amount: number;
  date?: string;
  note?: string;
}

export interface UpdateKharchoInput {
  category?: KharchoCategory;
  amount?: number;
  date?: string;
  note?: string;
}
