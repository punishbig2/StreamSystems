import React, { ReactElement } from 'react';
import { Order } from 'interfaces/order';
import { OrderTicket } from 'components/OrderTicket';
import { OrderStore } from 'mobx/stores/orderStore';
import { OrderTypes } from 'interfaces/mdEntry';
import { getSideFromType } from 'utils';

export const orderTicketRenderer = (store: OrderStore) =>
  (): ReactElement | null => {
    if (store.orderTicket === null)
      return null;
    const onSubmit = (order: Order) => {
      if (store.orderTicket) {
        const oldStoreType: OrderTypes = store.type;
        store.createWithType(order.price, order.size, order.type);
      }
      store.unsetOrderTicket();
    };
    return (
      <OrderTicket order={store.orderTicket}
                   minimumSize={store.minimumSize}
                   onCancel={store.unsetOrderTicket}
                   onSubmit={onSubmit}/>
    );
  };
