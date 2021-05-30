import { TableColumn } from "components/Table/tableColumn";
import { PodRowProps } from "columns/podColumns/common";
import React, { ReactElement } from "react";
import { OrderStatus, Order } from "types/order";
import { getRelevantOrders } from "columns/podColumns/OrderColumn/helpers/getRelevantOrders";
import { OrderTypes } from "types/mdEntry";

export const FirmColumn = (type: OrderTypes): TableColumn => ({
  name: `${type}-firm`,
  header: () => <div>&nbsp;</div>,
  render: (row: PodRowProps): ReactElement | null => {
    const orders: Order[] = getRelevantOrders(row.orders, type);
    // It should never happen that this is {} as Order
    const order: Order =
      orders.length > 0 ? orders[0] : ({ price: null, size: null } as Order);
    if (!order) return null;
    const { firm, status } = order;
    if ((status & OrderStatus.Cancelled) !== 0) return null;
    return <div className={"firm"}>{firm}</div>;
  },
  template: " BANK ",
  width: 4,
});
