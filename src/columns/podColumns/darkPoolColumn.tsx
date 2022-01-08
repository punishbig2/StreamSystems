import { PodRowProps } from "columns/podColumns/common";
import { DarkPoolTicket } from "components/DarkPoolTicket";
import { ModalWindow } from "components/ModalWindow";
import { onNavigate } from "components/PodTile/helpers";
import { Price } from "components/Table/CellRenderers/Price";
import { DarkPoolTooltip } from "components/Table/CellRenderers/Price/darkPoolTooltip";
import { PriceTypes } from "components/Table/CellRenderers/Price/priceTypes";
import { TableColumn } from "components/Table/tableColumn";
import { observer } from "mobx-react";
import { DarkPoolStore, DarkPoolStoreContext } from "mobx/stores/darkPoolStore";
import workareaStore from "mobx/stores/workareaStore";
import React, { ReactElement, useEffect, useMemo } from "react";
import { STRM } from "stateDefs/workspaceState";
import { DarkPoolOrder, Order, OrderStatus } from "types/order";
import { Role } from "types/role";
import { User } from "types/user";
import { ArrowDirection } from "types/w";
import { skipTabIndexAll } from "utils/skipTab";
import { PodStoreContext, PodStore } from "mobx/stores/podStore";
import { getOrderStatusClass } from "../../components/Table/CellRenderers/Price/utils/getOrderStatusClass";

type Props = PodRowProps;

const DarkPoolColumnComponent: React.FC<Props> = observer((props: Props) => {
  const { darkPrice, currency, strategy, tenor, darkpool } = props;
  const podStore = React.useContext<PodStore>(PodStoreContext);
  const store = React.useContext<DarkPoolStore>(DarkPoolStoreContext);
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  const { connected } = workareaStore;

  const w = React.useMemo(
    () => podStore.darkPoolOrders[props.tenor],
    [podStore.darkPoolOrders, props.tenor]
  );

  React.useEffect((): void => {
    store.onOrderReceived(w);
  }, [store, w]);

  React.useEffect((): void => {
    if (darkPrice === undefined) return;
    store.setDarkPrice(darkPrice);
  }, [darkPrice, store]);

  React.useEffect(() => {
    if (!darkpool) return;
    store.onOrderReceived(darkpool);
  }, [store, darkpool, user]);

  const onTicketSubmitted = (order: DarkPoolOrder) => {
    store.createOrder(order).catch(console.warn);
  };

  const renderTicket = (): ReactElement | null => {
    if (store.price === null) return null;
    return (
      <DarkPoolTicket
        price={store.price}
        minimumSize={props.minimumSize}
        tenor={tenor}
        strategy={strategy}
        symbol={currency}
        onSubmit={onTicketSubmitted}
        onCancel={() => store.closeTicket()}
      />
    );
  };

  const renderTooltip = () => {
    const depth: Order[] = store.depth;
    if (depth.length === 0) return null;
    const showInstruction = depth.some((order: Order): boolean => {
      if ((order.status & OrderStatus.Owned) === 0) return false;
      return order.instruction !== undefined;
    });
    return (
      <DarkPoolTooltip
        onCancelOrder={store.cancel}
        orders={depth}
        showInstruction={showInstruction}
      />
    );
  };

  useEffect(() => {
    if (currency === "" || strategy === "") return;
    store.onOrderReceived(podStore.darkPoolOrders[tenor]);
    return store.connect(currency, strategy, tenor);
  }, [currency, store, strategy, tenor, connected, podStore.darkPoolOrders]);

  const clear = React.useCallback(
    store.getClearDarkPoolPriceCallback(currency, strategy, tenor),
    [currency, strategy, tenor]
  );

  const publish = React.useCallback(
    (price: number): void => {
      void store.publishPrice(currency, strategy, tenor, price);
    },
    [currency, store, strategy, tenor]
  );

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
    return roles.includes(Role.Broker);
  }, [user]);

  const onDoubleClick = () => {
    if (
      (store.publishedPrice === null || store.publishedPrice === undefined) &&
      !store.currentOrder
    ) {
      return;
    }
    if (isBroker && personality === STRM) return;
    store.openTicket();
  };

  if (user === null)
    throw new Error(
      "cannot show a dark pool column if there is no authenticated user"
    );

  const className = getOrderStatusClass(store.status);

  return (
    <>
      <Price
        arrow={ArrowDirection.None}
        priceType={PriceTypes.DarkPool}
        className={className}
        value={store.price}
        tooltip={renderTooltip}
        readOnly={(personality !== STRM && isBroker) || !isBroker}
        status={store.status}
        allowZero={true}
        onDoubleClick={onDoubleClick}
        onSubmit={onSubmit}
        onNavigate={onNavigate}
      />
      <ModalWindow render={renderTicket} isOpen={store.isTicketOpen} />
    </>
  );
});

export const DarkPoolColumn = (): TableColumn => ({
  name: "dark-pool",
  header: () => (
    <div className={"dark-pool-header"}>
      <div>Dark</div>
      <div>Pool</div>
    </div>
  ),
  render: (row: PodRowProps) => <DarkPoolColumnComponent {...row} />,
  template: "999999.99",
  width: 5,
});
