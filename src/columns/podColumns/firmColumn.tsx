import { ColumnSpec } from 'components/Table/columnSpecification';
import { PodRowProps } from 'columns/podColumns/common';
import React, { ReactElement } from 'react';
import { OrderStatus } from 'interfaces/order';

export const FirmColumn = (type: 'ofr' | 'bid'): ColumnSpec => ({
  name: `${type}-firm`,
  header: () => <div>&nbsp;</div>,
  render: (row: PodRowProps): ReactElement | null => {
    if (!row[type])
      return null;
    const { [type]: { firm, status } } = row;
    if ((status & OrderStatus.Cancelled) !== 0)
      return null;
    return <div className={'firm'}>{firm}</div>;
  },
  template: ' BANK ',
  width: 4,
});
