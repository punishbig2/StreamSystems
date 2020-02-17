import {Type, RowType, getChevronStatus, getBankMatchesPersonalityStatus} from 'columns/podColumns/common';
import {TOBColumnData} from 'components/PodTile/data';
import {DualTableHeader} from 'components/dualTableHeader';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {Order, OrderStatus} from 'interfaces/order';
import {PodSize} from 'columns/podSize';
import React from 'react';
import {AggregatedSz} from 'components/PodTile/reducer';
import {TOBRow} from 'interfaces/tobRow';
import {PodTable} from 'interfaces/podTable';

const getAggregatedSize = (aggregatedSize: AggregatedSz | undefined, order: Order, index: 'ofr' | 'bid'): number | null => {
  if (aggregatedSize) {
    const price: number | null = order.price;
    const key: string | null = price === null ? null : price.toFixed(3);
    if (aggregatedSize[order.tenor] && key !== null)
      return aggregatedSize[order.tenor][index][key];
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
      const quantity = depth ? originalOrder.quantity : getAggregatedSize(data.aggregatedSize, originalOrder, type);
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
        <PodSize
          order={getOrder()}
          isDepth={depth}
          value={quantity}
          defaultSize={data.defaultSize}
          minimumSize={data.minimumSize}
          personality={data.personality}
          onNavigate={data.onNavigate}
          onCancel={data.onCancelOrder}
          onSubmit={() => null}/>
      );
    },
    template: '999999',
    weight: 5,
  };
};

