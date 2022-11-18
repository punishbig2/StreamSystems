import { NONE } from 'stateDefs/workspaceState';
import { Order } from 'types/order';
import { hasRole, Role } from 'types/role';
import { User } from 'types/user';

export const shouldOpenOrderTicket = (order: Order, personality: string, user: User): boolean => {
  const { roles } = user;
  const isBroker: boolean = hasRole(roles, Role.Broker);
  if (isBroker && personality === NONE) return false;
  return order.price !== null && order.size !== null;
};
