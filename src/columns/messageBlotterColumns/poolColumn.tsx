import {ColumnSpec} from 'components/Table/columnSpecification';
import React from 'react';

export const poolColumn: ColumnSpec = {
  name: 'pool',
  difference: function (p1: any, p2: any) {
    return 0;
  },
  filterByKeyword: function (p1: any, p2: string) {
    return false;
  },
  header: () => <div>Pool</div>,
  render: () => <div/>,
  filterable: true,
  sortable: true,
  template: 'POOL',
  weight: 1,
};
