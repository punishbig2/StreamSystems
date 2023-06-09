import { getAggregatedSize } from 'columns/podColumns/OrderColumn/helpers/getAggregatedSize';
import { getOrderStatus } from 'columns/podColumns/OrderColumn/helpers/getOrderStatus';
import { getRelevantOrders } from 'columns/podColumns/OrderColumn/helpers/getRelevantOrders';
import { onSubmitPrice } from 'columns/podColumns/OrderColumn/helpers/onSubmitPrice';
import { onSubmitSize } from 'columns/podColumns/OrderColumn/helpers/onSubmitSize';
import { orderTicketRenderer } from 'columns/podColumns/OrderColumn/helpers/orderTicketRenderer';
import { shouldOpenOrderTicket } from 'columns/podColumns/OrderColumn/helpers/shoulOpenOrderTicket';
import { ModalWindow } from 'components/ModalWindow';
import { onNavigate } from 'components/PodTile/helpers';
import { Price } from 'components/Table/CellRenderers/Price';
import { MiniDOB } from 'components/Table/CellRenderers/Price/miniDob';
import { getOrderStatusClass } from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import { Size } from 'components/Table/CellRenderers/Size';
import { OrderStore } from 'mobx/stores/orderStore';
import { PodRowStore, PodRowStoreContext } from 'mobx/stores/podRowStore';
import workareaStore from 'mobx/stores/workareaStore';
import { observer } from 'mobx-react';
import React, { ReactElement, useEffect, useMemo } from 'react';
import { NONE } from 'stateDefs/workspaceState';
import { OrderTypes } from 'types/mdEntry';
import { Order, OrderStatus } from 'types/order';
import { hasRole, Role } from 'types/role';
import { User } from 'types/user';
import { ArrowDirection } from 'types/w';

export enum PodTableType {
  Pod,
  Dob,
}

type OwnProps = {
  readonly orders: readonly Order[];
  readonly type: OrderTypes;
  readonly currency: string;
  readonly strategy: string;
  readonly tenor: string;
  readonly minimumSize: number;
  readonly defaultSize: number;
  readonly tableType: PodTableType;
  readonly forceEditable: boolean;
};

export const OrderColumn: React.FC<OwnProps> = observer((props: OwnProps): ReactElement | null => {
  const { type, tableType, minimumSize, defaultSize, orders } = props;
  const [store] = React.useState<OrderStore>(new OrderStore());
  const { price, size } = store;
  const relevantOrders: readonly Order[] = useMemo(
    (): readonly Order[] => getRelevantOrders(orders, type),
    [orders, type]
  );
  // Used for the fallback order
  const { currency, strategy, tenor } = props;
  // It should never happen that this is {} as Order
  const order: Order = React.useMemo(
    (): Order =>
      relevantOrders.length > 0
        ? relevantOrders[0]
        : new Order(tenor, currency, strategy, '', null, type),
    [currency, relevantOrders, strategy, tenor, type]
  );
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  // Determine the status of the order now
  const status: OrderStatus = getOrderStatus(order, relevantOrders, tableType);
  const rowStore = React.useContext<PodRowStore>(PodRowStoreContext);

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

  const renderTooltip = (): ReactElement | null => {
    const filtered: Order[] = relevantOrders.filter((order: Order) => order.size !== null);
    if (filtered.length <= 1) return null;
    return <MiniDOB {...props} rows={filtered} orderStore={store} />;
  };

  const renderOrderTicket = orderTicketRenderer(store);
  const onDoubleClick = (): void => {
    if (!shouldOpenOrderTicket(order, personality, user)) return;
    const type: OrderTypes = store.type === OrderTypes.Bid ? OrderTypes.Ofr : OrderTypes.Bid;
    const size: number | null = getAggregatedSize(order, store.depth);
    // Replace the inferred type to create an opposing order
    store.setOrderTicket({ ...order, type, size });
  };

  const errorHandler = (fn: (...args: any[]) => Promise<void> | void) => {
    return async (...args: any[]) => {
      try {
        return await fn(...args);
      } catch (error) {
        rowStore.setError(error);
      }
    };
  };
  const isBroker: boolean = useMemo((): boolean => {
    const { roles } = user;
    return hasRole(roles, Role.Broker);
  }, [user]);
  const readOnly: boolean = !props.forceEditable && isBroker && personality === NONE;
  const hasDepth = (store.status & OrderStatus.HasDepth) !== 0;
  // / If we find an order that can be cancelled, then it is cancellable
  const cancellable = store.cancelOrder !== null;

  const sizeCell: ReactElement = (
    <Size
      key={2}
      uid={'S' + store.uid() + type}
      type={type}
      value={size}
      cancellable={cancellable}
      readOnly={readOnly}
      chevron={hasDepth}
      className={getOrderStatusClass(store.status)}
      onCancel={store.cancel}
      onNavigate={onNavigate}
      onSubmit={errorHandler(onSubmitSize(store))}
    />
  );

  const items: ReactElement[] = [
    <Price
      key={1}
      uid={'P' + store.uid() + type}
      status={store.status}
      value={price}
      min={store.minimumPrice}
      max={store.maximumPrice}
      readOnly={readOnly}
      arrow={store.status & OrderStatus.HasDepth ? order.arrowDirection : ArrowDirection.None}
      allowZero={true}
      tooltip={renderTooltip}
      onDoubleClick={onDoubleClick}
      onSubmit={errorHandler(onSubmitPrice(store))}
      onNavigate={onNavigate}
    />,
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
      <ModalWindow render={renderOrderTicket} isOpen={!!store.orderTicket} />
      {items}
    </>
  );
});
