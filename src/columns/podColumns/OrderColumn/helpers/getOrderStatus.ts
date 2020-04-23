import { OrderStatus, Order } from 'interfaces/order';
import { getAggregatedSize } from 'columns/podColumns/OrderColumn/helpers/getAggregatedSize';
import { User } from 'interfaces/user';
import { PodTableType } from 'columns/podColumns/OrderColumn/index';
import workareaStore from 'mobx/stores/workareaStore';

export const getOrderStatus = (topOrder: Order | undefined, depth: Order[], tableType: PodTableType) => {
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  const bank: string = user.isbroker ? personality : user.firm;
  let status: OrderStatus = OrderStatus.None;
  if (topOrder === undefined)
    return status;
  const ownOrder: Order | undefined = depth.find(({ user: email, type }: Order) =>
    email === user.email && topOrder.type === type,
  );
  const aggregatedSize: number | null = getAggregatedSize(topOrder, depth);
  // Get depth related status
  if (tableType === PodTableType.Pod)
    status |= depth.length > 1 ? OrderStatus.HasDepth : OrderStatus.None;
  status |= (!!ownOrder && ownOrder.orderId !== topOrder.orderId) ? OrderStatus.HasMyOrder : OrderStatus.None;
  status |= (topOrder.user === user.email) ? OrderStatus.Owned : OrderStatus.None;
  // If it's the same firm the order belongs to the same bank
  if ((status & OrderStatus.Owned) === 0)
    status |= topOrder.firm === bank ? OrderStatus.SameBank : OrderStatus.None;
  if ((status & OrderStatus.SameBank) !== 0 && user.isbroker)
    status |= OrderStatus.OwnedByBroker;
  // If the size of the order doesn't match the aggregated size, it's a joined order
  status |= topOrder.size !== aggregatedSize ? OrderStatus.Joined : OrderStatus.None;
  // If the size is not present it's a cancelled order by convention
  status |= topOrder.size === null ? OrderStatus.Cancelled : OrderStatus.None;
  // If the user is a broker, the order is only owned if it also belongs to the same firm
  status &= (user.isbroker && topOrder.firm !== personality) ? ~OrderStatus.Owned : ~OrderStatus.None;
  status |= tableType === PodTableType.Dob ? OrderStatus.InDepth : OrderStatus.None;
  // We finally have the definitive status
  return status;
};
