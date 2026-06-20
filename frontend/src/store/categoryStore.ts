import { create } from 'zustand';
import { CategoryColumn } from '../types/category';

interface CategoryState {
  columns: CategoryColumn[];
  addColumn: (col: CategoryColumn) => void;
  removeColumn: (name: string) => void;
  updateColumn: (name: string, col: CategoryColumn) => void;
  reset: () => void;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  columns: [],
  addColumn: (col) =>
    set((state) => ({ columns: [...state.columns, col] })),
  removeColumn: (name) =>
    set((state) => ({
      columns: state.columns.filter((c) => c.column_name !== name),
    })),
  updateColumn: (name, col) =>
    set((state) => ({
      columns: state.columns.map((c) =>
        c.column_name === name ? col : c
      ),
    })),
  reset: () => set({ columns: [] }),
}));
