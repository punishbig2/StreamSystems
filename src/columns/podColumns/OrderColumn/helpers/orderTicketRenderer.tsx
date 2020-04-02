import React, { ReactElement } from 'react';
import { Order } from 'interfaces/order';
import { createOrder } from 'components/PodTile/helpers';
import { OrderTicket } from 'components/OrderTicket';
import { User } from 'interfaces/user';

export const orderTicketRenderer = (orderTicket: any, minimumSize: number, personality: string, user: User, reset: () => void) =>
  (): ReactElement | null => {
    if (orderTicket === null)
      return null;
    const onSubmit = (order: Order) => {
      createOrder(order, minimumSize, personality, user);
      // Remove the internal order ticket
      reset();
    };
    return (
      <OrderTicket order={orderTicket} minimumSize={minimumSize} onCancel={reset} onSubmit={onSubmit}/>
    );
  };
