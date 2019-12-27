import {ReactElement} from 'react';

export interface ColumnSpec {
  name: string;
  sortable?: boolean;
  filterable?: boolean;
  header: (props: any) => ReactElement | string | null;
  render: (props: any) => ReactElement;
  span?: number;
  weight: number;
  filterByKeyword?: (v1: any, keyword: string) => boolean;
  difference?: (v1: any, v2: any) => number;
  template: string;
}
