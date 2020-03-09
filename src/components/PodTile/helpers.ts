import {Order, OrderStatus} from 'interfaces/order';
import {API} from 'API';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {skipTabIndexAll} from 'utils/skipTab';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {User} from 'interfaces/user';
import {SignalRManager} from 'redux/signalR/signalRManager';
import {PodRowStatus} from 'interfaces/podRow';

export const findMyOrder = (topOrder: Order): Order | undefined => {
  const user: User = getAuthenticatedUser();
  if (topOrder.user === user.email)
    return topOrder;
  const orders: Order[] = SignalRManager.getDepth(topOrder.symbol, topOrder.strategy, topOrder.tenor, topOrder.type);
  const found: Order | undefined = orders
    .find((order: Order) => {
      return order.user === user.email;
    });
  if (found !== undefined)
    return found;
  // No order was found
  return undefined;
};

export const createOrder = async (order: Order, minimumSize: number, personality: string) => {
  if (order.price !== null) {
    // Find my own order and cancel it
    const myOrder: Order | undefined = findMyOrder(order);
    if (myOrder && (myOrder.status & OrderStatus.Cancelled) === 0)
      await API.cancelOrder(myOrder);
    await API.createOrder(order, personality, minimumSize);
  } else {
    throw new Error('attempting to create an invalid order');
  }
};

export const cancelOrder = (order: Order) => {
  const myOrder: Order | undefined = findMyOrder(order);
  if (myOrder) {
    API.cancelOrder(myOrder);
  }
};

export const onNavigate = (input: HTMLInputElement, direction: NavigateDirection) => {
  switch (direction) {
    case NavigateDirection.Up:
      skipTabIndexAll(input, -5, 'last-row');
      break;
    case NavigateDirection.Left:
      skipTabIndexAll(input, -1);
      break;
    case NavigateDirection.Down:
      skipTabIndexAll(input, 5, 'first-row');
      break;
    case NavigateDirection.Right:
      skipTabIndexAll(input, 1);
      break;
  }
};
