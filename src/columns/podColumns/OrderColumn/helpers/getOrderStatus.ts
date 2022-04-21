import { getAggregatedSize } from "columns/podColumns/OrderColumn/helpers/getAggregatedSize";
import { PodTableType } from "columns/podColumns/OrderColumn/index";
import workareaStore from "mobx/stores/workareaStore";
import { Order, OrderStatus } from "types/order";
import { hasRole, Role } from "types/role";
import { User } from "types/user";

export const getOrderStatus = (
  target: Order | undefined,
  depth: ReadonlyArray<Order>,
  tableType: PodTableType
) => {
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  const { roles } = user;
  const isBroker: boolean = hasRole(roles, Role.Broker);
  const bank: string = isBroker ? personality : user.firm;
  let status: OrderStatus = OrderStatus.None;
  if (target === undefined) return status;
  // FIXME: not sure why this is
  const ownOrder: Order | undefined = depth.find(
    (order: Order) => order.user === user.email
  );
  const aggregatedSize: number | null = getAggregatedSize(target, depth);
  // Get depth related status
  if (tableType === PodTableType.Pod)
    status |= depth.length > 1 ? OrderStatus.HasDepth : OrderStatus.None;
  status |=
    !!ownOrder && ownOrder.orderId !== target.orderId
      ? OrderStatus.HasMyOrder
      : OrderStatus.None;
  status |=
    target === ownOrder || (target.status & OrderStatus.Owned) !== 0
      ? OrderStatus.Owned
      : OrderStatus.None;
  // If it's the same firm the order belongs to the same bank
  if ((status & OrderStatus.Owned) === 0)
    status |= target.firm === bank ? OrderStatus.SameBank : OrderStatus.None;
  if ((status & OrderStatus.SameBank) !== 0 && isBroker)
    status |= OrderStatus.OwnedByBroker;
  // If the size of the order doesn't match the aggregated size, it's a joined order
  status |=
    target.size !== aggregatedSize ? OrderStatus.Joined : OrderStatus.None;
  // If the size is not present it's a cancelled order by convention
  status |= target.size === null ? OrderStatus.Cancelled : OrderStatus.None;
  // If the user is a broker, the order is only owned if it also belongs to the same firm
  status &=
    isBroker && target.firm !== personality
      ? ~OrderStatus.Owned
      : ~OrderStatus.None;
  status |=
    tableType === PodTableType.Dob ? OrderStatus.InDepth : OrderStatus.None;
  if (ownOrder) {
    status |= target === ownOrder ? OrderStatus.AtTop : OrderStatus.None;
  }
  // We finally have the definitive status
  return status;
};
