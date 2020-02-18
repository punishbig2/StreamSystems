import {TOBColumnData} from 'components/PodTile/data';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {DualTableHeader} from 'components/dualTableHeader';
import {RowProps} from 'columns/podColumns/common';
import React from 'react';

export const FirmColumn = (
  data: TOBColumnData,
  type: 'ofr' | 'bid',
): ColumnSpec => ({
  name: `${type}-firm`,
  header: () => <DualTableHeader label={''}/>,
  render: (row: RowProps) => {
    const {
      [type]: {firm},
    } = row;
    return <div className={'firm'}>{firm}</div>;
  },
  template: ' BANK ',
  weight: 3,
});
