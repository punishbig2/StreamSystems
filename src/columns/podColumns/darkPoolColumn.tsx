import { PodRowProps } from "columns/podColumns/common";
import { DarkPoolTicket } from "components/DarkPoolTicket";
import { ModalWindow } from "components/ModalWindow";
import { onNavigate } from "components/PodTile/helpers";
import { Price } from "components/Table/CellRenderers/Price";
import { DarkPoolTooltip } from "components/Table/CellRenderers/Price/darkPoolTooltip";
import { PriceTypes } from "components/Table/CellRenderers/Price/priceTypes";
import { ColumnSpec } from "components/Table/columnSpecification";
import { observer } from "mobx-react";
import { DarkPoolStore } from "mobx/stores/darkPoolStore";
import workareaStore from "mobx/stores/workareaStore";
import React, { ReactElement, useEffect, useState } from "react";
import { STRM } from "stateDefs/workspaceState";
import { DarkPoolOrder, Order, OrderStatus } from "types/order";
import { User } from "types/user";
import { ArrowDirection } from "types/w";
import { skipTabIndexAll } from "utils/skipTab";

type Props = PodRowProps;

const DarkPoolColumnComponent: React.FC<Props> = observer((props: Props) => {
  const [store] = useState<DarkPoolStore>(new DarkPoolStore());
  const { currency, strategy, tenor, darkpool } = props;
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;

  useEffect(() => {
    if (!darkpool) return;
    store.onOrderReceived(darkpool);
  }, [store, darkpool, user]);

  const onTicketSubmitted = (order: DarkPoolOrder) => {
    store.createOrder(order);
  };

  const renderTicket = (): ReactElement | null => {
    if (store.price === null) return null;
    return (
      <DarkPoolTicket
        price={store.price}
        minimumSize={props.minimumSize}
        tenor={tenor}
        strategy={strategy}
        currency={currency}
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
    store.connect(currency, strategy, tenor);
    return () => {
      store.disconnect(currency, strategy, tenor);
    };
  }, [currency, store, strategy, tenor]);

  const onSubmit = (
    input: HTMLInputElement,
    price: number | null,
    changed: boolean
  ) => {
    skipTabIndexAll(input, 5, 2);
    if (!changed) return;
    store.publishPrice(currency, strategy, tenor, price);
  };

  const onDoubleClick = () => {
    if (!store.publishedPrice && !store.currentOrder) return;
    if (user.isbroker && personality === STRM) return;
    store.openTicket();
  };

  if (user === null)
    throw new Error(
      "cannot show a dark pool column if there is no authenticated user"
    );
  return (
    <>
      <Price
        arrow={ArrowDirection.None}
        priceType={PriceTypes.DarkPool}
        className={"dark-pool-base"}
        value={store.price}
        tooltip={renderTooltip}
        readOnly={(personality !== STRM && user.isbroker) || !user.isbroker}
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

export const DarkPoolColumn = (): ColumnSpec => ({
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
