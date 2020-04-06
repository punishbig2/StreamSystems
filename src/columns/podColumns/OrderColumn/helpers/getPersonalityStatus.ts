import { OrderStatus, Order } from 'interfaces/order';
import { User } from 'interfaces/user';

export const getPersonalityStatus = (order: Order, user: User, personality: string): OrderStatus => {
  if (order.user !== user.email)
    return OrderStatus.None;
  if (!user.isbroker)
    return OrderStatus.Owned;
  // If the user is a broker then it's only owned if it belongs
  // to the same firm too
  return order.firm !== personality ? OrderStatus.Owned : OrderStatus.None;
};
