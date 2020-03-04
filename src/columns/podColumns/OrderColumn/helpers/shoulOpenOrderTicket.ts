import {Order} from 'interfaces/order';
import {User} from 'interfaces/user';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {STRM} from 'redux/stateDefs/workspaceState';

export const shouldOpenOrderTicket = (order: Order, personality: string) => {
  const user: User = getAuthenticatedUser();
  if (user.isbroker && personality === STRM)
    return false;
  return order.price !== null && order.size !== null;
};
