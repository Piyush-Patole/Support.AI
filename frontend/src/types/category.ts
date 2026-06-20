export interface CategoryColumn {
  column_name: string;
  possible_values: string[];
}

export interface CategoryConfig {
  columns: CategoryColumn[];
}
