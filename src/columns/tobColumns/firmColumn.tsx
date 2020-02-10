import {TOBColumnData} from 'components/PodTile/data';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {DualTableHeader} from 'components/dualTableHeader';
import {RowType} from 'columns/tobColumns/common';
import React from 'react';

export const FirmColumn = (
  data: TOBColumnData,
  type: 'ofr' | 'bid',
): ColumnSpec => ({
  name: `${type}-firm`,
  header: () => <DualTableHeader label={''}/>,
  render: (row: RowType) => {
    const {
      [type]: {firm},
    } = row;
    return <div className={'firm'}>{firm}</div>;
  },
  template: ' BANK ',
  weight: 3,
});
