import { PodRowProps } from "columns/podColumns/common";
import { ModalWindow } from "components/ModalWindow";
import { onNavigate } from "components/PodTile/helpers";
import { Price } from "components/Table/CellRenderers/Price";
import { PriceTypes } from "components/Table/CellRenderers/Price/priceTypes";
import { TableColumn } from "components/Table/tableColumn";
import { observer } from "mobx-react";
import workareaStore from "mobx/stores/workareaStore";
import React, { ReactElement, useMemo } from "react";
import { NONE } from "stateDefs/workspaceState";
import { DarkPoolOrder, Order, OrderStatus } from "types/order";
import { hasRole, Role } from "types/role";
import { User } from "types/user";
import { ArrowDirection } from "types/w";
import { skipTabIndexAll } from "utils/skipTab";
import { PodStore, PodStoreContext } from "mobx/stores/podStore";
import { DarkPoolTicket } from "components/DarkPoolTicket";
import { getOrderStatusClass } from "components/Table/CellRenderers/Price/utils/getOrderStatusClass";
import { OrderTypes } from "types/mdEntry";
import { API } from "API";
import { Sides } from "types/sides";
import { DarkPoolTooltip } from "components/Table/CellRenderers/Price/darkPoolTooltip";
import signalRClient from "signalR/signalRClient";
import { DarkPoolMessage } from "types/message";

type Props = PodRowProps & {
  readonly isDepth: boolean;
};

const DarkPoolColumnComponent: React.FC<Props> = observer((props: Props) => {
  const [isTicketOpen, setTicketOpen] = React.useState<boolean>(false);
  const { currency, strategy, tenor, isDepth, rowNumber } = props;
  const store = React.useContext<PodStore>(PodStoreContext);
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  const { darkPrices, darkOrders } = store;
  const { email, firm } = user;

  const price = React.useMemo(
    (): number | null => darkPrices[tenor] ?? null,
    [darkPrices, tenor]
  );

  const orders = React.useMemo(
    (): ReadonlyArray<Order> =>
      darkOrders[tenor]
        ?.filter(
          (order: Order): boolean => order.size !== null && order.price !== null
        )
        .sort((o1: Order, o2: Order): number => o1.timestamp - o2.timestamp) ??
      [],
    [darkOrders, tenor]
  );

  const myOrders = React.useMemo(
    (): ReadonlyArray<Order> => orders.filter(isMyOrder(user, personality)),
    [orders, personality, user]
  );

  const topOrder = React.useMemo((): Order | null => {
    if (isDepth) {
      return orders[rowNumber] ?? null;
    } else {
      const mine = orders.find((order: Order) => order.user === email);
      if (mine !== undefined) {
        return mine;
      }
      const bank = orders.find((order: Order) => order.firm === firm);
      if (bank !== undefined) {
        return bank;
      }

      return (
        orders.find(
          (order: Order) => order.price !== null && order.size !== null
        ) ?? null
      );
    }
  }, [email, firm, isDepth, orders, rowNumber]);

  const status = getDarkPoolOrderStatus(orders, topOrder);
  const closeTicket = React.useCallback((): void => setTicketOpen(false), []);
  const openTicket = React.useCallback((): void => setTicketOpen(true), []);
  const onTicketSubmitted = React.useCallback(
    async (order: DarkPoolOrder): Promise<void> => {
      const user: User = workareaStore.user;
      closeTicket();

      const currentOrder: Order | undefined = orders.find((o: Order) => {
        if (o.type === OrderTypes.Bid && order.Side !== Sides.Buy) return false;
        if (o.type === OrderTypes.Ofr && order.Side !== Sides.Sell)
          return false;
        return user.email === o.user;
      });
      // if (currentOrder) await API.cancelDarkPoolOrder(currentOrder);
      await API.createDarkPoolOrder({
        ...(currentOrder ? { OrderID: currentOrder.orderId } : {}),
        ...order,
      });
    },
    [closeTicket, orders]
  );
  const onCancelOrder = React.useCallback((order: Order): void => {
    void API.cancelDarkPoolOrder(order);
  }, []);

  const renderTicket = (): ReactElement | null => {
    if (price === null) return null;

    return (
      <DarkPoolTicket
        price={price}
        minimumSize={props.minimumSize}
        tenor={tenor}
        strategy={props.strategy}
        symbol={props.currency}
        onSubmit={onTicketSubmitted}
        onCancel={closeTicket}
      />
    );
  };

  const renderTooltip = React.useCallback((): React.ReactElement | null => {
    if (isDepth) {
      if (topOrder === null) {
        return null;
      }

      if (isMyOrder(user, personality)(topOrder)) {
        return (
          <DarkPoolTooltip
            onCancelOrder={onCancelOrder}
            orders={[topOrder]}
            showInstruction={true}
          />
        );
      }
      return null;
    } else {
      const depth: ReadonlyArray<Order> = myOrders;
      if (depth.length === 0) return null;
      const showInstruction = depth.some((order: Order): boolean => {
        if ((order.status & OrderStatus.Owned) === 0) return false;
        return order.instruction !== undefined;
      });

      return (
        <DarkPoolTooltip
          onCancelOrder={onCancelOrder}
          orders={depth}
          showInstruction={showInstruction}
        />
      );
    }
  }, [isDepth, myOrders, onCancelOrder, personality, topOrder, user]);

  const onPriceCleared = React.useCallback((): void => {
    store.setDarkPoolPrice(tenor, null);
  }, [store, tenor]);

  const onPricePublished = React.useCallback(
    (message: DarkPoolMessage): void => {
      const price = ((): number | null => {
        if (message.DarkPrice === "") {
          return null;
        }

        const value = Number(message.DarkPrice);
        if (isNaN(value)) {
          return null;
        }

        return value;
      })();

      store.setDarkPoolPrice(message.Tenor, price);
    },
    [store]
  );

  React.useEffect((): (() => void) | undefined => {
    const stopListener1 = signalRClient.addDarkPoolClearListener(
      currency,
      strategy,
      tenor,
      onPriceCleared
    );
    const stopListener2 = signalRClient.addDarkPoolPriceListener(
      currency,
      strategy,
      tenor,
      onPricePublished
    );

    return (): void => {
      stopListener1();
      stopListener2();
    };
  }, [currency, onPriceCleared, onPricePublished, store, strategy, tenor]);

  const publish = React.useCallback(
    (price: number): void => {
      const user = workareaStore.user;
      // Update it for us immediately
      store.setDarkPoolPrice(tenor, price);
      // Publish it for others
      API.publishDarkPoolPrice(
        user.email,
        currency,
        strategy,
        tenor,
        price
      ).then((): Promise<void> => {
        return API.cancelAllDarkPoolOrder(currency, strategy, tenor);
      });
    },
    [currency, store, strategy, tenor]
  );

  const clear = (): void => {
    const user = workareaStore.user;
    // Update it for us immediately
    store.setDarkPoolPrice(tenor, null);
    // Publish it for others
    void API.clearDarkPoolPrice(user.email, currency, strategy, tenor);
    void API.cancelAllDarkPoolOrder(currency, strategy, tenor);
  };

  const onSubmit = (
    input: HTMLInputElement,
    price: number | null,
    changed: boolean
  ) => {
    skipTabIndexAll(input, 5, 2);
    if (!changed) return;
    if (price !== null) {
      publish(price);
    } else {
      clear();
    }
  };

  const isBroker: boolean = useMemo((): boolean => {
    const { roles } = user;
    return hasRole(roles, Role.Broker);
  }, [user]);

  const onDoubleClick = React.useCallback((): void => {
    if (price == null) {
      return;
    }

    if (isBroker && personality === NONE) return;
    // Show the thing
    openTicket();
  }, [isBroker, openTicket, personality, price]);

  if (user === null)
    throw new Error(
      "cannot show a dark pool column if there is no authenticated user"
    );

  const className = getOrderStatusClass(status);

  return (
    <>
      <Price
        arrow={ArrowDirection.None}
        priceType={PriceTypes.DarkPool}
        className={className}
        value={price}
        tooltip={renderTooltip}
        readOnly={(personality !== NONE && isBroker) || !isBroker}
        status={status}
        allowZero={true}
        onDoubleClick={onDoubleClick}
        onSubmit={onSubmit}
        onNavigate={onNavigate}
      />
      <ModalWindow render={renderTicket} isOpen={isTicketOpen} />
    </>
  );
});

