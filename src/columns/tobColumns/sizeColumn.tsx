import { Type, RowType, getChevronStatus } from 'columns/tobColumns/common';
import { TOBColumnData } from 'components/TOB/data';
import { HeaderAction, DualTableHeader } from 'components/dualTableHeader';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { Order, OrderStatus } from 'interfaces/order';
import { TOBQty } from 'columns/tobQty';
import React from 'react';
import { AggregatedSz } from 'components/TOB/reducer';

const getAggregatedSize = (aggregatedSz: AggregatedSz | undefined, order: Order, index: 'ofr' | 'bid'): number | null => {
  if (aggregatedSz) {
    const price: number | null = order.price;
    const key: string | null = price === null ? null : price.toFixed(3);
    if (aggregatedSz[order.tenor] && key !== null)
      return aggregatedSz[order.tenor][index][key];
    return order.quantity;
  } else {
    return order.quantity;
  }
};

export const SizeColumn = (label: string, type: Type, data: TOBColumnData, depth: boolean, action?: HeaderAction): ColumnSpec => {
  return {
    name: `${type}-sz`,
    header: () => <DualTableHeader label={label} action={action} disabled={!data.buttonsEnabled} />,
    render: ({ [type]: originalOrder, depths }: RowType) => {
      const quantity = depth ? originalOrder.quantity : getAggregatedSize(data.aggregatedSz, originalOrder, type);
      const order: Order = { ...originalOrder, quantity };
      const status: OrderStatus = getChevronStatus(depths, order.tenor, order.type) | originalOrder.status;
      if (order.status !== status) {
        return (
          <TOBQty order={{ ...order, status: status }}
            isDepth={depth}
            value={order.quantity}
            onCancel={data.onCancelOrder}
            onSubmit={data.onQuantityChange} />
        );
      } else {
        return (
          <TOBQty order={order}
            isDepth={depth}
            value={order.quantity}
            onCancel={data.onCancelOrder}
            onSubmit={data.onQuantityChange} />
        );
      }
    },
    template: '999999',
    weight: 5,
  };
};
