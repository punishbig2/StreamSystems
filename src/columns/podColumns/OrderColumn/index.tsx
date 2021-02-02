import { getAggregatedSize } from "columns/podColumns/OrderColumn/helpers/getAggregatedSize";
import { getOrderStatus } from "columns/podColumns/OrderColumn/helpers/getOrderStatus";
import { getRelevantOrders } from "columns/podColumns/OrderColumn/helpers/getRelevantOrders";
import { onSubmitPrice } from "columns/podColumns/OrderColumn/helpers/onSubmitPrice";
import { onSubmitSize } from "columns/podColumns/OrderColumn/helpers/onSubmitSize";
import { orderTicketRenderer } from "columns/podColumns/OrderColumn/helpers/orderTicketRenderer";
import { shouldOpenOrderTicket } from "columns/podColumns/OrderColumn/helpers/shoulOpenOrderTicket";
import { ModalWindow } from "components/ModalWindow";
import { onNavigate } from "components/PodTile/helpers";
import { Price } from "components/Table/CellRenderers/Price";
import { MiniDOB } from "components/Table/CellRenderers/Price/miniDob";
import { getOrderStatusClass } from "components/Table/CellRenderers/Price/utils/getOrderStatusClass";
import { Size } from "components/Table/CellRenderers/Size";
import { observer } from "mobx-react";
import { OrderStore } from "mobx/stores/orderStore";
import { PodRowStore } from "mobx/stores/podRowStore";
import workareaStore from "mobx/stores/workareaStore";
import React, { ReactElement, useEffect, useMemo, useState } from "react";
import { STRM } from "stateDefs/workspaceState";
import { OrderTypes } from "types/mdEntry";
import { Order, OrderStatus } from "types/order";
import { Role } from "types/role";
import { User } from "types/user";
import { ArrowDirection } from "types/w";

export enum PodTableType {
  Pod,
  Dob,
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
};

export const OrderColumn: React.FC<OwnProps> = observer(
  (props: OwnProps): ReactElement | null => {
    const {
      type,
      tableType,
      minimumSize,
      defaultSize,
      rowStore,
      orders,
    } = props;
    const [store] = useState<OrderStore>(new OrderStore());
    const { price, size } = store;
    const relevantOrders: Order[] = useMemo(
      (): Order[] => getRelevantOrders(orders, type),
      [orders, type]
    );
    // Used for the fallback order
    const { currency: symbol, strategy, tenor } = props;
    // It should never happen that this is {} as Order
    const order: Order =
      relevantOrders.length > 0
        ? relevantOrders[0]
        : ({ price: null, size: null, type, tenor, strategy, symbol } as Order);
    const user: User = workareaStore.user;
    const personality: string = workareaStore.personality;
    // Determine the status of the order now
    const status: OrderStatus = getOrderStatus(
      order,
      relevantOrders,
      tableType
    );
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
      const filtered: Order[] = relevantOrders.filter(
        (order: Order) => order.size !== null
      );
      if (filtered.length <= 1) return null;
      return <MiniDOB {...props} rows={filtered} orderStore={store} />;
    };

    const renderOrderTicket = orderTicketRenderer(store);
    const onDoubleClick = () => {
      if (!shouldOpenOrderTicket(order, personality, user)) return;
      const type: OrderTypes =
        store.type === OrderTypes.Bid ? OrderTypes.Ofr : OrderTypes.Bid;
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
    const isBroker: boolean = useMemo((): boolean => {
      const { roles } = user;
      return roles.includes(Role.Broker);
    }, [user]);
    const readOnly: boolean = isBroker && personality === STRM;
    const sizeCell: ReactElement = (
      <Size
        key={2}
        type={type}
        className={getOrderStatusClass(store.status)}
        value={size}
        cancellable={true}
        readOnly={readOnly}
        chevron={(store.status & OrderStatus.HasDepth) !== 0}
        onCancel={store.cancel}
        onNavigate={onNavigate}
        onSubmit={errorHandler(onSubmitSize(store))}
      />
    );

    const items: ReactElement[] = [
      <Price
        key={1}
        status={store.status}
        value={price}
        min={store.minimumPrice}
        max={store.maximumPrice}
        readOnly={readOnly}
        arrow={
          store.status & OrderStatus.HasDepth
            ? order.arrowDirection
            : ArrowDirection.None
        }
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
  }
);
