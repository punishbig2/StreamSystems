import { Order } from "types/order";
import { hasRole, Role } from "types/role";
import { User } from "types/user";
import { NONE } from "stateDefs/workspaceState";

export const shouldOpenOrderTicket = (
  order: Order,
  personality: string,
  user: User
) => {
  const { roles } = user;
  const isBroker: boolean = hasRole(roles, Role.Broker);
  if (isBroker && personality === NONE) return false;
  return order.price !== null && order.size !== null;
};
