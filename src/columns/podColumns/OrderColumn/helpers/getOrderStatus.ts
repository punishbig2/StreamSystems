import { getAggregatedSize } from "columns/podColumns/OrderColumn/helpers/getAggregatedSize";
import { PodTableType } from "columns/podColumns/OrderColumn/index";
import workareaStore from "mobx/stores/workareaStore";
import { Order, OrderStatus } from "types/order";
import { Role } from "types/role";
import { User } from "types/user";

export const getOrderStatus = (
  topOrder: Order | undefined,
  depth: Order[],
  tableType: PodTableType
) => {
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  const { roles } = user;
  const isBroker: boolean = roles.includes(Role.Broker);
  const bank: string = isBroker ? personality : user.firm;
  let status: OrderStatus = OrderStatus.None;
  if (topOrder === undefined) return status;
  // FIXME: not sure why this is
  const ownOrder: Order | undefined = depth.find(({ orderId }: Order) => {
    return topOrder.orderId === orderId;
  });
  const aggregatedSize: number | null = getAggregatedSize(topOrder, depth);
  // Get depth related status
  if (tableType === PodTableType.Pod)
    status |= depth.length > 1 ? OrderStatus.HasDepth : OrderStatus.None;
  status |=
    !!ownOrder && ownOrder.orderId !== topOrder.orderId
      ? OrderStatus.HasMyOrder
      : OrderStatus.None;
  status |= topOrder === ownOrder ? OrderStatus.Owned : OrderStatus.None;
  // If it's the same firm the order belongs to the same bank
  if ((status & OrderStatus.Owned) === 0)
    status |= topOrder.firm === bank ? OrderStatus.SameBank : OrderStatus.None;
  if ((status & OrderStatus.SameBank) !== 0 && isBroker)
    status |= OrderStatus.OwnedByBroker;
  // If the size of the order doesn't match the aggregated size, it's a joined order
  status |=
    topOrder.size !== aggregatedSize ? OrderStatus.Joined : OrderStatus.None;
  // If the size is not present it's a cancelled order by convention
  status |= topOrder.size === null ? OrderStatus.Cancelled : OrderStatus.None;
  // If the user is a broker, the order is only owned if it also belongs to the same firm
  status &=
    isBroker && topOrder.firm !== personality
      ? ~OrderStatus.Owned
      : ~OrderStatus.None;
  status |=
    tableType === PodTableType.Dob ? OrderStatus.InDepth : OrderStatus.None;
  if (ownOrder) {
    status |= topOrder === ownOrder ? OrderStatus.AtTop : OrderStatus.None;
  }
  // We finally have the definitive status
  return status;
};
