import {ColumnSpec} from 'components/Table/columnSpecification';
import React from 'react';

export const spotColumn: ColumnSpec = {
  name: 'spot',
  difference: function (p1: any, p2: any) {
    return 0;
  },
  filterByKeyword: function (p1: any, p2: string) {
    return false;
  },
  header: function (p1: any) {
    return <div>Spot</div>;
  },
  render: function (p1: any) {
    return <div/>;
  },
  filterable: true,
  sortable: true,
  template: 'SPOT',
  weight: 1,
};
