import React, { ReactElement, useEffect, useState } from 'react';
import { Order, OrderStatus } from 'interfaces/order';
import { OrderTypes } from 'interfaces/mdEntry';
import { Size } from 'components/Table/CellRenderers/Size';
import { getOrderStatusClass } from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import { Price } from 'components/Table/CellRenderers/Price';
import { STRM } from 'stateDefs/workspaceState';
import { onNavigate, orderSorter } from 'components/PodTile/helpers';
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

export enum PodTableType {
  Pod, Dob
}

type OwnProps = {
  depth: Order[];
  type: OrderTypes;
  personality: string;
  user: User;
  minimumSize: number;
  defaultSize: number;
  tableType: PodTableType;
  rowStore: PodRowStore;
}

const getDepth = (orders: Order[], type: OrderTypes): Order[] => {
  if (!orders)
    return [];
  return orders
    .filter((order: Order) => order.type === type && order.size !== null)
    .sort(orderSorter(type));
};

export const OrderColumn: React.FC<OwnProps> = observer((props: OwnProps): ReactElement | null => {
  const [store] = useState<OrderStore>(new OrderStore());
  const { minimumSize, defaultSize } = props;
  const { type, personality, tableType } = props;
  const { rowStore } = props;
  const depth: Order[] = getDepth(props.depth, type);
  // It should never happen that this is {} as Order
  const order: Order = depth.length > 0 ? depth[0] : {price: null, size: null} as Order;
  const user: User = workareaStore.user;
  // Determine the status of the order now
  const status: OrderStatus = getOrderStatus(order, depth, user, personality, tableType);
  // Sort sibling orders
  useEffect(() => {
    store.setOrder(order, status);
  }, [store, order, status]);

  useEffect(() => {
    store.setPersonality(personality);
  }, [store, personality]);

  useEffect(() => {
    store.setUser(user);
  }, [store, user]);

  useEffect(() => {
    store.setDefaultAndMinimumSizes(defaultSize, minimumSize);
  }, [store, minimumSize, defaultSize]);

  useEffect(() => {
    store.setCurrentDepth(depth);
  }, [store, depth]);

  const resetSize = () => store.setEditedSize(store.submittedSize);
  const onChangeSize = (value: string | null) => store.setEditedSize(Number(value));
  const renderTooltip = (): ReactElement | null => {
    if (depth.length === 0)
      return null;
    return <MiniDOB {...props} rows={depth} user={user}/>;
  };

  const renderOrderTicket = orderTicketRenderer(store);
  const onDoubleClick = () => {
    if (!shouldOpenOrderTicket(order, personality, user))
      return;
    const type: OrderTypes = order.type === OrderTypes.Bid ? OrderTypes.Ofr : OrderTypes.Bid;
    // Replace the inferred type to create an opposing order
    store.setOrderTicket({ ...order, type });
  };

  const errorHandler = (fn: (...args: any[]) => Promise<void> | void) => {
    return (...args: any[]) => {
      try {
        return fn(...args);
      } catch (error) {
        workareaStore.setError(error);
        rowStore.setError(error);
      }
    };
  };
  const readOnly: boolean = user.isbroker && props.personality === STRM;
  const sizeCell: ReactElement = (
    <Size key={2}
          type={type}
          className={getOrderStatusClass(store.status)}
          value={store.size}
          cancellable={true}
          readOnly={readOnly}
          chevron={(store.status & OrderStatus.HasDepth) !== 0}
          onCancel={store.cancel}
          onBlur={resetSize}
          onNavigate={onNavigate}
          onChange={onChangeSize}
          onSubmit={errorHandler(onSubmitSize(store))}/>
  );

  const items: ReactElement[] = [
    <Price
      key={1}
      status={store.status}
      value={store.price}
      min={store.minimumPrice}
      max={store.maximumPrice}
      className={'pod'}
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

