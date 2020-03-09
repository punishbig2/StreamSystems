import {ColumnSpec} from 'components/Table/columnSpecification';
import React, {ReactElement} from 'react';
import {PodRowProps} from 'columns/podColumns/common';
import {OrderTypes} from 'interfaces/mdEntry';
import {OrderColumn} from 'columns/podColumns/OrderColumn';
import {Order} from 'interfaces/order';
import {SignalRManager} from 'redux/signalR/signalRManager';
import {priceFormatter} from 'utils/priceFormatter';

export const OrderColumnWrapper = (label: string, type: OrderTypes, isDepth: boolean, action: () => ReactElement | null): ColumnSpec => {
  return {
    name: `${type}-vol`,
    header: () => {
      const items: ReactElement[] = [
        <div className={'price'} key={'1'}>{label}</div>,
      ];
      const actionItem: ReactElement | null = action();
      if (actionItem !== null) {
        if (type === OrderTypes.Bid) {
          items.unshift(<div className={'size'} key={'2'}>{actionItem}</div>);
        } else if (type === OrderTypes.Ofr) {
          items.push(<div className={'size'} key={'2'}>{actionItem}</div>);
        }
      } else {
        if (type === OrderTypes.Bid) {
          items.unshift(<div className={'size'} key={'2'}>&nbsp;</div>);
        } else {
          items.push(<div className={'size'} key={'2'}>&nbsp;</div>);
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
        const allOrders: Order[] = SignalRManager.getDepth(order.symbol, order.strategy, order.tenor, order.type);
        if (allOrders.length === 0)
          return order;
        const sorted: Order[] = allOrders
          .filter((each: Order) => {
            return priceFormatter(each.price) === priceFormatter(order.price);
          })
          .sort((o1: Order, o2: Order) => o1.timestamp - o2.timestamp);
        return sorted[0];
      };
      const bid: Order = isDepth ? props.bid : pickMyOrderIfOnTopOrCurrentTop(props.bid);
      const ofr: Order = isDepth ? props.ofr : pickMyOrderIfOnTopOrCurrentTop(props.ofr);
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
    template: '999999 999999.999',
    weight: 13,
  };
};