export const DarkPoolColumn = (depth: boolean): TableColumn => ({
  name: "dark-pool",
  header: () => (
    <div className={"dark-pool-header"}>
      <div>Dark</div>
      <div>Pool</div>
    </div>
  ),
  render: (row: PodRowProps) => (
    <DarkPoolColumnComponent {...row} isDepth={depth} />
  ),
  template: "999999.99",
  width: 5,
});

const getDarkPoolOrderStatus = (
  orders: ReadonlyArray<Order>,
  currentOrder: Order | null
): OrderStatus => {
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  const { roles } = user;
  const isBroker = hasRole(roles, Role.Broker);
  if (!currentOrder) return OrderStatus.None | OrderStatus.DarkPool;
  const isSameFirm = isBroker
    ? currentOrder.firm === personality
    : currentOrder.firm === user.firm;
  if (currentOrder.size === null)
    return OrderStatus.None | OrderStatus.DarkPool;
  const hasDepthStatus =
    orders.length > 0 && !orders.every(isMyOrder(user, personality))
      ? OrderStatus.HasDepth
      : OrderStatus.None;
  const hasMyOrderStatus = orders.find(isMyOrder(user, personality))
    ? OrderStatus.HasMyOrder
    : OrderStatus.None;

  if (hasMyOrderStatus) {
    if (orders.length === 1) {
      return (
        OrderStatus.FullDarkPool |
        OrderStatus.DarkPool |
        OrderStatus.Owned |
        hasDepthStatus
      );
    }

    return OrderStatus.DarkPool | OrderStatus.Owned | hasDepthStatus;
  } else if (isSameFirm) {
    return (
      OrderStatus.DarkPool |
      OrderStatus.SameBank |
      hasDepthStatus |
      hasMyOrderStatus
    );
  }

  return OrderStatus.DarkPool | hasDepthStatus | hasMyOrderStatus;
};

const isMyOrder =
  (user: User, personality: string): ((order: Order) => boolean) =>
  (order: Order): boolean => {
    const { roles } = user;
    const isBroker = hasRole(roles, Role.Broker);

    return isBroker
      ? order.firm === personality && order.user === user.email
      : order.user === user.email;
  };
