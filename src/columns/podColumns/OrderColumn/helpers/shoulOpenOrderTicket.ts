import { Order } from 'interfaces/order';
import { User } from 'interfaces/user';
import { STRM } from 'stateDefs/workspaceState';

export const shouldOpenOrderTicket = (order: Order, personality: string, user: User) => {
  if (user.isbroker && personality === STRM)
    return false;
  return order.price !== null && order.size !== null;
};
