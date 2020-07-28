import { Order } from "types/order";
import { User } from "types/user";
import { STRM } from "stateDefs/workspaceState";

export const shouldOpenOrderTicket = (
  order: Order,
  personality: string,
  user: User
) => {
  if (user.isbroker && personality === STRM) return false;
  return order.price !== null && order.size !== null;
};
