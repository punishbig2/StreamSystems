import {ReactElement} from 'react';

export interface ColumnSpec {
  name: string;
  header: (props: any) => ReactElement;
  render: (props: any) => ReactElement;
  span?: number;
  weight: number;
}
