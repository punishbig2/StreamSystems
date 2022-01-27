import { OrderTicket } from "components/OrderTicket";
import { OrderStore } from "mobx/stores/orderStore";
import React, { ReactElement } from "react";
import { Order } from "types/order";

export const orderTicketRenderer =
  (store: OrderStore) => (): ReactElement | null => {
    if (store.orderTicket === null) return null;
    const onSubmit = (order: Order): void => {
      if (store.orderTicket) {
        store
          .createWithType(order.price, order.size, order.type, false)
          .catch(console.warn);
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
