import {Type, RowType, getChevronStatus, getBankMatchesPersonalityStatus} from 'columns/tobColumns/common';
import {TOBColumnData} from 'components/TOB/data';
import {DualTableHeader} from 'components/dualTableHeader';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {Order, OrderStatus} from 'interfaces/order';
import {TOBQty} from 'columns/tobQty';
import React from 'react';
import {AggregatedSz} from 'components/TOB/reducer';

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

export const SizeColumn = (label: string, type: Type, data: TOBColumnData, depth: boolean): ColumnSpec => {
  return {
    name: `${type}-sz`,
    header: () => (<DualTableHeader label={label} disabled={!data.buttonsEnabled}/>),
    render: ({[type]: originalOrder, depths}: RowType) => {
      const quantity = depth ? originalOrder.quantity : getAggregatedSize(data.aggregatedSz, originalOrder, type);
      const order: Order = {...originalOrder, quantity};
      const status: OrderStatus = getChevronStatus(depths, order.tenor, order.type)
        | getBankMatchesPersonalityStatus(order, data.personality)
        | originalOrder.status;

      const getOrder = () => {
        if (order.status === status)
          return order;
        return {...order, status: status};
      };

      return (
        <TOBQty
          order={getOrder()}
          isDepth={depth}
          value={quantity}
          defaultSize={data.defaultSize}
          minSize={data.minSize}
          personality={data.personality}
          onCancel={data.onCancelOrder}
          onSubmit={data.onQuantityChange}/>
      );
    },
    template: '999999',
    weight: 5,
  };
};
