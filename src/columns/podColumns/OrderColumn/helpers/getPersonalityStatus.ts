import { Order, OrderStatus } from "types/order";
import { Role } from "types/role";
import { User } from "types/user";

export const getPersonalityStatus = (
  order: Order,
  user: User,
  personality: string
): OrderStatus => {
  if (order.user !== user.email) return OrderStatus.None;
  const { roles } = user;
  const isBroker: boolean = roles.includes(Role.Broker);
  if (!isBroker) return OrderStatus.Owned;
  // If the user is a broker then it's only owned if it belongs
  // to the same firm too
  return order.firm !== personality ? OrderStatus.Owned : OrderStatus.None;
};
