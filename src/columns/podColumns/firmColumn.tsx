import {ColumnSpec} from 'components/Table/columnSpecification';
import {DualTableHeader} from 'components/dualTableHeader';
import {PodRowProps} from 'columns/podColumns/common';
import React from 'react';

export const FirmColumn = (type: 'ofr' | 'bid'): ColumnSpec => ({
  name: `${type}-firm`,
  header: () => <DualTableHeader label={''}/>,
  render: (row: PodRowProps) => {
    const {[type]: {firm}} = row;
    return <div className={'firm'}>{firm}</div>;
  },
  template: ' BANK ',
  weight: 3,
});
