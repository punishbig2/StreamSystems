import { OrderStatus, Order } from 'interfaces/order';
import { getAggregatedSize } from 'columns/podColumns/OrderColumn/helpers/getAggregatedSize';
import { User } from 'interfaces/user';
import { SignalRManager } from 'redux/signalR/signalRManager';

export const getOrderStatus = (topOrder: Order, user: User, personality: string) => {
  let status: OrderStatus = OrderStatus.None;
  const depth: Order[] = SignalRManager.getDepth(topOrder.symbol, topOrder.strategy, topOrder.tenor, topOrder.type)
    .filter(({ size }: Order) => size !== null);
  const ownOrder: Order | undefined = depth.find(({ user: email }: Order) => email === user.email);
  // Get depth related status
  status |= depth.length > 1 ? OrderStatus.HasDepth : OrderStatus.None;
  status |= (!!ownOrder && ownOrder.orderId !== topOrder.orderId) ? OrderStatus.HasMyOrder : OrderStatus.None;
  // If it's the same firm the order belongs to the same bank
  status |= topOrder.firm === user.firm ? OrderStatus.SameBank : OrderStatus.None;
  // If it's the same username the order belongs to the user
  status |= topOrder.user === user.email ? OrderStatus.Owned : OrderStatus.None;
  // If the size of the order doesn't match the aggregated size, it's a joined order
  status |= topOrder.size !== getAggregatedSize(topOrder) ? OrderStatus.Joined : OrderStatus.None;
  // If the size is not present it's a cancelled order by convention
  status |= topOrder.size === null ? OrderStatus.Cancelled : OrderStatus.None;
  // If the user is a broker, the order is only owned if it also belongs to the same firm
  status &= (user.isbroker && personality !== user.firm) ? ~OrderStatus.Owned : ~OrderStatus.None;
  // We finally have the definitive status
  return status;
};
