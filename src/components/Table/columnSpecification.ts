import { ReactElement } from 'react';
import { SortOrder } from 'mobx/stores/tableStore';

export interface ColumnSpec {
  name: string;
  sortable?: boolean;
  filterable?: boolean;
  header: (props: any) => ReactElement | string | null;
  render: (props: any) => ReactElement | string | null;
  span?: number;
  width: number;
  filterByKeyword?: (v1: any, keyword: string) => boolean;
  difference?: (v1: any, v2: any) => number;
  template: string;
  className?: string;
}

export interface ColumnState extends ColumnSpec {
  sortOrder: SortOrder;
}
