import { ColumnSpec } from 'components/Table/columnSpecification';
import { PodRowProps } from 'columns/podColumns/common';
import React, { ReactElement } from 'react';
import { OrderStatus, Order } from 'interfaces/order';
import { getDepth } from 'columns/podColumns/OrderColumn/helpers/getDepth';
import { OrderTypes } from 'interfaces/mdEntry';

export const FirmColumn = (type: OrderTypes): ColumnSpec => ({
  name: `${type}-firm`,
  header: () => <div>&nbsp;</div>,
  render: (row: PodRowProps): ReactElement | null => {
    const depth: Order[] = getDepth(row.depth, type);
    // It should never happen that this is {} as Order
    const order: Order = depth.length > 0 ? depth[0] : { price: null, size: null } as Order;
    if (!order)
      return null;
    const { firm, status } = order;
    if ((status & OrderStatus.Cancelled) !== 0)
      return null;
    return <div className={'firm'}>{firm}</div>;
  },
  template: ' BANK ',
  width: 4,
});
