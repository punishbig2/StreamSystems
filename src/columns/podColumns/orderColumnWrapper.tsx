import {DualTableHeader} from 'components/dualTableHeader';
import {ColumnSpec} from 'components/Table/columnSpecification';
import React, {ReactNode, ReactElement} from 'react';
import {PodRowProps} from 'columns/podColumns/common';
import {OrderTypes} from 'interfaces/mdEntry';
import {OrderCellGroup} from 'columns/podColumns/orderColumn';
import {Order} from 'interfaces/order';
import {SignalRManager} from 'redux/signalR/signalRManager';
import {priceFormatter} from 'utils/priceFormatter';

export const OrderColumnWrapper = (label: string, type: OrderTypes, isDepth: boolean, action?: () => ReactNode): ColumnSpec => {
  return {
    name: `${type}-vol`,
    header: () => {
      const items: ReactElement[] = [
        <DualTableHeader key={1} label={label} action={action} disabled={false} className={'price'}/>,
      ];
      if (type === OrderTypes.Bid) {
        items.unshift(<DualTableHeader key={2} label={'Size'} className={'size'}/>);
      } else if (type === OrderTypes.Ofr) {
        items.push(<DualTableHeader key={2} label={'Size'} className={'size'}/>);
      }
      return (
        <div className={'twin-header'}>
          {items}
        </div>
      );
    },
    render: (props: PodRowProps) => {
      const pickOrderOrTop = (order: Order): Order => {
        const allOrders: Order[] = SignalRManager.getDepthOfTheBook(
          order.symbol, order.strategy, order.tenor, order.type,
        );
        const mine: Order | undefined = allOrders.find((each: Order) => {
          if (!each.isOwnedByCurrentUser())
            return false;
          return priceFormatter(each.price) === priceFormatter(order.price);
        });
        if (mine !== undefined)
          return mine;
        return order;
      };
      const bid: Order = pickOrderOrTop(props.bid);
      const ofr: Order = pickOrderOrTop(props.ofr);
      return (
        <OrderCellGroup
          type={type}
          personality={props.personality}
          aggregatedSize={props.aggregatedSize}
          isBroker={props.isBroker}
          bid={bid}
          ofr={ofr}
          depths={props.depths}
          defaultSize={props.defaultSize}
          minimumSize={props.minimumSize}
          isDepth={isDepth}/>
      );
    },
    template: '99999 999999.999',
    weight: 12,
  };
};
