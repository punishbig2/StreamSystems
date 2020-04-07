import React, { ReactElement, useEffect, useState } from 'react';
import { Order, OrderStatus } from 'interfaces/order';
import { OrderTypes } from 'interfaces/mdEntry';
import { Size } from 'components/Table/CellRenderers/Size';
import { getOrderStatusClass } from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import { Price } from 'components/Table/CellRenderers/Price';
import { STRM } from 'redux/stateDefs/workspaceState';
import { PodTable } from 'interfaces/podTable';
import { onNavigate } from 'components/PodTile/helpers';
import { ModalWindow } from 'components/ModalWindow';
import { PodRowStatus } from 'interfaces/podRow';
import { getOrder } from 'columns/podColumns/OrderColumn/helpers/getOrder';
import { ArrowDirection } from 'interfaces/w';
import { User } from 'interfaces/user';
import { OrderStore } from 'mobx/stores/orderStore';
import { orderTicketRenderer } from 'columns/podColumns/OrderColumn/helpers/orderTicketRenderer';
import { observer } from 'mobx-react';
import { onSubmitPrice } from 'columns/podColumns/OrderColumn/helpers/onSubmitPrice';
import { getOrderStatus } from 'columns/podColumns/OrderColumn/helpers/getOrderStatus';
import { SignalRManager } from 'redux/signalR/signalRManager';
import { MiniDOB } from 'components/Table/CellRenderers/Price/miniDob';
import { shouldOpenOrderTicket } from 'columns/podColumns/OrderColumn/helpers/shoulOpenOrderTicket';

export enum PodTableType {
  Pod, Dob
}

type OwnProps = {
  depths: { [key: string]: PodTable };
  ofr: Order;
  bid: Order;
  type: OrderTypes;
  personality: string;
  user: User;
  minimumSize: number;
  defaultSize: number;
  onRowStatusChange: (status: PodRowStatus) => void;
  tableType: PodTableType;
}

/*const getPriceIfApplies = (order: Order | undefined): number | undefined => {
  if (order === undefined)
    return undefined;
  if ((order.status & OrderStatus.SameBank) !== 0)
    return order.price as number;
  return undefined;
};*/

export const OrderColumn: React.FC<OwnProps> = observer((props: OwnProps) => {
  const [store] = useState<OrderStore>(new OrderStore());
  const { minimumSize, defaultSize } = props;
  const { type, personality, tableType } = props;
  // Get the order from the row
  const order: Order = getOrder(type, props.ofr, props.bid);
  // Create size submission listener
  const user: User = props.user;
  // Some changes require the store to be updated
  useEffect(() => {
    if (!order)
      return;
    const status: OrderStatus = getOrderStatus(order, user, personality, tableType);
    // This is the actual action, the others are just for setup
    store.setOrder({ ...order, status });
  }, [order, personality, store, tableType, user]);

  useEffect(() => {
    store.setPersonality(personality);
  }, [store, personality]);

  useEffect(() => {
    store.setUser(user);
  }, [store, user]);
  // Watch for default and minimum sizes
  useEffect(() => {
    store.setDefaultAndMinimumSizes(defaultSize, minimumSize);
  }, [store, minimumSize, defaultSize]);

  const resetSize = () => store.setEditedSize(store.submittedSize);
  const onChangeSize = (value: string | null) => store.setEditedSize(Number(value));
  const onSubmitSize = () => null;
  const renderTooltip = (): ReactElement | null => {
    const depth: Order[] = SignalRManager.getDepth(store.symbol, store.strategy, store.tenor, store.type);
    if (depth.length === 0)
      return null;
    return <MiniDOB {...props} rows={depth} user={user}/>;
  };

  const renderOrderTicket = orderTicketRenderer(
    store.orderTicket,
    minimumSize,
    personality,
    user,
    store.unsetOrderTicket,
  );

  const onDoubleClick = () => {
    if (!shouldOpenOrderTicket(order, props.personality, user))
      return;
    const type: OrderTypes = order.type === OrderTypes.Bid ? OrderTypes.Ofr : OrderTypes.Bid;
    // Replace the inferred type to create an opposing order
    store.setOrderTicket({ ...order, type });
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
          onSubmit={onSubmitSize}/>
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
      onSubmit={onSubmitPrice(store)}
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

