import React, { ReactElement } from "react";
import { Order } from "types/order";
import { OrderTicket } from "components/OrderTicket";
import { OrderStore } from "mobx/stores/orderStore";

export const orderTicketRenderer = (
  store: OrderStore
) => (): ReactElement | null => {
  if (store.orderTicket === null) return null;
  const onSubmit = (order: Order) => {
    if (store.orderTicket) {
      store.createWithType(order.price, order.size, order.type, true);
    }
    store.unsetOrderTicket();
  };
  return (
    <OrderTicket
      order={store.orderTicket}
      minimumSize={store.minimumSize}
      onCancel={store.unsetOrderTicket}
      onSubmit={onSubmit}
    />
  );
};
