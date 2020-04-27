import React, { ReactElement, useEffect, useState } from 'react';
import { Order, OrderStatus } from 'interfaces/order';
import { OrderTypes } from 'interfaces/mdEntry';
import { Size } from 'components/Table/CellRenderers/Size';
import { getOrderStatusClass } from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import { Price } from 'components/Table/CellRenderers/Price';
import { STRM } from 'stateDefs/workspaceState';
import { onNavigate } from 'components/PodTile/helpers';
import { ModalWindow } from 'components/ModalWindow';
import { ArrowDirection } from 'interfaces/w';
import { User } from 'interfaces/user';
import { OrderStore } from 'mobx/stores/orderStore';
import { orderTicketRenderer } from 'columns/podColumns/OrderColumn/helpers/orderTicketRenderer';
import { observer } from 'mobx-react';
import { onSubmitPrice } from 'columns/podColumns/OrderColumn/helpers/onSubmitPrice';
import { getOrderStatus } from 'columns/podColumns/OrderColumn/helpers/getOrderStatus';
import { MiniDOB } from 'components/Table/CellRenderers/Price/miniDob';
import { shouldOpenOrderTicket } from 'columns/podColumns/OrderColumn/helpers/shoulOpenOrderTicket';
import { onSubmitSize } from 'columns/podColumns/OrderColumn/helpers/onSubmitSize';
import { PodRowStore } from 'mobx/stores/podRowStore';
import workareaStore from 'mobx/stores/workareaStore';
import { getRelevantOrders } from 'columns/podColumns/OrderColumn/helpers/getRelevantOrders';
import { getAggregatedSize } from 'columns/podColumns/OrderColumn/helpers/getAggregatedSize';

export enum PodTableType {
  Pod, Dob
}

type OwnProps = {
  orders: Order[];
  type: OrderTypes;
  currency: string;
  strategy: string;
  tenor: string;
  minimumSize: number;
  defaultSize: number;
  tableType: PodTableType;
  rowStore: PodRowStore;
}

export const OrderColumn: React.FC<OwnProps> = observer((props: OwnProps): ReactElement | null => {
  const [store] = useState<OrderStore>(new OrderStore());
  const { minimumSize, defaultSize } = props;
  const { type, tableType } = props;
  const { rowStore, orders } = props;
  const { price, size } = store;
  const relevantOrders: Order[] = getRelevantOrders(orders, type);
  // Used for the fallback order
  const { currency: symbol, strategy, tenor } = props;
  // It should never happen that this is {} as Order
  const order: Order = relevantOrders.length > 0
    ? relevantOrders[0]
    : { price: null, size: null, type, tenor, strategy, symbol } as Order;
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  // Determine the status of the order now
  const status: OrderStatus = getOrderStatus(order, relevantOrders, tableType);
  // Sort siblings
  useEffect(() => {
    store.setOrder(order, status);
  }, [store, order, status]);

  useEffect(() => {
    store.setDefaultAndMinimumSizes(defaultSize, minimumSize);
  }, [store, minimumSize, defaultSize]);

  useEffect(() => {
    store.setCurrentDepth(orders);
  }, [store, orders]);

  useEffect(() => {
    rowStore.setError(null);
  }, [price, rowStore, size]);

  // const onChangeSize = (value: string | null) => store.setEditedSize(Number(value));
  const renderTooltip = (): ReactElement | null => {
    const filtered: Order[] = relevantOrders.filter((order: Order) => order.size !== null);
    if (filtered.length <= 1)
      return null;
    return <MiniDOB {...props} rows={filtered} orderStore={store}/>;
  };

  const renderOrderTicket = orderTicketRenderer(store);
  const onDoubleClick = () => {
    if (!shouldOpenOrderTicket(order, personality, user))
      return;
    const type: OrderTypes = order.type === OrderTypes.Bid ? OrderTypes.Ofr : OrderTypes.Bid;
    const size: number | null = getAggregatedSize(order, store.depth);
    // Replace the inferred type to create an opposing order
    store.setOrderTicket({ ...order, type, size });
  };

  const errorHandler = (fn: (...args: any[]) => Promise<void> | void) => {
    return (...args: any[]) => {
      try {
        return fn(...args);
      } catch (error) {
        rowStore.setError(error);
      }
    };
  };
  const readOnly: boolean = user.isbroker && personality === STRM;
  const sizeCell: ReactElement = (
    <Size key={2}
          type={type}
          className={getOrderStatusClass(store.status)}
          value={size}
          cancellable={true}
          readOnly={readOnly}
          chevron={(store.status & OrderStatus.HasDepth) !== 0}
          onCancel={store.cancel}
          onNavigate={onNavigate}
          onSubmit={errorHandler(onSubmitSize(store))}/>
  );

  const items: ReactElement[] = [
    <Price
      key={1}
      status={store.status}
      value={price}
      min={store.minimumPrice}
      max={store.maximumPrice}
      readOnly={readOnly}
      arrow={(store.status & OrderStatus.HasDepth) ? order.arrowDirection : ArrowDirection.None}
      tooltip={renderTooltip}
      onDoubleClick={onDoubleClick}
      onSubmit={errorHandler(onSubmitPrice(store))}
      onNavigate={onNavigate}/>,
  ];

  switch (type) {
    case OrderTypes.Ofr:
      items.push(sizeCell);
      break;
    case OrderTypes.Bid:
      items.unshift(sizeCell);
      break;
  }

  return (
    <>
      <ModalWindow render={renderOrderTicket} visible={!!store.orderTicket}/>
      {items}
    </>
  );
});

