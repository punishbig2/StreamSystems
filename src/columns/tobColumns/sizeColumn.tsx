import {Type, RowType, getChevronStatus, getBankMatchesPersonalityStatus} from 'columns/tobColumns/common';
import {TOBColumnData} from 'components/TOB/data';
import {DualTableHeader} from 'components/dualTableHeader';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {Order, OrderStatus} from 'interfaces/order';
import {TOBQty} from 'columns/tobQty';
import React from 'react';
import {AggregatedSz} from 'components/TOB/reducer';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';

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

      const findMyOrder = (topOrder: Order): Order => {
        if ((topOrder.status & OrderStatus.Owned) !== 0)
          return topOrder;
        const values: TOBRow[][] = Object.values(depths).map((table: TOBTable) => Object.values(table));
        const found: Order | undefined = values.reduce((all: TOBRow[], one: TOBRow[]) => {
            return [...all, ...one];
          }, [])
          .reduce((orders: Order[], row: TOBRow) => {
            const {bid, ofr} = row;
            if (type === 'bid' && bid)
              return [...orders, bid];
            else if (type === 'ofr' && ofr)
              return [...orders, ofr];
            return orders;
          }, [])
          .find((order: Order) => {
            return ((order.status & OrderStatus.Owned) !== 0);
          });
        if (found !== undefined)
          return found;
        return topOrder;
      };

      return (
        <TOBQty
          order={getOrder()}
          isDepth={depth}
          value={quantity}
          defaultSize={data.defaultSize}
          minSize={data.minSize}
          personality={data.personality}
          onNavigate={data.onNavigate}
          onCancel={data.onCancelOrder}
          onSubmit={(...args: any[]) => {
            // @ts-ignore
            data.onQuantityChange(findMyOrder(args[0]), ...args.slice(1));
          }}/>
      );
    },
    template: '999999',
    weight: 5,
  };
};

