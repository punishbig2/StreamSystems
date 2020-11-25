import { Order } from "types/order";
import { Role } from "types/role";
import { User } from "types/user";
import { STRM } from "stateDefs/workspaceState";

export const shouldOpenOrderTicket = (
  order: Order,
  personality: string,
  user: User
) => {
  const { roles } = user;
  const isBroker: boolean = roles.includes(Role.Broker);
  if (isBroker && personality === STRM) return false;
  return order.price !== null && order.size !== null;
};
