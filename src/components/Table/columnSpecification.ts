import {ReactElement} from 'react';

export interface ColumnSpec {
  name: string;
  sortable?: boolean;
  filterable?: boolean;
  header: (props: any) => ReactElement | string | null;
  render: (props: any) => ReactElement;
  span?: number;
  weight: number;
}
