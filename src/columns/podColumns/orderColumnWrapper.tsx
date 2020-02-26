import {ColumnSpec} from 'components/Table/columnSpecification';
import React, {ReactElement} from 'react';
import {PodRowProps} from 'columns/podColumns/common';
import {OrderTypes} from 'interfaces/mdEntry';
import {OrderColumn} from 'columns/podColumns/orderColumn';
import {Order, OrderStatus} from 'interfaces/order';
import {SignalRManager} from 'redux/signalR/signalRManager';
import {priceFormatter} from 'utils/priceFormatter';

export const OrderColumnWrapper = (label: string, type: OrderTypes, isDepth: boolean, action: () => ReactElement | null): ColumnSpec => {
  return {
    name: `${type}-vol`,
    header: () => {
      const items: ReactElement[] = [
        <div className={'price'}>{label}</div>,
      ];
      const actionItem: ReactElement | null = action();
      if (actionItem !== null) {
        if (type === OrderTypes.Bid) {
          items.unshift(<div className={'size'}>{actionItem}</div>);
        } else if (type === OrderTypes.Ofr) {
          items.push(<div className={'size'}>{actionItem}</div>);
        }
      }
      return (
        <div className={'twin-header'}>
          {items}
        </div>
      );
    },
    render: (props: PodRowProps) => {
      const pickMyOrderIfOnTopOrCurrentTop = (order: Order): Order => {
        const allOrders: Order[] = SignalRManager.getDepthOfTheBook(
          order.symbol, order.strategy, order.tenor, order.type,
        );
        const mine: Order | undefined = allOrders.find((each: Order) => {
          if (!each.isOwnedByCurrentUser())
            return false;
          return priceFormatter(each.price) === priceFormatter(order.price);
        });
        if (mine !== undefined)
          return {...order, status: order.status | OrderStatus.Owned};
        return order;
      };
      const bid: Order = pickMyOrderIfOnTopOrCurrentTop(props.bid);
      const ofr: Order = pickMyOrderIfOnTopOrCurrentTop(props.ofr);
      return (
        <OrderColumn
          type={type}
          personality={props.personality}
          isBroker={props.isBroker}
          bid={bid}
          ofr={ofr}
          depths={props.depths}
          defaultSize={props.defaultSize}
          minimumSize={props.minimumSize}
          isDepth={isDepth}
          onRowStatusChange={props.onRowStatusChange}/>
      );
    },
    template: '99999 999999.999',
    weight: 12,
  };
};

