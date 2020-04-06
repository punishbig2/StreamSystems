import { Order, OrderStatus } from 'interfaces/order';
import { API } from 'API';
import { NavigateDirection } from 'components/NumericInput/navigateDirection';
import { skipTabIndexAll } from 'utils/skipTab';
import { User } from 'interfaces/user';
import { SignalRManager } from 'redux/signalR/signalRManager';
import { OrderTypes } from 'interfaces/mdEntry';

export const findMyOrder_ = (currency: string, strategy: string, tenor: string, type: OrderTypes, user: User): Order | undefined => {
  const haystack: Order[] = SignalRManager.getDepth(currency, strategy, tenor, type);
  const found: Order | undefined = haystack
    .find((needle: Order) => {
      return needle.user === user.email;
    });
  if (found !== undefined)
    return found;
  // No order was found
  return undefined;
};

export const findMyOrder = (topOrder: Order, user: User): Order | undefined => {
  if (topOrder.user === user.email)
    return topOrder;
  const haystack: Order[] = SignalRManager.getDepth(topOrder.symbol, topOrder.strategy, topOrder.tenor, topOrder.type);
  const found: Order | undefined = haystack
    .find((needle: Order) => {
      return needle.user === user.email;
    });
  if (found !== undefined)
    return found;
  // No order was found
  return undefined;
};

export const createOrder = async (order: Order, minimumSize: number, personality: string, user: User) => {
  if (order.symbol === '' || order.strategy === '') {
    console.warn('please give me symbol and strategy');
    return;
  }
  if (order.price !== null) {
    const myOrder: Order | undefined = findMyOrder(order, user);
    if (myOrder !== undefined && (myOrder.status & OrderStatus.Cancelled) === 0) {
      if ((user.isbroker && order.firm === personality) || !user.isbroker) {
        await API.cancelOrder(myOrder, user);
      }
    }
    await API.createOrder(order, personality, user, minimumSize);
  } else {
    throw new Error('attempting to create an invalid order');
  }
};

export const cancelOrder = (order: Order, user: User) => {
  const myOrder: Order | undefined = findMyOrder(order, user);
  if (myOrder) {
    API.cancelOrder(myOrder, user);
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
